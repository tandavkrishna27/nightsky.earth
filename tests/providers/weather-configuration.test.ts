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

test('quota configuration rejects relative network and alternate stream paths',()=>{
 for(const path of ['private/quota.json','../quota','//server/share/quota','\\\\server\\share\\quota','C:/private/quota:secret','C:quota']) assert.throws(()=>parseWeatherConfiguration({NIGHTSKY_QUOTA_STATE_PATH:path}),/Invalid weather quota/);
 assert.equal(parseWeatherConfiguration({NIGHTSKY_QUOTA_STATE_PATH:join(tmpdir(),'quota.json')}).quotaPath,join(tmpdir(),'quota.json'));
});
import { fork } from 'node:child_process';
import { writeFile, access } from 'node:fs/promises';
import { once } from 'node:events';
import { pathToFileURL } from 'node:url';
test('standalone graceful SIGTERM and SIGINT release quota for immediate restart',async(t)=>{
 const dir=await mkdtemp(join(tmpdir(),'quota-signals-'));
 const probe=createServer();await new Promise<void>(done=>probe.listen(0,'127.0.0.1',done));const address=probe.address();assert.ok(address&&typeof address!=='string');const port=address.port;await new Promise<void>(done=>probe.close(()=>done()));
 const script=join(dir,'child.mjs');const quotaPath=join(dir,'quota.json');
 await writeFile(script,`import {startNightSkyPlugin} from ${JSON.stringify(pathToFileURL(join(process.cwd(),'server/plugin.ts')).href)};\nawait startNightSkyPlugin({gracefulSignals:true,shutdownTimeoutMs:2000});\nprocess.on('message', signal => {process.disconnect();process.emit(signal);});\nprocess.send('ready');`);
 try {
 for(const signal of ['SIGTERM','SIGINT'] as const) {
  const child=fork(script,[],{execArgv:['--import','tsx'],env:{...process.env,HOST:'127.0.0.1',PORT:String(port),NIGHTSKY_DISCOVERY_MODE:'api',NIGHTSKY_MCP_TOOL_MODE:'resolver-only',NIGHTSKY_QUOTA_STATE_PATH:quotaPath},silent:true});
  let stderr='';child.stderr?.on('data',data=>stderr+=data);
  try {
   await Promise.race([once(child,'message'),new Promise((_,reject)=>setTimeout(()=>reject(Error('child startup timed out: '+stderr)),4000).unref())]);
   const exited=once(child,'exit');
   // Windows kill() terminates forcibly and cannot deliver Unix signals. Emit the
   // same process signal event through IPC there; POSIX exercises real delivery.
   if(process.platform==='win32'){t.diagnostic('Windows exercises Node signal handler via IPC event; OS kill is forceful.');child.send(signal);}else{child.disconnect();child.kill(signal);}
   const result=await Promise.race([exited,new Promise<never>((_,reject)=>setTimeout(()=>reject(Error('child shutdown timed out')),4000).unref())]);
   assert.equal(result[0],0,stderr);
   const quota=await createPersistentQuota({path:quotaPath,now:Date.now,policies:PROVIDER_QUOTA_POLICIES});await quota.close();
  }finally {if(child.exitCode===null)child.kill();}
 }
 }finally {await rm(dir,{recursive:true,force:true});}
});
import { connect } from 'node:net';
test('bounded shutdown with an undrained connection retains the quota crash lock',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'quota-drain-'));const probe=createServer();await new Promise<void>(done=>probe.listen(0,'127.0.0.1',done));const address=probe.address();assert.ok(address&&typeof address!=='string');const port=address.port;await new Promise<void>(done=>probe.close(()=>done()));
 const script=join(dir,'child.mjs');const quotaPath=join(dir,'quota.json');await writeFile(script,`import {startNightSkyPlugin} from ${JSON.stringify(pathToFileURL(join(process.cwd(),'server/plugin.ts')).href)};const server=await startNightSkyPlugin({gracefulSignals:true,shutdownTimeoutMs:150});server.on('request',()=>process.send('request-active'));process.on('message',()=>{process.disconnect();process.emit('SIGTERM');});process.send('ready');`);
 const child=fork(script,[],{execArgv:['--import','tsx'],env:{...process.env,HOST:'127.0.0.1',PORT:String(port),NIGHTSKY_DISCOVERY_MODE:'api',NIGHTSKY_MCP_TOOL_MODE:'resolver-only',NIGHTSKY_QUOTA_STATE_PATH:quotaPath},silent:true});let socket:ReturnType<typeof connect>|undefined;
 try {
  await Promise.race([once(child,'message'),new Promise((_,reject)=>setTimeout(()=>reject(Error('startup timeout')),4000).unref())]);
  socket=connect(port,'127.0.0.1');socket.on('error',()=>{});await once(socket,'connect');const activeRequest=once(child,'message');
  // Complete headers start a real HTTP request; its deliberately incomplete
  // JSON body keeps Express waiting while the child confirms request receipt.
  socket.write('POST /mcp HTTP/1.1\r\nHost: localhost\r\nContent-Type: application/json\r\nContent-Length: 100\r\n\r\n{');
  const acknowledgement=await Promise.race([activeRequest,new Promise<never>((_,reject)=>setTimeout(()=>reject(Error('server never acknowledged active HTTP request')),4000).unref())]);assert.equal(acknowledgement[0],'request-active');
  const exited=once(child,'exit');child.send('shutdown');const result=await Promise.race([exited,new Promise<never>((_,reject)=>setTimeout(()=>reject(Error('shutdown timeout')),4000).unref())]);assert.equal(result[0],1);
  await access(quotaPath+'.lock');await assert.rejects(createPersistentQuota({path:quotaPath,now:Date.now,policies:PROVIDER_QUOTA_POLICIES}));
 }finally {socket?.destroy();if(child.exitCode===null){child.kill();await once(child,'exit');}await rm(dir,{recursive:true,force:true});}
});
