import * as z from "zod4";
import { weatherForecastSchema, type WeatherForecast } from "../../../shared/nightsky/weather";
import { latitudeSchema, longitudeSchema, timeWindowSchema } from "../../../shared/nightsky/common";
import type { WeatherAdapterOptions, WeatherProvider, WeatherProviderResult } from "./types";
import { upstreamRequestKey } from "../upstreamControls";
const SOURCE = { name: "OpenWeather", url: "https://openweathermap.org/api/forecast5", dataClass: "forecast" as const, product: "Five-day forecast at native three-hour cadence", licenseUrl: "https://opendatacommons.org/licenses/odbl/1-0/", attribution: "Weather data provided by OpenWeather (https://openweathermap.org/), available under ODbL 1.0 (https://opendatacommons.org/licenses/odbl/1-0/). NightSky selects and normalizes forecast fields. Forecasts are model estimates and do not guarantee local observing conditions." };
const number = (min: number, max: number) => z.number().finite().min(min).max(max).optional();
const stepSchema = z.object({ dt: z.number().int().min(10800).max(253402300799), main: z.object({ temp: number(-150, 100), humidity: number(0, 100) }).optional(), clouds: z.object({ all: number(0, 100) }).optional(), wind: z.object({ speed: number(0, 500), gust: number(0, 500), deg: number(0, 360) }).optional(), visibility: number(0, 1000000), pop: number(0, 1), rain: z.object({ "3h": number(0, 10000) }).optional(), snow: z.object({ "3h": number(0, 10000) }).optional() });
const payloadSchema = z.object({ cod: z.union([z.literal("200"), z.literal(200)]), list: z.array(stepSchema).min(1).max(40) });
type Payload = z.infer<typeof payloadSchema>;
const fields = ["totalCloudCover", "lowCloudCover", "mediumCloudCover", "highCloudCover", "precipitationProbability", "precipitationAmount", "windSpeed", "windGust", "windDirection", "temperature", "dewPoint", "relativeHumidity", "visibility"] as const;
function normalize(payload: Payload, window: {
    startUtc: string;
    endUtc: string;
    timeZone: string;
}, fetchedAt: number): WeatherProviderResult {
    const steps = [...payload.list].sort((a, b) => a.dt - b.dt);
    if (new Set(steps.map(s => s.dt)).size !== steps.length)
        throw Error("Duplicate forecast times");
    const first = steps[0].dt * 1000, last = steps[steps.length - 1].dt * 1000, start = Date.parse(window.startUtc), end = Date.parse(window.endUtc);
    const selected = steps.filter(s => s.dt * 1000 >= start && s.dt * 1000 <= end);
    if (!selected.length)
        return { status: end < first || start > last ? "out-of-horizon" : "not-covered", reason: "OpenWeather supplied no native three-hour samples in the requested window.", source: SOURCE };
    const seen = new Set<string>();
    const samples = selected.map(step => {
        const values: WeatherForecast["samples"][number]["values"] = {};
        const add = (field: typeof fields[number], value: number | undefined, unit: string, period = false) => { if (value !== undefined) {
            values[field] = { value, unit, ...(period ? { periodStartUtc: new Date((step.dt - 10800) * 1000).toISOString(), periodEndUtc: new Date(step.dt * 1000).toISOString() } : {}) };
            seen.add(field);
        } };
        add("totalCloudCover", step.clouds?.all, "%");
        add("temperature", step.main?.temp, "°C");
        add("relativeHumidity", step.main?.humidity, "%");
        add("windSpeed", step.wind?.speed, "m/s");
        add("windGust", step.wind?.gust, "m/s");
        add("windDirection", step.wind?.deg, "degrees");
        add("visibility", step.visibility, "m");
        // Documented precipitation volume is for the preceding three hours, ending at dt.
        const rain = step.rain?.["3h"], snow = step.snow?.["3h"];
        if (rain !== undefined || snow !== undefined)
            add("precipitationAmount", (rain ?? 0) + (snow ?? 0), "mm", true);
        // pop is validated but omitted: JSON docs do not establish interval boundaries.
        return { validAt: new Date(step.dt * 1000).toISOString(), values };
    }).filter(s => Object.keys(s.values).length > 0);
    if (!samples.length)
        throw Error("No supported weather fields");
    const gaps = first > start || last < end || steps.some((s, i) => i > 0 && s.dt - steps[i - 1].dt !== 10800) || samples.length !== selected.length;
    const reason = gaps ? "OpenWeather native three-hour forecast has horizon or coverage gaps; missing fields remain unknown." : "OpenWeather native three-hour forecast; no hourly interpolation. Missing cloud layers and dew point remain unknown.";
    return { status: "partial", reason, forecast: weatherForecastSchema.parse({ availability: { status: "partial", reason }, source: { ...SOURCE, validStartUtc: new Date(first).toISOString(), validEndUtc: new Date(last).toISOString() }, forecastHorizonHours: Math.max(0, (last - fetchedAt) / 3600000), samples, missingFields: fields.filter(f => !seen.has(f)).map(field => ({ field, reason: field === "precipitationProbability" ? "Probability interval boundaries are not established by this JSON endpoint documentation; no probability interval was inferred." : "Not supplied by the native three-hour forecast; no value was inferred." })) }) };
}
/** Fixed forecast endpoint. Runtime admission and private credential activation belong to bootstrap.
 * No response cache is retained until source caching permission is established.
 */
