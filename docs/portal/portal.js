/* Portal shell: binder tabs + routes. Each page lives in pages/*.js and returns {title, html}. */
(function (F) {
  var h = F.UI.h, ic = F.UI.ic, S = F.Store;
  F.Pages = F.Pages || {};

  var TABS = [
    { k: 'home', href: '#/', label: 'Home', icon: 'home', tone: 'beige-200' },
    { k: 'patients', href: '#/patients', label: 'Patients', icon: 'users', tone: 'blue-300' },
    { k: 'visit', href: '#/visit', label: 'Visit mode', icon: 'visit', tone: 'beige-200' },
    { k: 'add', href: '#/add', label: 'Add patient', icon: 'plus', tone: 'blue-300' },
    { k: 'cards', href: '#/cards', label: 'Cards', icon: 'card', tone: 'beige-200' },
    { k: 'levels', href: '#/levels', label: 'Levels and skills', icon: 'levels', tone: 'blue-300' },
    { k: 'access', href: '#/access', label: 'Access log', icon: 'log', tone: 'beige-200' },
    { k: 'insights', href: '#/insights', label: 'Insights', icon: 'chart', tone: 'blue-300' },
    { k: 'resources', href: '#/resources', label: 'Resources', icon: 'book', tone: 'beige-200' },
    { k: 'team', href: '#/team', label: 'Team', icon: 'team', tone: 'blue-300' },
    { k: 'settings', href: '#/settings', label: 'Settings', icon: 'settings', tone: 'beige-200' }
  ];

  function activeKey(path) {
    var seg = path.split('/')[1] || 'home';
    return seg;
  }

  function shell(out, loc) {
    var me = S.sel.me(), k = activeKey(loc.path), st = S.get();
    var tabs = TABS.map(function (t, i) {
      var on = t.k === k;
      return h`<a class="tab ${on ? 'on' : ''}" href="${t.href}" style="--tone:var(--${['blue-100', 'blue-300', 'beige-200', 'beige-300'][i % 4]});--i:${i}" ${on ? h`aria-current="page"` : ''}>${ic(t.icon, 20)}<span>${t.label}</span></a>`;
    });
    return h`
      <div class="topbar">
        <a class="brand" href="#/" aria-label="Folio home">${F.UI.wordmark()}</a>
        <div class="clinic"><strong>${st.clinic.org}</strong><span>${st.clinic.team}</span></div>
        <div class="grow"></div>
        <nav class="demo-links" aria-label="Prototype surfaces">
          <a href="app/" target="_blank" rel="noopener">Patient app ${ic('ext', 14)}</a>
          <a href="card/?demo=1" target="_blank" rel="noopener">Adult card view (demo) ${ic('ext', 14)}</a>
        </nav>
        <div class="me">${F.UI.avatar(me, 36)}<div><strong>${me.name}</strong><span>${me.role}</span></div></div>
      </div>
      <div class="binder">
        <nav class="tabs" aria-label="Main">${tabs}</nav>
        <main id="main" class="page" data-keep="page"><div class="rings" aria-hidden="true"><i></i><i></i><i></i></div><div class="page-in pageturn">${out.html}</div></main>
      </div>`;
  }

  var routes = [
    ['/', F.Pages.home], ['/patients', F.Pages.patients], ['/patients/:id', F.Pages.profile],
    ['/visit', F.Pages.visitPicker], ['/visit/:id', F.Pages.visit], ['/add', F.Pages.add],
    ['/cards', F.Pages.cards], ['/levels', F.Pages.levels], ['/access', F.Pages.access],
    ['/insights', F.Pages.insights], ['/resources', F.Pages.resources], ['/team', F.Pages.team], ['/settings', F.Pages.settings]
  ];
  F.UI.createApp({ name: 'Folio Portal', routes: routes, shell: shell,
    notFound: function () { return { title: 'Not found', html: h`<h1>That page is not in the binder</h1><p><a href="#/">Back to Home</a></p>` }; } });

  F.actions.resetDemo = function () {
    F.UI.confirmModal({ title: 'Reset demo data?', body: 'This puts every patient, note, card and setting back to the starting demo state on this device.', cta: 'Reset', danger: true, onOk: function () { S.reset(); F.UI.toast('Demo data reset'); } });
  };
})(window.Folio);
