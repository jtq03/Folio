/* Portal memory: what this device remembers between visits, and how to forget it.
   Remembered in localStorage (survives reloads, new tabs and browser restarts):
   - folio.portal.user      who signed in (whose view)
   - folio.portal.welcomed  people who dismissed the Home welcome card
   - folio.portal.view.v1   last page and the Patients and Access log filters
   Log out (Settings or the sidebar) and the hidden team link ?logout=1 clear all three, so the full demo flow
   (intro, sign in, whose view, welcome card) can run again. Patient data (folio.proto.v2), accessibility
   settings and the adult care view's own keys are never touched here. Load after the pages, before portal.js. */
(function (F) {
  var K = { user: 'folio.portal.user', welcomed: 'folio.portal.welcomed', view: 'folio.portal.view.v1', legacyIntro: 'folio.portal.intro.v1' };
  var VIEW = ['pf', 'ps', 'plv', 'af'];
  var DEFAULTS = { pf: 'all', ps: 'priority', plv: 0, af: 'all', pq: '', aq: '' };

  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function del(k) { try { localStorage.removeItem(k); } catch (e) {} }
  function readView() { try { return JSON.parse(get(K.view) || '{}') || {}; } catch (e) { return {}; } }

  /* Called after every signed-in render. Only writes when something changed. */
  var lastSaved = '';
  function saveView() {
    var v = { route: location.hash || '#/' };
    VIEW.forEach(function (k) { if (F.ui[k] != null) v[k] = F.ui[k]; });
    var s = JSON.stringify(v);
    if (s !== lastSaved) { lastSaved = s; set(K.view, s); }
  }

  /* Put back filters (a link that carries its own filter, like #/patients?f=ready, wins) */
  function restore() {
    var v = readView(), linkFilter = /[?&](f|lv)=/.test(location.hash);
    VIEW.forEach(function (k) {
      if (v[k] == null) return;
      if (linkFilter && (k === 'pf' || k === 'plv')) return;
      F.ui[k] = v[k];
    });
    /* A fresh open with no page in the address goes back to the last page, if someone is signed in */
    if ((!location.hash || location.hash === '#' || location.hash === '#/') && get(K.user) && v.route && v.route !== '#/' && /^#\/[\w\/?=&-]*$/.test(v.route)) {
      try { history.replaceState(null, '', location.pathname + location.search + v.route); } catch (e) {}
    }
  }

  /* Forget the sign-in and the one-time UI. In-memory UI state goes back to its defaults too. */
  function forget() {
    del(K.user); del(K.welcomed); del(K.view); del(K.legacyIntro);
    lastSaved = '';
    Object.keys(DEFAULTS).forEach(function (k) { F.ui[k] = DEFAULTS[k]; });
    F.ui.signin = 1;
  }

  /* Hidden team helper: index.html?logout=1 logs out, then removes the parameter from the address */
  if (/[?&]logout=1(&|$)/.test(location.search)) {
    forget();
    var qs = location.search.replace(/([?&])logout=1(&|$)/, function (_, a, b) { return b ? a : ''; }).replace(/[?&]$/, '');
    try { history.replaceState(null, '', location.pathname + qs + '#/'); } catch (e) {}
  } else {
    restore();
  }

  /* Another tab signed in, logged out or dismissed the welcome card: follow it here */
  window.addEventListener('storage', function (e) {
    if (e.key !== K.user && e.key !== K.welcomed && e.key !== null) return;
    if (e.key === K.user || e.key === null) { F.ui.signin = 1; if (!get(K.user)) { var d = document.querySelector('dialog[open]'); if (d) d.close(); } }
    if (F.rerender) F.rerender(e.key === K.user || e.key === null);
  });

  F.Mem = {
    keys: K,
    user: function () { return get(K.user) || ''; },
    setUser: function (id) { set(K.user, id); },
    welcomed: function (id) { try { return (JSON.parse(get(K.welcomed) || '[]')).indexOf(id) >= 0; } catch (e) { return true; } },
    markWelcomed: function (id) { try { var l = JSON.parse(get(K.welcomed) || '[]'); if (l.indexOf(id) < 0) l.push(id); set(K.welcomed, JSON.stringify(l)); } catch (e) { set(K.welcomed, JSON.stringify([id])); } },
    saveView: saveView,
    forget: forget
  };
})(window.Folio);
