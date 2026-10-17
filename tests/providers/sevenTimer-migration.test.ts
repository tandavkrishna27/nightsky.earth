import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createPersistentQuota} from '../../server/providers/quotaState';
import {PROVIDER_QUOTA_POLICIES} from '../../server/providers/weather/configuration';
import {SEVENTIMER_QUOTA_POLICY} from '../../server/providers/weather/sevenTimer';
import {runSevenTimerQuotaMigration} from '../../scripts/migrate-seventimer-quota';
test('7Timer migration defaults to a read-free offline plan',async()=>{
 const result=await runSevenTimerQuotaMigration([]);assert.equal(result.outcome,'offline-plan');assert.equal(result.networkRequests,0);
});
test('7Timer migration preserves all existing counters and flags and rejects replay',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'seventimer-migration-'));const path=join(dir,'quota.json'),packetPath=join(dir,'approval.json');
 try{
  const quota=await createPersistentQuota({path,now:Date.now,policies:PROVIDER_QUOTA_POLICIES});
  await quota.initializeVerifiedBudget({verifiedUnusedBudget:true,evidence:'Synthetic test fresh accounts'});
  await quota.reserve('weatherapi',3);await quota.setProviderState('openweather',{disabled:true,blockedUntil:Date.now()+100000});await quota.close();
  const before=JSON.parse(await readFile(path,'utf8'));
  const packet={decision:'approved-add-seventimer-account',quotaPath:path,expiresAt:new Date(Date.now()+60000).toISOString(),usage:{verifiedAllowance:true,verifiedAllAccountUsage:true,allConsumersQuiesced:true,evidence:'Synthetic test complete usage and operator allowance',observedAt:Date.now(),usedLast24Hours:2,usedCurrentMonth:5}};
  const original=await readFile(path,'utf8'),marker=await readFile(path+'.initialized','utf8');
  for(const invalid of [{...packet,expiresAt:'2000-01-01T00:00:00Z'},{...packet,usage:{...packet.usage,allConsumersQuiesced:false}},{...packet,usage:{...packet.usage,observedAt:Date.now()-600000}},{...packet,policy:SEVENTIMER_QUOTA_POLICY}]) {
   await writeFile(packetPath,JSON.stringify(invalid));await assert.rejects(runSevenTimerQuotaMigration(['--apply',packetPath]));assert.equal(await readFile(path,'utf8'),original);
  }
  await writeFile(packetPath,JSON.stringify(packet));await runSevenTimerQuotaMigration(['--apply',packetPath]);assert.equal(await readFile(path+'.initialized','utf8'),marker);
  const after=JSON.parse(await readFile(path,'utf8'));for(const id of Object.keys(before.entries))assert.deepEqual(after.entries[id],before.entries[id]);
  assert.equal(after.entries.seventimer.months[new Date().toISOString().slice(0,7)],5);
  const reopened=await createPersistentQuota({path,now:Date.now,policies:[...PROVIDER_QUOTA_POLICIES,SEVENTIMER_QUOTA_POLICY]});assert.equal((await reopened.reserve('seventimer',1)).allowed,true);await reopened.close();
  const bytes=await readFile(path,'utf8');await assert.rejects(runSevenTimerQuotaMigration(['--apply',packetPath]));assert.equal(await readFile(path,'utf8'),bytes);
 }finally{await rm(dir,{recursive:true,force:true});}
});
test('7Timer migration rejects expired packets and missing checkpoints without creating budget',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'seventimer-refuse-'));const path=join(dir,'missing.json'),packetPath=join(dir,'approval.json');
 try{
  const packet={decision:'approved-add-seventimer-account',quotaPath:path,expiresAt:new Date(Date.now()+60000).toISOString(),usage:{verifiedAllowance:true,verifiedAllAccountUsage:true,allConsumersQuiesced:true,evidence:'Synthetic test usage authority',observedAt:Date.now(),usedLast24Hours:0,usedCurrentMonth:0}};
  await writeFile(packetPath,JSON.stringify(packet));await assert.rejects(runSevenTimerQuotaMigration(['--apply',packetPath]));await assert.rejects(readFile(path));
  await writeFile(packetPath,JSON.stringify({...packet,expiresAt:'2000-01-01T00:00:00Z'}));await assert.rejects(runSevenTimerQuotaMigration(['--apply',packetPath]));await assert.rejects(readFile(path));
 }finally{await rm(dir,{recursive:true,force:true});}
});
