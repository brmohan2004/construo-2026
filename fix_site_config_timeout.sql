-- Fix site_config update timeout issues
-- This addresses the "statement timeout" error when updating settings

-- 1. Add index on config_key if not exists (should already exist due to UNIQUE constraint)
CREATE INDEX IF NOT EXISTS idx_site_config_config_key ON site_config(config_key);

-- 2. Check if there are any slow RLS policies
-- The admin update policy should be simple and fast
DROP POLICY IF EXISTS "Admins can update site config" ON site_config;

CREATE POLICY "Admins can update site config"
    ON site_config FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- 3. Ensure the profiles table has an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_id_role ON profiles(id, role);

-- 4. Increase statement timeout for this specific table (if needed)
-- Note: This is a PostgreSQL setting, adjust as needed
-- ALTER TABLE site_config SET (statement_timeout = '10s');

-- 5. Verify the trigger is not causing issues
-- The update_updated_at_column trigger should be simple
-- If it's slow, we can optimize it

-- Check current trigger
SELECT tgname, tgtype, tgenabled 
FROM pg_trigger 
WHERE tgrelid = 'site_config'::regclass;

-- 6. Add a comment for documentation
COMMENT ON TABLE site_config IS 'Site configuration with JSONB columns. Updates should be fast with proper indexes.';

-- 7. Analyze the table to update statistics
ANALYZE site_config;

-- 8. Optional: If the JSONB columns are very large, consider using JSONB operators
-- Example: Instead of replacing entire JSONB, use jsonb_set for partial updates
-- This would require changing the application code to use:
-- UPDATE site_config SET settings = jsonb_set(settings, '{enableLocalStorage}', 'true')
-- But for now, the full column update should work fine with the optimizations above
