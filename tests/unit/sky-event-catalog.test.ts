import { test } from "node:test";
import assert from "node:assert/strict";
import { skyEvents, coverageMonths } from "../../shared/skyEventCatalog";
import { validateSkyEvents, validateCoverage } from "../../shared/skyEvents";
test("reviewed catalogue and all twelve research months validate", () => {
  assert.ok(skyEvents.length >= 30);
  assert.equal(validateSkyEvents(skyEvents).length, skyEvents.length);
  assert.deepEqual(
    validateCoverage(coverageMonths, new Date("2026-10-16")),
    [],
  );
  assert.equal(new Set(skyEvents.map((e) => e.category)).size, 4);
  for (const e of skyEvents) assert.ok(e.lastReviewedAt <= "2026-10-16");
});
test("coverage omissions and duplicates are explicit", () => {
  assert.equal(validateCoverage([], new Date("2026-10-16")).length, 12);
  assert.throws(() =>
    validateCoverage(
      [coverageMonths[0], coverageMonths[0]],
      new Date("2026-10-16"),
    ),
  );
});
