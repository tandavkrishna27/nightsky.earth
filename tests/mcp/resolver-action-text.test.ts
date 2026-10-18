import test from 'node:test';
import assert from 'node:assert/strict';
import type { McpServer } from '@modelcontextprotocol/server';
import { registerNightSkyTools } from '../../server/mcp/registerTools';
import { createApiServices } from '../../server/places/api/configuration';
import { GeoNamesPlaceIndex } from '../../server/places/geonames';

test('local resolver exposes exact selections and reuse guidance without coordinates or implicit ambiguity choice', async () => {
  const index = new GeoNamesPlaceIndex([
    [990001,'Hyderabad','Hyderabad','',17.385,78.4867,'IN','India',100,'Asia/Kolkata'],
    [990002,'Hyderabad','Hyderabad','',25.3,68.3,'PK','Pakistan',100,'Asia/Karachi'],
  ],'reuse-fixture');
  let resolver:any;
  registerNightSkyTools({registerTool(name:string,config:unknown,handler:unknown){if(name==='resolve_place')resolver={config,handler};}} as unknown as McpServer,{placeIndex:index,toolMode:'resolver-only'});
  const invoke=async(placeQuery:string)=>{
    const reply=await resolver.handler({placeQuery},{mcpReq:{_meta:{}}});
    resolver.config.outputSchema.parse(reply.structuredContent);
    return {result:reply.structuredContent,text:reply.content[0].text as string};
  };
  const city=await invoke('Hyderabad, India');
  assert.equal(city.result.matches.length,1);
  assert.match(city.text,/placeId: place:v1:geonames:990001/);
  assert.match(city.text,/timeZone: Asia\/Kolkata/);
  assert.match(city.text,/Reuse this successful resolution/);
  assert.doesNotMatch(city.text,/17\.385|78\.4867|expiresAt|sourceRevision/);
  const ambiguous=await invoke('Hyderabad');
  assert.equal(ambiguous.result.selectionRequired,true);
  assert.match(ambiguous.text,/Ask the user to choose among these matches/);
  for(const match of ambiguous.result.matches)assert.ok(ambiguous.text.includes(match.placeId));
  assert.doesNotMatch(ambiguous.text,/Use the returned match for the requested destination/);
  const missing=await invoke('Fictionvale');
  assert.equal(missing.result.matches.length,0);
  assert.doesNotMatch(missing.text,/Reuse this successful resolution|placeId:/);
});

test('API resolver text carries exact selection and next action for unknown-zone site, known-zone city, ambiguity and no matches', async () => {
  let features: unknown[] = [];
  let calls = 0;
  const api = createApiServices({ geoapifyApiKey: 'fixture', userAgent: 'Offline resolver text fixture',
    now: () => Date.parse('2026-10-18T00:00:00Z'), fetcher: async () => { calls++; return Response.json({type:'FeatureCollection',features}); } });
  let resolver: any;
  registerNightSkyTools({registerTool(name: string, config: unknown, handler: unknown) { if(name==='resolve_place') resolver={config,handler}; }} as unknown as McpServer, {...api,toolMode:'resolver-only'});
  const feature = (id: string, zone?: string) => ({type:'Feature',geometry:{type:'Point',coordinates:[78,17]},properties:{place_id:id,name:id,...(zone?{timezone:{name:zone}}:{})}});
  const invoke = async (placeQuery: string) => {
    const reply = await resolver.handler({placeQuery},{mcpReq:{_meta:{}}});
    resolver.config.outputSchema.parse(reply.structuredContent);
    return {result:reply.structuredContent,text:reply.content[0].text as string};
  };
  features=[feature('Selected field')];
  const site=await invoke('Selected field');
  assert.match(site.text,/placeId: place:v1:api:/);
  assert.ok(site.text.includes(`sourceRevision: ${site.result.matches[0].sourceRevision}`));
  assert.match(site.text,/Actual site time zone: unknown/);
  assert.match(site.text,/explicit display time zone before calculations/);
  assert.match(site.text,/get_observing_location_details/);
  assert.match(site.text,/Reuse this successful resolution/);
  features=[feature('City','Asia/Kolkata')];
  const city=await invoke('City');
  assert.match(city.text,/Asia\/Kolkata/);
  assert.match(city.text,/For a city plan, proceed to planning once the display time zone is settled/);
  assert.match(city.text,/For site geometry\/access evidence when needed/);
  assert.doesNotMatch(city.text,/Actual site time zone: unknown/);
  features=[feature('East'),feature('West')];
  const ambiguous=await invoke('Ambiguous');
  assert.match(ambiguous.text,/Ask the user to choose among these matches/);
  assert.ok(ambiguous.result.matches.every((m:any)=>ambiguous.text.includes(m.sourceRevision)));
  features=Array.from({length:5},(_,i)=>feature(`Match ${i}`));
  const bounded=await invoke('Five matches');
  assert.equal(bounded.result.matches.length,5);
  assert.equal((bounded.text.match(/placeId: place:v1:api:/g)??[]).length,5);
  assert.ok(bounded.text.length<6000);
  assert.match(bounded.text,/Source credits:/);
  features=[];
  const missing=await invoke('Missing');
  assert.equal(missing.result.matches.length,0);
  assert.doesNotMatch(missing.text,/Reuse this successful resolution/);
  assert.equal(calls,5);
});

test('API resolver text does not promote an unknown or mismatched zone field to verified site evidence', async () => {
  const api = createApiServices({geoapifyApiKey:'fixture',userAgent:'Offline zone evidence fixture',now:()=>Date.parse('2026-10-18T00:00:00Z'),fetcher:async()=>Response.json({type:'FeatureCollection',features:[{type:'Feature',geometry:{type:'Point',coordinates:[78,17]},properties:{place_id:'field',name:'Field',timezone:{name:'Asia/Kolkata'}}}]})});
  const original = await api.discoveryProvider.resolvePlace({placeQuery:'Field'});
  const verified = original.matches[0]!;
  for (const timeZoneEvidence of [{status:'unknown'}, {...(verified as any).timeZoneEvidence,timeZone:'Europe/London'}]) {
    let resolver:any;
    const result={...original,matches:[{...verified,timeZoneEvidence}]};
    registerNightSkyTools({registerTool(name:string,config:unknown,handler:unknown){if(name==='resolve_place')resolver={config,handler};}} as unknown as McpServer,{...api,toolMode:'resolver-only',discoveryProvider:{...api.discoveryProvider,resolvePlace:async()=>result} as any});
    const reply=await resolver.handler({placeQuery:'Field'},{mcpReq:{_meta:{}}});
    resolver.config.outputSchema.parse(reply.structuredContent);
    assert.match(reply.content[0].text,/Actual site time zone: unknown/);
    assert.doesNotMatch(reply.content[0].text,/Actual site time zone: Asia\/Kolkata/);
    assert.ok(reply.content[0].text.includes(`fetchedAt: ${verified.fetchedAt}`));
    assert.ok(reply.content[0].text.includes(`expiresAt: ${verified.expiresAt}`));
    assert.doesNotMatch(reply.content[0].text,/\uFFFD|\u2014/);
  }
});
