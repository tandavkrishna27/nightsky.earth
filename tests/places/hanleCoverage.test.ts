import assert from "node:assert/strict";
import test from "node:test";
import * as supplement from "../../scripts/geonames-supplement";
const row = "1270426\tHanle\tHanle\tHanle\t32.78943\t78.9962\tP\tPPL\tIN\t\t41\t003\t7162\t\t0\t\t4269\tAsia/Kolkata\t2024-01-07";
test("reviewed country supplement selects the real Hanle identity and ignores unreviewed rows", () => {
  assert.equal(typeof supplement.reviewedSupplementRows, "function");
  const rows = supplement.reviewedSupplementRows(`${row}\n${row.replace("1270426", "9999999")}\n`, new Map([["IN", "India"]]));
  assert.deepEqual(rows, [[1270426,"Hanle","Hanle","Hanle",32.78943,78.9962,"IN","India",0,"Asia/Kolkata"]]);
});
test("missing or changed reviewed record blocks refresh instead of silently trusting it", () => {
  assert.equal(typeof supplement.reviewedSupplementRows, "function");
  assert.throws(() => supplement.reviewedSupplementRows("", new Map()), /missing/i);
  assert.throws(() => supplement.reviewedSupplementRows(row.replace("32.78943", "32.8"), new Map()), /review/i);
  assert.throws(() => supplement.reviewedSupplementRows(`${row}\n${row}`, new Map()), /duplicate/i);
});
import { loadGeoNamesPlaceIndex, resolvePlace } from "../../server/places/geonames";
test("installed artifact resolves Hanle with country extract provenance and preserves global coverage", async (t) => {
 const index = await loadGeoNamesPlaceIndex(); if (!index) {t.skip("Local data artifact is not installed; run data refresh for installed coverage smoke.");return;} assert.ok(index); assert.ok(index.size > 100000);
 const result = await resolvePlace({placeQuery:"Hanle, India"}, {index});
 assert.equal(result.matches[0]?.placeId,"place:v1:geonames:1270426");
 assert.equal(result.matches[0]?.timeZone,"Asia/Kolkata");
 assert.equal(result.sources[0]?.url,"https://download.geonames.org/export/dump/IN.zip");
 assert.equal(result.matches[0]?.sources[0]?.url,"https://download.geonames.org/export/dump/IN.zip");
 assert.equal(result.matches[0]?.sources[0]?.product,"GeoNames country IN reviewed supplement hanle-v1");
 for(const query of ["Pune, India","London, United Kingdom","Apia, Samoa"])assert.ok((await resolvePlace({placeQuery:query},{index})).matches.length);
});
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
test("supplement archive rejects altered coordinates or removed provenance", async () => {
 const dir = await mkdtemp(join(tmpdir(),"hanle-index-")); const path = join(dir,"index.gz");
 const metadata = {schemaVersion:2,vintage:"geonames-cities500-2026-10-11+hanle-v1",generatedAt:"2026-10-13T00:00:00.000Z"};
 const cities = [[1270426,"Hanle","Hanle","Hanle",32.78943,78.9962,"IN","India",0,"Asia/Kolkata"]];
 const source = {...supplement.REVIEWED_SUPPLEMENT, archiveChecksum:"738f48ab5bc86a4325beaf013ce0a0f25119eceeeff9cd3d96f86991690df998"};
 try {
  await writeFile(path,gzipSync(JSON.stringify({...metadata,cities})));
  await assert.rejects(()=>loadGeoNamesPlaceIndex(path),/provenance/i);
  cities[0]![4]=32.8;
  await writeFile(path,gzipSync(JSON.stringify({...metadata,cities,supplementalSources:[source]})));
  await assert.rejects(()=>loadGeoNamesPlaceIndex(path),/provenance/i);
 } finally {await rm(dir,{recursive:true,force:true});}
});
import { zipSync, strToU8 } from "fflate";
test("selected entry expansion limit is enforced before country inflation", () => {
 assert.equal(typeof supplement.extractGeoNamesEntry,"function");
 const archive = zipSync({"IN.txt":strToU8("x".repeat(1000)),"unrelated.txt":strToU8("x".repeat(2000))});
 assert.throws(()=>supplement.extractGeoNamesEntry(archive,"IN.txt",999),/expanded/i);
 assert.equal(supplement.extractGeoNamesEntry(archive,"IN.txt",1000).length,1000);
 assert.throws(()=>supplement.extractGeoNamesEntry(archive,"absent.txt",1000),/missing/i);
 assert.throws(()=>supplement.extractGeoNamesEntry(zipSync({"../IN.txt":strToU8("a"),"IN.txt":strToU8("b")}),"IN.txt",1000),/path/i);
 const duplicate=zipSync({"IN.txt":strToU8("a"),"IN.txu":strToU8("b")});
 for(let i=0;i<duplicate.length-6;i++)if(Buffer.from(duplicate.subarray(i,i+6)).toString()==="IN.txu")duplicate[i+5]=116;
 assert.throws(()=>supplement.extractGeoNamesEntry(duplicate,"IN.txt",1000),/duplicate/i);
});
