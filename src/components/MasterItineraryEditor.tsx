
import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Lodge, GeneratedItinerary, DayItinerary, TeamMember } from '../types';
import { 
  X, Save, Plus, Trash2, Info, 
  LayoutGrid,
  RefreshCw, Sparkles, 
  Bookmark, Type, DollarSign,
  Image as ImageIcon, UploadCloud, Link as LinkIcon,
  Search, Check, Layout, FileCheck, User, Compass
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface MasterItineraryEditorProps {
  safari?: any | null;
  lodges: Lodge[];
  teamMembers?: TeamMember[];
  onClose: () => void;
  onSave: () => void;
}

const DEFAULT_SCHEDULE: DayItinerary = {
  day: 1,
  dayLabel: '',
  title: 'Arrival & Safari Start',
  description: 'Welcome to Africa! Your safari adventure begins with an evening game drive.',
  morningActivity: 'Airport Transfer',
  afternoonActivity: 'Sunset Game Drive',
  accommodation: '',
  driveTime: '2 hours',
  meals: 'B, L, D'
};

const MasterItineraryEditor: React.FC<MasterItineraryEditorProps> = ({ safari, lodges, teamMembers, onClose, onSave }) => {
  const { company } = useAuth();
  const [formData, setFormData] = useState<GeneratedItinerary>(() => {
    if (safari?.itinerary_data) return JSON.parse(JSON.stringify(safari.itinerary_data));
    return {
      tripTitle: '',
      summary: '',
      totalEstimatedCost: '0',
      highlights: [],
      specialist_id: '',
      schedule: [JSON.parse(JSON.stringify(DEFAULT_SCHEDULE))]
    };
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isStorageBrowserOpen, setIsStorageBrowserOpen] = useState(false);
  const [selectionMode, setSelectionMode] = useState<'gallery' | 'hero' | 'section'>('gallery');
  const [activeSectionIdx, setActiveSectionIdx] = useState<number | null>(null);
  const [storageImages, setStorageImages] = useState<{name: string, url: string}[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [includeInput, setIncludeInput] = useState('');
  const [excludeInput, setExcludeInput] = useState('');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchStorageImages = async () => {
    if (!company) return;
    console.log("Fetching storage images...");
    try {
      // Try to fetch from database table first for better reliability
      const { data: dbData, error: dbError } = await supabase
        .from('gallery_images')
        .select('*')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false });

      if (dbError) {
        console.warn("Database fetch error (table might not exist):", dbError);
      }

      if (!dbError && dbData && dbData.length > 0) {
        console.log("Fetched from database:", dbData.length, "images");
        setStorageImages(dbData.map(img => ({ name: img.name, url: img.url })));
        return;
      }

      // Fallback to storage list if table is empty or doesn't exist
      console.log("Falling back to storage list...");
      const { data, error } = await supabase.storage.from('gallery').list();
      
      if (error) {
        console.error("Storage list error:", error);
        if (error.message.includes('not found')) {
          toast.error("Storage bucket 'gallery' not found. Please create it in Supabase.");
        } else {
          toast.error("Storage Error: " + error.message);
        }
        throw error;
      }
      
      console.log("Fetched from storage list:", data.length, "files");
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

  const openStorageBrowser = (mode: 'gallery' | 'hero' | 'section' = 'gallery', sectionIdx: number | null = null) => {
    setSelectionMode(mode);
    setActiveSectionIdx(sectionIdx);
    setIsStorageBrowserOpen(true);
    fetchStorageImages();
  };

  const handleSave = async () => {
    if (!company) return;
    if (!formData.tripTitle) {
      toast.error("Please enter a Safari Title.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        company_id: company.id,
        trip_title: formData.tripTitle,
        itinerary_data: formData,
        updated_at: new Date().toISOString()
      };

      let error;
      if (safari?.id) {
        const { error: updateError } = await supabase
          .from('master_itineraries')
          .update(payload)
          .eq('id', safari.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('master_itineraries')
          .insert([payload]);
        error = insertError;
      }

      if (error) throw error;
      toast.success(safari?.id ? "Signature Safari updated successfully." : "Signature Safari published successfully.");
      onSave();
      onClose();
    } catch (err: any) {
      toast.error("Save Error: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const addHighlight = () => {
    if (!tagInput.trim()) return;
    if (formData.highlights.includes(tagInput.trim())) {
      setTagInput('');
      return;
    }
    setFormData({ ...formData, highlights: [...formData.highlights, tagInput.trim()] });
    setTagInput('');
  };

  const removeHighlight = (idx: number) => {
    const newHighlights = [...formData.highlights];
    newHighlights.splice(idx, 1);
    setFormData({ ...formData, highlights: newHighlights });
  };

  const addInclude = () => {
    if (!includeInput.trim()) return;
    const currentIncludes = formData.includes || [];
    if (currentIncludes.includes(includeInput.trim())) {
      setIncludeInput('');
      return;
    }
    setFormData({ ...formData, includes: [...currentIncludes, includeInput.trim()] });
    setIncludeInput('');
  };

  const removeInclude = (idx: number) => {
    const newIncludes = [...(formData.includes || [])];
    newIncludes.splice(idx, 1);
    setFormData({ ...formData, includes: newIncludes });
  };

  const addExclude = () => {
    if (!excludeInput.trim()) return;
    const currentExcludes = formData.excludes || [];
    if (currentExcludes.includes(excludeInput.trim())) {
      setExcludeInput('');
      return;
    }
    setFormData({ ...formData, excludes: [...currentExcludes, excludeInput.trim()] });
    setExcludeInput('');
  };

  const removeExclude = (idx: number) => {
    const newExcludes = [...(formData.excludes || [])];
    newExcludes.splice(idx, 1);
    setFormData({ ...formData, excludes: newExcludes });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    console.log("Starting upload for", files.length, "files...");
    
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.warn("Auth session error during upload:", sessionError.message);
        if (sessionError.message.includes('refresh_token_not_found') || sessionError.message.includes('Refresh Token Not Found')) {
          await supabase.auth.signOut();
        }
      }

      if (!session) {
        console.warn("No active session found during upload. RLS might block this.");
      }

      const newImageUrls: string[] = [];
      for (const file of Array.from(files) as File[]) {
        console.log("Uploading file:", file.name, "size:", file.size);
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        
        // 1. Upload to storage
        const { data: uploadData, error: uploadError } = await supabase.storage.from('gallery').upload(fileName, file);
        if (uploadError) {
          console.error("Upload error for", file.name, ":", uploadError);
          throw uploadError;
        }
        console.log("Upload successful:", uploadData);
        
        // 2. Get public URL
        const { data: { publicUrl } } = supabase.storage.from('gallery').getPublicUrl(fileName);
        console.log("Public URL generated:", publicUrl);
        newImageUrls.push(publicUrl);

        // 3. Register in database for easier fetching
        const { error: dbError } = await supabase.from('gallery_images').insert([{
          company_id: company.id,
          name: file.name,
          url: publicUrl
        }]);
        if (dbError) {
          console.warn("Database registration error (table might not exist):", dbError);
        } else {
          console.log("Database registration successful");
        }
      }
      setFormData(prev => ({ ...prev, gallery: [...(prev.gallery || []), ...newImageUrls] }));
      toast.success("Images uploaded successfully.");
      if (isStorageBrowserOpen) fetchStorageImages();
    } catch (err: any) {
      console.error("Full upload process error:", err);
      toast.error("Storage Error: " + (err.message || JSON.stringify(err)));
    } finally {
      setIsUploading(false);
    }
  };

  const selectImage = (url: string) => {
    if (selectionMode === 'hero') {
      setFormData({ ...formData, heroImage: url });
      setIsStorageBrowserOpen(false);
    } else if (selectionMode === 'section' && activeSectionIdx !== null) {
      updateDay(activeSectionIdx, 'sectionImage', url);
      setIsStorageBrowserOpen(false);
    } else {
      toggleGalleryImage(url);
    }
  };

  const toggleGalleryImage = (url: string) => {
    const currentGallery = formData.gallery || [];
    if (currentGallery.includes(url)) {
      setFormData({ ...formData, gallery: currentGallery.filter(u => u !== url) });
    } else {
      setFormData({ ...formData, gallery: [...currentGallery, url] });
    }
  };

  const addImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    setFormData(prev => ({ ...prev, gallery: [...(prev.gallery || []), imageUrlInput.trim()] }));
    setImageUrlInput('');
    toast.success("Image URL added.");
  };

  const removeGalleryImage = (idx: number) => {
    const newGallery = [...(formData.gallery || [])];
    newGallery.splice(idx, 1);
    setFormData({ ...formData, gallery: newGallery });
  };

  const addDay = () => {
    const newDayNum = formData.schedule.length + 1;
    // Guess the label based on previous
    const newDay = { ...DEFAULT_SCHEDULE, day: newDayNum, dayLabel: String(newDayNum) };
    setFormData({ ...formData, schedule: [...formData.schedule, newDay] });
  };

  const addSectionBreak = () => {
    const newDayNum = formData.schedule.length + 1;
    const newSection: DayItinerary = {
      ...DEFAULT_SCHEDULE,
      day: newDayNum,
      dayLabel: '',
      isSectionBreak: true,
      sectionTitle: '',
      sectionDescription: '',
      sectionImage: ''
    };
    setFormData({ ...formData, schedule: [...formData.schedule, newSection] });
  };

  const updateDay = (idx: number, field: keyof DayItinerary, value: any) => {
    const newSchedule = [...formData.schedule];
    newSchedule[idx] = { ...newSchedule[idx], [field]: value };
    setFormData({ ...formData, schedule: newSchedule });
  };

  const removeDay = (idx: number) => {
    if (formData.schedule.length <= 1) return;
    const newSchedule = formData.schedule.filter((_, i) => i !== idx).map((day, i) => ({ ...day, day: i + 1 }));
    setFormData({ ...formData, schedule: newSchedule });
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-xl overflow-hidden flex flex-col animate-fadeIn border border-safari-100 min-h-[80vh]">
        {/* Header */}
        <div className="p-8 border-b border-safari-100 flex justify-between items-center bg-safari-50">
          <div>
            <h2 className="text-3xl font-black text-safari-900 flex items-center gap-3">
              <div className="w-12 h-12 bg-safari-400 rounded-lg flex items-center justify-center text-white shadow-lg">
                 <Bookmark size={24} />
              </div>
              {safari?.id ? 'Edit Signature Safari' : 'New Master Itinerary'}
            </h2>
            <p className="text-sm text-safari-500 font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
              Signature Catalog Builder
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-6 py-3 font-bold text-safari-500 hover:bg-safari-200 rounded-xl transition-colors">Exit</button>
            <button onClick={handleSave} disabled={isSaving} className="px-10 py-3 bg-safari-800 text-white rounded-lg font-black uppercase text-xs tracking-widest hover:bg-safari-900 transition-all shadow-xl active:scale-95 disabled:opacity-50 flex items-center gap-2">
              {isSaving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
              {safari?.id ? 'Save Changes' : 'Publish Safari'}
            </button>
          </div>
        </div>

        <div className="flex-1 p-10 space-y-16">
          {/* ... (rest of the content remains the same) ... */}
        {/* Basic Info */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-lg font-black text-safari-900 flex items-center gap-2">
               <Info className="text-safari-500" /> Safari Identity
            </h3>
            <p className="text-sm text-safari-500 leading-relaxed">The title and high-level description for the brochure.</p>
          </div>
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-safari-400 uppercase tracking-widest mb-2">Trip Title</label>
              <input 
                type="text" 
                className="w-full p-4 bg-white border border-safari-200 rounded-lg outline-none focus:ring-2 focus:ring-safari-400 font-bold text-safari-900 shadow-sm"
                value={formData.tripTitle}
                onChange={(e) => setFormData({...formData, tripTitle: e.target.value})}
                placeholder="e.g. 7-Day Mara & Serengeti Luxury Expedition"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-safari-400 uppercase tracking-widest mb-2">Itinerary Summary</label>
              <textarea 
                className="w-full p-4 bg-white border border-safari-200 rounded-lg outline-none focus:ring-2 focus:ring-safari-400 h-32 font-medium resize-none shadow-sm"
                value={formData.summary}
                onChange={(e) => setFormData({...formData, summary: e.target.value})}
                placeholder="Tell a story about this adventure..."
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-safari-400 uppercase tracking-widest mb-2">Estimated Starting Price ($)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-safari-300" size={18} />
                <input 
                  type="text" 
                  className="w-full pl-10 p-4 bg-white border border-safari-200 rounded-lg outline-none focus:ring-2 focus:ring-safari-400 font-black shadow-sm"
                  value={String(formData.totalEstimatedCost)}
                  onChange={(e) => setFormData({...formData, totalEstimatedCost: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-safari-400 uppercase tracking-widest mb-2">Dedicated Specialist</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-safari-300" size={18} />
                <select 
                  className="w-full pl-10 p-4 bg-white border border-safari-200 rounded-lg outline-none focus:ring-2 focus:ring-safari-400 font-bold shadow-sm appearance-none"
                  value={formData.specialist_id || ''}
                  onChange={(e) => setFormData({...formData, specialist_id: e.target.value})}
                >
                  <option value="">No specialist assigned</option>
                  {(teamMembers || []).map(member => (
                    <option key={member.id} value={member.id}>{member.name} ({member.role})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Hero Banner */}
        <section className="pt-16 border-t border-safari-100">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-1 space-y-4">
              <h3 className="text-lg font-black text-safari-900 flex items-center gap-2">
                 <ImageIcon className="text-safari-500" /> Hero Banner
              </h3>
              <p className="text-sm text-safari-500 leading-relaxed">
                This image will appear at the top of the safari page as a full-width banner.
              </p>
            </div>
            <div className="lg:col-span-2 space-y-6">
              <div className="relative group aspect-[21/9] rounded-2xl overflow-hidden bg-safari-50 border-2 border-dashed border-safari-200 hover:border-safari-400 transition-all">
                {formData.heroImage ? (
                  <>
                    <img 
                      src={formData.heroImage} 
                      alt="Hero Preview" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                      <button 
                        onClick={() => setFormData({...formData, heroImage: ''})}
                        className="p-3 bg-white/20 backdrop-blur-md text-white rounded-full hover:bg-red-500 transition-all"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-safari-400">
                    <ImageIcon size={48} className="mb-4 opacity-20" />
                    <p className="text-xs font-bold uppercase tracking-widest">No Hero Image Selected</p>
                  </div>
                )}
              </div>
              
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <LinkIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-safari-400" />
                  <input 
                    type="text" 
                    className="w-full pl-12 pr-4 py-4 bg-white border border-safari-200 rounded-xl outline-none shadow-sm focus:ring-2 focus:ring-safari-400 font-bold text-sm"
                    placeholder="Paste hero image URL"
                    value={formData.heroImage || ''}
                    onChange={(e) => setFormData({...formData, heroImage: e.target.value})}
                  />
                </div>
                <button 
                  onClick={() => openStorageBrowser('hero')}
                  className="px-6 py-4 bg-safari-100 text-safari-600 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 hover:bg-safari-200 transition-all shadow-sm"
                >
                  <Search size={18} /> Library
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Highlights */}
        <section className="pt-16 border-t border-safari-100">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-1 space-y-4">
              <h3 className="text-lg font-black text-safari-900 flex items-center gap-2">
                 <Sparkles className="text-safari-500" /> Key Highlights
              </h3>
              <p className="text-sm text-safari-500 leading-relaxed">Unique selling points that make this trip stand out.</p>
            </div>
            <div className="lg:col-span-2 space-y-4">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  className="flex-1 p-4 bg-white border border-safari-200 rounded-lg outline-none shadow-sm focus:ring-2 focus:ring-safari-400" 
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addHighlight()}
                  placeholder="e.g. Balloon Safari Included"
                />
                <button onClick={addHighlight} className="px-6 bg-safari-800 text-white rounded-lg shadow-md hover:bg-safari-900 transition-colors"><Plus /></button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.highlights.map((h, i) => (
                  <span key={i} className="flex items-center gap-2 px-4 py-2 bg-white text-safari-700 rounded-lg border border-safari-200 text-xs font-bold shadow-sm">
                    {h} <button onClick={() => removeHighlight(i)} className="hover:text-red-500 transition-colors"><X size={14} /></button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Includes & Excludes */}
        <section className="pt-16 border-t border-safari-100">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-1 space-y-4">
              <h3 className="text-lg font-black text-safari-900 flex items-center gap-2">
                 <FileCheck className="text-safari-500" /> Includes & Excludes
              </h3>
              <p className="text-sm text-safari-500 leading-relaxed">Define what is covered in the price and what travelers need to pay extra for.</p>
            </div>
            <div className="lg:col-span-2 space-y-12">
              {/* Includes */}
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-safari-400 uppercase tracking-widest mb-2">What's Included</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    className="flex-1 p-4 bg-white border border-safari-200 rounded-lg outline-none shadow-sm focus:ring-2 focus:ring-safari-400" 
                    value={includeInput}
                    onChange={(e) => setIncludeInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addInclude()}
                    placeholder="e.g. All park entrance fees"
                  />
                  <button onClick={addInclude} className="px-6 bg-safari-800 text-white rounded-lg shadow-md hover:bg-safari-900 transition-colors"><Plus /></button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(formData.includes || []).map((item, i) => (
                    <span key={i} className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg border border-green-100 text-xs font-bold shadow-sm">
                      {item} <button onClick={() => removeInclude(i)} className="hover:text-red-500 transition-colors"><X size={14} /></button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Excludes */}
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-safari-400 uppercase tracking-widest mb-2">What's Excluded</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    className="flex-1 p-4 bg-white border border-safari-200 rounded-lg outline-none shadow-sm focus:ring-2 focus:ring-safari-400" 
                    value={excludeInput}
                    onChange={(e) => setExcludeInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addExclude()}
                    placeholder="e.g. International flights"
                  />
                  <button onClick={addExclude} className="px-6 bg-safari-800 text-white rounded-lg shadow-md hover:bg-safari-900 transition-colors"><Plus /></button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(formData.excludes || []).map((item, i) => (
                    <span key={i} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg border border-red-100 text-xs font-bold shadow-sm">
                      {item} <button onClick={() => removeExclude(i)} className="hover:text-red-500 transition-colors"><X size={14} /></button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Gallery Section */}
        <section className="pt-16 border-t border-safari-100">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-1 space-y-4">
              <h3 className="text-lg font-black text-safari-900 flex items-center gap-2">
                 <ImageIcon className="text-safari-500" /> Safari Gallery
              </h3>
              <p className="text-sm text-safari-500 leading-relaxed">Add stunning visuals to showcase this safari. You can upload images or link to existing ones.</p>
              <div className="flex flex-col gap-3 pt-4">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  multiple 
                  accept="image/*" 
                  className="hidden" 
                />
                <button 
                  onClick={() => openStorageBrowser('gallery')}
                  className="w-full px-6 py-4 bg-safari-800 text-white rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 hover:bg-safari-900 transition-all shadow-lg"
                >
                  <Search size={18} /> Browse Image Library
                </button>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full px-6 py-4 bg-safari-100 text-safari-600 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 hover:bg-safari-200 transition-all shadow-sm"
                >
                  <UploadCloud size={18} /> {isUploading ? 'Uploading...' : 'Upload Directly'}
                </button>
              </div>
            </div>
            <div className="lg:col-span-2 space-y-8">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <LinkIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-safari-400" />
                  <input 
                    type="text" 
                    className="w-full pl-12 pr-4 py-4 bg-white border border-safari-200 rounded-xl outline-none shadow-sm focus:ring-2 focus:ring-safari-400 font-bold text-sm"
                    placeholder="Paste image URL from Supabase or external source"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addImageUrl()}
                  />
                </div>
                <button onClick={addImageUrl} className="px-8 bg-safari-800 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-lg hover:bg-safari-900 transition-all">
                  Add URL
                </button>
              </div>

              {formData.gallery && formData.gallery.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                  {formData.gallery.map((url, idx) => (
                    <div key={idx} className="group relative aspect-square rounded-2xl overflow-hidden border border-safari-200 bg-safari-50 shadow-md">
                      <img src={url} alt={`Gallery ${idx}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-safari-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button 
                          onClick={() => removeGalleryImage(idx)}
                          className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-2xl transform scale-75 group-hover:scale-100 duration-300"
                        >
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
                    <p className="text-sm font-black uppercase tracking-widest">Gallery Empty</p>
                    <p className="text-xs font-medium opacity-60">Upload or link images to get started.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Daily Schedule */}
        <section className="pt-16 border-t border-safari-100">
           <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black text-safari-900 flex items-center gap-3">
                 <LayoutGrid className="text-safari-500" /> Day-by-Day Journey
              </h3>
              <div className="flex gap-3">
              <button onClick={addSectionBreak} className="px-6 py-2 bg-safari-100 text-safari-700 rounded-lg font-bold text-xs uppercase flex items-center gap-2 shadow-sm hover:bg-safari-200 transition-all">
                <Layout size={16} /> Add Section Break
              </button>
              <button onClick={addDay} className="px-6 py-2 bg-safari-800 text-white rounded-lg font-bold text-xs uppercase flex items-center gap-2 shadow-md hover:bg-safari-900 transition-all">
                <Plus size={16} /> Add Range
              </button>
            </div>
           </div>
           
           <div className="space-y-6">
              {formData.schedule.map((day, dIdx) => (
                <div key={dIdx} className="bg-white rounded-xl border border-safari-200 shadow-lg overflow-hidden animate-fadeIn flex flex-col md:flex-row">
                  <div className={`${day.isSectionBreak ? 'bg-safari-600' : 'bg-safari-900'} md:w-28 flex md:flex-col items-center justify-center p-4 text-white font-black text-lg gap-4 text-center`}>
                     <div className="text-safari-400 text-[10px] uppercase tracking-widest hidden md:block">
                       {day.isSectionBreak ? 'Break' : 'Timeframe'}
                     </div>
                     {/* Normalized Day Display */}
                     {!day.isSectionBreak && (
                       <div>{day.dayLabel ? (day.dayLabel.match(/^day/i) ? day.dayLabel : `Day ${day.dayLabel}`) : `Day ${day.day}`}</div>
                     )}
                     {day.isSectionBreak && <Layout size={24} />}
                     <button onClick={() => removeDay(dIdx)} className="md:mt-auto p-2 text-white/40 hover:text-red-400 transition-colors"><Trash2 size={20} /></button>
                  </div>
                  
                  {day.isSectionBreak ? (
                    <div className="flex-1 p-8 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-black uppercase text-safari-400 mb-2">Section Title (Optional)</label>
                          <input 
                            className="w-full p-3 bg-white border border-safari-100 rounded-lg font-bold shadow-sm focus:ring-2 focus:ring-safari-400 outline-none" 
                            value={day.sectionTitle || ''} 
                            onChange={(e) => updateDay(dIdx, 'sectionTitle', e.target.value)} 
                            placeholder="e.g. The Magic of the Serengeti"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-black uppercase text-safari-400 mb-2">Section Description (Optional)</label>
                          <textarea 
                            className="w-full p-3 bg-white border border-safari-100 rounded-lg text-sm h-24 resize-none shadow-sm focus:ring-2 focus:ring-safari-400 outline-none" 
                            value={day.sectionDescription || ''} 
                            onChange={(e) => updateDay(dIdx, 'sectionDescription', e.target.value)} 
                            placeholder="A brief poetic interlude or summary of the next phase..."
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-black uppercase text-safari-400 mb-2">Background Image</label>
                          <div className="flex gap-4">
                            <div className="relative flex-1">
                              <LinkIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-safari-400" />
                              <input 
                                type="text" 
                                className="w-full pl-12 pr-4 py-3 bg-white border border-safari-200 rounded-lg outline-none shadow-sm focus:ring-2 focus:ring-safari-400 font-bold text-sm"
                                placeholder="Paste image URL"
                                value={day.sectionImage || ''}
                                onChange={(e) => updateDay(dIdx, 'sectionImage', e.target.value)}
                              />
                            </div>
                            <button 
                              onClick={() => openStorageBrowser('section', dIdx)}
                              className="px-6 py-3 bg-safari-100 text-safari-600 rounded-lg font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 hover:bg-safari-200 transition-all shadow-sm"
                            >
                              <Search size={18} /> Library
                            </button>
                          </div>
                          {day.sectionImage && (
                            <div className="mt-4 aspect-[21/9] rounded-lg overflow-hidden border border-safari-100">
                              <img src={day.sectionImage} alt="Section Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                       {/* Day Range Input with Visual Prefix */}
                       <div className="md:col-span-2">
                          <label className="block text-[10px] font-black uppercase text-safari-400 mb-2 flex items-center gap-1">
                            <Type size={12} /> Day Range / Label (Required)
                          </label>
                          <div className="relative">
                              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-safari-400 font-bold select-none text-sm">Day</div>
                              <input 
                                className="w-full pl-12 p-3 bg-white border border-safari-100 rounded-lg font-bold placeholder:text-safari-300 focus:ring-2 focus:ring-safari-400 outline-none shadow-sm" 
                                value={day.dayLabel ? day.dayLabel.replace(/^Day\s*/i, '') : ''} 
                                onChange={(e) => updateDay(dIdx, 'dayLabel', e.target.value)}
                                placeholder="1-2" 
                              />
                          </div>
                       </div>

                       <div className="md:col-span-2">
                          <label className="block text-[10px] font-black uppercase text-safari-400 mb-2">Headline</label>
                          <input className="w-full p-3 bg-white border border-safari-100 rounded-lg font-bold shadow-sm focus:ring-2 focus:ring-safari-400 outline-none" value={day.title} onChange={(e) => updateDay(dIdx, 'title', e.target.value)} />
                       </div>
                       <div className="md:col-span-2">
                          <label className="block text-[10px] font-black uppercase text-safari-400 mb-2">Experience Description</label>
                          <textarea className="w-full p-3 bg-white border border-safari-100 rounded-lg text-sm h-24 resize-none shadow-sm focus:ring-2 focus:ring-safari-400 outline-none" value={day.description} onChange={(e) => updateDay(dIdx, 'description', e.target.value)} />
                       </div>
                       <div>
                          <label className="block text-[10px] font-black uppercase text-safari-400 mb-2">Morning Expedition</label>
                          <input className="w-full p-3 bg-white border border-safari-100 rounded-lg text-xs font-bold shadow-sm focus:ring-2 focus:ring-safari-400 outline-none" value={day.morningActivity} onChange={(e) => updateDay(dIdx, 'morningActivity', e.target.value)} />
                       </div>
                       <div>
                          <label className="block text-[10px] font-black uppercase text-safari-400 mb-2">Afternoon Discovery</label>
                          <input className="w-full p-3 bg-white border border-safari-100 rounded-lg text-xs font-bold shadow-sm focus:ring-2 focus:ring-safari-400 outline-none" value={day.afternoonActivity} onChange={(e) => updateDay(dIdx, 'afternoonActivity', e.target.value)} />
                       </div>
                       <div>
                          <label className="block text-[10px] font-black uppercase text-safari-400 mb-2">Accommodation (Lodge Link)</label>
                          <select className="w-full p-3 bg-white border border-safari-200 rounded-lg text-xs font-bold shadow-sm outline-none focus:ring-2 focus:ring-safari-400" value={day.accommodation} onChange={(e) => updateDay(dIdx, 'accommodation', e.target.value)}>
                             <option value="">Manual Entry...</option>
                             {lodges.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
                          </select>
                          <input 
                             className="w-full mt-2 p-3 bg-white border border-safari-100 rounded-lg text-xs font-bold shadow-sm outline-none focus:ring-2 focus:ring-safari-400" 
                             placeholder="Type lodge name if not listed..."
                             value={String(day.accommodation)}
                             onChange={(e) => updateDay(dIdx, 'accommodation', e.target.value)}
                          />
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div>
                             <label className="block text-[10px] font-black uppercase text-safari-400 mb-2">Drive Time</label>
                             <input className="w-full p-3 bg-white border border-safari-100 rounded-lg text-xs font-bold shadow-sm focus:ring-2 focus:ring-safari-400 outline-none" value={day.driveTime} onChange={(e) => updateDay(dIdx, 'driveTime', e.target.value)} />
                          </div>
                          <div>
                             <label className="block text-[10px] font-black uppercase text-safari-400 mb-2">Meals</label>
                             <input className="w-full p-3 bg-white border border-safari-100 rounded-lg text-xs font-bold shadow-sm focus:ring-2 focus:ring-safari-400 outline-none" value={day.meals} onChange={(e) => updateDay(dIdx, 'meals', e.target.value)} />
                          </div>
                       </div>
                    </div>
                  )}
                </div>
              ))}
           </div>
        </section>
      </div>

      <div className="p-8 border-t border-safari-100 flex justify-end gap-4 bg-safari-50 sticky bottom-0 z-10 shadow-xl">
        <button onClick={onClose} className="px-8 py-3 font-bold text-safari-600 hover:text-safari-900 transition-colors">Cancel</button>
        <button onClick={handleSave} disabled={isSaving} className="px-12 py-3 bg-safari-800 text-white rounded-lg font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 disabled:opacity-50 transition-all">
          {isSaving ? 'Processing...' : 'Save Signature Safari'}
        </button>
      </div>
    </div>

    {/* Storage Browser Modal */}
      {isStorageBrowserOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-safari-950/90 backdrop-blur-xl animate-fadeIn p-4 md:p-8">
          <div className="bg-white w-full max-w-6xl h-full max-h-[95vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-white/20 relative">
            {/* Header */}
            <div className="p-6 md:p-8 border-b border-safari-100 flex justify-between items-center bg-safari-50/80 sticky top-0 z-20 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-safari-800 text-white rounded-2xl shadow-lg ring-4 ring-safari-800/10">
                  <ImageIcon size={24} />
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-black text-safari-900 leading-tight">
                    {selectionMode === 'hero' ? 'Select Hero Banner' : selectionMode === 'section' ? 'Select Section Image' : 'Company Asset Library'}
                  </h3>
                  <p className="text-[10px] text-safari-500 font-extrabold uppercase tracking-widest mt-0.5">
                    {selectionMode === 'hero' ? 'Choose a striking high-impact visual' : 'Curate your safari storytelling assets'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="hidden md:flex px-6 py-3 bg-safari-800 text-white rounded-xl font-black uppercase text-[10px] tracking-widest items-center gap-2 hover:bg-safari-950 transition-all shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
                >
                  <UploadCloud size={16} /> {isUploading ? 'Uploading...' : 'Direct Upload'}
                </button>
                <button 
                  onClick={() => setIsStorageBrowserOpen(false)} 
                  className="p-2 text-safari-400 hover:text-safari-900 transition-colors hover:bg-safari-100 rounded-full"
                >
                  <X size={28} />
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 bg-gray-50/50">
              {storageImages.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                  {storageImages.map((img, idx) => {
                    const isSelected = selectionMode === 'hero' 
                      ? formData.heroImage === img.url
                      : selectionMode === 'section'
                        ? (activeSectionIdx !== null && formData.schedule[activeSectionIdx].sectionImage === img.url)
                        : formData.gallery?.includes(img.url);
                    return (
                      <div 
                        key={idx} 
                        onClick={() => selectImage(img.url)}
                        className={`group relative aspect-[4/5] rounded-[1.8rem] overflow-hidden transition-all duration-500 cursor-pointer shadow-md hover:shadow-2xl border-2 ${
                          isSelected ? 'border-safari-600 ring-8 ring-safari-600/10 scale-[0.98]' : 'border-transparent hover:border-safari-400 hover:-translate-y-1.5'
                        }`}
                      >
                        <img src={img.url} alt={img.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" referrerPolicy="no-referrer" />
                        
                        <div className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-400 ${
                          isSelected ? 'bg-safari-950/40 opacity-100' : 'bg-safari-950/0 group-hover:bg-safari-950/40 opacity-0 group-hover:opacity-100'
                        }`}>
                          {isSelected ? (
                            <div className="bg-white text-safari-800 p-4 rounded-full shadow-2xl animate-bounce">
                              <Check size={28} strokeWidth={4} />
                            </div>
                          ) : (
                            <div className="bg-white/95 backdrop-blur-md text-safari-900 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border border-white/20 shadow-2xl transition-all hover:scale-110">
                              Choose
                            </div>
                          )}
                        </div>

                        {/* Labels */}
                        <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-safari-950/90 via-safari-950/40 to-transparent pt-12 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                          <p className="text-[9px] text-white/95 font-bold uppercase tracking-[0.2em] truncate drop-shadow-md">
                            {img.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ")}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-safari-300 space-y-6 py-20">
                  <div className="relative">
                    <div className="w-20 h-20 border-4 border-safari-100 border-t-safari-800 rounded-full animate-spin" />
                    <Compass className="absolute inset-0 m-auto text-safari-800 animate-pulse" size={24} />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-safari-900 animate-pulse">Syncing Library...</p>
                    <p className="text-[10px] font-bold text-safari-400 uppercase tracking-widest">Accessing secure cloud storage</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 md:p-8 border-t border-safari-100 bg-white sticky bottom-0 z-20 flex flex-col sm:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-6">
                <div className="flex -space-x-3">
                  {(formData.gallery?.slice(0, 5) || []).map((url, i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-white overflow-hidden shadow-lg bg-safari-50">
                      <img src={url} className="w-full h-full object-cover" />
                    </div>
                  ))}
                  {(formData.gallery?.length || 0) > 5 && (
                    <div className="w-10 h-10 rounded-full border-2 border-white bg-safari-800 text-white flex items-center justify-center text-[10px] font-black shadow-lg">
                      +{(formData.gallery?.length || 0) - 5}
                    </div>
                  )}
                </div>
                <div className="h-10 w-[1px] bg-safari-100 hidden sm:block" />
                <div>
                  <p className="text-[10px] text-safari-800 font-black uppercase tracking-widest">
                    {(formData.gallery?.length || 0)} Assets Selected
                  </p>
                  <p className="text-[9px] text-safari-400 font-bold uppercase tracking-wider mt-0.5">
                    Ready to be embedded in your itinerary
                  </p>
                </div>
              </div>
              <div className="flex gap-4 w-full sm:w-auto">
                <button 
                  onClick={() => setIsStorageBrowserOpen(false)}
                  className="flex-1 sm:flex-none px-12 py-4 bg-safari-900 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl hover:bg-black transition-all active:scale-95 hover:shadow-safari-900/20"
                >
                  Done Selecting
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default MasterItineraryEditor;
