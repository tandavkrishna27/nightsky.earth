import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {registerNightSkyTools} from '../../server/mcp/registerTools';
import {GeoNamesPlaceIndex} from '../../server/places/geonames';
import {createConfiguredSkyProviders} from '../../server/providers/skyConfiguration';
import {createWeatherCollection} from '../../server/providers/weather/collection';

// Controlled handler journeys plus authoring guards, never native skill execution.
test('Hyderabad journeys retain useful plans and independent forecasts with all optional sources unavailable',async()=>{
 const index=new GeoNamesPlaceIndex([[1269843,'Hyderabad','Hyderabad','',17.361,78.474,'IN','India',1,'Asia/Kolkata']],'synthetic-journey');
 const placeId='place:v1:geonames:1269843';
 const window={startUtc:'2026-12-13T16:30:00Z',endUtc:'2026-12-13T22:30:00Z',timeZone:'Asia/Kolkata'};
 let externalAttempts=0;
 const fetcher:typeof fetch=async()=>{externalAttempts++;throw Error('External transport forbidden');};
 const skyProviders=createConfiguredSkyProviders({NIGHTSKY_SKY_PROVIDERS:'darkskyplanner,astronomyapi,nasa-donki,jpl'},{fetcher});
 const weatherCollection=createWeatherCollection((['met','weatherapi'] as const).map((id,i)=>({id,enabled:true,provider:{getForecast:async()=>({status:'available' as const,reason:'Synthetic',forecast:{availability:{status:'available' as const,reason:'Synthetic'},source:{name:`${id} synthetic`,url:`https://example.test/${id}`,attribution:'Synthetic offline fixture',dataClass:'forecast' as const,issuedAt:'2026-12-13T12:00:00Z'},forecastHorizonHours:48,samples:[{validAt:'2026-12-13T18:00:00Z',values:{totalCloudCover:{value:i?90:10,unit:'%'}}}],missingFields:[]}})}})),{deadlineMs:100});
 const tools=new Map<string,(input:any)=>Promise<any>>();
 registerNightSkyTools({registerTool:(name:string,_options:unknown,handler:any)=>tools.set(name,handler)} as any,{placeIndex:index,skyProviders,weatherCollection,fetcher,osmCandidateIndexLoader:async()=>undefined,plannerServices:{getClimatology:async()=>{throw Error('Synthetic history unavailable');}}});
 assert.equal(tools.size,20);
 const call=async(name:string,args:unknown)=>(await tools.get(name)!(args)).structuredContent;
 for(const [name,args] of [
  ['find_moon_aware_windows',{placeId,startDate:'2026-12-13',endDate:'2026-12-14',startTime:'22:00',endTime:'04:00',moonIlluminationThresholdPercent:10}],
  ['search_astronomy_objects',{term:'M42'}],
  ['get_external_body_positions',{placeId,elevation:0,startDate:'2026-12-13',endDate:'2026-12-14',time:'22:00',body:'moon'}],
  ['get_space_weather_events',{eventType:'GST',startDate:'2026-12-13',endDate:'2026-12-14'}],
  ['resolve_small_body',{query:'Ceres'}],
  ['get_small_body_ephemeris',{placeId,spkId:'2000001',atUtc:window.startUtc,elevationMeters:0}],
 ] as const) assert.equal((await call(name,args)).status,'unavailable',name);
 for(const activity of ['meteor-shower','general-stargazing','astrophotography']){
  const plan=await call('plan_observing_session',{placeId,window,activity,...(activity==='meteor-shower'?{target:'Geminids'}:{})});
  assert.equal(plan.place.timeZone,'Asia/Kolkata');
  assert.ok(plan.evidence.astronomy);
  assert.ok(plan.preparation.length);
  assert.deepEqual(plan.evidence.weather.forecasts.map((f:any)=>f.samples[0].values.totalCloudCover.value),[10,90]);
  assert.ok(plan.evidence.weather.sources.every((s:any)=>s.attribution==='Synthetic offline fixture'));
 }
 const comparison=await call('compare_observing_options',{options:[{placeId,window,activity:'general-stargazing'},{placeId,window,activity:'astrophotography'}],locale:'en',units:'metric'});
 assert.equal(comparison.comparisons.length,2);
 assert.ok(comparison.comparisons.every((p:any)=>p.evidence.weather.forecasts.length===2));
 assert.equal(externalAttempts,0);
 for(const name of ['prepare-outing','plan-sky-event','plan-astrophotography','plan-stargazing-night']){
  const skill=readFileSync(`plugins/nightsky/skills/${name}/SKILL.md`,'utf8');
  assert.match(skill,/Existing local astronomy and planning remain usable when optional sources fail/);
  assert.match(skill,/never claim the API was called/);
 }
});
