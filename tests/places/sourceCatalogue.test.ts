import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {buildSourceCatalogue,jsonlRows} from '../../scripts/osm/build-source-catalogue';
import * as sourceCatalogue from '../../scripts/osm/build-source-catalogue';
import {loadCatalogueFiles} from '../../server/places/catalogueFiles';
const dir=()=>mkdtemp(join(tmpdir(),'source-catalogue-'));
const source={name:'OSM',url:'https://openstreetmap.org',attribution:'OSM contributors',dataClass:'catalog' as const};
const row={placeId:'place:v1:osm:node:1',name:'Park',category:'park',latitude:10,longitude:20,accessEvidence:{status:'unknown'},sources:[source],caveats:[],catalogueRevision:'test-v1',sourceCompleteness:1,regionIds:[]};
async function fixture(){const d=await dir(),data=JSON.stringify(row)+'\n';await writeFile(join(d,'candidates.jsonl'),data);const pin={bytes:Buffer.byteLength(data),sha256:createHash('sha256').update(data).digest('hex')};await writeFile(join(d,'complete.json'),JSON.stringify({schemaVersion:1,catalogueRevision:'test-v1',files:{'candidates.jsonl':pin}}));return d;}
test('source stream feeds immutable reader and never infers clipping coverage',async()=>{
 const d=await fixture(),regions=join(d,'regions.jsonl'),footprints=join(d,'footprints.jsonl');await writeFile(regions,'');await writeFile(footprints,'');
 const result=await buildSourceCatalogue({producerDir:d,regions,footprints},join(await dir(),'edition'));
 const files=await loadCatalogueFiles(result.path,{expectedSha256:result.sha256});
 let count=0;for await(const page of files.walk('spatial'))if(page.kind==='candidates'){assert.equal(page.rows[0].placeId,row.placeId);count+=page.rows.length;}
 assert.equal(count,1);assert.equal(files.root.trees.footprints.rows,0);
});
test('source digest, invalid metadata, row cap and abort reject',async()=>{
 const d=await fixture(),regions=join(d,'regions.jsonl'),footprints=join(d,'footprints.jsonl');await writeFile(regions,'');await writeFile(footprints,JSON.stringify({geometryBasis:'clip-bounds'})+'\n');
 await assert.rejects(buildSourceCatalogue({producerDir:d,regions,footprints},join(await dir(),'edition')));
 await writeFile(footprints,'');await writeFile(join(d,'candidates.jsonl'),(await readFile(join(d,'candidates.jsonl'),'utf8')).replace('Park','Changed'));
 await assert.rejects(buildSourceCatalogue({producerDir:d,regions,footprints},join(await dir(),'edition')),/digest|size/i);
 await assert.rejects(async()=>{for await(const r of jsonlRows(join(d,'candidates.jsonl'),{maxRowBytes:10,maxBytes:10000,maxRows:10}))void r;},/row/i);
 const controller=new AbortController();controller.abort();await assert.rejects(async()=>{for await(const r of jsonlRows(regions,{signal:controller.signal}))void r;},/abort/i);
});

test('strict pinned build configuration validates limits before output creation',async()=>{
 const {loadBuildConfig}=await import('../../scripts/osm/source-build-config');
 const d=await dir(),path=join(d,'build.json');
 const value={schemaVersion:1,catalogueRevision:'test-v1',stream:{maxRows:1},catalogue:{timeoutMs:1800001},files:{}};
 const body=JSON.stringify(value);await writeFile(path,body);
 await assert.rejects(loadBuildConfig(path,createHash('sha256').update(body).digest('hex')),/timeoutMs/);
});

