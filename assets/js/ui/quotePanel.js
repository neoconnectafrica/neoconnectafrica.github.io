import { h, clear } from '../lib/dom.js';
import { icon } from '../lib/icons.js';
import { SITE, formatPrice } from '../config.js';
import { buildRecap, whatsappUrl, submitToEndpoint, copyText, downloadText, downloadUrl, validateForm, resolveContact } from '../services/quote.js';
import { toast } from './toast.js';

/** Onglet « Devis » : récapitulatif, précisions, coordonnées et transmission. */
export function renderQuotePanel(root, store, { getSnapshot, goTab }, formState) {
  clear(root);
  const pricing = store.pricing();

  // ----- Récapitulatif -----
  const recap = h('section', { class: 'cfg-block' },
    h('div', { class: 'cfg-block__head' }, h('h3', {}, 'Récapitulatif de votre projet'), h('p', {}, `${store.env.name}${store.pack ? ` · ${store.pack.name}` : ''}`)));
  if (!pricing.lines.length) {
    recap.append(h('div', { class: 'cfg-empty' }, h('p', {}, 'Votre configuration est vide. Ajoutez un pack ou des équipements avant de demander un devis.'),
      h('button', { type: 'button', class: 'btn btn--primary btn--small', onClick: () => goTab('catalog') }, 'Composer ma maison')));
  } else {
    const table = h('div', { class: 'recap' });
    for (const l of pricing.lines) {
      const price = l.kind === 'pack' ? formatPrice(l.price)
        : l.fromPack ? 'Inclus' : l.price == null ? 'Sur devis' : `${l.priceKind === 'from' ? 'dès ' : ''}${formatPrice(l.price)}`;
      table.append(h('div', { class: `recap__row ${l.kind === 'pack' ? 'recap__row--pack' : ''}` },
        h('div', { class: 'recap__label' }, h('strong', {}, l.label), l.kind === 'item' ? h('small', {}, [l.slot, ...(l.options || [])].filter(Boolean).join(' · ')) : null),
        h('div', { class: 'recap__price' }, price)));
    }
    table.append(h('div', { class: 'recap__total' },
      h('div', {}, h('strong', {}, 'Estimation'), h('small', {}, pricing.quoteOnly.length ? `+ ${pricing.quoteOnly.length} élément${pricing.quoteOnly.length > 1 ? 's' : ''} sur devis` : 'Devis final confirmé par un conseiller')),
      h('div', { class: 'recap__price recap__price--total' }, `${pricing.hasFrom ? 'à partir de ' : ''}${formatPrice(pricing.total)}`)));
    recap.append(table);
    recap.append(h('p', { class: 'note' }, 'Les prix des packs et de l’alarme sont les prix annoncés par NÉO-CONNECT. Les équipements « dès » dépendent du modèle retenu. Le devis définitif est confirmé après étude de votre logement.'));
  }
  root.append(recap);

  // ----- Précisions -----
  root.append(h('section', { class: 'cfg-block' },
    h('label', { class: 'field' }, h('span', { class: 'field__label' }, 'Précisions pour le conseiller (facultatif)'),
      h('textarea', { class: 'field__input', rows: 3, placeholder: 'Ex. : la fenêtre du salon fait 2 m, je souhaite aussi équiper la cuisine…', value: store.state.notes,
        onInput: (e) => store.setNotes(e.target.value) }))));

  // ----- Coordonnées -----
  const errors = formState.errors || {};
  const field = (name, label, input) => h('label', { class: `field ${errors[name] ? 'has-error' : ''}` },
    h('span', { class: 'field__label' }, label), input, errors[name] ? h('span', { class: 'field__error' }, errors[name]) : null);
  const bind = (name) => ({ value: formState[name] || '', onInput: (e) => { formState[name] = e.target.value; } });

  const form = h('form', { class: 'cfg-block quote-form', novalidate: true, onSubmit: (e) => e.preventDefault() },
    h('div', { class: 'cfg-block__head' }, h('h3', {}, 'Vos coordonnées'), h('p', {}, 'Un conseiller NÉO-CONNECT vous recontacte pour confirmer le devis. Seules ces informations sont nécessaires.')),
    field('name', 'Nom', h('input', { class: 'field__input', type: 'text', autocomplete: 'name', ...bind('name') })),
    field('phone', 'Téléphone (WhatsApp de préférence)', h('input', { class: 'field__input', type: 'tel', autocomplete: 'tel', placeholder: '+228 …', ...bind('phone') })),
    field('country', 'Pays', h('select', { class: 'field__input', value: formState.country || '', onChange: (e) => { formState.country = e.target.value; renderQuotePanel(root, store, { getSnapshot, goTab }, formState); } },
      h('option', { value: '', disabled: true, selected: !formState.country }, 'Choisir un pays'),
      ...SITE.countries.map((c) => h('option', { value: c.code, selected: formState.country === c.code }, c.name)),
      h('option', { value: 'OTHER', selected: formState.country === 'OTHER' }, 'Autre pays d’Afrique'))),
    formState.country === 'OTHER' ? field('countryName', 'Votre pays', h('input', { class: 'field__input', type: 'text', placeholder: 'Ex. : Sénégal', ...bind('countryName') })) : null,
    formState.country === 'OTHER' ? field('advisor', 'Conseiller à contacter', h('select', { class: 'field__input', onChange: (e) => { formState.advisor = e.target.value; } },
      ...SITE.countries.map((c) => h('option', { value: c.code, selected: (formState.advisor || SITE.defaultCountry) === c.code }, `${c.name} · ${c.whatsapp}`)))) : null,
    field('city', 'Ville / quartier (facultatif)', h('input', { class: 'field__input', type: 'text', ...bind('city') })),
    field('message', 'Message (facultatif)', h('textarea', { class: 'field__input', rows: 2, ...bind('message') })),
  );

  const actions = h('div', { class: 'quote-actions' });
  const contact = () => resolveContact(formState);

  const validateOrShow = () => {
    const errs = validateForm(formState);
    formState.errors = errs;
    if (Object.keys(errs).length) { renderQuotePanel(root, store, { getSnapshot, goTab }, formState); toast('Vérifiez les champs signalés.', 'error'); return false; }
    return true;
  };

  // Envoi WhatsApp (réel)
  actions.append(h('button', { type: 'button', class: 'btn btn--whatsapp', html: `${icon('whatsapp')}<span>Envoyer ma demande sur WhatsApp</span>`,
    onClick: () => {
      if (!pricing.lines.length) { toast('Ajoutez au moins un équipement.', 'error'); return; }
      if (!validateOrShow()) return;
      const { countryName, advisor } = contact();
      const text = buildRecap(store, { ...formState, country: countryName });
      window.open(whatsappUrl(advisor.code, text), '_blank', 'noopener');
      toast(`WhatsApp s’ouvre avec votre récapitulatif pour le conseiller ${advisor.name}. Envoyez le message pour transmettre votre demande.`, 'success', 6000);
    } }));
  actions.append(h('p', { class: 'note' }, 'WhatsApp s’ouvre avec le récapitulatif complet et le lien de votre configuration. Vous n’avez rien à ressaisir.'));

  // Envoi par formulaire (si un service de réception est configuré : voir integrations/README.md)
  if (SITE.quoteEndpoint) {
    actions.append(h('button', { type: 'button', class: 'btn btn--primary', html: `${icon('send')}<span>Envoyer la demande</span>`,
      onClick: async (e) => {
        if (!pricing.lines.length) { toast('Ajoutez au moins un équipement.', 'error'); return; }
        if (!validateOrShow()) return;
        const btn = e.currentTarget; // e.currentTarget n'est plus disponible après un await
        const { countryName, advisor } = contact();
        const form = { name: formState.name, phone: formState.phone, country: formState.country, countryName, advisor: advisor.code, city: formState.city || '', message: formState.message || '' };
        btn.disabled = true;
        const res = await submitToEndpoint({ source: 'configurateur', form, config: store.state, recap: buildRecap(store, { ...formState, country: countryName }), link: store.shareLink(), snapshot: getSnapshot?.() });
        btn.disabled = false;
        if (res.ok) toast('Demande envoyée. Un conseiller NÉO-CONNECT vous recontacte.', 'success', 5000);
        else toast(res.reason === 'timeout' ? 'Le service de réception ne répond pas. Utilisez WhatsApp ou réessayez.' : 'L’envoi a échoué. Utilisez WhatsApp ou réessayez.', 'error', 6000);
      } }));
    actions.append(h('p', { class: 'note note--muted' }, 'Votre demande est transmise directement à NÉO-CONNECT, avec le récapitulatif et une capture de votre maquette.'));
  } else {
    actions.append(h('p', { class: 'note note--muted' }, 'Envoi par formulaire e-mail : à activer en renseignant un service de réception (voir README). En attendant, WhatsApp transmet réellement la demande.'));
  }

  // Autres moyens
  actions.append(h('div', { class: 'quote-secondary' },
    h('button', { type: 'button', class: 'btn btn--ghost btn--small', html: `${icon('copy')}<span>Copier le récapitulatif</span>`,
      onClick: async () => { const ok = await copyText(buildRecap(store, { ...formState, country: contact().countryName })); toast(ok ? 'Récapitulatif copié.' : 'Copie impossible sur ce navigateur.', ok ? 'success' : 'error'); } }),
    h('button', { type: 'button', class: 'btn btn--ghost btn--small', html: `${icon('link')}<span>Copier le lien</span>`,
      onClick: async () => { const ok = await copyText(store.shareLink()); toast(ok ? 'Lien de votre configuration copié.' : 'Copie impossible.', ok ? 'success' : 'error'); } }),
    h('button', { type: 'button', class: 'btn btn--ghost btn--small', html: `${icon('download')}<span>Capture de la maquette</span>`,
      onClick: () => { const url = getSnapshot?.(); if (url) { downloadUrl('neoconnect-maquette.png', url); toast('Capture téléchargée.', 'success'); } } }),
    h('button', { type: 'button', class: 'btn btn--ghost btn--small', html: `${icon('download')}<span>Récapitulatif (.txt)</span>`,
      onClick: () => downloadText('neoconnect-projet.txt', buildRecap(store, { ...formState, country: contact().countryName })) }),
  ));

  form.append(actions);
  root.append(form);
}
