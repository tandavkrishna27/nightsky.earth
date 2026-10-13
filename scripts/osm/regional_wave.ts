/** Explicit offline acquisition/build command. Never imported by runtime. */
import { mkdir, open, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";
import { importOsmJson } from "../../server/places/importOsm";
import { ENDPOINT } from "./overpass_pilot";
export const BOXES = { Bengaluru: [12.6,77.2,13.4,78], Nilgiris: [11,76.3,11.8,77.1], Kochi: [9.5,76,10.3,76.8], Chennai: [12.7,79.9,13.5,80.4] };
const filters = ['["leisure"~"^(park|nature_reserve)$"]','["tourism"~"^(viewpoint|camp_site|caravan_site)$"]','["boundary"="national_park"]','["protect_class"]','["natural"="beach"]'];
export const QUERY = `[out:json][timeout:60][maxsize:134217728];\n(\n${Object.values(BOXES).flatMap(box => ["node","way"].flatMap(type => filters.map(filter => `${type}["name"]${filter}(${box.join(",")});`))).join("\n")}\n);\nout body center;`;
export const COVERAGE = "Partial named nodes and ways intersecting Bengaluru, Nilgiris, Kochi and Chennai boxes (see provenance); ways use Overpass bounding-box centers, not entrances. Excludes relations, unnamed features and outside coverage. Access/permission unknown.";
export const LIMIT = 4*1024*1024;
const hash = (data: Buffer) => createHash("sha256").update(data).digest("hex");
export function normalizeWave(raw: any) {
  if (!raw || raw.remark !== undefined) throw new TypeError("Partial Overpass response refused.");
  const vintage = raw.osm3s?.timestamp_osm_base;
  if (typeof vintage !== "string" || !Number.isFinite(Date.parse(vintage))) throw new TypeError("Source timestamp required.");
  if (!Array.isArray(raw.elements) || raw.elements.length > 10000) throw new RangeError("At most 10,000 source elements allowed.");
  const identities = new Set<string>();
  for (const element of raw.elements) {
    if (!element || typeof element !== "object" || Array.isArray(element)) throw new TypeError("Selected row must be an object.");
    if (element.type !== "node" && element.type !== "way") throw new TypeError("Unexpected element type.");
    if (!Number.isSafeInteger(element.id) || element.id <= 0) throw new TypeError("Selected row ID must be a positive safe integer.");
    const identity = `${element.type}/${element.id}`;
    if (identities.has(identity)) throw new TypeError("Duplicate selected source identity.");
    identities.add(identity);
    const tags = element.tags;
    if (!tags || typeof tags !== "object" || Array.isArray(tags) || Object.values(tags).some(value => typeof value !== "string")) throw new TypeError("Selected tags must be a string-valued object.");
    if (typeof tags.name !== "string" || !tags.name.normalize("NFKC").replace(/[\u0000-\u001f\u007f-\u009f]/g, " ").trim()) throw new TypeError("Selected row requires a nonempty name.");
    if (!(tags.leisure === "park" || tags.leisure === "nature_reserve" || ["viewpoint", "camp_site", "caravan_site"].includes(tags.tourism) || tags.boundary === "national_park" || Object.hasOwn(tags, "protect_class") || tags.natural === "beach")) throw new TypeError("Selected row has no requested category.");
    const point = element.type === "node" ? element : element.center;
    if (!point || !Number.isFinite(point.lat) || !Number.isFinite(point.lon)) throw new TypeError("Supplied node location/way center required.");
    // A selected way intersects its source box; its bounding-box center can lie outside it.
    if (element.type === "node" && !Object.values(BOXES).some(([s,w,n,e]) => point.lat >= s && point.lat <= n && point.lon >= w && point.lon <= e)) throw new TypeError("Node outside reviewed boxes.");
  }
  const index = importOsmJson({ elements: raw.elements }, { vintage, coverage: COVERAGE });
  if (index.candidates.length !== raw.elements.length) throw new TypeError("Selected rows were lost during normalization.");
  return index;
}
export function buildWave(payload: Buffer, expectedSha256?: string) {
  if (payload.length > LIMIT) throw new RangeError("4 MiB input limit exceeded.");
  if(expectedSha256!==undefined && (!/^[a-f0-9]{64}$/i.test(expectedSha256) || hash(payload)!==expectedSha256.toLowerCase())) throw new TypeError("Reviewed source checksum mismatch.");
  const index = normalizeWave(JSON.parse(payload.toString("utf8")));
  const normalized = Buffer.from(JSON.stringify(index)+"\n");
  if (normalized.length > LIMIT) throw new RangeError("4 MiB artifact limit exceeded.");
  return { index, normalized, responseSha256: hash(payload), artifactSha256: hash(normalized) };
}
export async function retrieveWave(fetcher: typeof fetch = fetch) {
  const start = performance.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(),90000);
  try {
    const response = await fetcher(ENDPOINT,{method:"POST",signal:controller.signal,redirect:"error",headers:{"content-type":"application/x-www-form-urlencoded","user-agent":"NightSky.earth/0.1 nightsky.earth2026@gmail.com"},body:new URLSearchParams({data:QUERY})});
    if (!response.ok || !response.body) throw new Error(`Overpass ${response.status}; no automatic retry.`);
    const chunks: Uint8Array[] = []; let bytes=0;
    const reader=response.body.getReader();
    try { while (true) { const {done,value}=await reader.read(); if(done)break; bytes+=value.length; if(bytes>LIMIT)throw new RangeError("4 MiB decoded response limit exceeded."); chunks.push(value); } } finally { await reader.cancel(); }
    const payload=Buffer.concat(chunks); const built=buildWave(payload);
    if(performance.now()-start>=90000)throw new RangeError("90 second publication deadline exceeded.");
    return {payload,...built,report:{endpoint:ENDPOINT,query:QUERY,boxes:BOXES,retrievedAt:new Date().toISOString(),sourceTimestamp:built.index.vintage,responseBytes:bytes,artifactBytes:built.normalized.length,candidateCount:built.index.candidates.length,nodeCount:built.index.candidates.filter(x=>x.osmType==="node").length,wayCount:built.index.candidates.filter(x=>x.osmType==="way").length,responseSha256:built.responseSha256,artifactSha256:built.artifactSha256,elapsedSeconds:(performance.now()-start)/1000,peakRssBytes:process.resourceUsage().maxRSS*1024,limits:{wallSeconds:90,decodedBytes:LIMIT,sourceElements:10000,serverMaxsizeBytes:134217728},coverage:COVERAGE,licenseUrl:built.index.source.licenseUrl}};
  } finally {clearTimeout(timer);}
}
async function main() {
  const mode=process.argv[2]; const folder=resolve(process.argv[3]??".data/osm/south-india-wave-20261014-v1");
  await mkdir(folder); // refuse prior versions before any request
  if(mode==="rebuild") {
    if(!process.argv[4] || !process.argv[5])throw new Error("Rebuild requires SOURCE_RESPONSE EXPECTED_SOURCE_SHA256.");
    const source=resolve(process.argv[4]);
    const handle=await open(source,"r"); let payload:Buffer;
    try {
      if(!(await handle.stat()).isFile() || (await handle.stat()).size>LIMIT)throw new RangeError("4 MiB source file limit exceeded.");
      const bytes=Buffer.alloc(LIMIT+1); let total=0;
      while(total<bytes.length){const result=await handle.read(bytes,total,bytes.length-total,null);if(!result.bytesRead)break;total+=result.bytesRead;}
      if(total>LIMIT)throw new RangeError("4 MiB source file limit exceeded.");
      payload=bytes.subarray(0,total);
    } finally {await handle.close();}
    const built=buildWave(payload,process.argv[5]);
    await writeFile(join(folder,"candidates.json"),built.normalized,{flag:"wx"});
    console.log(JSON.stringify({candidateCount:built.index.candidates.length,responseSha256:built.responseSha256,artifactSha256:built.artifactSha256})); return;
  }
  if(mode!=="acquire")throw new Error("Use acquire OUTPUT or rebuild OUTPUT SOURCE_RESPONSE.");
  await writeFile(join(folder,"query.ql"),QUERY,{flag:"wx"});
  const result=await retrieveWave();
  await writeFile(join(folder,"response.json"),result.payload,{flag:"wx"});
  await writeFile(join(folder,"candidates.json"),result.normalized,{flag:"wx"});
  await writeFile(join(folder,"provenance.json"),JSON.stringify(result.report,null,2)+"\n",{flag:"wx"});
  console.log(JSON.stringify(result.report,null,2));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await main();
