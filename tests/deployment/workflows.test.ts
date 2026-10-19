import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read=(p:string)=>readFileSync(p,'utf8');
test('image build is native ARM64, secret-free on PR and publication is manual',()=>{
 const s=read('.github/workflows/nightsky-image.yml');
 for(const value of ['ubuntu-24.04-arm','pull_request:','push:','branches: [codex/plugin-v1, main]','workflow_dispatch:','Dockerfile.plugin','--platform linux/arm64','--network none','verify-image.mjs','packages: write']) assert.ok(s.includes(value),value);
 assert.ok(!s.includes('pull_request_target'));
 assert.match(s,/github.event_name == 'workflow_dispatch'/);
});
test('promotion is manual, controlled, environment-gated and serial across host',()=>{
 const s=read('.github/workflows/nightsky-deploy.yml');
 for(const value of ['workflow_dispatch:','codex/plugin-v1','refs/heads/main','cancel-in-progress: false','group: nightsky-hetzner-host','environment: ${{ inputs.environment }}','StrictHostKeyChecking=yes','NIGHTSKY_DEPLOY_SSH_KEY','vars.NIGHTSKY_DEPLOY_HOST','vars.NIGHTSKY_DEPLOY_PORT','vars.NIGHTSKY_DEPLOY_USER','vars.NIGHTSKY_DEPLOY_KNOWN_HOSTS','verify-image.mjs evidence']) assert.ok(s.includes(value),value);
 assert.ok(!s.includes('pull_request:'));
 assert.ok(!s.includes('inputs.digest'));
});
test('offline image verifier runs actual restricted image and probes protocol',()=>{
 const s=read('scripts/deployment/verify-image.mjs');
 for(const value of ['--network','none','--cap-drop','ALL','--read-only','initialize','tools/list','/health','data/events','runtime-guard.mjs','NIGHTSKY_DEPLOYMENT_ENV','Architecture','arm64']) assert.ok(s.includes(value),value);
});


test('receipt parsing accepts one exact digest and source identity and rejects ambiguity', async()=>{
 const {receipt}=await import('../../scripts/deployment/verify-image.mjs');
 const digest='sha256:'+ 'a'.repeat(64), sha='b'.repeat(40);
 const line=`publish\tPublish immutable digest receipt\t2026-10-19T00:00:00Z NIGHTSKY_PUBLISHED_IMAGE=${digest} ${sha}\n`;
 assert.deepEqual(receipt(line,'PUBLISHED_IMAGE'),{digest,sha});
 for(const log of ['',line+line,line.replace(digest,'sha256:bad'),line.replace(sha,'main'),`echo "NIGHTSKY_PUBLISHED_IMAGE=${digest} ${sha}"\n`]) assert.throws(()=>receipt(log,'PUBLISHED_IMAGE'));
 assert.throws(()=>receipt(line,'ACCEPTED_STAGING'));
});
test('trusted promotion binds workflow path, source SHA, event, branch, job and digest',()=>{
 const s=read('scripts/deployment/verify-image.mjs');
 for(const value of ['run.path','run.event','run.head_repository.full_name','run.head_branch',"run.conclusion,'success'",'jobsFound.length,1','assert.deepEqual(accepted,published)','assert.equal(process.env.GITHUB_SHA,image.head_sha)','assert.equal(staging.head_sha,image.head_sha)','nightsky-v1-checks.yml']) assert.ok(s.includes(value),value);
});
test('workflow actions are locked to full SHAs and shell inputs use environment indirection',()=>{
 for(const file of ['.github/workflows/nightsky-image.yml','.github/workflows/nightsky-deploy.yml']){
  const s=read(file);
  for(const match of s.matchAll(/uses: ([^\n]+)/g))assert.match(match[1].trim(),/@[a-f0-9]{40}$/);
  for(const block of s.split(/run: /).slice(1))assert.ok(!block.split(/\n      - /)[0].includes('${{ inputs.'),'no workflow input interpolated into shell');
 }
});

test('native Linux verifies host reachability over an internal staging bridge without published ports',()=>{
 const s=read('scripts/deployment/verify-image.mjs');
 for(const value of ["process.platform !== 'linux'","'--internal'","'--subnet','172.30.81.0/24'","'--gateway','172.30.81.1'","'--ip','172.30.81.2'",'network.Internal,true','http://172.30.81.2:5000','verifyProtocol(base)',"docker('network','rm',networkName)"]) assert.ok(s.includes(value),value);
 assert.ok(!s.includes("'--publish'"));
});

test('native host protocol probe sends exact reviewed Host over loopback transport', async()=>{
 const {createServer}=await import('node:http');
 const {verifyProtocol}=await import('../../scripts/deployment/verify-image.mjs');
 assert.equal(typeof verifyProtocol,'function');
 const seen:string[]=[];
 const server=createServer((req,res)=>{
  seen.push(req.headers.host??'');
  if(req.headers.host!=='mcp-staging.nightsky.earth'){res.writeHead(403);res.end();return;}
  if(req.url==='/health'){res.end('{"status":"ok"}');return;}
  let text='';req.on('data',chunk=>text+=chunk);req.on('end',()=>{
   const rpc=JSON.parse(text);res.setHeader('content-type','text/event-stream');
   res.end(`data: ${JSON.stringify({jsonrpc:'2.0',id:rpc.id,result:rpc.method==='tools/list'?{tools:[{name:'resolve_place'}]}:{serverInfo:{name:'nightsky-earth'}}})}\n\n`);
  });
 });
 await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
 try {const address=server.address();assert.ok(address&&typeof address!=='string');await verifyProtocol(`http://127.0.0.1:${address.port}`);assert.deepEqual(seen,Array(3).fill('mcp-staging.nightsky.earth'));}
 finally {await new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve()));}
});


test('host probe bounds response size and total request time',async()=>{
 const {createServer}=await import('node:http');
 const {hostProbeRequest}=await import('../../scripts/deployment/verify-image.mjs');
 const server=createServer((req,res)=>{if(req.url==='/large')res.end('x'.repeat(1024*1024+1));});
 await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
 try {
  const address=server.address();assert.ok(address&&typeof address!=='string');const base=`http://127.0.0.1:${address.port}`;
  await assert.rejects(hostProbeRequest(`${base}/large`),/Host probe/);
  await assert.rejects(hostProbeRequest(`${base}/hang`,{timeout:25}),/Host probe/);
 } finally {server.closeAllConnections();await new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve()));}
});
