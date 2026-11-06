/* ============================================================
   SERVICE WORKER — Jogo da Velha PWA
   Estratégia: Cache-First para assets, Network-First para HTML
   ============================================================ */

const CACHE_NAME = 'jogodavelha-v4';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-72.png',
  '/icons/icon-96.png',
  '/icons/icon-128.png',
  '/icons/icon-144.png',
  '/icons/icon-152.png',
  '/icons/icon-192.png',
  '/icons/icon-384.png',
  '/icons/icon-512.png'
];

/* ===== INSTALL — pré-cache de todos os assets ===== */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

/* ===== ACTIVATE — limpa caches antigos ===== */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

/* ===== FETCH — Cache-First com fallback para rede ===== */
self.addEventListener('fetch', (event) => {
  // Ignora requisições não-GET e cross-origin
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request).then((response) => {
        // Só cacheia respostas válidas
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const toCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, toCache);
        });
        return response;
      }).catch(() => {
        // Offline fallback: retorna o HTML principal
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

