/** Pure fixed-workload evidence contract; no network, environment or filesystem access. */
import assert from 'node:assert/strict';
const percentile=(values,fraction)=>[...values].sort((a,b)=>a-b)[Math.ceil(values.length*fraction)-1];
function validatePhase(phase,index){
 assert.equal(phase.name,index?'concurrent':'sequential');
 assert.equal(phase.concurrency,index?4:1);
 assert.equal(phase.observedClientConcurrency,index?4:1);
 assert.equal(phase.requests.length,4);
 for(const row of phase.requests){
  assert.ok(['get_astronomy_window','get_night_conditions','plan_observing_session'].includes(row.operation));
  assert.equal(row.status,200);
  assert.ok(Number.isFinite(row.elapsedMs)&&row.elapsedMs>=0);
  assert.ok(Number.isSafeInteger(row.responseUtf8Bytes)&&row.responseUtf8Bytes>0);
 }
}
export function buildCapacityReport(phases){
 assert.equal(phases.length,2);
 phases.forEach(validatePhase);
 const report={schemaVersion:1,synthetic:true,liveEvidenceEligible:false,measuredRequests:8,
  acceptedBodyUtf8Bytes:phases.flatMap(p=>p.requests).reduce((sum,row)=>sum+row.responseUtf8Bytes,0),
  phases:phases.map(phase=>({...phase,requestCount:4,p50Ms:percentile(phase.requests.map(r=>r.elapsedMs),0.5),p95Ms:percentile(phase.requests.map(r=>r.elapsedMs),0.95)}))};
 validateCapacityReport(report);return report;
}
export function validateCapacityReport(report){
 assert.equal(report.schemaVersion,1);assert.equal(report.synthetic,true);assert.equal(report.liveEvidenceEligible,false);
 assert.equal(report.measuredRequests,8);assert.equal(report.phases.length,2);
 report.phases.forEach((phase,index)=>{
  validatePhase(phase,index);assert.equal(phase.requestCount,4);
  assert.equal(phase.p50Ms,percentile(phase.requests.map(r=>r.elapsedMs),0.5));
  assert.equal(phase.p95Ms,percentile(phase.requests.map(r=>r.elapsedMs),0.95));
 });
 assert.equal(report.acceptedBodyUtf8Bytes,report.phases.flatMap(p=>p.requests).reduce((sum,row)=>sum+row.responseUtf8Bytes,0));
 assert.ok(Number.isSafeInteger(report.acceptedBodyUtf8Bytes)&&report.acceptedBodyUtf8Bytes>0);
}
