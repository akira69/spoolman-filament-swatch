import { reactive } from 'vue';
import { normalizeColor, hexToRgbString } from '../lib/colorUtils';
import { loadNativeProfile, loadNativeCurrency } from '../api/filaman';
export type HostContext = {language:'en'|'de'|'fr'; currency:string|null; theme:string;userId?:number|null;connected?:boolean};
export const hostContext = reactive<HostContext>({language:'en',currency:null,theme:'brand',userId:null,connected:false});
let identityChanging = false;
let identityCheck: Promise<Awaited<ReturnType<typeof loadNativeProfile>> | null> | undefined;

export function verifyHostIdentity() {
  if (identityChanging) return Promise.resolve(null);
  return identityCheck ??= loadNativeProfile().then(profile => {
    if (hostContext.userId !== null && hostContext.userId !== profile.userId) {
      identityChanging = true;
      hostContext.connected = false;
      hostContext.userId = null;
      const query = new URLSearchParams({
        filaman_hosted: '1',
        filaman_hosted_config: '/plugins/filament-swatch/hosted-config',
      });
      window.location.replace(`/plugins/filament-swatch/?${query}`);
      return null;
    }
    hostContext.userId = profile.userId;
    hostContext.connected = true;
    return profile;
  }).catch(error => {
    hostContext.connected = false;
    throw error;
  }).finally(() => { identityCheck = undefined; });
}

export async function confirmHostIdentity() {
  // A check started before the data response may still represent the old session.
  if (identityCheck) await identityCheck;
  return verifyHostIdentity();
}

export function startHostContext() {
  let stopped=false,sequence=0,languageRevision=0;
  const controller=new AbortController();
  const parentRoot=window.parent.document.documentElement;
  const syncTheme=()=>{
    hostContext.theme=parentRoot.dataset.theme || localStorage.getItem('theme') || 'brand';
    document.documentElement.dataset.theme=hostContext.theme;
    document.documentElement.classList.toggle('dark',hostContext.theme!=='light');
    if(parentRoot!==document.documentElement){
      const host=getComputedStyle(parentRoot),style=document.documentElement.style;
      // Keep upstream RGB-channel callers while the host owns the actual palette.
      for(const [target,source] of Object.entries({'background-rgb':'bg',surface:'bg-elevated','surface-alt':'bg-soft',text:'text','text-muted':'text-muted','accent-rgb':'accent','accent-2':'accent-2'})){
        const color=normalizeColor(host.getPropertyValue(`--${source}`));
        if(color)style.setProperty(`--${target}`,hexToRgbString(color.hex));else style.removeProperty(`--${target}`);
      }
      for(const token of ['border','btn-primary-text','font-sans','font-serif','radius-md','shadow-sm']){
        const value=host.getPropertyValue(`--${token}`).trim(),target=token==='border'?'--filaman-border':`--${token}`;
        if(value)style.setProperty(target,value);else style.removeProperty(target);
      }
    }
  };
  const refresh=async()=>{
    if(identityChanging)return;
    const current=++sequence,revision=languageRevision;
    const profile = await verifyHostIdentity();
    if (!profile || stopped || current !== sequence) return;
    if (revision === languageRevision) {
      hostContext.language = profile.language === 'de' || profile.language === 'fr' ? profile.language : 'en';
    }
    syncTheme();
    void loadNativeCurrency(controller.signal).then(currency => {
      if (!stopped && !identityChanging && current === sequence && currency !== null) {
        hostContext.currency = currency;
      }
    }).catch(() => { /* Keep the last known currency during an outage. */ });
  };
  const background=()=>void refresh().catch(error=>{if(!stopped)console.error('Could not refresh FilaMan presentation',error);});
  const visible=()=>{if(document.visibilityState==='visible')background();};
  const restored=(event:PageTransitionEvent)=>{if(event.persisted)background();};
  const observer=new MutationObserver(records=>{
    syncTheme();if(records.some(r=>r.attributeName==='lang')) {
      languageRevision++;const language=parentRoot.lang;
      hostContext.language=language==='fr'||language==='de'?language:'en';
    }
  });
  if(parentRoot !== document.documentElement)observer.observe(parentRoot,{attributes:true,attributeFilter:['lang','data-theme','style']});
  window.addEventListener('focus',background);window.addEventListener('storage',background);window.addEventListener('pageshow',restored);
  document.addEventListener('visibilitychange',visible);
  window.parent.addEventListener('focus',background);window.parent.document.addEventListener('visibilitychange',visible);
  syncTheme();
  return {context:hostContext,ready:refresh(),stop(){
    stopped=true;controller.abort();observer.disconnect();
    window.removeEventListener('focus',background);window.removeEventListener('storage',background);window.removeEventListener('pageshow',restored);
    document.removeEventListener('visibilitychange',visible);window.parent.removeEventListener('focus',background);window.parent.document.removeEventListener('visibilitychange',visible);
  }};
}
