import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

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
const tools = ["resolve_place", "get_astronomy_window", "get_target_visibility", "get_night_conditions", "get_aurora_outlook", "search_sky_events", "search_observing_locations", "get_location_context", "get_clear_sky_climatology", "plan_observing_session", "compare_observing_options", "recommend_specialist_tools"];
const skillNames = ["find-observing-place", "plan-stargazing-night", "plan-astrophotography", "plan-sky-event", "prepare-outing"];

function read(path: string): string { return readFileSync(join(root, path), "utf8"); }

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
