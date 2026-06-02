/* ============================================================
   IGI Vaud — calculator logic ported 1:1 from
   "IGI Vaud Calculateur v2.xlsx" (sheet "Calculateur")
   Formulas: art. 70/72 LI Vaud, droits de mutation 3,3 %,
   notaire/RF 0,7 %, franchise CHF 5 000, taux plancher 7 %.
   ============================================================ */

/* ---------- barème (art. 72 LI) ---------- */
const BAREME = [
  { y: 0,  rate: 0.30, label: "< 1 an" },
  { y: 1,  rate: 0.27, label: "1–2 ans" },
  { y: 2,  rate: 0.24, label: "2–3 ans" },
  { y: 3,  rate: 0.22, label: "3–4 ans" },
  { y: 4,  rate: 0.20, label: "4–5 ans" },
  { y: 5,  rate: 0.18, label: "5–6 ans" },
  { y: 6,  rate: 0.17, label: "6–7 ans" },
  { y: 7,  rate: 0.16, label: "7–8 ans" },
  { y: 8,  rate: 0.15, label: "8–9 ans" },
  { y: 9,  rate: 0.15, label: "9–10 ans" },
  { y: 10, rate: 0.14, label: "10–11 ans" },
  { y: 11, rate: 0.14, label: "11–12 ans" },
  { y: 12, rate: 0.13, label: "12–13 ans" },
  { y: 13, rate: 0.13, label: "13–14 ans" },
  { y: 14, rate: 0.12, label: "14–15 ans" },
  { y: 15, rate: 0.12, label: "15–16 ans" },
  { y: 16, rate: 0.11, label: "16–17 ans" },
  { y: 17, rate: 0.11, label: "17–18 ans" },
  { y: 18, rate: 0.10, label: "18–19 ans" },
  { y: 19, rate: 0.10, label: "19–20 ans" },
  { y: 20, rate: 0.09, label: "20–21 ans" },
  { y: 21, rate: 0.09, label: "21–22 ans" },
  { y: 22, rate: 0.08, label: "22–23 ans" },
  { y: 23, rate: 0.08, label: "23–24 ans" },
  { y: 24, rate: 0.07, label: "≥ 24 ans — taux plancher" },
];

const FRANCHISE = 5000;
const FLOOR_YEARS = 24;

/* ============================================================
   Expert / agence — source unique (alimente la carte CTA,
   la modale et le récapitulatif PDF). À ajuster une seule fois.
   ============================================================ */
const EXPERT = {
  name: "Kevin Lamidi",
  role: "Conseiller en vente immobilière",
  agency: "",                       // livrable neutre, sans marque
  phone: "+41 76 715 50 59",
  email: "lamidikevin@icloud.com",
};

/* ============================================================
   Web3Forms — clé d'accès pour le formulaire de contact
   → Obtenir gratuitement sur https://web3forms.com (saisir votre
     e-mail, copier la "Access Key"), puis coller ci-dessous.
     Les demandes arriveront sur l'e-mail associé à la clé.
   ============================================================ */
const WEB3FORMS_KEY = "09809340-1199-4890-acbd-dc8fa2d65f54";

/* ---------- guide travaux data ---------- */
const GUIDE = [
  // YES — pleine déduction
  { type: "yes", title: "Construction piscine / jacuzzi", note: "Équipement nouveau = augmentation durable de valeur" },
  { type: "yes", title: "Ajout d'un sauna", note: "Équipement nouveau" },
  { type: "yes", title: "Extension / agrandissement surface habitable", note: "Création de m² nouveaux" },
  { type: "yes", title: "Aménagement de combles (chambre, bureau)", note: "Transformation en surface habitable" },
  { type: "yes", title: "Construction véranda / jardin d'hiver", note: "Ajout structurel nouveau" },
  { type: "yes", title: "Ajout garage / carport", note: "Construction nouvelle — non existante à l'achat" },
  { type: "yes", title: "Rachat de servitudes améliorant la propriété", note: "Augmente la valeur juridique du bien" },
  { type: "yes", title: "Frais bancaires liés au prêt de construction", note: "Directement liés à la réalisation des travaux" },
  { type: "yes", title: "Commission de courtage à la vente", note: "Frais liés à l'aliénation — art. 70 LI" },
  { type: "yes", title: "Pénalités résiliation anticipée hypothèque", note: "Conditionnées à la vente — admises par l'ACI" },

  // YES partiel
  { type: "yes-partial", title: "Cuisine haut-de-gamme sur bien à cuisine basique", note: "Part de surclassement = plus-value. Remplacement équivalent = entretien." },
  { type: "yes-partial", title: "Salle de bain haut-de-gamme sur SdB basique", note: "Même logique que cuisine — justifier l'écart de standing" },
  { type: "yes-partial", title: "Installation panneaux solaires / photovoltaïque", note: "Part plus-value (valeur ajoutée au bien) admise par l'ACI Vaud" },
  { type: "yes-partial", title: "Mise aux normes énergétiques au-delà de l'obligation", note: "Part au-delà de l'entretien obligatoire légal" },

  // NO — entretien
  { type: "no", title: "Peinture intérieure / extérieure", note: "Entretien courant — déductible de l'impôt sur le revenu" },
  { type: "no", title: "Remplacement chaudière à l'identique", note: "Sans amélioration qualitative = entretien" },
  { type: "no", title: "Remplacement toiture à l'identique", note: "Remplacement à l'équivalent" },
  { type: "no", title: "Remplacement appareils électroménagers équivalents", note: "Entretien ordinaire" },
  { type: "no", title: "Remplacement fenêtres / volets à l'identique", note: "Sans saut qualitatif significatif" },
  { type: "no", title: "Réparations courantes plomberie / électricité", note: "Maintenance — déductible du revenu annuel" },
  { type: "no", title: "Entretien jardin courant", note: "Non admis à Vaud (contrairement à d'autres cantons)" },
  { type: "no", title: "Contributions au fonds de rénovation PPE", note: "Assimilées à entretien par l'ACI Vaud" },
  { type: "no", title: "Intérêts hypothécaires annuels", note: "Déductibles du revenu annuel — pas de l'IGI" },
];

