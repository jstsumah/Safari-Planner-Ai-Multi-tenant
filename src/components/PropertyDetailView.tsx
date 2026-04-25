
import React, { useState } from 'react';
/* Removed MONTHS_LIST from the import as it's not exported from ../types */
import { Lodge } from '../types';
import { ChevronLeft, ChevronRight, MapPin, Check, ListChecks, Footprints, Sparkles, Info, Image as ImageIcon, X, ArrowLeft, CalendarDays } from 'lucide-react';

interface PropertyDetailViewProps {
  lodge: Lodge;
  customRate?: LodgeCustomRate | null;
  onBack: () => void;
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const PropertyDetailView: React.FC<PropertyDetailViewProps> = ({ lodge, customRate, onBack }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const images = (lodge.images && lodge.images.length > 0) ? lodge.images : [];

  const unitCategories = customRate ? customRate.unit_categories : (lodge.unit_categories || []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % Math.max(1, images.length));
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + images.length) % Math.max(1, images.length));

  return (
    <div className="animate-fadeIn max-w-6xl mx-auto space-y-6 pb-20 px-4 sm:px-0">
      {/* Lightbox Overlay */}
      {showLightbox && images.length > 0 && (
        <div 
          className="fixed inset-0 z-[110] bg-black/95 flex items-center justify-center p-4 animate-fadeIn cursor-zoom-out"
          onClick={() => setShowLightbox(false)}
        >
          <button className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors">
            <X size={32} />
          </button>
          <img 
            src={images[currentSlide]} 
            className="max-w-full max-h-full object-contain rounded-md shadow-2xl" 
            alt="Full size view"
          />
        </div>
      )}

      {/* Navigation Header */}
      <div className="flex items-center gap-4 py-2">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-safari-600 hover:text-safari-900 font-bold text-sm transition-colors group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          Back to Itinerary
        </button>
      </div>

      <div className="bg-white rounded-md overflow-hidden shadow-xl border border-safari-200">
        {/* Hero Slideshow Section */}
        <div className="relative h-[350px] md:h-[500px] bg-safari-900 group">
          {images.length > 0 ? (
            <>
              <div 
                className="w-full h-full cursor-zoom-in"
                onClick={() => setShowLightbox(true)}
              >
                <img 
                  src={images[currentSlide]} 
                  className="h-full w-full object-cover transition-all duration-700" 
                  alt={`${lodge.name} view ${currentSlide + 1}`}
                />
              </div>
              
              {images.length > 1 && (
                <>
                  <button 
                    onClick={(e) => { e.stopPropagation(); prevSlide(); }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-3 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); nextSlide(); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-3 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <ChevronRight size={24} />
                  </button>
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {images.map((_, i) => (
                      <button 
                        key={i} 
                        onClick={() => setCurrentSlide(i)}
                        className={`h-1.5 rounded-full transition-all ${i === currentSlide ? 'w-6 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/60'}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-safari-700">
              <ImageIcon size={48} opacity={0.3} />
            </div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none" />
          <div className="absolute bottom-8 left-8 right-8 text-white">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] bg-safari-600 px-3 py-1 rounded-sm mb-3 inline-block shadow-md">
              {lodge.property_type}
            </span>
            <h2 className="text-2xl md:text-4xl font-extrabold mb-1">{lodge.name}</h2>
            <div className="flex justify-between items-end">
              <p className="flex items-center gap-1.5 text-safari-200 text-sm font-medium">
                <MapPin size={16} /> {lodge.location}
              </p>
            </div>
          </div>
        </div>

        <div className="p-8 md:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-12">
              <section>
                <h3 className="text-xl font-bold text-safari-900 mb-4 flex items-center gap-2">
                  <Info size={24} className="text-safari-500" />
                  Experience The Wild
                </h3>
                <p className="text-safari-700 leading-relaxed text-lg whitespace-pre-wrap italic">
                  {lodge.description}
                </p>
              </section>

              {/* Seasonal Pricing Display */}
              {lodge.show_pricing !== false && (
                <section className="pt-8 border-t border-safari-100">
                  <h3 className="text-xl font-bold text-safari-900 mb-6 flex items-center gap-2">
                    <CalendarDays size={24} className="text-safari-500" />
                    Seasonal Rates & Validity
                  </h3>
                  
                  <div className="space-y-8">
                    {unitCategories.map((unit, idx) => (
                      <div key={idx} className="bg-safari-50 rounded-md border border-safari-100 overflow-hidden">
                        <div className="bg-safari-100 px-6 py-3 border-b border-safari-200 flex justify-between items-center">
                          <h4 className="font-bold text-safari-800 text-base">{unit.name}</h4>
                          <span className="text-[10px] font-black uppercase tracking-widest text-safari-400">Sleeps up to {unit.max_occupancy} guests</span>
                        </div>
                        <div className="p-0 overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-white/50 text-[10px] font-black uppercase text-safari-400">
                                <th className="px-6 py-3">Season</th>
                                <th className="px-6 py-3">Adult</th>
                                <th className="px-6 py-3">Teen (12-17)</th>
                                <th className="px-6 py-3">Child</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-safari-100">
                              {lodge.seasons?.map(s => {
                                const rate = unit.seasonal_rates?.find(r => r.seasonId === s.id);
                                return (
                                  <tr key={s.id} className="hover:bg-white/40 transition-colors">
                                    <td className="px-6 py-4">
                                      <div className="font-bold text-safari-900">{s.name}</div>
                                      <div className="text-[10px] text-safari-400">{MONTHS[s.startMonth-1]} {s.startDay} - {MONTHS[s.endMonth-1]} {s.endDay}</div>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-safari-800">${rate?.adultPrice || 0}</td>
                                    <td className="px-6 py-4 text-safari-600">${rate?.youngAdultPrice || 0}</td>
                                    <td className="px-6 py-4 text-safari-600">${rate?.childPrice || 0}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-8 border-t border-safari-100">
                {lodge.facilities && lodge.facilities.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-safari-400 flex items-center gap-2">
                      <ListChecks size={14} /> Signature Facilities
                    </h4>
                    <ul className="grid grid-cols-1 gap-2">
                      {lodge.facilities?.map((f, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-safari-700 text-sm">
                          <Check size={16} className="text-green-500 shrink-0 mt-0.5" /> <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {lodge.activities && lodge.activities.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-safari-400 flex items-center gap-2">
                      <Footprints size={14} /> Guest Activities
                    </h4>
                    <ul className="grid grid-cols-1 gap-2">
                      {lodge.activities?.map((a, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-safari-700 text-sm">
                          <div className="w-1.5 h-1.5 bg-safari-400 rounded-full shrink-0 mt-1.5" /> <span>{a}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-safari-800 p-8 rounded-md text-white shadow-2xl relative overflow-hidden">
                <div className="relative z-10">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-safari-300 mb-6">Booking Information</h4>
                  <div className="space-y-6">
                    {lodge.show_pricing !== false && (
                      <div>
                        <span className="text-[10px] text-safari-400 block uppercase font-black mb-1">Starting Rate</span>
                        <span className="text-4xl font-black">
                          ${Math.min(...unitCategories.flatMap(u => (u.seasonal_rates || []).map(r => r.adultPrice)))}<span className="text-sm font-medium text-safari-400 ml-1">/pppn</span>
                        </span>
                      </div>
                    )}
                    <div className="pt-6 border-t border-white/10">
                      <span className="text-[10px] text-safari-400 block uppercase font-black mb-1">Collection Tier</span>
                      <span className="text-lg font-bold text-safari-100">{lodge.tier?.split('(')[0]}</span>
                    </div>
                  </div>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-safari-600/20 rounded-full blur-3xl -mr-16 -mt-16" />
              </div>

              {lodge.amenities && lodge.amenities.length > 0 && (
                <div className="bg-white p-6 rounded-md border border-safari-100 shadow-sm">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-safari-400 mb-4 flex items-center gap-2">
                    <Sparkles size={14} /> Refined Comforts
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {lodge.amenities?.map((a, i) => (
                      <span key={i} className="text-[10px] bg-safari-50 text-safari-700 px-3 py-1.5 rounded-md border border-safari-100 font-bold">{a}</span>
                    ))}
                  </div>
                </div>
              )}
              
              <button 
                onClick={onBack}
                className="w-full py-4 bg-safari-100 text-safari-800 rounded-md font-black text-sm uppercase tracking-widest hover:bg-safari-200 transition-all active:scale-[0.98] border border-safari-200"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailView;
