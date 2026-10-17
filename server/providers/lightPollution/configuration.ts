import { isAbsolute, resolve } from 'node:path';
import { createPersistentQuota, type QuotaPolicy } from '../quotaState';
import { UpstreamControls } from '../upstreamControls';
import { createDarkSkySitesProvider } from './darkSkySites';
import type { LightPollutionProvider } from '../../../shared/nightsky/lightPollution';
export type LightPollutionEnvironment=Record<string,string|undefined>;
export const LIGHT_POLLUTION_QUOTA_POLICIES:QuotaPolicy[]=[{providerId:'darkskysites',accountLabel:'operator-darkskysites-project',hourlyLimit:30000,dailyLimit:30000,monthlyLimit:30000}];
function selection(raw:string|undefined):Array<'darkskysites'|'lightpollutionmap'>{if(!raw)return [];const ids=raw.split(',');if(new Set(ids).size!==ids.length||ids.some(id=>!['darkskysites','lightpollutionmap'].includes(id)))throw Error('Invalid light pollution source selection.');return ids as Array<'darkskysites'|'lightpollutionmap'>;}
export function validateLightPollutionQuotaPath(env:LightPollutionEnvironment):string|undefined{
 const path=env.NIGHTSKY_LIGHT_POLLUTION_QUOTA_STATE_PATH;if(path===undefined)return undefined;if(!isAbsolute(path))throw Error('Absolute light pollution quota path required.');
 const identity=(p:string)=>process.platform==='win32'?resolve(p).toLowerCase():resolve(p);
 for(const other of [env.NIGHTSKY_QUOTA_STATE_PATH,env.NIGHTSKY_SKY_QUOTA_STATE_PATH])if(other&&identity(path)===identity(other))throw Error('Light pollution quota requires a dedicated project ledger.');return path;
}
export function parseLightPollutionConfiguration(env:LightPollutionEnvironment){
 const selected=selection(env.NIGHTSKY_LIGHT_POLLUTION_SOURCES),admitted=selection(env.NIGHTSKY_LIGHT_POLLUTION_API_ADMITTED);
 if(admitted.some(id=>id!=='darkskysites'||!selected.includes(id)))throw Error('API admission requires selected DarkSkySites.');
 const key=env.NIGHTSKY_DARKSKYSITES_API_KEY;if(key!==undefined&&(!key.length||key.length>512||/[\x00-\x20\x7f]/.test(key)))throw Error('Invalid light pollution credential configuration.');
 const quotaPath=validateLightPollutionQuotaPath(env);return {selected,admitted,quotaPath};
}
export interface ConfiguredLightPollutionProviders {providers:LightPollutionProvider[];selected:Array<'darkskysites'|'lightpollutionmap'>;close():Promise<void>}
/** Opens an existing dedicated ledger only; never initializes, migrates or resets accounting at startup. */
export async function createConfiguredLightPollutionProviders(env:LightPollutionEnvironment,options:{fetcher?:typeof fetch;now?:()=>number;controls?:UpstreamControls}={}):Promise<ConfiguredLightPollutionProviders>{
 const config=parseLightPollutionConfiguration(env),now=options.now??Date.now;
 const enabled=config.admitted.includes('darkskysites')&&!!env.NIGHTSKY_DARKSKYSITES_API_KEY;
 const quota=enabled&&config.quotaPath?await createPersistentQuota({path:config.quotaPath,now,policies:LIGHT_POLLUTION_QUOTA_POLICIES}):undefined;
 const providers=config.selected.includes('darkskysites')?[createDarkSkySitesProvider({apiKey:env.NIGHTSKY_DARKSKYSITES_API_KEY??'',admitted:enabled,quota,fetcher:options.fetcher,now,controls:options.controls??new UpstreamControls({now})})]:[];
 return {selected:config.selected,providers,close:async()=>{try{await Promise.all(providers.map(provider=>provider.close()));}finally{await quota?.close();}}};
}
