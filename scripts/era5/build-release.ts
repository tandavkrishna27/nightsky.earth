/** Offline multi-shard publication. Inputs are bounded validated schema-2 envelopes, consumed one at a time. */
import {mkdir,lstat,open,readFile,rename,unlink} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import * as z from 'zod4';
import {resolve,dirname,isAbsolute,join} from 'node:path';
import {publishClimateTiles} from './build-tiles';
import {readTrustedClimateFile,tiledEra5ManifestSchema,tiledEra5TileSchema,validateTiledEra5Manifest,validateTiledEra5Tile} from '../../server/providers/climate/tiledEra5';
import {sharedReleaseMetadata,mergeReleaseRevisions,canonicalRelease,releaseSha,releaseEra5Schema,releaseMetadata,validateRelease,releasePath,type Era5Release} from '../../server/providers/climate/releaseEra5';
export interface ReleasePublicationOptions {inputs:ReadonlyArray<{inputPath:string;expectedSha256:string}>;outputDirectory:string;generatedAt:string;maxTotalInputBytes?:number;maxOutputBytes?:number;maxDurationMs?:number;onProgress?:(phase:'shard-complete'|'before-manifest',shard:number)=>void|Promise<void>}
async function exists(path:string){try{await lstat(path);return true;}catch(e:any){if(e.code==='ENOENT')return false;throw e;}}
async function save(path:string,value:unknown){const file=await open(path,'wx');try{await file.writeFile(canonicalRelease(value)+'\n');await file.sync();}finally{await file.close();}}
export async function publishClimateRelease(options:ReleasePublicationOptions|import('./build-lineage-release').LineageReleaseOptions){
 if('schemaVersion' in options){if(options.schemaVersion!==6)throw Error('Unknown release format');return (await import('./build-lineage-release')).publishLineageRelease(options);}
 if(!isAbsolute(options.outputDirectory)||options.inputs.length<1||options.inputs.length>1000)throw Error('Explicit output and 1..1000 bounded shard inputs required');
 const bounded=(value:number|undefined,maximum:number)=>{const n=value??maximum;if(!Number.isSafeInteger(n)||n<1||n>maximum)throw Error('Invalid release budget');return n;};
 const maxInput=bounded(options.maxTotalInputBytes,1024*1024*1024),maxOutput=bounded(options.maxOutputBytes,1024*1024*1024),duration=bounded(options.maxDurationMs,30*60*1000);
 const started=performance.now();let totalInput=0,totalOutput=0;const check=()=>{if(performance.now()-started>duration)throw Error('Release time budget');if(totalInput>maxInput||totalOutput>maxOutput)throw Error('Release byte budget');};
 const output=resolve(options.outputDirectory),parent=dirname(output);await releasePath(parent,output.split(/[\\/]/).at(-1)!).catch(async()=>{const {realpath}=await import('node:fs/promises');if(resolve(await realpath(parent))!==parent)throw Error('Output parent alias');});
 const identity={builder:'era5-release-v1',generatedAt:options.generatedAt,inputs:options.inputs.map(i=>({path:resolve(i.inputPath),sha256:i.expectedSha256}))};const releaseId=releaseSha(canonicalRelease(identity));
 if(await exists(join(output,'manifest.json')))throw Error('Immutable published release exists');
 // Reserve the checkpoint and an upper bound for all public bytes before any
 // candidate write. A single envelope is retained at a time during preflight.
 const checkpointBytes=Buffer.byteLength(canonicalRelease(identity)+'\n');
 if(checkpointBytes>maxOutput)throw Error('Release checkpoint byte budget');
 let projectedMetadata:Era5Release['metadata']|undefined;
 const projectedShards:Era5Release['shards']=[];
 let projectedShardBytes=0,preflightInputBytes=0;
 for(let i=0;i<options.inputs.length;i++){
  const input=options.inputs[i]!;
  const raw=await readTrustedClimateFile(resolve(input.inputPath),input.expectedSha256,8*1024*1024);
  preflightInputBytes+=raw.length;if(preflightInputBytes>maxInput)throw Error('Release input byte budget');check();
  const envelope=JSON.parse(raw.toString('utf8'));
  const manifest=tiledEra5ManifestSchema.parse({...envelope.manifest,generatedAt:options.generatedAt});
  const current=releaseMetadata(manifest);
  if(projectedMetadata&&canonicalRelease(sharedReleaseMetadata(current))!==canonicalRelease(sharedReleaseMetadata(projectedMetadata)))throw Error('Release method/grid/period/policy mismatch');
  projectedMetadata={...current,sourceRevisions:mergeReleaseRevisions([projectedMetadata?.sourceRevisions??[],current.sourceRevisions])};
  projectedShards.push({path:`shard-${String(i).padStart(4,'0')}/manifest.json`,sha256:'0'.repeat(64),bytes:4*1024*1024,sourceRevisions:manifest.sourceRevisions,keys:manifest.tiles.map(t=>t.key)});
  // Input contains both descriptors and all tile bodies. Canonical output is
  // no larger apart from renamed paths (4 KiB allowance) and a <=64 KiB report.
  projectedShardBytes+=raw.length+4096+65536;
 }
 const projectedRoot={schemaVersion:3,releaseId,metadata:projectedMetadata,coverage:'explicit-cell-timezone-pairs; missing-is-unknown',shards:projectedShards};
 const rootReservation=Buffer.byteLength(canonicalRelease(projectedRoot)+'\n');
 if(rootReservation>4*1024*1024||checkpointBytes+rootReservation+projectedShardBytes>maxOutput)throw Error('Release output byte budget');
 totalOutput=checkpointBytes;

 if(!(await exists(output)))await mkdir(output);
 if((await lstat(output)).isSymbolicLink())throw Error('Output symlink');
 const lockPath=join(output,'.publication.lock'),lock=await open(lockPath,'wx');
 try{
 const checkpoint=join(output,'candidate.json');if(await exists(checkpoint)){try{await readTrustedClimateFile(checkpoint,releaseSha(canonicalRelease(identity)+'\n'),1024*1024);}catch{throw Error('Resume input identity mismatch');}}else{const entries=await (await import('node:fs/promises')).readdir(output);if(entries.some(e=>e!=='.publication.lock'))throw Error('Untracked output blocks resume');await save(checkpoint,identity);}
 let metadata:Era5Release['metadata']|undefined;const shards:Era5Release['shards']=[];
 for(let i=0;i<options.inputs.length;i++){
 const input=options.inputs[i]!;const inputBytes=await readTrustedClimateFile(resolve(input.inputPath),input.expectedSha256,8*1024*1024);totalInput+=inputBytes.length;check();const envelope=JSON.parse(inputBytes.toString('utf8'));if(envelope.schemaVersion!==2||!Array.isArray(envelope.tiles)||envelope.tiles.length<1||envelope.tiles.length>10)throw Error('Release requires schema2 validated tile envelope');const inputManifest=tiledEra5ManifestSchema.parse({...envelope.manifest,generatedAt:options.generatedAt});
 const name=`shard-${String(i).padStart(4,'0')}`,directory=join(output,name),manifestPath=join(directory,'manifest.json');let checksum:string;
 if(await exists(directory)){
 // A published shard is immutable. Resume re-verifies every byte before skipping it.
 if(!(await exists(manifestPath)))throw Error('Incomplete shard requires operator inspection');
 const receiptPath=await releasePath(directory,'publication-report.json');const receiptStat=await lstat(receiptPath);if(!receiptStat.isFile()||receiptStat.size>65536)throw Error('Receipt bound');const receipt=JSON.parse(await readFile(receiptPath,'utf8'));if(receipt.inputSha256!==input.expectedSha256)throw Error('Shard input identity');checksum=receipt.manifestSha256;
 }else{checksum=(await publishClimateTiles({...input,outputDirectory:directory,generatedAt:options.generatedAt,maxOutputBytes:Math.min(32*1024*1024,maxOutput-totalOutput-rootReservation)})).manifestSha256;}
 const reportPath=await releasePath(directory,'publication-report.json');const reportStat=await lstat(reportPath);if(!reportStat.isFile()||reportStat.size>65536)throw Error('Receipt bound');totalOutput+=reportStat.size;check();
 const bytes=await readTrustedClimateFile(manifestPath,checksum,4*1024*1024);totalOutput+=bytes.length;check();const manifest=tiledEra5ManifestSchema.parse(JSON.parse(bytes.toString('utf8')));validateTiledEra5Manifest(manifest);
 if(manifest.tiles.length>10)throw Error('Ten tile shard bound');if(canonicalRelease(releaseMetadata(inputManifest))!==canonicalRelease(releaseMetadata(manifest))||envelope.tiles.length!==manifest.tiles.length)throw Error('Shard input metadata identity');
 for(const tile of manifest.tiles){const path=await releasePath(directory,tile.path),buffer=await readTrustedClimateFile(path,tile.sha256,tile.bytes);totalOutput+=buffer.length;check();if(buffer.length!==tile.bytes)throw Error('Tile size');const parsed=tiledEra5TileSchema.parse(JSON.parse(buffer.toString('utf8')));validateTiledEra5Tile(parsed,manifest,tile);const original=envelope.tiles.find((t:any)=>t.key===tile.key);if(canonicalRelease(parsed)!==canonicalRelease(tiledEra5TileSchema.parse(original)))throw Error('Shard input tile identity');}
 const current=releaseMetadata(manifest);if(metadata&&canonicalRelease(sharedReleaseMetadata(current))!==canonicalRelease(sharedReleaseMetadata(metadata)))throw Error('Release method/grid/period/policy/source lineage mismatch');metadata={...current,sourceRevisions:mergeReleaseRevisions([metadata?.sourceRevisions??[],current.sourceRevisions])};
 shards.push({path:name+'/manifest.json',sha256:checksum,bytes:bytes.length,sourceRevisions:manifest.sourceRevisions,keys:manifest.tiles.map(t=>t.key)});await options.onProgress?.('shard-complete',i);
 }
 const manifest=releaseEra5Schema.parse({schemaVersion:3,releaseId,metadata,coverage:'explicit-cell-timezone-pairs; missing-is-unknown',shards});validateRelease(manifest);const bytes=Buffer.from(canonicalRelease(manifest)+'\n');if(bytes.length>4*1024*1024)throw Error('Release index byte bound');totalOutput+=bytes.length;check();await options.onProgress?.('before-manifest',shards.length);const pending=join(output,'.manifest.pending');if(await exists(pending))throw Error('Untracked root publication');await save(pending,manifest);check();await rename(pending,join(output,'manifest.json'));return {manifestPath:join(output,'manifest.json'),manifestSha256:releaseSha(bytes),releaseId,shardCount:shards.length,tileCount:shards.reduce((n,s)=>n+s.keys.length,0)};
 }finally{await lock.close();await unlink(lockPath);}
}



const configSchema=z.strictObject({inputs:z.array(z.strictObject({inputPath:z.string().min(1),expectedSha256:z.string().regex(/^[a-f0-9]{64}$/)})).min(1).max(1000),outputDirectory:z.string().min(1),generatedAt:z.iso.datetime(),maxTotalInputBytes:z.number().int().positive().max(1024*1024*1024),maxOutputBytes:z.number().int().positive().max(1024*1024*1024),maxDurationMs:z.number().int().positive().max(30*60*1000)});
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2);
 const required=(flag:string)=>{const i=args.indexOf(flag);if(i<0||!args[i+1])throw Error('Required '+flag);return args[i+1]!;};
 (async()=>{const path=resolve(required('--config')),pin=required('--expected-config-sha256');const bytes=await readTrustedClimateFile(path,pin,1024*1024);const raw=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));const options=raw.schemaVersion===6?(await import('./build-lineage-release')).lineageReleaseOptionsSchema.parse(raw):configSchema.parse(raw);console.log(JSON.stringify(await publishClimateRelease(options),null,2));})().catch(e=>{console.error(e instanceof Error?e.message:'Release publication failed');process.exitCode=1;});
}
