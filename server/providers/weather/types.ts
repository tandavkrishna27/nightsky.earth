import type { WeatherForecast } from "../../../shared/nightsky/weather";

export type WeatherProviderStatus = "available" | "partial" | "stale" | "unavailable" | "not-covered" | "out-of-horizon";
export interface WeatherProviderResult {
  status: WeatherProviderStatus;
  reason: string;
  forecast?: WeatherForecast;
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
