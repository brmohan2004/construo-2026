/**
 * CONSTRUO 2026 - Supabase Configuration
 * Initializes and exports Supabase client
 */

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://nhinxkmhldxnkinphycl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oaW54a21obGR4bmtpbnBoeWNsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDI5ODIyMCwiZXhwIjoyMDg1ODc0MjIwfQ.dz3nZwfoedSzZ2l8DqcuwgIVKSIoWLJ5TEJBEy_sbfo';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    }
});

export default supabase;
