const CACHE_NAME = 'kaigo-vocabs-v9';
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
  '/icon.svg'
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
  const req = event.request;
  const url = new URL(req.url);

  // Network-first for HTML / navigation so updates appear without hard refresh
  const isHTML = req.mode === 'navigate' ||
    url.pathname === '/' ||
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('/sw.js');

  if (isHTML) {
    event.respondWith(
      fetch(req)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return response;
        })
        .catch(() => caches.match(req).then((cached) => {
          return cached || caches.match('/kaigo-flashcards-3.html');
        }))
    );
    return;
  }

  // Cache-first for JSON, icons, etc.
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((response) => {
        if (req.method === 'GET' && response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        }
        return response;
      });
    })
  );
});
