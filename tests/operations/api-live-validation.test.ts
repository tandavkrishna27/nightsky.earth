import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createLiveGuard, ENVELOPE, runValidation, selectPublicRecord, checkedValidationQuota, forecastValidationFacts } from '../../scripts/validate-api-live';
import { initializeProviderQuota } from '../../scripts/initialize-provider-quota';
import { parseLocationForecast } from '../../server/providers/weather/metNorway';

const geo = (text='Hanle, India') => `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(text)}&limit=5&format=geojson&apiKey=sentinel`;
const setup = (extra:Record<string,unknown>={}) => {
 let calls=0;
 const guard=createLiveGuard({approved:ENVELOPE, providers:['geoapify','met','weatherapi','openweather'], fetcher:async()=>{calls++;return new Response('{}');}, persist:async()=>{}, ...extra} as any);
 guard.selectCase('Hanle, India', {latitude:32.8,longitude:78.9});
 return {guard,count:()=>calls};
};
test('quota reserve exceptions stop validation and expose only generic errors',async()=>{
 let stopped=false;const quota=checkedValidationQuota({reserve:async()=>{throw Error('sentinel');},setProviderState:async()=>{}},()=>{stopped=true;});
 await assert.rejects(quota.reserve('weatherapi',1),/^Error: Validation request refused\.$/);assert.equal(stopped,true);
});
test('default run is offline; unapproved guard refuses before fetch',async()=>{
 assert.equal((await runValidation([],{})).mode,'offline');
 const {guard,count}=setup({approved:''});
 await assert.rejects(guard.fetcher(geo())); assert.equal(count(),0); guard.close();
});
test('strict endpoints, query and duplicate attempts are blocked',async()=>{
 const {guard,count}=setup();
 for(const url of ['https://secure.geonames.org/timezoneJSON',geo()+'&extra=1',geo().replace('Hanle','Munnar')]) await assert.rejects(guard.fetcher(url));
 await guard.fetcher(geo()); await assert.rejects(guard.fetcher(geo())); assert.equal(count(),1); guard.close();
});
test('three per provider and twelve overall, no redistribution',async()=>{
 const {guard,count}=setup();
 for(const name of ['Hanle, India','Kodaikanal, India','Munnar, India']) {
  guard.selectCase(name,{latitude:32.8,longitude:78.9});
  await guard.fetcher(geo(name));
  await guard.fetcher('https://api.met.no/weatherapi/locationforecast/2.0/complete?lat=32.8000&lon=78.9000');
  await guard.fetcher('https://api.weatherapi.com/v1/forecast.json?q=32.8,78.9&days=3&aqi=no&alerts=no&key=sentinel');
  await guard.fetcher('https://api.openweathermap.org/data/2.5/forecast?lat=32.8&lon=78.9&units=metric&cnt=40&appid=sentinel');
 }
 assert.equal(count(),12); await assert.rejects(guard.fetcher(geo('Munnar, India'))); assert.equal(count(),12); guard.close();
 const skipped=setup({providers:['geoapify']});
 await assert.rejects(skipped.guard.fetcher('https://api.met.no/weatherapi/locationforecast/2.0/complete?lat=32.8000&lon=78.9000')); assert.equal(skipped.count(),0); skipped.guard.close();
});
test('deadline and failed journal fail closed',async()=>{
 let now=0; const timed=setup({now:()=>now}); now=600001;
 await assert.rejects(timed.guard.fetcher(geo())); assert.equal(timed.count(),0); timed.guard.close();
 const disk=setup({persist:async()=>{throw Error('sentinel');}});
 await assert.rejects(disk.guard.fetcher(geo()),/Validation request refused/); assert.equal(disk.count(),0); disk.guard.close();
});
test('streaming size, redirects and network errors produce only safe diagnostics',async()=>{
 for(const fetcher of [async()=>new Response('x'.repeat(262145)),async()=>new Response(null,{status:302,headers:{location:'https://secret.invalid'}}),async()=>{throw Error('sentinel');}]) {
  const {guard}=setup({fetcher}); await assert.rejects(guard.fetcher(geo()),/Validation request refused/);
  assert.equal(JSON.stringify(guard.attempts).includes('sentinel'),false); guard.close();
 }
});
test('deadline aborts stalled body without retry',async()=>{
 let signal:AbortSignal|undefined; let calls=0;
 const {guard}=setup({attemptTimeoutMs:10,fetcher:async(_u:unknown,init:RequestInit)=>{calls++;signal=init.signal!;return new Response(new ReadableStream({start(){}}));}});
 await assert.rejects(guard.fetcher(geo()),/Validation request refused/); assert.equal(signal?.aborted,true); assert.equal(calls,1); assert.ok(guard.attempts[0].elapsedMs>0); guard.close();
});
test('failed and oversized attempts retain elapsed dispatch time',async()=>{
 for(const oversized of [false,true]) {let now=0;const {guard}=setup({now:()=>now,fetcher:async()=>{now=37;if(oversized)return new Response('x'.repeat(262145));throw Error('sentinel');}});
  await assert.rejects(guard.fetcher(geo()));assert.equal(guard.attempts[0].elapsedMs,37);guard.close();
 }
});
test('uncooperative fetch cannot hold the deadline and journal failures block later calls',async()=>{
 const stalled=setup({attemptTimeoutMs:10,fetcher:async()=>new Promise<Response>(()=>{})});
 await assert.rejects(stalled.guard.fetcher(geo()));stalled.guard.close();
 let writes=0;const disk=setup({persist:async()=>{if(++writes>1)throw Error('sentinel');}});
 await disk.guard.fetcher(geo());disk.guard.selectCase('Munnar, India');
 await assert.rejects(disk.guard.fetcher(geo('Munnar, India')));assert.equal(disk.count(),1);disk.guard.close();
});
test('selection refuses ambiguity, missing timezone and unrelated geography',()=>{
 const record:any={name:'Hanle',latitude:32.8,longitude:78.9,timeZoneEvidence:{status:'verified',timeZone:'Asia/Kolkata'}};
 assert.ok(selectPublicRecord('Hanle, India',[{record}]));
 assert.equal(selectPublicRecord('Hanle, India',[{record},{record}]),undefined);
 assert.equal(selectPublicRecord('Hanle, India',[{record:{...record,timeZoneEvidence:{status:'unknown'}}}]),undefined);
 assert.equal(selectPublicRecord('Hanle, India',[{record:{...record,latitude:1}}]),undefined);
});
test('full synthetic runner never stores hostile upstream fields and unknown timezone has no follow-up',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'live-validation-'));
 const env={NIGHTSKY_DISCOVERY_MODE:'api',NIGHTSKY_LIVE_APPROVED_ENVELOPE:ENVELOPE,NIGHTSKY_LIVE_GEOAPIFY_ADMITTED:'yes',NIGHTSKY_LIVE_BATCH_ID:'synthetic',NIGHTSKY_QUOTA_STATE_PATH:join(dir,'quota.json'),NIGHTSKY_GEOAPIFY_API_KEY:'sentinel',NIGHTSKY_WEATHER_PROVIDERS:'met,weatherapi,openweather',NIGHTSKY_WEATHER_ADMITTED_PROVIDERS:'weatherapi,openweather',NIGHTSKY_WEATHERAPI_KEY:'sentinel',NIGHTSKY_OPENWEATHER_KEY:'sentinel',MET_NORWAY_USER_AGENT:'NightSky.earth https://nightsky.earth/contact'};
 let calls=0;let known=true;
 const fetcher:typeof fetch=async input=>{calls++;const url=new URL(String(input));const fixtureNow=Date.now();
  if(url.hostname==='api.met.no')return Response.json({type:'Feature',geometry:{type:'Point',coordinates:[Number(url.searchParams.get('lon')),Number(url.searchParams.get('lat')),0]},properties:{meta:{updated_at:new Date().toISOString(),units:{cloud_area_fraction:'%'}},timeseries:[3600000,7200000].map(offset=>({time:new Date(fixtureNow+offset).toISOString(),data:{instant:{details:{cloud_area_fraction:20}}}}))}},{headers:{Expires:new Date(Date.now()+60000).toUTCString(),'Last-Modified':new Date().toUTCString()}});
  if(url.hostname==='api.openweathermap.org')return Response.json({cod:'200',list:[3600,14400].map(offset=>({dt:Math.floor(fixtureNow/1000)+offset,main:{temp:12},clouds:{all:20}}))});
  if(url.hostname==='api.weatherapi.com')return Response.json({hostile:'sentinel',forecast:{forecastday:[{hour:[3600,7200].map(offset=>({time_epoch:Math.floor(fixtureNow/1000)+offset,cloud:20}))}]}});
  const name=url.searchParams.get('text')!.split(',')[0];const latitude=name==='Hanle'?32.812345:name==='Munnar'?10.1:10;const longitude=name==='Hanle'?78.912345:77;
  return Response.json({features:[{geometry:{type:'Point',coordinates:[longitude,latitude]},properties:{place_id:name,name,...(known?{timezone:{name:'Asia/Kolkata'}}:{}),datasource:{attribution:'sentinel',url:'https://sentinel.invalid'}}}]});
 };
 try {
  await initializeProviderQuota({...env,NIGHTSKY_QUOTA_VERIFIED_UNUSED_BUDGET:'yes',NIGHTSKY_QUOTA_VERIFICATION_EVIDENCE:'Synthetic test only'});
  const report=await runValidation(['--live'],env,{fetcher});assert.equal(calls,12);assert.equal(report.usableCases,3);assert.equal(JSON.stringify(report).includes('sentinel'),false);
  for(const result of report.results as any[]) {assert.equal(result.outcomes.length,3);for(const outcome of result.outcomes){assert.ok(['available','partial'].includes(outcome.status));assert.equal(outcome.samples,2);assert.deepEqual(outcome.validationFacts.uniqueIntervalSeconds,[outcome.providerId==='openweather'?10800:3600]);assert.equal(outcome.validationFacts.checks.publicSchemaValid,true);assert.equal(outcome.validationFacts.checks.unitsExpected,true);assert.equal(outcome.validationFacts.checks.samplesInsideRequestedWindow,true);assert.equal(outcome.validationFacts.fieldUnits.totalCloudCover[0],'%');assert.ok(outcome.validationFacts.firstSampleUtc);assert.ok(outcome.validationFacts.lastSampleUtc);assert.ok(outcome.validationFacts.forecastHorizonHours>0);assert.equal(outcome.validationFacts.coverage.endsAtOrAfterWindowEnd,false);}}
  const first=(report.results as any[])[0];assert.deepEqual(first.selectedPoint,{latitude:32.812345,longitude:78.912345});assert.deepEqual(first.requestedPoints.met,{latitude:32.8123,longitude:78.9123});assert.deepEqual(first.requestedPoints.weatherapi,first.selectedPoint);
  known=false;calls=0;
  const unknown=await runValidation(['--live'],{...env,NIGHTSKY_LIVE_BATCH_ID:'unknown-zone'},{fetcher});assert.equal(calls,3);assert.equal(JSON.stringify(unknown).includes('sentinel'),false);
 } finally {await rm(dir,{recursive:true,force:true});}
});
test('runner refuses missing/corrupt state, does not initialize, retains journal and redacts failures',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'live-validation-'));let calls=0;
 const env={NIGHTSKY_DISCOVERY_MODE:'api',NIGHTSKY_LIVE_APPROVED_ENVELOPE:ENVELOPE,NIGHTSKY_LIVE_GEOAPIFY_ADMITTED:'yes',NIGHTSKY_LIVE_BATCH_ID:'synthetic',NIGHTSKY_QUOTA_STATE_PATH:join(dir,'quota.json'),NIGHTSKY_GEOAPIFY_API_KEY:'sentinel',NIGHTSKY_WEATHER_PROVIDERS:'weatherapi',NIGHTSKY_WEATHER_ADMITTED_PROVIDERS:'weatherapi',NIGHTSKY_WEATHERAPI_KEY:'sentinel'};
 const dependencies={fetcher:async()=>{calls++;throw Error('sentinel');},pause:async()=>{}};
 try {
  await assert.rejects(runValidation(['--live'],env,dependencies));assert.equal(calls,0);
  await initializeProviderQuota({...env,NIGHTSKY_QUOTA_VERIFIED_UNUSED_BUDGET:'yes',NIGHTSKY_QUOTA_VERIFICATION_EVIDENCE:'Synthetic test only'});
  const report=await runValidation(['--live'],env,dependencies);
  assert.equal(JSON.stringify(report).includes('sentinel'),false);assert.ok(calls<=3);
  const before=calls;await assert.rejects(runValidation(['--live'],env,dependencies));assert.equal(calls,before);
  await writeFile(env.NIGHTSKY_QUOTA_STATE_PATH,'corrupt');
  const corrupt=await runValidation(['--live'],{...env,NIGHTSKY_LIVE_BATCH_ID:'second'},dependencies);assert.equal(corrupt.status,'stopped');assert.equal(calls,before);
 } finally {await rm(dir,{recursive:true,force:true});}
});
test('last-case auth/backoff persistence failure stops report and aborts active MET',async()=>{
 for(const status of [401,429]) {
  const dir=await mkdtemp(join(tmpdir(),'live-validation-'));let metSignal:AbortSignal|undefined;
  const env={NIGHTSKY_DISCOVERY_MODE:'api',NIGHTSKY_LIVE_APPROVED_ENVELOPE:ENVELOPE,NIGHTSKY_LIVE_GEOAPIFY_ADMITTED:'yes',NIGHTSKY_LIVE_BATCH_ID:'synthetic',NIGHTSKY_QUOTA_STATE_PATH:join(dir,'quota.json'),NIGHTSKY_GEOAPIFY_API_KEY:'sentinel',NIGHTSKY_WEATHER_PROVIDERS:'met,weatherapi',NIGHTSKY_WEATHER_ADMITTED_PROVIDERS:'weatherapi',NIGHTSKY_WEATHERAPI_KEY:'sentinel',MET_NORWAY_USER_AGENT:'NightSky.earth https://nightsky.earth/contact'};
  const fetcher:typeof fetch=async(input,init)=>{const url=new URL(String(input));
   if(url.hostname==='api.met.no'){metSignal=init!.signal!;return new Promise<Response>(()=>{});}
   if(url.hostname==='api.weatherapi.com'){await writeFile(env.NIGHTSKY_QUOTA_STATE_PATH,'corrupt');return Response.json({error:{code:2006,message:'sentinel'}},{status});}
   const name=url.searchParams.get('text')!.split(',')[0];
   return Response.json({features:name==='Munnar'?[{geometry:{type:'Point',coordinates:[77.123456,10.123456]},properties:{place_id:name,name,timezone:{name:'Asia/Kolkata'}}}]:[]});
  };
  try {
   await initializeProviderQuota({...env,NIGHTSKY_QUOTA_VERIFIED_UNUSED_BUDGET:'yes',NIGHTSKY_QUOTA_VERIFICATION_EVIDENCE:'Synthetic test only'});
   const report=await runValidation(['--live'],env,{fetcher,pause:async()=>{}});
   assert.equal(report.status,'stopped');assert.equal(metSignal?.aborted,true);assert.equal(report.attempts?.length,5);assert.equal(JSON.stringify(report).includes('sentinel'),false);
  } finally {await rm(dir,{recursive:true,force:true});}
 }
});

