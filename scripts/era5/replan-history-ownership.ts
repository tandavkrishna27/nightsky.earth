import {writeFile,realpath} from 'node:fs/promises';
import {resolve,dirname,relative,basename} from 'node:path';
import {fileURLToPath} from 'node:url';
import {canonicalRelease,releaseSha,releasePath} from '../../server/providers/climate/releaseEra5';
import {readTrustedClimateFile} from '../../server/providers/climate/tiledEra5';
import {groupLegacyCalendarRequests} from './plan-production-history';

const AFFECTED=['243:456','243:457','243:458','243:459','244:456','244:457','244:458','244:459'];
const BLOCKED=['243:457','243:458','244:457','244:458'];
const HOURS=Array.from({length:24},(_,h)=>`1990-12-30T${String(h).padStart(2,'0')}:00:00Z`);
const CENTRAL=[32,32.25].flatMap(y=>[48.75,49].map(x=>`era5:${y}:${x}`));
const equal=(a:unknown,b:unknown)=>canonicalRelease(a)===canonicalRelease(b);
/** Scoped offline overlay: spatial ownership changes only on the specified retained day.
 * No acquisition authorization. Unaffected owners and hours retain their reconciled masks.
 */
export function replanHistoryOwnership(plan:any,reconciliation:any){
 if(!Array.isArray(plan.tiles)||plan.tiles.length>100000||!Array.isArray(plan.calendarTemplates)||plan.calendarTemplates.length>400||!Array.isArray(reconciliation.cells)||reconciliation.cells.length>100000)throw Error('Replan bounds');
 const owners=new Map<string,any>(),tiles=new Map<string,any>();
 for(const t of plan.tiles){if(tiles.has(t.tileId))throw Error('Duplicate tile ownership');tiles.set(t.tileId,t);for(const c of t.expectedCells){if(owners.has(c))throw Error('Duplicate cell ownership');owners.set(c,t);}if(!equal([...t.requiredCells,...t.fillerCells].sort(),[...t.expectedCells].sort()))throw Error('Required/filler ownership differs');}
 const selected=AFFECTED.map(id=>{const t=tiles.get(id);if(!t)throw Error('Missing affected ownership');return t;});
 const original=new Set<string>(selected.flatMap(t=>t.expectedCells));
 const expected=[31.75,32,32.25,32.5].flatMap(y=>Array.from({length:8},(_,i)=>`era5:${y}:${48+i*.25}`));
 if(!equal([...original].sort(),expected.sort()))throw Error('Affected ownership geometry changed');
 const required=new Set<string>(selected.flatMap(t=>t.requiredCells)),known=new Map<string,Set<string>>();
 for(const c of reconciliation.cells){if(known.has(c.cellId)||new Set(c.hoursUtc).size!==c.hoursUtc.length)throw Error('Duplicate retained mask');known.set(c.cellId,new Set(c.hoursUtc));}
 // The bounded proposal deliberately rejects changed retained inputs instead of silently broadening.
 for(const c of original)if(!equal([...(known.get(c)??[])].sort(),CENTRAL.includes(c)?HOURS:[]))throw Error('Affected retained mask changed');
 if(!equal(reconciliation.blockedTiles.map((t:any)=>t.tileId).sort(),BLOCKED))throw Error('Unexpected blocked owners');
 const used=new Set<string>(),replacementTiles:any[]=[];
 for(const south of [31.75,32.25])for(const west of [48,49.25]){
  const expectedCells=[south,south+.25].flatMap(y=>[west,west+.25,west+.5].map(x=>`era5:${y}:${x}`));
  for(const c of expectedCells){if(!original.has(c)||used.has(c)||known.get(c)?.size)throw Error('Replacement overlap/outside/retained cell');used.add(c);}
  replacementTiles.push({tileId:`history-replan:${south}:${west}:1990-12-30`,area:[south+.25,west,south,west+.5],expectedCells,requiredCells:expectedCells.filter(c=>required.has(c)),fillerCells:expectedCells.filter(c=>!required.has(c)),overrides:[]});
 }
 const removedFillerCells=[...original].filter(c=>!used.has(c)&&!CENTRAL.includes(c)).sort();
 if(removedFillerCells.some(c=>required.has(c)))throw Error('Replan would drop required coverage');
 for(const c of required)if(!used.has(c)&&!CENTRAL.includes(c))throw Error('Missing required cell');
 const ownerOverrides=selected.map(t=>{
  if(t.overrides.length)throw Error('Affected frozen overrides changed');
  const overrides:any[]=[];let affectedClock=0;
  plan.calendarTemplates.forEach((template:any,index:number)=>{
   const groups=new Map<string,string[]>();let changed=false;
   for(const day of template.day){const time=template.time.filter((h:string)=>{const match=HOURS.includes(`${template.year[0]}-${template.month[0]}-${day}T${h}:00Z`);if(match){changed=true;affectedClock++;}return !match;});if(time.length){const key=JSON.stringify(time);groups.set(key,[...(groups.get(key)??[]),day]);}}
   if(changed)overrides.push({template:index,shapes:[...groups].map(([time,days])=>({days,time:JSON.parse(time)}))});
  });if(affectedClock!==24)throw Error('Affected source clock differs');return {tileId:t.tileId,overrides};
 });
 const replacementPlan={...plan,tiles:replacementTiles,calendarTemplates:[{year:['1990'],month:['12'],day:['30'],time:HOURS.map(h=>h.slice(11,16))}]};
 const jobs=[...groupLegacyCalendarRequests(replacementPlan,{maxYearsPerRequest:30,maxSourceHoursPerRequest:22320})];
 const replacements=jobs.map(j=>({...j,area:j.request.area}));
 const retainedRequired=CENTRAL.filter(c=>required.has(c)).length*24,afterRequired=replacements.reduce((n,t)=>n+t.requiredCells.length*24,0);
 if(afterRequired!==required.size*24-retainedRequired)throw Error('Required cell-hour proof failed');
 return {schemaVersion:1,status:'PROPOSED-EXACT-REQUIRED-COVERAGE',authorization:'unapproved-nonexecuting',frozenPlanSha256:reconciliation.frozenPlanSha256,affectedTileIds:AFFECTED,resolvedBlockedTileIds:BLOCKED,hoursUtc:HOURS,ownerOverrides,replacements,removedFillerCells,addedFillerCells:[],counts:{affectedOwners:8,affectedAcquisitionCells:original.size,affectedRequiredCells:required.size,affectedHours:24,beforeAcquisitionCellHours:original.size*24,retainedAcquisitionCellHours:96,beforeMissingAcquisitionCellHours:original.size*24-96,afterAcquisitionCellHours:used.size*24,removedFillerCellHours:removedFillerCells.length*24,addedFillerCellHours:0,requiredMissingCellHours:required.size*24-retainedRequired,afterRequiredCellHours:afterRequired},baselineCompletionClaim:false};
}

