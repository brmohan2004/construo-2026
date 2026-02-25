-- SQL Migration: Add localStorage control feature
-- This feature allows admins to enable/disable localStorage caching for all users
-- The setting is stored in site_config.settings.enableLocalStorage

-- No schema changes needed - the setting is stored in the existing JSONB column
-- This file documents the feature for reference

-- Example of how the setting is stored in site_config table:
-- {
--   "settings": {
--     "enableLocalStorage": true,  -- true = enabled (default), false = disabled
--     "cacheBuster": 1234567890,   -- timestamp to force cache refresh
--     ...other settings
--   }
-- }

-- When admin disables localStorage:
-- 1. The setting is saved to database
-- 2. cacheBuster is updated to force all users to refresh
-- 3. On next visit, users' browsers check this setting
-- 4. If disabled, localStorage is cleared and bypassed
-- 5. All data is fetched fresh from Supabase on every visit

-- Benefits:
-- - Admin has full control over caching behavior
-- - Can instantly disable caching for all users
-- - Useful when making critical updates that must be seen immediately
-- - No code deployment needed - just toggle in admin panel

-- Location in admin panel:
-- Settings > User Cache tab > "Enable Local Storage Feature" toggle

COMMENT ON TABLE site_config IS 'Stores site configuration including localStorage control in settings.enableLocalStorage';
