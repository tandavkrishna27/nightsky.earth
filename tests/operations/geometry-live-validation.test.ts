import test from 'node:test';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {runGeometryValidation, selectCountry, createGeometryGuard, countryQuery} from '../../scripts/validate-geometry-live';
test('default invocation is offline',async()=>{assert.equal((await runGeometryValidation([],{})).mode,'offline');});
test('country selection rejects duplicates and wrong metadata',()=>{const f={type:'Feature',properties:{place_id:'abc123',country_code:'va',result_type:'country'}};assert.equal(selectCountry({type:'FeatureCollection',features:[f]},'va'),'abc123');assert.throws(()=>selectCountry({type:'FeatureCollection',features:[f,f]},'va'));assert.throws(()=>selectCountry({type:'FeatureCollection',features:[f]},'sm'));});
test('guard persists before network and forbids changes and repeats',async()=>{let calls=0;const rows:unknown[]=[];const g=createGeometryGuard({key:'secret',fetcher:async()=>{assert.ok(rows.length);calls++;return new Response('{}');},persist:async r=>{rows.push(r);}});try{g.expect('/v1/geocode/search',geocode('Vatican City'));const u=urlFor(geocode('Vatican City'));await g.fetcher(u);await assert.rejects(()=>g.fetcher(u));assert.equal(calls,1);assert.ok(!JSON.stringify(rows).includes('secret'));}finally{g.close();}});
test('oversized body stops guard without retry',async()=>{const g=createGeometryGuard({key:'secret',fetcher:async()=>new Response('x'.repeat(262145)),persist:async()=>{}});try{g.expect('/v1/geocode/search',geocode('Vatican City'));await assert.rejects(()=>g.fetcher(urlFor(geocode('Vatican City'))));assert.equal(g.stopped,true);}finally{g.close();}});
test('guard rejects packet expansion before dispatch',()=>{const g=createGeometryGuard({key:'secret',fetcher:async()=>{throw Error('must not call');},persist:async()=>{}});try{assert.throws(()=>g.expect('/v2/places',{categories:'leisure.park',filter:'place:x',limit:'20'}));}finally{g.close();}});
test('journal failure prevents network',async()=>{let calls=0;const g=createGeometryGuard({key:'secret',fetcher:async()=>{calls++;return new Response('{}');},persist:async()=>{throw Error('disk failure');}});try{g.expect('/v1/geocode/search',geocode('Vatican City'));await assert.rejects(()=>g.fetcher(urlFor(geocode('Vatican City'))));assert.equal(calls,0);}finally{g.close();}});
const geocode=(text:string)=>countryQuery(text,text==='Vatican City'?'va':'sm');
const urlFor=(query:Record<string,string>)=>'https://api.geoapify.com/v1/geocode/search?'+new URLSearchParams({...query,apiKey:'secret'});
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
 let calls=0;const fetcher:typeof fetch=async input=>{calls++;const u=new URL(String(input));if(u.pathname==='/v1/geocode/search'){const code=u.searchParams.get('country')==='Vatican City'?'va':'sm';return Response.json({type:'FeatureCollection',features:[{type:'Feature',properties:{place_id:code+'-id',country_code:code,result_type:'country'}}]});}if(u.pathname==='/v2/places')return Response.json({type:'FeatureCollection',features:[]});return Response.json({type:'FeatureCollection',features:[{type:'Feature',properties:{feature_type:'walk_10'},geometry:{type:'Polygon',coordinates:[[[20,10],[21,10],[21,11],[20,11],[20,10]]]}},{type:'Feature',properties:{place_id:u.searchParams.get('id'),feature_type:'details'},geometry:{type:'Polygon',coordinates:[[[12,41],[13,41],[13,42],[12,42],[12,41]]]}}]});};
 try{
  await assert.rejects(()=>runGeometryValidation(['--live'],env,{fetcher}));assert.equal(calls,0);await assert.rejects(()=>readFile(env.NIGHTSKY_QUOTA_STATE_PATH));
  await initializeProviderQuota({...env,NIGHTSKY_QUOTA_VERIFIED_UNUSED_BUDGET:'yes',NIGHTSKY_QUOTA_VERIFICATION_EVIDENCE:'Synthetic test only'});
  const report=await runGeometryValidation(['--live'],env,{fetcher});assert.ok('status' in report);assert.equal(report.status,'completed');assert.equal(calls,6);assert.equal((report.results[0] as any).normalizedHash,createHash('sha256').update(JSON.stringify({type:'Polygon',coordinates:[[[12,41],[13,41],[13,42],[12,42],[12,41]]]})).digest('hex'));
  const checkpoint=JSON.parse(await readFile(env.NIGHTSKY_QUOTA_STATE_PATH,'utf8'));assert.equal(Object.values(checkpoint.entries.geoapify.buckets).reduce((a:any,b:any)=>a+b,0),9);
  const journal=await readFile(join(dir,'geometry-live-synthetic.jsonl'),'utf8');assert.equal(journal.includes('secret'),false);assert.equal(journal.includes('coordinates'),false);
  await assert.rejects(()=>runGeometryValidation(['--live'],env,{fetcher}));assert.equal(calls,6);
  let emptyCalls=0;const empty=await runGeometryValidation(['--live'],{...env,NIGHTSKY_LIVE_BATCH_ID:'empty-synthetic'},{fetcher:async()=>{emptyCalls++;return Response.json({type:'FeatureCollection',features:[],hostile:'secret'});}});
  assert.ok('status' in empty);assert.equal(emptyCalls,1);assert.equal(empty.status,'stopped');assert.equal(empty.stopReason,'selection-empty');assert.equal(empty.phase,'vatican-geocode');
  const emptyJournal=await readFile(join(dir,'geometry-live-empty-synthetic.jsonl'),'utf8');assert.equal(emptyJournal.includes('secret'),false);
  const emptyRows=emptyJournal.trim().split('\n').map(line=>JSON.parse(line));assert.equal(emptyRows.find(row=>row.selectionFacts)?.selectionFacts.featureCount,0);assert.ok(emptyRows.findIndex(row=>row.selectionFacts)<emptyRows.findIndex(row=>row.stopped));
  let pointCalls=0;const point=await runGeometryValidation(['--live'],{...env,NIGHTSKY_LIVE_BATCH_ID:'point-synthetic'},{fetcher:async input=>{
   pointCalls++;const u=new URL(String(input));
   if(u.pathname==='/v1/geocode/search'){const code=u.searchParams.get('country')==='Vatican City'?'va':'sm';return Response.json({type:'FeatureCollection',features:[{type:'Feature',properties:{place_id:code+'-id',country_code:code,result_type:'country'}}]});}
   assert.equal(u.pathname,'/v2/place-details');return Response.json({type:'FeatureCollection',features:[{type:'Feature',properties:{feature_type:'walk_10'},geometry:{type:'Polygon',coordinates:[[[12,41],[13,41],[13,42],[12,42],[12,41]]]}},{type:'Feature',properties:{feature_type:'details',place_id:u.searchParams.get('id')},geometry:{type:'Point',coordinates:[12,41]}}]});
  }});
  assert.ok('status' in point);assert.equal(pointCalls,3);assert.equal(point.status,'stopped');assert.equal(point.stopReason,'geometry-parser-rejected');assert.equal(point.phase,'vatican-details');assert.deepEqual(point.results,[]);
 }finally{assert.ok(dir.startsWith(join(tmpdir(),'geometry-validation-')));await rm(dir,{recursive:true,force:true});}
});
import {selectionFacts} from '../../scripts/validate-geometry-live';
import {geometryFacts} from '../../scripts/validate-geometry-live';
test('selection facts distinguish empty malformed ambiguous and mismatched without retaining upstream strings',()=>{
 assert.deepEqual(selectionFacts({type:'FeatureCollection',features:[]},'va'),{featureCollectionValid:true,featuresArrayValid:true,featureCount:0,withinLimit:true,eligibleCount:0,features:[]});
 assert.equal(selectionFacts({type:'secret',features:'secret'},'va').featureCollectionValid,false);
 const f={type:'Feature',properties:{country_code:'va',result_type:'country',place_id:'secret'}};
 const facts=selectionFacts({type:'FeatureCollection',features:[f,f]},'va');assert.equal(facts.eligibleCount,2);assert.equal(JSON.stringify(facts).includes('secret'),false);
 assert.equal(selectionFacts({type:'FeatureCollection',features:[f]},'sm').eligibleCount,0);
 for(const [value,reason]of [[{type:'FeatureCollection',features:[]},'selection-empty'],[{features:[]},'selection-malformed'],[{type:'FeatureCollection',features:[f,f]},'selection-ambiguous'],[{type:'FeatureCollection',features:[{...f,properties:{...f.properties,country_code:'sm'}}]},'selection-no-eligible-country']] as const)assert.throws(()=>selectCountry(value,'va'),(error:any)=>error.reason===reason);
});

