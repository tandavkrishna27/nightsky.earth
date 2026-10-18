import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { METEOR_CODES } from "../../shared/nightsky/meteors";
import { meteorCoverage } from "../../server/events/meteorCoverage";

const readProfile = () => JSON.parse(readFileSync("data/events/event-maintenance-v1.json", "utf8"));
test("maintenance retains every meteor identity and only actual peak evidence years", () => {
 const profile = readProfile();
 assert.deepEqual(profile.meteors.retainedCodes, [...METEOR_CODES]);
 assert.deepEqual(profile.meteors.peakYears, [2025,2026,2027]);
 assert.equal(profile.meteors.completeActivitySeasons, 0);
 for (const entry of profile.meteors.peakCoverage) {
  const rows = meteorCoverage(entry.year);
  assert.deepEqual(entry.supportedCodes, rows.filter(row => row.peak.status === "supported").map(row => row.code));
  assert.deepEqual(entry.missingCodes, rows.filter(row => row.peak.status === "missing").map(row => row.code));
 }
 assert.equal(profile.meteors.peakCoverage.length, 3);
 assert.ok(meteorCoverage(2028).every(row => row.peak.status === "out-of-horizon"));
});
test("maintenance names the confirmed owner and an annual review without automatic evidence extension", () => {
 const profile = readProfile();
 assert.equal(profile.maintenanceOwner, "NightSky.earth");
 assert.equal(profile.selection, "all-existing-supported-evidence");
 assert.equal(profile.reviewedOn, "2026-10-18");
 assert.equal(profile.review.nextReviewDate, "2027-10-18");
 assert.equal(profile.review.cadence, "annual");
 assert.equal(profile.review.automaticEvidenceExtension, false);
 assert.equal(profile.review.acquisitionAuthorized, false);
 assert.equal(profile.families.length, 7);
 assert.deepEqual(profile.unsupportedEventTypes, ["occultation", "comet", "other"]);
});
