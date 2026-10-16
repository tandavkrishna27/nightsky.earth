import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,access,realpath,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {buildBoundaryMetadata,boundedContains,indexedBoundaryContains} from '../../scripts/osm/boundary-metadata';
import {contains} from '../../scripts/osm/geographic-geometry';
const source={name:'Synthetic',url:'https://example.org',attribution:'Synthetic',dataClass:'catalog'};
const fixtureRoots:string[]=[];
after(async()=>{for(const root of fixtureRoots)await rm(root,{recursive:true,force:true});});
const ring=(a:number,b:number,c:number,d:number)=>[[a,b],[c,b],[c,d],[a,d],[a,b]];
test('boundary bounds prune distant queries while preserving holes, parts and border tolerance',()=>{
 const boundary:any={region:{},polygons:[[ring(0,0,10,10),ring(2,2,4,4)],[ring(20,0,21,1)]]};
 let ticks=0;const query=boundedContains(boundary,()=>{ticks++;});
 for(const p of [[-1,0],[-5e-11,1],[-2e-10,1],[0,0],[1,1],[3,3],[2,3],[15,0],[20.5,.5],[21+5e-11,.5]])assert.equal(query(p as [number,number]),contains(p as [number,number],boundary,()=>{}));
 ticks=0;assert.equal(query([100,50]),0);assert.equal(ticks,1);
});
test('bounded classifier matches exact classification across dateline parts and unresolved identities',()=>{
 const shapes=[[[ring(-180,-5,-170,5)],[ring(170,-5,180,5)]],[[ring(-4,-4,4,4),ring(-2,-2,2,2)]]];
 for(const polygons of shapes)for(const region of [{regionId:'region:v1:known'},{kind:'unresolved-boundary',boundaryId:'unresolved:ne:0:X'}]){
  const boundary:any={region,polygons},query=boundedContains(boundary,()=>{});
  for(let x=-180;x<=180;x+=2.5)for(let y=-6;y<=6;y+=.5)assert.equal(query([x,y]),contains([x,y],boundary,()=>{}));
  for(const x of [-180,-170,-4,-2,2,4,170,180])for(const delta of [-2e-10,-5e-11,0,5e-11,2e-10])assert.equal(query([x+delta,0]),contains([x+delta,0],boundary,()=>{}));
 }
});
const indexedResults=(hits:ReturnType<ReturnType<typeof indexedBoundaryContains>>)=>hits.map(({index,status})=>[index,status]);
test('spatial index preserves linear feature order, holes, contacts, polar and dateline uncertainty',()=>{
 const geometry:any[]=[
  {region:{regionId:'country',adminLevel:0},polygons:[[ring(-10,-10,10,10),ring(-2,-2,2,2)]]},
  {region:{regionId:'state',adminLevel:1},polygons:[[ring(0,0,4,4)]]},
  {region:{kind:'unresolved-boundary',boundaryId:'unresolved:ne:0:X',adminLevel:0},polygons:[[ring(3,3,6,6)]]},
  {region:{regionId:'dateline'},polygons:[[ring(170,-5,180,5)],[ring(-180,-5,-170,5)]]},
  {region:{regionId:'polar'},polygons:[[ring(-5,85,5,90)],[ring(-5,-90,5,-85)]]},
  {region:{regionId:'tangent-hole'},polygons:[[ring(20,0,30,10),[[20,5],[23,3],[23,7],[20,5]]]]},
  ...Array.from({length:20},(_,i)=>({region:{regionId:`far-${i}`},polygons:[[ring(40+i*2,40,41+i*2,41)]]})),
 ];
 const linear=geometry.map(b=>boundedContains(b,()=>{}));
 const indexed=indexedBoundaryContains(geometry,()=>{});
 const points:[number,number][]=[];
 for(let x=-180;x<=180;x+=7.5)for(let y=-90;y<=90;y+=7.5)points.push([x,y]);
 for(const [x,y] of [[-180,0],[180,0],[-170,0],[170,0],[-10,0],[10,0],[-2,0],[2,0],[3,4],[20,5],[23,5],[0,85],[0,90],[0,-90],[0,-85]]){
  for(const delta of [-2e-10,-5e-11,0,5e-11,2e-10])points.push([x+delta,y],[x,y+delta]);
 }
 for(const point of points){
  const expected=linear.map((query,index)=>[index,query(point)]).filter(([,status])=>status!==0);
  const hits=indexed(point);assert.deepEqual(indexedResults(hits),expected,`query ${point}`);
  assert.ok(hits.every(hit=>hit.b===geometry[hit.index]));
 }
});
test('spatial query work prunes 4854 disjoint features with construction charged separately',()=>{
 const geometry:any[]=Array.from({length:4854},(_,index)=>{
  const x=-170+(index%100)*3.3,y=-80+Math.floor(index/100)*3.2;
  return {region:{regionId:String(index)},polygons:[[ring(x,y,x+.2,y+.2)]]};
 });
 let ticks=0;const indexed=indexedBoundaryContains(geometry,()=>{ticks++;}),buildTicks=ticks;
 assert.ok(buildTicks>geometry.length*5,'construction includes every vertex and tree work');
 assert.ok(buildTicks<500000,'construction stays within a finite deterministic test budget');
 const linear=geometry.map(b=>boundedContains(b,()=>{}));ticks=0;
 for(let i=0;i<64;i++){
  const index=i*73,x=-170+(index%100)*3.3+.1,y=-80+Math.floor(index/100)*3.2+.1;
  assert.deepEqual(indexedResults(indexed([x,y])),linear.map((query,j)=>[j,query([x,y])]).filter(([,status])=>status!==0));
 }
 assert.ok(ticks<64*256,`query work ${ticks} must avoid the old ${64*4854} feature visits`);
});
test('empty, singleton and identical-centre trees preserve hits and propagate work failures',()=>{
 const boundary:any={region:{regionId:'same'},polygons:[[ring(-1,-1,1,1)]]};
 assert.deepEqual(indexedBoundaryContains([],()=>{})([0,0]),[]);
 assert.deepEqual(indexedResults(indexedBoundaryContains([boundary],()=>{})([0,0])),[[0,1]]);
 const geometry=Array.from({length:40},()=>boundary),expected=geometry.map((_,i)=>[i,1]);
 let ticks=0;const indexed=indexedBoundaryContains(geometry,()=>{ticks++;});
 assert.deepEqual(indexedResults(indexed([0,0])),expected);
 assert.throws(()=>indexed([NaN,0]),/Finite/);assert.throws(()=>indexed([0,Infinity]),/Finite/);
 assert.throws(()=>indexedBoundaryContains(geometry,()=>{throw new Error('build-stop');}),/build-stop/);
 let remaining=Infinity;const budgeted=indexedBoundaryContains(geometry,()=>{if(--remaining<0)throw new Error('query-stop');});
 remaining=0;assert.throws(()=>budgeted([0,0]),/query-stop/);
 remaining=8;assert.throws(()=>budgeted([0,0]),/query-stop/);
 remaining=Infinity;assert.deepEqual(indexedResults(budgeted([0,0])),expected);
 assert.ok(ticks>0);
});
const feature=(id:string,level:number,coordinates:any,countryCode='IND')=>({type:'Feature',properties:{regionId:`region:v1:${id}`,name:id,countryCode,adminLevel:level,boundaryRevision:'fixture',sources:[source]},geometry:{type:'Polygon',coordinates}});
const row=(id:number,x:number,y:number)=>({placeId:`place:v1:osm:node:${id}`,name:'Park',category:'park',latitude:y,longitude:x,accessEvidence:{status:'unknown'},sources:[source],caveats:[],catalogueRevision:'fixture',sourceCompleteness:1,regionIds:[]});
async function fixture(features:any[],rows:any[]){const dir=await realpath(await mkdtemp(join(await realpath(tmpdir()),'boundary-')));fixtureRoots.push(dir);const pins:any={};for(const [name,data] of Object.entries({'boundaries.geojson':JSON.stringify({type:'FeatureCollection',features}),'candidates.jsonl':rows.map(r=>JSON.stringify(r)+'\n').join('')})){await writeFile(join(dir,name),data);pins[name]={path:name,bytes:Buffer.byteLength(data),sha256:createHash('sha256').update(data).digest('hex')};}const manifest={schemaVersion:1,catalogueRevision:'fixture',boundaries:pins['boundaries.geojson'],candidates:pins['candidates.jsonl']};await writeFile(join(dir,'input.json'),JSON.stringify(manifest));return {dir,manifest,input:join(dir,'input.json'),output:join(dir,'out')};}
async function values(path:string){return (await readFile(path,'utf8')).trim().split('\n').filter(Boolean).map(x=>JSON.parse(x));}
test('unique interiors retain country/state; holes, borders, overlap and missing country stay unknown',async()=>{const f=await fixture([feature('country',0,[ring(0,0,10,10),ring(3,3,5,5)]),feature('state',1,[ring(0,0,3,3)]),feature('overlap',0,[ring(7,7,9,9)],'USA')],[row(1,1,1),row(2,4,4),row(3,0,1),row(4,8,8),row(5,20,20)]);await buildBoundaryMetadata(f.input,f.output);const rows=await values(join(f.output,'candidates.jsonl'));assert.deepEqual(rows.map(r=>r.regionIds),[['region:v1:country','region:v1:state'],[],[],[],[]]);assert.equal(rows[0].countryCode,'IND');assert.equal(rows[3].countryCode,undefined);assert.equal(await readFile(join(f.output,'footprints.jsonl'),'utf8'),'');await assert.rejects(buildBoundaryMetadata(f.input,f.output),/exist/i);});
test('split dateline islands do not fill the longitude gap; unsplit edges reject',async()=>{const island=feature('islands',0,[]);island.geometry={type:'MultiPolygon',coordinates:[[ring(170,-5,180,5)],[ring(-180,-5,-170,5)]]} as any;const f=await fixture([island],[row(1,175,0),row(2,-175,0),row(3,0,0)]);await buildBoundaryMetadata(f.input,f.output);assert.deepEqual((await values(join(f.output,'candidates.jsonl'))).map(r=>r.countryCode),['IND','IND',undefined]);const bad=await fixture([feature('bad',0,[ring(-170,0,170,10)])],[]);await assert.rejects(buildBoundaryMetadata(bad.input,bad.output),/dateline/i);});
test('checksum, traversal, malformed geometry and bounded work fail before completion',async()=>{for(const mode of ['checksum','path','geometry','budget']){const f=await fixture([feature('a',0,[ring(0,0,10,10)])],[row(1,1,1)]);if(mode==='checksum')f.manifest.boundaries.sha256='0'.repeat(64);if(mode==='path')f.manifest.boundaries.path='../boundaries.geojson';if(mode==='geometry'){await writeFile(join(f.dir,'boundaries.geojson'),'{}');}await writeFile(f.input,JSON.stringify(f.manifest));await assert.rejects(buildBoundaryMetadata(f.input,f.output,mode==='budget'?{maxComparisons:1}:{}));await assert.rejects(access(join(f.output,'complete.json')));}});
test('conflicting preassigned membership rejects without completion',async()=>{for(const patch of [{countryCode:'USA'},{regionIds:['region:v1:other']}]){const f=await fixture([feature('country',0,[ring(0,0,10,10)])],[{...row(1,1,1),...patch}]);await assert.rejects(buildBoundaryMetadata(f.input,f.output),/conflict/i);await assert.rejects(access(join(f.output,'complete.json')));}});
test('enriched output is consumable by the source bridge with no admitted footprints',async()=>{const {buildSourceCatalogue}=await import('../../scripts/osm/build-source-catalogue');const {loadCatalogueFiles}=await import('../../server/places/catalogueFiles');const f=await fixture([feature('country',0,[ring(0,0,10,10)])],[row(1,1,1)]);await buildBoundaryMetadata(f.input,f.output);const result=await buildSourceCatalogue({producerDir:f.output,regions:join(f.output,'regions.jsonl'),footprints:join(f.output,'footprints.jsonl')},join(f.dir,'catalogue'));const loaded=await loadCatalogueFiles(result.path,{expectedSha256:result.sha256});assert.ok(loaded);assert.equal(loaded.root.trees.membership.rows,1);assert.equal(loaded.root.trees.footprints.rows,0);});