test('revised offline proposal exposes one structured country selection and a fresh envelope',async()=>{
 const proposal=await runGeometryValidation([],{});
 assert.notEqual(proposal.envelope,'geometry-live-v1-6-9-120-zero-retries');
 assert.ok('selectionCheck' in proposal);const check=proposal.selectionCheck;
 assert.equal(check.maxRequests,1);assert.equal(check.maxCredits,1);assert.equal(check.deadlineMs,30000);
 assert.deepEqual(check.query,{country:'Vatican City',type:'country',filter:'countrycode:va',bias:'countrycode:none',limit:'5',format:'geojson'});
});

test('selection accepts bounded opaque IDs without weakening country type or ambiguity checks',()=>{
 const f={type:'Feature',properties:{place_id:'source:id/opaque%2F',country_code:'va',result_type:'country'}};
 assert.equal(selectCountry({type:'FeatureCollection',features:[f]},'va'),f.properties.place_id);
 for(const bad of ['a','control\nvalue','x'.repeat(2049)])assert.throws(()=>selectCountry({type:'FeatureCollection',features:[{...f,properties:{...f.properties,place_id:bad}}]},'va'));
 assert.throws(()=>selectCountry({type:'FeatureCollection',features:[f,f]},'va'));
});

test('one-request selection check persists safe facts and never proceeds to geometry or a second country',async()=>{
 const proposal=await runGeometryValidation([],{});assert.ok('selectionCheck' in proposal);const selection=proposal.selectionCheck;
 assert.ok(selection);
 const dir=await mkdtemp(join(tmpdir(),'geometry-selection-'));
 const env={NIGHTSKY_DISCOVERY_MODE:'api',NIGHTSKY_LIVE_APPROVED_ENVELOPE:selection.envelope,NIGHTSKY_LIVE_GEOAPIFY_ADMITTED:'yes',NIGHTSKY_LIVE_BATCH_ID:'selection-synthetic',NIGHTSKY_QUOTA_STATE_PATH:join(dir,'quota.json'),NIGHTSKY_GEOAPIFY_API_KEY:'fixture-key'};
 let calls=0;
 try{
  await initializeProviderQuota({...env,NIGHTSKY_QUOTA_VERIFIED_UNUSED_BUDGET:'yes',NIGHTSKY_QUOTA_VERIFICATION_EVIDENCE:'Synthetic test only'});
  const report=await runGeometryValidation(['--selection-live'],env,{fetcher:async input=>{
   calls++;const u=new URL(String(input));assert.equal(u.pathname,'/v1/geocode/search');const query=Object.fromEntries(u.searchParams);delete query.apiKey;assert.deepEqual(query,selection.query);
   return Response.json({type:'FeatureCollection',features:[{type:'Feature',properties:{place_id:'vatican-selected',country_code:'va',result_type:'country'}}]});
  }});
  assert.ok('status' in report);assert.equal(calls,1);assert.equal(report.status,'selection-completed');assert.deepEqual(report.results,[]);assert.equal(report.sourceAccepted,false);
  const journal=await readFile(join(dir,'geometry-live-selection-synthetic.jsonl'),'utf8');assert.equal(journal.includes('fixture-key'),false);assert.equal(journal.includes('coordinates'),false);
  const quota=JSON.parse(await readFile(env.NIGHTSKY_QUOTA_STATE_PATH,'utf8'));assert.equal(Object.values(quota.entries.geoapify.buckets).reduce((a:any,b:any)=>a+b,0),1);
  await assert.rejects(()=>runGeometryValidation(['--selection-live'],env,{fetcher:async()=>{calls++;throw Error('must not retry');}}));assert.equal(calls,1);
 }finally{await rm(dir,{recursive:true,force:true});}
});

