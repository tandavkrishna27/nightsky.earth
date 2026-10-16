import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,access,rm,readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {assembleMembership,loadAssemblyPlan} from '../../scripts/osm/membership-assembly';
const roots:string[]=[];
after(async()=>{for(const root of roots)await rm(root,{recursive:true,force:true});});
const digest=(body:string)=>createHash('sha256').update(body).digest('hex');
async function fixture(){
 const root=await mkdtemp(join(tmpdir(),'assembly-'));roots.push(root);const producer=join(root,'producer'),job=join(root,'job');await mkdir(producer);await mkdir(job);
 const source={name:'Synthetic',url:'https://example.org',attribution:'Synthetic',dataClass:'catalog'};
 const rows=[{placeId:'place:v1:osm:node:1',name:'Park',category:'park',latitude:1,longitude:1,accessEvidence:{status:'unknown'},sources:[source],caveats:[],catalogueRevision:'fixture',sourceCompleteness:1,regionIds:[]},{placeId:'place:v1:osm:node:2',name:'Away',category:'park',latitude:20,longitude:20,accessEvidence:{status:'unknown'},sources:[source],caveats:[],catalogueRevision:'fixture',sourceCompleteness:1,regionIds:[]}];
 const data=rows.map(r=>JSON.stringify(r)+'\n').join('');await writeFile(join(producer,'candidates.jsonl'),data);await writeFile(join(producer,'complete.json'),JSON.stringify({schemaVersion:1,catalogueRevision:'fixture',files:{'candidates.jsonl':{bytes:Buffer.byteLength(data),sha256:digest(data)},'lineage.jsonl':{bytes:0,sha256:digest('')},'exclusions.jsonl':{bytes:0,sha256:digest('')}}}));
 await writeFile(join(producer,'lineage.jsonl'),'');await writeFile(join(producer,'exclusions.jsonl'),'');
 const boundary=JSON.stringify({type:'FeatureCollection',features:[{type:'Feature',properties:{regionId:'region:v1:country',name:'Country',countryCode:'IND',adminLevel:0,boundaryRevision:'fixture',sources:[source]},geometry:{type:'Polygon',coordinates:[[[0,0],[2,0],[2,2],[0,2],[0,0]]]}}]});await writeFile(join(root,'boundary.json'),boundary);await writeFile(join(root,'footprints.jsonl'),'');
 const plan={schemaVersion:1,boundaries:[{input:{path:join(root,'boundary.json'),bytes:Buffer.byteLength(boundary),sha256:digest(boundary)},regionIds:['region:v1:country']}],footprints:{path:join(root,'footprints.jsonl'),bytes:0,sha256:digest('')},membership:{},stream:{},catalogue:{},retained:[]};
 const path=join(root,'plan.json');async function save(){const body=JSON.stringify(plan);await writeFile(path,body);return digest(body);}return {root,job,producer,rows,plan,path,save};
}
test('assembly preserves all candidate facts and unknown membership while publishing immutable pages',async()=>{
 const f=await fixture(),evidence=await assembleMembership(f.path,await f.save(),f.producer,f.job);
 const rows=(await readFile(join(f.job,'membership','candidates.jsonl'),'utf8')).trim().split('\n').map(x=>JSON.parse(x));
 assert.deepEqual(rows,[{...f.rows[0],countryCode:'IND',regionIds:['region:v1:country']},f.rows[1]]);assert.equal(evidence.membership.unknownCountryCandidates,1);assert.match(evidence.sourceCoverage,/unknown/);
 assert.ok((await readdir(join(f.job,'catalogue'))).some(x=>/^catalogue-/.test(x)));await assert.rejects(assembleMembership(f.path,await f.save(),f.producer,f.job),/exist/i);
});
test('changed boundary pin, source stream and bounded membership never create assembly completion',async()=>{
 for(const mode of ['boundary','candidate','budget']){
  const f=await fixture();if(mode==='boundary')await writeFile(f.plan.boundaries[0].input.path,'{}');if(mode==='candidate')await writeFile(join(f.producer,'candidates.jsonl'),'{}\n');if(mode==='budget')Object.assign(f.plan.membership,{maxComparisons:1});
  await assert.rejects(assembleMembership(f.path,await f.save(),f.producer,f.job));await assert.rejects(access(join(f.job,'assembly-complete.json')));await assert.rejects(access(join(f.job,'catalogue')));
 }
});
test('strict plan rejects arbitrary controls and independent digest mismatch',async()=>{
 const f=await fixture();await f.save();await assert.rejects(loadAssemblyPlan(f.path,'0'.repeat(64)),/digest/);Object.assign(f.plan.membership,{command:'bad'});await assert.rejects(loadAssemblyPlan(f.path,await f.save()));
});

test('tampered retained lineage or exclusion evidence blocks assembly',async()=>{
 for(const name of ['lineage.jsonl','exclusions.jsonl']){
  const f=await fixture();const done=JSON.parse(await readFile(join(f.producer,'complete.json'),'utf8'));done.files[name]={bytes:3,sha256:digest('{}\n')};await writeFile(join(f.producer,'complete.json'),JSON.stringify(done));await writeFile(join(f.producer,name),'[]\n');
  await assert.rejects(assembleMembership(f.path,await f.save(),f.producer,f.job),/digest/);await assert.rejects(access(join(f.job,'assembly-complete.json')));
 }
});

