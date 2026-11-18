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
  var MODES = { plant: 'Plant', stickers: 'Stickers', bar: 'Just my level' };
  function mode() { var m = S.a11y.get().motivation; return MODES[m] ? m : 'plant'; }
  function setMode(m) { if (MODES[m]) S.a11y.set('motivation', m); }
  try { var qm = new URLSearchParams(location.search).get('motivation'); if (qm && MODES[qm]) setMode(qm); } catch (e) {}

  /* v4: one plant per level (assets/plants/01-10), shown on the sky tile, never cropped */
  var STAGES = (F.PLANT_NAMES || ['Tiny sprout', 'Seedling', 'Clover', 'Mini cactus', 'Succulent', 'Fern', 'Monstera', 'Palm', 'Pine', 'Giant oak']);
  function stageName(n) { return STAGES[Math.min(Math.max(n, 1), 10) - 1]; }

  /* The plant picture. stage 1-10 picks the level's plant. fresh = new leaves since the last sign-off (0-5),
     shown as a small lime badge so practice still visibly feeds the plant. Same signature as before. */
  function svg(stage, fresh, size, label) {
    stage = Math.min(Math.max(stage || 1, 1), 10); fresh = Math.min(Math.max(fresh || 0, 0), 5);
    var s = size || 160, n = ('0' + stage).slice(-2), alt = String(label || '').replace(/"/g, '&quot;');
    var badge = fresh && s >= 56 ? '<span class="pl-leaves" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10Z"/><path d="M2 21c0-3 1.9-5.4 5.1-6"/></svg>+' + fresh + '</span>' : '';
    return '<span class="plant-tile pl-svg" style="--s:' + s + 'px"' + (alt ? ' role="img" aria-label="' + alt + '"' : ' aria-hidden="true"') + '><img src="' + (F.ASSET || '../shared/img/') + 'plants/' + n + '.jpg" alt="" width="' + s + '" height="' + s + '" loading="lazy">' + badge + '</span>';
  }

  /* Plain-words description for screen readers and captions */
  function describe(p) {
    var st = p.level, n = S.sel.leaves(p), ev = recent(p, 1)[0];
    return 'Level ' + st + ' of 10. Your plant is a ' + stageName(st).toLowerCase() + ', with ' + n + ' new ' + (n === 1 ? 'leaf' : 'leaves') + ' since your last sign-off.' + (ev ? ' It last grew because ' + ev.label.charAt(0).toLowerCase() + ev.label.slice(1) + '.' : '');
  }
  function recent(p, max) {
    var ev = ((p.plant && p.plant.events) || []).slice().reverse();
    return ev.slice(0, max || 5);
  }

  F.Plant = { mode: mode, setMode: setMode, MODES: MODES, stageName: stageName, svg: svg, describe: describe, recent: recent };
})(window.Folio);
