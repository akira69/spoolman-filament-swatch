import { computed, reactive, ref, shallowReactive, watch } from 'vue';
import {confirmHostIdentity, verifyHostIdentity} from '../filaman/context';
import {readDiscoveryState,saveDiscoveryState} from '../filaman/discovery-state';
import type {Router} from 'vue-router';
import { NativeApiError, loadInventory, loadCatalog } from '../api/filaman';
import { getColorMetrics } from '../lib/colorUtils';
import type { DiscoveryItem, DiscoveryMode, InventoryItem } from '../types/discovery';

// Optional inventory projections keep upstream views small; catalog records never invent them.
export type FilamentCard = DiscoveryItem & Partial<Omit<InventoryItem, keyof DiscoveryItem>> & {
  locations?: string[]; hasSpools?: boolean; hasOnHandSpools?: boolean; onHandSpoolCount?: number;
  totalRemainingWeight?: number | null; spoolCount?: number; multiColorDirection?: 'coaxial'|'longitudinal';
};
export type InventoryScope = 'filaments'|'all_spools'|'on_hand_spools'|'everything';
const defaults=()=>({search:'',vendor:'all',material:'all',source:'filaman',inventoryScope:'filaments' as InventoryScope,
  sortField:'name',sortDir:'asc',color:'all',colorType:'all',location:'all'});
