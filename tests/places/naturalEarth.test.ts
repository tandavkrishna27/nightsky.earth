import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,realpath,writeFile,readFile,access} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {ingestNaturalEarth,ingestSyntheticNaturalEarth} from '../../scripts/osm/natural-earth-ingest';
import {prepareGeographicCoverage} from '../../scripts/osm/prepare-geographic-coverage';
import {buildBoundaryMetadata} from '../../scripts/osm/boundary-metadata';
const directedEdges=(rings:number[][][])=>rings.flatMap(r=>r.slice(0,-1).map((p,i)=>JSON.stringify([p,r[i+1]]))).sort();
const ring=(a:number,b:number,c:number,d:number)=>[[a,b],[c,b],[c,d],[a,d],[a,b]];
const source={name:'Synthetic only',url:'https://example.org',attribution:'Synthetic only',dataClass:'catalog'};
const region=(id:string,adminLevel:number)=>({regionId:`region:v1:${id}`,name:id,countryCode:'IND',adminLevel,boundaryRevision:'synthetic-only',sources:[source]});
async function fixture(){
 const dir=await realpath(await mkdtemp(join(await realpath(tmpdir()),'natural-earth-synthetic-')));
 const descriptor:any={schemaVersion:1,profile:'synthetic-natural-earth-only',layers:[]};
 for(const [level,features] of [[0,[{type:'Feature',properties:{fixture_id:'country'},geometry:{type:'MultiPolygon',coordinates:[[ring(0,0,10,10),ring(3,3,5,5)],[ring(20,0,22,2)]]}}]],[1,[{type:'Feature',properties:{fixture_id:'state'},geometry:{type:'Polygon',coordinates:[ring(0,0,3,3)]}}]]] as const){
  const body=Buffer.from(JSON.stringify({type:'FeatureCollection',features})),path=`level${level}.geojson`;
  await writeFile(join(dir,path),body);descriptor.layers.push({level,input:{path,bytes:body.length,sha256:createHash('sha256').update(body).digest('hex'),gitBlobSha1:createHash('sha1').update(`blob ${body.length}\0`).update(body).digest('hex')},idField:'fixture_id',mapping:{[level?'state':'country']:region(level?'state':'country',level)}});
 }
 const input=join(dir,'input.json');await writeFile(input,JSON.stringify(descriptor));return {dir,input,descriptor,out:join(dir,'out')};
}
test('synthetic both levels preserve holes/multipart and feed existing preparation and membership without dropping unknown candidates',async()=>{
 const f=await fixture();await ingestSyntheticNaturalEarth(f.input,f.out);
 const normalized=JSON.parse(await readFile(join(f.out,'boundaries.geojson'),'utf8'));assert.equal(normalized.features[0].geometry.coordinates.length,2);
 await prepareGeographicCoverage(join(f.out,'preparation.json'),join(f.dir,'prepared'));
 const rows=[{placeId:'place:v1:osm:node:1',name:'Park',category:'park',latitude:1,longitude:1},{placeId:'place:v1:osm:node:2',name:'Hole',category:'park',latitude:4,longitude:4},{placeId:'place:v1:osm:node:3',name:'Border',category:'park',latitude:1,longitude:0}].map(r=>({...r,accessEvidence:{status:'unknown'},sources:[source],caveats:[],catalogueRevision:'synthetic-only',sourceCompleteness:1,regionIds:[]}));
 const body=rows.map(r=>JSON.stringify(r)+'\n').join('');await writeFile(join(f.out,'candidates.jsonl'),body);
 const geometry=await readFile(join(f.out,'boundaries.geojson'));await writeFile(join(f.out,'membership.json'),JSON.stringify({schemaVersion:1,catalogueRevision:'synthetic-only',boundaries:{path:'boundaries.geojson',bytes:geometry.length,sha256:createHash('sha256').update(geometry).digest('hex')},candidates:{path:'candidates.jsonl',bytes:Buffer.byteLength(body),sha256:createHash('sha256').update(body).digest('hex')}}));
 const result=await buildBoundaryMetadata(join(f.out,'membership.json'),join(f.dir,'members'));assert.equal(result.totalCandidates,3);assert.equal(result.unknownCountryCandidates,2);const enriched=(await readFile(join(f.dir,'members','candidates.jsonl'),'utf8')).trim().split('\n').map(s=>JSON.parse(s));assert.deepEqual(enriched.map(r=>r.regionIds),[['region:v1:country','region:v1:state'],[],[]]);
});
test('production refuses synthetic identity and fixture mode cannot change production pins',async()=>{const f=await fixture();await assert.rejects(ingestNaturalEarth(f.input,f.out),/profile/i);f.descriptor.profile='natural-earth-v5.1.1';await writeFile(f.input,JSON.stringify(f.descriptor));await assert.rejects(ingestSyntheticNaturalEarth(f.input,f.out),/profile/i);await assert.rejects(ingestNaturalEarth(f.input,f.out),/pin/i);});
test('mapping omissions, duplicate IDs, invalid ISO and conflicting levels fail closed',async()=>{for(const mode of ['missing','unused','iso','level','duplicate']){const f=await fixture();const layer=f.descriptor.layers[0];if(mode==='missing')layer.mapping={};if(mode==='unused')layer.mapping.extra=region('extra',0);if(mode==='iso')layer.mapping.country.countryCode='-99';if(mode==='level')layer.mapping.country.adminLevel=1;if(mode==='duplicate')layer.mapping.country.regionId='region:v1:state';await writeFile(f.input,JSON.stringify(f.descriptor));await assert.rejects(ingestSyntheticNaturalEarth(f.input,f.out));await assert.rejects(access(join(f.out,'complete.json')));}});
test('changed hashes, unsafe paths, malformed UTF8, work/vertices/output/deadline ceilings and reused output fail closed',async()=>{for(const mode of ['sha','git','bytes','traversal','ads','utf8','work','vertices','output','deadline','reuse']){const f=await fixture();const pin=f.descriptor.layers[0].input;if(mode==='sha')pin.sha256='0'.repeat(64);if(mode==='git')pin.gitBlobSha1='0'.repeat(40);if(mode==='bytes')pin.bytes++;if(mode==='traversal')pin.path='../level0.geojson';if(mode==='ads')pin.path='level0.geojson:stream';if(mode==='utf8'){const b=Buffer.from([0xff]);await writeFile(join(f.dir,pin.path),b);pin.bytes=1;pin.sha256=createHash('sha256').update(b).digest('hex');pin.gitBlobSha1=createHash('sha1').update('blob 1\0').update(b).digest('hex');}await writeFile(f.input,JSON.stringify(f.descriptor));if(mode==='reuse')await ingestSyntheticNaturalEarth(f.input,f.out);await assert.rejects(ingestSyntheticNaturalEarth(f.input,f.out,mode==='work'?{maxComparisons:1}:mode==='vertices'?{maxVertices:1}:mode==='output'?{maxOutputBytes:1}:mode==='deadline'?{maxMilliseconds:0}:{}));if(mode!=='reuse')await assert.rejects(access(join(f.out,'complete.json')));}});

