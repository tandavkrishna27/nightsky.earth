import { guardToolCallback } from '../../server/mcp/toolResults';
import { CalculationPlaceClarificationError } from '../../server/places/calculationPlace';
import express from 'express';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { mountMcpRoute } from '../../server/mcp/route';
import assert from 'node:assert/strict';
import test from 'node:test';
import { pluginGlobalConfiguration } from '../../server/plugin';
import { registerNightSkyTools } from '../../server/mcp/registerTools';
import { buildGlobalCatalogue } from '../../scripts/osm/build-global-catalogue';
import { loadCatalogueFiles } from '../../server/places/catalogueFiles';
import { createGlobalCatalogue } from '../../server/places/globalCatalogue';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { NightSkyDependencies } from '../../server/mcp/registerTools';
import type { McpServer } from '@modelcontextprotocol/server';
import { GeoNamesPlaceIndex } from '../../server/places/geonames';
const index = new GeoNamesPlaceIndex([[1259229,'Pune','Pune','',18.52,73.85,'IN','India',1000000,'Asia/Kolkata']], 'synthetic');
function registry(mode: 'full'|'resolver-only' = 'full', dependencies: NightSkyDependencies = {}) {
 const tools = new Map<string, { config: any; handler: any }>();
 registerNightSkyTools({registerTool(name: string, config: any, handler: any) {tools.set(name,{config,handler});}} as unknown as McpServer,{placeIndex:index,toolMode:mode,...dependencies});
 return tools;
}
test('full registry exposes fourteen genuine tools and resolver mode one', async () => {
 const tools=registry(); assert.equal(tools.size,14); assert.equal(registry('resolver-only').size,1);
 for(const name of ['resolve_observing_region','get_observing_location_details']) {
  const tool=tools.get(name)!; assert.equal(tool.config.annotations.readOnlyHint,true);
  const result=await tool.handler(name==='resolve_observing_region'?{regionQuery:'India'}:{placeQuery:'Test park'});
  assert.equal(result.structuredContent.availability.status,'unavailable'); assert.deepEqual(result.structuredContent.matches,[]);
  tool.config.outputSchema.parse(result.structuredContent);
 }
});
test('global scope without an installed catalogue reports unavailable instead of city fallback',async()=> {
 const tool=registry().get('search_observing_locations')!;
 const input=tool.config.inputSchema.parse({scope:{includeRegionIds:['region:v1:india']}});
 const result=await tool.handler(input);
 assert.equal(result.structuredContent.discoveryCoverage.searchCompleteness,'unavailable');
 assert.deepEqual(result.structuredContent.candidates,[]);
 tool.config.outputSchema.parse(result.structuredContent);
});
test('near me without host hint requests a named town',async()=>{
 const result=await registry().get('resolve_place')!.handler({useApproximateHostLocation:true},{mcpReq:{_meta:{}}});
 assert.deepEqual(result.structuredContent.matches,[]);
 assert.match(result.content[0].text,/named|town|city/i);
});

test('global startup configuration is pinned and mutually exclusive',()=>{
 assert.equal(pluginGlobalConfiguration({}),undefined);
 assert.deepEqual(pluginGlobalConfiguration({NIGHTSKY_GLOBAL_CATALOGUE_MANIFEST:'edition/root.json',NIGHTSKY_GLOBAL_CATALOGUE_SHA256:'A'.repeat(64)}),{path:'edition/root.json',expectedSha256:'a'.repeat(64)});
 for(const extra of [{NIGHTSKY_GLOBAL_CATALOGUE_SHA256:undefined},{NIGHTSKY_OSM_REGIONAL_MANIFEST:'regional.json'},{NIGHTSKY_OSM_REGIONAL_SHA256:'b'.repeat(64)},{NIGHTSKY_OSM_CANDIDATE_INDEX:'flat.json'}]) assert.throws(()=>pluginGlobalConfiguration({NIGHTSKY_GLOBAL_CATALOGUE_MANIFEST:'edition/root.json',NIGHTSKY_GLOBAL_CATALOGUE_SHA256:'a'.repeat(64),...extra}));
});

