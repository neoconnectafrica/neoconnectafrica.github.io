/**
 * Catalogue NÉO-CONNECT.
 * Source : brief NÉO-CONNECT (packs, équipements à la carte, prix annoncés).
 * - price: montant en FCFA. null = non communiqué → affiché « Sur devis », exclu du total.
 * - priceKind: 'fixed' (prix annoncé) | 'from' (« Dès … », le devis final précise).
 * - visual: 'placeholder' tant que les photos / modèles réels ne sont pas intégrés.
 * - slotType: type d'emplacement dans la maquette (voir environments.js).
 */

export const CATEGORIES = [
  { id: 'pilotage', label: 'Pilotage du salon', blurb: 'Les équipements des packs Salon : lumière, climatisation, télévision et musique depuis le téléphone.' },
  { id: 'ouvertures', label: 'Rideaux & volets', blurb: 'Ouvrez et fermez vos rideaux ou volets à distance ou à heure fixe.' },
  { id: 'securite', label: 'Sécurité', blurb: 'Caméras, serrures, capteurs et alarme pour surveiller et protéger la maison.' },
  { id: 'entretien', label: 'Entretien', blurb: 'Aspirateur robot programmable depuis le téléphone.' },
];

export const PRODUCTS = [
  {
    id: 'interrupteur', category: 'pilotage', slotType: 'wall-switch',
    name: 'Interrupteur intelligent', short: 'Éclairage piloté depuis le téléphone',
    description: "Remplace un interrupteur classique. La lumière s'allume, s'éteint ou se programme depuis le téléphone, et reste utilisable à la main.",
    price: null, priceKind: null, inPacks: ['standard', 'premium'], visual: 'placeholder', maxInstances: 6,
    options: [
      { id: 'demo', label: 'Démonstration', kind: 'demo', values: [{ id: 'on', label: 'Lumière allumée' }, { id: 'off', label: 'Lumière éteinte' }], default: 'on' },
    ],
  },
  {
    id: 'clim', category: 'pilotage', slotType: 'ac',
    name: 'Climatiseur connecté', short: 'Température réglée avant d’arriver',
    description: "Le climatiseur se commande depuis le téléphone : on l'allume avant de rentrer et on l'éteint à distance si on l'a oublié.",
    price: null, priceKind: null, inPacks: ['standard', 'premium'], visual: 'placeholder', maxInstances: 2,
    options: [
      { id: 'demo', label: 'Démonstration', kind: 'demo', values: [{ id: 'on', label: 'En marche' }, { id: 'off', label: 'Arrêté' }], default: 'on' },
    ],
  },
  {
    id: 'tv', category: 'pilotage', slotType: 'tv',
    name: 'Télévision connectée', short: 'Chaînes, applications et volume au téléphone',
    description: 'La télévision du salon devient pilotable depuis le téléphone : allumage, volume, applications et contenus.',
    price: null, priceKind: null, inPacks: ['standard', 'premium'], visual: 'placeholder', maxInstances: 1,
    options: [
      { id: 'demo', label: 'Démonstration', kind: 'demo', values: [{ id: 'on', label: 'Allumée' }, { id: 'off', label: 'Éteinte' }], default: 'on' },
    ],
  },
  {
    id: 'musique', category: 'pilotage', slotType: 'surface',
    name: 'Système de musique', short: 'Enceinte Amazon Echo avec l’assistant vocal Alexa',
    description: "Une enceinte Amazon Echo : la musique, mais aussi la voix de la maison. Vous parlez à Alexa pour allumer la lumière, fermer les rideaux, régler la climatisation ou lancer un film, sans sortir le téléphone.",
    highlights: [
      'Pilotage à la voix de tous les équipements NÉO-CONNECT installés',
      'Musique, radio, minuteurs, météo et questions du quotidien',
      'Routines : plusieurs actions en une phrase, à une heure ou sur un événement',
      'Pilotage aussi depuis l’application Alexa, chez vous ou à distance',
    ],
    voice: ['Alexa, allume la lumière du salon', 'Alexa, ferme les rideaux', 'Alexa, mets la clim à 24 degrés', 'Alexa, lance la télé'],
    image: { src: 'assets/img/amazon/alexa-maison.jpg', alt: 'Écran Echo Show affichant la maison connectée', credit: 'Visuel Amazon, utilisé avec autorisation' },
    price: null, priceKind: null, inPacks: ['standard', 'premium'], visual: 'placeholder', maxInstances: 3,
    options: [],
  },
  {
    id: 'rideau', category: 'ouvertures', slotType: 'window',
    name: 'Rideau / volet intelligent', short: 'Ouverture et fermeture à distance',
    description: 'Un moteur discret ouvre et ferme le rideau ou le volet depuis le téléphone, ou automatiquement le matin et le soir.',
    price: 60000, priceKind: 'fixed', inPacks: ['premium'], visual: 'placeholder', maxInstances: 4,
    options: [
      { id: 'type', label: 'Type', kind: 'variant', values: [{ id: 'rideau', label: 'Rideau' }, { id: 'volet', label: 'Volet' }], default: 'rideau' },
      { id: 'demo', label: 'Démonstration', kind: 'demo', values: [{ id: 'open', label: 'Ouvert' }, { id: 'closed', label: 'Fermé' }], default: 'closed' },
    ],
  },
  {
    id: 'camera', category: 'securite', slotType: 'camera',
    name: 'Caméra', short: 'Voir la maison depuis le téléphone',
    description: 'Une caméra consultable à tout moment depuis le téléphone, avec alerte en cas de mouvement.',
    price: 60000, priceKind: 'from', inPacks: [], visual: 'placeholder', maxInstances: 4,
    options: [
      { id: 'type', label: 'Modèle', kind: 'variant', values: [{ id: 'interieure', label: 'Intérieure', price: 60000 }, { id: 'exterieure', label: 'Extérieure', price: 120000 }], default: 'interieure' },
    ],
  },
  {
    id: 'serrure', category: 'securite', slotType: 'door',
    name: 'Serrure intelligente', short: 'Ouvrir sans clé, suivre les entrées',
    description: 'La porte se verrouille et se déverrouille depuis le téléphone ou par code, et vous savez qui est entré.',
    price: 60000, priceKind: 'from', inPacks: [], visual: 'placeholder', maxInstances: 1,
    options: [
      { id: 'type', label: 'Modèle', kind: 'variant', values: [{ id: 'interieure', label: 'Intérieure', price: 60000 }, { id: 'interieure-premium', label: 'Intérieure premium', price: 120000 }, { id: 'exterieure', label: 'Extérieure', price: 150000 }], default: 'interieure' },
    ],
  },
  {
    id: 'capteur', category: 'securite', slotType: 'sensor',
    name: 'Capteur', short: 'Présence ou ouverture détectées',
    description: "Un capteur signale une présence ou l'ouverture d'une porte ou d'une fenêtre, et peut déclencher une lumière ou une alerte.",
    price: 15000, priceKind: 'from', inPacks: [], visual: 'placeholder', maxInstances: 6,
    options: [
      { id: 'type', label: 'Modèle', kind: 'variant', values: [
        { id: 'ouverture', label: 'Porte et fenêtre', price: 15000 },
        { id: 'ouverture-alarme', label: 'Porte et fenêtre avec alarme', price: 25000 },
        { id: 'presence', label: 'Présence', price: 20000 },
        { id: 'presence-premium', label: 'Présence premium', price: 30000 },
      ], default: 'ouverture' },
    ],
  },
  {
    id: 'alarme', category: 'securite', slotType: 'wall-panel',
    name: 'Alarme', short: 'Protection de la maison avec alerte sur le téléphone',
    description: "Une alarme armée ou désarmée depuis le téléphone, qui prévient immédiatement en cas d'intrusion.",
    price: 149900, priceKind: 'fixed', inPacks: [], visual: 'placeholder', maxInstances: 1,
    options: [],
  },
  {
    id: 'aspirateur', category: 'entretien', slotType: 'floor',
    name: 'Aspirateur robot', short: 'Le sol nettoyé pendant votre absence',
    description: 'Un aspirateur robot qui nettoie seul, à heure programmée, et se commande depuis le téléphone.',
    price: 149900, priceKind: 'from', inPacks: [], visual: 'placeholder', maxInstances: 1,
    options: [
      { id: 'type', label: 'Modèle', kind: 'variant', values: [{ id: 'simple', label: 'Simple', price: 149900 }, { id: 'premium', label: 'Premium', price: 299900 }], default: 'simple' },
    ],
  },
];

