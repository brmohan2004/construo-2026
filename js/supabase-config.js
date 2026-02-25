/**
 * CONSTRUO 2026 - Supabase Configuration
 * Initializes and exports Supabase client
 */

const SUPABASE_URL = 'https://cknbkgeurnwdqexgqezz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrbmJrZ2V1cm53ZHFleGdxZXp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNTUxMjUsImV4cCI6MjA4NTkzMTEyNX0.J_xNdmoZFBsNNp9drYN5BHzg42kK0UE8Rhx9OSM9G7w';

export const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    }
});

export default supabase;
