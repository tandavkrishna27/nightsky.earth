import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createPersistentQuota } from '../../server/providers/quotaState';
const old = {providerId:'weatherapi',accountLabel:'existing',hourlyLimit:20,dailyLimit:100};
const added = {providerId:'open-meteo',accountLabel:'shared-open-meteo',hourlyLimit:10,dailyLimit:20,monthlyLimit:30};
const now = Date.UTC(2026,9,17,12);
const evidence = {verifiedAllowance:true as const, verifiedAllAccountUsage:true as const, allConsumersQuiesced:true as const, observedAt:now, usedLast24Hours:5, usedCurrentMonth:27, evidence:'Synthetic complete shared account accounting'};
test('add provider preserves counters, refuses replacement, persists imported usage across restart', async t => {
 const dir=await mkdtemp(join(tmpdir(),'quota-add-')); t.after(()=>rm(dir,{recursive:true,force:true})); const path=join(dir,'quota.json');
 let q=await createPersistentQuota({path,now:()=>now,policies:[old]});
 await q.initializeVerifiedBudget({verifiedUnusedBudget:true,evidence:'Synthetic fresh account'}); await q.reserve('weatherapi',7);
 const before=JSON.parse(await readFile(path,'utf8'));
 assert.equal(typeof q.addVerifiedProvider,'function');
 await q.addVerifiedProvider(added,evidence);
 assert.deepEqual(JSON.parse(await readFile(path,'utf8')).entries.weatherapi,before.entries.weatherapi);
 await assert.rejects(q.addVerifiedProvider(added,evidence));
 await assert.rejects(createPersistentQuota({path,now:()=>now,policies:[old,added]}));
 await q.close(); q=await createPersistentQuota({path,now:()=>now,policies:[old,{monthlyLimit:30,dailyLimit:20,hourlyLimit:10,accountLabel:'shared-open-meteo',providerId:'open-meteo'}]});
 assert.equal((await q.reserve('open-meteo',3)).allowed,true);
 assert.equal((await q.reserve('open-meteo',1)).allowed,false); await q.close();
});
test('corrupt imported accounting metadata fails closed on reopen',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'quota-corrupt-import-')); t.after(()=>rm(dir,{recursive:true,force:true})); const path=join(dir,'quota.json');
 let q=await createPersistentQuota({path,now:()=>now,policies:[old]}); await q.initializeVerifiedBudget({verifiedUnusedBudget:true,evidence:'Synthetic fresh account'});
 await q.addVerifiedProvider(added,evidence); await q.close();
 const bytes=JSON.parse(await readFile(path,'utf8')); bytes.entries['open-meteo'].imported.usage.verifiedAllowance=false; await writeFile(path,JSON.stringify(bytes));
 q=await createPersistentQuota({path,now:()=>now,policies:[old,added]}); assert.equal((await q.reserve('open-meteo',1)).allowed,false); await q.close();
});
test('provider import refuses missing or corrupt checkpoints and lost lock ownership',async t=>{
 for(const mode of ['missing','corrupt','ownership'] as const) {
  const dir=await mkdtemp(join(tmpdir(),'quota-import-boundary-')); t.after(()=>rm(dir,{recursive:true,force:true})); const path=join(dir,'quota.json');
  let q=await createPersistentQuota({path,now:()=>now,policies:[old]});
  if(mode!=='missing') {
   await q.initializeVerifiedBudget({verifiedUnusedBudget:true,evidence:'Synthetic fresh account'});
   if(mode==='corrupt') {await q.close(); await writeFile(path,'{'); q=await createPersistentQuota({path,now:()=>now,policies:[old]});}
   else await writeFile(path+'.lock',JSON.stringify({pid:0,token:'different-owner'}));
  }
  await assert.rejects(q.addVerifiedProvider(added,evidence));
  assert.equal((await q.reserve('open-meteo',1)).allowed,false); await q.close();
  if(mode==='ownership') assert.equal(JSON.parse(await readFile(path+'.lock','utf8')).token,'different-owner');
  if(mode==='missing') await assert.rejects(readFile(path));
 }
});
test('unverified imports and interrupted writes preserve existing ledger and fail closed', async t => {
 const dir=await mkdtemp(join(tmpdir(),'quota-add-fail-')); t.after(()=>rm(dir,{recursive:true,force:true})); const path=join(dir,'quota.json');
 let q=await createPersistentQuota({path,now:()=>now,policies:[old]});
 await q.initializeVerifiedBudget({verifiedUnusedBudget:true,evidence:'Synthetic fresh account'});
 const before=await readFile(path,'utf8');
 assert.equal(typeof q.addVerifiedProvider,'function');
 for(const change of [{verifiedAllowance:false},{verifiedAllAccountUsage:false},{allConsumersQuiesced:false},{observedAt:now-300001},{usedLast24Hours:-1},{usedCurrentMonth:0}]) {
  await assert.rejects(q.addVerifiedProvider(added,{...evidence,...change} as any)); assert.equal(await readFile(path,'utf8'),before);
 }
 await writeFile(path+'.tmp','interrupted'); await assert.rejects(q.addVerifiedProvider(added,evidence));
 assert.equal(await readFile(path,'utf8'),before); assert.equal((await q.reserve('weatherapi',1)).allowed,false); await q.close();
 q=await createPersistentQuota({path,now:()=>now,policies:[old,added]}); assert.equal((await q.reserve('open-meteo',1)).allowed,false); await q.close();
});
