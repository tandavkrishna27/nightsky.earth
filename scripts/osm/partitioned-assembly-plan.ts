import {open,lstat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {isAbsolute} from 'node:path';
import * as z from 'zod4';
import {safe} from './build-source-catalogue';
import {streamLimitsSchema,catalogueOptionsSchema} from './source-build-config';
import {evidenceLayoutSchema,PART_BYTES,MAX_PARTS,DESCRIPTOR_BYTES,parsePartitionJson,partitionCanonical} from './partitioned-candidates';
import {capacityV2Schema,evaluateGeographyCapacityV2,capacityV3Schema,evaluateGeographyCapacityV3,type GeographyCapacityV2,type GeographyCapacityV3} from './geography-capacity-plan';

import {validationLimitsV3Schema,bootstrapRead,bootstrapToken,bootstrapOperation,validationRead,validationOperation,type BootstrapResources,type ResourceSessionV3} from './partitioned-resources';

export type ControlMeter={kind:'bootstrap';resources:BootstrapResources;startedAt:number}|{kind:'session';resources:ResourceSessionV3};
export function meterRead(meter:ControlMeter|undefined,bytes:number){if(meter?.kind==='bootstrap')bootstrapRead(meter.resources,bytes);else if(meter?.kind==='session')validationRead(meter.resources,bytes,0,'control-and-admission');}
export function meterOperation(meter?:ControlMeter){if(meter?.kind==='bootstrap')bootstrapOperation(meter.resources);else if(meter?.kind==='session')validationOperation(meter.resources);}
const integer=(max=Number.MAX_SAFE_INTEGER,min=1)=>z.number().int().safe().min(min).max(max);
const sha=z.string().regex(/^[a-f0-9]{64}$/),absolute=z.string().max(4096).refine(isAbsolute);
const pin=z.strictObject({path:absolute,bytes:integer(PART_BYTES,0),sha256:sha});
const domain=pin.extend({sourceId:z.string().regex(/^[A-Za-z0-9_-]{1,80}$/),kind:z.literal('planet-domain-v1'),bytes:integer(4*1024**2)});
const member=z.strictObject({maxBoundaryBytes:integer(64*1024**2),maxVertices:integer(1000000),maxTotalVertices:integer(2000000),maxMilliseconds:integer(1800000),maxComparisons:integer(200000000),maxRows:integer(1000000),maxOutputBytes:integer(1024**3)});
const source=z.strictObject({id:z.string().regex(/^[A-Za-z0-9_-]{1,80}$/),path:absolute,format:z.enum(['xml','pbf']),url:z.string().max(4096).refine(v=>v.startsWith('https://')&&!v.toLowerCase().includes('latest')),bytes:integer(),sha256:sha,vintage:z.string().regex(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/),licenseUrl:z.literal('https://opendatacommons.org/licenses/odbl/1-0/'),attribution:z.literal('© OpenStreetMap contributors'),clipSha256:sha.optional(),sourceDomain:pin.extend({kind:z.literal('planet-domain-v1'),bytes:integer(4*1024**2)}).optional()}).refine(v=>(v.clipSha256!==undefined)!==(v.sourceDomain!==undefined),'Exact clip or planet domain required');
export const partitionedRawManifestSchema=z.strictObject({schemaVersion:z.literal(2),policy:z.literal('named-complete-way-v1-polar85'),authorization:z.string().min(1),sources:z.array(source).min(1).max(64),limits:z.strictObject({sourceBytes:integer(),scratchBytes:integer(),outputBytes:integer(MAX_PARTS*PART_BYTES+2*DESCRIPTOR_BYTES),rowBytes:integer(4*1024**2),nodes:integer(),candidates:integer(),referencesPerWay:integer(100000),seconds:integer(172800),freeBytes:integer(Number.MAX_SAFE_INTEGER,0)}),evidenceLayout:evidenceLayoutSchema});
export const partitionedAssemblyPlanSchema=z.strictObject({schemaVersion:z.literal(2),geographyMode:z.enum(['all-nodes','selected-references']).optional(),sourceDomains:z.array(domain).min(1).max(64).optional(),boundaries:z.array(z.strictObject({input:pin,regionIds:z.array(z.string().min(1).max(200)).max(10000),unresolvedBoundaryIds:z.array(z.string().min(1).max(400)).max(10000).optional()})).min(1).max(100),footprints:pin,membership:member,stream:streamLimitsSchema,catalogue:catalogueOptionsSchema,retained:z.array(absolute).max(100),evidenceLayout:evidenceLayoutSchema,maxNormalizedOutputBytes:integer(MAX_PARTS*PART_BYTES+2*DESCRIPTOR_BYTES),maxCandidateInputBytes:integer(MAX_PARTS*PART_BYTES),capacityPlan:pin.extend({bytes:integer(65536)})});
export const partitionedAssemblyPlanV3Schema=partitionedAssemblyPlanSchema.omit({schemaVersion:true,membership:true}).extend({schemaVersion:z.literal(3),membership:member.omit({maxComparisons:true,maxRows:true,maxOutputBytes:true}).extend({maxGeometryComparisons:integer(200000000),maxRows:integer(10000000),maxOutputBytes:integer(MAX_PARTS*PART_BYTES+PART_BYTES+DESCRIPTOR_BYTES)}),validation:validationLimitsV3Schema});
export type PartitionedAssemblyPlanV3=z.infer<typeof partitionedAssemblyPlanV3Schema>;
export type AnyPartitionedAssemblyPlan=PartitionedAssemblyPlan|PartitionedAssemblyPlanV3;
export function parsePartitionedControl(body:Buffer,meter?:ControlMeter):unknown{
 if(body.length>1024*1024)throw new Error('Partitioned control metadata byte limit');
 const ceiling=Math.max(1,body.length+1);
 if(meter?.kind==='session'){validationOperation(meter.resources);return parsePartitionJson(body,{bytes:0,rows:0,work:0,maxBytes:ceiling,maxRows:ceiling,maxWork:meter.resources.limits.validation.maxOperations,deadline:meter.resources.deadline,metadata:meter.resources.metadata,resourceSession:meter.resources,accounting:'read'});}
 if(meter?.kind==='bootstrap')return parsePartitionJson(body,{bytes:0,rows:0,work:0,maxBytes:ceiling,maxRows:ceiling,maxWork:4*1024*1024,deadline:meter.resources.deadline,metadata:meter.resources.metadata,bootstrapResources:meter.resources,accounting:'read'});
 return parsePartitionJson(body,{bytes:0,rows:0,work:0,maxBytes:ceiling,maxRows:ceiling,maxWork:4*1024*1024,deadline:Date.now()+60000});
}
export type PartitionedAssemblyPlan=z.infer<typeof partitionedAssemblyPlanSchema>;

export async function loadPartitionedCapacity(plan:AnyPartitionedAssemblyPlan,manifest?:unknown,meter?:ControlMeter):Promise<GeographyCapacityV2|GeographyCapacityV3>{
 const value=plan.schemaVersion===3?partitionedAssemblyPlanV3Schema.parse(plan):partitionedAssemblyPlanSchema.parse(plan),p=value.capacityPlan;
 meterOperation(meter);const path=await safe(p.path),h=await open(path,'r');let body:Buffer;
 const state=(s:Awaited<ReturnType<typeof lstat>>)=>[s.dev,s.ino,s.size,s.mtimeMs,s.ctimeMs].join(':');
 try{const before=await h.stat();if(!before.isFile()||before.size!==p.bytes)throw new Error('Capacity metadata size pin');meterRead(meter,p.bytes);body=Buffer.alloc(p.bytes+(meter?0:1));let n=0;while(n<body.length){meterOperation(meter);const r=await h.read(body,n,body.length-n,null);if(!r.bytesRead)break;n+=r.bytesRead;}const after=await h.stat();if(n!==p.bytes||state(before)!==state(after)||state(after)!==state(await lstat(await safe(path))))throw new Error('Capacity metadata mutation');body=body.subarray(0,n);if(createHash('sha256').update(body).digest('hex')!==p.sha256)throw new Error('Capacity digest mismatch');}finally{await h.close();}
 return validatePartitionedCapacity(value,parsePartitionedControl(body!,meter),manifest);
}
export function validatePartitionedCapacity(value:AnyPartitionedAssemblyPlan,capacityInput:unknown,manifest?:unknown):GeographyCapacityV2|GeographyCapacityV3{
 const capacity=value.schemaVersion===3?capacityV3Schema.parse(capacityInput):capacityV2Schema.parse(capacityInput);
 if(value.schemaVersion===3)evaluateGeographyCapacityV3(capacity);else evaluateGeographyCapacityV2(capacity);
 if(value.footprints.bytes>capacity.allocations.footprints)throw new Error('Footprint capacity allocation too small');
 if(capacity.limits.raw.outputBytes!==value.maxNormalizedOutputBytes||capacity.allocations.normalizedOutput!==value.maxNormalizedOutputBytes||capacity.limits.membership.maxCandidateInputBytes!==value.maxCandidateInputBytes||value.maxCandidateInputBytes>value.maxNormalizedOutputBytes)throw new Error('Explicit aggregate capacity mismatch');
 for(const [key,limit] of Object.entries(capacity.limits.membership))if(key!=='maxCandidateInputBytes'&&(value.membership as Record<string,number>)[key]!==limit)throw new Error('Membership capacity controls mismatch');
 for(const [key,limit] of Object.entries(capacity.limits.catalogue))if((value.catalogue as Record<string,number>)[key]!==limit)throw new Error('Catalogue capacity controls mismatch');
 if(value.schemaVersion===3){if(partitionCanonical(value.validation)!==partitionCanonical((capacity as GeographyCapacityV3).limits.validation))throw new Error('Validation capacity controls mismatch');}
 const publicationBytes=value.schemaVersion===3?value.membership.maxOutputBytes+capacity.allocations.footprints:Math.max(value.membership.maxOutputBytes,value.footprints.bytes);
 if(!Number.isSafeInteger(publicationBytes)||value.stream.maxRowBytes!==65536||value.stream.maxBytes===undefined||value.stream.maxBytes<publicationBytes||value.stream.maxRows===undefined||value.stream.maxRows<value.membership.maxRows)throw new Error('Explicit aggregate publication stream controls required');
 if(manifest!==undefined){const raw=partitionedRawManifestSchema.parse(manifest);for(const [key,limit] of Object.entries(capacity.limits.raw))if((raw.limits as Record<string,number>)[key]!==limit)throw new Error('Raw manifest capacity controls mismatch');const sourceBytes=raw.sources.reduce((n,s)=>n+s.bytes,0);if(!Number.isSafeInteger(sourceBytes)||sourceBytes>raw.limits.sourceBytes||new Set(raw.sources.map(s=>s.id)).size!==raw.sources.length)throw new Error('Complete raw source capacity inventory');if(capacity.rawSourceAlreadyRetainedBytes>sourceBytes)throw new Error('Retained source credit exceeds pinned source inventory');}
 return capacity;
}
