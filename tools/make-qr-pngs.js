#!/usr/bin/env node
/* Folio: make print-ready QR code PNGs for every Folio card.

   Usage (from the repo root, Node 18 or newer):
     node tools/make-qr-pngs.js

   No npm install is needed. The script reuses the encoder and decoder the app ships with
   (docs/shared/js/vendor/qrcode.js and jsQR.js) and writes PNG files with Node's built-in zlib.
   Optional: if Playwright is installed (npm i playwright, or NODE_PATH pointing at one), it also renders
   qr-codes/print-sheet.png (600 dpi) and qr-codes/print-sheet.pdf from qr-codes/print-sheet.html.

   What it does:
   1. Loads docs/shared/js/data.js in a sandbox and reads every seed patient with a card token.
   2. Encodes the card's tap link: https://jtq03.github.io/Folio/card/?t=<token>&via=qr
      (error correction Q, 4-module quiet zone, the same encoder and settings as the app, so the printed
      code and the on-screen code are identical).
   3. Writes, per card:
        qr-codes/FO-1004_Jake-Querin.png              black on white, 1200 x 1200 px, nothing else in the image
        qr-codes/brand/FO-1004_Jake-Querin_brand.png  Green 900 #1F2F16 on Beige 100 #F7F0E2
      The four pilot cards (FO-1001 to FO-1004) go in qr-codes/, the sample patients in qr-codes/samples/.
      Each PNG carries a pHYs size so print dialogs default to 28 mm square.
   4. Writes qr-codes/print-sheet.html: the four pilot codes at exactly 28 mm with labels outside the code.
   5. Verifies every PNG: reads the file back, decodes it with jsQR, checks the text is the exact URL and that
      the token resolves to the same person in the seed. Exits with code 1 if any check fails.

   Replace card (portal) makes a new token, so a printed code for that card stops working. Reprint after a replace. */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const zlib = require('zlib');

const ROOT = path.resolve(__dirname, '..');
const DOCS = path.join(ROOT, 'docs');
const OUT = path.join(ROOT, 'qr-codes');
const SIZE = 1200;          /* px, primary and brand PNGs */
const PRINT_MM = 28;        /* sticker size, quiet zone included */
const SHEET_DPI = 600;
const QUIET = 4;            /* modules */
const ECL = 'Q';

/* ---------- Load the seed and the vendored encoder/decoder ---------- */
function loadSeed() {
  const win = {};
  win.window = win;
  vm.createContext(win);
  vm.runInContext(fs.readFileSync(path.join(DOCS, 'shared/js/data.js'), 'utf8'), win, { filename: 'data.js' });
  return win.Folio;
}
function loadEncoder() {
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(DOCS, 'shared/js/vendor/qrcode.js'), 'utf8') + '\n;this.qrcode = qrcode;', ctx, { filename: 'qrcode.js' });
  return ctx.qrcode;
}
function loadDecoder() {
  const mod = { exports: {} };
  const fn = new Function('module', 'exports', fs.readFileSync(path.join(DOCS, 'shared/js/vendor/jsQR.js'), 'utf8'));
  fn(mod, mod.exports);
  return mod.exports.default || mod.exports;
}

/* ---------- QR matrix ---------- */
function matrix(qrcode, text) {
  const q = qrcode(0, ECL);
  q.addData(text, 'Byte');
  q.make();
  const n = q.getModuleCount();
  const m = [];
  for (let r = 0; r < n; r++) { const row = []; for (let c = 0; c < n; c++) row.push(q.isDark(r, c)); m.push(row); }
  return { n, m, version: (n - 17) / 4 };
}

/* ---------- Minimal PNG writer and reader (8-bit RGB, filter 0) ---------- */
const CRC_TABLE = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(buf) { let c = 0xffffffff; for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function textChunk(key, value) { return chunk('tEXt', Buffer.concat([Buffer.from(key, 'latin1'), Buffer.from([0]), Buffer.from(value, 'latin1')])); }
function writePng(file, w, h, rgb, ppm, texts) {
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 3 + 1)] = 0; rgb.copy(raw, y * (w * 3 + 1) + 1, y * w * 3, (y + 1) * w * 3); }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const phys = Buffer.alloc(9); phys.writeUInt32BE(ppm, 0); phys.writeUInt32BE(ppm, 4); phys[8] = 1;
  const parts = [Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('pHYs', phys)];
  (texts || []).forEach(t => parts.push(textChunk(t[0], t[1])));
  parts.push(chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0)));
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, Buffer.concat(parts));
}
/* Reads back the PNGs this script writes (8-bit RGB, any of the five standard filters) as RGBA */
function readPng(file) {
  const b = fs.readFileSync(file);
  let o = 8, w = 0, h = 0, bpp = 3; const idat = [];
  while (o < b.length) {
    const len = b.readUInt32BE(o), type = b.toString('ascii', o + 4, o + 8), d = b.subarray(o + 8, o + 8 + len);
    if (type === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); if (d[8] !== 8 || (d[9] !== 2 && d[9] !== 6)) throw new Error('unsupported PNG'); bpp = d[9] === 6 ? 4 : 3; }
    if (type === 'IDAT') idat.push(d);
    o += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat)), stride = w * bpp, out = new Uint8ClampedArray(w * h * 4), prev = Buffer.alloc(stride), line = Buffer.alloc(stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], src = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? line[i - bpp] : 0, up = prev[i], c = i >= bpp ? prev[i - bpp] : 0;
      let v = src[i];
      if (f === 1) v += a; else if (f === 2) v += up; else if (f === 3) v += (a + up) >> 1;
      else if (f === 4) { const p = a + up - c, pa = Math.abs(p - a), pb = Math.abs(p - up), pc = Math.abs(p - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? up : c; }
      line[i] = v & 255;
    }
    for (let x = 0; x < w; x++) { out[(y * w + x) * 4] = line[x * bpp]; out[(y * w + x) * 4 + 1] = line[x * bpp + 1]; out[(y * w + x) * 4 + 2] = line[x * bpp + 2]; out[(y * w + x) * 4 + 3] = bpp === 4 ? line[x * bpp + 3] : 255; }
    line.copy(prev);
  }
  return { w, h, data: out };
}