test('selected catalogue site reaches astronomy, forecast, aurora, plan and compare at the actual point',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'mcp-global-'));
 let server: ReturnType<typeof createServer> | undefined;
 const source={name:'Synthetic OSM source',url:'https://www.openstreetmap.org/node/77',attribution:'Synthetic fixture, OSM contributors',dataClass:'catalog' as const,vintage:'synthetic-2026'};
 const candidate={placeId:'place:v1:osm:node:77',name:'Test site',category:'park' as const,latitude:28.6,longitude:77.2,accessEvidence:{status:'unknown' as const},sources:[source],caveats:['Access is unverified.'],catalogueRevision:'fixture-v1',sourceCompleteness:1,countryCode:'IND',regionIds:['region:v1:india']};
 try {
  const built=await buildGlobalCatalogue({catalogueRevision:'fixture-v1',candidates:[candidate],regions:[{regionId:'region:v1:india',name:'India',countryCode:'IND',adminLevel:0,boundaryRevision:'fixture-v1',sources:[source]}],footprints:[{geometryBasis:'full-cell',footprintId:'test',bounds:{south:28,north:29,west:77,east:78},sources:[source],vintage:'synthetic',regionIds:['region:v1:india']}]},dir);
  const catalogue=createGlobalCatalogue(await loadCatalogueFiles(built.path,{expectedSha256:built.sha256}),{cities:index});
  const observed:{kind:string;latitude:number;longitude:number}[]=[];
  const dependencies:NightSkyDependencies={placeIndex:index,catalogue,regionIndex:catalogue.regions,weatherProvider:{async getForecast(place){observed.push({kind:'weather',...place});return {status:'unavailable',reason:'Synthetic forecast absent.'};}},auroraProvider:async(place,window)=>{observed.push({kind:'aurora',...place});return {availability:{status:'unavailable',reason:'Synthetic aurora absent.'},placeId:place.placeId,window,outlook:{status:'unavailable',reason:'Synthetic aurora absent.'},latitudeBand:'mid-latitude',sources:[{name:'NOAA SWPC',url:'https://www.swpc.noaa.gov',attribution:'Synthetic missing-provider fixture',dataClass:'forecast'}],caveats:[]} as any;}};
  const tools=registry('full',dependencies);
  const app=express();app.use(express.json({limit:'32kb'}));mountMcpRoute(app,{...dependencies,allowedHosts:['127.0.0.1']});
  server=createServer(app).listen(0,'127.0.0.1');await once(server,'listening');const address=server.address();assert.ok(address&&typeof address!=='string');let id=0;
  const rpc=async(method:string,params:any)=>{const response=await fetch(`http://127.0.0.1:${address.port}/mcp`,{method:'POST',headers:{'content-type':'application/json',accept:'application/json, text/event-stream','mcp-protocol-version':'2025-11-25'},body:JSON.stringify({jsonrpc:'2.0',id:++id,method,params})});const body=await response.text();const data=body.split('\n').find(line=>line.startsWith('data: '));return JSON.parse(data?data.slice(6):body);};
  const listed=await rpc('tools/list',{});assert.equal(listed.result.tools.length,14);
  const call=async(name:string,input:any)=>{const tool=tools.get(name)!;const parsed=tool.config.inputSchema.parse(input);const response=await rpc('tools/call',{name,arguments:parsed});const result=response.result;if(response.error||result?.isError)throw Error(response.error?.message??result.content[0].text);tool.config.outputSchema.parse(result.structuredContent);return result.structuredContent;};
  const window={startUtc:'2026-10-15T12:00:00Z',endUtc:'2026-10-16T00:00:00Z',timeZone:'Asia/Kolkata'};
  const selection={placeId:candidate.placeId,catalogueRevision:'fixture-v1',displayTimeZone:'Asia/Kolkata'};
  assert.equal((await call('resolve_observing_region',{regionQuery:'India'})).matches[0].regionId,'region:v1:india');
  assert.equal((await call('get_observing_location_details',selection)).matches[0].latitude,28.6);
  const discovered=await call('search_observing_locations',{scope:{includeRegionIds:['region:v1:india'],excludeRegionIds:[],origins:[]}});
  assert.equal(discovered.candidates[0].catalogueRevision,'fixture-v1');
  assert.equal((await call('get_observing_location_details',{...selection,catalogueRevision:'old'})).availability.status,'not-covered');
  await assert.rejects(call('get_astronomy_window',{placeId:candidate.placeId,catalogueRevision:'fixture-v1',window}),/display time zone/i);
  const astronomy=await call('get_astronomy_window',{...selection,window});
  const named=await call('get_astronomy_window',{placeId:'place:v1:geonames:1259229',window});
  assert.notDeepEqual(astronomy.solarThresholdIntervals,named.solarThresholdIntervals);
  const weather=await call('get_night_conditions',{...selection,window});assert.equal(weather.catalogueRevision,'fixture-v1');assert.ok(weather.caveats.some((text:string)=>/site time zone is unverified/.test(text)));
  const aurora=await call('get_aurora_outlook',{...selection,window});assert.equal(aurora.displayTimeZone,'Asia/Kolkata');assert.ok(aurora.caveats.some((text:string)=>/site time zone is unverified/.test(text)));
  const plan=await call('plan_observing_session',{...selection,window,activity:'general-stargazing'});
  assert.equal(plan.place.placeId,candidate.placeId);assert.equal(plan.place.timeZoneBasis,'explicit-display');
  const climate=await call('get_clear_sky_climatology',{...selection,month:10});assert.equal(climate.availability.status,'not-covered');assert.equal(climate.timeZone,'Asia/Kolkata');
  const context=await call('get_location_context',selection);assert.equal(context.access.status,'unknown');assert.equal(context.sources[0].url,source.url);
  await call('compare_observing_options',{options:[{...selection,window,activity:'general-stargazing'},{...selection,window,activity:'astrophotography'}]});
  assert.ok(observed.length>=4);for(const point of observed){assert.equal(point.latitude,28.6);assert.equal(point.longitude,77.2);}
  await assert.rejects(call('get_astronomy_window',{...selection,catalogueRevision:'old',window}),/revision|again/i);
  await assert.rejects(call('get_astronomy_window',{placeId:'place:v1:geonames:1259229',displayTimeZone:'UTC',window}),/time zone/i);
 } finally {if(server){server.closeAllConnections();await new Promise<void>(done=>server!.close(()=>done()));}await rm(dir,{recursive:true,force:true});}
});

