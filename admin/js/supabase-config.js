/**
 * CONSTRUO 2026 - Admin Supabase Configuration
 * Initializes and exports Supabase client for admin panel
 */

// Admin panel always uses direct Supabase URL (not the proxy)
// The proxy is only for the public site to bypass ISP blocking for visitors
const SUPABASE_URL = 'https://cknbkgeurnwdqexgqezz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrbmJrZ2V1cm53ZHFleGdxZXp6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDM1NTEyNSwiZXhwIjoyMDg1OTMxMTI1fQ.Be6HGgj4ApSNjJLc1vkChAzDhjoszbCYCCt2Ojf0k_s';

export const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storageKey: 'construo_admin_session'
    }
});

export default supabase;
