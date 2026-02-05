-- ==============================================================================
-- CONSTRUO 2026 - Fix Sponsor Storage Policies (Safe Mode)
-- Run this script in the Supabase SQL Editor.
-- ==============================================================================

-- 1. Create the 'sponsor-logos' bucket if it doesn't exist.
-- Note: If you get a permission error here, you can also create the bucket manually in the Storage dashboard.
INSERT INTO storage.buckets (id, name, public) 
VALUES ('sponsor-logos', 'sponsor-logos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. (Skipped) Enable RLS on objects. RLS is enabled by default on storage.objects.
-- attempting to run ALTER TABLE often causes permission errors, so we assume it's on.

-- 3. Remove existing conflicting policies for this bucket if any
-- We use a DO block to avoid errors if policies don't exist
DO $$
BEGIN
    BEGIN
        DROP POLICY "Public Select sponsor-logos" ON storage.objects;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
        DROP POLICY "Auth Insert sponsor-logos" ON storage.objects;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
        DROP POLICY "Auth Update sponsor-logos" ON storage.objects;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
        DROP POLICY "Auth Delete sponsor-logos" ON storage.objects;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
END $$;

-- 4. Create Policy: Allow Public Read Access
CREATE POLICY "Public Select sponsor-logos"
ON storage.objects FOR SELECT
USING ( bucket_id = 'sponsor-logos' );

-- 5. Create Policy: Allow Authenticated Users to Upload
CREATE POLICY "Auth Insert sponsor-logos"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'sponsor-logos' AND auth.role() = 'authenticated' );

-- 6. Create Policy: Allow Authenticated Users to Update
CREATE POLICY "Auth Update sponsor-logos"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'sponsor-logos' AND auth.role() = 'authenticated' );

-- 7. Create Policy: Allow Authenticated Users to Delete
CREATE POLICY "Auth Delete sponsor-logos"
ON storage.objects FOR DELETE
USING ( bucket_id = 'sponsor-logos' AND auth.role() = 'authenticated' );
