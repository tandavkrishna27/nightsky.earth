import * as z from "zod4";
import { readFile } from "node:fs/promises";
import { gunzipSync } from "node:zlib";
import {
  hasCoordinatePair,
  ianaTimeZoneSchema,
  latitudeSchema,
  longitudeSchema,
  placeIdSchema,
  sourceRecordSchema,
} from "../../shared/nightsky/common";
import { resolvePlaceInputSchema, type PlaceRef, type ResolvePlaceInput, type ResolvePlaceResult } from "../../shared/nightsky/places";

export const geonamesCitySchema = z.strictObject({
  geonameId: z.number().int().positive(),
  name: z.string().trim().min(1).max(200),
  asciiName: z.string().trim().max(200),
  alternateNames: z.string().max(10_000),
  latitude: latitudeSchema,
  longitude: longitudeSchema,
  countryCode: z.string().regex(/^[A-Z]{2}$/),
  countryName: z.string().trim().min(1).max(120),
  featureClass: z.literal("P"),
  featureCode: z.string().trim().min(1).max(10),
  population: z.number().int().nonnegative(),
  timeZone: ianaTimeZoneSchema,
  modificationDate: z.string().date(),
});
export type GeoNamesCity = z.infer<typeof geonamesCitySchema>;
export type GeoNamesCityTuple = readonly [number, string, string, string, number, number, string, string, number, string];

function cityToTuple(city: GeoNamesCity): GeoNamesCityTuple {
  return [city.geonameId, city.name, city.asciiName, city.alternateNames, city.latitude, city.longitude, city.countryCode, city.countryName, city.population, city.timeZone];
}

function tupleToCity(row: GeoNamesCityTuple): GeoNamesCity {
  return { geonameId: row[0], name: row[1], asciiName: row[2], alternateNames: row[3], latitude: row[4], longitude: row[5], countryCode: row[6], countryName: row[7], population: row[8], timeZone: row[9], featureClass: "P", featureCode: "PPL", modificationDate: "1970-01-01" };
}

export const GEONAMES_SOURCE = sourceRecordSchema.parse({
  name: "GeoNames",
  url: "https://www.geonames.org/",
  attribution: "Geographical names from GeoNames, licensed under CC BY 4.0. Modified and indexed by NightSky.earth.",
  dataClass: "catalog",
  product: "GeoNames cities500 gazetteer",
  licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
  modified: true,
});

export class GeoNamesPlaceIndex {
  private readonly rows: GeoNamesCityTuple[];
  private readonly byId: Map<number, number>;
  private readonly vintage: string;
  private readonly supplementalIds: ReadonlySet<number>;

  constructor(rows: Iterable<GeoNamesCity | GeoNamesCityTuple>, vintage: string, supplementalIds: ReadonlySet<number> = new Set()) {
    this.rows = Array.from(rows, (row) => Array.isArray(row) ? row as unknown as GeoNamesCityTuple : cityToTuple(row as GeoNamesCity));
    this.byId = new Map(this.rows.map((row, index) => [row[0], index]));
    this.vintage = vintage;
    this.supplementalIds = supplementalIds;
  }

  get vintageLabel(): string { return this.vintage; }
  get size(): number { return this.rows.length; }
  getById(geonameId: number): GeoNamesCity | undefined {
    const index = this.byId.get(geonameId);
    return index === undefined ? undefined : tupleToCity(this.rows[index]!);
  }

  search(query: string, limit = 5): GeoNamesCity[] {
    const parts = query.split(",").map(normalizeName).filter(Boolean);
    const placePart = parts[0] ?? "";
    const countryPart = parts.slice(1).join(" ");
    if (!placePart) return [];
    return this.rows
      .filter((row) => {
        if (countryPart && !normalizeName(`${row[7]} ${row[6]}`).includes(countryPart)) return false;
        const names = [row[1], row[2], ...row[3].split(",")].map(normalizeName).filter(Boolean);
        return names.some((name) => name === placePart || (placePart.length >= 4 && name.startsWith(placePart)));
      })
      .sort((a, b) => b[8] - a[8] || a[0] - b[0])
      .slice(0, limit)
      .map(tupleToCity);
  }

  nearest(latitude: number, longitude: number, maximumDistanceKm = 100): { city: GeoNamesCity; distanceKm: number } | undefined {
    let closest: { city: GeoNamesCity; distanceKm: number } | undefined;
    for (const row of this.rows) {
      const distanceKm = haversineKm(latitude, longitude, row[4], row[5]);
      if (!closest || distanceKm < closest.distanceKm) closest = { city: tupleToCity(row), distanceKm };
    }
    return closest && closest.distanceKm <= maximumDistanceKm ? closest : undefined;
  }

