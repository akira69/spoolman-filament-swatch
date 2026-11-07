import type { CatalogSnapshot, DiscoveryColor, InventorySnapshot, NativeSpoolSummary } from '../types/discovery';
import { normalizeColor } from '../lib/colorUtils';

type Row = Record<string, any>;
export class NativeApiError extends Error {
  constructor(public status: number, path: string) { super(`FilaMan ${path}: ${status}`); }
}
const record = (value: unknown): Row => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid FilaMan record');
  return value as Row;
};
const id = (value: unknown): number => {
  if (!Number.isSafeInteger(value) || (value as number) < 1) throw new Error('Invalid FilaMan ID');
  return value as number;
};
const text = (value: unknown): string => typeof value === 'string' ? value : '';
const number = (value: unknown): number | null => typeof value === 'number' && Number.isFinite(value) ? value : null;
const currency = (value: unknown): string | null => typeof value === 'string' && /^[A-Z]{3}$/.test(value) ? value : null;
async function request(path: string, signal?: AbortSignal, headers?: HeadersInit): Promise<Response> {
  signal?.throwIfAborted();
  const response = await fetch(`/api/v1${path}`, {credentials:'same-origin', cache:'no-store', signal, headers});
  if(response.status === 401 && typeof window !== 'undefined' && window.parent?.location) {
    const host=window.parent.location;
    window.top?.location.assign(`/login?next=${encodeURIComponent(host.pathname+host.search+host.hash)}`);
  }
  return response;
}
async function get(path: string, signal?: AbortSignal): Promise<unknown> {
  const response = await request(path, signal);
  if (!response.ok) throw new NativeApiError(response.status, path);
  return response.json();
}
async function pages(path: string, signal?: AbortSignal): Promise<Row[]> {
  const items: Row[] = [];
  let total: number | null = null;
  for (let page = 1; ; page++) {
    const data = record(await get(`${path}${path.includes('?') ? '&' : '?'}page=${page}&page_size=200`, signal));
    if (!Array.isArray(data.items) || data.page !== page || !Number.isSafeInteger(data.total) || data.total < 0 || !Number.isSafeInteger(data.page_size) || data.page_size < 1 || data.items.length > data.page_size) throw new Error('Invalid FilaMan page');
    if (total !== null && total !== data.total) throw new Error('FilaMan data changed during loading; retry');
    total = data.total;
    items.push(...data.items.map(record));
    if (items.length === total) break;
    if (!data.items.length || items.length > data.total || page >= 10000) throw new Error('Incomplete FilaMan pagination');
  }
  const ids = items.map(item=>id(item.id));
  if (new Set(ids).size !== ids.length) throw new Error('FilaMan data changed during loading; retry');
  return items;
}
function color(value: Row, position: number, nativeId: number, override?: unknown): DiscoveryColor | null {
  const parsed = normalizeColor(value.hex_code);
  return parsed ? {nativeId, position, hex:parsed.hex, name:text(override) || text(value.name)} : null;
}
function base(value: Row, kind: 'inventory' | 'catalog', colors: DiscoveryColor[]) {
  const nativeId = id(value.id);
  return {kind, id:`${kind === 'inventory' ? 'filament' : 'color'}:${nativeId}`, nativeId,
    name:text(kind === 'inventory' ? value.designation : value.name), colors, source:'filaman' as const,
    colorHex:colors[0]?.hex ?? '#888888', colorName:colors.map(c=>c.name).filter(Boolean).join(', '),
    multiColorHexes:colors.length > 1 ? colors.map(c=>c.hex) : undefined};
}
export async function loadCatalog(signal?: AbortSignal, etag?: string): Promise<CatalogSnapshot | null> {
  const path = '/colors/discovery/snapshot';
  const response = await request(path, signal, etag ? {'If-None-Match': etag} : undefined);
  if (response.status === 304 && etag) return null;
  if (!response.ok && response.status !== 404) throw new NativeApiError(response.status, path);
  const items = response.status === 404 ? await pages('/colors', signal) : record(await response.json()).items;
  if (!Array.isArray(items)) throw new Error('Invalid FilaMan catalog');
  const seen = new Set<number>();
  return {etag: response.ok ? response.headers.get('ETag') ?? undefined : undefined, items:items.map(entry=>{
    const value = record(entry);
    const nativeId = id(value.id);
    if (seen.has(nativeId)) throw new Error('Duplicate FilaMan catalog ID');
    seen.add(nativeId);
    const c = color(value, 1, nativeId);
    return {...base(value,'catalog',c ? [c] : []),kind:'catalog',usageCount:number(value.usage_count) ?? 0};
  })};
}
export async function loadInventory(signal?: AbortSignal): Promise<InventorySnapshot> {
  const [filaments, spools, statusesValue, locations] = await Promise.all([
    pages('/filaments',signal), pages('/spools?include_archived=true&include_metrics=true',signal),
    get('/spools/statuses',signal), pages('/locations',signal),
  ]);
  if (!Array.isArray(statusesValue)) throw new Error('Invalid FilaMan statuses');
  const statuses = new Map(statusesValue.map(value=>{const r=record(value); return [id(r.id), text(r.key)];}));
  const locationNames = new Map(locations.map(r=>[id(r.id),text(r.name)]));
  const byFilament = new Map<number, NativeSpoolSummary[]>();
  for (const spool of spools) {
    const status = statuses.get(id(spool.status_id));
    if (!status) throw new Error('Unknown FilaMan spool status');
    const metric = spool.metrics == null ? {} : record(spool.metrics);
    const percent = number(metric.remaining_percent);
    const summary: NativeSpoolSummary = {id:id(spool.id),href:`/spools/${id(spool.id)}`,
      archived:status === 'archived', onHand:['new','opened','drying','active'].includes(status),
      location:spool.location_id == null ? null : locationNames.get(id(spool.location_id)) ?? null,
      remainingPercent:percent === null || percent<0 || percent>100 ? null : percent,
      remainingWeightG:number(Object.hasOwn(metric,'effective_remaining_weight_g') ? metric.effective_remaining_weight_g : spool.remaining_weight_g)};
    const key=id(spool.filament_id);
    const existing = byFilament.get(key);
    if (existing) existing.push(summary);
    else byFilament.set(key, [summary]);
  }
  return {items:filaments.map(value=>{
    const manufacturer=value.manufacturer == null ? null : record(value.manufacturer);
    if (!Array.isArray(value.colors)) throw new Error('Invalid FilaMan color assignments');
    const colors = value.colors.map(record).sort((a,b)=>(number(a.position) ?? 0)-(number(b.position) ?? 0))
      .flatMap(entry=>entry.color == null ? [] : [color(record(entry.color),number(entry.position) ?? 0,id(entry.color_id),entry.display_name_override)]).filter((c): c is DiscoveryColor=>c!==null);
    const logo=text(manufacturer?.logo_url);
    return {...base(value,'inventory',colors),kind:'inventory',vendor:manufacturer ? text(manufacturer.name) : null,
      logoUrl:/^\/api\/v1\/manufacturers\/\d+\/logo$/.test(logo) ? logo : null, material:text(value.material_type),
      nativeColorStyle:value.multi_color_style === 'striped' ? 'striped' : 'gradient',
      price:number(value.price),priceCurrency:currency(value.price_currency),weight:number(value.raw_material_weight_g),
      spoolWeight:number(value.default_spool_weight_g),density:number(value.density_g_cm3),diameter:number(value.diameter_mm),
      articleNumber:text(value.manufacturer_sku) || null,spools:byFilament.get(id(value.id)) ?? []};
  })};
}
export async function loadNativeProfile(signal?: AbortSignal) {
  const me = record(await get('/me', signal));
  return {userId:id(me.id), language:text(me.language)};
}

export async function loadNativeCurrency(signal?: AbortSignal) {
  return currency(record(await get('/app-settings/public-info', signal)).currency);
}
