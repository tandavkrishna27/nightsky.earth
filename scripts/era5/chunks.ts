import * as z from "zod4";
import { calendarDateSchema } from "../../shared/nightsky/climate";
import type { CloudSample } from "./aggregate";

const headerSchema = z.strictObject({
  type: z.literal("header"), schemaVersion: z.literal(1), sourceSha256: z.string().regex(/^[a-f0-9]{64}$/),
  sourceDoi: z.literal("10.24381/cds.adbb2d47"), dataClass: z.literal("reanalysis"), units: z.literal("fraction"),
  sourceUnits: z.enum(["1", "(0 - 1)", "0-1"]), timeUnits: z.string().min(1).max(150),
  calendar: z.enum(["standard", "gregorian", "proleptic_gregorian"]),
  experimentVersions: z.array(z.string().min(1).max(16)).min(1).max(10), member: z.literal(0), institution: z.string().max(200),
  gridSpacingDegrees: z.literal(0.25),
  cells: z.array(z.strictObject({ cellId: z.string().min(1).max(80), latitude: z.number().finite().min(-90).max(90), longitude: z.number().finite().min(-180).max(180) })).min(1).max(10),
  decoderVersions: z.strictObject({ netCDF4: z.string().min(1).max(40), numpy: z.string().min(1).max(40) }),
  rowCount: z.number().int().min(1).max(800),
});
const rowSchema = z.strictObject({ type: z.literal("sample"), atUtc: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:00:00Z$/), values: z.array(z.number().finite().min(0).max(1).nullable()).min(1).max(10) });

/** Only local builder input; not a runtime MCP artifact reader. */
export function parseDecodedChunk(text: string) {
  if (Buffer.byteLength(text) > 4 * 1024 * 1024) throw new RangeError("Decoded JSONL exceeds byte bound.");
  const lines = text.trimEnd().split("\n");
  if (lines.length < 2 || lines.length > 801) throw new RangeError("Invalid chunk row bound.");
  const header = headerSchema.parse(JSON.parse(lines[0]!));
  if (new Set(header.cells.map(cell => cell.cellId)).size !== header.cells.length || header.cells.some(cell => !Number.isInteger(cell.latitude * 4) || !Number.isInteger(cell.longitude * 4) || cell.cellId !== `era5:${cell.latitude}:${cell.longitude}`)) throw new RangeError("Invalid or duplicate grid mapping.");
  const rows = lines.slice(1).map(line => rowSchema.parse(JSON.parse(line)));
  if (rows.length !== header.rowCount) throw new RangeError("Incomplete decoded chunk.");
  let previous = -Infinity;
  for (const row of rows) {
    calendarDateSchema.parse(row.atUtc.slice(0, 10));
    const at = Date.parse(row.atUtc);
    if (!Number.isFinite(at) || new Date(at).toISOString().slice(0, 13) !== row.atUtc.slice(0, 13) || at <= previous || row.values.length !== header.cells.length) throw new RangeError("Duplicate, unsorted or invalid hourly chunk rows.");
    previous = at;
  }
  return { header, samplesForCell(cellId: string): Iterable<CloudSample> {
    const index = header.cells.findIndex(cell => cell.cellId === cellId);
    if (index < 0) throw new RangeError("Selected supplied cell absent from decoded chunk.");
    return (function* () { for (const row of rows) yield { atUtc: row.atUtc, cloudFraction: row.values[index]! }; })();
  } };
}
