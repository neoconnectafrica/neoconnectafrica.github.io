/**
 * Configurateur sur téléphone : parcours guidé en 4 étapes sous la maquette 3D.
 * ① Pièce → ② Pack → ③ Équipements (boutons − / +) → ④ Envoyer (récapitulatif + WhatsApp).
 * La maquette reste visible en haut ; chaque ajout montre l'équipement en 3D.
 */
import { h, clear } from '../lib/dom.js';
import { icon, PRODUCT_ICONS, ENV_ICONS } from '../lib/icons.js';
import { formatPrice } from '../config.js';
import { CATEGORIES, PRODUCTS, PACKS } from '../data/catalog.js';
import { ENVIRONMENTS } from '../data/environments.js';
import { renderQuotePanel } from './quotePanel.js';
import { toast } from './toast.js';

const STEPS = [
  { id: 1, label: 'Pièce' },
  { id: 2, label: 'Pack' },
  { id: 3, label: 'Équipements' },
  { id: 4, label: 'Envoyer' },
];

export function createMobileFlow(root, store, scene, { getSnapshot, formState }) {
  let step = store.state.items.length ? 3 : 1;
  let returnTimer = null;

  // Ossature fixe : seules les zones internes sont redessinées (le défilement est conservé).
  const stepsNav = h('nav', { class: 'mflow__steps', 'aria-label': 'Étapes' });
  const body = h('div', { class: 'mflow__body' });
  const bar = h('div', { class: 'mflow__bar' });
  clear(root).append(stepsNav, body, bar);

  const go = (n) => {
    step = Math.max(1, Math.min(4, n));
    render();
    body.scrollTop = 0;
    if (step === 3 || step === 1) scene?.setView('ensemble');
  };

  const showInScene = (uid) => {
    if (!scene) return;
    clearTimeout(returnTimer);
    scene.setSelected(uid);
    scene.focusItem(uid);
    // Retour automatique à la vue d'ensemble pour garder une lecture claire de la pièce.
    returnTimer = setTimeout(() => { scene.setSelected(null); scene.setView('ensemble'); }, 2600);
  };

  function render() {
    renderSteps();
    clear(body);
    if (step === 1) renderRooms();
    else if (step === 2) renderPacks();
    else if (step === 3) renderProducts();
    else renderSend();
    renderBar();
  }

  function renderSteps() {
    clear(stepsNav);
    for (const s of STEPS) {
      stepsNav.append(h('button', {
        type: 'button', class: `mstep ${s.id === step ? 'is-active' : ''} ${s.id < step ? 'is-done' : ''}`,
        'aria-current': s.id === step ? 'step' : null,
        onClick: () => go(s.id),
        html: `<b>${s.id < step ? '✓' : s.id}</b><span>${s.label}</span>`,
      }));
    }
  }

  const head = (title, lead) => [h('h2', { class: 'mflow__title' }, title), lead ? h('p', { class: 'mflow__lead' }, lead) : null];

  function renderRooms() {
    body.append(...head('Quelle pièce équiper ?', 'Touchez une pièce : elle s’affiche dans la maquette au-dessus.'));
    for (const env of ENVIRONMENTS) {
      const active = env.id === store.state.envId;
      body.append(h('button', {
        type: 'button', class: `mcard ${active ? 'is-active' : ''}`, 'aria-pressed': active ? 'true' : 'false',
        onClick: () => { if (!active) store.setEnvironment(env.id); },
      },
        h('span', { class: 'mcard__icon', html: icon(ENV_ICONS[env.id]) }),
        h('span', { class: 'mcard__text' }, h('strong', {}, env.name), h('small', {}, env.blurb)),
        h('span', { class: 'mcard__check', html: active ? icon('check') : '' })));
    }
  }

  function renderPacks() {
    const env = store.env;
    if (!env.packsAvailable) {
      body.append(...head('Pas de pack pour cette pièce', `Les packs concernent le salon. Pour la ${env.name.toLowerCase()}, choisissez directement vos équipements à l’étape suivante.`));
      return;
    }
    body.append(...head('Choisissez un pack', 'Le pack s’installe directement dans la maquette. Vous pourrez ajouter d’autres équipements ensuite.'));
    for (const p of PACKS) {
      const active = store.state.packId === p.id;
      body.append(h('button', {
        type: 'button', class: `mcard mcard--pack ${active ? 'is-active' : ''}`, 'aria-pressed': active ? 'true' : 'false',
        onClick: () => { store.choosePack(p.id); scene?.setView('ensemble'); },
      },
        h('span', { class: 'mcard__text' },
          h('span', { class: 'mcard__row' }, h('strong', {}, p.name), h('span', { class: 'mcard__price' }, formatPrice(p.price))),
          h('ul', { class: 'mcard__list' }, ...p.includes.map((i) => h('li', { html: `${icon('check')}<span>${i}</span>` })))),
        h('span', { class: 'mcard__check', html: active ? icon('check') : '' })));
    }
    const none = !store.state.packId;
    body.append(h('button', {
      type: 'button', class: `mcard ${none ? 'is-active' : ''}`, 'aria-pressed': none ? 'true' : 'false',
      onClick: () => store.choosePack(null),
    },
      h('span', { class: 'mcard__text' }, h('strong', {}, 'Sans pack, à la carte'), h('small', {}, 'Vous choisissez chaque équipement vous-même.')),
      h('span', { class: 'mcard__check', html: none ? icon('check') : '' })));
  }

  function renderProducts() {
    body.append(...head('Ajoutez vos équipements', 'Touchez + pour ajouter : la maquette vous montre où il se place.'));
    for (const cat of CATEGORIES) {
      const products = PRODUCTS.filter((p) => p.category === cat.id);
      body.append(h('h3', { class: 'mflow__cat' }, cat.label));
      for (const p of products) body.append(productRow(p));
    }
  }

  function productRow(p) {
    const items = store.itemsOfProduct(p.id);
    const count = items.length;
    const free = store.freeSlotsFor(p).length;
    const inPack = store.pack && p.inPacks.includes(store.pack.id);
    const full = count >= p.maxInstances || free === 0;
    let priceLabel;
    if (inPack && count <= 1) priceLabel = 'Inclus dans le pack';
    else if (p.price == null) priceLabel = 'Sur devis';
    else priceLabel = `${p.priceKind === 'from' ? 'Dès ' : ''}${formatPrice(p.price)}`;

    const add = () => {
      const r = store.addProduct(p.id);
      if (!r.ok) { toast(r.reason, 'error', 3500); return; }
      showInScene(r.item.uid);
    };
    const remove = () => {
      if (!count) return;
      // On retire d'abord un exemplaire ajouté à la carte, puis celui du pack.
      const target = [...items].reverse().find((i) => !i.fromPack) || items[items.length - 1];
      store.removeItem(target.uid);
    };

    const row = h('div', { class: `mprod ${count ? 'has-items' : ''}` },
      h('span', { class: 'mprod__icon', html: icon(PRODUCT_ICONS[p.id]) }),
      h('span', { class: 'mprod__text' }, h('strong', {}, p.name), h('small', {}, priceLabel)),
      h('span', { class: 'stepper' },
        h('button', { type: 'button', class: 'stepper__btn', disabled: !count, 'aria-label': `Retirer ${p.name}`, html: icon('minus'), onClick: remove }),
        h('span', { class: 'stepper__n', 'aria-live': 'polite' }, String(count)),
        h('button', { type: 'button', class: 'stepper__btn stepper__btn--add', disabled: full, 'aria-label': `Ajouter ${p.name}`, html: icon('plus'), onClick: add })),
    );
    // Choix du modèle (ex. caméra intérieure / extérieure) une fois l'équipement ajouté.
    const variant = p.options.find((o) => o.kind === 'variant');
    if (count && variant) {
      const current = items[0].options[variant.id];
      row.append(h('div', { class: 'mprod__variants' },
        ...variant.values.map((v) => h('button', {
          type: 'button', class: `mchip ${current === v.id ? 'is-active' : ''}`,
          onClick: () => store.setOptionForProduct(p.id, variant.id, v.id),
        }, typeof v.price === 'number' && !inPack ? `${v.label} · ${formatPrice(v.price)}` : v.label))));
    }
    return row;
  }

  function renderSend() {
    const box = h('div', { class: 'mflow__send' });
    body.append(box);
    renderQuotePanel(box, store, { getSnapshot, goTab: () => go(3) }, formState);
  }

  function renderBar() {
    clear(bar);
    const pr = store.pricing();
    bar.append(h('div', { class: 'mflow__total' },
      h('small', {}, pr.lines.length ? `${pr.count} équipement${pr.count > 1 ? 's' : ''}${pr.quoteOnly.length ? ` · + ${pr.quoteOnly.length} sur devis` : ''}` : 'Estimation'),
      h('strong', {}, pr.lines.length ? `${pr.hasFrom ? 'dès ' : ''}${formatPrice(pr.total)}` : '—')));
    if (step > 1) bar.append(h('button', { type: 'button', class: 'mflow__back', 'aria-label': 'Étape précédente', html: icon('back'), onClick: () => go(step - 1) }));
    const next = { 1: 'Choisir le pack', 2: 'Les équipements', 3: 'Voir mon devis' }[step];
    if (next) bar.append(h('button', { type: 'button', class: 'btn btn--accent mflow__next', html: `<span>${next}</span>${icon('arrow')}`, onClick: () => go(step + 1) }));
    else bar.append(h('button', { type: 'button', class: 'btn btn--whatsapp mflow__next', html: `${icon('whatsapp')}<span>Envoyer</span>`,
      onClick: () => { const b = body.querySelector('.btn--whatsapp'); if (b) { b.scrollIntoView({ behavior: 'smooth', block: 'center' }); b.click(); } } }));
  }

  render();
  return { render };
}
