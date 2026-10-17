import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createLiveGuard,HYDERABAD_ENVELOPE,ENVELOPE,runValidation,selectPublicRecord} from '../../scripts/validate-api-live';
import {initializeProviderQuota} from '../../scripts/initialize-provider-quota';
const name='Hyderabad, Telangana, India';
const geo=`https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(name)}&limit=5&format=geojson&apiKey=sentinel`;
test('Hyderabad proposal is offline and refuses mismatched authorization before private state',async()=>{
 const proposal=await runValidation(['--hyderabad-proposal'],{});
 assert.deepEqual(proposal,{mode:'offline',envelope:HYDERABAD_ENVELOPE,cases:[name],maxRequests:4,maxPerProvider:1,deadlineMs:120000,retries:0});
 await assert.rejects(runValidation(['--hyderabad-live'],{NIGHTSKY_LIVE_APPROVED_ENVELOPE:ENVELOPE}));
 await assert.rejects(runValidation(['--live'],{NIGHTSKY_LIVE_APPROVED_ENVELOPE:HYDERABAD_ENVELOPE}));
});
test('Hyderabad guard allows precisely four requests and rejects other cases, duplicates and endpoints',async()=>{
 let calls=0;const guard=createLiveGuard({approved:HYDERABAD_ENVELOPE,providers:['geoapify','met','weatherapi','openweather'],fetcher:async()=>{calls++;return new Response('{}');},persist:async()=>{}});
 try{
 assert.throws(()=>guard.selectCase('Hanle, India'));guard.selectCase(name,{latitude:17.4,longitude:78.5});
 await assert.rejects(guard.fetcher(geo+'&extra=1'));await assert.rejects(guard.fetcher('https://example.invalid'));
 for(const url of [geo,'https://api.met.no/weatherapi/locationforecast/2.0/complete?lat=17.4000&lon=78.5000','https://api.weatherapi.com/v1/forecast.json?q=17.4,78.5&days=3&aqi=no&alerts=no&key=sentinel','https://api.openweathermap.org/data/2.5/forecast?lat=17.4&lon=78.5&units=metric&cnt=40&appid=sentinel'])await guard.fetcher(url);
 await assert.rejects(guard.fetcher(geo));assert.equal(calls,4);assert.equal(JSON.stringify(guard.attempts).includes('sentinel'),false);
 }finally{guard.close();}
});
test('Hyderabad deadline, byte cap and journal failure prevent further dispatch',async()=>{
 for(const mode of ['deadline','bytes','journal']){
 let now=0,calls=0;const guard=createLiveGuard({approved:HYDERABAD_ENVELOPE,providers:['geoapify'],now:()=>now,fetcher:async()=>{calls++;return new Response('x'.repeat(262145));},persist:async()=>{if(mode==='journal')throw Error('sentinel');}});
 try{guard.selectCase(name);if(mode==='deadline')now=120000;await assert.rejects(guard.fetcher(geo));assert.equal(calls,mode==='bytes'?1:0);await assert.rejects(guard.fetcher(geo));assert.equal(calls,mode==='bytes'?1:0);}finally{guard.close();}
 }
});
test('Hyderabad selector requires one matching bounded point and verified timezone',()=>{
 const record={name:'Hyderabad',latitude:17.4,longitude:78.5,timeZoneEvidence:{status:'verified',timeZone:'Asia/Kolkata'}};
 assert.equal(selectPublicRecord(name,[{record}] as any),record);
 for(const rows of [[],[{record},{record}],[{record:{...record,latitude:25}}],[{record:{...record,timeZoneEvidence:{status:'unknown'}}}]])assert.equal(selectPublicRecord(name,rows as any),undefined);
});
test('Hyderabad runner uses one discovery plus three weather attempts and exclusive journal',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'hyderabad-synthetic-'));let calls=0;
 const env={NIGHTSKY_DISCOVERY_MODE:'api',NIGHTSKY_LIVE_APPROVED_ENVELOPE:HYDERABAD_ENVELOPE,NIGHTSKY_LIVE_GEOAPIFY_ADMITTED:'yes',NIGHTSKY_LIVE_BATCH_ID:'synthetic',NIGHTSKY_QUOTA_STATE_PATH:join(dir,'quota.json'),NIGHTSKY_GEOAPIFY_API_KEY:'sentinel',NIGHTSKY_WEATHER_PROVIDERS:'met,weatherapi,openweather',NIGHTSKY_WEATHER_ADMITTED_PROVIDERS:'weatherapi,openweather',NIGHTSKY_WEATHERAPI_KEY:'sentinel',NIGHTSKY_OPENWEATHER_KEY:'sentinel',MET_NORWAY_USER_AGENT:'NightSky synthetic (test@example.invalid)'};
 const fetcher:typeof fetch=async input=>{calls++;return String(input).includes('geoapify')?Response.json({features:[{geometry:{type:'Point',coordinates:[78.5,17.4]},properties:{place_id:'hyderabad-synthetic',name:'Hyderabad',timezone:{name:'Asia/Kolkata'}}}]}):Response.json({});};
 try{
 await initializeProviderQuota({...env,NIGHTSKY_QUOTA_VERIFIED_UNUSED_BUDGET:'yes',NIGHTSKY_QUOTA_VERIFICATION_EVIDENCE:'Synthetic only'});
 const report=await runValidation(['--hyderabad-live'],env,{fetcher,pause:async()=>{}});assert.equal(calls,4);assert.equal(report.envelope,HYDERABAD_ENVELOPE);assert.equal(report.results?.length,1);assert.equal(JSON.stringify(report).includes('sentinel'),false);
 await assert.rejects(runValidation(['--hyderabad-live'],env,{fetcher}));assert.equal(calls,4);
 }finally{await rm(dir,{recursive:true,force:true});}
});

test('Hyderabad any quota denial stops the packet without resetting allowance',async()=>{
 const {checkedValidationQuota}=await import('../../scripts/validate-api-live');let stopped=false;
 const quota=checkedValidationQuota({reserve:async()=>({allowed:false,reason:'daily-quota-exhausted'} as any),setProviderState:async()=>{}},()=>{stopped=true;},true);
 const result=await quota.reserve('geoapify',1);assert.equal(result.allowed,false);assert.equal(stopped,true);
});
