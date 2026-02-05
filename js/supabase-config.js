/**
 * CONSTRUO 2026 - Supabase Configuration
 * Initializes and exports Supabase client
 */

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://nhinxkmhldxnkinphycl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oaW54a21obGR4bmtpbnBoeWNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyOTgyMjAsImV4cCI6MjA4NTg3NDIyMH0.Qi75waYVECxaer0I2STZS_pjEsPhzXyx02eiHDiqShg';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    }
});

export default supabase;
