import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, readFile, rm, writeFile, access} from 'node:fs/promises';
import {join} from 'node:path';
import {createPersistentQuota} from '../../server/providers/quotaState';

const policy={providerId:'synthetic',accountLabel:'operator-synthetic',hourlyLimit:2,dailyLimit:5};
const attestation={verifiedUnusedBudget:true as const,evidence:'Synthetic complete unused budget fixture'};

test('failed initialization before checkpoint write removes only its own marker and permits a new verified attempt',async()=>{
 const dir=await mkdtemp(join(process.cwd(),'nightsky-init-recovery-')),path=join(dir,'quota.json');
 try{
  const first=await createPersistentQuota({path,now:Date.now,policies:[policy],initializationFault:async()=>{throw Error('Injected before checkpoint write');}});
  try{await assert.rejects(first.initializeVerifiedBudget(attestation));}finally{await first.close();}
  await assert.rejects(access(path));await assert.rejects(access(path+'.initialized'));
  const retry=await createPersistentQuota({path,now:Date.now,policies:[policy]});
  try{await retry.initializeVerifiedBudget(attestation);assert.equal((await retry.reserve('synthetic',1)).allowed,true);}finally{await retry.close();}
 }finally{await rm(dir,{recursive:true,force:true});}
});

test('ambiguous pending write leaves marker and temp file for operator recovery',async()=>{
 const dir=await mkdtemp(join(process.cwd(),'nightsky-init-ambiguous-')),path=join(dir,'quota.json');
 try{
  const first=await createPersistentQuota({path,now:Date.now,policies:[policy],initializationFault:async()=>{await writeFile(path+'.tmp','incomplete');throw Error('Injected pending write');}});
  try{await assert.rejects(first.initializeVerifiedBudget(attestation));}finally{await first.close();}
  assert.match(await readFile(path+'.initialized','utf8'),/Verified budget initialization/);
  assert.equal(await readFile(path+'.tmp','utf8'),'incomplete');
  const retry=await createPersistentQuota({path,now:Date.now,policies:[policy]});
  try{await assert.rejects(retry.initializeVerifiedBudget(attestation));assert.equal((await retry.reserve('synthetic',1)).allowed,false);}finally{await retry.close();}
  assert.equal(await readFile(path+'.tmp','utf8'),'incomplete');
 }finally{await rm(dir,{recursive:true,force:true});}
});

test('failure cleanup does not remove a marker whose contents changed after creation',async()=>{
 const dir=await mkdtemp(join(process.cwd(),'nightsky-init-marker-')),path=join(dir,'quota.json');
 try{
  const first=await createPersistentQuota({path,now:Date.now,policies:[policy],initializationFault:async()=>{await writeFile(path+'.initialized','modified marker');throw Error('Injected marker mutation');}});
  try{await assert.rejects(first.initializeVerifiedBudget(attestation));}finally{await first.close();}
  assert.equal(await readFile(path+'.initialized','utf8'),'modified marker');
  await assert.rejects(access(path));
 }finally{await rm(dir,{recursive:true,force:true});}
});
