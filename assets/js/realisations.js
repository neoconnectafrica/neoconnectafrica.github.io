/** Section « Réalisations » : cartes vidéo renvoyant vers TikTok. */
import { REALISATIONS, TIKTOK_PROFILE, TIKTOK_STATS, videoUrl } from './data/realisations.js';

const strip = document.querySelector('#works-strip');
if (strip) {
  strip.innerHTML = '';
  for (const r of REALISATIONS) {
    const a = document.createElement('a');
    a.className = 'work';
    a.href = videoUrl(r.id);
    a.target = '_blank'; a.rel = 'noopener';
    // Pas d'aria-label : le texte visible (étiquette, titre, « Voir sur TikTok ») sert de nom accessible.
    a.innerHTML = `
      <img class="work__img" src="assets/img/tiktok/${r.id}.avif" alt="" loading="lazy" width="720" height="720" onerror="this.parentElement.classList.add('is-noimg')" />
      <span class="work__play" aria-hidden="true"></span>
      <span class="work__tag">${r.tag}</span>
      <span class="work__body">
        <span class="work__title">${r.title}</span>
        <span class="work__meta">${r.views ? `${r.views} vues · ` : ''}Voir sur TikTok ›<span class="sr-only"> (nouvel onglet)</span></span>
      </span>`;
    strip.append(a);
  }
  const more = document.createElement('a');
  more.className = 'work work--more';
  more.href = TIKTOK_PROFILE; more.target = '_blank'; more.rel = 'noopener';
  more.innerHTML = `<span class="work__body"><span class="work__title">Toutes nos réalisations</span><span class="work__meta">${TIKTOK_STATS.handle} · ${TIKTOK_STATS.followers} abonnés</span></span>`;
  strip.append(more);
}
for (const el of document.querySelectorAll('[data-tiktok-followers]')) el.textContent = TIKTOK_STATS.followers;
for (const el of document.querySelectorAll('[data-tiktok-likes]')) el.textContent = TIKTOK_STATS.likes;

/* ---------- avis clients (masqués tant qu'il n'y en a pas) ---------- */
import('./data/reviews.js').then(({ REVIEWS }) => {
  const section = document.querySelector('#avis');
  const list = document.querySelector('#reviews-list');
  if (!section || !list || !REVIEWS.length) return;
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  list.innerHTML = REVIEWS.map((r) => `
    <figure class="review">
      <blockquote class="review__text">« ${esc(r.text)} »</blockquote>
      <figcaption class="review__who">
        ${r.photo ? `<img class="review__photo" src="${esc(r.photo)}" alt="" width="48" height="48" loading="lazy" decoding="async" />` : ''}
        <span><strong>${esc(r.name)}</strong><small>${esc([r.city, r.pack].filter(Boolean).join(' · '))}</small></span>
      </figcaption>
    </figure>`).join('');
  section.hidden = false;
});
