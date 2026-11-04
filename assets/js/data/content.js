/**
 * Démonstration scénarisée de la section « Voyez le résultat » (page d'accueil).
 * Les textes commerciaux de la page d'accueil sont dans index.html (référencement naturel).
 */
/** Commandes vocales de la démonstration : chaque phrase pilote la maquette. */
export const VOICE_COMMANDS = [
  { id: 'light-on', text: 'Alexa, allume la lumière du salon', actions: [{ product: 'interrupteur', option: 'demo', value: 'on' }] },
  { id: 'light-off', text: 'Alexa, éteins la lumière', actions: [{ product: 'interrupteur', option: 'demo', value: 'off' }] },
  { id: 'curtain-close', text: 'Alexa, ferme les rideaux', actions: [{ product: 'rideau', option: 'demo', value: 'closed' }] },
  { id: 'curtain-open', text: 'Alexa, ouvre les rideaux', actions: [{ product: 'rideau', option: 'demo', value: 'open' }] },
  { id: 'tv-on', text: 'Alexa, lance la télé', actions: [{ product: 'tv', option: 'demo', value: 'on' }] },
  { id: 'clim-on', text: 'Alexa, mets la clim à 24 degrés', actions: [{ product: 'clim', option: 'demo', value: 'on' }] },
];

export const DEMO_STEPS = [
  { id: 'light', title: 'La lumière répond au téléphone', text: 'Un interrupteur intelligent remplace l’existant. On allume, on éteint, on programme : depuis le canapé ou depuis la route.', actions: [{ product: 'interrupteur', option: 'demo', value: 'on' }, { product: 'rideau', option: 'demo', value: 'open' }, { product: 'tv', option: 'demo', value: 'off' }] },
  { id: 'curtain', title: 'Les rideaux se ferment seuls', text: 'Le rideau ou le volet intelligent se ferme à la tombée du jour, ou en un geste quand le soleil tape.', actions: [{ product: 'rideau', option: 'demo', value: 'closed' }, { product: 'interrupteur', option: 'demo', value: 'on' }, { product: 'tv', option: 'demo', value: 'off' }] },
  { id: 'tv', title: 'Le salon devient connecté', text: 'Télévision, climatisation et musique répondent à la même application. C’est le Pack Salon : à partir de 160 000 FCFA.', actions: [{ product: 'tv', option: 'demo', value: 'on' }, { product: 'clim', option: 'demo', value: 'on' }, { product: 'rideau', option: 'demo', value: 'closed' }] },
];
