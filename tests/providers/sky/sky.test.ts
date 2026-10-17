import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAstronomyApiProvider } from '../../../server/providers/sky/astronomyApi';
import { createDarkSkyPlannerProvider } from '../../../server/providers/sky/darkSkyPlanner';
import { UpstreamControls } from '../../../server/providers/upstreamControls';
const options = (payload: unknown) => ({enabled:true, quota:{reserve:async()=>({allowed:true,reason:'ok'})}, controls:new UpstreamControls(), fetcher:(async()=>Response.json(payload)) as typeof fetch, now:()=>0});
const input = {locationName:'Hyderabad',latitude:17.361,longitude:78.474,timeZone:'Asia/Kolkata',startDate:'2026-12-13',endDate:'2026-12-14',startTime:'22:00',endTime:'04:00',moonIlluminationThresholdPercent:10};
const night={date:'2026-12-14',window_start:'2026-12-14 22:00',window_end:'2026-12-15 04:00',qualifies:false,rating:'excluded',max_moon_illumination_when_up:0.2611,moon_illumination_at_lunar_noon:0.2408,moon_minutes_above_horizon:10,moonrise_in_window:null,moonset_in_window:'2026-12-14 22:10',reason:'Moon is above threshold.'};
test('planner preserves exclusion despite later moonset and keeps fraction units',async()=>{
 const result=await createDarkSkyPlannerProvider(options({location:{name:'Hyderabad',latitude:17.361,longitude:78.474,timezone:'Asia/Kolkata'},start_date:input.startDate,end_date:input.endDate,qualifying_dates:[{...night,date:'2026-12-13',window_start:'2026-12-13 22:00',window_end:'2026-12-14 04:00',qualifies:true,rating:'best',max_moon_illumination_when_up:null,moon_minutes_above_horizon:0,moonset_in_window:null}],excluded_dates:[night]})).plan(input);
 assert.equal(result.status,'ok'); if(result.status!=='ok') return;
 assert.equal(result.data.excludedDates[0].maxMoonIlluminationWhenUp,0.2611);
 assert.equal(result.data.excludedDates[0].moonsetLocal,'2026-12-14 22:10');
 assert.equal(result.data.excludedDates[0].qualifies,false);
 assert.equal(result.data.timeZone,'Asia/Kolkata');
});
test('astronomy search bounds query, uses Basic header and normalizes coordinates',async()=>{
 const opt=options({data:[{id:'m42',name:'Orion Nebula',type:{id:'nebula',name:'Nebula'},position:{equatorial:{rightAscension:{hours:'5.59'},declination:{degrees:'-4.61'}}}}]});
 opt.fetcher=(async(url,init)=>{assert.equal(new URL(String(url)).origin,'https://api.astronomyapi.com');assert.equal(new Headers(init?.headers).get('Authorization'),'Basic aWQ6c2VjcmV0');return Response.json({data:[{id:'m42',name:'Orion Nebula',type:{id:'nebula',name:'Nebula'},position:{equatorial:{rightAscension:{hours:'5.59'},declination:{degrees:'-4.61'}}}}]});}) as typeof fetch;
 const result=await createAstronomyApiProvider({...opt,appId:'id',appSecret:'secret'}).searchObjects({term:'M42'});
 assert.equal(result.status,'ok');if(result.status==='ok')assert.equal(result.data.objects[0].rightAscensionHours,5.59);
});
test('invalid inputs, disabled configuration and denied quota make no network calls',async()=>{
 let calls=0;const opt={...options({}),fetcher:(async()=>{calls++;throw Error('secret');}) as typeof fetch};
 assert.equal((await createDarkSkyPlannerProvider(opt).plan({...input,startDate:'2026-02-30'})).status,'invalid-input');
 assert.equal((await createAstronomyApiProvider({...opt,appId:'',appSecret:''}).searchObjects({term:'M42'})).status,'unavailable');
 assert.equal((await createDarkSkyPlannerProvider({...opt,quota:{reserve:async()=>({allowed:false,reason:'secret'})}}).plan(input)).status,'unavailable');assert.equal(calls,0);
});
test('upstream failures are redacted and never retried',async()=>{
 let calls=0;const result=await createAstronomyApiProvider({...options({}),appId:'id',appSecret:'secret',fetcher:(async()=>{calls++;throw Error('secret credentials');}) as typeof fetch}).searchObjects({term:'M42'});
 assert.equal(result.status,'unavailable');assert.ok(!JSON.stringify(result).includes('secret'));assert.equal(calls,1);
});
test('positions preserve provider offset and reject mismatched dates',async()=>{
 const payload={data:{observer:{location:{latitude:17.361,longitude:78.474,elevation:0}},table:{rows:[{entry:{id:'moon',name:'Moon'},cells:[{id:'moon',name:'Moon',date:'2026-12-13T22:00:00+05:30',position:{horizontal:{altitude:{degrees:'-12.5'},azimuth:{degrees:'240.1'}},equatorial:{rightAscension:{hours:'5.5'},declination:{degrees:'-20'}}}}]}]}}};
 const provider=createAstronomyApiProvider({...options(payload),appId:'id',appSecret:'secret'});
 const result=await provider.bodyPositions({latitude:17.361,longitude:78.474,startDate:'2026-12-13',endDate:'2026-12-13',time:'22:00',body:'moon'});
 assert.equal(result.status,'ok');if(result.status==='ok'){assert.equal(result.data.positions[0].date,'2026-12-13T22:00:00+05:30');assert.equal(result.data.positions[0].altitudeDegrees,-12.5);}
 payload.data.table.rows[0].cells[0].date='2026-12-12T22:00:00+05:30';
 assert.equal((await createAstronomyApiProvider({...options(payload),appId:'id',appSecret:'secret'}).bodyPositions({latitude:17.361,longitude:78.474,startDate:'2026-12-13',endDate:'2026-12-14',time:'22:00'})).status,'unavailable');
});
test('authentication blocks further attempts and timeout is bounded',async()=>{
 let now=0,calls=0;const provider=createAstronomyApiProvider({...options({}),now:()=>now,appId:'id',appSecret:'secret',fetcher:(async()=>{calls++;return new Response('secret',{status:403});}) as typeof fetch});
 assert.equal((await provider.searchObjects({term:'M42'})).status,'unavailable');now=10000;
 assert.equal((await provider.searchObjects({term:'M31'})).status,'unavailable');assert.equal(calls,1);
 const stuck=createAstronomyApiProvider({...options({}),appId:'id',appSecret:'secret',timeoutMs:10,fetcher:(()=>new Promise(()=>{})) as typeof fetch});
 assert.equal((await stuck.searchObjects({term:'M42'})).status,'unavailable');
});
test('percentage-shaped provider illumination and redirects fail closed',async()=>{
 assert.equal((await createDarkSkyPlannerProvider(options({location:{name:'Hyderabad',latitude:17.361,longitude:78.474,timezone:'Asia/Kolkata'},start_date:input.startDate,end_date:input.endDate,qualifying_dates:[],excluded_dates:[{...night,max_moon_illumination_when_up:26.11}]})).plan(input)).status,'unavailable');
 const response=Response.json({data:[]});Object.defineProperty(response,'redirected',{value:true});
 assert.equal((await createAstronomyApiProvider({...options({}),appId:'id',appSecret:'secret',fetcher:(async()=>response) as typeof fetch}).searchObjects({term:'M42'})).status,'unavailable');
});
test('planner rejects missing evaluated dates rather than silently claiming complete plan',async()=>{
 const result=await createDarkSkyPlannerProvider(options({location:{name:'Hyderabad',latitude:17.361,longitude:78.474,timezone:'Asia/Kolkata'},start_date:input.startDate,end_date:input.endDate,qualifying_dates:[],excluded_dates:[]})).plan(input);
 assert.equal(result.status,'unavailable');
});



