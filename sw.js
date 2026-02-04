const CACHE_NAME = 'zeromoney-v3.36';
const ASSETS = [
    './',
    './index.html',
    './css/style.css',
    './js/app.js?v=3.35',
    './js/store.js?v=3.35',
    './js/utils.js',
    './js/firebase-service.js',
    './js/views/Expenses.js?v=3.35',
    './js/views/Admin.js?v=3.35',
    './js/views/Login.js?v=3.35',
    './js/views/Settings.js?v=3.35',
    './manifest.json',
    './icon.png',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://unpkg.com/html5-qrcode'
];

// Install Event
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Caching assets');
                return cache.addAll(ASSETS);
            })
    );
    self.skipWaiting();
});

// Activate Event (Cleanup old caches)
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(keys.map(key => {
                if (key !== CACHE_NAME) {
                    // Scanner System v3.36
                    return caches.delete(key);
                }
            }));
        })
    );
    self.clients.claim();
});

// Fetch Event (Network First for HTML, Cache First for Assets)
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // Dynamic/API requests or External -> Network First / Sandbox
    if (url.origin !== location.origin) {
        return;
    }

    // HTML -> Network First (to get latest version immediately)
    if (event.request.headers.get('accept').includes('text/html')) {
        event.respondWith(
            fetch(event.request)
                .then(res => {
                    const clone = res.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                    return res;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // Other Assets -> Cache First, then Network
    event.respondWith(
        caches.match(event.request)
            .then(cached => {
                return cached || fetch(event.request).then(res => {
                    return caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, res.clone());
                        return res;
                    });
                });
            })
    );
});
