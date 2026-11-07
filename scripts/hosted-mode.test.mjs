import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {before,after,test} from 'node:test';
import puppeteer from 'puppeteer';
const origin='https://swatch.test',base='/plugins/filament-swatch/';
const fixture=JSON.parse(await readFile(new URL('./fixtures/filaman/contracts.json',import.meta.url),'utf8'));
const themes=await readFile(new URL('./fixtures/filaman/themes.css',import.meta.url),'utf8');
let browser;before(async()=>{browser=await puppeteer.launch({headless:true,args:process.env.CI?['--no-sandbox']:[]});});after(async()=>await browser?.close());
async function open(options={}){
 const context=await browser.createBrowserContext();const page=await context.newPage();await page.setViewport(options.mobileHost?{width:390,height:844}:{width:1400,height:900});
 const requests=[],errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.evaluateOnNewDocument(()=>{localStorage.setItem('spoolman-url','/old-server');localStorage.setItem('locale','de');});
 await page.setRequestInterception(true);
 page.on('request',async request=>{
  const u=new URL(request.url());requests.push(u.href);const respond=(value,status=200)=>request.respond({status,contentType:'application/json',body:JSON.stringify(value)});
  if(u.origin!==origin){if(process.env.CAPTURE_SWATCH && /(?:iconify\.design|googleapis\.com|gstatic\.com)$/.test(u.hostname))return request.continue();return respond([]);}
  if(u.pathname==='/shell')return request.respond({contentType:'text/html',body:`<html lang="en" data-theme="brand"><head><style>${themes}</style></head><body style="margin:0">${options.mobileHost?'<button id="sidebar-toggle" style="position:fixed;left:7px;top:13px;width:40px;height:40px;z-index:50">Menu</button>':''}<iframe style="width:100%;height:100vh;border:0" src="${base}app/swatch?filaman_hosted=1&filaman_hosted_config=${base}hosted-config&mode=catalog"></iframe></body></html>`});
  if(u.pathname===base+'hosted-config')return respond(options.badConfig?{}:{contract_version:2,mode:'hosted',app_key:'filaman',api_base_path:'/api/v1',app_base_path:base.slice(0,-1)},options.configStatus||200);
  if(u.pathname==='/plugin-fonts.css')return request.respond({contentType:'text/css',body:''});
  if(u.pathname==='/login')return request.respond({contentType:'text/html',body:'<h1>Sign in</h1>'});
  if(u.pathname==='/api/v1/me')return respond({id:options.userId??1,language:options.language||'en'},options.expireSettings?401:options.failSettings?503:200);
  if(u.pathname==='/api/v1/app-settings/public-info'){
   if(options.currencyGate)await options.currencyGate;
   return respond({currency:options.currency||'EUR'},options.currencyFailed?503:200);
  }
  if(u.pathname.startsWith('/api/v1/')){
   if(options.catalogSnapshot && u.pathname==='/api/v1/colors/discovery/snapshot'){
    const etag = `"catalog-${options.catalogSnapshot}"`;
    if (options.denyCatalog) return respond({},403);
    if (request.headers()['if-none-match'] === etag) return request.respond({status:304,headers:{etag}});
    const items=Object.values(fixture['/api/v1/colors']).flatMap(page=>page.items);
    return request.respond({contentType:'application/json',headers:{etag},body:JSON.stringify({items:options.catalogSnapshot === 1 ? items : items.slice(1)})});
   }
   if(options.switchDuringCatalog && u.pathname==='/api/v1/colors') {
    options.switchDuringCatalog=false;
    options.userId=2;
   }
   if(options.inventoryGate && u.pathname==='/api/v1/filaments')await options.inventoryGate;
   if(options.denyCatalog && u.pathname==='/api/v1/colors')return respond({},403);
   if(options.denyInventory && u.pathname==='/api/v1/filaments'){
    if(options.failProfileAfterDenial)options.failSettings=true;
    return respond({},403);
   }
   if(u.pathname.includes('/manufacturers/'))return request.respond({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><rect width="20" height="20" fill="red"/></svg>'});
   if(options.largeCatalog && u.pathname==='/api/v1/colors'){
    const page=Number(u.searchParams.get('page')||1),size=Number(u.searchParams.get('page_size')||200),total=1392;
    return respond({items:Array.from({length:Math.max(0,Math.min(size,total-(page-1)*size))},(_,i)=>({id:10000+(page-1)*size+i,name:`Catalog ${(page-1)*size+i}`,hex_code:'#00AE42',usage_count:0})),page,page_size:size,total});
   }
   const value=fixture[u.pathname];if(value){const page=structuredClone(Array.isArray(value)?value:value[u.searchParams.get('page')||'1']);if(u.pathname==='/api/v1/filaments'&&(options.detailMetrics||options.gradient))for(const item of page.items)if(item.id===17){
    if(options.detailMetrics)Object.assign(item,{raw_material_weight_g:1000,price:8,density_g_cm3:1.06,diameter_mm:1.75});
    if(options.gradient)Object.assign(item,{multi_color_style:'gradient',colors:['#FF0000AA','#BB00B8AA','#006A3FAA','#0000FFAA'].map((hex_code,index)=>({position:index+1,color_id:index+1,color:{hex_code}}))});
   }
   if(options.spoolGroups && u.pathname==='/api/v1/spools'){
    const spool=(id,weight,percent,status_id=1,location_id=null)=>({id,filament_id:17,status_id,location_id,
     metrics:{remaining_percent:percent,effective_remaining_weight_g:weight}});
    const items=[spool(17,1000,100,1,1),spool(20,707,70.7),spool(18,1000,100),
     spool(19,1000,100),spool(21,750,100),spool(22,1000,100,2),spool(23,null,null)];
    return respond({items,page:1,page_size:200,total:items.length});
   }return respond(page);}
   return respond({},404);
  }
  if(u.pathname==='/real-spool-reel.js'&&process.env.SHARED_REEL_FILE)return request.respond({contentType:'application/javascript',body:await readFile(process.env.SHARED_REEL_FILE,'utf8')});
  if(u.pathname==='/spool-reel.js'&&process.env.SHARED_REEL_FILE)return request.respond({contentType:'application/javascript',body:"import{renderSpoolReel as real}from'/real-spool-reel.js';export function renderSpoolReel(...args){window.__reelCalls??=[];window.__reelCalls.push(args);return real(...args)}"});
  if(u.pathname==='/spool-reel.js')return request.respond({contentType:'application/javascript',body:'export function renderSpoolReel(f,c,s,o){window.__reelCalls??=[];window.__reelCalls.push([f,c,s,o]);return `<svg id="reel" viewBox="0 0 100 100"><rect width="100" height="100" fill="red"/></svg>`}'});
  const path=u.pathname.slice(base.length);let body;try{body=await readFile(new URL((process.env.SWATCH_DIST || '../dist/')+path,import.meta.url));}catch{body=await readFile(new URL((process.env.SWATCH_DIST || '../dist/')+'index.html',import.meta.url));}
  await request.respond({contentType:({js:'application/javascript',css:'text/css',svg:'image/svg+xml'})[path.split('.').pop()]||'text/html',body});
 });
 await page.goto(options.parent?`${origin}/shell`:`${origin}${base}${options.path || 'app/swatch'}?filaman_hosted=1&filaman_hosted_config=${encodeURIComponent(base+'hosted-config')}${options.query||''}`,{waitUntil:options.waitUntil||'networkidle0'});
 return {page,requests,errors,close:()=>context.close()};
}
async function click(page,label){await page.waitForFunction(label=>[...document.querySelectorAll('button')].some(e=>e.textContent.trim()===label),{timeout:5000},label);assert.ok(await page.evaluate(label=>{const e=[...document.querySelectorAll('button')].find(e=>e.textContent.trim()===label);e?.click();return !!e;},label),`missing button ${label}`);}
test('native inventory, search, filter modal, catalog and navigation',async()=>{
 const {page,requests,errors,close}=await open();try{
 await page.waitForFunction(()=>document.querySelectorAll('.card-name').length===3);
 if(process.env.CAPTURE_SWATCH)await page.screenshot({path:process.env.CAPTURE_SWATCH+'/inventory.png',fullPage:true});
 await page.type('nav input[type=text]','Blue');await page.waitForFunction(()=>document.querySelectorAll('.card-name').length===1);
 await page.reload({waitUntil:'networkidle0'});assert.equal(await page.$eval('nav input[type=text]',e=>e.value),'Blue');
 await page.$eval('nav input[type=text]',e=>{e.value='';e.dispatchEvent(new Event('input',{bubbles:true}));});
 await page.waitForFunction(()=>document.querySelectorAll('.card-name').length===3);
 await page.click('button[title="Filters"]');await page.waitForSelector('input[name=material][value=PETG]');await page.click('input[name=material][value=PETG]');await click(page,'Save');
 await page.waitForFunction(()=>document.querySelectorAll('.card-name').length===1);
 await page.click('button[title="Filters"]');await click(page,'Reset');await click(page,'Save');await page.waitForFunction(()=>document.querySelectorAll('.card-name').length===3);
 await click(page,'Color catalog');await page.waitForFunction(()=>document.body.innerText.includes('Transparent'));
 if(process.env.CAPTURE_SWATCH)await page.screenshot({path:process.env.CAPTURE_SWATCH+'/catalog.png',fullPage:true});
 assert.equal(await page.$('.card-sub'),null);assert.equal(new URL(page.url()).searchParams.get('mode'),'catalog');
 await page.reload({waitUntil:'networkidle0'});assert.equal(await page.$$eval('.card-name',x=>x.length),3);
 assert.ok(requests.every(u=>!u.includes('/spoolman/')&&!u.includes('/old-server/')&&!u.includes('statistics.disane')));
 assert.deepEqual(errors,[]);
 }finally{await close();}
});
for(const language of ['en','de','fr'])test(`${language}: profile wins over launch preference; presentation has no selector`,async()=>{
 const {page,errors,close}=await open({language});try{
 assert.equal(await page.$eval('html',e=>e.lang),language);assert.equal(await page.$$('nav [role=combobox]').then(x=>x.length),0);
 assert.equal(await page.$('button[aria-label="Spoolman URL"]'),null);
 await page.setViewport({width:390,height:844});assert.ok(await page.$eval('body',e=>e.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);
 }finally{await close();}
});
test('inventory forbidden still permits catalog discovery',async()=>{
 const {page,close}=await open({denyInventory:true});try{assert.match(await page.$eval('body',e=>e.innerText),/403/);await click(page,'Color catalog');await page.waitForFunction(()=>document.body.innerText.includes('Transparent'));}finally{await close();}
});
test('native logo and linked spool use shared reel without losing alpha zero',async()=>{
 const {page,errors,close}=await open();try{
 const centers=await page.$$eval('[id="board-card-filament:17"] :is(.vendor-logo,.vendor-identity,.card-material)',
  nodes=>nodes.map(node=>{const {top,height}=node.getBoundingClientRect();return top+height/2;}));
 assert.equal(centers.length,3);assert.ok(Math.max(...centers)-Math.min(...centers)<1);
 await page.$eval('[id="board-card-filament:17"]',e=>e.click());await page.waitForSelector('.detail-panel',{timeout:3000}).catch(e=>{throw new Error(`${e.message}: ${errors.join('; ')}`)});
 assert.equal(await page.$eval('.detail-panel img',e=>new URL(e.src).pathname),'/api/v1/manufacturers/1/logo');
 assert.equal(await page.$eval('.spool-id',e=>e.getAttribute('href')),'/spools/17');assert.equal(await page.$eval('.spool-id',e=>e.target),'_top');
 await page.waitForFunction(()=>window.__reelCalls?.length>0);const calls=await page.evaluate(()=>window.__reelCalls);assert.deepEqual(calls[0],[0,['#FF000000','#FF000088'],'striped',{view:'quarter'}]);
 if(process.env.CAPTURE_SWATCH)await page.screenshot({path:process.env.CAPTURE_SWATCH+'/detail.png',fullPage:true});
 const layout=await page.evaluate(()=>{const item=document.querySelector('.spool-item').getBoundingClientRect(),reel=document.querySelector('.corner-reel')?.getBoundingClientRect(),logo=document.querySelector('.detail-header img').getBoundingClientRect();return {item:{right:item.right,bottom:item.bottom,height:item.height},reel:reel&&{right:reel.right,bottom:reel.bottom,width:reel.width},logoWidth:logo.width};});
 assert.ok(layout.reel,'native corner reel');assert.ok(Math.abs(layout.item.right-layout.reel.right-1)<1);assert.ok(Math.abs(layout.item.bottom-layout.reel.bottom-1)<1);assert.ok(layout.reel.width>=110);assert.ok(layout.item.height<=120);assert.ok(layout.logoWidth>=90);
 assert.match(await page.$eval('.detail-panel',e=>e.innerText),/0 g/);assert.deepEqual(errors,[]);
 }finally{await close();}
});
test('equal-weight full spools share a card and keep their individual links',async()=>{
 const {page,close}=await open({spoolGroups:true});try{
  await page.$eval('[id="board-card-filament:17"] .card-name',e=>e.click());
  await page.waitForSelector('.spool-item');
  const cards=await page.$$eval('.spool-item',nodes=>nodes.map(node=>({
   links:[...node.querySelectorAll('a')].map(link=>link.getAttribute('href')),
   text:node.innerText,
  })));
  assert.deepEqual(cards.map(card=>card.links),[[17,18,19],[20],[21],[22],[23]].map(ids=>ids.map(id=>`/spools/${id}`)));
  assert.match(cards[0].text,/1,000 g remaining each/);
  assert.match(cards[0].text,/Shelf/);
  assert.match(cards[1].text,/707 g remaining/);
  assert.match(cards[3].text,/Archived/);
  assert.match(cards[4].text,/Unknown remaining amount/);
  await page.waitForFunction(()=>document.querySelectorAll('.spool-item:first-child .corner-reel').length===1);
 }finally{await close();}
});
test('invalid config fails closed without inventory requests',async()=>{
 const {page,requests,close}=await open({badConfig:true});try{assert.ok(await page.$('[role=alert]'));assert.equal(requests.some(u=>u.includes('/api/v1/filaments')),false);}finally{await close();}
});

test('router history restores destination filters and catalog survives reload',async()=>{
 const {page,close}=await open();try{
 await click(page,'Color catalog');await page.type('nav input[type=text]','Transparent');
 await click(page,'Inventory');await page.type('nav input[type=text]','Blue');
 await page.goBack();await page.waitForFunction(()=>document.querySelector('nav input[type=text]').value==='Transparent');
 await page.goBack();await page.waitForFunction(()=>document.querySelectorAll('.card-name').length===3);assert.equal(await page.$eval('nav input[type=text]',e=>e.value),'');
 await click(page,'Color catalog');await page.reload({waitUntil:'networkidle0'});assert.equal(new URL(page.url()).searchParams.get('mode'),'catalog');assert.ok(await page.evaluate(()=>document.body.innerText.includes('Transparent')));
 }finally{await close();}
});
test('revoked inventory clears open details and cached projections',async()=>{
 const options={};const {page,close}=await open(options);try{
 await page.$eval('[id="board-card-filament:17"]',e=>e.click());await page.waitForSelector('.detail-panel');options.denyInventory=true;
 await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await page.waitForFunction(()=>document.body.innerText.includes('403'));await page.waitForFunction(()=>!document.querySelector('.detail-panel'));
 }finally{await close();}
});
test('catalog details expose assignment usage and native management, with no inventory-only filters',async()=>{
 const {page,close}=await open({query:'&mode=catalog'});try{
 await page.$eval('[id="board-card-color:17"]',e=>e.click());await page.waitForSelector('.detail-panel');assert.match(await page.$eval('.detail-panel',e=>e.innerText),/0.*assignment/i);assert.equal(await page.$eval('.detail-panel a',e=>e.getAttribute('href')),'/filaments/colors');
 }finally{await close();}
});

test('parent language/theme and bfcache return keep discovery and synchronize currency',async()=>{
 const options={parent:true};const {page,close}=await open(options);try{
 const frame=page.frames().find(f=>f.url().includes('/plugins/'));assert.ok(frame);await frame.waitForSelector('.card-name');
 await frame.type('nav input[type=text]','Transparent');const before=frame.url();
 await page.evaluate(()=>{document.documentElement.dataset.theme='light';document.documentElement.lang='fr';});
 await frame.waitForFunction(()=>document.documentElement.lang==='fr'&&document.documentElement.dataset.theme==='light');assert.equal(frame.url(),before);assert.equal(await frame.$eval('nav input[type=text]',e=>e.value),'Transparent');
 await frame.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true})));await page.evaluate(()=>document.documentElement.dataset.theme='dark');await frame.waitForFunction(()=>document.documentElement.dataset.theme==='dark');
 await page.reload({waitUntil:'networkidle0'});const restored=page.frames().find(f=>f.url().includes('/plugins/'));await restored.waitForSelector('.card-name');assert.equal(await restored.$eval('nav input[type=text]',e=>e.value),'Transparent');
 }finally{await close();}
});
test('semantic dialog backgrounds are valid in each host theme',async()=>{
 for(const theme of ['brand','light','dark']){const {page,close}=await open();try{
 await page.evaluate(theme=>{document.documentElement.dataset.theme=theme;},theme);await page.click('button[aria-label="What\'s New"]');await page.waitForSelector('[role=dialog]');
 const color=await page.$eval('[role=dialog]',e=>getComputedStyle(e).backgroundColor);assert.notEqual(color,'rgba(0, 0, 0, 0)');assert.notEqual(color,'transparent');
 }finally{await close();}}
});
test('expired native bootstrap returns to top-level FilaMan login',async()=>{
 const {page,close}=await open({expireSettings:true});try{await page.waitForFunction(()=>location.pathname==='/login');assert.match(new URL(page.url()).searchParams.get('next'),/app\/swatch/);}finally{await close();}
});
test('obsolete project URLs return to discovery and preserve launch parameters',async()=>{
 const {page,errors,close}=await open({path:'app/projects/demo-project',query:'&mode=catalog&q=Transparent'});try{
 await page.waitForFunction(()=>location.pathname.endsWith('/app/swatch'),{timeout:5000});
 assert.doesNotMatch(await page.$eval('nav',e=>e.innerText),/Projects/);
 assert.equal(new URL(page.url()).searchParams.get('mode'),'catalog');
 assert.equal(await page.$eval('nav input[type=text]',e=>e.value),'Transparent');
 assert.equal(await page.$eval('.card-name',e=>e.textContent.trim()),'Transparent');
 assert.deepEqual(errors,[]);
 }finally{await close();}
});
test('French host startup failures use French retry text before profile loading',async()=>{
 const {page,close}=await open({badConfig:true,query:'&spoolman_locale=fr'});try{
 assert.match(await page.$eval('[role=alert]',e=>e.textContent),/Impossible/);assert.ok(await page.evaluate(()=>[...document.querySelectorAll('button')].some(e=>e.textContent==='Réessayer')));
 }finally{await close();}
});

