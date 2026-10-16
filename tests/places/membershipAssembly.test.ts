import {createBootstrapResources,createResourceSessionV3} from '../../scripts/osm/partitioned-resources';
import {partitionCanonical} from '../../scripts/osm/partitioned-candidates';
import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,access,rm,readdir,open,stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {assembleMembership,loadAssemblyPlan} from '../../scripts/osm/membership-assembly';
const roots:string[]=[];
after(async()=>{for(const root of roots)await rm(root,{recursive:true,force:true});});
const digest=(body:string)=>createHash('sha256').update(body).digest('hex');
async function fixture(){
 const root=await mkdtemp(join(tmpdir(),'assembly-'));roots.push(root);const producer=join(root,'producer'),job=join(root,'job');await mkdir(producer);await mkdir(job);
 const source={name:'Synthetic',url:'https://example.org',attribution:'Synthetic',dataClass:'catalog'};
 const rows=[{placeId:'place:v1:osm:node:1',name:'Park',category:'park',latitude:1,longitude:1,accessEvidence:{status:'unknown'},sources:[source],caveats:[],catalogueRevision:'fixture',sourceCompleteness:1,regionIds:[]},{placeId:'place:v1:osm:node:2',name:'Away',category:'park',latitude:20,longitude:20,accessEvidence:{status:'unknown'},sources:[source],caveats:[],catalogueRevision:'fixture',sourceCompleteness:1,regionIds:[]}];
 const data=rows.map(r=>JSON.stringify(r)+'\n').join('');await writeFile(join(producer,'candidates.jsonl'),data);await writeFile(join(producer,'complete.json'),JSON.stringify({schemaVersion:1,catalogueRevision:'fixture',files:{'candidates.jsonl':{bytes:Buffer.byteLength(data),sha256:digest(data)},'lineage.jsonl':{bytes:0,sha256:digest('')},'exclusions.jsonl':{bytes:0,sha256:digest('')}}}));
 await writeFile(join(producer,'lineage.jsonl'),'');await writeFile(join(producer,'exclusions.jsonl'),'');
 const boundary=JSON.stringify({type:'FeatureCollection',features:[{type:'Feature',properties:{regionId:'region:v1:country',name:'Country',countryCode:'IND',adminLevel:0,boundaryRevision:'fixture',sources:[source]},geometry:{type:'Polygon',coordinates:[[[0,0],[2,0],[2,2],[0,2],[0,0]]]}}]});await writeFile(join(root,'boundary.json'),boundary);await writeFile(join(root,'footprints.jsonl'),'');
 const plan={schemaVersion:1,boundaries:[{input:{path:join(root,'boundary.json'),bytes:Buffer.byteLength(boundary),sha256:digest(boundary)},regionIds:['region:v1:country']}],footprints:{path:join(root,'footprints.jsonl'),bytes:0,sha256:digest('')},membership:{},stream:{},catalogue:{},retained:[]};
 const path=join(root,'plan.json');async function save(){const body=JSON.stringify(plan);await writeFile(path,body);return digest(body);}return {root,job,producer,rows,plan,path,save};
}
test('assembly preserves all candidate facts and unknown membership while publishing immutable pages',async()=>{
 const f=await fixture(),evidence=await assembleMembership(f.path,await f.save(),f.producer,f.job);
 const rows=(await readFile(join(f.job,'membership','candidates.jsonl'),'utf8')).trim().split('\n').map(x=>JSON.parse(x));
 assert.deepEqual(rows,[{...f.rows[0],countryCode:'IND',regionIds:['region:v1:country']},f.rows[1]]);assert.equal(evidence.membership.unknownCountryCandidates,1);assert.match(evidence.sourceCoverage,/unknown/);
 assert.ok((await readdir(join(f.job,'catalogue'))).some(x=>/^catalogue-/.test(x)));await assert.rejects(assembleMembership(f.path,await f.save(),f.producer,f.job),/exist/i);
});
test('changed boundary pin, source stream and bounded membership never create assembly completion',async()=>{
 for(const mode of ['boundary','candidate','budget']){
  const f=await fixture();if(mode==='boundary')await writeFile(f.plan.boundaries[0].input.path,'{}');if(mode==='candidate')await writeFile(join(f.producer,'candidates.jsonl'),'{}\n');if(mode==='budget')Object.assign(f.plan.membership,{maxComparisons:1});
  await assert.rejects(assembleMembership(f.path,await f.save(),f.producer,f.job));await assert.rejects(access(join(f.job,'assembly-complete.json')));await assert.rejects(access(join(f.job,'catalogue')));
 }
});
test('strict plan rejects arbitrary controls and independent digest mismatch',async()=>{
 const f=await fixture();await f.save();await assert.rejects(loadAssemblyPlan(f.path,'0'.repeat(64)),/digest/);Object.assign(f.plan.membership,{command:'bad'});await assert.rejects(loadAssemblyPlan(f.path,await f.save()));
});

