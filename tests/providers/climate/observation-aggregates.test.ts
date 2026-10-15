import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm,realpath} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {buildObservationAggregates} from '../../../scripts/era5/build-observation-aggregates';
import {publishClimateRelease} from '../../../scripts/era5/build-release';
const sha=(s:string|Buffer)=>createHash('sha256').update(s).digest('hex');
async function fixture(){
 const root=await realpath(await mkdtemp(join(await realpath(tmpdir()),'observation-')));
 const cells=[{cellId:'era5:0:0',latitude:0,longitude:0},{cellId:'era5:0:0.25',latitude:0,longitude:.25}];
 const header={type:'header',schemaVersion:1,sourceSha256:'a'.repeat(64),sourceDoi:'10.24381/cds.adbb2d47',dataClass:'reanalysis',units:'fraction',sourceUnits:'1',timeUnits:'hours since 1900-01-01',calendar:'gregorian',experimentVersions:['1'],member:0,institution:'ECMWF',gridSpacingDegrees:.25,cells,decoderVersions:{netCDF4:'1',numpy:'1'},rowCount:2};
 const text=[header,{type:'sample',atUtc:'2025-02-01T00:00:00Z',values:[.1,.5]},{type:'sample',atUtc:'2025-02-01T01:00:00Z',values:[null,.25]}].map(v=>JSON.stringify(v)).join('\n')+'\n';
 await writeFile(join(root,'chunk.jsonl'),text);
 const plan={schemaVersion:1,period:{startNight:'2025-01-31',endNight:'2025-02-01'},generatedAt:'2026-10-15T00:00:00Z',placeIndexVintage:'explicit-mapping-v1',chunks:[{id:'chunk',path:'chunk.jsonl',sha256:sha(text)}],mappings:cells.map(c=>({...c,timeZone:'Etc/UTC',chunkIds:['chunk']}))};
 const planText=JSON.stringify(plan);await writeFile(join(root,'plan.json'),planText);
 return {root,plan,text,options:{planPath:join(root,'plan.json'),expectedPlanSha256:sha(planText),outputPath:join(root,'envelope.json')}};
}
test('produces multiple sample-only tiles using observing-night month and release publisher',async()=>{const f=await fixture();try{
 const result=await buildObservationAggregates(f.options);const envelope=JSON.parse(await readFile(result.outputPath,'utf8'));
 assert.equal(envelope.tiles.length,2);assert.equal(envelope.manifest.period.kind,'sample-only');
 assert.equal(envelope.tiles[0].bins[0].valid,1);assert.equal(envelope.tiles[0].bins[24].valid,0);
 assert.ok(envelope.tiles[0].bins.reduce((n:number,b:any)=>n+b.expected,0)>2);
 assert.equal(envelope.manifest.sourceRevisions.some((r:any)=>r.kind==='raw'&&r.sha256==='a'.repeat(64)),true);
 const release=await publishClimateRelease({inputs:[{inputPath:result.outputPath,expectedSha256:result.sha256}],outputDirectory:join(f.root,'release'),generatedAt:f.plan.generatedAt});assert.equal(release.tileCount,2);
 const {createReleaseEra5ClimateProvider}=await import('../../../server/providers/climate/releaseEra5');
 const provider=createReleaseEra5ClimateProvider({index:{vintageLabel:f.plan.placeIndexVintage,getById(){return {latitude:0,longitude:0,timeZone:'Etc/UTC'};}} as any,artifactPath:release.manifestPath,expectedSha256:release.manifestSha256});
 const response=await provider.getClimatology('place:v1:geonames:1',1);assert.equal(response.availability.status,'partial');assert.equal(response.period.kind,'sample-only');
 await assert.rejects(buildObservationAggregates(f.options),/Immutable/);
 }finally{await rm(f.root,{recursive:true,force:true});}});
test('rejects corrupt source, duplicate hours, unknown zones and budgets',async()=>{const f=await fixture();try{
 await assert.rejects(buildObservationAggregates({...f.options,maxTotalInputBytes:1}),/budget/i);
 await writeFile(join(f.root,'chunk.jsonl'),f.text+'broken');await assert.rejects(buildObservationAggregates(f.options),/checksum/i);
 const duplicated=f.text.replace('2025-02-01T01:00:00Z','2025-02-01T00:00:00Z');await writeFile(join(f.root,'chunk.jsonl'),duplicated);f.plan.chunks[0].sha256=sha(duplicated);
 let p=JSON.stringify(f.plan);await writeFile(f.options.planPath,p);await assert.rejects(buildObservationAggregates({...f.options,expectedPlanSha256:sha(p)}),/Duplicate/);
 f.plan.mappings[0].timeZone='not/a-zone';p=JSON.stringify(f.plan);await writeFile(f.options.planPath,p);await assert.rejects(buildObservationAggregates({...f.options,expectedPlanSha256:sha(p)}));
 }finally{await rm(f.root,{recursive:true,force:true});}});
test('preserves explicit zones across observing-night and month boundaries',async()=>{const f=await fixture();try{
 f.plan.mappings[1].timeZone='Pacific/Kiritimati';const p=JSON.stringify(f.plan);await writeFile(f.options.planPath,p);
 const result=await buildObservationAggregates({...f.options,expectedPlanSha256:sha(p)});const e=JSON.parse(await readFile(result.outputPath,'utf8'));
 assert.equal(e.tiles[0].bins[0].valid,1);assert.equal(e.tiles[1].bins[0].valid,0);assert.equal(e.tiles[1].bins[24].valid,1);
 }finally{await rm(f.root,{recursive:true,force:true});}});
