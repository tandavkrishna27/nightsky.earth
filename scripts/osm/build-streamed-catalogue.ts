import {mkdir,open,writeFile,readFile,rename,lstat,realpath} from 'node:fs/promises';
import {resolve,join,parse} from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {catalogueCandidateSchema,cataloguePageSchema,catalogueRootSchema,footprintSchema,normalizeCatalogueName,MAX_LEAF_BYTES,MAX_DIRECTORY_BYTES,type CatalogueCandidate,type CoverageFootprint,type CataloguePage,type PageRef,type Bounds} from '../../server/places/catalogueFormat';
import {catalogueRevisionSchema,regionRefSchema,type RegionRef} from '../../shared/nightsky/discovery';
import {jsonStringBytes} from './normalized-input-bytes';

export interface StreamedCatalogueInput {
 catalogueRevision:string;
 candidates:AsyncIterable<CatalogueCandidate>;
 regions:AsyncIterable<RegionRef>;
 footprints:AsyncIterable<CoverageFootprint>;
}
export interface StreamedCatalogueOptions {
 chunkRows?:number;mergeFanIn?:number;maxRows?:number;fanout?:number;
 maxInputRows?:number;maxMetadataRows?:number;maxInputBytes?:number;
 maxOutputBytes?:number;maxScratchBytes?:number;timeoutMs?:number;
}
export interface StreamedBuildStats {
 inputRows:number;metadataRows:number;inputBytes:number;scratchBytes:number;outputBytes:number;
 maxBufferedRows:number;maxOpenSortReaders:number;mergeLevels:number;pages:number;
}
/** Errors after scratch creation carry a snapshot of attempted byte accounting and the evidence directory. */
export interface StreamedCatalogueFailure extends Error {stats:StreamedBuildStats;scratchDir:string;}
function stable(value:unknown):string {
 if(Array.isArray(value))return '['+value.map(stable).join(',')+']';
 if(value&&typeof value==='object')return '{'+Object.entries(value).filter(([,v])=>v!==undefined).sort(([a],[b])=>compare(a,b)).map(([k,v])=>JSON.stringify(k)+':'+stable(v)).join(',')+'}';
 return JSON.stringify(value);
}
const compare=(a:string,b:string)=>a<b?-1:a>b?1:0;
function unionBounds(items:Bounds[]):Bounds|undefined {
 let result:Bounds|undefined;
 for(const b of items)result=result?{south:Math.min(result.south,b.south),north:Math.max(result.north,b.north),west:Math.min(result.west,b.west),east:Math.max(result.east,b.east)}:{...b};
 return result;
}
/** Offline normalized-input build. Scratch is retained on success and failure for inspection. */
export async function buildStreamedCatalogue(input:StreamedCatalogueInput,outputDir:string,options:StreamedCatalogueOptions={}) {
 const settings={chunkRows:1000,mergeFanIn:8,maxRows:1000,fanout:128,maxInputRows:100000,maxMetadataRows:10000,maxInputBytes:128*1024*1024,maxOutputBytes:128*1024*1024,maxScratchBytes:128*1024*1024,timeoutMs:60000,...options};
 const ceilings={chunkRows:10000,mergeFanIn:16,maxRows:10000,fanout:256,maxInputRows:10000000,maxMetadataRows:10000,maxInputBytes:10*1024**3,maxOutputBytes:10*1024**3,maxScratchBytes:10*1024**3,timeoutMs:1800000};
 for(const key of Object.keys(ceilings) as (keyof typeof ceilings)[]){const n=settings[key];if(!Number.isSafeInteger(n)||n<(key==='mergeFanIn'||key==='fanout'?2:1)||n>ceilings[key])throw new RangeError(`Invalid ${key} limit`);}
 const stats:StreamedBuildStats={inputRows:0,metadataRows:0,inputBytes:0,scratchBytes:0,outputBytes:0,maxBufferedRows:0,maxOpenSortReaders:0,mergeLevels:0,pages:0};
 let buffered=0,openReaders=0,serial=0;
 const deadline=Date.now()+settings.timeoutMs;
 const checkpoint=()=>{if(Date.now()>=deadline)throw new RangeError('Build deadline limit');};
 const buffer=(n:number)=>{buffered+=n;stats.maxBufferedRows=Math.max(stats.maxBufferedRows,buffered);};
 async function timed<T>(promise:Promise<T>):Promise<T>{checkpoint();let timer:ReturnType<typeof setTimeout>|undefined;try{return await Promise.race([promise,new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new RangeError('Build deadline limit')),Math.max(1,deadline-Date.now()));})]);}finally{clearTimeout(timer);}}
 const dir=resolve(outputDir);
 // Inspect existing ancestors before any directory creation; never recursively traverse a link.
 let cursor=parse(dir).root;
 for(const part of dir.slice(cursor.length).split(/[\\/]/).filter(Boolean)){
  checkpoint();cursor=join(cursor,part);
  try{const info=await lstat(cursor);if(info.isSymbolicLink())throw new TypeError('Symlink output path rejected');if(!info.isDirectory())throw new TypeError('Output ancestor must be a directory');}
  catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;await mkdir(cursor);const info=await lstat(cursor);if(info.isSymbolicLink()||!info.isDirectory())throw new TypeError('Invalid output child');}
 }
 const canonical=await realpath(dir),scratch=join(canonical,`.stream-build-${randomUUID()}`);await mkdir(scratch);
 try {
 if(await realpath(scratch)!==scratch)throw new TypeError('Invalid scratch child');
 const pagesDir=join(canonical,'pages');
 try{const info=await lstat(pagesDir);if(info.isSymbolicLink())throw new TypeError('Symlink pages path rejected');if(!info.isDirectory())throw new TypeError('Pages path must be a directory');}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;await mkdir(pagesDir);}
 const revision=catalogueRevisionSchema.parse(input.catalogueRevision),base={schemaVersion:2 as const,catalogueRevision:revision};
 const scratchPath=(label:string)=>join(scratch,`${serial++}-${label}.jsonl`);
 async function append(h:Awaited<ReturnType<typeof open>>,value:unknown){checkpoint();const bytes=Buffer.from(stable(value)+'\n');if(stats.scratchBytes+bytes.length>settings.maxScratchBytes)throw new RangeError('Scratch byte limit');stats.scratchBytes+=bytes.length;await h.writeFile(bytes);}
 async function* lines<T>(path:string):AsyncGenerator<T>{
  const h=await open(path,'r');openReaders++;stats.maxOpenSortReaders=Math.max(stats.maxOpenSortReaders,openReaders);
  try{const bytes=Buffer.alloc(4096);let pending='';const decoder=new TextDecoder();while(true){checkpoint();const {bytesRead}=await h.read(bytes,0,bytes.length,null);if(!bytesRead)break;pending+=decoder.decode(bytes.subarray(0,bytesRead),{stream:true});let end:number;while((end=pending.indexOf('\n'))>=0){const line=pending.slice(0,end);pending=pending.slice(end+1);yield JSON.parse(line) as T;}if(Buffer.byteLength(pending)>MAX_LEAF_BYTES)throw new RangeError('Scratch row byte limit');}pending+=decoder.decode();if(pending)throw new TypeError('Unterminated scratch row');}finally{openReaders--;await h.close();}
 }
 async function* admitted<T>(iterable:AsyncIterable<T>,schema:{parse(value:unknown):T},metadata=false):AsyncGenerator<T>{
  if(!iterable||typeof iterable[Symbol.asyncIterator]!=='function')throw new TypeError('Async normalized input required');
  const iterator=iterable[Symbol.asyncIterator]();
  // A stalled third-party next() cannot hold the build indefinitely. Do not await its potentially stalled return().
  let complete=false;
  try {while(true){const next=await timed(Promise.resolve().then(()=>iterator.next()));checkpoint();if(next.done){complete=true;break;}
   if(metadata){if(++stats.metadataRows>settings.maxMetadataRows)throw new RangeError('Metadata row limit');}else if(++stats.inputRows>settings.maxInputRows)throw new RangeError('Input row limit');
   let inspected=0;const visiting=new Set<object>();
   function inspect(v:unknown,depth=0){if(depth>32)throw new RangeError('Input depth limit');inspected+=2;if(typeof v==='string')inspected+=jsonStringBytes(v,Math.min(MAX_LEAF_BYTES-inspected,settings.maxInputBytes-stats.inputBytes-inspected),checkpoint);else if(v&&typeof v==='object'){if(visiting.has(v))throw new TypeError('Cyclic input');visiting.add(v);let properties=0;for(const key in v){if(!Object.hasOwn(v,key))continue;if(++properties>100000)throw new RangeError('Input property limit');inspect(key,depth+1);inspect((v as Record<string,unknown>)[key],depth+1);}visiting.delete(v);}else inspected+=32;if(inspected>MAX_LEAF_BYTES||stats.inputBytes+inspected>settings.maxInputBytes)throw new RangeError('Input byte limit');}
   inspect(next.value);stats.inputBytes+=inspected;yield schema.parse(next.value);
  }} finally {
   if(!complete&&iterator.return)try{void Promise.resolve(iterator.return()).catch(()=>undefined);}catch{/* Preserve the original validation/deadline failure. */}
  }
 }
 type Order<T>=(a:T,b:T)=>number;
 // Run names are numeric, so the full run inventory is never resident.
 async function sort<T>(iterable:AsyncIterable<T>,order:Order<T>):Promise<string>{
  const prefix=`sort-${serial++}`,run=(level:number,index:number)=>join(scratch,`${prefix}-${level}-${index}.jsonl`);
  let count=0,chunk:T[]=[];
  async function flush(){chunk.sort(order);const h=await open(run(0,count++),'wx');try{for(const value of chunk)await append(h,value);}finally{await h.close();buffer(-chunk.length);chunk=[];}}
  try{for await(const value of iterable){checkpoint();chunk.push(value);buffer(1);if(chunk.length===settings.chunkRows)await flush();}if(chunk.length)await flush();}finally{buffer(-chunk.length);}
  if(!count){const h=await open(run(0,0),'wx');await h.close();return run(0,0);}
  let level=0;
  while(count>1){let nextCount=0;for(let start=0;start<count;start+=settings.mergeFanIn){
   const size=Math.min(settings.mergeFanIn,count-start),readers=Array.from({length:size},(_,i)=>lines<T>(run(level,start+i))),heads:IteratorResult<T>[]=[];
   const h=await open(run(level+1,nextCount++),'wx');
   try{for(const reader of readers){const head=await reader.next();heads.push(head);if(!head.done)buffer(1);}
    while(true){let best=-1;for(let i=0;i<heads.length;i++)if(!heads[i].done&&(best<0||order(heads[i].value,heads[best].value)<0))best=i;if(best<0)break;await append(h,heads[best].value);buffer(-1);heads[best]=await readers[best].next();if(!heads[best].done)buffer(1);}
   }finally{for(const head of heads)if(!head.done)buffer(-1);for(const reader of readers)await reader.return(undefined);await h.close();}
  }count=nextCount;level++;stats.mergeLevels=Math.max(stats.mergeLevels,level);}
  return run(level,0);
 }
 async function publish(page:CataloguePage,route:Partial<Pick<PageRef,'bounds'|'minKey'|'maxKey'>>={}):Promise<PageRef>{
  checkpoint();cataloguePageSchema.parse(page);const payload=Buffer.from(stable(page)+'\n'),limit=page.kind==='directory'?MAX_DIRECTORY_BYTES:MAX_LEAF_BYTES;if(payload.length>limit)throw new RangeError('Page byte limit');
  if(stats.outputBytes+payload.length>settings.maxOutputBytes)throw new RangeError('Output byte limit');stats.outputBytes+=payload.length;
  const sha256=createHash('sha256').update(payload).digest('hex'),path=`pages/${sha256}.json`;
  try{await writeFile(join(canonical,path),payload,{flag:'wx'});}catch(error){if((error as NodeJS.ErrnoException).code!=='EEXIST')throw error;const existingPath=join(canonical,path);if((await lstat(existingPath)).isSymbolicLink())throw new TypeError('Symlink page rejected');const h=await open(existingPath,'r');try{if((await h.stat()).size!==payload.length)throw new TypeError('Immutable page conflict');const data=Buffer.alloc(payload.length);let read=0;while(read<data.length){const r=await h.read(data,read,data.length-read,null);if(!r.bytesRead)break;read+=r.bytesRead;}if(read!==data.length||!data.equals(payload))throw new TypeError('Immutable page conflict');}finally{await h.close();}}
  stats.pages++;return {path,sha256,bytes:payload.length,rows:page.kind==='directory'?page.entries.length:page.rows.length,kind:page.kind,...route};
 }
 async function hierarchy(path:string,count:number):Promise<PageRef>{
  if(!count)return publish({...base,kind:'directory',entries:[]});
  while(count>1){const next=scratchPath('references'),h=await open(next,'wx');let nextCount=0,entries:PageRef[]=[];
   async function flush(){const bounds=unionBounds(entries.flatMap(e=>e.bounds?[e.bounds]:[])),minKey=entries[0].minKey,maxKey=entries.at(-1)!.maxKey;const ref=await publish({...base,kind:'directory',entries},{...(bounds?{bounds}:{}),...(minKey!==undefined?{minKey,maxKey}:{})});await append(h,ref);nextCount++;buffer(-entries.length);entries=[];}
   try{for await(const ref of lines<PageRef>(path)){entries.push(ref);buffer(1);if(entries.length===settings.fanout)await flush();}if(entries.length)await flush();}finally{buffer(-entries.length);await h.close();}
   path=next;count=nextCount;
  }
  const reader=lines<PageRef>(path);try{return (await reader.next()).value!;}finally{await reader.return(undefined);}
 }
 async function pages<T>(kind:Exclude<CataloguePage['kind'],'directory'>,iterable:AsyncIterable<T>,key:(r:T)=>string,bounds?:(r:T)=>Bounds,onLeaf?:(rows:T[],ref:PageRef)=>Promise<void>):Promise<PageRef>{
  const refs=scratchPath('leaves'),h=await open(refs,'wx');let count=0,part:T[]=[];
  async function leaf(rows:T[]):Promise<void>{const page={...base,kind,rows} as CataloguePage;if(Buffer.byteLength(stable(page)+'\n')>MAX_LEAF_BYTES&&rows.length>1){const middle=Math.floor(rows.length/2);await leaf(rows.slice(0,middle));await leaf(rows.slice(middle));return;}const b=bounds?unionBounds(rows.map(bounds)):undefined;const ref=await publish(page,{...(rows.length&&kind!=='candidates'?{minKey:key(rows[0]),maxKey:key(rows.at(-1)!)}:{}),...(b?{bounds:b}:{})});await append(h,ref);count++;if(onLeaf)await onLeaf(rows,ref);}
  try{for await(const row of iterable){checkpoint();part.push(row);buffer(1);if(part.length===settings.maxRows){await leaf(part);buffer(-part.length);part=[];}}if(part.length){await leaf(part);buffer(-part.length);part=[];}}finally{buffer(-part.length);await h.close();}
  return hierarchy(refs,count);
 }
 const regionsPath=await sort(admitted(input.regions,regionRefSchema,true),(a,b)=>compare(a.regionId,b.regionId));
 const allowed=new Set<string>();for await(const region of lines<RegionRef>(regionsPath)){if(allowed.has(region.regionId))throw new TypeError('Duplicate region identity');allowed.add(region.regionId);}
 async function* footprints(){let previous:string|undefined;const path=await sort(admitted(input.footprints,footprintSchema,true),(a,b)=>compare(a.footprintId,b.footprintId));for await(const row of lines<CoverageFootprint>(path)){if(previous===row.footprintId)throw new TypeError('Duplicate footprint identity');if(row.regionIds?.some(id=>!allowed.has(id)))throw new TypeError('Unknown footprint region');previous=row.footprintId;yield row;}}
 const idSorted=await sort(admitted(input.candidates,catalogueCandidateSchema),(a,b)=>compare(a.placeId,b.placeId));
 async function* unique(){let previous:CatalogueCandidate|undefined;for await(const row of lines<CatalogueCandidate>(idSorted)){if(row.catalogueRevision!==revision)throw new TypeError('Candidate edition mismatch');if(row.regionIds.some(id=>!allowed.has(id)))throw new TypeError('Unknown candidate region');if(previous?.placeId===row.placeId){if(stable(previous)!==stable(row))throw new TypeError(`Identity conflict quarantined: ${row.placeId}`);}else{previous=row;yield row;}}}
 const spatialPath=await sort(unique(),(a,b)=>a.latitude-b.latitude||a.longitude-b.longitude||compare(a.placeId,b.placeId));
 const idsPath=scratchPath('ids'),namesPath=scratchPath('names'),membersPath=scratchPath('members'),ids=await open(idsPath,'wx'),names=await open(namesPath,'wx'),members=await open(membersPath,'wx');
 let spatial:PageRef;
 try{spatial=await pages('candidates',lines<CatalogueCandidate>(spatialPath),r=>r.placeId,r=>({south:r.latitude,north:r.latitude,west:r.longitude,east:r.longitude}),async(rows,page)=>{for(const row of rows){await append(ids,{key:row.placeId,page});await append(names,{key:normalizeCatalogueName(row.name),placeId:row.placeId,...(row.countryCode?{countryCode:row.countryCode}:{})});for(const key of row.regionIds)await append(members,{key,placeId:row.placeId,page});}});}finally{await Promise.all([ids.close(),names.close(),members.close()]);}
 type IndexRow={key:string;placeId?:string;page?:PageRef};
 async function index(kind:'ids'|'names'|'memberships',path:string){const sorted=await sort(lines<IndexRow>(path),(a,b)=>compare(a.key,b.key)||compare(a.placeId??'',b.placeId??''));return pages(kind,lines<IndexRow>(sorted),r=>r.key);}
 const trees={spatial,id:await index('ids',idsPath),name:await index('names',namesPath),membership:await index('memberships',membersPath),regions:await pages('regions',lines<RegionRef>(regionsPath),r=>r.regionId),footprints:await pages('footprints',footprints(),r=>r.footprintId,r=>r.bounds)};
 const root=catalogueRootSchema.parse({...base,trees}),payload=Buffer.from(stable(root)+'\n');if(payload.length>MAX_DIRECTORY_BYTES||stats.outputBytes+payload.length>settings.maxOutputBytes)throw new RangeError('Root output byte limit');stats.outputBytes+=payload.length;checkpoint();
 const sha256=createHash('sha256').update(payload).digest('hex'),path=join(canonical,`catalogue-${sha256}.json`),temp=join(scratch,'root.tmp');if(stats.scratchBytes+payload.length>settings.maxScratchBytes)throw new RangeError('Scratch byte limit');stats.scratchBytes+=payload.length;await writeFile(temp,payload,{flag:'wx'});checkpoint();
 // Preserve existing roots; only a fully validated immutable root is published.
 try{const existing=await lstat(path);if(!existing.isFile()||existing.isSymbolicLink()||existing.size!==payload.length||!(await readFile(path)).equals(payload))throw new TypeError('Immutable root conflict');}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;checkpoint();await rename(temp,path);}
 return {path,sha256,root,stats,scratchDir:scratch};
 } catch(error) {
  const failure=error instanceof Error?error:new Error(String(error));
  Object.assign(failure,{stats:{...stats},scratchDir:scratch});
  throw failure;
 }
}
