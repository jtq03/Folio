/* Program pages: Levels and skills (configure), Insights (program-level numbers). */
(function (F) {
  var h = F.UI.h, ic = F.UI.ic, S = F.Store, sel = S.sel, U = F.UI, A = S.act;

  F.actions.progReq = function (el) { A.program({ requiredSkills: +el.value }); U.toast('Saved: ' + el.value + ' of 4 skills needed at each level'); };
  F.actions.lvAll = function (el) { var o = {}; if (el.dataset.v === '1') F.LEVELS.forEach(function (l) { o[l.n] = true; }); F.ui.lvOpen = o; document.querySelectorAll('.lv-curr details[data-lv]').forEach(function (d) { d.open = el.dataset.v === '1'; }); };
  document.addEventListener('toggle', function (e) { var d = e.target; if (!d || !d.dataset || !d.dataset.lv) return; F.ui.lvOpen = F.ui.lvOpen || {}; F.ui.lvOpen[d.dataset.lv] = d.open; }, true);
  F.actions.progMonths = function (el) { A.program({ minMonths: +el.value }); U.toast('Saved'); };
  F.actions.progPerson = function (el) { A.program({ inPerson: el.checked }); U.toast('Saved'); };
  F.actions.exportLevels = function () {
    /* Level system v2: one row per skill, with its level, goal, area, activities and sticker */
    var rows = [['Level', 'Level name', 'Phase', 'Level goal', 'Who leads', 'Folio unlocks', 'Skill id', 'Area', 'Skill', 'I can', 'How (3 activities)', 'What the clinic sees', 'Guide', 'Sticker', 'Plant']];
    F.LEVELS.forEach(function (l) { l.skills.forEach(function (sk) {
      var g = sk.guide ? (S.get().resources || []).filter(function (r) { return r.id === sk.guide; })[0] : null;
      rows.push([l.n, l.name, l.phase, l.goal, l.leads, l.unlocks, sk.id, F.AREA_BY_ID[sk.area].name, sk.name, sk.can, sk.how.join(' | '), sk.evidence, g ? g.title : '', sk.sticker.name, l.plant.name]);
    }); });
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
      <div class="pkg" role="group" aria-label="Condition packages" style="margin-bottom:1.25rem"><button class="chip" aria-pressed="true">Type 1 diabetes</button></div>
      <div class="grid2" style="margin-bottom:1.5rem">
        <section class="sec"><h2>Rules for moving up</h2>
          <div class="setting"><div><label for="rq" style="margin:0">Skills needed to advance</label><p>Out of the 4 skills in each level. Default 3.</p></div><select id="rq" style="width:auto" data-change="progReq">${[2, 3, 4].map(function (n) { return h`<option ${n === cfg.requiredSkills ? 'selected' : ''}>${n}</option>`; })}</select></div>
          <div class="setting"><div><label for="mm" style="margin:0">Minimum months per level</label><p>Typical pace is 6 to 9.</p></div><select id="mm" style="width:auto" data-change="progMonths">${[1, 3, 6].map(function (n) { return h`<option ${n === cfg.minMonths ? 'selected' : ''}>${n}</option>`; })}</select></div>
          <div class="setting"><div><b>Sign-off in person</b><p>Clinician confirms at a routine visit.</p></div><label class="switch"><input type="checkbox" ${cfg.inPerson ? 'checked' : ''} data-change="progPerson" aria-label="Require in-person sign-off"><span class="track"></span></label></div>
        </section>
        <section class="sec"><h2>Five areas, used as themes</h2><p class="small muted">Each level has its own goal and 4 skills, 40 in all. Every skill carries one of these areas as a tag for colour and reporting. Levels measure skills, never health outcomes.</p>
          ${F.AREAS.map(function (a, i) { var c = F.ALL_SKILLS.filter(function (s) { return s.area === a.id; }).length; return h`<div class="skillrow"><b style="font:600 1.3rem var(--font-display);width:1.5rem">${i + 1}</b><div class="nm"><b>${a.name}</b><span class="small muted">${a.sub}</span></div><span class="small muted">${c} skills</span></div>`; })}</section>
      </div>
      <section class="sec lv-curr"><div class="sec-head"><h2>Ten levels, 40 skills</h2><span class="row"><button class="btn btn-sm btn-quiet" data-action="lvAll" data-v="1">Expand all</button><button class="btn btn-sm btn-quiet" data-action="lvAll" data-v="0">Collapse all</button></span></div>
        <ol class="rm-list">${F.LEVELS.map(function (l) { var cnt = pts.filter(function (p) { return p.level === l.n && !p.transferred; }).length;
          return h`<li class="rm-lv"><details data-lv="${l.n}" ${F.ui.lvOpen && F.ui.lvOpen[l.n] ? 'open' : ''}><summary><span class="rm-n">${l.n}</span><span class="rm-t"><b>${l.name}: ${l.goal}</b><span class="small muted">${l.leads} · ${cnt} ${cnt === 1 ? 'patient' : 'patients'}</span></span>${U.pill(l.phase, { Aware: 'blue', Involved: 'blue', Shared: 'green', Leading: 'green', Independent: 'dark' }[l.phase])}</summary>
            <p class="small">${l.intro}</p><p class="small muted"><b>Unlocks:</b> ${l.unlocks}</p>
            <div class="table-wrap"><table class="data"><caption class="sr">Level ${l.n} skills</caption><thead><tr><th scope="col">Skill</th><th scope="col">Area</th><th scope="col">I can</th><th scope="col">How</th><th scope="col">What the clinic sees</th></tr></thead>
            <tbody>${l.skills.map(function (sk) { return h`<tr><td><b>${sk.name}</b><div class="small muted">${sk.id}</div></td><td>${F.AREA_BY_ID[sk.area].name}</td><td>${sk.can}</td><td><ul class="small">${sk.how.map(function (x) { return h`<li>${x}</li>`; })}</ul></td><td>${sk.evidence}</td></tr>`; })}</tbody></table></div></details></li>`; })}</ol>
        <p class="small muted">${F.CURRICULUM_FLAG} Written for type 1 diabetes from the TRAQ and READDY readiness domains and the Canadian Paediatric Society 2023 transition guidance.</p></section>
      <section class="sec" style="margin-top:1.25rem"><h2>How to move up</h2><ul>${F.MOVE_UP_RULES.map(function (r) { return h`<li>${r}</li>`; })}</ul></section>` };
  };

  F.Pages.insights = function () {
    var pts = S.get().patients, n = pts.length, acc = S.get().access;
    /* Level system v2: completion of the current level's skills, by area, and the skills most often still Learning */
    var act = pts.filter(function (p) { return !p.transferred; });
    var byArea = F.AREAS.map(function (a) { var t = 0, o = 0; act.forEach(function (p) { sel.currentSkills(p).forEach(function (s) { if (s.area !== a.id) return; t++; if (p.skills[s.id] === 'own') o++; }); }); return [a, t ? Math.round(o / t * 100) : 0, t]; });
    var byLevel = F.LEVELS.map(function (l) { var ps = act.filter(function (p) { return p.level === l.n; }), t = ps.length * l.skills.length, o = 0; ps.forEach(function (p) { l.skills.forEach(function (s) { if (p.skills[s.id] === 'own') o++; }); }); return [l, t ? Math.round(o / t * 100) : null, ps.length]; }).filter(function (x) { return x[2]; });
    var lc = {}; act.forEach(function (p) { sel.currentSkills(p).forEach(function (s) { if (p.skills[s.id] === 'learning') lc[s.id] = (lc[s.id] || 0) + 1; }); });
    var stuck = Object.keys(lc).sort(function (a, b) { return lc[b] - lc[a] || (a < b ? -1 : 1); }).slice(0, 5);
    var phases = ['Aware', 'Involved', 'Shared', 'Leading', 'Independent'].map(function (ph) { return [ph, pts.filter(function (p) { return sel.level(p.level).phase === ph; }).length]; });
    var taps = acc.filter(function (a) { return a.how.indexOf('Card') === 0; }).length;
    var ready = pts.filter(function (p) { return sel.status(p) === 'ready'; }).length;
    return { title: 'Insights', html: h`
      ${F.Pages.head('Program', h`<em class="it">Insights</em>`, 'Program-level numbers for the hospital. Demo data only.')}
      <div class="stats"><div class="stat"><span class="eyebrow">Enrolled</span><b>${n}</b><span>patients</span></div><div class="stat"><span class="eyebrow">Ready to advance</span><b>${ready}</b><span>${Math.round(ready / n * 100)}% of roster</span></div><div class="stat"><span class="eyebrow">Card taps</span><b>${taps}</b><span>ER and adult clinic opens</span></div><div class="stat"><span class="eyebrow">Transferred</span><b>${pts.filter(function (p) { return p.transferred; }).length}</b><span>to adult care</span></div></div>
      <div class="grid2">
        <section class="sec"><h2>Patients by phase</h2>${phases.map(function (x) { return h`<div class="hbar"><span>${x[0]}</span><span class="t"><i style="width:${x[1] / n * 100}%"></i></span><b>${x[1]}</b></div>`; })}</section>
        <section class="sec"><h2>Skills done on their own, by area</h2>${byArea.map(function (x) { return h`<div class="hbar"><span>${x[0].name}</span><span class="t"><i class="blue" style="width:${x[1]}%"></i></span><b>${x[1]}%</b></div>`; })}<p class="small muted">Share of current-level skills in each area that patients do on their own.</p></section>
      </div>
      <div class="grid2" style="margin-top:1.25rem">
        <section class="sec"><h2>Current level done, by level</h2>${byLevel.map(function (x) { return h`<div class="hbar"><span>${x[0].n} · ${x[0].goal}</span><span class="t"><i class="blue" style="width:${x[1]}%"></i></span><b>${x[1]}%</b></div>`; })}<p class="small muted">For patients at each level, the share of that level's 4 skills on their own.</p></section>
        <section class="sec"><h2>Most often still learning</h2>${stuck.length ? h`<ol class="stuck">${stuck.map(function (id) { var sk = F.SKILL_BY_ID[id]; return h`<li><b>${sk.name}</b> <span class="small muted">Level ${sk.level} · ${F.AREA_BY_ID[sk.area].name} · ${lc[id]} ${lc[id] === 1 ? 'patient' : 'patients'}</span></li>`; })}</ol>` : U.empty('Nothing stuck', 'No current-level skill is at Learning.')}<p class="small muted">Current-level skills at Learning. A good place for a new guide or group session.</p></section>
      </div>
      <section class="sec" style="margin-top:1.25rem"><h2>Clinician time saved</h2><div class="todo-sheet"><b>Stub for hi-fi.</b> This will show minutes saved per first adult visit once a pilot clinic gives us timings. No number is shown on purpose until it is measured.</div></section>` };
  };
})(window.Folio);
