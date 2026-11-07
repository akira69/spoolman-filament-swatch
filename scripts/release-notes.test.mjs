import assert from 'node:assert/strict';import {test} from 'node:test';import {createServer} from 'vite';
test('installed release notes remain offline and repository/version qualified',async()=>{
 const server=await createServer({configFile:false,server:{middlewareMode:true,hmr:false,ws:false},optimizeDeps:{noDiscovery:true}});
 try{const r=await server.ssrLoadModule('/src/filaman/release.ts');const n=r.getInstalledReleaseNotes();assert.equal(n.version,'1.1.0');assert.equal(n.repository,'akira69/filaman-filament-swatch');assert.equal(n.url,'https://github.com/akira69/filaman-filament-swatch/releases/tag/filaman-v1.1.0');assert.match(n.body.en,/native/i);assert.match(r.releaseStorageKey,/akira69.*1.1.0/);}finally{await server.close();}
});
