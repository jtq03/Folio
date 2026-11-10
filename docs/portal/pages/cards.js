/* Cards: issue, assign, replace, deactivate. The physical card has a lifecycle. */
(function (F) {
  var h = F.UI.h, ic = F.UI.ic, S = F.Store, sel = S.sel, U = F.UI, A = S.act;
  var ST = { active: ['Active', 'ready'], inactive: ['Deactivated', 'neutral'], unassigned: ['Not issued', 'attn'] };

  F.actions.cardPreview = function (el) {
    var p = sel.patient(el.dataset.pid);
    U.modal(h`<h2>${sel.full(p)}'s card</h2><p class="muted small">Sample QR for the prototype. It is not scannable. Use "Open tap view" to see what a clinic sees.</p><div class="fcards">${U.cardFace(p, 'front')}${U.cardFace(p, 'back')}</div><div class="mform-actions"><button class="btn btn-primary" data-close>Done</button></div>`, { cls: 'wide', label: 'Card preview' });
  };
  F.actions.cardIssue = function (el) {
    var p = sel.patient(el.dataset.pid);
    U.formModal({ title: 'Issue a card to ' + p.first, lead: 'Pick the shape. A new unguessable link is created for it.', cta: 'Issue card', fields: [{ name: 'shape', label: 'Card shape', type: 'select', options: Object.keys(F.CARD_SHAPES), value: 'rounded' }],
      onSubmit: function (d) { A.issueCard(p.id, d.shape); U.toast('Card issued to ' + p.first); } });
  };
  F.actions.cardShape = function (el) { A.setCardShape(el.dataset.pid, el.value); U.toast('Card shape updated'); };
  F.actions.cardReplace = function (el) { var p = sel.patient(el.dataset.pid); U.confirmModal({ title: 'Replace ' + p.first + "'s card?", body: 'The old card stops working at once. A new link is created.', cta: 'Replace card', danger: true, onOk: function () { A.replaceCard(p.id); U.toast('Card replaced. The old one no longer opens a profile.'); } }); };
  F.actions.cardOff = function (el) { var p = sel.patient(el.dataset.pid); U.confirmModal({ title: 'Deactivate this card?', body: 'Taps will show "This card is not active". You can turn it back on.', cta: 'Deactivate', danger: true, onOk: function () { A.deactivateCard(p.id); U.toast('Card deactivated'); } }); };
  F.actions.cardOn = function (el) { A.reactivateCard(el.dataset.pid); U.toast('Card reactivated'); };
  F.actions.cardCopy = function (el) {
    var p = sel.patient(el.dataset.pid), url = F.cardUrl(p.card.token);
    (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(function () { U.toast('Tap link copied'); }, function () { U.modal(h`<h2>Tap link</h2><input type="text" readonly value="${url}" onfocus="this.select()"><div class="mform-actions"><button class="btn btn-primary" data-close>Done</button></div>`); });
  };

  F.Pages.cards = function () {
    var pts = S.get().patients, active = pts.filter(function (p) { return p.card.status === 'active'; }).length, unassigned = pts.filter(function (p) { return p.card.status === 'unassigned'; }).length;
    return { title: 'Cards', html: h`
      ${F.Pages.head('Cards', h`Folio <em class="it">cards</em>`, 'Issue, assign, replace and turn off cards. Each card carries an unguessable link, never a patient name.')}
      <div class="stats" style="grid-template-columns:repeat(3,minmax(0,1fr))"><div class="stat"><span class="eyebrow">Active cards</span><b>${active}</b></div><div class="stat"><span class="eyebrow red">Not issued</span><b>${unassigned}</b></div><div class="stat"><span class="eyebrow">Last tap</span><b style="font-size:1.6rem">${U.fmt(S.get().access.filter(function (a) { return a.how.indexOf('Card') === 0; }).map(function (a) { return a.time; }).sort().pop())}</b></div></div>
      <div class="table-wrap sec plain" style="padding:.5rem"><table class="data"><caption class="sr">Folio cards</caption>
      <thead><tr><th scope="col">Patient</th><th scope="col">Status</th><th scope="col">Shape</th><th scope="col">Issued</th><th scope="col">Last tap</th><th scope="col">Actions</th></tr></thead>
      <tbody>${pts.map(function (p) { var c = p.card, st = ST[c.status]; return h`<tr>
        <td><div class="row">${U.avatar(p, 34)}<div><a class="rowlink" href="#/patients/${p.id}">${sel.full(p)}</a><div class="tiny muted">${sel.fid(p.folioId)}</div></div></div></td>
        <td>${U.pill(st[0], st[1])}</td>
        <td>${c.status === 'unassigned' ? '-' : h`<label class="sr" for="sh-${p.id}">Card shape for ${sel.full(p)}</label><select id="sh-${p.id}" data-change="cardShape" data-pid="${p.id}" style="width:auto;min-height:38px">${Object.keys(F.CARD_SHAPES).map(function (k) { return h`<option value="${k}" ${k === c.shape ? 'selected' : ''}>${F.CARD_SHAPES[k]}</option>`; })}</select>`}</td>
        <td>${c.issued ? U.fmt(c.issued) : '-'}</td><td>${c.lastTap ? U.fmt(c.lastTap) : '-'}</td>
        <td><div class="row wrap gap-s">${c.status === 'unassigned' ? h`<button class="btn btn-sm btn-primary" data-action="cardIssue" data-pid="${p.id}">Issue card</button>` : h`
          <button class="btn btn-sm" data-action="cardPreview" data-pid="${p.id}">Preview</button>
          ${c.status === 'active' ? h`<a class="btn btn-sm" href="${F.cardUrl(c.token)}" target="_blank" rel="noopener">Open tap view ${ic('ext', 14)}</a><button class="btn btn-sm btn-quiet" data-action="cardCopy" data-pid="${p.id}">Copy link</button><button class="btn btn-sm btn-quiet" data-action="cardReplace" data-pid="${p.id}">Replace</button><button class="btn btn-sm btn-quiet" data-action="cardOff" data-pid="${p.id}">Deactivate</button>` : h`<button class="btn btn-sm" data-action="cardOn" data-pid="${p.id}">Reactivate</button><button class="btn btn-sm btn-quiet" data-action="cardReplace" data-pid="${p.id}">Replace</button>`}`}</div></td></tr>`; })}</tbody></table></div>` };
  };
})(window.Folio);
