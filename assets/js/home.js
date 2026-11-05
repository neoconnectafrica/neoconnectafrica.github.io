/**
 * Page d'accueil : apparitions, téléphone animé, démonstration 3D au défilement,
 * carrousel, détails dépliables, formulaire WhatsApp.
 */
import { qs, qsa, reduceMotion, isTouch } from './lib/dom.js';
import { initShared } from './shared.js';
import { SITE } from './config.js';
import { whatsappUrl, validateForm, resolveContact, submitToEndpoint } from './services/quote.js';
import { toast } from './ui/toast.js';
import { track } from './services/analytics.js';
import { DEMO_STEPS, VOICE_COMMANDS } from './data/content.js';

document.documentElement.classList.add('js');
initShared();
const motionOK = !reduceMotion();

// Icônes et drapeaux vectoriels (fiables sur tous les systèmes)
import('./lib/icons.js').then(({ icon, flag }) => {
  for (const el of qsa('[data-icon]')) el.innerHTML = icon(el.dataset.icon);
  for (const el of qsa('[data-flag]')) el.innerHTML = flag(el.dataset.flag);
});

/* ---------- apparitions au défilement ---------- */
const revealables = qsa('[data-reveal], [data-reveal-visual]');
const io = new IntersectionObserver((entries) => {
  for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
}, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
revealables.forEach((el) => {
  if (!motionOK) { el.classList.add('is-in'); return; }
  const siblings = Array.from(el.parentElement?.children || []).filter((c) => c.hasAttribute('data-reveal'));
  if (siblings.length > 1) el.style.transitionDelay = `${Math.min(siblings.indexOf(el), 6) * 80}ms`;
  io.observe(el);
});
let revealTick = false;
const revealSweep = () => {
  revealTick = false;
  const vh = window.innerHeight;
  for (const el of revealables) {
    if (el.classList.contains('is-in')) continue;
    // Tout ce qui est entré dans la fenêtre, ou déjà passé au-dessus, est révélé.
    if (el.getBoundingClientRect().top < vh * 0.95) el.classList.add('is-in');
  }
};
window.addEventListener('scroll', () => { if (!revealTick) { revealTick = true; requestAnimationFrame(revealSweep); } }, { passive: true });
window.addEventListener('load', () => setTimeout(revealSweep, 300));

/* ---------- en-tête : sombre sur les tuiles noires ---------- */
const header = qs('#site-header');
const darkSections = qsa('.hero, .tile--dark, .demo');
const syncHeader = () => {
  const y = window.scrollY + 30;
  header.classList.toggle('site-header--dark', darkSections.some((s) => y >= s.offsetTop && y < s.offsetTop + s.offsetHeight));
};
syncHeader();
window.addEventListener('scroll', syncHeader, { passive: true });

/* ---------- hero : téléphone qui s'allume tuile après tuile ---------- */
(() => {
  const tiles = qsa('.tile-app');
  if (!tiles.length) return;
  if (!motionOK) { tiles.forEach((t) => t.classList.add('is-on')); return; }
  const order = ['light', 'clim', 'tv', 'music', 'curtain'];
  let i = 0;
  const step = () => {
    const name = order[i % order.length];
    const tile = qs(`[data-tile="${name}"]`);
    if (i < order.length) tile.classList.add('is-on'); else tile.classList.remove('is-on');
    i = (i + 1) % (order.length * 2);
    setTimeout(step, i === 0 ? 2400 : 650);
  };
  setTimeout(step, 900);
  const curtainTile = qs('[data-tile="curtain"]');
  new MutationObserver(() => { curtainTile.querySelector('.tile-app__value').textContent = curtainTile.classList.contains('is-on') ? 'Fermés' : 'Ouverts'; })
    .observe(curtainTile, { attributes: true, attributeFilter: ['class'] });
})();

/* ---------- hero : état final garanti après l'entrée ---------- */
setTimeout(() => qs('.hero')?.classList.add('is-settled'), 2600);
document.addEventListener('visibilitychange', () => { if (!document.hidden) qs('.hero')?.classList.add('is-settled'); });

/* ---------- fondu du visuel du hero au défilement ----------
   Remplace GSAP + ScrollTrigger (≈ 3,6 s de calcul sur un mobile moyen) par
   quelques lignes : même effet, calculé seulement pendant que le hero est visible. */
(() => {
  const hero = qs('.hero'); const vis = qs('.hero__visual');
  if (!motionOK || !hero || !vis) return;
  let ticking = false, active = true;
  const update = () => {
    ticking = false;
    const r = hero.getBoundingClientRect(); const vh = window.innerHeight;
    // départ : bas du hero à 90 % de l'écran ; fin : bas du hero à 20 %
    const t = Math.min(1, Math.max(0, (vh * 0.9 - r.bottom) / (vh * 0.7)));
    vis.style.transform = t ? `translate3d(0, ${(t * 10).toFixed(2)}%, 0)` : '';
    vis.style.opacity = t ? String(1 - t * 0.65) : '';
  };
  const onScroll = () => { if (active && !ticking) { ticking = true; requestAnimationFrame(update); } };
  new IntersectionObserver(([e]) => { active = e.isIntersecting; if (active) onScroll(); }).observe(hero);
  window.addEventListener('scroll', onScroll, { passive: true });
})();

/* ---------- « En savoir plus » : détails dépliables ---------- */
for (const btn of qsa('[data-toggle]')) {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    const panel = qs(`#${btn.dataset.toggle}`);
    const open = panel.hidden;
    panel.hidden = !open;
    btn.textContent = open ? 'Réduire' : 'En savoir plus';
    if (open) {
      panel.classList.remove('is-in'); panel.setAttribute('data-reveal', '');
      requestAnimationFrame(() => panel.classList.add('is-in'));
    }
  });
}

