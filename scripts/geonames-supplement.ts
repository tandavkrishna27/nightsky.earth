import { createHash } from "node:crypto";
import { parseGeoNamesCityRow, type GeoNamesCityTuple } from "../server/places/geonames";
export const REVIEWED_SUPPLEMENT = {
  version: "hanle-v1", sourceKey: "geonames-country-IN-hanle-v1",
  url: "https://download.geonames.org/export/dump/IN.zip", entry: "IN.txt",
  geonameId: 1270426,
  rowChecksum: "aaa42b3448db57247c8ae71d03f5e818ef285cd162f9292ee6ae21e339b73ba2",
} as const;
export function reviewedSupplementRows(text: string, countries: ReadonlyMap<string,string>): GeoNamesCityTuple[] {
  const matches = text.split(/\r?\n/).filter(line => line.split("\t",1)[0] === String(REVIEWED_SUPPLEMENT.geonameId));
  if (!matches.length) throw new Error("Reviewed Hanle source record is missing; review coverage before publishing.");
  if (matches.length !== 1) throw new Error("Duplicate reviewed Hanle source record.");
  const line = matches[0]!;
  if (createHash("sha256").update(line).digest("hex") !== REVIEWED_SUPPLEMENT.rowChecksum) throw new Error("Hanle source record changed; a new provenance review is required.");
  const city = parseGeoNamesCityRow(line, countries);
  return [[city.geonameId,city.name,city.asciiName,city.alternateNames,city.latitude,city.longitude,city.countryCode,city.countryName,city.population,city.timeZone]];
}
import { unzipSync } from "fflate";
/** Select a single flat entry; check its declared size before fflate allocates output. */
export function extractGeoNamesEntry(archive: Uint8Array, expectedEntry: string, maxExpandedBytes = 256 * 1024 * 1024): Uint8Array {
  if (!/^[A-Za-z0-9]+\.txt$/.test(expectedEntry)) throw new Error("Invalid GeoNames archive entry path.");
  let selected = 0;
  const files = unzipSync(archive, {filter: entry => {
    if (entry.name.includes("..") || /[\\/]/.test(entry.name)) throw new Error("Invalid GeoNames archive entry path.");
    if (entry.name !== expectedEntry) return false;
    selected += 1;
    if (selected > 1) throw new Error("Duplicate expected GeoNames archive entry.");
    if (entry.originalSize > maxExpandedBytes) throw new Error("GeoNames archive exceeds expanded limit.");
    return true;
  }});
  const bytes = files[expectedEntry];
  if (!bytes) throw new Error("Expected GeoNames archive entry is missing.");
  if (bytes.byteLength > maxExpandedBytes) throw new Error("GeoNames archive exceeds expanded limit.");
  return bytes;
}
