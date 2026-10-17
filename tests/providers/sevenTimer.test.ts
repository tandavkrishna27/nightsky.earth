import test from 'node:test';
import assert from 'node:assert/strict';
import { createConfiguredWeatherCollection } from '../../server/providers/weather/configuration';
const place={placeId:'test',latitude:17.361,longitude:78.474};
const window={startUtc:'2026-10-17T09:00:00Z',endUtc:'2026-10-17T12:00:00Z',timeZone:'UTC'};
const fixture={product:'astro',init:'2026101706',dataseries:[{timepoint:3,cloudcover:2,seeing:1,transparency:8,rh2m:15,wind10m:{direction:'NE',speed:3},temp2m:21,prec_type:'none'},{timepoint:6,cloudcover:9,seeing:8,transparency:1,rh2m:16,wind10m:{direction:'N',speed:8},temp2m:20}]};
function collection(payload:unknown=fixture, extra:Record<string,string>={}) { return createConfiguredWeatherCollection({NIGHTSKY_WEATHER_PROVIDERS:'seventimer',NIGHTSKY_WEATHER_ADMITTED_PROVIDERS:'seventimer',...extra},{quota:{reserve:async(id,cost)=>{assert.equal(id,'seventimer');assert.equal(cost,1);return {allowed:true,reason:'test allowance'};}},now:()=>Date.parse('2026-10-17T07:00:00Z'),fetcher:(async(input,init)=>{const url=new URL(String(input));assert.equal(url.origin,'https://www.7timer.info');assert.equal(url.searchParams.get('product'),'astro');assert.equal(init?.redirect,'error');return Response.json(payload);}) as typeof fetch})!; }
test('7Timer keeps categories and native timestamps without invented exact cloud or wind values',async()=>{
 const result=(await collection().getForecasts(place,window)).outcomes[0].result;
 assert.equal(result.status,'partial');assert.equal(result.forecast?.source.issuedAt,'2026-10-17T06:00:00.000Z');
 const sample=result.forecast!.samples[0];assert.equal(sample.validAt,'2026-10-17T09:00:00.000Z');assert.equal(sample.values.totalCloudCover,undefined);assert.equal(sample.values.windSpeed,undefined);
 assert.equal(sample.values.temperature?.value,21);assert.deepEqual(sample.bands?.seeing,{code:1,range:'<0.5',unit:'arcseconds'});assert.deepEqual(sample.bands?.transparency,{code:8,range:'>1',unit:'mag/airmass'});assert.deepEqual(sample.bands?.relativeHumidity,{code:15,range:'95–99',unit:'%'});
});
test('7Timer requires selection and admission without network',async()=>{
 let calls=0;const fetcher=(async()=>{calls++;throw Error('unexpected');}) as typeof fetch;
 assert.equal(createConfiguredWeatherCollection({}, {fetcher}),undefined);
 const result=await createConfiguredWeatherCollection({NIGHTSKY_WEATHER_PROVIDERS:'seventimer'},{fetcher})!.getForecasts(place,window);
 assert.equal(result.outcomes[0].result.status,'unavailable');assert.equal(calls,0);
});
test('7Timer rejects invalid dates, duplicate times, and invalid category codes',async()=>{
 for(const payload of [{...fixture,init:'2026023006'},{...fixture,dataseries:[fixture.dataseries[0],fixture.dataseries[0]]},{...fixture,dataseries:[{...fixture.dataseries[0],seeing:9}]}]) assert.equal((await collection(payload).getForecasts(place,window)).outcomes[0].result.status,'unavailable');
});
test('7Timer distinguishes native sample gaps from horizon and preserves missing sentinels',async()=>{
 assert.equal((await collection().getForecasts(place,{...window,startUtc:'2026-10-17T10:00:00Z',endUtc:'2026-10-17T11:00:00Z'})).outcomes[0].result.status,'not-covered');
 assert.equal((await collection().getForecasts(place,{...window,startUtc:'2026-10-18T10:00:00Z',endUtc:'2026-10-18T11:00:00Z'})).outcomes[0].result.status,'out-of-horizon');
 const r=(await collection({...fixture,dataseries:[{timepoint:3,seeing:2,temp2m:-9999,cloudcover:-9999}]}).getForecasts(place,window)).outcomes[0].result;
 assert.equal(r.status,'partial');assert.equal(r.forecast?.samples[0].values.temperature,undefined);assert.equal(r.forecast?.samples[0].bands?.totalCloudCover,undefined);assert.equal(r.forecast?.samples[0].bands?.seeing?.code,2);
});

