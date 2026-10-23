import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:net";
import { setTimeout as delay } from "node:timers/promises";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { gzipSync } from "node:zlib";

// The city is fictional; meteor facts still load from the real reviewed catalog.
// Explicit fixture selection makes this check independent of ignored local data.
const directory = await mkdtemp(join(tmpdir(), "nightsky-plugin-runtime-"));
const cityIndex = join(directory, "cities.gz");

async function verifyMode(mode) {
const probe=createServer().listen(0,"127.0.0.1");
await once(probe,"listening");
const port=probe.address().port;
await new Promise(done=>probe.close(done));
const environment={...process.env,NIGHTSKY_GEONAMES_INDEX:cityIndex,NIGHTSKY_MCP_TOOL_MODE:mode,NODE_ENV:"production",HOST:"127.0.0.1",PORT:String(port),NIGHTSKY_MCP_ALLOWED_HOSTS:"127.0.0.1"};
const child=spawn(process.execPath,["dist/plugin.js"],{env:environment,stdio:["ignore","ignore","ignore"]});
let spawnFailed=false;child.on("error",()=>{spawnFailed=true;});
const base=`http://127.0.0.1:${port}`;
try{
  let health;
  for(let attempt=0;attempt<100;attempt++){
    if(spawnFailed||child.exitCode!==null)throw Error("Built plugin exited during startup.");
    try{health=await fetch(`${base}/health`,{signal:AbortSignal.timeout(500)});if(health.ok)break;}catch{/* bounded startup polling */}
    await delay(100);
  }
  assert.ok(health?.ok,"Built plugin did not become live within the startup bound.");
  const status=await health.json();assert.equal(status.service,"nightsky");assert.equal(status.status,"ok");assert.equal(status.probe,"liveness");
  assert.equal((await fetch(`${base}/api/news`,{signal:AbortSignal.timeout(5000)})).status,404);
  assert.equal((await fetch(`${base}/`,{signal:AbortSignal.timeout(5000)})).status,404);
  const rpc=async(id,method,params)=>{
    const response=await fetch(`${base}/mcp`,{method:"POST",headers:{"content-type":"application/json",accept:"application/json, text/event-stream","mcp-protocol-version":"2025-11-25"},body:JSON.stringify({jsonrpc:"2.0",id,method,params}),signal:AbortSignal.timeout(5000)});
    assert.equal(response.status,200);const body=await response.text();const event=body.split("\n").find(line=>line.startsWith("data: "));const payload=JSON.parse(event?event.slice(6):body);assert.equal(payload.error,undefined);return payload.result;
  };
  const initialized=await rpc(1,"initialize",{protocolVersion:"2025-11-25",capabilities:{},clientInfo:{name:"standalone-plugin-runtime-check",version:"1"}});assert.equal(initialized.serverInfo.name,"nightsky-earth");
  const listed=await rpc(2,"tools/list",{});assert.equal(listed.tools.length,mode === "full" ? 13 : 1);
  if (mode === "full") {
  for(const name of ["resolve_place","get_clear_sky_climatology","plan_observing_session","compare_observing_options"])assert.ok(listed.tools.some(tool=>tool.name===name));
  assert.ok(!listed.tools.some(tool=>tool.name==="recommend_specialist_tools"));
  const meteor=await rpc(4,"tools/call",{name:"search_sky_events",arguments:{placeId:"place:v1:geonames:9999991",window:{startUtc:"2027-11-20T00:00:00Z",endUtc:"2027-11-21T00:00:00Z",timeZone:"Asia/Kolkata"},eventTypes:["meteor-shower"]}});
  assert.equal(meteor.isError,undefined,JSON.stringify(meteor));assert.equal(meteor.structuredContent.availability.status,"partial");
  const leonids=meteor.structuredContent.events.find(event=>event.name==="Leonids");
  assert.equal(leonids?.peakUtc,"2027-11-20T04:38:00Z");assert.equal(leonids?.localVisibility,"not-evaluated");
  assert.equal(leonids?.source.url,"https://ntrs.nasa.gov/api/citations/20260009360/downloads/LEO_Forecast_2027.pdf");
  } else {
    assert.deepEqual(listed.tools.map(tool=>tool.name),["resolve_place"]);
  }
  const oversized=await fetch(`${base}/mcp`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({padding:"x".repeat(33*1024)}),signal:AbortSignal.timeout(5000)});assert.equal(oversized.status,413);assert.deepEqual(await oversized.json(),{message:"Invalid request."});
  console.log(`Standalone plugin ${mode} runtime verified: health, ${listed.tools.length} MCP tools, body limit and absent website/news routes. Workload makes no external provider requests.`);
}finally{
  if(!spawnFailed&&child.exitCode===null){const exited=once(child,"exit");child.kill();await Promise.race([exited,delay(3000)]);if(child.exitCode===null&&child.signalCode===null)child.kill("SIGKILL");}
}

}
try {
  await writeFile(cityIndex, gzipSync(JSON.stringify({schemaVersion:2,vintage:"fictional-plugin-runtime-city",generatedAt:"2026-10-16T00:00:00Z",cities:[[9999991,"Fictional India Town","Fictional India Town","",18.52,73.85,"IN","India",1,"Asia/Kolkata"]]})));
  await verifyMode("full");
  await verifyMode("resolver-only");
} finally {
  await rm(directory,{recursive:true,force:true});
}
