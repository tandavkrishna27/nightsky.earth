import assert from 'node:assert/strict';
import test,{after} from 'node:test';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {mkdtemp,writeFile,readFile,realpath,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {planProductionHistory,SOURCE_HOURS} from '../../../scripts/era5/plan-production-history';
import {releaseSha} from '../../../server/providers/climate/releaseEra5';
const destination={id:'one',name:'One',latitude:0.125,longitude:0.125,timeZone:'UTC',coordinateProvenance:'explicit geonames record 1',timezoneProvenance:'record zone',mappingProvenance:'nearest quarter tie positive',uncertainty:'explicit-record',cell:{cellId:'era5:0.25:0.25',latitude:.25,longitude:.25}};
const fixtureRoots:string[]=[];
after(async()=>{for(const root of fixtureRoots)await rm(root,{recursive:true,force:true});});
async function fixture(change:any={},chunks:any[]=[]){const root=await realpath(await mkdtemp(join(await realpath(tmpdir()),'history-plan-')));fixtureRoots.push(root);const completed=[];for(let i=0;i<chunks.length;i++){const text=chunks[i],path=`chunk-${i}.jsonl`;await writeFile(join(root,path),text);completed.push({path,sha256:releaseSha(text),rawSha256:'a'.repeat(64),dataset:'reanalysis-era5-single-levels',variable:'total_cloud_cover',revision:'0001',member:0});}const inventory={schemaVersion:1,gazetteerEdition:'test-pinned',timezoneVersion:'test-pinned',destinations:[destination],completed,...change};const text=JSON.stringify(inventory);const inventoryPath=join(root,'inventory.json');await writeFile(inventoryPath,text);return {root,options:{inventoryPath,expectedInventorySha256:releaseSha(text),outputPath:join(root,'proposal.json'),prefixJobs:4}};}
function chunk(month:number,year:number,value:number|null=.25){const rows=Array.from({length:month===3?744:24},(_,h)=>({type:'sample',atUtc:new Date(Date.UTC(year,month-1,1,h)).toISOString().replace('.000Z','Z'),values:[value]}));const header={type:'header',schemaVersion:1,sourceSha256:'a'.repeat(64),sourceDoi:'10.24381/cds.adbb2d47',dataClass:'reanalysis',units:'fraction',sourceUnits:'1',timeUnits:'hours since 1990-01-01',calendar:'standard',experimentVersions:['0001'],member:0,institution:'ECMWF',gridSpacingDegrees:.25,cells:[destination.cell],decoderVersions:{netCDF4:'1',numpy:'1'},rowCount:rows.length};return [header,...rows].map(v=>JSON.stringify(v)).join('\n')+'\n';}
test('production independent clock and shared cell deduplicate source but preserve zone pairs',async()=>{assert.equal(SOURCE_HOURS,263088);const f=await fixture({destinations:[destination,{...destination,id:'two',name:'Other',timeZone:'Asia/Kolkata'}]});const {manifest}=await planProductionHistory(f.options);assert.equal(manifest.requirements.uniqueCells,1);assert.equal(manifest.requirements.uniqueCellZonePairs,2);assert.equal(manifest.requirements.pairHours,526176);assert.equal(manifest.prefix.requests[0].expectedHours,48);assert.equal(manifest.status,'unapproved-nonexecuting');await assert.rejects(()=>planProductionHistory(f.options));});
test('retained March and January actual rows subtract before requests including nulls and renamed duplicate',async()=>{const f=await fixture({},[chunk(3,1991),chunk(3,1992),chunk(1,1991,null),chunk(3,1991)]);const {manifest}=await planProductionHistory({...f.options,prefixJobs:6});assert.equal(manifest.requirements.verifiedCompletedCellHours,1512);assert(!manifest.prefix.requests.some(r=>r.request.year[0]==='1991'&&r.request.month[0]==='03'));const jan=manifest.prefix.requests.find(r=>r.request.year[0]==='1991'&&r.request.month[0]==='01')!;assert(!jan.request.day.includes('01'));});
test('deterministic prefix and identity independent of output name',async()=>{const f=await fixture();const a=await planProductionHistory(f.options),b=await planProductionHistory({...f.options,outputPath:join(f.root,'second.json')});assert.equal(a.sha256,b.sha256);assert.equal(await readFile(f.options.outputPath,'utf8'),await readFile(join(f.root,'second.json'),'utf8'));});
test('unknown mapping timezone, conflict, malformed, pins, traversal and budget fail closed',async()=>{for(const d of [{...destination,timeZone:'unknown'},{...destination,cell:{...destination.cell,latitude:0}},{...destination,timezoneProvenance:''}]){const f=await fixture({destinations:[d]});await assert.rejects(()=>planProductionHistory(f.options));}for(const chunks of [[chunk(3,1991),chunk(3,1991,.5)],['{}\n{}\n']]){const f=await fixture({},chunks);await assert.rejects(()=>planProductionHistory(f.options));}const f=await fixture();await assert.rejects(()=>planProductionHistory({...f.options,expectedInventorySha256:'b'.repeat(64)}));await assert.rejects(()=>planProductionHistory({...f.options,maxInputBytes:1}));await assert.rejects(()=>planProductionHistory({...f.options,prefixJobs:0}));const p=await fixture({completed:[{path:'../escape',sha256:'a'.repeat(64),rawSha256:'a'.repeat(64),dataset:'reanalysis-era5-single-levels',variable:'total_cloud_cover',revision:'0001',member:0}]});await assert.rejects(()=>planProductionHistory(p.options));});

test('irregular retained day/hour coverage is subtracted from every Cartesian proposal exactly',async()=>{
 const source=chunk(1,1991).trim().split('\n').map(line=>JSON.parse(line));
 const retainedHours=['1991-01-01T00:00:00Z','1991-01-01T02:00:00Z','1991-01-02T01:00:00Z'];
 const irregular=[{...source[0],rowCount:3},...retainedHours.map(atUtc=>({type:'sample',atUtc,values:[.25]}))].map(row=>JSON.stringify(row)).join('\n')+'\n';
 const f=await fixture({},[irregular]);const {manifest}=await planProductionHistory({...f.options,prefixJobs:4});
 assert.equal(manifest.requirements.verifiedCompletedCellHours,3);
 const retained=new Set(retainedHours),proposed=new Set<string>();
 for(const proposal of manifest.prefix.requests){let count=0;const request=proposal.request;
  for(const year of request.year)for(const month of request.month)for(const day of request.day)for(const time of request.time){
   const at=`${year}-${month}-${day}T${time}:00Z`;assert(!retained.has(at),`Completed hour proposed: ${at}`);assert(!proposed.has(at),`Duplicate proposal hour: ${at}`);proposed.add(at);count++;
  }
  assert.equal(proposal.expectedHours,count);assert.equal(proposal.scalarCellHours,count);
 }
 const january=[...proposed].filter(at=>at.startsWith('1991-01-'));assert.equal(january.length,744-3);
 assert(proposed.has('1991-01-01T01:00:00Z'));assert(proposed.has('1991-01-02T00:00:00Z'));assert(proposed.has('1991-01-31T23:00:00Z'));
 assert.equal(manifest.prefix.scalarCellHours,48+744-3);
});
test('CLI rejects unknown flags and missing explicit prefix',async()=>{
 const f=await fixture();const cli=fileURLToPath(new URL('../../../scripts/era5/plan-production-history.ts',import.meta.url));
 const base=['--inventory',f.options.inventoryPath,'--expected-inventory-sha256',f.options.expectedInventorySha256,'--output',f.options.outputPath];
 for(const [extra,message] of [[['--unknown','value'],'Unknown'],[[],'Required --prefix-jobs']] as const){const result=spawnSync(process.execPath,['--import','tsx',cli,...base,...extra],{encoding:'utf8'});assert.equal(result.status,1,result.stderr);assert.match(result.stderr,new RegExp(message));}
});
