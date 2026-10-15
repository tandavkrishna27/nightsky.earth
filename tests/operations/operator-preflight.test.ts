import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { operatorPreflight, operatorConfigSchema, selectRelease } from '../../shared/nightsky/operator';
const hash = createHash('sha256').update('data').digest('hex');
function config() { return { schemaVersion: 1, status: 'selected', endpoints: { production: 'https://mcp.nightsky.earth/mcp', staging: 'https://stage.nightsky.earth/mcp', privacy: 'https://nightsky.earth/privacy', terms: 'https://nightsky.earth/terms', support: 'https://nightsky.earth/support' }, topology: { kind: 'direct', headerRewriteEvidence: null, restrictedBackendEvidence: null }, runtimeEnvironment: { NODE_ENV: 'production', HOST: '127.0.0.1', PORT: '5000', NIGHTSKY_MCP_TOOL_MODE: 'resolver-only', NIGHTSKY_MCP_ALLOWED_HOSTS: 'mcp.nightsky.earth,stage.nightsky.earth' }, releases: { current: { id: 'current', sourceCommit: 'a'.repeat(40), imageDigest: 'sha256:' + hash, architecture: 'amd64', packageVersion: '1.0.12', artifactIds: [] }, rollback: { id: 'previous', sourceCommit: 'b'.repeat(40), imageDigest: 'sha256:' + 'b'.repeat(64), architecture: 'amd64', packageVersion: '1.0.11', artifactIds: [] } }, artifacts: [], budget: { processes: 1, memoryBytes: 1024, diskAvailableBytes: 10000, currentBytes: 100, rollbackBytes: 100, scratchBytes: 100, reserveBytes: 100, maxArtifactBytes: 1000, capacityEvidence: 'record-1', rollbackEvidence: 'record-2' }, ownerEvidence: { identity: 'record', policies: 'record', retention: 'record', host: 'record', providerBudget: 'record' } } as any; }
test('explicit resolver selection passes only offline and selects immutable rollback', async () => { const c = config(); const result = await operatorPreflight(c, '.'); assert.equal(result.status, 'offline-pass'); assert.equal(result.hostChecksPerformed, false); assert.equal(result.deploymentReady, false); assert.equal(selectRelease(c, 'rollback').id, 'previous'); });
test('template validates structure but fails readiness', async () => { const c = config(); c.status = 'template'; c.ownerEvidence.host = null; assert.equal(operatorConfigSchema.safeParse(c).success, true); assert.equal((await operatorPreflight(c, '.')).status, 'incomplete-owner-inputs'); });
test('unknown secret keys and credential URLs never leak', async () => { const c = config(); c.runtimeEnvironment.API_KEY = 'private-value'; c.endpoints.production = 'https://user:password@mcp.nightsky.earth/mcp'; const r = await operatorPreflight(c, '.'); assert.equal(r.status, 'invalid'); assert.ok(!JSON.stringify(r).includes('private-value')); assert.ok(!JSON.stringify(r).includes('password')); });
test('full requires explicit pinned product artifacts and MET contact', async () => { const c = config(); c.runtimeEnvironment.NIGHTSKY_MCP_TOOL_MODE = 'full'; assert.equal((await operatorPreflight(c, '.')).status, 'incomplete-owner-inputs'); });
test('unsafe hosts proxy conflicts disk and release conflicts rejected', async () => { for (const change of [(c: any) => c.runtimeEnvironment.NIGHTSKY_MCP_ALLOWED_HOSTS = '*', (c: any) => c.runtimeEnvironment.NIGHTSKY_MCP_TRUSTED_PROXIES = '0.0.0.0/0', (c: any) => c.budget.diskAvailableBytes = 399, (c: any) => c.releases.rollback.id = 'current']) {
    const c = config();
    change(c);
    assert.equal((await operatorPreflight(c, '.')).status, 'invalid');
} });
test('bounded inventory verifies hash missing corrupt and escaping files', async () => { const root = await mkdtemp(join(tmpdir(), 'operator-')); try {
    await writeFile(join(root, 'file'), 'data');
    const c = config();
    c.artifacts = [{ id: 'geo', kind: 'geonames', path: 'file', sha256: hash, bytes: 4, version: 'v1' }];
    c.releases.current.artifactIds = ['geo'];
    assert.equal((await operatorPreflight(c, root)).status, 'offline-pass');
    for (const path of ['missing', '../outside']) {
        c.artifacts[0].path = path;
        assert.equal((await operatorPreflight(c, root)).status, 'invalid');
    }
    c.artifacts[0].path = 'file';
    await writeFile(join(root, 'file'), 'evil');
    assert.equal((await operatorPreflight(c, root)).status, 'invalid');
    assert.ok(!JSON.stringify(await operatorPreflight(c, root)).includes(root));
}
finally {
    await rm(root, { recursive: true, force: true });
} });
test('actual example structure remains incomplete', async () => { const { readFile } = await import('node:fs/promises'); const c = JSON.parse(await readFile(new URL('../../config/plugin-operator.example.json', import.meta.url), 'utf8')); assert.ok(operatorConfigSchema.safeParse(c).success); assert.equal((await operatorPreflight(c, '.')).status, 'incomplete-owner-inputs'); });
test('paired legacy release and global regional conflicts reject', async () => { for (const env of [{ NIGHTSKY_ERA5_RELEASE_MANIFEST: 'release.json' }, { NIGHTSKY_CLIMATE_ARTIFACT: 'a', NIGHTSKY_CLIMATE_SHA256: hash, NIGHTSKY_ERA5_RELEASE_MANIFEST: 'b', NIGHTSKY_ERA5_RELEASE_SHA256: hash }, { NIGHTSKY_GLOBAL_CATALOGUE_MANIFEST: 'a', NIGHTSKY_GLOBAL_CATALOGUE_SHA256: hash, NIGHTSKY_OSM_REGIONAL_MANIFEST: 'b', NIGHTSKY_OSM_REGIONAL_SHA256: hash }]) {
    const c = config();
    Object.assign(c.runtimeEnvironment, env);
    assert.equal((await operatorPreflight(c, '.')).status, 'invalid');
} });
test('artifact links and undersized per-release limits reject', async (t) => { const root = await mkdtemp(join(tmpdir(), 'operator-')); try {
    const { symlink } = await import('node:fs/promises');
    await writeFile(join(root, 'target'), 'data');
    const c = config();
    c.artifacts = [{ id: 'geo', kind: 'geonames', path: 'target', sha256: hash, bytes: 4, version: 'v1' }];
    c.releases.current.artifactIds = ['geo'];
    c.budget.currentBytes = 3;
    assert.equal((await operatorPreflight(c, root)).status, 'invalid');
    c.budget.currentBytes = 100;
    try {
        await symlink(join(root, 'target'), join(root, 'link'));
    }
    catch {
        t.diagnostic('Symlink creation unavailable on this Windows account; regular containment checks still run.');
        return;
    }
    c.artifacts[0].path = 'link';
    assert.equal((await operatorPreflight(c, root)).status, 'invalid');
}
finally {
    await rm(root, { recursive: true, force: true });
} });
test('full selection verifies explicit path hash version and both release inventories', async () => { const root = await mkdtemp(join(tmpdir(), 'operator-')); try {
    const c = config();
    c.runtimeEnvironment.NIGHTSKY_MCP_TOOL_MODE = 'full';
    c.runtimeEnvironment.MET_NORWAY_USER_AGENT = 'NightSky.earth nightsky.earth2026@gmail.com';
    for (const [id, kind, key, hkey] of [['geo', 'geonames', 'NIGHTSKY_GEONAMES_INDEX', null], ['osm', 'osm-single', 'NIGHTSKY_OSM_CANDIDATE_INDEX', 'NIGHTSKY_OSM_CANDIDATE_SHA256'], ['history', 'climate-legacy', 'NIGHTSKY_CLIMATE_ARTIFACT', 'NIGHTSKY_CLIMATE_SHA256']] as const) {
        await writeFile(join(root, id), 'data');
        c.artifacts.push({ id, kind, path: id, sha256: hash, bytes: 4, version: 'v1' });
        c.releases.current.artifactIds.push(id); c.releases.rollback.artifactIds.push(id);
        c.runtimeEnvironment[key] = id;
        if (hkey)
            c.runtimeEnvironment[hkey] = hash;
    }
    assert.equal((await operatorPreflight(c, root)).status, 'offline-pass');
    c.artifacts[0].bytes = 1001;
    assert.equal((await operatorPreflight(c, root)).status, 'invalid');
}
finally {
    await rm(root, { recursive: true, force: true });
} });
test('one path cannot represent conflicting artifact versions',async()=>{const c=config();c.artifacts=[{id:'a',kind:'component',path:'file',sha256:hash,bytes:4,version:'v1'},{id:'b',kind:'component',path:'file',sha256:hash,bytes:4,version:'v2'}];const r=await operatorPreflight(c,'.');assert.ok(r.findings.includes('ARTIFACT_PATH_CONFLICT'));});
test('full rollback cannot omit the product artifacts retained for recovery',async()=>{const c=config();c.runtimeEnvironment.NIGHTSKY_MCP_TOOL_MODE='full';const r=await operatorPreflight(c,'.');assert.ok(r.findings.includes('ROLLBACK_PRODUCT_INVENTORY_MISSING'));});

