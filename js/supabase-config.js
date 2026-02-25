/**
 * CONSTRUO 2026 - Supabase Configuration
 * Initializes and exports Supabase client
 */

const SUPABASE_URL = 'https://cknbkgeurnwdqexgqezz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrbmJrZ2V1cm53ZHFleGdxZXp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNTUxMjUsImV4cCI6MjA4NTkzMTEyNX0.J_xNdmoZFBsNNp9drYN5BHzg42kK0UE8Rhx9OSM9G7w';

let client = null;
try {
    if (window.supabase) {
        client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
                detectSessionInUrl: false
            }
        });
    } else {
        console.error("window.supabase is undefined! The script may have been blocked or is loading slowly.");
    }
} catch (err) {
    console.warn("Failed to initialize Supabase client securely:", err);
}

export const supabase = client;
export default supabase;
