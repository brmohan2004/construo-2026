/**
 * CONSTRUO 2026 - Supabase Configuration
 * Initializes and exports Supabase client with robust loading
 * Handles mobile browsers where CDN scripts may load slowly
 */

const SUPABASE_URL = 'https://cknbkgeurnwdqexgqezz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrbmJrZ2V1cm53ZHFleGdxZXp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNTUxMjUsImV4cCI6MjA4NTkzMTEyNX0.J_xNdmoZFBsNNp9drYN5BHzg42kK0UE8Rhx9OSM9G7w';

/**
 * Wait for window.supabase (UMD) to be available.
 * On mobile browsers the CDN script may still be loading when modules execute.
 * We poll for up to 10 seconds before giving up.
 */
function waitForSupabaseLib(timeoutMs = 10000) {
    return new Promise((resolve, reject) => {
        if (window.supabase) {
            resolve(window.supabase);
            return;
        }
        const start = Date.now();
        const interval = setInterval(() => {
            if (window.supabase) {
                clearInterval(interval);
                resolve(window.supabase);
            } else if (Date.now() - start > timeoutMs) {
                clearInterval(interval);
                reject(new Error('Supabase UMD library failed to load within ' + timeoutMs + 'ms'));
            }
        }, 50);
    });
}

let client = null;
let clientReady = false;

// This promise resolves once the client is initialized (or fails)
const clientPromise = (async () => {
    try {
        const supabaseLib = await waitForSupabaseLib();
        client = supabaseLib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
                detectSessionInUrl: false
            }
        });
        clientReady = true;
        console.log('Supabase client initialized successfully');
        return client;
    } catch (err) {
        console.error('Failed to initialize Supabase client:', err);
        return null;
    }
})();

/**
 * Get the Supabase client. Always use this function instead of the raw export
 * to ensure the client is ready (handles async initialization on mobile).
 */
export async function getSupabaseClient() {
    if (clientReady && client) return client;
    return await clientPromise;
}

// For backward compatibility, export the client directly too.
// But consumers should prefer getSupabaseClient() for reliability.
export { client as supabase };
export default client;

// Also expose the promise globally for other scripts
window._supabaseClientPromise = clientPromise;
