import * as THREE from 'three';
import { PALETTE, mat, box, cylinder, sphere, roundedBox, makeScreenTexture } from './materials.js';
import { wallRotation } from '../data/environments.js';

/**
 * Équipements procéduraux (VISUELS PROVISOIRES).
 * Chaque constructeur retourne un THREE.Group avec :
 *   group.userData.applyOptions(options, animate) : applique les options (démo, variantes)
 *   group.userData.anchor : point d'ancrage pour le cadrage caméra
 * Les proportions sont réalistes pour la catégorie, pas pour un modèle précis de NÉO-CONNECT.
 */

const led = (color = PALETTE.accent, r = 0.006) => {
  const m = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 2.2, roughness: 0.3 });
  return new THREE.Mesh(new THREE.SphereGeometry(r, 10, 10), m);
};

const builders = {
  interrupteur(options) {
    const g = new THREE.Group();
    const plate = roundedBox(0.086, 0.086, 0.012, 0.01, mat(PALETTE.white, { roughness: 0.35 }), { z: 0.006 });
    const rocker = roundedBox(0.05, 0.05, 0.008, 0.006, mat(0xe9e9e6, { roughness: 0.4 }), { z: 0.016 });
    const dot = led(PALETTE.accent, 0.004); dot.position.set(0, -0.03, 0.02);
    g.add(plate, rocker, dot);
    g.userData.applyOptions = (o) => { dot.material.emissiveIntensity = o.demo === 'on' ? 2.2 : 0.4; dot.material.color.set(o.demo === 'on' ? PALETTE.accent : 0x888888); };
    g.userData.applyOptions(options);
    return g;
  },
  clim(options) {
    const g = new THREE.Group();
    const body = roundedBox(0.9, 0.3, 0.2, 0.05, mat(PALETTE.white, { roughness: 0.3 }), { z: 0.1 });
    const louver = box(0.84, 0.03, 0.02, mat(0xdcdcd8, { roughness: 0.5 }), { y: -0.1, z: 0.2 });
    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.012, 0.004), new THREE.MeshStandardMaterial({ color: PALETTE.cool, emissive: PALETTE.cool, emissiveIntensity: 1.8 }));
    strip.position.set(0.28, -0.02, 0.202);
    const dot = led(PALETTE.accent, 0.005); dot.position.set(0.4, -0.02, 0.202);
    g.add(body, louver, strip, dot);
    g.userData.applyOptions = (o, animate) => {
      const on = o.demo === 'on';
      strip.material.emissiveIntensity = on ? 1.8 : 0;
      strip.material.color.set(on ? PALETTE.cool : 0x9a9a9a);
      louver.rotation.x = on ? -0.6 : 0;
      void animate;
    };
    g.userData.applyOptions(options);
    return g;
  },
  tv(options) {
    const g = new THREE.Group();
    const frame = roundedBox(1.32, 0.76, 0.04, 0.01, mat(PALETTE.black, { roughness: 0.35, metalness: 0.2 }), { z: 0.02 });
    const texOn = makeScreenTexture(true), texOff = makeScreenTexture(false);
    const screenMat = new THREE.MeshStandardMaterial({ map: texOn, emissiveMap: texOn, emissive: 0xffffff, emissiveIntensity: 0.9, roughness: 0.2 });
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.26, 0.7), screenMat);
    screen.position.z = 0.041;
    const glow = new THREE.PointLight(0x7aa7ff, 0, 3, 2);
    glow.position.set(0, -0.2, 0.5);
    g.add(frame, screen, glow);
    g.userData.applyOptions = (o) => {
      const on = o.demo === 'on';
      screenMat.map = on ? texOn : texOff; screenMat.emissiveMap = on ? texOn : texOff;
      screenMat.emissiveIntensity = on ? 0.9 : 0.05; screenMat.needsUpdate = true;
      glow.intensity = on ? 2.5 : 0;
    };
    g.userData.applyOptions(options);
    return g;
  },
  musique() {
    const g = new THREE.Group();
    const body = cylinder(0.075, 0.08, 0.2, mat(0x2c2f36, { roughness: 0.9 }), { y: 0.1, segments: 28 });
    const top = cylinder(0.075, 0.075, 0.012, mat(PALETTE.black, { roughness: 0.3 }), { y: 0.206, segments: 28 });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.066, 0.004, 8, 40), new THREE.MeshStandardMaterial({ color: PALETTE.accent, emissive: PALETTE.accent, emissiveIntensity: 1.6 }));
    ring.rotation.x = Math.PI / 2; ring.position.y = 0.213;
    g.add(body, top, ring);
    g.userData.applyOptions = () => {};
    g.userData.anchor = new THREE.Vector3(0, 0.1, 0);
    return g;
  },
  rideau(options, slot) {
    const g = new THREE.Group();
    const W = (slot?.width || 1.4) + 0.5, H = (slot?.height || 1.3) + 0.45;
    const railMat = mat(PALETTE.metal, { roughness: 0.4, metalness: 0.7 });
    const rail = box(W + 0.1, 0.03, 0.05, railMat, { y: H / 2 + 0.02, z: 0.1 });
    const motor = roundedBox(0.12, 0.06, 0.06, 0.015, mat(PALETTE.white, { roughness: 0.4 }), { x: W / 2 - 0.02, y: H / 2 + 0.02, z: 0.1 });
    const dot = led(PALETTE.accent, 0.005); dot.position.set(W / 2 - 0.02, H / 2 - 0.02, 0.135);
    const fabric = new THREE.MeshStandardMaterial({ color: 0xd3c3a9, roughness: 1, side: THREE.DoubleSide });
    // Panneaux de rideau : géométrie ondulée pour suggérer les plis
    const panelL = wavyPanel(W / 2, H, fabric); panelL.position.set(-W / 4, 0, 0.1);
    const panelR = wavyPanel(W / 2, H, fabric); panelR.position.set(W / 4, 0, 0.1);
    // Volet roulant : caisson + tablier
    const shutterBox = roundedBox(W - 0.3, 0.16, 0.14, 0.02, mat(PALETTE.white, { roughness: 0.4 }), { y: H / 2 - 0.02, z: 0.07 });
    const shutter = slatPanel(W - 0.5, H - 0.25);
    shutter.position.set(0, H / 2 - 0.1, 0.09);
    g.add(rail, motor, dot, panelL, panelR, shutterBox, shutter);
    const state = { open: 0, target: 0 }; // 0 fermé, 1 ouvert
    g.userData.state = state;
    g.userData.applyOptions = (o) => {
      const isVolet = o.type === 'volet';
      rail.visible = motor.visible = panelL.visible = panelR.visible = !isVolet;
      shutterBox.visible = shutter.visible = isVolet;
      state.target = o.demo === 'open' ? 1 : 0;
    };
    g.userData.tick = () => {
      // Interpolation douce de l'ouverture (appelée par la scène à chaque image)
      const diff = state.target - state.open;
      if (Math.abs(diff) < 0.002) { state.open = state.target; } else { state.open += diff * 0.08; }
      const k = 1 - 0.78 * state.open; // largeur des panneaux : 100 % fermé → 22 % ouvert
      panelL.scale.x = k; panelL.position.x = -W / 2 + (W / 4) * k;
      panelR.scale.x = k; panelR.position.x = W / 2 - (W / 4) * k;
      // Le tablier du volet est ancré en haut : réduire scale.y le replie dans le caisson.
      shutter.scale.y = Math.max(0.02, 1 - 0.92 * state.open);
      return Math.abs(diff) >= 0.002;
    };
    g.userData.applyOptions(options);
    state.open = state.target; g.userData.tick();
    g.userData.anchor = new THREE.Vector3(0, 0, 0.2);
    return g;
  },
  camera(options, slot) {
    const g = new THREE.Group();
    const base = cylinder(0.05, 0.055, 0.02, mat(PALETTE.white, { roughness: 0.4 }), { y: -0.01 });
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.045, 20, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mat(0x2a2d33, { roughness: 0.15, metalness: 0.3 }));
    dome.position.y = -0.02;
    const lens = sphere(0.014, mat(0x0b0c10, { roughness: 0.1 }), { y: -0.045, segments: 10 });
    const dot = led(0xff4d4d, 0.004); dot.position.set(0.028, -0.03, 0.02);
    g.add(base, dome, lens, dot);
    g.userData.applyOptions = () => {};
    void options; void slot;
    return g;
  },
  serrure() {
    const g = new THREE.Group();
    const body = roundedBox(0.07, 0.16, 0.03, 0.012, mat(0x2a2d33, { roughness: 0.35, metalness: 0.5 }), { z: 0.015 });
    const keypad = new THREE.Mesh(new THREE.PlaneGeometry(0.045, 0.07), new THREE.MeshStandardMaterial({ color: 0x0f1115, emissive: PALETTE.accent, emissiveIntensity: 0.6, roughness: 0.2 }));
    keypad.position.set(0, 0.03, 0.031);
    const knob = cylinder(0.018, 0.018, 0.02, mat(PALETTE.metal, { roughness: 0.3, metalness: 0.8 }), { y: -0.045, z: 0.035 });
    knob.rotation.x = Math.PI / 2;
    g.add(body, keypad, knob);
    g.userData.applyOptions = () => {};
    return g;
  },
  capteur(options) {
    const g = new THREE.Group();
    const body = roundedBox(0.05, 0.08, 0.03, 0.012, mat(PALETTE.white, { roughness: 0.4 }), { z: 0.015 });
    const lens = new THREE.Mesh(new THREE.SphereGeometry(0.018, 12, 8), mat(0xf2f2ee, { roughness: 0.6, transparent: true, opacity: 0.9 }));
    lens.position.set(0, 0.01, 0.03);
    const strip = box(0.02, 0.06, 0.012, mat(PALETTE.white, { roughness: 0.4 }), { x: 0.045, z: 0.006 }); // aimant (ouverture)
    const dot = led(PALETTE.accent, 0.004); dot.position.set(0, -0.028, 0.031);
    g.add(body, lens, strip, dot);
    g.userData.applyOptions = (o) => { const open = String(o.type || '').startsWith('ouverture'); lens.visible = !open; strip.visible = open; };
    g.userData.applyOptions(options);
    return g;
  },
  alarme() {
    const g = new THREE.Group();
    const panel = roundedBox(0.12, 0.16, 0.025, 0.015, mat(PALETTE.white, { roughness: 0.4 }), { z: 0.012 });
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.05), new THREE.MeshStandardMaterial({ color: 0x0f1115, emissive: PALETTE.accent, emissiveIntensity: 0.7 }));
    screen.position.set(0, 0.04, 0.026);
    for (let i = 0; i < 9; i++) {
      const k = box(0.018, 0.012, 0.004, mat(0xe4e4e0, { roughness: 0.5 }), { x: -0.025 + (i % 3) * 0.025, y: -0.005 - Math.floor(i / 3) * 0.018, z: 0.026 });
      g.add(k);
    }
    const siren = roundedBox(0.16, 0.08, 0.05, 0.02, mat(PALETTE.white, { roughness: 0.4 }), { y: 0.5, z: 0.025 });
    const sirenLed = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.02, 0.006), new THREE.MeshStandardMaterial({ color: 0xff5a5a, emissive: 0xff2a2a, emissiveIntensity: 1.2 }));
    sirenLed.position.set(0, 0.5, 0.052);
    g.add(panel, screen, siren, sirenLed);
    g.userData.applyOptions = () => {};
    g.userData.anchor = new THREE.Vector3(0, 0.2, 0);
    return g;
  },
  aspirateur() {
    const g = new THREE.Group();
    const body = cylinder(0.17, 0.17, 0.09, mat(0x23262c, { roughness: 0.5, metalness: 0.2 }), { y: 0.045, segments: 36 });
    const top = cylinder(0.15, 0.15, 0.01, mat(0x3a3e46, { roughness: 0.4 }), { y: 0.095, segments: 36 });
    const button = cylinder(0.03, 0.03, 0.008, mat(PALETTE.white, { roughness: 0.4 }), { y: 0.104, segments: 20 });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.003, 8, 32), new THREE.MeshStandardMaterial({ color: PALETTE.accent, emissive: PALETTE.accent, emissiveIntensity: 1.5 }));
    ring.rotation.x = Math.PI / 2; ring.position.y = 0.105;
    const bumper = new THREE.Mesh(new THREE.TorusGeometry(0.165, 0.012, 8, 40), mat(0x15171b, { roughness: 0.7 }));
    bumper.rotation.x = Math.PI / 2; bumper.position.y = 0.03;
    g.add(body, top, button, ring, bumper);
    g.userData.applyOptions = () => {};
    g.userData.anchor = new THREE.Vector3(0, 0.05, 0);
    return g;
  },
};

