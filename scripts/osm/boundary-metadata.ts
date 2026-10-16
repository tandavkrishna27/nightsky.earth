import {boundaryShards,shardGeometry} from './partitioned-boundaries';
import {open,lstat,mkdir,rename} from 'node:fs/promises';
import {resolve,dirname,parse,join,isAbsolute} from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import * as z from 'zod4';
import {catalogueCandidateSchema} from '../../server/places/catalogueFormat';
import {catalogueRevisionSchema,regionRefSchema,type RegionRef} from '../../shared/nightsky/discovery';
import {jsonlRows} from './build-source-catalogue';
import {boundaries,contains,isUnresolved,type Point} from './geographic-geometry';
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
const descriptorSchema=z.union([z.strictObject({schemaVersion:z.literal(1),catalogueRevision:catalogueRevisionSchema,boundaries:pinSchema,candidates:pinSchema}),z.strictObject({schemaVersion:z.literal(2),catalogueRevision:catalogueRevisionSchema,boundaries:boundaryShards,candidates:pinSchema})]);
export interface BoundaryLimits {maxBoundaryBytes?:number;maxVertices?:number;maxTotalVertices?:number;maxMilliseconds?:number;maxComparisons?:number;maxRows?:number;maxOutputBytes?:number;signal?:AbortSignal}
async function safe(path:string){if(path.split(/[\\/]/).includes('..'))throw new TypeError('Path traversal refused');const absolute=resolve(path);let cursor=parse(absolute).root;for(const part of absolute.slice(cursor.length).split(/[\\/]/).filter(Boolean)){cursor=join(cursor,part);if((await lstat(cursor)).isSymbolicLink())throw new TypeError('Symlink path refused');}return absolute;}
async function bytes(path:string,max:number,pin?:z.infer<typeof pinSchema>){const h=await open(await safe(path),'r');try{const before=await h.stat();if(!before.isFile()||before.size>max||pin&&pin.bytes!==before.size)throw new RangeError('Input size/pin limit');const b=Buffer.alloc(before.size);let n=0;while(n<b.length){const r=await h.read(b,n,b.length-n,null);if(!r.bytesRead)throw new Error('Input mutation');n+=r.bytesRead;}const after=await h.stat();await safe(path);if(before.size!==after.size||before.mtimeMs!==after.mtimeMs)throw new Error('Input mutation');if(pin&&createHash('sha256').update(b).digest('hex')!==pin.sha256)throw new Error('Input checksum mismatch');return b;}finally{await h.close();}}
export async function buildBoundaryMetadata(input:string,output:string,limits:BoundaryLimits={}){
 const {maxBoundaryBytes=16*1024*1024,maxVertices=100000,maxComparisons=10000000,maxRows=100000,maxOutputBytes=128*1024*1024,signal}=limits;
 for(const [n,ceiling] of [[maxBoundaryBytes,64*1024*1024],[maxVertices,1000000],[maxComparisons,200000000],[maxRows,1000000],[maxOutputBytes,1024*1024*1024]])if(!Number.isSafeInteger(n)||n<1||n>ceiling)throw new RangeError('Unsupported budget');
 const maxTotalVertices=limits.maxTotalVertices??maxVertices,maxMilliseconds=limits.maxMilliseconds??60000;if(!Number.isSafeInteger(maxTotalVertices)||maxTotalVertices<1||maxTotalVertices>2000000||!Number.isSafeInteger(maxMilliseconds)||maxMilliseconds<1||maxMilliseconds>1800000)throw new Error('Unsupported aggregate/deadline budget');const start=Date.now();
 let work=0;const tick=()=>{signal?.throwIfAborted();if(Date.now()-start>=maxMilliseconds)throw new Error('Deadline budget');if(++work>maxComparisons)throw new RangeError('Comparison budget');};tick();
 const path=await safe(input),descriptorBytes=await bytes(path,1024*1024),manifest=descriptorSchema.parse(JSON.parse(new TextDecoder('utf8',{fatal:true}).decode(descriptorBytes)));const base=dirname(path);
 const specs=manifest.schemaVersion===2?manifest.boundaries:[{input:manifest.boundaries,regionIds:undefined,unresolvedBoundaryIds:undefined}];if(manifest.schemaVersion===1&&maxTotalVertices!==maxVertices)throw new Error('Aggregate override requires shards');
 const geometry:ReturnType<typeof boundaries>=[],seen=new Set<string>();let totalBoundaryBytes=0,totalVertices=0;
 for(const spec of specs){tick();totalBoundaryBytes+=spec.input.bytes;if(totalBoundaryBytes>maxBoundaryBytes)throw new Error('Aggregate boundary byte budget');const raw=JSON.parse(new TextDecoder('utf8',{fatal:true}).decode(await bytes(join(base,spec.input.path),maxBoundaryBytes,spec.input)));const result=spec.regionIds?shardGeometry(raw,spec.regionIds,seen,maxVertices,tick,spec.unresolvedBoundaryIds):{parsed:boundaries(raw,maxVertices,tick),vertices:0};if(spec.regionIds){totalVertices+=result.vertices;if(totalVertices>maxTotalVertices)throw new Error('Aggregate vertex budget');}geometry.push(...result.parsed);}
 const classify=indexedBoundaryContains(geometry,tick);
 // Complete input hash validation occurs again while streaming; no completion marker on failure.
 const out=resolve(output);if(output.split(/[\\/]/).includes('..'))throw new Error('Output traversal refused');await safe(dirname(out));await mkdir(out);
 const files:Record<string,{bytes:number;sha256:string}>={};let written=0;async function write(name:string,rows:AsyncIterable<unknown>|Iterable<unknown>){const h=await open(join(out,name),'wx'),hash=createHash('sha256');let count=0;try{for await(const row of rows){tick();const b=Buffer.from(JSON.stringify(row)+'\n');written+=b.length;if(written>maxOutputBytes||b.length>65536)throw new RangeError('Output byte/row budget');await h.writeFile(b);hash.update(b);count+=b.length;}}finally{await h.close();}files[name]={bytes:count,sha256:hash.digest('hex')};}
 let unknown=0,total=0;
 async function* candidates(){for await(const raw of jsonlRows(join(base,manifest.candidates.path),{pin:manifest.candidates,maxRows,maxBytes:128*1024*1024,signal})){tick();const row=catalogueCandidateSchema.parse(raw);if(row.catalogueRevision!==manifest.catalogueRevision)throw new Error('Candidate revision mismatch');const matches=classify([row.longitude,row.latitude]);const countries=matches.filter(x=>x.b.region.adminLevel===0&&x.status!==0),states=matches.filter(x=>x.b.region.adminLevel===1&&x.status!==0);const country=countries.length===1&&countries[0].status===1&&!isUnresolved(countries[0].b.region)?countries[0].b.region:undefined;const state=country&&states.length===1&&states[0].status===1&&!isUnresolved(states[0].b.region)&&states[0].b.region.countryCode===country.countryCode?states[0].b.region:undefined;const ids=country?[country.regionId,...(state?[state.regionId]:[])]:[];if(row.countryCode!==undefined&&row.countryCode!==country?.countryCode||row.regionIds.some(id=>!ids.includes(id)))throw new Error('Conflicting claimed membership');const {countryCode:_old,regionIds:_ids,...facts}=row;total++;if(!country)unknown++;yield {...facts,...(country?{countryCode:country.countryCode}:{}),regionIds:country?[country.regionId,...(state?[state.regionId]:[])]:[]};}}
 await write('candidates.jsonl',candidates());await write('regions.jsonl',geometry.filter(b=>!isUnresolved(b.region)).map(b=>b.region));await write('footprints.jsonl',[]);
 if(!(await bytes(path,1024*1024)).equals(descriptorBytes))throw new Error('Descriptor mutation');for(const spec of specs){tick();await bytes(join(base,spec.input.path),maxBoundaryBytes,spec.input);}const done={schemaVersion:1,catalogueRevision:manifest.catalogueRevision,files,coverage:'unknown; administrative boundaries do not establish candidate source coverage',membershipPolicy:'unique-strict-interior; conflicting claims rejected; missing or ambiguous membership unknown',boundaryInput:manifest.boundaries,candidateInput:manifest.candidates,totalCandidates:total,unknownCountryCandidates:unknown};const completion=JSON.stringify(done)+'\n';if(written+Buffer.byteLength(completion)>maxOutputBytes)throw new RangeError('Output byte budget');tick();const h=await open(join(out,'complete.pending.json'),'wx');try{await h.writeFile(completion);}finally{await h.close();}await rename(join(out,'complete.pending.json'),join(out,'complete.json'));return done;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){const [input,output]=process.argv.slice(2);if(!input||!output||process.argv.length!==4)throw new Error('Usage: boundary-metadata.ts INPUT.json NEW_OUTPUT');await buildBoundaryMetadata(input,output);}



