/* Folio patient app: first-run welcome and parent view (v3 first-run update).
   Why: walking through Folio as each persona on a wiped phone showed there was no first run at all. The splash went
   straight to another teen's Home ("Evening, Maya"). See "Folio - First-run walkthrough and change plan.md".

   Teen path:   Welcome > Find your profile (Folio ID) > Is this you? > Your space, your call > Make it yours
                > Where are you now? (v5 readiness check: 15 questions, results per skill, up to 3 goals. Skippable,
                  shown to the care team, never changes the level) > You're set > Home
   Parent path: Welcome > Folio for parents > Your teen's Folio ID > Is this your teen? > Parent home
   Research behind the choices:
   - No notification request anywhere in setup (Apple HIG, web.dev). Folio's reminders are calendar files.
   - Privacy in short layers, each one true in the code today, with "change it any time" (OPC consent guidelines).
   - The teen holds the parent switches, all off by default, and always sees when one is on (CPS 2023, UK Children's Code).
   - Progress style is a real choice on day one, including "Just my level" (SDT meta-analysis, gamified app trials).
   - Parent home shows skills and tasks, never notes or glucose, plus autonomy-supporting tips (Goethals 2019, Dickinson 2017).
   Per device: localStorage folio.app.setup = 'teen' | 'parent', folio.app.child = the parent's teen,
   folio.app.flow = setup still in progress, so closing the app mid-setup resumes at the same step (see session.js).
   Find your profile takes the 8-digit Folio ID or the code printed on a Folio tag (FO-1004), typed any way,
   or "Scan your card" reads the QR code on the card (scan.js) and lands on the same "Is this you?" step.
   Demo: ?welcome=1 forces the welcome. ?logout=1 logs the phone out. About me > Log out brings the welcome back. */
