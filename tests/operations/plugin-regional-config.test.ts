import assert from "node:assert/strict";
import test from "node:test";
import { pluginRegionalConfiguration, createNightSkyPluginApp } from "../../server/plugin";
import { createConfiguredNightSkyPluginApp, closeConfiguredNightSkyPluginApp } from "../../server/plugin";
import { createServer } from "node:http";
import { once } from "node:events";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createPersistentQuota } from "../../server/providers/quotaState";
import { PROVIDER_QUOTA_POLICIES } from "../../server/providers/weather/configuration";

test("regional operator configuration requires a pinned pair and rejects ambiguous flat configuration", () => {
  const sha = "a".repeat(64);
  assert.equal(pluginRegionalConfiguration({}), undefined);
  assert.deepEqual(pluginRegionalConfiguration({ NIGHTSKY_OSM_REGIONAL_MANIFEST: "local/manifest.json", NIGHTSKY_OSM_REGIONAL_SHA256: sha }), { path: "local/manifest.json", expectedSha256: sha });
  for (const environment of [
    { NIGHTSKY_OSM_REGIONAL_MANIFEST: "local/manifest.json" },
    { NIGHTSKY_OSM_REGIONAL_SHA256: sha },
    { NIGHTSKY_OSM_REGIONAL_MANIFEST: " ", NIGHTSKY_OSM_REGIONAL_SHA256: sha },
    { NIGHTSKY_OSM_REGIONAL_MANIFEST: "private\npath", NIGHTSKY_OSM_REGIONAL_SHA256: sha },
    { NIGHTSKY_OSM_REGIONAL_MANIFEST: "local/manifest.json", NIGHTSKY_OSM_REGIONAL_SHA256: "bad" },
    { NIGHTSKY_OSM_REGIONAL_MANIFEST: "local/manifest.json", NIGHTSKY_OSM_REGIONAL_SHA256: sha, NIGHTSKY_OSM_CANDIDATE_INDEX: "flat.json" },
  ]) assert.throws(() => pluginRegionalConfiguration(environment), /Invalid regional candidate configuration/);
});

test("standalone app explicitly enables narrow proxy trust and rejects broad configuration", () => {
  assert.equal(createNightSkyPluginApp().get("trust proxy"), false);
  const app = createNightSkyPluginApp({ trustedProxyAddresses: "127.0.0.1" });
  const trust = app.get("trust proxy fn") as (address: string, hop: number) => boolean;
  assert.equal(trust("127.0.0.1", 0), true); assert.equal(trust("127.0.0.1", 1), false);
  assert.throws(() => createNightSkyPluginApp({ trustedProxyAddresses: "0.0.0.0/0" }), /CIDR/);
});

test("configured API runtime requires both exact geometry yes flags before fake geometry transport", async () => {
  const saved = Object.fromEntries(Object.entries(process.env).filter(([key]) => key.startsWith('NIGHTSKY_')));
  const root = await mkdtemp(join(tmpdir(), 'plugin-geometry-gates-'));
  try {
    for (const key of Object.keys(process.env)) if (key.startsWith('NIGHTSKY_')) delete process.env[key];
    for (const [index, flags] of [[], ['yes'], [undefined, 'yes'], ['true', 'yes'], ['yes', 'yes']].entries()) {
      process.env.NIGHTSKY_DISCOVERY_MODE = 'api';
      process.env.NIGHTSKY_GEOAPIFY_API_KEY = 'offline-fixture';
      process.env.NIGHTSKY_QUOTA_STATE_PATH = join(root, `quota-${index}.json`);
      const fixtureQuota = await createPersistentQuota({ path: process.env.NIGHTSKY_QUOTA_STATE_PATH, now: Date.now, policies: PROVIDER_QUOTA_POLICIES });
      await fixtureQuota.initializeVerifiedBudget({ verifiedUnusedBudget: true, evidence: 'Synthetic temporary test ledger; all provider transports are fake.' });
      await fixtureQuota.close();
      delete process.env.NIGHTSKY_GEOMETRY_ENABLED; delete process.env.NIGHTSKY_GEOMETRY_SOURCE_ACCEPTED;
      if (flags[0]) process.env.NIGHTSKY_GEOMETRY_ENABLED = flags[0];
      if (flags[1]) process.env.NIGHTSKY_GEOMETRY_SOURCE_ACCEPTED = flags[1];
      const paths: string[] = [];
      const app = await createConfiguredNightSkyPluginApp({ log: () => {}, fetcher: async request => {
        const url = new URL(String(request)); paths.push(url.pathname);
        if (url.pathname === '/v1/geocode/search') return new Response(JSON.stringify({ features: ['include', 'exclude'].map(id => ({ properties: { place_id: id, name: id, result_type: 'state', country_code: 'in' }, geometry: { type: 'Point', coordinates: [3,3] } })) }));
        if (url.pathname === '/v2/place-details') {
          const id = url.searchParams.get('id'); const n = id === 'include' ? 5 : 2;
          return new Response(JSON.stringify({ type: 'FeatureCollection', features: [{ type: 'Feature', properties: { feature_type: 'details', place_id: id }, geometry: { type: 'Polygon', coordinates: [[[0,0],[n,0],[n,n],[0,n],[0,0]]] } }] }));
        }
        assert.equal(url.pathname, '/v2/places');
        return new Response(JSON.stringify({ features: [{ properties: { place_id: 'park', name: 'Park', categories: ['leisure.park'] }, geometry: { type: 'Point', coordinates: [3,3] } }] }));
      } });
      const server = createServer(app).listen(0, '127.0.0.1'); await once(server, 'listening');
      try {
        const address = server.address(); assert.ok(address && typeof address !== 'string');
        let id = 0;
        const rpc = async (name: string, args: unknown) => {
          const response = await fetch(`http://127.0.0.1:${address.port}/mcp`, { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream', 'mcp-protocol-version': '2025-11-25' }, body: JSON.stringify({ jsonrpc: '2.0', id: ++id, method: 'tools/call', params: { name, arguments: args } }) });
          assert.equal(response.status, 200);
          const body = await response.text(); const event = body.split('\n').find(line => line.startsWith('data: '));
          const result = JSON.parse(event ? event.slice(6) : body).result;
          assert.equal(result.isError, undefined, JSON.stringify(result)); return result.structuredContent;
        };
        const resolved = await rpc('resolve_observing_region', { regionQuery: 'fixture', adminLevel: 1 });
        assert.equal(resolved.matches.length, 2);
        const refs = resolved.matches.map((r: {regionId: string; sourceRevision: string}) => ({regionId:r.regionId,sourceRevision:r.sourceRevision}));
        const result = await rpc('search_observing_locations', { scope: { includeRegionIds: [refs[0].regionId], excludeRegionIds: [refs[1].regionId], regionSelections: refs }, limit: 5 });
        if (flags[0] === 'yes' && flags[1] === 'yes') {
          assert.deepEqual(paths, ['/v1/geocode/search', '/v2/place-details', '/v2/place-details', '/v2/places']);
          assert.deepEqual(result.candidates.map((c: {name:string}) => c.name), ['Park']);
        } else { assert.equal(result.availability.status, 'unsupported'); assert.deepEqual(paths, ['/v1/geocode/search']); }
      } finally {
        server.closeAllConnections(); await new Promise<void>(done => server.close(() => done()));
        await closeConfiguredNightSkyPluginApp(app);
      }
    }
  } finally {
    for (const key of Object.keys(process.env)) if (key.startsWith('NIGHTSKY_')) delete process.env[key];
    Object.assign(process.env, saved);
    await rm(root, { recursive: true, force: true });
  }
});
