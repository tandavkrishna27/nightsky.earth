import { test } from "node:test";
import assert from "node:assert/strict";
import { createWeatherApiProvider } from "../../server/providers/weather/weatherApi";
import { UpstreamControls } from "../../server/providers/upstreamControls";
const epoch = Date.parse("2026-10-25T00:00:00Z") / 1000;
const place = { placeId: "place:v1:test", latitude: 51.12345678, longitude: -0.12345678 };
const window = { startUtc: new Date(epoch * 1000).toISOString(), endUtc: new Date((epoch + 7200) * 1000).toISOString(), timeZone: "Europe/London" };
function fixture(hours = [0, 1, 2]) { return { current: { temp_c: 99 }, location: { lat: 0, lon: 0 }, forecast: { forecastday: [{ hour: hours.map(h => ({ time_epoch: epoch + h * 3600, time: "2026-10-25 01:00", cloud: 0, temp_c: 8, wind_kph: 36, gust_kph: 54, wind_degree: 90, humidity: 70, dewpoint_c: 3, vis_km: 10, precip_mm: 2, chance_of_rain: 50 })) }] } }; }
function setup(fetcher: typeof fetch, reserve = async () => ({ allowed: true, reason: "ok" })) { let now = epoch * 1000; const provider = createWeatherApiProvider({ apiKey: "synthetic-secret", fetcher, quota: { reserve }, now: () => now, controls: new UpstreamControls({ now: () => now }) }); return { provider, advance: (ms: number) => { now += ms; } }; }
test("WeatherAPI uses exact coordinates, Free endpoint and UTC epochs across repeated DST local hour", async () => {
    let calls = 0, reservations = 0;
    const { provider } = setup(async (url, init) => { calls++; const u = new URL(String(url)); assert.equal(u.origin + u.pathname, "https://api.weatherapi.com/v1/forecast.json"); assert.equal(u.searchParams.get("q"), "51.12345678,-0.12345678"); assert.equal(u.searchParams.get("days"), "3"); assert.equal(u.searchParams.get("aqi"), "no"); assert.equal(u.searchParams.get("alerts"), "no"); assert.equal(init?.redirect, "error"); assert.equal(reservations, 1); return Response.json(fixture()); }, async () => { reservations++; return { allowed: true, reason: "ok" }; });
    const result = await provider.getForecast(place, window);
    assert.equal(result.status, "partial");
    assert.deepEqual(result.forecast?.samples.map(s => s.validAt), [0, 1, 2].map(h => new Date((epoch + h * 3600) * 1000).toISOString()));
    const values = result.forecast!.samples[0].values;
    assert.equal(values.windSpeed?.value, 10);
    assert.equal(values.windGust?.value, 15);
    assert.equal(values.visibility?.value, 10000);
    assert.equal(values.totalCloudCover?.value, 0);
    assert.equal(values.temperature?.value, 8);
    assert.equal(values.lowCloudCover, undefined);
    assert.equal(values.precipitationAmount, undefined);
    assert.equal(values.precipitationProbability, undefined);
    assert.equal(result.forecast?.source.issuedAt, undefined);
    assert.match(result.forecast!.source.attribution, /WeatherAPI.com/);
    await provider.getForecast(place, window);
    assert.equal(calls, 1);
    assert.equal(reservations, 1);
});
test("WeatherAPI handles denied quota without network or secret diagnostics", async () => { let calls = 0; const { provider } = setup(async () => { calls++; throw Error("synthetic-secret"); }, async () => ({ allowed: false, reason: "synthetic-secret" })); const r = await provider.getForecast(place, window); assert.equal(r.status, "unavailable"); assert.equal(calls, 0); assert.doesNotMatch(JSON.stringify(r), /synthetic-secret|key=/); });
for (const status of [401, 403, 429, 302])
    test(`WeatherAPI HTTP ${status} has no retry`, async () => { let calls = 0; const { provider } = setup(async () => { calls++; return new Response("secret", { status }); }); const r = await provider.getForecast(place, window); assert.equal(r.status, "unavailable"); assert.equal(calls, 1); assert.doesNotMatch(JSON.stringify(r), /synthetic-secret|https:\/\/api.weatherapi/); });
