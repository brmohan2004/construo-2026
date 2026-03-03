/**
 * CONSTRUO 2026 - Admin Supabase Configuration
 * Initializes and exports Supabase client for admin panel
 */

// Detect environment and use proxy on production to bypass CORS
const isLocalhost = window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1';
const isProduction = window.location.hostname.includes('pages.dev') || 
                     window.location.hostname.includes('construo-2026');

// Use proxy on production to bypass CORS issues, direct URL on localhost
const SUPABASE_URL = (isProduction && !isLocalhost) 
    ? `${window.location.origin}/api/supabase`
    : 'https://cknbkgeurnwdqexgqezz.supabase.co';

// Use anon key for client-side auth (service_role should only be server-side)
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrbmJrZ2V1cm53ZHFleGdxZXp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNTUxMjUsImV4cCI6MjA4NTkzMTEyNX0.J_xNdmoZFBsNNp9drYN5BHzg42kK0UE8Rhx9OSM9G7w';

console.log(`[Supabase Config] Environment: ${isProduction ? 'PRODUCTION' : 'LOCALHOST'}`);
console.log(`[Supabase Config] Using URL: ${SUPABASE_URL}`);
console.log(`[Supabase Config] Using ${isProduction ? 'PROXY' : 'DIRECT'} connection`);

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
