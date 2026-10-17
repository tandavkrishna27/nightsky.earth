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
    assert.equal(result.sortBasis, 'source-completeness-then-name-id');
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