test('7Timer fails closed without durable quota or after quota denial',async()=>{
 let calls=0;const fetcher=(async()=>{calls++;return Response.json(fixture);}) as typeof fetch;
 for(const quota of [undefined,{reserve:async()=>({allowed:false,reason:'exhausted'})}]) {
  const result=await createConfiguredWeatherCollection({NIGHTSKY_WEATHER_PROVIDERS:'seventimer',NIGHTSKY_WEATHER_ADMITTED_PROVIDERS:'seventimer'},{fetcher,quota})!.getForecasts(place,window);
  assert.equal(result.outcomes[0].result.status,'unavailable');
 }
 assert.equal(calls,0);
});

import { createSevenTimerProvider } from '../../server/providers/weather/sevenTimer';
import { UpstreamControls } from '../../server/providers/upstreamControls';
test('7Timer keeps HTTP backoff and blocks redirects, oversized bodies and invalid coordinates',async()=>{
 let now=Date.parse('2026-10-17T07:00:00Z'),calls=0,reservations=0;
 const provider=createSevenTimerProvider({now:()=>now,controls:new UpstreamControls({now:()=>now}),quota:{reserve:async()=>{reservations++;return {allowed:true,reason:'test'};}},fetcher:(async()=>{calls++;assert.ok(reservations>=calls);return new Response('',{status:429,headers:{'Retry-After':'60'}});}) as typeof fetch});
 assert.equal((await provider.getForecast(place,window)).status,'unavailable');now+=2000;
 assert.equal((await provider.getForecast(place,window)).status,'unavailable');assert.equal(calls,1);
 assert.equal((await provider.getForecast({...place,latitude:NaN},window)).status,'unavailable');assert.equal(calls,1);
 for(const response of [new Response('{}',{status:302}),new Response('x'.repeat(131073))]){
  const p=createSevenTimerProvider({now:()=>now,controls:new UpstreamControls(),quota:{reserve:async()=>({allowed:true,reason:'test'})},fetcher:(async()=>response) as typeof fetch});
  assert.equal((await p.getForecast(place,window)).status,'unavailable');
 }
});
test('7Timer marks old issue times stale without turning codes into values',async()=>{
 const p=createSevenTimerProvider({now:()=>Date.parse('2026-10-19T06:00:00Z'),controls:new UpstreamControls(),quota:{reserve:async()=>({allowed:true,reason:'test'})},fetcher:(async()=>Response.json(fixture)) as typeof fetch});
 const result=await p.getForecast(place,window);assert.equal(result.status,'stale');assert.equal(result.forecast?.samples[1].bands?.relativeHumidity?.range,'100');assert.equal(result.forecast?.samples[1].values.relativeHumidity,undefined);
});
test('7Timer disables further attempts after access denial',async()=>{
 let now=Date.parse('2026-10-17T07:00:00Z'),calls=0;
 const p=createSevenTimerProvider({now:()=>now,controls:new UpstreamControls({now:()=>now}),quota:{reserve:async()=>({allowed:true,reason:'test'})},fetcher:(async()=>{calls++;return new Response('',{status:403});}) as typeof fetch});
 await p.getForecast(place,window);now+=60000;await p.getForecast(place,window);assert.equal(calls,1);
});
test('7Timer cancels an oversized stream before shared controls buffer the remaining body',async()=>{
 let pulls=0,cancelled=false;
 const body=new ReadableStream<Uint8Array>({pull(controller){pulls++;controller.enqueue(new Uint8Array(16384));if(pulls===64)controller.close();},cancel(){cancelled=true;}},{highWaterMark:0});
 const p=createSevenTimerProvider({now:()=>Date.parse('2026-10-17T07:00:00Z'),controls:new UpstreamControls(),quota:{reserve:async()=>({allowed:true,reason:'test'})},fetcher:(async()=>new Response(body)) as typeof fetch});
 assert.equal((await p.getForecast(place,window)).status,'unavailable');assert.equal(cancelled,true);assert.ok(pulls<=9,`read ${pulls} chunks beyond adapter bound`);
});
import * as initializer from '../../scripts/initialize-provider-quota';
test('fresh quota initialization includes 7Timer only when explicitly selected',()=>{
 assert.equal(typeof initializer.quotaPoliciesForInitialization,'function');
 const selected=initializer.quotaPoliciesForInitialization({NIGHTSKY_WEATHER_PROVIDERS:'met,seventimer'});
 assert.ok(selected.some(policy=>policy.providerId==='seventimer'));
 assert.ok(!initializer.quotaPoliciesForInitialization({}).some(policy=>policy.providerId==='seventimer'));
 assert.ok(selected.some(policy=>policy.providerId==='weatherapi'));
 assert.throws(()=>initializer.quotaPoliciesForInitialization({NIGHTSKY_WEATHER_PROVIDERS:'seventimer,seventimer'}));
});
