/** Advisory arithmetic only: does not admit source identity, enforce allocations, or predict a planet build. */
import * as z from 'zod4';
const MiB=1024**2, GiB=1024**3;
export const proposedGeographyAllocations={raw:95380942829,index:20*GiB,journal:4*GiB,candidates:128*MiB,exclusions:128*MiB,lineage:128*MiB,boundaries:64*MiB,stagedCandidates:128*MiB,stagedBoundaries:64*MiB,footprints:128*MiB,membership:GiB,sort:8*GiB,catalogue:8*GiB,failureReports:GiB,rollback:4*GiB} as const;
type Allocations={[K in keyof typeof proposedGeographyAllocations]:number};
export function evaluateGeographyCapacity(input:{freeBytes:number;reserveBytes:number;retainedBytes:number;allocations:Allocations}){
 const checked=(n:number)=>{if(!Number.isSafeInteger(n)||n<0)throw new Error('Nonnegative safe integer bytes required');return n;};
 const sum=(values:number[])=>values.reduce((a,b)=>checked(a+checked(b)),0);
 const {allocations:a}=input;
 if(Object.keys(a).sort().join(',')!==Object.keys(proposedGeographyAllocations).sort().join(','))throw new Error('Exact allocation inventory required');
 if(a.raw!==95380942829)throw new Error('Exact dated planet allocation required');
 const incrementalBytes=sum(Object.values(a)),countedLogicalCeiling=sum([incrementalBytes,input.retainedBytes]);
 checked(input.freeBytes);checked(input.reserveBytes);
 const remainingBytes=input.freeBytes-input.reserveBytes-incrementalBytes;
 if(!Number.isSafeInteger(remainingBytes))throw new Error('Signed safe integer remainder required');
 const blockers:string[]=[];
 for(const key of ['candidates','exclusions','lineage','footprints'] as const)if(a[key]>128*MiB)blockers.push(`${key} exceeds assembly 128 MiB pin ceiling`);
 for(const [key,max] of [['boundaries',64*MiB],['membership',GiB],['sort',10*GiB],['catalogue',10*GiB]] as const)if(a[key]>max)blockers.push(`${key} exceeds implemented stage byte ceiling`);
 if(a.stagedCandidates<a.candidates||a.stagedBoundaries<a.boundaries)blockers.push('Staged copy allocation smaller than source allocation');
 if(remainingBytes<0)blockers.push('Incremental allocations violate free reserve');
 return {incrementalBytes,countedLogicalCeiling,remainingBytes,diskEnvelopeFits:remainingBytes>=0&&blockers.length===0,productionAdmitted:false as const,blockers};
}

const uint=z.number().int().safe().nonnegative(),positive=z.number().int().safe().positive();
/** No defaults: this is an invocation-specific reviewed arithmetic record, not an authority grant. */
export const capacityV2Schema=z.strictObject({schemaVersion:z.literal(2),kind:z.literal('partitioned-geography-capacity-v1'),freeBytes:uint,reserveBytes:uint,retainedBytes:uint,rawSourceAlreadyRetainedBytes:uint,
 allocations:z.strictObject({raw:uint,index:uint,journal:uint,normalizedOutput:positive,boundaries:uint,stagedCandidates:z.literal(0),stagedBoundaries:uint,footprints:uint.max(128*MiB),membership:uint.max(GiB),sort:uint.max(10*GiB),catalogue:uint.max(10*GiB),failureReports:uint,rollback:uint}),
 limits:z.strictObject({
  raw:z.strictObject({sourceBytes:positive,scratchBytes:positive,outputBytes:positive.max(64*128*MiB+2*MiB),rowBytes:positive.max(4*MiB),nodes:positive,candidates:positive,referencesPerWay:positive.max(100000),seconds:positive.max(172800),freeBytes:uint}),
  membership:z.strictObject({maxCandidateInputBytes:positive,maxBoundaryBytes:positive.max(64*MiB),maxVertices:positive.max(1000000),maxTotalVertices:positive.max(2000000),maxComparisons:positive.max(200000000),maxRows:positive.max(1000000),maxOutputBytes:positive.max(GiB),maxMilliseconds:positive.max(1800000)}),
  catalogue:z.strictObject({chunkRows:positive.max(10000),mergeFanIn:positive.min(2).max(16),maxRows:positive.max(10000),fanout:positive.min(2).max(256),maxInputRows:positive.max(10000000),maxMetadataRows:positive.max(10000),maxInputBytes:positive.max(10*GiB),maxOutputBytes:positive.max(10*GiB),maxScratchBytes:positive.max(10*GiB),timeoutMs:positive.max(1800000)}),
  supervisor:z.strictObject({wallSeconds:positive.max(172800),rssBytes:positive,commitBytes:positive,diskBytes:positive,freeBytes:uint,maxProcesses:positive.max(4)}),
 })});