test('tampered retained lineage or exclusion evidence blocks assembly',async()=>{
 for(const name of ['lineage.jsonl','exclusions.jsonl']){
  const f=await fixture();const done=JSON.parse(await readFile(join(f.producer,'complete.json'),'utf8'));done.files[name]={bytes:3,sha256:digest('{}\n')};await writeFile(join(f.producer,'complete.json'),JSON.stringify(done));await writeFile(join(f.producer,name),'[]\n');
  await assert.rejects(assembleMembership(f.path,await f.save(),f.producer,f.job),/digest/);await assert.rejects(access(join(f.job,'assembly-complete.json')));
 }
});

test('producer evidence cannot override paths or omit raw lineage',async()=>{
 for(const mode of ['override','missing']){
  const f=await fixture();const done=JSON.parse(await readFile(join(f.producer,'complete.json'),'utf8'));
  if(mode==='override')done.files['lineage.jsonl'].path=f.plan.footprints.path;else delete done.files['lineage.jsonl'];
  await writeFile(join(f.producer,'complete.json'),JSON.stringify(done));await assert.rejects(assembleMembership(f.path,await f.save(),f.producer,f.job));await assert.rejects(access(join(f.job,'assembly-complete.json')));
 }
});

test('selected geography mode is pinned and must match producer evidence',async()=>{
 const f=await fixture();Object.assign(f.plan,{geographyMode:'selected-references'});
 assert.equal((await loadAssemblyPlan(f.path,await f.save())).geographyMode,'selected-references');
 await assert.rejects(assembleMembership(f.path,await f.save(),f.producer,f.job),/geography mode/);
 await assert.rejects(access(join(f.job,'membership-input')));
 Object.assign(f.plan,{geographyMode:'automatic-fallback'});
 await assert.rejects(loadAssemblyPlan(f.path,await f.save()));
});
test('planet descriptor requires matching producer identity and rejects oversized evidence before staging',async()=>{
 const f=await fixture();const p={path:'evidence.json',bytes:1,sha256:digest('e')};const domain={schemaVersion:1,kind:'planet-domain-v1',sourceUrl:'https://example.org/fixture.osm',edition:'fixture',provider:'Synthetic',providerWholeWorldEvidence:p,providerObject:{version:'v1',etag:'etag',md5:'a'.repeat(32)},raw:{bytes:3,sha256:digest('raw')},nativeVintage:'2026-10-01T00:00:00Z',nativeVintageEvidence:p,domain:{west:-180,south:-90,east:180,north:90},selectionPolicy:'named-complete-way-v1-polar85',coverageClaim:'source-domain-only'};
 const linked=join(f.root,'nested');await mkdir(linked);await writeFile(join(linked,'evidence.json'),'e');const observation=JSON.stringify({schemaVersion:1,kind:'native-vintage-observation',raw:domain.raw,nativeVintage:domain.nativeVintage});await writeFile(join(linked,'native.json'),observation);domain.nativeVintageEvidence={path:'native.json',bytes:Buffer.byteLength(observation),sha256:digest(observation)};
 const body=JSON.stringify(domain),path=join(linked,'planet-domain.json');await writeFile(path,body);
 const sourceDomains=[{sourceId:'s0',kind:'planet-domain-v1',path,bytes:Buffer.byteLength(body),sha256:digest(body)}];Object.assign(f.plan,{sourceDomains});
 assert.equal((await loadAssemblyPlan(f.path,await f.save()) as any).sourceDomains.length,1);
 await writeFile(join(linked,'evidence.json'),'x');await assert.rejects(loadAssemblyPlan(f.path,await f.save()),/checksum|digest/);await writeFile(join(linked,'evidence.json'),'e');
 await rm(join(linked,'native.json'));await assert.rejects(loadAssemblyPlan(f.path,await f.save()),/ENOENT/);await writeFile(join(linked,'native.json'),observation);
 const wrong=observation.replace('2026-10-01','2026-10-02');await writeFile(join(linked,'native.json'),wrong);await assert.rejects(loadAssemblyPlan(f.path,await f.save()),/checksum|digest/);await writeFile(join(linked,'native.json'),observation);
 await writeFile(join(linked,'native.json'),wrong);domain.nativeVintageEvidence.sha256=digest(wrong);const mismatchedBody=JSON.stringify(domain);await writeFile(path,mismatchedBody);sourceDomains[0].sha256=digest(mismatchedBody);await assert.rejects(loadAssemblyPlan(f.path,await f.save()),/native vintage observation/);
 domain.nativeVintageEvidence.sha256=digest(observation);await writeFile(join(linked,'native.json'),observation);await writeFile(path,body);sourceDomains[0].sha256=digest(body);
 await assert.rejects(assembleMembership(f.path,await f.save(),f.producer,f.job),/planet domain/);await assert.rejects(access(join(f.job,'membership-input')));
 const done=JSON.parse(await readFile(join(f.producer,'complete.json'),'utf8'));done.sourceDomains=sourceDomains;done.files['lineage.jsonl'].bytes=128*1024**2+1;await writeFile(join(f.producer,'complete.json'),JSON.stringify(done));
 await assert.rejects(assembleMembership(f.path,await f.save(),f.producer,f.job));await assert.rejects(access(join(f.job,'membership-input')));
 done.files['lineage.jsonl'].bytes=0;await writeFile(join(f.producer,'complete.json'),JSON.stringify(done));
 const evidence=await assembleMembership(f.path,await f.save(),f.producer,f.job);assert.match(evidence.sourceCoverage,/unknown/);
});

