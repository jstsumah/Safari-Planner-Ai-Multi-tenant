-- Multi-tenant Safari Planner Database Schema

-- Helper function to check if current user is super user
CREATE OR REPLACE FUNCTION is_super_user()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(is_super_user, false) OR (email = 'innovateitsolutions4@gmail.com') 
  FROM profiles 
  WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Helper function to get current company_id
CREATE OR REPLACE FUNCTION get_my_company()
RETURNS UUID AS $$
  -- SECURITY DEFINER is used to bypass RLS recursion on the profiles table
  SELECT company_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Companies Table
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    branding JSONB,
    is_landing_enabled BOOLEAN DEFAULT true,
    status TEXT DEFAULT 'active',
    subscription_status TEXT DEFAULT 'trial', -- trial, active, inactive
    trial_ends_at TIMESTAMPTZ,
    subscription_tier TEXT DEFAULT 'starter', -- starter, pro
    proficiency_score INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Profiles Table (Users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT UNIQUE NOT NULL,
    user_type TEXT DEFAULT 'agency', -- agency, user, provider
    role TEXT DEFAULT 'staff', -- admin, staff
    is_super_user BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Lodges Table
CREATE TABLE IF NOT EXISTS lodges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    location TEXT,
    tier TEXT,
    property_type TEXT,
    description TEXT,
    images TEXT[],
    facilities TEXT[],
    amenities TEXT[],
    activities TEXT[],
    seasons JSONB,
    unit_categories JSONB,
    show_pricing BOOLEAN DEFAULT true,
    rates JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Master Itineraries Table
CREATE TABLE IF NOT EXISTS master_itineraries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    trip_title TEXT,
    description TEXT,
    itinerary_data JSONB,
    total_price DECIMAL,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Itineraries Table (Leads & Quotations)
CREATE TABLE IF NOT EXISTS itineraries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    trip_title TEXT,
    form_data JSONB,
    itinerary_data JSONB,
    costing_report JSONB,
    status TEXT DEFAULT 'lead',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Payments Table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    itinerary_id UUID REFERENCES itineraries(id) ON DELETE CASCADE,
    amount DECIMAL NOT NULL,
    date TIMESTAMPTZ DEFAULT now(),
    method TEXT,
    reference TEXT,
    customer_name TEXT,
    trip_title TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Agency Config Table (Now partly replaced by companies.branding, but kept for other keys)
CREATE TABLE IF NOT EXISTS agency_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    value JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(company_id, key)
);

-- Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for Reviews
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Ensure all companies have active status
UPDATE companies SET status = 'active' WHERE status IS NULL;
CREATE POLICY "Public Insert Reviews" ON reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Super User Global Access - Reviews" ON reviews FOR ALL USING (is_super_user());
CREATE POLICY "Admins can manage own reviews" ON reviews FOR ALL USING (company_id = get_my_company());

-- Gallery Images Table
CREATE TABLE IF NOT EXISTS gallery_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    filename TEXT,
    bucket TEXT DEFAULT 'gallery',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Team Members Table
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    bio TEXT,
    photo_url TEXT,
    user_type TEXT DEFAULT 'agency',
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Park Fees Table
CREATE TABLE IF NOT EXISTS park_fees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    keywords TEXT[] DEFAULT '{}',
    adult_rate_usd DECIMAL NOT NULL DEFAULT 0,
    child_rate_usd DECIMAL NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Global Activities Catalog
CREATE TABLE IF NOT EXISTS global_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    category TEXT,
    description TEXT,
    base_price_usd DECIMAL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Custom Rates Table (Company-specific pricing overrides)
CREATE TABLE IF NOT EXISTS lodge_custom_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lodge_id UUID REFERENCES lodges(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    unit_categories JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(lodge_id, company_id)
);

-- Enable Row Level Security
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lodges ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE lodge_custom_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE park_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Super User Global Access (ALL)
CREATE POLICY "Super User Global Access - Companies" ON companies FOR ALL USING (is_super_user());
CREATE POLICY "Super User Global Access - Profiles" ON profiles FOR ALL USING (is_super_user());
CREATE POLICY "Super User Global Access - Lodges" ON lodges FOR ALL USING (is_super_user());
CREATE POLICY "Super User Global Access - Master Itineraries" ON master_itineraries FOR ALL USING (is_super_user());
CREATE POLICY "Super User Global Access - Itineraries" ON itineraries FOR ALL USING (is_super_user());
CREATE POLICY "Super User Global Access - Payments" ON payments FOR ALL USING (is_super_user());
CREATE POLICY "Super User Global Access - Agency Config" ON agency_config FOR ALL USING (is_super_user());
CREATE POLICY "Super User Global Access - Gallery Images" ON gallery_images FOR ALL USING (is_super_user());
CREATE POLICY "Admins can manage team members of their company" ON team_members FOR ALL USING (company_id = get_my_company()) WITH CHECK (company_id = get_my_company());
CREATE POLICY "Super admins can manage all team members" ON team_members FOR ALL USING (is_super_user()) WITH CHECK (is_super_user());
CREATE POLICY "Super User Global Access - Custom Rates" ON lodge_custom_rates FOR ALL USING (is_super_user());
CREATE POLICY "Super User Global Access - Park Fees" ON park_fees FOR ALL USING (is_super_user());
CREATE POLICY "Super User Global Access - Activities" ON global_activities FOR ALL USING (is_super_user());

