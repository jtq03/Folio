/* Folio real-switch haptics.
   On current iOS a script can no longer make the Taptic Engine fire (a programmatic click on a hidden switch is
   ignored). A finger that lands on a real, rendered <input type="checkbox" switch> still gets the system tick.
   So each pressable control gets an almost invisible native switch laid over it. The finger toggles that switch
   (iOS plays its haptic), the click still bubbles to the control with isTrusted intact, and the switch is reset.

   Rules that keep the app working exactly as before:
   - The overlay never keeps focus, is hidden from assistive tech and is out of the tab order. VoiceOver and
     keyboard users still operate the original control.
   - Scrolls, long presses, swipes and edge swipes start on the overlay like on any element: native switches only
     toggle on a tap.
   - App handlers may call preventDefault on the click (the router does). That would cancel the switch toggle and
     its haptic, so for overlay clicks preventDefault only records the wish; the switch's own activation means a
     link under it never navigates by itself. Unhandled links and submit buttons are then followed here, once.
   - N.haptic calls in the same tap are skipped, so a tap never ticks twice (the programmatic engine stays as the
     fallback for older iOS and Android). */
(function (F) {
  var N = F.native || {}, doc = document;
  /* Safest set first (tab bar, primary buttons such as Practise and level-up Continue, opt-in controls).
     Wider set to try after real-device checks: .ios-nbtn, .ios-add, .ios-seg button, button.ios-row, a.ios-row, .ios-as-btn */
  var HOSTS = '.ios-tabs a, button.ios-btn, [data-haptic-tap]';
  var SKIP = '.ios-swipe-actions button, [disabled], label, .ios-update';
  var supported = (function () { try { var i = doc.createElement('input'); i.type = 'checkbox'; i.setAttribute('switch', ''); return 'switch' in i || (window.CSS && CSS.supports && CSS.supports('-webkit-appearance', 'switch')); } catch (e) { return false; } })();
  /* Only touch devices benefit; a mouse never gets a haptic and keeps plain hover behaviour */
  var touch = (window.matchMedia && matchMedia('(pointer: coarse)').matches) || navigator.maxTouchPoints > 0;
  var lastTap = 0, stats = { added: 0, taps: 0 };
  F.hapticTap = { stats: stats, supported: supported, enabled: touch };

  function overlay() {
    var i = doc.createElement('input'); i.type = 'checkbox'; i.setAttribute('switch', ''); i.className = 'hx-ov';
    i.tabIndex = -1; i.setAttribute('aria-hidden', 'true'); i.setAttribute('data-hx', ''); return i;
  }
  function enhance(root) {
    if (!touch) return;
    var list = (root || doc).querySelectorAll(HOSTS);
    for (var k = 0; k < list.length; k++) {
      var el = list[k];
      if (el.matches(SKIP) || el.closest('.ios-ctx-row, [aria-hidden="true"]')) continue;
      var last = el.lastElementChild; if (last && last.hasAttribute('data-hx')) continue;
      var old = el.querySelector(':scope > .hx-ov'); if (old) old.remove(); /* keep it last so it sits on top */
      if (getComputedStyle(el).position === 'static') el.classList.add('hx-host');
      el.appendChild(overlay()); stats.added++;
    }
  }
  F.hapticTap.enhance = enhance;
  function hostOf(t) { return t && t.closest && t.parentElement ? t.parentElement : null; }

  /* Focus would move to the overlay on some engines; keep it where it was (no scroll, keyboard stays) */
  doc.addEventListener('mousedown', function (e) { if (e.target.classList && e.target.classList.contains('hx-ov')) e.preventDefault(); }, true);
  doc.addEventListener('focusin', function (e) { if (e.target.classList && e.target.classList.contains('hx-ov')) { try { e.target.blur(); } catch (x) {} } }, true);

  window.addEventListener('click', function (e) {
    var t = e.target; if (!t || !t.classList || !t.classList.contains('hx-ov')) return;
    lastTap = Date.now(); stats.taps++;
    var host = hostOf(t); e.__hxHost = host; e.__hxPrevented = false;
    if (!e.isTrusted) return;
    try { Object.defineProperty(e, 'preventDefault', { configurable: true, value: function () { e.__hxPrevented = true; } }); } catch (x) {}
  }, true);
  /* After every handler has run: follow a link or submit a form nobody handled */
  window.addEventListener('click', function (e) {
    var host = e.__hxHost; if (!host || !e.isTrusted || e.__hxPrevented || e.cancelBubble) return;
    if (host.tagName === 'A') {
      var href = host.getAttribute('href'); if (!href || href === '#') return;
      if (host.target === '_blank') window.open(host.href, '_blank', 'noopener'); else location.href = host.href;
    } else if (host.tagName === 'BUTTON' && host.type === 'submit' && host.form) {
      if (host.form.requestSubmit) host.form.requestSubmit(host); else host.form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }
  });
  /* The overlay's own change and input events never reach the app; the switch is reset for the next tap */
  ['change', 'input'].forEach(function (n) {
    window.addEventListener(n, function (e) { var t = e.target; if (t && t.classList && t.classList.contains('hx-ov')) { e.stopPropagation(); t.checked = false; } }, true);
  });
  /* A click that the swipe or long-press guards stopped still toggled: reset it */
  doc.addEventListener('click', function (e) { var t = e.target; if (t && t.classList && t.classList.contains('hx-ov') && e.cancelBubble) t.checked = false; }, true);

  /* Skip the programmatic tick in the same tap (the real switch already ticked) */
  if (typeof N.haptic === 'function' && !N.haptic.__hx) {
    var orig = N.haptic;
    N.haptic = function (kind) { if (Date.now() - lastTap < 350 && kind !== 'success') return; return orig.apply(this, arguments); };
    N.haptic.__hx = true; N.haptic.orig = orig;
  }

  /* Enhance after each render and patch, and when sheets or menus open. Batched to one pass per frame. */
  var queued = false;
  function soon() { if (queued) return; queued = true; requestAnimationFrame(function () { queued = false; enhance(); }); }
  doc.addEventListener('folio:rendered', soon);
  function watch() {
    var mr = doc.getElementById('modal-root'); if (mr && window.MutationObserver) new MutationObserver(soon).observe(mr, { childList: true });
    var lv = doc.querySelector('.ios-lvhost'); if (lv && window.MutationObserver) new MutationObserver(soon).observe(lv, { childList: true });
    soon();
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', watch); else watch();
  /* Fun add-ons (stickers, card) mount after the app's render event; one extra pass picks them up */
  window.addEventListener('load', function () { setTimeout(soon, 300); });
})(window.Folio);
