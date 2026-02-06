-- CONSTRUO 2026 - Supabase Migration
-- This migration creates all tables for the project and sets up RLS policies

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- PROFILES TABLE (replaces Users)
-- ================================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('superadmin', 'admin', 'moderator', 'viewer')),
    name TEXT NOT NULL,
    avatar TEXT DEFAULT '',
    last_login TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- SITE_CONFIG TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS site_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_key TEXT UNIQUE NOT NULL DEFAULT 'main',
    hero JSONB DEFAULT '{}',
    about JSONB DEFAULT '{}',
    venue JSONB DEFAULT '{}',
    footer JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    events JSONB DEFAULT '{}',
    sponsors JSONB DEFAULT '{}',
    categories JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default config
INSERT INTO site_config (config_key, hero, about, venue, footer, settings, events, sponsors)
VALUES (
    'main',
    '{"badge": "Civil Engineering Symposium", "title": "CONSTRUO", "titleOutline": "2026", "tagline": "Building Tomorrow, Today", "date": {"days": "28-29", "month": "March", "year": "2026"}, "ctaButtons": [{"text": "Register Now", "href": "#registration", "primary": true}, {"text": "View Events", "href": "#events", "primary": false}]}',
    '{"title": "About CONSTRUO", "subtitle": "The Premier Civil Engineering Symposium", "description": "CONSTRUO 2026 is a national-level technical symposium that brings together students, professionals, and industry leaders to explore the latest innovations in civil engineering.", "highlights": ["Industry Expert Speakers", "Technical Workshops", "Paper Presentations", "Pro Shows & Events"], "stats": [{"id": "events", "value": "20+", "label": "Events", "icon": "calendar"}, {"id": "participants", "value": "500+", "label": "Expected Participants", "icon": "users"}, {"id": "prizes", "value": "₹50K+", "label": "Prize Money", "icon": "trophy"}, {"id": "colleges", "value": "30+", "label": "Participating Colleges", "icon": "building"}]}',
    '{"name": "Sri Sivasubramaniya Nadar College of Engineering", "address": "Rajiv Gandhi Salai (OMR)", "city": "Kalavakkam", "state": "Tamil Nadu", "pincode": "603110", "coordinates": {"lat": "12.7513", "lng": "80.0443"}, "contact": {"email": "construo@ssn.edu.in", "phone": "+91 44 2745 1515", "website": "https://ssn.edu.in"}}',
    '{"copyright": "© 2026 CONSTRUO. All rights reserved.", "credits": "Developed by SSN IT Team", "social": {"instagram": "https://instagram.com/construo.ssn", "facebook": "", "twitter": "", "linkedin": "", "youtube": ""}, "contact": {"email": "construo@ssn.edu.in", "phone": "+91 44 2745 1515", "address": "SSN College of Engineering, Kalavakkam, Chennai - 603110"}}',
    '{"siteName": "CONSTRUO 2026", "siteTagline": "Civil Engineering Symposium", "eventStartDate": "2026-03-28", "eventEndDate": "2026-03-29", "showCountdown": true, "registrationStatus": "open", "maintenanceMode": false}',
    '{"prizePool": {"amount": "50,000+", "subtitle": "Certificates for all participants"}}',
    '{"contactEmail": "construo@ssn.edu.in"}'
)
ON CONFLICT (config_key) DO NOTHING;

-- ================================================
-- EVENTS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('technical', 'non-technical', 'workshop', 'pro-show')),
    logo TEXT,
    participation TEXT DEFAULT 'individual' CHECK (participation IN ('individual', 'team')),
    team_size JSONB DEFAULT '{"min": 1, "max": 1}',
    entry_fee NUMERIC DEFAULT 0,
    prize_money JSONB DEFAULT '{"first": 0, "second": 0, "third": 0}',
    description TEXT,
    rules TEXT[],
    materials TEXT[],
    certificate BOOLEAN DEFAULT false,
    timeline JSONB DEFAULT '[]',
    coordinator JSONB DEFAULT '{}',
    registration_link TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'closed', 'upcoming')),
    featured BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT,
    updated_by TEXT
);

