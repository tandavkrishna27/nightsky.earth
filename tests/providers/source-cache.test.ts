import assert from 'node:assert/strict';
import {test} from 'node:test';
import {cacheSourceMethod} from '../../server/providers/sourceCache';
test('source cache isolates callers, expires, and never retains failures',async()=>{
 let now=0,calls=0;const method=cacheSourceMethod(async(input:{fail?:boolean})=>{calls++;return input.fail?{status:'unavailable'}:{status:'available',items:[1]};},()=>now,100);
 const first=await method({});first.items!.push(99);assert.deepEqual((await method({})).items,[1]);assert.equal(calls,1);
 now=101;await method({});assert.equal(calls,2);await method({fail:true});await method({fail:true});assert.equal(calls,4);
});
