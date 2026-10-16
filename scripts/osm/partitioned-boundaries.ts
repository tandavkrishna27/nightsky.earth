import * as z from 'zod4';
import {isAbsolute} from 'node:path';
import {boundaries,boundaryId,isUnresolved} from './geographic-geometry';
export const shardPin=z.strictObject({path:z.string().min(1).max(240).refine(p=>!isAbsolute(p)&&!p.includes(':')&&!p.includes('\\')&&p.split('/').every(s=>!!s&&s!=='.'&&s!=='..')),bytes:z.number().int().positive().max(64*1024*1024),sha256:z.string().regex(/^[a-f0-9]{64}$/)});
export const boundaryShards=z.array(z.strictObject({input:shardPin,unresolvedBoundaryIds:z.array(z.string().min(1).max(400)).max(10000).optional(),regionIds:z.array(z.string().min(1).max(200)).max(10000)})).min(1).max(100);
/** Shared aggregate inventory/topology check. Caller owns byte/work/deadline budgets. */
export function shardGeometry(raw:unknown,expected:string[],seen:Set<string>,maxVertices:number,tick:()=>void,unresolvedIds:string[]=[]){
 const known=new Set<string>(),unknown=new Set<string>(),local=new Set<string>();for(const [ids,set] of [[expected,known],[unresolvedIds,unknown]] as const)for(const id of ids){tick();if(local.has(id))throw new Error('Shard region inventory mismatch');set.add(id);local.add(id);}
 const parsed=boundaries(raw,maxVertices,tick,unresolvedIds.length>0);if(parsed.length!==local.size)throw new Error('Shard region inventory mismatch');
 let vertices=0;for(const b of parsed){tick();if(isUnresolved(b.region)?!unknown.has(boundaryId(b.region)):!known.has(boundaryId(b.region)))throw new Error('Shard identity kind mismatch');if(!local.delete(boundaryId(b.region))||seen.has(boundaryId(b.region)))throw new Error('Duplicate/missing shard region');seen.add(boundaryId(b.region));for(const p of b.polygons)for(const r of p)vertices+=r.length;
 }
 if(local.size)throw new Error('Missing shard region');return {parsed,vertices};
}
