import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {buildSourceCatalogue,jsonlRows} from '../../scripts/osm/build-source-catalogue';
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
