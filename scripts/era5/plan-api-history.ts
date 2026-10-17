import { pathToFileURL } from "node:url";
import { planApiHistory } from "../../server/providers/climate/apiHistoryPlan";

/** Stdout-only offline plan. No transport, credentials or durable output path. */
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  if ((args.length !== 3 && args.length !== 5) || args.some(value => value.trim() === "") ||
      (args.length === 5 && args[3] !== "--range-days")) {
    throw Error("Usage: tsx scripts/era5/plan-api-history.ts <latitude> <longitude> <IANA-zone> [--range-days <1..1827>] (offline only)");
  }
  const plan = planApiHistory({ latitude: Number(args[0]), longitude: Number(args[1]) }, args[2],
    args.length === 5 ? { rangeDays: Number(args[4]) } : undefined);
  console.log(JSON.stringify(plan, null, 2));
}
