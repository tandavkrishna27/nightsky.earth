import assert from "node:assert/strict";
import test from "node:test";
import { createSourceBudget, snapshotIsFresh, selectDemonstrationPlace } from "../../scripts/verify-live-planning";

test("live smoke rejects expired or unverifiable snapshots", () => {
  const now = Date.parse("2026-10-13T07:00:00Z");
  assert.equal(snapshotIsFresh({headers:{status:200, expires:"Tue, 13 Oct 2026 07:01:00 GMT",lastModified:"Tue, 13 Oct 2026 06:00:00 GMT"}},now), true);
  assert.equal(snapshotIsFresh({headers:{status:200, expires:"Tue, 13 Oct 2026 07:00:00 GMT",lastModified:"Tue, 13 Oct 2026 06:00:00 GMT"}},now), false);
  assert.equal(snapshotIsFresh({headers:{status:200, expires:"invalid"}},now), false);
});

test("source budget permits one call per point and at most four source calls", () => {
  const budget = createSourceBudget();
  budget.claim("a");
  assert.throws(() => budget.claim("a"), /budget/);
  budget.claim("b"); budget.claim("c"); budget.claim("d");
  assert.throws(() => budget.claim("e"), /budget/);
  assert.equal(budget.count, 4);
});
test("explicit demonstration selection chooses exact Munnar among fuzzy alternatives", () => {
  const place = {placeId:"place:v1:geonames:1262463", displayName:"Munnar, India", timeZone:"Asia/Kolkata"};
  assert.equal(selectDemonstrationPlace("Munnar, India",[place,{placeId:"other",displayName:"Manor, India",timeZone:"Asia/Kolkata"}]),place);
  assert.throws(() => selectDemonstrationPlace("Munnar, India",[{placeId:"other",displayName:"Manor, India",timeZone:"Asia/Kolkata"}]), /selection/);
});

test("site selection defaults to three demos and allows only explicit known subsets", async () => {
  const { selectedSites } = await import("../../scripts/verify-live-planning");
  assert.deepEqual(selectedSites([]), ["kodaikanal", "munnar", "hanle"]);
  assert.deepEqual(selectedSites(["--sites=hanle"]), ["hanle"]);
  assert.throws(() => selectedSites(["--sites=unknown"]), /sites/);
  assert.throws(() => selectedSites(["--sites=hanle,hanle"]), /sites/);
});

test("public demo selection verifies identity and timezone rather than first fuzzy match", () => {
  const hanle = {placeId:"place:v1:geonames:1270426",displayName:"Hanle, India",timeZone:"Asia/Kolkata"};
  assert.equal(selectDemonstrationPlace("Hanle, India",[{...hanle,placeId:"other"},hanle]),hanle);
  assert.throws(() => selectDemonstrationPlace("Hanle, India",[{...hanle,timeZone:"UTC"}]), /selection/);
  assert.throws(() => selectDemonstrationPlace("Kodaikanal, India",[{...hanle,displayName:"Other, India"}]), /selection/);
});


test("snapshot capture rejects oversized decoded bodies and cancels source", async () => {
  const { captureSnapshotBody } = await import("../../scripts/verify-live-planning");
  let cancelled = false;
  const response = new Response(new ReadableStream({pull(controller) {controller.enqueue(new Uint8Array(6));},cancel() {cancelled=true;}}));
  await assert.rejects(captureSnapshotBody(response,{maxBytes:5,timeoutMs:100}), /byte limit/);
  assert.equal(cancelled,true);
});

test("snapshot capture bounds stalled body reads and cancels source", async () => {
  const { captureSnapshotBody } = await import("../../scripts/verify-live-planning");
  let cancelled=false;
  const response=new Response(new ReadableStream({cancel(){cancelled=true;}}));
  await assert.rejects(captureSnapshotBody(response,{maxBytes:5,timeoutMs:10}), /deadline/);
  assert.equal(cancelled,true);
});

test("snapshot capture preserves the source body bytes for digest and parsing", async () => {
  const { captureSnapshotBody } = await import("../../scripts/verify-live-planning");
  const raw='{"source":"MET Norway","unit":"°C"}\n';
  assert.equal(await captureSnapshotBody(new Response(raw),{maxBytes:100,timeoutMs:100}),raw);
});
