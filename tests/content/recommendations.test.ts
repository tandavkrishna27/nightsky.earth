import assert from "node:assert/strict";
import test from "node:test";
import { getPreparationChecklist } from "../../server/content/checklists";
import { getSpecialistToolRecommendations } from "../../server/content/specialistTools";
import { specialistToolsResultSchema } from "../../shared/nightsky/planning";

test("matchesToolSuggestionToActivity", () => {
  const result = getSpecialistToolRecommendations("astrophotography");
  assert.ok(result.recommendations.some(({ name }) => name === "PhotoPills"));
  assert.ok(result.recommendations.some(({ name }) => name === "Stellarium"));
});

test("marksPriceAsUnknownWhenNotVerified", () => {
  const result = getSpecialistToolRecommendations("general-stargazing");
  assert.equal(result.recommendations.find(({ name }) => name === "Light Pollution Map")?.pricing, "unknown");
  assert.equal(result.recommendations.find(({ name }) => name === "Stellarium")?.pricing, "free");
  assert.equal(result.recommendations.find(({ name }) => name === "SkySafari")?.pricing, "paid");
});

test("includesLastCheckedDate", () => {
  const result = getSpecialistToolRecommendations("general-stargazing");
  assert.ok(result.recommendations.length > 0);
  assert.ok(result.recommendations.every(({ lastReviewed }) => lastReviewed === "2026-10-13"));
});

test("doesNotAddAffiliateTracking", () => {
  const result = getSpecialistToolRecommendations("meteor-shower");
  assert.ok(result.recommendations.every(({ url }) => !/[?&](ref|aff|affiliate|tag)=/i.test(url)));
});

test("returnsValidatedSpecialistToolResult", () => {
  const result = getSpecialistToolRecommendations("eclipse");
  assert.equal(specialistToolsResultSchema.safeParse(result).success, true);
  assert.ok(result.sources.length >= 1);
});

test("adaptsChecklistToWeatherAndGear", () => {
  const unknown = getPreparationChecklist("astrophotography", { cloudCoverMax: undefined, equipment: [] });
  const cloudy = getPreparationChecklist("astrophotography", { cloudCoverMax: 85, equipment: ["DSLR", "tripod"] });
  assert.ok(cloudy.includes("The supplied forecast shows substantial cloud cover; if your date is flexible, compare another night and recheck nearer departure."));
  assert.ok(cloudy.some((item) => item.includes("DSLR, tripod")));
  assert.ok(unknown.includes("Cloud cover is unavailable in the supplied forecast; check an official local forecast again before departure."));
});

test("includesAfterDarkAccessCheck", () => {
  const checklist = getPreparationChecklist("general-stargazing", {});
  assert.ok(checklist.some((item) => /after-dark access|night opening/i.test(item)));
  assert.ok(checklist.some((item) => /children.*session short.*supervise/i.test(item)));
});

test("doesNotPromisePhotoSuccess", () => {
  const checklist = getPreparationChecklist("astrophotography", {});
  assert.ok(checklist.some((item) => /test frame/i.test(item)));
  assert.ok(checklist.every((item) => !/guarantee|will capture|perfect photo/i.test(item)));
});
