/** Two-pass external radix partitioning; failed and successful scratch is retained. */
import {mkdir,writeFile,appendFile,realpath} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {isAbsolute,join,dirname,resolve} from 'node:path';
import {createInterface} from 'node:readline';
import {asciiCompare,canonicalLineage,lineageKey,lineagePrefix,lineageSha,lineageTotals,sumLineageTotals,sourceRowSchema,membershipRowSchema,createLineageReader,validateRootDescriptor,LINEAGE_LEAF_BYTES,LINEAGE_LEAF_ROWS,LINEAGE_NODE_BYTES,type LineageRow,type LineageKind,type RootDescriptor,type ChildDescriptor,type LineageObject,type LineageReaderOptions} from '../../server/providers/climate/lineageRadix';

export interface LineageBuildBudgets {maxInputBytes:number;maxMemoryBytes:number;maxScratchBytes:number;maxOutputBytes:number;maxDurationMs:number}
export interface LineageBuildMetrics {inputRows:number;uniqueRows:number;inputBytes:number;scratchBytes:number;outputBytes:number;/** Conservative estimate of builder-managed allocations, not process RSS. */peakMemoryBytes:number;maxLeafRows:number;maxLeafBytes:number;leaves:number;nodes:number;durationMs:number;budgets:LineageBuildBudgets}
export interface LineageBuildOptions {rows:AsyncIterable<LineageRow>;kind:LineageKind;outputDirectory:string;budgets:LineageBuildBudgets;/** Prefix encoded in every object reference; reader base is its publication parent. */pathPrefix?:string;onAllocate?:(kind:'scratch'|'output',bytes:number)=>void;verifyAgainst?:{descriptor:RootDescriptor;baseDirectory:string;onObject?:LineageReaderOptions['onObject']}}

export async function verifyLineageUnion(options:{rows:AsyncIterable<LineageRow>;descriptor:RootDescriptor;baseDirectory:string;budgets:LineageBuildBudgets;scratchDirectory:string;onObject?:LineageReaderOptions['onObject'];onAllocate?:(kind:'scratch'|'output',bytes:number)=>void}):Promise<LineageBuildMetrics>{
 const descriptor=validateRootDescriptor(options.descriptor);
 const result=await buildLineageTree({rows:options.rows,kind:descriptor.format==='era5-lineage-radix-v1'?'source':'membership',outputDirectory:options.scratchDirectory,budgets:options.budgets,verifyAgainst:{descriptor,baseDirectory:options.baseDirectory,onObject:options.onObject},onAllocate:options.onAllocate});
 return result.metrics;
}

