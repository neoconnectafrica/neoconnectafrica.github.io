/** Petits utilitaires DOM sans dépendance. */
export const qs = (sel, root = document) => root.querySelector(sel);
export const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/** h('button', { class: 'btn', onClick: fn, dataset: {...} }, 'texte', child) */
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'value' || k === 'checked' || k === 'selected' || k === 'disabled' || k === 'hidden') el[k] = v;
    else if (k in el && typeof v !== 'string') el[k] = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

export function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); return el; }

export const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const isTouch = () => window.matchMedia('(pointer: coarse)').matches;
