import assert from 'node:assert/strict';
import {test} from 'node:test';
import {ref} from 'vue';
import {createServer} from 'vite';
import {fileURLToPath} from 'node:url';
test('wheel leaves missing hues empty and a single color never occupies more than 30 degrees',async()=>{
 const server=await createServer({configFile:false,server:{middlewareMode:true,hmr:false,ws:false},optimizeDeps:{noDiscovery:true},resolve:{alias:{'@':fileURLToPath(new URL('../src',import.meta.url))}}});
 try{
 const {useColorWheel}=await server.ssrLoadModule('/src/composables/useColorWheel.ts');
 const red={id:'red',colorHex:'#FF000000'},green={id:'green',colorHex:'#00FF00'},orange={id:'orange',colorHex:'#FF4000'};
 for(const items of [[red,green],[red,green,orange]]){
  const wheel=useColorWheel(ref(red),ref(items)),slots=wheel.colorWheelItems.value;assert.equal(slots.length,24);assert.equal(slots[4],null,'60 degrees has no nearby color');assert.equal(slots[8]?.id,'green','green stays near its actual 120-degree hue');
  for(const item of items)assert.ok(slots.filter(s=>s?.id===item.id).length*15<=30,item.id+' maximum arc');
  assert.ok(slots.filter(Boolean).length<slots.length);assert.equal(red.colorHex,'#FF000000');
 }
 }finally{await server.close();}
});
