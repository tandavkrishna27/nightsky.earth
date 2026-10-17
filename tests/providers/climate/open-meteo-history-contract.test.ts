import assert from "node:assert/strict";
import test from "node:test";

const load = () => import("../../../server/providers/climate/openMeteoHistoryContract");
// Entirely synthetic wire data: no measured climate evidence.
function fixture(start: number) {
  return { latitude: 10.25, longitude: 77.5, utc_offset_seconds: 0,
    hourly_units: { time: "unixtime", cloud_cover: "%" },
    hourly: { time: Array.from({ length: 336 }, (_, i) => start + i * 3600),
      cloud_cover: Array.from<unknown, number | null>({ length: 336 }, (_, i) => i === 0 ? null : i === 1 ? 25 : 100) } };
}
test("offline history plans every padded UTC hour exactly once with fixed ERA5 requests", async () => {
  const api = await load().catch(() => undefined);
  assert.ok(api?.planOpenMeteoHistory, "offline contract must exist");
  const plan = api.planOpenMeteoHistory({ latitude: 10.24, longitude: 77.49 });
  assert.equal(plan.length, 783);
  const hours = plan.flatMap(p => Array.from({ length: p.expectedHours }, (_, i) => p.startUnixSeconds + i * 3600));
  assert.equal(hours.length, 263088); assert.equal(new Set(hours).size, 263088);
  assert.equal(hours[0], Date.parse("1990-12-30T00:00:00Z") / 1000);
  assert.equal(hours.at(-1), Date.parse("2021-01-03T00:00:00Z") / 1000 - 3600);
  assert.equal(new URL(plan.at(-1)!.url).searchParams.get("end_date"), "2021-01-02");
  for (const p of plan) { const q = new URL(p.url).searchParams;
    for (const [k,v] of Object.entries({ hourly: "cloud_cover", models: "era5", timezone: "GMT", timeformat: "unixtime", cell_selection: "nearest", elevation: "nan" })) assert.equal(q.get(k),v);
    assert.equal(p.accounting, "unverified"); assert.equal(p.historicalAdmission, false);
  }
});
test("synthetic percent data stays quarantined and missing hours remain missing", async () => {
  const api = await load(); const p = api.planOpenMeteoHistory({latitude:10.24,longitude:77.49})[0];
  const wire = fixture(p.startUnixSeconds); wire.hourly.time.splice(3,1); wire.hourly.cloud_cover.splice(3,1);
  const bytes = Buffer.from(JSON.stringify(wire)); const result = api.decodeOpenMeteoHistory(bytes,p);
  assert.equal(result.historicalAdmission,false); assert.equal(result.accounting,"unverified");
  assert.equal(result.samples.length,336); assert.equal(result.samples[0].cloudFraction,null);
  assert.equal(result.samples[1].cloudFraction,.25); assert.equal(result.samples[3].cloudFraction,null);
  assert.equal(result.missingHours,2); assert.deepEqual(result.receipt.rawBytes,bytes);
  assert.match(result.receipt.sha256,/^[a-f0-9]{64}$/);
  assert.deepEqual(result.requestedPoint,{latitude:10.24,longitude:77.49});
  assert.deepEqual(result.actualCell,{latitude:10.25,longitude:77.5});
});
test("synthetic decoder rejects malformed wire and incompatible requests", async () => {
  const api = await load(); const p = api.planOpenMeteoHistory({latitude:10.24,longitude:77.49})[0];
  const mutate: Array<(w: any) => void> = [w=>w.hourly_units.cloud_cover="fraction",w=>w.utc_offset_seconds=3600,
    w=>w.latitude=10.24,w=>w.hourly.time[1]=w.hourly.time[0],w=>w.hourly.time[2]=w.hourly.time[0],
    w=>w.hourly.time[335]=p.endUnixSeconds,w=>w.hourly.cloud_cover.pop(),w=>w.hourly.cloud_cover[1]=101,
    w=>w.hourly.cloud_cover[1]="25",w=>w.hourly.time.reverse(),w=>w.hourly_units.time="iso8601"];
  for (const change of mutate) { const w=fixture(p.startUnixSeconds); change(w); assert.throws(()=>api.decodeOpenMeteoHistory(Buffer.from(JSON.stringify(w)),p)); }
  assert.throws(()=>api.decodeOpenMeteoHistory(Buffer.alloc(2*1024*1024+1),p),/bound|size/i);
  const w=Buffer.from(JSON.stringify(fixture(p.startUnixSeconds)));
  assert.throws(()=>api.decodeOpenMeteoHistory(w,{...p,url:p.url.replace("models=era5","models=best_match")}));
  assert.throws(()=>api.decodeOpenMeteoHistory(w,p,{latitude:10.5,longitude:77.5}),/cell/i);
  assert.throws(()=>api.planOpenMeteoHistory({latitude:91,longitude:0}));
});

test("synthetic exact percent boundaries and completely absent hours preserve denominators", async () => {
  const api = await load(); const p = api.planOpenMeteoHistory({latitude:10.24,longitude:77.49}).at(-1)!;
  const w = fixture(p.startUnixSeconds);
  [0,10,25,50,100].forEach((v,i)=>{w.hourly.cloud_cover[i]=v;});
  const result = api.decodeOpenMeteoHistory(Buffer.from(JSON.stringify(w)),p);
  assert.deepEqual(result.samples.slice(0,5).map(s=>s.cloudFraction),[0,.1,.25,.5,1]);
  assert.equal(result.samples.at(-1)?.unixSeconds,p.endUnixSeconds-3600);
  w.hourly.time=[]; w.hourly.cloud_cover=[];
  const missing=api.decodeOpenMeteoHistory(Buffer.from(JSON.stringify(w)),p);
  assert.equal(missing.samples.length,336); assert.equal(missing.missingHours,336);
  assert.ok(missing.samples.every(s=>s.cloudFraction===null));
});

test("dry-run manifest exposes blocked gates and all request partitions", async () => {
  const { openMeteoHistoryManifest } = await import("../../../scripts/era5/plan-open-meteo-history");
  const manifest = openMeteoHistoryManifest({latitude:10.24,longitude:77.49});
  assert.equal(manifest.mode,"dry-run-only"); assert.equal(manifest.liveExecution,"blocked");
  assert.equal(manifest.historicalAdmission,false); assert.equal(manifest.accounting,"unverified");
  assert.equal(manifest.partitionCount,783); assert.equal(manifest.expectedPaddedHours,263088);
});
