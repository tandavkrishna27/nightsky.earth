/** Built-runtime check: synthetic provider responses only; no external requests. */
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { createConfiguredNightSkyPluginApp } from '../dist/plugin.js';

const saved = { ...process.env };
let server;
try {
  for (const key of Object.keys(process.env)) if (key.startsWith('NIGHTSKY_') || key === 'MET_NORWAY_USER_AGENT') delete process.env[key];
  Object.assign(process.env, {
    NIGHTSKY_DISCOVERY_MODE: 'api', NIGHTSKY_MCP_TOOL_MODE: 'full',
    NIGHTSKY_GEONAMES_USERNAME: 'offline-fixture', NIGHTSKY_GEOAPIFY_API_KEY: 'offline-fixture-key',
    NIGHTSKY_MCP_ALLOWED_HOSTS: '127.0.0.1',
  });
  let calls = 0;
  const app = await createConfiguredNightSkyPluginApp({ log: () => {}, fetcher: async input => {
    calls++;
    const url = new URL(String(input));
    assert.equal(url.hostname, 'secure.geonames.org', 'Unexpected synthetic upstream');
    if (url.pathname === '/searchJSON') return Response.json({ geonames: [{ geonameId: 9999991, name: 'Fixture Sky Town', lat: '18.52', lng: '73.85', countryCode: 'IN', countryName: 'India', fcl: 'P', fcode: 'PPL', timezone: { timeZoneId: 'Asia/Kolkata' } }] });
    if (url.pathname === '/timezoneJSON') return Response.json({ timezoneId: 'Asia/Kolkata', lat: 18.52, lng: 73.85 });
    throw Error('Unexpected synthetic endpoint');
  }});
  server = createServer(app).listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  let id = 0;
  const rpc = async (method, params) => {
    const response = await fetch(`${base}/mcp`, {method:'POST',headers:{'content-type':'application/json',accept:'application/json, text/event-stream','mcp-protocol-version':'2025-11-25'},body:JSON.stringify({jsonrpc:'2.0',id:++id,method,params}),signal:AbortSignal.timeout(10000)});
    assert.equal(response.status,200);
    const raw=await response.text(), event=raw.split('\n').find(line=>line.startsWith('data: '));
    const body=JSON.parse(event?event.slice(6):raw);
    assert.equal(body.error,undefined,JSON.stringify(body));
    assert.equal(body.result.isError,undefined,JSON.stringify(body.result));
    return body.result;
  };
  await rpc('initialize',{protocolVersion:'2025-11-25',capabilities:{},clientInfo:{name:'offline-api-runtime',version:'1'}});
  const resolved=await rpc('tools/call',{name:'resolve_place',arguments:{placeQuery:'Fixture Sky Town'}});
  const point=resolved.structuredContent.matches[0];
  assert.match(point.placeId,/^place:v1:api:/);
  assert.match(point.sourceRevision,/^[a-f0-9]{64}$/);
  const astronomy=await rpc('tools/call',{name:'get_astronomy_window',arguments:{placeId:point.placeId,sourceRevision:point.sourceRevision,displayTimeZone:'Asia/Kolkata',window:{startUtc:'2026-10-17T14:30:00Z',endUtc:'2026-10-17T18:30:00Z',timeZone:'Asia/Kolkata'}}});
  assert.notEqual(astronomy.structuredContent.availability.status,'unavailable');
  assert.ok(calls>=1 && calls<=2);
  console.log('SYNTHETIC: built API-mode resolution and astronomy verified without local geography files or external requests. Not live-source acceptance.');
} finally {
  if(server){server.closeAllConnections();await new Promise(done=>server.close(done));}
  for(const key of Object.keys(process.env))if(!(key in saved))delete process.env[key];
  Object.assign(process.env,saved);
}