test('native surfaces follow all three FilaMan themes without tinting filament colors',async()=>{
 const {page,close}=await open({parent:true});try{
 const frame=page.frames().find(f=>f.url().includes('/plugins/'));await frame.waitForSelector('.card-name');
 await frame.$eval('[id="board-card-color:17"]',e=>e.click());await frame.waitForSelector('.detail-panel');
 const swatch=await frame.$eval('.color-swatch-large',e=>getComputedStyle(e).backgroundImage);
 for(const theme of ['brand','light','dark']){
  await page.evaluate(theme=>{document.documentElement.dataset.theme=theme;},theme);
  await frame.waitForFunction(theme=>document.documentElement.dataset.theme===theme,{},theme);
  const expected=await page.$eval('html',e=>{const s=getComputedStyle(e);return {background:s.backgroundColor,text:s.color,border:s.borderColor,card:s.getPropertyValue('--bg-elevated').trim(),accent:s.getPropertyValue('--accent').trim()};});
  await frame.waitForFunction(border=>getComputedStyle(document.querySelector('.board-card')).borderColor===border,{},expected.border);
  const actual=await frame.evaluate(()=>{const s=getComputedStyle(document.body),card=getComputedStyle(document.querySelector('.board-card')),detail=getComputedStyle(document.querySelector('.detail-panel'));return {background:s.backgroundColor,image:s.backgroundImage,text:s.color,card:card.backgroundColor,detail:detail.backgroundColor,border:card.borderColor,accent:getComputedStyle(document.documentElement).getPropertyValue('--accent-rgb').trim()};});
  assert.equal(actual.background,expected.background,theme+' background');assert.equal(actual.image,'none',theme+' decorative wash');assert.equal(actual.text,expected.text,theme+' text');assert.equal(actual.border,expected.border,theme+' border');
  const rgb=hex=>'rgb('+hex.match(/\w\w/g).map(v=>parseInt(v,16)).join(', ')+')';
  assert.equal(actual.card,rgb(expected.card),theme+' card');assert.equal(actual.detail,rgb(expected.card),theme+' details');assert.equal('rgb('+actual.accent+')',rgb(expected.accent),theme+' accent');
  assert.equal(await frame.$eval('.color-swatch-large',e=>getComputedStyle(e).backgroundImage),swatch,'theme must preserve RGBA');
 }
 // The host owns its palette, including future changes to the same theme.
 await page.evaluate(()=>{document.documentElement.style.setProperty('--accent','#123456');document.documentElement.dataset.theme='brand';});
 await frame.waitForFunction(()=>getComputedStyle(document.documentElement).getPropertyValue('--accent-rgb').trim()==='18, 52, 86');
 }finally{await close();}
});

