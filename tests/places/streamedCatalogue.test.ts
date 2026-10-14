import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readdir,readFile,realpath} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path,{join} from 'node:path';
import {buildStreamedCatalogue} from '../../scripts/osm/build-streamed-catalogue';
import {buildGlobalCatalogue} from '../../scripts/osm/build-global-catalogue';
import {loadCatalogueFiles} from '../../server/places/catalogueFiles';
const source={name:'OSM',url:'https://openstreetmap.org',attribution:'OSM contributors',dataClass:'catalog' as const,vintage:'2026'};
const region={regionId:'region:v1:A',name:'A',countryCode:'IND',adminLevel:0 as const,boundaryRevision:'b1',sources:[source]};
const fp={geometryBasis:'full-cell' as const,footprintId:'world',bounds:{south:-90,north:90,west:-180,east:180},sources:[source],vintage:'2026'};
const row=(id:number)=>({placeId:`place:v1:osm:node:${id}`,name:`Park ${id}`,category:'park' as const,latitude:id/100,longitude:0,accessEvidence:{status:'unknown' as const},sources:[source],caveats:[],catalogueRevision:'test-v1',sourceCompleteness:id%100,regionIds:['region:v1:A'],countryCode:'IND'});
async function* stream<T>(rows:T[]){yield* rows;}
const input=(rows=Array.from({length:37},(_,i)=>row(37-i)))=>({catalogueRevision:'test-v1',candidates:stream(rows),regions:stream([region]),footprints:stream([fp])});
const dir=()=>mkdtemp(join(tmpdir(),'cat-stream-'));
const opts={chunkRows:3,mergeFanIn:2,maxRows:4,fanout:2};
function assertScratchChild(parent:string,scratch:string,paths=path){
 const child=paths.relative(parent,scratch);
 assert.ok(child&&!paths.isAbsolute(child),'Scratch evidence must be a child of the output directory');
 assert.equal(paths.dirname(child),'.','Scratch evidence must be a direct child of the output directory');
 assert.match(child,/^\.stream-build-/);
}
async function assertEvidenceChild(parent:string,scratch:string){assert.equal(await realpath(scratch),scratch);assertScratchChild(await realpath(parent),scratch);}
test('scratch evidence containment rejects sibling prefixes and traversal',()=>{
 const parent='C:\\Users\\runneradmin\\AppData\\Local\\Temp\\cat-stream-safe';
 assertScratchChild(parent,`${parent}\\.stream-build-evidence`,path.win32);
 for(const scratch of [parent,`${parent}-sibling\\.stream-build-evidence`,`${parent}\\..\\.stream-build-evidence`,`${parent}\\nested\\.stream-build-evidence`,'D:\\.stream-build-evidence'])assert.throws(()=>assertScratchChild(parent,scratch,path.win32),scratch);
});
test('stream sorting over several merge levels matches the array root and exact leaf pointers',async(t)=>{
 const rows=Array.from({length:37},(_,i)=>row(37-i)),d=await dir();
 const built=await buildStreamedCatalogue(input(rows),d,opts);
 const old=await buildGlobalCatalogue({catalogueRevision:'test-v1',candidates:rows,regions:[region],footprints:[fp]},await dir(),opts);
 assert.deepEqual(built.root,old.root);
 const files=await loadCatalogueFiles(built.path,{expectedSha256:built.sha256});
 for(const tree of ['id','membership'] as const)for await(const page of files.walk(tree)){
  if(page.kind==='ids'||page.kind==='memberships')for(const entry of page.rows){const leaf=await files.readPage(entry.page!);assert.equal(leaf.kind,'candidates');if(leaf.kind==='candidates')assert.ok(leaf.rows.some(r=>r.placeId===('placeId'in entry?entry.placeId:entry.key)));}
 }
 assert.ok(built.stats.maxBufferedRows<=opts.chunkRows+opts.maxRows+opts.mergeFanIn+opts.fanout);
 assert.ok(built.stats.maxOpenSortReaders<=opts.mergeFanIn);assert.ok(built.stats.mergeLevels>=3);
 t.diagnostic(JSON.stringify(built.stats));
 const other=await buildStreamedCatalogue(input(rows.reverse()),await dir(),{...opts,chunkRows:7,mergeFanIn:3});assert.deepEqual(other.root,built.root);
});
test('identical duplicates across chunks collapse and conflicting identities retain failure evidence',async()=>{
 const d=await dir(),rows=[row(1),row(2),row(1)];
 const built=await buildStreamedCatalogue(input(rows),d,{...opts,chunkRows:1});
 const old=await buildGlobalCatalogue({catalogueRevision:'test-v1',candidates:rows,regions:[region],footprints:[fp]},await dir(),opts);assert.deepEqual(built.root,old.root);
 await assert.rejects(buildStreamedCatalogue(input([row(1),row(2),{...row(1),name:'Conflict'}]),d,{...opts,chunkRows:1}),/conflict/i);
 assert.deepEqual(JSON.parse(await readFile(built.path,'utf8')),built.root);assert.equal((await readdir(d)).filter(n=>n.startsWith('catalogue-')).length,1);
 assert.ok((await readdir(d)).some(n=>n.startsWith('.stream-build-')));
});
test('empty candidate input retains admitted footprint and rejects malformed input before a root',async()=>{
 const built=await buildStreamedCatalogue(input([]),await dir(),opts);assert.equal(built.root.trees.footprints.rows,1);
 for(const patch of [{candidates:stream([{...row(1),catalogueRevision:'wrong'}])},{candidates:stream([{...row(1),regionIds:['region:v1:missing']}])},{footprints:stream([{...fp,geometryBasis:'polygon'}])},{catalogueRevision:'../bad'}]){
 const d=await dir();await assert.rejects(buildStreamedCatalogue({...input(),...patch} as any,d,opts));assert.equal((await readdir(d)).filter(n=>n.startsWith('catalogue-')).length,0);
 }
});
test('row metadata byte scratch output and deadline caps stop and do not publish roots',async()=>{
 for(const limit of [{maxInputRows:2},{maxMetadataRows:1},{maxInputBytes:100},{maxScratchBytes:100},{maxOutputBytes:100}]){const d=await dir();await assert.rejects(buildStreamedCatalogue(input(),d,{...opts,...limit}),/limit/i);assert.equal((await readdir(d)).filter(n=>n.startsWith('catalogue-')).length,0);}
 const d=await dir();const never={async *[Symbol.asyncIterator](){await new Promise(()=>{});yield row(1);}};
 const start=Date.now();await assert.rejects(buildStreamedCatalogue({...input(),candidates:never},d,{...opts,timeoutMs:30}),/deadline/i);assert.ok(Date.now()-start<1000);
 assert.equal((await readdir(d)).filter(n=>n.startsWith('catalogue-')).length,0);
});
test('failed builds expose byte accounting and their verified evidence child',async()=>{
 const d=await dir();let failure:any;try{await buildStreamedCatalogue(input(),d,{...opts,maxScratchBytes:100});}catch(error){failure=error;}
 assert.ok(failure.stats);assert.ok(failure.stats.inputBytes>0);assert.ok(failure.stats.scratchBytes<=100);await assertEvidenceChild(d,failure.scratchDir);assert.ok((await readdir(failure.scratchDir)).length>0);
});
test('streamed catalogue serves exact named, ID and regional queries',async()=>{
 const built=await buildStreamedCatalogue(input([row(3),row(1),row(2)]),await dir(),{...opts,maxRows:2});
 const files=await loadCatalogueFiles(built.path,{expectedSha256:built.sha256});
 const {createGlobalCatalogue}=await import('../../server/places/globalCatalogue');
 const {GeoNamesPlaceIndex}=await import('../../server/places/geonames');
 const {discoveryScopeSchema}=await import('../../shared/nightsky/discovery');
 const cat=createGlobalCatalogue(files,{cities:new GeoNamesPlaceIndex([],'test')});
 assert.equal((await cat.details({placeId:'place:v1:osm:node:2',catalogueRevision:'test-v1'}))?.latitude,.02);
 assert.deepEqual((await cat.findNames({placeQuery:'Park 2'})).map(r=>r.placeId),['place:v1:osm:node:2']);
 const result=await cat.search(discoveryScopeSchema.parse({includeRegionIds:['region:v1:A']}),{limit:10});
 assert.deepEqual(result.candidates.map(r=>r.placeId),['place:v1:osm:node:3','place:v1:osm:node:2','place:v1:osm:node:1']);assert.equal(result.discoveryCoverage.searchCompleteness,'complete');
});
test('invalid build settings and duplicate metadata cannot publish a root',async()=>{
 for(const patch of [{chunkRows:10001},{mergeFanIn:1},{maxInputRows:10000001},{maxScratchBytes:10*1024**3+1},{timeoutMs:1800001}])await assert.rejects(buildStreamedCatalogue(input(),await dir(),{...opts,...patch}),/limit/i);
 for(const patch of [{regions:stream([region,region])},{footprints:stream([fp,fp])}]){const d=await dir();await assert.rejects(buildStreamedCatalogue({...input(),...patch},d,opts),/duplicate/i);assert.equal((await readdir(d)).filter(n=>n.startsWith('catalogue-')).length,0);}
});
test('validation failure requests source iterator cleanup without waiting for an uncooperative return',async()=>{
 let returned=false;const bad={ [Symbol.asyncIterator](){return {next:async()=>({done:false as const,value:{...row(1),catalogueRevision:'wrong'}}),return:()=>{returned=true;return new Promise<IteratorResult<ReturnType<typeof row>>>(()=>{});}};}};
 const start=Date.now();await assert.rejects(buildStreamedCatalogue({...input(),candidates:bad},await dir(),{...opts,maxInputRows:1,timeoutMs:100}),/limit|mismatch/i);assert.equal(returned,true);assert.ok(Date.now()-start<500);
});
test('escaped attribution cannot exceed actual serialized input admission',async()=>{
 const escaped={...row(1),sources:Array.from({length:4},()=>({...source,attribution:'\u0001'.repeat(500)}))};
 assert.ok(Buffer.byteLength(JSON.stringify(escaped))>8000);
 const d=await dir();await assert.rejects(buildStreamedCatalogue(input([escaped]),d,{...opts,maxInputBytes:8000}),/input byte limit/i);assert.equal((await readdir(d)).filter(n=>n.startsWith('catalogue-')).length,0);
 const mixture={...row(1),name:'Park "\\ \u0001 \ud800 é 💫'};
 const built=await buildStreamedCatalogue(input([mixture]),await dir(),opts);
 assert.ok(built.stats.inputBytes>=Buffer.byteLength(JSON.stringify(mixture))+Buffer.byteLength(JSON.stringify(region))+Buffer.byteLength(JSON.stringify(fp)));
});
test('existing internal and external link ancestors reject before creating descendant directories',async()=>{
 const {mkdir,symlink,lstat}=await import('node:fs/promises');
 for(const external of [false,true]){
  const d=await dir(),target=external?await dir():join(d,'real');if(!external)await mkdir(target);
  const link=join(d,'linked');await symlink(target,link,process.platform==='win32'?'junction':'dir');
  await assert.rejects(buildStreamedCatalogue(input(),join(link,'new','output'),opts),/symlink/i);
  await assert.rejects(lstat(join(target,'new')),{code:'ENOENT'});assert.deepEqual(await readdir(target),[]);
 }
});
test('unknown footprint region IDs reject before root publication',async()=>{
 const d=await dir();await assert.rejects(buildStreamedCatalogue({...input(),footprints:stream([{...fp,regionIds:['region:v1:missing']}])},d,opts),/unknown.*region/i);assert.equal((await readdir(d)).filter(n=>n.startsWith('catalogue-')).length,0);
});
test('pages setup failure after scratch creation exposes retained failure metadata',async()=>{
 const {symlink}=await import('node:fs/promises');const d=await dir(),target=await dir();await symlink(target,join(d,'pages'),process.platform==='win32'?'junction':'dir');
 let failure:any;try{await buildStreamedCatalogue(input(),d,opts);}catch(error){failure=error;}
 assert.match(failure.message,/symlink/i);assert.ok(failure.stats);await assertEvidenceChild(d,failure.scratchDir);assert.deepEqual(await readdir(failure.scratchDir),[]);assert.deepEqual(await readdir(target),[]);
});