/** Prix d'un exemplaire selon ses options (variantes tarifées), ou le prix de base. */
export function priceFor(product, options = {}) {
  for (const opt of product.options || []) {
    const v = opt.values.find((x) => x.id === options[opt.id]);
    if (v && typeof v.price === 'number') return { price: v.price, priceKind: 'fixed' };
  }
  return { price: product.price, priceKind: product.priceKind };
}

export const PACKS = [
  {
    id: 'standard', name: 'Pack Salon Standard', price: 160000, tone: 'standard',
    pitch: 'Votre première configuration de maison connectée : simple, accessible et complète pour le salon.',
    includes: ['Interrupteur intelligent', 'Climatiseur connecté', 'Télévision connectée', 'Système de musique'],
    components: ['interrupteur', 'clim', 'tv', 'musique'],
    extras: [],
  },
  {
    id: 'premium', name: 'Pack Salon Premium', price: 250000, tone: 'premium',
    pitch: 'Le salon connecté complet : les équipements du Standard, plus les rideaux, la sécurité et une installation personnalisée.',
    includes: ['Interrupteur intelligent', 'Climatiseur connecté', 'Télévision connectée', 'Système de musique', 'Rideau ou volet intelligent', 'Solutions de sécurité', "Personnalisation de l'installation"],
    components: ['interrupteur', 'clim', 'tv', 'musique', 'rideau'],
    extras: ['Les solutions de sécurité incluses sont définies avec votre conseiller selon votre logement.'],
  },
];

export const productById = (id) => PRODUCTS.find((p) => p.id === id);
export const packById = (id) => PACKS.find((p) => p.id === id);
export const productsForSlotType = (slotType) => PRODUCTS.filter((p) => p.slotType === slotType);
export function defaultOptions(product) {
  const o = {};
  for (const opt of product.options) o[opt.id] = opt.default;
  return o;
}
