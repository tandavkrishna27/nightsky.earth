import test from 'node:test';
import assert from 'node:assert/strict';
import { ApiHttpClient, ApiProviderError } from '../../server/places/api/http';
import { geonamesResolve } from '../../server/places/api/geonames';
import { createApiServices } from '../../server/places/api/configuration';

const now = () => Date.parse('2026-10-17T00:00:00.000Z');
const populatedPlace = { geonameId: 2643743, name: 'London', lat: '51.50853', lng: '-0.12574', fcl: 'P', fcode: 'PPLC' };
const configuration = { geonamesUsername: 'fixture', userAgent: 'NightSky fixture (contact@example.com)', now };
const invalidResponse = (error: unknown) => error instanceof ApiProviderError && error.status === 'invalid-response';

test('named-point lookup sends one populated-place search with its existing five-row envelope', async () => {
    const requests: URL[] = [];
    const http = new ApiHttpClient({ ...configuration, fetcher: async input => {
        requests.push(new URL(String(input)));
        return Response.json({ totalResultsCount: 1, geonames: [populatedPlace] });
    } });
    const result = await geonamesResolve(http, 'London, United Kingdom', now);
    assert.equal(requests.length, 1);
    assert.equal(requests[0]!.origin, 'https://secure.geonames.org');
    assert.equal(requests[0]!.pathname, '/searchJSON');
    assert.deepEqual(Object.fromEntries(requests[0]!.searchParams), {
        q: 'London, United Kingdom', maxRows: '5', style: 'FULL', startRow: '0', featureClass: 'P', username: 'fixture'
    });
    assert.equal(result.length, 1);
    assert.equal(result[0]!.latitude, 51.50853);
    assert.equal(result[0]!.longitude, -0.12574);
    assert.deepEqual(result[0]!.timeZoneEvidence, { status: 'unknown' });
    assert.equal(result[0]!.expiresAt, '2026-10-17T01:00:00.000Z');
});

test('explicit administrative or contradictory feature metadata never yields a usable observing point', async t => {
    const cases = [
        { fcl: 'A', fcode: 'PCLI' },
        { fcl: 'A', fcode: 'ADM1' },
        { fcl: 'L', fcode: 'PRK' },
        { fcl: 'P', fcode: 'PCLI' },
        { fcl: 'P', fcode: 'ADM1' },
        { fcl: 'P', fcode: 'MT' },
        { fcl: undefined, fcode: 'PCLI' },
        { fcl: 'A', fcode: undefined },
        { fcl: null, fcode: 'PPL' },
        { fcl: 'P', fcode: null },
        { fcl: 'P', fcode: 'UNKNOWN' }
    ];
    for (const metadata of cases) await t.test(JSON.stringify(metadata), async () => {
        let calls = 0;
        const services = createApiServices({ ...configuration, fetcher: async () => {
            calls++;
            return Response.json({ geonames: [{ ...populatedPlace, ...metadata }] });
        } });
        const result = await services.discoveryProvider.resolvePlace({ placeQuery: 'London' });
        assert.deepEqual(result.matches, []);
        assert.equal(result.selectionRequired, false);
        assert.equal(result.availability.status, 'unavailable');
        assert.deepEqual(result.sourceAttempts, [
            { providerId: 'geoapify', status: 'not-configured' },
            { providerId: 'geonames', status: 'invalid-response' }
        ]);
        assert.equal(calls, 1);
    });
});

test('missing feature metadata remains compatible only with the populated-place request', async () => {
    const { fcl: _fcl, fcode: _fcode, ...legacyRow } = populatedPlace;
    let requestedClass: string | null = null;
    const http = new ApiHttpClient({ ...configuration, fetcher: async input => {
        requestedClass = new URL(String(input)).searchParams.get('featureClass');
        return Response.json({ geonames: [legacyRow, { ...legacyRow, geonameId: 2, fcode: 'PPL' }] });
    } });
    const result = await geonamesResolve(http, 'London', now);
    assert.equal(requestedClass, 'P');
    assert.equal(result.length, 2);
    assert.ok(result.every(record => record.timeZoneEvidence.status === 'unknown'));
});

test('a mixed populated-place and administrative response rejects the entire point result', async () => {
    const http = new ApiHttpClient({ ...configuration, fetcher: async () => Response.json({
        geonames: [populatedPlace, { ...populatedPlace, geonameId: 2, fcl: 'A', fcode: 'ADM1' }]
    }) });
    await assert.rejects(() => geonamesResolve(http, 'London', now), invalidResponse);
});

test('malformed coordinates and unsupported transport errors retain their existing handling', async () => {
    const malformed = new ApiHttpClient({ ...configuration, fetcher: async () => Response.json({
        geonames: [{ ...populatedPlace, lat: '912' }]
    }) });
    await assert.rejects(() => geonamesResolve(malformed, 'London', now), invalidResponse);
    const unsupported = new ApiHttpClient({ ...configuration, fetcher: async () => { throw Error('must not fetch'); } });
    unsupported.json = async () => { throw new ApiProviderError('unsupported-query'); };
    await assert.rejects(() => geonamesResolve(unsupported, 'London', now),
        (error: unknown) => error instanceof ApiProviderError && error.status === 'unsupported-query');
});