const TAG_LABEL = {
  "yes": "OUI",
  "yes-partial": "OUI partiel",
  "no": "NON",
};

/* ============================================================
   Helpers
   ============================================================ */
/* Swiss style: apostrophe thousand separator + comma decimal (e.g. 210'000,00) */
const _fmt2 = new Intl.NumberFormat("fr-CH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const _fmt0 = new Intl.NumberFormat("fr-CH", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const _fmtPct = new Intl.NumberFormat("fr-CH", { style: "percent", minimumFractionDigits: 0, maximumFractionDigits: 0 });
function _withApostrophes(parts) {
  return parts.map(p => p.type === "group" ? "'" : p.value).join("");
}
function nbsp(s) { return s; } // legacy noop
function formatMoney(n) {
  if (!isFinite(n)) return "0,00";
  return _withApostrophes(_fmt2.formatToParts(n));
}
function formatInt(n) {
  if (!isFinite(n)) return "0";
  return _withApostrophes(_fmt0.formatToParts(n));
}
function formatPct(r) {
  if (!isFinite(r)) return "0 %";
  // single value, no thousand separator needed — keep Intl output but normalise space to nbsp
  return _fmtPct.format(r).replace(/\s/g, " ");
}

function parseNum(v) {
  if (v == null) return 0;
  if (typeof v === "number") return v;
  const s = String(v).replace(/[\s  ']/g, "").replace(",", ".");
  if (s === "" || s === "-") return 0;
  const n = parseFloat(s);
  return isFinite(n) ? n : 0;
}
function parseDate(v) {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}
function diffDays(a, b) { return Math.round((b - a) / 86400000); }
function round2(n) { return Math.round(n * 100) / 100; }

/* VLOOKUP(value, table, col, TRUE) — approximate match */
function lookupRate(years) {
  let rate = BAREME[0].rate;
  for (const row of BAREME) {
    if (row.y <= years) rate = row.rate;
    else break;
  }
  return rate;
}

/* ============================================================
   State + DOM
   ============================================================ */
const STORAGE_KEY = "igi-vaud-v2";
const inputIds = [
  "prixVente", "prixAchat", "dateAchat", "dateVente",
  "cedule",
  "t1", "t2", "t3", "t4", "t5",
  "courtage", "penalites", "autresVente",
  "estimFiscale", "dateEstim",
  "ansPrincipaleSlider",
];

const state = {
  occupation: 1,           // 1 = principale, 2 = secondaire, 3 = mixte
};

function $(s) { return document.querySelector(s); }
function $$(s) { return Array.from(document.querySelectorAll(s)); }
function set(name, value) { $$(`[data-out="${name}"]`).forEach((el) => { el.textContent = value; }); }

function readInputs() {
  const data = {};
  inputIds.forEach((id) => {
    const el = document.querySelector(`[data-input="${id}"]`);
    if (!el) return;
    if (el.type === "date") data[id] = parseDate(el.value);
    else data[id] = parseNum(el.value);
  });
  data.occupation = state.occupation;
  return data;
}

/* ============================================================
   Compute — same Excel formulas
   ============================================================ */
function compute(d) {
  // ① durée réelle
  const realYears = (d.dateAchat && d.dateVente)
    ? Math.max(0, Math.floor(diffDays(d.dateAchat, d.dateVente) / 365.25))
    : null;

  // ② frais d'acquisition
  const droitsMutation = round2(d.prixAchat * 0.033);
  const fraisNotaire   = round2(d.prixAchat * 0.007);
  const totalAcq       = droitsMutation + fraisNotaire + d.cedule;

  // ③ travaux
  const totalTravaux   = d.t1 + d.t2 + d.t3 + d.t4 + d.t5;

  // ④ frais de vente
  const totalVente     = d.courtage + d.penalites + d.autresVente;

  // ⑤ occupation — derived from mode + slider
  let ansPrincipale = 0;
  let ansSecondaire = 0;
  if (realYears != null) {
    if (d.occupation === 1) {                     // Principale uniquement
      ansPrincipale = realYears;
      ansSecondaire = 0;
    } else if (d.occupation === 2) {              // Secondaire uniquement
      ansPrincipale = 0;
      ansSecondaire = realYears;
    } else {                                       // Mixte — slider
      ansPrincipale = Math.min(Math.max(d.ansPrincipaleSlider || 0, 0), realYears);
      ansSecondaire = realYears - ansPrincipale;
    }
  }

  const dureePonderee = realYears == null ? null : Math.min(realYears + ansPrincipale, 99);

  // ⑥ option estimation fiscale
  let eligible = false;
  let eligLabel;
  if (d.estimFiscale === 0) eligLabel = "Non applicable (valeur = 0)";
  else if (!d.dateEstim) eligLabel = "Saisir la date de l'estimation";
  else if (!d.dateAchat) eligLabel = "Saisir la date d'achat";
  else if (!d.dateVente) eligLabel = "Saisir la date de vente";
  else if (d.dateEstim <= d.dateAchat) eligLabel = "Non éligible — estimation antérieure à l'achat";
  else if (diffDays(d.dateEstim, d.dateVente) >= 3650) { eligLabel = "Éligible (≥ 10 ans en vigueur)"; eligible = true; }
  else eligLabel = "Non éligible — moins de 10 ans en vigueur";

  const prixRetenu = (eligible && d.estimFiscale > d.prixAchat) ? d.estimFiscale : d.prixAchat;

  // ⑦ gain
  const gainBrut = d.prixVente - prixRetenu - totalAcq - totalTravaux - totalVente;

  // ⑧ taux & impôt
  let taux = null, gainNet = 0, igi = null;
  if (dureePonderee != null) {
    taux = lookupRate(Math.min(dureePonderee, FLOOR_YEARS));
    gainNet = Math.max(gainBrut - FRANCHISE, 0);
    igi = gainNet * taux;
  }

  // ⑨ alertes
  let tipDiffere;
  if (taux == null) tipDiffere = "— compléter les données —";
  else if (taux <= 0.07) tipDiffere = "Taux plancher de 7 % déjà atteint";
  else {
    const tauxNext = lookupRate(Math.min(dureePonderee + 1, FLOOR_YEARS));
    const economie = (taux - tauxNext) * gainNet;
    tipDiffere = economie > 0
      ? `Économie ${formatMoney(economie)} CHF (taux ${formatPct(taux)} → ${formatPct(tauxNext)})`
      : "Pas d'économie sur la tranche suivante";
  }

  let tipEstim;
  if (d.estimFiscale === 0) tipEstim = "Non renseignée — vérifier si applicable";
  else if (eligible && d.estimFiscale > d.prixAchat) tipEstim = "Avantageuse — retenue comme prix d'acquisition";
  else if (d.estimFiscale > d.prixAchat) tipEstim = "Valeur supérieure mais conditions non remplies";
  else tipEstim = "Non retenue (prix d'achat ≥ estimation)";

  return {
    realYears,
    ansPrincipale, ansSecondaire,
    droitsMutation, fraisNotaire, totalAcq,
    totalTravaux, totalVente,
    dureePonderee,
    eligLabel, prixRetenu,
    gainBrut, taux, gainNet, igi,
    tipDiffere, tipEstim,
  };
}

/* ============================================================
   Render
   ============================================================ */
function render() {
  const d = readInputs();
  const r = compute(d);

  // Section 1
  set("dureeReelle", r.realYears == null ? "— saisir les dates —" : `${r.realYears} an${r.realYears > 1 ? "s" : ""}`);

  // Section 2
  set("droitsMutation", formatMoney(r.droitsMutation));
  set("fraisNotaire",   formatMoney(r.fraisNotaire));
  set("totalAcq",       formatMoney(r.totalAcq));

  // Sections 3-4
  set("totalTravaux", formatMoney(r.totalTravaux));
  set("totalVente",   formatMoney(r.totalVente));

  // Section 5 — driven by occupation mode
  syncOccupationUI(r);

  set("dureePonderee", r.dureePonderee == null
    ? "— saisir les dates —"
    : `${r.dureePonderee} an${r.dureePonderee > 1 ? "s" : ""}`);

  // Section 6
  set("eligEstim", r.eligLabel);
  set("prixRetenu", formatMoney(r.prixRetenu));

  // Result panel — décomposition
  set("kvVente",      formatMoney(d.prixVente));
  set("kvAcq",        formatMoney(r.prixRetenu));
  set("kvFraisAcq",   formatMoney(r.totalAcq));
  set("kvTravaux",    formatMoney(r.totalTravaux));
  set("kvFraisVente", formatMoney(r.totalVente));
  set("kvBrut",       formatMoney(r.gainBrut));
  set("kvNet",        formatMoney(r.gainNet));
  set("kvDuree", r.dureePonderee == null ? "—" : `${r.dureePonderee} ans`);
  set("kvTaux",  r.taux == null ? "—" : formatPct(r.taux));

  // Hero IGI
  if (r.igi == null) {
    set("igi", "—");
    set("igiSub", "Saisissez les données pour estimer l'impôt");
  } else if (r.gainNet === 0 && r.gainBrut <= FRANCHISE) {
    set("igi", "0 CHF");
    set("igiSub", "Exonéré — gain nul ou sous la franchise de 5 000 CHF");
  } else {
    set("igi", `${formatMoney(r.igi)} CHF`);
    set("igiSub", `Gain net ${formatMoney(r.gainNet)} CHF · taux ${formatPct(r.taux)} (${r.dureePonderee} ans pondérés)`);
  }

  // Tips
  set("tipDiffere", r.tipDiffere);
  set("tipEstim", r.tipEstim);

  // Highlight active barème row
  highlightBareme(r.dureePonderee);

  // Hero timeline — place the user's point on the degressive curve
  updateHeroUserPoint(r.dureePonderee, r.taux);

  // Keep the printable PDF report in sync with the current inputs
  buildPdfReport(d, r);

  saveState();
}

/* ============================================================
   Occupation UI — show/hide panels, sync slider
   ============================================================ */
function syncOccupationUI(r) {
  // detail panels
  $$(".occ-detail").forEach((el) => {
    const want = Number(el.dataset.occState) === state.occupation;
    el.hidden = !want;
  });

  // active button
  $$(".occ-btn").forEach((b) => b.classList.toggle("is-active", Number(b.dataset.occ) === state.occupation));

  // slider state for mixte
  const slider = document.getElementById("ansSlider");
  if (slider) {
    const maxY = r.realYears == null ? 0 : r.realYears;
    if (Number(slider.max) !== maxY) {
      slider.max = maxY;
      if (Number(slider.value) > maxY) slider.value = maxY;
    }
    // background fill via custom property
    const pct = maxY > 0 ? (slider.value / maxY) * 100 : 0;
    slider.style.setProperty("--slider-pct", pct + "%");

    set("totalYearsLabel", r.realYears == null ? "— ans" : `${r.realYears} ans`);
    set("legPrincipale", r.ansPrincipale);
    set("legSecondaire", r.ansSecondaire);
  }
}

/* ============================================================
   Persistence
   ============================================================ */
function saveState() {
  try {
    const raw = {};
    inputIds.forEach((id) => {
      const el = document.querySelector(`[data-input="${id}"]`);
      if (el) raw[id] = el.value;
    });
    raw.__occupation = state.occupation;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(raw));
  } catch {}
}
function loadState() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    inputIds.forEach((id) => {
      const el = document.querySelector(`[data-input="${id}"]`);
      if (el && raw[id] != null) el.value = raw[id];
    });
    if (raw.__occupation) state.occupation = Number(raw.__occupation);
  } catch {}
}

