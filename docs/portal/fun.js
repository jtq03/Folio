/* Portal fun layer: motion and small moments. Runs after each render via createApp's after hook.
   Only animates on real navigation or a real event, never on a store re-render. Transform and opacity only. */
(function (F) {
  var U = F.UI, S = F.Store;
  function reduced() { try { return document.documentElement.dataset.motion === 'reduce' || matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }
  var lastBubble = null;

  /* Sidebar selection bubble: the shell re-renders, so the bubble glides from where it last was (FLIP) */
  function bubble(root) {
    var nav = document.querySelector('.nav'), b = nav && nav.querySelector('.nav-bubble'), on = nav && nav.querySelector('.nav-i.on');
    if (!b) return;
    if (!on) { b.style.opacity = '0'; return; }
    var nr = nav.getBoundingClientRect(), r = on.getBoundingClientRect();
    var pos = { x: r.left - nr.left + nav.scrollLeft, y: r.top - nr.top + nav.scrollTop, w: r.width, h: r.height };
    b.style.width = pos.w + 'px'; b.style.height = pos.h + 'px';
    var to = 'translate(' + pos.x + 'px,' + pos.y + 'px)';
    if (lastBubble && !reduced() && (lastBubble.x !== pos.x || lastBubble.y !== pos.y) && b.animate) {
      b.animate([{ transform: 'translate(' + lastBubble.x + 'px,' + lastBubble.y + 'px)', width: lastBubble.w + 'px' }, { transform: to, width: pos.w + 'px' }], { duration: 420, easing: 'cubic-bezier(.3,1.25,.5,1)' });
      on.classList.add('fx-pop');
    }
    b.style.transform = to; b.style.opacity = '1';
    lastBubble = pos;
    var side = document.querySelector('.side');
    if (side && side.scrollWidth > side.clientWidth && on.scrollIntoView) { try { on.scrollIntoView({ block: 'nearest', inline: 'center' }); } catch (e) {} }
  }
  window.addEventListener('resize', function () { lastBubble = null; bubble(); });

  /* Count-up numbers on Home stats */
  function countUp(root) {
    if (reduced()) return;
    root.querySelectorAll('[data-count]').forEach(function (el) {
      var end = parseFloat(el.dataset.count), dec = (el.dataset.count.split('.')[1] || '').length, t0 = performance.now(), dur = 900;
      if (!end) return;
      el.textContent = (0).toFixed(dec);
      (function step(t) { var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = (end * e).toFixed(dec); if (k < 1 && el.isConnected) requestAnimationFrame(step); else el.textContent = el.dataset.count; })(t0);
    });
  }

  /* Paper confetti from a point */
  var COLS = ['#92AFD7', '#E9DCC3', '#C5D1EB', '#395B50', '#D8E3D2', '#CE3B3B', '#1F2F16'];
  function confetti(el, n) {
    if (reduced() || !el || !document.body.animate) return;
    var r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, box = document.createElement('div');
    box.className = 'fx-layer'; box.setAttribute('aria-hidden', 'true'); document.body.appendChild(box);
    for (var i = 0; i < (n || 34); i++) {
      var b = document.createElement('i'), a = Math.random() * Math.PI * 2, d = 80 + Math.random() * 170, dx = Math.cos(a) * d, dy = Math.sin(a) * d - 40;
      b.className = 'fx-bit' + (i % 3 === 0 ? ' c' : ''); b.style.background = COLS[i % COLS.length]; b.style.left = cx + 'px'; b.style.top = cy + 'px';
      box.appendChild(b);
      b.animate([{ transform: 'translate(0,0) rotate(0) scale(.4)', opacity: 0 }, { offset: .15, opacity: 1 }, { offset: .6, transform: 'translate(' + dx + 'px,' + dy + 'px) rotate(' + (Math.random() * 500 - 250) + 'deg) scale(1)', opacity: 1 },
        { transform: 'translate(' + dx * 1.1 + 'px,' + (dy + 120) + 'px) rotate(' + (Math.random() * 720 - 360) + 'deg) scale(.7)', opacity: 0 }], { duration: 1100 + Math.random() * 500, easing: 'cubic-bezier(.15,.75,.35,1)', fill: 'both' });
    }
    setTimeout(function () { box.remove(); }, 1800);
  }
  F.fx = { confetti: confetti };

  /* Visit sign-off finale */
  function finale(root) {
    var st = root.querySelector('.done-sheet .stamp'); if (!st) return;
    var av = root.querySelector('.done-av');
    if (reduced()) { st.classList.add('fx-calm'); return; }
    st.classList.add('slam', 'fx-ink');
    setTimeout(function () { confetti(st, 40); if (av) av.classList.add('fx-hop'); }, 380);
  }

  /* Toasts: friendly paper icon and a bounce (CSS) */
  var base = U.toast, PAPER = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h8l5 5v13H6z"/><path d="M14 3v5h5"/></svg>';
  U.toast = function (msg, withStar) {
    var box = document.getElementById('toasts'); base(msg, withStar);
    var t = box && box.lastElementChild; if (!t || withStar) return;
    var i = document.createElement('span'); i.className = 'fx-ticon'; i.setAttribute('aria-hidden', 'true'); i.innerHTML = PAPER; t.insertBefore(i, t.firstChild);
  };

  /* Empty states: a small paper-cut folder with a floating star */
  U.empty = function (title, body) {
    return U.h`<div class="empty"><div class="empty-art" aria-hidden="true"><span class="ea-back"></span><span class="ea-sheet"></span><span class="ea-front"></span><span class="ea-star">${U.star(18)}</span></div><h3>${title}</h3><p>${body}</p></div>`;
  };

  /* Profile avatar: a gentle reaction on click */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('.hero-av'); if (!a || reduced()) return;
    a.classList.remove('fx-wig'); void a.offsetWidth; a.classList.add('fx-wig');
  });

  /* Loops pause when the tab is hidden */
  document.addEventListener('visibilitychange', function () { document.documentElement.classList.toggle('fx-hidden', document.hidden); });

  F.fx.after = function (root, loc, isNav) {
    bubble(root);
    if (!isNav) return;
    if (loc.path === '/') countUp(root);
    finale(root);
  };
})(window.Folio);
