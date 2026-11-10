/* Folio patient app (PWA). Same shared store as the portal, so a sign-off in the portal shows up here. */
(function (F) {
  var h = F.UI.h, ic = F.UI.ic, S = F.Store, sel = S.sel, U = F.UI, A = S.act;
  var PKEY = 'folio.app.pid';
  function pid() { try { var v = localStorage.getItem(PKEY); if (v && sel.patient(v)) return v; } catch (e) {} return 'p1'; }
  function me() { return sel.patient(pid()); }
  F.ui.rq = ''; F.ui.rt = 'All';
  var deferred = null;
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferred = e; F.rerender && F.rerender(false); });

  var TABS = [['/', 'Home', 'home'], ['/levels', 'Levels', 'levels'], ['/resources', 'Resources', 'book'], ['/about', 'About me', 'user']];
  function shell(out, loc) {
    var p = me(), c = p.celebrate;
    return h`<div class="phone"><main id="main" class="scroll" data-keep="scr"><div class="pageturn">${out.html}</div></main>
      <nav class="tabbar" aria-label="Main">${TABS.map(function (t) { return h`<a href="#${t[0]}" ${loc.path === t[0] ? h`aria-current="page"` : ''}>${ic(t[2], 24)}<span>${t[1]}</span></a>`; })}</nav>
      ${c ? celebrate(p, c) : ''}</div>`;
  }

  function celebrate(p, c) {
    var transfer = c === 'transfer', L = transfer ? sel.level(10) : sel.level(c), cols = ['#92AFD7', '#395B50', '#F0E3CE', '#C5D1EB', '#E9DCC3'], bits = '';
    for (var i = 0; i < 22; i++) bits += '<i style="left:' + (Math.random() * 100) + '%;background:' + cols[i % 5] + ';animation-duration:' + (2.4 + Math.random() * 2.4) + 's;animation-delay:' + (Math.random() * 1.4) + 's"></i>';
    return h`<div class="lvlup" role="dialog" aria-modal="true" aria-label="Level up"><div class="confetti" aria-hidden="true">${U.raw(bits)}</div>
      <div class="stackviz" aria-hidden="true"><i></i><i></i><i></i>${U.star(34)}</div>
      <div class="eyebrow" style="color:var(--blue-100)">${transfer ? 'Final sign-off' : 'Level up'}</div>
      <h2>${transfer ? 'You own it' : 'Level ' + L.n + ': ' + L.name}</h2>
      <p>${transfer ? 'Your adult team has what they need, and you decide who sees what.' : 'You and your care team now: ' + L.leads.toLowerCase() + '.'}</p>
      <div class="changed"><div class="eyebrow" style="color:var(--blue-100)">What changed</div><ul><li>${p.levelSignoff.by} signed off, ${U.monthYear(p.levelSignoff.date)}</li><li>Unlocked: ${L.unlocks}</li></ul></div>
      <button class="btn btn-light" data-action="closeCelebrate" autofocus>Continue</button></div>`;
  }
  F.actions.closeCelebrate = function () { A.dismissCelebrate(pid()); };

  /* ---------- Home ---------- */
  F.actions.practise = function () {
    var p = me(), r = A.practise(p.id);
    U.toast(r ? 'Nice. ' + r.name + ' moved to "With help". Your doctor will see it.' : 'Your care team signs skills off at your next visit.');
  };
  F.actions.showQR = function () {
    var p = me();
    U.modal(h`<h2>Show your Folio card</h2><div style="display:grid;place-items:center;margin:1rem 0">${U.qr(p.card.token || p.folioId, 220)}</div><p class="small muted" style="text-align:center;margin-inline:auto">Sample code for the prototype. It is not scannable. Folio ID ${sel.fid(p.folioId)}.</p><div class="mform-actions"><button class="btn btn-primary" data-close>Done</button></div>`);
  };
  F.actions.tapShare = function () {
    var p = me();
    if (p.card.status !== 'active') { U.toast('Your card is not active. Ask your clinic.'); return; }
    U.modal(h`<h2>Tap to share</h2><p>On a real phone, holding your card or phone to a clinic tablet opens your care team view. For the demo, preview what the clinic sees.</p><div class="mform-actions"><button class="btn btn-quiet" data-close>Not now</button><a class="btn btn-primary" href="${F.cardUrl(p.card.token)}" target="_blank" rel="noopener">Preview clinic view ${ic('ext', 16)}</a></div>`);
  };

  function home() {
    var p = me(), L = sel.level(p.level), nx = p.level < 10 ? sel.level(p.level + 1) : null, own = sel.ownCount(p);
    var todo = F.SKILLS.filter(function (s) { return p.skills[s.id] !== 'own'; });
    var note = sel.notesFor(p).filter(function (n) { return n.role === 'peds'; })[0];
    return { title: 'Home', html: h`
      <header class="scr-head" data-rise><div class="eyebrow red">Hi ${p.first}</div><h1>You are building your own <em class="it">health team</em></h1></header>
      <section class="panel" data-rise style="--d:1"><div class="eyebrow">Your level</div><div class="lvl-big" style="margin:.3rem 0 .6rem">${p.level} · ${L.name}</div>${U.lvbar(p.level)}<p class="small" style="margin:.7rem 0 0">${p.transferred ? 'You have moved to adult care.' : L.leads + '. ' + own + ' of 5 skills on your own.'}</p></section>
      ${nx && todo.length ? h`<section class="card-sec" data-rise style="--d:2"><div class="eyebrow">Working toward Level ${nx.n}: ${nx.name}</div>${todo.map(function (s) { return h`<div class="skl"><b>${s.name}</b>${U.skillPill(p.skills[s.id])}</div>`; })}<button class="btn btn-primary" style="width:100%;margin-top:.8rem" data-action="practise">Practise next skill</button></section>` : ''}
      ${note ? h`<section class="card-sec" data-rise style="--d:3"><div class="eyebrow">From ${note.author} · ${U.monthYear(note.date)}</div><p style="margin:.5rem 0 .3rem">${note.text}</p><p class="tiny muted" style="margin:0">${note.shared ? 'Shown to future care teams.' : 'Only you and your paediatric team see this.'}</p></section>` : ''}
      <section class="panel-green" data-rise style="--d:4"><div class="eyebrow">My Folio card</div><div class="cardwrap" style="margin:.75rem 0">${U.cardFace(p, 'front')}</div><div class="tw"><button class="btn" style="border-color:var(--beige-100);color:var(--beige-100)" data-action="showQR">${ic('qr', 18)} Show QR</button><button class="btn" style="background:var(--beige-100);color:var(--green-900);border-color:var(--beige-100)" data-action="tapShare">${ic('nfc', 18)} Tap to share</button></div></section>` };
  }

  /* ---------- Levels ---------- */
  function levels() {
    var p = me(), L = sel.level(p.level), nx = p.level < 10 ? sel.level(p.level + 1) : null, own = sel.ownCount(p);
    return { title: 'Levels', html: h`
      <header class="scr-head" data-rise><div class="eyebrow red">Levels</div><h1>Level ${p.level}: <em class="it">${L.name}</em></h1><p>${nx ? 'Here is what gets you to Level ' + nx.n + '.' : 'You are at the top level.'}</p></header>
      <div data-rise style="--d:1"><span class="lvbar lg" role="img" aria-label="${own} of 5 skills on your own">${[1, 2, 3, 4, 5].map(function (i) { return h`<i class="${i <= own ? 'on' : ''}" style="--i:${i * 2}"></i>`; })}</span><p class="small muted" style="margin:.4rem 0 0">${own} of 5 skills on your own</p></div>
      <div data-rise style="--d:2">${F.SKILLS.map(function (s) { var st = p.skills[s.id]; return h`<div class="skcard"><div class="top"><b>${s.name}</b>${U.skillPill(st)}</div><div class="small muted">${s.sub}</div>${st !== 'own' ? h`<a class="how" href="#/resources?t=Learn">Learn how ${ic('arrow', 14)}</a>` : ''}</div>`; })}</div>
      ${nx ? h`<section class="up-next" data-rise style="--d:3"><div class="eyebrow">Up next · Level ${nx.n}: ${nx.name}</div><p style="margin:.4rem 0 0">${nx.leads}. ${nx.unlocks} unlocks.</p></section>` : ''}
      <details class="card-sec" data-rise style="--d:4"><summary>See all 10 levels</summary><ol class="ladder">${F.LEVELS.slice().reverse().map(function (l) { return h`<li class="${l.n === p.level ? 'cur' : l.n < p.level ? 'done' : ''}" style="--n:${l.n}" ${l.n === p.level ? h`aria-current="step"` : ''}><b>${l.n}</b><span>${l.name}${l.n === p.level ? ' (you are here)' : ''}</span></li>`; })}</ol></details>` };
  }

  /* ---------- Resources ---------- */
  F.actions.rtag = function (el) { F.ui.rt = el.dataset.v; F.rerender(false); };
  F.actions.openRes = function (el) { var r = S.get().resources.filter(function (x) { return x.id === el.dataset.id; })[0]; U.modal(h`<div class="eyebrow">${r.kind} · ${r.mins}</div><h2 style="margin:.4rem 0 .75rem">${r.title}</h2><p>${r.body}</p><div class="mform-actions"><button class="btn btn-primary" data-close>Done</button></div>`); };
  F.actions.editLink = function (el) {
    var p = me(), it = el.dataset.id ? p.links.filter(function (x) { return x.id === el.dataset.id; })[0] : {};
    U.formModal({ title: el.dataset.id ? 'Edit link' : 'Add a link', lead: 'Doctors can open these. Folio only links to them.', fields: [{ name: 'title', label: 'Name', value: it.title, req: true }, { name: 'sub', label: 'Where it is from', value: it.sub }, { name: 'url', label: 'Link', type: 'url', value: it.url, req: true }],
      onSubmit: function (d) { d.id = el.dataset.id; A.upsert(p.id, 'links', d); U.toast('Link saved'); } });
  };
  F.actions.rmLink = function (el) { U.confirmModal({ title: 'Remove this link?', body: 'Doctors will no longer see it.', cta: 'Remove', danger: true, onOk: function () { A.remove(pid(), 'links', el.dataset.id); } }); };
  function resources(params, q) {
    var p = me(), ui = F.ui; if (q.t && ui._rq !== q.t) ui.rt = q.t; ui._rq = q.t || '';
    var term = (ui.rq || '').toLowerCase();
    var list = S.get().resources.filter(function (r) { return r.published && (ui.rt === 'All' || r.tags.indexOf(ui.rt) >= 0) && (!term || r.title.toLowerCase().indexOf(term) >= 0); });
    return { title: 'Resources', html: h`
      <header class="scr-head" data-rise><div class="eyebrow red">Resources</div><h1>Learn it, then <em class="it">link</em> what your doctor may need</h1></header>
      <div class="search" data-rise style="--d:1;max-width:none">${ic('search', 18)}<label class="sr" for="rq">Search resources</label><input id="rq" type="search" placeholder="Search resources" value="${ui.rq}" data-bind="rq" data-rerender autocomplete="off"></div>
      <div class="chips" role="group" aria-label="Topic">${['All', 'Learn', 'Visits', 'Speaking up'].map(function (t) { return h`<button class="chip" data-action="rtag" data-v="${t}" aria-pressed="${String(ui.rt === t)}">${t}</button>`; })}</div>
      <div>${list.map(function (r) { return h`<button class="rescard" data-action="openRes" data-id="${r.id}"><span class="thumb">${ic(r.kind === 'Video' ? 'eye' : r.kind === 'Checklist' ? 'visit' : 'book', 24)}</span><span><span class="tt">${r.title}</span><small>${r.kind} · ${r.mins}</small></span></button>`; })}${list.length ? '' : U.empty('Nothing found', 'Try another topic.')}</div>
      <section class="card-sec"><div class="eyebrow">My links · doctors can open these</div>
        ${p.links.map(function (l) { return h`<div class="fam"><span>${ic('link', 18)}</span><div class="grow"><b>${l.title}</b><div class="small muted">${l.sub}</div></div><button class="btn btn-sm btn-quiet" data-action="editLink" data-id="${l.id}" aria-label="Edit ${l.title}">${ic('edit', 16)}</button><button class="btn btn-sm btn-quiet" data-action="rmLink" data-id="${l.id}" aria-label="Remove ${l.title}">${ic('trash', 16)}</button></div>`; })}
        <button class="btn" style="width:100%;margin-top:.7rem" data-action="editLink">${ic('plus', 16)} Add a link</button></section>` };
  }

  /* ---------- About me ---------- */
  F.actions.saveWant = function (el) { A.updatePatient(pid(), { wantDoctorKnow: el.value.trim() || 'Nothing added yet.' }); U.toast('Saved'); };
  F.actions.addQ = function (d, form) { var p = me(); A.updatePatient(p.id, { questions: p.questions.concat([d.q]) }); };
  F.actions.rmQ = function (el) { var p = me(); A.updatePatient(p.id, { questions: p.questions.filter(function (_, i) { return i !== +el.dataset.i; }) }); };
  F.actions.vis = function (el) { A.upsert(pid(), 'contacts', { id: el.dataset.id, visible: el.checked }); };
  F.actions.shareNotes = function (el) { A.updatePatient(pid(), { shareNotes: el.checked }); U.toast(el.checked ? 'Adult teams can see shared notes' : 'Notes hidden from adult teams'); };
  F.actions.editContact = function (el) {
    var p = me(), it = el.dataset.id ? p.contacts.filter(function (x) { return x.id === el.dataset.id; })[0] : { visible: true };
    U.formModal({ title: el.dataset.id ? 'Edit contact' : 'Add family contact', fields: [{ name: 'name', label: 'Name', value: it.name, req: true }, { name: 'rel', label: 'Relationship', value: it.rel, req: true }, { name: 'phone', label: 'Phone', type: 'tel', value: it.phone }],
      onSubmit: function (d) { d.id = el.dataset.id; if (!d.id) d.visible = true; A.upsert(p.id, 'contacts', d); U.toast('Saved'); } });
  };
  F.actions.editTeam = function (el) {
    var p = me(), it = el.dataset.id ? p.careTeam.filter(function (x) { return x.id === el.dataset.id; })[0] : {};
    U.formModal({ title: el.dataset.id ? 'Edit care team member' : 'Add care team member', fields: [{ name: 'name', label: 'Name', value: it.name, req: true }, { name: 'role', label: 'Role', value: it.role, req: true }, { name: 'phone', label: 'Phone', type: 'tel', value: it.phone }],
      onSubmit: function (d) { d.id = el.dataset.id; A.upsert(p.id, 'careTeam', d); U.toast('Saved'); } });
  };
  F.actions.asPatient = function (el) { try { localStorage.setItem(PKEY, el.value); } catch (e) {} F.rerender(true); };
  F.actions.a11yApp = function (el) { S.a11y.set(el.dataset.k, el.dataset.v); };
  F.actions.install = function () { if (deferred) { deferred.prompt(); deferred = null; } };

  function about() {
    var p = me(), log = S.get().access.filter(function (a) { return a.pid === p.id; }).slice(0, 4), a = S.a11y.get();
    var ios = /iphone|ipad|ipod/i.test(navigator.userAgent), standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    var seg = function (k, opts) { return h`<div class="seg" role="group" aria-label="${k}">${opts.map(function (o) { return h`<button data-action="a11yApp" data-k="${k}" data-v="${o[0]}" aria-pressed="${String(a[k] === o[0])}">${o[1]}</button>`; })}</div>`; };
    return { title: 'About me', html: h`
      <header class="scr-head" data-rise><div class="eyebrow red">About me</div><h1>What your care team <em class="it">sees</em></h1><p>Adult doctors see this when they tap your card.</p></header>
      <section class="card-sec" data-rise style="--d:1"><div class="eyebrow">Diagnosis</div><div class="chips" style="margin-top:.5rem">${U.pill(p.condition, 'blue')}</div><p class="tiny muted" style="margin:.5rem 0 0">Set by your clinic.</p></section>
      <section class="card-sec" data-rise style="--d:2"><div class="eyebrow">What I want my doctor to know</div><label class="sr" for="want">What I want my doctor to know</label><textarea id="want" rows="4" data-change="saveWant" style="margin-top:.5rem">${p.wantDoctorKnow}</textarea><p class="tiny muted" style="margin:.4rem 0 0">Shows as "Patient: ${p.first}" to doctors.</p></section>
      <section class="card-sec"><div class="eyebrow">Questions for my next visit</div>${p.questions.map(function (qq, i) { return h`<div class="q-item">${ic('message', 18)}<span class="grow">${qq}</span><button class="btn btn-sm btn-quiet" data-action="rmQ" data-i="${i}" aria-label="Remove question">${ic('x', 16)}</button></div>`; })}
        <form data-submit="addQ" class="row" style="margin-top:.5rem"><label class="sr" for="nq">New question</label><input id="nq" name="q" type="text" placeholder="Add a question" required><button class="btn btn-icon btn-primary" aria-label="Add question">${ic('plus', 18)}</button></form></section>
      <section class="card-sec"><div class="sec-head row between"><div class="eyebrow">Family contacts</div></div>
        ${p.contacts.map(function (c) { return h`<div class="fam"><div class="grow"><b>${c.name}</b><div class="small muted">${c.rel}</div></div><label class="switch" title="Doctors can contact"><input type="checkbox" ${c.visible ? 'checked' : ''} data-change="vis" data-id="${c.id}" aria-label="Doctors can contact ${c.name}"><span class="track"></span></label><button class="btn btn-sm btn-quiet" data-action="editContact" data-id="${c.id}" aria-label="Edit ${c.name}">${ic('edit', 16)}</button></div>`; })}
        <p class="tiny muted">Switch on so doctors can call or message them.</p><button class="btn" style="width:100%" data-action="editContact">${ic('plus', 16)} Add contact</button></section>
      <section class="card-sec"><div class="eyebrow">Care team</div>${p.careTeam.map(function (c) { return h`<div class="fam"><div class="grow"><b>${c.name}</b><div class="small muted">${c.role}</div></div><button class="btn btn-sm btn-quiet" data-action="editTeam" data-id="${c.id}" aria-label="Edit ${c.name}">${ic('edit', 16)}</button></div>`; })}<button class="btn" style="width:100%;margin-top:.5rem" data-action="editTeam">${ic('plus', 16)} Add contact</button></section>
      <section class="card-sec"><div class="eyebrow">Sharing</div><div class="fam" style="border:0"><div class="grow"><b>Share my notes with adult care</b><div class="small muted">You can change this any time.</div></div><label class="switch"><input type="checkbox" ${p.shareNotes !== false ? 'checked' : ''} data-change="shareNotes" aria-label="Share my notes with adult care"><span class="track"></span></label></div>
        <div class="eyebrow" style="margin-top:1rem">Who has looked at my profile</div>${log.length ? log.map(function (l) { return h`<div class="skl"><span><b>${l.who}</b><span class="small muted">${l.how}</span></span><span class="small muted">${U.fmt(l.time)}</span></div>`; }) : h`<p class="small muted">No one yet.</p>`}</section>
      <section class="card-sec"><div class="eyebrow">App settings</div><p class="small" style="margin:.5rem 0 .3rem"><b>Text size</b></p>${seg('text', [['sm', 'S'], ['md', 'M'], ['lg', 'L'], ['xl', 'XL']])}<p class="small" style="margin:.8rem 0 .3rem"><b>Contrast</b></p>${seg('contrast', [['normal', 'Standard'], ['high', 'High']])}<p class="small" style="margin:.8rem 0 .3rem"><b>Motion</b></p>${seg('motion', [['auto', 'Device'], ['reduce', 'Reduce']])}</section>
      ${standalone ? '' : h`<section class="install"><b>Add Folio to your home screen</b><p class="small" style="margin:.3rem 0 .6rem">${ios ? 'In Safari tap the Share button, then "Add to Home Screen".' : deferred ? 'Install it like an app. It works offline.' : 'Open your browser menu and choose "Install app" or "Add to Home screen".'}</p>${deferred ? h`<button class="btn btn-primary" data-action="install">Install Folio</button>` : ''}</section>`}
      <section class="card-sec"><label for="asp" class="eyebrow" style="margin:0">Demo: view the app as</label><select id="asp" data-change="asPatient" style="margin-top:.5rem">${S.get().patients.map(function (x) { return h`<option value="${x.id}" ${x.id === p.id ? 'selected' : ''}>${sel.full(x)} · Level ${x.level}</option>`; })}</select></section>` };
  }

  F.UI.createApp({ name: 'Folio', shell: shell, routes: [['/', home], ['/levels', levels], ['/resources', resources], ['/about', about]],
    notFound: function () { return { title: 'Not found', html: h`<h1>Not found</h1><p><a href="#/">Home</a></p>` }; } });

  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(function () {});
})(window.Folio);
