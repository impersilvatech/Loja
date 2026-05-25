/**
 * Service Worker para Notificações Push
 * Gerencia cliques em notificações e eventos de push
 */

const CACHE_NAME = 'impersilva-admin-v1';
const ROUTES_TO_CACHE = [
  '/',
  '/admin.html',
  '/manifest.json'
];

// ===== INSTALAÇÃO =====
self.addEventListener('install', event => {
  console.log('[SW] Instalando...');
  self.skipWaiting();
});

// ===== ATIVAÇÃO =====
self.addEventListener('activate', event => {
  console.log('[SW] Ativando...');
  self.clients.claim();
});

// ===== NOTIFICAÇÕES - CLIQUE =====
self.addEventListener('notificationclick', event => {
  console.log('[SW] Clique na notificação:', event.notification.tag);
  event.notification.close();

  const data = event.notification.data || {};
  
  event.waitUntil((async () => {
    try {
      // Tentar focar uma aba existente
      const clients = await self.clients.matchAll({ type: 'window' });
      
      for (let client of clients) {
        if (client.url.includes('/admin') && 'focus' in client) {
          // Se é a página admin, enviar mensagem com os dados
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            data: data
          });
          return client.focus();
        }
      }

      // Se não encontrou, abrir nova aba
      if (self.clients.openWindow) {
        const url = new URL(data.url || '/admin.html', self.location.origin);
        return self.clients.openWindow(url);
      }
    } catch (e) {
      console.error('[SW] Erro ao processar clique:', e);
    }
  })());
});

// ===== NOTIFICAÇÕES - FECHAMENTO =====
self.addEventListener('notificationclose', event => {
  console.log('[SW] Notificação fechada:', event.notification.tag);
});

// ===== MENSAGENS DO CLIENTE =====
self.addEventListener('message', event => {
  const { type, data } = event.data;

  if (type === 'SHOW_NOTIFICATION') {
    self.registration.showNotification(data.title, data.options).catch(e => {
      console.error('[SW] Erro ao mostrar notificação:', e);
    });
  }
});

// ===== PUSH (se implementado futuramente com servidor) =====
self.addEventListener('push', event => {
  console.log('[SW] Push recebido');
  
  if (event.data) {
    try {
      const pushData = event.data.json();
      const title = pushData.title || 'Nova Notificação';
      const options = {
        body: pushData.body || '',
        icon: pushData.icon || '/favicon.svg',
        badge: pushData.badge || '/favicon.svg',
        tag: pushData.tag || 'default',
        requireInteraction: pushData.requireInteraction !== false,
        data: pushData.data || {}
      };

      event.waitUntil(
        self.registration.showNotification(title, options)
      );
    } catch (e) {
      console.error('[SW] Erro ao processar push:', e);
    }
  }
});

// ===== SINCRONIZAÇÃO EM BACKGROUND (opcional) =====
self.addEventListener('sync', event => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-orders') {
    event.waitUntil(syncOrders());
  }
});

async function syncOrders() {
  try {
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_ORDERS'
      });
    });
  } catch (e) {
    console.error('[SW] Erro ao sincronizar:', e);
  }
}

// ===== FETCH (para cache se necessário) =====
self.addEventListener('fetch', event => {
  // Deixar passar todos os requests
  // (pode adicionar cache strategy se necessário)
});
