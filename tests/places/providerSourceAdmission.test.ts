import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtemp,readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import * as admission from '../../scripts/osm/source-admission';

const hash=(v:string|Buffer)=>createHash('sha256').update(v).digest('hex');
const conditions=['exact-original-source-identity','licensor-authority','original-source-to-payload-chain','mixed-output-compatibility-review',
 'public-domain-jurisdiction-and-authority','third-party-rights-review','source-and-edition-notice',
 'natural-earth-exact-edition-and-source','natural-earth-normalization-and-limitations','normalized-boundary-lineage'];
// Synthetic operator policy and receipts only. These grant no real Natural Earth source admission.
async function fixture(){
 const root=await mkdtemp(join(tmpdir(),'provider-admission-'));
 const retain=async(name:string,value:unknown)=>{const bytes=Buffer.from(JSON.stringify(value));await writeFile(join(root,name),bytes);return {path:name,bytes:bytes.length,sha256:hash(bytes)};};
 const evidence=await retain('metadata.json',{fixture:'synthetic metadata; independent review required'});
 const payload={url:'https://example.org/edition-1/original.geojson',bytes:3,sha256:hash('raw'),identityEvidence:evidence};
 const lineage:any={schemaVersion:1,kind:'boundary-normalization-lineage',source:{url:payload.url,bytes:3,sha256:hash('raw')},transformRevision:'synthetic-transform-1',outputs:[{path:join(root,'normalized.json'),bytes:3,sha256:hash('out')}]};
 const lineagePin=await retain('lineage.json',lineage);
 const source:any={key:'SYN-NE-ADM0',kind:'boundary',edition:'synthetic-edition-1',recordSha256:hash('synthetic-record'),
  originalSource:{identity:'Synthetic original source',url:'https://example.org/edition-1/source',provenanceEvidence:evidence},payload,
  manifest:evidence,effectiveClip:{status:'not-applicable',reason:'Administrative membership only'},
  intendedUse:{purpose:'Synthetic membership',transformRevision:'synthetic-transform-1',distribution:'private',outputLicence:'ODbL-1.0'},
  rights:{classification:'adaptation',licensor:'Synthetic source',licenceId:'public-domain',licenceEvidence:evidence,
   notices:[{text:'Synthetic source, generalized boundaries and transformations disclosed',destination:'https://example.org/edition-1/notices'}],
   conditions:conditions.map(id=>({id,evidence:id==='normalized-boundary-lineage'?lineagePin:evidence}))}};
 source.manifest=await retain('manifest.json',{schemaVersion:1,kind:'source-admission-manifest',records:[{sourceKey:source.key,kind:'boundary',edition:source.edition,recordSha256:source.recordSha256,payload:{url:payload.url,bytes:payload.bytes,sha256:payload.sha256}}]});
 const policy:any={schemaVersion:1,policyId:'synthetic-provider-policy',inventoryRoots:[await retain('inventory.json',{fixture:'operator inventory'})],sources:[{key:source.key,kind:'boundary',edition:source.edition,recordSha256:source.recordSha256,originalLicenceId:'public-domain',disposition:'reviewable',requiredConditions:conditions,boundaryProvider:'natural-earth',naturalEarthIdentity:{originalSourceUrl:source.originalSource.url,payload,licenceEvidence:evidence,normalizationEvidence:lineagePin}}]};
 const bundle:any={schemaVersion:1,source,reviews:[]},trust:any={schemaVersion:1,trustedReviews:[]};
 async function refresh(){
  const subjectSha256=admission.admissionSubjectDigest(source);
  bundle.reviews=[];
  for(const role of ['source-provenance','payload-validation','rights-review','admission-approval']){
   const receipt={schemaVersion:1,role,subjectSha256,reviewer:'synthetic-reviewer',reviewedAt:'2026-10-16T00:00:00Z',decision:'approve'};
   const {schemaVersion:_v,...review}=receipt;
   bundle.reviews.push({...review,evidence:await retain(role+'.json',receipt)});
  }
  trust.trustedReviews=bundle.reviews.map(({role,subjectSha256,reviewer,evidence}:any)=>({role,subjectSha256,reviewer,evidence}));
  await writeFile(join(root,'bundle.json'),JSON.stringify(bundle));
 }
 await refresh();
 return {root,bundle,trust,policy,lineage,retain,refresh};
}