(function (F) {
  'use strict';
  var h = F.UI.h, raw = F.UI.raw, ic = F.UI.ic, U = F.UI, S = F.Store, sel = S.sel, A = S.act, N = F.native || {};
  var KEY = 'folio.app.setup', PKEY = 'folio.app.pid', CHILD = 'folio.app.child', FLOW = 'folio.app.flow';
  var FLOW_STEPS = ['hello', 'find', 'confirm', 'privacy', 'yours', 'check', 'cq', 'cres', 'cgoals', 'done', 'p-about', 'p-find', 'p-confirm'];
  var device = document.getElementById('device'), appEl = document.getElementById('app');
  var el = null, st = null;

  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function put(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
  function haptic(k) { try { if (N.haptic) N.haptic(k); } catch (e) {} }
  function standalone() { return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || navigator.standalone; }
  /* Someone who already used the app on this device (it remembers a patient) counts as set up */
  function mode() { var m = get(KEY); if (m) return m; if (get(PKEY)) { put(KEY, 'teen'); return 'teen'; } return ''; }
  function pt() { return st && st.pid ? sel.patient(st.pid) : null; }
  function nick(p) { return F.nickname ? F.nickname(p) : p.first; }

  /* ---------- Mount ---------- */
  function mount() {
    if (!el) {
      el = document.createElement('div'); el.className = 'fw'; el.id = 'fw';
      el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-labelledby', 'fw-h');
      device.appendChild(el);
    }
    appEl.setAttribute('inert', ''); appEl.setAttribute('aria-hidden', 'true'); device.classList.add('fw-on');
  }
  function unmount() {
    if (el) { el.remove(); el = null; }
    appEl.removeAttribute('inert'); appEl.removeAttribute('aria-hidden'); device.classList.remove('fw-on');
    st = null;
    setTimeout(function () { var t = document.querySelector('#main h1'); if (t) try { t.focus({ preventScroll: true }); } catch (e) {} }, 60);
  }
  function render(focus) {
    if (!el || !st) return;
    var ae = document.activeElement, sig = ae && el.contains(ae) && ae.dataset && ae.dataset.action ? '[data-action="' + ae.dataset.action + '"]' + (ae.dataset.id ? '[data-id="' + ae.dataset.id + '"]' : '') + (ae.dataset.v ? '[data-v="' + ae.dataset.v + '"]' : '') : '';
    var same = el.dataset.step === st.step; el.dataset.step = st.step; el.classList.toggle('fw-same', same);
    el.innerHTML = screen().s;
    el.scrollTop = focus ? 0 : el.scrollTop;
    saveFlow();
    document.title = (st.step === 'parent' ? 'Parent view' : 'Welcome') + ' · Folio';
    if (focus === 'field') { var f = el.querySelector('input'); if (f) f.focus(); return; }
    if (focus) { var t = el.querySelector('#fw-h'); if (t) try { t.focus({ preventScroll: true }); } catch (e) {} return; }
    if (sig) { var b = el.querySelector(sig); if (b) b.focus({ preventScroll: true }); }
  }
  /* Setup in progress is kept on the device, so an app closed mid-setup opens on the same step with the same answers */
  function saveFlow() {
    if (!st || st.retake || st.replay || st.step === 'parent' || FLOW_STEPS.indexOf(st.step) < 0) return;
    put(FLOW, JSON.stringify({ step: st.step, path: st.path, pid: st.pid, typed: st.typed || '', style: st.style || '', ans: st.ans || {}, qi: st.qi || 0, picked: st.picked || null, at: Date.now() }));
  }
  function loadFlow() {
    var f = null; try { f = JSON.parse(get(FLOW) || 'null'); } catch (e) {}
    if (!f || FLOW_STEPS.indexOf(f.step) < 0) return null;
    var needsP = ['hello', 'find', 'p-about', 'p-find'].indexOf(f.step) < 0;
    if (f.pid && !sel.patient(f.pid)) f.pid = null;
    if (needsP && !f.pid) return null;
    if (f.step === 'cq') f.qi = Math.max(0, Math.min(F.CHECK.length - 1, +f.qi || 0));
    return { step: f.step, path: f.path || '', pid: f.pid || null, err: '', typed: f.typed || '', style: f.style || '', replay: false, ans: f.ans && typeof f.ans === 'object' ? f.ans : {}, qi: +f.qi || 0, picked: Array.isArray(f.picked) ? f.picked : null };
  }
  function go(step, extra) { Object.assign(st, extra || {}, { step: step, err: '' }); render(true); }

  /* ---------- Pieces ---------- */
  function back(to, label) { return h`<button type="button" class="fw-back" data-action="fwGo" data-to="${to}"><svg width="12" height="20" viewBox="0 0 12 20" fill="none" stroke="currentColor" stroke-width="2.600" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 2L2 10l8 8"/></svg><span>${label || 'Back'}</span></button>`; }
  function stepOf(n) { return h`<p class="fw-step">Step ${n} of 4</p>`; }
  function point(icon, n, text) { return h`<li><span class="ios-tile t${n}" aria-hidden="true">${ic(icon, 22)}</span><span>${text}</span></li>`; }
  var PV_WORDS = { level: 'your level and skills', tasks: 'your Run my care tasks', visit: 'your next visit' };
  function shareWords(p) { return F.PARENT_SHARE.filter(function (x) { return p.parentShare && p.parentShare[x.k]; }).map(function (x) { return PV_WORDS[x.k]; }); }
  var SKILL_ICON = { know: 'book', manage: 'clock', speak: 'message', run: 'visit', support: 'users' }, ST_ICON = { own: 'circlecheck', help: 'hand', learning: 'sprout' };
  function skillOf(id) { return F.AREAS.filter(function (k) { return k.id === id; })[0]; }
  function chip(v) { return h`<span class="ios-st s-${v}">${ic(ST_ICON[v], 16)}${F.CHECK_WORD[v]}</span>`; }
  function chevL() { return raw('<svg width="12" height="20" viewBox="0 0 12 20" fill="none" stroke="currentColor" stroke-width="2.600" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 2L2 10l8 8"/></svg>'); }
  function closeBtn() { return h`<button type="button" class="fw-link fw-close" data-action="fwCancel">Close</button>`; }
  /* The last saved check. During a retake, "before" means the one before today's answers are saved. */
  function lastCheck(p, before) { var c = (p && p.checks) || []; return c.length ? c[c.length - 1] : null; }
  function change(was, now) { var r = F.CHECK_RANK; return r[now] > r[was] ? 'Up from ' + F.CHECK_WORD[was].toLowerCase() + ' last time' : r[now] < r[was] ? 'Last time you said ' + F.CHECK_WORD[was].toLowerCase() : 'Same as last time'; }
  /* Goal options: questions answered Not yet first, then With help, in question order */
  function goalOptions(ans) { return F.CHECK.filter(function (q) { return ans[q.id] && ans[q.id] !== 'own'; }).sort(function (a, b) { return F.CHECK_RANK[ans[a.id]] - F.CHECK_RANK[ans[b.id]] || F.CHECK.indexOf(a) - F.CHECK.indexOf(b); }); }
  function plantArt(stage, size) { return F.Plant ? h`<div class="fw-art" aria-hidden="true">${raw(F.Plant.svg(stage, 0, size, ''))}</div>` : h`<div class="fw-art" aria-hidden="true">${U.mark(72)}</div>`; }

  /* ---------- Screens ---------- */
  function screen() {
    var s = st.step, p = pt();
    if (s === 'hello') return h`<div class="fw-scr fw-hello">
      <div class="fw-brand">${U.wordmark()}</div>
      <div class="fw-art fw-mascot" aria-hidden="true">${U.mascot(150)}</div>
      <h1 id="fw-h" tabindex="-1">Take over your diabetes care, one skill at a time.</h1>
      <p class="fw-lead">Your clinic signs off each step with you. Folio keeps your story so new doctors don't start from zero.</p>
      <div class="fw-acts">
        <button type="button" class="ios-btn" data-action="fwGo" data-to="find" data-path="teen">Set up Folio</button>
        <button type="button" class="ios-btn sec" data-action="fwGo" data-to="p-about" data-path="parent">I'm a parent or caregiver</button>
        ${st.replay ? h`<button type="button" class="fw-link" data-action="fwCancel">Back to the app</button>` : h`<button type="button" class="fw-link" data-action="fwDemo">Folio team: open the demo</button>`}
      </div></div>`;

    if (s === 'find' || s === 'p-find') {
      var parent = s === 'p-find', demo = S.get().patients.slice().sort(function (a, b) { return (b.cardId ? 1 : 0) - (a.cardId ? 1 : 0) || String(a.cardId || '').localeCompare(String(b.cardId || '')) || a.level - b.level; });
      return h`<form class="fw-scr" data-submit="fwFind" novalidate>
        ${back(parent ? 'p-about' : 'hello')}
        ${parent ? '' : stepOf(1)}
        <h1 id="fw-h" tabindex="-1">${parent ? 'Connect to your teen' : 'Find your profile'}</h1>
        <p class="fw-lead" id="fw-hint">${parent ? 'Type your teen\'s Folio ID: the 8 numbers on their Folio card, or the code on their Folio tag, like FO-1004.' : 'Your clinic already started it. Type the 8 numbers on your Folio card, or the code on your Folio tag, like FO-1004.'}</p>
        ${F.scan ? h`<div class="fw-scanrow"><button type="button" class="ios-btn sec fw-scanbtn" data-action="fwScan">${ic('qr', 22)} Scan your card</button></div><p class="fw-ordiv">or type it</p>` : ''}
        <div class="ios-list"><label class="ios-field" for="fw-id"><span class="fw-lbl">Folio ID or card code</span><input id="fw-id" name="id" type="text" inputmode="text" autocapitalize="characters" autocorrect="off" spellcheck="false" autocomplete="off" enterkeyhint="go" maxlength="16" value="${st.typed || ''}" aria-describedby="${st.err ? 'fw-err fw-hint' : 'fw-hint'}" ${st.err ? h`aria-invalid="true"` : ''}></label></div>
        ${st.err ? h`<p class="fw-err" id="fw-err" role="alert">${ic('info', 16)} ${st.err}</p>` : ''}
        <div class="fw-acts"><button type="submit" class="ios-btn">${parent ? 'Find my teen' : 'Find my profile'}</button></div>
        <details class="fw-demo"><summary>Demo numbers for the Folio team</summary>
          <div class="ios-list">${demo.map(function (x) { return h`<button type="button" class="ios-row" data-action="fwFill" data-id="${x.folioId}"><span class="ios-rt"><b>${sel.full(x)}, ${x.age}</b><small>Level ${x.level} · ${sel.fid(x.folioId)}${x.cardId ? ' · ' + sel.cardId(x) : ''}</small></span></button>`; })}</div></details>
      </form>`;
    }

    if (s === 'confirm' || s === 'p-confirm') {
      var par = s === 'p-confirm';
      return h`<div class="fw-scr fw-center">
        ${back(par ? 'p-find' : 'find')}
        ${par ? '' : stepOf(1)}
        <div class="fw-av">${U.avatar(p, 104)}</div>
        <h1 id="fw-h" tabindex="-1">${par ? 'Is this your teen?' : 'Is this you?'}</h1>
        <p class="fw-name">${sel.full(p)}</p>
        <p class="fw-note fw-ids">Folio ID ${sel.fid(p.folioId)}${p.cardId ? ' · Card ' + sel.cardId(p) : ''}</p>
        <p class="fw-lead">Age ${p.age} · ${p.condition}<br>${S.get().clinic.org}, ${S.get().clinic.team.toLowerCase()}</p>
        <div class="fw-acts">
          <button type="button" class="ios-btn" data-action="${par ? 'fwParentDone' : 'fwGo'}" data-to="privacy">${par ? 'Yes, connect' : 'Yes, that\'s me'}</button>
          <button type="button" class="ios-btn sec" data-action="fwGo" data-to="${par ? 'p-find' : 'find'}">Try another number</button>
        </div></div>`;
    }

    if (s === 'privacy') {
      var on = shareWords(p);
      return h`<div class="fw-scr">
        ${back('confirm')}
        ${stepOf(2)}
        <h1 id="fw-h" tabindex="-1">Your space, your call</h1>
        <ul class="fw-points">
          ${point('edit', 1, 'Your clinic started your profile. You add the rest, like what you want new doctors to know.')}
          ${point('card', 3, 'New doctors only see it when you tap or show your card. You can see every time it is opened.')}
          ${point('users', 2, on.length ? 'Your parent can see ' + on.join(', ') + ', because you turned that on. You can turn it off.' : 'Your parents only see what you turn on. Right now, that is nothing.')}
          ${point('lock', 4, 'Folio never shows your glucose numbers and never stores your health records.')}
        </ul>
        <p class="fw-note">Change any of this in About me, under Sharing and privacy.</p>
        <div class="fw-acts"><button type="button" class="ios-btn" data-action="fwGo" data-to="yours">Got it</button></div></div>`;
    }

    if (s === 'yours') {
      var cur = st.style || (F.Plant ? F.Plant.mode() : 'plant');
      var opts = [
        ['plant', 'Plant', 'A new plant every level, and a leaf each time you practise or learn something. It never wilts.', F.Plant ? raw(F.Plant.svg(4, 0, 64, '')) : ''],
        ['stickers', 'Stickers', 'Earn a sticker for each step you take.', U.star(36)],
        ['bar', 'Just my level', 'No extras. Just where you are.', raw('<svg width="56" height="44" viewBox="0 0 56 44" aria-hidden="true"><path d="M4 40V32h12v-8h12v-8h12V8h12v32z" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/></svg>')]
      ];
      return h`<form class="fw-scr" data-submit="fwYours" novalidate>
        ${back('privacy')}
        ${stepOf(3)}
        <h1 id="fw-h" tabindex="-1">Make it yours</h1>
        <div class="ios-list"><label class="ios-field" for="fw-nick"><span class="fw-lbl">What should Folio call you?</span><input id="fw-nick" name="nick" type="text" maxlength="24" autocomplete="nickname" value="${nick(p)}"></label></div>
        <fieldset class="fw-opts"><legend>How do you want to see your progress?</legend>
          ${opts.map(function (o) { return h`<label class="fw-opt"><input type="radio" name="style" value="${o[0]}" ${cur === o[0] ? 'checked' : ''}><span class="fw-opt-art" aria-hidden="true">${o[3]}</span><span class="fw-opt-t"><b>${o[1]}</b><small>${o[2]}</small></span></label>`; })}
        </fieldset>
        <p class="fw-note">You can switch any time in About me.</p>
        <div class="fw-acts"><button type="submit" class="ios-btn">Continue</button></div></form>`;
    }

    /* ---------- v5 readiness check: intro, 15 questions one per screen, results per skill, then up to 3 goals ---------- */
    if (s === 'check') {
      var last = lastCheck(p);
      return h`<div class="fw-scr">
        ${st.retake ? closeBtn() : back('yours')}
        ${st.retake ? '' : stepOf(4)}
        <h1 id="fw-h" tabindex="-1">Where are you now?</h1>
        <p class="fw-lead">${F.CHECK.length} quick questions about your diabetes care. Answer with what you really do today.</p>
        <ul class="fw-points">
          ${point('clock', 2, 'About 3 minutes. One question at a time.')}
          ${point('check', 4, 'At the end you can pick up to 3 goals, each with small steps.')}
          ${point('lock', 3, 'Your care team sees your answers at your next visit. They never change your level.')}
        </ul>
        ${last ? h`<p class="fw-note">Last check: ${U.fmtFull(last.date)}. You will see what changed.</p>` : ''}
        <div class="fw-acts"><button type="button" class="ios-btn" data-action="fwCheckGo" data-i="0">Start</button><button type="button" class="ios-btn sec" data-action="${st.retake ? 'fwCancel' : 'fwGo'}" data-to="done">${st.retake ? 'Not now' : 'Skip for now'}</button></div></div>`;
    }

    if (s === 'cq') {
      var i = st.qi, q = F.CHECK[i], n = F.CHECK.length, skill = skillOf(q.skill), was = lastCheck(p), wasA = was && was.answers ? was.answers[q.id] : '', cur = st.ans[q.id];
      return h`<div class="fw-scr fw-q">
        <div class="fw-qtop">${i ? h`<button type="button" class="fw-back" data-action="fwCheckGo" data-i="${i - 1}">${chevL()}<span>Back</span></button>` : back('check')}${st.retake ? closeBtn() : ''}</div>
        <p class="fw-step">Question ${i + 1} of ${n}</p>
        <div class="fw-prog" role="progressbar" aria-label="Readiness check" aria-valuemin="1" aria-valuemax="${n}" aria-valuenow="${i + 1}" aria-valuetext="Question ${i + 1} of ${n}"><i style="width:${Math.round((i + 1) / n * 100)}%"></i></div>
        <p class="fw-qskill"><span class="ios-tile t${F.AREAS.indexOf(skill) % 5 + 1} sm" aria-hidden="true">${ic(SKILL_ICON[q.skill], 16)}</span>${skill.name}</p>
        <h1 id="fw-h" class="fw-qh" tabindex="-1">${q.q}</h1>
        <div class="fw-ans" role="group" aria-labelledby="fw-h">${F.CHECK_ANS.map(function (a) { return h`<button type="button" class="fw-an a-${a.v}" data-action="fwAns" data-v="${a.v}" aria-pressed="${String(cur === a.v)}"><b>${a.label}</b><small>${a.sub}</small></button>`; })}</div>
        ${wasA ? h`<p class="fw-note">Last time you said: ${F.CHECK_WORD[wasA]}</p>` : ''}
        <button type="button" class="fw-link" data-action="fwAns" data-v="">Skip this question</button></div>`;
    }

    if (s === 'cres') {
      var res = F.checkSkills(st.ans), prevC = lastCheck(p, true), any = Object.keys(res).length;
      return h`<div class="fw-scr">
        <div class="fw-qtop"><button type="button" class="fw-back" data-action="fwCheckGo" data-i="${F.CHECK.length - 1}">${chevL()}<span>Back</span></button>${st.retake ? closeBtn() : ''}</div>
        <h1 id="fw-h" tabindex="-1">Here is where you are</h1>
        <p class="fw-lead">${any ? 'Each skill shows the middle of your three answers. Your care team talks it through with you at your next visit. It does not change your level.' : 'You skipped every question, so there is nothing to show yet. You can take the check any time from Levels.'}</p>
        ${any ? h`<div class="ios-list fw-res">${F.AREAS.filter(function (k) { return res[k.id]; }).map(function (k) { return h`<div class="ios-row has-tile"><span class="ios-tile t${F.AREAS.indexOf(k) % 5 + 1}" aria-hidden="true">${ic(SKILL_ICON[k.id], 22)}</span><span class="ios-rt"><b>${k.name}</b>${prevC && prevC.skills[k.id] ? h`<small>${change(prevC.skills[k.id], res[k.id])}</small>` : ''}</span>${chip(res[k.id])}</div>`; })}</div>` : ''}
        ${any ? (function () { var pl = F.checkPlace(st.ans), PL = sel.level(pl.level); /* Level system v2: a suggested starting place for the care team to check */
          return h`<p class="fw-note fw-place">Your answers fit best around Level ${pl.level}: ${PL.goal.charAt(0).toLowerCase() + PL.goal.slice(1)}. Your care team checks this with you.</p>`; })() : ''}
        <div class="fw-acts">${any && goalOptions(st.ans).length ? h`<button type="button" class="ios-btn" data-action="fwGo" data-to="cgoals">Pick my goals</button>` : ''}<button type="button" class="ios-btn ${any && goalOptions(st.ans).length ? 'sec' : ''}" data-action="fwCheckSave">${st.retake ? 'Save and finish' : 'Save and continue'}</button></div></div>`;
    }

    if (s === 'cgoals') {
      var opts2 = goalOptions(st.ans), had = (p.goals || []).map(function (g) { return g.id; }), picked = st.picked || had.filter(function (id) { return opts2.some(function (o) { return o.id === id; }); });
      return h`<form class="fw-scr" data-submit="fwGoals" novalidate>
        <div class="fw-qtop">${st.goalsOnly ? '' : back('cres')}${st.retake ? closeBtn() : ''}</div>
        <h1 id="fw-h" tabindex="-1">Pick up to 3 goals</h1>
        <p class="fw-lead">${st.goalsOnly ? 'From your check on ' + U.fmtFull(lastCheck(p).date) + '. ' : ''}These are the ones you said Not yet or With help. Each goal has 3 small steps. You can change them any time in Levels.</p>
        <div class="fw-goals">${opts2.map(function (o, k) { var on = picked.indexOf(o.id) >= 0; return h`<label class="fw-goal"><input type="checkbox" name="g_${o.id}" value="1" ${on ? 'checked' : ''} data-change="fwGoalPick"><span class="fw-gbox" aria-hidden="true">${ic('check', 16)}</span><span class="fw-gt"><b>${o.goal}</b><small>${skillOf(o.skill).name} · You said ${F.CHECK_WORD[st.ans[o.id]].toLowerCase()}</small></span>${k < 3 ? h`<span class="fw-sugg">Suggested</span>` : ''}</label>`; })}</div>
        <p class="fw-note" id="fw-gcount" aria-live="polite">${picked.length} of 3 picked</p>
        <div class="fw-acts"><button type="submit" class="ios-btn">Save my goals</button><button type="button" class="ios-btn sec" data-action="${st.goalsOnly ? 'fwCancel' : 'fwCheckSave'}">Not now</button></div></form>`;
    }

    if (s === 'done') {
      var style = F.Plant ? F.Plant.mode() : 'plant';
      return h`<div class="fw-scr fw-center">
        ${style === 'plant' ? plantArt(p.level, 150) : h`<div class="fw-art" aria-hidden="true">${U.mark(80)}</div>`}
        <h1 id="fw-h" tabindex="-1">You're set, ${nick(p)}.</h1>
        <p class="fw-lead">${style === 'plant' ? 'Your plant starts here. It grows each time you practise a skill, read a guide or do a care task yourself.' : 'Your next step is waiting on Home.'}</p>
        <ul class="fw-points">
          ${point('visit', 2, 'Reminders go straight into your phone\'s calendar when you add a visit or a care task. Folio does not need notifications.')}
          ${standalone() ? '' : point('plus', 3, N.ios ? 'Add Folio to your home screen: tap Share, then Add to Home Screen. On iOS 26, Share is in the ··· menu.' : 'Add Folio to your home screen from your browser menu, so it opens like an app.')}
        </ul>
        <div class="fw-acts"><button type="button" class="ios-btn" data-action="fwTeenDone">Go to my Folio</button></div></div>`;
    }

    if (s === 'p-about') return h`<div class="fw-scr">
      ${back('hello')}
      <h1 id="fw-h" tabindex="-1">Folio for parents and caregivers</h1>
      <ul class="fw-points">
        ${point('levels', 4, 'Your teen is learning to run their own diabetes care, one skill at a time. Your role moves from doing it to backing them up.')}
        ${point('lock', 3, 'Your teen decides what you see. Folio never shows you their notes, their questions or glucose numbers.')}
        ${point('visit', 2, 'You can see who does each care task and hand jobs over when your teen is ready.')}
      </ul>
      <div class="fw-acts"><button type="button" class="ios-btn" data-action="fwGo" data-to="p-find">Connect to my teen</button></div></div>`;

    if (s === 'parent') return parentHome(p);
    return h``;
  }

  /* ---------- Parent home ---------- */
  function parentHome(p) {
    var share = p.parentShare || {}, any = share.level || share.tasks || share.visit, L = sel.level(p.level), first = p.first;
    var v = p.nextVisit && p.nextVisit.iso ? new Date(p.nextVisit.iso) : null;
    var tasks = p.careTasks || [];
    return h`<div class="fw-scr fw-parent">
      <header class="fw-ph"><span>${U.wordmark()}</span><span class="fw-tag">Parent view</span></header>
      <div class="fw-who">${U.avatar(p, 64)}<div><h1 id="fw-h" tabindex="-1">${first}'s progress</h1><p>${first} chooses what you see here.</p></div></div>
      ${!any ? h`<div class="ios-list"><div class="ios-row has-tile"><span class="ios-tile t2" aria-hidden="true">${ic('lock', 22)}</span><span class="ios-rt"><b>${first} has not shared anything yet</b><small>Ask ${first} to open About me, then What my parent can see. Folio never shares notes or glucose numbers.</small></span></div></div>` : ''}
      ${share.level ? h`<section class="fw-sec" aria-labelledby="pv-l"><h2 id="pv-l" class="ios-gh">Where ${first} is</h2>
        <div class="ios-list"><div class="ios-row"><span class="ios-rt"><b>Level ${p.level} of 10 · ${L.name}</b><small>Goal: ${L.goal}</small><small>${p.levelSignoff ? 'Signed off by ' + p.levelSignoff.by + ', ' + U.monthYear(p.levelSignoff.date) + '.' : 'Not signed off yet.'}</small></span></div>
          ${sel.currentSkills(p).map(function (k) { return h`<div class="ios-row"><span class="ios-rt"><b>${k.name}</b><small>${k.can}</small></span><span class="ios-st s-${p.skills[k.id]}">${ic({ own: 'circlecheck', help: 'hand', learning: 'sprout' }[p.skills[k.id]] || 'sprout', 16)}${F.SKILL_STATUS[p.skills[k.id]]}</span></div>`; })}</div>
        <p class="ios-gf">On my own: does it without being reminded. With help: does it with a reminder or a hand. Learning: still practising with the care team.</p></section>` : ''}
      ${share.tasks ? h`<section class="fw-sec" aria-labelledby="pv-t"><h2 id="pv-t" class="ios-gh">Who does what</h2>
        <div class="ios-list">${tasks.map(function (t) { return h`<div class="ios-row fw-task"><span class="ios-rt"><b>${t.label}</b>${t.done ? h`<small>${first} did this${t.doneDate ? ', ' + U.fmt(t.doneDate) : ''}</small>` : ''}</span>
          <div class="fw-own" role="group" aria-label="Who does ${t.label.toLowerCase()}">${['parent', 'shared', 'teen'].map(function (o) { return h`<button type="button" data-action="fwOwner" data-id="${t.id}" data-v="${o}" aria-pressed="${String((t.owner || 'teen') === o)}">${o === 'teen' ? first : F.OWNERS[o]}</button>`; })}</div></div>`; })}</div>
        <p class="ios-gf">When ${first} is ready, move a job to them. ${first} sees the change in their app.</p></section>` : ''}
      ${share.visit ? h`<section class="fw-sec" aria-labelledby="pv-v"><h2 id="pv-v" class="ios-gh">Next visit</h2>
        <div class="ios-list"><div class="ios-row"><span class="ios-rt"><b>${v && !isNaN(v.getTime()) ? v.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }) + ', ' + v.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'No visit added yet'}</b><small>${v && p.nextVisit.where ? p.nextVisit.where : first + ' adds visits in their app.'}</small></span></div></div></section>` : ''}
      <section class="fw-sec" aria-labelledby="pv-h"><h2 id="pv-h" class="ios-gh">How to back ${first} up</h2>
        <ul class="fw-points">
          ${point('message', 1, 'Ask before you tell. "What is your plan for the game?" invites ' + first + ' to lead.')}
          ${point('check', 4, 'Offer choices instead of doing it for them, like which day to book blood work.')}
          ${point('info', 5, 'Talk about numbers without judging. A high reading is information, not a grade.')}
        </ul></section>
      <div class="fw-acts fw-foot"><p class="fw-note">Signed in on this phone as ${first}'s parent or caregiver. Prototype: one phone can be the teen or the parent.</p><button type="button" class="ios-btn sec" data-action="fwRestart">Log out</button></div>
    </div>`;
  }

  /* ---------- Actions ---------- */
  F.actions.fwGo = function (b) {
    var to = b.dataset.to, extra = {};
    if (b.dataset.path) extra.path = b.dataset.path;
    if ((to === 'find' || to === 'p-find') && st.step !== to) extra.typed = '';
    if (to === 'find' && st.path === 'parent') to = 'p-find';
    haptic('light'); go(to, extra);
  };
  F.actions.fwFill = function (b) {
    var i = el && el.querySelector('#fw-id'), x = sel.byAnyId(b.dataset.id); if (i) { i.value = x && x.cardId ? sel.cardId(x) : String(b.dataset.id).replace(/(\d{4})(\d{4})/, '$1 $2'); i.focus(); }
    var d = el && el.querySelector('.fw-demo'); if (d) d.open = false;
  };
  F.actions.fwFind = function (d) {
    var raw0 = String(d.id || '').trim(), parent = st.step === 'p-find';
    st.typed = raw0;
    if (!raw0) { st.err = 'Type the 8 numbers on the card, or the code on the tag, like FO-1004.'; haptic('error'); render('field'); return; }
    var p = sel.byAnyId ? sel.byAnyId(raw0) : sel.byFolioId(raw0);
    if (!p) { st.err = 'We could not find that ID. Check the code on your card and try again.'; haptic('error'); render('field'); return; }
    haptic('success'); go(parent ? 'p-confirm' : 'confirm', { pid: p.id });
  };
  /* Scan your card: the camera reads the QR code on the card, then the same "Is this you?" step as typing the ID */
  F.actions.fwScan = function () {
    if (!F.scan || !st) return;
    var from = st.step, parent = from === 'p-find';
    haptic('light');
    F.scan.open({ onResult: function (p) {
      if (!st || st.step !== from) return;
      st.typed = p.cardId ? sel.cardId(p) : sel.fid(p.folioId);
      go(parent ? 'p-confirm' : 'confirm', { pid: p.id });
    } });
  };
  F.actions.fwYours = function (d) {
    var p = pt(), n = String(d.nick || '').trim().slice(0, 24);
    A.updatePatient(p.id, { nickname: n && n !== p.first ? n : '' });
    if (F.Plant && d.style) F.Plant.setMode(d.style);
    st.style = d.style; go('check');
  };
  F.actions.fwCheckGo = function (b) { st.qi = Math.max(0, Math.min(F.CHECK.length - 1, +b.dataset.i || 0)); if (st.step !== 'cq') st.picked = null; haptic('light'); go('cq'); };
  F.actions.fwAns = function (b) {
    var q = F.CHECK[st.qi]; if (b.dataset.v) st.ans[q.id] = b.dataset.v; else delete st.ans[q.id];
    haptic(b.dataset.v ? 'selection' : 'light');
    if (st.qi < F.CHECK.length - 1) { st.qi++; go('cq'); } else go('cres');
  };
  /* At most 3 goals: a 4th tick is undone with a plain message */
  F.actions.fwGoalPick = function (box) {
    var boxes = [].slice.call(el.querySelectorAll('.fw-goals input')), on = boxes.filter(function (x) { return x.checked; });
    if (on.length > 3) { box.checked = false; haptic('warning'); U.toast('Pick up to 3. Untick one to swap.'); on.pop(); }
    st.picked = boxes.filter(function (x) { return x.checked; }).map(function (x) { return x.name.slice(2); });
    var c = el.querySelector('#fw-gcount'); if (c) c.textContent = st.picked.length + ' of 3 picked';
  };
  function finishCheck(goalIds) {
    var p = pt(), any = !st.goalsOnly && Object.keys(st.ans).length;
    if (any) A.saveCheck(p.id, JSON.parse(JSON.stringify(st.ans)));
    if (goalIds) A.setGoals(p.id, goalIds);
    haptic('success');
    if (st.retake) { var msg = goalIds ? (goalIds.length ? (any ? 'Check saved. ' : '') + 'Your goals are on Home.' : (any ? 'Check saved. ' : '') + 'No goals picked.') : any ? 'Check saved. Your care team sees it next visit.' : 'Nothing saved'; unmount(); if (F.rerender) F.rerender(true); U.toast(msg); }
    else go('done');
  }
  F.actions.fwCheckSave = function () { finishCheck(null); };
  F.actions.fwGoals = function (d) { finishCheck(Object.keys(d).filter(function (k) { return k.indexOf('g_') === 0; }).map(function (k) { return k.slice(2); }).slice(0, 3)); };
  F.actions.fwTeenDone = function () {
    var id = st.pid; put(KEY, 'teen'); put(CHILD, null); put(FLOW, null); haptic('success');
    if (F.Session) F.Session.persist();
    try { sessionStorage.setItem('folio.app.new', id); } catch (e) {}
    unmount(); if (F.app) F.app.setPatient(id);
  };
  F.actions.fwParentDone = function () { put(KEY, 'parent'); put(CHILD, st.pid); put(FLOW, null); put(PKEY, null); if (F.Session) F.Session.persist(); haptic('success'); go('parent'); };
  F.actions.fwOwner = function (b) {
    var p = pt(); if (!p) return; var t = (p.careTasks || []).filter(function (x) { return x.id === b.dataset.id; })[0];
    if (!t || t.owner === b.dataset.v) return;
    A.setTaskOwner(p.id, t.id, b.dataset.v); haptic('light');
    U.toast(b.dataset.v === 'teen' ? 'Handed to ' + p.first + '. ' + p.first + ' sees it in the app.' : b.dataset.v === 'shared' ? 'Now shared with ' + p.first : 'Back with you for now');
  };
  F.actions.fwDemo = function () { put(KEY, 'teen'); put(CHILD, null); put(FLOW, null); if (F.Session) F.Session.persist(); unmount(); if (F.app) F.app.setPatient('p1'); U.toast('Demo profile: Maya R.'); };
  F.actions.fwCancel = function () { if (st && st.replay) put(FLOW, null); unmount(); if (F.rerender) F.rerender(true); };
  /* Parent view: Log out uses the same confirm sheet and clean-up as the teen app (app.js) */
  F.actions.fwRestart = function () { if (F.actions.logOut) F.actions.logOut(); else { put(KEY, null); put(CHILD, null); put(FLOW, null); start(false); } };

  /* ---------- Start ---------- */
  function start(replay, resume) {
    st = resume || { step: 'hello', path: '', pid: null, err: '', typed: '', style: '', replay: !!replay, ans: {}, qi: 0, picked: null };
    if (!resume) put(FLOW, null);
    mount(); render(true);
  }
  function openParent(pid) { st = { step: 'parent', path: 'parent', pid: pid, err: '' }; mount(); render(true); }
  /* The parent view follows the teen's switches live, even from another tab */
  S.sub(function () { if (st && st.step === 'parent') { if (!pt()) { put(KEY, null); put(CHILD, null); start(false); return; } render(false); } });

  /* Retake from the app (Levels, Home): the same screens, closing back to where the teen was. at = 'check' or 'cgoals'. */
  function check(pid, at) {
    var p = sel.patient(pid); if (!p) return;
    var last = p.checks && p.checks.length ? p.checks[p.checks.length - 1] : null;
    st = { step: at || 'check', path: 'teen', pid: pid, err: '', retake: true, goalsOnly: at === 'cgoals', ans: at === 'cgoals' && last ? JSON.parse(JSON.stringify(last.answers)) : {}, qi: 0, picked: null };
    mount(); render(true);
  }
  F.Welcome = { start: start, mode: mode, check: check, get open() { return !!el; }, close: function () { if (el) unmount(); } };
  var force = false; try { force = new URLSearchParams(location.search).get('welcome') === '1'; } catch (e) {}
  var m = force ? '' : mode();
  if (force) { put(KEY, null); put(CHILD, null); start(false); }
  else if (m === 'parent' && sel.patient(get(CHILD))) openParent(get(CHILD));
  else if (m !== 'teen') { var resume = m === 'parent' ? null : loadFlow(); start(false, resume); }
})(window.Folio);
