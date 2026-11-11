/* Folio portal opening intro. A full-viewport desktop take on docs/app/intro.js (that file stays phone-sized).
   Plays once per browser session, click, tap, Esc, Enter or Space skips it. About 2.4s: three paper layers drop in
   with soft thuds, the red star spins in with a small paper burst, "folio" is written with a pen nib, the tagline
   fades in, then the whole sheet turns away like a page to reveal the portal. The first frame is the page
   background (beige paper with grain), so nothing flashes. Transform and opacity only, through the Web Animations
   API, and every node and listener is removed at the end. Reduced motion gets a calm 500ms fade.
   API: FolioIntro.boot() (inline, once per session), .play({force:true}) to replay, .skip(). */
(function () {
  var KEY = 'folio.portal.intro.v1';
  var NS = 'http://www.w3.org/2000/svg';
  var STAR_MARK = '<g fill="#CE3B3B"><rect x="-1.8" y="-9" width="3.6" height="18" rx="1.8"/><rect x="-1.8" y="-9" width="3.6" height="18" rx="1.8" transform="rotate(60)"/><rect x="-1.8" y="-9" width="3.6" height="18" rx="1.8" transform="rotate(120)"/></g>';
  var STAR_WORD = '<g fill="#CE3B3B"><rect x="-2" y="-11" width="4" height="22" rx="2"/><rect x="-2" y="-11" width="4" height="22" rx="2" transform="rotate(60)"/><rect x="-2" y="-11" width="4" height="22" rx="2" transform="rotate(120)"/></g>';
  var NIB = '<svg class="fi-nib" viewBox="0 0 24 24"><path d="M8.6 0h6.8v5.2H8.6z" fill="#395B50"/><path class="fi-nb" d="M12 24 6.6 12.6c-.5-3 .4-5.6 2.2-7.4h6.4c1.8 1.8 2.7 4.4 2.2 7.4z"/><path class="fi-ns" d="M12 24v-10" stroke-width=".9"/><circle class="fi-nh" cx="12" cy="12.6" r="1.3"/><path d="M9.6 6.4c-.9 1.4-1.3 3-1.1 4.8" stroke="#92AFD7" stroke-width=".9" fill="none" stroke-linecap="round"/></svg>';
  /* Timeline in ms from the first moving frame */
  var T = { land: [500, 640, 780], star: 800, write: 960, writeDur: 600, fillLag: 120, tag: 1560, exit: 1960, exitDur: 560 };

  var cur = null;

  function reduced() {
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.getAttribute('data-motion') === 'reduce'; } catch (e) { return false; }
  }
  function seen() { try { return sessionStorage.getItem(KEY) === '1'; } catch (e) { return false; } }
  function markSeen() { try { sessionStorage.setItem(KEY, '1'); } catch (e) {} }
  function svg(cls, vb, body) { return '<svg class="' + cls + '" viewBox="' + vb + '" aria-hidden="true">' + body + '</svg>'; }
  function letters(withStar) {
    return '<span>f</span><span>o</span><span>l</span><span class="fi-ri">ı' + (withStar ? svg('fi-istar', '-12 -12 24 24', STAR_WORD) : '') + '</span><span>o</span>';
  }
  function frauncesReady() {
    var ok = false;
    try { document.fonts.forEach(function (f) { if (/Fraunces/i.test(f.family) && f.status === 'loaded' && (f.weight === '600' || / /.test(f.weight))) ok = true; }); } catch (e) {}
    return ok;
  }
  function loadFonts() { try { document.fonts.load('600 72px "Fraunces"'); document.fonts.load('500 12px "Prompt"'); } catch (e) {} }

  function mount() {
    var el = document.createElement('div');
    el.className = 'fi fi-fixed fi-portal';
    el.setAttribute('aria-hidden', 'true');
    var bits = '';
    for (var i = 0; i < 12; i++) bits += '<i class="fi-bit' + (i >= 8 ? ' ln' : '') + '"></i>';
    el.innerHTML = '<div class="fi-sheet"><div class="fi-lock">' +
      '<i class="fi-sh fi-sh1"></i><i class="fi-sh fi-sh2"></i><i class="fi-sh fi-sh3"></i><i class="fi-bl fi-sh1"></i><i class="fi-bl fi-sh2"></i><i class="fi-bl fi-sh3"></i><i class="fi-c fi-c1"></i><i class="fi-c fi-c2"></i><i class="fi-c fi-c3"></i>' +
      bits + svg('fi-star', '-12 -12 24 24', STAR_MARK) +
      '<div class="fi-word"><div class="fi-w fi-w0">' + letters(true) + '</div>' +
      '<div class="fi-clip fi-cl"><div class="fi-w fi-wl">' + letters(false) + '</div></div>' +
      '<div class="fi-clip fi-cf"><div class="fi-w fi-wf">' + letters(false) + '</div></div>' +
      '<div class="fi-w fi-ws">' + letters(true) + '</div>' + NIB + '</div>' +
      '<div class="fi-tag">Your story, carried forward</div>' +
      '</div><i class="fi-curl"></i></div><i class="fi-shade"></i>';
    document.body.appendChild(el);
    var W = window.innerWidth || 1280, H = window.innerHeight || 800;
    /* The mark is about a fifth of the short side on a desktop window; the lockup (1.605 marks tall plus the tagline) is centred */
    var s = Math.round(Math.max(110, Math.min(230, Math.min(W, H) * 0.21)) * 10) / 10;
    var lock = el.querySelector('.fi-lock');
    var top = H / 2 - 0.95 * s;
    el.style.setProperty('--s', s + 'px');
    lock.style.left = ((W - s) / 2) + 'px';
    lock.style.top = top + 'px';
    return { el: el, s: s, W: W, H: H, top: top, q: function (c) { return el.querySelector(c); }, qa: function (c) { return el.querySelectorAll(c); } };
  }

  function start(opts) {
    opts = opts || {};
    if (cur) return cur.done;
    var m = mount();
    var c = cur = { m: m, anims: [], timers: [], ended: false, out: false, rm: opts.reduced != null ? !!opts.reduced : reduced(), onDone: opts.onDone };
    c.done = new Promise(function (res) { c.resolve = res; });
    loadFonts();

    function A(node, kf, o) {
      if (!node || !node.animate) return null;
      var a = node.animate(kf, o); c.anims.push(a); return a;
    }
    function later(fn, ms) { c.timers.push(setTimeout(function () { if (!c.ended) fn(); }, ms)); }
    c.A = A; c.later = later;

    c.onTap = function (e) { if (e && e.cancelable) e.preventDefault(); skip(); };
    c.onKey = function (e) { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); e.stopPropagation(); skip(); } };
    m.el.addEventListener('pointerdown', c.onTap);
    m.el.addEventListener('click', c.onTap);
    document.addEventListener('keydown', c.onKey, true);

    var go = function () {
      if (c.ended) return;
      if (opts.reduced == null) c.rm = reduced();
      if (c.rm) calm(c); else full(c);
    };
    if (document.readyState === 'loading' && !opts.now) document.addEventListener('DOMContentLoaded', function () { requestAnimationFrame(go); }, { once: true });
    else requestAnimationFrame(go);
    return c.done;
  }

  /* Reduced motion: the finished lockup, tagline faded in, then a calm 500ms fade. No movement. */
  function calm(c) {
    var q = c.m.q;
    c.m.el.classList.add('calm');
    c.A(q('.fi-tag'), [{ opacity: 0 }, { opacity: 1 }], { duration: 300, fill: 'forwards' });
    c.later(function () { exit(c, true); }, 700);
  }

  function full(c) {
    var m = c.m, q = m.q, A = c.A, s = m.s;
    m.el.classList.add('run');
    var t0 = document.timeline ? document.timeline.currentTime : null;
    c.t0 = t0;
    var all = function (a) { if (a && t0 != null) a.startTime = t0; return a; };

    /* 1. Three paper layers drop onto the sheet, back card last, each landing with a small squash (the thud) */
    var cards = [q('.fi-c1'), q('.fi-c2'), q('.fi-c3')], shs = [q('.fi-sh1'), q('.fi-sh2'), q('.fi-sh3')], bls = m.qa('.fi-bl');
    var rot = [-6, 5, -4], fall = s * 1.4;
    cards.forEach(function (card, i) {
      var land = T.land[i], dropAt = land - 300, tot = land + 220;
      var o = function (t) { return Math.max(0, t) / tot; };
      all(A(card, [
        { offset: 0, transform: 'translate(' + -rot[i] * 2 + 'px,' + -fall + 'px) rotate(' + rot[i] * 1.5 + 'deg)', opacity: 0 },
        { offset: o(dropAt), transform: 'translate(' + -rot[i] * 2 + 'px,' + -fall + 'px) rotate(' + rot[i] * 1.5 + 'deg)', opacity: 0, easing: 'cubic-bezier(.5,0,.85,.55)' },
        { offset: o(dropAt + 90), opacity: 1 },
        { offset: o(land), transform: 'translate(0,0) rotate(0) scale(1.05,.9)', opacity: 1, easing: 'cubic-bezier(.3,.7,.4,1)' },
        { offset: o(land + 70), transform: 'translate(0,' + -s * 0.035 + 'px) rotate(' + -rot[i] * 0.15 + 'deg) scale(.98,1.03)', easing: 'ease-in-out' },
        { offset: 1, transform: 'none', opacity: 1 }
      ], { duration: tot, fill: 'both' }));
      /* rest shadow appears once the card is down */
      all(A(shs[i], [
        { offset: 0, opacity: 0 },
        { offset: (land - 10) / tot, opacity: 0 },
        { offset: 1, opacity: 1 }
      ], { duration: tot, fill: 'both' }));
      /* falling shadow: a soft blob that tightens and darkens as the card comes down */
      all(A(bls[i], [
        { offset: 0, opacity: 0, transform: 'scale(1.7)' },
        { offset: o(dropAt + 40), opacity: 0, transform: 'scale(1.7)', easing: 'cubic-bezier(.5,0,.85,.55)' },
        { offset: land / tot, opacity: 1, transform: 'scale(.96)' },
        { offset: 1, opacity: 0, transform: 'scale(1)' }
      ], { duration: tot, fill: 'both' }));
    });
    /* each landing nudges the whole lockup down a hair, so the thud reads on a big screen */
    T.land.forEach(function (t, i) {
      all(A(q('.fi-lock'), [{ transform: 'none' }, { offset: 0.35, transform: 'translateY(' + s * (0.012 - i * 0.002) + 'px)' }, { transform: 'none' }],
        { duration: 200, delay: t, easing: 'ease-out' }));
    });

    /* Hide the writing layers until their turn */
    ['.fi-wl', '.fi-wf', '.fi-ws'].forEach(function (k) { all(A(q(k), [{ opacity: 0 }, { opacity: 0 }], { duration: T.write, fill: 'backwards' })); });
    all(A(q('.fi-ws .fi-istar'), [{ opacity: 0 }, { opacity: 0 }], { duration: T.write + 400, fill: 'backwards' }));

    /* 3. The star spins in, overshoots and throws a few paper bits */
    var sd = 440, peak = 0.55;
    all(A(q('.fi-star'), [
      { offset: 0, transform: 'rotate(-220deg) scale(0)', opacity: 0, easing: 'cubic-bezier(.2,.7,.3,1)' },
      { offset: 0.12, opacity: 1 },
      { offset: peak, transform: 'rotate(16deg) scale(1.28)', opacity: 1, easing: 'cubic-bezier(.4,0,.4,1)' },
      { offset: 0.8, transform: 'rotate(-5deg) scale(.94)', easing: 'ease-in-out' },
      { offset: 1, transform: 'none', opacity: 1 }
    ], { duration: sd, delay: T.star, fill: 'forwards' }));
    var burst = T.star + sd * peak - 30;
    var cols = ['#92AFD7', '#395B50', '#CE3B3B', '#C5D1EB', '#1F2F16', '#92AFD7', '#CE3B3B', '#395B50'];
    var bits = m.qa('.fi-bit');
    for (var i = 0; i < bits.length; i++) {
      var b = bits[i], ln = i >= 8, ang, d, kf;
      if (ln) {
        ang = -60 + (i - 8) * 48; d = s * 0.32;
        kf = [
          { transform: 'rotate(' + ang + 'deg) translateY(' + -s * 0.14 + 'px) scaleY(.2)', opacity: 0 },
          { offset: 0.25, transform: 'rotate(' + ang + 'deg) translateY(' + -s * 0.22 + 'px) scaleY(1)', opacity: 1 },
          { transform: 'rotate(' + ang + 'deg) translateY(' + -d + 'px) scaleY(.1)', opacity: 0 }
        ];
        A(b, kf, { duration: 380, delay: burst, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'both' });
      } else {
        ang = (-170 + i * 38 + (i % 2) * 14) * Math.PI / 180; d = s * (0.3 + (i % 3) * 0.09);
        var dx = Math.cos(ang) * d, dy = Math.sin(ang) * d, sp = (i % 2 ? 1 : -1) * (160 + i * 25);
        b.style.background = cols[i];
        kf = [
          { transform: 'translate(0,0) rotate(0) scale(.4)', opacity: 0 },
          { offset: 0.12, opacity: 1 },
          { offset: 0.6, transform: 'translate(' + dx + 'px,' + dy + 'px) rotate(' + sp * 0.8 + 'deg) scale(1)', opacity: 1, easing: 'ease-in' },
          { transform: 'translate(' + dx * 1.1 + 'px,' + (dy + s * 0.14) + 'px) rotate(' + sp + 'deg) scale(.7)', opacity: 0 }
        ];
        A(b, kf, { duration: 560 + (i % 3) * 60, delay: burst, easing: 'cubic-bezier(.15,.75,.35,1)', fill: 'both' });
      }
      all(c.anims[c.anims.length - 1]);
    }
    /* 4. The wordmark: decide on the font just before it is needed */
    c.later(function () { word(c, frauncesReady()); }, T.write - 60);

    /* 5. Tagline */
    all(A(q('.fi-tag'), [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 380, delay: T.tag, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'both' }));

    /* 6. Exit */
    c.later(function () { exit(c, false); }, T.exit);
  }

  function word(c, pen) {
    var m = c.m, q = m.q, A = c.A, s = m.s, t0 = c.t0;
    var at = function (a) { if (a && t0 != null) a.startTime = t0; return a; };
    var fs = s * 0.5735;
    var istar = q('.fi-ws .fi-istar');
    var starAt = T.write + T.writeDur + T.fillLag - 230;
    if (pen) {
      /* Pen reveal: outline drawn first with a nib riding the edge, the ink fill follows a beat behind */
      var w0 = q('.fi-w0'), spans = w0.children, base = w0.getBoundingClientRect().left;
      var clipW = q('.fi-cf').getBoundingClientRect().width, pad = s * 1.3 * 0.04;
      var edges = [spans[0].getBoundingClientRect().left - base - 2];
      var weights = [];
      for (var i = 0; i < spans.length; i++) { var r = spans[i].getBoundingClientRect(); edges.push(r.right - base + (i === spans.length - 1 ? 3 : 0)); weights.push(r.width + 6); }
      var sum = weights.reduce(function (a, b) { return a + b; }, 0), acc = 0, offs = [0];
      weights.forEach(function (w) { acc += w; offs.push(acc / sum); });
      var clipKf = [], innerKf = [], nibKf = [];
      var yHi = fs * 0.52, yLo = fs * 0.82;
      edges.forEach(function (e, k) {
        var x = e + pad, ease = 'cubic-bezier(.45,.05,.55,.95)';
        clipKf.push({ offset: offs[k], transform: 'translateX(' + (x - clipW) + 'px)', easing: ease });
        innerKf.push({ offset: offs[k], transform: 'translateX(' + (clipW - x) + 'px)', easing: ease });
        nibKf.push({ offset: offs[k], transform: 'translate(' + (e - s * 0.1) + 'px,' + ((k % 2 ? yHi : yLo) - s * 0.2) + 'px) rotate(' + (k % 2 ? 30 : 38) + 'deg)', easing: ease });
      });
      [['.fi-cl', '.fi-wl', 0], ['.fi-cf', '.fi-wf', T.fillLag]].forEach(function (L) {
        at(A(q(L[0]), clipKf, { duration: T.writeDur, delay: T.write + L[2], fill: 'both' }));
        at(A(q(L[1]), innerKf, { duration: T.writeDur, delay: T.write + L[2], fill: 'both' }));
      });
      at(A(q('.fi-nib'), nibKf, { duration: T.writeDur, delay: T.write, fill: 'both' }));
      at(A(q('.fi-nib'), [{ opacity: 0 }, { offset: 0.12, opacity: 1 }, { offset: 0.9, opacity: 1 }, { opacity: 0 }], { duration: T.writeDur + 60, delay: T.write, fill: 'both' }));
      /* the outline fades into the fill once the ink has caught up */
      at(A(q('.fi-wl'), [{ opacity: 1 }, { offset: 0.75, opacity: 1 }, { opacity: 0 }], { duration: T.writeDur + T.fillLag + 120, delay: T.write, fill: 'forwards' }));
      at(A(q('.fi-wf'), [{ opacity: 1 }, { opacity: 1 }], { duration: 1, delay: T.write, fill: 'forwards' }));
    } else {
      /* Fallback while Fraunces is not ready: letters rise in one by one, no pen */
      m.el.classList.add('fi-rise');
      var ls = q('.fi-wf').children;
      at(A(q('.fi-wf'), [{ opacity: 1 }, { opacity: 1 }], { duration: 1, delay: T.write, fill: 'forwards' }));
      for (var j = 0; j < ls.length; j++) {
        at(A(ls[j], [{ opacity: 0, transform: 'translateY(' + fs * 0.3 + 'px)' }, { opacity: 1, transform: 'none' }],
          { duration: 380, delay: T.write + j * 75, easing: 'cubic-bezier(.2,.9,.25,1.1)', fill: 'both' }));
      }
    }
    /* The star lands on the i right at the end */
    at(A(istar, [
      { transform: 'translateY(' + -fs * 0.5 + 'px) rotate(-140deg) scale(.3)', opacity: 0, easing: 'cubic-bezier(.3,.6,.4,1)' },
      { offset: 0.2, opacity: 1 },
      { offset: 0.65, transform: 'translateY(' + fs * 0.03 + 'px) rotate(8deg) scale(1.08,.8)', opacity: 1, easing: 'ease-out' },
      { offset: 0.82, transform: 'translateY(' + -fs * 0.02 + 'px) rotate(-2deg) scale(.86,.96)' },
      { transform: 'scale(.9)', opacity: 1 }
    ], { duration: 340, delay: starAt, fill: 'both' }));
  }

  function exit(c, calmFade) {
    if (c.out || c.ended) return;
    c.out = true;
    var m = c.m, q = m.q, el = m.el;
    el.style.pointerEvents = 'none';
    el.classList.add('out');
    var a;
    if (calmFade) {
      a = c.A(q('.fi-sheet'), [{ opacity: 1 }, { opacity: 0 }], { duration: c.rm ? 500 : 280, easing: 'ease-out', fill: 'forwards' });
    } else {
      a = c.A(q('.fi-sheet'), [
        { transform: 'none', opacity: 1, easing: 'cubic-bezier(.4,0,.7,.4)' },
        { offset: 0.25, transform: 'rotateY(-14deg)', opacity: 1, easing: 'cubic-bezier(.3,.3,.6,1)' },
        { offset: 0.7, transform: 'rotateY(-70deg)', opacity: 1, easing: 'cubic-bezier(.4,0,1,1)' },
        { offset: 0.92, transform: 'rotateY(-90deg)', opacity: 1 },
        { transform: 'rotateY(-92deg)', opacity: 0 }
      ], { duration: T.exitDur, fill: 'forwards' });
      c.A(q('.fi-curl'), [{ opacity: 0 }, { opacity: 0.6 }], { duration: T.exitDur, easing: 'ease-in', fill: 'forwards' });
      c.A(q('.fi-shade'), [{ opacity: 0 }, { offset: 0.5, opacity: 0.7 }, { opacity: 0 }], { duration: T.exitDur + 60, fill: 'forwards' });
    }
    var finish = function () { end(c); };
    if (a && a.finished) a.finished.then(finish, finish); else finish();
    /* Safety net: never hold the screen longer than this, whatever the browser does */
    setTimeout(finish, (calmFade ? 600 : T.exitDur) + 250);
  }

  function end(c) {
    if (c.ended) return;
    c.ended = true;
    c.timers.forEach(clearTimeout);
    c.anims.forEach(function (a) { try { a.cancel(); } catch (e) {} });
    try { c.m.el.removeEventListener('pointerdown', c.onTap); c.m.el.removeEventListener('click', c.onTap); } catch (e) {}
    document.removeEventListener('keydown', c.onKey, true);
    if (c.m.el.parentNode) c.m.el.parentNode.removeChild(c.m.el);
    if (cur === c) cur = null;
    try { if (typeof c.onDone === 'function') c.onDone(); } catch (e) {}
    try { window.dispatchEvent(new CustomEvent('folio:introend')); } catch (e) {}
    c.resolve();
  }

  function skip() { if (cur && !cur.out) exit(cur, true); }

  window.FolioIntro = {
    /* Called inline right after #app in index.html, so the overlay is on screen before the portal paints */
    boot: function () {
      if (seen()) return null;
      markSeen();
      return start({});
    },
    /* Replays even if this session has seen it ({force:true} is accepted for clarity; play always plays) */
    play: function (opts) { opts = opts || {}; markSeen(); return start({ now: true, reduced: opts.reduced, onDone: opts.onDone }); },
    skip: skip,
    get playing() { return !!cur; }
  };
})();
