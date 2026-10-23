import assert from "node:assert/strict";
import test from "node:test";
import { NIGHTSKY_SERVER_INSTRUCTIONS } from "../../server/mcp/index";
import { V1_TOOL_ANNOTATIONS } from "../../server/mcp/registerTools";

test("every frozen V1 tool has explicit safe annotation booleans", () => {
  assert.equal(Object.keys(V1_TOOL_ANNOTATIONS).length, 13);
  for (const [name, annotations] of Object.entries(V1_TOOL_ANNOTATIONS)) {
    assert.ok(name.length > 0);
    assert.equal(typeof annotations.readOnlyHint, "boolean");
    assert.equal(typeof annotations.destructiveHint, "boolean");
    assert.equal(typeof annotations.openWorldHint, "boolean");
    assert.equal(annotations.readOnlyHint, true);
    assert.equal(annotations.destructiveHint, false);
  }
  assert.equal(V1_TOOL_ANNOTATIONS.search_sky_events.openWorldHint, false);
});

test("server instructions begin with cross-tool limits", () => {
  const firstSentence = NIGHTSKY_SERVER_INSTRUCTIONS.slice(0, 512).toLowerCase();
  for (const phrase of ["access", "safety", "history", "forecast", "sources", "unknown", "coordinates", "named destination"]) {
    assert.ok(firstSentence.includes(phrase), `Missing ${phrase} from first 512 characters`);
  }
});
