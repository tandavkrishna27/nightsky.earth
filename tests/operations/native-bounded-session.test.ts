import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createNativeSessionTransport,NATIVE_SESSION_PLAN,cleanupNativeSession} from '../../scripts/serve-native-bounded';

test('native transport journals eight concurrent real-shape attempts before dispatch and refuses repeats',async t=>{
 const dir=mkdtempSync(join(tmpdir(),'native-bound-'));t.after(()=>rmSync(dir,{recursive:true,force:true}));const path=join(dir,'journal.jsonl');let calls=0;
 const session=createNativeSessionTransport(path,async(input,init)=>{calls++;assert.equal(init?.redirect,'error');assert.ok(readFileSync(path,'utf8').includes('"attempt":'));assert.ok(String(input).includes('private-token'));return Response.json({value:'private-upstream-value'});});t.after(()=>session.close());
 await Promise.all(Array.from({length:8},(_,i)=>session.fetcher(`https://secure.geonames.org/searchJSON?q=${i}&username=private-token`)));
 await assert.rejects(session.fetcher('https://secure.geonames.org/searchJSON?q=8'));
 assert.equal(calls,8);assert.equal(NATIVE_SESSION_PLAN.maxAcceptedBytes,8*NATIVE_SESSION_PLAN.maxBodyBytes);
 session.close();const journal=readFileSync(path,'utf8');assert.doesNotMatch(journal,/private-token|private-upstream-value/);
 const records=journal.trim().split('\n').map(line=>JSON.parse(line));assert.deepEqual(records.filter(r=>r.response).map(r=>r.response).sort(),[1,2,3,4,5,6,7,8]);
 assert.throws(()=>createNativeSessionTransport(path));
});
test('native transport refuses optional hosts, redirects and identical request retry; bounds bodies',async t=>{
 const dir=mkdtempSync(join(tmpdir(),'native-bound-'));t.after(()=>rmSync(dir,{recursive:true,force:true}));let calls=0;
 const session=createNativeSessionTransport(join(dir,'journal.jsonl'),async()=>{calls++;return new Response('x'.repeat(NATIVE_SESSION_PLAN.maxBodyBytes+1));});t.after(()=>session.close());
 for(const url of ['https://api.nasa.gov/DONKI/GST','http://secure.geonames.org/searchJSON','https://evil.test/searchJSON','https://secret@secure.geonames.org/searchJSON'])await assert.rejects(session.fetcher(url));
 assert.equal(calls,0);
 const url='https://secure.geonames.org/searchJSON?q=a';await assert.rejects(session.fetcher(url));await assert.rejects(session.fetcher(url));assert.equal(calls,1);
 session.close();await assert.rejects(session.fetcher('https://secure.geonames.org/searchJSON?q=b'));assert.equal(calls,1);
});

for(const failed of ['journal','listener','both','app'] as const)test(`native shutdown attempts all cleanup after ${failed} failure`,async()=>{
 const calls:string[]=[];
 await assert.rejects(cleanupNativeSession(
  ()=>{calls.push('journal');if(failed==='journal'||failed==='both')throw Error('Journal unavailable');},
  async()=>{calls.push('listener');if(failed==='listener'||failed==='both')throw Error('Listener unavailable');},
  async()=>{calls.push('app');if(failed==='app')throw Error('App unavailable');},
 ));
 assert.deepEqual(calls,['journal','listener','app']);
});
