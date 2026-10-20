import * as z from "zod4";
import { sourceRecordSchema } from "../../../shared/nightsky/common";
import { weatherForecastSchema, weatherProviderIdSchema } from "../../../shared/nightsky/weather";
import type { WeatherCollection, WeatherCollectionService, WeatherProviderEntry, WeatherProviderId, WeatherProviderResult } from "./types";

const resultSchema = z.strictObject({ status: z.enum(["available", "partial", "stale", "unavailable", "not-covered", "out-of-horizon"]), reason: z.string().trim().min(1).max(500), forecast: weatherForecastSchema.optional(), source: sourceRecordSchema.optional(), deprecationWarning: z.string().trim().min(1).max(500).optional() });
export function configurationSource(id: WeatherProviderId) {
  return { name: `${id} weather configuration`, url: "https://nightsky.earth/", attribution: "NightSky runtime configuration record; no forecast data or upstream provenance is supplied by this record.", dataClass: "context" as const };
}
export function unavailableWeather(id: WeatherProviderId, reason: string): WeatherProviderResult { return { status: "unavailable", reason, source: configurationSource(id) }; }
export function validateWeatherResult(id: WeatherProviderId, value: unknown): WeatherProviderResult {
  const parsed = resultSchema.safeParse(value);
  return parsed.success ? parsed.data : unavailableWeather(id, "The weather source returned an invalid result.");
}
/** Validate even an injected collection at the public boundary; never trust host fixtures as output schemas. */
export function validateWeatherCollection(value: unknown): WeatherCollection {
  const registry = z.strictObject({ outcomes: z.array(z.strictObject({ providerId: weatherProviderIdSchema, result: z.unknown() })).max(4) }).safeParse(value);
  if (!registry.success || new Set(registry.data.outcomes.map(o => o.providerId)).size !== registry.data.outcomes.length) return { outcomes: [{ providerId: "met", result: unavailableWeather("met", "The weather collection returned an invalid registry result.") }] };
  return { outcomes: registry.data.outcomes.map(o => ({ providerId: o.providerId, result: validateWeatherResult(o.providerId, o.result) })) };
}
/** One default source (with one fallback) or two comparison workers share one deadline. Providers own cancellation; completed snapshots never change. */
export function createWeatherCollection(entries: WeatherProviderEntry[], options: { deadlineMs: number }): WeatherCollectionService {
  if (!Number.isSafeInteger(options.deadlineMs) || options.deadlineMs <= 0 || options.deadlineMs > 12_000) throw new TypeError("Weather collection deadline must be between 1 and 12000 ms.");
  if (entries.length > 4 || new Set(entries.map(e => e.id)).size !== entries.length || entries.some(e => !weatherProviderIdSchema.safeParse(e.id).success || typeof e.enabled !== "boolean" || typeof e.provider?.getForecast !== "function")) throw new TypeError("Invalid weather provider registry.");
  const registry = entries.map(entry => ({ ...entry }));
  return { async getForecasts(place, window, selection = { mode: "single" }) {
    const mode = selection.mode;
    if (!(["single", "compare", "all"] as const).includes(mode)) throw new TypeError("Invalid weather selection mode.");
    const excluded = selection.excludedProviderIds ?? [];
    if (!Array.isArray(excluded) || excluded.some(id => !weatherProviderIdSchema.safeParse(id).success)) throw new TypeError("Invalid excluded weather provider.");
    const permitted = registry.filter(entry => !excluded.includes(entry.id));
    const enabled = permitted.filter(entry => entry.enabled);
    const chosen = mode === "all" ? permitted : enabled.slice(0, 2);
    const considered = chosen.length ? chosen : permitted.slice(0, 1);
    if (!considered.length) return { outcomes: [] };
    const results = considered.map(entry => unavailableWeather(entry.id, entry.enabled ? "The weather collection deadline expired before this source completed." : "This weather source is disabled or not configured."));
    let cursor = 0, closed = false, started = 0;
    const useful = (result: WeatherProviderResult) => result.forecast && ["available", "partial"].includes(result.status) && ["available", "partial"].includes(result.forecast.availability.status) && result.forecast.samples.some(sample => Date.parse(sample.validAt) >= Date.parse(window.startUtc) && Date.parse(sample.validAt) <= Date.parse(window.endUtc));
    const worker = async () => {
      while (!closed && cursor < considered.length) {
        const index = cursor++, entry = considered[index]!;
        if (!entry.enabled) continue;
        started = Math.max(started, index + 1);
        let result: WeatherProviderResult;
        try { result = validateWeatherResult(entry.id, await entry.provider.getForecast({ ...place }, { ...window })); }
        catch { result = unavailableWeather(entry.id, "The weather source could not complete this request."); }
        if (!closed) results[index] = result;
        if (mode === "single" && useful(result)) break;
      }
    };
    let timer: ReturnType<typeof setTimeout> | undefined;
    await Promise.race([mode === "single" ? worker() : Promise.all([worker(), worker()]), new Promise<void>(resolve => { timer = setTimeout(resolve, options.deadlineMs); })]);
    closed = true;
    if (timer) clearTimeout(timer);
    const returned = mode === "single" ? considered.slice(0, Math.max(1, started)) : considered;
    return { outcomes: returned.map((entry, index) => ({ providerId: entry.id, result: results[index]! })) };
  } };
}
