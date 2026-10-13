import {
  controlsFor,
  upstreamRequestKey,
  type UpstreamControls,
} from "../upstreamControls";
import * as z from "zod4";
import {
  weatherForecastSchema,
  type WeatherForecast,
} from "../../../shared/nightsky/weather";
import {
  assertStructuredResultSize,
  sourceRecordSchema,
  timeWindowSchema,
} from "../../../shared/nightsky/common";
import type {
  WeatherPlace,
  WeatherProvider,
  WeatherProviderResult,
} from "./types";
const BASE_URL = "https://api.met.no/weatherapi/locationforecast/2.0/complete";
const DOC_URL =
  "https://api.met.no/weatherapi/locationforecast/2.0/documentation";
const DATA_MODEL_URL =
  "https://docs.api.met.no/doc/locationforecast/datamodel.html";
const LICENSE_URL = "https://creativecommons.org/licenses/by/4.0/";
export const MET_NORWAY_SOURCE = sourceRecordSchema.parse({
  name: "MET Norway",
  url: DOC_URL,
  attribution:
    "Weather forecast from MET Norway. Data licensed under CC BY 4.0; retrieved and normalized by NightSky.earth.",
  dataClass: "forecast",
  product: "Locationforecast 2.0 complete",
  licenseUrl: LICENSE_URL,
  modified: true,
});
const numberSchema = z.number().finite();
const instantDetailsSchema = z.record(z.string(), numberSchema);
const periodDetailsSchema = z.record(z.string(), numberSchema);
const payloadSchema = z.object({
  properties: z.object({
    meta: z.object({
      updated_at: z.string().datetime({ offset: true }),
      units: z.record(z.string(), z.string()).optional(),
    }),
    timeseries: z.array(
      z.object({
        time: z.string().datetime({ offset: true }),
        data: z.object({
          instant: z.object({ details: instantDetailsSchema }),
          next_1_hours: z.object({ details: periodDetailsSchema }).optional(),
          next_6_hours: z.object({ details: periodDetailsSchema }).optional(),
          next_12_hours: z.object({ details: periodDetailsSchema }).optional(),
        }),
      }),
    ),
  }),
});
const fields = [
  ["totalCloudCover", "cloud_area_fraction"],
  ["lowCloudCover", "cloud_area_fraction_low"],
  ["mediumCloudCover", "cloud_area_fraction_medium"],
  ["highCloudCover", "cloud_area_fraction_high"],
  ["precipitationProbability", "probability_of_precipitation"],
  ["precipitationAmount", "precipitation_amount"],
  ["windSpeed", "wind_speed"],
  ["windGust", "wind_speed_of_gust"],
  ["windDirection", "wind_from_direction"],
  ["temperature", "air_temperature"],
  ["dewPoint", "dew_point_temperature"],
  ["relativeHumidity", "relative_humidity"],
] as const;
type WeatherField = (typeof fields)[number][0];
const defaultUnits: Record<WeatherField, string> = {
  totalCloudCover: "%",
  lowCloudCover: "%",
  mediumCloudCover: "%",
  highCloudCover: "%",
  precipitationProbability: "%",
  precipitationAmount: "mm",
  windSpeed: "m/s",
  windGust: "m/s",
  windDirection: "degrees",
  temperature: "°C",
  dewPoint: "°C",
  relativeHumidity: "%",
};
interface ParseMetadata {
  lastModified?: string;
  checkedAt: string;
}
type ForecastStepData = z.infer<
  typeof payloadSchema
