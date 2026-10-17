import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createPersistentQuota} from '../../../server/providers/quotaState';
import {PROVIDER_QUOTA_POLICIES} from '../../../server/providers/weather/configuration';
import {runHistoryAccountingOperator} from '../../../scripts/era5/history-accounting-operator';
import {annualHistoryProbePlan} from '../../../scripts/era5/probe-annual-history';
const cli='scripts/era5/history-accounting-operator.ts';
test('operator defaults offline and rejects incomplete live authority before touching ledger',()=>{
 const result=spawnSync(process.execPath,['--import','tsx',cli],{encoding:'utf8'});
 assert.equal(result.status,0,result.stderr); const plan=JSON.parse(result.stdout);
 assert.equal(plan.mode,'offline'); assert.equal(plan.reservedIntegerCredits,3);
 const rejected=spawnSync(process.execPath,['--import','tsx',cli,'--execute-approved'],{encoding:'utf8'});
 assert.notEqual(rejected.status,0);
});
test('approved operator uses shared reservation before synthetic annual transport and retains account authority',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'account-live-synthetic-')); t.after(()=>rm(dir,{recursive:true,force:true}));
 const path=join(dir,'ledger.json'), packetPath=join(dir,'approval.json');
 const policy={providerId:'open-meteo',accountLabel:'operator-open-meteo',hourlyLimit:500,dailyLimit:1000,monthlyLimit:30000};
 const q=await createPersistentQuota({path,now:Date.now,policies:PROVIDER_QUOTA_POLICIES});
 await q.initializeVerifiedBudget({verifiedUnusedBudget:true,evidence:'Synthetic test fresh ledger'});
 await q.addVerifiedProvider(policy,{verifiedAllowance:true,verifiedAllAccountUsage:true,allConsumersQuiesced:true,evidence:'Synthetic complete usage and allowance',observedAt:Date.now(),usedLast24Hours:0,usedCurrentMonth:29997}); await q.close();
 const plan=annualHistoryProbePlan();
 const packet={decision:'approved-annual-history-probe',quotaPath:path,policy,expiresAt:new Date(Date.now()+60000).toISOString(),planSha256:plan.planSha256,executionId:'a'.repeat(64),evidenceRoot:dir,maxReservedCredits:3,sourceUseEligibilityReviewed:true,sourceUseEvidence:'Synthetic eligibility review',accountPolicyEvidence:'Synthetic shared policy review',allAccountConsumptionUsesSharedLedger:true};
 const original=globalThis.fetch; let calls=0;
 globalThis.fetch=async()=>{calls++; const state=JSON.parse(await readFile(path,'utf8')); assert.equal(state.entries['open-meteo'].months[new Date().toISOString().slice(0,7)],30000);
  return new Response(JSON.stringify({latitude:28.5,longitude:77.25,utc_offset_seconds:0,hourly_units:{time:'unixtime',cloud_cover:'%'},hourly:{time:Array.from({length:8784},(_,i)=>694224000+i*3600),cloud_cover:Array(8784).fill(0)}}));};
 t.after(()=>{globalThis.fetch=original;});
 await writeFile(packetPath,JSON.stringify({...packet,sourceUseEligibilityReviewed:false})); await assert.rejects(runHistoryAccountingOperator(['--execute-approved',packetPath])); assert.equal(calls,0);
 await writeFile(packetPath,JSON.stringify(packet)); const result=await runHistoryAccountingOperator(['--execute-approved',packetPath]); assert.equal((result as any).outcome,'validated-annual-shape-only'); assert.equal(calls,1);
 const attempt=JSON.parse(await readFile(join(dir,packet.executionId,'attempt.json'),'utf8')); assert.equal(attempt.approval.policy.accountLabel,'operator-open-meteo');
 await writeFile(packetPath,JSON.stringify({...packet,executionId:'b'.repeat(64)})); const denied=await runHistoryAccountingOperator(['--execute-approved',packetPath]); assert.equal((denied as any).failure,'quota-reservation'); assert.equal(calls,1);
});
test('operator applies explicit migration once and preserves existing shared entries',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'account-operator-')); t.after(()=>rm(dir,{recursive:true,force:true}));
 const path=join(dir,'ledger.json'), packet=join(dir,'approval.json');
 const q=await createPersistentQuota({path,now:Date.now,policies:PROVIDER_QUOTA_POLICIES});
 await q.initializeVerifiedBudget({verifiedUnusedBudget:true,evidence:'Synthetic test fresh ledger'}); await q.reserve('weatherapi',4); await q.close();
 const before=JSON.parse(await readFile(path,'utf8'));
 await writeFile(packet,JSON.stringify({decision:'approved-add-open-meteo-account',quotaPath:path,expiresAt:new Date(Date.now()+60000).toISOString(),
 policy:{providerId:'open-meteo',accountLabel:'operator-open-meteo',hourlyLimit:500,dailyLimit:1000,monthlyLimit:30000},
 usage:{verifiedAllowance:true,verifiedAllAccountUsage:true,allConsumersQuiesced:true,evidence:'Synthetic complete usage and allowance',observedAt:Date.now(),usedLast24Hours:10,usedCurrentMonth:20}}));
 const result=spawnSync(process.execPath,['--import','tsx',cli,'--apply-provider',packet],{encoding:'utf8'});
 assert.equal(result.status,0,result.stderr);
 const after=JSON.parse(await readFile(path,'utf8')); assert.deepEqual(after.entries.weatherapi,before.entries.weatherapi);
 assert.equal(after.entries['open-meteo'].months[new Date().toISOString().slice(0,7)],20);
 const repeat=spawnSync(process.execPath,['--import','tsx',cli,'--apply-provider',packet],{encoding:'utf8'}); assert.notEqual(repeat.status,0);
});
