import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, mkdir, writeFile, readFile, rm, realpath,stat,utimes } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { GeoNamesPlaceIndex } from "../../../server/places/geonames";
import { sourceRecordSchema } from "../../../shared/nightsky/common";

if (process.env.CI && process.platform === "win32") console.error("ERA5 fixture temp path diagnostic", JSON.stringify({requested:tmpdir(),canonical:await realpath(tmpdir())}));
const sha = (value: string | Buffer) => createHash("sha256").update(value).digest("hex");
async function builder() {
  const loaded = await import("../../../scripts/era5/build-pilot").catch(() => undefined);
  assert.ok(loaded?.buildPilot, "full-year builder must exist");
  return loaded!;
}
const places = new GeoNamesPlaceIndex([
  [1270426,"Hanle","Hanle","",32.78943,78.9962,"IN","India",0,"Asia/Kolkata"],
  [1266425,"Kodaikanal","Kodaikanal","",10.23925,77.48932,"IN","India",0,"Asia/Kolkata"],
  [1262463,"Munnar","Munnar","",10.08818,77.06239,"IN","India",0,"Asia/Kolkata"],
], "offline-fixture");
async function fixture(api: Awaited<ReturnType<typeof builder>>, historical:false|{startYear:number;endYear:number}|true=false) {
  const root = await realpath(await mkdtemp(join(await realpath(tmpdir()), "era5-builder-")));
  await mkdir(join(root,"raw")); await mkdir(join(root,"decoded"));
  const manifest = historical ? api.reviewedHistoricalManifest(historical===true?1991:historical.startYear,historical===true?1992:historical.endYear) : api.reviewedPilotManifest();
  const entries = [];
  for (const chunk of manifest.chunks) {
    const raw = Buffer.from(`offline-${chunk.chunkId}`);
    const cells = manifest.cellCoverage[chunk.region]!.cells.map(([latitude,longitude]) => ({cellId:`era5:${latitude}:${longitude}`,latitude,longitude}));
    const header = {type:"header",schemaVersion:1,sourceSha256:sha(raw),sourceDoi:"10.24381/cds.adbb2d47",dataClass:"reanalysis",units:"fraction",sourceUnits:"1",timeUnits:"hours since 1900-01-01",calendar:"standard",experimentVersions:["0001"],member:0,institution:"ECMWF",gridSpacingDegrees:0.25,cells,decoderVersions:{netCDF4:"1.7.3",numpy:"2.5.4"},rowCount:1};
    const atUtc = `${chunk.request.year[0]}-${chunk.request.month[0]}-${chunk.request.day[0]}T18:00:00Z`;
    const decoded = JSON.stringify(header)+"\n"+JSON.stringify({type:"sample",atUtc,values:cells.map(()=>0.25)})+"\n";
    await writeFile(join(root,"raw",chunk.chunkId+".nc"),raw);
    await writeFile(join(root,"decoded",chunk.chunkId+".jsonl"),decoded);
    entries.push({chunkId:chunk.chunkId,complete:true,rawSha256:sha(raw),decodedSha256:sha(decoded),sourceRevision:["0001"],sourceRows:1,expectedRows:chunk.expectedHours,missingSourceHours:chunk.expectedHours-1,rawBytes:raw.length,decodedBytes:Buffer.byteLength(decoded),decoderVersions:header.decoderVersions});
  }
  const ledger = {schemaVersion:1,manifestSha256:api.manifestDigest(manifest),entries};
  await writeFile(join(root,"manifest.json"),JSON.stringify(manifest));
  await writeFile(join(root,"ledger.json"),JSON.stringify(ledger));
  return {root,manifest,ledger,output:join(root,"full-year-sample.json")};
}

