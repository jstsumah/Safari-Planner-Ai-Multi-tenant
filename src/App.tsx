
import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import SafariForm from './components/SafariForm';
import ItineraryView from './components/ItineraryView';
import AdminPanel from './components/AdminPanel';
import PropertyDetailView from './components/PropertyDetailView';
import SavedItinerariesList from './components/SavedItinerariesList';
import CostingModule from './components/CostingModule';
import Onboarding from './components/Onboarding';
import CompanyProfile from './components/CompanyProfile';
import PartnersPage from './components/PartnersPage';
import { useAuth } from './hooks/useAuth';
import { SafariFormData, GeneratedItinerary, Lodge, BudgetTier, TransportType, BrandingConfig } from './types';
import { generateSafariItinerary } from './services/aiService';
import { supabase } from './lib/supabase';
import { Compass, Settings, AlertTriangle, Calculator, Loader2, LogOut } from 'lucide-react';
import { Toaster } from 'sonner';
import { Tooltip } from './components/ui/Tooltip';

// Dummy Data for Standalone Calculator Mode
const DUMMY_ITINERARY_STANDALONE: GeneratedItinerary = {
  tripTitle: 'Quick Costing Estimate',
  summary: '',
  totalEstimatedCost: '0',
  highlights: [],
  schedule: []
};

const DUMMY_FORM_DATA_STANDALONE: SafariFormData = {
  name: 'Guest',
  email: '',
  country: '',
  adults: 2,
  youngAdults: 0,
  children: 0,
  startDate: new Date().toISOString().split('T')[0],
  durationDays: 1,
  destinations: [],
  customDestinations: '',
  budget: BudgetTier.MidRange,
  activities: [],
  preferredAccommodations: [],
  otherAccommodations: '',
  transport: TransportType.LandCruiser,
  pickupLocation: '',
  dropoffLocation: '',
  dietaryRequirements: '',
  specialOccasions: ''
};

