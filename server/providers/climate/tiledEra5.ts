/** Read-only aggregate serving; does not fetch CDS or calculate astronomy. */
import { createHash } from "node:crypto";
import { constants } from "node:fs";
import { lstat, open, realpath } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import * as z from "zod4";
import { climateContextResultSchema, climatePeriodSchema, climateStatisticsSchema, CLOUD_THRESHOLDS, CLIMATE_METHOD_VERSION, getClearSkyClimatologyInputSchema, type ClimateStatistics } from "../../../shared/nightsky/climate";
import { sourceRecordSchema, ianaTimeZoneSchema, latitudeSchema, longitudeSchema, utcInstantSchema } from "../../../shared/nightsky/common";
import type { Era5ClimateProviderOptions } from "./era5";
const MiB = 1024 * 1024;
const uint32 = z.number().int().min(0).max(0xffffffff);
const mask = z.number().int().min(0).max(0x3fffffff);
const digest = z.string().regex(/^[a-f0-9]{64}$/);
const versionsSchema = z.strictObject({ builder: z.string().min(1).max(100), astronomy: z.literal("2.1.19"), timezone: z.string().min(1).max(100) });
const mappingSchema = z.strictObject({ cellId: z.string().min(1).max(80), latitude: latitudeSchema, longitude: longitudeSchema, timeZone: ianaTimeZoneSchema });
const metadata = { schemaVersion: z.literal(2), methodVersion: z.literal(CLIMATE_METHOD_VERSION), thresholds: z.tuple([z.literal(.1), z.literal(.25), z.literal(.5)]), unit: z.literal("fraction"), sourceDoi: z.literal("10.24381/cds.adbb2d47"), period: climatePeriodSchema, versions: versionsSchema };
const descriptorSchema = mappingSchema.extend({ key: z.string().min(1).max(150), path: z.string().min(1).max(300), sha256: digest, bytes: z.number().int().min(1).max(8 * MiB) });
export const tiledEra5ManifestSchema = z.strictObject({ ...metadata, sourceProvenance: sourceRecordSchema, placeIndexVintage: z.string().min(1).max(100), grid: z.strictObject({ spacingDegrees: z.literal(.25), nativeResolutionApproxKm: z.literal(31), mapping: z.literal("nearest-supplied-cell") }), generatedAt: utcInstantSchema, sourceRevisions: z.array(z.strictObject({ sha256: digest, revision: z.string().min(1).max(100), kind: z.enum(["raw", "decoded", "manifest"]) })).min(1).max(10000), caveats: z.array(z.string().min(1).max(500)).max(20), tiles: z.array(descriptorSchema).min(1).max(10000) });
const binSchema = z.strictObject({ expected: uint32, valid: uint32, counts: z.tuple([uint32, uint32, uint32]), sum: z.number().finite().nonnegative(), yearsMask: mask, badYearsMask: mask });
export const tiledEra5TileSchema = z.strictObject({ ...metadata, key: z.string().min(1).max(150), mapping: mappingSchema, bins: z.array(binSchema).length(288), yearMonthly: z.array(z.array(z.strictObject({ expected: uint32, valid: uint32 })).length(12)).min(1).max(30) });
export type TiledEra5Manifest = z.infer<typeof tiledEra5ManifestSchema>;
export type TiledEra5Tile = z.infer<typeof tiledEra5TileSchema>;
type Manifest = TiledEra5Manifest;
type Tile = TiledEra5Tile;
type Bin = z.infer<typeof binSchema>;
type Descriptor = z.infer<typeof descriptorSchema>;
/** Half ties select positive quarter; antimeridian has one canonical -180 cell. */
export function suppliedCellKey(latitude: number, longitude: number, timeZone: string): string {
    latitudeSchema.parse(latitude);
    longitudeSchema.parse(longitude);
    ianaTimeZoneSchema.parse(timeZone);
    const lat = Math.floor(latitude * 4 + .5) / 4;
    let lon = Math.floor(longitude * 4 + .5) / 4;
    lon = ((lon + 180) % 360 + 360) % 360 - 180;
    return `era5:${Object.is(lat, -0) ? 0 : lat}:${Object.is(lon, -0) ? 0 : lon}|${timeZone}`;
}
/** No symlinks or nonregular files. Stat + actual byte bounds + stable identity. */
export async function readTrustedClimateFile(path: string, expectedSha256: string, limit: number, onRead?: () => void): Promise<Buffer> {
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 8 * MiB)
        throw Error("Invalid climate read limit");
    digest.parse(expectedSha256);
    const before = await lstat(path);
    if (before.isSymbolicLink() || !before.isFile() || before.size > limit)
        throw Error("Invalid artifact file");
    const handle = await open(path, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
    try {
        const initial = await handle.stat();
        if (initial.dev !== before.dev || initial.ino !== before.ino || !initial.isFile() || initial.size > limit)
            throw Error("Artifact identity");
        onRead?.();
        const buffer = Buffer.alloc(initial.size + 1);
        let used = 0;
        while (used < buffer.length) {
            const part = await handle.read(buffer, used, buffer.length - used, null);
            if (!part.bytesRead)
                break;
            used += part.bytesRead;
        }
        const after = await handle.stat();
        if (used !== initial.size || used > limit || after.size !== initial.size || after.mtimeMs !== initial.mtimeMs)
            throw Error("Artifact changed");
        const bytes = buffer.subarray(0, used);
        if (createHash("sha256").update(bytes).digest("hex") !== expectedSha256)
            throw Error("Artifact checksum");
        return bytes;
    }
    finally {
        await handle.close();
    }
}
function parseBytes(bytes: Buffer): unknown { return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)); }
function relativeTileParts(path: string): string[] {
    if (isAbsolute(path) || path.includes("\\") || path.includes(":"))
        throw Error("Tile path");
    const parts = path.split("/");
    if (parts.some(part => !part || part === "." || part === ".."))
        throw Error("Tile path");
    return parts;
}
async function tilePath(directory: string, path: string): Promise<string> {
    const parts = relativeTileParts(path);
    const root = await realpath(directory), target = resolve(root, ...parts);
    const rel = relative(root, target);
    if (!rel || rel.startsWith(".." + sep) || rel === ".." || isAbsolute(rel))
        throw Error("Tile boundary");
    let current = root;
    for (const part of parts) {
        current = resolve(current, part);
        if ((await lstat(current)).isSymbolicLink())
            throw Error("Tile symlink");
    }
    const actual = await realpath(target);
    if (actual !== target)
        throw Error("Tile boundary");
    return target;
}
function popcount(value: number): number { let count = 0; while (value) {
    value &= value - 1;
    count++;
} return count; }
function combined(rows: Bin[]): Bin { return rows.reduce((all, row) => ({ expected: all.expected + row.expected, valid: all.valid + row.valid, counts: all.counts.map((n, i) => n + row.counts[i]!) as [
        number,
        number,
        number
    ], sum: all.sum + row.sum, yearsMask: all.yearsMask | row.yearsMask, badYearsMask: all.badYearsMask | row.badYearsMask }), { expected: 0, valid: 0, counts: [0, 0, 0], sum: 0, yearsMask: 0, badYearsMask: 0 }); }