test('each producer stream exceeding assembly pin capacity fails before staging',async()=>{
 for(const name of ['candidates.jsonl','lineage.jsonl','exclusions.jsonl']){
  const f=await fixture(),done=JSON.parse(await readFile(join(f.producer,'complete.json'),'utf8'));done.files[name].bytes=128*1024**2+1;
  await writeFile(join(f.producer,'complete.json'),JSON.stringify(done));await assert.rejects(assembleMembership(f.path,await f.save(),f.producer,f.job));await assert.rejects(access(join(f.job,'membership-input')));
 }
});


test('an unbound assembly primitive cannot consume an admitted producer completion',async()=>{
 const f=await fixture(),path=join(f.producer,'complete.json');
 const done=JSON.parse(await readFile(path,'utf8'));done.admissionSnapshotSha256='a'.repeat(64);await writeFile(path,JSON.stringify(done));
 await assert.rejects(assembleMembership(f.path,await f.save(),f.producer,f.job),/admission identity/);
 await assert.rejects(access(join(f.job,'membership-input')));
});

test('production assembly CLI refuses missing admission before processing a candidate plan',async()=>{
 const {spawnSync}=await import('node:child_process');const f=await fixture();
 const result=spawnSync(process.execPath,['--import','tsx','scripts/osm/membership-assembly.ts',f.path,await f.save(),f.producer,f.job],{encoding:'utf8',timeout:10000});
 assert.notEqual(result.status,0);assert.match(result.stderr,/Production admission/);
 await assert.rejects(access(join(f.job,'membership-input')));
});

