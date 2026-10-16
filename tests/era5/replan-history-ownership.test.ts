import {test} from 'node:test';
import assert from 'node:assert/strict';
import {replanHistoryOwnership} from '../../scripts/era5/replan-history-ownership';
const hour='1990-12-30T00:00:00Z';
const ids=['243:456','243:457','243:458','243:459','244:456','244:457','244:458','244:459'];
function fixture(){
 const tiles=ids.map(tileId=>{const [r,c]=tileId.split(':').map(Number);const south=r===243?31.75:32.25,west=48+(c!-456)*.5;const expectedCells=[south,south+.25].flatMap(y=>[west,west+.25].map(x=>`era5:${y}:${x}`));const fillerCells=expectedCells.filter(id=>['era5:31.75:48.75','era5:31.75:49','era5:32.5:48.75','era5:32.5:49'].includes(id));return {tileId,area:[south+.25,west,south,west+.25],expectedCells,requiredCells:expectedCells.filter(id=>!fillerCells.includes(id)),fillerCells,overrides:[]};});
 const hours=Array.from({length:24},(_,h)=>`1990-12-30T${String(h).padStart(2,'0')}:00:00Z`);
 const cells=[32,32.25].flatMap(y=>[48.75,49].map(x=>({cellId:`era5:${y}:${x}`,hoursUtc:hours})));
 return {plan:{dataset:'reanalysis-era5-single-levels',revision:'0001',member:0,requestDefaults:{product_type:['reanalysis'],variable:['total_cloud_cover'],data_format:'netcdf',download_format:'unarchived'},tiles,calendarTemplates:[{year:['1990'],month:['12'],day:['30','31'],time:hours.map(h=>h.slice(11,16))}]},reconciliation:{frozenPlanSha256:'a'.repeat(64),cells,blockedTiles:ids.filter(id=>!id.endsWith('456')&&!id.endsWith('459')).map(tileId=>({tileId})),updatedOverrides:[]}};
}
test('time overlay preserves every required hour while explicitly removing only four filler day masks',()=>{
 const {plan,reconciliation}=fixture();const r=replanHistoryOwnership(plan,reconciliation);
 assert.equal(r.status,'PROPOSED-EXACT-REQUIRED-COVERAGE');assert.equal(r.replacements.length,4);
 assert.deepEqual(r.counts,{affectedOwners:8,affectedAcquisitionCells:32,affectedRequiredCells:28,affectedHours:24,beforeAcquisitionCellHours:768,retainedAcquisitionCellHours:96,beforeMissingAcquisitionCellHours:672,afterAcquisitionCellHours:576,removedFillerCellHours:96,addedFillerCellHours:0,requiredMissingCellHours:576,afterRequiredCellHours:576});
 const observed=new Set(reconciliation.cells.flatMap(c=>c.hoursUtc.map(h=>c.cellId+'|'+h))),actual=new Set<string>();
 for(const t of r.replacements){assert.ok(t.expectedCells.length<=10);assert.ok(t.area[0]!>t.area[2]!&&t.area[3]!>t.area[1]!);for(const c of t.expectedCells)for(const h of r.hoursUtc){const k=c+'|'+h;assert.equal(observed.has(k),false);assert.equal(actual.has(k),false);actual.add(k);}}
 for(const t of plan.tiles)for(const c of t.requiredCells)for(const h of r.hoursUtc)if(!observed.has(c+'|'+h))assert.equal(actual.has(c+'|'+h),true);
 assert.ok(r.ownerOverrides.every(o=>JSON.stringify(o.overrides)==='[{"template":0,"shapes":[{"days":["31"],"time":["00:00","01:00","02:00","03:00","04:00","05:00","06:00","07:00","08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00","21:00","22:00","23:00"]}]}]'));
 assert.deepEqual(replanHistoryOwnership({...plan,tiles:[...plan.tiles].reverse()},{...reconciliation,cells:[...reconciliation.cells].reverse()}),r);
});
test('fails closed if a discarded filler becomes required, ownership is duplicated, or retained masks change',()=>{
 let {plan,reconciliation}=fixture();const t=plan.tiles.find(t=>t.fillerCells.length)!;t.requiredCells.push(t.fillerCells.pop()!);assert.throws(()=>replanHistoryOwnership(plan,reconciliation),/required/);
 ({plan,reconciliation}=fixture());plan.tiles.push({...plan.tiles[0]!,tileId:'duplicate'});assert.throws(()=>replanHistoryOwnership(plan,reconciliation),/ownership/);
 ({plan,reconciliation}=fixture());reconciliation.cells.push({cellId:'era5:31.75:48',hoursUtc:[hour]});assert.throws(()=>replanHistoryOwnership(plan,reconciliation),/retained/);
});