/* ============================================================
   Barème — table + SVG chart
   ============================================================ */
function renderBareme() {
  const tbody = $("#baremeTable tbody");
  tbody.innerHTML = BAREME.map((r) => {
    const isFloor = r.y === 24;
    return `<tr${isFloor ? ' class="floor"' : ""} data-yr="${r.y}">
      <td>${r.y}${isFloor ? "+" : ""}</td>
      <td>${r.label}</td>
      <td>${formatPct(r.rate)}</td>
    </tr>`;
  }).join("");
  drawRateChart();
}

function highlightBareme(years) {
  $$("#baremeTable tr").forEach((tr) => {
    tr.style.outline = "";
    tr.style.outlineOffset = "";
  });
  if (years == null) return;
  const y = Math.min(years, 24);
  const row = $(`#baremeTable tr[data-yr="${y}"]`);
  if (row) {
    row.style.outline = "2px solid var(--accent)";
    row.style.outlineOffset = "-2px";
  }
}

function drawRateChart() {
  const svg = $("#rateChart");
  if (!svg) return;
  const W = 600, H = 220, P = { l: 30, r: 12, t: 12, b: 28 };
  const minR = 0.05, maxR = 0.32;
  const xs = BAREME.map((r) => r.y);
  const xMin = Math.min(...xs), xMax = Math.max(...xs);
  const x = (v) => P.l + ((v - xMin) / (xMax - xMin)) * (W - P.l - P.r);
  const y = (v) => H - P.b - ((v - minR) / (maxR - minR)) * (H - P.t - P.b);

  let grid = "";
  for (const r of [0.30, 0.20, 0.10]) {
    grid += `<line x1="${P.l}" x2="${W - P.r}" y1="${y(r)}" y2="${y(r)}" stroke="#eef0f4"/>`;
    grid += `<text x="${P.l - 6}" y="${y(r) + 3}" text-anchor="end" font-size="9" fill="#7a8aa0" font-family="Inter">${Math.round(r * 100)}%</text>`;
  }

  let d = "";
  BAREME.forEach((p, i) => { d += `${i === 0 ? "M" : "L"} ${x(p.y).toFixed(1)} ${y(p.rate).toFixed(1)} `; });
  let area = d + `L ${x(xMax).toFixed(1)} ${H - P.b} L ${x(xMin).toFixed(1)} ${H - P.b} Z`;
  let pts = BAREME.map((p) => `<circle cx="${x(p.y).toFixed(1)}" cy="${y(p.rate).toFixed(1)}" r="2.5" fill="#0b1f33"/>`).join("");

  let xLabels = "";
  for (const v of [0, 5, 10, 15, 20, 24]) {
    xLabels += `<text x="${x(v)}" y="${H - 10}" text-anchor="middle" font-size="9" fill="#7a8aa0" font-family="Inter">${v}${v === 24 ? "+" : ""} ans</text>`;
  }

  svg.innerHTML = `
    <defs>
      <linearGradient id="grad" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stop-color="#b48a47" stop-opacity=".24"/>
        <stop offset="100%" stop-color="#b48a47" stop-opacity="0"/>
      </linearGradient>
    </defs>
    ${grid}
    <path d="${area}" fill="url(#grad)"/>
    <path d="${d}" fill="none" stroke="#0b1f33" stroke-width="1.6"/>
    ${pts}
    ${xLabels}
  `;
}

