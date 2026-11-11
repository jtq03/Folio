/* Folio patient app (PWA). Same shared store as the portal, so a sign-off in the portal shows up here.
   Built to Apple's iOS Human Interface Guidelines: large-title navigation, floating glass tab bar,
   inset grouped lists, bottom sheets, action sheets.

   Rendering model: the shell (nav bar, tab bar, level-up host) is mounted once and never re-created.
   Each route renders into its own scrolling page. Navigation swaps pages with a push, pop or fade;
   store updates patch the current page in place with a small DOM morph, so focus, scroll position,
   typed text and running CSS transitions survive. */
(function (F) {
  var h = F.UI.h, raw = F.UI.raw, esc = F.UI.esc, ic = F.UI.ic, S = F.Store, sel = S.sel, U = F.UI, A = S.act, N = F.native;
  var PKEY = 'folio.app.pid';
  function pid() { try { var v = localStorage.getItem(PKEY); if (v && sel.patient(v)) return v; } catch (e) {} var ps = S.get().patients; return sel.patient('p1') ? 'p1' : (ps[0] && ps[0].id); }
  function me() { return sel.patient(pid()); }
  F.ui.rq = ''; F.ui.rt = 'All';
  var deferred = null;
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferred = e; });

  /* ---------- Icons ---------- */
  function svg(body, size, extra) { return raw('<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false" ' + (extra || '') + '>' + body + '</svg>'); }
  var X = {
    camera: '<path d="M4 8h3l1.500-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.500"/>',
    play: '<path d="M8 5.500v13l11-6.500z" fill="currentColor"/>',
    heart: '<path d="M12 20s-7-4.400-7-10a4 4 0 0 1 7-2.500A4 4 0 0 1 19 10c0 5.600-7 10-7 10z"/>',
    pencil: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
    sparkle: '<path d="M12 3l1.800 5.200L19 10l-5.200 1.800L12 17l-1.800-5.200L5 10l5.200-1.800z"/>',
    calendar: '<rect x="4" y="5" width="16" height="15" rx="2.500"/><path d="M4 10h16M8 3v4M16 3v4"/>',
    photo: '<rect x="3.500" y="5" width="17" height="14" rx="2.500"/><circle cx="9" cy="10" r="1.800"/><path d="M20.500 16l-5-5-8 8"/>'
  };
  function xi(n, s) { return svg(X[n], s || 22); }
  var CHEV = raw('<svg class="ios-chev" width="9" height="15" viewBox="0 0 9 15" fill="none" stroke="currentColor" stroke-width="2.200" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1.500 1.500l6 6-6 6"/></svg>');
  function tile(inner, n, sm) { return h`<span class="ios-tile t${n} ${sm ? 'sm' : ''}" aria-hidden="true">${inner}</span>`; }
  var SKILL_ICON = { know: 'book', manage: 'clock', speak: 'message', run: 'visit', support: 'users' };
  /* Each skill's "learn how" link opens the resource that teaches it */
  var SKILL_RES = { know: 'r1', manage: 'r8', speak: 'r3', run: 'r7', support: 'r2' };
  var KIND_ICON = { Guide: ['book', 1], Checklist: ['visit', 2], Video: ['play', 3], Worksheet: ['edit', 5] };
  function kindTile(r) { var k = KIND_ICON[r.kind] || ['book', 1]; return tile(k[0] === 'play' ? xi('play', 22) : ic(k[0], 22), k[1]); }
  function status(st) { return h`<span class="ios-st s-${st}"><i aria-hidden="true"></i>${F.SKILL_STATUS[st]}</span>`; }
  var shareSvg = raw('<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 15V3M8 7l4-4 4 4M7 11H5.500a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1H17"/></svg>');

  /* ---------- Tab bar ---------- */
  var TAB_SVG = {
    home: '<path d="M3.500 11.500L12 4l8.500 7.500V19a1.500 1.500 0 0 1-1.500 1.500h-4v-5.500h-6v5.500H5A1.500 1.500 0 0 1 3.500 19z"/>',
    levels: '<path d="M3 20.500V16h5v-4.500h5V7h5V3.500h3v17z"/>',
    book: '<path d="M4 5.500A1.500 1.500 0 0 1 5.500 4H12v16H5.500A1.500 1.500 0 0 1 4 18.500z"/><path d="M12 4h6.500A1.500 1.500 0 0 1 20 5.500v13a1.500 1.500 0 0 1-1.500 1.500H12z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 20.500c0-4.400 3.600-6.500 8-6.500s8 2.100 8 6.500z"/>'
  };
  function tabIcon(n, on) { return '<svg width="24" height="24" viewBox="0 0 24 24" fill="' + (on ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="1.700" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true" focusable="false">' + TAB_SVG[n] + (on && n === 'book' ? '<path d="M12 4v16" stroke="var(--tab-cut)" stroke-width="1.8"/>' : '') + '</svg>'; }
  var TABS = [['/', 'Home', 'home'], ['/levels', 'Levels', 'levels'], ['/resources', 'Resources', 'book'], ['/about', 'About me', 'user']];
  function rootOf(path) { return '/' + (path.split('/')[1] || ''); }
  function depth(path) { return path.split('/').filter(Boolean).length; }
  function tabIndex(root) { for (var i = 0; i < TABS.length; i++) if (TABS[i][0] === root) return i; return 0; }

  /* Unread care-team notes drive the tab dot and the app badge */
  function seenSet() { try { return JSON.parse(localStorage.getItem('folio.seen.' + pid()) || '[]'); } catch (e) { return []; } }
  function unread() { var seen = seenSet(); return sel.notesFor(me()).filter(function (n) { return n.role === 'peds' && seen.indexOf(n.id) < 0; }).length; }
  function updateBadge() { try { N.badge(unread() + (me().celebrate ? 1 : 0)); } catch (e) {} }
  function markSeen() { var p = me(); try { localStorage.setItem('folio.seen.' + p.id, JSON.stringify(p.notes.map(function (n) { return n.id; }))); } catch (e) {} updateBadge(); render(false); }

  /* ---------- Shared builders ---------- */
  function large(title, sub) { return h`<header class="ios-large" data-rise><h1 tabindex="-1">${title}</h1>${sub ? h`<p class="ios-sub">${sub}</p>` : ''}</header>`; }
  function stairs(n) {
    var s = ''; for (var i = 1; i <= 10; i++) s += '<i class="' + (i < n ? 'done' : i === n ? 'cur' : '') + '" style="--h:' + (22 + i * 7) + 'px;--n:' + i + '">' + (i === n ? U.star(18).s : '') + '</i>';
    return raw('<div class="ios-stairs" role="img" aria-label="Level ' + n + ' of 10">' + s + '</div>');
  }

  /* ---------- Toasts: at most three at once, and never the same message twice in a row ---------- */
  var baseToast = U.toast;
  U.toast = function (msg, withStar) {
    var box = document.getElementById('toasts'); if (!box) return;
    var live = [].filter.call(box.children, function (t) { return !t.classList.contains('out') && !t.classList.contains('ios-update'); });
    if (live.length && live[live.length - 1].textContent === msg) return;
    while (live.length >= 3) { live.shift().remove(); }
    baseToast(msg, withStar);
  };

  /* ---------- Saving: storage can fill up (photos are stored as data URLs) ---------- */
  var saveFailed = false, failToastAt = 0;
  window.addEventListener('folio:savefail', function () {
    saveFailed = true;
    if (Date.now() - failToastAt > 4000) { failToastAt = Date.now(); setTimeout(function () { if (!saveFailed) return; U.toast('Could not save. Storage for Folio on this device is full.'); }, 0); }
  });

  /* ---------- Home ---------- */
  F.actions.practise = function () {
    var p = me(), r = A.practise(p.id); N.haptic(r ? 'success' : 'light');
    U.toast(r ? 'Nice. ' + r.name + ' moved to With help. Your doctor will see it.' : 'Your care team signs skills off at your next visit.');
  };
  var cardFile = null, cardKey = '';
  function prepCard(p) {
    var k = p.id + p.folioId + p.first + p.last; if (cardKey === k && cardFile) return Promise.resolve(cardFile);
    cardKey = k; cardFile = null;
    return N.cardImage(p, sel.fid(p.folioId)).then(function (f) { if (cardKey === k) cardFile = f; return f; }, function () { return null; });
  }
  F.actions.showQR = function () {
    var p = me(); N.wakeWanted = true; N.wake.on(); prepCard(p);
    U.modal(h`<div class="ios-qrbox">${U.qr(p.card.token || p.folioId, 230)}</div><p>Sample code for the prototype. It is not scannable.<br>Folio ID ${sel.fid(p.folioId)}</p><button type="button" class="ios-btn sec" data-action="shareCard">${shareSvg} Share card as an image</button><p class="ios-cap">The image shows your name and Folio ID only. Your private tap link is never shared.</p>`,
      { label: 'Folio card QR code', head: 'Your Folio card', onClose: function () { N.wakeWanted = false; N.wake.off(); } });
  };
  F.actions.tapShare = function () {
    var p = me();
    if (p.card.status !== 'active') { U.toast('Your card is not active. Ask your clinic.'); return; }
    U.modal(h`<p>On a real phone, holding your card to a clinic tablet opens your care team view. For the demo, preview what the clinic sees.</p><a class="ios-btn" href="${F.cardUrl(p.card.token)}" target="_blank" rel="noopener">${ic('ext', 18)} Preview clinic view</a>`, { label: 'Tap to share', head: 'Tap to share' });
  };

  /* ---------- Sharing (Web Share with download or clipboard fallback). Only the Folio ID is shared, never the private tap link. ---------- */
  F.actions.shareCard = function () {
    var p = me(), data = { title: 'My Folio card', text: 'My Folio ID is ' + sel.fid(p.folioId) + '.' };
    /* Share synchronously when the image is ready: iOS only opens the share sheet inside the tap */
    if (cardFile && cardKey === p.id + p.folioId + p.first + p.last) { N.shareFile(cardFile, data); return; }
    prepCard(p).then(function (f) { if (!f) { U.toast('Could not make the image'); return; } return N.shareFile(f, data); });
  };
  F.actions.shareResource = function (el) {
    var r = S.get().resources.filter(function (x) { return x.id === el.dataset.id; })[0]; if (!r) return;
    N.shareText({ title: r.title, text: r.title + '\n\n' + r.body + '\n\nFrom Folio' });
  };
  F.actions.shareProfile = function () {
    var p = me(), own = F.SKILLS.filter(function (s2) { return p.skills[s2.id] === 'own'; }).map(function (s2) { return s2.name; }), L = sel.level(p.level);
    var want = p.wantDoctorKnow && p.wantDoctorKnow !== 'Nothing added yet.' ? p.wantDoctorKnow : '';
    var t = 'Folio summary for ' + sel.full(p) + ' (age ' + p.age + ')\nCondition: ' + p.condition + '\nLevel ' + p.level + ' of 10: ' + L.name + '\nSkills on my own: ' + (own.length ? own.join(', ') : 'still building') +
      (want ? '\n\nWhat I want my doctor to know:\n' + want : '') + (p.questions.length ? '\n\nQuestions for my next visit:\n' + p.questions.map(function (q) { return '- ' + q; }).join('\n') : '') + '\n\nFolio ID ' + sel.fid(p.folioId);
    N.shareText({ title: p.first + ' on Folio', text: t });
  };
  var lvlFile = null, lvlKey = '';
  function prepLevel(p, L) {
    var k = p.id + ':' + L.n; if (lvlKey === k && lvlFile) return Promise.resolve(lvlFile);
    lvlKey = k; lvlFile = null;
    return N.achievementImage(p, L).then(function (f) { if (lvlKey === k) lvlFile = f; return f; }, function () { return null; });
  }
  F.actions.shareLevel = function (el) {
    var p = me(), n = el && el.dataset && +el.dataset.id ? +el.dataset.id : p.level, L = sel.level(n), data = { title: 'I reached Level ' + L.n, text: 'I reached Level ' + L.n + ': ' + L.name + ' on Folio.' };
    if (lvlFile && lvlKey === p.id + ':' + L.n) { N.shareFile(lvlFile, data); return; }
    prepLevel(p, L).then(function (f) { if (!f) { U.toast('Could not make the image'); return; } return N.shareFile(f, data); });
  };

  /* ---------- Next visit (ticket card, calendar file with a 1 day reminder) ---------- */
  var MON3 = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], DAY3 = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  function timeStr(d) { var hr = d.getHours(); return ((hr % 12) || 12) + ':' + ('0' + d.getMinutes()).slice(-2) + (hr < 12 ? ' am' : ' pm'); }
  /* Calendar days, not 24 hour blocks: a visit later today is "Today", not "Tomorrow" */
  function countdown(d) {
    var now = new Date(); if (d.getTime() < now.getTime()) return 'Past visit';
    var days = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - new Date(now.getFullYear(), now.getMonth(), now.getDate())) / 864e5);
    return days <= 0 ? 'Today' : days === 1 ? 'Tomorrow' : 'in ' + days + ' days';
  }
  function visitDate(v) { if (!v || !v.iso) return null; var d = new Date(v.iso); return isNaN(d.getTime()) ? null : d; }
  F.actions.editVisit = function () {
    var p = me(), v = p.nextVisit || {};
    U.formModal({ title: v.iso ? 'Edit next visit' : 'Next visit', lead: 'Your saved questions are added to the calendar event.', cta: 'Save',
      fields: [{ name: 'iso', label: 'Date and time', type: 'datetime-local', value: v.iso || '', req: true }, { name: 'where', label: 'Clinic or doctor', value: v.where, req: true, ph: 'Dr. Okafor, Sample Children\'s Hospital' }, { name: 'note', label: 'Anything to remember', type: 'textarea', value: v.note }],
      destructive: v.iso ? { label: 'Remove visit', body: 'This clears it from Home.', run: function () { A.updatePatient(p.id, { nextVisit: null }); } } : null,
      onSubmit: function (d) { A.updatePatient(p.id, { nextVisit: { iso: d.iso, where: d.where, note: d.note || '' } }); N.haptic('success'); U.toast('Next visit saved'); } });
  };
  F.actions.addToCal = function () { var p = me(); if (!visitDate(p.nextVisit)) return; N.openCalendar(N.ics(p.nextVisit, p.questions, p.id)); };
  function ticket(p) {
    var v = p.nextVisit, d = visitDate(v);
    if (!d) return h`<section class="ios-sec" data-rise style="--d:2"><button type="button" class="ios-add" data-action="editVisit">${xi('calendar', 20)} Add your next visit</button></section>`;
    var past = d.getTime() < Date.now();
    return h`<section class="ios-sec" data-rise style="--d:2" aria-label="Next visit"><div class="ios-ticket-sh"><article class="ios-ticket ${past ? 'past' : ''}"><div class="stub" aria-hidden="true"><span class="m">${MON3[d.getMonth()]}</span><span class="d">${d.getDate()}</span><span class="w">${DAY3[d.getDay()]}</span></div>
      <div class="main"><div class="ios-eyebrow">Next visit · ${countdown(d)}</div><h3>${v.where}</h3><p>${DAY3[d.getDay()]} ${MON3[d.getMonth()]} ${d.getDate()}, ${timeStr(d)}</p>${v.note ? h`<p class="note">${v.note}</p>` : ''}
        <div class="ios-ticket-btns">${past ? h`<button type="button" class="ios-btn sm glass-btn" data-action="editVisit">${xi('calendar', 18)} Set next visit</button>` : h`<button type="button" class="ios-btn sm glass-btn" data-action="addToCal">${xi('calendar', 18)} Add to Calendar</button>`}<button type="button" class="ios-gbtn glass" data-action="editVisit" aria-label="Edit next visit">${xi('pencil', 20)}</button></div></div></article></div></section>`;
  }

  function home(params, q) {
    var p = me(), L = sel.level(p.level), nx = p.level < 10 ? sel.level(p.level + 1) : null, own = sel.ownCount(p);
    var todo = F.SKILLS.filter(function (s) { return p.skills[s.id] !== 'own'; });
    var note = sel.notesFor(p).filter(function (n) { return n.role === 'peds'; })[0];
    return { title: 'Hi ' + (F.nickname ? F.nickname(p) : p.first),
      after: function (loc, isNav) { if (isNav && q && q.show === 'card') setTimeout(function () { history.replaceState(null, '', '#/'); F.actions.showQR(); }, 350); },
      html: h`
      ${large(h`Hi <em>${F.nickname ? F.nickname(p) : p.first}</em>`, 'You are building your own health team.')}
      <div class="ios-body">
        <section class="ios-index" data-rise style="--d:1" aria-label="Your level"><span class="ios-tape" aria-hidden="true"></span>
          <div class="ios-eyebrow">Your level</div>
          <div class="ios-lvl" aria-hidden="true"><span class="ios-num">${p.level}</span><div><h2>${L.name}</h2><p>${L.phase} phase · level ${p.level} of 10</p></div></div>
          <span class="ios-sr">Level ${p.level} of 10, ${L.name}. ${L.phase} phase.</span>
          ${stairs(p.level)}
          <p class="ios-cap">${p.transferred ? 'You have moved to adult care.' : L.leads + '. ' + own + ' of 5 skills on your own.'}</p></section>
        ${ticket(p)}
        ${nx && todo.length ? h`<section class="ios-sec" data-rise style="--d:2" aria-labelledby="wk"><h2 class="ios-gh" id="wk">${tile(ic('levels', 18), 4, true)}<span>Working toward Level ${nx.n}: ${nx.name}</span></h2>
          <div class="ios-list">${todo.map(function (s) { var i = F.SKILLS.indexOf(s); return h`<a class="ios-row has-tile" href="#/resources/${SKILL_RES[s.id]}" data-key="sk-${s.id}" aria-label="${s.name}, ${F.SKILL_STATUS[p.skills[s.id]]}. Learn how">${tile(ic(SKILL_ICON[s.id], 22), (i % 5) + 1)}<span class="ios-rt"><b>${s.name}</b><small>${s.sub}</small>${status(p.skills[s.id])}</span>${CHEV}</a>`; })}</div>
          <p class="ios-gf">Tap a skill to learn how.</p>
          ${todo.some(function (s) { return p.skills[s.id] === 'learning'; }) ? h`<div style="margin-top:20px"><button type="button" class="ios-btn" data-action="practise">${xi('sparkle', 20)} I practised a skill</button><p class="ios-gf" style="text-align:center">Moves your next Learning skill to With help.</p></div>` : ''}</section>` : nx ? h`<section class="ios-sec" data-rise style="--d:2"><div class="ios-list"><div class="ios-row has-tile">${tile(ic('check', 22), 4)}<span class="ios-rt"><b>All five skills on your own</b><small>Your care team signs off at your next visit.</small></span></div></div></section>` : ''}
        ${note ? h`<section data-rise style="--d:3" aria-label="Note from your care team"><article class="ios-sticky"><span class="ios-tape b" aria-hidden="true"></span><div class="ios-eyebrow">From ${note.author} · ${U.monthYear(note.date)}</div><p>${note.text}</p><p class="ios-cap">${note.shared ? 'Shown to future care teams.' : 'Only you and your paediatric team see this.'}</p></article></section>` : ''}
        <section class="ios-pocket" data-rise style="--d:4" aria-labelledby="pk"><div class="ios-eyebrow" id="pk">My Folio card</div>
          <div class="ios-cardwrap">${U.cardFace(p, 'front')}</div>
          <div class="ios-pbtns"><button type="button" class="ios-btn glass-btn" data-action="showQR">${ic('qr', 20)} Show QR</button><button type="button" class="ios-btn glass-btn" data-action="tapShare">${ic('nfc', 20)} Tap to share</button></div>
          <p class="ios-pcap">Folio ID ${sel.fid(p.folioId)}</p></section>
      </div>` };
  }

  /* ---------- Levels ---------- */
  function levels() {
    var p = me(), L = sel.level(p.level), nx = p.level < 10 ? sel.level(p.level + 1) : null, own = sel.ownCount(p), li = '';
    for (var i = 1; i <= 10; i++) li += '<li class="' + (i < p.level ? 'done' : i === p.level ? 'cur' : '') + '" style="--h:' + (30 + i * 14) + 'px;--n:' + i + '"><span>' + i + '</span>' + (i === p.level ? U.star(20).s : '') + '</li>';
    return { title: 'Levels', navTitle: 'Level ' + p.level, html: h`
      ${large(h`Level ${p.level}: <em>${L.name}</em>`, nx ? 'Here is what gets you to Level ' + nx.n + '.' : 'You are at the top level.')}
      <div class="ios-body">
        <section class="ios-stairwrap" data-rise style="--d:1" aria-label="Your staircase"><span class="ios-tape" aria-hidden="true"></span><div class="ios-eyebrow">Your staircase</div>
          <ol class="ios-big-stairs" role="img" aria-label="Level ${p.level} of 10">${raw(li)}</ol><p class="ios-cap">${L.phase} phase. ${L.leads}.</p></section>
        <section class="ios-sec" data-rise style="--d:2" aria-labelledby="sk"><h2 class="ios-gh" id="sk">${tile(ic('check', 18), 4, true)}<span>Skills at this level</span></h2>
          <div class="ios-meter" role="img" aria-label="${own} of 5 skills on your own">${[1, 2, 3, 4, 5].map(function (i) { return h`<i class="${i <= own ? 'on' : ''}"></i>`; })}</div>
          <div class="ios-list" style="margin-top:12px">${F.SKILLS.map(function (s, i) { var st = p.skills[s.id]; return st !== 'own' ? h`<a class="ios-row has-tile" href="#/resources/${SKILL_RES[s.id]}" data-key="sk-${s.id}" aria-label="${s.name}, ${F.SKILL_STATUS[st]}. Learn how">${tile(ic(SKILL_ICON[s.id], 22), (i % 5) + 1)}<span class="ios-rt"><b>${s.name}</b><small>${s.sub}</small>${status(st)}</span>${CHEV}</a>` : h`<div class="ios-row has-tile" data-key="sk-${s.id}">${tile(ic(SKILL_ICON[s.id], 22), (i % 5) + 1)}<span class="ios-rt"><b>${s.name}</b><small>${s.sub}</small>${status(st)}</span></div>`; })}</div>
          <p class="ios-gf">${own} of 5 on your own. Your care team signs skills off in person.</p></section>
        ${nx ? h`<section class="ios-up" data-rise style="--d:3"><div class="ios-eyebrow">Up next · Level ${nx.n}</div><h3>${nx.name}</h3><p>${nx.leads}.</p><p style="margin-top:6px"><b>Unlocks:</b> ${nx.unlocks}</p></section>` : ''}
        <section class="ios-sec" data-rise style="--d:4" aria-labelledby="al"><h2 class="ios-gh" id="al">${tile(ic('levels', 18), 3, true)}<span>All 10 levels</span></h2>
          <div class="ios-list">${F.LEVELS.map(function (l) { return h`<div class="ios-row ${l.n === p.level ? 'cur' : ''}" ${l.n === p.level ? h`aria-current="step"` : ''}><span class="ios-lvn ${l.n < p.level ? 'done' : ''}" aria-hidden="true">${l.n}</span><span class="ios-rt"><b>${l.name}${l.n === p.level ? ' (you are here)' : ''}</b><small>${l.phase} · ${l.leads}</small></span>${l.n < p.level ? h`<span class="ios-done" aria-label="Done">${ic('check', 20)}</span>` : ''}</div>`; })}</div></section>
      </div>` };
  }

  /* ---------- Resources ---------- */
  var TOPICS = ['All', 'Learn', 'Visits', 'Speaking up'];
  F.actions.rtag = function (el) { if (F.ui.rt === el.dataset.v) return; F.ui.rt = el.dataset.v; N.haptic('light'); render(false); };
  F.actions.clearSearch = function () {
    F.ui.rq = ''; var i = cur && cur.el.querySelector('.ios-searchbox input'); if (i) { i.value = ''; i.blur(); } render(false);
  };
  function cleanUrl(v) {
    v = (v || '').trim(); if (!v) return { v: v };
    if (!/^[a-z][\w+.-]*:/i.test(v)) v = 'https://' + v;
    if (!/^https?:\/\//i.test(v)) return { err: 'Use a web link that starts with https://' };
    try { var u = new URL(v); if (!/\./.test(u.hostname) && u.hostname !== 'localhost') return { err: 'That link does not look complete' }; return { v: u.href }; } catch (e) { return { err: 'That link does not look right' }; }
  }
  F.actions.editLink = function (el) {
    var p = me(), id = el && el.dataset ? el.dataset.id : '', it = id ? p.links.filter(function (x) { return x.id === id; })[0] || {} : {};
    U.formModal({ title: id ? 'Edit link' : 'Add a link', lead: 'Doctors can open these. Folio only links to them.', fields: [{ name: 'title', label: 'Name', value: it.title, req: true, ph: 'My clinic portal' }, { name: 'sub', label: 'Where it is from', value: it.sub, ph: 'Sample Children\'s Hospital' }, { name: 'url', label: 'Link', type: 'url', value: it.url, req: true, ph: 'https://' }],
      validate: function (d) { var c = cleanUrl(d.url); if (c.err) return { url: c.err }; d.url = c.v; },
      destructive: id ? { label: 'Remove link', body: 'Doctors will no longer see it.', run: function () { A.remove(p.id, 'links', id); } } : null,
      onSubmit: function (d) { d.id = id; A.upsert(p.id, 'links', d); U.toast('Link saved'); } });
  };
  function resources(params, q) {
    var p = me(), ui = F.ui; if (q.t && ui._rq !== q.t && TOPICS.indexOf(q.t) >= 0) ui.rt = q.t; ui._rq = q.t || '';
    var segIdx = Math.max(0, TOPICS.indexOf(ui.rt));
    var term = (ui.rq || '').trim().toLowerCase();
    var list = S.get().resources.filter(function (r) { return r.published && (ui.rt === 'All' || r.tags.indexOf(ui.rt) >= 0) && (!term || (r.title + ' ' + r.kind + ' ' + r.body).toLowerCase().indexOf(term) >= 0); });
    return { title: 'Resources', html: h`
      ${large('Resources', 'Learn it, then link what your doctor may need.')}
      <div class="ios-body">
        <div data-rise style="--d:1;display:flex;flex-direction:column;gap:16px">
          <div class="ios-search ${ui.rq ? 'has' : ''}" role="search"><label class="ios-searchbox">${ic('search', 18)}<span class="ios-sr">Search resources</span><input type="search" placeholder="Search" value="${ui.rq}" data-bind="rq" data-rerender autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="search"></label><button type="button" class="ios-cancel" data-action="clearSearch">Cancel</button></div>
          <div class="ios-sec"><div class="ios-seg" role="group" aria-label="Topic" style="--n:4;--i:${segIdx}">${TOPICS.map(function (t) { return h`<button type="button" data-action="rtag" data-v="${t}" aria-pressed="${String(ui.rt === t)}">${t}</button>`; })}</div></div></div>
        <section class="ios-sec" data-rise style="--d:2" aria-label="Library">
          ${list.length ? h`<div class="ios-list">${list.map(function (r) { return h`<a class="ios-row has-tile" href="#/resources/${r.id}" data-ctx="resource:${r.id}">${kindTile(r)}<span class="ios-rt"><b>${r.title}</b><small>${r.kind} · ${r.mins}</small></span>${F.fx ? raw(F.fx.readDot(r.id)) : ''}${CHEV}</a>`; })}</div>` : h`<div class="ios-list"><div class="ios-row has-tile" role="status">${tile(ic('search', 22), 2)}<span class="ios-rt"><b>${term ? 'No results for "' + ui.rq.trim() + '"' : 'Nothing in this topic yet'}</b><small>${term ? 'Check the spelling or try another topic.' : 'Try another topic.'}</small></span></div></div>`}</section>
        <section class="ios-sec" data-rise style="--d:3" aria-labelledby="ml"><h2 class="ios-gh" id="ml">${tile(ic('link', 18), 3, true)}<span>My links · doctors can open these</span></h2>
          <div class="ios-list">${p.links.map(function (l, i) { return h`<div class="ios-swipe" data-ctx="link:${l.id}">${swipeTray()}<button type="button" class="ios-row has-tile" data-action="editLink" data-id="${l.id}" aria-label="${l.title}${l.sub ? ', ' + l.sub : ''}. Edit">${tile(ic('link', 22), (i % 5) + 1)}<span class="ios-rt"><b>${l.title}</b><small>${l.sub || l.url}</small></span>${CHEV}</button></div>`; })}
            <button type="button" class="ios-row has-tile ios-addrow" data-action="editLink">${tile(ic('plus', 22), 4)}<span class="ios-rt"><b>Add a link</b></span></button></div>
          <p class="ios-gf">Folio stores links, never health records. Swipe left or touch and hold a link for more.</p></section>
      </div>` };
  }
  function resourceDetail(params) {
    var r = S.get().resources.filter(function (x) { return x.id === params.id && x.published; })[0];
    if (!r) return { title: 'Not found', back: { href: '#/resources', label: 'Resources' }, html: h`${large('Not found', 'This resource was removed or is not published.')}<div class="ios-body"><div class="ios-sec"><a class="ios-btn sec" href="#/resources">Back to resources</a></div></div>` };
    var paras = r.body.split('. ').map(function (t, i, a) { return i < a.length - 1 ? t + '.' : t; }); var mid = Math.ceil(paras.length / 2);
    var two = [paras.slice(0, mid).join(' '), paras.slice(mid).join(' ')].filter(Boolean);
    var skill = F.SKILLS.filter(function (s) { return SKILL_RES[s.id] === r.id; })[0];
    return { title: r.title, navTitle: r.title, back: { href: '#/resources', label: 'Resources' }, html: h`
      <header class="ios-large" data-rise><h1 tabindex="-1">${r.title}</h1></header>
      <div class="ios-body">
        <div class="ios-meta" data-rise style="--d:1">${kindTile(r)}<span><b>${r.kind}</b><br><span class="ios-detail">${r.mins}${skill ? ' · helps with ' + skill.name : ''}</span></span></div>
        <article class="ios-read" data-rise style="--d:2"><span class="ios-tape" aria-hidden="true"></span>${two.map(function (t) { return h`<p>${t}</p>`; })}</article>
        ${F.fx ? raw(F.fx.readBlock(r)) : ''}<div class="ios-sec" data-rise style="--d:3"><button type="button" class="ios-btn sec" data-action="shareResource" data-id="${r.id}">${shareSvg} Share this resource</button></div>
      </div>` };
  }

  /* ---------- About me ---------- */
  /* "What I want my doctor to know" autosaves while typing (quietly), on blur, and before navigating away. */
  var wantTimer = null, wantDirty = false;
  function saveWantNow() {
    clearTimeout(wantTimer); wantTimer = null;
    var t = document.getElementById('story'); if (!t) return false;
    var v = t.value.trim() || 'Nothing added yet.', p = me(); if (!p || v === p.wantDoctorKnow) return false;
    A.updatePatient(p.id, { wantDoctorKnow: v }); return true;
  }
  document.addEventListener('input', function (e) { if (e.target && e.target.id === 'story') { wantDirty = true; clearTimeout(wantTimer); wantTimer = setTimeout(saveWantNow, 900); } });
  F.actions.saveWant = function () { saveWantNow(); if (wantDirty) { wantDirty = false; U.toast('Saved'); } };
  window.addEventListener('pagehide', saveWantNow);
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') saveWantNow(); });

  F.actions.addQ = function () {
    var p = me();
    U.formModal({ title: 'New question', lead: 'Write it down now so you remember at the visit.', cta: 'Add', fields: [{ name: 'q', label: 'Question', type: 'textarea', req: true, ph: 'For example: can I adjust my insulin before sports?' }], onSubmit: function (d) { var pp = me(); A.updatePatient(pp.id, { questions: pp.questions.concat([d.q]) }); U.toast('Question added'); } });
  };
  F.actions.rmQ = function (el) {
    var p = me(), i = +el.dataset.i, q = p.questions[i]; if (q == null) return;
    U.confirmModal({ title: 'Remove this question?', body: q, cta: 'Remove', danger: true, onOk: function () { var pp = me(); A.updatePatient(pp.id, { questions: pp.questions.filter(function (x, k) { return k !== i; }) }); U.toast('Question removed'); } });
  };
  F.actions.vis = function (el) { A.upsert(pid(), 'contacts', { id: el.dataset.id, visible: el.checked }); };
  F.actions.shareNotes = function (el) { A.updatePatient(pid(), { shareNotes: el.checked }); U.toast(el.checked ? 'Adult teams can see shared notes' : 'Notes hidden from adult teams'); };
  function personForm(list, noun, rolekey) {
    return function (el) {
      var p = me(), id = el && el.dataset ? el.dataset.id : '', it = id ? p[list].filter(function (x) { return x.id === id; })[0] || {} : {};
      U.formModal({ title: id ? 'Edit ' + noun : 'Add ' + noun,
        top: id ? h`<div class="ios-formav"><span data-avprev="${list}:${id}">${U.avatar(it, 84)}</span><button type="button" class="ios-nbtn" data-action="pickAvatar" data-list="${list}" data-id="${id}">Change photo</button></div>` : null,
        fields: [{ name: 'name', label: 'Name', value: it.name, req: true }, { name: rolekey, label: rolekey === 'rel' ? 'Relationship' : 'Role', value: it[rolekey], req: true, ph: rolekey === 'rel' ? 'Mom, dad, partner' : 'Endocrinologist' }, { name: 'phone', label: 'Phone', type: 'tel', value: it.phone, ph: '416 555 0100' }],
        validate: function (d) { if (d.phone && !/^\+?[\d\s().-]{7,}$/.test(d.phone)) return { phone: 'Use numbers only, like 416 555 0100' }; },
        destructive: id ? { label: 'Remove ' + noun, body: 'You can add them again later.', run: function () { A.remove(p.id, list, id); } } : null,
        onSubmit: function (d) { d.id = id; if (!id && list === 'contacts') d.visible = true; A.upsert(p.id, list, d); U.toast('Saved'); } });
    };
  }
  F.actions.editContact = personForm('contacts', 'family contact', 'rel');
  F.actions.editTeam = personForm('careTeam', 'care team member', 'role');
  F.actions.a11yApp = function (el) { S.a11y.set(el.dataset.k, el.checked ? el.dataset.on : el.dataset.off); };
  F.actions.install = function () { if (deferred) { deferred.prompt(); deferred = null; render(false); } };
  F.actions.asPatient = function (el) { saveWantNow(); try { localStorage.setItem(PKEY, el.value); } catch (e) {} cardFile = null; lvlFile = null; tabMem = {}; scrollMem = {}; tabMem['/about'] = '/about';
    /* Patch in place: keep the scroll position and focus, and do not replay entrance animations */
    var keep = N.scrollSnapshot(); render(false); keep(); el.blur && el.blur(); U.toast('Now viewing as ' + sel.full(me())); };
  F.actions.focusStory = function () { var t = document.getElementById('story'); if (t) { t.scrollIntoView({ block: 'center', behavior: N.reduced() ? 'auto' : 'smooth' }); setTimeout(function () { t.focus({ preventScroll: true }); }, 350); } };

  function ring(pct) {
    var r = 32, len = +(2 * Math.PI * r).toFixed(2);
    return raw('<div class="ios-ring" aria-hidden="true"><svg width="76" height="76" viewBox="0 0 76 76"><circle cx="38" cy="38" r="' + r + '" fill="none" stroke="rgba(31,47,22,.16)" stroke-width="8"/><circle class="ios-ring-fg" cx="38" cy="38" r="' + r + '" fill="none" stroke="#395B50" stroke-width="8" stroke-linecap="round" stroke-dasharray="' + len + '" stroke-dashoffset="' + (pct >= 100 ? 0 : +(len * (1 - pct / 100)).toFixed(2)) + '" style="--len:' + len + '"' + (pct <= 0 ? ' opacity="0"' : '') + '/></svg><b>' + pct + '%</b></div>');
  }
  function swipeTray() { return h`<div class="ios-swipe-actions"><button type="button" tabindex="-1" class="edit" data-swipe-act="edit">Edit</button><button type="button" tabindex="-1" class="rm" data-swipe-act="remove">Remove</button></div>`; }
  function contactRow(c, list, rolekey) {
    var tel = c.phone ? c.phone.replace(/[^\d+]/g, '') : '';
    return h`<div class="ios-swipe" data-ctx="${list === 'contacts' ? 'contact' : 'team'}:${c.id}">${swipeTray()}<div class="ios-row ios-prow">
      <div class="ios-prow-top"><button type="button" class="ios-rowmain" data-action="${list === 'contacts' ? 'editContact' : 'editTeam'}" data-id="${c.id}" aria-label="Edit ${c.name}">${U.avatar(c, 48)}<span class="ios-rt"><b>${c.name}</b><small>${c[rolekey]}${c.phone ? h` · <span class="nw">${c.phone}</span>` : ''}</small></span></button>
        ${tel ? h`<span class="ios-rowtrail"><a class="ios-round" href="tel:${tel}" aria-label="Call ${c.name}">${ic('phone', 20)}</a><a class="ios-round" href="sms:${tel}" aria-label="Message ${c.name}">${ic('message', 20)}</a></span>` : ''}</div>
      ${list === 'contacts' ? h`<label class="ios-prow-sw"><span class="ios-detail">Doctors can contact</span><input type="checkbox" role="switch" switch class="ios-sw" ${c.visible ? 'checked' : ''} data-change="vis" data-id="${c.id}" aria-label="Doctors can contact ${c.name}"></label>` : ''}</div></div>`;
  }
  var HOW_ICON = { 'Card tap (NFC)': ['nfc', '#92AFD7'], 'Card tap (QR)': ['qr', '#92AFD7'], Portal: ['eye', '#C5D1EB'] };

  function about() {
    var p = me(), a = S.a11y.get(), st = S.get();
    var log = st.access.filter(function (x) { return x.pid === p.id; }).slice().sort(function (x, y) { return x.time < y.time ? 1 : -1; }).slice(0, 5);
    var standalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || navigator.standalone;
    var items = [
      ['Add a photo', !!(p.photo || p.avatar), 'pickAvatar'],
      ['Say what you want your doctor to know', !!(p.wantDoctorKnow && p.wantDoctorKnow !== 'Nothing added yet.'), 'focusStory'],
      ['Add a family contact', p.contacts.length > 0, 'editContact'],
      ['Add a care team member', p.careTeam.some(function (c) { return c.name && c.name !== 'Not added yet'; }), 'editTeam'],
      ['Link a record or resource', p.links.length > 0, 'editLink']
    ];
    var doneN = items.filter(function (x) { return x[1]; }).length, pct = Math.round(doneN / items.length * 100);
    return { title: 'About me', navTitle: sel.full(p), html: h`
      <div class="ios-profile" data-rise>
        <span class="ios-av-hero">${U.avatar(p, 116)}<button type="button" class="ios-av-badge" data-action="pickAvatar" aria-label="Change profile photo">${xi('camera', 22)}</button></span>
        <h1 tabindex="-1">${sel.full(p)}</h1>
        <div class="meta">Age ${p.age} · Folio ID ${sel.fid(p.folioId)}</div>
        <span class="ios-chip">${xi('heart', 16)} ${p.condition}</span>
        <p class="ios-cap" style="margin-top:8px">Diagnosis is set by your clinic.</p>${F.fx ? raw(F.fx.nickRow(p)) : ''}
      </div>
      <div class="ios-body" style="margin-top:28px">
        <section class="ios-complete" data-rise style="--d:1" aria-labelledby="cp"><div class="ios-complete-head">${ring(pct)}<div><h2 id="cp">${pct === 100 ? 'Profile complete' : 'Finish your profile'}</h2><p>${doneN} of ${items.length} done. Adult doctors see this when they tap your card.</p></div></div>
          <ul class="ios-checks">${items.map(function (x) { return h`<li class="${x[1] ? 'done' : ''}"><button type="button" data-action="${x[2]}" aria-label="${x[0]}${x[1] ? ', done' : ''}"><span class="box">${x[1] ? ic('check', 14) : ''}</span><span class="t">${x[0]}</span><span class="go">${CHEV}</span></button></li>`; })}</ul></section>
        <section class="ios-sec" data-rise style="--d:2" aria-labelledby="story-h"><h2 class="ios-gh" id="story-h">${tile(xi('pencil', 18), 5, true)}<span>My story</span></h2>
          <div class="ios-story"><span class="ios-tape b" aria-hidden="true"></span><div class="ios-eyebrow" style="margin-bottom:8px" aria-hidden="true">What I want my doctor to know</div><label class="ios-sr" for="story">What I want my doctor to know</label><textarea id="story" data-change="saveWant" maxlength="600" placeholder="For example: I get anxious in new clinics. Please explain what you are doing as you go.">${p.wantDoctorKnow === 'Nothing added yet.' ? '' : p.wantDoctorKnow}</textarea><p class="ios-cap">Saves as you type. Shows as "Patient: ${p.first}" to doctors.</p></div></section>
        <section class="ios-sec" data-rise style="--d:3" aria-labelledby="q-h"><h2 class="ios-gh" id="q-h">${tile(ic('message', 18), 3, true)}<span>Questions for my next visit</span></h2>
          <div class="ios-qcards">${p.questions.length ? '' : h`<p class="ios-empty">No questions yet. Add one when it comes to mind.</p>`}${p.questions.map(function (qq, i) { return h`<div class="ios-qcard"><span aria-hidden="true">${ic('message', 20)}</span><span class="q">${qq}</span><button type="button" class="x" data-action="rmQ" data-i="${i}" aria-label="Remove question: ${qq}">${ic('x', 18)}</button></div>`; })}
            <button type="button" class="ios-add" data-action="addQ">${ic('plus', 20)} Add a question</button></div></section>
        <section class="ios-sec" data-rise style="--d:4" aria-labelledby="f-h"><h2 class="ios-gh" id="f-h">${tile(ic('users', 18), 1, true)}<span>Family contacts</span></h2>
          <div class="ios-list">${p.contacts.map(function (c) { return contactRow(c, 'contacts', 'rel'); })}<button type="button" class="ios-row has-tile ios-addrow" data-action="editContact">${tile(ic('plus', 22), 4)}<span class="ios-rt"><b>Add contact</b></span></button></div>
          <p class="ios-gf">Switch on so doctors can call or message them.</p></section>
        <section class="ios-sec" data-rise style="--d:5" aria-labelledby="c-h"><h2 class="ios-gh" id="c-h">${tile(ic('team', 18), 2, true)}<span>Care team</span></h2>
          <div class="ios-list">${p.careTeam.map(function (c) { return contactRow(c, 'careTeam', 'role'); })}<button type="button" class="ios-row has-tile ios-addrow" data-action="editTeam">${tile(ic('plus', 22), 4)}<span class="ios-rt"><b>Add care team member</b></span></button></div></section>
        <section class="ios-sec" data-rise style="--d:6" aria-labelledby="s-h"><h2 class="ios-gh" id="s-h">${tile(ic('shield', 18), 4, true)}<span>Sharing and privacy</span></h2>
          <div class="ios-list"><label class="ios-row has-tile">${tile(ic('lock', 22), 3)}<span class="ios-rt"><b>Share my notes with adult care</b><small>You can change this any time.</small></span><input type="checkbox" role="switch" switch class="ios-sw" ${p.shareNotes !== false ? 'checked' : ''} data-change="shareNotes" aria-label="Share my notes with adult care"></label>
            <button type="button" class="ios-row has-tile" data-action="shareProfile">${tile(shareSvg, 1)}<span class="ios-rt"><b>Share a summary</b><small>Send your level, skills and visit questions to a new doctor.</small></span>${CHEV}</button></div></section>
        <section class="ios-sec" data-rise style="--d:7" aria-labelledby="w-h"><h2 class="ios-gh" id="w-h">${tile(ic('eye', 18), 5, true)}<span>Who has looked at my profile</span></h2>
          <div class="ios-list">${log.length ? h`<ol class="ios-timeline">${log.map(function (l) { var ho = HOW_ICON[l.how] || ['eye', '#C5D1EB']; return h`<li><span class="dot" style="--c:${ho[1]}" aria-hidden="true">${ic(ho[0], 20)}</span><span class="ios-rt"><b>${l.who}</b><small>${l.how} · ${U.fmtTime(l.time)}</small></span></li>`; })}</ol>` : h`<div class="ios-row has-tile">${tile(ic('eye', 22), 2)}<span class="ios-rt"><b>No one yet</b><small>Opens are listed here.</small></span></div>`}</div></section>
        <section class="ios-sec" data-rise style="--d:8" aria-labelledby="a-h"><h2 class="ios-gh" id="a-h">${tile(ic('settings', 18), 2, true)}<span>Display and motion</span></h2>
          <div class="ios-list">
            <label class="ios-row"><span class="ios-rt"><b>Increase contrast</b></span><input type="checkbox" role="switch" switch class="ios-sw" ${a.contrast === 'high' ? 'checked' : ''} data-change="a11yApp" data-k="contrast" data-on="high" data-off="normal" aria-label="Increase contrast"></label>
            <label class="ios-row"><span class="ios-rt"><b>Reduce motion</b></span><input type="checkbox" role="switch" switch class="ios-sw" ${a.motion === 'reduce' ? 'checked' : ''} data-change="a11yApp" data-k="motion" data-on="reduce" data-off="auto" aria-label="Reduce motion"></label></div>
          <p class="ios-gf">Text size follows your iPhone's Display and Text Size setting.</p></section>
        ${standalone ? '' : h`<section class="ios-sec" aria-labelledby="i-h"><h2 class="ios-gh" id="i-h">${tile(ic('plus', 18), 3, true)}<span>Add Folio to your home screen</span></h2><div class="ios-list"><div class="ios-row has-tile">${tile(shareSvg, 1)}<span class="ios-rt"><b>${N.ios ? 'In Safari, tap Share, then Add to Home Screen' : 'Install it like an app'}</b><small>${N.ios ? 'On iOS 26, Share is in the ··· menu. ' : ''}Folio then opens full screen and works offline.</small></span></div>${deferred ? h`<button type="button" class="ios-row ios-addrow" data-action="install"><b>Install Folio</b></button>` : ''}</div></section>`}
        <section class="ios-sec" aria-labelledby="d-h"><h2 class="ios-gh" id="d-h"><span>Prototype</span></h2>
          <div class="ios-list"><label class="ios-row ios-selrow"><span class="ios-rt"><b>View the app as</b></span><select class="ios-select" data-change="asPatient" aria-label="View the app as">${st.patients.map(function (x) { return h`<option value="${x.id}" ${x.id === p.id ? 'selected' : ''}>${sel.full(x)} · L${x.level}</option>`; })}</select>${raw('<svg class="ios-chev" width="12" height="18" viewBox="0 0 12 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 7l4-4 4 4M2 11l4 4 4-4"/></svg>')}</label></div>
          <div class="ios-list" style="margin-top:12px"><button type="button" class="ios-row" data-action="hapticLab"><span class="ios-rt"><b>Haptics test</b><small>Check which taps make your phone tick</small></span>${CHEV}</button></div>
          <p class="ios-gf">Demo only. Switch patient to try other levels.</p></section>
      </div>` };
  }

  /* ---------- Photo picker ---------- */
  function downscale(file, cb) {
    function draw(src, w, hh) {
      try {
        var c = document.createElement('canvas'); c.width = c.height = 256; var g = c.getContext('2d'), s = Math.min(w, hh), sx = (w - s) / 2, sy = (hh - s) / 2;
        g.drawImage(src, sx, sy, s, s, 0, 0, 256, 256); cb(c.toDataURL('image/jpeg', .82));
      } catch (e) { U.toast('Could not read that photo'); }
    }
    if (!file || (file.type && !/^image\//.test(file.type))) { U.toast('Choose a photo file'); return; }
    if (window.createImageBitmap) {
      try { createImageBitmap(file, { imageOrientation: 'from-image' }).then(function (b) { draw(b, b.width, b.height); }, fallback); } catch (e) { fallback(); }
    } else fallback();
    function fallback() {
      var im = new Image(), u = URL.createObjectURL(file); im.onload = function () { draw(im, im.naturalWidth, im.naturalHeight); URL.revokeObjectURL(u); }; im.onerror = function () { URL.revokeObjectURL(u); U.toast('Could not read that photo'); }; im.src = u;
    }
  }
  function avatarTarget() { var t = F.ui._avt || {}, p = me(); return t.list && t.id ? (p[t.list] || []).filter(function (x) { return x.id === t.id; })[0] : p; }
  /* Returns false (and rolls back) when the device storage is full */
  function saveAvatar(f) {
    var t = F.ui._avt || {}, p = me(), tgt = avatarTarget(); if (!tgt) return false;
    var prev = { photo: tgt.photo || '', avatar: tgt.avatar || '' };
    saveFailed = false;
    if (t.list && t.id) A.upsert(p.id, t.list, Object.assign({ id: t.id }, f)); else A.updatePatient(p.id, f);
    if (saveFailed) {
      saveFailed = false; failToastAt = Date.now();
      if (t.list && t.id) A.upsert(p.id, t.list, Object.assign({ id: t.id }, prev)); else A.updatePatient(p.id, prev);
      U.toast('That photo could not be saved. Storage on this device is full.'); return false;
    }
    /* Refresh the avatar shown in a person form underneath, if one is open */
    var pv = t.list && document.querySelector('[data-avprev="' + t.list + ':' + t.id + '"]'); if (pv) { var it = avatarTarget(); pv.innerHTML = U.avatar(it, 84).s; }
    return true;
  }
  F.actions.pickAvatar = function (el) {
    var p = me(), t = { list: el && el.dataset ? el.dataset.list || '' : '', id: el && el.dataset ? el.dataset.id || '' : '' }; F.ui._avt = t;
    var tgt = avatarTarget() || p, ids = F.AVATARS || [];
    U.modal(h`<div class="ios-form">
        <div class="ios-list">
          <label class="ios-row has-tile" for="ph-cam">${tile(xi('camera', 22), 1)}<span class="ios-rt"><b>Take photo</b></span>${CHEV}</label>
          <label class="ios-row has-tile" for="ph-lib">${tile(xi('photo', 22), 3)}<span class="ios-rt"><b>Choose from library</b></span>${CHEV}</label></div>
        <input id="ph-cam" type="file" accept="image/*" capture="user" class="ios-sr" data-change="photoFile" tabindex="-1" aria-hidden="true"><input id="ph-lib" type="file" accept="image/*" class="ios-sr" data-change="photoFile" tabindex="-1" aria-hidden="true">
        <div><h3 class="ios-gh" style="margin-left:4px">Or pick a character</h3><div class="ios-avgrid" role="group" aria-label="Characters">${ids.map(function (id, i) { return h`<button type="button" data-action="usePreset" data-id="${id}" aria-pressed="${String(tgt.avatar === id && !tgt.photo)}" aria-label="Character ${i + 1}">${U.avatar({ avatar: id }, 68)}</button>`; })}</div></div>
        ${tgt.photo || tgt.avatar ? h`<div class="ios-list"><button type="button" class="ios-row destructive" data-action="removePhoto" style="justify-content:center"><b>Remove photo</b></button></div>` : ''}
      </div>`, { label: 'Choose a photo', head: 'Choose a photo' });
  };
  F.actions.photoFile = function (el) {
    var f = el.files && el.files[0]; if (!f) return; /* cancelled: nothing to do */
    downscale(f, function (url) { el.value = ''; if (saveAvatar({ photo: url, avatar: '' })) { U.closeModal(); U.toast('Photo updated'); } });
  };
  F.actions.usePreset = function (el) { if (saveAvatar({ avatar: el.dataset.id, photo: '' })) { N.haptic('light'); U.closeModal(); U.toast('Character chosen'); } };
  F.actions.removePhoto = function () {
    U.confirmModal({ title: 'Remove photo?', body: 'Your initial will show instead.', cta: 'Remove photo', danger: true, onOk: function () { saveAvatar({ photo: '', avatar: '' }); U.closeModal(); U.toast('Photo removed'); } });
  };

  /* ---------- Level-up ---------- */
  function celebrate(p, c) {
    var transfer = c === 'transfer', L = transfer ? sel.level(10) : sel.level(c), cols = ['#92AFD7', '#E9DCC3', '#F0E3CE', '#C5D1EB', '#5A7684'], bits = '', seed = L.n * 7919;
    function rnd() { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; }
    for (var i = 0; i < 22; i++) bits += '<i style="left:' + Math.round(rnd() * 100) + '%;background:' + cols[i % 5] + ';animation-duration:' + (2.4 + rnd() * 2.4).toFixed(1) + 's;animation-delay:' + (rnd() * 1.4).toFixed(1) + 's"></i>';
    var so = p.levelSignoff || { by: 'Your care team', date: new Date().toISOString().slice(0, 10) };
    return h`<div class="ios-lvlup" role="dialog" aria-modal="true" aria-labelledby="lv-h"><div class="ios-confetti" aria-hidden="true">${raw(bits)}</div>
      <div class="ios-stackviz" aria-hidden="true"><i></i><i></i><i></i>${U.star(34)}</div>
      <div class="ios-eyebrow">${transfer ? 'Final sign-off' : 'Level up'}</div>
      <h2 id="lv-h">${transfer ? 'You own it' : 'Level ' + L.n + ': ' + L.name}</h2>
      <p>${transfer ? 'Your adult team has what they need, and you decide who sees what.' : 'You and your care team now: ' + L.leads.toLowerCase() + '.'}</p>
      <div class="stamp" role="img" aria-label="Signed off by ${so.by}">${U.star(22)}<span>Signed off</span></div>
      <div class="ios-changed"><div class="ios-eyebrow">What changed</div><ul><li>${so.by} signed off, ${U.monthYear(so.date)}</li><li>Unlocked: ${L.unlocks}</li></ul></div>
      <div class="ios-lv-btns"><button type="button" class="ios-btn light" data-action="closeCelebrate">Continue</button><button type="button" class="ios-btn ghost" data-action="shareLevel" data-id="${L.n}">${shareSvg} Share this level</button></div></div>`;
  }
  F.actions.closeCelebrate = function () {
    var el = lvHost && lvHost.querySelector('.ios-lvlup'), id = pid();
    if (!el || N.reduced()) { A.dismissCelebrate(id); return; }
    el.classList.add('out'); setTimeout(function () { A.dismissCelebrate(id); }, 260);
  };

  /* ---------- iOS sheets (replace the shared dialog helpers inside this app) ---------- */
  var sheets = [];
  function topSheet() { for (var i = sheets.length - 1; i >= 0; i--) if (!sheets[i].closed) return sheets[i]; return null; }
  function mountSheet(inner, cls, label) {
    var root = document.getElementById('modal-root'), wrap = document.createElement('div');
    N.closeSwipes();
    wrap.className = 'ios-sheet-wrap ' + (cls || '');
    wrap.innerHTML = '<div class="ios-scrim" data-close></div><div class="ios-sheet" role="dialog" aria-modal="true" tabindex="-1" aria-label="' + esc(label || 'Sheet') + '"><div class="ios-grab" aria-hidden="true"></div>' + inner + '</div>';
    var below = topSheet(); if (below) below.wrap.setAttribute('inert', '');
    root.appendChild(wrap);
    var rec = { wrap: wrap, sheet: wrap.querySelector('.ios-sheet'), closed: false, prev: document.activeElement, onClose: null };
    sheets.push(rec); appEl.setAttribute('inert', '');
    dragWire(rec);
    /* Forms focus their first field (opens the keyboard like a native form sheet); other sheets focus the sheet itself */
    var first = rec.sheet.querySelector('input:not([type=file]):not([type=checkbox]),textarea,select'); (first && cls === 'form' && first.type !== 'datetime-local' ? first : rec.sheet).focus({ preventScroll: true });
    return rec;
  }
  function closeSheet(rec) {
    if (!rec || rec.closed) return; rec.closed = true;
    if (rec.dragged) { rec.sheet.style.transition = 'transform .24s cubic-bezier(.3,0,.8,.15)'; rec.sheet.style.transform = 'translateY(100%)'; }
    rec.wrap.classList.add('out'); if (rec.onClose) { try { rec.onClose(); } catch (e) {} }
    var nt = topSheet(); if (nt) nt.wrap.removeAttribute('inert'); else appEl.removeAttribute('inert');
    setTimeout(function () {
      rec.wrap.remove(); sheets = sheets.filter(function (r) { return r !== rec; });
      if (rec.prev && document.body.contains(rec.prev) && !rec.prev.closest('[inert]')) { var keep = N.scrollSnapshot(); try { rec.prev.focus({ preventScroll: true }); } catch (e) {} keep(); }
    }, N.reduced() ? 10 : 260);
  }
  function dragWire(rec) {
    var sh = rec.sheet, scrim = rec.wrap.querySelector('.ios-scrim'), y0 = null, dy = 0, t0 = 0, active = false;
    sh.addEventListener('touchstart', function (e) {
      var head = e.target.closest('.ios-grab,.ios-sheet-head');
      /* While typing, only the grabber or header drags the sheet: a touch on a field row must never dismiss a half-filled form */
      var typing = document.getElementById('device').classList.contains('kbd') && rec.sheet.contains(document.activeElement);
      if (!(head || (!typing && sh.scrollTop <= 0 && !e.target.closest('input,textarea,select,label')))) return;
      y0 = e.touches[0].clientY; t0 = Date.now(); dy = 0; active = false;
    }, { passive: true });
    sh.addEventListener('touchmove', function (e) {
      if (y0 == null) return; dy = Math.max(0, e.touches[0].clientY - y0);
      if (!active && dy > 6) { active = true; sh.style.animation = 'none'; sh.style.transition = 'none'; }
      if (!active) return;
      sh.style.transform = 'translateY(' + dy + 'px)'; if (scrim) scrim.style.opacity = String(Math.max(.2, 1 - dy / Math.max(300, sh.offsetHeight)));
      if (dy > 110 && !rec.det) { rec.det = 1; N.haptic('light'); } if (dy < 110) rec.det = 0;
    }, { passive: true });
    function end() {
      if (y0 == null) return; var v = dy / Math.max(1, Date.now() - t0); y0 = null; if (!active) return; active = false;
      if ((dy > 110 || v > .6) && rec.guard && rec.guard()) { snapBack(); askDiscard(rec); return; }
      if (dy > 110 || v > .6) { rec.dragged = true; if (scrim) { scrim.style.transition = 'opacity .24s'; scrim.style.opacity = '0'; } closeSheet(rec); }
      else snapBack();
    }
    function snapBack() { sh.style.transition = 'transform .3s cubic-bezier(.2,.9,.25,1)'; sh.style.transform = ''; if (scrim) { scrim.style.transition = 'opacity .3s'; scrim.style.opacity = ''; } setTimeout(function () { sh.style.transition = ''; if (scrim) scrim.style.transition = ''; }, 320); }
    sh.addEventListener('touchend', end); sh.addEventListener('touchcancel', end);
  }
  document.addEventListener('click', function (e) {
    var c = e.target.closest('[data-close]'); if (!c) return; var w = c.closest('.ios-sheet-wrap'); if (!w) return;
    requestClose(sheets.filter(function (r) { return r.wrap === w; })[0]);
  });
  /* A form with unsaved typing asks before it closes (backdrop tap, swipe down, Cancel, Escape). Clean forms close freely. */
  function requestClose(rec) { if (!rec || rec.closed) return; if (rec.guard && rec.guard()) askDiscard(rec); else closeSheet(rec); }
  function askDiscard(rec) {
    if (rec.asking) return; rec.asking = true;
    var a = document.activeElement; if (a && a.blur && rec.sheet.contains(a)) a.blur();
    U.confirmModal({ title: 'Discard changes?', body: 'What you typed will not be saved.', cta: 'Discard Changes', cancel: 'Keep Editing', danger: true,
      onOk: function () { rec.asking = false; rec.guard = null; closeSheet(rec); }, onCancel: function () { rec.asking = false; } });
  }
  document.addEventListener('keydown', function (e) {
    var top = topSheet();
    if (!top) {
      if (e.key === 'Escape' && lvHost && lvHost.firstChild && !N.contextOpen()) F.actions.closeCelebrate();
      if (e.key === 'Tab' && lvHost && lvHost.firstChild) trap(e, lvHost);
      return;
    }
    if (e.key === 'Escape') { if (N.contextOpen()) return; e.preventDefault(); requestClose(top); return; }
    if (e.key === 'Tab') trap(e, top.sheet);
  });
  function trap(e, box) {
    var f = [].filter.call(box.querySelectorAll('a[href],button:not([disabled]),input:not([type=file]):not([tabindex="-1"]),select,textarea'), function (x) { return x.offsetParent !== null || x.getClientRects().length; }); if (!f.length) return;
    var a = f[0], z = f[f.length - 1];
    if (!box.contains(document.activeElement)) { e.preventDefault(); a.focus(); return; }
    if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
  }
  U.modal = function (content, opts) {
    var head = opts && opts.head ? '<div class="ios-sheet-head"><span></span><h2>' + esc(opts.head) + '</h2><button type="button" class="ios-nbtn bold" data-close>Done</button></div>' : '';
    var rec = mountSheet(head + '<div class="ios-sheet-body">' + (content.s || '') + '</div>', (opts && opts.cls) || '', opts && (opts.label || opts.head)); if (opts && opts.onClose) rec.onClose = opts.onClose; return rec.sheet;
  };
  U.closeModal = function () { closeSheet(topSheet()); };
  function fieldRow(x) {
    var id = 'f_' + x.name, v = x.value == null ? '' : x.value, ctl;
    if (x.type === 'select') ctl = h`<select id="${id}" name="${x.name}" aria-describedby="e_${x.name}">${x.options.map(function (op) { return h`<option ${op === v ? 'selected' : ''}>${op}</option>`; })}</select>`;
    else if (x.type === 'textarea') ctl = h`<textarea id="${id}" name="${x.name}" rows="3" ${x.req ? 'required' : ''} placeholder="${x.ph || ''}" aria-describedby="e_${x.name}">${v}</textarea>`;
    else ctl = h`<input id="${id}" name="${x.name}" type="${x.type || 'text'}" value="${v}" ${x.req ? 'required' : ''} placeholder="${x.ph || ''}" aria-describedby="e_${x.name}" autocomplete="off" ${x.type === 'url' ? raw('autocapitalize="off" autocorrect="off" spellcheck="false" inputmode="url"') : x.type === 'tel' ? raw('inputmode="tel"') : x.name === 'name' ? raw('autocapitalize="words"') : ''}>`;
    return h`<label class="ios-field" for="${id}"><span class="ios-fl">${x.label}${x.req ? '' : ' (optional)'}</span>${ctl}<span class="ios-ferr" id="e_${x.name}" role="alert"></span></label>`;
  }
  U.formModal = function (o) {
    var rec = mountSheet(h`<form class="ios-form" novalidate><div class="ios-sheet-head"><button type="button" class="ios-nbtn" data-close>Cancel</button><h2>${o.title}</h2><button type="submit" class="ios-nbtn bold">${o.cta || 'Save'}</button></div>
      ${o.top || ''}${o.lead ? h`<p class="ios-cap" style="margin:0 4px">${o.lead}</p>` : ''}
      <div class="ios-list">${o.fields.map(fieldRow)}</div>
      ${o.destructive ? h`<div class="ios-list"><button type="button" class="ios-row destructive" data-destroy style="justify-content:center"><b>${o.destructive.label}</b></button></div>` : ''}</form>`.s, 'form', o.title);
    var form = rec.sheet.querySelector('form');
    function snap() { return [].map.call(form.elements, function (el) { return el.name ? el.name + '=' + el.value : ''; }).join('\n'); }
    var initial = snap(); rec.guard = function () { return snap() !== initial; };
    function setErr(name, msg) {
      var f = form.elements[name], e = form.querySelector('#e_' + name); if (!f || !e) return;
      e.textContent = msg || ''; if (msg) f.setAttribute('aria-invalid', 'true'); else f.removeAttribute('aria-invalid');
      f.closest('.ios-field').classList.toggle('bad', !!msg);
    }
    form.addEventListener('input', function (e) { if (e.target.name && e.target.getAttribute('aria-invalid')) setErr(e.target.name, ''); });
    form.addEventListener('submit', function (e) {
      e.preventDefault(); var d = {}, bad = null;
      o.fields.forEach(function (x) { var el = form.elements[x.name]; if (!el) return; d[x.name] = String(el.value || '').trim(); setErr(x.name, ''); });
      o.fields.forEach(function (x) {
        if (x.req && !d[x.name]) { setErr(x.name, x.label + ' is needed'); bad = bad || x.name; }
        else if (x.type === 'datetime-local' && d[x.name] && isNaN(new Date(d[x.name]).getTime())) { setErr(x.name, 'Pick a date and time'); bad = bad || x.name; }
      });
      if (!bad && o.validate) { var errs = o.validate(d) || {}; Object.keys(errs).forEach(function (k) { setErr(k, errs[k]); bad = bad || k; }); }
      if (bad) { N.haptic('heavy'); var f = form.elements[bad]; if (f) { f.focus(); } return; }
      closeSheet(rec); o.onSubmit(d);
    });
    var dz = form.querySelector('[data-destroy]');
    if (dz) dz.addEventListener('click', function () { U.confirmModal({ title: o.destructive.label + '?', body: o.destructive.body || '', cta: o.destructive.label, danger: true, onOk: function () { closeSheet(rec); o.destructive.run(); U.toast('Removed'); } }); });
    return rec.sheet;
  };
  U.confirmModal = function (o) {
    var rec = mountSheet(h`<div class="ios-actionsheet"><div class="ios-list"><div class="ios-as-msg"><strong>${o.title}</strong>${o.body ? h`<span>${o.body}</span>` : ''}</div><button type="button" class="ios-as-btn ${o.danger ? 'danger' : ''}" data-ok>${o.cta || 'Confirm'}</button></div><div class="ios-list"><button type="button" class="ios-as-btn bold" data-close>${o.cancel || 'Cancel'}</button></div></div>`.s, 'action', o.title);
    if (o.onCancel) rec.onClose = function () { if (!rec.ok) o.onCancel(); };
    var ok = rec.sheet.querySelector('[data-ok]');
    ok.addEventListener('click', function () { rec.ok = true; N.haptic(o.danger ? 'success' : 'light'); closeSheet(rec); o.onOk(); });
    /* Action sheets put focus on Cancel (safe default) so Enter never deletes by accident */
    var cancel = rec.sheet.querySelector('[data-close]'); if (cancel) cancel.focus({ preventScroll: true });
  };

  /* The shared binder re-renders on 'change' for data-rerender inputs. A blur-triggered change would fire mid-render, so skip it for search. */
  document.addEventListener('change', function (e) { if (e.target.matches && e.target.matches('input[type=search]')) e.stopImmediatePropagation(); }, true);
  /* Return in the search field closes the keyboard, like iOS */
  document.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.matches && e.target.matches('input[type=search]')) { e.preventDefault(); e.target.blur(); } });

  /* =====================================================================
     DOM morph: patch the live tree to match new markup, keeping nodes that match.
     Focused fields keep their typed value; checkboxes and selects take the new state.
     ===================================================================== */
  function keyOf(n) { return n.nodeType === 1 ? (n.getAttribute('data-key') || n.id || n.getAttribute('data-ctx') || '') : ''; }
  function same(a, b) { return a.nodeType === b.nodeType && (a.nodeType !== 1 || (a.nodeName === b.nodeName && keyOf(a) === keyOf(b) && (a.nodeName !== 'INPUT' || a.type === b.type))); }
  function morphAttrs(a, b) {
    var i, at;
    for (i = a.attributes.length - 1; i >= 0; i--) { at = a.attributes[i]; if (!b.hasAttribute(at.name)) a.removeAttribute(at.name); }
    for (i = 0; i < b.attributes.length; i++) { at = b.attributes[i]; if (a.getAttribute(at.name) !== at.value) a.setAttribute(at.name, at.value); }
  }
  function morphNode(a, b) {
    if (a.nodeType !== 1) { if (a.nodeValue !== b.nodeValue) a.nodeValue = b.nodeValue; return; }
    /* Live UI state the markup does not know about: a swiped-open (or mid-drag) row keeps its class and offset */
    var cl = a.classList, swOpen = cl.contains('ios-swipe') && cl.contains('open'),
      swRow = cl.contains('ios-row') && a.parentNode && a.parentNode.classList && a.parentNode.classList.contains('ios-swipe') && a.style.transform ? a.getAttribute('style') : null,
      swTab = swOpen ? [].map.call(a.querySelectorAll('.ios-swipe-actions button'), function (x) { return x.tabIndex; }) : null;
    morphAttrs(a, b);
    if (swOpen) a.classList.add('open');
    if (swRow != null) a.setAttribute('style', swRow);
    if (swTab) setTimeout(function () { [].forEach.call(a.querySelectorAll('.ios-swipe-actions button'), function (x, i) { if (swTab[i] != null) x.tabIndex = swTab[i]; }); }, 0);
    var focused = a === document.activeElement;
    if (a.nodeName === 'TEXTAREA') { if (!focused && a.value !== b.textContent) { a.value = b.textContent; } return; }
    if (a.nodeName === 'INPUT') {
      if (a.type === 'checkbox' || a.type === 'radio') { var c = b.hasAttribute('checked'); if (a.checked !== c) a.checked = c; }
      else if (a.type !== 'file' && !focused) { var v = b.getAttribute('value') || ''; if (a.value !== v) a.value = v; }
      return;
    }
    morphChildren(a, b);
    if (a.nodeName === 'SELECT') { var si = -1; [].forEach.call(b.options, function (o, k) { if (o.hasAttribute('selected')) si = k; }); if (si >= 0 && a.selectedIndex !== si) a.selectedIndex = si; }
  }
  function morphChildren(from, to) {
    var fc = from.firstChild, tc = to.firstChild;
    while (tc) {
      var tn = tc.nextSibling;
      if (fc && same(fc, tc)) { morphNode(fc, tc); fc = fc.nextSibling; }
      else {
        var k = keyOf(tc), found = null;
        if (k) for (var x = fc ? fc.nextSibling : null; x; x = x.nextSibling) if (same(x, tc)) { found = x; break; }
        if (found) { from.insertBefore(found, fc); morphNode(found, tc); }
        else from.insertBefore(tc, fc);
      }
      tc = tn;
    }
    while (fc) { var n = fc.nextSibling; from.removeChild(fc); fc = n; }
  }
  var tpl = document.createElement('template');
  function morphHTML(el, html) { tpl.innerHTML = html; morphChildren(el, tpl.content); tpl.innerHTML = ''; }

  /* =====================================================================
     Router and persistent shell
     ===================================================================== */
  var ROUTES = [['/', home], ['/levels', levels], ['/resources', resources], ['/resources/:id', resourceDetail], ['/about', about]];
  function notFound() { return { title: 'Not found', html: h`${large('Not found', 'That page is not in Folio.')}<div class="ios-body"><div class="ios-sec"><a class="ios-btn" href="#/">Go to Home</a></div></div>` }; }
  function parse(hash) {
    var hs = (hash == null ? location.hash : hash).replace(/^#/, '') || '/', qi = hs.indexOf('?'), path = qi < 0 ? hs : hs.slice(0, qi), q = {};
    if (path.length > 1) path = path.replace(/\/+$/, '');
    if (qi >= 0) hs.slice(qi + 1).split('&').forEach(function (kv) { var x = kv.split('='); try { q[x[0]] = decodeURIComponent(x[1] || ''); } catch (e) {} });
    return { path: path || '/', q: q };
  }
  function build(loc) {
    for (var i = 0; i < ROUTES.length; i++) {
      var keys = [], re = new RegExp('^' + ROUTES[i][0].replace(/:(\w+)/g, function (_, k) { keys.push(k); return '([^/]+)'; }) + '$'), m = re.exec(loc.path);
      if (m) { var p = {}; keys.forEach(function (k, j) { try { p[k] = decodeURIComponent(m[j + 1]); } catch (e) { p[k] = m[j + 1]; } }); return ROUTES[i][1](p, loc.q, loc); }
    }
    return notFound();
  }

  var appEl = document.getElementById('app'), navEl, navL, navT, navR, stage, tabsEl, bubble, tabLinks, lvHost;
  var cur = null, leaving = [], scrollMem = {}, tabMem = {}, lastIdx = -1, prevPath = parse().path, curOut = null;
  F.ui._dir = '';
  function mountShell() {
    appEl.innerHTML = h`<div class="ios-app">
      <header class="ios-nav" id="ios-nav"><div class="ios-nav-l"></div><div class="ios-nav-t" aria-hidden="true"></div><div class="ios-nav-r"></div></header>
      <div class="ios-stage"></div>
      <div class="ios-tabfade" aria-hidden="true"></div>
      <nav class="ios-tabs glass" aria-label="Main"><span class="ios-bubble" aria-hidden="true"></span>${TABS.map(function (t) { return h`<a href="#${t[0]}" data-tab="${t[0]}"><span class="ios-ti"></span><span class="ios-tl">${t[1]}</span></a>`; })}</nav>
      <div class="ios-lvhost"></div></div>`.s;
    navEl = appEl.querySelector('.ios-nav'); navL = navEl.querySelector('.ios-nav-l'); navT = navEl.querySelector('.ios-nav-t'); navR = navEl.querySelector('.ios-nav-r');
    stage = appEl.querySelector('.ios-stage'); tabsEl = appEl.querySelector('.ios-tabs'); bubble = tabsEl.querySelector('.ios-bubble');
    tabLinks = [].slice.call(tabsEl.querySelectorAll('a')); lvHost = appEl.querySelector('.ios-lvhost');
  }
  function setTabs(path) {
    var root = rootOf(path), idx = tabIndex(root), dot = unread() > 0 && root !== '/';
    tabLinks.forEach(function (a, i) {
      var on = i === idx; if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
      var ti = a.firstChild, html = tabIcon(TABS[i][2], on) + (i === 0 && dot ? '<i class="ios-tabdot">' + U.star(11).s + '</i>' : '');
      if (ti._h !== html) { ti.innerHTML = html; ti._h = html; }
      var lbl = TABS[i][1] + (i === 0 && dot ? ', new note from your care team' : ''); if (a.getAttribute('aria-label') !== lbl) { if (i === 0 && dot) a.setAttribute('aria-label', lbl); else a.removeAttribute('aria-label'); }
    });
    moveBubble(idx);
  }
  function moveBubble(idx) { if (idx !== lastIdx) { bubble.style.setProperty('--i', idx); lastIdx = idx; } }
  function setNav(out, animate) {
    var back = out.back;
    morphHTML(navL, back ? h`<a class="ios-back" href="${back.href}" aria-label="Back to ${back.label}"><span class="ios-gbtn glass"><svg width="12" height="20" viewBox="0 0 12 20" fill="none" stroke="currentColor" stroke-width="2.600" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 2L2 10l8 8"/></svg></span><span class="ios-back-l">${back.label}</span></a>`.s : '');
    var t = out.navTitle || out.title || ''; if (navT.textContent !== t) navT.textContent = t;
    morphHTML(navR, out.navRight ? out.navRight.s : '');
    if (animate) { navEl.classList.remove('nfade'); void navEl.offsetWidth; navEl.classList.add('nfade'); }
  }
  var navTick = false;
  function updateNav() {
    navTick = false; if (!cur || !navEl) return;
    var t = cur.el.querySelector('.ios-large h1, .ios-profile h1');
    var col = !t || t.getBoundingClientRect().bottom < navEl.getBoundingClientRect().bottom + 2;
    if (navEl.classList.contains('col') !== col) navEl.classList.toggle('col', col);
  }
  document.addEventListener('scroll', function (e) { if (cur && e.target === cur.el && !navTick) { navTick = true; requestAnimationFrame(updateNav); } }, true);

  function makePage(out, path) {
    var pg = document.createElement('main'); pg.className = 'ios-scroll'; pg.tabIndex = -1; pg.dataset.path = path;
    pg.innerHTML = '<div class="ios-screen">' + out.html.s + '</div>'; return pg;
  }
  /* Finish any page animation still running (a new tap interrupts it cleanly) */
  function settle(keepCur) {
    leaving.forEach(function (x) { x.el.remove(); }); leaving = [];
    if (cur && !keepCur) { cur.el.className = 'ios-scroll'; cur.el.style.transform = ''; cur.el.style.transition = ''; }
  }
  function transition(oldEl, newEl, dir, swipe) {
    if (!oldEl) return;
    if (N.reduced() || !dir || dir === 'swap') { oldEl.remove(); return; }
    var rec = { el: oldEl }; leaving.push(rec);
    oldEl.removeAttribute('id'); oldEl.setAttribute('inert', ''); oldEl.setAttribute('aria-hidden', 'true');
    var done = false;
    function end() { if (done) return; done = true; oldEl.remove(); leaving = leaving.filter(function (r) { return r !== rec; }); if (cur && cur.el === newEl) { newEl.className = 'ios-scroll'; newEl.style.transform = ''; newEl.style.transition = ''; } }
    if (swipe) {
      /* Finish an interactive swipe-back from where the finger let go */
      var ease = 'transform .3s cubic-bezier(.2,.8,.2,1)'; oldEl.style.transition = ease; newEl.style.transition = ease;
      requestAnimationFrame(function () { oldEl.style.transform = 'translateX(100%)'; newEl.style.transform = 'translateX(0)'; });
      setTimeout(end, 340); return;
    }
    var map = { push: ['pg-in-r', 'pg-out-l'], pop: ['pg-in-l', 'pg-out-r'], tab: ['pg-fade-in', 'pg-fade-out'] }[dir] || ['pg-fade-in', 'pg-fade-out'];
    oldEl.classList.add('tr', map[1]); newEl.classList.add('tr', map[0]);
    oldEl.addEventListener('animationend', function (e) { if (e.target === oldEl) end(); });
    setTimeout(end, 650);
  }
  var firstRender = true;
  /* mode: 'nav' (route changed), 'swap' (rebuild without motion), anything falsy (patch in place) */
  function render(mode, dirIn) {
    if (!navEl) mountShell();
    var loc = parse(), out = build(loc), p = me(), isNav = mode === 'nav' || mode === 'swap' || !cur || cur.path !== loc.path;
    if (isNav) {
      var dir = mode === 'swap' || firstRender ? '' : dirIn || 'tab';
      var swipe = F.ui._swipe; F.ui._swipe = null;
      settle(!!swipe);
      var old = cur;
      if (old) scrollMem[old.path] = old.el.scrollTop;
      var pg;
      if (swipe && swipe.path === loc.path && swipe.under && swipe.under.parentNode === stage) { pg = swipe.under; morphChildren(pg.firstChild, tplFrag(out.html.s)); pg.removeAttribute('inert'); pg.removeAttribute('aria-hidden'); }
      else {
        pg = makePage(out, loc.path); if (swipe && swipe.under) swipe.under.remove(); swipe = null;
        if (old && dir === 'pop') stage.insertBefore(pg, old.el); else stage.appendChild(pg);
      }
      if (old) old.el.removeAttribute('id');
      pg.id = 'main';
      cur = { el: pg, path: loc.path };
      var keep = (dir === 'pop' || dir === 'tab') && scrollMem[loc.path];
      pg.scrollTop = keep ? scrollMem[loc.path] : 0;
      if (dir && dir !== 'swap' && !N.reduced()) { pg.classList.add('anim'); setTimeout(function () { if (pg.classList) pg.classList.remove('anim'); }, 1400); }
      transition(old && old.el, pg, dir, swipe);
      setNav(out, !!old && !!dir && !N.reduced());
      tabMem[rootOf(loc.path)] = loc.path;
      document.title = (out.title ? out.title + ' · ' : '') + 'Folio';
      /* Move focus to the new screen's heading for screen readers, without scrolling */
      var h1 = pg.querySelector('h1'); if (!firstRender && h1) { try { h1.focus({ preventScroll: true }); } catch (e) {} }
    } else {
      morphChildren(cur.el.firstChild, tplFrag(out.html.s));
      setNav(out, false);
    }
    setTabs(loc.path);
    setCelebrate(p);
    curOut = out;
    updateBadge(); updateNav();
    if (isNav && loc.path === '/') setTimeout(function () { if (parse().path === '/' && unread() > 0) markSeen(); }, 2500);
    if (out.after) out.after(loc, isNav);
    firstRender = false;
    /* Hook for add-ons: fires after every route render and every in-place patch. Listeners must not re-render. */
    try { document.dispatchEvent(new CustomEvent('folio:rendered', { detail: { route: loc.path, isNav: isNav, page: cur.el } })); } catch (e) {}
  }
  function tplFrag(html) { var t = document.createElement('template'); t.innerHTML = html; return t.content; }
  F.rerender = function (isNav) { render(isNav ? 'swap' : false); };

  function setCelebrate(p) {
    var c = p.celebrate, had = !!lvHost.firstChild;
    if (!c) { if (had) { lvHost.innerHTML = ''; [navEl, stage, tabsEl].forEach(function (x) { x.removeAttribute('inert'); }); if (!topSheet()) appEl.removeAttribute('inert'); var t = cur && cur.el.querySelector('h1'); if (t) { var keep = N.scrollSnapshot(); t.focus({ preventScroll: true }); keep(); } } return; }
    morphHTML(lvHost, celebrate(p, c).s);
    [navEl, stage, tabsEl].forEach(function (x) { x.setAttribute('inert', ''); });
    if (!had) {
      var L = c === 'transfer' ? sel.level(10) : sel.level(c);
      prepLevel(p, L); N.haptic('success');
      setTimeout(function () { var b = lvHost.querySelector('[data-action="closeCelebrate"]'); if (b && !topSheet()) b.focus({ preventScroll: true }); }, 50);
    }
  }

  window.addEventListener('hashchange', function () {
    saveWantNow();
    var np = parse().path, d = depth(np), o = depth(prevPath);
    var dir = F.ui._dir || (rootOf(np) !== rootOf(prevPath) ? 'tab' : d > o ? 'push' : d < o ? 'pop' : 'tab');
    F.ui._dir = ''; prevPath = np;
    N.closeSwipes(); if (N.contextOpen()) N.closeContext(true);
    render('nav', dir);
  });
  S.sub(function () { render(false); });

  /* ---------- Taps: tab bar, links ---------- */
  document.addEventListener('click', function (e) {
    if (!e.isTrusted && e.target.closest && e.target.closest('[data-haptic]')) return;
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button > 0) return;
    var tab = e.target.closest('.ios-tabs a');
    if (tab) {
      e.preventDefault();
      var root = tab.getAttribute('data-tab'), path = parse().path, i = tabIndex(root);
      if (rootOf(path) === root) {
        if (path !== root) { N.haptic('light'); N.navigate('#' + root, 'pop'); return; } /* pop to the tab's first screen */
        if (cur && cur.el.scrollTop > 0) cur.el.scrollTo({ top: 0, behavior: N.reduced() ? 'auto' : 'smooth' });
        return;
      }
      N.haptic('light'); moveBubble(i); /* the bubble starts moving on the tap, before the new screen renders */
      N.navigate('#' + (tabMem[root] || root), 'tab'); return;
    }
    var a = e.target.closest('a[href^="#/"]'); if (!a || a.target === '_blank' || a.closest('.ios-sheet-wrap') || a.closest('.ios-ctx')) return;
    var href = a.getAttribute('href'), np = parse(href).path; e.preventDefault();
    if (np === parse().path) return;
    var d = depth(np), o = depth(parse().path);
    N.navigate(href, rootOf(np) !== rootOf(parse().path) ? 'tab' : d > o ? 'push' : d < o ? 'pop' : 'tab');
  });
  document.addEventListener('change', function (e) { if (e.target.matches && e.target.matches('input[type=checkbox][role=switch]')) N.haptic('light'); });

  /* ---------- Swipe from the left edge to go back (interactive, like UINavigationController) ---------- */
  var sb = null;
  document.addEventListener('touchstart', function (e) {
    sb = null; if (topSheet() || N.contextOpen() || !cur || e.touches.length > 1 || (lvHost && lvHost.firstChild)) return;
    var back = navL.querySelector('.ios-back'); if (!back) return;
    var t = e.touches[0], d = document.getElementById('device').getBoundingClientRect(); if (t.clientX - d.left > 24) return;
    settle();
    sb = { x: t.clientX, y: t.clientY, dx: 0, t0: Date.now(), href: back.getAttribute('href'), on: false, w: d.width, el: cur.el };
    document.addEventListener('touchmove', sbMove, { passive: false }); /* only while an edge swipe may be starting */
  }, { passive: true });
  function sbMove(e) {
    if (!sb) return; var t = e.touches[0], dx = t.clientX - sb.x, dy = t.clientY - sb.y;
    if (!sb.on) {
      if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { sb = null; return; }
      if (dx < 10) return;
      var loc = parse(sb.href), under = makePage(build(loc), loc.path);
      under.classList.add('tr', 'peek'); under.setAttribute('inert', ''); under.setAttribute('aria-hidden', 'true'); stage.insertBefore(under, sb.el);
      under.scrollTop = scrollMem[loc.path] || 0; sb.under = under; sb.path = loc.path; sb.on = true; sb.el.classList.add('tr', 'dragging');
    }
    if (e.cancelable) e.preventDefault();
    var x = Math.max(0, dx); sb.dx = x; sb.el.style.transform = 'translateX(' + x + 'px)'; sb.under.style.transform = 'translateX(' + (-30 * (1 - x / sb.w)) + '%)';
  }
  function endBack(cancel) {
    document.removeEventListener('touchmove', sbMove, { passive: false });
    if (!sb) return; var s = sb; sb = null; if (!s.on) return;
    var v = s.dx / Math.max(1, Date.now() - s.t0), go = !cancel && (s.dx > s.w * .35 || (v > .45 && s.dx > 40));
    if (go) { F.ui._swipe = { under: s.under, path: s.path }; s.el.classList.remove('dragging'); N.navigate(s.href, 'pop'); return; }
    var ease = 'transform .28s cubic-bezier(.2,.8,.2,1)'; s.el.style.transition = ease; s.under.style.transition = ease;
    s.el.style.transform = ''; s.under.style.transform = 'translateX(-30%)';
    setTimeout(function () { s.under.remove(); s.el.style.transition = ''; s.el.classList.remove('tr', 'dragging'); }, 300);
  }
  document.addEventListener('touchend', function () { endBack(false); });
  document.addEventListener('touchcancel', function () { endBack(true); });

  /* Keep a focused field visible above the keyboard (the page scrolls, not the window) */
  /* Only the field's own scroller moves (sheet or page). scrollIntoView also scrolled the window, which fought iOS's own pan. */
  function revealField() {
    var el = document.activeElement; if (!el || !el.matches || !el.matches('input:not([type=checkbox]):not([type=file]),textarea')) return;
    var box = el.closest('.ios-sheet, .ios-scroll'); if (!box) return;
    var b = box.getBoundingClientRect(), r = el.getBoundingClientRect(), head = box.querySelector(':scope > .ios-sheet-head, :scope form > .ios-sheet-head');
    var topLimit = b.top + (head ? head.offsetHeight : 60) + 8, botLimit = b.bottom - 24;
    if (r.top >= topLimit && r.bottom <= botLimit) return;
    var delta = r.top < topLimit ? r.top - topLimit : Math.min(r.bottom - botLimit, r.top - topLimit);
    box.scrollTo({ top: box.scrollTop + delta, behavior: N.reduced() ? 'auto' : 'smooth' });
  }
  document.addEventListener('focusin', function (e) { if (e.target.matches && e.target.matches('input:not([type=checkbox]):not([type=file]),textarea')) setTimeout(revealField, 380); });
  var kbT = null; window.addEventListener('folio:kb', function () { clearTimeout(kbT); kbT = setTimeout(revealField, 120); });

  /* ---------- Context menus and swipe actions ---------- */
  try { if (window.CSS && CSS.supports && CSS.supports('-webkit-appearance', 'switch')) document.documentElement.classList.add('nsw'); } catch (e) {}
  var LISTS = { contact: 'contacts', team: 'careTeam', link: 'links' };
  function findItem(kind, id) { var l = LISTS[kind]; return l ? me()[l].filter(function (x) { return x.id === id; })[0] : null; }
  function editItem(kind, id) { var fake = { dataset: { id: id } }; (kind === 'contact' ? F.actions.editContact : kind === 'team' ? F.actions.editTeam : F.actions.editLink)(fake); }
  function removeItem(kind, id) {
    var it = findItem(kind, id); if (!it) return;
    U.confirmModal({ title: 'Remove ' + (it.name || it.title) + '?', body: 'You can add it again later.', cta: 'Remove', danger: true, onOk: function () { A.remove(me().id, LISTS[kind], id); U.toast('Removed'); } });
  }
  N.resolveContext = function (el) {
    var parts = (el.dataset.ctx || '').split(':'), kind = parts[0], id = parts[1];
    if (kind === 'resource') return [{ label: 'Open', icon: ic('arrow', 18), run: function () { N.navigate('#/resources/' + id, 'push'); } }, { label: 'Share', icon: shareSvg, run: function () { F.actions.shareResource({ dataset: { id: id } }); } }];
    var it = findItem(kind, id); if (!it) return null; var items = [];
    if (kind === 'link') { var c = cleanUrl(it.url); if (c.v) items.push({ label: 'Open link', icon: ic('ext', 18), run: function () { window.open(c.v, '_blank', 'noopener'); } }); items.push({ label: 'Share link', icon: shareSvg, run: function () { N.shareText({ title: it.title, text: it.title, url: c.v || '' }); } }); }
    else if (it.phone) { var tel = it.phone.replace(/[^\d+]/g, ''); items.push({ label: 'Call', icon: ic('phone', 18), run: function () { location.href = 'tel:' + tel; } }); items.push({ label: 'Message', icon: ic('message', 18), run: function () { location.href = 'sms:' + tel; } }); }
    items.push({ label: 'Edit', icon: xi('pencil', 18), run: function () { editItem(kind, id); } });
    items.push({ label: 'Remove', icon: ic('trash', 18), danger: true, run: function () { removeItem(kind, id); } });
    return items;
  };
  N.onSwipe = function (ctx, act) { var parts = ctx.split(':'); if (act === 'edit') editItem(parts[0], parts[1]); else removeItem(parts[0], parts[1]); };

  /* ---------- Start ---------- */
  render('nav', '');

  /* Service worker with an in-app "update ready" prompt */
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    var hadController = !!navigator.serviceWorker.controller, shown = false;
    navigator.serviceWorker.register('sw.js').then(function (reg) {
      document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') reg.update().catch(function () {}); });
    }).catch(function () {});
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (!hadController || shown) { hadController = true; return; } shown = true;
      var box = document.getElementById('toasts'); if (!box) return;
      var b = document.createElement('button'); b.type = 'button'; b.className = 'toast ios-update'; b.innerHTML = '<span>A new version of Folio is ready. <b>Tap to update</b></span>';
      b.addEventListener('click', function () { saveWantNow(); location.reload(); }); box.appendChild(b);
    });
  }
})(window.Folio);