export type GeographyCapacityV2=z.infer<typeof capacityV2Schema>;
export function evaluateGeographyCapacityV2(input:unknown){
 const plan=capacityV2Schema.parse(input),a=plan.allocations,{raw,membership:m,catalogue:c,supervisor:s}=plan.limits;
 const sum=(values:number[])=>values.reduce((a,b)=>{const result=a+b;if(!Number.isSafeInteger(result)||result<0)throw new Error('Unsafe capacity arithmetic');return result;},0);
 const require=(condition:boolean,message:string)=>{if(!condition)throw new Error(`Capacity v2 ${message}`);};
 const incrementalBytes=sum(Object.values(a)),countedLogicalCeiling=sum([incrementalBytes,plan.retainedBytes]);
 require(a.normalizedOutput===raw.outputBytes,'normalized aggregate mismatch');
 require(m.maxCandidateInputBytes<=raw.outputBytes,'candidate aggregate exceeds normalized aggregate');
 require(plan.rawSourceAlreadyRetainedBytes<=plan.retainedBytes&&plan.rawSourceAlreadyRetainedBytes<=raw.sourceBytes,'raw-source retained credit exceeds retained/source bytes');
 require(a.raw>=raw.sourceBytes-plan.rawSourceAlreadyRetainedBytes,'raw allocation smaller than unretained source ceiling');
 require(sum([a.index,a.journal])>=raw.scratchBytes,'scratch allocation smaller than raw scratch ceiling');
 require(a.boundaries<=64*MiB&&a.boundaries>=m.maxBoundaryBytes,'boundary allocation/ceiling mismatch');
 require(a.stagedBoundaries>=a.boundaries,'staged boundary allocation smaller than source');
 require(a.membership>=m.maxOutputBytes,'membership output allocation too small');
 require(a.sort>=c.maxScratchBytes&&a.catalogue>=c.maxOutputBytes,'publisher output/scratch allocation too small');
 require(m.maxRows<=raw.candidates&&c.maxInputRows>=m.maxRows&&c.maxInputBytes>=m.maxCandidateInputBytes,'row/input stage ceilings incompatible');
 require(m.maxTotalVertices>=m.maxVertices,'aggregate vertex ceiling smaller than shard ceiling');
 require(s.diskBytes>=countedLogicalCeiling,'supervisor disk ceiling smaller than retained coexistence');
 require(s.freeBytes>=plan.reserveBytes&&raw.freeBytes>=plan.reserveBytes,'supervisor/raw reserve smaller than declared reserve');
 require(s.rssBytes<=s.commitBytes,'RSS ceiling exceeds hard tree commit');
 require(sum([raw.seconds*1000,m.maxMilliseconds,c.timeoutMs])<=s.wallSeconds*1000,'stage deadlines exceed supervisor wall');
 const remainingBytes=plan.freeBytes-plan.reserveBytes-incrementalBytes;
 require(Number.isSafeInteger(remainingBytes)&&remainingBytes>=0,'negative/unsafe reserve headroom');
 return {plan,incrementalBytes,countedLogicalCeiling,remainingBytes,diskEnvelopeFits:true as const,productionAdmitted:false as const};
}
