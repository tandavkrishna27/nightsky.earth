import assert from "node:assert/strict";
import test from "node:test";
import * as visibility from "../../server/events/intervalVisibility";

test("conjunction geometry samples include both endpoints and reject oversized windows", () => {
  assert.equal(typeof visibility.sampleConjunctionWindow, "function", "missing local conjunction geometry");
  const result = visibility.sampleConjunctionWindow({ bodies: ["Venus", "Jupiter"], latitude: 51.5, longitude: -.12, startUtc: "2026-06-09T10:00:00Z", endUtc: "2026-06-09T10:17:00Z" });
  assert.equal(result.samples.length, 3);
  assert.equal(result.samples.at(-1)?.atUtc, "2026-06-09T10:17:00.000Z");
  assert.ok(result.samples.every(sample => sample.sunAltitudeDeg > 0));
  assert.equal(result.continuousVisibility, "not-established");
  assert.equal(result.detectability, "not-assessed");
  assert.throws(() => visibility.sampleConjunctionWindow({ bodies: ["Venus", "Jupiter"], latitude: 51.5, longitude: -.12, startUtc: "2026-06-09T10:00:00Z", endUtc: "2026-06-11T10:00:00Z" }));
});

test("geometry distinguishes dark below-horizon bodies from dark above-horizon bodies without detectability", () => {
  const input = { latitude: 51.5, longitude: -.12, startUtc: "2026-10-15T00:00:00Z", endUtc: "2026-10-15T00:15:00Z" };
  const below = visibility.sampleConjunctionWindow({ ...input, bodies: ["Venus", "Jupiter"] });
  assert.ok(below.samples.every(sample => sample.altitudeDeg.every(altitude => altitude < 0) && sample.sunAltitudeDeg < -18));
  const above = visibility.sampleConjunctionWindow({ ...input, bodies: ["Saturn", "Neptune"] });
  assert.ok(above.samples.every(sample => sample.altitudeDeg.every(altitude => altitude > 30) && sample.sunAltitudeDeg < -18));
  assert.ok(above.samples.every(sample => sample.moonAltitudeDeg < 0 && sample.moonIlluminationPercent > 0));
  assert.equal(above.detectability, "not-assessed");
});

import { conjunctionWindowSchema } from "../../shared/nightsky/events";
test("conjunction sample contract rejects fabricated continuity, missing endpoints and nonfinite coordinates", () => {
  const input = { bodies: ["Venus", "Jupiter"] as ["Venus", "Jupiter"], latitude: 51.5, longitude: -.12, startUtc: "2026-10-15T00:00:00Z", endUtc: "2026-10-15T00:15:00Z" };
  const result = visibility.sampleConjunctionWindow(input);
  assert.equal(conjunctionWindowSchema.safeParse({ ...result, continuousVisibility: "visible" }).success, false);
  assert.equal(conjunctionWindowSchema.safeParse({ ...result, endUtc: "2026-10-15T01:00:00Z" }).success, false);
  assert.throws(() => visibility.sampleConjunctionWindow({ ...input, latitude: NaN }));
});

test("empty local samples fail schema validation without throwing", () => {
  const result = visibility.sampleConjunctionWindow({ bodies: ["Venus", "Jupiter"], latitude: 0, longitude: 0, startUtc: "2026-10-15T00:00:00Z", endUtc: "2026-10-15T00:15:00Z" });
  assert.equal(conjunctionWindowSchema.safeParse({ ...result, samples: [] }).success, false);
});

test("exact 24-hour geometry stays bounded to 97 samples", () => {
  const result = visibility.sampleConjunctionWindow({ bodies: ["Venus", "Jupiter"], latitude: 0, longitude: 0, startUtc: "2026-10-15T00:00:00Z", endUtc: "2026-10-16T00:00:00Z" });
  assert.equal(result.samples.length, 97);
  assert.equal(result.samples[0].atUtc, result.startUtc);
  assert.equal(result.samples[96].atUtc, result.endUtc);
});
