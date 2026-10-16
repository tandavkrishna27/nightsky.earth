import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";
import test from "node:test";
import { candidateEvidenceIsValid, capacityCandidatePlaceId, percentiles, capacityConfiguration } from "../../scripts/verify-capacity";

test("release capacity requires explicit production pins and bounded workload", () => {
    const env = { NIGHTSKY_GEONAMES_INDEX: "cities", NIGHTSKY_GEONAMES_SHA256: "a".repeat(64), NIGHTSKY_ERA5_RELEASE_MANIFEST: "history", NIGHTSKY_ERA5_RELEASE_SHA256: "b".repeat(64), NIGHTSKY_GLOBAL_CATALOGUE_MANIFEST: "global", NIGHTSKY_GLOBAL_CATALOGUE_SHA256: "c".repeat(64), NIGHTSKY_CAPACITY_WORKLOAD: JSON.stringify({placeQuery:"Kodaikanal, India",placeId:"place:v1:geonames:1266425",month:10,window:{startUtc:"2026-10-13T12:00:00Z",endUtc:"2026-10-14T12:00:00Z",timeZone:"Asia/Kolkata"},expectedHistoryStatus:"available",candidatePlaceId:"place:v1:geonames:1277333"}) };
    assert.equal(capacityConfiguration(env, ["--offline", "--release"]).mode, "release");
    for (const key of Object.keys(env)) assert.throws(() => capacityConfiguration({...env,[key]:undefined}, ["--offline", "--release"]));
    assert.throws(() => capacityConfiguration(env, ["--offline", "--release", "--expect-no-candidates"]));
    assert.throws(() => capacityConfiguration({...env,NIGHTSKY_CLIMATE_ARTIFACT:"legacy"}, ["--offline", "--release"]));
    assert.throws(() => capacityConfiguration({...env,NIGHTSKY_CAPACITY_WORKLOAD:'{"month":13}'}, ["--offline", "--release"]));
});

test("retained capacity includes configured regional geography and validates paired pins", () => {
    const env={NIGHTSKY_GEONAMES_INDEX:"cities",NIGHTSKY_CLIMATE_ARTIFACT:"history",NIGHTSKY_CLIMATE_SHA256:"a".repeat(64),NIGHTSKY_OSM_REGIONAL_MANIFEST:"regions",NIGHTSKY_OSM_REGIONAL_SHA256:"b".repeat(64)};
    assert.equal(capacityConfiguration(env,["--offline"]).geography,"regional");
    assert.equal(capacityConfiguration(env,["--offline"]).mode,"retained");
    assert.throws(()=>capacityConfiguration({...env,NIGHTSKY_OSM_REGIONAL_SHA256:undefined},["--offline"]));
});

test("capacity can measure a reviewed candidate region separately from the historical region", () => {
    assert.equal(capacityCandidatePlaceId("place:v1:geonames:1266425"), "place:v1:geonames:1266425");
    assert.equal(capacityCandidatePlaceId("place:v1:geonames:1266425", "place:v1:geonames:1277333"), "place:v1:geonames:1277333");
    for (const value of ["", "place:v1:osm:way:1", "https://example.test/", "place:v1:geonames:0", "place:v1:geonames:99999999999999999999999999"]) {
        assert.throws(() => capacityCandidatePlaceId("place:v1:geonames:1266425", value));
    }
});
test("capacity report uses nearest-rank p50/p95 without mutating samples", () => {
    const samples = [20, 1, 3, 2];
    assert.deepEqual(percentiles(samples), { p50Ms: 2, p95Ms: 20 });
    assert.deepEqual(samples, [20, 1, 3, 2]);
    assert.throws(() => percentiles([]));
    assert.throws(() => percentiles([Infinity]));
});
test("configured candidate artifact cannot pass with unavailable or implicit empty coverage", () => {
    const result = { availability: { status: "not-covered", reason: "No nearby records" }, sources: [{ name: "OpenStreetMap contributors", url: "https://www.openstreetmap.org/copyright", attribution: "OSM", dataClass: "catalog", vintage: "2026-10-13" }], caveats: [], candidates: [], sortBasis: "distance-then-source-completeness", coverage: "reviewed extract" };
    assert.equal(candidateEvidenceIsValid(result), false);
    assert.equal(candidateEvidenceIsValid(result, true), true);
    assert.equal(candidateEvidenceIsValid({ ...result, availability: { status: "unavailable", reason: "Missing file" } }, true), false);
    assert.equal(candidateEvidenceIsValid({ ...result, sources: result.sources.map(source => ({ ...source, vintage: undefined })) }, true), false);
});

