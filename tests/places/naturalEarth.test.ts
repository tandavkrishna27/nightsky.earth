import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,realpath,writeFile,readFile,access} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {ingestNaturalEarth,ingestSyntheticNaturalEarth} from '../../scripts/osm/natural-earth-ingest';
import {prepareGeographicCoverage} from '../../scripts/osm/prepare-geographic-coverage';
import {buildBoundaryMetadata} from '../../scripts/osm/boundary-metadata';
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
