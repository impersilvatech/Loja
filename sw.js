// Service Worker — IMPERSILVATECH PWA (OTIMIZADO)
const CACHE_NAME = 'impersilva-v4';
const ASSETS = [
  '/Loja/',
  '/Loja/index.html',
  '/Loja/catalogo.html',
  '/Loja/produto.html',
  '/Loja/carrinho.html',
  '/Loja/checkout.html',
  '/Loja/confirmacao.html',
  '/Loja/conta.html',
  '/Loja/sobre.html',
  '/Loja/rastrear.html',
  '/Loja/manifest.json',
  '/Loja/favicon.svg'
];

// Instalar
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS).catch(function() {});
    })
  );
  self.skipWaiting();
});

// Activar
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== CACHE_NAME; })
        .map(function(key) { return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

// Fetch — Stale-While-Revalidate (rápido + atualizado)
self.addEventListener('fetch', function(event) {
  // API — não cachear
  if (event.request.url.includes('/api/') || event.request.url.includes('workers.dev')) {
    return;
  }
  
  // CDNs — cache por 30 dias
  if (event.request.url.includes('cdnjs.cloudflare.com') ||
    event.request.url.includes('fonts.googleapis.com') ||
    event.request.url.includes('fonts.gstatic.com') ||
    event.request.url.includes('jsdelivr.net')) {
    event.respondWith(
      caches.match(event.request).then(function(cached) {
        return cached || fetch(event.request).then(function(response) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, clone);
          });
          return response;
        });
      })
    );
    return;
  }
  
  // HTML e assets locais — Cache First (instantâneo)
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      // Servir do cache imediatamente
      var fetchPromise = fetch(event.request).then(function(response) {
        if (response && response.status === 200) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, clone);
          });
        }
        return response;
      }).catch(function() {
        return cached;
      });
      
      // Retornar cache primeiro, atualizar em background
      return cached || fetchPromise;
    })
  );
});