test('Natural Earth provider conditions come from trusted policy without misleading GeoBoundaries notices',async()=>{
 const {bundle,trust,policy}=await fixture();
 const result=admission.validateSourceAdmission(bundle,trust,policy);
 assert.equal(result.disposition,'prepared-for-separate-acquisition-review');assert.deepEqual(result.gaps,[]);
 assert.equal(admission.validateSourceAdmission(bundle,{schemaVersion:1,trustedReviews:[]},policy).disposition,'quarantined');
 const candidate=structuredClone(bundle);candidate.source.boundaryProvider='natural-earth';
 assert.equal(admission.sourceAdmissionBundleSchema.safeParse(candidate).success,false);
});

test('omitted trusted provider preserves legacy GeoBoundaries conditions regardless of candidate identity',async()=>{
 const {bundle,trust,policy}=await fixture();delete policy.sources[0].boundaryProvider;delete policy.sources[0].naturalEarthIdentity;
 bundle.source.originalSource.identity='Natural Earth';
 const result=admission.validateSourceAdmission(bundle,trust,policy);
 assert.ok(result.gaps.includes('missing-condition:geoboundaries-cc-by-4.0-attribution'));
 assert.ok(result.gaps.includes('missing-condition:geoboundaries-modification-and-edition-notice'));
});

test('trusted Natural Earth identity rejects changed source, payload, licence or normalization evidence even with fresh reviews',async()=>{
 const f=await fixture();
 for(const mutate of [(s:any)=>s.originalSource.url='https://example.org/other/source',(s:any)=>s.payload.sha256=hash('other'),
  (s:any)=>s.rights.licenceEvidence={...s.rights.licenceEvidence,sha256:hash('other')},
  (s:any)=>s.rights.conditions.find((c:any)=>c.id==='normalized-boundary-lineage').evidence={...s.rights.licenceEvidence,sha256:hash('other')}]){
  const changed=structuredClone(f.bundle);mutate(changed.source);
  const subject=admission.admissionSubjectDigest(changed.source);
  for(const review of changed.reviews)review.subjectSha256=subject;
  const freshTrust={schemaVersion:1,trustedReviews:changed.reviews.map(({role,subjectSha256,reviewer,evidence}:any)=>({role,subjectSha256,reviewer,evidence}))};
  const result=admission.validateSourceAdmission(changed,freshTrust,f.policy);
  assert.ok(result.gaps.some(g=>g.startsWith('natural-earth-identity-mismatch:')));
  assert.ok(!result.gaps.some(g=>g.startsWith('stale-review:')));
 }
 const missing=structuredClone(f.policy);delete missing.sources[0].naturalEarthIdentity;
 assert.equal(admission.sourceAdmissionPolicySchema.safeParse(missing).success,false);
 const nonBoundary=structuredClone(f.policy);nonBoundary.sources[0].kind='osm-planet';
 assert.equal(admission.sourceAdmissionPolicySchema.safeParse(nonBoundary).success,false);
 const misleading=structuredClone(f.policy);misleading.sources[0].requiredConditions.push('geoboundaries-cc-by-4.0-attribution');
 assert.equal(admission.sourceAdmissionPolicySchema.safeParse(misleading).success,false);
});

test('bounded metadata gate verifies normalized lineage and returns exact evidence snapshots',async()=>{
 const f=await fixture();
 const checked=await admission.validateSourceAdmissionMetadataFiles(join(f.root,'bundle.json'),{policy:f.policy,trust:f.trust,trustDirectory:f.root});
 assert.equal(checked.disposition,'prepared-for-separate-acquisition-review');
 assert.deepEqual(checked.source,f.bundle.source);
 assert.ok(checked.evidenceSnapshot.some(p=>p.path===join(f.root,'lineage.json')));
 assert.ok(checked.evidenceSnapshot.some(p=>p.path===join(f.root,'inventory.json')));
 for(const p of checked.evidenceSnapshot){const bytes=await readFile(p.path);assert.equal(p.bytes,bytes.length);assert.equal(p.sha256,hash(bytes));}
 assert.ok(!checked.evidenceSnapshot.some(p=>p.path===join(f.root,'normalized.json')));
 await writeFile(join(f.root,'lineage.json'),'tampered');
 await assert.rejects(admission.validateSourceAdmissionMetadataFiles(join(f.root,'bundle.json'),{policy:f.policy,trust:f.trust,trustDirectory:f.root}),/pin|checksum/);
});

