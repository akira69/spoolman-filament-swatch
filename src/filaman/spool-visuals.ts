export type SpoolRenderer={renderSpoolReel:(fraction:number,colors:string[],style:'striped'|'gradient',options:{view:'quarter'})=>string};
let renderer:Promise<SpoolRenderer>|null=null;
export function loadSpoolRenderer():Promise<SpoolRenderer> {
  const url='/spool-reel.js';
  return renderer ??= import(/* @vite-ignore */ url);
}
export function renderNativeSpool(renderer:SpoolRenderer,percent:number|null,colors:string[],style:'striped'|'gradient',prefix:string):string|null {
  if(percent===null || !Number.isFinite(percent) || percent<0 || percent>100)return null;
  const svg=renderer.renderSpoolReel(percent/100,colors,style,{view:'quarter'});
  const ids = [...svg.matchAll(/id="([^"]+)"/g)].map(match=>match[1]);
  let result=svg;
  for(const id of ids) {
    result=result.replaceAll(`id="${id}"`,`id="${prefix}-${id}"`).replaceAll(`url(#${id})`,`url(#${prefix}-${id})`).replaceAll(`href="#${id}"`,`href="#${prefix}-${id}"`);
  }
  return result;
}
