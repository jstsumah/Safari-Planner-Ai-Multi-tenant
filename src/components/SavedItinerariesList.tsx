
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { GeneratedItinerary, SafariFormData } from '../types';
import { Search, Loader2, Calendar, MapPin, Users, Trash2, Edit3, Eye, Compass, ArchiveX, AlertCircle, Info, RotateCcw, Clock, X } from 'lucide-react';

interface SavedItinerariesListProps {
  initialEmail: string;
  initialResults: any[];
  companyId?: string;
  onSearchUpdate: (email: string, results: any[]) => void;
  onView: (itinerary: GeneratedItinerary, formData: SafariFormData) => void;
  onEdit: (formData: SafariFormData) => void;
  onBack: () => void;
}

const SavedItinerariesList: React.FC<SavedItinerariesListProps> = ({ 
  initialEmail, 
  initialResults, 
  companyId,
  onSearchUpdate, 
  onView, 
  onEdit, 
  onBack 
}) => {
  const [email, setEmail] = useState(initialEmail);
  const [results, setResults] = useState<any[]>(initialResults);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(initialResults.length > 0 || !!initialEmail);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Sync internal state if initial results were updated externally
  useEffect(() => {
    // Defer to avoid synchronous update warning
    const timeoutId = setTimeout(() => {
      setResults(prev => JSON.stringify(prev) !== JSON.stringify(initialResults) ? initialResults : prev);
      setEmail(prev => prev !== initialEmail ? initialEmail : prev);
      if (initialResults.length > 0 || initialEmail) {
        setHasSearched(true);
      }
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [initialResults, initialEmail]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const searchEmail = email.trim();
    if (!searchEmail) return;

    setIsLoading(true);
    setHasSearched(true);
    setSearchError(null);
    
    try {
      let query = supabase
        .from('itineraries')
        .select('*')
        .eq('customer_email', searchEmail.toLowerCase());
      
      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      
      const filtered = data?.filter(item => 
        item.customer_email?.toLowerCase().includes(searchEmail.toLowerCase())
      ) || [];
      
      setResults(filtered);
      onSearchUpdate(searchEmail, filtered);
    } catch (err: any) {
      console.error("Error searching itineraries:", err);
      setSearchError(err.message || "An unexpected error occurred while searching.");
    } finally {
      setIsLoading(false);
    }
  };

  const clearSearch = () => {
    setEmail('');
    setResults([]);
    setHasSearched(false);
    setSearchError(null);
    onSearchUpdate('', []);
  };

  const handleScheduleDelete = async (id: string) => {
    if (!confirm("This will schedule the itinerary for permanent deletion in 14 days. Proceed?")) return;
    
    const now = new Date().toISOString();
    try {
      const { error } = await supabase
        .from('itineraries')
        .update({ delete_requested_at: now })
        .eq('id', id);
        
      if (error) throw error;
      
      const newResults = results.map(r => r.id === id ? { ...r, delete_requested_at: now } : r);
      setResults(newResults);
      onSearchUpdate(email, newResults);
      
    } catch (err: any) {
      console.error("Delete scheduling error:", err);
      alert("Failed to schedule deletion: " + err.message);
    }
  };

  const handleUndoDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('itineraries')
        .update({ delete_requested_at: null })
        .eq('id', id);
        
      if (error) throw error;
      
      const newResults = results.map(r => r.id === id ? { ...r, delete_requested_at: null } : r);
      setResults(newResults);
      onSearchUpdate(email, newResults);
    } catch (err: any) {
      console.error("Undo delete error:", err);
      alert("Failed to restore itinerary.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      <div className="bg-white rounded-md shadow-xl overflow-hidden border border-safari-100">
        <div className="bg-safari-800 p-8 text-white relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-2xl md:text-3xl font-black mb-2 flex items-center gap-3">
              <Compass className="text-safari-400" /> Retrieve Your Safaris
            </h2>
            <p className="text-safari-300 text-sm md:text-base max-w-lg">
              Enter the email address you used during your previous planning session.
            </p>
            
            <form onSubmit={handleSearch} className="mt-6 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-safari-400" size={18} />
                <input 
                  type="email" 
                  required
                  placeholder="your.email@example.com"
                  className="w-full bg-white/10 border border-white/20 text-white p-3.5 pl-10 pr-10 rounded outline-none focus:ring-2 focus:ring-safari-400 transition-all placeholder:text-white/30"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {email && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors p-1"
                    title="Clear search"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
              <button 
                type="submit"
                disabled={isLoading || !email.trim()}
                className="bg-safari-500 hover:bg-safari-400 text-white px-8 py-3.5 rounded font-bold transition-all shadow-lg flex items-center gap-2 disabled:opacity-50 w-fit"
              >
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : "Search"}
              </button>
            </form>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-safari-700/30 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        </div>

        <div className="p-8 bg-safari-50/30 min-h-[300px]">
          {searchError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-md flex items-center gap-3 text-sm font-medium animate-fadeIn">
              <AlertCircle size={18} />
              {searchError}
            </div>
          )}

          {!hasSearched ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-safari-400">
              <Search size={48} className="mb-4 opacity-20" />
              <p className="text-sm font-medium tracking-wide">Enter your email to find your saved adventures.</p>
            </div>
          ) : isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-safari-400">
              <Loader2 className="animate-spin mb-4" size={32} />
              <p className="text-sm font-medium tracking-wide uppercase">Consulting the archives...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center animate-fadeIn">
              <ArchiveX size={48} className="text-safari-200 mb-4" />
              <h3 className="text-lg font-bold text-safari-900">No Itineraries Found</h3>
              <p className="text-safari-600 text-sm max-w-xs mt-2">Check the email spelling or start a new plan.</p>
              <button onClick={onBack} className="mt-8 text-safari-600 font-bold border-b border-safari-600 pb-0.5 hover:text-safari-800 transition-colors">Return to Planner</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
              {results.map((res) => {
                const itin = res.itinerary_data as GeneratedItinerary;
                const form = res.form_data as SafariFormData;
                const isPendingDelete = !!res.delete_requested_at;
                const dateString = new Date(res.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                
                return (
                  <div key={res.id} className={`bg-white rounded-md border-2 transition-all group overflow-hidden flex flex-col ${
                    isPendingDelete ? 'border-red-100 opacity-80' : 'border-safari-200 hover:border-safari-400 shadow-sm hover:shadow-md'
                  }`}>
                    <div className="p-5 flex-1 relative">
                      {isPendingDelete && (
                        <div className="absolute top-0 right-0 bg-red-500 text-white text-[9px] font-black uppercase px-2 py-1 rounded-bl-sm flex items-center gap-1 z-10 shadow-sm animate-pulse">
                          <Clock size={10} /> Deletion Scheduled
                        </div>
                      )}
                      
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-safari-400 bg-safari-50 px-2 py-1 rounded">Saved {dateString}</span>
                        <div className="flex gap-1">
                           {!isPendingDelete ? (
                             <button 
                              onClick={() => handleScheduleDelete(res.id)} 
                              className="p-1.5 text-safari-300 hover:text-red-500 transition-colors"
                              title="Schedule for Deletion"
                             >
                              <Trash2 size={16} />
                             </button>
                           ) : (
                             <button 
                              onClick={() => handleUndoDelete(res.id)} 
                              className="p-1.5 text-blue-400 hover:text-blue-600 transition-colors"
                              title="Restore Safari"
                             >
                              <RotateCcw size={16} />
                             </button>
                           )}
                        </div>
                      </div>
                      
                      <h4 className={`text-base font-extrabold leading-tight mb-2 transition-colors ${
                        isPendingDelete ? 'text-gray-400 line-through' : 'text-safari-900 group-hover:text-safari-600'
                      }`}>
                        {itin.tripTitle}
                      </h4>
                      
                      <div className="space-y-2 mt-4">
                        <div className="flex items-center gap-2 text-xs font-medium text-safari-600">
                          <Calendar size={14} className="text-safari-400" /> {form.durationDays} Days • {form.startDate}
                        </div>
                        <div className="flex items-center gap-2 text-xs font-medium text-safari-600">
                          <Users size={14} className="text-safari-400" /> {form.adults + form.youngAdults + form.children} Travelers
                        </div>
                        <div className="flex items-center gap-2 text-xs font-medium text-safari-600 line-clamp-1">
                          <MapPin size={14} className="text-safari-400 shrink-0" /> {form.destinations.join(', ')}
                        </div>
                      </div>

                      {isPendingDelete && (
                        <div className="mt-4 p-2 bg-red-50 text-red-700 text-[10px] font-bold rounded-md flex items-center gap-2">
                           <Info size={12} /> This record will be purged from the archive in 14 days.
                        </div>
                      )}
                    </div>

                    <div className={`p-4 border-t flex gap-2 justify-end ${isPendingDelete ? 'bg-gray-50 border-gray-100' : 'bg-safari-50 border-safari-100'}`}>
                      <button 
                        onClick={() => onView(itin, form)}
                        disabled={isPendingDelete}
                        className="flex items-center justify-center gap-2 py-2 px-6 bg-white border border-safari-200 text-safari-800 text-xs font-bold rounded hover:bg-safari-100 transition-all shadow-sm active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Eye size={14} /> View
                      </button>
                      <button 
                        onClick={() => onEdit(form)}
                        disabled={isPendingDelete}
                        className="flex items-center justify-center gap-2 py-2 px-6 bg-safari-800 text-white text-xs font-bold rounded hover:bg-safari-900 shadow-md transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Edit3 size={14} /> Edit Safari
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SavedItinerariesList;
