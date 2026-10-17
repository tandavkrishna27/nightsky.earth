import assert from "node:assert/strict";
import test from "node:test";
import { createOpenWeatherProvider } from "../../server/providers/weather/openWeather";
import { UpstreamControls } from "../../server/providers/upstreamControls";
const epoch = Date.parse("2026-10-17T00:00:00Z") / 1000;
const place = { placeId: "selected", latitude: 12.345678, longitude: 76.54321 };
const window = { startUtc: new Date(epoch * 1000).toISOString(), endUtc: new Date((epoch + 10800) * 1000).toISOString(), timeZone: "Asia/Kolkata" };
const fixture = () => ({ cod: "200", city: { coord: { lat: 0, lon: 0 }, timezone: 0 }, list: [0, 10800].map(offset => ({ dt: epoch + offset, main: { temp: 12, humidity: 80 }, clouds: { all: 0 }, wind: { speed: 2, gust: 4, deg: 90 }, visibility: 10000, pop: 0.5, rain: { "3h": 2 }, snow: { "3h": 1 } })) });
function setup(body: unknown = fixture(), status = 200) { let calls = 0, reservations = 0; let request: URL | undefined; const provider = createOpenWeatherProvider({ apiKey: "private-key", now: () => epoch * 1000, controls: new UpstreamControls(), quota: { async reserve() { reservations++; return { allowed: true, reason: "reserved" }; } }, fetcher: async (input, init) => { calls++; request = new URL(String(input)); assert.equal(init?.redirect, "error"); return new Response(JSON.stringify(body), { status }); } }); return { provider, get calls() { return calls; }, get reservations() { return reservations; }, get request() { return request; } }; }
test("fixed metric endpoint preserves selected coordinates and native three-hour amounts", async () => { const s = setup(); const r = await s.provider.getForecast(place, window); assert.ok(r.forecast); assert.equal(s.request?.origin + s.request?.pathname, "https://api.openweathermap.org/data/2.5/forecast"); assert.equal(s.request?.searchParams.get("lat"), String(place.latitude)); assert.equal(s.request?.searchParams.get("lon"), String(place.longitude)); assert.equal(s.request?.searchParams.get("units"), "metric"); assert.equal(s.request?.searchParams.get("cnt"), "40"); assert.equal(r.forecast.samples.length, 2); const v = r.forecast.samples[0].values; assert.equal(v.totalCloudCover?.value, 0); assert.equal(v.windSpeed?.value, 2); assert.equal(v.temperature?.value, 12); assert.equal(v.precipitationAmount?.value, 3); assert.equal(v.precipitationAmount?.periodStartUtc, new Date((epoch - 10800) * 1000).toISOString()); assert.equal(v.precipitationAmount?.periodEndUtc, window.startUtc); assert.equal(r.forecast.source.issuedAt, undefined); });
test("absent optional fields remain unknown", async () => { const s = setup({ cod: 200, list: [{ dt: epoch, main: { temp: 10 } }] }); const r = await s.provider.getForecast(place, window); assert.ok(r.forecast); assert.equal(r.forecast.samples[0].values.totalCloudCover, undefined); assert.equal(r.forecast.samples[0].values.precipitationAmount, undefined); assert.ok(r.forecast.missingFields.some(f => f.field === "precipitationAmount")); });
test("out of horizon returns no invented samples", async () => { const s = setup(); const r = await s.provider.getForecast(place, { ...window, startUtc: new Date((epoch + 6 * 86400) * 1000).toISOString(), endUtc: new Date((epoch + 7 * 86400) * 1000).toISOString() }); assert.equal(r.status, "out-of-horizon"); assert.equal(r.forecast, undefined); });
test("sorts samples and rejects duplicate timestamps", async () => { const body = fixture(); body.list.reverse(); assert.ok((await setup(body).provider.getForecast(place, window)).forecast); body.list.push(body.list[0]); assert.equal((await setup(body).provider.getForecast(place, window)).status, "unavailable"); });
for (const body of [{ cod: "401", message: "private-key" }, { cod: "200", list: [] }, { cod: "200", list: [{ dt: epoch, clouds: { all: 101 } }] }])
    test("rejects invalid payload without credential diagnostics", async () => { const s = setup(body); const r = await s.provider.getForecast(place, window); assert.equal(r.status, "unavailable"); assert.ok(!JSON.stringify(r).includes("private-key")); assert.equal(s.calls, 1); });
for (const status of [301, 401, 403, 429, 500])
    test(`HTTP ${status} has no retry`, async () => { const s = setup({ message: "private-key" }, status); const r = await s.provider.getForecast(place, window); assert.equal(r.status, "unavailable"); assert.equal(s.calls, 1); assert.ok(!JSON.stringify(r).includes("private-key")); });
