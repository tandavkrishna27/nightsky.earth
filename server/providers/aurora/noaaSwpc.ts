import {
  controlsFor,
  upstreamRequestKey,
  type UpstreamControls,
} from "../upstreamControls";
import * as z from "zod4";
import {
  auroraOutlookResultSchema,
  type AuroraOutlookResult,
} from "../../../shared/nightsky/weather";
import {
  sourceRecordSchema,
  timeWindowSchema,
} from "../../../shared/nightsky/common";
import type { WeatherPlace } from "../weather/types";
const ENDPOINT =
  "https://services.swpc.noaa.gov/json/ovation_aurora_latest.json";
const PRODUCT_URL =
  "https://www.swpc.noaa.gov/products/aurora-30-minute-forecast";
const AURORA_CACHE_KEY = "nightsky:noaa-swpc:ovation-latest:v1";
const auroraMemoryCache = new Map<
  string,
  {
    payload: unknown;
    expiresAt: number;
  }
>();
const payloadSchema = z
  .object({
    "Observation Time": z.string().datetime({ offset: true }),
    "Forecast Time": z.string().datetime({ offset: true }),
    "Data Format": z.literal("[Longitude, Latitude, Aurora]"),
    type: z.literal("MultiPoint"),
    coordinates: z.array(
      z.tuple([
        z.number().finite(),
        z.number().finite().min(-90).max(90),
        z.number().finite().min(0).max(100),
      ]),
    ),
  })
  .passthrough();
