/* Home: quick view of the roster, who needs attention, who is ready to advance. */
(function (F) {
  var h = F.UI.h, ic = F.UI.ic, S = F.Store, sel = S.sel, U = F.UI;
  F.Pages = F.Pages || {};

  F.Pages.head = function (eyebrow, title, sub, actions) {
    return h`<div class="page-head" data-rise style="--d:0"><div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1>${sub ? h`<p>${sub}</p>` : ''}</div><div class="row wrap">${actions || ''}</div></div>`;
  };

  /* v3 first run: one welcome card per person, shown once. No tour (tutorials did not help in NN/g testing).
     It leads with "no extra form" (P1) and gives one real thing to try. */
  /* Remembered per device in localStorage through F.Mem (portal/memory.js). Log out forgets it. */
  function welcomed(id) { return F.Mem ? F.Mem.welcomed(id) : false; }
  F.actions.welcomeDone = function () {
    if (F.Mem) F.Mem.markWelcomed(sel.me().id);
    F.rerender(false);
    /* The button is gone, so keep keyboard focus at the top of the page instead of dropping it on the body */
    var h1 = document.querySelector('#main h1'); if (h1) { h1.setAttribute('tabindex', '-1'); h1.focus({ preventScroll: true }); }
    F.UI.toast('Welcome card hidden on this device. Log out to see it again.');
  };
  var ROLE_TIPS = {
    Admin: ['Check skills with the teen in Visit mode. Changes save as you go.', 'Sign off a level in person. The teen sees it in their app right away.', 'When a teen is ready to move, write the handoff note once. It goes with their card.', 'As an admin you also manage the team, cards and program settings.'],
    Clinician: ['Check skills with the teen in Visit mode. Changes save as you go.', 'Sign off a level in person. The teen sees it in their app right away.', 'When a teen is ready to move, write the handoff note once. It goes with their card.'],
    Nurse: ['Update skills and write notes in Visit mode.', 'A clinician signs off levels. You can prepare everything before they do.', 'At enrolment, give the teen their Folio ID so they can set up the app.'],
    Coordinator: ['Enrol new patients and hand out Folio cards.', 'Freeze or replace a card when a teen loses it.', 'Your role covers enrolment and cards, not clinical notes. Roles are not enforced in this prototype yet.']
  };
  function welcomeCard(me) {
    if (welcomed(me.id)) return '';
    var tips = ROLE_TIPS[me.role] || ROLE_TIPS.Clinician, coord = me.role === 'Coordinator';
    return h`<section class="sec welcome-card" data-rise style="--d:1" aria-labelledby="wc-h">
      <h2 id="wc-h">Welcome to Folio, ${me.name.replace(/^Dr\. [A-Z]\. /, 'Dr. ')}</h2>
      <p class="lead">Folio records the readiness check you already do. It does not add a form.</p>
      <ul class="wc-tips">${tips.map(function (t) { return h`<li>${ic('check', 16)}<span>${t}</span></li>`; })}</ul>
      <div class="row wrap" style="gap:.6rem;margin-top:1rem">${coord ? h`<a class="btn btn-primary" href="#/cards">Hand out a card</a>` : h`<a class="btn btn-primary" href="#/visit/p1">Practise on a sample patient</a>`}<button class="btn" data-action="welcomeDone" aria-describedby="wc-h">Got it</button></div>
      <p class="small muted" style="margin:.75rem 0 0">${coord ? 'Eli T. is enrolled and still needs a card.' : 'Maya R. is a sample patient. Reset the demo data in Settings any time.'}</p></section>`;
  }

  F.Pages.home = function () {
    var st = S.get(), pts = st.patients, me = sel.me();
    var handoffs = pts.filter(function (p) { return p.notes.some(function (n) { return n.kind === 'Handoff note' && n.shared && !n.draft; }); }).length;
    var nocard = pts.filter(function (p) { return !p.card || p.card.status === 'unassigned'; }), coord = me.role === 'Coordinator';
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
    st.access.forEach(function (a) { var p = sel.patient(a.pid); if (p) feed.push({ t: a.time, text: a.who + ' opened ' + sel.full(p) + ' · ' + a.how, pid: p.id }); });
    feed.sort(function (a, b) { return a.t < b.t ? 1 : -1; });

    return {
      title: 'Home',
      html: h`
      ${F.Pages.head(st.clinic.team, h`Good <em class="it">${greet}</em>, ${me.name}`, sub, h`<a class="btn btn-primary" href="#/add">${ic('plus')} Add patient</a>`)}
      ${welcomeCard(me)}
      <div class="stats">
        <a class="stat" href="#/patients" data-rise style="--d:1">${U.tile('users', 1)}<b data-count="${pts.length}">${pts.length}</b><span>Patients enrolled</span></a>
        <a class="stat attn" href="#/patients?f=attention" data-rise style="--d:2">${U.tile('bell', 5)}<b data-count="${attn.length}">${attn.length}</b><span>Need attention</span></a>
        <a class="stat" href="#/patients?f=ready" data-rise style="--d:3">${U.tile('check', 4)}<b data-count="${ready.length}">${ready.length}</b><span>Ready to advance</span></a>
        ${coord ? h`<a class="stat" href="#/cards" data-rise style="--d:4">${U.tile('card', 3)}<b data-count="${nocard.length}">${nocard.length}</b><span>Cards to hand out</span></a>` : h`<a class="stat" href="#/insights" data-rise style="--d:4">${U.tile('log', 3)}<b data-count="${handoffs}">${handoffs}</b><span>Handoffs shared</span></a>`}
      </div>
      <div class="grid2">
        <section class="sec" data-rise style="--d:5" aria-labelledby="h-attn">
          <div class="sec-head"><h2 id="h-attn">Needs attention</h2><a class="small" href="#/patients?f=attention">See all</a></div>
          ${attn.length ? h`<ul class="card-list">${attn.map(function (p) { return h`<li>${U.avatar(p)}<div class="grow"><a class="title" href="#/patients/${p.id}">${sel.full(p)}</a><div class="small muted">${p.attentionReason}</div></div><a class="btn btn-sm" href="#/patients/${p.id}">Open</a></li>`; })}</ul>` : U.empty('Everyone is on track', 'Nothing needs a check-in right now.')}
        </section>
        ${coord ? h`<section class="sec" data-rise style="--d:6" aria-labelledby="h-cards">
          <div class="sec-head"><h2 id="h-cards">Cards to hand out</h2><a class="small" href="#/cards">Cards</a></div>
          ${nocard.length ? h`<ul class="card-list">${nocard.map(function (p) { return h`<li>${U.avatar(p)}<div class="grow"><a class="title" href="#/patients/${p.id}">${sel.full(p)}</a><div class="small muted">Folio ID ${sel.fid(p.folioId)} · no card yet</div></div><a class="btn btn-sm btn-primary" href="#/cards">Assign card</a></li>`; })}</ul>` : U.empty('Every patient has a card', 'New enrolments show up here.')}
        </section>` : h`<section class="sec" data-rise style="--d:6" aria-labelledby="h-ready">
          <div class="sec-head"><h2 id="h-ready">Ready to advance</h2><a class="small" href="#/visit">Visit mode</a></div>
          ${ready.length ? h`<ul class="card-list">${ready.map(function (p) { return h`<li class="is-ready">${U.avatar(p)}<div class="grow"><a class="title" href="#/patients/${p.id}">${sel.full(p)}</a><div class="small muted">Level ${p.level} to ${Math.min(p.level + 1, 10)} · ${sel.level(p.level).goal} · ${sel.ownCount(p)} of ${sel.currentSkills(p).length} skills on their own</div></div><a class="btn btn-sm btn-primary" href="#/visit/${p.id}">Start visit</a></li>`; })}</ul>` : U.empty('No one is ready yet', 'Skills still being practised.')}
        </section>`}
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
