import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { operatorPreflight, operatorConfigSchema, selectRelease } from '../../shared/nightsky/operator';
const hash = createHash('sha256').update('data').digest('hex');
function config() { return { schemaVersion: 1, status: 'selected', endpoints: { production: 'https://mcp.nightsky.earth/mcp', staging: 'https://stage.nightsky.earth/mcp', privacy: 'https://nightsky.earth/privacy', terms: 'https://nightsky.earth/terms', support: 'https://nightsky.earth/support' }, topology: { kind: 'direct', headerRewriteEvidence: null, restrictedBackendEvidence: null }, runtimeEnvironment: { NODE_ENV: 'production', HOST: '127.0.0.1', PORT: '5000', NIGHTSKY_MCP_TOOL_MODE: 'resolver-only', NIGHTSKY_MCP_ALLOWED_HOSTS: 'mcp.nightsky.earth,stage.nightsky.earth', NIGHTSKY_QUOTA_STATE_PATH: join(tmpdir(),'operator-quota.json') }, releases: { current: { id: 'current', sourceCommit: 'a'.repeat(40), imageDigest: 'sha256:' + hash, architecture: 'amd64', packageVersion: '1.0.12', artifactIds: [] }, rollback: { id: 'previous', sourceCommit: 'b'.repeat(40), imageDigest: 'sha256:' + 'b'.repeat(64), architecture: 'amd64', packageVersion: '1.0.11', artifactIds: [] } }, artifacts: [], budget: { processes: 1, memoryBytes: 1024, diskAvailableBytes: 10000, currentBytes: 100, rollbackBytes: 100, scratchBytes: 100, reserveBytes: 100, maxArtifactBytes: 1000, capacityEvidence: 'record-1', rollbackEvidence: 'record-2' }, ownerEvidence: { identity: 'record', policies: 'record', retention: 'record', host: 'record', providerBudget: 'record' } } as any; }
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

test('published catalogue closure requires every pinned child in the same release inventory',async()=>{
 const {buildStreamedCatalogue}=await import('../../scripts/osm/build-streamed-catalogue');
 const {readFile,readdir,realpath}=await import('node:fs/promises');
 const root=await realpath(await mkdtemp(join(tmpdir(),'operator-closure-')));
 try {
  async function* empty():AsyncGenerator<any>{}
  await buildStreamedCatalogue({catalogueRevision:'closure-v1',candidates:empty(),regions:empty(),footprints:empty()},join(root,'catalogue'));
  const c=config();c.budget.currentBytes=1000000;c.budget.diskAvailableBytes=2000000;c.budget.maxArtifactBytes=1000000;
  for(const name of await readdir(join(root,'catalogue'),{recursive:true})){if(!name.endsWith('.json'))continue;const body=await readFile(join(root,'catalogue',name));c.artifacts.push({id:name,kind:name.startsWith('catalogue-')?'global-catalogue':'component',path:'catalogue/'+name.replaceAll('\\','/'),sha256:createHash('sha256').update(body).digest('hex'),bytes:body.length,version:'closure-v1'});}
  c.releases.current.artifactIds=c.artifacts.map((a:any)=>a.id);
  assert.ok(c.artifacts.some((a:any)=>a.kind==='global-catalogue'));
  assert.equal((await operatorPreflight(c,root)).status,'offline-pass');
  const child=c.artifacts.find((a:any)=>a.kind==='component');
  c.releases.current.artifactIds=c.releases.current.artifactIds.filter((id:string)=>id!==child.id);c.releases.rollback.artifactIds=[child.id];
  const result=await operatorPreflight(c,root);assert.ok(result.findings.includes('RELEASE_CLOSURE_INVALID'));
 }finally{await rm(root,{recursive:true,force:true});}
});



