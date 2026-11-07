import assert from 'node:assert/strict';import {test} from 'node:test';import {createServer as backendServer} from 'node:http';import {createServer} from 'vite';import {fileURLToPath} from 'node:url';
test('development proxies only native host routes and retains Vite SPA assets',async()=>{
 const calls=[];const backend=backendServer((req,res)=>{calls.push(req.url);res.setHeader('Content-Type','application/json');res.end(JSON.stringify({path:req.url}));});
 await new Promise(resolve=>backend.listen(0,'127.0.0.1',resolve));
 process.env.FILAMAN_DEV_URL=`http://127.0.0.1:${backend.address().port}`;process.env.VITE_BASE_PATH='/plugins/filament-swatch/';
 const vite=await createServer({configFile:fileURLToPath(new URL('../vite.config.ts',import.meta.url)),optimizeDeps:{noDiscovery:true,entries:[]},server:{port:0,host:'127.0.0.1',open:false}});
 try{await vite.listen();const origin=`http://127.0.0.1:${vite.httpServer.address().port}`;
 for(const path of ['/api/v1/me','/auth/me','/plugins/filament-swatch/hosted-config','/spool-reel.js','/reel-flange.webp','/plugin-fonts.css','/_astro/font.woff2'])assert.equal((await(await fetch(origin+path)).json()).path,path);
 const html=await(await fetch(origin+'/plugins/filament-swatch/app/swatch')).text();assert.match(html,/@vite\/client/);assert.equal(calls.length,7);
 }finally{await vite.close();await new Promise(resolve=>backend.close(resolve));delete process.env.FILAMAN_DEV_URL;delete process.env.VITE_BASE_PATH;}
});
