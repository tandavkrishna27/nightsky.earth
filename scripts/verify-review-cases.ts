/** Offline service evidence for review cases; no assistant or remote host execution. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { mountMcpRoute } from '../server/mcp/route';
import { createApiServices } from '../server/places/api/configuration';
import { GeoNamesPlaceIndex } from '../server/places/geonames';
import { OSM_SOURCE } from '../server/places/importOsm';
import { planResultSchema, compareObservingOptionsResultSchema } from '../shared/nightsky/planning';
import type { SourceRecord, TimeWindow } from '../shared/nightsky/common';
interface ReviewCase { description: string; prompt: string; tools_triggered: string; expected_behavior: string }
interface CallRecord { requestId: number; toolName: string; isError: boolean; sourceNames: string[] }
interface CaseRecord { caseId: string; role: string; serverProbeRationale: string; kind: 'positive'|'negative'; description: string; prompt: string; expectedToolSequence: string; expectedHostBehavior: string; serverAssertionsPassed: boolean; hostBehaviorVerified: false; assertions: string[]; calls: CallRecord[]; sourceFixtures: { gazetteer: boolean; location: 'api fixture responses' | 'synthetic local index'; weather: true; aurora: true; candidates: 'empty coverage'; history: 'unavailable'; events: 'production catalog, rights gaps preserved'; astronomy: 'production calculations' } }
const manifestPath = fileURLToPath(new URL('../plugins/nightsky/plugin.json', import.meta.url));
const fixtureSource: SourceRecord = { name: 'Review fixture weather', url: 'https://example.test/review-weather', attribution: 'Synthetic deterministic review fixture; not real forecast evidence.', dataClass: 'forecast', product: 'Offline 48-hour fixture' };
const index = new GeoNamesPlaceIndex([{ geonameId: 2643743, name: 'London', asciiName: 'London', alternateNames: '', latitude: 51.5, longitude: -0.12, countryCode: 'GB', countryName: 'United Kingdom', featureClass: 'P', featureCode: 'PPLC', population: 8_000_000, timeZone: 'Europe/London', modificationDate: '2026-10-01' }], 'synthetic-review-fixture-2026-10');
const night = (date: string): TimeWindow => ({ startUtc: date + 'T18:00:00Z', endUtc: new Date(Date.parse(date + 'T18:00:00Z') + 12 * 3600000).toISOString().replace('.000Z','Z'), timeZone: 'Europe/London' });
export async function runReviewCases(options: { offline: boolean; apiFixture?: boolean }) {
  assert.equal(options.offline, true, 'Explicit --offline required');
  const manifestBytes = readFileSync(manifestPath);
  const manifestSha256 = createHash('sha256').update(manifestBytes).digest('hex');
  const cases = JSON.parse(manifestBytes.toString('utf8')).extensions['com.openai'].review.test_cases as { positive: ReviewCase[]; negative: ReviewCase[] };
  assert.equal(cases.positive.length, 5); assert.equal(cases.negative.length, 3);
  let externalAttempts = 0;
  const fixtureRequests: string[] = [];
  const api = options.apiFixture ? createApiServices({
    geonamesUsername: 'review-fixture', geoapifyApiKey: 'review-fixture',
    userAgent: 'NightSky offline review fixture',
    fetcher: async input => {
      const url = new URL(String(input));
      const route = url.origin + url.pathname;
      fixtureRequests.push(route);
      if (route === 'https://secure.geonames.org/searchJSON') return Response.json({ geonames: [] });
      if (route === 'https://api.geoapify.com/v1/geocode/search') return Response.json({ features: [{
        type: 'Feature', geometry: { type: 'Point', coordinates: [-0.12, 51.5] },
        properties: { place_id: 'review-london', name: 'London, United Kingdom', country_code: 'gb', timezone: { name: 'Europe/London' } },
      }] });
      if (route === 'https://api.geoapify.com/v2/places') return Response.json({ features: [] });
      externalAttempts++;
      throw Error('Unexpected API fixture route; external traffic prohibited');
    },
  }) : undefined;
  const app = express(); app.use(express.json({ limit: '32kb' }));
  mountMcpRoute(app, {
    ...(api ? { discoveryProvider: api.discoveryProvider, selectedPlaceResolver: api.selectedPlaceResolver, placeIndexLoader: async () => { throw Error('API review must not load a local gazetteer'); }, osmCandidateIndexLoader: async () => { throw Error('API review must not load a local candidate artifact'); } } : { placeIndex: index }), allowedHosts: ['127.0.0.1'], maxRequestsPerWindow: 200,
    fetcher: async () => { externalAttempts++; throw Error('External provider traffic prohibited in offline review'); },
    ...(!api ? { osmCandidateIndex: { schemaVersion: 1 as const, vintage: 'review-empty-fixture', coverage: 'No real candidate coverage in this rehearsal', source: { ...OSM_SOURCE, vintage: 'review-empty-fixture' }, candidates: [] } } : {}),
    plannerServices: { getClimatology: async () => { throw Error('No historical artifact enabled in review fixture'); } },
    weatherProvider: { getForecast: async (_place, window) => ({ status: 'partial', reason: 'Synthetic fixture lacks visibility.', forecast: {
      availability: { status: 'partial', reason: 'Synthetic fixture lacks visibility.' }, source: fixtureSource, forecastHorizonHours: 48,
      samples: [{ validAt: window.startUtc.slice(0,10) + 'T22:00:00Z', values: { totalCloudCover: { value: 18, unit: '%' }, windSpeed: { value: 4, unit: 'm/s' } } }],
      missingFields: [{ field: 'visibility', reason: 'Not supplied by synthetic fixture.' }],
    } }) },
    auroraProvider: async (place, window) => ({ placeId: place.placeId, window, availability: { status: 'not-covered', reason: 'Synthetic no-coverage fixture.' }, sources: [{ ...fixtureSource, name: 'Review fixture aurora', product: 'No-coverage fixture' }], caveats: ['This is not a personal sighting probability. Clouds and darkness must be checked separately.'], outlook: { status: 'not-covered', reason: 'Synthetic no-coverage fixture.' }, latitudeBand: 'mid-latitude' }),
  });
  const server = createServer(app).listen(0, '127.0.0.1'); await once(server, 'listening');
  const address = server.address(); assert.ok(address && typeof address !== 'string');
  const endpoint = `http://127.0.0.1:${address.port}/mcp`;
  let nextRequestId = 1;
  const records: CaseRecord[] = [];
  async function rpc(method: string, params: unknown) {
    const id = nextRequestId++;
    const response = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream', 'mcp-protocol-version': '2025-11-25' }, signal: AbortSignal.timeout(20_000), redirect: 'error', body: JSON.stringify({ jsonrpc: '2.0', id, method, params }) });
    assert.equal(response.status, 200);
    assert.ok(response.body, 'Expected MCP response body');
    const reader = response.body.getReader(); const chunks: Uint8Array[] = []; let bytes = 0;
    try {
      while (true) {
        const chunk = await reader.read(); if (chunk.done) break;
        bytes += chunk.value.byteLength;
        if (bytes > 2_000_000) { await reader.cancel(); throw Error('MCP review response exceeds bounded size'); }
        chunks.push(chunk.value);
      }
    } finally { reader.releaseLock(); }
    const text = Buffer.concat(chunks).toString('utf8'); const data = text.split('\n').find(line => line.startsWith('data: '));
    assert.ok(data, 'Expected MCP SSE event'); const payload = JSON.parse(data.slice(6)); assert.equal(payload.id, id); assert.equal(payload.error, undefined);
    return { id, result: payload.result };
  }
  try {
    await rpc('initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'nightsky-offline-review', version: '1.0.0' } });
    for (const [caseIndex, scenario] of [...cases.positive, ...cases.negative].entries()) {
      const roles = ['casual', 'meteor', 'beginner', 'photography', 'two-night-comparison', 'aurora-guarantee', 'solar-sunglasses', 'typed-coordinates'];
      const descriptions = ['Casual named-destination session', 'Meteor shower with source gaps', 'Beginner visible targets and preparation', 'First astrophotography session', 'Two telescope nights', 'Aurora guarantee refused', 'Unsafe solar viewing refused', 'Typed coordinates require named destination'];
      assert.equal(scenario.description, descriptions[caseIndex], 'Review metadata case order changed; update fixture bindings deliberately');
      const record: CaseRecord = { caseId: roles[caseIndex], role: caseIndex < 5 ? 'positive service sequence' : 'negative service probe; assistant behavior pending', serverProbeRationale: caseIndex < 5 ? 'Manually scripted positive tool sequence; assistant routing is untested.' : caseIndex === 7 ? 'Intentionally submit coordinate input directly to the resolver to prove server rejection. Expected assistant behavior is to ask for a name without tool calls.' : 'Intentionally request a supporting plan to inspect server evidence and safety instructions. This does not demonstrate an assistant refusal or tool routing.', kind: caseIndex < 5 ? 'positive' : 'negative', description: scenario.description, prompt: scenario.prompt, expectedToolSequence: scenario.tools_triggered, expectedHostBehavior: scenario.expected_behavior, serverAssertionsPassed: false, hostBehaviorVerified: false, assertions: [], calls: [], sourceFixtures: { gazetteer: !api, location: api ? 'api fixture responses' : 'synthetic local index', weather: true, aurora: true, candidates: 'empty coverage', history: 'unavailable', events: 'production catalog, rights gaps preserved', astronomy: 'production calculations' } };
      async function call(toolName: string, args: unknown, expectError = false): Promise<any> {
        const response = await rpc('tools/call', { name: toolName, arguments: args });
        record.calls.push({ requestId: response.id, toolName, isError: response.result.isError === true, sourceNames: response.result.structuredContent?.sources?.map((source: SourceRecord) => source.name) ?? [] });
        assert.equal(response.result.isError === true, expectError, `${toolName} unexpected tool error: ${JSON.stringify(response.result)}`);
        return expectError ? response.result : response.result.structuredContent;
      }
      if (caseIndex === 7) {
        assert.equal(scenario.prompt, 'Find a dark spot at 12.97, 77.59.');
        const rejected = await call('resolve_place', { placeQuery: '12.97, 77.59' }, true);
        assert.match(JSON.stringify(rejected), /named|coordinate/i);
        record.assertions.push('coordinate-shaped tool input rejected; no planner or reverse geocoder');
      } else {
        const resolved = await call('resolve_place', { placeQuery: 'London, United Kingdom' });
        assert.equal(resolved.matches[0].displayName, 'London, United Kingdom');
        const placeId = resolved.matches[0].placeId;
        const selection = { placeId, ...(api ? { sourceRevision: resolved.matches[0].sourceRevision } : {}) };
        if (api) { assert.match(selection.sourceRevision, /^[a-f0-9]{64}$/); assert.equal(resolved.matches[0].timeZoneEvidence.status, 'verified'); assert.equal(resolved.matches[0].timeZone, 'Europe/London'); }
        const window = night(caseIndex === 1 ? '2026-08-12' : '2026-10-15');
        if (caseIndex === 4) {
          const result = compareObservingOptionsResultSchema.parse(await call('compare_observing_options', { options: [window, night('2026-10-16')].map(window => ({ ...selection, activity: 'planet-observing', target: 'Jupiter', window })) }));
          assert.equal(result.comparisons.length, 2);
          for (const item of result.comparisons) { assert.ok(item.evidence?.target); assert.equal(item.evidence?.weather?.forecasts[0].source.name, fixtureSource.name); assert.equal(item.evidence?.weather?.forecasts[0].forecastHorizonHours, 48); assert.ok(item.availability); assert.ok(item.sources.length); }
          assert.notEqual(result.comparisons[0].window.startUtc, result.comparisons[1].window.startUtc);
          record.assertions.push('two separate target nights with fixture forecast source, horizon and availability');
        } else {
          if (caseIndex === 0) { const candidates = await call('search_observing_locations', { ...selection }); assert.equal(candidates.candidates.length, 0); if (!api) assert.notEqual(candidates.availability.status, 'available'); else assert.equal(candidates.discoveryCoverage.mappedFeatureCompleteness, 'unknown'); record.assertions.push(api ? 'empty bounded API candidate fixture; mapped completeness unknown; no site or safety claim' : 'candidate coverage unavailable; no real site or safety claim'); }
          if (caseIndex === 1) { const events = await call('search_sky_events', { ...selection, window }); assert.ok(events.sources.length); assert.ok(events.caveats.length); record.assertions.push('event catalog returns source and rights/coverage caveats'); }
          if (caseIndex === 3) { const target = await call('get_target_visibility', { ...selection, targetQuery: 'Milky Way', window }); assert.ok(target.sources.length); await call('get_night_conditions', { ...selection, window }); }
          const activity = ['general-stargazing','meteor-shower','learning','astrophotography','','aurora','eclipse'][caseIndex];
          const result = planResultSchema.parse(await call('plan_observing_session', { ...selection, activity, window, experience: 'beginner', ...(caseIndex === 3 ? { target: 'Milky Way' } : {}) }));
          assert.equal(result.place.placeId, placeId); assert.ok(result.evidence?.astronomy); assert.ok(result.factors.some(factor => /Moon/.test(factor.name))); assert.equal(result.evidence?.weather?.forecasts[0].source.name, fixtureSource.name);
          assert.equal(result.evidence?.weather?.forecasts[0].samples[0].validAt, window.startUtc.slice(0,10) + 'T22:00:00Z');
          assert.ok(result.caveats.some(caveat => /access|safety/.test(caveat))); record.assertions.push('named place, astronomy/Moon and separately labeled partial fixture weather');
          if (caseIndex === 1) { assert.ok(result.evidence?.events); record.assertions.push('meteor evidence or explicit catalog gap retained'); }
          if (caseIndex === 2) { assert.ok(result.preparation.length); assert.ok(result.suggestions?.length); record.assertions.push('beginner preparation and calculated target suggestions'); }
          if (caseIndex === 3) { assert.ok(result.preparation.some(step => /camera.*lens|lens.*camera/i.test(step))); assert.ok(result.caveats.some(caveat => /seeing.*transparency/i.test(caveat))); await call('recommend_specialist_tools', { activity: 'astrophotography', experience: 'beginner' }); record.assertions.push('photography gear question and unsupported seeing/transparency limits'); }
          if (caseIndex === 5) { if (api) { assert.equal(result.evidence?.aurora?.sourceRevision, selection.sourceRevision); assert.equal(result.evidence?.aurora?.displayTimeZone, window.timeZone); } assert.equal(result.evidence?.aurora?.outlook.status, 'not-covered'); assert.ok(result.factors.some(factor => factor.name === 'Aurora outlook' && /not-covered/i.test(factor.assessment))); assert.ok(!/guaranteed sighting|will see an aurora/i.test(result.summary)); record.assertions.push('aurora no coverage and weather kept separate; no guaranteed sighting in server summary'); }
          if (caseIndex === 6) { assert.ok(result.preparation.some(step => /ISO 12312-2/.test(step) && /sunglasses are not safe/i.test(step))); assert.ok(result.preparation.some(step => /solar filter.*front aperture/i.test(step))); assert.ok(result.sources.some(source => source.url.includes('science.nasa.gov') && /safety/i.test(source.url))); record.assertions.push('solar safety and NASA provenance'); }
        }
      }
      if (caseIndex < 5) assert.deepEqual(record.calls.map(call => call.toolName), scenario.tools_triggered.split(',').map(name => name.trim()), 'Manifest expected positive sequence must match scripted probes');
      record.serverAssertionsPassed = true; records.push(record);
    }
    assert.equal(externalAttempts, 0, 'Unexpected external provider attempt');
    return { manifestSha256, locationMode: api ? 'api-fixture' as const : 'legacy-fixture' as const, gazetteerFilesUsed: false as const, fixtureRequests, mode: `offline ${api ? 'API fixture' : 'legacy fixture'} loopback MCP; manually scripted tool calls, no LLM`, manifestCases: { positive: 5, negative: 3 }, externalAttempts, hostBehaviorVerified: false, records };
  } finally { server.closeAllConnections(); await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2); const position = args.indexOf('--out');
  const output = resolve(position < 0 ? 'dist/review-rehearsal' : args[position + 1]);
  const report = await runReviewCases({ offline: args.includes('--offline'), apiFixture: args.includes('--api-fixture') });
  mkdirSync(output, { recursive: true }); writeFileSync(join(output, 'review-case-report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(`Offline review: ${report.records.length}/8 server assertion sets passed; external attempts ${report.externalAttempts}; host behavior pending.`);
}
