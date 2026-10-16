import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {admissionSubjectDigest} from '../../scripts/osm/source-admission';
import {verifyProductionAdmission,verifyProductionAdmissionWithContext,productionAdmissionEnvelopeSchema} from '../../scripts/osm/production-source-admission';

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
  assert.equal(first.snapshotSha256,after.snapshotSha256);assert.ok(first.metadataPins.some(p=>p.path.endsWith('lineage.json')));assert.equal(first.geometryPins.length,2);assert.equal(first.codePins.length,5);
 }finally{await rm(f.root,{recursive:true,force:true});}
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
