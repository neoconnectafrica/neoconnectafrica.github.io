import { h } from '../lib/dom.js';

let host = null;
export function toast(message, kind = 'info', ms = 3200) {
  if (!host) { host = h('div', { class: 'toast-host', role: 'status', 'aria-live': 'polite' }); document.body.append(host); }
  const el = h('div', { class: `toast toast--${kind}` }, message);
  host.append(el);
  requestAnimationFrame(() => el.classList.add('is-in'));
  setTimeout(() => { el.classList.remove('is-in'); setTimeout(() => el.remove(), 300); }, ms);
}
