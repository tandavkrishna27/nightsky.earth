/** Assemble measured retained evidence for review. No acquisition, source policy or review authority. */
import {createHash} from 'node:crypto';
import {lstat,mkdir,open,readFile,writeFile} from 'node:fs/promises';
import {dirname,isAbsolute,join,parse,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import * as z from 'zod4';
import {naturalEarthPolicy} from './natural-earth-policy';
import {admissionEvidencePinSchema,admissionSubjectDigest,boundaryNormalizationLineageSchema,sourceAdmissionBundleSchema,sourceAdmissionOutputPath,validateSourceAdmissionMetadataFiles,type AdmissionMetadataAccounting} from './source-admission';

const MiB=1024**2,repo=fileURLToPath(new URL('../../',import.meta.url));
export const retainedNaturalEarthPacket=join(repo,'docs/operations/natural-earth-admission');
const retainedRoot=resolve(repo,'../plugin-v1'),rawRelative='.cache/s2-geography-acquisition-20261016-r2',runRelative='.data/nine-global-staged-validation-20261016-v6';
type Pin={bytes:number;sha256:string};
const originals:readonly Pin[]=[{bytes:13287234,sha256:'239eec57ac17f100a11e2536cffc56752c318b50ae765b0918ff7aab4ce8f255'},
 {bytes:40726851,sha256:'22d0e3ad85eb3e27f17cabf8ba2d50e554fbc27a87796ff891d958185da62fb5'}];
const outputs:readonly Pin[]=[{bytes:12596289,sha256:'c05e09728d6fa92c56f44c54ccda87b8bdbd14d1733d9307d2d9e51b69259d99'},
 {bytes:24718304,sha256:'63599bc852fa013b398ff222de5d23f8dea2e578d2d17ae2a6b36d4f6bc9b642'},
 {bytes:7940290,sha256:'16a8e80eef9b135cf8b4536d93c2d924546cace5d7a33912077ed86fa23dd1ce'}];
const hash=(body:Buffer|string)=>createHash('sha256').update(body).digest('hex');
function canonical(v:unknown):string{if(Array.isArray(v))return '['+v.map(canonical).join(',')+']';if(v!==null&&typeof v==='object')return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical((v as Record<string,unknown>)[k])).join(',')+'}';return JSON.stringify(v);}
const encoded=(value:unknown)=>Buffer.from(canonical(value)+'\n');
async function safe(path:string){
 if(!isAbsolute(path)||path.split(/[\\/]/).includes('..'))throw new Error('Absolute nontraversing retained path required');
 let cursor=parse(path).root;for(const component of path.slice(cursor.length).split(/[\\/]/).filter(Boolean)){cursor=join(cursor,component);if((await lstat(cursor)).isSymbolicLink())throw new Error('Retained symlink refused');}return path;
}
/** Stream a selected retained file through actual SHA-256 and Git blob identity, without writes. */
export async function hashRetainedNaturalEarthFile(path:string,expected:Pin&{gitBlobSha1?:string}){
 if(!Number.isSafeInteger(expected.bytes)||expected.bytes<1||expected.bytes>128*MiB)throw new Error('Retained file bound');
 const handle=await open(await safe(resolve(path)),'r');
 try{
  const before=await handle.stat();if(!before.isFile()||before.size!==expected.bytes)throw new Error('Retained size identity mismatch');
  const sha=createHash('sha256'),git=createHash('sha1').update(`blob ${before.size}\0`),buffer=Buffer.alloc(65536);let bytes=0;
  while(true){const result=await handle.read(buffer,0,buffer.length,null);if(!result.bytesRead)break;bytes+=result.bytesRead;if(bytes>expected.bytes)throw new Error('Retained file grew');const chunk=buffer.subarray(0,result.bytesRead);sha.update(chunk);git.update(chunk);}
  const after=await handle.stat(),sha256=sha.digest('hex'),gitBlobSha1=git.digest('hex');await safe(resolve(path));
  if(bytes!==expected.bytes||sha256!==expected.sha256||expected.gitBlobSha1&&gitBlobSha1!==expected.gitBlobSha1||before.ino!==after.ino||before.size!==after.size||before.mtimeMs!==after.mtimeMs)throw new Error('Retained identity/digest mismatch');
  return {path:resolve(path),bytes,sha256,gitBlobSha1};
 }finally{await handle.close();}
}
async function small(path:string,max=4*MiB,expected?:Pin){
 const handle=await open(await safe(resolve(path)),'r');try{
  const before=await handle.stat();if(!before.isFile()||before.size>max||expected&&before.size!==expected.bytes)throw new Error('Metadata size bound');
  const body=Buffer.alloc(before.size);let count=0;while(count<body.length){const r=await handle.read(body,count,body.length-count,null);if(!r.bytesRead)throw new Error('Retained short read');count+=r.bytesRead;}
  const after=await handle.stat();await safe(resolve(path));
  if(before.ino!==after.ino||before.size!==after.size||before.mtimeMs!==after.mtimeMs||expected&&hash(body)!==expected.sha256)throw new Error('Metadata identity mismatch');return body;
 }finally{await handle.close();}
}
const json=(body:Buffer)=>JSON.parse(new TextDecoder('utf8',{fatal:true}).decode(body));
const conditions=['exact-original-source-identity','licensor-authority','original-source-to-payload-chain','mixed-output-compatibility-review',
 'public-domain-jurisdiction-and-authority','third-party-rights-review','source-and-edition-notice',
 'natural-earth-exact-edition-and-source','natural-earth-normalization-and-limitations','normalized-boundary-lineage','normalization-audit','preparation-audit'];