-- ================================================
-- ORGANIZERS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS organizers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organizer_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    designation TEXT,
    department TEXT,
    organization TEXT,
    image TEXT,
    email TEXT,
    phone TEXT,
    social JSONB DEFAULT '{}',
    category TEXT DEFAULT 'organizing' CHECK (category IN ('patron', 'advisory', 'organizing', 'faculty', 'student', 'volunteer', 'other')),
    "order" INTEGER DEFAULT 0,
    featured BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT,
    updated_by TEXT
);

-- ================================================
-- SPEAKERS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS speakers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    speaker_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    title TEXT,
    organization TEXT,
    photo TEXT,
    image TEXT,
    bio TEXT,
    social JSONB DEFAULT '{}',
    sessions TEXT[],
    featured BOOLEAN DEFAULT false,
    "order" INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT,
    updated_by TEXT
);

-- ================================================
-- SPONSORS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS sponsors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sponsor_id TEXT UNIQUE NOT NULL,
    tier_id TEXT NOT NULL,
    name TEXT NOT NULL,
    logo TEXT,
    website TEXT,
    description TEXT,
    "order" INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT,
    updated_by TEXT
);

-- ================================================
-- TIMELINE_DAYS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS timeline_days (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    day_id TEXT UNIQUE NOT NULL,
    date TEXT NOT NULL,
    title TEXT NOT NULL,
    sessions JSONB DEFAULT '[]',
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- REGISTRATION_FORMS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS registration_forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    fields JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_by TEXT,
    updated_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- REGISTRATIONS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    registration_id TEXT UNIQUE NOT NULL,
    registration_number TEXT UNIQUE NOT NULL,
    form_id TEXT,
    participant JSONB DEFAULT '{}',
    data JSONB DEFAULT '{}',
    events TEXT[],
    team_members JSONB DEFAULT '[]',
    payment JSONB DEFAULT '{"amount": 0, "status": "pending"}',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT,
    updated_by TEXT
);

-- ================================================
-- ACTIVITY_LOGS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action TEXT NOT NULL,
    section TEXT NOT NULL,
    description TEXT,
    user_id TEXT,
    user_ref UUID REFERENCES profiles(id) ON DELETE SET NULL,
    ip TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- INDEXES
-- ================================================
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_organizers_category ON organizers(category);
CREATE INDEX IF NOT EXISTS idx_speakers_featured ON speakers(featured);
CREATE INDEX IF NOT EXISTS idx_sponsors_tier_id ON sponsors(tier_id);
CREATE INDEX IF NOT EXISTS idx_registrations_form_id ON registrations(form_id);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON registrations(status);
CREATE INDEX IF NOT EXISTS idx_activity_logs_section ON activity_logs(section);
CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON activity_logs(timestamp);

-- ================================================
-- TRIGGERS FOR UPDATED_AT
-- ================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_site_config_updated_at BEFORE UPDATE ON site_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizers_updated_at BEFORE UPDATE ON organizers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_speakers_updated_at BEFORE UPDATE ON speakers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sponsors_updated_at BEFORE UPDATE ON sponsors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_timeline_days_updated_at BEFORE UPDATE ON timeline_days
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_registration_forms_updated_at BEFORE UPDATE ON registration_forms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_registrations_updated_at BEFORE UPDATE ON registrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- REGISTRATION NUMBER TRIGGER (CONS2026xxxx)
-- ================================================
CREATE SEQUENCE IF NOT EXISTS registration_number_seq START 1;

CREATE OR REPLACE FUNCTION generate_registration_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.registration_number IS NULL OR NEW.registration_number = '' THEN
        NEW.registration_number := 'CONS2026' || LPAD(nextval('registration_number_seq')::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_registration_number BEFORE INSERT ON registrations
    FOR EACH ROW EXECUTE FUNCTION generate_registration_number();

-- ================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizers ENABLE ROW LEVEL SECURITY;
ALTER TABLE speakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE registration_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- ================================================
-- PROFILES POLICIES
-- ================================================
-- Public read access to profiles (for display purposes)
CREATE POLICY "Public profiles are viewable by everyone"
    ON profiles FOR SELECT
    USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can create their own profile upon signup
CREATE POLICY "Users can create own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Admins can manage all profiles
CREATE POLICY "Admins can manage all profiles"
    ON profiles FOR ALL
    USING (
        role IN ('admin', 'superadmin')
    );

CREATE POLICY "Admins can delete profiles"
    ON profiles FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'superadmin')
        )
    );

