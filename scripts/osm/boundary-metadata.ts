import {boundaryShards,shardGeometry} from './partitioned-boundaries';
import {open,lstat,mkdir,rename,realpath} from 'node:fs/promises';
import {resolve,dirname,parse,join,isAbsolute} from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import * as z from 'zod4';
import {catalogueCandidateSchema} from '../../server/places/catalogueFormat';
import {catalogueRevisionSchema,regionRefSchema,type RegionRef} from '../../shared/nightsky/discovery';
import {jsonlRows,partitionedMembershipInputIdentitySchema,partitionedMembershipCompletionSchema,partitionedMembershipCompletionV3Schema,MAX_MEMBERSHIP_OUTPUT_V3,type PartitionedMembershipCompletion,type PartitionedMembershipCompletionV3} from './build-source-catalogue';
import {boundaries,contains,isUnresolved,type Point} from './geographic-geometry';
import {writePartitionedFamily,partitionCanonical,parsePartitionJson,type SharedPartitionBudget} from './partitioned-candidates';
import {resourceCheckpoint,resourceSnapshotV3,reserveValidationRead,completeValidationRead,geometryOperation,recordWrite,type ResourceSessionV3} from './partitioned-resources';
type Boundary=ReturnType<typeof boundaries>[number];
type BoundaryBox={west:number;east:number;south:number;north:number};
function boundaryBox(boundary:Boundary,tick:()=>void):BoundaryBox{
 tick();
 let west=Infinity,east=-Infinity,south=Infinity,north=-Infinity;
 for(const polygon of boundary.polygons)for(const ring of polygon)for(const [x,y] of ring){tick();west=Math.min(west,x);east=Math.max(east,x);south=Math.min(south,y);north=Math.max(north,y);}
 return {west,east,south,north};
}
const outsideBox=(point:Point,box:BoundaryBox)=>point[0]<box.west-1e-10||point[0]>box.east+1e-10||point[1]<box.south-1e-10||point[1]>box.north+1e-10;
/** Conservative broad phase only: retain the exact classifier and its 1e-10 border tolerance. */
export function boundedContains(boundary:Boundary,tick:()=>void){
 const box=boundaryBox(boundary,tick);
 return (point:Point)=>{tick();return outsideBox(point,box)?0:contains(point,boundary,tick);};
}
type BoundaryEntry={index:number;b:Boundary;box:BoundaryBox};
type BoundaryTree={box:BoundaryBox}&({entries:BoundaryEntry[]}|{left:BoundaryTree;right:BoundaryTree});
/** Balanced static BVH: O(N) retained entries/nodes, O(log N) depth.
 * Repeated median sorting costs O(N log² N), metered before allocations and
 * comparisons. Overlapping/world-spanning boxes can still require O(N) queries.
 * Descendant arrays live only at leaves; no grid or duplicated geometry exists.
 */
