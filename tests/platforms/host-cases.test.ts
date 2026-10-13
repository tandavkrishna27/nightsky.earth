import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

interface HostCase {
  id: string;
  prompt: string;
  expectedTools: string[];
  requiredSignals: string[];
  knownLimits: string[];
}

const cases = JSON.parse(readFileSync(join(process.cwd(), "tests/platforms/host-cases.json"), "utf8")) as HostCase[];
const registeredTools = new Set(["resolve_place", "get_astronomy_window", "get_target_visibility", "get_night_conditions", "get_aurora_outlook", "search_sky_events", "search_observing_locations", "get_location_context", "get_clear_sky_climatology", "plan_observing_session", "compare_observing_options", "recommend_specialist_tools"]);

test("hostPromptCasesHaveExpectedOrderAndNoUndefinedTools", () => {
  assert.equal(new Set(cases.map(({ id }) => id)).size, cases.length);
  for (const scenario of cases) {
    assert.ok(scenario.prompt.length > 20);
    assert.ok(scenario.requiredSignals.length > 0);
    assert.ok(scenario.knownLimits.length > 0);
    for (const tool of scenario.expectedTools) assert.ok(registeredTools.has(tool), `${scenario.id} references undefined tool ${tool}`);
    if (scenario.expectedTools.includes("plan_observing_session")) {
      assert.ok(scenario.expectedTools.includes("resolve_place"), `${scenario.id} must resolve a place first`);
      assert.ok(scenario.expectedTools.indexOf("resolve_place") < scenario.expectedTools.indexOf("plan_observing_session"));
    }
  }
});

test("coordinatesOnlyHostCaseAsksForNamedPlaceWithoutCallingTools", () => {
  const scenario = cases.find(({ id }) => id === "asksForNamedPlaceWhenUserGivesCoordinates");
  assert.ok(scenario);
  assert.deepEqual(scenario.expectedTools, []);
  assert.ok(scenario.requiredSignals.some((signal) => /name a city|named destination/i.test(signal)));
});

test("hostCasesIncludeCorePartialAndLearningJourneys", () => {
  for (const id of ["beginner-stargazing", "meteor-shower", "astrophotography-learning", "ambiguous-place", "partial-provider", "asksForNamedPlaceWhenUserGivesCoordinates"]) {
    assert.ok(cases.some((scenario) => scenario.id === id), `missing host case: ${id}`);
  }
});
