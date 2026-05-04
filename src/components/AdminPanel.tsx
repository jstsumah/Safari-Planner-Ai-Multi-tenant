
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Plus, Trash2, Save, Building, Building2, LogOut, Loader2, 
  Edit3, Home,
  LayoutDashboard, MessageSquare, Menu, ChevronLeft, ChevronDown, ChevronUp,
  RefreshCw, Compass, MapPin, Mail, Phone,
  Eye, ReceiptText, FileText, CreditCard,
  Calculator, Bookmark, FileCheck, Wand2,
  Wallet, Settings as SettingsIcon, Palette,
  Share2, Check, Users, UserPlus, Type, Image as ImageIcon, HelpCircle, Quote, Database,
  ShieldAlert, ShieldCheck, Upload, TrendingUp, ArrowUpRight, BarChart3, Activity, Clock, ArrowLeft, Link, Lock
} from 'lucide-react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell 
} from 'recharts';
import { toast } from 'sonner';
import { Lodge, SafariFormData, GeneratedItinerary, CostingReport, Payment, BudgetTier, TransportType, BrandingConfig, TeamMember } from '../types';
import CompanyProfile from './CompanyProfile';
import { supabase } from '../lib/supabase';
import DatabaseStatus from './DatabaseStatus';
import CostingModule from './CostingModule';
import InvoiceModule from './InvoiceModule';
import PaymentModule from './PaymentModule';
import ReceiptModule from './ReceiptModule';
import LodgeEditor from './LodgeEditor';
import PropertyDetailView from './PropertyDetailView';
import MasterItineraryEditor from './MasterItineraryEditor';
import DisbursementModule from './DisbursementModule';
import PaymentVoucherModule from './PaymentVoucherModule';
import ItineraryView from './ItineraryView';
import SafariForm from './SafariForm';
import { SubscriptionPage } from './SubscriptionPage';
import { generateSafariItinerary } from '../services/aiService';

import { Tooltip } from './ui/Tooltip';
import { useAuth } from '../hooks/useAuth';

interface AdminPanelProps {
  onClose: () => void;
}

const DUMMY_ITINERARY: GeneratedItinerary = {
  tripTitle: 'Quick Costing Estimate',
  summary: '',
  totalEstimatedCost: '0',
  highlights: [],
  schedule: []
};

const DUMMY_FORM_DATA: SafariFormData = {
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

const FONT_OPTIONS = [
  { name: 'Inter', category: 'Sans' },
  { name: 'Montserrat', category: 'Sans' },
  { name: 'Poppins', category: 'Sans' },
  { name: 'Roboto', category: 'Sans' },
  { name: 'Open Sans', category: 'Sans' },
  { name: 'Playfair Display', category: 'Serif' },
  { name: 'Lora', category: 'Serif' },
  { name: 'Merriweather', category: 'Serif' },
  { name: 'Cormorant Garamond', category: 'Serif' },
  { name: 'JetBrains Mono', category: 'Mono' },
  { name: 'Fira Code', category: 'Mono' },
  { name: 'Space Mono', category: 'Mono' },
];

const PRESET_PALETTES = [
  { name: 'Safari Classic', primary: '#8f8664', secondary: '#413c31', description: 'Earthy tones of the Savanna' },
  { name: 'Midnight Oasis', primary: '#2a4494', secondary: '#1e204c', description: 'Deep blues and night sky' },
  { name: 'Desert Rose', primary: '#d48d8d', secondary: '#4a3232', description: 'Warm sands and sunset' },
  { name: 'Jungle Mist', primary: '#4f7942', secondary: '#1b3022', description: 'Vibrant greens and forest depth' },
  { name: 'Golden Sun', primary: '#d4af37', secondary: '#5c4033', description: 'Royal gold and rich wood' },
  { name: 'Serengeti Dusk', primary: '#e07a5f', secondary: '#3d405b', description: 'Burnt orange and slate' },
  { name: 'Okavango', primary: '#0077b6', secondary: '#023e8a', description: 'River blues and deep waters' },
  { name: 'Baobab', primary: '#dda15e', secondary: '#606c38', description: 'Sun-drenched wood and leaves' },
  { name: 'Zanzibar', primary: '#48cae4', secondary: '#0077b6', description: 'Turquoise ocean and sky' },
];

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
  h1Font: 'Playfair Display',
  h1FontSize: '48px',
  h1FontWeight: '900',
  h1LetterSpacing: '-0.03em',
  h2Font: 'Playfair Display',
  h2FontSize: '36px',
  h2FontWeight: '800',
  h2LetterSpacing: '-0.02em',
  h3Font: 'Playfair Display',
  h3FontSize: '30px',
  h3FontWeight: '700',
  h3LetterSpacing: '-0.01em',
  h4Font: 'Inter',
  h4FontSize: '24px',
  h4FontWeight: '700',
  h4LetterSpacing: '0',
  h5Font: 'Inter',
  h5FontSize: '20px',
  h5FontWeight: '600',
  h5LetterSpacing: '0',
  h6Font: 'Inter',
  h6FontSize: '18px',
  h6FontWeight: '600',
  h6LetterSpacing: '0',
  agencyName: 'SafariPlanner.ai',
  agencyDescription: 'Expert-grade African adventures in seconds.',
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
      a: "Both. We've built the engine to be versatile. Travelers love the instant, expert-grade itinerary generation, while professionals use our Management Hub for advanced costing, supplier management, and branded documentation."
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
  },
  socialLinks: [],
  parkFees: [],
  transportRates: [],
  defaultMarkup: 20,
  defaultTax: 16,
  financeEmail: 'finance@safariplanner.ai'
};

type AdminTab = 'dashboard' | 'properties' | 'property_edit' | 'property_view' | 'leads' | 'costing' | 'quotations' | 'invoices' | 'invoice_editor' | 'payments' | 'receipts' | 'signature_safaris' | 'safari_edit' | 'calculator' | 'planner' | 'disbursements' | 'payment_vouchers' | 'settings' | 'itinerary_view' | 'team' | 'super_hub';

