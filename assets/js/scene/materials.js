import * as THREE from 'three';

/** Palette de la maquette : neutres chauds, un accent bleu pour l'électronique. */
export const PALETTE = {
  wall: 0xece6da,
  wallDark: 0xd9d2c3,
  floor: 0xb59a74,
  ceiling: 0xf4f1ea,
  ground: 0xd9d4ca,
  wood: 0x5c4733,
  woodLight: 0x9c825f,
  fabric: 0x3a4a59,
  cushion: 0xe3b86b,
  rug: 0xd8cbb3,
  metal: 0x9aa0a6,
  white: 0xf7f7f5,
  black: 0x1c1e22,
  glass: 0xbfd9ea,
  leaf: 0x4f8a57,
  accent: 0x2f6bff,
  warm: 0xffc46b,
  cool: 0x8fd3ff,
};

const cache = new Map();
export function mat(color, { roughness = 0.85, metalness = 0.0, emissive = 0x000000, emissiveIntensity = 0, transparent = false, opacity = 1, side = THREE.FrontSide } = {}) {
  const key = `${color}|${roughness}|${metalness}|${emissive}|${emissiveIntensity}|${transparent}|${opacity}|${side}`;
  if (!cache.has(key)) {
    cache.set(key, new THREE.MeshStandardMaterial({ color, roughness, metalness, emissive, emissiveIntensity, transparent, opacity, side }));
  }
  return cache.get(key);
}

export function box(w, h, d, material, { x = 0, y = 0, z = 0, castShadow = true, receiveShadow = true } = {}) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(x, y, z);
  m.castShadow = castShadow; m.receiveShadow = receiveShadow;
  return m;
}

export function cylinder(rTop, rBottom, h, material, { x = 0, y = 0, z = 0, segments = 24, castShadow = true } = {}) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, h, segments), material);
  m.position.set(x, y, z);
  m.castShadow = castShadow; m.receiveShadow = true;
  return m;
}

export function sphere(r, material, { x = 0, y = 0, z = 0, segments = 20 } = {}) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, segments, segments), material);
  m.position.set(x, y, z);
  m.castShadow = true;
  return m;
}

/** Boîte aux arêtes légèrement arrondies (approximation par géométrie classique, sans dépendance). */
export function roundedBox(w, h, d, r, material, opts = {}) {
  const shape = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  shape.moveTo(x + r, y);
  shape.lineTo(x + w - r, y); shape.quadraticCurveTo(x + w, y, x + w, y + r);
  shape.lineTo(x + w, y + h - r); shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  shape.lineTo(x + r, y + h); shape.quadraticCurveTo(x, y + h, x, y + h - r);
  shape.lineTo(x, y + r); shape.quadraticCurveTo(x, y, x + r, y);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: false, curveSegments: 6 });
  geo.translate(0, 0, -d / 2);
  const m = new THREE.Mesh(geo, material);
  m.position.set(opts.x || 0, opts.y || 0, opts.z || 0);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

/** Texture d'écran « application NÉO-CONNECT » dessinée au canvas (visuel provisoire). */
export function makeScreenTexture(on = true) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 288;
  const g = c.getContext('2d');
  if (!on) {
    g.fillStyle = '#0a0c10'; g.fillRect(0, 0, c.width, c.height);
  } else {
    const grad = g.createLinearGradient(0, 0, c.width, c.height);
    grad.addColorStop(0, '#13213f'); grad.addColorStop(1, '#2f6bff');
    g.fillStyle = grad; g.fillRect(0, 0, c.width, c.height);
    g.fillStyle = 'rgba(255,255,255,0.12)';
    for (let i = 0; i < 4; i++) { g.beginPath(); g.roundRect(40 + i * 112, 150, 96, 96, 14); g.fill(); }
    g.fillStyle = '#ffffff';
    g.font = '600 34px sans-serif';
    g.fillText('Ma maison', 40, 70);
    g.font = '400 20px sans-serif';
    g.fillStyle = 'rgba(255,255,255,0.8)';
    g.fillText('Salon · 4 équipements connectés', 40, 104);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
