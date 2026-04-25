
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  GeneratedItinerary, SafariFormData, Lodge, CostingReport, CostingLineItem, 
  CostingItemType, Season 
} from '../types';
import { toast } from 'sonner';
import { 
  DollarSign, Plus, Trash2, Calculator, RefreshCw, 
  Info, Check, ArrowLeft, Download, Tag, Percent, Lock, Unlock,
  Users, BedDouble, Truck, CalendarClock, Ticket, Sparkles, UploadCloud, FileText,
  Loader2, Wand2
} from 'lucide-react';

interface CostingModuleProps {
  itinerary: GeneratedItinerary;
  formData: SafariFormData;
  lodges: Lodge[];
  branding: BrandingConfig;
  onBack: () => void;
  onSave?: (report: CostingReport, closeAfter?: boolean) => void;
  initialMode?: 'project' | 'calculator';
  backLabel?: string;
  customRates?: LodgeCustomRate[];
}

// Admin Defined Park Fees (Defaults)
const KNOWN_PARKS = [
  { name: 'Masai Mara', keywords: ['Mara', 'Maasai Mara'], rate: 200 },
  { name: 'Serengeti', keywords: ['Serengeti'], rate: 83 },
  { name: 'Ngorongoro', keywords: ['Ngorongoro'], rate: 71 },
  { name: 'Amboseli', keywords: ['Amboseli'], rate: 100 },
  { name: 'Lake Nakuru', keywords: ['Nakuru'], rate: 100 },
  { name: 'Tarangire', keywords: ['Tarangire'], rate: 59 },
  { name: 'Samburu', keywords: ['Samburu'], rate: 70 },
  { name: 'Tsavo', keywords: ['Tsavo'], rate: 52 },
  { name: 'Ol Pejeta', keywords: ['Ol Pejeta', 'Sweetwaters'], rate: 90 },
  { name: 'Nairobi National Park', keywords: ['Nairobi National Park'], rate: 43 },
  { name: 'Bwindi', keywords: ['Bwindi'], rate: 40 },
  { name: 'Volcanoes', keywords: ['Volcanoes'], rate: 1050 }
];