/* ---------- vidéos ----------
   Lecture automatique, silencieuse et en boucle quand la vidéo est visible ;
   pause dès qu'elle sort de l'écran. Si l'utilisateur limite le mouvement ou
   économise ses données, on retombe sur une lecture au clic. Un bouton active le son. */
const saveData = navigator.connection?.saveData === true;
const autoplayOK = motionOK && !saveData;
const videoIO = new IntersectionObserver((entries) => {
  for (const e of entries) {
    const video = e.target;
    if (e.isIntersecting) video.play().catch(() => {}); else video.pause();
  }
}, { threshold: 0.35 });
for (const box of qsa('[data-video]')) {
  const video = box.querySelector('video');
  const play = box.querySelector('.vid__play');
  const sound = box.querySelector('.vid__sound');
  const auto = box.hasAttribute('data-autoplay') && autoplayOK;
  if (auto) {
    box.classList.add('is-auto', 'is-playing');
    video.muted = true;
    videoIO.observe(video);
  } else {
    video.preload = 'none';
    video.loop = false;
  }
  play?.addEventListener('click', () => {
    box.classList.add('is-playing');
    video.controls = true;
    video.play().catch(() => {});
  });
  sound?.addEventListener('click', () => {
    video.muted = !video.muted;
    sound.setAttribute('aria-pressed', video.muted ? 'false' : 'true');
    sound.setAttribute('aria-label', video.muted ? 'Activer le son' : 'Couper le son');
    box.classList.toggle('has-sound', !video.muted);
    if (video.paused) video.play().catch(() => {});
  });
  video.addEventListener('ended', () => { if (!auto) { box.classList.remove('is-playing'); video.controls = false; } });
}

/* ---------- compteurs ---------- */
for (const el of qsa('[data-count]')) {
  const target = parseInt(el.dataset.count, 10);
  const fmt = (n) => `${new Intl.NumberFormat('fr-FR').format(Math.round(n)).replace(/ | /g, ' ')} FCFA`;
  const obs = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) return;
    obs.disconnect();
    if (!motionOK) { el.textContent = fmt(target); return; }
    const t0 = performance.now(), dur = 1400;
    const tick = (t) => { const k = Math.min(1, (t - t0) / dur); const e = 1 - Math.pow(1 - k, 3); el.textContent = fmt(target * e); if (k < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }, { threshold: 0.6 });
  obs.observe(el);
}

