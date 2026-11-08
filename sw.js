const CACHE_NAME = 'kaigo-vocabs-v8';
const ASSETS = [
  '/',
  '/kaigo-flashcards-3.html',
  '/vocab-day1.json',
  '/vocab-day2.json',
  '/vocab-day3.json',
  '/vocab-day4.json',
  '/vocab-day5.json',
  '/vocab-day6.json',
  '/vocab-day7.json',
  '/manifest.json',
  '/icon.svg',
  '/sw.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((cached) => {
        if (cached) return cached;
        return fetch(event.request)
          .then((response) => {
            if (event.request.method === 'GET' && response.status === 200) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
            }
            return response;
          })
          .catch(() => {
            if (event.request.mode === 'navigate') {
              return caches.match('/kaigo-flashcards-3.html');
            }
          });
      })
  );
});
