import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, readFile, rm} from 'node:fs/promises';
import {join} from 'node:path';
import {initializeVerifiedPublicUniverseQuota, publicUniverseAllocationPlan} from '../../scripts/initialize-public-universe-quota';
import {createPersistentQuota} from '../../server/providers/quotaState';
import {PUBLIC_UNIVERSE_QUOTA_POLICY} from '../../server/providers/publicUniverse/configuration';

test('dedicated Public Universe ledger imports verified usage once without resetting it', async () => {
  const dir=await mkdtemp(join(process.cwd(),'nightsky-pub-quota-'));
  const path=join(dir,'quota.json');
  const env={NIGHTSKY_PUBLICUNIVERSE_QUOTA_STATE_PATH:path};
  const now=Date.now();
  const usage={verifiedAllowance:true as const,verifiedAllAccountUsage:true as const,allConsumersQuiesced:true as const,evidence:'Synthetic complete usage fixture',observedAt:now,usedLast24Hours:2,usedCurrentMonth:2};
  try {
    assert.equal(publicUniverseAllocationPlan(['--plan'],env).writesPerformed,false);
    assert.throws(()=>publicUniverseAllocationPlan(['--initialize'],env));
    await initializeVerifiedPublicUniverseQuota(env,usage,()=>now);
    const checkpoint=JSON.parse(await readFile(path,'utf8'));
    assert.equal(checkpoint.entries.publicuniverse.imported.usage.usedLast24Hours,2);
    assert.equal(checkpoint.entries.publicuniverse.imported.usage.usedCurrentMonth,2);
    await assert.rejects(initializeVerifiedPublicUniverseQuota(env,usage,()=>now));
    const quota=await createPersistentQuota({path,now:()=>now,policies:[PUBLIC_UNIVERSE_QUOTA_POLICY]});
    try {assert.equal((await quota.reserve('publicuniverse',1)).allowed,true);}
    finally {await quota.close();}
    const retained=JSON.parse(await readFile(path,'utf8'));
    assert.equal(retained.entries.publicuniverse.imported.usage.usedLast24Hours,2);
  } finally {await rm(dir,{recursive:true,force:true});}
});
