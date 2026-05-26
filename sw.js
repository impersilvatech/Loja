// ============================================================
// sw.js — Service Worker Principal (Web Push API Nativa)
// ============================================================

const CACHE_NAME = 'wandy-cache-v3';
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
// INSTALAR
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
// ATIVAR
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
// FETCH (Cache First)
// ============================================================
self.addEventListener('fetch', function(event) {
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(function(response) {
      if (response) return response;

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

// ============================================================
// PUSH — receber notificação do servidor
// ============================================================
self.addEventListener('push', function(event) {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch(e) {
    data = { titulo: 'Nova notificação', mensagem: event.data ? event.data.text() : '' };
  }

  const titulo   = data.titulo   || 'Admin';
  const mensagem = data.mensagem || '';
  const url      = data.url      || '/Loja/admin.html';
  const icone    = data.icone    || '/Loja/favicon.svg';

  const options = {
    body: mensagem,
    icon: icone,
    badge: icone,
    data: { url: url },
    vibrate: [200, 100, 200],
    requireInteraction: false,
    tag: data.tag || 'admin-notif'
  };

  event.waitUntil(
    self.registration.showNotification(titulo, options)
  );
});

// ============================================================
// NOTIFICATIONCLICK — abrir o admin ao clicar na notificação
// ============================================================
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const urlDestino = (event.notification.data && event.notification.data.url)
    ? event.notification.data.url
    : '/Loja/admin.html';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      /* Se já há uma janela aberta, focar nela */
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url.includes('admin') && 'focus' in client) {
          return client.focus();
        }
      }
      /* Senão, abrir nova janela */
      if (clients.openWindow) {
        return clients.openWindow(urlDestino);
      }
    })
  );
});
