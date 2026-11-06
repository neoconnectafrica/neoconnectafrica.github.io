import { h, clear } from '../lib/dom.js';
import { icon, PRODUCT_ICONS } from '../lib/icons.js';
import { formatPrice } from '../config.js';
import { CATEGORIES, PRODUCTS, PACKS } from '../data/catalog.js';

/** Onglet « Équipements » : packs puis catalogue par catégorie. */
export function renderCatalogPanel(root, store, { onAdd, onChoosePack }) {
  clear(root);
  const env = store.env;
  const pricing = store.pricing();

  // ----- Packs -----
  if (env.packsAvailable) {
    const packs = h('section', { class: 'cfg-block' },
      h('div', { class: 'cfg-block__head' },
        h('h3', {}, 'Commencez par un pack'),
        h('p', {}, 'Les équipements du pack apparaissent directement dans la maquette. Vous pourrez ensuite ajouter des éléments à la carte.')),
      h('div', { class: 'pack-list' },
        ...PACKS.map((p) => {
          const active = store.state.packId === p.id;
          return h('button', {
            type: 'button', class: `pack-card pack-card--${p.tone} ${active ? 'is-active' : ''}`,
            'aria-pressed': active ? 'true' : 'false',
            onClick: () => onChoosePack(active ? null : p.id),
          },
            h('div', { class: 'pack-card__top' },
              h('span', { class: 'pack-card__name' }, p.name),
              h('span', { class: 'pack-card__price' }, formatPrice(p.price))),
            h('ul', { class: 'pack-card__list' }, ...p.includes.map((i) => h('li', { html: `${icon('check')}<span>${i}</span>` }))),
            h('span', { class: 'pack-card__cta' }, active ? 'Pack sélectionné · retirer' : 'Choisir ce pack'),
          );
        }),
        h('button', {
          type: 'button', class: `pack-card pack-card--free ${!store.state.packId ? 'is-active' : ''}`,
          onClick: () => onChoosePack(null),
        },
          h('div', { class: 'pack-card__top' }, h('span', { class: 'pack-card__name' }, 'Sans pack'), h('span', { class: 'pack-card__price' }, 'À la carte')),
          h('p', { class: 'pack-card__note' }, 'Composez librement. Les équipements des packs sont alors proposés sur devis.'),
        ),
      ),
    );
    root.append(packs);
  } else {
    root.append(h('section', { class: 'cfg-block' },
      h('div', { class: 'cfg-block__head' },
        h('h3', {}, `Équiper la ${env.name.toLowerCase()}`),
        h('p', {}, 'Les packs concernent le salon. Dans cette pièce, ajoutez les équipements à la carte ; ceux sans prix annoncé seront chiffrés sur devis.'))));
  }

  // ----- Catalogue -----
  for (const cat of CATEGORIES) {
    const products = PRODUCTS.filter((p) => p.category === cat.id);
    const section = h('section', { class: 'cfg-block' },
      h('div', { class: 'cfg-block__head' }, h('h3', {}, cat.label), h('p', {}, cat.blurb)),
      h('div', { class: 'product-list' }, ...products.map((p) => productCard(p, store, pricing, onAdd))),
    );
    root.append(section);
  }
}

function productCard(p, store, pricing, onAdd) {
  const count = store.itemsOfProduct(p.id).length;
  const free = store.freeSlotsFor(p).length;
  const inPack = store.pack && p.inPacks.includes(store.pack.id);
  const full = count >= p.maxInstances || free === 0;
  let priceLabel;
  if (p.price == null) priceLabel = inPack ? 'Inclus dans le pack' : p.onOrder ? 'Sur commande · prix sur devis' : 'Sur devis';
  else priceLabel = `${p.priceKind === 'from' ? 'Dès ' : ''}${formatPrice(p.price)}`;
  if (inPack && p.price != null && count === 0) priceLabel = 'Inclus dans le pack';

  return h('article', { class: `product-card ${count ? 'has-items' : ''}` },
    h('div', { class: 'product-card__icon', html: icon(PRODUCT_ICONS[p.id]) }),
    h('div', { class: 'product-card__body' },
      h('div', { class: 'product-card__row' },
        h('h4', {}, p.name),
        count ? h('span', { class: 'badge' }, `${count} placé${count > 1 ? 's' : ''}`) : null),
      h('p', { class: 'product-card__short' }, p.short),
      h('div', { class: 'product-card__row' },
        h('span', { class: `price ${p.price == null && !inPack ? 'price--quote' : ''}` }, priceLabel),
        h('button', {
          type: 'button', class: 'btn btn--small btn--primary', disabled: full,
          title: full ? 'Plus d’emplacement disponible pour cet équipement dans cette pièce' : `Ajouter ${p.name} à la maquette`,
          onClick: () => onAdd(p.id),
          html: `${icon('plus')}<span>${count ? 'Ajouter un autre' : 'Ajouter'}</span>`,
        })),
      h('p', { class: 'product-card__meta' }, `${free} emplacement${free > 1 ? 's' : ''} libre${free > 1 ? 's' : ''}`),
    ),
  );
}
