import {randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
/** Offline preparation only. No provider, downloader or execution entry point. */
import * as z from 'zod4';
import {open,link,unlink,realpath} from 'node:fs/promises';
import {dirname,isAbsolute,resolve,basename,join} from 'node:path';
import {parseDecodedChunk} from './chunks';
import {suppliedCellKey,readTrustedClimateFile} from '../../server/providers/climate/tiledEra5';
import {releasePath,canonicalRelease,releaseSha} from '../../server/providers/climate/releaseEra5';
import {ianaTimeZoneSchema} from '../../shared/nightsky/common';
const pin=z.string().regex(/^[a-f0-9]{64}$/),label=z.string().min(1).max(200);
const cell=z.strictObject({cellId:label,latitude:z.number().finite().min(-90).max(90),longitude:z.number().finite().min(-180).max(180)});
export const productionHistoryInventorySchema=z.strictObject({schemaVersion:z.literal(1),gazetteerEdition:label,timezoneVersion:label,destinations:z.array(z.strictObject({id:label,name:label,latitude:z.number().finite().min(-90).max(90),longitude:z.number().finite().min(-180).max(180),timeZone:ianaTimeZoneSchema,coordinateProvenance:label,timezoneProvenance:label,mappingProvenance:label,uncertainty:z.enum(['explicit-record','geographic-suitability-unverified','border-uncertain']),cell})).min(1).max(10000),completed:z.array(z.strictObject({path:label,sha256:pin,rawSha256:pin,dataset:z.literal('reanalysis-era5-single-levels'),variable:z.literal('total_cloud_cover'),revision:z.literal('0001'),member:z.literal(0)})).max(4000)});
export const SOURCE_START='1990-12-30T00:00:00Z',SOURCE_END='2021-01-03T00:00:00Z';
const start=Date.parse(SOURCE_START),end=Date.parse(SOURCE_END),hour=3600000;
export const SOURCE_HOURS=(end-start)/hour;
/** Offline regrouping of a separately hash-verified global compact plan. No submission path.
 * One tile is held at a time. Group only identical month/day/hour shapes; never
 * combine leap/non-leap February or a retained-hour override with a full month.
 */
export function* groupLegacyCalendarRequests(plan:any,limits:{maxYearsPerRequest:number;maxSourceHoursPerRequest:number}):Generator<any>{
 if(!Number.isSafeInteger(limits.maxYearsPerRequest)||!Number.isSafeInteger(limits.maxSourceHoursPerRequest))throw Error('Explicit finite grouped budget required');
 const yearsCap=bound(limits.maxYearsPerRequest,30),hoursCap=bound(limits.maxSourceHoursPerRequest,22320);
 if(plan.dataset!=='reanalysis-era5-single-levels'||plan.revision!=='0001'||plan.member!==0||canonicalRelease(plan.requestDefaults)!==canonicalRelease({product_type:['reanalysis'],variable:['total_cloud_cover'],data_format:'netcdf',download_format:'unarchived'}))throw Error('Unadmitted grouped request defaults');
 const ownedCells=new Set<string>();
 for(const tile of plan.tiles){
  const [north,west,south,east]=tile.area;
  if(![north,west,south,east].every(v=>Number.isFinite(v)&&Number.isInteger(v*4))||north>90||south< -90||west< -180||east>=180||north<=south||east<=west||tile.expectedCells.length<4||tile.expectedCells.length>10)throw Error('Nondegenerate bounded rectangle required');
  const expected:string[]=[];for(let lat=south;lat<=north;lat+=.25)for(let lon=west;lon<=east;lon+=.25){if(expected.length===10)throw Error('Rectangle exceeds cell cap');expected.push(`era5:${lat}:${lon}`);}
  if(JSON.stringify([...expected].sort())!==JSON.stringify([...tile.expectedCells].sort()))throw Error('Rectangle cell inventory differs');
  for(const id of expected){if(ownedCells.has(id))throw Error('Repeated acquisition cell');ownedCells.add(id);}
  if(new Set([...tile.requiredCells,...tile.fillerCells]).size!==expected.length||[...tile.requiredCells,...tile.fillerCells].length!==expected.length||[...tile.requiredCells,...tile.fillerCells].some(id=>!expected.includes(id)))throw Error('Required/filler ownership differs');
  const groups=new Map<string,{request:any;years:string[];partitionHours:number}>();
  const overrides=new Map<number,any>();for(const override of tile.overrides){if(!Number.isInteger(override.template)||override.template<0||override.template>=plan.calendarTemplates.length||overrides.has(override.template))throw Error('Invalid or duplicate calendar override');overrides.set(override.template,override);}
  const monthShapes=new Map<string,{days:string[];time:string[]}[]>();
  for(let i=0;i<plan.calendarTemplates.length;i++){
   const template=plan.calendarTemplates[i],override=overrides.get(i);
   const shapes=override?override.shapes:[{days:template.day,time:template.time}];
   for(const shape of shapes){
    if(template.year.length!==1||template.month.length!==1)throw Error('One source calendar month required');
    const year=template.year[0],month=template.month[0],days=shape.days,times=shape.time;
    if(!/^\d{4}$/.test(year)||! /^(0[1-9]|1[0-2])$/.test(month)||!days.length||!times.length||new Set(days).size!==days.length||new Set(times).size!==times.length)throw Error('Invalid grouped calendar shape');
    const lastDay=new Date(Date.UTC(+year,+month,0)).getUTCDate();
    if(days.some((d:string)=>!/^\d{2}$/.test(d)||+d<1||+d>lastDay)||times.some((t:string)=>! /^(0\d|1\d|2[0-3]):00$/.test(t)))throw Error('Invalid grouped Cartesian date');
    if(days.some((d:string)=>!template.day.includes(d))||times.some((t:string)=>!template.time.includes(t)))throw Error('Override exceeds source template');
    const first=Date.UTC(+year,+month-1,Math.min(...days.map(Number)),Math.min(...times.map((t:string)=>+t.slice(0,2))));
    const last=Date.UTC(+year,+month-1,Math.max(...days.map(Number)),Math.max(...times.map((t:string)=>+t.slice(0,2))));
    if(first<start||last>=end)throw Error('Grouped hour outside production clock');
    const monthKey=year+'-'+month,prior=monthShapes.get(monthKey)??[];
    if(prior.some(s=>s.days.some(d=>days.includes(d))&&s.time.some(t=>times.includes(t))))throw Error('Overlapping grouped calendar shapes');
    prior.push({days,time:times});monthShapes.set(monthKey,prior);
    const partitionHours=days.length*times.length;if(partitionHours>744||partitionHours>hoursCap)throw Error('Grouped partition exceeds hour bound');
    const request={...plan.requestDefaults,month:[month],day:[...days].sort(),time:[...times].sort(),area:tile.area};
    const key=canonicalRelease(request),group=groups.get(key)??{request,years:[],partitionHours};
    if(group.years.includes(year))throw Error('Duplicate grouped year/shape');group.years.push(year);groups.set(key,group);
   }
  }
  for(const group of groups.values()){
   group.years.sort();const width=Math.min(yearsCap,Math.floor(hoursCap/group.partitionHours));
   for(let offset=0;offset<group.years.length;offset+=width){
    const years=group.years.slice(offset,offset+width),request={...group.request,year:years};
    const identity={dataset:plan.dataset,revision:plan.revision,member:plan.member,request};
    const expectedHours=years.length*group.partitionHours;
    yield {status:'unapproved-nonexecuting',sha256:releaseSha(canonicalRelease(identity)),...identity,tileId:tile.tileId,expectedCells:tile.expectedCells,requiredCells:tile.requiredCells,fillerCells:tile.fillerCells,expectedHours,scalarCellHours:expectedHours*tile.expectedCells.length,partitions:years.map(year=>({year,month:request.month[0],expectedHours:group.partitionHours})),providerAcceptance:'unproved-for-this-group'};
   }
  }
 }
}
export interface ProductionHistoryPlannerOptions {inventoryPath:string;expectedInventorySha256:string;outputPath:string;prefixJobs:number;maxInputBytes?:number;maxVerifiedCellHours?:number;maxDurationMs?:number}
function bound(value:number|undefined,fallback:number){const n=value??fallback;if(!Number.isSafeInteger(n)||n<1||n>fallback)throw Error('Invalid planner budget');return n;}
/** All input/output identities are explicit; creation is exclusive and never overwrites. */
export async function planProductionHistory(options:ProductionHistoryPlannerOptions){
 if(!isAbsolute(options.inventoryPath)||!isAbsolute(options.outputPath))throw Error('Absolute planner paths required');
 const prefix=bound(options.prefixJobs,100),bytesLimit=bound(options.maxInputBytes,1024*1024*1024),rowsLimit=bound(options.maxVerifiedCellHours,1000000),duration=bound(options.maxDurationMs,30*60*1000),began=performance.now();
 let inputBytes=0,verified=0;const check=()=>{if(performance.now()-began>duration)throw Error('Planner deadline');};
 const root=dirname(resolve(options.inventoryPath));await releasePath(root,options.inventoryPath.slice(root.length+1));
 const inventoryBytes=await readTrustedClimateFile(options.inventoryPath,options.expectedInventorySha256,4*1024*1024);inputBytes+=inventoryBytes.length;if(inputBytes>bytesLimit)throw Error('Planner input budget');
 const inventory=productionHistoryInventorySchema.parse(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(inventoryBytes)));
 const ids=new Set<string>(),cells=new Map<string,z.infer<typeof cell>>(),pairs=new Set<string>();
 for(const d of inventory.destinations){if(ids.has(d.id))throw Error('Duplicate destination identity');ids.add(d.id);const expected=suppliedCellKey(d.latitude,d.longitude,d.timeZone);if(expected!==`${d.cell.cellId}|${d.timeZone}`||d.cell.cellId!==`era5:${d.cell.latitude}:${d.cell.longitude}`)throw Error('Explicit nearest grid mapping differs');cells.set(d.cell.cellId,d.cell);pairs.add(expected);}
 const coverage=new Map<string,Map<number,{value:number|null;raw:string}>>(),paths=new Set<string>();
 for(const chunk of inventory.completed){check();const path=await releasePath(root,chunk.path);if(paths.has(path))throw Error('Duplicate decoded path');paths.add(path);const bytes=await readTrustedClimateFile(path,chunk.sha256,4*1024*1024);inputBytes+=bytes.length;if(inputBytes>bytesLimit)throw Error('Planner input budget');
 const decoded=parseDecodedChunk(new TextDecoder('utf-8',{fatal:true}).decode(bytes));if(decoded.header.sourceSha256!==chunk.rawSha256||decoded.header.experimentVersions.length!==1||!['0001','1'].includes(decoded.header.experimentVersions[0]!))throw Error('Decoded source/revision pin differs');
 for(const c of decoded.header.cells){const observations=coverage.get(c.cellId)??new Map<number,{value:number|null;raw:string}>();coverage.set(c.cellId,observations);for(const sample of decoded.samplesForCell(c.cellId)){check();if(++verified>rowsLimit)throw Error('Verified cell-hour budget');const t=Date.parse(sample.atUtc);if(t<start||t>=end)throw Error('Completed hour outside production clock');const index=(t-start)/hour;const previous=observations.get(index);if(previous&&(previous.value!==sample.cloudFraction))throw Error('Conflicting decoded value/source revision');observations.set(index,{value:sample.cloudFraction,raw:chunk.rawSha256});}}
 }
 // Retrieved nulls are missing scientifically, but are not permission to request again.
 let covered=0;for(const key of cells.keys())for(const observation of coverage.get(key)?.values()??[])covered++;
 const proposals:any[]=[];let proposedHours=0;
 outer:for(const [key,c] of [...cells].sort(([a],[b])=>a.localeCompare(b))){const known=coverage.get(key);let day=start;
 while(day<end){check();const date=new Date(day),year=String(date.getUTCFullYear()),month=String(date.getUTCMonth()+1).padStart(2,'0');const groups=new Map<string,string[]>();
 while(day<end&&new Date(day).getUTCMonth()===date.getUTCMonth()){const missing:string[]=[];for(let h=0;h<24;h++){const found=known?.get((day-start)/hour+h);if(!found)missing.push(`${String(h).padStart(2,'0')}:00`);}if(missing.length){const shape=missing.join(',');const days=groups.get(shape)??[];days.push(String(new Date(day).getUTCDate()).padStart(2,'0'));groups.set(shape,days);}day+=24*hour;}
 for(const [shape,days] of groups){const times=shape.split(','),count=times.length*days.length;const request={product_type:['reanalysis'],variable:['total_cloud_cover'],year:[year],month:[month],day:days,time:times,data_format:'netcdf',download_format:'unarchived',area:[c.latitude,c.longitude,c.latitude,c.longitude]};const identity={dataset:'reanalysis-era5-single-levels',revision:'0001',member:0,request};proposals.push({sha256:releaseSha(canonicalRelease(identity)),...identity,cellId:key,expectedHours:count,scalarCellHours:count});proposedHours+=count;if(proposals.length===prefix)break outer;}
 }}
 const manifest={schemaVersion:1,status:'unapproved-nonexecuting',inventorySha256:options.expectedInventorySha256,sourceClock:{startInclusive:SOURCE_START,endExclusive:SOURCE_END,hourCount:SOURCE_HOURS},mappingInventory:inventory.destinations,gazetteerEdition:inventory.gazetteerEdition,timezoneVersion:inventory.timezoneVersion,completedPins:inventory.completed,requirements:{uniqueCells:cells.size,uniqueCellZonePairs:pairs.size,sourceCellHours:cells.size*SOURCE_HOURS,pairHours:pairs.size*SOURCE_HOURS,verifiedCompletedCellHours:covered,remainingCellHours:cells.size*SOURCE_HOURS-covered},prefix:{limit:prefix,jobs:proposals.length,scalarCellHours:proposedHours,complete:proposedHours===cells.size*SOURCE_HOURS-covered,requests:proposals},budgets:{maxInputBytes:bytesLimit,maxVerifiedCellHours:rowsLimit,maxDurationMs:duration,maxCellsPerRequest:1,maxHoursPerRequest:744,maxRawBytes:32*1024*1024,maxPartitionBytes:4*1024*1024,maxPartitionHours:800,maxActiveJobs:1},route:'legacy-CDS-proposal-only; ARCO/time-series unadmitted'};
 check();const text=canonicalRelease(manifest);if(Buffer.byteLength(text)>8*1024*1024)throw Error('Planner output budget');if(resolve(await realpath(dirname(options.outputPath)))!==resolve(dirname(options.outputPath))||basename(options.outputPath).includes(':'))throw Error('Output parent alias');await releasePath(root,basename(options.inventoryPath));inputBytes+=(await readTrustedClimateFile(options.inventoryPath,options.expectedInventorySha256,4*1024*1024)).length;if(inputBytes>bytesLimit)throw Error('Planner input budget');for(const c of inventory.completed){inputBytes+=(await readTrustedClimateFile(await releasePath(root,c.path),c.sha256,4*1024*1024)).length;if(inputBytes>bytesLimit)throw Error('Planner input budget');check();}const temporary=join(dirname(options.outputPath),'.history-plan-'+randomUUID()+'.tmp');let owns=false;try{const file=await open(temporary,'wx');owns=true;try{await file.writeFile(text);await file.sync();}finally{await file.close();}check();await link(temporary,options.outputPath);}finally{if(owns)await unlink(temporary);}return {manifest,sha256:releaseSha(text)};
}



