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
