import { pathToFileURL } from "node:url";
import { planOpenMeteoHistory, type HistoryPoint } from "../../server/providers/climate/openMeteoHistoryContract";

/** Offline manifest only; intentionally contains no transport or persistence capability. */
export function openMeteoHistoryManifest(point: HistoryPoint) {
  const partitions = planOpenMeteoHistory(point);
  return { mode:"dry-run-only", historicalAdmission:false, accounting:"unverified", liveExecution:"blocked",
    expectedPaddedHours:partitions.reduce((n,p)=>n+p.expectedHours,0), partitionCount:partitions.length,
    startInclusive:"1990-12-30T00:00:00Z", endExclusive:"2021-01-03T00:00:00Z",
    scientificRevision:"unverified", partitions };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.length !== 4 || process.argv.slice(2).some(v=>v.trim()==="")) throw Error("Usage: tsx scripts/era5/plan-open-meteo-history.ts <latitude> <longitude> (offline only)");
  console.log(JSON.stringify(openMeteoHistoryManifest({latitude:Number(process.argv[2]),longitude:Number(process.argv[3])}),null,2));
}