/* ============================================================
   Hero timeline — animation « le temps réduit l'impôt »
   Curseur 0→24 ans, courbe qui se trace, taux 30%→7%,
   puis point live de la durée pondérée de l'utilisateur.
   ============================================================ */
const HERO = {
  W: 720, H: 220,
  P: { l: 44, r: 92, t: 22, b: 34 },
  minR: 0.05, maxR: 0.32,
  raf: 0, introDone: false, totalLen: 0,
  pendingUser: null, hasPending: false,
  el: {},
};
function heroX(year) {
  return HERO.P.l + (Math.max(0, Math.min(24, year)) / 24) * (HERO.W - HERO.P.l - HERO.P.r);
}
function heroY(rate) {
  return HERO.H - HERO.P.b - ((rate - HERO.minR) / (HERO.maxR - HERO.minR)) * (HERO.H - HERO.P.t - HERO.P.b);
}
function rateAt(year) {
  year = Math.max(0, Math.min(24, year));
  const i = Math.floor(year);
  if (i >= 24) return BAREME[24].rate;
  const a = BAREME[i].rate, b = BAREME[i + 1].rate;
  return a + (b - a) * (year - i);
}
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/* set the year readout with correct FR pluralisation (0 & 1 → "an", ≥2 → "ans") */
function setHeroYear(n) {
  if (!HERO.el.year) return;
  HERO.el.year.textContent = n;
  if (HERO.el.yearUnit) HERO.el.yearUnit.textContent = Math.abs(Number(n)) >= 2 ? "ans" : "an";
}

