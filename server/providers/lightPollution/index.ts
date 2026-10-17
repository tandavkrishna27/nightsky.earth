import { lightPollutionAdapterSchema, lightPollutionPointsSchema, lightPollutionResultSchema, type LightPollutionPoint, type LightPollutionProvider, type LightPollutionResult } from '../../../shared/nightsky/lightPollution';
export type { LightPollutionProvider } from '../../../shared/nightsky/lightPollution';
function unavailable(point:LightPollutionPoint,provider:LightPollutionProvider,errorCode:string):LightPollutionResult {
 return {candidateId:point.candidateId,sourceId:provider.sourceId,transport:provider.transport,status:'unavailable',requestedPoint:{latitude:point.latitude,longitude:point.longitude},observedPoint:null,coordinateBinding:'unverified',retrievedAt:new Date().toISOString(),dataset:{label:null,id:null,year:null,month:null},sqm:null,unit:'mag/arcsec2',bortleClasses:null,quality:{coverage:'unknown',notes:[],assessments:[]},attribution:provider.sourceId,sourceUrl:provider.sourceId==='darkskysites'?'https://darkskysites.com':'https://www.lightpollutionmap.info',limitations:['No usable provider evidence was returned.'],errorCode};
}
async function lookup(point:LightPollutionPoint,provider:LightPollutionProvider,signal?:AbortSignal):Promise<LightPollutionResult> {
 if(signal?.aborted)return unavailable(point,provider,'cancelled');
 return new Promise(resolve=>{
 let settled=false;
 const finish=(value:LightPollutionResult)=>{if(settled)return;settled=true;signal?.removeEventListener('abort',abort);resolve(value);};
 const abort=()=>finish(unavailable(point,provider,'cancelled'));
 signal?.addEventListener('abort',abort,{once:true});
 // Start in a microtask so an abort between scheduling and dispatch cannot send traffic.
 Promise.resolve().then(()=>{if(signal?.aborted)return unavailable(point,provider,'cancelled');return provider.lookup({...point},signal);}).then(raw=>{
 try {
 const parsed=lightPollutionResultSchema.safeParse(raw);
 if(!parsed.success){finish(unavailable(point,provider,'invalid_provider_result'));return;}
 const r=parsed.data;
 if(r.sourceId!==provider.sourceId||r.transport!==provider.transport||r.candidateId!==point.candidateId||r.requestedPoint.latitude!==point.latitude||r.requestedPoint.longitude!==point.longitude){finish(unavailable(point,provider,'invalid_provider_result'));return;}
 finish(r);
 } catch {finish(unavailable(point,provider,'invalid_provider_result'));}
 },()=>finish(unavailable(point,provider,signal?.aborted?'cancelled':'provider_error')));
 });
}
export async function compareLightPollution(points:LightPollutionPoint[],providers:LightPollutionProvider[],signal?:AbortSignal):Promise<{results:LightPollutionResult[]}> {
 const validPoints=lightPollutionPointsSchema.parse(points);
 const unique=new Map<string,LightPollutionProvider>();
 for(const provider of providers){lightPollutionAdapterSchema.parse({sourceId:provider.sourceId,transport:provider.transport});const key=JSON.stringify([provider.sourceId,provider.transport]);if(!unique.has(key))unique.set(key,provider);}
 const work=new Map<string,Promise<LightPollutionResult>>();
 const results=await Promise.all(validPoints.flatMap(point=>Array.from(unique.values()).map(provider=>{
 const key=JSON.stringify([provider.sourceId,provider.transport,point.latitude,point.longitude]);
 let pending=work.get(key);if(!pending){pending=lookup(point,provider,signal);work.set(key,pending);}
 return pending.then(result=>lightPollutionResultSchema.parse({...result,candidateId:point.candidateId}));
 })));
 return {results};
}

