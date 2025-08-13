const CACHE_NAME = 'fitculator-admin-v1';
const urlsToCache = [
  '/',
  '/image/logo-icon.png',
  '/image/logo.png',
  '/svg/logo_light.svg',
  '/svg/logo_dark.svg',
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});