export async function buildLineageTree(options:LineageBuildOptions):Promise<{descriptor:RootDescriptor;metrics:LineageBuildMetrics}>{
 const {budgets,outputDirectory,kind}=options;const started=Date.now();
 for(const key of ['maxInputBytes','maxMemoryBytes','maxScratchBytes','maxOutputBytes','maxDurationMs'] as const){const value=budgets[key];if(!Number.isSafeInteger(value)||value<1)throw Error('Invalid lineage '+key+' budget');}
 if(!isAbsolute(outputDirectory))throw Error('Lineage output directory must be absolute');
 if(resolve(await realpath(dirname(outputDirectory)))!==resolve(dirname(outputDirectory)))throw Error('Lineage output ancestor alias');
 if(kind!=='source'&&kind!=='membership')throw Error('Unknown lineage kind');
 if(budgets.maxMemoryBytes<16*1024*1024)throw Error('Lineage memory budget requires at least 16 MiB');
 const pathPrefix=options.pathPrefix??'';
 if(pathPrefix&&(isAbsolute(pathPrefix)||pathPrefix.includes('\\')||pathPrefix.includes(':')||pathPrefix.split('/').some(part=>!part||part==='.'||part==='..')))throw Error('Lineage path prefix');
 const domain=kind==='source'?'era5-lineage-radix-v1':'era5-membership-radix-v1';
 const metrics:LineageBuildMetrics={inputRows:0,uniqueRows:0,inputBytes:0,scratchBytes:0,outputBytes:0,peakMemoryBytes:0,maxLeafRows:0,maxLeafBytes:0,leaves:0,nodes:0,durationMs:0,budgets:{...budgets}};
 function deadline(){if(Date.now()-started>budgets.maxDurationMs)throw Error('Lineage duration budget exceeded');}
 function memory(bytes:number){metrics.peakMemoryBytes=Math.max(metrics.peakMemoryBytes,bytes);if(bytes>budgets.maxMemoryBytes)throw Error('Lineage memory budget exceeded');}
 // This bound includes JS string/array overhead, buffered I/O, leaf parsing and node metadata.
 const fixedMemory=8*1024*1024,bufferBudget=Math.min(8*1024*1024,Math.floor((budgets.maxMemoryBytes-fixedMemory-64*1024)/4));
 const expected=options.verifyAgainst?createLineageReader(options.verifyAgainst).walk(options.verifyAgainst.descriptor):undefined;
 await mkdir(outputDirectory);await mkdir(join(outputDirectory,'scratch'));if(!expected)await mkdir(join(outputDirectory,'objects'));
 function filePath(prefix:string){return join(outputDirectory,'scratch',prefix+'.jsonl');}
 function partitionWriter(pathFor:(bucket:string)=>string){
  const buffers=new Map<string,{lines:string[];bytes:number}>(),created=new Set<string>(),sizes=new Map<string,number>();let bufferedBytes=0;
  async function flush(bucket:string){const value=buffers.get(bucket);if(!value)return;deadline();const text=value.lines.join('');await appendFile(pathFor(bucket),text,{flag:created.has(bucket)?'a':'wx'});created.add(bucket);buffers.delete(bucket);bufferedBytes-=value.bytes;}
  return {
   sizes,
   async add(bucket:string,line:string){const bytes=Buffer.byteLength(line);if(metrics.scratchBytes+bytes>budgets.maxScratchBytes)throw Error('Lineage scratch byte budget exceeded');options.onAllocate?.('scratch',bytes);metrics.scratchBytes+=bytes;sizes.set(bucket,(sizes.get(bucket)??0)+bytes);
    let buffer=buffers.get(bucket);if(!buffer){buffer={lines:[],bytes:0};buffers.set(bucket,buffer);}buffer.lines.push(line);buffer.bytes+=bytes;bufferedBytes+=bytes;memory(fixedMemory+bufferedBytes*4);
    if(buffer.bytes>=64*1024)await flush(bucket);
    if(bufferedBytes>=bufferBudget){let largest='';let size=-1;for(const [key,value] of Array.from(buffers))if(value.bytes>size){largest=key;size=value.bytes;}await flush(largest);}
   },
   async finish(){for(const bucket of Array.from(buffers.keys()))await flush(bucket);return Array.from(created).sort(asciiCompare);}
  };
 }
 async function* lines(path:string){
  const stream=createReadStream(path,{highWaterMark:64*1024});const reader=createInterface({input:stream,crlfDelay:Infinity});
  try{for await(const line of reader){deadline();if(Buffer.byteLength(line)>8192)throw Error('Lineage scratch row bound');yield line;}}finally{reader.close();stream.destroy();}
 }
 const first=partitionWriter(filePath);
 for await(const input of options.rows){
  deadline();const row=kind==='source'?sourceRowSchema.parse(input):membershipRowSchema.parse(input);const line=canonicalLineage(row)+'\n';const bytes=Buffer.byteLength(line);
  if(metrics.inputBytes+bytes>budgets.maxInputBytes)throw Error('Lineage input byte budget exceeded');metrics.inputBytes+=bytes;metrics.inputRows++;
  await first.add(lineagePrefix(lineageKey(row)).slice(0,2),line);
 }
 const firstBuckets=await first.finish();
 async function publish(object:LineageObject):Promise<ChildDescriptor>{
  deadline();const body=Buffer.from(canonicalLineage(object));const limit=object.type==='leaf'?LINEAGE_LEAF_BYTES:LINEAGE_NODE_BYTES;
  if(body.length>limit)throw Error('Lineage '+object.type+' byte bound');
  if(!expected&&metrics.outputBytes+body.length>budgets.maxOutputBytes)throw Error('Lineage output byte budget exceeded');
  const name=(object.prefix||'root')+'.json';const path=(pathPrefix?pathPrefix+'/':'')+'objects/'+name;
  if(path.length>300)throw Error('Lineage output path bound');
  if(expected){if(object.type==='leaf')for(const row of object.rows!){const actual=await expected.next();if(actual.done||canonicalLineage(actual.value)!==canonicalLineage(row))throw Error('Lineage union mismatch');}}
  else {options.onAllocate?.('output',body.length);await writeFile(join(outputDirectory,'objects',name),body,{flag:'wx'});metrics.outputBytes+=body.length;}
  if(object.type==='leaf'){metrics.leaves++;metrics.maxLeafBytes=Math.max(metrics.maxLeafBytes,body.length);metrics.maxLeafRows=Math.max(metrics.maxLeafRows,object.rows!.length);}else metrics.nodes++;
  const keys=object.type==='leaf'?object.rows!.map(lineageKey):object.children!.flatMap(child=>[child.firstKey,child.lastKey]);keys.sort(asciiCompare);
  return {nibble:object.prefix.slice(-1),path,sha256:lineageSha(body),bytes:body.length,count:object.count,rawCount:object.rawCount,decodedCount:object.decodedCount,manifestCount:object.manifestCount,firstKey:keys[0]??'',lastKey:keys.at(-1)??''};
 }
 async function node(prefix:string,children:ChildDescriptor[]){return publish({domain,version:1,type:'node',prefix,...sumLineageTotals(children),children});}
 const topChildren:ChildDescriptor[]=[];let currentNibble='';let levelTwo:ChildDescriptor[]=[];
 for(const prefix of firstBuckets){
  const directory=join(outputDirectory,'scratch',prefix);
  const boundedPartition=fixedMemory+first.sizes.get(prefix)!*20<=budgets.maxMemoryBytes;
  const inMemory=new Map<string,Map<string,LineageRow>>();let partitionMemory=0;let secondBuckets:string[];
  if(boundedPartition){
   for await(const line of lines(filePath(prefix))){
    const row=(kind==='source'?sourceRowSchema:membershipRowSchema).parse(JSON.parse(line));const key=lineageKey(row),bucket=lineagePrefix(key);
    let unique=inMemory.get(bucket);if(!unique){unique=new Map();inMemory.set(bucket,unique);}
    const prior=unique.get(key);if(prior&&canonicalLineage(prior)!==canonicalLineage(row))throw Error('Conflicting source revision lineage or membership');
    if(!prior){unique.set(key,row);partitionMemory+=Buffer.byteLength(line)*6+256;memory(fixedMemory+partitionMemory);if(unique.size>LINEAGE_LEAF_ROWS)throw Error('Lineage bucket exceeds 2000 rows');}
   }
   secondBuckets=Array.from(inMemory.keys()).sort(asciiCompare);
  }else{
   await mkdir(directory);const second=partitionWriter(bucket=>join(directory,bucket+'.jsonl'));
   for await(const line of lines(filePath(prefix))){const row=JSON.parse(line) as LineageRow;await second.add(lineagePrefix(lineageKey(row)),line+'\n');}
   secondBuckets=await second.finish();
  }
  let currentThird='';let leaves:ChildDescriptor[]=[];const levelThree:ChildDescriptor[]=[];
  for(const bucket of secondBuckets){
   const unique=inMemory.get(bucket)??new Map<string,LineageRow>();let rowMemory=0;
   if(!boundedPartition)for await(const line of lines(join(directory,bucket+'.jsonl'))){
    const row=(kind==='source'?sourceRowSchema:membershipRowSchema).parse(JSON.parse(line));const key=lineageKey(row);const prior=unique.get(key);
    if(prior&&canonicalLineage(prior)!==canonicalLineage(row))throw Error('Conflicting source revision lineage or membership');
    if(!prior){unique.set(key,row);rowMemory+=Buffer.byteLength(line)*6+256;memory(fixedMemory+rowMemory);if(unique.size>LINEAGE_LEAF_ROWS)throw Error('Lineage bucket exceeds 2000 rows');}
   }
   const rows=Array.from(unique.values()).sort((a,b)=>asciiCompare(lineageKey(a),lineageKey(b)));
   if(currentThird&&currentThird!==bucket.slice(0,3)){levelThree.push(await node(currentThird,leaves));leaves=[];}
   currentThird=bucket.slice(0,3);leaves.push(await publish({domain,version:1,type:'leaf',prefix:bucket,...lineageTotals(rows),rows}));metrics.uniqueRows+=rows.length;
  }
  if(leaves.length)levelThree.push(await node(currentThird,leaves));
  if(currentNibble&&currentNibble!==prefix[0]){topChildren.push(await node(currentNibble,levelTwo));levelTwo=[];}
  currentNibble=prefix[0];levelTwo.push(await node(prefix,levelThree));
 }
 if(levelTwo.length)topChildren.push(await node(currentNibble,levelTwo));
 // Root is the final exclusive object; aborted work has no admitted root.
 const root=await node('',topChildren);if(expected&&!(await expected.next()).done)throw Error('Lineage union has additional rows');deadline();metrics.durationMs=Date.now()-started;
 return {descriptor:{format:domain,rootPath:root.path,rootSha256:root.sha256,rootBytes:root.bytes,count:root.count,rawCount:root.rawCount,decodedCount:root.decodedCount,manifestCount:root.manifestCount},metrics};
}
