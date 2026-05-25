/**
 * Sistema de Notificações Push Nativo (sem OneSignal)
 * Usa Notification API + Service Worker
 */

class NotificationsManager {
  constructor() {
    this.enabled = false;
    this.swRegistration = null;
    this.notifiedRefs = new Set();
    this.pollInterval = null;
    this.lastRevCount = 0;
    this.adminOpenedAt = Date.now();
    this.API_URL = window.API || 'https://api.impersilva.tech';
    
    this.loadNotifiedRefs();
  }

  // ===== INICIALIZAÇÃO =====
  async init() {
    try {
      // Verificar suporte
      if (!('serviceWorker' in navigator)) {
        console.warn('Service Workers nao sao suportados');
        return;
      }

      if (!('Notification' in window)) {
        console.warn('Notifications API nao suportada');
        return;
      }

      // Registar Service Worker
      this.swRegistration = await navigator.serviceWorker.register('notifications-sw.js', {
        scope: '/'
      });
      console.log('[NOTIF] Service Worker registado');

      // Restaurar estado anterior
      const savedState = localStorage.getItem('adm_notif') === '1';
      if (savedState) {
        await this.enable();
      } else {
        this.updateButton();
      }
    } catch (e) {
      console.error('[NOTIF] Erro ao inicializar:', e);
    }
  }

  // ===== PERMISSÕES =====
  async checkPermission() {
    if (!('Notification' in window)) return 'denied';
    return Notification.permission;
  }

  async requestPermission() {
    if (!('Notification' in window)) return false;
    
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    
    const perm = await Notification.requestPermission();
    return perm === 'granted';
  }

