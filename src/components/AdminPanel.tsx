
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, Trash2, Save, Building, LogOut, Loader2, 
  Edit3, 
  LayoutDashboard, MessageSquare, Menu, ChevronLeft, ChevronDown, ChevronUp,
  RefreshCw, Compass, MapPin, Mail, Phone,
  Eye, ReceiptText, FileText, CreditCard,
  Calculator, Bookmark, FileCheck, Wand2,
  Wallet, Settings as SettingsIcon, Monitor, Palette,
  Share2, Check, Users, UserPlus, Type, Image as ImageIcon, HelpCircle, Quote, Database,
  ShieldAlert, ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { Lodge, SafariFormData, GeneratedItinerary, CostingReport, Payment, BudgetTier, TransportType, BrandingConfig, TeamMember } from '../types';
import { supabase } from '../lib/supabase';
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
  agencyName: 'SafariPlanner.ai',
  agencyDescription: 'Expert-grade African adventures in seconds.',
  socialLinks: [],
  parkFees: [],
  transportRates: [],
  defaultMarkup: 20,
  defaultTax: 16,
  financeEmail: 'finance@safariplanner.ai'
};

type AdminTab = 'dashboard' | 'properties' | 'property_edit' | 'property_view' | 'leads' | 'costing' | 'quotations' | 'invoices' | 'invoice_editor' | 'payments' | 'receipts' | 'signature_safaris' | 'safari_edit' | 'calculator' | 'disbursements' | 'payment_vouchers' | 'settings' | 'itinerary_view' | 'team' | 'super_hub';

