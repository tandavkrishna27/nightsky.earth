import { open, realpath } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, resolve, relative, isAbsolute } from 'node:path';
import * as z from 'zod4';
import { sourceRecordSchema } from '../../shared/nightsky/common';
import { searchObservingLocationsInputSchema, searchObservingLocationsResultSchema, type SearchObservingLocationsInput } from '../../shared/nightsky/places';
import { validatedIndex, haversineKm, toResultCandidate, searchObservingLocations, type OSMCandidateIndex, type SearchPlace } from './osmCandidates';
const boundsSchema=z.strictObject({south:z.number().min(-90).max(90),north:z.number().min(-90).max(90),west:z.number().min(-180).max(180),east:z.number().min(-180).max(180)}).refine(b=>b.south<=b.north&&b.west<=b.east,'Bounds must be ordered (split dateline regions).');
export const regionalOsmManifestSchema=z.strictObject({schemaVersion:z.literal(1),regions:z.array(z.strictObject({id:z.string().regex(/^[a-z0-9-]{1,64}$/),path:z.string().min(1).max(240),sha256:z.string().regex(/^[a-f0-9]{64}$/),bytes:z.number().int().positive().max(4*1024*1024),rows:z.number().int().min(0).max(10000),vintage:z.string().min(1).max(100),coverage:z.string().min(1).max(300),source:sourceRecordSchema,bounds:boundsSchema})).min(1).max(32)});
export type RegionalOsmManifest=z.infer<typeof regionalOsmManifestSchema>;
type Bounds=z.infer<typeof boundsSchema>;
/** Conservative spherical-cap envelope; all longitudes when a cap touches a pole. */
export function regionIntersectsRadius(b:Bounds,lat:number,lon:number,radiusKm:number) {
 const angle=radiusKm/6371.0088, delta=angle*180/Math.PI+1e-9;
 if(b.north<lat-delta||b.south>lat+delta)return false;
 if(lat-delta<=-90||lat+delta>=90)return true;
 const dlon=Math.asin(Math.min(1,Math.sin(angle)/Math.cos(lat*Math.PI/180)))*180/Math.PI+1e-9;
 return [-360,0,360].some(offset=>b.east>=lon-dlon+offset&&b.west<=lon+dlon+offset);
}
export interface RegionalOsmLimits {expectedSha256:string;maxCacheRegions?:number;maxCacheBytes?:number;maxCacheRows?:number;maxQueuedQueries?:number}
async function boundedFile(path:string,max:number,expected:string) {
 const handle=await open(path,'r');
 try { const stat=await handle.stat();if(!stat.isFile()||stat.size>max)throw new RangeError('Regional artifact byte limit exceeded.');
 const buffer=Buffer.alloc(max+1);let n=0;
 while(n<buffer.length){const r=await handle.read(buffer,n,buffer.length-n,null);if(!r.bytesRead)break;n+=r.bytesRead;}
 if(n>max)throw new RangeError('Regional artifact byte limit exceeded.');
 const bytes=buffer.subarray(0,n);if(createHash('sha256').update(bytes).digest('hex')!==expected)throw new TypeError('Regional artifact checksum mismatch.');return bytes;
 }finally{await handle.close();}
}
export async function loadRegionalOsmProvider(path:string,options:RegionalOsmLimits) {
 if(!/^[a-f0-9]{64}$/i.test(options.expectedSha256))throw new TypeError('Reviewed manifest checksum required.');
 const canonical=await realpath(path), root=dirname(canonical);
 const manifest=regionalOsmManifestSchema.parse(JSON.parse((await boundedFile(canonical,256*1024,options.expectedSha256.toLowerCase())).toString('utf8')));
 if(manifest.regions.reduce((n,r)=>n+r.rows,0)>100000)throw new RangeError('Aggregate regional row budget exceeded.');
 const ids=new Set<string>(),paths=new Set<string>();
 for(const r of manifest.regions){if(ids.has(r.id)||paths.has(r.path))throw new TypeError('Duplicate manifest region or path.');ids.add(r.id);paths.add(r.path);
 if(isAbsolute(r.path)||r.path.includes('\\')||r.path.split('/').some(p=>p==='..'||p==='.'||!p)||r.path.includes(':'))throw new TypeError('Regional artifact path must remain within manifest directory.');
 Object.freeze(r.bounds);Object.freeze(r.source);Object.freeze(r);}
 Object.freeze(manifest.regions);Object.freeze(manifest);
 const maxRegions=options.maxCacheRegions??2,maxBytes=options.maxCacheBytes??8*1024*1024,maxRows=options.maxCacheRows??20000,maxQueue=options.maxQueuedQueries??8;
 for(const [n,ceiling] of [[maxRegions,32],[maxBytes,128*1024*1024],[maxRows,100000],[maxQueue,64]])if(!Number.isSafeInteger(n)||n<1||n>ceiling)throw new RangeError('Invalid regional cache/query limit.');
 if(manifest.regions.some(r=>r.bytes>maxBytes||r.rows>maxRows))throw new RangeError('A manifest region exceeds resident cache bounds.');
 const cache=new Map<string,OSMCandidateIndex>();let bytes=0,rows=0,loads=0,evictions=0,queued=0;let tail:Promise<unknown>=Promise.resolve();
 const stats=()=>({residentRegions:Array.from(cache.keys()),residentBytes:bytes,residentRows:rows,loads,evictions,queuedQueries:queued,maxConcurrentLoads:1});
 async function load(r:RegionalOsmManifest['regions'][number]){
  const old=cache.get(r.id);if(old){cache.delete(r.id);cache.set(r.id,old);return old;}
  while(cache.size>=maxRegions||bytes+r.bytes>maxBytes||rows+r.rows>maxRows){const id=cache.keys().next().value!;cache.delete(id);const evicted=manifest.regions.find(x=>x.id===id)!;bytes-=evicted.bytes;rows-=evicted.rows;evictions++;}
  const target=await realpath(resolve(root,r.path));const rel=relative(root,target);if(rel.startsWith('..')||isAbsolute(rel))throw new TypeError('Regional artifact escapes manifest directory.');
  // Validate exact byte count on the same bounded/checksummed read before parsing.
  const payload=await boundedFile(target,r.bytes,r.sha256);if(payload.length!==r.bytes)throw new TypeError('Regional artifact byte count mismatch.');
  const value=JSON.parse(payload.toString('utf8')) as OSMCandidateIndex;
  if(!Array.isArray(value.candidates)||value.candidates.length!==r.rows)throw new TypeError('Regional artifact row count mismatch.');
  const index=validatedIndex(value);
  if(index.source.vintage!==index.vintage)throw new TypeError('Regional source vintage must match artifact vintage.');
  const unique=new Set<string>();for(const c of index.candidates){const key=c.osmType+'/'+c.osmId;if(!Number.isSafeInteger(c.osmId)||unique.has(key))throw new TypeError('Invalid or duplicate regional identity.');unique.add(key);}
  if(index.vintage!==r.vintage||index.coverage!==r.coverage||JSON.stringify(index.source)!==JSON.stringify(r.source))throw new TypeError('Regional artifact source/vintage/coverage mismatch.');
  if(value.candidates.some(c=>c.latitude<r.bounds.south||c.latitude>r.bounds.north||c.longitude<r.bounds.west||c.longitude>r.bounds.east))throw new TypeError('Candidate outside manifest point bounds.');
  // Existing loader supplies strict validation, freezing and latitude bands.
  cache.set(r.id,index);bytes+=r.bytes;rows+=r.rows;loads++;return index;
 }
 async function perform(inputValue:SearchObservingLocationsInput,opts:{place?:SearchPlace}){
  const input=searchObservingLocationsInputSchema.parse(inputValue),p=opts.place;
  if(!p||p.placeId!==input.placeId)return searchObservingLocations(input,{place:p});
  if(!Number.isFinite(p.latitude)||Math.abs(p.latitude)>90||!Number.isFinite(p.longitude)||Math.abs(p.longitude)>180)throw new TypeError('Invalid resolved place coordinates.');
  const selected=manifest.regions.filter(r=>regionIntersectsRadius(r.bounds,p.latitude,p.longitude,input.radiusKm));
  const identities=new Map<string,string>();const candidates=new Map<string,{candidate:ReturnType<typeof toResultCandidate>;distance:number;completeness:number;id:number;type:string}>();const sources=[];
  for(const r of selected){const index=await load(r);sources.push(index.source);
   for(const row of index.candidates){const id=`${row.osmType}/${row.osmId}`,signature=JSON.stringify(row);if(identities.has(id)&&identities.get(id)!==signature)throw new TypeError(`Cross-region identity conflict: ${id}`);identities.set(id,signature);}
   for(const row of index.candidates){if(input.categories&&!input.categories.includes(row.category))continue;const distance=haversineKm(p.latitude,p.longitude,row.latitude,row.longitude);if(distance>input.radiusKm)continue;const c=toResultCandidate(row,index.vintage,distance,index.source);const old=candidates.get(c.placeId);if(old){for(const s of c.sources)if(!old.candidate.sources.some(x=>JSON.stringify(x)===JSON.stringify(s))) {if(old.candidate.sources.length>=4)throw new RangeError('Duplicate provenance exceeds candidate source limit.');old.candidate.sources.push(s);}}else candidates.set(c.placeId,{candidate:c,distance,completeness:row.sourceCompleteness,id:row.osmId,type:row.osmType});}
  }
  const order=new Map((input.categories??[]).map((c,i)=>[c,i]));
  const sorted=Array.from(candidates.values()).sort((a,b)=>(input.categories?order.get(a.candidate.category)!-order.get(b.candidate.category)!:0)||a.distance-b.distance||b.completeness-a.completeness||a.id-b.id||a.type.localeCompare(b.type)).slice(0,input.limit).map(x=>x.candidate);
  return searchObservingLocationsResultSchema.parse({availability:{status:sorted.length?'partial':'not-covered',reason:sorted.length?'Regional OSM candidate features found; access and darkness are unknown.':'No indexed features found; installed regional coverage has gaps.'},sources:sources.length?sources:[manifest.regions[0].source],candidates:sorted,sortBasis:input.categories?'requested-category-then-distance':'distance-then-source-completeness',coverage:'Partial installed regional point extracts; geographic bounds route candidates and do not establish complete coverage or polygon membership.',caveats:['Installed regions have gaps; absence of indexed candidates does not establish absence of suitable places.','Each candidate retains its region vintage. Access, night entry, safety and darkness are unverified.']});
 }
 return {manifest,stats,search(input:SearchObservingLocationsInput,opts:{place?:SearchPlace}={}){if(queued>=maxQueue)return Promise.reject(new RangeError('Regional query concurrency limit exceeded.'));queued++;const result=tail.then(()=>perform(input,opts));tail=result.catch(()=>undefined);return result.finally(()=>{queued--;});}};
}
export type RegionalOsmProvider=Awaited<ReturnType<typeof loadRegionalOsmProvider>>;
