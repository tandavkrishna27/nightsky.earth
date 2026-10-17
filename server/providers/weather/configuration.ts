import { isAbsolute, parse } from 'node:path';
import { UpstreamControls } from '../upstreamControls';
import type { QuotaPolicy } from '../quotaState';
import type { ProviderQuota } from '../quotaTypes';
import type { WeatherCollectionService, WeatherProviderId } from './types';
import { createWeatherCollection, unavailableWeather } from './collection';
import { createMetNorwayProvider } from './metNorway';
import { createWeatherApiProvider } from './weatherApi';
import { createOpenWeatherProvider } from './openWeather';
/** Fixed stable labels survive key rotation and selection rollback. One account per provider per checkpoint. */
export const PROVIDER_QUOTA_POLICIES: QuotaPolicy[] = [
 {providerId:'geonames',accountLabel:'operator-geonames',hourlyLimit:400,dailyLimit:2000},
 {providerId:'geoapify',accountLabel:'operator-geoapify',hourlyLimit:200,dailyLimit:1000},
 {providerId:'weatherapi',accountLabel:'operator-weatherapi',hourlyLimit:60,dailyLimit:1000,monthlyLimit:20000},
 {providerId:'openweather',accountLabel:'operator-openweather',hourlyLimit:30,dailyLimit:300,monthlyLimit:5000},
];
type Environment = Record<string,string|undefined>;
function ids(raw:string, allowEmpty=false):WeatherProviderId[] {
 const values=raw===''&&allowEmpty?[]:raw.split(',');
 if(values.length>4 || new Set(values).size!==values.length || values.some(v=>!['met','weatherapi','openweather'].includes(v))) throw Error('Invalid weather provider selection.');
 return values as WeatherProviderId[];
}
/** Does not return credentials, inspect accounts, or contact providers. */
export function parseWeatherConfiguration(environment:Environment) {
 const providers=environment.NIGHTSKY_WEATHER_PROVIDERS===undefined?undefined:ids(environment.NIGHTSKY_WEATHER_PROVIDERS);
 const admitted=ids(environment.NIGHTSKY_WEATHER_ADMITTED_PROVIDERS??'',true);
 if(admitted.some(id=>!(providers??['met']).includes(id))) throw Error('Invalid weather admission selection.');
 for(const key of ['NIGHTSKY_WEATHERAPI_KEY','NIGHTSKY_OPENWEATHER_KEY']) {
  const value=environment[key];
  if(value!==undefined&&(!value.trim()||value.length>256||/[\x00-\x20\x7f]/.test(value))) throw Error('Invalid weather provider credentials.');
 }
 const path=environment.NIGHTSKY_QUOTA_STATE_PATH;
 if(path!==undefined&&(!path.trim()||path.length>4096||/[\x00-\x1f\x7f]/.test(path)||!isAbsolute(path)||path.replace(/\\/g,'/').startsWith('//')||path.slice(parse(path).root.length).includes(':')||(process.platform==='win32'&&!/^[a-zA-Z]:[\\/]$/.test(parse(path).root)))) throw Error('Invalid weather quota configuration.');
 return {providers,admitted,quotaPath:path};
}
export function createConfiguredWeatherCollection(environment:Environment,options:{quota?:ProviderQuota;fetcher?:typeof fetch;now?:()=>number}={}):WeatherCollectionService|undefined {
 const config=parseWeatherConfiguration(environment);
 if(!config.providers) return undefined;
 const controls=new UpstreamControls({now:options.now??Date.now});
 const entries=config.providers.map(id=>{
  if(id==='met') return {id,enabled:true,provider:createMetNorwayProvider({userAgent:environment.MET_NORWAY_USER_AGENT??'',fetcher:options.fetcher,controls})};
  const key=environment[id==='weatherapi'?'NIGHTSKY_WEATHERAPI_KEY':'NIGHTSKY_OPENWEATHER_KEY'];
  const reason=!key?'Weather source credentials are not configured.':!config.admitted.includes(id)?'Weather source admission has not been recorded.':!options.quota?'Durable provider quota is not configured.':undefined;
  const provider=reason?{getForecast:async()=>unavailableWeather(id,reason)}:(id==='weatherapi'?createWeatherApiProvider:createOpenWeatherProvider)({apiKey:key!,fetcher:options.fetcher??fetch,now:options.now??Date.now,controls,quota:options.quota!});
  return {id,enabled:true,provider};
 });
 return createWeatherCollection(entries,{deadlineMs:12000});
}
