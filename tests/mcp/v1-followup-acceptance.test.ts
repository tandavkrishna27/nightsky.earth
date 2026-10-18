import assert from 'node:assert/strict';
import test from 'node:test';
import type { McpServer } from '@modelcontextprotocol/server';
import { registerNightSkyTools } from '../../server/mcp/registerTools';
import { createApiServices } from '../../server/places/api/configuration';

// Registered MCP handlers and strict input/output schemas; injected sources only.
// This scripts caller choices, so it cannot certify native model reuse or consent.
function fixture() {
 let now = Date.parse('2026-10-17T00:00:00Z');
 let locationCalls = 0;
 const weatherCalls: any[] = [];
 const api = createApiServices({ geoapifyApiKey: 'fixture', userAgent: 'Offline follow-up acceptance fixture', now: () => now,
  fetcher: async input => { if(new URL(String(input)).pathname.includes('geocode')) locationCalls++; return Response.json({type:'FeatureCollection',features:[{type:'Feature',properties:{place_id:'selected-park',name:'Selected park',categories:['leisure.park']},geometry:{type:'Point',coordinates:[78.47,17.36]}}]}); } });
 const tools = new Map<string, any>();
 registerNightSkyTools({registerTool(name: string, config: any, handler: any) {tools.set(name,{config,handler});}} as unknown as McpServer, {
  ...api,
  fetcher: async () => {throw Error('Unexpected external transport');},
  placeIndexLoader: async () => {throw Error('Local index must not load');},
  weatherProvider: {async getForecast(point: any, window: any) {
   weatherCalls.push({point,window});
   if(weatherCalls.length > 1) return {status:'unavailable',reason:'Explicit follow-up fixture has no refreshed forecast'};
   return {status:'available',reason:'Initial synthetic forecast',forecast:{availability:{status:'available',reason:'Synthetic'},source:{name:'Follow-up fixture',url:'https://example.test/forecast',attribution:'Injected offline evidence',dataClass:'forecast'},forecastHorizonHours:48,samples:[{validAt:'2026-10-18T16:30:00Z',values:{totalCloudCover:{value:18,unit:'%'}}}],missingFields:[]}};
  }}
 });
 const invoke = async (name:string, value:any) => {const t=tools.get(name);assert.ok(t);const result=await t.handler(t.config.inputSchema.parse(value),{mcpReq:{_meta:{}}});return t.config.outputSchema.parse(result.structuredContent);};
 return {invoke,weatherCalls,get locationCalls(){return locationCalls;},advance(){now+=3600000;}};
}
const initialWindow = {startUtc:'2026-10-18T14:00:00Z',endUtc:'2026-10-18T20:00:00Z',timeZone:'Asia/Kolkata'};

test('registered MCP changed preference/window follow-up retains API snapshot and validates explicit timezone', async () => {
 const f=fixture();
 const selected=(await f.invoke('resolve_place',{placeQuery:'Selected park, Hyderabad'})).matches[0];
 const resolvedCalls=f.locationCalls;
 const ref={placeId:selected.placeId,sourceRevision:selected.sourceRevision};
 const first=await f.invoke('plan_observing_session',{...ref,displayTimeZone:'Asia/Kolkata',activity:'general-stargazing',window:initialWindow,equipment:['naked eye']});
 assert.ok(first.evidence.astronomy);
 assert.equal(first.place.sourceRevision,ref.sourceRevision);
 const changedWindow={startUtc:'2026-10-18T16:00:00Z',endUtc:'2026-10-18T18:00:00Z',timeZone:'Asia/Kolkata'};
 const changed=await f.invoke('plan_observing_session',{...ref,displayTimeZone:'Asia/Kolkata',activity:'planet-observing',target:'Saturn',experience:'intermediate',equipment:['binoculars'],window:changedWindow});
 assert.equal(f.locationCalls,resolvedCalls);
 assert.equal(changed.place.sourceRevision,ref.sourceRevision);
 assert.deepEqual(changed.requestedWindow,changedWindow);
 assert.match(changed.evidence.target.target.name,/saturn/i);
 assert.ok(changed.evidence.astronomy);
 assert.ok(changed.gaps.some((s:string)=>/refreshed forecast/.test(s)));
 const before=f.weatherCalls.length;
 await assert.rejects(f.invoke('get_night_conditions',{...ref,displayTimeZone:'Europe/London',window:changedWindow}),/time.zone|time zone/i);
 assert.equal(f.weatherCalls.length,before);
 const corrected=await f.invoke('get_night_conditions',{...ref,displayTimeZone:'Europe/London',window:{...changedWindow,timeZone:'Europe/London'}});
 assert.equal(corrected.sourceRevision,ref.sourceRevision);
 assert.equal(f.locationCalls,resolvedCalls);
 assert.equal(first.evidence.weather.forecasts[0].samples[0].values.totalCloudCover.value,18);
});

test('registered MCP explicit focused refresh preserves prior result; expired snapshot requires new resolution', async () => {
 const f=fixture();
 const selected=(await f.invoke('resolve_place',{placeQuery:'Selected park, Hyderabad'})).matches[0];
 const resolvedCalls=f.locationCalls;
 const ref={placeId:selected.placeId,sourceRevision:selected.sourceRevision,displayTimeZone:'Asia/Kolkata'};
 const first=await f.invoke('plan_observing_session',{...ref,activity:'general-stargazing',window:initialWindow});
 const saved=structuredClone(first);
 const refreshed=await f.invoke('get_night_conditions',{...ref,window:initialWindow});
 assert.equal(f.weatherCalls.length,2);
 assert.ok(refreshed.availability.status==='unavailable'||refreshed.availability.status==='partial');
 assert.match(JSON.stringify(refreshed),/no refreshed forecast/);
 assert.deepEqual(first,saved);
 assert.equal(first.evidence.weather.forecasts[0].samples[0].values.totalCloudCover.value,18);
 f.advance();
 const before=f.weatherCalls.length;
 await assert.rejects(f.invoke('plan_observing_session',{...ref,activity:'general-stargazing',window:initialWindow}),/resolve again/i);
 assert.equal(f.weatherCalls.length,before);
 const renewed=(await f.invoke('resolve_place',{placeQuery:'Selected park, Hyderabad'})).matches[0];
 assert.notEqual(renewed.sourceRevision,ref.sourceRevision);
 const recovered=await f.invoke('plan_observing_session',{placeId:renewed.placeId,sourceRevision:renewed.sourceRevision,displayTimeZone:'Asia/Kolkata',activity:'general-stargazing',window:initialWindow});
 assert.ok(recovered.evidence.astronomy);
 assert.equal(recovered.place.sourceRevision,renewed.sourceRevision);
 assert.ok(f.locationCalls>resolvedCalls);
});