test('history publisher recovery closure rejects missing unlisted mutated and cross-release tiles',async(t)=>{
 const {publishClimateRelease}=await import('../../scripts/era5/build-release');const {releaseClosureSample}=await import('./release-closure-fixture');
 const {readFile,readdir,realpath}=await import('node:fs/promises');const root=await realpath(await mkdtemp(join(tmpdir(),'history-closure-')));
 try{const body=JSON.stringify(releaseClosureSample()),inputPath=join(root,'input.json');await writeFile(inputPath,body);const options={inputs:[{inputPath,expectedSha256:createHash('sha256').update(body).digest('hex')}],outputDirectory:join(root,'history'),generatedAt:'2026-10-13T18:00:00Z'};
 await assert.rejects(publishClimateRelease({...options,onProgress(){throw Error('rehearsal interruption');}}),/rehearsal/);
 await publishClimateRelease(options);const c=config();c.budget.currentBytes=1000000;c.budget.diskAvailableBytes=2000000;c.budget.maxArtifactBytes=1000000;
 for(const name of await readdir(options.outputDirectory,{recursive:true})){if(!name.endsWith('.json'))continue;const data=await readFile(join(options.outputDirectory,name));c.artifacts.push({id:name,kind:name==='manifest.json'?'era5-release':'component',path:'history/'+name.replaceAll('\\','/'),sha256:createHash('sha256').update(data).digest('hex'),bytes:data.length,version:'history-v1'});}
 c.releases.current.artifactIds=c.artifacts.map((a:any)=>a.id);const pristine=structuredClone(c),started=performance.now();assert.equal((await operatorPreflight(c,root)).status,'offline-pass');t.diagnostic(JSON.stringify({evidence:'offline-fictional-history-recovery',inventoryFiles:c.artifacts.length,inventoryBytes:c.artifacts.reduce((n:number,a:any)=>n+a.bytes,0),preflightDurationMs:performance.now()-started,hostChecksPerformed:false}));
 const tile=c.artifacts.find((a:any)=>a.path.includes('tile-'));assert.ok(tile);
 for(const variant of ['unlisted','cross-release','pin']){const candidate=structuredClone(pristine);if(variant==='unlisted'){candidate.artifacts=candidate.artifacts.filter((a:any)=>a.id!==tile.id);candidate.releases.current.artifactIds=candidate.releases.current.artifactIds.filter((id:string)=>id!==tile.id);}else if(variant==='cross-release'){candidate.releases.current.artifactIds=candidate.releases.current.artifactIds.filter((id:string)=>id!==tile.id);candidate.releases.rollback.artifactIds=[tile.id];}else candidate.artifacts.find((a:any)=>a.id===tile.id).sha256='f'.repeat(64);assert.equal((await operatorPreflight(candidate,root)).status,'invalid',variant);}
 await writeFile(join(root,tile.path),'{}');assert.equal((await operatorPreflight(pristine,root)).status,'invalid');await rm(join(root,tile.path));assert.equal((await operatorPreflight(pristine,root)).status,'invalid');
 assert.equal(selectRelease(pristine,'rollback').id,'previous');assert.equal((await operatorPreflight(pristine,root)).hostChecksPerformed,false);
 }finally{await rm(root,{recursive:true,force:true});}
});

test('distinct inventory ids cannot alias one physical release path',async()=>{const c=config();c.artifacts=[{id:'a',kind:'component',path:'file',sha256:hash,bytes:4,version:'v1'},{id:'b',kind:'component',path:'file',sha256:hash,bytes:4,version:'v1'}];c.releases.current.artifactIds=['a'];c.releases.rollback.artifactIds=['b'];assert.ok((await operatorPreflight(c,'.')).findings.includes('ARTIFACT_PATH_ALIAS'));});

test('catalogue closure rejects correctly pinned wrong-kind nested descendants',async(t)=>{
 const {readFile,realpath}=await import('node:fs/promises');const {loadCatalogueFiles}=await import('../../server/places/catalogueFiles');
 const root=await realpath(await mkdtemp(join(tmpdir(),'operator-tree-kind-')));const c=config();c.budget.currentBytes=1000000;c.budget.diskAvailableBytes=2000000;c.budget.maxArtifactBytes=1000000;
 try{async function put(path:string,value:unknown,kind='component'){const body=JSON.stringify(value);await writeFile(join(root,path),body);const sha256=createHash('sha256').update(body).digest('hex'),bytes=Buffer.byteLength(body);c.artifacts.push({id:path,kind,path,sha256,bytes,version:'tree-v1'});return {path,sha256,bytes};}
 const trees:any={};for(const [tree,kind] of Object.entries({spatial:'candidates',id:'ids',name:'names',membership:'memberships',regions:'regions',footprints:'footprints'})){trees[tree]={...await put(tree+'.json',{schemaVersion:2,catalogueRevision:'tree-v1',kind,rows:[]}),kind,rows:0};}
 const wrong={...await put('directory.json',{schemaVersion:2,catalogueRevision:'tree-v1',kind:'directory',entries:[trees.name]}),kind:'directory',rows:1};trees.spatial=wrong;
 const rootPin=await put('root.json',{schemaVersion:2,catalogueRevision:'tree-v1',trees},'global-catalogue');c.releases.current.artifactIds=c.artifacts.map((a:any)=>a.id);
 const files=await loadCatalogueFiles(join(root,'root.json'),{expectedSha256:rootPin.sha256});await assert.rejects(async()=>{for await(const _ of files.walk('spatial')){}},/Unexpected spatial tree leaf kind/);
 const before=performance.now(),result=await operatorPreflight(c,root);t.diagnostic(JSON.stringify({evidence:'offline-fictional-fixture',inventoryFiles:c.artifacts.length,inventoryBytes:c.artifacts.reduce((n:number,a:any)=>n+a.bytes,0),durationMs:performance.now()-before,hostChecksPerformed:result.hostChecksPerformed}));assert.ok(result.findings.includes('RELEASE_CLOSURE_INVALID'));
 }finally{await rm(root,{recursive:true,force:true});}
});