// V2 uses a separate explicit aggregate/capacity contract; no data body is
// allocated for this plan-validation fixture.
async function partitionedPlanFixture(){
 const f=await fixture(),MiB=1024**2,GiB=1024**3;
 const capacity:any={schemaVersion:2,kind:'partitioned-geography-capacity-v1',freeBytes:16*GiB,reserveBytes:0,retainedBytes:0,rawSourceAlreadyRetainedBytes:0,
  allocations:{raw:1,index:MiB,journal:MiB,normalizedOutput:512*MiB,boundaries:MiB,stagedCandidates:0,stagedBoundaries:MiB,footprints:MiB,membership:MiB,sort:MiB,catalogue:MiB,failureReports:MiB,rollback:0},
  limits:{raw:{sourceBytes:1,scratchBytes:2*MiB,outputBytes:512*MiB,rowBytes:1024,nodes:10,candidates:10,referencesPerWay:10,seconds:30,freeBytes:0},
   membership:{maxCandidateInputBytes:512*MiB,maxBoundaryBytes:MiB,maxVertices:100000,maxTotalVertices:100000,maxComparisons:1000000,maxRows:10,maxOutputBytes:MiB,maxMilliseconds:1000},
   catalogue:{chunkRows:100,mergeFanIn:2,maxRows:10,fanout:8,maxInputRows:10,maxMetadataRows:10000,maxInputBytes:GiB,maxOutputBytes:MiB,maxScratchBytes:MiB,timeoutMs:1000},
   supervisor:{wallSeconds:60,rssBytes:256*MiB,commitBytes:512*MiB,diskBytes:GiB,freeBytes:0,maxProcesses:2}}};
 const capacityPath=join(f.root,'capacity.json');
 const plan:any=f.plan;plan.schemaVersion=2;
 plan.evidenceLayout={kind:'partitioned-jsonl-v1',maxPartBytes:128*MiB,maxParts:64};
 plan.maxNormalizedOutputBytes=512*MiB;plan.maxCandidateInputBytes=512*MiB;
 const {maxCandidateInputBytes,...membership}=capacity.limits.membership;
 plan.membership=membership;plan.catalogue=capacity.limits.catalogue;
 plan.stream={maxRowBytes:65536,maxBytes:MiB,maxRows:10};
 async function saveCapacity(){const body=JSON.stringify(capacity);await writeFile(capacityPath,body);plan.capacityPlan={path:capacityPath,bytes:Buffer.byteLength(body),sha256:digest(body)};}
 await saveCapacity();return {...f,plan,capacity,saveCapacity};
}
test('partitioned plan accepts an explicit larger logical aggregate with an exact capacity pin',async()=>{
 const f=await partitionedPlanFixture();
 const loaded:any=await loadAssemblyPlan(f.path,await f.save());
 assert.equal(loaded.schemaVersion,2);assert.equal(loaded.maxNormalizedOutputBytes,512*1024**2);
 assert.equal(loaded.maxCandidateInputBytes,512*1024**2);
});
test('partitioned plan refuses missing, changed or inconsistent aggregate capacity before staging',async()=>{
 for(const mode of ['missing','tampered','aggregate','candidate','unsafe','reserve']){
  const f=await partitionedPlanFixture();
  if(mode==='missing')delete f.plan.capacityPlan;
  if(mode==='tampered')await writeFile(f.plan.capacityPlan.path,'{}');
  if(mode==='aggregate')f.plan.maxNormalizedOutputBytes++;
  if(mode==='candidate')f.plan.maxCandidateInputBytes=f.plan.maxNormalizedOutputBytes+1;
  if(mode==='unsafe'){f.capacity.limits.raw.outputBytes=Number.MAX_SAFE_INTEGER+1;await f.saveCapacity();}
  if(mode==='reserve'){f.capacity.freeBytes=1;await f.saveCapacity();}
  await assert.rejects(loadAssemblyPlan(f.path,await f.save()),mode);
  await assert.rejects(access(join(f.job,'membership-input')));
 }
});

