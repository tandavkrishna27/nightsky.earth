import { createRequire } from "node:module";
import type * as AstronomyTypes from "astronomy-engine";
import { calendarDateSchema, climatePeriodSchema, climateStatisticsSchema, CLOUD_THRESHOLDS, CLIMATE_METHOD_VERSION, observingNightFromLocalParts, type ClimateStatistics } from "../../shared/nightsky/climate";
import { ianaTimeZoneSchema } from "../../shared/nightsky/common";

const Astronomy = createRequire(import.meta.url)("astronomy-engine") as typeof AstronomyTypes;
const HOUR = 3_600_000;
export interface CloudSample { atUtc: string; cloudFraction: number | null }
export interface GridMapping { cellId: string; latitude: number; longitude: number; timeZone: string }
export interface AggregateMethod { startNight: string; endNight: string }
export interface BinCounts {
  expected: number; valid: number; counts: [number, number, number]; sum: number;
  yearsMask: number; badYearsMask: number;
}
export interface ClimateAggregate {
  schemaVersion: 1; methodVersion: typeof CLIMATE_METHOD_VERSION; key: string; mapping: GridMapping;
  period: { startNight: string; endNight: string; kind: "sample-only" | "baseline-1991-2020" };
  bins: BinCounts[]; yearMonthly: { expected: number; valid: number }[][];
  astronomyVersion: "2.1.19"; timezoneVersion: string;
}
function formatter(timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" });
}
function nightDate(at: Date, format: Intl.DateTimeFormat): string {
  const parts = Object.fromEntries(format.formatToParts(at).map(part => [part.type, part.value]));
  // Calendar subtraction, never 24-hour subtraction from a local instant.
  return observingNightFromLocalParts(Number(parts.year), Number(parts.month), Number(parts.day), Number(parts.hour));
}
export function observingNightDate(atUtc: string, timeZone: string): string {
  ianaTimeZoneSchema.parse(timeZone);
  return nightDate(new Date(parseHour(atUtc)), formatter(timeZone));
}
function parseHour(value: string): number {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:00:00(?:\.000)?Z$/.test(value)) throw new RangeError("Expected an exact hourly UTC timestamp.");
  calendarDateSchema.parse(value.slice(0, 10));
  const at = Date.parse(value);
  if (!Number.isFinite(at) || new Date(at).toISOString().slice(0, 13) !== value.slice(0, 13)) throw new RangeError("Invalid UTC hour.");
  return at;
}
export function sunAltitudeDegrees(atUtc: string, latitude: number, longitude: number): number {
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) throw new RangeError("Invalid grid coordinates.");
  const observer = new Astronomy.Observer(latitude, longitude, 0);
  const at = new Date(parseHour(atUtc));
  const equatorial = Astronomy.Equator(Astronomy.Body.Sun, at, observer, true, true);
  return Astronomy.Horizon(at, observer, equatorial.ra, equatorial.dec).altitude;
}
function emptyBin(): BinCounts { return { expected: 0, valid: 0, counts: [0, 0, 0], sum: 0, yearsMask: 0, badYearsMask: 0 }; }

/** Stream sorted source instants against an independently generated hourly clock.
 * Missing source timestamps still enter the expected dark-time denominator. */
