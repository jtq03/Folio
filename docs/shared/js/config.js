/* Folio deploy settings. Loaded on every surface (portal, patient app, adult view) after data.js and before store.js.

   Sync across devices (see README "Turn on sync"):
   - syncUrl: your Firebase Realtime Database URL, like https://your-project-default-rtdb.firebaseio.com
     Leave it empty and every device keeps its own copy, exactly as before.
   - workspace: the shared folder name inside the database. Anyone who knows it can read and change the demo data,
     so for a real demo use a long, unguessable name such as folio-7hq2m9xk4c8w1r5t (at least 20 characters).

   Overrides, for testing and team use (they never change this file):
   - ?ws=NAME sets the workspace on this device and remembers it (localStorage folio.sync.ws). ?ws= with no name clears it.
   - ?sync=URL uses another database for this tab only (sessionStorage folio.sync.url), handy to try sync on one device. */
window.Folio = window.Folio || {};
(function (F) {
  F.CONFIG = { syncUrl: '', workspace: 'folio-demo' };

  var q = null;
  try { q = new URLSearchParams(location.search); } catch (e) {}
  function clean(ws) { return String(ws || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 128); }
  try {
    if (q && q.has('ws')) { var w = clean(q.get('ws')); if (w) localStorage.setItem('folio.sync.ws', w); else localStorage.removeItem('folio.sync.ws'); }
  } catch (e) {}
  try {
    if (q && q.has('sync')) { var u = q.get('sync') || ''; if (u) sessionStorage.setItem('folio.sync.url', u); else sessionStorage.removeItem('folio.sync.url'); }
  } catch (e) {}

  var url = F.CONFIG.syncUrl, ws = F.CONFIG.workspace;
  try { url = sessionStorage.getItem('folio.sync.url') || url; } catch (e) {}
  try { ws = localStorage.getItem('folio.sync.ws') || ws; } catch (e) {}
  url = String(url || '').trim().replace(/\.json$/, '').replace(/\/+$/, '');
  if (url && !/^https?:\/\//.test(url)) url = '';
  /* The effective values for this device: F.SYNC.url is empty when sync is off */
  F.SYNC = { url: url, ws: clean(ws) || 'folio-demo' };
})(window.Folio);