function wavyPanel(w, h, material) {
  const geo = new THREE.PlaneGeometry(w, h, 24, 1);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    pos.setZ(i, Math.sin((x / w) * Math.PI * 10) * 0.035);
  }
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, material);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

function slatPanel(w, h) {
  const g = new THREE.Group();
  const geo = new THREE.BoxGeometry(w, h, 0.02);
  geo.translate(0, -h / 2, 0); // ancré en haut : scale.y replie le tablier vers le caisson
  const m = new THREE.Mesh(geo, mat(0xe6e6e2, { roughness: 0.6 }));
  m.castShadow = true;
  g.add(m);
  // lignes de lames
  const lineMat = mat(0xc9c9c4, { roughness: 0.8 });
  for (let y = 0.06; y < h; y += 0.08) {
    const l = new THREE.Mesh(new THREE.BoxGeometry(w, 0.006, 0.022), lineMat);
    l.position.y = -y;
    g.add(l);
  }
  return g;
}

/**
 * Crée l'objet 3D d'un équipement placé sur un emplacement donné.
 * Retourne un Group positionné et orienté dans la pièce.
 */
export function buildEquipment(product, slot, options) {
  const b = builders[product.id];
  const obj = b ? b(options, slot) : fallback();
  obj.name = `eq-${product.id}`;
  obj.position.set(...slot.pos);
  if (slot.wall) obj.rotation.y = wallRotation(slot.wall);
  if (slot.look) {
    const target = new THREE.Vector3(...slot.pos).add(new THREE.Vector3(...slot.look));
    obj.lookAt(target);
  }
  if (product.id === 'rideau') {
    // Le rideau est posé contre le mur, légèrement devant le cadre de fenêtre.
    obj.position.y = slot.pos[1] + 0.08;
  }
  if (product.id === 'alarme') obj.position.y = slot.pos[1] - 0.2;
  obj.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  if (!obj.userData.applyOptions) obj.userData.applyOptions = () => {};
  return obj;
}

function fallback() {
  const g = new THREE.Group();
  g.add(box(0.2, 0.2, 0.2, mat(PALETTE.accent, { roughness: 0.5 })));
  return g;
}
