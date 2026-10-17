import test from 'node:test';
import assert from 'node:assert/strict';
import { createApiServices } from '../../server/places/api/configuration';
import type { ApiConfiguration } from '../../server/places/api/http';
import { discoveryScopeSchema } from '../../shared/nightsky/discovery';

const point = (id: string, longitude: number, latitude: number, properties: Record<string, unknown> = {}) => ({
    type: 'Feature', properties: { place_id: id, name: id, ...properties },
    geometry: { type: 'Point', coordinates: [longitude, latitude] }
});
const park = (id: string, longitude: number, latitude: number) => point(id, longitude, latitude, { categories: ['leisure.park'] });
const collection = (features: unknown[]) => ({ type: 'FeatureCollection', features });
const geocodeName = (url: URL) => url.searchParams.get('text') ?? url.searchParams.get('country') ?? url.searchParams.get('state');
function fixture(respond: (url: URL) => unknown, options: Partial<ApiConfiguration> = {}) {
    let time = Date.parse('2026-10-17T00:00:00Z');
    const urls: URL[] = [];
    const api = createApiServices({
        userAgent: 'NightSky offline geography fixture', geoapifyApiKey: 'fixture', ...options,
        now: () => time,
        fetcher: async input => {
            const url = new URL(String(input)); urls.push(url); time += 1100;
            return Response.json(respond(url));
        }
    });
    return { api, urls, advance: (milliseconds: number) => { time += milliseconds; } };
}
const selectedRegion = (r: { regionId: string; sourceRevision?: string }) => ({ regionId: r.regionId, sourceRevision: r.sourceRevision! });

test('near-me makes no location request and explicit named fallback preserves exact selected site', async () => {
    const { api, urls } = fixture(url => url.pathname === '/v1/geocode/search'
        ? collection([point('Town', 77, 12, { result_type: 'city' })])
        : collection([park('Selected park', 77.01, 12.01)]));
    const near = await api.discoveryProvider.resolvePlace({ useApproximateHostLocation: true });
    assert.equal(near.availability.status, 'unavailable');
    assert.equal(near.matches.length, 0);
    assert.equal(urls.length, 0);
    const town = (await api.discoveryProvider.resolvePlace({ placeQuery: 'Town, India' })).matches[0]!;
    const result = await api.discoveryProvider.search({ placeId: town.placeId, sourceRevision: town.sourceRevision, radiusKm: 10, limit: 5 });
    assert.equal(result.candidates.length, 1);
    const candidate = result.candidates[0]!;
    const ref = { placeId: candidate.placeId, sourceRevision: candidate.sourceRevision! };
    const details = await api.discoveryProvider.details(ref);
    assert.equal(details.matches[0]!.sourceRevision, candidate.sourceRevision);
    await assert.rejects(api.selectedPlaceResolver.resolve(ref), /display time zone/i);
    const resolved = await api.selectedPlaceResolver.resolve({ ...ref, displayTimeZone: 'Asia/Kolkata' });
    assert.equal(resolved.latitude, 12.01);
    assert.equal(resolved.longitude, 77.01);
    assert.equal(resolved.timeZoneBasis, 'explicit-display');
    assert.equal(resolved.timeZoneEvidence?.status, 'unknown');
    assert.equal(urls.length, 2);
    assert.equal(urls[1]!.searchParams.get('filter'), 'circle:77,12,10000');
});

for (const [adminLevel, name, countryCode] of [[0, 'India', 'IND'], [1, 'Georgia', 'USA']] as const) {
    test(`${name} region discovery uses selected provider boundary and returns an exact site`, async () => {
        const { api, urls } = fixture(url => url.pathname === '/v1/geocode/search'
            ? collection([point('region', 78, 22, { result_type: adminLevel === 0 ? 'country' : 'state', country_code: adminLevel === 0 ? 'in' : 'us' })])
            : collection([park('Z park', 73, 18), park('A park', 74, 19)]));
        const region = (await api.discoveryProvider.resolveRegion({ regionQuery: name, countryCode, adminLevel })).matches[0]!;
        assert.ok(region, 'requested region must remain selectable');
        assert.equal(urls[0]!.searchParams.get(adminLevel === 0 ? 'country' : 'state'), name);
        assert.equal(urls[0]!.searchParams.has('text'), false);
        assert.equal(urls[0]!.searchParams.get('bias'), 'countrycode:none');
        const result = await api.discoveryProvider.search({ scope: discoveryScopeSchema.parse({ includeRegionIds: [region.regionId], regionSelections: [selectedRegion(region)] }), limit: 5 });
        assert.equal(result.sortBasis, 'name-then-id');
        assert.deepEqual(result.candidates.map(c => c.name), ['A park', 'Z park']);
        assert.ok(result.candidates.every(c => c.distanceKm === undefined));
        assert.equal(urls[1]!.searchParams.get('filter'), 'place:region');
        assert.equal(urls.some(u => u.searchParams.get('filter')?.startsWith('circle:')), false);
        const chosen = result.candidates[0]!;
        const details = await api.discoveryProvider.details({ placeId: chosen.placeId, sourceRevision: chosen.sourceRevision! });
        const actual = await api.selectedPlaceResolver.resolve({ placeId: chosen.placeId, sourceRevision: chosen.sourceRevision, displayTimeZone: 'Asia/Kolkata' });
        assert.equal(details.matches[0]!.sourceRevision, chosen.sourceRevision);
        assert.equal(actual.longitude, 74);
        assert.equal(actual.latitude, 19);
    });
}

