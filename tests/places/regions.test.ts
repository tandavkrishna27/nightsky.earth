import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pointInAdministrativeGeometry, createRegionIndex, assignAdministrativeRegionIds, compileAdministrativeGeometry,compileAdministrativeBoundaries } from '../../server/places/regions';
import { buildGlobalCatalogue } from '../../scripts/osm/build-global-catalogue';
import { loadCatalogueFiles } from '../../server/places/catalogueFiles';
import { mkdtemp,rm } from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const source={name:'Synthetic boundary',url:'https://example.org/boundary',attribution:'Synthetic, no admitted coverage',dataClass:'catalog' as const,vintage:'synthetic-2026',licenseUrl:'https://example.org/license'};
const region=(id:number,name:string,countryCode:string,adminLevel:0|1)=>({regionId:`region:v1:${id}`,name,countryCode,adminLevel,boundaryRevision:'boundary-test',sources:[source]});

const square = (x:number,y:number,size:number) => [[x,y],[x+size,y],[x+size,y+size],[x,y+size],[x,y]];
test('membershipHolesBordersAndDateline', () => {
  const geometry = {type:'Polygon',coordinates:[square(0,0,10),square(3,3,2)]};
  assert.equal(pointInAdministrativeGeometry([1,1],geometry),true);
  assert.equal(pointInAdministrativeGeometry([0,5],geometry),true);
  assert.equal(pointInAdministrativeGeometry([4,4],geometry),false);
  assert.equal(pointInAdministrativeGeometry([3,4],geometry),false);
  assert.equal(pointInAdministrativeGeometry([20,5],geometry),false);
  const dateline = {type:'MultiPolygon',coordinates:[[[[170,-10],[180,-10],[180,10],[170,10],[170,-10]]],[[[-180,-10],[-170,-10],[-170,10],[-180,10],[-180,-10]]]]};
  assert.equal(pointInAdministrativeGeometry([179,0],dateline),true);
  assert.equal(pointInAdministrativeGeometry([-179,0],dateline),true);
  assert.equal(pointInAdministrativeGeometry([0,0],dateline),false);
});
test('ambiguousNamesRequireSelection and ISO3 filters preserve pinned metadata',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'regions-'));
  try {
    const regions=[region(1,'Georgia','GEO',0),region(2,'Georgia','USA',1),region(3,'Springfield','USA',1),region(4,'Springfield','CAN',1)];
    const built=await buildGlobalCatalogue({catalogueRevision:'synthetic',candidates:[],regions,footprints:[]},dir,{maxRows:1,fanout:2});
    const index=createRegionIndex(await loadCatalogueFiles(built.path,{expectedSha256:built.sha256}));
    assert.deepEqual((await index.resolve({regionQuery:'  GEORGIA '})).map(r=>r.regionId),['region:v1:1','region:v1:2']);
    assert.deepEqual((await index.resolve({regionQuery:'Georgia',countryCode:'USA',adminLevel:1})).map(r=>r.regionId),['region:v1:2']);
    assert.equal((await index.resolve({regionQuery:'Springfield'})).length,2);
    assert.equal((await index.resolve({regionQuery:'Georgia'}))[0].sources[0].licenseUrl,'https://example.org/license');
    assert.deepEqual(await index.resolve({regionQuery:'unknown'}),[]);
    await assert.rejects(async()=>{for await(const _id of index.members('region:v1:unknown')){}},/unknown/i);
  }finally{await rm(dir,{recursive:true,force:true});}
});
test('build admission requires full licensed geometry and assigns IDs from point membership',()=>{
 const admitted={region:region(1,'Square','USA',1),geometry:{type:'Polygon' as const,coordinates:[square(0,0,10)]},geometryBasis:'full' as const};
 const compiled=compileAdministrativeBoundaries([admitted]);
 assert.deepEqual(assignAdministrativeRegionIds([1,1],compiled),['region:v1:1']);
 assert.deepEqual(assignAdministrativeRegionIds([30,30],compiled),[]);
 assert.throws(()=>compileAdministrativeBoundaries([{...admitted,geometryBasis:'simplified'} as any]),/full/i);
 assert.throws(()=>compileAdministrativeBoundaries([{...admitted,region:{...admitted.region,sources:[{...source,licenseUrl:undefined}]}}]),/license/i);
 assert.throws(()=>assignAdministrativeRegionIds([NaN,0],[]),/coordinate/i);
});
test('compiled full geometry snapshots inputs, exposes envelope and bounds admission work',()=>{
 const geometry={type:'Polygon',coordinates:[square(0,0,10)]};
 const compiled=compileAdministrativeGeometry(geometry);
 geometry.coordinates[0][1][0]=100;
 assert.equal(compiled.contains([20,1]),false);
 assert.equal(compiled.contains([1,1]),true);
 assert.deepEqual(compiled.bounds,{west:0,east:10,south:0,north:10});
 assert.ok(Object.isFrozen(compiled));assert.ok(Object.isFrozen(compiled.bounds));
 assert.throws(()=>compileAdministrativeGeometry(geometry,{maxVertices:4}),/vertex/i);
 assert.throws(()=>compileAdministrativeGeometry(geometry,{maxVertices:10001}),/limit/i);
 const ring=Array.from({length:5000},(_,i)=>[10*Math.cos(i*Math.PI/2500),10*Math.sin(i*Math.PI/2500)]);ring.push(ring[0]);
 assert.throws(()=>compileAdministrativeGeometry({type:'Polygon',coordinates:[ring]},{validationTimeoutMs:1}),/time limit/i);
});
test('multipolygon islands and explicit polar cuts use source Cartesian geometry', () => {
  assert.equal(pointInAdministrativeGeometry([31,1],{type:'MultiPolygon',coordinates:[[square(0,0,2)],[square(30,0,2)]]}),true);
  const polar={type:'Polygon',coordinates:[[[-180,80],[180,80],[180,90],[-180,90],[-180,80]]]};
  assert.equal(pointInAdministrativeGeometry([0,90],polar),true);
  assert.equal(pointInAdministrativeGeometry([0,-90],polar),false);
  assert.equal(pointInAdministrativeGeometry([0,60],polar),false);
});
test('high latitude horizontal boundaries follow GeoJSON Cartesian interpolation',()=>{
 const geometry={type:'Polygon',coordinates:[[[-40,70],[40,70],[40,80],[-40,80],[-40,70]]]};
 assert.equal(pointInAdministrativeGeometry([-30,69.9],geometry),false);
 assert.equal(pointInAdministrativeGeometry([-30,70.1],geometry),true);
 assert.equal(pointInAdministrativeGeometry([-30,70],geometry),true);
 assert.throws(()=>pointInAdministrativeGeometry([179,0],{type:'Polygon',coordinates:[[[170,-10],[-170,-10],[-170,10],[170,10],[170,-10]]]}),/antimeridian/i);
});
test('antimeridian equivalent longitudes and explicit south polar cut retain boundary membership',()=>{
 const west={type:'Polygon',coordinates:[[[-180,-10],[-170,-10],[-170,10],[-180,10],[-180,-10]]]};
 assert.equal(pointInAdministrativeGeometry([180,0],west),true);
 assert.equal(pointInAdministrativeGeometry([-180,0],west),true);
 const south={type:'Polygon',coordinates:[[[-180,-90],[180,-90],[180,-80],[-180,-80],[-180,-90]]]};
 assert.equal(pointInAdministrativeGeometry([45,-90],south),true);
 assert.equal(pointInAdministrativeGeometry([45,90],south),false);
});
test('invalid geometry fails closed', () => {
  for(const coordinates of [[[[0,0],[1,0],[1,1]]],[[[0,0],[181,0],[1,1],[0,0]]],[[[0,0],[NaN,0],[1,1],[0,0]]]]) {
    assert.throws(()=>pointInAdministrativeGeometry([0,0],{type:'Polygon',coordinates}));
  }
});
test('invalid topology fails closed even when another component contains the point',()=>{
 assert.throws(()=>pointInAdministrativeGeometry([1,1],{type:'MultiPolygon',coordinates:[[square(0,0,2)],[[[10,0],[14,4],[10,4],[13,0],[10,0]]]]}),/intersect/i);
 assert.throws(()=>pointInAdministrativeGeometry([1,1],{type:'Polygon',coordinates:[square(0,0,10),square(20,20,2)]}),/hole/i);
});
test('paged members reject unknown IDs and name lookup never silently returns a budget prefix',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'region-members-'));
 try{
  const regions=Array.from({length:7},(_,i)=>region(i+1,'Repeated','USA',1));
  const candidates=[1,2].map(id=>({placeId:`place:v1:osm:node:${id}`,name:`Point ${id}`,category:'park' as const,latitude:id,longitude:id,accessEvidence:{status:'unknown' as const},sources:[source],caveats:[],catalogueRevision:'synthetic',sourceCompleteness:1,regionIds:['region:v1:1']}));
  const built=await buildGlobalCatalogue({catalogueRevision:'synthetic',candidates,regions,footprints:[]},dir,{maxRows:1,fanout:2});
  const files=await loadCatalogueFiles(built.path,{expectedSha256:built.sha256}),index=createRegionIndex(files);
  const members=[];for await(const id of index.members('region:v1:1'))members.push(id);
  assert.deepEqual(members,['place:v1:osm:node:1','place:v1:osm:node:2']);
  assert.equal((await index.resolve({regionQuery:'Repeated'})).length,5);
  await assert.rejects(createRegionIndex(files,{maxLeaves:1}).resolve({regionQuery:'Repeated'}),/budget/i);
  assert.equal((await index.resolveKnownRegion('region:v1:7')).regionId,'region:v1:7');
  const none=[];for await(const id of index.members('region:v1:7'))none.push(id);assert.deepEqual(none,[]);
 }finally{await rm(dir,{recursive:true,force:true});}
});

test('one members operation shares metadata and membership leaf budget',async()=>{
 const {createCatalogueBudget,CatalogueBudgetStop}=await import('../../server/places/catalogueFiles');
 const budgets:unknown[]=[];
 const files={
  createBudget(options:any){const budget=createCatalogueBudget(options);budgets.push(budget);return budget;},
  async *walk(tree:string,{budget}:any){
   if(budget.leaves>=budget.maxLeaves){budget.stopReason='leaf-limit';return;}
   budget.leaves++;
   if(tree==='regions')yield {kind:'regions',rows:[region(1,'Square','USA',1)]};
   else yield {kind:'memberships',rows:[{key:'region:v1:1',placeId:'place:v1:osm:node:1'}]};
  }
 };
 const index=createRegionIndex(files as any,{maxLeaves:1});
 await assert.rejects(async()=>{for await(const _id of index.members('region:v1:1')){}},CatalogueBudgetStop);
 assert.equal(budgets.length,1);
});
