/** Built-runtime check: synthetic provider responses only; no external requests. */
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { mkdtemp, writeFile, rm, realpath, readFile, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { buildCapacityReport } from './api-capacity-report.mjs';

const saved = { ...process.env };
let server, app, fixtureDirectory, closeConfiguredNightSkyPluginApp, rssTimer;
let sampledPeakRssBytes = process.memoryUsage().rss;
const sampleRss = () => { sampledPeakRssBytes = Math.max(sampledPeakRssBytes, process.memoryUsage().rss); };
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
  const bundleUrl = new URL('../dist/plugin.js', import.meta.url);
  const bundle = await readFile(bundleUrl);
  const compiledBundle = { sha256: createHash('sha256').update(bundle).digest('hex'), bytes: bundle.byteLength };
  const quotaInitialBytes = (await stat(quotaPath)).size;
  sampleRss();
  rssTimer = setInterval(sampleRss, 10);
  rssTimer.unref();
  const moduleStarted = performance.now();
  const runtime = await import(bundleUrl.href);
  const moduleImportMs = performance.now() - moduleStarted;
  closeConfiguredNightSkyPluginApp = runtime.closeConfiguredNightSkyPluginApp;
  sampleRss();
  let calls = 0;
  const fakeProviderCallLimit=process.argv.includes('--capacity')?6:5;
  const fakeProviderRoutes={};
  const appStarted = performance.now();
  app = await runtime.createConfiguredNightSkyPluginApp({ log: () => {}, fetcher: async input => {
    calls++;
    assert.ok(calls<=fakeProviderCallLimit,'Synthetic source dispatch budget exceeded');
    sampleRss();
    const url = new URL(String(input));
    const route=url.hostname+url.pathname;fakeProviderRoutes[route]=(fakeProviderRoutes[route]??0)+1;
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
    if(url.hostname==='api.geoapify.com'){
      assert.equal(url.pathname,'/v2/places');
      return Response.json({type:'FeatureCollection',features:[]});
    }
    assert.equal(url.hostname, 'secure.geonames.org', 'Unexpected synthetic upstream');
    if (url.pathname === '/searchJSON') return Response.json({ geonames: [{ geonameId: 9999991, name: 'Fixture Sky Town', lat: '18.52', lng: '73.85', countryCode: 'IN', countryName: 'India', fcl: 'P', fcode: 'PPL', timezone: { timeZoneId: 'Asia/Kolkata' } }] });
    if (url.pathname === '/timezoneJSON') return Response.json({ timezoneId: 'Asia/Kolkata', lat: 18.52, lng: 73.85 });
    throw Error('Unexpected synthetic endpoint');
  }});
  const appInitializationMs = performance.now() - appStarted;
  const moduleAndAppInitializationMs = performance.now() - moduleStarted;
  sampleRss();
  const listenerStarted = performance.now();
  server = createServer(app).listen(0, '127.0.0.1');
  await once(server, 'listening');
  const listenerReadyMs = performance.now() - listenerStarted;
  sampleRss();
  const base = `http://127.0.0.1:${server.address().port}`;
  let id = 0;
  const requests = [];
  const rpc = async (method, params, timeoutMs=10000) => {
    const started = performance.now();
    const response = await fetch(`${base}/mcp`, {method:'POST',headers:{'content-type':'application/json',accept:'application/json, text/event-stream','mcp-protocol-version':'2025-11-25'},body:JSON.stringify({jsonrpc:'2.0',id:++id,method,params}),signal:AbortSignal.timeout(timeoutMs)});
    assert.equal(response.status,200);
    const raw=await response.text(), event=raw.split('\n').find(line=>line.startsWith('data: '));
    const elapsedMs = performance.now() - started;
    sampleRss();
    requests.push({ operation: params?.name ?? method, status: response.status, elapsedMs, responseUtf8Bytes: Buffer.byteLength(raw, 'utf8') });
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
    displayTimeZone: 'Asia/Kolkata', window: { startUtc: '2026-10-17T14:30:00Z', endUtc: '2026-10-17T18:30:00Z', timeZone: 'Asia/Kolkata' }, includeHourly: true, forecastMode: 'all' } });
  const weather = conditions.structuredContent;
  assert.equal(weather.availability.status, 'partial');
  assert.deepEqual(weather.providerOutcomes.map(o => o.providerId), ['met', 'weatherapi', 'openweather']);
  assert.equal(weather.providerOutcomes[2].status, 'unavailable');
  assert.equal(weather.forecasts.length, 2, JSON.stringify(weather.providerOutcomes));
  assert.deepEqual(weather.forecasts.map(f => f.samples[0].values.totalCloudCover.value), [0, 100]);
  let capacity;
  if(process.argv.includes('--capacity')){
    const capacityStarted=performance.now(),phases=[];
    const args={placeId:point.placeId,sourceRevision:point.sourceRevision,displayTimeZone:'Asia/Kolkata',window:{startUtc:'2026-10-17T14:30:00Z',endUtc:'2026-10-17T18:30:00Z',timeZone:'Asia/Kolkata'}};
    const workload=[{name:'get_astronomy_window',arguments:args},{name:'get_night_conditions',arguments:{...args,includeHourly:true}},
      {name:'plan_observing_session',arguments:{...args,activity:'general-stargazing',experience:'beginner',equipment:['naked eye'],units:'metric'}},
      {name:'get_astronomy_window',arguments:args}];
    for(const concurrency of [1,4]){
      const phaseStart=requests.length;let active=0,observedClientConcurrency=0;
      const run=async operation=>{
        const remaining=Math.floor(30000-(performance.now()-capacityStarted));assert.ok(remaining>0,'Capacity dispatch budget exhausted');
        active++;observedClientConcurrency=Math.max(observedClientConcurrency,active);
        try {const result=await rpc('tools/call',operation,Math.min(10000,remaining));assert.ok(result.structuredContent?.availability);}
        finally{active--;}
      };
      if(concurrency===1)for(const operation of workload)await run(operation);
      else await Promise.all(workload.map(run));
      phases.push({name:concurrency===1?'sequential':'concurrent',concurrency,observedClientConcurrency,requests:requests.slice(phaseStart)});
    }
    capacity={...buildCapacityReport(phases),elapsedMs:performance.now()-capacityStarted,dispatchBudgetMs:30000,
      unmeasured:{cacheOccupancy:'Combined live normalized-cache occupancy is not exposed by this compiled probe.',completeDeploymentStorage:'Quota JSON bytes exclude dependencies, logs, backups and caches.',targetHostCapacity:'Local synthetic loopback only; actual host, provider latency, optional-source mix and sustained capacity remain unmeasured.'}};
  }
  assert.ok(calls >= 4 && calls <= fakeProviderCallLimit);
  const quotaFinalBytes = (await stat(quotaPath)).size;
  sampleRss();
  const report = {
    schemaVersion: 1, synthetic: true, liveEvidenceEligible: false,
    runtime: { node: process.version, platform: process.platform, architecture: process.arch },
    compiledBundle,
    configuration: { discoveryMode: 'api', weatherProviders: ['met', 'weatherapi', 'openweather'], localGeographyFiles: false },
    initialization: { moduleImportMs, appInitializationMs, moduleAndAppInitializationMs, listenerReadyMs },
    requests, fakeProviderCalls: calls, fakeProviderCallLimit, fakeProviderRoutes, sampledPeakRssBytes,
    fixtureQuotaFile: { initialBytes: quotaInitialBytes, finalBytes: quotaFinalBytes },
    ...(capacity?{capacity}:{}),
    limitations: [
      'Module import plus app cold initialization in this script, not process-spawn startup; Node startup, script imports, scratch setup and bundle hashing are excluded from initialization timings.',
      'Bundle SHA-256 identifies dist/plugin.js only; external dependencies and a complete deployment artifact are not attested.',
      'Loopback HTTP/MCP requests with fixed fake provider responses; optional capacity phase compares four sequential with four concurrent client requests. No live provider latency, throughput, coverage or hosting acceptance.',
      'Capacity phases are ordered after initial resolution/astronomy/weather checks; the serial phase also warms planner and candidate caches. Their latency differences cannot be attributed solely to concurrency. Client overlap is not parallel server CPU execution.',
      'The 30-second capacity dispatch/client-timeout budget does not preempt synchronous JavaScript work or include initialization and cleanup.',
      'Request latency ends after reading the response body, before JSON parsing and assertions; UTF-8 bytes include the decoded SSE envelope where present, not network headers or wire compression.',
      'RSS is process-wide, sampled at phase/request/provider boundaries and every 10 ms when the event loop runs; it is not OS peak memory or per-request allocation.',
      'Quota bytes describe only the synthetic quota JSON file, excluding lock/marker files, backups, caches, rollback and deployment storage; scratch files are removed in finally.',
    ],
  };
  assert.equal(requests.length, capacity?12:4);
  assert.ok(requests.every(r => Number.isFinite(r.elapsedMs) && r.elapsedMs >= 0 && r.responseUtf8Bytes > 0));
  console.log(JSON.stringify(report));
  console.log('SYNTHETIC: built API-mode resolution, astronomy and three-source weather partial outage verified without local geography files or external requests. Not live-source acceptance.');
} finally {
  if (rssTimer) clearInterval(rssTimer);
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
