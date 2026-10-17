import test from 'node:test';
import assert from 'node:assert/strict';
import { lightPollutionPointSchema, compareLightPollutionInputSchema, lightPollutionResultSchema, type LightPollutionResult, type LightPollutionProvider } from '../../shared/nightsky/lightPollution';
import { compareLightPollution } from '../../server/providers/lightPollution/index';
const point = { candidateId: 'a', latitude: 20, longitude: 77 };
function result(p = point): LightPollutionResult { return { candidateId:p.candidateId, sourceId:'darkskysites', transport:'api', status:'available', requestedPoint:{latitude:p.latitude,longitude:p.longitude}, observedPoint:{latitude:p.latitude,longitude:p.longitude}, coordinateBinding:'verified', retrievedAt:'2026-10-17T00:00:00Z', dataset:{label:'VIIRS',id:null,year:null,month:null}, sqm:21, unit:'mag/arcsec2', bortleClasses:[8,9], quality:{coverage:'unknown',notes:[],assessments:[]}, attribution:'Provider', sourceUrl:'https://darkskysites.com', limitations:[], errorCode:null }; }
function provider(overrides: Partial<LightPollutionProvider> = {}):LightPollutionProvider {return {sourceId:'darkskysites',transport:'api',lookup:async p=>result(p),...overrides};}
test('rejects invalid coordinates and candidate bounds',()=>{
 for (const value of [NaN,Infinity,-Infinity,91,-91]) assert.equal(lightPollutionPointSchema.safeParse({...point,latitude:value}).success,false);
 for (const value of [NaN,Infinity,-Infinity,181,-181]) assert.equal(lightPollutionPointSchema.safeParse({...point,longitude:value}).success,false);
 for (const candidates of [[],Array.from({length:6},(_,i)=>({candidateId:String(i),location:{kind:'coordinates',latitude:20,longitude:77}})),[{candidateId:'a',location:{kind:'coordinates',latitude:20,longitude:77}},{candidateId:'a',location:{kind:'coordinates',latitude:21,longitude:77}}]]) assert.equal(compareLightPollutionInputSchema.safeParse({candidates}).success,false);
});
test('validates resolved-place union and explicit adapter transport',()=>{
 assert.equal(compareLightPollutionInputSchema.safeParse({candidates:[{candidateId:'a',location:{kind:'selected-place',place:{placeId:'garbage'}}}]}).success,false);
 assert.equal(compareLightPollutionInputSchema.safeParse({candidates:[{candidateId:'a',location:{kind:'coordinates',latitude:20,longitude:77}}],adapters:['darkskysites']}).success,false);
 assert.equal(compareLightPollutionInputSchema.safeParse({candidates:[{candidateId:'a',location:{kind:'coordinates',latitude:20,longitude:77}}],adapters:[{sourceId:'darkskysites',transport:'api'}]}).success,true);
});
test('retains missing SQM and Bortle ranges without inventing metrics',()=>{
 assert.deepEqual(lightPollutionResultSchema.parse({...result(),sqm:null}).bortleClasses,[8,9]);
 for(const bortleClasses of [[0],[10],[1.5],[],[8,8]]) assert.equal(lightPollutionResultSchema.safeParse({...result(),bortleClasses}).success,false);
});
test('rejects unusable bindings, missing provenance, unavailable metrics and unverified zero',()=>{
 for(const patch of [{coordinateBinding:'rounded'},{coordinateBinding:'unverified'},{observedPoint:null},{observedPoint:{latitude:21,longitude:77}},{status:'unavailable'},{dataset:{label:null,id:null,year:null,month:null}},{quality:{coverage:'unverified_zero',notes:[],assessments:[]}}]) assert.equal(lightPollutionResultSchema.safeParse({...result(),...patch}).success,false);
});
test('deduplicates exact coordinates by source and transport while restoring candidate identity',async()=>{
 let calls=0; const api=provider({lookup:async p=>{calls++;return result(p);}}); const browser=provider({transport:'browser',lookup:async p=>({...result(p),transport:'browser'})});
 const output=await compareLightPollution([point,{...point,candidateId:'b'}],[api,browser,api]);
 assert.equal(calls,1); assert.equal(output.results.length,4); assert.deepEqual(output.results.map(r=>[r.candidateId,r.sourceId,r.transport]),[['a','darkskysites','api'],['a','darkskysites','browser'],['b','darkskysites','api'],['b','darkskysites','browser']]);
});
test('keeps nearby coordinates distinct and preserves per-source failures',async()=>{
 let calls=0;const good=provider({lookup:async p=>{calls++;return result(p);}}); const bad=provider({sourceId:'lightpollutionmap',lookup:async()=>{throw Error('secret');}});
 const output=await compareLightPollution([point,{...point,candidateId:'b',latitude:20.000001}],[good,bad]);
 assert.equal(calls,2);assert.deepEqual(output.results.map(r=>r.status),['available','unavailable','available','unavailable']);assert.equal(output.results[1].errorCode,'provider_error');assert.equal(JSON.stringify(output).includes('secret'),false);
});
test('invalid provider identity and malformed results become unavailable',async()=>{
 for(const lookup of [async p=>({...result(p),sourceId:'other'}),async p=>({...result(p),coordinateBinding:'rounded'})]) {const output=await compareLightPollution([point],[provider({lookup:lookup as LightPollutionProvider['lookup']})]);assert.equal(output.results[0].errorCode,'invalid_provider_result');}
});
test('cancellation settles unfinished providers even when they ignore the signal',async()=>{
 const controller=new AbortController();const pending=compareLightPollution([point],[provider({lookup:async()=>new Promise(()=>{})})],controller.signal);controller.abort();assert.equal((await pending).results[0].errorCode,'cancelled');
 let calls=0;await compareLightPollution([point],[provider({lookup:async p=>{calls++;return result(p);}})],controller.signal);assert.equal(calls,0);
});
test('retains structured provider provenance and bounds hostile output',()=>{
 const r={...result(),dataset:{...result().dataset,fallbackUsed:true,fallbackFrom:'2026-10',fallbackReason:'missing',datasetsChecked:2,requestedDate:null},quality:{...result().quality,status:'estimated',method:'viirs',coverageVerified:false,flags:['fallback']}};
 assert.equal(lightPollutionResultSchema.parse(r).dataset.fallbackUsed,true);
 assert.equal(lightPollutionResultSchema.safeParse({...result(),sourceUrl:'https://evil.example'}).success,false);
 assert.equal(lightPollutionResultSchema.safeParse({...result(),limitations:['x'.repeat(2001)]}).success,false);
});

