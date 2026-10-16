import {test} from 'node:test';
import assert from 'node:assert/strict';
import {reconcileMasks} from '../../scripts/era5/reconcile-retained-history';
const ids=['era5:0:0','era5:0:0.25','era5:0.25:0','era5:0.25:0.25'];
const plan=()=>({tiles:[{tileId:'a',expectedCells:ids,requiredCells:[ids[0]],fillerCells:ids.slice(1),overrides:[]}],calendarTemplates:[{year:['1990'],month:['12'],day:['30'],time:['00:00','01:00']}]});
test('unequal masks block the entire owner and retain required versus filler distinction',()=>{
 const r=reconcileMasks(plan(),[{cellId:ids[0]!,atUtc:'1990-12-30T00:00:00Z',value:null},{cellId:ids[1]!,atUtc:'1990-12-30T00:00:00Z',value:.2}]);
 assert.equal(r.blockedTiles.length,1);assert.equal(r.updatedOverrides.length,0);assert.equal(r.counts.retainedRequiredCellHours,1);assert.equal(r.counts.retainedAllAcquisitionCellHours,2);assert.equal(r.counts.baselineRequiredCellHours,0);
});
test('equal masks subtract exact hours including nulls, deduplicate overlaps and reject conflicting observations',()=>{
 const rows=ids.map(cellId=>({cellId,atUtc:'1990-12-30T00:00:00Z',value:null}));
 const r=reconcileMasks(plan(),[...rows,rows[0]!]);assert.equal(r.counts.uniqueRetainedCellHours,4);assert.deepEqual(r.updatedOverrides[0]?.overrides,[{template:0,shapes:[{days:['30'],time:['01:00']}]}]);
 assert.throws(()=>reconcileMasks(plan(),[...rows,{...rows[0]!,value:.3}]),/Conflicting/);
});
test('frozen subtraction must be justified by observed rows',()=>{const p=plan();(p.tiles[0]!.overrides as any[]).push({template:0,shapes:[]});assert.throws(()=>reconcileMasks(p,[]),/Frozen subtraction/);});
test('duplicate ownership and off-clock observations fail closed',()=>{const p=plan();p.tiles.push({...p.tiles[0]!,tileId:'b'});assert.throws(()=>reconcileMasks(p,[]),/ownership/);assert.throws(()=>reconcileMasks(plan(),[{cellId:ids[0]!,atUtc:'2025-01-01T00:00:00Z',value:0}]),/clock/);});
test('outside ownership stays outside and identical replay is idempotent',()=>{
 const rows=[{cellId:'era5:1:1',atUtc:'1990-12-30T00:00:00Z',value:.4}];const a=reconcileMasks(plan(),rows),b=reconcileMasks(plan(),[...rows,...rows]);assert.deepEqual(a,b);assert.equal(a.cells[0]?.ownership,'outside');assert.equal(a.counts.outsideAcquisitionCellHours,1);assert.equal(a.counts.retainedRequiredCellHours,0);
});
test('ledger binds raw parent and decoded child together',async()=>{const {assertLedgerBinding}=await import('../../scripts/era5/reconcile-retained-history');assert.throws(()=>assertLedgerBinding({entries:[{rawSha256:'a',decodedSha256:'c'}]},{rawSha256:'a',sha256:'b'}),/lineage/);assert.doesNotThrow(()=>assertLedgerBinding({entries:[{rawSha256:'a',partitions:[{rawSha256:'a',decodedSha256:'b'}]}]},{rawSha256:'a',sha256:'b'}));});
import {mkdtemp,writeFile,readFile,symlink,rm,realpath} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,relative,isAbsolute} from 'node:path';
import {releaseSha} from '../../server/providers/climate/releaseEra5';
import {reconcileRetainedHistory} from '../../scripts/era5/reconcile-retained-history';
test('root output succeeds exclusively while aliased roots and outside output fail',async()=>{
 // Pin the canonical parent once: Windows TEMP can be a junction to another volume.
 const fixtureParent=await realpath(tmpdir());
 const temp=await realpath(await mkdtemp(join(fixtureParent,'retained-reconcile-'))),root=join(temp,'root');
 const {mkdir}=await import('node:fs/promises');await mkdir(root);
 try {
  const body=JSON.stringify(plan());await writeFile(join(root,'plan.json'),body);
  const manifest=JSON.stringify({plan:{path:'plan.json',sha256:releaseSha(body)},entries:[]});await writeFile(join(root,'manifest.json'),manifest);
  const sha=releaseSha(manifest),output=join(root,'result.json');
  await reconcileRetainedHistory(root,'manifest.json',sha,output);
  assert.equal(JSON.parse(await readFile(output,'utf8')).counts.uniqueRetainedCellHours,0);
  await assert.rejects(reconcileRetainedHistory(root,'manifest.json',sha,output),/EEXIST/);
  await assert.rejects(reconcileRetainedHistory(root,'manifest.json',sha,join(root,'..','escape.json')),/Release/);
  const alias=join(temp,'alias');await symlink(root,alias,process.platform==='win32'?'junction':'dir');
  await assert.rejects(reconcileRetainedHistory(alias,'manifest.json',sha,join(alias,'result2.json')),/Release/);
 } finally {const rel=relative(fixtureParent,temp);assert.ok(rel&&!rel.startsWith('..')&&!isAbsolute(rel));await rm(temp,{recursive:true,force:true});}
});
