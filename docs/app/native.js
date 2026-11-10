/* Folio native helpers: haptics, sharing, calendar files, wake lock, badging, context menus,
   swipe rows, view transitions and keyboard avoidance. Everything is feature-detected and never throws. */
(function (F) {
  var N = F.native = {};
  var U = F.UI, h = U.h, esc = U.esc;
  function reduced() { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'reduce'; } catch (e) { return false; } }
  N.reduced = reduced;

  /* ---------- Haptics ----------
     iOS Safari has no vibrate. A hidden <input switch> toggled by a label click fires the Taptic Engine on iOS 18+. */
  var hapLabel = null;
  function hapInit() {
    if (hapLabel || !document.body) return;
    try {
      hapLabel = document.createElement('label'); hapLabel.setAttribute('aria-hidden', 'true');
      hapLabel.style.cssText = 'position:fixed;left:-60px;top:-60px;width:40px;height:40px;opacity:.01;pointer-events:none;overflow:hidden';
      var i = document.createElement('input'); i.type = 'checkbox'; i.setAttribute('switch', ''); i.tabIndex = -1; i.setAttribute('aria-hidden', 'true');
      hapLabel.appendChild(i); document.body.appendChild(hapLabel);
    } catch (e) { hapLabel = null; }
  }
  N.haptic = function (kind) {
    try {
      if (reduced() && kind !== 'success') return;
      hapInit();
      var tap = function () { try { if (hapLabel) hapLabel.click(); } catch (e) {} };
      if (kind === 'success') { tap(); setTimeout(tap, 70); } else tap();
      if (navigator.vibrate && !/iPhone|iPad|iPod/i.test(navigator.userAgent)) navigator.vibrate(kind === 'success' ? [12, 50, 18] : kind === 'heavy' ? 24 : 9);
    } catch (e) {}
  };

  /* ---------- Share ---------- */
  var CANCEL = 'cancel';
  N.shareText = function (data) {
    return Promise.resolve().then(function () {
      if (navigator.share) return navigator.share(data).then(function () { return 'shared'; });
      throw new Error('noshare');
    }).catch(function (e) {
      if (e && e.name === 'AbortError') return CANCEL;
      var t = [data.title, data.text, data.url].filter(Boolean).join('\n');
      return (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { U.toast('Copied. Paste it anywhere.'); return 'copied'; }, function () { U.toast('Sharing is not available here'); return 'none'; });
    });
  };
  N.shareFile = function (file, data) {
    return Promise.resolve().then(function () {
      if (navigator.canShare && navigator.canShare({ files: [file] })) return navigator.share(Object.assign({ files: [file] }, data)).then(function () { return 'shared'; });
      throw new Error('nofiles');
    }).catch(function (e) {
      if (e && e.name === 'AbortError') return CANCEL;
      N.download(file); U.toast('Saved ' + file.name); return 'downloaded';
    });
  };
  N.download = function (file) {
    try { var a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = file.name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000); } catch (e) {}
  };

  /* Canvas drawing helpers for share images */
  function rr(c, x, y, w, hh, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + hh, r); c.arcTo(x + w, y + hh, x, y + hh, r); c.arcTo(x, y + hh, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function star(c, cx, cy, s, col) { c.save(); c.translate(cx, cy); c.fillStyle = col || '#CE3B3B'; for (var i = 0; i < 3; i++) { c.save(); c.rotate(i * Math.PI / 3); rr(c, -s * .18, -s, s * .36, s * 2, s * .18); c.fill(); c.restore(); } c.restore(); }
  function stackMark(c, x, y, s, dark) {
    rr(c, x, y + s * .42, s * .72, s * .44, s * .08); c.fillStyle = '#92AFD7'; c.fill();
    rr(c, x + s * .13, y + s * .24, s * .72, s * .44, s * .08); c.fillStyle = '#395B50'; c.fill();
    rr(c, x + s * .26, y + s * .06, s * .72, s * .44, s * .08); c.fillStyle = dark ? '#F0E3CE' : '#1F2F16'; c.fill();
    star(c, x + s * .98, y + s * .02, s * .1);
  }
  function grain(c, w, hh, alpha) { c.save(); for (var i = 0; i < w * hh / 90; i++) { c.fillStyle = 'rgba(90,70,40,' + (Math.random() * alpha) + ')'; c.fillRect(Math.random() * w, Math.random() * hh, 1.4, 1.4); } c.restore(); }
  function fontsReady() { return (document.fonts && document.fonts.load ? Promise.all([document.fonts.load('600 80px Fraunces'), document.fonts.load('400 40px Prompt'), document.fonts.load('700 30px Prompt')]) : Promise.resolve()).catch(function () {}); }
  function toFile(canvas, name) { return new Promise(function (res) { canvas.toBlob(function (b) { res(b ? new File([b], name, { type: 'image/png' }) : null); }, 'image/png'); }); }
  function wrapText(c, text, x, y, maxW, lh) { var words = String(text).split(' '), line = ''; words.forEach(function (w) { var t = line ? line + ' ' + w : w; if (c.measureText(t).width > maxW && line) { c.fillText(line, x, y); line = w; y += lh; } else line = t; }); if (line) c.fillText(line, x, y); return y; }

  /* Folio card as an image: only the Folio ID and name, never the private tap link. */
  N.cardImage = function (p, fid) {
    return fontsReady().then(function () {
      var W = 1200, H = 756, cv = document.createElement('canvas'); cv.width = W; cv.height = H; var c = cv.getContext('2d');
      rr(c, 0, 0, W, H, 56); c.save(); c.clip(); c.fillStyle = '#F0E3CE'; c.fillRect(0, 0, W, H); grain(c, W, H, .12);
      var g = c.createRadialGradient(W * .3, 0, 50, W * .3, 0, W); g.addColorStop(0, 'rgba(255,250,238,.55)'); g.addColorStop(1, 'rgba(255,250,238,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H); c.restore();
      c.fillStyle = '#CE3B3B'; c.font = '700 26px Prompt, system-ui, sans-serif'; c.textBaseline = 'alphabetic';
      c.fillText('YOUR STORY, CARRIED FORWARD', 80, 110);
      c.fillStyle = '#1F2F16'; c.font = '600 118px Fraunces, Georgia, serif'; c.fillText('fol', 80, 250); var w1 = c.measureText('fol').width, wi = c.measureText('\u0131').width;
      c.fillText('\u0131', 80 + w1, 250); star(c, 80 + w1 + wi / 2, 128, 22); c.fillText('o', 80 + w1 + wi, 250);
      c.fillStyle = '#CE3B3B'; c.font = '700 26px Prompt, system-ui, sans-serif'; c.fillText('FOLIO ID', 80, 520);
      c.fillStyle = '#1F2F16'; c.font = '600 130px Fraunces, Georgia, serif'; c.fillText(fid, 80, 640);
      c.font = '600 38px Prompt, system-ui, sans-serif'; c.fillText(p.first + ' ' + p.last, 80, 700);
      stackMark(c, 820, 470, 270); rr(c, 3, 3, W - 6, H - 6, 54); c.strokeStyle = 'rgba(31,47,22,.18)'; c.lineWidth = 3; c.stroke();
      return toFile(cv, 'folio-card.png');
    });
  };
  /* Level-up achievement card */
  N.achievementImage = function (p, level) {
    return fontsReady().then(function () {
      var W = 1080, H = 1350, cv = document.createElement('canvas'); cv.width = W; cv.height = H; var c = cv.getContext('2d');
      var g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#2C4636'); g.addColorStop(1, '#1F2F16'); c.fillStyle = g; c.fillRect(0, 0, W, H);
      c.globalAlpha = .06; for (var i = 0; i < H; i += 4) { c.fillStyle = '#000'; c.fillRect(0, i, W, 1); } c.globalAlpha = 1;
      stackMark(c, W / 2 - 220, 170, 440, true);
      c.textAlign = 'center'; c.fillStyle = '#C5D1EB'; c.font = '700 34px Prompt, system-ui, sans-serif'; c.fillText('I REACHED', W / 2, 700);
      c.fillStyle = '#F0E3CE'; c.font = '600 128px Fraunces, Georgia, serif'; c.fillText('Level ' + level.n, W / 2, 840); c.font = 'italic 400 112px Fraunces, Georgia, serif'; c.fillText(level.name, W / 2, 960);
      c.font = '400 38px Prompt, system-ui, sans-serif'; c.fillStyle = '#E9DCC3'; c.fillText('My care team signed me off.', W / 2, 1050);
      c.save(); c.translate(W / 2, 1150); c.rotate(-.06); rr(c, -190, -44, 380, 88, 18); c.strokeStyle = '#E4605F'; c.lineWidth = 7; c.stroke(); c.fillStyle = '#F4B1AC'; c.font = '700 30px Prompt, system-ui, sans-serif'; c.fillText('SIGNED OFF', 20, 11); star(c, -128, 0, 22, '#E4605F'); c.restore();
      c.fillStyle = '#F0E3CE'; c.font = '600 54px Fraunces, Georgia, serif'; c.fillText('folio', W / 2, 1275);
      return toFile(cv, 'folio-level-' + level.n + '.png');
    });
  };

  /* ---------- Calendar (.ics with a 1 day reminder) ---------- */
  function pad(n) { return ('0' + n).slice(-2); }
  function icsDate(d) { return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + 'T' + pad(d.getHours()) + pad(d.getMinutes()) + '00'; }
  function icsEsc(s) { return String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n'); }
  function fold(line) { var o = [], s = line; while (s.length > 74) { o.push(s.slice(0, 74)); s = ' ' + s.slice(74); } o.push(s); return o.join('\r\n'); }
  N.ics = function (v, questions, who) {
    var d = new Date(v.iso), end = new Date(d.getTime() + 3600000), now = new Date();
    var desc = (v.note ? v.note + '\n\n' : '') + (questions && questions.length ? 'Questions to ask:\n' + questions.map(function (q) { return '- ' + q; }).join('\n') : '') + '\n\nAdded from Folio.';
    var L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Folio//Patient app//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'BEGIN:VEVENT',
      'UID:folio-' + d.getTime() + '@folio.example', 'DTSTAMP:' + now.getUTCFullYear() + pad(now.getUTCMonth() + 1) + pad(now.getUTCDate()) + 'T' + pad(now.getUTCHours()) + pad(now.getUTCMinutes()) + pad(now.getUTCSeconds()) + 'Z',
      'DTSTART:' + icsDate(d), 'DTEND:' + icsDate(end), 'SUMMARY:' + icsEsc('Visit: ' + (v.where || 'My care team')), 'LOCATION:' + icsEsc(v.where), 'DESCRIPTION:' + icsEsc(desc),
      'BEGIN:VALARM', 'TRIGGER:-P1D', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsEsc('Visit tomorrow: ' + (v.where || 'My care team')), 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'];
    return new File([L.map(fold).join('\r\n') + '\r\n'], 'folio-visit.ics', { type: 'text/calendar' });
  };
  N.openCalendar = function (file) {
    return Promise.resolve().then(function () {
      if (navigator.canShare && navigator.canShare({ files: [file] })) return navigator.share({ files: [file], title: 'Folio visit' }).then(function () { return 'shared'; });
      throw new Error('nofiles');
    }).catch(function (e) {
      if (e && e.name === 'AbortError') return CANCEL;
      try { var a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = file.name; document.body.appendChild(a); a.click(); a.remove(); } catch (er) {}
      U.toast('Calendar file ready. Open it to add the visit.'); return 'downloaded';
    });
  };

  /* ---------- Wake lock (QR sheet) ---------- */
  var lock = null;
  N.wake = {
    on: function () { try { if (navigator.wakeLock && navigator.wakeLock.request) navigator.wakeLock.request('screen').then(function (s) { lock = s; }, function () {}); } catch (e) {} },
    off: function () { try { if (lock) { lock.release(); lock = null; } } catch (e) {} }
  };
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible' && N.wakeWanted) N.wake.on(); });

  /* ---------- App badge ---------- */
  N.badge = function (n) { try { if (n > 0 && navigator.setAppBadge) navigator.setAppBadge(n).catch(function () {}); else if (navigator.clearAppBadge) navigator.clearAppBadge().catch(function () {}); } catch (e) {} };

  /* ---------- Keyboard avoidance ---------- */
  (function () {
    var vv = window.visualViewport; if (!vv) return;
    function upd() { var kb = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop)); var d = document.getElementById('device'); if (d) d.style.setProperty('--kb', kb > 80 ? kb + 'px' : '0px'); }
    vv.addEventListener('resize', upd); vv.addEventListener('scroll', upd); upd();
  })();

  /* ---------- View transitions ---------- */
  N.navigate = function (href, dir) {
    if (location.hash === href) return;
    if (!document.startViewTransition || reduced()) { location.hash = href; return; }
    var cl = document.documentElement.classList; cl.remove('vt-push', 'vt-pop', 'vt-tab'); cl.add('vt-' + (dir || 'tab')); F.ui._vt = true;
    try {
      var t = document.startViewTransition(function () {
        return new Promise(function (res) {
          var done = false; function fin() { if (done) return; done = true; window.removeEventListener('hashchange', on); res(); }
          function on() { setTimeout(fin, 0); }
          window.addEventListener('hashchange', on); location.hash = href; setTimeout(fin, 600);
        });
      });
      var clear = function () { cl.remove('vt-push', 'vt-pop', 'vt-tab'); F.ui._vt = false; };
      t.finished.then(clear, clear);
    } catch (e) { F.ui._vt = false; location.hash = href; }
  };

  /* ---------- Context menu (long press / right click) ---------- */
  var ctxRec = null;
  N.closeContext = function () { if (!ctxRec) return; var r = ctxRec; ctxRec = null; r.el.classList.add('out'); setTimeout(function () { r.el.remove(); if (!document.querySelector('.ios-sheet-wrap')) document.getElementById('app').removeAttribute('inert'); }, 200); };
  N.contextMenu = function (anchor, items) {
    if (ctxRec || !items || !items.length) return;
    var root = document.getElementById('modal-root'), dev = document.getElementById('device').getBoundingClientRect(), r = anchor.getBoundingClientRect();
    var wrap = document.createElement('div'); wrap.className = 'ios-ctx';
    var top = r.top - dev.top, left = r.left - dev.left, mh = items.length * 50 + 10, below = dev.height - (top + r.height) - 24 > mh + 20;
    var clone = anchor.cloneNode(true); clone.removeAttribute('data-ctx'); clone.querySelectorAll('[id]').forEach(function (n) { n.removeAttribute('id'); }); clone.setAttribute('aria-hidden', 'true'); clone.setAttribute('inert', ''); clone.classList.remove('open');
    var host = document.createElement('div'); host.className = 'ios-ctx-row'; host.style.cssText = 'top:' + top + 'px;left:' + left + 'px;width:' + r.width + 'px'; var lst = document.createElement('div'); lst.className = 'ios-list'; lst.appendChild(clone); host.appendChild(lst);
    var menu = document.createElement('div'); menu.className = 'ios-ctx-menu glass'; menu.setAttribute('role', 'menu');
    menu.style.cssText = 'left:' + Math.max(12, Math.min(left + r.width - 240, dev.width - 252)) + 'px;' + (below ? 'top:' + (top + r.height + 14) + 'px' : 'bottom:' + (dev.height - top + 14) + 'px');
    items.forEach(function (it) {
      var b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'menuitem'); b.className = 'ios-ctx-item' + (it.danger ? ' danger' : '');
      b.innerHTML = '<span>' + esc(it.label) + '</span>' + (it.icon ? it.icon.s : ''); b.addEventListener('click', function () { N.closeContext(); N.haptic(it.danger ? 'success' : 'light'); setTimeout(it.run, 60); }); menu.appendChild(b);
    });
    wrap.innerHTML = '<div class="ios-ctx-scrim"></div>'; wrap.appendChild(host); wrap.appendChild(menu); root.appendChild(wrap);
    wrap.querySelector('.ios-ctx-scrim').addEventListener('click', N.closeContext);
    document.getElementById('app').setAttribute('inert', ''); ctxRec = { el: wrap }; N.haptic('light');
    var f = menu.querySelector('button'); if (f) f.focus({ preventScroll: true });
  };
  document.addEventListener('keydown', function (e) { if (ctxRec && e.key === 'Escape') N.closeContext(); });
  N.resolveContext = null; /* set by app.js: function (el) -> items */
  var lp = null, swallow = false;
  document.addEventListener('touchstart', function (e) {
    var el = e.target.closest && e.target.closest('[data-ctx]'); if (!el || !N.resolveContext || ctxRec) return;
    var t = e.touches[0]; lp = { x: t.clientX, y: t.clientY, el: el, timer: setTimeout(function () { if (!lp) return; var items = N.resolveContext(lp.el); if (items) { swallow = true; N.contextMenu(lp.el, items); } lp = null; }, 450) };
  }, { passive: true });
  document.addEventListener('touchmove', function (e) { if (!lp) return; var t = e.touches[0]; if (Math.abs(t.clientX - lp.x) > 10 || Math.abs(t.clientY - lp.y) > 10) { clearTimeout(lp.timer); lp = null; } }, { passive: true });
  ['touchend', 'touchcancel'].forEach(function (n) { document.addEventListener(n, function () { if (lp) { clearTimeout(lp.timer); lp = null; } }); });
  document.addEventListener('click', function (e) { if (swallow) { swallow = false; e.preventDefault(); e.stopPropagation(); } }, true);
  document.addEventListener('contextmenu', function (e) {
    var el = e.target.closest && e.target.closest('[data-ctx]'); if (!el || !N.resolveContext) return;
    e.preventDefault(); if (ctxRec) return; var items = N.resolveContext(el); if (items) N.contextMenu(el, items);
  });

  /* ---------- Swipe-left rows ---------- */
  var sw = null;
  function closeSwipes(except) { document.querySelectorAll('.ios-swipe.open').forEach(function (w) { if (w !== except) { w.classList.remove('open'); var r = w.querySelector(':scope > .ios-row'); if (r) { r.style.transition = ''; r.style.transform = ''; } } }); }
  document.addEventListener('touchstart', function (e) {
    var row = e.target.closest && e.target.closest('.ios-swipe > .ios-row'); if (!row) { closeSwipes(); return; }
    var wrap = row.parentNode, tray = wrap.querySelector('.ios-swipe-actions'); if (!tray) return; var t = e.touches[0];
    closeSwipes(wrap); sw = { x: t.clientX, y: t.clientY, w: tray.offsetWidth, base: wrap.classList.contains('open') ? -tray.offsetWidth : 0, row: row, wrap: wrap, dir: '', x0: 0, t0: Date.now(), cur: 0 };
  }, { passive: true });
  document.addEventListener('touchmove', function (e) {
    if (!sw) return; var t = e.touches[0], dx = t.clientX - sw.x, dy = t.clientY - sw.y;
    if (!sw.dir) { if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return; sw.dir = Math.abs(dx) > Math.abs(dy) * 1.2 ? 'h' : 'v'; if (sw.dir === 'h') sw.row.style.transition = 'none'; }
    if (sw.dir !== 'h') return;
    var x = sw.base + dx; if (x > 0) x = x * .25; if (x < -sw.w) x = -sw.w + (x + sw.w) * .3; sw.cur = x; sw.row.style.transform = 'translateX(' + x + 'px)';
    if (e.cancelable) e.preventDefault();
  }, { passive: false });
  function endSwipe() {
    if (!sw) return; var s = sw; sw = null; if (s.dir !== 'h') return;
    var v = (s.cur - s.base) / Math.max(1, Date.now() - s.t0), open = s.cur < -s.w / 2 || v < -.5; if (v > .5) open = false;
    s.row.style.transition = 'transform .38s cubic-bezier(.2,.9,.25,1.05)'; s.row.style.transform = open ? 'translateX(' + (-s.w) + 'px)' : ''; s.wrap.classList.toggle('open', open);
    if (open) N.haptic('light'); s.swiped = true; s.wrap.dataset.justSwiped = '1'; setTimeout(function () { delete s.wrap.dataset.justSwiped; }, 350);
  }
  document.addEventListener('touchend', endSwipe); document.addEventListener('touchcancel', endSwipe);
  document.addEventListener('click', function (e) {
    var w = e.target.closest && e.target.closest('.ios-swipe');
    if (w && w.dataset.justSwiped) { e.preventDefault(); e.stopPropagation(); return; }
    var row = e.target.closest && e.target.closest('.ios-swipe.open > .ios-row'); if (row) { e.preventDefault(); e.stopPropagation(); closeSwipes(); return; }
    var act = e.target.closest && e.target.closest('[data-swipe-act]');
    if (act && N.onSwipe) { var wr = act.closest('.ios-swipe'); closeSwipes(); N.onSwipe(wr.dataset.ctx, act.dataset.swipeAct); }
  }, true);
})(window.Folio);