test('catalogue closure matches repeated-page walks while allowing shared candidate pointers',async()=>{
 const {realpath}=await import('node:fs/promises');const {loadCatalogueFiles}=await import('../../server/places/catalogueFiles');
 const root=await realpath(await mkdtemp(join(tmpdir(),'operator-repeated-page-')));
 try{
  const c=config();c.budget.currentBytes=1000000;c.budget.diskAvailableBytes=2000000;c.budget.maxArtifactBytes=1000000;
  async function put(path:string,value:any,kind='component'){
   const body=JSON.stringify(value),sha256=createHash('sha256').update(body).digest('hex'),bytes=Buffer.byteLength(body);
   await writeFile(join(root,path),body);c.artifacts=c.artifacts.filter((a:any)=>a.path!==path);c.artifacts.push({id:path,kind,path,sha256,bytes,version:'repeat-v1'});
   return {path,sha256,bytes,kind:value.kind,rows:value.kind==='directory'?value.entries.length:value.rows?.length};
  }
  const base={schemaVersion:2,catalogueRevision:'repeat-v1'},trees:any={};
  for(const [tree,kind] of Object.entries({spatial:'candidates',id:'ids',name:'names',membership:'memberships',regions:'regions',footprints:'footprints'}))trees[tree]=await put(tree+'.json',{...base,kind,rows:[]});
  const leaf=trees.spatial;
  trees.id=await put('id.json',{...base,kind:'ids',rows:[{key:'place:v1:osm:node:1',page:leaf},{key:'place:v1:osm:node:2',page:leaf}]});
  trees.membership=await put('membership.json',{...base,kind:'memberships',rows:[{key:'region:v1:country:IN',placeId:'place:v1:osm:node:1',page:leaf}]});
  async function pin(){const ref=await put('root.json',{...base,trees},'global-catalogue');c.releases.current.artifactIds=c.artifacts.map((a:any)=>a.id);return ref;}
  await pin();assert.equal((await operatorPreflight(c,root)).status,'offline-pass','separate index pointers can share a candidate page');
  const a=await put('dir-a.json',{...base,kind:'directory',entries:[leaf]}),b=await put('dir-b.json',{...base,kind:'directory',entries:[leaf]});
  trees.spatial=await put('top.json',{...base,kind:'directory',entries:[a,b]});const rootPin=await pin();
  const files=await loadCatalogueFiles(join(root,'root.json'),{expectedSha256:rootPin.sha256});
  await assert.rejects(async()=>{for await(const _ of files.walk('spatial')){}},/Repeated or cyclic catalogue page/);
  const result=await operatorPreflight(c,root);assert.ok(result.findings.includes('RELEASE_CLOSURE_INVALID'));
 }finally{await rm(root,{recursive:true,force:true});}
});