async function partitionedProducerFixture(options:{aggregate?:number}={}){
 const f=await partitionedPlanFixture();
 const {partitionCanonical,writePartitionedFamily}=await import('../../scripts/osm/partitioned-candidates');
 if(options.aggregate!==undefined){f.capacity.limits.raw.outputBytes=options.aggregate;f.capacity.allocations.normalizedOutput=options.aggregate;f.capacity.limits.membership.maxCandidateInputBytes=options.aggregate;f.plan.maxNormalizedOutputBytes=options.aggregate;f.plan.maxCandidateInputBytes=options.aggregate;}
 const rawPath=join(f.root,'raw.xml');await writeFile(rawPath,'raw');
 const source={id:'s0',path:rawPath,format:'xml',url:'https://example.org/immutable/fixture.osm',bytes:3,sha256:digest('raw'),vintage:'2026-10-12T00:00:00Z',licenseUrl:'https://opendatacommons.org/licenses/odbl/1-0/',attribution:'© OpenStreetMap contributors',clipSha256:digest('clip')};
 f.capacity.allocations.raw=3;f.capacity.limits.raw.sourceBytes=3;await f.saveCapacity();
 const manifest:any={schemaVersion:2,policy:'named-complete-way-v1-polar85',authorization:'Synthetic library fixture only',sources:[source],limits:f.capacity.limits.raw,evidenceLayout:f.plan.evidenceLayout};
 const manifestPath=join(f.root,'raw-manifest.json');await writeFile(manifestPath,JSON.stringify(manifest));
 const {path:_path,...sourceIdentity}=source;
 const revision='osm-'+digest(partitionCanonical({policy:manifest.policy,evidenceLayout:manifest.evidenceLayout,sources:[sourceIdentity]}));
 const rows=f.rows.map(row=>({...row,catalogueRevision:revision,sources:[{name:'OpenStreetMap contributors',url:source.url,attribution:source.attribution,dataClass:'catalog',vintage:source.vintage,licenseUrl:source.licenseUrl,modified:true,product:`OSM ${source.id} ${source.sha256}`}]}));
 for(const name of ['candidates.jsonl','lineage.jsonl','exclusions.jsonl'])await rm(join(f.producer,name));
 const budget={bytes:0,rows:0,work:0,maxBytes:1024*1024,maxRows:10000,maxWork:1000000,deadline:Date.now()+60000};
 const candidates=await writePartitionedFamily(f.producer,'candidates',rows,budget,{maxPartBytes:1024});
 const lineageRows=rows.map(row=>({placeId:row.placeId,source:source.id,sha256:source.sha256,vintage:source.vintage,policy:manifest.policy}));
 const lineageBody=lineageRows.map(row=>partitionCanonical(row)+'\n').join('');
 await writeFile(join(f.producer,'parts','lineage-00000.jsonl'),lineageBody);
 const lineage={bytes:Buffer.byteLength(lineageBody),rows:lineageRows.length,sha256:digest(lineageBody),parts:[{ordinal:0,path:'parts/lineage-00000.jsonl',bytes:Buffer.byteLength(lineageBody),sha256:digest(lineageBody),firstRow:0,rows:lineageRows.length,firstKey:[lineageRows[0].placeId,source.id],lastKey:[lineageRows.at(-1)!.placeId,source.id]}]};
 const exclusions=await writePartitionedFamily(f.producer,'exclusions',[{source:source.id,id:'place:v1:osm:node:3',reason:'unnamed'}],budget);
 const counts={accepted:2,lineage:2,exclusions:1,selectedOccurrences:3,acceptedOccurrences:2,duplicateAcceptedOccurrences:0,sources:[{id:source.id,selected:3,accepted:2,excluded:1,lineage:2}]};
 const checkpoint={schemaVersion:2,kind:'partitioned-normalized-checkpoint-v1',manifestSha256:digest(partitionCanonical(manifest)),databaseSha256:digest('synthetic-checkpoint-only'),completedSources:1,catalogueRevision:revision,geographyMode:'all-nodes',evidenceLayout:manifest.evidenceLayout,countsSha256:digest(partitionCanonical(counts))};
 const checkpointBody=partitionCanonical(checkpoint);await writeFile(join(f.producer,'checkpoint.json'),checkpointBody);
 const complete={schemaVersion:2,kind:'partitioned-normalized-osm-v1',catalogueRevision:revision,manifestSha256:checkpoint.manifestSha256,policy:manifest.policy,geographyMode:'all-nodes',sourceDomains:[],streams:{candidates,lineage,exclusions},counts,checkpoint:{bytes:Buffer.byteLength(checkpointBody),sha256:digest(checkpointBody)}};
 await writeFile(join(f.producer,'complete.json'),partitionCanonical(complete));
 return {...f,manifest,manifestPath,complete,rows};
}
test('partitioned assembly preserves ownership, all evidence and the existing final consumer root',async()=>{
 const f=await partitionedProducerFixture();assert.equal(f.complete.streams.candidates.parts.length,2);
 const evidence=await assembleMembership(f.path,await f.save(),f.producer,f.job,undefined,f.manifestPath);
 assert.equal(evidence.schemaVersion,2);assert.equal(evidence.membership.totalCandidates,2);assert.equal(evidence.membership.unknownCountryCandidates,1);
 await assert.rejects(access(join(f.job,'membership-input','candidates.jsonl')));
 await assert.rejects(access(join(f.job,'membership','candidates.jsonl')));
 const {loadCatalogueFiles}=await import('../../server/places/catalogueFiles');
 const loaded=await loadCatalogueFiles(evidence.catalogue.path,{expectedSha256:evidence.catalogue.sha256});
 assert.ok(loaded);assert.equal(loaded.root.schemaVersion,2);assert.equal(loaded.root.trees.id.rows,2);
 assert.equal(evidence.producerDescriptor.counts.exclusions,1);
});
test('partitioned assembly rejects missing evidence and shared row exhaustion without completion',async()=>{
 for(const mode of ['missing','rows']){
  const f=await partitionedProducerFixture();
  if(mode==='missing')await rm(join(f.producer,f.complete.streams.exclusions.parts[0].path));
  else{f.capacity.limits.membership.maxRows=1;f.plan.membership.maxRows=1;await f.saveCapacity();}
  await assert.rejects(assembleMembership(f.path,await f.save(),f.producer,f.job,undefined,f.manifestPath));
  await assert.rejects(access(join(f.job,'assembly-complete.json')));
 }
});

