/**
 * Point d'entrée du configurateur : relie le store, la scène 3D et les panneaux.
 */
import { qs, qsa, h, clear, isTouch } from './lib/dom.js';
import { icon, ENV_ICONS } from './lib/icons.js';
import { SITE, formatPrice } from './config.js';
import { ConfigStore } from './store/configStore.js';
import { ENVIRONMENTS } from './data/environments.js';
import { productById } from './data/catalog.js';
import { ConfiguratorScene } from './scene/Scene.js';
import { renderCatalogPanel } from './ui/catalogPanel.js';
import { renderSelectionPanel } from './ui/selectionPanel.js';
import { renderQuotePanel } from './ui/quotePanel.js';
import { createMobileFlow } from './ui/mobileFlow.js';
import { toast } from './ui/toast.js';
import { initShared } from './shared.js';
import { track } from './services/analytics.js';

initShared();

const store = new ConfigStore();
const canvas = qs('#scene');
const panels = { catalog: qs('#tab-catalog'), selection: qs('#tab-selection'), quote: qs('#tab-quote') };
const tabButtons = qsa('[data-tab-btn]');
let selectedUid = null;
let currentTab = 'catalog';
const formState = { name: '', phone: '', country: '', city: '', message: '', errors: {} };

/* ---------- scène ---------- */
let scene = null;
let sceneError = null;
try {
  scene = new ConfiguratorScene(canvas, {
    interactive: true,
    onSelect: (uid) => select(uid, true),
    onHover: () => {},
  });
  scene.onContextLost = () => toast('Affichage 3D interrompu par le navigateur. Rechargez la page si la maquette ne revient pas ; votre configuration est conservée.', 'error', 8000);
} catch (e) {
  sceneError = e;
  console.error('Scène 3D indisponible', e);
  qs('#scene-fallback').hidden = false;
}

/* ---------- téléphone : parcours guidé ---------- */
const MOBILE = window.matchMedia('(max-width: 760px)').matches;
let mflow = null;

/* ---------- état initial ---------- */
const restored = store.restore();
const params = new URLSearchParams(location.search);
if (params.get('pack') && !restored) {
  store.state.packId = null; // choosePack ajoute les composants proprement
  store.choosePack(params.get('pack'));
}
if (params.get('env') && !restored) store.setEnvironment(params.get('env'));
if (restored === 'url') toast('Configuration chargée depuis le lien partagé.', 'success');
else if (restored === 'local') toast('Votre configuration précédente a été restaurée.', 'info');

if (scene) { scene.setEnvironment(store.env); scene.sync(store.state.items); }

/* ---------- actions ---------- */
const actions = {
  select,
  goTab,
  remove(uid) {
    const it = store.item(uid); if (!it) return;
    store.removeItem(uid);
    toast(`${productById(it.productId).name} retiré de la maquette.`, 'info');
  },
  replace(uid, pid) {
    const r = store.replaceItem(uid, pid);
    if (!r.ok) toast(r.reason || 'Remplacement impossible.', 'error');
    else toast(`Remplacé par ${productById(pid).name}.`, 'success');
  },
  move: (uid, slotId) => store.moveItem(uid, slotId),
  setOption: (uid, opt, val) => store.setOption(uid, opt, val),
  focus: (uid) => { scene?.focusItem(uid); if (isTouch()) collapseSheet(); },
  saveVariant: (k) => { store.saveVariant(k); toast(`Configuration enregistrée en variante ${k}.`, 'success'); },
  loadVariant: (k) => { store.loadVariant(k); toast(`Variante ${k} chargée.`, 'success'); },
  deleteVariant: (k) => store.deleteVariant(k),
};

function select(uid, goToTab = false) {
  if (MOBILE) {
    // Téléphone : toucher un équipement dans la maquette le met simplement en évidence.
    const it = uid ? store.item(uid) : null;
    scene?.setSelected(it ? uid : null);
    if (it) toast(`${productById(it.productId).name} · ${store.env.slots.find((s) => s.id === it.slotId)?.label || ''}`, 'info', 2200);
    return;
  }
  selectedUid = uid && store.item(uid) ? uid : null;
  scene?.setSelected(selectedUid);
  if (selectedUid && goToTab) goTab('selection');
  else renderAll();
}

