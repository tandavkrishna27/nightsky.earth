/** Offline publication only. Never imported by the serving path; no source requests. */
import {createHash,randomUUID} from "node:crypto";
import {lstat,mkdir,open,realpath,rename,unlink,rmdir} from "node:fs/promises";
import {dirname,basename,resolve,relative,isAbsolute,sep,join} from "node:path";
import {spawnSync,type SpawnSyncReturns} from "node:child_process";
import {fileURLToPath} from "node:url";
import * as z from "zod4";
import {parseValidatedLegacyEra5Artifact} from "../../server/providers/climate/era5";
import {readTrustedClimateFile,tiledEra5ManifestSchema,tiledEra5TileSchema,validateTiledEra5Tile,validateTiledEra5Manifest,type TiledEra5Manifest,type TiledEra5Tile} from "../../server/providers/climate/tiledEra5";
import {loadGeoNamesPlaceIndex,type GeoNamesPlaceIndex} from "../../server/places/geonames";
import {utcInstantSchema} from "../../shared/nightsky/common";
import {sameResolvedPath} from "./pathIdentity";
const MiB=1024*1024;
const sha=(value:Buffer|string)=>createHash("sha256").update(value).digest("hex");
const BUILDER="era5-tile-publication-v1";
function canonical(value:unknown):string {
 if(Array.isArray(value))return `[${value.map(canonical).join(",")}]`;
 if(value!==null&&typeof value==="object")return `{${Object.entries(value).sort(([a],[b])=>a<b?-1:a>b?1:0).map(([key,row])=>`${JSON.stringify(key)}:${canonical(row)}`).join(",")}}`;
 return JSON.stringify(value);
}
function serialized(value:unknown):Buffer{return Buffer.from(canonical(value)+"\n","utf8");}
function bound(value:number|undefined,maximum:number):number {const actual=value??maximum;if(!Number.isSafeInteger(actual)||actual<1||actual>maximum)throw Error("Invalid publication byte bound");return actual;}
function within(parent:string,target:string):void {const path=relative(parent,target);if(!path||path===".."||path.startsWith(".."+sep)||isAbsolute(path))throw Error("Publication path outside output parent");}
async function exists(path:string):Promise<boolean>{try{await lstat(path);return true;}catch(error:any){if(error.code==="ENOENT")return false;throw error;}}
function validateManifest(data:TiledEra5Manifest):void {
 if(data.tiles.length>10)throw Error("Initial publication tile count bound is ten tiles");
 validateTiledEra5Manifest(data);
}
const envelopeSchema=z.strictObject({schemaVersion:z.literal(2),manifest:tiledEra5ManifestSchema,tiles:z.array(tiledEra5TileSchema).min(1).max(10)});
export interface TilePublicationOptions {
 inputPath:string;expectedSha256:string;outputDirectory:string;generatedAt:string;
 index?:GeoNamesPlaceIndex;geoNamesPath?:string;maxInputBytes?:number;maxOutputBytes?:number;
 /** Offline instrumentation. A thrown error stops publication and leaves evidence. */
 onProgress?:(phase:"staged"|"before-manifest",directory:string)=>void|Promise<void>;
}
export interface TilePublicationReport {
 builderVersion:string;inputSha256:string;inputBytes:number;manifestSha256:string;manifestBytes:number;tileCount:number;publishedBytes:number;generatedAt:string;
 runtime:{node:string;icu:string;timezone:string};period:TiledEra5Manifest["period"];sourceRevisionCount:number;
}
export async function publishClimateTiles(options:TilePublicationOptions):Promise<TilePublicationReport & {manifestPath:string}> {
 const started=performance.now();const deadline=()=>{if(performance.now()-started>10000)throw Error("Tile publication ten-second deadline exceeded");};
 const inputLimit=bound(options.maxInputBytes,8*MiB),outputLimit=bound(options.maxOutputBytes,32*MiB);
 const generatedAt=utcInstantSchema.parse(options.generatedAt);
 if(!isAbsolute(options.outputDirectory))throw Error("Explicit absolute new output directory required");
 const output=resolve(options.outputDirectory);
 const parent=await realpath(dirname(output));if(!sameResolvedPath(parent,dirname(output)))throw Error("Output parent symlink path rejected");within(parent,output);
 if(await exists(output))throw Error("Output directory already exists; immutable releases are never overwritten");
 const bytes=await readTrustedClimateFile(resolve(options.inputPath),options.expectedSha256,inputLimit);deadline();
 const value=JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(bytes));
 let tiles:TiledEra5Tile[],manifest:TiledEra5Manifest;
 if(value?.schemaVersion===1){
  const index=options.index??(options.geoNamesPath?await loadGeoNamesPlaceIndex(options.geoNamesPath):undefined);if(!index)throw Error("Legacy conversion requires the reviewed GeoNames index");
  const legacy=parseValidatedLegacyEra5Artifact(bytes,index);deadline();
  const vintage=new Set(legacy.places.map(place=>place.indexVintage));const tz=new Set(legacy.aggregates.map(row=>row.timezoneVersion));if(vintage.size!==1||tz.size!==1)throw Error("Inconsistent legacy index/timezone vintage");
  const period=legacy.aggregates[0]!.period;const versions={builder:legacy.builderVersion,astronomy:"2.1.19" as const,timezone:legacy.aggregates[0]!.timezoneVersion};
  const metadata={schemaVersion:2 as const,methodVersion:"dark-cloud-v1" as const,unit:"fraction" as const,sourceDoi:"10.24381/cds.adbb2d47" as const,thresholds:[0.1,0.25,0.5] as [0.1,0.25,0.5],period,versions};
  tiles=legacy.aggregates.map(row=>tiledEra5TileSchema.parse({...metadata,key:row.key,mapping:row.mapping,bins:row.bins,yearMonthly:row.yearMonthly}));
  manifest=tiledEra5ManifestSchema.parse({...metadata,sourceProvenance:legacy.sourceProvenance,placeIndexVintage:legacy.places[0]!.indexVintage,grid:{spacingDegrees:legacy.gridProvenance.suppliedSpacingDegrees,nativeResolutionApproxKm:legacy.gridProvenance.nativeResolutionApproxKm,mapping:legacy.gridProvenance.selection},generatedAt,
   sourceRevisions:[{sha256:legacy.manifestSha256,revision:`${legacy.builderVersion}:manifest`,kind:"manifest"},...legacy.sources.flatMap(source=>[{sha256:source.rawSha256,revision:`${source.chunkId}:raw:${source.source.experimentVersions.join(",")}`,kind:"raw"},{sha256:source.decodedSha256,revision:`${source.chunkId}:decoded:${source.source.experimentVersions.join(",")}`,kind:"decoded"}])],
   caveats:legacy.caveats,tiles:tiles.map((tile,index)=>({...tile.mapping,key:tile.key,path:`tile-${String(index).padStart(3,"0")}.json`,sha256:"0".repeat(64),bytes:1}))});
 }else if(value?.schemaVersion===2){
  const envelope=envelopeSchema.parse(value);manifest=envelope.manifest;tiles=envelope.tiles;
  if(tiles.length!==manifest.tiles.length)throw Error("Manifest and tile counts differ");
  for(let i=0;i<tiles.length;i++){const descriptor=manifest.tiles[i]!;const raw=Buffer.from(JSON.stringify(value.tiles[i]));if(raw.length!==descriptor.bytes||sha(raw)!==descriptor.sha256)throw Error("Input tile checksum/size mismatch");validateTiledEra5Tile(tiles[i]!,manifest,descriptor);}
  manifest={...manifest,generatedAt};
 }else throw Error("Unsupported input schema version");
 validateManifest(manifest);deadline();
 const sorted=tiles.slice().sort((a,b)=>a.key<b.key?-1:a.key>b.key?1:0);
 const tileBytes=sorted.map(tile=>serialized(tile));
 manifest={...manifest,tiles:sorted.map((tile,index)=>({...tile.mapping,key:tile.key,path:`tile-${String(index).padStart(3,"0")}.json`,sha256:sha(tileBytes[index]!),bytes:tileBytes[index]!.length}))};
 manifest=tiledEra5ManifestSchema.parse(manifest);validateManifest(manifest);
 sorted.forEach((tile,index)=>{validateTiledEra5Tile(tile,manifest,manifest.tiles[index]!);deadline();});
 const manifestBytes=serialized(manifest);if(manifestBytes.length>4*MiB)throw Error("Manifest size bound exceeded");
 const report:TilePublicationReport={builderVersion:BUILDER,inputSha256:options.expectedSha256,inputBytes:bytes.length,manifestSha256:sha(manifestBytes),manifestBytes:manifestBytes.length,tileCount:sorted.length,publishedBytes:0,generatedAt,runtime:{node:process.version,icu:process.versions.icu??"unknown",timezone:process.versions.tz??"unknown"},period:manifest.period,sourceRevisionCount:manifest.sourceRevisions.length};
 // A fixed point keeps the reported total equal to actual public bytes including report.
 let reportBytes=serialized(report);for(let i=0;i<4;i++){report.publishedBytes=tileBytes.reduce((sum,row)=>sum+row.length,manifestBytes.length+reportBytes.length);reportBytes=serialized(report);}
 if(report.publishedBytes>outputLimit)throw Error("Published output byte budget exceeded");
 const lockPath=join(parent,`.${basename(output)}.publish.lock`);within(parent,lockPath);const lock=await open(lockPath,"wx");
 let staging:string|undefined;
 try {
  if(await exists(output))throw Error("Output directory already exists");
  staging=join(parent,`.${basename(output)}.staging-${randomUUID()}`);within(parent,staging);await mkdir(staging);if(!sameResolvedPath(await realpath(staging),staging)||(await lstat(staging)).isSymbolicLink())throw Error("Unsafe staging directory");
  const save=async(name:string,data:Buffer)=>{const path=join(staging!,name);within(staging!,path);const file=await open(path,"wx");try{await file.writeFile(data);await file.sync();}finally{await file.close();}deadline();};
  for(let i=0;i<sorted.length;i++)await save(manifest.tiles[i]!.path,tileBytes[i]!);
  await save("publication-report.json",reportBytes);await save("manifest.json",manifestBytes);
  await options.onProgress?.("staged",staging);deadline();
  // Exclusive directory creation prevents replacing an existing release. Only the
  // final atomic manifest rename marks this new directory as readable/completed.
  await mkdir(output);if(!sameResolvedPath(await realpath(output),output)||(await lstat(output)).isSymbolicLink())throw Error("Unsafe output directory");
  for(const tile of manifest.tiles)await rename(join(staging,tile.path),join(output,tile.path));
  await rename(join(staging,"publication-report.json"),join(output,"publication-report.json"));
  await options.onProgress?.("before-manifest",output);deadline();
  await rename(join(staging,"manifest.json"),join(output,"manifest.json"));
  // A nonrecursive removal can only remove our checked, now-empty stage. Failed
  // stages and incomplete release directories remain for explicit inspection.
  await rmdir(staging);
  return {...report,manifestPath:join(output,"manifest.json")};
 } finally {await lock.close();await unlink(lockPath);}
}
/** Separate process covers a CPU hang that cooperative checks cannot interrupt. */
export function runBoundedTileWorker(command:string,args:string[],timeoutMs=10000):SpawnSyncReturns<Buffer> {
 if(!Number.isSafeInteger(timeoutMs)||timeoutMs<1||timeoutMs>10000)throw Error("Worker deadline must be between 1 ms and ten seconds");
 return spawnSync(command,args,{timeout:timeoutMs,killSignal:"SIGKILL",stdio:["ignore","pipe","pipe"],maxBuffer:MiB});
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2);const required=(flag:string)=>{const i=args.indexOf(flag);if(i<0||i===args.length-1||args[i+1]!.startsWith("--"))throw Error(`Required ${flag}`);return args[i+1]!;};
 try {
  if(!args.includes("--worker")){const result=runBoundedTileWorker(process.execPath,[...process.execArgv,fileURLToPath(import.meta.url),...args,"--worker"]);if(result.stdout)process.stdout.write(result.stdout);if(result.stderr)process.stderr.write(result.stderr);if(result.error)console.error("Tile worker failed or exceeded ten-second hard deadline:",result.error.message);process.exitCode=result.status??1;}
  else {const options={inputPath:required("--input"),expectedSha256:required("--expected-sha256"),outputDirectory:required("--output"),generatedAt:required("--generated-at"),...(args.includes("--geonames")?{geoNamesPath:required("--geonames")}:{})};publishClimateTiles(options).then(result=>console.log(JSON.stringify(result,null,2))).catch(error=>{console.error(error.message);process.exitCode=1;});}
 }catch(error){console.error(error instanceof Error?error.message:"Publication failed");process.exitCode=1;}
}