test('partitioned assembly budgets admitted footprint reads separately from normalized and enriched bytes',async()=>{
 const MiB=1024**2,f=await partitionedProducerFixture({aggregate:MiB});
 const sources=[{name:'Synthetic metadata',url:'https://example.org/'+('x'.repeat(1800)),licenseUrl:'https://example.org/'+('y'.repeat(1800)),attribution:'Synthetic footprint '+('a'.repeat(400)),dataClass:'catalog'}];
 let bytes=0,id=0;const chunks:string[]=[];
 while(bytes<20*MiB){const line=JSON.stringify({geometryBasis:'full-cell',footprintId:`synthetic-${String(id++).padStart(5,'0')}`,bounds:{west:0,south:0,east:1,north:1},sources,vintage:'synthetic'})+'\n';chunks.push(line);bytes+=Buffer.byteLength(line);}
 assert.ok(id<10000);const body=chunks.join('');await writeFile(f.plan.footprints.path,body);
 f.plan.footprints.bytes=bytes;f.plan.footprints.sha256=digest(body);
 f.capacity.allocations.footprints=32*MiB;f.capacity.allocations.sort=256*MiB;f.capacity.allocations.catalogue=128*MiB;
 f.capacity.limits.catalogue.maxScratchBytes=256*MiB;f.capacity.limits.catalogue.maxOutputBytes=128*MiB;
 f.capacity.limits.catalogue.timeoutMs=20000;f.plan.catalogue.timeoutMs=20000;
 f.capacity.limits.membership.maxMilliseconds=20000;f.plan.membership.maxMilliseconds=20000;
 f.capacity.limits.supervisor.wallSeconds=90;
 f.plan.stream.maxBytes=32*MiB;await f.saveCapacity();
 const result=await assembleMembership(f.path,await f.save(),f.producer,f.job,undefined,f.manifestPath);
 assert.equal(result.schemaVersion,2);assert.equal(result.catalogue.stats.inputRows,2);
 assert.ok((result as any).verification.bytes>=3*bytes,'precheck/publication/final footprint passes are all charged');
});

test('partitioned control metadata rejects duplicate JSON fields before interpretation',async()=>{
 const f=await partitionedPlanFixture();
 const body=JSON.stringify(f.capacity).replace('"schemaVersion":2','"schemaVersion":1,"schemaVersion":2');
 await writeFile(f.plan.capacityPlan.path,body);f.plan.capacityPlan.bytes=Buffer.byteLength(body);f.plan.capacityPlan.sha256=digest(body);
 await assert.rejects(loadAssemblyPlan(f.path,await f.save()),/Duplicate/);
});

test('partitioned assembly credit cannot exceed the actual pinned source inventory',async()=>{
 const f=await partitionedProducerFixture();
 f.capacity.retainedBytes=4;f.capacity.rawSourceAlreadyRetainedBytes=4;
 f.capacity.limits.raw.sourceBytes=4;f.capacity.allocations.raw=0;
 const manifest=JSON.parse(await readFile(f.manifestPath,'utf8'));manifest.limits.sourceBytes=4;
 await writeFile(f.manifestPath,JSON.stringify(manifest));await f.saveCapacity();
 await assert.rejects(assembleMembership(f.path,await f.save(),f.producer,f.job,undefined,f.manifestPath),/retained source credit/i);
 await assert.rejects(access(join(f.job,'assembly-complete.json')));
});

