import * as z from "zod4";
import { sourceRecordSchema } from "../../shared/nightsky/common";

export const OSM_SOURCE = sourceRecordSchema.parse({
  name: "OpenStreetMap contributors",
  url: "https://www.openstreetmap.org/copyright",
  attribution: "© OpenStreetMap contributors. Data available under the Open Database License (ODbL).",
  dataClass: "catalog",
  product: "OpenStreetMap candidate place features",
  licenseUrl: "https://opendatacommons.org/licenses/odbl/1-0/",
});

export const osmCandidateSchema = z.strictObject({
  osmType: z.enum(["node", "way", "relation"]),
  osmId: z.number().int().positive(),
  name: z.string().trim().min(1).max(160),
  category: z.enum(["park", "viewpoint", "protected-area", "campground", "beach", "other"]),
  latitude: z.number().finite().min(-90).max(90),
  longitude: z.number().finite().min(-180).max(180),
  sourceCompleteness: z.number().int().min(0).max(3),
});
export type OSMCandidateRecord = z.infer<typeof osmCandidateSchema>;

export const osmCandidateIndexSchema = z.strictObject({
  schemaVersion: z.literal(1),
  vintage: z.string().trim().min(1).max(100),
  coverage: z.string().trim().min(1).max(300),
  source: sourceRecordSchema,
  candidates: z.array(osmCandidateSchema),
});
export type OSMCandidateIndexData = z.infer<typeof osmCandidateIndexSchema>;

type OsmElement = {
  type?: unknown;
  id?: unknown;
  lat?: unknown;
  lon?: unknown;
  center?: { lat?: unknown; lon?: unknown };
  tags?: Record<string, unknown>;
};

function textField(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.normalize("NFKC").replace(/[\u0000-\u001f\u007f-\u009f]/g, " ").replace(/\s+/g, " ").trim();
  if (!normalized) return undefined;
  let capped = "";
  for (const character of normalized) {
    if (capped.length + character.length > 160) break;
    capped += character;
  }
  return capped;
}

function categoryFor(tags: Record<string, unknown>): OSMCandidateRecord["category"] | undefined {
  if (tags.leisure === "park") return "park";
  if (tags.tourism === "viewpoint") return "viewpoint";
  if (tags.boundary === "national_park" || tags.leisure === "nature_reserve" || tags.protect_class !== undefined) return "protected-area";
  if (tags.tourism === "camp_site" || tags.tourism === "caravan_site") return "campground";
  if (tags.natural === "beach") return "beach";
  return undefined;
}

function toCandidate(element: OsmElement): OSMCandidateRecord | undefined {
  if ((element.type !== "node" && element.type !== "way" && element.type !== "relation") || !Number.isSafeInteger(element.id) || Number(element.id) <= 0) return undefined;
  if (!element.tags || typeof element.tags !== "object" || Array.isArray(element.tags)) return undefined;
  const category = categoryFor(element.tags);
  if (!category) return undefined;
  const name = textField(element.tags.name) ?? textField(element.tags["name:en"]) ?? textField(element.tags["official_name"]);
  if (!name) return undefined;
  const latitude = element.type === "node" ? element.lat : element.center?.lat;
  const longitude = element.type === "node" ? element.lon : element.center?.lon;
  if (typeof latitude !== "number" || typeof longitude !== "number") return undefined;
  const sourceCompleteness = Math.min(3, 1 + ["access", "opening_hours", "website"].filter((key) => textField(element.tags![key]) !== undefined).length);
  return osmCandidateSchema.parse({
    osmType: element.type,
    osmId: Number(element.id),
    name,
    category,
    latitude,
    longitude,
    sourceCompleteness,
  });
}

export function importOsmJson(payload: unknown, options: { vintage: string; coverage: string }): OSMCandidateIndexData {
  const input = z.strictObject({ elements: z.array(z.unknown()).max(5_000_000) }).parse(payload);
  const vintage = z.string().trim().min(1).max(100).parse(options.vintage);
  const coverage = z.string().trim().min(1).max(300).parse(options.coverage);
  const byId = new Map<string, OSMCandidateRecord>();
  for (const raw of input.elements) {
    if (typeof raw !== "object" || raw === null || Array.isArray(raw)) continue;
    const candidate = toCandidate(raw as OsmElement);
    if (candidate) byId.set(`${candidate.osmType}/${candidate.osmId}`, candidate);
  }
  const candidates = Array.from(byId.values()).sort((a, b) => a.osmType.localeCompare(b.osmType) || a.osmId - b.osmId);
  return osmCandidateIndexSchema.parse({ schemaVersion: 1, vintage, coverage, source: { ...OSM_SOURCE, vintage }, candidates });
}