test("missing reviewed chunks preserve previous artifact and never claim full-year", async () => {
  const api = await builder(); const f = await fixture(api);
  try {
    f.ledger.entries.pop(); await writeFile(join(f.root,"ledger.json"),JSON.stringify(f.ledger));
    await writeFile(f.output,"previous");
    await assert.rejects(api.buildPilot({root:f.root,output:f.output,index:places}), /missing|required/i);
    assert.equal(await readFile(f.output,"utf8"),"previous");
  } finally { await rm(f.root,{recursive:true,force:true}); }
});
test("complete reviewed tiny inputs produce deterministic shared keys and explicit missing coverage", async () => {
  const api = await builder(); const f = await fixture(api);
  try {
    const result = await api.buildPilot({root:f.root,output:f.output,index:places});
    const first = await readFile(f.output,"utf8");
    const artifact = JSON.parse(first);
    assert.equal(artifact.sampleKind,"sample-only"); assert.equal(artifact.sources.length,28);
    assert.equal(artifact.places.length,3); assert.equal(artifact.aggregates.length,3);
    assert.equal(artifact.places[0].key,"era5:32.75:79|Asia/Kolkata");
    assert.equal(artifact.places[0].indexVintage,"offline-fixture");
    assert.equal(artifact.aggregates[0].monthly.length,12);
    assert.ok(artifact.aggregates[0].annual.missingEligibleSamples>0);
    assert.equal(artifact.aggregates[0].monthly[0].quality,"sample-only");
    assert.equal(result.sha256,sha(first)); assert.equal(result.artifactBytes,Buffer.byteLength(first));
    assert.ok(result.wallSeconds>=0 && result.cpuSeconds>=0 && result.processPeakRssBytes>0);
    await api.buildPilot({root:f.root,output:f.output,index:places}); assert.equal(await readFile(f.output,"utf8"),first);
  } finally { await rm(f.root,{recursive:true,force:true}); }
});
test("changed checkpoints, duplicate ledger, source metadata and unreviewed manifest fail before publish", async () => {
  const api = await builder();
  for (const mutation of ["hash","duplicate","revision","manifest","rows","timezone","outside","cells","completion"] as const) {
    const f = await fixture(api);
    try {
      let index = places;
      const entry = f.ledger.entries[0]!;
      if(mutation==="hash") await writeFile(join(f.root,"raw",entry.chunkId+".nc"),"changed");
      if(mutation==="duplicate") f.ledger.entries[1] = entry;
      if(mutation==="revision") entry.sourceRevision=["0005"];
      if(mutation==="rows") entry.missingSourceHours=0;
      if(mutation==="completion") entry.complete=1 as unknown as boolean;
      if(mutation==="manifest") {f.manifest.year=2024; await writeFile(join(f.root,"manifest.json"),JSON.stringify(f.manifest));}
      if(mutation==="timezone") index = new GeoNamesPlaceIndex([[1270426,"Hanle","Hanle","",32.78943,78.9962,"IN","India",0,"bad-zone"]],"fixture");
      if(mutation==="outside" || mutation==="cells") {
        const path=join(f.root,"decoded",entry.chunkId+".jsonl");
        const lines=(await readFile(path,"utf8")).trim().split("\n");
        const header=JSON.parse(lines[0]!); const row=JSON.parse(lines[1]!);
        if(mutation==="outside") row.atUtc="2025-01-01T18:00:00Z";
        else {header.cells[0]={cellId:"era5:0:0",latitude:0,longitude:0};}
        const text=JSON.stringify(header)+"\n"+JSON.stringify(row)+"\n";
        await writeFile(path,text); entry.decodedSha256=sha(text); entry.decodedBytes=Buffer.byteLength(text);
      }
      await writeFile(join(f.root,"ledger.json"),JSON.stringify(f.ledger));
      await assert.rejects(api.buildPilot({root:f.root,output:f.output,index}));
      await assert.rejects(readFile(f.output));
    } finally {await rm(f.root,{recursive:true,force:true});}
  }
});
test("artifact output cannot overwrite writer lock or retrieval control files", async () => {
  const api=await builder();const f=await fixture(api);
  try {
    for(const name of [".writer.lock","remote-ledger.json","manifest.json","ledger.json"]) {
      if(name!==".writer.lock") await writeFile(join(f.root,name),"control");
      await assert.rejects(api.buildPilot({root:f.root,output:join(f.root,name),index:places}),/artifact|output/i);
      if(name!==".writer.lock") assert.equal(await readFile(join(f.root,name),"utf8"),"control");
    }
  } finally {await rm(f.root,{recursive:true,force:true});}
});
test("published source checkpoint refuses a coherently rehashed source replacement", async () => {
  const api=await builder();const f=await fixture(api);
  try {
    await api.buildPilot({root:f.root,index:places});const previous=await readFile(f.output,"utf8");
    const entry=f.ledger.entries[0]!;const raw=Buffer.from("new-source");
    const path=join(f.root,"decoded",entry.chunkId+".jsonl");const lines=(await readFile(path,"utf8")).trim().split("\n");
    const header=JSON.parse(lines[0]!);header.sourceSha256=sha(raw);
    const text=JSON.stringify(header)+"\n"+lines[1]+"\n";
    await writeFile(join(f.root,"raw",entry.chunkId+".nc"),raw);await writeFile(path,text);
    Object.assign(entry,{rawSha256:sha(raw),rawBytes:raw.length,decodedSha256:sha(text),decodedBytes:Buffer.byteLength(text)});
    await writeFile(join(f.root,"ledger.json"),JSON.stringify(f.ledger));
    await assert.rejects(api.buildPilot({root:f.root,index:places}),/previous artifact source checkpoint/i);
    assert.equal(await readFile(f.output,"utf8"),previous);
  } finally {await rm(f.root,{recursive:true,force:true});}
});
test("oversized decoded chunk fails without publishing or leaving a writer lock", async () => {
  const api=await builder();const f=await fixture(api);
  try {
    const entry=f.ledger.entries[0]!;const text=" ".repeat(4*1024*1024+1);
    await writeFile(join(f.root,"decoded",entry.chunkId+".jsonl"),text);
    Object.assign(entry,{decodedSha256:sha(text),decodedBytes:Buffer.byteLength(text)});
    await writeFile(join(f.root,"ledger.json"),JSON.stringify(f.ledger));
    await assert.rejects(api.buildPilot({root:f.root,index:places}),/byte bound/i);
    await assert.rejects(readFile(f.output));await assert.rejects(readFile(join(f.root,".writer.lock")));
  } finally {await rm(f.root,{recursive:true,force:true});}
});
test("cross-chunk dawn counts belong to prior observing month and December year boundary", async () => {
  const api=await builder();const f=await fixture(api);
  try {
    for(const id of ["hanle-2025-01","hanle-2025-02","hanle-2026-01-boundary"]) {
      const entry=f.ledger.entries.find(row=>row.chunkId===id)!;
      const path=join(f.root,"decoded",id+".jsonl");const lines=(await readFile(path,"utf8")).trim().split("\n");
      const row=JSON.parse(lines[1]!);row.atUtc=row.atUtc.replace("T18:","T00:");
      const text=lines[0]+"\n"+JSON.stringify(row)+"\n";
      await writeFile(path,text);Object.assign(entry,{decodedSha256:sha(text),decodedBytes:Buffer.byteLength(text)});
    }
    await writeFile(join(f.root,"ledger.json"),JSON.stringify(f.ledger));
    await api.buildPilot({root:f.root,index:places});const artifact=JSON.parse(await readFile(f.output,"utf8"));
    const hanle=artifact.aggregates[0];
    // Jan 1 00Z belongs to excluded 2024-12-31. Feb 1 00Z belongs to Jan 31.
    // Jan 1 2026 00Z belongs to Dec 31 2025. All retained values equal 0.25.
    assert.equal(hanle.monthly[0].validEligibleSamples,1);
    assert.equal(hanle.monthly[1].validEligibleSamples,0);
    assert.equal(hanle.monthly[11].validEligibleSamples,2);
    assert.equal(hanle.annual.validEligibleSamples,12);
    assert.deepEqual(hanle.annual.thresholds.map((row:{count:number})=>row.count),[0,12,12]);
    assert.equal(hanle.annual.meanCloudFraction,0.25);
  } finally {await rm(f.root,{recursive:true,force:true});}
});
test("builder launcher kills a stalled child within a bounded deadline", async () => {
  const api=await builder();
  assert.equal(typeof api.launchBoundedWorker,"function","bounded worker launcher must exist");
  const f=await fixture(api);
  try {
    await writeFile(f.output,"previous-published-artifact");
    const code="const fs=require('node:fs'),path=require('node:path');fs.writeFileSync(path.join(process.argv[1],'.writer.lock'),'interrupted');process.on('SIGTERM',()=>{});process.stdout.write(String(process.pid));setInterval(()=>{},1000)";
    const started=performance.now();const result=api.launchBoundedWorker(process.execPath,["-e",code,f.root],1000);
    assert.equal(result.error?.code,"ETIMEDOUT");
    assert.ok(performance.now()-started<5000,"worker must not survive the short deadline");
    const pid=Number(result.stdout.toString());assert.ok(Number.isInteger(pid)&&pid>0);
    assert.throws(()=>process.kill(pid,0),/ESRCH|no such process/i);
    assert.equal(await readFile(f.output,"utf8"),"previous-published-artifact");
    assert.equal(await readFile(join(f.root,".writer.lock"),"utf8"),"interrupted");
    await assert.rejects(api.buildPilot({root:f.root,index:places}),/EEXIST/);
  } finally {await rm(f.root,{recursive:true,force:true});}
});
test("builder launcher rejects deadlines above thirty minutes and caps child output", async () => {
  const api=await builder();
  assert.equal(typeof api.launchBoundedWorker,"function","bounded worker launcher must exist");
  for(const deadline of [0,-1,1800001,NaN,Infinity]) assert.throws(()=>api.launchBoundedWorker("must-not-launch",[],deadline),/deadline/i);
  const result=api.launchBoundedWorker(process.execPath,["-e","process.stdout.write('x'.repeat(8*1024*1024)); setInterval(()=>{},1000)"],2000);
  assert.equal(result.error?.code,"ENOBUFS");
});
test("published sample carries licensed ERA5 attribution and supplied-grid provenance", async () => {
  const api=await builder();const f=await fixture(api);
  try {
    await api.buildPilot({root:f.root,index:places});const artifact=JSON.parse(await readFile(f.output,"utf8"));
    assert.ok(artifact.sourceProvenance,"derived artifact must carry ERA5 licence and attribution");
    const source=sourceRecordSchema.parse(artifact.sourceProvenance);
    assert.equal(source.dataClass,"reanalysis");
    assert.equal(source.url,"https://doi.org/10.24381/cds.adbb2d47");
    assert.equal(source.licenseUrl,"https://creativecommons.org/licenses/by/4.0/");
    assert.equal(source.modified,true);assert.match(source.attribution,/Copernicus.*ECMWF/);
    assert.match(source.attribution,/derived.*hourly dark-time cloud aggregation/i);
    assert.equal(artifact.gridProvenance.suppliedSpacingDegrees,0.25);
    assert.equal(artifact.gridProvenance.nativeResolutionApproxKm,31);
  } finally {await rm(f.root,{recursive:true,force:true});}
});