if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2),allowed=new Set(['--inventory','--expected-inventory-sha256','--output','--prefix-jobs','--max-input-bytes','--max-verified-cell-hours','--max-duration-ms']);
 (async()=>{const parsed=new Map<string,string>();for(let i=0;i<args.length;i+=2){const key=args[i]!,value=args[i+1];if(!allowed.has(key)||parsed.has(key)||!value||value.startsWith('--'))throw Error('Unknown, duplicate or incomplete planner argument');parsed.set(key,value);}const required=(key:string)=>{const value=parsed.get(key);if(!value)throw Error('Required '+key);return value;};const numeric=(key:string)=>{const value=parsed.get(key);if(value===undefined)return undefined;if(!/^[1-9][0-9]*$/.test(value))throw Error('Invalid numeric planner argument');return Number(value);};const result=await planProductionHistory({inventoryPath:required('--inventory'),expectedInventorySha256:required('--expected-inventory-sha256'),outputPath:required('--output'),prefixJobs:Number(required('--prefix-jobs')),maxInputBytes:numeric('--max-input-bytes'),maxVerifiedCellHours:numeric('--max-verified-cell-hours'),maxDurationMs:numeric('--max-duration-ms')});console.log(JSON.stringify({status:result.manifest.status,sha256:result.sha256,jobs:result.manifest.prefix.jobs}));})().catch(e=>{console.error(e.message);process.exitCode=1;});
}
