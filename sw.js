// Service Worker — IMPERSILVATECH PWA
const CACHE_NAME = 'impersilva-v3';
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
  '/Loja/admin.html',
  '/Loja/manifest.json',
  '/Loja/favicon.svg'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS).catch(function() {});
    })
  );
  self.skipWaiting();
});

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

self.addEventListener('fetch', function(event) {
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
        if (event.request.mode === 'navigate') {
          return caches.match('/Loja/index.html');
        }
      });
    })
  );
});