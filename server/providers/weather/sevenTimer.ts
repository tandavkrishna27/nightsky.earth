import * as z from 'zod4';
import { weatherForecastSchema, type WeatherForecast } from '../../../shared/nightsky/weather';
import { latitudeSchema, longitudeSchema, timeWindowSchema } from '../../../shared/nightsky/common';
import { upstreamRequestKey, type UpstreamControls } from '../upstreamControls';
import type { ProviderQuota } from '../quotaTypes';
import type { QuotaPolicy } from '../quotaState';
import type { WeatherProvider, WeatherProviderResult } from './types';
/** Conservative operator spending limits, not a published vendor quota. Opt-in policy; preserve existing ledgers. */
export const SEVENTIMER_QUOTA_POLICY: QuotaPolicy = {providerId:'seventimer',accountLabel:'operator-seventimer',hourlyLimit:20,dailyLimit:100,monthlyLimit:1000};
const SOURCE={name:'7Timer!',url:'https://github.com/Yeqzids/7timer-issues/wiki/Wiki',dataClass:'forecast' as const,product:'ASTRO native three-hour forecast',attribution:'7Timer! ASTRO forecast based on NCEP GFS. Categories are model estimates; no precise values are inferred from bands.',modified:true};
const code=(min:number,max:number)=>z.union([z.number().int().min(min).max(max),z.literal(-9999)]).optional();
const payloadSchema=z.object({product:z.literal('astro'),init:z.string().regex(/^\d{10}$/),dataseries:z.array(z.object({timepoint:z.number().int().min(3).max(72).multipleOf(3),cloudcover:code(1,9),seeing:code(1,8),transparency:code(1,8),rh2m:code(-4,16),temp2m:z.union([z.number().min(-150).max(100),z.literal(-9999)]).optional(),wind10m:z.object({speed:code(1,8),direction:z.string().max(20).optional()}).optional()})).min(1).max(24)});
const bandFields=['totalCloudCover','seeing','transparency','relativeHumidity','windSpeed'] as const;
const ranges={totalCloudCover:['0–6','6–19','19–31','31–44','44–56','56–69','69–81','81–94','94–100'],seeing:['<0.5','0.5–0.75','0.75–1','1–1.25','1.25–1.5','1.5–2','2–2.5','>2.5'],transparency:['<0.3','0.3–0.4','0.4–0.5','0.5–0.6','0.6–0.7','0.7–0.85','0.85–1','>1'],windSpeed:['<0.3','0.3–3.4','3.4–8.0','8.0–10.8','10.8–17.2','17.2–24.5','24.5–32.6','>32.6']};
const unavailable=(reason:string):WeatherProviderResult=>({status:'unavailable',reason,source:SOURCE});
function normalize(raw:unknown,window:ReturnType<typeof timeWindowSchema.parse>,now:number):WeatherProviderResult {
 const payload=payloadSchema.parse(raw), init=payload.init;
 const issuedAt=`${init.slice(0,4)}-${init.slice(4,6)}-${init.slice(6,8)}T${init.slice(8,10)}:00:00.000Z`,issued=Date.parse(issuedAt);
 if(!Number.isFinite(issued)||new Date(issued).toISOString()!==issuedAt||issued>now+3600000) throw Error('Invalid issue time');
 const steps=[...payload.dataseries].sort((a,b)=>a.timepoint-b.timepoint);
 if(new Set(steps.map(s=>s.timepoint)).size!==steps.length) throw Error('Duplicate times');
 const time=(hours:number)=>issued+hours*3600000, first=time(steps[0].timepoint),last=time(steps[steps.length-1].timepoint),start=Date.parse(window.startUtc),end=Date.parse(window.endUtc);
 const selected=steps.filter(s=>time(s.timepoint)>=start&&time(s.timepoint)<=end);
 if(!selected.length) return {status:end<first||start>last?'out-of-horizon':'not-covered',reason:'7Timer supplied no native three-hour samples in the requested window.',source:SOURCE};
 const samples:WeatherForecast['samples']=selected.map(step=>{
  const values:WeatherForecast['samples'][number]['values']={},bands:NonNullable<WeatherForecast['samples'][number]['bands']>={};
  if(step.temp2m!==undefined&&step.temp2m!==-9999) values.temperature={value:step.temp2m,unit:'°C'};
  const codes=[step.cloudcover,step.seeing,step.transparency,step.rh2m,step.wind10m?.speed];
  bandFields.forEach((field,index)=>{const value=codes[index];if(value===undefined||value===-9999)return;
   const range=field==='relativeHumidity'?(value===16?'100':value===15?'95–99':`${(value+4)*5}–${(value+5)*5}`):ranges[field][value-1];
   bands[field]={code:value,range,unit:field==='seeing'?'arcseconds':field==='transparency'?'mag/airmass':field==='windSpeed'?'m/s':'%'};
  });
  return {validAt:new Date(time(step.timepoint)).toISOString(),values,bands};
 }).filter(s=>Object.keys(s.values).length||Object.keys(s.bands??{}).length);
 if(!samples.length) return unavailable('7Timer supplied no supported values; undefined fields remain unknown.');
 const status=now-issued>86400000?'stale':'partial';
 const reason=status==='stale'?'7Timer issue time is more than 24 hours old.':'7Timer native three-hour samples. Seeing, transparency, cloud, wind and humidity are categories; missing fields and gaps remain unknown. No hourly interpolation.';
 const exactFields=['totalCloudCover','lowCloudCover','mediumCloudCover','highCloudCover','precipitationProbability','precipitationAmount','windSpeed','windGust','windDirection','temperature','dewPoint','relativeHumidity','visibility'] as const;
 return {status,reason,forecast:weatherForecastSchema.parse({availability:{status,reason},source:{...SOURCE,issuedAt,validStartUtc:new Date(first).toISOString(),validEndUtc:new Date(last).toISOString()},forecastHorizonHours:(last-issued)/3600000,samples,missingFields:exactFields.filter(f=>!samples.some(s=>s.values[f]!==undefined)).map(field=>({field,reason:'No exact numeric value supplied; available category ranges are preserved separately in bands.'}))})};
}
/** Explicit activation is owned by runtime configuration. No credentials, automatic retries or retained response cache. */
export function createSevenTimerProvider(options:{fetcher:typeof fetch;now:()=>number;controls:UpstreamControls;quota:ProviderQuota}):WeatherProvider {
 let active=false,lastStart=-Infinity,disabled=false;
 const quota=options.quota as ProviderQuota & {setProviderState?(providerId:string,state:{disabled?:boolean;blockedUntil?:number}):Promise<void>};
 return {async getForecast(place,requestedWindow){
  let window:ReturnType<typeof timeWindowSchema.parse>;
  try {latitudeSchema.parse(place.latitude);longitudeSchema.parse(place.longitude);window=timeWindowSchema.parse(requestedWindow);}catch{return unavailable('7Timer coordinates or window are invalid.');}
  const now=options.now();if(disabled||active||now-lastStart<1000)return unavailable('7Timer request admission limit reached.');
  active=true;const controller=new AbortController();let timer:ReturnType<typeof setTimeout>;
  const deadline=new Promise<never>((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error('Deadline'));},5000);});
  const work=(async()=>{
   const reservation=await options.quota.reserve('seventimer',1);controller.signal.throwIfAborted();if(!reservation.allowed)return unavailable('7Timer quota reservation denied.');
   const url=new URL('https://www.7timer.info/bin/api.pl');url.searchParams.set('lon',String(place.longitude));url.searchParams.set('lat',String(place.latitude));url.searchParams.set('product','astro');url.searchParams.set('output','json');url.searchParams.set('unit','metric');url.searchParams.set('tzshift','0');
   const response=await options.controls.fetch('seventimer',upstreamRequestKey(url.href,options),async()=>{
    controller.signal.throwIfAborted();lastStart=options.now();
    const response=await options.fetcher(url,{method:'GET',redirect:'error',signal:controller.signal,headers:{Accept:'application/json'}});
    if(controller.signal.aborted||response.redirected){void response.body?.cancel().catch(()=>{});throw Error('Aborted or redirected');}
    if(response.status===401||response.status===403){disabled=true;await quota.setProviderState?.('seventimer',{disabled:true});}
    if(response.status===429){const raw=response.headers.get('Retry-After');const delay=raw&&/^\d+$/.test(raw.trim())?Number(raw)*1000:raw?Date.parse(raw)-options.now():60000;await quota.setProviderState?.('seventimer',{blockedUntil:options.now()+Math.min(86400000,Math.max(1000,Number.isFinite(delay)?delay:60000))});}
    if(Number(response.headers.get('Content-Length'))>131072){void response.body?.cancel().catch(()=>{});throw Error('Size');}
    if(!response.ok){void response.body?.cancel().catch(()=>{});return new Response(null,{status:response.status,headers:response.headers});}
    const reader=response.body?.getReader();if(!reader)throw Error('No body');
    const cancel=()=>{void reader.cancel().catch(()=>{});};
    controller.signal.addEventListener('abort',cancel,{once:true});
    const chunks:Uint8Array[]=[];let size=0;
    try {
     for(;;){controller.signal.throwIfAborted();const part=await reader.read();controller.signal.throwIfAborted();if(part.done)break;size+=part.value.byteLength;if(size>131072)throw Error('Size');chunks.push(part.value);}
    }finally{controller.signal.removeEventListener('abort',cancel);cancel();reader.releaseLock();}
    return new Response(Buffer.concat(chunks,size),{status:response.status,headers:response.headers});
   },controller.signal);
   controller.signal.throwIfAborted();if(!response.ok)return unavailable(`7Timer returned HTTP ${response.status}; no forecast available.`);
   const text=await response.text();if(Buffer.byteLength(text)>131072)throw Error('Size');
   return normalize(JSON.parse(text),window,now);
  })();
  void work.then(()=>{active=false;},()=>{active=false;});
  try{return await Promise.race([work,deadline]);}catch{return unavailable(controller.signal.aborted?'7Timer request or body timed out.':'7Timer request failed or returned an invalid response.');}finally{clearTimeout(timer!);}
 }};
}