/* ---------- Render a matrix to pixels. Module edges snap to whole pixels, so every edge is sharp. ---------- */
function render(mx, px, ink, field) {
  const total = mx.n + QUIET * 2, rgb = Buffer.alloc(px * px * 3);
  const edge = i => Math.round(i * px / total);
  for (let i = 0; i < px * px; i++) { rgb[i * 3] = field[0]; rgb[i * 3 + 1] = field[1]; rgb[i * 3 + 2] = field[2]; }
  for (let r = 0; r < mx.n; r++) for (let c = 0; c < mx.n; c++) {
    if (!mx.m[r][c]) continue;
    const y0 = edge(r + QUIET), y1 = edge(r + QUIET + 1), x0 = edge(c + QUIET), x1 = edge(c + QUIET + 1);
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const k = (y * px + x) * 3; rgb[k] = ink[0]; rgb[k + 1] = ink[1]; rgb[k + 2] = ink[2]; }
  }
  return rgb;
}
function svgOf(mx, ink, field) {
  const total = mx.n + QUIET * 2; let d = '';
  for (let r = 0; r < mx.n; r++) for (let c = 0; c < mx.n; c++) {
    if (!mx.m[r][c]) continue; const s = c; while (c + 1 < mx.n && mx.m[r][c + 1]) c++;
    d += 'M' + (s + QUIET) + ' ' + (r + QUIET) + 'h' + (c - s + 1) + 'v1h-' + (c - s + 1) + 'z';
  }
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + total + ' ' + total + '" shape-rendering="crispEdges"><rect width="' + total + '" height="' + total + '" fill="' + field + '"/><path fill="' + ink + '" d="' + d + '"/></svg>';
}