for (const body of ["{", JSON.stringify({ error: { code: 2006, message: "synthetic-secret" } }), JSON.stringify({ forecast: { forecastday: [{ hour: [{ time_epoch: epoch, cloud: 101 }] }] } }), "x".repeat(512 * 1024 + 1)])
    test(`WeatherAPI rejects invalid payload ${body.length}`, async () => { const { provider } = setup(async () => new Response(body)); assert.equal((await provider.getForecast(place, window)).status, "unavailable"); });
test("WeatherAPI labels horizon gaps and caps samples without current observations", async () => { const { provider } = setup(async () => Response.json(fixture([0, 2]))); const r = await provider.getForecast(place, window); assert.equal(r.status, "partial"); assert.match(r.reason, /gap|coverage/i); const outside = await provider.getForecast(place, { ...window, startUtc: "2027-01-01T00:00:00Z", endUtc: "2027-01-01T02:00:00Z" }); assert.equal(outside.status, "out-of-horizon"); });
test("WeatherAPI rejects concurrent distinct requests and starts less than a second apart", async () => { let release!: () => void; const wait = new Promise<void>(r => { release = r; }); let calls = 0; const { provider } = setup(async () => { calls++; await wait; return Response.json(fixture()); }); const first = provider.getForecast(place, window); await new Promise(r => setImmediate(r)); const other = await provider.getForecast({ ...place, longitude: 1 }, window); assert.equal(other.status, "unavailable"); release(); await first; assert.equal((await provider.getForecast({ ...place, longitude: 2 }, window)).status, "unavailable"); assert.equal(calls, 1); });
test("WeatherAPI total deadline bounds stalled response body", async () => { let aborted = false; const { provider } = setup(async (_url, init) => { init?.signal?.addEventListener("abort", () => { aborted = true; }); return new Response(new ReadableStream({ start() { } })); }); const started = Date.now(); const r = await provider.getForecast(place, window); assert.equal(r.status, "unavailable"); assert.ok(aborted); assert.ok(Date.now() - started < 6500); });
test("WeatherAPI thrown transport errors are redacted", async () => { const { provider } = setup(async () => { throw Error("https://api.weatherapi.com/?key=synthetic-secret"); }); const r = await provider.getForecast(place, window); assert.equal(r.status, "unavailable"); assert.doesNotMatch(JSON.stringify(r), /synthetic-secret|key=/); });
test("WeatherAPI rejects trial-shaped extra days", async () => { const payload = fixture(); payload.forecast.forecastday = Array.from({ length: 4 }, () => fixture().forecast.forecastday[0]); const { provider } = setup(async () => Response.json(payload)); assert.equal((await provider.getForecast(place, window)).status, "unavailable"); });
test("WeatherAPI never accepts an HTTP-200 error alongside forecast data", async () => { const { provider } = setup(async () => Response.json({ ...fixture(), error: { code: 2006, message: "synthetic-secret" } })); assert.equal((await provider.getForecast(place, window)).status, "unavailable"); });
test("WeatherAPI persists auth disable and bounded Retry-After when quota supports state", async () => {
    for (const status of [401, 403, 429]) {
        const states: Array<{disabled?:boolean;blockedUntil?:number}> = [];
        const provider=createWeatherApiProvider({apiKey:"synthetic-secret",now:()=>epoch*1000,controls:new UpstreamControls(),fetcher:async()=>new Response(null,{status,headers:{"Retry-After":"120"}}),quota:{reserve:async()=>({allowed:true,reason:"ok"}),setProviderState:async(_id:string,state:{disabled?:boolean;blockedUntil?:number})=>{states.push(state);}} as import("../../server/providers/quotaTypes").ProviderQuota});
        await provider.getForecast(place,window);
        assert.deepEqual(states,status===429?[{blockedUntil:epoch*1000+120000}]:status===403?[{blockedUntil:epoch*1000+120000},{disabled:true}]:[{disabled:true}]);
    }
});
test("WeatherAPI cached window with no usable fields returns unavailable", async()=>{
    const payload={forecast:{forecastday:[{hour:[{time_epoch:epoch,cloud:10},{time_epoch:epoch+3600}]}]}};
    const {provider}=setup(async()=>Response.json(payload));
    assert.equal((await provider.getForecast(place,window)).status,"partial");
    const result=await provider.getForecast(place,{...window,startUtc:new Date((epoch+3600)*1000).toISOString(),endUtc:new Date((epoch+5400)*1000).toISOString()});
    assert.equal(result.status,"unavailable");
});
test("WeatherAPI HTTP403 quota code persists backoff without permanent disable",async()=>{
    const states:Array<{disabled?:boolean;blockedUntil?:number}>=[];
    const provider=createWeatherApiProvider({apiKey:"synthetic-secret",now:()=>epoch*1000,controls:new UpstreamControls(),fetcher:async()=>Response.json({error:{code:2007,message:"synthetic-secret"}},{status:403,headers:{"Retry-After":"120"}}),quota:{reserve:async()=>({allowed:true,reason:"ok"}),setProviderState:async(_id:string,state:{disabled?:boolean;blockedUntil?:number})=>{states.push(state);}} as import("../../server/providers/quotaTypes").ProviderQuota});
    const result=await provider.getForecast(place,window);
    assert.equal(result.status,"unavailable");assert.ok(states.length>0);assert.ok(states.every(state=>state.disabled===undefined));assert.equal(states.at(-1)?.blockedUntil,epoch*1000+120000);assert.doesNotMatch(JSON.stringify(result),/synthetic-secret/);
});
test("WeatherAPI blocks a pending HTTP403 body then refines an auth code to durable disable",async()=>{
    const states:Array<{disabled?:boolean;blockedUntil?:number}>=[];
    let body!:ReadableStreamDefaultController<Uint8Array>;
    const provider=createWeatherApiProvider({apiKey:"synthetic-secret",now:()=>epoch*1000,controls:new UpstreamControls(),fetcher:async()=>new Response(new ReadableStream<Uint8Array>({start(controller){body=controller;}}),{status:403}),quota:{reserve:async()=>({allowed:true,reason:"ok"}),setProviderState:async(_id:string,state:{disabled?:boolean;blockedUntil?:number})=>{states.push(state);}} as import("../../server/providers/quotaTypes").ProviderQuota});
    const pending=provider.getForecast(place,window);await new Promise(resolve=>setImmediate(resolve));
    assert.deepEqual(states,[{blockedUntil:epoch*1000+60000}]);
    body.enqueue(new TextEncoder().encode(JSON.stringify({error:{code:2006,message:"synthetic-secret"}})));body.close();
    assert.equal((await pending).status,"unavailable");assert.deepEqual(states.at(-1),{disabled:true});
});
test("WeatherAPI reports an unusable middle hour as a coverage gap",async()=>{
    const payload={forecast:{forecastday:[{hour:[{time_epoch:epoch,cloud:10},{time_epoch:epoch+3600},{time_epoch:epoch+7200,cloud:10}]}]}};
    const {provider}=setup(async()=>Response.json(payload));const result=await provider.getForecast(place,window);
    assert.equal(result.forecast?.samples.length,2);assert.match(result.reason,/coverage.*gap/i);
});
test("WeatherAPI cache expires at fifteen minutes and evicts oldest after 128 entries", async () => { let calls = 0; const { provider, advance } = setup(async () => { calls++; return Response.json(fixture()); }); for (let i = 0; i < 129; i++) {
    await provider.getForecast({ ...place, longitude: i }, window);
    advance(1001);
} await provider.getForecast({ ...place, longitude: 0 }, window); assert.equal(calls, 130); advance(900000); await provider.getForecast({ ...place, longitude: 0 }, window); assert.equal(calls, 131); });
test("WeatherAPI crops at 48 actual samples across local midnight", async () => { const payload = { forecast: { forecastday: [0, 1, 2].map(day => fixture(Array.from({ length: 24 }, (_, i) => day * 24 + i)).forecast.forecastday[0]) } }; const { provider } = setup(async () => Response.json(payload)); const r = await provider.getForecast(place, { ...window, endUtc: new Date((epoch + 71 * 3600) * 1000).toISOString() }); assert.equal(r.forecast?.samples.length, 48); assert.match(r.reason, /coverage/i); });