test('malformed rings reject even when their local file pin is valid',async()=>{for(const rings of [[[[0,0],[10,10],[0,10],[10,0],[0,0]]],[ring(0,0,10,10),ring(20,20,21,21)],[ring(0,0,10,10),ring(2,2,8,8),ring(3,3,4,4)]]){const f=await fixture([feature('invalid',0,rings)],[]);await assert.rejects(buildBoundaryMetadata(f.input,f.output),/ring|hole/i);}});
test('candidate pin mismatch and aborted work never create a completion marker',async()=>{const f=await fixture([feature('country',0,[ring(0,0,10,10)])],[row(1,1,1)]);await writeFile(join(f.dir,'candidates.jsonl'),JSON.stringify(row(1,2,1))+'\n');await assert.rejects(buildBoundaryMetadata(f.input,f.output),/digest/i);await assert.rejects(access(join(f.output,'complete.json')));const controller=new AbortController();controller.abort();await assert.rejects(buildBoundaryMetadata(f.input,join(f.dir,'abort'),{signal:controller.signal}));});
test('completion descriptor consumes the output budget',async()=>{const f=await fixture([],[]);await assert.rejects(buildBoundaryMetadata(f.input,f.output,{maxOutputBytes:1}),/output byte budget/i);await assert.rejects(access(join(f.output,'complete.json')));});
test('boundary mutation during candidate output rejects before completion',async()=>{const {existsSync,writeFileSync}=await import('node:fs');const f=await fixture([feature('country',0,[ring(0,0,10,10)])],[row(1,1,1)]);let changed=false;const signal={throwIfAborted(){if(!changed&&existsSync(join(f.output,'candidates.jsonl'))){changed=true;writeFileSync(join(f.dir,'boundaries.geojson'),'{}');}}} as AbortSignal;await assert.rejects(buildBoundaryMetadata(f.input,f.output,{signal}),/size|pin|checksum/i);assert.equal(changed,true);await assert.rejects(access(join(f.output,'complete.json')));});


