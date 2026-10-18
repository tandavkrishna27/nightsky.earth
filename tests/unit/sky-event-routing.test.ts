import { test } from "node:test";
import assert from "node:assert/strict";
import { classifyPath } from "../../shared/websiteBuild";
test("new routes and legacy indexes have one canonical destination", () => {
  assert.equal(classifyPath("/sky-events").status, 200);
  assert.equal(classifyPath("/sky-events/full-moon-2026-10-26").status, 200);
  assert.equal(classifyPath("/sky-events/not-real").status, 404);
  for (const p of ["/meteor-nights", "/meteor-showers"])
    assert.deepEqual(classifyPath(p), {
      status: 301,
      location: "/sky-events?category=meteor-showers",
    });
});
