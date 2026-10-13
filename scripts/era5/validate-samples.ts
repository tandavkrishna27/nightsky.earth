import { createHash } from "node:crypto";
import { readFile, stat, writeFile } from "node:fs/promises";
import { loadGeoNamesPlaceIndex } from "../../server/places/geonames";
import { aggregateDarkCloudSamples, summarizeMonth, validateChunkLedger } from "./aggregate";
import { parseDecodedChunk } from "./chunks";

// Explicitly bounded existing source samples only. No network or CDS credentials.
const inputs = [
  { name: "hanle", ids: [1270426], sha256: "e674bae1ee78a1a7126b5d3470b74298b9dd828efc68282901b8cbebfaaad039" },
  { name: "kodaikanal-munnar", ids: [1266425, 1262463], sha256: "6c0ecfdeb31836daaaa2a04e925fe2c60d6a2392bdaf35b0cfff4c728c808167" },
];
const index = await loadGeoNamesPlaceIndex(".data/geonames/cities500.json.gz");
if (!index) throw new Error("Verified local GeoNames artifact is missing.");
const reports = [];
for (const input of inputs) {
  const stem = `.data/era5/${input.name}-2025-01`;
  const rawPath = `${stem}-total-cloud-cover.nc`;
  const decodedPath = `${stem}.jsonl`;
  if ((await stat(rawPath)).size > 32 * 1024 * 1024 || (await stat(decodedPath)).size > 4 * 1024 * 1024) throw new RangeError("Existing sample exceeds builder bounds.");
  const rawDigest = createHash("sha256").update(await readFile(rawPath)).digest("hex");
  if (rawDigest !== input.sha256) throw new Error("Reviewed source checksum changed.");
  const decoded = await readFile(decodedPath, "utf8");
  const chunk = parseDecodedChunk(decoded);
  if (chunk.header.sourceSha256 !== rawDigest) throw new Error("Decoded source provenance mismatch.");
  validateChunkLedger([{ chunkId: `${input.name}-2025-01`, sha256: rawDigest, sourceRevision: chunk.header.experimentVersions.join(","), complete: true }]);
  for (const id of input.ids) {
    const place = index.getById(id);
    if (!place) throw new Error(`Reviewed place ${id} is missing.`);
    // Same supplied latitude/longitude grid as the samples. Deterministic
    // nearest angular cell, with longitudinal scaling at the place latitude.
    const distance = (cell: { latitude: number; longitude: number }) => (cell.latitude - place.latitude) ** 2 + ((cell.longitude - place.longitude) * Math.cos(place.latitude * Math.PI / 180)) ** 2;
    const candidates = [...chunk.header.cells].sort((a, b) => distance(a) - distance(b) || a.cellId.localeCompare(b.cellId));
    const cell = candidates[0]!;
    const aggregate = aggregateDarkCloudSamples(chunk.samplesForCell(cell.cellId), { ...cell, timeZone: place.timeZone }, { startNight: "2025-01-01", endNight: "2025-01-31" });
    const summary = summarizeMonth(aggregate, 1);
    const report = { name: place.name, placeId: `place:v1:geonames:${id}`, sourceSha256: rawDigest,
      decodedSha256: createHash("sha256").update(decoded).digest("hex"), source: chunk.header,
      gridMapping: { method: "nearest-supplied-cell", distanceMetric: "latitude-scaled-angular-grid", approximateDisplacementKm: Math.sqrt(distance(cell)) * 111.195 },
      indexVintage: index.vintageLabel, aggregate, summary,
      caveats: ["January 2025 sample only, not a climate baseline or forecast.", "January 31 observing-night dawn hours fall in February; the January file does not contain them. Missing hours remain in expected counts.", "Hourly instantaneous modeled cloud fractions are not continuous clear hours or whole-night probabilities."] };
    await writeFile(`.data/era5/${id}-historical-sample-report.json`, JSON.stringify(report, null, 2) + "\n");
    reports.push({ place: place.name, cell: cell.cellId, expected: summary.expectedEligibleSamples, valid: summary.validEligibleSamples,
      meanCloudFraction: summary.meanCloudFraction, frequencies: summary.thresholds?.map(row => ({ threshold: row.fraction, count: row.count, frequency: row.frequency })), quality: summary.quality });
  }
}
console.log(JSON.stringify({ historicalLabel: "historical-not-a-forecast", reports }, null, 2));
