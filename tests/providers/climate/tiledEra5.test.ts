import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, writeFile, rm, symlink, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import test from "node:test";
import { createTiledEra5ClimateProvider, suppliedCellKey } from "../../../server/providers/climate/tiledEra5";
import { GeoNamesPlaceIndex } from "../../../server/places/geonames";
import { createEra5ClimateProvider } from "../../../server/providers/climate/era5";
import { once } from "node:events";
import { createServer } from "node:http";
import express from "express";
import { mountMcpRoute } from "../../../server/mcp/route";
const sha = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");
const placeId = "place:v1:geonames:1";
const index = new GeoNamesPlaceIndex([[1, "Fixture", "Fixture", "", 10.24, 77.49, "IN", "India", 1000, "Asia/Kolkata"]], "fictional-index");
const period = { startNight: "2025-01-01", endNight: "2025-12-31", kind: "sample-only" };
const source = { name: "Fictional engineering fixture; not real ERA5 measurements", url: "https://doi.org/10.24381/cds.adbb2d47", attribution: "Fictional data solely for validation. Contains no measured climate evidence.", dataClass: "reanalysis", licenseUrl: "https://creativecommons.org/licenses/by/4.0/", modified: true };
const versions = { builder: "fictional-builder-v1", astronomy: "2.1.19", timezone: "fictional-tz-v1" };
const bin = () => ({ expected: 1, valid: 1, counts: [1, 1, 1], sum: .05, yearsMask: 1, badYearsMask: 0 });
function fixtureTile() { return { schemaVersion: 2, methodVersion: "dark-cloud-v1", thresholds: [.1, .25, .5], unit: "fraction", sourceDoi: "10.24381/cds.adbb2d47", period, versions, key: "era5:10.25:77.5|Asia/Kolkata", mapping: { cellId: "era5:10.25:77.5", latitude: 10.25, longitude: 77.5, timeZone: "Asia/Kolkata" }, bins: Array.from({ length: 288 }, bin), yearMonthly: [Array.from({ length: 12 }, () => ({ expected: 24, valid: 24 }))] }; }
async function fixture(run: (options: any, tile: any, manifest: any, directory: string) => Promise<void>) {
    const directory = await mkdtemp(join(tmpdir(), "nightsky-tiled-fixture-"));
    try {
        const tile = fixtureTile();
        const tileBytes = Buffer.from(JSON.stringify(tile));
        await writeFile(join(directory, "tile.json"), tileBytes);
        const manifest = { schemaVersion: 2, methodVersion: "dark-cloud-v1", thresholds: [.1, .25, .5], unit: "fraction", sourceDoi: "10.24381/cds.adbb2d47", sourceProvenance: { ...source }, period, versions, placeIndexVintage: "fictional-index", grid: { spacingDegrees: .25, nativeResolutionApproxKm: 31, mapping: "nearest-supplied-cell" }, generatedAt: "2026-10-13T00:00:00Z", sourceRevisions: [{ sha256: "a".repeat(64), revision: "fictional-v1", kind: "raw" }], caveats: ["Fictional CI data, never real climate evidence."], tiles: [{ ...tile.mapping, key: tile.key, path: "tile.json", sha256: sha(tileBytes), bytes: tileBytes.length }] };
        const bytes = Buffer.from(JSON.stringify(manifest));
        await writeFile(join(directory, "manifest.json"), bytes);
        await run({ index, artifactPath: join(directory, "manifest.json"), expectedSha256: sha(bytes) }, tile, manifest, directory);
    }
    finally {
        assert.ok(resolve(directory).startsWith(resolve(tmpdir()) + sep));
        await rm(directory, { recursive: true, force: true });
    }
}
test("tiled runtime serves only checksum-pinned fictional sample data and recomputes statistics", async () => {
    await fixture(async (options) => { const provider = createTiledEra5ClimateProvider(options); const result = await provider.getClimatology(placeId, 1); assert.equal(result.availability.status, "partial"); assert.ok(Math.abs(result.summary!.meanCloudFraction! - .05) < 1e-12); assert.equal(result.summary?.thresholds?.[0]?.frequency, 1); assert.match(result.sources[0].name, /Fictional/); assert.equal((await provider.getClimatology("place:v1:geonames:999", 1)).availability.status, "not-covered"); });
});
async function persist(options: any, tile: any, manifest: any, directory: string) {
    const tileBytes = Buffer.from(JSON.stringify(tile));
    await writeFile(join(directory, "tile.json"), tileBytes);
    manifest.tiles[0].sha256 = sha(tileBytes);
    manifest.tiles[0].bytes = tileBytes.length;
    const bytes = Buffer.from(JSON.stringify(manifest));
    await writeFile(join(directory, "manifest.json"), bytes);
    options.expectedSha256 = sha(bytes);
}
test("existing provider factory dispatches trusted version2 without duplicate file reads", async () => {
    await fixture(async (options) => { let reads = 0; const provider = createEra5ClimateProvider({ ...options, onRead: () => reads++ }); const result = await provider.getClimatology(placeId, 1); assert.equal(result.availability.status, "partial"); assert.equal(reads, 2); await provider.getClimatology(placeId, 2); assert.equal(reads, 2); });
});
test("actual MCP returns schema2 tiled historical evidence with preserved provenance and all twelve months", async () => {
    await fixture(async options => {
        const app = express();
        app.use(express.json({ limit: "32kb" }));
        mountMcpRoute(app, { placeIndex: index, climateProvider: createEra5ClimateProvider(options), fetcher: async () => { throw Error("External traffic forbidden in fixture"); } });
        const server = createServer(app).listen(0, "127.0.0.1");
        await once(server, "listening");
        const address = server.address();
        assert.ok(address && typeof address !== "string");
        try {
            for (let month = 1; month <= 12; month++) {
                const response = await fetch(`http://127.0.0.1:${address.port}/mcp`, { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream", "mcp-protocol-version": "2025-11-25" }, body: JSON.stringify({ jsonrpc: "2.0", id: month, method: "tools/call", params: { name: "get_clear_sky_climatology", arguments: { placeId, month } } }) });
                assert.equal(response.status, 200);
                const body = await response.text();
                const event = body.split("\n").find(line => line.startsWith("data: "));
                const result = JSON.parse(event ? event.slice(6) : body).result;
                assert.equal(result.isError, undefined);
                assert.equal(result.structuredContent.availability.status, "partial");
                assert.equal(result.structuredContent.month, month);
                assert.equal(result.structuredContent.bins.length, 24);
                assert.equal(result.structuredContent.historicalLabel, "historical-not-a-forecast");
                assert.match(result.structuredContent.sources[0].name, /Fictional/);
                assert.equal(result.structuredContent.summary.validEligibleSamples, 24);
            }
        } finally {
            server.closeAllConnections();
            await new Promise<void>(done => server.close(() => done()));
        }
    });
});
test("manifest/tile checksums, metadata, masks, counts and explicit byte bounds fail closed", async () => {
    for (const variant of ["manifest-sha", "tile-sha", "tile-size", "manifest-size", "version", "period", "year-mask", "bad-mask", "impossible-bad-mask", "sum", "counts", "year-monthly", "provenance", "index-vintage", "duplicate-key", "timezone", "bin-count", "software-version", "partial-period", "thresholds", "manifest-thresholds", "missing-thresholds"]) {
        await fixture(async (options, tile, manifest, directory) => {
            if (variant === "version")
                tile.schemaVersion = 99;
            if (variant === "period")
                tile.period = { ...tile.period, startNight: "2024-01-01" };
            if (variant === "year-mask")
                tile.bins[0].yearsMask = 2;
            if (variant === "bad-mask")
                tile.bins[0].badYearsMask = 2;
            if (variant === "impossible-bad-mask")
                tile.bins[0].badYearsMask = 1;
            if (variant === "sum")
                tile.bins[0].sum = 2;
            if (variant === "counts")
                tile.bins[0].counts = [2, 1, 1];
            if (variant === "year-monthly")
                tile.yearMonthly[0][0].valid = 23;
            if (variant === "provenance")
                manifest.sourceProvenance.modified = false;
            if (variant === "index-vintage")
                manifest.placeIndexVintage = "wrong-index";
            if (variant === "duplicate-key")
                manifest.tiles.push({ ...manifest.tiles[0] });
            if (variant === "timezone")
                manifest.tiles[0].timeZone = "UTC";
            if (variant === "thresholds") tile.thresholds = [.1, .2, .5];
            if (variant === "manifest-thresholds") manifest.thresholds = [.1, .2, .5];
            if (variant === "missing-thresholds") delete tile.thresholds;
            if (variant === "bin-count")
                tile.bins.pop();
            if (variant === "software-version")
                tile.versions = { ...tile.versions, timezone: "different-version" };
            if (variant === "partial-period")
                tile.period = manifest.period = { startNight: "2025-01-01", endNight: "2025-01-31", kind: "sample-only" };
            await persist(options, tile, manifest, directory);
            if (variant === "manifest-sha")
                options.expectedSha256 = "b".repeat(64);
            if (variant === "tile-sha") {
                manifest.tiles[0].sha256 = "b".repeat(64);
                const bytes = Buffer.from(JSON.stringify(manifest));
                await writeFile(options.artifactPath, bytes);
                options.expectedSha256 = sha(bytes);
            }
            if (variant === "tile-size")
                options.maxArtifactBytes = 1;
            if (variant === "manifest-size")
                options.maxManifestBytes = 1;
            const result = await createTiledEra5ClimateProvider(options).getClimatology(placeId, 1);
            assert.equal(result.availability.status, "unavailable", variant);
            assert.equal(result.summary, undefined);
            assert.equal(JSON.stringify(result).includes(directory), false);
        });
    }
});
test("runtime budgets reject actual oversized manifest/tile bytes and never infer trust", async () => {
    await fixture(async (options, _tile, manifest, directory) => {
        assert.equal((await createTiledEra5ClimateProvider({ ...options, expectedSha256: undefined }).getClimatology(placeId, 1)).availability.status, "unavailable");
        for (const settings of [{ maxManifestBytes: 4 * 1024 * 1024 + 1 }, { maxArtifactBytes: 8 * 1024 * 1024 + 1 }, { maxCacheBytes: 32 * 1024 * 1024 + 1 }, { maxCacheBytes: 0 }])
            assert.throws(() => createTiledEra5ClimateProvider({ ...options, ...settings }), /limits/);
        const hugeTile = Buffer.alloc(8 * 1024 * 1024 + 1, 32);
        await writeFile(join(directory, "tile.json"), hugeTile);
        assert.equal((await createTiledEra5ClimateProvider(options).getClimatology(placeId, 1)).availability.status, "unavailable");
        const oversized = Buffer.concat([Buffer.from(JSON.stringify(manifest)), Buffer.alloc(4 * 1024 * 1024, 32)]);
        await writeFile(options.artifactPath, oversized);
        options.expectedSha256 = sha(oversized);
        let reads = 0;
        assert.equal((await createTiledEra5ClimateProvider({ ...options, onRead: () => reads++ }).getClimatology(placeId, 1)).availability.status, "unavailable");
        assert.equal(reads, 0, "manifest stat rejects before allocating oversized contents");
        assert.equal((await createEra5ClimateProvider(options).getClimatology(placeId, 1)).availability.status, "unavailable");
    });
});
test("exact baseline accepts 30-year evidence but preserves concentrated bad-bin partial status", async () => {
    await fixture(async (options, tile, manifest, directory) => {
        tile.period = manifest.period = { startNight: "1991-01-01", endNight: "2020-12-31", kind: "baseline-1991-2020" };
        tile.bins = Array.from({ length: 288 }, () => ({ expected: 30, valid: 30, counts: [30, 30, 30], sum: 1.5, yearsMask: 0x3fffffff, badYearsMask: 0 }));
        tile.yearMonthly = Array.from({ length: 30 }, () => Array.from({ length: 12 }, () => ({ expected: 24, valid: 24 })));
        await persist(options, tile, manifest, directory);
        const good = await createTiledEra5ClimateProvider(options).getClimatology(placeId, 1);
        assert.equal(good.availability.status, "available");
        assert.equal(good.summary?.representedYears, 30);
        Object.assign(tile.bins[0], { valid: 29, counts: [29, 29, 29], sum: 1.45, yearsMask: 0x3ffffffe, badYearsMask: 1 });
        tile.yearMonthly[0][0].valid = 23;
        await persist(options, tile, manifest, directory);
        const bad = await createTiledEra5ClimateProvider(options).getClimatology(placeId, 1);
        assert.equal(bad.availability.status, "partial");
        assert.equal(bad.summary?.badYearCount, 1);
        assert.ok(bad.summary!.completeness! > .99);
    });
});
test("baseline missing years and valid-sample denominators remain partial", async () => {
    await fixture(async (options, tile, manifest, directory) => {
        tile.period = manifest.period = { startNight: "1991-01-01", endNight: "2020-12-31", kind: "baseline-1991-2020" };
        const represented = 2 ** 26 - 1, bad = 0x3fffffff ^ represented;
        tile.bins = Array.from({ length: 288 }, () => ({ expected: 30, valid: 26, counts: [26, 26, 26], sum: 1.3, yearsMask: represented, badYearsMask: bad }));
        tile.yearMonthly = Array.from({ length: 30 }, (_, year) => Array.from({ length: 12 }, () => ({ expected: 24, valid: year < 26 ? 24 : 0 })));
        await persist(options, tile, manifest, directory);
        const result = await createTiledEra5ClimateProvider(options).getClimatology(placeId, 1);
        assert.equal(result.availability.status, "partial");
        assert.equal(result.summary?.representedYears, 26);
        assert.ok(result.summary!.completeness! < .9);
        assert.equal(result.summary?.badYearCount, 4);
        tile.bins = Array.from({ length: 288 }, () => ({ expected: 30, valid: 0, counts: [0, 0, 0], sum: 0, yearsMask: 0, badYearsMask: 0x3fffffff }));
        tile.yearMonthly = Array.from({ length: 30 }, () => Array.from({ length: 12 }, () => ({ expected: 24, valid: 0 })));
        await persist(options, tile, manifest, directory);
        const empty = await createTiledEra5ClimateProvider(options).getClimatology(placeId, 1);
        assert.equal(empty.availability.status, "partial");
        assert.equal(empty.summary?.meanCloudFraction, undefined);
        assert.equal(empty.summary?.thresholds, undefined);
    });
});
test("zero dark-time denominator omits cloud numeric statistics", async () => {
    await fixture(async (options, tile, manifest, directory) => {
        tile.bins = Array.from({ length: 288 }, () => ({ expected: 0, valid: 0, counts: [0, 0, 0], sum: 0, yearsMask: 0, badYearsMask: 0 }));
        tile.yearMonthly = [Array.from({ length: 12 }, () => ({ expected: 0, valid: 0 }))];
        await persist(options, tile, manifest, directory);
        const result = await createTiledEra5ClimateProvider(options).getClimatology(placeId, 1);
        assert.equal(result.availability.status, "not-covered");
        assert.equal(result.summary?.meanCloudFraction, undefined);
        assert.equal(result.summary?.thresholds, undefined);
        assert.equal(result.summary?.completeness, undefined);
    });
});
test("absolute, parent and URL tile paths are rejected without opening outside data", async () => {
    for (const path of ["../tile.json", "/outside.json", "C:/outside.json", "sub/../tile.json", "https://example.com/tile.json"]) {
        await fixture(async (options, _tile, manifest) => { manifest.tiles[0].path = path; const bytes = Buffer.from(JSON.stringify(manifest)); await writeFile(options.artifactPath, bytes); options.expectedSha256 = sha(bytes); assert.equal((await createTiledEra5ClimateProvider(options).getClimatology(placeId, 1)).availability.status, "unavailable"); });
    }
});
test("tile symlinks cannot read even checksum-matching files outside the release directory", async (t) => {
    await fixture(async (options, tile, manifest, directory) => {
        const outside = await mkdtemp(join(tmpdir(), "nightsky-outside-fixture-"));
        try {
            const outsidePath = join(outside, "outside.json");
            await writeFile(outsidePath, JSON.stringify(tile));
            try {
                await symlink(outsidePath, join(directory, "link.json"), "file");
            }
            catch (error: any) {
                if (error.code === "EPERM" || error.code === "EACCES") {
                    t.skip("Host does not permit fixture symlink creation; Linux CI exercises this guard.");
                    return;
                }
                throw error;
            }
            manifest.tiles[0].path = "link.json";
            const bytes = Buffer.from(JSON.stringify(manifest));
            await writeFile(options.artifactPath, bytes);
            options.expectedSha256 = sha(bytes);
            assert.equal((await createTiledEra5ClimateProvider(options).getClimatology(placeId, 1)).availability.status, "unavailable");
        }
        finally {
            assert.ok(resolve(outside).startsWith(resolve(tmpdir()) + sep));
            await rm(outside, { recursive: true, force: true });
        }
    });
});
test("same-key reads coalesce, cache uses serialized bytes and corrupt reads can recover", async () => {
    await fixture(async (options, tile, manifest, directory) => {
        let reads = 0;
        const provider = createTiledEra5ClimateProvider({ ...options, onRead: () => reads++ });
        const results = await Promise.all([provider.getClimatology(placeId, 1), provider.getClimatology(placeId, 2)]);
        assert.equal(results[0].availability.status, "partial");
        assert.equal(reads, 2);
        assert.equal(provider.inspectCache().bytes, manifest.tiles[0].bytes);
        await provider.getClimatology(placeId, 3);
        assert.equal(reads, 2);
        const uncached = createTiledEra5ClimateProvider({ ...options, maxCacheBytes: 1, onRead: () => reads++ });
        await uncached.getClimatology(placeId, 1);
        const after = reads;
        await uncached.getClimatology(placeId, 2);
        assert.equal(reads, after + 1);
        assert.equal(uncached.inspectCache().bytes, 0);
        await writeFile(join(directory, "tile.json"), "corrupt");
        const recover = createTiledEra5ClimateProvider(options);
        assert.equal((await recover.getClimatology(placeId, 1)).availability.status, "unavailable");
        await writeFile(join(directory, "tile.json"), JSON.stringify(tile));
        assert.equal((await recover.getClimatology(placeId, 1)).availability.status, "partial");
    });
});
test("different uncached keys fail busy without queueing; bounded LRU evicts and reloads", async () => {
    await fixture(async (options, tile, manifest, directory) => {
        options.index = new GeoNamesPlaceIndex([[1, "Fixture", "Fixture", "", 10.24, 77.49, "IN", "India", 1000, "Asia/Kolkata"], [2, "Other", "Other", "", 20.24, 77.49, "IN", "India", 1000, "Asia/Kolkata"]], "fictional-index");
        const second = structuredClone(tile);
        second.mapping.latitude = 20.25;
        second.mapping.cellId = "era5:20.25:77.5";
        second.key = "era5:20.25:77.5|Asia/Kolkata";
        const bytes = Buffer.from(JSON.stringify(second));
        await writeFile(join(directory, "second.json"), bytes);
        manifest.tiles.push({ ...second.mapping, key: second.key, path: "second.json", sha256: sha(bytes), bytes: bytes.length });
        const manifestBytes = Buffer.from(JSON.stringify(manifest));
        await writeFile(options.artifactPath, manifestBytes);
        options.expectedSha256 = sha(manifestBytes);
        let signalEntered!: () => void, release!: () => void;
        const entered = new Promise<void>(done => signalEntered = done), blocked = new Promise<void>(done => release = done);
        let reads = 0;
        const provider = createTiledEra5ClimateProvider({ ...options, maxCacheBytes: Math.max(bytes.length, manifest.tiles[0].bytes), onTileRead: async () => { if (++reads === 1) {
                signalEntered();
                await blocked;
            } } });
        const pending = provider.getClimatology(placeId, 1);
        await entered;
        const busy = await provider.getClimatology("place:v1:geonames:2", 1);
        assert.equal(busy.availability.status, "unavailable");
        assert.match(busy.availability.reason, /busy/);
        assert.equal(reads, 1);
        const coalesced = provider.getClimatology(placeId, 2);
        release();
        assert.equal((await pending).availability.status, "partial");
        assert.equal((await coalesced).availability.status, "partial");
        assert.equal(reads, 1);
        assert.equal((await provider.getClimatology("place:v1:geonames:2", 1)).availability.status, "partial");
        assert.equal(provider.inspectCache().entries, 1);
        assert.equal(reads, 2);
        assert.equal((await provider.getClimatology(placeId, 1)).availability.status, "partial");
        assert.equal(reads, 3);
        assert.equal(provider.inspectCache().entries, 1);
        assert.ok(provider.inspectCache().bytes <= Math.max(bytes.length, manifest.tiles[0].bytes));
        assert.equal(provider.inspectCache().active, false);
    });
});
test("unlisted timezone never falls back and failed manifest loading can recover", async () => {
    await fixture(async (options, _tile, _manifest, directory) => {
        options.index = new GeoNamesPlaceIndex([[1, "Fixture", "Fixture", "", 10.24, 77.49, "IN", "India", 1000, "UTC"]], "fictional-index");
        assert.equal((await createTiledEra5ClimateProvider(options).getClimatology(placeId, 1)).availability.status, "not-covered");
        const original = await readFile(options.artifactPath);
        await writeFile(options.artifactPath, "bad");
        const provider = createTiledEra5ClimateProvider(options);
        assert.equal((await provider.getClimatology(placeId, 1)).availability.status, "unavailable");
        await writeFile(options.artifactPath, original);
        assert.equal((await provider.getClimatology(placeId, 1)).availability.status, "not-covered");
    });
});
test("quarter cell keys normalize longitude and use documented positive half ties", () => {
    assert.equal(suppliedCellKey(10.125, 180, "UTC"), "era5:10.25:-180|UTC");
    assert.equal(suppliedCellKey(-10.125, -180, "UTC"), "era5:-10:-180|UTC");
});