-- ================================================
-- SITE_CONFIG POLICIES
-- ================================================
-- Everyone can read site config
CREATE POLICY "Site config is viewable by everyone"
    ON site_config FOR SELECT
    USING (true);

-- Only admins can modify site config
CREATE POLICY "Admins can update site config"
    ON site_config FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'superadmin', 'moderator')
        )
    );

CREATE POLICY "Admins can insert site config"
    ON site_config FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'superadmin')
        )
    );

-- ================================================
-- EVENTS POLICIES
-- ================================================
-- Everyone can read active events
CREATE POLICY "Events are viewable by everyone"
    ON events FOR SELECT
    USING (true);

-- Admins and moderators can insert events
CREATE POLICY "Admins can insert events"
    ON events FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'superadmin', 'moderator')
        )
    );

-- Admins and moderators can update events
CREATE POLICY "Admins can update events"
    ON events FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'superadmin', 'moderator')
        )
    );

-- Only superadmins can delete events
CREATE POLICY "Superadmins can delete events"
    ON events FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() 
            AND role = 'superadmin'
        )
    );

-- ================================================
-- ORGANIZERS POLICIES
-- ================================================
CREATE POLICY "Organizers are viewable by everyone"
    ON organizers FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage organizers"
    ON organizers FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'superadmin', 'moderator')
        )
    );

-- ================================================
-- SPEAKERS POLICIES
-- ================================================
CREATE POLICY "Speakers are viewable by everyone"
    ON speakers FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage speakers"
    ON speakers FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'superadmin', 'moderator')
        )
    );

-- ================================================
-- SPONSORS POLICIES
-- ================================================
CREATE POLICY "Sponsors are viewable by everyone"
    ON sponsors FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage sponsors"
    ON sponsors FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'superadmin', 'moderator')
        )
    );

-- ================================================
-- TIMELINE_DAYS POLICIES
-- ================================================
CREATE POLICY "Timeline is viewable by everyone"
    ON timeline_days FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage timeline"
    ON timeline_days FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'superadmin', 'moderator')
        )
    );

-- ================================================
-- REGISTRATION_FORMS POLICIES
-- ================================================
CREATE POLICY "Active forms are viewable by everyone"
    ON registration_forms FOR SELECT
    USING (is_active = true OR EXISTS (
        SELECT 1 FROM profiles 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'superadmin', 'moderator', 'viewer')
    ));

CREATE POLICY "Admins can manage forms"
    ON registration_forms FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'superadmin', 'moderator')
        )
    );

-- ================================================
-- REGISTRATIONS POLICIES
-- ================================================
-- Anyone can create a registration (public registration)
CREATE POLICY "Anyone can create registration"
    ON registrations FOR INSERT
    WITH CHECK (true);

-- Users can view their own registrations (future: link by email)
-- Admins can view all registrations
CREATE POLICY "Registrations viewable by admins or creators"
    ON registrations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'superadmin', 'moderator', 'viewer')
        )
    );

-- Admins can update registrations
CREATE POLICY "Admins can update registrations"
    ON registrations FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'superadmin', 'moderator')
        )
    );

-- Only superadmins can delete registrations
CREATE POLICY "Superadmins can delete registrations"
    ON registrations FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() 
            AND role = 'superadmin'
        )
    );

-- ================================================
-- ACTIVITY_LOGS POLICIES
-- ================================================
-- Admins can view all activity logs
CREATE POLICY "Admins can view activity logs"
    ON activity_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'superadmin', 'moderator', 'viewer')
        )
    );

-- Anyone authenticated can create activity logs
CREATE POLICY "Authenticated users can create activity logs"
    ON activity_logs FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL OR true);

-- Only superadmins can delete activity logs
CREATE POLICY "Superadmins can delete activity logs"
    ON activity_logs FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() 
            AND role = 'superadmin'
        )
    );

-- ================================================
-- STORAGE BUCKETS (for file uploads)
-- ================================================
-- Note: This needs to be run in Supabase Dashboard Storage section
-- or via Supabase Storage API

-- CREATE BUCKET: event-logos
-- CREATE BUCKET: speaker-photos
-- CREATE BUCKET: sponsor-logos
-- CREATE BUCKET: organizer-images
-- CREATE BUCKET: venue-images
-- CREATE BUCKET: media

-- Storage policies will need to be set up through Supabase Dashboard
