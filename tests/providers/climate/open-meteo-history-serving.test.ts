import assert from "node:assert/strict";
import test from "node:test";
import * as integration from "../../../server/providers/climate/openMeteoHistoryServing";
import { planOpenMeteoHistory } from "../../../server/providers/climate/openMeteoHistoryContract";
import { climateContextResultSchema } from "../../../shared/nightsky/climate";
const partition = planOpenMeteoHistory({ latitude: 28.5, longitude: 77.25 })[0]!;
function chunk(value: number | null = 10) {
  return { partition, retrievedAt: "2026-10-17T00:00:00Z", bytes: Buffer.from(JSON.stringify({ latitude: 28.5, longitude: 77.25, utc_offset_seconds: 0, hourly_units: {time:"unixtime",cloud_cover:"%"}, hourly: {time:Array.from({length:336},(_,i)=>partition.startUnixSeconds+i*3600),cloud_cover:Array(336).fill(value)} })) };
}
test("bounded hosted aggregation preserves source identity, missingness and timezone cache identity", () => {
  assert.equal(typeof integration.aggregateHostedHistory, "function");
  const options = { timeZone:"Asia/Kolkata", startNight:"1991-01-01", endNight:"1991-01-10", maxHours:336, maxRetainedBytes:100000, maxElapsedMs:10000 };
  const a = integration.aggregateHostedHistory([chunk()], options);
  assert.equal(a.methodVersion,"open-meteo-quantized-dark-cloud-v1");
  assert.equal(a.historicalAdmission,false);
  assert.equal(a.period.kind,"sample-only");
  assert.ok(a.bins.reduce((n,b)=>n+b.valid,0)>0);
  assert.equal(a.bins.reduce((n,b)=>n+b.counts[0],0),a.bins.reduce((n,b)=>n+b.valid,0));
  const missing = integration.aggregateHostedHistory([chunk(null)], options);
  assert.equal(missing.bins.reduce((n,b)=>n+b.valid,0),0);
  assert.deepEqual(missing.bins.map(b=>b.expected),a.bins.map(b=>b.expected));
  assert.notEqual(a.cacheKey,integration.aggregateHostedHistory([chunk()],{...options,timeZone:"UTC"}).cacheKey);
  assert.throws(()=>integration.aggregateHostedHistory([chunk(),chunk()],options),/budget|order|overlap/i);
  assert.throws(()=>integration.aggregateHostedHistory([chunk()],{...options,maxHours:1}),/budget/i);
});
test("serving preserves full baseline and never exposes quarantined numeric statistics", () => {
  assert.equal(typeof integration.hostedHistoryUnavailable, "function");
  const result = integration.hostedHistoryUnavailable("place:v1:test",1,"Asia/Kolkata");
  assert.equal(result.availability.status,"unavailable");
  assert.equal(result.period.kind,"baseline-1991-2020");
  assert.equal(result.methodVersion,"open-meteo-quantized-dark-cloud-v1");
  assert.equal(result.summary,undefined);
  assert.equal(result.bins,undefined);
  assert.ok(climateContextResultSchema.safeParse(result).success);
  assert.equal(climateContextResultSchema.safeParse({...result,availability:{status:"partial",reason:"test"}}).success,false);
});
test("point-aware preview provider serves only the exact requested point and civil zone", async () => {
  assert.equal(typeof integration.createHostedHistoryPreviewProvider,"function");
  const aggregate=integration.aggregateHostedHistory([chunk()],{timeZone:"Asia/Kolkata",startNight:"1991-01-01",endNight:"1991-01-10",maxHours:336,maxRetainedBytes:100000,maxElapsedMs:10000});
  const provider=integration.createHostedHistoryPreviewProvider(aggregate);
  const point={placeId:"place:v1:test",name:"Synthetic",latitude:28.5,longitude:77.25,displayTimeZone:"Asia/Kolkata",timeZoneBasis:"explicit-display" as const,sources:[{name:"Synthetic",url:"https://example.com",attribution:"Synthetic",dataClass:"context" as const}]};
  const result=await provider.getClimatology(point.placeId,1,point);
  assert.equal(result.availability.status,"partial");
  assert.equal(result.period.kind,"sample-only");
  assert.ok(result.summary!.validEligibleSamples>0);
  assert.equal(result.bins!.length,24);
  assert.equal(result.sourceRevision,undefined);
  assert.ok(result.caveats.some(c=>c.includes(aggregate.cacheKey)));
  assert.equal((await provider.getClimatology(point.placeId,1,{...point,longitude:77.5})).availability.status,"unavailable");
  assert.equal((await provider.getClimatology(point.placeId,1,{...point,displayTimeZone:"UTC"})).availability.status,"unavailable");
  assert.equal((await provider.getClimatology(point.placeId,1)).availability.status,"unavailable");
});
test("UTC bins and local-noon assignment remain explicit, including DST fold", async () => {
  const { OPEN_METEO_HISTORY_METHOD }=await import("../../../server/providers/climate/openMeteoHistoryMethod");
  const { observingNightDate }=await import("../../../scripts/era5/aggregate");
  assert.match(OPEN_METEO_HISTORY_METHOD.denominators,/UTC-hour-bins/);
  assert.equal(observingNightDate("2020-11-01T05:00:00Z","America/New_York"),"2020-10-31");
  assert.equal(observingNightDate("2020-11-01T06:00:00Z","America/New_York"),"2020-10-31");
  assert.equal(observingNightDate("1991-01-01T06:00:00Z","Asia/Kolkata"),"1990-12-31");
  assert.equal(observingNightDate("1991-01-01T07:00:00Z","Asia/Kolkata"),"1991-01-01");
});
test("input and independent astronomy clock budgets reject expansion and close source iterator", () => {
  let closed=false;
  function* chunks(){try{yield chunk();yield chunk();}finally{closed=true;}}
  const options={timeZone:"UTC",startNight:"1991-01-01",endNight:"1991-01-10",maxHours:336,maxRetainedBytes:100000,maxElapsedMs:10000};
  assert.throws(()=>integration.aggregateHostedHistory(chunks(),options),/budget|order|overlap/);
  assert.equal(closed,true);
  assert.throws(()=>integration.aggregateHostedHistory([chunk()],{...options,endNight:"2020-12-31"}),/clock budget/);
  assert.throws(()=>integration.aggregateHostedHistory([chunk()],{...options,maxRetainedBytes:10}),/budget/);
});

