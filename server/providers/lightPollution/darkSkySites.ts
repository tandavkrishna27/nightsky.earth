import * as z from 'zod4';
import { lightPollutionPointSchema, lightPollutionResultSchema, type LightPollutionPoint, type LightPollutionProvider, type LightPollutionResult } from '../../../shared/nightsky/lightPollution';
import type { ProviderQuota } from '../quotaTypes';
import { controlsFor, upstreamRequestKey, type UpstreamControls } from '../upstreamControls';

export interface DarkSkySitesOptions {
 apiKey:string; admitted:boolean; quota?:ProviderQuota; fetcher?:typeof fetch; controls?:UpstreamControls; now?:()=>number;
 /** May shorten the production 15 second deadline, never extend it. */
 deadlineMs?:number;
}
const text=z.string().min(1).max(2000);
const responseSchema=z.object({latitude:z.number().finite().min(-90).max(90),longitude:z.number().finite().min(-180).max(180),sqm:z.number().finite().min(0).max(30),bortleClass:z.number().int().min(1).max(9),bortleDescription:text.optional(),
 dataset:z.object({id:text,year:z.number().int().min(1900).max(9999),month:z.number().int().min(1).max(12),requestedDate:text.nullable().optional(),fallbackUsed:z.boolean().optional(),fallbackFrom:text.nullable().optional(),fallbackReason:text.nullable().optional(),datasetsChecked:z.number().int().min(0).max(1000000).optional()}).optional(),
 quality:z.object({status:text,method:text,coverageVerified:z.boolean(),flags:z.array(text).max(100)}).optional(),attribution:text});
