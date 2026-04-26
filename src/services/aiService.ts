import { GoogleGenAI } from "@google/genai";
import { SafariFormData, GeneratedItinerary } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateSafariItinerary(data: SafariFormData): Promise<GeneratedItinerary> {
  const prompt = `
    You are an expert African Safari specialized travel agent. 
    Create a highly detailed and engaging safari itinerary for the following request:
    Name: ${data.name}
    Country of Interest: ${data.country}
    Duration: ${data.durationDays} days
    Budget Tier: ${data.budget}
    Adults: ${data.adults}, Young Adults: ${data.youngAdults}, Children: ${data.children}
    Activities: ${data.activities.join(", ")}
    Transport: ${data.transport}
    Pickup: ${data.pickupLocation}, Dropoff: ${data.dropoffLocation}
    Destinations: ${data.destinations.join(", ")} ${data.customDestinations}
    Dietary: ${data.dietaryRequirements}
    Special Occasions: ${data.specialOccasions}

    Return the itinerary in JSON format matching this structure:
    {
      "tripTitle": "Engaging title for the safari",
      "summary": "Brief inspiring summary of the trip",
      "totalEstimatedCost": "Estimated total cost range in USD, e.g. $2,500 - $3,200 pp",
      "highlights": ["3-5 major highlights"],
      "schedule": [
        {
          "day": 1,
          "title": "Day 1 Title",
          "description": "Engaging description of the day",
          "morningActivity": "What they do in the morning",
          "afternoonActivity": "What they do in the afternoon",
          "accommodation": "Suggested lodge name matching budget tier",
          "driveTime": "Estimated travel time & mode, e.g. 2 hr drive, 45 min flight, 3 hr scenic train",
          "meals": "Breakfast, Lunch, Dinner"
        }
      ],
      "includes": ["List of things included"],
      "excludes": ["List of things excluded"]
    }

    Respond ONLY with the JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });
    
    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    
    const itinerary = JSON.parse(text);
    return itinerary as GeneratedItinerary;
  } catch (error) {
    console.error("AI Generation error:", error);
    throw new Error("Unable to generate your safari at this moment. Please try again.", { cause: error });
  }
}

export async function saveItineraryToDatabase(itinerary: GeneratedItinerary, formData: SafariFormData, companyId?: string): Promise<string> {
  const { supabase } = await import('../lib/supabase');
  
  const { data, error } = await supabase
    .from('itineraries')
    .insert([{
      company_id: companyId,
      trip_title: itinerary.tripTitle,
      itinerary_data: itinerary,
      form_data: formData,
      customer_email: formData.email,
      customer_name: formData.name,
      status: 'quoted'
    }])
    .select()
    .single();

  if (error) throw error;
  return data.id;
}
