import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveAssistantListingUrl } from "../../client/src/lib/assistantListings";

test("each assistant accepts its own specific HTTPS destination and rejects mismatched or generic links", () => {
  for (const [id, host] of [["chatgpt", "chatgpt.com"], ["claude", "claude.ai"], ["gemini", "gemini.google.com"], ["grok", "grok.com"]] as const) {
    const url = `https://${host}/example-nightsky-listing`;
    assert.equal(resolveAssistantListingUrl(id, url), url);
    for (const invalid of [undefined, "#", `https://${host}/`, `https://${host}/apps`, `http://${host}/x`, `https://${host}.example/x`, `https://user:pass@${host}/x`, `https://${host}:444/x`, "javascript:alert(1)", "https://unrelated.example/x"]) {
      assert.equal(resolveAssistantListingUrl(id, invalid), null);
    }
  }
});
