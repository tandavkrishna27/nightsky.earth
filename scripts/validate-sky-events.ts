import { auditMajorEventCoverage } from "../shared/skyEventCoverage";
import { skyEvents, coverageMonths } from "../shared/skyEventCatalog";
import { validateSkyEvents, validateCoverage } from "../shared/skyEvents";
const records = validateSkyEvents(skyEvents);
const now = new Date();
for (const e of records)
  if (e.lastReviewedAt > now.toISOString().slice(0, 10))
    throw Error("Future review " + e.id);
const gaps = validateCoverage(coverageMonths, now);
console.log(
  records.length +
    " validated occurrences; coverage " +
    coverageMonths[0]?.month +
    " through " +
    coverageMonths.at(-1)?.month,
);
if (gaps.length) throw Error("Unreviewed months: " + gaps.join(", "));

const missingMajor = auditMajorEventCoverage(records);
if (missingMajor.length)
  throw Error("Missing major-event coverage: " + missingMajor.join(", "));