test("Windows pilot fixed output accepts equivalent drive-letter casing",{skip:process.platform!=="win32"},async()=>{const api=await builder();const f=await fixture(api);try{const path=f.output;const alternate=(path[0]===path[0].toUpperCase()?path[0].toLowerCase():path[0].toUpperCase())+path.slice(1);await api.buildPilot({root:f.root,output:alternate,index:places});assert.equal(JSON.parse(await readFile(f.output,"utf8")).year,2025);}finally{await rm(f.root,{recursive:true,force:true});}});


test("historical builder requires reviewed digest and emits two independent annual denominators", async()=>{
 const api=await builder();const f=await fixture(api,true);
 try {
  const history={startYear:1991,endYear:1992,generatedAt:"2026-10-13T18:00:00Z",expectedManifestSha256:api.manifestDigest(f.manifest)};
  await assert.rejects(api.buildPilot({root:f.root,index:places,history:{...history,expectedManifestSha256:"0".repeat(64)}}),/review|manifest/i);
  const result=await api.buildPilot({root:f.root,index:places,history});
  const output=JSON.parse(await readFile(result.output,"utf8"));
  assert.equal(output.schemaVersion,2);
  assert.equal(output.manifest.generatedAt,"2026-10-13T18:00:00Z");
  assert.equal(output.manifest.period.kind,"sample-only");
  assert.equal(output.tiles[0].yearMonthly.length,2);
  assert.equal(output.manifest.sourceRevisions.length,105);
  assert.ok(output.tiles[0].bins.some((b:any)=>b.expected>b.valid));
  const {publishClimateTiles}=await import("../../../scripts/era5/build-tiles");
  const report=await publishClimateTiles({inputPath:result.output,expectedSha256:result.sha256,outputDirectory:join(f.root,"historical-release"),generatedAt:history.generatedAt});
  const {createTiledEra5ClimateProvider}=await import("../../../server/providers/climate/tiledEra5");
  const provider=createTiledEra5ClimateProvider({index:places,artifactPath:report.manifestPath,expectedSha256:report.manifestSha256});
  const context=await provider.getClimatology("place:v1:geonames:1270426",1);
  assert.equal(context.period.startNight,"1991-01-01");
  assert.equal(context.period.endNight,"1992-12-31");
  assert.equal(context.availability.status,"partial");
  const prior=await readFile(result.output,"utf8");
  for(const changed of [
   {history:{...history,generatedAt:"2026-10-14T18:00:00Z"},index:places},
   {history,index:new GeoNamesPlaceIndex([[1270426,"Hanle","Hanle","",32.78943,78.9962,"IN","India",0,"Asia/Kolkata"],[1266425,"Kodaikanal","Kodaikanal","",10.23925,77.48932,"IN","India",0,"Asia/Kolkata"],[1262463,"Munnar","Munnar","",10.08818,77.06239,"IN","India",0,"Asia/Kolkata"]],"changed-vintage")},
   {history,index:new GeoNamesPlaceIndex([[1270426,"Hanle","Hanle","",32.78943,78.76,"IN","India",0,"Asia/Kolkata"],[1266425,"Kodaikanal","Kodaikanal","",10.23925,77.48932,"IN","India",0,"Asia/Kolkata"],[1262463,"Munnar","Munnar","",10.08818,77.06239,"IN","India",0,"Asia/Kolkata"]],"offline-fixture")},
  ]) {
   await assert.rejects(api.buildPilot({root:f.root,...changed}),/previous|immutable|version/i);
   assert.equal(await readFile(result.output,"utf8"),prior);
  }
  await writeFile(result.output,prior+" ");
  await assert.rejects(api.buildPilot({root:f.root,index:places,history}),/previous|immutable|version/i);
  assert.equal(await readFile(result.output,"utf8"),prior+" ");
  await writeFile(result.output,prior);
  await utimes(result.output,new Date("2020-01-01"),new Date("2020-01-01"));
  const before=(await stat(result.output)).mtimeMs;
  await api.buildPilot({root:f.root,index:places,history});
  assert.equal((await stat(result.output)).mtimeMs,before);
 }finally{await rm(f.root,{recursive:true,force:true});}
});


