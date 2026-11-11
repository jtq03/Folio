/* Portal shell: binder tabs + routes. Each page lives in pages/*.js and returns {title, html}. */
(function (F) {
  var h = F.UI.h, ic = F.UI.ic, S = F.Store;
  F.Pages = F.Pages || {};

  var GROUPS = [
    ['Care', [['home', '#/', 'Home', 'home'], ['patients', '#/patients', 'Patients', 'users'], ['visit', '#/visit', 'Visit mode', 'visit'], ['add', '#/add', 'Add patient', 'plus']]],
    ['Program', [['cards', '#/cards', 'Cards', 'card'], ['levels', '#/levels', 'Levels and skills', 'levels'], ['access', '#/access', 'Access log', 'log'], ['insights', '#/insights', 'Insights', 'chart'], ['resources', '#/resources', 'Resources', 'book']]],
    ['Admin', [['team', '#/team', 'Team', 'team'], ['settings', '#/settings', 'Settings', 'settings']]]
  ];

  function shell(out, loc) {
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
          <a class="brand" href="#/" aria-label="Folio home">${F.UI.wordmark()}</a>
          <div class="clinic"><strong>${st.clinic.org}</strong><span>${st.clinic.team}</span></div>
          <nav class="nav" aria-label="Main"><span class="nav-bubble" aria-hidden="true"></span>${nav}</nav>
          <div class="side-foot">
            <div class="me">${F.UI.avatar(me, 40)}<div><strong>${me.name}</strong><span>${me.role}</span></div></div>
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
  F.UI.createApp({ name: 'Folio Portal', routes: routes, shell: shell, after: function (r, l, n) { if (F.fx) F.fx.after(r, l, n); },
    notFound: function () { return { title: 'Not found', html: h`<h1>That page is not in the binder</h1><p><a href="#/">Back to Home</a></p>` }; } });

  F.actions.resetDemo = function () {
    F.UI.confirmModal({ title: 'Reset demo data?', body: 'This puts every patient, note, card and setting back to the starting demo state on this device.', cta: 'Reset', danger: true, onOk: function () { S.reset(); F.UI.toast('Demo data reset'); } });
  };
})(window.Folio);
