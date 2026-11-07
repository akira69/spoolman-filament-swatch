import assert from 'node:assert/strict';import {test} from 'node:test';import {createServer} from 'vite';
test('ephemeral discovery state survives a host reload and is isolated by native user',async()=>{
 const data=new Map();globalThis.sessionStorage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
 const server=await createServer({configFile:false,server:{middlewareMode:true,hmr:false,ws:false},optimizeDeps:{noDiscovery:true}});
 try{const {hostContext}=await server.ssrLoadModule('/src/filaman/context.ts');const s=await server.ssrLoadModule('/src/filaman/discovery-state.ts');hostContext.userId=4;
 s.saveDiscoveryState({mode:'catalog',filters:{inventory:{search:'red'},catalog:{search:'clear'}},pins:['filament:17','color:17']});assert.equal(s.readDiscoveryState().filters.catalog.search,'clear');
 hostContext.userId=9;assert.deepEqual(s.readDiscoveryState(),{});hostContext.userId=4;assert.deepEqual(s.readDiscoveryState().pins,['filament:17','color:17']);
 }finally{await server.close();delete globalThis.sessionStorage;}
});
