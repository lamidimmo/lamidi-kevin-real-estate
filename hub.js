/* =============================================================================
   hub.js — Diaporama cinématique du hub : fond plein écran avec les photos
   des biens (effet Ken Burns + fondus lents). Source : data/biens.json.
   ============================================================================= */
(function () {
  'use strict';

  var HOLD = 6200;     // durée d'affichage par image (ms)
  var MAX = 8;         // nombre d'images dans la boucle
  var i = 0, slides = [], timer = null;

  function build(urls) {
    var bg = document.getElementById('cineBg');
    if (!bg || !urls.length) return;
    urls.forEach(function (u, k) {
      var d = document.createElement('div');
      d.className = 'cine-slide';
      d.style.backgroundImage = 'url("' + u + '")';
      if (k === 0) d.classList.add('is-active');
      bg.appendChild(d);
      slides.push(d);
    });
    if (slides.length > 1 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // précharge la 2e avant de lancer la boucle
      preload(urls[1]);
      timer = setInterval(next, HOLD);
    }
  }

  function preload(u) { var im = new Image(); im.src = u; }

  function next() {
    var prev = slides[i];
    i = (i + 1) % slides.length;
    slides.forEach(function (s) { s.classList.remove('is-active'); });
    slides[i].classList.add('is-active');
    if (prev) prev.classList.remove('is-active');
    preload(slides[(i + 1) % slides.length].style.backgroundImage.slice(5, -2));
  }

  function collect(data) {
    var urls = [];
    var pool = (data.forSale || []).concat(data.sold || []);
    // une image de couverture par bien, puis on complète si besoin
    pool.forEach(function (b) { if (b.images && b.images[0]) urls.push(b.images[0]); });
    pool.forEach(function (b) { if (b.images && b.images[1] && urls.length < MAX) urls.push(b.images[1]); });
    return urls.slice(0, MAX);
  }

  fetch('data/biens.json', { cache: 'no-cache' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) { if (d) build(collect(d)); })
    .catch(function () { /* fond dégradé par défaut conservé */ });
})();
