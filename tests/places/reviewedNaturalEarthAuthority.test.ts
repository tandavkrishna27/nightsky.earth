import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {buildRetainedSourceAdmissionPolicy,validateProductionSourceAdmissionFiles} from '../../scripts/osm/source-admission';

const packet=resolve('docs/operations/natural-earth-admission');
const subjects=['6afdd8189eb50e1d8e508393d051cb5fef5fffa13030518a95965fb854f06e79','06d404498660df3a966f5f7fcf0d3a058b5f1ee2b41030cacc32072b367a0673'];

// A missing/replaced operator record must fail here even when candidate metadata is unchanged.
test('reviewed operator policy binds the actual selected Natural Earth original and normalized lineage identities',async()=>{
 const policy=await buildRetainedSourceAdmissionPolicy();
 for(const level of [0,1]){
  const source=JSON.parse(await readFile(join(packet,`adm${level}-bundle.json`),'utf8')).source;
  const record=policy.sources.find(record=>record.key===`NE-v5.1.1-ADM${level}`);
  assert.ok(record,'actual reviewed source must be present in fixed operator policy');
  assert.equal(record.boundaryProvider,'natural-earth');
  assert.equal(record.recordSha256,source.recordSha256);
  assert.deepEqual(record.naturalEarthIdentity,{originalSourceUrl:source.originalSource.url,payload:source.payload,
   licenceEvidence:source.rights.licenceEvidence,normalizationEvidence:source.rights.conditions.find((c:any)=>c.id==='normalized-boundary-lineage').evidence});
 }
 assert.equal(policy.sources.some(record=>record.key==='OSM-planet-261012'),false);
});

// The actual lineage names retained Windows files. CI elsewhere must not substitute fictional paths.
test('fixed production authority accepts only the independently reviewed private Natural Earth subjects', {skip:process.platform!=='win32'},async()=>{
 for(const level of [0,1]){
  const result=await validateProductionSourceAdmissionFiles(join(packet,`reviewed-adm${level}-bundle.json`));
  assert.equal(result.disposition,'prepared-for-separate-acquisition-review');assert.deepEqual(result.gaps,[]);
  assert.equal(result.subjectSha256,subjects[level]);assert.equal(result.source.intendedUse.distribution,'private');
  assert.deepEqual(result.bundle.reviews.map(review=>review.role).sort(),['admission-approval','payload-validation','rights-review','source-provenance']);
  assert.ok(result.evidenceSnapshot.some(pin=>pin.path===join(packet,'reviewed-authority.json')));
  assert.ok(result.evidenceSnapshot.some(pin=>pin.path===join(packet,'independent-review.json')));
  const unsigned=await validateProductionSourceAdmissionFiles(join(packet,`adm${level}-bundle.json`));
  assert.equal(unsigned.disposition,'quarantined');assert.ok(unsigned.gaps.includes('missing-review:admission-approval'));
 }
});
