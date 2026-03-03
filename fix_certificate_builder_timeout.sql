-- Fix Certificate Builder Timeout Issues
-- This script fixes RLS policies and adds optimizations for site_config queries

-- Step 1: Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_site_config_config_key ON site_config(config_key);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id_role ON profiles(user_id, role);

-- Step 2: Drop and recreate site_config SELECT policy (allow everyone to read)
DROP POLICY IF EXISTS "Public can view site config" ON site_config;
CREATE POLICY "Public can view site config"
    ON site_config FOR SELECT
    TO public
    USING (true);

-- Step 3: Fix site_config UPDATE policy (use user_id, not id)
DROP POLICY IF EXISTS "Admins can update site config" ON site_config;
CREATE POLICY "Admins can update site config"
    ON site_config FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role IN ('admin', 'superadmin', 'moderator')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role IN ('admin', 'superadmin', 'moderator')
        )
    );

-- Step 4: Fix site_config INSERT policy (if needed)
DROP POLICY IF EXISTS "Admins can insert site config" ON site_config;
CREATE POLICY "Admins can insert site config"
    ON site_config FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role IN ('admin', 'superadmin', 'moderator')
        )
    );

-- Step 5: Fix profiles SELECT policy
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
CREATE POLICY "Users can view all profiles"
    ON profiles FOR SELECT
    TO authenticated
    USING (true);

-- Step 6: Fix profiles UPDATE policy
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Step 7: Analyze tables for query optimization
ANALYZE site_config;
ANALYZE profiles;

-- Step 8: Verify the policies
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
WHERE tablename IN ('site_config', 'profiles')
ORDER BY tablename, policyname;
