import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createServer} from 'vite';
test('money keeps currency, unknowns and locale',async()=>{
 const server=await createServer({configFile:false,server:{middlewareMode:true,hmr:false,ws:false},optimizeDeps:{noDiscovery:true}});
 try{const f=await server.ssrLoadModule('/src/filaman/format.ts');const ctx={language:'fr',currency:'EUR',theme:'light'};
 assert.equal(f.formatMoney(0,'USD',ctx),new Intl.NumberFormat('fr-FR',{style:'currency',currency:'USD'}).format(0));
 assert.equal(f.formatMoney(1,null,ctx),'—');assert.equal(f.formatMoney(null,'USD',ctx),'—');assert.equal(f.formatMoney(1,'not money',ctx),'—');
 for(const currency of ['JPY','KWD']) assert.equal(f.formatMoney(1234.56,currency,ctx),new Intl.NumberFormat('fr-FR',{style:'currency',currency}).format(1234.56));
 }finally{await server.close()}
});
