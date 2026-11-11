/* Folio patient app service worker.
   - App files (HTML, JS, CSS, manifest) are network-first with a short timeout, so a deploy is picked up on the
     next open even if nobody bumps VERSION, and the cached copy is used offline or on a slow network.
   - Fonts, icons and launch images are cached as they are used (cache-first).
   - Navigations fall back to the cached app page when offline.
   Bump VERSION when the list of app files changes. */
var VERSION = 'folio-app-v6';
var RUNTIME = 'folio-runtime-v2';
var SHELL = ['./', 'index.html', 'ios.css', 'app.js', 'native.js', 'fun-ui.css', 'fun-ui.js', 'fun-home.css', 'fun-home.js', 'intro.css', 'intro.js', 'haptic-tap.js', 'polish.js', 'polish.css', 'manifest.webmanifest', 'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png',
  '../shared/css/tokens.css', '../shared/css/card.css',
  '../shared/js/data.js', '../shared/js/store.js', '../shared/js/ui.js', '../shared/favicon.svg'];
var APP_FILE = /\.(html|js|css|webmanifest)$|\/$/;

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) {
    /* cache: 'reload' skips the HTTP cache so a new version never precaches stale files */
    return c.addAll(SHELL.map(function (u) { return new Request(u, { cache: 'reload' }); }));
  }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== VERSION && k !== RUNTIME; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

function timeout(ms) { return new Promise(function (_, rej) { setTimeout(function () { rej(new Error('timeout')); }, ms); }); }
function networkFirst(req, fallbackUrl) {
  var net = fetch(req, { cache: 'no-cache' }).then(function (r) {
    if (r && r.ok && r.type === 'basic') { var cp = r.clone(); caches.open(VERSION).then(function (c) { c.put(req, cp); }); }
    return r;
  });
  return Promise.race([net, timeout(2500)]).catch(function () {
    return caches.match(req, { ignoreSearch: req.mode === 'navigate' }).then(function (hit) {
      if (hit) return hit;
      if (fallbackUrl) return caches.match(fallbackUrl).then(function (f) { return f || net; });
      return net;
    });
  });
}
function cacheFirst(req) {
  return caches.match(req).then(function (hit) {
    if (hit) return hit;
    return fetch(req).then(function (r) {
      /* Google Fonts CSS is opaque (no-cors); still worth keeping for offline */
      if (r && (r.ok || r.type === 'opaque')) { var cp = r.clone(); caches.open(RUNTIME).then(function (c) { c.put(req, cp); }); }
      return r;
    });
  });
}

self.addEventListener('fetch', function (e) {
  var req = e.request; if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin === location.origin) {
    if (req.mode === 'navigate') { e.respondWith(networkFirst(req, new URL('index.html', self.registration.scope).href)); return; }
    if (APP_FILE.test(url.pathname)) { e.respondWith(networkFirst(req)); return; }
    e.respondWith(cacheFirst(req)); return;
  }
  if (/^fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) { e.respondWith(cacheFirst(req)); return; }
});
