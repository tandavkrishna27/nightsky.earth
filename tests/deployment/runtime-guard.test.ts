import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
const path='ops/hetzner/runtime-guard.mjs';
function run(extra:Record<string,string>={},code="try { await fetch('https://example.invalid'); process.exit(9) } catch { console.log('denied') }") {
 const env=Object.fromEntries(Object.entries(process.env).filter(([key])=>!key.startsWith('NIGHTSKY_')));
 return spawnSync(process.execPath,['--import',`./${path}`,'--input-type=module','-e',code],{env:{...env,NODE_ENV:'production',HOST:'0.0.0.0',PORT:'5000',NIGHTSKY_DEPLOYMENT_ENV:'staging',NIGHTSKY_DISCOVERY_MODE:'api',NIGHTSKY_MCP_ALLOWED_HOSTS:'mcp-staging.nightsky.earth,localhost,127.0.0.1',NIGHTSKY_MCP_TRUSTED_PROXIES:'172.30.81.1',...extra},encoding:'utf8'});
}
test('hosted staging blocks fetch before plugin startup without leaking credentials',()=>{
 const r=run();assert.equal(r.status,0,r.stderr);assert.match(r.stdout,/denied/);
 for(const extra of [{NIGHTSKY_GEOAPIFY_API_KEY:'secret-marker'},{NIGHTSKY_QUOTA_STATE_PATH:'/state/quota.json'},{NIGHTSKY_WEATHER_ADMITTED_PROVIDERS:'weatherapi'}]) {
  const r=run(extra);assert.notEqual(r.status,0);assert.doesNotMatch(r.stderr,/secret-marker/);
 }
});
test('hosted guard rejects implicit legacy mode, wrong proxy, artifacts, scraping and historical acquisition',()=>{
 for(const extra of [{NIGHTSKY_DISCOVERY_MODE:'legacy'},{NIGHTSKY_MCP_TRUSTED_PROXIES:'0.0.0.0/0'},{NIGHTSKY_OSM_CANDIDATE_INDEX:'/tmp/data'},{NIGHTSKY_LIGHT_POLLUTION_BROWSER_ENABLED:'true'},{NIGHTSKY_API_HISTORY_ADMISSION:'{}'},{NIGHTSKY_DEPLOYMENT_ENV:'typo'}]) assert.notEqual(run(extra).status,0);
});
test('production guard requires private persistent paths and exact origin',()=>{
 const base={NIGHTSKY_DEPLOYMENT_ENV:'production',NIGHTSKY_MCP_ALLOWED_HOSTS:'mcp.nightsky.earth,localhost,127.0.0.1',NIGHTSKY_MCP_TRUSTED_PROXIES:'172.30.80.1'};
 assert.equal(run({...base,NIGHTSKY_QUOTA_STATE_PATH:'/state/providers.json'},"console.log('valid production; no network attempted')").status,0);
 for(const extra of [{NIGHTSKY_QUOTA_STATE_PATH:'/tmp/quota'},{NIGHTSKY_QUOTA_STATE_PATH:'/state/../tmp/quota'},{NIGHTSKY_MCP_ALLOWED_HOSTS:'evil.example'},{NIGHTSKY_SKY_QUOTA_STATE_PATH:'/state/same',NIGHTSKY_QUOTA_STATE_PATH:'/state/same'}]) assert.notEqual(run({...base,...extra}).status,0);
 const r=run({...base,NIGHTSKY_DEPLOYMENT_ENV:'staging'});assert.notEqual(r.status,0);
});
