const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const scope='https://example.test/project/',handlers={},stores=new Map();let online=true,claims=0;
const caches={async open(key){if(!stores.has(key))stores.set(key,new Map());const store=stores.get(key);return {async addAll(requests){const staged=[];for(const r of requests){const url=new URL(r.url||r);const file=url.pathname.replace('/project/','')||'index.html';const p=path.join(__dirname,'..',file);if(!fs.existsSync(p))throw Error('missing '+file);staged.push([url.href,fs.readFileSync(p)]);}for(const [k,v] of staged)store.set(k,v);},async match(req){const body=store.get(typeof req==='string'?req:req.url);return body?new Response(body):undefined;}};},async keys(){return [...stores.keys()];},async delete(key){return stores.delete(key);}};
const ctx={URL,Request,Response,Promise,caches,fetch:async()=>{if(!online)throw Error('network offline');return new Response('network');},self:{registration:{scope},location:{origin:'https://example.test'},clients:{claim:async()=>{claims++;}},skipWaiting:async()=>{},addEventListener:(type,fn)=>handlers[type]=fn}};
vm.runInNewContext(fs.readFileSync(__dirname+'/../sw.js','utf8'),ctx);
async function event(type,extra={}){let wait,result;handlers[type]({...extra,waitUntil:p=>wait=p,respondWith:p=>result=p});if(wait)await wait;return result?await result:undefined;}
(async()=>{
 stores.set('welding-pwa:https://example.test/other/:old',new Map());stores.set('welding-pwa:'+scope+':old',new Map());
 await event('install');await event('activate');assert.equal(claims,1);assert(stores.has('welding-pwa:https://example.test/other/:old'));assert(!stores.has('welding-pwa:'+scope+':old'));
 let status;await event('message',{data:{type:'CACHE_STATUS'},ports:[{postMessage:r=>status=r}]});assert.equal(status.ready,true);
 online=false;const nav=await event('fetch',{request:{url:scope,method:'GET',mode:'navigate'}});assert((await nav.text()).includes('Практикум'));
 for(const file of ['questions.js','engine.js','app.js','style.css','manifest.webmanifest']){const r=await event('fetch',{request:new Request(scope+file)});assert(r&&r.ok);}
 const outside=await event('fetch',{request:new Request('https://outside.test/')});assert.equal(outside,undefined);
 console.log('PASS: atomic complete precache, offline navigation + assets, scope-specific cleanup, cache status and external-request exclusion.');
})().catch(e=>{console.error(e);process.exit(1);});
