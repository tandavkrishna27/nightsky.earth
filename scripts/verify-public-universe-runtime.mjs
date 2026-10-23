/** Offline compiled MCP inventory/admission check; forbids all external provider requests. */
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { createConfiguredNightSkyPluginApp, closeConfiguredNightSkyPluginApp } from '../dist/plugin.js';
for (const name of Object.keys(process.env)) if (name.startsWith('NIGHTSKY_')) delete process.env[name];
process.env.NIGHTSKY_SKY_PROVIDERS='publicuniverse';
process.env.NIGHTSKY_SKY_ADMITTED_PROVIDERS='';
let attempts=0;
const app=await createConfiguredNightSkyPluginApp({log:()=>{},fetcher:async()=>{attempts++;throw Error('External request forbidden');}});
const server=createServer(app); server.listen(0,'127.0.0.1'); await once(server,'listening');
try {
 const endpoint='http://127.0.0.1:'+server.address().port+'/mcp'; let id=0;
 const rpc=async(method,params={})=>{const response=await fetch(endpoint,{method:'POST',headers:{'content-type':'application/json',accept:'application/json, text/event-stream','mcp-protocol-version':'2025-11-25'},body:JSON.stringify({jsonrpc:'2.0',id:++id,method,params})});const line=(await response.text()).split('\n').find(value=>value.startsWith('data: '));assert.ok(line);return JSON.parse(line.slice(6));};
 const tools=(await rpc('tools/list')).result.tools;
 assert.equal(tools.length,17);
 for(const name of ['search_reference_objects','get_reference_details','discover_observing_targets','get_catalogue_target_windows'])assert.ok(tools.some(tool=>tool.name===name));
 const call=await rpc('tools/call',{name:'search_reference_objects',arguments:{domain:'starter-targets',query:'Sirius'}});
 assert.equal(call.result.structuredContent.status,'unavailable');assert.equal(attempts,0);
 console.log(JSON.stringify({synthetic:true,compiled:true,tools:tools.length,optionalPublicUniverseTools:4,unadmittedStatus:call.result.structuredContent.status,externalAttempts:attempts,nativeAcceptance:false}));
} finally {await new Promise(resolve=>server.close(resolve));await closeConfiguredNightSkyPluginApp(app);}
