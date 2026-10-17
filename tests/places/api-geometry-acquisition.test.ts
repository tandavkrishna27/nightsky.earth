import test from 'node:test';
import assert from 'node:assert/strict';
import { ApiHttpClient } from '../../server/places/api/http';
import { GeometryAcquisition } from '../../server/places/api/geometryAcquisition';
const ref = { regionId: `region:v1:api:geoapify:${'b'.repeat(64)}`, sourceRevision: '2'.repeat(64) };
test('geometry is gated, costs two credits, and cache is revision bound', async () => {
    let calls = 0; const costs: number[] = []; let time = Date.parse('2026-10-17T00:00:00Z');
    const config = { userAgent: 'fixture', geoapifyApiKey: 'fixture', now: () => time,
        quota: { reserve: async (_id: string, cost: number) => { costs.push(cost); return { allowed: true, reason: 'synthetic fixture' }; } },
        fetcher: async (url: URL | RequestInfo) => { calls++; assert.equal(new URL(String(url)).searchParams.get('features'), 'details,details.full_geometry'); return new Response(JSON.stringify({ type: 'FeatureCollection', features: [{ type: 'Feature', properties: { feature_type: 'details', place_id: 'selected' }, geometry: { type: 'Polygon', coordinates: [[[0,0],[5,0],[5,5],[0,5],[0,0]]] } }] })); } };
    await assert.rejects(new ApiHttpClient(config).json('geoapify', '/v2/place-details', { id: 'selected', features: 'details,details.full_geometry' }));
    assert.equal(calls, 0);
    const acquisition = new GeometryAcquisition(new ApiHttpClient({ ...config, geometryEnabled: true, geometrySourceAccepted: true }), config.now);
    const selected = [{ ref, upstreamId: 'selected', expiresAt: new Date(time + 3600000).toISOString() }];
    const first = await acquisition.acquire(selected, Date.now() + 15000);
    assert.equal(first.get(ref.regionId)?.classify([1,1], time), 'inside');
    await acquisition.acquire(selected, Date.now() + 15000);
    assert.equal(calls, 1); assert.deepEqual(costs, [2]);
    time += 2000;
    await acquisition.acquire([{ ...selected[0]!, ref: { ...ref, sourceRevision: '3'.repeat(64) } }], Date.now() + 15000);
    assert.equal(calls, 2);
});
import { createApiServices } from '../../server/places/api/configuration';
test('staged discovery applies combined scopes and exclusion locally and withholds boundary ties', async () => {
    let time = Date.parse('2026-10-17T00:00:00Z'); const paths: string[] = [];
    const service = createApiServices({ userAgent: 'fixture', geoapifyApiKey: 'fixture', geometryEnabled: true, geometrySourceAccepted: true, now: () => time,
        fetcher: async url => {
            const u = new URL(String(url)); paths.push(u.pathname); time += 1100;
            const square = (n: number) => [[[0,0],[n,0],[n,n],[0,n],[0,0]]];
            if (u.pathname === '/v2/place-details') return new Response(JSON.stringify({ type: 'FeatureCollection', features: [{ type: 'Feature', properties: { feature_type: 'details', place_id: u.searchParams.get('id'), datasource: { sourcename: 'Boundary fixture', attribution: 'Boundary fixture credit', license: 'ODbL', url: 'https://example.org/boundary', raw: { discarded: true } } }, geometry: { type: 'Polygon', coordinates: square(u.searchParams.get('id') === 'include' ? 5 : 2) } }] }));
            assert.match(u.searchParams.get('filter')!, /^circle:/);
            return new Response(JSON.stringify({ features: [[1,1], [3,3], [3,5]].map((coordinates,i) => ({ properties: { place_id: 'p'+i, name: 'Park'+i, categories: ['leisure.park'] }, geometry: { type: 'Point', coordinates } })) }));
        } });
    const record = (upstreamId: string, region = false) => ({ providerId: 'geoapify' as const, upstreamId, name: upstreamId, longitude: 3, latitude: 3, fetchedAt: new Date(time).toISOString(), expiresAt: new Date(time + 3600000).toISOString(), sourceUrl: 'https://www.geoapify.com/', attribution: 'Geoapify', timeZoneEvidence: { status: 'unknown' as const }, ...(region ? { regionEvidence: { countryCode: 'IND', adminLevel: 1 as const } } : {}) });
    const origin = service.selectionStore.put(record('origin'));
    const inc = service.selectionStore.put(record('include', true)); const exc = service.selectionStore.put(record('exclude', true));
    const refs = [inc,exc].map(r => ({ regionId: r.placeId.replace('place:v1:', 'region:v1:'), sourceRevision: r.sourceRevision }));
    const result = await service.discoveryProvider.search({ scope: { origins: [{ ...origin, radiusKm: 300, minimumDistanceKm: 0 }], originMode: 'any', includeRegionIds: [refs[0]!.regionId], excludeRegionIds: [refs[1]!.regionId], regionSelections: refs, regionMode: 'all' }, limit: 5 });
    assert.deepEqual(paths, ['/v2/place-details','/v2/place-details','/v2/places']);
    assert.deepEqual(result.candidates.map(c => c.name), ['Park1']);
    assert.equal(result.availability.status, 'partial');
    assert.equal(result.geometryEvidence?.length, 2);
    assert.match(result.geometryEvidence![0]!.geometryRevision, /^[a-f0-9]{64}$/);
    assert.equal(result.geometryEvidence![0]!.sourceVintage, 'unknown');
    assert.equal(result.geometryEvidence![0]!.source.url, 'https://apidocs.geoapify.com/docs/place-details/');
    assert.equal(result.geometryEvidence![0]!.additionalSources?.[0]?.attribution, 'Boundary fixture credit');
    assert.equal(result.geometryEvidence![0]!.additionalSources?.[0]?.product, 'ODbL');
    assert.equal(JSON.stringify(result.geometryEvidence).includes('discarded'), false);
    await service.discoveryProvider.search({ scope: { origins: [{ ...origin, radiusKm: 300, minimumDistanceKm: 0 }], originMode: 'any', includeRegionIds: [refs[0]!.regionId], excludeRegionIds: [refs[1]!.regionId], regionSelections: refs, regionMode: 'all' }, limit: 5 });
    assert.equal(paths.length, 3);
});

