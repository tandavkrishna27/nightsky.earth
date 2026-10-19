// Container-local, provider-free readiness: liveness + MCP registry, no tools/call.
const base='http://127.0.0.1:5000';
const headers={'Content-Type':'application/json',Accept:'application/json, text/event-stream'};
async function request(path,body){
 const response=await fetch(base+path,{method:body?'POST':'GET',headers,body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(5000)});
 if(!response.ok)throw Error('Local protocol probe failed.');
 const text=await response.text();if(text.length>1024*1024)throw Error('Oversized local protocol result.');
 const data=JSON.parse(text.startsWith('event:')||text.startsWith('data:')?text.split('\n').find(line=>line.startsWith('data:')).slice(5).trim():text);
 if(data.error)throw Error('Local protocol returned an error.');return data;
}
try{
 const health=await request('/health');if(health.service!=='nightsky'||health.status!=='ok')throw Error();
 const init=await request('/mcp',{jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:'2025-03-26',capabilities:{},clientInfo:{name:'nightsky-deployment-probe',version:'1'}}});
 if(!init.result?.serverInfo)throw Error();
 const list=await request('/mcp',{jsonrpc:'2.0',id:2,method:'tools/list',params:{}});
 if(!list.result?.tools?.some(tool=>tool.name==='resolve_place')||!list.result.tools.some(tool=>tool.name==='plan_observing_session'))throw Error();
 console.log('NightSky local health and MCP registry probe passed; no tools called.');
}catch{console.error('NightSky local health/MCP probe failed.');process.exitCode=1;}
