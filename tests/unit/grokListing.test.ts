import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveGrokListingUrl } from "../../client/src/lib/grokListing";

test("Grok listing configuration enables only an HTTPS destination on Grok", () => {
  assert.equal(resolveGrokListingUrl("https://grok.com/example-nightsky-listing"), "https://grok.com/example-nightsky-listing");
  for (const value of [undefined, "", "#", "https://grok.com", "https://grok.com/?ref=site", "javascript:alert(1)", "http://grok.com/test", "https://grok.com.evil.example/test", "https://other.example", "https://user:password@grok.com/test", "https://grok.com:444/test"]) {
    assert.equal(resolveGrokListingUrl(value), null);
  }
});
