/**
 * Paramètres du site NÉO-CONNECT.
 * Les valeurs proviennent du brief fourni par NÉO-CONNECT. Ce qui n'est pas
 * confirmé reste à null et le site adapte son comportement sans rien inventer.
 */
export const SITE = {
  brand: 'NÉO-CONNECT',
  // Raison sociale enregistrée au Bénin (mention légale).
  legalName: 'Zanboss Electronics',
  tagline: 'Ta maison, pilotée depuis ton téléphone.',
  // Zone d'intervention : toute l'Afrique. Les conseillers WhatsApp sont basés dans trois pays.
  coverage: 'Partout en Afrique',
  currency: 'FCFA',
  countries: [
    { code: 'BJ', name: 'Bénin', flag: '🇧🇯', whatsapp: '+229 91 02 12 93' },
    { code: 'TG', name: 'Togo', flag: '🇹🇬', whatsapp: '+228 98 97 27 46' },
    { code: 'CI', name: "Côte d'Ivoire", flag: '🇨🇮', whatsapp: '+225 05 96 30 52 00' },
  ],
  // Conseiller par défaut pour les demandes venant d'un autre pays d'Afrique (société enregistrée au Bénin).
  defaultCountry: 'BJ',
  // Adresse e-mail commerciale (source : ancien site neoconnectafrica.netlify.app).
  email: 'neoconnectafrica@gmail.com',
  social: {
    tiktok: 'https://www.tiktok.com/@neoconnect_',
    instagram: 'https://www.instagram.com/neo_connect229',
    facebook: 'https://www.facebook.com/share/1Jnnr9a3XA/?mibextid=wwXIfr',
  },
  // Endpoint HTTP de réception des demandes : application web Google Apps Script
  // (projet « NÉO-CONNECT – Devis » du compte neoconnectafrica@gmail.com, déployée le 15/10/2026).
  // Les demandes arrivent par e-mail ; voir integrations/README.md. Remettre à null pour désactiver.
  quoteEndpoint: 'https://script.google.com/macros/s/AKfycbyuT67WI4H20Py_R4rpRfdQY1yCBqbNXyyoKrOaO___0QnZFyX05a1MnmtU8Kg16-S9/exec',
  // Bandeau « visuels provisoires » affiché tant que les photos et modèles réels ne sont pas intégrés.
  showDraftBanner: false,
  // Mesure des conversions : renseigner ces identifiants pour activer le suivi (voir services/analytics.js).
  // Vides = aucun script de suivi chargé.
  analytics: {
    metaPixelId: '', // ex. '123456789012345' (Gestionnaire d'événements Meta)
    ga4Id: '',       // ex. 'G-XXXXXXXXXX' (Google Analytics 4)
  },
};

export function waLink(country, text) {
  const digits = country.whatsapp.replace(/[^\d]/g, '');
  const q = text ? `?text=${encodeURIComponent(text)}` : '';
  return `https://wa.me/${digits}${q}`;
}

export function formatPrice(n) {
  if (n == null) return 'Sur devis';
  return `${new Intl.NumberFormat('fr-FR').format(n).replace(/ | /g, ' ')} ${SITE.currency}`;
}