function apiEvidence() { return {mode:'api',providers:['geonames','geoapify'],configurationEvidence:'private-env-configured',policyEvidence:'admission-reviewed',budgetEvidence:'single-process-bounds'}; }
test('API discovery operator evidence requires no geography artifacts and keeps history gate',async()=>{const c=config();c.runtimeEnvironment.NIGHTSKY_DISCOVERY_MODE='api';c.releases.current.discovery=apiEvidence();c.releases.rollback.discovery=apiEvidence();assert.equal((await operatorPreflight(c,'.')).status,'offline-pass');c.runtimeEnvironment.NIGHTSKY_MCP_TOOL_MODE='full';const r=await operatorPreflight(c,'.');assert.ok(r.findings.includes('FULL_MODE_INPUTS_MISSING'));assert.ok(r.findings.includes('ROLLBACK_PRODUCT_INVENTORY_MISSING'));});
test('API evidence, single process and source mode are enforced',async()=>{for(const mutate of [(c:any)=>delete c.releases.current.discovery,(c:any)=>c.releases.rollback.discovery.policyEvidence=null,(c:any)=>c.budget.processes=2,(c:any)=>c.runtimeEnvironment.NIGHTSKY_GEONAMES_INDEX='old.gz',(c:any)=>c.releases.current.discovery.mode='legacy']){const c=config();c.runtimeEnvironment.NIGHTSKY_DISCOVERY_MODE='api';c.releases.current.discovery=apiEvidence();c.releases.rollback.discovery=apiEvidence();mutate(c);assert.notEqual((await operatorPreflight(c,'.')).status,'offline-pass');}});
test('API current release does not bypass legacy rollback requirements',async()=>{const c=config();c.runtimeEnvironment.NIGHTSKY_DISCOVERY_MODE='api';c.runtimeEnvironment.NIGHTSKY_MCP_TOOL_MODE='full';c.releases.current.discovery=apiEvidence();const r=await operatorPreflight(c,'.');assert.ok(r.findings.includes('ROLLBACK_PRODUCT_INVENTORY_MISSING'));});

test('full API release keeps point-history gate even with legacy history inventory',async()=>{const root=await mkdtemp(join(tmpdir(),'operator-api-'));try{await writeFile(join(root,'history'),'data');const c=config();Object.assign(c.runtimeEnvironment,{NIGHTSKY_DISCOVERY_MODE:'api',NIGHTSKY_MCP_TOOL_MODE:'full',MET_NORWAY_USER_AGENT:'NightSky.earth nightsky.earth2026@gmail.com',NIGHTSKY_CLIMATE_ARTIFACT:'history',NIGHTSKY_CLIMATE_SHA256:hash});c.artifacts=[{id:'history',kind:'climate-legacy',path:'history',sha256:hash,bytes:4,version:'v1'}];for(const r of [c.releases.current,c.releases.rollback]){r.discovery=apiEvidence();r.artifactIds=['history'];}const result=await operatorPreflight(c,root);assert.equal(result.status,'incomplete-owner-inputs');assert.ok(result.findings.includes('API_HISTORY_ROUTE_NOT_ADMITTED'));assert.ok(!result.findings.includes('FULL_MODE_INPUTS_MISSING'));}finally{await rm(root,{recursive:true,force:true});}});

test('omitted tool mode uses full-mode preflight requirements',async()=>{const c=config();delete c.runtimeEnvironment.NIGHTSKY_MCP_TOOL_MODE;assert.ok((await operatorPreflight(c,'.')).findings.includes('FULL_MODE_INPUTS_MISSING'));});
test('Geoapify-only operator evidence is accepted with unique provider IDs',async()=>{
 const c=config();c.runtimeEnvironment.NIGHTSKY_DISCOVERY_MODE='api';
 for(const r of [c.releases.current,c.releases.rollback])r.discovery={...apiEvidence(),providers:['geoapify']};
 assert.equal((await operatorPreflight(c,'.')).status,'offline-pass');
 c.releases.rollback.discovery.providers=['geoapify','geoapify'];assert.notEqual((await operatorPreflight(c,'.')).status,'offline-pass');
});
function weatherEvidence(providers:string[],admittedProviders:string[]=[]) { return {providers,admittedProviders,liveVerifiedProviders:[],configurationEvidence:'private-config-record',policyEvidence:'account-free-reviewed',budgetEvidence:'unused-budget-record'}; }
test('weather release evidence permits rollback subsets and distinguishes admission from live verification',async()=>{
 const c=config();Object.assign(c.runtimeEnvironment,{NIGHTSKY_WEATHER_PROVIDERS:'met,weatherapi',NIGHTSKY_WEATHER_ADMITTED_PROVIDERS:'weatherapi',NIGHTSKY_QUOTA_STATE_PATH:join(tmpdir(),'operator-weather-quota.json')});
 c.releases.current.weather=weatherEvidence(['met','weatherapi'],['weatherapi']);c.releases.rollback.weather=weatherEvidence(['met']);
 assert.equal((await operatorPreflight(c,'.')).status,'offline-pass');
 c.releases.rollback.weather=weatherEvidence(['openweather']);assert.ok((await operatorPreflight(c,'.')).findings.includes('WEATHER_ADMISSION_EVIDENCE_MISSING'));
 delete c.runtimeEnvironment.NIGHTSKY_QUOTA_STATE_PATH;assert.ok((await operatorPreflight(c,'.')).findings.includes('WEATHER_QUOTA_CONFIGURATION_MISSING'));
});
test('weather private keys are excluded from operator JSON and reports',async()=>{
 const c=config();c.runtimeEnvironment.NIGHTSKY_WEATHERAPI_KEY='do-not-report';const result=await operatorPreflight(c,'.');assert.equal(result.status,'invalid');assert.ok(!JSON.stringify(result).includes('do-not-report'));
});