export async function writeHistoryOwnershipReplan(root:string,planPath:string,planSha:string,reconciliationPath:string,reconciliationSha:string,output:string){
 const plan=JSON.parse((await readTrustedClimateFile(await releasePath(root,planPath),planSha,8*1024*1024)).toString('utf8'));
 const reconciliation=JSON.parse((await readTrustedClimateFile(await releasePath(root,reconciliationPath),reconciliationSha,4*1024*1024)).toString('utf8'));
 if(reconciliation.frozenPlanSha256!==planSha)throw Error('Reconciliation frozen plan pin differs');
 const result={...replanHistoryOwnership(plan,reconciliation),reconciliationSha256:reconciliationSha};
 const text=canonicalRelease(result);if(Buffer.byteLength(text)>1024*1024)throw Error('Replan output bound');
 const parent=relative(resolve(root),dirname(resolve(output))).replaceAll('\\','/');if(parent)await releasePath(resolve(root),parent);else if(resolve(await realpath(root))!==resolve(root))throw Error('Root alias');if(basename(output).includes(':'))throw Error('Output alias');
 await writeFile(output,text,{flag:'wx'});return {sha256:releaseSha(text),bytes:Buffer.byteLength(text),counts:result.counts};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){const a=process.argv.slice(2);if(a.length!==6)throw Error('Required: root plan planSha reconciliation reconciliationSha newOutput');writeHistoryOwnershipReplan(a[0]!,a[1]!,a[2]!,a[3]!,a[4]!,a[5]!).then(x=>console.log(JSON.stringify(x))).catch(e=>{console.error(e.message);process.exitCode=1;});}