test('opaque shaded swatches render identically over every theme surface',async()=>{
 const {page,close}=await open();try{
 const swatch=await page.waitForSelector('[id="board-card-filament:19"] .swatch');
 await page.evaluate(()=>document.fonts.ready);let reference;
 for(const theme of ['brand','light','dark']){
  await page.evaluate(theme=>{document.documentElement.dataset.theme=theme;},theme);
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const box=await swatch.boundingBox(),clip={x:box.x+20,y:box.y+20,width:50,height:50};
  const pixels=await page.screenshot({clip});if(reference)assert.deepEqual(pixels,reference,theme+' must not recolor opaque filament');else reference=pixels;
 }
 }finally{await close();}
});

test('discovery mode controls use compact native typography and bundled icons',async()=>{
 const {page,requests,close}=await open();try{
 assert.equal(await page.$eval('.discovery-modes',e=>e.getAttribute('role')),'tablist');
 const controls=await page.$$eval('.discovery-modes button',buttons=>buttons.map(e=>{const s=getComputedStyle(e),icon=e.querySelector('svg');return {name:e.textContent.trim(),family:s.fontFamily,size:s.fontSize,weight:s.fontWeight,icon:!!icon,iconWidth:icon?.getBoundingClientRect().width,hidden:icon?.getAttribute('aria-hidden')};}));
 assert.equal(controls.length,2);for(const c of controls){assert.match(c.family,/Space Grotesk/);assert.equal(c.size,'14px');assert.equal(c.weight,'600');assert.ok(c.icon);assert.ok(c.iconWidth>=18);assert.equal(c.hidden,'true');}
 assert.ok(requests.includes(origin+'/plugin-fonts.css'));assert.ok(!requests.some(u=>u.includes('fonts.googleapis.com')));
 await page.focus('.discovery-modes button:first-child');await page.keyboard.press('ArrowRight');await page.waitForFunction(()=>document.body.innerText.includes('Transparent'));assert.equal(await page.$eval('.discovery-modes button:last-child',e=>e.getAttribute('aria-selected')),'true');await page.keyboard.press('Home');await page.waitForFunction(()=>document.querySelector('[id="board-card-filament:17"]'));assert.equal(await page.$eval('.discovery-modes button:first-child',e=>e.getAttribute('aria-selected')),'true');
 }finally{await close();}
});

