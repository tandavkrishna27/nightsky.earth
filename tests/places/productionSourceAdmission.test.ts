import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtemp,writeFile,readFile,realpath,mkdir,copyFile,rm,open} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import {admissionSubjectDigest} from '../../scripts/osm/source-admission';
import {verifyProductionAdmission,verifyProductionAdmissionWithContext,productionAdmissionEnvelopeSchema,productionAdmissionCodeFiles} from '../../scripts/osm/production-source-admission';

import {createBootstrapResources,createResourceSessionV3} from '../../scripts/osm/partitioned-resources';

const repo=fileURLToPath(new URL('../../',import.meta.url));
async function membershipCodeClosure(){
 const visited=new Set<string>();
 async function visit(path:string):Promise<void>{
  if(visited.has(path))return;visited.add(path);
  const body=await readFile(path,'utf8');
  for(const match of body.matchAll(/(?:from\s*|import\s*\()(['"])(\.[^'"]+)\1/g)){
   const dependency=resolve(dirname(path),match[2]);await visit(dependency.endsWith('.ts')?dependency:dependency+'.ts');
  }
 }
 await visit(join(repo,'scripts/osm/membership-assembly.ts'));return visited;
}

const h=(body:string)=>createHash('sha256').update(body).digest('hex');
const canonical=(value:any):string=>Array.isArray(value)?'['+value.map(canonical).join(',')+']':value!==null&&typeof value==='object'?'{'+Object.keys(value).sort().map(key=>JSON.stringify(key)+':'+canonical(value[key])).join(',')+'}':JSON.stringify(value);
const baseConditions=['exact-original-source-identity','licensor-authority','original-source-to-payload-chain','mixed-output-compatibility-review',
 'attribution','licence-notice','modification-notice','database-versus-produced-work','share-alike','machine-readable-offer','no-additional-restrictions'];
async function fixture(){
 const root=await mkdtemp(join(tmpdir(),'production-admission-'));
 async function file(name:string,value:unknown){const body=typeof value==='string'?value:JSON.stringify(value);await writeFile(join(root,name),body);return {path:name,bytes:Buffer.byteLength(body),sha256:h(body)};}
 const abs=(p:{path:string;bytes:number;sha256:string})=>({...p,path:join(root,p.path)});
 const note=await file('note.json',{scope:'Synthetic metadata only; never source permission'}),raw=await file('raw.xml','raw'),normalized=await file('normalized.json','{}'),footprints=await file('footprints.jsonl','');
 const url='https://example.org/immutable/planet-1.osm',vintage='2026-10-12T00:00:00Z',selection='named-complete-way-v1-polar85';
 const native=await file('native.json',{schemaVersion:1,kind:'native-vintage-observation',raw:{bytes:raw.bytes,sha256:raw.sha256},nativeVintage:vintage});
 const descriptor={schemaVersion:1,kind:'planet-domain-v1',sourceUrl:url,edition:'fictional-1',provider:'Fictional',providerWholeWorldEvidence:note,
  providerObject:{version:'v1',etag:'etag',md5:'a'.repeat(32)},raw:{bytes:raw.bytes,sha256:raw.sha256},nativeVintage:vintage,nativeVintageEvidence:native,
  domain:{west:-180,south:-90,east:180,north:90},selectionPolicy:selection,coverageClaim:'source-domain-only'};
 const domain=await file('domain.json',descriptor);
 const boundaryPayload={url:'https://example.org/immutable/boundary-1.json',bytes:8,sha256:h('original')};
 const lineage=await file('lineage.json',{schemaVersion:1,kind:'boundary-normalization-lineage',source:boundaryPayload,transformRevision:'normalize-1',outputs:[abs(normalized)]});
 const sources:any[]=[],bundles:any[]=[],reviews:any[]=[];
 for(const kind of ['osm-planet','boundary']){
  const key=kind==='boundary'?'SYN-ADM0':'SYN-planet',payload=kind==='boundary'?boundaryPayload:{url,bytes:raw.bytes,sha256:raw.sha256};
  const manifest=await file(key+'-manifest.json',{schemaVersion:1,kind:'source-admission-manifest',records:[{sourceKey:key,kind,edition:'fictional-1',recordSha256:h(key),payload}]});
  const conditions=[...baseConditions,...(kind==='boundary'?['geoboundaries-cc-by-4.0-attribution','geoboundaries-modification-and-edition-notice']:['osm-contributor-attribution'])].map(id=>({id,evidence:note}));
  if(kind==='boundary')conditions.push({id:'normalized-boundary-lineage',evidence:lineage});
  const source={key,kind,edition:'fictional-1',manifest,recordSha256:h(key),originalSource:{identity:'Fictional source',url:payload.url,provenanceEvidence:note},
   payload:{...payload,identityEvidence:note},effectiveClip:kind==='boundary'?{status:'not-applicable',reason:'Membership geometry'}:{status:'planet-domain',descriptor,descriptorEvidence:domain},
   intendedUse:{purpose:'Synthetic fixture',transformRevision:kind==='boundary'?'normalize-1':selection,distribution:'private',outputLicence:'ODbL-1.0'},
   rights:{classification:'derivative-database',licensor:'Fictional',licenceId:'ODbL-1.0',licenceEvidence:note,notices:[{text:'Fictional notice',destination:'https://example.org/immutable/notices'}],conditions}};
  const subjectSha256=admissionSubjectDigest(source),receipts=[];
  for(const role of ['source-provenance','payload-validation','rights-review','admission-approval',...(kind==='osm-planet'?['planet-domain']:[])]){
   const receipt={role,subjectSha256,reviewer:'fictional-test-reviewer',reviewedAt:'2026-10-16T00:00:00Z',decision:'approve'};
   const evidence=await file(key+'-'+role+'.json',{schemaVersion:1,...receipt});receipts.push({...receipt,evidence});reviews.push({role,subjectSha256,reviewer:receipt.reviewer,evidence});
  }
  sources.push(source);bundles.push(abs(await file(key+'-bundle.json',{schemaVersion:1,source,reviews:receipts})));
 }
 const policy={schemaVersion:1,policyId:'fictional-only-not-production-permission',inventoryRoots:[note],sources:sources.map(source=>({key:source.key,kind:source.kind,edition:source.edition,recordSha256:source.recordSha256,originalLicenceId:'ODbL-1.0',disposition:'reviewable',requiredConditions:['attribution']}))};
 const manifest:any={schemaVersion:1,policy:selection,authorization:'synthetic only',limits:{},sources:[{id:'raw-1',path:join(root,raw.path),format:'xml',url,bytes:raw.bytes,sha256:raw.sha256,vintage,licenseUrl:'https://opendatacommons.org/licenses/odbl/1-0/',attribution:'© OpenStreetMap contributors',sourceDomain:{...abs(domain),kind:'planet-domain-v1'}}]};
 const plan:any={schemaVersion:1,boundaries:[{input:abs(normalized),regionIds:[]}],footprints:abs(footprints),sourceDomains:[{...manifest.sources[0].sourceDomain,sourceId:'raw-1'}],membership:{},stream:{},catalogue:{},retained:[]};
 const envelope:any={schemaVersion:1,kind:'production-source-admission-v1',manifest:abs(await file('raw-manifest.json',manifest)),assemblyPlan:abs(await file('plan.json',plan)),rawSources:[{sourceId:'raw-1',bundle:bundles[0]}],boundaries:[{boundaryIndex:0,bindings:[{bundle:bundles[1],lineage:abs(lineage)}]}]};
 let admission=abs(await file('admission.json',envelope));
 const options=()=>({manifestPath:envelope.manifest.path,admissionPath:admission.path,admissionSha256:admission.sha256,phase:'preflight'});
 async function repin(){envelope.manifest=abs(await file('raw-manifest.json',manifest));envelope.assemblyPlan=abs(await file('plan.json',plan));admission=abs(await file('admission.json',envelope));}
 return {root,file,abs,manifest,plan,envelope,sources,bundles,options,repin,context:{policy,trust:{schemaVersion:1,trustedReviews:reviews},trustDirectory:root}};
}

test('exact approved synthetic subjects bind manifest, plan, raw identity, normalized bodies and phase-stable snapshot',async()=>{
 const f=await fixture();try{
  const first=await verifyProductionAdmissionWithContext(f.options(),f.context);assert.equal(first.productionAdmitted,true);assert.equal(first.sourceSubjects.length,1);assert.equal(first.boundarySubjects.length,1);assert.equal(first.networkRequests,0);
  assert.equal(first.producerManifestSha256,h(canonical(f.manifest)));assert.equal(first.policy,f.manifest.policy);
  const identity={policy:f.manifest.policy,sources:f.manifest.sources.map((source:any)=>Object.fromEntries(Object.entries(source).filter(([key])=>key!=='path').map(([key,value])=>[key,key==='sourceDomain'?Object.fromEntries(Object.entries(value as any).filter(([key])=>key!=='path')):value])))};
  assert.equal(first.producerCatalogueRevision,'osm-'+h(canonical(identity)));
  const after=await verifyProductionAdmissionWithContext({...f.options(),phase:'assembly-after',expectedSnapshot:first.snapshotSha256},f.context);
  assert.equal(first.snapshotSha256,after.snapshotSha256);assert.ok(first.metadataPins.some(p=>p.path.endsWith('lineage.json')));assert.equal(first.geometryPins.length,2);assert.equal(first.codePins.length,productionAdmissionCodeFiles.length);
 }finally{await rm(f.root,{recursive:true,force:true});}
});
test('membership executable import closure is pinned with exact current bytes',async()=>{
 const f=await fixture();try{
  const result=await verifyProductionAdmissionWithContext(f.options(),f.context);
  for(const path of await membershipCodeClosure()){
   const absolute=await realpath(path),pin=result.codePins.find(pin=>pin.path===absolute);
   assert.ok(pin,`Unpinned membership executable dependency: ${path}`);
   const body=await readFile(path);assert.equal(pin.bytes,body.length);assert.equal(pin.sha256,createHash('sha256').update(body).digest('hex'));
  }
  const python=await readFile(join(repo,'scripts/osm/production_admission.py'),'utf8');
  const fixed=python.match(/CODE_FILES = \(([\s\S]*?)\)\r?\n/);assert.ok(fixed);
  const paths=[...fixed[1].matchAll(/'([^']+)'/g)].map(match=>match[1]);
  assert.deepEqual([...paths,'scripts/osm/production-type-loader.mjs'],productionAdmissionCodeFiles);
 }finally{await rm(f.root,{recursive:true,force:true});}
});
test('actual membership code changes invalidate the TypeScript resume snapshot in an isolated checkout',async()=>{
 const f=await fixture(),checkout=await mkdtemp(join(repo,'.admission-code-test-'));
 try{
  for(const path of productionAdmissionCodeFiles){const destination=join(checkout,path);await mkdir(dirname(destination),{recursive:true});await copyFile(join(repo,path),destination);}
  const isolated=await import(pathToFileURL(join(checkout,'scripts/osm/production-source-admission.ts')).href);
  const first=await isolated.verifyProductionAdmissionWithContext(f.options(),f.context);
  for(const path of ['scripts/osm/boundary-metadata.ts','scripts/osm/geographic-geometry.ts','scripts/osm/partitioned-boundaries.ts','scripts/osm/membership-assembly.ts']){
   const target=join(checkout,path),original=await readFile(target);
   await writeFile(target,Buffer.concat([original,Buffer.from('\n// Isolated executable mutation.\n')]));
   await assert.rejects(isolated.verifyProductionAdmissionWithContext({...f.options(),expectedSnapshot:first.snapshotSha256},f.context),/snapshot\/resume identity changed/);
   await writeFile(target,original);
  }
 }finally{await rm(f.root,{recursive:true,force:true});await rm(checkout,{recursive:true,force:true});}
});
test('fixed production authority rejects fictional self-issued policy and trusted reviews',async()=>{
 const f=await fixture();try{await assert.rejects(verifyProductionAdmission(f.options()),/quarantined/);}finally{await rm(f.root,{recursive:true,force:true});}
});
test('raw URL, hash, vintage and policy substitutions cannot reuse approved source subject',async()=>{
 for(const change of [(f:any)=>f.manifest.sources[0].url='https://example.org/other', (f:any)=>f.manifest.sources[0].sha256=h('changed'),
  (f:any)=>f.manifest.sources[0].vintage='2026-10-13T00:00:00Z',(f:any)=>f.manifest.policy='other']){
  const f=await fixture();try{change(f);await f.repin();await assert.rejects(verifyProductionAdmissionWithContext(f.options(),f.context));}finally{await rm(f.root,{recursive:true,force:true});}
 }
});
test('full manifest, assembly controls and admission mappings participate in resume identity',async()=>{
 const f=await fixture();try{const first=await verifyProductionAdmissionWithContext(f.options(),f.context);f.manifest.authorization='changed bounded invocation';f.plan.membership.maxRows=10;await f.repin();await assert.rejects(verifyProductionAdmissionWithContext({...f.options(),expectedSnapshot:first},f.context),/snapshot\/resume identity changed/);}finally{await rm(f.root,{recursive:true,force:true});}
});
test('missing mappings, unsigned lineage substitutions and changed normalized bodies are refused',async()=>{
 for(const mode of ['missing','lineage','body']){
  const f=await fixture();try{
   if(mode==='missing')f.envelope.boundaries=[];
   if(mode==='lineage')f.envelope.boundaries[0].bindings[0].lineage=f.abs(await f.file('unreviewed-lineage.json',{source:'invented'}));
   if(mode==='body')await writeFile(f.plan.boundaries[0].input.path,'different');
   await f.repin();await assert.rejects(verifyProductionAdmissionWithContext(f.options(),f.context));
  }finally{await rm(f.root,{recursive:true,force:true});}
 }
});
test('production CLI has no candidate policy/trust override and emits bounded refusal JSON',async()=>{
 const f=await fixture();try{
  const args=['--import','tsx','scripts/osm/production-source-admission.ts','--request',JSON.stringify({...f.options(),policy:f.context.policy,trust:f.context.trust})];
  const result=spawnSync(process.execPath,args,{encoding:'utf8',timeout:10000});assert.equal(result.status,2);assert.equal(JSON.parse(result.stdout).productionAdmitted,false);assert.ok(Buffer.byteLength(result.stdout)<4096);
 }finally{await rm(f.root,{recursive:true,force:true});}
});
test('footprint substitution and actual raw-file changes invalidate prior snapshot',async()=>{
 for(const mode of ['footprints','raw']){
  const f=await fixture();try{
   const first=await verifyProductionAdmissionWithContext(f.options(),f.context);
   if(mode==='footprints')await writeFile(f.plan.footprints.path,'invented coverage');
   else await writeFile(f.manifest.sources[0].path,'bad');
   await assert.rejects(verifyProductionAdmissionWithContext({...f.options(),expectedSnapshot:first.snapshotSha256},f.context),/size|snapshot\/resume|digest|mutation/);
  }finally{await rm(f.root,{recursive:true,force:true});}
 }
});
test('exact envelope caps source count, mapping count, metadata size and rejects self-approval fields',async()=>{
 const f=await fixture();try{
  for(const change of [(e:any)=>e.rawSources=Array(65).fill(e.rawSources[0]),(e:any)=>e.boundaries=Array(101).fill(e.boundaries[0]),
   (e:any)=>e.manifest.bytes=1024**2+1,(e:any)=>e.rawSources[0].bundle.bytes=4*1024**2+1,
   (e:any)=>e.policy=f.context.policy,(e:any)=>e.trust=f.context.trust,(e:any)=>e.approved=true]){
   const changed=structuredClone(f.envelope);change(changed);assert.equal(productionAdmissionEnvelopeSchema.safeParse(changed).success,false);
  }
 }finally{await rm(f.root,{recursive:true,force:true});}
});
test('unsafe numeric manifest controls cannot change Python canonical producer identity through JavaScript rounding',async()=>{
 const f=await fixture();try{f.manifest.limits.sourceBytes=Number.MAX_SAFE_INTEGER+1;await f.repin();await assert.rejects(verifyProductionAdmissionWithContext(f.options(),f.context),/exact safe integral/);}finally{await rm(f.root,{recursive:true,force:true});}
});

async function versionTwoFixture(){
 const f=await fixture(),MiB=1024**2,GiB=1024**3;
 const raw={sourceBytes:3,scratchBytes:2*MiB,outputBytes:512*MiB,rowBytes:1024,nodes:10,candidates:10,referencesPerWay:10,seconds:30,freeBytes:0};
 const membership={maxCandidateInputBytes:512*MiB,maxBoundaryBytes:MiB,maxVertices:100000,maxTotalVertices:100000,maxComparisons:1000000,maxRows:10,maxOutputBytes:MiB,maxMilliseconds:1000};
 const catalogue={chunkRows:100,mergeFanIn:2,maxRows:10,fanout:8,maxInputRows:10,maxMetadataRows:10000,maxInputBytes:GiB,maxOutputBytes:MiB,maxScratchBytes:MiB,timeoutMs:1000};
 const capacity:any={schemaVersion:2,kind:'partitioned-geography-capacity-v1',freeBytes:16*GiB,reserveBytes:0,retainedBytes:0,rawSourceAlreadyRetainedBytes:0,allocations:{raw:3,index:MiB,journal:MiB,normalizedOutput:512*MiB,boundaries:MiB,stagedCandidates:0,stagedBoundaries:MiB,footprints:MiB,membership:MiB,sort:MiB,catalogue:MiB,failureReports:MiB,rollback:0},limits:{raw,membership,catalogue,supervisor:{wallSeconds:60,rssBytes:256*MiB,commitBytes:512*MiB,diskBytes:GiB,freeBytes:0,maxProcesses:2}}};
 f.manifest.schemaVersion=2;f.manifest.limits=raw;f.manifest.evidenceLayout={kind:'partitioned-jsonl-v1',maxPartBytes:128*MiB,maxParts:64};
 f.plan.schemaVersion=2;f.plan.evidenceLayout=f.manifest.evidenceLayout;f.plan.maxNormalizedOutputBytes=raw.outputBytes;f.plan.maxCandidateInputBytes=membership.maxCandidateInputBytes;
 const {maxCandidateInputBytes,...controls}=membership;f.plan.membership=controls;f.plan.catalogue=catalogue;f.plan.stream={maxRowBytes:65536,maxBytes:MiB,maxRows:10};
 async function capacityPin(){f.plan.capacityPlan=f.abs(await f.file('capacity.json',capacity));await f.repin();}
 await capacityPin();return {...f,capacity,capacityPin};
}
test('version-two admission binds the exact explicit aggregate capacity, layout and code snapshot',async()=>{
 const f=await versionTwoFixture();try{
  const first=await verifyProductionAdmissionWithContext(f.options(),f.context);
  const capacityPath=await realpath(f.plan.capacityPlan.path);
  assert.ok(first.metadataPins.some(p=>p.path===capacityPath&&p.bytes===f.plan.capacityPlan.bytes&&p.sha256===f.plan.capacityPlan.sha256));
  const identity={policy:f.manifest.policy,evidenceLayout:f.manifest.evidenceLayout,sources:f.manifest.sources.map((source:any)=>Object.fromEntries(Object.entries(source).filter(([key])=>key!=='path').map(([key,value])=>[key,key==='sourceDomain'?Object.fromEntries(Object.entries(value as any).filter(([key])=>key!=='path')):value])))};
  assert.equal(first.producerCatalogueRevision,'osm-'+h(canonical(identity)));
  await verifyProductionAdmissionWithContext({...f.options(),expectedSnapshot:first.snapshotSha256},f.context);
  f.capacity.freeBytes++;await f.capacityPin();
  await assert.rejects(verifyProductionAdmissionWithContext({...f.options(),expectedSnapshot:first.snapshotSha256},f.context),/snapshot\/resume identity changed/);
  await assert.rejects(verifyProductionAdmission(f.options()),/quarantined/);
 }finally{await rm(f.root,{recursive:true,force:true});}
});
test('version-two gate rejects missing, inconsistent or changed capacity without caller authority',async()=>{
 for(const mode of ['missing','tampered','raw','candidate','version']){
  const f=await versionTwoFixture();try{
   if(mode==='missing')delete f.plan.capacityPlan;
   if(mode==='tampered')await writeFile(f.plan.capacityPlan.path,'{}');
   if(mode==='raw')f.manifest.limits.outputBytes++;
   if(mode==='candidate')f.plan.maxCandidateInputBytes++;
   if(mode==='version')f.manifest.schemaVersion=1;
   await f.repin();await assert.rejects(verifyProductionAdmissionWithContext(f.options(),f.context),undefined);
  }finally{await rm(f.root,{recursive:true,force:true});}
 }
});

async function versionThreeAdmissionFixture(){
 const f=await versionTwoFixture(),MiB=1024**2,GiB=1024**3;
 f.plan.schemaVersion=3;f.capacity.schemaVersion=3;f.capacity.kind='partitioned-geography-capacity-v2';
 const member=f.capacity.limits.membership;member.maxGeometryComparisons=member.maxComparisons;delete member.maxComparisons;
 member.maxRows=1500001;member.maxOutputBytes=2*GiB;member.maxMilliseconds=30000;
 f.capacity.allocations.membership=member.maxOutputBytes;f.capacity.limits.raw.candidates=member.maxRows;
 f.capacity.limits.catalogue.maxInputRows=member.maxRows;f.capacity.limits.catalogue.maxInputBytes=member.maxOutputBytes+f.capacity.allocations.footprints;f.capacity.limits.catalogue.timeoutMs=30000;
 f.capacity.limits.supervisor.diskBytes=8*GiB;f.capacity.limits.supervisor.wallSeconds=120;
 f.manifest.limits=f.capacity.limits.raw;f.plan.membership={...member};delete f.plan.membership.maxCandidateInputBytes;
 f.plan.catalogue=f.capacity.limits.catalogue;f.plan.stream.maxBytes=f.capacity.limits.catalogue.maxInputBytes;f.plan.stream.maxRows=member.maxRows;
 async function validationPin(Q:number){const R=4*(f.capacity.allocations.normalizedOutput+member.maxOutputBytes+f.capacity.allocations.footprints)+8*MiB+3*member.maxBoundaryBytes+Q;
  f.plan.validation={maxReadBytes:R,maxRowsRead:R,maxLexicalTokens:R,maxOperations:R,controlAndAdmissionReadBytes:Q};f.capacity.limits.validation=f.plan.validation;await f.capacityPin();}
 await validationPin(64*MiB);
 const session=()=>createResourceSessionV3({validation:f.plan.validation,maxGeometryComparisons:member.maxGeometryComparisons,maxMilliseconds:member.maxMilliseconds},createBootstrapResources(Date.now()));
 return {...f,validationPin,session};
}
test('version-three admission keeps exact matrix and one physical control allowance through both gates',async()=>{
 const f=await versionThreeAdmissionFixture();try{
  const resourceSession=f.session(),first=await verifyProductionAdmissionWithContext({...f.options(),phase:'assembly-before',resourceSession},f.context);
  const initial=resourceSession.validation.controlAndAdmissionReadBytes;
  assert.ok(initial>0);assert.equal(resourceSession.geometry.comparisons,0);assert.ok(resourceSession.validation.lexicalTokens>0);
  await verifyProductionAdmissionWithContext({...f.options(),phase:'assembly-after',expectedSnapshot:first.snapshotSha256,resourceSession},f.context);
  assert.equal(resourceSession.validation.controlAndAdmissionReadBytes,2*initial);
  await f.validationPin(Math.ceil(initial*1.5));const bounded=f.session();
  const before=await verifyProductionAdmissionWithContext({...f.options(),phase:'assembly-before',resourceSession:bounded},f.context);
  await assert.rejects(verifyProductionAdmissionWithContext({...f.options(),phase:'assembly-after',expectedSnapshot:before.snapshotSha256,resourceSession:bounded},f.context),/Control and admission read byte limit/);
 }finally{await rm(f.root,{recursive:true,force:true});}
});
test('version-three admission rejects missing runtime resources and crossed raw/capacity versions',async()=>{
 for(const mode of ['resources','raw3','raw1','capacity2']){
  const f=await versionThreeAdmissionFixture();try{
   if(mode==='raw3')f.manifest.schemaVersion=3;
   if(mode==='raw1')f.manifest.schemaVersion=1;
   if(mode==='capacity2'){f.capacity.schemaVersion=2;f.capacity.kind='partitioned-geography-capacity-v1';await f.capacityPin();}
   await f.repin();

   await assert.rejects(verifyProductionAdmissionWithContext({...f.options(),phase:'assembly-before',...(mode==='resources'?{}:{resourceSession:f.session()})},f.context));
  }finally{await rm(f.root,{recursive:true,force:true});}
 }
});

test('version-three admission reads only precharged body bytes and fences path operations',async t=>{
 const f=await versionThreeAdmissionFixture();try{
  const probe=await open(f.envelope.assemblyPlan.path,'r');
  const prototype=Object.getPrototypeOf(probe),original=prototype.read;await probe.close();
  const positions=new WeakMap<object,number>();let requests=0;
  t.mock.method(prototype,'read',async function(this:any,...args:any[]){
   const s=await this.stat(),position=positions.get(this)??0;
   assert.ok(args[2]<=s.size-position,'admission body requests must fit their precharged remaining bytes');
   const result=await original.apply(this,args);positions.set(this,position+result.bytesRead);requests++;return result;
  });
  const resourceSession=f.session();await verifyProductionAdmissionWithContext({...f.options(),phase:'assembly-before',resourceSession},f.context);
  assert.ok(requests>productionAdmissionCodeFiles.length);
  assert.ok(resourceSession.validation.operations>requests);
 }finally{await rm(f.root,{recursive:true,force:true});}
});

test('version-three final admission cannot restart consumed path and validation operations',async()=>{
 const f=await versionThreeAdmissionFixture();try{
  const measured=f.session();await verifyProductionAdmissionWithContext({...f.options(),phase:'assembly-before',resourceSession:measured},f.context);
  const operations=measured.validation.operations;assert.ok(operations>100);
  f.plan.validation.maxOperations=Math.ceil(operations*1.5);f.capacity.limits.validation=f.plan.validation;await f.capacityPin();
  const bounded=f.session(),before=await verifyProductionAdmissionWithContext({...f.options(),phase:'assembly-before',resourceSession:bounded},f.context);
  await assert.rejects(verifyProductionAdmissionWithContext({...f.options(),phase:'assembly-after',expectedSnapshot:before.snapshotSha256,resourceSession:bounded},f.context),/Validation operation limit/);
  assert.ok(bounded.validation.operations>0);assert.equal(bounded.geometry.comparisons,0);
 }finally{await rm(f.root,{recursive:true,force:true});}
});
