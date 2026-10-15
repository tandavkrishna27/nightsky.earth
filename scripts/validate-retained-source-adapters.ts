/** Retained-only lineage checks. No source decoder, acquisition, or admission side effects. */
import {isDeepStrictEqual} from 'node:util';
import {open} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import * as z from 'zod4';
import {safe} from './osm/build-source-catalogue';
import {parseDecodedChunk} from './era5/chunks';
import {osmCandidateIndexSchema} from '../server/places/importOsm';
import {boundaries} from './osm/geographic-geometry';
import {catalogueCandidateSchema} from '../server/places/catalogueFormat';
const digest=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const hash=z.string().regex(/^[a-f0-9]{64}$/);
const pin=z.strictObject({path:z.string().min(1).max(240).refine(p=>!p.includes(':')&&!p.includes('\\')&&!p.startsWith('/')&&p.split('/').every(x=>!!x&&x!=='.'&&x!=='..')),bytes:z.number().int().safe().min(1).max(32*1024*1024),sha256:hash});
const stamp=z.string().datetime({offset:true});
const rights=z.strictObject({licenseUrl:z.string().url().max(2048),attribution:z.string().min(1).max(500)});
const positive=z.number().int().safe().min(1).max(800);
const inspectionSchema=z.object({bytes:z.number().int().safe().positive(),sha256:hash,data_class:z.literal('historical hourly reanalysis; not a forecast or site observation'),metadata:z.object({experiment_versions:z.array(z.string()).min(1).max(10),member:z.literal(0)}),dimensions:z.strictObject({valid_time:positive,latitude:positive,longitude:positive}),cloud:z.object({dimensions:z.array(z.string()).length(3),standard_name:z.literal('cloud_area_fraction'),units:z.string(),count:z.number().int().safe().min(1).max(8000)}),time:z.object({variable:z.literal('valid_time'),source_units:z.string(),calendar:z.string(),count:positive,first_utc:stamp,last_utc:stamp}),grid:z.object({latitude:z.array(z.number().finite().min(-90).max(90)).min(1).max(10),longitude:z.array(z.number().finite().min(-180).max(359.75)).min(1).max(10)})});
const osm=z.strictObject({adapter:z.literal('retained-osm-regional-v1'),raw:pin,manifest:pin,candidates:pin,nativeVintage:stamp,sourceUrl:z.string().url().max(2048),rights,extraction:z.strictObject({incompleteWays:z.number().int().min(0),relationsPolicy:z.literal('excluded'),wayPointPolicy:z.literal('mean complete vertices, closing vertex removed')})});
const era5=z.strictObject({adapter:z.literal('retained-era5-monthly-v1'),raw:pin,decoded:pin,inspection:pin,rights,firstUtc:stamp,lastUtc:stamp,experimentVersions:z.array(z.literal('0001')).length(1),cells:z.array(z.strictObject({cellId:z.string().min(1).max(80),latitude:z.number().finite(),longitude:z.number().finite()})).min(1).max(10)});
const boundary=z.strictObject({adapter:z.literal('normalized-boundary-v1'),geometry:pin,evidenceClass:z.enum(['synthetic','retained-normalized'])});
const canonical=z.strictObject({adapter:z.literal('retained-osm-canonical-v1'),completion:pin,catalogueRevision:z.string().min(1).max(100),manifestSha256:hash,sources:z.array(z.strictObject({id:z.string().regex(/^[A-Za-z0-9_-]{1,80}$/),sha256:hash,nativeVintage:stamp,url:z.string().url().max(2048),rights})).min(1).max(64)});
export const retainedAdapterSchema=z.discriminatedUnion('adapter',[osm,era5,boundary,canonical]);
export const retainedValidationPlanSchema=z.strictObject({schemaVersion:z.literal(1),entries:z.array(retainedAdapterSchema).min(1).max(16)});
export type RetainedAdapter=z.infer<typeof retainedAdapterSchema>;
type Pin=z.infer<typeof pin>;
/** Fixed findings never include paths, source text, parser errors, or arbitrary metadata. */
export interface RetainedAdapterFinding {adapter:string;status:'validated-lineage'|'validated-normalized'|'rejected';sourceAdmitted:false;nativeParserRerun:false;code:'PINNED_LINEAGE_CONSISTENT'|'NORMALIZED_GEOMETRY_ONLY'|'RETAINED_CONTRACT_REJECTED'}
async function read(base:string,p:Pin,max=4*1024*1024){
 if(p.bytes>max)throw new Error('bound');
 const path=await safe(join(base,p.path));const h=await open(path,'r');
 try{const before=await h.stat();if(!before.isFile()||before.size!==p.bytes)throw new Error('pin');
 const b=Buffer.alloc(p.bytes);let n=0;while(n<b.length){const r=await h.read(b,n,b.length-n,null);if(!r.bytesRead)throw new Error('mutation');n+=r.bytesRead;}
 const after=await h.stat();await safe(path);if(before.ino!==after.ino||before.size!==after.size||before.mtimeMs!==after.mtimeMs||digest(b)!==p.sha256)throw new Error('pin');return b;
 }finally{await h.close();}
}
const json=(b:Buffer)=>JSON.parse(new TextDecoder('utf8',{fatal:true}).decode(b));
const equal=isDeepStrictEqual;
function requireValue(ok:boolean){if(!ok)throw new Error('contract');}
async function validate(base:string,e:RetainedAdapter){
 if(e.adapter==='normalized-boundary-v1'){
 let work=0;boundaries(json(await read(base,e.geometry)),100000,()=>{if(++work>1000000)throw new Error('work');});return;
 }
 if(e.adapter==='retained-osm-canonical-v1'){
 const policy='named-complete-way-v1-polar85';
 const filePin=pin.omit({path:true}).extend({bytes:z.number().int().safe().min(0).max(4*1024*1024)});
 const complete=z.strictObject({schemaVersion:z.literal(1),catalogueRevision:z.literal(e.catalogueRevision),manifestSha256:z.literal(e.manifestSha256),files:z.strictObject({'candidates.jsonl':filePin,'exclusions.jsonl':filePin,'lineage.jsonl':filePin}),coverage:z.literal('unknown; clipping metadata is not coverage'),policy:z.literal(policy)}).parse(json(await read(base,e.completion,1024*1024)));
 requireValue(new Set(e.sources.map(s=>s.id)).size===e.sources.length);
 const sourceMap=new Map(e.sources.map(s=>[s.id,s]));
 for(const s of e.sources)requireValue(s.rights.licenseUrl==='https://opendatacommons.org/licenses/odbl/1-0/'&&s.rights.attribution==='© OpenStreetMap contributors'&&!s.url.toLowerCase().includes('latest'));
 const folder=dirname(e.completion.path);
 async function rows(name:keyof typeof complete.files){const p={path:join(folder,name).replaceAll('\\','/'),...complete.files[name]};const b=await read(base,p);const text=new TextDecoder('utf8',{fatal:true}).decode(b);if(!text.length)return [];requireValue(text.endsWith('\n'));const lines=text.slice(0,-1).split('\n');requireValue(lines.length<=10000&&lines.every(s=>Buffer.byteLength(s)<=65536));return lines.map(s=>JSON.parse(s));}
 const candidates=(await rows('candidates.jsonl')).map(row=>catalogueCandidateSchema.parse(row));
 const candidateMap=new Map(candidates.map(c=>[c.placeId,c]));requireValue(candidateMap.size===candidates.length);
 const lineageSchema=z.strictObject({placeId:z.string(),source:z.string(),sha256:hash,vintage:stamp,policy:z.literal(policy)});
 const lineage=new Map<string,Set<string>>();
 for(const raw of await rows('lineage.jsonl')){const row=lineageSchema.parse(raw),s=sourceMap.get(row.source);requireValue(!!s&&s.sha256===row.sha256&&s.nativeVintage===row.vintage&&candidateMap.has(row.placeId));const seen=lineage.get(row.placeId)??new Set<string>();requireValue(!seen.has(row.source));seen.add(row.source);lineage.set(row.placeId,seen);}
 for(const c of candidates){requireValue(c.catalogueRevision===e.catalogueRevision&&/^place:v1:osm:(node|way):[1-9][0-9]*$/.test(c.placeId));const ids=lineage.get(c.placeId);requireValue(!!ids&&ids.size===c.sources.length);const matchedIds=new Set<string>();for(const s of c.sources){const match=e.sources.find(x=>s.product===`OSM ${x.id} ${x.sha256}`);requireValue(!!match&&!!ids?.has(match.id)&&!matchedIds.has(match.id)&&s.url===match.url&&s.vintage===match.nativeVintage&&s.dataClass==='catalog'&&s.name==='OpenStreetMap contributors'&&s.licenseUrl===match.rights.licenseUrl&&s.attribution===match.rights.attribution&&s.modified===true);if(match)matchedIds.add(match.id);}requireValue(!!ids&&matchedIds.size===ids.size&&[...ids].every(id=>matchedIds.has(id)));}
 const exclusionSchema=z.strictObject({source:z.string(),id:z.string().regex(/^place:v1:osm:(node|way|relation):[1-9][0-9]*$/),reason:z.enum(['relation','unnamed','incomplete','dateline','polar','invalid-geometry'])});
 for(const raw of await rows('exclusions.jsonl')){const row=exclusionSchema.parse(raw);requireValue(sourceMap.has(row.source));}
 return;
 }
 // Verify actual raw bytes, but delegate their semantics to already retained owning decoder reports.
 await read(base,e.raw,32*1024*1024);
 if(e.adapter==='retained-osm-regional-v1'){
 const m=json(await read(base,e.manifest,1024*1024));
 const rows=osmCandidateIndexSchema.parse(json(await read(base,e.candidates)));
 requireValue(rows.candidates.length<=10000&&rows.candidates.every(r=>r.osmType!=='relation')&&new Set(rows.candidates.map(r=>`${r.osmType}/${r.osmId}`)).size===rows.candidates.length);
 requireValue(m.status==='complete'&&m.exitCode===0&&m.inputBytes===e.raw.bytes&&m.inputSha256===e.raw.sha256&&m.outputBytes===e.candidates.bytes&&m.outputSha256===e.candidates.sha256&&m.candidateCount===rows.candidates.length);
 requireValue(m.vintage===e.nativeVintage&&rows.vintage===e.nativeVintage&&rows.source.vintage===e.nativeVintage&&m.sourceUrl===e.sourceUrl&&!e.sourceUrl.toLowerCase().includes('latest'));
 requireValue(e.rights.licenseUrl==='https://opendatacommons.org/licenses/odbl/1-0/'&&m.licenseUrl===e.rights.licenseUrl&&rows.source.licenseUrl===e.rights.licenseUrl&&rows.source.attribution===e.rights.attribution&&rows.source.dataClass==='catalog');
 requireValue(m.incompleteWays===e.extraction.incompleteWays&&m.relationsPolicy===e.extraction.relationsPolicy&&m.wayPointPolicy===e.extraction.wayPointPolicy);
 }else{
 const decodedText=new TextDecoder('utf8',{fatal:true}).decode(await read(base,e.decoded));
 const parsed=parseDecodedChunk(decodedText),h=parsed.header,i=inspectionSchema.parse(json(await read(base,e.inspection,1024*1024)));
 requireValue(h.sourceSha256===e.raw.sha256&&equal(h.experimentVersions,e.experimentVersions)&&equal(h.cells,e.cells)&&h.member===0);
 requireValue(i.bytes===e.raw.bytes&&i.sha256===e.raw.sha256&&equal(i.metadata?.experiment_versions,e.experimentVersions)&&i.metadata?.member===0);
 requireValue(equal(i.cloud?.dimensions,['valid_time','latitude','longitude'])&&i.cloud?.standard_name==='cloud_area_fraction'&&i.cloud?.units===h.sourceUnits&&i.time?.source_units===h.timeUnits&&i.time?.calendar===h.calendar);
 requireValue(i.dimensions?.valid_time===h.rowCount&&i.dimensions?.latitude*i.dimensions?.longitude===h.cells.length&&i.cloud?.count===h.rowCount*h.cells.length&&i.time?.count===h.rowCount);
 const expectedCells=[];for(const lat of i.grid?.latitude??[])for(const rawLon of i.grid?.longitude??[]){const lon=rawLon>180?rawLon-360:rawLon;expectedCells.push({cellId:`era5:${lat}:${lon}`,latitude:lat,longitude:lon});}
 requireValue(equal(expectedCells,e.cells));
 const samples=[...parsed.samplesForCell(h.cells[0]!.cellId)];
 requireValue(samples[0]?.atUtc===e.firstUtc&&samples.at(-1)?.atUtc===e.lastUtc&&i.time?.first_utc===e.firstUtc&&i.time?.last_utc===e.lastUtc);
 requireValue(samples.every((s,n)=>n===0||Date.parse(s.atUtc)-Date.parse(samples[n-1]!.atUtc)===3600000));
 // Source inspection check booleans are intentionally ignored; raw body pins and actual decoded rows are checked.
 }
}
export async function validateRetainedAdapter(base:string,input:unknown):Promise<RetainedAdapterFinding>{
 const result=retainedAdapterSchema.safeParse(input);
 if(!result.success)return {adapter:'unsupported-or-invalid',status:'rejected',sourceAdmitted:false,nativeParserRerun:false,code:'RETAINED_CONTRACT_REJECTED'};
 const e=result.data;
 try{await validate(base,e);return {adapter:e.adapter,status:e.adapter==='normalized-boundary-v1'?'validated-normalized':'validated-lineage',sourceAdmitted:false,nativeParserRerun:false,code:e.adapter==='normalized-boundary-v1'?'NORMALIZED_GEOMETRY_ONLY':'PINNED_LINEAGE_CONSISTENT'};}
 catch{return {adapter:e.adapter,status:'rejected',sourceAdmitted:false,nativeParserRerun:false,code:'RETAINED_CONTRACT_REJECTED'};}
}
export async function validateRetainedPlan(path:string,expectedSha256:string){
 try{hash.parse(expectedSha256);const absolute=await safe(path);const handle=await open(absolute,'r');let b:Buffer;try{const info=await handle.stat();if(!info.isFile()||info.size>65536)throw new Error('bound');b=Buffer.alloc(info.size);let at=0;while(at<b.length){const r=await handle.read(b,at,b.length-at,null);if(!r.bytesRead)throw new Error('mutation');at+=r.bytesRead;}const after=await handle.stat();if(info.ino!==after.ino||info.size!==after.size||info.mtimeMs!==after.mtimeMs||digest(b)!==expectedSha256)throw new Error('pin');}finally{await handle.close();}
 await safe(absolute);const plan=retainedValidationPlanSchema.parse(json(b));const findings=[];for(const e of plan.entries)findings.push(await validateRetainedAdapter(dirname(absolute),e));
 return {schemaVersion:1,sourceAdmissionChanged:false,gbOpen:'not-admitted',arco:'not-admitted',findings};
 }catch{return {schemaVersion:1,sourceAdmissionChanged:false,gbOpen:'not-admitted',arco:'not-admitted',findings:[{adapter:'unsupported-or-invalid',status:'rejected',sourceAdmitted:false,nativeParserRerun:false,code:'RETAINED_CONTRACT_REJECTED'}]};}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const result=await validateRetainedPlan(process.argv[2]??'',process.argv[3]??'');process.stdout.write(JSON.stringify(result,null,2)+'\n');process.exitCode=result.findings.some(f=>f.status==='rejected')?2:0;
}
