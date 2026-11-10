/* Folio patient app service worker. Cache the app shell so it opens offline. Bump VERSION when files change. */
var VERSION = 'folio-app-v1';
var SHELL = ['./', 'index.html', 'app.css', 'app.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png',
  '../shared/css/tokens.css', '../shared/css/base.css', '../shared/css/paper.css', '../shared/css/card.css',
  '../shared/js/data.js', '../shared/js/store.js', '../shared/js/ui.js', '../shared/favicon.svg'];
self.addEventListener('install', function (e) { e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); })); });
self.addEventListener('activate', function (e) { e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); })); });
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request).then(function (hit) {
    var net = fetch(e.request).then(function (r) { if (r && r.ok) { var cp = r.clone(); caches.open(VERSION).then(function (c) { c.put(e.request, cp); }); } return r; }).catch(function () { return hit; });
    return hit || net;
  }));
});
