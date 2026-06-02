/* =============================================================================
   biens.js — Rendu de la vitrine "Mes biens" depuis data/biens.json.
   Trilingue (re-rendu sur l'evenement i18n:change). Fiche detaillee avec
   carrousel photos, carte discrete (commune) et CTA contact pre-rempli.
   ============================================================================= */
(function () {
  'use strict';

  var DATA = null;
  var EMAIL = 'kevin.lamidi@swsir.ch';
  var current = null; // bien ouvert dans la fiche
  var idx = 0;        // index image courante

  function L() { return document.documentElement.getAttribute('lang') || 'fr'; }
  function T(k) { return window.I18N ? window.I18N.t(k) : k; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function num(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '’'); } // 1’345’000
  function title(b) {
    var t = b.title || {};
    return t[L()] || t.fr || t.en || (Object.keys(t).length ? t[Object.keys(t)[0]] : '');
  }
  function descParas(b) {
    var d = b.desc || {};
    return d[L()] || d.fr || d.en || [];
  }
  function typeLabel(b) {
    var k = 'type.' + b.type;
    var v = T(k);
    return v === k ? (b.type || '') : v;
  }
  function priceStr(b) {
    if (b.status === 'sold') return T('b.sold');
    if (!b.price) return T('b.onRequest');
    return num(b.price.amount) + ' ' + (b.price.currency || 'CHF');
  }
  function place(b) {
    return [b.commune, b.region].filter(Boolean).join(', ');
  }
  function img(url, w) {
    return url; // images servies par le CDN, deja optimisees
  }

  /* ---------- pastilles de caracteristiques ---------- */
  function specs(b) {
    var out = [];
    if (b.rooms) out.push(num0(b.rooms) + ' ' + T('b.rooms'));
    if (b.surfaces && b.surfaces.living) out.push(num(b.surfaces.living) + ' m² ' + T('b.living'));
    if (b.surfaces && b.surfaces.land) out.push(num(b.surfaces.land) + ' m² ' + T('b.land'));
    return out;
  }
  function num0(n) { return (Math.round(n * 10) / 10).toString().replace('.', ','); }

  /* ---------- carte d'un bien ---------- */
  function cardHTML(b, i) {
    var cover = (b.images && b.images[0]) || '';
    var sold = b.status === 'sold';
    return '' +
      '<article class="bien-card' + (sold ? ' is-sold' : '') + '" data-i="' + i + '" data-status="' + b.status + '" tabindex="0" role="button" aria-label="' + esc(title(b)) + '">' +
        '<div class="bien-cover">' +
          (cover ? '<img loading="lazy" src="' + esc(cover) + '" alt="' + esc(title(b)) + '">' : '<div class="bien-noimg"></div>') +
          '<span class="bien-type">' + esc(typeLabel(b)) + '</span>' +
          (sold ? '<span class="bien-badge-sold">' + esc(T('b.sold')) + '</span>' : '') +
        '</div>' +
        '<div class="bien-info">' +
          '<div class="bien-place">' + esc(place(b)) + '</div>' +
          '<h3 class="bien-title">' + esc(title(b)) + '</h3>' +
          '<div class="bien-specs">' + specs(b).map(function (s) { return '<span>' + esc(s) + '</span>'; }).join('<i></i>') + '</div>' +
          '<div class="bien-foot">' +
            '<span class="bien-price">' + esc(priceStr(b)) + '</span>' +
            '<span class="bien-view">' + esc(T('b.view')) + ' →</span>' +
          '</div>' +
        '</div>' +
      '</article>';
  }

  /* ---------- rendu des grilles ---------- */
  function render() {
    var app = document.getElementById('biens-app');
    if (!app || !DATA) return;
    var sale = DATA.forSale || [], sold = DATA.sold || [];

    var html = '';
    if (!sale.length && !sold.length) {
      html = '<p class="biens-empty">' + esc(T('biens.empty')) + '</p>';
    } else {
      if (sale.length) {
        html += '<h2 class="biens-section-title">' + esc(T('biens.forSale')) + '</h2>';
        html += '<div class="biens-grid">' + sale.map(function (b, i) { return cardHTML(b, i); }).join('') + '</div>';
      }
      if (sold.length) {
        html += '<div class="biens-sold-head"><h2 class="biens-section-title">' + esc(T('biens.sold')) + '</h2>' +
                '<p class="biens-section-sub">' + esc(T('biens.soldSub')) + '</p></div>';
        html += '<div class="biens-grid">' + sold.map(function (b, i) { return cardHTML(b, sale.length + i); }).join('') + '</div>';
      }
    }
    app.innerHTML = html;

    var all = sale.concat(sold);
    app.querySelectorAll('.bien-card').forEach(function (el) {
      var open = function () { openDetail(all[+el.getAttribute('data-i')]); };
      el.addEventListener('click', open);
      el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    });

    var upd = document.getElementById('biens-updated');
    if (upd) upd.textContent = DATA.updatedAt ? (T('biens.updated') + ' : ' + DATA.updatedAt) : '';

    if (current) renderDetail(); // garder la fiche a jour sur changement de langue
  }

  /* ---------- fiche detaillee (overlay) ---------- */
  function ensureOverlay() {
    var ov = document.getElementById('bien-overlay');
    if (ov) return ov;
    ov = document.createElement('div');
    ov.id = 'bien-overlay';
    ov.className = 'bien-overlay';
    ov.hidden = true;
    ov.innerHTML = '<div class="bien-modal" role="dialog" aria-modal="true">' +
      '<button class="bien-close" type="button" aria-label="Fermer">&times;</button>' +
      '<div class="bien-modal-body"></div></div>';
    document.body.appendChild(ov);
    ov.addEventListener('click', function (e) { if (e.target === ov) closeDetail(); });
    ov.querySelector('.bien-close').addEventListener('click', closeDetail);
    document.addEventListener('keydown', function (e) {
      if (ov.hidden) return;
      if (e.key === 'Escape') closeDetail();
      else if (e.key === 'ArrowRight') step(1);
      else if (e.key === 'ArrowLeft') step(-1);
    });
    return ov;
  }

  function mapEmbed(b) {
    if (typeof b.lat !== 'number' || typeof b.lon !== 'number') return '';
    var dLon = 0.035, dLat = 0.022; // zone large, sans marqueur exact (discretion)
    var bbox = [b.lon - dLon, b.lat - dLat, b.lon + dLon, b.lat + dLat].join(',');
    var src = 'https://www.openstreetmap.org/export/embed.html?bbox=' + encodeURIComponent(bbox) + '&layer=mapnik';
    return '<div class="bien-map"><div class="bien-map-label">' + esc(T('b.situation')) + ' · ' + esc(place(b)) + '</div>' +
           '<iframe loading="lazy" title="' + esc(place(b)) + '" src="' + src + '"></iframe></div>';
  }

  function factRow(label, val) {
    return val ? '<div class="bf"><dt>' + esc(label) + '</dt><dd>' + esc(val) + '</dd></div>' : '';
  }

  function renderDetail() {
    var b = current; if (!b) return;
    var ov = ensureOverlay();
    var imgs = b.images || [];
    if (idx >= imgs.length) idx = 0;
    var s = b.surfaces || {};
    var subject = encodeURIComponent('Bien ' + (b.ref ? '#' + b.ref + ' ' : '') + '– ' + place(b));
    var dp = descParas(b);
    var facts = [
      factRow(T('b.rooms'), b.rooms ? num0(b.rooms) : ''),
      factRow(T('b.bed'), b.bedrooms),
      factRow(T('b.bath'), b.bathrooms),
      factRow(T('b.living'), s.living ? num(s.living) + ' m²' : ''),
      factRow(T('b.land'), s.land ? num(s.land) + ' m²' : ''),
      factRow(T('b.built'), b.buildingYear),
      factRow(T('b.renovated'), b.renovationYear)
    ].join('');
    var body = '' +
      '<div class="bien-gallery' + (imgs.length ? '' : ' is-empty') + '">' +
        (imgs.length ? '<img class="bg-main" src="' + esc(imgs[idx]) + '" alt="' + esc(title(b)) + '">' : '<div class="bien-noimg"></div>') +
        (imgs.length > 1 ? '<button class="bg-nav prev" aria-label="Préc.">‹</button><button class="bg-nav next" aria-label="Suiv.">›</button>' +
          '<div class="bg-count">' + (idx + 1) + ' / ' + imgs.length + '</div>' : '') +
        '<div class="bg-caption">' +
          '<div class="bg-cap-place">' + esc(place(b)) + (b.ref ? ' · ' + esc(T('b.ref')) + ' ' + esc(b.ref) : '') + '</div>' +
          '<h2 class="bg-cap-title">' + esc(title(b)) + '</h2>' +
          '<div class="bg-cap-price">' + esc(priceStr(b)) + '</div>' +
        '</div>' +
      '</div>' +
      (imgs.length > 1 ? '<div class="bg-thumbs">' + imgs.map(function (u, i) {
          return '<button class="bg-thumb' + (i === idx ? ' on' : '') + '" data-t="' + i + '"><img loading="lazy" src="' + esc(u) + '" alt=""></button>';
        }).join('') + '</div>' : '') +
      '<div class="bien-detail">' +
        (facts ? '<dl class="bd-facts">' + facts + '</dl>' : '') +
        (dp.length ? '<div class="bd-desc">' + dp.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') + '</div>' : '') +
        mapEmbed(b) +
        '<div class="bd-contact">' +
          '<div><div class="bd-contact-title">' + esc(T('b.contactTitle')) + '</div>' +
          '<div class="bd-contact-sub">' + esc(T('b.contactSub')) + '</div></div>' +
          '<a class="btn-gold" href="mailto:' + EMAIL + '?subject=' + subject + '">' + esc(T('nav.contact')) + '</a>' +
        '</div>' +
      '</div>';
    ov.querySelector('.bien-modal-body').innerHTML = body;
    ov.querySelector('.bien-close').setAttribute('aria-label', T('b.close'));

    var g = ov.querySelector('.bien-gallery');
    if (g) {
      var p = g.querySelector('.prev'), n = g.querySelector('.next');
      if (p) p.addEventListener('click', function () { step(-1); });
      if (n) n.addEventListener('click', function () { step(1); });
    }
    ov.querySelectorAll('.bg-thumb').forEach(function (t) {
      t.addEventListener('click', function () { idx = +t.getAttribute('data-t'); renderDetail(); });
    });
  }

  function step(d) {
    var imgs = (current && current.images) || [];
    if (imgs.length < 2) return;
    idx = (idx + d + imgs.length) % imgs.length;
    renderDetail();
  }

  function openDetail(b) {
    current = b; idx = 0;
    var ov = ensureOverlay();
    renderDetail();
    ov.hidden = false;
    document.body.style.overflow = 'hidden';
  }
  function closeDetail() {
    var ov = document.getElementById('bien-overlay');
    if (ov) ov.hidden = true;
    current = null;
    document.body.style.overflow = '';
  }

  /* ---------- init ---------- */
  function init() {
    fetch('data/biens.json', { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (d) { DATA = d; render(); })
      .catch(function (e) {
        var app = document.getElementById('biens-app');
        if (app) app.innerHTML = '<p class="biens-empty">' + esc(T('biens.empty')) + '</p>';
        console.warn('biens.json indisponible:', e.message);
      });
    window.addEventListener('i18n:change', render);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
