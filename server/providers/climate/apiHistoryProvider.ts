import * as z from "zod4";
import { createHash } from "node:crypto";
import { calculationPlaceSchema, type CalculationPlace } from "../../../shared/nightsky/discovery";
import { climateContextResultSchema, getClearSkyClimatologyInputSchema, hostedMethodAdmissionSchema, CLIMATE_METHOD_VERSION, type HostedMethodAdmission } from "../../../shared/nightsky/climate";
import { ianaTimeZoneSchema, latitudeSchema, longitudeSchema, utcInstantSchema } from "../../../shared/nightsky/common";
import { statisticsForBin, summarizeMonth } from "../../../scripts/era5/aggregate";
import { apiHistoryCacheKey, mapApiHistoryPoint, planApiHistory } from "./apiHistoryPlan";
import { hostedHistoryUnavailable, type HostedHistoryAggregate } from "./openMeteoHistoryServing";
import { OPEN_METEO_HISTORY_METHOD as METHOD } from "./openMeteoHistoryMethod";
import type { ApiHistoryStore } from "./apiHistoryStore";

const count = z.number().int().min(0).max(263088), mask = z.number().int().min(0).max(0x3fffffff);
const digest = z.string().regex(/^[a-f0-9]{64}$/);
const pointSchema = z.strictObject({ latitude: latitudeSchema, longitude: longitudeSchema });
const aggregateSchema = z.strictObject({
  schemaVersion: z.literal(1), methodVersion: z.literal(METHOD.methodVersion), sourceId: z.literal(METHOD.sourceId), historicalAdmission: z.literal(false),
  key: z.string().min(1).max(150), cacheKey: digest, requestedPoint: pointSchema,
  mapping: z.strictObject({ latitude: latitudeSchema, longitude: longitudeSchema, cellId: z.string().min(1).max(80), timeZone: ianaTimeZoneSchema }),
  period: z.strictObject({ startNight: z.literal("1991-01-01"), endNight: z.literal("2020-12-31"), kind: z.literal("baseline-1991-2020") }),
  bins: z.array(z.strictObject({ expected: count, valid: count, counts: z.tuple([count, count, count]), sum: z.number().finite().nonnegative(), yearsMask: mask, badYearsMask: mask })).length(288),
  yearMonthly: z.array(z.array(z.strictObject({ expected: count, valid: count })).length(12)).length(30),
  astronomyVersion: z.literal("2.1.19"), timezoneVersion: z.string().min(1).max(100),
  receipts: z.array(z.strictObject({ sha256: digest, requestUrl: z.url().max(2048), retrievedAt: utcInstantSchema })).min(1).max(30),
});
const recordSchema = z.strictObject({ schemaVersion: z.literal(1), key: digest, planSha256: digest,
  rangeDays: z.number().int().min(366).max(1827), requestedPoint: pointSchema, builtAt: utcInstantSchema, aggregate: aggregateSchema });

/** Validate compact sufficient statistics and their plan/source/rules binding before serving. */
export function decodeApiHistoryCache(bytes: Uint8Array, expectedKey: string): HostedHistoryAggregate {
  if (bytes.byteLength > 262144) throw Error("History summary byte bound");
  const record = recordSchema.parse(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)));
  const a = record.aggregate, p = planApiHistory(record.requestedPoint, a.mapping.timeZone, { rangeDays: record.rangeDays });
  if (record.key !== expectedKey || p.cacheKey !== expectedKey || p.planSha256 !== record.planSha256 || a.mapping.latitude !== p.queryCell.latitude || a.mapping.longitude !== p.queryCell.longitude || a.requestedPoint.latitude !== p.queryCell.latitude || a.requestedPoint.longitude !== p.queryCell.longitude || a.mapping.cellId !== `open-meteo:${p.queryCell.latitude}:${p.queryCell.longitude}` || a.key !== `${a.mapping.cellId}|${a.mapping.timeZone}` || a.receipts.length !== p.requestCount || a.timezoneVersion !== `node-${process.versions.node}/icu-${process.versions.icu}/tz-${process.versions.tz ?? "unknown"}`) throw Error("History cache identity mismatch");
  for (let i = 0; i < a.receipts.length; i++) if (a.receipts[i]!.requestUrl !== p.ranges[i]!.url || Date.parse(a.receipts[i]!.retrievedAt) > Date.parse(record.builtAt)) throw Error("History cache receipt mismatch");
  const contentKey = createHash("sha256").update(JSON.stringify({ sourceId: a.sourceId, methodVersion: a.methodVersion, mapping: a.mapping, period: a.period, receipts: a.receipts, astronomyVersion: a.astronomyVersion, timezoneVersion: a.timezoneVersion })).digest("hex");
  if (contentKey !== a.cacheKey) throw Error("History content identity mismatch");
  if (a.bins.reduce((sum, b) => sum + b.expected, 0) > 263088) throw Error("History expected-clock bound");
  a.bins.forEach((b, index) => {
    if (b.valid > b.expected || b.sum > b.valid || (!b.valid && (b.sum || b.yearsMask)) || b.counts[0] > b.counts[1] || b.counts[1] > b.counts[2] || b.counts[2] > b.valid) throw Error("History bin coherence");
    statisticsForBin(b);
    for (let year = 0; year < 30; year++) if ((b.yearsMask & (1 << year)) && !a.yearMonthly[year]![Math.floor(index / 24)]!.valid) throw Error("History represented-year mismatch");
  });
  for (let month = 0; month < 12; month++) {
    const bins = a.bins.slice(month * 24, month * 24 + 24);
    const expected = bins.reduce((n, b) => n + b.expected, 0), valid = bins.reduce((n, b) => n + b.valid, 0);
    const annual = a.yearMonthly.map(y => y[month]!);
    if (annual.some(y => y.valid > y.expected) || annual.reduce((n, y) => n + y.expected, 0) !== expected || annual.reduce((n, y) => n + y.valid, 0) !== valid) throw Error("History independent monthly/year denominators mismatch");
  }
  return a;
}

