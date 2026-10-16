import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {buildRetainedSourceAdmissionPolicy} from '../../scripts/osm/source-admission';
import {buildPlanetPolicyPreparation,PLANET_SOURCE} from '../../scripts/osm/planet-policy-preparation';

test('preparation leaves missing planet identity and trusted approvals unresolved without changing retained policy',async()=>{
 const before=await buildRetainedSourceAdmissionPolicy();
 const report=await buildPlanetPolicyPreparation();
 assert.equal(report.mode,'offline-policy-preparation');
 assert.equal(report.productionAdmitted,false);assert.equal(report.acquisitionAuthorized,false);
 assert.equal(report.planet.rawSha256,null);assert.equal(report.planet.nativeVintage,null);
 assert.equal(report.planet.policyStatus,'missing-from-retained-policy');
 assert.equal(report.planet.subjectSha256,null);assert.deepEqual(report.planet.trustedReviews,[]);
 assert.ok(report.blockers.includes('planet-raw-sha256-unmeasured'));
 assert.ok(report.blockers.includes('planet-native-vintage-unobserved'));
 assert.ok(report.blockers.includes('operator-controlled-policy-revision-required'));
 assert.ok(report.postReceiptGates.some(g=>g.id==='trusted-subject-reviews'&&g.requiresReceipt));
 assert.deepEqual(await buildRetainedSourceAdmissionPolicy(),before);
});

test('proposed source identity cannot silently change dated URL, edition, exact bytes, version or checksums',async()=>{
 for(const [field,value] of [['url','https://example.org/latest.pbf'],['edition','planet-261019.osm.pbf'],['bytes',95380942830],['versionId','another-version'],['etag','another-etag'],['md5','0'.repeat(32)],['lastModified','2026-10-16T00:00:00Z'],['provider','mirror']] as const){
  await assert.rejects(buildPlanetPolicyPreparation({...PLANET_SOURCE,[field]:value}));
 }
 assert.equal((await buildPlanetPolicyPreparation({...PLANET_SOURCE})).planet.source.bytes,95380942829);
});

test('preparation rejects supplied hashes, approval claims or candidate-selected policies',async()=>{
 for(const extra of [{rawSha256:'a'.repeat(64)},{nativeVintage:'2026-10-12T00:00:00Z'},{trustedReviews:[]},{productionAdmitted:true},{policy:{sources:[]}}]){
  await assert.rejects(buildPlanetPolicyPreparation({...PLANET_SOURCE,...extra}));
 }
});

test('Natural Earth retained preparation does not silently become generic production admission',async()=>{
 const report=await buildPlanetPolicyPreparation();
 assert.equal(report.naturalEarth.productionAdmitted,false);
 assert.equal(report.naturalEarth.layers.length,2);
 assert.ok(report.naturalEarth.layers.every(l=>l.policyStatus==='missing-from-retained-policy'));
 assert.ok(report.blockers.includes('natural-earth-trusted-provider-record-required'));
 assert.ok(report.blockers.includes('real-source-production-admission-evidence-required'));
 assert.equal(report.naturalEarth.providerConditionSupport,'implemented-operator-controlled-policy');
 assert.ok(report.naturalEarth.forbiddenSubstituteConditions.includes('geoboundaries-cc-by-4.0-attribution'));
 assert.ok(report.naturalEarth.forbiddenSubstituteConditions.includes('geoboundaries-modification-and-edition-notice'));
 assert.equal(report.productionGateSupport,'implemented-fixed-policy-and-pinned-trust');
 assert.ok(report.postReceiptGates.some(g=>g.id==='actual-production-admission-envelope'&&g.requiresReceipt));
 assert.equal(report.serving.rawPlanetOnTinyServer,false);
 assert.equal(report.assemblyPinMaxBytes,134217728);
});

test('offline CLI defaults to preparation and validates only bounded explicit metadata files',async()=>{
 const script=resolve('scripts/osm/planet-policy-preparation.ts');
 const run=(args:string[])=>spawnSync(process.execPath,['--import','tsx',script,...args],{encoding:'utf8'});
 const result=run([]);assert.equal(result.status,0,result.stderr);
 assert.equal(JSON.parse(result.stdout).acquisitionAuthorized,false);
 const dir=await mkdtemp(join(tmpdir(),'planet-policy-'));const path=join(dir,'request.json');
 await writeFile(path,JSON.stringify(PLANET_SOURCE));const before=await readFile(path);
 assert.equal(run(['--check',path]).status,0);assert.deepEqual(await readFile(path),before);
 await writeFile(path,JSON.stringify({...PLANET_SOURCE,bytes:95380942830}));assert.notEqual(run(['--check',path]).status,0);
 await writeFile(path,' '.repeat(65537));assert.notEqual(run(['--check',path]).status,0);
 assert.notEqual(run(['--acquire']).status,0);
});
