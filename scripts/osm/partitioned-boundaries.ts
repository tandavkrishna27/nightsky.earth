import * as z from 'zod4';
import {isAbsolute} from 'node:path';
import {boundaries,inside,ringsIntersect} from './geographic-geometry';
export const shardPin=z.strictObject({path:z.string().min(1).max(240).refine(p=>!isAbsolute(p)&&!p.includes(':')&&!p.includes('\\')&&p.split('/').every(s=>!!s&&s!=='.'&&s!=='..')),bytes:z.number().int().positive().max(64*1024*1024),sha256:z.string().regex(/^[a-f0-9]{64}$/)});
export const boundaryShards=z.array(z.strictObject({input:shardPin,regionIds:z.array(z.string().min(1).max(200)).min(1).max(10000)})).min(1).max(100);
/** Shared aggregate inventory/topology check. Caller owns byte/work/deadline budgets. */
export function shardGeometry(raw:unknown,expected:string[],seen:Set<string>,maxVertices:number,tick:()=>void){
 const parsed=boundaries(raw,maxVertices,tick),local=new Set(expected);if(local.size!==expected.length||parsed.length!==expected.length)throw new Error('Shard region inventory mismatch');
 let vertices=0;for(const b of parsed){tick();if(!local.delete(b.region.regionId)||seen.has(b.region.regionId))throw new Error('Duplicate/missing shard region');seen.add(b.region.regionId);for(const p of b.polygons)for(const r of p)vertices+=r.length;
 for(let i=0;i<b.polygons.length;i++)for(let j=0;j<i;j++){const a=b.polygons[i],c=b.polygons[j];for(const ar of a)for(const cr of c)if(ringsIntersect(ar,cr,tick))throw new Error('Unsupported touching/overlapping multipart geometry');if(inside(a[0][0],c[0],tick)!==0||inside(c[0][0],a[0],tick)!==0)throw new Error('Unsupported nested multipart geometry');}}
 if(local.size)throw new Error('Missing shard region');return {parsed,vertices};
}
