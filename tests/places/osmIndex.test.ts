import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile, truncate } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createHash } from "node:crypto";
import { loadOsmCandidateIndex } from "../../server/places/osmCandidates";
import { importOsmJson } from "../../server/places/importOsm";

test("pilot loader enforces configured byte and checksum bounds", async () => {
  const folder = await mkdtemp(join(tmpdir(), "nightsky-osm-bounds-"));
  try {
    const path = join(folder, "index.json");
    const payload = JSON.stringify(importOsmJson({ elements: [] }, { vintage: "fixture", coverage: "fixture" }));
    await writeFile(path, payload);
    await assert.rejects(loadOsmCandidateIndex(path, { maxArtifactBytes: 10 }), /exceeds/);
    await assert.rejects(loadOsmCandidateIndex(path, { expectedSha256: "0".repeat(64) }), /checksum/);
    assert.ok(await loadOsmCandidateIndex(path, { maxArtifactBytes: 2048, expectedSha256: createHash("sha256").update(payload).digest("hex") }));
  } finally { await rm(folder, { recursive: true, force: true }); }
});

test("loads a valid local candidate index with its coverage and vintage", async () => {
  const folder = await mkdtemp(join(tmpdir(), "nightsky-osm-"));
  try {
    const path = join(folder, "index.json");
    const index = importOsmJson({ elements: [{ type: "node", id: 1, lat: 18.5, lon: 73.8, tags: { leisure: "park", name: "Test Park" } }] }, { vintage: "2026-10-09", coverage: "Fixture region" });
    await writeFile(path, JSON.stringify(index));
    const loaded = await loadOsmCandidateIndex(path);
    assert.equal(loaded?.vintage, "2026-10-09");
    assert.equal(loaded?.candidates[0]?.name, "Test Park");
    assert.ok(Object.isFrozen(loaded));
    assert.ok(Object.isFrozen(loaded?.candidates));
    assert.ok(Object.isFrozen(loaded?.candidates[0]));
  } finally {
    await rm(folder, { recursive: true, force: true });
  }
});

test("returns no local index when the optional configured file is absent", async () => {
  const folder = await mkdtemp(join(tmpdir(), "nightsky-osm-missing-"));
  try {
    assert.equal(await loadOsmCandidateIndex(join(folder, "missing.json")), undefined);
  } finally {
    await rm(folder, { recursive: true, force: true });
  }
});

test("rejects oversized artifacts before reading them and preserves the no-database boundary", async () => {
  const folder = await mkdtemp(join(tmpdir(), "nightsky-osm-large-"));
  try {
    const path = join(folder, "index.json");
    await writeFile(path, "");
    await truncate(path, 512 * 1024 * 1024 + 1);
    await assert.rejects(loadOsmCandidateIndex(path), /smaller measured flat-file artifact within the no-database host budget/);
  } finally {
    await rm(folder, { recursive: true, force: true });
  }
});

test("validates candidate coordinates on artifact load", async () => {
  const folder = await mkdtemp(join(tmpdir(), "nightsky-osm-invalid-"));
  try {
    const path = join(folder, "index.json");
    const index = importOsmJson({ elements: [{ type: "node", id: 1, lat: 18.5, lon: 73.8, tags: { leisure: "park", name: "Test Park" } }] }, { vintage: "2026-10-09", coverage: "Fixture region" });
    index.candidates[0]!.latitude = 91;
    await writeFile(path, JSON.stringify(index));
    await assert.rejects(loadOsmCandidateIndex(path));
  } finally {
    await rm(folder, { recursive: true, force: true });
  }
});