function buildHero() {
  const svg = document.getElementById("heroChart");
  if (!svg) return;
  const { W, H, P } = HERO;

  const pts = BAREME.map((p) => [heroX(p.y), heroY(p.rate)]);
  const curveD = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const areaD = curveD + ` L ${heroX(24).toFixed(1)} ${(H - P.b).toFixed(1)} L ${heroX(0).toFixed(1)} ${(H - P.b).toFixed(1)} Z`;

  let grid = "";
  for (const r of [0.30, 0.20, 0.10]) {
    grid += `<line class="htl-grid" x1="${P.l}" x2="${W - P.r}" y1="${heroY(r).toFixed(1)}" y2="${heroY(r).toFixed(1)}"/>`;
    grid += `<text class="htl-rate-label" x="${P.l - 8}" y="${(heroY(r) + 3).toFixed(1)}" text-anchor="end">${Math.round(r * 100)}%</text>`;
  }
  let xlabels = "";
  for (const v of [0, 6, 12, 18, 24]) {
    xlabels += `<text class="htl-axis-label" x="${heroX(v).toFixed(1)}" y="${H - 12}" text-anchor="middle">${v}${v === 24 ? "+" : ""} ans</text>`;
  }

  svg.innerHTML = `
    <defs>
      <linearGradient id="htlArea" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stop-color="#b48a47" stop-opacity=".34"/>
        <stop offset="100%" stop-color="#b48a47" stop-opacity="0"/>
      </linearGradient>
      <clipPath id="htlClip"><rect id="htlClipRect" x="0" y="0" width="0" height="${H}"/></clipPath>
    </defs>
    ${grid}
    ${xlabels}
    <path d="${areaD}" fill="url(#htlArea)" clip-path="url(#htlClip)"/>
    <path id="htlCurve" class="htl-curve" d="${curveD}"/>
    <g id="htlUser" opacity="0">
      <line id="htlUserGuide" class="htl-user-guide" x1="0" y1="0" x2="0" y2="${(H - P.b).toFixed(1)}"/>
      <circle id="htlUserPulse" class="htl-user-pulse" cx="0" cy="0" r="6">
        <animate attributeName="r" values="6;15;6" dur="2.2s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values=".5;0;.5" dur="2.2s" repeatCount="indefinite"/>
      </circle>
      <circle id="htlUserDot" class="htl-user-dot" cx="0" cy="0" r="5.5"/>
      <text id="htlUserLabel" class="htl-user-label" x="0" y="0" text-anchor="middle">votre bien</text>
    </g>
    <circle id="htlMarker" class="htl-marker" cx="${heroX(0).toFixed(1)}" cy="${heroY(0.30).toFixed(1)}" r="6"/>
  `;

  HERO.el = {
    svg,
    curve: document.getElementById("htlCurve"),
    clipRect: document.getElementById("htlClipRect"),
    marker: document.getElementById("htlMarker"),
    user: document.getElementById("htlUser"),
    userGuide: document.getElementById("htlUserGuide"),
    userPulse: document.getElementById("htlUserPulse"),
    userDot: document.getElementById("htlUserDot"),
    userLabel: document.getElementById("htlUserLabel"),
    rate: document.getElementById("heroRate"),
    year: document.getElementById("heroYear"),
    yearUnit: document.getElementById("heroYearUnit"),
  };
  HERO.totalLen = HERO.el.curve.getTotalLength();
  HERO.el.curve.style.strokeDasharray = HERO.totalLen;
  HERO.el.curve.style.strokeDashoffset = HERO.totalLen;
}

function heroFinalState() {
  const { el, W, P } = HERO;
  el.curve.style.strokeDashoffset = 0;
  el.clipRect.setAttribute("width", W - P.r);
  el.marker.setAttribute("opacity", "1");
  el.marker.setAttribute("cx", heroX(24).toFixed(1));
  el.marker.setAttribute("cy", heroY(BAREME[24].rate).toFixed(1));
  el.rate.textContent = "7 %";
  setHeroYear(24);
  HERO.introDone = true;
  if (HERO.hasPending) applyHeroUser(HERO.pendingUser);
}

