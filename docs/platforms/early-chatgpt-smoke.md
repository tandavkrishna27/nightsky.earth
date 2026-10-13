# Early OpenAI smoke: local preparation

Prepared 14 October 2026 for Task 3B. No ChatGPT or Codex account connection has been performed by this record.

Run `node --import tsx --test tests/mcp/transport-smoke.test.ts` for the SDK adapter's loopback initialize/list/call and result tests. For a separate interactive local Inspector rehearsal run `node --import tsx tests/mcp/inspector-smoke-server.ts`, then configure Inspector for Streamable HTTP at `http://127.0.0.1:4317/mcp`. Initialize, list `echo`, call with `{"message":"synthetic smoke"}`, and retain the negotiated protocol and structured message. Stop the process after use. This fixture server is test-only: it echoes the supplied message, has an extra synthetic route and does not implement the protected production route's admission/logging controls. It is unsuitable for direct public exposure.

The protected assistant service rehearsal is `npm run build:plugin` followed by `node scripts/verify-plugin-runtime.mjs`. It starts a bounded loopback child process and checks liveness, initialization, twelve tools, recommendations, oversized-body rejection and absent website routes. This confirms a local server contract, not an assistant installation or streaming through a proxy.

Before later hosted smoke, use a separately approved staging hostname and a minimal registry. Apply current connector-egress allowlisting where supported, bounded requests and redacted application/edge logs; provide local Inspector access separately. A client that cannot reach those controls is untested. Record the actual access mechanism rather than assuming caller IP is an identity. Do not weaken controls to obtain a passing record.

Use [host run record](host-run-record-template.md) for each intended ChatGPT desktop/mobile and Codex network path. Record UTC date, client/version, account eligibility/country/language without identifiers, endpoint, negotiated protocol, exact tool listing, call/result, approval behavior and errors. Each actual client must initialize and finish a synthetic minimal call in a fresh session. The package's permanent production URL is established separately; staging testing must not change it. SDK fallback is allowed only after a documented reproducible incompatibility and Task 1 review.

[Official OpenAI packaging guidance](https://developers.openai.com/plugins/build/plugins), fetched 14 October 2026, distinguishes local/repository distribution from the universal public plugin directory. Local protocol success does not establish either account eligibility or public installation.
