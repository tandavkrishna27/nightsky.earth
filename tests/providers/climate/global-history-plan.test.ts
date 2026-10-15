import assert from 'node:assert/strict';
import test from 'node:test';
import {partitionBands,calendarMonths,missingShapes} from '../../../scripts/era5/plan-global-history';
test('bands own each grid point once and preserve retained rectangles',()=>{
 const bands=partitionBands(721,[[400,401],[491,492]]);
 assert.deepEqual(bands.filter(b=>b[0]===400||b[0]===491),[[400,401],[491,492]]);
 assert.deepEqual(bands.flatMap(([a,b])=>Array.from({length:b-a+1},(_,i)=>a+i)),Array.from({length:721},(_,i)=>i));
 assert.ok(bands.every(([a,b])=>b-a>=1&&b-a<=2));
 assert.throws(()=>partitionBands(10,[[1,2]]),/singleton/);
});
test('clock and sparse subtraction contain every missing hour exactly once',()=>{
 const months=calendarMonths();assert.equal(months.length,362);assert.equal(months.reduce((n,m)=>n+m.days.length*24,0),263088);
 const jan=months.find(m=>m.year==='1991'&&m.month==='01')!;
 const known=new Set([jan.start,jan.start+3600000,jan.start+24*3600000]);
 const shapes=missingShapes(jan,known);
 const hours=shapes.flatMap(s=>s.days.flatMap(d=>s.time.map(t=>Date.UTC(+jan.year,+jan.month-1,+d,+t.slice(0,2)))));
 assert.equal(new Set(hours).size,741);assert.ok(hours.every(t=>!known.has(t)));
});


test('lazy expansion replaces exclusions and pins full request identity',async()=>{
 const {expandGlobalHistoryRequests}=await import('../../../scripts/era5/plan-global-history');
 const plan={dataset:'reanalysis-era5-single-levels',revision:'0001',member:0,requestDefaults:{variable:['total_cloud_cover']},calendarTemplates:[{year:['1991'],month:['01'],day:['01','02'],time:['00:00','01:00']}],tiles:[{tileId:'0:0',area:[.25,0,0,.25],expectedCells:['a','b','c','d'],requiredCells:['a'],fillerCells:['b','c','d'],overrides:[{template:0,shapes:[{days:['02'],time:['01:00']}]}]}]};
 const rows=[...expandGlobalHistoryRequests(plan)];assert.equal(rows.length,1);assert.equal(rows[0].scalarCellHours,4);assert.deepEqual(rows[0].request.day,['02']);assert.match(rows[0].sha256,/^[a-f0-9]{64}$/);
 plan.tiles[0].overrides[0]!.shapes=[];assert.equal([...expandGlobalHistoryRequests(plan)].length,0);
});

test('invalid budgets stop before any file access',async()=>{
 const {planGlobalHistory}=await import('../../../scripts/era5/plan-global-history');
 const {tmpdir}=await import('node:os');const {resolve}=await import('node:path');
 await assert.rejects(planGlobalHistory({root:resolve(tmpdir(),'history-unread'),manifestPath:'x',manifestSha256:'0'.repeat(64),verificationPath:'v',verificationSha256:'0'.repeat(64),outputPath:resolve(tmpdir(),'history-unwritten.json'),maxInputBytes:128*1024*1024+1}),/budget/);
});

test('retained raw caller uses a reader-admitted bound',async()=>{
 const {GLOBAL_RETAINED_RAW_READ_LIMIT}=await import('../../../scripts/era5/plan-global-history');
 const {readTrustedClimateFile}=await import('../../../server/providers/climate/tiledEra5');
 const {mkdtemp,writeFile,unlink,rmdir}=await import('node:fs/promises');const {tmpdir}=await import('node:os');const {join}=await import('node:path');const {createHash}=await import('node:crypto');
 const dir=await mkdtemp(join(tmpdir(),'history-reader-'));try{const path=join(dir,'raw.nc'),body=Buffer.from('local fixture');await writeFile(path,body);const pin=createHash('sha256').update(body).digest('hex');assert.deepEqual(await readTrustedClimateFile(path,pin,GLOBAL_RETAINED_RAW_READ_LIMIT),body);await assert.rejects(readTrustedClimateFile(path,pin,32*1024*1024),/Invalid climate read limit/);}finally{await unlink(join(dir,'raw.nc'));await rmdir(dir);}
});
