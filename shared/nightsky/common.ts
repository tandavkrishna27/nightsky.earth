import * as z from "zod4";

export const MAX_QUERY_RANGE_DAYS = 366;
// Full five-option evidence is bounded without silently discarding source attribution.
export const MAX_STRUCTURED_RESULT_BYTES = 4 * 1024 * 1024;
export const MAX_RESULT_SOURCES = 64;
export const MAX_RESULT_CAVEATS = 20;
export const MAX_COMPARISON_OPTIONS = 5;
export const MAX_PLAN_CANDIDATE_WINDOWS = 8;
export const MAX_OBSERVING_LOCATION_CANDIDATES = 10;
export const MAX_EVENT_RESULTS = 25;
export const MAX_WEATHER_SAMPLES_PER_SOURCE = 48;

export const dataClassSchema = z.enum([
  "forecast",
  "observation",
  "calculation",
  "reanalysis",
  "catalog",
  "context",
]);
export type DataClass = z.infer<typeof dataClassSchema>;

export const availabilityStatusSchema = z.enum([
  "available",
  "partial",
  "stale",
  "unavailable",
  "not-covered",
  "unknown",
  "unsupported",
  "out-of-horizon",
]);
export type AvailabilityStatus = z.infer<typeof availabilityStatusSchema>;

export const availabilitySchema = z.strictObject({
  status: availabilityStatusSchema,
  reason: z.string().trim().min(1).max(500),
});
export type Availability = z.infer<typeof availabilitySchema>;

export const utcInstantSchema = z.string().datetime({ offset: false }).refine(
  (value) => value.endsWith("Z") && Number.isFinite(Date.parse(value)),
  "Expected a UTC ISO-8601 instant ending in Z.",
);

export function isIanaTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export const ianaTimeZoneSchema = z.string().min(1).max(64).refine(
  isIanaTimeZone,
  "Expected a valid IANA time-zone identifier.",
);

export const timeWindowSchema = z.strictObject({
  startUtc: utcInstantSchema,
  endUtc: utcInstantSchema,
  timeZone: ianaTimeZoneSchema,
}).superRefine((window, ctx) => {
  const durationMs = Date.parse(window.endUtc) - Date.parse(window.startUtc);
  if (durationMs <= 0) {
    ctx.addIssue({ code: "custom", path: ["endUtc"], message: "End must be after start." });
  } else if (durationMs > MAX_QUERY_RANGE_DAYS * 24 * 60 * 60 * 1000) {
    ctx.addIssue({ code: "custom", path: ["endUtc"], message: `Window may not exceed ${MAX_QUERY_RANGE_DAYS} days.` });
  }
});
export type TimeWindow = z.infer<typeof timeWindowSchema>;

export const sourceRecordSchema = z.strictObject({
  name: z.string().trim().min(1).max(120),
  url: z.url().max(2048),
  attribution: z.string().trim().min(1).max(500),
  dataClass: dataClassSchema,
  product: z.string().trim().min(1).max(160).optional(),
  model: z.string().trim().min(1).max(160).optional(),
  issuedAt: utcInstantSchema.optional(),
  validStartUtc: utcInstantSchema.optional(),
  validEndUtc: utcInstantSchema.optional(),
  vintage: z.string().trim().min(1).max(100).optional(),
  licenseUrl: z.url().max(2048).optional(),
  modified: z.boolean().optional(),
});
export type SourceRecord = z.infer<typeof sourceRecordSchema>;

export const resultMetadataShape = {
  sourceAttempts:z.array(z.strictObject({providerId:z.enum(["geonames","geoapify"]),status:z.enum(["not-configured","quota-exhausted","timeout","unavailable","invalid-response","unsupported-query","no-results","success","partial"])})).max(5).optional(),
  availability: availabilitySchema,
  sources: z.array(sourceRecordSchema).min(1).max(MAX_RESULT_SOURCES),
  caveats: z.array(z.string().trim().min(1).max(500)).max(MAX_RESULT_CAVEATS).default([]),
};

export function resultSchema<T extends z.ZodRawShape>(shape: T) {
  return z.strictObject({ ...resultMetadataShape, ...shape });
}

export function assertStructuredResultSize(value: unknown): void {
  const bytes = new TextEncoder().encode(JSON.stringify(value)).byteLength;
  if (bytes > MAX_STRUCTURED_RESULT_BYTES) {
    throw new RangeError(`Structured result is ${bytes} bytes; maximum is ${MAX_STRUCTURED_RESULT_BYTES} bytes.`);
  }
}

