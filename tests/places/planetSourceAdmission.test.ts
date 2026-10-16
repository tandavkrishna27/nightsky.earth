import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sourceAdmissionSourceSchema} from '../../scripts/osm/source-admission';
const h=(s:string)=>createHash('sha256').update(s).digest('hex');
const p={path:'evidence.json',bytes:1,sha256:h('e')};
export function planetFixture(){return {key:'planet-fixture',kind:'osm-planet',edition:'fixture-1',manifest:p,recordSha256:h('record'),originalSource:{identity:'Synthetic provider',url:'https://example.org/edition-1',provenanceEvidence:p},payload:{url:'https://example.org/edition-1.osm',bytes:3,sha256:h('raw'),identityEvidence:p},effectiveClip:{status:'planet-domain',descriptor:{schemaVersion:1,kind:'planet-domain-v1',sourceUrl:'https://example.org/edition-1.osm',edition:'fixture-1',provider:'Synthetic provider',providerWholeWorldEvidence:p,providerObject:{version:'v1',etag:'etag',md5:'a'.repeat(32)},raw:{bytes:3,sha256:h('raw')},nativeVintage:'2026-10-12T00:00:00Z',nativeVintageEvidence:p,domain:{west:-180,south:-90,east:180,north:90},selectionPolicy:'named-complete-way-v1-polar85',coverageClaim:'source-domain-only'},descriptorEvidence:p},intendedUse:{purpose:'fixture',transformRevision:'v1',distribution:'private',outputLicence:'ODbL-1.0'},rights:{classification:'derivative-database',licensor:'Synthetic provider',licenceId:'ODbL-1.0',licenceEvidence:p,notices:[{text:'fixture',destination:'https://example.org/notices'}],conditions:[]}};}
test('planet source accepts an explicit whole-world domain without provider polygon',()=>{assert.equal(sourceAdmissionSourceSchema.safeParse(planetFixture()).success,true);});
import * as admission from '../../scripts/osm/source-admission';
import {mkdtemp,writeFile,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
test('descriptor creation hashes actual retained raw and rejects source and native-vintage substitution',async()=>{
 const build=(admission as any).createPlanetDomainDescriptor;assert.equal(typeof build,'function');
 const dir=await mkdtemp(join(tmpdir(),'planet-domain-'));const raw=join(dir,'raw.osm');await writeFile(raw,'raw');
 const d=planetFixture().effectiveClip.descriptor;await writeFile(join(dir,'evidence.json'),'e');
 const receipt={schemaVersion:1,kind:'native-vintage-observation',raw:d.raw,nativeVintage:d.nativeVintage};
 const bytes=JSON.stringify(receipt);await writeFile(join(dir,'native.json'),bytes);d.nativeVintageEvidence={path:'native.json',bytes:Buffer.byteLength(bytes),sha256:h(bytes)};
 const result=await build(raw,d,join(dir,'domain.json'));assert.deepEqual(JSON.parse(result.bytes.toString()),d);assert.equal(result.sha256,h(result.bytes.toString()));const reordered=Object.fromEntries(Object.entries(d).reverse());assert.deepEqual((await build(raw,reordered,join(dir,'domain.json'))).bytes,result.bytes);
 await assert.rejects(build(raw,{...d,raw:{...d.raw,sha256:h('wrong')}},join(dir,'domain.json')),/raw identity/);
 await assert.rejects(build(raw,{...d,nativeVintage:'2026-10-13T00:00:00Z'},join(dir,'domain.json')),/native vintage/);
});
test('planet domain rejects partial world and premature coverage claims',()=>{
 for(const patch of [{domain:{west:-179,south:-90,east:180,north:90}},{coverageClaim:'searched-world'},{selectionPolicy:'all-features'},{providerPolygon:true}]){
 const source=planetFixture();Object.assign(source.effectiveClip.descriptor,patch);assert.equal(sourceAdmissionSourceSchema.safeParse(source).success,false);
 }
});
test('planet source binding and reviews cannot be bypassed by extract labels or fresh declarations',()=>{
 const source=planetFixture();const bundle={schemaVersion:1,source,reviews:[]};const policy={schemaVersion:1,policyId:'fictional',inventoryRoots:[p],sources:[{key:source.key,kind:source.kind,edition:source.edition,recordSha256:source.recordSha256,originalLicenceId:'ODbL-1.0',disposition:'reviewable',requiredConditions:['attribution']}]};
 const check=()=>admission.validateSourceAdmission(bundle,{schemaVersion:1,trustedReviews:[]},policy);
 assert.ok(check().gaps.includes('missing-review:planet-domain'));
 source.effectiveClip.descriptor.sourceUrl='https://example.org/wrong.osm';assert.ok(check().gaps.includes('planet-domain-source-mismatch'));
 source.kind='osm-extract';assert.ok(check().gaps.includes('effective-clip-required'));
});

test('nested planet admission resolves linked evidence beside descriptor, not bundle',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'nested-planet-'));await mkdir(join(dir,'nested'));
 const source=planetFixture(),d=source.effectiveClip.descriptor;await writeFile(join(dir,'evidence.json'),'e');
 const observation=JSON.stringify({schemaVersion:1,kind:'native-vintage-observation',raw:d.raw,nativeVintage:d.nativeVintage});
 await writeFile(join(dir,'nested','native.json'),observation);d.nativeVintageEvidence={path:'native.json',bytes:Buffer.byteLength(observation),sha256:h(observation)};
 await writeFile(join(dir,'nested','provider.txt'),'provider');d.providerWholeWorldEvidence={path:'provider.txt',bytes:8,sha256:h('provider')};
 const raw=join(dir,'raw');await writeFile(raw,'raw');const descriptorPath=join(dir,'nested','domain.json');
 const built=await admission.createPlanetDomainDescriptor(raw,d,descriptorPath);await writeFile(descriptorPath,built.bytes);
 source.effectiveClip.descriptorEvidence={path:'nested/domain.json',bytes:built.bytes.length,sha256:built.sha256};
 const manifest=JSON.stringify({schemaVersion:1,kind:'source-admission-manifest',records:[{sourceKey:source.key,kind:source.kind,edition:source.edition,recordSha256:source.recordSha256,payload:{url:source.payload.url,bytes:source.payload.bytes,sha256:source.payload.sha256}}]});
 source.manifest={path:'manifest.json',bytes:Buffer.byteLength(manifest),sha256:h(manifest)};await writeFile(join(dir,'manifest.json'),manifest);
 const bp=join(dir,'bundle.json'),tp=join(dir,'trust.json');await writeFile(bp,JSON.stringify({schemaVersion:1,source,reviews:[]}));await writeFile(tp,JSON.stringify({schemaVersion:1,trustedReviews:[]}));
 assert.ok((await admission.validateSourceAdmissionFiles(bp,tp)).gaps.includes('policy-source-not-found'));
 await writeFile(join(dir,'nested','provider.txt'),'tampered');await assert.rejects(admission.validateSourceAdmissionFiles(bp,tp),/checksum/);
});
