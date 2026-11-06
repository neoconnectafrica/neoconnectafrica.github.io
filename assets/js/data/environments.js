/**
 * Environnements de la maquette.
 * Dimensions en mètres, origine au centre du sol. Le mur avant (z = +depth/2)
 * est celui par lequel on regarde ; la scène masque automatiquement les murs
 * qui font face à la caméra.
 *
 * Chaque emplacement (slot) accueille un type d'équipement. Les positions sont
 * provisoires et seront ajustées sur les plans / photos réels de NÉO-CONNECT.
 */

const salonBase = (w, h, d, extraSlots = [], extraFurniture = []) => ({
  size: { w, h, d },
  furniture: [
    { kind: 'sofa', pos: [0, 0, 0.6], rotY: Math.PI },
    { kind: 'coffee-table', pos: [0, 0, -0.35] },
    { kind: 'tv-unit', pos: [0, 0, -d / 2 + 0.25] },
    { kind: 'side-table', pos: [-w / 2 + 0.45, 0, 1.0] },
    { kind: 'plant', pos: [w / 2 - 0.4, 0, -d / 2 + 0.45] },
    { kind: 'rug', pos: [0, 0.005, 0.1] },
    { kind: 'window', wall: 'left', pos: [-w / 2, 1.45, -0.3], width: 1.6, height: 1.3 },
    { kind: 'door', wall: 'right', pos: [w / 2, 0, 1.2], width: 0.9, height: 2.1 },
    { kind: 'ceiling-light', pos: [0, h, 0] },
    ...extraFurniture,
  ],
  slots: [
    { id: 'sw-entree', type: 'wall-switch', label: "Mur d'entrée, près de la porte", wall: 'right', pos: [w / 2, 1.15, 0.55] },
    { id: 'sw-fenetre', type: 'wall-switch', label: 'Mur de la fenêtre', wall: 'left', pos: [-w / 2, 1.15, 1.2] },
    { id: 'sw-tv', type: 'wall-switch', label: 'Mur de la télévision', wall: 'back', pos: [w / 2 - 0.9, 1.15, -d / 2] },
    { id: 'clim-droite', type: 'ac', label: 'Mur de droite, en hauteur', wall: 'right', pos: [w / 2, h - 0.45, -0.9] },
    { id: 'tv-mur', type: 'tv', label: 'Mur du fond, au-dessus du meuble', wall: 'back', pos: [0, 1.35, -d / 2] },
    { id: 'meuble-tv', type: 'surface', label: 'Sur le meuble TV', pos: [0.95, 0.5, -d / 2 + 0.25] },
    { id: 'table-appoint', type: 'surface', label: "Sur la table d'appoint", pos: [-w / 2 + 0.45, 0.56, 1.0] },
    { id: 'fenetre-gauche', type: 'window', label: 'Fenêtre du salon', wall: 'left', pos: [-w / 2, 1.45, -0.3], width: 1.6, height: 1.3 },
    { id: 'porte-entree', type: 'door', label: "Porte d'entrée", wall: 'right', pos: [w / 2, 1.0, 1.2] },
    { id: 'cam-angle-fond', type: 'camera', label: 'Angle du fond, au plafond', pos: [-w / 2 + 0.18, h - 0.18, -d / 2 + 0.18], look: [1, -0.6, 1] },
    { id: 'cam-entree', type: 'camera', label: "Au-dessus de la porte d'entrée", pos: [w / 2 - 0.18, h - 0.2, 1.2], look: [-1, -0.6, -0.3] },
    { id: 'capteur-angle', type: 'sensor', label: 'Angle droit, au plafond', pos: [w / 2 - 0.15, h - 0.15, -d / 2 + 0.15], look: [-1, -0.7, 1] },
    { id: 'capteur-fenetre', type: 'sensor', label: 'Cadre de la fenêtre', wall: 'left', pos: [-w / 2, 2.2, -0.3] },
    { id: 'alarme-entree', type: 'wall-panel', label: "Près de la porte d'entrée", wall: 'right', pos: [w / 2, 1.5, 0.2] },
    { id: 'sol', type: 'floor', label: 'Au sol, près du canapé', pos: [1.2, 0, 1.3] },
    { id: 'portail-entree', type: 'gate', label: "À l'entrée de la parcelle, devant la porte", pos: [w / 2 + 2.4, 0, 1.2], wall: 'right' },
    ...extraSlots,
  ],
});

