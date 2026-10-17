/** Built-runtime check: synthetic provider responses only; no external requests. */
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { mkdtemp, writeFile, rm, realpath } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { createConfiguredNightSkyPluginApp, closeConfiguredNightSkyPluginApp } from '../dist/plugin.js';

const saved = { ...process.env };
let server, app, fixtureDirectory;
try {
  for (const key of Object.keys(process.env)) if (key.startsWith('NIGHTSKY_') || key === 'MET_NORWAY_USER_AGENT') delete process.env[key];
  fixtureDirectory = await realpath(await mkdtemp(join(tmpdir(), 'nightsky-api-fixture-')));
  const quotaPath = join(fixtureDirectory, 'quota.json');
  // Synthetic-only state: these labels and fake keys have never represented an upstream account.
  // Production initialization requires verified unused budget; no startup auto-initialization is exercised here.
  await writeFile(quotaPath, JSON.stringify({ version: 1, lastNow: Date.now(), entries: Object.fromEntries(
    ['geonames', 'geoapify', 'weatherapi', 'openweather'].map(id => [id, { accountLabel: `operator-${id}`, buckets: {}, months: {}, disabled: false, blockedUntil: 0 }])) }));
  await writeFile(quotaPath + '.initialized', 'Synthetic offline fixture initialization.\n');
  Object.assign(process.env, {
    NIGHTSKY_DISCOVERY_MODE: 'api', NIGHTSKY_MCP_TOOL_MODE: 'full',
    NIGHTSKY_GEONAMES_USERNAME: 'offline-fixture', NIGHTSKY_GEOAPIFY_API_KEY: 'offline-fixture-key',
    NIGHTSKY_MCP_ALLOWED_HOSTS: '127.0.0.1', NIGHTSKY_QUOTA_STATE_PATH: quotaPath,
    NIGHTSKY_WEATHER_PROVIDERS: 'met,weatherapi,openweather', NIGHTSKY_WEATHER_ADMITTED_PROVIDERS: 'weatherapi,openweather',
    NIGHTSKY_WEATHERAPI_KEY: 'offline-fixture-key', NIGHTSKY_OPENWEATHER_KEY: 'offline-fixture-key',
    MET_NORWAY_USER_AGENT: 'NightSky synthetic test (fixture@example.invalid)',
  });
  let calls = 0;
  app = await createConfiguredNightSkyPluginApp({ log: () => {}, fetcher: async input => {
    calls++;
    const url = new URL(String(input));
    const times = ['2026-10-17T15:00:00Z', '2026-10-17T16:00:00Z', '2026-10-17T17:00:00Z', '2026-10-17T18:00:00Z'];
    if (url.hostname === 'api.met.no') {
      assert.equal(url.pathname, '/weatherapi/locationforecast/2.0/complete');
      assert.equal(Number(url.searchParams.get('lat')), 18.52); assert.equal(Number(url.searchParams.get('lon')), 73.85);
      return Response.json({ properties: { meta: { updated_at: '2026-10-17T12:00:00Z', units: { cloud_area_fraction: '%', air_temperature: 'celsius' } },
        timeseries: times.map(time => ({ time, data: { instant: { details: { cloud_area_fraction: 0, air_temperature: 12 } } } })) } });
    }
    if (url.hostname === 'api.weatherapi.com') {
      assert.equal(url.pathname, '/v1/forecast.json'); assert.equal(url.searchParams.get('q'), '18.52,73.85');
      return Response.json({ forecast: { forecastday: [{ hour: times.map(time => ({ time_epoch: Date.parse(time) / 1000, cloud: 100, temp_c: 12 })) }] } });
    }
    if (url.hostname === 'api.openweathermap.org') {
      assert.equal(url.pathname, '/data/2.5/forecast');
      assert.equal(Number(url.searchParams.get('lat')), 18.52); assert.equal(Number(url.searchParams.get('lon')), 73.85);
      return Response.json({ cod: '503', message: 'Synthetic partial outage' }, { status: 503 });
    }
    assert.equal(url.hostname, 'secure.geonames.org', 'Unexpected synthetic upstream');
    if (url.pathname === '/searchJSON') return Response.json({ geonames: [{ geonameId: 9999991, name: 'Fixture Sky Town', lat: '18.52', lng: '73.85', countryCode: 'IN', countryName: 'India', fcl: 'P', fcode: 'PPL', timezone: { timeZoneId: 'Asia/Kolkata' } }] });
    if (url.pathname === '/timezoneJSON') return Response.json({ timezoneId: 'Asia/Kolkata', lat: 18.52, lng: 73.85 });
    throw Error('Unexpected synthetic endpoint');
  }});
  server = createServer(app).listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  let id = 0;
  const rpc = async (method, params) => {
    const response = await fetch(`${base}/mcp`, {method:'POST',headers:{'content-type':'application/json',accept:'application/json, text/event-stream','mcp-protocol-version':'2025-11-25'},body:JSON.stringify({jsonrpc:'2.0',id:++id,method,params}),signal:AbortSignal.timeout(10000)});
    assert.equal(response.status,200);
    const raw=await response.text(), event=raw.split('\n').find(line=>line.startsWith('data: '));
    const body=JSON.parse(event?event.slice(6):raw);
    assert.equal(body.error,undefined,JSON.stringify(body));
    assert.equal(body.result.isError,undefined,JSON.stringify(body.result));
    return body.result;
  };
  await rpc('initialize',{protocolVersion:'2025-11-25',capabilities:{},clientInfo:{name:'offline-api-runtime',version:'1'}});
  const resolved=await rpc('tools/call',{name:'resolve_place',arguments:{placeQuery:'Fixture Sky Town'}});
  const point=resolved.structuredContent.matches[0];
  assert.match(point.placeId,/^place:v1:api:/);
  assert.match(point.sourceRevision,/^[a-f0-9]{64}$/);
  const astronomy=await rpc('tools/call',{name:'get_astronomy_window',arguments:{placeId:point.placeId,sourceRevision:point.sourceRevision,displayTimeZone:'Asia/Kolkata',window:{startUtc:'2026-10-17T14:30:00Z',endUtc:'2026-10-17T18:30:00Z',timeZone:'Asia/Kolkata'}}});
  assert.notEqual(astronomy.structuredContent.availability.status,'unavailable');
  const conditions = await rpc('tools/call', { name: 'get_night_conditions', arguments: { placeId: point.placeId, sourceRevision: point.sourceRevision,
    displayTimeZone: 'Asia/Kolkata', window: { startUtc: '2026-10-17T14:30:00Z', endUtc: '2026-10-17T18:30:00Z', timeZone: 'Asia/Kolkata' }, includeHourly: true } });
  const weather = conditions.structuredContent;
  assert.equal(weather.availability.status, 'partial');
  assert.deepEqual(weather.providerOutcomes.map(o => o.providerId), ['met', 'weatherapi', 'openweather']);
  assert.equal(weather.providerOutcomes[2].status, 'unavailable');
  assert.equal(weather.forecasts.length, 2, JSON.stringify(weather.providerOutcomes));
  assert.deepEqual(weather.forecasts.map(f => f.samples[0].values.totalCloudCover.value), [0, 100]);
  assert.ok(calls >= 4 && calls <= 5);
  console.log('SYNTHETIC: built API-mode resolution, astronomy and three-source weather partial outage verified without local geography files or external requests. Not live-source acceptance.');
} finally {
  if(server){server.closeAllConnections();await new Promise(done=>server.close(done));}
  if (app) await closeConfiguredNightSkyPluginApp(app);
  if (fixtureDirectory) {
    const target = resolve(fixtureDirectory), parent = await realpath(tmpdir());
    assert.equal(dirname(target).toLowerCase(), parent.toLowerCase());
    assert.ok(target.split(/[\\/]/).at(-1).startsWith('nightsky-api-fixture-'));
    await rm(target, { recursive: true, force: true });
  }
  for(const key of Object.keys(process.env))if(!(key in saved))delete process.env[key];
  Object.assign(process.env,saved);
}