export const placeIdSchema = z.string().regex(
  /^place:v1:[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$/,
  "Expected a versioned NightSky place ID.",
).refine(value=>!value.startsWith("place:v1:api:")||/^place:v1:api:(?:geonames|geoapify):[a-f0-9]{64}$/.test(value),"Expected an admitted API provider and hashed upstream identity.");

export const latitudeSchema = z.number().finite().min(-90).max(90);
export const longitudeSchema = z.number().finite().min(-180).max(180);

export const activitySchema = z.enum([
  "general-stargazing",
  "visual-stargazing",
  "meteor-shower",
  "astrophotography",
  "deep-sky-imaging",
  "planet-observing",
  "moon-observing",
  "aurora",
  "eclipse",
  "learning",
]);
export type Activity = z.infer<typeof activitySchema>;

export const localeSchema = z.string().min(2).max(35).refine((locale) => {
  try {
    Intl.getCanonicalLocales(locale);
    return true;
  } catch {
    return false;
  }
}, "Expected a valid BCP 47 locale.");

export const unitPreferenceSchema = z.enum(["metric", "imperial"]);

export function hasCoordinatePair(text: string): boolean {
  const labeledCoordinates = /\b(?:lat(?:itude)?|lon(?:gitude)?|lng)\s*[:=]/i.test(text);
  const numericPair = /(?:^|[\s(])[-+]?\d{1,2}(?:\.\d+)?\s*°?\s*[,;/]\s*[-+]?\d{1,3}(?:\.\d+)?/i.test(text);
  const directionalPair = /(?:^|[\s(])\d{1,2}(?:\.\d+)?\s*°?\s*[NS]\s*[,;/ ]+\s*\d{1,3}(?:\.\d+)?\s*°?\s*[EW](?:$|[\s),])/i.test(text);
  return labeledCoordinates || numericPair || directionalPair;
}

export function resolveLocalDateTimeToUtc(localDate: string, hour: number, minute: number, timeZone: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(localDate) || !isIanaTimeZone(timeZone)) {
    throw new RangeError("A valid local calendar date and IANA time zone are required.");
  }
  const [year, month, day] = localDate.split("-").map(Number);
  const localEpoch = Date.UTC(year!, month! - 1, day!, hour, minute, 0, 0);
  const checkDate = new Date(localEpoch);
  if (checkDate.getUTCFullYear() !== year || checkDate.getUTCMonth() + 1 !== month || checkDate.getUTCDate() !== day) {
    throw new RangeError("The local calendar date is invalid.");
  }

  let candidate = localEpoch;
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const parts = Object.fromEntries(formatter.formatToParts(new Date(candidate)).map(({ type, value }) => [type, value]));
    const representedLocalEpoch = Date.UTC(
      Number(parts.year), Number(parts.month) - 1, Number(parts.day),
      Number(parts.hour), Number(parts.minute), Number(parts.second), 0,
    );
    const correction = localEpoch - representedLocalEpoch;
    if (correction === 0) return new Date(candidate).toISOString();
    candidate += correction;
  }
  throw new RangeError("That local time does not resolve uniquely in the requested time zone.");
}

export function nextCalendarDate(localDate: string): string {
  const [year, month, day] = localDate.split("-").map(Number);
  const next = new Date(Date.UTC(year!, month! - 1, day! + 1));
  return `${next.getUTCFullYear().toString().padStart(4, "0")}-${(next.getUTCMonth() + 1).toString().padStart(2, "0")}-${next.getUTCDate().toString().padStart(2, "0")}`;
}

export function resolveTonightWindow(input: { localDate: string; timeZone: string }): TimeWindow {
  const startUtc = resolveLocalDateTimeToUtc(input.localDate, 18, 0, input.timeZone);
  const endUtc = resolveLocalDateTimeToUtc(nextCalendarDate(input.localDate), 6, 0, input.timeZone);
  return timeWindowSchema.parse({ startUtc, endUtc, timeZone: input.timeZone });
}

export const sourceRevisionSchema = z.string().regex(/^[a-f0-9]{64}$/, "Expected a source snapshot SHA-256.");
export const timeZoneEvidenceSchema = z.discriminatedUnion("status", [z.strictObject({status:z.literal("verified"),timeZone:ianaTimeZoneSchema,source:sourceRecordSchema}),z.strictObject({status:z.literal("unknown")})]);
export const apiSelectionRefSchema = z.strictObject({placeId:placeIdSchema.refine(value=>value.startsWith("place:v1:api:")),sourceRevision:sourceRevisionSchema});
export type ApiSelectionRef = z.infer<typeof apiSelectionRefSchema>;

/** Public revision kinds are mutually exclusive; API IDs always require their snapshot. */
export function selectionRevisionRefinement(input:{placeId?:string;sourceRevision?:string;catalogueRevision?:string},ctx:z.RefinementCtx):void {
 if(input.sourceRevision&&input.catalogueRevision)ctx.addIssue({code:"custom",message:"Catalogue and API source revisions cannot be combined."});
 if(input.placeId?.startsWith("place:v1:api:")&&!input.sourceRevision)ctx.addIssue({code:"custom",path:["sourceRevision"],message:"API selections require the returned sourceRevision. Resolve again."});
 if(input.sourceRevision&&input.placeId&&!input.placeId.startsWith("place:v1:api:"))ctx.addIssue({code:"custom",path:["sourceRevision"],message:"A source revision belongs only to an API selection."});
}
