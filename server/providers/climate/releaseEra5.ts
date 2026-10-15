/** Explicit, checksum pinned release index. Each shard retains the existing ten tile publisher contract. */
import {createHash} from 'node:crypto';
import {lstat,realpath} from 'node:fs/promises';
import {dirname,resolve,isAbsolute,relative,sep} from 'node:path';
import * as z from 'zod4';
import {createTiledEra5ClimateProvider,readTrustedClimateFile,tiledEra5ManifestSchema,validateTiledEra5Manifest,type TiledEra5Manifest} from './tiledEra5';
import type {Era5ClimateProviderOptions} from './era5';
import {createCatalogEra5ClimateProvider} from './catalogEra5';
const MiB=1024*1024;
const digest=z.string().regex(/^[a-f0-9]{64}$/);
export const releaseEra5Schema=z.strictObject({schemaVersion:z.literal(3),releaseId:digest,metadata:tiledEra5ManifestSchema.omit({tiles:true}),coverage:z.literal('explicit-cell-timezone-pairs; missing-is-unknown'),shards:z.array(z.strictObject({path:z.string().min(1).max(300),sha256:digest,bytes:z.number().int().min(1).max(4*MiB),sourceRevisions:tiledEra5ManifestSchema.shape.sourceRevisions,keys:z.array(z.string().min(1).max(150)).min(1).max(10)})).min(1).max(1000)});
export type Era5Release=z.infer<typeof releaseEra5Schema>;
export function releaseMetadata(manifest:TiledEra5Manifest){const {tiles,...metadata}=manifest;return metadata;}
export function sharedReleaseMetadata(manifest: ReturnType<typeof releaseMetadata>){const {sourceRevisions,...shared}=manifest;return shared;}
export function mergeReleaseRevisions(groups:TiledEra5Manifest['sourceRevisions'][]){
 const merged=new Map<string,TiledEra5Manifest['sourceRevisions'][number]>();
 for(const rows of groups)for(const row of rows){const key=row.kind+'|'+row.revision;const prior=merged.get(key);if(prior&&prior.sha256!==row.sha256)throw Error('Conflicting source revision lineage');merged.set(key,row);if(merged.size>10000)throw Error('Source revision union bound');}
 return Array.from(merged.values()).sort((a,b)=>(a.kind+'|'+a.revision).localeCompare(b.kind+'|'+b.revision,'en'));
}
export function canonicalRelease(value:unknown):string {if(Array.isArray(value))return '['+value.map(canonicalRelease).join(',')+']';if(value&&typeof value==='object')return '{'+Object.entries(value).sort(([a],[b])=>a.localeCompare(b,'en')).map(([key,v])=>JSON.stringify(key)+':'+canonicalRelease(v)).join(',')+'}';return JSON.stringify(value);}
export const releaseSha=(bytes:Buffer|string)=>createHash('sha256').update(bytes).digest('hex');
export async function releasePath(root:string,path:string){if(isAbsolute(path)||path.includes('\\')||path.includes(':')||path.split('/').some(p=>!p||p==='.'||p==='..'))throw Error('Release path');const base=await realpath(root);if(resolve(base)!==resolve(root))throw Error('Release root symlink');const target=resolve(base,path),rel=relative(base,target);if(!rel||rel==='..'||rel.startsWith('..'+sep)||isAbsolute(rel))throw Error('Release boundary');let cursor=base;for(const part of path.split('/')){cursor=resolve(cursor,part);if((await lstat(cursor)).isSymbolicLink())throw Error('Release symlink');}if(resolve(await realpath(target))!==target)throw Error('Release alias');return target;}
export function validateRelease(data:Era5Release){const keys=new Set<string>(),paths=new Set<string>();for(const shard of data.shards){if(paths.has(shard.path))throw Error('Duplicate shard');paths.add(shard.path);if(isAbsolute(shard.path)||shard.path.includes('\\')||shard.path.includes(':')||shard.path.split('/').some(p=>!p||p==='.'||p==='..'))throw Error('Release path');for(const key of shard.keys){if(keys.has(key))throw Error('Duplicate coverage');keys.add(key);}}validateTiledEra5Manifest({...data.metadata,tiles:[]});if(canonicalRelease(mergeReleaseRevisions(data.shards.map(s=>s.sourceRevisions)))!==canonicalRelease(data.metadata.sourceRevisions))throw Error('Release source union mismatch');}
export interface ReleaseEra5Options extends Era5ClimateProviderOptions {maxManifestBytes?:number;maxShardCacheEntries?:number;onTileRead?:(key:string)=>void|Promise<void>}
export function createReleaseEra5ClimateProvider(options:ReleaseEra5Options){
 return createCatalogEra5ClimateProvider(options,createLeafReleaseEra5ClimateProvider);
}
export function createLeafReleaseEra5ClimateProvider(options:ReleaseEra5Options){
 const slots=options.maxShardCacheEntries??2,budget=options.maxCacheBytes??32*MiB,manifestLimit=options.maxManifestBytes??4*MiB;
 if(!Number.isInteger(slots)||slots<1||slots>8||!Number.isInteger(budget)||budget<slots||budget>32*MiB||!Number.isInteger(manifestLimit)||manifestLimit<1||manifestLimit>4*MiB)throw Error('Release cache bounds');
 type Provider=ReturnType<typeof createTiledEra5ClimateProvider>;
 let root:Promise<Era5Release>|undefined;const cache=new Map<string,Provider>();let serial:Promise<unknown>=Promise.resolve();let queued=0;
 const load=()=>root??=(async()=>{if(!options.artifactPath||!options.expectedSha256)throw Error('Unpinned release');const data=releaseEra5Schema.parse(JSON.parse((await readTrustedClimateFile(options.artifactPath,options.expectedSha256,manifestLimit,options.onRead)).toString('utf8')));validateRelease(data);if(data.metadata.placeIndexVintage!==options.index.vintageLabel)throw Error('Release index vintage');return data;})();

 async function unavailable(placeId:string,month:number){return createTiledEra5ClimateProvider({...options,artifactPath:undefined,expectedSha256:undefined}).getClimatology(placeId,month);}
 async function shardProvider(data:Era5Release,shard:Era5Release['shards'][number]):Promise<Provider>{
  const cached=cache.get(shard.path);
  if(cached){cache.delete(shard.path);cache.set(shard.path,cached);return cached;}
  const path=await releasePath(dirname(options.artifactPath!),shard.path);
  const bytes=await readTrustedClimateFile(path,shard.sha256,shard.bytes,options.onRead);
  if(bytes.length!==shard.bytes)throw Error('Shard bytes');
  const manifest=tiledEra5ManifestSchema.parse(JSON.parse(bytes.toString('utf8')));
  validateTiledEra5Manifest(manifest,options.index.vintageLabel);
  if(manifest.tiles.length>10||canonicalRelease(sharedReleaseMetadata(releaseMetadata(manifest)))!==canonicalRelease(sharedReleaseMetadata(data.metadata))||canonicalRelease(manifest.sourceRevisions)!==canonicalRelease(shard.sourceRevisions)||canonicalRelease(manifest.tiles.map(t=>t.key).sort())!==canonicalRelease([...shard.keys].sort()))throw Error('Shard coherence');
  const provider=createTiledEra5ClimateProvider({...options,artifactPath:path,expectedSha256:shard.sha256,manifestBytes:bytes,maxCacheBytes:Math.floor(budget/slots)});
  while(cache.size>=slots)cache.delete(cache.keys().next().value!);
  cache.set(shard.path,provider);return provider;
 }
 async function lookup(placeId:string,month:number){
  try{
   const data=await load();const city=options.index.getById(Number(placeId.split(':').at(-1)));
   const {suppliedCellKey}=await import('./tiledEra5');
   const key=city?suppliedCellKey(city.latitude,city.longitude,city.timeZone):'';
   const shard=data.shards.find(s=>s.keys.includes(key));
   if(!shard){const result=await unavailable(placeId,month);return {...result,period:data.metadata.period,sources:[data.metadata.sourceProvenance],caveats:data.metadata.caveats,availability:{status:'not-covered' as const,reason:'No verified supplied cell/timezone pair covers this named place.'}};}
   return (await shardProvider(data,shard)).getClimatology(placeId,month);
  }catch{return unavailable(placeId,month);}
 }
 return {
  inspectCache(){return {shards:cache.size,bytes:Array.from(cache.values()).reduce((sum,p)=>sum+p.inspectCache().bytes,0)};},
  async getClimatology(placeId:string,month:number){
   if(queued>=16)return unavailable(placeId,month);
   queued++;
   const pending=serial.then(()=>lookup(placeId,month),()=>lookup(placeId,month));
   serial=pending.then(()=>undefined,()=>undefined);
   return pending.finally(()=>{queued--;});
  }
 };
}
