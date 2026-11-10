/* Folio native helpers: haptics, sharing, calendar files, wake lock, badging, context menus,
   swipe rows and keyboard avoidance. Everything is feature-detected and never throws. */
(function (F) {
  var N = F.native = {};
  var U = F.UI, esc = U.esc;
  var IOS = /iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  N.ios = IOS;
  function reduced() { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'reduce'; } catch (e) { return false; } }
  N.reduced = reduced;
  function appEl() { return document.getElementById('app'); }

  /* ---------- Haptics ----------
     iOS Safari has no vibrate. A hidden <input switch> toggled by a label click fires the Taptic Engine on iOS 18+.
     The synthetic clicks are untrusted, so the app's click handlers ignore them (see isTrusted checks). */
  var hapLabel = null, hapInput = null;
  function hapInit() {
    if (hapLabel || !document.body) return;
    try {
      hapLabel = document.createElement('label'); hapLabel.setAttribute('aria-hidden', 'true'); hapLabel.dataset.haptic = '';
      hapLabel.style.cssText = 'position:fixed;left:-60px;top:-60px;width:40px;height:40px;opacity:.01;pointer-events:none;overflow:hidden';
      hapInput = document.createElement('input'); hapInput.type = 'checkbox'; hapInput.setAttribute('switch', ''); hapInput.tabIndex = -1; hapInput.setAttribute('aria-hidden', 'true');
      hapLabel.appendChild(hapInput); document.body.appendChild(hapLabel);
      /* Keep the hidden switch's change event away from the app's delegated change handlers */
      hapInput.addEventListener('change', function (e) { e.stopPropagation(); });
    } catch (e) { hapLabel = null; }
  }
  N.haptic = function (kind) {
    try {
      if (reduced() && kind !== 'success') return;
      hapInit();
      var tap = function () {
        try {
          if (!hapLabel) return; var ae = document.activeElement;
          hapLabel.click();
          /* A label click can move focus to the hidden switch, which would close the keyboard. Put it back. */
          if (document.activeElement === hapInput) { if (ae && ae !== document.body && ae.focus) ae.focus({ preventScroll: true }); else hapInput.blur(); }
        } catch (e) {}
      };
      if (kind === 'success') { tap(); setTimeout(tap, 70); } else tap();
      if (navigator.vibrate && !IOS) navigator.vibrate(kind === 'success' ? [12, 50, 18] : kind === 'heavy' ? 24 : 9);
    } catch (e) {}
  };

  /* ---------- Share ---------- */
  var CANCEL = 'cancel';
  N.canShare = !!navigator.share;
  N.shareText = function (data) {
    return Promise.resolve().then(function () {
      if (navigator.share) return navigator.share(data).then(function () { return 'shared'; });
      throw new Error('noshare');
    }).catch(function (e) {
      if (e && e.name === 'AbortError') return CANCEL;
      var t = [data.title, data.text, data.url].filter(Boolean).join('\n');
      return (navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { U.toast('Copied. Paste it anywhere.'); return 'copied'; }, function () { U.toast('Sharing is not available here'); return 'none'; });
    });
  };
  function canShareFile(file) { try { return !!(file && navigator.canShare && navigator.share && navigator.canShare({ files: [file] })); } catch (e) { return false; } }
  /* Call this synchronously inside the tap handler: iOS only allows the share sheet during a user gesture. */
  N.shareFile = function (file, data) {
    return Promise.resolve().then(function () {
      if (canShareFile(file)) return navigator.share(Object.assign({ files: [file] }, data)).then(function () { return 'shared'; });
      throw new Error('nofiles');
    }).catch(function (e) {
      if (e && e.name === 'AbortError') return CANCEL;
      if (N.download(file)) { U.toast('Saved ' + file.name); return 'downloaded'; }
      U.toast('Sharing is not available here'); return 'none';
    });
  };
  N.download = function (file) {
    try { var a = document.createElement('a'), u = URL.createObjectURL(file); a.href = u; a.download = file.name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 30000); return true; } catch (e) { return false; }
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
  function fontsReady() {
    var p = document.fonts && document.fonts.load ? Promise.all([document.fonts.load('600 80px Fraunces'), document.fonts.load('italic 400 80px Fraunces'), document.fonts.load('400 40px Prompt'), document.fonts.load('700 30px Prompt')]) : Promise.resolve();
    /* Never wait long: offline the fonts may never arrive, and the fallbacks are fine for an image */
    return Promise.race([p, new Promise(function (r) { setTimeout(r, 1500); })]).catch(function () {});
  }
  function toFile(canvas, name) {
    return new Promise(function (res) {
      try { canvas.toBlob(function (b) { try { res(b ? new File([b], name, { type: 'image/png' }) : null); } catch (e) { res(null); } }, 'image/png'); } catch (e) { res(null); }
    });
  }
  function canvas(W, H) { try { var cv = document.createElement('canvas'); cv.width = W; cv.height = H; var c = cv.getContext('2d'); return c ? { cv: cv, c: c } : null; } catch (e) { return null; } }

  /* Folio card as an image: only the Folio ID and name, never the private tap link. */
  N.cardImage = function (p, fid) {
    return fontsReady().then(function () {
      var W = 1200, H = 756, k = canvas(W, H); if (!k) return null; var cv = k.cv, c = k.c;
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
      var W = 1080, H = 1350, k = canvas(W, H); if (!k) return null; var cv = k.cv, c = k.c;
      var g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#2C4636'); g.addColorStop(1, '#1F2F16'); c.fillStyle = g; c.fillRect(0, 0, W, H);
      c.globalAlpha = .06; for (var i = 0; i < H; i += 4) { c.fillStyle = '#000'; c.fillRect(0, i, W, 1); } c.globalAlpha = 1;
      stackMark(c, W / 2 - 220, 170, 440, true);
      c.textAlign = 'center'; c.fillStyle = '#C5D1EB'; c.font = '700 34px Prompt, system-ui, sans-serif'; c.fillText('I REACHED', W / 2, 700);
      c.fillStyle = '#F0E3CE'; c.font = '600 128px Fraunces, Georgia, serif'; c.fillText('Level ' + level.n, W / 2, 840);
      /* Shrink long level names so they never run off the card */
      var fs = 112; c.font = 'italic 400 ' + fs + 'px Fraunces, Georgia, serif'; while (c.measureText(level.name).width > W - 120 && fs > 56) { fs -= 4; c.font = 'italic 400 ' + fs + 'px Fraunces, Georgia, serif'; }
      c.fillText(level.name, W / 2, 960);
      c.font = '400 38px Prompt, system-ui, sans-serif'; c.fillStyle = '#E9DCC3'; c.fillText('My care team signed me off.', W / 2, 1050);
      c.save(); c.translate(W / 2, 1150); c.rotate(-.06); rr(c, -190, -44, 380, 88, 18); c.strokeStyle = '#E4605F'; c.lineWidth = 7; c.stroke(); c.fillStyle = '#F4B1AC'; c.font = '700 30px Prompt, system-ui, sans-serif'; c.fillText('SIGNED OFF', 20, 11); star(c, -128, 0, 22, '#E4605F'); c.restore();
      c.fillStyle = '#F0E3CE'; c.font = '600 54px Fraunces, Georgia, serif'; c.fillText('folio', W / 2, 1275);
      return toFile(cv, 'folio-level-' + level.n + '.png');
    });
  };

  /* ---------- Calendar (.ics, times in UTC, 1 day reminder) ---------- */
  function pad(n) { return ('0' + n).slice(-2); }
  function utc(d) { return d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + 'T' + pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + pad(d.getUTCSeconds()) + 'Z'; }
  function icsEsc(s) { return String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n'); }
  /* RFC 5545: lines are at most 75 octets. Fold on UTF-8 byte length and never split a character. */
  function fold(line) {
    var out = [], cur = '', bytes = 0, limit = 75;
    for (var i = 0; i < line.length; i++) {
      var ch = line[i], code = line.charCodeAt(i);
      if (code >= 0xD800 && code <= 0xDBFF && i + 1 < line.length) { ch += line[++i]; }
      var b = unescape(encodeURIComponent(ch)).length;
      if (bytes + b > limit) { out.push(cur); cur = ' '; bytes = 1; limit = 75; }
      cur += ch; bytes += b;
    }
    out.push(cur); return out.join('\r\n');
  }
  N.ics = function (v, questions, uidSeed) {
    var d = new Date(v.iso); if (isNaN(d.getTime())) return null;
    var end = new Date(d.getTime() + 3600000), now = new Date();
    var desc = (v.note ? v.note + '\n\n' : '') + (questions && questions.length ? 'Questions to ask:\n' + questions.map(function (q) { return '- ' + q; }).join('\n') + '\n\n' : '') + 'Added from Folio.';
    var L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Folio//Patient app//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'BEGIN:VEVENT',
      'UID:folio-visit-' + String(uidSeed || 'me').replace(/[^\w-]/g, '') + '-' + utc(d).slice(0, 8) + '@folio.app', 'DTSTAMP:' + utc(now),
      'DTSTART:' + utc(d), 'DTEND:' + utc(end), 'SUMMARY:' + icsEsc('Visit: ' + (v.where || 'My care team'))];
    if (v.where) L.push('LOCATION:' + icsEsc(v.where));
    L.push('DESCRIPTION:' + icsEsc(desc), 'BEGIN:VALARM', 'TRIGGER:-P1D', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsEsc('Visit tomorrow: ' + (v.where || 'My care team')), 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR');
    var text = L.map(fold).join('\r\n') + '\r\n';
    try { return new File([text], 'folio-visit.ics', { type: 'text/calendar' }); } catch (e) { try { var b = new Blob([text], { type: 'text/calendar' }); b.name = 'folio-visit.ics'; return b; } catch (e2) { return null; } }
  };
  N.openCalendar = function (file) {
    if (!file) { U.toast('Add a date first'); return Promise.resolve('none'); }
    /* iOS: opening the .ics in a new view shows Calendar's own "Add to Calendar" preview. */
    if (IOS) {
      try { var a = document.createElement('a'), u = URL.createObjectURL(file); a.href = u; a.target = '_blank'; a.rel = 'noopener'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 60000); return Promise.resolve('opened'); } catch (e) {}
    }
    return Promise.resolve().then(function () {
      if (canShareFile(file)) return navigator.share({ files: [file], title: 'Folio visit' }).then(function () { return 'shared'; });
      throw new Error('nofiles');
    }).catch(function (e) {
      if (e && e.name === 'AbortError') return CANCEL;
      if (N.download(file)) { U.toast('Calendar file saved. Open it to add the visit.'); return 'downloaded'; }
      U.toast('Could not make the calendar file'); return 'none';
    });
  };

  /* ---------- Wake lock (QR sheet) ---------- */
  var lock = null, pending = false;
  N.wakeWanted = false;
  N.wake = {
    on: function () {
      try {
        if (!navigator.wakeLock || !navigator.wakeLock.request || pending || (lock && !lock.released)) return;
        pending = true;
        navigator.wakeLock.request('screen').then(function (s) {
          pending = false;
          /* The sheet may have closed while the request was in flight */
          if (!N.wakeWanted) { try { s.release(); } catch (e) {} return; }
          lock = s;
        }, function () { pending = false; });
      } catch (e) { pending = false; }
    },
    off: function () { try { if (lock) { var l = lock; lock = null; l.release().catch(function () {}); } } catch (e) {} },
    held: function () { return !!(lock && !lock.released); }
  };
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible' && N.wakeWanted) N.wake.on(); });

  /* ---------- App badge ---------- */
  var lastBadge = -1;
  N.badge = function (n) {
    if (n === lastBadge) return; lastBadge = n;
    try { if (n > 0 && navigator.setAppBadge) navigator.setAppBadge(n).catch(function () {}); else if (navigator.clearAppBadge) navigator.clearAppBadge().catch(function () {}); } catch (e) {}
  };

  /* ---------- Keyboard avoidance ----------
     iOS changes visualViewport height for the URL bar, rubber-band scrolling and pinch zoom, not only for the keyboard.
     Only treat a shrink as the keyboard while a text field has focus and the page is not zoomed. */
  function editing() { var a = document.activeElement; return !!(a && (a.isContentEditable || (a.matches && a.matches('textarea, select, input:not([type=checkbox]):not([type=radio]):not([type=file]):not([type=button]):not([type=submit]):not([type=range])')))); }
  (function () {
    var vv = window.visualViewport, base = window.innerHeight;
    function set(kb) { var d = document.getElementById('device'); if (!d) return; var on = kb > 0; if (d.classList.contains('kbd') !== on) d.classList.toggle('kbd', on); d.style.setProperty('--kb', on ? kb + 'px' : '0px'); }
    function upd() {
      if (!vv) return;
      if (!editing() || (vv.scale && Math.abs(vv.scale - 1) > .01)) { set(0); if (!editing()) base = Math.max(window.innerHeight, vv.height); return; }
      var kb = Math.round(Math.max(base, window.innerHeight) - vv.height); set(kb > 120 ? kb : 0);
    }
    if (vv) { vv.addEventListener('resize', upd); }
    window.addEventListener('resize', function () { if (!editing()) base = window.innerHeight; upd(); });
    document.addEventListener('focusin', function () { setTimeout(upd, 60); setTimeout(upd, 400); });
    document.addEventListener('focusout', function () {
      setTimeout(function () {
        if (editing()) return; set(0);
        /* iOS can leave the page scrolled after the keyboard closes, which shifts fixed bars. */
        if (window.scrollY || document.documentElement.scrollTop) window.scrollTo(0, 0);
      }, 30);
    });
    N.kbUpdate = upd;
  })();

  /* ---------- Navigation helper (the app's router does the animation) ---------- */
  N.navigate = function (href, dir) {
    if (location.hash === href) return;
    F.ui._dir = dir || ''; location.hash = href;
  };

  /* ---------- Context menu (long press / right click) ---------- */
  var ctxRec = null;
  N.closeContext = function (keepFocus) {
    if (!ctxRec) return; var r = ctxRec; ctxRec = null; r.el.classList.add('out');
    setTimeout(function () {
      r.el.remove();
      if (!document.querySelector('.ios-sheet-wrap')) { var a = appEl(); if (a) a.removeAttribute('inert'); }
      if (!keepFocus && r.anchor && document.body.contains(r.anchor)) { try { r.anchor.focus({ preventScroll: true }); } catch (e) {} }
    }, 200);
  };
  N.contextMenu = function (anchor, items) {
    if (ctxRec || !items || !items.length) return;
    var root = document.getElementById('modal-root'), dev = document.getElementById('device').getBoundingClientRect(), r = anchor.getBoundingClientRect();
    var cs = getComputedStyle(document.documentElement), st = parseFloat(cs.getPropertyValue('--st')) || 0;
    var wrap = document.createElement('div'); wrap.className = 'ios-ctx';
    var top = r.top - dev.top, left = r.left - dev.left, mh = items.length * 50 + 10, gap = 14, minTop = Math.max(st, 20) + 8, maxBottom = dev.height - 24;
    var below = top + r.height + gap + mh <= maxBottom, above = top - gap - mh >= minTop;
    /* If the menu fits on neither side, slide the lifted row so the menu fits below it (like iOS) */
    if (!below && !above) { var shift = top + r.height + gap + mh - maxBottom; top = Math.max(minTop, top - shift); below = true; }
    var clone = anchor.cloneNode(true); clone.removeAttribute('data-ctx'); clone.querySelectorAll('[id]').forEach(function (n) { n.removeAttribute('id'); }); clone.setAttribute('aria-hidden', 'true'); clone.setAttribute('inert', ''); clone.classList.remove('open');
    var row = clone.querySelector(':scope > .ios-row'); if (row) { row.style.transform = ''; row.style.transition = ''; }
    var host = document.createElement('div'); host.className = 'ios-ctx-row'; host.style.cssText = 'top:' + top + 'px;left:' + left + 'px;width:' + r.width + 'px'; var lst = document.createElement('div'); lst.className = 'ios-list'; lst.appendChild(clone); host.appendChild(lst);
    var menu = document.createElement('div'); menu.className = 'ios-ctx-menu glass'; menu.setAttribute('role', 'menu'); menu.setAttribute('aria-label', 'Actions');
    var mw = Math.min(250, dev.width - 24);
    menu.style.cssText = 'width:' + mw + 'px;left:' + Math.max(12, Math.min(left + r.width - mw, dev.width - mw - 12)) + 'px;' + (below ? 'top:' + (top + r.height + gap) + 'px;transform-origin:top right' : 'top:' + (top - gap - mh) + 'px;transform-origin:bottom right');
    items.forEach(function (it) {
      var b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'menuitem'); b.className = 'ios-ctx-item' + (it.danger ? ' danger' : '');
      b.innerHTML = '<span>' + esc(it.label) + '</span>' + (it.icon ? it.icon.s : '');
      b.addEventListener('click', function () { N.closeContext(true); N.haptic(it.danger ? 'success' : 'light'); setTimeout(it.run, 60); }); menu.appendChild(b);
    });
    menu.addEventListener('keydown', function (e) {
      var bs = [].slice.call(menu.querySelectorAll('button')), i = bs.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); bs[(i + 1) % bs.length].focus(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); bs[(i - 1 + bs.length) % bs.length].focus(); }
      else if (e.key === 'Home') { e.preventDefault(); bs[0].focus(); } else if (e.key === 'End') { e.preventDefault(); bs[bs.length - 1].focus(); }
      else if (e.key === 'Tab') { e.preventDefault(); bs[(i + (e.shiftKey ? -1 : 1) + bs.length) % bs.length].focus(); }
    });
    wrap.innerHTML = '<div class="ios-ctx-scrim"></div>'; wrap.appendChild(host); wrap.appendChild(menu); root.appendChild(wrap);
    wrap.querySelector('.ios-ctx-scrim').addEventListener('click', function () { N.closeContext(); });
    var a = appEl(); if (a) a.setAttribute('inert', ''); ctxRec = { el: wrap, anchor: anchor.querySelector('button, a') || anchor }; N.haptic('light');
    var f = menu.querySelector('button'); if (f) f.focus({ preventScroll: true });
  };
  N.contextOpen = function () { return !!ctxRec; };
  document.addEventListener('keydown', function (e) { if (ctxRec && e.key === 'Escape') { e.stopPropagation(); N.closeContext(); } }, true);
  N.resolveContext = null; /* set by app.js: function (el) -> items */
  var lp = null, swallow = false;
  document.addEventListener('touchstart', function (e) {
    swallow = false;
    var el = e.target.closest && e.target.closest('[data-ctx]'); if (!el || !N.resolveContext || ctxRec || e.touches.length > 1) return;
    var t = e.touches[0]; lp = { x: t.clientX, y: t.clientY, el: el, timer: setTimeout(function () { if (!lp) return; var items = N.resolveContext(lp.el); if (items) { swallow = true; N.contextMenu(lp.el, items); } lp = null; }, 450) };
  }, { passive: true });
  document.addEventListener('touchmove', function (e) { if (!lp) return; var t = e.touches[0]; if (Math.abs(t.clientX - lp.x) > 10 || Math.abs(t.clientY - lp.y) > 10) { clearTimeout(lp.timer); lp = null; } }, { passive: true });
  ['touchend', 'touchcancel'].forEach(function (n) {
    document.addEventListener(n, function (e) {
      if (lp) { clearTimeout(lp.timer); lp = null; }
      /* The menu opened under the finger: stop the lift from becoming a tap on the scrim (which would close it) */
      if (swallow && ctxRec) { if (e.cancelable) e.preventDefault(); setTimeout(function () { swallow = false; }, 350); }
    }, { passive: false });
  });
  /* After a long press the finger lifts and the browser sends a click to the row underneath. Swallow that one real click. */
  document.addEventListener('click', function (e) { if (swallow && e.isTrusted) { swallow = false; e.preventDefault(); e.stopPropagation(); } }, true);
  document.addEventListener('contextmenu', function (e) {
    var el = e.target.closest && e.target.closest('[data-ctx]'); if (!el || !N.resolveContext) return;
    e.preventDefault(); if (ctxRec) return; var items = N.resolveContext(el); if (items) N.contextMenu(el, items);
  });

  /* ---------- Swipe-left rows ---------- */
  var sw = null;
  function closeSwipes(except) { document.querySelectorAll('.ios-swipe.open').forEach(function (w) { if (w !== except) { w.classList.remove('open'); var r = w.querySelector(':scope > .ios-row'); if (r) { r.style.transition = ''; r.style.transform = ''; } } }); }
  N.closeSwipes = closeSwipes;
  document.addEventListener('touchstart', function (e) {
    var row = e.target.closest && e.target.closest('.ios-swipe > .ios-row'); if (!row) { if (!(e.target.closest && e.target.closest('.ios-swipe-actions'))) closeSwipes(); return; }
    var wrap = row.parentNode, tray = wrap.querySelector('.ios-swipe-actions'); if (!tray) return; var t = e.touches[0];
    closeSwipes(wrap); sw = { x: t.clientX, y: t.clientY, w: tray.offsetWidth, base: wrap.classList.contains('open') ? -tray.offsetWidth : 0, row: row, wrap: wrap, dir: '', t0: Date.now(), cur: 0 };
    /* A non-passive touchmove is only attached while a row is being touched, so page scrolling never waits on JS */
    document.addEventListener('touchmove', swMove, { passive: false });
  }, { passive: true });
  function swMove(e) {
    if (!sw) return; var t = e.touches[0], dx = t.clientX - sw.x, dy = t.clientY - sw.y;
    if (!sw.dir) { if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return; sw.dir = Math.abs(dx) > Math.abs(dy) * 1.2 ? 'h' : 'v'; if (sw.dir === 'h') sw.row.style.transition = 'none'; }
    if (sw.dir !== 'h') return;
    var x = sw.base + dx; if (x > 0) x = x * .25; if (x < -sw.w) x = -sw.w + (x + sw.w) * .3; sw.cur = x; sw.row.style.transform = 'translateX(' + x + 'px)';
    if (e.cancelable) e.preventDefault();
  }
  function endSwipe() {
    document.removeEventListener('touchmove', swMove, { passive: false });
    if (!sw) return; var s = sw; sw = null; if (s.dir !== 'h') return;
    var v = (s.cur - s.base) / Math.max(1, Date.now() - s.t0), open = s.cur < -s.w / 2 || v < -.5; if (v > .5) open = false;
    s.row.style.transition = 'transform .38s cubic-bezier(.2,.9,.25,1.05)'; s.row.style.transform = open ? 'translateX(' + (-s.w) + 'px)' : ''; s.wrap.classList.toggle('open', open);
    var tray = s.wrap.querySelector('.ios-swipe-actions'); if (tray) tray.querySelectorAll('button').forEach(function (b) { b.tabIndex = open ? 0 : -1; });
    if (open) N.haptic('light'); s.wrap.dataset.justSwiped = '1'; setTimeout(function () { delete s.wrap.dataset.justSwiped; }, 350);
  }
  document.addEventListener('touchend', endSwipe); document.addEventListener('touchcancel', endSwipe);
  document.addEventListener('click', function (e) {
    if (!e.isTrusted) return;
    var w = e.target.closest && e.target.closest('.ios-swipe');
    if (w && w.dataset.justSwiped) { e.preventDefault(); e.stopPropagation(); return; }
    var row = e.target.closest && e.target.closest('.ios-swipe.open > .ios-row'); if (row) { e.preventDefault(); e.stopPropagation(); closeSwipes(); return; }
    var act = e.target.closest && e.target.closest('[data-swipe-act]');
    if (act && N.onSwipe) { var wr = act.closest('.ios-swipe'); closeSwipes(); N.onSwipe(wr.dataset.ctx, act.dataset.swipeAct); }
  }, true);
})(window.Folio);
