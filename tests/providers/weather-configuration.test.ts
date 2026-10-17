import assert from 'node:assert/strict';
import test from 'node:test';
import { parseWeatherConfiguration, createConfiguredWeatherCollection, PROVIDER_QUOTA_POLICIES } from '../../server/providers/weather/configuration';
const window = {startUtc:'2026-10-17T18:00:00Z',endUtc:'2026-10-17T21:00:00Z',timeZone:'UTC'};
const place = {placeId:'test',latitude:0,longitude:0};
test('provider selection rejects unknown duplicates whitespace and malformed private credentials without echo',()=>{
  for(const value of ['', 'met,met','other',' met','met,']) assert.throws(()=>parseWeatherConfiguration({NIGHTSKY_WEATHER_PROVIDERS:value}),/Invalid weather/);
  assert.throws(()=>parseWeatherConfiguration({NIGHTSKY_WEATHERAPI_KEY:'secret value'}), e => !String(e).includes('secret value'));
  assert.throws(()=>parseWeatherConfiguration({NIGHTSKY_WEATHER_PROVIDERS:'met',NIGHTSKY_WEATHER_ADMITTED_PROVIDERS:'weatherapi'}));
});
test('default retains legacy MET and explicit new sources require key admission and durable quota',async()=>{
  assert.equal(createConfiguredWeatherCollection({}),undefined);
  let calls=0; const fetcher=(async()=>{calls++;throw Error('must not fetch');}) as typeof fetch;
  for(const extra of [{},{NIGHTSKY_WEATHERAPI_KEY:'private-key'},{NIGHTSKY_WEATHERAPI_KEY:'private-key',NIGHTSKY_WEATHER_ADMITTED_PROVIDERS:'weatherapi'}]) {
    const collection=createConfiguredWeatherCollection({NIGHTSKY_WEATHER_PROVIDERS:'weatherapi',...extra},{fetcher})!;
    const result=await collection.getForecasts(place,window);
    assert.equal(result.outcomes[0].result.status,'unavailable');
    assert.ok(!JSON.stringify(result).includes('private-key'));
  }
  assert.equal(calls,0);
});
test('shared policy identity survives provider subset rollback',()=>{
 assert.deepEqual(PROVIDER_QUOTA_POLICIES.map(p=>p.providerId),['geonames','geoapify','weatherapi','openweather']);
 const a=parseWeatherConfiguration({NIGHTSKY_WEATHER_PROVIDERS:'met,weatherapi'});
 const b=parseWeatherConfiguration({NIGHTSKY_WEATHER_PROVIDERS:'met'});
 assert.deepEqual(a.providers,['met','weatherapi']);assert.deepEqual(b.providers,['met']);
});
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createConfiguredNightSkyPluginApp, closeConfiguredNightSkyPluginApp, createNightSkyPluginApp } from '../../server/plugin';
import { createPersistentQuota } from '../../server/providers/quotaState';
test('app rejects conflicting legacy and collection injection',()=>{
 assert.throws(()=>createNightSkyPluginApp({weatherProvider:{getForecast:async()=>({status:'unavailable',reason:'test'})},weatherCollection:{getForecasts:async()=>({outcomes:[]})}}),/weather/i);
});
test('configured runtime shares one quota ownership and releases it on app close and startup failure',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'weather-config-')); const saved={...process.env};
 try {
  process.env.NIGHTSKY_QUOTA_STATE_PATH=join(dir,'quota.json'); process.env.NIGHTSKY_DISCOVERY_MODE='api';process.env.NIGHTSKY_MCP_TOOL_MODE='resolver-only';
  process.env.NIGHTSKY_GEOAPIFY_API_KEY='synthetic-key';process.env.NIGHTSKY_WEATHER_PROVIDERS='weatherapi';
  const app=await createConfiguredNightSkyPluginApp({fetcher:(async()=>{throw Error('no startup network');}) as typeof fetch});
  await assert.rejects(createPersistentQuota({path:process.env.NIGHTSKY_QUOTA_STATE_PATH,now:Date.now,policies:PROVIDER_QUOTA_POLICIES}));
  await closeConfiguredNightSkyPluginApp(app);
  const quota=await createPersistentQuota({path:process.env.NIGHTSKY_QUOTA_STATE_PATH,now:Date.now,policies:PROVIDER_QUOTA_POLICIES});await quota.close();
  process.env.NIGHTSKY_GEOAPIFY_API_KEY='invalid key';
  await assert.rejects(createConfiguredNightSkyPluginApp());
  const reopened=await createPersistentQuota({path:process.env.NIGHTSKY_QUOTA_STATE_PATH,now:Date.now,policies:PROVIDER_QUOTA_POLICIES});await reopened.close();
 } finally {process.env=saved;await rm(dir,{recursive:true,force:true});}
});
import { initializeProviderQuota } from '../../scripts/initialize-provider-quota';
import { createServer } from 'node:http';
import { startNightSkyPlugin } from '../../server/plugin';
test('initialization is explicit and serving startup never replenishes a missing checkpoint',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'quota-init-')); const path=join(dir,'state.json');
 try {
  await assert.rejects(initializeProviderQuota({NIGHTSKY_QUOTA_STATE_PATH:path}));
  await initializeProviderQuota({NIGHTSKY_QUOTA_STATE_PATH:path,NIGHTSKY_QUOTA_VERIFIED_UNUSED_BUDGET:'yes',NIGHTSKY_QUOTA_VERIFICATION_EVIDENCE:'synthetic unused account budget verification'});
  const quota=await createPersistentQuota({path,now:Date.now,policies:PROVIDER_QUOTA_POLICIES});assert.equal((await quota.reserve('weatherapi',1)).allowed,true);await quota.close();
  await assert.rejects(initializeProviderQuota({NIGHTSKY_QUOTA_STATE_PATH:path,NIGHTSKY_QUOTA_VERIFIED_UNUSED_BUDGET:'yes',NIGHTSKY_QUOTA_VERIFICATION_EVIDENCE:'cannot overwrite existing quota'}));
 }finally {await rm(dir,{recursive:true,force:true});}
});
test('listener startup failure releases durable quota ownership',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'quota-listener-'));const saved={...process.env};const occupied=createServer();
 await new Promise<void>(done=>occupied.listen(0,'127.0.0.1',done));
 try {
  const address=occupied.address();assert.ok(address&&typeof address!=='string');
  Object.assign(process.env,{HOST:'127.0.0.1',PORT:String(address.port),NIGHTSKY_DISCOVERY_MODE:'api',NIGHTSKY_MCP_TOOL_MODE:'resolver-only',NIGHTSKY_QUOTA_STATE_PATH:join(dir,'quota.json')});
  await assert.rejects(startNightSkyPlugin());
  const quota=await createPersistentQuota({path:process.env.NIGHTSKY_QUOTA_STATE_PATH!,now:Date.now,policies:PROVIDER_QUOTA_POLICIES});await quota.close();
 }finally {process.env=saved;await new Promise<void>(done=>occupied.close(()=>done()));await rm(dir,{recursive:true,force:true});}
});
