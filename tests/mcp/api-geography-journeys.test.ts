import test from 'node:test';
import assert from 'node:assert/strict';
import type { McpServer } from '@modelcontextprotocol/server';
import { registerNightSkyTools } from '../../server/mcp/registerTools';
import { createApiServices } from '../../server/places/api/configuration';
import type { ApiConfiguration } from '../../server/places/api/http';
import { resolvePlaceResultSchema } from '../../shared/nightsky/places';
import { resolveObservingRegionResultSchema, searchDiscoveryResultSchema, getObservingLocationDetailsResultSchema, type CandidateRef } from '../../shared/nightsky/discovery';
import { planResultSchema, compareObservingOptionsResultSchema } from '../../shared/nightsky/planning';

const window = { startUtc: '2026-10-18T14:00:00Z', endUtc: '2026-10-18T22:00:00Z', timeZone: 'Asia/Kolkata' };
const point = (id: string, longitude: number, latitude: number, properties: Record<string, unknown> = {}) => ({
    type: 'Feature', properties: { place_id: id, name: id, ...properties }, geometry: { type: 'Point', coordinates: [longitude, latitude] }
});
const park = (id: string, longitude: number, latitude: number) => point(id, longitude, latitude, { categories: ['leisure.park'] });
const collection = (features: unknown[]) => ({ type: 'FeatureCollection', features });
type Schema<T> = { parse(value: unknown): T };
type RegisteredTool = { config: { inputSchema: Schema<unknown>; outputSchema: Schema<unknown> }; handler: (value: unknown, context: unknown) => Promise<{ structuredContent: unknown }> };
function registeredFixture(respond: (url: URL) => unknown, flags: Pick<ApiConfiguration, 'geometryEnabled' | 'geometrySourceAccepted'> = {}) {
    let time = Date.parse('2026-10-17T00:00:00Z');
    let localLoads = 0;
    const urls: URL[] = [];
    const weatherPoints: Array<{ placeId: string; latitude: number; longitude: number }> = [];
    const api = createApiServices({ geoapifyApiKey: 'fixture', userAgent: 'NightSky offline MCP geography fixture', ...flags,
        now: () => time, fetcher: async input => { const url = new URL(String(input)); urls.push(url); time += 1100; return Response.json(respond(url)); } });
    const tools = new Map<string, RegisteredTool>();
    registerNightSkyTools({ registerTool(name: string, config: RegisteredTool['config'], handler: RegisteredTool['handler']) {
        tools.set(name, { config, handler });
    } } as unknown as McpServer, {
        ...api, placeIndexLoader: async () => { localLoads++; throw Error('Local geography must not load in this API journey'); },
        fetcher: async () => { throw Error('Unexpected non-injected provider transport'); },
        weatherProvider: { async getForecast(selected) { weatherPoints.push(selected); return { status: 'unavailable', reason: 'Offline fixture has no forecast' }; } },
        auroraProvider: async (selected, requestedWindow) => ({ placeId: selected.placeId, window: requestedWindow,
            availability: { status: 'unavailable', reason: 'Offline fixture has no aurora' },
            outlook: { status: 'unavailable', reason: 'Offline fixture has no aurora' }, latitudeBand: 'mid-latitude',
            sources: [{ name: 'Offline NOAA fixture', url: 'https://www.swpc.noaa.gov/', attribution: 'Injected offline fixture', dataClass: 'forecast' }], caveats: [] })
    });
    async function invoke<T>(name: string, value: unknown, output: Schema<T>, metadata: Record<string, unknown> = {}): Promise<T> {
        const tool = tools.get(name);
        assert.ok(tool, `Tool ${name} must be registered`);
        const reply = await tool.handler(tool.config.inputSchema.parse(value), { mcpReq: { _meta: metadata } });
        return output.parse(tool.config.outputSchema.parse(reply.structuredContent));
    }
    return { invoke, urls, weatherPoints, get localLoads() { return localLoads; } };
}
const regionSelection = (r: { regionId: string; sourceRevision?: string }) => ({ regionId: r.regionId, sourceRevision: r.sourceRevision! });
const pointSelection = (r: { placeId: string; sourceRevision?: string }) => ({ placeId: r.placeId, sourceRevision: r.sourceRevision! });
const option = (r: { placeId: string; sourceRevision?: string }) => ({ ...pointSelection(r), displayTimeZone: 'Asia/Kolkata', activity: 'general-stargazing', window });

