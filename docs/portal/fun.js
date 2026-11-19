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

  /* Home staircase popover: level name and who is on that step. One paper popover on <body> (position fixed),
     so the card edge never clips it. Shown on hover, on keyboard focus, and on a first touch tap (a second tap
     follows the link). Placed above the step, flipped below when there is no room, and slid sideways to stay
     inside the card. The link's aria-label already says the same, so the popover is aria-hidden. */
  var pop = null, popFor = null, touchArmed = null;
  function popEl() {
    if (pop && pop.isConnected) return pop;
    pop = document.createElement('div'); pop.className = 'fx-pop'; pop.setAttribute('aria-hidden', 'true'); pop.id = 'fx-pop';
    document.body.appendChild(pop); return pop;
  }
  function stepLevel(a) { var m = /[?&]lv=(\d+)/.exec(a.getAttribute('href') || ''); return m ? +m[1] : 0; }
  function popHtml(n) {
    var L = (F.LEVELS || []).filter(function (l) { return l.n === n; })[0], st = S.get(), sel = S.sel;
    var who = (st.patients || []).filter(function (p) { return p.level === n; });
    var people = who.length ? '<ul class="fx-pop-who">' + who.map(function (p) { return '<li>' + U.avatar(p, 24).s + '<span>' + U.esc(sel.full(p)) + '</span></li>'; }).join('') + '</ul>'
      : '<p class="fx-pop-none">No one yet</p>';
    return '<span class="fx-pop-eb">Level ' + n + (who.length ? ' · ' + who.length + (who.length === 1 ? ' patient' : ' patients') : '') + '</span>' +
      '<b class="fx-pop-t">' + U.esc(L ? L.name : '') + '</b>' + people + '<i class="fx-pop-ar"></i>';
  }
  function place(a) {
    var el = popEl(), r = a.getBoundingClientRect(), card = a.closest('.sec') || document.body, cr = card.getBoundingClientRect();
    var vw = document.documentElement.clientWidth, vh = window.innerHeight, gap = 10;
    var lo = Math.max(8, cr.left + 8), hi = Math.min(vw - 8, cr.right - 8);
    el.style.maxWidth = Math.max(160, Math.min(240, hi - lo)) + 'px';
    var w = el.offsetWidth, ht = el.offsetHeight, cx = r.left + r.width / 2;
    var left = Math.min(Math.max(cx - w / 2, lo), hi - w); left = Math.max(8, left);
    /* The count chip sits above the step: start above it */
    var chip = a.querySelector('.cnt'), topEdge = chip ? Math.min(r.top, chip.getBoundingClientRect().top) : r.top;
    var top = topEdge - gap - ht, below = top < 8;
    if (below) top = Math.min(r.bottom + gap, vh - ht - 8);
    el.classList.toggle('below', below);
    el.style.left = Math.round(left) + 'px'; el.style.top = Math.round(top) + 'px';
    el.style.setProperty('--ax', Math.round(Math.min(Math.max(cx - left, 14), w - 14)) + 'px');
  }
  function showPop(a) {
    var n = stepLevel(a); if (!n) return;
    var el = popEl(); if (popFor !== a) { if (popFor) popFor.classList.remove('fx-pop-on'); el.innerHTML = popHtml(n); }
    popFor = a; a.classList.add('fx-pop-on'); el.classList.add('on'); place(a);
  }
  function hidePop() {
    if (popFor) popFor.classList.remove('fx-pop-on');
    popFor = null; touchArmed = null; if (pop) pop.classList.remove('on');
  }
  function stepOf(t) { return t && t.closest ? t.closest('.stairs-live li a') : null; }
  document.addEventListener('pointerover', function (e) { if (e.pointerType === 'touch') return; var a = stepOf(e.target); if (a) showPop(a); });
  document.addEventListener('pointerout', function (e) { if (e.pointerType === 'touch') return; var a = stepOf(e.target); if (a && !a.contains(e.relatedTarget) && document.activeElement !== a) hidePop(); });
  document.addEventListener('focusin', function (e) { var a = stepOf(e.target); if (a) showPop(a); else if (popFor) hidePop(); });
  document.addEventListener('focusout', function (e) { var a = stepOf(e.target); if (a && !stepOf(e.relatedTarget)) hidePop(); });
  document.addEventListener('pointerdown', function (e) { if (e.pointerType === 'touch') touchArmed = touchArmed && stepOf(e.target) === touchArmed ? touchArmed : null; });
  document.addEventListener('click', function (e) {
    var a = stepOf(e.target);
    if (!a) { if (popFor) hidePop(); return; }
    /* Touch: the first tap shows who is on the step, the second tap opens the Patients list */
    if (matchMedia('(hover: none)').matches && touchArmed !== a) { e.preventDefault(); showPop(a); touchArmed = a; return; }
    hidePop();
  }, true);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && popFor) hidePop(); });
  window.addEventListener('scroll', function () { if (popFor) place(popFor); }, true);
  window.addEventListener('resize', function () { if (popFor) place(popFor); });
  window.addEventListener('hashchange', hidePop);

  /* Loops pause when the tab is hidden */
  document.addEventListener('visibilitychange', function () { document.documentElement.classList.toggle('fx-hidden', document.hidden); });

  F.fx.after = function (root, loc, isNav) {
    bubble(root);
    /* A store re-render swaps the steps: keep the popover on the new node for the same level, or close it */
    if (popFor && !popFor.isConnected) {
      var n = stepLevel(popFor), again = n && document.querySelector('.stairs-live li a[href$="lv=' + n + '"]');
      popFor = null; if (again && !isNav && (again.matches(':hover') || document.activeElement === again)) showPop(again); else hidePop();
    }
    if (!isNav) return;
    /* Count-up removed: it showed wrong numbers (0) for the first second, and clinicians read these at a glance */
    finale(root);
  };
})(window.Folio);
