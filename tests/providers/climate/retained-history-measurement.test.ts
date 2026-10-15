import test from 'node:test';
import assert from 'node:assert/strict';
import {assertNoRetainedRequests,paddedPairHours} from '../../../scripts/era5/measure-retained-history';

const request=(day:string[],time:string[])=>({cellId:'era5:33:79',request:{year:['1991'],month:['03'],day,time}});
test('measurement counts independent padded clock including missing intervening months',()=>{
 assert.equal(paddedPairHours('1991-03-01','1992-03-31',10),96240);
 assert.equal(paddedPairHours('1991-03-01','1991-03-01',1),120);
 assert(paddedPairHours('1991-03-01','1992-03-31',10)>1488*10);
});
test('real-input planner audit checks every Cartesian proposal against retained cell-hour',()=>{
 const retained=new Map([['era5:33:79',new Set(['1991-03-02T02:00:00Z'])]]);
 assert.throws(()=>assertNoRetainedRequests([request(['01','02'],['00:00','02:00'])],retained),/retained/);
 assert.equal(assertNoRetainedRequests([request(['01'],['00:00','02:00'])],retained),2);
 assert.equal(assertNoRetainedRequests([{...request(['02'],['02:00']),cellId:'era5:33:78.75'}],retained),1);
});
test('planner audit rejects duplicate proposals while allowing disjoint irregular hours',()=>{
 const empty=new Map<string,Set<string>>();
 assert.throws(()=>assertNoRetainedRequests([request(['01'],['00:00']),request(['01'],['00:00'])],empty),/duplicated/);
 assert.equal(assertNoRetainedRequests([request(['01'],['00:00']),request(['01'],['01:00'])],empty),2);
});
