/* Portal shell: binder tabs + routes. Each page lives in pages/*.js and returns {title, html}. */
(function (F) {
  var h = F.UI.h, ic = F.UI.ic, S = F.Store;
  F.Pages = F.Pages || {};

  var GROUPS = [
    ['Care', [['home', '#/', 'Home', 'home'], ['patients', '#/patients', 'Patients', 'users'], ['visit', '#/visit', 'Visit mode', 'visit'], ['add', '#/add', 'Add patient', 'plus']]],
    ['Program', [['cards', '#/cards', 'Cards', 'card'], ['levels', '#/levels', 'Levels and skills', 'levels'], ['access', '#/access', 'Access log', 'log'], ['insights', '#/insights', 'Insights', 'chart'], ['resources', '#/resources', 'Resources', 'book']]],
    ['Admin', [['team', '#/team', 'Team', 'team'], ['settings', '#/settings', 'Settings', 'settings']]]
  ];

  /* First run: a mock hospital sign-in, remembered on this device (localStorage, see memory.js) until someone logs out.
     No password field, and it says it is a prototype. */
  var M = F.Mem, U = F.UI;
  function signedIn() { var u = M.user(); return u && S.get().team.some(function (x) { return x.id === u && x.active; }) ? u : ''; }
  /* Keep the store's "me" on the signed-in person, also after Reset demo data or a change in another tab */
  function syncMe() { var u = signedIn(); if (u && S.get().me !== u) S.act.setMe(u); }
  syncMe(); S.sub(syncMe);
  function signin() {
    var st = S.get(), step = F.ui.signin || 1, team = st.team.filter(function (u) { return u.active; });
    return h`<main id="main" class="signin" data-keep="page"><div class="signin-card sec" data-step="${step}">
      <div class="signin-brand">${F.UI.wordmark()}<span>${st.clinic.org}<br><small>${st.clinic.team}</small></span></div>
      <p class="signin-step eyebrow" aria-hidden="true">Step ${step} of 2</p>
      ${step === 1 ? h`<h1>Sign in to <em class="it">Folio</em></h1><p class="muted">Use the account you use for the hospital's other systems.</p>
        <button class="btn btn-primary signin-sso" data-action="ssoStart">${ic('lock', 18)} Sign in with your ${st.clinic.org} account</button>
        <p class="small muted signin-note">Prototype: there is no real sign-in. Next, you pick whose view to see. Folio keeps you signed in on this device until you log out.</p>`
      : h`<h1>Choose whose <em class="it">view</em></h1><p class="muted" id="signin-lead">Each role sees what it needs. Pick one to see Folio as that person.</p>
        <ul class="signin-list" aria-labelledby="signin-lead">${team.map(function (u) { return h`<li><button class="signin-acct" data-action="signIn" data-id="${u.id}">${F.UI.avatar(u, 44)}<span class="grow"><b>${u.name}</b><span class="small muted">${u.title} · ${u.role}</span><span class="small">${F.ROLES[u.role] || ''}</span></span>${ic('arrow', 18)}</button></li>`; })}</ul>
        <button class="btn btn-quiet signin-back" data-action="ssoBack">${ic('back', 16)} Back</button>`}
    </div></main>`;
  }
  F.actions.ssoStart = function () { F.ui.signin = 2; F.rerender(true); };
  F.actions.ssoBack = function () { F.ui.signin = 1; F.rerender(true); };
  F.actions.signIn = function (el) { M.setUser(el.dataset.id); F.ui.signin = 1; S.act.setMe(el.dataset.id); toHome(); };
  function toHome() {
    if (location.hash && location.hash !== '#/') { try { history.replaceState(null, '', location.pathname + location.search + '#/'); } catch (e) { location.hash = '#/'; return; } }
    window.scrollTo(0, 0); F.rerender(true);
  }
  /* Log out: forget the sign-in and the one-time UI (welcome card), keep patient data. Same in Settings and the sidebar. */
  F.actions.signOut = function () {
    var me = S.sel.me();
    U.confirmModal({ title: 'Log out of Folio?', body: 'You go back to the sign-in screen on this device, and ' + me.name + "'s welcome card shows again next time. Patients, notes, cards and accessibility settings stay as they are.", cta: 'Log out', onOk: logOut });
  };
  function logOut() {
    M.forget();
    document.querySelectorAll('dialog[open]').forEach(function (d) { d.close(); });
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    toHome();
    U.toast('Logged out. Sign in to start again.');
  }
  F.logOut = logOut;

  function shell(out, loc) {
    if (!signedIn()) return signin();
    var me = S.sel.me(), k = loc.path.split('/')[1] || 'home', st = S.get(), n = 0;
    var nav = GROUPS.map(function (g) {
      return h`<div class="nav-group"><div class="nav-h">${g[0]}</div>${g[1].map(function (t) {
        n++; var on = t[0] === k;
        return h`<a class="nav-i ${on ? 'on' : ''}" href="${t[1]}" ${on ? h`aria-current="page"` : ''}>${F.UI.tile(t[3], ((n - 1) % 5) + 1, true)}<span>${t[2]}</span></a>`;
      })}</div>`;
    });
    return h`
      <div class="shell">
        <aside class="side">
          <a class="brand" href="#/" aria-label="Folio portal home">${F.UI.mark(30, true)}${F.UI.wordmark('', true)}<span class="portal-chip" aria-hidden="true">Portal</span></a>
          <div class="clinic"><strong>${st.clinic.org}</strong><span>${st.clinic.team}</span></div>
          <nav class="nav" aria-label="Main"><span class="nav-bubble" aria-hidden="true"></span>${nav}</nav>
          <div class="side-foot">
            <div class="me">${F.UI.avatar(me, 40)}<div><strong>${me.name}</strong><span>${me.role}</span></div><button class="btn btn-sm btn-quiet signout" data-action="signOut" aria-label="Log out ${me.name}">Log out</button></div>
            <div class="demo-links"><a href="app/" target="_blank" rel="noopener">Patient app ${ic('ext', 13)}</a><a href="card/?demo=1" target="_blank" rel="noopener">Adult view demo ${ic('ext', 13)}</a></div>
          </div>
        </aside>
        <main id="main" class="page" data-keep="page"><div class="page-in pageturn">${out.html}</div></main>
      </div>`;
  }

  var routes = [
    ['/', F.Pages.home], ['/patients', F.Pages.patients], ['/patients/:id', F.Pages.profile],
    ['/visit', F.Pages.visitPicker], ['/visit/:id', F.Pages.visit], ['/add', F.Pages.add],
    ['/cards', F.Pages.cards], ['/levels', F.Pages.levels], ['/access', F.Pages.access],
    ['/insights', F.Pages.insights], ['/resources', F.Pages.resources], ['/team', F.Pages.team], ['/settings', F.Pages.settings]
  ];
  F.UI.createApp({ name: 'Folio Portal', routes: routes, shell: shell, after: function (r, l, n) { if (!signedIn()) { document.title = 'Sign in · Folio Portal'; var b = r.querySelector('.signin-sso, .signin-acct'); if (b && n) b.focus({ preventScroll: true }); return; } M.saveView(); if (F.fx) F.fx.after(r, l, n); },
    notFound: function () { return { title: 'Not found', html: h`<h1>That page is not in the binder</h1><p><a href="#/">Back to Home</a></p>` }; } });

  F.actions.resetDemo = function () {
    F.UI.confirmModal({ title: 'Reset demo data?', body: 'Patients, notes, cards, the access log, the team list and program settings go back to the starting demo on this device. You stay signed in, and accessibility settings stay as they are. This cannot be undone.', cta: 'Reset demo data', danger: true, onOk: function () { S.reset(); F.UI.toast('Demo data reset'); } });
  };
})(window.Folio);