test('country-qualified state resolution pushes the country filter upstream', async () => {
    const { api, urls } = fixture(url => collection(url.searchParams.get('filter') === 'countrycode:us'
        ? [point('Georgia-US', -83, 32, { result_type: 'state', country_code: 'us' })]
        : [point('Georgia-country', 43, 42, { result_type: 'country', country_code: 'ge' })]));
    const result = await api.discoveryProvider.resolveRegion({ regionQuery: 'Georgia', countryCode: 'USA', adminLevel: 1 });
    assert.equal(result.matches.length, 1);
    assert.equal(result.matches[0]!.countryCode, 'USA');
    assert.equal(urls[0]!.searchParams.get('filter'), 'countrycode:us');
    assert.equal(urls[0]!.searchParams.get('state'), 'Georgia');
    assert.equal(urls[0]!.searchParams.has('text'), false);
});

test('selected state union deduplicates shared candidates without inventing centroid distances', async () => {
    const { api, urls } = fixture(url => {
        if (url.pathname === '/v1/geocode/search') return collection([
            point('State A', 70, 20, { result_type: 'state', country_code: 'in' }),
            point('State B', 80, 25, { result_type: 'state', country_code: 'in' })
        ]);
        const id = url.searchParams.get('filter') === 'place:State A' ? 'only-A' : 'only-B';
        return collection([park('shared', 75, 22), park(id, 76, 23)]);
    });
    const resolved = await api.discoveryProvider.resolveRegion({ regionQuery: 'States', countryCode: 'IND', adminLevel: 1 });
    assert.equal(resolved.selectionRequired, true);
    const scope = discoveryScopeSchema.parse({ includeRegionIds: resolved.matches.map(r => r.regionId), regionSelections: resolved.matches.map(selectedRegion), regionMode: 'any' });
    const result = await api.discoveryProvider.search({ scope, limit: 10 });
    assert.deepEqual(result.candidates.map(c => c.name), ['only-A', 'only-B', 'shared']);
    assert.ok(result.candidates.every(c => c.distanceKm === undefined));
    assert.equal(result.sortBasis, 'name-then-id');
    assert.deepEqual(urls.filter(u => u.pathname === '/v2/places').map(u => u.searchParams.get('filter')), ['place:State A', 'place:State B']);
    const shared = result.candidates.find(c => c.name === 'shared')!;
    const actual = await api.selectedPlaceResolver.resolve({ placeId: shared.placeId, sourceRevision: shared.sourceRevision, displayTimeZone: 'Asia/Kolkata' });
    assert.equal(actual.longitude, 75);
    assert.equal(actual.latitude, 22);
});

test('country filtering still rejects mismatched source identity and unknown country codes avoid transport', async () => {
    const { api, urls } = fixture(() => collection([point('wrong-country-state', 43, 42, { result_type: 'state', country_code: 'ge' })]));
    const mismatched = await api.discoveryProvider.resolveRegion({ regionQuery: 'Georgia', countryCode: 'USA', adminLevel: 1 });
    assert.deepEqual(mismatched.matches, []);
    assert.notEqual(mismatched.availability.status, 'available');
    const before = urls.length;
    await api.discoveryProvider.resolveRegion({ regionQuery: 'Georgia', countryCode: 'ZZZ', adminLevel: 1 }).catch(() => undefined);
    assert.equal(urls.length, before);
});