const CostingModule: React.FC<CostingModuleProps> = ({ 
  itinerary, 
  formData, 
  lodges, 
  branding = {} as BrandingConfig,
  onBack, 
  onSave,
  initialMode = 'project',
  backLabel = 'Back',
  customRates = []
}) => {
  // --- View Mode State ---
  const [activeMode, setActiveMode] = useState<'project' | 'calculator'>(initialMode);

  // --- Data State ---
  const [projectItems, setProjectItems] = useState<CostingLineItem[]>([]);
  const [calculatorItems, setCalculatorItems] = useState<CostingLineItem[]>([]);

  // Derived state to determine which list is currently active
  const items = activeMode === 'project' ? projectItems : calculatorItems;
  const setItems = activeMode === 'project' ? setProjectItems : setCalculatorItems;

  const [markup, setMarkup] = useState(branding?.defaultMarkup ?? 20);
  const [tax, setTax] = useState(branding?.defaultTax ?? 16);
  const [isAutoCalculating, setIsAutoCalculating] = useState(true);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  
  // Base Adjustments State
  const [srsSettings, setSrsSettings] = useState({ amount: 0, count: 1 });
  
  // Transport Settings State
  const [transportSettings, setTransportSettings] = useState(() => {
    const transportType = formData.transport || 'Land Cruiser';
    const rateObj = branding?.transportRates?.find(r => r.type === transportType);
    return { 
      dailyRate: rateObj?.dailyRate ?? (transportType === 'Overland Truck' ? 500 : 250), 
      vehicleCount: 1 
    };
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper: Check if a date falls within a season
  const isDateInSeason = (date: Date, season: Season): boolean => {
    if (!season) return false;
    const month = date.getMonth() + 1;
    const day = date.getDate();

    const start = season.startMonth * 100 + season.startDay;
    const end = season.endMonth * 100 + season.endDay;
    const current = month * 100 + day;

    if (start <= end) {
      return current >= start && current <= end;
    } else {
      return current >= start || current <= end;
    }
  };

  // --- AI SCANNER LOGIC ---
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    try {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
      
      if (!apiKey) {
        throw new Error("Gemini API Key is not configured. AI scanning requires an API key.");
      }

      const ai = new GoogleGenAI({ apiKey });
      const modelId = 'gemini-3-flash-preview';

      const prompt = `
        You are an expert safari operations assistant. 
        Analyze the attached document (itinerary, quote, or invoice) and extract a comprehensive breakdown for a costing table.
        
        REQUIRED ACTIONS:
        1. Identify the total number of travelers (Pax).
        2. Extract a Day-by-Day itinerary list if present (Accommodation, Activities).
        3. Identify all Accommodations mentioned (Lodges/Camps).
        4. Identify all Activities (Game drives, boat cruises, cultural tours).
        5. Identify Includes and Excludes.
        6. Identify specific Fees (Park fees, vehicle hire, flights).

        FORMATTING RULES:
        - Return a JSON object with two keys: "pax" (number) and "items" (array).
        - Each item in "items" must have:
          - "type": "Accommodation" | "Activity" | "Transport" | "Fee" | "Extra"
          - "description": String. Include the Day number or location if possible (e.g., "Day 1: Arrival & Transfer", "Day 2: Morning Game Drive in Serengeti").
          - "quantity": Number (use Pax count for per-person items).
          - "unitPrice": Number (cost per person or per unit).
          - "total": Number (quantity * unitPrice).

        If a price is missing for an item but it's listed as "Included" or in a "Day description", add it with unitPrice: 0 and mention "Included" in the description.
        Break down the itinerary as much as possible to ensure transparency.
      `;

      const response = await ai.models.generateContent({
        model: modelId,
        contents: {
          parts: [
            { text: prompt },
            { inlineData: { mimeType: file.type, data: base64Data } }
          ]
        },
        config: {
          responseMimeType: "application/json"
        }
      });

      const text = response.text;
      if (!text) throw new Error("Empty AI response");
      
      const result = JSON.parse(text);
      
      const extractedItems = Array.isArray(result) ? result : (result.items || []);
      const foundPax = result.pax || (formData.adults + formData.youngAdults + formData.children) || 1;

      const newItems: CostingLineItem[] = extractedItems.map((item: any) => ({
        id: crypto.randomUUID(),
        type: item.type || 'Extra',
        description: item.description || 'Imported Item',
        quantity: item.quantity || foundPax,
        unitPrice: item.unitPrice || 0,
        total: (item.quantity || foundPax) * (item.unitPrice || 0),
        isManual: true
      }));

      if (activeMode === 'project') {
         setActiveMode('calculator');
         setCalculatorItems(prev => [...prev, ...newItems]);
      } else {
         setCalculatorItems(prev => [...prev, ...newItems]);
      }

    } catch (err) {
      console.error("AI Scan failed:", err);
      toast.error("Could not scan document. Please try a clear PDF or Image.");
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };


  // --- INITIAL EXTRACTION ---
  const initialExtractionDone = useRef(false);
  useEffect(() => {
    if (!isAutoCalculating || !itinerary || !itinerary.schedule || initialExtractionDone.current) return;

    const newItems: CostingLineItem[] = [];
    // ... rest of logic remains same but we set ref at the end
    // I'll re-include the logic to be safe for surgical edit
    const startDate = formData.startDate ? new Date(formData.startDate) : new Date();
    const totalPax = (formData.adults || 0) + (formData.youngAdults || 0) + (formData.children || 0);

    itinerary.schedule.forEach((day, index) => {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + index);

      const accommodationName = day.accommodation || '';
      const matchedLodge = lodges.find(l => {
        const lodgeName = l.name || '';
        return accommodationName.toLowerCase().includes(lodgeName.toLowerCase()) || 
               lodgeName.toLowerCase().includes(accommodationName.toLowerCase());
      });

      if (matchedLodge) {
        const seasons = matchedLodge.seasons || [];
        const season = seasons.find(s => isDateInSeason(currentDate, s)) || seasons[0];
        
        // Custom rate logic: check if this company has a custom rate for this lodge
        const customOverride = customRates.find(cr => cr.lodge_id === matchedLodge.id);
        const unitCategories = customOverride ? customOverride.unit_categories : (matchedLodge.unit_categories || []);
        const unit = unitCategories[0];
        
        if (unit && season) {
          const rates = unit.seasonal_rates || [];
          const rate = rates.find(r => r.seasonId === season.id);
          if (rate) {
            const dayPrice = (formData.adults * (rate.adultPrice || 0)) + 
                            (formData.youngAdults * (rate.youngAdultPrice || 0)) + 
                            (formData.children * (rate.childPrice || 0));
            
            newItems.push({
              id: crypto.randomUUID(),
              type: 'Accommodation',
              description: `${matchedLodge.name} (${unit.name}) - Day ${day.day}`,
              quantity: 1,
              unitPrice: dayPrice,
              total: dayPrice,
              dayRef: day.day
            });
          }
        }
      } else if (accommodationName) {
        newItems.push({
          id: crypto.randomUUID(),
          type: 'Accommodation',
          description: `${accommodationName} (Rate Placeholder) - Day ${day.day}`,
          quantity: 1,
          unitPrice: 0,
          total: 0,
          dayRef: day.day
        });
      }

      const dayContext = `${day.title} ${day.description} ${day.accommodation}`.toLowerCase();
      const parks = branding?.parkFees || KNOWN_PARKS;
      const matchedPark = parks.find(park => 
        park.keywords.some(keyword => dayContext.includes(keyword.toLowerCase()))
      );

      if (matchedPark) {
        if (!dayContext.includes('airport transfer only') && !dayContext.includes('departure')) {
           newItems.push({
            id: crypto.randomUUID(),
            type: 'Fee',
            description: `Park Fee: ${matchedPark.name} - Day ${day.day}`,
            quantity: totalPax, 
            unitPrice: matchedPark.rate,
            total: totalPax * matchedPark.rate,
            dayRef: day.day
          });
        }
      }
    });

    initialExtractionDone.current = true;
    setProjectItems(newItems);
    setIsAutoCalculating(false);
  }, [itinerary, formData, lodges, customRates, isAutoCalculating, branding?.parkFees]);


  // --- AUTO ITEMS EFFECT (SRS + Transport) ---
  useEffect(() => {
    if (activeMode !== 'project') return;

    // Defer to avoid synchronous cascade warnings
    const timeoutId = setTimeout(() => {
      setProjectItems(prev => {
        const newItems = [...prev];
        const srsId = 'auto-srs-item';
        const transportId = 'auto-transport-item';

        const srsIndex = newItems.findIndex(i => i.id === srsId);
        if (srsSettings.amount > 0) {
          const srsItem: CostingLineItem = {
            id: srsId,
            type: 'Fee',
            description: `Single Room Supplement (${srsSettings.count} Room${srsSettings.count > 1 ? 's' : ''})`,
            quantity: srsSettings.count,
            unitPrice: srsSettings.amount,
            total: srsSettings.count * srsSettings.amount,
            isManual: true
          };
          if (srsIndex >= 0) {
            if (JSON.stringify(newItems[srsIndex]) !== JSON.stringify(srsItem)) {
              newItems[srsIndex] = srsItem;
            }
          } else {
            newItems.push(srsItem);
          }
        } else if (srsIndex >= 0) {
          newItems.splice(srsIndex, 1);
        }

        const totalPax = (formData.adults || 0) + (formData.youngAdults || 0) + (formData.children || 0) || 1;
        const days = formData.durationDays || 1;
        const totalVehicleCost = transportSettings.dailyRate * transportSettings.vehicleCount * days;
        const costPerPerson = totalVehicleCost / totalPax;

        const transportIndex = newItems.findIndex(i => i.id === transportId);
        const transportItem: CostingLineItem = {
          id: transportId,
          type: 'Transport',
          description: `Transport: ${transportSettings.vehicleCount}x ${formData.transport} (${days} Days) - Shared Cost`,
          quantity: totalPax,
          unitPrice: costPerPerson,
          total: totalVehicleCost,
          isManual: true
        };

        if (transportIndex >= 0) {
          if (JSON.stringify(newItems[transportIndex]) !== JSON.stringify(transportItem)) {
            newItems[transportIndex] = transportItem;
          }
        } else {
          newItems.push(transportItem);
        }

        if (JSON.stringify(newItems) !== JSON.stringify(prev)) {
          return newItems;
        }
        return prev;
      });
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [srsSettings, transportSettings, formData.adults, formData.youngAdults, formData.children, formData.durationDays, formData.transport, activeMode]);


  const totals = useMemo(() => {
    const subtotal = items.reduce((acc, item) => acc + (item.total || 0), 0);
    const markupAmount = (subtotal * markup) / 100;
    const beforeTax = subtotal + markupAmount;
    const taxAmount = (beforeTax * tax) / 100;
    const total = beforeTax + taxAmount;
    return { subtotal, markupAmount, taxAmount, total };
  }, [items, markup, tax]);

  const updateItem = (id: string, field: keyof CostingLineItem, value: any) => {
    setIsConfirmed(false);
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };
      if (field === 'quantity' || field === 'unitPrice') {
        updated.total = (updated.quantity || 0) * (updated.unitPrice || 0);
      }
      return updated;
    }));
  };

  const addItem = (type: CostingItemType) => {
    setIsConfirmed(false);
    const newItem: CostingLineItem = {
      id: crypto.randomUUID(),
      type,
      description: type === 'Fee' ? 'Park / Conservancy Fee' : `New ${type} Item`,
      quantity: 1,
      unitPrice: 0,
      total: 0
    };
    setItems(prev => [...prev, newItem]);
  };

  const deleteItem = (id: string) => {
    setIsConfirmed(false);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const handleConfirmQuote = () => {
    setIsConfirmed(true);
    if (activeMode === 'project') {
      onSave?.({ 
        id: crypto.randomUUID(), 
        items, 
        markupPercentage: markup, 
        taxPercentage: tax, 
        ...totals 
      }, false);
    }
  };

  const handleFinalSave = () => {
    if (activeMode === 'project') {
      onSave?.({ 
        id: crypto.randomUUID(), 
        items, 
        markupPercentage: markup, 
        taxPercentage: tax, 
        ...totals 
      }, true);
    }
  };

  const handleDownloadXLS = () => {
    const title = activeMode === 'project' ? (itinerary?.tripTitle || 'Safari Costing') : 'Quick Costing Estimate';
    const filename = `${title.replace(/[^a-z0-9]/gi, '_')}.csv`;
    
    const headers = ['Category', 'Description', 'Quantity', 'Unit Cost', 'Total'];
    const rows = items.map(item => [
      item.type,
      `"${item.description.replace(/"/g, '""')}"`,
      item.quantity,
      item.unitPrice.toFixed(2),
      item.total.toFixed(2)
    ]);

    rows.push([]);
    rows.push(['', '', '', 'Subtotal', totals.subtotal.toFixed(2)]);
    rows.push(['', '', '', `Markup (${markup}%)`, totals.markupAmount.toFixed(2)]);
    rows.push(['', '', '', `Tax (${tax}%)`, totals.taxAmount.toFixed(2)]);
    rows.push(['', '', '', 'TOTAL', totals.total.toFixed(2)]);

    const csvContent = [
      [`Costing Report: ${title}`],
      [`Generated: ${new Date().toLocaleDateString()}`],
      [],
      headers,
      ...rows
    ].map(e => e.join(",")).join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalPax = (formData.adults || 0) + (formData.youngAdults || 0) + (formData.children || 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn pb-20">
      
      {/* Mode Switcher Tabs */}
      {initialMode === 'project' && (
        <div className="flex justify-center mb-4">
          <div className="bg-white p-1 rounded-xl shadow-sm border border-safari-100 flex gap-1">
            <button 
              onClick={() => setActiveMode('project')}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                activeMode === 'project' 
                ? 'bg-safari-800 text-white shadow-md' 
                : 'text-safari-500 hover:bg-safari-50'
              }`}
            >
              <FileText size={16} /> Project Costing
            </button>
            <button 
              onClick={() => setActiveMode('calculator')}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                activeMode === 'calculator' 
                ? 'bg-safari-600 text-white shadow-md' 
                : 'text-safari-500 hover:bg-safari-50'
              }`}
            >
              <Calculator size={16} /> Quick Calculator
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-8 rounded-lg shadow-sm border border-safari-100">
        <div>
          {initialMode === 'project' && (
            <button onClick={onBack} className="flex items-center gap-2 text-safari-400 hover:text-safari-600 font-bold text-sm uppercase tracking-widest mb-2 transition-colors">
              <ArrowLeft size={14} /> {backLabel}
            </button>
          )}
          <h1 className="text-3xl font-black text-safari-900 flex items-center gap-3">
            {activeMode === 'project' ? (
              <><Tag className="text-safari-500" /> Itinerary Costing</>
            ) : (
              <><Wand2 className="text-safari-500" /> Quick Costing Tool</>
            )}
          </h1>
          <p className="text-safari-500 font-medium text-sm">
            {activeMode === 'project' 
              ? `Financial planning for: ${itinerary?.tripTitle || 'Lead'}`
              : 'AI-powered standalone calculator. Upload documents or enter manually.'
            }
          </p>
        </div>
        
        {/* Main Action Group */}
        <div className="flex gap-3">
          {activeMode === 'project' && (
            <>
              <button 
                onClick={() => {
                  setIsAutoCalculating(true);
                  setIsConfirmed(false);
                  setSrsSettings({ amount: 0, count: 1 });
                  setTransportSettings({ dailyRate: 250, vehicleCount: 1 });
                }}
                className="px-5 py-2.5 bg-safari-50 text-safari-700 rounded-lg font-bold hover:bg-safari-100 flex items-center gap-2 transition-all border border-safari-200 w-auto"
              >
                <RefreshCw size={18} className={isAutoCalculating ? 'animate-spin' : ''} /> Sync
              </button>
              <button 
                onClick={handleFinalSave}
                disabled={!isConfirmed}
                className={`px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95 w-auto ${
                  isConfirmed
                  ? 'bg-safari-800 text-white hover:bg-safari-900' 
                  : 'bg-safari-100 text-safari-400 cursor-not-allowed shadow-none'
                }`}
              >
                {isConfirmed ? <Unlock size={18} /> : <Lock size={18} />}
                Save & Exit
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Costing Table */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* AI Scanner Dropzone */}
          {activeMode === 'calculator' && (
            <div className="bg-gradient-to-br from-safari-50 to-white border-2 border-dashed border-safari-200 rounded-xl p-8 text-center transition-all hover:border-safari-400 group">
               <input 
                 type="file" 
                 ref={fileInputRef} 
                 onChange={handleFileUpload} 
                 accept=".pdf,image/*,.csv" 
                 className="hidden" 
               />
               <div className="flex flex-col items-center justify-center gap-4">
                 <div className="w-16 h-16 bg-white rounded-full shadow-md flex items-center justify-center group-hover:scale-110 transition-transform">
                   {isScanning ? <Loader2 className="animate-spin text-safari-600" size={32} /> : <Sparkles className="text-safari-600" size={32} />}
                 </div>
                 <div>
                   <h3 className="text-lg font-black text-safari-900">AI Smart Import</h3>
                   <p className="text-safari-500 text-sm max-w-md mx-auto mt-1">
                     Upload a supplier invoice, rate sheet, or itinerary PDF. 
                     Our AI will extract line items and costs automatically.
                   </p>
                 </div>
                 <button 
                   disabled={isScanning}
                   onClick={() => fileInputRef.current?.click()}
                   className="bg-safari-800 text-white px-6 py-2 rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-safari-900 transition-colors flex items-center gap-2"
                 >
                   <UploadCloud size={16} /> {isScanning ? 'Scanning Document...' : 'Select File'}
                 </button>
               </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm border border-safari-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-safari-50 border-b border-safari-100">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-safari-400">Category</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-safari-400">Description</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-safari-400 w-24">Qty (Pax)</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-safari-400 w-32">Unit Cost ($)</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-safari-400 w-32">Total ($)</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-safari-400 w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-safari-50">
                  {items.map(item => (
                    <tr key={item.id} className="hover:bg-safari-50/30 transition-colors group">
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${
                          item.type === 'Accommodation' ? 'bg-blue-50 text-blue-600' :
                          item.type === 'Transport' ? 'bg-orange-50 text-orange-600' :
                          item.type === 'Activity' ? 'bg-green-50 text-green-600' : 
                          item.type === 'Fee' ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {item.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <textarea 
                          rows={1}
                          value={item.description}
                          onChange={(e) => {
                            updateItem(item.id, 'description', e.target.value);
                            // Auto-resize
                            e.target.style.height = 'auto';
                            e.target.style.height = (e.target.scrollHeight + 2) + 'px';
                          }}
                          onFocus={(e) => {
                            e.target.style.height = 'auto';
                            e.target.style.height = (e.target.scrollHeight + 2) + 'px';
                          }}
                          ref={(el) => {
                            if (el) {
                              el.style.height = 'auto';
                              el.style.height = (el.scrollHeight + 2) + 'px';
                            }
                          }}
                          className="w-full bg-white/50 border border-transparent focus:border-safari-300 focus:bg-white outline-none text-sm font-bold text-safari-800 p-3 rounded transition-all resize-none overflow-hidden min-h-[44px] block leading-relaxed"
                          disabled={activeMode === 'project' && (item.id === 'auto-srs-item' || item.id === 'auto-transport-item')}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input 
                          type="number" 
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-16 bg-white border border-safari-200 rounded p-1.5 text-xs font-black text-center outline-none focus:ring-1 focus:ring-safari-500"
                          disabled={activeMode === 'project' && (item.id === 'auto-srs-item' || item.id === 'auto-transport-item')}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="relative">
                          <DollarSign className="absolute left-1.5 top-1/2 -translate-y-1/2 text-safari-300" size={12} />
                          <input 
                            type="number" 
                            value={item.unitPrice}
                            onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="w-full pl-5 pr-2 py-1.5 bg-white border border-safari-200 rounded text-xs font-black outline-none focus:ring-1 focus:ring-safari-500"
                            disabled={activeMode === 'project' && (item.id === 'auto-srs-item' || item.id === 'auto-transport-item')}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-black text-safari-900">${(item.total || 0).toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4">
                        {(activeMode === 'calculator' || (item.id !== 'auto-srs-item' && item.id !== 'auto-transport-item')) && (
                          <button onClick={() => deleteItem(item.id)} className="p-2 text-safari-200 hover:text-red-500 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-20 text-center">
                        <Calculator size={48} className="mx-auto mb-4 text-safari-100" />
                        <p className="text-safari-400 font-bold uppercase tracking-widest text-xs">No items. Add manual cost or scan file.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-safari-50 border-t border-safari-100 flex flex-wrap gap-2">
              <button onClick={() => addItem('Accommodation')} className="px-4 py-2 bg-white border border-safari-200 rounded-lg text-xs font-bold text-safari-700 hover:bg-safari-100 transition-all flex items-center gap-2 w-auto">
                <Plus size={14} /> Accommodation
              </button>
              <button onClick={() => addItem('Activity')} className="px-4 py-2 bg-white border border-safari-200 rounded-lg text-xs font-bold text-safari-700 hover:bg-safari-100 transition-all flex items-center gap-2 w-auto">
                <Plus size={14} /> Activity
              </button>
              <button onClick={() => addItem('Transport')} className="px-4 py-2 bg-white border border-safari-200 rounded-lg text-xs font-bold text-safari-700 hover:bg-safari-100 transition-all flex items-center gap-2 w-auto">
                <Plus size={14} /> Transport
              </button>
              <button onClick={() => addItem('Fee')} className="px-4 py-2 bg-white border border-safari-200 rounded-lg text-xs font-bold text-safari-700 hover:bg-safari-100 transition-all flex items-center gap-2 w-auto">
                <Ticket size={14} /> Park Fee
              </button>
              <button onClick={() => addItem('Extra')} className="px-4 py-2 bg-white border border-safari-200 rounded-lg text-xs font-bold text-safari-700 hover:bg-safari-100 transition-all flex items-center gap-2 w-auto">
                <Plus size={14} /> Extra/Other
              </button>
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-100 p-6 rounded-lg flex items-start gap-4">
            <Info className="text-orange-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-orange-900 text-sm">
                {activeMode === 'project' ? "Automated Calculation Status" : "Quick Calculator Mode"}
              </h4>
              <p className="text-orange-700 text-xs mt-1 leading-relaxed">
                {activeMode === 'project' 
                  ? `Accommodation Rates matched for ${formData.adults} Adults, ${formData.youngAdults} Teens, ${formData.children} Children. Park Fees have been automatically detected based on itinerary locations.`
                  : "Items here are independent of the generated itinerary. You can freely add, scan, or modify items to estimate costs for any trip."
                }
              </p>
            </div>
          </div>
        </div>

        {/* Financial Summary Sidebar */}
        <div className="space-y-6">
          <div className="bg-safari-900 rounded-lg p-8 text-white shadow-2xl relative overflow-hidden">
            <div className="relative z-10 space-y-8">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-safari-400 border-b border-white/10 pb-4 flex items-center gap-2">
                <Tag size={12} /> Financial Summary
              </h3>
              
              <div className="space-y-4">
                {activeMode === 'project' && (
                  <div className="space-y-3 pb-4 border-b border-white/10">
                    <div className="text-[10px] font-black uppercase text-safari-400">Base Adjustments</div>
                    
                    <div>
                      <label className="text-[9px] text-safari-500 block mb-1 flex items-center gap-1"><BedDouble size={9} /> Single Room Supplement</label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 text-white/40" size={10} />
                          <input 
                            type="number" 
                            placeholder="Amount"
                            className="w-full bg-white/20 border border-white/10 rounded px-2 pl-5 py-1.5 text-xs font-bold outline-none focus:border-safari-400 text-white placeholder:text-white/20"
                            value={srsSettings.amount || ''}
                            onChange={(e) => setSrsSettings(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                          />
                        </div>
                        <input 
                          type="number" 
                          placeholder="Qty"
                          className="w-12 bg-white/20 border border-white/10 rounded px-1 py-1.5 text-xs font-bold text-center outline-none focus:border-safari-400 text-white"
                          value={srsSettings.count}
                          onChange={(e) => setSrsSettings(prev => ({ ...prev, count: parseFloat(e.target.value) || 1 }))}
                        />
                      </div>
                    </div>

                    <div className="mt-3">
                      <label className="text-[9px] text-safari-500 block mb-1 flex items-center gap-1"><Truck size={9} /> Transport Configuration</label>
                      <div className="flex gap-2 mb-1">
                         <div className="relative flex-1">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] text-safari-400">Rate/Day</span>
                          <input 
                            type="number" 
                            className="w-full bg-white/20 border border-white/10 rounded px-2 pl-14 py-1.5 text-xs font-bold outline-none focus:border-safari-400 text-white"
                            value={transportSettings.dailyRate}
                            onChange={(e) => setTransportSettings(prev => ({ ...prev, dailyRate: parseFloat(e.target.value) || 0 }))}
                          />
                        </div>
                        <div className="relative w-16">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] text-safari-400">#</span>
                          <input 
                            type="number" 
                            className="w-full bg-white/20 border border-white/10 rounded px-1 pl-5 py-1.5 text-xs font-bold text-center outline-none focus:border-safari-400 text-white"
                            value={transportSettings.vehicleCount}
                            onChange={(e) => setTransportSettings(prev => ({ ...prev, vehicleCount: parseFloat(e.target.value) || 1 }))}
                          />
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-[9px] text-safari-400 px-1">
                         <span className="flex items-center gap-1"><Users size={8} /> {totalPax} Pax</span>
                         <span className="flex items-center gap-1"><CalendarClock size={8} /> {formData.durationDays} Days</span>
                         <span className="text-safari-300 font-bold">
                           ${Math.round((transportSettings.dailyRate * transportSettings.vehicleCount * (formData.durationDays || 1)) / (totalPax || 1)).toLocaleString()}/pp
                         </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-safari-300">Net Subtotal</span>
                  <span className="text-lg font-black">${totals.subtotal.toLocaleString()}</span>
                </div>

                <div className="space-y-2 pt-4 border-t border-white/10">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-black uppercase text-safari-400 flex items-center gap-1">
                      <Percent size={10} /> Markup
                    </span>
                    <div className="flex items-center gap-2 bg-white/20 rounded px-2 py-1">
                      <input 
                        type="number" 
                        value={markup} 
                        onChange={(e) => {
                          setMarkup(parseFloat(e.target.value) || 0);
                          setIsConfirmed(false);
                        }}
                        className="w-10 bg-transparent text-center text-xs font-bold outline-none text-white"
                      />
                      <span className="text-[10px]">%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-safari-500 italic">Agency Profit</span>
                    <span className="text-sm font-bold text-safari-300">+${totals.markupAmount.toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-white/10">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-black uppercase text-safari-400 flex items-center gap-1">
                      <DollarSign size={10} /> Taxes/VAT
                    </span>
                    <div className="flex items-center gap-2 bg-white/20 rounded px-2 py-1">
                      <input 
                        type="number" 
                        value={tax} 
                        onChange={(e) => {
                          setTax(parseFloat(e.target.value) || 0);
                          setIsConfirmed(false);
                        }}
                        className="w-10 bg-transparent text-center text-xs font-bold outline-none text-white"
                      />
                      <span className="text-[10px]">%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-safari-500 italic">Government Fees</span>
                    <span className="text-sm font-bold text-safari-300">+${totals.taxAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t-2 border-white/20">
                <span className="text-[10px] font-black uppercase text-safari-400 block mb-1">Final Itinerary Price</span>
                <div className="text-4xl font-black text-safari-400">
                  ${Math.round(totals.total).toLocaleString()}
                </div>
                <p className="text-[10px] text-safari-500 mt-2 italic">* Rounded to nearest dollar for client presentation.</p>
              </div>

              <button 
                onClick={handleConfirmQuote}
                className={`w-full py-4 rounded-lg font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 ${
                  isConfirmed 
                  ? 'bg-green-600 text-white hover:bg-green-700' 
                  : 'bg-safari-600 text-white hover:bg-safari-500'
                }`}
              >
                {activeMode === 'project' ? (isConfirmed ? <><Check size={16} /> Quote Confirmed</> : 'Confirm Quote') : 'Recalculate Totals'}
              </button>
              {isConfirmed && activeMode === 'project' && (
                <p className="text-[10px] text-green-400 text-center animate-fadeIn font-bold uppercase tracking-wider">
                  Calculations Finalized • Ready to Save
                </p>
              )}
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-safari-700/30 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          </div>

          <div className="bg-white rounded-lg p-6 border border-safari-100 shadow-sm space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-safari-400 mb-2">Export Tools</h4>
            <button onClick={handleDownloadXLS} className="w-full py-3 bg-white border border-safari-200 rounded-lg text-xs font-bold text-safari-800 hover:bg-safari-50 transition-all flex items-center justify-center gap-2 shadow-sm">
              <Download size={14} /> Download XLS Sheet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CostingModule;
