import test from 'node:test';
import assert from 'node:assert/strict';
import { createApiServices } from '../../server/places/api/configuration';
import { ApiHttpClient } from '../../server/places/api/http';

const feature = (id: string, code: string, kind: string) => ({ type: 'Feature',
    properties: { place_id: id, name: id, country_code: code, result_type: kind },
    geometry: { type: 'Point', coordinates: [12, 41] } });

test('country and state requests use one structured query with the selected country restriction', async () => {
    for (const [input, expected] of [
        [{ regionQuery: 'Vatican City', countryCode: 'VAT', adminLevel: 0 },
            { country: 'Vatican City', type: 'country', filter: 'countrycode:va', bias: 'countrycode:none', limit: '5', format: 'geojson' }],
        [{ regionQuery: 'Victoria', countryCode: 'AUS', adminLevel: 1 },
            { state: 'Victoria', type: 'state', filter: 'countrycode:au', bias: 'countrycode:none', limit: '5', format: 'geojson' }],
        [{ regionQuery: 'Yorkshire', countryCode: 'GBR' },
            { text: 'Yorkshire', filter: 'countrycode:gb', bias: 'countrycode:none', limit: '5', format: 'geojson' }],
    ] as const) {
        const requests: URL[] = [];
        const service = createApiServices({ userAgent: 'offline fixture', geoapifyApiKey: 'fixture',
            fetcher: async url => { requests.push(new URL(String(url))); return Response.json({ type: 'FeatureCollection', features: [] }); } });
        await service.discoveryProvider.resolveRegion(input);
        assert.equal(requests.length, 1);
        const actual = Object.fromEntries(requests[0]!.searchParams); delete actual.apiKey;
        assert.deepEqual(actual, expected);
    }
});

test('region selection keeps ambiguity and rejects a wrong country or administrative level without fallback', async () => {
    let calls = 0;
    const service = createApiServices({ userAgent: 'offline fixture', geoapifyApiKey: 'fixture', fetcher: async () => {
        calls++; return Response.json({ type: 'FeatureCollection', features: [
            feature('state-one', 'au', 'state'), feature('state-two', 'au', 'state'),
            feature('wrong-country', 'ca', 'state'), feature('wrong-type', 'au', 'country'),
        ] });
    } });
    const result = await service.discoveryProvider.resolveRegion({ regionQuery: 'Victoria', countryCode: 'AUS', adminLevel: 1 });
    assert.equal(calls, 1);
    assert.deepEqual(result.matches.map(row => row.name), ['state-one', 'state-two']);
    assert.equal(result.selectionRequired, true);
});

test('unknown country restrictions and mixed text/structured queries never dispatch unconstrained searches', async () => {
    let calls = 0;
    const config = { userAgent: 'offline fixture', geoapifyApiKey: 'fixture', fetcher: async () => { calls++; return Response.json({ features: [] }); } };
    const result = await createApiServices(config).discoveryProvider.resolveRegion({ regionQuery: 'Some state', countryCode: 'ZZZ', adminLevel: 1 });
    assert.equal(result.availability.status, 'unavailable');
    assert.equal(calls, 0);
    await assert.rejects(new ApiHttpClient(config).json('geoapify', '/v1/geocode/search', { text: 'Town', country: 'Country', format: 'geojson' }), /unsupported-query/);
    assert.equal(calls, 0);
});

test('administrative records without usable country identity cannot become point selections', async () => {
    for (const properties of [
        { result_type: 'country' }, { result_type: 'state', country_code: 'zz' },
    ]) {
        let calls = 0;
        const service = createApiServices({ userAgent: 'offline fixture', geoapifyApiKey: 'fixture', fetcher: async () => {
            calls++;return Response.json({ type: 'FeatureCollection', features: [{ ...feature('admin-center', 'in', 'country'),
                properties: { place_id: 'admin-center', name: 'Administrative area', ...properties } }] });
        } });
        const result = await service.discoveryProvider.resolvePlace({ placeQuery: 'Administrative area' });
        assert.equal(result.matches.length, 0);
        assert.equal(result.availability.status, 'unavailable');
        assert.equal(result.sourceAttempts?.find(row => row.providerId === 'geoapify')?.status, 'invalid-response');
        assert.equal(calls, 1);
    }
});
