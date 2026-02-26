const CACHE_NAME = 'construo-cache-v8';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/css/base.css',
    '/css/style.css',
    '/css/responsive.css',
    '/css/hero.css',
    '/css/about.css',
    '/css/events.css',
    '/css/speakers.css',
    '/css/timeline.css',
    '/css/venue.css',
    '/css/organizers.css',
    '/css/faq.css',
    '/css/faq_whatsapp.css',
    '/css/navigation.css',
    '/css/modal.css',
    '/css/preloader.css',
    '/js/main.js',
    '/js/main-supabase.js',
    '/js/supabase-config.js',
    '/js/three-scene.js',
    '/js/animations.js',
    '/js/scroll-animations.js',
    '/js/faq.js',
    '/images/favicon.svg'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    // Skip cross-origin requests, API requests, admin panel, and Supabase requests
    const url = event.request.url;
    if (!url.startsWith(self.location.origin) ||
        url.includes('/api/') ||
        url.includes('/admin/') ||
        url.includes('supabase')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version if found, else fetch from network
                return response || fetch(event.request).then((fetchResponse) => {
                    return caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, fetchResponse.clone());
                        return fetchResponse;
                    });
                });
            })
            .catch(() => {
                // If both cache and network fail (offline), you can return a fallback page here if you have one
            })
    );
});
