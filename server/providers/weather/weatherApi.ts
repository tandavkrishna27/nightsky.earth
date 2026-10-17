import * as z from "zod4";
import { weatherForecastSchema, type WeatherForecast } from "../../../shared/nightsky/weather";
import { latitudeSchema, longitudeSchema, timeWindowSchema } from "../../../shared/nightsky/common";
import type { WeatherAdapterOptions, WeatherProvider, WeatherProviderResult } from "./types";
import { upstreamRequestKey } from "../upstreamControls";
const SOURCE = {
    name: "WeatherAPI.com", url: "https://www.weatherapi.com/docs/forecast-api/", dataClass: "forecast" as const,
    product: "Free three-day hourly forecast", licenseUrl: "https://www.weatherapi.com/terms.aspx",
    attribution: "WeatherAPI.com. Weather information is for general information. Forecasts are probabilistic and may be inaccurate for your location or time. Never use as the sole basis for personal safety, aviation, marine navigation, emergency planning or other safety-critical decisions; consult official meteorological services and relevant authorities.",
};
const number = (min: number, max: number) => z.number().finite().min(min).max(max).optional();
const hourSchema = z.object({
    time_epoch: z.number().int().min(0).max(253402300799),
    cloud: number(0, 100), temp_c: number(-150, 100), wind_kph: number(0, 1500), gust_kph: number(0, 1500),
    wind_degree: number(0, 360), humidity: number(0, 100), dewpoint_c: number(-150, 100), vis_km: number(0, 1000),
});
const payloadSchema = z.object({ forecast: z.object({ forecastday: z.array(z.object({ hour: z.array(hourSchema).max(25) })).min(1).max(3) }) });
type Payload = z.infer<typeof payloadSchema>;
const fields = ["totalCloudCover", "lowCloudCover", "mediumCloudCover", "highCloudCover", "precipitationProbability", "precipitationAmount", "windSpeed", "windGust", "windDirection", "temperature", "dewPoint", "relativeHumidity", "visibility"] as const;
function normalize(payload: Payload, window: {
    startUtc: string;
    endUtc: string;
    timeZone: string;
}, fetchedAt: number): WeatherProviderResult {
    const hours = payload.forecast.forecastday.flatMap(day => day.hour).sort((a, b) => a.time_epoch - b.time_epoch);
    if (!hours.length || new Set(hours.map(h => h.time_epoch)).size !== hours.length)
        throw Error("Invalid hours");
    const start = Date.parse(window.startUtc), end = Date.parse(window.endUtc);
    const first = hours[0].time_epoch * 1000, last = hours[hours.length - 1].time_epoch * 1000;
    const selected = hours.filter(h => h.time_epoch * 1000 >= start && h.time_epoch * 1000 <= end);
    if (!selected.length)
        return { status: end < first || start > last ? "out-of-horizon" : "not-covered", reason: "WeatherAPI.com supplied no hourly forecast samples in the requested window.", source: SOURCE };
    const seen = new Set<string>();
    const samples = selected.slice(0, 48).map(hour => {
        const values: WeatherForecast["samples"][number]["values"] = {};
        const mapping = [["totalCloudCover", "cloud", "%", 1], ["temperature", "temp_c", "°C", 1], ["windSpeed", "wind_kph", "m/s", 1 / 3.6], ["windGust", "gust_kph", "m/s", 1 / 3.6], ["windDirection", "wind_degree", "degrees", 1], ["relativeHumidity", "humidity", "%", 1], ["dewPoint", "dewpoint_c", "°C", 1], ["visibility", "vis_km", "m", 1000]] as const;
        for (const [field, key, unit, factor] of mapping) {
            const value = hour[key];
            if (value !== undefined) {
                values[field] = { value: value * factor, unit };
                seen.add(field);
            }
        }
        return { validAt: new Date(hour.time_epoch * 1000).toISOString(), values };
    }).filter(s => Object.keys(s.values).length);
    if (!samples.length)
        throw Error("No supported fields");
    const gaps = first > start || last < end || selected.length > 48 || samples.length < selected.length || samples.some((sample, i) => i > 0 && Date.parse(sample.validAt) - Date.parse(samples[i - 1].validAt) !== 3600000);
    const reason = gaps ? "WeatherAPI.com coverage has horizon or hourly gaps; unsupported fields remain unknown." : "WeatherAPI.com hourly forecast; unsupported cloud layers and precipitation period semantics remain unknown.";
    const forecast = weatherForecastSchema.parse({ availability: { status: "partial", reason }, source: { ...SOURCE, validStartUtc: new Date(first).toISOString(), validEndUtc: new Date(last).toISOString() }, forecastHorizonHours: Math.max(0, (last - fetchedAt) / 3600000), samples, missingFields: fields.filter(f => !seen.has(f)).map(field => ({ field, reason: field.startsWith("precipitation") ? "Hourly precipitation interval boundaries and combined rain/snow probability semantics are not documented; no interval or probability was inferred." : "Not provided by this hourly forecast; no value was inferred." })) });
    return { status: "partial", reason, forecast };
}
/** Free endpoint only. No current observations, trial-only fields, retries or coordinate rounding. */
export function createWeatherApiProvider(options: WeatherAdapterOptions): WeatherProvider {
    const cache = new Map<string, {
        payload: Payload;
        bytes: number;
        at: number;
    }>();
    let cacheBytes = 0, active = false, lastStart = -Infinity, disabled = false, blockedUntil = 0;
    const quota = options.quota as WeatherAdapterOptions["quota"] & {
        setProviderState?(providerId: string, state: { disabled?: boolean; blockedUntil?: number }): Promise<void>;
    };
    const persistFailure = async (status: number, retryAfter: string | null = null) => {
        if (status === 401 || status === 403) {
            disabled = true;
            await quota.setProviderState?.("weatherapi", { disabled: true });
        }
        if (status === 429) {
            const delay = retryAfter && /^\d+$/.test(retryAfter) ? Number(retryAfter) * 1000 : Date.parse(retryAfter ?? "") - options.now();
            blockedUntil = options.now() + Math.min(86400000, Math.max(60000, Number.isFinite(delay) ? delay : 60000));
            await quota.setProviderState?.("weatherapi", { blockedUntil });
        }
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
                return unavailable("WeatherAPI.com request coordinates or window are invalid.");
            }
            if (!options.apiKey.trim())
                return unavailable("WeatherAPI.com is not configured.");
            if (disabled || blockedUntil > options.now())
                return unavailable("WeatherAPI.com authentication or rate-limit admission is blocked.");
            const key = `${place.latitude},${place.longitude}`;
            const now = options.now();
            for (const [id, entry] of Array.from(cache))
                if (now < entry.at || now - entry.at >= 900000) {
                    cache.delete(id);
                    cacheBytes -= entry.bytes;
                }
            const cached = cache.get(key);
            if (cached) {
                try { return normalize(cached.payload, window, cached.at); }
                catch { return unavailable("WeatherAPI.com returned no usable forecast fields for the requested window."); }
            }
            if (active || now - lastStart < 1000)
                return unavailable("WeatherAPI.com request admission limit reached.");
            active = true;
            const controller = new AbortController();
            let timer: ReturnType<typeof setTimeout>;
            const deadline = new Promise<never>((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(Error("Deadline")); }, 5000); });
            try {
                const result = await Promise.race([(async () => {
                        const reservation = await options.quota.reserve("weatherapi", 1);
                        controller.signal.throwIfAborted();
                        if (!reservation.allowed)
                            return unavailable("WeatherAPI.com quota reservation denied.");
                        const url = new URL("https://api.weatherapi.com/v1/forecast.json");
                        url.searchParams.set("key", options.apiKey);
                        url.searchParams.set("q", key);
                        url.searchParams.set("days", "3");
                        url.searchParams.set("aqi", "no");
                        url.searchParams.set("alerts", "no");
                        const response = await options.controls.fetch("weatherapi", upstreamRequestKey(key, options), async () => {
                            controller.signal.throwIfAborted();
                            lastStart = options.now();
                            const incoming = await options.fetcher(url, { method: "GET", redirect: "error", signal: controller.signal, headers: { Accept: "application/json" } });
                            if (incoming.redirected) {
                                void incoming.body?.cancel().catch(() => { });
                                throw Error("Redirect rejected");
                            }
                            // A 403 can mean exhausted monthly quota. Persist a temporary block
                            // before reading its body, then distinguish quota from authentication.
                            if ([401, 403, 429].includes(incoming.status))
                                await persistFailure(incoming.status === 403 ? 429 : incoming.status, incoming.headers.get("Retry-After"));
                            const declared = Number(incoming.headers.get("Content-Length"));
                            if (declared > 524288) {
                                void incoming.body?.cancel().catch(() => { });
                                throw Error("Size");
                            }
                            const reader = incoming.body?.getReader();
                            if (!reader && !incoming.ok)
                                return new Response(null, { status: incoming.status, headers: incoming.headers });
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
                            for (const part of chunks) {
                                bytes.set(part, offset);
                                offset += part.length;
                            }
                            return new Response(bytes, { status: incoming.status, headers: incoming.headers });
                        }, controller.signal);
                        controller.signal.throwIfAborted();
                        let raw: unknown;
                        try { raw = await response.json(); }
                        catch { if (response.ok) throw Error("Invalid JSON"); }
                        controller.signal.throwIfAborted();
                        let errorCode: number | undefined;
                        if (typeof raw === "object" && raw !== null && "error" in raw) {
                            const error = raw.error;
                            if (typeof error === "object" && error !== null && "code" in error && typeof error.code === "number")
                                errorCode = error.code;
                            if ([2006, 2008, 2009].includes(errorCode ?? -1)) await persistFailure(401);
                            else if (errorCode === 2007 && response.status !== 429 && response.status !== 403) await persistFailure(429);
                            else if (response.status === 403 && errorCode !== 2007) await persistFailure(401);
                            throw Error("Provider error");
                        }
                        if (response.status === 403) await persistFailure(401);
                        if (!response.ok)
                            return unavailable(`WeatherAPI.com returned HTTP ${response.status}; no forecast is available.`);
                        const payload = payloadSchema.parse(raw);
                        controller.signal.throwIfAborted();
                        const forecast = normalize(payload, window, now);
                        const bytes = new TextEncoder().encode(JSON.stringify(payload)).byteLength;
                        if (bytes <= 65536) {
                            cache.set(key, { payload, bytes, at: now });
                            cacheBytes += bytes;
                            while (cache.size > 128 || cacheBytes > 2097152) {
                                const oldest = cache.keys().next().value!;
                                cacheBytes -= cache.get(oldest)!.bytes;
                                cache.delete(oldest);
                            }
                        }
                        return forecast;
                    })(), deadline]);
                return result;
            }
            catch {
                return unavailable(controller.signal.aborted ? "WeatherAPI.com request or response body timed out." : "WeatherAPI.com request failed or returned an invalid response.");
            }
            finally {
                clearTimeout(timer!);
                active = false;
            }
        } };
}