test('pinned config reaches real CLI and preserves immutable publication',async()=>{
 const {execFileSync}=await import('node:child_process');const {existsSync}=await import('node:fs');
 const d=await fixture(),regions=join(d,'regions.jsonl'),footprints=join(d,'footprints.jsonl'),output=join(d,'edition'),path=join(d,'build.json');
 await writeFile(regions,'');await writeFile(footprints,'');
 const empty={bytes:0,sha256:createHash('sha256').update('').digest('hex')};
 const config={schemaVersion:1,catalogueRevision:'test-v1',stream:{maxRows:1,maxBytes:10000,maxRowBytes:1000},catalogue:{chunkRows:1,maxInputRows:1,timeoutMs:5000},files:{regions:empty,footprints:empty}};
 async function run(value:unknown){const body=JSON.stringify(value);await writeFile(path,body);return ()=>execFileSync(process.execPath,['--import','tsx','scripts/osm/build-source-catalogue.ts',d,regions,footprints,output,'--config',path,createHash('sha256').update(body).digest('hex')],{stdio:'pipe'});}
 for(const value of [{...config,command:['anything']},{...config,catalogue:{timeoutMs:1800001}},{...config,stream:{maxRows:0}},{...config,stream:{maxBytes:1}},{...config,stream:{maxRowBytes:1}},{...config,catalogueRevision:'different'},{...config,files:{regions:{...empty,sha256:'a'.repeat(64)},footprints:empty}}]){assert.throws(await run(value));assert.equal(existsSync(output),false);}
 const execute=await run(config);execute();assert.equal(existsSync(output),true);assert.throws(execute);
});

test('config mutation, unknown options and lexical output traversal fail closed',async()=>{
 const {loadBuildConfig}=await import('../../scripts/osm/source-build-config');const {existsSync}=await import('node:fs');
 const d=await fixture(),regions=join(d,'r'),footprints=join(d,'f'),path=join(d,'config');await writeFile(regions,'');await writeFile(footprints,'');await writeFile(path,'{}');
 await assert.rejects(loadBuildConfig(path,'0'.repeat(64)),/digest/);
 const output=join(d,'edition');await assert.rejects(buildSourceCatalogue({producerDir:d,regions,footprints},output,{evil:1} as never));assert.equal(existsSync(output),false);
 await assert.rejects(buildSourceCatalogue({producerDir:d,regions,footprints},d+'/../escape'),/traversal/i);
});


test('shared pinned JSON number spellings run the actual bridge and reject nonintegers',async()=>{
 const {loadBuildConfig}=await import('../../scripts/osm/source-build-config');const {execFileSync}=await import('node:child_process');
 const original=await readFile(new URL('../osm/source-build-controls-numbers.json',import.meta.url),'utf8');
 const d=await fixture(),regions=join(d,'r'),footprints=join(d,'f'),path=join(d,'build.json');await writeFile(regions,'');await writeFile(footprints,'');await writeFile(path,original);
 const sha=createHash('sha256').update(original).digest('hex'),config=await loadBuildConfig(path,sha);
 assert.equal(config.schemaVersion,1);assert.equal(config.stream.maxRowBytes,1000);assert.equal(config.files.regions.bytes,0);
 execFileSync(process.execPath,['--import','tsx','scripts/osm/build-source-catalogue.ts',d,regions,footprints,join(d,'edition'),'--config',path,sha],{stdio:'pipe'});
 for(const token of ['true','1.5','9007199254740992','1e400','NaN','Infinity','-Infinity'])for(const field of ['"schemaVersion":1.0','"chunkRows":1.0','"bytes":0.0']){
  const body=original.replace(field,field.split(':')[0]+':'+token);await writeFile(path,body);
  await assert.rejects(loadBuildConfig(path,createHash('sha256').update(body).digest('hex')));
 }
});