/** Read-only injection for existing MCP/planner climateProvider seam.
 * No queue, fetch, rebuild, credential lookup, or activation occurs during lookup.
 */
export function createApiHistoryProvider(options: { cache: Pick<ApiHistoryStore, "readSummary">; admission?: HostedMethodAdmission }) {
  const admission = options.admission ? structuredClone(hostedMethodAdmissionSchema.parse(options.admission)) : undefined;
  return { async getClimatology(placeId: string, month: number, point?: CalculationPlace) {
    const selected = point ? calculationPlaceSchema.parse(point) : undefined;
    getClearSkyClimatologyInputSchema.parse({ placeId, month, sourceRevision: selected?.sourceRevision, catalogueRevision: selected?.catalogueRevision, displayTimeZone: selected?.displayTimeZone });
    const fallback = (reason: string) => climateContextResultSchema.parse({ ...hostedHistoryUnavailable(placeId, month, selected?.displayTimeZone ?? "UTC"), ...(selected?.placeId === placeId && selected.sourceRevision ? { sourceRevision: selected.sourceRevision } : {}), availability: { status: "unavailable", reason } });
    if (!selected || selected.placeId !== placeId) return fallback("Resolve the exact selected point and display time zone before history lookup.");
    if (!admission) return fallback("Hosted quantized baseline source policy is not admitted; operator worker and cache remain separate.");
    const cell = mapApiHistoryPoint(selected), key = apiHistoryCacheKey(cell, selected.displayTimeZone);
    let aggregate: HostedHistoryAggregate;
    try {
      const bytes = await options.cache.readSummary(key);
      if (!bytes) return fallback("No completed baseline summary is cached for this cell/timezone; an explicitly enabled operator build is required.");
      aggregate = decodeApiHistoryCache(bytes, key);
    } catch { return fallback("The cached baseline failed bounded identity, rules or statistical validation; no numerical history is served."); }
    const { quality, ...summary } = summarizeMonth({ ...aggregate, methodVersion: CLIMATE_METHOD_VERSION }, month);
    summary.badYearCount = aggregate.yearMonthly.filter(year => { const row = year[month - 1]!; return row.expected > 0 && row.valid / row.expected < 0.8; }).length;
    const radians = Math.PI / 180, dlat = (cell.latitude - selected.latitude) * radians, dlon = (cell.longitude - selected.longitude) * radians;
    const h = Math.sin(dlat / 2) ** 2 + Math.cos(selected.latitude * radians) * Math.cos(cell.latitude * radians) * Math.sin(dlon / 2) ** 2;
    const displacementKm = 6371.0088 * 2 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, h))));
    return climateContextResultSchema.parse({ ...hostedHistoryUnavailable(placeId, month, selected.displayTimeZone), ...(selected.sourceRevision ? { sourceRevision: selected.sourceRevision } : {}),
      hostedMethodAdmission: admission,
      availability: { status: quality === "no-astronomical-darkness" ? "not-covered" : quality === "available" ? "available" : "partial", reason: quality === "available" ? "Distinct hosted quantized 1991–2020 baseline satisfies independent month/UTC-bin/year coverage guards." : "Distinct hosted baseline retains missingness or no-darkness limitations; see independent denominators." },
      grid: { mapping: "nearest-supplied-cell", cellId: aggregate.mapping.cellId, spacingDegrees: 0.25, displacementKm, placeIndexVintage: "open-meteo-era5-index-policy-v1" }, summary,
      bins: Array.from({ length: 24 }, (_, utcHour) => ({ utcHour, statistics: statisticsForBin(aggregate.bins[(month - 1) * 24 + utcHour]!) })),
      caveats: ["Historical modeled cloud samples, not a forecast or whole-night success probability.", "Selected point maps by explicit pinned quarter-degree index/edge policy; source is queried at that canonical cell. Display time zone is preserved.", "Hosted integer-percent processing is distinct from native ERA5; deployed scientific revision and threshold equivalence remain unverified.", `Build rules: ${aggregate.astronomyVersion}; ${aggregate.timezoneVersion}. Receipt set: ${aggregate.cacheKey}. Raw response hashes do not supply retained raw replay bytes.`] });
  } };
}