test('artifact changed during verification fails without exposing its path',async()=>{const root=await mkdtemp(join(tmpdir(),'operator-mutation-'));try{const body=Buffer.alloc(4*1024*1024,1),path=join(root,'file');await writeFile(path,body);const c=config();c.budget.maxArtifactBytes=body.length;c.budget.currentBytes=body.length;c.budget.diskAvailableBytes=body.length*2;c.artifacts=[{id:'file',kind:'component',path:'file',sha256:createHash('sha256').update(body).digest('hex'),bytes:body.length,version:'v1'}];c.releases.current.artifactIds=['file'];const checking=operatorPreflight(c,root);await writeFile(path,Buffer.alloc(body.length,2));const result=await checking;assert.equal(result.status,'invalid');assert.ok(!JSON.stringify(result).includes(root));}finally{await rm(root,{recursive:true,force:true});}});
test('release selection redacts unknown property names in errors',()=>{const c=config();c['secret-value-as-unknown-key']='also-secret';assert.throws(()=>selectRelease(c,'rollback'),error=>{assert.equal((error as Error).message,'Release selection invalid.');assert.ok(!String(error).includes('secret-value'));return true;});});
test('unassigned inventory cannot pass without a release allocation',async()=>{const root=await mkdtemp(join(tmpdir(),'operator-unassigned-'));try{await writeFile(join(root,'file'),'data');const c=config();c.artifacts=[{id:'orphan',kind:'component',path:'file',sha256:hash,bytes:4,version:'v1'}];const result=await operatorPreflight(c,root);assert.equal(result.status,'invalid');assert.ok(result.findings.includes('ARTIFACT_UNASSIGNED'));}finally{await rm(root,{recursive:true,force:true});}});
