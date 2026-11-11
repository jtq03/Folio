/* Folio fun layer: motion and small delights for the patient app.
   Attaches after each render (the folio:rendered event, with a MutationObserver on #app as a fallback).
   Never re-mounts the shell, never moves focus or scroll, and only animates on real navigation or a real
   state change. Effects that fly (confetti, sparkles) live in their own layer that the DOM morph never touches. */
(function (F) {
  if (!F || !F.UI || !F.Store) return;
  var U = F.UI, S = F.Store, N = F.native || {}, A = S.act;
  var device = document.getElementById('device') || document.body, appRoot = document.getElementById('app');

  function reduced() { try { return N.reduced ? N.reduced() : window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }
  function haptic(k) { try { if (N.haptic) N.haptic(k); } catch (e) {} }
  function pid() { try { var v = localStorage.getItem('folio.app.pid'); if (v && S.sel.patient(v)) return v; } catch (e) {} var ps = S.get().patients; return S.sel.patient('p1') ? 'p1' : (ps[0] && ps[0].id); }
  function me() { return S.sel.patient(pid()); }
  function lsGet(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function esc(s) { return U.esc ? U.esc(s) : String(s); }
  function path() { var hs = location.hash.replace(/^#/, '') || '/'; var q = hs.indexOf('?'); hs = q < 0 ? hs : hs.slice(0, q); return hs.length > 1 ? hs.replace(/\/+$/, '') : '/'; }
  /* Restart a CSS animation class on an element, then clean it up */
  function play(el, cls, ms) { if (!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); clearTimeout(el['_fx' + cls]); el['_fx' + cls] = setTimeout(function () { el.classList.remove(cls); }, ms || 800); }

  /* ---------- Preferred name. P1 and Home may read p.nickname directly; this helper falls back to first name ---------- */
  F.nickname = function (p) { var n = p && p.nickname && String(p.nickname).trim(); return n || (p && p.first) || ''; };

  /* ---------- Effect layer ---------- */
  var layer = null;
  function fxLayer() { if (!layer || !layer.isConnected) { layer = document.createElement('div'); layer.className = 'fx-layer'; layer.setAttribute('aria-hidden', 'true'); device.appendChild(layer); } return layer; }
  function at(el) { var d = device.getBoundingClientRect(), r = el.getBoundingClientRect(); return { x: r.left - d.left + r.width / 2, y: r.top - d.top + r.height / 2 }; }
  var COLS = ['#92AFD7', '#E9DCC3', '#F0E3CE', '#C5D1EB', '#5A7684', '#395B50', '#D8E3D2'];
  var SHAPES = ['', '', 'c', 't', 'c', '', 't'];
  function bit(i, stars) {
    var b = document.createElement('i'), shape = stars && i % 12 === 0 ? 's' : SHAPES[i % SHAPES.length];
    b.className = 'fx-bit ' + shape; if (shape === 's') b.innerHTML = U.star(14).s; else b.style.background = COLS[(i * 3) % COLS.length];
    return b;
  }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  /* A radial burst from a point (profile complete, Got it) */
  function burst(el, n) {
    if (reduced() || !el) return; var c = at(el), box = document.createElement('div'); box.className = 'fx-burst';
    for (var i = 0; i < (n || 28); i++) {
      var b = bit(i, true), ang = rnd(0, Math.PI * 2), dist = rnd(50, 150);
      b.style.cssText += ';--x0:' + c.x + 'px;--y0:' + c.y + 'px;--dx:' + (Math.cos(ang) * dist).toFixed(0) + 'px;--dy:' + (Math.sin(ang) * dist + 40).toFixed(0) + 'px;--rot:' + rnd(-400, 400).toFixed(0) + 'deg;--dur:' + rnd(.8, 1.3).toFixed(2) + 's;--del:' + rnd(0, .08).toFixed(2) + 's';
      box.appendChild(b);
    }
    fxLayer().appendChild(box); setTimeout(function () { box.remove(); }, 1600);
  }
  /* Paper-cut confetti falling with different drift (level up, the shake egg) */
  function rain(n, cls, delay) {
    if (reduced()) return null; var w = device.clientWidth, hgt = device.clientHeight, box = document.createElement('div'); box.className = cls || 'fx-lvfx';
    for (var i = 0; i < n; i++) {
      var b = bit(i, true);
      b.style.cssText += ';--x0:' + rnd(0, w).toFixed(0) + 'px;--dx:' + rnd(-70, 70).toFixed(0) + 'px;--y1:' + (hgt + 40) + 'px;--rot:' + rnd(-720, 720).toFixed(0) + 'deg;--dur:' + rnd(2.4, 4.6).toFixed(2) + 's;--del:' + ((delay || 0) + rnd(0, 1.3)).toFixed(2) + 's';
      box.appendChild(b);
    }
    fxLayer().appendChild(box); setTimeout(function () { box.remove(); }, 7000); return box;
  }
  function sparkle(el) {
    if (reduced() || !el) return; var c = at(el), box = document.createElement('div');
    for (var i = 0; i < 7; i++) { var s = document.createElement('i'), a = i / 7 * Math.PI * 2; s.className = 'fx-spark'; s.style.cssText = 'left:' + c.x + 'px;top:' + c.y + 'px;--x:' + (Math.cos(a) * 24).toFixed(0) + 'px;--y:' + (Math.sin(a) * 24).toFixed(0) + 'px;background:' + COLS[i % 3 === 0 ? 5 : 0]; box.appendChild(s); }
    fxLayer().appendChild(box); setTimeout(function () { box.remove(); }, 700);
  }

  /* ---------- Toasts with personality ---------- */
  var COPY = {
    'Saved': 'Saved. Nice one.', 'Link saved': 'Link saved. Your doctor can open it now.', 'Question added': 'Question added. Future you says thanks.',
    'Next visit saved': 'Visit saved. It is on Home now.', 'Character chosen': 'Love that pick.', 'Photo updated': 'Looking good.',
    'Removed': 'Gone. You can add it back any time.', 'Photo removed': 'Photo removed. Your initial is back.'
  };
  var OKRE = /^(Saved|Link saved|Question added|Visit saved|Love that pick|Looking good|Got it)/;
  var PAPER = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.200" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h8l5 5v13H6z"/><path d="M14 3v5h5"/></svg>';
  var CHECK = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.200" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.500l4.500 4.500L19 7.500"/></svg>';
  var baseToast = U.toast;
  U.toast = function (msg, withStar) {
    msg = COPY[msg] || msg; var box = document.getElementById('toasts'), before = box ? box.lastElementChild : null;
    baseToast(msg, withStar);
    var t = box && box.lastElementChild; if (!t || t === before || withStar || t.classList.contains('ios-update') || t.querySelector('.fx-ticon')) return;
    var ok = OKRE.test(msg), i = document.createElement('span'); i.className = 'fx-ticon' + (ok ? ' ok' : ''); i.setAttribute('aria-hidden', 'true'); i.innerHTML = ok ? CHECK : PAPER;
    t.insertBefore(i, t.firstChild); if (ok) haptic('light');
  };

  /* ---------- 1. Tab bar ---------- */
  var tabsEl = null, tstar = null, lastTab = -1;
  function tabs() {
    var nav = appRoot && appRoot.querySelector('.ios-tabs'); if (!nav) return;
    if (nav !== tabsEl) { tabsEl = nav; tstar = null; }
    if (!tstar || !tstar.isConnected) { tstar = document.createElement('span'); tstar.className = 'fx-tstar'; tstar.setAttribute('aria-hidden', 'true'); tstar.innerHTML = U.star(10).s; nav.appendChild(tstar); }
    var links = [].slice.call(nav.querySelectorAll('a')), idx = -1;
    links.forEach(function (a, i) { if (a.getAttribute('aria-current') === 'page') idx = i; });
    if (idx < 0 || idx === lastTab) return;
    var first = lastTab < 0; lastTab = idx; tstar.style.setProperty('--i', idx);
    if (first || reduced()) return;
    play(links[idx], 'fx-go', 800); play(tstar, 'go', 760);
  }

  /* ---------- 2. Controls ---------- */
  document.addEventListener('change', function (e) {
    var t = e.target; if (!t.matches || !t.matches('.ios-sw')) return;
    requestAnimationFrame(function () { if (reduced()) return; play(t, t.checked ? 'fx-on' : 'fx-off', 520); if (t.checked) sparkle(t); });
  });
  document.addEventListener('click', function (e) {
    var seg = e.target.closest && e.target.closest('.ios-seg button'); if (!seg) return;
    requestAnimationFrame(function () {
      if (reduced()) return; var s = document.querySelector('#main .ios-seg'); if (!s) return;
      play(s, 'fx-sq', 560); play(s.querySelector('button[aria-pressed="true"]'), 'fx-sq', 450);
    });
  });

  /* ---------- 3. About me ---------- */
  var about = { main: null, pct: -1, done: [] };
  function aboutFx(main, isNew) {
    var b = main.querySelector('.ios-ring b'), lis = [].slice.call(main.querySelectorAll('.ios-checks li')); if (!b) return;
    var pct = parseInt(b.textContent, 10) || 0, done = lis.map(function (li) { return li.classList.contains('done'); });
    var key = 'folio.fx.complete.' + pid();
    if (isNew) {
      if (main.classList.contains('anim') && !reduced()) lis.forEach(function (li, i) { if (done[i]) { li.style.setProperty('--fxd', (.35 + i * .09).toFixed(2) + 's'); li.classList.add('fx-draw'); } });
      if (pct === 100 && !lsGet(key, false)) lsSet(key, true); /* already complete before this feature: no surprise party */
    } else if (pct !== about.pct || done.join() !== about.done.join()) {
      lis.forEach(function (li, i) { if (done[i] && !about.done[i]) { li.style.setProperty('--fxd', '0s'); li.classList.add('fx-draw'); } });
      if (pct > about.pct && !reduced()) play(main.querySelector('.ios-ring'), 'fx-pop', 600);
      if (pct === 100 && about.pct < 100 && !lsGet(key, false)) {
        lsSet(key, true);
        setTimeout(function () { burst(main.querySelector('.ios-ring'), 40); haptic('success'); U.toast('Profile complete. Your team can\'t miss you now.', true); }, 450);
      }
    }
    about.main = main; about.pct = pct; about.done = done;
  }
  var taps = [];
  document.addEventListener('click', function (e) {
    var av = e.target.closest && e.target.closest('.ios-av-hero > .avatar'); if (!av) return;
    var hero = av.parentNode; if (!reduced()) play(hero, 'fx-boing', 760); haptic('light');
    var now = Date.now(); taps = taps.filter(function (t) { return now - t < 1800; }); taps.push(now);
    if (taps.length >= 5) {
      taps = [];
      if (window.FolioIntro && typeof window.FolioIntro.play === 'function') { try { window.FolioIntro.play({ force: true }); } catch (err) {} }
      else { burst(av, 30); U.toast('You found a secret. Hi again.', true); }
    }
  });
  F.fx = F.fx || {};
  F.fx.nickRow = function (p) {
    var n = p.nickname && String(p.nickname).trim();
    return '<button type="button" class="fx-nick" data-action="editNick" aria-label="' + (n ? 'Preferred name: ' + esc(n) + '. Change' : 'Add a preferred name') + '">' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>' +
      (n ? 'Goes by <b>' + esc(n) + '</b>' : 'What should we call you?') + '</button>';
  };
  F.actions = F.actions || {};
  F.actions.editNick = function () {
    var p = me(); if (!p) return;
    U.formModal({ title: 'What should we call you?', lead: 'Optional. Folio uses this to say hi. Your clinic still sees your full name.', cta: 'Save',
      fields: [{ name: 'nickname', label: 'Preferred name', value: p.nickname || '', ph: 'For example: ' + p.first }],
      onSubmit: function (d) {
        var n = String(d.nickname || '').trim().slice(0, 24); A.updatePatient(p.id, { nickname: n });
        U.toast(n ? 'Got it. Hi ' + n + '.' : 'Okay, back to ' + p.first + '.');
      } });
  };

  /* ---------- 4. Resources: read state, reading bar, Got it stamp ---------- */
  function readKey() { return 'folio.fx.read.' + pid(); }
  function readList() { var v = lsGet(readKey(), []); return Array.isArray(v) ? v : []; }
  F.fx.isRead = function (id) { return readList().indexOf(id) >= 0; };
  F.fx.readDot = function (id) { var r = F.fx.isRead(id); return '<span class="fx-dot' + (r ? ' read' : '') + '" role="img" aria-label="' + (r ? 'Read' : 'Not read yet') + '"></span>'; };
  function readSecs(r) { var m = parseInt(String(r.mins || ''), 10); return Math.max(20, Math.min(180, (m || 3) * 30)); }
  F.fx.readBlock = function (r) {
    var done = F.fx.isRead(r.id);
    return '<div class="ios-sec fx-readsec" data-rise style="--d:3"><div class="fx-readbar' + (done ? ' full' : '') + '" data-fxread="' + esc(r.id) + '" data-secs="' + readSecs(r) + '" style="--p:' + (done ? 1 : 0) + '" aria-hidden="true"><i></i>' + U.star(18).s + '</div>' +
      '<div class="fx-readcap" aria-hidden="true"><span>' + esc(r.mins || '') + '</span><span>' + (done ? 'Read' : 'Finish line') + '</span></div>' +
      '<div class="fx-gotit" style="margin-top:14px">' + (done ? '<span class="fx-stamp" role="img" aria-label="Marked as read">' + U.star(14).s + 'Read</span><span class="ios-detail">Marked as read. Nice work.</span>'
        : '<button type="button" class="ios-btn" data-action="gotIt" data-id="' + esc(r.id) + '">Got it</button>') + '</div></div>';
  };
  F.actions.gotIt = function (el) {
    var id = el.dataset.id, l = readList(); if (l.indexOf(id) < 0) { l.push(id); lsSet(readKey(), l); }
    haptic('success'); if (F.rerender) F.rerender(false);
    requestAnimationFrame(function () {
      var st = document.querySelector('#main .fx-stamp'); if (st && !reduced()) { st.classList.add('slam'); setTimeout(function () { burst(st, 16); }, 300); }
      var g = document.querySelector('#main .fx-gotit .ios-detail'); if (g) g.setAttribute('role', 'status');
    });
  };
  var readT = null, readStart = 0, readMain = null;
  function readingFx(main, isNew) {
    var bar = main.querySelector('.fx-readbar');
    if (!bar) { clearInterval(readT); readT = null; return; }
    if (isNew || readMain !== main) { readMain = main; readStart = Date.now(); clearInterval(readT); readT = setInterval(tickRead, 1000); }
    tickRead();
  }
  function tickRead() {
    var bar = readMain && readMain.isConnected && readMain.querySelector('.fx-readbar'); if (!bar) { clearInterval(readT); readT = null; return; }
    if (bar.classList.contains('full')) { bar.style.setProperty('--p', 1); return; }
    var secs = +bar.getAttribute('data-secs') || 60, sc = readMain.scrollHeight - readMain.clientHeight;
    var p = Math.min(1, Math.max((Date.now() - readStart) / 1000 / secs, sc > 40 ? readMain.scrollTop / sc : 0));
    bar.style.setProperty('--p', p.toFixed(3));
  }

  /* ---------- 6. Level-up: flap counter, paper confetti, haptic stages ---------- */
  var lvEl = null, lvRain = null;
  function levelFx() {
    var el = appRoot && appRoot.querySelector('.ios-lvlup');
    if (!el) { if (lvRain) { lvRain.remove(); lvRain = null; } lvEl = null; return; }
    var share = el.querySelector('[data-action="shareLevel"]'), n = share ? +share.getAttribute('data-id') : 0, isUp = /level up/i.test((el.querySelector('.ios-eyebrow') || {}).textContent || '');
    var fresh = el !== lvEl; lvEl = el;
    if (isUp && n && !el.querySelector('.fx-flap')) {
      var f = document.createElement('div'); f.className = 'fx-flap' + (fresh ? '' : ' static'); f.setAttribute('aria-hidden', 'true');
      f.innerHTML = '<span><em class="old">' + Math.max(0, n - 1) + '</em><em class="new">' + n + '</em></span>';
      var eb = el.querySelector('.ios-eyebrow'); if (eb) el.insertBefore(f, eb);
    }
    if (!fresh || reduced()) return;
    lvRain = rain(20, 'fx-lvfx', .9);
    setTimeout(function () { if (lvEl === el) haptic('light'); }, 560);
    setTimeout(function () { if (lvEl === el) haptic('success'); }, 1000);
    setTimeout(function () { if (lvEl === el) haptic('light'); }, 1500);
  }

  /* ---------- 7. Shake for confetti, once per session, only where motion needs no permission prompt ---------- */
  try {
    if (window.DeviceMotionEvent && typeof DeviceMotionEvent.requestPermission !== 'function' && 'ontouchstart' in window) {
      var hits = [];
      window.addEventListener('devicemotion', function onShake(e) {
        var a = e.accelerationIncludingGravity || e.acceleration; if (!a) return;
        var m = Math.sqrt((a.x || 0) * (a.x || 0) + (a.y || 0) * (a.y || 0) + (a.z || 0) * (a.z || 0)), now = Date.now();
        if (m < 26) return; hits = hits.filter(function (t) { return now - t < 800; }); hits.push(now);
        if (hits.length < 3) return;
        window.removeEventListener('devicemotion', onShake);
        try { if (sessionStorage.getItem('folio.fx.shake')) return; sessionStorage.setItem('folio.fx.shake', '1'); } catch (err) {}
        rain(34, 'fx-loose', 0); haptic('light');
      });
    }
  } catch (e) {}

  /* ---------- After every render ---------- */
  var lastMain = null, busy = false;
  function onRender() {
    if (busy) return; busy = true;
    try {
      tabs();
      var main = document.getElementById('main'), isNew = main !== lastMain; lastMain = main;
      if (main) {
        var p = path();
        if (p === '/about') aboutFx(main, isNew); else if (isNew) about.main = null;
        readingFx(main, isNew);
      }
      levelFx();
    } catch (e) { if (window.console) console.warn('fun-ui', e); }
    busy = false;
  }
  document.addEventListener('folio:rendered', onRender);
  if (appRoot && window.MutationObserver) new MutationObserver(onRender).observe(appRoot, { childList: true, subtree: true });

  /* Patch in the hooks this file provides (app.js rendered once before this deferred script ran) */
  try { if (F.rerender) F.rerender(false); } catch (e) {}
  onRender();
})(window.Folio);
