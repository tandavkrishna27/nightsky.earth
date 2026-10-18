import assert from 'node:assert/strict';
import test from 'node:test';
import type {McpServer} from '@modelcontextprotocol/server';
import {registerNightSkyTools, type NightSkyDependencies} from '../../server/mcp/registerTools';
import {createApiServices} from '../../server/places/api/configuration';

function registry(dependencies: NightSkyDependencies = {}) {
 const tools=new Map<string,any>();
 registerNightSkyTools({registerTool(name:string,config:any,handler:any){tools.set(name,{config,handler});}} as unknown as McpServer,dependencies);
 return {tools,async invoke(name:string,input:any){const t=tools.get(name); const r=await t.handler(t.config.inputSchema.parse(input),{});return t.config.outputSchema.parse(r.structuredContent);}};
}
function fixture(climateProvider?: NightSkyDependencies['climateProvider']) {
 let calls=0;
 const api=createApiServices({geoapifyApiKey:'fixture',userAgent:'Offline API history wording',fetcher:async()=>{calls++;return Response.json({type:'FeatureCollection',features:[{type:'Feature',properties:{place_id:'park',name:'Park',categories:['leisure.park']},geometry:{type:'Point',coordinates:[78.47,17.36]}}]});}});
 return {...registry({...api,climateProvider,placeIndexLoader:async()=>{throw Error('No local artifact');},fetcher:async()=>{throw Error('No external transport');}}),get calls(){return calls;}};
}
async function selected(f:ReturnType<typeof fixture>){const p=(await f.invoke('resolve_place',{placeQuery:'Park, Hyderabad'})).matches[0];return {placeId:p.placeId,sourceRevision:p.sourceRevision,displayTimeZone:'Asia/Kolkata',month:10};}

test('API history without an approved provider reports optional unavailable evidence without acquisition',async()=>{
 const f=fixture(),ref=await selected(f),before=f.calls;
 const result=await f.invoke('get_clear_sky_climatology',ref);
 assert.match(f.tools.get('get_clear_sky_climatology').config.description,/optional.*approved.*historical/i);
 assert.doesNotMatch(f.tools.get('get_clear_sky_climatology').config.description,/locally installed/i);
 assert.match(result.availability.reason,/no approved historical data.*selected.*snapshot/i);
 assert.match(result.availability.reason,/optional/i);
 assert.doesNotMatch(JSON.stringify({availability:result.availability,caveats:result.caveats,sources:result.sources}),/baseline.*not installed|configured historical dataset|dataset coverage requirement/i);
 assert.match(result.sources[0].attribution,/reference only.*no.*data.*used/i);
 assert.equal(result.sourceRevision,ref.sourceRevision);
 assert.equal(result.summary,undefined);assert.equal(result.bins,undefined);
 assert.equal(result.period.kind,'baseline-1991-2020');assert.equal(result.methodVersion,'dark-cloud-v1');
 assert.equal(f.calls,before,'history must not trigger transport or acquisition');
});

test('configured API history provider remains the selected evidence path',async()=>{
 const empty=fixture(),emptyRef=await selected(empty),response=await empty.invoke('get_clear_sky_climatology',emptyRef);
 let call:any;
 const f=fixture({async getClimatology(placeId,month,point){call={placeId,month,point};return {...response,availability:{status:'unavailable',reason:'Configured approved provider response'}};}});
 const ref=await selected(f),result=await f.invoke('get_clear_sky_climatology',ref);
 assert.equal(result.availability.reason,'Configured approved provider response');
 assert.equal(call.placeId,ref.placeId);assert.equal(call.month,10);assert.equal(call.point.sourceRevision,ref.sourceRevision);
});

test('legacy history tool retains installed ERA5 description',()=>{
 assert.match(registry().tools.get('get_clear_sky_climatology').config.description,/Read locally installed ERA5 monthly historical cloud statistics/);
});
