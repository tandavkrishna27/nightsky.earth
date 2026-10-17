import * as z from 'zod4';
import type { ProviderQuota } from '../quotaTypes';
import { controlsFor, upstreamRequestKey, type UpstreamControls } from '../upstreamControls';
export interface SkyOptions { enabled: boolean; quota: ProviderQuota; fetcher?: typeof fetch; controls?: UpstreamControls; now?:()=>number; timeoutMs?:number }
export type SkyResult<T> = {status:'ok';data:T} | {status:'invalid-input'|'unavailable';reason:string};
export const dateSchema=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(s=>Number.isFinite(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s);
export const timeSchema=z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/);
export const latitude=z.number().finite().min(-90).max(90), longitude=z.number().finite().min(-180).max(180);
export const rangeValid=(v:{startDate:string;endDate:string})=>Date.parse(v.endDate)>=Date.parse(v.startDate)&&Date.parse(v.endDate)-Date.parse(v.startDate)<=30*86400000;
export function skyTransport(provider:'darkskyplanner'|'astronomyapi',options:SkyOptions,headers:Record<string,string>={}) {
 const fetcher=options.fetcher??fetch, controls=options.controls??controlsFor(options.fetcher),now=options.now??Date.now;
 let active=false,last=-Infinity,blocked=0,disabled=false;
 return async (url:URL):Promise<unknown>=>{
  if(!options.enabled||!options.quota||active||disabled||now()<blocked||now()-last<1000)throw Error('Unavailable');
  active=true;const controller=new AbortController();let timer:ReturnType<typeof setTimeout>|undefined;
  const timeout=Math.max(1,Math.min(options.timeoutMs??5000,15000));
  try{return await Promise.race([(async()=>{
   const reservation=await options.quota.reserve(provider,1);controller.signal.throwIfAborted();if(!reservation.allowed)throw Error('Quota denied');
   const response=await controls.fetch(provider,upstreamRequestKey(url.toString(),options),async()=>{
    controller.signal.throwIfAborted();last=now();
    const incoming=await fetcher(url,{method:'GET',redirect:'error',signal:controller.signal,headers:{Accept:'application/json',...headers}});
    if(incoming.redirected)throw Error('Redirect');
    if(incoming.status===401||incoming.status===403)disabled=true;
    if(incoming.status===429){const raw=incoming.headers.get('Retry-After');const wait=raw&&/^\d+$/.test(raw)?Number(raw)*1000:Date.parse(raw??'')-now();blocked=now()+Math.min(86400000,Math.max(60000,Number.isFinite(wait)?wait:60000));}
    const persist=options.quota as ProviderQuota&{setProviderState?:(p:string,s:{disabled?:boolean;blockedUntil?:number})=>Promise<void>};
    if(disabled||blocked)await persist.setProviderState?.(provider,{disabled,blockedUntil:blocked});
    return incoming;
   },controller.signal);
   if(!response.ok)throw Error('Upstream status');controller.signal.throwIfAborted();return await response.json();
  })(),new Promise<never>((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error('Deadline'));},timeout);})]);
  }finally{if(timer)clearTimeout(timer);active=false;}
 };
}
