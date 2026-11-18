/* Folio patient app: what this phone remembers about who is signed in, and how to log out.
   Why: at a trade show one iPhone runs the whole first-run flow many times a day. Setup must never repeat on its own
   (a cold launch or a killed app goes straight to Home, signed in), and a clear Log out must bring the welcome back.

   Remembered per device, in localStorage only (sessionStorage is wiped every time iOS closes the app):
   - folio.app.setup   'teen' | 'parent'   the role picked in the welcome, and the signed-in flag
   - folio.app.pid     the teen this phone is signed in as
   - folio.app.child   the teen a parent connected to
   - folio.app.flow    setup still in progress (step, answers), so a closed app resumes where it stopped
   - folio.proto.v2    the shared demo data (nickname, readiness checks, goals live on the patient)
   - folio.a11y.v1     display settings and the progress style
   Log out clears the first four, plus the per-person "already seen" markers, and puts back the setup answers for
   that person from the demo data. Everything else in the demo data stays. Reset demo data is a separate choice.
   Team helper: open the app with ?logout=1 (a QR code on the stand) to log a demo phone out. */
(function (F) {
  'use strict';
  var K = { setup: 'folio.app.setup', pid: 'folio.app.pid', child: 'folio.app.child', flow: 'folio.app.flow' };
  var PER_PERSON = ['folio.seen.', 'folio.fun.lvl.', 'folio.fun.stk.', 'folio.fun.vday.'];
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function del(k) { try { localStorage.removeItem(k); } catch (e) {} }

  /* Signed in means a finished setup that still points at a real person */
  function signedIn() {
    var m = get(K.setup), sel = F.Store.sel;
    if (m === 'teen') return sel.patient(get(K.pid)) ? 'teen' : '';
    if (m === 'parent') return sel.patient(get(K.child)) ? 'parent' : '';
    return '';
  }

  /* Ask the browser to keep Folio's storage when space runs low. Safari decides on its own and never prompts;
     an installed web app already gets the longer-lived storage, so this is a quiet extra. */
  function persist() {
    try {
      var s = navigator.storage; if (!s || !s.persist) return;
      (s.persisted ? s.persisted() : Promise.resolve(false)).then(function (y) { if (!y) return s.persist(); }).catch(function () {});
    } catch (e) {}
  }

  /* Forget this device's setup. Returns the teen that was signed in, if any. */
  function clear() {
    var mode = get(K.setup), pid = mode === 'parent' ? null : get(K.pid), flow = null;
    try { flow = JSON.parse(get(K.flow) || 'null'); } catch (e) {}
    var who = [];
    if (pid) who.push(pid);
    if (flow && flow.pid && flow.path !== 'parent' && who.indexOf(flow.pid) < 0) who.push(flow.pid);
    del(K.setup); del(K.pid); del(K.child); del(K.flow);
    try { sessionStorage.removeItem('folio.app.new'); } catch (e) {}
    who.forEach(function (id) {
      PER_PERSON.forEach(function (k) { del(k + id); });
      try { if (F.Store.sel.patient(id) && F.Store.act.clearSetup) F.Store.act.clearSetup(id); } catch (e) {}
    });
    /* The progress style is picked in setup, so the next person starts from the default */
    try { if (F.Store.a11y.get().motivation && F.Store.a11y.get().motivation !== 'plant') F.Store.a11y.set('motivation', 'plant'); } catch (e) {}
    return pid;
  }

  /* ?logout=1: clear, then take the parameter out of the address so a reload does not log out again */
  var byUrl = false;
  try {
    var q = new URLSearchParams(location.search);
    if (q.get('logout') === '1') {
      clear(); byUrl = true; q.delete('logout');
      var rest = q.toString();
      history.replaceState(null, '', location.pathname + (rest ? '?' + rest : '') + '#/');
    }
  } catch (e) {}

  if (signedIn()) persist();

  F.Session = { KEYS: K, signedIn: signedIn, clear: clear, persist: persist, get loggedOutByUrl() { return byUrl; } };
})(window.Folio);