test('registered near-me refuses host transport then explicitly named discovery plans the selected site', async () => {
    const f = registeredFixture(url => url.pathname === '/v1/geocode/search'
        ? collection([point('Town', 73, 18, { result_type: 'city' })])
        : collection([park('Selected park', 73.01, 18.01)]));
    const near = await f.invoke('resolve_place', { useApproximateHostLocation: true }, resolvePlaceResultSchema,
        { 'openai/userLocation': { latitude: 51.50853, longitude: -0.12574 } });
    assert.equal(near.availability.status, 'unavailable');
    assert.deepEqual(near.matches, []);
    assert.equal(f.urls.length, 0);
    const town = (await f.invoke('resolve_place', { placeQuery: 'Town, India' }, resolvePlaceResultSchema)).matches[0]!;
    const search = await f.invoke('search_observing_locations', { ...pointSelection(town), radiusKm: 10 }, searchDiscoveryResultSchema);
    const selected = search.candidates[0]!;
    assert.equal(f.urls[1]!.searchParams.get('filter'), 'circle:73,18,10000');
    const details = await f.invoke('get_observing_location_details', pointSelection(selected), getObservingLocationDetailsResultSchema);
    assert.equal(details.matches[0]!.sourceRevision, selected.sourceRevision);
    await assert.rejects(f.invoke('plan_observing_session', { ...pointSelection(selected), activity: 'general-stargazing', window }, planResultSchema), /display time zone/i);
    assert.equal(f.weatherPoints.length, 0);
    const plan = await f.invoke('plan_observing_session', option(selected), planResultSchema);
    assert.equal(plan.place.sourceRevision, selected.sourceRevision);
    assert.equal(plan.place.timeZoneBasis, 'explicit-display');
    assert.ok(plan.evidence?.astronomy);
    assert.deepEqual(f.weatherPoints[0], { placeId: selected.placeId, latitude: 18.01, longitude: 73.01 });
    assert.equal(f.localLoads, 0);
});

test('registered country and state flows preserve provider boundaries through exact-site planning and comparison', async () => {
    const f = registeredFixture(url => {
        if (url.pathname === '/v1/geocode/search') return collection([url.searchParams.has('country')
            ? point('country-id', 78, 22, { result_type: 'country', country_code: 'in' })
            : point('state-id', 77, 16, { result_type: 'state', country_code: 'in' })]);
        return collection([url.searchParams.get('filter') === 'place:country-id'
            ? park('country-site', 73.01, 18.01) : park('state-site', 74.01, 19.01)]);
    });
    const selections: CandidateRef[] = [];
    for (const [query, adminLevel, upstream] of [['India', 0, 'country-id'], ['Maharashtra', 1, 'state-id']] as const) {
        const region = (await f.invoke('resolve_observing_region', { regionQuery: query, countryCode: 'IND', adminLevel }, resolveObservingRegionResultSchema)).matches[0]!;
        const result = await f.invoke('search_observing_locations', { scope: { includeRegionIds: [region.regionId], regionSelections: [regionSelection(region)] } }, searchDiscoveryResultSchema);
        assert.equal(f.urls.at(-1)!.searchParams.get('filter'), `place:${upstream}`);
        assert.equal(result.sortBasis, 'name-then-id');
        assert.equal(result.candidates[0]!.distanceKm, undefined);
        assert.deepEqual(result.queryScope.includeRegionIds, [region.regionId]);
        const selected = result.candidates[0]!;
        const details = await f.invoke('get_observing_location_details', pointSelection(selected), getObservingLocationDetailsResultSchema);
        assert.equal(details.matches[0]!.sourceRevision, selected.sourceRevision);
        selections.push(selected);
    }
    assert.equal(f.urls.some(u => u.searchParams.get('filter')?.startsWith('circle:')), false);
    const plan = await f.invoke('plan_observing_session', option(selections[0]!), planResultSchema);
    assert.equal(plan.place.sourceRevision, selections[0]!.sourceRevision);
    assert.ok(plan.evidence?.astronomy);
    assert.deepEqual(f.weatherPoints[0], { placeId: selections[0]!.placeId, latitude: 18.01, longitude: 73.01 });
    const beforeCompare = f.weatherPoints.length;
    const compared = await f.invoke('compare_observing_options', { options: selections.map(option) }, compareObservingOptionsResultSchema);
    assert.deepEqual(compared.comparisons.map(c => c.sourceRevision), selections.map(s => s.sourceRevision));
    for (const comparison of compared.comparisons) {
        assert.equal(comparison.timeZoneBasis, 'explicit-display');
        assert.ok(comparison.evidence?.astronomy);
    }
    const comparisonPoints = f.weatherPoints.slice(beforeCompare);
    assert.equal(comparisonPoints.length, 2);
    assert.ok(comparisonPoints.some(p => p.placeId === selections[0]!.placeId && p.latitude === 18.01 && p.longitude === 73.01));
    assert.ok(comparisonPoints.some(p => p.placeId === selections[1]!.placeId && p.latitude === 19.01 && p.longitude === 74.01));
    assert.ok(f.weatherPoints.every(p => p.latitude !== 22 && p.longitude !== 78));
    assert.equal(f.localLoads, 0);
});

