import { cacheSourceMethod } from './sourceCache';
import type { ProviderQuota } from './quotaTypes';
import type { QuotaPolicy } from './quotaState';
import { UpstreamControls } from './upstreamControls';
import { createDarkSkyPlannerProvider } from './sky/darkSkyPlanner';
import { createAstronomyApiProvider } from './sky/astronomyApi';
import { createSpaceProviders } from './space';

const IDS = ['darkskyplanner', 'astronomyapi', 'nasa-donki', 'jpl'] as const;
export type SkyProviderId = typeof IDS[number];
type Environment = Record<string, string | undefined>;
function selection(raw: string | undefined): SkyProviderId[] {
  if (raw === undefined || raw === '') return [];
  const ids = raw.split(',');
  if (new Set(ids).size !== ids.length || ids.some(id => !IDS.includes(id as SkyProviderId))) throw Error('Invalid optional sky source selection.');
  return ids as SkyProviderId[];
}
/** Operator ceilings, not claims about vendor entitlements. Admission is separate. */
export const SKY_QUOTA_POLICIES: QuotaPolicy[] = IDS.map(providerId => ({providerId, accountLabel:`operator-${providerId}`, hourlyLimit:20, dailyLimit:100, monthlyLimit:1000}));
export function parseSkyConfiguration(env: Environment) {
  const selected = selection(env.NIGHTSKY_SKY_PROVIDERS);
  const admitted = selection(env.NIGHTSKY_SKY_ADMITTED_PROVIDERS);
  if (admitted.some(id => !selected.includes(id))) throw Error('Sky source admission requires selection.');
  for (const name of ['NIGHTSKY_NASA_API_KEY','NIGHTSKY_ASTRONOMY_API_APP_ID','NIGHTSKY_ASTRONOMY_API_APP_SECRET']) {
    const value = env[name];
    if (value !== undefined && (!value.length || value.length > 512 || /[\x00-\x20\x7f]/.test(value))) throw Error('Invalid sky credential configuration.');
  }
  return {selected, admitted};
}
export function createConfiguredSkyProviders(env: Environment, options: {quota?: ProviderQuota; fetcher?: typeof fetch; now?:()=>number} = {}) {
  const {selected, admitted} = parseSkyConfiguration(env);
  if (!selected.length) return undefined;
  const enabled = (id:SkyProviderId) => selected.includes(id) && admitted.includes(id) && !!options.quota;
  const common = {quota:options.quota ?? {reserve:async()=>({allowed:false,reason:'Sky source quota is unavailable.'})}, fetcher:options.fetcher, now:options.now, controls:new UpstreamControls({now:options.now??Date.now})};
  const services = {
    darkSky: selected.includes('darkskyplanner') ? createDarkSkyPlannerProvider({...common,enabled:enabled('darkskyplanner')}) : undefined,
    astronomy: selected.includes('astronomyapi') ? createAstronomyApiProvider({...common,enabled:enabled('astronomyapi'),appId:env.NIGHTSKY_ASTRONOMY_API_APP_ID??"",appSecret:env.NIGHTSKY_ASTRONOMY_API_APP_SECRET??""}) : undefined,
    space: selected.some(id=>id==='jpl'||id==='nasa-donki') ? createSpaceProviders({...common,nasaEnabled:enabled('nasa-donki'),jplEnabled:enabled('jpl'),nasaApiKey:env.NIGHTSKY_NASA_API_KEY}) : undefined,
    selected,
  };
  const now=options.now??Date.now;
  if(services.darkSky)services.darkSky.plan=cacheSourceMethod(services.darkSky.plan,now,3600000);
  if(services.astronomy){services.astronomy.searchObjects=cacheSourceMethod(services.astronomy.searchObjects,now,3600000);services.astronomy.bodyPositions=cacheSourceMethod(services.astronomy.bodyPositions,now,3600000);}
  if(services.space){services.space.getSpaceWeather=cacheSourceMethod(services.space.getSpaceWeather,now,300000);services.space.resolveSmallBody=cacheSourceMethod(services.space.resolveSmallBody,now,3600000);services.space.getObserverEphemeris=cacheSourceMethod(services.space.getObserverEphemeris,now,3600000);}
  return services;
}
export type OptionalSkyProviders = NonNullable<ReturnType<typeof createConfiguredSkyProviders>>;
