/** Production identity binding. No acquisition, candidate-selected authority or runtime publication. */
import {createHash} from 'node:crypto';
import {lstat,open,realpath} from 'node:fs/promises';
import {dirname,isAbsolute,join,parse,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import * as z from 'zod4';
import {partitionedRawManifestSchema,partitionedAssemblyPlanSchema,partitionedAssemblyPlanV3Schema,validatePartitionedCapacity,parsePartitionedControl} from './partitioned-assembly-plan';
import {
 validateProductionSourceAdmissionFiles,validateSourceAdmissionMetadataFiles,
 boundaryNormalizationLineageSchema,
} from './source-admission';

import {validationRead,resourceCheckpoint,type ResourceSessionV3} from './partitioned-resources';

const MiB=1024**2, MAX_METADATA=32*MiB, MAX_GEOMETRY=64*MiB;
const sha=z.string().regex(/^[a-f0-9]{64}$/);
const absolute=z.string().max(4096).refine(isAbsolute,'Absolute path required');
const pin=z.strictObject({path:absolute,bytes:z.number().int().safe().min(0).max(128*MiB),sha256:sha});
const metadataPin=pin.extend({bytes:z.number().int().safe().positive().max(4*MiB)});
const sourceId=z.string().regex(/^[A-Za-z0-9_-]{1,80}$/);
export const productionAdmissionEnvelopeSchema=z.strictObject({
 schemaVersion:z.literal(1),kind:z.literal('production-source-admission-v1'),
 manifest:metadataPin.extend({bytes:z.number().int().safe().positive().max(MiB)}),
 assemblyPlan:metadataPin.extend({bytes:z.number().int().safe().positive().max(MiB)}),
 rawSources:z.array(z.strictObject({sourceId,bundle:metadataPin})).min(1).max(64),
 boundaries:z.array(z.strictObject({boundaryIndex:z.number().int().min(0).max(99),
  bindings:z.array(z.strictObject({bundle:metadataPin,lineage:metadataPin})).min(1).max(64)})).min(1).max(100),
});
const legacyRawSchema=z.object({schemaVersion:z.literal(1),policy:z.literal('named-complete-way-v1-polar85'),
 sources:z.array(z.object({id:sourceId,path:absolute,url:z.string(),bytes:z.number().int().safe().positive(),sha256:sha,
  vintage:z.string(),clipSha256:sha.optional(),sourceDomain:metadataPin.extend({kind:z.literal('planet-domain-v1')}).optional()}).passthrough()).min(1).max(64),
}).passthrough();
const legacyPlanSchema=z.object({schemaVersion:z.literal(1),boundaries:z.array(z.object({input:pin}).passthrough()).min(1).max(100),
 footprints:pin,sourceDomains:z.array(metadataPin.extend({kind:z.literal('planet-domain-v1'),sourceId})).max(64).optional(),
}).passthrough();
const rawSchema=z.union([legacyRawSchema,partitionedRawManifestSchema]);
const planSchema=z.union([legacyPlanSchema,partitionedAssemblyPlanSchema,partitionedAssemblyPlanV3Schema]);
export type ProductionAdmissionPin=z.infer<typeof pin>;
export interface ProductionAdmissionOptions {
 manifestPath:string; admissionPath:string; admissionSha256:string; phase:string;
 expectedSnapshot?:string|{snapshotSha256:string}; expectedPlanPath?:string; expectedPlanSha256?:string; resourceSession?:ResourceSessionV3;
}
type TestContext=Parameters<typeof validateSourceAdmissionMetadataFiles>[1];
const phases=new Set(['preflight','raw-before','raw-after','assembly-before','assembly-after','resume']);
const repo=fileURLToPath(new URL('../../',import.meta.url));
export const productionAdmissionCodeFiles=Object.freeze([
 'scripts/osm/production-source-admission.ts','scripts/osm/source-admission.ts',
 'scripts/osm/natural-earth-policy.ts','scripts/osm/production_admission.py',
 // Repository-owned membership executable closure; keep the Python bridge in the same order.
 'scripts/osm/membership-assembly.ts','scripts/osm/boundary-metadata.ts',
 'scripts/osm/partitioned-boundaries.ts','scripts/osm/geographic-geometry.ts',
 'scripts/osm/build-source-catalogue.ts','scripts/osm/source-build-config.ts',
 'scripts/osm/build-streamed-catalogue.ts','scripts/osm/normalized-input-bytes.ts',
 'server/places/catalogueFormat.ts','shared/nightsky/discovery.ts',
 'shared/nightsky/common.ts','shared/nightsky/places.ts',
 'scripts/osm/partitioned-assembly-plan.ts',
 'scripts/osm/partitioned-candidates.ts',
 'scripts/osm/partitioned-resources.ts',
 'scripts/osm/geography-capacity-plan.ts',
 'scripts/osm/global_source.py',
 'scripts/osm/normalized_partitions.py',
 'scripts/osm/spot_paths.py',
 'scripts/osm/supervised_membership_assembly.py',
 'scripts/osm/global_source_supervisor.py',
 'scripts/osm/production-type-loader.mjs',
]);
function canonical(value:unknown):string {
 if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
 if(value!==null&&typeof value==='object')return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical((value as Record<string,unknown>)[k])).join(',')+'}';
 return JSON.stringify(value);
}
const hash=(body:Buffer|string)=>createHash('sha256').update(body).digest('hex');
async function safePath(value:string,session?:ResourceSessionV3){
 if(session)resourceCheckpoint(session);
 if(!isAbsolute(value)||value.length>4096||value.split(/[\\/]/).includes('..')||/^[\\/]{2}/.test(value))throw new Error('Unsafe admission path');
 const drive=/^[a-z]:[\\/]/i.test(value), components=(drive?value.slice(3):value.slice(1)).split(/[\\/]/);
 if(components.some(v=>!v||v==='.'||/[.\s]$/.test(v)||/[\x00-\x1f\x7f<>:"|?*]/.test(v)||/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(v)))throw new Error('Unsafe admission path component');
 let cursor=parse(value).root;
 for(const part of value.slice(cursor.length).split(/[\\/]/).filter(Boolean)){
  if(session)resourceCheckpoint(session);cursor=join(cursor,part);if((await lstat(cursor)).isSymbolicLink())throw new Error('Admission symlink/reparse refused');
 }
 const canonical=await realpath(resolve(value));if(session)resourceCheckpoint(session);return canonical;
}
function state(s:Awaited<ReturnType<typeof lstat>>){return [s.dev,s.ino,s.size,s.mtimeMs,s.ctimeMs].join(':');}
const decode=(body:Buffer)=>JSON.parse(new TextDecoder('utf8',{fatal:true}).decode(body));
function producerIntegers(value:unknown):void {
 if(typeof value==='number'&&!Number.isSafeInteger(value))throw new Error('Producer manifest requires exact safe integral JSON numbers');
 if(Array.isArray(value))for(const item of value)producerIntegers(item);
 else if(value!==null&&typeof value==='object')for(const item of Object.values(value))producerIntegers(item);
}

async function verify(options:ProductionAdmissionOptions,context?:TestContext){
 if(!phases.has(options.phase))throw new Error('Unknown admission phase');
 sha.parse(options.admissionSha256);
 let geometryBytes=0,boundaryBytes=0;
 const session=options.resourceSession;
 const checkedPath=(value:string)=>safePath(value,session);
 const sharedMetadata=session?Object.assign(session.metadata,{onRead:(bytes:number)=>validationRead(session,bytes,0,'control-and-admission'),checkpoint:()=>resourceCheckpoint(session)}):{bytes:0,ceiling:MAX_METADATA,paths:new Map<string,number>()};
 const seen=new Map<string,ProductionAdmissionPin>(),codePins:ProductionAdmissionPin[]=[],geometryPins:ProductionAdmissionPin[]=[];
 async function read(path:string,ceiling:number,expected?:Pick<ProductionAdmissionPin,'bytes'|'sha256'>,kind:'metadata'|'geometry'|'footprints'|'code'='metadata',recheck=false){
  if(session)resourceCheckpoint(session);const absolute=await checkedPath(path),handle=await open(absolute,'r');
  try{
   const before=await handle.stat();
   if(!before.isFile()||before.size>ceiling||expected&&before.size!==expected.bytes)throw new Error('Admission input size/pin limit');
   if(kind==='metadata'&&!recheck){
    const previous=sharedMetadata.paths.get(absolute);
    if(previous!==undefined&&previous!==before.size)throw new Error('Shared admission metadata size changed');
    if(previous===undefined){if(sharedMetadata.bytes+before.size>sharedMetadata.ceiling)throw new Error('Aggregate admission metadata byte limit');sharedMetadata.bytes+=before.size;sharedMetadata.paths.set(absolute,before.size);}
   }
   if(session)validationRead(session,before.size,0,'control-and-admission');
   const body=Buffer.alloc(before.size),digest=createHash('sha256');let offset=0;
   while(offset<body.length){if(session)resourceCheckpoint(session);const result=await handle.read(body,offset,Math.min(65536,body.length-offset),null);if(!result.bytesRead)throw new Error('Admission short/mutating input');digest.update(body.subarray(offset,offset+result.bytesRead));offset+=result.bytesRead;}
   const extra=Buffer.alloc(1);if(!session&&(await handle.read(extra,0,1,null)).bytesRead)throw new Error('Admission input grew');
   const after=await handle.stat(),linked=await lstat(await checkedPath(absolute)),actual={path:absolute,bytes:body.length,sha256:digest.digest('hex')};
   if(state(before)!==state(after)||state(after)!==state(linked)||expected&&actual.sha256!==expected.sha256)throw new Error('Admission input mutation/digest mismatch');
   const prior=seen.get(absolute);if(prior&&canonical(prior)!==canonical(actual))throw new Error('Admission snapshot input changed');
   if(!prior&&!recheck){
    if(kind==='geometry'||kind==='footprints'){geometryBytes+=actual.bytes;if(kind==='geometry'){boundaryBytes+=actual.bytes;if(boundaryBytes>MAX_GEOMETRY)throw new Error('Aggregate admission boundary byte limit');}geometryPins.push(actual);}
    else if(kind==='metadata'){/* Reserved before the first metadata body read. */}
    else codePins.push(actual);
    seen.set(absolute,actual);
   }
   return {body,pin:actual};
  }finally{await handle.close();}
 }
 for(const file of productionAdmissionCodeFiles)await read(join(repo,file),MiB,undefined,'code');
 const admissionRead=await read(options.admissionPath,MiB);
 if(admissionRead.pin.sha256!==options.admissionSha256)throw new Error('Production admission envelope digest mismatch');
 const envelope=productionAdmissionEnvelopeSchema.parse(decode(admissionRead.body));
 if(await checkedPath(options.manifestPath)!==await checkedPath(envelope.manifest.path))throw new Error('Exact raw manifest path binding mismatch');
 if(options.expectedPlanPath&&await checkedPath(options.expectedPlanPath)!==await checkedPath(envelope.assemblyPlan.path))throw new Error('Exact assembly plan path binding mismatch');
 if(options.expectedPlanSha256&&options.expectedPlanSha256!==envelope.assemblyPlan.sha256)throw new Error('Exact assembly plan digest binding mismatch');
 const manifestRead=await read(envelope.manifest.path,MiB,envelope.manifest),planRead=await read(envelope.assemblyPlan.path,MiB,envelope.assemblyPlan);
 const rawDecoded=decode(manifestRead.body),planDecoded=decode(planRead.body);
 const manifest=rawSchema.parse(rawDecoded.schemaVersion===2?parsePartitionedControl(manifestRead.body,session?{kind:'session',resources:session}:undefined):rawDecoded),plan=planSchema.parse([2,3].includes(planDecoded.schemaVersion)?parsePartitionedControl(planRead.body,session?{kind:'session',resources:session}:undefined):planDecoded);
 producerIntegers(manifest);
 if(!((manifest.schemaVersion===1&&plan.schemaVersion===1)||(manifest.schemaVersion===2&&(plan.schemaVersion===2||plan.schemaVersion===3))))throw new Error('Raw manifest/assembly layout version mismatch');
 if(plan.schemaVersion===3&&['assembly-before','assembly-after'].includes(options.phase)&&!session)throw new Error('Version-three assembly resource session required');
 if(plan.schemaVersion===2||plan.schemaVersion===3){
  const capacity=await read(plan.capacityPlan.path,65536,plan.capacityPlan);
  validatePartitionedCapacity(plan,parsePartitionedControl(capacity.body,session?{kind:'session',resources:session}:undefined),manifest);
  if(plan.schemaVersion===3&&session&&(canonical(session.limits.validation)!==canonical(plan.validation)||session.limits.maxGeometryComparisons!==plan.membership.maxGeometryComparisons||session.limits.maxMilliseconds!==plan.membership.maxMilliseconds))throw new Error('Version-three admitted resource controls mismatch');
 }
 if(plan.boundaries.reduce((total,boundary)=>total+boundary.input.bytes,0)>MAX_GEOMETRY)throw new Error('Aggregate admission boundary byte limit');
 if(new Set(manifest.sources.map(s=>s.id)).size!==manifest.sources.length||new Set(envelope.rawSources.map(s=>s.sourceId)).size!==envelope.rawSources.length)throw new Error('Duplicate raw source admission binding');
 if(envelope.rawSources.length!==manifest.sources.length||envelope.boundaries.length!==plan.boundaries.length||new Set(envelope.boundaries.map(s=>s.boundaryIndex)).size!==envelope.boundaries.length)throw new Error('Complete exact source/boundary admission inventory required');
 const bundleCache=new Map<string,Awaited<ReturnType<typeof validateProductionSourceAdmissionFiles>>>();
 async function bundle(expected:ProductionAdmissionPin){
  const loaded=await read(expected.path,4*MiB,expected),key=canonical(loaded.pin);let result=bundleCache.get(key);
  if(!result){
   result=context?await validateSourceAdmissionMetadataFiles(loaded.pin.path,context,sharedMetadata):await validateProductionSourceAdmissionFiles(loaded.pin.path,sharedMetadata);
   if(result.disposition!=='prepared-for-separate-acquisition-review')throw new Error('Production source admission quarantined: '+result.gaps.slice(0,12).join(','));
   for(const item of result.evidenceSnapshot)await read(item.path,4*MiB,item);
   bundleCache.set(key,result);
  }
  return result;
 }
 const sourceSubjects:unknown[]=[],boundarySubjects:unknown[]=[],rawFiles:{path:string;bytes:number;sha256:string;fileState:string}[]=[];
 for(const source of manifest.sources){
  const binding=envelope.rawSources.find(s=>s.sourceId===source.id);if(!binding)throw new Error('Raw source admission mapping missing');
  const admitted=await bundle(binding.bundle),subject=admitted.source;
  if(!['osm-planet','osm-extract'].includes(subject.kind)||subject.payload.url!==source.url||subject.payload.bytes!==source.bytes||subject.payload.sha256!==source.sha256||subject.intendedUse.transformRevision!==manifest.policy)throw new Error('Raw source payload/selection does not match admitted subject');
  if(source.sourceDomain){
   if(source.clipSha256!==undefined||subject.kind!=='osm-planet'||subject.effectiveClip.status!=='planet-domain')throw new Error('Planet/extract admission kind mismatch');
   const clip=subject.effectiveClip,descriptor=clip.descriptor;
   if(descriptor.nativeVintage!==source.vintage||descriptor.selectionPolicy!==manifest.policy)throw new Error('Admitted planet native vintage/selection mismatch');
   const descriptorPath=join(dirname(binding.bundle.path),clip.descriptorEvidence.path);
   if(await checkedPath(source.sourceDomain.path)!==await checkedPath(descriptorPath)||source.sourceDomain.bytes!==clip.descriptorEvidence.bytes||source.sourceDomain.sha256!==clip.descriptorEvidence.sha256)throw new Error('Exact admitted planet descriptor mismatch');
   const planned=(plan.sourceDomains??[]).filter(d=>d.sourceId===source.id);
   if(planned.length!==1||planned[0].sha256!==source.sourceDomain.sha256||planned[0].bytes!==source.sourceDomain.bytes||await checkedPath(planned[0].path)!==await checkedPath(source.sourceDomain.path))throw new Error('Assembly planet descriptor does not match raw source');
  }else{
   if(subject.kind!=='osm-extract'||subject.effectiveClip.status!=='bound'||source.clipSha256!==subject.effectiveClip.payload.sha256)throw new Error('Admitted effective extract clip mismatch');
   const native=subject.rights.conditions.find(c=>c.id==='source-native-vintage');if(!native)throw new Error('Admitted native vintage evidence required');
   const observation=decode((await read(join(dirname(binding.bundle.path),native.evidence.path),4*MiB,native.evidence)).body);
   if(canonical(observation)!==canonical({schemaVersion:1,kind:'native-vintage-observation',raw:{bytes:source.bytes,sha256:source.sha256},nativeVintage:source.vintage}))throw new Error('Admitted extract native vintage mismatch');
  }
  const path=await checkedPath(source.path),stat=await lstat(path);if(!stat.isFile()||stat.size!==source.bytes)throw new Error('Raw file size/identity mismatch');
  rawFiles.push({path,bytes:source.bytes,sha256:source.sha256,fileState:state(stat)});
  sourceSubjects.push({sourceId:source.id,sourceKey:subject.key,subjectSha256:admitted.subjectSha256,policyId:admitted.policyId,trustedPolicySha256:admitted.trustedPolicySha256});
 }
 if((plan.sourceDomains??[]).length!==manifest.sources.filter(s=>s.sourceDomain).length)throw new Error('Extraneous assembly source domain');
 for(const [index,boundary] of plan.boundaries.entries()){
  await read(boundary.input.path,128*MiB,boundary.input,'geometry');
  const mapped=envelope.boundaries.find(s=>s.boundaryIndex===index);if(!mapped)throw new Error('Boundary admission mapping missing');
  const keys=new Set<string>();
  for(const binding of mapped.bindings){
   const admitted=await bundle(binding.bundle),subject=admitted.source;
   if(subject.kind!=='boundary'||keys.has(subject.key))throw new Error('Duplicate/nonboundary admitted lineage source');keys.add(subject.key);
   const condition=subject.rights.conditions.find(c=>c.id==='normalized-boundary-lineage');if(!condition)throw new Error('Normalized lineage must be part of approved source subject');
   const conditionPath=join(dirname(binding.bundle.path),condition.evidence.path);
   if(await checkedPath(conditionPath)!==await checkedPath(binding.lineage.path)||binding.lineage.bytes!==condition.evidence.bytes||binding.lineage.sha256!==condition.evidence.sha256)throw new Error('Boundary lineage is not exact approved condition evidence');
   const lineage=boundaryNormalizationLineageSchema.parse(decode((await read(binding.lineage.path,4*MiB,binding.lineage)).body));
   if(canonical(lineage.source)!==canonical({url:subject.payload.url,bytes:subject.payload.bytes,sha256:subject.payload.sha256})||lineage.transformRevision!==subject.intendedUse.transformRevision)throw new Error('Boundary lineage admitted original/transform mismatch');
   let found=false;for(const output of lineage.outputs){if(session)resourceCheckpoint(session);if(await checkedPath(output.path)===await checkedPath(boundary.input.path)&&output.bytes===boundary.input.bytes&&output.sha256===boundary.input.sha256)found=true;}
   if(!found)throw new Error('Normalized boundary absent from admitted lineage outputs');
   boundarySubjects.push({boundaryIndex:index,sourceKey:subject.key,subjectSha256:admitted.subjectSha256,policyId:admitted.policyId,trustedPolicySha256:admitted.trustedPolicySha256,lineage:{...binding.lineage,path:await checkedPath(binding.lineage.path)}});
  }
 }
 await read(plan.footprints.path,128*MiB,plan.footprints,'footprints');
 // Re-read every small input, including authority code/evidence and normalized
 // geometry, after validation. Raw bodies are hashed by the producer's existing
 // before/after checks; this gate binds their stat identity and admitted hash.
 for(const item of seen.values())await read(item.path,item.bytes,item,'metadata',true);
 for(const raw of rawFiles){const stat=await lstat(await checkedPath(raw.path));if(state(stat)!==raw.fileState)throw new Error('Raw file mutation during admission');}
 const metadataPins=[...seen.values()].filter(item=>!codePins.some(p=>p.path===item.path)&&!geometryPins.some(p=>p.path===item.path)).sort((a,b)=>a.path.localeCompare(b.path));
 const producerManifestSha256=hash(canonical(manifest));
 const producerIdentity={policy:manifest.policy,...(manifest.schemaVersion===2?{evidenceLayout:manifest.evidenceLayout}:{}),sources:manifest.sources.map(source=>Object.fromEntries(Object.entries(source).filter(([key])=>key!=='path').map(([key,value])=>[key,key==='sourceDomain'?Object.fromEntries(Object.entries(value as Record<string,unknown>).filter(([domainKey])=>domainKey!=='path')):value])))};
 const producerCatalogueRevision='osm-'+hash(canonical(producerIdentity));
 const identity={schemaVersion:1 as const,kind:'production-admission-snapshot-v1' as const,
  manifest:manifestRead.pin,assemblyPlan:planRead.pin,admission:admissionRead.pin,
  producerManifestSha256,producerCatalogueRevision,policy:manifest.policy,
  sourceSubjects,boundarySubjects,rawFiles,metadataPins,geometryPins,codePins};
 const snapshotSha256=hash(canonical(identity)),expected=typeof options.expectedSnapshot==='string'?options.expectedSnapshot:options.expectedSnapshot?.snapshotSha256;
 if(expected!==undefined&&sha.parse(expected)!==snapshotSha256)throw new Error('Production admission snapshot/resume identity changed');
 return {...identity,snapshotSha256,phase:options.phase,productionAdmitted:true as const,networkRequests:0 as const,
  verifiedMetadataBytes:sharedMetadata.bytes,verifiedGeometryBytes:geometryBytes,
  scope:'Exact local production input binding only; no acquisition, publication or searched-coverage authorization'};
}

/** Fixed operator policy and independently pinned exact-subject review allowlist. */
export async function verifyProductionAdmission(options:ProductionAdmissionOptions){return verify(options);}
/** Explicit library-only synthetic seam; unavailable from the production CLI. */
export async function verifyProductionAdmissionWithContext(options:ProductionAdmissionOptions,context:TestContext){return verify(options,context);}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  const args=process.argv.slice(2);
  if(args.length!==2||args[0]!=='--request')throw new Error('Usage: production-source-admission.ts --request BOUNDED_JSON');
  if(Buffer.byteLength(args[1])>16384)throw new Error('Admission CLI request byte limit');
  const options=z.strictObject({manifestPath:absolute,admissionPath:absolute,admissionSha256:sha,phase:z.string(),expectedSnapshot:sha.optional(),expectedPlanPath:absolute.optional(),expectedPlanSha256:sha.optional()}).parse(JSON.parse(args[1]));
  const result=await verifyProductionAdmission(options),body=JSON.stringify(result);
  if(Buffer.byteLength(body)>MiB)throw new Error('Admission CLI output byte limit');
  process.stdout.write(body+'\n');
 }catch(error){process.stdout.write(JSON.stringify({schemaVersion:1,productionAdmitted:false,error:error instanceof Error?error.message.slice(0,1200):'Admission refused'})+'\n');process.exitCode=2;}
}