test('typed selection clarifications use fixed safe messages and arbitrary failures stay redacted',async()=>{
 for(const [code,pattern]of [['resolve-again',/select the place again/],['display-time-zone-required',/explicit display time zone/],['time-zone-mismatch',/display time zone must match/]] as const){
  const result=await guardToolCallback(()=>{throw new CalculationPlaceClarificationError(code,'secret /private/path upstream URL');})();
  assert.equal(result.isError,true);assert.match(result.content[0].text,pattern);assert.doesNotMatch(result.content[0].text,/secret|private|upstream URL/);
 }
 const result=await guardToolCallback(()=>{throw new RangeError('secret /private/path');})();assert.doesNotMatch(result.content[0].text,/secret|private/);
});

test('empty custom weather results retain their supplied source in direct and composed tools',async()=>{
 const source={name:'Synthetic weather provider',url:'https://example.test/weather',attribution:'Offline fixture provider',dataClass:'forecast' as const};
 let externalAttempts=0;
 for(const status of ['out-of-horizon','unavailable'] as const){
  const tools=registry('full',{weatherProvider:{async getForecast(){return {status,reason:'Synthetic coverage ends before this date.',source};}},fetcher:async()=>{externalAttempts++;throw Error('External request prohibited');}});
  const window={startUtc:'2026-10-15T12:00:00Z',endUtc:'2026-10-16T00:00:00Z',timeZone:'Asia/Kolkata'};
  const direct=await tools.get('get_night_conditions')!.handler({placeId:'place:v1:geonames:1259229',window,includeHourly:true});
  const plan=await tools.get('plan_observing_session')!.handler({placeId:'place:v1:geonames:1259229',window,activity:'general-stargazing',locale:'en',units:'metric'});
  for(const weather of [direct.structuredContent,plan.structuredContent.evidence.weather]){
   assert.equal(weather.availability.status,status);assert.deepEqual(weather.sources,[source]);assert.deepEqual(weather.forecasts,[]);
   assert.doesNotMatch(weather.caveats.join(' '),/MET Norway/);
  }
 }
 assert.equal(externalAttempts,0);
});
test('unidentified custom weather uses honest configuration attribution while default empty MET keeps MET attribution',async()=>{
 const window={startUtc:'2026-10-15T12:00:00Z',endUtc:'2026-10-16T00:00:00Z',timeZone:'Asia/Kolkata'};
 for(const custom of [true,false]){
  const tools=registry('full',{weatherUserAgent:'',...(custom?{weatherProvider:{async getForecast(){return {status:'out-of-horizon' as const,reason:'Custom provider has no horizon for this date.'};}}}:{})});
  const direct=await tools.get('get_night_conditions')!.handler({placeId:'place:v1:geonames:1259229',window,includeHourly:true});
  const plan=await tools.get('plan_observing_session')!.handler({placeId:'place:v1:geonames:1259229',window,activity:'general-stargazing',locale:'en',units:'metric'});
  for(const weather of [direct.structuredContent,plan.structuredContent.evidence.weather]){
   if(custom){assert.equal(weather.sources[0].dataClass,'context');assert.match(weather.sources[0].attribution,/identity|unidentified|unspecified/i);assert.doesNotMatch(JSON.stringify(weather.sources)+weather.caveats.join(' '),/MET Norway/);}
   else {assert.match(weather.sources[0].name,/MET Norway/);assert.match(weather.caveats.join(' '),/MET Norway/);}
  }
 }
});
test('invalid empty custom weather source fails validation rather than asserting its provenance',async()=>{
 const tools=registry('full',{weatherProvider:{async getForecast(){return {status:'unavailable',reason:'No forecast.',source:{name:'Invalid',url:'invalid',attribution:'bad',dataClass:'forecast'}} as any;}}});
 const window={startUtc:'2026-10-15T12:00:00Z',endUtc:'2026-10-16T00:00:00Z',timeZone:'Asia/Kolkata'};
 await assert.rejects(tools.get('get_night_conditions')!.handler({placeId:'place:v1:geonames:1259229',window,includeHourly:true}));
 const plan=await tools.get('plan_observing_session')!.handler({placeId:'place:v1:geonames:1259229',window,activity:'general-stargazing',locale:'en',units:'metric'});
 assert.equal(plan.structuredContent.evidence?.weather,undefined);assert.ok(plan.structuredContent.gaps.some((text:string)=>/weather.*unavailable|night.*unavailable/i.test(text)));
});

