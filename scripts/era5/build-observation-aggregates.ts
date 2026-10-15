/** Offline decoded-observation producer; no downloads or runtime registration. */
import {createHash,randomUUID} from 'node:crypto';
import {openSync,readSync,closeSync,lstatSync,fstatSync,realpathSync} from 'node:fs';
import {open,unlink,link,lstat,realpath} from 'node:fs/promises';
import {resolve,dirname,basename,isAbsolute,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import * as z from 'zod4';
import {parseDecodedChunk} from './chunks';
import {aggregateDarkCloudSamples,type CloudSample} from './aggregate';
import {ianaTimeZoneSchema,sourceRecordSchema,utcInstantSchema} from '../../shared/nightsky/common';
import {calendarDateSchema,climatePeriodSchema} from '../../shared/nightsky/climate';
import {readTrustedClimateFile,tiledEra5ManifestSchema,tiledEra5TileSchema,validateTiledEra5Manifest,validateTiledEra5Tile} from '../../server/providers/climate/tiledEra5';
import {canonicalRelease,releaseSha,releasePath,mergeReleaseRevisions} from '../../server/providers/climate/releaseEra5';
const MiB=1024*1024;
const digest=z.string().regex(/^[a-f0-9]{64}$/),id=z.string().regex(/^[a-zA-Z0-9_-]{1,60}$/);
export const observationPlanSchema=z.strictObject({schemaVersion:z.literal(1),period:z.strictObject({startNight:calendarDateSchema,endNight:calendarDateSchema}),generatedAt:utcInstantSchema,placeIndexVintage:z.string().min(1).max(100),chunks:z.array(z.strictObject({id,path:z.string().min(1).max(300),sha256:digest})).min(1).max(4000),mappings:z.array(z.strictObject({cellId:z.string().min(1).max(80),latitude:z.number().min(-90).max(90),longitude:z.number().min(-180).max(180),timeZone:ianaTimeZoneSchema,chunkIds:z.array(id).min(1).max(4000)})).min(1).max(10)});
export interface ObservationAggregationOptions {planPath:string;expectedPlanSha256:string;outputPath:string;maxTotalInputBytes?:number;maxOutputBytes?:number;maxDurationMs?:number}
const provenance=sourceRecordSchema.parse({name:'Copernicus Climate Change Service (C3S) / ECMWF',url:'https://doi.org/10.24381/cds.adbb2d47',attribution:'Contains Copernicus Climate Change Service (C3S) ERA5 reanalysis information from ECMWF, licensed under CC BY 4.0. Modified by NightSky.earth into derived hourly dark-time cloud aggregation using observing-night dates and inclusive cloud thresholds.',dataClass:'reanalysis',product:'ERA5 hourly data on single levels',model:'ERA5',licenseUrl:'https://creativecommons.org/licenses/by/4.0/',modified:true});
function parseJson(bytes:Buffer){return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}
/** Synchronous bounded reader permits the existing pull-based astronomy aggregator to
 * consume one partition at a time without retaining the complete observation history. */
function readPinnedSync(path:string,pin:string){
 const before=lstatSync(path);if(!before.isFile()||before.isSymbolicLink()||before.size>4*MiB)throw Error('Decoded file bound/identity');
 if(resolve(realpathSync(path))!==resolve(path))throw Error('Decoded path alias');
 const fd=openSync(path,'r');try{const initial=fstatSync(fd);if(initial.dev!==before.dev||initial.ino!==before.ino||initial.size!==before.size||!initial.isFile())throw Error('Decoded descriptor identity');const bytes=Buffer.alloc(before.size+1);let used=0;while(used<bytes.length){const n=readSync(fd,bytes,used,bytes.length-used,null);if(!n)break;used+=n;}
 const after=fstatSync(fd),pathAfter=lstatSync(path);if(pathAfter.ino!==initial.ino||pathAfter.dev!==initial.dev||pathAfter.isSymbolicLink()||used!==before.size||after.ino!==before.ino||after.dev!==before.dev||after.mtimeMs!==before.mtimeMs||after.size!==before.size||after.isSymbolicLink())throw Error('Decoded source changed');
 const result=bytes.subarray(0,used);if(releaseSha(result)!==pin)throw Error('Decoded checksum');return result;
 }finally{closeSync(fd);}
}
export async function buildObservationAggregates(options:ObservationAggregationOptions){
 if(!isAbsolute(options.planPath)||!isAbsolute(options.outputPath))throw Error('Explicit absolute plan/output paths required');
 const budget=(n:number|undefined,max:number)=>{const value=n??max;if(!Number.isSafeInteger(value)||value<1||value>max)throw Error('Invalid observation budget');return value;};
 const maxInput=budget(options.maxTotalInputBytes,1024*MiB),maxOutput=budget(options.maxOutputBytes,8*MiB),duration=budget(options.maxDurationMs,30*60*1000);
 const started=performance.now();let inputBytes=0;const check=()=>{if(inputBytes>maxInput)throw Error('Observation input byte budget');if(performance.now()-started>duration)throw Error('Observation time budget');};
 const planPath=resolve(options.planPath),output=resolve(options.outputPath),root=dirname(planPath);
 await releasePath(root,basename(planPath));
 if(resolve(await realpath(dirname(output)))!==dirname(output))throw Error('Output parent alias');
 try{await lstat(output);throw Error('Immutable observation output exists');}catch(e:any){if(e.code!=='ENOENT')throw e;}
 const planBytes=await readTrustedClimateFile(planPath,options.expectedPlanSha256,MiB);inputBytes+=planBytes.length;check();
 const plan=observationPlanSchema.parse(parseJson(planBytes));
 const period=climatePeriodSchema.parse({...plan.period,kind:plan.period.startNight==='1991-01-01'&&plan.period.endNight==='2020-12-31'?'baseline-1991-2020':'sample-only'});
 const chunks=new Map(plan.chunks.map(c=>[c.id,c]));if(chunks.size!==plan.chunks.length)throw Error('Duplicate chunk ID');
 const used=new Set<string>(),keys=new Set<string>();
 for(const mapping of plan.mappings){const key=`${mapping.cellId}|${mapping.timeZone}`;if(keys.has(key)||new Set(mapping.chunkIds).size!==mapping.chunkIds.length)throw Error('Duplicate mapping/chunk assignment');keys.add(key);
 if(mapping.cellId!==`era5:${mapping.latitude}:${mapping.longitude}`||!Number.isInteger(mapping.latitude*4)||!Number.isInteger(mapping.longitude*4))throw Error('Explicit supplied grid mapping required');
 for(const name of mapping.chunkIds){if(!chunks.has(name))throw Error('Unknown chunk assignment');used.add(name);}}
 if(used.size!==chunks.size)throw Error('Unassigned source chunk');
 const paths=new Map<string,string>(),revisions:{sha256:string;revision:string;kind:'raw'|'decoded'|'manifest'}[]=[{sha256:options.expectedPlanSha256,revision:`observation-plan-v1:${options.expectedPlanSha256}`,kind:'manifest'}];
 for(const chunk of plan.chunks){check();const path=await releasePath(root,chunk.path);if([...paths.values()].includes(path))throw Error('Duplicate source path');paths.set(chunk.id,path);
 const bytes=await readTrustedClimateFile(path,chunk.sha256,4*MiB);inputBytes+=bytes.length;check();const decoded=parseDecodedChunk(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
 revisions.push({sha256:chunk.sha256,revision:`observation-decoded-v1:${chunk.sha256}`,kind:'decoded'},{sha256:decoded.header.sourceSha256,revision:`observation-raw-v1:${decoded.header.sourceSha256}`,kind:'raw'});
 for(const m of plan.mappings.filter(m=>m.chunkIds.includes(chunk.id))){if(!decoded.header.cells.some(c=>c.cellId===m.cellId&&c.latitude===m.latitude&&c.longitude===m.longitude))throw Error('Selected cell absent or conflicting coordinates');}}
 const aggregates=plan.mappings.map(mapping=>{
 const samples=(function*():Generator<CloudSample>{for(const name of mapping.chunkIds){check();const c=chunks.get(name)!;const bytes=readPinnedSync(paths.get(name)!,c.sha256);const decoded=parseDecodedChunk(new TextDecoder('utf-8',{fatal:true}).decode(bytes));for(const sample of decoded.samplesForCell(mapping.cellId)){check();yield sample;}}})();
 const {chunkIds,...grid}=mapping;return aggregateDarkCloudSamples(samples,grid,period,check);
 });
 const metadata={schemaVersion:2,methodVersion:'dark-cloud-v1',unit:'fraction',sourceDoi:'10.24381/cds.adbb2d47',thresholds:[.1,.25,.5],period,versions:{builder:'observation-aggregates-v1',astronomy:'2.1.19',timezone:aggregates[0]!.timezoneVersion}};
 const tiles=aggregates.map(a=>tiledEra5TileSchema.parse({...metadata,key:a.key,mapping:a.mapping,bins:a.bins,yearMonthly:a.yearMonthly}));
 const manifest=tiledEra5ManifestSchema.parse({...metadata,sourceProvenance:provenance,placeIndexVintage:plan.placeIndexVintage,grid:{spacingDegrees:.25,nativeResolutionApproxKm:31,mapping:'nearest-supplied-cell'},generatedAt:plan.generatedAt,sourceRevisions:mergeReleaseRevisions([revisions]),caveats:['Historical reanalysis; not a forecast.','Hourly modeled cloud fractions are not continuous clear hours or whole-night probabilities.','Coarse supplied cells do not establish conditions at a mountain observing site.',...(period.kind==='sample-only'?['Partial-period sample only; not a climate baseline.']:[])],tiles:tiles.map((t,i)=>({...t.mapping,key:t.key,path:`tile-${i}.json`,sha256:releaseSha(canonicalRelease(t)),bytes:Buffer.byteLength(canonicalRelease(t))}))});
 validateTiledEra5Manifest(manifest);tiles.forEach((t,i)=>validateTiledEra5Tile(t,manifest,manifest.tiles[i]!));
 const bytes=Buffer.from(canonicalRelease({schemaVersion:2,manifest,tiles})+'\n');if(bytes.length>maxOutput)throw Error('Observation output byte budget');check();
 // Revalidate all pins and path boundaries after computation, before publication.
 await releasePath(root,basename(planPath));await readTrustedClimateFile(planPath,options.expectedPlanSha256,MiB);
 for(const c of plan.chunks){await releasePath(root,c.path);await readTrustedClimateFile(paths.get(c.id)!,c.sha256,4*MiB);check();}
 const temporary=join(dirname(output),`.observation-${randomUUID()}.tmp`);let ownsTemporary=false;
 try{const file=await open(temporary,'wx');ownsTemporary=true;try{await file.writeFile(bytes);await file.sync();}finally{await file.close();}
 check();await link(temporary,output);}finally{if(ownsTemporary)await unlink(temporary);}
 return {outputPath:output,sha256:releaseSha(bytes),bytes:bytes.length,tileCount:tiles.length,sourceInputBytes:inputBytes,periodKind:period.kind};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2);const value=(name:string)=>{const i=args.indexOf(name);if(i<0||!args[i+1])throw Error('Required '+name);return args[i+1]!;};
 (async()=>{console.log(JSON.stringify(await buildObservationAggregates({planPath:resolve(value('--plan')),expectedPlanSha256:value('--expected-plan-sha256'),outputPath:resolve(value('--output'))}),null,2));})().catch(e=>{console.error(e.message);process.exitCode=1;});
}