test('a full 1392-color catalog leaves cards and detail content scrollable',async()=>{
 const {page,errors,close}=await open({query:'&mode=catalog',largeCatalog:true});try{
 await page.waitForFunction(()=>document.querySelectorAll('.minimap-dot').length===1392);
 const cardCount=()=>page.$$eval('.board-card',cards=>cards.length);
 assert.ok(await cardCount()<65,'the initial catalog window should be small');
 assert.equal(await page.$('[id="board-card-color:11391"]'),null);
 await page.type('nav input[type=text]','Catalog 1391');
 await page.waitForFunction(()=>document.querySelectorAll('.board-card').length===1 &&
  document.querySelector('.card-name')?.textContent==='Catalog 1391');
 await page.$eval('nav input[type=text]',e=>{e.value='';e.dispatchEvent(new Event('input',{bubbles:true}));});
 await page.waitForFunction(()=>document.querySelectorAll('.minimap-dot').length===1392);
 const lastName=await page.$eval('.minimap-dot:last-child',e=>e.title);
 const lastId=`board-card-color:${10000+Number(lastName.slice('Catalog '.length))}`;
 const size=await page.evaluate(()=>({map:document.querySelector('.minimap').getBoundingClientRect().height,grid:document.querySelector('.board-grid').getBoundingClientRect().height}));assert.ok(size.map<=56,'minimap must remain a compact strip');assert.ok(size.grid>=200,'cards need a usable viewport');
 await page.evaluate(()=>{
  const bounds=Element.prototype.getBoundingClientRect;
  const offset=Object.getOwnPropertyDescriptor(HTMLElement.prototype,'offsetTop');
  window.cardLayoutReads=0;
  Element.prototype.getBoundingClientRect=function(){if(this.matches('.board-card'))window.cardLayoutReads++;return bounds.call(this);};
  Object.defineProperty(HTMLElement.prototype,'offsetTop',{...offset,get(){if(this.matches('.board-card'))window.cardLayoutReads++;return offset.get.call(this);}});
 });
 await page.$eval('.board-grid',e=>{e.scrollTop=e.scrollHeight;});
 await page.waitForFunction(()=>{
  const dots=[...document.querySelectorAll('.minimap-dot')];
  return dots.indexOf(document.querySelector('.minimap-dot.active'))>1300;
 });
 assert.ok(await page.evaluate(()=>window.cardLayoutReads)<150,'scrolling should measure only visible rows');
 await page.$eval('.minimap-dot:last-child',e=>e.click());
 await page.waitForFunction(id=>{
  const card=document.getElementById(id)?.getBoundingClientRect();
  const grid=document.querySelector('.board-grid').getBoundingClientRect();
  return card && card.top>=grid.top && card.bottom<=grid.bottom+1;
 },{},lastId);
 assert.ok(await cardCount()<80,'scrolling should release rows that are far away');
 await page.focus(`[id="${lastId}"] .card-name`);
 await page.keyboard.press('Home');
 await page.waitForFunction(()=>document.activeElement.closest('.board-card')?.id==='board-card-color:10000');
 await page.keyboard.press('End');
 await page.waitForFunction(id=>document.activeElement.closest('.board-card')?.id===id,{},lastId);
 await page.keyboard.press('Enter');
 await page.waitForSelector('.detail-panel',{timeout:5000});
 assert.equal(await page.$eval('.detail-title',e=>e.textContent),lastName);
 await page.$eval('.detail-body',e=>{e.scrollTop=e.scrollHeight;});assert.ok(await page.$eval('.detail-body',e=>e.scrollTop>0));
 await page.setViewport({width:390,height:844});assert.ok(await page.$eval('body',e=>e.scrollWidth<=innerWidth));assert.ok(await page.$eval('.detail-body',e=>e.clientHeight>100));
 await page.$eval('.detail-header button',e=>e.click());
 await page.waitForSelector('.detail-panel',{hidden:true});
 await page.$eval('nav button[title="Carousel"]',e=>e.click());
 await page.waitForSelector('.carousel-track');
 const reads=await page.$eval('.carousel-track',track=>{
  const property=Object.getOwnPropertyDescriptor(HTMLElement.prototype,'offsetLeft');
  let reads=0;
  Object.defineProperty(HTMLElement.prototype,'offsetLeft',{...property,get(){
   if(this.matches('.carousel-card'))reads++;
   return property.get.call(this);
  }});
  track.dispatchEvent(new Event('scroll'));
  return new Promise(resolve=>requestAnimationFrame(()=>{
   Object.defineProperty(HTMLElement.prototype,'offsetLeft',property);
   resolve(reads);
  }));
 });
 assert.ok(reads>0 && reads<40,`expected nearby carousel reads, received ${reads}`);
 }finally{await close();}
});

