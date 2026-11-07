import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
const fixture = JSON.parse(await (await import('node:fs/promises')).readFile(new URL('./fixtures/filaman/contracts.json', import.meta.url), 'utf8'));
test('native snapshots preserve identity, pages, currencies, alpha and authoritative metrics', async () => {
  const server = await createServer({configFile:false,server:{middlewareMode:true,hmr:false,ws:false},optimizeDeps:{noDiscovery:true}});
  const original = globalThis.fetch;
  const calls=[];
  globalThis.fetch=async (path, options) => {
    calls.push(path);
    options?.signal?.throwIfAborted();
    const u=new URL(path,'http://test');
    if (u.pathname.endsWith('/discovery/snapshot')) return new Response(null, {status:404});
    const data=fixture[u.pathname];
    assert.ok(data, `unexpected request ${path}`);
    return new Response(JSON.stringify(Array.isArray(data) ? data : data[u.searchParams.get('page') || '1']));
  };
  try {
    const api=await server.ssrLoadModule('/src/api/filaman.ts');
    const inventory=await api.loadInventory();
    assert.deepEqual(inventory.items.map(x=>x.id),['filament:17','filament:18','filament:19']);
    assert.equal(inventory.items[0].priceCurrency,'USD');
    assert.deepEqual(inventory.items[0].colors.map(x=>[x.nativeId,x.hex]), [[2,'#FF000000'],[1,'#FF000088']]);
    assert.equal(inventory.items[0].spools[0].remainingWeightG,0);
    assert.equal(inventory.items[1].spools[0].remainingWeightG,null);
    assert.equal(inventory.items[1].vendor,null);
    assert.equal(inventory.items[2].spools[0].archived,true);
    const catalog=await api.loadCatalog();
    assert.deepEqual(catalog.items.map(x=>x.id),['color:17','color:18','color:19']);
    assert.equal('price' in catalog.items[0],false);
    assert.equal(catalog.items[0].usageCount,0);
    assert.equal(calls.length,9);
    assert.ok(calls.every(x=>x.startsWith('/api/v1/')));
    assert.ok(calls.some(x=>x.includes('include_metrics=true') && x.includes('include_archived=true')));
    fixture['/api/v1/spools']['1'].items[0].metrics.remaining_percent=135;
    assert.equal((await api.loadInventory()).items[0].spools[0].remainingPercent,null);
    fixture['/api/v1/spools']['1'].items[0].metrics.remaining_percent=0;
    for (const status of [401,403,500]) {
      globalThis.fetch=async path => {
        const url = new URL(path,'http://test');
        if (url.pathname.endsWith('/discovery/snapshot')) return new Response(null,{status:status===500?404:status});
        return url.searchParams.get('page')==='2' ? new Response(null,{status}) : Response.json(fixture['/api/v1/colors']['1']);
      };
      await assert.rejects(api.loadCatalog(), e=>e.status===status);
    }
    const abort=new AbortController(); abort.abort();
    await assert.rejects(api.loadInventory(abort.signal),{name:'AbortError'});
  } finally { globalThis.fetch=original; await server.close(); }
});
