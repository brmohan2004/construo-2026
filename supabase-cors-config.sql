-- ============================================================================
-- Supabase CORS Configuration Helper
-- ============================================================================
-- 
-- ⚠️ IMPORTANT: CORS settings CANNOT be configured via SQL!
-- CORS must be configured in the Supabase Dashboard:
-- https://supabase.com/dashboard/project/cknbkgeurnwdqexgqezz/settings/api
--
-- Add these URLs to "Additional Allowed Origins":
--   - https://construo-2026.pages.dev
--   - http://localhost:8000
--   - http://127.0.0.1:8000
--
-- ============================================================================

-- However, you can configure Auth redirect URLs via SQL:

-- 1. Check current auth configuration
SELECT * FROM auth.config;

-- 2. Update Site URL (if needed)
-- This should match your production domain
UPDATE auth.config 
SET site_url = 'https://construo-2026.pages.dev'
WHERE id = 1;

-- 3. Add redirect URLs for authentication
-- Note: This is different from CORS, but helps with auth flows
-- You'll need to use the Supabase Dashboard for this:
-- Authentication > URL Configuration > Redirect URLs

-- ============================================================================
-- Verify your site_config table is accessible
-- ============================================================================

-- Check if site_config table exists and has data
SELECT config_key, 
       updated_at,
       jsonb_pretty(settings) as settings_preview
FROM site_config
WHERE config_key = 'main'
LIMIT 1;

-- ============================================================================
-- Grant proper permissions (if needed)
-- ============================================================================

-- Ensure service_role can read/write site_config
GRANT SELECT, INSERT, UPDATE ON site_config TO service_role;
GRANT USAGE ON SEQUENCE site_config_id_seq TO service_role;

-- ============================================================================
-- Check RLS policies on site_config
-- ============================================================================

-- View existing policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'site_config';

-- If you need to allow service_role to bypass RLS:
-- ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service_role full access (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'site_config' 
        AND policyname = 'Service role can do anything'
    ) THEN
        CREATE POLICY "Service role can do anything"
        ON site_config
        FOR ALL
        TO service_role
        USING (true)
        WITH CHECK (true);
    END IF;
END $$;

-- ============================================================================
-- DASHBOARD CONFIGURATION REMINDER
-- ============================================================================
-- 
-- To fix the CORS errors, you MUST configure these in the Dashboard:
-- 
-- 1. Go to: https://supabase.com/dashboard/project/cknbkgeurnwdqexgqezz
-- 2. Navigate to: Settings > API
-- 3. Scroll to: "CORS Configuration" or "Additional Allowed Origins"
-- 4. Add these URLs (comma-separated or one per line):
--    - https://construo-2026.pages.dev
--    - http://localhost:8000
--    - http://127.0.0.1:8000
-- 5. Click Save
-- 6. Wait 30-60 seconds for changes to propagate
-- 
-- ============================================================================
