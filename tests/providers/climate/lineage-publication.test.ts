import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,realpath,writeFile,readFile,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {releaseClosureSample} from '../../operations/release-closure-fixture';
import {releaseSha} from '../../../server/providers/climate/releaseEra5';
import {publishClimateRelease} from '../../../scripts/era5/build-release';
import {publishClimateCatalog} from '../../../scripts/era5/build-catalog';

async function fixture(counts=[6000,4001]){
 const root=await realpath(await mkdtemp(join(tmpdir(),'nightsky-lineage-')));
 const inputs=[];
 for(let i=0;i<2;i++){
  const dir=join(root,'shard'+i);await mkdir(dir);const sample=releaseClosureSample();sample.tiles=sample.tiles.slice(i,i+1);sample.manifest.tiles=sample.manifest.tiles.slice(i,i+1);
  sample.manifest.sourceRevisions=Array.from({length:counts[i]},(_,j)=>({kind:'raw',revision:`synthetic-${i}-${j}`,sha256:releaseSha(`synthetic payload ${i} ${j}`)}));
  for(const tile of sample.tiles){const descriptor=sample.manifest.tiles.find(d=>d.key===tile.key)!;await writeFile(join(dir,descriptor.path),JSON.stringify(tile));}
  const body=JSON.stringify(sample.manifest);await writeFile(join(dir,'manifest.json'),body);inputs.push({path:`shard${i}/manifest.json`,sha256:releaseSha(body)});
 }
 return {root,inputs};
}
const budgets={maxInputBytes:64*1024**2,maxMemoryBytes:16*1024**2,maxScratchBytes:64*1024**2,maxOutputBytes:64*1024**2,maxDurationMs:60000};
test('schema6 admits 10001 source pins without embedding a child union and schema5 serves pinned membership',async()=>{
 // This is an integrity/serving fixture, not a 60-second performance assertion.
 // Windows hosted-runner filesystem variance exceeded the smaller fixture budget.
 const largeFixtureBudgets={...budgets,maxDurationMs:180000};
 const {root,inputs}=await fixture();
 const published=await publishClimateRelease({schemaVersion:6,outputPath:join(root,'release.json'),inputs,budgets:largeFixtureBudgets} as any);
 const data=JSON.parse(await readFile(published.manifestPath,'utf8'));
 assert.equal(data.schemaVersion,6);assert.equal(data.sourceLineage.uniqueRevisionCount,10001);assert.equal(data.metadata.sourceRevisions,undefined);assert.equal(data.shards[0].sourceRevisions,undefined);
 const catalog=await publishClimateCatalog({schemaVersion:5,outputPath:join(root,'catalog.json'),inputs:[{path:'release.json',sha256:published.manifestSha256}],budgets:largeFixtureBudgets} as any);
 const {createReleaseEra5ClimateProvider}=await import('../../../server/providers/climate/releaseEra5');
 const index={vintageLabel:'fictional-index',getById(id:number){return {latitude:10.25,longitude:id===1?77:77.25,timeZone:'Asia/Kolkata'};}} as any;
 const provider=createReleaseEra5ClimateProvider({index,artifactPath:catalog.manifestPath,expectedSha256:catalog.manifestSha256});
 for(const id of [1,2])assert.equal((await provider.getClimatology(`place:v1:geonames:${id}`,1)).availability.status,'partial');
 assert(provider.inspectCache().bytes<=32*1024**2);
});


