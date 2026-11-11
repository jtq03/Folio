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
    var counts = F.LEVELS.map(function (l) { return pts.filter(function (p) { return p.level === l.n; }).length; });
    var sub = ready.length ? (ready.length === 1 ? '1 patient is ready to advance.' : ready.length + ' patients are ready to advance.') + (attn.length ? ' ' + attn.length + ' could use a check-in.' : '') : attn.length ? attn.length + ' patients could use a check-in today.' : 'Everyone is on track. A calm day on the roster.';
    var stairs = h`<ol class="stairs stairs-live" aria-label="Patients by level">${F.LEVELS.map(function (l, i) { var who = pts.filter(function (p) { return p.level === l.n; }).map(sel.full);
      return h`<li style="--h:${26 + l.n * 7}%;--n:${l.n}"><a href="#/patients?lv=${l.n}" aria-label="Level ${l.n}, ${l.name}: ${who.length} patient${who.length === 1 ? '' : 's'}${who.length ? '. ' + who.join(', ') : ''}">${counts[i] ? h`<b class="cnt">${counts[i]}</b>` : ''}<span>${l.n}</span>${who.length ? h`<em class="stair-tip" aria-hidden="true">${who.join(', ')}</em>` : ''}</a></li>`; })}</ol>`;

    var feed = [];
    pts.forEach(function (p) {
      p.notes.forEach(function (n) { feed.push({ t: n.date, text: n.author + ' added a ' + n.kind.toLowerCase() + ' for ' + sel.full(p), pid: p.id }); });
    });
    st.access.forEach(function (a) { var p = sel.patient(a.pid); if (p) feed.push({ t: a.time, text: a.who + ' opened ' + sel.full(p) + ' (' + a.how.toLowerCase() + ')', pid: p.id }); });
    feed.sort(function (a, b) { return a.t < b.t ? 1 : -1; });

    return {
      title: 'Home',
      html: h`
      ${F.Pages.head(st.clinic.team, h`Good <em class="it">${greet}</em>, ${me.name}`, sub, h`<a class="btn btn-primary" href="#/add">${ic('plus')} Add patient</a>`)}
      <div class="stats">
        <a class="stat" href="#/patients" data-rise style="--d:1">${U.tile('users', 1)}<b data-count="${pts.length}">${pts.length}</b><span>Patients enrolled</span></a>
        <a class="stat attn" href="#/patients?f=attention" data-rise style="--d:2">${U.tile('bell', 5)}<b data-count="${attn.length}">${attn.length}</b><span>Need attention</span></a>
        <a class="stat" href="#/patients?f=ready" data-rise style="--d:3">${U.tile('check', 4)}<b data-count="${ready.length}">${ready.length}</b><span>Ready to advance</span></a>
        <a class="stat" href="#/levels" data-rise style="--d:4">${U.tile('levels', 3)}<b data-count="${avg}">${avg}</b><span>Average level of 10</span></a>
      </div>
      <div class="grid2">
        <section class="sec" data-rise style="--d:5" aria-labelledby="h-attn">
          <div class="sec-head"><h2 id="h-attn">Needs attention</h2><a class="small" href="#/patients?f=attention">See all</a></div>
          ${attn.length ? h`<ul class="card-list">${attn.map(function (p) { return h`<li>${U.avatar(p)}<div class="grow"><a class="title" href="#/patients/${p.id}">${sel.full(p)}</a><div class="small muted">${p.attentionReason}</div></div><a class="btn btn-sm" href="#/patients/${p.id}">Open</a></li>`; })}</ul>` : U.empty('Everyone is on track', 'Nothing needs a check-in right now.')}
        </section>
        <section class="sec" data-rise style="--d:6" aria-labelledby="h-ready">
          <div class="sec-head"><h2 id="h-ready">Ready to advance</h2><a class="small" href="#/visit">Visit mode</a></div>
          ${ready.length ? h`<ul class="card-list">${ready.map(function (p) { return h`<li class="is-ready">${U.avatar(p)}<div class="grow"><a class="title" href="#/patients/${p.id}">${sel.full(p)}</a><div class="small muted">Level ${p.level} to ${Math.min(p.level + 1, 10)} · ${sel.ownCount(p)} of 5 skills on their own</div></div><a class="btn btn-sm btn-primary" href="#/visit/${p.id}">Start visit</a></li>`; })}</ul>` : U.empty('No one is ready yet', 'Skills still being practised.')}
        </section>
        <section class="sec taped" data-rise style="--d:7" aria-labelledby="h-dist">
          <div class="sec-head"><h2 id="h-dist">Where patients are</h2><a class="small" href="#/levels">Levels</a></div>
          ${stairs}
          <p class="small muted" style="margin:.75rem 0 0">Each step is a level. The number above is how many patients are on it. Choose a step to see who is there.</p>
        </section>
        <section class="sec" data-rise style="--d:8" aria-labelledby="h-act">
          <div class="sec-head"><h2 id="h-act">Recent activity</h2><a class="small" href="#/access">Access log</a></div>
          <ul class="card-list">${feed.slice(0, 7).map(function (f) { return h`<li><span class="muted small" style="width:3.8rem;flex:none">${U.fmt(f.t)}</span><a href="#/patients/${f.pid}" class="grow" style="text-decoration:none">${f.text}</a></li>`; })}</ul>
        </section>
      </div>`
    };
  };
})(window.Folio);