export type DiscoveryFilters=ReturnType<typeof defaults>;
let instance: ReturnType<typeof createFilamentsComposable> | null = null;
const nameCollator = new Intl.Collator(undefined, {sensitivity:'base'});
export const useFilaments=()=>instance ??= createFilamentsComposable();
function createFilamentsComposable() {
  const params=new URLSearchParams(window.location.search);
  const saved=readDiscoveryState();
  const explicitFilters=['q','v','m','c','l','i','sort','dir','ct'].some(key=>params.has(key));
  const explicit=params.has('mode')||explicitFilters;
  const mode=ref<DiscoveryMode>(explicit ? (params.get('mode')==='catalog'?'catalog':'inventory') : saved.mode ?? 'inventory');
  const filters=reactive(defaults());
  const states={inventory:defaults(),catalog:defaults()};
  const keys={search:'q',vendor:'v',material:'m',color:'c',location:'l',inventoryScope:'i',sortField:'sort',sortDir:'dir',colorType:'ct'};
  for(const choice of ['inventory','catalog'] as const)for(const key of Object.keys(defaults()))if(typeof saved.filters?.[choice]?.[key]==='string')(states[choice] as any)[key]=saved.filters[choice][key];
  Object.assign(filters,states[mode.value]);
  if(explicitFilters){Object.assign(filters,defaults());for(const [key,param] of Object.entries(keys))if(params.has(param))(filters as any)[key]=params.get(param);}
  const snapshots=shallowReactive<Record<DiscoveryMode,FilamentCard[]|null>>({inventory:null,catalog:null});
  let catalogEtag: string | undefined;
  const stale={inventory:false,catalog:false};
  const errors=reactive<Record<DiscoveryMode,string|null>>({inventory:null,catalog:null});
  const loadings=reactive({inventory:false,catalog:false});
  const loading=computed(()=>loadings[mode.value]);
  const allFilaments=computed(()=>snapshots[mode.value] ?? []);
  const error=computed(()=>errors[mode.value]);
  const controllers:Partial<Record<DiscoveryMode,AbortController>>={};
  const generations={inventory:0,catalog:0};
  const requests:Partial<Record<DiscoveryMode,Promise<void>>>={};
  let router:Router|null=null;let switching=false;
  function project(item:DiscoveryItem):FilamentCard {
    if(item.kind==='catalog')return item;
    const weights=item.spools.filter(s=>s.onHand).map(s=>s.remainingWeightG);
    return {...item,locations:[...new Set(item.spools.flatMap(s=>s.location?[s.location]:[]))],
      hasSpools:item.spools.length>0,spoolCount:item.spools.length,
      hasOnHandSpools:item.spools.some(s=>s.onHand),onHandSpoolCount:item.spools.filter(s=>s.onHand).length,
      totalRemainingWeight:weights.every(w=>w!==null)?weights.reduce<number>((a,b)=>a+(b??0),0):null};
  }
  function loadMode(target:DiscoveryMode,force=true):Promise<void> {
    if(!force && requests[target])return requests[target]!;
    if(!force && snapshots[target] && !stale[target])return Promise.resolve();
    controllers[target]?.abort();const current=++generations[target];
    const controller=new AbortController();controllers[target]=controller;
    loadings[target]=true;errors[target]=null;
    const request=(async()=>{
      try {
        const profile = await verifyHostIdentity();
        if (!profile || controller.signal.aborted) return;
        const outcome = await (target === 'inventory'
          ? loadInventory(controller.signal)
          : loadCatalog(controller.signal, snapshots.catalog ? catalogEtag : undefined))
          .then(result => ({result}), error => ({error}));
        if (controller.signal.aborted) return;
        if ('error' in outcome && outcome.error instanceof NativeApiError) {
          const {status} = outcome.error;
          if (status === 401 || status === 403) snapshots[target] = null;
          if (status === 401) throw outcome.error;
        }
        const confirmed = await confirmHostIdentity();
        if (current !== generations[target] || confirmed?.userId !== profile.userId) return;
        if ('error' in outcome) throw outcome.error;
        if (outcome.result) {
          snapshots[target] = outcome.result.items.map(project);
          if (target === 'catalog') catalogEtag = 'etag' in outcome.result ? outcome.result.etag : undefined;
        }
        stale[target] = false;
      }catch(e){
        if(current===generations[target] && !(e instanceof Error && e.name==='AbortError')) {
          errors[target]=e instanceof Error?e.message:String(e);
          if(e instanceof NativeApiError && (e.status===401 || e.status===403))snapshots[target]=null;
        }
      }finally{if(current===generations[target]){loadings[target]=false;delete requests[target];}}
    })();
    requests[target]=request;return request;
  }
  function discoveryQuery() {
    const query=new URLSearchParams(window.location.search);
    for(const [key,param] of Object.entries(keys)) {
      query.delete(param);const value=(filters as any)[key];
      if(value !== (defaults() as any)[key])query.set(param,value);
    }
    query.delete('s');query.set('mode',mode.value);
    return Object.fromEntries(query);
  }
  function sync(push=false) {
    Object.assign(states[mode.value],filters);
    const query=discoveryQuery();
    if(router)return router[push?'push':'replace']({query});
    saveDiscoveryState({mode:mode.value,filters:states});
    window.history[push?'pushState':'replaceState'](window.history.state??{},'',`${window.location.pathname}?${new URLSearchParams(query)}`);
    return Promise.resolve();
  }
  async function setDiscoveryMode(next:DiscoveryMode,history=true) {
    if(next===mode.value)return;
    stale[next]=true;
    Object.assign(states[mode.value],filters);switching=true;
    mode.value=next;Object.assign(filters,states[next]);
    await sync(history);switching=false;await loadMode(next,false);
  }
  function hydrate(query:URLSearchParams) {
    const next=query.get('mode')==='catalog'?'catalog':'inventory';
    if(next!==mode.value)stale[next]=true;
    const nextFilters = defaults();
    for(const [key,param] of Object.entries(keys))if(query.has(param))(nextFilters as any)[key]=query.get(param);
    switching=true;mode.value=next;Object.assign(filters,nextFilters);
    Object.assign(states[next],filters);
    saveDiscoveryState({mode:next,filters:states});
    switching=false;void loadMode(next,false);
  }
  function connectRouter(value:Router) {
    router=value;
    if(!explicitFilters)void sync();
    return router.afterEach((to,_from,failure)=>{if(!failure && to.name==='swatch')hydrate(new URLSearchParams(Object.entries(to.query).flatMap(([key,value])=>typeof value==='string'?[[key,value]]:[])));});
  }
  watch(()=>({...filters}),()=>{if(!switching)void sync();},{flush:'sync'});
  window.addEventListener('popstate',()=>{if(!router)hydrate(new URLSearchParams(window.location.search));});
  const refresh=()=>loadMode(mode.value);
  const refreshCachedModes = () => {
    for (const target of ['inventory', 'catalog'] as const) {
      if (target === mode.value || snapshots[target] || requests[target]) void loadMode(target);
    }
  };
  const parent = window.parent;
  const doc = typeof document === 'undefined' ? undefined : document;
  const refreshVisible = () => {
    if (doc?.visibilityState === 'visible') refreshCachedModes();
  };
  const onRestore = (event: PageTransitionEvent) => {
    if (event.persisted) refreshCachedModes();
  };
  window.addEventListener('focus', refreshCachedModes);
  doc?.addEventListener('visibilitychange', refreshVisible);
  window.addEventListener('pageshow', onRestore);
  if (parent && parent !== window) {
    parent.addEventListener('focus', refreshCachedModes);
    parent.document.addEventListener('visibilitychange', refreshVisible);
    window.addEventListener('pagehide', function releaseParentListeners(event) {
      if ((event as PageTransitionEvent).persisted) return;
      parent.removeEventListener('focus', refreshCachedModes);
      parent.document.removeEventListener('visibilitychange', refreshVisible);
    });
  }
  const sorted=computed(()=>{
    const direction = filters.sortDir === 'desc' ? -1 : 1;
    const field = filters.sortField;
    const items = allFilaments.value;
    if (field === 'hue' || field === 'luminance' || field === 'lightness') {
      return items.map(item => ({item, value:getColorMetrics(item.colorHex)[field]}))
        .sort((a,b) => direction*(a.value-b.value)).map(entry => entry.item);
    }
    return [...items].sort((a,b)=>direction*nameCollator.compare(String((a as any)[field]??''),String((b as any)[field]??'')));
  });
  const filtered=computed(()=>{
    const search = filters.search.toLowerCase();
    return sorted.value.filter(item=>{
    if(filters.color!=='all' && item.colorHex.toLowerCase()!==filters.color.toLowerCase())return false;
    if(filters.colorType!=='all' && (filters.colorType==='multi') !== (item.colors.length>1))return false;
    if(item.kind==='inventory') {
      if(filters.vendor!=='all' && item.vendor?.toLowerCase()!==filters.vendor.toLowerCase())return false;
      if(filters.material!=='all' && item.material.toLowerCase()!==filters.material.toLowerCase())return false;
      if((filters.location!=='all' || ['all_spools','on_hand_spools'].includes(filters.inventoryScope)) &&
        !item.spools?.some(spool=>(filters.inventoryScope!=='on_hand_spools' || spool.onHand) &&
          (filters.location==='all' || spool.location?.toLowerCase()===filters.location.toLowerCase())))return false;
    }
      return !search || [item.name,item.colorName,item.colorHex,item.vendor,item.material].some(value=>value?.toLowerCase().includes(search));
    });
  });
  const options=(key:'vendor'|'material')=>computed(()=>[...new Set(allFilaments.value.flatMap(i=>i.kind==='inventory' && i[key]?[i[key]!]:[]))].sort());
  return {connectRouter,loadMode,inventoryItems:computed(()=>snapshots.inventory ?? []),cachedItems:computed(()=>[...(snapshots.inventory??[]),...(snapshots.catalog??[])]),mode,setDiscoveryMode,loading,error,allFilaments,filtered,filters,vendorOptions:options('vendor'),materialOptions:options('material'),
    colorOptions:computed(()=>[...new Set(allFilaments.value.map(i=>i.colorHex))]),
    locationOptions:computed(()=>[...new Set(allFilaments.value.flatMap(i=>i.locations??[]))].sort()),refresh};
}
