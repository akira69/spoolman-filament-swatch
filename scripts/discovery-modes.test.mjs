import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createServer} from 'vite';
import {fileURLToPath} from 'node:url';
import {readFile} from 'node:fs/promises';
test('mode failures are isolated; per-mode filters, cached catalog and history survive',async()=>{
 const url=new URL('http://test/app/swatch?filaman_hosted=1');const handlers={};
 globalThis.window={location:url,addEventListener:(k,f)=>handlers[k]=f,history:{replaceState:(_,__,next)=>url.href=new URL(next,url).href,pushState:(_,__,next)=>url.href=new URL(next,url).href}};
 const f=JSON.parse(await readFile(new URL('./fixtures/filaman/contracts.json',import.meta.url),'utf8'));let deny=true;let calls=0;
 globalThis.fetch=async(path)=>{const u=new URL(path,url);if(u.pathname==='/api/v1/me')return Response.json({id:1}); if(deny&&u.pathname==='/api/v1/filaments')return new Response('',{status:403});if(u.pathname.endsWith('/discovery/snapshot'))return new Response(null,{status:404});if(u.pathname==='/api/v1/colors')calls++;const data=f[u.pathname];return new Response(JSON.stringify(Array.isArray(data)?data:data[u.searchParams.get('page')||'1']));};
 const server=await createServer({configFile:false,server:{middlewareMode:true,hmr:false,ws:false},optimizeDeps:{noDiscovery:true},resolve:{alias:{'@':fileURLToPath(new URL('../src',import.meta.url))}}});
 try{const {useFilaments}=await server.ssrLoadModule('/src/composables/useFilaments.ts');const s=useFilaments();
 await s.refresh();assert.match(s.error.value,/403/);await s.setDiscoveryMode('catalog');assert.equal(s.filtered.value.length,3);assert.equal(s.error.value,null);
 s.filters.search='Transparent';await new Promise(setImmediate);assert.equal(s.filtered.value.length,1);
 deny=false;await s.setDiscoveryMode('inventory');assert.equal(s.filtered.value.length,3);s.filters.material='PETG';await new Promise(setImmediate);assert.equal(s.filtered.value.length,1);
 await s.setDiscoveryMode('catalog');assert.equal(s.filters.search,'Transparent');assert.equal(s.filtered.value[0].id,'color:17');assert.equal(calls,4);
 url.searchParams.set('mode','inventory');url.searchParams.set('m','PETG');url.searchParams.delete('q');handlers.popstate();await new Promise(setImmediate);assert.equal(s.mode.value,'inventory');assert.equal(s.filters.material,'PETG');
 deny=true;await s.refresh();assert.equal(s.inventoryItems.value.length,0);assert.ok(s.cachedItems.value.every(i=>i.kind==='catalog'));
 }finally{await server.close();delete globalThis.window;}
});

test('location and on-hand filters require the same spool',async()=>{
 const url=new URL('http://test/app/swatch');globalThis.window={location:url,addEventListener(){},history:{replaceState:(_,__,next)=>url.href=new URL(next,url).href,pushState:(_,__,next)=>url.href=new URL(next,url).href}};
 const f=JSON.parse(await readFile(new URL('./fixtures/filaman/contracts.json',import.meta.url),'utf8'));
 f['/api/v1/spools/statuses'][0].key='new';
 Object.assign(f['/api/v1/spools']['1'].items[0],{status_id:2,location_id:1});
 Object.assign(f['/api/v1/spools']['1'].items[1],{filament_id:17,location_id:2});
 Object.assign(f['/api/v1/locations']['1'],{items:[{id:1,name:'Shelf A'},{id:2,name:'Shelf B'}],total:2});
 globalThis.fetch=async path=>{const u=new URL(path,url);if(u.pathname==='/api/v1/me')return Response.json({id:1});const v=f[u.pathname];return new Response(JSON.stringify(Array.isArray(v)?v:v[u.searchParams.get('page')||'1']));};
 const server=await createServer({configFile:false,server:{middlewareMode:true,hmr:false,ws:false},optimizeDeps:{noDiscovery:true},resolve:{alias:{'@':fileURLToPath(new URL('../src',import.meta.url))}}});
 try{const {useFilaments}=await server.ssrLoadModule('/src/composables/useFilaments.ts');const s=useFilaments();await s.refresh();s.filters.inventoryScope='on_hand_spools';s.filters.location='Shelf A';assert.equal(s.filtered.value.length,0);s.filters.location='Shelf B';assert.deepEqual(s.filtered.value.map(x=>x.id),['filament:17']);}finally{await server.close();delete globalThis.window;}
});

test('re-entering a cached inventory revalidates access after catalog focus',async()=>{
 const url=new URL('http://test/app/swatch');const events={};globalThis.window={location:url,addEventListener:(k,f)=>events[k]=f,history:{replaceState:(_,__,next)=>url.href=new URL(next,url).href,pushState:(_,__,next)=>url.href=new URL(next,url).href}};
 const f=JSON.parse(await readFile(new URL('./fixtures/filaman/contracts.json',import.meta.url),'utf8'));let denied=false;
 globalThis.fetch=async path=>{const u=new URL(path,url);if(u.pathname==='/api/v1/me')return Response.json({id:1});if(denied&&u.pathname==='/api/v1/filaments')return new Response('',{status:403});const v=f[u.pathname];return new Response(JSON.stringify(Array.isArray(v)?v:v[u.searchParams.get('page')||'1']));};
 const server=await createServer({configFile:false,server:{middlewareMode:true,hmr:false,ws:false},optimizeDeps:{noDiscovery:true},resolve:{alias:{'@':fileURLToPath(new URL('../src',import.meta.url))}}});
 try{const {useFilaments}=await server.ssrLoadModule('/src/composables/useFilaments.ts');const s=useFilaments();await s.refresh();assert.equal(s.inventoryItems.value.length,3);await s.setDiscoveryMode('catalog');denied=true;events.focus();await new Promise(setImmediate);await s.setDiscoveryMode('inventory');assert.equal(s.inventoryItems.value.length,0);assert.match(s.error.value,/403/);}finally{await server.close();delete globalThis.window;}
});
