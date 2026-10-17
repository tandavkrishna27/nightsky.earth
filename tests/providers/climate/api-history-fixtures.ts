import { createHash } from "node:crypto";
import type { ApiHistoryPlan } from "../../../server/providers/climate/apiHistoryPlan";
import type { RetainedHistoryChunk, HostedHistoryAggregate } from "../../../server/providers/climate/openMeteoHistoryServing";

/** Synthetic sufficient statistics only; never measured history evidence. */
export function syntheticApiAggregate(plan: ApiHistoryPlan, chunks: Iterable<RetainedHistoryChunk> = []): HostedHistoryAggregate {
  const mapping = { ...plan.queryCell, cellId: `open-meteo:${plan.queryCell.latitude}:${plan.queryCell.longitude}`, timeZone: plan.timeZone };
  const receipts = [...chunks].map(c => ({ sha256: createHash("sha256").update(c.bytes).digest("hex"), requestUrl: c.partition.url, retrievedAt: c.retrievedAt }));
  const aggregate: HostedHistoryAggregate = { schemaVersion: 1, methodVersion: "open-meteo-quantized-dark-cloud-v1", sourceId: "open-meteo-hosted-era5-cloud-percent-v1", historicalAdmission: false,
    key: `${mapping.cellId}|${mapping.timeZone}`, mapping, period: { ...plan.period },
    bins: Array.from({ length: 288 }, () => ({ expected: 30, valid: 30, counts: [10, 20, 30], sum: 12, yearsMask: 0x3fffffff, badYearsMask: 0 })),
    yearMonthly: Array.from({ length: 30 }, () => Array.from({ length: 12 }, () => ({ expected: 24, valid: 24 }))),
    astronomyVersion: "2.1.19", timezoneVersion: `node-${process.versions.node}/icu-${process.versions.icu}/tz-${process.versions.tz ?? "unknown"}`,
    requestedPoint: { ...plan.queryCell }, receipts, cacheKey: "" };
  aggregate.cacheKey = createHash("sha256").update(JSON.stringify({ sourceId: aggregate.sourceId, methodVersion: aggregate.methodVersion, mapping, period: aggregate.period, receipts, astronomyVersion: aggregate.astronomyVersion, timezoneVersion: aggregate.timezoneVersion })).digest("hex");
  return aggregate;
}
export function syntheticApiCacheBytes(plan: ApiHistoryPlan): Buffer {
  const chunks = plan.ranges.map(partition => ({ partition, bytes: Buffer.from('{"synthetic":true}'), retrievedAt: "2026-10-17T00:00:00Z" }));
  return Buffer.from(JSON.stringify({ schemaVersion: 1, key: plan.cacheKey, planSha256: plan.planSha256, rangeDays: plan.ranges[0]!.rangeDays, requestedPoint: plan.requestedPoint, builtAt: "2026-10-17T00:00:01Z", aggregate: syntheticApiAggregate(plan, chunks) }));
}