test('topology, unsplit dateline, duplicate provider IDs and strict-interior ambiguity are conservative',async()=>{
 for(const mode of ['dateline','bowtie','duplicate','multipart']){
  const f=await fixture(),layer=f.descriptor.layers[0],path=join(f.dir,layer.input.path),raw=JSON.parse(await readFile(path,'utf8'));
  if(mode==='duplicate')raw.features.push(raw.features[0]);
  else if(mode==='multipart')raw.features[0].geometry.coordinates.push([ring(1,1,2,2)]);
  else raw.features[0].geometry={type:'Polygon',coordinates:[mode==='dateline'?ring(-170,0,170,10):[[0,0],[10,10],[0,10],[10,0],[0,0]]]};
  const b=Buffer.from(JSON.stringify(raw));await writeFile(path,b);Object.assign(layer.input,{bytes:b.length,sha256:createHash('sha256').update(b).digest('hex'),gitBlobSha1:createHash('sha1').update(`blob ${b.length}\0`).update(b).digest('hex')});await writeFile(f.input,JSON.stringify(f.descriptor));
  await assert.rejects(ingestSyntheticNaturalEarth(f.input,f.out),/dateline|ring|duplicate|multipart/i);await assert.rejects(access(join(f.out,'complete.json')));
 }
});

