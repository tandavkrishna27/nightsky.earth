import { test } from "node:test";
import assert from "node:assert/strict";
import {
  upcomingMeteors,
  type ReviewedMeteor,
} from "../../shared/meteorContent";
const entry = (start: string, end: string): ReviewedMeteor => ({
  id: "test",
  name: "Test",
  overview: "Synthetic",
  sources: ["https://example.org"],
  reviewedAt: "2026-10-16",
  peak: {
    startDate: start,
    endDate: end,
    basis: "UTC-catalogue-date",
    year: 2026,
  },
});
test("meteor dates use inclusive UTC catalogue days and reject invalid intervals", () => {
  const records = [entry("2026-12-30", "2026-12-31")];
  assert.equal(
    upcomingMeteors(records, new Date("2026-12-31T23:59:59Z")).length,
    1,
  );
  assert.equal(
    upcomingMeteors(records, new Date("2027-01-01T00:00:00Z")).length,
    0,
  );
  assert.equal(
    upcomingMeteors(
      [entry("2026-02-30", "2026-03-01"), entry("2026-04-02", "2026-04-01")],
      new Date("2026-01-01Z"),
    ).length,
    0,
  );
  assert.equal(
    upcomingMeteors(
      [{ ...records[0], peak: undefined }],
      new Date("2026-01-01Z"),
    ).length,
    0,
  );
});

test("catalogue behavior is independent of machine timezone", async () => {
  const { spawnSync } = await import("node:child_process");
  for (const zone of ["Pacific/Honolulu", "Asia/Kolkata"]) {
    const result = spawnSync(
      process.execPath,
      [
        "--import",
        "tsx",
        "--input-type=module",
        "-e",
        `import {upcomingMeteors} from './shared/meteorContent.ts';const x={id:'x',name:'X',overview:'Synthetic',reviewedAt:'2026-10-16',sources:['https://example.org'],peak:{startDate:'2026-12-30',endDate:'2026-12-31',basis:'UTC-catalogue-date',year:2026}};console.log(upcomingMeteors([x],new Date('2026-12-31T23:59:59Z')).length);`,
      ],
      { env: { ...process.env, TZ: zone }, encoding: "utf8" },
    );
    assert.equal(result.status, 0);
    assert.equal(result.stdout.trim(), "1");
  }
});
