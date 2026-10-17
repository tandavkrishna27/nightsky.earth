import { createHash } from "node:crypto";

export interface HistoryPoint { latitude: number; longitude: number }
const START = Date.parse("1990-12-30T00:00:00Z") / 1000;
const END = Date.parse("2021-01-03T00:00:00Z") / 1000;
const PARTITION_SECONDS = 14 * 86400;
export const OPEN_METEO_HISTORY_MAX_BYTES = 2 * 1024 * 1024;
const ENDPOINT = "https://archive-api.open-meteo.com/v1/archive";
const FIXED = { hourly: "cloud_cover", models: "era5", timezone: "GMT", timeformat: "unixtime", cell_selection: "nearest", elevation: "nan" };
export interface HistoryPartition {
  requestedPoint: HistoryPoint; startUnixSeconds: number; endUnixSeconds: number;
  expectedHours: number; url: string; historicalAdmission: false; accounting: "unverified";
}
function point(value: HistoryPoint): void {
  if (!Number.isFinite(value.latitude) || Math.abs(value.latitude) > 90 || !Number.isFinite(value.longitude) || Math.abs(value.longitude) > 180) throw Error("Invalid history point");
}
function requestUrl(p: HistoryPoint, start: number, end: number): string {
  const date = (seconds: number) => new Date(seconds * 1000).toISOString().slice(0,10);
  return `${ENDPOINT}?${new URLSearchParams({ latitude: String(p.latitude), longitude: String(p.longitude), start_date: date(start), end_date: date(end - 86400), ...FIXED })}`;
}
/** Pure planning only. A request count is never an accounting charge or permission to execute. */
export function planOpenMeteoHistory(requestedPoint: HistoryPoint): HistoryPartition[] {
  point(requestedPoint);
  const partitions: HistoryPartition[] = [];
  for (let start = START; start < END; start += PARTITION_SECONDS) {
    const end = Math.min(start + PARTITION_SECONDS, END);
    partitions.push({ requestedPoint: {...requestedPoint}, startUnixSeconds: start, endUnixSeconds: end,
      expectedHours: (end-start)/3600, url: requestUrl(requestedPoint,start,end), historicalAdmission: false, accounting: "unverified" });
  }
  return partitions;
}
function validatePartition(p: HistoryPartition): void {
  point(p.requestedPoint);
  if (!Number.isInteger(p.startUnixSeconds) || p.startUnixSeconds < START || p.startUnixSeconds >= END ||
      (p.startUnixSeconds-START)%PARTITION_SECONDS !== 0 || p.endUnixSeconds !== Math.min(p.startUnixSeconds+PARTITION_SECONDS,END) ||
      p.expectedHours !== (p.endUnixSeconds-p.startUnixSeconds)/3600 || p.url !== requestUrl(p.requestedPoint,p.startUnixSeconds,p.endUnixSeconds) ||
      p.historicalAdmission !== false || p.accounting !== "unverified") throw Error("Incompatible history request contract");
}
/** Decode retained bytes into quarantine, never the admitted dark-cloud artifact schema.
 * expectedCell must be carried across partitions by any future build coordinator.
 * Wire data does not attest upstream model/revision; the receipt binds the requested model only.
 */
export function decodeOpenMeteoHistory(bytes: Uint8Array, partition: HistoryPartition, expectedCell?: HistoryPoint) {
  validatePartition(partition);
  if (bytes.byteLength > OPEN_METEO_HISTORY_MAX_BYTES) throw Error("History body exceeds size bound");
  const rawBytes = Buffer.from(bytes);
  const wire = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(rawBytes));
  if (!wire || Array.isArray(wire) || typeof wire !== "object") throw Error("Expected one history cell");
  const actualCell: HistoryPoint = { latitude: wire.latitude, longitude: wire.longitude };
  point(actualCell);
  if (!Number.isInteger(actualCell.latitude*4) || !Number.isInteger(actualCell.longitude*4)) throw Error("History cell is not on 0.25 degree grid");
  if (expectedCell && (actualCell.latitude !== expectedCell.latitude || actualCell.longitude !== expectedCell.longitude)) throw Error("History cell drift");
  if (wire.utc_offset_seconds !== 0 || wire.hourly_units?.time !== "unixtime" || wire.hourly_units?.cloud_cover !== "%") throw Error("History timezone or unit mismatch");
  const times = wire.hourly?.time; const clouds = wire.hourly?.cloud_cover;
  if (!Array.isArray(times) || !Array.isArray(clouds) || times.length !== clouds.length || times.length > partition.expectedHours) throw Error("History array mismatch");
  const byTime = new Map<number, number | null>();
  let previous = -Infinity;
  for (let i=0; i<times.length; i++) {
    const time = times[i]; const cloud = clouds[i];
    if (!Number.isInteger(time) || time <= previous || time < partition.startUnixSeconds || time >= partition.endUnixSeconds || time % 3600 !== 0) throw Error("History timestamp order, duplicate or boundary mismatch");
    if (cloud !== null && (typeof cloud !== "number" || !Number.isFinite(cloud) || cloud < 0 || cloud > 100)) throw Error("Invalid cloud percent");
    byTime.set(time,cloud === null ? null : cloud/100); previous=time;
  }
  const samples = Array.from({length:partition.expectedHours},(_,i)=>{
    const unixSeconds=partition.startUnixSeconds+i*3600;
    return {unixSeconds,cloudFraction:byTime.get(unixSeconds) ?? null};
  });
  return { schema: "open-meteo-era5-quarantine-v1" as const, historicalAdmission: false as const,
    accounting: "unverified" as const, requestedPoint: {...partition.requestedPoint}, actualCell,
    samples, missingHours:samples.filter(s=>s.cloudFraction===null).length,
    receipt: { source: "Open-Meteo Historical Weather" as const, requestedModel: "era5" as const,
      upstreamScientificRevision: "unverified" as const, requestUrl:partition.url,
      sha256:createHash("sha256").update(rawBytes).digest("hex"),rawBytes } };
}
