/** Offline, bounded fresh-process MCP measurement. No host-fit conclusion. */
import assert from "node:assert/strict";
import { once } from "node:events";
import { createServer } from "node:http";
import { performance } from "node:perf_hooks";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { mountMcpRoute } from "../server/mcp/route";
import { searchObservingLocationsResultSchema } from "../shared/nightsky/places";
export function candidateEvidenceIsValid(value: unknown, allowNotCovered = false): boolean {
    const parsed = searchObservingLocationsResultSchema.safeParse(value);
    if (!parsed.success)
        return false;
    const result = parsed.data;
    if (!result.sources.some(source => source.name === "OpenStreetMap contributors" && source.vintage))
        return false;
    return result.availability.status === "partial" && result.candidates.length > 0 ||
        allowNotCovered && result.availability.status === "not-covered" && result.candidates.length === 0;
}
export function percentiles(samples: number[]) {
    assert.ok(samples.length && samples.every(n => Number.isFinite(n) && n >= 0));
    const sorted = [...samples].sort((a, b) => a - b);
    return { p50Ms: sorted[Math.ceil(sorted.length * .5) - 1], p95Ms: sorted[Math.ceil(sorted.length * .95) - 1] };
}
export async function runCapacity() {
    assert.ok(process.argv.includes("--offline"), "Explicit --offline is required.");
    assert.ok(process.env.NIGHTSKY_GEONAMES_INDEX, "Explicit real gazetteer path required.");
    assert.ok(process.env.NIGHTSKY_CLIMATE_ARTIFACT && process.env.NIGHTSKY_CLIMATE_SHA256, "Explicit reviewed historical artifact and digest required.");
    let blockedExternalCalls = 0;
    const app = express();
    app.use(express.json({ limit: "32kb" }));
    mountMcpRoute(app, { fetcher: async () => { blockedExternalCalls++; throw Error("External traffic prohibited in capacity measurement"); } });
    const server = createServer(app).listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    let id = 0, peakRssBytes = process.memoryUsage().rss;
    const sampler = setInterval(() => { peakRssBytes = Math.max(peakRssBytes, process.memoryUsage().rss); }, 10);
    const endpoint = `http://127.0.0.1:${address.port}/mcp`;
    const placeId = "place:v1:geonames:1266425";
    const mix = [
        { name: "resolve_place", arguments: { placeQuery: "Kodaikanal, India" } },
        { name: "get_astronomy_window", arguments: { placeId, window: { startUtc: "2026-10-13T12:00:00Z", endUtc: "2026-10-14T12:00:00Z", timeZone: "Asia/Kolkata" } } },
        { name: "get_clear_sky_climatology", arguments: { placeId, month: 10 } },
        ...(process.env.NIGHTSKY_OSM_CANDIDATE_INDEX ? [{ name: "search_observing_locations", arguments: { placeId } }] : []),
    ];
    const phases: unknown[] = [];
    let totalErrors = 0, requiredArtifactFailures = 0;
    try {
        for (const [phase, concurrency, waves] of [["cold", 1, 1], ["warm", 1, 2], ["concurrent", 4, 3]] as const) {
            const samples: number[] = [];
            const statuses: Record<string, number> = {};
            let errors = 0;
            const started = performance.now();
            const call = async (tool: typeof mix[number]) => {
                const before = performance.now();
                try {
                    const response = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream", "mcp-protocol-version": "2025-11-25" }, body: JSON.stringify({ jsonrpc: "2.0", id: ++id, method: "tools/call", params: tool }), signal: AbortSignal.timeout(30000) });
                    const body = await response.text();
                    const event = body.split("\n").find(line => line.startsWith("data: "));
                    const payload = JSON.parse(event ? event.slice(6) : body);
                    const status = payload.result?.structuredContent?.availability?.status ?? `http-${response.status}`;
                    const statusKey = `${tool.name}:${status}`;
                    statuses[statusKey] = (statuses[statusKey] ?? 0) + 1;
                    if (tool.name === "get_clear_sky_climatology" && !["available", "partial"].includes(status))
                        requiredArtifactFailures++;
                    if (tool.name === "search_observing_locations" && !candidateEvidenceIsValid(payload.result?.structuredContent, process.argv.includes("--expect-no-candidates")))
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
                    samples.push(performance.now() - before);
                    peakRssBytes = Math.max(peakRssBytes, process.memoryUsage().rss);
                }
            };
            for (let wave = 0; wave < waves; wave++)
                for (const tool of mix)
                    await Promise.all(Array.from({ length: concurrency }, () => call(tool)));
            const durationMs = performance.now() - started;
            totalErrors += errors;
            phases.push({ phase, concurrency, requests: samples.length, durationMs, throughputPerSecond: samples.length * 1000 / durationMs, ...percentiles(samples), errors, statuses, rssBytes: process.memoryUsage().rss, peakRssBytes });
        }
        const report = { environment: { platform: process.platform, node: process.version, cpuLimit: "externally enforced; inspect container", memoryLimit: "externally enforced; inspect container" }, scope: "local offline read-only MCP; real configured artifacts; not staging or host capacity approval", mix: mix.map(t => t.name), phases, blockedExternalCalls, peakRssBytes, totalErrors, requiredArtifactFailures };
        console.log(JSON.stringify(report, null, 2));
        assert.equal(blockedExternalCalls, 0, "Workload must never request external providers");
        assert.equal(totalErrors, 0, "Measurement contains unexpected errors; report is not passing evidence");
        assert.equal(requiredArtifactFailures, 0, "Required real gazetteer/history evidence is unavailable");
        return report;
    }
    finally {
        clearInterval(sampler);
        server.closeAllConnections();
        await new Promise<void>(done => server.close(() => done()));
    }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url))
    runCapacity().catch(error => { console.error(error.message); process.exitCode = 1; });
