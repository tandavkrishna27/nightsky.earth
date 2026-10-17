import { createHash } from "node:crypto";
import { type HistoryPartition, type HistoryPoint, OPEN_METEO_HISTORY_MAX_BYTES } from "./openMeteoHistoryContract";
import { OPEN_METEO_HISTORY_METHOD as METHOD } from "./openMeteoHistoryMethod";

const START = Date.parse("1990-12-30T00:00:00Z") / 1000;
const END = Date.parse("2021-01-03T00:00:00Z") / 1000;
const DAY = 86400;
const MAPPING_POLICY = "open-meteo-era5-index-round-clamp-quarter-degree-v1";
const PERIOD = { startNight: "1991-01-01", endNight: "2020-12-31", kind: "baseline-1991-2020" } as const;
type Credit = { estimatedWeightedCredits: number; reservedIntegerCredits: number };
export interface ApiHistoryPlan {
  schemaVersion: 1; mode: "offline"; historicalAdmission: false;
  requestedPoint: HistoryPoint; queryCell: HistoryPoint; timeZone: string; mappingPolicy: string;
  period: typeof PERIOD; ranges: HistoryPartition[]; requestCount: number; expectedHours: 263088;
  accounting: Credit & { perRequest: Credit[]; deployedDebit: "unobserved"; sourceCodeCommit: string };
  limits: { maxResponseBytes: 2097152; maxTotalBytes: 16777216; requestTimeoutMs: 60000; aggregateTimeoutMs: 300000; maxBuildMs: 900000 };
  cacheKey: string; planSha256: string;
}

function validatePoint(point: HistoryPoint): void {
  if (!point || !Number.isFinite(point.latitude) || Math.abs(point.latitude) > 90 ||
      !Number.isFinite(point.longitude) || Math.abs(point.longitude) > 180) throw Error("Invalid history point");
}
function validateZone(timeZone: string): void {
  if (typeof timeZone !== "string" || timeZone.length < 1 || timeZone.length > 64 ||
      timeZone !== timeZone.trim() || /^[+-]/.test(timeZone)) throw Error("Invalid IANA history time zone");
  try { new Intl.DateTimeFormat("en", { timeZone }); } catch { throw Error("Invalid IANA history time zone"); }
}
function canonical(value: unknown): string {
  if (value !== null && typeof value === "object") {
    if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical((value as Record<string, unknown>)[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}
const hash = (value: unknown) => createHash("sha256").update(canonical(value)).digest("hex");

/** NightSky's explicit mapping from the pinned official regular-grid index policy.
 * This makes no attestation about the deployed service's off-grid selection.
 */
export function mapApiHistoryPoint(point: HistoryPoint): HistoryPoint {
  validatePoint(point);
  const latitudeIndex = Math.min(720, Math.max(0, Math.round((point.latitude + 90) * 4)));
  const longitudeIndex = Math.min(1439, Math.max(0, Math.round((point.longitude + 180) * 4)));
  return { latitude: -90 + latitudeIndex / 4, longitude: -180 + longitudeIndex / 4 };
}

/** Shared cell cache identity excludes the user's selected point and range layout. */
export function apiHistoryCacheKey(cell: HistoryPoint, timeZone: string): string {
  const mapped = mapApiHistoryPoint(cell); validateZone(timeZone);
  if (mapped.latitude !== cell.latitude || mapped.longitude !== cell.longitude) throw Error("Canonical history cell required");
  return hash({ schemaVersion: 1, sourceMethod: METHOD, cell: mapped, timeZone, mappingPolicy: MAPPING_POLICY,
    period: PERIOD, astronomyVersion: "2.1.19",
    timezoneVersion: `node-${process.versions.node}/icu-${process.versions.icu}/tz-${process.versions.tz ?? "unknown"}` });
}

/** Pure, offline planning. Estimated source weight is neither a measured debit nor permission to run. */
export function planApiHistory(point: HistoryPoint, timeZone: string, options: { rangeDays?: number } = {}): ApiHistoryPlan {
  const queryCell = mapApiHistoryPoint(point); validateZone(timeZone);
  if (!options || typeof options !== "object" || Array.isArray(options) || Object.keys(options).some(key => key !== "rangeDays")) throw Error("Invalid history range options");
  const rangeDays = options.rangeDays === undefined ? 366 : options.rangeDays;
  if (!Number.isSafeInteger(rangeDays) || rangeDays < 1 || rangeDays > 1827) throw Error("History rangeDays must be an integer from 1 to 1827");
  const ranges: HistoryPartition[] = [];
  const perRequest: Credit[] = [];
  const date = (seconds: number) => new Date(seconds * 1000).toISOString().slice(0, 10);
  for (let start = START; start < END; start += rangeDays * DAY) {
    const end = Math.min(start + rangeDays * DAY, END);
    const parameters = new URLSearchParams({ latitude: String(queryCell.latitude), longitude: String(queryCell.longitude),
      start_date: date(start), end_date: date(end - DAY), hourly: "cloud_cover", models: "era5", timezone: "GMT",
      timeformat: "unixtime", cell_selection: "nearest", elevation: "nan" });
    ranges.push({ requestedPoint: { ...queryCell }, startUnixSeconds: start, endUnixSeconds: end,
      expectedHours: (end - start) / 3600, url: `https://archive-api.open-meteo.com/v1/archive?${parameters}`,
      historicalAdmission: false, accounting: "unverified", reviewedRangeContract: "api-history-range-v1", rangeDays });
    const estimate = Math.max(1, (end - start) / DAY / 140);
    perRequest.push({ estimatedWeightedCredits: estimate, reservedIntegerCredits: Math.ceil(estimate) });
  }
  const unsigned: Omit<ApiHistoryPlan, "planSha256"> = {
    schemaVersion: 1, mode: "offline", historicalAdmission: false,
    requestedPoint: { latitude: point.latitude, longitude: point.longitude }, queryCell, timeZone, mappingPolicy: MAPPING_POLICY,
    period: { ...PERIOD }, ranges, requestCount: ranges.length, expectedHours: 263088,
    accounting: { estimatedWeightedCredits: perRequest.reduce((total, row) => total + row.estimatedWeightedCredits, 0),
      reservedIntegerCredits: perRequest.reduce((total, row) => total + row.reservedIntegerCredits, 0),
      perRequest, deployedDebit: "unobserved", sourceCodeCommit: METHOD.sourceCodeEvidenceCommit },
    limits: { maxResponseBytes: OPEN_METEO_HISTORY_MAX_BYTES as 2097152, maxTotalBytes: 16777216,
      requestTimeoutMs: 60000, aggregateTimeoutMs: 300000, maxBuildMs: 900000 },
    cacheKey: apiHistoryCacheKey(queryCell, timeZone),
  };
  return { ...unsigned, planSha256: hash(unsigned) };
}
