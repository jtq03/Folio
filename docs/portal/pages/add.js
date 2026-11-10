/* Add patient: enrolment, guardian and consent, then card assignment. */
(function (F) {
  var h = F.UI.h, ic = F.UI.ic, S = F.Store, sel = S.sel, U = F.UI, A = S.act;
  function fresh() { F.ui.add = { step: 1, d: { first: '', last: '', age: '', condition: 'Type 1 diabetes', level: '1', guardian: '', relation: 'Mother', phone: '', consentPatient: false, consentGuardian: false, consentLinks: false, shape: 'rounded', skipCard: false }, created: null }; }
  F.actions.add1 = function (d) { Object.assign(F.ui.add.d, d); F.ui.add.step = 2; F.rerender(true); };
  F.actions.add2 = function (d) { Object.assign(F.ui.add.d, { guardian: d.guardian, relation: d.relation, phone: d.phone, consentPatient: !!d.cp, consentGuardian: !!d.cg, consentLinks: !!d.cl }); F.ui.add.step = 3; F.rerender(true); };
  F.actions.addBack = function () { F.ui.add.step--; F.rerender(true); };
  F.actions.add3 = function (d) {
    var x = F.ui.add.d, skip = d.skip === 'on';
    var p = A.addPatient({ first: x.first, last: x.last, age: x.age, condition: x.condition, level: x.level, guardian: x.guardian, relation: x.relation, phone: x.phone, shape: skip ? '' : d.shape });
    F.ui.add.created = p.id; F.rerender(true); U.toast(p.first + ' is enrolled', true);
  };
  F.actions.addAnother = function () { fresh(); F.rerender(true); };

  F.Pages.add = function () {
    if (!F.ui.add) fresh();
    var a = F.ui.add, d = a.d, steps = ['Patient', 'Guardian and consent', 'Folio card'];
    var stepper = h`<ol class="stepper" aria-label="Enrolment steps">${steps.map(function (s, i) { var n = i + 1; return h`<li class="${n < a.step ? 'done' : ''}" ${n === a.step ? h`aria-current="step"` : ''}><b>${n < a.step ? '✓' : n}</b>${s}</li>`; })}</ol>`;
    var body;
    if (a.created) {
      var p = sel.patient(a.created);
      body = h`<div class="done-sheet"><div class="eyebrow red">Enrolled</div><h2 style="margin:.5rem 0">${sel.full(p)} is in Folio</h2><p class="muted" style="margin-inline:auto">Folio ID <b>${sel.fid(p.folioId)}</b> · Level ${p.level}, ${sel.level(p.level).name}.</p>
        <div class="row wrap" style="justify-content:center"><a class="btn btn-primary" href="#/patients/${p.id}">Open profile</a><a class="btn" href="#/cards">Manage cards</a><button class="btn btn-quiet" data-action="addAnother">Add another</button></div></div>`;
    } else if (a.step === 1) {
      body = h`<h2>Who is joining Folio?</h2><form data-submit="add1" novalidate>
        <div class="grid2" style="gap:0 1.25rem"><div><label for="a-f">First name</label><input id="a-f" name="first" value="${d.first}" required autocomplete="off"></div><div><label for="a-l">Last initial or name</label><input id="a-l" name="last" value="${d.last}" required autocomplete="off"></div>
        <div><label for="a-a">Age</label><input id="a-a" name="age" type="number" min="8" max="26" value="${d.age}" required></div>
        <div><label for="a-c">Condition package</label><select id="a-c" name="condition"><option ${d.condition === 'Type 1 diabetes' ? 'selected' : ''}>Type 1 diabetes</option></select></div></div>
        <label for="a-lv">Starting level</label><select id="a-lv" name="level">${F.LEVELS.map(function (l) { return h`<option value="${l.n}" ${String(l.n) === d.level ? 'selected' : ''}>${l.n} · ${l.name}</option>`; })}</select>
        <p class="small muted">A starting assessment can place teens who already have skills above Level 1.</p>
        <div class="row" style="justify-content:flex-end;margin-top:1.25rem"><button class="btn btn-primary">Next: guardian and consent ${ic('arrow', 16)}</button></div></form>`;
    } else if (a.step === 2) {
      body = h`<h2>Guardian and consent</h2><form data-submit="add2" novalidate>
        <div class="grid2" style="gap:0 1.25rem"><div><label for="g-n">Guardian name</label><input id="g-n" name="guardian" value="${d.guardian}" required></div><div><label for="g-r">Relationship</label><select id="g-r" name="relation">${['Mother', 'Father', 'Guardian', 'Other'].map(function (r) { return h`<option ${r === d.relation ? 'selected' : ''}>${r}</option>`; })}</select></div></div>
        <label for="g-p">Phone</label><input id="g-p" name="phone" type="tel" value="${d.phone}" required>
        <div class="divider-label"><span class="eyebrow">Consent (all required)</span></div>
        <label class="check"><input type="checkbox" name="cp" ${d.consentPatient ? 'checked' : ''} required><span>${d.first || 'The patient'} agrees to join Folio and understands they decide what is shared.</span></label>
        <label class="check"><input type="checkbox" name="cg" ${d.consentGuardian ? 'checked' : ''} required><span>The guardian consents to this profile and receiving updates.</span></label>
        <label class="check"><input type="checkbox" name="cl" ${d.consentLinks ? 'checked' : ''} required><span>Everyone understands Folio links to records and stores none of them.</span></label>
        <div class="row between" style="margin-top:1.25rem"><button type="button" class="btn" data-action="addBack">${ic('back', 16)} Back</button><button class="btn btn-primary">Next: Folio card ${ic('arrow', 16)}</button></div></form>`;
    } else {
      body = h`<h2>Assign a Folio card</h2><p class="muted">The card opens ${d.first || 'their'} profile for an ER or adult clinic when tapped or scanned. Choose a shape now or assign it later.</p><form data-submit="add3">
        <div class="chips" role="radiogroup" aria-label="Card shape" style="margin:.75rem 0">${Object.keys(F.CARD_SHAPES).map(function (k) { return h`<label class="chip" style="margin:0;display:inline-flex;gap:.5rem;align-items:center"><input type="radio" name="shape" value="${k}" ${k === d.shape ? 'checked' : ''} style="accent-color:var(--green-500)">${F.CARD_SHAPES[k]}</label>`; })}</div>
        <label class="check"><input type="checkbox" name="skip"><span>Assign the card later</span></label>
        <div class="row between" style="margin-top:1.25rem"><button type="button" class="btn" data-action="addBack">${ic('back', 16)} Back</button><button class="btn btn-cta">Enrol ${d.first || 'patient'}</button></div></form>`;
    }
    return { title: 'Add patient', html: h`${F.Pages.head('Enrolment', h`Add a <em class="it">patient</em>`, 'Three short steps. Patient and guardian both consent.')}${a.created ? '' : stepper}<section class="sec" style="max-width:780px">${body}</section>` };
  };
})(window.Folio);