test('rejects output budgets, traversal, duplicate assignments and changed upstream mappings',async()=>{const f=await fixture();try{
 await assert.rejects(buildObservationAggregates({...f.options,maxOutputBytes:1}),/budget/i);
 for(const mutate of [()=>{f.plan.chunks[0].path='../chunk.jsonl';},()=>{f.plan.chunks[0].path='chunk.jsonl';f.plan.mappings[0].chunkIds=['chunk','chunk'];},()=>{f.plan.mappings[0].chunkIds=['chunk'];f.plan.mappings[0].latitude=.25;}]){
 mutate();const p=JSON.stringify(f.plan);await writeFile(f.options.planPath,p);await assert.rejects(buildObservationAggregates({...f.options,expectedPlanSha256:sha(p)}));}
 }finally{await rm(f.root,{recursive:true,force:true});}});
test('checks a sparse historical expected clock deadline without source yields',async()=>{
 const {aggregateDarkCloudSamples}=await import('../../../scripts/era5/aggregate');let ticks=0;
 assert.throws(()=>aggregateDarkCloudSamples([],{cellId:'era5:0:0',latitude:0,longitude:0,timeZone:'Etc/UTC'},{startNight:'1991-01-01',endNight:'2020-12-31'},()=>{if(++ticks===3)throw Error('clock deadline');}),/clock deadline/);assert.equal(ticks,3);
});
test('complete baseline observations qualify while sparse baseline remains partial',async()=>{const f=await fixture();try{
 const {summarizeMonth}=await import('../../../scripts/era5/aggregate');
 const header=JSON.parse(f.text.split('\n')[0]);header.cells=header.cells.slice(0,1);
 f.plan.period={startNight:'1991-01-01',endNight:'2020-12-31'};f.plan.mappings=f.plan.mappings.slice(0,1);f.plan.chunks=[];
 const start=Date.parse('1990-12-30T00:00:00Z'),end=Date.parse('2021-01-03T00:00:00Z');
 for(let at=start,i=0;at<end;i++){
 const rows=[];for(let n=0;n<800&&at<end;n++,at+=3600000)rows.push({type:'sample',atUtc:new Date(at).toISOString().replace('.000Z','Z'),values:[.1]});
 const text=[{...header,rowCount:rows.length},...rows].map(r=>JSON.stringify(r)).join('\n')+'\n';const id='part'+i,path=id+'.jsonl';await writeFile(join(f.root,path),text);f.plan.chunks.push({id,path,sha256:sha(text)});
 }
 f.plan.mappings[0].chunkIds=f.plan.chunks.map(c=>c.id);let p=JSON.stringify(f.plan);await writeFile(f.options.planPath,p);
 const full=await buildObservationAggregates({...f.options,expectedPlanSha256:sha(p)}),e=JSON.parse(await readFile(full.outputPath,'utf8'));
 const tile=e.tiles[0],aggregate={...tile,schemaVersion:1,astronomyVersion:tile.versions.astronomy,timezoneVersion:tile.versions.timezone};
 assert.equal(e.manifest.period.kind,'baseline-1991-2020');assert.equal(summarizeMonth(aggregate,1).quality,'available');
 f.plan.chunks=f.plan.chunks.slice(0,1);f.plan.mappings[0].chunkIds=[f.plan.chunks[0].id];p=JSON.stringify(f.plan);await writeFile(f.options.planPath,p);
 const sparse=await buildObservationAggregates({...f.options,expectedPlanSha256:sha(p),outputPath:join(f.root,'sparse.json')}),s=JSON.parse(await readFile(sparse.outputPath,'utf8')).tiles[0];
 assert.equal(summarizeMonth({...s,schemaVersion:1,astronomyVersion:s.versions.astronomy,timezoneVersion:s.versions.timezone},1).quality,'partial');
 }finally{await rm(f.root,{recursive:true,force:true});}});
test('independent plans with reused local chunk IDs publish together',async()=>{const a=await fixture(),b=await fixture();try{
 b.plan.mappings=b.plan.mappings.map(m=>({...m,longitude:m.longitude+1,cellId:`era5:0:${m.longitude+1}`}));
 const lines=b.text.trim().split('\n');const header=JSON.parse(lines[0]);header.cells=b.plan.mappings.map(({cellId,latitude,longitude})=>({cellId,latitude,longitude}));lines[0]=JSON.stringify(header);const text=lines.join('\n')+'\n';await writeFile(join(b.root,'chunk.jsonl'),text);b.plan.chunks[0].sha256=sha(text);const p=JSON.stringify(b.plan);await writeFile(b.options.planPath,p);
 const first=await buildObservationAggregates(a.options),second=await buildObservationAggregates({...b.options,expectedPlanSha256:sha(p)});
 const release=await publishClimateRelease({inputs:[first,second].map(r=>({inputPath:r.outputPath,expectedSha256:r.sha256})),outputDirectory:join(a.root,'combined-release'),generatedAt:a.plan.generatedAt});assert.equal(release.tileCount,4);
 const {createReleaseEra5ClimateProvider}=await import('../../../server/providers/climate/releaseEra5');const provider=createReleaseEra5ClimateProvider({index:{vintageLabel:a.plan.placeIndexVintage,getById(id:number){return {latitude:0,longitude:id===1?0:1,timeZone:'Etc/UTC'};}} as any,artifactPath:release.manifestPath,expectedSha256:release.manifestSha256});
 for(const id of [1,2])assert.equal((await provider.getClimatology(`place:v1:geonames:${id}`,1)).availability.status,'partial');
 }finally{await rm(a.root,{recursive:true,force:true});await rm(b.root,{recursive:true,force:true});}});
