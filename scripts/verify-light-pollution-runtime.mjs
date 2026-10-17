/** Compiled artifact acceptance using synthetic transport and loopback only. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {spawn} from 'node:child_process';
import {createRequire,registerHooks} from 'node:module';
import {mkdtemp,writeFile,readFile,realpath,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const require=createRequire(import.meta.url);
let optionalInstalled=true;try{require.resolve('playwright-core');}catch{optionalInstalled=false;}
if(process.argv.includes('--require-no-playwright'))assert.equal(optionalInstalled,false,'CI must prune optional Playwright before this check');
// Also enforce the absence boundary locally while optional packages may be installed.
let optionalImports=0;
const hook=registerHooks({resolve(specifier,context,next){if(/^playwright(?:-core)?(?:\/|$)/.test(specifier)){optionalImports++;throw Error('Optional browser runtime is unavailable in this synthetic check.');}return next(specifier,context);}});
const saved={...process.env};let directory,app,server,closeApp;
const cpuStart=process.cpuUsage(),resourceStart=process.resourceUsage();
const started=performance.now();
try{
 for(const key of Object.keys(process.env))if(key.startsWith('NIGHTSKY_')||key==='MET_NORWAY_USER_AGENT')delete process.env[key];
 directory=await realpath(await mkdtemp(join(tmpdir(),'nightsky-light-runtime-')));
 const quota=join(directory,'synthetic-quota.json');
 // This handcrafted ledger is strictly fake-account fixture state, never operator initialization.
 await writeFile(quota,JSON.stringify({version:1,lastNow:Date.now(),entries:{darkskysites:{accountLabel:'operator-darkskysites-project',buckets:{},months:{},disabled:false,blockedUntil:0}}}));
 await writeFile(quota+'.initialized','Synthetic offline fixture; not upstream account evidence.');
 Object.assign(process.env,{NIGHTSKY_DISCOVERY_MODE:'api',NIGHTSKY_MCP_TOOL_MODE:'full',NIGHTSKY_MCP_ALLOWED_HOSTS:'127.0.0.1',NIGHTSKY_LIGHT_POLLUTION_SOURCES:'darkskysites',NIGHTSKY_LIGHT_POLLUTION_API_ADMITTED:'darkskysites',NIGHTSKY_DARKSKYSITES_API_KEY:'synthetic-only-never-live',NIGHTSKY_LIGHT_POLLUTION_QUOTA_STATE_PATH:quota,NIGHTSKY_LIGHT_POLLUTION_BROWSER_ENABLED:'true'});
 const bundleUrl=new URL('../dist/plugin.js',import.meta.url),bundle=await readFile(bundleUrl),importStarted=performance.now();
 const runtime=await import(bundleUrl.href);const importMs=performance.now()-importStarted;closeApp=runtime.closeConfiguredNightSkyPluginApp;
 let providerCalls=0,syntheticBodyBytes=0;
 app=await runtime.createConfiguredNightSkyPluginApp({log:()=>{},fetcher:async(input,init)=>{
  providerCalls++;const u=new URL(String(input));assert.equal(u.origin+u.pathname,'https://darkskysites.com/api/sqm');assert.equal(u.searchParams.size,2);assert.equal(new Headers(init?.headers).get('x-api-key'),'synthetic-only-never-live');
  const body=JSON.stringify({latitude:Number(u.searchParams.get('lat')),longitude:Number(u.searchParams.get('lng')),sqm:20.5,bortleClass:4,dataset:{id:'08_2026',year:2026,month:8,requestedDate:null,fallbackUsed:false,fallbackFrom:null,fallbackReason:null,datasetsChecked:1},quality:{status:'screened',method:'synthetic-only',coverageVerified:false,flags:[]},attribution:'darkskysites.com'});syntheticBodyBytes+=Buffer.byteLength(body);return new Response(body,{headers:{'content-type':'application/json'}});
 }});
 server=createServer(app).listen(0,'127.0.0.1');await once(server,'listening');const base=`http://127.0.0.1:${server.address().port}`;let id=0;
 const rpc=async(method,params)=>{const r=await fetch(base+'/mcp',{method:'POST',headers:{'content-type':'application/json',accept:'application/json, text/event-stream','mcp-protocol-version':'2025-11-25'},body:JSON.stringify({jsonrpc:'2.0',id:++id,method,params}),signal:AbortSignal.timeout(10000)});assert.equal(r.status,200);const text=await r.text(),event=text.split('\n').find(line=>line.startsWith('data: ')),body=JSON.parse(event?event.slice(6):text);assert.equal(body.error,undefined);assert.equal(body.result.isError,undefined);return body.result;};
 await rpc('initialize',{protocolVersion:'2025-11-25',capabilities:{},clientInfo:{name:'synthetic-light-runtime',version:'1'}});
 const tools=await rpc('tools/list',{});assert.ok(tools.tools.some(t=>t.name==='compare_light_pollution'));
 const candidates=[{candidateId:'hyderabad',location:{kind:'coordinates',latitude:17.385,longitude:78.4867}},{candidateId:'shamirpet',location:{kind:'coordinates',latitude:17.61,longitude:78.563}}];
 const latencies=[];
 for(let i=0;i<2;i++){const at=performance.now();const r=await rpc('tools/call',{name:'compare_light_pollution',arguments:{candidates}});latencies.push(performance.now()-at);assert.equal(r.structuredContent.results.length,2);assert.ok(r.structuredContent.results.every(x=>x.status==='available'&&x.dataset.id==='08_2026'&&x.quality.coverage==='unknown'&&x.sqm===20.5));assert.equal(providerCalls,2);}
 const blocked=await rpc('tools/call',{name:'compare_light_pollution',arguments:{candidates:[candidates[0]],adapters:[{sourceId:'lightpollutionmap',transport:'browser'}]}});assert.equal(blocked.structuredContent.results[0].errorCode,'browser_not_admitted');assert.equal(providerCalls,2);
 const ledger=JSON.parse(await readFile(quota,'utf8'));assert.equal(Object.values(ledger.entries.darkskysites.months)[0],2);
 // Compiled child receives no credentials and is hard-off before any optional import.
 const childEnv=Object.fromEntries(['SystemRoot','WINDIR','PATH','TEMP','TMP'].filter(k=>process.env[k]).map(k=>[k,process.env[k]]));
 const child=spawn(process.execPath,[fileURLToPath(new URL('../dist/light-pollution-browser-worker.js',import.meta.url))],{env:childEnv,windowsHide:true,stdio:['pipe','pipe','pipe']});let output='',errors='';const exited=once(child,'exit');const timer=setTimeout(()=>child.kill(),5000);child.stdout.on('data',b=>{output+=b;if(output.length>16384)child.kill();});child.stderr.on('data',b=>{errors+=b;if(errors.length>16384)child.kill();});child.stdin.write(JSON.stringify({requestId:'compiled-offline',sourceId:'lightpollutionmap',points:[{candidateId:'point',latitude:17.385,longitude:78.4867}]})+'\n');
 let exit;try{exit=await exited;}finally{clearTimeout(timer);}assert.equal(exit[0],0,errors);assert.equal(errors,'');const worker=JSON.parse(output);assert.equal(worker.results[0].errorCode,'browser_not_admitted');assert.equal(optionalImports,0);
 const cpu=process.cpuUsage(cpuStart),resources=process.resourceUsage();
 console.log(JSON.stringify({synthetic:true,liveEvidenceEligible:false,bundleSha256:createHash('sha256').update(bundle).digest('hex'),node:process.version,platform:process.platform,optionalInstalled,optionalImports,compiledWorker:'browser_not_admitted',providerCalls,cachedComparisonAdditionalCalls:0,syntheticResponseBodyBytes:syntheticBodyBytes,moduleImportMs:importMs,coldComparisonMs:latencies[0],warmComparisonMs:latencies[1],elapsedMs:performance.now()-started,cpuUserMicroseconds:cpu.user,cpuSystemMicroseconds:cpu.system,maxRssKiB:resources.maxRSS,maxRssAtStartKiB:resourceStart.maxRSS,limitations:['Synthetic Node process and loopback MCP only; no provider network, Chromium, native model or host-capacity acceptance.','maxRSS is OS-reported lifetime high-water mark for this Node process; CPU excludes child, and this is not a whole-process-tree measurement.','Synthetic response body bytes exclude HTTP headers/TLS; cache disk usage is zero for the process-local evidence cache; ledger scratch files are removed.','Cold means first comparison after app startup; process startup and import are measured separately or excluded.']}));
}finally{
 if(server){server.closeAllConnections();await new Promise(done=>server.close(done));}if(app)await closeApp(app);
 if(directory){const target=resolve(directory),parent=await realpath(tmpdir());assert.equal(dirname(target).toLowerCase(),parent.toLowerCase());assert.ok(target.split(/[\\/]/).at(-1).startsWith('nightsky-light-runtime-'));await rm(target,{recursive:true,force:true});}
 hook.deregister();for(const key of Object.keys(process.env))if(!(key in saved))delete process.env[key];Object.assign(process.env,saved);
}
