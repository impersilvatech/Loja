// Service Worker — IMPERSILVATECH PWA
const CACHE_NAME = 'impersilva-v3';
const ASSETS = [
  '/',
  '/index.html',
  '/catalogo.html',
  '/produto.html',
  '/carrinho.html',
  '/checkout.html',
  '/confirmacao.html',
  '/conta.html',
  '/sobre.html',
  '/rastrear.html',
  '/admin.html',
  '/manifest.json',
  '/favicon.svg'
];

// Instalar — guardar recursos em cache
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS).catch(function() {});
    })
  );
  self.skipWaiting();
});

// Activar — limpar caches antigos
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

// Fetch — Cache First, depois Rede
self.addEventListener('fetch', function(event) {
  // Não cachear chamadas à API
  if (event.request.url.includes('/api/') || event.request.url.includes('workers.dev')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      if (cached) return cached;
      
      return fetch(event.request).then(function(response) {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, clone);
        });
        
        return response;
      }).catch(function() {
        // Se offline e não estiver em cache
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});