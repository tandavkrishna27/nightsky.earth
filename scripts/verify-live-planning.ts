import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { once } from "node:events";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { mountMcpRoute } from "../server/mcp/route";
import type { NightSkyCache, CacheEntry } from "../server/mcp/registerTools";
import { roundedMetCoordinates } from "../server/providers/weather/metNorway";
import { resolvePlaceResultSchema } from "../shared/nightsky/places";
import { astronomyWindowResultSchema } from "../shared/nightsky/astronomy";
import { nightConditionsResultSchema } from "../shared/nightsky/weather";
import { planResultSchema, compareObservingOptionsResultSchema } from "../shared/nightsky/planning";

export function snapshotIsFresh(row: { headers?: { status?: number; expires?: string; lastModified?: string } }, now: number): boolean {
  return row.headers?.status === 200 && Date.parse(row.headers.expires ?? "") > now && Number.isFinite(Date.parse(row.headers.lastModified ?? ""));
}
export async function captureSnapshotBody(response:Response, options:{maxBytes?:number;timeoutMs?:number;signal?:AbortSignal} = {}):Promise<string> {
  const maxBytes = options.maxBytes ?? 4 * 1024 * 1024;
  const reader = response.body?.getReader();
  if (!reader) return "";
  const chunks:Uint8Array[] = [];
  let size = 0;
  let timer:ReturnType<typeof setTimeout> | undefined;
  let rejectDeadline:(error:Error) => void = () => {};
  const deadline = new Promise<never>((_resolve,reject) => {rejectDeadline=reject;});
  const abort = () => rejectDeadline(new Error("Snapshot body deadline exceeded."));
  timer = setTimeout(abort,options.timeoutMs ?? 8000);
  options.signal?.addEventListener("abort",abort,{once:true});
  try {
    if (options.signal?.aborted) abort();
    if (Number(response.headers.get("Content-Length")) > maxBytes) throw new Error("Snapshot body byte limit exceeded.");
    while (true) {
      const part = await Promise.race([reader.read(),deadline]);
      if (part.done) break;
      size += part.value.byteLength;
      if (size > maxBytes) throw new Error("Snapshot body byte limit exceeded.");
      chunks.push(part.value);
    }
    return Buffer.concat(chunks,size).toString("utf8");
  } catch (error) {
    void reader.cancel().catch(() => {});
    throw error;
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener("abort",abort);
    reader.releaseLock();
  }
}
export function createSourceBudget() {
  const points = new Set<string>();
  return {
    get count() { return points.size; },
    claim(point: string) {
      if (points.has(point) || points.size >= 4) throw new Error("Live source request budget exceeded.");
      points.add(point);
    },
  };
}
const DEMO_SITES = {
  kodaikanal: {name:"Kodaikanal, India", id:"place:v1:geonames:1266425"},
  munnar: {name:"Munnar, India", id:"place:v1:geonames:1262463"},
  hanle: {name:"Hanle, India", id:"place:v1:geonames:1270426"},
};
export function selectedSites(args:string[]): Array<keyof typeof DEMO_SITES> {
  const flags = args.filter(arg => arg.startsWith("--sites="));
  if (!flags.length) return ["kodaikanal","munnar","hanle"];
  const sites = flags[0].slice(8).split(",");
  assert.ok(flags.length === 1 && new Set(sites).size === sites.length && sites.every(site => Object.hasOwn(DEMO_SITES,site)),"Invalid --sites selection.");
  return sites as Array<keyof typeof DEMO_SITES>;
}
export function selectDemonstrationPlace<T extends {displayName:string;placeId:string;timeZone:string}>(name:string, matches:T[]):T {
  const expected = Object.values(DEMO_SITES).find(site => site.name === name);
  const exact = matches.filter(place => expected && place.placeId === expected.id && place.timeZone === "Asia/Kolkata" && place.displayName.endsWith(", India"));
  if (exact.length === 1) return exact[0];
  throw new Error("Explicit demonstration place selection failed.");
}

