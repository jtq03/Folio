/* Folio patient app: personality layer for Home, Levels, the Folio card and stickers.
   Runs after app.js. It never re-renders anything: it decorates the page app.js rendered.
   app.js patches pages in place with a DOM morph, which strips anything it did not render.
   So every decoration here is idempotent, its state lives in JS, and it is re-applied
   synchronously from a MutationObserver (a microtask, so before the next paint, no flicker).
   Entrance motion only runs on real navigation (app.js adds .anim to a new page) or on a
   real state change (level, skill, visit date, new sticker). Reduced motion gets fades. */
(function (F) {
  'use strict';
  if (!F || !F.Store || !F.UI) return;
  var U = F.UI, S = F.Store, sel = S.sel;
  var PKEY = 'folio.app.pid';

  /* ---------- Small helpers (all fail soft) ---------- */
  function nat() { return F.native || {}; }
  function haptic(k) { try { if (nat().haptic) nat().haptic(k); } catch (e) {} }
  function reduced() {
    try { if (nat().reduced) return nat().reduced(); return matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'reduce'; } catch (e) { return false; }
  }
  function pid() { try { var v = localStorage.getItem(PKEY); if (v && sel.patient(v)) return v; } catch (e) {} var ps = S.get().patients; return sel.patient('p1') ? 'p1' : (ps[0] && ps[0].id); }
  function me() { try { return sel.patient(pid()); } catch (e) { return null; } }
  function lsGet(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function page() { return document.getElementById('main'); }
  function overlayOpen() { var h = document.querySelector('.ios-lvhost'); return !!(h && h.firstElementChild); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function hash(s) { var x = 2166136261; for (var i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619); } return x >>> 0; }
  function today() { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function ownCount(p) { return F.SKILLS.filter(function (s) { return p.skills[s.id] === 'own'; }).length; }
  function toast(m, star) { try { U.toast(m, star); } catch (e) {} }
  function animate(el, kf, o) { try { if (el.animate) return el.animate(kf, o); } catch (e) {} return null; }
  function done(a, ms) { return a && a.finished ? a.finished.catch(function () {}) : new Promise(function (r) { setTimeout(r, ms || 0); }); }

  /* ---------- FX layer: outside #app so the morph never touches it ---------- */
  var fx = null;
  function fxLayer() {
    if (fx && fx.isConnected) return fx;
    fx = document.createElement('div'); fx.className = 'fa-fx'; fx.setAttribute('aria-hidden', 'true');
    (document.getElementById('device') || document.body).appendChild(fx); return fx;
  }
  var PAPER = ['#395B50', '#92AFD7', '#C5D1EB', '#F0DCC0', '#D8E3D2', '#1F2F16', '#E9DCC3'];
  /* Paper confetti. opts: n, spread, up, star (adds one tiny red star) */
  function confetti(x, y, o) {
    if (reduced()) return; o = o || {};
    var L = fxLayer(), n = o.n || 14, spread = o.spread || 90, up = o.up == null ? 70 : o.up;
    for (var i = 0; i < n; i++) {
      var b = document.createElement('i'), w = 5 + Math.random() * 5, isStar = o.star && i === 0;
      b.className = 'fa-bit' + (isStar ? ' st' : '');
      if (isStar) b.innerHTML = U.star(12).s;
      else { b.style.width = w + 'px'; b.style.height = (w * (Math.random() < .5 ? 1.7 : 1)) + 'px'; b.style.background = PAPER[i % PAPER.length]; if (Math.random() < .3) b.style.borderRadius = '50%'; }
      b.style.left = x + 'px'; b.style.top = y + 'px'; L.appendChild(b);
      var ang = (o.dir == null ? -Math.PI / 2 : o.dir) + (Math.random() - .5) * (o.cone || 2.4), dist = spread * (.45 + Math.random() * .7);
      var dx = Math.cos(ang) * dist, dy = Math.sin(ang) * dist - up * Math.random() * .4, rot = (Math.random() - .5) * 720;
      var a = animate(b, [
        { transform: 'translate(-50%,-50%) translate(0,0) rotate(0deg) scale(.6)', opacity: 1 },
        { transform: 'translate(-50%,-50%) translate(' + dx + 'px,' + dy + 'px) rotate(' + rot * .6 + 'deg) scale(1)', opacity: 1, offset: .45 },
        { transform: 'translate(-50%,-50%) translate(' + dx * 1.15 + 'px,' + (dy + 60 + Math.random() * 50) + 'px) rotate(' + rot + 'deg) scale(.9)', opacity: 0 }
      ], { duration: 850 + Math.random() * 450, easing: 'cubic-bezier(.2,.7,.4,1)', fill: 'forwards' });
      (function (el) { done(a, 1300).then(function () { el.remove(); }); })(b);
    }
  }
  function centerOf(el) { var r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, r: r }; }

  /* =====================================================================
     1. Greeting: time of day and progress aware, stable for the whole day
     ===================================================================== */
  var GREET = {
    morning: ['Morning, {n}', 'Good morning, {n}', 'Up and at it, {n}'],
    afternoon: ['Afternoon, {n}', 'Hey {n}', 'Good to see you, {n}'],
    evening: ['Evening, {n}', 'Hey {n}', 'Good evening, {n}'],
    night: ['Still up, {n}?', 'Late one, {n}?', 'Hi {n}'],
    any: ['Welcome back, {n}', 'Hey there, {n}', 'Look who it is, {n}'],
    near: ['Nearly there, {n}', 'So close, {n}', 'On a roll, {n}'],
    top: ['Top of the stairs, {n}', 'You did it, {n}']
  };
  function greeting(p) {
    var hr = new Date().getHours(), tod = hr < 5 ? 'night' : hr < 12 ? 'morning' : hr < 17 ? 'afternoon' : hr < 22 ? 'evening' : 'night';
    var own = ownCount(p), pool;
    if (p.transferred || (p.level >= 10 && own === 5)) pool = GREET.top;
    else if (own >= 4 || p.level >= 9) pool = GREET.near.concat(GREET[tod]);
    else pool = GREET[tod].concat(GREET.any);
    return pool[hash(p.id + today() + tod) % pool.length];
  }
  function unreadNote(p) {
    var seen = lsGet('folio.seen.' + p.id, []);
    return (p.notes || []).some(function (n) { return n.role === 'peds' && seen.indexOf(n.id) < 0; });
  }
  function visitDays(p) {
    var v = p.nextVisit; if (!v || !v.iso) return null; var d = new Date(v.iso); if (isNaN(d.getTime()) || d.getTime() < Date.now()) return null;
    var n = new Date(); return Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - new Date(n.getFullYear(), n.getMonth(), n.getDate())) / 864e5);
  }
  function subline(p) {
    var own = ownCount(p), vd = visitDays(p), help = F.SKILLS.some(function (s) { return p.skills[s.id] === 'help'; });
    if (p.transferred) return 'You made it to adult care. That took real work.';
    if (unreadNote(p)) return 'Your care team left you a new note.';
    if (vd === 0) return 'Visit day. You have got this.';
    if (vd === 1) return 'Visit tomorrow. Got your questions ready?';
    if (vd != null && vd <= 3) return 'Next visit in ' + vd + ' days. You are ready for it.';
    if (own === 5) return 'All five skills on your own. Time to get signed off.';
    if (own >= 3) return own + ' skills on your own. That is real progress.';
    if (own > 0) return own + ' on your own already. Keep it going.';
    if (help) return 'Keep practising. It all adds up.';
    return 'You are building your own health team.';
  }
  function applyGreeting(pg, p) {
    var h1 = pg.querySelector('.ios-large h1'), sub = pg.querySelector('.ios-large .ios-sub'); if (!h1) return;
    var nm = F.nickname ? F.nickname(p) : p.first;
    var g = greeting(p), parts = g.split('{n}'), want = parts[0] + nm + (parts[1] || '');
    if (h1.textContent !== want || !h1.querySelector('em')) {
      while (h1.firstChild) h1.removeChild(h1.firstChild);
      h1.appendChild(document.createTextNode(parts[0]));
      var em = document.createElement('em'); em.textContent = nm; h1.appendChild(em);
      if (parts[1]) h1.appendChild(document.createTextNode(parts[1]));
    }
    var s = subline(p); if (sub && sub.textContent !== s) sub.textContent = s;
    var nt = document.querySelector('.ios-nav-t'), plain = want;
    if (nt && nt.textContent === 'Hi ' + nm) nt.textContent = plain;
  }

  /* =====================================================================
     2. Staircase: twinkle (CSS), hop on level change, tap a step for a tip
     ===================================================================== */
  function stairsOf(pg) { return pg.querySelector('.ios-stairs, .ios-big-stairs'); }
  var hopping = false;
  function checkLevel(pg, p) {
    var key = 'folio.fun.lvl.' + p.id, prev = lsGet(key, null), st = stairsOf(pg);
    if (prev === null) { lsSet(key, p.level); return; }
    if (prev === p.level || !st || overlayOpen() || hopping) return;
    lsSet(key, p.level);
    var wait = pg.classList.contains('anim') ? 1000 : 120;
    hopping = true;
    setTimeout(function () { hop(st, prev, p.level).then(function () { hopping = false; }, function () { hopping = false; }); }, wait);
  }
  function hop(st, from, to) {
    if (!st.isConnected) return Promise.resolve();
    var steps = st.children, star = st.querySelector('.star');
    if (!star || !steps[from - 1] || !steps[to - 1]) return Promise.resolve();
    if (reduced()) { animate(star, [{ opacity: 0 }, { opacity: 1 }], { duration: 400 }); return Promise.resolve(); }
    var sr = star.getBoundingClientRect(), tr = steps[to - 1].getBoundingClientRect(), off = sr.top - tr.top;
    var pos = function (n) { var r = steps[n - 1].getBoundingClientRect(); return { x: r.left + r.width / 2 - sr.width / 2, y: r.top + off + (n === to ? 0 : 8) }; };
    var ghost = document.createElement('div'); ghost.className = 'fa-ghost'; ghost.innerHTML = U.star(Math.round(sr.width)).s;
    fxLayer().appendChild(ghost); star.style.opacity = '0';
    var dirn = to > from ? 1 : -1, path = [from], big = Math.abs(to - from) > 3;
    if (big) path.push(to); else for (var n = from + dirn; n !== to + dirn; n += dirn) path.push(n);
    var chain = Promise.resolve();
    path.slice(1).forEach(function (n, i) {
      chain = chain.then(function () {
        var a = pos(path[i]), b = pos(n), peak = Math.min(a.y, b.y) - (big ? 60 : 30), mx = (a.x + b.x) / 2;
        var t = function (x, y, sx, sy, r) { return 'translate(' + x + 'px,' + y + 'px) rotate(' + (r || 0) + 'deg) scale(' + sx + ',' + sy + ')'; };
        var an = animate(ghost, [
          { transform: t(a.x, a.y, 1, 1) },
          { transform: t(a.x, a.y + 3, 1.2, .75), offset: .16 },
          { transform: t(mx, peak, .88, 1.18, dirn * 90), offset: .55 },
          { transform: t(b.x, b.y + 2, 1.25, .72, dirn * 180), offset: .86 },
          { transform: t(b.x, b.y, 1, 1, dirn * 180) }
        ], { duration: big ? 720 : 440, easing: 'ease-in-out', fill: 'forwards' });
        return done(an, 500).then(function () {
          var s = steps[n - 1]; if (s) { s.classList.remove('fa-thud'); void s.offsetWidth; s.classList.add('fa-thud'); setTimeout(function () { s.classList.remove('fa-thud'); }, 400); }
          haptic('light');
        });
      });
    });
    return chain.then(function () {
      var c = centerOf(ghost); ghost.remove(); star = st.querySelector('.star') || star; star.style.opacity = '';
      confetti(c.x, c.y, { n: 12, spread: 60, star: false }); haptic('success');
    });
  }
  /* Tap a step: wiggle and a little tab with the level name and what it unlocks */
  var tip = null;
  function closeTip() { if (tip) { var t = tip; tip = null; t.classList.add('out'); setTimeout(function () { t.remove(); }, 180); } }
  function openTip(step) {
    var st = step.parentNode, n = [].indexOf.call(st.children, step) + 1, L = F.LEVELS[n - 1], p = me(); if (!L || !p) return;
    var state = n < p.level ? 'Done' : n === p.level ? 'You are here' : 'Coming up';
    var t = document.createElement('div'); t.className = 'fa-tip'; t.setAttribute('role', 'status');
    t.innerHTML = '<b>Level ' + n + ' · ' + esc(L.name) + '</b><span class="fa-tip-s">' + state + '</span><small>Unlocks: ' + esc(L.unlocks) + '</small><i class="fa-tip-tail"></i>';
    /* Lives in the FX layer so a store update (which morphs the stairs) cannot remove it; closes on scroll */
    fxLayer().appendChild(t);
    var sw = st.getBoundingClientRect(), r = step.getBoundingClientRect(), w = t.offsetWidth, ht = t.offsetHeight, cx = r.left + r.width / 2;
    var left = Math.max(sw.left - 6, Math.min(sw.right - w + 6, cx - w / 2));
    t.style.left = left + 'px'; t.style.top = (r.top - ht - (n === p.level ? 34 : 12)) + 'px';
    t.querySelector('.fa-tip-tail').style.left = (cx - left - 7) + 'px';
    tip = t; t.__step = step;
    step.classList.remove('fa-wig'); void step.offsetWidth; step.classList.add('fa-wig'); setTimeout(function () { step.classList.remove('fa-wig'); }, 520);
    haptic('light');
  }
  document.addEventListener('click', function (e) {
    var step = e.target.closest && e.target.closest('#main .ios-stairs > i, #main .ios-big-stairs > li');
    var same = tip && step && tip.__step === step; closeTip();
    if (step && !same) openTip(step);
  });
  window.addEventListener('hashchange', closeTip);
  document.addEventListener('scroll', function () { if (tip) closeTip(); }, true);

  /* =====================================================================
     3. Folio card: tilt with a moving shine, tap to flip, gentle idle float
     ===================================================================== */
  var flipped = false, cardRig = null, cardKey = '';
  function rigCard(pg, p) {
    var wrap = pg.querySelector('.ios-cardwrap'); if (!wrap) return;
    var front = wrap.querySelector(':scope > .fcard'), key = p.id + '|' + (p.card && p.card.token) + '|' + p.first + p.last + '|' + (p.card && p.card.shape) + (p.card && p.card.status);
    if (!front && cardRig && wrap.contains(cardRig.float)) return; /* already rigged */
    if (!front) return;
    if (!cardRig || cardKey !== key) { cardRig = buildRig(); cardKey = key; }
    var R = cardRig;
    R.ff.innerHTML = ''; R.ff.appendChild(front);
    R.fb.innerHTML = U.cardFace(p, 'back').s;
    R.flip.classList.toggle('on', flipped);
    R.float.classList.toggle('sq', /square/.test(front.className));
    setFlipLabel();
    wrap.appendChild(R.float);
  }
  function setFlipLabel() {
    if (!cardRig) return;
    cardRig.float.setAttribute('aria-label', flipped ? 'Folio card, back with QR code. Tap to flip back' : 'Folio card. Tap to flip and see the back');
    cardRig.ff.setAttribute('aria-hidden', String(flipped)); cardRig.fb.setAttribute('aria-hidden', String(!flipped));
  }
  function buildRig() {
    var float = document.createElement('div'); float.className = 'fa-float'; float.setAttribute('data-key', 'fa-card');
    float.setAttribute('role', 'button'); float.tabIndex = 0;
    float.innerHTML = '<div class="fa-tilt"><div class="fa-flip"><div class="fa-face fa-ff"></div><div class="fa-face fa-fb"></div></div><span class="fa-shine"></span></div>';
    var R = { float: float, tilt: float.querySelector('.fa-tilt'), flip: float.querySelector('.fa-flip'), ff: float.querySelector('.fa-ff'), fb: float.querySelector('.fa-fb') };
    var start = null, moved = 0;
    function setTilt(e) {
      var r = R.tilt.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      x = Math.max(0, Math.min(1, x)); y = Math.max(0, Math.min(1, y));
      var k = reduced() ? 0 : 1;
      R.tilt.style.setProperty('--rx', ((.5 - y) * 16 * k).toFixed(2) + 'deg');
      R.tilt.style.setProperty('--ry', ((x - .5) * 20 * k).toFixed(2) + 'deg');
      R.tilt.style.setProperty('--mx', (x * 100).toFixed(1) + '%'); R.tilt.style.setProperty('--my', (y * 100).toFixed(1) + '%');
    }
    function release() { start = null; R.tilt.classList.remove('live'); R.tilt.style.setProperty('--rx', '0deg'); R.tilt.style.setProperty('--ry', '0deg'); }
    float.addEventListener('pointerdown', function (e) { start = { x: e.clientX, y: e.clientY }; moved = 0; R.tilt.classList.add('live'); setTilt(e); });
    float.addEventListener('pointermove', function (e) {
      if (start) moved = Math.max(moved, Math.abs(e.clientX - start.x) + Math.abs(e.clientY - start.y));
      if (start || e.pointerType === 'mouse') { R.tilt.classList.add('live'); setTilt(e); }
    });
    float.addEventListener('pointerup', release); float.addEventListener('pointercancel', release);
    float.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') release(); });
    float.addEventListener('click', function () { if (moved > 12) { moved = 0; return; } flipCard(); });
    float.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flipCard(); } });
    return R;
  }
  function flipCard() {
    if (!cardRig) return; flipped = !flipped; cardRig.flip.classList.toggle('on', flipped); setFlipLabel(); haptic('light');
    if (!reduced()) { var t = cardRig.tilt; t.classList.remove('fa-boing'); void t.offsetWidth; t.classList.add('fa-boing'); setTimeout(function () { t.classList.remove('fa-boing'); }, 700); }
  }
  window.addEventListener('hashchange', function () { flipped = false; });

  /* =====================================================================
     4. Practise: squish (CSS), status flip with a self-drawing check, confetti, varied praise
     ===================================================================== */
  var PRAISE = ['Nice. {s} moved up to With help.', 'Look at you. {s} is now With help.', 'That counts. {s} moved to With help.',
    'Progress. {s} is With help now.', 'Another step. Your team will see {s} moved up.', 'Good work. {s} is now With help.'];
  var praiseI = Math.floor(Math.random() * PRAISE.length);
  function wrapPractise() {
    var orig = F.actions && F.actions.practise; if (!orig || orig.__fa) return;
    var fn = function (el, e) {
      var p = me(), before = p ? JSON.parse(JSON.stringify(p.skills)) : {}, box = el && el.getBoundingClientRect ? el.getBoundingClientRect() : null;
      var caught = null, real = U.toast;
      U.toast = function (m, s) { caught = [m, s]; };
      try { orig(el, e); } finally { U.toast = real; }
      var after = me(), sk = null;
      if (after) F.SKILLS.forEach(function (s) { if (!sk && before[s.id] !== after.skills[s.id]) sk = s; });
      if (!sk) { if (caught) toast(caught[0], caught[1]); return; }
      toast(PRAISE[praiseI++ % PRAISE.length].replace('{s}', sk.name));
      if (box && box.width && !reduced()) confetti(box.left + box.width / 2, box.top + 6, { n: 18, spread: 110 });
      if (el && el.classList && !reduced()) { el.classList.remove('fa-pop'); void el.offsetWidth; el.classList.add('fa-pop'); }
      var row = document.querySelector('#main [data-key="sk-' + sk.id + '"]');
      if (row) celebrateRow(row);
    };
    fn.__fa = true; F.actions.practise = fn;
  }
  function celebrateRow(row) {
    var st = row.querySelector('.ios-st'); if (!st) return;
    st.classList.remove('fa-flipin'); void st.offsetWidth; st.classList.add('fa-flipin');
    var tick = document.createElement('span'); tick.className = 'fa-tick'; tick.setAttribute('aria-hidden', 'true');
    tick.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path pathLength="1" d="M5 12.5l4.500 4.500L19 7.500"/></svg>';
    st.appendChild(tick);
    row.classList.add('fa-glow');
    setTimeout(function () { tick.remove(); st.classList.remove('fa-flipin'); row.classList.remove('fa-glow'); }, 2400);
  }

  /* =====================================================================
     5. Sticker book: derived from state, peel-and-slap when a new one is earned
     ===================================================================== */
  var G = {
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    book: '<path d="M4 5.500A1.500 1.500 0 0 1 5.500 4H12v16H5.500A1.500 1.500 0 0 1 4 18.500zM12 4h6.500A1.500 1.500 0 0 1 20 5.500v13a1.500 1.500 0 0 1-1.500 1.500H12z"/>',
    chart: '<path d="M4 20h16M5 15.500l4-5 4 3 6-7"/><circle cx="19" cy="6.500" r="1.400"/>',
    cal: '<rect x="4" y="5" width="16" height="15" rx="2.500"/><path d="M4 10h16M8 3v4M16 3v4M9 15l2 2 4-4"/>',
    pair: '<circle cx="9" cy="12" r="5.500"/><circle cx="15" cy="12" r="5.500"/>',
    key: '<circle cx="8" cy="12" r="4"/><path d="M12 12h9M18 12v3.500M21 12v2.500"/>',
    flag: '<path d="M5 21V4h11l-2 4 2 4H5"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="M15.500 8.500l-2 5-5 2 2-5z"/>',
    map: '<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v14M15 6v14"/>',
    heart: '<path d="M12 20s-7-4.400-7-10a4 4 0 0 1 7-2.500A4 4 0 0 1 19 10c0 5.600-7 10-7 10z"/>',
    clock: '<circle cx="12" cy="12" r="8.500"/><path d="M12 7.500V12l3 2"/>',
    chat: '<path d="M4 6.500A2.500 2.500 0 0 1 6.500 4h11A2.500 2.500 0 0 1 20 6.500v7a2.500 2.500 0 0 1-2.500 2.500H10l-4.500 4v-4A1.500 1.500 0 0 1 4 14.500z"/><path d="M8.500 10h7"/>',
    stairs: '<path d="M3 20.500V16h5v-4.500h5V7h5V3.500h3v17z"/>',
    people: '<circle cx="9" cy="9" r="3.200"/><circle cx="16.500" cy="10" r="2.600"/><path d="M3.500 19c0-3.200 2.500-5 5.500-5s5.500 1.800 5.500 5M14 14.600c3.200-.6 6.500.8 6.500 4.400"/>'
  };
  function scallop() { var d = '', n = 14; for (var i = 0; i <= n * 2; i++) { var a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2, r = i % 2 ? 24.5 : 28; d += (i ? 'L' : 'M') + (32 + Math.cos(a) * r).toFixed(1) + ' ' + (32 + Math.sin(a) * r).toFixed(1); } return d + 'Z'; }
  var SHAPES = {
    circle: '<circle cx="32" cy="32" r="26"/>',
    square: '<rect x="8" y="8" width="48" height="48" rx="13"/>',
    hex: '<path d="M32 5l23.400 13.500v27L32 59 8.600 45.500v-27z"/>',
    badge: '<path d="' + scallop() + '"/>',
    shield: '<path d="M32 6l22 8v15c0 14-9.500 22-22 27C19.500 51 10 43 10 29V14z"/>',
    ticket: '<path d="M8 16a4 4 0 0 1 4-4h40a4 4 0 0 1 4 4v8a6 6 0 0 0 0 16v8a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4v-8a6 6 0 0 0 0-16z"/>'
  };
  /* 15 stickers: one for each level passed, one for each skill done on your own */
  var STICKERS = [
    { id: 'lv1', lv: 1, name: 'Observer', g: 'eye', s: 'circle', c: '#C5D1EB', hint: 'Pass Level 1' },
    { id: 'lv2', lv: 2, name: 'Learner', g: 'book', s: 'square', c: '#F0DCC0', hint: 'Pass Level 2' },
    { id: 'lv3', lv: 3, name: 'Participant', g: 'chart', s: 'hex', c: '#D8E3D2', hint: 'Pass Level 3' },
    { id: 'lv4', lv: 4, name: 'Contributor', g: 'cal', s: 'ticket', c: '#92AFD7', hint: 'Pass Level 4' },
    { id: 'lv5', lv: 5, name: 'Partner', g: 'pair', s: 'badge', c: '#E9DCC3', hint: 'Pass Level 5' },
    { id: 'lv6', lv: 6, name: 'Manager', g: 'key', s: 'shield', c: '#395B50', dark: 1, hint: 'Pass Level 6' },
    { id: 'lv7', lv: 7, name: 'Leader', g: 'flag', s: 'circle', c: '#F0DCC0', hint: 'Pass Level 7' },
    { id: 'lv8', lv: 8, name: 'Navigator', g: 'compass', s: 'hex', c: '#C5D1EB', hint: 'Pass Level 8' },
    { id: 'lv9', lv: 9, name: 'Planner', g: 'map', s: 'square', c: '#D8E3D2', hint: 'Pass Level 9' },
    { id: 'lv10', lv: 10, name: 'Owner', g: 'star', s: 'badge', c: '#1F2F16', dark: 1, hint: 'Move to adult care' },
    { id: 'know', sk: 'know', name: 'Know my health', g: 'heart', s: 'shield', c: '#F0DCC0', hint: 'Get Know my health on your own' },
    { id: 'manage', sk: 'manage', name: 'Manage my care', g: 'clock', s: 'circle', c: '#92AFD7', hint: 'Get Manage my care on your own' },
    { id: 'speak', sk: 'speak', name: 'Speak up', g: 'chat', s: 'square', c: '#C5D1EB', hint: 'Get Speak up on your own' },
    { id: 'run', sk: 'run', name: 'Run my appointments', g: 'stairs', s: 'ticket', c: '#D8E3D2', fill: 1, hint: 'Get Run my appointments on your own' },
    { id: 'support', sk: 'support', name: 'Own my support', g: 'people', s: 'hex', c: '#395B50', dark: 1, hint: 'Get Own my support on your own' }
  ];
  function stickerSvg(d, locked) {
    var shape = SHAPES[d.s], ink = d.dark ? '#F7F0E2' : '#1F2F16', glyph;
    if (d.g === 'star') glyph = '<g transform="translate(32 32) scale(1.15)" fill="#CE3B3B"><rect x="-2.200" y="-12" width="4.400" height="24" rx="2.200"/><rect x="-2.200" y="-12" width="4.400" height="24" rx="2.200" transform="rotate(60)"/><rect x="-2.200" y="-12" width="4.400" height="24" rx="2.200" transform="rotate(120)"/></g>';
    else glyph = '<g transform="translate(17 17) scale(1.25)" fill="' + (d.fill ? ink : 'none') + '" stroke="' + ink + '" stroke-width="' + (d.fill ? 0 : 1.9) + '" stroke-linecap="round" stroke-linejoin="round">' + G[d.g] + '</g>';
    if (locked) return '<svg viewBox="0 0 64 64" width="64" height="64" aria-hidden="true" focusable="false"><g class="fa-sil">' + shape + '</g><text x="32" y="39" text-anchor="middle" class="fa-q">?</text></svg>';
    return '<svg viewBox="0 0 64 64" width="64" height="64" aria-hidden="true" focusable="false"><g class="fa-cut" fill="#FBF6EC" stroke="#FBF6EC" stroke-width="8" stroke-linejoin="round">' + shape + '</g><g fill="' + d.c + '">' + shape + '</g><g fill="url(#fa-sheen)" opacity=".5">' + shape + '</g>' + glyph + '</svg>';
  }
  function derived(p) {
    var out = {};
    STICKERS.forEach(function (d) {
      if (d.lv && (d.lv < p.level || (d.lv === 10 && p.transferred) || (d.lv < 10 && p.transferred))) out[d.id] = 1;
      if (d.sk && p.skills[d.sk] === 'own') out[d.id] = 1;
    });
    return out;
  }
  function stkState(p) {
    var key = 'folio.fun.stk.' + p.id, st = lsGet(key, null), der = derived(p);
    if (!st || !st.seen) { st = { seen: Object.keys(der) }; lsSet(key, st); }
    var earned = {}; st.seen.forEach(function (id) { earned[id] = 1; }); Object.keys(der).forEach(function (id) { earned[id] = 1; });
    var fresh = Object.keys(der).filter(function (id) { return st.seen.indexOf(id) < 0; });
    return { key: key, st: st, earned: earned, fresh: fresh };
  }
  function markSeen(p, id) { var k = 'folio.fun.stk.' + p.id, st = lsGet(k, { seen: [] }); if (st.seen.indexOf(id) < 0) { st.seen.push(id); lsSet(k, st); } }
  var toasted = {};
  var sheetEl = null, sheetSig = '', slapping = false;
  function sheetHTML(p, ss) {
    var n = Object.keys(ss.earned).length;
    var cells = STICKERS.map(function (d, i) {
      var got = ss.earned[d.id] && ss.fresh.indexOf(d.id) < 0, pending = ss.fresh.indexOf(d.id) >= 0;
      var rot = ((hash(d.id) % 15) - 7);
      return '<button type="button" class="fa-st ' + (got ? 'got' : pending ? 'got pend' : 'lock') + '" data-sid="' + d.id + '" style="--rot:' + rot + 'deg" aria-label="' + esc(got || pending ? d.name + ' sticker' : 'Locked sticker. ' + d.hint) + '">' + stickerSvg(d, !(got || pending)) + '</button>';
    }).join('');
    return '<h2 class="ios-gh" id="fa-stk-h"><span class="ios-tile t5 sm" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h14v9l-7 7H5z"/><path d="M12 20v-7h7"/></svg></span><span>My stickers</span><span class="fa-stk-n">' + n + ' of ' + STICKERS.length + '</span></h2>' +
      '<div class="fa-sheet"><svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><linearGradient id="fa-sheen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/></linearGradient></defs></svg>' + cells + '</div>' +
      '<p class="ios-gf fa-stk-cap" aria-live="polite">One for every level you pass and every skill you do on your own. Tap one.</p>';
  }
  function stickerSheet(pg, p) {
    var body = pg.querySelector('.ios-body'); if (!body) return;
    var ss = stkState(p), sig = p.id + ':' + Object.keys(ss.earned).sort().join(',') + ':' + ss.fresh.join(',');
    if (!sheetEl || sig !== sheetSig) {
      if (slapping && sheetEl) { /* keep the sheet stable while a slap plays */ }
      else {
        var fresh = !sheetEl; if (!sheetEl) { sheetEl = document.createElement('section'); sheetEl.className = 'ios-sec fa-stk'; sheetEl.setAttribute('aria-labelledby', 'fa-stk-h'); sheetEl.setAttribute('data-key', 'fa-stickers'); }
        sheetEl.innerHTML = sheetHTML(p, ss); sheetSig = sig;
        if (fresh && pg.classList.contains('anim')) { sheetEl.setAttribute('data-rise', ''); sheetEl.style.setProperty('--d', '5'); }
      }
    }
    if (sheetEl.parentNode !== body || body.lastElementChild !== sheetEl) body.appendChild(sheetEl);
    if (ss.fresh.length && !slapping && !overlayOpen()) {
      slapping = true;
      setTimeout(function () { slapNext(p.id); }, pg.classList.contains('anim') ? 900 : 250);
    }
  }
  function slapNext(id) {
    var p = sel.patient(id), pg = page();
    if (!p || !pg || !sheetEl || !pg.contains(sheetEl) || overlayOpen()) { slapping = false; return; }
    var ss = stkState(p); if (!ss.fresh.length) { slapping = false; refreshSheet(); return; }
    var sid = ss.fresh[0], d = STICKERS.filter(function (x) { return x.id === sid; })[0], el = sheetEl.querySelector('[data-sid="' + sid + '"]');
    markSeen(p, sid);
    var msg = 'New sticker: ' + d.name;
    if (!toasted[p.id + sid]) { toasted[p.id + sid] = 1; toast(msg, true); }
    if (!el) { slapping = false; refreshSheet(); return; }
    var r = el.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) { try { el.scrollIntoView({ block: 'center', behavior: reduced() ? 'auto' : 'smooth' }); } catch (e) {} }
    el.classList.remove('pend');
    var finish = function () { slapping = false; refreshSheet(); if (stkState(p).fresh.length) { slapping = true; setTimeout(function () { slapNext(id); }, 350); } };
    if (reduced()) { animate(el, [{ opacity: 0 }, { opacity: 1 }], { duration: 300 }); haptic('success'); setTimeout(finish, 320); return; }
    setTimeout(function () {
      var a = animate(el, [
        { transform: 'translate(-70px,-120px) rotate(-38deg) scale(1.6)', opacity: 0, filter: 'drop-shadow(0 18px 10px rgba(0,0,0,.35))' },
        { transform: 'translate(-30px,-50px) rotate(-18deg) scale(1.45)', opacity: 1, filter: 'drop-shadow(0 16px 10px rgba(0,0,0,.3))', offset: .45 },
        { transform: 'translate(0,0) rotate(var(--rot)) scale(.86)', opacity: 1, filter: 'drop-shadow(0 1px 1px rgba(0,0,0,.25))', offset: .72 },
        { transform: 'translate(0,0) rotate(var(--rot)) scale(1.06)', offset: .86 },
        { transform: 'translate(0,0) rotate(var(--rot)) scale(1)', filter: 'drop-shadow(0 1px 1px rgba(0,0,0,.25))' }
      ], { duration: 820, easing: 'cubic-bezier(.3,.6,.2,1)' });
      setTimeout(function () {
        haptic('success');
        var rip = document.createElement('span'); rip.className = 'fa-ripple'; el.appendChild(rip); setTimeout(function () { rip.remove(); }, 700);
        var c = centerOf(el); confetti(c.x, c.y, { n: 8, spread: 46, up: 10, cone: 6.2 });
        var shk = animate(sheetEl.querySelector('.fa-sheet'), [{ transform: 'translateY(0)' }, { transform: 'translateY(2px)' }, { transform: 'translateY(0)' }], { duration: 180 });
      }, 590);
      done(a, 840).then(finish);
    }, 380);
  }
  function refreshSheet() { var p = me(), pg = page(); sheetSig = ''; if (p && pg && pg.dataset.path === '/levels') stickerSheet(pg, p); }
  function watchStickersElsewhere(p) {
    if (overlayOpen()) return;
    var ss = stkState(p);
    ss.fresh.forEach(function (sid) { if (toasted[p.id + sid]) return; toasted[p.id + sid] = 1; var d = STICKERS.filter(function (x) { return x.id === sid; })[0]; toast('New sticker: ' + d.name + '. Find it in Levels.', true); });
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.fa-st'); if (!b) return;
    var d = STICKERS.filter(function (x) { return x.id === b.dataset.sid; })[0], cap = sheetEl && sheetEl.querySelector('.fa-stk-cap'); if (!d) return;
    var got = b.classList.contains('got');
    if (cap) cap.textContent = got ? d.name + '. ' + (d.lv ? (d.lv === 10 ? 'Earned when you moved to adult care.' : 'Earned for passing Level ' + d.lv + '.') : 'Earned for doing it on your own.') : 'Locked. ' + d.hint + ' to earn this one.';
    b.classList.remove('wob'); void b.offsetWidth; b.classList.add(got ? 'wob' : 'nope'); setTimeout(function () { b.classList.remove('wob', 'nope'); }, 600);
    haptic('light');
  });

  /* =====================================================================
     6. Next-visit ticket: friendly countdown, tear-in when a date is added, confetti on the day
     ===================================================================== */
  var lastVisit = {};
  function countCopy(p) {
    var vd = visitDays(p), q = (p.questions || []).length; if (vd == null) return '';
    if (vd === 0) return 'Today is the day. You have got this.';
    if (vd === 1) return q ? 'Tomorrow. Your ' + q + (q === 1 ? ' question is' : ' questions are') + ' ready.' : 'Tomorrow. Jot down one question tonight.';
    if (vd <= 3) return vd + ' days. You have got this.';
    if (vd <= 7) return vd + ' days to go. Plenty of time to prep.';
    return vd + ' days away. Add questions as you think of them.';
  }
  function ticketFun(pg, p) {
    var tk = pg.querySelector('.ios-ticket'), iso = p.nextVisit && p.nextVisit.iso || '', prev = lastVisit[p.id];
    lastVisit[p.id] = iso;
    if (!tk) return;
    var main = tk.querySelector('.main'), txt = countCopy(p), line = main && main.querySelector(':scope > .fa-count');
    if (main && txt) { if (!line) { line = document.createElement('p'); line.className = 'fa-count'; main.appendChild(line); } if (line.textContent !== txt) line.textContent = txt; }
    else if (line) line.remove();
    if (prev !== undefined && iso && prev !== iso) {
      var sh = pg.querySelector('.ios-ticket-sh');
      if (sh && !reduced()) {
        sh.classList.remove('fa-tear'); void sh.offsetWidth; sh.classList.add('fa-tear'); setTimeout(function () { sh.classList.remove('fa-tear'); }, 1000);
        setTimeout(function () { var s = tk.querySelector('.stub'); if (s) { var r = s.getBoundingClientRect(); confetti(r.right, r.top + r.height / 2, { n: 8, spread: 40, up: 0, cone: 6.2 }); } haptic('light'); }, 260);
      }
    }
    if (visitDays(p) === 0 && pg.classList.contains('anim')) {
      var k = 'folio.fun.vday.' + p.id; if (lsGet(k, '') !== today()) { lsSet(k, today()); setTimeout(function () { var c = centerOf(tk); confetti(c.x, c.r.top + 10, { n: 22, spread: 130 }); haptic('success'); }, 700); }
    }
  }

  /* =====================================================================
     Apply after every render
     ===================================================================== */
  var busy = false;
  function enhance() {
    if (busy) return; busy = true;
    try {
      var pg = page(), p = me();
      if (pg && p) {
        var path = pg.dataset.path;
        if (tip && !tip.isConnected) tip = null;
        if (path === '/') { applyGreeting(pg, p); rigCard(pg, p); ticketFun(pg, p); }
        if (path === '/' || path === '/levels') checkLevel(pg, p);
        if (path === '/levels') stickerSheet(pg, p); else watchStickersElsewhere(p);
      }
      wrapPractise();
    } catch (e) { if (window.console) console.warn('fun-home', e); }
    if (mo) mo.takeRecords();
    busy = false;
  }
  var mo = null, root = document.getElementById('app');
  if (root && window.MutationObserver) { mo = new MutationObserver(enhance); mo.observe(root, { childList: true, subtree: true, characterData: true }); }
  document.addEventListener('folio:rendered', enhance);
  enhance();
})(window.Folio);
