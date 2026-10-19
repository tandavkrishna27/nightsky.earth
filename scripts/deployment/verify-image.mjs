import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const repository = 'ghcr.io/tandavkrishna27/nightsky-mcp';
const call=(command,args)=>execFileSync(command,args,{encoding:'utf8',maxBuffer:16*1024*1024}).trim();
const docker=(...args)=>call('docker',args);
export function receipt(log, kind) {
  const matches=[...log.matchAll(new RegExp('(?:^|\\t| )NIGHTSKY_'+kind+'=(sha256:[a-f0-9]{64}) ([a-f0-9]{40})(?:\\r?\\n|$)','g'))];
  assert.equal(matches.length,1,'Expected exactly one release receipt');
  return {digest:matches[0][1],sha:matches[0][2]};
}
async function api(path) {
 const response=await fetch(`https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/${path}`,{headers:{authorization:`Bearer ${process.env.GH_TOKEN}`,accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'}});
 assert.equal(response.status,200,`GitHub evidence unavailable: ${path}`); return response.json();
}
async function successfulRun(id,workflow,event) {
 assert.match(id??'',/^[1-9][0-9]{0,14}$/);
 const run=await api(`actions/runs/${id}`);
 assert.equal(run.path,`.github/workflows/${workflow}`);assert.equal(run.event,event);assert.equal(run.conclusion,'success');assert.equal(run.status,'completed');
 assert.ok(['codex/plugin-v1','main'].includes(run.head_branch));assert.equal(run.head_repository.full_name,process.env.GITHUB_REPOSITORY);
 return run;
}
async function runReceipt(id,jobName,kind) {
 const {jobs}=await api(`actions/runs/${id}/jobs?filter=latest&per_page=100`);
 const jobsFound=jobs.filter(job=>job.name===jobName&&job.conclusion==='success');assert.equal(jobsFound.length,1);
 return receipt(call('gh',['run','view',id,'--repo',process.env.GITHUB_REPOSITORY,'--log','--job',String(jobsFound[0].id)]),kind);
}
async function sourceCi(sha) {
 const result=await api(`actions/workflows/nightsky-v1-checks.yml/runs?head_sha=${sha}&status=success&per_page=100`);
 assert.ok(result.workflow_runs.some(run=>run.head_sha===sha&&run.conclusion==='success'&&['push','workflow_dispatch'].includes(run.event)&&['main','codex/plugin-v1'].includes(run.head_branch)&&run.head_repository.full_name===process.env.GITHUB_REPOSITORY),'Exact source commit must pass NightSky V1 checks');
}
async function evidence() {
 const image=await successfulRun(process.env.IMAGE_RUN,'nightsky-image.yml','workflow_dispatch');
 const published=await runReceipt(process.env.IMAGE_RUN,'publish','PUBLISHED_IMAGE');assert.equal(published.sha,image.head_sha);await sourceCi(image.head_sha);
 if(process.env.TARGET_ENV==='production') {
  const staging=await successfulRun(process.env.STAGING_RUN,'nightsky-deploy.yml','workflow_dispatch');
  const accepted=await runReceipt(process.env.STAGING_RUN,'deploy (staging)','ACCEPTED_STAGING');assert.deepEqual(accepted,published);assert.equal(staging.head_sha,image.head_sha);
 } else assert.equal(process.env.TARGET_ENV,'staging');
 // Promoting from the same workflow source prevents mixing an older receipt with changed release automation.
 assert.equal(process.env.GITHUB_SHA,image.head_sha);
 docker('buildx','imagetools','inspect',`${repository}@${published.digest}`);
 appendFileSync(process.env.GITHUB_OUTPUT,`digest=${published.digest}\nsha=${published.sha}\n`);
}
async function verifyImage(image) {
 assert.ok(image);const metadata=JSON.parse(docker('image','inspect',image))[0];
 assert.equal(metadata.Architecture,'arm64');assert.equal(metadata.Os,'linux');assert.ok(metadata.Config.User && !['root','0','0:0'].includes(metadata.Config.User));
 const name=`nightsky-offline-${process.pid}`;
 const runtimeArgs=['--read-only','--cap-drop','ALL','--security-opt','no-new-privileges','--pids-limit','128','--memory','512m','--tmpfs','/tmp:rw,noexec,nosuid,size=16m','-e','NODE_OPTIONS=--import=/app/ops/hetzner/runtime-guard.mjs','-e','NIGHTSKY_DEPLOYMENT_ENV=staging','-e','NIGHTSKY_DISCOVERY_MODE=api','-e','NIGHTSKY_PLANNING_CARD_ENABLED=false','-e','HOST=0.0.0.0','-e','PORT=5000','-e','NIGHTSKY_MCP_ALLOWED_HOSTS=mcp-staging.nightsky.earth,localhost,127.0.0.1','-e','NIGHTSKY_MCP_TRUSTED_PROXIES=172.30.81.1'];
 const command=[image,'node','--import','/app/ops/hetzner/runtime-guard.mjs','dist/plugin.js'];
 try {
  docker('run','--detach','--name',name,'--network','none',...runtimeArgs,...command);
  const probe=`
   const fs=await import('node:fs');
   if(process.getuid()===0)throw Error('root');
   for(const path of ['/app/data/geonames','/app/data/osm','/app/.env','/app/.git','/app/data/era5'])if(fs.existsSync(path))throw Error('private data: '+path);
   if(fs.readdirSync('/app/data/events').length<5)throw Error('event assets absent');
   let ok=false;for(let i=0;i<100;i++){try{ok=(await fetch('http://127.0.0.1:5000/health')).ok;if(ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}if(!ok)throw Error('health');
   for(const [id,method,params] of [[1,'initialize',{protocolVersion:'2025-11-25',capabilities:{},clientInfo:{name:'image-probe',version:'1'}}],[2,'tools/list',{}]]){
    const response=await fetch('http://127.0.0.1:5000/mcp',{method:'POST',headers:{'content-type':'application/json',accept:'application/json, text/event-stream','mcp-protocol-version':'2025-11-25'},body:JSON.stringify({jsonrpc:'2.0',id,method,params}),signal:AbortSignal.timeout(5000)});
    if(!response.ok)throw Error('MCP status');const text=await response.text();const event=text.split('\\n').find(line=>line.startsWith('data: '));const body=JSON.parse(event?event.slice(6):text);if(body.error||!body.result)throw Error('MCP response');if(method==='tools/list'&&!body.result.tools.length)throw Error('tools');
   }
  `;
  docker('exec','--env','NODE_OPTIONS=',name,'node','--input-type=module','-e',probe);
 } finally {docker('rm','--force',name);}
 console.log('ARM64 image verified offline: health, initialize, tools/list, public assets, nonroot and private-data exclusions.');
 if(process.platform !== 'linux') {
  console.log('SKIP native host-to-internal-bridge smoke: this host is not Linux; Docker Desktop does not expose private bridge addresses to its host. Native Linux CI must execute this check.');
  return;
 }
 const networkName=`nightsky-staging-smoke-${process.pid}`;
 const bridgeContainer=`nightsky-bridge-${process.pid}`;
 // Docker rejects overlapping subnets. Never remove or modify any pre-existing network.
 docker('network','create','--internal','--subnet','172.30.81.0/24','--gateway','172.30.81.1',networkName);
 let containerCreated=false;
 try {
  const network=JSON.parse(docker('network','inspect',networkName))[0];
  assert.equal(network.Internal,true);
  assert.deepEqual(network.IPAM.Config,[{Subnet:'172.30.81.0/24',Gateway:'172.30.81.1'}]);
  docker('create','--name',bridgeContainer,'--network',networkName,'--ip','172.30.81.2',...runtimeArgs,...command);
  containerCreated=true;
  docker('start',bridgeContainer);
  const container=JSON.parse(docker('inspect',bridgeContainer))[0];
  assert.deepEqual(container.HostConfig.PortBindings,{});
  const base='http://172.30.81.2:5000';
  await verifyProtocol(base);
  console.log('Native Linux host reached guarded staging image over its internal bridge: health, initialize and tools/list; no published ports.');
 } finally {
  try {if(containerCreated)docker('rm','--force',bridgeContainer);}
  finally {docker('network','rm',networkName);}
 }
}
async function verifyProtocol(base) {
 const headers={host:'mcp-staging.nightsky.earth'};
 let healthy=false;
 for(let attempt=0;attempt<100;attempt++) {
  try {healthy=(await fetch(`${base}/health`,{headers,signal:AbortSignal.timeout(500)})).ok;if(healthy)break;}catch{/* bounded startup */}
  await new Promise(resolve=>setTimeout(resolve,100));
 }
 assert.ok(healthy,'Native host cannot reach internal staging bridge health');
 for(const [id,method,params] of [[1,'initialize',{protocolVersion:'2025-11-25',capabilities:{},clientInfo:{name:'native-host-bridge-probe',version:'1'}}],[2,'tools/list',{}]]) {
  const response=await fetch(`${base}/mcp`,{method:'POST',headers:{...headers,'content-type':'application/json',accept:'application/json, text/event-stream','mcp-protocol-version':'2025-11-25'},body:JSON.stringify({jsonrpc:'2.0',id,method,params}),signal:AbortSignal.timeout(5000)});
  assert.equal(response.status,200);
  const text=await response.text();const event=text.split('\n').find(line=>line.startsWith('data: '));const body=JSON.parse(event?event.slice(6):text);
  assert.equal(body.error,undefined);assert.ok(body.result);
  if(method==='tools/list')assert.ok(body.result.tools.length);
 }
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) {
 if(process.argv[2]==='evidence')await evidence();
 else if(process.argv[2]==='source-ci')await sourceCi(process.env.GITHUB_SHA);
 else await verifyImage(process.argv[2]);
}
