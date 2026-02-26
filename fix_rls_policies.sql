-- Fix RLS policies for site_config and profiles
-- The previous policies had a bug: they were comparing profiles.id (internal UUID) 
-- with auth.uid() (the user's identity ID), which will never match.

-- 1. Fix site_config update policy
DROP POLICY IF EXISTS "Admins can update site config" ON site_config;
CREATE POLICY "Admins can update site config"
    ON site_config FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid() -- Fix: use user_id, not id
            AND profiles.role IN ('admin', 'superadmin', 'moderator') -- Allow all admin roles
        )
    );

-- 2. Fix profiles update policy
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

-- 3. Fix activity_logs insert policy (ensure ip column exists and name is correct)
-- Activity logs should allow any authenticated user to insert
DROP POLICY IF EXISTS "Authenticated users can create activity logs" ON activity_logs;
CREATE POLICY "Authenticated users can create activity logs"
    ON activity_logs FOR INSERT
    TO authenticated
    WITH CHECK (true);

ANALYZE site_config;
ANALYZE profiles;
