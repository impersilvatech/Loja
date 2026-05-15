// ============================================================
// sw.js - Service Worker Principal (COMPLETO e ATUALIZADO)
// ============================================================

const CACHE_NAME = 'wandy-cache-v1';
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
  '/Loja/manifest.json',
  '/Loja/OneSignalSDKWorker.js'
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
  // Forçar ativação imediata
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
  // Assumir controlo imediato das páginas
  return self.clients.claim();
});

// ============================================================
// INTERCETAR PEDIDOS (CACHE FIRST)
// ============================================================
self.addEventListener('fetch', function(event) {
  // Ignorar pedidos para a API
  if (event.request.url.includes('/api/')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request).then(function(response) {
      // Se estiver em cache, devolve
      if (response) {
        return response;
      }
      
      // Se não estiver, faz o fetch e guarda em cache
      return fetch(event.request).then(function(response) {
        // Verifica se a resposta é válida
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        
        // Clona a resposta para cache
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, responseToCache);
        });
        
        return response;
      }).catch(function() {
        // Se falhar, devolve uma página de erro offline (opcional)
        return new Response('Offline', { status: 503 });
      });
    })
  );
});

// ============================================================
// RECEBER NOTIFICAÇÕES PUSH DO ONESIGNAL
// ============================================================
self.addEventListener('push', function(event) {
  try {
    const data = event.data.json();
    const options = {
      body: data.body || 'Tem uma nova encomenda ou atualização!',
      icon: '/Loja/favicon.svg',
      badge: '/Loja/favicon.svg',
      vibrate: [200, 100, 200],
      tag: 'notification-' + Date.now(), // Evita notificações duplicadas
      data: {
        url: data.url || '/Loja/admin.html'
      }
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'IMPERSILVATECH', options)
    );
  } catch (e) {
    // Fallback simples
    event.waitUntil(
      self.registration.showNotification('Nova encomenda!', {
        body: 'Verifique o painel de administração.',
        icon: '/Loja/favicon.svg',
        badge: '/Loja/favicon.svg'
      })
    );
  }
});

// ============================================================
// AO CLICAR NA NOTIFICAÇÃO
// ============================================================
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  const url = event.notification.data?.url || '/Loja/admin.html';
  
  event.waitUntil(
    clients.openWindow(url)
  );
});
