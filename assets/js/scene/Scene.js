import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { buildRoom } from './room.js';
import { buildFurniture } from './furniture.js';
import { buildEquipment } from './equipment.js';
import { productById } from '../data/catalog.js';

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const easeOutBack = (t) => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2);
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/**
 * Scène 3D du configurateur (Three.js).
 * - Rendu à la demande : on ne redessine que lorsqu'il se passe quelque chose.
 * - Murs et plafond masqués automatiquement selon l'angle de vue.
 * - Qualité adaptée à l'appareil (ombres, pixel ratio).
 */
export class ConfiguratorScene {
  constructor(canvas, { interactive = true, onSelect = null, onHover = null, autoRotate = false, quality = 'auto', fitPortrait = true, maxPixelRatio = null } = {}) {
    this.canvas = canvas;
    this.fitPortrait = fitPortrait;
    this.onSelect = onSelect;
    this.onHover = onHover;
    this.interactive = interactive;
    this.env = null;
    this.meshes = new Map(); // uid -> group
    this.tweens = [];
    this.selectedUid = null;
    this.hoverUid = null;
    this.disposed = false;
    this.needsRender = true;

    const lowEnd = (navigator.hardwareConcurrency || 4) <= 4 || /Android|iPhone|iPad/i.test(navigator.userAgent);
    this.quality = quality === 'auto' ? (lowEnd ? 'low' : 'high') : quality;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    const touch = window.matchMedia('(pointer: coarse)').matches;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.quality === 'high' ? 2 : (touch ? 1.35 : 1.5), maxPixelRatio || Infinity));
    this.renderer.shadowMap.enabled = this.quality === 'high';
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 60);
    this.camera.position.set(5, 3.4, 6);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.04;
    this.controls.minPolarAngle = 0.25;
    this.controls.minDistance = 2.5;
    this.controls.maxDistance = 14;
    this.controls.enablePan = interactive;
    this.controls.enableZoom = interactive;
    this.controls.enableRotate = true;
    this.controls.autoRotate = autoRotate && !reduceMotion();
    this.controls.autoRotateSpeed = 0.5;
    this.controls.addEventListener('change', () => this.invalidate());
    this.controls.addEventListener('start', () => { this.userInteracted = true; if (autoRotate) this.controls.autoRotate = false; });

    // Éclairage
    this.scene.add(new THREE.HemisphereLight(0xdfe8f3, 0x8a7a66, 1.1));
    const sun = new THREE.DirectionalLight(0xfff2e0, 2.2);
    sun.position.set(-6, 7, 4);
    sun.castShadow = this.quality === 'high';
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -6; sun.shadow.camera.right = 6; sun.shadow.camera.top = 6; sun.shadow.camera.bottom = -6;
    sun.shadow.camera.near = 1; sun.shadow.camera.far = 25;
    sun.shadow.bias = -0.0008;
    this.scene.add(sun);
    const fill = new THREE.DirectionalLight(0xcfe0ff, 0.6);
    fill.position.set(6, 4, -5);
    this.scene.add(fill);

    this.itemsGroup = new THREE.Group();
    this.scene.add(this.itemsGroup);

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    if (interactive) this.bindPointer();

    this.resizeObserver = new ResizeObserver(() => { if (this.resizeQueued) return; this.resizeQueued = true; requestAnimationFrame(() => { this.resizeQueued = false; this.resize(); }); });
    this.resizeObserver.observe(canvas.parentElement || canvas);
    this.resize();

    document.addEventListener('visibilitychange', () => { if (!document.hidden) this.invalidate(); });
    // Perte de contexte WebGL (onglet en arrière-plan, GPU saturé) : on laisse le navigateur restaurer puis on redessine.
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault(); this.contextLost = true;
      clearTimeout(this.lostTimer);
      this.lostTimer = setTimeout(() => { if (this.contextLost) this.onContextLost?.(); }, 4000);
    });
    canvas.addEventListener('webglcontextrestored', () => { this.contextLost = false; clearTimeout(this.lostTimer); this.onContextRestored?.(); this.invalidate(); });
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  /* ---------- environnement ---------- */
  setEnvironment(env) {
    if (this.room) { this.scene.remove(this.room.group); disposeTree(this.room.group); }
    if (this.furniture) { this.scene.remove(this.furniture); disposeTree(this.furniture); }
    this.env = env;
    this.room = buildRoom(env);
    if (!this.renderer.shadowMap.enabled) this.room.ground.removeFromParent(); // pas d'ombre au sol sans shadow map
    this.furniture = buildFurniture(env);
    this.scene.add(this.room.group, this.furniture);
    for (const [uid, g] of this.meshes) { this.itemsGroup.remove(g); disposeTree(g); this.meshes.delete(uid); }
    this.setView('ensemble', true);
    this.invalidate();
  }

  /* ---------- synchronisation avec l'état ---------- */
  sync(items) {
    if (!this.env) return;
    const seen = new Set();
    let lightOn = true;
    let hasSwitch = false;
    for (const it of items) {
      seen.add(it.uid);
      const product = productById(it.productId);
      const slot = this.env.slots.find((s) => s.id === it.slotId);
      if (!product || !slot) continue;
      if (product.id === 'interrupteur') { hasSwitch = true; if (it.options.demo === 'off') lightOn = false; }
      let g = this.meshes.get(it.uid);
      if (g && (g.userData.productId !== it.productId || g.userData.slotId !== it.slotId)) {
        this.itemsGroup.remove(g); disposeTree(g); g = null;
      }
      if (!g) {
        g = buildEquipment(product, slot, it.options);
        g.userData.uid = it.uid; g.userData.productId = it.productId; g.userData.slotId = it.slotId;
        g.traverse((m) => { m.userData.uid = it.uid; });
        this.itemsGroup.add(g);
        this.meshes.set(it.uid, g);
        this.popIn(g);
      } else {
        g.userData.applyOptions(it.options, true);
      }
    }
    for (const [uid, g] of this.meshes) {
      if (!seen.has(uid)) { this.meshes.delete(uid); this.popOut(g); }
    }
    this.room.light.setOn(hasSwitch ? lightOn : true);
    if (this.selectedUid && !seen.has(this.selectedUid)) this.setSelected(null);
    this.invalidate();
  }

  popIn(g) {
    if (reduceMotion()) return;
    const s = g.scale.clone();
    g.scale.setScalar(0.001);
    this.addTween({ dur: 520, ease: easeOutBack, apply: (k) => g.scale.copy(s).multiplyScalar(Math.max(0.001, k)) });
  }
  popOut(g) {
    const done = () => { this.itemsGroup.remove(g); disposeTree(g); };
    if (reduceMotion()) return done();
    const s = g.scale.clone();
    this.addTween({ dur: 260, ease: easeInOut, apply: (k) => g.scale.copy(s).multiplyScalar(Math.max(0.001, 1 - k)), onDone: done });
  }

  /* ---------- sélection ---------- */
  setSelected(uid) {
    if (this.selectedUid === uid) return;
    const prev = this.meshes.get(this.selectedUid);
    if (prev) highlight(prev, 0);
    this.selectedUid = uid;
    const g = this.meshes.get(uid);
    if (g) highlight(g, 0.35);
    this.invalidate();
  }
  setHover(uid) {
    if (this.hoverUid === uid) return;
    const prev = this.meshes.get(this.hoverUid);
    if (prev && this.hoverUid !== this.selectedUid) highlight(prev, 0);
    this.hoverUid = uid;
    const g = this.meshes.get(uid);
    if (g && uid !== this.selectedUid) highlight(g, 0.15);
    this.canvas.style.cursor = uid ? 'pointer' : '';
    this.invalidate();
  }

  focusItem(uid) {
    const g = this.meshes.get(uid);
    if (!g) return;
    g.updateWorldMatrix(true, false); // l'objet vient peut-être d'être ajouté : matrice pas encore calculée
    const anchor = (g.userData.anchor || new THREE.Vector3()).clone().applyMatrix4(g.matrixWorld);
    const slot = this.env.slots.find((s) => s.id === g.userData.slotId);
    const dir = new THREE.Vector3();
    if (slot?.wall) dir.set({ left: 1, right: -1 }[slot.wall] || 0, 0, { back: 1, front: -1 }[slot.wall] || 0);
    else dir.copy(this.camera.position).sub(anchor).setY(0).normalize();
    let dist = g.userData.productId === 'rideau' || g.userData.productId === 'tv' || g.userData.productId === 'clim' ? 3.4 : 2.2;
    if (g.userData.productId === 'portail') { dir.set(1, 0, 0.55).normalize(); dist = 5.2; } // vu depuis la rue
    const target = anchor.clone().add(dir.multiplyScalar(dist)).add(new THREE.Vector3(0, 0.9, 0));
    this.flyTo(target, anchor);
  }

  setView(id, immediate = false) {
    if (!this.env) return;
    const { w, h, d } = this.env.size;
    const center = new THREE.Vector3(0, h * 0.4, 0);
    const views = {
      ensemble: { pos: new THREE.Vector3(w * 0.95, h * 1.35, d * 1.25), look: center },
      face: { pos: new THREE.Vector3(0, h * 0.55, d * 0.95), look: new THREE.Vector3(0, h * 0.45, -d / 2) },
      plongee: { pos: new THREE.Vector3(0.01, h * 2.6, d * 0.35), look: new THREE.Vector3(0, 0, 0) },
      fenetre: { pos: new THREE.Vector3(w * 0.3, h * 0.6, d * 0.2), look: new THREE.Vector3(-w / 2, 1.4, -0.3) },
    };
    const v = views[id] || views.ensemble;
    if (immediate || reduceMotion()) {
      this.camera.position.copy(v.pos); this.controls.target.copy(v.look); this.controls.update();
    } else this.flyTo(v.pos, v.look);
  }

  flyTo(pos, look) {
    const p0 = this.camera.position.clone(), t0 = this.controls.target.clone();
    this.addTween({ dur: 900, ease: easeInOut, apply: (k) => { this.camera.position.lerpVectors(p0, pos, k); this.controls.target.lerpVectors(t0, look, k); this.controls.update(); } });
  }

  /* ---------- pointeur ---------- */
  bindPointer() {
    let down = null;
    const toPointer = (e) => {
      const r = this.canvas.getBoundingClientRect();
      this.pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    };
    const pick = () => {
      this.raycaster.setFromCamera(this.pointer, this.camera);
      const hits = this.raycaster.intersectObjects(this.itemsGroup.children, true);
      return hits.length ? hits[0].object.userData.uid : null;
    };
    this.canvas.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY }; });
    this.canvas.addEventListener('pointerup', (e) => {
      if (!down) return;
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
      down = null;
      if (moved > 6) return;
      toPointer(e);
      const uid = pick();
      this.onSelect?.(uid);
    });
    this.canvas.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      toPointer(e);
      const uid = pick();
      if (uid !== this.hoverUid) { this.setHover(uid); this.onHover?.(uid); }
    });
    this.canvas.addEventListener('pointerleave', () => this.setHover(null));
  }

  /* ---------- rendu ---------- */
  addTween(t) { this.tweens.push({ ...t, start: performance.now() }); this.invalidate(); }
  invalidate() { this.needsRender = true; }
  setPaused(p) { this.paused = !!p; if (!p) this.invalidate(); }

  updateCutaway() {
    if (!this.room) return;
    const dir = this.camera.position.clone().sub(this.controls.target).normalize();
    for (const wall of this.room.walls) {
      wall.mesh.visible = dir.dot(wall.normal) > -0.15;
    }
    this.room.ceiling.visible = dir.y < 0.28;
  }

  loop(now) {
    if (this.disposed) return;
    requestAnimationFrame(this.loop);
    if (this.paused) return; // hors écran : aucun calcul ni rendu
    let active = this.needsRender;
    if (this.tweens.length) {
      active = true;
      this.tweens = this.tweens.filter((t) => {
        const k = Math.min(1, (now - t.start) / t.dur);
        t.apply(t.ease(k));
        if (k >= 1) { t.onDone?.(); return false; }
        return true;
      });
    }
    for (const g of this.meshes.values()) if (g.userData.tick && g.userData.tick()) active = true;
    if (this.controls.autoRotate) active = true;
    if (this.controls.update()) active = true;
    if (!active || this.contextLost) return;
    this.needsRender = false;
    this.updateCutaway();
    this.renderer.render(this.scene, this.camera);
  }

  resize() {
    const el = this.canvas.parentElement || this.canvas;
    const w = Math.max(1, el.clientWidth), h = Math.max(1, el.clientHeight);
    // Même taille : on ne touche à rien (redimensionner vide et réalloue le canvas, ce qui saccade le défilement mobile).
    if (w === this._w && h === this._h) return;
    this._w = w; this._h = h;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // Écran étroit : on garde la largeur de champ d'un écran 16:10 pour que la pièce entière reste visible.
    const REF = 1.45, BASE_FOV = 42;
    if (this.fitPortrait && this.camera.aspect < REF) {
      const t = Math.tan(THREE.MathUtils.degToRad(BASE_FOV / 2)) * REF / this.camera.aspect;
      this.camera.fov = Math.min(78, THREE.MathUtils.radToDeg(2 * Math.atan(t)));
    } else this.camera.fov = BASE_FOV;
    this.camera.updateProjectionMatrix();
    this.invalidate();
  }

  /** Prépare les shaders en tâche de fond (sans bloquer la page) avant le premier affichage. */
  async warmup() {
    try { if (this.renderer.compileAsync) await this.renderer.compileAsync(this.scene, this.camera); } catch { /* repli : compilation au premier rendu */ }
    this.invalidate();
  }

  snapshot() {
    this.updateCutaway();
    this.renderer.render(this.scene, this.camera);
    return this.renderer.domElement.toDataURL('image/png');
  }

  dispose() {
    this.disposed = true;
    this.resizeObserver.disconnect();
    this.controls.dispose();
    this.renderer.dispose();
  }
}

function highlight(group, strength) {
  group.traverse((m) => {
    if (!m.isMesh) return;
    if (!m.userData.baseMat) { m.userData.baseMat = m.material; }
    if (strength > 0) {
      if (!m.userData.hlMat) {
        m.userData.hlMat = m.userData.baseMat.clone();
        m.userData.hlMat.emissive = new THREE.Color(0x2f6bff);
      }
      m.userData.hlMat.emissiveIntensity = Math.max(m.userData.baseMat.emissiveIntensity || 0, strength);
      m.material = m.userData.hlMat;
    } else {
      m.material = m.userData.baseMat;
    }
  });
}

function disposeTree(obj) {
  obj.traverse((m) => {
    if (m.isMesh) {
      m.geometry?.dispose?.();
      // les matériaux partagés via mat() sont mis en cache : on ne les libère pas
      if (m.userData.hlMat) m.userData.hlMat.dispose();
    }
  });
}