test('returned forecast source is authoritative over empty-result metadata for custom weather',async()=>{
 const source={name:'Actual fixture forecast',url:'https://example.test/forecast',attribution:'Synthetic forecast product',dataClass:'forecast' as const};
 const window={startUtc:'2026-10-15T12:00:00Z',endUtc:'2026-10-16T00:00:00Z',timeZone:'Asia/Kolkata'};
 const tools=registry('full',{weatherProvider:{async getForecast(){return {status:'partial',reason:'Sparse synthetic forecast.',source:{...source,name:'Empty-result identity'},forecast:{availability:{status:'partial',reason:'Sparse synthetic forecast.'},source,forecastHorizonHours:24,samples:[{validAt:window.startUtc,values:{totalCloudCover:{value:45,unit:"%"}}}],missingFields:[]}};}}});
 const direct=await tools.get('get_night_conditions')!.handler({placeId:'place:v1:geonames:1259229',window,includeHourly:true});
 const plan=await tools.get('plan_observing_session')!.handler({placeId:'place:v1:geonames:1259229',window,activity:'general-stargazing',locale:'en',units:'metric'});
 for(const weather of [direct.structuredContent,plan.structuredContent.evidence.weather]){assert.deepEqual(weather.sources,[source]);assert.deepEqual(weather.forecasts[0].source,source);assert.doesNotMatch(weather.caveats.join(' '),/MET Norway/);}
});

