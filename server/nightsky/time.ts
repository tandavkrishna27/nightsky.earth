import { ianaTimeZoneSchema, resolveLocalDateTimeToUtc as resolveLocal } from "../../shared/nightsky/common";

export function resolveLocalDateTimeToUtc(localDate: string, hour: number, minute: number, timeZone: string): string {
  ianaTimeZoneSchema.parse(timeZone);
  if (!Number.isInteger(hour) || hour < 0 || hour > 23 || !Number.isInteger(minute) || minute < 0 || minute > 59) {
    throw new RangeError("Hour and minute must be valid local clock values.");
  }
  return resolveLocal(localDate, hour, minute, timeZone);
}

export function formatLocalTime(utcInstant: string, timeZone: string, locale: string): string {
  const instant = new Date(utcInstant);
  if (!Number.isFinite(instant.getTime())) throw new RangeError("A valid UTC instant is required.");
  ianaTimeZoneSchema.parse(timeZone);
  const canonicalLocale = Intl.getCanonicalLocales(locale)[0];
  if (!canonicalLocale) throw new RangeError("A valid locale is required.");
  return new Intl.DateTimeFormat(canonicalLocale, {
    hour: "numeric", minute: "2-digit", timeZone, timeZoneName: "short",
  }).format(instant);
}