/* ---------- Main ---------- */
async function main() {
  const F = loadSeed(), qrcode = loadEncoder(), jsQR = loadDecoder();
  if (!F.cardUrlProd) throw new Error('data.js has no F.cardUrlProd');
  const pts = F.SEED.patients.filter(p => p.card && p.card.token);
  const pilots = pts.filter(p => p.cardId).sort((a, b) => String(a.cardId).localeCompare(String(b.cardId)));
  const samples = pts.filter(p => !p.cardId);
  const slug = p => (p.first + '-' + p.last).replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const BLACK = [0, 0, 0], WHITE = [255, 255, 255], INK = [0x1f, 0x2f, 0x16], CREAM = [0xf7, 0xf0, 0xe2];
  const ppm = Math.round(SIZE / (PRINT_MM / 1000)); /* pixels per metre, so 1200 px prints at 28 mm */
  const made = [], fails = [];
  const items = pilots.map(p => ({ p, dir: OUT, code: String(p.cardId).toUpperCase() }))
    .concat(samples.map(p => ({ p, dir: path.join(OUT, 'samples'), code: 'Folio-' + p.folioId })));

  for (const it of items) {
    const p = it.p, url = F.cardUrlProd(p.card.token), mx = matrix(qrcode, url);
    const base = it.code + '_' + slug(p);
    const files = [
      [path.join(it.dir, base + '.png'), BLACK, WHITE],
      [path.join(it.dir, 'brand', base + '_brand.png'), INK, CREAM]
    ];
    for (const [file, ink, field] of files) {
      writePng(file, SIZE, SIZE, render(mx, SIZE, ink, field), ppm, [['Title', 'Folio card ' + it.code], ['Comment', url]]);
      /* Round trip: read the file back and decode it */
      const img = readPng(file), got = jsQR(img.data, img.w, img.h, { inversionAttempts: 'dontInvert' });
      const text = got && got.data, tok = text ? new URL(text).searchParams.get('t') : '';
      const who = F.SEED.patients.filter(x => x.card && x.card.token === tok)[0];
      const ok = text === url && who && who.id === p.id;
      (ok ? made : fails).push({ file: path.relative(ROOT, file), code: it.code, name: p.first + ' ' + p.last, version: mx.version, url, decoded: text || '(nothing)' });
    }
    it.mx = mx; it.url = url;
  }

  /* ---------- Print sheet: the four pilot codes at exactly 28 mm (quiet zone included), labels outside ---------- */
  const sheetItems = items.filter(it => it.p.cardId);
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Folio QR print sheet</title>
<style>
  @page { size: letter; margin: 0; }
  html, body { margin: 0; background: #fff; color: #000; font-family: Helvetica, Arial, sans-serif; }
  .page { width: 215.9mm; height: 279.4mm; box-sizing: border-box; padding: 18mm 20mm; }
  h1 { font-size: 15pt; margin: 0 0 2mm; }
  p { font-size: 9.5pt; margin: 0 0 1.5mm; line-height: 1.35; }
  .grid { display: grid; grid-template-columns: repeat(2, 70mm); gap: 14mm 22mm; margin-top: 10mm; }
  .cell { display: flex; flex-direction: column; align-items: center; }
  .cut { padding: 2mm; border: .2mm dashed #888; }
  .qr { display: block; width: ${PRINT_MM}mm; height: ${PRINT_MM}mm; }
  .qr svg { display: block; width: 100%; height: 100%; }
  .lbl { margin-top: 3mm; text-align: center; font-size: 10pt; line-height: 1.3; }
  .lbl b { display: block; font-size: 12pt; }
  .ruler { margin-top: 12mm; display: flex; align-items: center; gap: 4mm; font-size: 9pt; }
  .ruler i { display: block; width: 50mm; height: 3mm; border: .3mm solid #000; border-top: 0; }
</style></head><body><div class="page">
<h1>Folio card QR codes, print at 100% (actual size)</h1>
<p>Each code is ${PRINT_MM} mm square including its white quiet zone. Cut on or outside the dashed line, never inside the white margin.</p>
<p>Check the printout: the bar below must measure exactly 50 mm. Test scan every code with a phone camera before printing more.</p>
<div class="grid">
${sheetItems.map(it => `  <div class="cell"><div class="cut"><div class="qr">${svgOf(it.mx, '#000', '#fff')}</div></div><div class="lbl"><b>${it.p.first} ${it.p.last}</b>${it.code} · ${F.CARD_SHAPES[it.p.card.shape] || ''}</div></div>`).join('\n')}
</div>
<div class="ruler"><i></i><span>50 mm check bar</span></div>
</div></body></html>
`;
  fs.writeFileSync(path.join(OUT, 'print-sheet.html'), html);

  let sheet = 'print-sheet.html only (Playwright not found)';
  let pw = null;
  try { pw = require('playwright'); } catch (e) { try { pw = require(path.join(process.env.PLAYWRIGHT_DIR || '/opt/node-tools/node_modules', 'playwright')); } catch (e2) {} }
  if (pw) {
    const b = await pw.chromium.launch();
    const scale = SHEET_DPI / 96;
    const page = await b.newPage({ viewport: { width: 816, height: 1056 }, deviceScaleFactor: scale });
    await page.goto('file://' + path.join(OUT, 'print-sheet.html'));
    const shot = await page.screenshot({ fullPage: false });
    /* Add a 600 dpi pHYs chunk after IHDR so print dialogs size the sheet correctly */
    const dpm = Math.round(SHEET_DPI / 0.0254), phys = Buffer.alloc(9); phys.writeUInt32BE(dpm, 0); phys.writeUInt32BE(dpm, 4); phys[8] = 1;
    fs.writeFileSync(path.join(OUT, 'print-sheet.png'), Buffer.concat([shot.subarray(0, 33), chunk('pHYs', phys), shot.subarray(33)]));
    await page.pdf({ path: path.join(OUT, 'print-sheet.pdf'), format: 'Letter', printBackground: true, preferCSSPageSize: true });
    await b.close();
    sheet = 'print-sheet.html, print-sheet.png (' + Math.round(816 * scale) + ' x ' + Math.round(1056 * scale) + ' px, 600 dpi), print-sheet.pdf';
  }

  console.log('Folio QR codes (' + ECL + ', quiet zone ' + QUIET + ', ' + SIZE + ' px, prints at ' + PRINT_MM + ' mm)');
  made.forEach(m => console.log('  ok    ' + m.file + '  v' + m.version + '  ' + m.name));
  fails.forEach(m => console.log('  FAIL  ' + m.file + '  decoded: ' + m.decoded));
  console.log('  sheet ' + sheet);
  console.log(made.length + ' verified, ' + fails.length + ' failed');
  if (fails.length) process.exit(1);
}
main().catch(e => { console.error(e); process.exit(1); });
