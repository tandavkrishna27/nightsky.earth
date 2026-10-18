import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCapacityReport, validateCapacityReport } from '../../scripts/api-capacity-report.mjs';

const phases = () => ['sequential','concurrent'].map((name,index) => ({ name, concurrency:index ? 4 : 1, observedClientConcurrency:index ? 4 : 1,
 requests:Array.from({length:4},(_,i)=>({operation:i%2?'get_night_conditions':'get_astronomy_window',status:200,elapsedMs:i+1,responseUtf8Bytes:100+i})) }));
test('capacity report separates exact fixed serial and concurrent loopback samples',()=>{
 const report=buildCapacityReport(phases());
 validateCapacityReport(report);
 assert.equal(report.synthetic,true);
 assert.equal(report.liveEvidenceEligible,false);
 assert.equal(report.measuredRequests,8);
 assert.deepEqual(report.phases.map(p=>p.requestCount),[4,4]);
 assert.deepEqual(report.phases.map(p=>p.p50Ms),[2,2]);
 assert.deepEqual(report.phases.map(p=>p.p95Ms),[4,4]);
 assert.equal(report.acceptedBodyUtf8Bytes,812);
});
test('capacity evidence rejects live claims, wrong budgets and invalid measurements',()=>{
 const report=buildCapacityReport(phases());
 for(const bad of [{...report,synthetic:false},{...report,liveEvidenceEligible:true},{...report,measuredRequests:9},
  {...report,acceptedBodyUtf8Bytes:0},{...report,phases:report.phases.map(p=>({...p,p95Ms:NaN}))}]) assert.throws(()=>validateCapacityReport(bad));
 for(const mutate of [(p:any[])=>p.pop(),(p:any[])=>p[1].requests.push(p[1].requests[0]),(p:any[])=>p[1].concurrency=5,
  (p:any[])=>p[0].observedClientConcurrency=2,(p:any[])=>p[0].requests[0].status=503,
  (p:any[])=>p[0].requests[0].elapsedMs=-1,(p:any[])=>p[0].requests[0].responseUtf8Bytes=Infinity]){
  const rows=phases();mutate(rows);assert.throws(()=>buildCapacityReport(rows));
 }
});