test('administrative Geoapify selection cannot silently become a radius origin', async () => {
    const { api, urls } = fixture(url => url.pathname === '/v1/geocode/search'
        ? collection([point('India', 78, 22, { result_type: 'country', country_code: 'in' })])
        : collection([park('centroid park', 78, 22)]));
    const resolved = await api.discoveryProvider.resolvePlace({ placeQuery: 'India' });
    if (resolved.matches.length) {
        const ref = resolved.matches[0]!;
        await assert.rejects(api.discoveryProvider.search({ placeId: ref.placeId, sourceRevision: ref.sourceRevision, limit: 5 }), /region|administrative|observing point/i);
        await assert.rejects(api.selectedPlaceResolver.resolve({ placeId: ref.placeId, sourceRevision: ref.sourceRevision, displayTimeZone: 'Asia/Kolkata' }), /region|administrative|observing point/i);
    }
    assert.equal(urls.filter(u => u.pathname === '/v2/places').length, 0);
});

test('GeoNames administrative matches cannot become selected observing points', async () => {
    const { api, urls } = fixture(() => ({ geonames: [{ geonameId: 1269750, name: 'India', lat: '22', lng: '78', fcl: 'A', fcode: 'PCLI' }] }), { geonamesUsername: 'fixture', geoapifyApiKey: undefined });
    const resolved = await api.discoveryProvider.resolvePlace({ placeQuery: 'India' });
    for (const ref of resolved.matches) {
        await assert.rejects(api.selectedPlaceResolver.resolve({ placeId: ref.placeId, sourceRevision: ref.sourceRevision, displayTimeZone: 'Asia/Kolkata' }), /region|administrative|observing point/i);
    }
    assert.equal(urls.length, 1);
});

for (const mode of ['any', 'all'] as const) {
    test(`multiple-origin ${mode} preserves every distance band and deterministic distance ordering`, async () => {
        const { api, urls } = fixture(url => url.pathname === '/v1/geocode/search'
            ? collection([point('West', 0, 0), point('East', 0.1, 0)])
            : collection([park('west-only', -0.04, 0), park('shared', 0.04, 0), park('east-only', 0.14, 0), park('too-close-west', 0, 0)]));
        const matches = (await api.discoveryProvider.resolvePlace({ placeQuery: 'Two towns' })).matches;
        const origins = matches.map(m => ({ placeId: m.placeId, sourceRevision: m.sourceRevision, radiusKm: 12, minimumDistanceKm: 2 }));
        const result = await api.discoveryProvider.search({ scope: discoveryScopeSchema.parse({ origins, originMode: mode }), limit: 10 });
        assert.deepEqual(result.candidates.map(c => c.name).sort(), mode === 'all' ? ['shared'] : ['east-only', 'shared', 'too-close-west', 'west-only']);
        assert.ok(result.candidates.every((c, i, rows) => i === 0 || rows[i - 1]!.distanceKm! <= c.distanceKm!));
        if (mode === 'any') assert.equal(result.candidates[0]!.name, 'too-close-west');
        assert.equal(urls.filter(u => u.pathname === '/v2/places').length, mode === 'all' ? 1 : 2);
        assert.equal(result.sortBasis, mode === 'all' ? 'maximum-distance' : 'minimum-distance');
        for (const candidate of result.candidates) {
            assert.equal(candidate.originDistances!.length, 2);
            assert.deepEqual(candidate.originDistances!.map(d => d.placeId), matches.map(m => m.placeId));
        }
        const shared = result.candidates.find(c => c.name === 'shared')!;
        assert.ok(Math.abs(shared.originDistances![0]!.distanceKm - 4.448) < 0.002);
        assert.ok(Math.abs(shared.originDistances![1]!.distanceKm - 6.672) < 0.002);
        assert.ok(Math.abs(shared.distanceKm! - (mode === 'all' ? 6.672 : 4.448)) < 0.002);
    });
}

function geometryFixture(flags: Pick<ApiConfiguration, 'geometryEnabled' | 'geometrySourceAccepted'>, unsupported = false, expireDuringPoi = false) {
    const f = fixture(url => {
        if (url.pathname === '/v1/geocode/search') {
            const name = geocodeName(url)!;
            return collection([point(name, 3, 3, name === 'Origin' ? { result_type: 'city' } : { result_type: 'state', country_code: 'in' })]);
        }
        if (url.pathname === '/v2/place-details') {
            const id = url.searchParams.get('id')!;
            const edge = id === 'Include' ? 5 : 2;
            return collection([{ type: 'Feature', properties: { place_id: id, feature_type: 'details' }, geometry: unsupported
                ? { type: 'Point', coordinates: [3, 3] }
                : { type: 'Polygon', coordinates: [[[0, 0], [edge, 0], [edge, edge], [0, edge], [0, 0]]] } }]);
        }
        if (expireDuringPoi) f.advance(3600000);
        return collection([park('allowed', 3, 3), park('excluded', 1.5, 1.5), park('exclusion-boundary', 2, 1), park('inclusion-boundary', 5, 3), park('outside-inclusion', 5.2, 3)]);
    }, flags);
    const resolveScope = async () => {
        const origin = (await f.api.discoveryProvider.resolvePlace({ placeQuery: 'Origin' })).matches[0]!;
        const include = (await f.api.discoveryProvider.resolveRegion({ regionQuery: 'Include', adminLevel: 1, countryCode: 'IND' })).matches[0]!;
        const exclude = (await f.api.discoveryProvider.resolveRegion({ regionQuery: 'Exclude', adminLevel: 1, countryCode: 'IND' })).matches[0]!;
        return {
            origins: [{ placeId: origin.placeId, sourceRevision: origin.sourceRevision, radiusKm: 300, minimumDistanceKm: 0 }],
            originMode: 'all' as const, includeRegionIds: [include.regionId], excludeRegionIds: [exclude.regionId],
            regionSelections: [selectedRegion(include), selectedRegion(exclude)], regionMode: 'all' as const
        };
    };
    return { ...f, resolveScope };
}

