/* Cards: issue, assign, replace, deactivate. The physical card has a lifecycle. */
(function (F) {
  var h = F.UI.h, ic = F.UI.ic, S = F.Store, sel = S.sel, U = F.UI, A = S.act;
  var ST = { active: ['Active', 'ready'], inactive: ['Deactivated', 'neutral'], unassigned: ['Not issued', 'attn'] };

  F.actions.cardPreview = function (el) {
    var p = sel.patient(el.dataset.pid);
    U.modal(h`<h2>${sel.full(p)}'s card</h2><p class="muted small">This QR code opens the care team view on any phone camera. Replace card makes a new link, so a printed code stops working.</p>
      ${picker(p, 'preview')}<div class="fcards" data-preview="${p.id}">${U.cardFace(p, 'front')}${U.cardFace(p, 'back')}</div><div class="mform-actions"><button class="btn btn-primary" data-close>Done</button></div>`, { cls: 'wide', label: 'Card preview' });
  };
  /* Issue card sheet: pick the shape first, then issue. The pick stays in the sheet until Issue card saves it. */
  F.actions.cardIssue = function (el) {
    var p = sel.patient(el.dataset.pid);
    var dlg = U.modal(h`<h2>Issue a card to ${p.first}?</h2><p class="muted">A new unguessable link is created for the card. Hand it to ${p.first} at the visit.</p>
      ${picker(p, 'issue')}<div class="mform-actions"><button class="btn btn-quiet" data-close>Cancel</button><button class="btn btn-primary" data-issue-go>Issue card</button></div>`, { label: 'Issue a card to ' + p.first });
    dlg.querySelector('[data-issue-go]').addEventListener('click', function () {
      var on = dlg.querySelector('.shape-pick [aria-checked="true"]'), shape = F.cardShape(on && on.dataset.shape);
      dlg.close(); A.issueCard(p.id, shape); U.toast(F.CARD_SHAPES[shape] + ' card issued to ' + p.first);
    });
  };
  /* Shape picker: a radiogroup of five icon buttons with visible labels. Selected = filled tile, a check badge and
     bold label (not colour alone). Arrow keys move and select, as in a native radio group. */
  F.actions.cardShape = function (el) {
    var g = el.closest('.shape-pick'), pid = g.dataset.pid, shape = F.cardShape(el.dataset.shape), scope = g.dataset.scope;
    if (el.getAttribute('aria-checked') === 'true') return;
    g.querySelectorAll('[role=radio]').forEach(function (b) { var on = b === el; b.setAttribute('aria-checked', String(on)); b.tabIndex = on ? 0 : -1; });
    if (scope === 'issue') return;
    A.setCardShape(pid, shape);
    var prev = document.querySelector('[data-preview="' + pid + '"]'), p = sel.patient(pid);
    if (prev) prev.innerHTML = U.cardFace(p, 'front').s + U.cardFace(p, 'back').s;
    U.toast(p.first + "'s card is now the " + F.CARD_SHAPES[shape].toLowerCase() + ' shape');
    /* The table re-renders: keep focus on the same choice */
    var again = document.querySelector('.shape-pick[data-pid="' + pid + '"][data-scope="' + scope + '"] [data-shape="' + shape + '"]');
    if (again && again !== document.activeElement) again.focus({ preventScroll: true });
  };
  document.addEventListener('keydown', function (e) {
    var b = e.target.closest && e.target.closest('.shape-pick [role=radio]'); if (!b) return;
    var d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key], all = [].slice.call(b.parentNode.querySelectorAll('[role=radio]'));
    var i = all.indexOf(b), to = d ? all[(i + d + all.length) % all.length] : e.key === 'Home' ? all[0] : e.key === 'End' ? all[all.length - 1] : null;
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); F.actions.cardShape(b); return; }
    if (!to) return;
    e.preventDefault(); var pid = b.parentNode.dataset.pid, scope = b.parentNode.dataset.scope, shape = to.dataset.shape;
    to.focus(); F.actions.cardShape(to);
    var again = document.querySelector('.shape-pick[data-pid="' + pid + '"][data-scope="' + scope + '"] [data-shape="' + shape + '"]'); if (again) again.focus();
  });
  F.actions.cardReplace = function (el) { var p = sel.patient(el.dataset.pid); U.confirmModal({ title: 'Replace ' + p.first + "'s card?", body: 'The old card stops working at once. A new link is created.', cta: 'Replace card', danger: true, onOk: function () { A.replaceCard(p.id); U.toast('Card replaced. The old one no longer opens a profile.'); } }); };
  F.actions.cardOff = function (el) { var p = sel.patient(el.dataset.pid); U.confirmModal({ title: 'Deactivate this card?', body: 'Taps will show "This card is not active". You can turn it back on.', cta: 'Deactivate', danger: true, onOk: function () { A.deactivateCard(p.id); U.toast('Card deactivated'); } }); };
  F.actions.cardOn = function (el) { A.reactivateCard(el.dataset.pid); U.toast('Card reactivated'); };
  F.actions.cardCopy = function (el) {
    var p = sel.patient(el.dataset.pid), url = F.cardUrl(p.card.token);
    (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(function () { U.toast('Tap link copied'); }, function () { U.modal(h`<h2>Tap link</h2><input type="text" readonly value="${url}" onfocus="this.select()"><div class="mform-actions"><button class="btn btn-primary" data-close>Done</button></div>`); });
  };

  /* Shape icons (24 grid, 1.8 stroke). Tag is a tall luggage tag with a hole and string loop; ID card is a landscape
     card with a photo square and two text lines. */
  var GLYPH = {
    star: '<path d="M12 3.2l2.7 5.5 6 .9-4.35 4.2 1.03 6L12 16.95 6.62 19.8l1.03-6L3.3 9.6l6-.9z"/>',
    heart: '<path d="M12 20.2s-8-4.9-8-10.6A4.4 4.4 0 0 1 12 7.1a4.4 4.4 0 0 1 8 2.5c0 5.7-8 10.6-8 10.6z"/>',
    cloud: '<path d="M7.2 18.5h10.3a3.8 3.8 0 0 0 .5-7.55A5.4 5.4 0 0 0 7.6 9.7 4.4 4.4 0 0 0 7.2 18.5z"/>',
    tag: '<path d="M9.6 1.6c-1.7 1.2-1.4 4.2.9 6.1M14.4 1.6c1.7 1.2 1.4 4.2-.9 6.1"/><path d="M9 5.5h6l2.5 2.6v12.4a1.5 1.5 0 0 1-1.5 1.5H8a1.5 1.5 0 0 1-1.5-1.5V8.1z"/><circle cx="12" cy="8.6" r="1.2"/>',
    rounded: '<rect x="2.5" y="5.5" width="19" height="13" rx="2.5"/><rect x="5.3" y="8.6" width="5" height="6" rx="1"/><path d="M13 10.2h5.6M13 13.6h3.8"/>'
  };
  function glyph(shape, size) { var g = GLYPH[F.cardShape(shape)]; return U.raw('<svg class="shape-ic" width="' + (size || 22) + '" height="' + (size || 22) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + g + '</svg>'); }
  function shapeName(p) { return F.CARD_SHAPES[F.cardShape(p && p.card && p.card.shape)]; }
  function picker(p, scope) {
    var cur = F.cardShape(p.card && p.card.shape);
    return h`<div class="shape-pick" role="radiogroup" aria-label="Card shape for ${p.first}" data-pid="${p.id}" data-scope="${scope}">${Object.keys(F.CARD_SHAPES).map(function (k) {
      var on = k === cur;
      return h`<button type="button" role="radio" class="shape-opt" aria-checked="${String(on)}" tabindex="${on ? '0' : '-1'}" ${on && scope !== 'row' ? h`autofocus` : ''} aria-label="${F.CARD_SHAPES[k]}" data-action="cardShape" data-shape="${k}"><span class="shape-tile">${glyph(k, 24)}<i class="shape-tick" aria-hidden="true"></i></span><span class="shape-lbl">${F.CARD_SHAPES[k]}</span></button>`; })}</div>`;
  }
  function cardCell(p) {
    var id = F.Pages.cardId(p);
    if (p.card && p.card.status === 'unassigned') return h`<span class="muted">Not issued</span>`;
    return h`${id ? h`<b class="nowrap">${id}</b>` : ''}${picker(p, 'row')}`;
  }
  function pilot(pts) {
    var tagged = pts.filter(function (p) { return F.Pages.cardId(p); }).sort(function (a, b) { return F.Pages.cardId(a) < F.Pages.cardId(b) ? -1 : 1; });
    if (!tagged.length) return '';
    return h`<section class="sec pilot-tags" aria-labelledby="h-pilot"><div class="sec-head"><h2 id="h-pilot">Pilot tags</h2><span class="small muted">${tagged.length} physical tag${tagged.length === 1 ? '' : 's'} in the pilot</span></div>
      <ul class="pilot-list">${tagged.map(function (p) { return h`<li>${glyph(p.card && p.card.shape)}<div class="grow"><b>${F.Pages.cardId(p)}</b> <span class="muted">${shapeName(p)}</span><div><a href="#/patients/${p.id}">${sel.full(p)}</a></div></div></li>`; })}</ul></section>`;
  }

  F.Pages.cards = function () {
    /* Priority: cards to hand out first, then turned-off cards, then active cards by most recent tap */
    var ORD = { unassigned: 0, inactive: 1, active: 2 };
    var pts = S.get().patients.slice().sort(function (a, b) { return ORD[a.card.status] - ORD[b.card.status] || ((b.card.lastTap || '') < (a.card.lastTap || '') ? -1 : 1); }), active = pts.filter(function (p) { return p.card.status === 'active'; }).length, unassigned = pts.filter(function (p) { return p.card.status === 'unassigned'; }).length;
    return { title: 'Cards', html: h`
      ${F.Pages.head('Cards', h`Folio <em class="it">cards</em>`, 'Issue, assign, replace and turn off cards. Each card carries an unguessable link, never a patient name.')}
      <p class="shape-note small">${glyph('star', 18)}<span><b>Card shape:</b> pick Star, Heart, Cloud, Tag or ID card for each patient in the Card column, or when you issue a card. The shape changes the printed card and the card in the patient app. The QR code and link stay the same.</span></p>
      <div class="stats" style="grid-template-columns:repeat(3,minmax(0,1fr))"><div class="stat"><span class="eyebrow">Active cards</span><b>${active}</b></div><div class="stat"><span class="eyebrow red">Not issued</span><b>${unassigned}</b></div><div class="stat"><span class="eyebrow">Last tap</span><b style="font-size:1.6rem">${U.fmt(S.get().access.filter(function (a) { return a.how.indexOf('Card') === 0; }).map(function (a) { return a.time; }).sort().pop())}</b></div></div>
      ${pilot(pts)}
      <div class="table-wrap sec plain" style="padding:.5rem"><table class="data"><caption class="sr">Folio cards</caption>
      <thead><tr><th scope="col">Patient</th><th scope="col">Card</th><th scope="col">Status</th><th scope="col">Issued</th><th scope="col">Last tap</th><th scope="col">Actions</th></tr></thead>
      <tbody>${pts.map(function (p) { var c = p.card, st = ST[c.status]; return h`<tr>
        <td><div class="row">${U.avatar(p, 34)}<div><a class="rowlink" href="#/patients/${p.id}">${sel.full(p)}</a><div class="tiny muted nowrap">Folio ID ${sel.fid(p.folioId)}</div></div></div></td>
        <td>${cardCell(p)}</td>
        <td>${U.pill(st[0], st[1])}</td>
        <td>${c.issued ? U.fmt(c.issued) : '-'}</td><td>${c.lastTap ? U.fmt(c.lastTap) : '-'}</td>
        <td><div class="row wrap gap-s">${c.status === 'unassigned' ? h`<button class="btn btn-sm btn-primary" data-action="cardIssue" data-pid="${p.id}">Issue card</button>` : h`
          <button class="btn btn-sm" data-action="cardPreview" data-pid="${p.id}">Preview</button>
          ${c.status === 'active' ? h`<a class="btn btn-sm" href="${F.cardUrl(c.token)}" target="_blank" rel="noopener">Open tap view ${ic('ext', 14)}</a><button class="btn btn-sm btn-quiet" data-action="cardCopy" data-pid="${p.id}">Copy link</button><button class="btn btn-sm btn-quiet" data-action="cardReplace" data-pid="${p.id}">Replace</button><button class="btn btn-sm btn-quiet" data-action="cardOff" data-pid="${p.id}">Deactivate</button>` : h`<button class="btn btn-sm" data-action="cardOn" data-pid="${p.id}">Reactivate</button><button class="btn btn-sm btn-quiet" data-action="cardReplace" data-pid="${p.id}">Replace</button>`}`}</div></td></tr>`; })}</tbody></table></div>` };
  };
})(window.Folio);
