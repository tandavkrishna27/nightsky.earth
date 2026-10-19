import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createFixtureServer} from '../../scripts/complete-model-journey-test';
import {attachPlanningCard,RESULT_CARD_URI,registerResultCardResource} from '../../server/mcp/resultCard';
import {createNightSkyMcpServer} from '../../server/mcp/index';
import {registerNightSkyTools} from '../../server/mcp/registerTools';
import {GeoNamesPlaceIndex} from '../../server/places/geonames';
import {createMcpHandler} from '@modelcontextprotocol/server';
import {toNodeHandler} from '@modelcontextprotocol/node';
import express from 'express';
import {createServer} from 'node:http';

test('actual stateless MCP advertises and serves a card only in the explicit full prototype',async()=>{
 for(const enabled of [false,true])for(const toolMode of ['full','resolver-only'] as const){
  let external=0,id=0;
  const index=new GeoNamesPlaceIndex([[990001,'Hyderabad','Hyderabad','',17.385,78.4867,'IN','India',0,'Asia/Kolkata']],'card-transport-fixture');
  const app=express();app.use(express.json());
  const handler=toNodeHandler(createMcpHandler(()=>createNightSkyMcpServer({resultCardPrototype:enabled,toolMode,placeIndex:index,fetcher:async()=>{external++;throw Error('External requests forbidden');}})));
  app.all('/mcp',(req,res)=>void handler(req,res,req.body));
  const server=createServer(app).listen(0,'127.0.0.1');await new Promise<void>(resolve=>server.once('listening',resolve));
  try{
   const address=server.address();assert.ok(address&&typeof address!=='string');
   const rpc=async(method:string,params:unknown)=>{
    const res=await fetch(`http://127.0.0.1:${address.port}/mcp`,{method:'POST',headers:{'content-type':'application/json',accept:'application/json, text/event-stream','mcp-protocol-version':'2025-11-25'},body:JSON.stringify({jsonrpc:'2.0',id:++id,method,params}),signal:AbortSignal.timeout(5000)});
    const body=await res.text(),data=body.split('\n').find(line=>line.startsWith('data: '));return JSON.parse(data?data.slice(6):body);
   };
   await rpc('initialize',{protocolVersion:'2025-11-25',capabilities:{},clientInfo:{name:'card-test',version:'1'}});
   const list=await rpc('tools/list',{}),planner=list.result.tools.find((t:any)=>t.name==='plan_observing_session');
   const resource=await rpc('resources/read',{uri:RESULT_CARD_URI});
   if(!enabled||toolMode==='resolver-only'){
    assert.ok(resource.error);
    assert.equal(planner?._meta,undefined);
   }else{
    assert.equal(planner._meta.ui.resourceUri,RESULT_CARD_URI);
    assert.equal(resource.result.contents[0].mimeType,'text/html;profile=mcp-app');
    const listed=await rpc('resources/list',{});assert.equal(listed.result.resources.length,1);
    const reply=await rpc('tools/call',{name:'plan_observing_session',arguments:{placeId:'place:v1:geonames:990001',activity:'general-stargazing',window:{startUtc:'2026-10-18T15:00:00Z',endUtc:'2026-10-18T18:00:00Z',timeZone:'Asia/Kolkata'}}});
    assert.ok(reply.result?._meta,JSON.stringify(reply));
    assert.equal(reply.result._meta.nightskyResultCard.status,'available');
    assert.match(reply.result.content[0].text,/Sources:/);
   }
   assert.equal(external,0);
  }finally{server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));}
 }
});

test('planning card is server-owned, bounded, complete and independent of the text result',async()=>{
 const server=await createFixtureServer(mkdtempSync(join(tmpdir(),'nightsky-card-')));
 try{
  const response=await server.rpc('tools/call',{name:'plan_observing_session',arguments:{placeId:'place:v1:geonames:990001',activity:'meteor-shower',target:'Geminids',window:{startUtc:'2026-12-13T18:00:00Z',endUtc:'2026-12-14T06:00:00Z',timeZone:'Europe/London'}}});
  const original=response.result,plan=original.structuredContent;
  const decorated=attachPlanningCard(original,plan,'Geminids');
  assert.deepEqual(decorated.content,original.content);
  assert.deepEqual(decorated.structuredContent,original.structuredContent);
  const card=decorated._meta.nightskyResultCard;
  assert.equal(card.status,'available');
  assert.ok(card.sources.some((s:any)=>s.name==='GeoNames'&&s.modified&&s.licenseUrl));
  assert.ok(card.details.includes('Moon illumination'));
  assert.equal(card.place,plan.place.displayName);
  const legacySummary='Old aggregate summary: cloud99% outside the requested session';
  const isolated=attachPlanningCard(original,{...plan,summary:legacySummary},'Geminids')._meta.nightskyResultCard;
  assert.equal(isolated.status,'available');
  assert.ok(!JSON.stringify(isolated).includes(legacySummary),'card must not promote the legacy aggregate summary as session-specific conditions');
  assert.ok(Buffer.byteLength(JSON.stringify(card))<=32768);
  const bad={...plan,sources:[{...plan.sources[0],url:'javascript:alert(1)'}]};
  assert.equal(attachPlanningCard(original,bad,'Geminids')._meta.nightskyResultCard.status,'unavailable');
  assert.deepEqual(attachPlanningCard(original,bad,'Geminids').content,original.content);
  const huge={...plan,summary:'x'.repeat(40000)};
  assert.equal(attachPlanningCard(original,huge,'Geminids')._meta.nightskyResultCard.status,'unavailable');
  assert.equal(server.externalAttempts(),0);
 }finally{await server.close();}
});

