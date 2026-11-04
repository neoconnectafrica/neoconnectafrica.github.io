import * as THREE from 'three';
import { PALETTE, mat, box, cylinder, sphere, roundedBox } from './materials.js';

/** Mobilier procédural (visuel provisoire, remplaçable par des modèles glTF). */
const builders = {
  sofa() {
    const g = new THREE.Group();
    const fabric = mat(PALETTE.fabric, { roughness: 0.95 });
    g.add(roundedBox(2.0, 0.42, 0.9, 0.06, fabric, { y: 0.21 }));            // assise
    g.add(roundedBox(2.0, 0.5, 0.22, 0.06, fabric, { y: 0.62, z: -0.34 }));  // dossier
    g.add(roundedBox(0.22, 0.56, 0.9, 0.06, fabric, { x: -0.89, y: 0.28 })); // accoudoirs
    g.add(roundedBox(0.22, 0.56, 0.9, 0.06, fabric, { x: 0.89, y: 0.28 }));
    const cushion = mat(PALETTE.cushion, { roughness: 1 });
    g.add(roundedBox(0.4, 0.4, 0.14, 0.05, cushion, { x: -0.5, y: 0.6, z: -0.2 }));
    g.add(roundedBox(0.4, 0.4, 0.14, 0.05, mat(PALETTE.white, { roughness: 1 }), { x: 0.55, y: 0.6, z: -0.2 }));
    const leg = mat(PALETTE.wood, { roughness: 0.5 });
    for (const [x, z] of [[-0.9, -0.38], [0.9, -0.38], [-0.9, 0.38], [0.9, 0.38]]) g.add(cylinder(0.025, 0.025, 0.1, leg, { x, y: 0.05, z }));
    return g;
  },
  armchair() {
    const g = new THREE.Group();
    const fabric = mat(PALETTE.cushion, { roughness: 1 });
    g.add(roundedBox(0.8, 0.42, 0.8, 0.06, fabric, { y: 0.21 }));
    g.add(roundedBox(0.8, 0.5, 0.2, 0.06, fabric, { y: 0.62, z: -0.3 }));
    g.add(roundedBox(0.18, 0.54, 0.8, 0.06, fabric, { x: -0.31, y: 0.27 }));
    g.add(roundedBox(0.18, 0.54, 0.8, 0.06, fabric, { x: 0.31, y: 0.27 }));
    return g;
  },
  'coffee-table'() {
    const g = new THREE.Group();
    g.add(roundedBox(1.0, 0.04, 0.55, 0.03, mat(PALETTE.wood, { roughness: 0.45 }), { y: 0.4 }));
    const leg = mat(PALETTE.black, { roughness: 0.4, metalness: 0.4 });
    for (const [x, z] of [[-0.45, -0.22], [0.45, -0.22], [-0.45, 0.22], [0.45, 0.22]]) g.add(box(0.03, 0.38, 0.03, leg, { x, y: 0.19, z }));
    g.add(box(0.22, 0.03, 0.3, mat(PALETTE.white, { roughness: 0.9 }), { x: 0.2, y: 0.435, z: 0.05 })); // magazine
    return g;
  },
  'tv-unit'() {
    const g = new THREE.Group();
    g.add(roundedBox(1.8, 0.45, 0.42, 0.03, mat(PALETTE.woodLight, { roughness: 0.6 }), { y: 0.255 }));
    g.add(box(1.76, 0.02, 0.4, mat(PALETTE.wood, { roughness: 0.6 }), { y: 0.26 }));
    g.add(box(1.8, 0.03, 0.42, mat(PALETTE.wood, { roughness: 0.5 }), { y: 0.49 }));
    for (const x of [-0.6, 0, 0.6]) g.add(box(0.5, 0.18, 0.02, mat(PALETTE.wood, { roughness: 0.6 }), { x, y: 0.15, z: 0.2 }));
    return g;
  },
  'side-table'() {
    const g = new THREE.Group();
    g.add(cylinder(0.25, 0.25, 0.03, mat(PALETTE.wood, { roughness: 0.5 }), { y: 0.54 }));
    g.add(cylinder(0.025, 0.04, 0.52, mat(PALETTE.black, { roughness: 0.4, metalness: 0.5 }), { y: 0.26 }));
    g.add(cylinder(0.16, 0.16, 0.02, mat(PALETTE.black, { roughness: 0.4, metalness: 0.5 }), { y: 0.01 }));
    return g;
  },
  nightstand() {
    const g = new THREE.Group();
    g.add(roundedBox(0.5, 0.52, 0.42, 0.02, mat(PALETTE.woodLight, { roughness: 0.6 }), { y: 0.28 }));
    g.add(box(0.5, 0.03, 0.42, mat(PALETTE.wood, { roughness: 0.5 }), { y: 0.545 }));
    g.add(box(0.1, 0.015, 0.015, mat(PALETTE.metal, { roughness: 0.3, metalness: 0.8 }), { y: 0.35, z: 0.215 }));
    return g;
  },
  bed() {
    const g = new THREE.Group();
    g.add(roundedBox(1.7, 0.3, 2.0, 0.04, mat(PALETTE.woodLight, { roughness: 0.6 }), { y: 0.15 }));
    g.add(roundedBox(1.6, 0.22, 1.9, 0.06, mat(PALETTE.white, { roughness: 1 }), { y: 0.41 }));
    g.add(roundedBox(1.6, 0.12, 1.1, 0.05, mat(PALETTE.fabric, { roughness: 1 }), { y: 0.56, z: 0.35 })); // couverture
    g.add(roundedBox(0.62, 0.12, 0.4, 0.05, mat(PALETTE.white, { roughness: 1 }), { x: -0.4, y: 0.58, z: -0.65 }));
    g.add(roundedBox(0.62, 0.12, 0.4, 0.05, mat(PALETTE.white, { roughness: 1 }), { x: 0.4, y: 0.58, z: -0.65 }));
    g.add(roundedBox(1.8, 0.9, 0.08, 0.03, mat(PALETTE.wood, { roughness: 0.6 }), { y: 0.6, z: -1.0 })); // tête de lit
    return g;
  },
  wardrobe() {
    const g = new THREE.Group();
    g.add(roundedBox(1.2, 2.1, 0.55, 0.02, mat(PALETTE.woodLight, { roughness: 0.6 }), { y: 1.05 }));
    g.add(box(0.01, 2.0, 0.01, mat(PALETTE.wood, { roughness: 0.6 }), { y: 1.05, z: 0.28 }));
    g.add(box(0.02, 0.25, 0.02, mat(PALETTE.metal, { roughness: 0.3, metalness: 0.8 }), { x: -0.06, y: 1.05, z: 0.29 }));
    g.add(box(0.02, 0.25, 0.02, mat(PALETTE.metal, { roughness: 0.3, metalness: 0.8 }), { x: 0.06, y: 1.05, z: 0.29 }));
    return g;
  },
  shelf() {
    const g = new THREE.Group();
    g.add(box(0.9, 0.03, 0.24, mat(PALETTE.wood, { roughness: 0.5 }), { y: 0, z: 0.12 }));
    g.add(box(0.12, 0.2, 0.16, mat(PALETTE.cushion, { roughness: 1 }), { x: -0.3, y: 0.115, z: 0.12 }));
    g.add(box(0.1, 0.24, 0.14, mat(PALETTE.fabric, { roughness: 1 }), { x: -0.17, y: 0.135, z: 0.12 }));
    return g;
  },
  plant() {
    const g = new THREE.Group();
    g.add(cylinder(0.16, 0.13, 0.32, mat(0xb9b0a3, { roughness: 0.9 }), { y: 0.16 }));
    const leaf = mat(PALETTE.leaf, { roughness: 0.8, side: THREE.DoubleSide });
    for (let i = 0; i < 7; i++) {
      const l = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.6, 6), leaf);
      const a = (i / 7) * Math.PI * 2;
      l.position.set(Math.cos(a) * 0.12, 0.6, Math.sin(a) * 0.12);
      l.rotation.set(Math.cos(a) * 0.6, 0, -Math.sin(a) * 0.6);
      l.castShadow = true;
      g.add(l);
    }
    g.add(sphere(0.18, leaf, { y: 0.78, segments: 10 }));
    return g;
  },
  rug() {
    const g = new THREE.Group();
    const m = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.012, 1.8), mat(PALETTE.rug, { roughness: 1 }));
    m.receiveShadow = true;
    g.add(m);
    return g;
  },
};

export function buildFurniture(env) {
  const group = new THREE.Group();
  group.name = 'furniture';
  for (const f of env.furniture) {
    const b = builders[f.kind];
    if (!b) continue; // fenêtres, portes et luminaire sont construits avec la pièce
    const obj = b();
    obj.position.set(...f.pos);
    if (f.rotY) obj.rotation.y = f.rotY;
    if (f.wall) {
      // Objet plaqué sur un mur (étagère) : on l'oriente vers l'intérieur.
      obj.rotation.y = { back: 0, front: Math.PI, left: Math.PI / 2, right: -Math.PI / 2 }[f.wall];
    }
    group.add(obj);
  }
  return group;
}