test('catalog revalidation keeps an unchanged window and removes denied data',async()=>{
 const options={query:'&mode=catalog',catalogSnapshot:1};
 const {page,requests,close}=await open(options);try{
  await page.waitForFunction(()=>document.querySelectorAll('.card-name').length===3);
  await page.$eval('.card-name',e=>e.dataset.marker='retained');
  const refresh=async()=>{
   const response=page.waitForResponse(r=>r.url().endsWith('/colors/discovery/snapshot'));
   await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
   return response;
  };
  const unchanged=await refresh();
  assert.equal(unchanged.status(),304);
  assert.equal(unchanged.request().headers()['if-none-match'],'"catalog-1"');
  await page.waitForNetworkIdle();
  assert.equal(await page.$eval('.card-name',e=>e.dataset.marker),'retained');
  assert.ok(!requests.some(url=>url.includes('/colors?page=')));
  options.catalogSnapshot=2;
  assert.equal((await refresh()).status(),200);
  await page.waitForFunction(()=>document.querySelectorAll('.card-name').length===2);
  options.denyCatalog=true;
  assert.equal((await refresh()).status(),403);
  await page.waitForFunction(()=>document.querySelectorAll('.card-name').length===0);
  assert.ok(!requests.some(url=>url.includes('/colors?page=')));
 }finally{await close();}
});

