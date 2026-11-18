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
  /* v2 research update: support in this visit, big decisions, medication confirmation, structured handoff */
  F.actions.editSupport = listForm({ list: 'supportThisVisit', noun: 'support note', fields: [{ name: 'label', label: 'Short label', req: true, ph: 'Big decisions' }, { name: 'text', label: 'How to help in the visit', type: 'textarea', req: true }],
    after: function (d) { d.by = 'Peds team: ' + sel.me().name; d.date = U.monthYear(new Date().toISOString()); return d; } });
  F.actions.editDecision = function (el) {
    var p = sel.patient(el.dataset.pid), d0 = p.decisionSupport || {};
    U.formModal({ title: 'Who helps with big decisions?', lead: 'Shows in the adult view as "Make big decisions: with help". Leave the name empty if ' + p.first + ' decides alone.', fields: [{ name: 'name', label: 'Name', value: d0.name }, { name: 'rel', label: 'Relationship', value: d0.rel, ph: 'Mother, sibling, partner, support worker' }],
      onSubmit: function (d) { A.setDecisionSupport(p.id, d); U.toast('Saved'); } });
  };
  F.actions.confirmMeds = function (el) { var p = sel.patient(el.dataset.pid); A.confirmMeds(p.id); U.toast('Medications and allergies confirmed. Adult doctors see today\'s date.'); };
  F.actions.saveHandoff = function (d) {
    var p = sel.patient(d.pid); A.saveHandoff(p.id, d, !!d.final);
    U.toast(d.final ? 'Handoff note shared. Adult teams see it when ' + p.first + ' taps the card.' : 'Handoff draft saved. Adult teams do not see drafts.');
  };
  function handoffDl(f) {
    var rows = [['meds', 'Medications and repeats'], ['referrals', 'Referrals and who takes over'], ['upcoming', 'Upcoming and due'], ['managed', 'How diabetes has been managed'], ['watch', 'What to watch']].filter(function (r) { return f && f[r[0]]; });
    return rows.length ? h`<dl class="kv" style="margin-top:.5rem">${rows.map(function (r) { return h`<dt>${r[1]}</dt><dd>${f[r[0]]}</dd>`; })}</dl>` : '';
  }
  function legend() { return h`<dl class="legend small">${['own', 'help', 'learning'].map(function (k) { return h`<div><dt>${U.skillPill(k)}</dt><dd>${F.SKILL_STATUS_HELP[k]}</dd></div>`; })}</dl>`; }
  F.actions.removeItem = function (el) {
    U.confirmModal({ title: 'Remove this?', body: 'You can add it again later.', cta: 'Remove', danger: true, onOk: function () { A.remove(el.dataset.pid, el.dataset.list, el.dataset.id); U.toast('Removed'); } });
  };

  /* Priority order for a visit: the teen's own questions, skills, medications and allergies. Context and level reference after. */
  function overview(p) {
    var L = sel.level(p.level), nx = p.level < 10 ? sel.level(p.level + 1) : null;
    return h`
    <div class="grid2">
      <div class="stack">
        <section class="sec"><h2>In ${p.first}'s words</h2>
          ${p.summary3 ? h`<div class="eyebrow" style="margin:.75rem 0 .25rem">${p.first}'s diabetes in 3 sentences</div><div class="s3-quote"><p>${[p.summary3.s1, p.summary3.s2, p.summary3.s3].filter(Boolean).join(' ')}</p></div>` : ''}
          ${p.questions.length ? h`<div class="eyebrow" style="margin:.75rem 0 .25rem">Questions for this visit</div><ul>${p.questions.map(function (x) { return h`<li>${x}</li>`; })}</ul>` : h`<p class="small muted">No questions added for this visit.</p>`}
          <div class="eyebrow" style="margin:.75rem 0 .25rem">What I want my doctor to know</div><p>${p.wantDoctorKnow}</p></section>
        <section class="sec"><div class="sec-head"><h2>Skills at this level</h2><a class="btn btn-sm btn-primary" href="#/visit/${p.id}">Start visit</a></div>
          ${F.SKILLS.map(function (s) { return h`<div class="skillrow"><div class="nm"><b>${s.name}</b><span class="small muted">${s.sub}</span>${p.selfCheck && p.selfCheck.skills && p.selfCheck.skills[s.id] ? h`<span class="selfview small">${p.first}'s view: <b>${F.CHECK_WORD[p.selfCheck.skills[s.id]]}</b></span>` : ''}</div>${U.skillPill(p.skills[s.id])}</div>`; })}
          <p class="small muted">Skills are signed off in person during a visit.${p.selfCheck ? ' ' + p.first + '\'s view is from their readiness check on ' + U.fmtFull(p.selfCheck.date) + '.' : ''}</p>
          ${(p.goals || []).length ? h`<div class="vq" style="margin-top:.75rem"><div class="eyebrow">${p.first}'s goals</div><ul>${p.goals.map(function (g) { var q = F.checkItem(g.id); return q ? h`<li>${q.goal} <span class="muted small">· ${g.done.filter(Boolean).length} of 3 steps done</span></li>` : ''; })}</ul></div>` : ''}
          ${legend()}
        </section>
        <section class="sec"><div class="sec-head"><h2>Medications, supplies and allergies</h2>${sel.medsStale(p) ? U.pill('May be out of date', 'attn') : U.pill('Confirmed', 'green')}</div>
          ${(p.meds || []).length ? h`<ul class="card-list">${p.meds.map(function (m) { return h`<li><div class="grow"><b>${m.name}</b><div class="small muted">${m.kind === 'supply' ? 'Supply' : 'Medication'}${m.detail ? ' · ' + m.detail : ''}</div></div></li>`; })}</ul>` : U.empty('No list yet', p.first + ' adds medications and supplies in the app.')}
          <p style="margin:.75rem 0 0"><b>Allergies:</b> ${(p.allergies || []).length ? p.allergies.map(function (a) { return a.name + (a.reaction ? ' (' + a.reaction.toLowerCase() + ')' : ''); }).join(', ') : p.noAllergies ? 'No known allergies' : 'Not recorded yet. Ask ' + p.first + ' at the next visit.'}</p>
          <div class="row between wrap" style="margin-top:.75rem"><span class="small muted">${p.medsConfirmed ? 'Last confirmed ' + U.fmtFull(p.medsConfirmed.date) + ' by ' + p.medsConfirmed.by + '.' : 'Not confirmed yet.'} ${p.first} keeps this list in the app. Adult doctors see it first.</span><button class="btn btn-sm btn-primary" data-action="confirmMeds" data-pid="${p.id}">${ic('check', 16)} Confirm list</button></div>
        </section>
      </div>
      <div class="stack">
        <section class="sec"><div class="sec-head"><h2>How to work with ${p.first}</h2><button class="btn btn-sm" data-action="addWorkWith" data-pid="${p.id}">${ic('plus', 16)} Add</button></div>
          ${p.howToWork.map(function (w) { return h`<div class="note ${w.by.indexOf('Patient') === 0 ? 'patient' : 'peds'}"><div class="meta"><b>${w.by}</b><span class="muted">${w.date}</span></div>${w.text}</div>`; })}
        </section>
        <section class="sec"><div class="sec-head"><h2>Where ${p.first} may need support in a visit</h2><button class="btn btn-sm" data-action="editSupport" data-pid="${p.id}">${ic('plus', 16)} Add</button></div>
          <p class="small muted">Shows above the fold in the adult view.</p>
          ${(p.supportThisVisit || []).map(function (x) { return h`<div class="note peds"><div class="meta"><b>${x.label}</b><span class="muted">${x.by || ''}${x.date ? ' · ' + x.date : ''}</span><button class="btn btn-sm btn-quiet" data-action="editSupport" data-pid="${p.id}" data-id="${x.id}" aria-label="Edit ${x.label}">${ic('edit', 16)}</button><button class="btn btn-sm btn-quiet" data-action="removeItem" data-list="supportThisVisit" data-pid="${p.id}" data-id="${x.id}" aria-label="Remove ${x.label}">${ic('trash', 16)}</button></div>${x.text}</div>`; })}
          ${(p.supportThisVisit || []).length ? '' : U.empty('Nothing added', 'Add how a new clinician can help ' + p.first + ' in a visit.')}
          <div class="row between wrap" style="margin-top:.75rem"><span><b>Big decisions:</b> ${p.decisionSupport ? 'with help from ' + p.decisionSupport.name + (p.decisionSupport.rel ? ', ' + p.decisionSupport.rel.toLowerCase() : '') : 'on their own'}</span><button class="btn btn-sm" data-action="editDecision" data-pid="${p.id}">${ic('edit', 16)} Edit</button></div>
        </section>
        <section class="sec"><div class="eyebrow">Level ${p.level} of 10 · ${L.name}</div>
          ${U.stairs(p.level)}
          <details class="lvl-more"><summary>What this level means</summary><dl class="kv"><dt>Who leads</dt><dd>${L.leads}</dd><dt>I can</dt><dd>${L.can}</dd><dt>Evidence</dt><dd>${L.evidence}</dd><dt>Unlocks</dt><dd>${L.unlocks}</dd></dl></details>
          <p class="small muted" style="margin-top:1rem">${p.levelSignoff ? 'Signed off Level ' + p.levelSignoff.level + ' by ' + p.levelSignoff.by + ', ' + U.fmtFull(p.levelSignoff.date) + '.' : ''} ${nx ? 'Next: Level ' + nx.n + ', ' + nx.name + '.' : 'Final level.'}</p>
        </section>
      </div>
    </div>`;
  }
  function handoffForm(p) {
    var d = p.notes.filter(function (n) { return n.kind === 'Handoff note' && n.draft; })[0] || {}, f = d.fields || {};
    var fl = function (name, label, ph) { return h`<label for="ho-${name}">${label}</label><textarea id="ho-${name}" name="${name}" rows="2" placeholder="${ph}">${f[name] || ''}</textarea>`; };
    return h`<div class="divider-label" style="margin-top:1.5rem"><span class="eyebrow">Handoff note for the adult team</span></div>
      <p class="small muted">Structured so a receiving doctor can find each answer fast. Drafts stay here until you share them.</p>
      <form data-submit="saveHandoff"><input type="hidden" name="pid" value="${p.id}">
        <label for="ho-summary">Summary</label><textarea id="ho-summary" name="summary" rows="2" required placeholder="One or two lines for the adult team">${d.text || ''}</textarea>
        ${fl('meds', 'Current medications and how long repeats last', 'Repeats last until...')}
        ${fl('referrals', 'Referrals made and who takes over each specialty', 'Adult endocrinology referral sent...')}
        ${fl('upcoming', 'Upcoming appointments and what is due', 'Blood work due...')}
        ${fl('managed', 'How diabetes has been managed', 'Pump and sensor, A1C trend in linked records')}
        ${fl('watch', 'What to watch', 'Lows after sports...')}
        <label class="check"><input type="checkbox" name="final"><span>Ready to share with adult teams (otherwise saved as a draft)</span></label>
        <button class="btn btn-primary">Save handoff note</button>
      </form>`;
  }
  function notes(p) {
    return h`
    <div class="grid2" style="grid-template-columns:minmax(0,1.2fr) minmax(0,1fr)">
      <section class="sec"><h2>Notes</h2><p class="small muted">Labelled by who wrote them. ${p.first} sees every note. ${p.first} decides who else does.</p>
        ${sel.notesFor(p).map(function (n) { return h`<article class="note ${n.role}"><div class="meta"><b>${n.kind}</b>${n.draft ? U.pill('Draft', 'blue') : ''}${n.shared ? U.visChip('future') : U.visChip('team', 'Maya + care team'.replace('Maya', p.first))}<span class="muted">${n.author} · ${ROLE[n.role]} · ${U.fmt(n.date)}</span></div><p style="margin:0">${n.text}</p>${n.fields ? handoffDl(n.fields) : ''}</article>`; })}
      </section>
      <section class="sec"><h2>Add a note</h2>
        <form data-submit="addNote"><input type="hidden" name="pid" value="${p.id}">
          <label for="nk">Type</label><select id="nk" name="kind">${KINDS.map(function (k) { return h`<option>${k}</option>`; })}</select>
          <label for="nt">Note</label><textarea id="nt" name="text" rows="5" required placeholder="What should ${p.first} take away, work on for Level ${Math.min(p.level + 1, 10)}, or what should the adult team know?"></textarea>
          <label class="check"><input type="checkbox" name="shared" checked><span>Show to future care teams</span></label>
          <button class="btn btn-primary">Save note</button>
        </form>
        ${handoffForm(p)}</section>
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
      after: function (root, loc, isNav) { if (isNav) setTimeout(function () { var last = S.get().access[0]; if (!(last && last.pid === p.id && last.how === 'Portal' && Date.now() - new Date(last.time) < 60000)) { U.hold = true; try { A.log(p.id, sel.me().name, 'Portal'); } finally { U.hold = false; } } }, 50); },
      html: h`
      <a class="crumb" href="#/patients">${ic('back', 16)} All patients</a>
      <section class="hero" data-rise><span class="tape" aria-hidden="true"></span>
        <div class="hero-av">${U.avatar(p, 112)}</div>
        <div class="grow"><div class="eyebrow">Folio ID ${sel.fid(p.folioId)}${F.Pages.cardId(p) ? h` · Card ${F.Pages.cardId(p)}${F.Pages.shapeName(p) ? ' (' + F.Pages.shapeName(p).toLowerCase() + ')' : ''}` : ''}</div><h1>${sel.full(p)}</h1><div class="facts"><span>Age ${p.age}</span>${U.pill(p.condition, 'blue')}${U.statusPill(p)}${p.attention && p.attentionReason ? h`<span class="small">${p.attentionReason}</span>` : ''}<span class="muted">Level ${p.level} · ${sel.level(p.level).name}</span></div></div>
        <div class="row wrap"><button class="btn" data-action="editPatient" data-pid="${p.id}">${ic('edit', 16)} Edit info</button><a class="btn btn-primary" href="#/visit/${p.id}">${ic('visit', 16)} Start visit</a></div>
      </section>
      <div class="subtabs" role="tablist" aria-label="Patient sections">${tabs.map(function (t) { return h`<button role="tab" aria-selected="${String(F.ui.pt === t[0])}" data-action="ptab" data-v="${t[0]}">${t[1]}</button>`; })}</div>
      <div role="tabpanel" class="tabpanel">${body}</div>`
    };
  };
})(window.Folio);