export function aggregateDarkCloudSamples(samples: Iterable<CloudSample>, mapping: GridMapping, method: AggregateMethod): ClimateAggregate {
  const period = climatePeriodSchema.parse({ ...method, kind: method.startNight === "1991-01-01" && method.endNight === "2020-12-31" ? "baseline-1991-2020" : "sample-only" });
  ianaTimeZoneSchema.parse(mapping.timeZone);
  if (!mapping.cellId || mapping.cellId.length > 80 || !Number.isFinite(mapping.latitude) || mapping.latitude < -90 || mapping.latitude > 90 || !Number.isFinite(mapping.longitude) || mapping.longitude < -180 || mapping.longitude > 180 || !Number.isInteger(mapping.latitude * 4) || !Number.isInteger(mapping.longitude * 4))
    throw new RangeError("Expected a supplied 0.25 degree ERA5 grid cell.");
  const firstYear = Number(period.startNight.slice(0, 4));
  const years = Number(period.endNight.slice(0, 4)) - firstYear + 1;
  const bins = Array.from({ length: 288 }, emptyBin);
  const yearBins = Array.from({ length: years }, () => Array.from({ length: 288 }, () => ({ expected: 0, valid: 0 })));
  const local = formatter(mapping.timeZone);
  const start = Date.parse(`${period.startNight}T00:00:00Z`) - 48 * HOUR;
  const end = Date.parse(`${period.endNight}T00:00:00Z`) + 72 * HOUR;
  const iterator = samples[Symbol.iterator]();
  let previous = -Infinity;
  function take(): { at: number; value: number | null } | undefined {
    const next = iterator.next();
    if (next.done) return undefined;
    const at = parseHour(next.value.atUtc);
    if (at <= previous) throw new RangeError("Duplicate or unsorted source timestamp.");
    if (at < start || at >= end) throw new RangeError("Source timestamp outside bounded padded period.");
    previous = at;
    const value = next.value.cloudFraction;
    if (value !== null && typeof value !== "number") throw new RangeError("Invalid cloud fraction type.");
    if (value !== null && Number.isFinite(value) && (value < 0 || value > 1)) throw new RangeError("Cloud fraction outside physical [0,1] range.");
    return { at, value };
  }
  try {
    let next = take();
    for (let time = start; time < end; time += HOUR) {
      const value = next?.at === time ? next.value : null;
      if (next?.at === time) next = take();
      const at = new Date(time);
      const night = nightDate(at, local);
      // The two-day boundary assumption fails closed if an unusual zone exceeds it.
      const offsetDate = Date.parse(`${night}T00:00:00Z`);
      if (Math.abs(offsetDate - time) > 48 * HOUR) throw new RangeError("Timezone exceeds the reviewed padding assumption.");
      if (night < period.startNight || night > period.endNight) continue;
      if (sunAltitudeDegrees(at.toISOString(), mapping.latitude, mapping.longitude) > -18) continue;
      const month = Number(night.slice(5, 7)) - 1;
      const year = Number(night.slice(0, 4)) - firstYear;
      const key = month * 24 + at.getUTCHours();
      const bin = bins[key]!;
      const annual = yearBins[year]![key]!;
      bin.expected++; annual.expected++;
      if (value === null || !Number.isFinite(value)) continue;
      bin.valid++; annual.valid++; bin.sum += value;
      bin.yearsMask = (bin.yearsMask | (1 << year)) >>> 0;
      CLOUD_THRESHOLDS.forEach((threshold, index) => { if (value <= threshold) bin.counts[index]++; });
    }
    if (next) throw new RangeError("Unconsumed source samples.");
    const yearMonthly = yearBins.map((annual, year) => {
      annual.forEach((bin, index) => {
        if (bin.expected > 0 && bin.valid / bin.expected < 0.8) bins[index]!.badYearsMask = (bins[index]!.badYearsMask | (1 << year)) >>> 0;
      });
      return Array.from({ length: 12 }, (_, month) => annual.slice(month * 24, month * 24 + 24).reduce((sum, row) => ({ expected: sum.expected + row.expected, valid: sum.valid + row.valid }), { expected: 0, valid: 0 }));
    });
    return { schemaVersion: 1, methodVersion: CLIMATE_METHOD_VERSION, key: `${mapping.cellId}|${mapping.timeZone}`, mapping: { ...mapping }, period,
      bins, yearMonthly, astronomyVersion: "2.1.19", timezoneVersion: `node-${process.versions.node}/icu-${process.versions.icu}/tz-${process.versions.tz ?? "unknown"}` };
  } finally {
    iterator.return?.();
  }
}
function bitCount(mask: number): number { let count = 0; for (let value = mask >>> 0; value; value >>>= 1) count += value & 1; return count; }
export function statisticsForBin(bin: BinCounts): ClimateStatistics {
  return climateStatisticsSchema.parse({ expectedEligibleSamples: bin.expected, validEligibleSamples: bin.valid,
    representedYears: bitCount(bin.yearsMask), badYearCount: bitCount(bin.badYearsMask),
    ...(bin.expected ? { completeness: bin.valid / bin.expected } : {}),
    ...(bin.valid ? { meanCloudFraction: bin.sum / bin.valid, thresholds: CLOUD_THRESHOLDS.map((fraction, index) => ({ fraction, count: bin.counts[index], frequency: bin.counts[index] / bin.valid })) } : {}),
  });
}
export function summarizeMonth(aggregate: ClimateAggregate, month: number, hours: number[] = Array.from({ length: 24 }, (_, hour) => hour)) {
  if (!Number.isInteger(month) || month < 1 || month > 12 || !hours.length || new Set(hours).size !== hours.length || hours.some(hour => !Number.isInteger(hour) || hour < 0 || hour > 23)) throw new RangeError("Invalid month/hour selection.");
  const selected = hours.map(hour => aggregate.bins[(month - 1) * 24 + hour]!);
  const total = selected.reduce((sum, bin) => ({ expected: sum.expected + bin.expected, valid: sum.valid + bin.valid,
    sum: sum.sum + bin.sum, counts: sum.counts.map((count, index) => count + bin.counts[index]) as [number, number, number],
    yearsMask: (sum.yearsMask | bin.yearsMask) >>> 0, badYearsMask: (sum.badYearsMask | bin.badYearsMask) >>> 0 }), emptyBin());
  const stats = statisticsForBin(total);
  const insufficient = selected.some(bin => bin.expected && (bin.valid / bin.expected < 0.9 || bitCount(bin.yearsMask) < 27 || bin.badYearsMask !== 0));
  const monthlyBad = aggregate.yearMonthly.some(year => year[month - 1]!.expected > 0 && year[month - 1]!.valid / year[month - 1]!.expected < 0.8);
  const quality = !total.expected ? "no-astronomical-darkness" : aggregate.period.kind === "sample-only" ? "sample-only" : insufficient || monthlyBad || (stats.completeness ?? 0) < 0.9 || stats.representedYears < 27 ? "partial" : "available";
  return { ...stats, quality };
}
export interface ChunkCheckpoint { chunkId: string; sha256: string; sourceRevision: string; complete: boolean }
export function validateChunkLedger(entries: ChunkCheckpoint[], previous: ChunkCheckpoint[] = []): void {
  const known = new Map(previous.map(entry => [entry.chunkId, entry]));
  const seen = new Set<string>();
  for (const entry of entries) {
    if (!entry.complete || !entry.chunkId || !/^[a-f0-9]{64}$/.test(entry.sha256) || !entry.sourceRevision || seen.has(entry.chunkId)) throw new RangeError("Invalid, interrupted or duplicate checkpoint.");
    const old = known.get(entry.chunkId);
    if (old && (old.sha256 !== entry.sha256 || old.sourceRevision !== entry.sourceRevision)) throw new RangeError("Checkpoint source revision or checksum changed.");
    seen.add(entry.chunkId);
  }
}
