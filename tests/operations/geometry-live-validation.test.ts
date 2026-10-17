import test from 'node:test';
import assert from 'node:assert/strict';
import {runGeometryValidation, selectCountry, createGeometryGuard} from '../../scripts/validate-geometry-live';
test('default invocation is offline',async()=>{assert.equal((await runGeometryValidation([],{})).mode,'offline');});
test('country selection rejects duplicates and wrong metadata',()=>{const f={type:'Feature',properties:{place_id:'abc123',country_code:'va',result_type:'country'}};assert.equal(selectCountry({type:'FeatureCollection',features:[f]},'va'),'abc123');assert.throws(()=>selectCountry({type:'FeatureCollection',features:[f,f]},'va'));assert.throws(()=>selectCountry({type:'FeatureCollection',features:[f]},'sm'));});
test('guard persists before network and forbids changes and repeats',async()=>{let calls=0;const rows:unknown[]=[];const g=createGeometryGuard({key:'secret',fetcher:async()=>{assert.ok(rows.length);calls++;return new Response('{}');},persist:async r=>{rows.push(r);}});try{g.expect('/v1/geocode/search',{text:'Vatican City',type:'country',limit:'5',format:'geojson'});const u='https://api.geoapify.com/v1/geocode/search?text=Vatican+City&type=country&limit=5&format=geojson&apiKey=secret';await g.fetcher(u);await assert.rejects(()=>g.fetcher(u));assert.equal(calls,1);assert.ok(!JSON.stringify(rows).includes('secret'));}finally{g.close();}});
test('oversized body stops guard without retry',async()=>{const g=createGeometryGuard({key:'secret',fetcher:async()=>new Response('x'.repeat(262145)),persist:async()=>{}});try{g.expect('/v1/geocode/search',{text:'Vatican City',type:'country',limit:'5',format:'geojson'});await assert.rejects(()=>g.fetcher('https://api.geoapify.com/v1/geocode/search?text=Vatican+City&type=country&limit=5&format=geojson&apiKey=secret'));assert.equal(g.stopped,true);}finally{g.close();}});
test('guard rejects packet expansion before dispatch',()=>{const g=createGeometryGuard({key:'secret',fetcher:async()=>{throw Error('must not call');},persist:async()=>{}});try{assert.throws(()=>g.expect('/v2/places',{categories:'leisure.park',filter:'place:x',limit:'20'}));}finally{g.close();}});
test('journal failure prevents network',async()=>{let calls=0;const g=createGeometryGuard({key:'secret',fetcher:async()=>{calls++;return new Response('{}');},persist:async()=>{throw Error('disk failure');}});try{g.expect('/v1/geocode/search',{text:'Vatican City',type:'country',limit:'5',format:'geojson'});await assert.rejects(()=>g.fetcher('https://api.geoapify.com/v1/geocode/search?text=Vatican+City&type=country&limit=5&format=geojson&apiKey=secret'));assert.equal(calls,0);}finally{g.close();}});
const geocode=(text:string)=>({text,type:'country',limit:'5',format:'geojson'});
const request=async(g:ReturnType<typeof createGeometryGuard>,path:string,query:Record<string,string>)=>{g.expect(path,query);const u=new URL(path,'https://api.geoapify.com');for(const[k,v]of Object.entries({...query,apiKey:'secret'}))u.searchParams.set(k,v);return g.fetcher(u);};
test('fixed six-request nine-credit packet binds selected identities and blocks seventh',async()=>{
 const rows:any[]=[];let calls=0;const g=createGeometryGuard({key:'secret',fetcher:async()=>{calls++;return new Response('{}');},persist:async r=>{rows.push(r);}});
 try{await request(g,'/v1/geocode/search',geocode('Vatican City'));await request(g,'/v1/geocode/search',geocode('San Marino'));g.selectCountries('va-id','sm-id');assert.throws(()=>g.expect('/v2/place-details',{id:'unselected',features:'details,details.full_geometry'}));for(const id of ['va-id','sm-id'])await request(g,'/v2/place-details',{id,features:'details,details.full_geometry'});await request(g,'/v2/places',{categories:'leisure.park',filter:'place:va-id',limit:'20'});await request(g,'/v2/place-details',{id:'va-id',features:'details,details.full_geometry'});assert.throws(()=>g.expect('/v2/place-details',{id:'va-id',features:'details,details.full_geometry'}));assert.equal(calls,6);assert.equal(rows.filter(r=>r.outcome==='started').reduce((n,r)=>n+r.cost,0),9);}finally{g.close();}
});
test('elapsed deadline blocks request and real deadline aborts stalled body',async()=>{
 let now=0;const g=createGeometryGuard({key:'secret',now:()=>now,fetcher:async()=>{throw Error('must not call');},persist:async()=>{}});try{now=120001;assert.throws(()=>g.expect('/v1/geocode/search',geocode('Vatican City')));}finally{g.close();}
 const stalled=createGeometryGuard({key:'secret',deadlineMs:10,fetcher:async()=>new Response(new ReadableStream({start(){}})),persist:async()=>{}});try{await assert.rejects(()=>request(stalled,'/v1/geocode/search',geocode('Vatican City')));assert.equal(stalled.stopped,true);}finally{stalled.close();}
});
test('post-fetch receipt persistence failure rejects response',async()=>{let writes=0;const g=createGeometryGuard({key:'secret',fetcher:async()=>new Response('{}'),persist:async()=>{if(++writes===2)throw Error('disk');}});try{await assert.rejects(()=>request(g,'/v1/geocode/search',geocode('Vatican City')));assert.equal(g.stopped,true);}finally{g.close();}});
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {initializeProviderQuota} from '../../scripts/initialize-provider-quota';
import {GEOMETRY_ENVELOPE} from '../../scripts/validate-geometry-live';
test('existing synthetic quota debits nine credits; exclusive journal prevents rerun; missing quota never initialized',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'geometry-validation-'));
 const env={NIGHTSKY_DISCOVERY_MODE:'api',NIGHTSKY_LIVE_APPROVED_ENVELOPE:GEOMETRY_ENVELOPE,NIGHTSKY_LIVE_GEOAPIFY_ADMITTED:'yes',NIGHTSKY_LIVE_BATCH_ID:'synthetic',NIGHTSKY_QUOTA_STATE_PATH:join(dir,'quota.json'),NIGHTSKY_GEOAPIFY_API_KEY:'secret'};
 let calls=0;const fetcher:typeof fetch=async input=>{calls++;const u=new URL(String(input));if(u.pathname==='/v1/geocode/search'){const code=u.searchParams.get('text')==='Vatican City'?'va':'sm';return Response.json({type:'FeatureCollection',features:[{type:'Feature',properties:{place_id:code+'-id',country_code:code,result_type:'country'}}]});}if(u.pathname==='/v2/places')return Response.json({type:'FeatureCollection',features:[]});return Response.json({type:'FeatureCollection',features:[{type:'Feature',properties:{place_id:u.searchParams.get('id'),feature_type:'details'},geometry:{type:'Polygon',coordinates:[[[12,41],[13,41],[13,42],[12,42],[12,41]]]}}]});};
 try{
  await assert.rejects(()=>runGeometryValidation(['--live'],env,{fetcher}));assert.equal(calls,0);await assert.rejects(()=>readFile(env.NIGHTSKY_QUOTA_STATE_PATH));
  await initializeProviderQuota({...env,NIGHTSKY_QUOTA_VERIFIED_UNUSED_BUDGET:'yes',NIGHTSKY_QUOTA_VERIFICATION_EVIDENCE:'Synthetic test only'});
  const report=await runGeometryValidation(['--live'],env,{fetcher});assert.equal(report.status,'completed');assert.equal(calls,6);
  const checkpoint=JSON.parse(await readFile(env.NIGHTSKY_QUOTA_STATE_PATH,'utf8'));assert.equal(Object.values(checkpoint.entries.geoapify.buckets).reduce((a:any,b:any)=>a+b,0),9);
  const journal=await readFile(join(dir,'geometry-live-synthetic.jsonl'),'utf8');assert.equal(journal.includes('secret'),false);assert.equal(journal.includes('coordinates'),false);
  await assert.rejects(()=>runGeometryValidation(['--live'],env,{fetcher}));assert.equal(calls,6);
  let emptyCalls=0;const empty=await runGeometryValidation(['--live'],{...env,NIGHTSKY_LIVE_BATCH_ID:'empty-synthetic'},{fetcher:async()=>{emptyCalls++;return Response.json({type:'FeatureCollection',features:[],hostile:'secret'});}});
  assert.equal(emptyCalls,1);assert.equal(empty.status,'stopped');assert.equal(empty.stopReason,'selection-empty');assert.equal(empty.phase,'vatican-geocode');
  const emptyJournal=await readFile(join(dir,'geometry-live-empty-synthetic.jsonl'),'utf8');assert.equal(emptyJournal.includes('secret'),false);
  const emptyRows=emptyJournal.trim().split('\n').map(line=>JSON.parse(line));assert.equal(emptyRows.find(row=>row.selectionFacts)?.selectionFacts.featureCount,0);assert.ok(emptyRows.findIndex(row=>row.selectionFacts)<emptyRows.findIndex(row=>row.stopped));
 }finally{assert.ok(dir.startsWith(join(tmpdir(),'geometry-validation-')));await rm(dir,{recursive:true,force:true});}
});
import {selectionFacts} from '../../scripts/validate-geometry-live';
test('selection facts distinguish empty malformed ambiguous and mismatched without retaining upstream strings',()=>{
 assert.deepEqual(selectionFacts({type:'FeatureCollection',features:[]},'va'),{featureCollectionValid:true,featuresArrayValid:true,featureCount:0,withinLimit:true,eligibleCount:0,features:[]});
 assert.equal(selectionFacts({type:'secret',features:'secret'},'va').featureCollectionValid,false);
 const f={type:'Feature',properties:{country_code:'va',result_type:'country',place_id:'secret'}};
 const facts=selectionFacts({type:'FeatureCollection',features:[f,f]},'va');assert.equal(facts.eligibleCount,2);assert.equal(JSON.stringify(facts).includes('secret'),false);
 assert.equal(selectionFacts({type:'FeatureCollection',features:[f]},'sm').eligibleCount,0);
 for(const [value,reason]of [[{type:'FeatureCollection',features:[]},'selection-empty'],[{features:[]},'selection-malformed'],[{type:'FeatureCollection',features:[f,f]},'selection-ambiguous'],[{type:'FeatureCollection',features:[{...f,properties:{...f.properties,country_code:'sm'}}]},'selection-no-eligible-country']] as const)assert.throws(()=>selectCountry(value,'va'),(error:any)=>error.reason===reason);
});