function goTab(tab) {
  currentTab = tab;
  for (const b of tabButtons) {
    const on = b.dataset.tabBtn === tab;
    b.classList.toggle('is-active', on);
    b.setAttribute('aria-selected', on ? 'true' : 'false');
  }
  for (const [k, el] of Object.entries(panels)) el.hidden = k !== tab;
  if (tab !== 'catalog') setSheet(true);
  renderAll();
  panels[tab].scrollTop = 0;
}

function onAdd(pid) {
  const r = store.addProduct(pid);
  if (!r.ok) { toast(r.reason, 'error'); return; }
  const p = productById(pid);
  const slot = store.env.slots.find((s) => s.id === r.item.slotId);
  toast(`${p.name} ajouté : ${slot.label.toLowerCase()}.`, 'success');
  selectedUid = r.item.uid;
  scene?.setSelected(selectedUid);
  scene?.focusItem(selectedUid);
  renderAll();
}

function onChoosePack(packId) {
  store.choosePack(packId);
  if (packId) { toast(`${store.pack.name} ajouté à la maquette.`, 'success'); scene?.setView('ensemble'); }
}

/* ---------- rendu ----------
   Chaque mutation du store émet un événement : l'interface et la scène se
   resynchronisent à partir de l'état, jamais à la main. */
track('ViewContent', { content_name: 'Configurateur 3D' });
let customized = false;
store.subscribe((state) => {
  if (!customized && (state.items || []).some((i) => !i.fromPack)) { customized = true; track('CustomizeProduct', { content_name: 'Configurateur 3D' }); }
});
store.subscribe((state, event) => {
  if (event.type === 'notes') return; // la saisie libre ne redessine pas le panneau (le focus resterait perdu)
  if (selectedUid && !store.item(selectedUid)) { selectedUid = null; scene?.setSelected(null); }
  renderAll();
});
let lastEnv = store.state.envId;
function renderAll() {
  // Annuler / rétablir / variantes peuvent changer la pièce : la scène suit.
  if (store.state.envId !== lastEnv) { lastEnv = store.state.envId; scene?.setEnvironment(store.env); }
  scene?.sync(store.state.items);
  renderEnvBar();
  renderCatalogPanel(panels.catalog, store, { onAdd, onChoosePack });
  renderSelectionPanel(panels.selection, store, selectedUid, actions);
  renderQuotePanel(panels.quote, store, { getSnapshot: () => scene?.snapshot(), goTab }, formState);
  renderPriceBar();
  renderHistory();
  qs('#count-selection').textContent = store.state.items.length;
  mflow?.render();
}

function renderEnvBar() {
  const bar = clear(qs('#envbar'));
  for (const env of ENVIRONMENTS) {
    bar.append(h('button', {
      type: 'button', class: `envchip ${env.id === store.state.envId ? 'is-active' : ''}`,
      'aria-pressed': env.id === store.state.envId ? 'true' : 'false', title: env.blurb,
      html: `${icon(ENV_ICONS[env.id])}<span>${env.name}</span>`,
      onClick: () => {
        if (env.id === store.state.envId) return;
        selectedUid = null;
        store.setEnvironment(env.id);
        toast(`${env.name} : ${env.blurb}`, 'info', 4000);
      },
    }));
  }
}

function renderPriceBar() {
  const p = store.pricing();
  qs('#price-total').textContent = p.lines.length ? `${p.hasFrom ? 'à partir de ' : ''}${formatPrice(p.total)}` : '—';
  qs('#price-note').textContent = !p.lines.length ? 'Ajoutez un pack ou des équipements'
    : p.quoteOnly.length ? `${p.count} équipement${p.count > 1 ? 's' : ''} · + ${p.quoteOnly.length} sur devis`
    : `${p.count} équipement${p.count > 1 ? 's' : ''} · estimation`;
}

function renderHistory() {
  qs('#btn-undo').disabled = !store.canUndo;
  qs('#btn-redo').disabled = !store.canRedo;
}

