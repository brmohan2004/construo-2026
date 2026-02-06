-- Add assets bucket for general uploads like logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('assets', 'assets', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow authenticated users to upload to assets bucket
CREATE POLICY "Auth users can upload assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'assets');

-- Policy to allow public to view assets
CREATE POLICY "Public can view assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'assets');
