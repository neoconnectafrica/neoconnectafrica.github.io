/** Icônes SVG inline (trait 1.6, 24 px). */
const paths = {
  phone: '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18h2"/>',
  sofa: '<path d="M4 11V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3"/><path d="M3 13a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4H3v-4Z"/><path d="M5 17v2M19 17v2"/>',
  spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.3 6.3l2.8 2.8M14.9 14.9l2.8 2.8M6.3 17.7l2.8-2.8M14.9 9.1l2.8-2.8"/>',
  sliders: '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
  shield: '<path d="M12 3 5 6v6c0 4 3 7 7 9 4-2 7-5 7-9V6l-7-3Z"/><path d="m9.5 12 2 2 3.5-4"/>',
  layers: '<path d="m12 4 8 4-8 4-8-4 8-4Z"/><path d="m4 12 8 4 8-4M4 16l8 4 8-4"/>',
  cube: '<path d="M12 3 4 7v10l8 4 8-4V7l-8-4Z"/><path d="M4 7l8 4 8-4M12 11v10"/>',
  light: '<path d="M9 18h6M10 21h4"/><path d="M8.5 14a5.5 5.5 0 1 1 7 0c-.8.7-1.5 1.6-1.5 2.5h-4c0-.9-.7-1.8-1.5-2.5Z"/>',
  snow: '<path d="M12 3v18M3 12h18M6 6l12 12M18 6 6 18"/>',
  tv: '<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8 21h8M12 17v4"/>',
  music: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="13" r="2.5"/><path d="M12 6.5v1"/>',
  curtain: '<path d="M4 4h16M6 4v16M18 4v16"/><path d="M6 6c3 1 3 10 0 14M18 6c-3 1-3 10 0 14"/>',
  camera: '<path d="M4 8h3l2-2h6l2 2h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 15v2"/>',
  sensor: '<circle cx="12" cy="12" r="2"/><path d="M8.5 8.5a5 5 0 0 0 0 7M15.5 8.5a5 5 0 0 1 0 7M5.6 5.6a9 9 0 0 0 0 12.8M18.4 5.6a9 9 0 0 1 0 12.8"/>',
  alarm: '<path d="M12 4a6 6 0 0 1 6 6v4l2 3H4l2-3v-4a6 6 0 0 1 6-6Z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
  robot: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2"/><path d="M12 4v2M12 18v2"/>',
  whatsapp: '<path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3Z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-1.8-1-1 .8a4 4 0 0 1-2-2l.8-1-1-1.8L9 9.5Z"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',
  redo: '<path d="m15 14 5-5-5-5"/><path d="M20 9H10a6 6 0 0 0 0 12h3"/>',
  reset: '<path d="M4 12a8 8 0 1 0 2.3-5.7"/><path d="M4 4v5h5"/>',
  rotate: '<path d="M4 12a8 8 0 0 1 14-5.3"/><path d="M18 3v4h-4"/><path d="M20 12a8 8 0 0 1-14 5.3"/><path d="M6 21v-4h4"/>',
  camera2: '<path d="M4 8h3l2-2h6l2 2h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5"/><path d="M4 20h16"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  pin: '<path d="M12 21s6-5.3 6-11a6 6 0 0 0-12 0c0 5.7 6 11 6 11Z"/><circle cx="12" cy="10" r="2"/>',
  send: '<path d="m3 11 18-8-8 18-2-8-8-2Z"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  home: '<path d="m3 11 9-7 9 7"/><path d="M5 10v10h14V10"/>',
  bed: '<path d="M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6"/><path d="M3 18h18M5 10V6h14v4"/>',
  expand: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  shrink: '<path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/>',
  back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  wide: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M8 6v12M16 6v12"/>',
};

export function icon(name, cls = '') {
  const p = paths[name] || paths.spark;
  return `<svg class="ico ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
}

/** Drapeaux vectoriels (les emojis drapeaux ne s'affichent pas sous Windows). */
export function flag(code) {
  const svgs = {
    BJ: '<svg viewBox="0 0 30 20" aria-hidden="true"><rect width="30" height="20" fill="#fcd116"/><rect y="10" width="30" height="10" fill="#e8112d"/><rect width="12" height="20" fill="#008751"/></svg>',
    TG: '<svg viewBox="0 0 30 20" aria-hidden="true"><rect width="30" height="20" fill="#006a4e"/><rect y="4" width="30" height="4" fill="#ffce00"/><rect y="12" width="30" height="4" fill="#ffce00"/><rect width="12" height="12" fill="#d21034"/><polygon points="6,2.2 7.2,5.6 10.8,5.6 7.9,7.7 9,11.1 6,9 3,11.1 4.1,7.7 1.2,5.6 4.8,5.6" fill="#fff"/></svg>',
    CI: '<svg viewBox="0 0 30 20" aria-hidden="true"><rect width="10" height="20" fill="#f77f00"/><rect x="10" width="10" height="20" fill="#fff"/><rect x="20" width="10" height="20" fill="#009e60"/></svg>',
  };
  return `<span class="flag-svg">${svgs[code] || ''}</span>`;
}

export const PRODUCT_ICONS = {
  interrupteur: 'light', clim: 'snow', tv: 'tv', musique: 'music', rideau: 'curtain',
  camera: 'camera', serrure: 'lock', capteur: 'sensor', alarme: 'alarm', aspirateur: 'robot',
};
export const ENV_ICONS = { salon: 'sofa', 'grand-salon': 'wide', chambre: 'bed' };