async function partitionedSourceFixture(){
 const d=await dir();await (await import('node:fs/promises')).mkdir(join(d,'parts'));
 const rows=[row,{...row,placeId:'place:v1:osm:node:2',name:'Second park'}];
 const parts=[];let bytes=0;const hash=createHash('sha256');
 for(const [ordinal,value] of rows.entries()){
  const body=JSON.stringify(value)+'\n',path=`parts/candidates-${String(ordinal).padStart(5,'0')}.jsonl`;
  await writeFile(join(d,path),body);hash.update(body);const size=Buffer.byteLength(body);bytes+=size;
  parts.push({ordinal,path,bytes:size,sha256:createHash('sha256').update(body).digest('hex'),firstRow:ordinal,rows:1,firstKey:[value.placeId],lastKey:[value.placeId]});
 }
 const empty={bytes:0,sha256:createHash('sha256').update('').digest('hex')},emptyFamily={...empty,rows:0,parts:[]};
 const family={bytes,rows:2,sha256:hash.digest('hex'),parts};
 const boundary={path:'boundaries.json',bytes:2,sha256:createHash('sha256').update('{}').digest('hex')};
 const regions=join(d,'regions.jsonl'),footprints=join(d,'footprints.jsonl');await writeFile(regions,'');await writeFile(footprints,'');
 const done:any={schemaVersion:2,kind:'partitioned-membership-v1',catalogueRevision:'test-v1',streams:{candidates:family},files:{'regions.jsonl':empty,'footprints.jsonl':empty},totalCandidates:2,unknownCountryCandidates:2,producerDescriptorSha256:'a'.repeat(64),planSha256:'b'.repeat(64),inputIdentity:{rawStreams:{candidates:family,lineage:emptyFamily,exclusions:emptyFamily},counts:{accepted:2,lineage:2,exclusions:0,selectedOccurrences:2,acceptedOccurrences:2,duplicateAcceptedOccurrences:0,sources:[{id:'fixture',selected:2,accepted:2,excluded:0,lineage:2}]},boundaryPins:[{...boundary,path:join(d,boundary.path)}],footprintPin:{...empty,path:footprints}},boundaryInput:[{input:boundary,regionIds:[]}],resources:{rows:2,work:100,outputBytes:0,elapsedMilliseconds:10},coverage:'unknown; administrative boundaries do not establish candidate source coverage',membershipPolicy:'unique-strict-interior; conflicting claims rejected; missing or ambiguous membership unknown'};
 const expectedMembershipPin={path:join(d,'complete.json'),bytes:0,sha256:''};
 async function save(refreshTrustedPin=true){let body='';for(let i=0;i<10;i++){body=JSON.stringify(done)+'\n';const total=done.streams.candidates.bytes+done.files['regions.jsonl'].bytes+done.files['footprints.jsonl'].bytes+Buffer.byteLength(body);if(done.resources.outputBytes===total)break;done.resources.outputBytes=total;}if(refreshTrustedPin)Object.assign(expectedMembershipPin,{bytes:Buffer.byteLength(body),sha256:createHash('sha256').update(body).digest('hex')});await writeFile(join(d,'complete.json'),body);}
 await save();
 const partitionBudget={bytes:0,rows:0,work:0,maxBytes:16*1024**2,maxRows:100000,maxWork:1000000,deadline:Date.now()+60000};
 return {d,done,save,rows,input:{producerDir:d,regions,footprints,expectedCandidates:2,partitionBudget,expectedMembershipPin}};
}
test('partitioned membership feeds both parts to one unchanged consumer root',async()=>{
 const f=await partitionedSourceFixture(),result=await buildSourceCatalogue(f.input,join(f.d,'edition'));
 assert.equal(result.stats.inputRows,2);
 const files=await loadCatalogueFiles(result.path,{expectedSha256:result.sha256}),ids=[];
 for await(const page of files.walk('spatial'))if(page.kind==='candidates')ids.push(...page.rows.map(r=>r.placeId));
 assert.deepEqual(ids,['place:v1:osm:node:1','place:v1:osm:node:2']);assert.equal(files.root.trees.footprints.rows,0);
});
test('partitioned bridge refuses repeated IDs, omitted rows and missing invocation budget before output',async()=>{
 const {existsSync}=await import('node:fs');
 for(const mode of ['duplicate','count','budget','extra']){
  const f=await partitionedSourceFixture(),output=join(f.d,'edition');
  if(mode==='duplicate'){
   const body=JSON.stringify(row)+'\n',part=f.done.streams.candidates.parts[1];await writeFile(join(f.d,part.path),body);part.bytes=Buffer.byteLength(body);part.sha256=createHash('sha256').update(body).digest('hex');part.firstKey=part.lastKey=[row.placeId];
  }
  if(mode==='count')f.input.expectedCandidates=3;
  if(mode==='budget')delete (f.input as any).partitionBudget;
  if(mode==='extra')await writeFile(join(f.d,'parts','candidates-00002.jsonl'),'{}\n');
  await f.save();await assert.rejects(buildSourceCatalogue(f.input,output));assert.equal(existsSync(output),false);
 }
});
test('partitioned source mutations after precheck and global second-part row exhaustion reject',async()=>{
 const {existsSync,writeFileSync}=await import('node:fs');
 for(const mode of ['mutation','rows','metadata']){
  const f=await partitionedSourceFixture(),output=join(f.d,'edition');let changed=false;
  if(mode==='rows')f.input.partitionBudget.maxRows=1;
  else f.input.partitionBudget.signal={throwIfAborted(){if(!changed&&existsSync(output)){changed=true;writeFileSync(mode==='metadata'?f.input.regions:join(f.d,f.done.streams.candidates.parts[1].path),'changed\n');}}} as AbortSignal;
  await assert.rejects(buildSourceCatalogue(f.input,output));if(mode!=='rows')assert.equal(changed,true);
 }
});
test('partitioned bridge preserves configured physical row and global stream limits',async()=>{
 const {existsSync}=await import('node:fs');
 for(const mode of ['row','bytes','rows']){
  const f=await partitionedSourceFixture(),output=join(f.d,'edition');
  const constrained=mode==='row'?{...f.input,maxRowBytes:10}:mode==='bytes'?{...f.input,maxBytes:1}:{...f.input,maxRows:1};
  await assert.rejects(buildSourceCatalogue(constrained,output),/row|byte|budget|limit/i);assert.equal(existsSync(output),false);
 }
});
test('partitioned common metadata keeps the configured stream byte ceiling',async()=>{
 const f=await partitionedSourceFixture(),output=join(f.d,'edition'),{existsSync}=await import('node:fs');
 const regions=Array.from({length:10},(_,i)=>({regionId:`region:v1:metadata-${i}`,name:'Long region name '.repeat(8),countryCode:'IND',adminLevel:0,boundaryRevision:'fixture',sources:[source]}));
 const body=regions.map(value=>JSON.stringify(value)+'\n').join('');await writeFile(f.input.regions,body);
 f.done.files['regions.jsonl']={bytes:Buffer.byteLength(body),sha256:createHash('sha256').update(body).digest('hex')};await f.save();
 await assert.rejects(buildSourceCatalogue({...f.input,maxBytes:f.done.streams.candidates.bytes+1},output),/byte|size|limit/i);assert.equal(existsSync(output),false);
});
test('a physical root from a late metadata failure is never returned as an accepted build',async()=>{
 const f=await partitionedSourceFixture(),output=join(f.d,'edition'),{existsSync,readdirSync,writeFileSync}=await import('node:fs');let changed=false;
 f.input.partitionBudget.signal={throwIfAborted(){if(!changed&&existsSync(output)&&readdirSync(output).some(name=>name.startsWith('catalogue-'))){changed=true;writeFileSync(f.input.regions,'changed\n');}}} as AbortSignal;
 await assert.rejects(buildSourceCatalogue(f.input,output));assert.equal(changed,true);assert.ok(readdirSync(output).some(name=>name.startsWith('catalogue-')));
});
test('legacy library descriptor aliases retain their existing behavior',async()=>{
 const d=await fixture(),regions=join(d,'regions.jsonl'),footprints=join(d,'footprints.jsonl');await writeFile(regions,'');await writeFile(footprints,'');
 await (await import('node:fs/promises')).link(join(d,'complete.json'),join(d,'legacy-descriptor-alias.json'));
 const result=await buildSourceCatalogue({producerDir:d,regions,footprints},join(d,'edition'));assert.equal(result.stats.inputRows,1);
});
test('fully repinned candidate substitution cannot replace the freshly classified membership result',async()=>{
 const f=await partitionedSourceFixture(),output=join(f.d,'edition'),{existsSync}=await import('node:fs');
 const originalPin={...f.input.expectedMembershipPin},mutant={...f.rows[0],name:'Fake',latitude:11,longitude:21};
 const body=JSON.stringify(mutant)+'\n',part=f.done.streams.candidates.parts[0];await writeFile(join(f.d,part.path),body);
 part.bytes=Buffer.byteLength(body);part.sha256=createHash('sha256').update(body).digest('hex');
 const hash=createHash('sha256');let bytes=0;for(const pin of f.done.streams.candidates.parts){const content=await readFile(join(f.d,pin.path));hash.update(content);bytes+=content.length;}
 f.done.streams.candidates.bytes=bytes;f.done.streams.candidates.sha256=hash.digest('hex');await f.save(false);
 assert.deepEqual(f.input.expectedMembershipPin,originalPin);
 await assert.rejects(buildSourceCatalogue(f.input,output),/membership.*pin|membership.*identity|classified.*digest/i);assert.equal(existsSync(output),false);
});
test('partitioned bridge requires the exact bounded classified membership pin',async()=>{
 const {existsSync}=await import('node:fs');
 for(const mode of ['missing','path','bytes','sha']){
  const f=await partitionedSourceFixture(),output=join(f.d,'edition');
  if(mode==='missing')delete (f.input as any).expectedMembershipPin;
  if(mode==='path')f.input.expectedMembershipPin.path=f.input.regions;
  if(mode==='bytes')f.input.expectedMembershipPin.bytes=1024**2+1;
  if(mode==='sha')f.input.expectedMembershipPin.sha256='0'.repeat(64);
  await assert.rejects(buildSourceCatalogue(f.input,output));assert.equal(existsSync(output),false);
 }
});
test('a trusted partitioned membership result cannot downgrade to a valid legacy descriptor',async()=>{
 const f=await partitionedSourceFixture(),output=join(f.d,'edition'),{existsSync}=await import('node:fs');
 const rows=[{...f.rows[0],name:'Fake',latitude:11,longitude:21},f.rows[1]],body=rows.map(value=>JSON.stringify(value)+'\n').join('');
 await writeFile(join(f.d,'candidates.jsonl'),body);
 await writeFile(join(f.d,'complete.json'),JSON.stringify({schemaVersion:1,catalogueRevision:'test-v1',files:{'candidates.jsonl':{bytes:Buffer.byteLength(body),sha256:createHash('sha256').update(body).digest('hex')}}}));
 await assert.rejects(buildSourceCatalogue(f.input,output),/membership.*pin|membership.*version|classified.*digest/i);assert.equal(existsSync(output),false);
});
test('the captured partition verifier rejects parts or common metadata changed after bridge return',async()=>{
 for(const mode of ['part','regions']){
  const f=await partitionedSourceFixture();let verify:(()=>Promise<void>)|undefined;
  await buildSourceCatalogue({...f.input,capturePartitionedVerifier(value:()=>Promise<void>){verify=value;}},join(f.d,'edition'));
  assert.ok(verify,'The admitted wrapper needs the complete retained-input verifier');
  await writeFile(mode==='part'?join(f.d,f.done.streams.candidates.parts[0].path):f.input.regions,'changed\n');
  await assert.rejects(verify());
 }
});
test('v3 completion supports explicit larger C and M with split units while v2 stays capped',async()=>{
 const f=await partitionedSourceFixture(),count=1000001,start=Date.now();
 const done={...f.done,schemaVersion:3,limits:{maxRows:count,maxOutputBytes:2*1024**3,maxGeometryComparisons:200000000},totalCandidates:count,unknownCountryCandidates:count,
  streams:{candidates:{...f.done.streams.candidates,rows:count}},inputIdentity:{...f.done.inputIdentity,counts:{...f.done.inputIdentity.counts,accepted:count}},
  resources:{rows:count,outputBytes:1024**3+1,startedAt:start,deadline:start+60000,elapsedMilliseconds:1,validation:{readBytes:1000000000,rowsRead:count,lexicalTokens:719000000,operations:1000,controlAndAdmissionReadBytes:100},geometry:{comparisons:100},writes:{'boundary-staging':{bytes:0,rows:0},membership:{bytes:1024**3+1,rows:count},assembly:{bytes:0,rows:0},'publisher-output':{bytes:0,rows:0},'publisher-scratch':{bytes:0,rows:0}}}};
 // This checks the representation envelope only; iterators still have to prove every actual row at EOF.
 assert.equal((sourceCatalogue as any).partitionedMembershipCompletionV3Schema.safeParse(done).success,true);
 assert.equal(sourceCatalogue.partitionedMembershipCompletionSchema.safeParse({...done,schemaVersion:2}).success,false);
 assert.equal((sourceCatalogue as any).partitionedMembershipCompletionV3Schema.safeParse({...done,resources:{...done.resources,work:1}}).success,false);
 assert.equal((sourceCatalogue as any).partitionedMembershipCompletionV3Schema.safeParse({...done,resources:{...done.resources,geometry:{comparisons:200000001}}}).success,false);
});

