import assert from 'node:assert/strict';import {test} from 'node:test';import {createServer} from 'vite';
test('shared reel uses native fill and ordered alpha colors, with explicit unknown fallback',async()=>{
 const server=await createServer({configFile:false,server:{middlewareMode:true,hmr:false,ws:false},optimizeDeps:{noDiscovery:true}});
 try{const {renderNativeSpool}=await server.ssrLoadModule('/src/filaman/spool-visuals.ts');const calls=[];const renderer={renderSpoolReel:(...args)=>{calls.push(args);return '<svg id="reel"><use href="#reel"/></svg>'}};
 for(const value of [0,25,50,100]) assert.match(renderNativeSpool(renderer,value,['#FF000000','#FF000088'],'striped','s17'),/s17-reel/);
 assert.deepEqual(calls.map(c=>c[0]),[0,.25,.5,1]);assert.deepEqual(calls[0].slice(1),[['#FF000000','#FF000088'],'striped',{view:'quarter'}]);
 assert.equal(renderNativeSpool(renderer,null,['#fff'],'gradient','s18'),null);assert.equal(calls.length,4);
 }finally{await server.close()}
});
test('native striped swatches keep hard stops and zero alpha rather than blending',async()=>{
 const server=await createServer({configFile:false,server:{middlewareMode:true,hmr:false,ws:false},optimizeDeps:{noDiscovery:true}});
 try{const {getFlatSwatchStyle,getSwatchStyle}=await server.ssrLoadModule('/src/lib/swatchUtils.ts');
 const colors=['#FF000000','#0000FF'];
 for(const css of [getFlatSwatchStyle(colors[0],colors,undefined,'striped'),getSwatchStyle(colors[0],'PLA',colors,undefined,'striped')]){
  assert.match(css.background,/#FF000000 0%, #FF000000 50%, #0000FF 50%, #0000FF 100%/);
  assert.match(css.background,/repeating-conic-gradient/);
 }
 }finally{await server.close()}
});

test('the wheel picks the original nearest slots and decodes each color once',async()=>{
 const {ref}=await import('vue');
 const server=await createServer({server:{middlewareMode:true,hmr:false,ws:false},optimizeDeps:{noDiscovery:true}});
 try{
  const {useColorWheel}=await server.ssrLoadModule('/src/composables/useColorWheel.ts');
  const {getHue,hueDifference}=await server.ssrLoadModule('/src/lib/colorUtils.ts');
  let reads=0;
  const items=['#FE0020','#FF0000','#FE0020','#EAFF00','#78FF19','#888888','#0000FF','#D000FF']
    .map((hex,id)=>({id:String(id),get colorHex(){reads++;return hex;}}));
  const expected=Array.from({length:24},(_,slot)=>items.map(item=>({item,d:hueDifference(getHue(item.colorHex),slot*15)}))
    .sort((a,b)=>a.d-b.d).find(entry=>entry.d<15)?.item.id??null);
  reads=0;
  const {colorWheelItems}=useColorWheel(ref(items[0]),ref(items));
  assert.deepEqual(colorWheelItems.value.map(item=>item?.id??null),expected);
  assert.equal(reads,items.length);
 }finally{await server.close();}
});
