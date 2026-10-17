import * as z from 'zod4';
import type { ProviderQuota } from '../quotaTypes';
import { sourceRecordSchema, utcInstantSchema } from '../../../shared/nightsky/common';
import { createHash } from 'node:crypto';
import { controlsFor, type UpstreamControls } from '../upstreamControls';

export interface SpaceOptions { nasaApiKey?: string; nasaEnabled?: boolean; jplEnabled?: boolean; fetcher?: typeof fetch; quota: ProviderQuota; controls?: UpstreamControls; now?: () => number; timeoutMs?: number }
export const DONKI_SOURCE = { name: 'NASA CCMC DONKI', url: 'https://ccmc.gsfc.nasa.gov/tools/DONKI/', dataClass: 'observation' as const, product: 'Experimental space weather event context', attribution: 'NASA CCMC and the Moon to Mars Space Weather Analysis Office. Preliminary research information; not an operational forecast.' };
export const JPL_SOURCE = { name: 'NASA/JPL Solar System Dynamics', url: 'https://ssd-api.jpl.nasa.gov/doc/sbdb.html', dataClass: 'catalog' as const, product: 'Small-Body Database identity', attribution: 'NASA/JPL Small-Body Database (SBDB); normalized by NightSky.' };
export const HORIZONS_SOURCE = { ...JPL_SOURCE, url:'https://ssd-api.jpl.nasa.gov/doc/horizons.html', dataClass:'calculation' as const, product:'Horizons topocentric observer ephemeris' };
export type SpaceStatus = 'available' | 'unavailable' | 'invalid-input' | 'not-found' | 'ambiguous';
const date = z.string().regex(/^20\d{2}-\d{2}-\d{2}$/).refine(v => Number.isFinite(Date.parse(v)) && new Date(v).toISOString().slice(0,10) === v);
export const spaceWeatherInputSchema = z.object({eventType:z.enum(['FLR','GST']),startDate:date,endDate:date}).strict().refine(v=>Date.parse(v.endDate)>=Date.parse(v.startDate)&&Date.parse(v.endDate)-Date.parse(v.startDate)<=30*86400000);
export const smallBodyInputSchema = z.object({query:z.string().trim().min(1).max(80).regex(/^[A-Za-z0-9 /().+-]+$/).refine(v=>!v.includes('://'))}).strict();
const text = z.string().min(1).max(200).regex(/^[^\x00-\x1f\x7f]*$/);
const instant = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?Z$/).refine(v=>Number.isFinite(Date.parse(v)) && new Date(v).toISOString().slice(0,v.length-1)===v.slice(0,-1));
const flare = z.object({flrID:text,beginTime:instant,classType:z.string().regex(/^[ABCMX]\d+(?:\.\d+)?$/).nullish()});
const storm = z.object({gstID:text,startTime:instant});
const identity = z.object({spkid:z.string().regex(/^\d{1,12}$/),des:text,fullname:text,neo:z.boolean(),pha:z.boolean(),kind:z.enum(['an','au','cn','cu'])});
const sbdb = z.object({signature:z.object({version:z.literal('1.3')}),object:identity.optional(),code:z.number().int().optional(),list:z.array(z.object({pdes:text,name:text})).max(100).optional()});
export interface SpaceWeatherResult { status:SpaceStatus; reason:string; source:typeof DONKI_SOURCE; events?:Array<{id:string;eventType:'FLR'|'GST';startUtc:string;classType?:string}> }
export interface SmallBodyResult { status:SpaceStatus; reason:string; source:typeof JPL_SOURCE; object?:{spkId:string;designation:string;name:string;nearEarth:boolean;potentiallyHazardous:boolean;kind:string}; candidates?:Array<{designation:string;name:string}> }
const statusSchema=z.enum(['available','unavailable','invalid-input','not-found','ambiguous']);
export const spaceWeatherResultSchema=z.object({status:statusSchema,reason:z.string().max(500),source:sourceRecordSchema,events:z.array(z.object({id:text,eventType:z.enum(['FLR','GST']),startUtc:utcInstantSchema,classType:z.string().max(20).optional()}).strict()).max(500).optional()}).strict();
export const smallBodyResultSchema=z.object({status:statusSchema,reason:z.string().max(500),source:sourceRecordSchema,object:z.object({spkId:z.string().regex(/^\d{1,12}$/),designation:text,name:text,nearEarth:z.boolean(),potentiallyHazardous:z.boolean(),kind:z.string().max(2)}).strict().optional(),candidates:z.array(z.object({designation:text,name:text}).strict()).max(100).optional()}).strict();
export const observerEphemerisInputSchema=z.object({spkId:z.string().regex(/^\d{7,12}$/),latitude:z.number().finite().min(-90).max(90),longitude:z.number().finite().min(-180).max(180),elevationMeters:z.number().finite().min(-500).max(9000),atUtc:utcInstantSchema.refine(v=>v.startsWith('20'))}).strict();
export const observerEphemerisResultSchema=z.object({status:statusSchema,reason:z.string().max(500),source:sourceRecordSchema,sample:z.object({spkId:z.string().regex(/^\d{7,12}$/),atUtc:utcInstantSchema,azimuthDegrees:z.number().finite().min(0).max(360),altitudeDegrees:z.number().finite().min(-90).max(90),refraction:z.literal('airless')}).strict().optional()}).strict();
export type ObserverEphemerisResult=z.infer<typeof observerEphemerisResultSchema>;
export type SpaceProviders=ReturnType<typeof createSpaceProviders>;
// JPL requires one request at a time across SSD APIs. This queue is shared by all
// adapter instances; it retains the slot until the actual transport settles.
let jplTail:Promise<unknown> = Promise.resolve();
let jplPending=0;
function serialJpl<T>(work:()=>Promise<T>):Promise<T> {
 if(jplPending>=8) return Promise.reject(Error('Admission'));
 jplPending++;
 const next=jplTail.then(work); jplTail=next.catch(()=>{}).finally(()=>{jplPending--;}); return next;
}
async function boundedJson(response:Response,signal:AbortSignal,allowAmbiguous=false):Promise<unknown> {
 if(response.status!==200&&!(allowAmbiguous&&response.status===300)){await response.body?.cancel();throw Error('Response');}
 const declared=response.headers.get('content-length');
 if(declared!==null&&(!/^\d+$/.test(declared)||Number(declared)>1048576)){await response.body?.cancel();throw Error('Size');}
 if(!response.body)throw Error('Body');
 const reader=response.body.getReader();const chunks:Uint8Array[]=[];let size=0;
 const cancel=()=>{void reader.cancel().catch(()=>{});};signal.addEventListener('abort',cancel,{once:true});
 try{for(;;){if(signal.aborted)throw Error('Deadline');const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>1048576)throw Error('Size');chunks.push(part.value);}if(signal.aborted)throw Error('Deadline');return JSON.parse(Buffer.concat(chunks).toString('utf8'));}
 finally{signal.removeEventListener('abort',cancel);await reader.cancel().catch(()=>{});reader.releaseLock();}
}
export function createSpaceProviders(options:SpaceOptions) {
 const blocks = new Map<string,number>();
 const fetcher=options.fetcher??globalThis.fetch,now=options.now??Date.now;
 const controls=options.controls??controlsFor(fetcher);
 const timeoutMs=options.timeoutMs??10000;
 if(!Number.isInteger(timeoutMs)||timeoutMs<1||timeoutMs>10000)throw Error('Invalid space timeout');
 let nasaActive=false;
 async function request(provider:'nasa-donki'|'jpl',url:URL):Promise<unknown>{
  const controller=new AbortController();let timer:ReturnType<typeof setTimeout>|undefined;
  const work=async()=>{
   if(controller.signal.aborted||(blocks.get(provider)??0)>now())throw Error('Admission');
   const key=createHash('sha256').update(url.toString()).digest('hex');
   const result=await controls.fetch(provider,key,async()=>{
    const reservation=await options.quota.reserve(provider,1);if(!reservation.allowed||controller.signal.aborted)throw Error('Quota');
    const response=await fetcher(url,{signal:controller.signal,redirect:'error',headers:{Accept:'application/json'}});
    if(response.redirected){await response.body?.cancel();throw Error('Redirect');}
    const persistent=options.quota as ProviderQuota & {setProviderState?:(provider:string,state:{disabled?:boolean;blockedUntil?:number})=>Promise<void>};
    if(response.status===401||response.status===403){
     blocks.set(provider,Number.MAX_SAFE_INTEGER);
     try{await persistent.setProviderState?.(provider,{disabled:true});}catch{await response.body?.cancel();throw Error('State');}
    }else if(response.status===429||response.status>=500){
     const retry=response.headers.get('retry-after');
     const delay=retry&&/^\d+$/.test(retry)?Number(retry)*1000:Date.parse(retry??'')-now();
     const blockedUntil=now()+Math.max(60000,Math.min(86400000,Number.isFinite(delay)?delay:60000));
     blocks.set(provider,blockedUntil);
     try{await persistent.setProviderState?.(provider,{blockedUntil});}catch{await response.body?.cancel();throw Error('State');}
    }
    // Enforce the stricter space-source body bound before the shared controls buffer it.
    return Response.json(await boundedJson(response,controller.signal,url.pathname==='/sbdb.api'));
   },controller.signal);
   return result.json();
  };
  try{return await Promise.race([provider==='jpl'?serialJpl(work):work(),new Promise<never>((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error('Deadline'));},timeoutMs);})]);}
  finally{if(timer)clearTimeout(timer);}
 }
 return {
  async getSpaceWeather(input:unknown):Promise<SpaceWeatherResult>{
   const parsed=spaceWeatherInputSchema.safeParse(input);
   if(!parsed.success)return {status:'invalid-input',reason:'Use FLR or GST and real UTC dates spanning at most 31 calendar days.',source:DONKI_SOURCE};
   if(!options.nasaEnabled||!options.nasaApiKey||!options.nasaApiKey.trim()||options.nasaApiKey.length>256)return {status:'unavailable',reason:'NASA DONKI is not configured and enabled.',source:DONKI_SOURCE};
   if(nasaActive)return {status:'unavailable',reason:'NASA DONKI request admission is busy.',source:DONKI_SOURCE};
   nasaActive=true;
   try{
    const {eventType,startDate,endDate}=parsed.data;const url=new URL('https://api.nasa.gov/DONKI/'+eventType);
    url.search=new URLSearchParams({startDate,endDate,api_key:options.nasaApiKey}).toString();
    const raw=await request('nasa-donki',url);
    const events=eventType==='FLR'?z.array(flare).max(500).parse(raw).map(e=>({id:e.flrID,eventType,startUtc:new Date(e.beginTime).toISOString(),...(e.classType?{classType:e.classType}:{})})):z.array(storm).max(500).parse(raw).map(e=>({id:e.gstID,eventType,startUtc:new Date(e.startTime).toISOString()}));
    if(events.some(e=>e.startUtc.slice(0,10)<startDate||e.startUtc.slice(0,10)>endDate)||new Set(events.map(e=>e.id)).size!==events.length)throw Error('Range');
    return {status:'available',reason:'Experimental space weather event context; this is not a local aurora forecast. An empty list means no matching records were returned.',source:DONKI_SOURCE,events};
   }catch{return {status:'unavailable',reason:'NASA DONKI could not provide validated event context within request limits.',source:DONKI_SOURCE};}
   finally{nasaActive=false;}
  },
  async resolveSmallBody(input:unknown):Promise<SmallBodyResult>{
   const parsed=smallBodyInputSchema.safeParse(input);
   if(!parsed.success)return {status:'invalid-input',reason:'Provide a small-body name or designation of at most 80 characters.',source:JPL_SOURCE};
   if(!options.jplEnabled)return {status:'unavailable',reason:'JPL is not enabled.',source:JPL_SOURCE};
   try{
    const url=new URL('https://ssd-api.jpl.nasa.gov/sbdb.api');url.search=new URLSearchParams({sstr:parsed.data.query,'no-orbit':'1'}).toString();
    const data=sbdb.parse(await request('jpl',url));
    if(data.code===300&&data.list?.length)return {status:'ambiguous',reason:'Choose a specific designation from the returned matches.',source:JPL_SOURCE,candidates:data.list.map(o=>({designation:o.pdes,name:o.name}))};
    if(data.code===200&&!data.object)return {status:'not-found',reason:'JPL returned no matching small body.',source:JPL_SOURCE};
    if(!data.object||data.code!==undefined)throw Error('Identity');
    const o=data.object;return {status:'available',reason:'JPL small-body identity; this does not predict visibility or observer position.',source:JPL_SOURCE,object:{spkId:o.spkid,designation:o.des,name:o.fullname,nearEarth:o.neo,potentiallyHazardous:o.pha,kind:o.kind}};
   }catch{return {status:'unavailable',reason:'JPL could not provide a validated identity within request limits.',source:JPL_SOURCE};}
  },
  async getObserverEphemeris(input:unknown):Promise<ObserverEphemerisResult>{
   const parsed=observerEphemerisInputSchema.safeParse(input);
   if(!parsed.success)return {status:'invalid-input',reason:'Provide a numeric SBDB SPK ID, Earth observer coordinates and elevation, and a UTC instant in 2000–2099.',source:HORIZONS_SOURCE};
   if(!options.jplEnabled)return {status:'unavailable',reason:'JPL is not enabled.',source:HORIZONS_SOURCE};
   try{
    const p=parsed.data,jd=Date.parse(p.atUtc)/86400000+2440587.5;
    const url=new URL('https://ssd.jpl.nasa.gov/api/horizons.api');
    const params:Record<string,string>={COMMAND:p.spkId+';',OBJ_DATA:'NO',MAKE_EPHEM:'YES',EPHEM_TYPE:'OBSERVER',CENTER:'coord@399',COORD_TYPE:'GEODETIC',SITE_COORD:[p.longitude,p.latitude,p.elevationMeters/1000].join(','),TLIST:String(jd),TLIST_TYPE:'JD',TIME_TYPE:'UT',CAL_FORMAT:'JD',CAL_TYPE:'GREGORIAN',QUANTITIES:'4',CSV_FORMAT:'YES',APPARENT:'AIRLESS',EXTRA_PREC:'YES'};
    url.searchParams.set('format','json');for(const [key,value] of Object.entries(params))url.searchParams.set(key,"'"+value+"'");
    const payload=z.object({signature:z.object({version:z.literal('1.3')}),result:z.string().max(1048576),error:z.unknown().optional()}).parse(await request('jpl',url));
    if(payload.error!==undefined||!payload.result.includes('('+p.spkId+')'))throw Error('Target');
    const sections=payload.result.split('$$SOE');if(sections.length!==2)throw Error('Table');
    const end=sections[1].split('$$EOE');if(end.length!==2)throw Error('Table');
    const rows=end[0].trim().split(/\r?\n/);if(rows.length!==1)throw Error('Rows');
    const cells=rows[0].split(',').map(v=>v.trim());if(cells.length!==6||cells[5]!==''||![cells[0],cells[3],cells[4]].every(v=>/^[+-]?\d+(?:\.\d+)?$/.test(v)))throw Error('Columns');
    if(Math.abs(Number(cells[0])-jd)*86400>1)throw Error('Epoch');
    return observerEphemerisResultSchema.parse({status:'available',reason:'Apparent airless azimuth/elevation at the specified Earth observer. Weather, terrain, brightness and visibility are not evaluated.',source:HORIZONS_SOURCE,sample:{spkId:p.spkId,atUtc:p.atUtc,azimuthDegrees:Number(cells[3]),altitudeDegrees:Number(cells[4]),refraction:'airless'}});
   }catch{return {status:'unavailable',reason:'JPL Horizons could not provide a validated observer ephemeris within request limits.',source:HORIZONS_SOURCE};}
  }
 };
}
