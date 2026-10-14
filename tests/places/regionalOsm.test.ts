import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, dirname, basename } from 'node:path';
import { createHash } from 'node:crypto';
import { importOsmJson } from '../../server/places/importOsm';
import { loadRegionalOsmProvider, regionIntersectsRadius } from '../../server/places/regionalOsm';
async function cleanupRegionalFixture(dir:string) {
 const target=resolve(dir);
 assert.equal(dirname(target),resolve(tmpdir()),'Fixture cleanup must stay directly inside the system temp directory.');
 assert.ok(basename(target).startsWith('regional-osm-'),'Fixture cleanup requires the fixed regional-osm- prefix.');
 await rm(target,{recursive:true,force:true});
}
const sha = (s:string) => createHash('sha256').update(s).digest('hex');
test('regional routing includes dateline and polar caps', () => {
 assert.equal(regionIntersectsRadius({south:-1,north:1,west:-180,east:-179},0,179.9,30),true);
 assert.equal(regionIntersectsRadius({south:89,north:90,west:-100,east:-90},89.9,90,30),true);
 assert.equal(regionIntersectsRadius({south:20,north:21,west:20,east:21},0,0,30),false);
});
test('regional provider loads on demand, preserves vintage, bounds resident cache and rejects conflicts', async () => {
 const dir=await mkdtemp(join(tmpdir(),'regional-osm-'));
 try {
 const regions=[];
 for (const [id,lat,vintage] of [['a',0,'old'],['b',20,'new']] as const) {
  const index=importOsmJson({elements:[{type:'node',id:1,lat,lon:0,tags:{name:id,leisure:'park'}}]}, {vintage,coverage:id});
  const payload=JSON.stringify(index); await writeFile(join(dir,id+'.json'),payload);
  regions.push({id,path:id+'.json',sha256:sha(payload),bytes:Buffer.byteLength(payload),rows:1,vintage,source:index.source,coverage:id,bounds:{south:lat,north:lat,west:0,east:0}});
 }
 const manifest=JSON.stringify({schemaVersion:1,regions});await writeFile(join(dir,'manifest.json'),manifest);
 const provider=await loadRegionalOsmProvider(join(dir,'manifest.json'),{expectedSha256:sha(manifest),maxCacheRegions:1});
 assert.deepEqual(provider.stats().residentRegions,[]);
 const query={placeId:'place:v1:geonames:1',radiusKm:10,limit:5};
 const first=await provider.search(query,{place:{placeId:query.placeId,latitude:0,longitude:0}});
 assert.equal(first.candidates[0].sources[0].vintage,'old');
 assert.deepEqual(provider.stats().residentRegions,['a']);
 const second=await provider.search(query,{place:{placeId:query.placeId,latitude:20,longitude:0}});
 assert.equal(second.candidates[0].sources[0].vintage,'new');assert.deepEqual(provider.stats().residentRegions,['b']);
 assert.equal(provider.stats().loads,2);
 await writeFile(join(dir,'a.json'),'{}');
 await assert.rejects(provider.search(query,{place:{placeId:query.placeId,latitude:0,longitude:0}}),/checksum|byte/);
 } finally {await cleanupRegionalFixture(dir);}
});
test('manifest rejects traversal, count mismatches and bounded pending queries', async () => {
 const dir=await mkdtemp(join(tmpdir(),'regional-osm-safety-'));
 try {
 const index=importOsmJson({elements:[{type:'node',id:1,lat:0,lon:0,tags:{name:'park',leisure:'park'}}]}, {vintage:'v',coverage:'fixture'});const payload=JSON.stringify(index);await writeFile(join(dir,'a.json'),payload);
 const region={id:'a',path:'a.json',sha256:sha(payload),bytes:Buffer.byteLength(payload),rows:1,vintage:'v',source:index.source,coverage:'fixture',bounds:{south:0,north:0,west:0,east:0}};
 async function install(regions:unknown[]){const text=JSON.stringify({schemaVersion:1,regions});await writeFile(join(dir,'manifest.json'),text);return loadRegionalOsmProvider(join(dir,'manifest.json'),{expectedSha256:sha(text),maxQueuedQueries:1});}
 await assert.rejects(install([{...region,path:'../a.json'}]),/path/);
 const mismatch=await install([{...region,rows:2}]);const input={placeId:'place:v1:geonames:1',radiusKm:10,limit:5};const opts={place:{placeId:input.placeId,latitude:0,longitude:0}};
 await assert.rejects(mismatch.search(input,opts),/row count/);
 const provider=await install([region]);const first=provider.search(input,opts);await assert.rejects(provider.search(input,opts),/concurrency/);assert.equal((await first).candidates.length,1);
 }finally{await cleanupRegionalFixture(dir);}
});
test('overlapping exact duplicates retain both vintages and conflicts fail closed',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'regional-osm-duplicate-'));
 try{
 const regions=[];
 for(const id of ['a','b']){const index=importOsmJson({elements:[{type:'node',id:1,lat:0,lon:0,tags:{name:'same',leisure:'park'}}]}, {vintage:id,coverage:id});const text=JSON.stringify(index);await writeFile(join(dir,id+'.json'),text);regions.push({id,path:id+'.json',sha256:sha(text),bytes:Buffer.byteLength(text),rows:1,vintage:id,source:index.source,coverage:id,bounds:{south:0,north:0,west:0,east:0}});}
 const install=async()=>{const text=JSON.stringify({schemaVersion:1,regions});await writeFile(join(dir,'manifest.json'),text);return loadRegionalOsmProvider(join(dir,'manifest.json'),{expectedSha256:sha(text)});};
 const input={placeId:'place:v1:geonames:1',radiusKm:10,limit:5};const opts={place:{placeId:input.placeId,latitude:0,longitude:0}};
 const provider=await install();const result=await provider.search(input,opts);assert.equal(result.candidates.length,1);assert.deepEqual(result.candidates[0].sources.map(s=>s.vintage),['a','b']);
 const changed=importOsmJson({elements:[{type:'node',id:1,lat:0,lon:0,tags:{name:'conflict',leisure:'park'}}]}, {vintage:'b',coverage:'b'});const text=JSON.stringify(changed);await writeFile(join(dir,'b.json'),text);regions[1].sha256=sha(text);regions[1].bytes=Buffer.byteLength(text);
 await assert.rejects((await install()).search(input,opts),/identity conflict/);
 }finally{await cleanupRegionalFixture(dir);}
});
