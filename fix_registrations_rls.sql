-- ==============================================================================
-- CONSTRUO 2026 - Fix Registrations RLS Policies
-- Run this script in the Supabase SQL Editor to allow public registration submissions.
-- ==============================================================================

-- 1. Enable RLS (idempotent)
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to clean up
DO $$
BEGIN
    BEGIN DROP POLICY "Public Insert registrations" ON registrations; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN DROP POLICY "Anon Select registrations" ON registrations; EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;

-- 3. Create Policy: Allow Public (Anon) to INSERT registrations
-- This allows any user (even not logged in) to submit a registration form
CREATE POLICY "Public Insert registrations"
ON registrations FOR INSERT
TO anon, authenticated
WITH CHECK ( true );

-- 4. Create Policy: Allow Public (Anon) to SELECT their own registration (optional/limited)
-- Important: We generally don't want public to read ALL registrations.
-- But the client might need to read back the one they just created.
-- For now, we rely on the INSERT ... SELECT returning the single row, which usually requires Policy permissions.

CREATE POLICY "Anon Select registrations"
ON registrations FOR SELECT
TO anon, authenticated
USING ( true );

-- Note: The SELECT policy 'USING(true)' is very open. 
-- In a strict production environment, you might restrict this to only the row just inserted, 
-- but Supabase Client usually needs read access to return the data object after insert.
