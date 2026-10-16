import {open,lstat,mkdir,realpath,opendir} from 'node:fs/promises';
import {resolve,parse,join} from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import * as z from 'zod4';
import {catalogueCandidateSchema,footprintSchema} from '../../server/places/catalogueFormat';
import {catalogueRevisionSchema,regionRefSchema} from '../../shared/nightsky/discovery';
import {buildStreamedCatalogue,type StreamedCatalogueOptions} from './build-streamed-catalogue';
import {buildConfigSchema,catalogueOptionsSchema,streamLimitsSchema,loadBuildConfig,verifyMetadata,type SourceBuildConfig} from './source-build-config';
import {boundaryShards} from './partitioned-boundaries';
import {streamFamilySchema,partitionCountsSchema,partitionPinSchema,iteratePartitionFamily,type SharedPartitionBudget,type PartitionPin} from './partitioned-candidates';

const sha=z.string().regex(/^[a-f0-9]{64}$/),uint=z.number().int().safe().nonnegative();
const filePin=z.strictObject({bytes:uint.max(128*1024**2),sha256:sha});
export const partitionedMembershipInputIdentitySchema=z.strictObject({
 rawStreams:z.strictObject({candidates:streamFamilySchema,lineage:streamFamilySchema,exclusions:streamFamilySchema}),
 counts:partitionCountsSchema,boundaryPins:z.array(partitionPinSchema).min(1).max(100),footprintPin:partitionPinSchema,
});
export const partitionedMembershipCompletionSchema=z.strictObject({
 schemaVersion:z.literal(2),kind:z.literal('partitioned-membership-v1'),catalogueRevision:catalogueRevisionSchema,
 streams:z.strictObject({candidates:streamFamilySchema}),files:z.strictObject({'regions.jsonl':filePin,'footprints.jsonl':filePin}),
 totalCandidates:uint.max(1000000),unknownCountryCandidates:uint.max(1000000),producerDescriptorSha256:sha,planSha256:sha,
 admissionSnapshotSha256:sha.optional(),inputIdentity:partitionedMembershipInputIdentitySchema,boundaryInput:boundaryShards,
 resources:z.strictObject({rows:uint.max(1000000),work:uint.max(200000000),outputBytes:uint.max(1024**3),elapsedMilliseconds:uint.max(1800000)}),
 coverage:z.literal('unknown; administrative boundaries do not establish candidate source coverage'),
 membershipPolicy:z.literal('unique-strict-interior; conflicting claims rejected; missing or ambiguous membership unknown'),
}).superRefine((done,ctx)=>{
 if(done.totalCandidates!==done.streams.candidates.rows||done.totalCandidates!==done.inputIdentity.counts.accepted||done.totalCandidates!==done.resources.rows||done.unknownCountryCandidates>done.totalCandidates)ctx.addIssue({code:'custom',message:'Membership candidate count mismatch'});
 if(done.boundaryInput.length!==done.inputIdentity.boundaryPins.length||done.boundaryInput.some((s,i)=>s.input.bytes!==done.inputIdentity.boundaryPins[i].bytes||s.input.sha256!==done.inputIdentity.boundaryPins[i].sha256))ctx.addIssue({code:'custom',message:'Membership boundary identity mismatch'});
});
export type PartitionedMembershipCompletion=z.infer<typeof partitionedMembershipCompletionSchema>;

