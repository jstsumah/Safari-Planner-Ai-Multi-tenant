import React, { useState } from 'react';
import { 
  Compass, ShieldCheck, Zap, 
  Globe, ArrowRight, FileText, Bookmark,
  Users, ChevronRight, Play, Check, Calculator,
  Heart, User, Briefcase, Star, HelpCircle, 
  Mail, Phone, MapPin, Plus, Minus, Menu, X, Building2,
  ChevronLeft
} from 'lucide-react';
import { Tooltip } from './ui/Tooltip';
import { supabase } from '../lib/supabase';

import DatabaseStatus from './DatabaseStatus';

interface LandingPageProps {
  onStart: () => void;
  onAuth: () => void;
  onAdmin: () => void;
  onCalculator: () => void;
  onViewProfile?: () => void;
  onViewPartners?: () => void;
  branding: BrandingConfig;
  masterItineraries?: any[];
  isAuthenticated?: boolean;
}

const LandingPage: React.FC<LandingPageProps> = ({ 
  onStart, 
  onAuth, 
  onAdmin, 
  onCalculator, 
  onViewProfile,
  onViewPartners,
  branding, 
  masterItineraries = [], 
  isAuthenticated = false 
}) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);

  React.useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const { data, error } = await supabase.from('companies').select('*').limit(10);
        if (error) {
          console.error("Home Companies Fetch Error:", error.message);
          return;
        }
        if (data) setCompanies(data);
      } catch (err) {
        console.error("Home Companies unexpected error:", err);
      }
    };
    fetchCompanies();
  }, []);

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = React.useState(false);

  const slideshowPartners = branding.globalPartners && branding.globalPartners.length > 0 
    ? branding.globalPartners 
    : companies.map(c => ({
        id: c.id,
        name: c.name,
        logoUrl: '', // Fallback to Building2 icon for companies without explicit logos in branding
        websiteUrl: `?company=${c.slug}`
      }));

  React.useEffect(() => {
    const container = scrollRef.current;
    if (!container || slideshowPartners.length === 0 || isHovered) return;

    let requestId: number;
    const scroll = () => {
      container.scrollLeft += 0.5; // Very slow, smooth scroll
      if (container.scrollLeft >= container.scrollWidth - container.clientWidth) {
        container.scrollLeft = 0;
      }
      requestId = requestAnimationFrame(scroll);
    };

    requestId = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(requestId);
  }, [slideshowPartners, isHovered]);

  const handleManualScroll = (direction: 'left' | 'right') => {
    const container = scrollRef.current;
    if (!container) return;
    
    const scrollAmount = 300;
    container.scrollTo({
      left: container.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount),
      behavior: 'smooth'
    });
  };

  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    setIsMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const faqs = branding.faqs || [
    {
      q: "Is SafariPlanner.ai for travelers or travel agents?",
      a: "Both. We've built the engine to be versatile. Travelers love the instant, expert-grade itinerary generation, while professionals use our Partner Dashboard for advanced costing, supplier management, and branded documentation."
    },
    {
      q: "How accurate are the estimated costs?",
      a: "Our system pulls from a live database of lodge rates (High/Low seasons) and official park fees. While prices are highly accurate estimates, final quotes should always be verified during the booking process."
    },
    {
      q: "Can I customize my itinerary after it's generated?",
      a: "Absolutely. Once an itinerary is generated, you can use the 'Edit' tool to swap lodges, add activities, or adjust durations. The AI will assist in maintaining logistical logic during your changes."
    },
    {
      q: "Which African destinations do you support?",
      a: "We currently have deep data coverage for Kenya, Tanzania, Uganda, and Rwanda, with expanding support for Southern Africa (South Africa, Botswana, Namibia)."
    },
    {
      q: "How do I access my saved itineraries?",
      a: "Simply use the 'History' feature within the planner entry. Enter your email address to retrieve all previous designs associated with your account."
    }
  ];

  const testimonials = branding.testimonials || [
    {
      name: "Sarah J.",
      role: "Independent Travel Agent",
      text: "This tool transformed my agency. I can now provide a detailed, accurate quote to clients in minutes rather than hours. The costing precision is unmatched.",
      stars: 5
    },
    {
      name: "Marcus Thorne",
      role: "Family Traveler",
      text: "Planning a trip for 6 people was daunting. SafariPlanner.ai suggested lodges that fit our exact budget and handled all the logistics perfectly.",
      stars: 5
    },
    {
      name: "Ellen Mwangi",
      role: "Operations Director, East Safaris",
      text: "The AI routing is surprisingly smart. It understands park boundaries and road conditions better than some junior consultants we've hired!",
      stars: 5
    }
  ];

  return (
    <div className="min-h-screen bg-safari-50 text-safari-900 selection:bg-safari-200 scroll-smooth">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-[100] bg-white border-b border-safari-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            {branding?.agencyLogo ? (
              <img src={branding.agencyLogo} alt="Logo" className="h-10 w-auto object-contain" referrerPolicy="no-referrer" />
            ) : (
              <Compass className="text-safari-600" size={32} />
            )}
            <span className="text-xl font-extrabold tracking-tight">
              {branding?.agencyLogo ? null : (
                <>Safari<span className="text-safari-500">Planner.ai</span></>
              )}
            </span>
          </div>

          {/* Desktop Links */}
          <div className="hidden lg:flex items-center gap-6 text-sm font-bold text-safari-600">
            <Tooltip content="Explore our unique features">
              <a href="#features" onClick={(e) => scrollToSection(e, 'features')} className="hover:text-safari-900 transition-colors flex items-center gap-1.5">
                <Zap size={14} className="text-safari-400" /> Features
              </a>
            </Tooltip>

            <Tooltip content="Who is SafariPlanner for?">
              <a href="#who-it-is-for" onClick={(e) => scrollToSection(e, 'who-it-is-for')} className="hover:text-safari-900 transition-colors flex items-center gap-1.5">
                <Users size={14} className="text-safari-400" /> For You
              </a>
            </Tooltip>
            <Tooltip content="Read what our clients say">
              <a href="#testimonials" onClick={(e) => scrollToSection(e, 'testimonials')} className="hover:text-safari-900 transition-colors flex items-center gap-1.5">
                <Star size={14} className="text-safari-400" /> Reviews
              </a>
            </Tooltip>
            <Tooltip content="Frequently Asked Questions">
              <a href="#faq" onClick={(e) => scrollToSection(e, 'faq')} className="hover:text-safari-900 transition-colors flex items-center gap-1.5">
                <HelpCircle size={14} className="text-safari-400" /> FAQ
              </a>
            </Tooltip>
            <Tooltip content="Launch the Safari Planner">
              <a 
                href="?tool=planner" 
                onClick={(e) => { e.preventDefault(); onStart(); }} 
                className="hover:text-safari-900 transition-colors flex items-center gap-1.5"
              >
                <Compass size={14} className="text-safari-400" /> Safari Planner
              </a>
            </Tooltip>
            <Tooltip content="Quickly estimate your safari costs">
              <a 
                href="?tool=calculator" 
                onClick={(e) => { e.preventDefault(); onCalculator(); }} 
                className="hover:text-safari-900 transition-colors flex items-center gap-1.5"
              >
                <Calculator size={14} className="text-safari-400" /> Cost Calculator
              </a>
            </Tooltip>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {/* Start Planning - Sign In/Access button */}
            <button 
              onClick={onAuth}
              className="hidden lg:block bg-safari-900 text-white px-6 py-2.5 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-safari-800 transition-all shadow-lg active:scale-95 whitespace-nowrap"
            >
              Start Planning
            </button>
            
            {/* Mobile Toggle */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 text-safari-600 hover:bg-safari-100 rounded-lg transition-colors"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay - Changed to Solid White background to reduce transparency issues */}
        <div className={`lg:hidden fixed inset-0 top-20 bg-white z-[90] transition-all duration-300 transform ${isMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'}`}>
          <div className="p-8 flex flex-col gap-6 text-lg font-bold text-safari-700 h-full border-t border-safari-100">
            <a href="#features" onClick={(e) => scrollToSection(e, 'features')} className="flex items-center gap-3">
              <Zap size={20} className="text-safari-400" /> Features
            </a>

            <a href="#who-it-is-for" onClick={(e) => scrollToSection(e, 'who-it-is-for')} className="flex items-center gap-3">
              <Users size={20} className="text-safari-400" /> For You
            </a>
            <a href="#testimonials" onClick={(e) => scrollToSection(e, 'testimonials')} className="flex items-center gap-3">
              <Star size={20} className="text-safari-400" /> Reviews
            </a>
            <a href="#faq" onClick={(e) => scrollToSection(e, 'faq')} className="flex items-center gap-3">
              <HelpCircle size={20} className="text-safari-400" /> FAQ
            </a>
            <a 
              href="?tool=planner" 
              onClick={(e) => { e.preventDefault(); setIsMenuOpen(false); onStart(); }} 
              className="flex items-center gap-3 text-left"
            >
              <Compass size={20} className="text-safari-400" /> Safari Planner
            </a>
            <a 
              href="?tool=calculator" 
              onClick={(e) => { e.preventDefault(); setIsMenuOpen(false); onCalculator(); }} 
              className="flex items-center gap-3 text-left"
            >
              <Calculator size={20} className="text-safari-400" /> Cost Calculator
            </a>
            <div className="pt-6 border-t border-safari-100 flex flex-col gap-4">
              {isAuthenticated && (
                <button 
                  onClick={() => { 
                    setIsMenuOpen(false); 
                    onAdmin();
                  }} 
                  className="text-safari-600 font-extrabold uppercase tracking-widest text-xs text-left px-2 py-3 hover:bg-safari-50 rounded-lg flex items-center gap-3 transition-all"
                >
                  <Briefcase size={16} className="text-safari-400" /> Partner Panel
                </button>
              )}
              <button onClick={() => { setIsMenuOpen(false); onAuth(); }} className="w-full py-4 bg-safari-900 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-all">Start Planning</button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 md:pt-40 pb-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-8 md:px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 md:space-y-8 animate-fadeIn">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-safari-100 rounded-full text-safari-600 font-bold text-[10px] uppercase tracking-widest">
              <Heart size={14} className="fill-safari-600" /> For Travelers & Professionals
            </div>
            <h1 className="text-4xl sm:text-6xl md:text-[60px] leading-[1.1] md:leading-[60px] max-w-[640px] font-extrabold text-safari-900 tracking-tighter pr-4 md:pr-0">
              {branding.heroTitle || (
                <>
                  The Art of the <span className="whitespace-nowrap">Safari, Decoded.</span>
                </>
              )}
            </h1>
            <p className="text-base md:text-xl text-safari-600 max-w-xl font-medium leading-relaxed">
              {branding.heroDescription || "Whether you're a DIY traveler planning a once-in-a-lifetime journey or a professional partner scaling your operations, our intelligence-assisted platform designs expert-grade African adventures in seconds."}
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-6 pt-4">
              <a 
                href="?tool=planner"
                onClick={(e) => { e.preventDefault(); onStart(); }}
                className="w-full sm:w-auto group bg-safari-800 text-white px-8 py-5 rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-safari-900 transition-all shadow-2xl flex items-center justify-center gap-3 active:scale-95"
              >
                Plan Your Trip <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </a>
              <div className="flex items-center gap-4">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-4 border-white bg-safari-200" />
                  ))}
                </div>
                <div className="text-[10px] md:text-xs">
                  <p className="font-bold text-safari-900">Used by Thousands</p>
                  <p className="text-safari-400 font-bold">Of Explorers & Experts</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative animate-fadeIn delay-200 mt-12 lg:mt-0">
            <div className="relative z-10 bg-white rounded-lg shadow-[0_32px_64px_-16px_rgba(65,60,49,0.2)] border border-safari-100 p-4 mx-2 sm:mx-0">
              <div className="rounded-md overflow-hidden bg-safari-900 aspect-[4/3] flex items-center justify-center relative group">
                <img 
                  src={branding.heroImage || "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&q=80&w=1000"} 
                  className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" 
                  alt="Safari Landscape"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-safari-900/80 to-transparent" />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                   <div className="w-16 h-16 md:w-20 md:h-20 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center text-white mb-6 border border-white/30 cursor-pointer hover:scale-110 transition-transform">
                     <Play fill="white" className="w-6 h-6 md:w-8 md:h-8" />
                   </div>
                   <h3 className="text-white text-xl md:text-2xl font-extrabold tracking-tight">Curation Meets Intelligence</h3>
                </div>
              </div>
              
              {/* Floating UI Elements - Refined positioning to prevent border clashing on mobile */}
              <div className="absolute -bottom-2 left-2 md:-bottom-6 md:-left-6 bg-white p-3 md:p-6 rounded-md shadow-xl border border-safari-50 animate-bounce-slow max-w-[160px] md:max-w-none">
                 <div className="flex items-center gap-2 md:gap-3">
                   <div className="shrink-0 w-7 h-7 md:w-10 md:h-10 bg-green-50 text-green-600 rounded-md flex items-center justify-center"><Check size={16} md:size={20} strokeWidth={3} /></div>
                   <div>
                     <p className="text-[8px] md:text-[10px] font-bold uppercase text-safari-400 whitespace-nowrap">Personalized</p>
                     <p className="text-[10px] md:text-sm font-bold text-safari-900 leading-tight">Expert Pricing</p>
                   </div>
                 </div>
              </div>

              <div className="absolute -top-2 right-2 md:-top-6 md:-right-6 bg-safari-800 p-3 md:p-6 rounded-md shadow-xl text-white max-w-[160px] md:max-w-none">
                 <div className="flex items-center gap-2 md:gap-3">
                   <div className="shrink-0 w-7 h-7 md:w-10 md:h-10 bg-white/10 rounded-md flex items-center justify-center"><Zap size={16} md:size={18} className="text-safari-400" /></div>
                   <div>
                     <p className="text-[8px] md:text-[10px] font-bold uppercase text-safari-300 whitespace-nowrap">Fast Drafting</p>
                     <p className="text-[10px] md:text-sm font-bold leading-tight">Instant Logistics</p>
                   </div>
                 </div>
              </div>
            </div>
            
            {/* Background decorative elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-safari-200/20 rounded-full blur-[120px] -z-10" />
          </div>
        </div>
      </section>

      {/* Signature Safaris Section */}
      {masterItineraries.length > 0 && (
        <section id="signature-safaris" className="py-24 bg-white scroll-mt-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-safari-100 rounded-full text-safari-600 font-bold text-[10px] uppercase tracking-widest">
                  <Bookmark size={14} className="fill-safari-600" /> Curated Experiences
                </div>
                <h2 className="text-4xl md:text-5xl font-extrabold text-safari-900 tracking-tight">Signature Safaris</h2>
                <p className="text-lg text-safari-500 font-medium max-w-2xl">
                  Hand-crafted master itineraries designed by our expert consultants for the ultimate African adventure.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {masterItineraries.map((safari) => (
                <div key={safari.id} className="group bg-safari-50 rounded-lg overflow-hidden border border-safari-100 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                  <div className="aspect-[16/10] relative overflow-hidden bg-safari-200">
                    <img 
                      src={safari.itinerary_data?.gallery?.[0] || "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&q=80&w=800"} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                      alt={safari.trip_title}
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-safari-900/80 via-transparent to-transparent opacity-60" />
                    <div className="absolute bottom-4 left-4 right-6">
                      <p className="text-white font-extrabold text-xl md:text-2xl leading-tight tracking-tight line-clamp-2">{safari.trip_title}</p>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <p className="text-safari-600 text-sm line-clamp-3 font-medium leading-relaxed">
                      {safari.itinerary_data?.summary || "Experience the magic of Africa with this expertly crafted journey."}
                    </p>
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-1 text-safari-900 font-bold">
                        <span className="text-xs text-safari-400 uppercase tracking-widest">From</span>
                        <span>${Number(safari.itinerary_data?.totalEstimatedCost || 0).toLocaleString()}</span>
                      </div>
                      <a 
                        href={`?master=${safari.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-safari-600 font-bold text-sm hover:text-safari-900 transition-colors"
                      >
                        View Details <ArrowRight size={16} />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Partners Side Scroll Section */}
      <section className="py-20 bg-white border-b border-safari-100 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 mb-10 flex items-end justify-between">
          <div className="space-y-4">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-safari-400">Our Network</h2>
            <h3 className="text-3xl md:text-4xl font-extrabold text-safari-900 tracking-tight">Verified Agency Partners</h3>
          </div>
          <button 
            onClick={onViewPartners}
            className="flex items-center gap-2 text-safari-600 font-bold text-xs uppercase tracking-widest hover:text-safari-900 transition-colors group"
          >
            View All Partners <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="relative group/slideshow">
          {/* Arrow Navigation */}
          <div className="absolute inset-y-0 left-6 flex items-center z-20">
            <button 
              onClick={() => handleManualScroll('left')}
              className="p-3 bg-white border border-safari-100 rounded-full shadow-lg text-safari-600 hover:bg-safari-900 hover:text-white hover:border-safari-900 transition-all opacity-0 group-hover/slideshow:opacity-100 -translate-x-4 group-hover/slideshow:translate-x-0"
            >
              <ChevronLeft size={20} />
            </button>
          </div>
          <div className="absolute inset-y-0 right-6 flex items-center z-20">
            <button 
              onClick={() => handleManualScroll('right')}
              className="p-3 bg-white border border-safari-100 rounded-full shadow-lg text-safari-600 hover:bg-safari-900 hover:text-white hover:border-safari-900 transition-all opacity-0 group-hover/slideshow:opacity-100 translate-x-4 group-hover/slideshow:translate-x-0"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div 
            ref={scrollRef}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="flex gap-12 overflow-x-auto pb-8 px-6 no-scrollbar transition-all scroll-smooth"
            style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
          >
            {/* Duplication for seamless scrolling removed to handle manual scroll better, or we can keep it if we adjust logic */}
            {slideshowPartners.map((partner, idx) => (
              <div 
                key={`${partner.id}-${idx}`} 
                className="flex-shrink-0 w-64 bg-safari-50 p-6 rounded-2xl border border-safari-100 hover:shadow-xl hover:shadow-safari-900/5 transition-all group/card flex flex-col items-center justify-center text-center space-y-4 grayscale hover:grayscale-0"
              >
                <div className="w-24 h-16 bg-white rounded-xl flex items-center justify-center text-safari-400 overflow-hidden border border-safari-50">
                  {partner.logoUrl ? (
                    <img src={partner.logoUrl} alt={partner.name} className="max-w-full max-h-full object-contain" />
                  ) : (
                    <Building2 size={32} />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-black text-safari-900 px-2 truncate w-full">{partner.name}</h4>
                </div>
              </div>
            ))}
            {slideshowPartners.length === 0 && Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-64 h-32 bg-safari-50 rounded-2xl border border-safari-50 animate-pulse" />
            ))}
          </div>
          
          {/* Gradient Overlays for smooth blend */}
          <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-white to-transparent pointer-events-none z-10" />
          <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-white to-transparent pointer-events-none z-10" />
        </div>
      </section>

      {/* Dual Audience Section */}
      <section id="who-it-is-for" className="py-24 bg-safari-100/50 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* For Travelers */}
            <div className="bg-white p-10 rounded-lg shadow-sm border border-safari-100 space-y-6 group hover:shadow-md transition-all">
              <div className="w-14 h-14 bg-safari-50 rounded-md flex items-center justify-center text-safari-600 group-hover:bg-safari-600 group-hover:text-white transition-all">
                <User size={28} />
              </div>
              <h3 className="text-3xl font-extrabold text-safari-900">For Solo & Family Travelers</h3>
              <p className="text-safari-600 font-medium">
                Skip the endless research. Get a professional-grade itinerary that balances drive times, park fees, and the best lodges—all tailored to your specific budget and preferences.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-sm font-bold text-safari-700"><Check size={16} className="text-green-600" /> Real-time routing logic</li>
                <li className="flex items-center gap-2 text-sm font-bold text-safari-700"><Check size={16} className="text-green-600" /> Direct lodge matching</li>
                <li className="flex items-center gap-2 text-sm font-bold text-safari-700"><Check size={16} className="text-green-600" /> Instant PDF downloads</li>
              </ul>
              <button onClick={onStart} className="text-safari-900 font-black text-xs uppercase tracking-widest flex items-center gap-2 pt-4 group">
                Plan My Dream Trip <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* For Professionals */}
            <div className="bg-safari-900 p-10 rounded-lg shadow-sm space-y-6 group text-white">
              <div className="w-14 h-14 bg-white/10 rounded-md flex items-center justify-center text-safari-400 group-hover:bg-safari-500 group-hover:text-white transition-all">
                <Briefcase size={28} />
              </div>
              <h3 className="text-3xl font-extrabold">For Partners & Professionals</h3>
              <p className="text-safari-300 font-medium">
                Scale your quoting speed by 10x. Access advanced costing modules, manage supplier vouchers, and generate branded invoices with enterprise-grade precision.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-sm font-bold text-safari-300"><Check size={16} className="text-green-400" /> Automated costing & markups</li>
                <li className="flex items-center gap-2 text-sm font-bold text-safari-300"><Check size={16} className="text-green-400" /> Supplier disbursement plans</li>
                <li className="flex items-center gap-2 text-sm font-bold text-safari-300"><Check size={16} className="text-green-400" /> Lead management CRM</li>
              </ul>
              <button onClick={onAdmin} className="text-white font-black text-xs uppercase tracking-widest flex items-center gap-2 pt-4 group">
                Launch Partner Dashboard <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Bento Grid */}
      <section id="features" className="py-32 bg-white scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-safari-400">The Ultimate Planner</h2>
            <h3 className="text-4xl md:text-5xl font-extrabold text-safari-900 tracking-tighter">Tools that amplify your safari vision.</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 h-auto gap-6">
            {/* Feature 1: Core Itinerary Builder */}
            <div className="md:col-span-4 bg-safari-50 rounded-lg p-10 border border-safari-100 flex flex-col justify-between group overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-safari-900/[0.03] rounded-bl-full pointer-events-none" />
              <div className="space-y-4">
                <div className="w-14 h-14 bg-white shadow-sm rounded-md flex items-center justify-center text-safari-600 mb-6 group-hover:scale-110 transition-transform duration-500">
                  <Compass size={28} />
                </div>
                <h4 className="text-3xl font-extrabold text-safari-900 tracking-tight">Interactive Itinerary Builder</h4>
                <p className="text-safari-600 font-medium max-w-xl">
                  Construct your perfect safari day by day with our intelligent builder. Swap lodges, add transit details, and utilize smart routing assistance that understands park boundaries and logic on the ground.
                </p>
              </div>
            </div>

            {/* Feature 2: Partner Hub */}
            <div className="md:col-span-2 bg-safari-900 rounded-lg p-10 flex flex-col justify-between text-white group">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-white/10 rounded-md flex items-center justify-center text-safari-400 group-hover:rotate-12 transition-transform">
                  <Briefcase size={24} />
                </div>
                <h4 className="text-2xl font-extrabold tracking-tight">Partner Dashboard</h4>
                <p className="text-safari-300 text-sm font-medium">Manage your team, track generated itineraries, and oversee your entire operational workflow in a centralized hub tailored for professionals.</p>
              </div>
            </div>

            {/* Feature 3: Cost Calculator */}
            <div className="md:col-span-2 bg-white border border-safari-200 rounded-lg p-10 flex flex-col justify-between group hover:border-safari-400 transition-colors">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-safari-50 rounded-md flex items-center justify-center text-safari-600">
                  <Calculator size={24} />
                </div>
                <h4 className="text-2xl font-extrabold text-safari-900 tracking-tight">Cost Calculator</h4>
                <p className="text-safari-600 text-sm font-medium">Auto-generate cost breakdowns based on seasonal lodge rates and real-time park fees. Add custom markups for client quotes.</p>
              </div>
            </div>

            {/* Feature 4: PDF & Export */}
            <div className="md:col-span-2 bg-white border border-safari-200 rounded-lg p-10 flex flex-col justify-between group hover:border-safari-400 transition-colors">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-safari-50 rounded-md flex items-center justify-center text-safari-600">
                  <FileText size={24} />
                </div>
                <h4 className="text-2xl font-extrabold text-safari-900 tracking-tight">Export & Share</h4>
                <p className="text-safari-600 text-sm font-medium">Generate stunning, ready-to-share PDF itineraries and web links to immediately present proposals to your travel group or clients.</p>
              </div>
            </div>

            {/* Feature 5: White-labeling */}
            <div className="md:col-span-2 bg-white border border-safari-200 rounded-lg p-10 flex flex-col justify-between group hover:border-safari-400 transition-colors">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-safari-50 rounded-md flex items-center justify-center text-safari-600">
                  <Star size={24} />
                </div>
                <h4 className="text-2xl font-extrabold text-safari-900 tracking-tight">Custom Branding</h4>
                <p className="text-safari-600 text-sm font-medium">Elevate your agency with full white-labeling. Add your logo to all exports, customize UI themes, and maintain your professional identity.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-32 bg-safari-50 scroll-mt-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-safari-400">Social Proof</h2>
            <h3 className="text-4xl md:text-5xl font-extrabold text-safari-900 tracking-tighter">Trusted by the Wildest at Heart.</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <TestimonialCard 
                key={i}
                name={t.name} 
                role={t.role} 
                text={t.text} 
                stars={t.stars}
              />
            ))}
          </div>
        </div>
      </section>

      {/* FAQ & Gallery Section */}
      <section id="faq" className="py-32 bg-white scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            
            {/* Left: FAQs */}
            <div>
              <div className="mb-12 space-y-4">
                <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-safari-400">Common Questions</h2>
                <h3 className="text-4xl lg:text-5xl font-extrabold text-safari-900 tracking-tighter">Curiosity, Cleared Up.</h3>
              </div>
              <div className="space-y-4">
                {faqs.map((faq, idx) => (
                  <div key={idx} className="border border-safari-100 rounded-md overflow-hidden transition-all">
                    <button 
                      onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                      className="w-full flex items-center justify-between p-6 text-left hover:bg-safari-50 transition-colors"
                    >
                      <span className="font-extrabold text-safari-900 pr-8">{faq.q}</span>
                      {openFaq === idx ? <Minus size={20} className="text-safari-400 shrink-0" /> : <Plus size={20} className="text-safari-400 shrink-0" />}
                    </button>
                    {openFaq === idx && (
                      <div className="p-6 pt-0 bg-safari-50 text-safari-600 font-medium leading-relaxed animate-fadeIn">
                        {faq.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Masonry Gallery */}
            <div className="relative">
              <div className="columns-1 md:columns-2 gap-4 space-y-4">
                <div className="break-inside-avoid">
                  <img 
                    src="https://images.unsplash.com/photo-1614027164847-1b28cfe1df60?auto=format&fit=crop&q=80&w=600" 
                    alt="Lion in the wild" 
                    className="rounded-2xl w-full object-cover shadow-md hover:scale-[1.02] transition-transform duration-500" 
                  />
                </div>
                <div className="break-inside-avoid">
                  <img 
                    src="https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&q=80&w=600" 
                    alt="Safari elephants" 
                    className="rounded-2xl w-full object-cover shadow-md hover:scale-[1.02] transition-transform duration-500" 
                  />
                </div>
                <div className="break-inside-avoid">
                  <img 
                    src="https://images.unsplash.com/photo-1614531341773-3bff8b7cb3fc?auto=format&fit=crop&q=80&w=600" 
                    alt="Zebra herd" 
                    className="rounded-2xl w-full object-cover shadow-md hover:scale-[1.02] transition-transform duration-500" 
                  />
                </div>
                <div className="break-inside-avoid">
                  <img 
                    src="/src/assets/images/safari_vehicle_gallery_1777014805076.png" 
                    alt="Safari vehicle" 
                    className="rounded-2xl w-full object-cover shadow-md hover:scale-[1.02] transition-transform duration-500" 
                  />
                </div>
                <div className="break-inside-avoid">
                  <img 
                    src="https://images.unsplash.com/photo-1493962853295-0fd70327578a?auto=format&fit=crop&q=80&w=600" 
                    alt="Leopard resting" 
                    className="rounded-2xl w-full object-cover shadow-md hover:scale-[1.02] transition-transform duration-500" 
                  />
                </div>
                <div className="break-inside-avoid">
                  <img 
                    src="https://images.unsplash.com/photo-1534430480872-3498386e7856?auto=format&fit=crop&q=80&w=600" 
                    alt="Giraffes landscape" 
                    className="rounded-2xl w-full object-cover shadow-md hover:scale-[1.02] transition-transform duration-500" 
                  />
                </div>
              </div>
              {/* Decorative overlay blur element */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-safari-600/5 blur-[100px] pointer-events-none rounded-full" />
            </div>

          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-32 scroll-mt-20 relative overflow-hidden text-white bg-safari-900">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&q=80&w=2000")' }}
        />
        <div className="absolute inset-0 bg-safari-900/85 md:bg-safari-900/75 mix-blend-multiply" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
            <div className="space-y-10">
              <div className="space-y-4">
                <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-safari-400 drop-shadow-md">Get In Touch</h2>
                <h3 className="text-5xl font-extrabold tracking-tighter leading-none drop-shadow-lg">Let's build your <span className="text-safari-400 italic">masterpiece</span> together.</h3>
                <p className="text-safari-100 text-lg font-medium max-w-md drop-shadow-md">Whether you have a product question, need agent onboarding, or just want to talk safari, our team is ready.</p>
              </div>
              <div className="space-y-6">
                <div className="flex items-center gap-4 group cursor-pointer">
                  <div className="w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-md flex items-center justify-center shrink-0 group-hover:bg-safari-500 transition-colors shadow-lg"><Mail size={24} /></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-safari-400 drop-shadow-md">Email Us</p>
                    <p className="font-bold text-lg drop-shadow-md truncate" title={branding.contactEmail || "hello@safariplanner.ai"}>{branding.contactEmail || "hello@safariplanner.ai"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 group cursor-pointer">
                  <div className="w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-md flex items-center justify-center shrink-0 group-hover:bg-safari-500 transition-colors shadow-lg"><Phone size={24} /></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black uppercase tracking-widest text-safari-400 drop-shadow-md">Direct Line</p>
                    <p className="font-bold text-lg drop-shadow-md truncate" title={branding.contactPhone || "+254 700 000 000"}>{branding.contactPhone || "+254 700 000 000"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 group cursor-pointer">
                  <div className="w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-md flex items-center justify-center shrink-0 group-hover:bg-safari-500 transition-colors shadow-lg"><MapPin size={24} /></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black uppercase tracking-widest text-safari-400 drop-shadow-md">HQ</p>
                    <p className="font-bold text-lg drop-shadow-md truncate" title={branding.contactAddress || "Nairobi, Kenya"}>{branding.contactAddress || "Nairobi, Kenya"}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Glassmorphism Form Container */}
            <div className="bg-white/10 backdrop-blur-2xl p-10 rounded-2xl border border-white/20 shadow-2xl space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" />
              
              <h4 className="text-xl font-extrabold mb-4 drop-shadow-md">Send a Message</h4>
              <div className="grid grid-cols-2 gap-4">
                <input 
                  className="bg-white/5 backdrop-blur-md border border-white/20 rounded-md p-4 text-sm font-bold focus:border-safari-300 focus:bg-white/10 placeholder:text-white/50 transition-all outline-none text-white shadow-inner" 
                  placeholder="Name" 
                  value={contactForm.name}
                  onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                />
                <input 
                  className="bg-white/5 backdrop-blur-md border border-white/20 rounded-md p-4 text-sm font-bold focus:border-safari-300 focus:bg-white/10 placeholder:text-white/50 transition-all outline-none text-white shadow-inner" 
                  placeholder="Email" 
                  value={contactForm.email}
                  onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                />
              </div>
              <input 
                className="w-full bg-white/5 backdrop-blur-md border border-white/20 rounded-md p-4 text-sm font-bold focus:border-safari-300 focus:bg-white/10 placeholder:text-white/50 transition-all outline-none text-white shadow-inner" 
                placeholder="Subject" 
                value={contactForm.subject}
                onChange={(e) => setContactForm({...contactForm, subject: e.target.value})}
              />
              <textarea 
                className="w-full bg-white/5 backdrop-blur-md border border-white/20 rounded-md p-4 text-sm font-bold h-32 focus:border-safari-300 focus:bg-white/10 placeholder:text-white/50 transition-all outline-none resize-none text-white shadow-inner" 
                placeholder="How can we help?"
                value={contactForm.message}
                onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
              ></textarea>
              <button 
                onClick={() => {
                  toast.success("Message sent! We'll get back to you soon.");
                  setContactForm({ name: '', email: '', subject: '', message: '' });
                }}
                className="w-full py-5 bg-white text-safari-900 rounded-md font-black uppercase text-xs tracking-widest hover:bg-safari-100 hover:scale-[1.02] shadow-xl transition-all"
              >
                Send Inquiry
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-safari-950 text-white pt-24 pb-12 relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-safari-500/30 to-transparent" />
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-safari-600/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-safari-600/5 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 pb-20">
            
            {/* Column 1: Brand & Description */}
            <div className="col-span-1 md:col-span-2 lg:col-span-1 space-y-8">
              <div className="flex items-center gap-3 group">
                <div className="w-12 h-12 bg-safari-500/10 rounded-xl flex items-center justify-center border border-safari-500/20 group-hover:border-safari-400 group-hover:bg-safari-500/20 transition-all duration-300">
                  <Compass className="text-safari-400 group-hover:scale-110 transition-transform" size={28} />
                </div>
                <span className="text-2xl font-black tracking-tighter text-white">
                  {branding.agencyName ? (
                    <>
                      {branding.agencyName?.split('.')[0]}
                      <span className="text-safari-400">.{branding.agencyName?.split('.')[1] || 'ai'}</span>
                    </>
                  ) : (
                    <>Safari<span className="text-safari-400">Planner.ai</span></>
                  )}
                </span>
              </div>
              <p className="text-safari-300/80 text-sm leading-relaxed max-w-xs font-medium">
                {branding.agencyDescription || "Empowering Safari Travelers and Agencies through intelligent logistics and modern financial tools. Built for the connoisseurs of the wild and seekers of adventure."}
              </p>
              <div className="flex gap-4">
                {branding.socialLinks && branding.socialLinks.length > 0 ? (
                  branding.socialLinks.map((link, idx) => {
                    const Icon = link.platform === 'Globe' ? Globe : link.platform === 'ShieldCheck' ? ShieldCheck : Globe;
                    return (
                      <a 
                        key={idx} 
                        href={link.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-safari-400 hover:bg-safari-500 hover:text-white hover:border-safari-500 transition-all duration-300"
                      >
                        <Icon size={18} />
                      </a>
                    );
                  })
                ) : (
                  <>
                    <a href="#" className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-safari-400 hover:bg-safari-500 hover:text-white hover:border-safari-500 transition-all duration-300">
                      <Globe size={18} />
                    </a>
                    <a href="#" className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-safari-400 hover:bg-safari-500 hover:text-white hover:border-safari-500 transition-all duration-300">
                      <ShieldCheck size={18} />
                    </a>
                  </>
                )}
              </div>
            </div>

            {/* Column 2: Exploration Hub */}
            <div>
              <h5 className="font-black uppercase text-[11px] tracking-[0.2em] text-white/40 mb-8 flex items-center gap-2">
                <span className="w-4 h-px bg-safari-500" /> Exploration Hub
              </h5>
              <ul className="space-y-4">
                <li>
                  <button onClick={onStart} className="text-safari-300 hover:text-white font-bold text-sm transition-all hover:translate-x-1 flex items-center gap-2 group text-left">
                    <ChevronRight size={14} className="text-safari-500 opacity-0 group-hover:opacity-100 -ml-4 group-hover:ml-0 transition-all" />
                    Planning Hub
                  </button>
                </li>
                <li>
                  <button onClick={onCalculator} className="text-safari-300 hover:text-white font-bold text-sm transition-all hover:translate-x-1 flex items-center gap-2 group text-left">
                    <ChevronRight size={14} className="text-safari-500 opacity-0 group-hover:opacity-100 -ml-4 group-hover:ml-0 transition-all" />
                    Cost Estimator
                  </button>
                </li>
                <li>
                  <button onClick={onViewPartners} className="text-safari-300 hover:text-white font-bold text-sm transition-all hover:translate-x-1 flex items-center gap-2 group text-left">
                    <ChevronRight size={14} className="text-safari-500 opacity-0 group-hover:opacity-100 -ml-4 group-hover:ml-0 transition-all" />
                    Partner Network
                  </button>
                </li>
                <li>
                  <button className="text-safari-300 hover:text-white font-bold text-sm transition-all hover:translate-x-1 flex items-center gap-2 group italic text-left">
                    <ChevronRight size={14} className="text-safari-500 opacity-0 group-hover:opacity-100 -ml-4 group-hover:ml-0 transition-all" />
                    Featured Itineraries
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: Partner Resources */}
            <div>
              <h5 className="font-black uppercase text-[11px] tracking-[0.2em] text-white/40 mb-8 flex items-center gap-2">
                <span className="w-4 h-px bg-safari-500" /> Professionals
              </h5>
              <ul className="space-y-4">
                <li>
                  <button onClick={onAdmin} className="text-safari-300 hover:text-white font-bold text-sm transition-all hover:translate-x-1 flex items-center gap-2 group text-left">
                    <ChevronRight size={14} className="text-safari-500 opacity-0 group-hover:opacity-100 -ml-4 group-hover:ml-0 transition-all" />
                    Partner Dashboard
                  </button>
                </li>
                <li>
                  <button onClick={onViewProfile} className="text-safari-400 hover:text-white font-black text-sm transition-all hover:translate-x-1 flex items-center gap-2 group text-left">
                    <ChevronRight size={14} className="text-safari-500 opacity-0 group-hover:opacity-100 -ml-4 group-hover:ml-0 transition-all font-black" />
                    Agency Reputation
                  </button>
                </li>
                <li>
                  <a href="#" className="text-safari-300 hover:text-white font-bold text-sm transition-all hover:translate-x-1 flex items-center gap-2 group">
                    <ChevronRight size={14} className="text-safari-500 opacity-0 group-hover:opacity-100 -ml-4 group-hover:ml-0 transition-all" />
                    Support Center
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 4: Contact & Newsletter */}
            <div className="space-y-8">
              <div>
                <h5 className="font-black uppercase text-[11px] tracking-[0.2em] text-white/40 mb-8 flex items-center gap-2">
                  <span className="w-4 h-px bg-safari-500" /> Get in Touch
                </h5>
                <div className="space-y-4">
                  <div className="flex items-start gap-4 group">
                    <div className="w-8 h-8 rounded-lg bg-safari-500/10 border border-safari-500/20 flex items-center justify-center shrink-0 group-hover:bg-safari-500 group-hover:text-white transition-all">
                      <Mail size={14} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-safari-500 mb-0.5">Email Us</p>
                      <p className="text-sm font-bold text-white">hello@safariplanner.ai</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 group">
                    <div className="w-8 h-8 rounded-lg bg-safari-500/10 border border-safari-500/20 flex items-center justify-center shrink-0 group-hover:bg-safari-500 group-hover:text-white transition-all">
                      <MapPin size={14} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-safari-500 mb-0.5">Base Camp</p>
                      <p className="text-sm font-bold text-white">Nairobi, Kenya</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 md:gap-4">
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 order-2 md:order-1">
              <p className="text-[10px] font-black uppercase text-safari-500/60 tracking-[0.2em] text-center md:text-left">
                © {new Date().getFullYear()} {branding.agencyName || "SafariPlanner.ai"} 
                <span className="mx-3 opacity-30">|</span> 
                Intelligence in the Wild
              </p>
              <div className="flex items-center gap-6">
                <a href="#" className="text-[10px] font-black uppercase text-safari-500/40 hover:text-safari-400 tracking-widest transition-colors">Privacy</a>
                <a href="#" className="text-[10px] font-black uppercase text-safari-500/40 hover:text-safari-400 tracking-widest transition-colors">Terms</a>
              </div>
            </div>
            
            <div className="order-1 md:order-2 flex items-center gap-6 bg-white/5 px-6 py-3 rounded-2xl border border-white/5">
              <DatabaseStatus />
              <div className="w-px h-4 bg-white/10" />
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-widest text-safari-400">System Nominal</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

const TestimonialCard = ({ name, role, text, stars }: any) => (
  <div className="bg-white p-8 rounded-lg shadow-sm border border-safari-100 flex flex-col justify-between hover:shadow-md transition-shadow h-full">
    <div className="space-y-4">
      <div className="flex gap-1">
        {[...Array(stars)].map((_, i) => <Star key={i} size={14} className="fill-safari-400 text-safari-400" />)}
      </div>
      <p className="text-safari-600 font-medium italic leading-relaxed">"{text}"</p>
    </div>
    <div className="mt-8 pt-6 border-t border-safari-50">
      <p className="font-extrabold text-safari-900">{name}</p>
      <p className="text-[10px] font-bold uppercase tracking-widest text-safari-400">{role}</p>
    </div>
  </div>
);





export default LandingPage;