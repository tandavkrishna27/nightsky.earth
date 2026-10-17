import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {runGeometryValidation, createGeometryGuard} from '../../scripts/validate-geometry-live';
import {initializeProviderQuota} from '../../scripts/initialize-provider-quota';
const envelope='geometry-selection-filter-probe-va-1-1-30-zero-retries';
const query={country:'Vatican City',type:'country',bias:'countrycode:none',limit:'5',format:'geojson'};
test('filter probe requires distinct authority before any quota access',async()=>{
 for(const old of ['geometry-selection-v2-va-1-1-30-zero-retries','geometry-live-v2-6-9-120-zero-retries'])await assert.rejects(()=>runGeometryValidation(['--selection-filter-probe-live'],{NIGHTSKY_LIVE_APPROVED_ENVELOPE:old,NIGHTSKY_QUOTA_STATE_PATH:'never-read'}));
 const proposal:any=await runGeometryValidation([],{});assert.deepEqual(proposal.filterProbe.query,query);assert.equal(proposal.filterProbe.envelope,envelope);
});
test('filter probe guard binds only unfiltered Vatican query and stops after one dispatch',async()=>{
 let calls=0;let now=0;const g=createGeometryGuard({packet:'filter-probe',key:'fixture-key',now:()=>now,persist:async()=>{},fetcher:async(_,init)=>{calls++;assert.equal(init?.redirect,'error');return Response.json({});}});
 try{
  for(const altered of [{...query,filter:'countrycode:va'},{...query,country:'San Marino'},{...query,type:'city'},{...query,limit:'6'},{...query,bias:'countrycode:va'}])assert.throws(()=>g.expect('/v1/geocode/search',altered));
  g.expect('/v1/geocode/search',query);await g.fetcher('https://api.geoapify.com/v1/geocode/search?'+new URLSearchParams({...query,apiKey:'fixture-key'}));
  assert.throws(()=>g.expect('/v1/geocode/search',query));assert.throws(()=>g.expect('/v2/place-details',{id:'va-id'}));assert.equal(calls,1);
 }finally{g.close();}
 const expired=createGeometryGuard({packet:'filter-probe',key:'fixture-key',now:()=>now,persist:async()=>{},fetcher:async()=>{throw Error('must not dispatch');}});
 try{now=30001;assert.throws(()=>expired.expect('/v1/geocode/search',query));}finally{expired.close();}
});
test('filter probe persists one debit and strictly selects VA or stops, never fetching details',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'geometry-filter-probe-'));
 const env={NIGHTSKY_DISCOVERY_MODE:'api',NIGHTSKY_LIVE_APPROVED_ENVELOPE:envelope,NIGHTSKY_LIVE_GEOAPIFY_ADMITTED:'yes',NIGHTSKY_LIVE_BATCH_ID:'probe',NIGHTSKY_QUOTA_STATE_PATH:join(dir,'quota.json'),NIGHTSKY_GEOAPIFY_API_KEY:'fixture-key'};
 const feature={type:'Feature',properties:{country_code:'va',result_type:'country',place_id:'va-id'}};
 let calls=0;
 try{
  await initializeProviderQuota({...env,NIGHTSKY_QUOTA_VERIFIED_UNUSED_BUDGET:'yes',NIGHTSKY_QUOTA_VERIFICATION_EVIDENCE:'Synthetic test only'});
  const cases=[{features:[feature],status:'selection-completed',reason:null},{features:[],status:'stopped',reason:'selection-empty'},{features:[feature,feature],status:'stopped',reason:'selection-ambiguous'},{features:[{...feature,properties:{...feature.properties,country_code:'it'}}],status:'stopped',reason:'selection-no-eligible-country'},{features:[{...feature,properties:{...feature.properties,result_type:'city'}}],status:'stopped',reason:'selection-no-eligible-country'},{features:[{...feature,properties:{...feature.properties,place_id:'bad\nidentity'}}],status:'stopped',reason:'selection-no-eligible-country'}];
  for(const [i,c]of cases.entries()){
   const args=['--selection-filter-probe-live'];const local={...env,NIGHTSKY_LIVE_BATCH_ID:'probe-'+i};
   const fetcher:typeof fetch=async input=>{calls++;const u=new URL(String(input));assert.equal(u.pathname,'/v1/geocode/search');u.searchParams.delete('apiKey');assert.deepEqual(Object.fromEntries(u.searchParams),query);return Response.json({type:'FeatureCollection',features:c.features,hostile:'fixture-key'});};
   const result:any=await runGeometryValidation(args,local,{fetcher});assert.equal(result.status,c.status);assert.equal(result.stopReason,c.reason);assert.equal(result.sourceAccepted,false);assert.deepEqual(result.results,[]);assert.equal(calls,i+1);
   await assert.rejects(()=>runGeometryValidation(args,local,{fetcher}));assert.equal(calls,i+1);
   const journal=await readFile(join(dir,'geometry-live-probe-'+i+'.jsonl'),'utf8');assert.equal(journal.includes('fixture-key'),false);assert.equal(journal.includes('hostile'),false);
  }
  const quota=JSON.parse(await readFile(env.NIGHTSKY_QUOTA_STATE_PATH,'utf8'));assert.equal(Object.values(quota.entries.geoapify.buckets).reduce((a:any,b:any)=>a+b,0),cases.length);
 }finally{assert.ok(dir.startsWith(join(tmpdir(),'geometry-filter-probe-')));await rm(dir,{recursive:true,force:true});}
});

test('filter probe transport failures cap bytes and forbid redirects without retries',async()=>{
 for(const response of [()=>new Response('x'.repeat(262145)),()=>new Response('{}',{status:302,headers:{location:'https://example.invalid'}})]){
  let calls=0;const g=createGeometryGuard({packet:'filter-probe',key:'fixture-key',persist:async()=>{},fetcher:async()=>{calls++;return response();}});
  try{g.expect('/v1/geocode/search',query);await assert.rejects(()=>g.fetcher('https://api.geoapify.com/v1/geocode/search?'+new URLSearchParams({...query,apiKey:'fixture-key'})));assert.equal(g.stopped,true);assert.throws(()=>g.expect('/v1/geocode/search',query));assert.equal(calls,1);}finally{g.close();}
 }
});
