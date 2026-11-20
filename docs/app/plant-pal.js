/* Folio patient app: Plant pal. The teen's plant as a small character.
   - F.PlantPal.render(p, opts): the full plant (My plant page). Poke it, water it, name it, and tap any of the 10 stages
     to meet that plant and read its story.
   - F.PlantPal.mini(p): a compact version for Home.
   Rules kept from plant.js: the plant for a level appears when that level is signed off, nothing ever shrinks, wilts or
   looks sad, and nothing is tied to glucose, A1C or any health result. Mood only reads practice in the last 3 days:
   perky, or having a nap. Watering is cosmetic and nudges toward practice. Private to the teen. */
(function (F) {
  'use strict';
  if (!F) return;
  var preview = {}, pokeIx = {}, pokeRun = { n: 0, t: 0 };

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function hash(s) { var x = 2166136261; s = String(s); for (var i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619); } return x >>> 0; }
  function hap(k) { try { if (F.native && F.native.haptic) F.native.haptic(k); } catch (e) {} }
  function reduced() { try { if (F.native && F.native.reduced) return F.native.reduced(); return matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'reduce'; } catch (e) { return false; } }
  function animate(el, kf, o) { try { if (el && el.animate) return el.animate(kf, o); } catch (e) {} return null; }
  function lv(n) { var L = (F.LEVELS || [])[Math.min(Math.max(n || 1, 1), 10) - 1] || { n: n }; return L; }
  function plantOf(n) {
    var L = lv(n), pl = L.plant || {}, names = F.PLANT_NAMES || [];
    return { n: L.n || n, name: pl.name || names[n - 1] || 'Plant', nick: pl.nick || pl.name || names[n - 1] || 'Your plant', trait: pl.trait || '', story: pl.story || '', idle: pl.idle || '', image: pl.image || n,
      pokes: (pl.pokes && pl.pokes.length ? pl.pokes : ['Hey, that tickles.', 'Hi! Good to see you.', 'I am growing, I promise.']), level: L };
  }
  function img(n) { return (F.ASSET || '../shared/img/') + 'plants/' + ('0' + n).slice(-2) + '.jpg'; }
  function pidOf(p) { return p && p.id; }
  function current() {
    try { if (F.app && F.app.me) return F.app.me(); } catch (e) {}
    try { var id = localStorage.getItem('folio.app.pid'), S = F.Store; return (id && S.sel.patient(id)) || S.sel.patient('p1') || S.get().patients[0]; } catch (e) { return null; }
  }
  function nickFor(p, pl) { return (p && p.plantName && pl.n === p.level) ? p.plantName : pl.nick; }
  /* Mood: perky if anything grew the plant in the last 3 days, otherwise a nap. Never sad. */
  function daysSince(iso) { if (!iso) return 99; var d = new Date(iso + (iso.length === 10 ? 'T12:00:00' : '')); if (isNaN(d)) return 99; return Math.floor((Date.now() - d.getTime()) / 864e5); }
  function lastActive(p) { var ev = (p && p.plant && p.plant.events) || [], best = 99; ev.forEach(function (e) { best = Math.min(best, daysSince(e.date)); }); return best; }
  function mood(p) { return lastActive(p) <= 3 ? 'perky' : 'sleepy'; }
  function moodLine(p, pl) {
    var nk = nickFor(p, pl), d = lastActive(p);
    if (mood(p) === 'perky') return d === 0 ? nk + ' is perky. You practised today.' : nk + ' is perky. You practised ' + (d === 1 ? 'yesterday' : d + ' days ago') + '.';
    return nk + ' is having a little nap. Practise a skill and they will perk up.';
  }
  function swayStyle(n) { var h = hash('pp' + n); return '--sw:' + (3.6 + (h % 17) / 10).toFixed(1) + 's;--sd:-' + ((h >> 5) % 30 / 10).toFixed(1) + 's;--sa:' + (1.4 + (h >> 9) % 10 / 10).toFixed(1) + 'deg'; }
  function grewFrom(p, n) {
    var sk = (lv(n).skills || []).filter(function (s) { return p && p.skills && (p.skills[s.id] === 'own' || (p.skills[s.id] == null && n < p.level)); });
    if (!sk.length) return '';
    return '<div class="pp-grew"><span class="pp-grew-h">Grew from</span><ul role="list">' + sk.map(function (s) { return '<li><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10Z"/><path d="M2 21c0-3 1.9-5.4 5.1-6"/></svg>' + esc(s.name) + '</li>'; }).join('') + '</ul></div>';
  }

  /* ---------- Markup ---------- */
  function stage(p, pl, size, cls) {
    var st = pl.n < p.level ? 'earned' : pl.n === p.level ? 'current' : 'upcoming', md = st === 'current' ? mood(p) : 'perky', nk = nickFor(p, pl);
    return '<div class="pp-stage ' + (cls || '') + ' st-' + st + ' md-' + md + '" style="--pp:' + size + 'px">' +
      '<button type="button" class="pp-plant" data-action="ppPoke" data-n="' + pl.n + '" aria-label="' + esc((st === 'upcoming' ? 'Preview of ' : 'Poke ') + nk + ', the ' + pl.name.toLowerCase() + (st === 'upcoming' ? '. Arrives at Level ' + pl.n : '')) + '">' +
        '<span class="pp-sway" style="' + swayStyle(pl.n) + '"><span class="pp-squish"><img src="' + img(pl.image) + '" alt="" width="' + size + '" height="' + size + '" draggable="false"></span></span></button>' +
      (md === 'sleepy' ? '<span class="pp-z" aria-hidden="true"><i>z</i><i>z</i><i>z</i></span>' : '') +
      (st === 'upcoming' ? '<span class="pp-lock">Arrives at Level ' + pl.n + '</span>' : '') +
      '<span class="pp-fx" aria-hidden="true"></span></div>';
  }
  function card(p, pl) {
    var st = pl.n < p.level ? 'earned' : pl.n === p.level ? 'current' : 'upcoming', nk = nickFor(p, pl);
    return '<section class="pp-card" aria-labelledby="pp-nm"><div class="pp-eyebrow">' + (st === 'current' ? 'Your plant now' : st === 'earned' ? 'Grown at Level ' + pl.n : 'Coming at Level ' + pl.n) + '</div>' +
      '<h2 id="pp-nm">' + esc(nk) + ' <small>the ' + esc(pl.name.toLowerCase()) + '</small></h2>' +
      (pl.trait ? '<p class="pp-trait"><b>Personality:</b> ' + esc(pl.trait) + '</p>' : '') + (pl.story ? '<p class="pp-story">' + esc(pl.story) + '</p>' : '') +
      (st === 'upcoming' ? '<p class="pp-story">' + esc(nk) + ' grows when your care team signs off Level ' + (pl.n - 1) + '.</p>' : grewFrom(p, pl.n)) + '</section>';
  }
  function strip(p, sel) {
    return '<div class="pp-strip" role="group" aria-label="All 10 plants">' + (F.LEVELS || []).map(function (L) {
      var pl = plantOf(L.n), st = L.n < p.level ? 'earned' : L.n === p.level ? 'current' : 'upcoming';
      return '<button type="button" class="pp-st ' + st + '" data-action="ppStage" data-n="' + L.n + '" aria-pressed="' + String(sel === L.n) + '" aria-label="Level ' + L.n + ', ' + esc(nickFor(p, pl)) + ' the ' + esc(pl.name.toLowerCase()) + ', ' + (st === 'current' ? 'your plant now' : st === 'earned' ? 'grown' : 'coming later') + '">' +
        '<img src="' + img(pl.image) + '" alt="" width="52" height="52" loading="lazy" draggable="false"><b>' + L.n + '</b></button>';
    }).join('') + '</div>';
  }
  function render(p, o) {
    p = p || current(); if (!p) return ''; o = o || {};
    var sel = preview[pidOf(p)] || p.level, pl = plantOf(sel), cur = plantOf(p.level), isCur = sel === p.level;
    var line = isCur ? (mood(p) === 'perky' ? (pl.idle || 'Soaking up the light.') : 'Zzz. Just resting my leaves. Poke me if you like.') : (sel < p.level ? pl.idle || pl.pokes[0] : 'Not here yet. ' + pl.nick + ' is waiting at Level ' + sel + '.');
    return '<div class="pp" data-pp data-pid="' + esc(p.id) + '" data-sel="' + sel + '">' +
      '<div class="pp-main">' + stage(p, pl, o.size || 220, 'big') +
        '<p class="pp-bubble" role="status" aria-live="polite"><span>' + esc(isCur || sel < p.level ? nickFor(p, pl) + ': ' : '') + esc(line) + '</span></p></div>' +
      (isCur ? '<p class="pp-mood ios-cap">' + esc(moodLine(p, cur)) + '</p>' : '<p class="pp-mood ios-cap"><button type="button" class="pp-back" data-action="ppStage" data-n="' + p.level + '">Back to ' + esc(nickFor(p, cur)) + '</button></p>') +
      (isCur ? '<div class="pp-btns"><button type="button" class="ios-btn sec" data-action="ppWater">' + dropIcon() + ' Water</button><button type="button" class="ios-btn sec" data-action="ppName">' + (p.plantName ? 'Rename' : 'Name your plant') + '</button></div>' +
        '<p class="pp-nudge ios-gf" hidden>Water is just for fun. <a href="#/levels">Practise a skill</a> to help your plant grow for real.</p>' : '') +
      card(p, pl) +
      '<h3 class="pp-sh">A new plant every level</h3>' + strip(p, sel) +
      '<p class="ios-gf">Tap a plant to meet it. Each one has its own personality. Your plant is private: your care team never sees it.</p></div>';
  }
  function dropIcon() { return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/></svg>'; }
  function mini(p) {
    p = p || current(); if (!p) return ''; var pl = plantOf(p.level), nk = nickFor(p, pl);
    return '<div class="pp pp-mini" data-pp data-pid="' + esc(p.id) + '" data-sel="' + p.level + '">' + stage(p, pl, 112, 'small') +
      '<div class="pp-mini-t"><b>' + esc(nk) + '</b><span class="ios-cap">' + esc(pl.name) + ' · Level ' + p.level + ' of 10</span><p class="pp-bubble sm" role="status" aria-live="polite"><span>' + esc(moodLine(p, pl)) + '</span></p></div></div>';
  }

  /* ---------- Interaction ---------- */
  function rootOf(el) { return el && el.closest ? el.closest('[data-pp]') : null; }
  function say(root, text) {
    var b = root && root.querySelector('.pp-bubble'); if (!b) return;
    var sp = document.createElement('span'); sp.textContent = text; b.innerHTML = ''; b.appendChild(sp);
    if (!reduced()) animate(b, [{ transform: 'scale(.85) translateY(6px)', opacity: 0 }, { transform: 'scale(1.04)', opacity: 1, offset: .6 }, { transform: 'scale(1)', opacity: 1 }], { duration: 360, easing: 'cubic-bezier(.34,1.56,.64,1)' });
  }
  var LEAF = ['#395B50', '#D4E875', '#92AFD7', '#AFE1DF'];
  function particles(root, x, y, kind) {
    if (reduced()) return; var fx = root.querySelector('.pp-fx'); if (!fx) return;
    var n = kind === 'water' ? 9 : 8;
    for (var i = 0; i < n; i++) {
      var b = document.createElement('i'), a, dx, dy, k;
      if (kind === 'water') {
        b.className = 'pp-drop'; b.style.left = (30 + Math.random() * 40) + '%'; b.style.top = '-6%'; fx.appendChild(b);
        a = animate(b, [{ transform: 'translateY(0) scale(.7)', opacity: 0 }, { opacity: 1, offset: .15 }, { transform: 'translateY(' + (fx.clientHeight * (.45 + Math.random() * .2)) + 'px) scale(1)', opacity: 1, offset: .85 }, { transform: 'translateY(' + (fx.clientHeight * .62) + 'px) scale(1.3,.4)', opacity: 0 }], { duration: 700 + Math.random() * 300, delay: i * 70, easing: 'cubic-bezier(.5,0,.9,.5)', fill: 'backwards' });
      } else {
        k = i % 3 === 0; b.className = k ? 'pp-spark' : 'pp-leaf'; if (!k) b.style.background = LEAF[i % LEAF.length];
        b.style.left = x + 'px'; b.style.top = y + 'px'; fx.appendChild(b);
        var ang = -Math.PI / 2 + (Math.random() - .5) * 2.6, dist = 40 + Math.random() * 46; dx = Math.cos(ang) * dist; dy = Math.sin(ang) * dist;
        a = animate(b, [{ transform: 'translate(-50%,-50%) scale(.4) rotate(0deg)', opacity: 1 }, { transform: 'translate(-50%,-50%) translate(' + dx + 'px,' + dy + 'px) scale(1) rotate(' + (Math.random() * 300 - 150) + 'deg)', opacity: 1, offset: .55 },
          { transform: 'translate(-50%,-50%) translate(' + dx * 1.2 + 'px,' + (dy + 34) + 'px) scale(.8) rotate(' + (Math.random() * 400 - 200) + 'deg)', opacity: 0 }], { duration: 760 + Math.random() * 300, easing: 'cubic-bezier(.2,.7,.4,1)' });
      }
      (function (el, an) { var rm = function () { el.remove(); }; if (an && an.finished) an.finished.then(rm, rm); else setTimeout(rm, 1200); })(b, a);
    }
  }
  function squish(root, strength) {
    var s = root.querySelector('.pp-squish'); if (!s) return;
    if (reduced()) { animate(s, [{ opacity: .75 }, { opacity: 1 }], { duration: 220 }); return; }
    var k = strength || 1;
    animate(s, [{ transform: 'scale(1,1)' }, { transform: 'scale(' + (1 + .12 * k) + ',' + (1 - .14 * k) + ')', offset: .18 }, { transform: 'scale(' + (1 - .07 * k) + ',' + (1 + .1 * k) + ') rotate(' + (3 * k) + 'deg)', offset: .42 },
      { transform: 'scale(' + (1 + .03 * k) + ',' + (1 - .03 * k) + ') rotate(' + (-2 * k) + 'deg)', offset: .66 }, { transform: 'scale(1,1) rotate(0deg)' }], { duration: 700, easing: 'cubic-bezier(.3,.7,.3,1)' });
  }
  function poke(el, ev) {
    var root = rootOf(el); if (!root) return; var p = current(); if (!p) return;
    var n = +el.dataset.n || p.level, pl = plantOf(n), nk = nickFor(p, pl), now = Date.now();
    if (n > p.level) { say(root, pl.nick + ' is not here yet. Get Level ' + (n - 1) + ' signed off to meet them.'); hap('selection'); return; }
    pokeRun.n = now - pokeRun.t < 1200 ? pokeRun.n + 1 : 1; pokeRun.t = now;
    var key = p.id + ':' + n, i = pokeIx[key] == null ? hash(key + new Date().getDate()) % pl.pokes.length : pokeIx[key] + 1; pokeIx[key] = i;
    var line = pokeRun.n === 5 ? 'Okay, okay! I am awake. You are very persistent.' : pokeRun.n > 7 ? 'I am ticklish, you know.' : pl.pokes[i % pl.pokes.length];
    if (root.classList.contains('pp-mini') && n === p.level && mood(p) === 'sleepy' && pokeRun.n === 1) line = 'Mmm? Oh, hi. Practise something and I will wake right up.';
    say(root, nk + ': ' + line); squish(root, pokeRun.n > 4 ? 1.3 : 1); hap('light');
    var st = root.querySelector('.pp-stage'), r = st.getBoundingClientRect(), x = ev && ev.clientX ? ev.clientX - r.left : r.width / 2, y = ev && ev.clientY ? ev.clientY - r.top : r.height * .45;
    particles(root, x, y, 'poke');
  }
  function water(root) {
    if (!root) return; var p = current(); if (!p) return; var pl = plantOf(p.level), nk = nickFor(p, pl);
    particles(root, 0, 0, 'water'); hap('light');
    var s = root.querySelector('.pp-squish'), d = reduced() ? 0 : 750;
    setTimeout(function () {
      if (s && !reduced()) animate(s, [{ transform: 'translateY(0) scale(1)' }, { transform: 'translateY(-6px) scale(1.05,1.07)', offset: .35 }, { transform: 'translateY(1px) scale(1.02,.98)', offset: .7 }, { transform: 'translateY(0) scale(1)' }], { duration: 650, easing: 'cubic-bezier(.34,1.56,.64,1)' });
      say(root, nk + ': ' + (mood(p) === 'perky' ? 'Ahh, refreshing! Thanks.' : 'Oh! That woke me up. Thanks.') + ' Practise a skill to help me grow.');
      var nu = root.parentNode && root.querySelector('.pp-nudge'); if (nu) nu.hidden = false;
      hap('success');
    }, d);
  }
  function selectStage(el) {
    var root = rootOf(el), p = current(); if (!root || !p) return; var n = +el.dataset.n;
    if (n === p.level) delete preview[p.id]; else preview[p.id] = n;
    var tmp = document.createElement('div'); tmp.innerHTML = render(p); var nr = tmp.firstChild;
    root.parentNode.replaceChild(nr, root); hap('selection');
    var mainS = nr.querySelector('.pp-main .pp-stage');
    if (mainS && !reduced()) animate(mainS, [{ transform: 'scale(.6) translateY(20px)', opacity: 0 }, { transform: 'scale(1.06)', opacity: 1, offset: .6 }, { transform: 'scale(1)', opacity: 1 }], { duration: 520, easing: 'cubic-bezier(.34,1.56,.64,1)' });
    var b = nr.querySelector('.pp-st[data-n="' + n + '"]'); if (b) { b.focus({ preventScroll: true }); try { b.scrollIntoView({ inline: 'center', block: 'nearest', behavior: reduced() ? 'auto' : 'smooth' }); } catch (x) {} }
  }
  function nameIt() {
    var p = current(); if (!p || !F.UI || !F.UI.formModal) return; var pl = plantOf(p.level);
    F.UI.formModal({ title: 'Name your plant', lead: 'Give ' + pl.nick + ' a nickname. Leave it empty to keep ' + pl.nick + '.', cta: 'Save', fields: [{ name: 'plantName', label: 'Nickname', value: p.plantName || '', ph: pl.nick }],
      onSubmit: function (d) { var v = String(d.plantName || '').trim().slice(0, 24); F.Store.act.updatePatient(p.id, { plantName: v }); hap('success'); try { F.UI.toast(v ? 'Say hi to ' + v + '.' : 'Back to ' + pl.nick + '.'); } catch (x) {} } });
  }

  /* Long press on the plant waters it (the Water button does the same for everyone) */
  var lp = null;
  document.addEventListener('pointerdown', function (e) {
    var b = e.target.closest && e.target.closest('.pp-plant'); if (!b) return; var root = rootOf(b), p = current();
    if (!root || !p || +b.dataset.n !== p.level) return;
    var x0 = e.clientX, y0 = e.clientY;
    lp = { t: setTimeout(function () { lp.fired = true; water(root); }, 550), x: x0, y: y0, fired: false, b: b };
  });
  document.addEventListener('pointermove', function (e) { if (lp && Math.hypot(e.clientX - lp.x, e.clientY - lp.y) > 10) { clearTimeout(lp.t); lp = null; } });
  ['pointerup', 'pointercancel'].forEach(function (t) { document.addEventListener(t, function () { if (lp) clearTimeout(lp.t); setTimeout(function () { lp = null; }, 0); }); });
  document.addEventListener('contextmenu', function (e) { if (e.target.closest && e.target.closest('.pp-plant')) e.preventDefault(); });

  F.actions = F.actions || {};
  F.actions.ppPoke = function (el, ev) { if (lp && lp.fired) return; poke(el, ev); };
  F.actions.ppWater = function (el) { var r = rootOf(el); water(r); };
  F.actions.ppStage = function (el) { selectStage(el); };
  F.actions.ppName = function () { nameIt(); };

  F.PlantPal = { render: render, mini: mini, mood: mood, plantOf: plantOf, nick: function (p) { return nickFor(p, plantOf(p.level)); }, describe: function (p) { var pl = plantOf(p.level); return nickFor(p, pl) + ' the ' + pl.name.toLowerCase() + '. ' + moodLine(p, pl); } };
})(window.Folio);
