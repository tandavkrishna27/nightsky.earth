import {z} from 'zod';
import {isAbsolute, resolve, win32} from 'node:path';
import {parseWeatherConfiguration} from '../providers/weather/configuration';
import {parseSkyConfiguration} from '../providers/skyConfiguration';
import {parseLightPollutionConfiguration} from '../providers/lightPollution/configuration';
export const API_SOURCE_ENV_KEYS = ['NIGHTSKY_WEATHER_PROVIDERS','NIGHTSKY_WEATHER_ADMITTED_PROVIDERS','NIGHTSKY_QUOTA_STATE_PATH','NIGHTSKY_SKY_PROVIDERS','NIGHTSKY_SKY_ADMITTED_PROVIDERS','NIGHTSKY_SKY_QUOTA_STATE_PATH','NIGHTSKY_PUBLICUNIVERSE_QUOTA_STATE_PATH','NIGHTSKY_LIGHT_POLLUTION_SOURCES','NIGHTSKY_LIGHT_POLLUTION_API_ADMITTED','NIGHTSKY_LIGHT_POLLUTION_QUOTA_STATE_PATH','NIGHTSKY_LIGHT_POLLUTION_BROWSER_ENABLED','NIGHTSKY_GEOMETRY_ENABLED','NIGHTSKY_GEOMETRY_SOURCE_ACCEPTED'] as const;
const environmentSchema=z.object(Object.fromEntries(API_SOURCE_ENV_KEYS.map(k=>[k,z.string().max(4096).optional()]))).strict();
export const apiSourceReleaseManifestSchema=z.object({environment:environmentSchema,discoveryProviders:z.array(z.enum(['geoapify','geonames'])).min(1).max(2),evidence:z.record(z.string(),z.array(z.string().trim().min(1).max(1024)).min(1))}).strict();
export const apiSourceManifestSchema=z.object({schemaVersion:z.literal(1),current:apiSourceReleaseManifestSchema,rollback:apiSourceReleaseManifestSchema}).strict();
/** Pure offline declarations: no reads, traffic, admission, or entitlement verification. */
export function validateApiSourceReleaseManifest(input:unknown){
 const manifest=apiSourceReleaseManifestSchema.parse(input),env=manifest.environment as Record<string,string|undefined>;
 const weather=parseWeatherConfiguration(env),sky=parseSkyConfiguration(env),light=parseLightPollutionConfiguration(env);
 const requireEvidence=(id:string)=>{if(!manifest.evidence[id]?.length)throw Error('Source manifest evidence missing.');};
 if(new Set(manifest.discoveryProviders).size!==manifest.discoveryProviders.length)throw Error('Duplicate discovery source.');
 manifest.discoveryProviders.forEach(requireEvidence);
 requireEvidence('noaa-swpc'); requireEvidence('astronomy-engine');
 if((weather.providers??['met']).includes('met'))requireEvidence('met');
 const paths=API_SOURCE_ENV_KEYS.filter(k=>k.endsWith('QUOTA_STATE_PATH')).flatMap(k=>env[k]?[env[k]!]:[]);
 const normalized=paths.map(p=>{if(!isAbsolute(p)&&!win32.isAbsolute(p))throw Error('Absolute existing ledger scope required.');return win32.isAbsolute(p)?win32.resolve(p).toLowerCase():resolve(p);});
 if(new Set(normalized).size!==normalized.length)throw Error('Source ledger scopes must be distinct.');
 if(sky.admitted.includes('publicuniverse'))throw Error('Unresolved provider-wide Public Universe rights.');
 if(light.selected.includes('lightpollutionmap')||env.NIGHTSKY_LIGHT_POLLUTION_BROWSER_ENABLED && env.NIGHTSKY_LIGHT_POLLUTION_BROWSER_ENABLED!=='false')throw Error('Experimental browser source is not admitted in API-only V1.');
 if(sky.admitted.length)throw Error('Optional sky admission requires a separate reviewed feature contract.');
 for(const key of ['NIGHTSKY_GEOMETRY_ENABLED','NIGHTSKY_GEOMETRY_SOURCE_ACCEPTED'])if(env[key]!==undefined&&!['yes','no'].includes(env[key]!))throw Error('Invalid geometry flag.');
 if(env.NIGHTSKY_GEOMETRY_ENABLED==='yes'){
  if(env.NIGHTSKY_GEOMETRY_SOURCE_ACCEPTED!=='yes'||!manifest.discoveryProviders.includes('geoapify'))throw Error('Geometry requires selected accepted Geoapify.');
  requireEvidence('geoapify-geometry');
 }
 weather.admitted.forEach(requireEvidence); light.admitted.forEach(requireEvidence);
 if(weather.admitted.some(id=>id!=='met')&&!weather.quotaPath)throw Error('Weather admission requires existing quota scope.');
 if(light.admitted.length&&!light.quotaPath)throw Error('Light pollution admission requires dedicated quota scope.');
 return manifest;
}
export function validateApiSourceManifest(input:unknown){const manifest=apiSourceManifestSchema.parse(input);validateApiSourceReleaseManifest(manifest.current);validateApiSourceReleaseManifest(manifest.rollback);return manifest;}
