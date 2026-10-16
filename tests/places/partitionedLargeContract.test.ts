/** Opt-in contract/limit evidence, never production source or capacity authority.
 * The controller runs this large fixture once after the small suite is stable.
 * Successful and failed generated artifacts remain retained for review.
 */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {access,mkdir,mkdtemp,open,readFile,readdir,realpath,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {assembleMembership} from '../../scripts/osm/membership-assembly';
import {capacityV2Schema} from '../../scripts/osm/geography-capacity-plan';
import {partitionedAssemblyPlanSchema,partitionedRawManifestSchema,validatePartitionedCapacity} from '../../scripts/osm/partitioned-assembly-plan';
import {PART_BYTES,partitionCanonical,rawCompletionV2Schema,writePartitionedFamily,type SharedPartitionBudget,type StreamFamily} from '../../scripts/osm/partitioned-candidates';
import {loadCatalogueFiles,type CatalogueCandidate} from '../../server/places/catalogueFiles';

const enabled=process.env.NIGHTSKY_LARGE_PARTITION_TEST==='1';
const MiB=1024**2,GiB=1024**3,COUNT=16000;
const layout={kind:'partitioned-jsonl-v1' as const,maxPartBytes:PART_BYTES,maxParts:64 as const};
const policy='named-complete-way-v1-polar85' as const;
const caveats=['Named nodes and complete ways only; access, darkness and mapped completeness unknown.'];
const hash=(body:string|Buffer)=>createHash('sha256').update(body).digest('hex');
const id=(index:number)=>`place:v1:osm:node:${String(index+1).padStart(10,'0')}`;

function charge(budget:SharedPartitionBudget,bytes:number,rows=0){
  budget.signal?.throwIfAborted();
  if(Date.now()>=budget.deadline||budget.bytes+bytes>budget.maxBytes||budget.rows+rows>budget.maxRows||budget.work+1>budget.maxWork)throw new Error('Synthetic fixture shared generation budget');
  budget.bytes+=bytes;budget.rows+=rows;budget.work++;
}

test('opt-in >128MiB candidate family reaches one unchanged catalogue consumer root',{
  skip:!enabled,
  timeout:70*60*1000,
},async t=>{
  // No directory creation, body generation or cleanup occurs outside this
  // opt-in callback. Paths derive from this checkout, never a data worktree.
  const parent=join(fileURLToPath(new URL('../..',import.meta.url)),'.cache','partition-implementation');
  await mkdir(parent,{recursive:true});
  const root=await realpath(await mkdtemp(join(parent,'large-contract-')));
  const producer=join(root,'producer'),job=join(root,'assembly');
  t.diagnostic(JSON.stringify({kind:'large-partition-contract-start',syntheticOnly:true,root,retained:true}));
  await mkdir(producer);await mkdir(job);
  const aggregate=256*MiB,deadlineMs=1800000;
  const generation:SharedPartitionBudget={bytes:0,rows:0,work:0,maxBytes:aggregate,maxRows:1000000,maxWork:200000000,deadline:Date.now()+300000};
  const began=Date.now();
  try{
    const sources=[];
    for(let index=0;index<4;index++){
      const prefix=`https://source-${index}.example.invalid/`,suffix='/fixture-261001.osm';
      const url=prefix+'x'.repeat(1900-prefix.length-suffix.length)+suffix;
      assert.equal(url.length,1900);
      const body=Buffer.from(`<osm version="0.6" timestamp="2026-10-01T00:00:00Z"><!-- synthetic metadata stub ${index}; not a selected-source job --></osm>`);
      const path=join(root,`synthetic-source-${index}.osm`);await writeFile(path,body,{flag:'wx'});
      sources.push({id:`s${index}`,path,format:'xml' as const,url,bytes:body.length,sha256:hash(body),vintage:'2026-10-01T00:00:00Z',licenseUrl:'https://opendatacommons.org/licenses/odbl/1-0/' as const,attribution:'© OpenStreetMap contributors' as const,clipSha256:'a'.repeat(64)});
    }
    const rawLimits={sourceBytes:MiB,scratchBytes:MiB,outputBytes:aggregate,rowBytes:65536,nodes:1000000,candidates:1000000,referencesPerWay:100000,seconds:300,freeBytes:0};
    const raw=partitionedRawManifestSchema.parse({schemaVersion:2,policy,authorization:'SYNTHETIC LIBRARY CONTRACT FIXTURE ONLY; NO PRODUCTION AUTHORITY',sources,limits:rawLimits,evidenceLayout:layout});
    const manifestPath=join(root,'raw-manifest.json');await writeFile(manifestPath,partitionCanonical(raw),{flag:'wx'});
    const catalogueRevision='osm-'+hash(partitionCanonical({policy,evidenceLayout:layout,sources:sources.map(({path:_path,...source})=>source)}));
    const manifestSha256=hash(partitionCanonical(raw));
    const candidateSources=sources.map(source=>({name:'OpenStreetMap contributors',url:source.url,attribution:source.attribution,dataClass:'catalog' as const,vintage:source.vintage,licenseUrl:source.licenseUrl,modified:true,product:`OSM ${source.id} ${source.sha256}`}));
    const countryId='region:v1:synthetic-country',unresolvedId='unresolved:ne:0:U';
    const boundarySource={name:'Synthetic boundary',url:'https://boundary.example.invalid/',attribution:'Synthetic contract fixture',dataClass:'catalog'};
    const ring=(west:number,south:number,east:number,north:number)=>[[west,south],[east,south],[east,north],[west,north],[west,south]];
    const boundaryBody=JSON.stringify({type:'FeatureCollection',features:[
      {type:'Feature',properties:{regionId:countryId,name:'Synthetic country',countryCode:'IND',adminLevel:0,boundaryRevision:'synthetic-large-contract',sources:[boundarySource]},geometry:{type:'Polygon',coordinates:[ring(0,0,2,2)]}},
      {type:'Feature',properties:{kind:'unresolved-boundary',boundaryId:unresolvedId,providerId:'U',adminLevel:0,boundaryRevision:'synthetic-large-contract',sources:[boundarySource],sourceLayer:0,reason:'country-assignment'},geometry:{type:'Polygon',coordinates:[ring(1.1,1.1,1.5,1.5)]}},
    ]});
    const boundaryPath=join(root,'boundaries.json'),footprintsPath=join(root,'footprints.jsonl');
    await writeFile(boundaryPath,boundaryBody,{flag:'wx'});await writeFile(footprintsPath,'',{flag:'wx'});
    const membership={maxCandidateInputBytes:aggregate,maxBoundaryBytes:64*MiB,maxVertices:1000000,maxTotalVertices:2000000,maxComparisons:200000000,maxRows:1000000,maxOutputBytes:aggregate,maxMilliseconds:deadlineMs};
    // Two initial candidate sort runs keep cumulative sort writes below1GiB.
    // All publisher controls remain finite and within existing implementation caps.
    const publisherControls={chunkRows:8192,mergeFanIn:8,maxRows:128,fanout:128,maxInputRows:1000000,maxMetadataRows:10000,maxInputBytes:2*GiB,maxOutputBytes:GiB,maxScratchBytes:GiB,timeoutMs:deadlineMs};
    const capacity=capacityV2Schema.parse({schemaVersion:2,kind:'partitioned-geography-capacity-v1',freeBytes:16*GiB,reserveBytes:0,retainedBytes:0,rawSourceAlreadyRetainedBytes:0,
      allocations:{raw:MiB,index:MiB,journal:MiB,normalizedOutput:aggregate,boundaries:64*MiB,stagedCandidates:0,stagedBoundaries:64*MiB,footprints:MiB,membership:aggregate,sort:GiB,catalogue:GiB,failureReports:MiB,rollback:0},
      limits:{raw:rawLimits,membership,catalogue:publisherControls,supervisor:{wallSeconds:3900,rssBytes:2*GiB,commitBytes:4*GiB,diskBytes:4*GiB,freeBytes:0,maxProcesses:2}},
    });
    const capacityBody=partitionCanonical(capacity),capacityPath=join(root,'synthetic-capacity.json');
    await writeFile(capacityPath,capacityBody,{flag:'wx'});
    const {maxCandidateInputBytes:_candidateCeiling,...memberControls}=membership;
    const plan=partitionedAssemblyPlanSchema.parse({schemaVersion:2,geographyMode:'all-nodes',
      boundaries:[{input:{path:boundaryPath,bytes:Buffer.byteLength(boundaryBody),sha256:hash(boundaryBody)},regionIds:[countryId],unresolvedBoundaryIds:[unresolvedId]}],
      footprints:{path:footprintsPath,bytes:0,sha256:hash('')},membership:memberControls,
      stream:{maxRowBytes:65536,maxBytes:aggregate,maxRows:1000000},catalogue:publisherControls,retained:[],evidenceLayout:layout,
      maxNormalizedOutputBytes:aggregate,maxCandidateInputBytes:aggregate,
      capacityPlan:{path:capacityPath,bytes:Buffer.byteLength(capacityBody),sha256:hash(capacityBody)},
    });
    // Fail bad arithmetic/control coupling before creating the large family.
    validatePartitionedCapacity(plan,capacity,raw);
    const planBody=partitionCanonical(plan),planPath=join(root,'assembly-plan.json');await writeFile(planPath,planBody,{flag:'wx'});
    const point=(index:number):[number,number]=>index%4===0?[1,1]:index%4===1?[20,20]:index%4===2?[0,1]:[1.25,1.25];
    const candidate=(index:number):CatalogueCandidate=>{
      const [longitude,latitude]=point(index);
      return {placeId:id(index),name:(`Synthetic bounded contract ${id(index)} `).padEnd(160,'x'),category:'park',latitude,longitude,
        accessEvidence:{status:'unknown'},sources:candidateSources,caveats,catalogueRevision,sourceCompleteness:1,regionIds:[]};
    };
    const sampleBytes=Buffer.byteLength(partitionCanonical(candidate(0))+'\n');
    assert.ok(sampleBytes<65536);assert.ok(sampleBytes*COUNT>PART_BYTES,'fixture must exceed the real physical part cap');
    function* candidates(){for(let index=0;index<COUNT;index++)yield candidate(index);}
    const candidateFamily=await writePartitionedFamily(producer,'candidates',candidates(),generation);
    assert.ok(candidateFamily.bytes>PART_BYTES);assert.ok(candidateFamily.parts.length>=2);
    const lineagePath='parts/lineage-00000.jsonl',lineageHash=createHash('sha256');let lineageBytes=0;
    const lineageHandle=await open(join(producer,lineagePath),'wx');
    try{
      for(let index=0;index<COUNT;index++){
        const group=Buffer.from(sources.map(source=>partitionCanonical({placeId:id(index),source:source.id,sha256:source.sha256,vintage:source.vintage,policy})+'\n').join(''));
        if(lineageBytes+group.length>PART_BYTES)throw new Error('Synthetic grouped lineage must fit its one bounded part');
        charge(generation,group.length,4);await lineageHandle.writeFile(group);lineageHash.update(group);lineageBytes+=group.length;
      }
    }finally{await lineageHandle.close();}
    const lineageSha256=lineageHash.digest('hex');
    const lineageFamily:StreamFamily={bytes:lineageBytes,rows:COUNT*4,sha256:lineageSha256,
      parts:[{ordinal:0,path:lineagePath,bytes:lineageBytes,sha256:lineageSha256,firstRow:0,rows:COUNT*4,firstKey:[id(0),'s0'],lastKey:[id(COUNT-1),'s3']}]};
    const exclusions=[{source:'s0',id:'place:v1:osm:relation:9999999999',reason:'relation'},
      {source:'s0',id:'place:v1:osm:relation:9999999999',reason:'relation'},
      {source:'s1',id:id(0),reason:'invalid-geometry'}];
    const exclusionFamily=await writePartitionedFamily(producer,'exclusions',exclusions,generation);
    const counts={accepted:COUNT,lineage:COUNT*4,exclusions:3,selectedOccurrences:COUNT*4+4,acceptedOccurrences:COUNT*4+1,duplicateAcceptedOccurrences:1,
      sources:sources.map((source,index)=>({id:source.id,selected:COUNT+(index===0?3:index===1?1:0),accepted:COUNT+(index===0?1:0),excluded:index===0?2:index===1?1:0,lineage:COUNT}))};
    // This is a synthetic frozen witness, not an actual SQLite normalization.
    const databaseBody='Synthetic contract fixture database witness; no raw selection occurred.\n';
    await writeFile(join(producer,'scratch.sqlite'),databaseBody,{flag:'wx'});
    const checkpoint={schemaVersion:2,kind:'partitioned-normalized-checkpoint-v1',manifestSha256,databaseSha256:hash(databaseBody),completedSources:4,catalogueRevision,geographyMode:'all-nodes',evidenceLayout:layout,countsSha256:hash(partitionCanonical(counts))};
    const checkpointBody=partitionCanonical(checkpoint);charge(generation,Buffer.byteLength(checkpointBody));
    await writeFile(join(producer,'checkpoint.json'),checkpointBody,{flag:'wx'});
    const done=rawCompletionV2Schema.parse({schemaVersion:2,kind:'partitioned-normalized-osm-v1',catalogueRevision,manifestSha256,policy,geographyMode:'all-nodes',sourceDomains:[],
      streams:{candidates:candidateFamily,lineage:lineageFamily,exclusions:exclusionFamily},counts,
      checkpoint:{bytes:Buffer.byteLength(checkpointBody),sha256:hash(checkpointBody)},
    });
    const completionBody=partitionCanonical(done);charge(generation,Buffer.byteLength(completionBody));
    await writeFile(join(producer,'complete.json'),completionBody,{flag:'wx'});
    const rawParts=Object.values(done.streams).flatMap(family=>family.parts);
    assert.ok(rawParts.length<=64);assert.ok(rawParts.every(part=>part.bytes<=PART_BYTES));
    assert.equal(done.counts.selectedOccurrences,done.counts.acceptedOccurrences+done.counts.exclusions);
    assert.equal(done.counts.duplicateAcceptedOccurrences,done.counts.acceptedOccurrences-done.counts.lineage);
    const evidence=await assembleMembership(planPath,hash(planBody),producer,job,undefined,manifestPath);
    assert.equal(evidence.schemaVersion,2);
    if(!('verification' in evidence))throw new Error('Partitioned assembly verification evidence required');
    const member=JSON.parse(await readFile(join(job,'membership','complete.json'),'utf8'));
    assert.equal(member.totalCandidates,COUNT);assert.equal(member.unknownCountryCandidates,COUNT*3/4);
    assert.ok(member.streams.candidates.bytes>PART_BYTES);
    assert.ok(member.streams.candidates.parts.length>=2);
    assert.ok(member.streams.candidates.parts.every((part:{bytes:number})=>part.bytes<=PART_BYTES));
    assert.ok(member.resources.rows<=1000000&&member.resources.work<=200000000&&member.resources.outputBytes<=aggregate);
    assert.deepEqual(member.inputIdentity.counts,counts);
    assert.deepEqual(member.inputIdentity.rawStreams.exclusions,exclusionFamily);
    const catalogue=evidence.catalogue;
    assert.equal(catalogue.stats.inputRows,COUNT);assert.ok(catalogue.stats.inputBytes<=2*GiB);
    assert.ok(catalogue.stats.scratchBytes<=GiB&&catalogue.stats.outputBytes<=GiB);
    assert.equal((await readdir(join(job,'catalogue'))).filter(name=>/^catalogue-.*\.json$/.test(name)).length,1);
    const files=await loadCatalogueFiles(catalogue.path,{expectedSha256:catalogue.sha256});
    assert.equal(files.root.schemaVersion,2);assert.equal(files.root.catalogueRevision,catalogueRevision);
    const seen=new Uint8Array(COUNT);let spatialRows=0,known=0,unknown=0;
    // Four bounded consumer queries exhaust this synthetic four-coordinate
    // dataset. Keep the unchanged10s/256leaf query caps for every query.
    for(let query=0;query<4;query++){
      const [longitude,latitude]=point(query);
      const accept=(ref:{bounds?:{west:number;east:number;south:number;north:number}})=>!!ref.bounds&&ref.bounds.west<=longitude&&ref.bounds.east>=longitude&&ref.bounds.south<=latitude&&ref.bounds.north>=latitude;
      for await(const page of files.walk('spatial',{accept,budget:files.createBudget({maxLeaves:256,timeoutMs:10000})}))if(page.kind==='candidates'){
      for(const row of page.rows){
        if(row.longitude!==longitude||row.latitude!==latitude)continue;
        const index=Number(row.placeId.slice(row.placeId.lastIndexOf(':')+1))-1;
        assert.ok(Number.isSafeInteger(index)&&index>=0&&index<COUNT);assert.equal(row.placeId,id(index));assert.equal(seen[index],0);seen[index]=1;
        const expected=candidate(index);assert.equal(row.name,expected.name);assert.equal(row.latitude,expected.latitude);assert.equal(row.longitude,expected.longitude);
        assert.deepEqual(row.sources,expected.sources);assert.deepEqual(row.caveats,caveats);assert.equal(row.accessEvidence.status,'unknown');
        if(index%4===0){assert.equal(row.countryCode,'IND');assert.deepEqual(row.regionIds,[countryId]);known++;}
        else{assert.equal(row.countryCode,undefined);assert.deepEqual(row.regionIds,[]);unknown++;}
        spatialRows++;
      }
      }
    }
    assert.equal(spatialRows,COUNT);assert.equal(known,COUNT/4);assert.equal(unknown,COUNT*3/4);
    let idRows=0;
    for await(const page of files.walk('id',{budget:files.createBudget({maxLeaves:256,timeoutMs:10000})}))if(page.kind==='ids'){
      for(const row of page.rows){assert.equal(row.key,id(idRows++));assert.ok(row.page.kind==='candidates');}
    }
    assert.equal(idRows,COUNT);
    let regionRows=0,footprintRows=0;
    for await(const page of files.walk('regions'))if(page.kind==='regions')regionRows+=page.rows.length;
    for await(const page of files.walk('footprints'))if(page.kind==='footprints')footprintRows+=page.rows.length;
    assert.equal(regionRows,1);assert.equal(footprintRows,0);
    assert.ok(files.stats().residentPages<=2&&files.stats().residentBytes<=8*MiB);
    for(const path of [join(producer,'candidates.jsonl'),join(producer,'lineage.jsonl'),join(producer,'exclusions.jsonl'),join(job,'membership-input','candidates.jsonl'),join(job,'membership','candidates.jsonl')]){
      await assert.rejects(access(path),(error:NodeJS.ErrnoException)=>error.code==='ENOENT');
    }
    assert.deepEqual((await readdir(join(job,'membership-input'))).sort(),['boundary-0.json','input.json']);
    assert.ok((await readFile(join(job,'assembly-complete.json'))).length>0);
    t.diagnostic(JSON.stringify({kind:'large-partition-contract-result',syntheticOnly:true,productionAdmitted:false,rawSelectionJob:false,supervisorRun:false,networkRequests:0,
      retainedRoot:root,retained:true,elapsedMilliseconds:Date.now()-began,candidates:COUNT,rawCandidateBytes:candidateFamily.bytes,rawLineageBytes:lineageFamily.bytes,rawExclusionBytes:exclusionFamily.bytes,
      rawPartCount:rawParts.length,rawAggregateOutputBytes:generation.bytes,rawAggregateBudget:aggregate,membershipCandidateBytes:member.streams.candidates.bytes,membershipPartCount:member.streams.candidates.parts.length,
      membershipResources:member.resources,verification:evidence.verification,publisher:catalogue.stats,consumer:{schemaVersion:files.root.schemaVersion,spatialRows,idRows,known,unknown,regionRows,footprintRows},
      catalogueSha256:catalogue.sha256,oneConsumerRoot:true,monolithicCandidateFile:false,stagedCandidateCopy:false,globalScaleOrProductionCompletion:false}));
  }catch(error){
    t.diagnostic(JSON.stringify({kind:'large-partition-contract-failure',syntheticOnly:true,retainedRoot:root,retained:true,elapsedMilliseconds:Date.now()-began,generationBytes:generation.bytes,generationRows:generation.rows,generationWork:generation.work,
      error:error instanceof Error?error.message.slice(0,1000):String(error).slice(0,1000),acceptedAssembly:false}));
    throw error;
  }
});