test("provider spacing denies second start without reserving quota", async () => { const s = setup(); await s.provider.getForecast(place, window); const r = await s.provider.getForecast({ ...place, latitude: 13 }, window); assert.equal(r.status, "unavailable"); assert.equal(s.calls, 1); assert.equal(s.reservations, 1); });
test("body and request deadline abort uncooperative transports", async () => {
    for (const bodyStall of [false, true]) {
        let signal: AbortSignal | undefined; let now=epoch*1000,calls=0;
        const provider = createOpenWeatherProvider({ apiKey: "private-key", now: () => now, controls: new UpstreamControls(), quota: { async reserve() { return { allowed: true, reason: "ok" }; } }, fetcher: async (_input, init) => { calls++; signal = init?.signal ?? undefined; if (!bodyStall)
                return new Promise<Response>(() => { }); return new Response(new ReadableStream({ start() { } })); } });
        const started = Date.now();
        const result = await provider.getForecast(place, window);
        assert.equal(result.status, "unavailable");
        assert.match(result.reason, /timed out/);
        assert.equal(signal?.aborted, true);
        if (!bodyStall) { now+=6000; assert.equal((await provider.getForecast(place,window)).status,"unavailable"); assert.equal(calls,1); }
        assert.ok(Date.now() - started < 6000);
    }
});
test("declared and streamed oversized bodies fail closed", async () => {
    for (const declared of [false, true]) {
        let calls = 0;
        const provider = createOpenWeatherProvider({ apiKey: "private-key", now: () => epoch * 1000, controls: new UpstreamControls(), quota: { async reserve() { return { allowed: true, reason: "ok" }; } }, fetcher: async () => { calls++; return new Response("x".repeat(524289), { headers: declared ? { "Content-Length": "524289" } : {} }); } });
        const result = await provider.getForecast(place, window);
        assert.equal(result.status, "unavailable");
        assert.equal(calls, 1);
    }
});
test("quota denial prevents network and redacts reservation reason", async () => {
    let calls = 0;
    const provider = createOpenWeatherProvider({ apiKey: "private-key", now: () => epoch * 1000, controls: new UpstreamControls(), quota: { async reserve() { return { allowed: false, reason: "private-key" }; } }, fetcher: async () => { calls++; throw Error("private-key"); } });
    const result = await provider.getForecast(place, window);
    assert.equal(calls, 0);
    assert.equal(result.status, "unavailable");
    assert.ok(!JSON.stringify(result).includes("private-key"));
});
test("one active request prevents parallel starts", async () => {
    let finish!: (response: Response) => void;
    let calls = 0;
    const provider = createOpenWeatherProvider({ apiKey: "private-key", now: () => epoch * 1000, controls: new UpstreamControls(), quota: { async reserve() { return { allowed: true, reason: "ok" }; } }, fetcher: async () => { calls++; return new Promise<Response>(resolve => { finish = resolve; }); } });
    const first = provider.getForecast(place, window);
    await new Promise(resolve => setTimeout(resolve, 0));
    const second = await provider.getForecast({ ...place, latitude: 13 }, window);
    assert.equal(second.status, "unavailable");
    assert.equal(calls, 1);
    finish(new Response(JSON.stringify(fixture())));
    assert.ok((await first).forecast);
});
test("malformed JSON and leaked transport error text stay private", async () => {
    for (const brokenJson of [false, true]) {
        const provider = createOpenWeatherProvider({ apiKey: "private-key", now: () => epoch * 1000, controls: new UpstreamControls(), quota: { async reserve() { return { allowed: true, reason: "ok" }; } }, fetcher: async () => { if (brokenJson)
                return new Response("{private-key"); throw Error("https://api.openweathermap.org?appid=private-key"); } });
        const result = await provider.getForecast(place, window);
        assert.equal(result.status, "unavailable");
        assert.ok(!JSON.stringify(result).includes("private-key"));
    }
});
test("auth and rate failures persist nonsecret provider state", async () => {
    for (const status of [401, 403, 429]) {
        const saved: Array<{
            disabled?: boolean;
            blockedUntil?: number;
        }> = [];
        const quota = { async reserve() { return { allowed: true, reason: "ok" }; }, async setProviderState(id: string, state: {
                disabled?: boolean;
                blockedUntil?: number;
            }) { assert.equal(id, "openweather"); saved.push(state); } };
        const provider = createOpenWeatherProvider({ apiKey: "private-key", now: () => epoch * 1000, controls: new UpstreamControls(), quota, fetcher: async () => new Response(null, { status, headers: { "Retry-After": "120" } }) });
        assert.equal((await provider.getForecast(place, window)).status, "unavailable");
        assert.deepEqual(saved, status === 429 ? [{ blockedUntil: epoch * 1000 + 120000 }] : [{ disabled: true }]);
    }
});
test("probability remains unknown without documented interval boundaries", async () => { const result = await setup().provider.getForecast(place, window); assert.equal(result.forecast?.samples[0].values.precipitationProbability, undefined); assert.match(result.forecast!.missingFields.find(f => f.field === "precipitationProbability")!.reason, /interval/); assert.equal(result.forecast?.samples[0].values.precipitationProbability?.periodStartUtc, undefined); });
test("no response cache before cache permission admission", async () => {
    let now = epoch * 1000, calls = 0, reservations = 0;
    const provider = createOpenWeatherProvider({ apiKey: "private-key", now: () => now, controls: new UpstreamControls({ now: () => now }), quota: { async reserve() { reservations++; return { allowed: true, reason: "ok" }; } }, fetcher: async () => { calls++; return new Response(JSON.stringify(fixture())); } });
    await provider.getForecast(place, window);
    now += 1001;
    await provider.getForecast(place, window);
    assert.equal(calls, 2);
    assert.equal(reservations, 2);
});
test("five-day payload remains forty native UTC steps across local DST", async () => {
    const dstEpoch=Date.parse("2026-10-24T00:00:00Z")/1000;
    const body = { cod: "200", city: { timezone: 7200 }, list: Array.from({ length: 40 }, (_, i) => ({ dt: dstEpoch + i * 10800, main: { temp: 5 } })) };
    const r = await setup(body).provider.getForecast(place, { startUtc: new Date(dstEpoch*1000).toISOString(), endUtc: new Date((dstEpoch + 39 * 10800) * 1000).toISOString(), timeZone: "Europe/London" });
    assert.equal(r.forecast?.samples.length, 40);
    assert.equal(Date.parse(r.forecast!.samples[1].validAt) - Date.parse(r.forecast!.samples[0].validAt), 10800000);
});

