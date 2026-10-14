import assert from "node:assert/strict";
import test from "node:test";
import { pluginRegionalConfiguration, createNightSkyPluginApp } from "../../server/plugin";

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
