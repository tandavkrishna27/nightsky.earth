/** Explicit, bounded validation. Import and default CLI invocation never use the network. */
import { open, lstat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { performance } from 'node:perf_hooks';
import { ApiHttpClient } from '../server/places/api/http';
import { geoapifyRecords } from '../server/places/api/geoapify';
import { ApiSelectionStore } from '../server/places/api/selectionStore';
import { createPersistentQuota, type PersistentQuota } from '../server/providers/quotaState';
import { createConfiguredWeatherCollection, parseWeatherConfiguration, PROVIDER_QUOTA_POLICIES } from '../server/providers/weather/configuration';
import { roundedMetCoordinates } from '../server/providers/weather/metNorway';
import { weatherForecastSchema } from '../shared/nightsky/weather';
import { timeWindowSchema } from '../shared/nightsky/common';

export const ENVELOPE='api-live-v1-12-3-600-zero-retries';
export const CASES=['Hanle, India','Kodaikanal, India','Munnar, India'] as const;
type Provider='geoapify'|'met'|'weatherapi'|'openweather';
type Point={latitude:number;longitude:number};
type Attempt={sequence:number;provider:Provider;caseName:string;status:number|null;bytes:number;elapsedMs:number;outcome:'started'|'received'|'failed'};
const endpoints:Record<Provider,string>={geoapify:'https://api.geoapify.com/v1/geocode/search',met:'https://api.met.no/weatherapi/locationforecast/2.0/complete',weatherapi:'https://api.weatherapi.com/v1/forecast.json',openweather:'https://api.openweathermap.org/data/2.5/forecast'};
const caps:Record<Provider,number>={geoapify:262144,met:4194304,weatherapi:524288,openweather:524288};
const refused=()=>Error('Validation request refused.');

export function createLiveGuard(options:{approved:string;providers:Provider[];fetcher:typeof fetch;persist:(row:Attempt)=>Promise<void>;now?:()=>number;attemptTimeoutMs?:number}) {
 const now=options.now??(()=>performance.now()); const started=now(); const abort=new AbortController();
 const timer=setTimeout(()=>abort.abort(),600000); timer.unref();
 let caseName=''; let point:Point|undefined; let fatal=false;
 const used=new Set<string>(); const attempts:Attempt[]=[]; const counts:Partial<Record<Provider,number>>={};
 function selectCase(name:string, selected?:Point) {
  if(!(CASES as readonly string[]).includes(name)) throw refused();
  caseName=name; point=selected;
 }
 const fetcher:typeof fetch=async(input,init)=>{
  let row:Attempt|undefined; let controller:AbortController|undefined; let timeout:ReturnType<typeof setTimeout>|undefined;
  let reader:ReadableStreamDefaultReader<Uint8Array>|undefined;let dispatchedAt:number|undefined;
  try {
   if(options.approved!==ENVELOPE||fatal||abort.signal.aborted||now()-started>=600000||!caseName||input instanceof Request) throw refused();
   const url=new URL(String(input));
   const provider=(Object.keys(endpoints) as Provider[]).find(id=>endpoints[id]===url.origin+url.pathname);
   if(!provider||!options.providers.includes(provider)||url.username||url.password||url.hash||(init?.method??'GET')!=='GET'||init?.body) throw refused();
   const coords=point?roundedMetCoordinates(point):undefined;
   let expected:Record<string,string>;
   if(provider==='geoapify') expected={text:caseName,limit:'5',format:'geojson',apiKey:url.searchParams.get('apiKey')??''};
   else {
    if(!point||!Number.isFinite(point.latitude)||!Number.isFinite(point.longitude)) throw refused();
    expected=provider==='met'?{lat:coords!.latitude.toFixed(4),lon:coords!.longitude.toFixed(4)}:provider==='weatherapi'?{q:`${point.latitude},${point.longitude}`,days:'3',aqi:'no',alerts:'no',key:url.searchParams.get('key')??''}:{lat:String(point.latitude),lon:String(point.longitude),units:'metric',cnt:'40',appid:url.searchParams.get('appid')??''};
   }
   if([...url.searchParams].length!==Object.keys(expected).length||Object.entries(expected).some(([key,value])=>!value||url.searchParams.get(key)!==value)) throw refused();
   const key=provider+':'+caseName;
   if(used.has(key)||(counts[provider]??0)>=3||attempts.length>=12) throw refused();
   // Charge the batch before asynchronous persistence, so concurrent attempts cannot race caps.
   used.add(key); counts[provider]=(counts[provider]??0)+1;
   row={sequence:attempts.length+1,provider,caseName,status:null,bytes:0,elapsedMs:0,outcome:'started'}; attempts.push(row);
   try {await options.persist({...row});} catch {fatal=true;abort.abort();throw refused();}
   if(abort.signal.aborted||now()-started>=600000) throw refused();
   controller=new AbortController();
   const signal=AbortSignal.any([controller.signal,abort.signal,...(init?.signal?[init.signal]:[])]);
   let rejectAbort:(error:Error)=>void=()=>{};
   const expired=new Promise<never>((_,reject)=>{rejectAbort=reject;});
   const onAbort=()=>rejectAbort(refused()); signal.addEventListener('abort',onAbort,{once:true});
   timeout=setTimeout(()=>controller!.abort(),Math.min(options.attemptTimeoutMs??(provider==='met'?8000:5000),provider==='met'?8000:5000));
   try {
    signal.throwIfAborted();
    dispatchedAt=now();
    const pending=options.fetcher(url,{...init,method:'GET',redirect:'error',signal});
    void pending.then(response=>{if(signal.aborted) void response.body?.cancel().catch(()=>{});},()=>{});
    const response=await Promise.race([pending,expired]); row.status=response.status;
    if(response.redirected||(response.status>=300&&response.status<400)||Number(response.headers.get('Content-Length'))>caps[provider]) {void response.body?.cancel().catch(()=>{});throw refused();}
    reader=response.body?.getReader(); const chunks:Uint8Array[]=[];
    if(reader) for(;;) {const part=await Promise.race([reader.read(),expired]);if(part.done)break;row.bytes+=part.value.byteLength;if(row.bytes>caps[provider])throw refused();chunks.push(part.value);}
    row.outcome='received';
    // Forward only metadata used by adapters; never retain response URLs or arbitrary headers.
    const headers=new Headers();for(const name of ['content-type','expires','last-modified','retry-after']) {const value=response.headers.get(name);if(value)headers.set(name,value);}
    return new Response([204,205,304].includes(response.status)?null:Buffer.concat(chunks),{status:response.status,headers});
   } finally {signal.removeEventListener('abort',onAbort);}
  } catch {if(row)row.outcome='failed';controller?.abort();void reader?.cancel().catch(()=>{});throw refused();}
  finally {if(timeout)clearTimeout(timeout);if(row&&dispatchedAt!==undefined)row.elapsedMs=Math.max(0,Math.round(now()-dispatchedAt));if(row)try{await options.persist({...row});}catch{fatal=true;abort.abort();} }
 };
 return {fetcher,selectCase,attempts,get stopped(){return fatal||abort.signal.aborted||now()-started>=600000;},close(){clearTimeout(timer);abort.abort();}};
}

export function checkedValidationQuota(quota:Pick<PersistentQuota,'reserve'|'setProviderState'>,stop:()=>void) {
 return {
  async reserve(provider:string,cost:number) {
   try {const reservation=await quota.reserve(provider,cost);if(!reservation.allowed&&['quota-state-unavailable','quota-clock-rollback','quota-persistence-failed'].includes(reservation.reason))stop();return reservation;}
   catch {stop();throw refused();}
  },
  async setProviderState(provider:string,state:{disabled?:boolean;blockedUntil?:number}) {
   try {await quota.setProviderState(provider,state);}catch {stop();throw refused();}
  },
 };
}

/** Public-schema facts only: never retain weather values or arbitrary provider unit strings. */
export function forecastValidationFacts(value:unknown,window:{startUtc:string;endUtc:string;timeZone:string},provider?:Provider) {
 const requestedWindow=timeWindowSchema.parse(window);const parsed=weatherForecastSchema.safeParse(value);
 if(!parsed.success)return {requestedWindow,checks:{publicSchemaValid:false,unitsExpected:null,samplesInsideRequestedWindow:null,instantaneousValuesInsideWindow:null,intervalsOverlapWindow:null,valuesRelevantToWindow:null},temporalEvidence:null,firstSampleUtc:null,lastSampleUtc:null,uniqueIntervalSeconds:[],forecastHorizonHours:null,sampleSpanHours:null,fieldUnits:{},missingFields:[],coverage:null,forecastStatus:null};
 const forecast=parsed.data;const times=forecast.samples.map(sample=>Date.parse(sample.validAt));
 const deltas=times.slice(1).map((time,index)=>(time-times[index])/1000);
 const first=Math.min(...times),last=Math.max(...times);const start=Date.parse(window.startUtc),end=Date.parse(window.endUtc);
 const expected:Record<string,string>={totalCloudCover:'%',lowCloudCover:'%',mediumCloudCover:'%',highCloudCover:'%',precipitationProbability:'%',precipitationAmount:'mm',windSpeed:'m/s',windGust:'m/s',windDirection:'degrees',temperature:'°C',dewPoint:'°C',relativeHumidity:'%',visibility:'m'};
 const fieldUnits:Record<string,string[]>={};let unitsExpected=true;
 let instantValueCount=0,intervalValueCount=0,outsideInstantCount=0,nonoverlapIntervalCount=0,earliestInterval=Infinity,latestInterval=-Infinity;
 for(const sample of forecast.samples)for(const [field,measurement] of Object.entries(sample.values))if(measurement){
  const metCelsius=provider==='met'&&(field==='temperature'||field==='dewPoint')&&measurement.unit==='celsius';
  const valid=measurement.unit===expected[field]||metCelsius;if(!valid)unitsExpected=false;
  const unit=valid?measurement.unit:'unexpected-unit';const units=fieldUnits[field]??=[];if(!units.includes(unit))units.push(unit);
  if(measurement.periodStartUtc!==undefined&&measurement.periodEndUtc!==undefined) {
   intervalValueCount++;const intervalStart=Date.parse(measurement.periodStartUtc),intervalEnd=Date.parse(measurement.periodEndUtc);
   earliestInterval=Math.min(earliestInterval,intervalStart);latestInterval=Math.max(latestInterval,intervalEnd);
   if(!(intervalStart<end&&intervalEnd>start))nonoverlapIntervalCount++;
  } else {instantValueCount++;const at=Date.parse(sample.validAt);if(at<start||at>end)outsideInstantCount++;}
 }
 const nativeInterval=provider==='weatherapi'?3600:provider==='openweather'?10800:null;
 return {requestedWindow,firstSampleUtc:new Date(first).toISOString(),lastSampleUtc:new Date(last).toISOString(),uniqueIntervalSeconds:[...new Set(deltas)].sort((a,b)=>a-b).slice(0,47),forecastHorizonHours:forecast.forecastHorizonHours,sampleSpanHours:(last-first)/3600000,forecastStatus:forecast.availability.status,fieldUnits,missingFields:forecast.missingFields.map(field=>field.field),coverage:{startsAtOrBeforeWindowStart:first<=start,endsAtOrAfterWindowEnd:last>=end},temporalEvidence:{instantValueCount,intervalValueCount,outsideWindowInstantValueCount:outsideInstantCount,nonoverlappingIntervalValueCount:nonoverlapIntervalCount,earliestIntervalStartUtc:Number.isFinite(earliestInterval)?new Date(earliestInterval).toISOString():null,latestIntervalEndUtc:Number.isFinite(latestInterval)?new Date(latestInterval).toISOString():null},expectedNativeIntervalSeconds:nativeInterval,checks:{publicSchemaValid:true,unitsExpected,samplesInsideRequestedWindow:times.every(time=>time>=start&&time<=end),instantaneousValuesInsideWindow:outsideInstantCount===0,intervalsOverlapWindow:nonoverlapIntervalCount===0,valuesRelevantToWindow:outsideInstantCount===0&&nonoverlapIntervalCount===0,strictlyIncreasing: deltas.every(delta=>delta>0),nativeCadenceMatches:nativeInterval===null||deltas.length===0?null:deltas.every(delta=>delta===nativeInterval)}};
}

/** Conservative exact locality selection; no extra geocoding or timezone calls. */
export function selectPublicRecord(name:string, records:Awaited<ReturnType<typeof geoapifyRecords>>['items']) {
 const boxes:Record<string,number[]>={'Hanle, India':[32,34,77,80],'Kodaikanal, India':[9,11,76,79],'Munnar, India':[9,11,76,78]};
 const box=boxes[name];if(!box)return undefined;
 const matches=records.map(row=>row.record).filter(r=>r.name.toLowerCase()===name.split(',')[0].toLowerCase()&&r.latitude>=box[0]&&r.latitude<=box[1]&&r.longitude>=box[2]&&r.longitude<=box[3]&&r.timeZoneEvidence.status==='verified'&&r.timeZoneEvidence.timeZone==='Asia/Kolkata');
 return matches.length===1?matches[0]:undefined;
}

export async function runValidation(args:string[],environment:Record<string,string|undefined>, dependencies:{fetcher?:typeof fetch;pause?:()=>Promise<void>}={}) {
 if(args.length===0)return {mode:'offline',envelope:ENVELOPE,cases:CASES,maxRequests:12,maxPerProvider:3,deadlineMs:600000,retries:0};
 if(args.length!==1||args[0]!=='--live'||environment.NIGHTSKY_LIVE_APPROVED_ENVELOPE!==ENVELOPE)throw refused();
 const config=parseWeatherConfiguration(environment);
 const batch=environment.NIGHTSKY_LIVE_BATCH_ID;
 if(!batch||!/^[a-z0-9][a-z0-9-]{0,63}$/.test(batch)||!config.quotaPath||!environment.NIGHTSKY_GEOAPIFY_API_KEY||environment.NIGHTSKY_DISCOVERY_MODE!=='api'||environment.NIGHTSKY_GEONAMES_USERNAME||environment.NIGHTSKY_LIVE_GEOAPIFY_ADMITTED!=='yes'||!config.providers?.length)throw refused();
 if(Object.keys(environment).some(key=>/^(NIGHTSKY_GEONAMES_INDEX|NIGHTSKY_OSM_|NIGHTSKY_GLOBAL_CATALOGUE_)/.test(key)&&environment[key]!==undefined))throw refused();
 const enabled=config.providers.filter(id=>id==='met'?!!environment.MET_NORWAY_USER_AGENT:config.admitted.includes(id)&&!!environment[id==='weatherapi'?'NIGHTSKY_WEATHERAPI_KEY':'NIGHTSKY_OPENWEATHER_KEY']);
 if(!enabled.length)throw refused();
 // Existing checkpoint only. The serving quota library validates ancestors/locks/contents.
 const state=await lstat(config.quotaPath);if(!state.isFile()||state.isSymbolicLink())throw refused();
 const quota=await createPersistentQuota({path:config.quotaPath,now:Date.now,policies:PROVIDER_QUOTA_POLICIES});
 let journal:Awaited<ReturnType<typeof open>>|undefined;let guard:ReturnType<typeof createLiveGuard>|undefined;
 try {
  journal=await open(join(dirname(config.quotaPath),`live-${batch}.jsonl`),'wx',0o600);
  let journalBytes=0;let tail=Promise.resolve();
  const persist=(value:unknown)=>{const line=JSON.stringify(value)+'\n';journalBytes+=Buffer.byteLength(line);if(journalBytes>262144)throw refused();const next=tail.then(async()=>{await journal!.write(line);await journal!.sync();});tail=next;return next;};
  await persist({envelope:ENVELOPE,batch,startedAt:new Date().toISOString()});
  guard=createLiveGuard({approved:environment.NIGHTSKY_LIVE_APPROVED_ENVELOPE!,providers:['geoapify',...enabled],fetcher:dependencies.fetcher??fetch,persist});
  const checkedQuota=checkedValidationQuota(quota,()=>guard!.close());
  const http=new ApiHttpClient({geoapifyApiKey:environment.NIGHTSKY_GEOAPIFY_API_KEY,userAgent:environment.NIGHTSKY_LOCATION_USER_AGENT??'NightSky.earth/1.0 (nightsky.earth2026@gmail.com)',quota:checkedQuota,fetcher:guard.fetcher});
  const collection=createConfiguredWeatherCollection({...environment,NIGHTSKY_WEATHER_PROVIDERS:enabled.join(','),NIGHTSKY_WEATHER_ADMITTED_PROVIDERS:enabled.filter(id=>config.admitted.includes(id)).join(',')},{quota:checkedQuota,fetcher:guard.fetcher})!;
  const store=new ApiSelectionStore();const start=Date.now();const results:unknown[]=[];let usableCases=0;
  for(const name of CASES) {
   if(guard.stopped)break;
   guard.selectCase(name);const caseStart=performance.now();
   try {
    const records=await geoapifyRecords(http,'/v1/geocode/search',{text:name,limit:'5',format:'geojson'},Date.now);
    const record=selectPublicRecord(name,records.items);
    if(!record){results.push({caseName:name,status:'skipped-selection-or-timezone'});} else {
    const selected=store.put(record);guard.selectCase(name,record);
    const requestedWindow={startUtc:new Date(start).toISOString(),endUtc:new Date(start+86400000).toISOString(),timeZone:'Asia/Kolkata'};
    const forecasts=await collection.getForecasts({...selected,latitude:record.latitude,longitude:record.longitude},requestedWindow);
    if(forecasts.outcomes.length===enabled.length&&forecasts.outcomes.every(({result})=>['available','partial'].includes(result.status)&&(result.forecast?.samples.length??0)>0))usableCases++;
    const selectedPoint={latitude:record.latitude,longitude:record.longitude};
    const requestedPoints=Object.fromEntries(enabled.filter(id=>guard!.attempts.some(attempt=>attempt.caseName===name&&attempt.provider===id)).map(id=>[id,id==='met'?roundedMetCoordinates(selectedPoint):selectedPoint]));
    results.push({caseName:name,selectedPoint,requestedPoints,requestedWindow,sourceRevision:selected.sourceRevision,timeZone:'Asia/Kolkata',timeZoneProvider:'geoapify',elapsedMs:Math.round(performance.now()-caseStart),rssBytes:process.memoryUsage().rss,outcomes:forecasts.outcomes.map(({providerId,result})=>({providerId,status:result.status,samples:result.forecast?.samples.length??0,validationFacts:forecastValidationFacts(result.forecast,requestedWindow,providerId),missingFields:result.forecast?.missingFields.map(field=>field.field)??[],attribution:result.forecast?.source.attribution??result.source?.attribution??null}))});
    }
   } catch {results.push({caseName:name,status:'failed'});}
   await persist({caseIndex:results.length,result:results.at(-1)});
   // Respect the per-source minimum start spacing between public cases.
   if(!guard.stopped)await (dependencies.pause?.()??new Promise(resolve=>setTimeout(resolve,1100)));
  }
  const report={mode:'live',envelope:ENVELOPE,batch,finishedAt:new Date().toISOString(),status:guard.stopped?'stopped':'completed',usableCases,validation:usableCases===3&&!guard.stopped?'all-admitted-sources-have-samples':'partial-failed-or-skipped',attempts:guard.attempts,results,skippedProviders:config.providers.filter(id=>!enabled.includes(id)),limitations:['Integration sample only; no forecast accuracy claim.','RSS is sampled, not peak.','No raw responses retained.']};
  await persist({report});return report;
 } finally {guard?.close();await journal?.close();await quota.close();}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href) {
 runValidation(process.argv.slice(2),process.env).then(report=>console.log(JSON.stringify(report)),()=>{console.error(JSON.stringify({status:'refused-or-failed',envelope:ENVELOPE,reason:'Check approval, admission, private configuration and retained quota/journal state. No automatic retry.'}));process.exitCode=1;});
}