const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const { user, profile, company, refreshProfile, signOut } = useAuth();
  
  // Navigation State
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [navigationSource, setNavigationSource] = useState<AdminTab>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Global Loading State
  const [isLoading, setIsLoading] = useState(false);

  // Configuration State
  const [isLandingEnabled, setIsLandingEnabled] = useState(true);
  const [branding, setBranding] = useState<BrandingConfig>(DEFAULT_BRANDING);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'general' | 'visuals' | 'landing' | 'contact' | 'data'>('general');

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
  const [isCustomRatesLoading, setIsCustomRatesLoading] = useState(false);
  const [isSavingBranding, setIsSavingBranding] = useState(false);
  
  const [lodges, setLodges] = useState<Lodge[]>([]);
  const [customRates, setCustomRates] = useState<LodgeCustomRate[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  const [isLodgesLoading, setIsLodgesLoading] = useState(false);
  const [selectedLodge, setSelectedLodge] = useState<Lodge | null>(null);
  const [selectedMaster, setSelectedMaster] = useState<any | null>(null);
  const [copyingMasterId, setCopyingMasterId] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [viewingItinerary, setViewingItinerary] = useState<{itinerary: GeneratedItinerary, formData: SafariFormData, id?: string, type?: 'lead' | 'master'} | null>(null);
  const [isFinancialsOpen, setIsFinancialsOpen] = useState(false);

  // Super Hub Add States
  const [isAddCompanyOpen, setIsAddCompanyOpen] = useState(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newCompanyData, setNewCompanyData] = useState({
    name: '',
    slug: '',
    branding: DEFAULT_BRANDING
  });
  const [newUserData, setNewUserData] = useState({
    full_name: '',
    email: '',
    company_id: '',
    user_type: 'agency' as 'agency' | 'user' | 'provider',
    status: 'active' as 'active' | 'suspended'
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
    if (!company && !profile?.is_super_user) return;
    setIsLodgesLoading(true);
    try {
      const { data, error } = await supabase.from('lodges')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setLodges(data || []);
    } catch (err: any) { console.error(err); } finally { setIsLodgesLoading(false); }
  }, [company, profile]);

  const fetchGlobalData = useCallback(async () => {
    if (!profile?.is_super_user) return;
    try {
      const { data: cos, error: ce } = await supabase.from('companies').select('*').order('name');
      if (ce) throw ce;
      setCompanies(cos || []);

      const { data: pros, error: pe } = await supabase.from('profiles').select('*').order('full_name');
      if (pe) throw pe;
      setAllProfiles(pros || []);
    } catch (err: any) {
      console.error("Global fetch error:", err);
    }
  }, [profile]);

  const fetchCustomRates = useCallback(async () => {
    if (!company) return;
    setIsCustomRatesLoading(true);
    try {
      const { data, error } = await supabase.from('lodge_custom_rates')
        .select('*')
        .eq('company_id', company.id);
      if (error) throw error;
      setCustomRates(data || []);
    } catch (err: any) { console.error(err); } finally { setIsCustomRatesLoading(false); }
  }, [company]);

  const fetchMasterItineraries = useCallback(async () => {
    if (!company && !profile?.is_super_user) return;
    setIsMasterLoading(true);
    try {
      let query = supabase.from('master_itineraries').select('*');
      if (!profile?.is_super_user && company) {
        query = query.eq('company_id', company.id);
      }
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      setMasterItineraries(data || []);
    } catch (err: any) { console.error(err); } finally { setIsMasterLoading(false); }
  }, [company, profile]);

  const fetchLeads = useCallback(async () => {
    if (!company && !profile?.is_super_user) return;
    setIsLeadsLoading(true);
    try {
      let query = supabase.from('itineraries').select('*');
      if (!profile?.is_super_user && company) {
        query = query.eq('company_id', company.id);
      }
      const { data, error } = await query
        .is('costing_report', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setLeads(data || []);
    } catch (err: any) { console.error(err); } finally { setIsLeadsLoading(false); }
  }, [company, profile]);

  const fetchQuotations = useCallback(async () => {
    if (!company && !profile?.is_super_user) return;
    setIsQuotesLoading(true);
    try {
      let query = supabase.from('itineraries').select('*');
      if (!profile?.is_super_user && company) {
        query = query.eq('company_id', company.id);
      }
      const { data, error } = await query
        .not('costing_report', 'is', null)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      setQuotations(data || []);
    } catch (err: any) { console.error(err); } finally { setIsQuotesLoading(false); }
  }, [company, profile]);

  const fetchPayments = useCallback(async () => {
    if (!company && !profile?.is_super_user) return;
    try {
      let query = supabase.from('payments').select('*');
      if (!profile?.is_super_user && company) {
        query = query.eq('company_id', company.id);
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
  }, [company, profile]);

  const fetchTeamMembers = useCallback(async () => {
    if (!company && !profile?.is_super_user) return;
    setIsTeamLoading(true);
    try {
      let query = supabase.from('team_members').select('*');
      if (!profile?.is_super_user && company) {
        query = query.eq('company_id', company.id);
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
  }, [company, profile]);

  const fetchConfig = useCallback(async () => {
    if (company) {
      setIsLandingEnabled(company.is_landing_enabled ?? true);
      if (company.branding) setBranding(company.branding);
    }
  }, [company]);

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
  }, [company, profile?.is_super_user, fetchAllData]);

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

  const handleToggleLanding = async (enabled: boolean) => {
    if (!company) return;
    try {
      setIsLandingEnabled(enabled);
      const { error } = await supabase
        .from('companies')
        .update({ 
          is_landing_enabled: enabled,
          updated_at: new Date().toISOString()
        })
        .eq('id', company.id);
      
      if (error) throw error;
      
      await refreshProfile();
      toast.success(`Landing page ${enabled ? 'enabled' : 'disabled'} successfully.`);
    } catch (err: any) {
      toast.error("Failed to update landing page status: " + err.message);
    }
  };

  const handleSaveBranding = async () => {
    if (!company) return;
    setIsSavingBranding(true);
    try {
      const { error } = await supabase
        .from('companies')
        .update({ 
          branding: branding,
          updated_at: new Date().toISOString()
        })
        .eq('id', company.id);
      
      if (error) throw error;

      await refreshProfile();
      toast.success("Branding configuration updated successfully.");
    } catch (err: any) {
      toast.error("Failed to save branding: " + err.message);
    } finally {
      setIsSavingBranding(false);
    }
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
      toast.success(selectedMember ? 'Member updated.' : 'Member added.');
      setIsTeamModalOpen(false);
      fetchTeamMembers();
    } catch (err: any) { toast.error(err.message); } finally { setIsLoading(false); }
  };

  const handleCostingClick = (lead: any) => {
    setNavigationSource(activeTab);
    setSelectedLead(lead);
    setActiveTab('costing');
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
    setActiveTab('invoice_editor');
  };

  const handleEditLodge = (lodge: Lodge) => {
    setSelectedLodge(lodge);
    setActiveTab('property_edit');
  };

  const handleNewLodge = () => {
    setSelectedLodge(null);
    setActiveTab('property_edit');
  };

  const handleEditMaster = (safari: any) => {
    setSelectedMaster(safari);
    setActiveTab('safari_edit');
  };

  const handleNewMaster = () => {
    setSelectedMaster(null);
    setActiveTab('safari_edit');
  };

  const handleViewLodgeDetails = (lodge: Lodge) => {
    setSelectedLodge(lodge);
    setActiveTab('property_view');
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
    setActiveTab('itinerary_view');
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
    setActiveTab('itinerary_view');
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
        setActiveTab(navigationSource);
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
      // Create user profile
      const { error } = await supabase.from('profiles').insert([{
        full_name: newUserData.full_name,
        email: newUserData.email,
        company_id: newUserData.company_id || null,
        user_type: newUserData.user_type,
        status: newUserData.status,
        is_super_user: false
      }]);
      if (error) throw error;
      toast.success("User profile created. They can login once their Auth account is ready.");
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
      {/* Fixed Sidebar */}
      <aside className={`fixed top-0 left-0 bottom-0 bg-safari-900 text-white flex flex-col transition-all duration-300 ${isSidebarCollapsed ? 'w-20' : 'w-72'} border-r border-safari-800 shadow-2xl z-40`}>
        <div className="p-6 h-20 flex items-center justify-between">
          {!isSidebarCollapsed && (
            <div className="flex items-center gap-3 overflow-hidden">
              <Compass className="text-safari-400 shrink-0" size={28} />
              <span className="font-extrabold tracking-tight text-xl truncate">
                {company?.name || 'Partner Hub'}
              </span>
            </div>
          )}
          <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="p-2 hover:bg-safari-800 rounded-lg transition-colors">
            {isSidebarCollapsed ? <Menu size={24} /> : <ChevronLeft size={24} />}
          </button>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <NavItem icon={<LayoutDashboard size={22} />} label="Home" isActive={activeTab === 'dashboard'} collapsed={isSidebarCollapsed} onClick={() => setActiveTab('dashboard')} />
          <NavItem icon={<Building size={22} />} label="Properties" isActive={activeTab === 'properties' || activeTab === 'property_edit' || activeTab === 'property_view'} collapsed={isSidebarCollapsed} onClick={() => setActiveTab('properties')} />
          <NavItem icon={<Bookmark size={22} />} label="Signature Safaris" isActive={activeTab === 'signature_safaris' || activeTab === 'safari_edit'} collapsed={isSidebarCollapsed} onClick={() => setActiveTab('signature_safaris')} />
          <NavItem icon={<Users size={22} />} label="Team" isActive={activeTab === 'team'} collapsed={isSidebarCollapsed} onClick={() => setActiveTab('team')} />
          <NavItem icon={<MessageSquare size={22} />} label="Booking Leads" isActive={activeTab === 'leads'} collapsed={isSidebarCollapsed} onClick={() => setActiveTab('leads')} />
          
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
                <NavItem icon={<ReceiptText size={18} />} label="Quotations" isActive={activeTab === 'quotations'} collapsed={isSidebarCollapsed} onClick={() => setActiveTab('quotations')} />
                <NavItem icon={<FileText size={18} />} label="Invoices" isActive={activeTab === 'invoices' || activeTab === 'invoice_editor'} collapsed={isSidebarCollapsed} onClick={() => setActiveTab('invoices')} />
                <NavItem icon={<CreditCard size={18} />} label="Payments" isActive={activeTab === 'payments'} collapsed={isSidebarCollapsed} onClick={() => setActiveTab('payments')} />
                <NavItem icon={<FileCheck size={18} />} label="Receipts" isActive={activeTab === 'receipts'} collapsed={isSidebarCollapsed} onClick={() => setActiveTab('receipts')} />
                <NavItem icon={<FileText size={18} />} label="Payment Vouchers" isActive={activeTab === 'payment_vouchers'} collapsed={isSidebarCollapsed} onClick={() => setActiveTab('payment_vouchers')} />
                <NavItem icon={<Wallet size={18} />} label="Supplier Vouchers" isActive={activeTab === 'disbursements'} collapsed={isSidebarCollapsed} onClick={() => setActiveTab('disbursements')} />
              </div>
            )}
          </div>

          <NavItem icon={<Wand2 size={22} />} label="Quick Costing" isActive={activeTab === 'calculator'} collapsed={isSidebarCollapsed} onClick={() => setActiveTab('calculator')} />
          
          {profile?.is_super_user && (
            <div className="pt-4 mt-4 border-t border-safari-800">
              <p className="px-3 mb-2 text-[10px] font-black uppercase text-safari-500 tracking-widest">Admin Oversight</p>
              <NavItem 
                icon={<Database size={22} className="text-amber-400" />} 
                label="Super Hub" 
                isActive={activeTab === 'super_hub'} 
                collapsed={isSidebarCollapsed} 
                onClick={() => setActiveTab('super_hub')} 
              />
            </div>
          )}
        </nav>

        <div className={`px-7 py-6 border-t border-safari-800 flex items-center gap-6 ${isSidebarCollapsed ? 'flex-col' : 'justify-start'}`}>
          <Tooltip content="Return to Planner">
            <button onClick={onClose} className="text-safari-400 hover:text-white transition-colors">
              <RefreshCw size={20} />
            </button>
          </Tooltip>
          
          <Tooltip content="Configuration Settings">
            <button 
              onClick={() => setActiveTab('settings')} 
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
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarCollapsed ? 'ml-20' : 'ml-72'} h-screen`}>
        <main className="flex-1 overflow-y-auto bg-gray-50 pb-20">
        {activeTab === 'dashboard' && (
          <div className="p-8 space-y-8 animate-fadeIn">
            <header>
               <h1 className="text-4xl font-bold text-safari-900">{profile?.is_super_user ? 'Network Intelligence' : 'Enterprise Overview'}</h1>
               <p className="text-safari-500 font-medium text-lg">
                 {profile?.is_super_user 
                   ? 'Global oversight of all companies, partners, and bookings.' 
                   : 'Central control for properties, leads, and finances.'}
               </p>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               <SummaryCard 
                 title={profile?.is_super_user ? "Global Inventory" : "My Inventory"} 
                 value={String(profile?.is_super_user ? lodges.length : lodges.filter(l => l.company_id === company?.id).length)} 
                 subtitle="Lodges & Camps" 
               />
               <SummaryCard 
                 title={profile?.is_super_user ? "Global Pipeline" : "Raw Leads"} 
                 value={String(leads.length)} 
                 subtitle={profile?.is_super_user ? "Active Opportunities" : "Inquiries Awaiting Costing"} 
               />
               <SummaryCard 
                 title="Network Revenue" 
                 value={`$${payments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}`} 
                 subtitle="Processed Payments" 
               />
               <SummaryCard 
                 title="Total Contracts" 
                 value={String(allBilledQuotes.length)} 
                 subtitle="Confirmed Bookings" 
               />
            </div>
          </div>
        )}

        {activeTab === 'super_hub' && (
          <SuperHubView 
            companies={companies}
            allProfiles={allProfiles}
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
              setActiveTab('property_edit');
            }}
            onDeleteCompany={async (id: string) => {
              if (!confirm("Remove this company? Note: This may fail if it has active data dependencies.")) return;
              try {
                const { error } = await supabase.from('companies').delete().eq('id', id);
                if (error) throw error;
                toast.success("Company removed.");
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
            onUpdateCompanyStatus={async (id: string, status: 'active' | 'suspended') => {
              try {
                const { error } = await supabase.from('companies').update({ status }).eq('id', id);
                if (error) throw error;
                toast.success(`Company ${status === 'active' ? 'activated' : 'suspended'}.`);
                fetchGlobalData();
              } catch (err: any) { toast.error(err.message); }
            }}
            onUpdateUserStatus={async (id: string, status: 'active' | 'suspended') => {
              try {
                const { error } = await supabase.from('profiles').update({ status }).eq('id', id);
                if (error) throw error;
                toast.success(`User ${status === 'active' ? 'activated' : 'suspended'}.`);
                fetchGlobalData();
              } catch (err: any) { toast.error(err.message); }
            }}
            onAddCompany={() => {
              setNewCompanyData({ name: '', slug: '', branding: DEFAULT_BRANDING });
              setIsAddCompanyOpen(true);
            }}
            onAddUser={() => {
              setNewUserData({ full_name: '', email: '', company_id: '', user_type: 'agency', status: 'active' });
              setIsAddUserOpen(true);
            }}
            onAddProperty={() => {
              setSelectedLodge(null);
              setActiveTab('property_edit');
            }}
          />
        )}

        {activeTab === 'properties' && (
          <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
            <header className="flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-bold text-safari-900">Property Ecosystem</h1>
                <p className="text-safari-500 font-medium">Manage your owned inventory and set custom rates for partner properties.</p>
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
                         const isOwner = lodge.company_id === company?.id;
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
              <div><h1 className="text-3xl font-bold text-safari-900">Signature Safaris</h1><p className="text-safari-500 font-medium">Hand-crafted master itineraries.</p></div>
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
                <p className="text-safari-500 font-medium">Control landing experience, brand identity, and business rules.</p>
              </div>
              <div className="flex items-center gap-1 p-1 bg-safari-50 rounded-xl border border-safari-100 self-start md:self-auto overflow-x-auto no-scrollbar">
                {[
                  { id: 'general', label: 'General', icon: <Monitor size={14} /> },
                  { id: 'visuals', label: 'Visuals', icon: <Palette size={14} /> },
                  { id: 'landing', label: 'Landing', icon: <LayoutDashboard size={14} /> },
                  { id: 'contact', label: 'Business', icon: <Building size={14} /> },
                  { id: 'data', label: 'Data', icon: <Plus size={14} /> },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSettingsTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
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
            </header>

            {activeSettingsTab === 'general' && (
              <div className="space-y-6 animate-fadeIn">
                <section className="bg-white rounded-2xl shadow-sm border border-safari-100 p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-lg font-bold text-safari-900 flex items-center gap-2">
                        <Monitor className="text-safari-500" size={20} />
                        Platform Identity
                      </h3>
                      <p className="text-sm text-safari-500 font-medium">Global brand markers and active status.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                    <div className="space-y-2">
                       <label className="block text-[10px] font-black uppercase text-safari-500 tracking-widest ml-1">Application Name</label>
                       <input 
                         type="text" 
                         className="w-full p-4 bg-safari-50 border border-safari-100 rounded-2xl font-bold text-lg text-safari-900 outline-none focus:ring-2 focus:ring-safari-500/20 shadow-sm" 
                         value={branding.appName || ''} 
                         onChange={(e) => setBranding({...branding, appName: e.target.value})}
                         placeholder="SafariPlanner.ai"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="block text-[10px] font-black uppercase text-safari-500 tracking-widest ml-1">Brand Tagline</label>
                       <input 
                         type="text" 
                         className="w-full p-4 bg-safari-50 border border-safari-100 rounded-2xl font-bold text-lg text-safari-900 outline-none focus:ring-2 focus:ring-safari-500/20 shadow-sm" 
                         value={branding.appTagline || ''} 
                         onChange={(e) => setBranding({...branding, appTagline: e.target.value})}
                         placeholder="Curation Meets Intelligence"
                       />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-6 bg-safari-50 rounded-2xl border border-safari-100 shadow-inner">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-safari-600 shadow-sm border border-safari-100">
                        <LayoutDashboard size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-safari-900">Marketing Landing Page</p>
                        <p className="text-xs text-safari-500 font-medium">Toggle the public-facing promotional experience.</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleToggleLanding(!isLandingEnabled)}
                      className={`w-14 h-8 rounded-full transition-all relative ${isLandingEnabled ? 'bg-safari-600' : 'bg-safari-200'}`}
                    >
                      <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-md ${isLandingEnabled ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>
                </section>

                <section className="bg-white rounded-2xl shadow-sm border border-safari-100 p-8">
                  <h3 className="text-sm font-black uppercase tracking-widest text-safari-400 mb-6 flex items-center gap-2 italic">
                    <Share2 size={14} /> Global Inquiry Trigger
                  </h3>
                  <div className="space-y-4">
                    <div className="p-6 bg-safari-50 rounded-2xl border border-safari-100">
                      <label className="block text-[10px] font-black uppercase text-safari-500 tracking-widest mb-3 ml-1">WhatsApp Integration (Intl. Format)</label>
                      <div className="flex gap-3">
                        <div className="flex items-center justify-center w-14 h-14 bg-white rounded-xl border border-safari-100 text-safari-600 shadow-sm">
                          <Phone size={24} />
                        </div>
                        <input 
                          type="text" 
                          className="flex-1 p-4 bg-white border border-safari-100 rounded-xl font-black text-xl text-safari-900 outline-none focus:ring-2 focus:ring-safari-500/20 shadow-sm transition-all" 
                          value={branding.whatsappNumber || ''} 
                          onChange={(e) => setBranding({...branding, whatsappNumber: e.target.value})}
                          placeholder="+254700000000"
                        />
                      </div>
                      <p className="text-[10px] text-safari-400 mt-3 ml-1 font-medium italic">* This number will be used for all "Talk to an Expert" buttons across the landing page and app.</p>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {activeSettingsTab === 'visuals' && (
              <div className="space-y-6 animate-fadeIn">
                <section className="bg-white rounded-2xl shadow-sm border border-safari-100 p-8">
                  <h3 className="text-lg font-bold text-safari-900 mb-8 flex items-center gap-2 italic">
                    <Palette className="text-safari-500" size={20} />
                    Brand Color System
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
                    <div className="space-y-4">
                       <label className="block text-[10px] font-black uppercase text-safari-500 tracking-widest ml-1">Primary Brand Color</label>
                       <div className="flex gap-4 p-4 bg-safari-50 rounded-2xl border border-safari-100 items-center">
                         <input 
                           type="color" 
                           className="w-16 h-16 rounded-xl cursor-pointer border-none p-0 outline-none shadow-sm hover:scale-105 transition-transform" 
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
                       <div className="flex gap-4 p-4 bg-safari-50 rounded-2xl border border-safari-100 items-center">
                         <input 
                           type="color" 
                           className="w-16 h-16 rounded-xl cursor-pointer border-none p-0 outline-none shadow-sm hover:scale-105 transition-transform" 
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
                          className={`p-5 rounded-2xl border transition-all text-left flex flex-col gap-4 group relative overflow-hidden ${
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

                <section className="bg-white rounded-2xl shadow-sm border border-safari-100 p-8">
                  <h3 className="text-lg font-bold text-safari-900 mb-8 flex items-center gap-2 italic">
                    <Type className="text-safari-500" size={20} />
                    Typography Scale
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {['title', 'body', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map((level) => (
                      <div key={level} className="p-5 bg-safari-50 rounded-2xl border border-safari-100 space-y-4 shadow-inner">
                        <p className="text-[10px] font-black uppercase text-safari-600 tracking-wider flex items-center gap-2">
                           {level === 'title' ? 'GLOBAL TITLE' : level === 'body' ? 'PARAGRAPH' : `${level.toUpperCase()} SCALE`}
                        </p>
                        <div className="space-y-3">
                          <select 
                            className="w-full p-3 bg-white border border-safari-100 rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-safari-500/20 shadow-sm"
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
                              className="w-full p-3 bg-white border border-safari-100 rounded-xl font-bold text-xs text-center shadow-sm"
                              value={(branding as any)[`${level}FontSize`] || ''}
                              onChange={(e) => setBranding({...branding, [`${level}FontSize`]: e.target.value})}
                              placeholder="Size"
                            />
                            <select 
                              className="w-full p-3 bg-white border border-safari-100 rounded-xl font-bold text-xs shadow-sm"
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
                              className="w-full p-3 bg-white border border-safari-100 rounded-xl font-bold text-xs text-center shadow-sm"
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

            {activeSettingsTab === 'landing' && (
              <div className="space-y-6 animate-fadeIn">
                <section className="bg-white rounded-2xl shadow-sm border border-safari-100 p-8">
                  <h3 className="text-lg font-bold text-safari-900 mb-8 flex items-center gap-2 italic">
                    <ImageIcon className="text-safari-500" size={20} />
                    Hero Experience
                  </h3>
                  <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="block text-[10px] font-black uppercase text-safari-500 tracking-widest ml-1">Hero Title</label>
                       <input 
                         type="text" 
                         className="w-full p-4 bg-safari-50 border border-safari-100 rounded-2xl font-bold text-lg text-safari-900 outline-none focus:ring-2 focus:ring-safari-500/20" 
                         value={branding.heroTitle || ''} 
                         onChange={(e) => setBranding({...branding, heroTitle: e.target.value})}
                         placeholder="The Art of the Safari, Decoded."
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="block text-[10px] font-black uppercase text-safari-500 tracking-widest ml-1">Description</label>
                       <textarea 
                         className="w-full p-4 bg-safari-50 border border-safari-100 rounded-2xl font-medium text-safari-800 outline-none focus:ring-2 focus:ring-safari-500/20 h-32 resize-none" 
                         value={branding.heroDescription || ''} 
                         onChange={(e) => setBranding({...branding, heroDescription: e.target.value})}
                         placeholder="Engage your visitors with a powerful brand story..."
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="block text-[10px] font-black uppercase text-safari-500 tracking-widest ml-1">Background Image URL</label>
                       <div className="flex gap-4 p-2 bg-safari-50 rounded-2xl border border-safari-100 items-center">
                         <div className="w-16 h-16 rounded-xl overflow-hidden bg-white border border-safari-100 shadow-sm flex-shrink-0">
                           <img src={branding.heroImage} alt="Hero" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                         </div>
                         <input 
                           type="text" 
                           className="flex-1 bg-transparent font-medium text-xs text-safari-600 outline-none p-2" 
                           value={branding.heroImage || ''} 
                           onChange={(e) => setBranding({...branding, heroImage: e.target.value})}
                           placeholder="https://images.unsplash.com/..."
                         />
                       </div>
                    </div>
                  </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <section className="bg-white rounded-2xl shadow-sm border border-safari-100 p-8 space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-bold text-safari-900 flex items-center gap-2 italic">
                        <HelpCircle className="text-safari-500" size={20} />
                        FAQ Management
                      </h3>
                      <button 
                        onClick={() => setBranding({...branding, faqs: [...(branding.faqs || []), { q: '', a: '' }]})}
                        className="p-2 bg-safari-900 text-white rounded-xl hover:bg-black transition-all shadow-md"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 no-scrollbar">
                      {(branding.faqs || []).map((faq, idx) => (
                        <div key={idx} className="p-6 bg-safari-50 rounded-2xl border border-safari-100 space-y-4 relative group animate-fadeIn">
                          <button 
                            onClick={() => {
                              const newFaqs = [...(branding.faqs || [])];
                              newFaqs.splice(idx, 1);
                              setBranding({...branding, faqs: newFaqs});
                            }}
                            className="absolute top-4 right-4 text-red-400 opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                          >
                            <Trash2 size={16} />
                          </button>
                          <input 
                            className="w-full bg-white p-3 rounded-xl border border-safari-100 font-bold text-sm outline-none shadow-sm"
                            value={faq.q}
                            onChange={(e) => {
                              const newFaqs = [...(branding.faqs || [])];
                              newFaqs[idx] = { ...newFaqs[idx], q: e.target.value };
                              setBranding({...branding, faqs: newFaqs});
                            }}
                            placeholder="Question"
                          />
                          <textarea 
                            className="w-full bg-white p-3 rounded-xl border border-safari-100 font-medium text-xs outline-none shadow-sm h-24 resize-none"
                            value={faq.a}
                            onChange={(e) => {
                              const newFaqs = [...(branding.faqs || [])];
                              newFaqs[idx] = { ...newFaqs[idx], a: e.target.value };
                              setBranding({...branding, faqs: newFaqs});
                            }}
                            placeholder="Answer"
                          />
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="bg-white rounded-2xl shadow-sm border border-safari-100 p-8 space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-bold text-safari-900 flex items-center gap-2 italic">
                        <Quote className="text-safari-500" size={20} />
                        Social Proof
                      </h3>
                      <button 
                        onClick={() => setBranding({...branding, testimonials: [...(branding.testimonials || []), { name: '', role: '', text: '', stars: 5 }]})}
                        className="p-2 bg-safari-900 text-white rounded-xl hover:bg-black transition-all shadow-md"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 no-scrollbar">
                      {(branding.testimonials || []).map((t, idx) => (
                        <div key={idx} className="p-6 bg-safari-50 rounded-2xl border border-safari-100 space-y-4 relative group animate-fadeIn">
                          <button 
                            onClick={() => {
                              const newT = [...(branding.testimonials || [])];
                              newT.splice(idx, 1);
                              setBranding({...branding, testimonials: newT});
                            }}
                            className="absolute top-4 right-4 text-red-400 opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                          >
                            <Trash2 size={16} />
                          </button>
                          <div className="grid grid-cols-2 gap-4">
                            <input 
                              className="w-full bg-white p-3 rounded-xl border border-safari-100 font-bold text-sm outline-none shadow-sm"
                              value={t.name}
                              onChange={(e) => {
                                const newT = [...(branding.testimonials || [])];
                                newT[idx] = { ...newT[idx], name: e.target.value };
                                setBranding({...branding, testimonials: newT});
                              }}
                              placeholder="Client Name"
                            />
                            <input 
                              className="w-full bg-white p-3 rounded-xl border border-safari-100 font-bold text-sm outline-none shadow-sm"
                              value={t.role}
                              onChange={(e) => {
                                const newT = [...(branding.testimonials || [])];
                                newT[idx] = { ...newT[idx], role: e.target.value };
                                setBranding({...branding, testimonials: newT});
                              }}
                              placeholder="Client Role"
                            />
                          </div>
                          <textarea 
                            className="w-full bg-white p-3 rounded-xl border border-safari-100 font-medium text-xs outline-none shadow-sm h-24 resize-none italic"
                            value={t.text}
                            onChange={(e) => {
                              const newT = [...(branding.testimonials || [])];
                              newT[idx] = { ...newT[idx], text: e.target.value };
                              setBranding({...branding, testimonials: newT});
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

            {activeSettingsTab === 'contact' && (
              <div className="space-y-6 animate-fadeIn">
                <section className="bg-white rounded-2xl shadow-sm border border-safari-100 p-8">
                  <h3 className="text-lg font-bold text-safari-900 mb-8 flex items-center gap-2 italic">
                    <Building className="text-safari-500" size={20} />
                    Corporate & Financial Configuration
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                          <div className="space-y-2">
                       <label className="block text-[10px] font-black uppercase text-safari-500 tracking-widest ml-1">Legal Company/Property Name</label>
                       <input 
                         type="text" 
                         className="w-full p-4 bg-safari-50 border border-safari-100 rounded-2xl font-bold text-safari-900 outline-none focus:ring-2 focus:ring-safari-500/20 shadow-sm" 
                         value={branding.agencyName || ''} 
                         onChange={(e) => setBranding({...branding, agencyName: e.target.value})}
                         placeholder="Legal Entity Name"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="block text-[10px] font-black uppercase text-safari-500 tracking-widest ml-1">Support Email</label>
                       <input 
                         type="email" 
                         className="w-full p-4 bg-safari-50 border border-safari-100 rounded-2xl font-bold text-safari-900 outline-none focus:ring-2 focus:ring-safari-500/20 shadow-sm" 
                         value={branding.contactEmail || ''} 
                         onChange={(e) => setBranding({...branding, contactEmail: e.target.value})}
                         placeholder="support@agency.com"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="block text-[10px] font-black uppercase text-safari-500 tracking-widest ml-1">Finance Email (Billing CC)</label>
                       <input 
                         type="email" 
                         className="w-full p-4 bg-safari-50 border border-safari-100 rounded-2xl font-bold text-safari-900 outline-none focus:ring-2 focus:ring-safari-500/20 shadow-sm" 
                         value={branding.financeEmail || ''} 
                         onChange={(e) => setBranding({...branding, financeEmail: e.target.value})}
                         placeholder="finance@agency.com"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="block text-[10px] font-black uppercase text-safari-500 tracking-widest ml-1">Office Contact Phone</label>
                       <input 
                         type="text" 
                         className="w-full p-4 bg-safari-50 border border-safari-100 rounded-2xl font-bold text-safari-900 outline-none focus:ring-2 focus:ring-safari-500/20 shadow-sm" 
                         value={branding.contactPhone || ''} 
                         onChange={(e) => setBranding({...branding, contactPhone: e.target.value})}
                         placeholder="Local or International format"
                       />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                       <label className="block text-[10px] font-black uppercase text-safari-500 tracking-widest ml-1">Physical Address & Corporate Bio</label>
                       <textarea 
                         className="w-full p-4 bg-safari-50 border border-safari-100 rounded-2xl font-medium text-safari-800 outline-none focus:ring-2 focus:ring-safari-500/20 h-24 resize-none shadow-sm" 
                         value={branding.contactAddress || ''} 
                         onChange={(e) => setBranding({...branding, contactAddress: e.target.value})}
                         placeholder="Headquarters address and brief agency description..."
                       />
                    </div>
                  </div>
                  <div className="pt-8 border-t border-safari-50">
                    <h4 className="text-[10px] font-black uppercase text-safari-400 mb-6 tracking-widest">Financial Defaults</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                         <label className="block text-[10px] font-black uppercase text-safari-500 tracking-widest ml-1">Global Markup (%)</label>
                         <input 
                           type="number" 
                           className="w-full p-4 bg-safari-50 border border-safari-100 rounded-2xl font-bold text-xl text-safari-900 outline-none focus:ring-2 focus:ring-safari-500/20 shadow-sm" 
                           value={branding.defaultMarkup || 0}
                           onChange={(e) => setBranding({...branding, defaultMarkup: Number(e.target.value)})}
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="block text-[10px] font-black uppercase text-safari-500 tracking-widest ml-1">Standard Tax/VAT (%)</label>
                         <input 
                           type="number" 
                           className="w-full p-4 bg-safari-50 border border-safari-100 rounded-2xl font-bold text-xl text-safari-900 outline-none focus:ring-2 focus:ring-safari-500/20 shadow-sm" 
                           value={branding.defaultTax || 0}
                           onChange={(e) => setBranding({...branding, defaultTax: Number(e.target.value)})}
                         />
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {activeSettingsTab === 'data' && (
              <div className="space-y-6 animate-fadeIn">
                <section className="bg-white rounded-2xl shadow-sm border border-safari-100 p-8">
                  <h3 className="text-lg font-bold text-safari-900 mb-8 flex items-center gap-2 italic">
                    <Database className="text-safari-500" size={20} />
                    Raw Data Management
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="block text-[10px] font-black uppercase text-safari-500 tracking-widest ml-1">Park Fees (JSON)</label>
                      <textarea 
                        className="w-full p-4 bg-safari-50 border border-safari-100 rounded-2xl font-mono text-xs h-[400px] outline-none focus:ring-2 focus:ring-safari-500/20 shadow-inner no-scrollbar"
                        value={JSON.stringify(branding.parkFees || [], null, 2)}
                        onChange={(e) => {
                          try {
                            const parsed = JSON.parse(e.target.value);
                            setBranding({ ...branding, parkFees: parsed });
                          } catch { /* invalid json */ }
                        }}
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="block text-[10px] font-black uppercase text-safari-500 tracking-widest ml-1">Transport Rates (JSON)</label>
                      <textarea 
                        className="w-full p-4 bg-safari-50 border border-safari-100 rounded-2xl font-mono text-xs h-[400px] outline-none focus:ring-2 focus:ring-safari-500/20 shadow-inner no-scrollbar"
                        value={JSON.stringify(branding.transportRates || [], null, 2)}
                        onChange={(e) => {
                          try {
                            const parsed = JSON.parse(e.target.value);
                            setBranding({ ...branding, transportRates: parsed });
                          } catch { /* invalid json */ }
                        }}
                      />
                    </div>
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
                <h1 className="text-3xl font-bold text-safari-900">Safari Specialists</h1>
                <p className="text-safari-500 font-medium">Manage your dedicated team members and specialists.</p>
              </div>
              <button 
                onClick={() => {
                  setSelectedMember(null);
                  setMemberFormData({ name: '', role: '', bio: '', photo_url: '', email: '', phone: '', system_role: 'staff' });
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
                          setSelectedMember(member);
                          setMemberFormData({
                            name: member.name,
                            role: member.role,
                            bio: member.bio,
                            photo_url: member.photo_url || '',
                            email: member.email || '',
                            phone: member.phone || '',
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
        {activeTab === 'payments' && <div className="p-8"><PaymentModule pendingInvoices={allBilledQuotes} payments={payments} onRecordPayment={handleRecordPayment} onBack={() => setActiveTab('dashboard')} /></div>}
        {activeTab === 'receipts' && <div className="p-8"><ReceiptModule payments={payments} branding={branding} onBack={() => setActiveTab('dashboard')} /></div>}
        {activeTab === 'payment_vouchers' && <div className="p-8"><PaymentVoucherModule payments={payments} branding={branding} onBack={() => setActiveTab('dashboard')} /></div>}
        {/* Fixed confirmedQuotes error by using allBilledQuotes */}
        {activeTab === 'disbursements' && <div className="p-8"><DisbursementModule itineraries={allBilledQuotes} branding={branding} onBack={() => setActiveTab('dashboard')} /></div>}
        {activeTab === 'calculator' && <div className="p-8"><CostingModule itinerary={DUMMY_ITINERARY} formData={DUMMY_FORM_DATA} lodges={lodges} customRates={customRates} branding={branding} onBack={() => setActiveTab('dashboard')} initialMode="calculator" /></div>}
        {activeTab === 'property_edit' && (
          <div className="p-8">
            <LodgeEditor 
              lodge={selectedLodge} 
              customRate={selectedLodge ? customRates.find(r => r.lodge_id === selectedLodge.id) : null}
              companies={companies}
              onClose={() => setActiveTab('properties')} 
              onSave={() => {
                fetchLodges();
                fetchCustomRates();
              }} 
            />
          </div>
        )}
        {activeTab === 'safari_edit' && <div className="p-8"><MasterItineraryEditor safari={selectedMaster} lodges={lodges} teamMembers={teamMembers} onClose={() => setActiveTab('signature_safaris')} onSave={fetchMasterItineraries} /></div>}
        {activeTab === 'property_view' && selectedLodge && (
          <div className="p-8">
            <PropertyDetailView 
              lodge={selectedLodge} 
              customRate={customRates.find(r => r.lodge_id === selectedLodge.id)}
              onBack={() => setActiveTab('properties')} 
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
              onBack={() => setActiveTab(navigationSource)} 
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
              onBack={() => setActiveTab(navigationSource)} 
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
              onReset={() => setActiveTab(navigationSource)} 
              onEdit={() => {
                if (viewingItinerary.type === 'master') {
                  setActiveTab('safari_edit');
                } else if (viewingItinerary.type === 'lead') {
                  setActiveTab('costing');
                } else {
                  setActiveTab(navigationSource);
                }
              }} 
              onViewLodge={handleViewLodgeDetails}
              onBackToHistory={() => setActiveTab(navigationSource)}
              isFromAdmin={true}
              masterId={viewingItinerary.type === 'master' ? viewingItinerary.id : undefined}
              itinId={viewingItinerary.type === 'lead' ? viewingItinerary.id : undefined}
            />
          </div>
        )}
      </main>
      
      {/* Fixed Footer for Main Content */}
      <footer className="bg-white border-t border-safari-200 p-4 text-center text-[10px] uppercase tracking-widest text-safari-400 font-bold shrink-0 z-30">
        © {new Date().getFullYear()} SafariPlanner.ai • Partner Dashboard
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
  lodges, 
  leads,
  masterItineraries,
  onAssignLodge, 
  onEditLodge,
  onDeleteCompany,
  onDeleteUser,
  onDeleteProperty,
  onDeleteSafari,
  onDeleteLead,
  onUpdateCompanyStatus,
  onUpdateUserStatus,
  onAddCompany,
  onAddUser,
  onAddProperty
}: any) => {
  const [activeSubTab, setActiveSubTab] = useState<'companies' | 'users' | 'inventory' | 'leads' | 'safaris'>('companies');

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
        </div>
      </div>

      <div className="flex bg-safari-100 p-1 rounded-xl border border-safari-200 overflow-x-auto no-scrollbar w-full">
        {[
          { id: 'companies', label: 'Companies', icon: <Building size={16} /> },
          { id: 'users', label: 'Global Users', icon: <Users size={16} /> },
          { id: 'inventory', label: 'Inventory', icon: <Compass size={16} /> },
          { id: 'leads', label: 'All Leads', icon: <MessageSquare size={16} /> },
          { id: 'safaris', label: 'All Safaris', icon: <Bookmark size={16} /> }
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
                        <p className="font-black text-safari-900 text-lg tracking-tight">{c.name}</p>
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
                  <td className="px-8 py-6 text-right relative">
                    <div className="flex justify-end items-center gap-3 relative z-10 pointer-events-auto">
                      <div className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-tighter ${
                        c.status === 'suspended' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                      }`}>
                        {c.status || 'active'}
                      </div>
                      <div className="flex gap-2 relative z-20">
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onUpdateCompanyStatus(c.id, c.status === 'suspended' ? 'active' : 'suspended');
                          }}
                          className={`p-3 rounded-xl transition-all shadow-sm border flex items-center justify-center min-w-[40px] cursor-pointer pointer-events-auto relative z-30 ${
                            c.status === 'suspended' 
                            ? 'bg-green-50 text-green-600 border-green-100 hover:bg-green-600 hover:text-white' 
                            : 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-600 hover:text-white'
                          }`}
                          title={c.status === 'suspended' ? 'Activate Company' : 'Suspend Company'}
                        >
                          {c.status === 'suspended' ? <ShieldCheck size={18} /> : <ShieldAlert size={18} />}
                        </button>
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onDeleteCompany(c.id);
                          }}
                          className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm border border-red-100 flex items-center justify-center min-w-[40px] cursor-pointer pointer-events-auto relative z-30"
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
              {allProfiles.map((p: any) => {
                const userCompany = companies.find((c: any) => c.id === p.company_id);
                return (
                  <tr key={p.id} className="hover:bg-safari-50/50 transition-colors">
                    <td className="px-8 py-6">
                      <p className="font-black text-safari-900">{p.full_name}</p>
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
                          <div className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-tighter ${
                            p.status === 'suspended' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                          }`}>
                            {p.status || 'active'}
                          </div>
                          <div className="flex gap-2 relative z-20">
                             <button 
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onUpdateUserStatus(p.id, p.status === 'suspended' ? 'active' : 'suspended');
                              }}
                              className={`p-3 rounded-xl transition-all shadow-sm border flex items-center justify-center min-w-[40px] cursor-pointer pointer-events-auto relative z-30 ${
                                p.status === 'suspended' 
                                ? 'bg-green-50 text-green-600 border-green-100 hover:bg-green-600 hover:text-white' 
                                : 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-600 hover:text-white'
                              }`}
                              title={p.status === 'suspended' ? 'Activate User' : 'Suspend User'}
                            >
                              {p.status === 'suspended' ? <ShieldCheck size={18} /> : <ShieldAlert size={18} />}
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
              })}
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

const SummaryCard = ({ title, value, subtitle }: any) => (
  <Tooltip content={`${title}: ${subtitle}`} side="top" align="center">
    <div className="bg-white p-6 rounded-xl shadow-sm border border-safari-100">
      <p className="text-[10px] font-black uppercase tracking-widest text-safari-400 mb-2">{title}</p>
      <p className="text-4xl font-black text-safari-900 tracking-tighter mb-1">{value}</p>
      <p className="text-xs font-medium text-safari-500">{subtitle}</p>
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
              <tr><th className="px-6 py-4 text-[10px] font-bold uppercase text-safari-400">Client</th><th className="px-6 py-4 text-[10px] font-bold uppercase text-safari-400">Safari</th><th className="px-6 py-4 text-[10px] font-bold uppercase text-safari-400 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-safari-50">
              {leads.map((l: any) => (
                <tr key={l.id} className="hover:bg-safari-50/30 group">
                  <td className="px-6 py-4"><p className="font-bold text-safari-900">{l.customer_name}</p><span className="text-xs text-safari-500">{l.customer_email}</span></td>
                  <td className="px-6 py-4"><p className="text-sm font-bold text-safari-600 truncate max-w-xs">{l.trip_title}</p></td>
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-scaleIn">
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