/* ---------- carrousel « Pourquoi » ---------- */
(() => {
  const track = qs('[data-carousel]');
  if (!track) return;
  const cardW = () => (track.firstElementChild?.getBoundingClientRect().width || 300) + 16;
  qs('[data-carousel-prev]')?.addEventListener('click', () => track.scrollBy({ left: -cardW(), behavior: motionOK ? 'smooth' : 'auto' }));
  qs('[data-carousel-next]')?.addEventListener('click', () => track.scrollBy({ left: cardW(), behavior: motionOK ? 'smooth' : 'auto' }));
})();

/* ---------- démonstration 3D : canvas collant, étapes au défilement ----------
   La scène 3D (Three.js) ne se charge que lorsque la section approche de l'écran :
   l'arrivée sur la page reste rapide, surtout en 3G/4G. */
const startDemo = async () => {
  const canvas = qs('#demo-scene');
  const section = qs('.demo');
  if (!canvas || !section) return;
  const steps = qsa('.demo__step');
  const dots = qsa('.demo__dots i');
  let scene = null, store = null;
  try {
    const [{ ConfiguratorScene }, { ConfigStore }, { environmentById }] = await Promise.all([
      import('./scene/Scene.js'), import('./store/configStore.js'), import('./data/environments.js'),
    ]);
    store = new ConfigStore({ persist: false });
    store.choosePack('premium');
    // Démo de la page d'accueil : la maquette tourne seule et ne capte AUCUN geste (molette, doigt, souris),
    // pour que la page défile librement sur ordinateur comme sur téléphone. L'interaction se fait dans le configurateur.
    scene = new ConfiguratorScene(canvas, { interactive: false, autoRotate: true, quality: 'low', fitPortrait: false });
    scene.controls.disconnect();
    canvas.style.touchAction = 'auto';
    // Rendu en pause dès que la section n'est plus à l'écran (sinon la carte graphique tourne en continu).
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => scene.setPaused(!e.isIntersecting), { rootMargin: '100px 0px' }).observe(section);
    }
    scene.onContextLost = () => { qs('#demo-fallback').hidden = false; };
    scene.onContextRestored = () => { qs('#demo-fallback').hidden = true; };
    scene.setEnvironment(environmentById('salon'));
    scene.sync(store.state.items);
    scene.camera.position.set(3.6, 2.3, 5.2); scene.controls.target.set(-0.4, 0.9, -0.6); scene.controls.update();
  } catch (e) {
    console.warn('Démo 3D indisponible', e);
    qs('#demo-fallback').hidden = false;
  }
  let current = -1;
  const apply = (idx) => {
    if (idx === current) return;
    current = idx;
    steps.forEach((s, i) => s.classList.toggle('is-active', i === idx));
    dots.forEach((d, i) => d.classList.toggle('is-active', i === idx));
    if (store && scene) {
      for (const a of DEMO_STEPS[idx].actions) store.setOptionForProduct(a.product, a.option, a.value);
      scene.sync(store.state.items);
    }
  };
  steps.forEach((s, i) => s.addEventListener('click', () => apply((i + 1) % steps.length)));
  apply(0);

  // Commandes vocales : chaque phrase pilote réellement la maquette (comme Alexa piloterait la maison).
  const voiceHost = qs('#demo-voice');
  if (voiceHost && store && scene) {
    for (const cmd of VOICE_COMMANDS) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'voice-btn'; b.textContent = `« ${cmd.text} »`;
      b.addEventListener('click', () => {
        for (const a of cmd.actions) store.setOptionForProduct(a.product, a.option, a.value);
        scene.sync(store.state.items);
        b.classList.add('is-said'); setTimeout(() => b.classList.remove('is-said'), 900);
        toast(`« ${cmd.text} » · c'est fait.`, 'success', 1800);
      });
      voiceHost.append(b);
    }
  }
  if (!motionOK) return;
  // La section mesure plusieurs écrans ; la progression du défilement choisit l'étape.
  const onScroll = () => {
    const r = section.getBoundingClientRect();
    const travel = r.height - window.innerHeight;
    if (travel <= 0) return;
    const p = Math.min(1, Math.max(0, -r.top / travel));
    apply(Math.min(steps.length - 1, Math.floor(p * steps.length)));
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
};
(() => {
  const section = qs('.demo');
  if (!section) return;
  if (!('IntersectionObserver' in window)) { startDemo(); return; }
  const lazy = new IntersectionObserver(([e]) => { if (e.isIntersecting) { lazy.disconnect(); startDemo(); } }, { rootMargin: '900px 0px' });
  lazy.observe(section);
})();