test('selection packet forbids old queries, filter changes and all second dispatches',async()=>{
 let calls=0;const g=createGeometryGuard({packet:'selection',key:'secret',fetcher:async()=>{calls++;return Response.json({});},persist:async()=>{}});
 try{
  assert.throws(()=>g.expect('/v1/geocode/search',{text:'Vatican City',type:'country',limit:'5',format:'geojson'}));
  assert.throws(()=>g.expect('/v1/geocode/search',{...geocode('Vatican City'),filter:'countrycode:it'}));
  await request(g,'/v1/geocode/search',geocode('Vatican City'));
  assert.throws(()=>g.expect('/v1/geocode/search',geocode('San Marino')));
  assert.throws(()=>g.expect('/v2/place-details',{id:'selected',features:'details,details.full_geometry'}));
  assert.equal(calls,1);
 }finally{g.close();}
});

test('consumed v1 geometry envelope is refused before quota or credential-backed transport',async()=>{
 await assert.rejects(()=>runGeometryValidation(['--live'],{NIGHTSKY_LIVE_APPROVED_ENVELOPE:'geometry-live-v1-6-9-120-zero-retries',NIGHTSKY_GEOAPIFY_API_KEY:'fixture',NIGHTSKY_QUOTA_STATE_PATH:'never-inspect',NIGHTSKY_LIVE_BATCH_ID:'old',NIGHTSKY_LIVE_GEOAPIFY_ADMITTED:'yes',NIGHTSKY_DISCOVERY_MODE:'api'},{fetcher:async()=>{throw Error('must not dispatch');}}),/Geometry validation refused or stopped/);
});

test('safe geometry diagnostics count documented feature types without recursive traversal',()=>{
 let coordinates:any=[1,2];for(let i=0;i<12000;i++)coordinates=[coordinates];
 const facts=geometryFacts({features:[{properties:{feature_type:'walk_10'},geometry:{type:'Polygon',coordinates}}]},'selected');
 assert.equal(facts.features[0]?.featureType,'walk_10');
 assert.equal(facts.features[0]?.countsTruncated,true);
});