test('catalog deduplicates identical cross-child pins and rejects conflicting cross-child pins',async()=>{
 for(const conflict of [false,true]){
  const {root,inputs}=await fixture([2,2]);const first=JSON.parse(await readFile(join(root,inputs[0].path),'utf8')),second=JSON.parse(await readFile(join(root,inputs[1].path),'utf8'));second.sourceRevisions[0]={...first.sourceRevisions[0],...(conflict?{sha256:'f'.repeat(64)}:{})};const body=JSON.stringify(second);await writeFile(join(root,inputs[1].path),body);inputs[1].sha256=releaseSha(body);
  const children=[];for(let i=0;i<2;i++){const child=await publishClimateRelease({schemaVersion:6,outputPath:join(root,`child${i}.json`),inputs:[inputs[i]],budgets} as any);children.push({path:`child${i}.json`,sha256:child.manifestSha256});}
  const publication=publishClimateCatalog({schemaVersion:5,outputPath:join(root,'catalog.json'),inputs:children,budgets} as any);
  if(conflict)await assert.rejects(publication,/conflict/i);else {const result=await publication;assert.equal(JSON.parse(await readFile(result.manifestPath,'utf8')).lineage.uniqueRevisionCount,3);}
 }
});
test('catalog rejects a fully repinned child tree that omits a committed shard source',async()=>{
 const {root,inputs}=await fixture([2,2]),published=await publishClimateRelease({schemaVersion:6,outputPath:join(root,'release.json'),inputs,budgets} as any);
 const data=JSON.parse(await readFile(published.manifestPath,'utf8')),source=JSON.parse(await readFile(join(root,inputs[0].path),'utf8')).sourceRevisions[0];
 const {buildLineageTree}=await import('../../../scripts/era5/build-lineage');const {sourceLineage}=await import('../../../server/providers/climate/hierarchicalEra5');
 const forged=await buildLineageTree({rows:(async function*(){yield source;})(),kind:'source',outputDirectory:join(root,'forged'),pathPrefix:'forged',budgets});
 data.sourceLineage=sourceLineage(forged.descriptor,data.sourceLineage.membershipRoot);const body=JSON.stringify(data);await writeFile(join(root,'forged-release.json'),body);
 await assert.rejects(publishClimateCatalog({schemaVersion:5,outputPath:join(root,'catalog.json'),inputs:[{path:'forged-release.json',sha256:releaseSha(body)}],budgets} as any),/union/i);
});
test('operator schema5 exhaustively derives closure and requires reserved explicit scratch',async()=>{
 const {root,inputs}=await fixture([2,2]),published=await publishClimateRelease({schemaVersion:6,outputPath:join(root,'release.json'),inputs,budgets} as any),catalog=await publishClimateCatalog({schemaVersion:5,outputPath:join(root,'catalog.json'),inputs:[{path:'release.json',sha256:published.manifestSha256}],budgets} as any);
 const {validateOperatorReleaseClosure}=await import('../../../shared/nightsky/operatorClosure');const body=await readFile(catalog.manifestPath),pin={id:'catalog',kind:'era5-release' as const,path:'catalog.json',sha256:catalog.manifestSha256,bytes:body.length,version:'fictional'};
 await assert.rejects(validateOperatorReleaseClosure(root,[pin]),/explicit/i);
 const scratchParent=await realpath(await mkdtemp(join(tmpdir(),'nightsky-closure-')));const options={lineageValidation:{scratchDirectory:join(scratchParent,'audit'),budgets}};
 const proof=await validateOperatorReleaseClosure(root,[pin],options);assert(proof.references>10);assert(proof.accountedBytes>body.length);
 await assert.rejects(validateOperatorReleaseClosure(root,[pin],options),/exist/i);
 await assert.rejects(validateOperatorReleaseClosure(root,[pin],{lineageValidation:{scratchDirectory:join(root,'unsafe'),budgets}}),/overlap/i);
 await writeFile(join(root,'shard1',JSON.parse(await readFile(join(root,inputs[1].path),'utf8')).tiles[0].path),'{}');
 await assert.rejects(validateOperatorReleaseClosure(root,[pin],{lineageValidation:{scratchDirectory:join(scratchParent,'corrupt'),budgets}}));
});
test('unknown schemas and missing membership pins fail closed',async()=>{
 const {root,inputs}=await fixture([2,2]),published=await publishClimateRelease({schemaVersion:6,outputPath:join(root,'release.json'),inputs,budgets} as any);const data=JSON.parse(await readFile(published.manifestPath,'utf8'));
 const {createReleaseEra5ClimateProvider}=await import('../../../server/providers/climate/releaseEra5');const index={vintageLabel:'fictional-index',getById(){return {latitude:10.25,longitude:77,timeZone:'Asia/Kolkata'};}} as any;
 for(const schemaVersion of [0,7]){const body=JSON.stringify({...data,schemaVersion});await writeFile(join(root,'unknown.json'),body);assert.equal((await createReleaseEra5ClimateProvider({index,artifactPath:join(root,'unknown.json'),expectedSha256:releaseSha(body)}).getClimatology('place:v1:geonames:1',1)).availability.status,'unavailable');}
 await writeFile(join(root,data.sourceLineage.membershipRoot.rootPath),'{}');assert.equal((await createReleaseEra5ClimateProvider({index,artifactPath:published.manifestPath,expectedSha256:published.manifestSha256}).getClimatology('place:v1:geonames:1',1)).availability.status,'unavailable');
});

test('operator shares the declared scratch ceiling across multiple schema6 roots',async()=>{
 const {root,inputs}=await fixture([2,2]),published=await publishClimateRelease({schemaVersion:6,outputPath:join(root,'release.json'),inputs,budgets} as any);const body=await readFile(published.manifestPath);await writeFile(join(root,'second.json'),body);
 const inventory=['release.json','second.json'].map(path=>({id:path,kind:'era5-release' as const,path,sha256:published.manifestSha256,bytes:body.length,version:'fixture'}));const parent=await realpath(await mkdtemp(join(tmpdir(),'nightsky-multi-closure-')));
 const {validateOperatorReleaseClosure}=await import('../../../shared/nightsky/operatorClosure');
 await assert.rejects(validateOperatorReleaseClosure(root,inventory,{lineageValidation:{scratchDirectory:join(parent,'audit'),budgets:{...budgets,maxScratchBytes:600}}}),/scratch.*budget/i);
});

