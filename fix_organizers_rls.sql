-- ==============================================================================
-- CONSTRUO 2026 - Fix Organizers RLS Policies
-- Run this script in the Supabase SQL Editor to ensure Organizer updates work.
-- ==============================================================================

-- 1. Enable RLS (idempotent)
ALTER TABLE organizers ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to clean up
DO $$
BEGIN
    BEGIN DROP POLICY "Public Read Access" ON organizers; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN DROP POLICY "Auth Full Access" ON organizers; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN DROP POLICY "Public Select organizers" ON organizers; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN DROP POLICY "Auth Insert organizers" ON organizers; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN DROP POLICY "Auth Update organizers" ON organizers; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN DROP POLICY "Auth Delete organizers" ON organizers; EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;

-- 3. Create Policy: Public can VIEW organizers
CREATE POLICY "Public Read Access"
ON organizers FOR SELECT
TO anon, authenticated
USING ( true );

-- 4. Create Policy: Authenticated users can MANAGE organizers
CREATE POLICY "Auth Full Access"
ON organizers FOR ALL
TO authenticated
USING ( true )
WITH CHECK ( true );