test('prototype switch leaves default and resolver-only registration unchanged',()=>{
 for(const enabled of [undefined,false,true])for(const toolMode of ['full','resolver-only'] as const){
  const tools:any[]=[];
  registerNightSkyTools({registerTool:(name:string,config:any)=>{tools.push({name,config});}} as any,{resultCardPrototype:enabled,toolMode});
  const planner=tools.find(row=>row.name==='plan_observing_session');
  if(toolMode==='resolver-only')assert.equal(planner,undefined);
  else if(enabled)assert.equal(planner.config._meta.ui.resourceUri,RESULT_CARD_URI);
  else assert.equal(planner.config._meta,undefined);
 }
 assert.throws(()=>createNightSkyMcpServer({resultCardPrototype:'yes' as any}),/prototype/i);
});

test('versioned MCP resource is self-contained with an empty external network policy',async()=>{
 let registration:any;
 registerResultCardResource({registerResource:(...args:any[])=>{registration=args;}} as any);
 assert.equal(registration[1],RESULT_CARD_URI);
 const result=await registration[3](new URL(RESULT_CARD_URI));
 const resource=result.contents[0];
 assert.equal(resource.mimeType,'text/html;profile=mcp-app');
 assert.deepEqual(resource._meta.ui.csp,{connectDomains:[],resourceDomains:[]});
 assert.match(resource.text,/ui\/initialize/);
 assert.match(resource.text,/ui\/notifications\/tool-result/);
 assert.doesNotMatch(resource.text,/<script[^>]+src=|fetch\(|localStorage|innerHTML|tools\/call/);
 assert.ok(Buffer.byteLength(resource.text)<24576);
});

test('card use labels follow available evidence, retain unavailable history and distinguish exact source notices',async()=>{
 const {planningCardSourceUses}=await import('../../server/mcp/resultCard');
 const source={name:'Shared',url:'https://example.test/shared',attribution:'First notice',dataClass:'context'};
 const other={...source,attribution:'Another notice'};
 const history={name:'C3S / ECMWF',url:'https://example.test/history',attribution:'Historical method credit',dataClass:'reanalysis'};
 const plan:any={place:{sources:[source]},requestedWindow:{startUtc:'2026-10-19T15:00:00Z',endUtc:'2026-10-19T18:00:00Z'},evidence:{astronomy:{availability:{status:'available'},moon:{illuminationPercent:50},sources:[source]},history:{availability:{status:'unavailable'},sources:[source,history]},weather:{forecasts:[{availability:{status:'available'},source:other,samples:[{validAt:'2026-10-20T15:00:00Z',values:{totalCloudCover:{value:12}}}]}]}}};
 assert.deepEqual(planningCardSourceUses(plan,[source,other,history]),[['location','calculation','history-reference'],['reference'],['history-reference']]);
 plan.evidence.weather.forecasts[0].samples[0].validAt='2026-10-19T16:00:00Z';
 assert.deepEqual(planningCardSourceUses(plan,[other]),[['forecast']]);
 const sample=plan.evidence.weather.forecasts[0].samples[0];
 sample.validAt='2026-10-19T14:00:00Z';
 sample.values.totalCloudCover={value:12,unit:'%',periodStartUtc:'2026-10-19T14:00:00Z',periodEndUtc:'2026-10-19T16:00:00Z'};
 assert.deepEqual(planningCardSourceUses(plan,[other]),[['forecast']],'native cloud period overlaps the session even when its anchor precedes it');
 sample.values.totalCloudCover.periodEndUtc='2026-10-19T15:00:00Z';
 assert.deepEqual(planningCardSourceUses(plan,[other]),[['reference']],'touching the start boundary is not aggregate overlap');
 sample.validAt='2026-10-19T16:00:00Z';sample.values={};
 assert.deepEqual(planningCardSourceUses(plan,[other]),[['reference']],'defensive helper must not infer values from an empty sample');
 sample.bands={totalCloudCover:{code:2,range:'20–30',unit:'%'}};
 assert.deepEqual(planningCardSourceUses(plan,[other]),[['forecast']],'a returned cloud category is supplied evidence without a numeric percentage');
 plan.evidence.history.availability.status='partial';plan.evidence.history.summary={validEligibleSamples:12};
 assert.deepEqual(planningCardSourceUses(plan,[history]),[['history']]);
 plan.evidence.history.summary.validEligibleSamples=0;
 assert.deepEqual(planningCardSourceUses(plan,[history]),[['history-reference']]);
 plan.evidence.astronomy.availability.status='unavailable';delete plan.evidence.history;
 assert.deepEqual(planningCardSourceUses(plan,[source]),[['location']],'unavailable astronomy must not add a calculated-values role');
});

test('card use helper defensively refuses a forecast role for a sample without values or bands',async()=>{
 const {planningCardSourceUses}=await import('../../server/mcp/resultCard');
 const source={name:'Weather',url:'https://example.test/weather',attribution:'Weather notice',dataClass:'forecast'};
 const plan:any={place:{sources:[]},requestedWindow:{startUtc:'2026-10-19T15:00:00Z',endUtc:'2026-10-19T18:00:00Z'},evidence:{weather:{forecasts:[{availability:{status:'available'},source,samples:[{validAt:'2026-10-19T16:00:00Z',values:{}}]}]}}};
 assert.deepEqual(planningCardSourceUses(plan,[source]),[['reference']]);
});
