/** Offline, bounded fresh-process MCP measurement. No host-fit conclusion. */
import assert from "node:assert/strict";
import { once } from "node:events";
import { createServer } from "node:http";
import { performance } from "node:perf_hooks";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createReadStream } from "node:fs";
import { createHash } from "node:crypto";
import * as z from "zod4";
import { createConfiguredNightSkyPluginApp, pluginGlobalConfiguration, pluginRegionalConfiguration } from "../server/plugin";
import { climateArtifactConfiguration } from "../server/providers/climate/configuration";
import { climateContextResultSchema } from "../shared/nightsky/climate";
import { searchDiscoveryResultSchema } from "../shared/nightsky/discovery";
import { getAstronomyWindowInputSchema, astronomyWindowResultSchema } from "../shared/nightsky/astronomy";
import { resolvePlaceResultSchema, searchObservingLocationsResultSchema } from "../shared/nightsky/places";
export function candidateEvidenceIsValid(value: unknown, allowNotCovered = false, global = false): boolean {
    const parsed = (global ? searchDiscoveryResultSchema : z.union([searchDiscoveryResultSchema,searchObservingLocationsResultSchema])).safeParse(value);
    if (!parsed.success)
        return false;
    const result = parsed.data;
    if (!result.sources.some(source => (global ? source.dataClass === "catalog" : source.name === "OpenStreetMap contributors") && source.vintage))
        return false;
    return ["available", "partial"].includes(result.availability.status) && result.candidates.length > 0 ||
        allowNotCovered && result.availability.status === "not-covered" && result.candidates.length === 0;
}
export function capacityCandidatePlaceId(defaultPlaceId: string, configured?: string): string {
    const value = configured ?? defaultPlaceId;
    assert.ok(/^place:v1:geonames:[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value.split(":").at(-1))), "Invalid candidate measurement named-place ID");
    return value;
}
export function percentiles(samples: number[]) {
    assert.ok(samples.length && samples.every(n => Number.isFinite(n) && n >= 0));
    const sorted = [...samples].sort((a, b) => a - b);
    return { p50Ms: sorted[Math.ceil(sorted.length * .5) - 1], p95Ms: sorted[Math.ceil(sorted.length * .95) - 1] };
}
const workloadSchema=z.strictObject({placeQuery:z.string().trim().min(1).max(160),placeId:z.string(),month:z.number().int().min(1).max(12),candidatePlaceId:z.string(),window:getAstronomyWindowInputSchema.shape.window,expectedHistoryStatus:z.enum(["available","partial"])});
export function capacityConfiguration(env:NodeJS.ProcessEnv & Parameters<typeof climateArtifactConfiguration>[0] & Parameters<typeof pluginGlobalConfiguration>[0],args:string[]) {
    assert.ok(args.includes("--offline"),"Explicit --offline is required.");
    const mode=args.includes("--release")?"release":"retained";
    assert.ok(env.NIGHTSKY_GEONAMES_INDEX,"Explicit real gazetteer path required.");
    const history=climateArtifactConfiguration(env);
    assert.ok(history.artifactPath && /^[a-f0-9]{64}$/i.test(history.expectedSha256??""),"Pinned historical artifact required");
    const global=pluginGlobalConfiguration(env),regional=pluginRegionalConfiguration(env);
    const geography=global?"global":regional?"regional":env.NIGHTSKY_OSM_CANDIDATE_INDEX?"flat":"none";
    if(geography==="flat") assert.ok(/^[a-f0-9]{64}$/i.test(env.NIGHTSKY_OSM_CANDIDATE_SHA256??""),"Pinned candidates required");
    if(mode==="release") {
        assert.ok(history.format==="release" && global,"Release measurement requires production history and global geography");
        assert.ok(/^[a-f0-9]{64}$/i.test(env.NIGHTSKY_GEONAMES_SHA256??""),"Release gazetteer digest required");
        assert.ok(!args.includes("--expect-no-candidates"),"Release covered workload cannot expect no candidates");
        assert.ok(env.NIGHTSKY_CAPACITY_WORKLOAD,"Explicit release workload required");
    }
    assert.ok(!env.NIGHTSKY_MCP_TOOL_MODE || env.NIGHTSKY_MCP_TOOL_MODE==="full","Full tool mode required");
    const workload=workloadSchema.parse(env.NIGHTSKY_CAPACITY_WORKLOAD?JSON.parse(env.NIGHTSKY_CAPACITY_WORKLOAD):{placeQuery:"Kodaikanal, India",placeId:"place:v1:geonames:1266425",month:10,window:{startUtc:"2026-10-13T12:00:00Z",endUtc:"2026-10-14T12:00:00Z",timeZone:"Asia/Kolkata"},expectedHistoryStatus:"partial",candidatePlaceId:env.NIGHTSKY_CAPACITY_CANDIDATE_PLACE_ID??"place:v1:geonames:1266425"});
    getAstronomyWindowInputSchema.parse({placeId:workload.placeId,window:workload.window});
    capacityCandidatePlaceId(workload.placeId);capacityCandidatePlaceId(workload.candidatePlaceId);
    const pins=[{kind:"gazetteer",path:env.NIGHTSKY_GEONAMES_INDEX,sha256:env.NIGHTSKY_GEONAMES_SHA256},{kind:"history",path:history.artifactPath,sha256:history.expectedSha256},...(global?[{kind:"global",path:global.path,sha256:global.expectedSha256}]:regional?[{kind:"regional",path:regional.path,sha256:regional.expectedSha256}]:geography==="flat"?[{kind:"flat",path:env.NIGHTSKY_OSM_CANDIDATE_INDEX!,sha256:env.NIGHTSKY_OSM_CANDIDATE_SHA256}]:[])];
    return {mode,geography,workload,pins};
}
async function measurePin(pin:{kind:string;path:string;sha256?:string}) {
    const hash=createHash("sha256");let bytes=0;
    for await(const chunk of createReadStream(pin.path)){bytes+=chunk.length;hash.update(chunk);}
    const sha256=hash.digest("hex");
    if(pin.sha256)assert.equal(sha256,pin.sha256.toLowerCase(),`Changed ${pin.kind} input`);
    return {kind:pin.kind,path:resolve(pin.path),sha256,bytes};
}
export async function runCapacity() {
    const configuration=capacityConfiguration(process.env,process.argv);
    const {placeId,candidatePlaceId}=configuration.workload;
    let blockedExternalCalls=0;
    let id=0,peakRssBytes=process.memoryUsage().rss;
    const sampler=setInterval(()=>{peakRssBytes=Math.max(peakRssBytes,process.memoryUsage().rss);},10);
    let server:ReturnType<typeof createServer>|undefined;
    try {
    const pins=await Promise.all(configuration.pins.map(measurePin));
    const initializationStarted=performance.now();
    const app=await createConfiguredNightSkyPluginApp({log:()=>{},fetcher:async()=>{blockedExternalCalls++;throw Error("External traffic prohibited in capacity measurement");}});
    server=createServer(app).listen(0,"127.0.0.1");
    await once(server,"listening");
    const initializationToListeningMs=performance.now()-initializationStarted;
    const address=server.address();assert.ok(address && typeof address!=="string");
    const endpoint=`http://127.0.0.1:${address.port}/mcp`;
    const mix = [
        { name: "resolve_place", arguments: { placeQuery: configuration.workload.placeQuery } },
        { name: "get_astronomy_window", arguments: { placeId, window: configuration.workload.window } },
        { name: "get_clear_sky_climatology", arguments: { placeId, month: configuration.workload.month } },
        ...(configuration.geography !== "none" ? [{ name: "search_observing_locations", arguments: { placeId: candidatePlaceId } }] : []),
    ];
    const phases: unknown[] = [];
    let totalErrors = 0, requiredArtifactFailures = 0;
        for (const [phase, concurrency, waves] of [["cold", 1, 1], ["warm", 1, 2], ["concurrent", 4, 3]] as const) {
            const samples: number[] = [];
            const statuses: Record<string, number> = {};
            const byTool:Record<string,number[]>={};
            let errors = 0;
            const started = performance.now();
            const call = async (tool: typeof mix[number]) => {
                const before = performance.now();
                try {
                    const response = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream", "mcp-protocol-version": "2025-11-25" }, body: JSON.stringify({ jsonrpc: "2.0", id: ++id, method: "tools/call", params: tool }), signal: AbortSignal.timeout(30000) });
                    const body = await response.text();
                    const event = body.split("\n").find(line => line.startsWith("data: "));
                    const payload = JSON.parse(event ? event.slice(6) : body);
                    const structured=payload.result?.structuredContent;
                    const schema=tool.name==="resolve_place"?resolvePlaceResultSchema:tool.name==="get_astronomy_window"?astronomyWindowResultSchema:tool.name==="get_clear_sky_climatology"?climateContextResultSchema:undefined;
                    if(schema && !schema.safeParse(structured).success) requiredArtifactFailures++;
                    const status = payload.result?.structuredContent?.availability?.status ?? `http-${response.status}`;
                    const statusKey = `${tool.name}:${status}`;
                    statuses[statusKey] = (statuses[statusKey] ?? 0) + 1;
                    if (tool.name === "get_clear_sky_climatology" && !["available", "partial"].includes(status))
                        requiredArtifactFailures++;
                    if (tool.name === "get_clear_sky_climatology" && configuration.mode === "release") {
                        const climate=climateContextResultSchema.safeParse(payload.result?.structuredContent);
                        if(!climate.success || climate.data.availability.status!==configuration.workload.expectedHistoryStatus || climate.data.period.kind!=="baseline-1991-2020" || climate.data.placeId!==placeId || climate.data.month!==configuration.workload.month || !climate.data.summary?.validEligibleSamples) requiredArtifactFailures++;
                    }
                    if (tool.name === "search_observing_locations" && !candidateEvidenceIsValid(payload.result?.structuredContent, process.argv.includes("--expect-no-candidates"), configuration.geography === "global"))
                        requiredArtifactFailures++;
                    if (tool.name === "resolve_place" && !payload.result?.structuredContent?.matches?.some((place: {
                        placeId: string;
                    }) => place.placeId === placeId))
                        requiredArtifactFailures++;
                    if (response.status !== 200 || payload.error || payload.result?.isError)
                        errors++;
                }
                catch {
                    errors++;
                }
                finally {
                    const elapsed=performance.now()-before;
                    samples.push(elapsed);(byTool[tool.name]??=[]).push(elapsed);
                    peakRssBytes = Math.max(peakRssBytes, process.memoryUsage().rss);
                }
            };
            for (let wave = 0; wave < waves; wave++)
                for (const tool of mix)
                    await Promise.all(Array.from({ length: concurrency }, () => call(tool)));
            const durationMs = performance.now() - started;
            totalErrors += errors;
            phases.push({ phase, concurrency, requests: samples.length, durationMs, throughputPerSecond: samples.length * 1000 / durationMs, ...percentiles(samples), perTool:Object.fromEntries(Object.entries(byTool).map(([name,times])=>[name,{requests:times.length,...percentiles(times)}])), errors, statuses, rssBytes: process.memoryUsage().rss, peakRssBytes });
        }
        assert.deepEqual(await Promise.all(configuration.pins.map(measurePin)),pins,"Inputs changed during measurement");
        const report = { evidenceMode:configuration.mode, s3Complete:false, coverageScope:"Declared cases only; partial status is not coverage completeness; independent release admission remains required", pins, workload:configuration.workload, initializationToListeningMs, startupScope:"configured app initialization through loopback listening; excludes process launch, imports and input hashing", processHighWaterRssBytes:process.resourceUsage().maxRSS*1024, environment: { platform: process.platform, node: process.version, cpuLimit: "externally enforced; inspect container", memoryLimit: "externally enforced; inspect container" }, scope: "local offline read-only MCP; real configured artifacts; not staging or host capacity approval", historicalPlaceId: placeId, candidatePlaceId, mix: mix.map(t => t.name), phases, blockedExternalCalls, peakRssBytes, totalErrors, requiredArtifactFailures };
        console.log(JSON.stringify(report, null, 2));
        assert.equal(blockedExternalCalls, 0, "Workload must never request external providers");
        assert.equal(totalErrors, 0, "Measurement contains unexpected errors; report is not passing evidence");
        assert.equal(requiredArtifactFailures, 0, "Required real gazetteer/history/candidate evidence is unavailable");
        return report;
    }
    finally {
        clearInterval(sampler);
        if(server){const active=server;active.closeAllConnections();await new Promise<void>(done=>active.close(()=>done()));}
    }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url))
    runCapacity().catch(error => { console.error(error.message); process.exitCode = 1; });