async function shardFixture(){const features=[feature('country',0,[ring(0,0,10,10)]),feature('overlap',0,[ring(7,7,9,9)],'USA'),feature('state',1,[ring(0,0,3,3)])];const f=await fixture(features,[row(1,1,1),row(2,8,8),row(3,0,1)]);const shards=[];for(const [index,item] of features.entries()){const body=JSON.stringify({type:'FeatureCollection',features:[item]}),path=`shard-${index}.json`;await writeFile(join(f.dir,path),body);shards.push({input:{path,bytes:Buffer.byteLength(body),sha256:createHash('sha256').update(body).digest('hex')},regionIds:[item.properties.regionId]});}const manifest={schemaVersion:2,catalogueRevision:'fixture',boundaries:shards,candidates:f.manifest.candidates};await writeFile(f.input,JSON.stringify(manifest));return {...f,manifest};}

test('cross-shard country overlap and borders remain unknown, unique state spans shards',async()=>{const f=await shardFixture();await buildBoundaryMetadata(f.input,f.output,{maxVertices:5,maxTotalVertices:15});assert.deepEqual((await values(join(f.output,'candidates.jsonl'))).map(r=>r.regionIds),[['region:v1:country','region:v1:state'],[],[]]);});

test('shard inventories, aggregate bytes/work/vertices, output and input mutation fail closed',async()=>{for(const mode of ['duplicate','omitted','wrong','bytes','work','vertices','output','mutation']){const f=await shardFixture();if(mode==='duplicate')f.manifest.boundaries.push(f.manifest.boundaries[0]);if(mode==='omitted')f.manifest.boundaries[0].regionIds=[];if(mode==='wrong')f.manifest.boundaries[0].regionIds=['region:v1:wrong'];await writeFile(f.input,JSON.stringify(f.manifest));let changed=false;const {existsSync,writeFileSync}=await import('node:fs');const signal={throwIfAborted(){if(mode==='mutation'&&!changed&&existsSync(join(f.output,'candidates.jsonl'))){changed=true;writeFileSync(join(f.dir,'shard-2.json'),'{}');}}} as AbortSignal;await assert.rejects(buildBoundaryMetadata(f.input,f.output,{maxVertices:5,maxTotalVertices:mode==='vertices'?14:20,...(mode==='bytes'?{maxBoundaryBytes:f.manifest.boundaries[0].input.bytes}:{}),...(mode==='work'?{maxComparisons:50}:{}),...(mode==='output'?{maxOutputBytes:1}:{}),signal}));await assert.rejects(access(join(f.output,'complete.json')));if(mode==='mutation')assert.equal(changed,true);}});

test('offline membership accepts explicit 200M comparison ceiling and rejects larger budgets',async()=>{
 const f=await fixture([feature('country',0,[ring(0,0,10,10)])],[row(1,1,1)]);await assert.rejects(buildBoundaryMetadata(f.input,f.output,{maxComparisons:200000001}),/Unsupported budget/);await assert.rejects(access(join(f.output,'complete.json')));await buildBoundaryMetadata(f.input,f.output,{maxComparisons:200000000});
});

test('full feature-count membership avoids visiting every distant feature for each candidate',async()=>{
 const features=Array.from({length:4854},(_,i)=>{
  const x=-170+(i%100)*3.3,y=-80+Math.floor(i/100)*3.2;
  return feature(`cell-${i}`,0,[ring(x,y,x+.2,y+.2)]);
 });
 const f=await fixture(features,Array.from({length:256},(_,i)=>row(i,-169.9,-79.9)));
 await buildBoundaryMetadata(f.input,f.output,{maxComparisons:1000000});
 const enriched=await values(join(f.output,'candidates.jsonl'));
 assert.equal(enriched.length,256);
 assert.ok(enriched.every(item=>item.countryCode==='IND'&&item.regionIds.join(',')==='region:v1:cell-0'));
});