test('pinned normalization declarations must structurally bind original identity, revision and unique bounded outputs',async()=>{
 for(const patch of [{source:{url:'https://example.org/wrong.geojson',bytes:3,sha256:hash('raw')}},{transformRevision:'other-transform'},
  {outputs:[]},{outputs:[{path:'relative.json',bytes:3,sha256:hash('out')}]},
  {outputs:[{path:join(tmpdir(),'oversize.json'),bytes:134217729,sha256:hash('out')}]},
  {unexpected:true}]){
  const f=await fixture();const changed={...f.lineage,...patch};
  const pin=await f.retain('lineage.json',changed);
  f.bundle.source.rights.conditions.find((c:any)=>c.id==='normalized-boundary-lineage').evidence=pin;
  f.policy.sources[0].naturalEarthIdentity.normalizationEvidence=pin;await f.refresh();
  await assert.rejects(admission.validateSourceAdmissionMetadataFiles(join(f.root,'bundle.json'),{policy:f.policy,trust:f.trust,trustDirectory:f.root}));
 }
 const f=await fixture();const duplicate={...f.lineage,outputs:[f.lineage.outputs[0],f.lineage.outputs[0]]};
 const pin=await f.retain('lineage.json',duplicate);f.bundle.source.rights.conditions.find((c:any)=>c.id==='normalized-boundary-lineage').evidence=pin;
 f.policy.sources[0].naturalEarthIdentity.normalizationEvidence=pin;await f.refresh();
 await assert.rejects(admission.validateSourceAdmissionMetadataFiles(join(f.root,'bundle.json'),{policy:f.policy,trust:f.trust,trustDirectory:f.root}),/Duplicate|unique/);
});

test('production helper derives immutable policy and empty trusted reviews instead of candidate context',async()=>{
 const f=await fixture();const before=await admission.buildRetainedSourceAdmissionPolicy();
 const result=await admission.validateProductionSourceAdmissionFiles(join(f.root,'bundle.json'));
 assert.equal(result.disposition,'quarantined');assert.ok(result.gaps.includes('policy-source-not-found'));
 assert.ok(result.gaps.includes('untrusted-review:admission-approval'));
 assert.deepEqual(await admission.buildRetainedSourceAdmissionPolicy(),before);
});

test('shared metadata allowance stops distinct reads across bundles before overspending and deduplicates rereads',async()=>{
 const f=await fixture(),context={policy:f.policy,trust:f.trust,trustDirectory:f.root};
 const baseline=await admission.validateSourceAdmissionMetadataFiles(join(f.root,'bundle.json'),context);
 const total=baseline.evidenceSnapshot.reduce((n,p)=>n+p.bytes,0);
 const small={bytes:0,ceiling:total-1,paths:new Map<string,number>()};
 await assert.rejects(admission.validateSourceAdmissionMetadataFiles(join(f.root,'bundle.json'),context,small),/Shared metadata/);
 assert.ok(small.bytes<=small.ceiling);
 assert.equal(small.bytes,[...small.paths.values()].reduce((a,b)=>a+b,0));
 const shared={bytes:0,ceiling:total,paths:new Map<string,number>()};
 await admission.validateSourceAdmissionMetadataFiles(join(f.root,'bundle.json'),context,shared);
 assert.equal(shared.bytes,total);
 await admission.validateSourceAdmissionMetadataFiles(join(f.root,'bundle.json'),context,shared);
 assert.equal(shared.bytes,total);
 const other=await fixture();
 await assert.rejects(admission.validateSourceAdmissionMetadataFiles(join(other.root,'bundle.json'),{policy:other.policy,trust:other.trust,trustDirectory:other.root},shared),/Shared metadata/);
 assert.equal(shared.bytes,total);
 await assert.rejects(admission.validateProductionSourceAdmissionFiles(join(f.root,'bundle.json'),{bytes:0,ceiling:1,paths:new Map()}),/Shared metadata/);
 const inventory=baseline.evidenceSnapshot.find(p=>p.path===join(f.root,'inventory.json'))!;
 const changedSize={bytes:inventory.bytes-1,ceiling:total,paths:new Map([[inventory.path,inventory.bytes-1]])};
 await assert.rejects(admission.validateSourceAdmissionMetadataFiles(join(f.root,'bundle.json'),context,changedSize),/Shared metadata path size changed/);
 for(const accounting of [{bytes:0,ceiling:33554433,paths:new Map<string,number>()},{bytes:1,ceiling:1024,paths:new Map<string,number>()}]){
  await assert.rejects(admission.validateSourceAdmissionMetadataFiles(join(f.root,'bundle.json'),context,accounting),/Shared metadata/);
 }
});
