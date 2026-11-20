/* Folio patient app: skill stickers.
   One sticker per skill (40 in all, 4 per level). Each one is drawn here from its spec in F.LEVELS:
   shape, colour, icon, material and size, so a sticker looks like the skill it stands for.
   - F.Stickers.art(spec, opts): a self-contained SVG string of a die-cut sticker (also used for the share PNG).
   - F.Stickers.book(p, opts): the sticker book for Levels (stickers mode only).
   - F.Stickers.chip(skillId, p): a small sticker for a skill row.
   - F.Stickers.inspect(skillId): the bottom sheet (tilt, flip, physical details, compare, share).
   Rules kept from the usability pass: stickers only show when the teen picked stickers as their progress style.
   Red is only ever the star-shaped sticker. Nothing is tied to glucose or any health result. */
(function (F) {
  'use strict';
  if (!F) return;

  /* ---------- Palette and materials ---------- */
  var COL = { blue: '#92AFD7', green: '#395B50', red: '#CE3B3B', butter: '#F6D978', beige: '#E9DCC3', lime: '#D4E875', sky: '#C5D1EB', teal: '#AFE1DF' };
  var COL_NAME = { blue: 'Blue', green: 'Forest green', red: 'Star red', butter: 'Butter', beige: 'Oat', lime: 'Lime', sky: 'Sky', teal: 'Pool' };
  var DARK = { green: 1, red: 1 };
  var INK = '#1F2F16', CREAM = '#FCF8F1', PAPER = '#FFFDF8';
  var MAT = {
    matte: { name: 'Matte', finish: 'Soft paper, no shine', feel: 'Chalky and soft, like good notebook paper' },
    glossy: { name: 'Glossy', finish: 'Wet-look shine with a bright band', feel: 'Smooth and slippy' },
    holo: { name: 'Holographic', finish: 'Rainbow that shifts as you tilt it', feel: 'Smooth, with a fine line texture you can just feel' },
    foil: { name: 'Foil', finish: 'Metallic, with a raised emboss', feel: 'Cool and crinkly, the picture stands up' },
    glitter: { name: 'Glitter', finish: 'Sparkle flecks that catch the light', feel: 'Slightly gritty' },
    puffy: { name: 'Puffy', finish: 'Inflated foam dome', feel: 'Squishy. You will want to press it' },
    washi: { name: 'Washi', finish: 'See-through paper tape with torn edges', feel: 'Thin and papery, peels off and back on' },
    enamel: { name: 'Enamel', finish: 'Hard glossy dome with a metal rim, like a pin', feel: 'Hard and cool, with a raised rim' }
  };
  var SIZE_MM = { S: 30, M: 45, L: 60 }, SIZE_NAME = { S: 'Small', M: 'Medium', L: 'Large' }, SIZE_SCALE = { S: .78, M: .9, L: 1 };
  var SHAPE_NAME = { circle: 'Circle', star: 'Star', shield: 'Shield', hex: 'Hexagon', flower: 'Flower', heart: 'Heart', drop: 'Drop', cloud: 'Cloud', ticket: 'Ticket', leaf: 'Leaf' };

  function hx(c) { c = c.replace('#', ''); return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)]; }
  function mix(a, b, t) { var x = hx(a), y = hx(b); return '#' + x.map(function (v, i) { var n = Math.round(v + (y[i] - v) * t); return ('0' + n.toString(16)).slice(-2); }).join(''); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function hash(s) { var x = 2166136261; s = String(s); for (var i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619); } return x >>> 0; }
  function rng(seed) { var a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function f1(n) { return Math.round(n * 10) / 10; }

  /* ---------- Shapes (120 grid). Each: path, icon centre and icon scale ---------- */
  function roundPoly(pts, r) {
    var n = pts.length, d = '';
    for (var i = 0; i < n; i++) {
      var p = pts[i], a = pts[(i + n - 1) % n], b = pts[(i + 1) % n];
      var la = Math.hypot(a[0] - p[0], a[1] - p[1]), lb = Math.hypot(b[0] - p[0], b[1] - p[1]);
      var ra = Math.min(r, la / 2), rb = Math.min(r, lb / 2);
      var s = [p[0] + (a[0] - p[0]) * ra / la, p[1] + (a[1] - p[1]) * ra / la], e = [p[0] + (b[0] - p[0]) * rb / lb, p[1] + (b[1] - p[1]) * rb / lb];
      d += (i ? 'L' : 'M') + f1(s[0]) + ' ' + f1(s[1]) + 'Q' + f1(p[0]) + ' ' + f1(p[1]) + ' ' + f1(e[0]) + ' ' + f1(e[1]);
    }
    return d + 'Z';
  }
  /* Outline of a union of circles, by casting rays from a centre inside it */
  function blob(cx, cy, circles, n) {
    var d = '';
    for (var i = 0; i < n; i++) {
      var t = i / n * Math.PI * 2, dx = Math.cos(t), dy = Math.sin(t), best = 0;
      circles.forEach(function (c) { var ox = c[0], oy = c[1], b = dx * ox + dy * oy, disc = b * b - (ox * ox + oy * oy) + c[2] * c[2]; if (disc >= 0) best = Math.max(best, b + Math.sqrt(disc)); });
      d += (i ? 'L' : 'M') + f1(cx + dx * best) + ' ' + f1(cy + dy * best);
    }
    return d + 'Z';
  }
  function heart() {
    var d = '', n = 96;
    for (var i = 0; i < n; i++) { var t = i / n * Math.PI * 2, x = 16 * Math.pow(Math.sin(t), 3), y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t); d += (i ? 'L' : 'M') + f1(60 + x * 3.15) + ' ' + f1(54 - y * 3.15); }
    return d + 'Z';
  }
  function starPts(cx, cy, R, r) { var p = []; for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r : R; p.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); } return p; }
  function hexPts(cx, cy, R) { var p = []; for (var i = 0; i < 6; i++) { var a = -Math.PI / 2 + i * Math.PI / 3; p.push([cx + Math.cos(a) * R, cy + Math.sin(a) * R]); } return p; }
  var SH = {
    circle: { d: 'M60 8a52 52 0 1 1 0 104a52 52 0 1 1 0-104Z', ix: 60, iy: 60, s: 2 },
    star: { d: roundPoly(starPts(60, 64, 57, 29), 5), ix: 60, iy: 66, s: 1.35 },
    shield: { d: 'M60 8L104 22V54C104 84 86 104 60 114C34 104 16 84 16 54V22Z', ix: 60, iy: 58, s: 1.85 },
    hex: { d: roundPoly(hexPts(60, 60, 53), 9), ix: 60, iy: 60, s: 1.95 },
    flower: { d: blob(60, 60, [[0, 0, 32], [0, -31, 21], [27, -15.5, 21], [27, 15.5, 21], [0, 31, 21], [-27, 15.5, 21], [-27, -15.5, 21]], 180), ix: 60, iy: 60, s: 1.6 },
    heart: { d: heart(), ix: 60, iy: 56, s: 1.7 },
    drop: { d: 'M60 6C60 6 100 48 100 75A40 40 0 0 1 20 75C20 48 60 6 60 6Z', ix: 60, iy: 76, s: 1.6 },
    cloud: { d: blob(60, 64, [[-31, 6, 21], [-11, -12, 26], [17, -14, 25], [34, 6, 21], [12, 15, 24], [-14, 15, 24]], 180), ix: 60, iy: 64, s: 1.7 },
    ticket: { d: 'M13 26H107a7 7 0 0 1 7 7V50a10 10 0 0 0 0 20V87a7 7 0 0 1-7 7H13a7 7 0 0 1-7-7V70a10 10 0 0 0 0-20V33a7 7 0 0 1 7-7Z', ix: 47, iy: 60, s: 1.7 },
    leaf: { d: 'M14 106C10 56 44 14 108 12C112 72 74 110 14 106Z', ix: 62, iy: 59, s: 1.55 }
  };

  /* ---------- Icons: reuse the shared kit, with a few extras for sticker art ---------- */
  var EXTRA = {
    sparkle: '<path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/>',
    heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
    drop: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
    flag: '<path d="M5 21V4h11l-2 4 2 4H5"/>',
    key: '<circle cx="8" cy="12" r="4"/><path d="M12 12h9M18 12v3.5M21 12v2.5"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
    map: '<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v14M15 6v14"/>',
    star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
    calendar: '<rect x="4" y="5" width="16" height="15" rx="2.5"/><path d="M4 10h16M8 3v4M16 3v4"/>',
    pill: '<rect x="3" y="8.5" width="18" height="7" rx="3.5" transform="rotate(-35 12 12)"/><path d="M9.5 8.3l5 7.4"/>'
  };
  function iconBody(name) {
    var s = '';
    try { if (F.UI && F.UI.ic) { var r = F.UI.ic(name || '', 24); s = (r && r.s) || String(r || ''); } } catch (e) {}
    s = s.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
    if (!s || /^<path d=""\s*\/>$/.test(s)) s = EXTRA[name] || EXTRA.sparkle;
    return s;
  }

  /* ---------- Spec helpers ---------- */
  function norm(spec) {
    spec = spec || {};
    var shape = SH[spec.shape] ? spec.shape : 'circle', color = COL[spec.color] ? spec.color : 'sky';
    if (color === 'red' && shape !== 'star') color = 'beige'; /* red is the star's colour only */
    return { id: spec.id || '', name: spec.name || 'Sticker', shape: shape, color: color, icon: spec.icon || 'sparkle', material: MAT[spec.material] ? spec.material : 'matte', size: SIZE_MM[spec.size] ? spec.size : 'M', story: spec.story || '', detail: spec.detail || '', back: spec.back || '' };
  }
  var seq = 0;
  /* Size in mm: the spec's own detail line wins (it may say 40 mm), otherwise S 30, M 45, L 60 */
  function mm(sp) { var m = /(\d{2,3})\s*mm/.exec(sp.detail || ''); return m ? +m[1] : SIZE_MM[sp.size]; }

  /* ---------- A. Sticker art ---------- */
  function art(spec, o) {
    o = o || {}; var s = norm(spec), g = SH[s.shape], c = COL[s.color], dark = !!DARK[s.color], m = s.material;
    var px = o.px || 96, id = 'fs' + (++seq) + 'x', ink = dark ? CREAM : INK, R = rng(hash(s.id + s.name + m));
    var lab = o.label ? ' role="img" aria-label="' + esc(o.label) + '"' : ' aria-hidden="true" focusable="false"';
    var open = '<svg class="fs-art m-' + m + ' sh-' + s.shape + (o.cls ? ' ' + o.cls : '') + '" xmlns="http://www.w3.org/2000/svg" viewBox="-10 -10 140 140" width="' + px + '" height="' + px + '"' + lab + '>';
    if (o.locked) {
      return open + '<path class="fs-sil" d="' + g.d + '" fill="currentColor" fill-opacity=".07" stroke="currentColor" stroke-opacity=".45" stroke-width="2.5" stroke-dasharray="7 6" stroke-linejoin="round"/>' +
        '<text x="' + g.ix + '" y="' + (g.iy + 11) + '" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-weight="600" font-size="32" fill="currentColor" fill-opacity=".5">?</text></svg>';
    }
    var clip = 'clip-path="url(#' + id + 'c)"', defs = '<clipPath id="' + id + 'c"><path d="' + g.d + '"/></clipPath>';
    defs += '<filter id="' + id + 'sh" x="-25%" y="-25%" width="150%" height="160%"><feDropShadow dx="0" dy="1.5" stdDeviation="1.2" flood-color="#1F2F16" flood-opacity=".3"/><feDropShadow dx="0" dy="5" stdDeviation="4.5" flood-color="#1F2F16" flood-opacity=".16"/></filter>';
    var body = '', cut = { puffy: 17, enamel: 8, washi: 0 }[m]; if (cut == null) cut = 12;
    var ib = iconBody(s.icon), sc = g.s * (m === 'puffy' ? 1.04 : 1), it = 'translate(' + f1(g.ix - 12 * sc) + ' ' + f1(g.iy - 12 * sc) + ') scale(' + sc + ')';
    function icon(stroke, w, extra) { return '<g transform="' + it + '" fill="none" stroke="' + stroke + '" stroke-width="' + w + '" stroke-linecap="round" stroke-linejoin="round"' + (extra || '') + '>' + ib + '</g>'; }
    /* White die-cut paper border with a soft shadow (washi has none: it is thin tape) */
    if (cut) body += '<path d="' + g.d + '" fill="' + PAPER + '" stroke="' + PAPER + '" stroke-width="' + cut + '" stroke-linejoin="round" filter="url(#' + id + 'sh)"/>';
    if (m === 'matte') {
      defs += '<filter id="' + id + 'g" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="' + (hash(s.id) % 97) + '"/><feColorMatrix values="0 0 0 0 .12  0 0 0 0 .18  0 0 0 0 .09  0 0 0 .55 -.18"/></filter>';
      body += '<path d="' + g.d + '" fill="' + c + '"/><g ' + clip + '><rect x="0" y="0" width="120" height="120" filter="url(#' + id + 'g)" opacity=".55"/></g>';
      body += icon(ink, 2, ' opacity=".86"');
    } else if (m === 'glossy') {
      defs += '<linearGradient id="' + id + 'b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + mix(c, '#ffffff', .18) + '"/><stop offset="1" stop-color="' + mix(c, INK, .12) + '"/></linearGradient>';
      body += '<path d="' + g.d + '" fill="url(#' + id + 'b)"/>' + icon(ink, 2.2);
      body += '<g ' + clip + '><path d="M-10 52L70 -10H92L-10 74Z" fill="#fff" opacity=".42"/><path d="M-10 84L96 -10H104L-10 92Z" fill="#fff" opacity=".28"/><ellipse cx="38" cy="26" rx="13" ry="6" transform="rotate(-38 38 26)" fill="#fff" opacity=".85"/>' +
        '<path d="' + g.d + '" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="2.5"/></g>';
    } else if (m === 'holo') {
      var hs = ['#92AFD7', '#AFE1DF', '#D4E875', '#F6D978', '#FFFFFF', '#C5D1EB', '#6F8FC0', '#AFE1DF', '#D4E875', '#F6D978', '#FFFFFF', '#92AFD7'];
      defs += '<linearGradient id="' + id + 'h" x1="0" y1="0" x2="1" y2=".4">' + hs.map(function (h, i) { return '<stop offset="' + (i / (hs.length - 1)).toFixed(2) + '" stop-color="' + h + '"/>'; }).join('') + '</linearGradient>';
      defs += '<linearGradient id="' + id + 'h2" x1="0" y1="1" x2=".6" y2="0"><stop offset="0" stop-color="#F6D978" stop-opacity="0"/><stop offset=".45" stop-color="#fff" stop-opacity=".85"/><stop offset=".55" stop-color="#AFE1DF" stop-opacity=".5"/><stop offset="1" stop-color="#92AFD7" stop-opacity="0"/></linearGradient>';
      defs += '<pattern id="' + id + 'l" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(-30)"><rect width="5" height="1.1" fill="#fff" opacity=".5"/></pattern>';
      body += '<path d="' + g.d + '" fill="' + c + '"/>';
      body += '<g ' + clip + '><g class="fs-holo" style="transform:translateX(calc(var(--tx, 0) * 34px))"><rect x="-80" y="-10" width="280" height="140" fill="url(#' + id + 'h)" opacity=".82"/></g>' +
        '<g style="transform:translate(calc(var(--tx, 0) * -40px), 0)"><rect x="-40" y="-10" width="200" height="140" fill="url(#' + id + 'h2)"/></g><rect x="0" y="0" width="120" height="120" fill="url(#' + id + 'l)"/></g>';
      body += '<path d="' + g.d + '" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="2"/>';
      body += icon('#fff', 6, ' opacity=".8"') + icon(dark ? INK : mix(c, INK, .8), 2.2);
    } else if (m === 'foil') {
      var gold = s.color === 'butter' || s.color === 'beige' || s.color === 'lime';
      var base = gold ? mix(c, '#B8892A', .35) : c;
      defs += '<linearGradient id="' + id + 'f" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + mix(base, '#ffffff', .75) + '"/><stop offset=".22" stop-color="' + mix(base, INK, .28) + '"/><stop offset=".45" stop-color="' + mix(base, '#ffffff', .85) + '"/><stop offset=".62" stop-color="' + mix(base, INK, .18) + '"/><stop offset=".8" stop-color="' + mix(base, '#ffffff', .55) + '"/><stop offset="1" stop-color="' + mix(base, INK, .4) + '"/></linearGradient>';
      defs += '<pattern id="' + id + 'r" width="3" height="3" patternUnits="userSpaceOnUse"><rect width="3" height=".7" fill="#fff" opacity=".22"/></pattern>';
      body += '<path d="' + g.d + '" fill="url(#' + id + 'f)"/><g ' + clip + '><rect x="0" y="0" width="120" height="120" fill="url(#' + id + 'r)"/></g>';
      body += '<path d="' + g.d + '" fill="none" stroke="' + mix(base, INK, .35) + '" stroke-opacity=".5" stroke-width="1.2" transform="translate(60 60) scale(.9) translate(-60 -60)"/>';
      /* Embossed icon: highlight up-left, shadow down-right, metal face */
      body += '<g transform="translate(1.3 1.6)">' + icon(mix(base, INK, .55), 3.2, ' opacity=".7"') + '</g><g transform="translate(-1 -1)">' + icon('#fff', 3, ' opacity=".9"') + '</g>' + icon(mix(base, '#ffffff', .25), 2.6);
    } else if (m === 'glitter') {
      var sp = '', tw = '';
      for (var i = 0; i < 90; i++) { var x = 6 + R() * 108, y = 6 + R() * 108, r = .5 + R() * 1.5, k = R(); sp += '<circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + f1(r) + '" fill="' + (k < .45 ? '#fff' : k < .75 ? mix(c, '#ffffff', .6) : mix(c, INK, .35)) + '" opacity="' + (.55 + R() * .45).toFixed(2) + '"/>'; }
      for (var j = 0; j < 6; j++) { var tx = 18 + R() * 84, ty = 18 + R() * 84, z = 3 + R() * 3.5; tw += '<path class="fs-tw" style="animation-delay:' + (j * .37 + R()).toFixed(2) + 's" d="M' + f1(tx) + ' ' + f1(ty - z) + 'Q' + f1(tx) + ' ' + f1(ty) + ' ' + f1(tx + z) + ' ' + f1(ty) + 'Q' + f1(tx) + ' ' + f1(ty) + ' ' + f1(tx) + ' ' + f1(ty + z) + 'Q' + f1(tx) + ' ' + f1(ty) + ' ' + f1(tx - z) + ' ' + f1(ty) + 'Q' + f1(tx) + ' ' + f1(ty) + ' ' + f1(tx) + ' ' + f1(ty - z) + 'Z" fill="#fff"/>'; }
      defs += '<radialGradient id="' + id + 'v" cx=".5" cy=".45" r=".65"><stop offset="0" stop-color="' + mix(c, '#ffffff', .1) + '"/><stop offset="1" stop-color="' + mix(c, INK, .22) + '"/></radialGradient>';
      body += '<path d="' + g.d + '" fill="url(#' + id + 'v)"/><g ' + clip + '>' + sp + tw + '</g>';
      body += icon(dark ? INK : '#fff', 6, ' opacity=".9"') + icon(dark ? CREAM : INK, 2.3);
    } else if (m === 'puffy') {
      defs += '<radialGradient id="' + id + 'p" cx=".42" cy=".36" r=".7"><stop offset="0" stop-color="' + mix(c, '#ffffff', .5) + '"/><stop offset=".55" stop-color="' + c + '"/><stop offset="1" stop-color="' + mix(c, INK, .3) + '"/></radialGradient>';
      defs += '<filter id="' + id + 'bl" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3.2"/></filter>';
      defs += '<filter id="' + id + 'is" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="2" stdDeviation="1.2" flood-color="#1F2F16" flood-opacity=".35"/></filter>';
      body += '<path d="' + g.d + '" fill="url(#' + id + 'p)"/>';
      body += '<g ' + clip + '><path d="' + g.d + '" fill="none" stroke="' + mix(c, INK, .45) + '" stroke-width="9" opacity=".55" filter="url(#' + id + 'bl)"/><ellipse cx="44" cy="34" rx="24" ry="13" transform="rotate(-25 44 34)" fill="#fff" opacity=".6" filter="url(#' + id + 'bl)"/></g>';
      body += '<g filter="url(#' + id + 'is)">' + icon(ink, 2.9) + '</g>';
    } else if (m === 'washi') {
      defs += '<filter id="' + id + 'w" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".09" numOctaves="2" seed="' + (hash(s.id) % 50) + '" result="t"/><feDisplacementMap in="SourceGraphic" in2="t" scale="6" xChannelSelector="R" yChannelSelector="G"/></filter>';
      defs += '<pattern id="' + id + 's" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(40)"><rect width="9" height="4" fill="' + (dark ? mix(c, '#ffffff', .25) : mix(c, '#ffffff', .6)) + '"/><circle cx="4.5" cy="6.6" r=".9" fill="' + (dark ? mix(c, '#ffffff', .4) : mix(c, INK, .25)) + '" opacity=".6"/></pattern>';
      body += '<g filter="url(#' + id + 'w)"><path d="' + g.d + '" fill="' + c + '" fill-opacity=".8" filter="url(#' + id + 'sh)"/><path d="' + g.d + '" fill="url(#' + id + 's)" opacity=".75"/></g>';
      body += '<rect x="32" y="-2" width="56" height="16" rx="1" transform="rotate(-6 60 6)" fill="' + PAPER + '" fill-opacity=".6" filter="url(#' + id + 'w)"/>';
      body += icon(ink, 2.1, ' opacity=".8"');
    } else if (m === 'enamel') {
      var au = s.color === 'butter' || s.color === 'beige' || s.color === 'red' || s.color === 'green' || s.color === 'lime';
      var mt = au ? ['#F6E7B0', '#B98A2E', '#FFF4CF', '#8A6420'] : ['#F2F4F7', '#8E98A6', '#FFFFFF', '#5F6978'];
      defs += '<linearGradient id="' + id + 'm" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + mt[0] + '"/><stop offset=".35" stop-color="' + mt[1] + '"/><stop offset=".55" stop-color="' + mt[2] + '"/><stop offset="1" stop-color="' + mt[3] + '"/></linearGradient>';
      defs += '<radialGradient id="' + id + 'd" cx=".35" cy=".28" r=".55"><stop offset="0" stop-color="#fff" stop-opacity=".75"/><stop offset=".4" stop-color="#fff" stop-opacity=".12"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>';
      body += '<path d="' + g.d + '" fill="' + c + '" stroke="url(#' + id + 'm)" stroke-width="7" stroke-linejoin="round"/>';
      body += '<g transform="translate(.5 .9)">' + icon(mt[3], 3.6, ' opacity=".45"') + '</g>' + icon('url(#' + id + 'm)', 3.4) + icon(dark ? CREAM : mix(c, INK, .6), 1.1);
      body += '<g ' + clip + '><path d="' + g.d + '" fill="url(#' + id + 'd)"/><path d="M30 30Q44 18 62 18" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" opacity=".8"/></g>';
    }
    /* Ticket stub perforation and leaf midrib belong to the shape, whatever the material */
    if (s.shape === 'ticket') body += '<path d="M86 31V89" stroke="' + ink + '" stroke-opacity=".35" stroke-width="2" stroke-dasharray="3 4" stroke-linecap="round"/><g transform="translate(100 60) rotate(-90)" fill="' + ink + '" fill-opacity=".45" font-family="Figtree, system-ui, sans-serif" font-weight="700" font-size="8" text-anchor="middle" letter-spacing="1.5"><text y="3">FOLIO</text></g>';
    if (s.shape === 'leaf') body += '<path d="M20 100C42 74 64 50 100 18" fill="none" stroke="' + ink + '" stroke-opacity=".22" stroke-width="2.5" stroke-linecap="round"/>';
    /* Live shine: hidden in the book, follows the finger in the inspector */
    defs += '<radialGradient id="' + id + 'sp"><stop offset="0" stop-color="#fff" stop-opacity=".7"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>';
    body += '<g ' + clip + '><circle class="fs-spec" cx="60" cy="60" r="42" fill="url(#' + id + 'sp)" opacity="0" style="transform:translate(calc(var(--sx, 0) * 46px), calc(var(--sy, 0) * 46px))"/></g>';
    return open + '<defs>' + defs + '</defs>' + body + '</svg>';
  }

  /* ---------- Data access (degrades if fields are missing) ---------- */
  function levels() { return (F.LEVELS || []).filter(function (L) { return L && L.skills && L.skills.length; }); }
  function all() { var out = []; levels().forEach(function (L) { L.skills.forEach(function (s, i) { out.push({ skill: s, level: L, idx: i }); }); }); return out; }
  function find(sid) { var a = all(); for (var i = 0; i < a.length; i++) if (a[i].skill.id === sid) return a[i]; return null; }
  function specOf(e) { var sp = norm(e.skill.sticker || {}); if (!sp.id) sp.id = 'st-' + e.skill.id; if (!e.skill.sticker || !e.skill.sticker.name) sp.name = e.skill.name || sp.name; return sp; }
  function serial(e) { return 'FOLIO-L' + e.level.n + '-' + ('0' + (e.idx + 1)).slice(-2); }
  /* Earned = On my own now, or ever (p.earned keeps the date, stickers never peel off) */
  function isEarned(p, e) { if (!p || !e) return false; var id = e.skill.id, st = p.skills && p.skills[id]; return st === 'own' || !!(p.earned && p.earned[id]) || (st == null && e.level.n < (p.level || 1)) || !!p.transferred; }
  function stateOf(p, e) { if (isEarned(p, e)) return 'got'; return e.level.n === (p && p.level) ? 'next' : 'lock'; }
  function earnedMap(p) { var o = {}; all().forEach(function (e) { if (isEarned(p, e)) o[e.skill.id] = 1; }); return o; }
  function earnedDate(p, e) { var d = p && p.earned && p.earned[e.skill.id]; return d || ''; }
  function fmtDate(iso) { if (!iso) return ''; try { if (F.UI && F.UI.fmt) return F.UI.fmt(iso); } catch (x) {} return iso; }
  function patient() { try { return F.app && F.app.me ? F.app.me() : null; } catch (x) { return null; } }
  function currentPatient() {
    var p = patient(); if (p) return p;
    try { var id = localStorage.getItem('folio.app.pid'), S = F.Store; if (S && S.sel) { return (id && S.sel.patient(id)) || S.sel.patient('p1') || S.get().patients[0]; } } catch (x) {}
    return null;
  }

  /* ---------- C. Sticker book ---------- */
  var filter = 'all';
  function passes(st, mat) { return filter === 'all' || filter === st || (filter.indexOf('m:') === 0 && mat === filter.slice(2)); }
  function cell(e, p, fresh) {
    var sp = specOf(e), st = stateOf(p, e), pend = fresh && fresh.indexOf(e.skill.id) >= 0, rot = (hash(e.skill.id) % 13) - 6;
    var got = st === 'got', label = got ? sp.name + ' sticker, ' + MAT[sp.material].name.toLowerCase() + ' ' + SHAPE_NAME[sp.shape].toLowerCase() + '. Earned. Open details' : (st === 'next' ? 'Next up: ' : 'Locked: ') + (e.skill.name || sp.name) + ' sticker. Open details';
    return '<li class="fs-cell" data-mat="' + sp.material + '" data-st="' + st + '"' + (passes(st, sp.material) ? '' : ' hidden') + '><button type="button" class="fs-st fa-st ' + (got ? 'got' : 'lock') + (pend ? ' pend' : '') + ' z-' + sp.size + '" data-action="fsOpen" data-sid="' + esc(e.skill.id) + '" style="--rot:' + rot + 'deg" aria-label="' + esc(label) + '">' +
      art(sp, { px: 72, locked: !got }) + '</button><span class="fs-nm" aria-hidden="true">' + esc(got || st === 'next' ? sp.name : 'Level ' + e.level.n) + '</span></li>';
  }
  function book(p, o) {
    o = o || {}; p = p || currentPatient(); var Ls = levels(); if (!Ls.length || !p) return '';
    var total = 0, got = 0, mats = {};
    all().forEach(function (e) { total++; if (isEarned(p, e)) got++; mats[specOf(e).material] = 1; });
    var chips = [['all', 'All'], ['got', 'Earned'], ['next', 'Next up']].concat(Object.keys(MAT).filter(function (k) { return mats[k]; }).map(function (k) { return ['m:' + k, MAT[k].name]; }));
    var shown = 0, sec = Ls.map(function (L) {
      var es = L.skills.map(function (s, i) { return { skill: s, level: L, idx: i }; }), n = es.filter(function (e) { return isEarned(p, e); }).length;
      var vis = es.filter(function (e) { return passes(stateOf(p, e), specOf(e).material); }).length; shown += vis;
      return '<section class="fs-lv' + (L.n === p.level ? ' cur' : '') + '"' + (vis ? '' : ' hidden') + ' aria-labelledby="fs-lv' + L.n + '"><h3 id="fs-lv' + L.n + '"><span class="fs-lvn">Level ' + L.n + '</span> ' + esc(L.name || '') + '<span class="fs-lvc">' + n + ' of ' + es.length + '</span></h3>' +
        (L.goal ? '<p class="fs-goal">' + esc(L.goal) + '</p>' : '') + '<ul class="fs-grid" role="list">' + es.map(function (e) { return cell(e, p, o.fresh); }).join('') + '</ul></section>';
    }).join('');
    return '<div class="fs-book" data-filter="' + esc(filter) + '">' +
      '<h2 class="ios-gh" id="fa-stk-h"><span class="ios-tile t5 sm" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h14v9l-7 7H5z"/><path d="M12 20v-7h7"/></svg></span><span>My stickers</span><span class="fa-stk-n">' + got + ' of ' + total + '</span></h2>' +
      '<div class="fs-prog" role="img" aria-label="' + got + ' of ' + total + ' stickers collected"><i style="width:' + Math.round(got / Math.max(total, 1) * 100) + '%"></i></div>' +
      '<div class="fs-filters" role="group" aria-label="Show stickers">' + chips.map(function (c) { return '<button type="button" class="fs-chip" data-action="fsFilter" data-f="' + c[0] + '" aria-pressed="' + String(filter === c[0]) + '">' + c[1] + '</button>'; }).join('') + '</div>' +
      '<p class="fs-empty ios-gf"' + (shown ? ' hidden' : '') + '>None here yet. Keep going.</p>' + sec +
      '<p class="ios-gf fa-stk-cap">One sticker for every skill you do on your own. Tap any sticker to look closer.</p></div>';
  }
  function applyFilter(root) {
    var bk = root && root.querySelector ? (root.classList && root.classList.contains('fs-book') ? root : root.querySelector('.fs-book')) : null; if (!bk) return;
    bk.dataset.filter = filter; var shown = 0;
    [].forEach.call(bk.querySelectorAll('.fs-cell'), function (li) {
      var ok = passes(li.dataset.st, li.dataset.mat);
      li.hidden = !ok; if (ok) shown++;
    });
    [].forEach.call(bk.querySelectorAll('.fs-lv'), function (sc) { sc.hidden = !sc.querySelector('.fs-cell:not([hidden])'); });
    [].forEach.call(bk.querySelectorAll('.fs-chip'), function (b) { b.setAttribute('aria-pressed', String(b.dataset.f === filter)); });
    var em = bk.querySelector('.fs-empty'); if (em) em.hidden = shown > 0;
  }
  function chip(sid, p, o) {
    var e = find(sid); if (!e) return ''; p = p || currentPatient(); var sp = specOf(e), got = isEarned(p, e);
    /* Inside a link row a button would nest, so it is decoration there (the row itself says the status) */
    if (o && o.deco) return '<span class="fs-chipst ' + (got ? 'got' : 'lock') + '" aria-hidden="true">' + art(sp, { px: 34, locked: !got }) + '</span>';
    return '<button type="button" class="fs-chipst ' + (got ? 'got' : 'lock') + '" data-action="fsOpen" data-sid="' + esc(sid) + '" aria-label="' + esc((got ? 'Your ' : 'Locked ') + sp.name + ' sticker. Open details') + '">' + art(sp, { px: 34, locked: !got }) + '</button>';
  }

  /* ---------- B. Inspector ---------- */
  var cur = null; /* { sid, flipped, file, key } */
  function hap(k) { try { if (F.native && F.native.haptic) F.native.haptic(k); } catch (x) {} }
  function reduced() { try { if (F.native && F.native.reduced) return F.native.reduced(); return matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'reduce'; } catch (x) { return false; } }
  function compareList(e) {
    var n = e.level.n, out = [];
    levels().forEach(function (L) { if (Math.abs(L.n - n) <= 1) L.skills.forEach(function (s, i) { if (s.id !== e.skill.id) out.push({ skill: s, level: L, idx: i }); }); });
    return out;
  }
  function inspectorHTML(sid, p) {
    var e = find(sid); if (!e) return '';
    var sp = specOf(e), got = isEarned(p, e), st = stateOf(p, e), M = MAT[sp.material], sk = e.skill, ed = earnedDate(p, e);
    var how = (sk.how || []).filter(Boolean), cmp = compareList(e);
    var status = got ? 'Earned' + (ed ? ' ' + fmtDate(ed) : '') : st === 'next' ? 'Next up' : 'Locked';
    var face = '<div class="fs-face fs-front">' + art(sp, { px: 220, label: sp.name + ' sticker' + (got ? '' : ', not earned yet. This is a preview'), cls: got ? '' : 'fs-ghost' }) + (got ? '' : '<span class="fs-wm" aria-hidden="true">Not earned yet</span>') + '</div>';
    var back = '<div class="fs-face fs-back" aria-hidden="true"><div class="fs-liner"><div class="fs-imp">' + art(sp, { px: 150, locked: true }) + '</div>' +
      '<p class="fs-bk-line">' + esc(sp.back || 'Peel, stick, be proud.') + '</p><dl class="fs-bk-meta"><div><dt>Serial</dt><dd>' + serial(e) + '</dd></div><div><dt>Earned</dt><dd>' + (got ? esc(ed ? fmtDate(ed) : 'Yes') : 'Not earned yet') + '</dd></div><div><dt>Level</dt><dd>' + e.level.n + ' · ' + esc(e.level.name || '') + '</dd></div><div><dt>Skill</dt><dd>' + esc(sk.name || sp.name) + '</dd></div></dl><span class="fs-slit" aria-hidden="true"></span></div></div>';
    var chipsHTML = '<span class="fs-tag">' + M.name + '</span><span class="fs-tag">' + SHAPE_NAME[sp.shape] + '</span><span class="fs-tag">' + SIZE_NAME[sp.size] + '</span><span class="fs-tag s-' + st + '">' + esc(status) + '</span>';
    return '<div class="fs-insp" data-sid="' + esc(sid) + '">' +
      '<div class="fs-stage" data-fs-stage><div class="fs-card' + (cur && cur.flipped ? ' flipped' : '') + '">' + face + back + '</div><span class="fs-shadow" aria-hidden="true"></span></div>' +
      '<p class="fs-hint ios-cap" aria-hidden="true">Drag to tilt it. Tap it to flip.</p>' +
      '<div class="fs-actions"><button type="button" class="ios-btn sec fs-flipb" data-action="fsFlip" aria-pressed="' + String(!!(cur && cur.flipped)) + '">Flip it over</button>' + (got ? '<button type="button" class="ios-btn sec" data-action="fsShare">Share this sticker</button>' : '') + '</div>' +
      '<div class="fs-head"><h2 id="fs-title">' + esc(sp.name) + '</h2><div class="fs-tags">' + chipsHTML + '</div>' + (sp.story ? '<p class="fs-story">' + esc(sp.story) + '</p>' : '') + '</div>' +
      '<section class="fs-sec" aria-labelledby="fs-ph"><h3 id="fs-ph">Physical details</h3><dl class="fs-dl">' +
        '<div><dt>Material</dt><dd>' + M.name + '</dd></div><div><dt>Finish</dt><dd>' + M.finish + '</dd></div><div><dt>Feels</dt><dd>' + M.feel + '</dd></div>' +
        '<div><dt>Size</dt><dd>' + SIZE_NAME[sp.size] + ', ' + mm(sp) + ' mm across</dd></div><div><dt>Shape</dt><dd>' + SHAPE_NAME[sp.shape] + ', ' + COL_NAME[sp.color].toLowerCase() + '</dd></div>' +
        (sp.detail ? '<div><dt>Detail</dt><dd>' + esc(sp.detail) + '</dd></div>' : '') + '<div><dt>Serial</dt><dd>' + serial(e) + '</dd></div></dl></section>' +
      '<section class="fs-sec" aria-labelledby="fs-sk"><h3 id="fs-sk">The skill behind it</h3>' + (sk.can ? '<p class="fs-can">' + esc(sk.can) + '</p>' : '') +
        (how.length ? '<ol class="fs-how">' + how.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol>' : '') +
        (sk.evidence ? '<p class="fs-ev"><b>How your team knows:</b> ' + esc(sk.evidence) + '</p>' : '') +
        (sk.guide && !/^https?:/.test(sk.guide) ? '<a class="fs-guide" href="#/resources/' + esc(sk.guide) + '" data-action="fsClose">Read the guide</a>' : '') + '</section>' +
      (cmp.length ? '<section class="fs-sec" aria-labelledby="fs-cm"><h3 id="fs-cm">Compare</h3><p class="ios-cap">Nearby stickers, and what makes each one different from this one.</p><ul class="fs-cmp" role="list">' + cmp.map(function (x) {
        var xs = specOf(x), xg = isEarned(p, x), diff = [];
        if (xs.material !== sp.material) diff.push(MAT[xs.material].name); if (xs.shape !== sp.shape) diff.push(SHAPE_NAME[xs.shape]); if (xs.size !== sp.size) diff.push(SIZE_NAME[xs.size]);
        return '<li><button type="button" class="fs-cmpb" data-action="fsSwap" data-sid="' + esc(x.skill.id) + '" aria-label="' + esc(xs.name + ', level ' + x.level.n + ', ' + MAT[xs.material].name + ' ' + SHAPE_NAME[xs.shape] + (xg ? ', earned' : ', not earned yet')) + '">' + art(xs, { px: 64, cls: xg ? '' : 'fs-ghost' }) +
          '<b>' + esc(xs.name) + '</b><small>Level ' + x.level.n + '</small><span class="fs-mini"><i' + (xs.material !== sp.material ? ' class="d"' : '') + '>' + MAT[xs.material].name + '</i><i' + (xs.shape !== sp.shape ? ' class="d"' : '') + '>' + SHAPE_NAME[xs.shape] + '</i></span></button></li>';
      }).join('') + '</ul></section>' : '') + '</div>';
  }
  function sheetBody() { return document.querySelector('.fs-insp'); }
  function inspect(sid) {
    var p = currentPatient(), e = find(sid); if (!e || !F.UI || !F.UI.modal) return;
    cur = { sid: sid, flipped: false, file: null, key: '' };
    hap('light');
    var sheet = F.UI.modal({ s: inspectorHTML(sid, p) }, { label: specOf(e).name + ' sticker', head: 'Sticker', cls: 'fs-sheet', onClose: function () { cur = null; } });
    wire(sheet); prepShare(e, p);
  }
  function swap(sid) {
    var box = sheetBody(); if (!box || !cur) return; var p = currentPatient(), e = find(sid); if (!e) return;
    cur.sid = sid; cur.flipped = false; cur.file = null;
    var wrap = box.parentNode, tmp = document.createElement('div'); tmp.innerHTML = inspectorHTML(sid, p);
    wrap.replaceChild(tmp.firstChild, box); wire(wrap);
    var sh = wrap.closest('.ios-sheet, .modal-sheet, dialog'); if (sh) { sh.setAttribute('aria-label', specOf(e).name + ' sticker'); try { sh.scrollTo({ top: 0, behavior: reduced() ? 'auto' : 'smooth' }); } catch (x) { sh.scrollTop = 0; } }
    var nb = wrap.querySelector('.fs-stage'); if (nb && !reduced()) nb.animate && nb.animate([{ transform: 'scale(.85)', opacity: .3 }, { transform: 'scale(1)', opacity: 1 }], { duration: 320, easing: 'cubic-bezier(.34,1.56,.64,1)' });
    hap('selection'); prepShare(e, p);
  }
  function flip() {
    var box = sheetBody(); if (!box || !cur) return; cur.flipped = !cur.flipped;
    var cd = box.querySelector('.fs-card'), b = box.querySelector('.fs-flipb');
    if (cd) { cd.classList.toggle('flipped', cur.flipped); cd.style.removeProperty('--rx'); cd.style.removeProperty('--ry'); }
    if (b) { b.setAttribute('aria-pressed', String(cur.flipped)); b.textContent = cur.flipped ? 'Flip to the front' : 'Flip it over'; }
    var e = find(cur.sid), lr = document.getElementById('toasts');
    if (lr && e) { /* tell VoiceOver what is on the back */ var sp = specOf(e); try { F.UI.toast(cur.flipped ? 'Back: ' + (sp.back || 'Peel, stick, be proud.') + ' Serial ' + serial(e) + '.' : 'Front'); } catch (x) {} }
    hap('light');
  }
  /* Tilt: the card follows the finger (or mouse) and the shine and holo layers move with it */
  function wire(root) {
    var stage = root && root.querySelector('[data-fs-stage]'); if (!stage || stage._fs) return; stage._fs = 1;
    var card = stage.querySelector('.fs-card'), down = null, moved = false, raf = 0, last = { x: 0, y: 0 }, edge = false;
    function set(x, y) {
      last.x = x; last.y = y; if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = 0; var rm = reduced();
        card.style.setProperty('--rx', rm ? '0' : (last.x * 20).toFixed(2));
        card.style.setProperty('--ry', rm ? '0' : (-last.y * 16).toFixed(2));
        stage.style.setProperty('--sx', last.x.toFixed(3)); stage.style.setProperty('--sy', last.y.toFixed(3)); stage.style.setProperty('--tx', (-last.x * 1.2).toFixed(3));
        var e2 = Math.abs(last.x) > .9 || Math.abs(last.y) > .9; if (e2 && !edge) hap('selection'); edge = e2;
      });
    }
    function pos(ev) { var r = stage.getBoundingClientRect(); return { x: Math.max(-1, Math.min(1, (ev.clientX - r.left) / r.width * 2 - 1)), y: Math.max(-1, Math.min(1, (ev.clientY - r.top) / r.height * 2 - 1)) }; }
    stage.addEventListener('pointerdown', function (ev) { down = { x: ev.clientX, y: ev.clientY }; moved = false; stage.classList.add('fs-live', 'fs-hold'); try { stage.setPointerCapture(ev.pointerId); } catch (x) {} var q = pos(ev); set(q.x, q.y); });
    stage.addEventListener('pointermove', function (ev) {
      if (!down && ev.pointerType !== 'mouse') return;
      if (down && Math.hypot(ev.clientX - down.x, ev.clientY - down.y) > 6) moved = true;
      stage.classList.add('fs-live'); var q = pos(ev); set(q.x, q.y);
    });
    function end(ev) {
      var wasTap = down && !moved && ev.type === 'pointerup'; down = null; stage.classList.remove('fs-hold');
      if (ev.pointerType !== 'mouse' || ev.type === 'pointerleave') { stage.classList.remove('fs-live'); set(0, 0); }
      if (wasTap) flip();
    }
    stage.addEventListener('pointerup', end); stage.addEventListener('pointercancel', end); stage.addEventListener('pointerleave', end);
    /* Stop the sheet's drag-to-dismiss from stealing a tilt */
    ['touchstart', 'touchmove'].forEach(function (t) { stage.addEventListener(t, function (ev) { ev.stopPropagation(); }, { passive: true }); });
    stage.style.touchAction = 'none';
  }

  /* ---------- Share: a PNG of the sticker on a paper square ---------- */
  function toPng(e, p) {
    return new Promise(function (res) {
      var sp = specOf(e), svg = art(sp, { px: 640 }), img = new Image();
      img.onload = function () {
        try {
          var c = document.createElement('canvas'); c.width = 1080; c.height = 1080; var x = c.getContext('2d');
          x.fillStyle = '#F7F0E2'; x.fillRect(0, 0, 1080, 1080); x.drawImage(img, 220, 120, 640, 640);
          x.fillStyle = '#1F2F16'; x.textAlign = 'center'; x.font = '600 60px Fraunces, Georgia, serif'; x.fillText(sp.name, 540, 860);
          x.font = '500 34px Figtree, system-ui, sans-serif'; x.fillStyle = '#395B50'; x.fillText(MAT[sp.material].name + ' ' + SHAPE_NAME[sp.shape].toLowerCase() + ' · Level ' + e.level.n + ' · ' + serial(e), 540, 920);
          x.font = '700 28px Figtree, system-ui, sans-serif'; x.fillText('Folio', 540, 1010);
          c.toBlob(function (b) { res(b ? new File([b], 'folio-sticker-' + serial(e).toLowerCase() + '.png', { type: 'image/png' }) : null); }, 'image/png');
        } catch (x2) { res(null); }
      };
      img.onerror = function () { res(null); };
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    });
  }
  function prepShare(e, p) { if (!isEarned(p, e)) return; var k = e.skill.id; toPng(e, p).then(function (f) { if (cur && cur.sid === k) cur.file = f; }); }
  function share() {
    if (!cur) return; var e = find(cur.sid); if (!e) return; var sp = specOf(e), data = { title: 'My Folio sticker', text: 'I earned the ' + sp.name + ' sticker on Folio.' };
    function go(f) {
      if (!f) { try { F.UI.toast('Could not make the image'); } catch (x) {} return; }
      if (F.native && F.native.shareFile) F.native.shareFile(f, data);
      else { try { var a = document.createElement('a'), u = URL.createObjectURL(f); a.href = u; a.download = f.name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 30000); F.UI.toast('Saved ' + f.name); } catch (x) {} }
    }
    /* iOS only opens the share sheet inside the tap, so use the image made when the sheet opened */
    if (cur.file) go(cur.file); else toPng(e, currentPatient()).then(go);
  }

  /* ---------- Actions ---------- */
  F.actions = F.actions || {};
  F.actions.fsOpen = function (el) { if (el.closest && el.closest('.fs-insp')) { swap(el.dataset.sid); return; } inspect(el.dataset.sid); };
  F.actions.fsSwap = function (el) { swap(el.dataset.sid); };
  F.actions.fsFlip = function () { flip(); };
  F.actions.fsShare = function () { share(); };
  F.actions.fsClose = function () { try { F.UI.closeModal(); } catch (x) {} };
  F.actions.fsFilter = function (el) { filter = el.dataset.f || 'all'; hap('selection'); applyFilter(document.querySelector('.fs-book')); };

  F.Stickers = { art: art, book: book, chip: chip, inspect: inspect, applyFilter: applyFilter, earnedMap: earnedMap, isEarned: function (p, sid) { return isEarned(p, find(sid)); },
    list: function () { return all().map(function (e) { return { id: e.skill.id, level: e.level.n, name: specOf(e).name, spec: specOf(e) }; }); },
    spec: function (sid) { var e = find(sid); return e ? specOf(e) : null; }, serial: function (sid) { var e = find(sid); return e ? serial(e) : ''; },
    MATERIALS: MAT, SHAPES: SHAPE_NAME, SIZE_MM: SIZE_MM, COLORS: COL };
})(window.Folio);
