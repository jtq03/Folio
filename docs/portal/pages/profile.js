/* Patient profile: where clinicians spend most of their time. */
(function (F) {
  var h = F.UI.h, ic = F.UI.ic, S = F.Store, sel = S.sel, U = F.UI, A = S.act;
  F.ui.pt = 'overview';
  var ROLE = { peds: 'Paediatric team', patient: 'Patient', adult: 'Adult team' };
  var KINDS = ['Visit takeaway', 'Next-level goals', 'Handoff note', 'Behavioural note'];

  F.actions.ptab = function (el) { F.ui.pt = el.dataset.v; F.rerender(false); };
  F.actions.editPatient = function (el) {
    var p = sel.patient(el.dataset.pid);
    U.formModal({ title: 'Edit patient info', fields: [
      { name: 'first', label: 'First name', value: p.first, req: true }, { name: 'last', label: 'Last initial or name', value: p.last, req: true },
      { name: 'age', label: 'Age', type: 'number', value: p.age, req: true }, { name: 'condition', label: 'Condition package', value: p.condition, req: true }],
      onSubmit: function (d) { A.updatePatient(p.id, { first: d.first, last: d.last, age: +d.age, condition: d.condition }); U.toast('Patient info saved'); } });
  };
  F.actions.addNote = function (d) {
    var p = sel.patient(d.pid), me = sel.me();
    A.addNote(p.id, { kind: d.kind, text: d.text, shared: !!d.shared, author: me.name, role: 'peds' });
    U.toast('Note saved. ' + p.first + ' sees it in the app.');
  };
  F.actions.addWorkWith = function (el) {
    var p = sel.patient(el.dataset.pid), me = sel.me();
    U.formModal({ title: 'How to work with ' + p.first, lead: 'One short thing that changes how the team should interact. It shows to adult clinics too.', fields: [{ name: 'text', label: 'What should the team know?', type: 'textarea', req: true }], cta: 'Add',
      onSubmit: function (d) { A.addWorkWith(p.id, { by: 'Peds team: ' + me.name, date: U.monthYear(new Date().toISOString()), text: d.text }); U.toast('Added'); } });
  };
  function listForm(cfg) {
    return function (el) {
      var p = sel.patient(el.dataset.pid), item = el.dataset.id ? p[cfg.list].filter(function (x) { return x.id === el.dataset.id; })[0] : {};
      U.formModal({ title: (el.dataset.id ? 'Edit ' : 'Add ') + cfg.noun, fields: cfg.fields.map(function (f) { return Object.assign({}, f, { value: item[f.name] }); }),
        onSubmit: function (d) { d.id = el.dataset.id; if (cfg.after) d = cfg.after(d, item); A.upsert(p.id, cfg.list, d); U.toast('Saved'); } });
    };
  }
  F.actions.editContact = listForm({ list: 'contacts', noun: 'family contact', fields: [{ name: 'name', label: 'Name', req: true }, { name: 'rel', label: 'Relationship', req: true }, { name: 'phone', label: 'Phone', type: 'tel' }], after: function (d, it) { d.visible = it.visible !== false; return d; } });
  F.actions.editTeam = listForm({ list: 'careTeam', noun: 'care team member', fields: [{ name: 'name', label: 'Name', req: true }, { name: 'role', label: 'Role', req: true }, { name: 'phone', label: 'Phone', type: 'tel' }] });
  F.actions.editLink = listForm({ list: 'links', noun: 'linked record', fields: [{ name: 'title', label: 'Title', req: true }, { name: 'sub', label: 'Source or description' }, { name: 'url', label: 'Link (opens outside Folio)', type: 'url', req: true }] });
  F.actions.removeItem = function (el) {
    U.confirmModal({ title: 'Remove this?', body: 'You can add it again later.', cta: 'Remove', danger: true, onOk: function () { A.remove(el.dataset.pid, el.dataset.list, el.dataset.id); U.toast('Removed'); } });
  };

  function overview(p) {
    var L = sel.level(p.level), nx = p.level < 10 ? sel.level(p.level + 1) : null;
    return h`
    <div class="grid2">
      <div class="stack">
        <section class="sec"><div class="eyebrow">Level ${p.level} of 10 · ${L.name}</div>
          <div style="margin:.75rem 0">${h`<span class="lvbar lg" role="img" aria-label="Level ${p.level} of 10">${[1,2,3,4,5,6,7,8,9,10].map(function (i) { return h`<i class="${i <= p.level ? 'on' : ''}" style="--i:${i}"></i>`; })}</span>`}</div>
          <dl class="kv"><dt>Who leads</dt><dd>${L.leads}</dd><dt>I can</dt><dd>${L.can}</dd><dt>Evidence</dt><dd>${L.evidence}</dd><dt>Unlocks</dt><dd>${L.unlocks}</dd></dl>
          <p class="small muted" style="margin-top:1rem">${p.levelSignoff ? 'Signed off Level ' + p.levelSignoff.level + ' by ' + p.levelSignoff.by + ', ' + U.fmtFull(p.levelSignoff.date) + '.' : ''} ${nx ? 'Next: Level ' + nx.n + ', ' + nx.name + '.' : 'Final level.'}</p>
        </section>
        <section class="sec"><div class="sec-head"><h2>Skills at this level</h2><a class="btn btn-sm btn-primary" href="#/visit/${p.id}">Start visit</a></div>
          ${F.SKILLS.map(function (s) { return h`<div class="skillrow"><div class="nm"><b>${s.name}</b><span class="small muted">${s.sub}</span></div>${U.skillPill(p.skills[s.id])}</div>`; })}
          <p class="small muted">Skills are signed off in person during a visit.</p>
        </section>
      </div>
      <div class="stack">
        <section class="sec"><div class="sec-head"><h2>How to work with ${p.first}</h2><button class="btn btn-sm" data-action="addWorkWith" data-pid="${p.id}">${ic('plus', 16)} Add</button></div>
          ${p.howToWork.map(function (w) { return h`<div class="note ${w.by.indexOf('Patient') === 0 ? 'patient' : 'peds'}"><div class="meta"><b>${w.by}</b><span class="muted">${w.date}</span></div>${w.text}</div>`; })}
        </section>
        <section class="sec"><h2>In ${p.first}'s words</h2><div class="eyebrow" style="margin:.75rem 0 .25rem">What I want my doctor to know</div><p>${p.wantDoctorKnow}</p>
          ${p.questions.length ? h`<div class="eyebrow" style="margin:.75rem 0 .25rem">Questions for this visit</div><ul>${p.questions.map(function (x) { return h`<li>${x}</li>`; })}</ul>` : ''}</section>
      </div>
    </div>`;
  }
  function notes(p) {
    return h`
    <div class="grid2" style="grid-template-columns:minmax(0,1.2fr) minmax(0,1fr)">
      <section class="sec"><h2>Notes</h2><p class="small muted">Labelled by who wrote them. ${p.first} sees every note. ${p.first} decides who else does.</p>
        ${sel.notesFor(p).map(function (n) { return h`<article class="note ${n.role}"><div class="meta"><b>${n.kind}</b>${n.draft ? U.pill('Draft', 'blue') : ''}${n.shared ? U.pill('Shown to future care teams', 'green') : U.pill('Not shared onward', 'neutral')}<span class="muted">${n.author} · ${ROLE[n.role]} · ${U.fmt(n.date)}</span></div><p style="margin:0">${n.text}</p></article>`; })}
      </section>
      <section class="sec"><h2>Add a note</h2>
        <form data-submit="addNote"><input type="hidden" name="pid" value="${p.id}">
          <label for="nk">Type</label><select id="nk" name="kind">${KINDS.map(function (k) { return h`<option>${k}</option>`; })}</select>
          <label for="nt">Note</label><textarea id="nt" name="text" rows="5" required placeholder="What should ${p.first} take away, work on for Level ${Math.min(p.level + 1, 10)}, or what should the adult team know?"></textarea>
          <label class="check"><input type="checkbox" name="shared" checked><span>Show to future care teams</span></label>
          <button class="btn btn-primary">Save note</button>
        </form></section>
    </div>`;
  }
  function care(p) {
    return h`<div class="grid2">
      <section class="sec"><div class="sec-head"><h2>Family contacts</h2><button class="btn btn-sm" data-action="editContact" data-pid="${p.id}">${ic('plus', 16)} Add</button></div>
        <ul class="card-list">${p.contacts.map(function (c) { return h`<li><div class="grow"><b>${c.name}</b><div class="small muted">${c.rel} · ${c.phone || 'No phone'}</div></div>${c.visible ? U.pill('Visible to doctors', 'green') : U.pill('Hidden by patient', 'neutral')}<button class="btn btn-sm btn-quiet" data-action="editContact" data-pid="${p.id}" data-id="${c.id}" aria-label="Edit ${c.name}">${ic('edit', 16)}</button><button class="btn btn-sm btn-quiet" data-action="removeItem" data-list="contacts" data-pid="${p.id}" data-id="${c.id}" aria-label="Remove ${c.name}">${ic('trash', 16)}</button></li>`; })}</ul></section>
      <section class="sec"><div class="sec-head"><h2>Past and current care team</h2><button class="btn btn-sm" data-action="editTeam" data-pid="${p.id}">${ic('plus', 16)} Add</button></div>
        <ul class="card-list">${p.careTeam.map(function (c) { return h`<li><div class="grow"><b>${c.name}</b><div class="small muted">${c.role}${c.phone ? ' · ' + c.phone : ''}</div></div><button class="btn btn-sm btn-quiet" data-action="editTeam" data-pid="${p.id}" data-id="${c.id}" aria-label="Edit ${c.name}">${ic('edit', 16)}</button><button class="btn btn-sm btn-quiet" data-action="removeItem" data-list="careTeam" data-pid="${p.id}" data-id="${c.id}" aria-label="Remove ${c.name}">${ic('trash', 16)}</button></li>`; })}</ul></section></div>`;
  }
  function records(p) {
    return h`<section class="sec"><div class="sec-head"><h2>Linked records and resources</h2><button class="btn btn-sm" data-action="editLink" data-pid="${p.id}">${ic('plus', 16)} Add link</button></div>
      <div class="notice">${ic('shield')}<span>${F.COPY.noRecords}</span></div>
      <ul class="card-list">${p.links.map(function (l) { return h`<li>${ic('link')}<div class="grow"><b>${l.title}</b><div class="small muted">${l.sub}</div></div><a class="btn btn-sm" href="${l.url}" target="_blank" rel="noopener">Open ${ic('ext', 14)}</a><button class="btn btn-sm btn-quiet" data-action="removeItem" data-list="links" data-pid="${p.id}" data-id="${l.id}" aria-label="Remove ${l.title}">${ic('trash', 16)}</button></li>`; })}</ul>
      ${p.links.length ? '' : U.empty('No links yet', 'Records stay where they live. Link to them here.')}</section>`;
  }
  function access(p) {
    var rows = S.get().access.filter(function (a) { return a.pid === p.id; });
    return h`<section class="sec plain"><h2>Who has opened this profile</h2><div class="table-wrap"><table class="data"><thead><tr><th scope="col">When</th><th scope="col">Who</th><th scope="col">How</th></tr></thead><tbody>${rows.map(function (a) { return h`<tr><td>${U.fmtTime(a.time)}</td><td>${a.who}</td><td>${a.how}</td></tr>`; })}</tbody></table></div>${rows.length ? '' : U.empty('Not opened yet', 'Opens are recorded here.')}</section>`;
  }

  F.Pages.profile = function (params) {
    var p = sel.patient(params.id);
    if (!p) return { title: 'Not found', html: h`<h1>Patient not found</h1><p><a href="#/patients">Back to patients</a></p>` };
    if (F.ui._pid !== p.id) { F.ui._pid = p.id; F.ui.pt = 'overview'; }
    var tabs = [['overview', 'Overview'], ['notes', 'Notes (' + p.notes.length + ')'], ['care', 'Contacts and care team'], ['records', 'Linked records'], ['access', 'Access']];
    var body = { overview: overview, notes: notes, care: care, records: records, access: access }[F.ui.pt](p);
    return {
      title: sel.full(p),
      after: function (root, loc, isNav) { if (isNav) setTimeout(function () { var last = S.get().access[0]; if (!(last && last.pid === p.id && last.how === 'Portal' && Date.now() - new Date(last.time) < 60000)) A.log(p.id, sel.me().name, 'Portal'); }, 50); },
      html: h`
      <a class="crumb" href="#/patients">${ic('back', 16)} All patients</a>
      <div class="profile-head" data-rise>
        ${U.avatar(p, 72)}
        <div class="grow"><h1>${sel.full(p)}</h1><div class="row wrap gap-s muted"><span>Age ${p.age}</span><span>·</span><span>Folio ID ${sel.fid(p.folioId)}</span><span>·</span>${U.pill(p.condition, 'blue')}${U.statusPill(p)}</div></div>
        <div class="row wrap"><button class="btn" data-action="editPatient" data-pid="${p.id}">${ic('edit', 16)} Edit info</button><a class="btn btn-primary" href="#/visit/${p.id}">${ic('visit', 16)} Start visit</a></div>
      </div>
      <div class="subtabs" role="tablist" aria-label="Patient sections">${tabs.map(function (t) { return h`<button role="tab" aria-selected="${String(F.ui.pt === t[0])}" data-action="ptab" data-v="${t[0]}">${t[1]}</button>`; })}</div>
      <div role="tabpanel">${body}</div>`
    };
  };
})(window.Folio);
