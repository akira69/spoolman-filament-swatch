import 'vue';import assert from 'node:assert/strict';import {test} from 'node:test';import {createServer} from 'vite';
test('verified account changes keep the old app invalid until the clean launch completes',async()=>{
 const previous={window:globalThis.window,document:globalThis.document,MutationObserver:globalThis.MutationObserver,fetch:globalThis.fetch};const events={},launches=[];let owner=1;
 const root={dataset:{theme:'brand'},classList:{toggle(){}}};globalThis.document={documentElement:root,addEventListener(){},removeEventListener(){}};
 globalThis.window={location:{replace:url=>launches.push(url)},addEventListener:(name,fn)=>events[name]=fn,removeEventListener(){}};window.parent=window;window.document=document;
 globalThis.MutationObserver=class{observe(){}disconnect(){}};
 globalThis.fetch=async path=>new Response(JSON.stringify(path==='/api/v1/me'?{id:owner,language:'en'}:{currency:'EUR'}));
 const server=await createServer({configFile:false,server:{middlewareMode:true,hmr:false,ws:false},optimizeDeps:{noDiscovery:true}});
 try{const {startHostContext}=await server.ssrLoadModule('/src/filaman/context.ts');const host=startHostContext();await host.ready;assert.equal(host.context.userId,1);owner=2;events.focus();await new Promise(setImmediate);assert.equal(host.context.userId,null);assert.equal(launches.length,1);assert.equal(new URL(launches[0],'https://test').pathname,'/plugins/filament-swatch/');events.focus();await new Promise(setImmediate);assert.equal(host.context.userId,null);assert.equal(launches.length,1);host.stop();}finally{await server.close();Object.assign(globalThis,previous);}
});
