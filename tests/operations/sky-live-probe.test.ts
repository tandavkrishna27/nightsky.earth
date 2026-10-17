import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {runSkyProbe,SKY_PROBE_PLAN} from '../../scripts/validate-sky-live';
const env={NIGHTSKY_NASA_API_KEY:'synthetic-nasa-secret',NIGHTSKY_ASTRONOMY_API_APP_ID:'synthetic-id',NIGHTSKY_ASTRONOMY_API_APP_SECRET:'synthetic-astro-secret'};
test('diagnostic is bounded, records before transport, redacts and refuses journal reuse',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'sky-probe-'));t.after(()=>rm(dir,{recursive:true,force:true}));const path=join(dir,'journal.jsonl');let calls=0;
 const report=await runSkyProbe(env,path,(async(input,init)=>{calls++;assert.equal(init?.redirect,'error');const record=await readFile(path,'utf8');assert.ok(record.includes('"attempt":'));assert.ok(record.includes('"reservation":'));assert.ok(!record.includes(env.NIGHTSKY_NASA_API_KEY));return new Response('synthetic-astro-secret',{status:503});}) as typeof fetch);
 assert.equal(calls,5);assert.equal(report.attempts.length,5);assert.equal(SKY_PROBE_PLAN.requests,6);assert.ok(report.results.every(r=>r.status==='unavailable'));assert.ok(!JSON.stringify(report).includes('synthetic-'));assert.ok(!(await readFile(path,'utf8')).includes('synthetic-astro-secret'));
 await assert.rejects(runSkyProbe(env,path,async()=>{throw Error('must not call');}));
});
test('diagnostic refuses missing credentials before making a journal',async()=>{
 await assert.rejects(runSkyProbe({},'not-created-sky-probe.jsonl',async()=>{throw Error('must not call');}));
});
