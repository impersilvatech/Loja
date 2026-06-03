// ============================================================
// config.js — Configuração do Site
// Este é o ÚNICO ficheiro que muda de site para site.
// Editável pelo painel admin em "Editar Site".
// ============================================================

window.SITE_CONFIG = {
  api_url:    "https:impersilva-d1work.3miliosilva.workers.dev",   // URL do Worker Cloudflare
  slug:       "impersilva-d1work",                        // slug do repositório GitHub
  gh_user:    "impersilvatech",              // GitHub user/org
  nome:       "Nome da Loja",                // Nome para manifest.json
  short_name: "Loja",                        // Nome curto para manifest.json
  descricao:  "A melhor loja online",        // Descrição para manifest.json
  cor_fundo:  "#0d0d1a",                     // Cor de fundo (theme_color)
};

// Atalho global usado por todos os ficheiros HTML
window.SITE_API = window.SITE_CONFIG.api_url;
