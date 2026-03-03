/**
 * CONSTRUO 2026 - Admin Supabase Configuration
 * Initializes and exports Supabase client for admin panel
 */

// Admin panel uses direct Supabase URL
// For local development: Add http://localhost:8000 to Supabase CORS settings
// For production: Add https://construo-2026.pages.dev to Supabase CORS settings
const SUPABASE_URL = 'https://cknbkgeurnwdqexgqezz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrbmJrZ2V1cm53ZHFleGdxZXp6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDM1NTEyNSwiZXhwIjoyMDg1OTMxMTI1fQ.Be6HGgj4ApSNjJLc1vkChAzDhjoszbCYCCt2Ojf0k_s';

// Check if browser is blocking storage (tracking prevention)
let storageAvailable = true;
try {
    localStorage.setItem('__storage_test__', 'test');
    localStorage.removeItem('__storage_test__');
} catch (e) {
    storageAvailable = false;
    console.warn('[Supabase] LocalStorage blocked by browser. Session persistence disabled.');
}

export const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        autoRefreshToken: true,
        persistSession: storageAvailable, // Disable if storage blocked
        detectSessionInUrl: false, // Reduce initialization calls
        storageKey: 'construo_admin_session',
        storage: storageAvailable ? undefined : {
            // Memory-only storage fallback if localStorage blocked
            getItem: (key) => null,
            setItem: (key, value) => {},
            removeItem: (key) => {}
        },
        flowType: 'pkce' // Use PKCE flow for better security
    },
    global: {
        headers: {
            'X-Client-Info': 'construo-admin/1.0'
        }
    }
});

export default supabase;
