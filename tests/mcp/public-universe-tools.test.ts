import assert from 'node:assert/strict';
import { test } from 'node:test';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { createNightSkyPluginApp } from '../../server/plugin';
import { createConfiguredSkyProviders } from '../../server/providers/skyConfiguration';
import { GeoNamesPlaceIndex } from '../../server/places/geonames';
const index = new GeoNamesPlaceIndex([{ geonameId: 1269843, name: 'Hyderabad', asciiName: 'Hyderabad', alternateNames: '', latitude: 17.361, longitude: 78.474, countryCode: 'IN', countryName: 'India', featureClass: 'P', featureCode: 'PPLA', population: 1, timeZone: 'Asia/Kolkata', modificationDate: '2026-10-01' }], 'synthetic');
const names = ['search_reference_objects', 'get_reference_details', 'discover_observing_targets', 'get_catalogue_target_windows'];
async function fixture(t: any, selected = false, admitted = false, upstream?: typeof fetch) { let calls = 0; const skyProviders = createConfiguredSkyProviders(selected ? { NIGHTSKY_SKY_PROVIDERS: 'publicuniverse', NIGHTSKY_SKY_ADMITTED_PROVIDERS: admitted ? 'publicuniverse' : '' } : {}, { publicUniverseQuota: { reserve: async () => ({ allowed: true, reason: 'fixture' }), setProviderState: async () => { } }, fetcher: async (...args) => { calls++; if (upstream)
        return upstream(...args); return Response.json({ query: 'Mars', results: [{ id: 'mars', name: 'Mars', object_type: 'planet' }] }); } }); const server = createServer(createNightSkyPluginApp({ placeIndex: index, skyProviders, log: () => { } })); server.listen(0, '127.0.0.1'); await once(server, 'listening'); t.after(async () => { await skyProviders?.publicUniverse?.close(); await new Promise<void>(r => server.close(() => r())); }); const address = server.address(); assert.ok(address && typeof address !== 'string'); let id = 0; return { calls: () => calls, rpc: async (method: string, params: unknown = {}) => { const r = await fetch(`http://127.0.0.1:${address.port}/mcp`, { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream', 'mcp-protocol-version': '2025-11-25' }, body: JSON.stringify({ jsonrpc: '2.0', id: ++id, method, params }) }); const line = (await r.text()).split('\n').find(s => s.startsWith('data: ')); assert.ok(line); return JSON.parse(line.slice(6)); } }; }
const observing = { placeId: 'place:v1:geonames:1269843', displayTimeZone: 'Asia/Kolkata', localNightDate: '2026-10-18', window: { startUtc: '2026-10-18T18:00:00Z', endUtc: '2026-10-19T03:00:00Z' }, equipment: 'binocular', preference: 'balanced', shortlistLimit: 3 };
test('Public Universe stays absent by default and selected unadmitted tools are explicit unavailable', async (t) => { const off = await fixture(t); assert.equal((await off.rpc('tools/list')).result.tools.length, 14); const on = await fixture(t, true); const tools = (await on.rpc('tools/list')).result.tools; assert.equal(tools.length, 18); for (const name of names) {
    const tool = tools.find((v: any) => v.name === name);
    assert.ok(tool);
    assert.equal(tool.inputSchema.type, 'object');
    assert.deepEqual(tool.annotations, { readOnlyHint: true, destructiveHint: false, openWorldHint: true });
} for (const [name, args] of [[names[0], { domain: 'solar-system', query: 'Mars' }], [names[1], { kind: 'meteor-shower', code: 'PER' }], [names[2], observing], [names[3], { ...observing, equipment: undefined, preference: undefined, shortlistLimit: undefined, targets: [{ referenceId: 'forged', revision: 'a'.repeat(64) }] }]] as const) {
    const r = await on.rpc('tools/call', { name, arguments: args });
    assert.equal(r.result.structuredContent.status, name === names[3] ? 'stale' : 'unavailable', JSON.stringify(r));
} assert.equal(on.calls(), 0); });
test('strict MCP inputs reject coordinate and mixed reference bypasses before any source requests', async (t) => { const f = await fixture(t, true, true); for (const args of [{ ...observing, latitude: 0, longitude: 0 }, { ...observing, placeId: 'ref:forged' }, { ...observing, placeId: 'place:v1:api:unknown' }, { ...observing, placeId: 'place:v1:catalogue:unknown' }]) {
    const result = await f.rpc('tools/call', { name: names[2], arguments: args });
    assert.ok(result.error || result.result?.isError, JSON.stringify(result));
} await f.rpc('tools/call', { name: names[1], arguments: { kind: 'selected-object', referenceId: 'place:v1:geonames:1269843', revision: 'a'.repeat(64), sections: [] } }); assert.equal(f.calls(), 0); const found = await f.rpc('tools/call', { name: names[0], arguments: { domain: 'solar-system', query: 'Mars' } }); assert.equal(found.result.structuredContent.data.matches[0].name, 'Mars'); assert.match(found.result.content[0].text, /Mars/); assert.equal(f.calls(), 1); });
test('reference journey preserves credits and strict detail variants; optional reference source leaves core calculations unchanged', async (t) => {
    const source = { source: 'bsc5p', snapshot_sha256: 'a'.repeat(64), upstream_sha256: 'b'.repeat(64), source_url: 'https://example.org/synthetic', retrieved_at: '2026-01-01', license: 'Synthetic licence', license_url: 'https://example.org/licence', attribution: 'Synthetic attribution' };
    const star = { id: 'bsc5p:hr2491', name: 'Synthetic star', source: 'bsc5p', aliases: [], families: ['bright_star'], object_type: 'star', ra_deg: 1, dec_deg: 2, astrometry: { status: 'verified', frame: 'FK5', equinox: 'J2000', reference_epoch_jyear: 2000, observation_epoch_jyear: null, motion_model: 'static_catalogue_direction' } };
    const f = await fixture(t, true, true, async (url) => Response.json(String(url).includes('?') ? { available: true, results: [star], total: 1, limit: 10, offset: 0, sources: { bsc5p: source }, coverage: 'synthetic' } : { ...star, provenance: source }));
    const call = async (name: string, args: unknown) => (await f.rpc('tools/call', { name, arguments: args }));
    const search = await call(names[0], { domain: 'starter-targets', query: 'Synthetic' });
    const selection = search.result.structuredContent.data.matches[0].selection;
    for (const token of ['Synthetic attribution', 'Synthetic licence', 'https://example.org/licence'])
        assert.ok(search.result.content[0].text.includes(token));
    const detail = await call(names[1], { kind: 'selected-object', ...selection, sections: [] });
    assert.equal(detail.result.structuredContent.status, 'available');
    const before = f.calls();
    for (const args of [{ kind: 'meteor-shower', code: 'PER', ...selection }, { kind: 'selected-object', ...selection, sections: ['rings', 'rings'] }, { kind: 'close-approaches', ...selection, from: '2026-02-30', to: '2026-03-01' }, { kind: 'exoplanet-host', ...selection, code: 'PER' }]) {
        const r = await call(names[1], args);
        assert.ok(r.error || r.result?.isError);
    }
    assert.equal(f.calls(), before);
    const off = await fixture(t);
    const core = { placeId: observing.placeId, window: { ...observing.window, timeZone: 'Asia/Kolkata' } };
    const baseline = await off.rpc('tools/call', { name: 'get_astronomy_window', arguments: core });
    const actual = await call('get_astronomy_window', core);
    assert.deepEqual(actual.result.structuredContent, baseline.result.structuredContent);
});
test('observing wire coordinates come from resolved place and optional outage preserves core result', async (t) => {
    let body: any;
    const f = await fixture(t, true, true, async (_url, init) => { body = JSON.parse(String(init?.body)); return new Response('synthetic outage', { status: 503 }); });
    const r = await f.rpc('tools/call', { name: names[2], arguments: observing });
    assert.equal(r.result.structuredContent.status, 'unavailable');
    assert.equal(body.lat, 17.361);
    assert.equal(body.lon, 78.474);
    assert.equal(body.timezone, 'Asia/Kolkata');
    assert.deepEqual(Object.keys(body).sort(), ['date', 'equipment_mode', 'lat', 'lon', 'preference', 'shortlist_limit', 'timezone', 'window_end_utc', 'window_start_utc']);
    const core = { placeId: observing.placeId, window: { ...observing.window, timeZone: 'Asia/Kolkata' } };
    const off = await fixture(t);
    const baseline = await off.rpc('tools/call', { name: 'get_astronomy_window', arguments: core });
    const after = await f.rpc('tools/call', { name: 'get_astronomy_window', arguments: core });
    assert.deepEqual(after.result.structuredContent, baseline.result.structuredContent);
    assert.equal(f.calls(), 1);
});
