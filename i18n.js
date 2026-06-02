/* =============================================================================
   i18n.js — Trilingue FR / EN / DE pour le portail.
   Usage : <element data-i18n="hub.title"></element> (texte)
           <element data-i18n="hub.title" data-i18n-html></element> (HTML autorisé)
           <meta data-i18n="meta.title" data-i18n-attr="content">
   La langue est mémorisée (localStorage) et applique <html lang="..">.
   ============================================================================= */
(function () {
  'use strict';

  var DICT = {
    fr: {
      'meta.title': 'Kevin Lamidi · Immobilier sur mesure',
      'nav.home': 'Accueil',
      'nav.biens': 'Mes biens',
      'nav.estim': 'Estimateur foncier',
      'nav.gain': 'Gain immobilier',
      'nav.contact': 'Me contacter',
      'brand.tag': 'Immobilier sur mesure',
      'hub.kicker': 'Votre projet immobilier · Suisse romande',
      'hub.title': 'Votre projet immobilier,<br>en toute <em>confiance</em>.',
      'hub.sub': 'Bienvenue dans mon espace privé. Retrouvez ici mes biens à la vente et mes outils d’expertise, réservés à mes clients.',
      'u.biens.title': 'Mes biens',
      'u.biens.desc': 'Découvrez les propriétés que j’accompagne actuellement à la vente, mises à jour chaque jour.',
      'u.estim.title': 'Estimateur foncier',
      'u.estim.desc': 'Estimez en quelques secondes la valeur d’un terrain à bâtir, selon la méthode résiduelle.',
      'u.gain.title': 'Gain immobilier',
      'u.gain.desc': 'Anticipez l’impôt sur le gain immobilier lors de la vente de votre bien dans le canton.',
      'u.cta.enter': 'Entrer',
      'u.cta.estimate': 'Estimer',
      'u.cta.calc': 'Calculer',
      'u.soon': 'Bientôt',
      'foot.contactTitle': 'Votre interlocuteur',
      'foot.role': 'Courtier en immobilier',
      'foot.exploreTitle': 'Explorer',
      'foot.tag': 'Un accompagnement sur mesure, de l’estimation à la signature.',
      'foot.privacy': 'Espace privé, non référencé. Lien réservé à mes clients.',
      'back.hub': 'Retour à l’accueil',
      'soon.kicker': 'En préparation',
      'soon.biens.title': 'Mes biens',
      'soon.biens.desc': 'Cette vitrine affichera bientôt, automatiquement, les propriétés que j’accompagne à la vente. Mise à jour quotidienne.',
      'soon.gain.title': 'Gain immobilier',
      'soon.gain.desc': 'Le calculateur d’impôt sur le gain immobilier arrive prochainement dans cet espace.',
      'biens.kicker': 'Sélection privée',
      'biens.title': 'Mes biens à la vente',
      'biens.sub': 'Une sélection de propriétés que j’accompagne actuellement. Cliquez pour découvrir chaque bien.',
      'biens.forSale': 'À vendre',
      'biens.sold': 'Mes références',
      'biens.soldSub': 'Quelques biens récemment vendus.',
      'biens.empty': 'Aucun bien en ligne pour le moment. Revenez bientôt.',
      'biens.updated': 'Mise à jour',
      'b.rooms': 'pièces',
      'b.bed': 'chambres',
      'b.bath': 'salles d’eau',
      'b.living': 'habitable',
      'b.land': 'terrain',
      'b.onRequest': 'Prix sur demande',
      'b.sold': 'Vendu',
      'b.view': 'Découvrir',
      'b.ref': 'Réf.',
      'b.built': 'Construction',
      'b.renovated': 'Rénovation',
      'b.situation': 'Situation',
      'b.contactTitle': 'Ce bien vous intéresse ?',
      'b.contactSub': 'Contactez-moi pour une visite ou plus d’informations.',
      'b.close': 'Fermer',
      'type.house': 'Maison', 'type.apartment': 'Appartement', 'type.building': 'Immeuble', 'type.land': 'Terrain', 'type.chalet': 'Chalet'
    },
    en: {
      'meta.title': 'Kevin Lamidi · Real estate',
      'nav.home': 'Home',
      'nav.biens': 'My properties',
      'nav.estim': 'Land estimator',
      'nav.gain': 'Capital gains',
      'nav.contact': 'Contact me',
      'brand.tag': 'Tailored real estate',
      'hub.kicker': 'Your property project · Western Switzerland',
      'hub.title': 'Your property journey,<br>in full <em>confidence</em>.',
      'hub.sub': 'Welcome to my private space. Here you will find the properties I represent for sale and my expertise tools, reserved for my clients.',
      'u.biens.title': 'My properties',
      'u.biens.desc': 'Discover the properties I am currently representing for sale, updated every day.',
      'u.estim.title': 'Land estimator',
      'u.estim.desc': 'Estimate the value of a building plot in seconds, using the residual method.',
      'u.gain.title': 'Capital gains',
      'u.gain.desc': 'Anticipate the real-estate capital gains tax when selling your property in the canton.',
      'u.cta.enter': 'Enter',
      'u.cta.estimate': 'Estimate',
      'u.cta.calc': 'Calculate',
      'u.soon': 'Soon',
      'foot.contactTitle': 'Your contact',
      'foot.role': 'Real estate broker',
      'foot.exploreTitle': 'Explore',
      'foot.tag': 'Tailored guidance, from valuation to signature.',
      'foot.privacy': 'Private space, unlisted. Link reserved for my clients.',
      'back.hub': 'Back to home',
      'soon.kicker': 'Coming soon',
      'soon.biens.title': 'My properties',
      'soon.biens.desc': 'This showcase will soon automatically display the properties I represent for sale. Updated daily.',
      'soon.gain.title': 'Capital gains',
      'soon.gain.desc': 'The real-estate capital gains tax calculator is coming soon to this space.',
      'biens.kicker': 'Private selection',
      'biens.title': 'My properties for sale',
      'biens.sub': 'A selection of properties I currently represent. Click to explore each one.',
      'biens.forSale': 'For sale',
      'biens.sold': 'Track record',
      'biens.soldSub': 'A few recently sold properties.',
      'biens.empty': 'No property online at the moment. Please check back soon.',
      'biens.updated': 'Updated',
      'b.rooms': 'rooms',
      'b.bed': 'bedrooms',
      'b.bath': 'bathrooms',
      'b.living': 'living',
      'b.land': 'land',
      'b.onRequest': 'Price on request',
      'b.sold': 'Sold',
      'b.view': 'Discover',
      'b.ref': 'Ref.',
      'b.built': 'Built',
      'b.renovated': 'Renovated',
      'b.situation': 'Location',
      'b.contactTitle': 'Interested in this property?',
      'b.contactSub': 'Contact me for a viewing or more information.',
      'b.close': 'Close',
      'type.house': 'House', 'type.apartment': 'Apartment', 'type.building': 'Building', 'type.land': 'Land', 'type.chalet': 'Chalet'
    },
    de: {
      'meta.title': 'Kevin Lamidi · Immobilien',
      'nav.home': 'Startseite',
      'nav.biens': 'Meine Objekte',
      'nav.estim': 'Land-Schätzer',
      'nav.gain': 'Grundstückgewinn',
      'nav.contact': 'Kontakt',
      'brand.tag': 'Immobilien nach Mass',
      'hub.kicker': 'Ihr Immobilienprojekt · Westschweiz',
      'hub.title': 'Ihr Immobilienprojekt,<br>mit <em>Vertrauen</em>.',
      'hub.sub': 'Willkommen in meinem privaten Bereich. Hier finden Sie die von mir betreuten Verkaufsobjekte und meine Expertise-Werkzeuge, exklusiv für meine Kunden.',
      'u.biens.title': 'Meine Objekte',
      'u.biens.desc': 'Entdecken Sie die Liegenschaften, die ich derzeit zum Verkauf betreue – täglich aktualisiert.',
      'u.estim.title': 'Land-Schätzer',
      'u.estim.desc': 'Schätzen Sie in Sekunden den Wert eines Baulands nach der Residualmethode.',
      'u.gain.title': 'Grundstückgewinn',
      'u.gain.desc': 'Berechnen Sie die Grundstückgewinnsteuer beim Verkauf Ihrer Immobilie im Kanton im Voraus.',
      'u.cta.enter': 'Eintreten',
      'u.cta.estimate': 'Schätzen',
      'u.cta.calc': 'Berechnen',
      'u.soon': 'Bald',
      'foot.contactTitle': 'Ihr Ansprechpartner',
      'foot.role': 'Immobilienmakler',
      'foot.exploreTitle': 'Entdecken',
      'foot.tag': 'Massgeschneiderte Begleitung, von der Schätzung bis zur Unterschrift.',
      'foot.privacy': 'Privater Bereich, nicht gelistet. Link exklusiv für meine Kunden.',
      'back.hub': 'Zurück zur Startseite',
      'soon.kicker': 'In Vorbereitung',
      'soon.biens.title': 'Meine Objekte',
      'soon.biens.desc': 'Diese Vitrine zeigt bald automatisch die von mir betreuten Verkaufsobjekte. Täglich aktualisiert.',
      'soon.gain.title': 'Grundstückgewinn',
      'soon.gain.desc': 'Der Rechner für die Grundstückgewinnsteuer folgt in Kürze in diesem Bereich.',
      'biens.kicker': 'Private Auswahl',
      'biens.title': 'Meine Verkaufsobjekte',
      'biens.sub': 'Eine Auswahl der von mir betreuten Liegenschaften. Klicken Sie, um jedes Objekt zu entdecken.',
      'biens.forSale': 'Zu verkaufen',
      'biens.sold': 'Referenzen',
      'biens.soldSub': 'Einige kürzlich verkaufte Objekte.',
      'biens.empty': 'Derzeit keine Objekte online. Schauen Sie bald wieder vorbei.',
      'biens.updated': 'Aktualisiert',
      'b.rooms': 'Zimmer',
      'b.bed': 'Schlafzimmer',
      'b.bath': 'Badezimmer',
      'b.living': 'Wohnfläche',
      'b.land': 'Grundstück',
      'b.onRequest': 'Preis auf Anfrage',
      'b.sold': 'Verkauft',
      'b.view': 'Entdecken',
      'b.ref': 'Ref.',
      'b.built': 'Baujahr',
      'b.renovated': 'Renoviert',
      'b.situation': 'Lage',
      'b.contactTitle': 'Interesse an diesem Objekt?',
      'b.contactSub': 'Kontaktieren Sie mich für eine Besichtigung oder weitere Informationen.',
      'b.close': 'Schliessen',
      'type.house': 'Haus', 'type.apartment': 'Wohnung', 'type.building': 'Gebäude', 'type.land': 'Grundstück', 'type.chalet': 'Chalet'
    }
  };

  var STORE_KEY = 'lamidi_lang';
  var SUPPORTED = ['fr', 'en', 'de'];

  function getLang() {
    var saved;
    try { saved = localStorage.getItem(STORE_KEY); } catch (e) { /* ignore */ }
    if (saved && SUPPORTED.indexOf(saved) !== -1) return saved;
    var nav = (navigator.language || 'fr').slice(0, 2).toLowerCase();
    return SUPPORTED.indexOf(nav) !== -1 ? nav : 'fr';
  }

  function apply(lang) {
    var table = DICT[lang] || DICT.fr;
    document.documentElement.setAttribute('lang', lang);
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      var val = table[key];
      if (val == null) return;
      var attr = el.getAttribute('data-i18n-attr');
      if (attr) { el.setAttribute(attr, val); }
      else if (el.hasAttribute('data-i18n-html')) { el.innerHTML = val; }
      else { el.textContent = val; }
    });
    document.querySelectorAll('.lang-switch button').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-lang') === lang));
    });
    try { localStorage.setItem(STORE_KEY, lang); } catch (e) { /* ignore */ }
    window.dispatchEvent(new CustomEvent('i18n:change', { detail: { lang: lang } }));
  }

  function t(key) {
    var lang = document.documentElement.getAttribute('lang') || 'fr';
    return (DICT[lang] && DICT[lang][key]) || (DICT.fr && DICT.fr[key]) || key;
  }

  function setup() {
    document.querySelectorAll('.lang-switch button').forEach(function (b) {
      b.addEventListener('click', function () { apply(b.getAttribute('data-lang')); });
    });
    apply(getLang());
  }

  // Expose minimal API (utile pour pages outils qui se traduisent aussi)
  window.I18N = { apply: apply, getLang: getLang, t: t, dict: DICT };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else { setup(); }
})();
