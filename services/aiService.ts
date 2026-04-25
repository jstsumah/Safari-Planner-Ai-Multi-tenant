
import { SafariFormData, GeneratedItinerary, Lodge, BrandingConfig } from '../types';
import { supabase } from '../lib/supabase';
import { GoogleGenAI, Type } from "@google/genai";

/**
 * Deterministic Costing Logic
 * Calculates the exact cost for a given lodge, unit category, and date.
 */
function calculateNightlyCost(lodge: Lodge, unitCategoryId: string, dateStr: string, party: { adults: number, youngAdults: number, children: number }) {
  if (!lodge || !unitCategoryId) return 0;
  
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const currentVal = month * 100 + day;

  // 1. Find the applicable season
  const season = (lodge.seasons || []).find(s => {
    const startVal = s.startMonth * 100 + s.startDay;
    const endVal = s.endMonth * 100 + s.endDay;
    
    if (startVal <= endVal) {
      return currentVal >= startVal && currentVal <= endVal;
    } else {
      // Season wraps around the year (e.g., Dec 15 to Jan 15)
      return currentVal >= startVal || currentVal <= endVal;
    }
  });

  if (!season) return 0;

  // 2. Find the unit category
  const unit = (lodge.unit_categories || []).find(u => u.id === unitCategoryId);
  if (!unit) return 0;

  // 3. Find the rates for this season
  const rates = (unit.seasonal_rates || []).find(r => r.seasonId === season.id);
  // Optional chaining fallback for partial data
  if (!rates) return (unit.price_per_night || lodge.price_per_night || 0) * (party.adults + party.youngAdults + party.children);

  // 4. Calculate total
  return (party.adults * (rates.adultPrice || 0)) + 
         (party.youngAdults * (rates.youngAdultPrice || 0)) + 
         (party.children * (rates.childPrice || 0));
}

