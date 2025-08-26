const CACHE_NAME = 'fitculator-admin-v2';
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
  // 즉시 활성화하여 기존 Service Worker 교체
  self.skipWaiting();
});

// 기존 캐시 정리
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // 즉시 모든 클라이언트 제어
  return self.clients.claim();
});

self.addEventListener('fetch', function(event) {
  // workout 관련 API 요청은 캐시하지 않고 항상 네트워크에서 가져오기
  if (event.request.url.includes('/api/workouts') || 
      event.request.url.includes('/workout')) {
    event.respondWith(
      fetch(event.request, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      })
    );
    return;
  }

  // 다른 요청들은 기존 캐시 로직 사용
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});