test("invalid candidate measurement configuration exits without leaving server resources alive", () => {
    const result = spawnSync(process.execPath, ["--import", "tsx", "scripts/verify-capacity.ts", "--offline"], {
        cwd: process.cwd(), encoding: "utf8", timeout: 15000,
        env: { ...process.env, NIGHTSKY_GEONAMES_INDEX: "unused-index", NIGHTSKY_CLIMATE_ARTIFACT: "unused-artifact", NIGHTSKY_CLIMATE_SHA256: "a".repeat(64), NIGHTSKY_CAPACITY_CANDIDATE_PLACE_ID: "invalid" },
    });
    assert.equal(result.error, undefined);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Invalid candidate measurement named-place ID/);
});


test("invalid covered release window cannot enter measurement",()=>{
 const env={NIGHTSKY_GEONAMES_INDEX:"cities",NIGHTSKY_CLIMATE_ARTIFACT:"history",NIGHTSKY_CLIMATE_SHA256:"a".repeat(64),NIGHTSKY_CAPACITY_WORKLOAD:JSON.stringify({placeQuery:"Test",placeId:"place:v1:geonames:1",candidatePlaceId:"place:v1:geonames:1",month:1,expectedHistoryStatus:"available",window:{startUtc:"bad",endUtc:"bad",timeZone:"bad"}})};
 assert.throws(()=>capacityConfiguration(env,["--offline"]));
});


test("shared production initialization serves pinned global geography through MCP", async()=>{
 const {mkdtemp,writeFile,rm}=await import("node:fs/promises");const {tmpdir}=await import("node:os");const {join}=await import("node:path");const {gzipSync}=await import("node:zlib");
 const {createServer}=await import("node:http");const {once}=await import("node:events");
 const {buildGlobalCatalogue}=await import("../../scripts/osm/build-global-catalogue");
 const {createConfiguredNightSkyPluginApp}=await import("../../server/plugin");
 const dir=await mkdtemp(join(tmpdir(),"capacity-global-"));const saved={...process.env};let server:ReturnType<typeof createServer>|undefined;
 try {
  for(const key of Object.keys(process.env))if(key.startsWith("NIGHTSKY_"))delete process.env[key];
  const source={name:"OSM",url:"https://openstreetmap.org",attribution:"Synthetic OSM fixture",dataClass:"catalog" as const,vintage:"synthetic"};
  const built=await buildGlobalCatalogue({catalogueRevision:"test-v1",candidates:[{placeId:"place:v1:osm:node:1",name:"Park",category:"park",latitude:1,longitude:0,accessEvidence:{status:"unknown"},sources:[source],caveats:[],catalogueRevision:"test-v1",sourceCompleteness:1,regionIds:[]}],regions:[],footprints:[{geometryBasis:"full-cell",footprintId:"test",bounds:{south:0,north:2,west:-1,east:1},sources:[source],vintage:"synthetic"}]},join(dir,"catalogue"));
  const cities=join(dir,"cities.gz");await writeFile(cities,gzipSync(JSON.stringify({schemaVersion:2,vintage:"synthetic",generatedAt:"2026-10-01T00:00:00Z",cities:[[1,"Test","Test","",1,0,"IN","India",1000,"UTC"]]})));
  Object.assign(process.env,{NIGHTSKY_GEONAMES_INDEX:cities,NIGHTSKY_GLOBAL_CATALOGUE_MANIFEST:built.path,NIGHTSKY_GLOBAL_CATALOGUE_SHA256:built.sha256});
  const app=await createConfiguredNightSkyPluginApp({log:()=>{},fetcher:async()=>{throw Error("No network");}});
  server=createServer(app).listen(0,"127.0.0.1");await once(server,"listening");const address=server.address();assert.ok(address&&typeof address!=="string");
  const response=await fetch(`http://127.0.0.1:${address.port}/mcp`,{method:"POST",headers:{"content-type":"application/json",accept:"application/json, text/event-stream"},body:JSON.stringify({jsonrpc:"2.0",id:1,method:"tools/call",params:{name:"search_observing_locations",arguments:{placeId:"place:v1:geonames:1"}}})});
  const body=await response.text();const event=body.split("\n").find(line=>line.startsWith("data: "));const payload=JSON.parse(event?event.slice(6):body);
  assert.equal(response.status,200);assert.equal(payload.result?.isError,undefined);assert.equal(candidateEvidenceIsValid(payload.result?.structuredContent,false,true),true);
  assert.equal(payload.result.structuredContent.candidates[0].placeId,"place:v1:osm:node:1");
  process.env.NIGHTSKY_GLOBAL_CATALOGUE_SHA256="0".repeat(64);await assert.rejects(createConfiguredNightSkyPluginApp({log:()=>{}}));
 } finally {if(server){const active=server;active.closeAllConnections();await new Promise<void>(done=>active.close(()=>done()));}for(const key of Object.keys(process.env))if(key.startsWith("NIGHTSKY_"))delete process.env[key];Object.assign(process.env,saved);await rm(dir,{recursive:true,force:true});}
});
