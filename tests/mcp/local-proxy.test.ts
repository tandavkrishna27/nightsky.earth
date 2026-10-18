import assert from "node:assert/strict";
import test from "node:test";
import express from "express";
import { configureMcpProxyTrust } from "../../server/mcp/proxyTrust";

test("proxy trust defaults off and validates explicit narrow addresses", () => {
 const app = express();
 configureMcpProxyTrust(app);
 assert.equal(app.get("trust proxy"), false);
 for (const raw of ["true", "*", "loopback", "0.0.0.0/0", "10.0.0.0/8", "::/0", "127.0.0.1,", "not-an-ip", "127.0.0.1/33"]) {
  assert.throws(() => configureMcpProxyTrust(app, raw), /proxy/i);
  assert.equal(app.get("trust proxy"), false);
 }
 configureMcpProxyTrust(app, "127.0.0.1,::1,192.0.2.0/24,2001:db8::/64");
 const trust = app.get("trust proxy fn");
 assert.equal(trust("127.0.0.1", 0), true);
 assert.equal(trust("::ffff:127.0.0.1", 0), true);
 assert.equal(trust("::1", 0), true);
 assert.equal(trust("192.0.2.5", 0), true);
 assert.equal(trust("2001:db8::2", 0), true);
 assert.equal(trust("198.51.100.5", 0), false);
 assert.equal(trust("127.0.0.1", 1), false);
});

import { createServer, request, type Server } from "node:http";
import { once } from "node:events";
import { createNightSkyPluginApp } from "../../server/plugin";
async function bounded<T>(operation: Promise<T>, label: string, milliseconds = 2000): Promise<T> {
 let timer: ReturnType<typeof setTimeout> | undefined;
 try {
  return await Promise.race([operation, new Promise<never>((_resolve,reject)=> {
   timer=setTimeout(()=>reject(new Error(`${label} exceeded ${milliseconds}ms.`)),milliseconds);
  })]);
 } finally {if(timer) clearTimeout(timer);}
}
async function listen(server: Server) {
 server.listen(0,"127.0.0.1"); await bounded(once(server,"listening"),"listener startup");
 const address=server.address(); assert.ok(address && typeof address !== "string"); return address.port;
}
async function close(server: Server) { server.closeAllConnections(); await bounded(new Promise<void>(resolve=>server.close(()=>resolve())),"listener cleanup"); }
async function topology(trust: string | undefined, run:(port:number,backend:number,logs:string[])=>Promise<void>, dependencies: import("../../server/plugin").PluginAppDependencies = {}, timeoutMs?:number) {
 const logs:string[]=[];
 const app=createNightSkyPluginApp({toolMode:"resolver-only",maxRequestsPerWindow:1,maxProtocolRequestsPerWindow:1,log:line=>logs.push(line),...dependencies});
 configureMcpProxyTrust(app,trust);
 const backend=createServer(app); let proxy: Server | undefined;
 try {
 const backendPort=await listen(backend);
 proxy=createServer((incoming,outgoing)=> {
  const headers={...incoming.headers,host:`127.0.0.1:${backendPort}`};
  // Synthetic client identity chosen by harness; production proxy uses socket peer.
  headers["x-forwarded-for"]=String(incoming.headers["x-test-client"] ?? "198.51.100.1");
  delete headers["x-test-client"];
  const upstream=request({hostname:"127.0.0.1",port:backendPort,path:incoming.url,method:incoming.method,headers},response=> {
   outgoing.writeHead(response.statusCode!,response.headers); response.pipe(outgoing);
  });
  if(timeoutMs) upstream.setTimeout(timeoutMs,()=> {outgoing.writeHead(504);outgoing.end();upstream.destroy();});
  upstream.on("error",()=>outgoing.destroy()); outgoing.on("close",()=>upstream.destroy()); incoming.pipe(upstream);
 });
 const proxyPort=await listen(proxy);
 await bounded(run(proxyPort,backendPort,logs),"proxy fixture",5000);
 } finally {try {if(proxy) await close(proxy);} finally {await close(backend);}}
}
async function call(port:number,client:string,extra:Record<string,string>={}) {
 return fetch(`http://127.0.0.1:${port}/mcp?query-secret=private`,{signal:AbortSignal.timeout(2000),method:"POST",headers:{"content-type":"application/json",accept:"application/json, text/event-stream","x-test-client":client,...extra},body:JSON.stringify({jsonrpc:"2.0",id:"identifier-secret",method:"tools/list",params:{secret:"body-secret"}})});
}
test("actual loopback proxy preserves independent admission and omits private log content",{timeout:10000},async()=> {
 await topology("127.0.0.1",async(port,_backend,logs)=> {
  const a=await call(port,"198.51.100.1",{"x-forwarded-for":"spoof-secret","authorization":"Bearer header-secret"});assert.equal(a.status,200);
  assert.match(await a.text(),/data: /);
  const repeat=await call(port,"198.51.100.1");assert.equal(repeat.status,429);await repeat.text();
  const b=await call(port,"2001:db8::2");assert.equal(b.status,200);await b.text();
  assert.ok(logs.length>=3);
  for (const secret of ["query-secret","private","body-secret","identifier-secret","header-secret","spoof-secret","198.51.100.1","2001:db8::2"]) assert.ok(!logs.join("\n").includes(secret));
 });
});
test("default trust disabled collapses proxy clients into immediate peer budget",{timeout:10000},async()=> {
 await topology(undefined,async(port)=> {
  const a=await call(port,"198.51.100.1");assert.equal(a.status,200);await a.text();
  const b=await call(port,"198.51.100.2");assert.equal(b.status,429);await b.text();
 });
});
test("trusted proxy rejects malformed and extra forwarded chains",{timeout:10000},async()=> {
 await topology("127.0.0.1",async(port)=> {
  for(const client of ["garbage","198.51.100.1,198.51.100.2"]){const response=await call(port,client);assert.equal(response.status,400);await response.text();}
 });
});


