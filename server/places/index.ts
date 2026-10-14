import { ianaTimeZoneSchema, placeIdSchema } from "../../shared/nightsky/common";
import { loadGeoNamesPlaceIndex, type GeoNamesPlaceIndex } from "./geonames";

export * from "./geonames";

export interface PlaceTimeZoneResult {
  placeId: string;
  timeZone: string;
  indexVintage: string;
}

/** Resolve timezone from the selected named-place record; no raw coordinates are accepted. */
export async function resolvePlaceTimeZone(placeIdValue: string, index?: GeoNamesPlaceIndex): Promise<PlaceTimeZoneResult | undefined> {
  const placeId = placeIdSchema.parse(placeIdValue);
  if (!placeId.startsWith("place:v1:geonames:")) return undefined;
  const placeIndex = index ?? await loadGeoNamesPlaceIndex();
  if (!placeIndex) return undefined;
  const geonameId = Number(placeId.slice("place:v1:geonames:".length));
  const city = placeIndex.getById(geonameId);
  return city ? { placeId, timeZone: ianaTimeZoneSchema.parse(city.timeZone), indexVintage: placeIndex.vintageLabel } : undefined;
}