  toPlaceRef(city: GeoNamesCity): PlaceRef {
    return {
      placeId: `place:v1:geonames:${city.geonameId}`,
      displayName: `${city.name}, ${city.countryName}`,
      timeZone: city.timeZone,
      indexVintage: this.vintage,
      sources: [this.supplementalIds.has(city.geonameId) ? { ...sourceForVintage(this.vintage), url: "https://download.geonames.org/export/dump/IN.zip", product: "GeoNames country IN reviewed supplement hanle-v1" } : sourceForVintage(this.vintage)],
    };
  }
}

export async function loadGeoNamesPlaceIndex(path = process.env.NIGHTSKY_GEONAMES_INDEX ?? ".data/geonames/cities500.json.gz"): Promise<GeoNamesPlaceIndex | undefined> {
  try {
    const compressed = await readFile(path);
    if (compressed.byteLength > 64 * 1024 * 1024) throw new RangeError("GeoNames index is larger than the 64 MiB compressed file limit.");
    const text = gunzipSync(compressed, { maxOutputLength: 256 * 1024 * 1024 }).toString("utf8");
    const parsed: unknown = JSON.parse(text);
    if (typeof parsed !== "object" || parsed === null || !Array.isArray((parsed as { cities?: unknown }).cities)) {
      throw new TypeError("GeoNames index archive is malformed.");
    }
    const metadata = z.strictObject({
      schemaVersion: z.literal(2),
      vintage: z.string().trim().min(1).max(100),
      sourceLastModified: z.string().max(100).optional(),
      sourceChecksum: z.string().regex(/^[a-f0-9]{64}$/).optional(),
      generatedAt: z.string().datetime({ offset: true }),
    }).parse({
      schemaVersion: (parsed as { schemaVersion?: unknown }).schemaVersion,
      vintage: (parsed as { vintage?: unknown }).vintage,
      sourceLastModified: (parsed as { sourceLastModified?: unknown }).sourceLastModified,
      sourceChecksum: (parsed as { sourceChecksum?: unknown }).sourceChecksum,
      generatedAt: (parsed as { generatedAt?: unknown }).generatedAt,
    });
    const cities = (parsed as { cities: unknown[] }).cities;
    if (!cities.length) throw new TypeError("GeoNames city index is empty.");
    for (let index = 0; index < cities.length; index += 1) {
      const row = cities[index];
      if (!Array.isArray(row) || row.length !== 10 || !Number.isSafeInteger(row[0]) || typeof row[1] !== "string" || typeof row[3] !== "string" || !Number.isFinite(row[4]) || !Number.isFinite(row[5]) || typeof row[9] !== "string") {
        throw new TypeError(`GeoNames index record ${index} is malformed.`);
      }
    }
    const supplements = z.array(z.strictObject({
      version: z.literal("hanle-v1"), sourceKey: z.literal("geonames-country-IN-hanle-v1"),
      url: z.literal("https://download.geonames.org/export/dump/IN.zip"), entry: z.literal("IN.txt"),
      geonameId: z.literal(1270426),
      rowChecksum: z.literal("aaa42b3448db57247c8ae71d03f5e818ef285cd162f9292ee6ae21e339b73ba2"),
      archiveChecksum: z.string().regex(/^[a-f0-9]{64}$/), sourceLastModified: z.string().max(100).optional(),
    })).max(1).parse((parsed as { supplementalSources?: unknown }).supplementalSources ?? []);
    if (metadata.vintage.endsWith("+hanle-v1") && supplements.length !== 1) throw new TypeError("Reviewed GeoNames supplement provenance is missing.");
    const supplementalIds = new Set<number>();
    for (const supplement of supplements) {
      const matching = cities.filter(row => Array.isArray(row) && row[0] === supplement.geonameId);
      const expected = [1270426,"Hanle","Hanle","Hanle",32.78943,78.9962,"IN","India",0,"Asia/Kolkata"];
      if (matching.length !== 1 || JSON.stringify(matching[0]) !== JSON.stringify(expected)) throw new TypeError("Reviewed GeoNames supplement record does not match provenance.");
      supplementalIds.add(supplement.geonameId);
    }
    return new GeoNamesPlaceIndex(cities as unknown as GeoNamesCityTuple[], metadata.vintage, supplementalIds);
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") return undefined;
    throw error;
  }
}

export interface HostLocationHint {
  latitude: number;
  longitude: number;
  label?: string;
}

export interface ResolvePlaceOptions {
  index?: GeoNamesPlaceIndex;
  /** Pass only documented, request-scoped host hints; this value is never returned or persisted. */
  hostLocationHint?: HostLocationHint;
  stalePlaceId?: string;
}