test('registered multi-origin any and all retain bands and all per-origin distances', async () => {
    const f = registeredFixture(url => url.pathname === '/v1/geocode/search'
        ? collection([point('west', 0, 0), point('east', 0.1, 0)])
        : collection([park('west-only', -0.04, 0), park('shared', 0.04, 0), park('east-only', 0.14, 0), park('too-close-west', 0, 0)]));
    const towns = await f.invoke('resolve_place', { placeQuery: 'Two towns' }, resolvePlaceResultSchema);
    assert.equal(towns.selectionRequired, true);
    const origins = towns.matches.map(p => ({ ...pointSelection(p), radiusKm: 12, minimumDistanceKm: 2 }));
    for (const originMode of ['any', 'all'] as const) {
        const result = await f.invoke('search_observing_locations', { scope: { origins, originMode } }, searchDiscoveryResultSchema);
        assert.deepEqual(result.queryScope.origins, origins);
        assert.equal(result.queryScope.originMode, originMode);
        assert.deepEqual(result.candidates.map(c => c.name).sort(), originMode === 'all' ? ['shared'] : ['east-only', 'shared', 'too-close-west', 'west-only']);
        assert.equal(result.sortBasis, originMode === 'all' ? 'maximum-distance' : 'minimum-distance');
        const shared = result.candidates.find(c => c.name === 'shared')!;
        assert.equal(shared.originDistances!.length, 2);
        assert.ok(Math.abs(shared.originDistances![0]!.distanceKm - 4.448) < 0.002);
        assert.ok(Math.abs(shared.originDistances![1]!.distanceKm - 6.672) < 0.002);
        assert.ok(Math.abs(shared.distanceKm! - (originMode === 'all' ? 6.672 : 4.448)) < 0.002);
    }
    assert.equal(f.localLoads, 0);
});

test('registered region constraints qualify only evidenced sites and disabled geometry makes no extra calls', async () => {
    for (const enabled of [true, false]) {
        const f = registeredFixture(url => {
            if (url.pathname === '/v1/geocode/search') {
                const name = url.searchParams.get('state') ?? url.searchParams.get('text')!;
                return collection([point(name, 3, 3, name === 'Origin' ? { result_type: 'city' } : { result_type: 'state', country_code: 'in' })]);
            }
            if (url.pathname === '/v2/place-details') {
                const id = url.searchParams.get('id')!;
                const n = id === 'Include' ? 5 : 2;
                return collection([{ type: 'Feature', properties: { feature_type: 'details', place_id: id }, geometry: { type: 'Polygon', coordinates: [[[0, 0], [n, 0], [n, n], [0, n], [0, 0]]] } }]);
            }
            return collection([park('allowed', 3, 3), park('excluded', 1.5, 1.5), park('boundary', 2, 1), park('outside', 5.2, 3)]);
        }, { geometryEnabled: enabled, geometrySourceAccepted: enabled });
        const origin = (await f.invoke('resolve_place', { placeQuery: 'Origin' }, resolvePlaceResultSchema)).matches[0]!;
        const include = (await f.invoke('resolve_observing_region', { regionQuery: 'Include', countryCode: 'IND', adminLevel: 1 }, resolveObservingRegionResultSchema)).matches[0]!;
        const exclude = (await f.invoke('resolve_observing_region', { regionQuery: 'Exclude', countryCode: 'IND', adminLevel: 1 }, resolveObservingRegionResultSchema)).matches[0]!;
        const scope = { origins: [{ ...pointSelection(origin), radiusKm: 300, minimumDistanceKm: 0 }], originMode: 'all', includeRegionIds: [include.regionId], excludeRegionIds: [exclude.regionId], regionSelections: [regionSelection(include), regionSelection(exclude)], regionMode: 'all' };
        const before = f.urls.length;
        const search = await f.invoke('search_observing_locations', { scope }, searchDiscoveryResultSchema);
        assert.deepEqual(search.queryScope, scope);
        if (enabled) {
            assert.deepEqual(search.candidates.map(c => c.name), ['allowed']);
            assert.equal(search.availability.status, 'partial');
            assert.equal(search.geometryEvidence!.length, 2);
            assert.equal(f.urls.length - before, 3);
            const selected = search.candidates[0]!;
            await f.invoke('get_observing_location_details', pointSelection(selected), getObservingLocationDetailsResultSchema);
            const plan = await f.invoke('plan_observing_session', option(selected), planResultSchema);
            assert.equal(plan.place.sourceRevision, selected.sourceRevision);
            assert.ok(plan.evidence?.astronomy);
            assert.deepEqual(f.weatherPoints[0], { placeId: selected.placeId, latitude: 3, longitude: 3 });
        } else {
            assert.equal(search.availability.status, 'unsupported');
            assert.deepEqual(search.candidates, []);
            assert.equal(f.urls.length, before);
        }
        assert.equal(f.localLoads, 0);
    }
});
