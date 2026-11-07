import { hostContext, type HostContext } from './context';
const locales={en:'en-US',de:'de-DE',fr:'fr-FR'};
export function formatMoney(amount:number|null|undefined, amountCurrency:string|null|undefined, context:HostContext=hostContext):string {
  if(amount==null || !Number.isFinite(amount) || !amountCurrency || !/^[A-Z]{3}$/.test(amountCurrency))return '—';
  try{return new Intl.NumberFormat(locales[context.language],{style:'currency',currency:amountCurrency}).format(amount);}catch{return '—';}
}
export const formatNumber=(amount:number,maximumFractionDigits=2)=>new Intl.NumberFormat(locales[hostContext.language],{maximumFractionDigits}).format(amount);
export const formatDate=(value:string)=>new Intl.DateTimeFormat(locales[hostContext.language],{dateStyle:'medium'}).format(new Date(value));
