/* Admin pages: Access log, Resources, Team, Settings. */
(function (F) {
  var h = F.UI.h, ic = F.UI.ic, S = F.Store, sel = S.sel, U = F.UI, A = S.act;
  F.ui.af = 'all'; F.ui.aq = '';
  F.actions.afilter = function (el) { F.ui.af = el.dataset.v; F.rerender(false); };
  F.actions.exportAccess = function () {
    var rows = [['When', 'Patient', 'Who', 'How']].concat(S.get().access.map(function (a) { var p = sel.patient(a.pid); return [a.time, p ? sel.full(p) : a.pid, a.who, a.how]; }));
    F.download('folio-access-log.csv', rows);
  };

  F.Pages.access = function () {
    var ui = F.ui, all = S.get().access, q = (ui.aq || '').toLowerCase();
    var rows = all.filter(function (a) { var p = sel.patient(a.pid), nm = p ? sel.full(p).toLowerCase() : ''; return (ui.af === 'all' || (ui.af === 'tap' ? a.how.indexOf('Card') === 0 : a.how === 'Portal')) && (!q || nm.indexOf(q) >= 0 || a.who.toLowerCase().indexOf(q) >= 0); });
    var chip = function (v, l) { return h`<button class="chip" data-action="afilter" data-v="${v}" aria-pressed="${String(ui.af === v)}">${l}</button>`; };
    return { title: 'Access log', html: h`
      ${F.Pages.head('Compliance', h`Access <em class="it">log</em>`, 'Who opened a profile and when, including ER card taps. Every open is recorded.', h`<button class="btn" data-action="exportAccess">Export CSV</button>`)}
      <div class="notice" style="margin-bottom:1rem">${ic('shield')}<span>Card sessions end after ${S.get().program.timeout || 10} minutes. Patients can see who opened their profile in their app.</span></div>
      <div class="toolbar"><div class="search">${ic('search', 18)}<label class="sr" for="aq">Search the log</label><input id="aq" type="search" placeholder="Search patient or person" value="${ui.aq}" data-bind="aq" data-rerender autocomplete="off"></div><div class="chips" role="group" aria-label="Filter">${chip('all', 'All')}${chip('tap', 'Card taps')}${chip('portal', 'Portal')}</div></div>
      <div class="table-wrap sec plain" style="padding:.5rem"><table class="data"><caption class="sr">Access log</caption><thead><tr><th scope="col">When</th><th scope="col">Patient</th><th scope="col">Who</th><th scope="col">How</th></tr></thead>
      <tbody>${rows.map(function (a) { var p = sel.patient(a.pid); return h`<tr><td>${U.fmtTime(a.time)}</td><td>${p ? h`<a class="rowlink" href="#/patients/${p.id}">${sel.full(p)}</a>` : a.pid}</td><td>${a.who}</td><td>${a.how.indexOf('Card') === 0 ? U.pill(a.how, 'blue') : a.how}</td></tr>`; })}</tbody></table>${rows.length ? '' : U.empty('Nothing here', 'No opens match.')}</div>` };
  };

  F.actions.addResource = function () {
    U.formModal({ title: 'Add a resource', lead: 'Published resources appear in the patient app.', fields: [
      { name: 'title', label: 'Title', req: true }, { name: 'kind', label: 'Type', type: 'select', options: ['Guide', 'Checklist', 'Video', 'Worksheet'] },
      { name: 'mins', label: 'Length (for example "5 min read")', value: '5 min read' }, { name: 'tag', label: 'Topic', type: 'select', options: ['Learn', 'Visits', 'Speaking up'] },
      { name: 'body', label: 'Content', type: 'textarea', req: true }], cta: 'Add resource',
      onSubmit: function (d) { A.addResource({ title: d.title, kind: d.kind, mins: d.mins, tags: [d.tag], body: d.body }); U.toast('Resource added'); } });
  };
  F.actions.togglePub = function (el) { A.togglePublish(el.dataset.id); };
  F.actions.rmRes = function (el) { U.confirmModal({ title: 'Remove this resource?', body: 'Patients will no longer see it.', cta: 'Remove', danger: true, onOk: function () { A.removeResource(el.dataset.id); } }); };
  F.actions.prevRes = function (el) { var r = S.get().resources.filter(function (x) { return x.id === el.dataset.id; })[0]; U.modal(h`<div class="eyebrow">${r.kind} · ${r.mins}</div><h2 style="margin:.4rem 0 .75rem">${r.title}</h2><p>${r.body}</p><div class="mform-actions"><button class="btn btn-primary" data-close>Done</button></div>`); };

  F.Pages.resources = function () {
    var rs = S.get().resources;
    return { title: 'Resources', html: h`
      ${F.Pages.head('Library', h`<em class="it">Resources</em>`, 'Curate what patients see in their app. Unpublish to hide without deleting.', h`<button class="btn btn-primary" data-action="addResource">${ic('plus')} Add resource</button>`)}
      <div class="table-wrap sec plain" style="padding:.5rem"><table class="data"><caption class="sr">Resources</caption><thead><tr><th scope="col">Title</th><th scope="col">Type</th><th scope="col">Topic</th><th scope="col">Published</th><th scope="col"><span class="sr">Actions</span></th></tr></thead>
      <tbody>${rs.map(function (r) { return h`<tr><td><b>${r.title}</b><div class="tiny muted">${r.mins}</div></td><td>${r.kind}</td><td>${r.tags.join(', ')}</td>
        <td><label class="switch"><input type="checkbox" ${r.published ? 'checked' : ''} data-change="togglePub" data-id="${r.id}" aria-label="Published: ${r.title}"><span class="track"></span></label></td>
        <td style="text-align:right"><button class="btn btn-sm" data-action="prevRes" data-id="${r.id}">Preview</button> <button class="btn btn-sm btn-quiet" data-action="rmRes" data-id="${r.id}" aria-label="Remove ${r.title}">${ic('trash', 16)}</button></td></tr>`; })}</tbody></table></div>` };
  };
  F.actions.togglePub = function (el) { A.togglePublish(el.dataset.id); };

  F.actions.invite = function () {
    U.formModal({ title: 'Invite a team member', lead: 'They get an email to set up their account.', cta: 'Send invite', fields: [
      { name: 'name', label: 'Full name', req: true }, { name: 'email', label: 'Work email', type: 'email', req: true }, { name: 'title', label: 'Job title' }, { name: 'role', label: 'Role', type: 'select', options: Object.keys(F.ROLES), value: 'Clinician' }],
      onSubmit: function (d) { A.invite(d); U.toast('Invite sent to ' + d.email); } });
  };
  F.actions.roleChange = function (el) { A.setRole(el.dataset.id, el.value); U.toast('Role updated'); };
  F.actions.userOff = function (el) { var u = S.get().team.filter(function (x) { return x.id === el.dataset.id; })[0]; U.confirmModal({ title: 'Deactivate ' + u.name + '?', body: 'They lose access immediately. Their notes stay.', cta: 'Deactivate', danger: true, onOk: function () { A.setActive(u.id, false); U.toast(u.name + ' deactivated'); } }); };
  F.actions.userOn = function (el) { A.setActive(el.dataset.id, true); U.toast('Reactivated'); };

  F.Pages.team = function () {
    var tm = S.get().team, me = S.get().me;
    return { title: 'Team', html: h`
      ${F.Pages.head('Staff', h`<em class="it">Team</em>`, 'Staff accounts and roles. Patients live under Patients, not here.', h`<button class="btn btn-primary" data-action="invite">${ic('plus')} Invite</button>`)}
      <div class="table-wrap sec plain" style="padding:.5rem"><table class="data"><caption class="sr">Team members</caption><thead><tr><th scope="col">Name</th><th scope="col">Role</th><th scope="col">Status</th><th scope="col"><span class="sr">Actions</span></th></tr></thead>
      <tbody>${tm.map(function (u) { return h`<tr><td><div class="row">${U.avatar(u, 36)}<div><b>${u.name}</b>${u.id === me ? ' (you)' : ''}<div class="tiny muted">${u.title} · ${u.email}</div></div></div></td>
        <td><label class="sr" for="r-${u.id}">Role for ${u.name}</label><select id="r-${u.id}" style="width:auto;min-height:38px" data-change="roleChange" data-id="${u.id}" ${u.id === me ? 'disabled' : ''}>${Object.keys(F.ROLES).map(function (r) { return h`<option ${r === u.role ? 'selected' : ''}>${r}</option>`; })}</select></td>
        <td>${u.invited ? U.pill('Invited', 'blue') : u.active ? U.pill('Active', 'ready') : U.pill('Deactivated', 'neutral')}</td>
        <td style="text-align:right">${u.id === me ? '' : u.active || u.invited ? h`<button class="btn btn-sm btn-quiet" data-action="userOff" data-id="${u.id}">Deactivate</button>` : h`<button class="btn btn-sm" data-action="userOn" data-id="${u.id}">Reactivate</button>`}</td></tr>`; })}</tbody></table></div>
      <section class="sec" style="margin-top:1.25rem"><h2>What each role can do</h2><div class="perm-grid" style="margin-top:.75rem">${Object.keys(F.ROLES).map(function (r) { return h`<div class="panel"><b>${r}</b><p class="small" style="margin:.25rem 0 0">${F.ROLES[r]}</p></div>`; })}</div><p class="small muted" style="margin-top:.75rem">Roles are shown for the prototype. They are not enforced yet.</p></section>` };
  };

  /* Settings */
  var OPTS = {
    text: [['sm', 'Small'], ['md', 'Default'], ['lg', 'Large'], ['xl', 'Extra large']],
    contrast: [['normal', 'Standard'], ['high', 'High contrast']],
    motion: [['auto', 'Match my device'], ['reduce', 'Reduce motion']],
    spacing: [['normal', 'Default'], ['relaxed', 'Relaxed']]
  };
  F.actions.a11y = function (el) { S.a11y.set(el.dataset.k, el.dataset.v); };
  F.actions.timeout = function (el) { A.program({ timeout: +el.value }); U.toast('Saved'); };
  F.actions.notify = function (el) { var o = {}; o[el.dataset.k] = el.checked; A.program(o); };
  F.actions.exportAll = function () { F.download('folio-roster.csv', [['Name', 'Folio ID', 'Age', 'Level', 'Status']].concat(S.get().patients.map(function (p) { return [sel.full(p), p.folioId, p.age, p.level, sel.status(p)]; }))); };

  F.Pages.settings = function () {
    var a = S.a11y.get(), cfg = S.get().program, st = S.get().clinic;
    var seg = function (k, label) { return h`<div class="setting"><div><b id="lb-${k}">${label}</b></div><div class="seg" role="group" aria-labelledby="lb-${k}">${OPTS[k].map(function (o) { return h`<button data-action="a11y" data-k="${k}" data-v="${o[0]}" aria-pressed="${String(a[k] === o[0])}">${o[1]}</button>`; })}</div></div>`; };
    var sw = function (k, label, desc) { return h`<div class="setting"><div><b>${label}</b><p>${desc}</p></div><label class="switch"><input type="checkbox" ${cfg[k] !== false ? 'checked' : ''} data-change="notify" data-k="${k}" aria-label="${label}"><span class="track"></span></label></div>`; };
    var checks = ['Patient and guardian consent recorded at enrolment', 'Every profile open is logged', 'Folio stores links to records, never records', 'Card sessions time out', 'Patients can see who opened their profile'];
    return { title: 'Settings', html: h`
      ${F.Pages.head('Settings', h`<em class="it">Settings</em>`, 'Accessibility settings apply on this device and take effect straight away.')}
      <div class="settings-grid">
        <section class="sec"><h2>Accessibility</h2><p class="small muted">Text scales everywhere. Reduce motion removes sliding and lifting.</p>${seg('text', 'Text size')}${seg('contrast', 'Contrast')}${seg('motion', 'Motion')}${seg('spacing', 'Text spacing')}</section>
        <section class="sec"><h2>Notifications</h2>${sw('n_ready', 'Patient ready to advance', 'When a patient reaches the skills needed.')}${sw('n_attn', 'Needs attention', 'When no visit note has been added for a while.')}${sw('n_tap', 'Card tapped', 'Each time a card opens a profile.')}</section>
        <section class="sec"><h2>Privacy and compliance</h2>
          <div class="setting"><div><label for="to" style="margin:0">Card session timeout</label><p>How long a tap-opened profile stays open.</p></div><select id="to" style="width:auto" data-change="timeout">${[5, 10, 15, 30].map(function (n) { return h`<option value="${n}" ${n === (cfg.timeout || 10) ? 'selected' : ''}>${n} minutes</option>`; })}</select></div>
          <ul class="card-list" style="margin-top:.5rem">${checks.map(function (c) { return h`<li>${ic('check', 18)}<span>${c}</span></li>`; })}</ul>
          <p class="small muted">Prototype checklist. Not legal advice. A real deployment needs a privacy review under the rules that apply to the hospital.</p></section>
        <section class="sec"><h2>Clinic</h2><dl class="kv"><dt>Hospital</dt><dd>${st.org}</dd><dt>Team</dt><dd>${st.team}</dd><dt>Condition package</dt><dd>Type 1 diabetes</dd></dl></section>
        <section class="sec"><h2>Data</h2><div class="row wrap"><button class="btn" data-action="exportAll">Export roster (CSV)</button><button class="btn btn-danger" data-action="resetDemo">Reset demo data</button></div></section>
      </div>` };
  };
})(window.Folio);
