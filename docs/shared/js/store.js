/* Folio shared store. One state object, saved to localStorage, synced across tabs and across
   the three surfaces (portal, patient app, adult card view). Real backend replaces this later. */
(function (F) {
  var KEY = 'folio.proto.v2';
  var state = load();
  var subs = [];

  function seed() { return JSON.parse(JSON.stringify(F.SEED)); }
  /* v2 research update: fill in new fields on saved demo data instead of wiping it, and swap out
     leftover GI wording (flare plan) that older saved copies still carry. Safe to run more than once. */
  function migrate(st) {
    var OLD_TEXT = { 'Practise your flare plan out loud. Bring one soccer question.': 'Practise your low-sugar plan out loud. Bring one question about soccer days.' };
    var seedP = {}; F.SEED.patients.forEach(function (x) { seedP[x.id] = x; });
    (st.patients || []).forEach(function (p) {
      var fromSeed = seedP[p.id];
      ['meds', 'medsConfirmed', 'supportThisVisit', 'decisionSupport', 'careTasks', 'plant'].forEach(function (k) {
        if (p[k] === undefined && fromSeed && fromSeed[k] !== undefined) p[k] = JSON.parse(JSON.stringify(fromSeed[k]));
      });
      if (F.defaults) F.defaults(p);
      (p.notes || []).forEach(function (n) {
        if (OLD_TEXT[n.text]) n.text = OLD_TEXT[n.text];
        if (fromSeed && n.id === 'n1' && /symptoms down/.test(n.text || '')) { var sn = fromSeed.notes.filter(function (x) { return x.id === 'n1'; })[0]; if (sn) { n.text = sn.text; n.fields = sn.fields; n.draft = true; } }
      });
    });
    /* v3 first-run update, once per saved copy: the sample handoff is shared (so the adult view shows who takes over),
       Maya gets her allergy and parent sharing, and Jordan carries the draft example instead. */
    st.mig = st.mig || {};
    if (!st.mig.v3) {
      st.mig.v3 = true;
      (st.patients || []).forEach(function (p) {
        var fromSeed = seedP[p.id]; if (!fromSeed) return;
        if (p.id === 'p1') {
          (p.notes || []).forEach(function (n) { if (n.id === 'n1' && n.kind === 'Handoff note') n.draft = false; });
          if (!p.allergies.length && !p.noAllergies) p.allergies = JSON.parse(JSON.stringify(fromSeed.allergies));
          p.parentShare = JSON.parse(JSON.stringify(fromSeed.parentShare));
        }
        if (p.id === 'p4' && !(p.notes || []).some(function (n) { return n.id === 'n4'; })) p.notes.unshift(JSON.parse(JSON.stringify(fromSeed.notes[0])));
      });
    }
    /* v5 readiness check update, once per saved copy: Maya gets her October check, two goals, her 3-sentence summary
       and dated items for Coming up, unless the saved copy already has its own. */
    if (!st.mig.v5) {
      st.mig.v5 = true;
      (st.patients || []).forEach(function (p) {
        var fromSeed = seedP[p.id]; if (!fromSeed || p.id !== 'p1') return;
        var copy = function (k) { return JSON.parse(JSON.stringify(fromSeed[k])); };
        if (!p.checks.length) { p.checks = copy('checks'); var lc = p.checks[p.checks.length - 1]; p.selfCheck = { skills: lc.skills, date: lc.date }; }
        if (!p.goals.length) p.goals = copy('goals');
        if (!p.summary3) p.summary3 = copy('summary3');
        (p.careTasks || []).forEach(function (t) { var ft = fromSeed.careTasks.filter(function (x) { return x.id === t.id; })[0]; if (ft && ft.due && !t.due) t.due = ft.due; });
        (p.meds || []).forEach(function (m) { var fm = fromSeed.meds.filter(function (x) { return x.id === m.id; })[0]; if (fm && fm.refill && !m.refill) m.refill = fm.refill; });
      });
    }
    /* v6 trade-show update, safe to run on every load: add the four people with printed Folio tags (FO-1001 to FO-1004)
       if this saved copy does not have them yet. Nothing already saved is changed or removed. */
    if (Array.isArray(st.patients)) {
      F.SEED.patients.forEach(function (sp) {
        if (!sp.cardId) return;
        var have = st.patients.filter(function (x) { return x.id === sp.id; })[0];
        if (!have) { if (!st.patients.some(function (x) { return x.cardId === sp.cardId; })) st.patients.push(JSON.parse(JSON.stringify(sp))); }
        else if (!have.cardId && have.first === sp.first && have.last === sp.last) have.cardId = sp.cardId;
      });
      if (Array.isArray(st.access) && Array.isArray(F.SEED.access)) F.SEED.access.forEach(function (a) { if (a.pid && /^p(8|9|10|11)$/.test(a.pid) && !st.access.some(function (x) { return x.id === a.id; })) st.access.push(JSON.parse(JSON.stringify(a))); });
      st.mig.v6 = true;
    }
    /* Level system v2: requiredSkills used to mean "of 5 areas" (default 4 of 5). It now means "of the 4 skills in the
       current level" (default 3 of 4). program.rule marks the converted record, so this runs once even across devices.
       Patient skill maps are upgraded per patient in F.defaults (F.upgradeSkills). */
    if (st.program && st.program.rule !== 2) {
      var oldReq = +st.program.requiredSkills || 4;
      st.program.requiredSkills = Math.max(2, Math.min(4, oldReq - 1));
      st.program.rule = 2;
    }
    st.mig.lv2 = true;
    if (Array.isArray(st.resources)) {
      st.resources = st.resources.map(function (r) {
        var fresh = F.SEED.resources.filter(function (x) { return x.id === r.id; })[0];
        if (fresh && (r.title === 'Build your flare plan' || r.skill === undefined)) return Object.assign({}, fresh, { published: r.published !== false });
        return r;
      });
      F.SEED.resources.forEach(function (r) { if (!st.resources.some(function (x) { return x.id === r.id; })) st.resources.push(JSON.parse(JSON.stringify(r))); });
    }
    return st;
  }
  function load() {
    try { var r = localStorage.getItem(KEY); if (r) { var s = JSON.parse(r); if (s && s.v === 2) return migrate(s); } } catch (e) {}
    return migrate(seed());
  }
  /* A failed write (usually storage full) used to vanish silently. Tell the page so it can roll back and explain. */
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); return true; } catch (e) { try { window.dispatchEvent(new CustomEvent('folio:savefail', { detail: { error: e } })); } catch (e2) {} return false; } }
  function emit() { subs.forEach(function (f) { f(); }); }
  /* Sync hooks (sync.js). Local changes notify onCommit listeners; changes that came from another device go through
     applyRemote, which never notifies them, so a remote update is never sent back out (no echo loop). */
  var commitHooks = [], resetHooks = [];
  function commit(fn) { var r = fn(state); save(); emit(); commitHooks.forEach(function (f) { try { f(); } catch (e) {} }); return r; }
  /* A remote update should not jump the screen while someone types: hold the re-render until the field loses focus */
  var heldEmit = false;
  function typing() { var a = document.activeElement; return !!(a && a !== document.body && (a.isContentEditable || (/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) && !/^(checkbox|radio|button|submit|range|file)$/i.test(a.type || '')))); }
  function emitRemote() {
    if (!typing()) { emit(); return; }
    if (heldEmit) return; heldEmit = true;
    document.addEventListener('focusout', function go() { setTimeout(function () { if (typing()) return; document.removeEventListener('focusout', go, true); heldEmit = false; emit(); }, 0); }, true);
  }
  function applyRemote(fn) { var r = fn(state); migrate(state); save(); emitRemote(); return r; }
  window.addEventListener('storage', function (e) { if (e.key === KEY) { state = load(); emit(); } });

  var uid = function (p) { return p + Math.random().toString(36).slice(2, 8); };
  function randToken() {
    var a = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789', o = '', b = new Uint8Array(22);
    (window.crypto || window.msCrypto).getRandomValues(b);
    for (var i = 0; i < 22; i++) o += a[b[i] % a.length];
    return o;
  }
  function randFolioId() { var s = ''; for (var i = 0; i < 8; i++) s += Math.floor(Math.random() * 10); return s; }
  /* Local date, not UTC: in Ontario evenings, UTC already says tomorrow */
  var today = function () { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); };

  /* Plant growth events. Nothing is ever removed, so the plant never shrinks. */
  function grow(p, type, label) {
    if (!p.plant || !Array.isArray(p.plant.events)) p.plant = { events: [] };
    p.plant.events.push({ id: uid('g'), type: type, label: label, date: today() });
  }
  var sel = {
    patient: function (id) { return state.patients.filter(function (p) { return p.id === id; })[0]; },
    byToken: function (t) { return state.patients.filter(function (p) { return p.card && p.card.token && p.card.token === t && p.card.status === 'active'; })[0]; },
    /* Any card status, so the scanner can say "This card is not active" instead of "Not a Folio card" */
    cardByToken: function (t) { return t ? state.patients.filter(function (p) { return p.card && p.card.token && p.card.token === t; })[0] : undefined; },
    /* Older callers pass the 8-digit Folio ID. It now also accepts a printed card code (FO-1004), so every lookup is forgiving. */
    byFolioId: function (q) { return sel.byAnyId(q); },
    /* Either id type, typed any way: '8314 0572', '83140572', 'FO-1004', 'fo 1004', 'fo1004', ' FO-1004 ', or just '1004'. */
    byAnyId: function (q) {
      var s = String(q == null ? '' : q).toUpperCase().replace(/[\s\-_.\u2010-\u2015\u2212]/g, '');
      if (!s) return undefined;
      var m = s.match(/^F[O0](\d{3,6})$/); /* FO, or F and a zero typed by mistake */
      if (!/[A-Z]/.test(s) && s.replace(/\D/g, '').length === 8) s = s.replace(/\D/g, '');
      if (/^\d{8}$/.test(s)) return state.patients.filter(function (p) { return p.folioId === s; })[0];
      var code = m ? m[1] : /^\d{3,6}$/.test(s) ? s : '';
      if (!code) return undefined;
      return state.patients.filter(function (p) { return p.cardId && String(p.cardId).replace(/\D/g, '') === code; })[0];
    },
    level: function (n) { return F.LEVELS[Math.min(Math.max(n, 1), 10) - 1]; },
    /* Level system v2: a level's own 4 skills. ownCount counts the CURRENT level only. */
    currentSkills: function (p) { return F.skillsOfLevel(p.level); },
    ownCount: function (p) { return F.skillsOfLevel(p.level).filter(function (s) { return p.skills[s.id] === 'own'; }).length; },
    /* Skills needed to advance from the current level (program setting, default 3 of 4) */
    need: function (p) { return F.needToAdvance(state.program.requiredSkills, p ? p.level : 1); },
    skillStatus: function (p, sid) { return (p.skills && p.skills[sid]) || 'learning'; },
    /* Everything done on their own, newest first (adult view, profile) */
    ownSkills: function (p) {
      var e = p.earned || {};
      return F.ALL_SKILLS.filter(function (s) { return p.skills[s.id] === 'own'; }).sort(function (a, b) { var x = e[a.id] || '', y = e[b.id] || ''; return x < y ? 1 : x > y ? -1 : b.level - a.level; });
    },
    /* Skills at or below the current level that are not on their own yet */
    stillBuilding: function (p) { return F.ALL_SKILLS.filter(function (s) { return s.level <= p.level && p.skills[s.id] !== 'own'; }); },
    me: function () { return state.team.filter(function (u) { return u.id === state.me; })[0]; },
    status: function (p) {
      if (p.transferred) return 'transferred';
      if (p.attention) return 'attention';
      if (p.level < 10 && sel.ownCount(p) >= sel.need(p)) return 'ready';
      if (p.level === 10 && sel.ownCount(p) === F.skillsOfLevel(10).length) return 'ready';
      return 'track';
    },
    /* Medication list is "May be out of date" when never confirmed or confirmed over 90 days ago (TODO open question: threshold) */
    medsStale: function (p) {
      if (!p.medsConfirmed || !p.medsConfirmed.date) return true;
      return (Date.now() - new Date(p.medsConfirmed.date + 'T12:00:00').getTime()) / 864e5 > 90;
    },
    /* Leaves since the last sign-off: practice, guides and care tasks feed the plant */
    leaves: function (p) {
      var ev = (p.plant && p.plant.events) || [], last = -1;
      ev.forEach(function (e, i) { if (e.type === 'signOff') last = i; });
      /* After a sign-off in Folio, count what came after it. For older data with no sign-off event, count from the sign-off date. */
      if (last >= 0) return ev.slice(last + 1).filter(function (e) { return e.type !== 'signOff'; }).length;
      var since = p.levelSignoff ? p.levelSignoff.date : '';
      return ev.filter(function (e) { return e.type !== 'signOff' && (!since || e.date >= since); }).length;
    },
    /* The printed tag code, written the way it is on the card: FO-1004 */
    cardId: function (p) { return p && p.cardId ? String(p.cardId).toUpperCase() : ''; },
    fid: function (id) { return String(id).replace(/(\d{4})(\d{4})/, '$1 $2'); },
    full: function (p) { return p.first + ' ' + p.last; },
    notesFor: function (p, audience) {
      var n = p.notes.slice().sort(function (a, b) { return b.date < a.date ? -1 : 1; });
      /* Drafts never reach adult teams (research: classroom testers and the AI pilot flagged unfinished notes) */
      return audience === 'adult' ? (p.shareNotes === false ? [] : n.filter(function (x) { return x.shared && !x.draft; })) : n;
    }
  };

  var act = {
    /* sid is a skill id (L3-02). An On my own status stamps p.earned the first time; earned dates are never removed,
       so a sticker never peels off. */
    setSkill: function (pid, sid, status) {
      commit(function () {
        var p = sel.patient(pid); if (!p || !F.isSkillId(sid) || !F.SKILL_STATUS[status]) return;
        p.skills[sid] = status;
        if (status === 'own') { if (!p.earned) p.earned = {}; if (!p.earned[sid]) p.earned[sid] = today(); }
      });
    },
    /* Learning to With help, for a skill in the current level. sid is optional: with none (or an old area id) the first
       Learning skill of the current level (in that area) moves. Returns the skill or null. */
    practise: function (pid, sid) {
      return commit(function () {
        var p = sel.patient(pid), cur = F.skillsOfLevel(p.level);
        var skill = cur.filter(function (k) { return p.skills[k.id] === 'learning' && (!sid || k.id === sid || k.area === sid); })[0];
        if (!skill) return null;
        p.skills[skill.id] = 'help'; grow(p, 'practice', 'You practised ' + skill.name.charAt(0).toLowerCase() + skill.name.slice(1)); return skill;
      });
    },
    /* A clinician applies the readiness check's suggested starting place (only offered before a first sign-off in Folio) */
    placeFromCheck: function (pid) {
      return commit(function () {
        var p = sel.patient(pid), c = p && (p.checks || [])[p.checks.length - 1]; if (!c) return null;
        var pl = F.checkPlace(c.answers);
        p.level = pl.level; p.skills = F.skillMap(pl.level, pl.skills); p.earned = {}; F.upgradeSkills(p);
        p.levelSignoff = { level: pl.level, by: sel.me().name, date: today() };
        return pl;
      });
    },
    advance: function (pid, o) {
      return commit(function (s) {
        var p = sel.patient(pid); o = o || {};
        if (p.level >= 10) { p.transferred = true; p.celebrate = 'transfer'; }
        else {
          if (!p.earned) p.earned = {};
          F.skillsOfLevel(p.level).forEach(function (k) { if (p.skills[k.id] === 'own' && !p.earned[k.id]) p.earned[k.id] = today(); });
          p.level += 1; F.skillsOfLevel(p.level).forEach(function (k) { p.skills[k.id] = 'learning'; }); p.celebrate = p.level;
        }
        p.attention = false; p.attentionReason = ''; p.lastNote = today();
        p.levelSignoff = { level: p.level, by: sel.me().name, date: today() };
        grow(p, 'signOff', p.transferred ? 'Your final sign-off' : 'Signed off to Level ' + p.level);
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
          skills: F.skillMap(Math.min(Math.max(+d.level || 1, 1), 10)), earned: {},
          lastNote: today(), attention: false, attentionReason: '', optedIn: true, transferred: false, celebrate: null,
          levelSignoff: { level: +d.level || 1, by: sel.me().name, date: today() }, shareNotes: true,
          wantDoctorKnow: 'Nothing added yet.', questions: [], howToWork: [],
          contacts: [{ id: uid('c'), name: d.guardian, rel: d.relation, phone: d.phone, visible: true }],
          careTeam: [{ id: uid('t'), name: sel.me().name, role: sel.me().title, phone: '' }], links: [], notes: [],
          consent: { patient: true, guardian: true, recorded: today(), by: sel.me().name },
          card: { status: d.shape ? 'active' : 'unassigned', shape: d.shape || 'rounded', token: d.shape ? randToken() : '', issued: d.shape ? today() : '', lastTap: '' }
        };
        if (F.defaults) F.defaults(p);
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
    /* v2 research actions */
    editMed: function (pid, item) {
      commit(function () {
        var p = sel.patient(pid), arr = p.meds || (p.meds = []), i = -1;
        arr.forEach(function (x, k) { if (x.id === item.id) i = k; });
        if (i >= 0) arr[i] = Object.assign(arr[i], item); else { item.id = uid('m'); arr.push(item); }
        p.medsConfirmed = null; /* any change needs the care team to confirm the list again */
      });
    },
    removeMed: function (pid, id) { commit(function () { var p = sel.patient(pid); p.meds = (p.meds || []).filter(function (x) { return x.id !== id; }); p.medsConfirmed = null; }); },
    confirmMeds: function (pid) { commit(function () { sel.patient(pid).medsConfirmed = { by: sel.me().name, date: today() }; }); },
    toggleCareTask: function (pid, id) {
      return commit(function () {
        var p = sel.patient(pid), t = (p.careTasks || []).filter(function (x) { return x.id === id; })[0]; if (!t) return null;
        t.done = !t.done; t.doneDate = t.done ? today() : '';
        if (t.done) grow(p, 'careTask', 'You did this yourself: ' + t.label.charAt(0).toLowerCase() + t.label.slice(1));
        return t;
      });
    },
    readGuide: function (pid, r) {
      commit(function () {
        var p = sel.patient(pid); if (!p.plant) p.plant = { events: [] };
        if (p.plant.events.some(function (e) { return e.type === 'guide' && e.ref === r.id; })) return;
        grow(p, 'guide', 'You read ' + r.title.charAt(0).toLowerCase() + r.title.slice(1)); p.plant.events[p.plant.events.length - 1].ref = r.id;
      });
    },
    setDecisionSupport: function (pid, d) { commit(function () { sel.patient(pid).decisionSupport = d && d.name ? { name: d.name, rel: d.rel || '' } : null; }); },
    saveHandoff: function (pid, fields, final) {
      commit(function () {
        var p = sel.patient(pid), text = fields.summary || 'Handoff summary for the adult team.';
        var n = p.notes.filter(function (x) { return x.kind === 'Handoff note' && x.draft; })[0];
        if (!n) { n = { id: uid('n'), kind: 'Handoff note', role: 'peds', shared: true }; p.notes.unshift(n); }
        Object.assign(n, { author: sel.me().name, date: today(), text: text, draft: !final, shared: true,
          fields: { meds: fields.meds || '', referrals: fields.referrals || '', upcoming: fields.upcoming || '', managed: fields.managed || '', watch: fields.watch || '' } });
        p.lastNote = today();
      });
    },
    removeResource: function (id) { commit(function (s) { s.resources = s.resources.filter(function (x) { return x.id !== id; }); }); },
    /* v3 first-run actions */
    setMe: function (id) { commit(function (s) { if (s.team.some(function (u) { return u.id === id; })) s.me = id; }); },
    /* The teen's own view of each skill, from setup. Shown to the care team as a talking point. It never changes the level. */
    setSelfCheck: function (pid, skills) { commit(function () { sel.patient(pid).selfCheck = skills ? { skills: skills, date: today() } : null; }); },
    setParentShare: function (pid, key, on) { commit(function () { var p = sel.patient(pid); if (!p.parentShare) p.parentShare = {}; p.parentShare[key] = !!on; }); },
    setTaskOwner: function (pid, id, owner) { commit(function () { var t = (sel.patient(pid).careTasks || []).filter(function (x) { return x.id === id; })[0]; if (t && F.OWNERS[owner]) t.owner = owner; }); },
    editAllergy: function (pid, item) {
      commit(function () {
        var p = sel.patient(pid), arr = p.allergies || (p.allergies = []), i = -1;
        arr.forEach(function (x, k) { if (x.id === item.id) i = k; });
        if (i >= 0) arr[i] = Object.assign(arr[i], item); else { item.id = uid('al'); arr.push(item); }
        p.noAllergies = false; p.medsConfirmed = null;
      });
    },
    removeAllergy: function (pid, id) { commit(function () { var p = sel.patient(pid); p.allergies = (p.allergies || []).filter(function (x) { return x.id !== id; }); p.medsConfirmed = null; }); },
    setNoAllergies: function (pid, v) { commit(function () { var p = sel.patient(pid); p.noAllergies = !!v; if (v) p.allergies = []; p.medsConfirmed = null; }); },
    /* v5 readiness check. Keeps the last 6 checks. Its per-skill result becomes the self-check the care team sees.
       It never changes a level or a skill status. The first check of a day grows a leaf. */
    saveCheck: function (pid, answers) {
      return commit(function () {
        var p = sel.patient(pid), c = { date: today(), answers: answers, skills: F.checkSkills(answers) };
        if (!Array.isArray(p.checks)) p.checks = [];
        var grew = !p.checks.some(function (x) { return x.date === c.date; });
        p.checks = p.checks.filter(function (x) { return x.date !== c.date; }).concat([c]).slice(-6);
        p.selfCheck = { skills: c.skills, date: c.date };
        if (grew) grow(p, 'check', 'You did your readiness check');
        return c;
      });
    },
    /* Up to 3 goals. Kept goals keep their ticked steps. */
    setGoals: function (pid, ids) {
      commit(function () {
        var p = sel.patient(pid), old = p.goals || [];
        p.goals = ids.slice(0, 3).filter(function (id) { return F.checkItem(id); }).map(function (id) {
          var had = old.filter(function (g) { return g.id === id; })[0];
          return had || { id: id, date: today(), done: [false, false, false] };
        });
      });
    },
    toggleGoalStep: function (pid, gid, i) {
      return commit(function () {
        var p = sel.patient(pid), g = (p.goals || []).filter(function (x) { return x.id === gid; })[0], q = F.checkItem(gid); if (!g || !q) return null;
        g.done[i] = !g.done[i];
        if (g.done[i]) grow(p, 'goal', 'You did a step toward ' + q.goal.charAt(0).toLowerCase() + q.goal.slice(1));
        return { on: g.done[i], all: g.done.every(Boolean) };
      });
    },
    setSummary3: function (pid, d) { commit(function () { var p = sel.patient(pid); p.summary3 = d && (d.s1 || d.s2 || d.s3) ? { s1: d.s1 || '', s2: d.s2 || '', s3: d.s3 || '', date: today() } : null; }); },
    /* Practising out loud grows a leaf once a day. It never changes a skill status. */
    logPractice: function (pid, label) {
      return commit(function () {
        var p = sel.patient(pid), ev = (p.plant && p.plant.events) || [];
        if (ev.some(function (e) { return e.label === label && e.date === today(); })) return false;
        grow(p, 'practice', label); return true;
      });
    },
    /* Log out on a demo phone: put back what first-run setup wrote for this person (nickname, readiness checks, goals),
       from the seed, so the next person sees setup fresh. Everything else (notes, cards, visits) is kept. */
    clearSetup: function (pid) {
      /* With sync on, the patient's data is shared with the care team's devices, so logging out a phone leaves it alone */
      if (F.Sync && F.Sync.enabled) return;
      commit(function () {
        var p = sel.patient(pid); if (!p) return;
        var sp = F.SEED.patients.filter(function (x) { return x.id === pid; })[0];
        var copy = function (k, d) { return sp && sp[k] !== undefined ? JSON.parse(JSON.stringify(sp[k])) : d; };
        p.nickname = copy('nickname', '');
        p.checks = copy('checks', []); p.goals = copy('goals', []); p.selfCheck = copy('selfCheck', null);
        if (p.checks.length && !p.selfCheck) { var lc = p.checks[p.checks.length - 1]; p.selfCheck = { skills: lc.skills, date: lc.date }; }
        if (p.plant && Array.isArray(p.plant.events)) {
          var keep = sp && sp.plant ? sp.plant.events.map(function (e) { return e.id; }) : [];
          p.plant.events = p.plant.events.filter(function (e) { return e.type !== 'check' || keep.indexOf(e.id) >= 0; });
        }
      });
    },
    setTaskDue: function (pid, id, iso) { commit(function () { var t = (sel.patient(pid).careTasks || []).filter(function (x) { return x.id === id; })[0]; if (t) t.due = iso || ''; }); },
    /* A refill date is the teen's reminder, so it does not undo the care team's confirmation of the list */
    setRefill: function (pid, id, iso) { commit(function () { var m = (sel.patient(pid).meds || []).filter(function (x) { return x.id === id; })[0]; if (m) m.refill = iso || ''; }); }
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
    reset: function () { state = seed(); save(); emit(); resetHooks.forEach(function (f) { try { f(); } catch (e) {} }); },
    onCommit: function (f) { commitHooks.push(f); }, onReset: function (f) { resetHooks.push(f); }, applyRemote: applyRemote,
    seed: seed, migrate: migrate, persist: save,
    a11y: { get: function () { return a11y; }, set: function (k, v) { a11y[k] = v; try { localStorage.setItem(A11Y_KEY, JSON.stringify(a11y)); } catch (e) {} applyA11y(); emit(); } }
  };
})(window.Folio);
