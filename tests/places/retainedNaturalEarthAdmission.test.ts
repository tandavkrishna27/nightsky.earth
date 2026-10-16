import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtemp,readFile,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,win32} from 'node:path';
import {spawnSync} from 'node:child_process';
import {hashRetainedNaturalEarthFile,verifyRetainedNaturalEarthAdmissionPackage} from '../../scripts/osm/prepare-retained-natural-earth-admission';
import {admissionSubjectDigest,sourceAdmissionBundleSchema,validateSourceAdmissionMetadataFiles} from '../../scripts/osm/source-admission';

const hash=(v:string|Buffer)=>createHash('sha256').update(v).digest('hex');
const packet=resolve('docs/operations/natural-earth-admission');
test('bounded retained hash verifies actual bytes and rejects size/hash substitutions',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'retained-ne-hash-')),path=join(dir,'raw');await writeFile(path,'raw');
 assert.equal((await hashRetainedNaturalEarthFile(path,{bytes:3,sha256:hash('raw')})).sha256,hash('raw'));
 await assert.rejects(hashRetainedNaturalEarthFile(path,{bytes:2,sha256:hash('raw')}),/size|identity/);
 await assert.rejects(hashRetainedNaturalEarthFile(path,{bytes:3,sha256:hash('bad')}),/identity|digest/);
 await assert.rejects(hashRetainedNaturalEarthFile(path,{bytes:134217729,sha256:hash('raw')}),/bound|limit/);
});

test('actual retained subjects remain private with no invented reviews or trust grants',async()=>{
 const index=JSON.parse(await readFile(join(packet,'subjects.json'),'utf8'));
 assert.equal(index.productionAdmitted,false);assert.equal(index.sources.length,2);
 for(const row of index.sources){
  const bundle=sourceAdmissionBundleSchema.parse(JSON.parse(await readFile(join(packet,row.bundle.path),'utf8')));
  assert.equal(bundle.source.intendedUse.distribution,'private');assert.deepEqual(bundle.reviews,[]);
  assert.equal(admissionSubjectDigest(bundle.source),row.subjectSha256);
  assert.equal(bundle.source.rights.licenceId,'public-domain');
  assert.ok(!bundle.source.rights.conditions.some(c=>c.id.startsWith('geoboundaries-')));
 }
 assert.equal(index.originalBytes,54014085);assert.equal(index.normalizedBytes,45254883);
 assert.deepEqual(index.featureInventory,{source:4854,mapped:4784,unknown:70,normalizedPositions:1843740});
});

test('actual lineage binds ADM0 once and ADM1 across both retained v6 parts without copying bodies',async()=>{
 const expected=[{name:'adm0',bytes:13287234,sha256:'239eec57ac17f100a11e2536cffc56752c318b50ae765b0918ff7aab4ce8f255',outputs:[12596289]},
  {name:'adm1',bytes:40726851,sha256:'22d0e3ad85eb3e27f17cabf8ba2d50e554fbc27a87796ff891d958185da62fb5',outputs:[24718304,7940290]}];
 for(const row of expected){
  // These are actual retained Windows paths. Static inspection must not reinterpret them as native Linux execution paths.
  const lineage=JSON.parse(await readFile(join(packet,'lineage',row.name+'.json'),'utf8'));
  assert.equal(lineage.kind,'boundary-normalization-lineage');
  assert.equal(lineage.source.bytes,row.bytes);assert.equal(lineage.source.sha256,row.sha256);
  assert.deepEqual(lineage.outputs.map((p:any)=>p.bytes),row.outputs);
  assert.ok(lineage.outputs.every((p:any)=>win32.isAbsolute(p.path)&&p.path.includes('plugin-v1')&&p.path.includes('nine-global-staged-validation-20261016-v6')&&p.path.includes('prepared')));
 }
});