/* ---------- barre d'outils ---------- */
qs('#btn-undo').addEventListener('click', () => { selectedUid = null; scene?.setSelected(null); store.undo(); });
qs('#btn-redo').addEventListener('click', () => { selectedUid = null; scene?.setSelected(null); store.redo(); });
qs('#btn-reset').addEventListener('click', () => {
  if (!store.state.items.length && !store.state.packId) return;
  if (!confirm('Vider la maquette ? Vous pourrez annuler avec la flèche « Annuler ».')) return;
  selectedUid = null; scene?.setSelected(null); store.reset();
});
for (const b of qsa('[data-view]')) b.addEventListener('click', () => scene?.setView(b.dataset.view));
qs('#btn-quote').addEventListener('click', () => goTab('quote'));
for (const b of tabButtons) b.addEventListener('click', () => goTab(b.dataset.tabBtn));

// Sur mobile : le panneau est une feuille dépliable
const panel = qs('.cfg-panel');
function setSheet(open) {
  panel.classList.toggle('is-open', open);
  document.body.classList.toggle('sheet-open', open);
}
function collapseSheet() { setSheet(false); }
qs('#sheet-handle').addEventListener('click', () => setSheet(!panel.classList.contains('is-open')));
// Glisser vers le haut / le bas sur la poignée ou les onglets ouvre / ferme le panneau.
for (const el of [qs('#sheet-handle'), qs('.cfg-tabs')]) {
  let y0 = null;
  el.addEventListener('touchstart', (e) => { y0 = e.touches[0].clientY; }, { passive: true });
  el.addEventListener('touchend', (e) => {
    if (y0 == null) return;
    const dy = e.changedTouches[0].clientY - y0; y0 = null;
    if (dy < -24) setSheet(true); else if (dy > 24) setSheet(false);
  }, { passive: true });
}

// Raccourcis clavier
window.addEventListener('keydown', (e) => {
  if (e.target.matches('input, textarea, select')) return;
  if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); selectedUid = null; store.undo(); }
  if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); selectedUid = null; store.redo(); }
  if (e.key === 'Delete' && selectedUid) actions.remove(selectedUid);
  if (e.key === 'Escape') select(null);
});

goTab(params.get('tab') || 'catalog');
if (MOBILE) {
  document.body.classList.add('cfg-mobile');
  const host = h('section', { class: 'mflow', 'aria-label': 'Composer ma maison' });
  qs('.cfg').append(host);
  mflow = createMobileFlow(host, store, scene, { getSnapshot: () => scene?.snapshot(), formState });
  // Outils de la maquette : agrandir / réduire, recentrer, et une aide qui s'efface au premier geste.
  const stage = qs('.cfg-stage');
  const big = h('button', { type: 'button', class: 'mtool', 'aria-label': 'Agrandir la maquette', html: icon('expand') });
  big.addEventListener('click', () => {
    const on = document.body.classList.toggle('stage-big');
    big.innerHTML = icon(on ? 'shrink' : 'expand');
    big.setAttribute('aria-label', on ? 'Réduire la maquette' : 'Agrandir la maquette');
  });
  const recenter = h('button', { type: 'button', class: 'mtool', 'aria-label': 'Recentrer la vue', html: icon('home'), onClick: () => scene?.setView('ensemble') });
  const hint = h('div', { class: 'mhint' }, 'Glissez un doigt pour tourner la pièce');
  stage.append(h('div', { class: 'mtools' }, recenter, big), hint);
  // Bulle WhatsApp : posée sur la maquette (coin bas droit) pour ne pas gêner les étapes ni la barre du bas.
  const wa = qs('.wa-bubble'); if (wa) stage.append(wa);
  const hideHint = () => hint.classList.add('is-gone');
  scene?.controls.addEventListener('start', hideHint);
  setTimeout(hideHint, 6000);
}
if (isTouch() || window.innerWidth < 960) collapseSheet();
window.__nc = { store, scene }; // accès de débogage (sans effet pour les visiteurs)
qs('#draft-hint').hidden = !SITE.showDraftBanner;
if (sceneError) toast('La maquette 3D ne peut pas s’afficher sur cet appareil. La sélection et le devis restent disponibles.', 'error', 8000);
