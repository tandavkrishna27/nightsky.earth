import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";
import test from "node:test";
import { candidateEvidenceIsValid, capacityCandidatePlaceId, percentiles } from "../../scripts/verify-capacity";

test("capacity can measure a reviewed candidate region separately from the historical region", () => {
    assert.equal(capacityCandidatePlaceId("place:v1:geonames:1266425"), "place:v1:geonames:1266425");
    assert.equal(capacityCandidatePlaceId("place:v1:geonames:1266425", "place:v1:geonames:1277333"), "place:v1:geonames:1277333");
    for (const value of ["", "place:v1:osm:way:1", "https://example.test/", "place:v1:geonames:0", "place:v1:geonames:99999999999999999999999999"]) {
        assert.throws(() => capacityCandidatePlaceId("place:v1:geonames:1266425", value));
    }
});
test("capacity report uses nearest-rank p50/p95 without mutating samples", () => {
    const samples = [20, 1, 3, 2];
    assert.deepEqual(percentiles(samples), { p50Ms: 2, p95Ms: 20 });
    assert.deepEqual(samples, [20, 1, 3, 2]);
    assert.throws(() => percentiles([]));
    assert.throws(() => percentiles([Infinity]));
});
test("configured candidate artifact cannot pass with unavailable or implicit empty coverage", () => {
    const result = { availability: { status: "not-covered", reason: "No nearby records" }, sources: [{ name: "OpenStreetMap contributors", url: "https://www.openstreetmap.org/copyright", attribution: "OSM", dataClass: "catalog", vintage: "2026-10-13" }], caveats: [], candidates: [], sortBasis: "distance-then-source-completeness", coverage: "reviewed extract" };
    assert.equal(candidateEvidenceIsValid(result), false);
    assert.equal(candidateEvidenceIsValid(result, true), true);
    assert.equal(candidateEvidenceIsValid({ ...result, availability: { status: "unavailable", reason: "Missing file" } }, true), false);
    assert.equal(candidateEvidenceIsValid({ ...result, sources: result.sources.map(source => ({ ...source, vintage: undefined })) }, true), false);
});

test("invalid candidate measurement configuration exits without leaving server resources alive", () => {
    const result = spawnSync(process.execPath, ["--import", "tsx", "scripts/verify-capacity.ts", "--offline"], {
        cwd: process.cwd(), encoding: "utf8", timeout: 15000,
        env: { ...process.env, NIGHTSKY_GEONAMES_INDEX: "unused-index", NIGHTSKY_CLIMATE_ARTIFACT: "unused-artifact", NIGHTSKY_CLIMATE_SHA256: "a".repeat(64), NIGHTSKY_CAPACITY_CANDIDATE_PLACE_ID: "invalid" },
    });
    assert.equal(result.error, undefined);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Invalid candidate measurement named-place ID/);
});
