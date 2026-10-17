/** One-use integration diagnostic. No production quota admission or accuracy claim. */
import {openSync,writeSync,fsyncSync,closeSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createConfiguredSkyProviders} from '../server/providers/skyConfiguration';
export const SKY_CONTINUATION_PLAN={requests:4,perEndpoint:1,totalDeadlineMs:90000,maxBodyBytes:262144,totalAcceptedBytes:1048576,retries:0,scope:'One NASA GST, one AstronomyAPI Moon position and one JPL Ceres identity and one observer epoch; Hyderabad with synthetic elevation zero. No production admission or deployment.'};
/** Return only fixed labels/booleans/counts. Upstream strings never enter the journal. */
export function classifyResponse(endpoint:string,status:number,body:string){
 if(status!==200)return {kind:status===401||status===403?'authentication':status===429?'rate-limit':status>=500?'upstream-server':'http-error'};
 let data:any;try{data=JSON.parse(body);}catch{return {kind:'invalid-json'};}
 if(endpoint.endsWith('/horizons.api')){
  const result=typeof data?.result==='string'?data.result:'';
  const error=typeof data?.error==='string'?data.error:'';
  const combined=error+' '+result;
  return {kind:data?.error!==undefined?'provider-error':'json',errorClass:/no matches|cannot find|unknown target|matching small-bodies/i.test(combined)?'target-resolution':/input|parameter|syntax|unknown command/i.test(combined)?'request-parameters':'unclassified',version13:data?.signature?.version==='1.3',hasResult:!!result,hasTable:result.includes('$SOE')&&result.includes('$EOE'),matchesTarget:result.includes('(20000001)'),matchesHistoricalAlias:result.includes('(2000001)')};
 }
 return {kind:'json',array:Array.isArray(data),hasData:data!==null&&typeof data==='object'&&'data' in data};
}
export async function runSkyContinuation(env:Record<string,string|undefined>,journalPath:string,transport:typeof fetch=fetch){
 for(const key of ['NIGHTSKY_NASA_API_KEY','NIGHTSKY_ASTRONOMY_API_APP_ID','NIGHTSKY_ASTRONOMY_API_APP_SECRET'])if(!env[key])throw Error('Private settings missing.');
 const fd=openSync(journalPath,'wx',0o600);let journalFailed=false; const record=(value:unknown)=>{if(journalFailed)throw Error('Journal unavailable');try{const line=Buffer.from(JSON.stringify(value)+'\n');let offset=0;while(offset<line.length){const written=writeSync(fd,line,offset,line.length-offset);if(written<=0)throw Error('Journal write');offset+=written;}fsyncSync(fd);}catch{journalFailed=true;throw Error('Journal unavailable');}};
 try{record({plan:SKY_CONTINUATION_PLAN,startedAt:new Date().toISOString(),purpose:'one-use diagnostic; not production source admission'});}catch(error){closeSync(fd);throw error;}
 const started=Date.now(),controller=new AbortController();const timer=setTimeout(()=>controller.abort(),SKY_CONTINUATION_PLAN.totalDeadlineMs);
 const attempts:Array<{endpoint:string;status?:number;bytes?:number}>=[];const used=new Set<string>();const reservations=new Map<string,number>();
 const limits:Record<string,number>={astronomyapi:1,'nasa-donki':1,jpl:2};
 const quota={reserve:async(provider:string)=>{const count=reservations.get(provider)??0;if(journalFailed||count>=(limits[provider]??0)||controller.signal.aborted)return {allowed:false,reason:'Diagnostic budget exhausted.'};reservations.set(provider,count+1);record({reservation:provider,count:count+1});return {allowed:true,reason:'Owner requested one-use diagnostic.'};}};
 const allowed=new Set(['api.astronomyapi.com/api/v2/bodies/positions/moon','api.nasa.gov/DONKI/GST','ssd.jpl.nasa.gov/api/horizons.api','ssd-api.jpl.nasa.gov/sbdb.api']);
 const fetcher=(async(input:RequestInfo|URL,init?:RequestInit)=>{
  const url=new URL(String(input)),endpoint=url.hostname+url.pathname;
  if(journalFailed||url.protocol!=='https:'||url.port||url.username||url.password||!allowed.has(endpoint)||used.has(endpoint)||controller.signal.aborted)throw Error('Diagnostic admission refused.');
  used.add(endpoint);const entry:{endpoint:string;status?:number;bytes?:number}={endpoint};attempts.push(entry);record({attempt:endpoint});
  const signal=AbortSignal.any([controller.signal,...(init?.signal?[init.signal]:[])]);
  let response:Response;try{response=await transport(url,{...init,redirect:'error',signal});}catch{record({response:endpoint,diagnostic:signal.aborted?'deadline':'transport-error'});throw Error('Transport failed');}entry.status=response.status;
  if(response.redirected||Number(response.headers.get('content-length'))>SKY_CONTINUATION_PLAN.maxBodyBytes){await response.body?.cancel();record({response:endpoint,diagnostic:'redirect-or-body-limit'});throw Error('Response rejected.');}
  if(!response.body)throw Error('Missing body');const reader=response.body.getReader();let bytes=0;const chunks:Uint8Array[]=[];const cancel=()=>{void reader.cancel().catch(()=>{});};signal.addEventListener('abort',cancel,{once:true});
  try{for(;;){signal.throwIfAborted();const part=await reader.read();if(part.done)break;bytes+=part.value.length;if(bytes>SKY_CONTINUATION_PLAN.maxBodyBytes){record({response:endpoint,diagnostic:'body-limit'});throw Error('Response limit');}chunks.push(part.value);}signal.throwIfAborted();}
  finally{signal.removeEventListener('abort',cancel);await reader.cancel().catch(()=>{});reader.releaseLock();}
  entry.bytes=bytes;record({response:endpoint,status:entry.status,bytes,diagnostic:classifyResponse(endpoint,response.status,Buffer.concat(chunks).toString('utf8'))});
  return new Response(Buffer.concat(chunks),{status:response.status,headers:response.headers});
 }) as typeof fetch;
 const result:Array<{capability:string;status:string;count?:number}>=[];
 try{
 const sky=createConfiguredSkyProviders({...env,NIGHTSKY_SKY_PROVIDERS:'astronomyapi,nasa-donki,jpl',NIGHTSKY_SKY_ADMITTED_PROVIDERS:'astronomyapi,nasa-donki,jpl'},{quota,fetcher})!;
 const point={placeId:'diagnostic-hyderabad',latitude:17.361,longitude:78.474};
 const date=new Date().toISOString().slice(0,10),previous=new Date(Date.now()-86400000).toISOString().slice(0,10);
 const events=await sky.space!.getSpaceWeather({eventType:'GST',startDate:previous,endDate:date});result.push({capability:'nasa-donki',status:events.status,count:events.events?.length});
 const positions=await sky.astronomy!.bodyPositions({latitude:point.latitude,longitude:point.longitude,elevation:0,startDate:date,endDate:date,time:'12:00',body:'moon'});result.push({capability:'astronomyapi-positions',status:positions.status,count:positions.status==='ok'?positions.data.positions.length:undefined});
 const body=await sky.space!.resolveSmallBody({query:'Ceres'});result.push({capability:'jpl-sbdb',status:body.status});
 if(body.status==='available'&&body.object){const position=await sky.space!.getObserverEphemeris({spkId:body.object.spkId,latitude:point.latitude,longitude:point.longitude,elevationMeters:0,atUtc:new Date().toISOString()});result.push({capability:'jpl-horizons',status:position.status});}
 const report={finishedAt:new Date().toISOString(),elapsedMs:Date.now()-started,attempts,results:result,limitations:['One-use integration check, not accuracy validation or production admission.','Hyderabad elevation zero is an explicit synthetic observer input.','No raw upstream responses retained.']};record({report});return report;
 }finally{clearTimeout(timer);controller.abort();closeSync(fd);}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2);
 if(args.length===0||args.length===1&&args[0]==='--plan')console.log(JSON.stringify(SKY_CONTINUATION_PLAN));
 else if(args.length===2&&args[0]==='--live')runSkyContinuation(process.env,resolve(args[1])).then(r=>console.log(JSON.stringify(r)),()=>{console.error('Sky diagnostic stopped. Check sanitized journal; no automatic retry.');process.exitCode=1;});
 else{console.error('Use --plan or --live <new-journal-path>.');process.exitCode=1;}
}
