import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createBootstrapResources,bootstrapRead,bootstrapToken,bootstrapOperation,createResourceSessionV3,validationRead,validationToken,validationOperation,geometryOperation,recordWrite,resourceCheckpoint,resourceSnapshotV3,requireLexicalEnvelope,requiredLexicalTokensV3} from '../../scripts/osm/partitioned-resources';
const limits=()=>({validation:{maxLexicalTokens:10000,maxOperations:1000,maxReadBytes:100000,maxRowsRead:1000,controlAndAdmissionReadBytes:1000},maxGeometryComparisons:100,maxMilliseconds:60000});
const session=(change?:(value:ReturnType<typeof limits>)=>void)=>{const l=limits();change?.(l);return createResourceSessionV3(l,createBootstrapResources(Date.now()));};
test('v3 lexical, validation, geometry, physical reads and writes have independent units',()=>{
 const s=session();validationToken(s,82);assert.equal(s.geometry.comparisons,0);assert.equal(s.validation.operations,0);geometryOperation(s,9);validationOperation(s,4);validationRead(s,16,2);recordWrite(s,'membership',900,3);
 assert.deepEqual(s.validation,{readBytes:16,rowsRead:2,lexicalTokens:82,operations:6,controlAndAdmissionReadBytes:0});assert.equal(s.geometry.comparisons,9);assert.deepEqual(s.writes.membership,{bytes:900,rows:3});assert.equal(s.writes['publisher-output'].bytes,0);
});
test('every named resource fails independently at its exact remaining allowance',()=>{
 const token=session(l=>l.validation.maxLexicalTokens=2);validationToken(token,2);assert.throws(()=>validationToken(token),/lexical/i);geometryOperation(token);
 const op=session(l=>l.validation.maxOperations=2);validationOperation(op,2);assert.throws(()=>resourceCheckpoint(op),/operation/i);validationToken(op);
 const geometry=session(l=>l.maxGeometryComparisons=2);geometryOperation(geometry,2);assert.throws(()=>geometryOperation(geometry),/geometry/i);validationOperation(geometry);
 const bytes=session(l=>{l.validation.maxReadBytes=10;l.validation.maxLexicalTokens=10;l.validation.controlAndAdmissionReadBytes=10;});validationRead(bytes,10);assert.throws(()=>validationRead(bytes,1),/read.*byte/i);
 const rows=session(l=>l.validation.maxRowsRead=1);validationRead(rows,1,1);assert.throws(()=>validationRead(rows,1,1),/row/i);
});
test('two admission phases share Q and write counters cannot buy read headroom',()=>{
 const s=session(l=>l.validation.controlAndAdmissionReadBytes=4);validationRead(s,2,0,'control-and-admission');recordWrite(s,'assembly',1000);validationRead(s,2,0,'control-and-admission');assert.equal(s.validation.readBytes,4);assert.equal(s.validation.controlAndAdmissionReadBytes,4);assert.throws(()=>validationRead(s,1,0,'control-and-admission'),/control|admission/i);assert.equal(s.validation.readBytes,4);
});
test('bounded bootstrap transfers actual counters, metadata and original start without a new deadline',t=>{
 let now=1000;t.mock.method(Date,'now',()=>now);const b=createBootstrapResources(now);bootstrapRead(b,23);bootstrapToken(b,7);bootstrapOperation(b,3);b.metadata.paths.set('/synthetic/control.json',23);b.metadata.bytes=23;now=1500;
 const l=limits();l.maxMilliseconds=1000;const s=createResourceSessionV3(l,b);assert.equal(s.startedAt,1000);assert.equal(s.deadline,2000);assert.deepEqual(s.validation,{readBytes:23,rowsRead:0,lexicalTokens:7,operations:4,controlAndAdmissionReadBytes:23});assert.equal(s.metadata,b.metadata);assert.throws(()=>createResourceSessionV3(l,b),/bootstrap|consumed/i);now=2000;assert.throws(()=>validationToken(s),/deadline/i);
});
test('bootstrap read/token/operation/time caps and transfer into smaller allowances fail closed',t=>{
 const b=createBootstrapResources(Date.now());bootstrapRead(b,3*1024**2);assert.throws(()=>bootstrapRead(b,1),/bootstrap.*read/i);bootstrapToken(b,4*1024**2);assert.throws(()=>bootstrapToken(b),/bootstrap.*lexical/i);
 const op=createBootstrapResources(Date.now());bootstrapOperation(op,4*1024**2);assert.throws(()=>bootstrapOperation(op),/bootstrap.*operation/i);
 const small=createBootstrapResources(Date.now());bootstrapRead(small,10);assert.throws(()=>createResourceSessionV3({...limits(),validation:{...limits().validation,controlAndAdmissionReadBytes:9}},small),/control|admission/i);
 let now=1000;t.mock.method(Date,'now',()=>now);const old=createBootstrapResources(now);now=61000;assert.throws(()=>bootstrapRead(old,1),/bootstrap.*deadline/i);
});
test('abort, unsafe arithmetic and forged session identity cannot bypass resource checks',()=>{
 const abort=new AbortController(),b=createBootstrapResources(Date.now(),abort.signal),s=createResourceSessionV3(limits(),b);abort.abort();assert.throws(()=>geometryOperation(s));assert.throws(()=>recordWrite(s,'membership',1));assert.throws(()=>validationRead({} as any,1));assert.throws(()=>recordWrite(session(),'membership',Number.MAX_SAFE_INTEGER+1));assert.throws(()=>createResourceSessionV3({...limits(),maxGeometryComparisons:200000001},createBootstrapResources(Date.now())));assert.throws(()=>createBootstrapResources(Date.now()+1000));
});
test('necessary lexical envelope uses full pass counts and is registered only once for one producer',()=>{
 assert.equal(requiredLexicalTokensV3({accepted:1,lineage:1,exclusions:0}),719);assert.equal(requiredLexicalTokensV3({accepted:2,lineage:3,exclusions:4}),1657);
 const s=session();requireLexicalEnvelope(s,{accepted:2,lineage:3,exclusions:4});validationToken(s,20);requireLexicalEnvelope(s,{accepted:2,lineage:3,exclusions:4});assert.throws(()=>requireLexicalEnvelope(s,{accepted:3,lineage:3,exclusions:4}),/producer|envelope/i);
 const short=session(l=>l.validation.maxLexicalTokens=718);assert.throws(()=>requireLexicalEnvelope(short,{accepted:1,lineage:1,exclusions:0}),/lexical.*floor|envelope/i);
 assert.throws(()=>requiredLexicalTokensV3({accepted:Number.MAX_SAFE_INTEGER,lineage:1,exclusions:0}),/safe|arithmetic/i);
});
test('snapshots expose honest elapsed time and immutable counter views',t=>{let now=1000;t.mock.method(Date,'now',()=>now);const s=session();now=1025;const snap=resourceSnapshotV3(s);assert.equal(snap.elapsedMilliseconds,25);assert.equal(snap.startedAt,1000);assert.equal(snap.deadline,61000);assert.throws(()=>{(s.validation as any).readBytes=-1;});assert.throws(()=>{(s.limits.validation as any).maxOperations=Number.MAX_SAFE_INTEGER;});});