export async function runLivePlanning() {
  assert.ok(process.argv.includes("--live"), "Explicit --live is required; this journey is excluded from default tests.");
  const userAgent = process.env.MET_NORWAY_USER_AGENT;
  assert.ok(userAgent, "Set MET_NORWAY_USER_AGENT in this process or an explicitly loaded local env file.");
  const sites = selectedSites(process.argv);
  const output = resolve(`.data/met/live-planning-${sites.join("-")}-report.json`);
  const snapshotDirectory = resolve(".data/met/live-planning-snapshots");
  const entries = new Map<string, CacheEntry<unknown>>();
  const cache: NightSkyCache = {
    async get<T>(key: string) { return entries.get(key) as CacheEntry<T> | undefined; },
    async set<T>(key: string, value: T, ttlMs: number) { entries.set(key, {value, expiresAt: Date.now() + ttlMs}); },
  };
  const budget = createSourceBudget();
  const report: any = { startedAt: new Date().toISOString(), runtime: process.version, transport: "local loopback HTTP /mcp", source: "MET Norway Locationforecast 2.0 complete", sourceCalls: [], reusedFreshSnapshots: 0, steps: [], passed: false };
  // The recorded source response is reused only while its own Expires is future.
  // Never substitute stale source evidence or a fixture for a live forecast.
  try {
    const spike = JSON.parse(await readFile(resolve(".data/met/live-report.json"), "utf8"));
    for (const row of spike.sites ?? []) {
      if (!["kodaikanal", "munnar"].includes(row.key) || !snapshotIsFresh(row, Date.now())) continue;
      const raw = await readFile(resolve(`.data/met/${row.key}.json`), "utf8");
      assert.equal(createHash("sha256").update(raw).digest("hex"), row.sha256, "Source snapshot digest mismatch.");
      const coords = roundedMetCoordinates(row);
      const url = `https://api.met.no/weatherapi/locationforecast/2.0/complete?lat=${coords.latitude.toFixed(4)}&lon=${coords.longitude.toFixed(4)}`;
      entries.set(url, { value: { payload: JSON.parse(raw), lastModified: row.headers.lastModified }, expiresAt: Date.parse(row.headers.expires) });
      report.reusedFreshSnapshots++;
    }
  } catch (error: any) {
    if (error.code !== "ENOENT") throw new Error("Unable to validate local source snapshots.");
  }
  try {
    for (const file of await readdir(snapshotDirectory)) {
      if (!file.endsWith(".json")) continue;
      const snapshot = JSON.parse(await readFile(resolve(snapshotDirectory,file),"utf8"));
      if (!snapshotIsFresh(snapshot,Date.now())) continue;
      assert.equal(createHash("sha256").update(snapshot.raw).digest("hex"),snapshot.sha256,"Source snapshot digest mismatch.");
      const url = new URL(snapshot.url);
      assert.ok(url.origin === "https://api.met.no" && url.pathname === "/weatherapi/locationforecast/2.0/complete","Invalid source snapshot origin.");
      entries.set(url.toString(),{value:{payload:JSON.parse(snapshot.raw),lastModified:snapshot.headers.lastModified},expiresAt:Date.parse(snapshot.headers.expires)});
      report.reusedFreshSnapshots++;
    }
  } catch (error:any) {
    if (error.code !== "ENOENT") throw new Error("Unable to validate local live-journey snapshots.");
  }
  const fetcher: typeof fetch = async (input, init) => {
    const url = new URL(String(input));
    assert.equal(url.origin, "https://api.met.no", "Unexpected upstream source blocked.");
    assert.equal(url.pathname, "/weatherapi/locationforecast/2.0/complete", "Unexpected source path blocked.");
    budget.claim(`${url.searchParams.get("lat")}:${url.searchParams.get("lon")}`);
    const evidence: any = { sequence: budget.count, requestedAt: new Date().toISOString() };
    report.sourceCalls.push(evidence);
    const response = await fetch(input, {...init, redirect: "error"});
    Object.assign(evidence, { status: response.status, receivedAt: new Date().toISOString(), expires: response.headers.get("Expires"), lastModified: response.headers.get("Last-Modified") });
    if (response.status === 200) {
      const raw = await captureSnapshotBody(response,{signal:init?.signal ?? undefined});
      const sha256 = createHash("sha256").update(raw).digest("hex");
      await mkdir(snapshotDirectory,{recursive:true});
      const key = createHash("sha256").update(url.toString()).digest("hex");
      await writeFile(resolve(snapshotDirectory,`${key}.json`),JSON.stringify({url:url.toString(),raw,sha256,headers:{status:response.status,expires:evidence.expires,lastModified:evidence.lastModified},receivedAt:evidence.receivedAt}));
      return new Response(raw,{status:response.status,statusText:response.statusText,headers:response.headers});
    }
    return response;
  };
  const app = express();
  app.use(express.json({limit: "32kb"}));
  mountMcpRoute(app, {allowedHosts: ["127.0.0.1"], cache, fetcher, weatherUserAgent: userAgent, providerTimeoutsMs:{met:8000}});
  const server = createServer(app);
  let requestId = 0;
  try {
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const endpoint = `http://127.0.0.1:${address.port}/mcp`;
    const rpc = async (method: string, params: unknown) => {
      const response = await fetch(endpoint, { method:"POST", headers:{"content-type":"application/json", accept:"application/json, text/event-stream", "mcp-protocol-version":"2025-11-25"}, body:JSON.stringify({jsonrpc:"2.0", id:++requestId, method, params}), signal:AbortSignal.timeout(30000) });
      assert.equal(response.status,200, "MCP HTTP request failed.");
      const body = await response.text();
      const data = body.split("\n").find(line => line.startsWith("data: "));
      const payload = JSON.parse(data ? data.slice(6) : body);
      assert.ok(!payload.error && !payload.result?.isError, "MCP returned a protocol or tool error.");
      return payload.result;
    };
    const initialize = await rpc("initialize", {protocolVersion:"2025-11-25", capabilities:{}, clientInfo:{name:"nightsky-local-live-journey",version:"1.0.0"}});
    assert.equal(initialize.protocolVersion,"2025-11-25");
    report.steps.push({name:"initialize",completedAt:new Date().toISOString(),result:initialize});
    const tools = await rpc("tools/list",{});
    report.toolNames = tools.tools.map((tool:any) => tool.name);
    const call = async (name:string, args:unknown, schema:{parse(value:unknown):any}) => {
      const result = schema.parse((await rpc("tools/call",{name,arguments:args})).structuredContent);
      report.steps.push({name,completedAt:new Date().toISOString(),result});
      return result;
    };
    const options = [];
    const now = Date.now();
    // Public demonstration places, never approximate host location.
    for (const site of sites) {
      const name = DEMO_SITES[site].name;
      const resolved = await call("resolve_place",{placeQuery:name},resolvePlaceResultSchema);
      const place = selectDemonstrationPlace(name,resolved.matches);
      const window = {startUtc:new Date(now).toISOString(),endUtc:new Date(now + 24*3600000).toISOString(),timeZone:place.timeZone};
      const option = {placeId:place.placeId,activity:"general-stargazing",window};
      await call("get_astronomy_window",{placeId:place.placeId,window},astronomyWindowResultSchema);
      const weather = await call("get_night_conditions",{placeId:place.placeId,window},nightConditionsResultSchema);
      assert.ok(weather.forecasts.some((forecast:any) => ["available","partial"].includes(forecast.availability.status) && forecast.samples.length > 0),"Fresh real forecast evidence is required.");
      const before = budget.count;
      const plan = await call("plan_observing_session",option,planResultSchema);
      assert.ok(plan.sources.some((source:any) => source.name === "MET Norway"),"Plan must contain MET evidence.");
      assert.equal(budget.count,before,"Plan should reuse still-fresh provider cache.");
      options.push(option);
    }
    const before = budget.count;
    // A single-site run still exercises compare, contrasting activities using
    // the same live source window without another source request.
    if (options.length === 1) options.push({...options[0],activity:"astrophotography"});
    const comparison = await call("compare_observing_options",{options},compareObservingOptionsResultSchema);
    assert.equal(comparison.comparisons.length,options.length);
    assert.ok(comparison.comparisons.every((option:any) => option.sources.some((source:any) => source.name === "MET Norway")));
    assert.equal(budget.count,before,"Compare should reuse still-fresh provider cache.");
    report.passed = true;
  } catch {
    report.failure = "Live journey failed; inspect completed structured steps and source response statuses. No automatic retry was performed.";
    throw new Error(report.failure);
  } finally {
    if (server.listening) await new Promise<void>((done,reject) => { server.close(error => error ? reject(error) : done()); server.closeAllConnections(); });
    report.finishedAt = new Date().toISOString();
    report.sourceRequestCount = budget.count;
    await mkdir(resolve(".data/met"),{recursive:true});
    await writeFile(output,JSON.stringify(report,null,2));
    console.log(JSON.stringify({passed:report.passed,sourceRequestCount:budget.count,reusedFreshSnapshots:report.reusedFreshSnapshots,report:output}));
  }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runLivePlanning().catch(error => { console.error(error.message); process.exitCode = 1; });
}
