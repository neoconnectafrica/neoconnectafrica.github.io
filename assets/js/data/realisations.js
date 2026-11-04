/**
 * Réalisations : vidéos publiées par NÉO-CONNECT sur TikTok (@neoconnect_).
 * Chaque carte affiche l'aperçu local (assets/img/tiktok/<id>.avif, 720×720) et renvoie vers la vidéo sur TikTok.
 * Pour ajouter une vidéo : copier son identifiant (fin de l'URL), enregistrer son aperçu sous le même nom,
 * et ajouter une entrée ci-dessous. `views` est indicatif (relevé le 15/10/2026).
 */
export const TIKTOK_PROFILE = 'https://www.tiktok.com/@neoconnect_';
export const TIKTOK_STATS = { followers: '121,9 K', likes: '423 K', handle: '@neoconnect_' };

export const REALISATIONS = [
  { id: '7683096509834906900', title: 'Août en quelques installations qu’on nous a permis de filmer', tag: 'Installations', views: '358' },
  { id: '7618221720821927189', title: 'Un appartement meublé transformé en espace intelligent', tag: 'Appartement', views: '22,3 K' },
  { id: '7691011994136120628', title: 'Le bureau le plus connecté de Cotonou : voix, caméras, écrans', tag: 'Bureau · Cotonou', views: '964' },
  { id: '7692706235967098133', title: 'Un bureau où tout se contrôle à la voix, Alexa s’occupe du reste', tag: 'Bureau', views: '672' },
  { id: '7595304696894459192', title: 'Caméra intelligente : une image claire, une sécurité claire', tag: 'Sécurité', views: '13,6 K' },
  { id: '7681776832219204885', title: 'La serrure connectée : plus besoin de se lever pour ouvrir', tag: 'Serrure', views: '6,4 K' },
  { id: '7685051136209882388', title: 'Empreinte, code, carte ou téléphone : la porte devient intelligente', tag: 'Serrure', views: '1,9 K' },
  { id: '7696619250655530260', title: 'Votre climatiseur sous contrôle, où que vous soyez', tag: 'Climatisation', views: '619' },
  { id: '7686635455412063508', title: 'La télécommande Google TV fait bien plus que changer de chaîne', tag: 'Télévision', views: '1,2 K' },
  { id: '7693654427495894292', title: 'Ta maison peut enfin t’écouter', tag: 'Maison connectée', views: '11,3 K' },
];

export const videoUrl = (id) => `${TIKTOK_PROFILE}/video/${id}`;
