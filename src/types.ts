
export enum BudgetTier {
  Budget = 'Budget (Camping / Basic Lodges)',
  MidRange = 'Mid-Range (Comfort Lodges / Tented Camps)',
  Luxury = 'Luxury (High-end Lodges / Fly-in Safari)'
}

export enum TransportType {
  LandCruiser = '4x4 Land Cruiser',
  FlightRoad = 'Flight + Road Transfers',
  OverlandTruck = 'Overland Truck',
  Train = 'Train (e.g., SGR)',
  FlyIn = 'Fly-in Safari Only'
}

export enum PropertyType {
  Lodge = 'Lodge',
  TentedCamp = 'Tented Camp',
  LuxuryCamp = 'Luxury Camp',
  Hotel = 'Hotel',
  Villa = 'Private Villa',
  Campsite = 'Campsite'
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  branding?: BrandingConfig;
  proficiencyScore?: number; // 1-100 rating
  created_at?: string;
  updated_at?: string;
}

export interface Profile {
  id: string; // matches auth.uid()
  company_id?: string;
  full_name: string;
  email: string;
  role?: 'admin' | 'staff';
  is_super_user?: boolean;
  user_type: 'agency' | 'user' | 'provider';
  created_at?: string;
  updated_at?: string;
}

export interface PartnerLogo {
  id: string;
  name: string;
  logoUrl: string;
  websiteUrl?: string;
}

export interface BrandingConfig {
  appName: string;
  appTagline: string;
  primaryColor: string;
  secondaryColor: string;
  titleFont: string;
  bodyFont: string;
  titleFontSize: string;
  bodyFontSize: string;
  titleFontWeight: string;
  bodyFontWeight: string;
  titleLetterSpacing: string;
  bodyLineHeight: string;
  h1Font?: string;
  h1FontSize?: string;
  h1FontWeight?: string;
  h1LetterSpacing?: string;
  h2Font?: string;
  h2FontSize?: string;
  h2FontWeight?: string;
  h2LetterSpacing?: string;
  h3Font?: string;
  h3FontSize?: string;
  h3FontWeight?: string;
  h3LetterSpacing?: string;
  h4Font?: string;
  h4FontSize?: string;
  h4FontWeight?: string;
  h4LetterSpacing?: string;
  h5Font?: string;
  h5FontSize?: string;
  h5FontWeight?: string;
  h5LetterSpacing?: string;
  h6Font?: string;
  h6FontSize?: string;
  h6FontWeight?: string;
  h6LetterSpacing?: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  whatsappNumber: string;
  heroTitle?: string;
  heroDescription?: string;
  heroImage?: string;
  faqs?: { q: string; a: string }[];
  testimonials?: { name: string; role: string; text: string; stars: number }[];
  contactEmail?: string;
  contactPhone?: string;
  contactAddress?: string;
  agencyName?: string;
  agencyDescription?: string;
  agencyLogo?: string;
  establishedYear?: string;
  statistics?: { label: string; value: string; iconType: 'heart' | 'globe' | 'shield' | 'award' | 'users' | 'star' }[];
  socialLinks?: { platform: string; url: string }[];
  globalPartners?: PartnerLogo[];
  parkFees?: { 
    id: string;
    park: string; 
    keywords: string[]; 
    citizenAdult: number;
    citizenChild: number;
    residentAdult: number;
    residentChild: number;
    nonResidentAdult: number;
    nonResidentChild: number;
    currency: 'USD' | 'KES';
  }[];
  kesToUsdRate?: number;
  transportRates?: { type: string; dailyRate: number }[];
  defaultMarkup?: number;
  defaultTax?: number;
  financeEmail?: string;
  formOptions?: {
    countries?: string[];
    destinationsByCountry?: Record<string, string[]>;
    activities?: string[];
    accommodationTypes?: string[];
  };
  paymentGateways?: {
    stripe?: {
      enabled: boolean;
      publicKey: string;
      secretKey: string;
      webhookSecret: string;
    };
    paypal?: {
      enabled: boolean;
      clientId: string;
      clientSecret: string;
      ipnUrl: string;
    };
    pesapal?: {
      enabled: boolean;
      consumerKey: string;
      consumerSecret: string;
      ipnUrl: string;
    };
  };
}

