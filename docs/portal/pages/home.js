/* Home: quick view of the roster, who needs attention, who is ready to advance. */
(function (F) {
  var h = F.UI.h, ic = F.UI.ic, S = F.Store, sel = S.sel, U = F.UI;
  F.Pages = F.Pages || {};

  F.Pages.head = function (eyebrow, title, sub, actions) {
    return h`<div class="page-head" data-rise style="--d:0"><div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1>${sub ? h`<p>${sub}</p>` : ''}</div><div class="row wrap">${actions || ''}</div></div>`;
  };

  F.Pages.home = function () {
    var st = S.get(), pts = st.patients, me = sel.me();
    var attn = pts.filter(function (p) { return sel.status(p) === 'attention'; });
    var ready = pts.filter(function (p) { return sel.status(p) === 'ready'; });
    var avg = (pts.reduce(function (a, p) { return a + p.level; }, 0) / pts.length).toFixed(1);
    var hr = new Date().getHours(), greet = hr < 12 ? 'morning' : hr < 18 ? 'afternoon' : 'evening';
    var counts = F.LEVELS.map(function (l) { return pts.filter(function (p) { return p.level === l.n; }).length; }), max = Math.max.apply(null, counts) || 1;

    var feed = [];
    pts.forEach(function (p) {
      p.notes.forEach(function (n) { feed.push({ t: n.date, text: n.author + ' added a ' + n.kind.toLowerCase() + ' for ' + sel.full(p), pid: p.id }); });
    });
    st.access.forEach(function (a) { var p = sel.patient(a.pid); if (p) feed.push({ t: a.time, text: a.who + ' opened ' + sel.full(p) + ' (' + a.how.toLowerCase() + ')', pid: p.id }); });
    feed.sort(function (a, b) { return a.t < b.t ? 1 : -1; });

    return {
      title: 'Home',
      html: h`
      ${F.Pages.head(st.clinic.team, h`Good <em class="it">${greet}</em>, ${me.name}`, 'Here is your roster at a glance. Start with anyone who needs attention.', h`<a class="btn btn-primary" href="#/add">${ic('plus')} Add patient</a>`)}
      <div class="stats">
        <a class="stat" href="#/patients" data-rise style="--d:1"><span class="eyebrow">Patients</span><b>${pts.length}</b><span>enrolled in Folio</span></a>
        <a class="stat" href="#/patients?f=attention" data-rise style="--d:2"><span class="eyebrow red">Needs attention</span><b>${attn.length}</b><span>check in soon</span></a>
        <a class="stat" href="#/patients?f=ready" data-rise style="--d:3"><span class="eyebrow">Ready to advance</span><b>${ready.length}</b><span>${S.get().program.requiredSkills}+ skills on their own</span></a>
        <a class="stat" href="#/levels" data-rise style="--d:4"><span class="eyebrow">Average level</span><b>${avg}</b><span>of 10</span></a>
      </div>
      <div class="grid2">
        <section class="sec clip" data-rise style="--d:5" aria-labelledby="h-attn">
          <div class="sec-head"><h2 id="h-attn">Needs attention</h2><a class="small" href="#/patients?f=attention">See all</a></div>
          ${attn.length ? h`<ul class="card-list">${attn.map(function (p) { return h`<li>${U.avatar(p)}<div class="grow"><a class="title" href="#/patients/${p.id}">${sel.full(p)}</a><div class="small muted">${p.attentionReason}</div></div><a class="btn btn-sm" href="#/patients/${p.id}">Open</a></li>`; })}</ul>` : U.empty('Everyone is on track', 'Nothing needs a check-in right now.')}
        </section>
        <section class="sec taped" data-rise style="--d:6" aria-labelledby="h-ready">
          <div class="sec-head"><h2 id="h-ready">Ready to advance</h2><a class="small" href="#/visit">Visit mode</a></div>
          ${ready.length ? h`<ul class="card-list">${ready.map(function (p) { return h`<li>${U.avatar(p)}<div class="grow"><a class="title" href="#/patients/${p.id}">${sel.full(p)}</a><div class="small muted">Level ${p.level} to ${Math.min(p.level + 1, 10)} · ${sel.ownCount(p)} of 5 skills on their own</div></div><a class="btn btn-sm btn-primary" href="#/visit/${p.id}">Start visit</a></li>`; })}</ul>` : U.empty('No one is ready yet', 'Skills still being practised.')}
        </section>
        <section class="sec" data-rise style="--d:7" aria-labelledby="h-dist">
          <div class="sec-head"><h2 id="h-dist">Where patients are</h2></div>
          ${F.LEVELS.map(function (l, i) { return h`<div class="hbar"><span>${l.n} · ${l.name}</span><span class="t"><i style="width:${(counts[i] / max) * 100}%"></i></span><b>${counts[i]}</b></div>`; })}
        </section>
        <section class="sec" data-rise style="--d:8" aria-labelledby="h-act">
          <div class="sec-head"><h2 id="h-act">Recent activity</h2><a class="small" href="#/access">Access log</a></div>
          <ul class="card-list">${feed.slice(0, 7).map(function (f) { return h`<li><span class="muted small" style="width:3.8rem;flex:none">${U.fmt(f.t)}</span><a href="#/patients/${f.pid}" class="grow" style="text-decoration:none">${f.text}</a></li>`; })}</ul>
        </section>
      </div>`
    };
  };
})(window.Folio);