test('producer evidence cannot override paths or omit raw lineage',async()=>{
 for(const mode of ['override','missing']){
  const f=await fixture();const done=JSON.parse(await readFile(join(f.producer,'complete.json'),'utf8'));
  if(mode==='override')done.files['lineage.jsonl'].path=f.plan.footprints.path;else delete done.files['lineage.jsonl'];
  await writeFile(join(f.producer,'complete.json'),JSON.stringify(done));await assert.rejects(assembleMembership(f.path,await f.save(),f.producer,f.job));await assert.rejects(access(join(f.job,'assembly-complete.json')));
 }
});

test('selected geography mode is pinned and must match producer evidence',async()=>{
 const f=await fixture();Object.assign(f.plan,{geographyMode:'selected-references'});
 assert.equal((await loadAssemblyPlan(f.path,await f.save())).geographyMode,'selected-references');
 await assert.rejects(assembleMembership(f.path,await f.save(),f.producer,f.job),/geography mode/);
 await assert.rejects(access(join(f.job,'membership-input')));
 Object.assign(f.plan,{geographyMode:'automatic-fallback'});
 await assert.rejects(loadAssemblyPlan(f.path,await f.save()));
});
test('planet descriptor requires matching producer identity and rejects oversized evidence before staging',async()=>{
 const f=await fixture();const p={path:'evidence.json',bytes:1,sha256:digest('e')};const domain={schemaVersion:1,kind:'planet-domain-v1',sourceUrl:'https://example.org/fixture.osm',edition:'fixture',provider:'Synthetic',providerWholeWorldEvidence:p,providerObject:{version:'v1',etag:'etag',md5:'a'.repeat(32)},raw:{bytes:3,sha256:digest('raw')},nativeVintage:'2026-10-01T00:00:00Z',nativeVintageEvidence:p,domain:{west:-180,south:-90,east:180,north:90},selectionPolicy:'named-complete-way-v1-polar85',coverageClaim:'source-domain-only'};
 const linked=join(f.root,'nested');await mkdir(linked);await writeFile(join(linked,'evidence.json'),'e');const observation=JSON.stringify({schemaVersion:1,kind:'native-vintage-observation',raw:domain.raw,nativeVintage:domain.nativeVintage});await writeFile(join(linked,'native.json'),observation);domain.nativeVintageEvidence={path:'native.json',bytes:Buffer.byteLength(observation),sha256:digest(observation)};
 const body=JSON.stringify(domain),path=join(linked,'planet-domain.json');await writeFile(path,body);
 const sourceDomains=[{sourceId:'s0',kind:'planet-domain-v1',path,bytes:Buffer.byteLength(body),sha256:digest(body)}];Object.assign(f.plan,{sourceDomains});
 assert.equal((await loadAssemblyPlan(f.path,await f.save()) as any).sourceDomains.length,1);
 await writeFile(join(linked,'evidence.json'),'x');await assert.rejects(loadAssemblyPlan(f.path,await f.save()),/checksum|digest/);await writeFile(join(linked,'evidence.json'),'e');
 await rm(join(linked,'native.json'));await assert.rejects(loadAssemblyPlan(f.path,await f.save()),/ENOENT/);await writeFile(join(linked,'native.json'),observation);
 const wrong=observation.replace('2026-10-01','2026-10-02');await writeFile(join(linked,'native.json'),wrong);await assert.rejects(loadAssemblyPlan(f.path,await f.save()),/checksum|digest/);await writeFile(join(linked,'native.json'),observation);
 await writeFile(join(linked,'native.json'),wrong);domain.nativeVintageEvidence.sha256=digest(wrong);const mismatchedBody=JSON.stringify(domain);await writeFile(path,mismatchedBody);sourceDomains[0].sha256=digest(mismatchedBody);await assert.rejects(loadAssemblyPlan(f.path,await f.save()),/native vintage observation/);
 domain.nativeVintageEvidence.sha256=digest(observation);await writeFile(join(linked,'native.json'),observation);await writeFile(path,body);sourceDomains[0].sha256=digest(body);
 await assert.rejects(assembleMembership(f.path,await f.save(),f.producer,f.job),/planet domain/);await assert.rejects(access(join(f.job,'membership-input')));
 const done=JSON.parse(await readFile(join(f.producer,'complete.json'),'utf8'));done.sourceDomains=sourceDomains;done.files['lineage.jsonl'].bytes=128*1024**2+1;await writeFile(join(f.producer,'complete.json'),JSON.stringify(done));
 await assert.rejects(assembleMembership(f.path,await f.save(),f.producer,f.job));await assert.rejects(access(join(f.job,'membership-input')));
 done.files['lineage.jsonl'].bytes=0;await writeFile(join(f.producer,'complete.json'),JSON.stringify(done));
 const evidence=await assembleMembership(f.path,await f.save(),f.producer,f.job);assert.match(evidence.sourceCoverage,/unknown/);
});

test('each producer stream exceeding assembly pin capacity fails before staging',async()=>{
 for(const name of ['candidates.jsonl','lineage.jsonl','exclusions.jsonl']){
  const f=await fixture(),done=JSON.parse(await readFile(join(f.producer,'complete.json'),'utf8'));done.files[name].bytes=128*1024**2+1;
  await writeFile(join(f.producer,'complete.json'),JSON.stringify(done));await assert.rejects(assembleMembership(f.path,await f.save(),f.producer,f.job));await assert.rejects(access(join(f.job,'membership-input')));
 }
});
