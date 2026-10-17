/** One-use integration diagnostic. No production quota admission or accuracy claim. */
import {openSync,writeSync,fsyncSync,closeSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createConfiguredSkyProviders} from '../server/providers/skyConfiguration';
import {createSevenTimerProvider} from '../server/providers/weather/sevenTimer';
import {UpstreamControls} from '../server/providers/upstreamControls';
export const SKY_PROBE_PLAN={requests:6,perEndpoint:1,totalDeadlineMs:90000,maxBodyBytes:262144,totalAcceptedBytes:1572864,retries:0,scope:'Hyderabad point; one AstronomyAPI M42 search, recent NASA GST context, Ceres identity and one observer epoch. No charts, paid endpoints, historical datasets or deployment.'};
export async function runSkyProbe(env:Record<string,string|undefined>,journalPath:string,transport:typeof fetch=fetch){
 for(const key of ['NIGHTSKY_NASA_API_KEY','NIGHTSKY_ASTRONOMY_API_APP_ID','NIGHTSKY_ASTRONOMY_API_APP_SECRET'])if(!env[key])throw Error('Private settings missing.');
 const fd=openSync(journalPath,'wx',0o600); const record=(value:unknown)=>{writeSync(fd,JSON.stringify(value)+'\n');fsyncSync(fd);};
 try{record({plan:SKY_PROBE_PLAN,startedAt:new Date().toISOString(),purpose:'one-use diagnostic; not production source admission'});}catch(error){closeSync(fd);throw error;}
 const started=Date.now(),controller=new AbortController();const timer=setTimeout(()=>controller.abort(),SKY_PROBE_PLAN.totalDeadlineMs);
 const attempts:Array<{endpoint:string;status?:number;bytes?:number}>=[];const used=new Set<string>();const reservations=new Map<string,number>();
 const limits:Record<string,number>={seventimer:1,darkskyplanner:1,astronomyapi:1,'nasa-donki':1,jpl:2};
 const quota={reserve:async(provider:string)=>{const count=reservations.get(provider)??0;if(count>=(limits[provider]??0)||controller.signal.aborted)return {allowed:false,reason:'Diagnostic budget exhausted.'};reservations.set(provider,count+1);record({reservation:provider,count:count+1});return {allowed:true,reason:'Owner requested one-use diagnostic.'};}};
 const allowed=new Set(['www.7timer.info/bin/api.pl','darkskyplanner.com/plan','api.astronomyapi.com/api/v2/search','api.nasa.gov/DONKI/GST','ssd-api.jpl.nasa.gov/sbdb.api','ssd.jpl.nasa.gov/api/horizons.api']);
 const fetcher=(async(input:RequestInfo|URL,init?:RequestInit)=>{
  const url=new URL(String(input)),endpoint=url.hostname+url.pathname;
  if(url.protocol!=='https:'||url.port||url.username||url.password||!allowed.has(endpoint)||used.has(endpoint)||controller.signal.aborted)throw Error('Diagnostic admission refused.');
  used.add(endpoint);const entry:{endpoint:string;status?:number;bytes?:number}={endpoint};attempts.push(entry);record({attempt:endpoint});
  const signal=AbortSignal.any([controller.signal,...(init?.signal?[init.signal]:[])]);
  const response=await transport(url,{...init,redirect:'error',signal});entry.status=response.status;
  if(response.redirected||Number(response.headers.get('content-length'))>SKY_PROBE_PLAN.maxBodyBytes){await response.body?.cancel();throw Error('Response rejected.');}
  if(!response.body)throw Error('Missing body');const reader=response.body.getReader();let bytes=0;const chunks:Uint8Array[]=[];const cancel=()=>{void reader.cancel().catch(()=>{});};signal.addEventListener('abort',cancel,{once:true});
  try{for(;;){signal.throwIfAborted();const part=await reader.read();if(part.done)break;bytes+=part.value.length;if(bytes>SKY_PROBE_PLAN.maxBodyBytes)throw Error('Response limit');chunks.push(part.value);}signal.throwIfAborted();}
  finally{signal.removeEventListener('abort',cancel);await reader.cancel().catch(()=>{});reader.releaseLock();}
  entry.bytes=bytes;record({response:endpoint,status:entry.status,bytes});
  return new Response(Buffer.concat(chunks),{status:response.status,headers:response.headers});
 }) as typeof fetch;
 const result:Array<{capability:string;status:string;count?:number}>=[];
 try{
 const sky=createConfiguredSkyProviders({...env,NIGHTSKY_SKY_PROVIDERS:'darkskyplanner,astronomyapi,nasa-donki,jpl',NIGHTSKY_SKY_ADMITTED_PROVIDERS:'darkskyplanner,astronomyapi,nasa-donki,jpl'},{quota,fetcher})!;
 const point={placeId:'diagnostic-hyderabad',latitude:17.361,longitude:78.474};
 const weather=await createSevenTimerProvider({fetcher,quota,now:Date.now,controls:new UpstreamControls({maxResponseBytes:262144})}).getForecast(point,{startUtc:new Date().toISOString(),endUtc:new Date(Date.now()+24*3600000).toISOString(),timeZone:'Asia/Kolkata'});result.push({capability:'seventimer',status:weather.status,count:weather.forecast?.samples.length});
 const plan=await sky.darkSky!.plan({locationName:'Hyderabad',latitude:point.latitude,longitude:point.longitude,timeZone:'Asia/Kolkata',startDate:'2026-12-13',endDate:'2026-12-14',startTime:'22:00',endTime:'04:00'});result.push({capability:'darkskyplanner',status:plan.status,count:plan.status==='ok'?plan.data.qualifyingDates.length+plan.data.excludedDates.length:undefined});
 const search=await sky.astronomy!.searchObjects({term:'M42',limit:3});result.push({capability:'astronomyapi-search',status:search.status,count:search.status==='ok'?search.data.objects.length:undefined});
 const date=new Date().toISOString().slice(0,10),previous=new Date(Date.now()-86400000).toISOString().slice(0,10);
 const events=await sky.space!.getSpaceWeather({eventType:'GST',startDate:previous,endDate:date});result.push({capability:'nasa-donki',status:events.status,count:events.events?.length});
 const body=await sky.space!.resolveSmallBody({query:'Ceres'});result.push({capability:'jpl-sbdb',status:body.status});
 if(body.status==='available'&&body.object){await new Promise(r=>setTimeout(r,1100));const position=await sky.space!.getObserverEphemeris({spkId:body.object.spkId,latitude:point.latitude,longitude:point.longitude,elevationMeters:0,atUtc:new Date().toISOString()});result.push({capability:'jpl-horizons',status:position.status});}
 const report={finishedAt:new Date().toISOString(),elapsedMs:Date.now()-started,attempts,results:result,limitations:['One-use integration check, not accuracy validation or production admission.','Hyderabad elevation zero is an explicit synthetic observer input.','AstronomyAPI positions were tested offline only; this live request tests search.','No raw upstream responses retained.']};record({report});return report;
 }finally{clearTimeout(timer);controller.abort();closeSync(fd);}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2);
 if(args.length===0||args.length===1&&args[0]==='--plan')console.log(JSON.stringify(SKY_PROBE_PLAN));
 else if(args.length===2&&args[0]==='--live')runSkyProbe(process.env,resolve(args[1])).then(r=>console.log(JSON.stringify(r)),()=>{console.error('Sky diagnostic stopped. Check sanitized journal; no automatic retry.');process.exitCode=1;});
 else{console.error('Use --plan or --live <new-journal-path>.');process.exitCode=1;}
}
