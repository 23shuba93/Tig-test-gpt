/* Versioned, scope-specific, atomic offline shell. Never caches progress. */
'use strict';
const VERSION='1.0.1';
const PREFIX='welding-pwa:'+self.registration.scope+':';
const CACHE=PREFIX+VERSION;
const FILES=['./','./index.html','./style.css','./questions.js','./engine.js','./app.js','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./icons/maskable-512.png','./icons/apple-touch-icon.png'];
const URLS=FILES.map(path=>new URL(path,self.registration.scope).href);
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(CACHE);
 // Cache.addAll is atomic: a missing asset prevents successful installation.
 await cache.addAll(URLS.map(url=>new Request(url,{cache:'reload'})));
 // Updates wait for explicit confirmation; first installation activates normally.
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)));await self.clients.claim();
})()));
self.addEventListener('message',event=>{
 if(event.data?.type==='SKIP_WAITING')event.waitUntil(self.skipWaiting());
 if(event.data?.type==='CACHE_STATUS')event.waitUntil((async()=>{const c=await caches.open(CACHE);const matches=await Promise.all(URLS.map(u=>c.match(u)));event.ports[0]?.postMessage({ready:matches.every(Boolean),version:VERSION});})());
});
self.addEventListener('fetch',event=>{
 const req=event.request,url=new URL(req.url);if(req.method!=='GET'||!url.href.startsWith(self.registration.scope)||url.origin!==self.location.origin)return;
 if(req.mode==='navigate'){
  event.respondWith((async()=>{const c=await caches.open(CACHE);const offline=await c.match(new URL('index.html',self.registration.scope).href);return offline||fetch(req);})());return;
 }
 // Only application assets use the versioned cache. No analytics or external requests.
 if(URLS.includes(url.href))event.respondWith((async()=>{const c=await caches.open(CACHE);return await c.match(req)||fetch(req);})());
});
