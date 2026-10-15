/** Offline complete request inventory; no acquisition or publication to a serving release. */
import {open,link,unlink,realpath} from 'node:fs/promises';
import {dirname,resolve,isAbsolute,join,basename} from 'node:path';
import {randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {readTrustedClimateFile,suppliedCellKey} from '../../server/providers/climate/tiledEra5';
import {releasePath,releaseSha,canonicalRelease} from '../../server/providers/climate/releaseEra5';
import {parseDecodedChunk} from './chunks';
import {productionHistoryInventorySchema,SOURCE_START,SOURCE_END,SOURCE_HOURS} from './plan-production-history';
const H=3600000,START=Date.parse(SOURCE_START),END=Date.parse(SOURCE_END),MiB=1024*1024;
export const GLOBAL_RETAINED_RAW_READ_LIMIT=8*MiB;
type Band=[number,number];
/** Inclusive disjoint grid-node bands. Every unforced band has two or three nodes. */
export function partitionBands(count:number,forced:Band[]):Band[]{
 const fixed=[...new Map(forced.map(b=>[b.join(':'),b])).values()].sort((a,b)=>a[0]-b[0]);
 const out:Band[]=[];let cursor=0;
 const gap=(end:number)=>{let n=end-cursor;if(n===1)throw Error('Unpartitionable singleton grid gap');while(n){const width=n%2?3:2;out.push([cursor,cursor+width-1]);cursor+=width;n-=width;}};
 for(const [a,b] of fixed){if(a<cursor||b<a+1||b-a>2||b>=count)throw Error('Incompatible retained spatial bands');gap(a);out.push([a,b]);cursor=b+1;}gap(count);return out;
}
export function calendarMonths(){const months:{year:string;month:string;days:string[];start:number}[]=[];for(let t=START;t<END;){const date=new Date(t),year=String(date.getUTCFullYear()),month=String(date.getUTCMonth()+1).padStart(2,'0'),days:string[]=[];const start=t;while(t<END&&new Date(t).getUTCMonth()===date.getUTCMonth()){days.push(String(new Date(t).getUTCDate()).padStart(2,'0'));t+=24*H;}months.push({year,month,days,start});}return months;}
export function missingShapes(m:ReturnType<typeof calendarMonths>[number],known:Set<number>){const groups=new Map<string,string[]>();for(const d of m.days){const time=Array.from({length:24},(_,h)=>h).filter(h=>!known.has(Date.UTC(+m.year,+m.month-1,+d,h))).map(h=>String(h).padStart(2,'0')+':00');if(!time.length)continue;const k=time.join(','),days=groups.get(k)??[];days.push(d);groups.set(k,days);}return [...groups].map(([k,days])=>({days,time:k.split(',')}));}
const key=(lat:number,lon:number)=>`era5:${lat}:${lon}`;
export interface GlobalPlanOptions {root:string;manifestPath:string;manifestSha256:string;verificationPath:string;verificationSha256:string;outputPath:string;maxInputBytes?:number;maxOutputBytes?:number;maxDurationMs?:number}
export async function planGlobalHistory(o:GlobalPlanOptions){
 for(const p of [o.root,o.outputPath])if(!isAbsolute(p))throw Error('Absolute root/output required');
 const limit=(n:number|undefined,max:number)=>{if(n!==undefined&&(!Number.isSafeInteger(n)||n<1||n>max))throw Error('Planner budget');return n??max;};
 const maxInput=limit(o.maxInputBytes,128*MiB),maxOutput=limit(o.maxOutputBytes,256*MiB),deadline=limit(o.maxDurationMs,600000),began=performance.now();let readBytes=0;
 const check=()=>{if(performance.now()-began>deadline)throw Error('Global planner deadline; no automatic restart');};
 const pins:{path:string;sha256:string;bytes:number}[]=[];
 async function read(path:string,sha256:string,max:number){check();const b=await readTrustedClimateFile(await releasePath(o.root,path),sha256,Math.min(max,maxInput-readBytes));readBytes+=b.length;if(readBytes>maxInput)throw Error('Global planner input cap');pins.push({path,sha256,bytes:b.length});return b;}
 const manifest=JSON.parse((await read(o.manifestPath,o.manifestSha256,MiB)).toString('utf8'));
 const verification=JSON.parse((await read(o.verificationPath,o.verificationSha256,MiB)).toString('utf8'));
 if(manifest.schemaVersion!==1||manifest.counts.uniqueCells!==54822||manifest.counts.destinations!==236042||manifest.counts.uniqueCellZonePairs!==56039||manifest.batches.length!==48)throw Error('Frozen named inventory differs');
 const cells=new Map<string,{latitude:number;longitude:number}>(),pairs=new Set<string>(),ids=new Set<string>();let destinations=0;
 for(const ref of manifest.batches){const batch=productionHistoryInventorySchema.parse(JSON.parse((await read(ref.path,ref.sha256,4*MiB)).toString('utf8')));if(batch.destinations.length!==ref.destinations)throw Error('Batch count');for(const d of batch.destinations){check();if(ids.has(d.id))throw Error('Duplicate named destination');ids.add(d.id);const k=suppliedCellKey(d.latitude,d.longitude,d.timeZone);if(k!==d.cell.cellId+'|'+d.timeZone||d.cell.cellId!==key(d.cell.latitude,d.cell.longitude))throw Error('Named cell mapping');cells.set(d.cell.cellId,d.cell);pairs.add(k);destinations++;}}
 if(destinations!==236042||cells.size!==54822||pairs.size!==56039)throw Error('Global batch union differs');
 for(const kind of ['cells','pairs']){const ref=manifest.files[kind];const lines=(await read(ref.path,ref.sha256,8*MiB)).toString('utf8').trim().split('\n');const seen=new Set<string>();for(const line of lines){const c=JSON.parse(line),k=kind==='cells'?c.cellId:c.key;if(seen.has(k)||(kind==='cells'?!cells.has(k):!pairs.has(k)))throw Error('Frozen global set differs');seen.add(k);}if(seen.size!==(kind==='cells'?cells.size:pairs.size))throw Error('Frozen global set count');}
 const retained=new Map<string,Map<number,number|null>>(),rectangles:{lat:Band;lon:Band}[]=[];const rawPins=new Set<string>(),decodedPins=new Set<string>(),ledgerPins=new Set<string>();
 for(const e of verification.retainedEntries){const path=e.path.replaceAll('\\','/'),rawPath=e.rawPath.replaceAll('\\','/'),ledgerPath=e.ledgerPath.replaceAll('\\','/');
 const bytes=await read(path,e.sha256,4*MiB),decoded=parseDecodedChunk(bytes.toString('utf8'));decodedPins.add(e.sha256);
 if(!rawPins.has(e.rawSha256)){await read(rawPath,e.rawSha256,GLOBAL_RETAINED_RAW_READ_LIMIT);rawPins.add(e.rawSha256);}if(!ledgerPins.has(e.ledgerSha256)){await read(ledgerPath,e.ledgerSha256,4*MiB);ledgerPins.add(e.ledgerSha256);}
 if(decoded.header.sourceSha256!==e.rawSha256||decoded.header.experimentVersions.length!==1||!['0001','1'].includes(decoded.header.experimentVersions[0]!)||decoded.header.member!==0)throw Error('Retained final revision pin');
 const cs=decoded.header.cells,ls=cs.map(c=>Math.round((c.latitude+90)*4)),xs=cs.map(c=>Math.round((c.longitude+180)*4));const lat:Band=[Math.min(...ls),Math.max(...ls)],lon:Band=[Math.min(...xs),Math.max(...xs)];
 if((lat[1]-lat[0]+1)*(lon[1]-lon[0]+1)!==cs.length)throw Error('Retained nonrectangular grid');rectangles.push({lat,lon});
 for(const c of cs){const rows=retained.get(c.cellId)??new Map<number,number|null>();retained.set(c.cellId,rows);for(const s of decoded.samplesForCell(c.cellId)){const t=Date.parse(s.atUtc);if(t<START||t>=END)throw Error('Retained outside clock');if(rows.has(t)&&rows.get(t)!==s.cloudFraction)throw Error('Conflicting retained scalar');rows.set(t,s.cloudFraction);}}
 }
 const latBands=partitionBands(721,rectangles.map(r=>r.lat)),latLookup=new Map<number,number>();latBands.forEach(([a,b],i)=>{for(let p=a;p<=b;p++)latLookup.set(p,i);});
 const lonBands=latBands.map(lat=>partitionBands(1440,rectangles.filter(r=>r.lat[0]===lat[0]&&r.lat[1]===lat[1]).map(r=>r.lon)));
 const lonLookup=lonBands.map(bs=>{const m=new Map<number,number>();bs.forEach(([a,b],i)=>{for(let p=a;p<=b;p++)m.set(p,i);});return m;});
 const owned=new Map<string,{lat:Band;lon:Band;selected:string[]}>();for(const [id,c] of cells){const row=latLookup.get(Math.round((c.latitude+90)*4))!,col=lonLookup[row]!.get(Math.round((c.longitude+180)*4))!,k=row+':'+col;const t=owned.get(k)??{lat:latBands[row]!,lon:lonBands[row]![col]!,selected:[]};t.selected.push(id);owned.set(k,t);}
 const months=calendarMonths(),templates=months.map(m=>({year:[m.year],month:[m.month],day:m.days,time:Array.from({length:24},(_,h)=>String(h).padStart(2,'0')+':00')}));
 let requiredRetained=0,acquisitionCells=0,allRetained=0,requests=0,scalarHours=0;const tiles:any[]=[];
 for(const [tileId,t] of [...owned].sort(([a],[b])=>a.localeCompare(b,'en'))){check();const expectedCells:string[]=[];for(let y=t.lat[0];y<=t.lat[1];y++)for(let x=t.lon[0];x<=t.lon[1];x++)expectedCells.push(key(y/4-90,x/4-180));if(expectedCells.length>10)throw Error('Grouped parent cell cap');acquisitionCells+=expectedCells.length;
 const shape0=new Set(retained.get(expectedCells[0]!)?.keys()??[]);for(const id of expectedCells){const rows=retained.get(id);if((rows?.size??0)!==shape0.size||[...(rows?.keys()??[])].some(t=>!shape0.has(t)))throw Error('Retained scalar masks differ inside minimum-area rectangle; cannot propose exact subtraction');if(cells.has(id))requiredRetained+=rows?.size??0;allRetained+=rows?.size??0;}
 const overrides:any[]=[];let count=months.length;for(let i=0;i<months.length;i++){const m=months[i]!;if(![...shape0].some(t=>t>=m.start&&t<m.start+m.days.length*24*H))continue;const shapes=missingShapes(m,shape0);overrides.push({template:i,shapes});count+=shapes.length-1;}
 requests+=count;scalarHours+=expectedCells.length*(SOURCE_HOURS-shape0.size);
 tiles.push({tileId,area:[t.lat[1]/4-90,t.lon[0]/4-180,t.lat[0]/4-90,t.lon[1]/4-180],expectedCells,requiredCells:t.selected.sort(),fillerCells:expectedCells.filter(c=>!cells.has(c)),overrides,requestCount:count});
 }
 if(requiredRetained!==16416||requiredRetained!==verification.verifiedRetainedProductionCellHours)throw Error('Verified production subtraction differs');
 const result={schemaVersion:1,status:'PROPOSED-NONEXECUTING-FULL-NAMED-REQUEST-INVENTORY',scope:manifest.scope,inventorySha256:o.manifestSha256,verificationSha256:o.verificationSha256,inputPins:pins,sourceClock:{startInclusive:SOURCE_START,endExclusive:SOURCE_END,hoursPerCell:SOURCE_HOURS},dataset:'reanalysis-era5-single-levels',revision:'0001',member:0,requestDefaults:{product_type:['reanalysis'],variable:['total_cloud_cover'],data_format:'netcdf',download_format:'unarchived'},calendarTemplates:templates,expansion:'For each tile, visit templates in order; replace a template with its override shapes (empty means no request); use tile.area and shape.day/time with template.year/month. No source node belongs to two tiles.',tiles,counts:{destinations,uniqueRequiredCells:cells.size,uniqueCellZonePairs:pairs.size,tiles:tiles.length,requests,acquisitionCells,fillerCells:acquisitionCells-cells.size,requiredSourceCellHours:cells.size*SOURCE_HOURS,retainedRequiredCellHours:requiredRetained,missingRequiredCellHours:cells.size*SOURCE_HOURS-requiredRetained,retainedAllAcquisitionCellHours:allRetained,proposedScalarCellHours:scalarHours,distinctProspectiveRawPins:requests,minimumProspectiveDecodedPins:requests,prospectiveRawAndDecodedUnionLowerBound:requests*2,retainedRawPins:rawPins.size,retainedDecodedPins:decodedPins.size,retainedMetadataPins:ledgerPins.size},bounds:{maxInputBytes:maxInput,maxOutputBytes:maxOutput,maxDurationMs:deadline,maxCellsPerRequest:9,maxHoursPerRequest:744,maxScalarHoursPerRequest:6696,existingGroupedScalarHourCap:22320,automaticRetries:0},limitations:['No HTTP, CDS request, account access, solar calculation, dataset acquisition or serving installation performed.','Filler nodes are acquisition overhead only; no extra named coverage, timezone pair or scientific completeness follows.','Provider acceptance and transfer bytes remain unproved.','Existing flat global source union cap 10000 cannot admit this prospective lineage; hierarchy follow-on required before full acquisition/publication.']};
 const text=canonicalRelease(result);if(Buffer.byteLength(text)>maxOutput)throw Error('Global planner output cap');check();if(resolve(await realpath(dirname(o.outputPath)))!==resolve(dirname(o.outputPath))||basename(o.outputPath).includes(':'))throw Error('Output parent alias');const temp=join(dirname(o.outputPath),'.global-plan-'+randomUUID()+'.tmp');let owns=false;try{const f=await open(temp,'wx');owns=true;try{await f.writeFile(text);await f.sync();}finally{await f.close();}check();await link(temp,o.outputPath);}finally{if(owns)await unlink(temp);}return {sha256:releaseSha(text),bytes:Buffer.byteLength(text),readBytes,counts:result.counts};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){const a=process.argv.slice(2);(async()=>{if(a.length!==7)throw Error('Required: root manifest manifestSha verification verificationSha newOutput maxDurationMs');console.log(JSON.stringify(await planGlobalHistory({root:a[0]!,manifestPath:a[1]!,manifestSha256:a[2]!,verificationPath:a[3]!,verificationSha256:a[4]!,outputPath:a[5]!,maxDurationMs:Number(a[6])})));})().catch(e=>{console.error(e.message);process.exitCode=1;});}


/** Lazy exact legacy request expansion: one identity at a time, no hour arrays. */
export function* expandGlobalHistoryRequests(plan:any):Generator<any>{
 for(const tile of plan.tiles)for(let i=0;i<plan.calendarTemplates.length;i++){
  const template=plan.calendarTemplates[i],override=tile.overrides.find((v:any)=>v.template===i);
  const shapes=override?override.shapes:[{days:template.day,time:template.time}];
  for(let shape=0;shape<shapes.length;shape++){
   const s=shapes[shape],request={...plan.requestDefaults,year:template.year,month:template.month,day:s.days,time:s.time,area:tile.area};
   const identity={dataset:plan.dataset,revision:plan.revision,member:plan.member,request};
   const expectedHours=s.days.length*s.time.length;
   if(expectedHours>744||tile.expectedCells.length>10||expectedHours*tile.expectedCells.length>22320)throw Error('Expanded request exceeds parent bounds');
   yield {requestId:`${tile.tileId}:${i}:${shape}`,sha256:releaseSha(canonicalRelease(identity)),...identity,expectedCells:tile.expectedCells,requiredCells:tile.requiredCells,fillerCells:tile.fillerCells,expectedHours,scalarCellHours:expectedHours*tile.expectedCells.length};
  }
 }
}
