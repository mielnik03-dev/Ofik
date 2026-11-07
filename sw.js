const CACHE='waiter-v3';
const SHELL=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png','apple-touch-icon.png'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
const put=(r,res)=>{if(res&&(res.ok||res.type==='opaque')){const copy=res.clone();caches.open(CACHE).then(c=>c.put(r,copy));}return res;};
self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET')return;
  const u=new URL(r.url);
  const page=r.mode==='navigate'||(u.origin===location.origin&&(u.pathname.endsWith('/')||u.pathname.endsWith('.html')));
  if(page){
    /* страница: сначала сеть (чтобы приходили обновления), но не дольше 2,5 с; иначе из памяти */
    const timeout=new Promise((_,rej)=>setTimeout(rej,2500));
    e.respondWith(Promise.race([fetch(r),timeout]).then(res=>put(r,res)).catch(()=>caches.match(r).then(m=>m||caches.match('index.html'))));
    return;
  }
  /* остальное: из памяти, в фоне обновляем (шрифты, иконки) */
  e.respondWith(caches.match(r).then(m=>{
    const net=fetch(r).then(res=>put(r,res)).catch(()=>m);
    return m||net;
  }));
});
