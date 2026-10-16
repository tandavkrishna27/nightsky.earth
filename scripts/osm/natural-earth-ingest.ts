import {open,lstat,mkdir,rename,realpath} from 'node:fs/promises';
import {resolve,dirname,join,parse,isAbsolute} from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import * as z from 'zod4';
import {regionRefSchema} from '../../shared/nightsky/discovery';
import {boundaries,inside,ringsIntersect} from './geographic-geometry';
import {naturalEarthPolicy,naturalEarthRegion} from './natural-earth-policy';
const relative=z.string().min(1).max(240).refine(p=>!isAbsolute(p)&&!p.includes(':')&&!p.includes('\\')&&p.split('/').every(s=>!!s&&s!=='.'&&s!=='..'),'Unsafe relative path');
const pin=z.strictObject({path:relative,bytes:z.number().int().positive().max(48*1024*1024),sha256:z.string().regex(/^[a-f0-9]{64}$/),gitBlobSha1:z.string().regex(/^[a-f0-9]{40}$/)});
const policies={crsPolicy:z.enum(['reject','verified-crs84']).optional(),geometryPolicy:z.enum(['preserve','remove-consecutive-identical']).optional()};
const layerFields={level:z.union([z.literal(0),z.literal(1)]),input:pin,idField:z.string().min(1).max(100)};
const identity=regionRefSchema.omit({boundaryRevision:true,sources:true});
const schema=z.union([
 z.strictObject({schemaVersion:z.literal(1),profile:z.enum(['natural-earth-v5.1.1','synthetic-natural-earth-only']),...policies,layers:z.array(z.strictObject({...layerFields,mapping:z.record(z.string(),regionRefSchema)})).length(2)}),
 z.strictObject({schemaVersion:z.literal(2),profile:z.literal('natural-earth-v5.1.1'),...policies,layers:z.array(z.strictObject({...layerFields,mapping:z.record(z.string(),identity)})).length(2)}).transform(m=>({...m,layers:m.layers.map(l=>({...l,mapping:Object.fromEntries(Object.entries(l.mapping).map(([id,value])=>[id,naturalEarthRegion(value)]))}))})),
]);
/** Compact descriptors carry reviewed identity only; provider keys are never ISO assignments. */
export const parseNaturalEarthDescriptor=(value:unknown)=>schema.parse(value);
const crs84=z.strictObject({type:z.literal('name'),properties:z.strictObject({name:z.literal('urn:ogc:def:crs:OGC:1.3:CRS84')})});
export interface NaturalEarthLimits {maxInputBytes?:number;maxVertices?:number;maxComparisons?:number;maxOutputBytes?:number;maxMilliseconds?:number;signal?:AbortSignal}
const digest=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const blob=(b:Buffer)=>createHash('sha1').update(`blob ${b.length}\0`).update(b).digest('hex');
function syntax(path:string){const drive=/^[A-Za-z]:[\\/]/.test(path);if(!path||path.length>2048||/^[\\/]{2}/.test(path))throw new Error('Unsafe path syntax');for(const part of (drive?path.slice(3):path.replace(/^[\\/]/,'')).split(/[\\/]/)){if(!part||part==='.'||part==='..'||/[.\s]$/.test(part)||/[\x00-\x1f\x7f<>:"|?*]/.test(part)||/^(con|prn|aux|nul|conin\$|conout\$|com[1-9Â¹Â²Â³]|lpt[1-9Â¹Â²Â³])(?:[ .]|$)/i.test(part))throw new Error('Unsafe path component');}}
async function safe(path:string){syntax(path);const absolute=resolve(path);let cursor=parse(absolute).root;for(const part of absolute.slice(cursor.length).split(/[\\/]/).filter(Boolean)){cursor=join(cursor,part);if((await lstat(cursor)).isSymbolicLink())throw new Error('Symlink refused');}const canonical=await realpath(absolute);if((process.platform==='win32'?canonical.toLowerCase():canonical)!==(process.platform==='win32'?absolute.toLowerCase():absolute))throw new Error('Unsafe canonical path alias');return canonical;}
/** Exact production lengths and Git blobs cannot be overridden. */
export async function ingestNaturalEarth(input:string,output:string,limits:NaturalEarthLimits={}){return ingest(input,output,false,limits);}
/** Explicit synthetic-only seam: its audit never represents production admission. */
export async function ingestSyntheticNaturalEarth(input:string,output:string,limits:NaturalEarthLimits={}){return ingest(input,output,true,limits);}
async function ingest(input:string,output:string,synthetic:boolean,limits:NaturalEarthLimits){
 const maxInputBytes=limits.maxInputBytes??64*1024*1024,maxVertices=limits.maxVertices??100000,maxComparisons=limits.maxComparisons??10000000,maxOutputBytes=limits.maxOutputBytes??128*1024*1024,maxMilliseconds=limits.maxMilliseconds??60000;
 for(const [n,c] of [[maxInputBytes,64*1024*1024],[maxVertices,1000000],[maxComparisons,100000000],[maxOutputBytes,128*1024*1024],[maxMilliseconds,1800000]])if(!Number.isSafeInteger(n)||n<1||n>c)throw new Error('Unsupported budget');
 const start=Date.now();let work=0,totalBytes=0,vertices=0;const tick=()=>{limits.signal?.throwIfAborted();if(Date.now()-start>=maxMilliseconds)throw new Error('Deadline budget');if(++work>maxComparisons)throw new Error('Comparison budget');};tick();
 const snapshots:{path:string;body:Buffer}[]=[];
 async function read(path:string,ceiling:number,expected?:z.infer<typeof pin>,recheck=false){tick();const absolute=await safe(path),h=await open(absolute,'r');try{const before=await h.stat();if(!before.isFile()||before.size>ceiling||expected&&before.size!==expected.bytes)throw new Error('Input size/pin budget');if(!recheck){totalBytes+=before.size;if(totalBytes>maxInputBytes)throw new Error('Aggregate input budget');}const body=Buffer.alloc(before.size);let offset=0;while(offset<body.length){tick();const r=await h.read(body,offset,body.length-offset,null);if(!r.bytesRead)throw new Error('Input mutation');offset+=r.bytesRead;}const after=await h.stat(),linked=await lstat(await safe(absolute));if(before.size!==after.size||before.mtimeMs!==after.mtimeMs||before.ctimeMs!==after.ctimeMs||linked.dev!==after.dev||linked.ino!==after.ino)throw new Error('Input identity mutation');if(expected&&(digest(body)!==expected.sha256||blob(body)!==expected.gitBlobSha1))throw new Error('Input checksum/Git pin mismatch');if(!recheck)snapshots.push({path:absolute,body});tick();return body;}finally{await h.close();}}
 const descriptor=await read(input,1024*1024),manifest=parseNaturalEarthDescriptor(JSON.parse(new TextDecoder('utf8',{fatal:true}).decode(descriptor))),base=dirname(resolve(input));
 if(manifest.profile!==(synthetic?'synthetic-natural-earth-only':'natural-earth-v5.1.1'))throw new Error('Source profile mismatch');
 if(new Set(manifest.layers.map(l=>l.level)).size!==2)throw new Error('Duplicate/missing administrative levels');
 const transformations:any[]=[],crs:any[]=[],features:any[]=[],provenance:any[]=[],regions=new Set<string>();
 for(const layer of manifest.layers){tick();if(!synthetic){const expected=naturalEarthPolicy.layers[layer.level];if(layer.input.bytes!==expected.bytes||layer.input.gitBlobSha1!==expected.gitBlobSha1)throw new Error('Production source pin mismatch');}
  const body=await read(join(base,layer.input.path),48*1024*1024,layer.input);
  const raw=z.object({crs:z.unknown().optional(),type:z.literal('FeatureCollection'),features:z.array(z.unknown()).max(10000)}).parse(JSON.parse(new TextDecoder('utf8',{fatal:true}).decode(body))),seen=new Set<string>();
  if(raw.crs!==undefined){if(manifest.crsPolicy!=='verified-crs84')throw new Error('CRS declaration requires explicit policy');crs84.parse(raw.crs);crs.push({level:layer.level,declaration:raw.crs,interpretation:'longitude/latitude degrees; no reprojection'});}
  for(const item of raw.features){tick();const f=z.object({crs:z.never().optional(),type:z.literal('Feature'),properties:z.record(z.string(),z.unknown()),geometry:z.unknown()}).parse(item),id=f.properties[layer.idField];if(typeof id!=='string'||!id||id==='-99'||!Object.hasOwn(layer.mapping,id)||seen.has(id))throw new Error('Missing/duplicate provider mapping');seen.add(id);const region=synthetic?layer.mapping[id]:naturalEarthRegion(layer.mapping[id]);if(region.adminLevel!==layer.level||regions.has(region.regionId))throw new Error('Conflicting region mapping');if(synthetic&&!region.boundaryRevision.startsWith('synthetic'))throw new Error('Synthetic revision required');if(!synthetic&&region.boundaryRevision!==naturalEarthPolicy.revision)throw new Error('Pinned boundary revision required');regions.add(region.regionId);let geometry=f.geometry;
   if(manifest.geometryPolicy==='remove-consecutive-identical'){
    const parsed=z.strictObject({type:z.enum(['Polygon','MultiPolygon']),coordinates:z.unknown()}).parse(geometry);
    const polygons=z.array(z.array(z.array(z.tuple([z.number().finite(),z.number().finite()])))).parse(parsed.type==='Polygon'?[parsed.coordinates]:parsed.coordinates);
    for(const [polygon,rings] of polygons.entries())for(const [ring,positions] of rings.entries()){
     const removedPositionIndices:number[]=[],kept:typeof positions=[];
     for(const [index,position] of positions.entries()){tick();const last=kept.at(-1);if(last&&last[0]===position[0]&&last[1]===position[1])removedPositionIndices.push(index);else kept.push(position);}
     if(removedPositionIndices.length){rings[ring]=kept;transformations.push({level:layer.level,providerId:id,polygon,ring,removedPositionIndices});}
    }
    geometry={type:parsed.type,coordinates:parsed.type==='Polygon'?polygons[0]:polygons};
   }
   features.push({type:'Feature',properties:region,geometry});provenance.push({level:layer.level,providerId:id,regionId:region.regionId});}
  if(seen.size!==Object.keys(layer.mapping).length)throw new Error('Unused provider mapping');
 }
 const normalized={type:'FeatureCollection',features};const validated=boundaries(normalized,maxVertices,tick);
 for(const b of validated){for(const p of b.polygons)for(const r of p)vertices+=r.length;for(let i=0;i<b.polygons.length;i++)for(let j=0;j<i;j++){const a=b.polygons[i],c=b.polygons[j];for(const ar of a)for(const cr of c)if(ringsIntersect(ar,cr,tick))throw new Error('Unsupported touching/overlapping multipart geometry');if(inside(a[0][0],c[0],tick)!==0||inside(c[0][0],a[0],tick)!==0)throw new Error('Unsupported nested multipart geometry');}}
 syntax(output);const out=resolve(output);await safe(dirname(out));await mkdir(out);let written=0;const files:Record<string,{bytes:number;sha256:string}>={};
 async function write(name:string,value:unknown){tick();await safe(out);const body=Buffer.from(JSON.stringify(value)+'\n');written+=body.length;if(written>maxOutputBytes)throw new Error('Output budget');const h=await open(join(out,name),'wx');try{await h.writeFile(body);}finally{await h.close();}files[name]={bytes:body.length,sha256:digest(body)};}
 await write('boundaries.geojson',normalized);
 await write('preparation.json',{schemaVersion:1,boundaries:{input:{path:'boundaries.geojson',...files['boundaries.geojson']},idField:'regionId',mapping:Object.fromEntries(features.map(f=>[f.properties.regionId,f.properties]))},extractions:[],intendedCells:[]});
 await write('audit.json',{schemaVersion:1,profile:manifest.profile,synthetic,policy:synthetic?null:naturalEarthPolicy,inputs:manifest,provenance,crs,transformations,modifications:['Provider properties replaced by explicit RegionRef mapping; all geometry parts and holes retained',transformations.length?'Consecutive identical coordinate positions removed only at audited indices; raw pinned files retained':'All source coordinate positions preserved'],residuals:{unknownProviderMappings:0,coverage:'unknown',access:'unknown',limitations:['1:10m generalized de facto country boundaries','ADM1 beta; missing disputed/overseas/tiny states remain unknown','No extraction coverage or candidate access proof; unique strict interior membership required']}});
 for(const snapshot of snapshots){const current=await read(snapshot.path,maxInputBytes,undefined,true);if(!current.equals(snapshot.body))throw new Error('Input mutation');}
 const completion={schemaVersion:1,profile:manifest.profile,synthetic,files:{...files},vertices,comparisons:work};await write('complete.pending.json',completion);for(const snapshot of snapshots){const current=await read(snapshot.path,maxInputBytes,undefined,true);if(!current.equals(snapshot.body))throw new Error('Input mutation');}tick();await safe(out);await rename(join(out,'complete.pending.json'),join(out,'complete.json'));return completion;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){const [input,output]=process.argv.slice(2);if(!input||!output||process.argv.length!==4)throw new Error('Usage: natural-earth-ingest.ts INPUT.json NEW_OUTPUT');await ingestNaturalEarth(input,output);}