test("proxy Host and body bounds remain enforced",{timeout:10000},async()=> {
 await topology("127.0.0.1",async(port,backend)=> {
  const host=await new Promise<number>((resolve,reject)=> { const outgoing=request({hostname:"127.0.0.1",port:backend,path:"/mcp",method:"POST",headers:{host:"attacker.example","x-forwarded-host":"localhost","content-type":"application/json"}},response=>{response.resume();response.on("end",()=>resolve(response.statusCode!));});outgoing.setTimeout(2000,()=>outgoing.destroy(new Error("Host probe timed out.")));outgoing.on("error",reject);outgoing.end("{}"); });assert.equal(host,403);
  const large=await fetch(`http://127.0.0.1:${port}/mcp`,{signal:AbortSignal.timeout(2000),method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({padding:"x".repeat(33000)})});assert.equal(large.status,413);await large.text();
 });
});
test("untrusted peer cannot bypass its budget with changing forwarded identities",{timeout:10000},async()=> {
 await topology("192.0.2.1",async(port)=> {
  const a=await call(port,"198.51.100.1");assert.equal(a.status,200);await a.text();
  const b=await call(port,"198.51.100.2");assert.equal(b.status,429);await b.text();
 });
});
test("proxy timeout retains admission until abort-ignoring index read settles",{timeout:10000},async()=> {
 let release!:()=>void; let entered!:()=>void;
 const started=new Promise<void>(resolve=>entered=resolve);
 const gate=new Promise<void>(resolve=>release=resolve);
 try { await topology("127.0.0.1",async(port)=> {
  const pending=fetch(`http://127.0.0.1:${port}/mcp`,{signal:AbortSignal.timeout(2000),method:"POST",headers:{"content-type":"application/json",accept:"application/json, text/event-stream"},body:JSON.stringify({jsonrpc:"2.0",id:1,method:"tools/call",params:{name:"resolve_place",arguments:{placeQuery:"Pune"}}})});
  void pending.catch(()=>undefined);
  try {
  await bounded(started,"tool callback entry");
  const timed=await pending; assert.equal(timed.status,504);await timed.text();
  const blocked=await call(port,"198.51.100.2");assert.equal(blocked.status,503);await blocked.text();
  release();
  // Wait for underlying handler completion, then admission can recover.
  let recovered=false;
  for(let attempt=0;attempt<20;attempt++){await new Promise(resolve=>setTimeout(resolve,10));const response=await call(port,"198.51.100.3");await response.text();if(response.status===200){recovered=true;break;} assert.equal(response.status,503);}
  assert.equal(recovered,true);
  } finally {release(); await pending.catch(()=>undefined);}
 },{maxConcurrentRequests:1,maxRequestsPerWindow:100,maxProtocolRequestsPerWindow:100,placeIndexLoader:async()=>{entered();await gate;return undefined;}},50); } finally {release();}
});


import { GeoNamesPlaceIndex } from "../../server/places/geonames";
test("client cancellation retains arbitrary abort-ignoring climate callback work", {timeout:10000}, async()=> {
 let release!:()=>void, entered!:()=>void;
 const gate=new Promise<void>(resolve=>release=resolve),started=new Promise<void>(resolve=>entered=resolve);
 const index=new GeoNamesPlaceIndex([[1259229,"Pune","Pune","",18.52,73.85,"IN","India",1000000,"Asia/Kolkata"]],"fixture");
 await topology("127.0.0.1",async(port)=> {
  const controller=new AbortController();
  const pending=fetch(`http://127.0.0.1:${port}/mcp`,{signal:AbortSignal.any([controller.signal,AbortSignal.timeout(2000)]),method:"POST",headers:{"content-type":"application/json",accept:"application/json, text/event-stream"},body:JSON.stringify({jsonrpc:"2.0",id:1,method:"tools/call",params:{name:"get_clear_sky_climatology",arguments:{placeId:"place:v1:geonames:1259229",month:10}}})}).catch(()=>undefined);
  try {
   await bounded(started,"tool callback entry");controller.abort();await pending;
   await new Promise(resolve=>setTimeout(resolve,20));
   const blocked=await call(port,"198.51.100.2");assert.equal(blocked.status,503);await blocked.text();
   release();
   let recovered=false;
   for(let attempt=0;attempt<20;attempt++){await new Promise(resolve=>setTimeout(resolve,10));const response=await call(port,"198.51.100.3");await response.text();if(response.status===200){recovered=true;break;} assert.equal(response.status,503);}
   assert.equal(recovered,true);
  } finally {release();controller.abort();}
 },{toolMode:"full",placeIndex:index,maxConcurrentRequests:1,maxRequestsPerWindow:100,maxProtocolRequestsPerWindow:100,climateProvider:{getClimatology:async()=> {entered();await gate;throw Error("fixture failure");}}});
});
