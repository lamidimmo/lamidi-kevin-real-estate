/* =============================================================================
   data.js — Données de référence métier (méthode résiduelle USPI)
   Valeurs par défaut, base de communes, tableau de dégressivité.
   Aucune dépendance. Expose window.USPI_DATA.

   IMPORTANT : le prix de référence est exprimé en CHF par m² de SBP
   (surface brute de plancher), et la dégressivité s'applique à la SBP du
   programme par unité. Recette = SBP x prix au m² SBP (dégressivité incluse).
   ============================================================================= */
(function (global) {
  'use strict';

  /* ---------------------------------------------------------------------------
     Tableau de dégressivité du prix de vente selon la SBP du programme PAR UNITÉ.
     Pourcentage du prix de référence commune (CHF/m² SBP).
     Variable critique du modèle, entièrement modifiable par dossier.
     --------------------------------------------------------------------------- */
  var DEGRESSIVITE = [
    { min: 0,   max: 120, pct: 1.05,  label: 'moins de 120 m² SBP' },
    { min: 120, max: 180, pct: 1.035, label: '120 à 180 m² (mitoyenne, petite villa)' },
    { min: 180, max: 220, pct: 0.96,  label: '180 à 220 m² (villa familiale)' },
    { min: 220, max: 260, pct: 0.90,  label: '220 à 260 m² (villa généreuse)' },
    { min: 260, max: 300, pct: 0.85,  label: '260 à 300 m² (villa maximum)' },
    { min: 300, max: Infinity, pct: 0.75, label: '300 m² et plus' }
  ];

  /* ---------------------------------------------------------------------------
     Hypothèses par défaut (modifiables au cas par cas).
     --------------------------------------------------------------------------- */
  var DEFAUTS = {
    // Marché
    prixReference: 7250,        // CHF / m² de SBP, neuf clé en main, base commune
    standing: 'standard',       // standard | soigne | premium
    coutM3: 1000,               // CHF / m³ SIA 116 (honoraires inclus)
    ratioVolumeSBP: 4.0,        // m³ de volume bâti par m² de SBP (référence USPI)
    ratioHabitableSBP: 0.85,    // part de surface habitable dans la SBP (affichage / vue acquéreur)

    // Coûts de construction (CFC)
    cfc1: 27500,                // CHF, travaux préparatoires (25'000 à 30'000)
    cfc4M2: 120,                // CHF / m² de surface non bâtie (aménagements ext.)
    cfc5Pct: 0.07,              // 7 % du sous-total CFC 1+2+4 (frais secondaires)

    // Frais
    fraisCommercialisationPct: 0.03, // 3 % de la valeur de vente
    fraisAcquisitionPct: 0.05,       // 5 % du prix du terrain (vue acquéreur uniquement)
    fraisPPE: 8000,                  // forfait constitution PPE (scénarios multi-unités)
    abattementServitudes: 0.00,      // 0 à 0.20 selon contraintes

    // Paramètre de calibrage de l'emprise au sol
    nbNiveaux: 2                // niveaux habitables (emprise = SBP / nbNiveaux)
  };

  // Coût de construction au m³ selon le standing visé.
  var COUT_M3_STANDING = {
    standard: 950,
    soigne: 1050,
    premium: 1150
  };

  /* ---------------------------------------------------------------------------
     Trois niveaux de valorisation, pensés côté propriétaire et alignés sur la
     logique d'un promoteur. Présentés au client comme une fourchette simple
     (plancher, valeur réaliste, potentiel).
     pctSBP      : part de la SBP autorisée exploitée.
     margeDefaut : marge appliquée à la recette (surchargeable par dossier).
     --------------------------------------------------------------------------- */
  // Les trois niveaux exploitent le terrain au MAXIMUM (même programme, densité
  // pleine). L'écart de valeur vient uniquement de la marge attendue par
  // l'acquéreur, ce qui resserre et crédibilise la fourchette.
  var SCENARIOS = [
    { key: 'P', nom: 'Valorisation prudente', niveau: 'Plancher',  pctSBP: 1.00, programme: 'mitoyennes', nbUnites: 2, margeDefaut: 0.18, ppe: true, profil: 'Exploitation maximale du terrain, vue d\'un promoteur exigeant sur sa marge. Minimum défendable.' },
    { key: 'R', nom: 'Valeur de marché',      niveau: 'Réaliste',  pctSBP: 1.00, programme: 'mitoyennes', nbUnites: 2, margeDefaut: 0.13, ppe: true, profil: 'Exploitation maximale, marge promoteur usuelle. Valeur la plus probable.' },
    { key: 'O', nom: 'Potentiel optimal',     niveau: 'Potentiel', pctSBP: 1.00, programme: 'mitoyennes', nbUnites: 2, margeDefaut: 0.08, ppe: true, profil: 'Exploitation maximale, marge resserrée (acquéreur motivé, rareté du foncier). Haut de fourchette crédible.' }
  ];

  /* ---------------------------------------------------------------------------
     Base de communes : vide par défaut, identique pour tous les dossiers.
     Aucune donnée de marché préchargée et aucune commune particulière. Les
     références d'un dossier sont apportées par le client ou la recherche au cas
     par cas. L'utilisateur peut, s'il le souhaite, mémoriser ses propres communes
     via l'onglet Communes (conservées sur son poste). Outil dédié au canton de
     Vaud pour le moment.
     --------------------------------------------------------------------------- */
  var COMMUNES = {};

  var AFFECTATIONS = [
    'Zone village',
    'Zone de faible densité',
    'Zone à occuper par plan spécial',
    'Zone mixte',
    'Zone de moyenne densité',
    'Zone d\'habitation collective'
  ];

  var NORMES_SURFACE = [
    'Norme ORL 514 420',
    'Norme SIA 421',
    'Personnalisé'
  ];

  var GLOSSAIRE = {
    sbp: 'SBP, surface brute de plancher : somme des surfaces de plancher de tous les niveaux habitables, mesurée hors œuvre.',
    ius: 'IUS, indice d\'utilisation du sol : coefficient appliqué à la surface déterminante pour obtenir la SBP autorisée.',
    volumeSIA: 'Volume SIA 116 : volume bâti avec suppléments de complexité (norme historique 1952), base des coûts de construction.',
    cfc: 'CFC, Code des Frais de la Construction : nomenclature comptable suisse standardisée.',
    residuelle: 'Méthode résiduelle : valorisation du terrain comme résidu du compte à rebours promoteur.',
    degressivite: 'Plus le programme est grand, plus son prix au m² de SBP baisse. Le tableau applique ce principe au prix de référence de la commune.'
  };

  global.USPI_DATA = {
    DEGRESSIVITE: DEGRESSIVITE,
    DEFAUTS: DEFAUTS,
    COUT_M3_STANDING: COUT_M3_STANDING,
    SCENARIOS: SCENARIOS,
    COMMUNES: COMMUNES,
    AFFECTATIONS: AFFECTATIONS,
    NORMES_SURFACE: NORMES_SURFACE,
    GLOSSAIRE: GLOSSAIRE
  };

})(typeof window !== 'undefined' ? window : this);
