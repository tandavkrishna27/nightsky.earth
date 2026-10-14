import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {buildGlobalCatalogue} from '../../scripts/osm/build-global-catalogue';
import {loadCatalogueFiles} from '../../server/places/catalogueFiles';
const source={name:'OSM',url:'https://openstreetmap.org',attribution:'OSM contributors',dataClass:'catalog' as const,vintage:'2026'};
const row=(id:number)=>({placeId:`place:v1:osm:node:${id}`,name:`Park ${id}`,category:'park' as const,latitude:id,longitude:0,accessEvidence:{status:'unknown' as const},sources:[source],caveats:[],catalogueRevision:'test-v1',sourceCompleteness:1,regionIds:[]});
const input={catalogueRevision:'test-v1',candidates:[row(1),row(2),row(3)],regions:[],footprints:[{geometryBasis:'full-cell' as const,footprintId:'empty',bounds:{south:10,north:20,west:10,east:20},sources:[source],vintage:'2026'}]};
test('deterministic paged builds preserve empty admitted footprint and evict bounded pages',async()=>{
 const a=await mkdtemp(join(tmpdir(),'cat-a-')),b=await mkdtemp(join(tmpdir(),'cat-b-'));
 const first=await buildGlobalCatalogue(input,a,{maxRows:1,fanout:2});const second=await buildGlobalCatalogue({...input,candidates:[...input.candidates].reverse()},b,{maxRows:1,fanout:2});
 assert.equal(first.sha256,second.sha256);
 const files=await loadCatalogueFiles(first.path,{expectedSha256:first.sha256});
 const ids=[];for await(const page of files.walk('spatial'))if(page.kind==='candidates')ids.push(...page.rows.map(r=>r.placeId));
 assert.deepEqual(ids,['place:v1:osm:node:1','place:v1:osm:node:2','place:v1:osm:node:3']);assert.ok(files.stats().residentPages<=2);assert.ok(files.stats().evictions>0);
 const fp=[];for await(const page of files.walk('footprints'))if(page.kind==='footprints')fp.push(...page.rows);assert.equal(fp[0].footprintId,'empty');
 const budget=files.createBudget({maxLeaves:1});let leaves=0;for await(const page of files.walk('spatial',{budget}))if(page.kind==='candidates')leaves++;assert.equal(leaves,1);assert.equal(budget.stopReason,'leaf-limit');
});
test('builder rejects conflicting duplicate identities',async()=>{const dir=await mkdtemp(join(tmpdir(),'cat-conflict-'));await assert.rejects(buildGlobalCatalogue({...input,candidates:[row(1),{...row(1),name:'Conflict'}]},dir),/conflict/i);});
test('reader rejects checksum mismatch and unsafe root pointers',async()=>{const dir=await mkdtemp(join(tmpdir(),'cat-bad-'));const result=await buildGlobalCatalogue(input,dir);await assert.rejects(loadCatalogueFiles(result.path,{expectedSha256:'0'.repeat(64)}),/checksum/i);const root=JSON.parse(await readFile(result.path,'utf8'));root.trees.spatial.path='../escape.json';await writeFile(result.path,JSON.stringify(root));const {createHash}=await import('node:crypto');await assert.rejects(loadCatalogueFiles(result.path,{expectedSha256:createHash('sha256').update(await readFile(result.path)).digest('hex')}),/path/i);});


