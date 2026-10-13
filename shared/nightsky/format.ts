import { localeSchema, unitPreferenceSchema, utcInstantSchema, ianaTimeZoneSchema } from "./common";

/** Display conversion only: provider records retain their original values and units. */
export function formatForecastValue(source: { value: number; unit: string }, units: "metric" | "imperial", locale: string): string {
  localeSchema.parse(locale);
  unitPreferenceSchema.parse(units);
  if (!Number.isFinite(source.value)) throw new TypeError("Display value must be finite.");
  let value = source.value;
  let unit = source.unit;
  if (units === "imperial") {
    if (unit === "m/s") { value *= 2.2369362920544; unit = "mph"; }
    else if (["°C", "C", "celsius"].includes(unit)) { value = value * 9 / 5 + 32; unit = "°F"; }
    else if (unit === "mm") { value /= 25.4; unit = "in"; }
    else if (unit === "km") { value /= 1.609344; unit = "mi"; }
    else if (unit === "m") { value /= 0.3048; unit = "ft"; }
  }
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 3 }).format(value)} ${unit}`;
}

export function formatLocalInstant(atUtc: string, timeZone: string, locale: string): string {
  utcInstantSchema.parse(atUtc);
  ianaTimeZoneSchema.parse(timeZone);
  localeSchema.parse(locale);
  const display = new Intl.DateTimeFormat(locale, { timeZone, year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(atUtc));
  return `${display} (${timeZone})`;
}
