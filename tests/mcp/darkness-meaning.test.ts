import assert from 'node:assert/strict';
import test from 'node:test';
import { once } from 'node:events';
import { createServer } from 'node:http';
import express from 'express';
import { mountMcpRoute } from '../../server/mcp/route';
import { GeoNamesPlaceIndex } from '../../server/places/geonames';

const index = new GeoNamesPlaceIndex([
  { geonameId: 1, name: 'Hanle', asciiName: 'Hanle', alternateNames: '', latitude: 32.78, longitude: 78.96, countryCode: 'IN', countryName: 'India', featureClass: 'P', featureCode: 'PPL', population: 100, timeZone: 'Asia/Kolkata', modificationDate: '2026-10-01' },
  { geonameId: 2, name: 'London', asciiName: 'London', alternateNames: '', latitude: 51.5, longitude: -.12, countryCode: 'GB', countryName: 'United Kingdom', featureClass: 'P', featureCode: 'PPL', population: 100, timeZone: 'Europe/London', modificationDate: '2026-10-01' },
  { geonameId: 3, name: 'Equatorial fixture', asciiName: 'Equatorial fixture', alternateNames: '', latitude: 0, longitude: 0, countryCode: 'GH', countryName: 'Ghana', featureClass: 'P', featureCode: 'PPL', population: 1, timeZone: 'Africa/Accra', modificationDate: '2026-10-01' },
], 'darkness-meaning-fixture');

