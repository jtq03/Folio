/* Folio haptics test sheet. Adds "Test haptics" to the Prototype section of About me.
   Load after native.js and app.js. Reads Folio.native.haptics (the engine in native.js). */
(function (F) {
  if (!F || !F.native) return;
  var N = F.native, H = N.haptics || {}, U = F.UI, esc = U.esc;
  var KINDS = ['light', 'medium', 'heavy', 'success', 'warning', 'error', 'selection'];
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function clock() { var d = new Date(); return [d.getHours(), d.getMinutes(), d.getSeconds()].map(function (n) { return ('0' + n).slice(-2); }).join(':'); }
  function standalone() { try { return !!(navigator.standalone || matchMedia('(display-mode: standalone)').matches); } catch (e) { return false; } }
  function yn(b) { return b ? 'Yes' : 'No'; }
  function envRows() {
    var ua = navigator.userAgent, sv = /Version\/(\d+(?:\.\d+)?)/.exec(ua);
    return [
      ['iOS version (user agent)', H.iosVersion ? H.iosVersion + (H.iosVersion === '18.6' ? ' (Safari 26 and later report 18.6)' : '') : 'Not iOS'],
      ['Safari version', sv ? sv[1] : 'Not shown (home screen app)'],
      ['Opened from home screen', yn(standalone())],
      ['Switch control', H.switchSupport ? 'Yes (' + H.switchSupport + ')' : 'Not detected'],
      ['navigator.vibrate', yn(H.vibrate)],
      ['Reduce motion', yn(N.reduced && N.reduced())],
      ['Haptic route', H.canSwitch ? 'Switch (label click)' : H.vibrate ? 'Vibrate' : 'None']
    ];
  }
  function sheetHtml() {
    return '<div class="hx-test">' +
      '<p class="ios-cap">Tap each button and note what you feel. Take a screenshot of the log to share the results.</p>' +
      '<div class="ios-list">' + envRows().map(function (r) { return '<div class="ios-row"><span class="ios-rt"><b>' + esc(r[0]) + '</b></span><span class="ios-detail">' + esc(r[1]) + '</span></div>'; }).join('') + '</div>' +
      '<h3 class="ios-gh"><span>Tap test</span></h3>' +
      '<div class="hx-grid">' + KINDS.map(function (k) { return '<button type="button" class="hx-btn" data-hx-kind="' + k + '">' + cap(k) + '</button>'; }).join('') + '</div>' +
      '<h3 class="ios-gh"><span>Control test</span></h3>' +
      '<div class="ios-list"><label class="ios-row"><span class="ios-rt"><b>Real switch</b><small>A genuine iPhone switch. Tap it.</small></span><input type="checkbox" switch class="hx-real" aria-label="Real switch"></label></div>' +
      '<div class="ios-list"><button type="button" class="ios-row" data-hx-seq><span class="ios-rt"><b>Run sequence</b><small>Timer test: plays every kind 0.5 s apart. May stay silent even when taps work.</small></span></button></div>' +
      '<h3 class="ios-gh"><span>Log</span></h3><div class="hx-log" role="log" aria-live="polite"></div>' +
      '<p class="ios-gf">If nothing buzzes: iPhone Settings, Sounds &amp; Haptics, System Haptics must be on; Low Power Mode can disable haptics; iOS 18 or later is needed.</p>' +
      '<p class="ios-gf">How to read it. Real switch buzzes but the buttons do not: iOS is blocking haptics started by code (Apple closed this in iOS 26.5), so only real switches buzz. Both buzz: haptics work. Neither buzzes: the phone setting, Low Power Mode or the iOS version is the cause.</p>' +
      '</div>';
  }
  function log(box, line) { var d = document.createElement('div'); d.textContent = line; box.insertBefore(d, box.firstChild); }
  function describe(r, how) {
    if (r.route === 'label click') return r.kind + ': fired via label click' + (r.toggled ? '' : ' (switch did not toggle: blocked)') + ' at ' + clock() + how;
    if (r.route === 'vibrate') return r.kind + ': fired via vibrate' + (r.toggled ? '' : ' (refused)') + ' at ' + clock() + how;
    return r.kind + ': not fired (' + (r.note || 'no haptic API') + ') at ' + clock() + how;
  }
  var warned = false;
  function open() {
    var sheet = U.modal({ s: sheetHtml() }, { head: 'Test haptics', label: 'Test haptics' });
    if (!sheet) return; var box = sheet.querySelector('.hx-log'), seqT = [];
    sheet.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-hx-kind]');
      if (b) {
        var r = H.play(b.dataset.hxKind, { force: true }); log(box, describe(r, ' (tap test)'));
        if (!warned && (r.route === 'none' || r.toggled === false)) { warned = true; U.toast('This phone blocked the haptic. Try the real switch.'); }
        return;
      }
      if (e.target.closest && e.target.closest('[data-hx-seq]')) {
        seqT.forEach(clearTimeout); seqT = [];
        KINDS.forEach(function (k, i) { seqT.push(setTimeout(function () { if (box.isConnected) log(box, describe(H.play(k, { force: true }), ' (timer test)')); }, i * 500)); });
      }
    });
    sheet.addEventListener('change', function (e) {
      if (e.target.matches && e.target.matches('.hx-real')) log(box, 'real switch: turned ' + (e.target.checked ? 'on' : 'off') + ' by your tap at ' + clock() + (H.switchSupport ? ' (system haptic)' : ' (no switch control here)'));
    });
  }
  document.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('[data-hx-open]')) open(); });
  function addRow() {
    var hd = document.getElementById('d-h'), sec = hd && hd.closest('section'), list = sec && sec.querySelector('.ios-list');
    if (!list || list.querySelector('[data-hx-open]')) return;
    var b = document.createElement('button'); b.type = 'button'; b.className = 'ios-row'; b.setAttribute('data-hx-open', ''); b.setAttribute('data-hx', '');
    b.innerHTML = '<span class="ios-rt"><b>Test haptics</b><small>Check vibration on this phone</small></span>';
    list.appendChild(b);
  }
  document.addEventListener('folio:rendered', function (e) { try { if (e.detail && e.detail.route === '/about') addRow(); } catch (x) {} });
  try { if (location.hash.indexOf('#/about') === 0) addRow(); } catch (x) {}
})(window.Folio);