test('wheel separates clean RGB display from alpha preview without changing native colors',async()=>{
 const {page,close}=await open();try{
 await page.$eval('[id="board-card-filament:17"]',e=>e.click());await page.waitForSelector('.detail-panel');
 assert.equal(await page.$eval('.wheel-center',e=>e.getAttribute('fill')),'#FF0000');assert.equal(await page.$$('.wheel-svg pattern').then(x=>x.length),0);
 await page.waitForFunction(()=>Math.abs(document.querySelector('.detail-panel').getBoundingClientRect().right-innerWidth)<1);
 await page.click('.wheel-transparency input');assert.equal(await page.$eval('.wheel-center',e=>e.getAttribute('fill')),'#FF000000');assert.equal(await page.$$('.wheel-svg pattern').then(x=>x.length),1);assert.equal(await page.$$('.wheel-svg circle[r="100"]').then(x=>x.length),0);
 assert.equal(await page.$eval('.color-hex',e=>e.textContent),'#FF000000');await page.click('.wheel-transparency input');assert.equal(await page.$$('.wheel-svg pattern').then(x=>x.length),0);
 }finally{await close();}
});

test('native detail links and opacity badges stay compact; RGB and four metrics fit',async()=>{
 const options={detailMetrics:true};const {page,close}=await open(options);try{
 const layout=await page.$eval('.board-card:first-child',card=>{
  const title=card.querySelector('.card-name').getBoundingClientRect();
  const rgb=card.querySelector('.card-rgb').getBoundingClientRect();
  const button=card.querySelector('.pin-btn');
  const pin=button.getBoundingClientRect();
  return {titleWidth:title.width,metaWidth:card.querySelector('.card-meta').clientWidth,
   rgbHeight:rgb.height,pinHeight:button.offsetHeight,sameRow:Math.abs(rgb.y+rgb.height/2-pin.y-pin.height/2)<1,pinRight:pin.left>rgb.right};
 });
 assert.ok(layout.titleWidth>layout.metaWidth*.75);
 assert.equal(layout.pinHeight,28);
 assert.ok(layout.rgbHeight<20 && layout.sameRow && layout.pinRight);
 assert.doesNotMatch(await page.$eval('.board-card .card-actions',e=>e.textContent),/FilaMan/);
 const labels=await page.$$eval('.board-card:first-child .rgb-label',x=>x.map(e=>e.textContent.trim()));assert.deepEqual(labels,['R:','G:','B:']);
 await page.$eval('[id="board-card-filament:17"]',e=>e.click());await page.waitForSelector('.detail-panel');
 assert.equal(await page.$eval('.detail-filaman-link',e=>e.getAttribute('href')),'/filaments/17');assert.equal(await page.$eval('.detail-filaman-link',e=>e.target),'_top');assert.equal(await page.$eval('.detail-title',e=>e.textContent),await page.$eval('.detail-filaman-link',e=>e.textContent));
 assert.equal(await page.$('.detail-header .source-badge'),null);
 assert.equal(await page.$eval('.color-stop-opacity',e=>e.textContent.trim()),'0%');
 const tops=await page.$$eval('.info-badges .info-badge',items=>items.map(e=>Math.round(e.getBoundingClientRect().top)));assert.equal(tops.length,4);assert.equal(new Set(tops).size,1,'four metrics occupy one desktop row');
 options.failSettings=true;await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await page.waitForFunction(()=>document.body.innerText.includes('503'));
 options.failSettings=false;await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
 await page.$eval('.detail-overlay',e=>e.click());await page.waitForSelector('.detail-panel',{hidden:true});
 await page.waitForSelector('[id="board-card-filament:19"]');await page.$eval('[id="board-card-filament:19"]',e=>e.click());await page.waitForSelector('.detail-panel');assert.equal(await page.$('.opacity-badge'),null,'opaque colors need no opacity badge');
 }finally{await close();}
});