test('HTTP weather rejects supplied null and falsy source metadata while omitted identity remains neutral',async()=>{
 let suppliedSource:unknown;
 let includeForecast=false;
 let externalAttempts=0;
 const source={name:'Authoritative synthetic forecast',url:'https://example.test/forecast',attribution:'Offline synthetic forecast',dataClass:'forecast' as const};
 const window={startUtc:'2026-10-15T12:00:00Z',endUtc:'2026-10-16T00:00:00Z',timeZone:'Asia/Kolkata'};
 const app=express();app.use(express.json({limit:'32kb'}));
 mountMcpRoute(app,{placeIndex:index,allowedHosts:['127.0.0.1'],maxRequestsPerWindow:100,weatherProvider:{async getForecast(){return {status:'out-of-horizon',reason:'Offline custom horizon gap.',source:suppliedSource,...(includeForecast?{forecast:{availability:{status:'partial',reason:'Sparse synthetic forecast.'},source,forecastHorizonHours:24,samples:[{validAt:window.startUtc,values:{totalCloudCover:{value:45,unit:'%'}}}],missingFields:[]}}:{})} as any;}},fetcher:async()=>{externalAttempts++;throw Error('External request prohibited');}});
 const server=createServer(app).listen(0,'127.0.0.1');await once(server,'listening');const address=server.address();assert.ok(address&&typeof address!=='string');let id=0;
 const call=async(name:string)=>{
  const argumentsInput={placeId:'place:v1:geonames:1259229',window,...(name==='get_night_conditions'?{includeHourly:true}:{activity:'general-stargazing'})};
  const response=await fetch(`http://127.0.0.1:${address.port}/mcp`,{method:'POST',headers:{'content-type':'application/json',accept:'application/json, text/event-stream','mcp-protocol-version':'2025-11-25'},body:JSON.stringify({jsonrpc:'2.0',id:++id,method:'tools/call',params:{name,arguments:argumentsInput}})});
  const body=await response.text();const data=body.split('\n').find(line=>line.startsWith('data: '));return JSON.parse(data?data.slice(6):body).result;
 };
 try {
  for(const invalid of [null,false,0,'']){
   suppliedSource=invalid;
   const direct=await call('get_night_conditions');assert.equal(direct.isError,true,`supplied ${JSON.stringify(invalid)} must fail source validation`);
   const plan=await call('plan_observing_session');assert.equal(plan.structuredContent.evidence?.weather,undefined);assert.ok(plan.structuredContent.gaps.some((text:string)=>/weather.*unavailable|night.*unavailable/i.test(text)));
  }
  suppliedSource=undefined;
  const direct=await call('get_night_conditions');assert.equal(direct.isError,undefined);assert.equal(direct.structuredContent.sources[0].dataClass,'context');
  const plan=await call('plan_observing_session');assert.equal(plan.structuredContent.evidence.weather.sources[0].dataClass,'context');
  suppliedSource=false;includeForecast=true;
  for(const name of ['get_night_conditions','plan_observing_session']){const result=await call(name);const weather=name==='get_night_conditions'?result.structuredContent:result.structuredContent.evidence.weather;assert.deepEqual(weather.sources,[source]);}
  assert.equal(externalAttempts,0);
 } finally {server.closeAllConnections();await new Promise<void>(done=>server.close(()=>done()));}
});
