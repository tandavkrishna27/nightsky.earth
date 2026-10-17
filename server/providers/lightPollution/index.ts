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

async function lookupMany(points:LightPollutionPoint[],provider:LightPollutionProvider,signal?:AbortSignal):Promise<LightPollutionResult[]> {
 const bad=(code:string)=>points.map(p=>unavailable(p,provider,code));
 if(signal?.aborted)return bad('cancelled');
 return new Promise(resolve=>{
 let settled=false;let cancellationGrace:ReturnType<typeof setTimeout>|undefined;const finish=(rows:LightPollutionResult[])=>{if(settled)return;settled=true;if(cancellationGrace)clearTimeout(cancellationGrace);signal?.removeEventListener('abort',abort);resolve(rows);};
 // Cooperative batches return completed rows when aborted. Give them one bounded
 // cleanup interval, then settle ignoring providers without losing responsiveness.
 const abort=()=>{if(!cancellationGrace)cancellationGrace=setTimeout(()=>finish(bad('cancelled')),50);};signal?.addEventListener('abort',abort,{once:true});
 Promise.resolve().then(()=>{if(signal?.aborted)return bad('cancelled');return provider.lookupMany!(points.map(p=>({...p})),signal);}).then(raw=>{
 try{if(!Array.isArray(raw)||raw.length>5){finish(bad('invalid_provider_result'));return;}
 finish(points.map(point=>{try{const matches=raw.filter(row=>row?.candidateId===point.candidateId);if(matches.length!==1)return unavailable(point,provider,'invalid_provider_result');const parsed=lightPollutionResultSchema.safeParse(matches[0]);if(!parsed.success)return unavailable(point,provider,'invalid_provider_result');const r=parsed.data;if(r.sourceId!==provider.sourceId||r.transport!==provider.transport||r.requestedPoint.latitude!==point.latitude||r.requestedPoint.longitude!==point.longitude)return unavailable(point,provider,'invalid_provider_result');return r;}catch{return unavailable(point,provider,'invalid_provider_result');}}));
 }catch{finish(bad('invalid_provider_result'));}
 },()=>finish(bad(signal?.aborted?'cancelled':'provider_error')));
 });
}
/** Keep single-point fan-out within the configured upstream concurrency ceiling.
 * Each queued point still passes through lookup's cancellation check and the
 * provider's durable reservation/rate admission; this never retries a failure. */
async function lookupBounded(points:LightPollutionPoint[],provider:LightPollutionProvider,signal?:AbortSignal):Promise<LightPollutionResult[]> {
 const rows:LightPollutionResult[]=[];
 for(let offset=0;offset<points.length;offset+=4)rows.push(...await Promise.all(points.slice(offset,offset+4).map(point=>lookup(point,provider,signal))));
 return rows;
}
export async function compareLightPollution(points:LightPollutionPoint[],providers:LightPollutionProvider[],signal?:AbortSignal):Promise<{results:LightPollutionResult[]}> {
 const validPoints=lightPollutionPointsSchema.parse(points);
 const unique=new Map<string,LightPollutionProvider>();
 for(const provider of providers){lightPollutionAdapterSchema.parse({sourceId:provider.sourceId,transport:provider.transport});const key=JSON.stringify([provider.sourceId,provider.transport]);if(!unique.has(key))unique.set(key,provider);}
 const coordinateKey=(point:LightPollutionPoint)=>JSON.stringify([point.latitude,point.longitude]);
 const distinct=Array.from(new Map(validPoints.map(p=>[coordinateKey(p),p])).values());
 // Preserve the first candidate identity for each exact coordinate before rebinding duplicates.
 const firstPoints=distinct.map(p=>validPoints.find(v=>coordinateKey(v)===coordinateKey(p))!);
 const work=new Map<LightPollutionProvider,Promise<Map<string,LightPollutionResult>>>();
 for(const provider of Array.from(unique.values())){
 const pending=provider.lookupMany?lookupMany(firstPoints,provider,signal):lookupBounded(firstPoints,provider,signal);
 work.set(provider,pending.then(rows=>new Map(rows.map((row,i)=>[coordinateKey(firstPoints[i]),row]))));
 }
 const results=await Promise.all(validPoints.flatMap(point=>Array.from(unique.values()).map(async provider=>{
 const rows=await work.get(provider)!;const result=rows.get(coordinateKey(point))!;return lightPollutionResultSchema.parse({...result,candidateId:point.candidateId});
 })));
 return {results};
}
