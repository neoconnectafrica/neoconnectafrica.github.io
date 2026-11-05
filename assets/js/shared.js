/** Comportements communs : bandeau provisoire, navigation, année du pied de page. */
import { qs, qsa, h } from './lib/dom.js';
import { initAnalytics } from './services/analytics.js';
import { SITE, waLink } from './config.js';
import { flag } from './lib/icons.js';

export function initShared() {
  initAnalytics();
  // Bandeau « visuels provisoires »
  if (SITE.showDraftBanner && !sessionStorage.getItem('nc.banner.closed')) {
    const banner = h('div', { class: 'draft-banner', role: 'note' },
      h('span', {}, 'Version de travail : visuels 3D et photos provisoires, en attente des éléments réels. Packs, équipements et prix conformes au brief NÉO-CONNECT.'),
      h('button', { type: 'button', class: 'draft-banner__close', 'aria-label': 'Fermer', onClick: () => { banner.remove(); sessionStorage.setItem('nc.banner.closed', '1'); document.documentElement.classList.remove('has-banner'); } }, '×'));
    document.body.prepend(banner);
    document.documentElement.classList.add('has-banner');
  }

  // Navigation mobile
  const nav = qs('.nav');
  const toggle = qs('.nav__toggle');
  if (nav && toggle) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.classList.toggle('nav-open', open);
    });
    for (const a of qsa('.nav__links a')) a.addEventListener('click', () => { nav.classList.remove('is-open'); document.body.classList.remove('nav-open'); toggle.setAttribute('aria-expanded', 'false'); });
  }
  const header = qs('.site-header');
  if (header) {
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 24);
    onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
  }

  // Liens WhatsApp génériques : <a data-wa="TG" data-wa-text="…">
  for (const a of qsa('[data-wa]')) {
    const c = SITE.countries.find((x) => x.code === a.dataset.wa);
    if (c) a.href = waLink(c, a.dataset.waText || '');
    a.target = '_blank'; a.rel = 'noopener';
  }

  for (const el of qsa('[data-year]')) el.textContent = new Date().getFullYear();

  initWhatsAppBubble();
}

/* ---------- Bulle « service client » WhatsApp, présente sur toutes les pages ---------- */
const WA_ICON = '<svg viewBox="0 0 32 32" aria-hidden="true"><path fill="currentColor" d="M16.04 3C8.86 3 3.03 8.82 3.03 16c0 2.29.6 4.53 1.74 6.5L3 29l6.68-1.75A12.95 12.95 0 0 0 16.04 29C23.2 29 29 23.18 29 16S23.2 3 16.04 3Zm0 23.7c-2 0-3.95-.54-5.66-1.55l-.4-.24-3.97 1.04 1.06-3.86-.26-.4A10.66 10.66 0 0 1 5.33 16c0-5.9 4.8-10.7 10.71-10.7 5.9 0 10.66 4.8 10.66 10.7 0 5.91-4.77 10.7-10.66 10.7Zm5.87-8.01c-.32-.16-1.9-.94-2.2-1.05-.29-.1-.5-.16-.72.16-.21.32-.83 1.05-1.01 1.26-.19.21-.37.24-.7.08-.32-.16-1.36-.5-2.59-1.6-.96-.85-1.6-1.9-1.79-2.22-.19-.32-.02-.5.14-.66.15-.14.32-.37.48-.56.16-.19.21-.32.32-.53.1-.21.05-.4-.03-.56-.08-.16-.72-1.74-.99-2.38-.26-.62-.52-.54-.72-.55h-.61c-.21 0-.56.08-.85.4-.29.32-1.12 1.09-1.12 2.66s1.15 3.09 1.31 3.3c.16.21 2.26 3.45 5.47 4.84.76.33 1.36.53 1.83.68.77.24 1.47.21 2.02.13.62-.09 1.9-.78 2.16-1.53.27-.75.27-1.39.19-1.53-.08-.13-.29-.21-.61-.37Z"/></svg>';
const WA_TEXT = 'Bonjour NÉO-CONNECT, j’ai une question sur la maison connectée.';