export function createOpenWeatherProvider(options: WeatherAdapterOptions): WeatherProvider {
    let active = false, lastStart = -Infinity, disabled = false, blockedUntil = 0;
    const quota = options.quota as typeof options.quota & {
        setProviderState?(providerId: string, state: {
            disabled?: boolean;
            blockedUntil?: number;
        }): Promise<void>;
    };
    const unavailable = (reason: string): WeatherProviderResult => ({ status: "unavailable", reason, source: SOURCE });
    return { async getForecast(place, requestedWindow) {
            let window: ReturnType<typeof timeWindowSchema.parse>;
            try {
                latitudeSchema.parse(place.latitude);
                longitudeSchema.parse(place.longitude);
                window = timeWindowSchema.parse(requestedWindow);
            }
            catch {
                return unavailable("OpenWeather coordinates or window are invalid.");
            }
            if (!options.apiKey.trim())
                return unavailable("OpenWeather is not configured.");
            const now = options.now();
            if (disabled || now < blockedUntil || active || now < lastStart || now - lastStart < 1000)
                return unavailable("OpenWeather request admission limit reached.");
            active = true;
            const controller = new AbortController();
            let timer: ReturnType<typeof setTimeout>;
            const deadline = new Promise<never>((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(Error("Deadline")); }, 5000); });
            try {
                const work = (async () => {
                        const reservation = await options.quota.reserve("openweather", 1);
                        controller.signal.throwIfAborted();
                        if (!reservation.allowed)
                            return unavailable("OpenWeather quota reservation denied.");
                        const url = new URL("https://api.openweathermap.org/data/2.5/forecast");
                        url.searchParams.set("lat", String(place.latitude));
                        url.searchParams.set("lon", String(place.longitude));
                        url.searchParams.set("appid", options.apiKey);
                        url.searchParams.set("units", "metric");
                        url.searchParams.set("cnt", "40");
                        const response = await options.controls.fetch("openweather", upstreamRequestKey(`${place.latitude},${place.longitude}`, options), async () => {
                            controller.signal.throwIfAborted();
                            lastStart = options.now();
                            const incoming = await options.fetcher(url, { method: "GET", redirect: "error", signal: controller.signal, headers: { Accept: "application/json" } });
                            if (controller.signal.aborted) { void incoming.body?.cancel().catch(() => {}); controller.signal.throwIfAborted(); }
                            if (incoming.status === 401 || incoming.status === 403) {
                                disabled = true;
                                await quota.setProviderState?.("openweather", { disabled: true });
                            }
                            if (incoming.status === 429) {
                                const raw = incoming.headers.get("Retry-After");
                                const delay = raw && /^\d+$/.test(raw.trim()) ? Number(raw) * 1000 : raw ? Date.parse(raw) - options.now() : 60000;
                                blockedUntil = options.now() + Math.min(86400000, Math.max(1000, Number.isFinite(delay) ? delay : 60000));
                                await quota.setProviderState?.("openweather", { blockedUntil });
                            }
                            if (incoming.redirected || !incoming.ok) {
                                void incoming.body?.cancel().catch(() => { });
                                return new Response(null, { status: incoming.status >= 300 ? incoming.status : 502 });
                            }
                            if (Number(incoming.headers.get("Content-Length")) > 524288) {
                                void incoming.body?.cancel().catch(() => { });
                                throw Error("Size");
                            }
                            const reader = incoming.body?.getReader();
                            if (!reader)
                                throw Error("No body");
                            const cancel = () => { void reader.cancel().catch(() => { }); };
                            controller.signal.addEventListener("abort", cancel, { once: true });
                            const chunks: Uint8Array[] = [];
                            let size = 0;
                            try {
                                while (true) {
                                    const part = await reader.read();
                                    controller.signal.throwIfAborted();
                                    if (part.done)
                                        break;
                                    size += part.value.byteLength;
                                    if (size > 524288)
                                        throw Error("Size");
                                    chunks.push(part.value);
                                }
                            }
                            finally {
                                controller.signal.removeEventListener("abort", cancel);
                                cancel();
                                reader.releaseLock();
                            }
                            const bytes = new Uint8Array(size);
                            let offset = 0;
                            for (const chunk of chunks) {
                                bytes.set(chunk, offset);
                                offset += chunk.length;
                            }
                            return new Response(bytes, { headers: { "Content-Type": "application/json" } });
                        }, controller.signal);
                        controller.signal.throwIfAborted();
                        if (!response.ok)
                            return unavailable(`OpenWeather returned HTTP ${response.status}; no forecast is available.`);
                        const payload = payloadSchema.parse(await response.json());
                        controller.signal.throwIfAborted();
                        return normalize(payload, window, now);
                    })();
                // The caller deadline can win while an injected transport ignores abort.
                // Keep admission owned until the actual operation settles, including rejection.
                void work.then(() => { active = false; }, () => { active = false; });
                return await Promise.race([work, deadline]);
            }
            catch {
                return unavailable(controller.signal.aborted ? "OpenWeather request or response body timed out." : "OpenWeather request failed or returned an invalid response.");
            }
            finally {
                clearTimeout(timer!);
            }
        } };
}


