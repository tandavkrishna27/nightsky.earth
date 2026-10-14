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
