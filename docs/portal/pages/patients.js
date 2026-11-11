/* Patients roster. Flat table, search, filters. */
(function (F) {
  var h = F.UI.h, ic = F.UI.ic, S = F.Store, sel = S.sel, U = F.UI;
  F.ui.pf = 'all'; F.ui.pq = ''; F.ui.ps = 'name'; F.ui.plv = 0;
  /* Links like #/patients?f=ready or ?lv=4 always apply on a real navigation */
  function fromHash() { var m = /[?&]f=([a-z]+)/.exec(location.hash), l = /[?&]lv=(\d+)/.exec(location.hash); if (/^#\/patients\/?(\?|$)/.test(location.hash)) { if (m) F.ui.pf = m[1]; F.ui.plv = l ? +l[1] : 0; } }
  fromHash(); window.addEventListener('hashchange', fromHash);
  F.actions.plvClear = function () { F.ui.plv = 0; if (/lv=/.test(location.hash)) history.replaceState(null, '', '#/patients'); F.rerender(false); };
  F.actions.pfilter = function (el) { F.ui.pf = el.dataset.v; F.rerender(false); };

  F.Pages.patients = function (params, q) {
    var ui = F.ui;
    var all = S.get().patients, term = (ui.pq || '').toLowerCase().replace(/\s+/g, ''), digits = term.replace(/\D/g, '');
    var list = all.filter(function (p) {
      var okF = (ui.pf === 'all' || sel.status(p) === ui.pf) && (!ui.plv || p.level === ui.plv);
      var okQ = !term || (sel.full(p).toLowerCase().replace(/\s+/g, '').indexOf(term) >= 0) || (digits && p.folioId.indexOf(digits) >= 0);
      return okF && okQ;
    });
    var sorters = { name: function (a, b) { return a.first < b.first ? -1 : 1; }, level: function (a, b) { return b.level - a.level; }, note: function (a, b) { return a.lastNote < b.lastNote ? -1 : 1; } };
    list.sort(sorters[ui.ps] || sorters.name);
    var cnt = function (s) { return all.filter(function (p) { return sel.status(p) === s; }).length; };
    var chip = function (v, label) { return h`<button class="chip" data-action="pfilter" data-v="${v}" aria-pressed="${String(ui.pf === v)}">${label}</button>`; };

    return {
      title: 'Patients',
      html: h`
      ${F.Pages.head('Patients', 'My patients', 'Patients who opted in to Folio. Open one to review skills, add notes or start a visit.', h`<a class="btn btn-primary" href="#/add">${ic('plus')} Add patient</a>`)}
      <div class="toolbar" role="search">
        <div class="search">${ic('search', 18)}<label class="sr" for="pq">Search by name or Folio ID</label><input id="pq" type="search" placeholder="Search name or Folio ID" value="${ui.pq}" data-bind="pq" data-rerender autocomplete="off"></div>
        <div class="chips" role="group" aria-label="Filter">${chip('all', 'All ' + all.length)}${chip('ready', 'Ready to advance ' + cnt('ready'))}${chip('attention', 'Needs attention ' + cnt('attention'))}${chip('track', 'On track ' + cnt('track'))}${ui.plv ? h`<button class="chip" aria-pressed="true" data-action="plvClear" aria-label="Clear level ${ui.plv} filter">Level ${ui.plv} ${ic('x', 14)}</button>` : ''}</div>
        <label class="sr" for="ps">Sort by</label>
        <select id="ps" style="width:auto" data-bind="ps" data-rerender><option value="name" ${ui.ps === 'name' ? 'selected' : ''}>Sort: name</option><option value="level" ${ui.ps === 'level' ? 'selected' : ''}>Sort: level</option><option value="note" ${ui.ps === 'note' ? 'selected' : ''}>Sort: oldest note</option></select>
      </div>
      <p class="small muted" aria-live="polite">${list.length} of ${all.length} patients</p>
      <div class="table-wrap sec plain" style="padding:.5rem">
        <table class="data">
          <caption class="sr">Patients</caption>
          <thead><tr><th scope="col">Patient</th><th scope="col">Folio ID</th><th scope="col">Level</th><th scope="col">Last note</th><th scope="col">Status</th><th scope="col"><span class="sr">Actions</span></th></tr></thead>
          <tbody>${list.map(function (p) { return h`<tr class="${sel.status(p) === 'ready' ? 'is-ready' : ''}">
            <td><div class="row">${U.avatar(p, 36)}<div><a class="rowlink" href="#/patients/${p.id}">${sel.full(p)}</a><div class="tiny muted">Age ${p.age} · ${p.condition}</div></div></div></td>
            <td>${sel.fid(p.folioId)}</td>
            <td><div><b>${p.level} · ${sel.level(p.level).name}</b></div>${U.lvbar(p.level)}</td>
            <td>${U.fmt(p.lastNote)}</td>
            <td>${U.statusPill(p)}</td>
            <td style="text-align:right"><a class="btn btn-sm" href="#/visit/${p.id}">Start visit</a></td></tr>`; })}</tbody>
        </table>
        ${list.length ? '' : U.empty('No patients match', 'Try a different name, ID or filter.')}
      </div>`
    };
  };
})(window.Folio);
