import assert from 'node:assert/strict';
import test from 'node:test';
import express from 'express';
import {createServer, request} from 'node:http';
import {once} from 'node:events';
import {mountMcpRoute, type McpRouteDependencies} from '../../server/mcp/route';
import {configureMcpProxyTrust} from '../../server/mcp/proxyTrust';
import {currentMcpRequestId, type McpDiagnosticEvent} from '../../server/mcp/requestDiagnostics';

const init={jsonrpc:'2.0',id:'hostile-id',method:'initialize',params:{protocolVersion:'2025-11-25',capabilities:{},clientInfo:{name:'fixture',version:'1'}}};
const tool={jsonrpc:'2.0',id:'hostile-id',method:'tools/call',params:{name:'resolve_place',arguments:{placeQuery:'hostile-canary'}}};
async function fixture(deps:McpRouteDependencies,run:(send:(body:unknown,headers?:Record<string,string>,method?:string)=>Promise<{status:number;id:string|null;retry:string|null}>)=>Promise<void>,trusted=false) {
 const app=express();app.use(express.json());if(trusted)configureMcpProxyTrust(app,'127.0.0.1');
 mountMcpRoute(app,{toolMode:'resolver-only',placeIndexLoader:async()=>undefined,fetcher:async()=>{throw Error('external prohibited');},...deps});
 const server=createServer(app);server.listen(0,'127.0.0.1');await once(server,'listening');
 const address=server.address();assert.ok(address&&typeof address!=='string');
 try {await run(async(body,headers={},method='POST')=>{if(headers.host)return await new Promise((resolve,reject)=>{const outgoing=request({hostname:'127.0.0.1',port:address.port,path:'/mcp',method,headers:{'content-type':'application/json',...headers}},res=>{res.resume();res.on('end',()=>resolve({status:res.statusCode!,id:String(res.headers['x-nightsky-request-id']),retry:null}));});outgoing.on('error',reject);outgoing.end(JSON.stringify(body));});const res=await fetch(`http://127.0.0.1:${address.port}/mcp?hostile-query`,{method,signal:AbortSignal.timeout(3000),headers:{'content-type':'application/json',accept:'application/json, text/event-stream','x-hostile-header':'hostile-canary',...headers},...(method==='GET'?{}:{body:JSON.stringify(body)})});await res.text();return {status:res.status,id:res.headers.get('x-nightsky-request-id'),retry:res.headers.get('retry-after')};});}
 finally {server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));}
}
test('sixty successful startup initializations leave the default tool budget available',async()=>{
 await fixture({},async send=>{for(let i=0;i<60;i++)assert.equal((await send(init)).status,200);assert.equal((await send(tool)).status,200);});
});
test('tool and protocol buckets independently bound admitted requests',async()=>{
 await fixture({maxRequestsPerWindow:1,maxProtocolRequestsPerWindow:2},async send=>{
  assert.equal((await send(init)).status,200);assert.equal((await send(tool)).status,200);
  assert.equal((await send(tool)).status,429);assert.equal((await send(init)).status,200);
  const blocked=await send(init);assert.equal(blocked.status,429);assert.ok(blocked.retry);
 });
});
test('default protocol and tool budgets stop at 120 and 60 respectively',async()=>{
 await fixture({},async send=>{for(let i=0;i<120;i++)assert.equal((await send(init)).status,200);assert.equal((await send(init)).status,429);for(let i=0;i<60;i++)assert.equal((await send(tool)).status,200);assert.equal((await send(tool)).status,429);});
});
test('invalid tool calls and tool notifications still consume the tool bucket',async()=>{
 for(const body of [{...tool,params:{}},{jsonrpc:'2.0',method:'tools/call',params:tool.params}])await fixture({maxRequestsPerWindow:1},async send=>{await send(body);assert.equal((await send(tool)).status,429);assert.equal((await send(init)).status,200);});
});
test('unknown malformed batch notification and GET traffic share the protocol budget',async()=>{
 for(const body of [{}, {...init,method:'hostile-canary'},[tool],{jsonrpc:'2.0',method:'notifications/initialized'}]) {
  await fixture({maxRequestsPerWindow:1,maxProtocolRequestsPerWindow:1},async send=>{
   const first=await send(body);assert.notEqual(first.status,429);if(Array.isArray(body))assert.equal(first.status,400);
   assert.equal((await send(init)).status,429);assert.equal((await send(tool)).status,200);
  });
 }
 await fixture({maxProtocolRequestsPerWindow:1},async send=>{await send(undefined,{},'GET');assert.equal((await send(init)).status,429);});
});
test('global budget covers both buckets and bounded keys expire',async()=>{
 await fixture({maxGlobalRequestsPerWindow:2},async send=>{assert.equal((await send(init)).status,200);assert.equal((await send(tool)).status,200);assert.equal((await send(init)).status,429);});
 await fixture({maxRateLimitKeys:1,rateWindowMs:100},async send=>{assert.equal((await send(init,{'x-forwarded-for':'198.51.100.1'})).status,200);const blocked=await send(init,{'x-forwarded-for':'198.51.100.2'});assert.equal(blocked.status,429);assert.ok(blocked.retry);await new Promise(resolve=>setTimeout(resolve,120));assert.equal((await send(init,{'x-forwarded-for':'198.51.100.2'})).status,200);},true);
});
test('diagnostics contain only bounded labels and generated IDs, including rejected host and proxy',async()=>{
 const events:any[]=[];
 await fixture({maxRequestsPerWindow:1,maxProtocolRequestsPerWindow:1,onMcpDiagnostic:event=>{events.push(event);}},async send=>{
  const first=await send(tool);assert.match(first.id!,/^[0-9a-f-]{36}$/);
  await send(tool);await send(init);await send(init);
  await send(init,{host:'hostile-canary'});await send(init,{'x-forwarded-for':'hostile-canary'});
 },true);
 assert.equal(events.filter(e=>e.kind==='ingress').length,6);assert.equal(events.filter(e=>e.kind==='completion').length,6);
 assert.doesNotMatch(JSON.stringify(events),/hostile|198\.51|query|arguments|headers/);
 for(const event of events){assert.match(event.requestId,/^[0-9a-f-]{36}$/);assert.ok(['tools/call','initialize','OTHER'].includes(event.method));}
 for(const reason of ['tool-limit','protocol-limit','host-rejected','proxy-rejected'])assert.ok(events.some(e=>e.reason===reason),reason);
});
test('resource diagnostics identify only the planning card without logging supplied URIs',async()=>{
 const events:any[]=[];
 await fixture({toolMode:'full',resultCardPrototype:true,onMcpDiagnostic:event=>{events.push(event);}},async send=>{
  await send({...init,method:'resources/read',params:{uri:'ui://nightsky/planning-card-v2.html'}});
  await send({...init,method:'resources/read',params:{uri:'https://hostile-canary.example/private?token=hostile-canary'}});
  await send({...init,method:'resources/read',params:{uri:{secret:'hostile-canary'}}});
 });
 const reads=events.filter(event=>event.method==='resources/read');
 assert.deepEqual(reads.map(event=>event.resource),['planning-card','planning-card','other','other','other','other']);
 assert.doesNotMatch(JSON.stringify(reads),/hostile-canary|private\?token|planning-card-v2\.html/);
});
test('throwing diagnostics never interrupt responses and invalid protocol limits fail at mount',async()=>{
 await fixture({onMcpDiagnostic:()=>{throw Error('hostile-canary');}},async send=>assert.equal((await send(init)).status,200));
 await fixture({onMcpDiagnostic:async()=>{throw Error('hostile-canary');}},async send=>assert.equal((await send(init)).status,200));
 for(const limit of [0,-1,NaN,Infinity,1.5,Number.MAX_SAFE_INTEGER+1])assert.throws(()=>mountMcpRoute(express(),{maxProtocolRequestsPerWindow:limit}),/positive safe integers/);
});
test('subject global and key rejection diagnostics retain their separate fixed reasons',async()=>{
 const events:McpDiagnosticEvent[]=[];const onMcpDiagnostic=(event:McpDiagnosticEvent)=>{events.push(event);};
 await fixture({onMcpDiagnostic,maxSubjectRequestsPerWindow:1},async send=>{const body={...tool,params:{...tool.params,_meta:{'openai/subject':'hostile-subject','openai/userLocation':{latitude:18.523456,longitude:73.856789}}}};assert.equal((await send(body)).status,200);assert.equal((await send(body)).status,429);assert.equal((await send(init)).status,200);});
 await fixture({onMcpDiagnostic,maxGlobalRequestsPerWindow:1},async send=>{await send(init);assert.equal((await send(tool)).status,429);});
 await fixture({onMcpDiagnostic,maxRateLimitKeys:1},async send=>{await send(init,{'x-forwarded-for':'198.51.100.1'});assert.equal((await send(init,{'x-forwarded-for':'198.51.100.2'})).status,429);},true);
 await fixture({onMcpDiagnostic},async send=>{await send({...tool,params:{name:'hostile-tool',arguments:{secret:'hostile-canary'}}});await send({...init,method:'hostile-method'});});
 for(const reason of ['subject-limit','global-limit','key-limit'])assert.ok(events.some(e=>e.reason===reason),reason);
 assert.doesNotMatch(JSON.stringify(events),/hostile|18\.523456|73\.856789|198\.51/);
});
test('diagnostics finish once on disconnect and correlation survives tool awaits while admission is retained',{timeout:5000},async()=>{
 const events:McpDiagnosticEvent[]=[];let entered!:()=>void,release!:()=>void,completed!:()=>void;
 const started=new Promise<void>(resolve=>entered=resolve),gate=new Promise<void>(resolve=>release=resolve),completion=new Promise<void>(resolve=>completed=resolve);
 let before:string|undefined,after:string|undefined;
 const app=express();app.use(express.json());
 mountMcpRoute(app,{toolMode:'resolver-only',maxConcurrentRequests:1,onMcpDiagnostic:event=>{events.push(event);if(event.kind==='completion'&&event.reason==='client-disconnected')completed();},placeIndexLoader:async()=>{before=currentMcpRequestId();entered();await gate;after=currentMcpRequestId();return undefined;}});
 const server=createServer(app);server.listen(0,'127.0.0.1');await once(server,'listening');const address=server.address();assert.ok(address&&typeof address!=='string');
 const url=`http://127.0.0.1:${address.port}/mcp`;
 const outgoing=request(url,{method:'POST',headers:{'content-type':'application/json',accept:'application/json, text/event-stream'}},res=>res.resume());outgoing.on('error',()=>undefined);outgoing.end(JSON.stringify(tool));
 try {
  await started;outgoing.destroy();await completion;
  assert.match(before!,/^[0-9a-f-]{36}$/);assert.equal(currentMcpRequestId(),undefined);
  const blocked=await fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(init)});await blocked.text();assert.equal(blocked.status,503);
  assert.ok(events.some(event=>event.reason==='concurrency-limit'));
  release();
  for(let i=0;i<20&&!after;i++)await new Promise(resolve=>setTimeout(resolve,5));
  assert.equal(before,after);
  assert.equal(events.filter(event=>event.requestId===before&&event.kind==='completion').length,1);
  const disconnected=events.find(event=>event.requestId===before&&event.kind==='completion');assert.equal(disconnected?.reason,'client-disconnected');
  assert.doesNotMatch(JSON.stringify(events),/hostile/);
 } finally {release();outgoing.destroy();server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));}
});