function statistics(bin: Bin): ClimateStatistics {
    const [a, b, c] = bin.counts;
    const lower = (b - a) * .1 + (c - b) * .25 + (bin.valid - c) * .5, upper = a * .1 + (b - a) * .25 + (c - b) * .5 + (bin.valid - c);
    if (bin.valid > bin.expected || bin.sum > bin.valid || a > b || b > c || c > bin.valid || bin.sum < lower - 1e-8 || bin.sum > upper + 1e-8 || popcount(bin.yearsMask) > bin.valid || (!bin.valid && bin.yearsMask) || (!bin.expected && bin.badYearsMask))
        throw Error("Aggregate counts");
    return climateStatisticsSchema.parse({ expectedEligibleSamples: bin.expected, validEligibleSamples: bin.valid, representedYears: popcount(bin.yearsMask), badYearCount: popcount(bin.badYearsMask), ...(bin.expected ? { completeness: bin.valid / bin.expected } : {}), ...(bin.valid ? { meanCloudFraction: bin.sum / bin.valid, thresholds: CLOUD_THRESHOLDS.map((fraction, i) => ({ fraction, count: bin.counts[i], frequency: bin.counts[i]! / bin.valid })) } : {}) });
}
function eligibleMonthDays(period: Tile["period"], year: number, month: number): number {
    let count = 0;
    const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    for (let day = 1; day <= days; day++) {
        const night = new Date(Date.UTC(year, month, day)).toISOString().slice(0, 10);
        if (night >= period.startNight && night <= period.endNight)
            count++;
    }
    return count;
}
export function validateTiledEra5Tile(tile: Tile, manifest: Manifest, descriptor: Descriptor): void {
    if (tile.key !== descriptor.key || JSON.stringify(tile.mapping) !== JSON.stringify({ cellId: descriptor.cellId, latitude: descriptor.latitude, longitude: descriptor.longitude, timeZone: descriptor.timeZone }) || JSON.stringify(tile.period) !== JSON.stringify(manifest.period) || JSON.stringify(tile.versions) !== JSON.stringify(manifest.versions))
        throw Error("Tile metadata");
    const firstYear = Number(tile.period.startNight.slice(0, 4)), years = Number(tile.period.endNight.slice(0, 4)) - firstYear + 1, allowedMask = 2 ** years - 1;
    const allowedDays = Array.from({ length: years }, (_, year) => Array.from({ length: 12 }, (_, month) => eligibleMonthDays(tile.period, firstYear + year, month)));
    if (tile.yearMonthly.length !== years)
        throw Error("Year count");
    tile.bins.forEach((bin, i) => {
        if ((bin.yearsMask & ~allowedMask) || (bin.badYearsMask & ~allowedMask))
            throw Error("Year masks");
        const maximum = allowedDays.reduce((sum, row) => sum + row[Math.floor(i / 24)]!, 0);
        if (bin.expected > maximum)
            throw Error("Impossible samples");
        statistics(bin);
    });
    for (let month = 0; month < 12; month++) {
        const bins = tile.bins.slice(month * 24, month * 24 + 24), sum = combined(bins);
        let expected = 0, valid = 0, representedMask = 0, badMonthlyMask = 0;
        tile.yearMonthly.forEach((year, y) => {
            const row = year[month]!;
            const max = allowedDays[y]![month]! * 24;
            if (row.valid > row.expected || row.expected > max)
                throw Error("Year monthly counts");
            expected += row.expected;
            valid += row.valid;
            if (row.valid)
                representedMask |= 2 ** y;
            if (row.expected && row.valid / row.expected < .8)
                badMonthlyMask |= 2 ** y;
            for (const bin of bins) {
                if ((bin.yearsMask & 2 ** y) && !row.valid || (bin.badYearsMask & 2 ** y) && (!row.expected || row.valid === row.expected))
                    throw Error("Year mask counts");
            }
        });
        if (expected !== sum.expected || valid !== sum.valid || representedMask !== sum.yearsMask || (badMonthlyMask & ~sum.badYearsMask))
            throw Error("Monthly conservation");
        statistics(sum);
    }
}
export interface TiledEra5Options extends Era5ClimateProviderOptions {
    manifestBytes?: Buffer;
    maxManifestBytes?: number;
    onTileRead?: (key: string) => void | Promise<void>;
}
const fallbackSource = { name: "Copernicus Climate Change Service (C3S) / ECMWF", url: "https://doi.org/10.24381/cds.adbb2d47", attribution: "Contains C3S ERA5 reanalysis information from ECMWF. Derived dark-time cloud aggregation by NightSky.earth.", dataClass: "reanalysis" as const, licenseUrl: "https://creativecommons.org/licenses/by/4.0/", modified: true };
export function validateTiledEra5Manifest(data: Manifest, placeIndexVintage?: string): void {
    if (data.sourceProvenance.dataClass !== "reanalysis" || data.sourceProvenance.url !== fallbackSource.url || data.sourceProvenance.licenseUrl !== fallbackSource.licenseUrl || data.sourceProvenance.modified !== true || (placeIndexVintage !== undefined && data.placeIndexVintage !== placeIndexVintage))
        throw Error("Manifest provenance");
    const keys = new Set<string>(), paths = new Set<string>(), revisions = new Set<string>();
    for (const revision of data.sourceRevisions) {
        const key = `${revision.kind}|${revision.revision}`;
        if (revisions.has(key))
            throw Error("Duplicate source revision");
        revisions.add(key);
    }
    for (const tile of data.tiles) {
        relativeTileParts(tile.path);
        if (tile.key !== suppliedCellKey(tile.latitude, tile.longitude, tile.timeZone) || tile.cellId !== tile.key.split("|")[0] || !Number.isInteger(tile.latitude * 4) || !Number.isInteger(tile.longitude * 4) || tile.longitude === 180 || keys.has(tile.key) || paths.has(tile.path))
            throw Error("Descriptor mapping");
        keys.add(tile.key);
        paths.add(tile.path);
    }
}
export function createTiledEra5ClimateProvider(options: TiledEra5Options) {
    const tileLimit = options.maxArtifactBytes ?? 8 * MiB, cacheLimit = options.maxCacheBytes ?? 32 * MiB, manifestLimit = options.maxManifestBytes ?? 4 * MiB;
    for (const [limit, maximum] of [[tileLimit, 8 * MiB], [cacheLimit, 32 * MiB], [manifestLimit, 4 * MiB]])
        if (!Number.isSafeInteger(limit) || limit < 1 || limit > maximum)
            throw Error("Invalid climate limits");
    let manifest: Manifest | undefined, manifestPromise: Promise<Manifest> | undefined;
    const cache = new Map<string, {
        tile: Tile;
        bytes: number;
    }>();
    let cacheBytes = 0;
    let active: {
        key: string;
        promise: Promise<Tile>;
    } | undefined;
    async function loadManifest(): Promise<Manifest> {
        if (manifest)
            return manifest;
        if (manifestPromise)
            return manifestPromise;
        manifestPromise = (async () => {
            if (!options.artifactPath || !options.expectedSha256)
                throw Error("Untrusted manifest");
            const supplied = options.manifestBytes;
            options.manifestBytes = undefined;
            const bytes = supplied ?? await readTrustedClimateFile(options.artifactPath, options.expectedSha256, manifestLimit, options.onRead);
            if (bytes.length > manifestLimit || createHash("sha256").update(bytes).digest("hex") !== options.expectedSha256)
                throw Error("Manifest checksum/size");
            const data = tiledEra5ManifestSchema.parse(parseBytes(bytes));
            validateTiledEra5Manifest(data, options.index.vintageLabel);
            manifest = data;
            options.manifestBytes = undefined;
            return data;
        })().finally(() => { manifestPromise = undefined; });
        return manifestPromise;
    }
    async function loadTile(descriptor: Descriptor, data: Manifest): Promise<Tile> {
        const cached = cache.get(descriptor.key);
        if (cached) {
            cache.delete(descriptor.key);
            cache.set(descriptor.key, cached);
            return cached.tile;
        }
        if (active) {
            if (active.key === descriptor.key)
                return active.promise;
            throw Error("Tile reader busy");
        }
        const promise = (async () => {
            await options.onTileRead?.(descriptor.key);
            const path = await tilePath(dirname(options.artifactPath!), descriptor.path);
            const bytes = await readTrustedClimateFile(path, descriptor.sha256, Math.min(tileLimit, descriptor.bytes), options.onRead);
            if (bytes.length !== descriptor.bytes)
                throw Error("Tile length");
            const tile = tiledEra5TileSchema.parse(parseBytes(bytes));
            validateTiledEra5Tile(tile, data, descriptor);
            if (bytes.length <= cacheLimit) {
                while (cacheBytes + bytes.length > cacheLimit) {
                    const first = cache.keys().next().value!;
                    cacheBytes -= cache.get(first)!.bytes;
                    cache.delete(first);
                }
                cache.set(descriptor.key, { tile, bytes: bytes.length });
                cacheBytes += bytes.length;
            }
            return tile;
        })();
        active = { key: descriptor.key, promise };
        try {
            return await promise;
        }
        finally {
            if (active?.promise === promise)
                active = undefined;
        }
    }
    return {
        inspectCache() { return { bytes: cacheBytes, entries: cache.size, active: !!active }; },
        async getClimatology(placeId: string, month: number) {
            getClearSkyClimatologyInputSchema.parse({ placeId, month });
            const city = placeId.startsWith("place:v1:geonames:") ? options.index.getById(Number(placeId.split(":").at(-1))) : undefined;
            const base = { schemaVersion: 2 as const, placeId, month, timeZone: city?.timeZone ?? "UTC", dataClass: "reanalysis" as const, historicalLabel: "historical-not-a-forecast" as const, methodVersion: CLIMATE_METHOD_VERSION, sampleDefinition: "hourly-dark-time-samples" as const, unit: "fraction" as const, period: manifest?.period ?? { startNight: "2025-01-01", endNight: "2025-12-31", kind: "sample-only" as const }, sources: [manifest?.sourceProvenance ?? fallbackSource], caveats: manifest?.caveats ?? ["No verified historical tile evidence is available."] };
            try {
                const data = await loadManifest();
                const trusted = { ...base, period: data.period, sources: [data.sourceProvenance], caveats: data.caveats };
                const key = city ? suppliedCellKey(city.latitude, city.longitude, city.timeZone) : undefined, descriptor = data.tiles.find(tile => tile.key === key);
                if (!city || !descriptor)
                    return climateContextResultSchema.parse({ ...trusted, availability: { status: "not-covered", reason: "No verified supplied cell/timezone tile covers this named place." } });
                if (active && active.key !== descriptor.key && !cache.has(descriptor.key))
                    return climateContextResultSchema.parse({ ...trusted, availability: { status: "unavailable", reason: "Historical tile reader is busy; try again shortly." } });
                const tile = await loadTile(descriptor, data), rows = tile.bins.slice((month - 1) * 24, month * 24), summary = statistics(combined(rows)), bins = rows.map((row, utcHour) => ({ utcHour, statistics: statistics(row) }));
                const enough = (stats: ClimateStatistics) => !stats.expectedEligibleSamples || ((stats.completeness ?? 0) >= .9 && stats.representedYears >= 27 && stats.badYearCount === 0);
                const status = !summary.expectedEligibleSamples ? "not-covered" : data.period.kind === "baseline-1991-2020" && summary.validEligibleSamples > 0 && enough(summary) && bins.every(bin => enough(bin.statistics)) ? "available" : "partial";
                const dLat = city.latitude - descriptor.latitude;
                let dLon = Math.abs(city.longitude - descriptor.longitude);
                dLon = Math.min(dLon, 360 - dLon);
                const displacementKm = Math.hypot(dLat, dLon * Math.cos(city.latitude * Math.PI / 180)) * 111.195;
                return climateContextResultSchema.parse({ ...trusted, grid: { mapping: "nearest-supplied-cell", cellId: descriptor.cellId, spacingDegrees: .25, displacementKm, placeIndexVintage: data.placeIndexVintage }, summary, bins, availability: { status, reason: status === "available" ? "Verified baseline hourly dark-time cloud statistics; not a forecast." : status === "not-covered" ? "No astronomical darkness samples in this month." : "Historical sample or incomplete baseline; not a forecast or whole-night probability." } });
            }
            catch {
                return climateContextResultSchema.parse({ ...base, period: manifest?.period ?? base.period, sources: [manifest?.sourceProvenance ?? fallbackSource], caveats: manifest?.caveats ?? base.caveats, availability: { status: "unavailable", reason: "Historical manifest/tile is missing, untrusted, oversized or invalid." } });
            }
        },
    };
}