-- RPC to check if email exists (for onboarding flow)
CREATE OR REPLACE FUNCTION public.check_email_exists(email_to_check TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM profiles WHERE LOWER(email) = LOWER(email_to_check));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Companies: Public Read, Authenticated Management
CREATE POLICY "Public Read Companies" ON companies FOR SELECT USING (true);
CREATE POLICY "Admins can update their own company" ON companies FOR UPDATE USING (id = get_my_company());
CREATE POLICY "Users can insert companies" ON companies FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Profiles: Access to shared company profiles
CREATE POLICY "Users can view profiles in their company" ON profiles FOR SELECT USING (company_id = get_my_company());
CREATE POLICY "Users can manage their own profile" ON profiles FOR ALL USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Lodges
CREATE POLICY "Public Read Lodges" ON lodges FOR SELECT USING (true);
CREATE POLICY "Company Data Isolation - Lodges" ON lodges FOR ALL USING (company_id = get_my_company());

-- Master Itineraries
CREATE POLICY "Public Read Master Itineraries" ON master_itineraries FOR SELECT USING (true);
CREATE POLICY "Company Data Isolation - Master Itineraries" ON master_itineraries FOR ALL USING (company_id = get_my_company());

-- Itineraries
CREATE POLICY "Public Read Itineraries" ON itineraries FOR SELECT USING (true);
CREATE POLICY "Company Data Isolation - Itineraries" ON itineraries FOR ALL USING (company_id = get_my_company());

-- Team Members
CREATE POLICY "Users can manage their own team member entry" ON team_members FOR UPDATE USING (LOWER(email) = LOWER(auth.jwt() ->> 'email'));
CREATE POLICY "Public Read Team Members" ON team_members FOR SELECT USING (true);

-- Reviews
CREATE POLICY "Public Read Reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Public Insert Reviews" ON reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage own reviews" ON reviews FOR ALL USING (company_id = get_my_company());

-- Payments
CREATE POLICY "Public Read Payments" ON payments FOR SELECT USING (true);
CREATE POLICY "Company Data Isolation - Payments" ON payments FOR ALL USING (company_id = get_my_company());

-- Agency Config
CREATE POLICY "Public Read Agency Config" ON agency_config FOR SELECT USING (true);
CREATE POLICY "Company Data Isolation - Agency Config" ON agency_config FOR ALL USING (company_id = get_my_company());

-- Gallery Images
CREATE POLICY "Public Read Gallery Images" ON gallery_images FOR SELECT USING (true);
CREATE POLICY "Company Data Isolation - Gallery Images" ON gallery_images FOR ALL USING (company_id = get_my_company());

-- Custom Rates Isolation
CREATE POLICY "Users can view company custom rates" ON lodge_custom_rates FOR SELECT USING (company_id = get_my_company());
CREATE POLICY "Users can manage company custom rates" ON lodge_custom_rates FOR ALL USING (company_id = get_my_company());

-- Global Catalog Tables
CREATE POLICY "Public Read Park Fees" ON park_fees FOR SELECT USING (true);
CREATE POLICY "Public Read Activities" ON global_activities FOR SELECT USING (true);


-- --------------------------------------------------------------------------------------
-- STORAGE BUCKETS & POLICIES
-- NOTE: Please ensure you run these commands in the Supabase SQL Editor 
-- to allow files to be uploaded to your buckets!
-- --------------------------------------------------------------------------------------

-- Create 'lodge' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('lodge', 'lodge', true)
ON CONFLICT (id) DO NOTHING;

-- Create 'gallery' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('gallery', 'gallery', true)
ON CONFLICT (id) DO NOTHING;

-- Grant public read access to the lodge bucket
CREATE POLICY "Public Access lodge" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'lodge');

-- Grant authenticated upload access to the lodge bucket
CREATE POLICY "Auth Upload lodge" 
ON storage.objects FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'lodge');

-- Grant public read access to the gallery bucket
CREATE POLICY "Public Access gallery" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'gallery');

-- Grant authenticated upload access to the gallery bucket
CREATE POLICY "Auth Upload gallery" 
ON storage.objects FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'gallery');

