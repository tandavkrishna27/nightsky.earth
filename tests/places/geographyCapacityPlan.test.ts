import {test} from 'node:test';
import assert from 'node:assert/strict';
import {evaluateGeographyCapacity, proposedGeographyAllocations} from '../../scripts/osm/geography-capacity-plan';
const plan=()=>({freeBytes:290857336832,reserveBytes:137438953472,retainedBytes:123,allocations:{...proposedGeographyAllocations} as {[K in keyof typeof proposedGeographyAllocations]:number}});
test('capacity counts all new allocations but does not subtract retained files twice',()=>{const p=plan(),r=evaluateGeographyCapacity(p);assert.equal(r.incrementalBytes,Object.values(p.allocations).reduce((a,b)=>a+b,0));assert.equal(r.remainingBytes,p.freeBytes-p.reserveBytes-r.incrementalBytes);assert.equal(r.remainingBytes,7840010259);assert.equal(r.countedLogicalCeiling,r.incrementalBytes+123);assert.equal(r.diskEnvelopeFits,true);assert.equal(r.productionAdmitted,false);});
test('insufficient reserve and assembly evidence ceiling fail explicitly',()=>{const p=plan();p.freeBytes=p.reserveBytes;assert.equal(evaluateGeographyCapacity(p).diskEnvelopeFits,false);p.allocations.exclusions=128*1024**2+1;assert.ok(evaluateGeographyCapacity(p).blockers.includes('exclusions exceeds assembly 128 MiB pin ceiling'));});
test('missing, unknown, negative, unsafe and nonfinite allocations are rejected',()=>{for(const change of [(p:any)=>delete p.allocations.journal,(p:any)=>p.allocations.hidden=1,(p:any)=>p.allocations.raw=-1,(p:any)=>p.freeBytes=Infinity,(p:any)=>p.retainedBytes=Number.MAX_SAFE_INTEGER,(p:any)=>p.allocations.raw=1]){const p=plan();change(p);assert.throws(()=>evaluateGeographyCapacity(p));}});


test('unsafe negative remainder is rejected while safe shortfall is returned',()=>{const p=plan();p.freeBytes=0;p.reserveBytes=Number.MAX_SAFE_INTEGER;assert.throws(()=>evaluateGeographyCapacity(p),/safe integer remainder/);p.reserveBytes=0;const r=evaluateGeographyCapacity(p);assert.equal(r.remainingBytes,-145578373101);assert.equal(r.diskEnvelopeFits,false);});
