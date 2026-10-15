/** Retained-data engineering measurement only. No source acquisition or runtime mutation. */
import {readFile,writeFile,mkdir,readdir,stat} from 'node:fs/promises';
import {resolve,join,relative,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseDecodedChunk} from './chunks';
import {buildObservationAggregates} from './build-observation-aggregates';
import {publishClimateRelease} from './build-release';
import {planProductionHistory} from './plan-production-history';
import {releaseSha} from '../../server/providers/climate/releaseEra5';

export function assertNoRetainedRequests(requests:ReadonlyArray<{cellId:string;request:{year:string[];month:string[];day:string[];time:string[]}}>,retained:Map<string,Set<string>>){
 let proposed=0;const seen=new Set<string>();
 for(const proposal of requests)for(const year of proposal.request.year)for(const month of proposal.request.month)for(const day of proposal.request.day)for(const time of proposal.request.time){
  const at=`${year}-${month}-${day}T${time}:00Z`,key=`${proposal.cellId}|${at}`;
  if(retained.get(proposal.cellId)?.has(at))throw Error('Planner proposed retained cell-hour');
  if(seen.has(key))throw Error('Planner duplicated proposed cell-hour');seen.add(key);proposed++;
 }
 return proposed;
}
export function paddedPairHours(startNight:string,endNight:string,pairs:number){return ((Date.parse(endNight+'T00:00:00Z')-Date.parse(startNight+'T00:00:00Z'))/3600000+120)*pairs;}
async function bytesIn(root:string):Promise<number>{let bytes=0;for(const entry of await readdir(root,{withFileTypes:true})){const path=join(root,entry.name);bytes+=entry.isDirectory()?await bytesIn(path):(await stat(path)).size;}return bytes;}
async function pinned(path:string,sha:string){const bytes=await readFile(path);if(releaseSha(bytes)!==sha)throw Error('Retained input changed');return bytes;}
export async function measureRetainedHistory(repository:string,output:string){
 const start=performance.now(),beforeCpu=process.cpuUsage();await mkdir(output);const root=resolve(repository),grouped=join(root,'.data/era5/grouped-pilot-20261015-v1'),older=join(root,'.data/era5/history-1991-1992');
 const originalPins:{path:string;sha256:string;bytes:number}[]=[],completed:any[]=[],chunks:any[]=[],mappings=new Map<string,any>(),retained=new Map<string,Set<string>>();
 for(const sourceRoot of [grouped,older]){
  const ledgerPath=join(sourceRoot,'ledger.json'),manifestPath=join(sourceRoot,'manifest.json');
  const ledgerBytes=await readFile(ledgerPath),manifestBytes=await readFile(manifestPath),ledger=JSON.parse(ledgerBytes.toString()),manifest=JSON.parse(manifestBytes.toString());
  if(ledger.manifestSha256!==(sourceRoot===grouped?'5eb57ba09de53fd9c8881d66444e2aecf868b9640bc9e2ccaff982f132cc565d':'d0b21e1342e46648016a47585202ce032a557f8d6a9e4c9696a7ea0822208f8a'))throw Error('Selected retained manifest identity differs');
  const canonical=(v:any):any=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
  if(releaseSha(JSON.stringify(canonical(manifest)))!==ledger.manifestSha256)throw Error('Retained manifest pin differs');
  originalPins.push({path:ledgerPath,sha256:releaseSha(ledgerBytes),bytes:ledgerBytes.length},{path:manifestPath,sha256:releaseSha(manifestBytes),bytes:manifestBytes.length});
  for(const entry of ledger.entries){
   const rawPath=join(sourceRoot,'raw',entry.chunkId+'.nc');const raw=await pinned(rawPath,entry.rawSha256);originalPins.push({path:rawPath,sha256:entry.rawSha256,bytes:raw.length});
   if(entry.partitions){const path=join(sourceRoot,'decoded',entry.chunkId+'.json'),bytes=await pinned(path,entry.decodedSha256);if(JSON.stringify(JSON.parse(bytes.toString()))!==JSON.stringify(entry.partitions))throw Error('Retained partition index differs');originalPins.push({path,sha256:entry.decodedSha256,bytes:bytes.length});}
   for(const part of entry.partitions??[{...entry,path:'decoded/'+entry.chunkId+'.jsonl'}]){
    const path=join(sourceRoot,part.path),bytes=await pinned(path,part.decodedSha256),decoded=parseDecodedChunk(bytes.toString());
    if(decoded.header.sourceSha256!==entry.rawSha256||JSON.stringify(decoded.header.experimentVersions)!=='["0001"]')throw Error('Raw/revision lineage differs');
    originalPins.push({path,sha256:part.decodedSha256,bytes:bytes.length});
    // Copy bytes into fresh scratch so every producer uses its own bounded root.
    const name=(sourceRoot===grouped?'grouped-':'older-')+part.chunkId+'.jsonl';await writeFile(join(output,name),bytes,{flag:'wx'});
    completed.push({path:name,sha256:part.decodedSha256,rawSha256:entry.rawSha256,dataset:'reanalysis-era5-single-levels',variable:'total_cloud_cover',revision:'0001',member:0});
    for(const c of decoded.header.cells){const times=retained.get(c.cellId)??new Set<string>();for(const sample of decoded.samplesForCell(c.cellId))times.add(sample.atUtc);retained.set(c.cellId,times);}
    if(sourceRoot===grouped){chunks.push({id:part.chunkId,path:name,sha256:part.decodedSha256});for(const c of decoded.header.cells){const m=mappings.get(c.cellId)??{...c,timeZone:'Asia/Kolkata',chunkIds:[]};m.chunkIds.push(part.chunkId);mappings.set(c.cellId,m);}}
   }
  }
 }
 const period={startNight:'1991-03-01',endNight:'1992-03-31'},plan={schemaVersion:1,period,generatedAt:'2026-10-15T00:00:00Z',placeIndexVintage:'retained-pilot-explicit-grid-benchmark-only',chunks,mappings:[...mappings.values()]};
 const planText=JSON.stringify(plan),planPath=join(output,'observation-plan.json');await writeFile(planPath,planText,{flag:'wx'});
 const aggregateStarted=performance.now(),aggregateCpu=process.cpuUsage();const aggregate=await buildObservationAggregates({planPath,expectedPlanSha256:releaseSha(planText),outputPath:join(output,'observations.json'),maxDurationMs:20*60*1000,maxTotalInputBytes:16*1024*1024,maxOutputBytes:8*1024*1024});
 const aggregateWallSeconds=(performance.now()-aggregateStarted)/1000,usage=process.cpuUsage(aggregateCpu);
 const envelope=JSON.parse(await readFile(aggregate.outputPath,'utf8'));
 const denominator=envelope.tiles.reduce((n:number,t:any)=>n+t.bins.reduce((s:number,b:any)=>s+b.expected,0),0),valid=envelope.tiles.reduce((n:number,t:any)=>n+t.bins.reduce((s:number,b:any)=>s+b.valid,0),0);
 const release=await publishClimateRelease({inputs:[{inputPath:aggregate.outputPath,expectedSha256:aggregate.sha256}],outputDirectory:join(output,'release'),generatedAt:plan.generatedAt,maxDurationMs:60000,maxOutputBytes:16*1024*1024});
 const destinations=[...mappings.values()].map((m,i)=>({id:'benchmark-cell-'+i,name:'Explicit grid benchmark '+i,latitude:m.latitude,longitude:m.longitude,timeZone:m.timeZone,coordinateProvenance:'Retained NetCDF supplied grid coordinate',timezoneProvenance:'Asia/Kolkata selected benchmark zone; geographic assignment unverified',mappingProvenance:'Same explicit supplied grid point',uncertainty:'geographic-suitability-unverified',cell:{cellId:m.cellId,latitude:m.latitude,longitude:m.longitude}}));
 const inventory={schemaVersion:1,gazetteerEdition:'retained-grid-benchmark-only',timezoneVersion:'explicit-benchmark-zone',destinations,completed},inventoryText=JSON.stringify(inventory),inventoryPath=join(output,'inventory.json');await writeFile(inventoryPath,inventoryText,{flag:'wx'});
 const planner=await planProductionHistory({inventoryPath,expectedInventorySha256:releaseSha(inventoryText),outputPath:join(output,'nonexecuting-prefix.json'),prefixJobs:100,maxInputBytes:16*1024*1024,maxVerifiedCellHours:50000,maxDurationMs:60000});
 const checkedProposalCellHours=assertNoRetainedRequests(planner.manifest.prefix.requests,retained);
 for(const pin of originalPins)await pinned(pin.path,pin.sha256);
 const pairHours=paddedPairHours(period.startNight,period.endNight,mappings.size),cpu=process.cpuUsage(beforeCpu);
 const report={schemaVersion:1,runtime:{node:process.version,icu:process.versions.icu,tz:process.versions.tz,astronomy:envelope.manifest.versions.astronomy,timezone:envelope.manifest.versions.timezone},status:'offline-retained-sample-only',period,benchmarkZone:'Asia/Kolkata; selected engineering zone, geographic assignment unverified',pairCount:mappings.size,paddedPairHours:pairHours,sourceScalarCellHours:1488*mappings.size,aggregate:{cpuScope:"Main Node process; esbuild service CPU excluded",wallSeconds:aggregateWallSeconds,cpuSeconds:(usage.user+usage.system)/1e6,pairHoursPerSecond:pairHours/aggregateWallSeconds,pairHoursPerCpuSecond:pairHours/((usage.user+usage.system)/1e6),producerPreflightInputBytes:aggregate.sourceInputBytes,logicalDecodedBytesPerPass:chunks.reduce((n:number,c:any)=>n+originalPins.find(p=>p.sha256===c.sha256)!.bytes,0),logicalProducerReadBytes:2*Buffer.byteLength(planText)+chunks.reduce((n:number,c:any)=>n+(2+plan.mappings.filter(m=>m.chunkIds.includes(c.id)).length)*originalPins.find(p=>p.sha256===c.sha256)!.bytes,0),actualPhysicalReadBytes:null,outputBytes:aggregate.bytes,outputSha256:aggregate.sha256,expectedDarkHours:denominator,validDarkHours:valid,missingDarkHours:denominator-valid},release:{manifestSha256:release.manifestSha256,tileCount:release.tileCount,shardCount:release.shardCount,bytes:await bytesIn(join(output,'release'))},planner:{status:planner.manifest.status,sha256:planner.sha256,requirements:planner.manifest.requirements,prefixJobs:planner.manifest.prefix.jobs,checkedProposalCellHours,retainedOverlap:0},inputs:originalPins.map(p=>({...p,path:relative(root,p.path).replaceAll('\\','/')})),retainedPinsUnchanged:true,wallSeconds:(performance.now()-start)/1000,cpuSeconds:(cpu.user+cpu.system)/1e6,processPeakRssBytes:process.resourceUsage().maxRSS*1024,newBytesBeforeReport:await bytesIn(output)};
 await writeFile(join(output,'measurement.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});return report;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))measureRetainedHistory(resolve(process.argv[2]!),resolve(process.argv[3]!)).then(r=>console.log(JSON.stringify(r))).catch(e=>{console.error(e.message);process.exitCode=1;});
