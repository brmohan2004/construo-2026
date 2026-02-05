-- ==============================================================================
-- CONSTRUO 2026 - Storage Bucket Policies
-- Run this script in the Supabase SQL Editor to fix file upload permissions
-- ==============================================================================

-- 1. Create the 'media' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Enable RLS on objects (standard practice, usually already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Create Policy: Allow Public Read Access to 'media' bucket
-- This allows anyone to view the images on your website
DROP POLICY IF EXISTS "Public Select media" ON storage.objects;
CREATE POLICY "Public Select media"
ON storage.objects FOR SELECT
USING ( bucket_id = 'media' );

-- 4. Create Policy: Allow Authenticated Users to Upload to 'media' bucket
-- This allows logged-in admin users to upload files
DROP POLICY IF EXISTS "Authenticated Insert media" ON storage.objects;
CREATE POLICY "Authenticated Insert media"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'media' AND auth.role() = 'authenticated' );

-- 5. Create Policy: Allow Authenticated Users to Update files in 'media'
DROP POLICY IF EXISTS "Authenticated Update media" ON storage.objects;
CREATE POLICY "Authenticated Update media"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'media' AND auth.role() = 'authenticated' );

-- 6. Create Policy: Allow Authenticated Users to Delete files in 'media'
DROP POLICY IF EXISTS "Authenticated Delete media" ON storage.objects;
CREATE POLICY "Authenticated Delete media"
ON storage.objects FOR DELETE
USING ( bucket_id = 'media' AND auth.role() = 'authenticated' );

-- ------------------------------------------------------------------------------
-- REPEAT FOR OTHER BUCKETS (Optional but recommended)
-- ------------------------------------------------------------------------------

-- Create other buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
('event-logos', 'event-logos', true),
('speaker-photos', 'speaker-photos', true),
('sponsor-logos', 'sponsor-logos', true),
('organizer-images', 'organizer-images', true),
('venue-images', 'venue-images', true)
ON CONFLICT (id) DO NOTHING;

-- Generic Policy: Public Read for ALL buckets listed above
CREATE POLICY "Public Select All Buckets"
ON storage.objects FOR SELECT
USING ( bucket_id IN ('event-logos', 'speaker-photos', 'sponsor-logos', 'organizer-images', 'venue-images') );

-- Generic Policy: Authenticated Insert for ALL buckets listed above
CREATE POLICY "Authenticated Insert All Buckets"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id IN ('event-logos', 'speaker-photos', 'sponsor-logos', 'organizer-images', 'venue-images') AND auth.role() = 'authenticated' );

-- Generic Policy: Authenticated Update for ALL buckets listed above
CREATE POLICY "Authenticated Update All Buckets"
ON storage.objects FOR UPDATE
USING ( bucket_id IN ('event-logos', 'speaker-photos', 'sponsor-logos', 'organizer-images', 'venue-images') AND auth.role() = 'authenticated' );

-- Generic Policy: Authenticated Delete for ALL buckets listed above
CREATE POLICY "Authenticated Delete All Buckets"
ON storage.objects FOR DELETE
USING ( bucket_id IN ('event-logos', 'speaker-photos', 'sponsor-logos', 'organizer-images', 'venue-images') AND auth.role() = 'authenticated' );