test('input mutation during output prevents completion',async()=>{
 const {existsSync,writeFileSync}=await import('node:fs');const f=await fixture();let changed=false;
 const signal={throwIfAborted(){if(!changed&&existsSync(join(f.out,'audit.json'))){changed=true;writeFileSync(join(f.dir,'level0.geojson'),'{}');}}} as AbortSignal;
 await assert.rejects(ingestSyntheticNaturalEarth(f.input,f.out,{signal}),/mutation/i);assert.equal(changed,true);await assert.rejects(access(join(f.out,'complete.json')));
});

test('symlink inputs and output parents are refused',async()=>{
 const {symlink,mkdir}=await import('node:fs/promises');const f=await fixture();const linked=join(f.dir,'linked');await symlink(f.dir,linked,'junction');
 await assert.rejects(ingestSyntheticNaturalEarth(join(linked,'input.json'),f.out),/symlink/i);
 await assert.rejects(ingestSyntheticNaturalEarth(f.input,join(linked,'out')),/symlink/i);
 await mkdir(join(f.dir,'unused'));
});

test('Windows aliases are rejected explicitly before filesystem resolution',async()=>{for(const name of ['NUL','COM1.txt','trailing.','trailing ','bad\x7f']){const f=await fixture();await assert.rejects(ingestSyntheticNaturalEarth(f.input,join(f.dir,name)),/unsafe/i);}});

test('mutation while pending completion is written leaves no published marker',async()=>{const {existsSync,writeFileSync}=await import('node:fs');const f=await fixture();let changed=false;const signal={throwIfAborted(){if(!changed&&existsSync(join(f.out,'complete.pending.json'))){changed=true;writeFileSync(f.input,'{}');}}} as AbortSignal;await assert.rejects(ingestSyntheticNaturalEarth(f.input,f.out,{signal}),/mutation/i);assert.equal(changed,true);await assert.rejects(access(join(f.out,'complete.json')));});

test('production provenance replaces caller supplied edition and source claims',async()=>{const {naturalEarthRegion}=await import('../../scripts/osm/natural-earth-policy');const result=naturalEarthRegion(region('country',0) as any);assert.equal(result.regionId,'region:v1:country');assert.equal(result.sources[0].name,'Natural Earth');assert.equal(result.sources[0].vintage,'5.1.1');assert.equal(result.boundaryRevision,'natural-earth-v5.1.1-9380cca83db5f9aef52d5e762765100745f84b27');});

test('provider CRS annotations are never silently discarded',async()=>{for(const feature of [false,true]){const f=await fixture(),layer=f.descriptor.layers[0],path=join(f.dir,layer.input.path),raw=JSON.parse(await readFile(path,'utf8'));(feature?raw.features[0]:raw).crs={type:'name',properties:{name:'EPSG:3857'}};const b=Buffer.from(JSON.stringify(raw));await writeFile(path,b);Object.assign(layer.input,{bytes:b.length,sha256:createHash('sha256').update(b).digest('hex'),gitBlobSha1:createHash('sha1').update(`blob ${b.length}\0`).update(b).digest('hex')});await writeFile(f.input,JSON.stringify(f.descriptor));await assert.rejects(ingestSyntheticNaturalEarth(f.input,f.out),/CRS/i);await assert.rejects(access(join(f.out,'complete.json')));}});

test('explicit CRS84 and consecutive duplicate policy retain pins and audit exact transformations',async()=>{
 const f=await fixture(),layer=f.descriptor.layers[0],path=join(f.dir,layer.input.path),raw=JSON.parse(await readFile(path,'utf8'));
 raw.crs={type:'name',properties:{name:'urn:ogc:def:crs:OGC:1.3:CRS84'}};
 raw.features[0].geometry.coordinates[0][0].splice(1,0,[0,0]);
 const b=Buffer.from(JSON.stringify(raw));await writeFile(path,b);Object.assign(layer.input,{bytes:b.length,sha256:createHash('sha256').update(b).digest('hex'),gitBlobSha1:createHash('sha1').update(`blob ${b.length}\0`).update(b).digest('hex')});
 f.descriptor.crsPolicy='verified-crs84';f.descriptor.geometryPolicy='remove-consecutive-identical';await writeFile(f.input,JSON.stringify(f.descriptor));
 await ingestSyntheticNaturalEarth(f.input,f.out);assert.deepEqual(await readFile(path),b);
 const audit=JSON.parse(await readFile(join(f.out,'audit.json'),'utf8'));assert.equal(audit.transformations.length,1);assert.deepEqual(audit.transformations[0],{level:0,providerId:'country',polygon:0,ring:0,removedPositionIndices:[1]});assert.equal(audit.crs[0].declaration.properties.name,raw.crs.properties.name);
});

