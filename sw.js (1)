// ============================================================
// sw.js - Service Worker Principal (com OneSignal integrado)
// ============================================================

// OneSignal DEVE ser o primeiro import
importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');

const CACHE_NAME = 'wandy-cache-v2';
const urlsToCache = [
  '/Loja/',
  '/Loja/index.html',
  '/Loja/catalogo.html',
  '/Loja/produto.html',
  '/Loja/carrinho.html',
  '/Loja/checkout.html',
  '/Loja/confirmacao.html',
  '/Loja/rastrear.html',
  '/Loja/wishlist.html',
  '/Loja/promocoes.html',
  '/Loja/conta.html',
  '/Loja/sobre.html',
  '/Loja/personalizado.html',
  '/Loja/favicon.svg',
  '/Loja/manifest.json'
];

// ============================================================
// INSTALAR O SERVICE WORKER
// ============================================================
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// ============================================================
// ATIVAR O SERVICE WORKER
// ============================================================
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
  return self.clients.claim();
});

// ============================================================
// INTERCETAR PEDIDOS (CACHE FIRST)
// ============================================================
self.addEventListener('fetch', function(event) {
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(function(response) {
      if (response) {
        return response;
      }

      return fetch(event.request).then(function(response) {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch(function() {
        return new Response('Offline', { status: 503 });
      });
    })
  );
});

// Nota: push e notificationclick são geridos pelo OneSignal (importado no topo)