test('geometry rejects unsupported payloads and over-budget selections without fallback', async () => {
    let calls = 0;
    const http = new ApiHttpClient({ userAgent: 'fixture', geoapifyApiKey: 'fixture', geometryEnabled: true, geometrySourceAccepted: true, fetcher: async () => { calls++; return new Response(JSON.stringify({ type: 'FeatureCollection', features: [] })); } });
    const acquisition = new GeometryAcquisition(http, Date.now);
    const selected = { ref, upstreamId: 'selected', expiresAt: new Date(Date.now()+3600000).toISOString() };
    await assert.rejects(acquisition.acquire(Array.from({length: 11}, (_,i) => ({ ...selected, ref: { ...ref, sourceRevision: i.toString(16).padStart(64,'0') } })), Date.now()+15000), /ten/);
    assert.equal(calls,0);
    await assert.rejects(acquisition.acquire([selected], Date.now()+15000), /missing, mismatched/);
    assert.equal(calls,1);
});
test('geometry persistent quota denies its two-credit reservation before transport', async () => {
    let calls = 0;
    const http = new ApiHttpClient({ userAgent: 'fixture', geoapifyApiKey: 'fixture', geometryEnabled: true, geometrySourceAccepted: true, quota: { reserve: async (_provider,cost) => { assert.equal(cost,2); return { allowed: false, reason: 'synthetic quota denial' }; } }, fetcher: async () => { calls++; throw Error('no transport'); } });
    await assert.rejects(http.json('geoapify','/v2/place-details',{id:'selected',features:'details,details.full_geometry'}), /quota-exhausted/);
    assert.equal(calls,0);
});
test('coalesced geometry acquisitions account one cache entry once', async () => {
    let calls = 0; let release!: () => void;
    const wait = new Promise<void>(r => { release = r; });
    const body = { type: 'FeatureCollection', features: [{ type: 'Feature', properties: { feature_type: 'details', place_id: 'selected' }, geometry: { type: 'Polygon', coordinates: [[[0,0],[5,0],[5,5],[0,5],[0,0]]] } }] };
    const http = new ApiHttpClient({ userAgent: 'fixture', geoapifyApiKey: 'fixture', geometryEnabled: true, geometrySourceAccepted: true, fetcher: async () => { calls++; await wait; return new Response(JSON.stringify(body)); } });
    const acquisition = new GeometryAcquisition(http, Date.now);
    const selected = [{ ref, upstreamId: 'selected', expiresAt: new Date(Date.now()+3600000).toISOString() }];
    const first = acquisition.acquire(selected, Date.now()+15000); const second = acquisition.acquire(selected, Date.now()+15000);
    release(); await Promise.all([first,second]);
    assert.equal(calls,1);
    assert.equal((acquisition as unknown as { bytes: number }).bytes, Buffer.byteLength(JSON.stringify(body)));
});
