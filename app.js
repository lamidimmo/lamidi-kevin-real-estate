/* =============================================================================
   app.js — Interface interactive de l'estimation foncière
   Relie la saisie au moteur USPI_CALC, met à jour les vues en temps réel,
   gère la persistance (localStorage), les communes, les comparables et le PDF.
   ============================================================================= */
(function () {
  'use strict';

  var D = window.USPI_DATA;
  var C = window.USPI_CALC;

  /* ---------- Helpers ---------- */
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

  function fmt(n) {
    if (n == null || !isFinite(n)) return '—';
    var r = Math.round(n);
    return r.toLocaleString('de-CH').replace(/[’ ,.]/g, "'");
  }
  function chf(n) { return fmt(n) + ' CHF'; }
  function m2(n) { return fmt(n) + ' m²'; }
  function pct(n, dec) { return (n * 100).toFixed(dec == null ? 1 : dec).replace(/\.0$/, '') + ' %'; }
  function round10k(n) { return Math.round(n / 10000) * 10000; }
  function floor10k(n) { return Math.floor(n / 10000) * 10000; }
  function ceil10k(n) { return Math.ceil(n / 10000) * 10000; }
  function dateFr(d) {
    var mois = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
    return d.getDate() + ' ' + mois[d.getMonth()] + ' ' + d.getFullYear();
  }

  /* ---------- Champs gérés ---------- */
  var FIELDS = [
    'auteur','entite','client','contactEmail',
    'commune','district','noParcelle','surfaceCadastrale','surfaceAcces',
    'surfaceJardin','surfaceBatiments','surfaceCouvert','estimationFiscale','affectation',
    'ius','surfaceDeterminante','normeSurface','hauteurCorniche','distanceLimites','surfaceMinBatiment',
    'pacomRevision','pacomCommentaire','servPassage','servCanalisations','servAutres',
    'servitudes','particularites',
    'prixReference','standing','coutM3','ratioVolumeSBP','ratioHabitableSBP',
    'cfc1','cfc4M2','cfc5Pct','fraisCommercialisationPct',
    'margeP','margeR','margeO',
    'fraisAcquisitionPct','fraisPPE','abattementServitudes','nbNiveaux'
  ];

  var state = { degressivite: JSON.parse(JSON.stringify(D.DEGRESSIVITE)), cible: 'R', lastResult: null, pdfPrefilled: false };

  function val(id) {
    var e = $(id); if (!e) return '';
    if (e.type === 'checkbox') return e.checked;
    return e.value;
  }
  function setVal(id, v) {
    var e = $(id); if (!e) return;
    if (e.type === 'checkbox') e.checked = !!v;
    else e.value = (v == null ? '' : v);
  }

  function collect() {
    var o = {};
    FIELDS.forEach(function (f) { o[f] = val(f); });
    o.degressivite = state.degressivite;
    return o;
  }

  function buildInput() {
    var g = collect();
    return {
      parcelle: {
        commune: g.commune, district: g.district, noParcelle: g.noParcelle,
        surfaceCadastrale: g.surfaceCadastrale, surfaceAcces: g.surfaceAcces,
        surfaceDeterminante: g.surfaceDeterminante,
        estimationFiscale: g.estimationFiscale, affectation: g.affectation, ius: g.ius
      },
      marche: {
        prixReference: g.prixReference, coutM3: g.coutM3,
        ratioVolumeSBP: g.ratioVolumeSBP, ratioHabitableSBP: g.ratioHabitableSBP,
        degressivite: state.degressivite
      },
      couts: {
        cfc1: g.cfc1, cfc4M2: g.cfc4M2, cfc5Pct: g.cfc5Pct,
        fraisCommercialisationPct: g.fraisCommercialisationPct,
        marges: D.SCENARIOS.reduce(function (acc, s) { acc[s.key] = g['marge' + s.key]; return acc; }, {}),
        fraisAcquisitionPct: g.fraisAcquisitionPct, fraisPPE: g.fraisPPE,
        abattementServitudes: g.abattementServitudes, nbNiveaux: g.nbNiveaux
      }
    };
  }

  /* ---------- Base de communes (défauts + sauvegardées) ---------- */
  var COMMUNES_KEY = 'uspi_communes';
  function getCommunesUser() { try { return JSON.parse(localStorage.getItem(COMMUNES_KEY)) || {}; } catch (e) { return {}; } }
  function setCommunesUser(o) { localStorage.setItem(COMMUNES_KEY, JSON.stringify(o)); }
  function getCommunes() {
    var merged = {};
    Object.keys(D.COMMUNES).forEach(function (k) { merged[k] = Object.assign({ _source: 'base' }, D.COMMUNES[k]); });
    var u = getCommunesUser();
    Object.keys(u).forEach(function (k) { merged[k] = Object.assign({}, merged[k], u[k], { _source: merged[k] ? 'modifiée' : 'ajoutée' }); });
    return merged;
  }

  function refreshCommuneDatalist() {
    var dl = $('communeList'); dl.innerHTML = '';
    Object.keys(getCommunes()).sort().forEach(function (c) { var o = el('option'); o.value = c; dl.appendChild(o); });
  }

  /* ---------- Initialisation des listes / défauts ---------- */
  function initSelects() {
    var aff = $('affectation');
    if (aff) D.AFFECTATIONS.forEach(function (a) { aff.appendChild(el('option', null, a)); });
    var norm = $('normeSurface');
    if (norm) D.NORMES_SURFACE.forEach(function (n) { norm.appendChild(el('option', null, n)); });
    refreshCommuneDatalist();
  }

  function applyDefaults() {
    var d = D.DEFAUTS;
    setVal('standing', d.standing);
    setVal('coutM3', d.coutM3);
    setVal('ratioVolumeSBP', d.ratioVolumeSBP);
    setVal('ratioHabitableSBP', d.ratioHabitableSBP);
    setVal('cfc1', d.cfc1);
    setVal('cfc4M2', d.cfc4M2);
    setVal('cfc5Pct', d.cfc5Pct);
    setVal('fraisCommercialisationPct', d.fraisCommercialisationPct);
    D.SCENARIOS.forEach(function (s) { setVal('marge' + s.key, s.margeDefaut); });
    setVal('fraisAcquisitionPct', d.fraisAcquisitionPct);
    setVal('fraisPPE', d.fraisPPE);
    setVal('abattementServitudes', d.abattementServitudes);
    setVal('nbNiveaux', d.nbNiveaux);
    setVal('auteur', 'Kevin Lamidi');
    setVal('entite', 'Courtier en immobilier');
    setVal('contactEmail', 'lamidikevin@icloud.com');
  }

  function showCommuneNote() {
    var n = $('communeNote'); if (!n) return;
    var c = getCommunes()[val('commune')];
    n.textContent = (c && c.notes) ? c.notes : '';
  }

  function prefillCommune() {
    var name = val('commune');
    var c = getCommunes()[name];
    if (!c) { showCommuneNote(); recompute(); return; }
    if (!val('district')) setVal('district', c.district);
    if (c.prixReference != null) setVal('prixReference', c.prixReference);
    if (c.iusVillage != null && !val('ius')) setVal('ius', c.iusVillage);
    if (c.hauteurCorniche != null && !val('hauteurCorniche')) setVal('hauteurCorniche', c.hauteurCorniche);
    if (c.surfaceMinBatiment != null) setVal('surfaceMinBatiment', c.surfaceMinBatiment);
    showCommuneNote();
    recompute();
  }

  function applyStanding() {
    var s = val('standing');
    if (D.COUT_M3_STANDING[s] != null) setVal('coutM3', D.COUT_M3_STANDING[s]);
    recompute();
  }

  /* ---------- Tableau de dégressivité éditable ---------- */
  function renderDegTable() {
    var t = $('degTable');
    if (!t) return;
    t.innerHTML = '';
    var head = el('tr');
    head.appendChild(el('th', null, 'SBP du programme'));
    head.appendChild(el('th', null, '% prix'));
    var thead = el('thead'); thead.appendChild(head); t.appendChild(thead);
    var tb = el('tbody');
    state.degressivite.forEach(function (b, i) {
      var tr = el('tr');
      tr.appendChild(el('td', null, b.label));
      var td = el('td');
      var inp = el('input');
      inp.type = 'number'; inp.step = '0.5'; inp.value = Math.round(b.pct * 1000) / 10;
      inp.style.width = '64px'; inp.style.textAlign = 'right';
      inp.addEventListener('input', function () {
        state.degressivite[i].pct = (parseFloat(inp.value) || 0) / 100;
        recompute();
      });
      td.appendChild(inp);
      tr.appendChild(td);
      tb.appendChild(tr);
    });
    t.appendChild(tb);
  }

  /* =============================================================================
     RECALCUL ET RENDU
     ============================================================================= */
  function recompute() {
    var sc = parseFloat(val('surfaceCadastrale')) || 0;
    var sa = parseFloat(val('surfaceAcces')) || 0;
    var sd = $('surfaceDeterminante'); if (sd) sd.placeholder = (Math.max(0, sc - sa)) + ' (auto)';
    var av = $('abattementVal'); if (av) av.textContent = pct(parseFloat(val('abattementServitudes')) || 0, 0);
    var nv = $('nbNiveauxVal'); if (nv) nv.textContent = val('nbNiveaux');

    var input = buildInput();
    var res = C.calculer(input);
    state.lastResult = res;

    fillFourchette(res);
    renderHero(res);
    renderSynthese(res, input);
    renderDetail(res);
    renderAcquereur(res);
    renderPdf(res);
    updateTopbar();
  }

  function updateTopbar() {
    var b = $('brandLabel'); if (!b) return;
    b.textContent = val('auteur') ? val('auteur') + ' · Estimation foncière' : 'Estimation foncière';
  }

  function margeBadge(taux) {
    return '<span class="badge ' + (taux >= 0.12 ? 'promo' : 'part') + '">marge ' + pct(taux, 0) + '</span>';
  }

  // Compteur animé (tween via requestAnimationFrame).
  function animateNumber(elt, target) {
    if (!elt) return;
    var start = parseFloat(elt.getAttribute('data-v')) || 0;
    if (elt._raf) cancelAnimationFrame(elt._raf);
    var t0 = null, dur = 750;
    function step(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur);
      var e = 1 - Math.pow(1 - p, 3);
      elt.textContent = fmt(start + (target - start) * e);
      if (p < 1) { elt._raf = requestAnimationFrame(step); }
      else { elt.setAttribute('data-v', target); elt.textContent = fmt(target); }
    }
    elt._raf = requestAnimationFrame(step);
  }

  /* ---------- Formulaire de contact (modale + envoi Web3Forms) ----------
     Même service et même clé que le calculateur d'impôt : les demandes
     arrivent par email avec les coordonnées du client et le contexte de
     son estimation. ------------------------------------------------------ */
  var WEB3FORMS_KEY = '09809340-1199-4890-acbd-dc8fa2d65f54';

  /* ---------- Gate de capture : floute le resultat tant que le client n'a pas
     laisse ses coordonnees, puis le devoile + propose le PDF. -------------- */
  function gateUnlocked() {
    try { return sessionStorage.getItem('estim_unlocked') === '1'; } catch (e) { return false; }
  }
  function applyGate(hasResult) {
    var wrap = $('resultWrap'), gate = $('resultGate'), actions = $('resultActions');
    if (!wrap) return;
    var unlocked = gateUnlocked();
    if (hasResult && !unlocked) {
      wrap.classList.add('locked');
      if (gate) gate.hidden = false;
    } else {
      wrap.classList.remove('locked');
      if (gate) gate.hidden = true;
    }
    if (actions) actions.hidden = !(hasResult && unlocked);
  }
  function unlockResult() {
    try { sessionStorage.setItem('estim_unlocked', '1'); } catch (e) { /* ignore */ }
    applyGate(true);
  }
  // EmailJS : envoie le PDF par email au client, sans serveur. A renseigner apres
  // avoir cree le compte + le modele (3 identifiants). Vide -> repli Web3Forms.
  var EMAILJS = { publicKey: 'o9on7lpzcD9yoGIeX', serviceId: 'service_gwait39', templateId: 'template_d7x7csr' };
  function emailjsReady() {
    return !!(window.emailjs && EMAILJS.publicKey && EMAILJS.serviceId && EMAILJS.templateId);
  }

  function buildEvalHtml() {
    var res = state.lastResult;
    if (!res || !res.synthese || res.synthese.sbpMax <= 0) return null;
    var s = res.synthese;
    var vP = floor10k(s.byKey.P || 0), vR = round10k(s.byKey.R || 0), vO = ceil10k(s.byKey.O || 0);
    var commune = val('commune') || 'votre terrain';
    var meta = [commune];
    if (val('surfaceCadastrale')) meta.push(val('surfaceCadastrale') + ' m²');
    if (val('ius')) meta.push('indice ' + val('ius'));
    var date = new Date().toLocaleDateString('fr-CH');
    return '' +
      '<div style="font-family:Helvetica,Arial,sans-serif;color:#14213d;width:760px;padding:40px 44px;box-sizing:border-box">' +
        '<div style="display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #b08d57;padding-bottom:12px;margin-bottom:26px">' +
          '<div><div style="font-size:20px;font-weight:700;letter-spacing:.05em">KEVIN LAMIDI</div>' +
          '<div style="font-style:italic;color:#8a6d4b;font-size:13px">Immobilier sur mesure</div></div>' +
          '<div style="text-align:right;font-size:12px;color:#666">Estimation foncière<br>Canton de Vaud</div>' +
        '</div>' +
        '<h1 style="font-family:Georgia,serif;font-size:24px;margin:0 0 6px">Estimation indicative de votre terrain</h1>' +
        '<p style="color:#666;margin:0 0 26px;font-size:14px">' + meta.join(' · ') + '</p>' +
        '<div style="text-align:center;background:#f7f6f3;border:1px solid #e3e3e3;border-radius:12px;padding:26px;margin-bottom:24px">' +
          '<div style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#666">Valeur de marché estimée</div>' +
          '<div style="font-family:Georgia,serif;font-size:46px;color:#14213d;margin:8px 0 2px">' + chf(vR) + '</div>' +
          '<div style="color:#666;font-size:14px">fourchette ' + fmt(vP) + ' à ' + fmt(vO) + ' CHF</div>' +
        '</div>' +
        '<p style="font-size:13px;color:#444;line-height:1.65;margin:0 0 22px">Cette estimation, établie selon la méthode résiduelle, correspond à ce qu\'un acquéreur peut raisonnablement consacrer au terrain une fois le projet construit et sa marge prise en compte. Pour une évaluation précise tenant compte des particularités de votre parcelle, je me tiens à votre disposition.</p>' +
        '<div style="padding-top:14px;border-top:1px solid #e3e3e3;font-size:13px;color:#14213d">Kevin Lamidi · +41 76 715 50 59 · kevin.lamidi@swsir.ch</div>' +
        '<p style="font-size:10px;color:#999;font-style:italic;margin-top:14px">Avis indicatif, sans engagement, qui ne constitue pas une expertise au sens formel. Établi le ' + date + '.</p>' +
      '</div>';
  }

  function evalPdfBase64() {
    return new Promise(function (resolve, reject) {
      var html = buildEvalHtml();
      if (!html || !window.html2pdf) { reject(new Error('pdf indisponible')); return; }
      var holder = document.createElement('div');
      holder.style.position = 'fixed'; holder.style.left = '-9999px'; holder.style.top = '0';
      holder.innerHTML = html;
      document.body.appendChild(holder);
      window.html2pdf().set({
        margin: 0, image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' }
      }).from(holder.firstChild).outputPdf('datauristring').then(function (uri) {
        holder.remove();
        resolve(String(uri).split(',')[1] || '');
      }).catch(function (e) { holder.remove(); reject(e); });
    });
  }

  function initContactForm() {
    var modal = $('contactModal'), openBtn = $('ctaOpen'), closeBtn = $('modalClose');
    var form = $('contactForm'), statusEl = $('cfStatus'), submitBtn = $('cfSubmit'), keyInput = $('web3formsKey');
    if (!modal || !openBtn || !form) return;
    keyInput.value = WEB3FORMS_KEY;

    function fillEstimation() {
      var parts = [];
      if (val('commune')) parts.push('Commune : ' + val('commune'));
      if (val('noParcelle')) parts.push('Parcelle : ' + val('noParcelle'));
      if (val('surfaceCadastrale')) parts.push('Surface : ' + val('surfaceCadastrale') + ' m²');
      if (val('ius')) parts.push('Indice : ' + val('ius'));
      var res = state.lastResult;
      if (res && res.synthese && res.synthese.sbpMax > 0) {
        var s = res.synthese;
        parts.push('Estimation indicative : ' + chf(round10k(s.byKey.R || 0)) +
          ' (de ' + fmt(floor10k(s.byKey.P || 0)) + ' à ' + fmt(ceil10k(s.byKey.O || 0)) + ' CHF)');
      }
      $('cfEstimation').value = parts.join(' | ');
    }
    function onKey(e) { if (e.key === 'Escape') close(); }
    function open() {
      fillEstimation();
      modal.hidden = false; document.body.style.overflow = 'hidden';
      setTimeout(function () { if ($('cfPrenom')) $('cfPrenom').focus(); }, 40);
      document.addEventListener('keydown', onKey);
    }
    function close() {
      modal.hidden = true; document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    }
    function setStatus(type, msg) {
      statusEl.className = 'cf-status' + (type ? ' show ' + type : '');
      statusEl.textContent = msg || '';
    }

    openBtn.addEventListener('click', open);
    var gateBtn = $('gateOpen'); if (gateBtn) gateBtn.addEventListener('click', open);
    // "Me contacter" du bandeau : ouvre la fenetre de contact (plus fiable qu'un mailto).
    document.querySelectorAll('.pnav-contact').forEach(function (b) {
      b.addEventListener('click', function (e) { e.preventDefault(); open(); });
    });
    closeBtn.addEventListener('click', close);
    modal.addEventListener('click', function (e) { if (e.target === modal) close(); });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (form.botcheck && form.botcheck.checked) return;
      if (!form.checkValidity()) { form.reportValidity(); return; }
      submitBtn.disabled = true;
      var lbl = submitBtn.textContent; submitBtn.textContent = 'Envoi…'; setStatus('', '');
      function finish(ok, errMsg) {
        if (ok) {
          form.reset();
          setStatus('ok', emailjsReady()
            ? 'Merci ! Votre évaluation vient de vous être envoyée par email. Elle s\'affiche aussi ci-dessous.'
            : 'Merci ! Votre évaluation est débloquée ci-dessous.');
          unlockResult();
          setTimeout(close, 2400);
        } else {
          setStatus('err', errMsg || 'Une erreur est survenue. Réessayez ou écrivez à lamidikevin@icloud.com.');
        }
        submitBtn.disabled = false; submitBtn.textContent = lbl;
      }

      if (emailjsReady()) {
        // Envoi de l'estimation par email (dans le corps du message, sans piece jointe).
        var s = (state.lastResult || {}).synthese;
        var params = {
          to_email: val('cfEmail'),
          email: val('cfEmail'),
          reply_to: val('cfEmail'),
          prenom: val('cfPrenom'), nom: val('cfNom'),
          name: [val('cfPrenom'), val('cfNom')].filter(Boolean).join(' '),
          phone: val('cfPhone'),
          commune: val('commune') || '—', surface: val('surfaceCadastrale') || '—', ius: val('ius') || '—',
          estimation: $('cfEstimation') ? $('cfEstimation').value : '',
          valeur: '—', fourchette: '—'
        };
        if (s && s.sbpMax > 0) {
          params.valeur = chf(round10k(s.byKey.R || 0));
          params.fourchette = fmt(floor10k(s.byKey.P || 0)) + ' à ' + fmt(ceil10k(s.byKey.O || 0)) + ' CHF';
        }
        emailjs.send(EMAILJS.serviceId, EMAILJS.templateId, params, { publicKey: EMAILJS.publicKey })
          .then(function () { finish(true); })
          .catch(function () { finish(false, 'Envoi impossible pour le moment. Réessayez ou écrivez à lamidikevin@icloud.com.'); });
      } else {
        var payload = {};
        new FormData(form).forEach(function (v, k) { payload[k] = v; });
        fetch('https://api.web3forms.com/submit', {
          method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(payload)
        }).then(function (r) { return r.json(); })
          .then(function (data) { finish(!!(data && data.success)); })
          .catch(function () { finish(false, 'Connexion impossible. Vérifiez votre réseau et réessayez.'); });
      }
    });
  }

  var heroBuilt = false;

  var HERO_SKELETON =
    '<div class="svg-scene-wrap"><svg class="svg-scene" viewBox="0 0 420 168" preserveAspectRatio="xMidYMax meet" aria-hidden="true">' +
      '<circle class="sun" cx="372" cy="40" r="16"></circle>' +
      '<rect class="ground" x="14" y="122" width="392" height="34" rx="11"></rect>' +
      '<line class="parcel-edge" x1="20" y1="122" x2="400" y2="122"></line>' +
      '<g class="tree">' +
        '<rect x="80" y="98" width="6" height="26" rx="2" fill="#8a6d4b"></rect>' +
        '<circle cx="83" cy="92" r="18" fill="#9bb89a"></circle>' +
        '<circle cx="70" cy="100" r="12" fill="#8fb08f"></circle>' +
        '<circle cx="95" cy="100" r="12" fill="#8fb08f"></circle>' +
      '</g>' +
      '<g class="bld bld-a">' +
        '<polygon class="roof" points="150,72 178,52 206,72"></polygon>' +
        '<rect class="wall" x="152" y="72" width="52" height="50"></rect>' +
        '<rect class="win" x="160" y="82" width="13" height="13"></rect>' +
        '<rect class="win" x="183" y="82" width="13" height="13"></rect>' +
        '<rect class="door" x="170" y="102" width="16" height="20"></rect>' +
      '</g>' +
      '<g class="bld bld-b">' +
        '<polygon class="roof" points="206,72 234,52 262,72"></polygon>' +
        '<rect class="wall" x="208" y="72" width="52" height="50"></rect>' +
        '<rect class="win" x="216" y="82" width="13" height="13"></rect>' +
        '<rect class="win" x="239" y="82" width="13" height="13"></rect>' +
        '<rect class="door" x="226" y="102" width="16" height="20"></rect>' +
      '</g>' +
      '<text class="scene-cap" x="210" y="146" text-anchor="middle">votre parcelle</text>' +
    '</svg></div>' +
    '<div class="r-lab">Valeur de marché estimée de votre terrain</div>' +
    '<div class="r-main"><span class="r-num" data-v="0">0</span><span class="unit">CHF</span></div>' +
    '<div class="r-range-txt"></div>' +
    '<div class="r-bar-wrap"><div class="r-bar">' +
      '<div class="r-fill"></div>' +
      '<div class="r-mark" style="left:0"></div>' +
      '<div class="r-mark mid" style="left:0"></div>' +
      '<div class="r-mark" style="left:100%"></div>' +
      '<div class="r-tick tick-P" style="left:0"><span class="t-val"></span>prudente</div>' +
      '<div class="r-tick tick-R" style="left:0"><span class="t-val"></span>réaliste</div>' +
      '<div class="r-tick tick-O" style="left:100%"><span class="t-val"></span>potentiel</div>' +
    '</div></div>' +
    '<div class="viz-grid">' +
      '<div class="viz viz-decomp">' +
        '<h4>D\'où vient cette valeur ?</h4>' +
        '<div class="decomp-bar">' +
          '<div class="decomp-seg seg-terrain"></div>' +
          '<div class="decomp-seg seg-constr"></div>' +
          '<div class="decomp-seg seg-autres"></div>' +
        '</div>' +
        '<div class="decomp-legend">' +
          '<div class="lg is-terrain"><span class="dot" style="background:#16264a"></span>Valeur du terrain<span class="v lg-terrain"></span></div>' +
          '<div class="lg"><span class="dot" style="background:#c9cdd6"></span>Coût de construction<span class="v lg-constr"></span></div>' +
          '<div class="lg"><span class="dot" style="background:#e4d3b3"></span>Marge et frais<span class="v lg-autres"></span></div>' +
        '</div>' +
      '</div>' +
      '<div class="viz viz-scen">' +
        '<h4>Selon le profil d\'acquéreur</h4>' +
        '<div class="scen-rows">' +
          '<div class="scen-row"><div class="scen-top"><span class="name">Prudente</span><span class="val val-P"></span></div><div class="scen-track"><div class="scen-fill lv-P"></div></div></div>' +
          '<div class="scen-row"><div class="scen-top"><span class="name">Réaliste</span><span class="val val-R"></span></div><div class="scen-track"><div class="scen-fill lv-R"></div></div></div>' +
          '<div class="scen-row"><div class="scen-top"><span class="name">Potentiel</span><span class="val val-O"></span></div><div class="scen-track"><div class="scen-fill lv-O"></div></div></div>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<p class="r-explain"></p>' +
    '<div class="r-disclaimer">Avis indicatif, sans engagement, qui ne constitue pas une expertise au sens formel.</div>';

  // Résultat de la façade simple : valeur mise en avant + barre + graphiques animés.
  function renderHero(res) {
    var box = $('heroResult');
    var s = res.synthese;
    if (!s || s.sbpMax <= 0 || !(parseFloat(val('prixReference')) > 0)) {
      box.className = 'result empty';
      box.innerHTML = '<div class="r-lab">Estimation</div>' +
        '<p class="r-explain">Renseignez la commune, la surface, l\'indice de zone et le prix du neuf pour estimer la valeur de votre terrain.</p>';
      heroBuilt = false;
      applyGate(false);
      return;
    }

    var justBuilt = false;
    if (!heroBuilt) {
      box.className = 'result filled';
      box.innerHTML = HERO_SKELETON;
      heroBuilt = true;
      justBuilt = true;
    }

    var R = res.scenarios.find(function (x) { return x.key === 'R'; }) || res.scenarios[0];
    var vP = floor10k(s.byKey.P || 0);
    var vR = round10k(s.byKey.R || 0);
    var vO = ceil10k(s.byKey.O || 0);
    var span = (vO - vP) || 1;
    var midPct = Math.max(8, Math.min(92, (vR - vP) / span * 100));
    var sbp = Math.round(s.sbpMax);

    // Décomposition de la recette (réaliste) : terrain + construction + (marge & frais).
    var recette = R.recette || 1;
    var segT = Math.max(0, R.terrainNet);
    var segC = Math.max(0, R.coutConstruction);
    var segA = Math.max(0, recette - segT - segC);
    function pc(x) { return (x / recette * 100); }

    // Barres des 3 niveaux (relatif au potentiel).
    var mx = Math.max(vP, vR, vO) || 1;

    // Hauteur des maisons : proportionnelle à la SBP par unité (densité bâtie).
    var sbpUnit = R.sbpParUnite || (s.sbpMax / 2) || 150;
    var bldF = Math.max(0.5, Math.min(1.3, sbpUnit / 150));

    function apply() {
      box.querySelector('.bld-a').style.transform = 'scaleY(' + bldF + ')';
      box.querySelector('.bld-b').style.transform = 'scaleY(' + bldF + ')';
      animateNumber(box.querySelector('.r-num'), vR);
      box.querySelector('.r-range-txt').innerHTML =
        'fourchette <strong>' + fmt(vP) + '</strong> à <strong>' + fmt(vO) + ' CHF</strong>';
      // Barre de fourchette
      box.querySelector('.r-fill').style.width = midPct + '%';
      box.querySelector('.r-mark.mid').style.left = midPct + '%';
      box.querySelector('.tick-R').style.left = midPct + '%';
      box.querySelector('.tick-P .t-val').textContent = fmt(vP);
      box.querySelector('.tick-R .t-val').textContent = fmt(vR);
      box.querySelector('.tick-O .t-val').textContent = fmt(vO);
      // Décomposition
      box.querySelector('.seg-terrain').style.width = pc(segT) + '%';
      box.querySelector('.seg-constr').style.width = pc(segC) + '%';
      box.querySelector('.seg-autres').style.width = pc(segA) + '%';
      box.querySelector('.lg-terrain').textContent = chf(segT);
      box.querySelector('.lg-constr').textContent = chf(segC);
      box.querySelector('.lg-autres').textContent = chf(segA);
      // 3 niveaux
      box.querySelector('.lv-P').style.width = (vP / mx * 100) + '%';
      box.querySelector('.lv-R').style.width = (vR / mx * 100) + '%';
      box.querySelector('.lv-O').style.width = (vO / mx * 100) + '%';
      box.querySelector('.val-P').textContent = chf(vP);
      box.querySelector('.val-R').textContent = chf(vR);
      box.querySelector('.val-O').textContent = chf(vO);
      // Explication
      box.querySelector('.r-explain').textContent =
        'Sur la base d\'environ ' + fmt(sbp) + ' m² de surface brute de plancher constructible, cette fourchette correspond à ce qu\'un acquéreur peut raisonnablement consacrer au terrain, une fois le projet construit et sa marge prise en compte.';
    }

    if (justBuilt) { requestAnimationFrame(apply); } else { apply(); }
    applyGate(true);
  }

  function renderSynthese(res, input) {
    if (!$('synCards')) return;
    var s = res.synthese;
    var commune = val('commune') || '—';
    var noP = val('noParcelle') || '—';
    $('synTitre').textContent = 'Parcelle ' + noP + ', ' + commune;
    $('synSub').textContent = 'Canton de Vaud' + (val('district') ? ', district de ' + val('district') : '');

    var cards = $('synCards'); cards.innerHTML = '';
    function card(k, v, sub, feature) {
      var c = el('div', 'card' + (feature ? ' feature' : ''));
      c.appendChild(el('div', 'k', k));
      c.appendChild(el('div', 'v', v));
      if (sub) c.appendChild(el('div', 's', sub));
      cards.appendChild(c);
    }
    if (s.sbpMax > 0) {
      var vR = s.byKey.R || 0, vP = s.byKey.P || 0, vO = s.byKey.O || 0;
      var parM2 = s.surfaceCadastrale > 0 ? vR / s.surfaceCadastrale : 0;
      card('Valeur réaliste', chf(vR), fmt(parM2) + ' CHF/m² de parcelle', true);
      card('Plancher (prudente)', chf(vP), 'minimum défendable');
      card('Potentiel optimal', chf(vO), 'haut de fourchette crédible');
    } else {
      card('Estimation', '—', 'Renseignez la surface cadastrale et l\'IUS pour lancer le calcul.', true);
      card('Plancher', '—', '');
      card('Potentiel', '—', '');
    }

    var t = $('synTable'); t.innerHTML = '';
    var thead = el('thead');
    var hr = el('tr');
    ['Scénario','Marge','SBP','Prix/m² SBP','Recette vente','Terrain défendable','CHF/m² parcelle','x fiscale']
      .forEach(function (h) { hr.appendChild(el('th', null, h)); });
    thead.appendChild(hr); t.appendChild(thead);
    var tb = el('tbody');
    res.scenarios.forEach(function (sc) {
      var tr = el('tr');
      tr.appendChild(el('td', null, '<strong>' + sc.key + '</strong> ' + sc.nom));
      tr.appendChild(el('td', null, margeBadge(sc.tauxMarge)));
      tr.appendChild(el('td', null, m2(sc.sbp)));
      tr.appendChild(el('td', null, fmt(sc.prixSBP)));
      tr.appendChild(el('td', null, chf(sc.recette)));
      tr.appendChild(el('td', null, '<strong>' + chf(sc.terrainNet) + '</strong>'));
      tr.appendChild(el('td', null, fmt(sc.terrainM2)));
      tr.appendChild(el('td', null, sc.multipleFiscal ? sc.multipleFiscal.toFixed(2) + 'x' : '—'));
      tb.appendChild(tr);
    });
    t.appendChild(tb);

    var fisc = parseFloat(val('estimationFiscale')) || 0;
    $('synFiscal').textContent = fisc
      ? 'Repère : estimation fiscale ' + chf(fisc) + '. La médiane représente ' + (s.median / fisc).toFixed(2) + ' fois l\'estimation fiscale.'
      : 'Renseigner l\'estimation fiscale pour afficher le multiple administratif.';
  }

  function renderDetail(res) {
    var t = $('detailTable'); if (!t) return;
    t.innerHTML = '';
    var sc = res.scenarios;
    var thead = el('thead'); var hr = el('tr');
    hr.appendChild(el('th', null, 'Ligne'));
    sc.forEach(function (s) { hr.appendChild(el('th', null, s.key + ' · ' + s.nom)); });
    thead.appendChild(hr); t.appendChild(thead);
    var tb = el('tbody');

    function row(label, fn, opts) {
      opts = opts || {};
      var tr = el('tr', opts.cls || '');
      tr.appendChild(el('td', null, label));
      sc.forEach(function (s) { tr.appendChild(el('td', null, fn(s))); });
      tb.appendChild(tr);
    }
    function sectionRow(label) {
      var tr = el('tr', 'section');
      var td = el('td', null, label); td.colSpan = sc.length + 1; tr.appendChild(td); tb.appendChild(tr);
    }

    sectionRow('Programme');
    row('Part de SBP exploitée', function (s) { return pct(s.pctSBP, 0); });
    row('Unités', function (s) { return s.nbUnites; });
    row('SBP exploitée', function (s) { return m2(s.sbp); });
    row('SBP par unité', function (s) { return m2(s.sbpParUnite); });
    row('Surface habitable totale', function (s) { return m2(s.habitableTotal); });
    row('Volume bâti SIA 116', function (s) { return fmt(s.volume) + ' m³'; });
    row('Emprise au sol estimée', function (s) { return m2(s.emprise); });
    row('Surface non bâtie', function (s) { return m2(s.surfaceNonBatie); });

    sectionRow('Recette de vente');
    row('Dégressivité appliquée', function (s) { return pct(s.pctDegressivite, 1); }, { cls: 'subtle' });
    row('Prix de vente (CHF/m² SBP)', function (s) { return fmt(s.prixSBP); });
    row('Recette de vente totale', function (s) { return chf(s.recette); }, { cls: 'total' });

    sectionRow('Coûts de construction (CFC)');
    row('CFC 1 travaux préparatoires', function (s) { return chf(s.cfc1); });
    row('CFC 2 bâtiment', function (s) { return chf(s.cfc2); });
    row('CFC 4 aménagements extérieurs', function (s) { return chf(s.cfc4); });
    row('CFC 5 frais secondaires', function (s) { return chf(s.cfc5); });
    row('Total coûts de construction', function (s) { return chf(s.coutConstruction); }, { cls: 'total' });

    sectionRow('Charges de l\'opération');
    row('Frais de commercialisation', function (s) { return chf(s.fraisCommercialisation); });
    row('Marge acquéreur', function (s) { return chf(s.marge) + ' (' + pct(s.tauxMarge, 0) + ')'; });
    row('Frais constitution PPE', function (s) { return s.fraisPPE ? chf(s.fraisPPE) : '—'; });

    sectionRow('Résidu, terrain défendable');
    row('Terrain avant abattement', function (s) { return chf(s.terrainBrut); }, { cls: 'subtle' });
    row('Terrain défendable net', function (s) { return chf(s.terrainNet); }, { cls: 'total' });
    row('Terrain au m² de parcelle', function (s) { return fmt(s.terrainM2) + ' CHF/m²'; });
    row('Multiple vs estimation fiscale', function (s) { return s.multipleFiscal ? s.multipleFiscal.toFixed(2) + 'x' : '—'; });

    t.appendChild(tb);
  }

  function renderAcquereur(res) {
    var sel = $('cibleScenario');
    if (!sel) return;
    if (sel.options.length !== res.scenarios.length) {
      sel.innerHTML = '';
      res.scenarios.forEach(function (s) {
        var o = el('option', null, s.key + ' · ' + s.nom); o.value = s.key; sel.appendChild(o);
      });
      sel.value = state.cible;
    }
    var s = res.scenarios.find(function (x) { return x.key === state.cible; }) || res.scenarios[0];
    var a = s.acquereur;

    var cards = $('acqCards'); cards.innerHTML = '';
    function card(k, v, sub, feature) {
      var c = el('div', 'card' + (feature ? ' feature' : ''));
      c.appendChild(el('div', 'k', k)); c.appendChild(el('div', 'v', v));
      if (sub) c.appendChild(el('div', 's', sub)); cards.appendChild(c);
    }
    card('Coût total opération', chf(a.coutTotalOperation), s.nom, true);
    card('Prix de revient', fmt(a.chfM2Habitable) + ' CHF/m²', 'habitable');
    var eco = a.economieM2 >= 0;
    card(eco ? 'Économie vs clé en main' : 'Surcoût vs clé en main',
      fmt(Math.abs(a.economieM2)) + ' CHF/m²',
      (eco ? '−' : '+') + fmt(Math.abs(a.economieTotale)) + ' CHF au total');

    var t = $('acqTable'); t.innerHTML = '';
    var tb = el('tbody');
    function r(label, v, cls) {
      var tr = el('tr', cls || '');
      tr.appendChild(el('td', null, label));
      tr.appendChild(el('td', null, v));
      tb.appendChild(tr);
    }
    r('Acquisition terrain (frais ' + pct(res.params.fraisAcquisitionPct, 0) + ' inclus)', chf(a.coutAcquisitionTerrain));
    r('Coûts de construction', chf(s.coutConstruction));
    if (s.fraisPPE) r('Constitution PPE', chf(s.fraisPPE));
    r('Coût total de l\'opération', chf(a.coutTotalOperation), 'total');
    r('Surface habitable obtenue', m2(s.habitableTotal));
    r('Prix de revient au m² habitable', fmt(a.chfM2Habitable) + ' CHF/m²', 'total');
    r('Marché clé en main équivalent', fmt(a.prixCleEnMain) + ' CHF/m² hab');
    r((a.economieM2 >= 0 ? 'Économie' : 'Surcoût') + ' au m²', fmt(Math.abs(a.economieM2)) + ' CHF/m²');
    t.appendChild(tb);

    $('acqProfil').textContent = 'Profil acquéreur cible : ' + s.profil;
  }

  /* =============================================================================
     PDF / AVIS
     ============================================================================= */
  // Remplit la fourchette PDF depuis les trois niveaux. Appelé à chaque recalcul.
  // Les champs PDF n'étant pas dans FIELDS, une retouche manuelle persiste tant
  // qu'aucune entrée du dossier ne change.
  function fillFourchette(res) {
    var bk = res.synthese.byKey;
    setVal('pdfMin', floor10k(bk.P || 0));
    setVal('pdfCentral', round10k(bk.R || 0));
    setVal('pdfMax', ceil10k(bk.O || 0));
  }

  function fourchetteTxt(min, max) {
    min = parseFloat(min) || 0; max = parseFloat(max) || 0;
    if (max && max !== min) return fmt(min) + ' à ' + fmt(max) + ' CHF';
    return chf(min || max);
  }

  function renderPdf(res) {
    var sheet = $('pdfSheet');
    if (!sheet) return;
    var commune = val('commune') || '[Commune]';
    var noP = val('noParcelle') || '[N°]';
    var district = val('district') || '[district]';
    var auteur = val('auteur') || '[Auteur]';
    var entite = val('entite') || '';
    var client = val('client') || '[Nom client]';
    var s = res.synthese;
    var today = new Date();
    var ref = 'Réf. ' + (val('noParcelle') || '—') + ' / ' + commune;

    var rarete = val('rareteNiveau');
    var inclureRarete = $('optRarete').checked;
    var pacom = val('pacomRevision');

    var vMin = parseFloat(val('pdfMin')) || 0;
    var vCentral = parseFloat(val('pdfCentral')) || 0;
    var vMax = parseFloat(val('pdfMax')) || 0;
    var fourchette = fourchetteTxt(vMin, vMax);

    var idRows = [
      ['Commune', commune],
      ['District', district],
      ['N° de parcelle', noP],
      ['Surface cadastrale', val('surfaceCadastrale') ? m2(val('surfaceCadastrale')) : '—'],
      ['Affectation', val('affectation') || '—'],
      ['IUS applicable', val('ius') || '—'],
      ['SBP autorisée', m2(s.sbpMax)],
      ['Estimation fiscale', val('estimationFiscale') ? chf(val('estimationFiscale')) : '—']
    ];
    var idHtml = idRows.map(function (r) {
      return '<tr><td class="lbl">' + r[0] + '</td><td>' + r[1] + '</td></tr>';
    }).join('');

    var lecture = 'L\'estimation repose sur l\'observation du marché immobilier local. À ' + commune +
      ', les programmes neufs récents se commercialisent à des niveaux de prix observables dans les transactions et offres en cours dans la commune. C\'est ce prix de marché qui détermine la borne haute de la valeur foncière : un acquéreur n\'engagera pas un projet dont le coût total dépasserait le prix auquel le marché propose des biens équivalents. La fourchette retenue se construit donc à partir de ce plafond, en soustrayant le coût de construction estimé et la marge éventuelle de l\'acquéreur. La différence définit ce qu\'il peut consacrer au terrain.';

    var rareteTxt = 'Au sein de la fourchette ainsi définie, la parcelle ' + noP + ' présente une caractéristique qui plaide pour un positionnement sur le haut : la rareté. À ' + commune +
      ', les terrains constructibles disponibles à la vente sont aujourd\'hui ' + rarete +
      '. Cette absence d\'alternative pour un acquéreur particulier souhaitant construire dans la commune limite sa capacité à négocier à la baisse et soutient le maintien du haut de la fourchette, sans toutefois la dépasser.';

    var reserve = 'Présente évaluation indicative, établie à stade amont. La valeur effective dépendra notamment du programme constructible retenu par l\'acquéreur et de la configuration de mise en marché.';
    if (pacom) {
      reserve += ' Point d\'attention : le plan d\'affectation communal de ' + commune +
        ' est actuellement en cours de révision ; l\'entrée en vigueur du nouveau plan pourrait modifier le potentiel constructible de la parcelle, potentiellement à la baisse pour une commune rurale soumise à la pression de réduction des zones à bâtir surdimensionnées.';
    }
    reserve += ' Un échange direct permettra de préciser ces hypothèses au regard de votre situation.';

    sheet.innerHTML =
      '<div class="pdf-band">' +
        '<div class="b-left">' + escapeHtml(auteur) + '</div>' +
        '<div class="b-right">' + escapeHtml(ref) + '<br>' + dateFr(today) + '</div>' +
      '</div>' +
      '<div class="pdf-body">' +
        '<h1>Parcelle ' + escapeHtml(noP) + ', ' + escapeHtml(commune) + '</h1>' +
        '<div class="pdf-sub">Canton de Vaud, district de ' + escapeHtml(district) + '</div>' +
        '<p class="pdf-preambule">Avis indicatif de valeur de marché établi à la demande de ' + escapeHtml(client) +
          ', fondé sur l\'observation du marché immobilier local et le potentiel constructible de la parcelle.</p>' +

        '<div class="pdf-h">Le bien</div>' +
        '<table class="pdf-ident">' + idHtml + '</table>' +

        '<div class="pdf-h">La valeur de marché estimée</div>' +
        '<div class="pdf-value-block">' +
          '<div class="c-lab">Fourchette de valeur de marché</div>' +
          '<div class="c-val" style="font-size:24pt">' + fourchette + '</div>' +
          '<div class="c-sub">Valeur réaliste ' + chf(vCentral) + ', soit environ ' + fmt(vCentral / (s.surfaceCadastrale || 1)) + ' CHF/m² de parcelle</div>' +
        '</div>' +

        '<div class="pdf-h">Lecture du marché</div>' +
        '<p class="pdf-txt">' + lecture + '</p>' +

        (inclureRarete ? '<div class="pdf-h">Rareté et haut de fourchette</div><p class="pdf-txt">' + rareteTxt + '</p>' : '') +

        '<div class="pdf-h">Réserves</div>' +
        '<p class="pdf-txt pdf-reserve">' + reserve + '</p>' +

        '<p class="pdf-mention">Le présent document constitue un avis indicatif de valeur et non une expertise immobilière au sens formel. Il n\'engage pas son auteur et ne garantit pas un prix de vente. Toute utilisation à l\'égard d\'un tiers doit être préalablement portée à la connaissance du soussigné.</p>' +

        '<div class="pdf-sign">' +
          '<div><div class="who">' + escapeHtml(auteur) + '</div><div class="muted">' + escapeHtml(entite) + '</div></div>' +
          '<div class="right">Fait le ' + dateFr(today) + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="pdf-foot"><span>Avis indicatif de valeur</span><span>Page 1 / 1</span></div>';
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* =============================================================================
     GESTIONNAIRE DE COMMUNES
     ============================================================================= */
  function renderCommunes() {
    var t = $('communesTable'); if (!t) return;
    var communes = getCommunes();
    t.innerHTML = '';
    var thead = el('thead'); var hr = el('tr');
    ['Commune','District','Prix/m² SBP','IUS village','Haut. corniche','Surf. min','Source','',''].forEach(function (h) { hr.appendChild(el('th', null, h)); });
    thead.appendChild(hr); t.appendChild(thead);
    var tb = el('tbody');
    Object.keys(communes).sort().forEach(function (name) {
      var c = communes[name];
      var tr = el('tr');
      tr.appendChild(el('td', null, '<strong>' + name + '</strong>'));
      tr.appendChild(el('td', null, c.district || '—'));
      tr.appendChild(el('td', null, c.prixReference != null ? fmt(c.prixReference) : '—'));
      tr.appendChild(el('td', null, c.iusVillage != null ? c.iusVillage : '—'));
      tr.appendChild(el('td', null, c.hauteurCorniche != null ? c.hauteurCorniche + ' m' : '—'));
      tr.appendChild(el('td', null, c.surfaceMinBatiment != null ? c.surfaceMinBatiment + ' m²' : '—'));
      var src = c._source === 'base' ? '<span class="badge part">base</span>' : '<span class="badge promo">' + c._source + '</span>';
      tr.appendChild(el('td', null, src));
      var tdE = el('td'); var be = el('button', 'btn ghost', 'Éditer'); be.style.padding = '2px 8px';
      be.addEventListener('click', function () { editCommune(name, c); });
      tdE.appendChild(be); tr.appendChild(tdE);
      var tdD = el('td');
      if (c._source !== 'base') {
        var bd = el('button', 'btn ghost', '×'); bd.style.padding = '2px 8px';
        bd.addEventListener('click', function () { deleteCommune(name); });
        tdD.appendChild(bd);
      }
      tr.appendChild(tdD);
      tb.appendChild(tr);
    });
    t.appendChild(tb);
  }

  function editCommune(name, c) {
    setVal('k_commune', name);
    setVal('k_district', c.district || '');
    setVal('k_prix', c.prixReference != null ? c.prixReference : '');
    setVal('k_ius', c.iusVillage != null ? c.iusVillage : '');
    setVal('k_hauteur', c.hauteurCorniche != null ? c.hauteurCorniche : '');
    setVal('k_surfmin', c.surfaceMinBatiment != null ? c.surfaceMinBatiment : '');
    setVal('k_notes', c.notes || '');
    $('communeFormTitle').textContent = 'Modifier ' + name;
    $('panel-communes').scrollIntoView({ block: 'start' });
  }

  function resetCommuneForm() {
    ['k_commune','k_district','k_prix','k_ius','k_hauteur','k_surfmin','k_notes'].forEach(function (id) { setVal(id, ''); });
    $('communeFormTitle').textContent = 'Ajouter ou modifier une commune';
  }

  function saveCommune() {
    var name = (val('k_commune') || '').trim();
    if (!name) { alert('Indiquez le nom de la commune.'); return; }
    var u = getCommunesUser();
    function n(v) { var x = parseFloat(v); return isFinite(x) ? x : null; }
    u[name] = {
      district: val('k_district') || '',
      prixReference: n(val('k_prix')),
      iusVillage: n(val('k_ius')),
      hauteurCorniche: n(val('k_hauteur')),
      surfaceMinBatiment: n(val('k_surfmin')),
      notes: val('k_notes') || ''
    };
    setCommunesUser(u);
    refreshCommuneDatalist();
    renderCommunes();
    resetCommuneForm();
    if (val('commune') === name) prefillCommune();
  }

  function deleteCommune(name) {
    var u = getCommunesUser();
    if (u[name] && confirm('Retirer « ' + name + ' » de vos communes ? (une commune de base réapparaîtra avec ses valeurs d\'origine)')) {
      delete u[name]; setCommunesUser(u);
      refreshCommuneDatalist(); renderCommunes();
    }
  }

  /* =============================================================================
     COMPARABLES (localStorage)
     ============================================================================= */
  var COMP_KEY = 'uspi_comparables';
  function getComps() { try { return JSON.parse(localStorage.getItem(COMP_KEY)) || []; } catch (e) { return []; } }
  function setComps(a) { localStorage.setItem(COMP_KEY, JSON.stringify(a)); }

  function renderComps() {
    var t = $('compTable'); if (!t) return;
    var comps = getComps();
    var commune = (val('commune') || '').toLowerCase();
    t.innerHTML = '';
    var thead = el('thead'); var hr = el('tr');
    ['Commune','Adresse','Type','SBP','Habitable','Prix','CHF/m² hab','Date','Source',''].forEach(function (h) { hr.appendChild(el('th', null, h)); });
    thead.appendChild(hr); t.appendChild(thead);
    var tb = el('tbody');
    comps.sort(function (a, b) {
      var pa = (a.commune || '').toLowerCase() === commune ? 0 : 1;
      var pb = (b.commune || '').toLowerCase() === commune ? 0 : 1;
      return pa - pb;
    });
    if (!comps.length) {
      var tr = el('tr'); var td = el('td', 'muted', 'Aucun comparable archivé.'); td.colSpan = 10; tr.appendChild(td); tb.appendChild(tr);
    }
    comps.forEach(function (c, i) {
      var tr = el('tr');
      if ((c.commune || '').toLowerCase() === commune && commune) tr.style.background = '#fbfaf7';
      var chab = c.hab ? Math.round(c.prix / c.hab) : '';
      [c.commune, c.adresse, c.type, c.sbp, c.hab, fmt(c.prix), chab ? fmt(chab) : '—', c.date, c.source].forEach(function (v) {
        tr.appendChild(el('td', null, v == null ? '' : v));
      });
      var td = el('td'); var b = el('button', 'btn ghost', '×'); b.style.padding = '2px 8px';
      b.addEventListener('click', function () { var a = getComps(); a.splice(i, 1); setComps(a); renderComps(); });
      td.appendChild(b); tr.appendChild(td);
      tb.appendChild(tr);
    });
    t.appendChild(tb);
  }

  function addComp() {
    var comps = getComps();
    comps.push({
      commune: val('c_commune'), adresse: val('c_adresse'), type: val('c_type'),
      sbp: parseFloat(val('c_sbp')) || null, hab: parseFloat(val('c_hab')) || null,
      prix: parseFloat(val('c_prix')) || null, date: val('c_date'), source: val('c_source')
    });
    setComps(comps);
    ['c_commune','c_adresse','c_sbp','c_hab','c_prix','c_source'].forEach(function (id) { setVal(id, ''); });
    renderComps();
  }

  /* =============================================================================
     DOSSIERS (localStorage)
     ============================================================================= */
  var DOSS_KEY = 'uspi_dossiers';
  function getDoss() { try { return JSON.parse(localStorage.getItem(DOSS_KEY)) || {}; } catch (e) { return {}; } }
  function setDoss(o) { localStorage.setItem(DOSS_KEY, JSON.stringify(o)); }

  function snapshot() { var o = collect(); o.degressivite = state.degressivite; return o; }
  function restore(o) {
    FIELDS.forEach(function (f) { if (f in o) setVal(f, o[f]); });
    if (o.degressivite) state.degressivite = o.degressivite;
    renderDegTable();
    recompute();
  }

  function refreshDossierList() {
    var sel = $('dossierList'); if (!sel) return;
    sel.innerHTML = '';
    var d = getDoss();
    var keys = Object.keys(d);
    if (!keys.length) { sel.appendChild(el('option', null, '(aucun dossier)')); return; }
    keys.forEach(function (k) { var o = el('option', null, k); o.value = k; sel.appendChild(o); });
  }

  function saveDossier() {
    var name = (val('noParcelle') ? val('noParcelle') + ' ' : '') + (val('commune') || 'dossier');
    name = prompt('Nom du dossier :', name.trim());
    if (!name) return;
    var d = getDoss(); d[name] = snapshot(); setDoss(d);
    refreshDossierList(); $('dossierList').value = name;
  }
  function loadDossier() { var name = $('dossierList').value; var d = getDoss(); if (d[name]) restore(d[name]); }
  function deleteDossier() {
    var name = $('dossierList').value; var d = getDoss();
    if (d[name] && confirm('Supprimer « ' + name + ' » ?')) { delete d[name]; setDoss(d); refreshDossierList(); }
  }

  function exportJson() {
    var blob = new Blob([JSON.stringify(snapshot(), null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'dossier-' + (val('commune') || 'foncier') + '.json';
    a.click();
  }
  function importJson(file) {
    var reader = new FileReader();
    reader.onload = function () { try { restore(JSON.parse(reader.result)); } catch (e) { alert('Fichier invalide.'); } };
    reader.readAsText(file);
  }

  /* =============================================================================
     DÉMARRAGE GÉNÉRIQUE (dossier vierge, socle commun à tous les dossiers)
     ============================================================================= */
  function startNew() {
    // Au chargement : tous les champs vides, aucun resultat tant que la surface,
    // l'indice et le prix du neuf ne sont pas renseignes par le visiteur.
    recompute();
  }

  /* =============================================================================
     LIAISONS / INIT
     ============================================================================= */
  function bind() {
    // Lie un écouteur seulement si l'élément existe (la page publique allégée
    // n'a pas le bloc expert : on évite ainsi toute erreur).
    function addEvt(id, evt, fn) { var e = $(id); if (e) e.addEventListener(evt, fn); }

    FIELDS.forEach(function (f) {
      var e = $(f); if (!e) return;
      var evt = (e.tagName === 'SELECT' || e.type === 'checkbox' || e.type === 'range') ? 'change' : 'input';
      e.addEventListener(evt, recompute);
      if (e.type === 'range') e.addEventListener('input', recompute);
    });
    addEvt('commune', 'change', prefillCommune);
    addEvt('standing', 'change', applyStanding);

    document.querySelectorAll('.tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        document.querySelectorAll('.tab').forEach(function (t) { t.classList.remove('active'); });
        document.querySelectorAll('.panel').forEach(function (p) { p.classList.remove('active'); });
        tab.classList.add('active');
        var panel = $('panel-' + tab.dataset.tab); if (panel) panel.classList.add('active');
      });
    });

    addEvt('cibleScenario', 'change', function () { state.cible = this.value; renderAcquereur(state.lastResult); });
    addEvt('optRarete', 'change', function () { renderPdf(state.lastResult); });
    addEvt('rareteNiveau', 'change', function () { renderPdf(state.lastResult); });
    ['pdfMin', 'pdfCentral', 'pdfMax'].forEach(function (id) {
      addEvt(id, 'input', function () { renderPdf(state.lastResult); });
    });

    function showExpert(open) {
      var ex = $('expert'); if (!ex) return;
      var b = $('btnExpert');
      if (open) {
        ex.removeAttribute('hidden');
        if (b) b.textContent = 'Masquer le mode expert';
        ex.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        ex.setAttribute('hidden', '');
        if (b) b.textContent = 'Mode expert (méthode détaillée)';
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
    addEvt('btnExpert', 'click', function () { showExpert($('expert').hasAttribute('hidden')); });
    addEvt('btnSimple', 'click', function () { showExpert(false); });

    addEvt('btnPrint', 'click', function () { window.print(); });
    addEvt('btnSave', 'click', saveDossier);
    addEvt('btnLoad', 'click', loadDossier);
    addEvt('btnDelete', 'click', deleteDossier);
    addEvt('btnExport', 'click', exportJson);
    addEvt('btnImport', 'click', function () { var f = $('fileImport'); if (f) f.click(); });
    addEvt('fileImport', 'change', function () { if (this.files[0]) importJson(this.files[0]); });
    addEvt('btnAddComp', 'click', addComp);
    addEvt('btnSaveCommune', 'click', saveCommune);
    addEvt('btnResetCommune', 'click', resetCommuneForm);
  }

  function init() {
    initSelects();
    applyDefaults();
    renderDegTable();
    bind();
    refreshDossierList();
    startNew();
    renderComps();
    renderCommunes();
    showCommuneNote();
    initContactForm();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
