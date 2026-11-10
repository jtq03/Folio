/* Folio UI kit: safe templating, icons, small components, modal, toast and a tiny hash-router app. */
(function (F) {
  var ROOT_SRC = document.currentScript ? document.currentScript.src : location.href;
  /* ---------- Safe templating: interpolations are escaped unless they came from h`` ---------- */
  function Safe(s) { this.s = s; }
  Safe.prototype.toString = function () { return this.s; };
  var ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return ESC[c]; }); }
  function val(x) {
    if (x == null || x === false || x === true) return '';
    if (x instanceof Safe) return x.s;
    if (Array.isArray(x)) return x.map(val).join('');
    return esc(x);
  }
  function h(st) { var o = st[0]; for (var i = 1; i < arguments.length; i++) o += val(arguments[i]) + st[i]; return new Safe(o); }
  var raw = function (s) { return new Safe(s); };

  /* ---------- Icons (stroke, 24 grid) ---------- */
  var P = {
    home: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.2a5.5 5.5 0 0 1 5.5 5.3"/>',
    visit: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1M9 12l2 2 4-4"/>',
    plus: 'M12 5v14M5 12h14',
    card: '<rect x="3" y="6" width="18" height="12" rx="2.5"/><path d="M3 10h18M7 15h4"/>',
    levels: 'M3 20h5v-5h5v-5h5V5h3',
    log: '<path d="M5 3h10l4 4v14H5z"/><path d="M9 12h6M9 16h6M9 8h3"/>',
    chart: 'M4 20V10M10 20V4M16 20v-8M22 20H2',
    book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19a2 2 0 0 1 2-2h13"/>',
    team: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>',
    settings: 'M4 7h10M18 7h2M4 17h2M10 17h10M14 4v6M6 14v6',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z',
    message: 'M4 5h16v11H9l-5 4z',
    link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
    check: 'M5 12.5l4.5 4.5L19 7.5',
    arrow: 'M5 12h14M13 6l6 6-6 6',
    back: 'M19 12H5M11 6l-6 6 6 6',
    ext: 'M14 4h6v6M20 4l-9 9M18 14v6H4V6h6',
    nfc: 'M8 8a6 6 0 0 1 0 8M12 5.5a10 10 0 0 1 0 13M16 3a14 14 0 0 1 0 18',
    qr: '<rect x="4" y="4" width="6" height="6"/><rect x="14" y="4" width="6" height="6"/><rect x="4" y="14" width="6" height="6"/><path d="M14 14h3v3h-3zM19 14v6M14 20h3"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    edit: 'M4 20h4L19 9l-4-4L4 16z',
    trash: 'M5 7h14M10 4h4M7 7l1 13h8l1-13',
    lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',
    bell: 'M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 21h4',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    refresh: 'M20 11a8 8 0 0 0-14-4L4 9M4 4v5h5M4 13a8 8 0 0 0 14 4l2-2M20 20v-5h-5',
    x: 'M6 6l12 12M18 6L6 18',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>'
  };
  function ic(name, size) {
    var p = P[name] || '', body = p.charAt(0) === '<' ? p : '<path d="' + p + '"/>';
    size = size || 20;
    return raw('<svg class="ic" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + body + '</svg>');
  }

  /* ---------- Brand: red star, stacked-card mark, wordmark ---------- */
  function star(size, cls) {
    size = size || 18;
    return raw('<svg class="star ' + (cls || '') + '" width="' + size + '" height="' + size + '" viewBox="-12 -12 24 24" aria-hidden="true" focusable="false"><g fill="#CE3B3B"><rect x="-2" y="-11" width="4" height="22" rx="2"/><rect x="-2" y="-11" width="4" height="22" rx="2" transform="rotate(60)"/><rect x="-2" y="-11" width="4" height="22" rx="2" transform="rotate(120)"/></g></svg>');
  }
  function mark(size) {
    size = size || 40;
    return raw('<svg class="mark" width="' + size + '" height="' + size + '" viewBox="0 0 64 64" aria-hidden="true"><rect x="6" y="36" width="34" height="20" rx="4" fill="#92AFD7"/><rect x="12" y="28" width="34" height="20" rx="4" fill="#395B50"/><rect x="18" y="20" width="34" height="20" rx="4" fill="#1F2F16"/><g fill="#CE3B3B" transform="translate(50 14)"><rect x="-1.8" y="-9" width="3.6" height="18" rx="1.8"/><rect x="-1.8" y="-9" width="3.6" height="18" rx="1.8" transform="rotate(60)"/><rect x="-1.8" y="-9" width="3.6" height="18" rx="1.8" transform="rotate(120)"/></g></svg>');
  }
  function wordmark(cls) { return h`<span class="wordmark ${cls || ''}" aria-label="Folio">fol<span class="wm-i" aria-hidden="true">ı${star(11, 'wm-star')}</span>o</span>`; }

  /* ---------- Small components ---------- */
  function lvbar(n, total) {
    total = total || 10; var s = '';
    for (var i = 1; i <= total; i++) s += '<i class="' + (i <= n ? 'on' : '') + '" style="--i:' + i + '"></i>';
    return raw('<span class="lvbar" role="img" aria-label="Level ' + n + ' of ' + total + '">' + s + '</span>');
  }
  /* Illustrated paper-cut style avatars (8 presets) and photo support */
  var AV = {
    a1: ['#C5D1EB', '#F1C9A5', '#6B3F23', 'short', '#395B50'], a2: ['#E9DCC3', '#D9A47C', '#2B1B12', 'curly', '#92AFD7'],
    a3: ['#92AFD7', '#F6D9BE', '#C98B4D', 'long', '#395B50'], a4: ['#C5D1EB', '#B97A57', '#2B1B12', 'bun', '#F0E3CE'],
    a5: ['#395B50', '#8A5A3C', '#1F2F16', 'short', '#C5D1EB'], a6: ['#E9DCC3', '#F1C9A5', '#2B1B12', 'bob', '#5A7684'],
    a7: ['#92AFD7', '#5C3B28', '#1F2F16', 'curly', '#F0E3CE'], a8: ['#C5D1EB', '#D9A47C', '#6B3F23', 'buzz', '#395B50']
  };
  F.AVATARS = Object.keys(AV);
  function avatarSvg(id, size) {
    var c = AV[id] || AV.a1, hair = c[2], head = c[1], hs = '', back = '';
    if (c[3] === 'long') back = '<rect x="18" y="20" width="28" height="34" rx="13" fill="' + hair + '"/>';
    if (c[3] === 'bob') back = '<rect x="18.5" y="20" width="27" height="22" rx="10" fill="' + hair + '"/>';
    if (c[3] === 'bun') back = '<circle cx="32" cy="13" r="6" fill="' + hair + '"/>';
    if (c[3] === 'curly') back = '<g fill="' + hair + '"><circle cx="22" cy="24" r="6"/><circle cx="32" cy="18" r="7"/><circle cx="42" cy="24" r="6"/><circle cx="24" cy="30" r="5"/><circle cx="40" cy="30" r="5"/></g>';
    var cap = c[3] === 'buzz' ? '<path d="M21 28c0-8 5-12 11-12s11 4 11 12c-3-3-7-5-11-5s-8 2-11 5z" fill="' + hair + '" opacity=".85"/>' : '<path d="M19.5 31c0-11 5.5-16 12.5-16s12.5 5 12.5 16c-4-5-8.500-7.500-12.500-7.500S23.500 26 19.500 31z" fill="' + hair + '"/>';
    return raw('<svg viewBox="0 0 64 64" width="' + (size || 64) + '" height="' + (size || 64) + '" aria-hidden="true" focusable="false"><rect width="64" height="64" fill="' + c[0] + '"/><circle cx="52" cy="10" r="14" fill="rgba(255,255,255,.22)"/>' + back +
      '<path d="M7 66c0-13 10-19 25-19s25 6 25 19z" fill="' + c[4] + '"/><rect x="28" y="39" width="8" height="9" rx="3" fill="' + head + '"/><circle cx="32" cy="31" r="11" fill="' + head + '"/>' + cap +
      '<circle cx="27.800" cy="32" r="1.300" fill="#1F2F16"/><circle cx="36.200" cy="32" r="1.300" fill="#1F2F16"/><path d="M28.500 36.500q3.500 3 7 0" stroke="#1F2F16" stroke-width="1.200" fill="none" stroke-linecap="round"/><ellipse cx="25" cy="35" rx="2" ry="1.200" fill="#CE3B3B" opacity=".18"/><ellipse cx="39" cy="35" rx="2" ry="1.200" fill="#CE3B3B" opacity=".18"/></svg>');
  }
  function avatar(p, size) {
    size = size || 40;
    if (p.photo) return h`<span class="avatar avatar-img" style="--s:${size}px"><img src="${p.photo}" alt="" width="${size}" height="${size}"></span>`;
    if (p.avatar && AV[p.avatar]) return h`<span class="avatar avatar-svg" style="--s:${size}px">${avatarSvg(p.avatar, size)}</span>`;
    var l = (p.first || p.name || '?').charAt(0).toUpperCase(), tone = ['blue-100', 'blue-300', 'beige-300'][(l.charCodeAt(0)) % 3];
    return h`<span class="avatar" style="--s:${size}px;background:var(--${tone})" aria-hidden="true">${l}</span>`;
  }
  function pill(text, tone) { return h`<span class="pill pill-${tone || 'neutral'}">${text}</span>`; }
  var STATUS = { track: ['On track', 'neutral'], attention: ['Needs attention', 'attn'], ready: ['Ready to advance', 'ready'], transferred: ['Transferred', 'done'] };
  function statusPill(p) { var s = STATUS[F.Store.sel.status(p)]; return pill(s[0], s[1]); }
  function skillPill(st) { return pill(F.SKILL_STATUS[st], st); }
  function empty(title, body) { return h`<div class="empty"><div class="empty-mark">${mark(44)}</div><h3>${title}</h3><p>${body}</p></div>`; }
  function eyebrow(t) { return h`<div class="eyebrow">${t}</div>`; }

  /* Decorative, not scannable. Deterministic from a seed string. */
  function qr(seed, size) {
    var N = 25, x = 7, bits = [];
    for (var i = 0; i < seed.length; i++) x = (x * 33 + seed.charCodeAt(i)) >>> 0;
    function rnd() { x = (x * 1664525 + 1013904223) >>> 0; return (x >>> 16) & 1; }
    function finder(r, c) { return (r < 7 && c < 7) || (r < 7 && c >= N - 7) || (r >= N - 7 && c < 7); }
    function fp(r, c) {
      var rr = r >= N - 7 ? r - (N - 7) : r, cc = c >= N - 7 ? c - (N - 7) : c;
      return rr === 0 || rr === 6 || cc === 0 || cc === 6 || (rr >= 2 && rr <= 4 && cc >= 2 && cc <= 4);
    }
    var cells = '';
    for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) {
      var on = finder(r, c) ? fp(r, c) : rnd();
      if (on) cells += '<rect x="' + c + '" y="' + r + '" width="1.02" height="1.02"/>';
    }
    return raw('<svg class="qr" width="' + (size || 120) + '" height="' + (size || 120) + '" viewBox="-1 -1 ' + (N + 2) + ' ' + (N + 2) + '" role="img" aria-label="Sample QR code. Not scannable in this prototype."><rect x="-1" y="-1" width="' + (N + 2) + '" height="' + (N + 2) + '" fill="#F7F0E2"/><g fill="#1F2F16">' + cells + '</g></svg>');
  }

  /* The red-star stamp: used for level sign-offs only. */
  function stamp(label, sub) { return h`<div class="stamp" role="img" aria-label="${label}">${star(26)}<div><strong>${label}</strong>${sub ? h`<span>${sub}</span>` : ''}</div></div>`; }

  /* ---------- Dates ---------- */
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function d(iso) { return new Date(iso.length <= 10 ? iso + 'T12:00:00' : iso); }
  function fmt(iso) { if (!iso) return 'Never'; var x = d(iso); return MON[x.getMonth()] + ' ' + x.getDate(); }
  function fmtFull(iso) { if (!iso) return 'Never'; var x = d(iso); return MON[x.getMonth()] + ' ' + x.getDate() + ', ' + x.getFullYear(); }
  function fmtTime(iso) { var x = d(iso), hr = x.getHours(), m = ('0' + x.getMinutes()).slice(-2); return MON[x.getMonth()] + ' ' + x.getDate() + ', ' + ((hr % 12) || 12) + ':' + m + (hr < 12 ? ' am' : ' pm'); }
  function monthYear(iso) { var x = d(iso); return MON[x.getMonth()] + ' ' + x.getFullYear(); }

  /* ---------- Toast ---------- */
  function toast(msg, withStar) {
    var box = document.getElementById('toasts'); if (!box) return;
    var t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status');
    t.innerHTML = (withStar ? star(16).s : '') + '<span>' + esc(msg) + '</span>';
    box.appendChild(t);
    setTimeout(function () { t.classList.add('out'); setTimeout(function () { t.remove(); }, 400); }, 3600);
  }

  /* ---------- Modal (native dialog: focus trap + Esc for free) ---------- */
  function modal(content, opts) {
    var root = document.getElementById('modal-root'), dlg = document.createElement('dialog');
    dlg.className = 'modal ' + ((opts && opts.cls) || '');
    dlg.setAttribute('aria-label', (opts && opts.label) || 'Dialog');
    dlg.innerHTML = '<div class="modal-sheet">' + content.s + '</div>';
    root.appendChild(dlg);
    dlg.addEventListener('close', function () { dlg.remove(); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    dlg.showModal();
    return dlg;
  }
  function closeModal() { var d2 = document.querySelector('dialog[open]'); if (d2) d2.close(); }
  function formModal(o) {
    var f = o.fields.map(function (x) {
      var id = 'f_' + x.name, v = x.value == null ? '' : x.value, req = x.req ? ' required' : '';
      if (x.type === 'select') return '<label for="' + id + '">' + esc(x.label) + '</label><select id="' + id + '" name="' + x.name + '">' + x.options.map(function (op) { return '<option' + (op === v ? ' selected' : '') + '>' + esc(op) + '</option>'; }).join('') + '</select>';
      if (x.type === 'textarea') return '<label for="' + id + '">' + esc(x.label) + '</label><textarea id="' + id + '" name="' + x.name + '" rows="3"' + req + '>' + esc(v) + '</textarea>';
      return '<label for="' + id + '">' + esc(x.label) + '</label><input id="' + id + '" name="' + x.name + '" type="' + (x.type || 'text') + '" value="' + esc(v) + '"' + req + (x.ph ? ' placeholder="' + esc(x.ph) + '"' : '') + '>';
    }).join('');
    var dlg = modal(raw('<form class="mform" novalidate><h2>' + esc(o.title) + '</h2>' + (o.lead ? '<p class="muted">' + esc(o.lead) + '</p>' : '') + f +
      '<div class="mform-actions"><button type="button" class="btn btn-quiet" data-close>Cancel</button><button class="btn btn-primary">' + esc(o.cta || 'Save') + '</button></div></form>'), { label: o.title });
    dlg.querySelector('form').addEventListener('submit', function (e) {
      e.preventDefault();
      var fm = e.target;
      if (!fm.checkValidity()) { fm.reportValidity(); return; }
      var data = {}; new FormData(fm).forEach(function (v, k) { data[k] = v; });
      dlg.close(); o.onSubmit(data);
    });
    var first = dlg.querySelector('input,textarea,select'); if (first) first.focus();
  }
  function confirmModal(o) {
    var dlg = modal(h`<h2>${o.title}</h2><p>${o.body}</p><div class="mform-actions"><button class="btn btn-quiet" data-close>Cancel</button><button class="btn ${o.danger ? 'btn-danger' : 'btn-primary'}" id="cm-ok">${o.cta || 'Confirm'}</button></div>`, { label: o.title });
    dlg.querySelector('#cm-ok').addEventListener('click', function () { dlg.close(); o.onOk(); });
  }

  /* ---------- Delegated events ---------- */
  F.actions = {}; F.ui = {};
  var lastBind = null;
  document.addEventListener('click', function (e) {
    var c = e.target.closest('[data-close]'); if (c) { var dd = c.closest('dialog'); if (dd) dd.close(); return; }
    var a = e.target.closest('[data-action]'); if (!a) return;
    var fn = F.actions[a.dataset.action]; if (fn) { if (a.tagName === 'A' && a.getAttribute('href') === '#') e.preventDefault(); fn(a, e); }
  });
  document.addEventListener('submit', function (e) {
    var f = e.target.closest('form[data-submit]'); if (!f) return;
    e.preventDefault(); if (!f.checkValidity()) { f.reportValidity(); return; }
    var data = {}; new FormData(f).forEach(function (v, k) { data[k] = v; });
    var fn = F.actions[f.dataset.submit]; if (fn) fn(data, f, e);
  });
  function onBind(e) {
    var el = e.target.closest('[data-bind]'); if (!el) return;
    var v = el.type === 'checkbox' ? el.checked : el.value; F.ui[el.dataset.bind] = v;
    if (el.dataset.rerender !== undefined) { lastBind = { name: el.dataset.bind, pos: el.selectionStart }; if (F.rerender) F.rerender(false); }
  }
  document.addEventListener('input', onBind); document.addEventListener('change', onBind);
  document.addEventListener('change', function (e) { var el = e.target.closest('[data-change]'); if (!el) return; var fn = F.actions[el.dataset.change]; if (fn) fn(el, e); });

  /* ---------- Tiny hash-router app ---------- */
  function createApp(cfg) {
    var root = document.getElementById('app'), current = null;
    function match(path) {
      for (var i = 0; i < cfg.routes.length; i++) {
        var r = cfg.routes[i], keys = [], re = new RegExp('^' + r[0].replace(/:(\w+)/g, function (_, k) { keys.push(k); return '([^/]+)'; }) + '/?$'), m = re.exec(path);
        if (m) { var p = {}; keys.forEach(function (k, j) { p[k] = decodeURIComponent(m[j + 1]); }); return { fn: r[1], params: p }; }
      }
      return null;
    }
    function parse() {
      var hs = location.hash.replace(/^#/, '') || '/', qi = hs.indexOf('?'), path = qi < 0 ? hs : hs.slice(0, qi), q = {};
      if (qi >= 0) hs.slice(qi + 1).split('&').forEach(function (kv) { var x = kv.split('='); q[x[0]] = decodeURIComponent(x[1] || ''); });
      return { path: path, q: q };
    }
    function render(isNav) {
      var loc = parse(), m = match(loc.path) || { fn: cfg.notFound, params: {} };
      var scrolls = {}; document.querySelectorAll('[data-keep]').forEach(function (el) { scrolls[el.dataset.keep] = el.scrollTop; });
      var wy = window.scrollY, ae = document.activeElement, sig = null;
      if (!isNav && ae && root.contains(ae)) { var ds = ae.dataset; if (ds.bind) sig = '[data-bind="' + ds.bind + '"]'; else if (ds.action) sig = '[data-action="' + ds.action + '"]' + (ds.v ? '[data-v="' + ds.v + '"]' : '') + (ds.sid ? '[data-sid="' + ds.sid + '"]' : '') + (ds.id ? '[data-id="' + ds.id + '"]' : ''); }
      var out = m.fn(m.params, loc.q, loc), html = cfg.shell ? cfg.shell(out, loc) : out.html;
      root.innerHTML = html.s;
      root.classList.toggle('enter', !!isNav);
      document.querySelectorAll('[data-keep]').forEach(function (el) { if (scrolls[el.dataset.keep] != null) el.scrollTop = scrolls[el.dataset.keep]; });
      if (isNav) { window.scrollTo(0, 0); document.title = (out.title ? out.title + ' · ' : '') + cfg.name; var h1 = root.querySelector('h1'); if (h1) { h1.setAttribute('tabindex', '-1'); h1.focus({ preventScroll: true }); } }
      else { window.scrollTo(0, wy); }
      if (sig && !lastBind) { var fe = root.querySelector(sig); if (fe && fe.focus) fe.focus({ preventScroll: true }); }
      if (lastBind) { var el = root.querySelector('[data-bind="' + lastBind.name + '"]'); if (el) { el.focus(); try { el.setSelectionRange(lastBind.pos, lastBind.pos); } catch (e) {} } lastBind = null; }
      if (out.after) out.after(root, loc, !!isNav);
      current = out;
    }
    F.rerender = render;
    window.addEventListener('hashchange', function () { render(true); });
    F.Store.sub(function () { if (!document.querySelector('dialog[open]')) render(false); });
    render(true);
    return { render: render, go: function (p) { location.hash = p; } };
  }

  F.UI = { h: h, raw: raw, esc: esc, ic: ic, star: star, mark: mark, wordmark: wordmark, lvbar: lvbar, avatar: avatar, avatarSvg: avatarSvg, pill: pill, statusPill: statusPill, skillPill: skillPill,
    empty: empty, eyebrow: eyebrow, qr: qr, stamp: stamp, fmt: fmt, fmtFull: fmtFull, fmtTime: fmtTime, monthYear: monthYear, toast: toast, modal: modal, closeModal: closeModal,
    formModal: formModal, confirmModal: confirmModal, createApp: createApp };

  F.UI.cardFace = function (p, side) {
    var c = p.card || {}, cls = 'fcard ' + side + ' ' + (c.shape || 'rounded') + (c.status === 'inactive' ? ' inactive' : '');
    if (side === 'front') return h`<div class="${cls}"><div><div class="fc-tag">Your story, carried forward</div><div class="fc-brand" style="margin-top:.4rem">${wordmark()}</div></div><div><div class="fc-tag">Folio ID</div><div class="fc-id">${F.Store.sel.fid(p.folioId)}</div><div class="fc-name">${p.first} ${p.last}</div></div><span class="fc-stack">${mark(54)}</span></div>`;
    return h`<div class="${cls}"><div class="qrbox">${qr(c.token || p.folioId, 200)}</div><div class="fc-right"><h4>Tap or scan</h4><p><b>TAP</b> Hold the card to a phone (NFC chip inside)</p><p><b>SCAN</b> Point a camera at the code</p><p><b>TYPE</b> folio.example/id and the number on the front</p></div></div>`;
  };
  F.root = new URL('../../', ROOT_SRC).href;
  F.cardUrl = function (token) { return F.root + 'card/?t=' + encodeURIComponent(token); };
})(window.Folio);
