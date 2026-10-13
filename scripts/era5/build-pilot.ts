/** Offline, fixed 2025 sample builder. No source requests or runtime registration. */
import { createHash, randomUUID } from "node:crypto";
import { createReadStream, openSync, readSync, closeSync } from "node:fs";
import { stat, lstat, readdir, realpath, open, rename, unlink } from "node:fs/promises";
import { resolve, join, relative, isAbsolute } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync, type SpawnSyncReturns } from "node:child_process";
import { GeoNamesPlaceIndex, geonamesCitySchema, loadGeoNamesPlaceIndex } from "../../server/places/geonames";
import { sourceRecordSchema } from "../../shared/nightsky/common";
import { aggregateDarkCloudSamples, summarizeMonth, statisticsForBin, validateChunkLedger, type CloudSample, type ClimateAggregate } from "./aggregate";
import { parseDecodedChunk } from "./chunks";

import { sameResolvedPath } from "./pathIdentity";
const MiB = 1024 * 1024;
const MANIFEST_SHA = "e43315f64a34a586abda7e4f0ac434e82f0868d2f23bd124a09ba47545bd2400";
const sourceProvenance=sourceRecordSchema.parse({
  name:"Copernicus Climate Change Service (C3S) / ECMWF",
  url:"https://doi.org/10.24381/cds.adbb2d47",
  attribution:"Contains Copernicus Climate Change Service (C3S) ERA5 reanalysis information from ECMWF, licensed under CC BY 4.0. Modified by NightSky.earth into derived hourly dark-time cloud aggregation using observing-night dates and inclusive cloud thresholds.",
  dataClass:"reanalysis",product:"ERA5 hourly data on single levels",model:"ERA5",licenseUrl:"https://creativecommons.org/licenses/by/4.0/",modified:true,
});
/** Separate-process deadline covers CPU/native stalls that cooperative checks cannot. */
export function launchBoundedWorker(command:string,args:string[],timeoutMs=1800*1000):SpawnSyncReturns<Buffer> {
  if(!Number.isInteger(timeoutMs) || timeoutMs<1 || timeoutMs>1800*1000) throw new Error("Worker deadline must be between 1 ms and 30 minutes.");
  return spawnSync(command,args,{timeout:timeoutMs,killSignal:"SIGKILL",stdio:["ignore","pipe","pipe"],maxBuffer:4*MiB});
}
const regions = {
  hanle: {area:[33,78.75,32.75,79],cells:[[32.75,78.75],[32.75,79],[33,78.75],[33,79]],placeIds:[1270426]},
  "kodaikanal-munnar": {area:[10.25,77,10,77.5],cells:[[10,77],[10,77.25],[10,77.5],[10.25,77],[10.25,77.25],[10.25,77.5]],placeIds:[1266425,1262463]},
};
type Region = keyof typeof regions;
export function reviewedPilotManifest() {
  const chunks = [];
  for (const region of Object.keys(regions) as Region[]) {
    const periods = [{year:2024,month:12,days:[30,31],boundary:true},...Array.from({length:12},(_,i)=>({year:2025,month:i+1,days:Array.from({length:new Date(Date.UTC(2025,i+1,0)).getUTCDate()},(_,d)=>d+1),boundary:false})),{year:2026,month:1,days:[1,2],boundary:true}];
    for(const period of periods) chunks.push({chunkId:`${region}-${period.year}-${String(period.month).padStart(2,"0")}${period.boundary?"-boundary":""}`,region,expectedHours:period.days.length*24,request:{product_type:["reanalysis"],variable:["total_cloud_cover"],year:[String(period.year)],month:[String(period.month).padStart(2,"0")],day:period.days.map(d=>String(d).padStart(2,"0")),time:Array.from({length:24},(_,h)=>`${String(h).padStart(2,"0")}:00`),data_format:"netcdf",download_format:"unarchived",area:regions[region].area}});
  }
  return {schemaVersion:1,year:2025,sampleKind:"sample-only",dataset:"reanalysis-era5-single-levels",sourceDoi:"10.24381/cds.adbb2d47",observingNightStart:"2025-01-01",observingNightEnd:"2025-12-31",totalCells:10,chunks,limits:{oneActiveChunk:true,rawChunkBytes:32*MiB,decodedNumericBytes:32*MiB,retainedRawBytes:256*MiB,scratchBytes:1024*MiB,batchSeconds:1800},cellCoverage:Object.fromEntries(Object.entries(regions).map(([name,row])=>[name,{cells:row.cells,placeIds:row.placeIds}]))};
}
function canonical(value: unknown): string {
  if(Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if(value !== null && typeof value === "object") return `{${Object.entries(value).sort(([a],[b])=>a<b?-1:a>b?1:0).map(([key,v])=>`${JSON.stringify(key)}:${canonical(v)}`).join(",")}}`;
  return JSON.stringify(value);
}
const sha = (value:string|Buffer) => createHash("sha256").update(value).digest("hex");
export const manifestDigest = (value:unknown) => sha(canonical(value));
interface Entry {chunkId:string;complete:boolean;rawSha256:string;decodedSha256:string;sourceRevision:string[];sourceRows:number;expectedRows:number;missingSourceHours:number;rawBytes:number;decodedBytes:number;decoderVersions:{netCDF4:string;numpy:string}}
interface Ledger {schemaVersion:number;manifestSha256:string;entries:Entry[]}
async function owned(root:string,path:string) {
  const candidate=resolve(root,path); const rel=relative(root,candidate);
  if(!rel || rel.startsWith("..") || isAbsolute(rel)) throw new Error("Path outside pilot directory.");
  const actual=await realpath(candidate); if(!sameResolvedPath(actual,candidate) || (await lstat(candidate)).isSymbolicLink()) throw new Error("Symlink/checkpoint path rejected.");
  return candidate;
}
async function boundedText(path:string,limit=4*MiB) {const blocks:Buffer[]=[];let bytes=0;for await(const block of createReadStream(path,{highWaterMark:64*1024})){bytes+=block.length;if(bytes>limit) throw new Error("File byte bound exceeded.");blocks.push(block);}return Buffer.concat(blocks).toString("utf8");}
function boundedSyncText(path:string) {const descriptor=openSync(path,"r");try {const buffer=Buffer.alloc(4*MiB+1);let bytes=0,read=0;do {read=readSync(descriptor,buffer,bytes,buffer.length-bytes,null);bytes+=read;} while(read>0 && bytes<buffer.length);if(bytes>4*MiB) throw new Error("Decoded file byte bound exceeded.");return buffer.toString("utf8",0,bytes);}finally{closeSync(descriptor);}}
async function hashFile(path:string,limit=32*MiB) {const hash=createHash("sha256");let bytes=0;for await(const block of createReadStream(path,{highWaterMark:64*1024})){bytes+=block.length;if(bytes>limit) throw new Error("Checkpoint hash byte bound exceeded.");hash.update(block);}return hash.digest("hex");}
async function inventory(root:string):Promise<number> {let bytes=0;for(const entry of await readdir(root,{withFileTypes:true})){const path=join(root,entry.name);if(entry.isSymbolicLink()) throw new Error("Symlink in pilot scratch directory.");bytes+=entry.isDirectory()?await inventory(path):(await stat(path)).size;if(bytes>1024*MiB) throw new Error("Global scratch budget exceeded.");}return bytes;}
function annual(aggregate:ClimateAggregate) {
  const total=aggregate.bins.reduce((a,b)=>({expected:a.expected+b.expected,valid:a.valid+b.valid,sum:a.sum+b.sum,counts:a.counts.map((v,i)=>v+b.counts[i]!) as [number,number,number],yearsMask:(a.yearsMask|b.yearsMask)>>>0,badYearsMask:(a.badYearsMask|b.badYearsMask)>>>0}),{expected:0,valid:0,sum:0,counts:[0,0,0] as [number,number,number],yearsMask:0,badYearsMask:0});
  return {...statisticsForBin(total),missingEligibleSamples:total.expected-total.valid,quality:total.expected?"sample-only":"no-astronomical-darkness"};
}
export async function buildPilot(options:{root:string;output?:string;index?:GeoNamesPlaceIndex;geoNamesPath?:string}) {
  const started=performance.now(),cpu=process.cpuUsage();
  const deadline=()=>{if(performance.now()-started>=1800*1000) throw new Error("Builder 30-minute deadline exceeded.");};
  const root=await realpath(resolve(options.root)); const output=resolve(options.output??join(root,"full-year-sample.json"));
  if(!sameResolvedPath(output,join(root,"full-year-sample.json"))) throw new Error("Artifact output must be the fixed pilot full-year-sample.json path.");
  const lock=await open(join(root,".writer.lock"),"wx");
  let temporary:string|undefined;
  try {
    const manifestPath=await owned(root,"manifest.json"),ledgerPath=await owned(root,"ledger.json");
    const manifestText=await boundedText(manifestPath),ledgerText=await boundedText(ledgerPath);
    const manifest=JSON.parse(manifestText) as ReturnType<typeof reviewedPilotManifest>;
    if(manifestDigest(manifest)!==MANIFEST_SHA || manifestDigest(reviewedPilotManifest())!==MANIFEST_SHA) throw new Error("Unreviewed pilot manifest.");
    const ledger=JSON.parse(ledgerText) as Ledger;
    if(ledger.schemaVersion!==1 || ledger.manifestSha256!==MANIFEST_SHA || !Array.isArray(ledger.entries)) throw new Error("Invalid manifest/ledger version.");
    if(ledger.entries.some(entry=>entry.complete!==true)) throw new Error("Checkpoint completion evidence must be true.");
    validateChunkLedger(ledger.entries.map(e=>({chunkId:e.chunkId,complete:e.complete,sha256:e.rawSha256,sourceRevision:Array.isArray(e.sourceRevision)?e.sourceRevision.join(","):""})));
    const planned=new Set(manifest.chunks.map(c=>c.chunkId));
    if(ledger.entries.some(e=>!planned.has(e.chunkId))) throw new Error("Checkpoint outside reviewed coverage.");
    if(ledger.entries.length!==28) throw new Error(`Missing required chunks: ${28-ledger.entries.length}; full-year artifact withheld.`);
    const entries=new Map(ledger.entries.map(e=>[e.chunkId,e]));
    const scratchBytes=await inventory(root);
    const sources=[];let rawTotal=0;
    for(const chunk of manifest.chunks) {
      deadline(); const entry=entries.get(chunk.chunkId)!;
      const raw=await owned(root,`raw/${chunk.chunkId}.nc`),decoded=await owned(root,`decoded/${chunk.chunkId}.jsonl`);
      const size=(await stat(raw)).size; rawTotal+=size;
      if(size>32*MiB || size!==entry.rawBytes || rawTotal>256*MiB || await hashFile(raw)!==entry.rawSha256) throw new Error("Raw checkpoint missing, oversized or changed.");
      const text=await boundedText(decoded);
      if(Buffer.byteLength(text)!==entry.decodedBytes || sha(text)!==entry.decodedSha256) throw new Error("Decoded checkpoint changed.");
      const parsed=parseDecodedChunk(text),header=parsed.header;
      const expectedCells=manifest.cellCoverage[chunk.region]!.cells.map(([a,b])=>`era5:${a}:${b}`).sort();
      if(canonical(header.cells.map(c=>c.cellId).sort())!==canonical(expectedCells)) throw new Error("Unexpected cells outside reviewed coverage.");
      if(header.sourceSha256!==entry.rawSha256 || canonical(header.experimentVersions)!==canonical(entry.sourceRevision) || canonical(header.decoderVersions)!==canonical(entry.decoderVersions) || header.experimentVersions.some(v=>v!=="0001")) throw new Error("Checkpoint source provenance/revision changed or unsupported.");
      if(entry.sourceRows!==header.rowCount || entry.expectedRows!==chunk.expectedHours || entry.missingSourceHours!==chunk.expectedHours-header.rowCount) throw new Error("Missing source coverage/count evidence.");
      const allowed=new Set(chunk.request.day.flatMap(d=>chunk.request.time.map(t=>`${chunk.request.year[0]}-${chunk.request.month[0]}-${d}T${t}:00Z`)));
      for(const row of parsed.samplesForCell(header.cells[0]!.cellId)) if(!allowed.has(row.atUtc)) throw new Error("Source timestamp outside requested chunk.");
      sources.push({chunkId:entry.chunkId,rawSha256:entry.rawSha256,decodedSha256:entry.decodedSha256,sourceRows:entry.sourceRows,expectedRows:entry.expectedRows,missingSourceHours:entry.missingSourceHours,rawBytes:entry.rawBytes,decodedBytes:entry.decodedBytes,source:header});
    }
    // Production always loads the licensed artifact; injection supplies offline fixtures only.
    const index=options.index??await loadGeoNamesPlaceIndex(options.geoNamesPath);
    if(!index || !index.vintageLabel.trim()) throw new Error("Verified local GeoNames artifact/vintage missing.");
    const aggregates=new Map<string,ReturnType<typeof aggregateDarkCloudSamples>>(); const places=[];
    for(const region of Object.keys(regions) as Region[]) for(const id of regions[region].placeIds) {
      const place=geonamesCitySchema.parse(index.getById(id));
      const distance=(cell:{latitude:number;longitude:number})=>(cell.latitude-place.latitude)**2+((cell.longitude-place.longitude)*Math.cos(place.latitude*Math.PI/180))**2;
      const cells=regions[region].cells.map(([latitude,longitude])=>({latitude:latitude!,longitude:longitude!,cellId:`era5:${latitude}:${longitude}`}));
      const cell=cells.sort((a,b)=>distance(a)-distance(b)||a.cellId.localeCompare(b.cellId))[0]!;
      const mapping={...cell,timeZone:place.timeZone},key=`${cell.cellId}|${place.timeZone}`;
      if(!aggregates.has(key)) {
        // One <=4 MiB decoded chunk is buffered at a time, per cell/timezone.
        // Parser bounds: <=800 rows x <=10 values, <=64 KiB numeric arrays.
        const samples=(function*():Generator<CloudSample>{
          for(const chunk of manifest.chunks.filter(c=>c.region===region)) {
            deadline();const text=boundedSyncText(join(root,"decoded",`${chunk.chunkId}.jsonl`));
            if(sha(text)!==entries.get(chunk.chunkId)!.decodedSha256) throw new Error("Checkpoint changed during aggregation.");
            const decoded=parseDecodedChunk(text);
            for(const sample of decoded.samplesForCell(cell.cellId)) {deadline();yield sample;}
          }
        })();
        aggregates.set(key,aggregateDarkCloudSamples(samples,mapping,{startNight:"2025-01-01",endNight:"2025-12-31"}));
      }
      places.push({...index.toPlaceRef(place),latitude:place.latitude,longitude:place.longitude,key,gridMapping:{method:"nearest-supplied-cell",distanceMetric:"latitude-scaled-angular-grid",approximateDisplacementKm:Math.sqrt(distance(cell))*111.195}});
    }
    const artifact={schemaVersion:1,builderVersion:"pilot-2025-v1",year:2025,sampleKind:"sample-only",historicalLabel:"historical-not-a-forecast",manifestSha256:MANIFEST_SHA,sourceProvenance,gridProvenance:{suppliedSpacingDegrees:0.25,nativeResolutionApproxKm:31,selection:"nearest-supplied-cell",description:"The supplied 0.25-degree latitude/longitude grid is distinct from ERA5's approximately 31 km native model resolution; selected cells are not site measurements."},places,sources,aggregates:[...aggregates.values()].map(aggregate=>({...aggregate,monthly:Array.from({length:12},(_,i)=>({month:i+1,...summarizeMonth(aggregate,i+1),missingEligibleSamples:aggregate.yearMonthly[0]![i]!.expected-aggregate.yearMonthly[0]![i]!.valid})),annual:annual(aggregate)})),caveats:["One year sample only; not a climate baseline or forecast.","Hourly modeled cloud fractions are not continuous clear hours or whole-night probabilities.","Coarse supplied cells do not establish conditions at a mountain observing site."]};
    // Prior publication acts as an immutable source checkpoint as well.
    try {const old=JSON.parse(await boundedText(output));if(old.manifestSha256!==MANIFEST_SHA || canonical(old.sources)!==canonical(sources)) throw new Error("Previous artifact source checkpoint changed.");} catch(error) {if((error as NodeJS.ErrnoException).code!=="ENOENT") throw error;}
    if(await boundedText(manifestPath)!==manifestText || await boundedText(ledgerPath)!==ledgerText) throw new Error("Manifest/ledger changed during build.");
    for(const chunk of manifest.chunks) {const entry=entries.get(chunk.chunkId)!;if(await hashFile(join(root,"raw",`${chunk.chunkId}.nc`))!==entry.rawSha256 || await hashFile(join(root,"decoded",`${chunk.chunkId}.jsonl`),4*MiB)!==entry.decodedSha256) throw new Error("Source changed before publication.");deadline();}
    const text=canonical(artifact)+"\n",artifactBytes=Buffer.byteLength(text);
    if(artifactBytes>4*MiB || scratchBytes+artifactBytes>1024*MiB) throw new Error("Artifact/global scratch byte bound exceeded.");
    temporary=join(root,`.full-year-${randomUUID()}.tmp`);const stream=await open(temporary,"wx");
    try {await stream.writeFile(text);await stream.sync();} finally {await stream.close();}
    deadline();await rename(temporary,output);temporary=undefined;
    const used=process.cpuUsage(cpu);
    return {output,sha256:sha(text),artifactBytes,wallSeconds:(performance.now()-started)/1000,cpuSeconds:(used.user+used.system)/1e6,processPeakRssBytes:process.resourceUsage().maxRSS*1024,scratchBytesBefore:scratchBytes,scratchBytesWithStagedArtifact:scratchBytes+artifactBytes,scratchMeasurementKind:"prebuild-inventory-plus-staged-output-upper-bound",sampleKind:"sample-only"};
  } finally {if(temporary) await unlink(temporary).catch(()=>{});await lock.close();await unlink(join(root,".writer.lock"));}
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const args=process.argv.slice(2);const value=(name:string,fallback:string)=>{const i=args.indexOf(name);return i<0?fallback:args[i+1]??fallback;};
  if(!args.includes("--worker")) {
    const worker=launchBoundedWorker(process.execPath,[...process.execArgv,fileURLToPath(import.meta.url),...args,"--worker"]);
    if(worker.stdout) process.stdout.write(worker.stdout);if(worker.stderr) process.stderr.write(worker.stderr);
    if(worker.error) console.error("Builder worker failed or exceeded hard 30-minute deadline:",worker.error.message);
    process.exitCode=worker.status??1;
  } else buildPilot({root:value("--root",".data/era5/pilot-2025"),geoNamesPath:value("--geonames",".data/geonames/cities500.json.gz"),...(args.includes("--output")?{output:value("--output","")}:{})}).then(result=>console.log(JSON.stringify(result,null,2))).catch(error=>{console.error(error.message);process.exitCode=1;});
}