export function parseGeoNamesCityRow(line: string, countryNames: ReadonlyMap<string, string> = new Map()): GeoNamesCity {
  const columns = line.replace(/\r$/, "").split("\t");
  if (columns.length !== 19) throw new TypeError(`Expected 19 GeoNames columns, received ${columns.length}.`);
  const geonameId = Number(columns[0]);
  const latitude = Number(columns[4]);
  const longitude = Number(columns[5]);
  const population = Number(columns[14]);
  const countryCode = columns[8] ?? "";
  return geonamesCitySchema.parse({
    geonameId,
    name: columns[1],
    asciiName: columns[2] ?? "",
    alternateNames: columns[3] ?? "",
    latitude,
    longitude,
    featureClass: columns[6],
    featureCode: columns[7],
    countryCode,
    countryName: countryNames.get(countryCode) ?? countryCode,
    population: Number.isFinite(population) ? population : 0,
    timeZone: columns[17],
    modificationDate: columns[18],
  });
}

function sourceForVintage(vintage?: string) {
  return { ...GEONAMES_SOURCE, ...(vintage ? { vintage } : {}) };
}

export async function resolvePlace(inputValue: ResolvePlaceInput, options: ResolvePlaceOptions = {}): Promise<ResolvePlaceResult> {
  const input = resolvePlaceInputSchema.parse(inputValue);
  const sources = [sourceForVintage(options.index?.vintageLabel)];
  if (options.stalePlaceId && !placeIdSchema.safeParse(options.stalePlaceId).success) {
    throw new TypeError("The saved place ID is malformed; resolve the named place again.");
  }
  if (options.stalePlaceId && !options.index?.getById(Number(options.stalePlaceId.split(":").at(-1)))) {
    return {
      availability: { status: "stale", reason: "This saved place ID is no longer in the current index. Resolve the named place again." },
      sources, caveats: [], matches: [], selectionRequired: false,
    };
  }
  if (!options.index) {
    return {
      availability: { status: "unavailable", reason: "The local GeoNames place index is not installed yet." },
      sources, caveats: [], matches: [], selectionRequired: false,
    };
  }

  let matches: GeoNamesCity[] = [];
  let locationSource: ResolvePlaceResult["locationSource"] = "named-place";
  if (input.useApproximateHostLocation === true) {
    const hint = options.hostLocationHint;
    if (!hint) {
      return {
        availability: { status: "unavailable", reason: "host-location-unavailable" },
        sources, caveats: [], matches: [], selectionRequired: false,
      };
    }
    const parsedHint = z.strictObject({ latitude: latitudeSchema, longitude: longitudeSchema, label: z.string().max(160).optional() }).parse(hint);
    const nearest = options.index.nearest(parsedHint.latitude, parsedHint.longitude);
    if (!nearest) {
      return {
        availability: { status: "not-covered", reason: "No indexed named place was found within 100 km of the approximate area." },
        sources, caveats: [], matches: [], selectionRequired: false,
      };
    }
    matches = [nearest.city];
    locationSource = "host-approximate-location";
  } else if (input.placeQuery !== undefined) {
    if (hasCoordinatePair(input.placeQuery)) throw new TypeError("Enter a named place, not coordinates.");
    matches = options.index.search(input.placeQuery);
  }

  const refs = matches.map((city) => options.index!.toPlaceRef(city));
  return {
    availability: refs.length === 0
      ? { status: "not-covered", reason: "No matching place was found in the local GeoNames index. Try a nearby city or add a country name." }
      : refs.length > 1
        ? { status: "partial", reason: "More than one place matches. Choose the intended city before planning." }
        : { status: "available", reason: "A named place and its GeoNames time zone were resolved." },
    sources: refs.length ? Array.from(new Map(refs.flatMap(ref => ref.sources).map(source => [source.url, source])).values()) : sources,
    caveats: refs.length ? [
      "GeoNames is provided as-is. The assigned time zone follows the named city record and is not a polygon lookup for every coordinate in the municipality.",
      ...(locationSource === "host-approximate-location" ? ["The nearest indexed named area is a planning reference. Its time zone does not establish the approximate host hint's time zone or municipality; verify local civil time near a border."] : []),
    ] : [],
    matches: refs,
    selectionRequired: refs.length > 1,
    locationSource,
  };
}

export function resolvedCoordinatesForPlace(index: GeoNamesPlaceIndex, placeId: string): { latitude: number; longitude: number } | undefined {
  const parsed = placeIdSchema.safeParse(placeId);
  if (!parsed.success || !placeId.startsWith("place:v1:geonames:")) return undefined;
  const city = index.getById(Number(placeId.slice("place:v1:geonames:".length)));
  return city ? { latitude: city.latitude, longitude: city.longitude } : undefined;
}

function normalizeName(value: string): string {
  return value.normalize("NFKC").trim().toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ");
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const deltaLat = radians(lat2 - lat1);
  const deltaLon = radians(lon2 - lon1);
  const a = Math.sin(deltaLat / 2) ** 2 + Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(deltaLon / 2) ** 2;
  return 6371.0088 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