async function v3SourceFixture(){
 const f=await partitionedSourceFixture(),r=await import('../../scripts/osm/partitioned-resources');
 const session=r.createResourceSessionV3({validation:{maxLexicalTokens:1000000,maxOperations:1000000,maxReadBytes:16*1024**2,maxRowsRead:100000,controlAndAdmissionReadBytes:1024**2},maxGeometryComparisons:200000000,maxMilliseconds:60000},r.createBootstrapResources(Date.now()));
 const snapshot=r.resourceSnapshotV3(session);
 Object.assign(f.done,{schemaVersion:3,limits:{maxRows:1000001,maxOutputBytes:2*1024**3,maxGeometryComparisons:200000000},resources:{rows:2,outputBytes:0,...snapshot}});
 // The fixture represents the freshly returned classifier metadata, not a disk-derived trust pin.
 f.done.resources.writes.membership.rows=2;
 for(let i=0;i<16;i++){await f.save();if(f.done.resources.writes.membership.bytes===f.done.resources.outputBytes)break;f.done.resources.writes.membership.bytes=f.done.resources.outputBytes;}
 await f.save();r.recordWrite(session,'membership',f.done.resources.outputBytes,2);
 return {...f,session,input:{...f.input,maxRows:1000001,maxBytes:2*1024**3,expectedMembershipVersion:3 as const,resourceSession:session,partitionBudget:{...f.input.partitionBudget,maxWork:session.limits.validation.maxOperations,deadline:session.deadline,resourceSession:session,accounting:'read' as const,metadata:session.metadata}}};
}
test('v3 bridge preserves the original session through publication and captured verification',async()=>{
 const f=await v3SourceFixture();let verify:(()=>Promise<void>)|undefined;
 const result=await buildSourceCatalogue({...f.input,capturePartitionedVerifier(v){verify=v;}},join(f.d,'edition'),{maxInputRows:1000001,maxInputBytes:2*1024**3});
 assert.equal(result.stats.inputRows,2);assert.ok(verify);const before=f.session.validation.readBytes;await verify();assert.ok(f.session.validation.readBytes>before);
 assert.equal(f.input.partitionBudget.deadline,f.session.deadline);assert.equal(f.session.geometry.comparisons,0);
 assert.equal(f.session.writes['publisher-output'].bytes,result.stats.outputBytes);assert.equal(f.session.writes['publisher-scratch'].bytes,result.stats.scratchBytes);
 assert.ok(f.session.validation.lexicalTokens>0);
});
test('v3 bridge rejects downgraded versions, replaced sessions and undersized publisher allocations before output',async()=>{
 const {existsSync}=await import('node:fs');
 for(const mode of ['version','session','missing-pin','stream','publisher-bytes','publisher-rows']){
  const f=await v3SourceFixture(),output=join(f.d,'edition');let input:any=f.input;const options:any={maxInputRows:1000001,maxInputBytes:2*1024**3};
  if(mode==='version')input={...input,expectedMembershipVersion:2};
  if(mode==='session')input={...input,resourceSession:undefined};
  if(mode==='missing-pin'){input={...input,expectedMembershipPin:undefined};await writeFile(join(f.d,'complete.json'),JSON.stringify({schemaVersion:1}));}
  if(mode==='stream')input={...input,maxBytes:10000};
  if(mode==='publisher-bytes')options.maxInputBytes=10000;
  if(mode==='publisher-rows')options.maxInputRows=2;
  await assert.rejects(buildSourceCatalogue(input,output,options));assert.equal(existsSync(output),false);
 }
});

