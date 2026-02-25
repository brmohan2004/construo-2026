/**
 * CONSTRUO 2026 - Supabase Configuration
 * Initializes Supabase client with robust loading for mobile
 * 
 * NO ES MODULES - uses window globals for maximum mobile compatibility.
 * This script MUST load after the Supabase UMD CDN script.
 */

(function () {
    'use strict';

    var IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    var SUPABASE_URL = IS_LOCAL
        ? 'https://cknbkgeurnwdqexgqezz.supabase.co'
        : window.location.origin + '/api/supabase';
    var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrbmJrZ2V1cm53ZHFleGdxZXp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNTUxMjUsImV4cCI6MjA4NTkzMTEyNX0.J_xNdmoZFBsNNp9drYN5BHzg42kK0UE8Rhx9OSM9G7w';

    function initClient() {
        if (window.supabase && window.supabase.createClient) {
            try {
                window._construoSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
                    auth: {
                        autoRefreshToken: false,
                        persistSession: false,
                        detectSessionInUrl: false
                    }
                });
                console.log('[supabase-config] Client initialized successfully');
                return true;
            } catch (err) {
                console.error('[supabase-config] Failed to create client:', err);
                return false;
            }
        }
        return false;
    }

    // Try immediately
    if (initClient()) return;

    // If UMD not ready yet (shouldn't happen with blocking script, but safety net)
    console.warn('[supabase-config] window.supabase not available, polling...');
    var attempts = 0;
    var maxAttempts = 200; // 10 seconds at 50ms intervals
    var poll = setInterval(function () {
        attempts++;
        if (initClient()) {
            clearInterval(poll);
            window.dispatchEvent(new CustomEvent('supabase-client-ready'));
        } else if (attempts >= maxAttempts) {
            clearInterval(poll);
            console.error('[supabase-config] Supabase UMD never loaded after 10s');
        }
    }, 50);
})();
