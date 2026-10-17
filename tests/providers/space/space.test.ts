import assert from 'node:assert/strict';
import test from 'node:test';
import { createSpaceProviders } from '../../../server/providers/space/index';
const quota = { reserve: async () => ({ allowed: true, reason: 'ok' }) };
const request = { eventType: 'FLR' as const, startDate: '2026-10-01', endDate: '2026-10-02' };
test('DONKI validates range before network and requires a configured key', async () => {
 let calls = 0; const p = createSpaceProviders({ quota, fetcher: async () => { calls++; throw Error('secret'); } });
 assert.equal((await p.getSpaceWeather(request)).status, 'unavailable');
 assert.equal((await p.getSpaceWeather({...request, startDate:'2026-02-30'})).status, 'invalid-input');
 assert.equal(calls, 0);
});
test('DONKI normalizes flare context and strips extra upstream fields', async () => {
 const p = createSpaceProviders({nasaEnabled:true,jplEnabled:true,quota,nasaApiKey:'private-key', fetcher: async (url,init) => {
  assert.equal(new URL(String(url)).hostname,'api.nasa.gov'); assert.equal(init?.redirect,'error');
  return Response.json([{flrID:'2026-10-01T01:00:00-FLR-001',beginTime:'2026-10-01T01:00Z',classType:'M1.2', secret:'private-key'}]);
 }});
 const r = await p.getSpaceWeather(request); assert.equal(r.status,'available'); assert.equal(r.events?.[0].classType,'M1.2'); assert.match(r.reason,/local aurora/); assert.ok(!JSON.stringify(r).includes('private-key'));
});
test('JPL requests share serialization and never receive NASA credentials', async () => {
 let active=0,max=0; const fetcher: typeof fetch = async url => {
  active++; max=Math.max(max,active); assert.ok(!String(url).includes('private-key')); assert.ok(!String(url).includes('api_key'));
  await new Promise(r=>setTimeout(r,5)); active--; return Response.json({signature:{version:'1.3'},object:{spkid:'2000433',des:'433',fullname:'433 Eros',neo:true,pha:false,kind:'an'}});
 };
 const a=createSpaceProviders({nasaEnabled:true,jplEnabled:true,quota,fetcher,nasaApiKey:'private-key'}), b=createSpaceProviders({nasaEnabled:true,jplEnabled:true,quota,fetcher});
 const results=await Promise.all([a.resolveSmallBody({query:'Eros'}), b.resolveSmallBody({query:'433'})]);
 assert.equal(max,1); assert.equal(results[0].object?.spkId,'2000433');
});
test('quota denial and upstream failures are redacted', async () => {
 let calls=0; const fetcher:typeof fetch=async()=>{calls++;throw Error('private-key URL')};
 const p=createSpaceProviders({nasaEnabled:true,jplEnabled:true,quota:{reserve:async()=>({allowed:false,reason:'private-key'})},fetcher,nasaApiKey:'private-key'});
 const r=await p.getSpaceWeather(request); assert.equal(calls,0); assert.ok(!JSON.stringify(r).includes('private-key'));
 const b=createSpaceProviders({nasaEnabled:true,jplEnabled:true,quota,fetcher}); assert.ok(!JSON.stringify(await b.resolveSmallBody({query:'Eros'})).includes('private-key'));
});
test('response bounds and schema version fail closed',async()=>{
 const p=createSpaceProviders({nasaEnabled:true,jplEnabled:true,quota,fetcher:async()=>Response.json({signature:{version:'9.0'},object:{}})});
 assert.equal((await p.resolveSmallBody({query:'Eros'})).status,'unavailable');
 assert.equal((await p.resolveSmallBody({query:'https://evil.test'})).status,'invalid-input');
 const b=createSpaceProviders({nasaEnabled:true,jplEnabled:true,quota,fetcher:async()=>new Response('x'.repeat(1048577))});
 assert.equal((await b.resolveSmallBody({query:'Eros'})).status,'unavailable');
});

