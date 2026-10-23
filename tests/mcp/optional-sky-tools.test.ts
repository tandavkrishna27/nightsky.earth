import assert from 'node:assert/strict';
import {test} from 'node:test';
import {once} from 'node:events';
import {createServer} from 'node:http';
import {createNightSkyPluginApp} from '../../server/plugin';
import {createConfiguredSkyProviders,parseSkyConfiguration} from '../../server/providers/skyConfiguration';
import {GeoNamesPlaceIndex} from '../../server/places/geonames';

const index = new GeoNamesPlaceIndex([{geonameId:1269843,name:'Hyderabad',asciiName:'Hyderabad',alternateNames:'',latitude:17.361,longitude:78.474,countryCode:'IN',countryName:'India',featureClass:'P',featureCode:'PPLA',population:1,timeZone:'Asia/Kolkata',modificationDate:'2026-10-01'}],'synthetic');
const env={NIGHTSKY_SKY_PROVIDERS:'darkskyplanner,astronomyapi,nasa-donki,jpl',NIGHTSKY_SKY_ADMITTED_PROVIDERS:'darkskyplanner,astronomyapi,nasa-donki,jpl',NIGHTSKY_NASA_API_KEY:'synthetic-nasa',NIGHTSKY_ASTRONOMY_API_APP_ID:'synthetic-id',NIGHTSKY_ASTRONOMY_API_APP_SECRET:'synthetic-secret'};
test('sky settings reject unknown selections and keys alone never enable requests',()=>{
 assert.equal(createConfiguredSkyProviders({NIGHTSKY_NASA_API_KEY:'synthetic'}),undefined);
 assert.throws(()=>parseSkyConfiguration({NIGHTSKY_SKY_PROVIDERS:'unknown'}));
 assert.throws(()=>parseSkyConfiguration({NIGHTSKY_SKY_ADMITTED_PROVIDERS:'jpl'}));
 assert.throws(()=>parseSkyConfiguration({...env,NIGHTSKY_NASA_API_KEY:'bad\nkey'}));
});
test('optional sources expose six MCP tools, resolve coordinates internally and preserve unavailable states',async t=>{
 const requests:URL[]=[];
 const fetcher=(async(input:RequestInfo|URL)=>{const url=new URL(String(input));requests.push(url);
  if(url.hostname==='api.nasa.gov')return Response.json([]);
  if(url.hostname==='api.astronomyapi.com')return Response.json({data:[]});
  return new Response('upstream failure',{status:503});
 }) as typeof fetch;
 const skyProviders=createConfiguredSkyProviders(env,{fetcher,quota:{reserve:async()=>({allowed:true,reason:'synthetic'})}});
 const server=createServer(createNightSkyPluginApp({placeIndex:index,skyProviders,log:()=>{}}));server.listen(0,'127.0.0.1');await once(server,'listening');t.after(()=>new Promise<void>(done=>server.close(()=>done())));
 const address=server.address();assert.ok(address&&typeof address!=='string');let id=0;
 const rpc=async(method:string,params:unknown={})=>{const r=await fetch(`http://127.0.0.1:${address.port}/mcp`,{method:'POST',headers:{'content-type':'application/json',accept:'application/json, text/event-stream','mcp-protocol-version':'2025-11-25'},body:JSON.stringify({jsonrpc:'2.0',id:++id,method,params})});assert.equal(r.status,200);const line=(await r.text()).split('\n').find(s=>s.startsWith('data: '));assert.ok(line);return JSON.parse(line.slice(6));};
 const list=await rpc('tools/list');assert.equal(list.result.tools.length,19);
 const search=await rpc('tools/call',{name:'search_astronomy_objects',arguments:{term:'M42'}});assert.equal(search.result.structuredContent.status,'ok');assert.deepEqual(search.result.structuredContent.data.objects,[]);
 const events=await rpc('tools/call',{name:'get_space_weather_events',arguments:{eventType:'GST',startDate:'2026-10-16',endDate:'2026-10-17'}});assert.equal(events.result.structuredContent.status,'available');assert.ok(!JSON.stringify(events).includes('synthetic-nasa'));
 const args={placeId:'place:v1:geonames:1269843',startDate:'2026-12-13',endDate:'2026-12-14',startTime:'22:00',endTime:'04:00'};
 const plan=await rpc('tools/call',{name:'find_moon_aware_windows',arguments:args});assert.equal(plan.result.structuredContent.status,'unavailable');const request=requests.find(r=>r.hostname==='darkskyplanner.com');assert.equal(request?.searchParams.get('latitude'),'17.361');assert.equal(request?.searchParams.get('timezone'),'Asia/Kolkata');assert.match(plan.result.content[0].text,/https:\/\/darkskyplanner.com/);
 const before=requests.length;await rpc('tools/call',{name:'find_moon_aware_windows',arguments:{...args,latitude:0,longitude:0}});assert.equal(requests.length,before);
});
test('unadmitted sky source never invokes fetch even with credentials',async()=>{
 let calls=0;const s=createConfiguredSkyProviders({...env,NIGHTSKY_SKY_ADMITTED_PROVIDERS:''},{quota:{reserve:async()=>({allowed:true,reason:'synthetic'})},fetcher:(async()=>{calls++;throw Error('forbidden');}) as typeof fetch})!;
 assert.equal((await s.astronomy!.searchObjects({term:'M42'})).status,'unavailable');assert.equal((await s.space!.getSpaceWeather({eventType:'GST',startDate:'2026-10-16',endDate:'2026-10-17'})).status,'unavailable');assert.equal(calls,0);
});
