
import React, { useState, useRef } from 'react';
import { Lodge, PropertyType, BudgetTier, Season, UnitCategory, SeasonalRate } from '../types';
import { 
  X, Save, Plus, Trash2, Building, Info, 
  LayoutGrid, Loader2, Search, Check,
  CalendarDays, ArrowRight, RefreshCw, Image as ImageIcon,
  Sparkles, Footprints, ListChecks, UploadCloud
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface LodgeEditorProps {
  lodge?: Lodge | null;
  customRate?: LodgeCustomRate | null;
  companies?: any[];
  onClose: () => void;
  onSave: () => void;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June", 
  "July", "August", "September", "October", "November", "December"
];

const DEFAULT_LODGE: Partial<Lodge> = {
  name: '',
  location: '',
  tier: BudgetTier.MidRange,
  property_type: PropertyType.Lodge,
  description: '',
  facilities: [],
  amenities: [],
  activities: [],
  show_pricing: true,
  seasons: [
    { id: 'high', name: 'High Season', startMonth: 6, startDay: 1, endMonth: 10, endDay: 31 },
    { id: 'low', name: 'Low Season', startMonth: 11, startDay: 1, endMonth: 5, endDay: 31 }
  ],
  unit_categories: [
    { 
      id: 'standard', 
      name: 'Standard Suite', 
      total_units: 10, 
      max_occupancy: 2, 
      seasonal_rates: [
        { seasonId: 'high', adultPrice: 500, youngAdultPrice: 350, childPrice: 250 },
        { seasonId: 'low', adultPrice: 350, youngAdultPrice: 250, childPrice: 150 }
      ] 
    }
  ],
  images: []
};

const LodgeEditor: React.FC<LodgeEditorProps> = ({ lodge, customRate, companies = [], onClose, onSave }) => {
  const { company, profile } = useAuth();
  const isSuperUser = profile?.is_super_user;
  const isOwner = isSuperUser || !lodge || lodge.company_id === company?.id;
  
  const [formData, setFormData] = useState<Lodge>(() => {
    if (lodge) {
      const data = JSON.parse(JSON.stringify(lodge));
      // If we have a custom rate override, use its unit_categories
      if (customRate) {
        data.unit_categories = JSON.parse(JSON.stringify(customRate.unit_categories));
      }
      return data;
    }
    return JSON.parse(JSON.stringify(DEFAULT_LODGE));
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isStorageBrowserOpen, setIsStorageBrowserOpen] = useState(false);
  const [storageImages, setStorageImages] = useState<{name: string, url: string}[]>([]);
  const [tagInputs, setTagInputs] = useState({ facilities: '', amenities: '', activities: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchStorageImages = async () => {
    if (!company) return;
    try {
      const { data: dbData, error: dbError } = await supabase
        .from('gallery_images')
        .select('*')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false });

      if (!dbError && dbData && dbData.length > 0) {
        setStorageImages(dbData.map(img => ({ name: img.name, url: img.url })));
        return;
      }

      const { data, error } = await supabase.storage.from('gallery').list();
      if (error) throw error;
      
      const urls = data
        .filter(file => file.name !== '.emptyFolderPlaceholder')
        .map(file => {
          const { data: { publicUrl } } = supabase.storage.from('gallery').getPublicUrl(file.name);
          return { name: file.name, url: publicUrl };
        });
      setStorageImages(urls);
    } catch (err: any) {
      console.error("Library fetch error:", err);
    }
  };

  const selectImage = (url: string) => {
    const currentImages = formData.images || [];
    if (currentImages.includes(url)) {
      setFormData({ ...formData, images: currentImages.filter(u => u !== url) });
    } else {
      setFormData({ ...formData, images: [...currentImages, url] });
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.location) {
      toast.error("Validation Error: Please enter Property Name and Location.");
      return;
    }

    if (!formData.company_id && !isSuperUser) {
      toast.error("Validation Error: Company assignment is required.");
      return;
    }

    setIsSaving(true);
    try {
      const targetCompanyId = formData.company_id || company?.id;
      if (!targetCompanyId) throw new Error("No target company found.");

      if (!isOwner && lodge?.id) {
        // Save Custom Rates purely for this company
        const { error } = await supabase
          .from('lodge_custom_rates')
          .upsert({
            lodge_id: lodge.id,
            company_id: targetCompanyId,
            unit_categories: formData.unit_categories,
            updated_at: new Date().toISOString()
          }, { onConflict: 'lodge_id,company_id' });

        if (error) throw error;
        toast.success("Custom company pricing saved successfully.");
      } else {
        // Owner flow: Edit everything
        const payload: any = {
          company_id: targetCompanyId,
          name: formData.name,
          location: formData.location,
          tier: formData.tier,
          property_type: formData.property_type,
          description: formData.description || '',
          facilities: formData.facilities || [],
          amenities: formData.amenities || [],
          activities: formData.activities || [],
          images: formData.images || [],
          seasons: formData.seasons || [],
          unit_categories: formData.unit_categories || [],
          show_pricing: formData.show_pricing !== undefined ? formData.show_pricing : true
        };

        let result;
        if (lodge?.id) {
          result = await supabase
            .from('lodges')
            .update(payload)
            .eq('id', lodge.id);
        } else {
          result = await supabase
            .from('lodges')
            .insert([payload]);
        }

        if (result.error) throw result.error;
        toast.success(lodge?.id ? "Property updated successfully." : "Property published successfully.");
      }
      onSave();
      onClose();
    } catch (err: any) {
      const detailedMessage = err.message || (typeof err === 'object' ? JSON.stringify(err) : String(err));
      toast.error("Failed to persist data: " + detailedMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const addTag = (field: 'facilities' | 'amenities' | 'activities') => {
    const val = tagInputs[field].trim();
    if (!val) return;
    if (formData[field]?.includes(val)) {
      setTagInputs({ ...tagInputs, [field]: '' });
      return;
    }
    setFormData({ ...formData, [field]: [...(formData[field] || []), val] });
    setTagInputs({ ...tagInputs, [field]: '' });
  };

  const removeTag = (field: 'facilities' | 'amenities' | 'activities', index: number) => {
    const newList = [...(formData[field] || [])];
    newList.splice(index, 1);
    setFormData({ ...formData, [field]: newList });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    console.log("Starting lodge image upload for", files.length, "files...");
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.warn("No active session found during lodge upload. RLS might block this.");
      }

      const newImageUrls: string[] = [];
      for (const file of Array.from(files) as File[]) {
        console.log("Uploading lodge file:", file.name, "size:", file.size);
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage.from('lodge').upload(fileName, file);
        if (uploadError) {
          console.error("Lodge upload error for", file.name, ":", uploadError);
          throw uploadError;
        }
        console.log("Lodge upload successful:", uploadData);
        
        const { data: { publicUrl } } = supabase.storage.from('lodge').getPublicUrl(fileName);
        console.log("Lodge public URL generated:", publicUrl);
        newImageUrls.push(publicUrl);
      }
      setFormData(prev => ({ ...prev, images: [...(prev.images || []), ...newImageUrls] }));
      toast.success("Images uploaded successfully.");
    } catch (err: any) {
      console.error("Full lodge upload process error:", err);
      toast.error("Storage Error: " + (err.message || JSON.stringify(err)));
    } finally {
      setIsUploading(false);
    }
  };

  const addSeason = () => {
    const newId = `season-${Date.now()}`;
    const newSeason: Season = { id: newId, name: 'New Season', startMonth: 1, startDay: 1, endMonth: 12, endDay: 31 };
    const updatedSeasons = [...(formData.seasons || []), newSeason];
    const updatedUnits = (formData.unit_categories || []).map(unit => ({
      ...unit,
      seasonal_rates: [...(unit.seasonal_rates || []), { seasonId: newId, adultPrice: 0, youngAdultPrice: 0, childPrice: 0 }]
    }));
    setFormData({ ...formData, seasons: updatedSeasons, unit_categories: updatedUnits });
  };

  const removeSeason = (seasonId: string) => {
    const updatedSeasons = (formData.seasons || []).filter(s => s.id !== seasonId);
    const updatedUnits = (formData.unit_categories || []).map(unit => ({
      ...unit,
      seasonal_rates: (unit.seasonal_rates || []).filter(r => r.seasonId !== seasonId)
    }));
    setFormData({ ...formData, seasons: updatedSeasons, unit_categories: updatedUnits });
  };

  const updateSeason = (seasonId: string, field: keyof Season, value: any) => {
    const updatedSeasons = (formData.seasons || []).map(s => s.id === seasonId ? { ...s, [field]: value } : s);
    setFormData({ ...formData, seasons: updatedSeasons });
  };

  const updateNestedUnit = (unitIdx: number, field: keyof UnitCategory, value: any) => {
    const updatedUnits = [...(formData.unit_categories || [])];
    updatedUnits[unitIdx] = { ...updatedUnits[unitIdx], [field]: value };
    setFormData({ ...formData, unit_categories: updatedUnits });
  };

  const updateRate = (unitIdx: number, seasonId: string, field: keyof SeasonalRate, value: number) => {
    const updatedUnits = [...(formData.unit_categories || [])];
    const unit = { ...updatedUnits[unitIdx] };
    const rates = [...(unit.seasonal_rates || [])];
    const rateIdx = rates.findIndex(r => r.seasonId === seasonId);
    if (rateIdx >= 0) rates[rateIdx] = { ...rates[rateIdx], [field]: value };
    else rates.push({ seasonId, adultPrice: 0, youngAdultPrice: 0, childPrice: 0, [field]: value });
    unit.seasonal_rates = rates;
    updatedUnits[unitIdx] = unit;
    setFormData({ ...formData, unit_categories: updatedUnits });
  };

  return (
    <>
      <div className="bg-white w-full rounded-xl shadow-xl overflow-hidden flex flex-col animate-fadeIn border border-safari-100">
      <div className="p-8 border-b border-safari-100 flex justify-between items-center bg-safari-50">
        <div>
          <h2 className="text-3xl font-black text-safari-900 flex items-center gap-3">
            <div className="w-12 h-12 bg-safari-800 rounded-lg flex items-center justify-center text-white shadow-lg">
               <Building size={24} />
            </div>
            {lodge?.id ? 'Refine Property Profile' : 'New Catalog Entry'}
          </h2>
          <p className="text-sm text-safari-500 font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Enterprise Cloud Sync
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="px-6 py-3 font-bold text-safari-500 hover:bg-safari-200 rounded-xl transition-colors">Exit</button>
          <button onClick={handleSave} disabled={isSaving || isUploading} className="px-10 py-3 bg-safari-800 text-white rounded-lg font-black uppercase text-xs tracking-widest hover:bg-safari-900 transition-all shadow-xl active:scale-95 disabled:opacity-50 flex items-center gap-2">
            {isSaving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
            {lodge?.id ? 'Update & Sync' : 'Publish'}
          </button>
        </div>
      </div>

      <div className="flex-1 p-10 space-y-16">
        {/* Core Identity */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-lg font-black text-safari-900 flex items-center gap-2">
               <Info className="text-safari-500" /> Logistics & Brand
            </h3>
            <p className="text-sm text-safari-500 leading-relaxed">Basic identifiers used by the AI engine for routing and matching.</p>
          </div>
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-black text-safari-400 uppercase tracking-widest mb-2">Property Name</label>
              <input type="text" disabled={!isOwner} className="w-full p-4 bg-white border border-safari-200 rounded-lg outline-none focus:ring-2 focus:ring-safari-500 font-bold text-safari-900 disabled:opacity-70" value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. Soroi Mara Bush Camp" />
            </div>
            {isSuperUser && (
              <div className="md:col-span-2">
                <label className="block text-xs font-black text-safari-400 uppercase tracking-widest mb-2">Owner Company</label>
                <select 
                  className="w-full p-4 bg-white border border-safari-200 rounded-lg outline-none focus:ring-2 focus:ring-safari-500 font-bold text-safari-900" 
                  value={formData.company_id || ''} 
                  onChange={(e) => setFormData({...formData, company_id: e.target.value})}
                >
                  <option value="">Select a company...</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs font-black text-safari-400 uppercase tracking-widest mb-2">Primary Location</label>
              <input type="text" disabled={!isOwner} className="w-full p-4 bg-white border border-safari-200 rounded-lg outline-none focus:ring-2 focus:ring-safari-500 font-bold disabled:opacity-70" value={formData.location || ''} onChange={(e) => setFormData({...formData, location: e.target.value})} placeholder="e.g. Masai Mara" />
            </div>
            <div>
              <label className="block text-xs font-black text-safari-400 uppercase tracking-widest mb-2">Property Type</label>
              <select disabled={!isOwner} className="w-full p-4 bg-white border border-safari-200 rounded-lg outline-none focus:ring-2 focus:ring-safari-500 font-bold disabled:opacity-70" value={formData.property_type || PropertyType.Lodge} onChange={(e) => setFormData({...formData, property_type: e.target.value as PropertyType})}>
                {Object.values(PropertyType).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-black text-safari-400 uppercase tracking-widest mb-2">Marketing Description</label>
              <textarea disabled={!isOwner} className="w-full p-4 bg-white border border-safari-200 rounded-lg outline-none focus:ring-2 focus:ring-safari-500 h-32 font-medium shadow-sm resize-none disabled:opacity-70" value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Describe the guest experience, views, and unique selling points..." />
            </div>
            <div className="md:col-span-2 flex items-center gap-3 p-4 bg-safari-50 rounded-lg border border-safari-100">
              <input 
                type="checkbox" 
                id="show_pricing"
                className="w-5 h-5 accent-safari-800 rounded cursor-pointer" 
                checked={formData.show_pricing ?? true} 
                onChange={(e) => setFormData({...formData, show_pricing: e.target.checked})} 
              />
              <label htmlFor="show_pricing" className="text-sm font-bold text-safari-900 cursor-pointer">
                Show Pricing to Client
                <span className="block text-[10px] text-safari-400 font-medium uppercase tracking-wider mt-0.5">When disabled, rates will be hidden on public itineraries.</span>
              </label>
            </div>
          </div>
        </section>

        {/* Features & Experiences */}
        <section className="pt-16 border-t border-safari-100">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-1 space-y-4">
              <h3 className="text-lg font-black text-safari-900 flex items-center gap-2">
                 <Sparkles className="text-safari-500" /> Features & Experiences
              </h3>
              <p className="text-sm text-safari-500 leading-relaxed">Add facilities, amenities, and activities. Press 'Enter' or click '+' to add an item.</p>
            </div>
            <div className="lg:col-span-2 space-y-10">
              {/* Facilities */}
              <div>
                <label className="block text-xs font-black text-safari-400 uppercase tracking-widest mb-2">Signature Facilities</label>
                {isOwner && (
                  <div className="flex gap-2 mb-3">
                    <div className="relative flex-1">
                      <ListChecks className="absolute left-3 top-1/2 -translate-y-1/2 text-safari-300" size={16} />
                      <input type="text" className="w-full pl-10 p-3 bg-white border border-safari-200 rounded-lg outline-none focus:ring-2 focus:ring-safari-500 text-sm font-bold" value={tagInputs.facilities} onChange={(e) => setTagInputs({...tagInputs, facilities: e.target.value})} onKeyDown={(e) => e.key === 'Enter' && addTag('facilities')} placeholder="e.g. Infinity Pool, Solar Power..." />
                    </div>
                    <button onClick={() => addTag('facilities')} className="p-3 bg-safari-800 text-white rounded-lg hover:bg-safari-900 transition-colors"><Plus size={18} /></button>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {formData.facilities?.map((tag, i) => (
                    <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-safari-700 rounded-lg border border-safari-200 text-xs font-bold group shadow-sm">
                      {tag} {isOwner && <button onClick={() => removeTag('facilities', i)} className="hover:text-red-500"><X size={12} /></button>}
                    </span>
                  ))}
                </div>
              </div>

              {/* Amenities */}
              <div>
                <label className="block text-xs font-black text-safari-400 uppercase tracking-widest mb-2">Guest Amenities</label>
                {isOwner && (
                  <div className="flex gap-2 mb-3">
                    <div className="relative flex-1">
                      <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 text-safari-300" size={16} />
                      <input type="text" className="w-full pl-10 p-3 bg-white border border-safari-200 rounded-lg outline-none focus:ring-2 focus:ring-safari-500 text-sm font-bold" value={tagInputs.amenities} onChange={(e) => setTagInputs({...tagInputs, amenities: e.target.value})} onKeyDown={(e) => e.key === 'Enter' && addTag('amenities')} placeholder="e.g. Bathrobes, Mosquito Nets..." />
                    </div>
                    <button onClick={() => addTag('amenities')} className="p-3 bg-safari-800 text-white rounded-lg hover:bg-safari-900 transition-colors"><Plus size={18} /></button>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {formData.amenities?.map((tag, i) => (
                    <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-safari-700 rounded-lg border border-safari-200 text-xs font-bold shadow-sm">
                      {tag} {isOwner && <button onClick={() => removeTag('amenities', i)} className="hover:text-red-500"><X size={12} /></button>}
                    </span>
                  ))}
                </div>
              </div>

              {/* Activities */}
              <div>
                <label className="block text-xs font-black text-safari-400 uppercase tracking-widest mb-2">Guest Activities</label>
                {isOwner && (
                  <div className="flex gap-2 mb-3">
                    <div className="relative flex-1">
                      <Footprints className="absolute left-3 top-1/2 -translate-y-1/2 text-safari-300" size={16} />
                      <input type="text" className="w-full pl-10 p-3 bg-white border border-safari-200 rounded-lg outline-none focus:ring-2 focus:ring-safari-500 text-sm font-bold" value={tagInputs.activities} onChange={(e) => setTagInputs({...tagInputs, activities: e.target.value})} onKeyDown={(e) => e.key === 'Enter' && addTag('activities')} placeholder="e.g. Game Drives, Nature Walks..." />
                    </div>
                    <button onClick={() => addTag('activities')} className="p-3 bg-safari-800 text-white rounded-lg hover:bg-safari-900 transition-colors"><Plus size={18} /></button>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {formData.activities?.map((tag, i) => (
                    <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-safari-700 rounded-lg border border-safari-200 text-xs font-bold shadow-sm">
                      {tag} {isOwner && <button onClick={() => removeTag('activities', i)} className="hover:text-red-500"><X size={12} /></button>}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Media */}
        <section className="pt-16 border-t border-safari-100">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-1 space-y-4">
              <h3 className="text-lg font-black text-safari-900 flex items-center gap-2">
                 <ImageIcon className="text-safari-500" /> Digital Assets
              </h3>
              <p className="text-sm text-safari-500 leading-relaxed">Gallery items for itineraries. Upload to storage or select from your company library.</p>
              <div className="mt-6 flex flex-col gap-3">
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} multiple accept="image/*" className="hidden" />
                <button 
                  onClick={() => {
                    setIsStorageBrowserOpen(true);
                    fetchStorageImages();
                  }}
                  className="w-full px-6 py-4 bg-safari-800 text-white rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 hover:bg-safari-900 transition-all shadow-lg"
                >
                  <Search size={18} /> Library Browser
                </button>
                <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="w-full flex items-center justify-center gap-3 p-4 bg-safari-100 text-safari-600 rounded-xl hover:bg-safari-200 transition-all font-black uppercase text-[10px] tracking-widest text-center">
                  {isUploading ? <Loader2 className="animate-spin" size={18} /> : <UploadCloud size={18} />}
                  <span>{isUploading ? 'Uploading...' : 'Direct Upload'}</span>
                </button>
              </div>
            </div>
            <div className="lg:col-span-2 space-y-8">
                {formData.images && formData.images.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    {formData.images.map((img, idx) => (
                      <div key={idx} className="group relative aspect-video bg-safari-50 rounded-2xl overflow-hidden border border-safari-100 shadow-md transform transition-all hover:scale-[1.02]">
                        <img src={img} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        <div className="absolute inset-0 bg-safari-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button onClick={() => {
                              const updatedImages = [...(formData.images || [])];
                              updatedImages.splice(idx, 1);
                              setFormData({ ...formData, images: updatedImages });
                          }} className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all shadow-xl">
                              <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-20 border-2 border-dashed border-safari-100 rounded-3xl flex flex-col items-center justify-center text-safari-300 space-y-4 bg-safari-50/30">
                    <ImageIcon size={64} strokeWidth={1} className="opacity-20" />
                    <div className="text-center">
                      <p className="text-sm font-black uppercase tracking-widest">No Images Yet</p>
                      <p className="text-xs font-medium opacity-60">Populate your property profile with stunning visuals.</p>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </section>

        {/* Seasons */}
        <section className="pt-16 border-t border-safari-100">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-1 space-y-4">
              <h3 className="text-lg font-black text-safari-900 flex items-center gap-2">
                 <CalendarDays className="text-safari-500" /> Pricing Calendar
              </h3>
              <p className="text-sm text-safari-500 leading-relaxed">Define date ranges for the seasonal rate lookup table.</p>
              {isOwner && (
                <button onClick={addSeason} className="mt-4 flex items-center gap-2 text-xs font-black uppercase text-safari-600 hover:text-safari-900 bg-white border border-safari-200 px-4 py-2 rounded-lg transition-colors">
                  <Plus size={14} /> New Season
                </button>
              )}
            </div>
            <div className="lg:col-span-2 space-y-4">
               {formData.seasons?.map((s) => (
                 <div key={s.id} className="bg-gray-50 p-6 rounded-xl border border-safari-200 flex flex-col md:flex-row gap-4 items-end animate-fadeIn">
                    <div className="flex-1 w-full">
                      <label className="text-[10px] font-black uppercase text-safari-400 mb-2 block">Season Title</label>
                      <input type="text" disabled={!isOwner} className="w-full p-2.5 rounded-lg border border-safari-200 font-bold bg-white disabled:opacity-70" value={s.name} onChange={(e) => updateSeason(s.id, 'name', e.target.value)} />
                    </div>
                    <div className="flex gap-4 items-end">
                      <div>
                        <label className="text-[10px] font-black uppercase text-safari-400 mb-2 block">Valid From</label>
                        <div className="flex gap-1">
                          <select disabled={!isOwner} className="p-2.5 border border-safari-200 rounded-lg text-xs font-bold bg-white disabled:opacity-70" value={s.startMonth} onChange={(e) => updateSeason(s.id, 'startMonth', parseInt(e.target.value))}>
                            {MONTHS.map((m, i) => <option key={i} value={i+1}>{m.slice(0,3)}</option>)}
                          </select>
                          <input type="number" disabled={!isOwner} className="w-14 p-2.5 border border-safari-200 rounded-lg text-xs text-center font-bold bg-white disabled:opacity-70" value={s.startDay} onChange={(e) => updateSeason(s.id, 'startDay', parseInt(e.target.value))} />
                        </div>
                      </div>
                      <div className="flex items-center justify-center h-10 text-safari-300"><ArrowRight size={16} /></div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-safari-400 mb-2 block">Valid To</label>
                        <div className="flex gap-1">
                          <select disabled={!isOwner} className="p-2.5 border border-safari-200 rounded-lg text-xs font-bold bg-white disabled:opacity-70" value={s.endMonth} onChange={(e) => updateSeason(s.id, 'endMonth', parseInt(e.target.value))}>
                            {MONTHS.map((m, i) => <option key={i} value={i+1}>{m.slice(0,3)}</option>)}
                          </select>
                          <input type="number" disabled={!isOwner} className="w-14 p-2.5 border border-safari-200 rounded-lg text-xs text-center font-bold bg-white disabled:opacity-70" value={s.endDay} onChange={(e) => updateSeason(s.id, 'endDay', parseInt(e.target.value))} />
                        </div>
                      </div>
                    </div>
                    {isOwner && <button onClick={() => removeSeason(s.id)} className="p-3 text-safari-300 hover:text-red-500 transition-colors"><Trash2 size={20} /></button>}
                 </div>
               ))}
            </div>
          </div>
        </section>

        {/* Inventory & Rates */}
        <section className="pt-16 border-t border-safari-100">
           <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black text-safari-900 flex items-center gap-3">
                 <LayoutGrid className="text-safari-500" /> Units & Net Rates
              </h3>
              <button onClick={() => setFormData({...formData, unit_categories: [...(formData.unit_categories || []), { id: `unit-${Date.now()}`, name: 'New Unit', total_units: 1, max_occupancy: 2, seasonal_rates: (formData.seasons || []).map(s => ({ seasonId: s.id, adultPrice: 0, youngAdultPrice: 0, childPrice: 0 })) }]})} className="px-6 py-2 bg-safari-800 text-white rounded-lg font-bold text-xs uppercase shadow-md hover:bg-safari-900 transition-all"><Plus size={16} className="inline mr-2" /> Add Category</button>
           </div>
           <div className="space-y-10">
              {formData.unit_categories?.map((unit, uIdx) => (
                <div key={unit.id} className="bg-white rounded-xl border border-safari-200 overflow-hidden shadow-lg animate-fadeIn">
                   <div className="bg-safari-900 p-6 flex justify-between items-center">
                      <input className="bg-transparent text-white font-black text-xl border-b border-white/20 outline-none w-full max-w-md focus:border-white transition-all" value={unit.name} onChange={(e) => updateNestedUnit(uIdx, 'name', e.target.value)} placeholder="Unit Name" />
                      <button onClick={() => setFormData({...formData, unit_categories: (formData.unit_categories || []).filter((_, i) => i !== uIdx)})} className="p-2 text-white/40 hover:text-red-400 transition-colors"><Trash2 size={20} /></button>
                   </div>
                   <div className="p-6 bg-gray-50 border-b border-safari-100 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[10px] font-black uppercase text-safari-400 mb-2">Total Units Available</label>
                        <input 
                          type="number" 
                          className="w-full p-2.5 rounded-lg border border-safari-200 font-bold bg-white focus:ring-2 focus:ring-safari-500 outline-none" 
                          value={unit.total_units} 
                          onChange={(e) => updateNestedUnit(uIdx, 'total_units', parseInt(e.target.value) || 0)} 
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase text-safari-400 mb-2">Max Occupancy (Guests)</label>
                        <input 
                          type="number" 
                          className="w-full p-2.5 rounded-lg border border-safari-200 font-bold bg-white focus:ring-2 focus:ring-safari-500 outline-none" 
                          value={unit.max_occupancy} 
                          onChange={(e) => updateNestedUnit(uIdx, 'max_occupancy', parseInt(e.target.value) || 0)} 
                        />
                      </div>
                   </div>
                   <div className="p-0 overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="bg-safari-50 text-[10px] font-black uppercase text-safari-400">
                          <tr>
                             <th className="px-8 py-4 border-b border-safari-100">Season</th>
                             <th className="px-8 py-4 text-center border-b border-safari-100">Adult ($)</th>
                             <th className="px-8 py-4 text-center border-b border-safari-100">Teen ($)</th>
                             <th className="px-8 py-4 text-center border-b border-safari-100">Child ($)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-safari-50 bg-white">
                          {formData.seasons?.map(s => {
                            const rate = unit.seasonal_rates?.find(r => r.seasonId === s.id) || { seasonId: s.id, adultPrice: 0, youngAdultPrice: 0, childPrice: 0 };
                            return (
                              <tr key={s.id}>
                                <td className="px-8 py-4 font-bold text-safari-900">{s.name}</td>
                                <td className="px-8 py-4 text-center"><input type="number" className="w-24 p-2 bg-white border border-safari-100 rounded text-center font-black outline-none focus:ring-1 focus:ring-safari-500" value={rate.adultPrice} onChange={(e) => updateRate(uIdx, s.id, 'adultPrice', parseFloat(e.target.value) || 0)} /></td>
                                <td className="px-8 py-4 text-center"><input type="number" className="w-24 p-2 bg-white border border-safari-100 rounded text-center font-black outline-none focus:ring-1 focus:ring-safari-500" value={rate.youngAdultPrice} onChange={(e) => updateRate(uIdx, s.id, 'youngAdultPrice', parseFloat(e.target.value) || 0)} /></td>
                                <td className="px-8 py-4 text-center"><input type="number" className="w-24 p-2 bg-white border border-safari-100 rounded text-center font-black outline-none focus:ring-1 focus:ring-safari-500" value={rate.childPrice} onChange={(e) => updateRate(uIdx, s.id, 'childPrice', parseFloat(e.target.value) || 0)} /></td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                   </div>
                </div>
              ))}
           </div>
        </section>
      </div>

      <div className="p-8 border-t border-safari-100 flex justify-end gap-4 bg-safari-50 sticky bottom-0 z-10 shadow-xl">
        <button onClick={onClose} className="px-8 py-3 font-bold text-safari-600 hover:text-safari-900 transition-colors">Cancel</button>
        <button onClick={handleSave} disabled={isSaving} className="px-12 py-3 bg-safari-800 text-white rounded-lg font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 disabled:opacity-50 transition-all">
          {isSaving ? 'Processing...' : 'Save & Close'}
        </button>
      </div>
    </div>

    {/* Storage Browser Modal */}
      {isStorageBrowserOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-8 bg-safari-900/95 backdrop-blur-md animate-fadeIn">
          <div className="bg-white w-full max-w-6xl h-full max-h-[90vh] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col border border-white/10">
            <div className="p-8 border-b border-safari-100 flex justify-between items-center bg-safari-50/50">
              <div>
                <h3 className="text-2xl font-black text-safari-900 flex items-center gap-3">
                  <div className="p-2 bg-safari-100 rounded-lg text-safari-600">
                    <ImageIcon size={24} />
                  </div>
                  Property Asset Manager
                </h3>
                <p className="text-[10px] text-safari-500 font-black uppercase tracking-[0.2em] mt-1 ml-12">
                  Select visual assets for this property profile
                </p>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="px-6 py-3 bg-safari-800 text-white rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:bg-safari-900 transition-all shadow-md"
                >
                  <UploadCloud size={16} /> New Upload
                </button>
                <button onClick={() => setIsStorageBrowserOpen(false)} className="p-2 text-safari-400 hover:text-safari-900 transition-colors">
                  <X size={28} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-10 bg-gray-50/30">
              {storageImages.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                  {storageImages.map((img, idx) => {
                    const isSelected = formData.images?.includes(img.url);
                    return (
                      <div 
                        key={idx} 
                        onClick={() => selectImage(img.url)}
                        className={`group relative aspect-[4/5] rounded-[1.5rem] overflow-hidden transition-all duration-500 cursor-pointer shadow-sm hover:shadow-2xl border-2 ${
                          isSelected ? 'border-safari-600 ring-8 ring-safari-600/10 scale-[0.98]' : 'border-transparent hover:border-safari-200 hover:-translate-y-1'
                        }`}
                      >
                        <img src={img.url} alt={img.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" referrerPolicy="no-referrer" />
                        <div className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-300 ${
                          isSelected ? 'bg-safari-900/40 opacity-100' : 'bg-safari-900/0 group-hover:bg-safari-900/40 opacity-0 group-hover:opacity-100'
                        }`}>
                          {isSelected ? (
                            <div className="bg-white text-safari-900 p-3 rounded-full shadow-2xl animate-bounce">
                              <Check size={24} strokeWidth={4} />
                            </div>
                          ) : (
                            <div className="bg-white/90 backdrop-blur-md text-safari-900 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/20 shadow-xl">
                              Pick Asset
                            </div>
                          )}
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-safari-900/80 via-safari-900/40 to-transparent pt-10">
                          <p className="text-[9px] text-white/90 font-black uppercase tracking-widest truncate">{img.name}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-safari-300 space-y-6">
                  <div className="w-16 h-16 border-4 border-safari-100 border-t-safari-500 rounded-full animate-spin" />
                  <p className="text-xs font-black uppercase tracking-[0.3em] animate-pulse">Syncing Archive...</p>
                </div>
              )}
            </div>

            <div className="p-8 border-t border-safari-100 bg-safari-50/50 flex justify-between items-center px-10">
              <div className="flex items-center gap-4">
                <div className="px-5 py-2 bg-white rounded-full border border-safari-100 shadow-sm">
                   <p className="text-[10px] text-safari-600 font-bold uppercase tracking-widest">
                     {formData.images?.length || 0} Assets Selected
                   </p>
                </div>
              </div>
              <button 
                onClick={() => setIsStorageBrowserOpen(false)}
                className="px-14 py-4 bg-safari-900 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl hover:bg-black transition-all active:scale-95"
              >
                Finished Selecting
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LodgeEditor;
