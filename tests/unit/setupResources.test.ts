import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveSetupResource } from "../../client/src/lib/setupResources";

test("setup resources accept only owned HTTPS endpoints and host-specific archives", () => {
  assert.equal(
    resolveSetupResource("endpoint", "https://api.nightsky.earth/mcp"),
    "https://api.nightsky.earth/mcp",
  );
  assert.equal(
    resolveSetupResource(
      "package",
      "https://nightsky.earth/downloads/claude-1.0.zip",
    ),
    "https://nightsky.earth/downloads/claude-1.0.zip",
  );
  for (const invalid of [
    undefined,
    "",
    "#",
    "https://example.com/mcp",
    "http://localhost:8765/mcp",
    "https://127.0.0.1/mcp",
    "https://nightsky.earth.evil.test/mcp",
    "https://user:pass@nightsky.earth/mcp",
    "https://nightsky.earth:444/mcp",
    "https://nightsky.earth/mcp?token=x",
    "https://nightsky.earth/mcp#fragment",
    "javascript:alert(1)",
  ])
    assert.equal(resolveSetupResource("endpoint", invalid), null);
  assert.equal(
    resolveSetupResource("endpoint", "https://nightsky.earth/other"),
    null,
  );
  for (const invalid of [
    "https://nightsky.earth/",
    "https://nightsky.earth/file.exe",
    "https://evil.test/a.zip",
    "https://nightsky.earth/a.zip?token=x",
  ])
    assert.equal(resolveSetupResource("package", invalid), null);
});
