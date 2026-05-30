
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { GeneratedItinerary, SafariFormData, Lodge, BrandingConfig, TeamMember } from '../types';
import { Download, Mail, Check, RefreshCw, MapPin, Home, ChevronRight, ChevronLeft, Maximize2, Edit3, Loader2, ArrowLeft, Share2, Image as ImageIcon, Calculator, Phone, MessageSquare, Send, ExternalLink, X, User } from 'lucide-react';
import { generateItineraryPDF } from '../services/pdfService';
import { saveItineraryToDatabase } from '../services/aiService';
import EmailModal from './EmailModal';
import BookingForm from './BookingForm';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface ItineraryViewProps {
  itinerary: GeneratedItinerary;
  formData: SafariFormData;
  lodges: Lodge[];
  branding: BrandingConfig;
  onReset: () => void;
  onEdit: () => void;
  onViewLodge: (lodge: Lodge) => void;
  onBackToHistory?: () => void;
  onAuthNeeded?: (mode: 'signup' | 'signin', type: 'user') => void;
  isFromAdmin?: boolean;
  isSharedView?: boolean;
  masterId?: string;
  itinId?: string;
}

const ItineraryView: React.FC<ItineraryViewProps> = ({ 
  itinerary, 
  formData, 
  lodges, 
  branding,
  onReset, 
  onEdit, 
  onViewLodge, 
  onBackToHistory,
  onAuthNeeded,
  isFromAdmin = false,
  isSharedView = false,
  masterId,
  itinId
}) => {
  const { user } = useAuth();
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [specialist, setSpecialist] = useState<TeamMember | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const handlePrevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (lightboxIndex !== null && itinerary.gallery) {
      setLightboxIndex(lightboxIndex === 0 ? itinerary.gallery.length - 1 : lightboxIndex - 1);
    }
  };

  const handleNextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (lightboxIndex !== null && itinerary.gallery) {
      setLightboxIndex(lightboxIndex === itinerary.gallery.length - 1 ? 0 : lightboxIndex + 1);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === 'ArrowRight') handleNextImage();
      if (e.key === 'ArrowLeft') handlePrevImage();
      if (e.key === 'Escape') setLightboxIndex(null);
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, itinerary.gallery]);

  useEffect(() => {
    if (lightboxIndex !== null) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [lightboxIndex]);

  useEffect(() => {
    const fetchSpecialist = async () => {
      if (!itinerary.specialist_id) return;
      try {
        const { data, error } = await supabase
          .from('team_members')
          .select('*')
          .eq('id', itinerary.specialist_id)
          .single();
        
        if (!error && data) {
          setSpecialist(data);
        }
      } catch (err) {
        console.error('Error fetching specialist:', err);
      }
    };

    fetchSpecialist();
  }, [itinerary.specialist_id]);

  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [isPersisting, setIsPersisting] = useState(false);
  const [hasPersisted, setHasPersisted] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  // Auto-persist lead when they interact
  const captureLead = async () => {
    if (hasPersisted || onBackToHistory) return; // Don't re-save if loaded from history/admin
    setIsPersisting(true);
    try {
      await saveItineraryToDatabase(itinerary, formData, itinerary.company_id);
      setHasPersisted(true);
    } catch (err) {
      console.error("Lead capture failed", err);
    } finally {
      setIsPersisting(false);
    }
  };

  const handleDownloadPDF = async () => {
    await captureLead();
    const blob = generateItineraryPDF(itinerary, formData, branding);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Safari_Itinerary_${formData.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenEmailModal = async () => {
    await captureLead();
    const blob = generateItineraryPDF(itinerary, formData, branding);
    setPdfBlob(blob);
    setIsEmailModalOpen(true);
  };

  const handleEditClick = async () => {
    await captureLead();
    onEdit();
  };

  const handleShareLink = async () => {
    setIsPersisting(true);
    try {
      let id = masterId || itinId;
      
      // If we don't have an ID (e.g. fresh generation), save it
      if (!id) {
        id = await saveItineraryToDatabase(itinerary, formData);
      }
      
      if (id) {
        const param = masterId ? 'master' : 'itin';
        // Ensure we point to the root for public links, not /admin
        const baseUrl = window.location.origin + window.location.pathname.replace(/\/admin$/, '');
        const shareUrl = `${baseUrl}${baseUrl.endsWith('/') ? '' : '/'}?${param}=${id}`;
        await navigator.clipboard.writeText(shareUrl);
        setIsCopying(true);
        toast.success("Public link copied to clipboard!");
        setTimeout(() => setIsCopying(false), 3000);
        setHasPersisted(true);
      }
    } catch (err) {
      console.error("Share failed", err);
      toast.error("Failed to generate share link");
    } finally {
      setIsPersisting(false);
    }
  };

  const findMatchingLodge = (accommodationName: string) => {
    if (!accommodationName || !lodges) return undefined;
    return lodges.find(l => {
      const lodgeName = l.name || '';
      return accommodationName.toLowerCase().includes(lodgeName.toLowerCase()) || 
             lodgeName.toLowerCase().includes(accommodationName.toLowerCase());
    });
  };

  const scrollToBooking = () => {
    const element = document.getElementById('booking-form');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn pb-20 relative">
      {/* Branding Header */}
      {branding?.agencyLogo && (
        <div className="flex justify-between items-center bg-white border border-safari-100 p-4 rounded-xl shadow-sm">
          <img src={branding.agencyLogo} alt="Logo" className="h-10 w-auto object-contain" referrerPolicy="no-referrer" />
          <div className="text-right">
            <p className="text-[10px] font-black uppercase text-safari-400 tracking-widest leading-none mb-1">Proposal By</p>
            <p className="text-sm font-bold text-safari-900 leading-none">{branding?.agencyName || branding?.appName}</p>
          </div>
        </div>
      )}

      <EmailModal 
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        formData={formData}
        itinerary={itinerary}
        pdfBlob={pdfBlob}
        branding={branding}
      />

      {/* Hero Banner */}
      {itinerary.heroImage && (
        <div className="relative w-full h-[400px] md:h-[500px] rounded-lg overflow-hidden shadow-2xl mb-12 group">
          <img 
            src={itinerary.heroImage} 
            alt={itinerary.tripTitle} 
            className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end px-12 pb-10 md:p-12">
            <div className="max-w-3xl">
              <h1 className="text-[25px] sm:text-5xl md:text-[60px] leading-tight md:leading-[60px] max-w-[640px] font-black text-white mb-4 drop-shadow-lg pr-6">
                {itinerary.tripTitle}
              </h1>
              <div className="flex flex-wrap gap-6 text-white/90 font-bold text-sm md:text-base">
                <span className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/30">
                  <MapPin size={18} className="text-safari-300" /> {(itinerary.schedule || []).length} Segments
                </span>
                <span className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/30">
                  <Calculator size={18} className="text-safari-300" /> {String(itinerary.totalEstimatedCost)}
                </span>
                <button 
                  onClick={scrollToBooking}
                  className="flex items-center gap-2 bg-safari-500 text-white px-6 py-2 rounded-full hover:bg-safari-600 transition-all shadow-lg active:scale-95"
                >
                  <Send size={18} /> Book Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Navigation Back Button */}
      {onBackToHistory && (
        <button 
          onClick={onBackToHistory}
          className="flex items-center gap-2 text-safari-600 hover:text-safari-900 font-bold text-sm transition-all group mb-2"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          {isFromAdmin ? "Back to Booking Leads" : "Back to History"}
        </button>
      )}

      {isSharedView && !onBackToHistory && (
        <button 
          onClick={onReset}
          className="flex items-center gap-2 text-safari-600 hover:text-safari-900 font-bold text-sm transition-all group mb-4"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </button>
      )}

      <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-8 rounded-md shadow-sm border border-safari-200">
        {/* Absolute Badge in the top far right corner - Moved up to avoid overlap */}
        {(hasPersisted || onBackToHistory) && (
          <div className="absolute top-[-10px] right-4 animate-fadeIn z-10">
            <span className="text-[9px] bg-green-600 text-white px-2.5 py-1 rounded-full border-2 border-white flex items-center gap-1 font-black uppercase tracking-wider shadow-lg">
              <Check size={10} strokeWidth={4} /> {isFromAdmin ? "Active Lead Profile" : (onBackToHistory ? "Archived Itinerary" : "Saved to Leads")}
            </span>
          </div>
        )}

        {!itinerary.heroImage && (
          <div className="flex-1 pr-0 md:pr-12">
            <div className="mb-1">
               <h1 className="text-3xl font-bold text-safari-900 leading-tight">{itinerary.tripTitle}</h1>
            </div>
            <div className="flex flex-wrap gap-4 mt-2 text-safari-600 font-medium">
              <span className="flex items-center"><MapPin size={16} className="mr-1 text-safari-400" /> {(itinerary.schedule || []).length} Segments</span>
              <span className="text-safari-300">•</span>
              <span className="font-bold">{String(itinerary.totalEstimatedCost)}</span>
              <span className="text-safari-300">•</span>
              <span>{formData.adults + formData.youngAdults + formData.children} Travelers</span>
            </div>
          </div>
        )}

        {itinerary.heroImage && (
          <div className="flex-1 pr-0 md:pr-12">
            <div className="flex flex-wrap gap-4 text-safari-600 font-medium">
              <span>{formData.adults + formData.youngAdults + formData.children} Travelers</span>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {(!isSharedView || masterId) && (
              <button 
                onClick={handleEditClick}
                disabled={isPersisting}
                className="w-auto flex items-center justify-center px-3 py-1.5 bg-white border border-safari-300 text-safari-700 rounded-md hover:bg-safari-50 transition-all shadow-sm active:scale-95 disabled:opacity-50 text-[10px] font-black uppercase tracking-wider"
              >
                <Edit3 size={14} className="mr-1.5" /> {isSharedView ? "Customize" : "Edit"}
              </button>
            )}
            
            {(isFromAdmin || !isSharedView || masterId) && (
              <button 
                onClick={handleShareLink}
                disabled={isPersisting}
                className="w-auto flex items-center justify-center px-3 py-1.5 bg-white border border-safari-300 text-safari-700 rounded-md hover:bg-safari-50 transition-all shadow-sm active:scale-95 disabled:opacity-50 text-[10px] font-black uppercase tracking-wider"
              >
                {isCopying ? <Check size={14} className="mr-1.5 text-green-600" /> : <Share2 size={14} className="mr-1.5" />} 
                {isCopying ? "Copied!" : "Share Link"}
              </button>
            )}

            <button 
              onClick={handleDownloadPDF} 
              disabled={isPersisting}
              className="w-auto flex items-center justify-center px-3 py-1.5 bg-safari-600 text-white rounded-md hover:bg-safari-700 transition-all shadow-md active:scale-95 disabled:opacity-50 text-[10px] font-black uppercase tracking-wider"
            >
              {isPersisting ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Download size={14} className="mr-1.5" />} PDF
            </button>
            <button 
              onClick={handleOpenEmailModal} 
              disabled={isPersisting}
              className="w-auto flex items-center justify-center px-3 py-1.5 bg-safari-800 text-white rounded-md hover:bg-safari-900 transition-all shadow-md active:scale-95 disabled:opacity-50 text-[10px] font-black uppercase tracking-wider"
            >
              <Mail size={14} className="mr-1.5" /> Email
            </button>
            {!user && onAuthNeeded && (
              <button 
                onClick={() => onAuthNeeded('signup', 'user')}
                disabled={isPersisting}
                className="w-auto flex items-center justify-center px-3 py-1.5 bg-safari-500 text-white rounded-md hover:bg-safari-600 transition-all shadow-md active:scale-95 disabled:opacity-50 text-[10px] font-black uppercase tracking-wider"
              >
                <User size={14} className="mr-1.5" /> Save to Profile
              </button>
            )}
             {!isFromAdmin && !isSharedView && (
               <button onClick={onReset} className="w-auto flex items-center justify-center px-4 py-2 bg-white border border-safari-200 text-safari-700 rounded-md hover:bg-safari-50 transition-all active:scale-95 text-[10px] font-black uppercase tracking-wider">
                <RefreshCw size={16} className="mr-2" /> New Trip
              </button>
             )}
        </div>
      </div>

      <div className="bg-white p-8 rounded-md shadow-xl border-t-8 border-safari-500">
        <h2 className="text-xl font-bold text-safari-800 mb-4 flex items-center">Adventure Summary</h2>
        <p className="text-safari-700 leading-relaxed text-lg italic">"{itinerary.summary}"</p>
        <div className="mt-8 pt-8 border-t border-safari-100">
            <h3 className="text-xs font-bold uppercase tracking-widest text-safari-400 mb-4">Unforgettable Highlights</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(itinerary.highlights || []).map((h, i) => (
                    <div key={i} className="flex items-start bg-safari-50/50 p-3 rounded-md border border-safari-100">
                        <Check size={16} className="text-green-600 mr-2 mt-1 shrink-0" />
                        <span className="text-safari-800 text-sm font-medium">{h}</span>
                    </div>
                ))}
            </div>
        </div>

        {/* Includes & Excludes */}
        {((itinerary.includes && itinerary.includes.length > 0) || (itinerary.excludes && itinerary.excludes.length > 0)) && (
          <div className="mt-12 pt-12 border-t border-safari-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* Includes */}
              {itinerary.includes && itinerary.includes.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-safari-400 mb-6 flex items-center gap-2">
                    <Check size={14} className="text-green-600" /> What's Included
                  </h3>
                  <ul className="space-y-3">
                    {itinerary.includes.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-safari-700 text-sm">
                        <div className="mt-1 p-0.5 bg-green-100 text-green-600 rounded-full">
                          <Check size={10} strokeWidth={4} />
                        </div>
                        <span className="font-medium">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Excludes */}
              {itinerary.excludes && itinerary.excludes.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-safari-400 mb-6 flex items-center gap-2">
                    <X size={14} className="text-red-600" /> What's Excluded
                  </h3>
                  <ul className="space-y-3">
                    {itinerary.excludes.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-safari-700 text-sm">
                        <div className="mt-1 p-0.5 bg-red-100 text-red-600 rounded-full">
                          <X size={10} strokeWidth={4} />
                        </div>
                        <span className="font-medium">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Gallery Section */}
        {itinerary.gallery && itinerary.gallery.length > 0 && (
          <div className="mt-12 pt-12 border-t border-safari-100">
            <h3 className="text-xs font-bold uppercase tracking-widest text-safari-400 mb-6 flex items-center gap-2">
              <ImageIcon size={14} /> Safari Gallery
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {itinerary.gallery.map((url, i) => (
                <div key={i} className="aspect-square rounded-md overflow-hidden border border-safari-100 shadow-sm hover:shadow-md transition-all group cursor-pointer">
                  <img 
                    src={url} 
                    alt={`Gallery ${i}`} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                    referrerPolicy="no-referrer"
                    onClick={() => setLightboxIndex(i)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Dynamic Route Map */}
      {(() => {
        if (!itinerary.schedule || itinerary.schedule.length === 0) return null;
        
        const locations = itinerary.schedule
          .filter(day => !day.isSectionBreak)
          .map(day => {
            let loc = day.accommodation;
            if (!loc || loc.toLowerCase() === 'none' || loc.toLowerCase().includes('flight')) {
               if (day.title) {
                 const match = day.title.match(/in (.+?)$/i) || day.title.match(/to (.+?)$/i);
                 if (match && match[1]) {
                   loc = match[1].trim();
                 } else {
                   const parts = day.title.split(':');
                   if (parts.length > 1) {
                     loc = parts[1].trim();
                   }
                 }
               }
            }
            if (loc) {
               return loc.replace(/\(.*?\)/g, '').trim();
            }
            return null;
          })
          .filter(Boolean) as string[];

        const uniqueLocations: string[] = [];
        locations.forEach(loc => {
          if (uniqueLocations.length === 0 || uniqueLocations[uniqueLocations.length - 1] !== loc) {
            uniqueLocations.push(loc);
          }
        });

        if (uniqueLocations.length < 2) return null;

        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        let mapUrl = '';

        if (apiKey) {
          const origin = encodeURIComponent(uniqueLocations[0]);
          const destination = encodeURIComponent(uniqueLocations[uniqueLocations.length - 1]);
          const waypoints = uniqueLocations.slice(1, -1).map(loc => encodeURIComponent(loc)).join('|');
          
          mapUrl = `https://www.google.com/maps/embed/v1/directions?key=${apiKey}&origin=${origin}&destination=${destination}`;
          if (waypoints) {
            mapUrl += `&waypoints=${waypoints}`;
          }
        } else {
          const origin = encodeURIComponent(uniqueLocations[0]);
          const daddr = uniqueLocations.slice(1).map(loc => encodeURIComponent(loc)).join('+to:');
          mapUrl = `https://maps.google.com/maps?saddr=${origin}&daddr=${daddr}&output=embed`;
        }

        return (
          <div className="bg-white p-8 rounded-md shadow-xl border-t-8 border-safari-300 mb-8">
            <h2 className="text-xl font-bold text-safari-800 mb-6 flex items-center gap-2">
              <MapPin className="text-safari-500" /> Route Map
            </h2>
            <div className="w-full aspect-[4/3] md:aspect-[21/9] rounded-lg overflow-hidden border border-safari-100 bg-safari-50 relative">
              <iframe
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: 0 }}
                src={mapUrl}
                allowFullScreen
                title="Itinerary Route Map"
              ></iframe>
              {!apiKey && (
                 <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-3 py-1 text-[10px] uppercase tracking-widest font-bold text-safari-500 rounded shadow-sm">
                   Basic Map View
                 </div>
              )}
            </div>
          </div>
        );
      })()}

      <div className="space-y-10 relative before:absolute before:left-6 md:before:left-16 before:top-4 before:bottom-4 before:w-0.5 before:bg-safari-200">
        {(itinerary.schedule || []).map((day, idx) => {
          if (day.isSectionBreak) {
            return (
              <div key={idx} className="relative py-12 md:py-20">
                <div className="relative w-full aspect-[21/9] md:aspect-[3/1] rounded-lg overflow-hidden shadow-2xl group">
                  {day.sectionImage ? (
                    <img 
                      src={day.sectionImage} 
                      alt={day.sectionTitle || 'Section Break'} 
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full bg-safari-900 flex items-center justify-center">
                      <ImageIcon size={64} className="text-safari-800 opacity-50" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8 md:p-16">
                    <div className="max-w-3xl animate-fadeIn">
                      {day.sectionTitle && (
                        <h2 className="text-3xl md:text-5xl font-black text-white mb-4 drop-shadow-xl tracking-tight">
                          {day.sectionTitle}
                        </h2>
                      )}
                      {day.sectionDescription && (
                        <p className="text-white/90 text-lg md:text-xl font-medium leading-relaxed drop-shadow-lg max-w-2xl italic">
                          {day.sectionDescription}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          const matchedLodge = findMatchingLodge(day.accommodation);
          const dayDisplay = day.dayLabel 
            ? (typeof day.dayLabel === 'string' && day.dayLabel.match(/^day/i) ? day.dayLabel : `Day ${day.dayLabel}`) 
            : `Day ${day.day}`;
          
          return (
            <div key={idx} className="relative pl-14 md:pl-32 group">
              <div className="absolute left-4 md:left-14 top-8 w-4 h-4 rounded-full bg-safari-600 border-4 border-white shadow-sm z-10" />
              <div className="bg-white rounded-md overflow-hidden shadow-lg border border-safari-100 hover:border-safari-300 transition-all">
                <div className="flex flex-col">
                  <div className="bg-safari-600 p-3 flex items-center justify-between text-white md:hidden">
                    <span className="font-bold">{dayDisplay}</span>
                    <span className="text-xs opacity-80">{day.driveTime}</span>
                  </div>
                  <div className="p-6 md:p-8">
                    <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
                      <div>
                        <div className="hidden md:block text-xs font-bold text-safari-500 uppercase tracking-widest mb-1">{dayDisplay} • Travel: {day.driveTime}</div>
                        <h3 className="text-2xl font-bold text-safari-900">{day.title}</h3>
                      </div>
                      
                      <button 
                        onClick={() => matchedLodge && onViewLodge(matchedLodge)}
                        disabled={!matchedLodge}
                        className={`flex items-center text-sm font-bold px-4 py-2 rounded-md border transition-all self-start md:self-center group/btn ${
                          matchedLodge 
                            ? 'text-safari-800 bg-safari-50 border-safari-200 hover:bg-safari-100 hover:border-safari-400 cursor-pointer shadow-sm active:scale-95' 
                            : 'text-gray-400 bg-gray-50 border-gray-100 cursor-default'
                        }`}
                      >
                        <Home size={14} className={`mr-2 ${matchedLodge ? 'text-safari-500' : 'text-gray-300'}`} />
                        {String(day.accommodation)}
                        {matchedLodge && <Maximize2 size={12} className="ml-2 text-safari-400 opacity-0 group-hover/btn:opacity-100 transition-opacity" />}
                      </button>
                    </div>

                    <p className="text-safari-700 mb-8 leading-relaxed text-lg">{day.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                      <div className="bg-safari-50 p-4 rounded-md border border-safari-100">
                        <span className="block text-[10px] text-safari-400 uppercase font-bold tracking-widest mb-2">Morning Expedition</span>
                        <div className="text-safari-800 font-bold flex items-center gap-2"><ChevronRight size={14} className="text-safari-400" />{day.morningActivity}</div>
                      </div>
                      <div className="bg-safari-50 p-4 rounded-md border border-safari-100">
                         <span className="block text-[10px] text-safari-400 uppercase font-bold tracking-widest mb-2">Afternoon Discovery</span>
                         <div className="text-safari-800 font-bold flex items-center gap-2"><ChevronRight size={14} className="text-safari-400" />{day.afternoonActivity}</div>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-safari-50 flex items-center justify-between text-[11px] font-bold text-safari-400 uppercase tracking-widest">
                       <span>Meals: {day.meals}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Booking & Contact Section */}
      <div className="mt-20 pt-20 border-t border-safari-100">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Booking Form */}
          <div className="lg:col-span-1">
            <BookingForm 
              itinerary={itinerary} 
              formData={formData} 
              specialist={specialist} 
            />
          </div>

          {/* Contact Info */}
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-black text-safari-900 mb-4">Ready for the Wild?</h2>
              <p className="text-safari-600 mb-8 text-lg leading-relaxed">
                Experience the safari of a lifetime. Secure your spot on this precision-crafted adventure today.
              </p>

              {specialist && (
                <div className="mb-10 animate-fadeIn">
                  <h3 className="text-xs font-black uppercase tracking-widest text-safari-400 mb-6 flex items-center gap-2">
                    <User size={14} className="text-safari-500" /> Your Dedicated Specialist
                  </h3>
                  <div className="bg-white rounded-xl border border-safari-100 p-6 shadow-sm flex items-center gap-6 group hover:border-safari-300 transition-all">
                    <div className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0 border-4 border-safari-50 shadow-md transform group-hover:scale-105 transition-transform">
                      <img src={specialist.photo_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200'} alt={specialist.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xl font-black text-safari-900 truncate">{specialist.name}</h4>
                      <p className="text-[10px] font-black uppercase text-safari-500 mb-2 tracking-widest">{specialist.role}</p>
                      <p className="text-sm text-safari-600 leading-relaxed italic line-clamp-2">"{specialist.bio}"</p>
                    </div>
                  </div>
                </div>
              )}
              
              <h3 className="text-xs font-black uppercase tracking-widest text-safari-400 mb-6">Contact Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex items-start gap-4 p-4 rounded-lg bg-white border border-safari-100 shadow-sm hover:border-safari-300 transition-all">
                  <div className="p-3 bg-safari-50 text-safari-600 rounded-md shrink-0">
                    <Phone size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-black uppercase text-safari-400 mb-1">Call Us</p>
                    <p className="text-sm font-bold text-safari-900 truncate" title={branding.contactPhone}>{branding.contactPhone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-lg bg-white border border-safari-100 shadow-sm hover:border-safari-300 transition-all">
                  <div className="p-3 bg-safari-50 text-safari-600 rounded-md shrink-0">
                    <Mail size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-black uppercase text-safari-400 mb-1">Email Us</p>
                    <p className="text-sm font-bold text-safari-900 truncate" title={branding.contactEmail}>{branding.contactEmail}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-lg bg-white border border-safari-100 shadow-sm hover:border-safari-300 transition-all">
                  <div className="p-3 bg-safari-50 text-safari-600 rounded-md shrink-0">
                    <MessageSquare size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-black uppercase text-safari-400 mb-1">WhatsApp</p>
                    <p className="text-sm font-bold text-safari-900 truncate" title={branding.whatsappNumber}>{branding.whatsappNumber}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-lg bg-white border border-safari-100 shadow-sm hover:border-safari-300 transition-all">
                  <div className="p-3 bg-safari-50 text-safari-600 rounded-md shrink-0">
                    <ExternalLink size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-black uppercase text-safari-400 mb-1">Visit Us</p>
                    <p className="text-sm font-bold text-safari-900 truncate" title={branding.contactAddress}>{branding.contactAddress}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-safari-50 rounded-lg border border-safari-100">
              <p className="text-xs text-safari-500 leading-relaxed font-medium">
                Our team is available 24/7 to assist with your booking and answer any questions you may have about your upcoming African adventure.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Lightbox for Gallery */}
      {lightboxIndex !== null && itinerary.gallery && createPortal(
        <div 
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center backdrop-blur-sm"
          onClick={() => setLightboxIndex(null)}
        >
          <div className="absolute top-4 right-4">
            <button 
              onClick={() => setLightboxIndex(null)}
              className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors backdrop-blur-md"
            >
              <X size={24} />
            </button>
          </div>
          
          <button 
            onClick={handlePrevImage}
            className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors backdrop-blur-md hidden md:block"
          >
            <ChevronLeft size={32} />
          </button>

          <div className="relative w-full h-full max-w-7xl max-h-[90vh] flex items-center justify-center p-4">
            <img 
              src={itinerary.gallery[lightboxIndex]} 
              alt={`Gallery Image ${lightboxIndex + 1}`} 
              className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
              referrerPolicy="no-referrer"
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image itself
            />
            
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/50 backdrop-blur-md rounded-full text-white text-sm">
              {lightboxIndex + 1} / {itinerary.gallery.length}
            </div>
          </div>
          
          <button 
            onClick={handleNextImage}
            className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors backdrop-blur-md hidden md:block"
          >
            <ChevronRight size={32} />
          </button>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ItineraryView;
