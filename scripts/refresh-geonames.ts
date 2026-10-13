import { mkdir, rename, writeFile, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, resolve } from "node:path";
import { gzipSync, gunzipSync } from "node:zlib";
import { loadGeoNamesPlaceIndex, parseGeoNamesCityRow, type GeoNamesCityTuple } from "../server/places/geonames";

import { REVIEWED_SUPPLEMENT, reviewedSupplementRows, extractGeoNamesEntry } from "./geonames-supplement";

const MAX_ARCHIVE_BYTES = 64 * 1024 * 1024;
const MAX_EXPANDED_BYTES = 256 * 1024 * 1024;
const root = "https://download.geonames.org/export/dump";
const outputPath = resolve(process.env.NIGHTSKY_GEONAMES_INDEX ?? ".data/geonames/cities500.json.gz");

async function download(url: string, limit = MAX_ARCHIVE_BYTES): Promise<{ bytes: Uint8Array; lastModified?: string }> {
  const response = await fetch(url, { signal: AbortSignal.timeout(120_000) });
  if (!response.ok) throw new Error(`GeoNames download failed (${response.status}) for ${new URL(url).pathname}.`);
  const declaredLength = Number(response.headers.get("content-length") ?? 0);
  if (declaredLength > limit) throw new Error("GeoNames source file exceeds the configured download limit.");
  const reader = response.body?.getReader();
  if (!reader) throw new Error("GeoNames response has no body.");
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > limit) { await reader.cancel(); throw new Error("GeoNames source file exceeds the configured download limit."); }
    chunks.push(value);
  }
  const bytes = Buffer.concat(chunks);
  return { bytes, lastModified: response.headers.get("last-modified") ?? undefined };
}

function decodeUtf8(bytes: Uint8Array): string {
  if (bytes.byteLength > MAX_EXPANDED_BYTES) throw new Error("GeoNames archive exceeds the expanded data limit.");
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

async function refreshSupplementOnly(): Promise<void> {
  if (!await loadGeoNamesPlaceIndex(outputPath)) throw new Error("Install the global baseline before supplement-only refresh.");
  const baseline = JSON.parse(gunzipSync(await readFile(outputPath), { maxOutputLength: MAX_EXPANDED_BYTES }).toString("utf8"));
  if (baseline.schemaVersion !== 2 || !Array.isArray(baseline.cities) || baseline.cities.length < 100_000) throw new Error("Expected installed schema2 global baseline.");
  const archive = await download(REVIEWED_SUPPLEMENT.url, 16 * 1024 * 1024);
  const file = extractGeoNamesEntry(archive.bytes, REVIEWED_SUPPLEMENT.entry, MAX_EXPANDED_BYTES);
  const rows = reviewedSupplementRows(decodeUtf8(file), new Map([["IN", "India"]]));
  const cities = [...baseline.cities.filter((row: GeoNamesCityTuple) => row[0] !== REVIEWED_SUPPLEMENT.geonameId), ...rows];
  const payload = { ...baseline,
    vintage: `${baseline.vintage.replace(/\+hanle-v1$/, "")}+hanle-v1`,
    generatedAt: new Date().toISOString(),
    supplementalSources: [{ ...REVIEWED_SUPPLEMENT, archiveChecksum: createHash("sha256").update(archive.bytes).digest("hex"), ...(archive.lastModified ? { sourceLastModified: archive.lastModified } : {}) }],
    cities,
  };
  const temporaryPath = `${outputPath}.tmp`;
  await writeFile(temporaryPath, gzipSync(JSON.stringify(payload), { level: 9 }));
  await rename(temporaryPath, outputPath);
  console.log(`Preserved global baseline and wrote ${cities.length} records including reviewed Hanle.`);
}

async function main(): Promise<void> {
  if (process.argv.includes("--supplement-only")) return refreshSupplementOnly();
  const [archive, countryFile, supplementArchive] = await Promise.all([
    download(`${root}/cities500.zip`),
    download(`${root}/countryInfo.txt`),
    download(REVIEWED_SUPPLEMENT.url, 16 * 1024 * 1024),
  ]);
  const cityFile = extractGeoNamesEntry(archive.bytes, "cities500.txt", MAX_EXPANDED_BYTES);
  const countryNames = new Map<string, string>();
  for (const line of decodeUtf8(countryFile.bytes).split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const columns = line.split("\t");
    if (columns[0] && columns[4]) countryNames.set(columns[0], columns[4]);
  }
  const cityText = decodeUtf8(cityFile);
  const cities: GeoNamesCityTuple[] = [];
  let lineStart = 0;
  while (lineStart < cityText.length) {
    const lineEnd = cityText.indexOf("\n", lineStart);
    const end = lineEnd < 0 ? cityText.length : lineEnd;
    const line = cityText.slice(lineStart, end).replace(/\r$/, "");
    lineStart = end + 1;
    if (!line) continue;
    const city = parseGeoNamesCityRow(line, countryNames);
    const aliases = city.alternateNames.split(",").slice(0, 12).join(",");
    cities.push([city.geonameId, city.name, city.asciiName, aliases, city.latitude, city.longitude, city.countryCode, city.countryName, city.population, city.timeZone]);
  }
  if (cities.length < 100_000) throw new Error(`Unexpectedly small GeoNames city index: ${cities.length} rows.`);
  const supplementFile = extractGeoNamesEntry(supplementArchive.bytes, REVIEWED_SUPPLEMENT.entry, MAX_EXPANDED_BYTES);
  const supplementalRows = reviewedSupplementRows(decodeUtf8(supplementFile), countryNames);
  const supplementalIds = new Set(supplementalRows.map(row => row[0]));
  // A reviewed record takes precedence if cities500 starts carrying the same ID.
  const mergedCities = [...cities.filter(row => !supplementalIds.has(row[0])), ...supplementalRows];
  const supplementalSources = [{
    ...REVIEWED_SUPPLEMENT,
    archiveChecksum: createHash("sha256").update(supplementArchive.bytes).digest("hex"),
    ...(supplementArchive.lastModified ? { sourceLastModified: supplementArchive.lastModified } : {}),
  }];
  const sourceLastModified = archive.lastModified;
  const sourceChecksum = createHash("sha256").update(archive.bytes).digest("hex");
  const vintageDate = sourceLastModified ? new Date(sourceLastModified).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
  const payload = JSON.stringify({
    schemaVersion: 2,
    vintage: `geonames-cities500-${vintageDate}+hanle-v1`,
    ...(sourceLastModified ? { sourceLastModified } : {}),
    sourceChecksum,
    generatedAt: new Date().toISOString(),
    supplementalSources,
    cities: mergedCities,
  });
  await mkdir(dirname(outputPath), { recursive: true });
  const temporaryPath = `${outputPath}.tmp`;
  await writeFile(temporaryPath, gzipSync(payload, { level: 9 }));
  await rename(temporaryPath, outputPath);
  console.log(`Wrote ${mergedCities.length} GeoNames city records to ${outputPath} (vintage ${vintageDate}, ${Buffer.byteLength(payload)} bytes expanded).`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "GeoNames refresh failed.");
  process.exitCode = 1;
});
