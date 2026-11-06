/**
 * État du configurateur : environnement, pack, équipements placés, options,
 * variantes enregistrées, historique (annuler / rétablir), persistance locale
 * et lien de partage.
 *
 * Aucune dépendance : un petit store observable, sérialisable en JSON.
 */
import { PRODUCTS, PACKS, productById, packById, defaultOptions, productsForSlotType, priceFor } from '../data/catalog.js';
import { ENVIRONMENTS, environmentById, slotsOfType } from '../data/environments.js';

const STORAGE_KEY = 'neoconnect.config.v1';
const uid = () => Math.random().toString(36).slice(2, 9);

const emptyState = () => ({
  envId: 'salon',
  packId: null,
  items: [], // { uid, productId, slotId, options, fromPack }
  notes: '',
  variants: {}, // { A: snapshot, B: snapshot }
});

export class ConfigStore {
  constructor({ persist = true } = {}) {
    this.persistEnabled = persist;
    this.state = emptyState();
    this.listeners = new Set();
    this.past = [];
    this.future = [];
    this.lastEvent = null;
  }

  /* ---------- abonnement ---------- */
  subscribe(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  emit(event) {
    this.lastEvent = event;
    for (const fn of this.listeners) fn(this.state, event);
  }

  /* ---------- accès ---------- */
  get env() { return environmentById(this.state.envId) || ENVIRONMENTS[0]; }
  get pack() { return this.state.packId ? packById(this.state.packId) : null; }
  item(uidv) { return this.state.items.find((i) => i.uid === uidv); }
  itemsOfProduct(pid) { return this.state.items.filter((i) => i.productId === pid); }
  slotFree(slotId, ignoreUid = null) { return !this.state.items.some((i) => i.slotId === slotId && i.uid !== ignoreUid); }
  freeSlotsFor(product, ignoreUid = null) {
    return slotsOfType(this.env, product.slotType).filter((s) => this.slotFree(s.id, ignoreUid));
  }

  /* ---------- historique ---------- */
  commit(mutator, event) {
    this.past.push(structuredClone(this.state));
    if (this.past.length > 50) this.past.shift();
    this.future = [];
    mutator(this.state);
    this.persist();
    this.emit(event);
  }
  undo() {
    if (!this.past.length) return false;
    this.future.push(structuredClone(this.state));
    this.state = this.past.pop();
    this.persist();
    this.emit({ type: 'undo' });
    return true;
  }
  redo() {
    if (!this.future.length) return false;
    this.past.push(structuredClone(this.state));
    this.state = this.future.pop();
    this.persist();
    this.emit({ type: 'redo' });
    return true;
  }
  get canUndo() { return this.past.length > 0; }
  get canRedo() { return this.future.length > 0; }

  /* ---------- actions ---------- */
  setEnvironment(envId) {
    if (!environmentById(envId) || envId === this.state.envId) return;
    this.commit((s) => {
      s.envId = envId;
      const env = environmentById(envId);
      // Les équipements sont conservés et replacés sur un emplacement libre du même type.
      const kept = [];
      for (const it of s.items) {
        const p = productById(it.productId);
        const taken = new Set(kept.map((k) => k.slotId));
        const slot = slotsOfType(env, p.slotType).find((sl) => !taken.has(sl.id));
        if (slot) kept.push({ ...it, slotId: slot.id });
      }
      s.items = kept;
      if (!env.packsAvailable) s.packId = null;
    }, { type: 'env', envId });
  }

  choosePack(packId) {
    const pack = packId ? packById(packId) : null;
    this.commit((s) => {
      s.packId = pack ? pack.id : null;
      // Retire les composants du pack précédent qui ne sont plus couverts, ajoute ceux du nouveau.
      s.items = s.items.filter((i) => !i.fromPack);
      if (pack) {
        for (const pid of pack.components) {
          const p = productById(pid);
          const existing = s.items.find((i) => i.productId === pid);
          if (existing) { existing.fromPack = true; continue; }
          const taken = new Set(s.items.map((i) => i.slotId));
          const slot = slotsOfType(this.env, p.slotType).find((sl) => !taken.has(sl.id));
          if (slot) s.items.push({ uid: uid(), productId: pid, slotId: slot.id, options: defaultOptions(p), fromPack: true });
        }
      }
    }, { type: 'pack', packId });
  }

  addProduct(productId, slotId = null) {
    const p = productById(productId);
    if (!p) return { ok: false, reason: 'Produit inconnu.' };
    if (this.itemsOfProduct(productId).length >= p.maxInstances) {
      return { ok: false, reason: `Nombre maximal atteint pour « ${p.name} » dans cette pièce.` };
    }
    if (!slotsOfType(this.env, p.slotType).length) {
      return { ok: false, reason: `« ${p.name} » ne se place pas dans cette pièce. Choisissez le salon ou le grand salon pour l'ajouter.` };
    }
    const free = this.freeSlotsFor(p);
    const slot = slotId ? free.find((s) => s.id === slotId) : free[0];
    if (!slot) return { ok: false, reason: 'Tous les emplacements prévus pour cet équipement sont occupés. Retirez ou remplacez un élément.' };
    const item = { uid: uid(), productId, slotId: slot.id, options: defaultOptions(p), fromPack: false };
    this.commit((s) => { s.items.push(item); }, { type: 'add', uid: item.uid });
    return { ok: true, item };
  }

  removeItem(uidv) {
    const it = this.item(uidv);
    if (!it) return;
    this.commit((s) => { s.items = s.items.filter((i) => i.uid !== uidv); }, { type: 'remove', uid: uidv, productId: it.productId });
  }

  replaceItem(uidv, newProductId) {
    const it = this.item(uidv);
    const np = productById(newProductId);
    if (!it || !np) return { ok: false };
    const old = productById(it.productId);
    if (old.slotType !== np.slotType) return { ok: false, reason: 'Cet équipement ne se place pas au même endroit.' };
    if (this.itemsOfProduct(newProductId).length >= np.maxInstances) return { ok: false, reason: 'Nombre maximal atteint pour cet équipement.' };
    this.commit((s) => {
      const target = s.items.find((i) => i.uid === uidv);
      target.productId = newProductId;
      target.options = defaultOptions(np);
      target.fromPack = false;
    }, { type: 'replace', uid: uidv });
    return { ok: true };
  }

  moveItem(uidv, slotId) {
    const it = this.item(uidv);
    if (!it || it.slotId === slotId) return;
    if (!this.slotFree(slotId, uidv)) return;
    this.commit((s) => { s.items.find((i) => i.uid === uidv).slotId = slotId; }, { type: 'move', uid: uidv });
  }

  setOption(uidv, optionId, value) {
    const it = this.item(uidv);
    if (!it || it.options[optionId] === value) return;
    this.commit((s) => { s.items.find((i) => i.uid === uidv).options[optionId] = value; }, { type: 'option', uid: uidv, optionId, value });
  }

  /** Applique une option à tous les exemplaires d'un produit (utilisé par la démo). */
  setOptionForProduct(productId, optionId, value) {
    const targets = this.itemsOfProduct(productId);
    if (!targets.length) return;
    this.commit((s) => { for (const i of s.items) if (i.productId === productId) i.options[optionId] = value; },
      { type: 'option', productId, optionId, value });
  }

  setNotes(text) {
    this.state.notes = text;
    this.persist();
    this.emit({ type: 'notes' });
  }

  reset() {
    this.commit((s) => { Object.assign(s, { ...emptyState(), variants: s.variants }); }, { type: 'reset' });
  }

  /* ---------- variantes (comparer A / B) ---------- */
  saveVariant(key) {
    const { envId, packId, items, notes } = this.state;
    this.state.variants[key] = structuredClone({ envId, packId, items, notes, savedAt: Date.now() });
    this.persist();
    this.emit({ type: 'variant-saved', key });
  }
  loadVariant(key) {
    const v = this.state.variants[key];
    if (!v) return;
    this.commit((s) => { s.envId = v.envId; s.packId = v.packId; s.items = structuredClone(v.items); s.notes = v.notes; }, { type: 'variant-loaded', key });
  }
  deleteVariant(key) {
    delete this.state.variants[key];
    this.persist();
    this.emit({ type: 'variant-deleted', key });
  }

  /* ---------- prix & récapitulatif ---------- */
  pricing() {
    const pack = this.pack;
    let total = pack ? pack.price : 0;
    let hasFrom = false;
    const quoteOnly = [];
    const lines = [];
    if (pack) lines.push({ kind: 'pack', label: pack.name, price: pack.price, priceKind: 'fixed' });
    for (const it of this.state.items) {
      const p = productById(it.productId);
      const line = { kind: 'item', uid: it.uid, label: p.name, slot: this.env.slots.find((s) => s.id === it.slotId)?.label, options: describeOptions(p, it.options), fromPack: it.fromPack };
      const pf = priceFor(p, it.options);
      if (it.fromPack) { line.price = 0; line.priceLabel = 'Inclus dans le pack'; }
      else if (pf.price == null) { line.price = null; line.priceLabel = 'Sur devis'; quoteOnly.push(p.name); }
      else { line.price = pf.price; line.priceKind = pf.priceKind; total += pf.price; if (pf.priceKind === 'from') hasFrom = true; }
      lines.push(line);
    }
    return { total, hasFrom, quoteOnly, lines, count: this.state.items.length };
  }

  /* ---------- persistance & partage ---------- */
  persist() {
    if (!this.persistEnabled) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state)); } catch { /* stockage indisponible : on continue sans */ }
  }
  restore() {
    const fromUrl = decodeShare(location.hash);
    if (fromUrl) { this.state = { ...emptyState(), ...fromUrl, variants: this.state.variants }; this.sanitize(); this.emit({ type: 'restore', source: 'url' }); return 'url'; }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) { this.state = { ...emptyState(), ...JSON.parse(raw) }; this.sanitize(); this.emit({ type: 'restore', source: 'local' }); return 'local'; }
    } catch { /* ignore */ }
    return null;
  }
  sanitize() {
    const s = this.state;
    if (!environmentById(s.envId)) s.envId = 'salon';
    if (s.packId && !packById(s.packId)) s.packId = null;
    const env = environmentById(s.envId);
    const seen = new Set();
    s.items = (s.items || []).filter((i) => {
      const p = productById(i.productId);
      const slot = env.slots.find((sl) => sl.id === i.slotId);
      if (!p || !slot || slot.type !== p.slotType || seen.has(i.slotId)) return false;
      seen.add(i.slotId);
      i.options = { ...defaultOptions(p), ...(i.options || {}) };
      i.uid = i.uid || uid();
      return true;
    });
    if (!s.variants || typeof s.variants !== 'object') s.variants = {};
  }
  shareLink() {
    const { envId, packId, items, notes } = this.state;
    const compact = { e: envId, p: packId, n: notes || undefined, i: items.map((i) => [i.productId, i.slotId, i.options, i.fromPack ? 1 : 0]) };
    const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(compact)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const url = new URL(location.href);
    url.hash = `c=${b64}`;
    return url.toString();
  }
}

function decodeShare(hash) {
  const m = /[#&]c=([A-Za-z0-9_-]+)/.exec(hash || '');
  if (!m) return null;
  try {
    const b64 = m[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(escape(atob(b64)));
    const c = JSON.parse(json);
    return { envId: c.e, packId: c.p || null, notes: c.n || '', items: (c.i || []).map(([productId, slotId, options, fp]) => ({ uid: uid(), productId, slotId, options, fromPack: !!fp })) };
  } catch { return null; }
}

export function describeOptions(product, options) {
  const out = [];
  for (const opt of product.options) {
    if (opt.kind === 'demo') continue; // les options de démonstration ne font pas partie du devis
    const v = opt.values.find((x) => x.id === options[opt.id]);
    if (v) out.push(`${opt.label} : ${v.label}`);
  }
  return out;
}

export { PRODUCTS, PACKS, ENVIRONMENTS, productById, packById, environmentById, productsForSlotType };
