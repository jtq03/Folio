/* Folio shared store. One state object, saved to localStorage, synced across tabs and across
   the three surfaces (portal, patient app, adult card view). Real backend replaces this later. */
(function (F) {
  var KEY = 'folio.proto.v2';
  var state = load();
  var subs = [];

  function seed() { return JSON.parse(JSON.stringify(F.SEED)); }
  function load() {
    try { var r = localStorage.getItem(KEY); if (r) { var s = JSON.parse(r); if (s && s.v === 2) return s; } } catch (e) {}
    return seed();
  }
  /* A failed write (usually storage full) used to vanish silently. Tell the page so it can roll back and explain. */
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); return true; } catch (e) { try { window.dispatchEvent(new CustomEvent('folio:savefail', { detail: { error: e } })); } catch (e2) {} return false; } }
  function emit() { subs.forEach(function (f) { f(); }); }
  function commit(fn) { var r = fn(state); save(); emit(); return r; }
  window.addEventListener('storage', function (e) { if (e.key === KEY) { state = load(); emit(); } });

  var uid = function (p) { return p + Math.random().toString(36).slice(2, 8); };
  function randToken() {
    var a = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789', o = '', b = new Uint8Array(22);
    (window.crypto || window.msCrypto).getRandomValues(b);
    for (var i = 0; i < 22; i++) o += a[b[i] % a.length];
    return o;
  }
  function randFolioId() { var s = ''; for (var i = 0; i < 8; i++) s += Math.floor(Math.random() * 10); return s; }
  var today = function () { return new Date().toISOString().slice(0, 10); };

  var sel = {
    patient: function (id) { return state.patients.filter(function (p) { return p.id === id; })[0]; },
    byToken: function (t) { return state.patients.filter(function (p) { return p.card && p.card.token && p.card.token === t && p.card.status === 'active'; })[0]; },
    byFolioId: function (q) { q = String(q).replace(/\D/g, ''); return state.patients.filter(function (p) { return p.folioId === q; })[0]; },
    level: function (n) { return F.LEVELS[Math.min(Math.max(n, 1), 10) - 1]; },
    ownCount: function (p) { return F.SKILLS.filter(function (s) { return p.skills[s.id] === 'own'; }).length; },
    me: function () { return state.team.filter(function (u) { return u.id === state.me; })[0]; },
    status: function (p) {
      if (p.transferred) return 'transferred';
      if (p.attention) return 'attention';
      if (p.level < 10 && sel.ownCount(p) >= state.program.requiredSkills) return 'ready';
      if (p.level === 10 && sel.ownCount(p) === 5) return 'ready';
      return 'track';
    },
    fid: function (id) { return String(id).replace(/(\d{4})(\d{4})/, '$1 $2'); },
    full: function (p) { return p.first + ' ' + p.last; },
    notesFor: function (p, audience) {
      var n = p.notes.slice().sort(function (a, b) { return b.date < a.date ? -1 : 1; });
      return audience === 'adult' ? (p.shareNotes === false ? [] : n.filter(function (x) { return x.shared; })) : n;
    }
  };

  var act = {
    setSkill: function (pid, sid, status) { commit(function (s) { var p = sel.patient(pid); p.skills[sid] = status; }); },
    practise: function (pid) {
      return commit(function () {
        var p = sel.patient(pid), skill = F.SKILLS.filter(function (k) { return p.skills[k.id] === 'learning'; })[0];
        if (!skill) return null;
        p.skills[skill.id] = 'help'; return skill;
      });
    },
    advance: function (pid, o) {
      return commit(function (s) {
        var p = sel.patient(pid); o = o || {};
        if (p.level >= 10) { p.transferred = true; p.celebrate = 'transfer'; }
        else { p.level += 1; F.SKILLS.forEach(function (k) { p.skills[k.id] = 'learning'; }); p.celebrate = p.level; }
        p.attention = false; p.attentionReason = ''; p.lastNote = today();
        p.levelSignoff = { level: p.level, by: sel.me().name, date: today() };
        if (o.text) p.notes.unshift({ id: uid('n'), kind: o.kind || 'Visit takeaway', author: sel.me().name, role: 'peds', date: today(), shared: !!o.shared, text: o.text });
        return p.level;
      });
    },
    addNote: function (pid, n) {
      commit(function () {
        var p = sel.patient(pid);
        p.notes.unshift({ id: uid('n'), kind: n.kind, author: n.author, role: n.role || 'peds', date: today(), shared: !!n.shared, text: n.text });
        p.lastNote = today(); if (n.role !== 'adult') { p.attention = false; p.attentionReason = ''; }
      });
    },
    addWorkWith: function (pid, e) { commit(function () { sel.patient(pid).howToWork.push(e); }); },
    updatePatient: function (pid, f) { commit(function () { Object.assign(sel.patient(pid), f); }); },
    upsert: function (pid, list, item) {
      commit(function () {
        var arr = sel.patient(pid)[list], i = -1;
        arr.forEach(function (x, k) { if (x.id === item.id) i = k; });
        if (i >= 0) arr[i] = Object.assign(arr[i], item); else { item.id = uid(list[0]); arr.push(item); }
      });
    },
    remove: function (pid, list, id) { commit(function () { var p = sel.patient(pid); p[list] = p[list].filter(function (x) { return x.id !== id; }); }); },
    dismissCelebrate: function (pid) { commit(function () { sel.patient(pid).celebrate = null; }); },
    addPatient: function (d) {
      return commit(function (s) {
        var p = {
          id: uid('p'), avatar: 'a' + (1 + Math.floor(Math.random() * 8)), photo: '', first: d.first, last: d.last, age: +d.age, folioId: randFolioId(), condition: d.condition, level: +d.level || 1,
          skills: { know: 'learning', manage: 'learning', speak: 'learning', run: 'learning', support: 'learning' },
          lastNote: today(), attention: false, attentionReason: '', optedIn: true, transferred: false, celebrate: null,
          levelSignoff: { level: +d.level || 1, by: sel.me().name, date: today() }, shareNotes: true,
          wantDoctorKnow: 'Nothing added yet.', questions: [], howToWork: [],
          contacts: [{ id: uid('c'), name: d.guardian, rel: d.relation, phone: d.phone, visible: true }],
          careTeam: [{ id: uid('t'), name: sel.me().name, role: sel.me().title, phone: '' }], links: [], notes: [],
          consent: { patient: true, guardian: true, recorded: today(), by: sel.me().name },
          card: { status: d.shape ? 'active' : 'unassigned', shape: d.shape || 'rounded', token: d.shape ? randToken() : '', issued: d.shape ? today() : '', lastTap: '' }
        };
        s.patients.unshift(p); return p;
      });
    },
    issueCard: function (pid, shape) { commit(function () { var c = sel.patient(pid).card; c.status = 'active'; c.shape = shape || c.shape; c.token = randToken(); c.issued = today(); c.lastTap = ''; }); },
    deactivateCard: function (pid) { commit(function () { sel.patient(pid).card.status = 'inactive'; }); },
    reactivateCard: function (pid) { commit(function () { sel.patient(pid).card.status = 'active'; }); },
    replaceCard: function (pid) { commit(function () { var c = sel.patient(pid).card; c.token = randToken(); c.status = 'active'; c.issued = today(); c.lastTap = ''; }); },
    setCardShape: function (pid, shape) { commit(function () { sel.patient(pid).card.shape = shape; }); },
    log: function (pid, who, how) {
      commit(function (s) {
        s.access.unshift({ id: uid('a'), pid: pid, who: who, how: how, time: new Date().toISOString() });
        if (how.indexOf('Card tap') === 0) sel.patient(pid).card.lastTap = today();
      });
    },
    invite: function (u) { commit(function (s) { s.team.push({ id: uid('u'), name: u.name, email: u.email, role: u.role, title: u.title || '', active: false, invited: true }); }); },
    setRole: function (id, role) { commit(function (s) { s.team.filter(function (u) { return u.id === id; })[0].role = role; }); },
    setActive: function (id, v) { commit(function (s) { var u = s.team.filter(function (x) { return x.id === id; })[0]; u.active = v; if (v) u.invited = false; }); },
    program: function (f) { commit(function (s) { Object.assign(s.program, f); }); },
    addResource: function (r) { commit(function (s) { r.id = uid('r'); r.published = true; s.resources.push(r); }); },
    togglePublish: function (id) { commit(function (s) { var r = s.resources.filter(function (x) { return x.id === id; })[0]; r.published = !r.published; }); },
    removeResource: function (id) { commit(function (s) { s.resources = s.resources.filter(function (x) { return x.id !== id; }); }); }
  };

  /* Accessibility settings live per device, not in shared state. */
  var A11Y_KEY = 'folio.a11y.v1';
  var a11y = { text: 'md', contrast: 'normal', motion: 'auto', spacing: 'normal' };
  try { Object.assign(a11y, JSON.parse(localStorage.getItem(A11Y_KEY) || '{}')); } catch (e) {}
  function applyA11y() {
    var r = document.documentElement;
    r.dataset.text = a11y.text; r.dataset.contrast = a11y.contrast; r.dataset.motion = a11y.motion; r.dataset.spacing = a11y.spacing;
  }
  applyA11y();

  F.Store = {
    get: function () { return state; }, sub: function (f) { subs.push(f); }, commit: commit, sel: sel, act: act,
    reset: function () { state = seed(); save(); emit(); },
    a11y: { get: function () { return a11y; }, set: function (k, v) { a11y[k] = v; try { localStorage.setItem(A11Y_KEY, JSON.stringify(a11y)); } catch (e) {} applyA11y(); emit(); } }
  };
})(window.Folio);
