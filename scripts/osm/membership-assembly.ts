import {open,mkdir,writeFile,lstat,rename,realpath} from 'node:fs/promises';
import {join,resolve,isAbsolute} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {parseArgs} from 'node:util';
import {verifyProductionAdmission} from './production-source-admission';
import * as z from 'zod4';
import {safe,buildSourceCatalogue,jsonlRows} from './build-source-catalogue';
import {buildBoundaryMetadata,buildPartitionedBoundaryMetadata} from './boundary-metadata';
import {verifyPlanetDomainFile} from './source-admission';
import {boundaryShards} from './partitioned-boundaries';
import {streamLimitsSchema,catalogueOptionsSchema,verifyMetadata} from './source-build-config';
import {partitionedAssemblyPlanSchema,partitionedAssemblyPlanV3Schema,partitionedRawManifestSchema,loadPartitionedCapacity,validatePartitionedCapacity,parsePartitionedControl,meterRead,meterOperation,type ControlMeter,type PartitionedAssemblyPlan,type AnyPartitionedAssemblyPlan,type PartitionedAssemblyPlanV3} from './partitioned-assembly-plan';
import {verifyNormalizedPartitions,iteratePartitionedCandidates,partitionCanonical,type SharedPartitionBudget} from './partitioned-candidates';

import {createBootstrapResources,createResourceSessionV3,validationRead,recordWrite,resourceCheckpoint,resourceSnapshotV3,type ResourceSessionV3} from './partitioned-resources';