function runHeroIntro() {
  const { el } = HERO;
  if (!el.curve) return;
  HERO.introDone = false;
  el.user.setAttribute("opacity", "0");
  // reset to start
  cancelAnimationFrame(HERO.raf);
  el.clipRect.setAttribute("width", 0);
  el.curve.style.strokeDashoffset = HERO.totalLen;
  el.marker.setAttribute("opacity", "1");
  el.marker.setAttribute("cx", heroX(0).toFixed(1));
  el.marker.setAttribute("cy", heroY(0.30).toFixed(1));
  el.rate.textContent = "30 %";
  setHeroYear(0);

  // Respect reduced-motion → jump straight to the final chart.
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    heroFinalState();
    return;
  }
  // If the page is hidden (background tab), rAF is paused: show the final
  // chart now and replay the intro once the page becomes visible.
  if (document.hidden) {
    heroFinalState();
    if (!HERO._visBound) {
      HERO._visBound = true;
      document.addEventListener("visibilitychange", function onVis() {
        if (!document.hidden) {
          document.removeEventListener("visibilitychange", onVis);
          HERO._visBound = false;
          runHeroIntro();
        }
      });
    }
    return;
  }
  const dur = 2200;
  let start = null;
  function frame(now) {
    if (start == null) start = now;
    let t = (now - start) / dur;
    if (t > 1) t = 1;
    const e = easeInOutCubic(t);
    const pt = el.curve.getPointAtLength(HERO.totalLen * e);
    el.marker.setAttribute("cx", pt.x.toFixed(1));
    el.marker.setAttribute("cy", pt.y.toFixed(1));
    el.clipRect.setAttribute("width", pt.x.toFixed(1));
    el.curve.style.strokeDashoffset = HERO.totalLen * (1 - e);
    const year = e * 24;
    el.rate.textContent = Math.round(rateAt(year) * 100) + " %";
    setHeroYear(Math.round(year));
    if (t < 1) HERO.raf = requestAnimationFrame(frame);
    else heroFinalState();
  }
  HERO.raf = requestAnimationFrame(frame);
}

function applyHeroUser(u) {
  const { el, W, H, P } = HERO;
  if (!el.user) return;
  if (!u || u.years == null || u.rate == null) {
    el.user.setAttribute("opacity", "0");
    if (HERO.introDone) {
      el.marker.setAttribute("opacity", "1");
      el.rate.textContent = "7 %";
      setHeroYear(24);
    }
    return;
  }
  const yClamp = Math.max(0, Math.min(24, u.years));
  const px = heroX(yClamp), py = heroY(u.rate);
  el.userGuide.setAttribute("x1", px.toFixed(1)); el.userGuide.setAttribute("x2", px.toFixed(1));
  el.userGuide.setAttribute("y1", py.toFixed(1)); el.userGuide.setAttribute("y2", (H - P.b).toFixed(1));
  el.userPulse.setAttribute("cx", px.toFixed(1)); el.userPulse.setAttribute("cy", py.toFixed(1));
  el.userDot.setAttribute("cx", px.toFixed(1)); el.userDot.setAttribute("cy", py.toFixed(1));
  let anchor = "middle";
  if (px > W - P.r - 36) anchor = "end";
  else if (px < P.l + 36) anchor = "start";
  el.userLabel.setAttribute("x", px.toFixed(1));
  el.userLabel.setAttribute("y", (py - 14).toFixed(1));
  el.userLabel.setAttribute("text-anchor", anchor);
  el.user.setAttribute("opacity", "1");
  el.marker.setAttribute("opacity", "0");
  el.rate.textContent = Math.round(u.rate * 100) + " %";
  setHeroYear(u.years);
}

function updateHeroUserPoint(years, rate) {
  const u = (years == null || rate == null) ? null : { years, rate };
  HERO.pendingUser = u;
  HERO.hasPending = true;
  if (HERO.introDone) applyHeroUser(u);
}

/* ============================================================
   Guide travaux — unified list with filter + search
   ============================================================ */
const guideState = { filter: "all", q: "" };

function renderGuide() {
  const list = $("#guideList");
  const q = guideState.q.trim().toLowerCase();
  const filtered = GUIDE.filter((g) => {
    if (guideState.filter === "yes" && g.type === "no") return false;
    if (guideState.filter === "no" && g.type !== "no") return false;
    if (q && !(g.title.toLowerCase().includes(q) || g.note.toLowerCase().includes(q))) return false;
    return true;
  });
  if (filtered.length === 0) {
    list.innerHTML = `<div class="g-empty">Aucun résultat pour « ${guideState.q} »</div>`;
    return;
  }
  list.innerHTML = filtered.map((g) => {
    const cls = g.type === "yes" ? "is-yes" : g.type === "yes-partial" ? "is-yes-partial" : "is-no";
    const mark = g.type === "no"
      ? `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>`
      : `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>`;
    return `<div class="g-item ${cls}">
      <span class="g-mark">${mark}</span>
      <div class="g-body">
        <div class="g-title">${g.title}</div>
        <div class="g-note">${g.note}</div>
      </div>
      <span class="g-tag">${TAG_LABEL[g.type]}</span>
    </div>`;
  }).join("");
}