test('actual MCP schema and plans describe only requested-window darkness', async t => {
  let externalAttempts = 0;
  const app = express(); app.use(express.json({ limit: '32kb' }));
  mountMcpRoute(app, {
    allowedHosts: ['127.0.0.1'], placeIndex: index,
    fetcher: async () => { externalAttempts++; throw Error('External requests forbidden'); },
    osmCandidateIndexLoader: async () => undefined,
    plannerServices: { getClimatology: async () => { throw Error('Offline fixture has no historical context'); } },
    weatherProvider: { getForecast: async place => place.latitude === 0 ? ({
      status: 'available', reason: 'Offline split-night samples', forecast: {
        availability: { status: 'available', reason: 'Offline split-night samples' },
        source: { name: 'Offline weather', url: 'https://example.test/weather', attribution: 'Fixture', dataClass: 'forecast' },
        forecastHorizonHours: 24, missingFields: [],
        samples: ['01', '12', '20'].map(hour => ({ validAt: `2026-10-15T${hour}:00:00Z`, values: { totalCloudCover: { value: 15, unit: '%' } } })),
      },
    }) : ({ status: 'unavailable', reason: 'Offline weather unavailable' }) },
  });
  const server = createServer(app).listen(0, '127.0.0.1'); await once(server, 'listening');
  const address = server.address(); assert.ok(address && typeof address !== 'string');
  let id = 0;
  async function rpc(method: string, params: unknown) {
    const response = await fetch(`http://127.0.0.1:${address!.port}/mcp`, {
      method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream', 'mcp-protocol-version': '2025-11-25' },
      body: JSON.stringify({ jsonrpc: '2.0', id: ++id, method, params }), signal: AbortSignal.timeout(15000),
    });
    assert.equal(response.status, 200);
    const line = (await response.text()).split('\n').find(row => row.startsWith('data: ')); assert.ok(line);
    const payload = JSON.parse(line.slice(6)); assert.equal(payload.error, undefined); return payload.result;
  }
  async function call(name: string, args: unknown) {
    const result = await rpc('tools/call', { name, arguments: args });
    assert.equal(result.isError, undefined, JSON.stringify(result)); return result.structuredContent;
  }
  try {
    await rpc('initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'darkness-meaning-regression', version: '1' } });
    const tools = (await rpc('tools/list', {})).tools;
    const astronomy = tools.find((tool: any) => tool.name === 'get_astronomy_window');
    await t.test('listed tool and JSON schema explain nested clipped solar thresholds', () => {
      assert.match(astronomy.description, /requested.*window/i);
      assert.match(astronomy.description, /nested.*threshold/i);
      assert.doesNotMatch(astronomy.description, /polar state/i);
      const properties = astronomy.outputSchema.properties;
      assert.ok(properties.darknessState); assert.ok(properties.solarThresholdIntervals);
      assert.equal(properties.polarState, undefined); assert.equal(properties.twilightIntervals, undefined);
      assert.match(properties.darknessState.description, /requested window/i);
      assert.match(properties.solarThresholdIntervals.description, /nested.*clipped/i);
    });
    for (const [label, query, startUtc, endUtc, expected] of [
      ['Hanle evening', 'Hanle, India', '2026-10-15T14:30:00Z', '2026-10-15T18:30:00Z', 'full-window'],
      ['Hanle whole day', 'Hanle, India', '2026-10-15T00:00:00Z', '2026-10-16T00:00:00Z', 'partial-window'],
      ['Hanle daytime', 'Hanle, India', '2026-10-15T07:30:00Z', '2026-10-15T09:30:00Z', 'none'],
      ['London DST evening', 'London, United Kingdom', '2026-10-24T23:00:00Z', '2026-10-25T03:00:00Z', 'full-window'],
    ] as const) await t.test(label, async () => {
      const resolved = await call('resolve_place', { placeQuery: query }); const place = resolved.matches[0]; assert.ok(place);
      const window = { startUtc, endUtc, timeZone: place.timeZone };
      const direct = await call('get_astronomy_window', { placeId: place.placeId, window });
      assert.equal(direct.darknessState, expected); assert.equal(direct.polarState, undefined);
      assert.equal(direct.twilightIntervals, undefined);
      for (const row of direct.solarThresholdIntervals) {
        assert.equal(row.sunAltitudeThresholdDegrees, ({ civil: -6, nautical: -12, astronomical: -18 } as Record<string, number>)[row.kind]);
        assert.ok(Date.parse(row.startUtc) >= Date.parse(startUtc)); assert.ok(Date.parse(row.endUtc) <= Date.parse(endUtc));
      }
      if (label === 'Hanle evening') {
        assert.equal(direct.solarThresholdIntervals.length, 3);
        assert.ok(direct.solarThresholdIntervals.every((row: any) => Date.parse(row.startUtc) === Date.parse(startUtc) && Date.parse(row.endUtc) === Date.parse(endUtc)));
      }
      for (const activity of ['general-stargazing', 'astrophotography', 'meteor-shower']) {
        const plan = await call('plan_observing_session', { placeId: place.placeId, window, activity });
        assert.deepEqual(plan.evidence.astronomy, direct);
        assert.ok(plan.factors.every((factor: any) => !/polar/i.test(factor.name + factor.assessment)));
        const darkness = plan.factors.find((factor: any) => factor.name === 'Astronomical darkness');
        assert.match(darkness.assessment, /requested window/i);
        assert.equal(darkness.impact, expected === 'full-window' ? 'favorable' : expected === 'partial-window' ? 'mixed' : 'unfavorable');
        assert.ok(plan.gaps.some((gap: string) => /forecast|weather/i.test(gap)));
        assert.equal(plan.evidence.location.access.status, 'unknown');
      }
    });
    await t.test('direct and composed weather retain both dark sample groups without bridging daylight', async () => {
      const placeId = 'place:v1:geonames:3';
      const window = { startUtc: '2026-10-15T00:00:00Z', endUtc: '2026-10-16T00:00:00Z', timeZone: 'Africa/Accra' };
      const direct = await call('get_night_conditions', { placeId, window });
      assert.deepEqual(direct.nightContext.forecastStepsDuringDarkness[0].validTimesUtc, ['2026-10-15T01:00:00Z', '2026-10-15T20:00:00Z']);
      assert.equal(direct.nightContext.astronomicalDarknessIntervals.length, 2);
      const plan = await call('plan_observing_session', { placeId, window, activity: 'astrophotography', target: 'Milky Way core' });
      assert.deepEqual(plan.evidence.weather.nightContext, direct.nightContext);
      assert.equal(plan.candidateWindows.length, 1);
      assert.equal(plan.candidateWindows[0].window.startUtc.slice(0, 16), '2026-10-15T18:58');
      assert.equal(plan.candidateWindows[0].window.endUtc.slice(0, 16), '2026-10-15T22:09');
      const automatic = await call('plan_observing_session', { placeId, window, activity: 'astrophotography' });
      assert.equal(automatic.suggestions[0]?.target.name, 'Milky Way core');
      assert.ok(automatic.suggestions.length <= 3);
      const evening = automatic.candidateWindows.find((row: any) => row.window.startUtc.slice(0, 16) === '2026-10-15T18:58');
      assert.ok(evening, 'Automatic photography plan must retain the evening opportunity');
      assert.equal(evening.window.endUtc.slice(0, 16), '2026-10-15T22:09');
      assert.ok(automatic.candidateWindows.length <= 8);
      const night = await call('plan_observing_session', { placeId, window, activity: 'meteor-shower', target: 'ORI' });
      assert.equal(night.candidateWindows.length, 2);
      assert.ok(night.candidateWindows.every((row: any) => !(row.window.startUtc < '2026-10-15T12:00:00Z' && row.window.endUtc > '2026-10-15T12:00:00Z')));
      for (const [startUtc, endUtc, expectedTimes, expectedCount] of [
        ['2026-10-15T11:00:00Z', '2026-10-15T13:00:00Z', [], 0],
        ['2026-10-15T19:30:00Z', '2026-10-15T21:00:00Z', ['2026-10-15T20:00:00Z'], 1],
        ['2026-10-15T20:00:00Z', '2026-10-16T04:00:00Z', ['2026-10-15T20:00:00Z'], 1],
      ] as const) {
        const scopedWindow = { ...window, startUtc, endUtc };
        const conditions = await call('get_night_conditions', { placeId, window: scopedWindow });
        assert.deepEqual(conditions.nightContext.forecastStepsDuringDarkness[0].validTimesUtc, expectedTimes);
        assert.equal(conditions.nightContext.astronomicalDarknessIntervals.length, expectedCount);
        const scopedPlan = await call('plan_observing_session', { placeId, window: scopedWindow, activity: 'meteor-shower', target: 'ORI' });
        assert.deepEqual(scopedPlan.evidence.weather.nightContext, conditions.nightContext);
        assert.equal(scopedPlan.candidateWindows.length, expectedCount);
      }
    });
    assert.equal(externalAttempts, 0);
  } finally { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
});