>["properties"]["timeseries"][number]["data"];
function periodsFor(data: ForecastStepData) {
  return [
    { hours: 1, details: data.next_1_hours?.details },
    { hours: 6, details: data.next_6_hours?.details },
    { hours: 12, details: data.next_12_hours?.details },
  ];
}
function hasPrecipitation(
  details: Record<string, number> | undefined,
): boolean {
  return (
    details?.precipitation_amount !== undefined ||
    details?.probability_of_precipitation !== undefined
  );
}
export function parseLocationForecast(
  payload: unknown,
  place: WeatherPlace,
  requestedWindow: {
    startUtc: string;
    endUtc: string;
    timeZone: string;
  },
  metadata: ParseMetadata,
): WeatherProviderResult {
  const window = timeWindowSchema.parse(requestedWindow);
  const parsed = payloadSchema.safeParse(payload);
  if (!parsed.success)
    throw new TypeError("Malformed MET Locationforecast payload.");
  const document = parsed.data.properties;
  const validStartUtc = document.timeseries[0]?.time;
  let horizonEnd = -Infinity;
  for (const { time, data } of document.timeseries) {
    horizonEnd = Math.max(horizonEnd, Date.parse(time));
    for (const { hours, details } of periodsFor(data))
      if (hasPrecipitation(details))
        horizonEnd = Math.max(horizonEnd, Date.parse(time) + hours * 3600000);
  }
  const validEndUtc = Number.isFinite(horizonEnd)
    ? new Date(horizonEnd).toISOString()
    : undefined;
  if (!validStartUtc || !validEndUtc)
    return {
      status: "unavailable",
      reason: "MET Norway returned no forecast time steps.",
    };
  const requestedStart = Date.parse(window.startUtc);
  const requestedEnd = Date.parse(window.endUtc);
  const overlaps = (time: string, hours: number) =>
    Date.parse(time) < requestedEnd &&
    Date.parse(time) + hours * 3600000 > requestedStart;
  const instantInside = (time: string) =>
    Date.parse(time) >= requestedStart && Date.parse(time) <= requestedEnd;
  const inWindow = document.timeseries.filter(
    ({ time, data }) =>
      instantInside(time) ||
      periodsFor(data).some(
        ({ hours, details }) =>
          overlaps(time, hours) && hasPrecipitation(details),
      ),
  );
  if (!inWindow.length) {
    if (
      requestedStart <= Date.parse(validEndUtc) &&
      requestedEnd >= Date.parse(validStartUtc)
    )
      return {
        status: "not-covered",
        reason:
          "The requested interval lies within the forecast horizon but between supplied time steps; no overlapping supported interval or instantaneous evidence was provided.",
      };
    return {
      status: "out-of-horizon",
      reason: `MET Norway forecast valid times span ${validStartUtc} through ${validEndUtc}; no forecast steps overlap the requested window.`,
    };
  }
  const stride = Math.max(1, Math.ceil(inWindow.length / 48));
  const selected = inWindow
    .filter((_, index) => index % stride === 0)
    .slice(0, 48);
  const seen = new Set<WeatherField>();
  const samples = selected
    .map(({ time, data }) => {
      const periods = periodsFor(data);
      const values: Record<
        string,
        {
          value: number;
          unit: string;
          periodStartUtc?: string;
          periodEndUtc?: string;
        }
      > = {};
      for (const [field, sourceKey] of fields) {
        const aggregated =
          field === "precipitationAmount" ||
          field === "precipitationProbability";
        const period = aggregated
          ? periods.find(
              ({ hours, details }) =>
                details?.[sourceKey] !== undefined && overlaps(time, hours),
            )
          : undefined;
        const value = aggregated
          ? period?.details?.[sourceKey]
          : instantInside(time)
            ? data.instant.details[sourceKey]
            : undefined;
        if (typeof value === "number" && Number.isFinite(value)) {
          seen.add(field);
          const providerUnit = document.meta.units?.[sourceKey];
          values[field] = {
            value,
            unit:
              providerUnit && providerUnit !== "˚C"
                ? providerUnit
                : defaultUnits[field],
            ...(period
              ? {
                  periodStartUtc: new Date(time).toISOString(),
                  periodEndUtc: new Date(
                    Date.parse(time) + period.hours * 3600000,
                  ).toISOString(),
                }
              : {}),
          };
        }
      }
      return { validAt: new Date(time).toISOString(), values };
    })
    .filter(({ values }) => Object.keys(values).length > 0);
  if (!samples.length)
    return {
      status: "unavailable",
      reason:
        "MET Norway returned no supported weather variables for the requested steps.",
    };
  const missingFields = fields
    .filter(([field]) => !seen.has(field))
    .map(([field]) => ({
      field,
      reason:
        "Not provided by this forecast product, region, or valid time; no value was inferred.",
    }));
  const issuedAt = new Date(document.meta.updated_at).toISOString();
  const checkedAt = new Date(metadata.checkedAt).toISOString();
  const stale =
    Date.parse(checkedAt) - Date.parse(issuedAt) > 24 * 60 * 60 * 1000;
  const forecast = weatherForecastSchema.parse({
    availability: {
      status: stale ? "stale" : missingFields.length ? "partial" : "available",
      reason: stale
        ? "The provider issue time is more than 24 hours old."
        : missingFields.length
          ? "Some weather fields are absent in this source response and remain unknown."
          : "Forecast data is available for requested valid times.",
    },
    source: {
      ...MET_NORWAY_SOURCE,
      issuedAt,
      validStartUtc,
      validEndUtc,
      vintage: "MET Locationforecast 2.0",
      ...(metadata.lastModified
        ? {
            product:
              "Locationforecast 2.0 complete; response cached by Last-Modified",
          }
        : {}),
    },
    forecastHorizonHours: Math.max(
      0,
      (Date.parse(validEndUtc) - Date.parse(issuedAt)) / 3600000,
    ),
    samples,
    missingFields,
  });
  assertStructuredResultSize(forecast);
  return {
    status: stale ? "stale" : missingFields.length ? "partial" : "available",
    reason: forecast.availability.reason,
    forecast,
  };
}
interface CacheEntry {
  payload: unknown;
  lastModified?: string;
  expiresAt: number;
}
interface CachedForecastValue {
  payload: unknown;
  lastModified?: string;
}
export interface MetForecastCache {
  get<T>(key: string): Promise<
    | {
        value: T;
        expiresAt: number;
      }
    | undefined
  >;
  set<T>(key: string, value: T, ttlMs: number): Promise<void>;
}
export interface MetRateLimiter {
  acquire(): Promise<void>;
}
const memoryCache = new Map<string, CacheEntry>();
export const MET_MEMORY_CACHE_MAX_ENTRIES = 128;
export function roundedMetCoordinates(
  place: Pick<WeatherPlace, "latitude" | "longitude">,
): {
  latitude: number;
  longitude: number;
} {
  return {
    latitude: Math.trunc(place.latitude * 10000) / 10000,
    longitude: Math.trunc(place.longitude * 10000) / 10000,
  };
}
function validateUserAgent(value: string): string {
  const userAgent = value.trim();
  if (
    !/^[\w .()+/@:-]{8,240}$/.test(userAgent) ||
    !/(https?:\/\/|[\w.+-]+@[\w.-]+)/i.test(userAgent)
  ) {
    throw new TypeError(
      "MET Norway requires an identifying User-Agent with a real website or contact email.",
    );
  }
  return userAgent;
}
export async function getMetNorwayForecast(
  place: WeatherPlace,
  window: {
    startUtc: string;
    endUtc: string;
    timeZone: string;
  },
  options: {
    userAgent: string;
    controls?: UpstreamControls;
    fetcher?: typeof fetch;
    now?: () => number;
    timeoutMs?: number;
    cache?: MetForecastCache;
    rateLimiter?: MetRateLimiter;
  },
): Promise<WeatherProviderResult> {
  const userAgent = validateUserAgent(options.userAgent);
  const now = options.now ?? Date.now;
  const checkedAt = new Date(now()).toISOString();
  const coords = roundedMetCoordinates(place);
  const url = new URL(BASE_URL);
  url.searchParams.set("lat", coords.latitude.toFixed(4));
  url.searchParams.set("lon", coords.longitude.toFixed(4));
  const cacheKey = url.toString();
  const readCache = async (): Promise<CacheEntry | undefined> => {
    if (!options.cache) {
      const entry = memoryCache.get(cacheKey);
      if (entry) {
        memoryCache.delete(cacheKey);
        memoryCache.set(cacheKey, entry);
      }
      return entry;
    }
    const entry = await options.cache.get<CachedForecastValue>(cacheKey);
    return entry ? { ...entry.value, expiresAt: entry.expiresAt } : undefined;
  };
  const writeCache = async (entry: CacheEntry): Promise<void> => {
    if (options.cache)
      await options.cache.set(
        cacheKey,
        { payload: entry.payload, lastModified: entry.lastModified },
        Math.max(0, entry.expiresAt - now()),
      );
    else {
      memoryCache.delete(cacheKey);
      memoryCache.set(cacheKey, entry);
      while (memoryCache.size > MET_MEMORY_CACHE_MAX_ENTRIES)
        memoryCache.delete(memoryCache.keys().next().value!);
    }
  };
  let cached = await readCache();
  if (cached && cached.expiresAt > now())
    return parseLocationForecast(cached.payload, place, window, {
      checkedAt,
      lastModified: cached.lastModified,
    });
  const headers = new Headers({
    "User-Agent": userAgent,
    Accept: "application/json",
  });
  if (cached?.lastModified)
    headers.set("If-Modified-Since", cached.lastModified);
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout>;
  const deadline = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new DOMException("Provider deadline exceeded", "AbortError"));
    }, options.timeoutMs ?? 8000);
  });
  const timeoutFallback = (): WeatherProviderResult => {
    const reason = "MET Norway request timed out.";
    if (cached) {
      const fallback = parseLocationForecast(cached.payload, place, window, {
        checkedAt,
        lastModified: cached.lastModified,
      });
      if (fallback.forecast) {
        fallback.status = "stale";
        fallback.reason = `${reason} Returning the cached forecast, which may be stale.`;
        fallback.forecast.availability = {
          status: "stale",
          reason: fallback.reason,
        };
        return fallback;
      }
    }
    return { status: "unavailable", reason };
  };
  try {
    let response: Response;
    try {
      response = await Promise.race([
        (options.controls ?? controlsFor(options.fetcher)).fetch(
          "met",
          upstreamRequestKey(
            cacheKey + "|" + userAgent + "|" + (cached?.lastModified ?? ""),
            options.fetcher,
            options.cache,
            options.rateLimiter,
          ),
          async () => {
            if (options.rateLimiter) await options.rateLimiter.acquire();
            controller.signal.throwIfAborted();
            return (options.fetcher ?? fetch)(url, {
              headers,
              signal: controller.signal,
            });
          },
          controller.signal,
        ),
        deadline,
      ]);
    } catch (error) {
      const reason =
        error instanceof DOMException && error.name === "AbortError"
          ? "MET Norway request timed out."
          : "MET Norway request failed; no forecast is available.";
      if (cached) {
        const fallback = parseLocationForecast(cached.payload, place, window, {
          checkedAt,
          lastModified: cached.lastModified,
        });
        if (fallback.forecast) {
          fallback.status = "stale";
          fallback.reason = `${reason} Returning the cached forecast, which may be stale.`;
          fallback.forecast.availability = {
            status: "stale",
            reason: fallback.reason,
          };
          return fallback;
        }
      }
      return { status: "unavailable", reason };
    }
    const expiresAt =
      Date.parse(response.headers.get("Expires") ?? "") || now() + 5 * 60000;
    const lastModified =
      response.headers.get("Last-Modified") ?? cached?.lastModified;
    if (response.status === 304 && cached) {
      cached.expiresAt = expiresAt;
      cached.lastModified = lastModified;
      await writeCache(cached);
      return parseLocationForecast(cached.payload, place, window, {
        checkedAt,
        lastModified,
      });
    }
    if (!response.ok && response.status !== 203) {
      if (cached) {
        const fallback = parseLocationForecast(cached.payload, place, window, {
          checkedAt,
          lastModified: cached.lastModified,
        });
        if (fallback.forecast) {
          fallback.status = "stale";
          fallback.reason =
            response.status === 429
              ? "MET Norway throttled the request. Returning the cached forecast, which may be stale."
              : `MET Norway returned HTTP ${response.status}. Returning the cached forecast, which may be stale.`;
          fallback.forecast.availability = {
            status: "stale",
            reason: fallback.reason,
          };
          return fallback;
        }
      }
      return {
        status: "unavailable",
        reason:
          response.status === 429
            ? "MET Norway throttled the request; retry after the cache window."
            : `MET Norway returned HTTP ${response.status}; forecast is unavailable.`,
      };
    }
    let payload: unknown;
    try {
      payload = await Promise.race([response.json(), deadline]);
    } catch {
      if (controller.signal.aborted) return timeoutFallback();
      return {
        status: "unavailable",
        reason: "MET Norway returned a response that was not valid JSON.",
      };
    }
    const result = parseLocationForecast(payload, place, window, {
      checkedAt,
      lastModified,
    });
    await writeCache({ payload, lastModified, expiresAt });
    return {
      ...result,
      ...(response.status === 203
        ? {
            deprecationWarning:
              "MET Norway returned HTTP 203: this product version is deprecated and should be reviewed.",
          }
        : {}),
    };
  } finally {
    clearTimeout(timer!);
  }
}
export function createMetNorwayProvider(options: {
  userAgent: string;
  controls?: UpstreamControls;
  fetcher?: typeof fetch;
  cache?: MetForecastCache;
  rateLimiter?: MetRateLimiter;
}): WeatherProvider {
  return {
    getForecast: (place, window) =>
      getMetNorwayForecast(place, window, options),
  };
}
