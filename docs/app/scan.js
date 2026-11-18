/* Folio patient app: "Scan your card". A full-screen camera sheet that reads the QR code on a Folio card and finds
   the account it belongs to.
   F.scan.open({ onResult(patient, info), onCancel() }) opens it. F.scan.parse(text) and F.scan.resolve(text) are
   exposed for tests and other callers.
   - Live camera: getUserMedia (back camera, playsinline and muted so it works in an installed iOS PWA). About 10
     frames a second are drawn to a canvas, scaled to 640 px on the long side and decoded with jsQR.
   - jsQR (shared/js/vendor/jsQR.js, Apache-2.0) loads only when the sheet opens. The service worker caches it.
   - Fallback that needs no live camera: take or choose a photo of the card. The photo is decoded at several sizes
     and centre crops.
   - The QR payload is the card's tap link (https://jtq03.github.io/Folio/card/?t=TOKEN&via=qr). A bare token, an
     8-digit Folio ID or a tag code (FO-1004) also works. Foreign QR codes are never opened.
   - All camera tracks stop on close, on success and when the app goes to the background. */
(function (F) {
  'use strict';
  var U = F.UI, h = U.h, raw = U.raw, ic = U.ic, S = F.Store, sel = S.sel, N = F.native || {};
  var LIB = (F.root || '../') + 'shared/js/vendor/jsQR.js';
  var FPS = 10, MAX_SIDE = 640, HINT_AFTER = 15000;
  var libP = null, cur = null;
  /* Icons the shared kit does not have */
  var XI = {
    camera: '<path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.5"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>',
    torch: '<path d="M8 2h8v5l-2 3v12h-4V10L8 7z"/><path d="M12 13v3"/>'
  };
  function si(n, size) { return raw('<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + XI[n] + '</svg>'); }

  function haptic(k) { try { if (N.haptic) N.haptic(k); } catch (e) {} }
  function reduced() {
    var m = document.documentElement.dataset.motion;
    if (m === 'reduce') return true; if (m === 'full') return false;
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }
  function loadLib() {
    if (window.jsQR) return Promise.resolve(window.jsQR);
    if (libP) return libP;
    libP = new Promise(function (res, rej) {
      var s = document.createElement('script'); s.src = LIB; s.async = true;
      s.onload = function () { window.jsQR ? res(window.jsQR) : rej(new Error('jsQR missing')); };
      s.onerror = function () { libP = null; rej(new Error('jsQR failed to load')); };
      document.head.appendChild(s);
    });
    return libP;
  }

  /* ---------- Payload: what did we read? ---------- */
  var TOKEN_RE = /^[A-Za-z0-9]{16,40}$/;
  function parse(text) {
    var t = String(text == null ? '' : text).trim();
    if (!t) return { kind: 'empty' };
    if (/^https?:\/\//i.test(t)) {
      var u; try { u = new URL(t); } catch (e) { return { kind: 'foreign', text: t }; }
      var tok = u.searchParams.get('t');
      if (/\/card\/?(index\.html)?$/.test(u.pathname) && tok) return { kind: 'token', token: tok, folio: true };
      if (/\/card\/?(index\.html)?$/.test(u.pathname) && u.searchParams.get('demo') === '1') return { kind: 'demo' };
      var id = u.searchParams.get('id');
      if (id) return { kind: 'id', id: id };
      return { kind: 'foreign', text: t };
    }
    if (/^[A-Za-z][A-Za-z0-9+.-]*:/.test(t)) return { kind: 'foreign', text: t };
    var bare = t.replace(/[\s\-_.]/g, '');
    if (/^F[O0]\d{3,6}$/i.test(bare) || /^\d{8}$/.test(bare)) return { kind: 'id', id: t };
    if (TOKEN_RE.test(t)) return { kind: 'token', token: t };
    return { kind: 'foreign', text: t };
  }
  /* -> { ok: true, patient } or { ok: false, title, body } */
  function resolve(text) {
    var r = parse(text), p;
    if (r.kind === 'token') {
      p = sel.cardByToken ? sel.cardByToken(r.token) : sel.byToken(r.token);
      if (p && p.card.status !== 'active') return { ok: false, code: 'inactive', title: 'This card is not active', body: 'It was frozen. Unfreeze it in About me, or ask your clinic for help. You can also type your Folio ID.' };
      if (p) return { ok: true, patient: p, via: 'token' };
      if (r.folio) return { ok: false, code: 'unknown', title: 'We could not find this card', body: 'It may have been replaced with a new one. Scan your new card, or type the code on it.' };
      return { ok: false, code: 'foreign', title: 'Not a Folio card', body: 'This QR code is not from a Folio card. Scan the code on the back of your card.' };
    }
    if (r.kind === 'id') {
      p = sel.byAnyId(r.id);
      if (p) return { ok: true, patient: p, via: 'id' };
      return { ok: false, code: 'unknown', title: 'We could not find that ID', body: 'Check the code on your card and try again, or type it instead.' };
    }
    if (r.kind === 'demo') return { ok: false, code: 'demo', title: 'This is the team demo code', body: 'It opens a sample care team view, not an account. Scan your own card.' };
    return { ok: false, code: 'foreign', title: 'Not a Folio card', body: 'This QR code is not from a Folio card. Scan the code on the back of your card.' };
  }

  /* ---------- Decoding ---------- */
  var work = document.createElement('canvas'), wctx = null;
  function ctx2d() { return wctx || (wctx = work.getContext('2d', { willReadFrequently: true })); }
  function decodeFrom(src, sw, sh, maxSide, crop, invert) {
    crop = crop || 1;
    var cw = sw * crop, ch = sh * crop, cx = (sw - cw) / 2, cy = (sh - ch) / 2;
    var k = Math.min(1, maxSide / Math.max(cw, ch)), w = Math.max(1, Math.round(cw * k)), hh = Math.max(1, Math.round(ch * k));
    work.width = w; work.height = hh;
    var c = ctx2d(); c.imageSmoothingEnabled = true; c.drawImage(src, cx, cy, cw, ch, 0, 0, w, hh);
    var d = c.getImageData(0, 0, w, hh);
    var r = window.jsQR(d.data, w, hh, { inversionAttempts: invert || 'dontInvert' });
    return r && r.data ? r.data : '';
  }
  function decodeImage(img) {
    var w = img.naturalWidth || img.width, hh = img.naturalHeight || img.height;
    var tries = [[1024, 1], [800, 1], [1600, 1], [640, 1], [1024, .6], [800, .45], [480, 1], [1200, .75], [2000, 1]];
    for (var i = 0; i < tries.length; i++) {
      var t = decodeFrom(img, w, hh, tries[i][0], tries[i][1], 'attemptBoth');
      if (t) return t;
    }
    return '';
  }
  function fileToImage(file) {
    return new Promise(function (res, rej) {
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () { res(img); setTimeout(function () { URL.revokeObjectURL(url); }, 1000); };
      img.onerror = function () { URL.revokeObjectURL(url); rej(new Error('image')); };
      img.src = url;
    });
  }

  /* ---------- Sheet ---------- */
  var BR = '<svg class="sc-corners" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M2 20V8a6 6 0 0 1 6-6h12M80 2h12a6 6 0 0 1 6 6v12M98 80v12a6 6 0 0 1-6 6H80M20 98H8a6 6 0 0 1-6-6V80"/></svg>';
  var STEPS_DENIED = [
    'Open the Settings app on your iPhone.',
    'Tap Apps, then Safari. On older iOS, tap Safari.',
    'Tap Camera and choose Ask or Allow.',
    'Come back to Folio and tap Try again.'
  ];
  function view() {
    var s = cur.state, msg = cur.msg || {};
    var photo = h`<div class="sc-photo">
        <label class="ios-btn sec sc-filebtn" data-haptic-tap>${si('camera', 20)} Take a photo of the card<input type="file" accept="image/*" capture="environment" class="sc-file" data-sc-file="camera"></label>
        <label class="ios-btn sec sc-filebtn" data-haptic-tap>${si('image', 20)} Choose from library<input type="file" accept="image/*" class="sc-file" data-sc-file="library"></label>
      </div>`;
    var body;
    if (s === 'starting' || s === 'loading') body = h`<div class="sc-panel"><div class="sc-spin" aria-hidden="true"></div><h2 id="sc-h" tabindex="-1">${s === 'loading' ? 'Getting the scanner ready' : 'Asking for the camera'}</h2><p>${s === 'loading' ? 'One moment.' : 'If your iPhone asks, tap Allow. Folio only uses the camera to read your card.'}</p></div>`;
    else if (s === 'live') body = h`<div class="sc-live"><h2 id="sc-h" class="sc-title" tabindex="-1">Scan your card</h2><p class="sc-sub">Point your camera at the QR code on the back of your Folio card.</p>
        <div class="sc-frame ${cur.hint ? 'hinting' : ''}">${raw(BR)}<span class="sc-line" aria-hidden="true"></span></div>
        <p class="sc-hint" role="status" aria-live="polite">${cur.hint ? 'Hold the card steady, QR code facing the camera, in good light.' : ''}</p></div>`;
    else if (s === 'denied') body = h`<div class="sc-panel"><span class="sc-icon" aria-hidden="true">${si('camera', 30)}</span><h2 id="sc-h" tabindex="-1">Camera is off for Folio</h2><p>To scan, let Folio use the camera:</p><ol class="sc-steps">${STEPS_DENIED.map(function (x) { return h`<li>${x}</li>`; })}</ol><p class="sc-small">In the Safari browser you can also tap the aA button, then Website Settings, then Camera. If you added Folio to your Home Screen, close it fully and open it again to get the question back.</p><button type="button" class="ios-btn" data-sc="retry">Try again</button><p class="sc-or">Or use a photo instead:</p></div>`;
    else if (s === 'nocam') body = h`<div class="sc-panel"><span class="sc-icon" aria-hidden="true">${si('camera', 30)}</span><h2 id="sc-h" tabindex="-1">No camera we can use</h2><p>${cur.detail || 'This device has no camera Folio can open right now. Another app may be using it.'}</p><button type="button" class="ios-btn" data-sc="retry">Try again</button><p class="sc-or">Or use a photo instead:</p></div>`;
    else if (s === 'insecure') body = h`<div class="sc-panel"><span class="sc-icon" aria-hidden="true">${ic('lock', 30)}</span><h2 id="sc-h" tabindex="-1">The live camera needs a secure link</h2><p>Open Folio from its https address (or the Home Screen app) to scan live. A photo of the card works here too:</p></div>`;
    else if (s === 'photo') body = h`<div class="sc-panel"><div class="sc-spin" aria-hidden="true"></div><h2 id="sc-h" tabindex="-1">Reading the photo</h2><p>One moment.</p></div>`;
    else if (s === 'nophoto') body = h`<div class="sc-panel"><span class="sc-icon" aria-hidden="true">${ic('info', 30)}</span><h2 id="sc-h" tabindex="-1">We could not find a QR code</h2><p>Take the photo closer, with the whole code in the picture, flat and in good light. Avoid glare from lamps.</p>${cur.hadLive ? h`<button type="button" class="ios-btn" data-sc="retry">Use the live camera</button>` : ''}</div>`;
    else if (s === 'error') body = h`<div class="sc-panel" role="alert"><span class="sc-icon warn" aria-hidden="true">${ic('alert', 30)}</span><h2 id="sc-h" tabindex="-1">${msg.title}</h2><p>${msg.body}</p><button type="button" class="ios-btn" data-sc="again">Scan again</button></div>`;
    else if (s === 'done') body = h`<div class="sc-panel sc-done" role="status"><svg class="sc-check" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="24"/><path d="M15 27l7 7 15-16"/></svg><h2 id="sc-h" tabindex="-1">Card found</h2><p>${cur.found ? sel.full(cur.found) : ''}</p></div>`;
    var showPhoto = ['denied', 'nocam', 'insecure', 'live', 'nophoto', 'error'].indexOf(s) >= 0;
    return h`<div class="sc-top"><button type="button" class="sc-x" data-sc="close" aria-label="Close scanner">${ic('x', 22)}<span>Cancel</span></button>${cur.torch ? h`<button type="button" class="sc-torch" data-sc="torch" aria-pressed="${String(!!cur.torchOn)}" aria-label="Torch">${si('torch', 22)}<span>${cur.torchOn ? 'Torch on' : 'Torch'}</span></button>` : ''}</div>
      ${body}
      ${showPhoto ? h`<div class="sc-foot">${s === 'live' ? h`<p class="sc-or">Camera not working?</p>` : ''}${photo}</div>` : ''}`;
  }
  function paint(focus) {
    if (!cur) return;
    cur.ui.innerHTML = view().s;
    cur.el.dataset.state = cur.state;
    cur.video.hidden = cur.state !== 'live';
    if (focus) { var t = cur.ui.querySelector('#sc-h'); if (t) try { t.focus({ preventScroll: true }); } catch (e) {} }
  }
  function set(state, extra) { if (!cur) return; var was = cur.state; Object.assign(cur, extra || {}, { state: state }); paint(was !== state); }

  /* ---------- Camera ---------- */
  function stopCam() {
    if (!cur) return;
    clearInterval(cur.timer); cur.timer = 0; clearTimeout(cur.hintT); cur.hintT = 0;
    if (cur.stream) { cur.stream.getTracks().forEach(function (t) { try { t.stop(); } catch (e) {} }); cur.stream = null; }
    try { cur.video.pause(); cur.video.srcObject = null; } catch (e) {}
    cur.torch = false; cur.torchOn = false;
  }
  function startCam() {
    if (!cur) return;
    stopCam();
    var md = navigator.mediaDevices;
    if (!window.isSecureContext) { set('insecure'); return; }
    if (!md || !md.getUserMedia) { set('nocam', { detail: 'This browser cannot open the camera. Use a photo of the card instead.' }); return; }
    set('starting');
    var mine = cur;
    md.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } }, audio: false }).then(function (stream) {
      if (cur !== mine || document.hidden) { stream.getTracks().forEach(function (t) { t.stop(); }); return; }
      cur.stream = stream; cur.hadLive = true;
      var v = cur.video; v.srcObject = stream;
      var track = stream.getVideoTracks()[0], caps = {};
      try { caps = track && track.getCapabilities ? track.getCapabilities() : {}; } catch (e) {}
      cur.torch = !!caps.torch;
      var p = v.play(); if (p && p.catch) p.catch(function () {});
      set('live', { hint: false });
      cur.hintT = setTimeout(function () { if (cur === mine && cur.state === 'live') { cur.hint = true; paint(false); } }, HINT_AFTER);
      cur.timer = setInterval(tick, Math.round(1000 / FPS));
    }, function (err) {
      if (cur !== mine) return;
      var n = err && err.name;
      if (n === 'NotAllowedError' || n === 'SecurityError' || n === 'PermissionDeniedError') set('denied');
      else if (n === 'NotFoundError' || n === 'OverconstrainedError' || n === 'DevicesNotFoundError') set('nocam', { detail: 'We could not find a camera on this device. Use a photo of the card instead.' });
      else if (n === 'NotReadableError' || n === 'AbortError') set('nocam', { detail: 'Another app may be using the camera. Close it and tap Try again.' });
      else set('nocam', { detail: 'The camera did not start. Tap Try again, or use a photo of the card.' });
    });
  }
  function tick() {
    if (!cur || cur.state !== 'live' || cur.busy || !window.jsQR) return;
    var v = cur.video; if (v.readyState < 2 || !v.videoWidth) return;
    cur.busy = true;
    var text = '';
    try { text = decodeFrom(v, v.videoWidth, v.videoHeight, MAX_SIDE, 1, 'dontInvert'); } catch (e) {}
    cur.busy = false;
    if (text) handle(text, 'camera');
  }
  function toggleTorch() {
    if (!cur || !cur.stream) return;
    var t = cur.stream.getVideoTracks()[0], on = !cur.torchOn;
    t.applyConstraints({ advanced: [{ torch: on }] }).then(function () { cur.torchOn = on; paint(false); haptic('light'); }, function () { cur.torch = false; paint(false); });
  }

  /* ---------- Results ---------- */
  function handle(text, source) {
    if (!cur) return;
    var r = resolve(text);
    cur.lastText = text;
    if (!r.ok) {
      /* The same foreign code held in view would buzz ten times a second: report it once until Scan again */
      stopCam(); haptic('error'); set('error', { msg: r, code: r.code });
      return;
    }
    stopCam(); haptic('success');
    var mine = cur;
    set('done', { found: r.patient });
    setTimeout(function () {
      if (cur !== mine) return;
      var cb = cur.onResult; close(true);
      if (cb) cb(r.patient, { text: text, source: source, via: r.via });
    }, reduced() ? 250 : 750);
  }
  function onFile(input) {
    var f = input.files && input.files[0]; if (!f || !cur) return;
    var keep = cur.state; stopCam(); set('photo');
    var mine = cur;
    loadLib().then(function () { return fileToImage(f); }).then(function (img) {
      if (cur !== mine) return;
      var text = decodeImage(img);
      if (text) handle(text, 'photo'); else { haptic('warning'); set('nophoto'); }
    }, function () { if (cur === mine) set('nophoto'); });
    input.value = '';
  }

  /* ---------- Open and close ---------- */
  function onVis() { if (!cur) return; if (document.hidden) { if (cur.stream) { stopCam(); cur.paused = true; } } else if (cur.paused) { cur.paused = false; startCam(); } }
  function onKey(e) { if (cur && e.key === 'Escape') { e.preventDefault(); close(false); } }
  function onClick(e) {
    var b = e.target.closest('[data-sc]'); if (!b || !cur) return;
    var a = b.dataset.sc;
    if (a === 'close') close(false);
    else if (a === 'retry' || a === 'again') { haptic('light'); loadLib().then(startCam, function () { set('nocam', { detail: 'The scanner could not load. Check your connection and try again.' }); }); }
    else if (a === 'torch') toggleTorch();
  }
  function onChange(e) { var i = e.target.closest('[data-sc-file]'); if (i) onFile(i); }

  function open(o) {
    if (cur) close(false);
    o = o || {};
    var host = document.getElementById('device') || document.body;
    var el = document.createElement('div');
    el.className = 'sc' + (reduced() ? ' sc-still' : ''); el.id = 'sc';
    el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-labelledby', 'sc-h');
    el.innerHTML = '<video class="sc-video" playsinline muted autoplay hidden aria-hidden="true"></video><div class="sc-shade" aria-hidden="true"></div><div class="sc-ui"></div>';
    var v = el.querySelector('video'); v.muted = true; v.setAttribute('webkit-playsinline', '');
    host.appendChild(el);
    var under = document.getElementById('fw') || document.getElementById('app');
    cur = { el: el, ui: el.querySelector('.sc-ui'), video: v, state: 'loading', onResult: o.onResult, onCancel: o.onCancel, back: document.activeElement, under: under, underInert: under && under.hasAttribute('inert') };
    if (under) under.setAttribute('inert', '');
    el.addEventListener('click', onClick); el.addEventListener('change', onChange);
    document.addEventListener('keydown', onKey); document.addEventListener('visibilitychange', onVis);
    paint(true);
    requestAnimationFrame(function () { el.classList.add('in'); });
    loadLib().then(function () { if (cur && cur.el === el) startCam(); }, function () { if (cur && cur.el === el) set('nocam', { detail: 'The scanner could not load. Check your connection, or type the code on your card.' }); });
    return { close: function () { if (cur && cur.el === el) close(false); } };
  }
  function close(found) {
    if (!cur) return;
    var c = cur; stopCam(); cur = null;
    document.removeEventListener('keydown', onKey); document.removeEventListener('visibilitychange', onVis);
    if (c.under && !c.underInert) c.under.removeAttribute('inert');
    c.el.classList.remove('in'); c.el.classList.add('out');
    setTimeout(function () { c.el.remove(); }, reduced() ? 0 : 220);
    if (!found) { if (c.back && c.back.focus && document.contains(c.back)) try { c.back.focus({ preventScroll: true }); } catch (e) {} if (c.onCancel) c.onCancel(); }
  }

  F.scan = { open: open, close: function () { close(false); }, parse: parse, resolve: resolve, load: loadLib, get isOpen() { return !!cur; },
    /* For tests: are any camera tracks still live? */
    get live() { return !!(cur && cur.stream); } };
})(window.Folio);