test('keyboard opens card details and carousel pin shares the RGB row',async()=>{
 const {page,close}=await open();try{

 await page.focus('.board-card:first-child .card-name');await page.keyboard.press('Enter');await page.waitForSelector('.detail-panel',{timeout:4000});await page.$eval('.detail-overlay',e=>e.click());await page.waitForSelector('.detail-panel',{hidden:true});
 await page.click('button[title="Carousel"]');await page.waitForSelector('.card-container .card-name');
 assert.deepEqual(await page.$eval('.card-container',card=>[...card.querySelectorAll('.card-actions button')].map(e=>e.offsetHeight)),[28,28]);
 assert.ok(await page.$eval('.card-container',card=>{
  const rgb=card.querySelector('.card-rgb').getBoundingClientRect();
  const pin=card.querySelector('.pin-btn').getBoundingClientRect();
  return Math.abs(rgb.y+rgb.height/2-pin.y-pin.height/2)<1 && pin.left>rgb.right;
 }));
 assert.doesNotMatch(await page.$eval('.card-container .card-actions',e=>e.textContent),/FilaMan/);
 await page.focus('.card-container .card-name');await page.keyboard.press('Enter');await page.waitForSelector('.detail-panel');
 }finally{await close();}
});

test('embedded mobile toolbar stays clear of the FilaMan hamburger',async()=>{
 const {page,close}=await open({parent:true,mobileHost:true});try{
 const frame=page.frames().find(f=>f.url().includes('/plugins/'));await frame.waitForSelector('.card-name');const host=await page.$eval('#sidebar-toggle',e=>e.getBoundingClientRect().right);
 const buttons=await frame.$$eval('nav button',items=>items.map(e=>e.getBoundingClientRect()).filter(r=>r.width>0).map(r=>({left:r.left,right:r.right})));assert.ok(buttons.length>0);assert.ok(buttons.every(b=>b.left>=host&&b.right<=390),'header actions must be visible beside host navigation');
 }finally{await close();}
});

test('a mounted account change discards old query and pins before restoring the new owner',async()=>{
 const options={parent:true};const {page,close}=await open(options);try{
 let frame=page.frames().find(f=>f.url().includes('/plugins/'));await frame.waitForSelector('.card-name');
 await frame.type('nav input[type=text]','Transparent');
 await frame.waitForFunction(()=>document.querySelectorAll('.board-card').length===1);
 await frame.click('.pin-btn');
 await frame.evaluate(()=>{
  sessionStorage.setItem('filaman-swatch:discovery:2',JSON.stringify({mode:'inventory',filters:{inventory:{search:'Blue'}},pins:[]}));
 });
 options.userId=2;options.currencyFailed=true;await frame.evaluate(()=>window.dispatchEvent(new Event('focus')));
 await page.waitForFunction(()=>{const f=document.querySelector('iframe');return f?.contentDocument?.querySelector('nav input')?.value==='Blue';},{timeout:5000});
 frame=page.frames().find(f=>f.url().includes('/plugins/'));
 assert.equal(await frame.$eval('nav input[type=text]',e=>e.value),'Blue');
 assert.notEqual(new URL(frame.url()).searchParams.get('q'),'Transparent');
 assert.deepEqual(await frame.evaluate(()=>JSON.parse(sessionStorage.getItem('filaman-swatch:discovery:2')).pins),[]);
 assert.equal(await frame.$('.detail-panel'),null);
 }finally{await close();}
});

test('resetting native filters restores a valid inventory scope',async()=>{
 const {page,close}=await open();try{
 await page.click('button[title="Filters"]');await page.waitForSelector('select');
 await page.select('select','on_hand_spools');await click(page,'Reset');
 assert.equal(await page.$eval('select',e=>e.value),'filaments');
 await click(page,'Save');assert.equal(new URL(page.url()).searchParams.has('i'),false);
 }finally{await close();}
});

for(const failProfileAfterDenial of [false,true])test(`focus removes revoked inventory pins (postflight failure: ${failProfileAfterDenial})`,async()=>{
 const options={};const {page,close}=await open(options);try{
  await page.$eval('[id="board-card-filament:17"] .pin-btn',button=>button.click());
  await page.waitForSelector('.palette-panel.active .chip-name');
  await page.$eval('.palette-header button',button=>button.click());
  await click(page,'Color catalog');
  await page.waitForSelector('[id="board-card-color:17"]');
  Object.assign(options,{denyInventory:true,failProfileAfterDenial});
  await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
  await page.waitForFunction(()=>!document.querySelector('.chip-name'),{timeout:5000});
  assert.equal(await page.$eval('#discovery-tab-catalog',e=>e.getAttribute('aria-selected')),'true');
 }finally{await close();}
});


