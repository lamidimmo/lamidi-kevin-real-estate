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
      'meta.title': 'Kevin Lamidi · Immobilier de prestige',
      'nav.home': 'Accueil',
      'nav.biens': 'Mes biens',
      'nav.estim': 'Estimateur foncier',
      'nav.gain': 'Gain immobilier',
      'nav.contact': 'Me contacter',
      'brand.tag': 'Immobilier de prestige',
      'hub.kicker': 'Immobilier d’exception · Suisse romande',
      'hub.title': 'L’immobilier d’exception,<br>avec <em>exigence</em> et discrétion.',
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
      'soon.gain.desc': 'Le calculateur d’impôt sur le gain immobilier arrive prochainement dans cet espace.'
    },
    en: {
      'meta.title': 'Kevin Lamidi · Fine Real Estate',
      'nav.home': 'Home',
      'nav.biens': 'My properties',
      'nav.estim': 'Land estimator',
      'nav.gain': 'Capital gains',
      'nav.contact': 'Contact me',
      'brand.tag': 'Fine real estate',
      'hub.kicker': 'Fine real estate · Western Switzerland',
      'hub.title': 'Exceptional real estate,<br>with <em>discretion</em> and care.',
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
      'soon.gain.desc': 'The real-estate capital gains tax calculator is coming soon to this space.'
    },
    de: {
      'meta.title': 'Kevin Lamidi · Exklusive Immobilien',
      'nav.home': 'Startseite',
      'nav.biens': 'Meine Objekte',
      'nav.estim': 'Land-Schätzer',
      'nav.gain': 'Grundstückgewinn',
      'nav.contact': 'Kontakt',
      'brand.tag': 'Exklusive Immobilien',
      'hub.kicker': 'Exklusive Immobilien · Westschweiz',
      'hub.title': 'Aussergewöhnliche Immobilien,<br>mit <em>Anspruch</em> und Diskretion.',
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
      'soon.gain.desc': 'Der Rechner für die Grundstückgewinnsteuer folgt in Kürze in diesem Bereich.'
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
  }

  function setup() {
    document.querySelectorAll('.lang-switch button').forEach(function (b) {
      b.addEventListener('click', function () { apply(b.getAttribute('data-lang')); });
    });
    apply(getLang());
  }

  // Expose minimal API (utile pour pages outils qui se traduisent aussi)
  window.I18N = { apply: apply, getLang: getLang, dict: DICT };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else { setup(); }
})();