const frozenSubjects={
 'NE-v5.1.1-ADM0':'6afdd8189eb50e1d8e508393d051cb5fef5fffa13030518a95965fb854f06e79',
 'NE-v5.1.1-ADM1':'06d404498660df3a966f5f7fcf0d3a058b5f1ee2b41030cacc32072b367a0673',
} as const;
const subjectIndexSchema=z.strictObject({schemaVersion:z.literal(1),kind:z.literal('retained-natural-earth-admission-subjects'),productionAdmitted:z.literal(false),networkRequests:z.literal(0),
 originalBytes:z.literal(54014085),normalizedBytes:z.literal(45254883),featureInventory:z.strictObject({source:z.literal(4854),mapped:z.literal(4784),unknown:z.literal(70),normalizedPositions:z.literal(1843740)}),
 sources:z.array(z.strictObject({sourceKey:z.enum(['NE-v5.1.1-ADM0','NE-v5.1.1-ADM1']),subjectSha256:z.string().regex(/^[a-f0-9]{64}$/),bundle:admissionEvidencePinSchema,record:admissionEvidencePinSchema,lineage:admissionEvidencePinSchema})).length(2),
 unresolvedGates:z.array(z.string().min(1).max(256)).min(1).max(16),artifacts:z.array(admissionEvidencePinSchema).min(1).max(32),
}).superRefine((index,context)=>{
 if(new Set(index.sources.map(row=>row.sourceKey)).size!==2)context.addIssue({code:'custom',message:'Duplicate source key in subject index'});
 const paths=new Set<string>();let total=0;
 for(const pin of index.artifacts){if(paths.has(pin.path))context.addIssue({code:'custom',message:'Duplicate packet artifact path'});paths.add(pin.path);total+=pin.bytes;}
 if(total>8*MiB)context.addIssue({code:'custom',message:'Declared packet artifact bytes exceed 8 MiB limit'});
 for(const row of index.sources){const name=row.sourceKey.endsWith('ADM0')?'adm0':'adm1';
  if(row.subjectSha256!==frozenSubjects[row.sourceKey]||row.bundle.path!==`${name}-bundle.json`||row.record.path!==`manifests/${name}-source-record.json`||row.lineage.path!==`lineage/${name}.json`)context.addIssue({code:'custom',message:'Unexpected frozen subject/path binding'});
  for(const pin of [row.bundle,row.record,row.lineage])if(!index.artifacts.some(item=>canonical(item)===canonical(pin)))context.addIssue({code:'custom',message:'Subject pin missing from artifact inventory'});
 }
 if(!paths.has('proposed-records.json'))context.addIssue({code:'custom',message:'Proposed record artifact pin missing'});
});

