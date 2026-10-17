import test from 'node:test';
import assert from 'node:assert/strict';
import type { McpServer } from '@modelcontextprotocol/server';
import { registerNightSkyTools } from '../../server/mcp/registerTools';
import { createApiServices } from '../../server/places/api/configuration';
const window = {
    startUtc: '2026-10-18T14:00:00Z', endUtc: '2026-10-18T22:00:00Z', timeZone: 'Asia/Kolkata'
};
test('API resolve search details plan compare uses actual selected point without local files', async () => {
    let now = Date.parse('2026-10-17T00:00:00Z');
    const observed: Array<{
        latitude: number;
        longitude: number;
    }> = [];
    const api = createApiServices({
        geonamesUsername: 'fixture', geoapifyApiKey: 'fixture', userAgent: 'NightSky fixture (contact@example.com)', now: () => now, fetcher: async (url) => new Response(JSON.stringify(String(url).includes('geonames') ? {
            geonames: [{
                    geonameId: 1, name: 'Town', lat: '18', lng: '73'
                }, {
                    geonameId: 2, name: 'Other town', lat: '20', lng: '74'
                }]
        } : {
            features: [{
                    properties: {
                        place_id: 'park-1', name: 'Selected park', categories: ['leisure.park']
                    }, geometry: {
                        type: 'Point', coordinates: [73.01, 18.01]
                    }
                }]
        }))
    });
    let auroraPoint: {
        latitude: number;
        longitude: number;
    } | undefined;
    const tools = new Map<string, any>();
    registerNightSkyTools({
        registerTool(name: string, config: any, handler: any) {
            tools.set(name, {
                config, handler
            });
        }
    } as unknown as McpServer, {
        ...api, auroraProvider: async (point, requestedWindow) => {
            auroraPoint = point;
            return {
                placeId: point.placeId, window: requestedWindow, availability: {
                    status: 'unavailable', reason: 'Fixture no aurora'
                }, outlook: {
                    status: 'unavailable', reason: 'Fixture no aurora'
                }, latitudeBand: 'mid-latitude', sources: [{
                        name: 'NOAA fixture', url: 'https://www.swpc.noaa.gov/', attribution: 'Offline fixture, no service call', dataClass: 'forecast'
                    }], caveats: []
            };
        }, placeIndexLoader: async () => {
            throw Error('Local GeoNames must not load');
        }, weatherProvider: {
            async getForecast(point) {
                observed.push(point);
                return {
                    status: 'unavailable', reason: 'Fixture no forecast'
                };
            }
        }
    });
    const invoke = async (name: string, value: any) => {
        const tool = tools.get(name);
        const result = await tool.handler(tool.config.inputSchema.parse(value), {
            mcpReq: {
                _meta: {}
            }
        });
        tool.config.outputSchema.parse(result.structuredContent);
        return result.structuredContent;
    };
    const resolved = await invoke('resolve_place', {
        placeQuery: 'Town'
    });
    assert.equal(resolved.selectionRequired, true);
    const origin = resolved.matches[0];
    const search = await invoke('search_observing_locations', {
        placeId: origin.placeId, sourceRevision: origin.sourceRevision, radiusKm: 50
    });
    const selected = search.candidates[0];
    assert.ok(selected.sourceRevision);
    const ref = {
        placeId: selected.placeId, sourceRevision: selected.sourceRevision
    };
    await invoke('get_observing_location_details', ref);
    await assert.rejects(invoke('plan_observing_session', {
        ...ref, activity: 'general-stargazing', window
    }), /display time zone/i);
    assert.equal(observed.length, 0);
    const plan = await invoke('plan_observing_session', {
        ...ref, displayTimeZone: 'Asia/Kolkata', activity: 'general-stargazing', window
    });
    assert.equal(plan.place.sourceRevision, ref.sourceRevision);
    assert.ok(plan.gaps.some((s: string) => /histor|climat/i.test(s)));
    assert.deepEqual(observed[0], {
        placeId: ref.placeId, latitude: 18.01, longitude: 73.01
    });
    const astronomy = await invoke('get_astronomy_window', {
        ...ref, displayTimeZone: 'Asia/Kolkata', window
    });
    assert.equal(astronomy.sourceRevision, ref.sourceRevision);
    const target = await invoke('get_target_visibility', {
        ...ref, displayTimeZone: 'Asia/Kolkata', window, targetQuery: 'unsupported fixture object'
    });
    assert.equal(target.sourceRevision, ref.sourceRevision);
    const events = await invoke('search_sky_events', {
        ...ref, displayTimeZone: 'Asia/Kolkata', window, eventTypes: ['moon-phase']
    });
    assert.equal(events.sourceRevision, ref.sourceRevision);
    const aurora = await invoke('get_aurora_outlook', {
        ...ref, displayTimeZone: 'Asia/Kolkata', window
    });
    assert.equal(aurora.sourceRevision, ref.sourceRevision);
    assert.equal(auroraPoint?.latitude, 18.01);
    assert.equal(auroraPoint?.longitude, 73.01);
    const climate = await invoke('get_clear_sky_climatology', {
        ...ref, displayTimeZone: 'Asia/Kolkata', month: 10
    });
    assert.equal(climate.sourceRevision, ref.sourceRevision);
    assert.equal(climate.availability.status, 'not-covered');
    const compared = await invoke('compare_observing_options', {
        options: [{
                ...ref, displayTimeZone: 'Asia/Kolkata', activity: 'general-stargazing', window
            }, {
                ...ref, displayTimeZone: 'Asia/Kolkata', activity: 'visual-stargazing', window
            }]
    });
    assert.equal(compared.comparisons[0].sourceRevision, ref.sourceRevision);
    now += 3600000;
    const before = observed.length;
    await assert.rejects(invoke('get_night_conditions', {
        ...ref, displayTimeZone: 'Asia/Kolkata', window
    }), /Resolve again/);
    assert.equal(observed.length, before);
});
