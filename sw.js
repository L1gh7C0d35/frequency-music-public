/* Lightweight shell cache. Audio streams over the network; catalog is network-first. */
const VERSION='frequency-web-v45-artist-navigation-20261013';
const CORE=['./','./index.html','./listening-room.css','./listening-room.js','./frequency-parity.css','./frequency-parity.js','./manifest.webmanifest','./artwork/fresh-cuts.svg'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(VERSION).then(c=>c.addAll(CORE)));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('frequency-web-')&&k!==VERSION).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET')return;
 const url=new URL(e.request.url);if(url.origin!==self.location.origin)return;
 if(url.pathname.includes('/audio/')||url.pathname.includes('/artwork/'))return;
 if(url.pathname.endsWith('/listening-catalog.json')){
   e.respondWith(fetch(e.request).then(r=>{if(r.ok){const copy=r.clone();caches.open(VERSION).then(c=>c.put(e.request,copy));}return r;}).catch(()=>caches.match(e.request)));return;
 }
 e.respondWith(fetch(e.request).then(r=>r).catch(()=>caches.match(e.request).then(r=>r||Response.error())));
});
