/** One explicitly invoked offline source spike; never imported by runtime handlers. */
import { mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";
import { importOsmJson } from "../../server/places/importOsm";

export const ENDPOINT = "https://overpass-api.de/api/interpreter";
export const BOXES = {
  Hanle: [32.65, 78.8, 32.9, 79.1],
  Kodaikanal: [10.1, 77.35, 10.35, 77.6],
  Munnar: [9.95, 76.95, 10.2, 77.2],
};
const filters = ['["leisure"~"^(park|nature_reserve)$"]', '["tourism"~"^(viewpoint|camp_site|caravan_site)$"]', '["boundary"="national_park"]', '["protect_class"]', '["natural"="beach"]'];
export const QUERY = `[out:json][timeout:60][maxsize:33554432];\n(\n${Object.values(BOXES).flatMap(box => filters.map(filter => `node["name"]${filter}(${box.join(",")});`)).join("\n")}\n);\nout body;`;
export const COVERAGE = "Partial node-only named OSM candidates within Hanle (32.65,78.8,32.9,79.1), Kodaikanal (10.1,77.35,10.35,77.6), Munnar (9.95,76.95,10.2,77.2) boxes; excludes ways, relations, unnamed nodes and outside boxes.";
const LIMIT = 2 * 1024 * 1024;

export function normalizePilot(raw: any) {
  if (!raw || raw.remark !== undefined) throw new TypeError("Partial/error Overpass response cannot be published.");
  const vintage = raw.osm3s?.timestamp_osm_base;
  if (typeof vintage !== "string" || !Number.isFinite(Date.parse(vintage))) throw new TypeError("Source timestamp is required.");
  if (!Array.isArray(raw.elements) || raw.elements.length > 10000) throw new RangeError("Pilot requires at most 10,000 rows.");
  for (const node of raw.elements) {
    if (node.type !== "node" || !Object.values(BOXES).some(([s,w,n,e]) => node.lat >= s && node.lat <= n && node.lon >= w && node.lon <= e)) throw new TypeError("Pilot contains an unexpected element or outside-box node.");
  }
  return importOsmJson({ elements: raw.elements }, { vintage, coverage: COVERAGE });
}

export async function retrievePilot(fetcher: typeof fetch = fetch) {
  const started = performance.now();
  const controller = new AbortController();
  const deadline = setTimeout(() => controller.abort(), 90000);
  try {
    const response = await fetcher(ENDPOINT, { method: "POST", signal: controller.signal, redirect: "error", headers: { "content-type": "application/x-www-form-urlencoded", "user-agent": "NightSky.earth/0.1 nightsky.earth2026@gmail.com" }, body: new URLSearchParams({ data: QUERY }) });
    if (!response.ok || !response.body) throw new Error(`Overpass response ${response.status}; no retry.`);
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let bytes = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        bytes += value.length;
        if (bytes > LIMIT) throw new RangeError("Decoded Overpass reply exceeds 2 MiB.");
        chunks.push(value);
      }
    } finally { await reader.cancel(); }
    const payload = Buffer.concat(chunks);
    const index = normalizePilot(JSON.parse(payload.toString("utf8")));
    const normalized = Buffer.from(JSON.stringify(index) + "\n");
    if (normalized.length > LIMIT || performance.now() - started >= 90000) throw new RangeError("Artifact size/deadline bound exceeded.");
    return { payload, normalized, index, report: { endpoint: ENDPOINT, query: QUERY, boxes: BOXES, retrievedAt: new Date().toISOString(), sourceTimestamp: index.vintage, responseBytes: bytes, artifactBytes: normalized.length, candidateCount: index.candidates.length, responseSha256: createHash("sha256").update(payload).digest("hex"), artifactSha256: createHash("sha256").update(normalized).digest("hex"), elapsedSeconds: (performance.now()-started)/1000, headers: Object.fromEntries(["date", "content-type", "content-encoding", "last-modified"].map(key => [key, response.headers.get(key)])), licenseUrl: index.source.licenseUrl, coverage: COVERAGE } };
  } finally { clearTimeout(deadline); }
}

async function main() {
  const folder = resolve(process.argv[2] ?? ".data/osm/overpass-three-boxes-20261013-v1");
  await mkdir(folder); // Refuse existing versions before making a source request.
  await writeFile(join(folder, "query.ql"), QUERY, { flag: "wx" });
  const pilot = await retrievePilot(); // Exactly one request, no retry/fallback.
  await writeFile(join(folder, "response.json"), pilot.payload, { flag: "wx" });
  await writeFile(join(folder, "provenance.json"), JSON.stringify(pilot.report, null, 2), { flag: "wx" });
  await writeFile(join(folder, "candidates.json"), pilot.normalized, { flag: "wx" });
  console.log(JSON.stringify(pilot.report, null, 2));
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await main();
