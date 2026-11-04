/** Comportements communs : bandeau provisoire, navigation, année du pied de page. */
import { qs, qsa, h } from './lib/dom.js';
import { SITE, waLink } from './config.js';

export function initShared() {
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
}
