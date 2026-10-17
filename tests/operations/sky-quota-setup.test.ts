import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runSkyQuotaSetup, initializeSkyQuota, skyQuotaPoliciesForInitialization } from '../../scripts/initialize-sky-quota';
import { createPersistentQuota } from '../../server/providers/quotaState';
const config=(path:string)=>({NIGHTSKY_SKY_PROVIDERS:'darkskyplanner,astronomyapi,nasa-donki,jpl',NIGHTSKY_SKY_QUOTA_STATE_PATH:path,NIGHTSKY_SKY_QUOTA_VERIFIED_UNUSED_BUDGET:'yes',NIGHTSKY_SKY_QUOTA_VERIFICATION_EVIDENCE:'Synthetic operator verified unused allowance'});
test('default proposal creates no ledger or markers and excludes private configuration',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'sky-setup-'));t.after(()=>rm(dir,{recursive:true,force:true}));
 const result=await runSkyQuotaSetup([], {...config(join(dir,'quota.json')),NIGHTSKY_ASTRONOMY_API_APP_SECRET:'private-token'});
 assert.equal(result.mode,'proposal');assert.deepEqual(await readdir(dir),[]);assert.ok(!JSON.stringify(result).includes('private-token'));assert.ok(!JSON.stringify(result).includes(dir));
});
test('initialization requires all attestation fields before creating files',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'sky-attest-'));t.after(()=>rm(dir,{recursive:true,force:true}));
 for(const missing of ['NIGHTSKY_SKY_QUOTA_VERIFIED_UNUSED_BUDGET','NIGHTSKY_SKY_QUOTA_VERIFICATION_EVIDENCE','NIGHTSKY_SKY_QUOTA_STATE_PATH']){const env:Record<string,string|undefined>=config(join(dir,'quota.json'));delete env[missing];await assert.rejects(initializeSkyQuota(env));}
 await assert.rejects(runSkyQuotaSetup(['--reset'],config(join(dir,'quota.json'))));assert.deepEqual(await readdir(dir),[]);
});
test('explicit initialization creates selected counters and refuses any reset',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'sky-init-'));t.after(()=>rm(dir,{recursive:true,force:true}));const path=join(dir,'quota.json'),env=config(path);
 assert.equal((await runSkyQuotaSetup(['--initialize'],env)).mode,'initialized');
 const initial=JSON.parse(await readFile(path,'utf8'));assert.deepEqual(Object.keys(initial.entries).sort(),['astronomyapi','darkskyplanner','jpl','nasa-donki']);
 for(const entry of Object.values(initial.entries) as any[]){assert.deepEqual(entry.buckets,{});assert.deepEqual(entry.months,{});assert.equal(entry.disabled,false);assert.equal(entry.blockedUntil,0);}
 const quota=await createPersistentQuota({path,now:Date.now,policies:skyQuotaPoliciesForInitialization(env)});for(const id of Object.keys(initial.entries))assert.equal((await quota.reserve(id,1)).allowed,true);await quota.close();
 const before=await readFile(path,'utf8');await assert.rejects(initializeSkyQuota(env));assert.equal(await readFile(path,'utf8'),before);
});
test('selection is exact, nonempty and separate from weather ledger',async t=>{
 assert.deepEqual(skyQuotaPoliciesForInitialization({NIGHTSKY_SKY_PROVIDERS:'jpl'}).map(p=>p.providerId),['jpl']);
 for(const value of ['', 'jpl,jpl','unknown'])assert.throws(()=>skyQuotaPoliciesForInitialization({NIGHTSKY_SKY_PROVIDERS:value}));
 const dir=await mkdtemp(join(tmpdir(),'sky-separate-'));t.after(()=>rm(dir,{recursive:true,force:true}));const path=join(dir,'quota.json');
 await assert.rejects(initializeSkyQuota({...config(path),NIGHTSKY_QUOTA_STATE_PATH:path}));assert.deepEqual(await readdir(dir),[]);
});

test('corrupt ledgers and initialization-only markers cannot be replaced',async t=>{
 for(const mode of ['corrupt','marker']){
  const dir=await mkdtemp(join(tmpdir(),'sky-no-reset-'));t.after(()=>rm(dir,{recursive:true,force:true}));const path=join(dir,'quota.json');
  const existing=mode==='corrupt'?path:path+'.initialized';await writeFile(existing,'retained proof');
  await assert.rejects(initializeSkyQuota(config(path)));assert.equal(await readFile(existing,'utf8'),'retained proof');
  if(mode==='marker')await assert.rejects(readFile(path));
 }
});

test('reviewed usage initialization preserves diagnostic charges and refuses reset',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'sky-used-'));t.after(()=>rm(dir,{recursive:true,force:true}));
 const path=join(dir,'quota.json'),env=config(path),packetPath=join(dir,'review.json'),now=Date.now();
 const usage=Object.fromEntries(['darkskyplanner','astronomyapi','nasa-donki','jpl'].map(id=>[id,{verifiedAllowance:true,verifiedAllAccountUsage:true,allConsumersQuiesced:true,evidence:'Synthetic verified entitlement and all consumption',observedAt:now,usedLast24Hours:id==='jpl'?2:1,usedCurrentMonth:id==='jpl'?2:1}]));
 const packet={decision:'approved-initialize-sky-usage',quotaPath:path,expiresAt:new Date(now+60000).toISOString(),usage};
 await writeFile(packetPath,JSON.stringify(packet));
 assert.equal((await runSkyQuotaSetup(['--initialize-with-usage',packetPath],env)).mode,'initialized-with-usage');
 const saved=await readFile(path,'utf8'),state=JSON.parse(saved);
 for(const [id,entry] of Object.entries(state.entries) as [string,any][]){assert.equal(Object.values(entry.buckets)[0],id==='jpl'?2:1);assert.equal(Object.values(entry.months)[0],id==='jpl'?2:1);assert.equal(entry.imported.usage.verifiedAllowance,true);}
 await assert.rejects(runSkyQuotaSetup(['--initialize-with-usage',packetPath],env));assert.equal(await readFile(path,'utf8'),saved);
 const quota=await createPersistentQuota({path,now:Date.now,policies:skyQuotaPoliciesForInitialization(env)});assert.equal((await quota.reserve('jpl',19)).allowed,false);await quota.close();
});

test('reviewed usage rejects stale, incomplete, unverified and expired snapshots',async t=>{
 for(const invalid of ['stale','missing','unverified','expired','wrong-path']){
  const dir=await mkdtemp(join(tmpdir(),'sky-bad-used-'));t.after(()=>rm(dir,{recursive:true,force:true}));const path=join(dir,'quota.json'),packetPath=join(dir,'review.json'),now=Date.now();
  const usage:any={jpl:{verifiedAllowance:invalid!=='unverified',verifiedAllAccountUsage:true,allConsumersQuiesced:true,evidence:'Synthetic complete usage evidence',observedAt:invalid==='stale'?now-360000:now,usedLast24Hours:2,usedCurrentMonth:2}};
  if(invalid==='missing')delete usage.jpl;
  await writeFile(packetPath,JSON.stringify({decision:'approved-initialize-sky-usage',quotaPath:invalid==='wrong-path'?join(dir,'other.json'):path,expiresAt:new Date(now+(invalid==='expired'?-1:60000)).toISOString(),usage}));
  await assert.rejects(runSkyQuotaSetup(['--initialize-with-usage',packetPath],{...config(path),NIGHTSKY_SKY_PROVIDERS:'jpl'}));
  await assert.rejects(readFile(path));await assert.rejects(readFile(path+'.initialized'));
 }
});