export const generateSafariItinerary = async (formData: SafariFormData, companyId?: string): Promise<GeneratedItinerary> => {
  let lodges: Lodge[] = [];
  try {
    let query = supabase.from('lodges').select('*');
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    const { data, error } = await query;
    if (!error && data) lodges = data as unknown as Lodge[];
  } catch (err) {
    console.warn("Supabase fetch error (continuing without custom lodges):", err);
  }

  try {
    // 1. Get Agency Config for Fees
    const { data: configData } = await supabase
      .from('agency_config')
      .select('config')
      .single();
    
    const branding = configData?.config as BrandingConfig || {};

    // 2. Initialize Gemini
    const apiKey = process.env.GEMINI_API_KEY || (process.env as any).API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");
    
    const ai = new GoogleGenAI({ apiKey });

    let preferredPropertiesInstruction = "";
    if (lodges && lodges.length > 0) {
      preferredPropertiesInstruction = `
        USER-DEFINED PREFERRED PROPERTIES (Highest Priority):
        You MUST prioritize using these properties from the provided list.
        
        PROPERTY DATA (IDs are critical for internal matching):
        ${lodges.map(l => {
          const unitText = (l.unit_categories || []).map(u => 
            `- ${u.name} (ID: ${u.id}, Max Occupancy: ${u.max_occupancy} guests)`
          ).join('\n        ');

          return `- ${l.name} (ID: ${l.id}) in ${l.location}:
          AVAILABLE UNITS:
          ${unitText}`;
        }).join('\n')}
      `;
    }

    const itinerarySchema = {
      type: Type.OBJECT,
      properties: {
        tripTitle: { type: Type.STRING },
        summary: { type: Type.STRING },
        highlights: { type: Type.ARRAY, items: { type: Type.STRING } },
        schedule: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              day: { type: Type.INTEGER },
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              morningActivity: { type: Type.STRING },
              afternoonActivity: { type: Type.STRING },
              accommodation: { type: Type.STRING },
              accommodationId: { type: Type.STRING, description: "The ID of the lodge from the provided list, if matched." },
              unitCategoryId: { type: Type.STRING, description: "The ID of the unit category from the provided list, if matched." },
              driveTime: { type: Type.STRING },
              meals: { type: Type.STRING }
            },
            required: ["day", "title", "description", "morningActivity", "afternoonActivity", "accommodation", "driveTime", "meals"]
          }
        }
      },
      required: ["tripTitle", "summary", "schedule", "highlights"]
    };

    const systemInstruction = `
      You are an expert Senior Safari Consultant.
      
      ACCOMMODATION RULES:
      1. USER-DEFINED PROPERTIES: Absolute priority. Match the location and select the BEST ROOM CATEGORY from the provided list based on the guest count.
      2. PARTY SIZE: The guest count is ${formData.adults} Adults, ${formData.youngAdults} Young Adults (12-17), and ${formData.children} Children.
      3. OUTPUT IDs: When you select a lodge from the provided list, you MUST include its 'accommodationId' and the 'unitCategoryId' (from its units list) in the JSON response exactly.
      
      ${preferredPropertiesInstruction}

      Logistics: Realistic drive times, professional tone. Focus on the adventure flow.
    `;

    const userPrompt = `
      Plan a ${formData.durationDays}-day safari for ${formData.name}.
      Guests: ${formData.adults} Adults, ${formData.youngAdults} Young Adults, ${formData.children} Children.
      Travel Date: ${formData.startDate}.
      Route: ${formData.destinations.join(", ")}${formData.customDestinations ? `, ${formData.customDestinations}` : ''}.
      Budget Preference: ${formData.budget}. Transport: ${formData.transport}.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: itinerarySchema,
      }
    });

    if (!response.text) {
      throw new Error("Empty response from AI engine.");
    }

    const itinerary = JSON.parse(response.text.trim()) as GeneratedItinerary;

    // --- DETERMINISTIC COSTING CALCULATION ---
    let subtotal = 0;
    const startDate = new Date(formData.startDate);
    const totalGuests = (formData.adults || 0) + (formData.youngAdults || 0) + (formData.children || 0);
    const party = {
      adults: formData.adults || 0,
      youngAdults: formData.youngAdults || 0,
      children: formData.children || 0
    };

    itinerary.schedule.forEach((dayPlan: any, index: number) => {
      // 1. Lodge Costs
      if (dayPlan.accommodationId && dayPlan.unitCategoryId) {
        const lodge = lodges.find(l => l.id === dayPlan.accommodationId);
        if (lodge) {
          const currentDate = new Date(startDate);
          currentDate.setDate(startDate.getDate() + index);
          
          const nightlyCost = calculateNightlyCost(
            lodge, 
            dayPlan.unitCategoryId, 
            currentDate.toISOString(), 
            party
          );
          subtotal += nightlyCost;
        }
      }

      // 2. Park Fees (Based on keywords in summary/description)
      if (branding.parkFees) {
        branding.parkFees.forEach(fee => {
          const combinedText = (dayPlan.title + dayPlan.description).toLowerCase();
          if (fee.keywords.some(k => combinedText.includes(k.toLowerCase()))) {
            subtotal += (fee.rate * totalGuests);
          }
        });
      }
    });

    // 3. Transport Costs
    if (branding.transportRates) {
      const transportRate = branding.transportRates.find(r => r.type === formData.transport);
      if (transportRate) {
        subtotal += (transportRate.dailyRate * formData.durationDays);
      }
    }

    // 4. Markup and Tax
    const markup = branding.defaultMarkup || 0;
    const tax = branding.defaultTax || 0;
    
    const markupAmount = subtotal * (markup / 100);
    const taxAmount = (subtotal + markupAmount) * (tax / 100);
    const finalTotal = subtotal + markupAmount + taxAmount;

    itinerary.totalEstimatedCost = finalTotal > 0 ? finalTotal.toLocaleString() : "Contact for Pricing";
    
    if (companyId) {
      itinerary.company_id = companyId;
    }
    
    return itinerary;
  } catch (error: any) {
    console.error("Itinerary Generation Error:", error);
    throw error;
  }
};

export const saveItineraryToDatabase = async (itinerary: GeneratedItinerary, formData: SafariFormData, companyId?: string): Promise<string | null> => {
  const cleanEmail = (formData.email || '').toLowerCase().trim();
  if (!cleanEmail) return null;

  try {
    const payload: any = {
      customer_name: formData.name || 'Valued Guest',
      customer_email: cleanEmail,
      trip_title: itinerary.tripTitle,
      form_data: formData,
      itinerary_data: itinerary
    };

    if (companyId) {
      payload.company_id = companyId;
    } else if (itinerary.company_id) {
      payload.company_id = itinerary.company_id;
    }

    const { data, error } = await supabase.from('itineraries').insert([payload]).select('id').single();

    if (error) {
      console.warn("Database persistence failed (Lead Capture):", error.message);
      return null;
    }
    return data?.id || null;
  } catch (err: any) {
    console.warn("Silent failure during lead capture:", err.message);
    return null;
  }
};