test('selected include and exclude boundaries withhold unknown ties and keep exact candidate identity', async () => {
    const { api, urls, resolveScope } = geometryFixture({ geometryEnabled: true, geometrySourceAccepted: true });
    const scope = await resolveScope();
    const result = await api.discoveryProvider.search({ scope, limit: 10 });
    assert.deepEqual(result.candidates.map(c => c.name), ['allowed']);
    assert.deepEqual(result.queryScope, scope);
    assert.equal(result.availability.status, 'partial');
    assert.equal(result.discoveryCoverage.searchCompleteness, 'budget-limited');
    assert.equal(result.geometryEvidence!.length, 2);
    assert.deepEqual(result.geometryEvidence!.map(g => ({ regionId: g.regionId, sourceRevision: g.sourceRevision })), scope.regionSelections);
    assert.ok(result.geometryEvidence!.every(g => g.sourceVintage === 'unknown'));
    const candidate = result.candidates[0]!;
    const actual = await api.selectedPlaceResolver.resolve({ placeId: candidate.placeId, sourceRevision: candidate.sourceRevision, displayTimeZone: 'Asia/Kolkata' });
    assert.equal(actual.latitude, 3);
    assert.equal(actual.longitude, 3);
    assert.equal(urls.filter(u => u.pathname === '/v2/place-details').length, 2);
    assert.equal(urls.filter(u => u.pathname === '/v2/places').length, 1);
});

for (const flags of [{}, { geometryEnabled: true }, { geometrySourceAccepted: true }]) {
    test(`geometry requires both gates before any additional request: ${JSON.stringify(flags)}`, async () => {
        const { api, urls, resolveScope } = geometryFixture(flags);
        const scope = await resolveScope();
        const before = urls.length;
        const result = await api.discoveryProvider.search({ scope, limit: 5 });
        assert.equal(result.availability.status, 'unsupported');
        assert.deepEqual(result.queryScope, scope);
        assert.deepEqual(result.candidates, []);
        assert.equal(urls.length, before);
    });
}

test('unsupported fetched geometry never falls back to an unconstrained circle', async () => {
    const { api, urls, resolveScope } = geometryFixture({ geometryEnabled: true, geometrySourceAccepted: true }, true);
    const scope = await resolveScope();
    const result = await api.discoveryProvider.search({ scope, limit: 5 });
    assert.equal(result.availability.status, 'unsupported');
    assert.deepEqual(result.candidates, []);
    assert.deepEqual(result.queryScope, scope);
    assert.equal(urls.filter(u => u.pathname === '/v2/places').length, 0);
});

test('expired selected administrative identities require resolution before geometry or POI transport', async () => {
    const { api, urls, advance, resolveScope } = geometryFixture({ geometryEnabled: true, geometrySourceAccepted: true });
    const scope = await resolveScope();
    advance(3600000);
    const before = urls.length;
    await assert.rejects(api.discoveryProvider.search({ scope, limit: 5 }), /expired|resolve again/i);
    assert.equal(urls.length, before);
});

test('geometry that expires while candidates arrive cannot qualify a location', async () => {
    const { api, urls, resolveScope } = geometryFixture({ geometryEnabled: true, geometrySourceAccepted: true }, false, true);
    const scope = await resolveScope();
    const result = await api.discoveryProvider.search({ scope, limit: 5 });
    assert.deepEqual(result.candidates, []);
    assert.equal(result.availability.status, 'partial');
    assert.equal(result.discoveryCoverage.searchCompleteness, 'budget-limited');
    assert.equal(urls.filter(u => u.pathname === '/v2/places').length, 1);
});