export function indexedBoundaryContains(geometry:Boundary[],tick:()=>void){
 tick();const entries:BoundaryEntry[]=[];
 for(let index=0;index<geometry.length;index++){
  const box=boundaryBox(geometry[index],tick);tick();entries.push({index,b:geometry[index],box});
 }
 function build(items:BoundaryEntry[]):BoundaryTree{
  tick();const box={...items[0].box};
  for(const item of items){tick();box.west=Math.min(box.west,item.box.west);box.east=Math.max(box.east,item.box.east);box.south=Math.min(box.south,item.box.south);box.north=Math.max(box.north,item.box.north);}
  if(items.length<=8){tick();return {box,entries:items};}
  const x=box.east-box.west>=box.north-box.south;
  items.sort((a,b)=>{tick();return (x?(a.box.west+a.box.east)-(b.box.west+b.box.east):(a.box.south+a.box.north)-(b.box.south+b.box.north))||a.index-b.index;});
  const middle=Math.floor(items.length/2);
  tick();const leftItems=items.slice(0,middle);
  const left=build(leftItems);
  tick();const rightItems=items.slice(middle);
  const right=build(rightItems);
  tick();return {box,left,right};
 }
 const root=entries.length?build(entries):undefined;
 return (point:Point)=>{
  tick();if(!Number.isFinite(point[0])||!Number.isFinite(point[1]))throw new TypeError('Finite boundary query required');
  tick();const hits:{index:number;b:Boundary;status:number}[]=[];
  function visit(node:BoundaryTree){
   tick();if(outsideBox(point,node.box))return;
   if('entries' in node){
    for(const entry of node.entries){
     tick();if(outsideBox(point,entry.box))continue;
     const status=contains(point,entry.b,tick);
     if(status!==0){tick();hits.push({index:entry.index,b:entry.b,status});}
    }
   }else{visit(node.left);visit(node.right);}
  }
  if(root)visit(root);
  hits.sort((a,b)=>{tick();return a.index-b.index;});
  return hits;
 };
}
const pinSchema=z.strictObject({path:z.string().min(1).max(240).refine(p=>!isAbsolute(p)&&!p.includes(':')&&!p.includes('\\')&&p.split('/').every(s=>s!=='.'&&s!=='..'&&!!s),'Unsafe relative path'),bytes:z.number().int().min(0).max(128*1024*1024),sha256:z.string().regex(/^[a-f0-9]{64}$/)});
const descriptorSchema=z.union([z.strictObject({schemaVersion:z.literal(1),catalogueRevision:catalogueRevisionSchema,boundaries:pinSchema,candidates:pinSchema}),z.strictObject({schemaVersion:z.literal(2),catalogueRevision:catalogueRevisionSchema,boundaries:boundaryShards,candidates:pinSchema}),z.strictObject({schemaVersion:z.literal(3),catalogueRevision:catalogueRevisionSchema,boundaries:boundaryShards})]);
export interface BoundaryLimits {maxBoundaryBytes?:number;maxVertices?:number;maxTotalVertices?:number;maxMilliseconds?:number;maxComparisons?:number;maxRows?:number;maxOutputBytes?:number;maxGeometryComparisons?:number;signal?:AbortSignal}
async function safe(path:string){if(path.split(/[\\/]/).includes('..'))throw new TypeError('Path traversal refused');const absolute=resolve(path);let cursor=parse(absolute).root;for(const part of absolute.slice(cursor.length).split(/[\\/]/).filter(Boolean)){cursor=join(cursor,part);if((await lstat(cursor)).isSymbolicLink())throw new TypeError('Symlink path refused');}return absolute;}
async function bytes(path:string,max:number,pin?:z.infer<typeof pinSchema>,tick=()=>{},metadata?:SharedPartitionBudget['metadata'],resources?:ResourceSessionV3){
 tick();const absolute=await safe(path),h=await open(absolute,'r');
 try{
  const before=await h.stat();if(!before.isFile()||before.size>max||pin&&pin.bytes!==before.size)throw new RangeError('Input size/pin limit');
  if(metadata){
   if(!Number.isSafeInteger(metadata.bytes)||!Number.isSafeInteger(metadata.ceiling)||metadata.bytes<0||metadata.ceiling<1||metadata.ceiling>32*1024**2||metadata.bytes>metadata.ceiling||!(metadata.paths instanceof Map))throw new Error('Shared metadata byte budget');
   const canonical=await realpath(absolute),previous=metadata.paths.get(canonical);
   if(previous!==undefined&&previous!==before.size)throw new Error('Shared metadata size mutation');
   if(previous===undefined){const next=metadata.bytes+before.size;if(!Number.isSafeInteger(next)||next>metadata.ceiling)throw new Error('Shared metadata byte budget');metadata.bytes=next;metadata.paths.set(canonical,before.size);}
  }
  if(resources){const reservation=reserveValidationRead(resources,before.size);completeValidationRead(reservation,0);}
  const b=Buffer.alloc(before.size);let n=0;while(n<b.length){tick();const length=Math.min(65536,b.length-n),reservation=resources?reserveValidationRead(resources,length):undefined;let actual=0;try{actual=(await h.read(b,n,length,null)).bytesRead;}finally{if(reservation)completeValidationRead(reservation,actual);}const r={bytesRead:actual};if(!r.bytesRead)throw new Error('Input mutation');n+=r.bytesRead;}
  const after=await h.stat(),linked=await lstat(await safe(path));if(before.dev!==after.dev||before.ino!==after.ino||before.size!==after.size||before.mtimeMs!==after.mtimeMs||before.ctimeMs!==after.ctimeMs||after.dev!==linked.dev||after.ino!==linked.ino||after.size!==linked.size||after.mtimeMs!==linked.mtimeMs)throw new Error('Input mutation');
  const probe=resources?reserveValidationRead(resources,1):undefined;let extra=0;try{extra=(await h.read(Buffer.alloc(1),0,1,null)).bytesRead;}finally{if(probe)completeValidationRead(probe,extra);}if(extra)throw new Error('Input grew');if(pin&&createHash('sha256').update(b).digest('hex')!==pin.sha256)throw new Error('Input checksum mismatch');tick();return b;
 }finally{await h.close();}
}
async function createBoundarySession(input:string,limits:BoundaryLimits,partitioned=false,shared?:SharedPartitionBudget,resources?:ResourceSessionV3){
 const {maxBoundaryBytes=16*1024*1024,maxVertices=100000,maxComparisons=10000000,maxRows=100000,maxOutputBytes=128*1024*1024,signal}=limits;
 if(resources&&(limits.maxRows===undefined||limits.maxOutputBytes===undefined||limits.maxGeometryComparisons===undefined||limits.maxMilliseconds===undefined||limits.maxComparisons!==undefined))throw new Error('Explicit v3 membership resource limits required');
 if(!resources&&limits.maxGeometryComparisons!==undefined)throw new Error('V3 geometry limits require the versioned resource envelope');
 for(const [n,ceiling] of [[maxBoundaryBytes,64*1024*1024],[maxVertices,1000000],[maxComparisons,200000000],[maxRows,resources?10000000:1000000],[maxOutputBytes,resources?MAX_MEMBERSHIP_OUTPUT_V3:1024*1024*1024]])if(!Number.isSafeInteger(n)||n<1||n>ceiling)throw new RangeError('Unsupported budget');
 const maxTotalVertices=limits.maxTotalVertices??maxVertices,maxMilliseconds=limits.maxMilliseconds??60000;if(!Number.isSafeInteger(maxTotalVertices)||maxTotalVertices<1||maxTotalVertices>2000000||!Number.isSafeInteger(maxMilliseconds)||maxMilliseconds<1||maxMilliseconds>1800000)throw new Error('Unsupported aggregate/deadline budget');const start=Date.now();
 let work=0;
 if(shared){for(const n of [shared.bytes,shared.rows,shared.work])if(!Number.isSafeInteger(n)||n<0)throw new Error('Invalid shared membership accounting');for(const n of [shared.maxBytes,shared.maxRows,shared.maxWork,shared.deadline])if(!Number.isSafeInteger(n)||n<1)throw new Error('Explicit shared membership budget required');if(shared.work>shared.maxWork||shared.bytes>shared.maxBytes||shared.rows>shared.maxRows)throw new Error('Shared membership budget exhausted');if(!resources){shared.maxWork=Math.min(shared.maxWork,maxComparisons);shared.deadline=Math.min(shared.deadline,start+maxMilliseconds);shared.metadata??={bytes:0,ceiling:32*1024**2,paths:new Map()};}}
 if(resources){resourceCheckpoint(resources);if(!shared||shared.resourceSession!==resources||shared.accounting!=='read'||shared.deadline!==resources.deadline||resources.limits.maxMilliseconds!==maxMilliseconds||resources.limits.maxGeometryComparisons!==limits.maxGeometryComparisons||shared.metadata&&shared.metadata!==resources.metadata)throw new Error('Same original v3 membership resource session required');shared.metadata=resources.metadata;}
 const tick=()=>{signal?.throwIfAborted();shared?.signal?.throwIfAborted();if(resources){resourceCheckpoint(resources);return;}if(Date.now()>=(shared?.deadline??start+maxMilliseconds))throw new Error('Deadline budget');const next=(shared?.work??work)+1;if(next>(shared?.maxWork??maxComparisons))throw new RangeError('Comparison budget');if(shared)shared.work=next;else work=next;};
 const geometryTick=()=>{signal?.throwIfAborted();shared?.signal?.throwIfAborted();if(resources)geometryOperation(resources);else tick();};tick();
 const decode=(body:Buffer)=>resources?parsePartitionJson(body,shared!):JSON.parse(new TextDecoder('utf8',{fatal:true}).decode(body));
 const path=await safe(input),descriptorBytes=await bytes(path,1024*1024,undefined,tick,shared?.metadata,resources),manifest=descriptorSchema.parse(decode(descriptorBytes));const base=dirname(path);
 if((manifest.schemaVersion===3)!==partitioned)throw new Error('Partitioned descriptor requires an internal complete-stream source');
 const specs=manifest.schemaVersion!==1?manifest.boundaries:[{input:manifest.boundaries,regionIds:undefined,unresolvedBoundaryIds:undefined}];if(manifest.schemaVersion===1&&maxTotalVertices!==maxVertices)throw new Error('Aggregate override requires shards');
 const geometry:ReturnType<typeof boundaries>=[],seen=new Set<string>();let totalBoundaryBytes=0,totalVertices=0;
 for(const spec of specs){tick();totalBoundaryBytes+=spec.input.bytes;if(totalBoundaryBytes>maxBoundaryBytes)throw new Error('Aggregate boundary byte budget');const raw=decode(await bytes(join(base,spec.input.path),maxBoundaryBytes,spec.input,tick,undefined,resources));const result=spec.regionIds?shardGeometry(raw,spec.regionIds,seen,maxVertices,geometryTick,spec.unresolvedBoundaryIds):{parsed:boundaries(raw,maxVertices,geometryTick),vertices:0};if(spec.regionIds){totalVertices+=result.vertices;if(totalVertices>maxTotalVertices)throw new Error('Aggregate vertex budget');}geometry.push(...result.parsed);}
 const classify=indexedBoundaryContains(geometry,geometryTick);
 function enrich(raw:unknown){tick();const row=catalogueCandidateSchema.parse(raw);if(row.catalogueRevision!==manifest.catalogueRevision)throw new Error('Candidate revision mismatch');const matches=classify([row.longitude,row.latitude]);const countries=matches.filter(x=>x.b.region.adminLevel===0&&x.status!==0),states=matches.filter(x=>x.b.region.adminLevel===1&&x.status!==0);const country=countries.length===1&&countries[0].status===1&&!isUnresolved(countries[0].b.region)?countries[0].b.region:undefined;const state=country&&states.length===1&&states[0].status===1&&!isUnresolved(states[0].b.region)&&states[0].b.region.countryCode===country.countryCode?states[0].b.region:undefined;const ids=country?[country.regionId,...(state?[state.regionId]:[])]:[];if(row.countryCode!==undefined&&row.countryCode!==country?.countryCode||row.regionIds.some(id=>!ids.includes(id)))throw new Error('Conflicting claimed membership');const {countryCode:_old,regionIds:_ids,...facts}=row;return {...facts,...(country?{countryCode:country.countryCode}:{}),regionIds:ids};}
 async function revalidate(){if(!(await bytes(path,1024*1024,undefined,tick,shared?.metadata,resources)).equals(descriptorBytes))throw new Error('Descriptor mutation');for(const spec of specs){tick();await bytes(join(base,spec.input.path),maxBoundaryBytes,spec.input,tick,undefined,resources);}}
 return {manifest,geometry,base,tick,enrich,revalidate,maxRows,maxOutputBytes,start,deadline:shared?.deadline??start+maxMilliseconds,get work(){return shared?.work??work;}};
}
export async function buildBoundaryMetadata(input:string,output:string,limits:BoundaryLimits={}){
 const {manifest,geometry,base,tick,enrich,revalidate,maxRows,maxOutputBytes}=await createBoundarySession(input,limits);
 if(manifest.schemaVersion===3)throw new Error('Partitioned descriptor requires an internal complete-stream source');
 const candidateInput=manifest.candidates;
 const signal=limits.signal;
 // Complete input hash validation occurs again while streaming; no completion marker on failure.
 const out=resolve(output);if(output.split(/[\\/]/).includes('..'))throw new Error('Output traversal refused');await safe(dirname(out));await mkdir(out);
 const files:Record<string,{bytes:number;sha256:string}>={};let written=0;async function write(name:string,rows:AsyncIterable<unknown>|Iterable<unknown>){const h=await open(join(out,name),'wx'),hash=createHash('sha256');let count=0;try{for await(const row of rows){tick();const b=Buffer.from(JSON.stringify(row)+'\n');written+=b.length;if(written>maxOutputBytes||b.length>65536)throw new RangeError('Output byte/row budget');await h.writeFile(b);hash.update(b);count+=b.length;}}finally{await h.close();}files[name]={bytes:count,sha256:hash.digest('hex')};}
 let unknown=0,total=0;
 async function* candidates(){for await(const raw of jsonlRows(join(base,candidateInput.path),{pin:candidateInput,maxRows,maxBytes:128*1024*1024,signal})){const row=enrich(raw);total++;if(!row.countryCode)unknown++;yield row;}}
 await write('candidates.jsonl',candidates());await write('regions.jsonl',geometry.filter(b=>!isUnresolved(b.region)).map(b=>b.region));await write('footprints.jsonl',[]);
 await revalidate();const done={schemaVersion:1,catalogueRevision:manifest.catalogueRevision,files,coverage:'unknown; administrative boundaries do not establish candidate source coverage',membershipPolicy:'unique-strict-interior; conflicting claims rejected; missing or ambiguous membership unknown',boundaryInput:manifest.boundaries,candidateInput:manifest.candidates,totalCandidates:total,unknownCountryCandidates:unknown};const completion=JSON.stringify(done)+'\n';if(written+Buffer.byteLength(completion)>maxOutputBytes)throw new RangeError('Output byte budget');tick();const h=await open(join(out,'complete.pending.json'),'wx');try{await h.writeFile(completion);}finally{await h.close();}tick();await rename(join(out,'complete.pending.json'),join(out,'complete.json'));return done;
}
export interface PartitionedMembershipSource {
 rows:AsyncIterable<unknown>;producerDescriptorSha256:string;planSha256:string;admissionSnapshotSha256?:string;expectedCandidates:number;
 inputIdentity:z.infer<typeof partitionedMembershipInputIdentitySchema>;budget:SharedPartitionBudget;membershipVersion?:2|3;resourceSession?:ResourceSessionV3;
}
/** Library entry point: the admitted wrapper supplies the verified complete stream. */
export async function buildPartitionedBoundaryMetadata(input:string,output:string,source:PartitionedMembershipSource,limits:BoundaryLimits={}):Promise<PartitionedMembershipCompletion|PartitionedMembershipCompletionV3>{
 const version=source.membershipVersion??2;if(version!==2&&version!==3)throw new Error('Unsupported membership envelope version');
 const resources=source.resourceSession;if(!source.budget)throw new Error('Explicit membership budget required');
 if(version===3?!resources||source.budget.resourceSession!==resources:resources!==undefined||source.budget.resourceSession!==undefined)throw new Error('Versioned membership resource session mismatch');
 const identity=partitionedMembershipInputIdentitySchema.parse(source.inputIdentity),hash=z.string().regex(/^[a-f0-9]{64}$/),expectedCandidates=source.expectedCandidates;
 const producerDescriptorSha256=hash.parse(source.producerDescriptorSha256),planSha256=hash.parse(source.planSha256),admissionSnapshotSha256=source.admissionSnapshotSha256===undefined?undefined:hash.parse(source.admissionSnapshotSha256);
 if(!source.budget||!source.rows||typeof source.rows[Symbol.asyncIterator]!=='function'||!Number.isSafeInteger(expectedCandidates)||expectedCandidates<0||expectedCandidates>(version===3?10000000:1000000)||expectedCandidates!==identity.counts.accepted)throw new Error('Exact complete candidate source/count required');
 if(resources&&(resources.writes.membership.bytes!==0||resources.writes.membership.rows!==0))throw new Error('V3 membership output session already used');
 const session=await createBoundarySession(input,limits,true,source.budget,resources),{manifest,tick,enrich,revalidate,maxRows,maxOutputBytes}=session;
 if(manifest.schemaVersion!==3)throw new Error('Partitioned boundary descriptor required');
 if(manifest.boundaries.length!==identity.boundaryPins.length||manifest.boundaries.some((s,i)=>s.input.bytes!==identity.boundaryPins[i].bytes||s.input.sha256!==identity.boundaryPins[i].sha256))throw new Error('Admitted boundary input mismatch');
 const out=resolve(output);if(output.split(/[\\/]/).includes('..'))throw new Error('Output traversal refused');await safe(dirname(out));await mkdir(out);
 let total=0,unknown=0,previous:string|undefined;
 const outputBudget:SharedPartitionBudget=resources?{bytes:0,rows:0,work:0,maxBytes:maxOutputBytes,maxRows,maxWork:resources.limits.validation.maxOperations,deadline:resources.deadline,signal:limits.signal??source.budget.signal,resourceSession:resources,accounting:'write',writeScope:'membership',metadata:resources.metadata}:{bytes:0,rows:0,get work(){return source.budget.work;},set work(value){source.budget.work=value;},maxBytes:maxOutputBytes,maxRows,maxWork:source.budget.maxWork,deadline:session.deadline,signal:limits.signal??source.budget.signal};
 async function* candidates(){for await(const raw of source.rows){tick();if(total>=maxRows||total>=expectedCandidates)throw new Error('Global membership candidate row/count budget');const row=enrich(raw);if(previous!==undefined&&row.placeId<=previous)throw new Error('Membership candidate order/duplicate');previous=row.placeId;const length=Buffer.byteLength(partitionCanonical(row)+'\n');if(length>65536)throw new Error('Membership output row byte budget');total++;if(!row.countryCode)unknown++;yield row;}if(total!==expectedCandidates)throw new Error('Incomplete membership candidate count/EOF');}
 const family=await writePartitionedFamily(out,'candidates',candidates(),outputBudget);
 const files:Record<string,{bytes:number;sha256:string}>={};
 async function write(name:string,rows:Iterable<unknown>){const h=await open(join(out,name),'wx'),hash=createHash('sha256');let count=0;try{for(const row of rows){tick();const body=Buffer.from(JSON.stringify(row)+'\n');if(body.length>65536||outputBudget.bytes+body.length>maxOutputBytes||resources&&count+body.length>128*1024**2)throw new Error('Membership output byte/row budget');outputBudget.bytes+=body.length;if(resources)recordWrite(resources,'membership',body.length,1);await h.writeFile(body);hash.update(body);count+=body.length;}}finally{await h.close();}files[name]={bytes:count,sha256:hash.digest('hex')};}
 await write('regions.jsonl',session.geometry.filter(b=>!isUnresolved(b.region)).map(b=>b.region));await write('footprints.jsonl',[]);await revalidate();
 // Reserve the descriptor preparation/write/commit work before freezing totals.
 tick();tick();tick();
 const common={kind:'partitioned-membership-v1' as const,catalogueRevision:manifest.catalogueRevision,streams:{candidates:family},files,totalCandidates:total,unknownCountryCandidates:unknown,producerDescriptorSha256,planSha256,...(admissionSnapshotSha256?{admissionSnapshotSha256}:{}),inputIdentity:identity,boundaryInput:manifest.boundaries,coverage:'unknown; administrative boundaries do not establish candidate source coverage' as const,membershipPolicy:'unique-strict-interior; conflicting claims rejected; missing or ambiguous membership unknown' as const};
 const snapshot=resources?resourceSnapshotV3(resources):undefined;
 if(snapshot)snapshot.validation.operations++;
 const membershipWritten=snapshot?.writes.membership.bytes??0;
 const done=resources?partitionedMembershipCompletionV3Schema.parse({...common,schemaVersion:3,limits:{maxRows,maxOutputBytes,maxGeometryComparisons:limits.maxGeometryComparisons},resources:{rows:total,outputBytes:0,...snapshot}}):partitionedMembershipCompletionSchema.parse({...common,schemaVersion:2,resources:{rows:total,work:source.budget.work,outputBytes:0,elapsedMilliseconds:Date.now()-session.start}});
 let completion:Buffer=Buffer.alloc(0);
 for(let i=0;i<16;i++){completion=Buffer.from(JSON.stringify(done)+'\n');const totalBytes=outputBudget.bytes+completion.length;if(done.resources.outputBytes===totalBytes)break;done.resources.outputBytes=totalBytes;if(done.schemaVersion===3)done.resources.writes.membership.bytes=membershipWritten+completion.length;if(i===15)throw new Error('Membership descriptor accounting');}
 if(completion.length>1024**2||done.resources.outputBytes>maxOutputBytes)throw new Error('Membership completion output byte budget');
 const active=()=>{limits.signal?.throwIfAborted();source.budget.signal?.throwIfAborted();if(Date.now()>=source.budget.deadline)throw new Error('Deadline budget');};
 outputBudget.bytes=done.resources.outputBytes;active();if(resources)recordWrite(resources,'membership',completion.length);const h=await open(join(out,'complete.pending.json'),'wx');try{await h.writeFile(completion);}finally{await h.close();}active();await rename(join(out,'complete.pending.json'),join(out,'complete.json'));return done;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){const [input,output]=process.argv.slice(2);if(!input||!output||process.argv.length!==4)throw new Error('Usage: boundary-metadata.ts INPUT.json NEW_OUTPUT');await buildBoundaryMetadata(input,output);}