test('compact production descriptor derives provenance and refuses missing names and fake ISO sentinels',async()=>{
 const {parseNaturalEarthDescriptor}=await import('../../scripts/osm/natural-earth-ingest');const f=await fixture();f.descriptor.schemaVersion=2;f.descriptor.profile='natural-earth-v5.1.1';
 for(const layer of f.descriptor.layers)for(const id of Object.keys(layer.mapping)){delete layer.mapping[id].sources;delete layer.mapping[id].boundaryRevision;}
 const parsed=parseNaturalEarthDescriptor(f.descriptor);assert.equal(parsed.layers[0].mapping.country.sources[0].name,'Natural Earth');assert.equal(parsed.layers[0].mapping.country.regionId,'region:v1:country');
 for(const change of [{name:''},{countryCode:'-99'}]){const bad=structuredClone(f.descriptor);Object.assign(bad.layers[0].mapping.country,change);assert.throws(()=>parseNaturalEarthDescriptor(bad));}
});


test('whole-feature partitions feed compact preparation and all-shard membership with aggregate budgets',async()=>{
 const f=await fixture();f.descriptor.partitions=[{level:0,providerIds:['country']},{level:1,providerIds:['state']}];await writeFile(f.input,JSON.stringify(f.descriptor));
 const limits={maxVertices:15,maxTotalVertices:20};await ingestSyntheticNaturalEarth(f.input,f.out,limits);
 const prep=JSON.parse(await readFile(join(f.out,'preparation.json'),'utf8'));assert.equal(prep.schemaVersion,2);assert.equal(prep.boundaries.length,2);assert.equal(prep.boundaries[0].mapping,undefined);
 const country=JSON.parse(await readFile(join(f.out,'boundaries-0.geojson'),'utf8'));assert.equal(country.features[0].geometry.coordinates.length,2);assert.equal(country.features[0].geometry.coordinates[0].length,2);
 const prepared=join(f.dir,'prepared');await prepareGeographicCoverage(join(f.out,'preparation.json'),prepared,limits);
 const shardManifest=JSON.parse(await readFile(join(prepared,'boundary-shards.json'),'utf8'));
 const row={placeId:'place:v1:osm:node:1',name:'Park',category:'park',latitude:1,longitude:1,accessEvidence:{status:'unknown'},sources:[source],caveats:[],catalogueRevision:'synthetic-only',sourceCompleteness:1,regionIds:[]};const body=JSON.stringify(row)+'\n';await writeFile(join(prepared,'candidates.jsonl'),body);
 const descriptor={...shardManifest,catalogueRevision:'synthetic-only',candidates:{path:'candidates.jsonl',bytes:Buffer.byteLength(body),sha256:createHash('sha256').update(body).digest('hex')}};await writeFile(join(prepared,'membership.json'),JSON.stringify(descriptor));
 const result=await buildBoundaryMetadata(join(prepared,'membership.json'),join(f.dir,'members'),limits);assert.equal(result.unknownCountryCandidates,0);const enriched=JSON.parse((await readFile(join(f.dir,'members','candidates.jsonl'),'utf8')).trim());assert.deepEqual(enriched.regionIds,['region:v1:country','region:v1:state']);
 await assert.rejects(buildBoundaryMetadata(join(prepared,'membership.json'),join(f.dir,'too-small'),{...limits,maxTotalVertices:19}),/Aggregate vertex/);
 await assert.rejects(prepareGeographicCoverage(join(f.out,'preparation.json'),join(f.dir,'prep-small'),{...limits,maxTotalVertices:19}),/Aggregate vertex/);
});

