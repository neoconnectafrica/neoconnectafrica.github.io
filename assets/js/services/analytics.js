/**
 * Mesure d'audience et des conversions (Pixel Meta + Google Analytics 4).
 *
 * Rien n'est chargé tant que les identifiants de SITE.analytics (config.js) sont vides :
 * le site reste léger et n'envoie aucune donnée. Pour activer, renseigner
 *   metaPixelId : identifiant du Pixel (Gestionnaire d'événements Meta)
 *   ga4Id       : identifiant de mesure GA4, de la forme « G-XXXXXXXXXX »
 *
 * Événements envoyés :
 *   Contact            clic vers WhatsApp (bulle, liens conseillers, pied de page…)
 *   Lead               demande envoyée (formulaire de contact ou configurateur)
 *   ViewContent        ouverture du configurateur 3D
 *   CustomizeProduct   premier équipement ajouté dans le configurateur
 * Les scripts ne se chargent qu'après le premier affichage de la page, pour ne pas la ralentir.
 */
import { SITE } from '../config.js';

const cfg = SITE.analytics || {};
const queue = [];
let ready = false;

function loadScript(src) {
  const s = document.createElement('script');
  s.async = true; s.src = src;
  document.head.append(s);
}

function boot() {
  if (ready) return;
  ready = true;
  if (cfg.metaPixelId) {
    /* eslint-disable */
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];}(window,document);
    /* eslint-enable */
    loadScript('https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', cfg.metaPixelId);
    window.fbq('track', 'PageView');
  }
  if (cfg.ga4Id) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', cfg.ga4Id);
    loadScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(cfg.ga4Id)}`);
  }
  while (queue.length) send(...queue.shift());
}

const GA_NAMES = { Contact: 'contact_whatsapp', Lead: 'generate_lead', ViewContent: 'view_configurator', CustomizeProduct: 'customize_product' };

function send(event, params = {}) {
  if (cfg.metaPixelId && window.fbq) window.fbq('track', event, params);
  if (cfg.ga4Id && window.gtag) window.gtag('event', GA_NAMES[event] || event, params);
}

/** Enregistre un événement (mis en file d'attente tant que les scripts ne sont pas prêts). */
export function track(event, params) {
  if (!cfg.metaPixelId && !cfg.ga4Id) return;
  if (ready) send(event, params); else queue.push([event, params]);
}

/** À appeler une fois par page (depuis initShared). */
export function initAnalytics() {
  if (!cfg.metaPixelId && !cfg.ga4Id) return;
  const start = () => setTimeout(boot, 1500);
  if (document.readyState === 'complete') start(); else window.addEventListener('load', start, { once: true });
  // Tout clic vers WhatsApp compte comme une prise de contact.
  document.addEventListener('click', (e) => {
    const a = e.target.closest?.('a[href*="wa.me"], a[href*="api.whatsapp.com"], a[data-wa]');
    if (a) track('Contact', { content_name: a.dataset.wa ? `Conseiller ${a.dataset.wa}` : 'WhatsApp' });
  }, { capture: true });
}
