import {hostContext} from './context';
type SavedState = {mode?:'inventory'|'catalog';filters?:Record<string,Record<string,string>>;pins?:string[]};
const key=()=>hostContext.userId ? `filaman-swatch:discovery:${hostContext.userId}` : null;
export function readDiscoveryState():SavedState {
  try {
    const owner=key();if(!owner)return {};
    const value=JSON.parse(sessionStorage.getItem(owner)??'{}');
    if(!value || typeof value!=='object')return {};
    const state:SavedState={};
    if(value.mode==='inventory'||value.mode==='catalog')state.mode=value.mode;
    if(value.filters && typeof value.filters==='object') {
      state.filters={};
      for(const mode of ['inventory','catalog'])if(value.filters[mode] && typeof value.filters[mode]==='object')
        state.filters[mode]=Object.fromEntries(Object.entries(value.filters[mode]).filter(([,v])=>typeof v==='string')) as Record<string,string>;
    }
    if(Array.isArray(value.pins))state.pins=value.pins.filter((v:unknown)=>typeof v==='string'&&/^(filament|color):[1-9]\d*$/.test(v));
    return state;
  }catch{return {};}
}
export function saveDiscoveryState(update:SavedState):void {
  try {const owner=key();if(owner)sessionStorage.setItem(owner,JSON.stringify({...readDiscoveryState(),...update}));}catch{/* Private-mode/quota failures must not block discovery. */}
}
