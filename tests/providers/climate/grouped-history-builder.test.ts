import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp,mkdir,writeFile,readFile,rm,readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as api from '../../../scripts/era5/build-pilot';
import { GeoNamesPlaceIndex } from '../../../server/places/geonames';
const sha=(v:string|Buffer)=>createHash('sha256').update(v).digest('hex');
const index=new GeoNamesPlaceIndex([[1270426,'Hanle','Hanle','',32.78943,78.9962,'IN','India',0,'Asia/Kolkata'],[1266425,'Kodaikanal','Kodaikanal','',10.23925,77.48932,'IN','India',0,'Asia/Kolkata'],[1262463,'Munnar','Munnar','',10.08818,77.06239,'IN','India',0,'Asia/Kolkata']],'offline-engineering-fixture');
test('grouped parent checkpoints build a chronological schema 2 sample and reject index tampering',async()=>{
 assert.equal(typeof api.reviewedGroupedManifest,'function','grouped reviewed manifest must exist');
 const plan=api.reviewedGroupedManifest(1991,1992);
 assert.equal(plan.chunks.length,30);
 assert.equal(api.reviewedGroupedManifest(1991,2020).chunks.length,30);
 const root=await mkdtemp(join(tmpdir(),'grouped-builder-'));
 try {
  await mkdir(join(root,'raw'));await mkdir(join(root,'decoded'));
  const entries=[];
  for(const group of plan.chunks) {
   const raw=Buffer.from(`engineering-parent-${group.chunkId}`);const rawSha256=sha(raw);
   await writeFile(join(root,'raw',group.chunkId+'.nc'),raw);
   const partitions=[];
   for(const part of group.partitions) {
    const cells=plan.cellCoverage[part.region]!.cells.map(([latitude,longitude])=>({cellId:`era5:${latitude}:${longitude}`,latitude,longitude}));
    const header={type:'header',schemaVersion:1,sourceSha256:rawSha256,sourceDoi:'10.24381/cds.adbb2d47',dataClass:'reanalysis',units:'fraction',sourceUnits:'1',timeUnits:'seconds since 1970-01-01',calendar:'proleptic_gregorian',experimentVersions:['0001'],member:0,institution:'ECMWF',gridSpacingDegrees:.25,cells,decoderVersions:{netCDF4:'1.7.3',numpy:'2.5.4'},rowCount:1};
    const text=JSON.stringify(header)+'\n'+JSON.stringify({type:'sample',atUtc:`${part.request.year[0]}-${part.request.month[0]}-${part.request.day[0]}T18:00:00Z`,values:cells.map(()=>.25)})+'\n';
    const path=`decoded/${part.chunkId}.jsonl`;await writeFile(join(root,path),text);
    partitions.push({chunkId:part.chunkId,path,rawSha256,decodedSha256:sha(text),sourceRows:1,expectedRows:part.expectedHours,missingSourceHours:part.expectedHours-1,decodedBytes:Buffer.byteLength(text)});
   }
   const text=JSON.stringify(partitions);await writeFile(join(root,'decoded',group.chunkId+'.json'),text);
   entries.push({chunkId:group.chunkId,complete:true,rawSha256,decodedSha256:sha(text),partitions,sourceRevision:['0001'],decoderVersions:{netCDF4:'1.7.3',numpy:'2.5.4'},rawBytes:raw.length,decodedBytes:Buffer.byteLength(text),sourceRows:partitions.length,expectedRows:group.expectedHours,missingSourceHours:group.expectedHours-partitions.length});
  }
  await writeFile(join(root,'manifest.json'),JSON.stringify(plan));await writeFile(join(root,'ledger.json'),JSON.stringify({schemaVersion:1,manifestSha256:api.manifestDigest(plan),entries}));
  const history={startYear:1991,endYear:1992,expectedManifestSha256:api.manifestDigest(plan),generatedAt:'2026-10-14T00:00:00Z',grouped:true};
  const result=await api.buildPilot({root,index,history});
  const first=await readFile(result.output,'utf8');const envelope=JSON.parse(first);
  assert.equal(envelope.schemaVersion,2);assert.equal(envelope.manifest.period.kind,'sample-only');
  assert.equal(envelope.tiles.length,3);assert.equal((await readdir(join(root,'raw'))).length,30);
  assert.equal(envelope.manifest.sourceRevisions.filter((r:{kind:string})=>r.kind==='raw').length,30);
  await api.buildPilot({root,index,history});assert.equal(await readFile(result.output,'utf8'),first);
  const ledger=(rows:typeof entries)=>JSON.stringify({schemaVersion:1,manifestSha256:api.manifestDigest(plan),entries:rows});
  for(const mutation of ['path','year','parent','duplicate','clock','revision']) {
   const rows=structuredClone(entries),entry=rows[0]!,part=entry.partitions[0]!;
   const decodedPath=join(root,part.path),original=await readFile(decodedPath,'utf8');
   if(mutation==='path')part.path='../manifest.json';
   if(mutation==='year')part.chunkId='hanle-1993-01';
   if(mutation==='parent')part.rawSha256='0'.repeat(64);
   if(mutation==='duplicate')entry.partitions[1]=structuredClone(part);
   if(mutation==='revision')entry.sourceRevision=['0005'];
   if(mutation==='clock') {
    const text=original.replace('1991-01-01T18:00:00Z','1993-01-01T18:00:00Z');
    await writeFile(decodedPath,text);part.decodedSha256=sha(text);part.decodedBytes=Buffer.byteLength(text);
   }
   const text=JSON.stringify(entry.partitions);entry.decodedSha256=sha(text);entry.decodedBytes=Buffer.byteLength(text);
   await writeFile(join(root,'decoded',entry.chunkId+'.json'),text);await writeFile(join(root,'ledger.json'),ledger(rows));
   await assert.rejects(api.buildPilot({root,index,history}),undefined,mutation);
   assert.equal(await readFile(result.output,'utf8'),first);
   await writeFile(decodedPath,original);
  }
  await writeFile(join(root,'ledger.json'),ledger(entries));
  await writeFile(join(root,'decoded',entries[0]!.chunkId+'.json'),JSON.stringify(entries[0]!.partitions));
  await writeFile(join(root,'decoded',plan.chunks[0]!.chunkId+'.json'),'changed');
  await assert.rejects(api.buildPilot({root,index,history}),/partition|index|changed/i);
  assert.equal(await readFile(result.output,'utf8'),first);
 } finally {await rm(root,{recursive:true,force:true});}
});
