import { V1_TOOL_ANNOTATIONS } from "../../server/mcp/registerTools";
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
const registeredTools = new Set(Object.keys(V1_TOOL_ANNOTATIONS));

test("hostPromptCasesHaveExpectedOrderAndNoUndefinedTools", () => {
  assert.equal(new Set(cases.map(({ id }) => id)).size, cases.length);
  for (const scenario of cases) {
    assert.ok(scenario.prompt.length > 20);
    assert.ok(scenario.requiredSignals.length > 0);
    assert.ok(scenario.knownLimits.length > 0);
    for (const tool of scenario.expectedTools) assert.ok(registeredTools.has(tool), `${scenario.id} references undefined tool ${tool}`);
    if (scenario.expectedTools.includes("plan_observing_session")) {
      const resolver = scenario.expectedTools.includes("get_observing_location_details") ? "get_observing_location_details" : "resolve_place";
      assert.ok(scenario.expectedTools.includes(resolver), `${scenario.id} must resolve a place first`);
      assert.ok(scenario.expectedTools.indexOf(resolver) < scenario.expectedTools.indexOf("plan_observing_session"));
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
