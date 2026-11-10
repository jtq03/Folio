/* Program pages: Levels and skills (configure), Insights (program-level numbers). */
(function (F) {
  var h = F.UI.h, ic = F.UI.ic, S = F.Store, sel = S.sel, U = F.UI, A = S.act;

  F.actions.progReq = function (el) { A.program({ requiredSkills: +el.value }); U.toast('Saved: ' + el.value + ' of 5 skills needed'); };
  F.actions.progMonths = function (el) { A.program({ minMonths: +el.value }); U.toast('Saved'); };
  F.actions.progPerson = function (el) { A.program({ inPerson: el.checked }); U.toast('Saved'); };
  F.actions.exportLevels = function () {
    var rows = [['Level', 'Name', 'Phase', 'Who leads', 'What I can do', 'Evidence to move up', 'Folio unlocks']].concat(F.LEVELS.map(function (l) { return [l.n, l.name, l.phase, l.leads, l.can, l.evidence, l.unlocks]; }));
    F.download('folio-levels-type1-diabetes.csv', rows);
  };
  F.download = function (name, rows) {
    var csv = rows.map(function (r) { return r.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(','); }).join('\n');
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = name; document.body.appendChild(a); a.click(); a.remove();
    U.toast('Downloaded ' + name);
  };

  F.Pages.levels = function () {
    var cfg = S.get().program, pts = S.get().patients;
    return { title: 'Levels and skills', html: h`
      ${F.Pages.head('Program', h`Levels and <em class="it">skills</em>`, 'How a program configures levels and skill checklists. Each condition is a package.', h`<button class="btn" data-action="exportLevels">Export CSV</button>`)}
      <div class="pkg" role="group" aria-label="Condition packages" style="margin-bottom:1.25rem"><button class="chip" aria-pressed="true">Type 1 diabetes</button><button class="chip" disabled>Asthma · soon</button><button class="chip" disabled>Epilepsy · soon</button><button class="chip" disabled>Cystic fibrosis · soon</button></div>
      <div class="grid2" style="margin-bottom:1.5rem">
        <section class="sec"><h2>Rules for moving up</h2>
          <div class="setting"><div><label for="rq" style="margin:0">Skills needed to advance</label><p>Out of 5 skill areas.</p></div><select id="rq" style="width:auto" data-change="progReq">${[3, 4, 5].map(function (n) { return h`<option ${n === cfg.requiredSkills ? 'selected' : ''}>${n}</option>`; })}</select></div>
          <div class="setting"><div><label for="mm" style="margin:0">Minimum months per level</label><p>Typical pace is 6 to 9.</p></div><select id="mm" style="width:auto" data-change="progMonths">${[1, 3, 6].map(function (n) { return h`<option ${n === cfg.minMonths ? 'selected' : ''}>${n}</option>`; })}</select></div>
          <div class="setting"><div><b>Sign-off in person</b><p>Clinician confirms at a routine visit.</p></div><label class="switch"><input type="checkbox" ${cfg.inPerson ? 'checked' : ''} data-change="progPerson" aria-label="Require in-person sign-off"><span class="track"></span></label></div>
        </section>
        <section class="sec"><h2>Five skill areas</h2><p class="small muted">Scored at every level. Levels measure skills, never health outcomes.</p>
          ${F.SKILLS.map(function (s, i) { return h`<div class="skillrow"><b style="font:600 1.3rem var(--font-display);width:1.5rem">${i + 1}</b><div class="nm"><b>${s.name}</b><span class="small muted">${s.sub}</span></div></div>`; })}</section>
      </div>
      <div class="table-wrap sec plain" style="padding:.5rem"><table class="data lvl-table"><caption class="sr">All ten levels</caption>
        <thead><tr><th scope="col">Level</th><th scope="col">Name</th><th scope="col">Phase</th><th scope="col">Who leads</th><th scope="col">What I can do</th><th scope="col">Evidence to move up</th><th scope="col">Patients</th></tr></thead>
        <tbody>${F.LEVELS.map(function (l) { return h`<tr><td>${l.n}</td><td><b>${l.name}</b></td><td>${U.pill(l.phase, { Aware: 'blue', Involved: 'blue', Shared: 'green', Leading: 'green', Independent: 'dark' }[l.phase])}</td><td>${l.leads}</td><td>${l.can}</td><td>${l.evidence}</td><td>${pts.filter(function (p) { return p.level === l.n; }).length}</td></tr>`; })}</tbody></table></div>
      <section class="sec" style="margin-top:1.25rem"><h2>How to move up</h2><ul>${F.MOVE_UP_RULES.map(function (r) { return h`<li>${r}</li>`; })}</ul></section>` };
  };

  F.Pages.insights = function () {
    var pts = S.get().patients, n = pts.length, acc = S.get().access;
    var own = F.SKILLS.map(function (s) { return Math.round(pts.filter(function (p) { return p.skills[s.id] === 'own'; }).length / n * 100); });
    var phases = ['Aware', 'Involved', 'Shared', 'Leading', 'Independent'].map(function (ph) { return [ph, pts.filter(function (p) { return sel.level(p.level).phase === ph; }).length]; });
    var taps = acc.filter(function (a) { return a.how.indexOf('Card') === 0; }).length;
    var ready = pts.filter(function (p) { return sel.status(p) === 'ready'; }).length;
    return { title: 'Insights', html: h`
      ${F.Pages.head('Program', h`<em class="it">Insights</em>`, 'Program-level numbers for the hospital. Demo data only.')}
      <div class="stats"><div class="stat"><span class="eyebrow">Enrolled</span><b>${n}</b><span>patients</span></div><div class="stat"><span class="eyebrow">Ready to advance</span><b>${ready}</b><span>${Math.round(ready / n * 100)}% of roster</span></div><div class="stat"><span class="eyebrow">Card taps</span><b>${taps}</b><span>ER and adult clinic opens</span></div><div class="stat"><span class="eyebrow">Transferred</span><b>${pts.filter(function (p) { return p.transferred; }).length}</b><span>to adult care</span></div></div>
      <div class="grid2">
        <section class="sec"><h2>Patients by phase</h2>${phases.map(function (x) { return h`<div class="hbar"><span>${x[0]}</span><span class="t"><i style="width:${x[1] / n * 100}%"></i></span><b>${x[1]}</b></div>`; })}</section>
        <section class="sec"><h2>Skills done on their own</h2>${F.SKILLS.map(function (s, i) { return h`<div class="hbar"><span>${s.name}</span><span class="t"><i class="blue" style="width:${own[i]}%"></i></span><b>${own[i]}%</b></div>`; })}<p class="small muted">Share of patients who do each skill on their own at their current level.</p></section>
      </div>
      <section class="sec" style="margin-top:1.25rem"><h2>Clinician time saved</h2><div class="todo-sheet"><b>Stub for hi-fi.</b> This will show minutes saved per first adult visit once a pilot clinic gives us timings. No number is shown on purpose until it is measured.</div></section>` };
  };
})(window.Folio);