async function versionThreePlanFixture(input?:Awaited<ReturnType<typeof partitionedPlanFixture>>){
 const f=input??await partitionedPlanFixture(),GiB=1024**3,MiB=1024**2;
 f.plan.schemaVersion=3;f.capacity.schemaVersion=3;f.capacity.kind='partitioned-geography-capacity-v2';
 f.capacity.limits.membership.maxGeometryComparisons=f.capacity.limits.membership.maxComparisons;
 delete f.capacity.limits.membership.maxComparisons;
 f.capacity.limits.membership.maxRows=1500001;f.capacity.limits.raw.candidates=1500001;
 f.capacity.limits.membership.maxOutputBytes=2*GiB;f.capacity.allocations.membership=2*GiB;
 f.capacity.limits.catalogue.maxInputRows=1500001;f.capacity.limits.catalogue.maxInputBytes=2*GiB+f.capacity.allocations.footprints;
 f.capacity.limits.supervisor.diskBytes=8*GiB;f.capacity.limits.membership.maxMilliseconds=30000;f.capacity.limits.catalogue.timeoutMs=30000;f.capacity.limits.supervisor.wallSeconds=120;
 f.plan.membership={...f.capacity.limits.membership};delete f.plan.membership.maxCandidateInputBytes;
 f.plan.stream.maxBytes=f.capacity.limits.catalogue.maxInputBytes;f.plan.stream.maxRows=1500001;
 const Q=MiB,R=4*(f.capacity.allocations.normalizedOutput+f.capacity.limits.membership.maxOutputBytes+f.capacity.allocations.footprints)+8*MiB+3*f.capacity.limits.membership.maxBoundaryBytes+Q;
 f.plan.validation={maxReadBytes:R,maxRowsRead:R,maxLexicalTokens:R,maxOperations:R,controlAndAdmissionReadBytes:Q};
 f.capacity.limits.validation=f.plan.validation;
 await f.saveCapacity();return f;
}
test('strict version-three plan supports explicit global row/output controls without changing version two',async()=>{
 const f=await versionThreePlanFixture(),plan=await loadAssemblyPlan(f.path,await f.save());
 assert.equal(plan.schemaVersion,3);assert.equal(plan.membership.maxRows,1500001);assert.equal(plan.membership.maxOutputBytes,2*1024**3);
});

test('version-three assembly shares validation and geometry units and records writes separately',async()=>{
 const f=await partitionedProducerFixture();await versionThreePlanFixture(f);
 const raw=JSON.parse(await readFile(f.manifestPath,'utf8'));raw.limits=f.capacity.limits.raw;
 await writeFile(f.manifestPath,JSON.stringify(raw));
 const manifestSha256=digest(partitionCanonical(raw)),checkpointPath=join(f.producer,'checkpoint.json');
 const checkpoint=JSON.parse(await readFile(checkpointPath,'utf8'));checkpoint.manifestSha256=manifestSha256;
 const checkpointBody=partitionCanonical(checkpoint);await writeFile(checkpointPath,checkpointBody);
 const completePath=join(f.producer,'complete.json'),complete=JSON.parse(await readFile(completePath,'utf8'));
 complete.manifestSha256=manifestSha256;complete.checkpoint={bytes:Buffer.byteLength(checkpointBody),sha256:digest(checkpointBody)};
 await writeFile(completePath,partitionCanonical(complete));
 const evidence=await assembleMembership(f.path,await f.save(),f.producer,f.job,undefined,f.manifestPath);
 assert.equal(evidence.schemaVersion,3);
 const member=JSON.parse(await readFile(join(f.job,'membership','complete.json'),'utf8'));
 assert.equal(member.schemaVersion,3);assert.equal(member.totalCandidates,2);
 assert.ok(member.resources.validation.lexicalTokens>member.resources.geometry.comparisons);
 assert.ok(member.resources.writes.membership.bytes>0);assert.ok(member.resources.validation.readBytes>member.resources.writes.membership.bytes);
 assert.ok(member.resources.startedAt<=member.resources.deadline-30000);
 assert.equal(member.limits.maxRows,1500001);assert.equal(member.limits.maxOutputBytes,2*1024**3);
 const assemblyBody=await readFile(join(f.job,'assembly-complete.json')),inputBody=await readFile(join(f.job,'membership-input','input.json'));
 const final=JSON.parse(assemblyBody.toString('utf8'));
 assert.equal(final.verification.writes.assembly.bytes,assemblyBody.length+inputBody.length);
 assert.ok(final.verification.validation.controlAndAdmissionReadBytes>0);
});