test('scoped JSONL reads reserve control admission quota before IO and charge actual bytes once',async()=>{
 const r=await import('../../scripts/osm/partitioned-resources'),d=await dir(),path=join(d,'control.jsonl'),body='{"ok":true}\n';await writeFile(path,body);
 for(const exhausted of [true,false]){
  const q=Buffer.byteLength(body)+(exhausted?-1:1);
  const session=r.createResourceSessionV3({validation:{maxLexicalTokens:10000,maxOperations:10000,maxReadBytes:65536,maxRowsRead:1000,controlAndAdmissionReadBytes:q},maxGeometryComparisons:100,maxMilliseconds:60000},r.createBootstrapResources(Date.now()));
  const budget={bytes:0,rows:0,work:0,maxBytes:65536,maxRows:1000,maxWork:10000,deadline:session.deadline,resourceSession:session,accounting:'read' as const,metadata:session.metadata,readScope:'control-and-admission' as const};
  const read=async()=>{const rows=[];for await(const row of jsonlRows(path,{partitionBudget:budget}))rows.push(row);return rows;};
  if(exhausted){await assert.rejects(read(),/control and admission read byte limit/i);assert.equal(session.validation.readBytes,0);assert.equal(session.validation.controlAndAdmissionReadBytes,0);assert.equal(budget.bytes,0);}
  else{assert.deepEqual(await read(),[{ok:true}]);assert.equal(session.validation.readBytes,Buffer.byteLength(body));assert.equal(session.validation.controlAndAdmissionReadBytes,Buffer.byteLength(body));assert.equal(budget.bytes,Buffer.byteLength(body));}
 }
});