test("fictional 30-year sparse builder evidence remains partial through the schema2 provider",async()=>{
 const api=await builder();const f=await fixture(api,{startYear:1991,endYear:2020});
 try {
  const history={startYear:1991,endYear:2020,generatedAt:"2026-10-13T18:00:00Z",expectedManifestSha256:api.manifestDigest(f.manifest)};
  const result=await api.buildPilot({root:f.root,index:places,history});
  const value=JSON.parse(await readFile(result.output,"utf8"));
  assert.equal(value.manifest.period.kind,"baseline-1991-2020");
  assert.equal(value.tiles[0].yearMonthly.length,30);
  // Label the synthetic publication explicitly; builder inputs are engineering fixtures.
  value.manifest.sourceProvenance.name="Fictional engineering fixture; not real ERA5 measurements";
  value.manifest.sourceProvenance.attribution="Fictional software validation only; contains no measured climate evidence.";
  const fictionalBytes=JSON.stringify(value);
  await writeFile(result.output,fictionalBytes);
  const {publishClimateTiles}=await import("../../../scripts/era5/build-tiles");
  const report=await publishClimateTiles({inputPath:result.output,expectedSha256:sha(fictionalBytes),outputDirectory:join(f.root,"fictional-baseline-release"),generatedAt:history.generatedAt});
  const {createTiledEra5ClimateProvider}=await import("../../../server/providers/climate/tiledEra5");
  const context=await createTiledEra5ClimateProvider({index:places,artifactPath:report.manifestPath,expectedSha256:report.manifestSha256}).getClimatology("place:v1:geonames:1270426",1);
  assert.equal(context.availability.status,"partial");
  assert.ok(context.summary!.completeness<.9);
  assert.match(context.sources[0]!.name,/Fictional/);
 }finally{await rm(f.root,{recursive:true,force:true});}
});