import {readFile,mkdtemp,writeFile,rm,realpath} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {canonicalRelease,releaseSha} from '../../server/providers/climate/releaseEra5';
import {writeHistoryOwnershipReplan} from '../../scripts/era5/replan-history-ownership';
test('actual retained metadata proves 312 required hours and unchanged source clocks outside one day',async()=>{
 const f=JSON.parse(await readFile(new URL('../../docs/operations/data-pilot-evidence/2026-10-16-history-ownership-replan-fixture.json',import.meta.url),'utf8'));
 const saved=JSON.parse(await readFile(new URL('../../docs/operations/data-pilot-evidence/2026-10-16-history-ownership-replan.json',import.meta.url),'utf8'));
 const result=replanHistoryOwnership(f.plan,f.reconciliation);
 assert.deepEqual({...result,reconciliationSha256:saved.reconciliationSha256},saved);
 assert.equal(result.counts.requiredMissingCellHours,312);assert.equal(result.counts.afterAcquisitionCellHours,576);
 assert.deepEqual(result.removedFillerCells,['era5:31.75:48.75','era5:31.75:49','era5:32.5:48.75','era5:32.5:49']);
 const timestamps=(template:any,shapes:any[])=>new Set(shapes.flatMap(s=>s.days.flatMap((d:string)=>s.time.map((h:string)=>`${template.year[0]}-${template.month[0]}-${d}T${h}:00Z`))));
 for(const o of result.ownerOverrides){let omitted=0;for(let i=0;i<f.plan.calendarTemplates.length;i++){
  const t=f.plan.calendarTemplates[i],source=timestamps(t,[{days:t.day,time:t.time}]),override=o.overrides.find(v=>v.template===i),remaining=timestamps(t,override?override.shapes:[{days:t.day,time:t.time}]);
  for(const h of source){assert.equal(remaining.has(h),!result.hoursUtc.includes(h as string));if(!remaining.has(h))omitted++;}for(const h of remaining)assert.equal(source.has(h),true);
 }assert.equal(omitted,24);}
});
test('pinned writer refuses mismatched sources, existing outputs and escaped destinations',async()=>{
 const root=await realpath(await mkdtemp(join(await realpath(tmpdir()),'history-replan-')));
 try{const f=fixture(),plan=canonicalRelease(f.plan),p=releaseSha(plan);f.reconciliation.frozenPlanSha256=p;const rec=canonicalRelease(f.reconciliation),r=releaseSha(rec);
 await writeFile(join(root,'plan.json'),plan);await writeFile(join(root,'rec.json'),rec);
 await assert.rejects(()=>writeHistoryOwnershipReplan(root,'plan.json','0'.repeat(64),'rec.json',r,join(root,'bad.json')));
 const out=join(root,'out.json');const receipt=await writeHistoryOwnershipReplan(root,'plan.json',p,'rec.json',r,out);assert.equal(receipt.sha256,releaseSha(await readFile(out)));
 await assert.rejects(()=>writeHistoryOwnershipReplan(root,'plan.json',p,'rec.json',r,out),/EEXIST/);
 await assert.rejects(()=>writeHistoryOwnershipReplan(root,'plan.json',p,'rec.json',r,join(root,'..','outside.json')));
 }finally{await rm(root,{recursive:true,force:true});}
});
