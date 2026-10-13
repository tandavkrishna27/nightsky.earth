import assert from "node:assert/strict";
import test, { after } from "node:test";
import { GeoNamesPlaceIndex } from "../../../server/places/geonames";
import { createEra5ClimateProvider } from "../../../server/providers/climate/era5";
test("ERA5 requires explicit artifact and trusted checksum", async () => {
  const provider = createEra5ClimateProvider({
    index: new GeoNamesPlaceIndex([], "fixture"),
  });
  const result = await provider.getClimatology("place:v1:geonames:1", 1);
  assert.equal(result.availability.status, "unavailable");
  assert.equal(result.summary, undefined);
});
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createHash } from "node:crypto";
// Standalone reviewed-format fixture: no ignored pilot files or CDS credentials required.
const fixtureDirectory = await mkdtemp(join(tmpdir(), "era5-fixture-"));
after(async () => rm(fixtureDirectory, { recursive: true, force: true }));
const actualPath = join(fixtureDirectory, "artifact.json");
const provenance = {
  name: "Copernicus ERA5",
  url: "https://doi.org/10.24381/cds.adbb2d47",
  attribution:
    "Contains modified Copernicus Climate Change Service ERA5 information.",
  dataClass: "reanalysis",
  licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
  modified: true,
};
const zeroHash = "0".repeat(64);
const period = {
  startNight: "2025-01-01",
  endNight: "2025-12-31",
  kind: "sample-only",
};
const mappings = [
  {
    cellId: "era5:32.75:79",
    latitude: 32.75,
    longitude: 79,
    timeZone: "Asia/Kolkata",
  },
  {
    cellId: "era5:10.25:77.5",
    latitude: 10.25,
    longitude: 77.5,
    timeZone: "Asia/Kolkata",
  },
  {
    cellId: "era5:10:77",
    latitude: 10,
    longitude: 77,
    timeZone: "Asia/Kolkata",
  },
];
const perSample = {
  expectedEligibleSamples: 1,
  validEligibleSamples: 1,
  representedYears: 1,
  badYearCount: 0,
  completeness: 1,
  meanCloudFraction: 0.4,
  thresholds: [
    { fraction: 0.1, count: 0, frequency: 0 },
    { fraction: 0.25, count: 0, frequency: 0 },
    { fraction: 0.5, count: 1, frequency: 1 },
  ],
};
function stored(samples: number) {
  return {
    ...perSample,
    expectedEligibleSamples: samples,
    validEligibleSamples: samples,
    thresholds: perSample.thresholds.map((t) => ({
      ...t,
      count: t.count * samples,
    })),
    missingEligibleSamples: 0,
    quality: "sample-only",
  };
}
const artifactFixture = {
  schemaVersion: 1,
  builderVersion: "pilot-2025-v1",
  year: 2025,
  sampleKind: "sample-only",
  historicalLabel: "historical-not-a-forecast",
  manifestSha256:
    "e43315f64a34a586abda7e4f0ac434e82f0868d2f23bd124a09ba47545bd2400",
  sourceProvenance: provenance,
  gridProvenance: {
    suppliedSpacingDegrees: 0.25,
    nativeResolutionApproxKm: 31,
    selection: "nearest-supplied-cell",
    description: "Supplied regridded cells are not site measurements.",
  },
  caveats: ["One year sample only; not a climate baseline or forecast."],
  places: mappings.map((m, i) => ({
    placeId: `place:v1:geonames:${[1270426, 1266425, 1262463][i]}`,
    displayName: `${["Hanle", "Kodaikanal", "Munnar"][i]}, India`,
    timeZone: m.timeZone,
    indexVintage: "fixture",
    sources: [{ ...provenance, dataClass: "catalog" }],
    latitude: m.latitude,
    longitude: m.longitude,
    key: `${m.cellId}|${m.timeZone}`,
    gridMapping: {
      method: "nearest-supplied-cell",
      distanceMetric: "latitude-scaled-angular-grid",
      approximateDisplacementKm: 0,
    },
  })),
  aggregates: mappings.map((m) => ({
    schemaVersion: 1,
    methodVersion: "dark-cloud-v1",
    key: `${m.cellId}|${m.timeZone}`,
    mapping: m,
    period,
    astronomyVersion: "2.1.19",
    timezoneVersion: "fixture",
    bins: Array.from({ length: 288 }, () => ({
      expected: 1,
      valid: 1,
      counts: [0, 0, 1],
      sum: 0.4,
      yearsMask: 1,
      badYearsMask: 0,
    })),
    yearMonthly: [
      Array.from({ length: 12 }, () => ({ expected: 24, valid: 24 })),
    ],
    monthly: Array.from({ length: 12 }, (_, i) => ({
      ...stored(24),
      month: i + 1,
    })),
    annual: stored(288),
  })),
  sources: Array.from({ length: 28 }, (_, i) => ({
    chunkId: `${i < 14 ? "hanle" : "kodaikanal-munnar"}-${i}`,
    rawSha256: zeroHash,
    decodedSha256: zeroHash,
    sourceRows: 1,
    expectedRows: 1,
    missingSourceHours: 0,
    rawBytes: 1,
    decodedBytes: 1,
    source: {
      schemaVersion: 1,
      type: "header",
      calendar: "proleptic_gregorian",
      cells: (i < 14 ? mappings.slice(0, 1) : mappings.slice(1)).map(
        ({ timeZone, ...m }) => m,
      ),
      dataClass: "reanalysis",
      decoderVersions: { netCDF4: "fixture", numpy: "fixture" },
      experimentVersions: ["0001"],
      gridSpacingDegrees: 0.25,
      institution: "ECMWF",
      member: 0,
      rowCount: 1,
      sourceDoi: "10.24381/cds.adbb2d47",
      sourceSha256: zeroHash,
      sourceUnits: "(0 - 1)",
      timeUnits: "seconds since 1970-01-01",
      units: "fraction",
    },
  })),
};
const fixtureText = JSON.stringify(artifactFixture);
const trusted = createHash("sha256").update(fixtureText).digest("hex");
await writeFile(actualPath, fixtureText);
async function fixture() {
  const data = JSON.parse(await readFile(actualPath, "utf8"));
  const index = new GeoNamesPlaceIndex(
    data.places.map(
      (p: any) =>
        [
          Number(p.placeId.split(":").at(-1)),
          p.displayName.split(",")[0],
          p.displayName.split(",")[0],
          "",
          p.latitude,
          p.longitude,
          "IN",
          "India",
          1,
          p.timeZone,
        ] as const,
    ),
    data.places[0].indexVintage,
  );
  return { data, index };
}
async function mutated(
  mutator: (data: any) => void,
  body: (path: string, sha: string, index: GeoNamesPlaceIndex) => Promise<void>,
) {
  const { data, index } = await fixture();
  mutator(data);
  const dir = await mkdtemp(join(tmpdir(), "era5-runtime-"));
  try {
    const path = join(dir, "artifact.json"),
      text = JSON.stringify(data);
    await writeFile(path, text);
    await body(path, createHash("sha256").update(text).digest("hex"), index);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
test("reviewed artifact returns deterministic sample-only weighted monthly statistics and 24 bins", async () => {
  const { data, index } = await fixture();
  const p = createEra5ClimateProvider({
    index,
    artifactPath: actualPath,
    expectedSha256: trusted,
  });
  const a = await p.getClimatology(data.places[0].placeId, 1);
  assert.equal(a.availability.status, "partial");
  assert.equal(a.bins?.length, 24);
  assert.equal(a.summary?.expectedEligibleSamples, 24);
  assert.equal(a.summary?.thresholds?.[1]?.count, 0);
  assert.equal(a.period.kind, "sample-only");
  assert.equal(a.dataClass, "reanalysis");
  assert.deepEqual(a, await p.getClimatology(data.places[0].placeId, 1));
  assert.equal(
    (await p.getClimatology("place:v1:geonames:1", 1)).availability.status,
    "unavailable",
  );
});
test("missing, wrong checksum, oversized files and invalid limit configuration fail closed", async () => {
  const { index } = await fixture();
  for (const options of [
    { artifactPath: "missing.json", expectedSha256: trusted },
    { artifactPath: actualPath, expectedSha256: "0".repeat(64) },
    {
      artifactPath: actualPath,
      expectedSha256: trusted,
      maxArtifactBytes: 128,
    },
  ]) {
    const result = await createEra5ClimateProvider({
      index,
      ...options,
    }).getClimatology("place:v1:geonames:1270426", 1);
    assert.equal(result.availability.status, "unavailable");
    assert.equal(result.summary, undefined);
  }
  assert.throws(() =>
    createEra5ClimateProvider({ index, maxArtifactBytes: 9 * 1024 * 1024 }),
  );
  assert.throws(() =>
    createEra5ClimateProvider({ index, maxCacheBytes: 33 * 1024 * 1024 }),
  );
});
test("trusted but corrupt schema, provenance, mapping and numerical counts fail closed", async () => {
  for (const edit of [
    (d: any) => (d.schemaVersion = 2),
    (d: any) => (d.aggregates[0].methodVersion = "other"),
    (d: any) => (d.places[0].indexVintage = "wrong"),
    (d: any) => (d.places[0].latitude += 1),
    (d: any) => (d.places[0].key = "missing"),
    (d: any) => (d.places[0].gridMapping.approximateDisplacementKm = 1),
    (d: any) => (d.aggregates[0].bins[0].valid = 100),
    (d: any) => d.aggregates[0].monthly[0].thresholds[0].count++,
    (d: any) => (d.sourceProvenance.dataClass = "forecast"),
    (d: any) => (d.sources[0].source.sourceSha256 = "f".repeat(64)),
    (d: any) => (d.sources[0].source.units = "percent"),
    (d: any) => d.aggregates[0].yearMonthly[0][0].valid--,
  ])
    await mutated(edit, async (path, sha, index) =>
      assert.equal(
        (
          await createEra5ClimateProvider({
            index,
            artifactPath: path,
            expectedSha256: sha,
          }).getClimatology("place:v1:geonames:1270426", 1)
        ).availability.status,
        "unavailable",
      ),
    );
});
test("one coalesced read serves concurrent requests and byte cache persists", async () => {
  const { index } = await fixture();
  let reads = 0;
  const p = createEra5ClimateProvider({
    index,
    artifactPath: actualPath,
    expectedSha256: trusted,
    onRead: () => reads++,
  });
  const results = await Promise.all(
    Array.from({ length: 20 }, () =>
      p.getClimatology("place:v1:geonames:1270426", 1),
    ),
  );
  assert.equal(reads, 1);
  results.forEach((r) => assert.equal(r.availability.status, "partial"));
  await p.getClimatology("place:v1:geonames:1266425", 12);
  assert.equal(reads, 1);
});
test("artifacts above cache byte budget are not retained and concurrent reads still coalesce", async () => {
  const { index } = await fixture();
  let reads = 0;
  const p = createEra5ClimateProvider({
    index,
    artifactPath: actualPath,
    expectedSha256: trusted,
    maxCacheBytes: 1,
    onRead: () => reads++,
  });
  await Promise.all([
    p.getClimatology("place:v1:geonames:1270426", 1),
    p.getClimatology("place:v1:geonames:1266425", 1),
  ]);
  assert.equal(reads, 1);
  await p.getClimatology("place:v1:geonames:1270426", 2);
  assert.equal(reads, 2);
});
test("zero expected samples return no-darkness with absent cloud numeric values", async () => {
  await mutated(
    (d) => {
      const a = d.aggregates[0];
      a.bins = a.bins.map(() => ({
        expected: 0,
        valid: 0,
        sum: 0,
        counts: [0, 0, 0],
        yearsMask: 0,
        badYearsMask: 0,
      }));
      a.yearMonthly = [
        [...Array.from({ length: 12 }, () => ({ expected: 0, valid: 0 }))],
      ];
      const zero = {
        expectedEligibleSamples: 0,
        validEligibleSamples: 0,
        representedYears: 0,
        badYearCount: 0,
        missingEligibleSamples: 0,
        quality: "no-astronomical-darkness",
      };
      a.monthly = Array.from({ length: 12 }, (_, m) => ({
        ...zero,
        month: m + 1,
      }));
      a.annual = zero;
    },
    async (path, sha, index) => {
      const r = await createEra5ClimateProvider({
        index,
        artifactPath: path,
        expectedSha256: sha,
      }).getClimatology("place:v1:geonames:1270426", 1);
      assert.equal(r.availability.status, "not-covered");
      assert.equal(r.summary?.meanCloudFraction, undefined);
      assert.equal(r.summary?.thresholds, undefined);
    },
  );
});
test("invalid month fails input validation", async () => {
  const { index } = await fixture();
  await assert.rejects(
    createEra5ClimateProvider({ index }).getClimatology(
      "place:v1:geonames:1270426",
      13,
    ),
  );
});

test("concentrated missing-bin quality remains partial despite high monthly completeness", async () => {
  await mutated(
    (d) => {
      const a = d.aggregates[0];
      a.bins[0] = {
        expected: 1,
        valid: 0,
        counts: [0, 0, 0],
        sum: 0,
        yearsMask: 0,
        badYearsMask: 1,
      };
      a.yearMonthly[0][0].valid = 23;
      a.monthly[0] = {
        ...stored(23),
        month: 1,
        expectedEligibleSamples: 24,
        completeness: 23 / 24,
        badYearCount: 1,
        missingEligibleSamples: 1,
      };
      a.annual = {
        ...stored(287),
        expectedEligibleSamples: 288,
        completeness: 287 / 288,
        badYearCount: 1,
        missingEligibleSamples: 1,
      };
    },
    async (path, sha, index) => {
      const r = await createEra5ClimateProvider({
        index,
        artifactPath: path,
        expectedSha256: sha,
      }).getClimatology("place:v1:geonames:1270426", 1);
      assert.equal(r.availability.status, "partial");
      assert.equal(r.summary?.badYearCount, 1);
      assert.equal(r.summary?.completeness, 23 / 24);
      assert.equal(r.bins?.[0]?.statistics.meanCloudFraction, undefined);
    },
  );
});
test("single-year masks cannot claim bad coverage for a complete bin", async () => {
  await mutated(
    (d) => (d.aggregates[0].bins[0].badYearsMask = 1),
    async (path, sha, index) => {
      assert.equal(
        (
          await createEra5ClimateProvider({
            index,
            artifactPath: path,
            expectedSha256: sha,
          }).getClimatology("place:v1:geonames:1270426", 1)
        ).availability.status,
        "unavailable",
      );
    },
  );
});
test("trusted malformed JSON fails closed and never exposes host paths", async () => {
  const { index } = await fixture();
  const dir = await mkdtemp(join(tmpdir(), "era5-invalid-"));
  try {
    const path = join(dir, "invalid.json"),
      text = "{";
    await writeFile(path, text);
    const r = await createEra5ClimateProvider({
      index,
      artifactPath: path,
      expectedSha256: createHash("sha256").update(text).digest("hex"),
    }).getClimatology("place:v1:geonames:1270426", 1);
    assert.equal(r.availability.status, "unavailable");
    assert.equal(JSON.stringify(r).includes(dir), false);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("a farther supplied cell is rejected even with internally matching keys and displacement", async () => {
  await mutated(
    (d) => {
      const a = d.aggregates[0],
        p = d.places[0];
      const farther = { cellId: "era5:33:79", latitude: 33, longitude: 79 };
      d.sources
        .filter((s: any) => s.chunkId.startsWith("hanle-"))
        .forEach((s: any) => s.source.cells.push(farther));
      a.mapping = { ...a.mapping, ...farther };
      a.key = `${farther.cellId}|${a.mapping.timeZone}`;
      p.key = a.key;
      p.gridMapping.approximateDisplacementKm = 0.25 * 111.195;
    },
    async (path, sha, index) =>
      assert.equal(
        (
          await createEra5ClimateProvider({
            index,
            artifactPath: path,
            expectedSha256: sha,
          }).getClimatology("place:v1:geonames:1270426", 1)
        ).availability.status,
        "unavailable",
      ),
  );
});
