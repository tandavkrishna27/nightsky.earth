import assert from "node:assert/strict";
import test from "node:test";
import { formatLocalTime, resolveLocalDateTimeToUtc } from "../../server/nightsky/time";
import { GeoNamesPlaceIndex } from "../../server/places/geonames";
import { resolvePlaceTimeZone } from "../../server/places";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

test("formatsLocalTimeAcrossDst", () => {
  const before = resolveLocalDateTimeToUtc("2026-03-08", 1, 30, "America/New_York");
  const after = resolveLocalDateTimeToUtc("2026-03-08", 3, 30, "America/New_York");
  assert.equal(formatLocalTime(before, "America/New_York", "en-US"), "1:30 AM EST");
  assert.equal(formatLocalTime(after, "America/New_York", "en-US"), "3:30 AM EDT");
  assert.throws(() => resolveLocalDateTimeToUtc("2026-03-08", 2, 30, "America/New_York"), /does not resolve/i);
});

test("unsupported or absent named IDs never substitute UTC", async () => {
  const index = new GeoNamesPlaceIndex([], "empty-fixture");
  assert.equal(await resolvePlaceTimeZone("place:v1:osm:node:123", index), undefined);
  assert.equal(await resolvePlaceTimeZone("place:v1:geonames:999", index), undefined);
});

test("missing index timezone lookup never substitutes UTC", async () => {
  const dir = await mkdtemp(join(tmpdir(), "nightsky-missing-zone-"));
  const oldPath = process.env.NIGHTSKY_GEONAMES_INDEX;
  try {
    process.env.NIGHTSKY_GEONAMES_INDEX = join(dir, "missing.json.gz");
    assert.equal(await resolvePlaceTimeZone("place:v1:geonames:1880252"), undefined);
  } finally {
    if (oldPath === undefined) delete process.env.NIGHTSKY_GEONAMES_INDEX;
    else process.env.NIGHTSKY_GEONAMES_INDEX = oldPath;
    await rm(dir, { recursive: true, force: true });
  }
});

test("named record with invalid zone cannot produce timezone result", async () => {
  const index = new GeoNamesPlaceIndex([[1880252, "Pune", "Pune", "", 18.5204, 73.8567, "IN", "India", 100000, "Not/A_Timezone"]], "invalid-fixture");
  await assert.rejects(() => resolvePlaceTimeZone("place:v1:geonames:1880252", index), /IANA/);
});

test("named zones across civil date line preserve opposing local dates", async () => {
  const index = new GeoNamesPlaceIndex([
    [1, "Apia", "Apia", "", -13.8333, -171.7667, "WS", "Samoa", 100000, "Pacific/Apia"],
    [2, "Pago Pago", "Pago Pago", "", -14.2756, -170.702, "AS", "American Samoa", 100000, "Pacific/Pago_Pago"],
  ], "date-line-fixture");
  const instant = "2026-10-14T12:00:00Z";
  for (const [id, expectedDate] of [[1, "2026-10-15"], [2, "2026-10-14"]] as const) {
    const resolved = await resolvePlaceTimeZone(`place:v1:geonames:${id}`, index);
    assert.ok(resolved);
    const parts = new Intl.DateTimeFormat("en", { timeZone: resolved.timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(instant));
    const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
    assert.equal(`${values.year}-${values.month}-${values.day}`, expectedDate);
    assert.equal(formatLocalTime(instant, resolved.timeZone, "en-US"), "1:00 AM GMT" + (id === 1 ? "+13" : "-11"));
  }
});

test("fractional offset converts local clock without integer-hour rounding", () => {
  assert.equal(resolveLocalDateTimeToUtc("2026-10-14", 18, 0, "Asia/Kolkata"), "2026-10-14T12:30:00.000Z");
  assert.equal(formatLocalTime("2026-10-14T12:00:00Z", "Asia/Kolkata", "en-US"), "5:30 PM GMT+5:30");
});

test("fall DST fold keeps explicit UTC instants distinct in local display", () => {
  assert.equal(formatLocalTime("2026-11-01T05:30:00Z", "America/New_York", "en-US"), "1:30 AM EDT");
  assert.equal(formatLocalTime("2026-11-01T06:30:00Z", "America/New_York", "en-US"), "1:30 AM EST");
});

test("resolvesIanaZoneFromNamedPlaceRecord", async () => {
  const index = new GeoNamesPlaceIndex([{
    geonameId: 1880252, name: "Pune", asciiName: "Pune", alternateNames: "",
    latitude: 18.5204, longitude: 73.8567, countryCode: "IN", countryName: "India",
    featureClass: "P", featureCode: "PPL", population: 100_000, timeZone: "Asia/Kolkata", modificationDate: "2026-10-01",
  }], "test-vintage");
  const resolved = await resolvePlaceTimeZone("place:v1:geonames:1880252", index);
  assert.equal(resolved?.timeZone, "Asia/Kolkata");
  assert.doesNotThrow(() => formatLocalTime("2026-10-11T12:00:00.000Z", resolved!.timeZone, "en-IN"));
  assert.equal(await resolvePlaceTimeZone("place:v1:geonames:999", index), undefined);
  assert.throws(() => formatLocalTime("2026-10-11T12:00:00.000Z", "Not/A_Timezone", "en"));
});