test('API discovery requires quota declaration for current and rollback independently of weather',async()=>{
 for(const selection of ['current','rollback'] as const){const c=config();delete c.runtimeEnvironment.NIGHTSKY_QUOTA_STATE_PATH;if(selection==='current')c.runtimeEnvironment.NIGHTSKY_DISCOVERY_MODE='api';c.releases[selection].discovery=apiEvidence();const r=await operatorPreflight(c,'.');assert.ok(r.findings.includes('API_QUOTA_CONFIGURATION_MISSING'));assert.notEqual(r.status,'offline-pass');}
});

function apiOnlyConfig() {
 const c=config();Object.assign(c.runtimeEnvironment,{NIGHTSKY_DISCOVERY_MODE:'api',NIGHTSKY_MCP_TOOL_MODE:'full',MET_NORWAY_USER_AGENT:'NightSky.earth nightsky.earth2026@gmail.com'});
 for(const r of [c.releases.current,c.releases.rollback]){r.profile='api-only-v1';r.discovery={...apiEvidence(),providers:['geoapify']};}
 return c;
}
test('explicit API-only V1 full releases pass offline without geography or history',async()=>{
 const r=await operatorPreflight(apiOnlyConfig(),'.');assert.equal(r.status,'offline-pass',r.findings.join(','));assert.equal(r.deploymentReady,false);assert.equal(r.officialAccepted,false);
});
test('API-only profile preserves quota, MET contact, owner and rollback gates',async()=>{
 for(const [change,code] of [
 [(c:any)=>delete c.runtimeEnvironment.NIGHTSKY_QUOTA_STATE_PATH,'API_QUOTA_CONFIGURATION_MISSING'],
 [(c:any)=>delete c.runtimeEnvironment.MET_NORWAY_USER_AGENT,'FULL_MODE_INPUTS_MISSING'],
 [(c:any)=>c.budget.processes=2,'API_SINGLE_PROCESS_REQUIRED'],
 [(c:any)=>c.ownerEvidence.host=null,'OWNER_EVIDENCE_MISSING'],
 [(c:any)=>delete c.releases.rollback.profile,'API_HISTORY_ROUTE_NOT_ADMITTED'],
 ] as const){const c=apiOnlyConfig();change(c);const r=await operatorPreflight(c,'.');assert.notEqual(r.status,'offline-pass');assert.ok(r.findings.includes(code),r.findings.join(','));}
});
test('API-only profile rejects conflicting modes, local artifacts and history activation',async()=>{
 for(const change of [
 (c:any)=>{c.runtimeEnvironment.NIGHTSKY_DISCOVERY_MODE='legacy';c.releases.current.discovery.mode='legacy';},
 (c:any)=>c.runtimeEnvironment.NIGHTSKY_API_HISTORY_CACHE_DIRECTORY='history-cache',
 (c:any)=>c.runtimeEnvironment.NIGHTSKY_CLIMATE_ARTIFACT='history',
 (c:any)=>{c.artifacts=[{id:'history',kind:'climate-legacy',path:'history',sha256:hash,bytes:4,version:'v1'}];c.releases.rollback.artifactIds=['history'];},
 ]){const c=apiOnlyConfig();change(c);const r=await operatorPreflight(c,'.');assert.ok(r.findings.includes('API_ONLY_PROFILE_CONFLICT'),r.findings.join(','));assert.equal(r.status,'invalid');}
});