import {createHash} from 'node:crypto';
import {symlink} from 'node:fs/promises';
import {CatalogueBudgetStop} from '../../server/places/catalogueFiles';
async function fixture(){const dir=await mkdtemp(join(tmpdir(),'cat-hostile-'));const built=await buildGlobalCatalogue(input,dir);return {dir,built,files:await loadCatalogueFiles(built.path,{expectedSha256:built.sha256})};}
async function artifact(dir:string,page:unknown,overrides:Record<string,unknown>={}){const bytes=Buffer.from(JSON.stringify(page));await writeFile(join(dir,'hostile.json'),bytes);return {path:'hostile.json',sha256:createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length,rows:1,kind:'candidates' as const,...overrides};}
for(const [name,page,overrides]of [
 ['edition mismatch',{schemaVersion:2,catalogueRevision:'other',kind:'candidates',rows:[row(1)]},{}],
 ['duplicate rows',{schemaVersion:2,catalogueRevision:'test-v1',kind:'candidates',rows:[row(1),row(1)]},{rows:2}],
 ['row count mismatch',{schemaVersion:2,catalogueRevision:'test-v1',kind:'candidates',rows:[row(1)]},{rows:2}],
 ['unknown schema keys',{schemaVersion:2,catalogueRevision:'test-v1',kind:'candidates',rows:[row(1)],extra:true},{}],
 ['outside point bounds',{schemaVersion:2,catalogueRevision:'test-v1',kind:'candidates',rows:[row(1)]},{bounds:{south:5,north:6,west:0,east:0}}],
 ['exact bytes mismatch',{schemaVersion:2,catalogueRevision:'test-v1',kind:'candidates',rows:[row(1)]},{bytes:1}],
 ['invalid ordered bounds',{schemaVersion:2,catalogueRevision:'test-v1',kind:'candidates',rows:[row(1)]},{bounds:{south:6,north:5,west:0,east:0}}],
 ['oversized descriptor',{schemaVersion:2,catalogueRevision:'test-v1',kind:'candidates',rows:[row(1)]},{bytes:4*1024*1024+1}],
 ['oversized rows',{schemaVersion:2,catalogueRevision:'test-v1',kind:'candidates',rows:[row(1)]},{rows:10001}]
] as const)test(`reader rejects ${name}`,async()=>{const{dir,files}=await fixture();await assert.rejects(files.readPage(await artifact(dir,page,overrides)));});
test('reader rejects internal symlink and bounded queued reads',async()=>{const{dir,files}=await fixture();const ref=await artifact(dir,{schemaVersion:2,catalogueRevision:'test-v1',kind:'candidates',rows:[row(1)]});try{await symlink(join(dir,'hostile.json'),join(dir,'linked.json'));await assert.rejects(files.readPage({...ref,path:'linked.json'}),/symlink/i);}catch(e){if((e as NodeJS.ErrnoException).code!=='EPERM')throw e;}
 const reads=Array.from({length:8},()=>files.readPage(ref));await assert.rejects(files.readPage(ref),/queue/i);await Promise.all(reads);assert.equal(files.stats().maxConcurrentLoads,1);
});
test('directory and deadline stops are explicit',async()=>{const dir=await mkdtemp(join(tmpdir(),'cat-stops-'));const built=await buildGlobalCatalogue(input,dir,{maxRows:1,fanout:2});const files=await loadCatalogueFiles(built.path,{expectedSha256:built.sha256});const budget=files.createBudget({maxDirectoryBytes:1});const pages=[];for await(const page of files.walk('spatial',{budget}))pages.push(page);assert.equal(pages.length,0);assert.equal(budget.stopReason,'directory-byte-limit');const expired=files.createBudget();expired.deadline=0;await assert.rejects(files.readPage(files.root.trees.spatial,expired),CatalogueBudgetStop);assert.equal(expired.stopReason,'time-limit');});
test('every routing reference has ordered key range',async()=>{const{dir,files}=await fixture();const ref=await artifact(dir,{schemaVersion:2,catalogueRevision:'test-v1',kind:'candidates',rows:[row(1)]},{minKey:'z',maxKey:'a'});await assert.rejects(files.readPage(ref),/key/i);});
test('reader rejects directory child bounds outside parent routing bounds',async()=>{const{dir,files}=await fixture();const child=await artifact(dir,{schemaVersion:2,catalogueRevision:'test-v1',kind:'candidates',rows:[row(1)]},{bounds:{south:1,north:1,west:0,east:0}});const ref=await artifact(dir,{schemaVersion:2,catalogueRevision:'test-v1',kind:'directory',entries:[child]},{kind:'directory',bounds:{south:5,north:6,west:0,east:0}});await assert.rejects(files.readPage(ref),/bounds/i);});
test('builder rejects unadmitted footprint bounding boxes',async()=>{const dir=await mkdtemp(join(tmpdir(),'cat-footprint-'));await assert.rejects(buildGlobalCatalogue({...input,footprints:[{...input.footprints[0],geometryBasis:'clip-bounds'} as any]},dir));});

test('builder stops normalized input at total row and byte admission before publication',async()=>{const dir=await mkdtemp(join(tmpdir(),'cat-admission-'));await assert.rejects(buildGlobalCatalogue(input,dir,{maxInputRows:2}),/input row/i);await assert.rejects(buildGlobalCatalogue(input,dir,{maxInputBytes:10}),/input byte/i);await assert.rejects(buildGlobalCatalogue(input,dir,{maxMetadataRows:0}),/limits/i);});

async function repinRoot(path:string,root:unknown){const bytes=Buffer.from(JSON.stringify(root));await writeFile(path,bytes);return createHash('sha256').update(bytes).digest('hex');}
test('same-edition correctly hashed root rejects a leaf from the wrong named tree',async()=>{
 const {built}=await fixture();const root=JSON.parse(await readFile(built.path,'utf8'));root.trees.spatial=root.trees.name;
 await assert.rejects(loadCatalogueFiles(built.path,{expectedSha256:await repinRoot(built.path,root)}),/tree.*kind|kind.*tree/i);
});
test('same-edition correctly hashed mixed directory rejects wrong-tree descendants',async()=>{
 const {dir,built}=await fixture();const root=JSON.parse(await readFile(built.path,'utf8'));
 root.trees.spatial=await artifact(dir,{schemaVersion:2,catalogueRevision:'test-v1',kind:'directory',entries:[root.trees.spatial,root.trees.name]},{kind:'directory',rows:2});
 const files=await loadCatalogueFiles(built.path,{expectedSha256:await repinRoot(built.path,root)});
 await assert.rejects(async()=>{for await(const _page of files.walk('spatial')){}},/tree.*kind|kind.*tree/i);
});
test('array build rejects unknown footprint regions before publishing pages or root',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'cat-footprint-region-'));
 await assert.rejects(buildGlobalCatalogue({...input,footprints:[{...input.footprints[0],regionIds:['region:v1:missing']}]},dir),/unknown.*region/i);
 const {readdir}=await import('node:fs/promises');assert.deepEqual(await readdir(dir),[]);
});
test('array input admission accounts for escaped control attribution bytes',async()=>{
 const escaped={...row(1),sources:Array.from({length:4},()=>({...source,attribution:'\u0001'.repeat(500)}))};
 assert.ok(Buffer.byteLength(JSON.stringify(escaped))>8000);
 await assert.rejects(buildGlobalCatalogue({...input,candidates:[escaped]},await mkdtemp(join(tmpdir(),'cat-escaped-byte-')),{maxInputBytes:8000}),/input byte limit/i);
});
import {jsonStringBytes} from '../../scripts/osm/normalized-input-bytes';
test('bounded string accounting handles JSON escapes and UTF8 without serializing whole strings',()=>{
 for(const [value,want]of [['A',3],['"',4],['\\',4],['\u0001',8],['\n',4],['é',4],['💫',6],['\ud800',8]] as const){assert.equal(jsonStringBytes(value,want),want);assert.throws(()=>jsonStringBytes(value,want-1),/byte limit/i);}
});
