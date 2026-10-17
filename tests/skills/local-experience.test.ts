import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { GeoNamesPlaceIndex } from "../../server/places/geonames";
import { getAstronomyWindow, getTargetVisibility } from "../../server/nightsky/astronomy";
import { planObservingSession, type PlannerServices } from "../../server/nightsky/planner";
import { searchSkyEvents } from "../../server/events/catalog";

const names = ["find-observing-place", "plan-stargazing-night", "plan-astrophotography", "plan-sky-event", "prepare-outing"];
const documents = names.flatMap((name) => [
  `plugins/nightsky/skills/${name}/SKILL.md`,
  `docs/product/workflows/${name}.md`,
]);

// Static authoring guards only: these catch omitted interpretation instructions.
// They do not establish that a host loaded a skill or that a model follows it.
const rules: [string, RegExp[]][] = [
  ["nested clipped darkness must not become exclusive twilight or polar night", [
    /nested.*below.*(?:threshold|Sun)|below.*(?:threshold|Sun).*nested/i,
    /civil.*-6.*nautical.*-12.*astronomical.*-18/i,
    /clipped.*requested.*window/i,
    /not.*exclusive.*twilight/i,
    /matching.*intervals.*(?:not|never).*polar night/i,
    /matching.*intervals.*(?:not|never).*(?:fake|mock)/i,
  ]],
  ["opportunity must preserve conditional Milky Way and equipment limits", [
    /Milky Way.*conditional.*(?:cloud|dark)/i,
    /Saturn.*naked.eye.*point.*rings.*telescope/i,
    /direction.*maximum altitude.*not.*whole.*window/i,
  ]],
  ["missing evidence must retain distinct causes and unknown conditions", [
    /weather.*access.*unknown/i,
    /provider.*unavailable/i,
    /(?:unconfigured|not configured).*(?:fixture|artifact|index)/i,
    /unsupported.*seeing.*catalog.*global coverage/i,
    /(?:permits|restrictions).*(?:returned|official).*source/i,
  ]],
  ["beginner answer must lead with a short useful summary", [
    /(?:lead|start|begin).*outcome/i,
    /(?:three|3).*bullets/i,
    /local times.*timezone/i,
    /source links/i,
    /one.*next step/i,
  ]],
];

for (const [scenario, requirements] of rules) {
  test(`local workflow authoring: ${scenario}`, () => {
    for (const path of documents) {
      const text = readFileSync(path, "utf8");
      for (const requirement of requirements) assert.match(text, requirement, `${path}: missing ${requirement}`);
    }
  });
}

test("canonical skill source references remain paired with their workflow", () => {
  for (const name of names) {
    const path = `docs/product/workflows/${name}.md`;
    assert.ok(readFileSync(`plugins/nightsky/skills/${name}/SKILL.md`, "utf8").includes(path));
    assert.ok(readFileSync(path, "utf8").length > 0);
  }
});

test("window classification is explicit and installed skill behavior remains pending", () => {
  const text = readFileSync("docs/product/workflows/plan-stargazing-night.md", "utf8");
  assert.match(text, /darknessState.*requested window/i);
  assert.match(text, /solarThresholdIntervals.*nested/i);
  for (const state of ["full-window", "partial-window", "none", "unknown"]) assert.ok(text.includes(state));
  assert.match(text, /installed.*skill.*(?:deferred|pending)/i);
});

test("event guidance uses current sampled evidence without stale three-point instructions", () => {
  for (const path of ["plugins/nightsky/skills/plan-sky-event/SKILL.md", "docs/product/workflows/plan-sky-event.md"]) {
    const text = readFileSync(path, "utf8");
    assert.doesNotMatch(text, /three exact radiant samples/i);
    assert.match(text, /conjunctionWindows/);
    assert.match(text, /97/);
    assert.match(text, /meteorCivilGuidance/);
    assert.match(text, /six.*pair/i);
    assert.match(text, /recurrenceBasis/);
    assert.match(text, /unspecified time basis/);
    assert.match(text, /without averaging/);
  }
});

const planningPathRules = [
  "Missing exact meteor maxima or full-season shower coverage must not stop ordinary stargazing, astrophotography, preparation or learning.",
  "For a requested meteor session without an admitted maximum, retain the user's chosen shower and date window; present a qualified session plan, not a peak-optimized recommendation.",
  "A concept-only learning question needs no place or date unless the explanation makes a local or time-specific claim.",
  "All nineteen meteor identities remain available for evidence review; the proposed thirteen-shower comparison is not an adopted launch scope.",
];
function planningPathSection(text: string): string {
  const section = text.replaceAll("\r\n", "\n").split("## Useful planning with incomplete event evidence\n")[1]?.split("\n## ")[0];
  assert.ok(section, "Missing useful planning decision path");
  return section;
}
function validatePlanningPath(text: string): void {
  const section = planningPathSection(text);
  for (const sentence of planningPathRules) assert.ok(section.includes(sentence), `Missing affirmative planning rule: ${sentence}`);
  assert.match(section, /official.*source.*year.*precision/s);
  assert.match(section, /untrusted.*not.*admitted/s);
  assert.match(section, /Without host search.*continue.*supported/s);
  assert.match(section, /civil dates.*not.*UTC boundary/s);
  assert.match(section, /model.*domain.*not.*activity window/s);
}
test("all five journey entry points preserve a useful partial planning and source-search path", () => {
  for (const name of names) {
    const skill = readFileSync(`plugins/nightsky/skills/${name}/SKILL.md`, "utf8");
    const canonical = readFileSync(`docs/product/workflows/${name}.md`, "utf8");
    validatePlanningPath(skill);
    validatePlanningPath(canonical);
    assert.equal(planningPathSection(skill), planningPathSection(canonical));
  }
});
test("planning decision guard rejects blocking or silently substituted meteor journeys", () => {
  const text = readFileSync("docs/product/workflows/plan-sky-event.md", "utf8");
  validatePlanningPath(text);
  for (const sentence of planningPathRules) {
    assert.throws(() => validatePlanningPath(text.replace(sentence, "Stop or substitute a different activity.")));
  }
});

