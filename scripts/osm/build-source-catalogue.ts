import {open,lstat,mkdir} from 'node:fs/promises';
import {resolve,parse,join} from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {catalogueCandidateSchema,footprintSchema} from '../../server/places/catalogueFormat';
import {catalogueRevisionSchema,regionRefSchema} from '../../shared/nightsky/discovery';
import {buildStreamedCatalogue,type StreamedCatalogueOptions} from './build-streamed-catalogue';

interface RowLimits {maxRowBytes?:number;maxBytes?:number;maxRows?:number;signal?:AbortSignal;pin?:{bytes:number;sha256:string}}
async function safe(path:string){
 const absolute=resolve(path);let cursor=parse(absolute).root;
 if(path.split(/[\\/]/).includes('..'))throw new TypeError('Path traversal refused');
 for(const part of absolute.slice(cursor.length).split(/[\\/]/).filter(Boolean)){cursor=join(cursor,part);const info=await lstat(cursor);if(info.isSymbolicLink())throw new TypeError('Symlink path refused');}
 return absolute;
}
/** Pulls one bounded record at a time; finally closes on validation, abort or consumer return. */
export async function* jsonlRows(path:string,options:RowLimits={}):AsyncGenerator<unknown>{
 const {maxRowBytes=65536,maxBytes=128*1024*1024,maxRows=100000,signal,pin}=options;
 for(const n of [maxRowBytes,maxBytes,maxRows])if(!Number.isSafeInteger(n)||n<1)throw new RangeError('Invalid stream limit');
 if(maxRowBytes>4*1024*1024||maxBytes>10*1024**3||maxRows>10000000)throw new RangeError('Unsupported stream limit');
 const checkpoint=()=>signal?.throwIfAborted();checkpoint();
 const h=await open(await safe(path),'r');
 try{
  const initial=await h.stat();if(!initial.isFile()||initial.size>maxBytes||pin&&initial.size!==pin.bytes)throw new RangeError('Input size limit/pin mismatch');
  let pending=Buffer.alloc(0),total=0,rows=0;const hash=createHash('sha256'),buffer=Buffer.alloc(4096);
  while(true){checkpoint();const {bytesRead}=await h.read(buffer,0,buffer.length,null);if(!bytesRead)break;total+=bytesRead;if(total>maxBytes)throw new RangeError('Input byte limit');const chunk=buffer.subarray(0,bytesRead);hash.update(chunk);pending=Buffer.concat([pending,chunk]);let end:number;
   while((end=pending.indexOf(10))>=0){checkpoint();if(end>maxRowBytes||++rows>maxRows)throw new RangeError('Input row limit');const row=pending.subarray(0,end);pending=pending.subarray(end+1);if(!row.length)throw new TypeError('Empty JSONL row');yield JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(row));}
   if(pending.length>maxRowBytes)throw new RangeError('Input row byte limit');
  }
  if(pending.length)throw new TypeError('Unterminated JSONL row');
  const final=await h.stat();await safe(path);
  if(initial.ino!==final.ino||initial.size!==final.size||initial.mtimeMs!==final.mtimeMs)throw new TypeError('Input mutation');
  if(pin&&hash.digest('hex')!==pin.sha256)throw new TypeError('Input digest mismatch');
 }finally{await h.close();}
}
async function smallJson(path:string){const h=await open(await safe(path),'r');try{const stat=await h.stat();if(!stat.isFile()||stat.size>1024*1024)throw new RangeError('Descriptor byte limit');const b=Buffer.alloc(stat.size);let count=0;while(count<b.length){const r=await h.read(b,count,b.length-count,null);if(!r.bytesRead)throw new TypeError('Descriptor mutation');count+=r.bytesRead;}return JSON.parse(new TextDecoder('utf8',{fatal:true}).decode(b));}finally{await h.close();}}
export interface SourceCatalogueInput {producerDir:string;regions:string;footprints:string;signal?:AbortSignal;maxRowBytes?:number;maxBytes?:number;maxRows?:number}
export async function buildSourceCatalogue(input:SourceCatalogueInput,output:string,options:StreamedCatalogueOptions={}){
 const producer=await safe(input.producerDir),done=await smallJson(join(producer,'complete.json'));
 if(done.schemaVersion!==1)throw new TypeError('Producer descriptor version');
 const revision=catalogueRevisionSchema.parse(done.catalogueRevision),pin=done.files?.['candidates.jsonl'];
 if(!pin||!Number.isSafeInteger(pin.bytes)||pin.bytes<0||!/^[a-f0-9]{64}$/.test(pin.sha256))throw new TypeError('Producer digest required');
 const limits={maxRowBytes:input.maxRowBytes,maxBytes:input.maxBytes,maxRows:input.maxRows,signal:input.signal};
 async function* admitted<T>(path:string,schema:{parse(value:unknown):T},candidate=false){for await(const raw of jsonlRows(path,{...limits,...(candidate?{pin}:{maxRows:10000})})){const row=schema.parse(raw);if(candidate&&(row as {catalogueRevision?:string}).catalogueRevision!==revision)throw new TypeError('Producer revision mismatch');yield row;}}
 // Exclusive output directory: never append to an existing published edition.
 const absolute=resolve(output);await safe(parse(absolute).dir);await mkdir(absolute);
 return buildStreamedCatalogue({catalogueRevision:revision,candidates:admitted(join(producer,'candidates.jsonl'),catalogueCandidateSchema,true),regions:admitted(input.regions,regionRefSchema),footprints:admitted(input.footprints,footprintSchema)},absolute,options);
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const [producerDir,regions,footprints,output]=process.argv.slice(2);if(!output)throw new TypeError('Usage: build-source-catalogue.ts PRODUCER REGIONS.jsonl FOOTPRINTS.jsonl NEW_OUTPUT');
 await buildSourceCatalogue({producerDir,regions,footprints},output);
}
