// ============================================================
// Service Worker — Batalha do Estreito 2.0 PWA
// Cache-First para assets pesados, Network-Only para API/Socket
// ============================================================

const CACHE_NAME = 'batalha-estreito-v1';

// Assets para pré-cache (carregados na instalação)
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/config.js',
  '/engine3d.js',
  '/script.js',
  '/manifest.json',
  '/assets/sem fundo.png'
];

// Assets pesados para cache sob demanda (quando acessados pela 1ª vez)
const RUNTIME_CACHE_PATTERNS = [
  /\.glb$/,          // Modelos 3D
  /\.png$/,          // Imagens
  /\.jpg$/,
  /\.jpeg$/,
  /\.webp$/,
  /\.avif$/,
  /\.mp3$/,          // Áudio
  /\.ogg$/,
  /three\.min\.js/,  // Three.js CDN
  /GLTFLoader\.js/,  // Three.js Loader
  /gsap\.min\.js/,   // GSAP CDN
  /fonts\.googleapis\.com/,  // Google Fonts
  /fonts\.gstatic\.com/
];

// Rotas que NUNCA devem ser cacheadas
const NETWORK_ONLY_PATTERNS = [
  /\/api\//,
  /\/socket\.io\//,
  /\/health/
];

// ---- INSTALL: Pré-cachear assets essenciais ----
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Pré-cacheando assets essenciais');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch(err => {
        console.warn('[SW] Erro no pré-cache (continuando):', err);
        return self.skipWaiting();
      })
  );
});

// ---- ACTIVATE: Limpar caches antigos ----
self.addEventListener('activate', (event) => {
  console.log('[SW] Ativando Service Worker...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => {
            console.log('[SW] Removendo cache antigo:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// ---- FETCH: Estratégia híbrida de cache ----
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Network-Only para API e WebSocket
  if (NETWORK_ONLY_PATTERNS.some(pattern => pattern.test(url.pathname) || pattern.test(url.href))) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Ignorar requests não-GET
  if (event.request.method !== 'GET') {
    event.respondWith(fetch(event.request));
    return;
  }

  // Cache-First para assets pesados (3D, imagens, áudio, CDN)
  const isRuntimeCacheable = RUNTIME_CACHE_PATTERNS.some(pattern => pattern.test(url.href));

  if (isRuntimeCacheable) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) return cachedResponse;

        return fetch(event.request).then(response => {
          if (!response || response.status !== 200) return response;

          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        }).catch(() => {
          // Offline fallback
          return new Response('Recurso indisponível offline', { status: 503 });
        });
      })
    );
    return;
  }

  // Stale-While-Revalidate para HTML/CSS/JS do app
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      const fetchPromise = fetch(event.request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

// ---- Mensagens do cliente ----
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
