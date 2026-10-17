import test from 'node:test';
import assert from 'node:assert/strict';
import { createApiServices } from '../../server/places/api/configuration';
const now = () => Date.parse('2026-10-17T00:00:00.000Z');
const config = {
    geonamesUsername: 'fixture', geoapifyApiKey: 'fixture', userAgent: 'NightSky fixture (contact@example.com)', now
};
test('ambiguous names and duplicate identity remain bounded', async () => {
    const s = createApiServices({
        ...config, fetcher: async () => new Response(JSON.stringify({
            geonames: [{
                    geonameId: 1, name: 'One', lat: '12', lng: '77'
                }, {
                    geonameId: 2, name: 'Two', lat: '13', lng: '78'
                }, {
                    geonameId: 1, name: 'One', lat: '12', lng: '77'
                }]
        }))
    });
    const r = await s.discoveryProvider.resolvePlace({
        placeQuery: 'Town'
    });
    assert.equal(r.matches.length, 2);
    assert.equal(r.selectionRequired, true);
    assert.ok(r.matches[0]?.sourceRevision);
});
test('unsupported administrative exclusion never falls through to radius search', async () => {
    let calls = 0;
    const s = createApiServices({
        ...config, fetcher: async () => {
            calls++;
            throw Error('unexpected');
        }
    });
    const r = await s.discoveryProvider.search({
        scope: {
            origins: [], includeRegionIds: ['region:v1:test'], excludeRegionIds: ['region:v1:other'], originMode: 'any', regionMode: 'any'
        }, limit: 5
    });
    assert.equal(r.availability.status, 'unsupported');
    assert.equal(calls, 0);
});
test('missing credentials return honest unavailable without fetching', async () => {
    const s = createApiServices({
        userAgent: config.userAgent, now, fetcher: async () => {
            throw Error('unexpected');
        }
    });
    assert.equal((await s.discoveryProvider.resolvePlace({
        placeQuery: 'Town'
    })).availability.status, 'unavailable');
});
test('malformed coordinates cannot become a selected point', async () => {
    const s = createApiServices({
        ...config, geoapifyApiKey: undefined, fetcher: async () => new Response(JSON.stringify({
            geonames: [{
                    geonameId: 1, name: 'One', lat: '912', lng: '77'
                }]
        }))
    });
    assert.equal((await s.discoveryProvider.resolvePlace({
        placeQuery: 'Town'
    })).matches.length, 0);
});
test('country region uses its own provider place filter without a centroid', async () => {
    let now = Date.parse('2026-10-17T00:00:00Z');
    const urls: string[] = [];
    const s = createApiServices({
        ...config, now: () => now, fetcher: async (url) => {
            urls.push(String(url));
            return new Response(JSON.stringify(String(url).includes('/geocode/') ? {
                features: [{
                        properties: {
                            place_id: 'country-1', name: 'India', result_type: 'country', country_code: 'in'
                        }, geometry: {
                            type: 'Point', coordinates: [78, 22]
                        }
                    }]
            } : {
                features: [{
                        properties: {
                            place_id: 'site-1', name: 'Park', categories: ['leisure.park']
                        }, geometry: {
                            type: 'Point', coordinates: [73, 18]
                        }
                    }]
            }));
        }
    });
    const region = await s.discoveryProvider.resolveRegion({
        regionQuery: 'India', countryCode: 'IND', adminLevel: 0
    });
    assert.equal(region.matches.length, 1);
    const selected = region.matches[0]!;
    now += 1000;
    const result = await s.discoveryProvider.search({
        scope: {
            origins: [], originMode: 'any', includeRegionIds: [selected.regionId], excludeRegionIds: [], regionSelections: [{
                    regionId: selected.regionId, sourceRevision: selected.sourceRevision!
                }], regionMode: 'any'
        }, limit: 5
    });
    assert.equal(result.candidates.length, 1);
    assert.match(urls[1]!, /filter=place%3Acountry-1/);
    assert.equal(result.candidates[0]?.distanceKm, undefined);
    assert.equal(result.sortBasis, 'name-then-id');
});
test('conflicting duplicate upstream identity invalidates the response', async () => {
    const s = createApiServices({
        ...config, geoapifyApiKey: undefined, fetcher: async () => new Response(JSON.stringify({
            geonames: [{
                    geonameId: 1, name: 'Town', lat: '12', lng: '77'
                }, {
                    geonameId: 1, name: 'Town', lat: '13', lng: '77'
                }]
        }))
    });
    const r = await s.discoveryProvider.resolvePlace({
        placeQuery: 'Town'
    });
    assert.equal(r.availability.status, 'unavailable');
    assert.equal(r.matches.length, 0);
    assert.ok(r.caveats.some(c => c.includes('invalid-response')));
});
test('429 fallback keeps credentials out of text and raw error bodies', async () => {
    const s = createApiServices({
        ...config, fetcher: async (url) => String(url).includes('geonames') ? new Response('fixture secret key', {
            status: 429, headers: {
                'Retry-After': '60'
            }
        }) : new Response(JSON.stringify({
            features: [{
                    properties: {
                        place_id: 'fallback-1', name: 'Town'
                    }, geometry: {
                        type: 'Point', coordinates: [77, 12]
                    }
                }]
        }))
    });
    const r = await s.discoveryProvider.resolvePlace({
        placeQuery: 'Town'
    });
    assert.equal(r.matches.length, 1);
    assert.ok(r.caveats.some(c => c.includes('quota-exhausted')));
    assert.doesNotMatch(JSON.stringify(r), /fixture secret key|apiKey|username/);
});
test('oversized and HTTP200 error bodies are unavailable rather than clean emptiness', async () => {
    for (const body of ['x'.repeat(262145), JSON.stringify({
            status: {
                value: 18, message: 'credits exhausted'
            }
        })]) {
        const s = createApiServices({
            ...config, geoapifyApiKey: undefined, fetcher: async () => new Response(body)
        });
        const r = await s.discoveryProvider.resolvePlace({
            placeQuery: 'Town'
        });
        assert.equal(r.availability.status, 'unavailable');
        assert.equal(r.matches.length, 0);
    }
});
test('bounded valid empty result is distinct from unavailable', async () => {
    let calls = 0;
    const s = createApiServices({
        ...config, geoapifyApiKey: undefined, fetcher: async () => {
            calls++;
            return new Response(JSON.stringify({
                geonames: []
            }));
        }
    });
    assert.equal((await s.discoveryProvider.resolvePlace({
        placeQuery: 'Absent town'
    })).availability.status, 'not-covered');
    await s.discoveryProvider.resolvePlace({
        placeQuery: 'Absent town'
    });
    assert.equal(calls, 1);
});
test('unknown categories cannot satisfy other and a full filtered page stays budget limited', async () => {
    let now = Date.parse('2026-10-17T00:00:00Z');
    const s = createApiServices({
        ...config, now: () => now, fetcher: async (url) => new Response(JSON.stringify(String(url).includes('geonames') ? {
            geonames: [{
                    geonameId: 1, name: 'Town', lat: '12', lng: '77'
                }]
        } : {
            features: Array.from({
                length: 20
            }, (_, i) => ({
                properties: {
                    place_id: `shop-${i}`, name: 'Shop', categories: ['commercial.supermarket']
                }, geometry: {
                    type: 'Point', coordinates: [77, 12]
                }
            }))
        }))
    });
    const resolved = await s.discoveryProvider.resolvePlace({
        placeQuery: 'Town'
    });
    const selected = resolved.matches[0]!;
    const r = await s.discoveryProvider.search({
        placeId: selected.placeId, sourceRevision: selected.sourceRevision, categories: ['other'], limit: 10
    });
    assert.equal(r.candidates.length, 0);
    assert.equal(r.discoveryCoverage.searchCompleteness, 'budget-limited');
});
test('multi-origin any preserves every band after bounded queued requests', async () => {
    let calls = 0;
    const s = createApiServices({
        ...config, fetcher: async (url) => {
            calls++;
            return new Response(JSON.stringify(String(url).includes('geonames') ? {
                geonames: [{
                        geonameId: 1, name: 'A', lat: '12', lng: '77'
                    }, {
                        geonameId: 2, name: 'B', lat: '13', lng: '77'
                    }]
            } : {
                features: [{
                        properties: {
                            place_id: String(url).includes('77%2C13') ? 'second' : 'first', name: 'Park', categories: ['leisure.park']
                        }, geometry: {
                            type: 'Point', coordinates: [77, String(url).includes('77%2C13') ? 13 : 12]
                        }
                    }]
            }));
        }
    });
    const r = await s.discoveryProvider.resolvePlace({
        placeQuery: 'Town'
    });
    const result = await s.discoveryProvider.search({
        scope: {
            origins: r.matches.map(m => ({
                placeId: m.placeId, sourceRevision: m.sourceRevision, radiusKm: 10, minimumDistanceKm: 0
            })), includeRegionIds: [], excludeRegionIds: [], originMode: 'any', regionMode: 'any'
        }, limit: 10
    });
    assert.equal(calls, 3);
    assert.equal(result.candidates.length, 2);
    assert.equal(result.candidates[0]?.originDistances?.length, 2);
});
test('returned point timezone evidence survives without using a nearby city', async () => {
    const s = createApiServices({
        ...config, geonamesUsername: undefined, fetcher: async () => new Response(JSON.stringify({
            features: [{
                    properties: {
                        place_id: 'zoned-1', name: 'Point', timezone: {
                            name: 'Asia/Kolkata'
                        }
                    }, geometry: {
                        type: 'Point', coordinates: [77, 12]
                    }
                }]
        }))
    });
    const result = await s.discoveryProvider.resolvePlace({
        placeQuery: 'Point'
    });
    const ref = result.matches[0]!;
    const point = await s.selectedPlaceResolver.resolve({
        placeId: ref.placeId, sourceRevision: ref.sourceRevision
    });
    assert.equal(point.displayTimeZone, 'Asia/Kolkata');
    assert.equal(point.timeZoneBasis, 'api-source');
    assert.equal(point.timeZoneEvidence?.status, 'verified');
});
test('dedicated credentials and control characters are validated without leaking the value', () => {
    for (const credential of ['demo', 'bad\u0000secret'])
        assert.throws(() => createApiServices({
            ...config, geonamesUsername: credential
        }), error => !String(error).includes(credential));
});
test('origin-all uses one circle and applies every minimum/maximum band including dateline', async () => {
    let calls = 0;
    const s = createApiServices({
        ...config, fetcher: async (url) => {
            calls++;
            return new Response(JSON.stringify(String(url).includes('geonames') ? {
                geonames: [{
                        geonameId: 1, name: 'West side', lat: '80', lng: '179.9'
                    }, {
                        geonameId: 2, name: 'East side', lat: '80', lng: '-179.9'
                    }]
            } : {
                features: [{
                        properties: {
                            place_id: 'polar-park', name: 'Polar park', categories: ['leisure.park']
                        }, geometry: {
                            type: 'Point', coordinates: [180, 80]
                        }
                    }]
            }));
        }
    });
    const r = await s.discoveryProvider.resolvePlace({
        placeQuery: 'Polar towns'
    });
    const result = await s.discoveryProvider.search({
        scope: {
            origins: r.matches.map(m => ({
                placeId: m.placeId, sourceRevision: m.sourceRevision, radiusKm: 10, minimumDistanceKm: 1
            })), includeRegionIds: [], excludeRegionIds: [], originMode: 'all', regionMode: 'any'
        }, limit: 10
    });
    assert.equal(calls, 2);
    assert.equal(result.candidates.length, 1);
    assert.equal(result.sortBasis, 'maximum-distance');
    assert.ok(result.candidates[0]!.originDistances!.every(d => d.distanceKm >= 1 && d.distanceKm < 10));
});
test('request timeout is bounded even when an injected fetch ignores abort', async () => {
    const s = createApiServices({
        ...config, geoapifyApiKey: undefined, fetcher: async () => new Promise<Response>(() => {
        })
    });
    const before = Date.now();
    const r = await s.discoveryProvider.resolvePlace({
        placeQuery: 'Town'
    });
    assert.equal(r.availability.status, 'unavailable');
    assert.ok(r.sourceAttempts?.some(a => a.status === 'timeout'));
    assert.ok(Date.now() - before < 6500);
});
test('shared flights cap subscribers and honor each caller deadline', async () => {
    const { ApiHttpClient, ApiProviderError } = await import('../../server/places/api/http');
    let release!: (value: Response) => void;
    let calls = 0;
    const client = new ApiHttpClient({
        ...config, fetcher: async () => {
            calls++;
            return new Promise<Response>(resolve => {
                release = resolve;
            });
        }
    });
    const first = client.json('geonames', '/searchJSON', {
        q: 'Town', maxRows: '5'
    });
    await new Promise(resolve => setTimeout(resolve, 1));
    const short = client.json('geonames', '/searchJSON', {
        q: 'Town', maxRows: '5'
    }, Date.now() + 5);
    const followers = Array.from({
        length: 6
    }, () => client.json('geonames', '/searchJSON', {
        q: 'Town', maxRows: '5'
    }));
    await assert.rejects(client.json('geonames', '/searchJSON', {
        q: 'Town', maxRows: '5'
    }), error => error instanceof ApiProviderError && error.status === 'quota-exhausted');
    await assert.rejects(short, error => error instanceof ApiProviderError && error.status === 'timeout');
    release(new Response(JSON.stringify({
        geonames: []
    })));
    await Promise.all([first, ...followers]);
    assert.equal(calls, 1);
});
test('conflicts outside category and timezone differences cannot retain a selected identity', async () => {
    for (const changed of [{
            categories: ['commercial.supermarket'], coordinates: [78, 13]
        }, {
            categories: ['leisure.park'], coordinates: [77, 12], timezone: {
                name: 'Europe/London'
            }
        }]) {
        const s = createApiServices({
            ...config, fetcher: async (url) => new Response(JSON.stringify(String(url).includes('geonames') ? {
                geonames: [{
                        geonameId: 1, name: 'Town', lat: '12', lng: '77'
                    }]
            } : {
                features: [{
                        properties: {
                            place_id: 'conflict', name: 'Park', categories: ['leisure.park'], timezone: {
                                name: 'Asia/Kolkata'
                            }
                        }, geometry: {
                            type: 'Point', coordinates: [77, 12]
                        }
                    }, {
                        properties: {
                            place_id: 'conflict', name: 'Park', categories: changed.categories, timezone: changed.timezone ?? {
                                name: 'Asia/Kolkata'
                            }
                        }, geometry: {
                            type: 'Point', coordinates: changed.coordinates
                        }
                    }]
            }))
        });
        const r = await s.discoveryProvider.resolvePlace({
            placeQuery: 'Town'
        });
        const ref = r.matches[0]!;
        const found = await s.discoveryProvider.search({
            placeId: ref.placeId, sourceRevision: ref.sourceRevision, categories: ['park'], limit: 5
        });
        assert.equal(found.candidates.length, 0);
        assert.ok(found.sourceAttempts?.some(a => a.status === 'invalid-response'));
    }
});
test('API text preserves separate same-URL credits and license links', async () => {
    const { apiAttributionText } = await import('../../server/places/api/attribution');
    const text = apiAttributionText('Result', [{
            name: 'Provider', url: 'https://example.com/', attribution: 'Required first credit', licenseUrl: 'https://example.com/license', dataClass: 'context'
        }, {
            name: 'Datasource', url: 'https://example.com/', attribution: 'Required second credit', dataClass: 'context'
        }]);
    assert.match(text, /Required first credit/);
    assert.match(text, /Required second credit/);
    assert.match(text, /https:\/\/example.com\/license/);
});

