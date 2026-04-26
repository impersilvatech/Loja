/**
 * app.js — IMPERSILVATECH
 * Funções partilhadas por todas as páginas
 */

var API_BASE = 'https://impersilva-d1work.3miliosilva.workers.dev';

/* ── Tema ── */
function initTheme() {
  var t = localStorage.getItem('tema') || 'dark';
  document.documentElement.setAttribute('data-theme', t);
}

function toggleTheme() {
  var t = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('tema', t);
  syncThemeIcons();
}

function syncThemeIcons() {
  var t = document.documentElement.getAttribute('data-theme') || 'dark';
  var ico = t === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
  document.querySelectorAll('[data-theme-ico]').forEach(function(el) {
    el.className = ico;
  });
}

/* ── Carrinho ── */
function getCarrinho() {
  try { return JSON.parse(localStorage.getItem('cf_carrinho') || '[]'); } catch (e) { return []; }
}
function salvarCarrinho(c) {
  localStorage.setItem('cf_carrinho', JSON.stringify(c));
}
function limparCarrinho() {
  localStorage.removeItem('cf_carrinho');
}
function qtdCarrinho() {
  return getCarrinho().reduce(function(s, i) { return s + (i.quantidade || 1); }, 0);
}

/* ── Wishlist ── */
function getWishlist() {
  try { return JSON.parse(localStorage.getItem('cf_wl') || '[]'); } catch (e) { return []; }
}
function isWishlisted(id) {
  return getWishlist().indexOf(String(id)) >= 0;
}
function toggleWishlist(id) {
  var wl = getWishlist();
  var idx = wl.indexOf(String(id));
  if (idx >= 0) {
    wl.splice(idx, 1);
    localStorage.setItem('cf_wl', JSON.stringify(wl));
    return false;
  } else {
    wl.push(String(id));
    localStorage.setItem('cf_wl', JSON.stringify(wl));
    return true;
  }
}

/* ── Cliente ── */
function getCliente() {
  try { return JSON.parse(localStorage.getItem('cf_cliente') || 'null'); } catch (e) { return null; }
}
function getToken() {
  return localStorage.getItem('cf_token') || '';
}

/* ── Formatação ── */
function kz(valor, simbolo) {
  if (valor == null) return '—';
  var sym = simbolo || 'Kz';
  return sym + ' ' + Number(valor).toLocaleString('pt');
}

function fmtData(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt', { day: '2-digit', month: 'short', year: 'numeric' });
}

/* ── Toast ── */
var _toastTimer = null;
function toast(msg, tipo) {
  clearTimeout(_toastTimer);
  var el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.className = 'toast show ' + (tipo || 'ok');
  _toastTimer = setTimeout(function() {
    el.classList.remove('show');
  }, 3200);
}

/* ── Badge do Carrinho ── */
function atualizarBadgeCarrinho() {
  var q = qtdCarrinho();
  document.querySelectorAll('.hb-b, .nl-b').forEach(function(b) {
    b.textContent = q;
    b.classList.toggle('on', q > 0);
  });
}

/* ── URL Params ── */
function getParam(nome) {
  return new URLSearchParams(window.location.search).get(nome);
}

/* ── Partilha ── */
function partilharProduto(dados) {
  var url = dados.url || window.location.href;
  var nome = dados.nome || document.title;
  var descricao = dados.descricao || '';
  if (navigator.share) {
    navigator.share({ title: nome, text: descricao || nome, url: url }).catch(function() {});
  } else {
    copiarLink(url);
  }
}

function copiarLink(url) {
  url = url || window.location.href;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(function() {
      toast('Link copiado!', 'ok');
    });
  }
}

/* ── Meta Tags ── */
function definirMetaTags(dados) {
  var titulo = dados.titulo || document.title;
  var descricao = dados.descricao || '';
  var imagem = dados.imagem || 'favicon.svg';
  var url = dados.url || window.location.href;

  function setMeta(propriedade, conteudo) {
    var el = document.querySelector('meta[property="' + propriedade + '"]');
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute('property', propriedade);
      document.head.appendChild(el);
    }
    el.setAttribute('content', conteudo);
  }

  setMeta('og:title', titulo);
  setMeta('og:description', descricao);
  setMeta('og:image', imagem);
  setMeta('og:url', url);
  setMeta('og:type', 'website');
}

/* ── Init ── */
document.addEventListener('DOMContentLoaded', function() {
  initTheme();
  syncThemeIcons();
  atualizarBadgeCarrinho();
});
