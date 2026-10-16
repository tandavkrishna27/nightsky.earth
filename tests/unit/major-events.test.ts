import { readFileSync } from "node:fs";
import {
  auditMajorEventCoverage,
  requiredMajorEventIds,
} from "../../shared/skyEventCoverage";
import { test } from "node:test";
import assert from "node:assert/strict";
import { skyEvents } from "../../shared/skyEventCatalog";
import { dateKeyAt, formatInstant } from "../../shared/skyEventTime";
import { projectMonth } from "../../shared/skyEventQueries";
const find = (name: string) =>
  skyEvents.find((e) => e.title.toLowerCase().includes(name.toLowerCase()));
test("major coverage includes quarter phases, seasons, close pairings and missing showers", () => {
  for (const name of [
    "First Quarter Moon",
    "Last Quarter Moon",
    "December solstice",
    "March equinox",
    "June solstice",
    "September equinox",
    "Earth at perihelion",
    "Earth at aphelion",
    "Alpha Capricornid",
    "Draconid",
    "Mars and Jupiter",
  ])
    assert.ok(find(name), "Missing " + name);
  assert.equal(
    skyEvents.filter((e) => e.title === "First Quarter Moon").length,
    12,
  );
  assert.equal(
    skyEvents.filter((e) => e.title === "Last Quarter Moon").length,
    13,
  );
  assert.equal(skyEvents.filter((e) => e.category === "eclipses").length, 5);
});
test("meteor night ranges use specialist evidence without fake UTC appointments", () => {
  const leonid = find("Leonid")!;
  assert.equal(leonid.timing.kind, "approximate");
  if (leonid.timing.kind === "approximate") {
    assert.equal(leonid.timing.startDate, "2026-11-16");
    assert.equal(leonid.timing.endDateInclusive, "2026-11-17");
    assert.equal(leonid.timing.basis, "source-calendar");
  }
  const delta = find("Delta Aquariid")!;
  if (delta.timing.kind === "approximate")
    assert.equal(delta.timing.startDate, "2027-07-30");
  const lyrid = find("Lyrid")!;
  assert.ok(
    lyrid.sections.some((s) => /disagree|different|differ/i.test(s.body)),
  );
  for (const name of ["Orionid", "Geminid", "Perseid"]) {
    const e = find(name)!;
    assert.ok(e.sections.length >= 5);
    assert.ok(e.sources.some((s) => /amsmeteors|nasa/.test(s.url)));
  }
});
test("season UTC reference crosses civil date correctly and aliases agree", () => {
  const e = find("December solstice")!;
  assert.equal(e.timing.kind, "instant");
  if (e.timing.kind !== "instant") return;
  assert.equal(e.timing.atUtc, "2026-12-21T20:50:00Z");
  assert.equal(dateKeyAt(e.timing.atUtc, "Asia/Kolkata"), "2026-12-22");
  assert.equal(
    formatInstant(e.timing.atUtc, "Asia/Kolkata"),
    formatInstant(e.timing.atUtc, "Asia/Calcutta"),
  );
  const rows = projectMonth(
    [e],
    "2026-12",
    "Asia/Kolkata",
    new Date("2026-10-16"),
  );
  assert.deepEqual(rows[0].dateKeys, ["2026-12-22"]);
});

test("every required occurrence has matching reviewed source evidence and correct timing precision", () => {
  const evidence = JSON.parse(
    readFileSync(
      new URL("../fixtures/major-event-evidence.json", import.meta.url),
      "utf8",
    ),
  ) as {
    id: string;
    date: string;
    time: string | null;
    url: string;
    specialist?: { start: string; end: string };
  }[];
  assert.deepEqual(auditMajorEventCoverage(skyEvents), []);
  assert.equal(evidence.length, requiredMajorEventIds.length);
  assert.equal(skyEvents.length, evidence.length);
  for (const row of evidence) {
    const e = skyEvents.find((e) => e.id === row.id)!;
    assert.ok(e, row.id);
    assert.ok(e.sections.length >= 4, "Detailed guide: " + e.id);
    if (row.specialist) {
      assert.equal(e.timing.kind, "approximate");
      if (e.timing.kind === "approximate") {
        assert.equal(e.timing.startDate, row.specialist.start);
        assert.equal(e.timing.endDateInclusive, row.specialist.end);
        assert.equal(e.timing.basis, "source-calendar");
      }
    } else if (row.time?.includes(":")) {
      assert.equal(e.timing.kind, "instant");
      if (e.timing.kind === "instant")
        assert.equal(e.timing.atUtc, row.date + "T" + row.time + ":00Z");
    } else {
      assert.equal(e.timing.kind, "approximate");
      if (e.timing.kind === "approximate")
        assert.equal(e.timing.startDate, row.date);
    }
  }
  assert.ok(auditMajorEventCoverage(skyEvents.slice(1)).length > 0);
});
test("timezone matrix preserves all global instants and source-night dates", () => {
  const zones = [
    "UTC",
    "Asia/Kolkata",
    "Asia/Calcutta",
    "Asia/Kathmandu",
    "America/New_York",
    "America/Los_Angeles",
    "Australia/Sydney",
    "Pacific/Kiritimati",
    "Pacific/Honolulu",
  ];
  for (const e of skyEvents) {
    for (const zone of zones) {
      if (e.timing.kind === "instant") {
        const expected = new Intl.DateTimeFormat("en-CA", {
          timeZone: zone,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(new Date(e.timing.atUtc));
        assert.equal(
          dateKeyAt(e.timing.atUtc, zone),
          expected,
          e.id + " " + zone,
        );
        const key = dateKeyAt(e.timing.atUtc, zone);
        assert.ok(
          projectMonth(
            [e],
            key.slice(0, 7),
            zone,
            new Date("2026-10-16"),
          )[0].dateKeys.includes(key),
        );
      } else if (e.timing.kind === "approximate") {
        assert.ok(
          projectMonth(
            [e],
            e.timing.startDate.slice(0, 7),
            zone,
            new Date("2026-10-16"),
          )[0].dateKeys.includes(e.timing.startDate),
        );
      }
    }
  }
});
