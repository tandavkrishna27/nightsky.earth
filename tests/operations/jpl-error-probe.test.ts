import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {runJplErrorProbe,publicJplError,JPL_ERROR_PLAN} from '../../scripts/validate-jpl-error-live';
test('public JPL diagnostic bounds output and retains error only with durable admission',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'jpl-error-'));t.after(()=>rm(dir,{recursive:true,force:true}));const journal=join(dir,'journal'),error=join(dir,'error');let calls=0;
 const result=await runJplErrorProbe(journal,error,(async(input,init)=>{calls++;const u=new URL(String(input));assert.equal(u.origin,'https://ssd.jpl.nasa.gov');assert.equal(u.searchParams.get('COMMAND'),"'1;'");assert.equal(u.searchParams.get('SITE_COORD'),"'78.474,17.361,0'");assert.equal(init?.redirect,'error');assert.deepEqual(init?.headers,{Accept:'application/json'});assert.ok((await readFile(journal,'utf8')).includes('"reservation":1'));return Response.json({signature:{version:'1.2'},error:'Invalid\nparameter',result:'UNRETAINED PUBLIC RESPONSE'});}) as typeof fetch);
 assert.equal(calls,1);assert.equal(result.diagnostic.version,'1.2');assert.equal(await readFile(error,'utf8'),'Invalid parameter\n');assert.ok(!(await readFile(journal,'utf8')).includes('UNRETAINED'));await assert.rejects(runJplErrorProbe(journal,error,async()=>{throw Error('must not call')}));
});
test('preexisting error file refuses network and remains unchanged',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'jpl-error-existing-'));t.after(()=>rm(dir,{recursive:true,force:true}));const error=join(dir,'error');await writeFile(error,'keep');let calls=0;await assert.rejects(runJplErrorProbe(join(dir,'journal'),error,async()=>{calls++;return new Response();}));assert.equal(calls,0);assert.equal(await readFile(error,'utf8'),'keep');
});
test('declared and streamed oversized bodies fail with no retries',async t=>{
 for(const declared of [true,false]){const dir=await mkdtemp(join(tmpdir(),'jpl-error-size-'));t.after(()=>rm(dir,{recursive:true,force:true}));let calls=0;await assert.rejects(runJplErrorProbe(join(dir,'journal'),join(dir,'error'),async()=>{calls++;return new Response('x'.repeat(262145),{headers:declared?{'content-length':'262145'}:{}});}));assert.equal(calls,1);}
 assert.equal(JPL_ERROR_PLAN.totalDeadlineMs,30000);
});
test('public error parser caps and strips controls and rejects arbitrary version text',()=>{
 const value=publicJplError(JSON.stringify({signature:{version:'bad\nversion'},error:'\u202e\u0000'+ 'x'.repeat(2000)}));assert.equal(value.version,undefined);assert.equal(value.error?.length,1000);assert.ok(!/[\u0000\u202e]/.test(value.error??''));assert.equal(publicJplError('no json').kind,'invalid-json');
});
