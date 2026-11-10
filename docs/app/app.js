/* Folio patient app (PWA). Same shared store as the portal, so a sign-off in the portal shows up here.
   Built to Apple's iOS Human Interface Guidelines: large-title navigation, translucent tab bar,
   inset grouped lists, bottom sheets, action sheets. Entrance animations run on navigation only. */
(function (F) {
  var h = F.UI.h, raw = F.UI.raw, esc = F.UI.esc, ic = F.UI.ic, S = F.Store, sel = S.sel, U = F.UI, A = S.act, N = F.native;
  var PKEY = 'folio.app.pid';
  function pid() { try { var v = localStorage.getItem(PKEY); if (v && sel.patient(v)) return v; } catch (e) {} return 'p1'; }
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
    updown: '<path d="M8 10l4-4 4 4M8 14l4 4 4-4"/>',
    calendar: '<rect x="4" y="5" width="16" height="15" rx="2.500"/><path d="M4 10h16M8 3v4M16 3v4"/>'
  };
  function xi(n, s) { return svg(X[n], s || 22); }
  var CHEV = raw('<svg class="ios-chev" width="9" height="15" viewBox="0 0 9 15" fill="none" stroke="currentColor" stroke-width="2.200" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1.500 1.500l6 6-6 6"/></svg>');
  function tile(inner, n, sm) { return h`<span class="ios-tile t${n} ${sm ? 'sm' : ''}" aria-hidden="true">${inner}</span>`; }
  var SKILL_ICON = { know: 'book', manage: 'clock', speak: 'message', run: 'visit', support: 'users' };
  var SKILL_RES = { know: 'r1', manage: 'r8', speak: 'r3', run: 'r7', support: 'r6' };
  var KIND_ICON = { Guide: ['book', 1], Checklist: ['visit', 2], Video: ['play', 3], Worksheet: ['edit', 5] };
  function kindTile(r) { var k = KIND_ICON[r.kind] || ['book', 1]; return tile(k[0] === 'play' ? xi('play', 22) : ic(k[0], 22), k[1]); }
  function status(st) { return h`<span class="ios-st s-${st}"><i aria-hidden="true"></i>${F.SKILL_STATUS[st]}</span>`; }

  /* ---------- Tab bar ---------- */
  var TAB_SVG = {
    home: ['<path d="M3.500 11.500L12 4l8.500 7.500V19a1.500 1.500 0 0 1-1.500 1.500h-4v-5.500h-6v5.500H5A1.500 1.500 0 0 1 3.500 19z"/>'],
    levels: ['<path d="M3 20.500V16h5v-4.500h5V7h5V3.500h3v17z"/>'],
    book: ['<path d="M4 5.500A1.500 1.500 0 0 1 5.500 4H12v16H5.500A1.500 1.500 0 0 1 4 18.500z"/><path d="M12 4h6.500A1.500 1.500 0 0 1 20 5.500v13a1.500 1.500 0 0 1-1.500 1.500H12z"/>'],
    user: ['<circle cx="12" cy="8" r="4"/><path d="M4 20.500c0-4.400 3.600-6.500 8-6.500s8 2.100 8 6.500z"/>']
  };
  function tabIcon(n, on) { return raw('<svg width="24" height="24" viewBox="0 0 24 24" fill="' + (on ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="1.700" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">' + TAB_SVG[n][0] + (on && n === 'book' ? '<path d="M12 4v16" stroke="var(--paper)" stroke-width="1.8"/>' : '') + '</svg>'); }
  var TABS = [['/', 'Home', 'home'], ['/levels', 'Levels', 'levels'], ['/resources', 'Resources', 'book'], ['/about', 'About me', 'user']];
  function rootOf(path) { return '/' + (path.split('/')[1] || ''); }
  function depth(path) { return path.split('/').filter(Boolean).length; }

  /* Direction of the next navigation, set before the router renders. Cleared after the render.
     When a view transition drives the motion (F.ui._vt), the CSS fallback animations stay off. */
  F.ui._anim = true; F.ui._dir = ''; F.ui._vt = false;
  var prevPath = (location.hash.replace(/^#/, '').split('?')[0]) || '/';
  window.addEventListener('hashchange', function () {
    var np = (location.hash.replace(/^#/, '').split('?')[0]) || '/', d = depth(np), o = depth(prevPath);
    F.ui._dir = d > o ? 'push' : d < o ? 'pop' : 'tab'; F.ui._anim = !F.ui._vt; prevPath = np;
  });

  /* Unread care-team notes drive the tab dot and the app badge */
  function seenSet() { try { return JSON.parse(localStorage.getItem('folio.seen.' + pid()) || '[]'); } catch (e) { return []; } }
  function unread() { var seen = seenSet(); return sel.notesFor(me()).filter(function (n) { return n.role === 'peds' && seen.indexOf(n.id) < 0; }).length; }
  function updateBadge() { try { N.badge(unread() + (me().celebrate ? 1 : 0)); } catch (e) {} }
  function markSeen() { var p = me(); try { localStorage.setItem('folio.seen.' + p.id, JSON.stringify(p.notes.map(function (n) { return n.id; }))); } catch (e) {} updateBadge(); }

  var shareSvg = raw('<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 15V3M8 7l4-4 4 4M7 11H5.500a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1H17"/></svg>');
  function gbtn(action, label, glyph, id) { return h`<button class="ios-gbtn glass" data-action="${action}" data-id="${id || ''}" aria-label="${label}">${glyph}</button>`; }

  function shell(out, loc) {
    var p = me(), c = p.celebrate, root = rootOf(loc.path), back = out.back, idx = 0;
    TABS.forEach(function (t, i) { if (t[0] === root) idx = i; });
    var prev = F.ui._tabPrev == null ? idx : F.ui._tabPrev, dot = unread() > 0 && root !== '/', an = F.ui._anim && !F.ui._vt;
    return h`<div class="ios-app ${an ? 'anim' : ''}">
      <header class="ios-nav" id="ios-nav">
        <div class="ios-nav-l">${back ? h`<a class="ios-back" href="${back.href}" aria-label="Back to ${back.label}"><span class="ios-gbtn glass"><svg width="12" height="20" viewBox="0 0 12 20" fill="none" stroke="currentColor" stroke-width="2.600" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 2L2 10l8 8"/></svg></span><span class="ios-back-l">${back.label}</span></a>` : ''}</div>
        <div class="ios-nav-t" aria-hidden="true">${out.navTitle || out.title}</div>
        <div class="ios-nav-r">${out.navRight || ''}</div>
      </header>
      <main id="main" class="ios-scroll" data-keep="scr" tabindex="-1"><div class="ios-screen ${an ? F.ui._dir || '' : ''}">${out.html}</div></main>
      <div class="ios-tabfade" aria-hidden="true"></div>
      <nav class="ios-tabs glass" aria-label="Main"><span class="ios-bubble" data-i="${idx}" style="--i:${prev}" aria-hidden="true"></span>${TABS.map(function (t) { var on = root === t[0]; return h`<a href="#${t[0]}" ${on ? h`aria-current="page"` : ''}><span class="ios-ti">${tabIcon(t[2], on)}${t[0] === '/' && dot ? h`<i class="ios-tabdot" aria-label="New note">${U.star(11)}</i>` : ''}</span><span>${t[1]}</span></a>`; })}</nav>
      ${c ? celebrate(p, c) : ''}</div>`;
  }

  function updateNav() {
    var nav = document.getElementById('ios-nav'), sc = document.querySelector('.ios-scroll'); if (!nav || !sc) return;
    var t = sc.querySelector('.ios-large h1, .ios-profile h1');
    var col = !t || t.getBoundingClientRect().bottom < nav.getBoundingClientRect().bottom + 2;
    nav.classList.toggle('col', col);
  }
  document.addEventListener('scroll', function (e) { if (e.target.classList && e.target.classList.contains('ios-scroll')) updateNav(); }, true);

  function route(fn) {
    return function (params, q, loc) {
      var out = fn(params, q, loc), inner = out.after;
      out.after = function (root, loc2, isNav) {
        var sc = root.querySelector('.ios-scroll');
        if (isNav) { if (sc) sc.scrollTop = 0; F.ui._anim = false; F.ui._dir = ''; var b = root.querySelector('.ios-lvlup button'); if (b) { b.focus(); N.haptic('success'); } }
        /* Glide the tab bubble and segmented thumbs from their previous position */
        var bub = root.querySelector('.ios-bubble');
        if (bub) { var to = bub.dataset.i; F.ui._tabPrev = +to; if (bub.style.getPropertyValue('--i') !== to) requestAnimationFrame(function () { requestAnimationFrame(function () { bub.style.setProperty('--i', to); }); }); }
        root.querySelectorAll('.ios-seg[data-i]').forEach(function (sg) { var t2 = sg.dataset.i; if (sg.style.getPropertyValue('--i') !== t2) requestAnimationFrame(function () { requestAnimationFrame(function () { sg.style.setProperty('--i', t2); }); }); });
        updateBadge();
        if (isNav && rootOf(loc2.path) === '/' && loc2.path === '/') setTimeout(function () { if (!location.hash.replace(/^#/, '').split('?')[0].replace('/', '')) markSeen(); }, 2500);
        updateNav(); if (inner) inner(root, loc2, isNav);
      };
      return out;
    };
  }

  /* ---------- Shared builders ---------- */
  function large(title, sub) { return h`<header class="ios-large" data-rise><h1>${title}</h1>${sub ? h`<p class="ios-sub">${sub}</p>` : ''}</header>`; }
  function sechead(icon, n, title) { return h`<h2 class="ios-gh">${tile(icon, n, true)}${title}</h2>`; }
  function stairs(n) {
    var s = ''; for (var i = 1; i <= 10; i++) s += '<i class="' + (i < n ? 'done' : i === n ? 'cur' : '') + '" style="--h:' + (22 + i * 7) + 'px;--n:' + i + '">' + (i === n ? U.star(18).s : '') + '</i>';
    return raw('<div class="ios-stairs" role="img" aria-label="Level ' + n + ' of 10">' + s + '</div>');
  }

  /* ---------- Home ---------- */
  F.actions.practise = function () {
    var p = me(), r = A.practise(p.id); N.haptic(r ? 'success' : 'light');
    U.toast(r ? 'Nice. ' + r.name + ' moved to With help. Your doctor will see it.' : 'Your care team signs skills off at your next visit.');
  };
  F.actions.showQR = function () {
    var p = me(); N.wakeWanted = true; N.wake.on();
    U.modal(h`<div class="ios-qrbox">${U.qr(p.card.token || p.folioId, 230)}</div><p>Sample code for the prototype. It is not scannable.<br>Folio ID ${sel.fid(p.folioId)}</p><button class="ios-btn sec" data-action="shareCard">${shareSvg} Share card as image</button>`, { label: 'Folio card QR code', head: 'Your Folio card', onClose: function () { N.wakeWanted = false; N.wake.off(); } });
  };
  F.actions.tapShare = function () {
    var p = me();
    if (p.card.status !== 'active') { U.toast('Your card is not active. Ask your clinic.'); return; }
    U.modal(h`<p>On a real phone, holding your card to a clinic tablet opens your care team view. For the demo, preview what the clinic sees.</p><a class="ios-btn" href="${F.cardUrl(p.card.token)}" target="_blank" rel="noopener">${ic('ext', 18)} Preview clinic view</a>`, { label: 'Tap to share', head: 'Tap to share' });
  };

  /* ---------- Sharing (Web Share with clipboard fallback). Only the Folio ID is shared, never the private tap link. ---------- */
  F.actions.shareCard = function () {
    var p = me(); N.haptic('light');
    N.cardImage(p, sel.fid(p.folioId)).then(function (f) { if (!f) { U.toast('Could not make the image'); return; } return N.shareFile(f, { title: 'My Folio card', text: 'My Folio ID is ' + sel.fid(p.folioId) + '.' }); });
  };
  F.actions.shareResource = function (el) {
    var r = S.get().resources.filter(function (x) { return x.id === el.dataset.id; })[0]; if (!r) return; N.haptic('light');
    N.shareText({ title: r.title, text: r.title + '\n\n' + r.body + '\n\nFrom Folio' });
  };
  F.actions.shareProfile = function () {
    var p = me(), own = F.SKILLS.filter(function (s2) { return p.skills[s2.id] === 'own'; }).map(function (s2) { return s2.name; }), L = sel.level(p.level); N.haptic('light');
    var t = 'Folio summary for ' + sel.full(p) + ' (age ' + p.age + ')\nCondition: ' + p.condition + '\nLevel ' + p.level + ' of 10: ' + L.name + '\nSkills on my own: ' + (own.length ? own.join(', ') : 'still building') + '\n\nWhat I want my doctor to know:\n' + p.wantDoctorKnow + (p.questions.length ? '\n\nQuestions for my next visit:\n' + p.questions.map(function (q) { return '- ' + q; }).join('\n') : '') + '\n\nFolio ID ' + sel.fid(p.folioId);
    N.shareText({ title: p.first + ' on Folio', text: t });
  };
  F.actions.shareLevel = function (el) {
    var p = me(), n = el && el.dataset && +el.dataset.id ? +el.dataset.id : p.level, L = sel.level(n); N.haptic('light');
    N.achievementImage(p, L).then(function (f) { if (!f) { U.toast('Could not make the image'); return; } return N.shareFile(f, { title: 'I reached Level ' + L.n, text: 'I reached Level ' + L.n + ': ' + L.name + ' on Folio.' }); });
  };

  /* ---------- Next visit (ticket card, calendar file with a 1 day reminder) ---------- */
  var MON3 = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], DAY3 = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  function timeStr(d) { var hr = d.getHours(); return ((hr % 12) || 12) + ':' + ('0' + d.getMinutes()).slice(-2) + (hr < 12 ? ' am' : ' pm'); }
  function countdown(d) { var days = Math.ceil((d.getTime() - Date.now()) / 864e5); return d.getTime() < Date.now() ? 'Past visit' : days <= 0 ? 'Today' : days === 1 ? 'Tomorrow' : 'in ' + days + ' days'; }
  F.actions.editVisit = function () {
    var p = me(), v = p.nextVisit || {};
    U.formModal({ title: v.iso ? 'Edit next visit' : 'Next visit', lead: 'Your saved questions are added to the calendar event.', cta: 'Save',
      fields: [{ name: 'iso', label: 'Date and time', type: 'datetime-local', value: v.iso || '', req: true }, { name: 'where', label: 'Clinic or doctor', value: v.where, req: true, ph: 'Dr. Okafor, Sample Children\'s Hospital' }, { name: 'note', label: 'Anything to remember', type: 'textarea', value: v.note }],
      destructive: v.iso ? { label: 'Remove visit', body: 'This clears it from Home.', run: function () { A.updatePatient(p.id, { nextVisit: null }); } } : null,
      onSubmit: function (d) { A.updatePatient(p.id, { nextVisit: { iso: d.iso, where: d.where, note: d.note || '' } }); N.haptic('success'); U.toast('Next visit saved'); } });
  };
  F.actions.addToCal = function () { var p = me(); if (!p.nextVisit) return; N.haptic('light'); N.openCalendar(N.ics(p.nextVisit, p.questions)); };
  function ticket(p) {
    var v = p.nextVisit;
    if (!v || !v.iso) return h`<section class="ios-sec" data-rise style="--d:2"><button class="ios-add" data-action="editVisit">${xi('calendar', 20)} Add your next visit</button></section>`;
    var d = new Date(v.iso);
    return h`<section class="ios-sec" data-rise style="--d:2" aria-label="Next visit"><div class="ios-ticket-sh"><article class="ios-ticket"><div class="stub" aria-hidden="true"><span class="m">${MON3[d.getMonth()]}</span><span class="d">${d.getDate()}</span><span class="w">${DAY3[d.getDay()]}</span></div>
      <div class="main"><div class="ios-eyebrow">Next visit · ${countdown(d)}</div><h3>${v.where}</h3><p>${timeStr(d)}${v.note ? ' · ' + v.note : ''}</p>
        <div class="ios-ticket-btns"><button class="ios-btn sm glass-btn" data-action="addToCal">${xi('calendar', 18)} Add to Calendar</button><button class="ios-gbtn glass" data-action="editVisit" aria-label="Edit next visit">${xi('pencil', 20)}</button></div></div></article></div></section>`;
  }

  function home(params, q) {
    var p = me(), L = sel.level(p.level), nx = p.level < 10 ? sel.level(p.level + 1) : null, own = sel.ownCount(p);
    var todo = F.SKILLS.filter(function (s) { return p.skills[s.id] !== 'own'; });
    var note = sel.notesFor(p).filter(function (n) { return n.role === 'peds'; })[0];
    return { title: 'Hi ' + p.first, navRight: gbtn('shareCard', 'Share my Folio card as an image', shareSvg),
      after: function (root, loc, isNav) { if (isNav && q && q.show === 'card') setTimeout(F.actions.showQR, 350); },
      html: h`
      ${large(h`Hi <em>${p.first}</em>`, 'You are building your own health team.')}
      <div class="ios-body">
        <section class="ios-index" data-rise style="--d:1" aria-label="Your level"><span class="ios-tape" aria-hidden="true"></span>
          <div class="ios-eyebrow">Your level</div>
          <div class="ios-lvl"><span class="ios-num" aria-hidden="true">${p.level}</span><div><h2>${L.name}</h2><p>${L.phase} phase · level ${p.level} of 10</p></div></div>
          <span class="ios-sr">Level ${p.level} of 10, ${L.name}</span>
          ${stairs(p.level)}
          <p class="ios-cap">${p.transferred ? 'You have moved to adult care.' : L.leads + '. ' + own + ' of 5 skills on your own.'}</p></section>
        ${ticket(p)}
        ${nx && todo.length ? h`<section class="ios-sec" data-rise style="--d:2" aria-labelledby="wk">${h`<h2 class="ios-gh" id="wk">${tile(ic('levels', 18), 4, true)}Working toward Level ${nx.n}: ${nx.name}</h2>`}
          <div class="ios-list">${todo.map(function (s, i) { return h`<a class="ios-row has-tile" href="#/resources/${SKILL_RES[s.id]}" aria-label="${s.name}, ${F.SKILL_STATUS[p.skills[s.id]]}. Learn how">${tile(ic(SKILL_ICON[s.id], 22), (i % 5) + 1)}<span class="ios-rt"><b>${s.name}</b><small>${s.sub}</small>${status(p.skills[s.id])}</span>${CHEV}</a>`; })}</div>
          <p class="ios-gf">Tap a skill to learn how.</p>
          <div style="margin-top:20px"><button class="ios-btn" data-action="practise">${xi('sparkle', 20)} Practise next skill</button></div></section>` : nx ? h`<section class="ios-sec" data-rise style="--d:2"><div class="ios-list"><div class="ios-row has-tile">${tile(ic('check', 22), 4)}<span class="ios-rt"><b>All five skills on your own</b><small>Your care team signs off at your next visit.</small></span></div></div></section>` : ''}
        ${note ? h`<section data-rise style="--d:3" aria-label="Note from your care team"><article class="ios-sticky"><span class="ios-tape b" aria-hidden="true"></span><div class="ios-eyebrow">From ${note.author} · ${U.monthYear(note.date)}</div><p>${note.text}</p><p class="ios-cap">${note.shared ? 'Shown to future care teams.' : 'Only you and your paediatric team see this.'}</p></article></section>` : ''}
        <section class="ios-pocket" data-rise style="--d:4" aria-labelledby="pk"><div class="ios-eyebrow" id="pk">My Folio card</div>
          <div class="ios-cardwrap">${U.cardFace(p, 'front')}</div>
          <div class="ios-pbtns"><button class="ios-btn glass-btn" data-action="showQR">${ic('qr', 20)} Show QR</button><button class="ios-btn glass-btn" data-action="tapShare">${ic('nfc', 20)} Tap to share</button></div>
          <p class="ios-pcap">Folio ID ${sel.fid(p.folioId)}</p></section>
      </div>` };
  }

  /* ---------- Levels ---------- */
  function levels() {
    var p = me(), L = sel.level(p.level), nx = p.level < 10 ? sel.level(p.level + 1) : null, own = sel.ownCount(p), li = '';
    for (var i = 1; i <= 10; i++) li += '<li class="' + (i < p.level ? 'done' : i === p.level ? 'cur' : '') + '" style="--h:' + (30 + i * 14) + 'px;--n:' + i + '"><span>' + i + '</span>' + (i === p.level ? U.star(20).s : '') + '</li>';
    return { title: 'Levels', navTitle: 'Level ' + p.level, navRight: gbtn('shareLevel', 'Share my level as an image', shareSvg, p.level), html: h`
      ${large(h`Level ${p.level}: <em>${L.name}</em>`, nx ? 'Here is what gets you to Level ' + nx.n + '.' : 'You are at the top level.')}
      <div class="ios-body">
        <section class="ios-stairwrap" data-rise style="--d:1" aria-label="All ten levels"><span class="ios-tape" aria-hidden="true"></span><div class="ios-eyebrow" style="color:#2D493E">Your staircase</div>
          <ol class="ios-big-stairs" aria-label="Level ${p.level} of 10">${raw(li)}</ol><p class="ios-cap" style="color:#2D493E">${L.phase} phase. ${L.leads}.</p></section>
        <section class="ios-sec" data-rise style="--d:2" aria-labelledby="sk"><h2 class="ios-gh" id="sk">${tile(ic('check', 18), 4, true)}Skills at this level</h2>
          <div class="ios-meter" role="img" aria-label="${own} of 5 skills on your own">${[1, 2, 3, 4, 5].map(function (i) { return h`<i class="${i <= own ? 'on' : ''}"></i>`; })}</div>
          <div class="ios-list" style="margin-top:12px">${F.SKILLS.map(function (s, i) { var st = p.skills[s.id]; return st !== 'own' ? h`<a class="ios-row has-tile" href="#/resources/${SKILL_RES[s.id]}" aria-label="${s.name}, ${F.SKILL_STATUS[st]}. Learn how">${tile(ic(SKILL_ICON[s.id], 22), (i % 5) + 1)}<span class="ios-rt"><b>${s.name}</b><small>${s.sub}</small>${status(st)}</span>${CHEV}</a>` : h`<div class="ios-row has-tile">${tile(ic(SKILL_ICON[s.id], 22), (i % 5) + 1)}<span class="ios-rt"><b>${s.name}</b><small>${s.sub}</small>${status(st)}</span></div>`; })}</div>
          <p class="ios-gf">${own} of 5 on your own. Your care team signs skills off in person.</p></section>
        ${nx ? h`<section class="ios-up" data-rise style="--d:3"><div class="ios-eyebrow">Up next · Level ${nx.n}</div><h3>${nx.name}</h3><p>${nx.leads}.</p><p style="margin-top:6px"><b>Unlocks:</b> ${nx.unlocks}</p></section>` : ''}
        <section class="ios-sec" data-rise style="--d:4" aria-labelledby="al"><h2 class="ios-gh" id="al">${tile(ic('levels', 18), 3, true)}All 10 levels</h2>
          <div class="ios-list">${F.LEVELS.map(function (l) { return h`<div class="ios-row" ${l.n === p.level ? h`aria-current="step"` : ''}><span class="ios-title2" style="width:1.6rem;text-align:center">${l.n}</span><span class="ios-rt"><b>${l.name}${l.n === p.level ? ' (you are here)' : ''}</b><small>${l.phase} · ${l.leads}</small></span>${l.n < p.level ? ic('check', 20) : ''}</div>`; })}</div></section>
      </div>` };
  }

  /* ---------- Resources ---------- */
  var TOPICS = ['All', 'Learn', 'Visits', 'Speaking up'];
  F.actions.rtag = function (el) { F.ui._segPrev = Math.max(0, TOPICS.indexOf(F.ui.rt)); F.ui.rt = el.dataset.v; N.haptic('light'); F.rerender(false); };
  F.actions.clearSearch = function () { F.ui.rq = ''; F.rerender(false); };
  F.actions.editLink = function (el) {
    var p = me(), it = el.dataset.id ? p.links.filter(function (x) { return x.id === el.dataset.id; })[0] : {};
    U.formModal({ title: el.dataset.id ? 'Edit link' : 'Add a link', lead: 'Doctors can open these. Folio only links to them.', fields: [{ name: 'title', label: 'Name', value: it.title, req: true }, { name: 'sub', label: 'Where it is from', value: it.sub }, { name: 'url', label: 'Link', type: 'url', value: it.url, req: true }],
      destructive: el.dataset.id ? { label: 'Remove link', body: 'Doctors will no longer see it.', run: function () { A.remove(p.id, 'links', el.dataset.id); } } : null,
      onSubmit: function (d) { d.id = el.dataset.id; A.upsert(p.id, 'links', d); U.toast('Link saved'); } });
  };
  function resources(params, q) {
    var p = me(), ui = F.ui; if (q.t && ui._rq !== q.t) ui.rt = q.t; ui._rq = q.t || '';
    var segIdx = Math.max(0, TOPICS.indexOf(ui.rt)), segPrev = ui._segPrev == null ? segIdx : ui._segPrev; ui._segPrev = segIdx;
    var term = (ui.rq || '').toLowerCase();
    var list = S.get().resources.filter(function (r) { return r.published && (ui.rt === 'All' || r.tags.indexOf(ui.rt) >= 0) && (!term || r.title.toLowerCase().indexOf(term) >= 0); });
    return { title: 'Resources', html: h`
      ${large('Resources', 'Learn it, then link what your doctor may need.')}
      <div class="ios-body">
        <div data-rise style="--d:1;display:flex;flex-direction:column;gap:16px">
          <div class="ios-search ${ui.rq ? 'has' : ''}" role="search"><label class="ios-searchbox">${ic('search', 18)}<span class="ios-sr">Search resources</span><input type="search" placeholder="Search resources" value="${ui.rq}" data-bind="rq" data-rerender autocomplete="off" autocapitalize="off" enterkeyhint="search"></label><button class="ios-cancel" data-action="clearSearch">Cancel</button></div>
          <div class="ios-sec" style="margin:0 16px"><div class="ios-seg" role="group" aria-label="Topic" style="--n:4;--i:${segPrev}" data-i="${segIdx}">${TOPICS.map(function (t) { return h`<button data-action="rtag" data-v="${t}" aria-pressed="${String(ui.rt === t)}">${t}</button>`; })}</div></div></div>
        <section class="ios-sec" data-rise style="--d:2" aria-label="Library">
          ${list.length ? h`<div class="ios-list">${list.map(function (r) { return h`<a class="ios-row has-tile" href="#/resources/${r.id}" data-ctx="resource:${r.id}">${kindTile(r)}<span class="ios-rt"><b>${r.title}</b><small>${r.kind} · ${r.mins}</small></span>${CHEV}</a>`; })}</div>` : h`<div class="ios-list"><div class="ios-row has-tile">${tile(ic('search', 22), 2)}<span class="ios-rt"><b>Nothing found</b><small>Try another topic.</small></span></div></div>`}</section>
        <section class="ios-sec" data-rise style="--d:3" aria-labelledby="ml"><h2 class="ios-gh" id="ml">${tile(ic('link', 18), 3, true)}My links · doctors can open these</h2>
          <div class="ios-list">${p.links.map(function (l, i) { return h`<div class="ios-swipe" data-ctx="link:${l.id}">${swipeTray()}<button class="ios-row has-tile" data-action="editLink" data-id="${l.id}">${tile(ic('link', 22), (i % 5) + 1)}<span class="ios-rt"><b>${l.title}</b><small>${l.sub}</small></span>${CHEV}</button></div>`; })}
            <button class="ios-row has-tile" data-action="editLink" style="color:var(--tint)">${tile(ic('plus', 22), 4)}<span class="ios-rt"><b>Add a link</b></span></button></div>
          <p class="ios-gf">Folio stores links, never health records.</p></section>
      </div>` };
  }
  function resourceDetail(params) {
    var r = S.get().resources.filter(function (x) { return x.id === params.id; })[0];
    if (!r) return { title: 'Not found', back: { href: '#/resources', label: 'Resources' }, html: h`${large('Not found')}<div class="ios-body"><div class="ios-sec"><a class="ios-btn" href="#/resources">Back to resources</a></div></div>` };
    var paras = r.body.split('. ').map(function (t, i, a) { return i < a.length - 1 ? t + '.' : t; }); var mid = Math.ceil(paras.length / 2);
    var two = [paras.slice(0, mid).join(' '), paras.slice(mid).join(' ')].filter(Boolean);
    return { title: r.title, navTitle: r.title, back: { href: '#/resources', label: 'Resources' }, navRight: gbtn('shareResource', 'Share this resource', shareSvg, r.id), html: h`
      <header class="ios-large" data-rise><h1>${r.title}</h1></header>
      <div class="ios-body">
        <div class="ios-meta" data-rise style="--d:1">${kindTile(r)}<span><b>${r.kind}</b><br><span class="ios-detail">${r.mins}</span></span></div>
        <article class="ios-read" data-rise style="--d:2"><span class="ios-tape" aria-hidden="true"></span>${two.map(function (t) { return h`<p>${t}</p>`; })}</article>
        <div class="ios-sec" data-rise style="--d:3"><a class="ios-btn sec" href="#/resources">Back to resources</a></div>
      </div>` };
  }

  /* ---------- About me ---------- */
  F.actions.saveWant = function (el) { var v = el.value.trim() || 'Nothing added yet.'; setTimeout(function () { A.updatePatient(pid(), { wantDoctorKnow: v }); U.toast('Saved'); }, 0); };
  F.actions.addQ = function () {
    var p = me();
    U.formModal({ title: 'New question', lead: 'Write it down now so you remember at the visit.', cta: 'Add', fields: [{ name: 'q', label: 'Question', type: 'textarea', req: true }], onSubmit: function (d) { A.updatePatient(p.id, { questions: p.questions.concat([d.q]) }); } });
  };
  F.actions.rmQ = function (el) { var p = me(); A.updatePatient(p.id, { questions: p.questions.filter(function (_, i) { return i !== +el.dataset.i; }) }); };
  F.actions.vis = function (el) { A.upsert(pid(), 'contacts', { id: el.dataset.id, visible: el.checked }); };
  F.actions.shareNotes = function (el) { A.updatePatient(pid(), { shareNotes: el.checked }); U.toast(el.checked ? 'Adult teams can see shared notes' : 'Notes hidden from adult teams'); };
  function personForm(list, noun, rolekey) {
    return function (el) {
      var p = me(), id = el.dataset.id, it = id ? p[list].filter(function (x) { return x.id === id; })[0] : {};
      U.formModal({ title: id ? 'Edit ' + noun : 'Add ' + noun,
        top: id ? h`<div style="display:flex;flex-direction:column;align-items:center;gap:10px;padding:4px 0 8px">${U.avatar(it, 84)}<button type="button" class="ios-nbtn" data-action="pickAvatar" data-list="${list}" data-id="${id}">Change photo</button></div>` : null,
        fields: [{ name: 'name', label: 'Name', value: it.name, req: true }, { name: rolekey, label: rolekey === 'rel' ? 'Relationship' : 'Role', value: it[rolekey], req: true }, { name: 'phone', label: 'Phone', type: 'tel', value: it.phone }],
        destructive: id && list === 'contacts' || id && list === 'careTeam' ? { label: 'Remove ' + noun, body: 'You can add them again later.', run: function () { A.remove(p.id, list, id); } } : null,
        onSubmit: function (d) { d.id = id; if (!id && list === 'contacts') d.visible = true; A.upsert(p.id, list, d); U.toast('Saved'); } });
    };
  }
  F.actions.editContact = personForm('contacts', 'family contact', 'rel');
  F.actions.editTeam = personForm('careTeam', 'care team member', 'role');
  F.actions.a11yApp = function (el) { S.a11y.set(el.dataset.k, el.checked ? el.dataset.on : el.dataset.off); };
  F.actions.install = function () { if (deferred) { deferred.prompt(); deferred = null; } };
  F.actions.asPatient = function (el) { try { localStorage.setItem(PKEY, el.value); } catch (e) {} F.rerender(true); };
  F.actions.focusStory = function () { var t = document.getElementById('story'); if (t) { t.scrollIntoView({ block: 'center', behavior: 'smooth' }); setTimeout(function () { t.focus({ preventScroll: true }); }, 350); } };

  function ring(pct) {
    var r = 32, len = Math.round(2 * Math.PI * r);
    return raw('<div class="ios-ring"><svg width="76" height="76" viewBox="0 0 76 76" aria-hidden="true"><circle cx="38" cy="38" r="' + r + '" fill="none" stroke="rgba(31,47,22,.16)" stroke-width="8"/><circle class="ios-ring-fg" cx="38" cy="38" r="' + r + '" fill="none" stroke="#395B50" stroke-width="8" stroke-linecap="round" stroke-dasharray="' + len + '" stroke-dashoffset="' + Math.round(len * (1 - pct / 100)) + '" style="--len:' + len + '"/></svg><b>' + pct + '%</b></div>');
  }
  function swipeTray() { return h`<div class="ios-swipe-actions" aria-hidden="true"><button type="button" tabindex="-1" class="edit" data-swipe-act="edit">Edit</button><button type="button" tabindex="-1" class="rm" data-swipe-act="remove">Remove</button></div>`; }
  function contactRow(c, list, rolekey, n) {
    var tel = c.phone ? c.phone.replace(/[^\d+]/g, '') : '';
    return h`<div class="ios-swipe" data-ctx="${list === 'contacts' ? 'contact' : 'team'}:${c.id}">${swipeTray()}<div class="ios-row" style="flex-direction:column;align-items:stretch;gap:10px;min-height:0">
      <div style="display:flex;align-items:center;gap:14px"><button class="ios-rowmain" data-action="${list === 'contacts' ? 'editContact' : 'editTeam'}" data-id="${c.id}" aria-label="Edit ${c.name}">${U.avatar(c, 48)}<span class="ios-rt"><b>${c.name}</b><small>${c[rolekey]}${c.phone ? ' · ' + c.phone : ''}</small></span></button>
        ${tel ? h`<span class="ios-rowtrail"><a class="ios-round" href="tel:${tel}" aria-label="Call ${c.name}">${ic('phone', 20)}</a><a class="ios-round" href="sms:${tel}" aria-label="Message ${c.name}">${ic('message', 20)}</a></span>` : ''}</div>
      ${list === 'contacts' ? h`<label style="display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:44px;padding-left:62px"><span class="ios-detail">Doctors can contact</span><input type="checkbox" role="switch" switch class="ios-sw" ${c.visible ? 'checked' : ''} data-change="vis" data-id="${c.id}" aria-label="Doctors can contact ${c.name}"></label>` : ''}</div></div>`;
  }
  var HOW_ICON = { 'Card tap (NFC)': ['nfc', '#92AFD7'], 'Card tap (QR)': ['qr', '#92AFD7'], Portal: ['eye', '#C5D1EB'] };

  function about() {
    var p = me(), a = S.a11y.get(), st = S.get();
    var log = st.access.filter(function (x) { return x.pid === p.id; }).slice().sort(function (x, y) { return x.time < y.time ? 1 : -1; }).slice(0, 5);
    var ios = /iphone|ipad|ipod/i.test(navigator.userAgent), standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    var items = [
      ['Add a photo', !!p.photo, 'pickAvatar'],
      ['Say what you want your doctor to know', p.wantDoctorKnow && p.wantDoctorKnow !== 'Nothing added yet.', 'focusStory'],
      ['Add a family contact', p.contacts.length > 0, 'editContact'],
      ['Add a care team member', p.careTeam.some(function (c) { return c.name !== 'Not added yet'; }), 'editTeam'],
      ['Link a record or resource', p.links.length > 0, 'editLink']
    ];
    var doneN = items.filter(function (x) { return x[1]; }).length, pct = Math.round(doneN / items.length * 100);
    return { title: 'About me', navTitle: sel.full(p), navRight: gbtn('shareProfile', 'Share my profile summary', shareSvg), html: h`
      <div class="ios-profile" data-rise>
        <span class="ios-av-hero">${U.avatar(p, 116)}<button class="ios-av-badge" data-action="pickAvatar" aria-label="Change profile photo">${xi('camera', 22)}</button></span>
        <h1>${sel.full(p)}</h1>
        <div class="meta">Age ${p.age} · Folio ID ${sel.fid(p.folioId)}</div>
        <span class="ios-chip">${xi('heart', 16)} ${p.condition}</span>
        <p class="ios-cap" style="margin-top:8px">Diagnosis is set by your clinic.</p>
      </div>
      <div class="ios-body" style="margin-top:28px">
        <section class="ios-complete" data-rise style="--d:1" aria-labelledby="cp"><div class="ios-complete-head">${ring(pct)}<div><h2 id="cp">${pct === 100 ? 'Profile complete' : 'Finish your profile'}</h2><p>${doneN} of ${items.length} done. Adult doctors see this when they tap your card.</p></div></div>
          <ul class="ios-checks">${items.map(function (x) { return h`<li class="${x[1] ? 'done' : ''}"><button data-action="${x[2]}" aria-label="${x[0]}${x[1] ? ', done' : ''}"><span class="box">${x[1] ? ic('check', 14) : ''}</span><span class="t">${x[0]}</span><span class="go">${CHEV}</span></button></li>`; })}</ul></section>
        <section class="ios-sec" data-rise style="--d:2" aria-labelledby="story-h"><h2 class="ios-gh" id="story-h">${tile(xi('pencil', 18), 5, true)}My story</h2>
          <div class="ios-story"><span class="ios-tape b" aria-hidden="true"></span><div class="ios-eyebrow" style="color:#2D493E;margin-bottom:8px">What I want my doctor to know</div><label class="ios-sr" for="story">What I want my doctor to know</label><textarea id="story" data-change="saveWant" placeholder="For example: I get anxious in new clinics. Please explain what you are doing as you go.">${p.wantDoctorKnow === 'Nothing added yet.' ? '' : p.wantDoctorKnow}</textarea><p class="ios-cap">Shows as "Patient: ${p.first}" to doctors.</p></div></section>
        <section class="ios-sec" data-rise style="--d:3" aria-labelledby="q-h"><h2 class="ios-gh" id="q-h">${tile(ic('message', 18), 3, true)}Questions for my next visit</h2>
          <div class="ios-qcards">${p.questions.map(function (qq, i) { return h`<div class="ios-qcard"><span aria-hidden="true">${ic('message', 20)}</span><span class="q">${qq}</span><button class="x" data-action="rmQ" data-i="${i}" aria-label="Remove question: ${qq}">${ic('x', 18)}</button></div>`; })}
            <button class="ios-add" data-action="addQ">${ic('plus', 20)} Add a question</button></div></section>
        <section class="ios-sec" data-rise style="--d:4" aria-labelledby="f-h"><h2 class="ios-gh" id="f-h">${tile(ic('users', 18), 1, true)}Family contacts</h2>
          <div class="ios-list">${p.contacts.map(function (c) { return contactRow(c, 'contacts', 'rel'); })}<button class="ios-row has-tile" data-action="editContact" style="color:var(--tint);min-height:56px">${tile(ic('plus', 22), 4, true)}<span class="ios-rt"><b>Add contact</b></span></button></div>
          <p class="ios-gf">Switch on so doctors can call or message them.</p></section>
        <section class="ios-sec" data-rise style="--d:5" aria-labelledby="c-h"><h2 class="ios-gh" id="c-h">${tile(ic('team', 18), 2, true)}Care team</h2>
          <div class="ios-list">${p.careTeam.map(function (c) { return contactRow(c, 'careTeam', 'role'); })}<button class="ios-row has-tile" data-action="editTeam" style="color:var(--tint);min-height:56px">${tile(ic('plus', 22), 4, true)}<span class="ios-rt"><b>Add care team member</b></span></button></div></section>
        <section class="ios-sec" data-rise style="--d:6" aria-labelledby="s-h"><h2 class="ios-gh" id="s-h">${tile(ic('shield', 18), 4, true)}Sharing and privacy</h2>
          <div class="ios-list"><label class="ios-row has-tile">${tile(ic('lock', 22), 3)}<span class="ios-rt"><b>Share my notes with adult care</b><small>You can change this any time.</small></span><input type="checkbox" role="switch" switch class="ios-sw" ${p.shareNotes !== false ? 'checked' : ''} data-change="shareNotes" aria-label="Share my notes with adult care"></label></div></section>
        <section class="ios-sec" data-rise style="--d:7" aria-labelledby="w-h"><h2 class="ios-gh" id="w-h">${tile(ic('eye', 18), 5, true)}Who has looked at my profile</h2>
          <div class="ios-list">${log.length ? h`<ol class="ios-timeline">${log.map(function (l) { var ho = HOW_ICON[l.how] || ['eye', '#C5D1EB']; return h`<li><span class="dot" style="--c:${ho[1]}">${ic(ho[0], 20)}</span><span class="ios-rt"><b>${l.who}</b><small>${l.how} · ${U.fmtTime(l.time)}</small></span></li>`; })}</ol>` : h`<div class="ios-row has-tile">${tile(ic('eye', 22), 2)}<span class="ios-rt"><b>No one yet</b><small>Opens are listed here.</small></span></div>`}</div></section>
        <section class="ios-sec" data-rise style="--d:8" aria-labelledby="a-h"><h2 class="ios-gh" id="a-h">${tile(ic('settings', 18), 2, true)}Display and motion</h2>
          <div class="ios-list">
            <label class="ios-row"><span class="ios-rt"><b>Increase contrast</b></span><input type="checkbox" role="switch" switch class="ios-sw" ${a.contrast === 'high' ? 'checked' : ''} data-change="a11yApp" data-k="contrast" data-on="high" data-off="normal" aria-label="Increase contrast"></label>
            <label class="ios-row"><span class="ios-rt"><b>Reduce motion</b></span><input type="checkbox" role="switch" switch class="ios-sw" ${a.motion === 'reduce' ? 'checked' : ''} data-change="a11yApp" data-k="motion" data-on="reduce" data-off="auto" aria-label="Reduce motion"></label></div>
          <p class="ios-gf">Text size follows your iPhone's Display and Text Size setting.</p></section>
        ${standalone ? '' : h`<section class="ios-sec" aria-labelledby="i-h"><h2 class="ios-gh" id="i-h">${tile(ic('plus', 18), 3, true)}Add Folio to your home screen</h2><div class="ios-list"><div class="ios-row has-tile">${tile(ic('ext', 22), 1)}<span class="ios-rt"><b>${ios ? 'Tap Share, then Add to Home Screen' : 'Install it like an app'}</b><small>It works offline too.</small></span></div>${deferred ? h`<button class="ios-row" data-action="install" style="color:var(--tint)"><b>Install Folio</b></button>` : ''}</div></section>`}
        <section class="ios-sec" aria-labelledby="d-h"><h2 class="ios-gh" id="d-h">Prototype</h2>
          <div class="ios-list"><label class="ios-row"><span class="ios-rt"><b>View the app as</b></span><select class="ios-select" data-change="asPatient" aria-label="View the app as">${st.patients.map(function (x) { return h`<option value="${x.id}" ${x.id === p.id ? 'selected' : ''}>${sel.full(x)} · Level ${x.level}</option>`; })}</select></label></div>
          <p class="ios-gf">Demo only. Switch patient to try other levels.</p></section>
      </div>` };
  }

  /* ---------- Photo picker ---------- */
  function downscale(file, cb) {
    function draw(src, w, hh) {
      var c = document.createElement('canvas'); c.width = c.height = 256; var g = c.getContext('2d'), s = Math.min(w, hh), sx = (w - s) / 2, sy = (hh - s) / 2;
      g.drawImage(src, sx, sy, s, s, 0, 0, 256, 256); cb(c.toDataURL('image/jpeg', .85));
    }
    if (window.createImageBitmap) {
      createImageBitmap(file, { imageOrientation: 'from-image' }).then(function (b) { draw(b, b.width, b.height); }, fallback);
    } else fallback();
    function fallback() {
      var im = new Image(), u = URL.createObjectURL(file); im.onload = function () { draw(im, im.naturalWidth, im.naturalHeight); URL.revokeObjectURL(u); }; im.onerror = function () { U.toast('Could not read that photo'); }; im.src = u;
    }
  }
  function saveAvatar(f) {
    var t = F.ui._avt || {}, p = me();
    if (t.list && t.id) A.upsert(p.id, t.list, Object.assign({ id: t.id }, f)); else A.updatePatient(p.id, f);
  }
  F.actions.pickAvatar = function (el) {
    var p = me(), t = { list: el && el.dataset ? el.dataset.list : '', id: el && el.dataset ? el.dataset.id : '' }; F.ui._avt = t;
    var tgt = t.list ? p[t.list].filter(function (x) { return x.id === t.id; })[0] : p, ids = F.AVATARS || [];
    U.modal(h`<div class="ios-sheet-head"><span></span><h2>Choose a photo</h2><button class="ios-nbtn bold" data-close>Done</button></div>
      <div class="ios-form">
        <div class="ios-list">
          <label class="ios-row has-tile" for="ph-cam" style="cursor:pointer">${tile(xi('camera', 22), 1)}<span class="ios-rt"><b>Take photo</b></span>${CHEV}</label>
          <label class="ios-row has-tile" for="ph-lib" style="cursor:pointer">${tile(ic('book', 22), 3)}<span class="ios-rt"><b>Choose from library</b></span>${CHEV}</label></div>
        <input id="ph-cam" type="file" accept="image/*" capture="user" class="ios-sr" data-change="photoFile" tabindex="-1"><input id="ph-lib" type="file" accept="image/*" class="ios-sr" data-change="photoFile" tabindex="-1">
        <div><h3 class="ios-gh" style="margin-left:4px">Or pick a character</h3><div class="ios-avgrid" role="group" aria-label="Characters">${ids.map(function (id) { return h`<button data-action="usePreset" data-id="${id}" aria-pressed="${String(tgt.avatar === id && !tgt.photo)}" aria-label="Character ${id.replace('a', '')}">${U.avatar({ avatar: id }, 68)}</button>`; })}</div></div>
        ${tgt.photo || tgt.avatar ? h`<div class="ios-list"><button class="ios-row destructive" data-action="removePhoto" style="justify-content:center"><b>Remove photo</b></button></div>` : ''}
      </div>`, { label: 'Choose a photo' });
  };
  F.actions.photoFile = function (el) {
    var f = el.files && el.files[0]; if (!f) return;
    downscale(f, function (url) { saveAvatar({ photo: url, avatar: '' }); U.closeModal(); U.toast('Photo updated'); });
  };
  F.actions.usePreset = function (el) { saveAvatar({ avatar: el.dataset.id, photo: '' }); U.closeModal(); U.toast('Character chosen'); };
  F.actions.removePhoto = function () {
    U.confirmModal({ title: 'Remove photo?', body: 'Your initial will show instead.', cta: 'Remove Photo', danger: true, onOk: function () { saveAvatar({ photo: '', avatar: '' }); closeAll(); U.toast('Photo removed'); } });
  };

  /* ---------- Level-up ---------- */
  function celebrate(p, c) {
    var transfer = c === 'transfer', L = transfer ? sel.level(10) : sel.level(c), cols = ['#92AFD7', '#E9DCC3', '#F0E3CE', '#C5D1EB', '#5A7684'], bits = '';
    for (var i = 0; i < 22; i++) bits += '<i style="left:' + Math.round(Math.random() * 100) + '%;background:' + cols[i % 5] + ';animation-duration:' + (2.4 + Math.random() * 2.4).toFixed(1) + 's;animation-delay:' + (Math.random() * 1.4).toFixed(1) + 's"></i>';
    return h`<div class="ios-lvlup" role="dialog" aria-modal="true" aria-label="Level up"><div class="ios-confetti" aria-hidden="true">${raw(bits)}</div>
      <button class="ios-gbtn glass ios-lv-share" data-action="shareLevel" data-id="${L.n}" aria-label="Share my achievement as an image">${shareSvg}</button>
      <div class="ios-stackviz" aria-hidden="true"><i></i><i></i><i></i>${U.star(34)}</div>
      <div class="ios-eyebrow" style="color:#C5D1EB">${transfer ? 'Final sign-off' : 'Level up'}</div>
      <h2>${transfer ? 'You own it' : 'Level ' + L.n + ': ' + L.name}</h2>
      <p>${transfer ? 'Your adult team has what they need, and you decide who sees what.' : 'You and your care team now: ' + L.leads.toLowerCase() + '.'}</p>
      <div class="stamp" role="img" aria-label="Signed off by ${p.levelSignoff.by}">${U.star(22)}<span>Signed off</span></div>
      <div class="ios-changed"><div class="ios-eyebrow" style="color:#C5D1EB">What changed</div><ul><li>${p.levelSignoff.by} signed off, ${U.monthYear(p.levelSignoff.date)}</li><li>Unlocked: ${L.unlocks}</li></ul></div>
      <button class="ios-btn light" style="max-width:340px" data-action="closeCelebrate">Continue</button></div>`;
  }
  F.actions.closeCelebrate = function () { A.dismissCelebrate(pid()); };

  /* ---------- iOS sheets (replace the shared dialog helpers inside this app) ---------- */
  var sheets = [];
  function mountSheet(inner, cls, label) {
    var root = document.getElementById('modal-root'), wrap = document.createElement('div');
    wrap.className = 'ios-sheet-wrap ' + (cls || '');
    wrap.innerHTML = '<div class="ios-scrim" data-close></div><div class="ios-sheet" role="dialog" aria-modal="true" tabindex="-1" aria-label="' + esc(label || 'Sheet') + '"><div class="ios-grab" aria-hidden="true"></div>' + inner + '</div>';
    root.appendChild(wrap);
    var rec = { wrap: wrap, sheet: wrap.querySelector('.ios-sheet'), closed: false, prev: document.activeElement, onClose: null };
    N.haptic('light'); sheets.push(rec); document.getElementById('app').setAttribute('inert', '');
    dragWire(rec);
    var first = rec.sheet.querySelector('input:not([type=file]),textarea,select'); (first && cls === 'form' ? first : rec.sheet).focus({ preventScroll: true });
    return rec;
  }
  function closeSheet(rec) {
    if (!rec || rec.closed) return; rec.closed = true; rec.wrap.classList.add('out'); if (rec.onClose) { try { rec.onClose(); } catch (e) {} }
    setTimeout(function () {
      rec.wrap.remove(); sheets = sheets.filter(function (r) { return r !== rec; });
      if (!sheets.length) { document.getElementById('app').removeAttribute('inert'); if (rec.prev && document.body.contains(rec.prev)) rec.prev.focus({ preventScroll: true }); }
    }, 260);
  }
  function dragWire(rec) {
    var sh = rec.sheet, y0 = null, dy = 0, t0 = 0;
    sh.addEventListener('touchstart', function (e) {
      var head = e.target.closest('.ios-grab,.ios-sheet-head');
      if (!(head || (sh.scrollTop <= 0 && !e.target.closest('input,textarea,select')))) return;
      y0 = e.touches[0].clientY; t0 = Date.now(); dy = 0;
    }, { passive: true });
    sh.addEventListener('touchmove', function (e) { if (y0 == null) return; dy = Math.max(0, e.touches[0].clientY - y0); if (dy > 0) { sh.style.animation = 'none'; sh.style.transform = 'translateY(' + dy + 'px)'; } if (dy > 110 && !rec.det) { rec.det = 1; N.haptic('light'); } if (dy < 110) rec.det = 0; }, { passive: true });
    sh.addEventListener('touchend', function () {
      if (y0 == null) return; var v = dy / Math.max(1, Date.now() - t0); y0 = null;
      if (dy > 110 || v > .6) { sh.style.animation = ''; sh.style.transform = ''; closeSheet(rec); } else { sh.style.transition = 'transform .25s'; sh.style.transform = ''; setTimeout(function () { sh.style.transition = ''; sh.style.animation = ''; }, 260); }
    });
  }
  document.addEventListener('click', function (e) {
    var c = e.target.closest('[data-close]'); if (!c) return; var w = c.closest('.ios-sheet-wrap'); if (!w) return;
    closeSheet(sheets.filter(function (r) { return r.wrap === w; })[0]);
  });
  document.addEventListener('keydown', function (e) {
    var top = sheets[sheets.length - 1]; if (!top) return;
    if (e.key === 'Escape') { closeSheet(top); return; }
    if (e.key === 'Tab') {
      var f = top.sheet.querySelectorAll('a[href],button:not([disabled]),input:not([type=file]),select,textarea'); if (!f.length) return;
      var a = f[0], z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    }
  });
  U.modal = function (content, opts) {
    var head = opts && opts.head ? '<div class="ios-sheet-head"><span></span><h2>' + esc(opts.head) + '</h2><button type="button" class="ios-nbtn bold" data-close>Done</button></div>' : '';
    var rec = mountSheet(head + '<div class="ios-sheet-body">' + (content.s || '') + '</div>', (opts && opts.cls) || '', opts && (opts.label || opts.head)); if (opts && opts.onClose) rec.onClose = opts.onClose; return rec.sheet;
  };
  U.closeModal = function () { closeSheet(sheets[sheets.length - 1]); };
  function closeAll() { sheets.slice().forEach(closeSheet); }
  function fieldRow(x) {
    var id = 'f_' + x.name, v = x.value == null ? '' : x.value, ctl;
    if (x.type === 'select') ctl = h`<select id="${id}" name="${x.name}">${x.options.map(function (op) { return h`<option ${op === v ? 'selected' : ''}>${op}</option>`; })}</select>`;
    else if (x.type === 'textarea') ctl = h`<textarea id="${id}" name="${x.name}" rows="3" ${x.req ? 'required' : ''}>${v}</textarea>`;
    else ctl = h`<input id="${id}" name="${x.name}" type="${x.type || 'text'}" value="${v}" ${x.req ? 'required' : ''} placeholder="${x.ph || ''}" autocomplete="off" ${x.type === 'url' ? 'autocapitalize="off" inputmode="url"' : ''}>`;
    return h`<label class="ios-field" for="${id}"><span class="ios-fl">${x.label}${x.req ? '' : ' (optional)'}</span>${ctl}</label>`;
  }
  U.formModal = function (o) {
    var rec = mountSheet(h`<form class="ios-form" novalidate><div class="ios-sheet-head"><button type="button" class="ios-nbtn" data-close>Cancel</button><h2>${o.title}</h2><button class="ios-nbtn bold">${o.cta || 'Save'}</button></div>
      ${o.top || ''}${o.lead ? h`<p class="ios-cap" style="margin:0 4px">${o.lead}</p>` : ''}
      <div class="ios-list">${o.fields.map(fieldRow)}</div>
      ${o.destructive ? h`<div class="ios-list"><button type="button" class="ios-row destructive" data-destroy style="justify-content:center"><b>${o.destructive.label}</b></button></div>` : ''}</form>`.s, 'form', o.title);
    var form = rec.sheet.querySelector('form');
    form.addEventListener('submit', function (e) { e.preventDefault(); if (!form.checkValidity()) { form.reportValidity(); return; } var d = {}; new FormData(form).forEach(function (v, k) { d[k] = v; }); closeSheet(rec); o.onSubmit(d); });
    var dz = form.querySelector('[data-destroy]');
    if (dz) dz.addEventListener('click', function () { U.confirmModal({ title: o.destructive.label + '?', body: o.destructive.body || '', cta: o.destructive.label, danger: true, onOk: function () { closeSheet(rec); o.destructive.run(); U.toast('Removed'); } }); });
  };
  U.confirmModal = function (o) {
    var rec = mountSheet(h`<div class="ios-actionsheet"><div class="ios-list"><div class="ios-as-msg"><strong>${o.title}</strong>${o.body ? h`<span>${o.body}</span>` : ''}</div><button class="ios-as-btn ${o.danger ? 'danger' : ''}" data-ok>${o.cta || 'Confirm'}</button></div><div class="ios-list"><button class="ios-as-btn bold" data-close>Cancel</button></div></div>`.s, 'action', o.title);
    rec.sheet.querySelector('[data-ok]').addEventListener('click', function () { N.haptic(o.danger ? 'success' : 'light'); closeSheet(rec); o.onOk(); });
  };

  /* The shared binder re-renders on 'change' for data-rerender inputs. A blur-triggered change would fire mid-render, so skip it for search. */
  document.addEventListener('change', function (e) { if (e.target.matches && e.target.matches('input[type=search]')) e.stopImmediatePropagation(); }, true);

  /* ---------- Gestures and keyboard ---------- */
  var swipe = null;
  document.addEventListener('touchstart', function (e) {
    if (sheets.length || !document.querySelector('.ios-back')) return;
    var t = e.touches[0], d = document.getElementById('device').getBoundingClientRect();
    if (t.clientX - d.left < 24) swipe = { x: t.clientX, y: t.clientY, dx: 0, el: document.querySelector('.ios-screen') };
  }, { passive: true });
  document.addEventListener('touchmove', function (e) {
    if (!swipe) return; var t = e.touches[0]; swipe.dx = t.clientX - swipe.x;
    if (Math.abs(t.clientY - swipe.y) > Math.abs(swipe.dx) * 1.2) { swipe.el.style.transform = ''; swipe = null; return; }
    if (swipe.dx > 0) swipe.el.style.transform = 'translateX(' + swipe.dx + 'px)';
  }, { passive: true });
  document.addEventListener('touchend', function () {
    if (!swipe) return; var s = swipe; swipe = null; s.el.style.transform = '';
    if (s.dx > 80) { var b = document.querySelector('.ios-back'); if (b) N.navigate(b.getAttribute('href'), 'pop'); }
  });
  document.addEventListener('focusin', function (e) {
    if (!e.target.matches('input:not([type=checkbox]):not([type=file]),textarea')) return;
    setTimeout(function () { if (document.activeElement === e.target && e.target.scrollIntoView) e.target.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, 320);
  });
  document.addEventListener('click', function (e) {
    var a = e.target.closest('.ios-tabs a[aria-current="page"]'); if (!a) return;
    var sc = document.querySelector('.ios-scroll'); if (sc && sc.scrollTop > 0) { e.preventDefault(); sc.scrollTo({ top: 0, behavior: 'smooth' }); }
  });

  /* ---------- Native wiring: view transitions, haptics, context menus, swipe actions ---------- */
  try { if (window.CSS && CSS.supports && CSS.supports('-webkit-appearance', 'switch')) document.documentElement.classList.add('nsw'); } catch (e) {}
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button > 0) return;
    var a = e.target.closest('a[href^="#/"]'); if (!a || a.target === '_blank' || a.closest('.ios-sheet-wrap') || a.closest('.ios-ctx')) return;
    var href = a.getAttribute('href'), cur = location.hash || '#/'; if (href === cur) return;
    e.preventDefault();
    var np = href.replace(/^#/, '').split('?')[0], d = depth(np), o = depth(prevPath);
    if (a.closest('.ios-tabs')) N.haptic('light');
    N.navigate(href, d > o ? 'push' : d < o ? 'pop' : 'tab');
  });
  document.addEventListener('change', function (e) { if (e.target.matches && e.target.matches('input[type=checkbox][role=switch]')) N.haptic('light'); });

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
    if (kind === 'link') items.push({ label: 'Open', icon: ic('ext', 18), run: function () { window.open(it.url, '_blank', 'noopener'); } });
    else if (it.phone) { var tel = it.phone.replace(/[^\d+]/g, ''); items.push({ label: 'Call', icon: ic('phone', 18), run: function () { location.href = 'tel:' + tel; } }); items.push({ label: 'Message', icon: ic('message', 18), run: function () { location.href = 'sms:' + tel; } }); }
    items.push({ label: 'Share', icon: shareSvg, run: function () { N.shareText(kind === 'link' ? { title: it.title, text: it.title, url: it.url } : { title: it.name, text: it.name + (it.rel || it.role ? ', ' + (it.rel || it.role) : '') + (it.phone ? '\n' + it.phone : '') }); } });
    items.push({ label: 'Edit', icon: xi('pencil', 18), run: function () { editItem(kind, id); } });
    items.push({ label: 'Remove', icon: ic('trash', 18), danger: true, run: function () { removeItem(kind, id); } });
    return items;
  };
  N.onSwipe = function (ctx, act) { var parts = ctx.split(':'); if (act === 'edit') editItem(parts[0], parts[1]); else removeItem(parts[0], parts[1]); };

  F.UI.createApp({ name: 'Folio', shell: shell,
    routes: [['/', route(home)], ['/levels', route(levels)], ['/resources', route(resources)], ['/resources/:id', route(resourceDetail)], ['/about', route(about)]],
    notFound: function () { return { title: 'Not found', html: h`${large('Not found')}<div class="ios-body"><div class="ios-sec"><a class="ios-btn" href="#/">Home</a></div></div>` }; } });

  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(function () {});
})(window.Folio);
