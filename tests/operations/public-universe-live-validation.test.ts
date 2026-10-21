import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtemp, readFile, rm} from 'node:fs/promises';
import {join, resolve} from 'node:path';
import {PLAN,runPublicUniverseDiagnostic} from '../../scripts/validate-public-universe-live';
import {initializeVerifiedPublicUniverseQuota} from '../../scripts/initialize-public-universe-quota';

const script=resolve('scripts/validate-public-universe-live.ts');
test('plan command is offline and exposes the four-request ceiling',()=>{
  const output=execFileSync(process.execPath,['--import','tsx',script,'--plan'],{encoding:'utf8',env:{...process.env,NIGHTSKY_PUBLICUNIVERSE_QUOTA_STATE_PATH:''}});
  assert.equal(JSON.parse(output).requests,4);
  assert.equal(PLAN.retries,0);
});

test('live diagnostic refuses a missing dedicated ledger before transport',async()=>{
  const dir=await mkdtemp(join(process.cwd(),'nightsky-pu-runner-'));
  try {
    let calls=0;
    await assert.rejects(runPublicUniverseDiagnostic({NIGHTSKY_PUBLICUNIVERSE_QUOTA_STATE_PATH:join(dir,'absent.json')},async()=>{calls++;throw Error('transport should not run');}));
    assert.equal(calls,0);
  } finally {await rm(dir,{recursive:true,force:true});}
});

test('synthetic selected-record diagnostic uses four GET routes, preserves quota and omits raw bodies',async()=>{
  const dir=await mkdtemp(join(process.cwd(),'nightsky-pu-runner-'));
  const path=join(dir,'quota.json'),env={NIGHTSKY_PUBLICUNIVERSE_QUOTA_STATE_PATH:path};
  const now=Date.now();
  await initializeVerifiedPublicUniverseQuota(env,{verifiedAllowance:true,verifiedAllAccountUsage:true,allConsumersQuiesced:true,evidence:'Synthetic complete account usage fixture',observedAt:now,usedLast24Hours:2,usedCurrentMonth:2},()=>now);
  const before=JSON.parse(await readFile(path,'utf8'));
  const sources={
    bsc5p:{source:'bsc5p',snapshot_sha256:'7fe926d80b535f9422ca81f8f3fee1d6422de29adaecfbd2f14b1a93fe5134b9',upstream_sha256:'b'.repeat(64),source_url:'https://heasarc.gsfc.nasa.gov/W3Browse/star-catalog/bsc5p.html',retrieved_at:'2026-10-18T12:00:00Z',license:'HEASARC data-use policy',license_url:'https://heasarc.gsfc.nasa.gov/docs/heasarc/data_policy.html',attribution:'Hoffleit & Warren (1991); NASA/GSFC HEASARC'},
    openngc:{source:'openngc',snapshot_sha256:'d8517e8d195ce69700645b60f8d6603d2aebba0e8e21f47603a4d6a31fe667a1',upstream_sha256:'c'.repeat(64),source_url:'https://github.com/mattiaverga/OpenNGC',retrieved_at:'2026-10-18T12:00:00Z',license:'CC BY-SA 4.0',license_url:'https://creativecommons.org/licenses/by-sa/4.0/',attribution:'Mattia Verga / OpenNGC'}
  };
  const rows={
    bsc5p:{id:'bsc5p:hr617',name:'Synthetic HR 617',source:'bsc5p',aliases:[],families:['bright_star'],object_type:'star',ra_deg:1,dec_deg:2,astrometry:{status:'verified',frame:'FK5',equinox:'J2000',reference_epoch_jyear:2000,observation_epoch_jyear:null,motion_model:'static_catalogue_direction'}},
    openngc:{id:'openngc:NGC1976',name:'Synthetic M42',source:'openngc',aliases:[],families:['deep_sky'],object_type:'nebula',ra_deg:1,dec_deg:2,astrometry:{status:'verified',frame:'ICRS',equinox:'J2000',reference_epoch_jyear:2000,observation_epoch_jyear:null,motion_model:'static_catalogue_direction'}}
  };
  const urls:string[]=[];
  const fake=(async(input:RequestInfo|URL,init?:RequestInit)=>{
    const url=new URL(String(input));urls.push(url.toString());assert.equal(init?.method,'GET');
    const source=url.searchParams.get('q')==='HR 617'||url.pathname.includes('bsc5p')?'bsc5p':'openngc';
    const payload=url.searchParams.has('q')
      ?{available:true,results:source==='openngc'?[{...rows.openngc,id:'openngc:NGC1981',name:'A different object'},rows.openngc]:[rows.bsc5p],total:source==='openngc'?2:1,limit:10,offset:0,sources:{[source]:sources[source]},coverage:'synthetic-secret-raw-body'}
      :{...rows[source],provenance:sources[source],secretRaw:'synthetic-secret-raw-body'};
    return Response.json(payload);
  }) as typeof fetch;
  try {
    const report=await runPublicUniverseDiagnostic(env,fake);
    assert.equal(report.attempts,4);
    assert.equal(urls.length,4);
    assert.deepEqual(urls.map(x=>new URL(x).pathname),['/api/v1/starter-targets','/api/v1/starter-targets/bsc5p%3Ahr617','/api/v1/starter-targets','/api/v1/starter-targets/openngc%3ANGC1976']);
    assert.equal(report.records.length,2);
    assert(report.records.every(r=>r.searchStatus==='available'&&r.detailStatus==='available'&&r.revisionAssociation==='verified'));
    assert.deepEqual(report.records[1].returnedIds,['openngc:NGC1981','openngc:NGC1976']);
    assert.equal(report.records[1].searchTotal,2);
    assert.equal(JSON.stringify(report).includes('synthetic-secret-raw-body'),false);
    const after=JSON.parse(await readFile(path,'utf8'));
    assert.deepEqual(after.entries.publicuniverse.imported,before.entries.publicuniverse.imported);
    assert.equal(after.entries.publicuniverse.disabled,false);
  } finally {await rm(dir,{recursive:true,force:true});}
});
