/** Advisory arithmetic only: does not admit source identity, enforce allocations, or predict a planet build. */
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
