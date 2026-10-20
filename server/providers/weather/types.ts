import type { SourceRecord } from "../../../shared/nightsky/common";
import type { WeatherForecast } from "../../../shared/nightsky/weather";

export type WeatherProviderStatus = "available" | "partial" | "stale" | "unavailable" | "not-covered" | "out-of-horizon";
export interface WeatherProviderResult {
  status: WeatherProviderStatus;
  reason: string;
  forecast?: WeatherForecast;
  /** Optional provider identity for empty results; forecast.source is authoritative when a forecast exists. Validated at the MCP boundary. */
  source?: SourceRecord;
  deprecationWarning?: string;
}

export interface WeatherPlace {
  placeId: string;
  latitude: number;
  longitude: number;
}

export interface WeatherProvider {
  getForecast(place: WeatherPlace, window: { startUtc: string; endUtc: string; timeZone: string }): Promise<WeatherProviderResult>;
}

export type WeatherProviderId = "met" | "weatherapi" | "openweather" | "seventimer";
export interface WeatherProviderEntry {
  id: WeatherProviderId;
  provider: WeatherProvider;
  enabled: boolean;
}
export interface WeatherCollection {
  outcomes: Array<{ providerId: WeatherProviderId; result: WeatherProviderResult }>;
}
export interface WeatherCollectionService {
  getForecasts(place: WeatherPlace, window: { startUtc: string; endUtc: string; timeZone: string }, selection?: { mode: "single" | "compare" | "all"; excludedProviderIds?: WeatherProviderId[] }): Promise<WeatherCollection>;
}
export interface WeatherAdapterOptions {
  apiKey: string;
  fetcher: typeof fetch;
  now: () => number;
  controls: import("../upstreamControls").UpstreamControls;
  quota: import("../quotaTypes").ProviderQuota;
}