interface RowLimits {maxRowBytes?:number;maxBytes?:number;maxRows?:number;signal?:AbortSignal;pin?:{bytes:number;sha256:string}}
export async function safe(path:string,missingLeaf=false){
 const absolute=resolve(path);let cursor=parse(absolute).root;
 if(/^(?:\\\\[?.]\\)/.test(path)||path.split(/[\\/]/).includes('..'))throw new TypeError('Path traversal refused');
 if(process.platform==='win32'){const parsed=parse(path),rest=path.slice(parsed.root.length);if(rest.includes(':')||/^[a-z]:[^\\/]/i.test(path)||/^[\\/](?![\\/])/.test(path))throw new TypeError('Ambiguous Windows path refused');for(const part of rest.split(/[\\/]/)){if(/[ .]$/.test(part)||/^(?:CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\.|$)/i.test(part))throw new TypeError('Reserved Windows path refused');}}
 for(const part of absolute.slice(cursor.length).split(/[\\/]/).filter(Boolean)){cursor=join(cursor,part);try{const info=await lstat(cursor);if(info.isSymbolicLink())throw new TypeError('Symlink path refused');}catch(error){if(!(missingLeaf&&cursor===absolute&&(error as NodeJS.ErrnoException).code==='ENOENT'))throw error;}}
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
function partitionCheckpoint(b:SharedPartitionBudget,bytes=0,rows=0){
 b.signal?.throwIfAborted();if(Date.now()>=b.deadline)throw new Error('Shared partition deadline');
 for(const n of [b.bytes,b.rows,b.work,bytes,rows])if(!Number.isSafeInteger(n)||n<0)throw new Error('Invalid shared partition accounting');
 for(const n of [b.maxBytes,b.maxRows,b.maxWork,b.deadline])if(!Number.isSafeInteger(n)||n<1)throw new Error('Explicit finite partition budget required');
 const nextBytes=b.bytes+bytes,nextRows=b.rows+rows,work=b.work+1;
 if(!Number.isSafeInteger(nextBytes)||!Number.isSafeInteger(nextRows)||!Number.isSafeInteger(work)||nextBytes>b.maxBytes||nextRows>b.maxRows||work>b.maxWork)throw new Error('Shared partition byte/row/work budget');
 b.bytes=nextBytes;b.rows=nextRows;b.work=work;
}
async function smallDescriptor(path:string,budget?:SharedPartitionBudget){
 if(budget)partitionCheckpoint(budget);const absolute=await safe(path),h=await open(absolute,'r');
 try{
  const stat=await h.stat();if(!stat.isFile()||budget&&stat.nlink!==1||stat.size>1024*1024)throw new RangeError('Descriptor byte/file limit');
  if(budget){const m=budget.metadata;if(m){if(!Number.isSafeInteger(m.bytes)||!Number.isSafeInteger(m.ceiling)||m.bytes<0||m.ceiling<1||m.ceiling>32*1024**2||!(m.paths instanceof Map))throw new Error('Shared descriptor metadata budget');const path=await realpath(absolute),old=m.paths.get(path);if(old!==undefined&&old!==stat.size)throw new Error('Descriptor size mutation');if(old===undefined){if(m.bytes+stat.size>m.ceiling)throw new Error('Shared descriptor metadata budget');m.bytes+=stat.size;m.paths.set(path,stat.size);}}partitionCheckpoint(budget,stat.size);}
  const body=Buffer.alloc(stat.size);let count=0;
  while(count<body.length){if(budget)partitionCheckpoint(budget);const r=await h.read(body,count,Math.min(65536,body.length-count),null);if(!r.bytesRead)throw new TypeError('Descriptor mutation');count+=r.bytesRead;}
  const after=await h.stat(),linked=await lstat(await safe(absolute));
  if((await h.read(Buffer.alloc(1),0,1,null)).bytesRead||stat.dev!==after.dev||stat.ino!==after.ino||stat.size!==after.size||stat.mtimeMs!==after.mtimeMs||stat.ctimeMs!==after.ctimeMs||after.dev!==linked.dev||after.ino!==linked.ino||after.size!==linked.size||after.mtimeMs!==linked.mtimeMs)throw new Error('Descriptor mutation');
  return {body,value:JSON.parse(new TextDecoder('utf8',{fatal:true}).decode(body))};
 }finally{await h.close();}
}
export interface SourceCatalogueInput {producerDir:string;regions:string;footprints:string;signal?:AbortSignal;maxRowBytes?:number;maxBytes?:number;maxRows?:number;config?:SourceBuildConfig;partitionBudget?:SharedPartitionBudget;expectedCandidates?:number;expectedMembershipPin?:PartitionPin;capturePartitionedVerifier?:(verify:()=>Promise<void>)=>void}
async function verifyClassifiedMembershipPin(producer:string,body:Buffer,value:PartitionPin){
 const expected=partitionPinSchema.extend({bytes:uint.positive().max(1024**2)}).parse(value);
 if(await realpath(await safe(expected.path))!==await realpath(await safe(join(producer,'complete.json')))||body.length!==expected.bytes||createHash('sha256').update(body).digest('hex')!==expected.sha256)throw new Error('Classified membership pin identity/digest mismatch');
 return expected;
}
export async function buildSourceCatalogue(input:SourceCatalogueInput,output:string,options:StreamedCatalogueOptions={}){
 const config=input.config?buildConfigSchema.parse(input.config):undefined;
 catalogueOptionsSchema.parse(options);streamLimitsSchema.parse({maxRowBytes:input.maxRowBytes,maxBytes:input.maxBytes,maxRows:input.maxRows});
 if(config){options={...config.catalogue,...options};input={...input,...config.stream};}
 const producer=await safe(input.producerDir),descriptor=await smallDescriptor(join(producer,'complete.json'),input.partitionBudget),done=descriptor.value;
 const expectedMembershipPin=input.expectedMembershipPin===undefined?undefined:await verifyClassifiedMembershipPin(producer,descriptor.body,input.expectedMembershipPin);
 if(expectedMembershipPin&&done.schemaVersion!==2)throw new Error('Classified membership version mismatch');
 if(done.schemaVersion===2){if(!expectedMembershipPin)throw new Error('Freshly classified membership pin required');return buildPartitionedSourceCatalogue(input,output,options,config,producer,descriptor,expectedMembershipPin);}
 if(done.schemaVersion!==1)throw new TypeError('Producer descriptor version');
 const revision=catalogueRevisionSchema.parse(done.catalogueRevision),pin=done.files?.['candidates.jsonl'];
 if(!pin||!Number.isSafeInteger(pin.bytes)||pin.bytes<0||!/^[a-f0-9]{64}$/.test(pin.sha256))throw new TypeError('Producer digest required');
 if(config&&config.catalogueRevision!==revision)throw new TypeError('Build config revision mismatch');
 const limits={maxRowBytes:input.maxRowBytes,maxBytes:input.maxBytes,maxRows:input.maxRows,signal:input.signal};
 async function* admitted<T>(path:string,schema:{parse(value:unknown):T},candidate=false){for await(const raw of jsonlRows(path,{...limits,...(candidate?{pin}:{maxRows:10000,...(config?{pin:path===input.regions?config.files.regions:config.files.footprints}:{})})})){const row=schema.parse(raw);if(candidate&&(row as {catalogueRevision?:string}).catalogueRevision!==revision)throw new TypeError('Producer revision mismatch');yield row;}}
 // Verify bounded stream pins and paths before creating any output. Stream again during publication.
 for await(const raw of jsonlRows(join(producer,'candidates.jsonl'),{...limits,pin})){const row=catalogueCandidateSchema.parse(raw);if(row.catalogueRevision!==revision)throw new TypeError('Producer revision mismatch');}
 await safe(input.regions);await safe(input.footprints);
 if(config){await verifyMetadata(input.regions,config.files.regions,config.stream);await verifyMetadata(input.footprints,config.files.footprints,config.stream);}
 // Exclusive output directory: never append to an existing published edition.
 const absolute=await safe(output,true);await mkdir(absolute);
 return buildStreamedCatalogue({catalogueRevision:revision,candidates:admitted(join(producer,'candidates.jsonl'),catalogueCandidateSchema,true),regions:admitted(input.regions,regionRefSchema),footprints:admitted(input.footprints,footprintSchema)},absolute,options);
}
async function buildPartitionedSourceCatalogue(input:SourceCatalogueInput,output:string,options:StreamedCatalogueOptions,config:SourceBuildConfig|undefined,producer:string,descriptor:{body:Buffer;value:unknown},expectedMembershipPin:PartitionPin){
 const done=partitionedMembershipCompletionSchema.parse(descriptor.value),suppliedBudget=input.partitionBudget;
 if(!suppliedBudget||!Number.isSafeInteger(input.expectedCandidates)||input.expectedCandidates!==done.totalCandidates)throw new Error('Explicit partition budget and exact candidate count required');
 const budget=suppliedBudget;
 partitionCheckpoint(budget);input.signal?.throwIfAborted();
 const expectedCandidates=input.expectedCandidates!,maxRows=input.maxRows??100000,maxBytes=input.maxBytes??128*1024**2;
 if(done.totalCandidates>maxRows||done.streams.candidates.bytes>maxBytes||done.resources.outputBytes!==done.streams.candidates.bytes+done.files['regions.jsonl'].bytes+done.files['footprints.jsonl'].bytes+descriptor.body.length)throw new Error('Aggregate membership input/output budget');
 if(config&&(config.catalogueRevision!==done.catalogueRevision||JSON.stringify(config.files.regions)!==JSON.stringify(done.files['regions.jsonl'])||JSON.stringify(config.files.footprints)!==JSON.stringify({bytes:done.inputIdentity.footprintPin.bytes,sha256:done.inputIdentity.footprintPin.sha256})))throw new Error('Partitioned build config metadata/revision mismatch');
 if(await realpath(await safe(input.regions))!==await realpath(await safe(join(producer,'regions.jsonl')))||await realpath(await safe(input.footprints))!==await realpath(await safe(done.inputIdentity.footprintPin.path)))throw new Error('Exact common metadata path mismatch');
 const deadline=Math.min(budget.deadline,Date.now()+(options.timeoutMs??60000));budget.deadline=deadline;
 const signal={throwIfAborted(){input.signal?.throwIfAborted();partitionCheckpoint(budget);}} as AbortSignal;
 async function inventory(){
  partitionCheckpoint(budget);const expected=new Set(done.streams.candidates.parts.map(p=>p.path));
  if(!expected.size){try{await safe(join(producer,'parts'));}catch(error){if((error as NodeJS.ErrnoException).code==='ENOENT')return;throw error;}}
  const dir=await opendir(await safe(join(producer,'parts')));let count=0;
  try{for await(const entry of dir){partitionCheckpoint(budget);if(++count>64||!entry.isFile()||entry.isSymbolicLink()||!expected.delete(`parts/${entry.name}`))throw new Error('Unexpected completed membership part');}}finally{await dir.close().catch(()=>{});}
  if(expected.size)throw new Error('Missing completed membership part');
 }
 async function* candidates(){let count=0;for await(const value of iteratePartitionFamily(producer,'candidates',done.streams.candidates,budget,{maxRowBytes:input.maxRowBytes??65536})){input.signal?.throwIfAborted();const row=catalogueCandidateSchema.parse(value);if(row.catalogueRevision!==done.catalogueRevision||++count>expectedCandidates)throw new Error('Partitioned candidate revision/count mismatch');yield row;}if(count!==expectedCandidates)throw new Error('Incomplete partitioned candidate input');}
 async function* metadata<T>(path:string,schema:{parse(value:unknown):T},pin:{bytes:number;sha256:string}){
  const ceiling=Math.min(maxBytes,128*1024**2);if(pin.bytes>ceiling)throw new Error('Common metadata stream byte limit');
  partitionCheckpoint(budget,pin.bytes);for await(const raw of jsonlRows(path,{maxBytes:ceiling,maxRows:10000,maxRowBytes:input.maxRowBytes,signal,pin})){partitionCheckpoint(budget,0,1);yield schema.parse(raw);}
 }
 async function verify(){
  await inventory();for await(const row of candidates())void row;
  for await(const row of metadata(input.regions,regionRefSchema,done.files['regions.jsonl']))void row;
  for await(const row of metadata(join(producer,'footprints.jsonl'),footprintSchema,done.files['footprints.jsonl']))void row;
  if(done.files['footprints.jsonl'].bytes!==0)throw new Error('Generated membership footprints must be empty');
  for await(const row of metadata(input.footprints,footprintSchema,done.inputIdentity.footprintPin))void row;
  const current=await smallDescriptor(join(producer,'complete.json'),budget);await verifyClassifiedMembershipPin(producer,current.body,expectedMembershipPin);
  if(!current.body.equals(descriptor.body))throw new Error('Membership completion mutation');partitionCheckpoint(budget);
 }
 await verify();
 const absolute=await safe(output,true);await mkdir(absolute);
 const remaining=Math.min(options.timeoutMs??60000,deadline-Date.now());if(remaining<1)throw new Error('Shared publication deadline');
 const result=await buildStreamedCatalogue({catalogueRevision:done.catalogueRevision,candidates:candidates(),regions:metadata(input.regions,regionRefSchema,done.files['regions.jsonl']),footprints:metadata(input.footprints,footprintSchema,done.inputIdentity.footprintPin)},absolute,{...options,timeoutMs:remaining});
 if(result.stats.inputRows!==expectedCandidates)throw new Error('Publisher input count mismatch');await verify();input.capturePartitionedVerifier?.(verify);return result;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const [producerDir,regions,footprints,output,...extra]=process.argv.slice(2);if(!output||!(extra.length===0||extra.length===3&&extra[0]==='--config'))throw new TypeError('Usage: build-source-catalogue.ts PRODUCER REGIONS.jsonl FOOTPRINTS.jsonl NEW_OUTPUT');
 const config=extra.length?await loadBuildConfig(extra[1],extra[2]):undefined;
 await buildSourceCatalogue({producerDir,regions,footprints,config},output);
}