for(const denyCatalog of [false,true])test(`a session change during catalog paging invalidates the mounted account (403: ${denyCatalog})`,async()=>{
 const options={};const {page,close}=await open(options);try{
  options.switchDuringCatalog=true;
  options.denyCatalog=denyCatalog;
  await click(page,'Color catalog');
  await page.waitForFunction(()=>sessionStorage.getItem('filaman-swatch:discovery:2')!==null,{timeout:5000});
  assert.equal(await page.$eval('#discovery-tab-inventory',e=>e.getAttribute('aria-selected')),'true');
 }finally{await close();}
});

test('a saved inventory pin can open its details after reloading in catalog',async()=>{
 const {page,close}=await open();try{
  await page.$eval('[id="board-card-filament:17"] .pin-btn',e=>e.click());
  await page.waitForSelector('.palette-panel.active .chip-name');
  await page.$eval('.palette-header button',e=>e.click());
  await click(page,'Color catalog');
  await page.reload({waitUntil:'networkidle0'});
  await page.waitForSelector('.palette-chip',{timeout:5000});
  await page.$eval('.chip-target',e=>e.click());
  await page.waitForSelector('.detail-panel',{timeout:5000});
  assert.equal(await page.$eval('.detail-filaman-link',e=>e.getAttribute('href')),'/filaments/17');
 }finally{await close();}
});

test('palette stays reachable at tablet widths',async()=>{
 const {page,close}=await open();try{
  await page.setViewport({width:700,height:844});
  await page.waitForSelector('button[aria-label="Open palette"]',{visible:true});
 }finally{await close();}
});


test('an optional currency response cannot delay discovery startup',async()=>{
 let releaseCurrency;
 const currencyGate=new Promise(resolve=>{releaseCurrency=resolve;});
 const {page,close}=await open({currencyGate,waitUntil:'domcontentloaded'});try{
  await page.waitForSelector('.board-card',{timeout:5000});
 }finally{releaseCurrency();await close();}
});

for(const closeDrawer of [false,true])test(`a pending pin cannot override the latest palette action (close: ${closeDrawer})`, async () => {
  const options = {};
  const {page,close} = await open(options);
  let release;
  try {
    const names = await page.$$eval('.board-card .card-name', nodes => nodes.slice(0,2).map(node=>node.textContent));
    await page.$$eval('.board-card .pin-btn', nodes => nodes.slice(0,2).forEach(node=>node.click()));
    await page.waitForFunction(()=>document.querySelectorAll('.chip-target').length===2);
    await page.$eval('.palette-header button', node=>node.click());
    await click(page,'Color catalog');
    await page.waitForSelector('[id="board-card-color:17"]');
    await page.$eval('button[aria-label="Open palette"]', node=>node.click());
    options.inventoryGate = new Promise(resolve=>{release=resolve});
    await page.$eval('.chip-target', node=>node.click());
    await page.waitForFunction(()=>document.querySelector('#discovery-tab-inventory').getAttribute('aria-selected')==='true');
    if(closeDrawer)await page.$eval('.palette-header button',node=>node.click());
    else {
      await page.$$eval('.chip-target', nodes=>nodes[1].click());
      await page.waitForFunction(name=>document.querySelector('.detail-title')?.textContent===name,{timeout:5000},names[1]);
    }
    release();
    await page.waitForNetworkIdle();
    if(closeDrawer)assert.equal(await page.$('.detail-panel'),null);
    else assert.equal(await page.$eval('.detail-title',node=>node.textContent),names[1]);
  } finally { release?.(); await close(); }
});


for(const gradient of [false,true])test(`detail swatch labels ordered colors and positions (${gradient?'gradient':'striped'})`,async()=>{
 const {page,close}=await open({gradient,language:gradient?'fr':'en'});try{
  await page.$eval('[id="board-card-filament:17"] .card-name',e=>e.click());
  await page.waitForSelector('.color-stop');
  assert.equal(await page.$eval('.color-pattern',e=>e.textContent.trim()),gradient?'Multicolore\u00a0: Dégradé':'Multicolor: Striped');
  assert.deepEqual(await page.$$eval('.color-stop .color-hex',labels=>labels.map(e=>e.textContent)),
    gradient?['#FF0000AA','#BB00B8AA','#006A3FAA','#0000FFAA']:['#FF000000','#FF000088']);
  assert.deepEqual(await page.$$eval('.color-stop',labels=>labels.map(e=>Number(e.style.getPropertyValue('--stop-position')))),
    gradient?[0,1/3,2/3,1]:[.25,.75]);
  assert.match(await page.$eval('.color-swatch-large',e=>getComputedStyle(e).backgroundImage),/linear-gradient\(90deg/);
  if(gradient){
    await page.setViewport({width:320,height:640});
    const {bounds,labels}=await page.$eval('.color-swatch-large',swatch=>({
      bounds:swatch.getBoundingClientRect().toJSON(),
      labels:[...swatch.querySelectorAll('.color-stop')].map(label=>label.getBoundingClientRect().toJSON()),
    }));
    assert.ok(labels.every((label,i)=>label.bottom===labels[0].bottom &&
      label.left>=(labels[i-1]?.right ?? bounds.left) && label.right<=bounds.right));
  }
 }finally{await close();}
});