test('schema6 publication rejects pinned invalid UTF-8 instead of admitting replacement text',async()=>{
 const {root,inputs}=await fixture([2,2]),data=JSON.parse(await readFile(join(root,inputs[0].path),'utf8'));data.caveats=['�'];const valid=Buffer.from(JSON.stringify(data)),at=valid.indexOf(Buffer.from('�')),invalid=Buffer.concat([valid.subarray(0,at),Buffer.from([255]),valid.subarray(at+3)]);await writeFile(join(root,inputs[0].path),invalid);inputs[0].sha256=releaseSha(invalid);
 // Match the other shard's metadata so only malformed bytes explain rejection.
 const other=JSON.parse(await readFile(join(root,inputs[1].path),'utf8'));other.caveats=['�'];const body=JSON.stringify(other);await writeFile(join(root,inputs[1].path),body);inputs[1].sha256=releaseSha(body);
 await assert.rejects(publishClimateRelease({schemaVersion:6,outputPath:join(root,'release.json'),inputs,budgets} as any),/encoded|encoding|UTF/i);
});

test('operator scratch rejects dot-dot-prefixed descendants rather than treating them as outside artifacts',async()=>{
 const {prepareLineageScratch}=await import('../../../shared/nightsky/operatorLineageClosure');const root=await realpath(await mkdtemp(join(tmpdir(),'nightsky-scratch-boundary-')));
 await assert.rejects(prepareLineageScratch(root,{scratchDirectory:join(root,'..audit'),budgets}),/overlap/i);
});

test('operator preflight creates its explicitly reserved current and rollback scratch directories',async()=>{
 const {root,inputs}=await fixture([2,2]),published=await publishClimateRelease({schemaVersion:6,outputPath:join(root,'release.json'),inputs,budgets} as any),body=await readFile(published.manifestPath),pin={id:'release',kind:'era5-release',path:'release.json',sha256:published.manifestSha256,bytes:body.length,version:'fixture'};
 const scratchParent=await realpath(await mkdtemp(join(tmpdir(),'nightsky-preflight-')));const config:any={schemaVersion:1,status:'selected',lineageValidation:{scratchDirectory:join(scratchParent,'working'),budgets},endpoints:{production:'https://mcp.nightsky.earth/mcp',staging:'https://stage.nightsky.earth/mcp',privacy:'https://nightsky.earth/privacy',terms:'https://nightsky.earth/terms',support:'https://nightsky.earth/support'},topology:{kind:'direct',headerRewriteEvidence:null,restrictedBackendEvidence:null},runtimeEnvironment:{NODE_ENV:'production',HOST:'127.0.0.1',PORT:'5000',NIGHTSKY_MCP_TOOL_MODE:'resolver-only',NIGHTSKY_MCP_ALLOWED_HOSTS:'mcp.nightsky.earth,stage.nightsky.earth'},releases:{current:{id:'current',sourceCommit:'a'.repeat(40),imageDigest:'sha256:'+'a'.repeat(64),architecture:'amd64',packageVersion:'1.0.12',artifactIds:['release']},rollback:{id:'previous',sourceCommit:'b'.repeat(40),imageDigest:'sha256:'+'b'.repeat(64),architecture:'amd64',packageVersion:'1.0.11',artifactIds:['release']}},artifacts:[pin],budget:{processes:1,memoryBytes:budgets.maxMemoryBytes,diskAvailableBytes:512*1024**2,currentBytes:64*1024**2,rollbackBytes:64*1024**2,scratchBytes:128*1024**2,reserveBytes:0,maxArtifactBytes:8*1024**2,capacityEvidence:'fixture',rollbackEvidence:'fixture'},ownerEvidence:{identity:'fixture',policies:'fixture',retention:'fixture',host:'fixture',providerBudget:'fixture'}};
 const {operatorPreflight}=await import('../../../shared/nightsky/operator');assert.equal((await operatorPreflight(config,root)).status,'offline-pass');
 const insufficient=structuredClone(config);insufficient.lineageValidation.scratchDirectory=join(scratchParent,'second');insufficient.budget.scratchBytes=64*1024**2;assert((await operatorPreflight(insufficient,root)).findings.includes('LINEAGE_VALIDATION_BUDGET_UNRESERVED'));
});
