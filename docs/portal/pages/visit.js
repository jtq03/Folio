/* Visit mode: a focused 3-step flow. Review skills, decide, write one note, sign off with the red star. */
(function (F) {
  var h = F.UI.h, ic = F.UI.ic, S = F.Store, sel = S.sel, U = F.UI, A = S.act;
  function fresh(pid) { F.ui.v = { pid: pid, step: 1, mode: 'advance', inPerson: false, confirmed: false, override: false, kind: 'Visit takeaway', text: '', shared: true, done: null }; }

  F.actions.vskill = function (el) { A.setSkill(el.dataset.pid, el.dataset.sid, el.dataset.v); };
  F.actions.vstep = function (el) { F.ui.v.step = +el.dataset.v; F.rerender(true); };
  F.actions.vmode = function (el) { F.ui.v.mode = el.dataset.v; F.rerender(false); };
  F.actions.vfinish = function (el) {
    var v = F.ui.v, p = sel.patient(v.pid);
    if (v.mode === 'hold') {
      if (v.text.trim()) A.addNote(p.id, { kind: v.kind, text: v.text.trim(), shared: v.shared, author: sel.me().name, role: 'peds' });
      v.done = { held: true }; F.rerender(true); return;
    }
    var lv = A.advance(p.id, { text: v.text.trim(), kind: v.kind, shared: v.shared });
    v.done = { level: lv, transfer: p.transferred }; F.rerender(true);
    U.toast(p.transferred ? 'Transfer complete' : p.first + ' is now Level ' + lv + '. They see it in the app.', true);
  };

  F.Pages.visitPicker = function () {
    var pts = S.get().patients.slice().sort(function (a, b) { var r = { ready: 0, attention: 1, track: 2, transferred: 3 }; return r[sel.status(a)] - r[sel.status(b)]; });
    return { title: 'Visit mode', html: h`
      ${F.Pages.head('Visit mode', h`Who is in <em class="it">today</em>?`, 'A focused view for the visit itself: review skills, decide, write one note. No extra forms.')}
      <div class="table-wrap sec plain" style="padding:.5rem"><table class="data"><caption class="sr">Choose a patient to start a visit</caption><thead><tr><th scope="col">Patient</th><th scope="col">Level</th><th scope="col">Skills on their own</th><th scope="col">Status</th><th scope="col"><span class="sr">Start</span></th></tr></thead>
      <tbody>${pts.map(function (p) { return h`<tr><td><div class="row">${U.avatar(p, 36)}<b>${sel.full(p)}</b></div></td><td>${p.level} · ${sel.level(p.level).name}</td><td>${sel.ownCount(p)} of 5</td><td>${U.statusPill(p)}</td><td style="text-align:right"><a class="btn btn-sm ${sel.status(p) === 'ready' ? 'btn-primary' : ''}" href="#/visit/${p.id}">Start visit</a></td></tr>`; })}</tbody></table></div>` };
  };

  F.Pages.visit = function (params) {
    var p = sel.patient(params.id);
    if (!p) return { title: 'Visit', html: h`<h1>Patient not found</h1><p><a href="#/visit">Back</a></p>` };
    if (!F.ui.v || F.ui.v.pid !== p.id) fresh(p.id);
    var v = F.ui.v, req = S.get().program.requiredSkills, own = sel.ownCount(p), top = p.level === 10, nx = sel.level(Math.min(p.level + 1, 10));

    if (v.done) {
      var d = v.done, nextReady = S.get().patients.filter(function (x) { return x.id !== p.id && sel.status(x) === 'ready'; })[0];
      return { title: 'Visit complete', html: h`<div class="done-sheet">
        ${d.held ? h`<h1>Visit saved</h1><p class="muted" style="margin-inline:auto">${p.first} stays at Level ${p.level}. Progress pauses, it never costs a level.</p>` :
        h`<div class="eyebrow red">Signed off</div><h1>${d.transfer ? 'Transfer complete' : h`${p.first} is now <em class="it">Level ${d.level}</em>`}</h1>
        ${U.stamp(d.transfer ? 'Final sign-off' : 'Level ' + d.level + ' · ' + sel.level(d.level).name, sel.me().name + ', ' + U.fmtFull(new Date().toISOString().slice(0, 10)))}
        <p class="muted" style="margin-inline:auto">${p.first} sees this in the app right away${d.transfer ? '' : ', with a short celebration'}.</p>`}
        <div class="row wrap" style="justify-content:center;margin-top:1rem"><a class="btn btn-primary" href="#/patients/${p.id}" data-action="vreset">Back to ${p.first}</a>${nextReady ? h`<a class="btn" href="#/visit/${nextReady.id}">Next ready: ${nextReady.first}</a>` : ''}<a class="btn btn-quiet" href="#/">Home</a></div></div>` };
    }

    var steps = ['Review skills', 'Decide', 'Note and sign off'];
    var stepper = h`<ol class="stepper" aria-label="Visit steps">${steps.map(function (s, i) { var n = i + 1; return h`<li class="${n < v.step ? 'done' : ''}" ${n === v.step ? h`aria-current="step"` : ''}><b>${n < v.step ? '✓' : n}</b>${s}</li>`; })}</ol>`;
    var body;
    if (v.step === 1) {
      body = h`<h2>Review skills at Level ${p.level}</h2><p class="muted">Ask ${p.first} to show you, then set where each skill is today. Changes save as you go.</p>
        ${F.SKILLS.map(function (s) { return h`<div class="visit-skill"><div><b>${s.name}</b><div class="small muted">${s.sub}</div></div>
          <div class="seg" role="group" aria-label="${s.name} status">${['learning', 'help', 'own'].map(function (k) { return h`<button data-action="vskill" data-pid="${p.id}" data-sid="${s.id}" data-v="${k}" aria-pressed="${String(p.skills[s.id] === k)}">${F.SKILL_STATUS[k]}</button>`; })}</div></div>`; })}
        <div class="row between" style="margin-top:1.25rem"><span class="muted">${own} of 5 on their own · ${req} needed to advance</span><button class="btn btn-primary" data-action="vstep" data-v="2">Next: decide ${ic('arrow', 16)}</button></div>`;
    } else if (v.step === 2) {
      var meets = own >= req, needOverride = v.mode === 'advance' && !meets;
      var cfg = S.get().program, ok = v.mode === 'hold' || ((!cfg.inPerson || v.inPerson) && v.confirmed && (!needOverride || v.override));
      body = h`<h2>Decide</h2>
        <div class="notice">${ic('info')}<span>${meets ? own + ' of 5 skills are on their own. That meets the ' + req + ' needed.' : 'Only ' + own + ' of 5 skills are on their own. ' + req + ' are needed. You can still advance and leave a note.'}</span></div>
        <label class="choice"><input type="radio" name="vm" ${v.mode === 'advance' ? 'checked' : ''} data-action="vmode" data-v="advance"><span><b>${top ? 'Complete final sign-off and transfer' : 'Advance to Level ' + nx.n + ': ' + nx.name}</b><br><span class="muted small">${top ? 'Marks the transfer complete.' : nx.leads + '. ' + nx.unlocks + ' unlock.'}</span></span></label>
        <label class="choice"><input type="radio" name="vm" ${v.mode === 'hold' ? 'checked' : ''} data-action="vmode" data-v="hold"><span><b>Hold at Level ${p.level}</b><br><span class="muted small">Keep practising. Progress pauses, it never costs a level.</span></span></label>
        ${v.mode === 'advance' ? h`<div class="divider-label"><span class="eyebrow">Before you sign off</span></div>
          ${cfg.inPerson ? h`<label class="check"><input type="checkbox" ${v.inPerson ? 'checked' : ''} data-bind="vi"><span>I reviewed these skills in person at a routine visit</span></label>` : ''}
          <label class="check"><input type="checkbox" ${v.confirmed ? 'checked' : ''} data-bind="vc"><span>${p.first} confirms they are ready to move up</span></label>
          ${needOverride ? h`<label class="check"><input type="checkbox" ${v.override ? 'checked' : ''} data-bind="vo"><span>Advance even though fewer than ${req} skills are on their own (note required)</span></label>` : ''}
          <p class="small muted">Family is informed, not given a veto.</p>` : ''}
        <div class="row between" style="margin-top:1.25rem"><button class="btn" data-action="vstep" data-v="1">${ic('back', 16)} Back</button><button class="btn btn-primary" data-action="vstep" data-v="3" ${ok ? '' : 'disabled aria-disabled="true"'}>Next: note ${ic('arrow', 16)}</button></div>`;
    } else {
      var needNote = v.mode === 'advance' && !top && own < req, can = !needNote || v.text.trim().length > 2;
      body = h`<h2>One note, then sign off</h2><p class="muted">${p.first} sees every note in the app. ${p.first} decides who else does.</p>
        <label for="vk">Type</label><select id="vk" data-bind="vkind"><option>Visit takeaway</option><option>Next-level goals</option><option>Handoff note</option><option>Behavioural note</option></select>
        <label for="vt">Note ${needNote ? '(required)' : '(optional)'}</label><textarea id="vt" rows="5" data-bind="vtext" placeholder="Write what ${p.first} should take away, what to work on for Level ${nx.n}, or what the adult team should know.">${v.text}</textarea>
        <label class="check"><input type="checkbox" ${v.shared ? 'checked' : ''} data-bind="vshare"><span>Show to future care teams</span></label>
        <div class="row between" style="margin-top:1.25rem"><button class="btn" data-action="vstep" data-v="2">${ic('back', 16)} Back</button>
        <button class="btn ${v.mode === 'advance' ? 'btn-cta' : 'btn-primary'}" data-action="vfinish" ${can ? '' : 'disabled aria-disabled="true"'}>${v.mode === 'advance' ? (top ? 'Sign off and complete transfer' : 'Sign off Level ' + nx.n) : 'Save visit'}</button></div>`;
    }
    return { title: 'Visit with ' + p.first, html: h`
      <a class="crumb" href="#/patients/${p.id}">${ic('back', 16)} ${sel.full(p)}</a>
      ${F.Pages.head('Visit mode · Level ' + p.level + ' ' + sel.level(p.level).name, h`Visit with <em class="it">${p.first}</em>`, '', h`<a class="btn btn-quiet" href="#/visit">Exit visit</a>`)}
      ${stepper}<section class="sec" style="max-width:860px">${body}</section>` };
  };
  F.actions.vreset = function () { F.ui.v = null; };

  /* Bind handlers for visit fields (data-bind writes F.ui[name]; map to F.ui.v) */
  document.addEventListener('input', function (e) { var el = e.target.closest('[data-bind]'); if (!el || !F.ui.v) return; var n = el.dataset.bind, v = F.ui.v;
    if (n === 'vtext') v.text = el.value; if (n === 'vkind') v.kind = el.value; if (n === 'vshare') v.shared = el.checked;
    if (n === 'vi') v.inPerson = el.checked; if (n === 'vc') v.confirmed = el.checked; if (n === 'vo') v.override = el.checked; });
  document.addEventListener('change', function (e) { var el = e.target.closest('[data-bind]'); if (!el || !F.ui.v) return; var n = el.dataset.bind, v = F.ui.v;
    if (n === 'vkind') v.kind = el.value; if (n === 'vshare') v.shared = el.checked; if (n === 'vi') v.inPerson = el.checked; if (n === 'vc') v.confirmed = el.checked; if (n === 'vo') v.override = el.checked;
    if (n === 'vi' || n === 'vc' || n === 'vo') F.rerender(false); });
})(window.Folio);
