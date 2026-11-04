import { h, clear } from '../lib/dom.js';
import { icon, PRODUCT_ICONS } from '../lib/icons.js';
import { formatPrice } from '../config.js';
import { productById, productsForSlotType, priceFor } from '../data/catalog.js';
import { slotsOfType } from '../data/environments.js';

/**
 * Onglet « Ma sélection » : inspecteur de l'équipement sélectionné,
 * liste des équipements placés, variantes A / B.
 */
export function renderSelectionPanel(root, store, selectedUid, actions) {
  clear(root);
  const items = store.state.items;
  const env = store.env;

  // ----- Inspecteur -----
  const selected = selectedUid ? store.item(selectedUid) : null;
  if (selected) root.append(renderInspector(selected, store, actions));
  else root.append(h('div', { class: 'cfg-empty cfg-empty--inline' },
    h('p', {}, items.length ? 'Cliquez sur un équipement dans la maquette ou dans la liste pour le modifier, le déplacer ou le remplacer.' : 'Votre maquette est vide pour l’instant.'),
  ));

  // ----- Liste -----
  const list = h('section', { class: 'cfg-block' },
    h('div', { class: 'cfg-block__head' },
      h('h3', {}, `Équipements placés (${items.length})`),
      h('p', {}, env.name + (store.pack ? ` · ${store.pack.name}` : ' · sans pack'))),
  );
  if (!items.length) {
    list.append(h('div', { class: 'cfg-empty' }, h('p', {}, 'Ajoutez un pack ou des équipements depuis l’onglet « Équipements ».'),
      h('button', { type: 'button', class: 'btn btn--ghost btn--small', onClick: () => actions.goTab('catalog') }, 'Voir les équipements')));
  } else {
    const ul = h('ul', { class: 'sel-list' });
    for (const it of items) {
      const p = productById(it.productId);
      const slot = env.slots.find((s) => s.id === it.slotId);
      ul.append(h('li', { class: `sel-item ${it.uid === selectedUid ? 'is-active' : ''}` },
        h('button', { type: 'button', class: 'sel-item__main', onClick: () => actions.select(it.uid, true) },
          h('span', { class: 'sel-item__icon', html: icon(PRODUCT_ICONS[p.id]) }),
          h('span', { class: 'sel-item__text' },
            h('strong', {}, p.name),
            h('small', {}, `${slot?.label || ''}${it.fromPack ? ' · inclus dans le pack' : ''}`))),
        h('button', { type: 'button', class: 'icon-btn', title: 'Retirer', 'aria-label': `Retirer ${p.name}`, html: icon('close'), onClick: () => actions.remove(it.uid) }),
      ));
    }
    list.append(ul);
  }
  root.append(list);

  // ----- Variantes -----
  const variants = store.state.variants || {};
  root.append(h('section', { class: 'cfg-block' },
    h('div', { class: 'cfg-block__head' }, h('h3', {}, 'Comparer deux possibilités'),
      h('p', {}, 'Enregistrez la configuration actuelle en A ou en B, modifiez-la, puis basculez de l’une à l’autre.')),
    h('div', { class: 'variant-row' }, ...['A', 'B'].map((k) => {
      const v = variants[k];
      return h('div', { class: `variant ${v ? 'has-data' : ''}` },
        h('div', { class: 'variant__head' }, h('strong', {}, `Variante ${k}`),
          v ? h('small', {}, `${v.items.length} équipement${v.items.length > 1 ? 's' : ''}${v.packId ? ' · pack' : ''}`) : h('small', {}, 'vide')),
        h('div', { class: 'variant__actions' },
          h('button', { type: 'button', class: 'btn btn--small btn--ghost', onClick: () => actions.saveVariant(k) }, v ? 'Remplacer' : 'Enregistrer'),
          v ? h('button', { type: 'button', class: 'btn btn--small btn--primary', onClick: () => actions.loadVariant(k) }, 'Charger') : null,
          v ? h('button', { type: 'button', class: 'icon-btn', title: 'Supprimer la variante', html: icon('close'), onClick: () => actions.deleteVariant(k) }) : null));
    })),
  ));
}

