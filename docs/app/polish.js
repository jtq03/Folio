/* Folio polish: offline pill and the Haptics lab (compares haptic strategies side by side on a real phone). */
(function (F) {
  var U = F.UI, h = U.h, N = F.native || {};

  /* ---------- Offline pill: small and unobtrusive, everything still works and saves on the device ---------- */
  function pill() {
    var dev = document.getElementById('device'); if (!dev) return null;
    var p = dev.querySelector('.px-offline');
    if (!p) { p = document.createElement('div'); p.className = 'px-offline'; p.setAttribute('role', 'status'); p.innerHTML = '<i aria-hidden="true"></i>Offline'; dev.appendChild(p); }
    return p;
  }
  function net() { var p = pill(); if (!p) return; var off = navigator.onLine === false; p.classList.toggle('on', off); p.setAttribute('aria-hidden', String(!off)); }
  window.addEventListener('online', function () { net(); U.toast('Back online'); });
  window.addEventListener('offline', net);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', net); else net();

  /* ---------- Haptics lab ---------- */
  function osLine() {
    var ua = navigator.userAgent, ios = /OS (\d+)[_.](\d+)(?:[_.](\d+))?/.exec(ua), saf = /Version\/([\d.]+)/.exec(ua);
    var standalone = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
    return 'iOS ' + (ios ? ios[1] + '.' + ios[2] + (ios[3] ? '.' + ios[3] : '') : 'not detected') + ' · Safari ' + (saf ? saf[1] : 'n/a') + ' · Home Screen app: ' + (standalone ? 'yes' : 'no') +
      '\nSwitch control supported: ' + (F.hapticTap && F.hapticTap.supported ? 'yes' : 'no') + ' · Touch: ' + (F.hapticTap && F.hapticTap.enabled ? 'yes' : 'no');
  }
  /* Strategy A and D use their own hidden switch so the test does not depend on the app's haptic engine */
  var lab = null;
  function progClick() {
    try {
      if (!lab) { lab = document.createElement('label'); lab.setAttribute('aria-hidden', 'true'); lab.style.cssText = 'position:fixed;left:-60px;top:-60px;width:40px;height:40px;opacity:.01;pointer-events:none;overflow:hidden';
        var i = document.createElement('input'); i.type = 'checkbox'; i.setAttribute('switch', ''); i.tabIndex = -1; lab.appendChild(i); document.body.appendChild(lab);
        i.addEventListener('change', function (e) { e.stopPropagation(); }); }
      var keep = N.scrollSnapshot ? N.scrollSnapshot() : function () {}; lab.click(); keep(); return true;
    } catch (e) { return false; }
  }
  function log(msg) { var l = document.querySelector('.hx-lab-log'); if (!l) return; var t = new Date(); l.textContent = ('0' + t.getMinutes()).slice(-2) + ':' + ('0' + t.getSeconds()).slice(-2) + '  ' + msg + '\n' + l.textContent; }
  F.actions.hapticLab = function () {
    U.modal(h`<div class="hx-lab">
      <p class="hx-lab-dev">${osLine()}</p>
      <p class="ios-cap" style="margin:0 4px">Tap each test once and notice whether the phone gives a small tick. Haptics need System Haptics on in Settings, Sounds and Haptics.</p>
      <div class="ios-list">
        <button type="button" class="ios-row" data-action="hxA"><span class="hx-k">A</span><span class="ios-rt"><b>Script click</b><small>A tap handler clicks a hidden switch</small></span></button>
        <label class="ios-row"><span class="hx-k">B</span><span class="ios-rt"><b>Real switch</b><small>Flip this visible switch</small></span><input type="checkbox" role="switch" switch class="ios-sw" data-change="hxB" aria-label="Test switch"></label>
        <button type="button" class="ios-row" data-action="hxD"><span class="hx-k">D</span><span class="ios-rt"><b>Delayed script click</b><small>Same as A, half a second later</small></span></button>
      </div>
      <button type="button" class="ios-btn hx-lab-big" data-action="hxC" data-haptic-tap><span class="hx-k" style="background:var(--tint-ink);color:var(--tint)">C</span> Tap me (invisible switch on top)</button>
      <pre class="hx-lab-log" aria-live="polite">Ready.</pre>
      <div><h3 class="ios-gh" style="margin-left:4px">Tell the team what you felt</h3>
        <div class="ios-list">${['A', 'B', 'C', 'D'].map(function (k) { return h`<label class="ios-row hx-check"><input type="checkbox" data-hxfelt="${k}"><span class="ios-rt"><b>I felt a tick on ${k}</b></span></label>`; })}</div>
        <p class="ios-gf">Take a screenshot of this sheet and send it to the team.</p></div>
    </div>`, { label: 'Haptics test', head: 'Haptics test' });
    if (F.hapticTap && F.hapticTap.enhance) requestAnimationFrame(function () { F.hapticTap.enhance(); });
  };
  F.actions.hxA = function () { log('A  script click ' + (progClick() ? 'sent' : 'failed')); };
  F.actions.hxB = function (el) { log('B  real switch ' + (el.checked ? 'on' : 'off')); };
  F.actions.hxC = function (el, e) { log('C  overlay tap ' + (e && e.target && e.target.classList && e.target.classList.contains('hx-ov') ? 'landed on the switch' : 'landed on the button (no overlay)')); };
  F.actions.hxD = function () { log('D  waiting'); setTimeout(function () { log('D  script click ' + (progClick() ? 'sent' : 'failed')); }, 500); };
  document.addEventListener('change', function (e) { var k = e.target && e.target.dataset && e.target.dataset.hxfelt; if (k) log('Felt ' + k + ': ' + (e.target.checked ? 'yes' : 'no')); });
})(window.Folio);
