/** Checksum-pinned historical provider: legacy pilot and bounded tiled artifacts. */
import { createHash } from "node:crypto";
import { createTiledEra5ClimateProvider, readTrustedClimateFile } from "./tiledEra5";
import * as z from "zod4";
import { GeoNamesPlaceIndex } from "../../places/geonames";
import { climateContextResultSchema, climateStatisticsSchema, CLOUD_THRESHOLDS, CLIMATE_METHOD_VERSION, getClearSkyClimatologyInputSchema, type ClimateContextResultV2, } from "../../../shared/nightsky/climate";
import { sourceRecordSchema, ianaTimeZoneSchema, latitudeSchema, longitudeSchema, } from "../../../shared/nightsky/common";
const MiB = 1024 * 1024;
const count = z.number().int().nonnegative().max(0xffffffff);
const digest = z.string().regex(/^[a-f0-9]{64}$/);
const binSchema = z.strictObject({
    expected: count,
    valid: count,
    counts: z.tuple([count, count, count]),
    sum: z.number().finite().nonnegative(),
    yearsMask: z.number().int().min(0).max(1),
    badYearsMask: z.number().int().min(0).max(1),
});
const mappingSchema = z.strictObject({
    cellId: z.string().min(1).max(80),
    latitude: latitudeSchema,
    longitude: longitudeSchema,
    timeZone: ianaTimeZoneSchema,
});
const storedStats = climateStatisticsSchema.safeExtend({
    missingEligibleSamples: count,
    quality: z.enum(["sample-only", "no-astronomical-darkness"]),
});
const aggregateSchema = z.strictObject({
    schemaVersion: z.literal(1),
    methodVersion: z.literal(CLIMATE_METHOD_VERSION),
    key: z.string().max(150),
    mapping: mappingSchema,
    period: z.strictObject({
        startNight: z.literal("2025-01-01"),
        endNight: z.literal("2025-12-31"),
        kind: z.literal("sample-only"),
    }),
    bins: z.array(binSchema).length(288),
    yearMonthly: z
        .array(z.array(z.strictObject({ expected: count, valid: count })).length(12))
        .length(1),
    astronomyVersion: z.literal("2.1.19"),
    timezoneVersion: z.string().min(1).max(100),
    monthly: z
        .array(storedStats.safeExtend({ month: z.number().int().min(1).max(12) }))
        .length(12),
    annual: storedStats,
});
const cellSchema = mappingSchema.omit({ timeZone: true });
const sourceHeader = z.strictObject({
    calendar: z.literal("proleptic_gregorian"),
    cells: z.array(cellSchema).min(1).max(10),
    dataClass: z.literal("reanalysis"),
    decoderVersions: z.strictObject({
        netCDF4: z.string().max(40),
        numpy: z.string().max(40),
    }),
    experimentVersions: z.array(z.literal("0001")).length(1),
    gridSpacingDegrees: z.literal(0.25),
    institution: z.string().min(1).max(200),
    member: z.literal(0),
    rowCount: count,
    schemaVersion: z.literal(1),
    sourceDoi: z.literal("10.24381/cds.adbb2d47"),
    sourceSha256: digest,
    sourceUnits: z.literal("(0 - 1)"),
    timeUnits: z.literal("seconds since 1970-01-01"),
    type: z.literal("header"),
    units: z.literal("fraction"),
});
const artifactSchema = z.strictObject({
    schemaVersion: z.literal(1),
    builderVersion: z.literal("pilot-2025-v1"),
    year: z.literal(2025),
    sampleKind: z.literal("sample-only"),
    historicalLabel: z.literal("historical-not-a-forecast"),
    manifestSha256: z.literal("e43315f64a34a586abda7e4f0ac434e82f0868d2f23bd124a09ba47545bd2400"),
    sourceProvenance: sourceRecordSchema,
    gridProvenance: z.strictObject({
        suppliedSpacingDegrees: z.literal(0.25),
        nativeResolutionApproxKm: z.literal(31),
        selection: z.literal("nearest-supplied-cell"),
        description: z.string().min(1).max(500),
    }),
    places: z
        .array(z.strictObject({
        placeId: z.string(),
        displayName: z.string().max(320),
        timeZone: ianaTimeZoneSchema,
        indexVintage: z.string().min(1).max(100),
        sources: z.array(sourceRecordSchema).min(1).max(8),
        latitude: latitudeSchema,
        longitude: longitudeSchema,
        key: z.string().max(150),
        gridMapping: z.strictObject({
            method: z.literal("nearest-supplied-cell"),
            distanceMetric: z.literal("latitude-scaled-angular-grid"),
            approximateDisplacementKm: z.number().finite().nonnegative(),
        }),
    }))
        .length(3),
    sources: z
        .array(z.strictObject({
        chunkId: z.string().max(100),
        rawSha256: digest,
        decodedSha256: digest,
        sourceRows: count,
        expectedRows: count,
        missingSourceHours: count,
        rawBytes: count,
        decodedBytes: count,
        source: sourceHeader,
    }))
        .length(28),
    aggregates: z.array(aggregateSchema).min(1).max(3),
    caveats: z.array(z.string().min(1).max(500)).max(20),
});
type Bin = z.infer<typeof binSchema>;
function statistics(b: Bin, validateMask = false) {
    if (b.valid > b.expected ||
        b.sum > b.valid ||
        b.counts.some((n, i) => n > b.valid || (i > 0 && n < b.counts[i - 1]!)) ||
        b.yearsMask !== (b.valid ? 1 : 0) ||
        (!b.expected && b.badYearsMask) ||
        (validateMask &&
            b.badYearsMask !== (b.expected && b.valid / b.expected < 0.8 ? 1 : 0)))
        throw Error("Inconsistent aggregate counts");
    // Inclusive threshold counts constrain the cloud sum even without raw samples.
    const [a, c, d] = b.counts;
    const lower = (c - a) * 0.1 + (d - c) * 0.25 + (b.valid - d) * 0.5;
    const upper = a * 0.1 + (c - a) * 0.25 + (d - c) * 0.5 + (b.valid - d);
    if (b.sum < lower - 1e-9 || b.sum > upper + 1e-9)
        throw Error("Inconsistent cloud sum");
    return climateStatisticsSchema.parse({
        expectedEligibleSamples: b.expected,
        validEligibleSamples: b.valid,
        representedYears: b.yearsMask,
        badYearCount: b.badYearsMask,
        ...(b.expected ? { completeness: b.valid / b.expected } : {}),
        ...(b.valid
            ? {
                meanCloudFraction: b.sum / b.valid,
                thresholds: CLOUD_THRESHOLDS.map((fraction, i) => ({
                    fraction,
                    count: b.counts[i],
                    frequency: b.counts[i]! / b.valid,
                })),
            }
            : {}),
    });
}
function combine(bins: Bin[]): Bin {
    return bins.reduce((a, b) => ({
        expected: a.expected + b.expected,
        valid: a.valid + b.valid,
        sum: a.sum + b.sum,
        counts: a.counts.map((v, i) => v + b.counts[i]!) as Bin["counts"],
        yearsMask: a.yearsMask | b.yearsMask,
        badYearsMask: a.badYearsMask | b.badYearsMask,
    }), {
        expected: 0,
        valid: 0,
        sum: 0,
        counts: [0, 0, 0],
        yearsMask: 0,
        badYearsMask: 0,
    });
}
function checkStored(stored: z.infer<typeof storedStats>, b: Bin) {
    const computed = statistics(b);
    const clean = climateStatisticsSchema.parse(Object.fromEntries(Object.entries(stored).filter(([key]) => !["month", "quality", "missingEligibleSamples"].includes(key))));
    if (stored.missingEligibleSamples !== b.expected - b.valid ||
        stored.quality !== (b.expected ? "sample-only" : "no-astronomical-darkness"))
        throw Error("Invalid quality");
    for (const key of [
        "expectedEligibleSamples",
        "validEligibleSamples",
        "representedYears",
        "badYearCount",
        "completeness",
        "meanCloudFraction",
    ] as const) {
        const x = computed[key], y = clean[key];
        if (x === undefined
            ? y !== undefined
            : y === undefined || Math.abs(x - y) > 1e-12)
            throw Error("Inconsistent statistics");
    }
    if (JSON.stringify(clean.thresholds) !== JSON.stringify(computed.thresholds))
        throw Error("Inconsistent thresholds");
}
const fallbackSource = sourceRecordSchema.parse({
    name: "Copernicus Climate Change Service (C3S) / ECMWF",
    url: "https://doi.org/10.24381/cds.adbb2d47",
    attribution: "Contains Copernicus Climate Change Service ERA5 reanalysis information from ECMWF. Derived hourly dark-time cloud aggregation by NightSky.earth.",
    dataClass: "reanalysis",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    modified: true,
});
export type Era5ClimateProvider = {
    getClimatology(placeId: string, month: number): Promise<ClimateContextResultV2>;
};
export interface Era5ClimateProviderOptions {
    artifactPath?: string;
    expectedSha256?: string;
    index: GeoNamesPlaceIndex;
    maxArtifactBytes?: number;
    maxCacheBytes?: number;
    onRead?: () => void;
}
/** Validate already checksum-verified legacy bytes against the supplied named-place index. */
export function parseValidatedLegacyEra5Artifact(bytes: Buffer, index: GeoNamesPlaceIndex) {
    if (bytes.length > 8 * MiB)
        throw Error("Artifact size");
    const data = artifactSchema.parse(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)));
    if (data.sourceProvenance.dataClass !== "reanalysis" ||
        data.sourceProvenance.url !== "https://doi.org/10.24381/cds.adbb2d47" ||
        data.sourceProvenance.licenseUrl !==
            "https://creativecommons.org/licenses/by/4.0/" ||
        data.sourceProvenance.modified !== true)
        throw Error("Invalid source");
    if (new Set(data.sources.map((s) => s.chunkId)).size !== 28 ||
        new Set(data.aggregates.map((a) => a.key)).size !==
            data.aggregates.length ||
        new Set(data.places.map((p) => p.placeId)).size !== 3)
        throw Error("Duplicate keys");
    for (const s of data.sources)
        if (s.sourceRows > s.expectedRows ||
            s.missingSourceHours !== s.expectedRows - s.sourceRows ||
            s.source.rowCount !== s.sourceRows ||
            s.source.sourceSha256 !== s.rawSha256)
            throw Error("Source counts");
    for (const a of data.aggregates) {
        if (a.key !== `${a.mapping.cellId}|${a.mapping.timeZone}` ||
            a.mapping.cellId !==
                `era5:${a.mapping.latitude}:${a.mapping.longitude}` ||
            !Number.isInteger(a.mapping.latitude * 4) ||
            !Number.isInteger(a.mapping.longitude * 4))
            throw Error("Cell mapping");
        a.bins.forEach((b, i) => {
            const days = new Date(Date.UTC(2025, Math.floor(i / 24) + 1, 0)).getUTCDate();
            if (b.expected > days)
                throw Error("Impossible hourly sample count");
            statistics(b, true);
        });
        for (let m = 0; m < 12; m++) {
            const b = combine(a.bins.slice(m * 24, m * 24 + 24));
            const y = a.yearMonthly[0]![m]!;
            if (y.expected !== b.expected ||
                y.valid !== b.valid ||
                a.monthly[m]!.month !== m + 1)
                throw Error("Monthly counts");
            checkStored(a.monthly[m]!, b);
        }
        checkStored(a.annual, combine(a.bins));
    }
    for (const p of data.places) {
        const id = Number(p.placeId.split(":").at(-1)), city = index.getById(id), a = data.aggregates.find((a) => a.key === p.key);
        if (![1270426, 1266425, 1262463].includes(id) ||
            p.placeId !== `place:v1:geonames:${id}` ||
            !city ||
            !a ||
            p.indexVintage !== index.vintageLabel ||
            city.timeZone !== p.timeZone ||
            a.mapping.timeZone !== p.timeZone ||
            city.latitude !== p.latitude ||
            city.longitude !== p.longitude ||
            index.toPlaceRef(city).displayName !== p.displayName)
            throw Error("Place index mapping");
        const distance = Math.hypot(a.mapping.latitude - p.latitude, (a.mapping.longitude - p.longitude) *
            Math.cos((p.latitude * Math.PI) / 180)) * 111.195;
        if (Math.abs(distance - p.gridMapping.approximateDisplacementKm) > 1e-9)
            throw Error("Displacement");
        const region = id === 1270426 ? "hanle" : "kodaikanal-munnar";
        const cells = data.sources
            .filter((s) => s.chunkId.startsWith(`${region}-`))
            .flatMap((s) => s.source.cells);
        const metric = (c: {
            latitude: number;
            longitude: number;
        }) => (c.latitude - p.latitude) ** 2 +
            ((c.longitude - p.longitude) *
                Math.cos((p.latitude * Math.PI) / 180)) **
                2;
        const nearest = Array.from(new Map(cells.map((c) => [c.cellId, c])).values()).sort((a, b) => metric(a) - metric(b) || a.cellId.localeCompare(b.cellId))[0];
        if (!nearest || nearest.cellId !== a.mapping.cellId)
            throw Error("Not nearest source cell");
    }
    return data;
}
/** Trusted lazy version dispatch. One bounded read supplies the chosen reader. */
export function createEra5ClimateProvider(options: Era5ClimateProviderOptions): Era5ClimateProvider {
    const unavailable = createPilotEra5ClimateProvider({ ...options, artifactPath: undefined, expectedSha256: undefined });
    let delegate: Era5ClimateProvider | undefined;
    let selecting: Promise<Era5ClimateProvider> | undefined;
    async function select(): Promise<Era5ClimateProvider> {
        if (delegate)
            return delegate;
        if (selecting)
            return selecting;
        selecting = (async () => {
            if (!options.artifactPath || !options.expectedSha256)
                throw Error("Untrusted artifact");
            const bytes = await readTrustedClimateFile(options.artifactPath, options.expectedSha256, options.maxArtifactBytes ?? 8 * MiB, options.onRead);
            const header = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
            if (header?.schemaVersion === 2) {
                if (bytes.length > 4 * MiB)
                    throw Error("Manifest size");
                delegate = createTiledEra5ClimateProvider({ ...options, manifestBytes: bytes });
            }
            else if (header?.schemaVersion === 1)
                delegate = createPilotEra5ClimateProvider({ ...options, initialBytes: bytes });
            else
                throw Error("Unsupported historical artifact version");
            return delegate;
        })().finally(() => { selecting = undefined; });
        return selecting;
    }
    return { async getClimatology(placeId, month) {
            getClearSkyClimatologyInputSchema.parse({ placeId, month });
            try {
                return await (await select()).getClimatology(placeId, month);
            }
            catch {
                return unavailable.getClimatology(placeId, month);
            }
        } };
}
function createPilotEra5ClimateProvider(options: Era5ClimateProviderOptions & {
    initialBytes?: Buffer;
}): Era5ClimateProvider {
    const limit = options.maxArtifactBytes ?? 8 * MiB, cacheLimit = options.maxCacheBytes ?? 32 * MiB;
    if (!Number.isInteger(limit) ||
        limit < 1 ||
        limit > 8 * MiB ||
        !Number.isInteger(cacheLimit) ||
        cacheLimit < 1 ||
        cacheLimit > 32 * MiB)
        throw Error("Invalid ERA5 byte limits");
    let cached: z.infer<typeof artifactSchema> | undefined;
    let active: Promise<z.infer<typeof artifactSchema>> | undefined;
    async function load() {
        if (cached)
            return cached;
        if (active)
            return active;
        active = (async () => {
            if (!options.artifactPath ||
                !options.expectedSha256 ||
                !digest.safeParse(options.expectedSha256).success)
                throw Error("Unconfigured artifact");
            const supplied = options.initialBytes;
            options.initialBytes = undefined;
            const bytes = supplied ?? await readTrustedClimateFile(options.artifactPath, options.expectedSha256, limit, options.onRead);
            if (bytes.length > limit)
                throw Error("Artifact size");
            if (createHash("sha256").update(bytes).digest("hex") !==
                options.expectedSha256)
                throw Error("Artifact checksum");
            const data = parseValidatedLegacyEra5Artifact(bytes, options.index);
            // Cache accounting uses verified serialized artifact bytes; parsed heap usage requires host measurements.
            if (bytes.byteLength <= cacheLimit)
                cached = data;
            return data;
        })();
        try {
            return await active;
        }
        finally {
            active = undefined;
        }
    }
    return {
        async getClimatology(placeId, month) {
            getClearSkyClimatologyInputSchema.parse({ placeId, month });
            const city = options.index.getById(Number(placeId.split(":").at(-1)));
            const base = {
                schemaVersion: 2 as const,
                placeId,
                month,
                timeZone: city?.timeZone ?? "UTC",
                dataClass: "reanalysis" as const,
                historicalLabel: "historical-not-a-forecast" as const,
                methodVersion: CLIMATE_METHOD_VERSION,
                sampleDefinition: "hourly-dark-time-samples" as const,
                unit: "fraction" as const,
                period: {
                    startNight: "2025-01-01",
                    endNight: "2025-12-31",
                    kind: "sample-only" as const,
                },
                sources: [fallbackSource],
                caveats: ["One year sample only; not a climate baseline or forecast."],
            };
            try {
                const data = await load();
                const place = data.places.find((p) => p.placeId === placeId);
                if (!place)
                    return climateContextResultSchema.parse({
                        ...base,
                        availability: {
                            status: "unavailable",
                            reason: "Place is outside the reviewed three-place ERA5 pilot coverage.",
                        },
                    });
                const a = data.aggregates.find((a) => a.key === place.key)!;
                const rows = a.bins.slice((month - 1) * 24, month * 24);
                const summary = statistics(combine(rows));
                return climateContextResultSchema.parse({
                    ...base,
                    timeZone: place.timeZone,
                    sources: [data.sourceProvenance],
                    caveats: data.caveats,
                    grid: {
                        mapping: "nearest-supplied-cell",
                        cellId: a.mapping.cellId,
                        spacingDegrees: 0.25,
                        displacementKm: place.gridMapping.approximateDisplacementKm,
                        placeIndexVintage: place.indexVintage,
                    },
                    summary,
                    bins: rows.map((b, utcHour) => ({
                        utcHour,
                        statistics: statistics(b),
                    })),
                    availability: {
                        status: summary.expectedEligibleSamples ? "partial" : "not-covered",
                        reason: summary.expectedEligibleSamples
                            ? "2025 sample only; historical reanalysis is not a seasonal climate baseline or forecast."
                            : "No astronomical darkness samples in this month.",
                    },
                });
            }
            catch {
                return climateContextResultSchema.parse({
                    ...base,
                    availability: {
                        status: "unavailable",
                        reason: "ERA5 historical artifact is missing, untrusted, oversized or invalid.",
                    },
                });
            }
        },
    };
}