function initGuide() {
  renderGuide();
  $("#guideSearch").addEventListener("input", (e) => { guideState.q = e.target.value; renderGuide(); });
  $$(".chip").forEach((c) => c.addEventListener("click", () => {
    $$(".chip").forEach((x) => x.classList.remove("is-active"));
    c.classList.add("is-active");
    guideState.filter = c.dataset.filter;
    renderGuide();
  }));
}

/* ============================================================
   Tabs
   ============================================================ */
function gotoTab(name) {
  $$(".tab").forEach((t) => {
    const on = t.dataset.tab === name;
    t.classList.toggle("is-active", on);
    t.setAttribute("aria-selected", on ? "true" : "false");
  });
  $$(".panel").forEach((p) => {
    const on = p.id === `panel-${name}`;
    p.classList.toggle("is-active", on);
    p.hidden = !on;
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function initTabs() {
  $$(".tab").forEach((tab) => tab.addEventListener("click", () => gotoTab(tab.dataset.tab)));
  $$("[data-goto]").forEach((a) => a.addEventListener("click", (e) => {
    e.preventDefault();
    gotoTab(a.dataset.goto);
  }));
}

/* ============================================================
   Numeric input — formatting on blur
   ============================================================ */
function attachNumericFormatting() {
  $$("input.num").forEach((el) => {
    el.addEventListener("blur", () => {
      const n = parseNum(el.value);
      if (n === 0 && el.value.trim() === "") return;
      el.value = formatInt(n);
    });
    el.addEventListener("focus", () => {
      const n = parseNum(el.value);
      el.value = n === 0 ? "" : String(n);
    });
  });
}

/* ============================================================
   Last verified — fetched from last-checked.json
   ============================================================ */
async function loadLastVerified() {
  const el = document.getElementById("lastVerifiedDate");
  if (!el) return;
  try {
    const res = await fetch("last-checked.json", { cache: "no-cache" });
    if (!res.ok) throw new Error("no file");
    const data = await res.json();
    if (data.date) {
      // format YYYY-MM-DD → DD.MM.YYYY
      const [y, m, d] = data.date.split("-");
      el.textContent = `Vérifié ${d}.${m}.${y}`;
    }
    if (data.status === "changes_detected") {
      const badge = document.getElementById("lastVerifiedBadge");
      if (badge) {
        badge.style.background = "var(--warn-soft)";
        badge.style.color = "var(--warn)";
        badge.style.borderColor = "#e9d6a2";
        badge.querySelector(".check-dot").style.background = "var(--warn)";
        badge.title = "Changement détecté sur une source officielle — voir les issues GitHub";
      }
    }
  } catch {
    el.textContent = "Sources à vérifier";
  }
}

/* ============================================================
   Contact — modale + envoi Web3Forms
   ============================================================ */
function initContactForm() {
  const modal = document.getElementById("contactModal");
  const openBtn = document.getElementById("ctaOpen");
  const closeBtn = document.getElementById("modalClose");
  const form = document.getElementById("contactForm");
  const statusEl = document.getElementById("cfStatus");
  const submitBtn = document.getElementById("cfSubmit");
  const keyInput = document.getElementById("web3formsKey");
  if (!modal || !openBtn || !form) return;

  keyInput.value = WEB3FORMS_KEY;

  let lastFocus = null;
  const onKey = (e) => { if (e.key === "Escape") close(); };
  function open() {
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    setTimeout(() => document.getElementById("cfName") && document.getElementById("cfName").focus(), 40);
    document.addEventListener("keydown", onKey);
  }
  function close() {
    modal.hidden = true;
    document.body.style.overflow = "";
    document.removeEventListener("keydown", onKey);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function setStatus(type, msg) {
    statusEl.className = "cf-status" + (type ? " show " + type : "");
    statusEl.textContent = msg || "";
  }

  openBtn.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  modal.addEventListener("click", (e) => { if (e.target === modal) close(); });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (form.botcheck && form.botcheck.checked) return; // honeypot
    if (!form.checkValidity()) { form.reportValidity(); return; }

    if (!WEB3FORMS_KEY || WEB3FORMS_KEY.indexOf("REMPLACER") === 0) {
      setStatus("err", "Formulaire en cours d'activation — merci de réessayer prochainement.");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Envoi…";
    setStatus("", "");
    try {
      const payload = Object.fromEntries(new FormData(form).entries());
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        form.reset();
        setStatus("ok", "Merci ! Votre demande a bien été envoyée. Notre expert vous recontacte sous 48 h.");
      } else {
        setStatus("err", "Une erreur est survenue. Réessayez ou contactez-nous directement.");
      }
    } catch {
      setStatus("err", "Connexion impossible. Vérifiez votre réseau et réessayez.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Envoyer ma demande";
    }
  });
}

/* ============================================================
   Expert info + récapitulatif PDF
   ============================================================ */
function applyExpertInfo() {
  $$("[data-expert-name]").forEach((el) => { el.textContent = EXPERT.name; });
  $$("[data-expert-role]").forEach((el) => { el.textContent = EXPERT.role; });
}

function dateFrToday() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`;
}

function buildPdfReport(d, r) {
  const el = document.getElementById("pdfReport");
  if (!el) return;
  const hasData = r.igi != null;
  const contactBits = [EXPERT.role, EXPERT.phone, EXPERT.email].filter(Boolean).join("  ·  ");

  const estim = hasData ? `
    <table class="pdfr-table">
      <tr><td>Prix de vente</td><td class="num">${formatMoney(d.prixVente)} CHF</td></tr>
      <tr><td>(−) Prix d'acquisition retenu</td><td class="num">${formatMoney(r.prixRetenu)} CHF</td></tr>
      <tr><td>(−) Frais d'acquisition</td><td class="num">${formatMoney(r.totalAcq)} CHF</td></tr>
      <tr><td>(−) Travaux de plus-value</td><td class="num">${formatMoney(r.totalTravaux)} CHF</td></tr>
      <tr><td>(−) Frais de vente</td><td class="num">${formatMoney(r.totalVente)} CHF</td></tr>
      <tr class="total"><td>Gain immobilier brut</td><td class="num">${formatMoney(r.gainBrut)} CHF</td></tr>
      <tr><td>(−) Franchise légale</td><td class="num">${formatMoney(FRANCHISE)} CHF</td></tr>
      <tr class="total"><td>Gain imposable net</td><td class="num">${formatMoney(r.gainNet)} CHF</td></tr>
      <tr><td>Durée fiscale pondérée</td><td class="num">${r.dureePonderee} ans</td></tr>
      <tr><td>Taux IGI applicable</td><td class="num">${formatPct(r.taux)}</td></tr>
      <tr class="result"><td>IGI estimé</td><td class="num">${formatMoney(r.igi)} CHF</td></tr>
    </table>`
    : `<p class="pdfr-empty">Renseignez le calculateur (prix et dates) pour faire figurer ici votre estimation personnalisée.</p>`;

  el.innerHTML = `<div class="pdfr">
    <header class="pdfr-head">
      <div class="pdfr-brand">
        <div class="pdfr-logo">IGI</div>
        <div>
          <div class="pdfr-title">Récapitulatif — Impôt sur le gain immobilier</div>
          <div class="pdfr-sub">Canton de Vaud · barème au 01.01.2026</div>
        </div>
      </div>
      <div class="pdfr-meta">
        <div>Établi le ${dateFrToday()}</div>
        <div class="pdfr-expert">${EXPERT.name}</div>
        <div>${EXPERT.role}</div>
      </div>
    </header>

    <h2>Votre estimation</h2>
    ${estim}

    <h2>Comment fonctionne l'IGI&nbsp;?</h2>
    <div class="pdfr-edu">
      <ul>
        <li><strong>Taux dégressif :</strong> de 30&nbsp;% (détention &lt; 1 an) à 7&nbsp;% (dès 24 ans). Plus la détention est longue, plus l'impôt baisse (art. 72 LI).</li>
        <li><strong>Résidence principale :</strong> les années d'occupation principale prouvée comptent double dans la durée fiscale (art. 72 al. 4 LI).</li>
        <li><strong>Franchise :</strong> un gain inférieur ou égal à 5&nbsp;000 CHF est exonéré (art. 62 let. b LI).</li>
        <li><strong>Déductible du gain :</strong> frais d'acquisition (droits de mutation 3,3&nbsp;%, notaire et registre foncier), travaux de plus-value (art. 70 LI) et frais de vente.</li>
        <li><strong>Report d'imposition :</strong> possible en cas de remploi dans une résidence principale en Suisse (art. 65 LI).</li>
      </ul>
    </div>

    <footer class="pdfr-foot">
      <div class="pdfr-cta">Pour une estimation personnalisée et confidentielle de votre bien, contactez ${EXPERT.name}.</div>
      ${contactBits ? `<div class="pdfr-contact">${contactBits}</div>` : ""}
      <div class="pdfr-disclaimer">Document d'information à usage pédagogique, sans valeur contractuelle ni fiscale. Estimation indicative selon les règles en vigueur au 01.01.2026 (LI Vaud art. 70 et 72, LMSD art. 10-11). Pour tout calcul définitif, consultez un notaire vaudois ou l'Administration cantonale des impôts (ACI).</div>
    </footer>
  </div>`;
}

/* ============================================================
   Init
   ============================================================ */
function init() {
  renderBareme();
  buildHero();
  initGuide();
  initTabs();
  initContactForm();
  applyExpertInfo();
  attachNumericFormatting();
  loadLastVerified();

  // PDF récap (impression / enregistrement navigateur)
  const pdfBtn = document.getElementById("pdfBtn");
  if (pdfBtn) pdfBtn.addEventListener("click", () => window.print());

  // hero replay button
  const replay = document.getElementById("heroReplay");
  if (replay) replay.addEventListener("click", runHeroIntro);

  // occupation buttons
  $$(".occ-btn").forEach((b) => b.addEventListener("click", () => {
    state.occupation = Number(b.dataset.occ);
    render();
  }));

  // slider — live update on input
  const slider = document.getElementById("ansSlider");
  if (slider) slider.addEventListener("input", render);

  // input listeners
  $$("[data-input]").forEach((el) => {
    el.addEventListener("input", render);
    el.addEventListener("change", render);
  });

  // reset
  $("#resetBtn").addEventListener("click", () => {
    $$("[data-input]").forEach((el) => { el.value = el.type === "range" ? 0 : ""; });
    state.occupation = 1;
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    render();
  });

  loadState();
  render();

  // play the timeline animation once on load
  runHeroIntro();
}

document.addEventListener("DOMContentLoaded", init);