  // ===== ATIVAR/DESATIVAR =====
  async enable() {
    try {
      const ico = document.getElementById('notifIcon');
      if (ico) ico.className = 'fa-solid fa-spinner fa-spin';

      // Pedir permissão se necessário
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        this.toast('Permissão negada. Chrome: cadeado > Notificações > Permitir', 'error');
        this.updateButton();
        return;
      }

      // Subscrever a push (se suportado)
      if (this.swRegistration && this.swRegistration.pushManager) {
        try {
          const subscription = await this.swRegistration.pushManager.getSubscription();
          if (!subscription) {
            // Gerar subscription (nota: necessita VAPID key real se usares push do servidor)
            // Por enquanto apenas usa notificações locais
            console.log('[NOTIF] Modo notificações locais ativado');
          }
        } catch (e) {
          console.warn('[NOTIF] Erro ao subscrever push:', e);
        }
      }

      this.enabled = true;
      this.lastRevCount = (window.state?.avaliacoes || []).filter(a => !a.aprovada).length;
      localStorage.setItem('adm_clients_seen', String((window.state?.clientes || []).length));
      localStorage.setItem('adm_notif', '1');
      
      this.startPolling();
      this.updateButton();
      this.toast('Notificações ativadas!', 'success');
      
    } catch (err) {
      console.error('[NOTIF] Erro ao ativar:', err);
      this.toast('Erro: ' + (err.message || String(err)), 'error');
      this.updateButton();
    }
  }

  async disable() {
    this.enabled = false;
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    localStorage.setItem('adm_notif', '0');
    this.updateButton();
    this.toast('Notificações desativadas', 'info');
  }

  // ===== POLLING DE ENCOMENDAS =====
  startPolling() {
    if (this.pollInterval) clearInterval(this.pollInterval);

    // Snapshot inicial
    this.loadInitialOrders();

    // Primeiro poll após 5s
    setTimeout(() => {
      if (this.enabled && window.state?.token) {
        this.poll();
      }
    }, 5000);

    // Poll regular a cada 20s
    this.pollInterval = setInterval(() => {
      if (document.visibilityState === 'hidden') return;
      if (this.enabled && window.state?.token) {
        this.poll();
      }
    }, 20000);
  }

  loadInitialOrders() {
    fetch(this.API_URL + '/api/admin/encomendas', {
      headers: { 'Authorization': 'Bearer ' + (window.state?.token || '') }
    })
      .then(r => r.json())
      .then(orders => {
        if (Array.isArray(orders)) {
          orders.forEach(order => {
            const created = order.criado_em ? new Date(order.criado_em).getTime() : 0;
            // Marcar como vista se foi criada antes de abrir o admin (com margem de 10s)
            if (created < this.adminOpenedAt - 10000) {
              this.notifiedRefs.add('ord_' + order.ref);
            }
          });
          this.saveNotifiedRefs();
        }
      })
      .catch(e => console.warn('[NOTIF] Erro ao carregar initial orders:', e));
  }

  async poll() {
    try {
      const response = await fetch(this.API_URL + '/api/admin/encomendas', {
        headers: { 'Authorization': 'Bearer ' + (window.state?.token || '') }
      });

      if (!response.ok) return;

      const orders = await response.json();
      if (!Array.isArray(orders)) return;

      // Verificar novas encomendas
      for (const order of orders) {
        const refId = 'ord_' + order.ref;
        if (!this.notifiedRefs.has(refId)) {
          const created = order.criado_em ? new Date(order.criado_em).getTime() : 0;
          // Apenas notificar se foi criada após abrir o admin
          if (created >= this.adminOpenedAt) {
            this.showOrderNotification(order);
            this.notifiedRefs.add(refId);
          }
        }
      }

      // Verificar novas avaliações
      const currentRevCount = (window.state?.avaliacoes || []).filter(a => !a.aprovada).length;
      if (currentRevCount > this.lastRevCount) {
        const diff = currentRevCount - this.lastRevCount;
        this.showReviewNotification(diff);
        this.lastRevCount = currentRevCount;
      }

      this.saveNotifiedRefs();

    } catch (e) {
      console.warn('[NOTIF] Erro polling:', e);
    }
  }

  // ===== NOTIFICAÇÕES =====
  showOrderNotification(order) {
    const title = `📦 Nova Encomenda #${order.ref}`;
    const options = {
      body: `Cliente: ${order.cliente_nome || 'N/A'} • Total: ${order.total || '?'}`,
      icon: 'favicon.svg',
      badge: 'favicon.svg',
      tag: 'order_' + order.ref,
      requireInteraction: true,
      data: {
        type: 'order',
        orderId: order.id,
        orderRef: order.ref,
        url: '#/encomendas'
      }
    };

    this.showNotification(title, options);
  }

  showReviewNotification(count) {
    const title = `⭐ ${count} Nova${count > 1 ? 's' : ''} Avaliação${count > 1 ? 'ções' : ''}`;
    const options = {
      body: 'Clica para revisão',
      icon: 'favicon.svg',
      badge: 'favicon.svg',
      tag: 'reviews',
      requireInteraction: true,
      data: {
        type: 'review',
        url: '#/avaliacoes'
      }
    };

    this.showNotification(title, options);
  }

  showNotification(title, options = {}) {
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        // Tentar via Service Worker se disponível
        if (this.swRegistration) {
          this.swRegistration.showNotification(title, options).catch(e => {
            console.warn('[NOTIF] Erro no SW:', e);
            // Fallback para notificação simples
            new Notification(title, options);
          });
        } else {
          // Fallback direto
          new Notification(title, options);
        }
      }
    } catch (e) {
      console.warn('[NOTIF] Erro ao mostrar notificação:', e);
    }
  }

  // ===== TESTE =====
  async test() {
    if (!this.enabled) {
      this.toast('Ativa as notificações primeiro', 'error');
      return;
    }

    this.showNotification('Teste de Notificação', {
      body: 'Push API a funcionar! 🎉',
      icon: 'favicon.svg',
      badge: 'favicon.svg',
      requireInteraction: true,
      data: {
        type: 'test',
        url: location.href
      }
    });

    this.toast('Notificação de teste enviada', 'success');
  }

  // ===== UI =====
  updateButton() {
    const btn = document.getElementById('notifBtn');
    const ico = document.getElementById('notifIcon');
    
    if (!btn || !ico) return;

    if (this.enabled) {
      ico.className = 'fa-solid fa-bell';
      btn.style.borderColor = 'var(--teal)';
      btn.style.color = 'var(--teal)';
      btn.title = 'Notificações ativas — clica para desativar';
    } else {
      ico.className = 'fa-solid fa-bell-slash';
      btn.style.borderColor = '';
      btn.style.color = '';
      btn.title = 'Ativar notificações';
    }
  }

  toggle() {
    if (this.enabled) {
      this.disable();
    } else {
      this.enable();
    }
  }

  // ===== PERSISTÊNCIA =====
  loadNotifiedRefs() {
    const saved = localStorage.getItem('adm_notif_refs');
    if (saved) {
      try {
        this.notifiedRefs = new Set(JSON.parse(saved));
      } catch (e) {
        console.warn('[NOTIF] Erro ao carregar refs:', e);
      }
    }
  }

  saveNotifiedRefs() {
    localStorage.setItem('adm_notif_refs', JSON.stringify(Array.from(this.notifiedRefs)));
  }

  // ===== HELPERS =====
  toast(message, type = 'info') {
    // Chamar a função toast do admin se existir
    if (window.toast) {
      window.toast(message, type);
    } else {
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
  }
}

// Instância global
window.notificationsManager = null;

// Inicializar quando o documento estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.notificationsManager = new NotificationsManager();
    window.notificationsManager.init();
  });
} else {
  window.notificationsManager = new NotificationsManager();
  window.notificationsManager.init();
}