/** Fixed retained edition/run only. The only output directory is this worktree's new evidence packet. */
export async function assembleRetainedNaturalEarthAdmission(){
 const sourceFiles=new Map<string,Buffer>(),raw=join(retainedRoot,rawRelative),run=join(retainedRoot,runRelative);
 const metadata=async(name:string,path:string,expected?:Pin)=>{const body=await small(path,4*MiB,expected);sourceFiles.set(name,body);return json(body);};
 const audit=await metadata('evidence/ingestion-audit.json',join(run,'ingested/audit.json'),{bytes:4040327,sha256:'3cbda439d1d39ab755390a703d845b9b18051ffbe5240701ab3283cffe6f9ad7'});
 const preparedAudit=await metadata('evidence/preparation-audit.json',join(run,'prepared/audit.json'),{bytes:160983,sha256:'fd0b9edf634978cf417d156307bba402fce48e19f9ed4838e91a903ca5510690'});
 const ingested=await metadata('evidence/ingestion-complete.json',join(run,'ingested/complete.json'));
 const prepared=await metadata('evidence/preparation-complete.json',join(run,'prepared/complete.json'));
 const shards=await metadata('evidence/boundary-shards.json',join(run,'prepared/boundary-shards.json'));
 if(canonical(audit.policy)!==canonical(naturalEarthPolicy)||audit.synthetic!==false||ingested.synthetic!==false||ingested.sourceFeatures!==4854||ingested.resolvedFeatures!==4784||ingested.unresolvedFeatures!==70||ingested.vertices!==1843740||audit.provenance.length!==4854||audit.residuals.unknownProviderMappings!==70)throw new Error('Retained actual complete inventory mismatch');
 if(audit.inputs.geometryPolicy!=='remove-consecutive-identical'||audit.inputs.repeatedVertexPolicy!=='extract-tangent-holes'||audit.inputs.unresolvedIdentityPolicy!=='preserve-unknown'||audit.inputs.crsPolicy!=='verified-crs84'||audit.inputs.partitions.length!==3||shards.boundaries.length!==3||preparedAudit.coveredCells!==0||preparedAudit.intendedCells!==0)throw new Error('Retained normalization/coverage policy mismatch');
 const licencePath=join(retainedRoot,naturalEarthPolicy.licence.evidence);
 await hashRetainedNaturalEarthFile(licencePath,naturalEarthPolicy.licence);sourceFiles.set('evidence/licence.txt',await small(licencePath,65536,naturalEarthPolicy.licence));
 const originalMeasurements=[];
 for(const [level,layer] of naturalEarthPolicy.layers.entries()){
  const path=join(raw,'raw',layer.path.split('/').at(-1)!);
  const measured=await hashRetainedNaturalEarthFile(path,{...originals[level],gitBlobSha1:layer.gitBlobSha1});originalMeasurements.push(measured);
  const receipt=await metadata(`evidence/adm${level}-receipt.json`,join(raw,'evidence',layer.path.split('/').at(-1)!+'.result.json'));
  const url=`https://raw.githubusercontent.com/nvkelso/natural-earth-vector/${naturalEarthPolicy.commit}/${layer.path}`;
  if(receipt.status!=='verified'||receipt.httpStatus!==200||receipt.effectiveUrl!==url||receipt.manifest.url!==url||receipt.identity.bytes!==measured.bytes||receipt.identity.sha256!==measured.sha256||receipt.identity.git!==measured.gitBlobSha1)throw new Error('Actual original receipt mismatch');
  sourceFiles.set(`evidence/adm${level}-measured-original.json`,encoded({schemaVersion:1,kind:'retained-original-measurement',...measured,url,receiptPath:`evidence/adm${level}-receipt.json`,networkRequests:0}));
 }
 const normalized=[];
 for(const [index,expected] of outputs.entries()){
  const name=`boundaries-${index}.geojson`,path=join(run,'prepared',name),body=await small(path,32*MiB,expected),collection=json(body),part=audit.inputs.partitions[index],shard=shards.boundaries[index];
  if(canonical(prepared.files[name])!==canonical(expected)||canonical(ingested.files[name])!==canonical(expected)||canonical(shard.input)!==canonical({path:name,...expected}))throw new Error('Retained shard completion pin mismatch');
  const provenance=audit.provenance.filter((row:any)=>row.level===part.level&&part.providerIds.includes(row.providerId));
  const ids=provenance.map((row:any)=>row.regionId??row.boundaryId).sort(),actual=collection.features.map((feature:any)=>feature.properties.regionId??feature.properties.boundaryId).sort();
  if(new Set(part.providerIds).size!==part.providerIds.length||provenance.length!==part.providerIds.length||canonical(ids)!==canonical(actual)||collection.features.length!==shard.regionIds.length+shard.unresolvedBoundaryIds.length)throw new Error('Retained source-to-normalized feature lineage mismatch');
  normalized.push({path:resolve(path),...expected,level:part.level,features:collection.features.length,mapped:shard.regionIds.length,unknown:shard.unresolvedBoundaryIds.length});
 }
 if(normalized.reduce((n,p)=>n+p.bytes,0)!==45254883||normalized.reduce((n,p)=>n+p.features,0)!==4854||normalized.reduce((n,p)=>n+p.unknown,0)!==70)throw new Error('Retained aggregate inventory mismatch');
 const transformRevision='natural-earth-retained-v6-20261016-'+hash(sourceFiles.get('evidence/ingestion-audit.json')!).slice(0,16);
 sourceFiles.set('evidence/normalization-and-limitations.json',encoded({schemaVersion:1,kind:'retained-normalization-and-limitations',transformRevision,
  originalPositions:ingested.originalVertices,normalizedPositions:ingested.vertices,featureInventory:{source:4854,mapped:4784,unknown:70},
  partitions:normalized,policies:{geometry:audit.inputs.geometryPolicy,repeatedVertices:audit.inputs.repeatedVertexPolicy,unresolvedIdentity:audit.inputs.unresolvedIdentityPolicy,crs:audit.inputs.crsPolicy},
  transformations:audit.transformations,modifications:audit.modifications,residuals:audit.residuals,coverage:'unknown',access:'unknown',productionAdmitted:false}));
 sourceFiles.set('evidence/provenance.json',encoded({schemaVersion:1,kind:'retained-natural-earth-provenance',provider:'Natural Earth',edition:naturalEarthPolicy.edition,commit:naturalEarthPolicy.commit,
  originalSourceUrl:naturalEarthPolicy.source.url,licenceUrl:naturalEarthPolicy.source.licenseUrl,originals:originalMeasurements,normalized,
  retainedRun:run,scope:'Measured existing retained files and audited v6 source/partition identities; no acquisition, new geometry build or independent review receipt',productionAdmitted:false}));
 sourceFiles.set('evidence/private-use-and-rights-context.json',encoded({schemaVersion:1,kind:'private-boundary-use-context',distribution:'private',
  intendedUse:'Offline administrative membership preparation using retained Natural Earth geometry; no observing access or searched coverage claim',
  sourceLicence:'Public-domain declaration retained at the exact Natural Earth v5.1.1 commit',classification:'adaptation',
  mixedOutputScope:'This subject covers Natural Earth boundary inputs and their audited normalization only. It grants no public OSM mixed-database release, derivative offer, publication or deployment.',
  notice:'Made with Natural Earth, v5.1.1. Generalized 1:10m de facto boundaries; ADM1 beta; 70 unresolved identities remain unknown. Provider attributes explicitly mapped and consecutive duplicates/tangent holes normalized as audited.',
  requiredIndependentReviews:['source-provenance','payload-validation','rights-review','admission-approval'],reviewStatus:'not-reviewed-no-approvals-created',productionAdmitted:false}));
 const pin=(path:string)=>{const body=sourceFiles.get(path);if(!body)throw new Error('Missing packet artifact');return {path,bytes:body.length,sha256:hash(body)};};
 const records:any[]=[],bundles:any[]=[];
 for(const level of [0,1]){
  const layer=naturalEarthPolicy.layers[level],url=`https://raw.githubusercontent.com/nvkelso/natural-earth-vector/${naturalEarthPolicy.commit}/${layer.path}`;
  const payload={url,...originals[level],identityEvidence:pin(`evidence/adm${level}-measured-original.json`)};
  const lineage=boundaryNormalizationLineageSchema.parse({schemaVersion:1,kind:'boundary-normalization-lineage',source:{url,...originals[level]},transformRevision,outputs:normalized.filter(p=>p.level===level).map(({path,bytes,sha256})=>({path,bytes,sha256}))});
  sourceFiles.set(`lineage/adm${level}.json`,encoded(lineage));
  const inventoryRecord={schemaVersion:1,kind:'retained-natural-earth-source-record',key:`NE-v5.1.1-ADM${level}`,edition:`5.1.1@${naturalEarthPolicy.commit}`,level,
   originalSourceUrl:naturalEarthPolicy.source.url,payload,licenceEvidence:pin('evidence/licence.txt'),normalizationEvidence:pin(`lineage/adm${level}.json`),
   provenanceEvidence:pin('evidence/provenance.json'),normalizationAudit:pin('evidence/ingestion-audit.json'),preparationAudit:pin('evidence/preparation-audit.json'),privateUseContext:pin('evidence/private-use-and-rights-context.json')};
  sourceFiles.set(`manifests/adm${level}-source-record.json`,encoded(inventoryRecord));
  records.push({key:inventoryRecord.key,kind:'boundary',edition:inventoryRecord.edition,recordSha256:hash(encoded(inventoryRecord)),originalLicenceId:'public-domain',disposition:'reviewable',requiredConditions:conditions,
   boundaryProvider:'natural-earth',naturalEarthIdentity:{originalSourceUrl:naturalEarthPolicy.source.url,payload,licenceEvidence:pin('evidence/licence.txt'),normalizationEvidence:pin(`lineage/adm${level}.json`)}});
 }
 sourceFiles.set('manifests/sources.json',encoded({schemaVersion:1,kind:'source-admission-manifest',records:records.map((record,level)=>({sourceKey:record.key,kind:'boundary',edition:record.edition,recordSha256:record.recordSha256,payload:{url:record.naturalEarthIdentity.payload.url,...originals[level]}}))}));
 for(const [level,record] of records.entries()){
  const conditionEvidence=(id:string)=>id==='normalized-boundary-lineage'?pin(`lineage/adm${level}.json`):id==='normalization-audit'?pin('evidence/ingestion-audit.json'):id==='preparation-audit'?pin('evidence/preparation-audit.json'):
   ['licensor-authority','public-domain-jurisdiction-and-authority'].includes(id)?pin('evidence/licence.txt'):id==='natural-earth-normalization-and-limitations'?pin('evidence/normalization-and-limitations.json'):
   ['mixed-output-compatibility-review','third-party-rights-review','source-and-edition-notice'].includes(id)?pin('evidence/private-use-and-rights-context.json'):pin('evidence/provenance.json');
  const bundle=sourceAdmissionBundleSchema.parse({schemaVersion:1,source:{key:record.key,kind:'boundary',edition:record.edition,manifest:pin('manifests/sources.json'),recordSha256:record.recordSha256,
   originalSource:{identity:`Natural Earth v5.1.1 ADM${level}, commit ${naturalEarthPolicy.commit}`,url:naturalEarthPolicy.source.url,provenanceEvidence:pin('evidence/provenance.json')},payload:record.naturalEarthIdentity.payload,
   effectiveClip:{status:'not-applicable',reason:'Administrative membership boundaries; source extent does not supply extraction footprints'},
   intendedUse:{purpose:'Private offline administrative membership preparation from retained Natural Earth originals and audited complete v6 normalized parts; coverage/access remain unknown',transformRevision,distribution:'private',outputLicence:'Public-domain Natural Earth boundary geometry; no public mixed-database release authorized by this subject'},
   rights:{classification:'adaptation',licensor:'Natural Earth contributors; retained public-domain source declaration',licenceId:'public-domain',licenceEvidence:pin('evidence/licence.txt'),
    notices:[{text:'Made with Natural Earth, v5.1.1. Generalized 1:10m de facto boundaries and ADM1 beta; audited attribute/geometry normalization; 70 identities remain unknown.',destination:naturalEarthPolicy.source.url}],conditions:conditions.map(id=>({id,evidence:conditionEvidence(id)}))}},reviews:[]});
  const name=`adm${level}-bundle.json`;sourceFiles.set(name,encoded(bundle));bundles.push({sourceKey:record.key,subjectSha256:admissionSubjectDigest(bundle.source),bundle:pin(name),record:pin(`manifests/adm${level}-source-record.json`),lineage:pin(`lineage/adm${level}.json`)});
 }
 sourceFiles.set('proposed-records.json',encoded({schemaVersion:1,kind:'natural-earth-proposed-source-records',authority:'proposal-only-not-policy-or-review-approval',productionAdmitted:false,sources:records}));
 const index={schemaVersion:1,kind:'retained-natural-earth-admission-subjects',productionAdmitted:false,networkRequests:0,originalBytes:54014085,normalizedBytes:45254883,
  featureInventory:{source:4854,mapped:4784,unknown:70,normalizedPositions:1843740},sources:bundles,
  unresolvedGates:['independent-exact-subject-provenance-payload-rights-and-admission-reviews','operator-controlled-policy-revision','separately-authorized-bounded-build','public-release-rights-offer-and-hosting-review'],
  artifacts:[...sourceFiles].map(([path,body])=>({path,bytes:body.length,sha256:hash(body)}))};sourceFiles.set('subjects.json',encoded(index));
 sourceAdmissionOutputPath(retainedNaturalEarthPacket);await safe(dirname(retainedNaturalEarthPacket));await mkdir(retainedNaturalEarthPacket);
 for(const dir of ['evidence','manifests','lineage'])await mkdir(join(retainedNaturalEarthPacket,dir));
 for(const [path,body] of sourceFiles){if(body.length>4*MiB)throw new Error('Packet artifact limit');await writeFile(join(retainedNaturalEarthPacket,path),body,{flag:'wx'});}
 return {packet:retainedNaturalEarthPacket,...index};
}

