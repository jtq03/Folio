/* Adult care view. Reached only by tapping or scanning a Folio card (unguessable token link).
   Teams can use ?demo=1 for a clearly labelled demo entry. Every open is logged, and the session times out. */
(function (F) {
  var h = F.UI.h, ic = F.UI.ic, S = F.Store, sel = S.sel, U = F.UI, A = S.act;
  var app = document.getElementById('app'), params = new URLSearchParams(location.search);
  var token = params.get('t'), demo = params.get('demo') === '1', via = params.get('via') === 'qr' ? 'Card tap (QR)' : 'Card tap (NFC)';
  var pid = null, deadline = 0, ended = false, timer = null, warned = false, openedAt = new Date();

  function minutes() { return (S.get().program.timeout || 10); }
  function startSession(p, how) {
    pid = p.id; ended = false; deadline = Date.now() + minutes() * 60000;
    var k = 'folio.logged.' + p.id + '.' + how;
    try { if (!sessionStorage.getItem(k)) { sessionStorage.setItem(k, '1'); A.log(p.id, demo ? 'Demo entry (team)' : 'Adult clinic (ER or clinic tap)', how); } } catch (e) { A.log(p.id, 'Adult clinic', how); }
    clearInterval(timer); timer = setInterval(tick, 1000);
  }
  function tick() {
    var left = Math.max(0, deadline - Date.now()), el = document.getElementById('sess-left');
    if (!left) { ended = true; clearInterval(timer); render(); return; }
    if (el) el.textContent = Math.floor(left / 60000) + ':' + ('0' + Math.floor(left / 1000) % 60).slice(-2);
    var ring = document.getElementById('sess-ring'), frac = left / (minutes() * 60000), warn = left < 60000;
    if (ring) ring.style.setProperty('--p', frac.toFixed(4));
    var box = document.querySelector('.bar .sess'); if (box) box.classList.toggle('warn', warn);
    if (warn && !warned) { warned = true; U.toast('Less than a minute left. Choose Keep open to stay.'); }
  }

  F.actions.textSize = function (el) { S.a11y.set('text', el.dataset.v); };
  F.actions.clinNote = function (d) {
    d.text = String(d.text || '').trim(); d.who = String(d.who || '').trim();
    if (!d.who || !d.text) { var bad = document.getElementById(d.who ? 'cn' : 'cw'); if (bad) { bad.setAttribute('aria-invalid', 'true'); bad.focus(); } U.toast('Add your name and a note first.'); return; }
    var y = window.scrollY;
    A.addNote(pid, { kind: 'Clinician note', text: d.text, shared: true, author: d.who || 'Adult clinician', role: 'adult' });
    window.scrollTo(0, y); var sv = document.getElementById('note-ok'); if (sv) { sv.hidden = false; sv.focus(); }
    U.toast('Note added. The patient sees it in their app.');
  };
  F.actions.extend = function () { deadline = Date.now() + minutes() * 60000; warned = false; tick(); U.toast('Session extended by ' + minutes() + ' minutes'); };

  function clock() { var left = Math.max(0, deadline - Date.now()); return Math.floor(left / 60000) + ':' + ('0' + Math.floor(left / 1000) % 60).slice(-2); }
  var ART = {
    invalid: '<svg viewBox="0 0 120 90" width="120" height="90" aria-hidden="true"><rect x="18" y="20" width="84" height="54" rx="6" fill="#efe3cc" stroke="#1f2f16" stroke-width="2" transform="rotate(-6 60 47)"/><path d="M30 40h40M30 50h28" stroke="#1f2f16" stroke-width="3" stroke-linecap="round" transform="rotate(-6 60 47)"/><circle cx="88" cy="26" r="13" fill="#c5d1eb" stroke="#1f2f16" stroke-width="2"/><path d="M84 22q4-5 8 0t-4 6v3" fill="none" stroke="#1f2f16" stroke-width="2.4" stroke-linecap="round"/></svg>',
    inactive: '<svg viewBox="0 0 120 90" width="120" height="90" aria-hidden="true"><rect x="18" y="20" width="84" height="54" rx="6" fill="#efe3cc" stroke="#1f2f16" stroke-width="2" transform="rotate(4 60 47)"/><rect x="40" y="12" width="40" height="14" fill="#c5d1eb" opacity=".9" transform="rotate(-8 60 19)"/><path d="M36 60l48-26" stroke="#b3261e" stroke-width="4" stroke-linecap="round"/></svg>',
    ended: '<svg viewBox="0 0 120 90" width="120" height="90" aria-hidden="true"><circle cx="60" cy="47" r="32" fill="#efe3cc" stroke="#1f2f16" stroke-width="2"/><path d="M60 47V27M60 47l12 8" stroke="#1f2f16" stroke-width="3.5" stroke-linecap="round"/><rect x="38" y="8" width="44" height="13" fill="#c5d1eb" opacity=".9" transform="rotate(5 60 14)"/></svg>'
  };
  function bar(p, how) {
    var sz = S.a11y.get().text;
    return h`<div class="bar"><div class="in"><span>${U.wordmark()}</span><span class="tag">Care team view</span>
      <div class="sess">${p ? h`<span class="via" title="How this profile was opened">${ic('check', 14)} Opened by ${demo ? 'demo entry' : how.toLowerCase()} at ${openedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span><span class="ring" aria-hidden="true"><i id="sess-ring" style="--p:${Math.max(0, deadline - Date.now()) / (minutes() * 60000)}"></i></span><span>Session ends in <b id="sess-left" aria-live="off">${clock()}</b></span><button class="btn btn-sm key" data-action="extend">Keep open</button>` : ''}
      <div class="tsz" role="group" aria-label="Text size">${[['md', 'A'], ['lg', 'A+'], ['xl', 'A++']].map(function (t) { return h`<button data-action="textSize" data-v="${t[0]}" aria-pressed="${String(sz === t[0])}" aria-label="Text size ${t[1]}">${t[1]}</button>`; })}</div></div></div></div>${demo && p ? h`<div class="demo-banner" role="note">Demo mode for the Folio team. This is not a real card tap.</div>` : ''}`;
  }

  function msgPage(title, body, extra, art) {
    return h`${bar(null)}<main id="main" class="center msg"><div class="art">${U.raw(ART[art || "invalid"])}</div><h1 style="font-size:2rem;margin-bottom:.75rem">${title}</h1><p class="muted" style="margin-inline:auto">${body}</p>${extra || ''}</main>`;
  }

  function view(p, how) {
    var notes = sel.notesFor(p, 'adult'), vis = p.contacts.filter(function (c) { return c.visible; });
    var own = F.SKILLS.filter(function (s) { return p.skills[s.id] === 'own'; }), still = F.SKILLS.filter(function (s) { return p.skills[s.id] !== 'own'; });
    var L = sel.level(p.level);
    var contact = function (c, role) { return h`<div class="who"><span class="rl">${role}</span><div><b>${c.name}</b></div>${c.phone ? h`<div class="muted">${c.phone}</div><div class="acts"><a class="btn btn-sm btn-primary key" href="tel:${c.phone.replace(/[^\d+]/g, '')}">${ic('phone', 16)} Call</a><a class="btn btn-sm key" href="sms:${c.phone.replace(/[^\d+]/g, '')}">${ic('message', 16)} Message</a></div>` : h`<div class="muted">No phone on file</div>`}</div>`; };
    return h`${bar(p, how)}<main id="main" class="wrap">
      <section class="sheetc" style="--d:0"><div class="pt-head"><div class="pt-av">${U.avatar(p, 104)}</div><div class="grow"><h1>${sel.full(p)}</h1><div class="facts"><span>Age ${p.age}</span><span aria-hidden="true">·</span><span>Folio ID ${sel.fid(p.folioId)}</span></div><div>${U.pill(p.condition, 'blue')}</div></div></div>
        <div style="margin-top:1.1rem" class="facts"><span class="eyebrow">Level ${p.level} of 10 · ${L.name}</span>${U.lvbar(p.level)}</div>
        ${p.levelSignoff ? h`<p class="small muted" style="margin:.4rem 0 0">Signed off Level ${p.levelSignoff.level} by ${p.levelSignoff.by}, ${U.monthYear(p.levelSignoff.date)}.</p>` : ''}</section>
      <section class="sheetc" style="--d:1"><h2>How to work with ${p.first}</h2><p class="small muted">Things that change how your team should interact</p>
        ${p.howToWork.map(function (w) { return h`<div class="work note-sticky"><div class="by">${w.by}<span>${w.date}</span></div><p>${w.text}</p></div>`; })}</section>
      <div class="fold">Fold: below this line is context, reached by scrolling</div>
      <div class="cols" style="margin-bottom:1.1rem">
        <section class="sheetc" style="--d:2"><h2>Family contacts</h2>${vis.length ? vis.map(function (c) { return contact(c, c.rel); }) : h`<p class="muted">${p.first} has chosen not to share family contacts.</p>`}</section>
        <section class="sheetc" style="--d:3"><h2>Past and current care team</h2>${p.careTeam.map(function (c) { return contact(c, c.role); })}</section>
      </div>
      <section class="sheetc" style="--d:4"><h2>Records and resources ${p.first} has linked</h2><p class="small muted">${F.COPY.noRecords}</p>
        ${p.links.length ? p.links.map(function (l) { return h`<div class="who row"><div class="grow"><b>${l.title}</b><div class="small muted">${l.sub}</div></div><a class="btn btn-sm" href="${l.url}" target="_blank" rel="noopener noreferrer">Open ${ic('ext', 14)}</a></div>`; }) : h`<p class="muted">Nothing linked yet.</p>`}</section>
      <section class="sheetc" style="--d:5"><h2>Skills ${p.first} has and is building</h2><div class="sk2" style="margin-top:.75rem">
        <div><div class="eyebrow">Does on their own</div>${own.length ? own.map(function (s) { return h`<div class="it2"><b>${s.name}</b><span>${s.sub}</span></div>`; }) : h`<p class="muted">None yet at this level.</p>`}</div>
        <div><div class="eyebrow">Still working on</div>${still.length ? still.map(function (s) { return h`<div class="it2"><b>${s.name} ${U.skillPill(p.skills[s.id])}</b><span>${s.sub}</span></div>`; }) : h`<p class="muted">Everything at this level.</p>`}</div></div></section>
      <section class="sheetc" style="--d:6"><h2>Notes from the paediatric team</h2><p class="small muted">Read-only history, so you can see what has been working.</p>
        ${notes.length ? notes.map(function (n) { return h`<div class="work"><div class="by">${n.kind}${n.draft ? ' · Draft' : ''}<span>${n.author} · ${U.fmt(n.date)}</span></div><p>${n.text}</p></div>`; }) : h`<p class="muted">No shared notes.</p>`}</section>
      <section class="sheetc add-note" style="--d:7"><h2>Add a clinician note</h2><p class="small muted">${p.first} sees this in their app.</p>
        <form data-submit="clinNote"><label for="cw">Your name and clinic</label><input id="cw" name="who" type="text" placeholder="Dr. Rivera, Westside Clinic" required><label for="cn">Note</label><textarea id="cn" name="text" rows="3" required></textarea><button class="btn btn-primary key" style="margin-top:1rem">Save note</button><p id="note-ok" class="ok" tabindex="-1" hidden>Saved. Your note is now in the list above.</p></form></section>
    </main>`;
  }

  var first = true;
  function render() {
    if (!first) app.classList.remove('enter'); else app.classList.add('enter'); first = false;
    setTimeout(function () { app.classList.remove('enter'); }, 1400);
    var p = pid ? sel.patient(pid) : null, how = demo ? 'Demo entry' : via;
    if (ended) { app.innerHTML = msgPage('This session has ended', 'For privacy, the profile closes after ' + minutes() + ' minutes. Tap or scan the card again to reopen it.', demo ? h`<p><a class="btn btn-primary" href="?demo=1">Back to demo entry</a></p>` : '', 'ended').s; return; }
    if (p && p.card.status === 'active' || (demo && p)) { var y = window.scrollY; app.innerHTML = view(p, how).s; window.scrollTo(0, y); return; }
    clearInterval(timer); ended = true;
    app.innerHTML = msgPage('This card is not active', 'It was turned off while open. Ask the patient or their clinic for help.', '', 'inactive').s;
  }

  function boot() {
    document.title = 'Folio · Care team view';
    if (demo && !params.get('p')) {
      var pts = S.get().patients.filter(function (x) { return x.card.status === 'active'; });
      app.innerHTML = h`${bar(null)}<main id="main" class="center">${U.mark(64)}<div class="eyebrow red">Demo mode</div><h1 style="font-size:2rem;margin:.4rem 0 .6rem">Pick a patient to preview</h1><p class="muted" style="margin-inline:auto">For the Folio team only. A real card opens straight to the profile, and carries an unguessable link, never a name.</p>
        <div class="pick">${pts.map(function (x) { return h`<a href="?demo=1&p=${x.id}">${U.avatar(x, 40)}<span><b>${sel.full(x)}</b><br><span class="small muted">Folio ID ${sel.fid(x.folioId)}</span></span></a>`; })}</div></main>`.s;
      return;
    }
    var p = demo ? sel.patient(params.get('p')) : S.sel.byToken(token || '');
    if (!p) {
      var inactive = token && S.get().patients.some(function (x) { return x.card.token === token; });
      app.innerHTML = msgPage(inactive ? 'This card is not active' : 'We could not open this card', inactive ? 'It may have been replaced or turned off. Ask the patient or their clinic for help.' : 'The link is not recognised. Tap or scan the card again. If it keeps happening, contact the patient\'s clinic.', '', inactive ? 'inactive' : 'invalid').s;
      return;
    }
    startSession(p, demo ? 'Demo entry' : via);
    render();
  }
  S.sub(function () { if (pid && !ended && !document.querySelector('dialog[open]') && !document.activeElement.matches('textarea,input')) render(); });
  boot();
})(window.Folio);