test('physical reservations prevent over-read before IO and count actual completed bytes once',async()=>{
 const api=await import('../../scripts/osm/partitioned-resources');const s=session(l=>{l.validation.maxReadBytes=10;l.validation.maxLexicalTokens=10;l.validation.controlAndAdmissionReadBytes=10;});
 const a=api.reserveValidationRead(s,8);assert.throws(()=>api.reserveValidationRead(s,3),/read.*byte/i);assert.equal(s.validation.readBytes,0);api.completeValidationRead(a,3);assert.equal(s.validation.readBytes,3);assert.throws(()=>api.completeValidationRead(a,1),/reservation/i);const b=api.reserveValidationRead(s,7,'control-and-admission');api.completeValidationRead(b,0);assert.equal(s.validation.controlAndAdmissionReadBytes,0);validationRead(s,7);assert.equal(s.validation.readBytes,10);
});

test('writes cannot overbook the operation reserved by an in-flight physical read',async()=>{const api=await import('../../scripts/osm/partitioned-resources');const s=session(l=>l.validation.maxOperations=1),reservation=api.reserveValidationRead(s,1);assert.throws(()=>recordWrite(s,'membership',1),/operation/i);assert.equal(s.writes.membership.bytes,0);api.completeValidationRead(reservation,1);assert.equal(s.validation.operations,1);});