test('keys alone do not activate providers',async()=>{
 let calls=0;const p=createSpaceProviders({quota,nasaApiKey:'private-key',fetcher:async()=>{calls++;throw Error('network')}});
 assert.equal((await p.getSpaceWeather(request)).status,'unavailable');assert.equal((await p.resolveSmallBody({query:'Eros'})).status,'unavailable');assert.equal(calls,0);
});
test('Horizons normalizes bounded observer azimuth and altitude',async()=>{
 const p=createSpaceProviders({nasaEnabled:true,jplEnabled:true,quota,fetcher:async(url)=>{
  const u=new URL(String(url));assert.equal(u.hostname,'ssd.jpl.nasa.gov');assert.equal(u.searchParams.get('SITE_COORD'),"'77,28,0.2'");assert.equal(u.searchParams.get('COMMAND'),"'2000433;'");
  return Response.json({signature:{version:'1.3'},result:'Target body name: 433 Eros (2000433)\n$$SOE\n2460401.5, , , 123.4, -12.3,\n$$EOE'});
 }});
 const result=await p.getObserverEphemeris({spkId:'2000433',latitude:28,longitude:77,elevationMeters:200,atUtc:'2024-04-01T00:00:00Z'});
 assert.equal(result.status,'available');assert.equal(result.sample?.altitudeDegrees,-12.3);
 assert.equal((await p.getObserverEphemeris({spkId:"2000433';evil",latitude:28,longitude:77,elevationMeters:200,atUtc:'2024-04-01T00:00:00Z'})).status,'invalid-input');
});


test('SBDB preserves safe ambiguity for HTTP 300',async()=>{
 const p=createSpaceProviders({jplEnabled:true,quota,fetcher:async()=>Response.json({signature:{version:'1.3'},code:300,list:[{pdes:'141P',name:'141P/Machholz 2'}]},{status:300})});
 assert.equal((await p.resolveSmallBody({query:'141P'})).status,'ambiguous');
});
test('deadline covers a stalled stream and releases its reader',async()=>{
 let cancelled=false;const p=createSpaceProviders({jplEnabled:true,quota,timeoutMs:10,fetcher:async()=>new Response(new ReadableStream({cancel(){cancelled=true}}))});
 assert.equal((await p.resolveSmallBody({query:'Eros'})).status,'unavailable');assert.equal(cancelled,true);
});

test('DONKI persists authentication disablement without exposing error payload',async()=>{
 let state:unknown;const p=createSpaceProviders({nasaEnabled:true,nasaApiKey:'private-key',quota:{...quota,setProviderState:async(_id:string,s:unknown)=>{state=s}} as typeof quota,fetcher:async()=>Response.json({error:'private-key'},{status:401})});
 const result=await p.getSpaceWeather(request);assert.equal(result.status,'unavailable');assert.deepEqual(state,{disabled:true});assert.ok(!JSON.stringify(result).includes('private-key'));
});

test('DONKI rejects normalized impossible upstream dates and times',async()=>{
 for(const beginTime of ['2026-02-30T01:00Z','2026-03-01T24:00Z']){
  const p=createSpaceProviders({nasaEnabled:true,nasaApiKey:'test',quota,fetcher:async()=>Response.json([{flrID:'bad',beginTime}])});
  const result=await p.getSpaceWeather({eventType:'FLR',startDate:'2026-03-01',endDate:'2026-03-03'});
  assert.equal(result.status,'unavailable',beginTime);
 }
});
test('space transport rejects a redirected response even from an injected fetcher',async()=>{
 const response=Response.json([{flrID:'valid',beginTime:'2026-10-01T01:00Z'}]);
 Object.defineProperty(response,'redirected',{value:true});
 const p=createSpaceProviders({nasaEnabled:true,nasaApiKey:'test',quota,fetcher:async()=>response});
 assert.equal((await p.getSpaceWeather(request)).status,'unavailable');
 assert.equal(response.body?.locked,false);
});
