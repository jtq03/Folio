/* Folio patient app: the growing plant (v2 research update, change C12).
   Why: asked what would make levelling up more appealing, the young adult we interviewed described a
   virtual plant you feed by doing tasks. Classmates preferred stickers, so the team can switch between
   plant, stickers and a plain level view (About me > Prototype > Motivation style) and test both.

   Rules (from the build brief):
   - Stage = the level a clinician signed off (1 to 10, seed to full tree). Only a sign-off changes it.
   - Leaves come from practice, guides and Run my care tasks since the last sign-off (max 5 shown).
   - Nothing ever shrinks, wilts or dies. A hard stretch only pauses growth.
   - Never linked to glucose, A1C or any health result. Private: never shown in the portal or adult view.
   Colours come from brand tokens in plant.css, so there are no new hex values here. */
(function (F) {
  'use strict';
  var S = F.Store;

  /* ---------- Motivation style (a per-device setting, stored with the display settings) ---------- */
  var MODES = { plant: 'Plant', stickers: 'Stickers', bar: 'Level only' };
  function mode() { var m = S.a11y.get().motivation; return MODES[m] ? m : 'plant'; }
  function setMode(m) { if (MODES[m]) S.a11y.set('motivation', m); }
  try { var qm = new URLSearchParams(location.search).get('motivation'); if (qm && MODES[qm]) setMode(qm); } catch (e) {}

  var STAGES = ['Seed', 'Sprout', 'Seedling', 'Young plant', 'Growing plant', 'Leafy plant', 'Strong plant', 'Budding plant', 'Young tree', 'Full tree'];
  function stageName(n) { return STAGES[Math.min(Math.max(n, 1), 10) - 1]; }

  /* A leaf: an almond shape pointing away from the stem */
  function leaf(x, y, len, ang, cls) {
    var w = len * 0.42;
    /* Position lives on the wrapper so the grow animation (a CSS transform on the path) cannot override it */
    return '<g transform="translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') rotate(' + ang + ')"><path class="pl-leaf ' + (cls || '') + '" d="M0 0 C ' + (len * 0.35).toFixed(1) + ' ' + (-w).toFixed(1) + ' ' + (len * 0.8).toFixed(1) + ' ' + (-w * 0.6).toFixed(1) + ' ' + len.toFixed(1) + ' 0 C ' + (len * 0.8).toFixed(1) + ' ' + (w * 0.6).toFixed(1) + ' ' + (len * 0.35).toFixed(1) + ' ' + w.toFixed(1) + ' 0 0 Z"/></g>';
  }

  /* The plant picture. stage 1-10, fresh = new leaves since the last sign-off (0-5). */
  function svg(stage, fresh, size, label) {
    stage = Math.min(Math.max(stage || 1, 1), 10); fresh = Math.min(Math.max(fresh || 0, 0), 5);
    var base = 172, top = base - (14 + stage * 13), o = '';
    /* pot and soil */
    o += '<path class="pl-pot" d="M58 176 L142 176 L132 214 L68 214 Z"/><rect class="pl-rim" x="52" y="166" width="96" height="14" rx="4"/><ellipse class="pl-soil" cx="100" cy="168" rx="40" ry="5"/>';
    if (stage === 1) {
      o += '<ellipse class="pl-seed" cx="100" cy="166" rx="7" ry="5"/><path class="pl-stem" d="M100 164 q2 -10 -1 -16"/>' + leaf(99, 149, 12, -60, '');
    } else {
      /* stem with a gentle curve, thicker as it grows */
      var sw = 2.5 + stage * 0.45;
      o += '<path class="pl-stem" style="stroke-width:' + sw.toFixed(1) + '" d="M100 ' + base + ' C 96 ' + (base - (base - top) * 0.35).toFixed(0) + ' 104 ' + (base - (base - top) * 0.7).toFixed(0) + ' 100 ' + top + '"/>';
      /* established leaf pairs: one pair per stage, up to the crown */
      var pairs = Math.min(stage, 8), span = base - top - 12;
      for (var i = 0; i < pairs; i++) {
        var y = base - 14 - (span * (i + 0.5)) / pairs, len = 20 + stage * 2.6 - i * 1.4;
        o += leaf(100, y, len, -28 - (i % 2) * 8, '') + leaf(100, y - 4, len, 208 + (i % 2) * 8, '');
      }
      /* crown for the tree stages */
      if (stage >= 9) {
        var r = stage === 10 ? 34 : 26;
        o += '<g class="pl-crown"><circle cx="100" cy="' + (top + 6) + '" r="' + r + '"/><circle cx="' + (100 - r * 0.8) + '" cy="' + (top + 18) + '" r="' + (r * 0.7) + '"/><circle cx="' + (100 + r * 0.8) + '" cy="' + (top + 18) + '" r="' + (r * 0.7) + '"/></g>';
      }
    }
    /* new leaves since the last sign-off grow on a fresh shoot above the tip, so they stand out */
    if (fresh && stage > 1 && stage < 9) o += '<path class="pl-stem pl-shoot" d="M100 ' + top + ' L100 ' + (top - 6 - fresh * 7) + '"/>';
    for (var k = 0; k < fresh; k++) {
      var fy = stage === 1 ? 152 - k * 5 : stage >= 9 ? top - 4 - k * 6 : top - 4 - k * 7, side = k % 2 === 0;
      o += leaf(100, fy, 22, side ? -40 : 220, 'pl-new');
    }
    /* final stage: the red star blooms (the star is reserved for sign-offs) */
    if (stage === 10) o += '<g transform="translate(100 ' + (top - 30) + ')" class="pl-star"><rect x="-2.5" y="-12" width="5" height="24" rx="2.5"/><rect x="-2.5" y="-12" width="5" height="24" rx="2.5" transform="rotate(60)"/><rect x="-2.5" y="-12" width="5" height="24" rx="2.5" transform="rotate(120)"/></g>';
    var s = size || 160;
    return '<svg class="pl-svg" viewBox="0 0 200 220" width="' + s + '" height="' + Math.round(s * 1.1) + '" role="img" aria-label="' + String(label || '').replace(/"/g, '&quot;') + '" focusable="false">' + o + '</svg>';
  }

  /* Plain-words description for screen readers and captions */
  function describe(p) {
    var st = p.level, n = S.sel.leaves(p), ev = recent(p, 1)[0];
    return 'Your plant is at stage ' + st + ' of 10, ' + stageName(st).toLowerCase() + ', with ' + n + ' new ' + (n === 1 ? 'leaf' : 'leaves') + '.' + (ev ? ' It last grew because ' + ev.label.charAt(0).toLowerCase() + ev.label.slice(1) + '.' : '');
  }
  function recent(p, max) {
    var ev = ((p.plant && p.plant.events) || []).slice().reverse();
    return ev.slice(0, max || 5);
  }

  F.Plant = { mode: mode, setMode: setMode, MODES: MODES, stageName: stageName, svg: svg, describe: describe, recent: recent };
})(window.Folio);
