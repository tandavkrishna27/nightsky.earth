import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:net';
import { once } from 'node:events';
import { createFixtureServer } from '../../scripts/complete-model-journey-test';

test('fixture binds requested loopback port for repeatable package connection', async()=>{
 const probe=createServer().listen(0,'127.0.0.1'); await once(probe,'listening');
 const port=(probe.address() as {port:number}).port; await new Promise<void>(r=>probe.close(()=>r()));
 const server=await createFixtureServer(mkdtempSync(join(tmpdir(),'ns-port-')),{mode:'api',port});
 try { assert.equal(server.endpoint,`http://127.0.0.1:${port}/mcp`); } finally {await server.close();}
});
test('preparation binds complete package to verified offline endpoint then closes it', async()=>{
 assert.ok(existsSync('scripts/prepare-codex-local-fixture.ts'),'prepare entrypoint exists');
 const {prepareCodexLocalFixture}=await import('../../scripts/prepare-codex-local-fixture');
 const root=mkdtempSync(join(tmpdir(),'ns-prepare-'));
 const report=await prepareCodexLocalFixture(root,0);
 assert.equal(report.toolNames.length,14); assert.equal(report.skillNames.length,5);
 assert.equal(report.externalAttempts,0); assert.equal(report.hostInstallationVerified,false);
 const config=JSON.parse(readFileSync(join(root,'plugin','mcp.json'),'utf8'));
 assert.equal(config.mcpServers.nightsky.url,report.endpoint);
 await assert.rejects(fetch(report.endpoint));
});

test('opt-in WeatherAPI-format fixture exposes its synthetic notice without provider access',async()=>{
 const server=await createFixtureServer(mkdtempSync(join(tmpdir(),'ns-weatherapi-notice-')),{mode:'api',weatherApiNotice:true});
 try {
  const resolved=await server.rpc('tools/call',{name:'resolve_place',arguments:{placeQuery:'Fictionvale'}});
  const {placeId,sourceRevision}=resolved.result.structuredContent.matches[0];
  const weather=await server.rpc('tools/call',{name:'get_night_conditions',arguments:{placeId,sourceRevision,window:{startUtc:'2026-10-15T18:00:00Z',endUtc:'2026-10-16T00:00:00Z',timeZone:'Europe/London'}}});
  assert.equal(weather.result.isError,undefined);
  const answer=weather.result.content[0].text;
  assert.match(answer,/WeatherAPI\.com weather notice:.*Forecasts are probabilistic/);
  assert.match(answer,/Synthetic fixture only; no WeatherAPI request or real forecast/);
  assert.equal(server.externalAttempts(),0);
 } finally {await server.close();}
});

test('opt-in OpenWeather fixture exposes visible linked credit and logo without provider access',async()=>{
 const server=await createFixtureServer(mkdtempSync(join(tmpdir(),'ns-openweather-credit-')),{mode:'api',openWeatherCredit:true});
 try {
  const resolved=await server.rpc('tools/call',{name:'resolve_place',arguments:{placeQuery:'Fictionvale'}});
  const {placeId,sourceRevision}=resolved.result.structuredContent.matches[0];
  const weather=await server.rpc('tools/call',{name:'get_night_conditions',arguments:{placeId,sourceRevision,window:{startUtc:'2026-10-15T18:00:00Z',endUtc:'2026-10-16T00:00:00Z',timeZone:'Europe/London'}}});
  assert.equal(weather.result.isError,undefined);
  const answer=weather.result.content[0].text;
  assert.match(answer,/Weather data provided by OpenWeather/);
  assert.match(answer,/!\[OpenWeather logo\]\(<https:\/\/nightsky\.earth\/openweather-logo\.png>\)/);
  assert.match(answer,/Synthetic fixture only; no OpenWeather request or real forecast/);
  const tools=await server.rpc('tools/list',{});
  assert.equal(tools.result.tools.find((tool:any)=>tool.name==='plan_observing_session')._meta.ui.resourceUri,'ui://nightsky/planning-card-v2.html');
  const resource=await server.rpc('resources/read',{uri:'ui://nightsky/planning-card-v2.html'});
  assert.match(resource.result.contents[0].text,/OpenWeather forecast samples/);
  assert.deepEqual(resource.result.contents[0]._meta.ui.csp.resourceDomains,['https://nightsky.earth']);
  const plan=await server.rpc('tools/call',{name:'plan_observing_session',arguments:{placeId,sourceRevision,activity:'general-stargazing',window:{startUtc:'2026-10-15T18:00:00Z',endUtc:'2026-10-15T22:00:00Z',timeZone:'Europe/London'}}});
  const card=plan.result._meta.nightskyResultCard;
  assert.equal(card.status,'available');
  assert.deepEqual(card.openWeather.samples,[{time:'Oct 15, 2026, 23:00 (Europe/London) (instant)',cloud:'12% total cloud cover'}]);
  assert.equal(card.openWeather.logoUrl,'https://nightsky.earth/openweather-logo.png');
  assert.doesNotMatch(card.details,/12 %|12% total cloud cover/);
  assert.equal(server.externalAttempts(),0);
 } finally {await server.close();}
});