const integer=(max:number)=>z.number().int().safe().min(1).max(max);
const pin=z.strictObject({path:z.string().refine(isAbsolute),bytes:z.number().int().safe().min(0).max(128*1024**2),sha256:z.string().regex(/^[a-f0-9]{64}$/)});
const domainPin=pin.extend({sourceId:z.string().regex(/^[A-Za-z0-9_-]{1,80}$/),kind:z.literal('planet-domain-v1'),bytes:integer(4*1024**2)});
const filePin=pin.omit({path:true});
const membership=z.strictObject({maxBoundaryBytes:integer(64*1024**2).optional(),maxVertices:integer(1000000).optional(),maxTotalVertices:integer(2000000).optional(),maxMilliseconds:integer(1800000).optional(),maxComparisons:integer(200000000).optional(),maxRows:integer(1000000).optional(),maxOutputBytes:integer(1024**3).optional()});
const planSchema=z.strictObject({schemaVersion:z.literal(1),geographyMode:z.enum(['all-nodes','selected-references']).optional(),sourceDomains:z.array(domainPin).min(1).max(64).optional(),boundaries:z.array(z.strictObject({input:pin,regionIds:z.array(z.string().min(1).max(200)).max(10000),unresolvedBoundaryIds:z.array(z.string().min(1).max(400)).max(10000).optional()})).min(1).max(100),footprints:pin,membership,stream:streamLimitsSchema,catalogue:catalogueOptionsSchema,retained:z.array(z.string().refine(isAbsolute)).max(100)});
async function small(path:string,max:number,meter?:ControlMeter){
 meterOperation(meter);
 const absolute=await safe(path),h=await open(absolute,'r');
 try{
  const before=await h.stat();if(!before.isFile()||before.size>max)throw new Error('Descriptor byte limit');
  meterRead(meter,before.size);const bytes=Buffer.alloc(before.size+(meter?0:1));let count=0;
  while(count<bytes.length){meterOperation(meter);const {bytesRead}=await h.read(bytes,count,bytes.length-count,null);if(!bytesRead)break;count+=bytesRead;}
  const after=await h.stat(),linked=await lstat(await safe(absolute));
  const state=(value:typeof before)=>[value.dev,value.ino,value.size,value.mtimeMs,value.ctimeMs].join(':');
  if(count!==before.size||count>max||state(before)!==state(after)||state(after)!==state(linked))throw new Error('Descriptor mutation/byte limit');
  return bytes.subarray(0,count);
 }finally{await h.close();}
}
export async function loadAssemblyPlan(path:string,sha256:string,meter?:ControlMeter){
 const body=await small(path,1024*1024,meter);if(!/^[a-f0-9]{64}$/.test(sha256)||createHash('sha256').update(body).digest('hex')!==sha256)throw new Error('Assembly digest mismatch');
 const decoded=JSON.parse(new TextDecoder('utf8',{fatal:true}).decode(body));
 const plan=decoded.schemaVersion===3?partitionedAssemblyPlanV3Schema.parse(parsePartitionedControl(body,meter)):decoded.schemaVersion===2?partitionedAssemblyPlanSchema.parse(parsePartitionedControl(body,meter)):planSchema.parse(decoded);
 if(plan.schemaVersion===2||plan.schemaVersion===3)await loadPartitionedCapacity(plan,undefined,meter);
 if(new Set((plan.sourceDomains??[]).map(d=>d.sourceId)).size!==(plan.sourceDomains??[]).length)throw new Error('Duplicate planet domain source');
 const session=meter?.kind==='session'?meter.resources:undefined;
 const accounting=session?Object.assign(session.metadata,{onRead:(bytes:number)=>validationRead(session,bytes,0,'control-and-admission'),checkpoint:()=>resourceCheckpoint(session)}):undefined;
 for(const domain of plan.sourceDomains??[])await verifyPlanetDomainFile(domain.path,{bytes:domain.bytes,sha256:domain.sha256},accounting);
 const staged=plan.boundaries.map((s,i)=>({...s,input:{...s.input,path:`boundary-${i}.json`}}));boundaryShards.parse(staged);
 if(plan.boundaries.reduce((n,s)=>n+s.input.bytes,0)>(plan.membership.maxBoundaryBytes??16*1024**2))throw new Error('Aggregate boundary byte budget');
 for(const item of plan.boundaries.map(s=>s.input))await copyPinned(item,undefined,session,'control-and-admission');
 if(session){
  const partitionBudget:SharedPartitionBudget={bytes:0,rows:0,work:0,maxBytes:session.limits.validation.maxReadBytes,maxRows:Math.min(session.limits.validation.maxRowsRead,session.limits.validation.maxReadBytes),maxWork:session.limits.validation.maxOperations,deadline:session.deadline,metadata:session.metadata,resourceSession:session,accounting:'read',readScope:'control-and-admission'};
  for await(const row of jsonlRows(plan.footprints.path,{...plan.stream,maxRows:10000,pin:plan.footprints,partitionBudget})){void row;}
 }else await verifyMetadata(plan.footprints.path,plan.footprints,plan.stream);
 return plan;
}
/** Bounded, exclusive copy; pins are checked over exactly the bytes copied. */
async function copyPinned(input:z.infer<typeof pin>,output?:string,session?:ResourceSessionV3,scope:'body'|'control-and-admission'='body'){
 if(session)resourceCheckpoint(session);
 const h=await open(await safe(input.path),'r');let out:Awaited<ReturnType<typeof open>>|undefined;
 try{if(output)out=await open(output,'wx');const before=await h.stat();if(!before.isFile()||before.size!==input.bytes)throw new Error('Input size pin mismatch');if(session)validationRead(session,input.bytes,0,scope);let total=0;const hash=createHash('sha256'),buffer=Buffer.alloc(65536);
  while(true){if(session){resourceCheckpoint(session);if(total===input.bytes)break;}const {bytesRead}=await h.read(buffer,0,session?Math.min(buffer.length,input.bytes-total):buffer.length,null);if(!bytesRead)break;total+=bytesRead;if(total>input.bytes)throw new Error('Input grew');const chunk=buffer.subarray(0,bytesRead);hash.update(chunk);if(out){if(session)recordWrite(session,'boundary-staging',chunk.length);await out.writeFile(chunk);}}
  const after=await h.stat(),linked=await lstat(await safe(input.path));const state=(value:typeof before)=>[value.dev,value.ino,value.size,value.mtimeMs,value.ctimeMs].join(':');if(total!==input.bytes||before.size!==after.size||before.mtimeMs!==after.mtimeMs||session&&(state(before)!==state(after)||state(after)!==state(linked))||hash.digest('hex')!==input.sha256)throw new Error('Input mutation/digest mismatch');
 }finally{await h.close();await out?.close();}
}
type ProductionGate={manifestPath:string;admissionPath:string;admissionSha256:string;expectedSnapshot?:string};
export async function prepareAssemblyInputs(planPath:string,sha256:string,input:z.infer<typeof pin>,output:string){
 await loadAssemblyPlan(planPath,sha256);
 if(input.bytes>1024*1024)throw new Error('Manifest byte limit');
 await copyPinned(pin.parse(input),output);
}
/** Library primitive; executable production entry points always provide a fixed-authority gate. */
export async function assembleMembership(planPath:string,sha256:string,producer:string,root:string,admission?:ProductionGate,partitionedManifestPath?:string){
 const startedAt=Date.now(),bootstrap=createBootstrapResources(startedAt),bootstrapMeter:ControlMeter={kind:'bootstrap',resources:bootstrap,startedAt};
 const probe=await small(planPath,1024*1024,bootstrapMeter),version=JSON.parse(new TextDecoder('utf8',{fatal:true}).decode(probe)).schemaVersion;
 if(version===3){
  if(createHash('sha256').update(probe).digest('hex')!==sha256)throw new Error('Assembly digest mismatch');
  const plan=partitionedAssemblyPlanV3Schema.parse(parsePartitionedControl(probe,bootstrapMeter));
  const capacity=await loadPartitionedCapacity(plan,undefined,bootstrapMeter),manifestPath=admission?.manifestPath??partitionedManifestPath;
  if(!manifestPath)throw new Error('Exact version-2 raw manifest required');
  const rawBody=await small(manifestPath,1024*1024,bootstrapMeter),raw=partitionedRawManifestSchema.parse(parsePartitionedControl(rawBody,bootstrapMeter));validatePartitionedCapacity(plan,capacity,raw);
  const session=createResourceSessionV3({validation:plan.validation,maxGeometryComparisons:plan.membership.maxGeometryComparisons,maxMilliseconds:plan.membership.maxMilliseconds},bootstrap),meter:ControlMeter={kind:'session',resources:session};
  const admitted=admission?await verifyProductionAdmission({...admission,phase:'assembly-before',expectedPlanPath:planPath,expectedPlanSha256:sha256,resourceSession:session}):undefined;
  const loaded=await loadAssemblyPlan(planPath,sha256,meter);if(loaded.schemaVersion!==3)throw new Error('Version-three assembly plan required');await safe(root);
  return assemblePartitioned(loaded,planPath,sha256,producer,root,manifestPath,admission,admitted,session);
 }
 const admitted=admission?await verifyProductionAdmission({...admission,phase:'assembly-before',expectedPlanPath:planPath,expectedPlanSha256:sha256}):undefined;
 const plan=await loadAssemblyPlan(planPath,sha256);await safe(root);
 if(plan.schemaVersion===2)return assemblePartitioned(plan,planPath,sha256,producer,root,admission?.manifestPath??partitionedManifestPath,admission,admitted);
 const original=await small(join(producer,'complete.json'),1024*1024),done=JSON.parse(original.toString('utf8'));
 if(done.schemaVersion!==1||!done.files?.['candidates.jsonl'])throw new Error('Producer completion required');
 if((done.admissionSnapshotSha256??undefined)!==admitted?.snapshotSha256)throw new Error('Producer admission identity mismatch');
 if(admitted&&(done.manifestSha256!==admitted.producerManifestSha256||done.policy!==admitted.policy||done.catalogueRevision!==admitted.producerCatalogueRevision))throw new Error('Producer admitted manifest/policy/revision mismatch');
 if(Object.keys(done.files).sort().join(',')!=='candidates.jsonl,exclusions.jsonl,lineage.jsonl')throw new Error('Complete raw producer evidence required');
 if((done.geographyMode??'all-nodes')!==(plan.geographyMode??'all-nodes'))throw new Error('Producer geography mode mismatch');
 const domains=z.array(domainPin).max(64).parse(done.sourceDomains??[]);
 if(JSON.stringify(domains)!==JSON.stringify(plan.sourceDomains??[]))throw new Error('Producer planet domain mismatch');
 const producerPins=[];
 for(const [name,value] of Object.entries(done.files)){if(!['candidates.jsonl','lineage.jsonl','exclusions.jsonl'].includes(name))throw new Error('Unknown producer evidence');const item=pin.parse({...filePin.parse(value),path:join(await safe(producer),name)});await copyPinned(item);producerPins.push(item);}
 const candidate=pin.parse({...filePin.parse(done.files['candidates.jsonl']),path:join(await safe(producer),'candidates.jsonl')});
 const stage=join(root,'membership-input');await mkdir(stage);
 const shards=[];
 for(const [i,spec] of plan.boundaries.entries()){const name=`boundary-${i}.json`;await copyPinned(spec.input,join(stage,name));shards.push({...spec,input:{...spec.input,path:name}});}
 await copyPinned(candidate,join(stage,'candidates.jsonl'));
 const descriptor=join(stage,'input.json');await writeFile(descriptor,JSON.stringify({schemaVersion:2,catalogueRevision:done.catalogueRevision,boundaries:shards,candidates:{...candidate,path:'candidates.jsonl'}}),{flag:'wx'});
 const enriched=await buildBoundaryMetadata(descriptor,join(root,'membership'),plan.membership);
 const config={schemaVersion:1 as const,catalogueRevision:done.catalogueRevision,stream:plan.stream,catalogue:plan.catalogue,files:{regions:enriched.files['regions.jsonl'],footprints:{bytes:plan.footprints.bytes,sha256:plan.footprints.sha256}}};
 const catalogue=await buildSourceCatalogue({producerDir:join(root,'membership'),regions:join(root,'membership','regions.jsonl'),footprints:plan.footprints.path,config},join(root,'catalogue'));
 if(!(await small(join(producer,'complete.json'),1024*1024)).equals(original))throw new Error('Producer descriptor mutation');
 for(const item of producerPins)await copyPinned(item);
 await loadAssemblyPlan(planPath,sha256);
 if(admission)await verifyProductionAdmission({...admission,phase:'assembly-after',expectedSnapshot:admitted!.snapshotSha256,expectedPlanPath:planPath,expectedPlanSha256:sha256});
 const evidence={schemaVersion:1,...(admitted?{admissionSnapshotSha256:admitted.snapshotSha256}:{}),planSha256:sha256,producerDirectory:producer,producerDescriptor:done,producerDescriptorSha256:createHash('sha256').update(original).digest('hex'),catalogue,membership:enriched,sourceCoverage:plan.footprints.bytes===0?'unknown; no extraction footprints admitted':'only supplied pinned footprints; administrative membership does not establish source coverage'};
 await writeFile(join(root,'assembly-complete.json'),JSON.stringify(evidence)+'\n',{flag:'wx'});return evidence;
}
async function assemblePartitioned(plan:AnyPartitionedAssemblyPlan,planPath:string,planSha256:string,producer:string,root:string,manifestPath:string|undefined,admission:ProductionGate|undefined,admitted:Awaited<ReturnType<typeof verifyProductionAdmission>>|undefined,session?:ResourceSessionV3){
 const meter:ControlMeter|undefined=session?{kind:'session',resources:session}:undefined;
 if(plan.schemaVersion===3&&!session)throw new Error('Version-three resource session required');
 if(!manifestPath)throw new Error('Exact version-2 raw manifest required');
 const rawBody=await small(manifestPath,1024*1024,meter),raw=partitionedRawManifestSchema.parse(parsePartitionedControl(rawBody,meter));
 await loadPartitionedCapacity(plan,raw,meter);
 const rawManifestSha256=createHash('sha256').update(partitionCanonical(raw)).digest('hex');
 const revisionIdentity={policy:raw.policy,evidenceLayout:raw.evidenceLayout,sources:raw.sources.map(source=>Object.fromEntries(Object.entries(source).filter(([key])=>key!=='path').map(([key,value])=>[key,key==='sourceDomain'?Object.fromEntries(Object.entries(value as Record<string,unknown>).filter(([key])=>key!=='path')):value])))};
 const catalogueRevision='osm-'+createHash('sha256').update(partitionCanonical(revisionIdentity)).digest('hex');
 if(admitted&&(admitted.producerManifestSha256!==rawManifestSha256||admitted.producerCatalogueRevision!==catalogueRevision))throw new Error('Partitioned admitted producer identity mismatch');
 const domains=raw.sources.flatMap(source=>source.sourceDomain?[{sourceId:source.id,...source.sourceDomain}]:[]);
 if(partitionCanonical(domains)!==partitionCanonical(plan.sourceDomains??[]))throw new Error('Partitioned source-domain inventory mismatch');
 const completePath=join(await safe(producer),'complete.json'),completeBody=await small(completePath,1024*1024,meter);
 const completionPin={path:completePath,bytes:completeBody.length,sha256:createHash('sha256').update(completeBody).digest('hex')};
 const maxReadBytes=plan.schemaVersion===3?plan.validation.maxReadBytes:4*(plan.maxNormalizedOutputBytes+plan.membership.maxOutputBytes+plan.footprints.bytes)+8*1024**2;
 if(!Number.isSafeInteger(maxReadBytes))throw new Error('Unsafe aggregate verification allocation');
 const budget:SharedPartitionBudget={bytes:0,rows:0,work:0,maxBytes:maxReadBytes,maxRows:plan.schemaVersion===3?plan.validation.maxRowsRead:maxReadBytes,maxWork:plan.schemaVersion===3?plan.validation.maxOperations:plan.membership.maxComparisons,deadline:session?.deadline??Date.now()+plan.membership.maxMilliseconds,metadata:session?.metadata??{bytes:0,ceiling:32*1024**2,paths:new Map()},...(session?{resourceSession:session,accounting:'read' as const}:{})};
 // Continue the admission allocation; partition descriptors do not receive a
 // second 32MiB metadata allowance. Geometry/code/JSONL bodies are excluded.
 const metadataPins=admitted?.metadataPins??[
  {path:manifestPath,bytes:rawBody.length},
  {path:planPath,bytes:(await lstat(await safe(planPath))).size},plan.capacityPlan,
  ...domains,
 ];
 for(const pin of metadataPins){const path=await realpath(await safe(pin.path)),old=budget.metadata!.paths.get(path);if(old!==undefined&&old!==pin.bytes)throw new Error('Shared metadata size mutation');if(old===undefined){const bytes=budget.metadata!.bytes+pin.bytes;if(!Number.isSafeInteger(bytes)||bytes>budget.metadata!.ceiling)throw new Error('Shared metadata byte budget');budget.metadata!.bytes=bytes;budget.metadata!.paths.set(path,pin.bytes);}}
 const expected={manifestSha256:rawManifestSha256,catalogueRevision,policy:raw.policy,geographyMode:plan.geographyMode??'all-nodes' as const,sourceDomains:domains,admissionSnapshotSha256:admitted?.snapshotSha256,sources:raw.sources.map(({id,url,sha256,vintage,attribution,licenseUrl})=>({id,url,sha256,vintage,attribution,licenseUrl})),maxNormalizedOutputBytes:plan.maxNormalizedOutputBytes,maxCandidateInputBytes:plan.maxCandidateInputBytes,evidenceLayout:plan.evidenceLayout};
 const verified=await verifyNormalizedPartitions(producer,completionPin,expected,budget);
 const stage=join(root,'membership-input');await mkdir(stage);
 const shards=[];
 for(const [i,spec] of plan.boundaries.entries()){const name=`boundary-${i}.json`;await copyPinned(spec.input,join(stage,name),session);shards.push({...spec,input:{...spec.input,path:name}});}
 const descriptor=join(stage,'input.json'),descriptorBody=JSON.stringify({schemaVersion:3,catalogueRevision,boundaries:shards});if(session)recordWrite(session,'assembly',Buffer.byteLength(descriptorBody));await writeFile(descriptor,descriptorBody,{flag:'wx'});
 const enriched=await buildPartitionedBoundaryMetadata(descriptor,join(root,'membership'),{
  rows:iteratePartitionedCandidates(verified,budget),budget,...(session?{membershipVersion:3 as const,resourceSession:session}:{}),producerDescriptorSha256:completionPin.sha256,planSha256,admissionSnapshotSha256:admitted?.snapshotSha256,expectedCandidates:verified.completion.counts.accepted,
  inputIdentity:{rawStreams:verified.completion.streams,counts:verified.completion.counts,boundaryPins:plan.boundaries.map(s=>s.input),footprintPin:plan.footprints},
 },plan.membership);
 await verifyNormalizedPartitions(producer,completionPin,expected,budget);
 const config={schemaVersion:1 as const,catalogueRevision,stream:plan.stream,catalogue:plan.catalogue,files:{regions:enriched.files['regions.jsonl'],footprints:{bytes:plan.footprints.bytes,sha256:plan.footprints.sha256}}};
 const membershipBody=JSON.stringify(enriched)+'\n';
 const expectedMembershipPin={path:join(root,'membership','complete.json'),bytes:Buffer.byteLength(membershipBody),sha256:createHash('sha256').update(membershipBody).digest('hex')};
 let reverifyMembership:(()=>Promise<void>)|undefined;
 const catalogue=await buildSourceCatalogue({producerDir:join(root,'membership'),regions:join(root,'membership','regions.jsonl'),footprints:plan.footprints.path,config,partitionBudget:budget,...(session?{expectedMembershipVersion:3 as const,resourceSession:session}:{}),expectedMembershipPin,capturePartitionedVerifier:verify=>{reverifyMembership=verify;},expectedCandidates:verified.completion.counts.accepted},join(root,'catalogue'));
 await loadAssemblyPlan(planPath,planSha256,meter);
 if(!(await small(manifestPath,1024*1024,meter)).equals(rawBody))throw new Error('Raw manifest changed during partitioned assembly');
 if(session)resourceCheckpoint(session);else if(Date.now()>=budget.deadline||++budget.work>budget.maxWork)throw new Error('Shared partition assembly budget exhausted');
 if(admission)await verifyProductionAdmission({...admission,phase:'assembly-after',expectedSnapshot:admitted!.snapshotSha256,...(session?{resourceSession:session}:{})});
 await verifyNormalizedPartitions(producer,completionPin,expected,budget);
 if(!reverifyMembership)throw new Error('Partitioned membership final verifier required');await reverifyMembership();
 if(session)resourceCheckpoint(session);else if(Date.now()>=budget.deadline||++budget.work>budget.maxWork)throw new Error('Shared partition assembly budget exhausted');
 if(!(await small(expectedMembershipPin.path,1024*1024,meter)).equals(Buffer.from(membershipBody)))throw new Error('Fresh membership completion changed before assembly commit');
 const evidence={schemaVersion:plan.schemaVersion,kind:'partitioned-geography-assembly-v1',...(admitted?{admissionSnapshotSha256:admitted.snapshotSha256}:{}),planSha256,producerDirectory:producer,producerDescriptor:verified.completion,producerDescriptorSha256:completionPin.sha256,catalogue,membership:enriched,sourceCoverage:plan.footprints.bytes===0?'unknown; no extraction footprints admitted':'only supplied pinned footprints; administrative membership does not establish source coverage',verification:session?resourceSnapshotV3(session):{bytes:budget.bytes,rows:budget.rows,work:budget.work,deadline:budget.deadline}};
 let encoded=JSON.stringify(evidence)+'\n';
 if(session&&'writes' in evidence.verification){
  // Reserve write/commit checks before freezing the final resource witness.
  resourceCheckpoint(session);resourceCheckpoint(session);
  const baseline=resourceSnapshotV3(session);
  for(let i=0;i<16;i++){
   const previous=Buffer.byteLength(encoded);
   evidence.verification={...baseline,validation:{...baseline.validation,operations:baseline.validation.operations+1},writes:{...baseline.writes,assembly:{...baseline.writes.assembly,bytes:baseline.writes.assembly.bytes+previous}}};
   encoded=JSON.stringify(evidence)+'\n';if(Buffer.byteLength(encoded)===previous)break;if(i===15)throw new Error('Assembly resource descriptor accounting');
  }
  recordWrite(session,'assembly',Buffer.byteLength(encoded));
 }
 if(Buffer.byteLength(encoded)>1024*1024)throw new Error('Assembly evidence byte limit');
 const pending=join(root,'assembly-complete.pending');await writeFile(pending,encoded,{flag:'wx'});
 if(session){session.signal?.throwIfAborted();if(Date.now()>=session.deadline)throw new Error('Resource deadline before assembly commit');}else if(Date.now()>=budget.deadline||++budget.work>budget.maxWork)throw new Error('Shared partition assembly budget exhausted before commit');
 await rename(pending,join(root,'assembly-complete.json'));return evidence;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const {values,positionals:args}=parseArgs({options:{admission:{type:'string'},'admission-sha256':{type:'string'},'admission-snapshot':{type:'string'},manifest:{type:'string'},prepare:{type:'boolean'},validate:{type:'boolean'}},allowPositionals:true});
 if(values.validate&&args.length===2&&!values.prepare){await loadAssemblyPlan(args[0],args[1]);}
 else{
  if(!values.admission||!values['admission-sha256'])throw new Error('Production admission file and exact digest required');
  const manifestPath=values.prepare?args[2]:values.manifest;
  if(!manifestPath)throw new Error('Exact admitted manifest required');
  const admission={manifestPath,admissionPath:values.admission,admissionSha256:values['admission-sha256'],expectedSnapshot:values['admission-snapshot']};
  if(values.prepare&&args.length===6){
   const admitted=await verifyProductionAdmission({...admission,phase:'preflight',expectedPlanPath:args[0],expectedPlanSha256:args[1]});
   await prepareAssemblyInputs(args[0],args[1],pin.parse({path:args[2],bytes:Number(args[3]),sha256:args[4]}),args[5]);
   await verifyProductionAdmission({...admission,phase:'preflight',expectedSnapshot:admitted.snapshotSha256,expectedPlanPath:args[0],expectedPlanSha256:args[1]});
  }else if(!values.prepare&&args.length===4)await assembleMembership(args[0],args[1],args[2],args[3],admission);
  else throw new Error('Usage: membership-assembly.ts [--prepare] PLAN SHA256 ... --admission FILE --admission-sha256 SHA256 [--admission-snapshot SHA256] [--manifest FILE]');
 }
}