function initWhatsAppBubble() {
  if (qs('.wa-bubble')) return;
  let teaserSeen = false;
  try { teaserSeen = sessionStorage.getItem('nc.wa.teaser') === '1'; } catch { /* stockage indisponible */ }

  const close = () => { root.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); };
  const hideTeaser = () => { teaser.classList.remove('is-shown'); try { sessionStorage.setItem('nc.wa.teaser', '1'); } catch { /* rien */ } };

  const card = h('div', { class: 'wa-card', role: 'dialog', 'aria-label': 'Service client NÉO-CONNECT sur WhatsApp' },
    h('div', { class: 'wa-card__head' },
      h('span', { class: 'wa-card__avatar', html: WA_ICON }),
      h('span', { class: 'wa-card__who' }, h('strong', {}, 'Service client NÉO\u2011CONNECT'), h('small', {}, h('i', { class: 'wa-dot' }), 'Nous répondons sur WhatsApp')),
      h('button', { type: 'button', class: 'wa-card__close', 'aria-label': 'Fermer', onClick: close }, '×')),
    h('div', { class: 'wa-card__body' },
      h('p', { class: 'wa-msg' }, 'Bonjour 👋', h('br'), 'Une question sur votre maison connectée, un pack ou un devis ? Choisissez le conseiller de votre pays :'),
      h('div', { class: 'wa-card__list' },
        ...SITE.countries.map((c) => h('a', { class: 'wa-country', href: waLink(c, WA_TEXT), target: '_blank', rel: 'noopener', onClick: close },
          h('span', { html: flag(c.code) }), h('span', { class: 'wa-country__name' }, c.name), h('span', { class: 'wa-country__go', html: WA_ICON }))),
      ),
      h('p', { class: 'wa-card__note' }, 'Ailleurs en Afrique ? Écrivez au conseiller de votre choix, il vous répond.')),
  );
  const teaser = h('button', { type: 'button', class: 'wa-teaser', onClick: () => { hideTeaser(); open(); } },
    h('span', {}, 'Une question ? ', h('strong', {}, 'On vous répond sur WhatsApp')),
    h('span', { class: 'wa-teaser__x', 'aria-label': 'Masquer', onClick: (e) => { e.stopPropagation(); hideTeaser(); } }, '×'));
  const btn = h('button', { type: 'button', class: 'wa-fab', 'aria-label': 'Besoin d’aide ? Écrire à NÉO-CONNECT sur WhatsApp', 'aria-expanded': 'false', html: WA_ICON + '<span class="wa-fab__badge" aria-hidden="true" data-n="1"></span>' });
  const root = h('div', { class: 'wa-bubble' }, card, teaser, btn);
  function open() { root.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true'); root.classList.add('is-seen'); }
  btn.addEventListener('click', (e) => { e.stopPropagation(); hideTeaser(); root.classList.contains('is-open') ? close() : open(); });
  document.addEventListener('click', (e) => { if (root.classList.contains('is-open') && !root.contains(e.target)) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  document.body.append(root);
  // La bulle d'aide n'apparaît plus par-dessus le haut de page : seulement après un vrai défilement
  // (le visiteur a commencé à lire) ou au bout de 20 s, et jamais quand le formulaire de contact est à l'écran.
  if (!teaserSeen) {
    let shown = false;
    const show = () => {
      if (shown || root.classList.contains('is-open')) return;
      // pas par-dessus le formulaire de contact ni par-dessus les étapes de la démo 3D
      for (const sel of ['#contact', '#demo']) {
        const el = document.querySelector(sel);
        if (el) { const r = el.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) return; }
      }
      shown = true; teaser.classList.add('is-shown'); window.removeEventListener('scroll', onScroll);
      setTimeout(() => teaser.classList.remove('is-shown'), 10000); // disparaît seule ; le bouton WhatsApp reste
    };
    const onScroll = () => { if (window.scrollY > innerHeight * 0.9) show(); };
    window.addEventListener('scroll', onScroll, { passive: true });
    setTimeout(show, 20000);
  }
}