test('positions reject upstream observer and local-time mismatches',async()=>{
 for(const override of [{latitude:18,date:'2026-12-13T22:00:00+05:30'},{latitude:17.361,date:'2026-12-13T21:00:00+05:30'}]){
 const payload={data:{observer:{location:{latitude:override.latitude,longitude:78.474,elevation:0}},table:{rows:[{entry:{id:'moon',name:'Moon'},cells:[{id:'moon',name:'Moon',date:override.date,position:{horizontal:{altitude:{degrees:'-12.5'},azimuth:{degrees:'240.1'}},equatorial:{rightAscension:{hours:'5.5'},declination:{degrees:'-20'}}}}]}]}}};
 assert.equal((await createAstronomyApiProvider({...options(payload),appId:'id',appSecret:'secret'}).bodyPositions({latitude:17.361,longitude:78.474,startDate:'2026-12-13',endDate:'2026-12-14',time:'22:00'})).status,'unavailable');
 }
});
test('planner rejects end dates beyond the requested overnight session',async()=>{
 const result=await createDarkSkyPlannerProvider(options({location:{name:'Hyderabad',latitude:17.361,longitude:78.474,timezone:'Asia/Kolkata'},start_date:'2026-12-14',end_date:'2026-12-14',qualifying_dates:[],excluded_dates:[{...night,window_end:'2026-12-25 04:00'}]})).plan({...input,startDate:'2026-12-14'});
 assert.equal(result.status,'unavailable');
});
test('positions reject missing date samples for returned bodies',async()=>{
 const payload={data:{observer:{location:{latitude:17.361,longitude:78.474,elevation:0}},table:{rows:[{entry:{id:'moon',name:'Moon'},cells:[{id:'moon',name:'Moon',date:'2026-12-13T22:00:00+05:30',position:{horizontal:{altitude:{degrees:'-12.5'},azimuth:{degrees:'240.1'}},equatorial:{rightAscension:{hours:'5.5'},declination:{degrees:'-20'}}}}]}]}}};
 assert.equal((await createAstronomyApiProvider({...options(payload),appId:'id',appSecret:'secret'}).bodyPositions({latitude:17.361,longitude:78.474,startDate:'2026-12-13',endDate:'2026-12-14',time:'22:00',body:'moon'})).status,'unavailable');
});