test('version-three bootstrap transfers its consumed Q and duplicate controls reject before staging',async()=>{
 for(const mode of ['bootstrapQ','duplicatePlan','duplicateCapacity']){
  const f=await versionThreePlanFixture();
  if(mode==='bootstrapQ'){const previous=f.plan.validation.controlAndAdmissionReadBytes;f.plan.validation.controlAndAdmissionReadBytes=1;f.plan.validation.maxReadBytes-=previous-1;f.plan.validation.maxLexicalTokens=f.plan.validation.maxReadBytes;f.plan.validation.maxRowsRead=f.plan.validation.maxReadBytes;f.capacity.limits.validation=f.plan.validation;await f.saveCapacity();}
  let planSha=await f.save();
  if(mode==='duplicatePlan'){const body=(await readFile(f.path,'utf8')).replace('"schemaVersion":3','"schemaVersion":2,"schemaVersion":3');await writeFile(f.path,body);planSha=digest(body);}
  if(mode==='duplicateCapacity'){const body=(await readFile(f.plan.capacityPlan.path,'utf8')).replace('"schemaVersion":3','"schemaVersion":2,"schemaVersion":3');await writeFile(f.plan.capacityPlan.path,body);f.plan.capacityPlan.bytes=Buffer.byteLength(body);f.plan.capacityPlan.sha256=digest(body);planSha=await f.save();}
  if(mode==='bootstrapQ'){
   const rawPath=join(f.root,'raw-manifest.json');await writeFile(rawPath,JSON.stringify({schemaVersion:2,policy:'named-complete-way-v1-polar85',authorization:'synthetic',sources:[{id:'s',path:join(f.root,'raw.xml'),format:'xml',url:'https://source.example.invalid/dated.xml',bytes:1,sha256:'a'.repeat(64),vintage:'2026-10-01T00:00:00Z',licenseUrl:'https://opendatacommons.org/licenses/odbl/1-0/',attribution:'© OpenStreetMap contributors',clipSha256:'b'.repeat(64)}],limits:f.capacity.limits.raw,evidenceLayout:f.plan.evidenceLayout}));
   await assert.rejects(assembleMembership(f.path,planSha,f.producer,f.job,undefined,rawPath),/Control and admission read byte limit/);
  }else await assert.rejects(loadAssemblyPlan(f.path,planSha),/Duplicate partition JSON field/);
  await assert.rejects(access(join(f.job,'membership-input')));await assert.rejects(access(join(f.job,'assembly-complete.json')));
 }
});

test('version-three pinned control and boundary reads never request beyond precharged bytes',async t=>{
 const f=await versionThreePlanFixture(),sha=await f.save();
 const probe=await open(f.path,'r'),prototype=Object.getPrototypeOf(probe),original=prototype.read;await probe.close();
 const targets=new Set(await Promise.all([f.path,f.plan.capacityPlan.path,f.plan.boundaries[0].input.path].map(async path=>{const s=await stat(path);return `${s.dev}:${s.ino}`;})));
 const positions=new WeakMap<object,number>();let checked=0;
 t.mock.method(prototype,'read',async function(this:any,...args:any[]){
  const s=await this.stat(),key=`${s.dev}:${s.ino}`;
  if(targets.has(key)){const position=positions.get(this)??0;assert.ok(args[2]<=s.size-position,'a pinned read must fit its precharged remaining bytes');checked++;const result=await original.apply(this,args);positions.set(this,position+result.bytesRead);return result;}
  return original.apply(this,args);
 });
 const resourceSession=createResourceSessionV3({validation:f.plan.validation,maxGeometryComparisons:f.plan.membership.maxGeometryComparisons,maxMilliseconds:f.plan.membership.maxMilliseconds},createBootstrapResources(Date.now()));
 await loadAssemblyPlan(f.path,sha,{kind:'session',resources:resourceSession});assert.ok(checked>=3);
});
