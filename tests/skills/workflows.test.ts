import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { V1_TOOL_ANNOTATIONS } from "../../server/mcp/registerTools";
import { OPTIONAL_SKY_TOOL_NAMES } from "../../server/mcp/optionalSkyTools";
import { LIGHT_POLLUTION_TOOL_NAMES } from "../../server/mcp/lightPollutionTools";

const root = process.cwd();

test("all workflows distinguish admitted 2027 maxima from prior-year forecasts", () => {
  for (const name of ["find-observing-place", "plan-stargazing-night", "plan-sky-event", "plan-astrophotography", "prepare-outing"]) {
    const body = readFileSync(join(root, "plugins/nightsky/skills", name, "SKILL.md"), "utf8");
    assert.match(body, /12.*2027/);
    assert.match(body, /LEO.*2027/);
    assert.match(body, /UT.*minute/);
    assert.doesNotMatch(body, /LYR, ORI, LEO, NTA, STA and HYD lack calendar timing/);
    const canonical = readFileSync(join(root, "docs/product/workflows", `${name}.md`), "utf8");
    assert.doesNotMatch(canonical, /2025–2026 NASA peak-calendar coverage/);
    assert.doesNotMatch(canonical, /Only QUA, ETA, SDA, PER, CAP and GEM overlap the NASA timing list/);
  }
});
const tools: readonly string[] = [...Object.keys(V1_TOOL_ANNOTATIONS), ...OPTIONAL_SKY_TOOL_NAMES, ...LIGHT_POLLUTION_TOOL_NAMES];
const skillNames = ["find-observing-place", "plan-stargazing-night", "plan-astrophotography", "plan-sky-event", "prepare-outing"];

function read(path: string): string { return readFileSync(join(root, path), "utf8"); }

test("early answer rules reconcile every used source including location credit and modification notices", () => {
  for (const skill of skillNames) {
    const packaged = read(`plugins/nightsky/skills/${skill}/SKILL.md`);
    const canonical = read(`docs/product/workflows/${skill}.md`);
    for (const [kind, content] of [["packaged", packaged], ["canonical", canonical]]) {
      const early = content.slice(0, 2500);
      assert.match(early, /Before finalizing, reconcile every returned source used, including the resolved-location source:/, `${skill} ${kind}`);
      assert.match(early, /attribution and modification statements, and licence links/, `${skill} ${kind}`);
      assert.match(early, /provider\/datasource contributor, copyright and licence names/, `${skill} ${kind}`);
      assert.match(early, /selection-reporting clarifications; keep full provenance structured/, `${skill} ${kind}`);
      assert.match(early, /stop and ask one display-time-zone question/, `${skill} ${kind}`);
    }
  }
});

test("workflowSkillsReferenceOnlyRegisteredMcpTools", () => {
  for (const skill of skillNames) {
    const content = read(`plugins/nightsky/skills/${skill}/SKILL.md`);
    assert.match(content, /^---\r?\nname:/);
    for (const match of content.matchAll(/`([a-z]+_[a-z_]+)`/g)) assert.ok(tools.includes(match[1]!), `${skill} references undefined tool ${match[1]}`);
  }
});

test("usesPlaceResolutionBeforePlanning", () => {
  for (const skill of skillNames) {
    const content = read(`plugins/nightsky/skills/${skill}/SKILL.md`);
    const resolveAt = content.indexOf("resolve_place");
    const planAt = content.indexOf("plan_observing_session");
    if (planAt >= 0) assert.ok(resolveAt >= 0 && resolveAt < planAt, `${skill} must resolve a named place before planning`);
  }
});

test("asksForNamedPlaceWhenUserGivesCoordinates", () => {
  const fixture = read("tests/skills/asksForNamedPlaceWhenUserGivesCoordinates.md");
  const guidance = skillNames.map((name) => read(`plugins/nightsky/skills/${name}/SKILL.md`)).join("\n");
  assert.match(fixture, /coordinates/i);
  assert.match(guidance, /ask.*named place|name a nearby city/i);
  assert.doesNotMatch(fixture, /plan_observing_session/);
});

test("callsEventSearchForEventPlans", () => {
  assert.match(read("plugins/nightsky/skills/plan-sky-event/SKILL.md"), /search_sky_events/);
});

test("keepsProvidersSeparateInSummary", () => {
  const guidance = skillNames.map((name) => read(`plugins/nightsky/skills/${name}/SKILL.md`)).join("\n");
  assert.match(guidance, /separate|independent/);
  assert.match(guidance, /valid time|valid times/);
});

test("asksBeforeAssumingHostLocation", () => {
  const guidance = skillNames.map((name) => read(`plugins/nightsky/skills/${name}/SKILL.md`)).join("\n");
  assert.match(guidance, /near me/i);
  assert.match(guidance, /ask.*location|ask.*city|confirm.*location/i);
});

test("usesPartialResultWhenSourceUnavailable", () => {
  const guidance = skillNames.map((name) => read(`plugins/nightsky/skills/${name}/SKILL.md`)).join("\n");
  assert.match(guidance, /partial/i);
  assert.match(guidance, /unavailable/i);
  assert.match(guidance, /never.*invent|do not invent|don't invent/i);
});

test("all skills retain successful site resolution before details and timezone clarification", () => {
  for (const skill of skillNames) {
    const content = read(`plugins/nightsky/skills/${skill}/SKILL.md`);
    assert.match(content, /After a successful city or site resolution, retain the returned matches and their exact placeId and sourceRevision or catalogueRevision/);
    assert.match(content, /An unknown site timezone is a details\/display-choice gap, not a reason to repeat the same successful resolve_place arguments/);
    assert.match(content, /An ambiguous result needs selection or a more specific query/);
    assert.match(content, /When observing-site details are needed, select the matching returned identity/);
    assert.match(content, /A resolved named-city plan needs no candidate-details prerequisite/);
  }
});

test("all skills constrain opening suitability claims to actual site evidence", () => {
  for (const skill of skillNames) {
    const content = read(`plugins/nightsky/skills/${skill}/SKILL.md`);
    assert.match(content, /Opening verdict: state the supported astronomy opportunity and the site's verification status together/);
    assert.match(content, /If access, safety, lighting or local horizon is unverified, describe a provisional observing opportunity/);
    assert.match(content, /Later caveats do not repair an unsupported opening suitability claim/);
  }
});

test("canonical outdoor contract carries retained selection and provisional opening rules", () => {
  const content = read("docs/product/outdoor-conversation-contract.md");
  assert.match(content, /After a successful city or site resolution, retain the returned matches/);
  assert.match(content, /reuse that selection across a display-timezone clarification/);
  assert.match(content, /Opening verdict: state the supported astronomy opportunity and the site's verification status together/);
  assert.match(content, /Calculated darkness, target geometry and a chosen display timezone do not verify site suitability/);
});