export const ENVIRONMENTS = [
  {
    id: 'salon', name: 'Salon', blurb: 'Le salon type des packs NÉO-CONNECT : canapé, télévision, fenêtre et porte d’entrée.',
    packsAvailable: true,
    ...salonBase(4.6, 2.8, 4.2),
  },
  {
    id: 'grand-salon', name: 'Grand salon', blurb: 'Un salon plus spacieux avec deux fenêtres, pour les installations plus complètes.',
    packsAvailable: true,
    ...salonBase(6.2, 2.9, 4.8,
      [
        { id: 'fenetre-fond', type: 'window', label: 'Deuxième fenêtre (mur du fond)', wall: 'back', pos: [-1.9, 1.45, -2.4], width: 1.4, height: 1.3 },
        { id: 'sw-fond', type: 'wall-switch', label: 'Mur du fond, côté fenêtre', wall: 'back', pos: [-0.8, 1.15, -2.4] },
        { id: 'etagere', type: 'surface', label: "Sur l'étagère murale", pos: [2.7, 1.5, -1.4] },
        { id: 'clim-gauche', type: 'ac', label: 'Mur de gauche, en hauteur', wall: 'left', pos: [-3.1, 2.45, 1.4] },
      ],
      [
        { kind: 'window', wall: 'back', pos: [-1.9, 1.45, -2.4], width: 1.4, height: 1.3 },
        { kind: 'shelf', wall: 'right', pos: [2.7, 1.45, -1.4] },
        { kind: 'armchair', pos: [-1.9, 0, 0.2], rotY: Math.PI / 2 },
      ]),
  },
  {
    id: 'chambre', name: 'Chambre', blurb: 'Pour compléter la maison pièce par pièce : rideaux, capteurs, caméra ou climatiseur dans une chambre.',
    packsAvailable: false,
    size: { w: 4.0, h: 2.8, d: 3.8 },
    furniture: [
      { kind: 'bed', pos: [0, 0, -0.5] },
      { kind: 'nightstand', pos: [-1.15, 0, -1.35] },
      { kind: 'nightstand', pos: [1.15, 0, -1.35] },
      { kind: 'wardrobe', pos: [1.6, 0, 1.2], rotY: -Math.PI / 2 },
      { kind: 'rug', pos: [0, 0.005, 0.6] },
      { kind: 'window', wall: 'back', pos: [0, 1.5, -1.9], width: 1.4, height: 1.2 },
      { kind: 'door', wall: 'left', pos: [-2.0, 0, 1.1], width: 0.85, height: 2.1 },
      { kind: 'ceiling-light', pos: [0, 2.8, 0] },
    ],
    slots: [
      { id: 'sw-porte', type: 'wall-switch', label: 'Près de la porte', wall: 'left', pos: [-2.0, 1.15, 0.45] },
      { id: 'sw-chevet', type: 'wall-switch', label: 'Au-dessus du chevet', wall: 'back', pos: [-1.15, 1.0, -1.9] },
      { id: 'clim-chambre', type: 'ac', label: 'Mur de droite, en hauteur', wall: 'right', pos: [2.0, 2.35, -0.6] },
      { id: 'tv-chambre', type: 'tv', label: 'Mur face au lit', wall: 'front', pos: [0, 1.5, 1.9] },
      { id: 'chevet-gauche', type: 'surface', label: 'Sur le chevet gauche', pos: [-1.15, 0.56, -1.35] },
      { id: 'chevet-droit', type: 'surface', label: 'Sur le chevet droit', pos: [1.15, 0.56, -1.35] },
      { id: 'fenetre-chambre', type: 'window', label: 'Fenêtre de la chambre', wall: 'back', pos: [0, 1.5, -1.9], width: 1.4, height: 1.2 },
      { id: 'porte-chambre', type: 'door', label: 'Porte de la chambre', wall: 'left', pos: [-2.0, 1.0, 1.1] },
      { id: 'cam-chambre', type: 'camera', label: 'Angle au plafond', pos: [1.85, 2.62, 1.7], look: [-1, -0.6, -1] },
      { id: 'capteur-chambre', type: 'sensor', label: 'Angle au plafond', pos: [-1.85, 2.65, 1.65], look: [1, -0.7, -1] },
      { id: 'capteur-fenetre-ch', type: 'sensor', label: 'Cadre de la fenêtre', wall: 'back', pos: [0, 2.2, -1.9] },
      { id: 'alarme-chambre', type: 'wall-panel', label: 'Près de la porte', wall: 'left', pos: [-2.0, 1.5, 0.0] },
      { id: 'sol-chambre', type: 'floor', label: 'Au sol, au pied du lit', pos: [0.9, 0, 1.0] },
    ],
  },
];

export const environmentById = (id) => ENVIRONMENTS.find((e) => e.id === id);
export const slotsOfType = (env, type) => env.slots.filter((s) => s.type === type);

/** Rotation (Y) à appliquer pour qu'un objet plaqué sur un mur regarde l'intérieur. */
export function wallRotation(wall) {
  switch (wall) {
    case 'back': return 0;
    case 'front': return Math.PI;
    case 'left': return Math.PI / 2;
    case 'right': return -Math.PI / 2;
    default: return 0;
  }
}
