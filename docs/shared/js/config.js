/* Folio deploy settings. Loaded on every surface (portal, patient app, adult view) after data.js and before store.js.

   Sync across devices (see README "Turn on sync"):
   - syncUrl: the team's Firebase Realtime Database URL. It is not a secret.
   - workspace: the shared folder name inside the database. It IS the secret: anyone who knows it can read and change
     the demo data. So it stays empty here and is never committed. Sync is off on a device until it has a workspace.
     A device joins by opening a setup link once (any surface with ?ws=NAME). The name must be at least 20 characters,
     long and random, such as folio-7hq2m9xk4c8w1r5tz3.

   Overrides (they never change this file):
   - ?ws=NAME saves the workspace on this device (localStorage folio.sync.ws) and is then taken out of the address bar.
     ?ws= with no name clears it, which turns sync off on this device.
   - ?sync=URL uses another database for this tab only (sessionStorage folio.sync.url). Used by the tests. */
window.Folio = window.Folio || {};
(function (F) {
  F.CONFIG = { syncUrl: 'https://folio-3cb64-default-rtdb.firebaseio.com', workspace: '' };
  /* Production addresses, used by "Copy setup link" */
  F.CONFIG.links = { portal: 'https://jtq03.github.io/Folio/', app: 'https://jtq03.github.io/Folio/app/', card: 'https://jtq03.github.io/Folio/card/?demo=1' };

  var q = null, joined = false;
  try { q = new URLSearchParams(location.search); } catch (e) {}
  function clean(ws) { return String(ws || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 128); }
  try {
    if (q && q.has('ws')) {
      var w = clean(q.get('ws')), had = localStorage.getItem('folio.sync.ws');
      if (w) { localStorage.setItem('folio.sync.ws', w); joined = had !== w; } else localStorage.removeItem('folio.sync.ws');
      /* The workspace name is the secret, so it does not stay in the address bar (or in a bookmark or screenshot) */
      q.delete('ws');
      var rest = q.toString();
      history.replaceState(history.state, '', location.pathname + (rest ? '?' + rest : '') + location.hash);
    }
  } catch (e) {}
  try {
    if (q && q.has('sync')) { var u = q.get('sync') || ''; if (u) sessionStorage.setItem('folio.sync.url', u); else sessionStorage.removeItem('folio.sync.url'); }
  } catch (e) {}

  var url = F.CONFIG.syncUrl, ws = F.CONFIG.workspace;
  try { url = sessionStorage.getItem('folio.sync.url') || url; } catch (e) {}
  try { ws = localStorage.getItem('folio.sync.ws') || ws; } catch (e) {}
  url = String(url || '').trim().replace(/\.json$/, '').replace(/\/+$/, '');
  if (url && !/^https?:\/\//.test(url)) url = '';
  /* The effective values for this device. Sync runs only with both a URL and a workspace. */
  F.SYNC = { url: url, ws: clean(ws), joined: joined };
})(window.Folio);