function renderInspector(item, store, actions) {
  const p = productById(item.productId);
  const env = store.env;
  const slot = env.slots.find((s) => s.id === item.slotId);
  const alternatives = productsForSlotType(p.slotType).filter((x) => x.id !== p.id);
  const slots = slotsOfType(env, p.slotType);

  const pf = priceFor(p, item.options);
  const priceLabel = item.fromPack ? 'Inclus dans le pack' : pf.price == null ? 'Sur devis' : `${pf.priceKind === 'from' ? 'Dès ' : ''}${formatPrice(pf.price)}`;

  const box = h('section', { class: 'inspector' },
    h('div', { class: 'inspector__head' },
      h('span', { class: 'inspector__icon', html: icon(PRODUCT_ICONS[p.id]) }),
      h('div', {}, h('h3', {}, p.name), h('p', { class: 'inspector__price' }, priceLabel)),
      h('button', { type: 'button', class: 'icon-btn', title: 'Fermer', 'aria-label': 'Fermer', html: icon('close'), onClick: () => actions.select(null) })),
    h('p', { class: 'inspector__desc' }, p.description),
  );
  if (p.image) {
    box.append(h('figure', { class: 'inspector__figure' },
      h('img', { src: p.image.src, alt: p.image.alt, loading: 'lazy' }),
      p.image.credit ? h('figcaption', {}, p.image.credit) : null));
  }
  if (p.highlights?.length) {
    box.append(h('ul', { class: 'inspector__list' }, ...p.highlights.map((t) => h('li', { html: `${icon('check')}<span>${t}</span>` }))));
  }
  if (p.voice?.length) {
    box.append(h('div', { class: 'voice' }, h('span', { class: 'field__label' }, 'Exemples de commandes vocales'),
      h('div', { class: 'voice__list' }, ...p.voice.map((v) => h('span', { class: 'voice__chip' }, `« ${v} »`)))));
  }

  // Emplacement
  const slotSel = h('select', { class: 'field__input', onChange: (e) => actions.move(item.uid, e.target.value) },
    ...slots.map((s) => h('option', { value: s.id, selected: s.id === item.slotId, disabled: !store.slotFree(s.id, item.uid) },
      `${s.label}${!store.slotFree(s.id, item.uid) ? ' (occupé)' : ''}`)));
  box.append(h('label', { class: 'field' }, h('span', { class: 'field__label' }, 'Emplacement dans la pièce'), slotSel));

  // Options
  for (const opt of p.options) {
    const group = h('div', { class: 'field' },
      h('span', { class: 'field__label' }, opt.label, opt.kind === 'demo' ? h('em', { class: 'field__hint' }, ' · aperçu dans la maquette, sans incidence sur le devis') : null),
      h('div', { class: 'seg', role: 'group', 'aria-label': opt.label },
        ...opt.values.map((v) => h('button', {
          type: 'button', class: `seg__btn ${item.options[opt.id] === v.id ? 'is-active' : ''}`,
          'aria-pressed': item.options[opt.id] === v.id ? 'true' : 'false',
          title: typeof v.price === 'number' ? formatPrice(v.price) : null,
          onClick: () => actions.setOption(item.uid, opt.id, v.id),
        }, typeof v.price === 'number' && !item.fromPack ? `${v.label} · ${formatPrice(v.price)}` : v.label))));
    box.append(group);
  }

  // Remplacer
  if (alternatives.length) {
    box.append(h('div', { class: 'field' }, h('span', { class: 'field__label' }, 'Remplacer par'),
      h('div', { class: 'chips' }, ...alternatives.map((a) => h('button', { type: 'button', class: 'chip', onClick: () => actions.replace(item.uid, a.id) }, a.name)))));
  }

  box.append(h('div', { class: 'inspector__actions' },
    h('button', { type: 'button', class: 'btn btn--ghost btn--small', html: `${icon('eye')}<span>Voir dans la maquette</span>`, onClick: () => actions.focus(item.uid) }),
    h('button', { type: 'button', class: 'btn btn--danger btn--small', html: `${icon('minus')}<span>Retirer</span>`, onClick: () => actions.remove(item.uid) }),
  ));
  if (item.fromPack) box.append(h('p', { class: 'note' }, 'Cet équipement fait partie du pack. Le retirer ne change pas le prix du pack : signalez-le au conseiller dans vos précisions.'));
  return box;
}