export interface Season {
  id: string;
  name: string;
  startMonth: number; // 1-12
  startDay: number;
  endMonth: number;
  endDay: number;
}

export interface SeasonalRate {
  seasonId: string;
  adultPrice: number;
  youngAdultPrice: number;
  childPrice: number;
}

export interface UnitCategory {
  id: string;
  name: string;
  total_units: number;
  max_occupancy: number;
  seasonal_rates: SeasonalRate[];
  // Legacy support
  price_per_night?: number;
}

export interface Lodge {
  id: string;
  company_id: string;
  name: string;
  location: string; 
  tier: BudgetTier;
  property_type: PropertyType;
  description: string;
  facilities: string[];
  amenities: string[];
  activities: string[];
  seasons: Season[];
  unit_categories: UnitCategory[];
  images: string[];
  show_pricing?: boolean;
  // Legacy fields
  price_per_night?: number;
  number_of_units?: number;
  max_occupancy?: number;
}

export interface LodgeCustomRate {
  id: string;
  lodge_id: string;
  company_id: string;
  unit_categories: UnitCategory[];
  created_at?: string;
  updated_at?: string;
}

export interface SafariFormData {
  name: string;
  email: string;
  country: string;
  adults: number;
  youngAdults: number;
  children: number;
  startDate: string;
  durationDays: number;
  destinations: string[];
  customDestinations: string;
  budget: BudgetTier;
  travelerStatus?: 'citizen' | 'resident' | 'non-resident';
  activities: string[];
  preferredAccommodations: string[];
  otherAccommodations: string;
  transport: TransportType;
  pickupLocation: string;
  dropoffLocation: string;
  dietaryRequirements: string;
  specialOccasions: string;
}

export interface DayItinerary {
  day: number;
  dayLabel?: string; // Supports "1-2", "3-5" ranges
  title: string;
  description: string;
  morningActivity: string;
  afternoonActivity: string;
  accommodation: string;
  driveTime: string;
  meals: string;
  isSectionBreak?: boolean;
  sectionImage?: string;
  sectionTitle?: string;
  sectionDescription?: string;
}

export interface TeamMember {
  id: string;
  company_id: string;
  name: string;
  role: string;
  bio: string;
  photo_url: string;
  email: string;
  phone: string;
  is_public?: boolean;
  created_at?: string;
}

export interface GeneratedItinerary {
  id?: string;
  company_id?: string;
  assigned_company_id?: string; // Routing for lead assignment
  tripTitle: string;
  summary: string;
  totalEstimatedCost: string;
  highlights: string[];
  schedule: DayItinerary[];
  gallery?: string[];
  heroImage?: string;
  includes?: string[];
  excludes?: string[];
  specialist_id?: string;
}

// Costing Module Types
export type CostingItemType = 'Accommodation' | 'Activity' | 'Transport' | 'Extra' | 'Fee';

export interface CostingLineItem {
  id: string;
  type: CostingItemType;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  isManual?: boolean;
  dayRef?: number; // Which day of the itinerary this belongs to
}

export interface CostingReport {
  id: string;
  itineraryId?: string;
  invoiceNumber?: string;
  items: CostingLineItem[];
  markupPercentage: number;
  taxPercentage: number;
  subtotal: number;
  markupAmount: number;
  taxAmount: number;
  total: number;
}

export type InvoiceStatus = 'draft' | 'sent' | 'partially_paid' | 'paid' | 'cancelled' | 'confirmed' | 'quoted';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  itineraryId: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  notes?: string;
  terms?: string;
}

export interface Payment {
  id: string;
  company_id: string;
  itineraryId: string;
  amount: number;
  date: string;
  method: string;
  reference: string;
  customerName: string;
  tripTitle: string;
}
