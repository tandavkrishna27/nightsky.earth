import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSkyConfiguration, SKY_QUOTA_POLICIES, createConfiguredSkyProviders } from '../../server/providers/skyConfiguration';
import { publicUniverseQuotaPath, PUBLIC_UNIVERSE_QUOTA_POLICY } from '../../server/providers/publicUniverse/configuration';
import { createConfiguredNightSkyPluginApp, closeConfiguredNightSkyPluginApp } from '../../server/plugin';
import { createPersistentQuota } from '../../server/providers/quotaState';
import { mkdtemp, readFile, rm, access } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {publicUniverseAllocationPlan} from '../../scripts/initialize-public-universe-quota';
async function environment<T>(values: Record<string, string | undefined>, work: () => Promise<T>) { const saved = { ...process.env }; try {
    for (const key of Object.keys(process.env))
        if (key.startsWith('NIGHTSKY_'))
            delete process.env[key];
    Object.assign(process.env, values);
    return await work();
}
finally {
    process.env = saved;
} }
test('Public Universe selection is separate from legacy policies and defaults off', async () => {
    assert.deepEqual(parseSkyConfiguration({}).selected, []);
    assert.equal(SKY_QUOTA_POLICIES.some(p => p.providerId === 'publicuniverse'), false);
    assert.equal(PUBLIC_UNIVERSE_QUOTA_POLICY.providerId, 'publicuniverse');
    const services = createConfiguredSkyProviders({ NIGHTSKY_SKY_PROVIDERS: 'publicuniverse' });
    assert.ok(services?.publicUniverse);
    assert.equal(services?.astronomy, undefined);
    assert.equal((await services!.publicUniverse!.searchReferenceObjects({ domain: 'solar-system', query: 'Mars' })).status, 'unavailable');
    await services!.publicUniverse!.close();
});
test('configured Pub-only app never opens legacy ledger and closes dedicated ownership on normal and failed startup', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'nightsky-pub-config-'));
    try {
        const pub = join(dir, 'pub.json'), legacy = join(dir, 'nonexistent', 'legacy.json');
        await environment({ NIGHTSKY_SKY_PROVIDERS: 'publicuniverse', NIGHTSKY_SKY_ADMITTED_PROVIDERS: 'publicuniverse', NIGHTSKY_PUBLICUNIVERSE_QUOTA_STATE_PATH: pub, NIGHTSKY_SKY_QUOTA_STATE_PATH: legacy }, async () => {
            let calls = 0;
            const app = await createConfiguredNightSkyPluginApp({ fetcher: async () => { calls++; throw Error('No dispatch'); }, log: () => { } });
            await closeConfiguredNightSkyPluginApp(app);
            assert.equal(calls, 0);
            await assert.rejects(access(pub));
            await assert.rejects(access(pub + '.lock'));
            await assert.rejects(access(legacy + '.lock'));
            process.env.NIGHTSKY_MCP_TOOL_MODE = 'invalid';
            await assert.rejects(createConfiguredNightSkyPluginApp({ log: () => { } }));
            await assert.rejects(access(pub + '.lock'));
        });
    }
    finally {
        await rm(dir, { recursive: true, force: true });
    }
});
test('initialized legacy allocation survives selecting uninitialized Pub and only Pub denies', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'nightsky-pub-legacy-'));
    const legacy = join(dir, 'legacy.json'), pub = join(dir, 'pub.json');
    try {
        let q = await createPersistentQuota({ path: legacy, now: Date.now, policies: SKY_QUOTA_POLICIES.filter(p => p.providerId === 'jpl') });
        await q.initializeVerifiedBudget({ verifiedUnusedBudget: true, evidence: 'Synthetic temporary test budget only' });
        await q.reserve('jpl', 1);
        await q.close();
        const before = await readFile(legacy, 'utf8');
        await environment({ NIGHTSKY_SKY_PROVIDERS: 'jpl,publicuniverse', NIGHTSKY_SKY_ADMITTED_PROVIDERS: 'jpl,publicuniverse', NIGHTSKY_SKY_QUOTA_STATE_PATH: legacy, NIGHTSKY_PUBLICUNIVERSE_QUOTA_STATE_PATH: pub }, async () => { const app = await createConfiguredNightSkyPluginApp({ log: () => { } }); await closeConfiguredNightSkyPluginApp(app); });
        assert.equal(await readFile(legacy, 'utf8'), before);
        await assert.rejects(access(pub));
        q = await createPersistentQuota({ path: legacy, now: Date.now, policies: SKY_QUOTA_POLICIES.filter(p => p.providerId === 'jpl') });
        const p = await createPersistentQuota({ path: pub, now: Date.now, policies: [PUBLIC_UNIVERSE_QUOTA_POLICY] });
        assert.equal((await q.reserve('jpl', 1)).allowed, true);
        assert.equal((await p.reserve('publicuniverse', 1)).allowed, false);
        await q.close();
        await p.close();
    }
    finally {
        await rm(dir, { recursive: true, force: true });
    }
});
test('dedicated path is absolute and distinct including Windows case aliases', () => {
    assert.equal(publicUniverseQuotaPath({}), undefined);
    assert.throws(() => publicUniverseQuotaPath({ NIGHTSKY_PUBLICUNIVERSE_QUOTA_STATE_PATH: 'relative.json' }));
    for (const key of ['NIGHTSKY_QUOTA_STATE_PATH', 'NIGHTSKY_SKY_QUOTA_STATE_PATH', 'NIGHTSKY_LIGHT_POLLUTION_QUOTA_STATE_PATH'])
        assert.throws(() => publicUniverseQuotaPath({ NIGHTSKY_PUBLICUNIVERSE_QUOTA_STATE_PATH: 'C:\\private\\pub.json', [key]: 'c:\\PRIVATE\\pub.json' }));
    assert.equal(publicUniverseQuotaPath({ NIGHTSKY_PUBLICUNIVERSE_QUOTA_STATE_PATH: 'C:\\private\\pub.json' }), 'C:\\private\\pub.json');
});
test('selection, admission and dedicated budget are independently required; preparation is plan-only',async()=>{
 for(const admitted of [false,true])for(const budget of [false,true]){
  let calls=0;const services=createConfiguredSkyProviders({NIGHTSKY_SKY_PROVIDERS:'publicuniverse',...(admitted?{NIGHTSKY_SKY_ADMITTED_PROVIDERS:'publicuniverse'}:{})},{publicUniverseQuota:budget?{reserve:async()=>({allowed:false,reason:'uninitialized'}),setProviderState:async()=>{}}:undefined,fetcher:async()=>{calls++;throw Error();}});
  const result=await services!.publicUniverse!.searchReferenceObjects({domain:'solar-system',query:'Mars'});assert.equal(result.status,'unavailable');assert.equal(calls,0);await services!.publicUniverse!.close();
 }
 assert.throws(()=>parseSkyConfiguration({NIGHTSKY_SKY_ADMITTED_PROVIDERS:'publicuniverse'}));
 assert.throws(()=>publicUniverseAllocationPlan([],{}));assert.throws(()=>publicUniverseAllocationPlan(['--initialize'],{}));
 const plan=publicUniverseAllocationPlan(['--plan'],{});assert.equal(plan.writesPerformed,false);assert.equal(plan.proposedApplicationAllocation.dailyLimit,100);
});
