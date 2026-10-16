import {open,mkdir,writeFile} from 'node:fs/promises';
import {join,resolve,isAbsolute} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import * as z from 'zod4';
import {safe,buildSourceCatalogue} from './build-source-catalogue';
import {buildBoundaryMetadata} from './boundary-metadata';
import {verifyPlanetDomainFile} from './source-admission';
import {boundaryShards} from './partitioned-boundaries';
import {streamLimitsSchema,catalogueOptionsSchema,verifyMetadata} from './source-build-config';

const integer=(max:number)=>z.number().int().safe().min(1).max(max);
const pin=z.strictObject({path:z.string().refine(isAbsolute),bytes:z.number().int().safe().min(0).max(128*1024**2),sha256:z.string().regex(/^[a-f0-9]{64}$/)});
const domainPin=pin.extend({sourceId:z.string().regex(/^[A-Za-z0-9_-]{1,80}$/),kind:z.literal('planet-domain-v1'),bytes:integer(4*1024**2)});
const filePin=pin.omit({path:true});
const membership=z.strictObject({maxBoundaryBytes:integer(64*1024**2).optional(),maxVertices:integer(1000000).optional(),maxTotalVertices:integer(2000000).optional(),maxMilliseconds:integer(1800000).optional(),maxComparisons:integer(200000000).optional(),maxRows:integer(1000000).optional(),maxOutputBytes:integer(1024**3).optional()});
const planSchema=z.strictObject({schemaVersion:z.literal(1),geographyMode:z.enum(['all-nodes','selected-references']).optional(),sourceDomains:z.array(domainPin).min(1).max(64).optional(),boundaries:z.array(z.strictObject({input:pin,regionIds:z.array(z.string().min(1).max(200)).max(10000),unresolvedBoundaryIds:z.array(z.string().min(1).max(400)).max(10000).optional()})).min(1).max(100),footprints:pin,membership,stream:streamLimitsSchema,catalogue:catalogueOptionsSchema,retained:z.array(z.string().refine(isAbsolute)).max(100)});
async function small(path:string,max:number){const h=await open(await safe(path),'r');try{const a=await h.stat();if(!a.isFile()||a.size>max)throw new Error('Descriptor byte limit');const body=await h.readFile();const b=await h.stat();if(body.length!==a.size||a.size!==b.size||a.mtimeMs!==b.mtimeMs)throw new Error('Descriptor mutation');return body;}finally{await h.close();}}
export async function loadAssemblyPlan(path:string,sha256:string){
 const body=await small(path,1024*1024);if(!/^[a-f0-9]{64}$/.test(sha256)||createHash('sha256').update(body).digest('hex')!==sha256)throw new Error('Assembly digest mismatch');
 const plan=planSchema.parse(JSON.parse(new TextDecoder('utf8',{fatal:true}).decode(body)));
 if(new Set((plan.sourceDomains??[]).map(d=>d.sourceId)).size!==(plan.sourceDomains??[]).length)throw new Error('Duplicate planet domain source');
 for(const domain of plan.sourceDomains??[])await verifyPlanetDomainFile(domain.path,{bytes:domain.bytes,sha256:domain.sha256});
 const staged=plan.boundaries.map((s,i)=>({...s,input:{...s.input,path:`boundary-${i}.json`}}));boundaryShards.parse(staged);
 if(plan.boundaries.reduce((n,s)=>n+s.input.bytes,0)>(plan.membership.maxBoundaryBytes??16*1024**2))throw new Error('Aggregate boundary byte budget');
 for(const item of plan.boundaries.map(s=>s.input))await copyPinned(item);
 await verifyMetadata(plan.footprints.path,plan.footprints,plan.stream);
 return plan;
}
/** Bounded, exclusive copy; pins are checked over exactly the bytes copied. */
async function copyPinned(input:z.infer<typeof pin>,output?:string){
 const h=await open(await safe(input.path),'r');let out:Awaited<ReturnType<typeof open>>|undefined;
 try{if(output)out=await open(output,'wx');const before=await h.stat();if(!before.isFile()||before.size!==input.bytes)throw new Error('Input size pin mismatch');let total=0;const hash=createHash('sha256'),buffer=Buffer.alloc(65536);
  while(true){const {bytesRead}=await h.read(buffer,0,buffer.length,null);if(!bytesRead)break;total+=bytesRead;if(total>input.bytes)throw new Error('Input grew');const chunk=buffer.subarray(0,bytesRead);hash.update(chunk);if(out)await out.writeFile(chunk);}
  const after=await h.stat();await safe(input.path);if(total!==input.bytes||before.size!==after.size||before.mtimeMs!==after.mtimeMs||hash.digest('hex')!==input.sha256)throw new Error('Input mutation/digest mismatch');
 }finally{await h.close();await out?.close();}
}
export async function assembleMembership(planPath:string,sha256:string,producer:string,root:string){
 const plan=await loadAssemblyPlan(planPath,sha256);await safe(root);
 const original=await small(join(producer,'complete.json'),1024*1024),done=JSON.parse(original.toString('utf8'));
 if(done.schemaVersion!==1||!done.files?.['candidates.jsonl'])throw new Error('Producer completion required');
 if(Object.keys(done.files).sort().join(',')!=='candidates.jsonl,exclusions.jsonl,lineage.jsonl')throw new Error('Complete raw producer evidence required');
 if((done.geographyMode??'all-nodes')!==(plan.geographyMode??'all-nodes'))throw new Error('Producer geography mode mismatch');
 const domains=z.array(domainPin).max(64).parse(done.sourceDomains??[]);
 if(JSON.stringify(domains)!==JSON.stringify(plan.sourceDomains??[]))throw new Error('Producer planet domain mismatch');
 const producerPins=[];
 for(const [name,value] of Object.entries(done.files)){if(!['candidates.jsonl','lineage.jsonl','exclusions.jsonl'].includes(name))throw new Error('Unknown producer evidence');const item=pin.parse({...filePin.parse(value),path:join(await safe(producer),name)});await copyPinned(item);producerPins.push(item);}
 const candidate=pin.parse({...filePin.parse(done.files['candidates.jsonl']),path:join(await safe(producer),'candidates.jsonl')});
 const stage=join(root,'membership-input');await mkdir(stage);
 const shards=[];
 for(const [i,spec] of plan.boundaries.entries()){const name=`boundary-${i}.json`;await copyPinned(spec.input,join(stage,name));shards.push({...spec,input:{...spec.input,path:name}});}
 await copyPinned(candidate,join(stage,'candidates.jsonl'));
 const descriptor=join(stage,'input.json');await writeFile(descriptor,JSON.stringify({schemaVersion:2,catalogueRevision:done.catalogueRevision,boundaries:shards,candidates:{...candidate,path:'candidates.jsonl'}}),{flag:'wx'});
 const enriched=await buildBoundaryMetadata(descriptor,join(root,'membership'),plan.membership);
 const config={schemaVersion:1 as const,catalogueRevision:done.catalogueRevision,stream:plan.stream,catalogue:plan.catalogue,files:{regions:enriched.files['regions.jsonl'],footprints:{bytes:plan.footprints.bytes,sha256:plan.footprints.sha256}}};
 const catalogue=await buildSourceCatalogue({producerDir:join(root,'membership'),regions:join(root,'membership','regions.jsonl'),footprints:plan.footprints.path,config},join(root,'catalogue'));
 if(!(await small(join(producer,'complete.json'),1024*1024)).equals(original))throw new Error('Producer descriptor mutation');
 for(const item of producerPins)await copyPinned(item);
 await loadAssemblyPlan(planPath,sha256);
 const evidence={schemaVersion:1,planSha256:sha256,producerDirectory:producer,producerDescriptor:done,producerDescriptorSha256:createHash('sha256').update(original).digest('hex'),catalogue,membership:enriched,sourceCoverage:plan.footprints.bytes===0?'unknown; no extraction footprints admitted':'only supplied pinned footprints; administrative membership does not establish source coverage'};
 await writeFile(join(root,'assembly-complete.json'),JSON.stringify(evidence)+'\n',{flag:'wx'});return evidence;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2);if(args.length===3&&args[0]==='--validate')await loadAssemblyPlan(args[1],args[2]);
 else if(args.length===7&&args[0]==='--prepare'){await loadAssemblyPlan(args[1],args[2]);const input=pin.parse({path:args[3],bytes:Number(args[4]),sha256:args[5]});if(input.bytes>1024*1024)throw new Error('Manifest byte limit');await copyPinned(input,args[6]);}
 else if(args.length===4)await assembleMembership(args[0],args[1],args[2],args[3]);
 else throw new Error('Usage: membership-assembly.ts PLAN SHA256 PRODUCER JOB_ROOT');
}
