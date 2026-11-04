import * as THREE from 'three';
import { PALETTE, mat, box } from './materials.js';

export const WALL_T = 0.12; // épaisseur des murs
const T = WALL_T;

/**
 * Construit la pièce : sol, plafond, quatre murs avec ouvertures (fenêtres, portes)
 * et le luminaire de plafond piloté par l'interrupteur intelligent.
 * Chaque groupe mur est centré à mi-hauteur ; son axe x local court le long du mur
 * et son axe z local pointe vers l'intérieur de la pièce.
 */
export function buildRoom(env) {
  const { w, h, d } = env.size;
  const group = new THREE.Group();
  group.name = 'room';

  // Sol, dalle et ombre portée au sol
  group.add(box(w + 2 * T, 0.1, d + 2 * T, mat(PALETTE.floor, { roughness: 0.7 }), { y: -0.05, castShadow: false }));
  const ground = new THREE.Mesh(new THREE.CircleGeometry(Math.max(w, d) * 1.6, 48), new THREE.ShadowMaterial({ opacity: 0.18 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.101; ground.receiveShadow = true;
  group.add(ground);
  group.add(box(w + 2 * T + 0.6, 0.02, d + 2 * T + 0.6, mat(PALETTE.ground, { roughness: 1 }), { y: -0.11, castShadow: false }));

  // Plinthes
  const plinthMat = mat(PALETTE.white, { roughness: 0.6 });
  group.add(box(w, 0.08, 0.02, plinthMat, { y: 0.04, z: -d / 2 + 0.01, castShadow: false }));
  group.add(box(0.02, 0.08, d, plinthMat, { x: -w / 2 + 0.01, y: 0.04, castShadow: false }));
  group.add(box(0.02, 0.08, d, plinthMat, { x: w / 2 - 0.01, y: 0.04, castShadow: false }));

  // Plafond
  const ceiling = box(w + 2 * T, 0.06, d + 2 * T, mat(PALETTE.ceiling, { roughness: 1 }), { y: h + 0.03, castShadow: false });
  group.add(ceiling);

  const wallDefs = {
    back: { length: w, center: [0, h / 2, -d / 2 - T / 2], rotY: 0, normal: new THREE.Vector3(0, 0, 1) },
    front: { length: w, center: [0, h / 2, d / 2 + T / 2], rotY: Math.PI, normal: new THREE.Vector3(0, 0, -1) },
    left: { length: d, center: [-w / 2 - T / 2, h / 2, 0], rotY: Math.PI / 2, normal: new THREE.Vector3(1, 0, 0) },
    right: { length: d, center: [w / 2 + T / 2, h / 2, 0], rotY: -Math.PI / 2, normal: new THREE.Vector3(-1, 0, 0) },
  };
  const openings = env.furniture.filter((f) => f.kind === 'window' || f.kind === 'door');
  const walls = [];
  for (const [name, def] of Object.entries(wallDefs)) {
    const wallGroup = new THREE.Group();
    wallGroup.name = `wall-${name}`;
    const ops = openings.filter((o) => o.wall === name).map((o) => ({
      u: wallCoord(name, o.pos),
      y: o.kind === 'door' ? o.height / 2 : o.pos[1],
      width: o.width, height: o.height, kind: o.kind,
    }));
    const wallMat = mat(name === 'back' ? PALETTE.wallDark : PALETTE.wall, { roughness: 0.95 });
    for (const p of wallPieces(def.length, h, ops)) {
      wallGroup.add(box(p.w, p.h, T, wallMat, { x: p.x, y: p.y - h / 2, castShadow: false }));
    }
    for (const o of ops) {
      const g = o.kind === 'window' ? buildWindow(o) : buildDoor(o);
      g.position.set(o.u, (o.kind === 'window' ? o.y : 0) - h / 2, 0);
      wallGroup.add(g);
    }
    wallGroup.position.set(...def.center);
    wallGroup.rotation.y = def.rotY;
    group.add(wallGroup);
    walls.push({ mesh: wallGroup, normal: def.normal, name });
  }

  const light = buildCeilingLight(h);
  group.add(light.group);

  return { group, walls, ceiling, light, ground };
}

/** Coordonnée d'un point monde le long d'un mur, dans le repère local du groupe mur. */
export function wallCoord(wall, pos) {
  switch (wall) {
    case 'back': return pos[0];
    case 'front': return -pos[0];
    case 'left': return -pos[2];
    case 'right': return pos[2];
    default: return 0;
  }
}

/** Découpe un mur (longueur L, hauteur H) autour des ouvertures : rectangles {x, y, w, h}, y mesuré depuis le sol. */
function wallPieces(L, H, ops) {
  const pieces = [];
  const sorted = [...ops].sort((a, b) => a.u - b.u);
  let cursor = -L / 2;
  for (const o of sorted) {
    const left = o.u - o.width / 2, right = o.u + o.width / 2;
    if (left > cursor + 0.001) pieces.push({ x: (cursor + left) / 2, y: H / 2, w: left - cursor, h: H });
    const bottom = o.y - o.height / 2, top = o.y + o.height / 2;
    if (bottom > 0.001) pieces.push({ x: o.u, y: bottom / 2, w: o.width, h: bottom });
    if (top < H - 0.001) pieces.push({ x: o.u, y: (top + H) / 2, w: o.width, h: H - top });
    cursor = right;
  }
  if (cursor < L / 2 - 0.001) pieces.push({ x: (cursor + L / 2) / 2, y: H / 2, w: L / 2 - cursor, h: H });
  return pieces;
}

function buildWindow(o) {
  const g = new THREE.Group();
  const frameMat = mat(PALETTE.white, { roughness: 0.5 });
  const f = 0.06;
  g.add(box(o.width + 2 * f, f, T + 0.02, frameMat, { y: o.height / 2 + f / 2 }));
  g.add(box(o.width + 2 * f, f, T + 0.02, frameMat, { y: -o.height / 2 - f / 2 }));
  g.add(box(f, o.height, T + 0.02, frameMat, { x: -o.width / 2 - f / 2 }));
  g.add(box(f, o.height, T + 0.02, frameMat, { x: o.width / 2 + f / 2 }));
  g.add(box(0.04, o.height, 0.04, frameMat));
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(o.width, o.height),
    mat(PALETTE.glass, { roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.45, side: THREE.DoubleSide }));
  g.add(glass);
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(o.width + 1.2, o.height + 1.0), new THREE.MeshBasicMaterial({ color: 0xcfe3f2 }));
  sky.position.z = -0.5;
  g.add(sky);
  return g;
}

function buildDoor(o) {
  const g = new THREE.Group();
  const frameMat = mat(PALETTE.white, { roughness: 0.5 });
  const f = 0.07;
  g.add(box(f, o.height, T + 0.02, frameMat, { x: -o.width / 2 - f / 2, y: o.height / 2 }));
  g.add(box(f, o.height, T + 0.02, frameMat, { x: o.width / 2 + f / 2, y: o.height / 2 }));
  g.add(box(o.width + 2 * f, f, T + 0.02, frameMat, { y: o.height + f / 2 }));
  g.add(box(o.width - 0.02, o.height - 0.02, 0.05, mat(PALETTE.wood, { roughness: 0.6 }), { y: o.height / 2 }));
  g.add(box(0.12, 0.025, 0.025, mat(PALETTE.metal, { roughness: 0.3, metalness: 0.8 }), { x: o.width / 2 - 0.14, y: 1.02, z: 0.05 }));
  return g;
}

function buildCeilingLight(h) {
  const group = new THREE.Group();
  const fixtureMat = mat(PALETTE.white, { roughness: 0.4 });
  const rod = box(0.02, 0.5, 0.02, fixtureMat, { y: h - 0.25, castShadow: false });
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.26, 0.22, 32, 1, true),
    new THREE.MeshStandardMaterial({ color: PALETTE.white, roughness: 0.6, side: THREE.DoubleSide }));
  shade.position.y = h - 0.6;
  const bulbMat = new THREE.MeshStandardMaterial({ color: 0xfff1d6, emissive: PALETTE.warm, emissiveIntensity: 1.6, roughness: 0.3 });
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 16), bulbMat);
  bulb.position.y = h - 0.62;
  const point = new THREE.PointLight(0xffd9a8, 14, 9, 2);
  point.position.y = h - 0.7;
  group.add(rod, shade, bulb, point);
  const setOn = (on) => { point.intensity = on ? 14 : 0; bulbMat.emissiveIntensity = on ? 1.6 : 0.03; };
  return { group, setOn };
}