test('all committed metadata pins verify without traversing retained absolute body paths',async()=>{
 const index=JSON.parse(await readFile(join(packet,'subjects.json'),'utf8'));
 for(const pin of index.artifacts){const bytes=await readFile(join(packet,pin.path));assert.equal(bytes.length,pin.bytes);assert.equal(hash(bytes),pin.sha256);}
});

test('Windows metadata gate verifies actual lineage while proposed records cannot self-admit empty review bundles',
 {skip:process.platform!=='win32'?'Actual retained lineage pins use Windows absolute paths; native runtime-path admission is Windows-only, static pins remain checked everywhere':false},async()=>{
 const result=await verifyRetainedNaturalEarthAdmissionPackage(packet);assert.equal(result.productionAdmitted,false);
 const proposal=JSON.parse(await readFile(join(packet,'proposed-records.json'),'utf8'));
 const bytes=await readFile(join(packet,'proposed-records.json'));
 for(const name of ['adm0-bundle.json','adm1-bundle.json']){
  const checked=await validateSourceAdmissionMetadataFiles(join(packet,name),{policy:{schemaVersion:1,policyId:'synthetic-proposal-inspection-only',
   inventoryRoots:[{path:'proposed-records.json',bytes:bytes.length,sha256:hash(bytes)}],sources:proposal.sources},trust:{schemaVersion:1,trustedReviews:[]},trustDirectory:packet});
  assert.equal(checked.disposition,'quarantined');assert.ok(checked.gaps.includes('missing-review:admission-approval'));
 }
});

test('assembler CLI defaults to an offline plan and does not read or acquire large bodies',()=>{
 const run=spawnSync(process.execPath,['--import','tsx',resolve('scripts/osm/prepare-retained-natural-earth-admission.ts')],{encoding:'utf8'});
 assert.equal(run.status,0,run.stderr);const plan=JSON.parse(run.stdout);
 assert.equal(plan.mode,'offline-retained-natural-earth-admission-plan');assert.equal(plan.productionAdmitted,false);
 assert.equal(plan.networkRequests,0);assert.equal(plan.originalBytes,54014085);
});

test('metadata verifier refuses package-relative path escapes before opening referenced evidence',async()=>{
 const root=await mkdtemp(join(tmpdir(),'ne-packet-escape-'));
 const baseline=JSON.parse(await readFile(join(packet,'subjects.json'),'utf8'));
 for(const path of ['../escape.json','..\\escape.json']){
  await writeFile(join(root,'subjects.json'),JSON.stringify({...baseline,artifacts:[{path,bytes:1,sha256:hash('x')}]}));
  await assert.rejects(verifyRetainedNaturalEarthAdmissionPackage(root),/Unsafe.*path/);
 }
});

test('malformed index count, duplicate, aggregate and subject bindings fail before any referenced artifact read',async()=>{
 const root=await mkdtemp(join(tmpdir(),'ne-index-bounds-')),baseline=JSON.parse(await readFile(join(packet,'subjects.json'),'utf8'));
 const malformed=[
  {...baseline,artifacts:Array.from({length:33},(_,i)=>({path:`evidence/file${i}.json`,bytes:1,sha256:hash('x')}))},
  {...baseline,artifacts:[baseline.artifacts[0],baseline.artifacts[0]]},
  {...baseline,artifacts:[0,1,2].map(i=>({path:`evidence/oversize${i}.json`,bytes:4194304,sha256:hash('x')}))},
  {...baseline,sources:[baseline.sources[0],baseline.sources[0]]},
  {...baseline,sources:[{...baseline.sources[0],subjectSha256:'0'.repeat(64)},baseline.sources[1]]},
  {...baseline,sources:[{...baseline.sources[0],bundle:baseline.sources[1].bundle},baseline.sources[1]]},
 ];
 for(const index of malformed){
  await writeFile(join(root,'subjects.json'),JSON.stringify(index));
  await assert.rejects(verifyRetainedNaturalEarthAdmissionPackage(root),(error:any)=>{
   assert.notEqual(error.code,'ENOENT','verifier opened a referenced file before validating the index');return true;
  });
 }
});