test('partition provider inventory refuses omissions, duplicates, unknown keys and split features',async()=>{
 for(const partitions of [[{level:0,providerIds:['country']}],[{level:0,providerIds:['country','country']},{level:1,providerIds:['state']}],[{level:0,providerIds:['country']},{level:1,providerIds:['unknown']}]] ){
 const f=await fixture();f.descriptor.partitions=partitions;await writeFile(f.input,JSON.stringify(f.descriptor));await assert.rejects(ingestSyntheticNaturalEarth(f.input,f.out,{maxVertices:15,maxTotalVertices:20}),/partition provider/i);await assert.rejects(access(join(f.out,'complete.json')));}
 const f=await fixture();f.descriptor.partitions=[{level:0,providerIds:['country']},{level:1,providerIds:['state']}];await writeFile(f.input,JSON.stringify(f.descriptor));await assert.rejects(ingestSyntheticNaturalEarth(f.input,f.out,{maxVertices:14,maxTotalVertices:20}),/Vertex budget/);
});

test('explicit unresolved provider identities retain exact source residuals without completion',async()=>{
 const f=await fixture();delete f.descriptor.layers[1].mapping.state;f.descriptor.layers[1].unresolved=[{providerId:'state',reason:'missing-name'}];f.descriptor.partitions=[{level:0,providerIds:['country']},{level:1,providerIds:['state']}];await writeFile(f.input,JSON.stringify(f.descriptor));await assert.rejects(ingestSyntheticNaturalEarth(f.input,f.out),/Unresolved identity/);const report=JSON.parse(await readFile(join(f.out,'identity-residuals.json'),'utf8'));assert.equal(report.sourceFeatures,2);assert.deepEqual(report.residuals,[{level:1,providerId:'state',reason:'missing-name'}]);await assert.rejects(access(join(f.out,'complete.json')));
});


test('legacy duplicate normalization preserves its normalized vertex ceiling',async()=>{const f=await fixture(),layer=f.descriptor.layers[0],path=join(f.dir,layer.input.path),raw=JSON.parse(await readFile(path,'utf8'));raw.features[0].geometry.coordinates[0][0].splice(1,0,[0,0]);const body=Buffer.from(JSON.stringify(raw));await writeFile(path,body);Object.assign(layer.input,{bytes:body.length,sha256:createHash('sha256').update(body).digest('hex'),gitBlobSha1:createHash('sha1').update(`blob ${body.length}\0`).update(body).digest('hex')});f.descriptor.geometryPolicy='remove-consecutive-identical';await writeFile(f.input,JSON.stringify(f.descriptor));const result=await ingestSyntheticNaturalEarth(f.input,f.out,{maxVertices:20});assert.equal(result.originalVertices,21);assert.equal(result.vertices,20);});