/* ---------- formulaire de contact → WhatsApp ---------- */
const form = qs('#contact-form');
form?.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form).entries());
  const errors = validateForm(data);
  for (const el of qsa('.field', form)) {
    const name = el.querySelector('[name]')?.name;
    el.classList.toggle('has-error', !!errors[name]);
    const err = el.querySelector('.field__error');
    if (err) err.textContent = errors[name] || '';
  }
  if (Object.keys(errors).length) { toast('Vérifiez les champs signalés.', 'error'); return; }
  const { countryName, advisor } = resolveContact(data);
  const text = ['Bonjour NÉO-CONNECT, je souhaite être rappelé(e).', `Nom : ${data.name}`, `Téléphone : ${data.phone}`, `Pays : ${countryName}`, data.message ? `Projet : ${data.message}` : null].filter(Boolean).join('\n');
  window.open(whatsappUrl(advisor.code, text), '_blank', 'noopener');
  track('Lead', { content_name: 'Formulaire de contact', content_category: countryName });
  toast(`WhatsApp s'ouvre avec votre message pour le conseiller ${advisor.name}.`, 'success', 5000);
  // En plus de WhatsApp : copie à NÉO-CONNECT par e-mail si un service de réception est configuré (integrations/README.md).
  if (SITE.quoteEndpoint) {
    const form = { name: data.name, phone: data.phone, country: data.country, countryName, advisor: advisor.code, city: '', message: data.message || '' };
    submitToEndpoint({ source: 'contact', form, recap: text, link: location.href.split('#')[0] })
      .then((res) => { if (res.ok) toast('Votre demande a aussi été transmise à NÉO-CONNECT par e-mail.', 'success', 4000); else console.warn('Envoi e-mail du formulaire de contact impossible', res); });
  }
});
// « Autre pays d'Afrique » : champs complémentaires
const countrySel = form?.querySelector('[name="country"]');
countrySel?.addEventListener('change', () => { for (const el of qsa('[data-other-country]', form)) el.hidden = countrySel.value !== 'OTHER'; });
void SITE;

qs('.nav__wa')?.addEventListener('click', (e) => { e.preventDefault(); qs('#contact').scrollIntoView({ behavior: motionOK ? 'smooth' : 'auto' }); });

/* ---------- barre fixe téléphone (bouton 3D) : visible dès que le bouton du haut n'est plus à l'écran ---------- */
(() => {
  const bar = qs('#mcta');
  if (!bar || !('IntersectionObserver' in window)) { bar?.classList.add('is-shown'); return; }
  // Masquée tant que l'accueil (avec son bouton), la démonstration 3D ou la zone contact sont à l'écran.
  const blockers = ['.hero .tile__actions', '#demo .demo__sticky', '#contact'].map((s) => qs(s)).filter(Boolean);
  const visible = new Set();
  const update = () => {
    const show = visible.size === 0;
    bar.classList.toggle('is-shown', show);
  };
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) e.isIntersecting ? visible.add(e.target) : visible.delete(e.target);
    update();
  }, { threshold: 0.05 });
  blockers.forEach((el) => io.observe(el));

})();
