import assert from "node:assert/strict";
import test from "node:test";
import { parseDecodedChunk } from "../../../scripts/era5/chunks";
const header = { type: "header", schemaVersion: 1, sourceSha256: "a".repeat(64), sourceDoi: "10.24381/cds.adbb2d47", dataClass: "reanalysis", units: "fraction", sourceUnits: "1", timeUnits: "hours since 2025-01-01", calendar: "standard", experimentVersions: ["0001"], member: 0, institution: "ECMWF", gridSpacingDegrees: 0.25, cells: [{ latitude: 0, longitude: 0, cellId: "era5:0:0" }], decoderVersions: { netCDF4: "1.7.3", numpy: "2.5.4" }, rowCount: 2 };
const row = { type: "sample", atUtc: "2025-01-01T20:00:00Z", values: [0.25] };
const text = (first = header, rows = [row, { ...row, atUtc: "2025-01-01T21:00:00Z" }]) => [first, ...rows].map(value => JSON.stringify(value)).join("\n") + "\n";
test("decoded chunks preserve raw provenance, cells and sorted nullable samples", () => {
  const result = parseDecodedChunk(text());
  assert.equal(result.header.sourceSha256, header.sourceSha256);
  assert.deepEqual([...result.samplesForCell("era5:0:0")], [{ atUtc: row.atUtc, cloudFraction: 0.25 }, { atUtc: "2025-01-01T21:00:00Z", cloudFraction: 0.25 }]);
  assert.throws(() => result.samplesForCell("unknown"));
});
test("decoded chunks reject row bounds, incomplete and duplicate chunk data", () => {
  assert.throws(() => parseDecodedChunk(text(header, [row])));
  assert.throws(() => parseDecodedChunk(text(header, [row, row])));
  assert.throws(() => parseDecodedChunk(text({ ...header, dataClass: "forecast" } as typeof header)));
  assert.throws(() => parseDecodedChunk(text({ ...header, cells: [...header.cells, ...header.cells] })));
  assert.throws(() => parseDecodedChunk(" ".repeat(4 * 1024 * 1024 + 1)));
});
