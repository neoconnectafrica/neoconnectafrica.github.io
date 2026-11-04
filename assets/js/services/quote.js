/**
 * Transmission de la demande de devis.
 * - WhatsApp : canal réel et immédiat (numéros NÉO-CONNECT par pays).
 * - Endpoint HTTP : activé dès que SITE.quoteEndpoint est renseigné (Google Apps Script,
 *   Formspree, webhook… voir integrations/README.md).
 * - Copie / téléchargement du récapitulatif : toujours disponibles.
 * Rien n'est simulé : si un canal n'est pas disponible, l'interface le dit.
 */
import { SITE, formatPrice, waLink } from '../config.js';

export function buildRecap(store, form = {}) {
  const pricing = store.pricing();
  const env = store.env;
  const lines = [];
  lines.push(`Demande de devis NÉO-CONNECT`);
  lines.push(`Pièce : ${env.name}`);
  if (store.pack) lines.push(`Pack : ${store.pack.name} — ${formatPrice(store.pack.price)}`);
  lines.push('');
  lines.push('Équipements :');
  for (const l of pricing.lines) {
    if (l.kind !== 'item') continue;
    const opts = l.options.length ? ` (${l.options.join(', ')})` : '';
    const price = l.fromPack ? 'inclus dans le pack' : l.price == null ? 'sur devis' : `${l.priceKind === 'from' ? 'dès ' : ''}${formatPrice(l.price)}`;
    lines.push(`- ${l.label}${opts} — ${l.slot} — ${price}`);
  }
  lines.push('');
  lines.push(`Estimation : ${pricing.hasFrom ? 'à partir de ' : ''}${formatPrice(pricing.total)}${pricing.quoteOnly.length ? ' + éléments sur devis' : ''}`);
  if (store.state.notes) { lines.push(''); lines.push(`Précisions : ${store.state.notes}`); }
  if (form.name || form.phone || form.city) {
    lines.push('');
    lines.push('Contact :');
    if (form.name) lines.push(`- Nom : ${form.name}`);
    if (form.phone) lines.push(`- Téléphone : ${form.phone}`);
    if (form.country) lines.push(`- Pays : ${form.country}`);
    if (form.city) lines.push(`- Ville / quartier : ${form.city}`);
    if (form.message) lines.push(`- Message : ${form.message}`);
  }
  lines.push('');
  lines.push(`Lien de ma configuration : ${store.shareLink()}`);
  return lines.join('\n');
}

export function whatsappUrl(countryCode, text) {
  const c = SITE.countries.find((x) => x.code === countryCode) || SITE.countries[0];
  return waLink(c, text);
}

/**
 * Envoi de la demande à SITE.quoteEndpoint.
 *
 * Deux familles de services sont reconnues d'après l'URL :
 * - Formspree (formspree.io) : JSON classique, champ par champ (name, phone, …), sans capture.
 * - Tout le reste (Google Apps Script, Make, Zapier, API maison) : le JSON complet
 *   { source, sentAt, form, config, recap, link, snapshot } est envoyé avec
 *   Content-Type text/plain. C'est une « requête simple » au sens CORS : pas de
 *   pré-vol OPTIONS, ce que Google Apps Script ne sait pas traiter. Aucun en-tête
 *   personnalisé ne doit être ajouté, sinon le navigateur bloquerait l'envoi.
 *
 * Retour : { ok: true } ou { ok: false, reason, message? }.
 * reason ∈ no-endpoint | timeout | network | http-<code> | rejected.
 */
export async function submitToEndpoint(payload, { timeoutMs = 25000 } = {}) {
  const endpoint = SITE.quoteEndpoint;
  if (!endpoint) return { ok: false, reason: 'no-endpoint' };
  const body = { source: 'configurateur', sentAt: new Date().toISOString(), ...payload };
  const formspree = /(^|\.)formspree\.io$/i.test(safeHost(endpoint));
  const init = formspree
    ? { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(formspreeFields(body)) }
    : { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) };

  const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = ctrl ? setTimeout(() => ctrl.abort(), timeoutMs) : null;
  try {
    const res = await fetch(endpoint, { ...init, signal: ctrl?.signal, redirect: 'follow' });
    // Réponse opaque (mode no-cors ou service sans en-têtes CORS) : la requête est partie,
    // on ne peut pas lire la réponse. On considère l'envoi effectué.
    if (res.type === 'opaque') return { ok: true, reason: 'opaque' };
    if (!res.ok) return { ok: false, reason: `http-${res.status}`, message: await readMessage(res) };
    const data = await readJson(res);
    if (data && data.ok === false) return { ok: false, reason: 'rejected', message: data.error || data.message || '' };
    return { ok: true };
  } catch (e) {
    if (e && e.name === 'AbortError') return { ok: false, reason: 'timeout', error: e };
    console.warn('submitToEndpoint', e);
    return { ok: false, reason: 'network', error: e };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** Champs plats attendus par Formspree (la capture PNG, trop lourde, n'est pas envoyée). */
function formspreeFields(body) {
  const f = body.form || {};
  return {
    _subject: `[NÉO-CONNECT] ${body.source === 'contact' ? 'Demande de rappel' : 'Demande de devis'} — ${f.name || ''}`,
    name: f.name || '', phone: f.phone || '', country: f.countryName || f.country || '', advisor: f.advisor || '',
    city: f.city || '', message: f.message || '', recap: body.recap || '', link: body.link || '', source: body.source, sentAt: body.sentAt,
  };
}

function safeHost(url) {
  try { return new URL(url, location.href).hostname; } catch { return ''; }
}

async function readJson(res) {
  try { return await res.json(); } catch { return null; }
}

async function readMessage(res) {
  try { const t = await res.text(); return t.slice(0, 200); } catch { return ''; }
}

export async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.append(ta); ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}

export function downloadText(filename, text) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  downloadUrl(filename, URL.createObjectURL(blob), true);
}

export function downloadUrl(filename, url, revoke = false) {
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.append(a); a.click(); a.remove();
  if (revoke) setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** Validation simple et explicite du formulaire de contact. */
export function validateForm(form) {
  const errors = {};
  if (!form.name || form.name.trim().length < 2) errors.name = 'Indiquez votre nom.';
  const phone = (form.phone || '').replace(/[\s.-]/g, '');
  if (!/^\+?\d{8,15}$/.test(phone)) errors.phone = 'Indiquez un numéro de téléphone valide (8 à 15 chiffres).';
  if (!form.country) errors.country = 'Choisissez votre pays.';
  if (form.country === 'OTHER' && !(form.countryName || '').trim()) errors.countryName = 'Indiquez votre pays.';
  return errors;
}

/**
 * Résout le pays du visiteur et le conseiller WhatsApp à contacter.
 * Hors Bénin / Togo / Côte d'Ivoire, le visiteur choisit un conseiller (Bénin par défaut).
 */
export function resolveContact(form) {
  const known = SITE.countries.find((c) => c.code === form.country);
  if (known) return { countryName: known.name, advisor: known };
  const advisor = SITE.countries.find((c) => c.code === form.advisor) || SITE.countries.find((c) => c.code === SITE.defaultCountry);
  return { countryName: (form.countryName || '').trim() || 'Autre pays d’Afrique', advisor };
}
