export function isSupportedZone(zone: string): boolean {
  if (!zone) return false;
  const cached = supportedZoneCache.get(zone);
  if (cached !== undefined) return cached;
  let supported: boolean;
  try {
    new Intl.DateTimeFormat("en", { timeZone: zone }).format();
    supported = true;
  } catch {
    supported = false;
  }
  cacheValue(supportedZoneCache, zone, supported);
  return supported;
}
const supportedZoneCache = new Map<string, boolean>();
const dateKeyFormatters = new Map<string, Intl.DateTimeFormat>();
const instantFormatters = new Map<string, Intl.DateTimeFormat>();
function cacheValue<T>(cache: Map<string, T>, key: string, value: T): T {
  if (cache.size >= 32 && !cache.has(key)) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(key, value);
  return value;
}
export function resolveZone(...zones: (string | null | undefined)[]): string {
  return zones.find((z) => z && isSupportedZone(z)) || "UTC";
}
export function dateKeyAt(utc: string, zone: string): string {
  const resolvedZone = resolveZone(zone);
  const formatter =
    dateKeyFormatters.get(resolvedZone) ||
    cacheValue(
      dateKeyFormatters,
      resolvedZone,
      new Intl.DateTimeFormat("en-GB-u-ca-gregory-nu-latn", {
        timeZone: resolvedZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }),
    );
  const parts = formatter.formatToParts(new Date(utc));
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}
export function formatInstant(utc: string, zone: string): string {
  const resolvedZone = resolveZone(zone);
  const formatter =
    instantFormatters.get(resolvedZone) ||
    cacheValue(
      instantFormatters,
      resolvedZone,
      new Intl.DateTimeFormat("en-GB", {
        timeZone: resolvedZone,
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
        timeZoneName: "shortOffset",
      }),
    );
  return formatter.format(new Date(utc));
}
export function addDays(day: string, n: number): string {
  const d = new Date(day + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
export function dateRange(start: string, end: string): string[] {
  const out: string[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) {
    out.push(d);
    if (out.length > 800) throw Error("Event range exceeds supported length");
  }
  return out;
}
export function validMonth(month: string): boolean {
  return /^(19\d{2}|20\d{2}|2100)-(0[1-9]|1[0-2])$/.test(month);
}
export function shiftMonth(month: string, delta: number): string {
  const d = new Date(month + "-01T12:00:00Z");
  d.setUTCMonth(d.getUTCMonth() + delta);
  return d.toISOString().slice(0, 7);
}
export function monthCells(
  month: string,
): readonly { date: string; inMonth: boolean }[] {
  if (!validMonth(month)) return [];
  const start = month + "-01";
  const weekday = (new Date(start + "T12:00:00Z").getUTCDay() + 6) % 7;
  const last = addDays(shiftMonth(month, 1) + "-01", -1);
  const end = addDays(
    last,
    6 - ((new Date(last + "T12:00:00Z").getUTCDay() + 6) % 7),
  );
  return dateRange(addDays(start, -weekday), end).map((date) => ({
    date,
    inMonth: date.startsWith(month),
  }));
}
