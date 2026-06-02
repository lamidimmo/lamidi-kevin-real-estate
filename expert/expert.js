/* =============================================================================
   expert.js — Tableau de bord expert (autonome)
   Utilise window.USPI_DATA / window.USPI_CALC (data.js / calc.js) + Chart.js.
   ============================================================================= */
(function () {
  'use strict';
  var D = window.USPI_DATA, C = window.USPI_CALC;

  /* ---------- Helpers ---------- */
  function $(id) { return document.getElementById(id); }
  function num(v, d) { var n = parseFloat(v); return isFinite(n) ? n : (d || 0); }
  function val(id) { var e = $(id); return e ? e.value : ''; }
  function setVal(id, v) { var e = $(id); if (e) e.value = (v == null ? '' : v); }
  function fmt(n) { if (n == null || !isFinite(n)) return '—'; return Math.round(n).toLocaleString('de-CH').replace(/[’ ,.]/g, "'"); }
  function chf(n) { return fmt(n) + ' CHF'; }
  function m2(n) { return fmt(n) + ' m²'; }
  function pct(n, d) { return (n * 100).toFixed(d == null ? 1 : d).replace(/\.0$/, '') + ' %'; }
  function round10k(n) { return Math.round(n / 10000) * 10000; }
  function floor10k(n) { return Math.floor(n / 10000) * 10000; }
  function ceil10k(n) { return Math.ceil(n / 10000) * 10000; }
  function dateFr(d) {
    var m = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
    return d.getDate() + ' ' + m[d.getMonth()] + ' ' + d.getFullYear();
  }

  var FIELDS = ['commune','noParcelle','surfaceCadastrale','ius','prixReference','coutM3','estimationFiscale',
    'abattementServitudes','margeP','margeR','margeO','ratioVolumeSBP','ratioHabitableSBP','nbNiveaux',
    'cfc1','cfc4M2','cfc5Pct','fraisCommercialisationPct','fraisPPE','fraisAcquisitionPct'];

  var state = { res: null, sensVar: 'prix', acqKey: 'R', charts: {} };

  /* ---------- Défauts + exemple de démonstration ---------- */
  function applyDefaults() {
    var d = D.DEFAUTS;
    setVal('prixReference', d.prixReference);
    setVal('coutM3', d.coutM3);
    setVal('ratioVolumeSBP', d.ratioVolumeSBP);
    setVal('ratioHabitableSBP', d.ratioHabitableSBP);
    setVal('nbNiveaux', d.nbNiveaux);
    setVal('cfc1', d.cfc1);
    setVal('cfc4M2', d.cfc4M2);
    setVal('cfc5Pct', d.cfc5Pct);
    setVal('fraisCommercialisationPct', d.fraisCommercialisationPct);
    setVal('fraisPPE', d.fraisPPE);
    setVal('fraisAcquisitionPct', d.fraisAcquisitionPct);
    setVal('abattementServitudes', d.abattementServitudes);
    D.SCENARIOS.forEach(function (s) { setVal('marge' + s.key, s.margeDefaut); });
    // Exemple vivant
    setVal('surfaceCadastrale', 800);
    setVal('ius', 0.5);
  }

  /* ---------- Construction de l'objet d'entrée + calcul ---------- */
  function inputObject() {
    return {
      parcelle: {
        commune: val('commune'), noParcelle: val('noParcelle'),
        surfaceCadastrale: num(val('surfaceCadastrale')), surfaceAcces: 0,
        ius: num(val('ius')), estimationFiscale: num(val('estimationFiscale'))
      },
      marche: {
        prixReference: num(val('prixReference')), coutM3: num(val('coutM3')),
        ratioVolumeSBP: num(val('ratioVolumeSBP'), D.DEFAUTS.ratioVolumeSBP),
        ratioHabitableSBP: num(val('ratioHabitableSBP'), D.DEFAUTS.ratioHabitableSBP),
        degressivite: D.DEGRESSIVITE
      },
      couts: {
        cfc1: num(val('cfc1'), D.DEFAUTS.cfc1), cfc4M2: num(val('cfc4M2'), D.DEFAUTS.cfc4M2),
        cfc5Pct: num(val('cfc5Pct'), D.DEFAUTS.cfc5Pct),
        fraisCommercialisationPct: num(val('fraisCommercialisationPct'), D.DEFAUTS.fraisCommercialisationPct),
        marges: { P: num(val('margeP'), 0.18), R: num(val('margeR'), 0.13), O: num(val('margeO'), 0.08) },
        fraisAcquisitionPct: num(val('fraisAcquisitionPct'), D.DEFAUTS.fraisAcquisitionPct),
        fraisPPE: num(val('fraisPPE'), D.DEFAUTS.fraisPPE),
        abattementServitudes: num(val('abattementServitudes')),
        nbNiveaux: num(val('nbNiveaux'), D.DEFAUTS.nbNiveaux)
      }
    };
  }

  function computeWith(ov) {
    var inp = inputObject();
    if (ov) ['parcelle', 'marche', 'couts'].forEach(function (k) {
      if (!ov[k]) return;
      for (var p in ov[k]) {
        if (p === 'marges') inp.couts.marges = Object.assign({}, inp.couts.marges, ov[k][p]);
        else inp[k][p] = ov[k][p];
      }
    });
    return C.calculer(inp);
  }

  /* ---------- KPIs ---------- */
  function renderKPIs(res) {
    var s = res.synthese, box = $('kpis');
    var ok = s.sbpMax > 0;
    var vR = round10k(s.byKey.R || 0), vP = floor10k(s.byKey.P || 0), vO = ceil10k(s.byKey.O || 0);
    var parM2 = s.surfaceCadastrale > 0 ? (s.byKey.R || 0) / s.surfaceCadastrale : 0;
    function card(k, v, sub, feat) {
      return '<div class="kpi' + (feat ? ' feature' : '') + '"><div class="k">' + k + '</div><div class="v">' + v + '</div>' + (sub ? '<div class="s">' + sub + '</div>' : '') + '</div>';
    }
    if (!ok) { box.innerHTML = card('Estimation', '—', 'Renseignez surface et indice', true); return; }
    box.innerHTML =
      card('Valeur réaliste', chf(vR), fmt(parM2) + ' CHF/m² parcelle', true) +
      card('Plancher (prudent)', chf(vP), 'marge ' + pct(num(val('margeP')), 0)) +
      card('Potentiel', chf(vO), 'marge ' + pct(num(val('margeO')), 0)) +
      card('SBP constructible', m2(s.sbpMax), 'surface × indice') +
      card('Recette de vente', chf((res.scenarios.find(function (x) { return x.key === 'R'; }) || {}).recette), 'scénario réaliste');
  }

  /* ---------- Chart.js : thème ---------- */
  function setupChartTheme() {
    if (!window.Chart) return;
    Chart.defaults.color = '#9aa7bc';
    Chart.defaults.font.family = "'Jost','Helvetica Neue',Arial,sans-serif";
    Chart.defaults.font.size = 11;
  }
  var GRID = 'rgba(255,255,255,0.07)';
  function gold(a) { return 'rgba(200,160,90,' + a + ')'; }
  function blue(a) { return 'rgba(91,134,201,' + a + ')'; }

  /* ---------- Sensibilité ---------- */
  function sensSeries(varKey) {
    var base = inputObject(), labels = [], lineR = [], lineO = [], two = (varKey !== 'marge');
    var pts;
    if (varKey === 'marge') pts = [0.04, 0.06, 0.08, 0.10, 0.12, 0.14, 0.16, 0.18, 0.20];
    else pts = [0.7, 0.775, 0.85, 0.925, 1.0, 1.075, 1.15, 1.225, 1.3];
    pts.forEach(function (f) {
      var ov, label;
      if (varKey === 'prix') { var v = base.marche.prixReference * f; ov = { marche: { prixReference: v } }; label = fmt(v); }
      else if (varKey === 'cout') { var v2 = base.marche.coutM3 * f; ov = { marche: { coutM3: v2 } }; label = fmt(v2); }
      else { ov = { couts: { marges: { R: f } } }; label = Math.round(f * 100) + '%'; }
      var r = computeWith(ov).synthese.byKey;
      labels.push(label); lineR.push(Math.round(r.R || 0)); lineO.push(Math.round(r.O || 0));
    });
    return { labels: labels, lineR: lineR, lineO: lineO, two: two };
  }

  function buildSensChart() {
    var ctx = $('chartSens'); if (!ctx || !window.Chart) return;
    state.charts.sens = new Chart(ctx, {
      type: 'line',
      data: { labels: [], datasets: [
        { label: 'Réaliste', data: [], borderColor: gold(1), backgroundColor: gold(0.12), fill: true, tension: 0.35, borderWidth: 2.5, pointRadius: 3, pointBackgroundColor: gold(1) },
        { label: 'Potentiel', data: [], borderColor: blue(0.9), backgroundColor: 'transparent', borderDash: [5, 4], fill: false, tension: 0.35, borderWidth: 2, pointRadius: 0 }
      ] },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: { legend: { labels: { boxWidth: 14, usePointStyle: true } },
          tooltip: { callbacks: { label: function (c) { return c.dataset.label + ' : ' + fmt(c.parsed.y) + ' CHF'; } } } },
        scales: {
          x: { grid: { color: GRID }, ticks: { maxRotation: 0 } },
          y: { grid: { color: GRID }, ticks: { callback: function (v) { return fmt(v); } } }
        }
      }
    });
  }
  function updateSensChart() {
    var ch = state.charts.sens; if (!ch) return;
    var titles = { prix: 'prix de vente (CHF/m² SBP)', cout: 'coût de construction (CHF/m³)', marge: 'marge du promoteur' };
    var s = sensSeries(state.sensVar);
    ch.data.labels = s.labels;
    ch.data.datasets[0].data = s.lineR;
    ch.data.datasets[1].data = s.lineO;
    ch.data.datasets[1].hidden = !s.two;
    ch.options.scales.x.title = { display: true, text: titles[state.sensVar], color: '#6b7a92' };
    ch.update();
    $('sensNote').textContent = 'Valeur défendable du terrain en faisant varier le ' + titles[state.sensVar] +
      '. Lecture : un petit mouvement du prix de vente déplace fortement la valeur du terrain (effet de levier de la méthode résiduelle).';
  }

  /* ---------- Trois niveaux (barres) ---------- */
  function buildLevelsChart() {
    var ctx = $('chartLevels'); if (!ctx || !window.Chart) return;
    state.charts.levels = new Chart(ctx, {
      type: 'bar',
      data: { labels: ['Prudent', 'Réaliste', 'Potentiel'], datasets: [{ data: [0, 0, 0],
        backgroundColor: [blue(0.55), gold(0.95), gold(0.55)], borderRadius: 7, borderSkipped: false }] },
      options: {
        indexAxis: 'y', responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: function (c) { return fmt(c.parsed.x) + ' CHF'; } } } },
        scales: { x: { grid: { color: GRID }, ticks: { callback: function (v) { return fmt(v); } } }, y: { grid: { display: false } } }
      }
    });
  }
  function updateLevelsChart(res) {
    var ch = state.charts.levels; if (!ch) return;
    var b = res.synthese.byKey;
    ch.data.datasets[0].data = [Math.round(b.P || 0), Math.round(b.R || 0), Math.round(b.O || 0)];
    ch.update();
  }

  /* ---------- Décomposition (doughnut) ---------- */
  function buildDecompChart() {
    var ctx = $('chartDecomp'); if (!ctx || !window.Chart) return;
    state.charts.decomp = new Chart(ctx, {
      type: 'doughnut',
      data: { labels: ['Valeur terrain', 'Construction', 'Marge & frais'], datasets: [{ data: [1, 1, 1],
        backgroundColor: [gold(0.95), 'rgba(160,172,196,0.55)', blue(0.6)], borderColor: '#0f1b2e', borderWidth: 2 }] },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '62%',
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, padding: 12, usePointStyle: true } },
          tooltip: { callbacks: { label: function (c) { return c.label + ' : ' + chf(c.parsed); } } } }
      }
    });
  }
  function updateDecompChart(res) {
    var ch = state.charts.decomp; if (!ch) return;
    var R = res.scenarios.find(function (x) { return x.key === 'R'; }); if (!R) return;
    var rec = R.recette || 1, segT = Math.max(0, R.terrainNet), segC = Math.max(0, R.coutConstruction), segA = Math.max(0, rec - segT - segC);
    ch.data.datasets[0].data = [Math.round(segT), Math.round(segC), Math.round(segA)];
    ch.update();
    $('decompNote').textContent = 'Sur une recette de ' + chf(rec) + ', le terrain représente ' + pct(segT / rec, 0) +
      ', la construction ' + pct(segC / rec, 0) + ', la marge et les frais ' + pct(segA / rec, 0) + '.';
  }

  /* ---------- Détail par scénario ---------- */
  function renderDetail(res) {
    var t = $('detailTable'); if (!t) return;
    var sc = res.scenarios, h = '<thead><tr><th>Ligne</th>';
    sc.forEach(function (s) { h += '<th>' + s.nom + '</th>'; });
    h += '</tr></thead><tbody>';
    function sect(l) { h += '<tr class="section"><td colspan="' + (sc.length + 1) + '">' + l + '</td></tr>'; }
    function row(l, fn, cls) { h += '<tr' + (cls ? ' class="' + cls + '"' : '') + '><td>' + l + '</td>'; sc.forEach(function (s) { h += '<td>' + fn(s) + '</td>'; }); h += '</tr>'; }
    sect('Programme');
    row('Part de SBP', function (s) { return pct(s.pctSBP, 0); });
    row('Unités', function (s) { return s.nbUnites; });
    row('SBP exploitée', function (s) { return m2(s.sbp); });
    row('Surface habitable', function (s) { return m2(s.habitableTotal); });
    row('Volume SIA 116', function (s) { return fmt(s.volume) + ' m³'; });
    sect('Recette');
    row('Dégressivité', function (s) { return pct(s.pctDegressivite, 1); }, 'subtle');
    row('Prix (CHF/m² SBP)', function (s) { return fmt(s.prixSBP); });
    row('Recette de vente', function (s) { return chf(s.recette); }, 'total');
    sect('Coûts de construction (CFC)');
    row('CFC 1 préparatoires', function (s) { return chf(s.cfc1); });
    row('CFC 2 bâtiment', function (s) { return chf(s.cfc2); });
    row('CFC 4 aménagements', function (s) { return chf(s.cfc4); });
    row('CFC 5 secondaires', function (s) { return chf(s.cfc5); });
    row('Total construction', function (s) { return chf(s.coutConstruction); }, 'total');
    sect('Charges');
    row('Commercialisation', function (s) { return chf(s.fraisCommercialisation); });
    row('Marge', function (s) { return chf(s.marge) + ' (' + pct(s.tauxMarge, 0) + ')'; });
    row('Constitution PPE', function (s) { return s.fraisPPE ? chf(s.fraisPPE) : '—'; });
    sect('Terrain défendable');
    row('Terrain net', function (s) { return chf(s.terrainNet); }, 'total');
    row('CHF/m² de parcelle', function (s) { return fmt(s.terrainM2); });
    row('Multiple vs fiscale', function (s) { return s.multipleFiscal ? s.multipleFiscal.toFixed(2) + 'x' : '—'; });
    h += '</tbody>';
    t.innerHTML = h;
  }

  /* ---------- Vue acquéreur ---------- */
  function renderAcq(res) {
    var box = $('acqGrid'); if (!box) return;
    var s = res.scenarios.find(function (x) { return x.key === state.acqKey; }) || res.scenarios[0];
    var a = s.acquereur, eco = a.economieM2 >= 0;
    function cell(k, v, cls) { return '<div class="acq-cell"><div class="k">' + k + '</div><div class="v ' + (cls || '') + '">' + v + '</div></div>'; }
    box.innerHTML =
      cell('Coût total opération', chf(a.coutTotalOperation)) +
      cell('Prix de revient', fmt(a.chfM2Habitable) + ' CHF/m² hab') +
      cell('Marché clé en main', fmt(a.prixCleEnMain) + ' CHF/m² hab') +
      cell((eco ? 'Économie' : 'Surcoût') + ' vs marché', fmt(Math.abs(a.economieM2)) + ' CHF/m²', eco ? 'pos' : 'neg');
  }

  /* ---------- Avis PDF (impression) ---------- */
  function buildPdf(res) {
    var sheet = $('pdfSheet'); if (!sheet) return;
    var s = res.synthese, today = new Date();
    var commune = val('commune') || '[Commune]', noP = val('noParcelle') || '[N°]';
    var vP = floor10k(s.byKey.P || 0), vR = round10k(s.byKey.R || 0), vO = ceil10k(s.byKey.O || 0);
    sheet.innerHTML =
      '<div style="font-family:\'EB Garamond\',serif;color:#1a1a1a;padding:20mm;background:#fff;min-height:297mm">' +
      '<div style="background:#14213d;color:#fff;margin:-20mm -20mm 14mm;padding:8mm 20mm;display:flex;justify-content:space-between;font-family:Arial">' +
        '<span style="letter-spacing:.25em;font-size:11px">KEVIN LAMIDI</span>' +
        '<span style="font-size:9px;text-align:right">Réf. ' + noP + ' / ' + commune + '<br>' + dateFr(today) + '</span></div>' +
      '<h1 style="font-size:22pt;margin:0 0 2px">Parcelle ' + noP + ', ' + commune + '</h1>' +
      '<div style="font-style:italic;color:#666;margin-bottom:14px">Canton de Vaud</div>' +
      '<p style="font-size:11pt;line-height:1.5">Avis indicatif de valeur de marché fondé sur l\'observation du marché local et le potentiel constructible de la parcelle (méthode résiduelle).</p>' +
      '<div style="border-top:3px solid #1a1a1a;margin-top:10px;padding-top:10px">' +
        '<div style="font-family:Arial;font-size:8.5pt;letter-spacing:.1em;text-transform:uppercase;color:#666">Valeur de marché estimée</div>' +
        '<div style="font-size:24pt;margin:6px 0">' + fmt(vP) + ' à ' + fmt(vO) + ' CHF</div>' +
        '<div style="color:#666;font-size:10pt">Valeur réaliste ' + chf(vR) + ', soit environ ' + fmt(s.surfaceCadastrale > 0 ? vR / s.surfaceCadastrale : 0) + ' CHF/m² de parcelle</div>' +
      '</div>' +
      '<table style="width:100%;border-collapse:collapse;font-size:10.5pt;margin-top:16px">' +
        '<tr><td style="padding:3px 0;color:#666;font-family:Arial;font-size:8.5pt;text-transform:uppercase">Surface</td><td>' + (val('surfaceCadastrale') ? m2(val('surfaceCadastrale')) : '—') + '</td>' +
        '<td style="padding:3px 0;color:#666;font-family:Arial;font-size:8.5pt;text-transform:uppercase">Indice</td><td>' + (val('ius') || '—') + '</td></tr>' +
        '<tr><td style="color:#666;font-family:Arial;font-size:8.5pt;text-transform:uppercase">SBP constructible</td><td>' + m2(s.sbpMax) + '</td>' +
        '<td style="color:#666;font-family:Arial;font-size:8.5pt;text-transform:uppercase">Prix du neuf</td><td>' + fmt(val('prixReference')) + ' CHF/m² SBP</td></tr>' +
      '</table>' +
      '<p style="font-style:italic;color:#666;font-size:8.5pt;line-height:1.4;margin-top:16px">Avis indicatif et non une expertise au sens formel. N\'engage pas son auteur et ne garantit pas un prix de vente.</p>' +
      '<div style="margin-top:16px;font-size:10pt"><b>Kevin Lamidi</b><br>Conseiller en immobilier</div>' +
      '</div>';
  }

  /* ---------- Recalcul ---------- */
  function recompute() {
    var ab = $('abVal'); if (ab) ab.textContent = pct(num(val('abattementServitudes')), 0);
    var res = computeWith(null);
    state.res = res;
    renderKPIs(res);
    updateSensChart();
    updateLevelsChart(res);
    updateDecompChart(res);
    renderDetail(res);
    renderAcq(res);
    buildPdf(res);
  }

  /* ---------- Liaisons ---------- */
  function bind() {
    FIELDS.forEach(function (f) {
      var e = $(f); if (!e) return;
      e.addEventListener(e.type === 'range' ? 'input' : 'input', recompute);
    });
    var ss = $('sensSeg');
    if (ss) ss.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () {
        ss.querySelectorAll('button').forEach(function (x) { x.classList.remove('on'); });
        b.classList.add('on'); state.sensVar = b.dataset.v; updateSensChart();
      });
    });
    var as = $('acqSeg');
    if (as) as.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () {
        as.querySelectorAll('button').forEach(function (x) { x.classList.remove('on'); });
        b.classList.add('on'); state.acqKey = b.dataset.k; if (state.res) renderAcq(state.res);
      });
    });
    var p = $('btnPdf'); if (p) p.addEventListener('click', function () { window.print(); });
  }

  function init() {
    setupChartTheme();
    applyDefaults();
    bind();
    buildSensChart();
    buildLevelsChart();
    buildDecompChart();
    recompute();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