test('opt-in unknown identities preserve exact geometry and conservatively suppress membership across all shards',async()=>{
 for(const level of [0,1]){
  const f=await fixture(),layer=f.descriptor.layers[level],raw=JSON.parse(await readFile(join(f.dir,layer.input.path),'utf8'));
  const unknownGeometry={type:'MultiPolygon',coordinates:[[ring(1,1,2,2),ring(1.3,1.3,1.7,1.7)],[ring(30,0,31,1)]]};
  raw.features.push({type:'Feature',properties:{fixture_id:'unknown'},geometry:unknownGeometry});
  const bytes=Buffer.from(JSON.stringify(raw));await writeFile(join(f.dir,layer.input.path),bytes);Object.assign(layer.input,{bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),gitBlobSha1:createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex')});
  layer.unresolved=[{providerId:'unknown',reason:'country-assignment'}];f.descriptor.unresolvedIdentityPolicy='preserve-unknown';
  f.descriptor.partitions=[{level:0,providerIds:['country']},{level:1,providerIds:['state']},{level,providerIds:['unknown']}];await writeFile(f.input,JSON.stringify(f.descriptor));
  const complete=await ingestSyntheticNaturalEarth(f.input,f.out);assert.equal(complete.sourceFeatures,3);assert.equal(complete.unresolvedFeatures,1);assert.equal(complete.vertices,35);
  const shard=JSON.parse(await readFile(join(f.out,'boundaries-2.geojson'),'utf8'));assert.deepEqual(shard.features[0].geometry,unknownGeometry);assert.equal(shard.features[0].properties.name,undefined);assert.equal(shard.features[0].properties.countryCode,undefined);assert.equal(shard.features[0].properties.sourceLayer,level);
  const prepared=join(f.dir,'prepared');await prepareGeographicCoverage(join(f.out,'preparation.json'),prepared);assert.equal(await readFile(join(prepared,'footprints.jsonl'),'utf8'),'');assert.deepEqual(JSON.parse(await readFile(join(prepared,'boundaries-2.geojson'),'utf8')),shard);
  const manifest=JSON.parse(await readFile(join(prepared,'boundary-shards.json'),'utf8'));
  const points=[[1.1,1.1],[1,1.1],[1.5,1.5],[0.5,0.5],[30.5,0.5],[40,40]];
  const rows=points.map(([longitude,latitude],i)=>({placeId:`place:v1:osm:node:${i+1}`,name:`Point ${i}`,category:'park',latitude,longitude,accessEvidence:{status:'unknown'},sources:[source],caveats:[],catalogueRevision:'synthetic-only',sourceCompleteness:1,regionIds:[]}));
  const body=rows.map(r=>JSON.stringify(r)+'\n').join('');await writeFile(join(prepared,'candidates.jsonl'),body);await writeFile(join(prepared,'membership.json'),JSON.stringify({...manifest,catalogueRevision:'synthetic-only',candidates:{path:'candidates.jsonl',bytes:Buffer.byteLength(body),sha256:createHash('sha256').update(body).digest('hex')}}));
  const members=join(f.dir,'members');await buildBoundaryMetadata(join(prepared,'membership.json'),members);
  const enriched=(await readFile(join(members,'candidates.jsonl'),'utf8')).trim().split('\n').map(x=>JSON.parse(x));
  const known=['region:v1:country','region:v1:state'];assert.deepEqual(enriched.map(r=>r.regionIds),[level?['region:v1:country']:[],level?['region:v1:country']:[],known,known,[],[]]);assert.equal(enriched.length,rows.length);
  assert.deepEqual((await readFile(join(members,'regions.jsonl'),'utf8')).trim().split('\n').map(x=>JSON.parse(x).regionId),known);assert.equal(await readFile(join(members,'footprints.jsonl'),'utf8'),'');
  const bad=structuredClone(manifest);bad.boundaries[2].regionIds=bad.boundaries[2].unresolvedBoundaryIds;delete bad.boundaries[2].unresolvedBoundaryIds;await writeFile(join(prepared,'bad.json'),JSON.stringify({...bad,extractions:[],intendedCells:[]}));await assert.rejects(prepareGeographicCoverage(join(prepared,'bad.json'),join(f.dir,'bad')));
 }
});

test('unknown preservation requires explicit partitions and exact unresolved inventory',async()=>{
 for(const mode of ['no-partitions','missing','duplicate','conflict']){
  const f=await fixture();f.descriptor.unresolvedIdentityPolicy='preserve-unknown';f.descriptor.layers[1].unresolved=[{providerId:'state',reason:'missing-name'}];if(mode!=='conflict')delete f.descriptor.layers[1].mapping.state;
  if(mode!=='no-partitions')f.descriptor.partitions=[{level:0,providerIds:['country']},{level:1,providerIds:mode==='missing'?['bogus']:['state']}];
  if(mode==='duplicate')f.descriptor.layers[1].unresolved.push({providerId:'state',reason:'region-identity'});await writeFile(f.input,JSON.stringify(f.descriptor));await assert.rejects(ingestSyntheticNaturalEarth(f.input,f.out));await assert.rejects(access(join(f.out,'complete.json')));
 }
});

test('unresolved shard identity rejects contradictory levels and provider identity and meters inventory setup',async()=>{
 const {shardGeometry}=await import('../../scripts/osm/partitioned-boundaries');
 const properties={kind:'unresolved-boundary',boundaryId:'unresolved:ne:0:country',providerId:'country',adminLevel:0,sourceLayer:0,boundaryRevision:'synthetic-only',sources:[source],reason:'country-assignment'};
 const raw=(props:unknown)=>({type:'FeatureCollection',features:[{type:'Feature',properties:props,geometry:{type:'Polygon',coordinates:[ring(0,0,2,2)]}}]});
 for(const mutation of [{adminLevel:1},{sourceLayer:1},{providerId:'other'},{boundaryId:'unresolved:ne:1:country'}])assert.throws(()=>shardGeometry(raw({...properties,...mutation}),[],new Set(),100,()=>{},[properties.boundaryId]),/Conflicting unresolved/);
 assert.equal(shardGeometry(raw(properties),[],new Set(),100,()=>{},[properties.boundaryId]).parsed.length,1);
 let ticks=0;assert.throws(()=>shardGeometry(raw(properties),Array.from({length:1000},(_,i)=>`region:v1:${i}`),new Set(),100,()=>{if(++ticks>5)throw new Error('Inventory budget');},[properties.boundaryId]),/Inventory budget/);assert.equal(ticks,6);
});

test('multipart bbox pruning preserves overlap, containment, touching and near-touch rejection',async()=>{
 const {validateMultipart}=await import('../../scripts/osm/geographic-geometry');
 const polygon=(a:number,b:number,c:number,d:number)=>[ring(a,b,c,d)] as [number,number][][];
 for(const part of [polygon(1,1,3,3),polygon(0.5,0.5,1.5,1.5),polygon(2,0,3,2),polygon(2+5e-11,0,3,2)])assert.throws(()=>validateMultipart([polygon(0,0,2,2),part],()=>{}),/multipart/);
 let work=0;const sparse=Array.from({length:100},(_,i)=>polygon(i*3,0,i*3+1,1));validateMultipart(sparse,()=>{if(++work>6000)throw new Error('Sparse multipart work');});assert.ok(work<6000);
 let ticks=0;assert.throws(()=>validateMultipart(sparse,()=>{if(++ticks>10)throw new Error('Box budget');}),/Box budget/);
});

test('explicit repeated-vertex policy extracts inward hole preserving existing holes and audit',async()=>{
 for(const offset of [0,2]){
 const f=await fixture(),layer=f.descriptor.layers[0],path=join(f.dir,layer.input.path),raw=JSON.parse(await readFile(path,'utf8'));
 const originalExterior=[[0,0],[2,1],[1,2],[0,0],[0,10],[10,10],[10,0],[0,0]];
 const open=originalExterior.slice(0,-1),rotated=[...open.slice(offset),...open.slice(0,offset)],exterior=[...rotated,rotated[0]];
 raw.features[0].geometry={type:'Polygon',coordinates:[exterior,ring(4,4,5,5),ring(7,7,8,8)]};
 const b=Buffer.from(JSON.stringify(raw));await writeFile(path,b);Object.assign(layer.input,{bytes:b.length,sha256:createHash('sha256').update(b).digest('hex'),gitBlobSha1:createHash('sha1').update(`blob ${b.length}\0`).update(b).digest('hex')});
 await writeFile(f.input,JSON.stringify(f.descriptor));await assert.rejects(ingestSyntheticNaturalEarth(f.input,f.out),/intersect/i);
 f.descriptor.repeatedVertexPolicy='extract-tangent-holes';await writeFile(f.input,JSON.stringify(f.descriptor));await ingestSyntheticNaturalEarth(f.input,f.out);
 const normalized=JSON.parse(await readFile(join(f.out,'boundaries.geojson'),'utf8')),rings=normalized.features[0].geometry.coordinates;
 assert.equal(rings.length,4);assert.deepEqual(directedEdges(rings),directedEdges(raw.features[0].geometry.coordinates));assert.deepEqual(rings.slice(1,3),[ring(4,4,5,5),ring(7,7,8,8)]);
 const {boundaries,contains}=await import('../../scripts/osm/geographic-geometry');const parsed=boundaries(normalized,10000,()=>{});
 assert.equal(contains([1,1],parsed[0],()=>{}),0);assert.equal(contains([3,3],parsed[0],()=>{}),1);assert.equal(contains([0,0],parsed[0],()=>{}),-1);
 const audit=JSON.parse(await readFile(join(f.out,'audit.json'),'utf8'));assert.equal(audit.transformations[0].kind,'extract-tangent-hole');assert.deepEqual(audit.transformations[0].repeatedPositionIndices,offset===0?[0,3]:[1,5]);assert.equal(audit.transformations[0].orderedEdgesPreserved,true);
 await prepareGeographicCoverage(join(f.out,'preparation.json'),join(f.dir,'prepared'));
 }
});

test('repeated-vertex opt-in still rejects lobes, multiple repeats and interference with existing holes',async()=>{
 for(const [exterior,holes] of [
  [[[0,0],[2,0],[2,2],[0,0],[-2,0],[-2,-2],[0,0]],[]],
  [[[0,0],[2,1],[1,2],[0,0],[3,1],[1,3],[0,0],[0,10],[10,10],[10,0],[0,0]],[]],
  [[[0,0],[2,1],[1,2],[0,0],[0,10],[10,10],[10,0],[0,0]],[ring(.9,.9,1.1,1.1)]],
  [[[0,0],[-2,1],[-1,2],[0,0],[0,10],[10,10],[10,0],[0,0]],[]],
 ] as [number[][],number[][][]][]){
  const f=await fixture(),layer=f.descriptor.layers[0],path=join(f.dir,layer.input.path),raw=JSON.parse(await readFile(path,'utf8'));
  raw.features[0].geometry={type:'Polygon',coordinates:[exterior,...holes]};const body=Buffer.from(JSON.stringify(raw));await writeFile(path,body);Object.assign(layer.input,{bytes:body.length,sha256:createHash('sha256').update(body).digest('hex'),gitBlobSha1:createHash('sha1').update(`blob ${body.length}\0`).update(body).digest('hex')});
  f.descriptor.repeatedVertexPolicy='extract-tangent-holes';await writeFile(f.input,JSON.stringify(f.descriptor));await assert.rejects(ingestSyntheticNaturalEarth(f.input,f.out),/unsupported|hole|intersect/i);await assert.rejects(access(join(f.out,'complete.json')));
 }
});

test('combined duplicate and tangent-hole policies label indices after consecutive deduplication',async()=>{
 const f=await fixture(),layer=f.descriptor.layers[0],path=join(f.dir,layer.input.path),raw=JSON.parse(await readFile(path,'utf8'));
 raw.features[0].geometry={type:'Polygon',coordinates:[[[0,0],[0,0],[2,1],[1,2],[0,0],[0,10],[10,10],[10,0],[0,0]]]};
 const body=Buffer.from(JSON.stringify(raw));await writeFile(path,body);Object.assign(layer.input,{bytes:body.length,sha256:createHash('sha256').update(body).digest('hex'),gitBlobSha1:createHash('sha1').update(`blob ${body.length}\0`).update(body).digest('hex')});
 f.descriptor.geometryPolicy='remove-consecutive-identical';f.descriptor.repeatedVertexPolicy='extract-tangent-holes';await writeFile(f.input,JSON.stringify(f.descriptor));await ingestSyntheticNaturalEarth(f.input,f.out);
 const audit=JSON.parse(await readFile(join(f.out,'audit.json'),'utf8'));assert.deepEqual(audit.transformations[0].removedPositionIndices,[1]);assert.equal(audit.transformations[1].indexBasis,'after-consecutive-identical-removal');assert.deepEqual(audit.transformations[1].repeatedPositionIndices,[0,3]);
 const normalized=JSON.parse(await readFile(join(f.out,'boundaries.geojson'),'utf8'));assert.equal(normalized.features[0].geometry.coordinates.length,2);assert.deepEqual(directedEdges(normalized.features[0].geometry.coordinates),directedEdges([raw.features[0].geometry.coordinates[0].filter((p:number[],i:number,r:number[][])=>i===0||p[0]!==r[i-1][0]||p[1]!==r[i-1][1])]));
});

test('offline ingestion accepts explicit 200M comparison ceiling and rejects larger budgets',async()=>{
 const f=await fixture();await assert.rejects(ingestSyntheticNaturalEarth(f.input,f.out,{maxComparisons:200000001}),/Unsupported budget/);await assert.rejects(access(join(f.out,'complete.json')));await ingestSyntheticNaturalEarth(f.input,f.out,{maxComparisons:200000000});
});