test('derived forecast facts preserve mixed cadence, gaps, missing fields and unit failures without values',()=>{
 const window={startUtc:'2026-10-17T00:00:00Z',endUtc:'2026-10-18T00:00:00Z',timeZone:'Asia/Kolkata'};
 const forecast:any={availability:{status:'partial',reason:'test'},source:{name:'Fixture',url:'https://example.invalid',attribution:'Fixture',dataClass:'forecast'},forecastHorizonHours:48,samples:[1,2,5].map(hour=>({validAt:`2026-10-17T0${hour}:00:00Z`,values:{totalCloudCover:{value:987654,unit:'%'}}})),missingFields:[{field:'windSpeed',reason:'absent'}]};
 const facts=forecastValidationFacts(forecast,window);assert.deepEqual(facts.uniqueIntervalSeconds,[3600,10800]);assert.equal(facts.forecastHorizonHours,48);assert.equal(facts.sampleSpanHours,4);assert.deepEqual(facts.missingFields,['windSpeed']);assert.equal(JSON.stringify(facts).includes('987654'),false);
 forecast.samples[0].values.totalCloudCover.unit='sentinel';const bad=forecastValidationFacts(forecast,window);assert.equal(bad.checks.unitsExpected,false);assert.equal(JSON.stringify(bad).includes('sentinel'),false);
 assert.equal(forecastValidationFacts(undefined,window).checks.publicSchemaValid,false);
});
test('MET celsius aliases and overlapping periods are valid without importing earlier instantaneous weather',()=>{
 const window={startUtc:'2026-10-17T06:54:00Z',endUtc:'2026-10-17T08:54:00Z',timeZone:'Asia/Kolkata'};
 const payload={properties:{meta:{updated_at:'2026-10-17T06:00:00Z',units:{air_temperature:'celsius',dew_point_temperature:'celsius',precipitation_amount:'mm'}},timeseries:[6,7,8].map(hour=>({time:`2026-10-17T0${hour}:00:00Z`,data:{instant:{details:{air_temperature:12,dew_point_temperature:8}},next_1_hours:{details:{precipitation_amount:1}}}}))}};
 const result=parseLocationForecast(payload,{placeId:'fixture',latitude:32.8,longitude:78.9},window,{checkedAt:'2026-10-17T06:54:00Z'});
 assert.ok(result.forecast);assert.equal(result.forecast.samples[0].values.temperature,undefined);
 const facts=forecastValidationFacts(result.forecast,window,'met');
 assert.equal(facts.checks.unitsExpected,true);assert.deepEqual(facts.fieldUnits.temperature,['celsius']);assert.deepEqual(facts.fieldUnits.dewPoint,['celsius']);
 assert.equal(facts.checks.samplesInsideRequestedWindow,false);assert.equal(facts.checks.valuesRelevantToWindow,true);assert.equal(facts.checks.instantaneousValuesInsideWindow,true);assert.equal(facts.checks.intervalsOverlapWindow,true);
 assert.equal(facts.temporalEvidence.intervalValueCount,3);assert.equal(facts.temporalEvidence.earliestIntervalStartUtc,'2026-10-17T06:00:00.000Z');assert.equal(facts.temporalEvidence.latestIntervalEndUtc,'2026-10-17T09:00:00.000Z');
 const invalid=structuredClone(result.forecast);invalid.samples[0].values.temperature={value:12,unit:'celsius'};
 assert.equal(forecastValidationFacts(invalid,window,'met').checks.valuesRelevantToWindow,false);
 invalid.samples[0].values.precipitationAmount!.periodStartUtc='2026-10-17T04:00:00Z';invalid.samples[0].values.precipitationAmount!.periodEndUtc='2026-10-17T05:00:00Z';
 assert.equal(forecastValidationFacts(invalid,window,'met').checks.intervalsOverlapWindow,false);
});