test('rejects malformed URL without throwing and preserves a healthy source',async()=>{
 assert.equal(lightPollutionResultSchema.safeParse({...result(),sourceUrl:'not a url'}).success,false);
 const output=await compareLightPollution([point],[provider({lookup:async p=>({...result(p),sourceUrl:'not a url'})}),provider({sourceId:'lightpollutionmap',lookup:async p=>({...result(p),sourceId:'lightpollutionmap',sourceUrl:'https://www.lightpollutionmap.info'})})]);
 assert.deepEqual(output.results.map(r=>r.status),['unavailable','available']);
 assert.equal(output.results[0].errorCode,'invalid_provider_result');
});
test('rejects oversized retrieved timestamp fractional precision',()=>{
 assert.equal(lightPollutionResultSchema.safeParse({...result(),retrievedAt:'2026-10-17T00:00:00.'+'1'.repeat(10000)+'Z'}).success,false);
});
test('unexpected provider-result validation exceptions settle as unavailable',async()=>{
 const hostile=Object.defineProperty({...result()},'sourceUrl',{get(){throw Error('invalid evidence');}});
 const output=await compareLightPollution([point],[provider({lookup:async()=>hostile})]);
 assert.equal(output.results[0].errorCode,'invalid_provider_result');
});

test('batch adapter receives one deduplicated comparison and restores IDs despite reversed output',async()=>{
 let calls=0;let singles=0;const batch=provider({lookup:async p=>{singles++;return result(p);},lookupMany:async points=>{calls++;assert.equal(points.length,2);return points.map(p=>result(p)).reverse();}});
 const output=await compareLightPollution([point,{...point,candidateId:'b'},{...point,candidateId:'c',latitude:21}],[batch]);
 assert.equal(calls,1);assert.equal(singles,0);assert.deepEqual(output.results.map(r=>[r.candidateId,r.requestedPoint.latitude]),[['a',20],['b',20],['c',21]]);
});
test('batch missing, duplicate and mismatched rows fail per point; cancellation settles ignoring batch',async()=>{
 const other={...point,candidateId:'b',latitude:21};
 for(const rows of [[result()], [result(),result()], [result(),{...result(other),requestedPoint:{latitude:22,longitude:77}}]]){
 const output=await compareLightPollution([point,other],[provider({lookupMany:async()=>rows})]);assert.equal(output.results[1].errorCode,'invalid_provider_result');
 }
 const c=new AbortController();const pending=compareLightPollution([point],[provider({lookupMany:async()=>new Promise(()=>{})})],c.signal);c.abort();assert.equal((await pending).results[0].errorCode,'cancelled');
});

test('outer cancellation preserves completed browser batch rows and settles ignored batch',async()=>{
 const {BrowserBoundary}=await import('../../server/providers/lightPollution/browser');let secondStarted!:()=>void;const started=new Promise<void>(resolve=>{secondStarted=resolve;});
 const boundary=new BrowserBoundary({enabled:true,sourceId:'darkskysites',run:async(p,signal)=>{if(p.candidateId==='a')return {...result(p),transport:'browser'};secondStarted();return new Promise((_,reject)=>signal.addEventListener('abort',()=>reject(Error('cancelled')),{once:true}));}});
 const batch=provider({transport:'browser',lookupMany:(points,signal)=>boundary.compare(points,signal)});const c=new AbortController();
 const pending=compareLightPollution([point,{...point,candidateId:'b',latitude:21}],[batch],c.signal);await started;c.abort();
 const rows=(await pending).results;assert.equal(rows[0].status,'available');assert.equal(rows[0].sqm,21);assert.equal(rows[1].status,'unavailable');assert.equal(rows[1].sqm,null);await boundary.close();
 const ignoring=new AbortController();let dispatched!:()=>void;const entered=new Promise<void>(resolve=>{dispatched=resolve;});const start=Date.now();const unresolved=compareLightPollution([point],[provider({lookupMany:async()=>{dispatched();return new Promise(()=>{});}})],ignoring.signal);await entered;ignoring.abort();assert.equal((await unresolved).results[0].errorCode,'cancelled');assert.ok(Date.now()-start<500);
});