const DEFAULT_BRANDING: BrandingConfig = {
  appName: 'SafariPlanner.ai',
  appTagline: 'Curation Meets Intelligence',
  primaryColor: '#8f8664',
  secondaryColor: '#413c31',
  titleFont: 'Playfair Display',
  bodyFont: 'Inter',
  titleFontSize: '32px',
  bodyFontSize: '16px',
  titleFontWeight: '800',
  bodyFontWeight: '400',
  titleLetterSpacing: '-0.02em',
  bodyLineHeight: '1.6',
  contactEmail: 'hello@safariplanner.ai',
  contactPhone: '+254 700 000 000',
  contactAddress: 'Nairobi, Kenya',
  whatsappNumber: '+254700000000',
  heroTitle: 'The Art of the Safari, Decoded.',
  heroDescription: "Whether you're a DIY traveler planning a once-in-a-lifetime journey or a professional agent scaling your operations, our intelligence-assisted platform designs expert-grade African adventures in seconds.",
  heroImage: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&q=80&w=1000',
  faqs: [
    {
      q: "Is SafariPlanner.ai for travelers or travel agents?",
      a: "Both. We've built the engine to be versatile. Travelers love the instant, expert-grade itinerary generation, while professionals use our Agency Dashboard for advanced costing, supplier management, and branded documentation."
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
  ],
  testimonials: [
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
  ],
  agencyName: "SafariPlanner.ai",
  agencyDescription: "Empowering Safari Travelers and Agencies through intelligent logistics and modern financial tools. Built for the connoisseurs of the wild.",
  socialLinks: [
    { platform: "Globe", url: "#" },
    { platform: "ShieldCheck", url: "#" }
  ],
  parkFees: [
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
  ],
  transportRates: [
    { type: 'Land Cruiser', dailyRate: 250 },
    { type: 'Overland Truck', dailyRate: 500 },
    { type: 'Minivan', dailyRate: 180 }
  ],
  defaultMarkup: 20,
  defaultTax: 16,
  financeEmail: 'finance@safariplanner.ai',
  formOptions: {
    countries: [
      "United States", "United Kingdom", "Canada", "Australia", "Germany", 
      "France", "Netherlands", "Switzerland", "Italy", "Spain", "Belgium", 
      "Austria", "Sweden", "Norway", "Denmark", "Ireland", "New Zealand", 
      "United Arab Emirates", "India", "China", "Japan", "South Africa", 
      "Brazil", "Mexico", "Other"
    ],
    destinationsByCountry: {
      "Kenya": ["Masai Mara", "Amboseli", "Lake Nakuru", "Samburu", "Tsavo East/West", "Ol Pejeta"],
      "Tanzania": ["Serengeti", "Ngorongoro Crater", "Tarangire", "Lake Manyara", "Ruaha"],
      "Uganda": ["Bwindi Impenetrable", "Queen Elizabeth", "Murchison Falls", "Kibale Forest"],
      "Rwanda": ["Volcanoes NP", "Akagera", "Nyungwe Forest"]
    },
    activities: [
      "Game Drives", "Hot Air Balloon", "Nature Walk", 
      "Bush Dinner", "Cultural Visit (Masai Village)", "Photographic Safari",
      "Gorilla Trekking", "Boat Safari"
    ],
    accommodationTypes: ["Lodge", "Tented Camp", "Boutique Hotel", "Private Villa", "Mobile Camp"]
  }
};

const App: React.FC = () => {
  const { user, profile, company, loading: authLoading, signOut } = useAuth();
  const [formData, setFormData] = useState<SafariFormData | null>(null);
  const [itinerary, setItinerary] = useState<GeneratedItinerary | null>(null);
  const [lodges, setLodges] = useState<Lodge[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeLodge, setActiveLodge] = useState<Lodge | null>(null);
  const [isLandingEnabled, setIsLandingEnabled] = useState(true);
  const [branding, setBranding] = useState<BrandingConfig>(DEFAULT_BRANDING);
  const [systemBranding, setSystemBranding] = useState<BrandingConfig>(DEFAULT_BRANDING);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<'landing' | 'form' | 'itinerary' | 'history' | 'admin' | 'calculator' | 'auth' | 'partners'>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('master') || params.get('itin')) return 'itinerary';
    if (params.get('tool') === 'calculator') return 'calculator';
    if (params.get('tool') === 'planner') return 'form';

    // Force landing as the first page
    return 'landing';
  });

  const [authMode, setAuthMode] = useState<'signup' | 'signin'>('signup');
  const [authType, setAuthType] = useState<'agency' | 'user'>('agency');

  const [isFromHistory, setIsFromHistory] = useState(false);
  const [isFromAdmin, setIsFromAdmin] = useState(false);
  const [isSharedView, setIsSharedView] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return !!(params.get('master') || params.get('itin'));
  });
  const [activeMasterId] = useState<string | undefined>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('master') || undefined;
  });
  const [activeItinId] = useState<string | undefined>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('itin') || undefined;
  });
  const [masterItineraries, setMasterItineraries] = useState<any[]>([]);

  // Persistent state for "My Safaris" to prevent data loss on navigation
  const [historySearchEmail, setHistorySearchEmail] = useState('');
  const [historySearchResults, setHistorySearchResults] = useState<any[]>([]);

  const fetchMasterItinerary = async (id: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('master_itineraries')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      if (data) {
        setItinerary(data.itinerary_data);
        // For master itineraries, we don't have form_data, so we use defaults
        setFormData({
          ...DUMMY_FORM_DATA_STANDALONE,
          name: 'Guest',
          startDate: new Date().toISOString().split('T')[0]
        });
        setIsSharedView(true);
        setViewMode('itinerary');
      } else {
        setError("This safari link is invalid or has expired.");
        setViewMode('form');
      }
    } catch (err: any) {
      console.error("Failed to fetch master itinerary:", err);
      setError("This safari link is invalid or has expired.");
      setViewMode('form');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSharedItinerary = async (id: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('itineraries')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      if (data) {
        setItinerary(data.itinerary_data);
        setFormData(data.form_data);
        setIsSharedView(true);
        setViewMode('itinerary');
      }
    } catch (err: any) {
      console.error("Failed to fetch shared itinerary:", err);
      setError("This itinerary link is invalid or has expired.");
      setViewMode('form');
    } finally {
      setIsLoading(true); // Keep loading state for a bit to show transition
      setTimeout(() => setIsLoading(false), 500);
    }
  };

  // Memoized branding applier to avoid redundant DOM manipulations
  const applyBranding = React.useCallback((config: BrandingConfig) => {
    if (!config) return;
    const root = document.documentElement;
    root.style.setProperty('--primary-color', config.primaryColor || '#8f8664');
    root.style.setProperty('--secondary-color', config.secondaryColor || '#413c31');
    root.style.setProperty('--title-font', `"${config.titleFont || 'Playfair Display'}", sans-serif`);
    root.style.setProperty('--body-font', `"${config.bodyFont || 'Inter'}", sans-serif`);
    root.style.setProperty('--title-size', config.titleFontSize || '32px');
    root.style.setProperty('--body-size', config.bodyFontSize || '16px');
    root.style.setProperty('--title-weight', config.titleFontWeight || '800');
    root.style.setProperty('--body-weight', config.bodyFontWeight || '400');
    root.style.setProperty('--title-spacing', config.titleLetterSpacing || '-0.02em');
    root.style.setProperty('--body-line-height', config.bodyLineHeight || '1.6');
  }, []);

  // 0. Fetch System Branding (Global Defaults)
  useEffect(() => {
    const fetchSystemBranding = async () => {
      try {
        const { data } = await supabase
          .from('companies')
          .select('branding')
          .eq('slug', 'system')
          .single();
        
        if (data?.branding) {
          setSystemBranding(data.branding);
        }
      } catch {
        console.warn("Global system branding not found, using defaults.");
      }
    };
    fetchSystemBranding();
  }, []);

  // 1. Initialize branding and settings on mount or company change
  useEffect(() => {
    // defer updates to avoid synchronous cascade warnings
    const timeoutId = setTimeout(() => {
      // Priority 1: Company data from AuthContext
      if (company?.branding) {
        setBranding(company.branding);
      } else {
        // Priority 2: System Branding (if fetched)
        if (systemBranding) {
          setBranding(systemBranding);
        }
      }

      // Initialize landing page preference
      const savedLanding = localStorage.getItem('safari_config_landing_enabled');
      if (savedLanding !== null && savedLanding !== "undefined") {
        try {
          setIsLandingEnabled(JSON.parse(savedLanding));
        } catch (err) {
          console.error("Failed to parse landing preference:", err);
          setIsLandingEnabled(true);
        }
      }
    }, 0);
    
    return () => clearTimeout(timeoutId);
  }, [company, systemBranding]);

  // 2. Apply branding whenever the brand state changes
  useEffect(() => {
    // Priority: systemBranding for Landing Page, branding (Agency) for everything else
    const targetBranding = viewMode === 'landing' ? systemBranding : (branding || systemBranding);
    applyBranding(targetBranding);
  }, [viewMode, branding, systemBranding, applyBranding]);

  // 3. Listen for cross-tab storage changes
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'safari_config_branding' && e.newValue && e.newValue !== "undefined") {
        try {
          const parsed = JSON.parse(e.newValue);
          setBranding(prev => JSON.stringify(prev) !== JSON.stringify(parsed) ? parsed : prev);
        } catch (err) {
          console.error("Storage sync failed:", err);
        }
      }
      if (e.key === 'safari_config_landing_enabled' && e.newValue && e.newValue !== "undefined") {
        try {
          const parsed = JSON.parse(e.newValue);
          setIsLandingEnabled(prev => prev !== parsed ? parsed : prev);
        } catch (err) {
          console.error("Storage sync failed (landing):", err);
        }
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // 4. Fetch company-specific lodges
  useEffect(() => {
    const fetchLodges = async () => {
      if (!company) return;
      const { data } = await supabase
        .from('lodges')
        .select('*')
        .eq('company_id', company.id);
      if (data) setLodges(data);
    };
    fetchLodges();
  }, [company]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const itinId = params.get('itin');
    const masterId = params.get('master');

    // Defer side-effect fetches to avoid synchronous cascade warnings
    const timeoutId = setTimeout(() => {
      if (itinId) {
        fetchSharedItinerary(itinId);
      } else if (masterId) {
        fetchMasterItinerary(masterId);
      }
    }, 0);
    return () => clearTimeout(timeoutId);
  }, []);

  // 6. Global lodge and master itinerary prefetching
  useEffect(() => {
    const fetchGlobalData = async () => {
      try {
        const [lodgesRes, masterRes] = await Promise.all([
          supabase.from('lodges').select('*'),
          supabase.from('master_itineraries')
            .select('*')
            .order('created_at', { ascending: false })
        ]);

        if (lodgesRes.data) setLodges(prev => lodgesRes.data?.length ? lodgesRes.data : prev);
        if (masterRes.data) setMasterItineraries(masterRes.data);
      } catch (e) {
        console.warn("Data prefetch failed", e);
      }
    };
    
    // Only prefetch if we're on landing or no company is loaded
    if (viewMode === 'landing' || !company) {
      fetchGlobalData();
    }
  }, [viewMode, company]);

  const handleFormSubmit = async (data: SafariFormData) => {
    setFormData(data);
    setIsLoading(true);
    setError(null);
    setIsFromHistory(false);
    setIsFromAdmin(false);
    try {
      const result = await generateSafariItinerary(data);
      setItinerary(result);
      setViewMode('itinerary');
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate itinerary. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setItinerary(null);
    setFormData(null);
    setActiveLodge(null);
    setIsFromHistory(false);
    setIsFromAdmin(false);
    setIsSharedView(false);
    // Clear URL params if exiting standalone tool or shared view
    if (viewMode === 'calculator' || isSharedView) {
      window.history.pushState({}, '', window.location.pathname);
    }
    setViewMode('form');
  };

  const handleEdit = (data?: SafariFormData) => {
    if (data) setFormData(data);
    setItinerary(null);
    setActiveLodge(null);
    setIsFromHistory(false);
    setIsFromAdmin(false);
    setIsSharedView(false);
    setViewMode('form');
  };

  const handleLoadPastItinerary = (pastItinerary: GeneratedItinerary, pastFormData: SafariFormData) => {
    setItinerary(pastItinerary);
    setFormData(pastFormData);
    setIsFromHistory(true);
    setIsFromAdmin(false);
    setIsSharedView(false);
    setViewMode('itinerary');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewLodge = (lodge: Lodge) => {
    setActiveLodge(lodge);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateHome = () => {
    if (isLandingEnabled) setViewMode('landing');
    else setViewMode('form');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-safari-50 text-safari-600">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin" size={48} />
          <p className="font-medium animate-pulse">Authenticating...</p>
        </div>
      </div>
    );
  }

  // Allow shared views, the planner form and results to be public
  const isPublicView = isSharedView || viewMode === 'calculator' || viewMode === 'landing' || viewMode === 'auth' || viewMode === 'form' || viewMode === 'itinerary';

  if (!user && !isPublicView) {
    return <Onboarding onComplete={(type) => setViewMode(type === 'user' ? 'history' : 'admin')} />;
  }

  if (user && !company && !isPublicView && !authLoading) {
    // If no profile exists, they need to complete onboarding
    if (!profile) {
      return <Onboarding onComplete={(type) => setViewMode(type === 'user' ? 'history' : 'admin')} />;
    }
    
    // If they have a profile, only non-travelers (agencies/providers) require a company
    if (profile.user_type !== 'user') {
      return <Onboarding onComplete={(type) => setViewMode(type === 'user' ? 'history' : 'admin')} />;
    }
  }

  if (viewMode === 'auth') {
    return (
      <Onboarding 
        initialMode={authMode} 
        userType={authType} 
        onBack={() => setViewMode('landing')} 
        onComplete={(type) => {
          if (type === 'user') {
            setViewMode('history');
          } else {
            setViewMode('admin');
          }
        }}
      />
    );
  }

  const renderViewContent = () => {
    if (viewMode === 'landing') {
      return (
        <LandingPage 
          branding={systemBranding}
          onViewProfile={() => setIsProfileOpen(true)}
          onViewPartners={() => setViewMode('partners')}
          onStart={() => {
            if (user && profile) {
              const userType = user.user_metadata?.user_type || (profile.company_id ? 'agency' : 'user');
              setViewMode(userType === 'user' ? 'history' : 'admin');
            } else {
              setViewMode('form');
            }
          }} 
          onAuth={() => {
            if (user && profile) {
              const userType = user.user_metadata?.user_type || (profile.company_id ? 'agency' : 'user');
              setViewMode(userType === 'user' ? 'history' : 'admin');
            } else {
              setAuthMode('signin');
              setAuthType('user');
              setViewMode('auth');
            }
          }}
          onAdmin={() => setViewMode('admin')} 
          onCalculator={() => setViewMode('calculator')}
          masterItineraries={masterItineraries}
          isAuthenticated={!!user}
        />
      );
    }

    if (viewMode === 'partners') {
      return (
        <PartnersPage 
          branding={branding}
          onBack={() => setViewMode('landing')}
          onViewProfile={(companyId) => {
            setSelectedCompanyId(companyId);
            setIsProfileOpen(true);
          }}
        />
      );
    }

    if (viewMode === 'admin') {
      return (
        <AdminPanel 
          onClose={navigateHome} 
        />
      );
    }

    if (viewMode === 'calculator') {
      return (
        <div className="min-h-screen bg-safari-50">
          {/* Public Tool Header */}
          <header className="bg-safari-900 text-white p-4 shadow-lg">
            <div className="max-w-6xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-2 cursor-pointer" onClick={navigateHome}>
                <Compass className="text-safari-400" size={24} />
                <span className="font-extrabold text-lg tracking-tight">Safari<span className="text-safari-400">Calculator</span></span>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={navigateHome}
                  className="text-xs font-bold text-safari-300 hover:text-white transition-colors bg-white/10 px-4 py-2 rounded-md border border-white/10"
                >
                  Home
                </button>
                <div className="flex items-center gap-2 text-safari-400 text-[10px] font-bold uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                  <Calculator size={14} /> Agent Tooling
                </div>
              </div>
            </div>
          </header>

          <main className="p-4 md:p-8">
            <CostingModule 
              itinerary={DUMMY_ITINERARY_STANDALONE} 
              formData={DUMMY_FORM_DATA_STANDALONE} 
              lodges={lodges} 
              branding={branding}
              onBack={navigateHome} 
              initialMode="calculator"
            />
          </main>

          <footer className="p-8 text-center text-safari-400 text-[10px] font-medium uppercase tracking-[0.2em]">
            © 2026 SafariPlanner.ai • Powered by Intelligence, Crafted by Humans
          </footer>
        </div>
      );
    }

    return (
      <div className="min-h-screen pb-10 bg-safari-50">
        <Toaster position="top-right" richColors />
        <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-safari-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-2 cursor-pointer" onClick={navigateHome}>
              <Compass className="text-safari-600" size={32} />
              <h1 className="text-xl md:text-2xl font-bold text-safari-900 tracking-tight">
                Safari<span className="text-safari-600">Planner</span>.ai
              </h1>
            </div>
                  <div className="flex items-center gap-2 md:gap-4">
                    <button 
                      onClick={navigateHome}
                      className="text-sm font-bold text-safari-600 hover:text-safari-900 px-4 py-2 hover:bg-safari-50 rounded-lg transition-all"
                    >
                      Home
                    </button>
                    {!user && (
                      <button 
                        onClick={() => {
                          setAuthMode('signin');
                          setAuthType('user');
                          setViewMode('auth');
                        }}
                        className="text-sm font-bold text-safari-600 hover:text-safari-900 px-4 py-2 hover:bg-safari-50 rounded-lg transition-all"
                      >
                        My Safaris
                      </button>
                    )}
                    {user && (
                      <>
                        <div className="hidden lg:flex flex-col items-end mr-2">
                          <span className="text-xs font-bold text-safari-900">{profile?.full_name}</span>
                          <span className="text-[10px] text-safari-500 uppercase tracking-wider">{company?.name}</span>
                        </div>
                        {profile?.user_type !== 'user' && (
                          <Tooltip content="Access the Partner Dashboard">
                            <button 
                              onClick={() => setViewMode('admin')}
                              className="text-safari-400 hover:text-safari-600 transition-colors p-2 rounded-full hover:bg-safari-50"
                              title="Partner Dashboard"
                            >
                              <Settings size={20} />
                            </button>
                          </Tooltip>
                        )}
                        <Tooltip content="Sign Out">
                          <button 
                            onClick={signOut}
                            className="text-safari-400 hover:text-red-600 transition-colors p-2 rounded-full hover:bg-red-50"
                            title="Sign Out"
                          >
                            <LogOut size={20} />
                          </button>
                        </Tooltip>
                      </>
                    )}
                  </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-4 rounded-xl mb-8 flex items-start gap-3 animate-fadeIn">
              <AlertTriangle className="shrink-0 mt-0.5" size={20} />
              <div>
                <strong className="font-bold text-sm">System Alert: </strong>
                <span className="block sm:inline text-sm">{error}</span>
              </div>
            </div>
          )}

          {activeLodge ? (
            <PropertyDetailView 
              lodge={activeLodge} 
              onBack={() => setActiveLodge(null)} 
            />
          ) : viewMode === 'history' ? (
            <SavedItinerariesList 
              initialEmail={historySearchEmail}
              initialResults={historySearchResults}
              companyId={company?.id}
              onSearchUpdate={(email, results) => {
                setHistorySearchEmail(email);
                setHistorySearchResults(results);
              }}
              onView={handleLoadPastItinerary} 
              onEdit={handleEdit} 
              onBack={() => setViewMode('form')}
            />
          ) : viewMode === 'form' ? (
            <div className="space-y-8">
              <div className="text-center max-w-2xl mx-auto mb-10">
                <h2 className="text-3xl md:text-4xl font-extrabold text-safari-900 mb-4">Design Your Custom Safari</h2>
                <p className="text-base md:text-lg text-safari-600">
                  Experience the wild with a precision-crafted African adventure, tailored to your budget and interests.
                </p>
              </div>
              <SafariForm 
                key={formData ? (formData.email || 'edit') : 'new'}
                branding={branding}
                onSubmit={handleFormSubmit} 
                isLoading={isLoading} 
                initialData={formData || undefined}
              />
            </div>
          ) : (!itinerary || !formData) ? (
            isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 min-h-[400px]">
                <Loader2 className="animate-spin text-safari-600 mb-4" size={48} />
                <p className="text-safari-600 font-medium animate-pulse">Loading your safari itinerary...</p>
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-safari-100 p-12">
                <AlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
                <h3 className="text-xl font-bold text-safari-900 mb-2">Itinerary Not Found</h3>
                <p className="text-safari-600 mb-8">We couldn't find the safari itinerary you're looking for. It may have been deleted or the link is incorrect.</p>
                <button 
                  onClick={navigateHome} 
                  className="bg-safari-600 text-white px-8 py-3 rounded-full font-bold hover:bg-safari-700 transition-all shadow-lg"
                >
                  Return to Home
                </button>
              </div>
            )
          ) : (
            <ItineraryView 
              itinerary={itinerary} 
              formData={formData} 
              lodges={lodges} 
              branding={branding}
              onReset={handleReset} 
              onEdit={() => handleEdit(formData)} 
              onViewLodge={handleViewLodge}
              onBackToHistory={isFromHistory ? () => setViewMode('history') : (isFromAdmin ? () => setViewMode('admin') : undefined)}
              onAuthNeeded={(mode, type) => {
                setAuthMode(mode);
                setAuthType(type);
                setViewMode('auth');
              }}
              isFromAdmin={isFromAdmin}
              isSharedView={isSharedView}
              masterId={activeMasterId}
              itinId={activeItinId}
            />
          )}
        </main>
      </div>
    );
  };

  return (
    <>
      <Toaster position="top-right" richColors />
      {renderViewContent()}
      
      {isProfileOpen && (company || selectedCompanyId) && (
        <CompanyProfile 
          companyId={selectedCompanyId || company?.id || ''} 
          branding={branding} 
          onClose={() => {
            setIsProfileOpen(false);
            setSelectedCompanyId(null);
          }} 
        />
      )}
    </>
  );
};

export default App;
