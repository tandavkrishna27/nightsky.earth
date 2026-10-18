import { test } from "node:test";
import assert from "node:assert/strict";
import {
  dateKeyAt,
  resolveZone,
  monthCells,
  formatInstant,
} from "../../shared/skyEventTime";
import { projectMonth, nextSkyEvents } from "../../shared/skyEventQueries";
import { validateSkyEvents, type SkyEvent } from "../../shared/skyEvents";
export const event = (timing: any, extra: any = {}): SkyEvent => ({
  id: "test-2026",
  title: "Test",
  category: "moon",
  synopsis: "Test",
  timing,
  visibility: "Depends on location",
  equipment: "Eyes",
  sections: [{ heading: "What happens", body: "Test" }],
  question: "Why?",
  sources: [
    {
      id: "s",
      title: "Source",
      url: "https://example.org",
      sourceTimeScale: "UTC",
    },
  ],
  lastReviewedAt: "2026-10-16",
  reviewStatus: "reviewed",
  ...extra,
});
const instant = (atUtc: string) => ({
  kind: "instant",
  atUtc,
  label: "Phase instant",
  sourceId: "s",
});
test("local dates handle midnight, years, fractional zones and DST", () => {
  assert.equal(dateKeyAt("2026-11-10T20:00:00Z", "Asia/Kolkata"), "2026-11-11");
  assert.equal(
    dateKeyAt("2027-01-01T01:00:00Z", "America/Los_Angeles"),
    "2026-12-31",
  );
  assert.equal(
    dateKeyAt("2026-11-10T18:20:00Z", "Asia/Kathmandu"),
    "2026-11-11",
  );
  assert.match(
    formatInstant("2027-03-14T06:30:00Z", "America/New_York"),
    /01:30/,
  );
  assert.match(
    formatInstant("2027-03-14T07:30:00Z", "America/New_York"),
    /03:30/,
  );
  assert.match(
    formatInstant("2026-11-01T05:30:00Z", "America/New_York"),
    /GMT-4/,
  );
  assert.match(
    formatInstant("2026-11-01T06:30:00Z", "America/New_York"),
    /GMT-5/,
  );
  assert.equal(resolveZone("bad", "Asia/Calcutta", "UTC"), "Asia/Calcutta");
  assert.equal(resolveZone("bad", "bad", "bad"), "UTC");
  assert.ok(monthCells("2028-02").some((c) => c.date === "2028-02-29"));
  assert.equal(monthCells("2028-02").length % 7, 0);
});
test("approximate source dates do not shift; intervals exclude midnight end", () => {
  const approximate = event({
    kind: "approximate",
    startDate: "2026-11-10",
    endDateInclusive: "2026-11-11",
    basis: "UTC",
    basisLabel: "UTC catalogue dates",
    label: "Expected peak around",
    sourceId: "s",
  });
  assert.deepEqual(
    projectMonth(
      [approximate],
      "2026-11",
      "Pacific/Kiritimati",
      new Date("2026-10-16"),
    )[0].dateKeys,
    ["2026-11-10", "2026-11-11"],
  );
  const interval = event({
    kind: "interval",
    startUtc: "2026-11-10T00:00:00Z",
    endUtcExclusive: "2026-11-11T00:00:00Z",
    label: "Activity",
    sourceId: "s",
  });
  assert.deepEqual(
    projectMonth([interval], "2026-11", "UTC", new Date("2026-10-16"))[0]
      .dateKeys,
    ["2026-11-10"],
  );
});
test("upcoming moments rank ahead of peak-passed activity, drafts stay out", () => {
  const a = event(instant("2026-10-15T00:00:00Z"), {
    id: "old",
    activity: {
      kind: "approximate",
      startDate: "2026-10-01",
      endDateInclusive: "2026-10-30",
      basis: "UTC",
      basisLabel: "UTC dates",
      label: "Activity",
      sourceId: "s",
    },
  });
  const b = event(instant("2026-10-20T00:00:00Z"), { id: "new" });
  const now = new Date("2026-10-16");
  assert.deepEqual(
    nextSkyEvents(
      [a, b, { ...b, id: "draft", reviewStatus: "draft" }],
      "UTC",
      now,
      3,
    ).map((x) => x.event.id),
    ["new", "old"],
  );
  assert.equal(projectMonth([a], "2026-10", "UTC", now).length, 1);
  assert.equal(
    nextSkyEvents([a, b], "UTC", new Date("2027-01-01"), 3).length,
    0,
  );
});
test("validation rejects malformed source/timing and duplicate IDs", () => {
  const good = event(instant("2026-11-10T20:00:00Z"));
  assert.equal(validateSkyEvents([good]).length, 1);
  for (const bad of [
    { ...good, timing: instant("2026-02-30T00:00:00Z") },
    { ...good, sources: [] },
    { ...good, sources: [{ ...good.sources[0], sourceTimeScale: "TT" }] },
    { ...good, timing: { ...good.timing, sourceId: "unknown" } },
    { ...good, lastReviewedAt: "2026-02-30" },
  ])
    assert.throws(() => validateSkyEvents([bad]));
  assert.throws(() => validateSkyEvents([good, good]));
});

test("timestamp validation rejects midnight rollover and invalid clock fields", () => {
  for (const at of [
    "2026-10-31T24:00:00Z",
    "2026-10-31T12:60:00Z",
    "2026-10-31T12:00:60Z",
  ])
    assert.throws(() =>
      validateSkyEvents([
        event({ kind: "instant", atUtc: at, label: "Phase", sourceId: "s" }),
      ]),
    );
});