export const NOAA_OVATION_SOURCE = sourceRecordSchema.parse({
  name: "NOAA Space Weather Prediction Center",
  url: PRODUCT_URL,
  attribution:
    "Operational forecast data from NOAA/NWS SWPC; NightSky normalizes the grid and selects a nearby cell. This derived result is not an official NOAA forecast or endorsement.",
  dataClass: "forecast",
  product: "OVATION aurora 30-minute forecast",
  licenseUrl: "https://www.weather.gov/disclaimer",
  modified: true,
});
function longitudeDifference(a: number, b: number): number {
  const diff = Math.abs(((((a - b) % 360) + 540) % 360) - 180);
  return Math.min(diff, Math.abs(diff - 360));
}
function nearestGridPoint(
  coordinates: Array<[number, number, number]>,
  latitude: number,
  longitude: number,
) {
  let selected:
    | {
        longitude: number;
        latitude: number;
        value: number;
        distance: number;
      }
    | undefined;
  for (const [gridLongitude, gridLatitude, value] of coordinates) {
    const lonGap =
      longitudeDifference(gridLongitude, longitude) *
      Math.cos((latitude * Math.PI) / 180);
    const latGap = gridLatitude - latitude;
    const distance = latGap * latGap + lonGap * lonGap;
    if (!selected || distance < selected.distance) {
      const normalizedLongitude =
        gridLongitude > 180 ? gridLongitude - 360 : gridLongitude;
      selected = {
        longitude: normalizedLongitude,
        latitude: gridLatitude,
        value,
        distance,
      };
    }
  }
  return selected;
}
function latitudeBand(latitude: number): AuroraOutlookResult["latitudeBand"] {
  const absoluteLatitude = Math.abs(latitude);
  if (absoluteLatitude >= 66) return "polar";
  if (absoluteLatitude >= 55) return "high-latitude";
  if (absoluteLatitude >= 30) return "mid-latitude";
  return "equatorial";
}
function unavailableResult(
  place: WeatherPlace,
  window: {
    startUtc: string;
    endUtc: string;
    timeZone: string;
  },
  reason: string,
  status:
    | "unavailable"
    | "unknown"
    | "out-of-horizon"
    | "not-covered" = "unavailable",
): AuroraOutlookResult {
  return auroraOutlookResultSchema.parse({
    availability: { status, reason },
    placeId: place.placeId,
    window,
    sources: [NOAA_OVATION_SOURCE],
    caveats: [
      "NOAA OVATION is a short-horizon model forecast; it is not a guarantee that aurora will be visible from this place.",
    ],
    outlook: { status, reason },
    latitudeBand: latitudeBand(place.latitude),
  });
}
export function parseOvationAurora(
  payload: unknown,
  place: WeatherPlace,
  requestedWindow: {
    startUtc: string;
    endUtc: string;
    timeZone: string;
  },
  nowUtc: string,
): AuroraOutlookResult {
  const window = timeWindowSchema.parse(requestedWindow);
  const parsed = payloadSchema.safeParse(payload);
  if (!parsed.success)
    throw new TypeError("Malformed NOAA SWPC OVATION response.");
  const observationTime = new Date(
    parsed.data["Observation Time"],
  ).toISOString();
  const forecastTime = new Date(parsed.data["Forecast Time"]).toISOString();
  const observedAt = Date.parse(observationTime);
  const forecastAt = Date.parse(forecastTime);
  const requestedStart = Date.parse(window.startUtc);
  const requestedEnd = Date.parse(window.endUtc);
  const horizonEnd = forecastAt + 90 * 60000;
  if (requestedStart > horizonEnd || requestedEnd < observedAt) {
    return unavailableResult(
      place,
      window,
      `NOAA OVATION forecast is valid near ${forecastTime}; the requested interval does not overlap its short 30–90 minute forecast horizon.`,
      "out-of-horizon",
    );
  }
  const point = nearestGridPoint(
    parsed.data.coordinates,
    place.latitude,
    place.longitude,
  );
  if (!point)
    return unavailableResult(
      place,
      window,
      "The NOAA OVATION response contained no usable grid cells.",
      "not-covered",
    );
  const ageMs = Date.parse(nowUtc) - observedAt;
  const stale = ageMs > 2 * 60 * 60000 || ageMs < -10 * 60000;
  const source = sourceRecordSchema.parse({
    ...NOAA_OVATION_SOURCE,
    issuedAt: observationTime,
    validStartUtc: forecastTime,
    vintage: "OVATION latest grid; nearest 1-degree cell",
  });
  const summary = `NOAA OVATION model index ${point.value} of 100 for the nearest grid cell (${point.latitude.toFixed(0)}°, ${point.longitude.toFixed(0)}°), forecast for ${forecastTime}. This is a location/intensity model index, not a personal sighting probability. A low or zero value does not prove aurora is impossible at this latitude. The outlook covers only the next 30–90 minutes.`;
  const status = stale
    ? "stale"
    : requestedEnd > horizonEnd
      ? "partial"
      : "available";
  const reason = stale
    ? "The NOAA OVATION observation time is more than two hours old or unexpectedly in the future."
    : status === "partial"
      ? "A current short-horizon forecast is available, but it does not cover the entire requested interval."
      : "A short-horizon NOAA OVATION forecast overlaps the requested interval.";
  return auroraOutlookResultSchema.parse({
    availability: { status, reason },
    placeId: place.placeId,
    window,
    sources: [source],
    caveats: [
      "The model grid is coarse; the nearest grid cell is an approximation for this named place.",
      "Latitude band is a coarse geographic label, not geomagnetic latitude. Aurora visibility also depends on darkness, clouds, local light, horizon and human vision; this tool does not calculate a personal sighting probability.",
      "NOAA reports solar-wind inputs can be unavailable; in that case an alternate Kp-driven estimate may have no forecast lead time.",
    ],
    outlook: {
      status: "available",
      gridValue: point.value,
      gridValueUnit: "OVATION model index (0–100)",
      gridCellLatitude: point.latitude,
      gridCellLongitude: point.longitude,
      summary,
      source,
    },
    latitudeBand: latitudeBand(place.latitude),
  });
}
export async function getNoaaAuroraOutlook(
  place: WeatherPlace,
  window: {
    startUtc: string;
    endUtc: string;
    timeZone: string;
  },
  options: {
    controls?: UpstreamControls;
    fetcher?: typeof fetch;
    now?: () => number;
    timeoutMs?: number;
    cache?: {
      get<T>(key: string): Promise<
        | {
            value: T;
            expiresAt: number;
          }
        | undefined
      >;
      set<T>(key: string, value: T, ttlMs: number): Promise<void>;
    };
  } = {},
): Promise<AuroraOutlookResult> {
  const checkedAt = new Date((options.now ?? Date.now)()).toISOString();
  const now = (options.now ?? Date.now)();
  const cached = options.cache
    ? await options.cache.get<unknown>(AURORA_CACHE_KEY)
    : auroraMemoryCache.has(AURORA_CACHE_KEY)
      ? {
          value: auroraMemoryCache.get(AURORA_CACHE_KEY)!.payload,
          expiresAt: auroraMemoryCache.get(AURORA_CACHE_KEY)!.expiresAt,
        }
      : undefined;
  if (cached && cached.expiresAt > now)
    return parseOvationAurora(cached.value, place, window, checkedAt);
  const staleFallback = (reason: string): AuroraOutlookResult => {
    if (cached) {
      const result = parseOvationAurora(cached.value, place, window, checkedAt);
      if (result.outlook.status === "available") {
        result.availability = {
          status: "stale",
          reason: `${reason} Returning cached forecast data, which may be stale.`,
        };
        return result;
      }
    }
    return unavailableResult(place, window, reason);
  };
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout>;
  const deadline = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new DOMException("Provider deadline exceeded", "AbortError"));
    }, options.timeoutMs ?? 8000);
  });
  try {
    let response: Response;
    try {
      response = await Promise.race([
        (options.controls ?? controlsFor(options.fetcher)).fetch(
          "noaa",
          upstreamRequestKey(AURORA_CACHE_KEY, options.fetcher, options.cache),
          () =>
            (options.fetcher ?? fetch)(ENDPOINT, {
              headers: { Accept: "application/json" },
              signal: controller.signal,
            }),
          controller.signal,
        ),
        deadline,
      ]);
    } catch (error) {
      const reason =
        error instanceof DOMException && error.name === "AbortError"
          ? "NOAA SWPC aurora request timed out."
          : "NOAA SWPC aurora service is unavailable.";
      return staleFallback(reason);
    }
    if (!response.ok)
      return staleFallback(
        `NOAA SWPC returned HTTP ${response.status}; the aurora outlook is unavailable.`,
      );
    let payload: unknown;
    try {
      payload = await Promise.race([response.json(), deadline]);
    } catch {
      return staleFallback(
        controller.signal.aborted
          ? "NOAA SWPC aurora request timed out."
          : "NOAA SWPC returned a response that was not valid JSON.",
      );
    }
    const result = parseOvationAurora(payload, place, window, checkedAt);
    const responseExpiry = Date.parse(response.headers.get("Expires") ?? "");
    const cacheUntil = Math.min(
      responseExpiry || now + 2 * 60000,
      now + 5 * 60000,
    );
    const ttlMs = Math.max(0, cacheUntil - now);
    if (options.cache)
      await options.cache.set(AURORA_CACHE_KEY, payload, ttlMs);
    else
      auroraMemoryCache.set(AURORA_CACHE_KEY, {
        payload,
        expiresAt: cacheUntil,
      });
    return result;
  } finally {
    clearTimeout(timer!);
  }
}
