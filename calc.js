/* =============================================================================
   calc.js — Moteur de calcul de la méthode résiduelle USPI
   Pur, sans effet de bord, sans dépendance au DOM. Expose window.USPI_CALC.

   Principe : le terrain vaut la différence entre la recette de vente du projet
   construit et l'ensemble des coûts de l'acquéreur, marge comprise.

       Terrain défendable = Recette vente
                          - (Coûts construction
                             + Frais commercialisation
                             + Marge acquéreur
                             + Frais constitution PPE éventuels)

   Le prix de vente est exprimé en CHF par m² de SBP, avec dégressivité selon la
   SBP du programme par unité :   Recette = SBP x (prix réf. x % dégressivité).

   Les frais d'acquisition du terrain n'entament PAS le terrain défendable : ils
   ne concernent que le coût de revient de l'acquéreur (vue acquéreur). Seul
   l'abattement servitudes réduit le terrain défendable.
   ============================================================================= */
(function (global) {
  'use strict';

  function num(v, def) {
    var n = typeof v === 'string' ? parseFloat(v.replace(/[^0-9.\-]/g, '')) : v;
    return (typeof n === 'number' && isFinite(n)) ? n : (def || 0);
  }

  /* Pourcentage de dégressivité applicable à une SBP de programme (par unité). */
  function pctDegressivite(sbpParUnite, table) {
    for (var i = 0; i < table.length; i++) {
      var b = table[i];
      if (sbpParUnite >= b.min && sbpParUnite < b.max) return b.pct;
    }
    return table.length ? table[table.length - 1].pct : 1;
  }

  /* ---------------------------------------------------------------------------
     Calcul d'un scénario unique.
     --------------------------------------------------------------------------- */
  function calculerScenario(scenario, p) {
    var sbpMax = p.surfaceDeterminante * p.ius;
    var sbp = sbpMax * scenario.pctSBP;

    var nbUnites = scenario.nbUnites || 1;
    var sbpParUnite = nbUnites > 0 ? sbp / nbUnites : sbp;

    var habitableTotal = sbp * p.ratioHabitableSBP;
    var habitableParUnite = nbUnites > 0 ? habitableTotal / nbUnites : habitableTotal;

    // Sans SBP constructible (surface ou IUS non renseignés), pas de projet :
    // aucun coût ni recette, terrain défendable nul (évite des résidus négatifs).
    var built = sbp > 0;

    var volume = sbp * p.ratioVolumeSBP;
    var emprise = p.nbNiveaux > 0 ? sbp / p.nbNiveaux : sbp;
    var surfaceNonBatie = built ? Math.max(0, p.surfaceCadastrale - emprise) : 0;

    // Prix de vente au m² SBP : dégressivité selon la SBP d'UNE unité.
    var pct = pctDegressivite(sbpParUnite, p.degressivite);
    var prixSBP = p.prixReference * pct;

    // Recette = SBP totale x prix au m² SBP.
    var recette = sbp * prixSBP;

    // Détail des CFC.
    var cfc1 = built ? p.cfc1 : 0;
    var cfc2 = volume * p.coutM3;
    var cfc4 = surfaceNonBatie * p.cfc4M2;
    var sousTotal124 = cfc1 + cfc2 + cfc4;
    var cfc5 = sousTotal124 * p.cfc5Pct;
    var coutConstruction = sousTotal124 + cfc5;

    var fraisCommercialisation = recette * p.fraisCommercialisationPct;

    // Marge : override par dossier sinon défaut du scénario.
    var tauxMarge = (p.marges && p.marges[scenario.key] != null)
      ? num(p.marges[scenario.key], scenario.margeDefaut)
      : scenario.margeDefaut;
    var marge = recette * tauxMarge;

    var fraisPPE = scenario.ppe ? p.fraisPPE : 0;

    // Résidu = terrain défendable (les frais d'acquisition n'entrent pas ici).
    var terrainBrut = recette - (coutConstruction + fraisCommercialisation + marge + fraisPPE);
    var terrainNet = terrainBrut * (1 - p.abattementServitudes);

    var terrainM2 = p.surfaceCadastrale > 0 ? terrainNet / p.surfaceCadastrale : 0;
    var multipleFiscal = p.estimationFiscale > 0 ? terrainNet / p.estimationFiscale : null;

    /* --- Vue acquéreur (compte à l'envers) --- */
    var coutAcquisitionTerrain = terrainNet * (1 + p.fraisAcquisitionPct);
    var coutTotalOperation = coutAcquisitionTerrain + coutConstruction + fraisPPE;
    var chfM2Habitable = habitableTotal > 0 ? coutTotalOperation / habitableTotal : 0;
    // Marché clé en main équivalent, ramené au m² habitable.
    var prixCleEnMain = p.ratioHabitableSBP > 0 ? prixSBP / p.ratioHabitableSBP : prixSBP;
    var economieM2 = prixCleEnMain - chfM2Habitable; // > 0 : moins cher que clé en main
    var economieTotale = economieM2 * habitableTotal;

    return {
      key: scenario.key,
      nom: scenario.nom,
      programme: scenario.programme,
      profil: scenario.profil,
      nbUnites: nbUnites,
      pctSBP: scenario.pctSBP,
      tauxMarge: tauxMarge,

      sbp: sbp,
      sbpParUnite: sbpParUnite,
      habitableTotal: habitableTotal,
      habitableParUnite: habitableParUnite,
      volume: volume,
      emprise: emprise,
      surfaceNonBatie: surfaceNonBatie,
      pctDegressivite: pct,
      prixSBP: prixSBP,
      recette: recette,

      cfc1: cfc1,
      cfc2: cfc2,
      cfc4: cfc4,
      cfc5: cfc5,
      coutConstruction: coutConstruction,
      fraisCommercialisation: fraisCommercialisation,
      marge: marge,
      fraisPPE: fraisPPE,

      terrainBrut: terrainBrut,
      terrainNet: terrainNet,
      terrainM2: terrainM2,
      multipleFiscal: multipleFiscal,

      acquereur: {
        coutAcquisitionTerrain: coutAcquisitionTerrain,
        coutTotalOperation: coutTotalOperation,
        chfM2Habitable: chfM2Habitable,
        prixCleEnMain: prixCleEnMain,
        economieM2: economieM2,
        economieTotale: economieTotale
      }
    };
  }

  /* ---------------------------------------------------------------------------
     Consolidation des entrées brutes en paramètres numériques exploitables.
     --------------------------------------------------------------------------- */
  function consolider(input) {
    var D = global.USPI_DATA.DEFAUTS;
    var pa = input.parcelle || {};
    var ma = input.marche || {};
    var co = input.couts || {};

    var surfaceCadastrale = num(pa.surfaceCadastrale, 0);
    var surfaceAcces = num(pa.surfaceAcces, 0);
    var surfaceDeterminante = num(pa.surfaceDeterminante,
      Math.max(0, surfaceCadastrale - surfaceAcces));

    return {
      surfaceCadastrale: surfaceCadastrale,
      surfaceAcces: surfaceAcces,
      surfaceDeterminante: surfaceDeterminante,
      ius: num(pa.ius, 0),
      estimationFiscale: num(pa.estimationFiscale, 0),

      prixReference: num(ma.prixReference, D.prixReference),
      coutM3: num(ma.coutM3, D.coutM3),
      ratioVolumeSBP: num(ma.ratioVolumeSBP, D.ratioVolumeSBP),
      ratioHabitableSBP: num(ma.ratioHabitableSBP, D.ratioHabitableSBP),
      degressivite: ma.degressivite || global.USPI_DATA.DEGRESSIVITE,

      cfc1: num(co.cfc1, D.cfc1),
      cfc4M2: num(co.cfc4M2, D.cfc4M2),
      cfc5Pct: num(co.cfc5Pct, D.cfc5Pct),
      marges: co.marges || null,
      fraisCommercialisationPct: num(co.fraisCommercialisationPct, D.fraisCommercialisationPct),
      fraisAcquisitionPct: num(co.fraisAcquisitionPct, D.fraisAcquisitionPct),
      fraisPPE: num(co.fraisPPE, D.fraisPPE),
      abattementServitudes: num(co.abattementServitudes, D.abattementServitudes),
      nbNiveaux: num(co.nbNiveaux, D.nbNiveaux)
    };
  }

  /* ---------------------------------------------------------------------------
     Calcul complet : les trois niveaux de valorisation + synthèse de fourchette.
     --------------------------------------------------------------------------- */
  function calculer(input) {
    var p = consolider(input);
    var defs = global.USPI_DATA.SCENARIOS;
    var scenarios = defs.map(function (s) { return calculerScenario(s, p); });

    var terrains = scenarios.map(function (s) { return s.terrainNet; });
    function stats(arr) {
      if (!arr.length) return { min: 0, max: 0, median: 0 };
      var sorted = arr.slice().sort(function (a, b) { return a - b; });
      var mid = Math.floor(sorted.length / 2);
      var median = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
      return { min: sorted[0], max: sorted[sorted.length - 1], median: median };
    }

    var st = stats(terrains);
    var synthese = {
      min: st.min,
      max: st.max,
      median: st.median,
      parM2Median: p.surfaceCadastrale > 0 ? st.median / p.surfaceCadastrale : 0,
      surfaceCadastrale: p.surfaceCadastrale,
      estimationFiscale: p.estimationFiscale,
      sbpMax: p.surfaceDeterminante * p.ius,
      byKey: {}
    };
    scenarios.forEach(function (s) { synthese.byKey[s.key] = s.terrainNet; });

    return { params: p, scenarios: scenarios, synthese: synthese };
  }

  global.USPI_CALC = {
    calculer: calculer,
    calculerScenario: calculerScenario,
    consolider: consolider,
    pctDegressivite: pctDegressivite
  };

})(typeof window !== 'undefined' ? window : this);