// Dropping guards or loosening union identity checks would violate these fixture cases.
test('each unsupported administrative combination preserves scope and makes zero calls', async () => {
    const scopes = [
        { origins: [], includeRegionIds: ['region:v1:a', 'region:v1:b'], excludeRegionIds: [], originMode: 'any' as const, regionMode: 'all' as const },
        { origins: [{ placeId: 'place:v1:town', radiusKm: 50, minimumDistanceKm: 2 }], includeRegionIds: ['region:v1:a'], excludeRegionIds: [], originMode: 'all' as const, regionMode: 'any' as const },
        { origins: [], includeRegionIds: ['region:v1:a'], excludeRegionIds: ['region:v1:a'], originMode: 'any' as const, regionMode: 'any' as const }
    ];
    for (const scope of scopes) {
        let calls = 0;
        const s = createApiServices({ ...config, fetcher: async () => { calls++; throw Error('unexpected'); } });
        const result = await s.discoveryProvider.search({ scope, limit: 5 });
        assert.equal(result.availability.status, 'unsupported');
        assert.deepEqual(result.queryScope, scope);
        assert.deepEqual(result.candidates, []);
        assert.equal(calls, 0);
    }
});

const fixtureFeature = (id: string, category = 'leisure.park', longitude = 77) => ({
    properties: { place_id: id, name: id, categories: [category] },
    geometry: { type: 'Point', coordinates: [longitude, 12] }
});
async function regionFixture(pages: (filter: string) => Response) {
    const urls: URL[] = [];
    const s = createApiServices({ ...config, fetcher: async (url) => {
        const parsed = new URL(String(url)); urls.push(parsed);
        return parsed.pathname.includes('/geocode/') ? new Response(JSON.stringify({ features: ['a', 'b'].map(id => ({
            ...fixtureFeature(id), properties: { place_id: id, name: id, result_type: 'state', country_code: 'in' }
        })) })) : pages(parsed.searchParams.get('filter')!);
    } });
    const resolved = await s.discoveryProvider.resolveRegion({ regionQuery: 'States', countryCode: 'IND', adminLevel: 1 });
    assert.equal(resolved.matches.length, 2);
    return { s, urls, regions: resolved.matches };
}
test('state filter and single-region all use the exact selected boundary identity', async () => {
    const { s, urls, regions } = await regionFixture(() => new Response(JSON.stringify({ features: [fixtureFeature('site')] })));
    const region = regions[0]!;
    const scope = { origins: [], originMode: 'any' as const, includeRegionIds: [region.regionId], excludeRegionIds: [], regionSelections: [{ regionId: region.regionId, sourceRevision: region.sourceRevision! }], regionMode: 'all' as const };
    const result = await s.discoveryProvider.search({ scope, limit: 5 });
    assert.equal(urls[0]!.searchParams.get('type'), 'state');
    assert.equal(urls[1]!.searchParams.get('filter'), 'place:a');
    assert.deepEqual(result.queryScope, scope);
    assert.equal(result.candidates.length, 1);
    assert.equal(result.candidates[0]!.distanceKm, undefined);
});
test('region union deduplicates matching identities and rejects conflicting identities across pages', async () => {
    for (const conflict of [false, true]) {
        const { s, regions } = await regionFixture(filter => new Response(JSON.stringify({ features: [fixtureFeature('shared', 'leisure.park', conflict && filter === 'place:b' ? 78 : 77), fixtureFeature(filter)] })));
        const result = await s.discoveryProvider.search({ scope: { includeRegionIds: regions.map(r => r.regionId), regionSelections: regions.map(r => ({ regionId: r.regionId, sourceRevision: r.sourceRevision! })) }, limit: 10 });
        assert.equal(result.candidates.length, conflict ? 2 : 3);
        assert.equal(result.candidates.filter(c => c.name === 'shared').length, conflict ? 0 : 1);
        assert.equal(result.availability.status, conflict ? 'partial' : 'available');
    }
});
test('region union preserves successful candidates when another page fails or fills its budget', async () => {
    for (const failure of [false, true]) {
        const { s, regions } = await regionFixture(filter => filter === 'place:b' && failure ? new Response('{}', { status: 503 }) : new Response(JSON.stringify({ features: filter === 'place:a' ? Array.from({ length: 20 }, (_, i) => fixtureFeature(`shop-${i}`, 'commercial.supermarket')) : [fixtureFeature('site')] })));
        const result = await s.discoveryProvider.search({ scope: { includeRegionIds: regions.map(r => r.regionId), regionSelections: regions.map(r => ({ regionId: r.regionId, sourceRevision: r.sourceRevision! })) }, limit: 10 });
        assert.equal(result.candidates.length, failure ? 0 : 1);
        assert.equal(result.discoveryCoverage.searchCompleteness, 'budget-limited');
        assert.equal(result.availability.status, failure ? 'partial' : 'available');
        assert.equal(result.sourceAttempts!.length, 2);
    }
});
test('each of six category complements applies the full precedence and excludes unknown tags', async () => {
    const { CATEGORY_MAP } = await import('../../server/places/api/geoapify');
    const categories = Object.keys(CATEGORY_MAP) as Array<keyof typeof CATEGORY_MAP>;
    for (const excluded of categories) {
        const s = createApiServices({ ...config, fetcher: async url => new Response(JSON.stringify(String(url).includes('geonames') ? { geonames: [{ geonameId: 1, name: 'Town', lat: '12', lng: '77' }] } : { features: [...categories.map(c => fixtureFeature(c, CATEGORY_MAP[c][0]!)), fixtureFeature('unknown', 'unknown'), { ...fixtureFeature('overlap'), properties: { place_id: 'overlap', name: 'overlap', categories: ['leisure.park', 'natural.protected_area'] } }] })) });
        const ref = (await s.discoveryProvider.resolvePlace({ placeQuery: 'Town' })).matches[0]!;
        const result = await s.discoveryProvider.search({ placeId: ref.placeId, sourceRevision: ref.sourceRevision, categories: categories.filter(c => c !== excluded), limit: 10 });
        assert.deepEqual(result.candidates.filter(c => c.name !== 'overlap').map(c => c.category).sort(), categories.filter(c => c !== excluded).sort());
        assert.equal(result.candidates.some(c => c.name === 'overlap'), excluded !== 'protected-area');
        assert.ok(result.candidates.filter(c => c.name === 'overlap').every(c => c.category === 'protected-area'));
    }
});
test('five origins issue five bounded circles and six origins fail before fetching', async () => {
    let calls = 0;
    const s = createApiServices({ ...config, fetcher: async url => { calls++; return new Response(JSON.stringify(String(url).includes('geonames') ? { geonames: Array.from({ length: 5 }, (_, i) => ({ geonameId: i + 1, name: `Town ${i}`, lat: '12', lng: String(77 + i / 100) })) } : { features: [fixtureFeature('same-site')] })); } });
    const matches = (await s.discoveryProvider.resolvePlace({ placeQuery: 'Towns' })).matches;
    const origins = matches.map(m => ({ placeId: m.placeId, sourceRevision: m.sourceRevision, radiusKm: 10, minimumDistanceKm: 0 }));
    const result = await s.discoveryProvider.search({ scope: { origins }, limit: 10 });
    // Identical circles are coalesced by the bounded response cache.
    assert.equal(calls, 6);
    assert.equal(result.sourceAttempts!.length, 5);
    assert.equal(result.candidates[0]!.originDistances!.length, 5);
    await assert.rejects(s.discoveryProvider.search({ scope: { origins: [...origins, origins[0]!] }, limit: 10 }));
    assert.equal(calls, 6);
});


test('missing and invalid source zones require explicit display choice at the exact site', async () => {
    for (const zone of [undefined, 'Invalid/Zone']) {
        const s = createApiServices({ ...config, geonamesUsername: undefined, fetcher: async () => new Response(JSON.stringify({ features: [{ ...fixtureFeature('site'), properties: { place_id: 'site', name: 'Site', ...(zone ? { timezone: { name: zone } } : {}) } }] })) });
        const ref = (await s.discoveryProvider.resolvePlace({ placeQuery: 'Site' })).matches[0]!;
        assert.equal(ref.timeZoneEvidence?.status, 'unknown');
        await assert.rejects(s.selectedPlaceResolver.resolve({ placeId: ref.placeId, sourceRevision: ref.sourceRevision }), /display time zone/i);
        const point = await s.selectedPlaceResolver.resolve({ placeId: ref.placeId, sourceRevision: ref.sourceRevision, displayTimeZone: 'America/Chicago' });
        assert.equal(point.timeZoneBasis, 'explicit-display');
        assert.equal(point.timeZoneEvidence?.status, 'unknown');
        assert.equal(point.latitude, 12);
        assert.equal(point.longitude, 77);
    }
});
