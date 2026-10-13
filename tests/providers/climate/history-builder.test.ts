import test from 'node:test';
import assert from 'node:assert/strict';
import { reviewedHistoricalManifest } from '../../../scripts/era5/build-pilot';
test('historical requests cover contiguous years with distinct outer boundaries',()=>{
 const plan=reviewedHistoricalManifest(1991,1992);
 assert.equal(plan.chunks.length,52);
 assert.equal(plan.chunks.find(c=>c.chunkId==='hanle-1992-02')!.expectedHours,696);
 assert.equal(plan.observingNightStart,'1991-01-01');
 assert.equal(plan.sampleKind,'sample-only');
 assert.equal(reviewedHistoricalManifest(1991,2020).chunks.length,724);
 assert.throws(()=>reviewedHistoricalManifest(1990,2020));
});
