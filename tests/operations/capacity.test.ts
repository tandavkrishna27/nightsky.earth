import assert from "node:assert/strict";
import test from "node:test";
import { candidateEvidenceIsValid, percentiles } from "../../scripts/verify-capacity";
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