const journeyIndex = new GeoNamesPlaceIndex([[1, "London", "London", "", 51.5, -.12, "GB", "United Kingdom", 8000000, "Europe/London"]], "workflow-offline-fixture");
const journeyPlaceId = "place:v1:geonames:1";
const journeyWindow = { startUtc: "2027-04-22T20:00:00Z", endUtc: "2027-04-23T03:11:00Z", timeZone: "Europe/London" };
const journeySource = { name: "Offline workflow fixture", url: "https://example.test/workflow-fixture", attribution: "Synthetic offline workflow evidence", dataClass: "context" as const };
function journeyServices(): PlannerServices {
  return {
    index: journeyIndex,
    getAstronomy: (place, window) => getAstronomyWindow(place, window, journeyIndex),
    getTargetVisibility: (place, target, window) => getTargetVisibility(target, place, window, journeyIndex),
    searchEvents: (placeId, window) => searchSkyEvents({ placeId, window, eventTypes: ["meteor-shower"] }, journeyIndex),
    getNightConditions: async (placeId, window) => ({ availability: { status: "out-of-horizon", reason: "Offline fixture supplies no forecast for this night" }, sources: [journeySource], caveats: [], placeId, window, forecasts: [], nightContext: { darkness: { status: "unknown", reason: "Offline fixture" }, forecastStepsDuringDarkness: [] } }),
    getLocationContext: async (placeId) => ({ availability: { status: "unknown", reason: "Offline fixture" }, sources: [journeySource], caveats: [], placeId, access: { status: "unknown" }, groundLightContext: { status: "unknown", reason: "Offline fixture" } }),
  };
}
for (const activity of ["general-stargazing", "astrophotography", "learning"] as const) {
  test(`assembled ${activity} journey retains useful evidence when event service fails`, async () => {
    let eventCalls = 0;
    const result = await planObservingSession({ placeId: journeyPlaceId, window: journeyWindow, activity, experience: "beginner" }, {
      ...journeyServices(), searchEvents: async () => { eventCalls++; throw new Error("Offline event lookup"); },
    });
    assert.equal(eventCalls, 1);
    assert.equal(result.place.placeId, journeyPlaceId);
    assert.equal(result.place.timeZone, journeyWindow.timeZone);
    assert.ok(result.evidence?.astronomy);
    assert.ok(result.preparation.length);
    assert.ok(result.suggestions?.length);
    assert.ok(result.candidateWindows.length);
    assert.ok(result.gaps.some(gap => /forecast/i.test(gap)));
    assert.ok(!result.gaps.some(gap => /meteor|event|maximum|season/i.test(gap)), "Unrelated missing meteor evidence must not become the journey's blocker");
    assert.equal(result.evidence?.location?.access.status, "unknown");
    if (activity === "learning") assert.ok(result.sources.some(source => source.url === "https://science.nasa.gov/skywatching/faq/"));
    if (activity === "astrophotography") assert.ok(result.preparation.some(step => /test frame/i.test(step)));
  });
}
test("assembled Lyrid journey keeps civil guidance and local samples without inventing a 2027 maximum", async () => {
  let bodyLookups = 0;
  const result = await planObservingSession({ placeId: journeyPlaceId, window: journeyWindow, activity: "meteor-shower", target: "LYR" }, {
    ...journeyServices(), getTargetVisibility: async () => { bodyLookups++; throw new Error("Meteor is not a generic body target"); },
  });
  assert.equal(bodyLookups, 0);
  assert.equal(result.evidence?.events?.events.length, 0);
  const guidance = result.evidence?.events?.meteorCivilGuidance?.find(row => row.code === "LYR");
  assert.ok(guidance);
  assert.equal(guidance.maximumYear, 2026);
  assert.equal(guidance.requestedWindowOverlap, "not-evaluated");
  assert.ok(!Object.hasOwn(guidance, "peakUtc"));
  assert.ok(result.evidence?.meteorRadiantSamples?.length);
  assert.ok(result.candidateWindows.length, "Darkness can support a conditional session without a dated maximum");
  assert.ok(result.sources.some(source => source.url.includes("ign.es")));
  assert.ok(result.factors.some(factor => factor.name === "Meteor civil calendar guidance" && /does not apply/.test(factor.assessment)));
});

test("assembled Orionid journey preserves date-only maximum wording and its unspecified time basis", async () => {
  const window = { ...journeyWindow, startUtc: "2026-10-20T20:00:00Z", endUtc: "2026-10-21T04:00:00Z" };
  const result = await planObservingSession({ placeId: journeyPlaceId, window, activity: "meteor-shower", target: "ORI" }, journeyServices());
  const guidance = result.evidence?.events?.meteorCivilGuidance?.find(row => row.code === "ORI");
  assert.ok(guidance);
  assert.equal(guidance.maximumTimeBasis, "unspecified-by-source");
  assert.ok(!Object.hasOwn(guidance, "peakUtc"));
  assert.equal(result.evidence?.events?.events.length, 0);
  assert.ok(result.candidateWindows.length);
  assert.ok(result.factors.some(factor => factor.name === "Meteor civil calendar guidance" && /secondary peaks/.test(factor.assessment)));
});