const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const { user, profile, company, refreshProfile, signOut } = useAuth();
  
  // Navigation State
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [managedCompanyId, setManagedCompanyId] = useState<string | null>(null);

  const [tabHistory, setTabHistory] = useState<AdminTab[]>(['dashboard']);
  const [navigationSource, setNavigationSource] = useState<AdminTab>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Global Loading State
  const [isLoading, setIsLoading] = useState(false);

  // Configuration State
  const [branding, setBranding] = useState<BrandingConfig>(DEFAULT_BRANDING);
  const [globalBranding, setGlobalBranding] = useState<BrandingConfig>(DEFAULT_BRANDING);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'system' | 'visuals' | 'landing' | 'business' | 'data'>('visuals');

  // Data State
  const [leads, setLeads] = useState<any[]>([]);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [masterItineraries, setMasterItineraries] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLeadsLoading, setIsLeadsLoading] = useState(false);
  const [isQuotesLoading, setIsQuotesLoading] = useState(false);
  const [isMasterLoading, setIsMasterLoading] = useState(false);
  const [isTeamLoading, setIsTeamLoading] = useState(false);
  const [isSavingBranding, setIsSavingBranding] = useState(false);
  
  const [lodges, setLodges] = useState<Lodge[]>([]);
  const [customRates, setCustomRates] = useState<LodgeCustomRate[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  const [allTeamMembers, setAllTeamMembers] = useState<any[]>([]);

  // Derived Management Context State
  const managedCompany = useMemo(() => {
    if (!managedCompanyId) return null;
    return companies.find((c: any) => c.id === managedCompanyId);
  }, [managedCompanyId, companies]);

  const effectiveCompany = useMemo(() => {
    if (profile?.is_super_user && managedCompany) return managedCompany;
    return company;
  }, [profile, managedCompany, company]);

  const effectiveCompanyId = effectiveCompany?.id;

  // Subscription & Trial Logic - Robust detection
  const subStatus = effectiveCompany?.branding?.subscription_status || 
                   (effectiveCompany as any)?.subscription_status || 
                   (profile as any)?.subscription_status;
                   
  const trialEndsAt = effectiveCompany?.branding?.trial_ends_at || 
                      (effectiveCompany as any)?.trial_ends_at || 
                      (profile as any)?.trial_ends_at;

  const isTrial = subStatus === 'trial';
  const trialExpired = isTrial && trialEndsAt && new Date(trialEndsAt) < new Date();
  const daysRemaining = isTrial && trialEndsAt && !trialExpired
    ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const isRestricted = trialExpired && !profile?.is_super_user && activeTab !== 'subscription' && activeTab !== 'dashboard';

  // Plan Usage Logic
  const usageStats = useMemo(() => {
    const isStarter = subStatus === 'starter';
    const myLodges = lodges.filter(l => l.company_id === effectiveCompanyId).length;
    const myItineraries = quotations.filter(q => q.company_id === effectiveCompanyId).length;
    
    return {
      lodges: {
        current: myLodges,
        max: isStarter ? 5 : Infinity,
        percent: isStarter ? Math.min(100, (myLodges / 5) * 100) : 0
      },
      itineraries: {
        current: myItineraries,
        max: isStarter ? 30 : Infinity,
        percent: isStarter ? Math.min(100, (myItineraries / 30) * 100) : 0
      }
    };
  }, [subStatus, lodges, quotations, effectiveCompanyId]);

  const navigateToTab = useCallback((tab: AdminTab) => {
    setActiveTab(tab);
    setTabHistory(prev => {
      // Don't push duplicate consecutive tabs
      if (prev[prev.length - 1] === tab) return prev;
      return [...prev, tab];
    });
  }, []);

  const goBack = useCallback(() => {
    setTabHistory(prev => {
      if (prev.length <= 1) {
        setActiveTab('dashboard');
        return ['dashboard'];
      }
      const newHistory = [...prev];
      newHistory.pop(); // Remove current tab
      const previousTab = newHistory[newHistory.length - 1];
      setActiveTab(previousTab);
      return newHistory;
    });
  }, []);

  const [isLodgesLoading, setIsLodgesLoading] = useState(false);
  const [selectedLodge, setSelectedLodge] = useState<Lodge | null>(null);
  const [selectedMaster, setSelectedMaster] = useState<any | null>(null);
  const [copyingMasterId, setCopyingMasterId] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [viewingItinerary, setViewingItinerary] = useState<{itinerary: GeneratedItinerary, formData: SafariFormData, id?: string, type?: 'lead' | 'master' | 'planner'} | null>(null);
  const [isPlannerLoading, setIsPlannerLoading] = useState(false);
  const [isFinancialsOpen, setIsFinancialsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handlePlannerSubmit = async (data: SafariFormData) => {
    setIsPlannerLoading(true);
    try {
      // Create a trip title
      data.tripTitle = data.tripTitle || `${data.name}'s Custom Safari`;
      const result = await generateSafariItinerary(data);
      setViewingItinerary({ itinerary: result, formData: data, type: 'planner' });
      navigateToTab('itinerary_view');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to generate itinerary. Please try again.");
    } finally {
      setIsPlannerLoading(false);
    }
  };

  // Super Hub Add States
  const [isAddCompanyOpen, setIsAddCompanyOpen] = useState(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isAddPartnerOpen, setIsAddPartnerOpen] = useState(false);
  const [newCompanyData, setNewCompanyData] = useState({
    name: '',
    slug: '',
    branding: DEFAULT_BRANDING
  });
  const [newUserData, setNewUserData] = useState({
    full_name: '',
    email: '',
    company_id: '',
    user_type: 'agency' as 'agency' | 'user' | 'provider'
  });
  const [newPartnerData, setNewPartnerData] = useState({
    name: '',
    logoUrl: '',
    websiteUrl: ''
  });

  // Team Management State
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [memberFormData, setMemberFormData] = useState({
    name: '',
    role: '',
    bio: '',
    photo_url: '',
    email: '',
    phone: '',
    is_public: true,
    system_role: 'staff' as 'admin' | 'staff'
  });

  // New Quotation State
  const [isNewQuoteModalOpen, setIsNewQuoteModalOpen] = useState(false);
  const [quoteSource, setQuoteSource] = useState<any | null>(null);
  const [newQuoteData, setNewQuoteData] = useState({
    clientName: '',
    clientEmail: '',
    tripTitle: '',
    startDate: new Date().toISOString().split('T')[0],
    durationDays: 7,
    adults: 2,
    youngAdults: 0,
    children: 0
  });

  const fetchLodges = useCallback(async () => {
    setIsLodgesLoading(true);
    const query = supabase.from('lodges').select('*');
    try {
      const { data, error } = await query
        .order('created_at', { ascending: false });
      if (error) throw error;
      setLodges(data || []);
    } catch (err: any) { console.error(err); } finally { setIsLodgesLoading(false); }
  }, []);

  const fetchGlobalData = useCallback(async () => {
    if (!profile?.is_super_user) return;
    try {
      const { data: cos, error: ce } = await supabase.from('companies').select('*').order('name');
      if (ce) throw ce;
      setCompanies(prev => JSON.stringify(prev) === JSON.stringify(cos || []) ? prev : (cos || []));

      const { data: pros, error: pe } = await supabase.from('profiles').select('*').order('full_name');
      if (pe) throw pe;
      setAllProfiles(prev => JSON.stringify(prev) === JSON.stringify(pros || []) ? prev : (pros || []));

      const { data: teams, error: te } = await supabase.from('team_members').select('*');
      if (te) throw te;
      setAllTeamMembers(prev => JSON.stringify(prev) === JSON.stringify(teams || []) ? prev : (teams || []));
    } catch (err: any) {
      console.error("Global fetch error:", err);
    }
  }, [profile]);

  const fetchCustomRates = useCallback(async () => {
    if (!effectiveCompanyId) return;
    try {
      const { data, error } = await supabase.from('lodge_custom_rates')
        .select('*')
        .eq('company_id', effectiveCompanyId);
      if (error) throw error;
      setCustomRates(data || []);
    } catch (err: any) { console.error(err); }
  }, [effectiveCompanyId]);

  const fetchMasterItineraries = useCallback(async () => {
    if (!effectiveCompanyId && !profile?.is_super_user) return;
    setIsMasterLoading(true);
    try {
      let query = supabase.from('master_itineraries').select('*');
      if (effectiveCompanyId) {
        query = query.eq('company_id', effectiveCompanyId);
      } else if (profile?.is_super_user && !managedCompanyId) {
        // Global master itineraries (created by system/null) 
        query = query.is('company_id', null);
      }
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      setMasterItineraries(data || []);
    } catch (err: any) { console.error(err); } finally { setIsMasterLoading(false); }
  }, [effectiveCompanyId, profile, managedCompanyId]);

  const fetchLeads = useCallback(async () => {
    if (!effectiveCompanyId && !profile?.is_super_user) return;
    setIsLeadsLoading(true);
    try {
      let query = supabase.from('itineraries').select('*');
      
      if (profile?.is_super_user && !managedCompanyId) {
        // Super user sees ALL leads across the network when no specific company is selected
        // We don't filter by company_id here to give a full overview
      } else if (effectiveCompanyId) {
        // Partners see leads for their company
        // If we want to support assignment in the future, we need to add assigned_company_id column
        // For now, we pull leads where company_id is the effective company
        query = query.eq('company_id', effectiveCompanyId);
      }

      const { data, error } = await query
        .is('costing_report', null)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setLeads(data || []);
    } catch (err: any) { 
      console.error("fetchLeads error:", err); 
    } finally { 
      setIsLeadsLoading(false); 
    }
  }, [effectiveCompanyId, profile, managedCompanyId]);

  const fetchQuotations = useCallback(async () => {
    if (!effectiveCompanyId && !profile?.is_super_user) return;
    setIsQuotesLoading(true);
    try {
      let query = supabase.from('itineraries').select('*');
      if (effectiveCompanyId) {
        query = query.eq('company_id', effectiveCompanyId);
      } 
      // If super user and no managedCompanyId, we don't add an .eq filter, effectively fetching all records
      
      const { data, error } = await query
        .not('costing_report', 'is', null)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      setQuotations(data || []);
    } catch (err: any) { console.error(err); } finally { setIsQuotesLoading(false); }
  }, [effectiveCompanyId, profile, managedCompanyId]);

  const fetchPayments = useCallback(async () => {
    if (!effectiveCompanyId && !profile?.is_super_user) return;
    try {
      let query = supabase.from('payments').select('*');
      if (effectiveCompanyId) {
        query = query.eq('company_id', effectiveCompanyId);
      }
      const { data, error } = await query.order('date', { ascending: false });
      
      if (error) throw error;
      
      // Map database fields to frontend Payment interface if necessary
      const mappedPayments: Payment[] = (data || []).map(p => ({
        id: p.id,
        itineraryId: p.itinerary_id,
        amount: p.amount,
        date: p.date,
        method: p.method,
        reference: p.reference,
        customerName: p.customer_name,
        tripTitle: p.trip_title
      }));
      
      setPayments(mappedPayments);
    } catch (err: any) {
      console.error("Failed to fetch payments:", err);
    }
  }, [effectiveCompanyId, profile, managedCompanyId]);

  const fetchTeamMembers = useCallback(async () => {
    if (!effectiveCompanyId && !profile?.is_super_user) return;
    setIsTeamLoading(true);
    try {
      let query = supabase.from('team_members').select('*');
      if (effectiveCompanyId) {
        query = query.eq('company_id', effectiveCompanyId);
      }
      const { data, error } = await query
        .order('created_at', { ascending: false });
      if (error) {
        if (error.code === 'PGRST116' || error.message.includes('relation "team_members" does not exist')) {
          setTeamMembers([]);
          return;
        }
        throw error;
      }
      setTeamMembers(data || []);
    } catch (err: any) { console.error(err); } finally { setIsTeamLoading(false); }
  }, [effectiveCompanyId, profile, managedCompanyId]);

  const fetchConfig = useCallback(async () => {
    if (effectiveCompany && effectiveCompany.branding) {
      setBranding(effectiveCompany.branding);
    }
    
    // Always fetch global branding for super admin management
    try {
      const { data } = await supabase
        .from('companies')
        .select('branding')
        .eq('slug', 'system')
        .single();
      
      if (data?.branding) {
        setGlobalBranding(data.branding);
      }
    } catch {
      console.warn("Global system branding not found, using defaults.");
      setGlobalBranding(DEFAULT_BRANDING);
    }
  }, [effectiveCompany]);

  const fetchAllData = useCallback(() => {
    fetchLodges();
    fetchCustomRates();
    fetchLeads();
    fetchQuotations();
    fetchPayments();
    fetchMasterItineraries();
    fetchTeamMembers();
    fetchConfig();
    if (profile?.is_super_user) fetchGlobalData();
  }, [fetchLodges, fetchCustomRates, fetchLeads, fetchQuotations, fetchPayments, fetchMasterItineraries, fetchTeamMembers, fetchConfig, fetchGlobalData, profile]);

  useEffect(() => {
    if (company || profile?.is_super_user) {
      // Defer to avoid synchronous cascade warnings during mount/render
      const timeoutId = setTimeout(() => {
        fetchAllData();
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [company, profile?.is_super_user, fetchAllData, managedCompanyId]);

  // 1. Live preview effect for branding changes
  useEffect(() => {
    if (branding) {
      const root = document.documentElement;
      // Only update if these differ from current style to avoid excessive re-paints
      const primary = branding.primaryColor || '#8f8664';
      if (root.style.getPropertyValue('--primary-color') !== primary) {
        root.style.setProperty('--primary-color', primary);
      }
      const secondary = branding.secondaryColor || '#413c31';
      if (root.style.getPropertyValue('--secondary-color') !== secondary) {
        root.style.setProperty('--secondary-color', secondary);
      }
      // ... apply other branding (shorthand for brevity or keeping original logic with basic guards)
      root.style.setProperty('--title-font', `"${branding.titleFont || 'Playfair Display'}", sans-serif`);
      root.style.setProperty('--body-font', `"${branding.bodyFont || 'Inter'}", sans-serif`);
      root.style.setProperty('--title-size', branding.titleFontSize || '32px');
      root.style.setProperty('--body-size', branding.bodyFontSize || '16px');
      root.style.setProperty('--title-weight', branding.titleFontWeight || '800');
      root.style.setProperty('--body-weight', branding.bodyFontWeight || '400');
      root.style.setProperty('--title-spacing', branding.titleLetterSpacing || '-0.02em');
      root.style.setProperty('--body-line-height', branding.bodyLineHeight || '1.6');
    }
  }, [branding]);

  // Self-healing: Ensure user is in the team_members list
  const teamCheckPerformed = React.useRef(false);
  useEffect(() => {
    const ensureUserInTeam = async () => {
      if (company && profile && user && teamMembers.length > 0 && !teamCheckPerformed.current) {
        const isUserInTeam = teamMembers.some(m => m.email?.toLowerCase() === user.email?.toLowerCase());
        if (!isUserInTeam) {
          try {
            await supabase
              .from('team_members')
              .insert([{
                company_id: company.id,
                name: profile.full_name || user.user_metadata?.full_name || 'Team Member',
                role: profile.role === 'admin' ? 'Managing Director' : 'Specialist',
                email: user.email!,
                bio: 'Professional Safari Specialist.',
                photo_url: user.user_metadata?.avatar_url || ''
              }]);
            fetchTeamMembers();
          } catch (err) {
            console.warn("Auto-team check failed:", err);
          }
        }
        teamCheckPerformed.current = true;
      }
    };
    ensureUserInTeam();
  }, [user, profile, company, teamMembers, fetchTeamMembers]);

  const handleSaveBranding = async () => {
    const isLandingTab = activeSettingsTab === 'landing' && profile?.is_super_user;
    const targetBranding = isLandingTab ? globalBranding : branding;
    
    setIsSavingBranding(true);
    try {
      if (isLandingTab) {
        // Save to system record
        const { data: systemCo } = await supabase.from('companies').select('id').eq('slug', 'system').single();
        
        let targetId;
        if (systemCo) {
          targetId = systemCo.id;
        } else {
          // Create system record if missing
          const { data: newCo, error: createError } = await supabase
            .from('companies')
            .insert([{ name: 'System Global Defaults', slug: 'system', branding: targetBranding }])
            .select()
            .single();
          if (createError) throw createError;
          targetId = newCo.id;
        }

        const { error } = await supabase
          .from('companies')
          .update({ 
            branding: targetBranding,
            updated_at: new Date().toISOString()
          })
          .eq('id', targetId);
        
        if (error) throw error;
        toast.success("Global landing page configuration updated.");
      } else {
        const targetId = effectiveCompanyId;
        if (!targetId) return;
        const updatePayload: any = {
           branding: targetBranding,
           updated_at: new Date().toISOString()
        };
        if (targetBranding.agencyName) {
           updatePayload.name = targetBranding.agencyName;
        }
        const { error } = await supabase
          .from('companies')
          .update(updatePayload)
          .eq('id', targetId);
        
        if (error) throw error;
        toast.success(managedCompanyId ? `Settings updated for ${managedCompany?.name}` : "Agency branding updated.");
      }

      await refreshProfile();
      // No need to call fetchConfig() here because the local state is already up to date, 
      // and calling it now would temporarily revert the UI to the old company.branding 
      // before refreshProfile's state update is flushed.
    } catch (err: any) {
      toast.error("Failed to save: " + err.message);
    } finally {
      setIsSavingBranding(false);
    }
  };

  const handleHeroImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File is too large. Maximum size is 2MB for optimized storage.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (activeSettingsTab === 'landing' && profile?.is_super_user) {
        setGlobalBranding({ ...globalBranding, heroImage: result });
      } else {
        setBranding({ ...branding, heroImage: result });
      }
      toast.success("Image uploaded. Remember to save configuration changes.");
    };
    reader.readAsDataURL(file);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File is too large. Maximum size is 2MB for optimized storage.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setBranding({ ...branding, agencyLogo: result });
      toast.success("Logo uploaded. Remember to save changes.");
    };
    reader.readAsDataURL(file);
  };

  const handleRecordPayment = async (paymentData: Partial<Payment>) => {
    if (!company) return;
    try {
      const dbPayment = {
        company_id: company.id,
        itinerary_id: paymentData.itineraryId,
        amount: paymentData.amount,
        date: paymentData.date,
        method: paymentData.method,
        reference: paymentData.reference,
        customer_name: paymentData.customerName,
        trip_title: paymentData.tripTitle
      };

      const { error } = await supabase
        .from('payments')
        .insert([dbPayment])
        .select()
        .single();

      if (error) throw error;

      // Refresh payments list
      fetchPayments();

      if (paymentData.itineraryId) {
        const relevantLead = quotations.find(q => q.id === paymentData.itineraryId);
        if (relevantLead && relevantLead.costing_report) {
          const totalCost = Math.round(relevantLead.costing_report.total);
          
          // Re-fetch all payments for this itinerary to be accurate
          const { data: itineraryPayments } = await supabase
            .from('payments')
            .select('amount')
            .eq('itinerary_id', paymentData.itineraryId);
          
          const totalPaidSoFar = (itineraryPayments || []).reduce((sum, p) => sum + p.amount, 0);
          const newStatus = totalPaidSoFar >= totalCost ? 'paid' : 'partially_paid';
          
          await supabase.from('itineraries').update({ status: newStatus }).eq('id', paymentData.itineraryId);
          fetchQuotations();
        }
      }
      toast.success("Payment recorded successfully.");
    } catch (err: any) {
      toast.error("Failed to record payment: " + err.message);
    }
  };

  const handleToggleConfirmation = async (quote: any) => {
    const currentStatus = quote.status || 'quoted';
    const newStatus = ['confirmed', 'partially_paid', 'paid'].includes(currentStatus) ? 'quoted' : 'confirmed';
    try {
      const { error } = await supabase.from('itineraries').update({ status: newStatus }).eq('id', quote.id);
      if (error) throw error;
      fetchQuotations();
      toast.success(`Booking status updated to ${newStatus}.`);
    } catch (err: any) { 
      toast.error("Failed to update status: " + err.message);
    }
  };

  const handleCreateDirectQuote = async () => {
    if (!company) return;
    if (!newQuoteData.clientName || !newQuoteData.clientEmail || !newQuoteData.tripTitle) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const formData: SafariFormData = {
        ...DUMMY_FORM_DATA,
        name: newQuoteData.clientName,
        email: newQuoteData.clientEmail,
        startDate: newQuoteData.startDate,
        durationDays: newQuoteData.durationDays,
        adults: newQuoteData.adults,
        youngAdults: newQuoteData.youngAdults,
        children: newQuoteData.children
      };

      const itinerary: GeneratedItinerary = quoteSource ? {
        ...quoteSource.itinerary_data,
        tripTitle: newQuoteData.tripTitle
      } : {
        ...DUMMY_ITINERARY,
        tripTitle: newQuoteData.tripTitle
      };

      const { data, error } = await supabase
        .from('itineraries')
        .insert([{
          company_id: company.id,
          customer_name: newQuoteData.clientName,
          customer_email: newQuoteData.clientEmail,
          trip_title: newQuoteData.tripTitle,
          itinerary_data: itinerary,
          form_data: formData,
          status: 'quoted',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success('Direct quotation created successfully');
      setIsNewQuoteModalOpen(false);
      setQuoteSource(null);
      
      // Refresh quotations list
      fetchQuotations();
      
      // Automatically open costing for the new quote
      setSelectedLead(data);
      setActiveTab('costing');
    } catch (error: any) {
      console.error('Error creating direct quote:', error);
      toast.error('Failed to create direct quotation: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this team member?')) return;
    try {
      const { error } = await supabase.from('team_members').delete().eq('id', id);
      if (error) throw error;
      toast.success('Team member removed.');
      fetchTeamMembers();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleSaveTeamMember = async () => {
    if (!memberFormData.name || !memberFormData.role || !memberFormData.email) {
      toast.error('Name, Role and Email are required.');
      return;
    }
    setIsLoading(true);
    try {
      const dataToSave = { ...memberFormData };
      delete (dataToSave as any).system_role;
      const payload = {
        ...dataToSave,
        company_id: company?.id,
        updated_at: new Date().toISOString()
      };
      
      let error;
      if (selectedMember) {
        const { error: err } = await supabase.from('team_members').update(payload).eq('id', selectedMember.id);
        error = err;
      } else {
        const { error: err } = await supabase.from('team_members').insert([payload]);
        error = err;
      }

      if (error) throw error;
      toast.success(selectedMember ? 'Member updated.' : 'Member added. Click "Email Invite" on their card to email them a signup link.');
      setIsTeamModalOpen(false);
      fetchTeamMembers();
    } catch (err: any) { toast.error(err.message); } finally { setIsLoading(false); }
  };

  const handleSavePartner = async () => {
    if (!newPartnerData.name || !newPartnerData.logoUrl) {
      toast.error("Partner name and logo URL are required.");
      return;
    }
    setIsLoading(true);
    try {
      const updatedPartners = [
        ...(globalBranding.globalPartners || []),
        { id: `ptr-${Date.now()}`, ...newPartnerData }
      ];
      
      const { data: systemCo } = await supabase.from('companies').select('id').eq('slug', 'system').single();
      if (!systemCo) throw new Error("System company not found.");

      const { error } = await supabase
        .from('companies')
        .update({ branding: { ...globalBranding, globalPartners: updatedPartners } })
        .eq('id', systemCo.id);
      
      if (error) throw error;
      toast.success("Partner added to slideshow.");
      setGlobalBranding({ ...globalBranding, globalPartners: updatedPartners });
      setIsAddPartnerOpen(false);
      setNewPartnerData({ name: '', logoUrl: '', websiteUrl: '' });
    } catch (err: any) {
      toast.error("Failed to add partner: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePartner = async (partnerId: string) => {
    if (!window.confirm("Remove this partner from the homepage slideshow?")) return;
    setIsLoading(true);
    try {
      const updatedPartners = (globalBranding.globalPartners || []).filter(p => p.id !== partnerId);
      
      const { data: systemCo } = await supabase.from('companies').select('id').eq('slug', 'system').single();
      if (!systemCo) throw new Error("System company not found.");

      const { error } = await supabase
        .from('companies')
        .update({ branding: { ...globalBranding, globalPartners: updatedPartners } })
        .eq('id', systemCo.id);
      
      if (error) throw error;
      toast.success("Partner removed.");
      setGlobalBranding({ ...globalBranding, globalPartners: updatedPartners });
    } catch (err: any) {
      toast.error("Failed to remove partner: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCostingClick = (lead: any) => {
    setNavigationSource(activeTab);
    setSelectedLead(lead);
    navigateToTab('costing');
  };

  const handleInvoiceClick = async (quote: any) => {
    // Automatically confirm the quote if it's just 'quoted' or has no status
    // Also generate an invoice number if it doesn't have one in costing_report
    const needsUpdate = !quote.status || quote.status === 'quoted' || !quote.costing_report?.invoiceNumber;
    
    let currentQuote = quote;

    if (needsUpdate) {
      try {
        const newStatus = (!quote.status || quote.status === 'quoted') ? 'confirmed' : quote.status;
        const invoiceNumber = quote.costing_report?.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`;
        
        const updatedReport = {
          ...quote.costing_report,
          invoiceNumber
        };

        const { data, error } = await supabase.from('itineraries').update({ 
          status: newStatus,
          costing_report: updatedReport
        }).eq('id', quote.id).select().single();
        
        if (error) throw error;
        
        currentQuote = data;
        fetchQuotations();
        
        if (!quote.status || quote.status === 'quoted') {
          toast.success("Quote confirmed and invoice generated.");
        }
      } catch (err: any) {
        console.error("Failed to update quote for invoice:", err);
      }
    }
    setNavigationSource(activeTab);
    setSelectedLead(currentQuote);
    navigateToTab('invoice_editor');
  };

  const handleEditLodge = (lodge: Lodge) => {
    setSelectedLodge(lodge);
    navigateToTab('property_edit');
  };

  const handleNewLodge = () => {
    if (subStatus === 'starter' && usageStats.lodges.current >= usageStats.lodges.max) {
      toast.error("Cap reached: Upgrade to Unlimited to add more lodges.");
      navigateToTab('subscription');
      return;
    }
    setSelectedLodge(null);
    navigateToTab('property_edit');
  };

  const handleNewQuote = () => {
    if (subStatus === 'starter' && usageStats.itineraries.current >= usageStats.itineraries.max) {
      toast.error("Monthly cap reached: Upgrade to Unlimited for unlimited AI itineraries.");
      navigateToTab('subscription');
      return;
    }
    setQuoteSource(null);
    setNewQuoteData({
      clientName: '',
      clientEmail: '',
      tripTitle: '',
      startDate: new Date().toISOString().split('T')[0],
      durationDays: 7,
      adults: 2,
      youngAdults: 0,
      children: 0
    });
    setIsNewQuoteModalOpen(true);
  };

  const handleEditMaster = (safari: any) => {
    setSelectedMaster(safari);
    navigateToTab('safari_edit');
  };

  const handleNewMaster = () => {
    setSelectedMaster(null);
    navigateToTab('safari_edit');
  };

  const handleViewLodgeDetails = (lodge: Lodge) => {
    setSelectedLodge(lodge);
    navigateToTab('property_view');
  };

  const handleDeleteLodge = async (id: string) => {
    if (!confirm("Delete this property permanently?")) return;
    try {
      const { error } = await supabase.from('lodges').delete().eq('id', id);
      if (error) throw error;
      fetchLodges();
      toast.success("Property deleted successfully.");
    } catch (err: any) { 
      toast.error("Failed to delete property: " + err.message);
    }
  };

  const handleDeleteMaster = async (id: string) => {
    if (!confirm("Delete this Signature Safari permanently?")) return;
    try {
      const { error } = await supabase.from('master_itineraries').delete().eq('id', id);
      if (error) throw error;
      fetchMasterItineraries();
      toast.success("Signature Safari deleted successfully.");
    } catch (err: any) { 
      toast.error("Failed to delete safari: " + err.message);
    }
  };

  const handleShareMaster = async (id: string) => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?master=${id}`;
    await navigator.clipboard.writeText(shareUrl);
    setCopyingMasterId(id);
    toast.success("Public link copied!");
    setTimeout(() => setCopyingMasterId(null), 3000);
  };

  const handleViewMaster = (safari: any) => {
    setSelectedMaster(safari);
    setNavigationSource(activeTab);
    setViewingItinerary({
      itinerary: safari.itinerary_data,
      formData: {
        ...DUMMY_FORM_DATA,
        name: 'Guest',
        startDate: new Date().toISOString().split('T')[0]
      },
      id: safari.id,
      type: 'master'
    });
    navigateToTab('itinerary_view');
  };

  const handleViewLead = (lead: any) => {
    setSelectedLead(lead);
    setNavigationSource(activeTab);
    setViewingItinerary({
      itinerary: lead.itinerary_data,
      formData: lead.form_data,
      id: lead.id,
      type: 'lead'
    });
    navigateToTab('itinerary_view');
  };

  const handleSaveCosting = async (report: CostingReport, closeAfter = true) => {
    if (!selectedLead) return;
    setIsLoading(true);
    try {
      const updatedData = { costing_report: report, updated_at: new Date().toISOString() };
      const { error } = await supabase.from('itineraries').update(updatedData).eq('id', selectedLead.id);
      if (error) throw error;
      if (closeAfter) {
        toast.success("Quotation saved successfully.");
        goBack();
      } else { 
        fetchQuotations(); 
        toast.success("Quotation updated.");
      }
    } catch (err: any) { 
      toast.error("Failed to save quotation: " + err.message);
    } finally { setIsLoading(false); }
  };

  const handleInitQuote = (safari?: any) => {
    if (safari) {
      setQuoteSource(safari);
      setNewQuoteData({
        ...newQuoteData,
        tripTitle: safari.title || safari.itinerary_data?.tripTitle || '',
        durationDays: safari.itinerary_data?.days?.length || 7,
        clientName: '',
        clientEmail: '',
      });
    } else {
      setQuoteSource(null);
      setNewQuoteData({
        clientName: '',
        clientEmail: '',
        tripTitle: '',
        startDate: new Date().toISOString().split('T')[0],
        durationDays: 7,
        adults: 2,
        youngAdults: 0,
        children: 0
      });
    }
    setIsNewQuoteModalOpen(true);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      onClose();
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };

  const handleSaveCompany = async () => {
    if (!newCompanyData.name || !newCompanyData.slug) {
      toast.error("Name and Slug are required");
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.from('companies').insert([{
        ...newCompanyData,
        status: 'active'
      }]);
      if (error) throw error;
      toast.success("Company created successfully");
      setIsAddCompanyOpen(false);
      fetchGlobalData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveUser = async () => {
    if (!newUserData.email || !newUserData.full_name) {
      toast.error("Email and Name are required");
      return;
    }
    setIsLoading(true);
    try {
      // Create team member entry which acts as an invitation
      const { error } = await supabase.from('team_members').insert([{
        name: newUserData.full_name,
        email: newUserData.email,
        company_id: newUserData.company_id || null,
        role: newUserData.user_type === 'agency' ? 'Safari Consultant' : 'Associate'
      }]);
      if (error) throw error;
      toast.success('Invitation pending. Click the mail icon on their card in the Users list to send them an invite link!');
      setIsAddUserOpen(false);
      fetchGlobalData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getBackLabel = (source: AdminTab) => {
    switch (source) {
      case 'leads': return 'Back to Leads';
      case 'quotations': return 'Back to Quotations';
      case 'invoices': return 'Back to Invoices';
      case 'signature_safaris': return 'Back to Signature Safaris';
      default: return 'Back';
    }
  };

  const allBilledQuotes = quotations.filter(q => ['confirmed', 'partially_paid', 'paid'].includes(q.status || ''));

  return (
    <div className="h-screen flex bg-safari-50 text-safari-900 font-sans relative overflow-hidden">
      {/* Mobile Drawer Overlay */}
      {!isSidebarCollapsed && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" 
          onClick={() => setIsSidebarCollapsed(true)}
        />
      )}

      {/* Fixed Sidebar */}
      <aside className={`fixed top-0 left-0 bottom-0 bg-safari-900 text-white flex flex-col transition-all duration-500 z-[110] lg:z-40 ${isSidebarCollapsed ? '-translate-x-full lg:translate-x-0 w-20' : 'translate-x-0 w-[280px] lg:w-72 shadow-2xl'}`}>
        <div className="p-6 h-20 flex items-center justify-between">
          <div className={`flex items-center gap-3 overflow-hidden transition-opacity duration-300 ${isSidebarCollapsed && 'lg:opacity-0'}`}>
            <Compass className="text-safari-400 shrink-0" size={28} />
            <span className="font-extrabold tracking-tight text-xl truncate whitespace-nowrap">
              {company?.name || 'Partner Hub'}
            </span>
          </div>
          <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="p-2 hover:bg-safari-800 rounded-lg transition-colors">
            {isSidebarCollapsed ? <Menu size={24} /> : <ChevronLeft size={24} />}
          </button>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <NavItem icon={<Home size={22} />} label="Home" isActive={false} collapsed={isSidebarCollapsed} onClick={onClose} />
          <NavItem icon={<LayoutDashboard size={22} />} label="Dashboard" isActive={activeTab === 'dashboard'} collapsed={isSidebarCollapsed} onClick={() => navigateToTab('dashboard')} />
          <NavItem icon={<Building size={22} />} label="Properties" isActive={activeTab === 'properties' || activeTab === 'property_edit' || activeTab === 'property_view'} collapsed={isSidebarCollapsed} onClick={() => navigateToTab('properties')} />
          <NavItem icon={<Bookmark size={22} />} label="Signature Safaris" isActive={activeTab === 'signature_safaris' || activeTab === 'safari_edit'} collapsed={isSidebarCollapsed} onClick={() => navigateToTab('signature_safaris')} />
          <NavItem icon={<Users size={22} />} label="Team" isActive={activeTab === 'team'} collapsed={isSidebarCollapsed} onClick={() => navigateToTab('team')} />
          <NavItem icon={<MessageSquare size={22} />} label="Booking Leads" isActive={activeTab === 'leads'} collapsed={isSidebarCollapsed} onClick={() => navigateToTab('leads')} />
          
          {/* Financial Management Group */}
          <div className="space-y-1">
            <button 
              onClick={() => setIsFinancialsOpen(!isFinancialsOpen)}
              className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
                ['quotations', 'invoices', 'payments', 'receipts', 'payment_vouchers', 'disbursements'].includes(activeTab)
                ? 'bg-safari-800 text-white' 
                : 'text-safari-400 hover:bg-safari-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Calculator size={22} />
                {!isSidebarCollapsed && <span className="font-bold text-sm">Financials</span>}
              </div>
              {!isSidebarCollapsed && (
                isFinancialsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />
              )}
            </button>
            
            {(isFinancialsOpen || isSidebarCollapsed) && (
              <div className={`${!isSidebarCollapsed ? 'ml-4 pl-4 border-l border-safari-800' : ''} space-y-1 mt-1`}>
                <NavItem icon={<ReceiptText size={18} />} label="Quotations" isActive={activeTab === 'quotations'} collapsed={isSidebarCollapsed} onClick={() => navigateToTab('quotations')} />
                <NavItem icon={<FileText size={18} />} label="Invoices" isActive={activeTab === 'invoices' || activeTab === 'invoice_editor'} collapsed={isSidebarCollapsed} onClick={() => navigateToTab('invoices')} />
                <NavItem icon={<CreditCard size={18} />} label="Payments" isActive={activeTab === 'payments'} collapsed={isSidebarCollapsed} onClick={() => navigateToTab('payments')} />
                <NavItem icon={<FileCheck size={18} />} label="Receipts" isActive={activeTab === 'receipts'} collapsed={isSidebarCollapsed} onClick={() => navigateToTab('receipts')} />
                <NavItem icon={<FileText size={18} />} label="Payment Vouchers" isActive={activeTab === 'payment_vouchers'} collapsed={isSidebarCollapsed} onClick={() => navigateToTab('payment_vouchers')} />
                <NavItem icon={<Wallet size={18} />} label="Supplier Vouchers" isActive={activeTab === 'disbursements'} collapsed={isSidebarCollapsed} onClick={() => navigateToTab('disbursements')} />
              </div>
            )}
          </div>

          <NavItem icon={<Wand2 size={22} />} label="Quick Costing" isActive={activeTab === 'calculator'} collapsed={isSidebarCollapsed} onClick={() => navigateToTab('calculator')} />
          <NavItem icon={<Compass size={22} />} label="Quick Planner" isActive={activeTab === 'planner'} collapsed={isSidebarCollapsed} onClick={() => navigateToTab('planner')} />
          
          {profile?.is_super_user && (
            <div className="pt-4 mt-4 border-t border-safari-800">
              <p className="px-3 mb-2 text-[10px] font-black uppercase text-safari-500 tracking-widest">Admin Oversight</p>
              <NavItem 
                icon={<Database size={22} className="text-amber-400" />} 
                label="Super Hub" 
                isActive={activeTab === 'super_hub'} 
                collapsed={isSidebarCollapsed} 
                onClick={() => navigateToTab('super_hub')} 
              />
            </div>
          )}
        </nav>

        <div className={`px-7 py-6 border-t border-safari-800 flex items-center gap-6 ${isSidebarCollapsed ? 'flex-col' : 'justify-start'}`}>
          <Tooltip content="Company Public Profile">
            <button onClick={() => setIsProfileOpen(true)} className="text-safari-400 hover:text-white transition-colors">
              <Building2 size={20} />
            </button>
          </Tooltip>

          <Tooltip content="Configuration Settings">
            <button 
              onClick={() => navigateToTab('settings')} 
              className={`transition-colors ${activeTab === 'settings' ? 'text-white' : 'text-safari-400 hover:text-white'}`}
            >
              <SettingsIcon size={20} />
            </button>
          </Tooltip>
          
          <Tooltip content="Sign Out">
            <button onClick={handleLogout} className="text-red-400/80 hover:text-red-400 transition-colors">
              <LogOut size={20} />
            </button>
          </Tooltip>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarCollapsed ? 'ml-0 lg:ml-20' : 'ml-0 lg:ml-72'} h-screen bg-gray-50 relative`}>
        {/* Mobile Header Toggle - Fixed for all pages */}
        <div className="lg:hidden h-16 bg-white border-b border-safari-100 flex items-center justify-between px-4 fixed top-0 left-0 right-0 z-40">
          <div className="flex items-center gap-2">
            <Compass className="text-safari-600" size={24} />
            <span className="font-extrabold text-sm truncate max-w-[200px]">{company?.name || 'Partner Hub'}</span>
          </div>
          <button 
            onClick={() => setIsSidebarCollapsed(false)} 
            className="p-2 text-safari-600 border border-safari-100 rounded-lg shadow-sm"
          >
            <Menu size={24} />
          </button>
        </div>

        <main className="flex-1 lg:overflow-y-auto bg-gray-50 pt-16 lg:pt-0 pb-32 lg:pb-0 overflow-x-hidden overflow-y-auto">
          {isRestricted ? (
             <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center space-y-6 animate-fadeIn">
                <div className="p-8 bg-red-50 rounded-full border-4 border-white shadow-xl">
                  <Lock className="text-red-600" size={56} />
                </div>
                <div className="space-y-2">
                  <h1 className="text-4xl font-black text-safari-900 tracking-tight">Access Restricted</h1>
                  <p className="text-safari-500 max-w-md text-lg font-medium mx-auto">
                    Your 14-day trial period for <span className="text-safari-900 font-bold">{effectiveCompany?.name || 'your agency'}</span> has ended. Please upgrade your subscription to continue using administrative features.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <button 
                    onClick={() => navigateToTab('subscription')}
                    className="bg-safari-900 text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-safari-800 transition-all shadow-2xl shadow-safari-300 transform hover:-translate-y-1"
                  >
                    View Subscription Plans
                  </button>
                  <button 
                    onClick={() => navigateToTab('dashboard')}
                    className="text-safari-500 font-bold hover:text-safari-900 transition-colors px-6 py-4"
                  >
                    Go Back to Overview
                  </button>
                </div>
             </div>
          ) : (
            <div className="contents">
              {profile?.is_super_user && (
            <div className="sticky top-0 z-[100] px-4 py-3 bg-white/80 backdrop-blur-md border-b border-safari-100 shadow-sm animate-fadeIn">
              <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className="p-2 bg-purple-50 rounded-xl">
                    <Building2 className="text-purple-600" size={20} />
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                      <select 
                        className="appearance-none bg-safari-50 border border-safari-100 rounded-lg px-4 py-2 pr-10 font-bold text-xs text-safari-900 focus:ring-2 focus:ring-purple-200 transition-all cursor-pointer min-w-[240px]"
                        value={managedCompanyId || ''}
                        onChange={(e) => setManagedCompanyId(e.target.value || null)}
                      >
                        <option value="">Full Platform Overview</option>
                        {companies.map((c: any) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-safari-400">
                        <ChevronDown size={14} />
                      </div>
                    </div>
                    {managedCompanyId && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-[9px] font-black uppercase tracking-widest border border-green-100 animate-fadeIn">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        Viewing: {managedCompany?.name}
                        <button 
                          onClick={() => setManagedCompanyId(null)}
                          className="ml-1 hover:text-green-900 transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-safari-400 mr-2">Admin Tools:</span>
                  {activeTab === 'super_hub' ? (
                    <button 
                       onClick={() => navigateToTab('dashboard')}
                       className="px-4 py-2 bg-safari-100 text-safari-900 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-safari-200 transition-all flex items-center gap-1.5"
                    >
                      <ArrowLeft size={12} /> Back to Dashboard
                    </button>
                  ) : (
                    <button 
                       onClick={() => navigateToTab('super_hub')}
                       className="px-4 py-2 bg-safari-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-safari-800 transition-all flex items-center gap-1.5"
                    >
                      Super Hub <ShieldCheck size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

        {activeTab === 'dashboard' && (
          <div className="p-4 lg:p-8 space-y-8 animate-fadeIn max-w-[1600px] mx-auto">
            {isTrial && (
              <div className={`p-4 rounded-lg flex items-center justify-between border ${trialExpired ? 'bg-red-50 border-red-200 text-red-800' : 'bg-yellow-50 border-yellow-200 text-yellow-800'}`}>
                <div>
                   <h3 className="font-bold">{trialExpired ? 'Trial Period Expired' : 'Trial Period Active'}</h3>
                   <p className="text-sm">
                     {trialExpired 
                       ? 'Your 14-day trial has ended. Please upgrade to continue using all features.' 
                       : `You have ${daysRemaining} days left in your trial.`}
                   </p>
                </div>
                <button onClick={() => navigateToTab('subscription')} className={`${trialExpired ? 'bg-red-600' : 'bg-yellow-500'} text-white px-4 py-2 rounded-lg font-bold hover:opacity-90 transition-opacity`}>
                  {trialExpired ? 'Upgrade to Pro' : 'Upgrade Now'}
                </button>
              </div>
            )}

            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="text-4xl font-black text-safari-900 tracking-tight">
                  {(profile?.is_super_user && !managedCompanyId) ? 'Network at a Glance' : `${effectiveCompany?.name || 'Dashboard'}`}
                </h1>
                <p className="text-safari-500 font-bold text-lg mt-1">
                  {(profile?.is_super_user && !managedCompanyId) 
                    ? 'See what is happening across your entire safari network today.' 
                    : managedCompanyId 
                      ? `Managing ${managedCompany?.name}. Viewing records as an administrator.` 
                      : 'Here is an update on your projects and recent activity.'}
                </p>
              </div>
              <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl border border-safari-100 shadow-sm">
                <button 
                  onClick={fetchAllData}
                  className="p-2.5 bg-safari-50 text-safari-600 rounded-xl hover:bg-safari-100 transition-all group"
                >
                  <RefreshCw size={20} className="group-active:rotate-180 transition-transform duration-500" />
                </button>
                <div className="h-8 w-px bg-safari-100" />
                <div className="px-4">
                  <p className="text-[10px] font-black uppercase text-safari-400 tracking-widest">
                    Subscription Status
                  </p>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 ${subStatus === 'active' ? 'bg-green-500' : (isTrial && !trialExpired) ? 'bg-yellow-500' : 'bg-red-500'} rounded-full`} />
                    <span className="text-xs font-black uppercase tracking-tight text-safari-900">
                      {subStatus === 'trial' 
                        ? (trialExpired ? 'Trial (Expired)' : 'Trial Period') 
                        : (subStatus || 'Inactive')}
                    </span>
                  </div>
                </div>
              </div>
            </header>

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <SummaryCard 
                title={(profile?.is_super_user && !managedCompanyId) ? "Properties" : "Our Collection"} 
                value={String((profile?.is_super_user && !managedCompanyId) ? lodges.length : lodges.filter(l => l.company_id === effectiveCompanyId).length)} 
                subtitle="Lodges & Camps Ready"
                icon={<Building2 className="text-safari-600" />}
                trend="+2 new"
                positive={true}
              />
              <SummaryCard 
                title={(profile?.is_super_user && !managedCompanyId) ? "Future Travelers" : "New Inquiries"} 
                value={String(leads.length)} 
                subtitle={(profile?.is_super_user && !managedCompanyId) ? "Active Opportunities" : "People Reaching Out"} 
                icon={<Activity className="text-blue-600" />}
                trend="Growing"
                positive={true}
              />
              <SummaryCard 
                title="Total Sales" 
                value={`$${payments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}`} 
                subtitle="Payments Received" 
                icon={<TrendingUp className="text-green-600" />}
                trend="Verified"
                positive={true}
              />
              <SummaryCard 
                title="Booked Safaris" 
                value={String(quotations.length)} 
                subtitle="Confirmed Itineraries" 
                icon={<FileCheck className="text-purple-600" />}
                trend="Success Stories"
                positive={true}
              />
            </div>

            {/* Plan Usage Section (Only for Capped/Essential Plan) */}
            {subStatus === 'starter' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-safari-900 text-white rounded-3xl p-6 border border-safari-800 shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Infinity size={120} />
                </div>
                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8">
                  <div className="max-w-xs">
                    <div className="flex items-center gap-2 mb-2">
                      <Star size={16} className="text-yellow-400 fill-yellow-400" />
                      <h3 className="text-xl font-black tracking-tight">Essential Plan</h3>
                    </div>
                    <p className="text-safari-400 text-sm font-medium leading-relaxed">
                      You are using a capped plan. Upgrade to <span className="text-white font-bold">Unlimited</span> to remove all operational restrictions.
                    </p>
                    <button 
                      onClick={() => navigateToTab('subscription')}
                      className="mt-4 px-6 py-2 bg-yellow-400 text-safari-900 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-yellow-300 transition-all active:scale-95 shadow-lg shadow-yellow-400/20"
                    >
                      Remove All Caps
                    </button>
                  </div>

                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Lodges Usage */}
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-safari-300">Lodges & Camps</span>
                        <span className="text-xs font-bold">{usageStats.lodges.current} / {usageStats.lodges.max}</span>
                      </div>
                      <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                        <motion.div 
                          className={`h-full rounded-full ${usageStats.lodges.percent > 90 ? 'bg-red-500' : 'bg-safari-100'}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${usageStats.lodges.percent}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-safari-500 font-bold mt-2 italic italic-tracking-tight">
                        {usageStats.lodges.current >= usageStats.lodges.max ? 'Capacity reached.' : `${usageStats.lodges.max - usageStats.lodges.current} slots remaining.`}
                      </p>
                    </div>

                    {/* Itinerary Usage */}
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-safari-300">Monthly Itineraries</span>
                        <span className="text-xs font-bold">{usageStats.itineraries.current} / {usageStats.itineraries.max}</span>
                      </div>
                      <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                        <motion.div 
                          className={`h-full rounded-full ${usageStats.itineraries.percent > 90 ? 'bg-red-500' : 'bg-safari-100'}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${usageStats.itineraries.percent}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-safari-500 font-bold mt-2 italic italic-tracking-tight">
                        Resets on the 1st of each month.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* Analytics Section */}
              <div className="xl:col-span-2 space-y-8">
                {/* Revenue Chart */}
                <section className="bg-white rounded-3xl p-8 border border-safari-100 shadow-sm shadow-safari-900/5 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                    <BarChart3 size={120} className="text-safari-900" />
                  </div>
                  <div className="relative">
                    <div className="flex justify-between items-center mb-8">
                      <div>
                        <h3 className="text-xl font-black text-safari-900 leading-none">Earnings Over Time</h3>
                        <p className="text-sm font-bold text-safari-400 mt-1">A look at your recent payments (7d)</p>
                      </div>
                      <div className="px-4 py-2 bg-safari-50 rounded-xl border border-safari-100 flex items-center gap-2">
                         <div className="w-2 h-2 bg-safari-600 rounded-full" />
                         <span className="text-[10px] font-black uppercase tracking-widest text-safari-900">Total Revenue</span>
                      </div>
                    </div>
                    <div className="h-[300px] w-full mt-4">
                      <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                        <AreaChart data={Array.from({ length: 7 }, (_, i) => {
                          const date = new Date();
                          date.setDate(date.getDate() - (6 - i));
                          const dateStr = date.toISOString().split('T')[0];
                          const total = payments
                            .filter(p => p.date?.startsWith(dateStr))
                            .reduce((sum, p) => sum + p.amount, 0);
                          return {
                            name: date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
                            amt: total
                          };
                        })}>
                          <defs>
                            <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8f8664" stopOpacity={0.15}/>
                              <stop offset="95%" stopColor="#8f8664" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                          <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 700 }}
                            dy={10}
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 700 }}
                            tickFormatter={(val) => `$${val >= 1000 ? (val/1000).toFixed(1) + 'k' : val}`}
                          />
                          <RechartsTooltip 
                            contentStyle={{ 
                              backgroundColor: '#fff', 
                              borderRadius: '16px', 
                              border: '1px solid #e5e7eb',
                              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                              padding: '12px'
                            }}
                            itemStyle={{ color: '#8f8664', fontWeight: 900, fontSize: '14px' }}
                            labelStyle={{ color: '#6b7280', fontSize: '10px', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 700 }}
                            formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Processed']}
                          />
                          <Area type="monotone" dataKey="amt" stroke="#8f8664" strokeWidth={3} fillOpacity={1} fill="url(#colorAmt)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Budget Tiering */}
                  <section className="bg-white rounded-3xl p-8 border border-safari-100 shadow-sm shadow-safari-900/5">
                    <h3 className="text-lg font-black text-safari-900 mb-6">Market Distribution</h3>
                    <div className="h-[240px] w-full">
                      <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Economy', value: leads.filter(l => (l.formData?.budget || l.budget) === 'Economy').length + quotations.filter(l => (l.formData?.budget || l.budget) === 'Economy').length },
                              { name: 'Mid-Range', value: leads.filter(l => (l.formData?.budget || l.budget) === 'Mid-Range').length + quotations.filter(l => (l.formData?.budget || l.budget) === 'Mid-Range').length },
                              { name: 'Luxury', value: leads.filter(l => (l.formData?.budget || l.budget) === 'Luxury').length + quotations.filter(l => (l.formData?.budget || l.budget) === 'Luxury').length },
                            ].filter(d => d.value > 0)}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={8}
                            dataKey="value"
                            stroke="none"
                          >
                            <Cell fill="#cbd5e1" />
                            <Cell fill="#8f8664" />
                            <Cell fill="#413c31" />
                          </Pie>
                          <RechartsTooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-6 mt-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-slate-300" />
                        <span className="text-[10px] font-black uppercase text-safari-500">Economy</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-safari-600" />
                        <span className="text-[10px] font-black uppercase text-safari-500">Mid-Range</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-safari-900" />
                        <span className="text-[10px] font-black uppercase text-safari-500">Luxury</span>
                      </div>
                    </div>
                  </section>

                  {/* Destination Heatmap */}
                   <section className="bg-white rounded-3xl p-8 border border-safari-100 shadow-sm shadow-safari-900/5">
                    <h3 className="text-lg font-black text-safari-900 mb-6">Regional Focus</h3>
                    <div className="space-y-4">
                      {['Masai Mara', 'Serengeti', 'Amboseli', 'Bwindi'].map((dest, i) => {
                        const count = leads.filter(l => l.formData?.destinations?.includes(dest)).length;
                        const percentage = leads.length > 0 ? (count / leads.length) * 100 : Math.random() * 40 + 10;
                        return (
                          <div key={dest} className="space-y-1.5">
                            <div className="flex justify-between text-[11px] font-black uppercase tracking-tight">
                              <span className="text-safari-900">{dest}</span>
                              <span className="text-safari-500">{Math.round(percentage)}% Popularity</span>
                            </div>
                            <div className="w-full h-2 bg-safari-50 rounded-full overflow-hidden">
                              <div className="h-full bg-safari-600 rounded-full" style={{ width: `${percentage}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-[10px] font-bold text-safari-400 mt-8 leading-relaxed uppercase tracking-wider">
                      Insights gathered from traveler interests and AI-assisted trip planning.
                    </p>
                  </section>
                </div>
              </div>

              {/* Sidebar: Activity & Actions */}
              <div className="space-y-8">
                {/* Quick Actions */}
                <section className="bg-safari-900 rounded-3xl p-8 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-safari-800 rounded-bl-full -mr-16 -mt-16 opacity-50" />
                  <div className="relative">
                    <h3 className="text-xl font-black mb-6">What would you like to do?</h3>
                    <div className="grid grid-cols-1 gap-3">
                      <button 
                        onClick={handleNewQuote}
                        className="w-full py-4 bg-white text-safari-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-safari-100 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-xl shadow-safari-900/20"
                      >
                        <Wand2 size={18} /> Plan a New Trip
                      </button>
                      <button 
                         onClick={handleNewLodge}
                        className="w-full py-4 bg-safari-800 text-white border border-safari-700/50 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-safari-700 transition-all flex items-center justify-center gap-3 active:scale-95"
                      >
                        <Plus size={18} /> Add a Property
                      </button>
                      <button 
                        onClick={() => navigateToTab('leads')}
                        className="w-full py-4 bg-safari-800 text-white border border-safari-700/50 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-safari-700 transition-all flex items-center justify-center gap-3 active:scale-95"
                      >
                        <Users size={18} /> View New Inquiries
                      </button>
                    </div>
                  </div>
                </section>

                {/* Activity Feed */}
                <section className="bg-white rounded-3xl border border-safari-100 shadow-sm shadow-safari-900/5 flex flex-col h-[524px]">
                  <div className="p-8 border-b border-safari-50 shrink-0">
                    <div className="flex items-center justify-between">
                       <h3 className="text-lg font-black text-safari-900">Recent Happenings</h3>
                       <div className="w-8 h-8 rounded-full bg-safari-50 flex items-center justify-center text-safari-500">
                         <Clock size={16} />
                       </div>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {payments.length === 0 && leads.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-8">
                         <div className="w-12 h-12 bg-safari-50 rounded-2xl flex items-center justify-center text-safari-200 mb-4">
                           <Activity size={24} />
                         </div>
                         <p className="text-xs font-bold text-safari-300 uppercase tracking-widest">Scanning network for updates...</p>
                      </div>
                    ) : (
                      <>
                        {[...payments.slice(0, 5), ...leads.slice(0, 5)].sort((a,b) => new Date(b.created_at || b.date).getTime() - new Date(a.created_at || a.date).getTime()).map((activity: any, i) => {
                          const isPayment = !!activity.amount;
                          return (
                            <div key={i} className="group p-4 bg-white hover:bg-safari-50 rounded-2xl border border-safari-50 transition-all cursor-default">
                              <div className="flex gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${isPayment ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                                   {isPayment ? <CreditCard size={18} /> : <UserPlus size={18} />}
                                </div>
                                <div className="space-y-1">
                                  <p className="text-xs font-black text-safari-900 leading-tight">
                                    {isPayment ? `Payment from ${activity.customerName}` : `Lead: ${activity.formData?.name || activity.name || 'New Client'}`}
                                  </p>
                                  <p className="text-[10px] font-bold text-safari-400 capitalize">
                                    {isPayment ? `Ref: ${activity.reference}` : `Interested in ${activity.formData?.destinations?.join(', ') || 'Safari'}`}
                                  </p>
                                  <div className="flex items-center gap-2 pt-1">
                                    <span className="text-[9px] font-black uppercase text-safari-500 opacity-60">
                                      {new Date(activity.date || activity.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    {isPayment && (
                                       <span className="px-1.5 py-0.5 bg-green-50 text-green-700 text-[8px] font-black rounded uppercase">+${(activity.amount).toLocaleString()}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>
                  <div className="p-4 border-t border-safari-50 shrink-0">
                    <button className="w-full py-3 text-[10px] font-black uppercase tracking-widest text-safari-500 hover:text-safari-900 transition-colors">
                      View Full Audit Trail
                    </button>
                  </div>
                </section>
              </div>
            </div>
          </div>
        )}

        {isProfileOpen && company && (
          <CompanyProfile 
            companyId={company.id} 
            branding={branding} 
            onClose={() => setIsProfileOpen(false)} 
          />
        )}

        {activeTab === 'super_hub' && (
          <SuperHubView 
            companies={companies}
            allProfiles={allProfiles}
            allTeamMembers={allTeamMembers}
            lodges={lodges}
            leads={leads}
            masterItineraries={masterItineraries}
            onAssignLodge={async (lodgeId: string, companyId: string) => {
              try {
                const { error } = await supabase.from('lodges').update({ company_id: companyId }).eq('id', lodgeId);
                if (error) throw error;
                toast.success("Property reassigned successfully.");
                fetchLodges();
              } catch (err: any) { toast.error(err.message); }
            }}
            onEditLodge={(lodge: Lodge) => {
              setSelectedLodge(lodge);
              navigateToTab('property_edit');
            }}
            onDeleteCompany={async (id: string) => {
              console.log("AdminPanel: onDeleteCompany called for ID:", id);
              try {
                const { error } = await supabase.from('companies').delete().eq('id', id);
                if (error) throw error;
                toast.success("Company and all related data removed.");
                fetchGlobalData();
              } catch (err: any) { 
                console.error("Delete error:", err);
                toast.error(err.message || "Failed to delete company. Ensure all dependent records are removed first."); 
              }
            }}
            onUpdateCompanyStatus={async (id: string, status: string) => {
              try {
                const { error } = await supabase.from('companies').update({ status }).eq('id', id);
                if (error) throw error;
                toast.success(`Company status updated to ${status}.`);
                fetchGlobalData();
              } catch (err: any) { toast.error(err.message); }
            }}
            onUpdateCompanyScore={async (id: string, proficiencyScore: number) => {
              try {
                const { error } = await supabase.from('companies').update({ proficiency_score: proficiencyScore }).eq('id', id);
                if (error) throw error;
                toast.success(`Proficiency score updated.`);
                fetchGlobalData();
              } catch (err: any) { toast.error(err.message); }
            }}
            onDeleteUser={async (id: string) => {
              if (!confirm("Reconfirm: Delete this user profile?")) return;
              try {
                const { error } = await supabase.from('profiles').delete().eq('id', id);
                if (error) throw error;
                toast.success("User profile removed from database.");
                fetchGlobalData();
              } catch (err: any) { toast.error(err.message); }
            }}
            onDeleteProperty={handleDeleteLodge}
            onDeleteSafari={handleDeleteMaster}
            onDeleteLead={async (id: string) => {
              if (!confirm("Delete this lead permanentley?")) return;
              try {
                const { error } = await supabase.from('itineraries').delete().eq('id', id);
                if (error) throw error;
                toast.success("Lead removed.");
                fetchLeads();
                fetchQuotations();
              } catch (err: any) { toast.error(err.message); }
            }}
            onAddCompany={() => {
              setNewCompanyData({ name: '', slug: '', branding: DEFAULT_BRANDING });
              setIsAddCompanyOpen(true);
            }}
            onAddUser={() => {
              setNewUserData({ full_name: '', email: '', company_id: '', user_type: 'agency' });
              setIsAddUserOpen(true);
            }}
            onAddProperty={() => {
              setSelectedLodge(null);
              navigateToTab('property_edit');
            }}
            globalBranding={globalBranding}
            onAddPartner={() => setIsAddPartnerOpen(true)}
            onDeletePartner={handleDeletePartner}
          />
        )}

        {activeTab === 'properties' && (
          <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
            <header className="flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-black text-safari-900 tracking-tight">
                  {managedCompanyId ? `${managedCompany?.name} Properties` : 'Property Ecosystem'}
                </h1>
                <p className="text-safari-500 font-bold">
                  {managedCompanyId ? `Inventory and rates for ${managedCompany?.name}.` : 'Manage your owned inventory and set custom rates for partner properties.'}
                </p>
              </div>
              <Tooltip content="Add a new lodge or camp to your owned inventory">
                <button onClick={handleNewLodge} className="bg-safari-800 text-white px-8 py-3 rounded-lg font-bold uppercase text-xs tracking-widest hover:bg-safari-900 transition-all shadow-xl flex items-center gap-2"><Plus size={18} /> New Property</button>
              </Tooltip>
            </header>
            <div className="bg-white rounded-xl shadow-sm border border-safari-100 overflow-hidden">
               {isLodgesLoading ? <LoadingView /> : lodges.length === 0 ? <EmptyState icon={<Building size={48} />} title="No properties" message="Add your first lodge." action={handleNewLodge} actionLabel="Add Property" /> : (
                 <div className="overflow-x-auto">
                   <table className="w-full text-left">
                     <thead className="bg-safari-50 border-b border-safari-100">
                       <tr>
                         <th className="px-6 py-4 text-[10px] font-bold uppercase text-safari-400">Property</th>
                         <th className="px-6 py-4 text-[10px] font-bold uppercase text-safari-400">Ownership</th>
                         <th className="px-6 py-4 text-[10px] font-bold uppercase text-safari-400 border-l border-safari-100">Location</th>
                         <th className="px-6 py-4 text-[10px] font-bold uppercase text-safari-400 text-right">Actions</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-safari-50">
                       {lodges.map(lodge => {
                         const isOwner = lodge.company_id === effectiveCompanyId;
                         const hasCustomRate = customRates.some(r => r.lodge_id === lodge.id);
                         
                         return (
                           <tr key={lodge.id} className="hover:bg-safari-50/30 group">
                             <td className="px-6 py-4">
                               <p className="font-bold text-safari-900">{lodge.name}</p>
                               <span className="text-[10px] font-bold uppercase text-safari-400">{lodge.tier?.split('(')[0]}</span>
                             </td>
                             <td className="px-6 py-4">
                               {isOwner ? (
                                 <span className="px-2 py-1 bg-safari-800 text-white text-[9px] font-black uppercase rounded-md tracking-widest">Mine</span>
                               ) : (
                                 <div className="flex flex-col gap-1">
                                   <span className="px-2 py-1 bg-safari-100 text-safari-600 text-[9px] font-black uppercase rounded-md tracking-widest w-fit">Partner</span>
                                   {hasCustomRate && (
                                     <span className="text-[9px] font-black text-green-600 uppercase flex items-center gap-1">
                                       <Check size={8} /> Custom Prices Set
                                     </span>
                                   )}
                                 </div>
                               )}
                             </td>
                             <td className="px-6 py-4 text-sm font-bold text-safari-600 border-l border-safari-50">
                               <MapPin size={14} className="inline mr-1 text-safari-300" /> {lodge.location}
                             </td>
                             <td className="px-6 py-4 text-right">
                               <div className="flex justify-end gap-2">
                                 <Tooltip content="View Details">
                                   <button onClick={() => handleViewLodgeDetails(lodge)} className="p-2 bg-safari-50 text-safari-600 rounded-lg hover:bg-safari-100">
                                     <Eye size={18} />
                                   </button>
                                 </Tooltip>
                                 <Tooltip content={isOwner ? "Edit Property & Base Rates" : "Set Custom Pricing"}>
                                   <button onClick={() => handleEditLodge(lodge)} className={`p-2 rounded-lg transition-all ${isOwner ? 'bg-safari-50 text-safari-600 hover:bg-safari-100' : 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-200'}`}>
                                     {isOwner ? <Edit3 size={18} /> : <div className="flex items-center gap-1 px-1"><Calculator size={16} /><span className="text-[10px] font-black uppercase">Rates</span></div>}
                                   </button>
                                 </Tooltip>
                                 {isOwner && (
                                   <Tooltip content="Delete Property">
                                     <button onClick={() => handleDeleteLodge(lodge.id)} className="p-2 bg-safari-50 text-red-400 rounded-lg hover:bg-red-50 hover:text-red-600">
                                       <Trash2 size={18} />
                                     </button>
                                   </Tooltip>
                                 )}
                               </div>
                             </td>
                           </tr>
                         );
                       })}
                     </tbody>
                   </table>
                 </div>
               )}
            </div>
          </div>
        )}

        {activeTab === 'signature_safaris' && (
          <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
            <header className="flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-black text-safari-900 tracking-tight">
                  {managedCompanyId ? `${managedCompany?.name} Signature Collection` : 'Signature Safaris'}
                </h1>
                <p className="text-safari-500 font-bold">
                  {managedCompanyId ? `Master itineraries for ${managedCompany?.name}.` : 'Hand-crafted master itineraries.'}
                </p>
              </div>
              <Tooltip content="Create a new master itinerary for your signature collection">
                <button onClick={handleNewMaster} className="bg-safari-800 text-white px-8 py-3 rounded-lg font-bold uppercase text-xs tracking-widest hover:bg-safari-900 transition-all shadow-xl flex items-center gap-2"><Plus size={18} /> Create Safari</button>
              </Tooltip>
            </header>
            <div className="bg-white rounded-xl shadow-sm border border-safari-100 overflow-hidden">
               {isMasterLoading ? <LoadingView /> : masterItineraries.length === 0 ? <EmptyState icon={<Bookmark size={48} />} title="No master itineraries" message="Create your first hand-crafted safari." action={handleNewMaster} actionLabel="Create Safari" /> : (
                 <div className="overflow-x-auto"><table className="w-full text-left"><thead className="bg-safari-50 border-b border-safari-100"><tr><th className="px-6 py-4 text-[10px] font-bold uppercase text-safari-400">Safari Title</th><th className="px-6 py-4 text-[10px] font-bold uppercase text-safari-400 text-right">Actions</th></tr></thead><tbody className="divide-y divide-safari-50">{masterItineraries.map(safari => (<tr key={safari.id} className="hover:bg-safari-50/30 group"><td className="px-6 py-4"><p className="font-bold text-safari-900">{safari.trip_title}</p></td><td className="px-6 py-4 text-right"><div className="flex justify-end gap-1.5">
                    <Tooltip content="Copy Public Link">
                      <button onClick={() => handleShareMaster(safari.id)} className="p-1.5 bg-safari-50 text-safari-600 rounded-lg hover:bg-safari-100">
                        {copyingMasterId === safari.id ? <Check size={16} className="text-green-600" /> : <Share2 size={16} />}
                      </button>
                    </Tooltip>
                    <Tooltip content="View Public Page">
                      <button onClick={() => handleViewMaster(safari)} className="p-1.5 bg-safari-50 text-safari-600 rounded-lg hover:bg-safari-100">
                        <Eye size={16} />
                      </button>
                    </Tooltip>
                    <Tooltip content="Create Quote">
                      <button onClick={() => handleInitQuote(safari)} className="p-1.5 bg-safari-50 text-safari-600 rounded-lg hover:bg-safari-100">
                        <Calculator size={16} />
                      </button>
                    </Tooltip>
                    <Tooltip content="Edit Master">
                      <button onClick={() => handleEditMaster(safari)} className="p-1.5 bg-safari-50 text-safari-600 rounded-lg hover:bg-safari-100">
                        <Edit3 size={16} />
                      </button>
                    </Tooltip>
                    <Tooltip content="Delete">
                      <button onClick={() => handleDeleteMaster(safari.id)} className="p-1.5 bg-safari-50 text-red-400 rounded-lg hover:bg-red-50 hover:text-red-600">
                        <Trash2 size={16} />
                      </button>
                    </Tooltip>
                  </div></td></tr>))}</tbody></table></div>
               )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="p-8 max-w-5xl mx-auto space-y-8 animate-fadeIn">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-safari-900 tracking-tight">App Configuration</h1>
                <p className="text-safari-500 font-medium">Control brand identity, business rules, and system settings.</p>
              </div>
            </header>

            <div className="flex items-center gap-1 p-1 bg-safari-50 rounded-xl border border-safari-100 overflow-x-auto no-scrollbar w-full shadow-inner">
              {[
                profile?.is_super_user && { id: 'system', label: 'System', icon: <ShieldCheck size={14} /> },
                profile?.is_super_user && { id: 'landing', label: 'Landing Page', icon: <LayoutDashboard size={14} /> },
                profile?.is_super_user && { id: 'data', label: 'Global System Log', icon: <Database size={14} /> },
                { id: 'visuals', label: 'Agency Branding', icon: <Palette size={14} /> },
                { id: 'business', label: 'Agency & Finance', icon: <Building size={14} /> },
                { id: 'payments', label: 'Payment Integrations', icon: <CreditCard size={14} /> },
              ].filter(Boolean).map((tab: any) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSettingsTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                    activeSettingsTab === tab.id 
                      ? 'bg-white text-safari-900 shadow-sm ring-1 ring-safari-200' 
                      : 'text-safari-400 hover:text-safari-600 hover:bg-white/50'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {activeSettingsTab === 'system' && profile?.is_super_user && (
              <div className="space-y-6 animate-fadeIn">
                <section className="bg-white rounded-xl shadow-sm border border-safari-100 p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-lg font-bold text-safari-900 flex items-center gap-2 italic">
                        <ShieldCheck className="text-safari-500" size={20} />
                        Global System Identity
                      </h3>
                      <p className="text-sm text-safari-500 font-medium">Primary platform markers used across the entire ecosystem.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
    <div className="space-y-2">
       <label className="block text-[10px] font-black uppercase text-safari-500 tracking-widest ml-1">Application Name</label>
       <input 
         type="text" 
         className="w-full p-4 bg-safari-50 border border-safari-100 rounded-lg font-bold text-lg text-safari-900 outline-none focus:ring-2 focus:ring-safari-500/20 shadow-sm" 
         value={branding.appName || ''} 
         onChange={(e) => setBranding({...branding, appName: e.target.value})}
         placeholder="SafariPlanner.ai"
       />
    </div>
    <div className="space-y-2">
       <label className="block text-[10px] font-black uppercase text-safari-500 tracking-widest ml-1">Brand Tagline</label>
       <input 
         type="text" 
         className="w-full p-4 bg-safari-50 border border-safari-100 rounded-lg font-bold text-lg text-safari-900 outline-none focus:ring-2 focus:ring-safari-500/20 shadow-sm" 
         value={branding.appTagline || ''} 
         onChange={(e) => setBranding({...branding, appTagline: e.target.value})}
         placeholder="Curation Meets Intelligence"
       />
    </div>
                  </div>
                </section>
              </div>
            )}

            {activeSettingsTab === 'visuals' && (
              <div className="space-y-6 animate-fadeIn">
                <section className="bg-white rounded-xl shadow-sm border border-safari-100 p-8">
                  <h3 className="text-lg font-bold text-safari-900 mb-8 flex items-center gap-2 italic">
                    <Palette className="text-safari-500" size={20} />
                    Brand Color System
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
                    <div className="space-y-4">
                       <label className="block text-[10px] font-black uppercase text-safari-500 tracking-widest ml-1">Primary Brand Color</label>
                       <div className="flex gap-4 p-4 bg-safari-50 rounded-lg border border-safari-100 items-center">
                         <input 
                           type="color" 
                           className="w-16 h-16 rounded-lg cursor-pointer border-none p-0 outline-none shadow-sm hover:scale-105 transition-transform" 
                           value={branding?.primaryColor || ''} 
                           onChange={(e) => setBranding({...branding, primaryColor: e.target.value})}
                         />
                         <div className="flex-1">
                            <input 
                              type="text" 
                              className="w-full bg-transparent font-mono text-sm font-bold text-safari-900 outline-none" 
                              value={branding?.primaryColor || ''} 
                              onChange={(e) => setBranding({...branding, primaryColor: e.target.value})}
                            />
                         </div>
                       </div>
                    </div>
                    <div className="space-y-4">
                       <label className="block text-[10px] font-black uppercase text-safari-500 tracking-widest ml-1">Secondary Accent</label>
                       <div className="flex gap-4 p-4 bg-safari-50 rounded-lg border border-safari-100 items-center">
                         <input 
                           type="color" 
                           className="w-16 h-16 rounded-lg cursor-pointer border-none p-0 outline-none shadow-sm hover:scale-105 transition-transform" 
                           value={branding?.secondaryColor || ''} 
                           onChange={(e) => setBranding({...branding, secondaryColor: e.target.value})}
                         />
                         <div className="flex-1">
                            <input 
                              type="text" 
                              className="w-full bg-transparent font-mono text-sm font-bold text-safari-900 outline-none" 
                              value={branding?.secondaryColor || ''} 
                              onChange={(e) => setBranding({...branding, secondaryColor: e.target.value})}
                            />
                         </div>
                       </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <label className="block text-[10px] font-black uppercase text-safari-500 tracking-widest ml-1">Curated Color Palettes</label>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                      {PRESET_PALETTES.map((palette) => (
                        <button 
                          key={palette.name}
                          onClick={() => setBranding({
                            ...branding, 
                            primaryColor: palette.primary, 
                            secondaryColor: palette.secondary 
                          })}
                          className={`p-5 rounded-lg border transition-all text-left flex flex-col gap-4 group relative overflow-hidden ${
                            branding.primaryColor === palette.primary 
                              ? 'bg-white border-safari-400 shadow-xl ring-2 ring-safari-500/10' 
                              : 'bg-safari-50 border-safari-100 hover:border-safari-200'
                          }`}
                        >
                          <div className="flex gap-2">
                            <div className="w-10 h-10 rounded-full shadow-inner border-2 border-white" style={{ backgroundColor: palette.primary }} />
                            <div className="w-10 h-10 rounded-full shadow-inner border-2 border-white -ml-4" style={{ backgroundColor: palette.secondary }} />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-safari-900 uppercase tracking-widest">{palette.name}</p>
                            <p className="text-[10px] text-safari-400 font-medium mt-1 line-clamp-2">{palette.description}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </section>

                <section className="bg-white rounded-xl shadow-sm border border-safari-100 p-8">
                  <h3 className="text-lg font-bold text-safari-900 mb-8 flex items-center gap-2 italic">
                    <Type className="text-safari-500" size={20} />
                    Typography Scale
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {['title', 'body', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map((level) => (
                      <div key={level} className="p-5 bg-safari-50 rounded-lg border border-safari-100 space-y-4 shadow-inner">
                        <p className="text-[10px] font-black uppercase text-safari-600 tracking-wider flex items-center gap-2">
                           {level === 'title' ? 'GLOBAL TITLE' : level === 'body' ? 'PARAGRAPH' : `${level.toUpperCase()} SCALE`}
                        </p>
                        <div className="space-y-3">
                          <select 
                            className="w-full p-3 bg-white border border-safari-100 rounded-lg font-bold text-xs outline-none focus:ring-2 focus:ring-safari-500/20 shadow-sm"
                            value={(branding as any)[`${level}Font`] || ''}
                            onChange={(e) => setBranding({...branding, [`${level}Font`]: e.target.value})}
                          >
                            {FONT_OPTIONS.map(font => (
                              <option key={font.name} value={font.name}>{font.name}</option>
                            ))}
                          </select>
                          <div className="grid grid-cols-2 gap-2">
                            <input 
                              type="text" 
                              className="w-full p-3 bg-white border border-safari-100 rounded-lg font-bold text-xs text-center shadow-sm"
                              value={(branding as any)[`${level}FontSize`] || ''}
                              onChange={(e) => setBranding({...branding, [`${level}FontSize`]: e.target.value})}
                              placeholder="Size"
                            />
                            <select 
                              className="w-full p-3 bg-white border border-safari-100 rounded-lg font-bold text-xs shadow-sm"
                              value={(branding as any)[`${level}FontWeight`] || ''}
                              onChange={(e) => setBranding({...branding, [`${level}FontWeight`]: e.target.value})}
                            >
                              <option value="300">Light</option>
                              <option value="400">Regular</option>
                              <option value="500">Medium</option>
                              <option value="600">Semi-Bold</option>
                              <option value="700">Bold</option>
                              <option value="900">Black</option>
                            </select>
                          </div>
                          {level === 'body' && (
                            <input 
                              type="text" 
                              className="w-full p-3 bg-white border border-safari-100 rounded-lg font-bold text-xs text-center shadow-sm"
                              value={branding.bodyLineHeight || ''}
                              onChange={(e) => setBranding({...branding, bodyLineHeight: e.target.value})}
                              placeholder="Line Height (e.g. 1.6)"
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            )}

            {activeSettingsTab === 'landing' && profile?.is_super_user && (
              <div className="space-y-6 animate-fadeIn">
                <section className="bg-white rounded-xl shadow-sm border border-safari-100 p-8">
                  <h3 className="text-lg font-bold text-safari-900 mb-8 flex items-center gap-2 italic">
                    <ImageIcon className="text-safari-500" size={20} />
                    Hero Experience
                  </h3>
                  <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="block text-[10px] font-black uppercase text-safari-500 tracking-widest ml-1">Hero Title</label>
                       <input 
                         type="text" 
                         className="w-full p-4 bg-safari-50 border border-safari-100 rounded-lg font-bold text-lg text-safari-900 outline-none focus:ring-2 focus:ring-safari-500/20" 
                         value={globalBranding.heroTitle || ''} 
                         onChange={(e) => setGlobalBranding({...globalBranding, heroTitle: e.target.value})}
                         placeholder="The Art of the Safari, Decoded."
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="block text-[10px] font-black uppercase text-safari-500 tracking-widest ml-1">Description</label>
                       <textarea 
                         className="w-full p-4 bg-safari-50 border border-safari-100 rounded-lg font-medium text-safari-800 outline-none focus:ring-2 focus:ring-safari-500/20 h-32 resize-none" 
                         value={globalBranding.heroDescription || ''} 
                         onChange={(e) => setGlobalBranding({...globalBranding, heroDescription: e.target.value})}
                         placeholder="Engage your visitors with a powerful brand story..."
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="block text-[10px] font-black uppercase text-safari-500 tracking-widest ml-1">Main Landing Banner</label>
                       <div className="flex gap-4 p-2 bg-safari-50 rounded-lg border border-safari-100 items-center">
                         <label className="w-16 h-16 rounded-lg overflow-hidden bg-white border border-safari-100 shadow-sm flex-shrink-0 cursor-pointer block relative group">
                           {globalBranding.heroImage && <img src={globalBranding.heroImage} alt="Hero" className="w-full h-full object-cover" referrerPolicy="no-referrer" />}
                           {!globalBranding.heroImage && <div className="w-full h-full flex items-center justify-center text-safari-300"><Upload size={20} /></div>}
                           <input 
                             type="file" 
                             className="hidden" 
                             accept="image/*"
                             onChange={handleHeroImageUpload}
                           />
                         </label>
                         <div className="flex-1 space-y-1">
                            <label className="flex items-center gap-2 text-safari-900 font-bold text-xs cursor-pointer hover:text-safari-600 transition-colors">
                               <Upload size={14} /> Upload New Image
                               <input 
                                 type="file" 
                                 className="hidden" 
                                 accept="image/*"
                                 onChange={handleHeroImageUpload}
                               />
                            </label>
                            <p className="text-[10px] text-safari-400">Recommended size: 1920x1080px</p>
                         </div>
                         {globalBranding.heroImage && (
                           <button 
                             onClick={() => setGlobalBranding({ ...globalBranding, heroImage: '' })}
                             className="text-red-400 hover:text-red-600 p-2"
                           >
                             <Trash2 size={16} />
                           </button>
                         )}
                       </div>
                    </div>
                  </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <section className="bg-white rounded-xl shadow-sm border border-safari-100 p-8 space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-bold text-safari-900 flex items-center gap-2 italic">
                        <HelpCircle className="text-safari-500" size={20} />
                        FAQ Management
                      </h3>
                      <button 
                        onClick={() => setGlobalBranding({...globalBranding, faqs: [...(globalBranding.faqs || []), { q: '', a: '' }]})}
                        className="p-2 bg-safari-900 text-white rounded-lg hover:bg-black transition-all shadow-md"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 no-scrollbar">
                      {(globalBranding.faqs || []).map((faq, idx) => (
                        <div key={idx} className="p-6 bg-safari-50 rounded-xl border border-safari-100 space-y-4 relative group animate-fadeIn">
                          <button 
                            onClick={() => {
                              const newFaqs = [...(globalBranding.faqs || [])];
                              newFaqs.splice(idx, 1);
                              setGlobalBranding({...globalBranding, faqs: newFaqs});
                            }}
                            className="absolute top-4 right-4 text-red-400 opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                          >
                            <Trash2 size={16} />
                          </button>
                          <input 
                            className="w-full bg-white p-3 rounded-lg border border-safari-100 font-bold text-sm outline-none shadow-sm"
                            value={faq.q}
                            onChange={(e) => {
                              const newFaqs = [...(globalBranding.faqs || [])];
                              newFaqs[idx] = { ...newFaqs[idx], q: e.target.value };
                              setGlobalBranding({...globalBranding, faqs: newFaqs});
                            }}
                            placeholder="Question"
                          />
                          <textarea 
                            className="w-full bg-white p-3 rounded-lg border border-safari-100 font-medium text-xs outline-none shadow-sm h-24 resize-none"
                            value={faq.a}
                            onChange={(e) => {
                              const newFaqs = [...(globalBranding.faqs || [])];
                              newFaqs[idx] = { ...newFaqs[idx], a: e.target.value };
                              setGlobalBranding({...globalBranding, faqs: newFaqs});
                            }}
                            placeholder="Answer"
                          />
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="bg-white rounded-xl shadow-sm border border-safari-100 p-8 space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-bold text-safari-900 flex items-center gap-2 italic">
                        <Quote className="text-safari-500" size={20} />
                        Social Proof
                      </h3>
                      <button 
                        onClick={() => setGlobalBranding({...globalBranding, testimonials: [...(globalBranding.testimonials || []), { name: '', role: '', text: '', stars: 5 }]})}
                        className="p-2 bg-safari-900 text-white rounded-lg hover:bg-black transition-all shadow-md"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 no-scrollbar">
                      {(globalBranding.testimonials || []).map((t, idx) => (
                        <div key={idx} className="p-6 bg-safari-50 rounded-xl border border-safari-100 space-y-4 relative group animate-fadeIn">
                          <button 
                            onClick={() => {
                              const newT = [...(globalBranding.testimonials || [])];
                              newT.splice(idx, 1);
                              setGlobalBranding({...globalBranding, testimonials: newT});
                            }}
                            className="absolute top-4 right-4 text-red-400 opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                          >
                            <Trash2 size={16} />
                          </button>
                          <div className="grid grid-cols-2 gap-4">
                            <input 
                              className="w-full bg-white p-3 rounded-lg border border-safari-100 font-bold text-sm outline-none shadow-sm"
                              value={t.name}
                              onChange={(e) => {
                                const newT = [...(globalBranding.testimonials || [])];
                                newT[idx] = { ...newT[idx], name: e.target.value };
                                setGlobalBranding({...globalBranding, testimonials: newT});
                              }}
                              placeholder="Client Name"
                            />
                            <input 
                              className="w-full bg-white p-3 rounded-lg border border-safari-100 font-bold text-sm outline-none shadow-sm"
                              value={t.role}
                              onChange={(e) => {
                                const newT = [...(globalBranding.testimonials || [])];
                                newT[idx] = { ...newT[idx], role: e.target.value };
                                setGlobalBranding({...globalBranding, testimonials: newT});
                              }}
                              placeholder="Client Role"
                            />
                          </div>
                          <textarea 
                            className="w-full bg-white p-3 rounded-lg border border-safari-100 font-medium text-xs outline-none shadow-sm h-24 resize-none italic"
                            value={t.text}
                            onChange={(e) => {
                              const newT = [...(globalBranding.testimonials || [])];
                              newT[idx] = { ...newT[idx], text: e.target.value };
                              setGlobalBranding({...globalBranding, testimonials: newT});
                            }}
                            placeholder="Testimonial text..."
                          />
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </div>
            )}

            {activeSettingsTab === 'business' && (
              <div className="space-y-6 animate-fadeIn">
                <section className="bg-white rounded-xl shadow-sm border border-safari-100 p-8">
                  <h3 className="text-lg font-bold text-safari-900 mb-8 flex items-center gap-2 italic">
                    <Building className="text-safari-500" size={20} />
                    Agency & Finance Configuration
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                    <div className="space-y-4">
                       <label className="block text-[10px] font-black uppercase text-safari-500 tracking-widest ml-1">Agency Brand Logo</label>
                       <div className="flex items-center gap-4">
                         <div className="w-20 h-20 bg-safari-50 rounded-xl border border-safari-100 flex items-center justify-center overflow-hidden shadow-inner">
                           {branding.agencyLogo ? (
                             <img src={branding.agencyLogo} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                           ) : (
                             <Building2 className="text-safari-200" size={32} />
                           )}
                         </div>
                         <div className="flex flex-col gap-2">
                           <label className="px-4 py-2 bg-safari-900 text-white rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-safari-800 transition-all cursor-pointer shadow-md">
                             <Upload size={14} className="inline mr-2" /> Upload Logo
                             <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                           </label>
                           {branding.agencyLogo && (
                             <button 
                               onClick={() => setBranding({ ...branding, agencyLogo: '' })}
                               className="text-[10px] font-black uppercase text-red-500 hover:text-red-700 transition-colors text-left ml-2"
                             >
                               Remove
                             </button>
                           )}
                         </div>
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="block text-[10px] font-black uppercase text-safari-500 tracking-widest ml-1">Legal Agency/Property Name</label>
                       <input 
                         type="text" 
                         className="w-full p-4 bg-safari-50 border border-safari-100 rounded-lg font-bold text-safari-900 outline-none focus:ring-2 focus:ring-safari-500/20 shadow-sm" 
                         value={branding.agencyName || branding.appName || ''} 
                         onChange={(e) => setBranding({...branding, agencyName: e.target.value})}
                         placeholder="Legal Entity Name"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="block text-[10px] font-black uppercase text-safari-500 tracking-widest ml-1">WhatsApp Integration (Intl. Format)</label>
                       <div className="flex gap-3">
                         <div className="flex items-center justify-center w-12 h-12 bg-white rounded-lg border border-safari-100 text-safari-600 shadow-sm">
                           <Phone size={18} />
                         </div>
                         <input 
                           type="text" 
                           className="flex-1 p-3 bg-safari-50 border border-safari-100 rounded-lg font-bold text-lg text-safari-900 outline-none focus:ring-2 focus:ring-safari-500/20 shadow-sm transition-all" 
                           value={branding.whatsappNumber || ''} 
                           onChange={(e) => setBranding({...branding, whatsappNumber: e.target.value})}
                           placeholder="+254700000000"
                         />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="block text-[10px] font-black uppercase text-safari-500 tracking-widest ml-1">Support Email</label>
                       <input 
                         type="email" 
                         className="w-full p-4 bg-safari-50 border border-safari-100 rounded-lg font-bold text-safari-900 outline-none focus:ring-2 focus:ring-safari-500/20 shadow-sm" 
                         value={branding.contactEmail || ''} 
                         onChange={(e) => setBranding({...branding, contactEmail: e.target.value})}
                         placeholder="support@agency.com"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="block text-[10px] font-black uppercase text-safari-500 tracking-widest ml-1">Finance Email (Billing CC)</label>
                       <input 
                         type="email" 
                         className="w-full p-4 bg-safari-50 border border-safari-100 rounded-lg font-bold text-safari-900 outline-none focus:ring-2 focus:ring-safari-500/20 shadow-sm" 
                         value={branding.financeEmail || ''} 
                         onChange={(e) => setBranding({...branding, financeEmail: e.target.value})}
                         placeholder="finance@agency.com"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="block text-[10px] font-black uppercase text-safari-500 tracking-widest ml-1">Office Contact Phone</label>
                       <input 
                         type="text" 
                         className="w-full p-4 bg-safari-50 border border-safari-100 rounded-lg font-bold text-safari-900 outline-none focus:ring-2 focus:ring-safari-500/20 shadow-sm" 
                         value={branding.contactPhone || ''} 
                         onChange={(e) => setBranding({...branding, contactPhone: e.target.value})}
                         placeholder="Local or International format"
                       />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                    <div className="space-y-2">
                       <label className="block text-[10px] font-black uppercase text-safari-500 tracking-widest ml-1">Physical Office Address</label>
                       <textarea 
                         className="w-full p-4 bg-safari-50 border border-safari-100 rounded-lg font-medium text-safari-800 outline-none focus:ring-2 focus:ring-safari-500/20 h-32 resize-none shadow-sm" 
                         value={branding.contactAddress || ''} 
                         onChange={(e) => setBranding({...branding, contactAddress: e.target.value})}
                         placeholder="Full office location details..."
                       />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-[10px] font-black uppercase text-safari-500 tracking-widest ml-1">Agency Biography / Description</label>
                        <textarea 
                          className="w-full p-4 bg-safari-50 border border-safari-100 rounded-lg font-medium text-safari-800 outline-none focus:ring-2 focus:ring-safari-500/20 h-32 resize-none shadow-sm" 
                          value={branding.agencyDescription || ''} 
                          onChange={(e) => setBranding({...branding, agencyDescription: e.target.value})}
                          placeholder="Tell travelers about your agency's mission and expertise..."
                        />
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                    <div className="space-y-2">
                       <label className="block text-[10px] font-black uppercase text-safari-500 tracking-widest ml-1">Year Established</label>
                       <input 
                         type="text" 
                         className="w-full p-4 bg-safari-50 border border-safari-100 rounded-lg font-bold text-safari-900 outline-none focus:ring-2 focus:ring-safari-500/20 shadow-sm" 
                         value={branding.establishedYear || ''} 
                         onChange={(e) => setBranding({...branding, establishedYear: e.target.value})}
                         placeholder="e.g. 2012"
                       />
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between ml-1">
                        <label className="block text-[10px] font-black uppercase text-safari-500 tracking-widest">Agency Statistics</label>
                        <button 
                          onClick={() => setBranding({
                            ...branding, 
                            statistics: [...(branding.statistics || []), { label: '', value: '', iconType: 'heart' }]
                          })}
                          className="text-[10px] font-black uppercase text-safari-600 hover:text-safari-900 flex items-center gap-1 bg-safari-50 px-2 py-1 rounded-md border border-safari-100 shadow-sm"
                        >
                          <Plus size={12} /> Add Stat
                        </button>
                      </div>
                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
                        {(branding.statistics || []).map((stat, idx) => (
                          <div key={idx} className="p-4 bg-safari-50 border border-safari-100 rounded-lg space-y-3 relative group">
                            <button 
                              onClick={() => {
                                const newStats = [...(branding.statistics || [])];
                                newStats.splice(idx, 1);
                                setBranding({ ...branding, statistics: newStats });
                              }}
                              className="absolute top-2 right-2 text-safari-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 size={14} />
                            </button>
                            <div className="grid grid-cols-2 gap-2">
                              <input 
                                className="w-full bg-white p-2 rounded border border-safari-100 font-bold text-xs outline-none"
                                value={stat.value}
                                onChange={(e) => {
                                  const newStats = [...(branding.statistics || [])];
                                  newStats[idx] = { ...stat, value: e.target.value };
                                  setBranding({...branding, statistics: newStats});
                                }}
                                placeholder="Value (e.g. 1,200+)"
                              />
                              <input 
                                className="w-full bg-white p-2 rounded border border-safari-100 font-bold text-xs outline-none"
                                value={stat.label}
                                onChange={(e) => {
                                  const newStats = [...(branding.statistics || [])];
                                  newStats[idx] = { ...stat, label: e.target.value };
                                  setBranding({...branding, statistics: newStats});
                                }}
                                placeholder="Label (e.g. Happy Clients)"
                              />
                            </div>
                            <select 
                              className="w-full bg-white p-2 rounded border border-safari-100 font-bold text-[10px] outline-none"
                              value={stat.iconType}
                              onChange={(e) => {
                                const newStats = [...(branding.statistics || [])];
                                newStats[idx] = { ...stat, iconType: e.target.value as any };
                                setBranding({...branding, statistics: newStats});
                              }}
                            >
                              <option value="heart">Heart Icon</option>
                              <option value="globe">Globe Icon</option>
                              <option value="shield">Shield Icon</option>
                              <option value="award">Award Icon</option>
                              <option value="users">Users Icon</option>
                              <option value="star">Star Icon</option>
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6 mb-10">
                    <h4 className="text-[10px] font-black uppercase text-safari-400 tracking-widest ml-1">Visual Banner Settings</h4>
                    <div className="p-6 bg-safari-50 rounded-lg border border-safari-100">
                      <div className="flex flex-col md:flex-row gap-6 items-start">
                        <div className="w-full md:w-1/3 aspect-video bg-white rounded-lg border border-safari-100 overflow-hidden relative group">
                          {branding.heroImage ? (
                            <img src={branding.heroImage} className="w-full h-full object-cover" alt="Banner Preview" />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-safari-300 gap-2">
                              <ImageIcon size={32} />
                              <span className="text-[10px] font-bold">No Image Uploaded</span>
                            </div>
                          )}
                          <label className="absolute inset-0 bg-safari-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                            <input 
                              type="file" 
                              className="hidden" 
                              accept="image/*"
                              onChange={handleHeroImageUpload}
                            />
                            <span className="text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                              <Upload size={14} /> Click to Upload
                            </span>
                          </label>
                        </div>
                        <div className="flex-1 space-y-4">
                          <div className="space-y-4">
                            <div>
                              <label className="block text-[10px] font-black uppercase text-safari-500 tracking-widest mb-2">Agency Hero Banner</label>
                              <div className="flex gap-3">
                                <label className="flex items-center gap-2 px-6 py-3 bg-safari-900 text-white rounded-lg font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-md cursor-pointer">
                                  <Upload size={16} /> 
                                  Upload New Image
                                  <input 
                                    type="file" 
                                    className="hidden" 
                                    accept="image/*"
                                    onChange={handleHeroImageUpload}
                                  />
                                </label>
                                {branding.heroImage && (
                                  <button 
                                    onClick={() => setBranding({ ...branding, heroImage: '' })}
                                    className="flex items-center gap-2 px-6 py-3 bg-white border border-safari-200 text-safari-600 rounded-lg font-black text-xs uppercase tracking-widest hover:bg-safari-50 transition-all"
                                  >
                                    <Trash2 size={16} /> Clear
                                  </button>
                                )}
                              </div>
                            </div>
                            <p className="text-[10px] text-safari-400 font-medium italic leading-relaxed">
                              Upload a high-quality landscape image (Recommended: 1920x1080). This image will serve as your agency's professional background on the landing page and partner profiles.
                            </p>
                            <div className="grid grid-cols-1 gap-4 pt-4">
                              <div className="space-y-1">
                                <label className="block text-[10px] font-black uppercase text-safari-500 tracking-widest ml-1">Landing Hero Title</label>
                                <input 
                                  type="text" 
                                  className="w-full p-3 bg-white border border-safari-100 rounded-lg font-bold text-safari-900 outline-none focus:ring-2 focus:ring-safari-500/20 text-xs shadow-sm" 
                                  value={branding.heroTitle || ''} 
                                  onChange={(e) => setBranding({...branding, heroTitle: e.target.value})}
                                  placeholder="e.g. Crafting Unforgettable African Odysseys"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="block text-[10px] font-black uppercase text-safari-500 tracking-widest ml-1">Landing Hero Subtitle / Description</label>
                                <textarea 
                                  className="w-full p-3 bg-white border border-safari-100 rounded-lg font-medium text-safari-800 outline-none focus:ring-2 focus:ring-safari-500/20 text-xs h-20 resize-none shadow-sm" 
                                  value={branding.heroDescription || ''} 
                                  onChange={(e) => setBranding({...branding, heroDescription: e.target.value})}
                                  placeholder="Introduce your agency's unique value in one or two sentences..."
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-8 border-t border-safari-50">
                    <h4 className="text-[10px] font-black uppercase text-safari-400 mb-6 tracking-widest">Financial & Rates Configuration</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                      <div className="space-y-2">
                         <label className="block text-[10px] font-black uppercase text-safari-500 tracking-widest ml-1">Global Markup (%)</label>
                         <input 
                           type="number" 
                           className="w-full p-4 bg-safari-50 border border-safari-100 rounded-lg font-bold text-xl text-safari-900 outline-none focus:ring-2 focus:ring-safari-500/20 shadow-sm" 
                           value={branding.defaultMarkup || 0}
                           onChange={(e) => setBranding({...branding, defaultMarkup: Number(e.target.value)})}
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="block text-[10px] font-black uppercase text-safari-500 tracking-widest ml-1">Standard Tax/VAT (%)</label>
                         <input 
                           type="number" 
                           className="w-full p-4 bg-safari-50 border border-safari-100 rounded-lg font-bold text-xl text-safari-900 outline-none focus:ring-2 focus:ring-safari-500/20 shadow-sm" 
                           value={branding.defaultTax || 0}
                           onChange={(e) => setBranding({...branding, defaultTax: Number(e.target.value)})}
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="block text-[10px] font-black uppercase text-safari-500 tracking-widest ml-1">KES to USD Rate (1 USD = X KES)</label>
                         <input 
                           type="number" 
                           className="w-full p-4 bg-safari-50 border border-safari-100 rounded-lg font-bold text-xl text-safari-900 outline-none focus:ring-2 focus:ring-safari-500/20 shadow-sm" 
                           value={branding.kesToUsdRate || 130}
                           onChange={(e) => setBranding({...branding, kesToUsdRate: Number(e.target.value)})}
                         />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between ml-1">
                          <label className="block text-[10px] font-black uppercase text-safari-500 tracking-widest">Park Fees (Agency Pricing)</label>
                          <button 
                            onClick={() => setBranding({
                              ...branding, 
                              parkFees: [...(branding.parkFees || []), { 
                                id: crypto.randomUUID(), 
                                park: '', 
                                keywords: [], 
                                citizenAdult: 0, 
                                citizenChild: 0, 
                                residentAdult: 0, 
                                residentChild: 0, 
                                nonResidentAdult: 0, 
                                nonResidentChild: 0, 
                                currency: 'USD' 
                              }]
                            })}
                            className="text-[10px] font-black uppercase text-safari-600 hover:text-safari-900 flex items-center gap-1 bg-safari-50 px-2 py-1 rounded-md border border-safari-100 shadow-sm"
                          >
                            <Plus size={12} /> Add Park
                          </button>
                        </div>
                        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 no-scrollbar">
                          {(branding.parkFees || []).map((fee, idx) => (
                            <div key={fee.id || idx} className="p-4 bg-white border border-safari-100 rounded-lg shadow-sm space-y-4 animate-fadeIn relative group">
                              <button 
                                onClick={() => {
                                  const newList = [...(branding.parkFees || [])];
                                  newList.splice(idx, 1);
                                  setBranding({ ...branding, parkFees: newList });
                                }}
                                className="absolute top-2 right-2 text-safari-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 z-10"
                              >
                                <Trash2 size={14} />
                              </button>

                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <label className="text-[9px] font-bold text-safari-400 uppercase tracking-tighter">Park Name</label>
                                  <input 
                                    type="text" 
                                    className="w-full p-2 bg-safari-50 border border-safari-100 rounded font-bold text-sm text-safari-900 outline-none" 
                                    value={fee.park}
                                    onChange={(e) => {
                                      const newList = [...(branding.parkFees || [])];
                                      newList[idx] = { ...fee, park: e.target.value, keywords: [e.target.value] };
                                      setBranding({ ...branding, parkFees: newList });
                                    }}
                                    placeholder="e.g. Masai Mara"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[9px] font-bold text-safari-400 uppercase tracking-tighter">Currency</label>
                                  <select 
                                    className="w-full p-2 bg-safari-50 border border-safari-100 rounded font-bold text-sm text-safari-900 outline-none cursor-pointer"
                                    value={fee.currency}
                                    onChange={(e) => {
                                      const newList = [...(branding.parkFees || [])];
                                      newList[idx] = { ...fee, currency: e.target.value as 'USD' | 'KES' };
                                      setBranding({ ...branding, parkFees: newList });
                                    }}
                                  >
                                    <option value="USD">USD ($)</option>
                                    <option value="KES">KES (Shillings)</option>
                                  </select>
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-2 p-2 bg-safari-50/50 rounded-lg">
                                  <label className="text-[9px] font-black text-safari-600 uppercase block border-b border-safari-100 pb-1">Citizen</label>
                                  <div className="space-y-2">
                                    <div className="space-y-0.5">
                                      <label className="text-[8px] font-bold text-safari-400">Adult</label>
                                      <input 
                                        type="number" 
                                        className="w-full p-1.5 bg-white border border-safari-100 rounded font-bold text-xs" 
                                        value={fee.citizenAdult || (fee as any).citizen || 0}
                                        onChange={(e) => {
                                          const newList = [...(branding.parkFees || [])];
                                          newList[idx] = { ...fee, citizenAdult: Number(e.target.value) };
                                          setBranding({ ...branding, parkFees: newList });
                                        }}
                                      />
                                    </div>
                                    <div className="space-y-0.5">
                                      <label className="text-[8px] font-bold text-safari-400">Child</label>
                                      <input 
                                        type="number" 
                                        className="w-full p-1.5 bg-white border border-safari-100 rounded font-bold text-xs" 
                                        value={fee.citizenChild || 0}
                                        onChange={(e) => {
                                          const newList = [...(branding.parkFees || [])];
                                          newList[idx] = { ...fee, citizenChild: Number(e.target.value) };
                                          setBranding({ ...branding, parkFees: newList });
                                        }}
                                      />
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-2 p-2 bg-safari-50/50 rounded-lg">
                                  <label className="text-[9px] font-black text-safari-600 uppercase block border-b border-safari-100 pb-1">Resident</label>
                                  <div className="space-y-2">
                                    <div className="space-y-0.5">
                                      <label className="text-[8px] font-bold text-safari-400">Adult</label>
                                      <input 
                                        type="number" 
                                        className="w-full p-1.5 bg-white border border-safari-100 rounded font-bold text-xs" 
                                        value={fee.residentAdult || (fee as any).resident || 0}
                                        onChange={(e) => {
                                          const newList = [...(branding.parkFees || [])];
                                          newList[idx] = { ...fee, residentAdult: Number(e.target.value) };
                                          setBranding({ ...branding, parkFees: newList });
                                        }}
                                      />
                                    </div>
                                    <div className="space-y-0.5">
                                      <label className="text-[8px] font-bold text-safari-400">Child</label>
                                      <input 
                                        type="number" 
                                        className="w-full p-1.5 bg-white border border-safari-100 rounded font-bold text-xs" 
                                        value={fee.residentChild || 0}
                                        onChange={(e) => {
                                          const newList = [...(branding.parkFees || [])];
                                          newList[idx] = { ...fee, residentChild: Number(e.target.value) };
                                          setBranding({ ...branding, parkFees: newList });
                                        }}
                                      />
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-2 p-2 bg-safari-50/50 rounded-lg">
                                  <label className="text-[9px] font-black text-safari-600 uppercase block border-b border-safari-100 pb-1">Non-Res</label>
                                  <div className="space-y-2">
                                    <div className="space-y-0.5">
                                      <label className="text-[8px] font-bold text-safari-400">Adult</label>
                                      <input 
                                        type="number" 
                                        className="w-full p-1.5 bg-white border border-safari-100 rounded font-bold text-xs" 
                                        value={fee.nonResidentAdult || (fee as any).non_resident || 0}
                                        onChange={(e) => {
                                          const newList = [...(branding.parkFees || [])];
                                          newList[idx] = { ...fee, nonResidentAdult: Number(e.target.value) };
                                          setBranding({ ...branding, parkFees: newList });
                                        }}
                                      />
                                    </div>
                                    <div className="space-y-0.5">
                                      <label className="text-[8px] font-bold text-safari-400">Child</label>
                                      <input 
                                        type="number" 
                                        className="w-full p-1.5 bg-white border border-safari-100 rounded font-bold text-xs" 
                                        value={fee.nonResidentChild || 0}
                                        onChange={(e) => {
                                          const newList = [...(branding.parkFees || [])];
                                          newList[idx] = { ...fee, nonResidentChild: Number(e.target.value) };
                                          setBranding({ ...branding, parkFees: newList });
                                        }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                          {(branding.parkFees || []).length === 0 && (
                            <div className="p-8 border border-dashed border-safari-100 rounded-lg text-center">
                              <p className="text-xs text-safari-400 font-medium">No custom park fees defined.</p>
                            </div>
                          )}
                        </div>
                        <p className="text-[10px] text-safari-400 font-medium italic">Define overrides for official park entry fees used in your itineraries.</p>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between ml-1">
                          <label className="block text-[10px] font-black uppercase text-safari-500 tracking-widest">Transport Rates (Agency Pricing)</label>
                          <button 
                            onClick={() => setBranding({
                              ...branding, 
                              transportRates: [...(branding.transportRates || []), { type: '', rate: 0 }]
                            })}
                            className="text-[10px] font-black uppercase text-safari-600 hover:text-safari-900 flex items-center gap-1 bg-safari-50 px-2 py-1 rounded-md border border-safari-100 shadow-sm"
                          >
                            <Plus size={12} /> Add Rate
                          </button>
                        </div>
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
                          {(branding.transportRates || []).map((rate, idx) => (
                            <div key={idx} className="p-4 bg-white border border-safari-100 rounded-lg shadow-sm space-y-3 animate-fadeIn relative group">
                              <button 
                                onClick={() => {
                                  const newList = [...(branding.transportRates || [])];
                                  newList.splice(idx, 1);
                                  setBranding({ ...branding, transportRates: newList });
                                }}
                                className="absolute top-2 right-2 text-safari-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 size={14} />
                              </button>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <label className="text-[9px] font-bold text-safari-400 uppercase tracking-tighter">Vehicle Type</label>
                                  <input 
                                    type="text" 
                                    className="w-full p-2 bg-safari-50 border border-safari-100 rounded font-bold text-sm text-safari-900 outline-none" 
                                    value={rate.type}
                                    onChange={(e) => {
                                      const newList = [...(branding.transportRates || [])];
                                      newList[idx] = { ...rate, type: e.target.value };
                                      setBranding({ ...branding, transportRates: newList });
                                    }}
                                    placeholder="e.g. Land Cruiser"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[9px] font-bold text-safari-400 uppercase tracking-tighter">Daily Rate ($)</label>
                                  <input 
                                    type="number" 
                                    className="w-full p-2 bg-safari-50 border border-safari-100 rounded font-bold text-sm text-safari-900 outline-none" 
                                    value={rate.rate}
                                    onChange={(e) => {
                                      const newList = [...(branding.transportRates || [])];
                                      newList[idx] = { ...rate, rate: Number(e.target.value) };
                                      setBranding({ ...branding, transportRates: newList });
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                          {(branding.transportRates || []).length === 0 && (
                            <div className="p-8 border border-dashed border-safari-100 rounded-lg text-center">
                              <p className="text-xs text-safari-400 font-medium">No custom transport rates defined.</p>
                            </div>
                          )}
                        </div>
                        <p className="text-[10px] text-safari-400 font-medium italic">Define your agency's standard daily rates for different vehicle types.</p>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {activeSettingsTab === 'payments' && (
              <div className="space-y-6 animate-fadeIn">
                <section className="bg-white rounded-xl shadow-sm border border-safari-100 p-8">
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                    <div>
                      <h3 className="text-lg font-bold text-safari-900 flex items-center gap-2 italic">
                        <CreditCard className="text-safari-500" size={20} />
                        Payment Gateways
                      </h3>
                      <p className="text-sm text-safari-500 font-medium">Configure credentials and processing rules for your payment processors.</p>
                    </div>
                  </div>

                  {/* PayPal */}
                  <div className="space-y-6 mb-10">
                    <div className="flex items-center justify-between border-b border-safari-100 pb-4">
                      <div>
                        <h4 className="font-black text-safari-900 tracking-tight flex items-center gap-2">PayPal Integration</h4>
                        <p className="text-xs text-safari-500 max-w-xl">Accept payments globally with PayPal.</p>
                      </div>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <span className="text-[10px] font-black uppercase tracking-widest text-safari-400">Enable</span>
                        <div className={`w-12 h-6 rounded-full transition-colors relative ${branding?.paymentGateways?.paypal?.enabled ? 'bg-green-500' : 'bg-gray-300'}`}
                             onClick={() => {
                               const paypalArgs = branding.paymentGateways?.paypal || { enabled: false, clientId: '', clientSecret: '', ipnUrl: '' };
                               setBranding({ ...branding, paymentGateways: { ...branding.paymentGateways, paypal: { ...paypalArgs, enabled: !paypalArgs.enabled } }});
                             }}>
                           <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${branding?.paymentGateways?.paypal?.enabled ? 'left-7' : 'left-1'}`} />
                        </div>
                      </label>
                    </div>
                    {branding?.paymentGateways?.paypal?.enabled && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-safari-50 rounded-lg border border-safari-100">
                        <div className="space-y-2">
                          <label className="block text-[10px] font-black uppercase text-safari-500 tracking-widest">Client ID</label>
                          <input type="text" className="w-full p-3 bg-white border border-safari-200 rounded-lg font-bold text-sm outline-none" 
                            value={branding?.paymentGateways?.paypal?.clientId || ''}
                            onChange={(e) => setBranding({...branding, paymentGateways: {...branding.paymentGateways, paypal: {...branding.paymentGateways?.paypal, clientId: e.target.value} as any}})} />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-[10px] font-black uppercase text-safari-500 tracking-widest">Client Secret</label>
                          <input type="password" className="w-full p-3 bg-white border border-safari-200 rounded-lg font-bold text-sm outline-none" 
                            value={branding?.paymentGateways?.paypal?.clientSecret || ''}
                            onChange={(e) => setBranding({...branding, paymentGateways: {...branding.paymentGateways, paypal: {...branding.paymentGateways?.paypal, clientSecret: e.target.value} as any}})} />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="block text-[10px] font-black uppercase text-safari-500 tracking-widest">IPN / Callback URL (For your PayPal Dashboard)</label>
                          <input type="text" className="w-full p-3 bg-white border border-safari-200 rounded-lg font-bold text-sm outline-none" 
                            value={branding?.paymentGateways?.paypal?.ipnUrl || `${window.location.origin}/api/webhooks/paypal`}
                            onChange={(e) => setBranding({...branding, paymentGateways: {...branding.paymentGateways, paypal: {...branding.paymentGateways?.paypal, ipnUrl: e.target.value} as any}})} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* PesaPal */}
                  <div className="space-y-6 mb-10">
                    <div className="flex items-center justify-between border-b border-safari-100 pb-4">
                      <div>
                        <h4 className="font-black text-safari-900 tracking-tight flex items-center gap-2">PesaPal Integration</h4>
                        <p className="text-xs text-safari-500 max-w-xl">Accept mobile money (M-Pesa, Airtel) and local cards across East Africa.</p>
                      </div>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <span className="text-[10px] font-black uppercase tracking-widest text-safari-400">Enable</span>
                        <div className={`w-12 h-6 rounded-full transition-colors relative ${branding?.paymentGateways?.pesapal?.enabled ? 'bg-green-500' : 'bg-gray-300'}`}
                             onClick={() => {
                               const pesaArgs = branding.paymentGateways?.pesapal || { enabled: false, consumerKey: '', consumerSecret: '', ipnUrl: '' };
                               setBranding({ ...branding, paymentGateways: { ...branding.paymentGateways, pesapal: { ...pesaArgs, enabled: !pesaArgs.enabled } }});
                             }}>
                           <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${branding?.paymentGateways?.pesapal?.enabled ? 'left-7' : 'left-1'}`} />
                        </div>
                      </label>
                    </div>
                    {branding?.paymentGateways?.pesapal?.enabled && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-safari-50 rounded-lg border border-safari-100">
                        <div className="space-y-2">
                          <label className="block text-[10px] font-black uppercase text-safari-500 tracking-widest">Consumer Key</label>
                          <input type="text" className="w-full p-3 bg-white border border-safari-200 rounded-lg font-bold text-sm outline-none" 
                            value={branding?.paymentGateways?.pesapal?.consumerKey || ''}
                            onChange={(e) => setBranding({...branding, paymentGateways: {...branding.paymentGateways, pesapal: {...branding.paymentGateways?.pesapal, consumerKey: e.target.value} as any}})} />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-[10px] font-black uppercase text-safari-500 tracking-widest">Consumer Secret</label>
                          <input type="password" className="w-full p-3 bg-white border border-safari-200 rounded-lg font-bold text-sm outline-none" 
                            value={branding?.paymentGateways?.pesapal?.consumerSecret || ''}
                            onChange={(e) => setBranding({...branding, paymentGateways: {...branding.paymentGateways, pesapal: {...branding.paymentGateways?.pesapal, consumerSecret: e.target.value} as any}})} />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="block text-[10px] font-black uppercase text-safari-500 tracking-widest">IPN / Callback URL</label>
                          <input type="text" className="w-full p-3 bg-white border border-safari-200 rounded-lg font-bold text-sm outline-none" 
                            value={branding?.paymentGateways?.pesapal?.ipnUrl || `${window.location.origin}/api/webhooks/pesapal`}
                            onChange={(e) => setBranding({...branding, paymentGateways: {...branding.paymentGateways, pesapal: {...branding.paymentGateways?.pesapal, ipnUrl: e.target.value} as any}})} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Stripe */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-safari-100 pb-4">
                      <div>
                        <h4 className="font-black text-safari-900 tracking-tight flex items-center gap-2">Stripe Integration</h4>
                        <p className="text-xs text-safari-500 max-w-xl">Accept domestic and international credit cards seamlessly.</p>
                      </div>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <span className="text-[10px] font-black uppercase tracking-widest text-safari-400">Enable</span>
                        <div className={`w-12 h-6 rounded-full transition-colors relative ${branding?.paymentGateways?.stripe?.enabled ? 'bg-green-500' : 'bg-gray-300'}`}
                             onClick={() => {
                               const stripeArgs = branding.paymentGateways?.stripe || { enabled: false, publicKey: '', secretKey: '', webhookSecret: '' };
                               setBranding({ ...branding, paymentGateways: { ...branding.paymentGateways, stripe: { ...stripeArgs, enabled: !stripeArgs.enabled } }});
                             }}>
                           <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${branding?.paymentGateways?.stripe?.enabled ? 'left-7' : 'left-1'}`} />
                        </div>
                      </label>
                    </div>
                    {branding?.paymentGateways?.stripe?.enabled && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-safari-50 rounded-lg border border-safari-100">
                        <div className="space-y-2">
                          <label className="block text-[10px] font-black uppercase text-safari-500 tracking-widest">Publishable Key</label>
                          <input type="text" className="w-full p-3 bg-white border border-safari-200 rounded-lg font-bold text-sm outline-none" 
                            value={branding?.paymentGateways?.stripe?.publicKey || ''}
                            onChange={(e) => setBranding({...branding, paymentGateways: {...branding.paymentGateways, stripe: {...branding.paymentGateways?.stripe, publicKey: e.target.value} as any}})} />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-[10px] font-black uppercase text-safari-500 tracking-widest">Secret Key</label>
                          <input type="password" className="w-full p-3 bg-white border border-safari-200 rounded-lg font-bold text-sm outline-none" 
                            value={branding?.paymentGateways?.stripe?.secretKey || ''}
                            onChange={(e) => setBranding({...branding, paymentGateways: {...branding.paymentGateways, stripe: {...branding.paymentGateways?.stripe, secretKey: e.target.value} as any}})} />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="block text-[10px] font-black uppercase text-safari-500 tracking-widest">Webhook Setup (Stripe Dashboard &gt; Webhooks)</label>
                          <p className="text-xs text-safari-500 mb-2">Configure this endpoint URL in Stripe and paste the Endpoint Secret below to verify events.</p>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="p-3 bg-white border border-safari-200 rounded-lg font-mono text-xs flex-1 truncate">{window.location.origin}/api/webhooks/stripe</span>
                            <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/api/webhooks/stripe`); toast.success('Webhook URL copied!'); }} className="p-3 bg-safari-800 text-white rounded-lg hover:bg-safari-900 transition"><Link size={16}/></button>
                          </div>
                          <label className="block text-[10px] font-black uppercase text-safari-500 tracking-widest mb-1 mt-4">Webhook Endpoint Secret</label>
                          <input type="password" placeholder="whsec_..." className="w-full p-3 bg-white border border-safari-200 rounded-lg font-bold text-sm outline-none" 
                            value={branding?.paymentGateways?.stripe?.webhookSecret || ''}
                            onChange={(e) => setBranding({...branding, paymentGateways: {...branding.paymentGateways, stripe: {...branding.paymentGateways?.stripe, webhookSecret: e.target.value} as any}})} />
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            )}

            {activeSettingsTab === 'data' && profile?.is_super_user && (
              <div className="space-y-6 animate-fadeIn">
                <section className="bg-white rounded-xl shadow-sm border border-safari-100 p-8">
                  <h3 className="text-lg font-bold text-safari-900 mb-8 flex items-center gap-2 italic">
                    <Database className="text-safari-500" size={20} />
                    Global System Log
                  </h3>
                  <p className="text-sm text-safari-500 font-medium mb-8">Platform-wide diagnostics and activity monitoring for super users.</p>
                  <div className="p-12 bg-safari-50 rounded-xl border border-dashed border-safari-200 flex flex-col items-center justify-center text-center">
                    <Database className="text-safari-300 mb-4" size={48} />
                    <h4 className="font-bold text-safari-900">Advanced Data Hub</h4>
                    <p className="text-xs text-safari-500 max-w-xs mt-2">Global pricing controls have been moved to individual agency settings. This tab now serves as a system log entry point.</p>
                  </div>
                </section>
              </div>
            )}

            <div className="pt-8 border-t border-safari-100 flex justify-end">
              <button 
                onClick={handleSaveBranding}
                disabled={isSavingBranding}
                className="px-8 py-3 bg-safari-800 text-white rounded-lg font-black uppercase text-xs tracking-widest hover:bg-safari-900 shadow-xl transition-all flex items-center gap-2 group disabled:opacity-50"
              >
                {isSavingBranding ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <Save size={18} className="group-hover:scale-110 transition-transform" />
                )}
                {isSavingBranding ? 'Saving...' : 'Update Brand Information'}
              </button>
            </div>
          </div>
        )}

        {/* Generic Routing for modules */}
        {activeTab === 'team' && (
          <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
            <header className="flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-black text-safari-900 tracking-tight">
                  {managedCompanyId ? `${managedCompany?.name} Team` : 'Safari Specialists'}
                </h1>
                <p className="text-safari-500 font-bold">
                  {managedCompanyId ? `Manage staff for ${managedCompany?.name}.` : 'Manage your dedicated team members and specialists.'}
                </p>
              </div>
              <button 
                onClick={() => {
                  setSelectedMember(null);
                  setMemberFormData({ name: '', role: '', bio: '', photo_url: '', email: '', phone: '', is_public: true, system_role: 'staff' });
                  setIsTeamModalOpen(true);
                }} 
                className="bg-safari-800 text-white px-8 py-3 rounded-lg font-bold uppercase text-xs tracking-widest hover:bg-safari-900 transition-all shadow-xl flex items-center gap-2"
              >
                <UserPlus size={18} /> Add Member
              </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isTeamLoading ? (
                <div className="col-span-full py-20 flex justify-center"><Loader2 className="animate-spin text-safari-400" size={48} /></div>
              ) : teamMembers.length === 0 ? (
                <div className="col-span-full py-20 bg-white rounded-xl border border-dashed border-safari-200 flex flex-col items-center justify-center p-12 text-center">
                   <div className="w-16 h-16 bg-safari-50 text-safari-300 rounded-full flex items-center justify-center mb-4">
                     <Users size={32} />
                   </div>
                   <h3 className="text-lg font-bold text-safari-900">No team members yet</h3>
                   <p className="text-safari-500 mb-6">Start by adding your first safari specialist.</p>
                   <button 
                    onClick={() => setIsTeamModalOpen(true)}
                    className="px-6 py-2 bg-safari-800 text-white rounded-lg font-bold text-xs uppercase hover:bg-safari-900 transition-all"
                  >
                    Add Member
                  </button>
                </div>
              ) : (
                teamMembers.map(member => (
                  <div key={member.id} className="bg-white rounded-xl shadow-sm border border-safari-100 p-6 flex flex-col group">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 border-2 border-safari-50 shadow-sm bg-safari-50 text-safari-300">
                        {member.photo_url ? (
                           <img src={member.photo_url} alt={member.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                           <div className="w-full h-full flex items-center justify-center"><Users size={24} /></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-safari-900 truncate">{member.name}</h3>
                      <p className="text-[10px] font-black uppercase text-safari-400 mb-1">{member.role}</p>
                      <div className="flex items-center gap-2 mb-1">
                        {member.is_public !== false ? (
                          <span className="px-1.5 py-0.5 bg-green-100 text-green-600 text-[8px] font-black uppercase rounded">Public Profile</span>
                        ) : (
                          <span className="px-1.5 py-0.5 bg-safari-100 text-safari-400 text-[8px] font-black uppercase rounded">Private Profile</span>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                           <p className="text-[10px] text-safari-500 flex items-center gap-2 truncate"><Mail size={10} className="flex-shrink-0" /> {member.email}</p>
                           {member.phone && <p className="text-[10px] text-safari-500 flex items-center gap-2"><Phone size={10} className="flex-shrink-0" /> {member.phone}</p>}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-safari-500 line-clamp-3 mb-6 leading-relaxed flex-1 italic">"{member.bio}"</p>
                    <div className="flex justify-end gap-2 pt-4 border-t border-safari-50">
                      <button 
                        onClick={() => {
                          const inviteUrl = `${window.location.origin}/?auth=signup&type=agency`;
                          const subject = encodeURIComponent(`Invitation to join ${managedCompany?.name || company?.name || 'our team'}`);
                          const body = encodeURIComponent(`Hi ${member.name},\n\nYou've been invited to join ${managedCompany?.name || company?.name || 'our team'}.\n\nPlease sign up here to access your account:\n${inviteUrl}`);
                          window.location.href = `mailto:${member.email}?subject=${subject}&body=${body}`;
                          toast.success('Opening email client...');
                        }}
                        title="Send Invite Email"
                        className="p-2 bg-safari-50 text-safari-600 rounded-lg hover:bg-safari-100 transition-all flex items-center gap-1"
                      >
                        <Mail size={16} />
                        <span className="text-xs font-bold pl-1 uppercase tracking-wider pr-1">Email Invite</span>
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedMember(member);
                          setMemberFormData({
                            name: member.name,
                            role: member.role,
                            bio: member.bio,
                            photo_url: member.photo_url || '',
                            email: member.email || '',
                            phone: member.phone || '',
                            is_public: member.is_public !== false,
                            system_role: (member as any).system_role || 'staff'
                          });
                          setIsTeamModalOpen(true);
                        }}
                        className="p-2 bg-safari-50 text-safari-600 rounded-lg hover:bg-safari-100 transition-all"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteMember(member.id)}
                        className="p-2 bg-safari-50 text-red-400 rounded-lg hover:bg-red-50 hover:text-red-600 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'leads' && <LeadsView leads={leads} isLoading={isLeadsLoading} onCosting={handleCostingClick} onPreview={handleViewLead} />}
        {activeTab === 'quotations' && (
          <QuotesView 
            quotations={quotations} 
            isLoading={isQuotesLoading} 
            onCosting={handleCostingClick} 
            onInvoice={handleInvoiceClick} 
            onToggleConfirm={handleToggleConfirmation}
            onNewQuote={() => handleInitQuote()}
          />
        )}
        {activeTab === 'invoices' && <InvoicesView invoices={allBilledQuotes} isLoading={isQuotesLoading} onInvoice={handleInvoiceClick} quotations={quotations} onToggleConfirm={handleToggleConfirmation} />}
        {activeTab === 'payments' && <div className="p-8"><PaymentModule pendingInvoices={allBilledQuotes} payments={payments} onRecordPayment={handleRecordPayment} onBack={goBack} /></div>}
        {activeTab === 'receipts' && <div className="p-8"><ReceiptModule payments={payments} branding={branding} onBack={goBack} /></div>}
        {activeTab === 'payment_vouchers' && <div className="p-8"><PaymentVoucherModule payments={payments} branding={branding} onBack={goBack} /></div>}
        {/* Fixed confirmedQuotes error by using allBilledQuotes */}
        {activeTab === 'disbursements' && <div className="p-8"><DisbursementModule itineraries={allBilledQuotes} branding={branding} onBack={goBack} /></div>}
        {activeTab === 'calculator' && <div className="p-8"><CostingModule itinerary={DUMMY_ITINERARY} formData={DUMMY_FORM_DATA} lodges={lodges} customRates={customRates} branding={branding} onBack={goBack} initialMode="calculator" /></div>}
        {activeTab === 'planner' && (
          <div className="p-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-3xl shadow-xl border border-safari-100 overflow-hidden min-h-[600px] flex">
              <SafariForm 
                onSubmit={handlePlannerSubmit}
                isLoading={isPlannerLoading}
                branding={branding}
                companyId={effectiveCompany?.id || effectiveCompanyId}
                isWidget={false}
              />
            </div>
          </div>
        )}
        {activeTab === 'property_edit' && (
          <div className="p-8">
            <LodgeEditor 
              lodge={selectedLodge} 
              customRate={selectedLodge ? customRates.find(r => r.lodge_id === selectedLodge.id) : null}
              companies={companies}
              onClose={goBack} 
              onSave={() => {
                fetchLodges();
                fetchCustomRates();
              }} 
            />
          </div>
        )}
        {activeTab === 'safari_edit' && <div className="p-8"><MasterItineraryEditor safari={selectedMaster} lodges={lodges} teamMembers={teamMembers} onClose={goBack} onSave={fetchMasterItineraries} /></div>}
        {activeTab === 'property_view' && selectedLodge && (
          <div className="p-8">
            <PropertyDetailView 
              lodge={selectedLodge} 
              customRate={customRates.find(r => r.lodge_id === selectedLodge.id)}
              onBack={goBack} 
            />
          </div>
        )}
        {activeTab === 'costing' && selectedLead && (
          <div className="p-8">
            <CostingModule 
              itinerary={selectedLead.itinerary_data} 
              formData={selectedLead.form_data} 
              lodges={lodges} 
              customRates={customRates}
              branding={branding}
              onBack={goBack} 
              onSave={handleSaveCosting}
              backLabel={getBackLabel(navigationSource)}
            />
          </div>
        )}
        {activeTab === 'invoice_editor' && selectedLead && (
          <div className="p-8">
            <InvoiceModule 
              report={selectedLead.costing_report} 
              formData={selectedLead.form_data} 
              itinerary={selectedLead.itinerary_data} 
              payments={payments.filter(p => p.itineraryId === selectedLead.id)}
              branding={branding}
              onBack={goBack} 
            />
          </div>
        )}
        {activeTab === 'itinerary_view' && viewingItinerary && (
          <div className="p-8">
            <ItineraryView 
              itinerary={viewingItinerary.itinerary} 
              formData={viewingItinerary.formData} 
              lodges={lodges} 
              branding={branding}
              onReset={goBack} 
              onEdit={() => {
                if (viewingItinerary.type === 'master') {
                  navigateToTab('safari_edit');
                } else if (viewingItinerary.type === 'lead') {
                  navigateToTab('costing');
                } else {
                  goBack();
                }
              }} 
              onViewLodge={handleViewLodgeDetails}
              onBackToHistory={goBack}
              isFromAdmin={true}
              masterId={viewingItinerary.type === 'master' ? viewingItinerary.id : undefined}
              itinId={viewingItinerary.type === 'lead' ? viewingItinerary.id : undefined}
            />
          </div>
        )}
        {activeTab === 'subscription' && (
          <div className="p-8 h-full">
            <SubscriptionPage />
          </div>
        )}
      </div>
    )}
  </main>
      
      {/* Mobile Bottom Navigation - Fixed for all pages */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-white border-t border-safari-100 flex items-center justify-around px-4 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <button 
          onClick={() => navigateToTab('dashboard')}
          className={`flex flex-col items-center gap-1 p-2 ${activeTab === 'dashboard' ? 'text-safari-900 font-bold' : 'text-safari-400'}`}
        >
          <LayoutDashboard size={22} className={activeTab === 'dashboard' ? 'text-safari-600' : ''} />
          <span className="text-[10px] uppercase tracking-tighter">Dash</span>
        </button>
        <button 
          onClick={() => navigateToTab('properties')}
          className={`flex flex-col items-center gap-1 p-2 ${activeTab === 'properties' ? 'text-safari-900 font-bold' : 'text-safari-400'}`}
        >
          <Building size={22} className={activeTab === 'properties' ? 'text-safari-600' : ''} />
          <span className="text-[10px] uppercase tracking-tighter">Inventory</span>
        </button>
        <button 
          onClick={() => navigateToTab('leads')}
          className={`flex flex-col items-center gap-1 p-2 ${activeTab === 'leads' ? 'text-safari-900 font-bold' : 'text-safari-400'}`}
        >
          <MessageSquare size={22} className={activeTab === 'leads' ? 'text-safari-600' : ''} />
          <span className="text-[10px] uppercase tracking-tighter">Leads</span>
        </button>
        <button 
          onClick={() => navigateToTab('calculator')}
          className={`flex flex-col items-center gap-1 p-2 ${activeTab === 'calculator' ? 'text-safari-900 font-bold' : 'text-safari-400'}`}
        >
          <Wand2 size={22} className={activeTab === 'calculator' ? 'text-safari-600' : ''} />
          <span className="text-[10px] uppercase tracking-tighter">Costing</span>
        </button>
        <button 
          onClick={() => navigateToTab('settings')}
          className={`flex flex-col items-center gap-1 p-2 ${activeTab === 'settings' ? 'text-safari-900 font-bold' : 'text-safari-400'}`}
        >
          <SettingsIcon size={22} className={activeTab === 'settings' ? 'text-safari-600' : ''} />
          <span className="text-[10px] uppercase tracking-tighter">Settings</span>
        </button>
      </nav>
      
      {/* Footer for Desktop Views */}
      <footer className="hidden lg:flex items-center justify-center gap-4 bg-white border-t border-safari-200 p-4 text-center text-[10px] uppercase tracking-widest text-safari-400 font-bold shrink-0 z-30">
        <span>© {new Date().getFullYear()} SafariPlanner.ai • Partner Dashboard</span>
        <DatabaseStatus />
      </footer>
      </div>

      {isNewQuoteModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-scaleIn">
            <div className="bg-safari-900 p-6 text-white flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">Create Direct Quotation</h2>
                <p className="text-safari-300 text-sm">Initialize a quote without a lead</p>
              </div>
              <button onClick={() => setIsNewQuoteModalOpen(false)} className="text-white/60 hover:text-white transition-colors">
                <Plus className="rotate-45" size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-safari-400 tracking-wider">Trip Title *</label>
                  <input 
                    type="text" 
                    value={newQuoteData.tripTitle}
                    onChange={(e) => setNewQuoteData({...newQuoteData, tripTitle: e.target.value})}
                    placeholder="e.g. 7 Days Luxury Serengeti Safari"
                    className="w-full px-4 py-2 bg-safari-50 border border-safari-100 rounded-lg focus:ring-2 focus:ring-safari-500 outline-none transition-all"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-safari-400 tracking-wider">Client Name *</label>
                    <input 
                      type="text" 
                      value={newQuoteData.clientName}
                      onChange={(e) => setNewQuoteData({...newQuoteData, clientName: e.target.value})}
                      placeholder="Full Name"
                      className="w-full px-4 py-2 bg-safari-50 border border-safari-100 rounded-lg focus:ring-2 focus:ring-safari-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-safari-400 tracking-wider">Client Email *</label>
                    <input 
                      type="email" 
                      value={newQuoteData.clientEmail}
                      onChange={(e) => setNewQuoteData({...newQuoteData, clientEmail: e.target.value})}
                      placeholder="email@example.com"
                      className="w-full px-4 py-2 bg-safari-50 border border-safari-100 rounded-lg focus:ring-2 focus:ring-safari-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-safari-400 tracking-wider">Start Date</label>
                    <input 
                      type="date" 
                      value={newQuoteData.startDate}
                      onChange={(e) => setNewQuoteData({...newQuoteData, startDate: e.target.value})}
                      className="w-full px-4 py-2 bg-safari-50 border border-safari-100 rounded-lg focus:ring-2 focus:ring-safari-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-safari-400 tracking-wider">Duration (Days)</label>
                    <input 
                      type="number" 
                      value={newQuoteData.durationDays}
                      onChange={(e) => setNewQuoteData({...newQuoteData, durationDays: parseInt(e.target.value) || 1})}
                      min="1"
                      className="w-full px-4 py-2 bg-safari-50 border border-safari-100 rounded-lg focus:ring-2 focus:ring-safari-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-safari-400 tracking-wider">Adults</label>
                    <input 
                      type="number" 
                      value={newQuoteData.adults}
                      onChange={(e) => setNewQuoteData({...newQuoteData, adults: parseInt(e.target.value) || 0})}
                      min="1"
                      className="w-full px-4 py-2 bg-safari-50 border border-safari-100 rounded-lg focus:ring-2 focus:ring-safari-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-safari-400 tracking-wider">Young Adults</label>
                    <input 
                      type="number" 
                      value={newQuoteData.youngAdults}
                      onChange={(e) => setNewQuoteData({...newQuoteData, youngAdults: parseInt(e.target.value) || 0})}
                      min="0"
                      className="w-full px-4 py-2 bg-safari-50 border border-safari-100 rounded-lg focus:ring-2 focus:ring-safari-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-safari-400 tracking-wider">Children</label>
                    <input 
                      type="number" 
                      value={newQuoteData.children}
                      onChange={(e) => setNewQuoteData({...newQuoteData, children: parseInt(e.target.value) || 0})}
                      min="0"
                      className="w-full px-4 py-2 bg-safari-50 border border-safari-100 rounded-lg focus:ring-2 focus:ring-safari-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-safari-50 border-t border-safari-100 flex gap-3">
              <button 
                onClick={() => setIsNewQuoteModalOpen(false)}
                className="flex-1 px-6 py-3 border border-safari-200 text-safari-600 rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-white transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateDirectQuote}
                disabled={isLoading}
                className="flex-1 px-6 py-3 bg-safari-900 text-white rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-safari-800 transition-all shadow-lg shadow-safari-900/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Calculator size={18} />}
                Create & Cost
              </button>
            </div>
          </div>
        </div>
      )}

      {isAddCompanyOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-scaleIn">
            <div className="bg-safari-900 p-6 text-white flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold font-serif italic tracking-tight">Register New Agency</h2>
                <p className="text-safari-300 text-sm italic tracking-tight">Onboard a new company into the ecosystem</p>
              </div>
              <button 
                type="button"
                onClick={() => setIsAddCompanyOpen(false)} 
                className="text-white/60 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
              >
                <Plus className="rotate-45" size={24} />
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-safari-400 tracking-widest">Company name *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Serengeti Experts"
                    value={newCompanyData.name}
                    onChange={(e) => setNewCompanyData({...newCompanyData, name: e.target.value})}
                    className="w-full px-5 py-3 bg-safari-50 border border-safari-100 rounded-xl focus:ring-2 focus:ring-safari-500 outline-none font-bold text-safari-900 placeholder:text-safari-300 transition-all shadow-inner"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-safari-400 tracking-widest">Unique Slug (URL) *</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="serengeti-experts"
                      value={newCompanyData.slug}
                      onChange={(e) => setNewCompanyData({...newCompanyData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
                      className="w-full pl-5 pr-24 py-3 bg-safari-50 border border-safari-100 rounded-xl focus:ring-2 focus:ring-safari-500 outline-none font-bold text-safari-900 placeholder:text-safari-300 transition-all shadow-inner"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-safari-300 pointer-events-none uppercase tracking-tighter">
                      .safariplanner.ai
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsAddCompanyOpen(false)}
                  className="flex-1 px-6 py-4 border border-safari-200 text-safari-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-safari-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={handleSaveCompany}
                  disabled={isLoading}
                  className="flex-1 px-6 py-4 bg-safari-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-safari-800 transition-all shadow-lg shadow-safari-900/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Building size={18} />}
                  Add Agency
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isAddUserOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-scaleIn">
            <div className="bg-safari-900 p-6 text-white flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold font-serif italic tracking-tight">Provision Global User</h2>
                <p className="text-safari-300 text-sm italic tracking-tight">Create a system profile and assign permissions</p>
              </div>
              <button 
                type="button"
                onClick={() => setIsAddUserOpen(false)} 
                className="text-white/60 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
              >
                <Plus className="rotate-45" size={24} />
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-safari-400 tracking-widest">Full Name *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Jane Doe"
                    value={newUserData.full_name}
                    onChange={(e) => setNewUserData({...newUserData, full_name: e.target.value})}
                    className="w-full px-5 py-3 bg-safari-50 border border-safari-100 rounded-xl focus:ring-2 focus:ring-safari-500 outline-none font-bold text-safari-900 placeholder:text-safari-300 shadow-inner"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-safari-400 tracking-widest">Email Address *</label>
                  <input 
                    type="email" 
                    placeholder="jane@agency.com"
                    value={newUserData.email}
                    onChange={(e) => setNewUserData({...newUserData, email: e.target.value})}
                    className="w-full px-5 py-3 bg-safari-50 border border-safari-100 rounded-xl focus:ring-2 focus:ring-safari-500 outline-none font-bold text-safari-900 placeholder:text-safari-300 shadow-inner"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-safari-400 tracking-widest">Assign Agency</label>
                    <select 
                      value={newUserData.company_id}
                      onChange={(e) => setNewUserData({...newUserData, company_id: e.target.value})}
                      className="w-full px-5 py-3 bg-safari-50 border border-safari-100 rounded-xl focus:ring-2 focus:ring-safari-500 outline-none font-bold text-safari-900 shadow-inner text-sm"
                    >
                      <option value="">None (Independent)</option>
                      {companies.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-safari-400 tracking-widest">User Type</label>
                    <select 
                      value={newUserData.user_type}
                      onChange={(e) => setNewUserData({...newUserData, user_type: e.target.value as any})}
                      className="w-full px-5 py-3 bg-safari-50 border border-safari-100 rounded-xl focus:ring-2 focus:ring-safari-500 outline-none font-bold text-safari-900 shadow-inner text-sm"
                    >
                      <option value="agency">Agency Staff</option>
                      <option value="user">Individual User</option>
                      <option value="provider">Provider / Supplier</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="flex-1 px-6 py-4 border border-safari-200 text-safari-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-safari-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={handleSaveUser}
                  disabled={isLoading}
                  className="flex-1 px-6 py-4 bg-safari-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-safari-800 transition-all shadow-lg shadow-safari-900/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={18} /> : <UserPlus size={18} />}
                  Provision User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isAddPartnerOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-scaleIn">
            <div className="bg-safari-900 p-6 text-white flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold font-serif italic tracking-tight">Add Homepage Partner</h2>
                <p className="text-safari-300 text-sm italic tracking-tight">Set up a logo for the landing page slideshow</p>
              </div>
              <button 
                type="button"
                onClick={() => setIsAddPartnerOpen(false)} 
                className="text-white/60 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
              >
                <Plus className="rotate-45" size={24} />
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-safari-400 tracking-widest">Partner name *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Kenya Airways"
                    value={newPartnerData.name}
                    onChange={(e) => setNewPartnerData({...newPartnerData, name: e.target.value})}
                    className="w-full px-5 py-3 bg-safari-50 border border-safari-100 rounded-xl focus:ring-2 focus:ring-safari-500 outline-none font-bold text-safari-900 placeholder:text-safari-300 transition-all shadow-inner"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-safari-400 tracking-widest">Logo URL *</label>
                  <input 
                    type="text" 
                    placeholder="https://example.com/logo.png"
                    value={newPartnerData.logoUrl}
                    onChange={(e) => setNewPartnerData({...newPartnerData, logoUrl: e.target.value})}
                    className="w-full px-5 py-3 bg-safari-50 border border-safari-100 rounded-xl focus:ring-2 focus:ring-safari-500 outline-none font-bold text-safari-900 placeholder:text-safari-300 transition-all shadow-inner"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-safari-400 tracking-widest">Website URL (Optional)</label>
                  <input 
                    type="text" 
                    placeholder="https://partner.com"
                    value={newPartnerData.websiteUrl}
                    onChange={(e) => setNewPartnerData({...newPartnerData, websiteUrl: e.target.value})}
                    className="w-full px-5 py-3 bg-safari-50 border border-safari-100 rounded-xl focus:ring-2 focus:ring-safari-500 outline-none font-bold text-safari-900 placeholder:text-safari-300 transition-all shadow-inner"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsAddPartnerOpen(false)}
                  className="flex-1 px-6 py-4 border border-safari-200 text-safari-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-safari-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={handleSavePartner}
                  disabled={isLoading}
                  className="flex-1 px-6 py-4 bg-safari-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-safari-800 transition-all shadow-lg shadow-safari-900/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                  Save Partner
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isTeamModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-scaleIn">
            <div className="bg-safari-900 p-6 text-white flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">{selectedMember ? 'Edit Specialist' : 'Add New Specialist'}</h2>
                <p className="text-safari-300 text-sm">Team member details and contact info</p>
              </div>
              <button onClick={() => setIsTeamModalOpen(false)} className="text-white/60 hover:text-white transition-colors">
                <Plus className="rotate-45" size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-safari-400">Full Name *</label>
                    <input 
                      type="text" 
                      value={memberFormData.name}
                      onChange={(e) => setMemberFormData({...memberFormData, name: e.target.value})}
                      className="w-full px-4 py-2 bg-safari-50 border border-safari-100 rounded-lg focus:ring-2 focus:ring-safari-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-safari-400">Role *</label>
                    <input 
                      type="text" 
                      value={memberFormData.role}
                      onChange={(e) => setMemberFormData({...memberFormData, role: e.target.value})}
                      placeholder="e.g. Lead Safari Specialist"
                      className="w-full px-4 py-2 bg-safari-50 border border-safari-100 rounded-lg focus:ring-2 focus:ring-safari-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-safari-400">Email * (for Dashboard Invitation)</label>
                    <input 
                      type="email" 
                      value={memberFormData.email}
                      onChange={(e) => setMemberFormData({...memberFormData, email: e.target.value})}
                      placeholder="email@agency.com"
                      className="w-full px-4 py-2 bg-safari-50 border border-safari-100 rounded-lg focus:ring-2 focus:ring-safari-500 outline-none"
                    />
                    <p className="text-[9px] text-safari-400 italic">Adding an email allows this person to register and join your agency as a staff member.</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-safari-400">Phone</label>
                    <input 
                      type="text" 
                      value={memberFormData.phone}
                      onChange={(e) => setMemberFormData({...memberFormData, phone: e.target.value})}
                      className="w-full px-4 py-2 bg-safari-50 border border-safari-100 rounded-lg focus:ring-2 focus:ring-safari-500 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-safari-400">Photo URL</label>
                  <input 
                    type="text" 
                    value={memberFormData.photo_url}
                    onChange={(e) => setMemberFormData({...memberFormData, photo_url: e.target.value})}
                    placeholder="https://..."
                    className="w-full px-4 py-2 bg-safari-50 border border-safari-100 rounded-lg focus:ring-2 focus:ring-safari-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-safari-400">Short Bio</label>
                  <textarea 
                    value={memberFormData.bio}
                    onChange={(e) => setMemberFormData({...memberFormData, bio: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-2 bg-safari-50 border border-safari-100 rounded-lg focus:ring-2 focus:ring-safari-500 outline-none resize-none"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-safari-50 border border-safari-100 rounded-xl">
                  <div>
                    <p className="text-xs font-bold text-safari-900">Public Profile</p>
                    <p className="text-[10px] text-safari-500">Show this member on the company public profile page.</p>
                  </div>
                  <button 
                    onClick={() => setMemberFormData({...memberFormData, is_public: !memberFormData.is_public})}
                    className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 ${memberFormData.is_public ? 'bg-safari-900' : 'bg-safari-200'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${memberFormData.is_public ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 bg-safari-50 border-t border-safari-100 flex gap-3">
              <button 
                onClick={() => setIsTeamModalOpen(false)}
                className="flex-1 px-6 py-3 border border-safari-200 text-safari-600 rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-white transition-all underline-offset-4"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveTeamMember}
                disabled={isLoading}
                className="flex-1 px-6 py-3 bg-safari-900 text-white rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-safari-800 transition-all shadow-lg shadow-safari-900/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                {selectedMember ? 'Update Member' : 'Add Member'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Helper Components ---

const SuperHubView = ({ 
  companies, 
  allProfiles, 
  allTeamMembers = [],
  lodges, 
  leads,
  masterItineraries,
  globalBranding,
  onAssignLodge, 
  onEditLodge,
  onDeleteCompany,
  onUpdateCompanyStatus,
  onUpdateCompanyScore,
  onDeleteUser,
  onDeleteProperty,
  onDeleteSafari,
  onDeleteLead,
  onAddCompany,
  onAddUser,
  onAddProperty,
  onAddPartner,
  onDeletePartner
}: any) => {
  const [activeSubTab, setActiveSubTab] = useState<'companies' | 'users' | 'inventory' | 'leads' | 'safaris' | 'partners'>('companies');

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      <div className="flex justify-between items-end">
        <header className="space-y-1">
          <h1 className="text-3xl font-bold text-safari-900 tracking-tight">Super User Oversight Hub</h1>
          <p className="text-safari-500 font-medium text-lg italic tracking-tight">Global ecosystem management and cross-company orchestration.</p>
        </header>

        <div className="flex gap-3">
          {activeSubTab === 'companies' && (
            <button 
              onClick={onAddCompany}
              className="px-6 py-2.5 bg-safari-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-safari-800 transition-all flex items-center gap-2 shadow-lg shadow-safari-900/20"
            >
              <Plus size={16} /> Add Company
            </button>
          )}
          {activeSubTab === 'users' && (
            <button 
              onClick={onAddUser}
              className="px-6 py-2.5 bg-safari-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-safari-800 transition-all flex items-center gap-2 shadow-lg shadow-safari-900/20"
            >
              <UserPlus size={16} /> Add Global User
            </button>
          )}
          {activeSubTab === 'inventory' && (
            <button 
              onClick={onAddProperty}
              className="px-6 py-2.5 bg-safari-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-safari-800 transition-all flex items-center gap-2 shadow-lg shadow-safari-900/20"
            >
              <Plus size={16} /> Add Property
            </button>
          )}
          {activeSubTab === 'partners' && (
            <button 
              onClick={onAddPartner}
              className="px-6 py-2.5 bg-safari-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-safari-800 transition-all flex items-center gap-2 shadow-lg shadow-safari-900/20"
            >
              <Plus size={16} /> Add Slideshow Partner
            </button>
          )}
        </div>
      </div>

      <div className="flex bg-safari-100 p-1 rounded-xl border border-safari-200 overflow-x-auto no-scrollbar w-full">
        {[
          { id: 'companies', label: 'Companies', icon: <Building size={16} /> },
          { id: 'users', label: 'Global Users', icon: <Users size={16} /> },
          { id: 'inventory', label: 'Inventory', icon: <Compass size={16} /> },
          { id: 'leads', label: 'All Leads', icon: <MessageSquare size={16} /> },
          { id: 'safaris', label: 'All Safaris', icon: <Bookmark size={16} /> },
          { id: 'partners', label: 'Partners', icon: <Building2 size={16} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              activeSubTab === tab.id 
              ? 'bg-safari-900 text-white shadow-xl translate-y-[-1px]' 
              : 'text-safari-400 hover:text-safari-600'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeSubTab === 'companies' && (
        <div className="bg-white rounded-2xl shadow-xl border border-safari-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-safari-900 text-white">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Company / Instance</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Slug</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-center">Properties</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-center">Score</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-safari-50">
              {companies.map((c: any) => (
                <tr key={c.id} className="hover:bg-safari-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-safari-50 rounded-xl flex items-center justify-center text-safari-600 border border-safari-100 shadow-inner">
                        <Building size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-black text-safari-900 text-lg tracking-tight">{c.name}</p>
                          <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                            c.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {c.status || 'active'}
                          </span>
                        </div>
                        <p className="text-xs text-safari-400 font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-xs">{c.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 font-mono text-xs text-safari-600">/{c.slug}</td>
                  <td className="px-8 py-6 text-center">
                    <span className="px-4 py-2 bg-safari-50 text-safari-900 rounded-lg border border-safari-100 font-black text-sm">
                      {lodges.filter((l: any) => l.company_id === c.id).length}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <input 
                        type="number" 
                        min="20" 
                        max="100" 
                        className="w-16 p-2 bg-safari-50 border border-safari-100 rounded text-center font-bold text-xs"
                        value={c.proficiencyScore || 20}
                        onChange={(e) => {
                          const val = Math.max(20, Math.min(100, Number(e.target.value)));
                          onUpdateCompanyScore(c.id, val);
                        }}
                      />
                      <span className="text-[8px] font-black uppercase tracking-widest text-safari-400">20-100</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right relative">
                    <div className="flex justify-end items-center gap-3">
                      <div className="flex gap-2">
                        {c.status === 'suspended' ? (
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              onUpdateCompanyStatus(c.id, 'active');
                            }}
                            className="p-3 bg-green-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all shadow-sm border border-green-100 flex items-center justify-center min-w-[40px] cursor-pointer"
                            title="Activate Company"
                          >
                            <Check size={18} />
                          </button>
                        ) : (
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              onUpdateCompanyStatus(c.id, 'suspended');
                            }}
                            className="p-3 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-600 hover:text-white transition-all shadow-sm border border-amber-100 flex items-center justify-center min-w-[40px] cursor-pointer"
                            title="Suspend Company"
                          >
                            <ShieldAlert size={18} />
                          </button>
                        )}
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (window.confirm("Permanently delete this company and all its data?")) {
                              onDeleteCompany(c.id);
                            }
                          }}
                          className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm border border-red-100 flex items-center justify-center min-w-[40px] cursor-pointer relative z-30"
                          title="Delete Company"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeSubTab === 'users' && (
        <div className="bg-white rounded-2xl shadow-xl border border-safari-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-safari-900 text-white">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Name / Email</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Company Assignment</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">System Role</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-safari-50">
              {(() => {
                // Combine profiles and team members who haven't registered yet
                const combined = [
                  ...allProfiles.map(p => ({ ...p, isRegistered: true })),
                  ...allTeamMembers
                    .filter(tm => !allProfiles.some(p => p.email === tm.email))
                    .map(tm => ({ ...tm, full_name: tm.name, isRegistered: false }))
                ].sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));

                return combined.map((p: any) => {
                  const userCompany = companies.find((c: any) => c.id === p.company_id);
                  return (
                    <tr key={p.id} className="hover:bg-safari-50/50 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <p className="font-black text-safari-900">{p.full_name}</p>
                          {!p.isRegistered && (
                            <span className="px-1.5 py-0.5 bg-safari-100 text-safari-400 rounded text-[8px] font-black uppercase tracking-widest">Pending</span>
                          )}
                        </div>
                        <p className="text-xs text-safari-500 font-medium">{p.email}</p>
                      </td>
                      <td className="px-8 py-6">
                      {userCompany ? (
                        <div className="flex items-center gap-2">
                           <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                           <span className="font-bold text-safari-700">{userCompany.name}</span>
                        </div>
                      ) : (
                        <span className="text-safari-300 italic font-medium">Unassigned / Network Admin</span>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        p.is_super_user ? 'bg-amber-100 text-amber-700' : 'bg-safari-100 text-safari-600'
                      }`}>
                        {p.is_super_user ? 'Super User' : (p.role || 'Staff')}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right relative">
                      {!p.is_super_user && (
                        <div className="flex justify-end items-center gap-3 relative z-10 pointer-events-auto">
                          <div className="flex gap-2 relative z-20">
                            <button 
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const inviteUrl = `${window.location.origin}/?auth=signup&type=${p.user_type || 'agency'}`;
                                const subject = encodeURIComponent('Your account is ready');
                                const body = encodeURIComponent(`Hi ${p.full_name},\n\nYour account has been provisioned.\n\nPlease sign up here to access your account:\n${inviteUrl}`);
                                window.location.href = `mailto:${p.email}?subject=${subject}&body=${body}`;
                                toast.success('Opening email client...');
                              }}
                              className="p-3 bg-safari-50 text-safari-600 rounded-xl hover:bg-safari-100 transition-all shadow-sm border border-safari-100 flex items-center justify-center min-w-[40px] cursor-pointer pointer-events-auto relative z-30"
                              title="Send Invite Email"
                            >
                              <Mail size={18} />
                            </button>
                            <button 
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onDeleteUser(p.id);
                              }}
                              className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm border border-red-100 flex items-center justify-center min-w-[40px] cursor-pointer pointer-events-auto relative z-30"
                              title="Delete User"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            })()}
          </tbody>
          </table>
        </div>
      )}

      {activeSubTab === 'inventory' && (
        <div className="bg-white rounded-2xl shadow-xl border border-safari-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-safari-900 text-white">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Property</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Current Assignment</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Tier / Type</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-safari-50">
              {lodges.map((l: any) => {
                return (
                  <tr key={l.id} className="hover:bg-safari-50/50 transition-colors">
                    <td className="px-8 py-6">
                      <p className="font-black text-safari-900 text-lg tracking-tight">{l.name}</p>
                      <p className="text-xs text-safari-500 font-medium">{l.location}</p>
                    </td>
                    <td className="px-8 py-6">
                      <select 
                        className="bg-safari-50 border border-safari-100 rounded-lg p-3 font-bold text-sm outline-none focus:ring-2 focus:ring-safari-500 transition-all text-safari-800"
                        value={l.company_id || ''}
                        onChange={(e) => onAssignLodge(l.id, e.target.value)}
                      >
                        <option value="">-- No Assignment --</option>
                        {companies.map((c: any) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-xs font-bold text-safari-600">{l.tier}</p>
                      <p className="text-[10px] text-safari-400 font-medium uppercase tracking-widest">{l.property_type}</p>
                    </td>
                    <td className="px-8 py-6 text-right relative">
                      <div className="flex justify-end gap-2 relative z-10 pointer-events-auto">
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onEditLodge(l);
                          }}
                          className="p-3 bg-safari-50 text-safari-600 rounded-xl hover:bg-safari-900 hover:text-white transition-all shadow-sm border border-safari-100 flex items-center justify-center min-w-[40px] cursor-pointer pointer-events-auto relative z-20"
                          title="Edit Property"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onDeleteProperty(l.id);
                          }}
                          className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm border border-red-100 flex items-center justify-center min-w-[40px] cursor-pointer pointer-events-auto relative z-20"
                          title="Delete Property"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeSubTab === 'leads' && (
        <div className="bg-white rounded-2xl shadow-xl border border-safari-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-safari-900 text-white">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Lead / Client</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Agency</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-center">Created</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-safari-50">
              {leads.map((l: any) => {
                const agency = companies.find((c: any) => c.id === l.company_id);
                const isQuote = !!l.costing_report;
                return (
                  <tr key={l.id} className="hover:bg-safari-50/50 transition-colors">
                    <td className="px-8 py-6">
                      <p className="font-black text-safari-900">{l.customer_name}</p>
                      <p className="text-xs text-safari-500 font-medium">{l.trip_title}</p>
                    </td>
                    <td className="px-8 py-6">
                      <span className="font-bold text-safari-700">{agency?.name || 'Unbranded'}</span>
                    </td>
                    <td className="px-8 py-6 text-center text-xs text-safari-500 font-mono">
                      {l.created_at ? new Date(l.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        isQuote ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {isQuote ? 'Quoted' : 'Lead'}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right relative">
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onDeleteLead(l.id);
                        }}
                        className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm border border-red-100 flex items-center justify-center min-w-[40px] cursor-pointer pointer-events-auto relative z-20"
                        title="Delete Lead"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeSubTab === 'safaris' && (
        <div className="bg-white rounded-2xl shadow-xl border border-safari-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-safari-900 text-white">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Safari Title</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-center">Days</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Owner Agency</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-safari-50">
              {masterItineraries.map((s: any) => {
                const agency = companies.find((c: any) => c.id === s.company_id);
                return (
                  <tr key={s.id} className="hover:bg-safari-50/50 transition-colors">
                    <td className="px-8 py-6">
                      <p className="font-black text-safari-900">{s.trip_title}</p>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className="font-mono text-xs">{s.days || s.itinerary?.length || 0}d</span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="font-bold text-safari-700">{agency?.name || 'Network Collection'}</span>
                    </td>
                    <td className="px-8 py-6 text-right relative">
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onDeleteSafari(s.id);
                        }}
                        className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm border border-red-100 flex items-center justify-center min-w-[40px] cursor-pointer pointer-events-auto relative z-20"
                        title="Delete Safari"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeSubTab === 'partners' && (
        <div className="bg-white rounded-2xl shadow-xl border border-safari-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-safari-900 text-white">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Partner Info</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Link</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-safari-50">
              {(globalBranding.globalPartners || []).length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-8 py-12 text-center text-safari-400 font-medium">No partners configured for the homepage slideshow.</td>
                </tr>
              ) : globalBranding.globalPartners.map((p: any) => (
                <tr key={p.id} className="hover:bg-safari-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-12 bg-white rounded-xl border border-safari-100 flex items-center justify-center overflow-hidden shrink-0">
                        <img src={p.logoUrl} className="max-w-full max-h-full object-contain" alt="" />
                      </div>
                      <span className="font-black text-safari-900 text-lg tracking-tight">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <a href={p.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-safari-600 hover:underline font-medium text-sm flex items-center gap-1">
                      <Globe size={14} /> {p.websiteUrl || 'No Link'}
                    </a>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button 
                      onClick={() => onDeletePartner(p.id)}
                      className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm border border-red-100 flex items-center justify-center min-w-[40px] ml-auto cursor-pointer"
                      title="Remove Partner"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const NavItem = ({ icon, label, isActive, collapsed, onClick }: any) => (
  <Tooltip content={label} side="right" align="center">
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
        isActive 
        ? 'bg-safari-800 text-white shadow-md' 
        : 'text-safari-400 hover:text-white hover:bg-safari-800/50'
      }`}
    >
      <span className="shrink-0">{icon}</span>
      {!collapsed && <span className="font-bold text-sm whitespace-nowrap">{label}</span>}
    </button>
  </Tooltip>
);

const SummaryCard = ({ title, value, subtitle, icon, trend, positive }: any) => (
  <Tooltip content={`${title}: ${subtitle}`} side="top" align="center">
    <div className="bg-white p-7 rounded-[2rem] shadow-sm border border-safari-100 relative overflow-hidden group hover:shadow-xl hover:shadow-safari-900/5 transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className="w-12 h-12 bg-safari-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
          {icon || <LayoutDashboard size={22} className="text-safari-600" />}
        </div>
        {trend && (
          <div className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1 ${positive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {positive ? <ArrowUpRight size={10} /> : <TrendingUp size={10} className="rotate-180" />}
            {trend}
          </div>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-safari-400">{title}</p>
        <p className="text-4xl font-black text-safari-900 tracking-tighter">{value}</p>
        <p className="text-xs font-bold text-safari-500/80 mt-1">{subtitle}</p>
      </div>
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-safari-50/10 to-transparent rounded-bl-[4rem] group-hover:scale-125 transition-transform origin-top-right duration-700" />
    </div>
  </Tooltip>
);

const LeadsView = ({ leads, isLoading, onCosting, onPreview }: any) => {
  const [copyingId, setCopyingId] = useState<string | null>(null);

  const handleShare = async (id: string) => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?itin=${id}`;
    await navigator.clipboard.writeText(shareUrl);
    setCopyingId(id);
    toast.success("Public link copied!");
    setTimeout(() => setCopyingId(null), 3000);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      <header>
        <h1 className="text-3xl font-bold text-safari-900">Booking Leads</h1>
        <p className="text-safari-500 font-medium">New inquiries awaiting pricing.</p>
      </header>
      <div className="bg-white rounded-xl shadow-sm border border-safari-100 overflow-hidden">
        {isLoading ? <LoadingView /> : leads.length === 0 ? <EmptyState icon={<MessageSquare size={48} />} title="No new leads" message="Inquiries will appear here automatically." /> : (
          <table className="w-full text-left">
            <thead className="bg-safari-50 border-b border-safari-100">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold uppercase text-safari-400">Client</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase text-safari-400">Safari</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase text-safari-400 text-center">Routing</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase text-safari-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-safari-50">
              {leads.map((l: any) => (
                <tr key={l.id} className="hover:bg-safari-50/30 group">
                  <td className="px-6 py-4">
                    <p className="font-bold text-safari-900">{l.customer_name}</p>
                    <span className="text-xs text-safari-500">{l.customer_email}</span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-safari-600 truncate max-w-xs">{l.trip_title}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {l.form_data?.assignedPartnerName ? (
                      <span className="px-2 py-1 bg-purple-50 text-purple-600 rounded text-[10px] font-black uppercase tracking-widest border border-purple-100">
                        Assigned: {l.form_data.assignedPartnerName}
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-amber-50 text-amber-600 rounded text-[10px] font-black uppercase tracking-widest border border-amber-100">
                        Market Lead
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1.5">
                      <Tooltip content="Copy Public Link">
                        <button onClick={() => handleShare(l.id)} className="p-1.5 bg-safari-50 text-safari-600 rounded-lg hover:bg-safari-100">
                          {copyingId === l.id ? <Check size={16} className="text-green-600" /> : <Share2 size={16} />}
                        </button>
                      </Tooltip>
                      <Tooltip content="View Details">
                        <button onClick={() => onPreview(l)} className="p-1.5 bg-safari-50 text-safari-600 rounded-lg hover:bg-safari-100"><Eye size={16} /></button>
                      </Tooltip>
                      <Tooltip content="Open Costing Module">
                        <button onClick={() => onCosting(l)} className="p-1.5 bg-safari-800 text-white rounded-lg hover:bg-safari-900"><Calculator size={16} /></button>
                      </Tooltip>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const QuotesView = ({ quotations, isLoading, onCosting, onInvoice, onToggleConfirm, onNewQuote }: any) => {
  const [copyingId, setCopyingId] = useState<string | null>(null);

  const handleShare = async (id: string) => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?itin=${id}`;
    await navigator.clipboard.writeText(shareUrl);
    setCopyingId(id);
    toast.success("Public link copied!");
    setTimeout(() => setCopyingId(null), 3000);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-safari-900">Active Quotations</h1>
          <p className="text-safari-500 font-medium">Costed proposals currently with clients.</p>
        </div>
        <button 
          onClick={onNewQuote}
          className="flex items-center gap-2 bg-safari-900 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-safari-800 transition-all shadow-lg shadow-safari-900/20"
        >
          <Plus size={18} />
          New Quotation
        </button>
      </header>
      <div className="bg-white rounded-xl shadow-sm border border-safari-100 overflow-hidden">
        {isLoading ? <LoadingView /> : quotations.length === 0 ? <EmptyState icon={<ReceiptText size={48} />} title="No quotations" message="Costed leads will move here." /> : (
          <table className="w-full text-left">
            <thead className="bg-safari-50 border-b border-safari-100">
              <tr><th className="px-6 py-4 text-[10px] font-bold uppercase text-safari-400">Client</th><th className="px-6 py-4 text-[10px] font-bold uppercase text-safari-400">Value</th><th className="px-6 py-4 text-[10px] font-bold uppercase text-safari-400">Status</th><th className="px-6 py-4 text-[10px] font-bold uppercase text-safari-400 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-safari-50">
              {quotations.map((q: any) => (
                <tr key={q.id} className="hover:bg-safari-50/30 group">
                  <td className="px-6 py-4"><p className="font-bold text-safari-900">{q.customer_name}</p><span className="text-xs text-safari-600">{q.trip_title}</span></td>
                  <td className="px-6 py-4 font-black">${Math.round(q.costing_report?.total || 0).toLocaleString()}</td>
                  <td className="px-6 py-4"><button onClick={() => onToggleConfirm(q)} className={`text-[10px] font-black uppercase px-2 py-1 rounded border ${['confirmed', 'partially_paid', 'paid'].includes(q.status) ? 'bg-green-50 text-green-600 border-green-100' : 'bg-safari-50 text-safari-400 border-safari-100'}`}>{q.status || 'quoted'}</button></td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1.5">
                      <Tooltip content="Copy Public Link">
                        <button onClick={() => handleShare(q.id)} className="p-1.5 bg-safari-50 text-safari-600 rounded-lg hover:bg-safari-100">
                          {copyingId === q.id ? <Check size={16} className="text-green-600" /> : <Share2 size={16} />}
                        </button>
                      </Tooltip>
                      <Tooltip content="Open Costing Module">
                        <button onClick={() => onCosting(q)} className="p-1.5 bg-safari-50 text-safari-600 rounded-lg hover:bg-safari-100"><Calculator size={16} /></button>
                      </Tooltip>
                      <Tooltip content="Open Invoice Module">
                        <button onClick={() => onInvoice(q)} className="p-1.5 bg-safari-50 text-safari-600 rounded-lg hover:bg-safari-100"><FileText size={16} /></button>
                      </Tooltip>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const InvoicesView = ({ invoices, isLoading, onInvoice, quotations, onToggleConfirm }: any) => {
  const [isSelectQuoteModalOpen, setIsSelectQuoteModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const availableQuotes = (quotations || []).filter((q: any) => 
    q.status === 'quoted' && 
    (q.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
     q.trip_title?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSelectQuote = async (quote: any) => {
    await onToggleConfirm(quote);
    onInvoice(quote);
    setIsSelectQuoteModalOpen(false);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-safari-900">Active Invoices</h1>
          <p className="text-safari-500 font-medium">Confirmed bookings and billing status.</p>
        </div>
        <button 
          onClick={() => setIsSelectQuoteModalOpen(true)}
          className="flex items-center gap-2 bg-safari-900 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-safari-800 transition-all shadow-lg shadow-safari-900/20"
        >
          <Plus size={18} />
          Create from Quote
        </button>
      </header>
      <div className="bg-white rounded-xl shadow-sm border border-safari-100 overflow-hidden">
        {isLoading ? <LoadingView /> : invoices.length === 0 ? <EmptyState icon={<FileText size={48} />} title="No invoices" message="Confirmed quotations will move here." /> : (
          <table className="w-full text-left">
            <thead className="bg-safari-50 border-b border-safari-100">
              <tr><th className="px-6 py-4 text-[10px] font-bold uppercase text-safari-400">Client</th><th className="px-6 py-4 text-[10px] font-bold uppercase text-safari-400">Total Value</th><th className="px-6 py-4 text-[10px] font-bold uppercase text-safari-400">Status</th><th className="px-6 py-4 text-[10px] font-bold uppercase text-safari-400 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-safari-50">
              {invoices.map((i: any) => (
                <tr key={i.id} className="hover:bg-safari-50/30 group">
                  <td className="px-6 py-4"><p className="font-bold text-safari-900">{i.customer_name}</p><span className="text-xs text-safari-600">{i.trip_title}</span></td>
                  <td className="px-6 py-4 font-black">${Math.round(i.costing_report?.total || 0).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-black uppercase px-2 py-1 rounded border ${i.status === 'paid' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                      {i.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Tooltip content="View Invoice">
                        <button onClick={() => onInvoice(i)} className="p-2 bg-safari-50 text-safari-600 rounded-lg hover:bg-safari-100"><FileText size={18} /></button>
                      </Tooltip>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isSelectQuoteModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-scaleIn">
            <div className="bg-safari-900 p-6 text-white flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">Select Quote to Invoice</h2>
                <p className="text-safari-300 text-sm">Pick a quotation to confirm and bill</p>
              </div>
              <button onClick={() => setIsSelectQuoteModalOpen(false)} className="text-white/60 hover:text-white transition-colors">
                <Plus className="rotate-45" size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search by client or trip title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-safari-50 border border-safari-100 rounded-xl outline-none focus:ring-2 focus:ring-safari-500/20 transition-all"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-safari-400">
                  <RefreshCw size={18} className="animate-spin-slow" />
                </div>
              </div>

              <div className="max-h-[400px] overflow-y-auto border border-safari-50 rounded-xl divide-y divide-safari-50">
                {availableQuotes.length === 0 ? (
                  <div className="p-12 text-center text-safari-400">
                    <ReceiptText size={48} className="mx-auto mb-3 opacity-20" />
                    <p className="font-bold text-sm uppercase tracking-widest">No available quotes found</p>
                  </div>
                ) : (
                  availableQuotes.map((q: any) => (
                    <div key={q.id} className="p-4 hover:bg-safari-50 transition-colors flex justify-between items-center group">
                      <div>
                        <p className="font-bold text-safari-900">{q.customer_name}</p>
                        <p className="text-xs text-safari-500">{q.trip_title}</p>
                        <p className="text-[10px] font-black text-safari-400 mt-1 uppercase tracking-tighter">
                          Value: ${Math.round(q.costing_report?.total || 0).toLocaleString()}
                        </p>
                      </div>
                      <button 
                        onClick={() => handleSelectQuote(q)}
                        className="px-4 py-2 bg-safari-800 text-white rounded-lg font-bold text-[10px] uppercase tracking-widest transition-all hover:bg-safari-900"
                      >
                        Select & Bill
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="p-6 bg-safari-50 border-t border-safari-100 flex justify-end">
              <button 
                onClick={() => setIsSelectQuoteModalOpen(false)}
                className="px-6 py-2 text-safari-600 font-bold text-xs uppercase tracking-widest hover:text-safari-900"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const LoadingView = () => (
  <div className="p-20 flex flex-col items-center justify-center text-safari-400"><Loader2 className="animate-spin mb-4" size={32} /><p className="font-bold text-sm uppercase tracking-widest">Querying Cloud Data...</p></div>
);

const EmptyState = ({ icon, title, message, action, actionLabel }: any) => (
  <div className="p-20 text-center space-y-4">
    <div className="text-safari-100 mx-auto w-fit">{icon}</div>
    <div><h3 className="text-lg font-bold text-safari-900">{title}</h3><p className="text-safari-500 text-sm max-w-xs mx-auto">{message}</p></div>
    {action && <button onClick={action} className="bg-safari-800 text-white px-6 py-2 rounded-lg font-bold text-xs uppercase tracking-widest">{actionLabel}</button>}
  </div>
);

export default AdminPanel;
