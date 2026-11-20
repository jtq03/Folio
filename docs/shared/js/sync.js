/* Folio sync across devices. Loaded after store.js and before ui.js on every surface.

   Local first: this browser's copy (localStorage folio.proto.v2) stays the source of truth and works offline.
   When F.SYNC.url is set (config.js), the shared parts are mirrored to a Firebase Realtime Database over its REST API
   (no SDK, no build): writes are PATCH requests, reads are a Server-Sent Events stream, with polling as a fallback.

   Remote layout, under <url>/folio/<workspace>/:
     patients/<id>  team  resources  program  clinic  access/<id>  meta
   Each record is { u: updated ms, c: client id, s: schema, j: "<the JSON as a string>" }. Keeping the value as a string
   avoids Firebase's rules on keys (no . $ # [ ] /) and its handling of arrays and empty values, and it carries photos.

   Merge rules: last writer wins per record, by (u, then client id). Access log entries are append-only and merged by id.
   Not synced, by design: anything that belongs to one device (accessibility, sign-in, setup, seen markers, the portal's
   signed-in person "me", migration flags). Those live outside the synced keys. */
(function (F) {
  'use strict';
  var S = F.Store, CFG = F.SYNC || { url: '', ws: '' };
  /* Schema 2 = level system v2 (patient skills keyed by skill id, program.requiredSkills per level). A device on an
     older schema sees meta.schema go up and pauses instead of writing old-model data over new. */
  var SCHEMA = 2, KEYS = ['team', 'resources', 'program', 'clinic'], ACCESS_CAP = 500;
  var listeners = [];
  var MIN_WS = 20, SHORT = 'Workspace name is too short. Use at least 20 characters.', BLOCKED = 'Sync is blocked. Check the database rules.';
  var tooShort = !!(CFG.url && CFG.ws && CFG.ws.length < MIN_WS);
  var Sync = F.Sync = {
    /* enabled: this device is syncing. A workspace that is too short shows an error and keeps sync off. */
    enabled: !!(CFG.url && CFG.ws) && !tooShort, ws: CFG.ws, url: CFG.url, last: 0, mode: '',
    status: tooShort ? 'error' : CFG.url && CFG.ws ? 'connecting' : 'off', why: tooShort ? SHORT : '',
    onStatus: function (fn) { listeners.push(fn); },
    now: function () { return Promise.resolve(); },
    /* Plain words for the status chip */
    text: function () {
      switch (Sync.status) {
        case 'off': return 'Sync is off. Devices keep their own copy.';
        case 'connecting': return 'Connecting';
        case 'syncing': return 'Syncing';
        case 'offline': return 'Offline, will sync when you are back';
        case 'error': return Sync.why || BLOCKED;
        default: return 'Synced ' + ago(Sync.last);
      }
    },
    stats: { writes: 0, bytes: 0, events: 0, polls: 0 }
  };
  function ago(t) {
    var s = Math.round((Date.now() - t) / 1000);
    if (!t || s < 45) return 'just now';
    var m = Math.round(s / 60); if (m < 60) return m + ' min ago';
    var hr = Math.round(m / 60); if (hr < 24) return hr + (hr === 1 ? ' hour ago' : ' hours ago');
    try { return 'on ' + new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); } catch (e) { return 'earlier'; }
  }
  /* Any element with data-sync-text (or data-sync-state) shows the live status without a page re-render */
  function paint() {
    try {
      document.querySelectorAll('[data-sync-text]').forEach(function (el) { var t = Sync.text(); if (el.textContent !== t) el.textContent = t; });
      document.querySelectorAll('[data-sync-state]').forEach(function (el) { el.setAttribute('data-sync-state', Sync.status); });
    } catch (e) {}
  }
  function setStatus(st, why) {
    if (st === 'synced') Sync.last = Date.now();
    var changed = Sync.status !== st; Sync.status = st; Sync.why = why || '';
    paint(); if (changed) listeners.forEach(function (f) { try { f(st); } catch (e) {} });
  }
  /* Setup links: open one on a new device to join this workspace. surface is portal, app or card. */
  Sync.link = function (surface) {
    var base = (F.CONFIG.links || {})[surface] || '';
    return base && Sync.ws ? base + (base.indexOf('?') < 0 ? '?' : '&') + 'ws=' + encodeURIComponent(Sync.ws) : '';
  };
  Sync.copy = function (surface) {
    var t = Sync.link(surface); if (!t) return Promise.resolve(false);
    function legacy() { try { var a = document.createElement('textarea'); a.value = t; a.setAttribute('readonly', ''); a.style.position = 'fixed'; a.style.opacity = '0'; document.body.appendChild(a); a.select(); var r = document.execCommand('copy'); a.remove(); return r; } catch (e) { return false; } }
    try { if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(t).then(function () { return true; }, function () { return legacy(); }); } catch (e) {}
    return Promise.resolve(legacy());
  };
  /* One toast after opening a setup link, once the first sync finishes (or the error, if it cannot) */
  if (CFG.joined) {
    var toasted = false;
    var joinToast = function () {
      if (toasted || !(F.UI && F.UI.toast)) return;
      if (Sync.status === 'synced') { toasted = true; F.UI.toast('Synced with your team workspace'); }
      else if (Sync.status === 'error') { toasted = true; F.UI.toast(Sync.text()); }
    };
    listeners.push(joinToast); setTimeout(joinToast, 600);
  }
  document.addEventListener('folio:rendered', paint);
  setInterval(paint, 30000);
  if (!Sync.enabled) return; /* Off: nothing else runs, so the app behaves exactly as before */

  var BASE = CFG.url + '/folio/' + encodeURIComponent(CFG.ws);
  var cid = (function () {
    var k = 'folio.sync.cid', v = null;
    try { v = localStorage.getItem(k); } catch (e) {}
    if (!v) { v = Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4); try { localStorage.setItem(k, v); } catch (e) {} }
    return v;
  })();
  Sync.cid = cid;

  /* ---------- Bookkeeping for this device and workspace ----------
     h: hash of each record as last sent or received   v: its version [u, c]   d: records waiting to be sent
     a: access ids already known   reset: the workspace reset stamp this copy follows   pr: a reset still to send */
  var BOOK = 'folio.sync.book.' + CFG.ws, book;
  function freshBook() { return { h: {}, v: {}, d: {}, a: {}, reset: 0, pr: 0 }; }
  function loadBook() { try { book = JSON.parse(localStorage.getItem(BOOK) || 'null'); } catch (e) { book = null; } if (!book || typeof book !== 'object') book = freshBook(); ['h', 'v', 'd', 'a'].forEach(function (k) { if (!book[k]) book[k] = {}; }); }
  function saveBook() { try { localStorage.setItem(BOOK, JSON.stringify(book)); } catch (e) {} }
  loadBook();

  var maxU = 0;
  function stamp() { var n = Math.max(Date.now(), maxU + 1); maxU = n; return n; }
  function cmp(a, b) { a = a || [0, '']; b = b || [0, '']; if (a[0] !== b[0]) return a[0] > b[0] ? 1 : -1; return a[1] === b[1] ? 0 : (String(a[1]) > String(b[1]) ? 1 : -1); }
  function hash(str) { var h = 0x811c9dc5; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = (h * 0x01000193) >>> 0; } return h.toString(36) + ':' + str.length; }
  /* Firebase keys cannot hold . $ # [ ] / so ids are escaped the URL way */
  function ek(k) { return String(k).replace(/[.$#\[\]\/%]/g, function (c) { return '%' + c.charCodeAt(0).toString(16).toUpperCase(); }); }
  function dk(k) { try { return decodeURIComponent(k); } catch (e) { return k; } }

  /* ---------- Local records ---------- */
  function st() { return S.get(); }
  function localPaths() { var o = (st().patients || []).map(function (p) { return 'patients/' + p.id; }); KEYS.forEach(function (k) { if (st()[k] !== undefined) o.push(k); }); return o; }
  function localValue(path) {
    if (path.indexOf('patients/') === 0) { var id = path.slice(9), p = (st().patients || []).filter(function (x) { return x.id === id; })[0]; if (!p) return undefined; var c = Object.assign({}, p); delete c._u; return c; }
    return st()[path];
  }
  function localJson(path) { var v = localValue(path); return v === undefined ? undefined : JSON.stringify(v); }
  function rec(path, j) { var v = book.v[path] || [stamp(), cid]; return { u: v[0], c: v[1], s: SCHEMA, j: j }; }

  /* Find what changed since the last send or receive. Runs after local commits (debounced), never on render. */
  function diff() {
    loadBook();
    var touched = false;
    localPaths().forEach(function (path) {
      var j = localJson(path), hh = hash(j);
      if (book.h[path] === hh) return;
      var u = stamp(); book.h[path] = hh; book.v[path] = [u, cid]; book.d[path] = 1; touched = true;
      if (path.indexOf('patients/') === 0) { var p = S.sel.patient(path.slice(9)); if (p) p._u = u; }
    });
    var ids = {};
    (st().access || []).forEach(function (a) { if (!a || !a.id) return; ids[a.id] = 1; if (!book.a[a.id]) { book.a[a.id] = 1; book.d['access/' + a.id] = 1; touched = true; } });
    Object.keys(book.a).forEach(function (id) { if (!ids[id]) delete book.a[id]; });
    if (touched) { S.persist(); }
    saveBook();
    return touched;
  }
  /* First time on this workspace: remember what this device has, with no version, so the remote copy wins
     for every record both sides have, and records only this device has are sent up. */
  function baseline() {
    localPaths().forEach(function (path) {
      book.h[path] = hash(localJson(path));
      var p = path.indexOf('patients/') === 0 ? S.sel.patient(path.slice(9)) : null;
      book.v[path] = [0, ''];
      if (p && p._u) book.v[path] = [p._u, cid];
    });
    saveBook();
  }

  /* ---------- Sending ---------- */
  var inflight = false, retryN = 0, retryT = 0, connected = false, readOnly = false;
  function online() { return navigator.onLine !== false; }
  function req(method, path, body, keepalive) {
    var payload = body === undefined ? undefined : JSON.stringify(body);
    Sync.stats.writes += method === 'GET' ? 0 : 1; if (payload) Sync.stats.bytes += payload.length;
    var o = { method: method, headers: payload ? { 'Content-Type': 'application/json' } : {}, body: payload, cache: 'no-store' };
    if (keepalive && payload && payload.length < 60000) o.keepalive = true;
    return fetch(BASE + (path ? '/' + path : '') + '.json' + (method === 'GET' ? '' : '?print=silent'), o).then(function (r) {
      if (r.status === 401 || r.status === 403) { var e = new Error('denied'); e.denied = true; throw e; }
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return method === 'GET' ? r.json() : null;
    });
  }
  function fullBody() {
    var out = { meta: { schema: SCHEMA, reset: book.reset, by: cid }, patients: {}, access: {} };
    localPaths().forEach(function (path) { var j = localJson(path); if (path.indexOf('patients/') === 0) out.patients[ek(path.slice(9))] = rec(path, j); else out[path] = rec(path, j); });
    (st().access || []).forEach(function (a) { if (a && a.id) out.access[ek(a.id)] = { u: book.reset, c: cid, s: SCHEMA, j: JSON.stringify(a) }; });
    return out;
  }
  function flush(keepalive) {
    if (readOnly || inflight || !online()) { if (!online()) setStatus('offline'); return Promise.resolve(); }
    loadBook();
    /* Nothing goes up before this page has read the workspace once, so a device that missed a reset cannot undo it */
    if (!connected && !book.pr) return Promise.resolve();
    /* A reset replaces the whole workspace in one write */
    if (book.pr) {
      inflight = true; setStatus('syncing');
      return req('PUT', '', fullBody(), keepalive).then(function () { inflight = false; retryN = 0; book.pr = 0; book.d = {}; saveBook(); return flush(keepalive); }, fail);
    }
    var paths = Object.keys(book.d);
    if (!paths.length && !book.sm) { if (connected) setStatus('synced'); return Promise.resolve(); }
    var body = {}, size = 0, sent = {};
    for (var i = 0; i < paths.length; i++) {
      var path = paths[i], val;
      if (path.indexOf('access/') === 0) {
        var id = path.slice(7), a = (st().access || []).filter(function (x) { return x.id === id; })[0];
        if (!a) { delete book.d[path]; continue; }
        val = { u: Date.parse(a.time) || stamp(), c: cid, s: SCHEMA, j: JSON.stringify(a) };
        body['access/' + ek(id)] = val;
      } else {
        var j = localJson(path);
        if (j === undefined) { delete book.d[path]; continue; }
        val = rec(path, j);
        body[path.indexOf('patients/') === 0 ? 'patients/' + ek(path.slice(9)) : path] = val;
      }
      sent[path] = book.v[path] ? book.v[path].join('|') : 'a';
      size += (val.j || '').length;
      if (size > 400000) break; /* keep each request small; the rest goes in the next one */
    }
    if (!Object.keys(body).length && !book.sm) { saveBook(); if (connected) setStatus('synced'); return Promise.resolve(); }
    if (book.sm) body.meta = { schema: SCHEMA, reset: book.reset, by: cid };
    inflight = true; setStatus('syncing');
    return req('PATCH', '', body, keepalive).then(function () {
      inflight = false; retryN = 0; loadBook();
      Object.keys(sent).forEach(function (p) { var now = book.v[p] ? book.v[p].join('|') : 'a'; if (now === sent[p]) delete book.d[p]; });
      if (body.meta) book.sm = 0;
      saveBook();
      return Object.keys(book.d).length ? flush(keepalive) : (connected ? setStatus('synced') : null);
    }, fail);
  }
  function fail(e) {
    inflight = false;
    if (e && e.denied) { readOnly = true; setStatus('error', BLOCKED); return; }
    setStatus('offline');
    retryN = Math.min(retryN + 1, 6); clearTimeout(retryT);
    retryT = setTimeout(function () { flush(); }, Math.min(30000, 1000 * Math.pow(2, retryN)) + Math.random() * 300);
  }
  var debT = 0;
  function schedule() { clearTimeout(debT); debT = setTimeout(function () { diff(); flush(); }, 400); }
  S.onCommit(schedule);

  /* Reset demo data (after its confirmation) replaces the workspace for every device */
  S.onReset(function () {
    S.applyRemote(function () {}); /* run the migrations on the fresh seed, quietly */
    book = freshBook(); var now = stamp(); book.reset = now;
    localPaths().forEach(function (path) { book.h[path] = hash(localJson(path)); book.v[path] = [now, cid]; });
    (st().access || []).forEach(function (a) { if (a && a.id) book.a[a.id] = 1; });
    (st().patients || []).forEach(function (p) { p._u = now; });
    S.persist(); book.pr = 1; saveBook(); flush();
  });

  /* ---------- Receiving ---------- */
  var mirror = null, gotSnapshot = false;
  function mirrorMeta() { return mirror && typeof mirror === 'object' ? mirror.meta : null; }
  function at(segs) { var o = mirror; for (var i = 0; i < segs.length; i++) { if (!o || typeof o !== 'object') return undefined; o = o[segs[i]]; } return o; }
  function setAt(segs, val) {
    if (!segs.length) { mirror = val; return; }
    if (!mirror || typeof mirror !== 'object') mirror = {};
    var o = mirror;
    for (var i = 0; i < segs.length - 1; i++) { if (!o[segs[i]] || typeof o[segs[i]] !== 'object') o[segs[i]] = {}; o = o[segs[i]]; }
    if (val === null || val === undefined) delete o[segs[segs.length - 1]]; else o[segs[segs.length - 1]] = val;
  }
  function parseRec(r) {
    if (!r || typeof r !== 'object' || typeof r.j !== 'string') return null;
    try { return { u: +r.u || 0, c: String(r.c || ''), s: +r.s || 1, j: r.j, val: JSON.parse(r.j) }; } catch (e) { return null; }
  }
  function segsOf(path) { return String(path || '/').split('/').filter(Boolean); }

  /* Event from the stream (or a poll): update the mirror, then merge the records it touched */
  function onEvent(kind, msg) {
    Sync.stats.events++;
    if (!msg || typeof msg !== 'object') return;
    var base = segsOf(msg.path), touched = {}, all = false;
    function note(segs) {
      if (!segs.length) { all = true; return; }
      var top = segs[0];
      if (top === 'meta') { all = true; return; }
      if (top === 'patients' || top === 'access') {
        if (segs.length === 1) { var kids = at([top]) || {}; Object.keys(kids).forEach(function (k) { touched[top + '/' + dk(k)] = 1; }); }
        else touched[top + '/' + dk(segs[1])] = 1;
      } else if (KEYS.indexOf(top) >= 0) touched[top] = 1;
    }
    if (kind === 'put') { setAt(base, msg.data); note(base); }
    else if (kind === 'patch' && msg.data && typeof msg.data === 'object') {
      Object.keys(msg.data).forEach(function (k) { var segs = base.concat(segsOf(k)); setAt(segs, msg.data[k]); note(segs); });
    }
    if (all || !gotSnapshot) snapshot(); else merge(Object.keys(touched));
  }

  function snapshot() {
    gotSnapshot = true; connected = true; loadBook();
    var meta = mirrorMeta(), hasData = mirror && typeof mirror === 'object' && (mirror.patients || meta);
    if (meta && +meta.schema > SCHEMA) { readOnly = true; setStatus('error', 'Sync paused. Another device runs a newer Folio. Reload to update.'); return; }
    /* An older workspace: raise its schema so older devices pause (they only check meta.schema) */
    if (meta && +meta.schema < SCHEMA) book.sm = 1;
    if (!hasData) {
      /* Empty workspace: this device seeds it (first device wins). A populated workspace is never wiped by an empty device. */
      if (!book.reset) book.reset = stamp();
      book.sm = 1;
      localPaths().forEach(function (path) { book.h[path] = hash(localJson(path)); if (!book.v[path] || !book.v[path][0]) book.v[path] = [stamp(), cid]; book.d[path] = 1; });
      (st().access || []).forEach(function (a) { if (a && a.id) { book.a[a.id] = 1; book.d['access/' + a.id] = 1; } });
      saveBook(); flush(); return;
    }
    if (meta && +meta.reset > (book.reset || 0) && book.reset) {
      /* Someone reset the demo data: start from the seed, then take the workspace as it is now */
      S.applyRemote(function (s) { var sd = S.seed(); ['patients', 'team', 'resources', 'program', 'clinic', 'access'].forEach(function (k) { s[k] = sd[k]; }); });
      book = freshBook(); book.reset = +meta.reset;
      baseline();
    } else if (!book.reset) { book.reset = meta ? +meta.reset || 0 : 0; baseline(); }
    var paths = {};
    Object.keys(mirror.patients || {}).forEach(function (k) { paths['patients/' + dk(k)] = 1; });
    KEYS.forEach(function (k) { if (mirror[k]) paths[k] = 1; });
    Object.keys(mirror.access || {}).forEach(function (k) { paths['access/' + dk(k)] = 1; });
    /* Records only this device has go up */
    localPaths().forEach(function (p) { if (!paths[p]) { book.d[p] = 1; if (!book.v[p] || !book.v[p][0]) book.v[p] = [stamp(), cid]; } });
    (st().access || []).forEach(function (a) { if (a && a.id && !paths['access/' + a.id]) { book.a[a.id] = 1; book.d['access/' + a.id] = 1; } });
    merge(Object.keys(paths));
  }

  function remoteRec(path) {
    if (path.indexOf('patients/') === 0) return parseRec(at(['patients', ek(path.slice(9))]));
    if (path.indexOf('access/') === 0) return parseRec(at(['access', ek(path.slice(7))]));
    return parseRec(at([path]));
  }
  var staleT = {};
  function merge(paths, recheck) {
    var apply = [], addAccess = [], dirty = false;
    var haveAccess = {}; (st().access || []).forEach(function (a) { if (a && a.id) haveAccess[a.id] = 1; });
    paths.forEach(function (path) {
      var r = remoteRec(path); if (!r) return;
      if (r.u > maxU && r.u < Date.now() + 864e5) maxU = r.u;
      if (path.indexOf('access/') === 0) {
        var id = path.slice(7); book.a[id] = 1; delete book.d[path];
        if (!haveAccess[id] && r.val && r.val.id) { addAccess.push(r.val); haveAccess[id] = 1; }
        return;
      }
      var lv = book.v[path] || [0, ''], rv = [r.u, r.c], c = cmp(rv, lv);
      var exists = localValue(path) !== undefined;
      if (c > 0 || !exists) { apply.push({ path: path, val: r.val, v: rv, s: r.s }); }
      else if (c < 0 && hash(r.j) !== book.h[path]) {
        /* This device has the newer copy and the server holds an older write. The device that made the newer copy
           sends it again now; any other device waits a moment and only steps in if it is still stale. */
        if (lv[1] === cid || recheck) { book.d[path] = 1; dirty = true; }
        else { clearTimeout(staleT[path]); staleT[path] = setTimeout(function () { delete staleT[path]; merge([path], true); }, 2500); }
      }
    });
    if (apply.length || addAccess.length) {
      S.applyRemote(function (s) {
        apply.forEach(function (x) {
          if (x.path.indexOf('patients/') === 0) {
            var id = x.path.slice(9), i = -1; x.val._u = x.v[0];
            (s.patients || []).forEach(function (p, k) { if (p.id === id) i = k; });
            if (i >= 0) s.patients[i] = x.val; else s.patients.unshift(x.val);
          } else s[x.path] = x.val;
        });
        if (addAccess.length) {
          s.access = (s.access || []).concat(addAccess).sort(function (a, b) { return a.time < b.time ? 1 : a.time > b.time ? -1 : 0; }).slice(0, ACCESS_CAP);
        }
      });
      /* What the device holds now (after migrations) counts as received, so it is not sent back */
      apply.forEach(function (x) {
        book.h[x.path] = hash(localJson(x.path)); book.v[x.path] = x.v; delete book.d[x.path];
        /* A record written by an older schema was upgraded here by migrate(): send the upgraded copy back up */
        if (x.s < SCHEMA && x.path.indexOf('patients/') === 0) { book.v[x.path] = [stamp(), cid]; book.d[x.path] = 1; }
      });
      (st().access || []).forEach(function (a) { if (a && a.id) book.a[a.id] = 1; });
    }
    saveBook();
    if (Object.keys(book.d).length || dirty || book.pr || book.sm) flush(); else if (!inflight) setStatus('synced');
  }

  /* ---------- Stream, with polling as the fallback ---------- */
  var es = null, esFails = 0, esT = 0, pollT = 0, polling = false, snapT = 0;
  function openStream() {
    closeStream();
    if (document.hidden || readOnly) return;
    if (!online()) { setStatus('offline'); return; }
    if (!window.EventSource || esFails >= 3) { startPolling(); return; }
    if (!connected) setStatus('connecting');
    Sync.mode = 'stream';
    try { es = new EventSource(BASE + '.json'); } catch (e) { esFails++; startPolling(); return; }
    var opened = false;
    es.addEventListener('open', function () { opened = true; });
    es.addEventListener('put', function (e) { esFails = 0; clearTimeout(snapT); try { onEvent('put', JSON.parse(e.data)); } catch (x) {} });
    es.addEventListener('patch', function (e) { esFails = 0; try { onEvent('patch', JSON.parse(e.data)); } catch (x) {} });
    es.addEventListener('keep-alive', function () {});
    es.addEventListener('cancel', function () { closeStream(); readOnly = true; setStatus('error', BLOCKED); });
    es.addEventListener('auth_revoked', function () { closeStream(); esT = setTimeout(openStream, 1000); });
    es.onerror = function () {
      if (!opened || (es && es.readyState === 2)) {
        esFails++; closeStream();
        /* A stream refused by the rules only says "error", so one plain read finds out why (and serves the data if it can) */
        if (!opened && esFails === 1) pollOnce();
        if (readOnly) return;
        if (!online()) { setStatus('offline'); return; }
        setStatus(connected ? 'offline' : 'connecting');
        esT = setTimeout(openStream, Math.min(30000, 1000 * Math.pow(2, esFails)));
      }
    };
    /* A stream that opens but never sends its first snapshot (some networks buffer it) falls back to one read */
    clearTimeout(snapT); snapT = setTimeout(function () { if (!gotSnapshot) pollOnce(); }, 8000);
  }
  function closeStream() { clearTimeout(esT); if (es) { try { es.close(); } catch (e) {} es = null; } }
  function pollOnce() {
    if (!online()) { setStatus('offline'); return Promise.resolve(); }
    Sync.stats.polls++;
    return req('GET', '').then(function (data) { mirror = data; snapshot(); }, function (e) { if (e && e.denied) { readOnly = true; setStatus('error', BLOCKED); } else setStatus('offline'); });
  }
  function startPolling() {
    Sync.mode = 'poll'; if (polling) return; polling = true;
    (function tick() { if (!polling) return; if (!document.hidden) pollOnce(); pollT = setTimeout(tick, 4000); })();
  }
  function stopPolling() { polling = false; clearTimeout(pollT); }

  function start() {
    /* Edits made while this tab was closed (or before the last send finished) are found by comparing with the bookkeeping */
    if (book.reset) diff(); else baseline();
    if (book.reset && Object.keys(book.d).length) setStatus('syncing');
    openStream();
  }
  Sync.now = function () { diff(); return flush().then(function () { return pollOnce(); }); };
  Sync._debug = function () { return { book: book, mirror: mirror, connected: connected, mode: Sync.mode, esFails: esFails }; };

  window.addEventListener('online', function () { retryN = 0; openStream(); if (polling) pollOnce(); flush(); });
  window.addEventListener('offline', function () { setStatus('offline'); });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { diff(); flush(true); closeStream(); }
    else { gotSnapshot = false; if (polling) pollOnce(); else openStream(); }
  });
  window.addEventListener('pagehide', function () { clearTimeout(debT); diff(); flush(true); });
  /* Another tab on this device changed the data: let this tab's sync see it too */
  window.addEventListener('storage', function (e) { if (e.key === 'folio.proto.v2') schedule(); });

  start();
})(window.Folio);
