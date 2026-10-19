import assert from 'node:assert/strict';
import test from 'node:test';
import {createServer} from 'node:http';
import {once} from 'node:events';
import * as plugin from '../../server/plugin';
import {RESULT_CARD_URI} from '../../server/mcp/resultCard';

test('planning card startup flag defaults off and accepts only explicit boolean strings',()=>{
 const parse=plugin.pluginPlanningCardConfiguration;
 assert.equal(typeof parse,'function');
 assert.equal(parse({}),false);
 assert.equal(parse({NIGHTSKY_PLANNING_CARD_ENABLED:'false'}),false);
 assert.equal(parse({NIGHTSKY_PLANNING_CARD_ENABLED:'true'}),true);
 for(const value of ['', 'TRUE','False','yes','1',' true','false\n'])assert.throws(()=>parse({NIGHTSKY_PLANNING_CARD_ENABLED:value}),/planning card/i);
});

test('configured API and legacy runtimes advertise card only when enabled and full',async()=>{
 const saved=Object.fromEntries(Object.entries(process.env).filter(([k])=>k.startsWith('NIGHTSKY_')));
 try{
  for(const k of Object.keys(process.env))if(k.startsWith('NIGHTSKY_'))delete process.env[k];
  let external=0;
  for(const mode of ['api','legacy'])for(const enabled of [undefined,'false','true'])for(const toolMode of ['full','resolver-only']){
   process.env.NIGHTSKY_DISCOVERY_MODE=mode;process.env.NIGHTSKY_MCP_TOOL_MODE=toolMode;
   if(enabled===undefined)delete process.env.NIGHTSKY_PLANNING_CARD_ENABLED;else process.env.NIGHTSKY_PLANNING_CARD_ENABLED=enabled;
   const app=await plugin.createConfiguredNightSkyPluginApp({log:()=>{},fetcher:async()=>{external++;throw Error('No external transport');}});
   const server=createServer(app).listen(0,'127.0.0.1');await once(server,'listening');
   try{
    const address=server.address();assert.ok(address&&typeof address!=='string');let id=0;
    const rpc=async(method:string,params:unknown)=>{
     const res=await fetch(`http://127.0.0.1:${address.port}/mcp`,{method:'POST',headers:{'content-type':'application/json',accept:'application/json, text/event-stream','mcp-protocol-version':'2025-11-25'},body:JSON.stringify({jsonrpc:'2.0',id:++id,method,params}),signal:AbortSignal.timeout(5000)});
     const body=await res.text(),event=body.split('\n').find(l=>l.startsWith('data: '));return JSON.parse(event?event.slice(6):body);
    };
    const list=await rpc('tools/list',{}),planner=list.result.tools.find((t:any)=>t.name==='plan_observing_session');
    const resource=await rpc('resources/read',{uri:RESULT_CARD_URI});
    if(enabled==='true'&&toolMode==='full'){assert.equal(planner._meta.ui.resourceUri,RESULT_CARD_URI);assert.equal(resource.result.contents[0].mimeType,'text/html;profile=mcp-app');}
    else{assert.equal(planner?._meta,undefined);assert.ok(resource.error);}
   }finally{server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));await plugin.closeConfiguredNightSkyPluginApp(app);}
  }
  assert.equal(external,0);
  process.env.NIGHTSKY_PLANNING_CARD_ENABLED='invalid';process.env.NIGHTSKY_WEATHER_PROVIDERS='invalid';
  await assert.rejects(plugin.createConfiguredNightSkyPluginApp(),/planning card/i);
 }finally{for(const k of Object.keys(process.env))if(k.startsWith('NIGHTSKY_'))delete process.env[k];Object.assign(process.env,saved);}
});