test("remote returned cell rejects and empty hosted denominators expose no numerical cloud values", async()=>{
  const options={timeZone:"Asia/Kolkata",startNight:"1991-01-01",endNight:"1991-01-10",maxHours:336,maxRetainedBytes:100000,maxElapsedMs:10000};
  const remote=chunk(); const wire=JSON.parse(remote.bytes.toString());wire.latitude=29;remote.bytes=Buffer.from(JSON.stringify(wire));
  assert.throws(()=>integration.aggregateHostedHistory([remote],options),/exact requested grid-cell match/);
  const aggregate=integration.aggregateHostedHistory([chunk(null)],options);
  const revision="a".repeat(64);
  const result=await integration.createHostedHistoryPreviewProvider(aggregate).getClimatology("place:v1:test",1,{placeId:"place:v1:test",name:"Synthetic",latitude:28.5,longitude:77.25,displayTimeZone:"Asia/Kolkata",timeZoneBasis:"explicit-display",sourceRevision:revision,sources:[{name:"Synthetic",url:"https://example.com",attribution:"Synthetic",dataClass:"context"}]});
  assert.equal(result.sourceRevision,revision);
  assert.equal(result.summary!.validEligibleSamples,0);
  assert.equal(result.summary!.thresholds,undefined);
  assert.equal(result.summary!.meanCloudFraction,undefined);
  assert.ok(result.summary!.expectedEligibleSamples>0);
});