/** CI-safe metadata verification: no retained original or normalized bodies are opened. */
export async function verifyRetainedNaturalEarthAdmissionPackage(root=retainedNaturalEarthPacket){
 const indexBytes=await small(join(root,'subjects.json'),65536),index=subjectIndexSchema.parse(json(indexBytes));
 const artifacts=new Map<string,Pin>(),bodies=new Map<string,Buffer>();
 const accounting:AdmissionMetadataAccounting={bytes:indexBytes.length,ceiling:32*MiB,paths:new Map([[resolve(root,'subjects.json'),indexBytes.length]])};
 for(const pin of index.artifacts){const body=await small(join(root,pin.path),4*MiB,pin);artifacts.set(pin.path,pin);bodies.set(pin.path,body);accounting.paths.set(resolve(root,pin.path),body.length);accounting.bytes+=body.length;}
 const proposalBytes=bodies.get('proposed-records.json')!,proposal=json(proposalBytes);
 if(proposal.productionAdmitted!==false)throw new Error('Packet authority claim refused');
 for(const row of index.sources){
  const bundlePin=admissionEvidencePinSchema.parse(row.bundle);
  if(canonical(artifacts.get(bundlePin.path))!==canonical(bundlePin))throw new Error('Subject bundle missing from verified artifact inventory');
  const declared=sourceAdmissionBundleSchema.parse(json(bodies.get(bundlePin.path)!));
  if(declared.source.key!==row.sourceKey||admissionSubjectDigest(declared.source)!==row.subjectSha256||declared.source.recordSha256!==row.record.sha256||declared.reviews.length)throw new Error('Unexpected frozen source subject or review declaration');
  const checked=await validateSourceAdmissionMetadataFiles(join(root,bundlePin.path),{policy:{schemaVersion:1,policyId:'proposal-inspection-no-grant',inventoryRoots:[{path:'proposed-records.json',bytes:proposalBytes.length,sha256:hash(proposalBytes)}],sources:proposal.sources},trust:{schemaVersion:1,trustedReviews:[]},trustDirectory:root},accounting);
  if(checked.subjectSha256!==row.subjectSha256||checked.bundle.reviews.length||checked.disposition!=='quarantined')throw new Error('Unreviewed subject identity/admission mismatch');
 }
 return {productionAdmitted:false as const,subjects:index.sources.map((row:any)=>({sourceKey:row.sourceKey,subjectSha256:row.subjectSha256})),verifiedMetadataArtifacts:index.artifacts.length};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2);
 if(!args.length)process.stdout.write(JSON.stringify({mode:'offline-retained-natural-earth-admission-plan',retainedRoot,packet:retainedNaturalEarthPacket,originalBytes:54014085,normalizedBytes:45254883,networkRequests:0,productionAdmitted:false})+'\n');
 else if(args.length===1&&args[0]==='--assemble')process.stdout.write(JSON.stringify(await assembleRetainedNaturalEarthAdmission(),null,2)+'\n');
 else if(args.length===1&&args[0]==='--verify')process.stdout.write(JSON.stringify(await verifyRetainedNaturalEarthAdmissionPackage(),null,2)+'\n');
 else throw new Error('Usage: prepare-retained-natural-earth-admission.ts [--assemble|--verify]');
}