type Flight={controller:AbortController;promise:Promise<LightPollutionResult>;waiters:number};
function containsSecret(value:unknown,secret:string):boolean {return typeof value==='string'?value.includes(secret):Array.isArray(value)?value.some(item=>containsSecret(item,secret)):!!value&&typeof value==='object'?Object.values(value).some(item=>containsSecret(item,secret)):false;}
function abortable<T>(promise:Promise<T>,signal:AbortSignal):Promise<T>{return new Promise((resolve,reject)=>{const abort=()=>reject(Error('cancelled'));if(signal.aborted){abort();return;}signal.addEventListener('abort',abort,{once:true});promise.then(value=>{signal.removeEventListener('abort',abort);resolve(value);},error=>{signal.removeEventListener('abort',abort);reject(error);});});}
async function boundedResponse(response:Response,signal:AbortSignal):Promise<Response>{
 if(Number(response.headers.get('content-length'))>262144){void response.body?.cancel().catch(()=>{});throw Error('response_too_large');}
 const reader=response.body?.getReader();const parts:Uint8Array[]=[];let size=0;
 if(reader){const cancel=()=>{void reader.cancel().catch(()=>{});};signal.addEventListener('abort',cancel,{once:true});try{for(;;){const part=await abortable(reader.read(),signal);if(signal.aborted)throw Error('cancelled');if(part.done)break;size+=part.value.byteLength;if(size>262144)throw Error('response_too_large');parts.push(part.value);}}catch(e){cancel();throw e;}finally{signal.removeEventListener('abort',cancel);reader.releaseLock();}}
 const bytes=new Uint8Array(size);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.byteLength;}return new Response([204,205,304].includes(response.status)?null:bytes,{status:response.status,headers:response.headers});
}
/** Server-only official latest zenith adapter. Every dispatched attempt consumes local quota, including failures. */
export interface DarkSkySitesProvider extends LightPollutionProvider {close():Promise<void>}
export function createDarkSkySitesProvider(options:DarkSkySitesOptions):DarkSkySitesProvider {
 let closed=false;
 const now=options.now??Date.now,fetcher=options.fetcher??fetch,controls=options.controls??controlsFor(options.fetcher);
 const cache=new Map<string,{at:number;result:LightPollutionResult}>(),flights=new Map<string,Flight>();
 const base=(point:LightPollutionPoint,errorCode:string|null=null):LightPollutionResult=>({candidateId:point.candidateId,sourceId:'darkskysites',transport:'api',status:'unavailable',requestedPoint:{latitude:point.latitude,longitude:point.longitude},observedPoint:null,coordinateBinding:'unverified',retrievedAt:new Date(now()).toISOString(),dataset:{label:null,id:null,year:null,month:null},sqm:null,unit:'mag/arcsec2',bortleClasses:null,quality:{coverage:'unknown',notes:[],assessments:[]},attribution:'darkskysites.com',sourceUrl:'https://darkskysites.com/',limitations:['Provider estimate, not a live sky measurement.'],errorCode});
 async function execute(point:LightPollutionPoint,key:string,controller:AbortController):Promise<LightPollutionResult>{
  let timedOut=false;const timer=setTimeout(()=>{timedOut=true;controller.abort();},Math.max(1,Math.min(options.deadlineMs??15000,15000)));
  try{
   const url=new URL('https://darkskysites.com/api/sqm');url.searchParams.set('lat',String(point.latitude));url.searchParams.set('lng',String(point.longitude));
   const response=await abortable(controls.fetch('darkskysites',upstreamRequestKey(key,options.quota,controller),async()=>{
    if(controller.signal.aborted)throw Error('cancelled');
    const reservation=await options.quota!.reserve('darkskysites',1);if(!reservation.allowed)throw Error('quota_unavailable');if(controller.signal.aborted)throw Error('cancelled');
    // Persistence can cross a rate window. Recheck the shared dispatch budget
    // synchronously with transport invocation; a rejected dispatch stays charged.
    const raw=await abortable(controls.dispatch('darkskysites',()=>fetcher(url,{method:'GET',headers:{'x-api-key':options.apiKey},redirect:'error',signal:controller.signal})),controller.signal);
    if(raw.redirected||(raw.url&&raw.url!==url.href)){void raw.body?.cancel().catch(()=>{});throw Error('invalid_response');}
    return boundedResponse(raw,controller.signal);
   },controller.signal),controller.signal);
   if(!response.ok)return base(point,`http_${response.status}`);
   let raw:unknown;try{raw=await response.json();}catch{throw Error('invalid_response');}
   if(containsSecret(raw,options.apiKey))throw Error('invalid_response');
   const parsed=responseSchema.safeParse(raw);if(!parsed.success)throw Error('invalid_response');const data=parsed.data;
   if(data.dataset&&data.dataset.id!==`${String(data.dataset.month).padStart(2,'0')}_${data.dataset.year}`)throw Error('invalid_response');
   if(data.latitude!==point.latitude||data.longitude!==point.longitude)throw Error('coordinate_mismatch');
   const r=base(point);r.observedPoint={latitude:data.latitude,longitude:data.longitude};r.coordinateBinding='verified';r.errorCode=null;
   if(data.dataset)r.dataset={label:null,...data.dataset};
   const zero=data.sqm===0||data.quality?.status==='unverified_zero'||data.quality?.flags.includes('unverified_zero');
   r.quality={coverage:zero?'unverified_zero':data.quality?.coverageVerified===true?'verified':'unknown',notes:[],assessments:data.bortleDescription?[{label:data.bortleDescription,attribution:data.attribution}]:[],...(data.quality??{})};
   r.attribution=data.attribution;
   if(data.dataset&&!zero){r.sqm=data.sqm;r.bortleClasses=[data.bortleClass];}
   const completeDataset=data.dataset&&['requestedDate','fallbackUsed','fallbackFrom','fallbackReason','datasetsChecked'].every(field=>Object.hasOwn(data.dataset!,field));
   r.status=completeDataset&&data.quality&&!zero?'available':'partial';
   if(!data.dataset)r.limitations.push('Dataset provenance was not supplied; metrics withheld.');
   else if(!completeDataset)r.limitations.push('Dataset fallback metadata was incomplete.');
   if(!data.quality)r.limitations.push('Quality metadata was not supplied.');
   if(zero)r.limitations.push('Unverified zero or missing coverage cannot establish pristine darkness.');
   if(!lightPollutionResultSchema.safeParse(r).success)throw Error('invalid_response');
   if(!controller.signal.aborted&&(r.sqm!==null||r.bortleClasses!==null)){cache.set(key,{at:now(),result:structuredClone(r)});while(cache.size>256)cache.delete(cache.keys().next().value!);}
   return r;
  }catch(error){const code=controller.signal.aborted?(timedOut?'deadline_exceeded':'cancelled'):error instanceof Error&&['response_too_large','invalid_response','coordinate_mismatch','quota_unavailable'].includes(error.message)?error.message:'upstream_unavailable';return base(point,code);}finally{clearTimeout(timer);}
 }
 return {sourceId:'darkskysites',transport:'api',async close(){closed=true;const pending=Array.from(flights.values());for(const flight of pending)flight.controller.abort();await Promise.all(pending.map(flight=>flight.promise));cache.clear();},async lookup(input,signal){
  const point=lightPollutionPointSchema.parse(input);
  if(closed)return base(point,'provider_closed');
  if(signal?.aborted)return base(point,'cancelled');
  if(!options.admitted||!options.apiKey||!options.quota)return base(point,'not_admitted');
  const key=`darkskysites:api:${point.latitude}:${point.longitude}`;const cached=cache.get(key);
  if(cached&&now()>=cached.at&&now()-cached.at<86400000)return {...structuredClone(cached.result),candidateId:point.candidateId};
  if(cached)cache.delete(key);
  let flight=flights.get(key);if(!flight){const controller=new AbortController();flight={controller,waiters:0,promise:Promise.resolve(base(point))};const current=flight;flight.promise=execute(point,key,controller).finally(()=>{if(flights.get(key)===current)flights.delete(key);});flights.set(key,flight);}
  const current=flight;current.waiters++;
  try{const result=signal?await abortable(current.promise,signal):await current.promise;return {...structuredClone(result),candidateId:point.candidateId};}catch{return base(point,'cancelled');}finally{current.waiters--;if(current.waiters===0){current.controller.abort();if(flights.get(key)===current)flights.delete(key);}}
 }};
}
