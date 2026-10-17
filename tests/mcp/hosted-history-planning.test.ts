import test from 'node:test';
import assert from 'node:assert/strict';
import type { McpServer } from '@modelcontextprotocol/server';
import { registerNightSkyTools } from '../../server/mcp/registerTools';
import { createApiServices } from '../../server/places/api/configuration';
import { aggregateHostedHistory, createHostedHistoryPreviewProvider } from '../../server/providers/climate/openMeteoHistoryServing';
import { planOpenMeteoHistory } from '../../server/providers/climate/openMeteoHistoryContract';

// Entire transport and retained payload are synthetic. No provider is contacted.
test('hosted sample-only history crosses MCP and planner at the selected API snapshot', async () => {
  const partition = planOpenMeteoHistory({latitude:28.5,longitude:77.25})[0]!;
  const aggregate = aggregateHostedHistory([{partition,retrievedAt:'2026-10-17T00:00:00Z',bytes:Buffer.from(JSON.stringify({
    latitude:28.5,longitude:77.25,utc_offset_seconds:0,
    hourly_units:{time:'unixtime',cloud_cover:'%'},
    hourly:{time:Array.from({length:336},(_,i)=>partition.startUnixSeconds+i*3600),cloud_cover:Array(336).fill(10)},
  }))}],{timeZone:'Asia/Kolkata',startNight:'1991-01-01',endNight:'1991-01-10',maxHours:336,maxRetainedBytes:100000,maxElapsedMs:10000});
  const preview=createHostedHistoryPreviewProvider(aggregate);
  let transportCalls=0;
  const api=createApiServices({geonamesUsername:'synthetic',geoapifyApiKey:'synthetic',userAgent:'Synthetic offline test',now:()=>Date.parse('2026-10-17T00:00:00Z'),fetcher:async url=>{
    transportCalls++;
    return new Response(JSON.stringify(String(url).includes('geonames')?{geonames:[{geonameId:1,name:'Synthetic town',lat:'28.5',lng:'77.25',timezone:{timeZoneId:'Asia/Kolkata'}}]}:{features:[
      {properties:{place_id:'selected-park',name:'Selected synthetic park',categories:['leisure.park']},geometry:{type:'Point',coordinates:[77.25,28.5]}},
      {properties:{place_id:'other-park',name:'Other synthetic park',categories:['leisure.park']},geometry:{type:'Point',coordinates:[77.27,28.51]}},
    ]}));
  }});
  const tools=new Map<string,any>();
  registerNightSkyTools({registerTool(name:string,config:any,handler:any){tools.set(name,{config,handler});}} as unknown as McpServer,{
    ...api,climateProvider:preview,placeIndexLoader:async()=>{throw Error('Local index must not load');},
    weatherProvider:{async getForecast(){return {status:'unavailable',reason:'Synthetic offline forecast gap'};}},
  });
  const invoke=async(name:string,input:any)=>{
    const tool=tools.get(name);
    const result=await tool.handler(tool.config.inputSchema.parse(input),{mcpReq:{_meta:{}}});
    return tool.config.outputSchema.parse(result.structuredContent);
  };
  const resolved=await invoke('resolve_place',{placeQuery:'Synthetic town'});
  const origin=resolved.matches[0];
  const found=await invoke('search_observing_locations',{placeId:origin.placeId,sourceRevision:origin.sourceRevision,radiusKm:50});
  const selected=found.candidates.find((c:any)=>c.name==='Selected synthetic park');
  const other=found.candidates.find((c:any)=>c.name==='Other synthetic park');
  assert.ok(selected&&other);
  const ref={placeId:selected.placeId,sourceRevision:selected.sourceRevision,displayTimeZone:'Asia/Kolkata'};
  const callsAfterDiscovery=transportCalls;
  const history=await invoke('get_clear_sky_climatology',{...ref,month:1});
  assert.equal(history.sourceRevision,ref.sourceRevision);
  assert.notEqual(history.sourceRevision,aggregate.cacheKey);
  assert.equal(history.placeId,ref.placeId);
  assert.equal(history.availability.status,'partial');
  assert.equal(history.period.kind,'sample-only');
  assert.equal(history.methodVersion,'open-meteo-quantized-dark-cloud-v1');
  assert.ok(history.summary.validEligibleSamples>0);
  assert.equal(history.bins.length,24);
  assert.ok(history.caveats.some((c:string)=>c.includes(aggregate.cacheKey)));
  const plan=await invoke('plan_observing_session',{...ref,activity:'general-stargazing',window:{startUtc:'2026-01-05T14:00:00Z',endUtc:'2026-01-05T20:00:00Z',timeZone:'Asia/Kolkata'}});
  assert.deepEqual(plan.evidence.history,history);
  for(const mismatch of [{...ref,displayTimeZone:'UTC'},{placeId:other.placeId,sourceRevision:other.sourceRevision,displayTimeZone:'Asia/Kolkata'}]){
    const unavailable=await invoke('get_clear_sky_climatology',{...mismatch,month:1});
    assert.equal(unavailable.availability.status,'unavailable');
    assert.equal(unavailable.sourceRevision,mismatch.sourceRevision);
    assert.equal(unavailable.timeZone,mismatch.displayTimeZone);
    assert.equal(unavailable.summary,undefined);
    assert.equal(unavailable.bins,undefined);
  }
  assert.equal(transportCalls,callsAfterDiscovery,'History and planning must not fetch hosted archive data');
});
