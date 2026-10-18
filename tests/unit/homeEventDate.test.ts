import { test } from "node:test";
import assert from "node:assert/strict";
import { homeEventDate } from "../../client/src/components/home/eventDate";
import { nextSkyEvents } from "../../shared/skyEventQueries";
import { skyEvents } from "../../shared/skyEventCatalog";

test("homepage badges use the selected time zone for exact instants", () => {
  const event = skyEvents.find((e) => e.id === "new-moon-2027-08-31")!;
  const project = (tz: string) =>
    nextSkyEvents([event], tz, new Date("2027-08-30T00:00:00Z"), 1)[0];
  assert.equal(homeEventDate(project("UTC"), "UTC").day, "31");
  assert.equal(
    homeEventDate(project("Pacific/Kiritimati"), "Pacific/Kiritimati").day,
    "1",
  );
  assert.match(
    homeEventDate(project("Pacific/Kiritimati"), "Pacific/Kiritimati").month,
    /SEP/,
  );
});

test("approximate dates retain their source calendar and visible approximation", () => {
  const event = skyEvents.find(
    (e) => e.id === "orionid-meteor-shower-2026-10-21",
  )!;
  const item = nextSkyEvents(
    [event],
    "Pacific/Honolulu",
    new Date("2026-10-16T12:00:00Z"),
    1,
  )[0];
  const date = homeEventDate(item, "Pacific/Honolulu");
  assert.equal(date.day, "21–22");
  assert.equal(date.weekday, "WED–THU");
  assert.match(date.context, /Approx/);
});

test("ongoing activity shows its activity range and flags the passed peak", () => {
  const base = skyEvents.find(
    (e) => e.id === "orionid-meteor-shower-2026-10-21",
  )!;
  const event = {
    ...base,
    activity: {
      kind: "approximate" as const,
      startDate: "2026-10-02",
      endDateInclusive: "2026-11-07",
      basis: "source-calendar" as const,
      basisLabel: "Source calendar",
      label: "Activity dates",
      sourceId: "ams",
    },
  };
  const item = nextSkyEvents(
    [event],
    "UTC",
    new Date("2026-10-25T12:00:00Z"),
    1,
  )[0];
  assert.equal(item.marker, "activity");
  const date = homeEventDate(item, "UTC");
  assert.match(date.context, /Peak passed/);
  assert.notEqual(date.day, "21–22");
});

test("date ranges crossing months or years remain unambiguous", () => {
  const base = skyEvents.find(
    (e) => e.id === "orionid-meteor-shower-2026-10-21",
  )!;
  const event = {
    ...base,
    timing: {
      ...base.timing,
      kind: "approximate" as const,
      startDate: "2026-12-31",
      endDateInclusive: "2027-01-02",
      basis: "source-calendar" as const,
      basisLabel: "Source calendar",
    },
  };
  const item = nextSkyEvents(
    [event],
    "UTC",
    new Date("2026-12-01T00:00:00Z"),
    1,
  )[0];
  const date = homeEventDate(item, "UTC");
  assert.equal(date.day, "31 Dec–2 Jan");
  assert.equal(date.month, "2026–2027");
});
