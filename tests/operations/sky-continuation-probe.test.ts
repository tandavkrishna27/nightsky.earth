import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {runSkyContinuation,SKY_CONTINUATION_PLAN,classifyResponse} from '../../scripts/validate-sky-continuation';
const env={NIGHTSKY_NASA_API_KEY:'synthetic-secret',NIGHTSKY_ASTRONOMY_API_APP_ID:'synthetic-id',NIGHTSKY_ASTRONOMY_API_APP_SECRET:'synthetic-secret'};
test('continuation reserves and journals each of four endpoints once, with no raw values',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'sky-continuation-'));t.after(()=>rm(dir,{recursive:true,force:true}));const path=join(dir,'journal.jsonl');const seen=new Set<string>();
 const report=await runSkyContinuation(env,path,(async(input,init)=>{const url=new URL(String(input));assert.equal(init?.redirect,'error');assert.ok(!seen.has(url.pathname));seen.add(url.pathname);const journal=await readFile(path,'utf8');assert.ok(journal.includes('"reservation":'));assert.ok(journal.includes('"attempt":"'+url.hostname+url.pathname+'"'));
 if(url.pathname==='/sbdb.api')return Response.json({signature:{version:'1.3'},object:{spkid:'2000001',des:'1',fullname:'1 Ceres',neo:false,pha:false,kind:'an'}});
 return Response.json({error:'synthetic-secret invalid input parameter'},{status:200});}) as typeof fetch);
 assert.equal(seen.size,4);assert.equal(report.attempts.length,4);assert.equal(SKY_CONTINUATION_PLAN.requests,4);assert.equal(SKY_CONTINUATION_PLAN.totalAcceptedBytes,1048576);assert.ok(!(await readFile(path,'utf8')).includes('synthetic-'));assert.ok((await readFile(path,'utf8')).includes('request-parameters'));
 await assert.rejects(runSkyContinuation(env,path,async()=>{throw Error('must not call');}));
});
test('classifier emits only fixed diagnostic fields',()=>{
 assert.deepEqual(classifyResponse('api.nasa.gov/DONKI/GST',503,'secret'),{kind:'upstream-server'});
 assert.deepEqual(classifyResponse('api.nasa.gov/DONKI/GST',200,'secret'),{kind:'invalid-json'});
 assert.ok(!JSON.stringify(classifyResponse('ssd.jpl.nasa.gov/api/horizons.api',200,JSON.stringify({error:'secret no matches'}))).includes('secret'));
});
test('stream size overflow is bounded and redacted without retry',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'sky-continuation-size-'));t.after(()=>rm(dir,{recursive:true,force:true}));const path=join(dir,'journal.jsonl');let calls=0;
 const result=await runSkyContinuation(env,path,async()=>{calls++;return new Response('x'.repeat(262145));});
 assert.equal(calls,3);assert.ok(result.results.every(r=>r.status==='unavailable'));assert.ok((await readFile(path,'utf8')).includes('body-limit'));
});