test('native fixture declares synthetic provenance and clock while retaining expiry', async()=>{
 const server=await createFixtureServer(mkdtempSync(join(tmpdir(),'ns-provenance-')),{mode:'api'});
 try {
  const resolved=await server.rpc('tools/call',{name:'resolve_place',arguments:{placeQuery:'Fictionvale'}});
  assert.match(resolved.result.content[0].text,/synthetic.*fixture/i);
  assert.match(resolved.result.content[0].text,/2026-10-15T12:00:00/);
  assert.match(resolved.result.content[0].text,/wall.clock/i);
  const match=resolved.result.structuredContent.matches[0];
  assert.match(match.fetchedAt,/^2026-10-15T/);
  assert.match(match.expiresAt,/^2026-10-15T/);
  assert.match(resolved.result.structuredContent.availability.reason,/Synthetic offline fixture/);
  assert.ok(resolved.result.structuredContent.sources.every((s:{name:string})=>/synthetic/i.test(s.name)));
  const selected={placeId:match.placeId,sourceRevision:match.sourceRevision};
  const details=await server.rpc('tools/call',{name:'get_observing_location_details',arguments:selected});
  assert.equal(details.result.isError,undefined);
  assert.match(details.result.content[0].text,/synthetic/i);
  server.advanceFixtureTime(3600001);
  const expired=await server.rpc('tools/call',{name:'get_observing_location_details',arguments:selected});
  assert.equal(expired.result.isError,true);
  assert.equal(server.externalAttempts(),0);
 } finally {await server.close();}
});

test('human listener closes at its requested duration and reports bounded fixture context',async()=>{
 const {prepareCodexLocalFixture}=await import('../../scripts/prepare-codex-local-fixture');
 const root=mkdtempSync(join(tmpdir(),'ns-duration-'));
 const report=await prepareCodexLocalFixture(root,0,true,1);
 assert.equal(report.sessionSeconds,1);
 assert.equal(report.listenerRunning,false);
 assert.equal(report.fixtureClock.start,'2026-10-15T12:00:00Z');
 const listener=JSON.parse(readFileSync(join(root,'listener-report.json'),'utf8'));
 assert.equal(listener.listenerRunning,false);
 assert.equal(listener.externalAttempts,0);
 await assert.rejects(fetch(report.endpoint));
});

test('human session duration is explicit and bounded without changing model or tool caps',async()=>{
 const {validateFixtureSessionSeconds}=await import('../../scripts/prepare-codex-local-fixture');
 assert.equal(validateFixtureSessionSeconds(),600);
 assert.equal(validateFixtureSessionSeconds(1800),1800);
 for(const invalid of [0,-1,1801,1.5,Infinity,NaN]) assert.throws(()=>validateFixtureSessionSeconds(invalid));
 const {limits}=await import('../../scripts/complete-model-journey-test');
 assert.equal(limits.deadlineMs,120000);assert.equal(limits.calls,12);
});
