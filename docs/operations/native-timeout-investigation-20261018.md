# Native timeout investigation — 18 October 2026

## Status

**Native conversation acceptance remains partial/failed, not complete.** This investigation changes no production code, rate limits, provider deadlines, skills or installed package. Package remains 1.0.22. No deployment or new external API requests were made during this investigation; reproductions use local calculations or an isolated synthetic loopback server.

Subsequent implementation: [1.0.23 reliability correction](native-reliability-fix-20261018.md). The status above describes the investigation checkpoint before that implementation.

## Evidence timeline (UTC)

| Time | Observed evidence |
| --- | --- |
| 06:00:22 | Approved 30-minute native server started with twelve total provider attempts and independent per-source caps; zero requests at startup |
| 06:01:34–37 | Codex desktop logs show numerous thread MCP startups; the owner's test thread reports NightSky ready |
| 06:01:46–47 | Owner's native `resolve_place` succeeds; server journal records Geoapify HTTP 200 |
| 06:01:59–06:06:59 | Owner's six-operation batch waits roughly 300 seconds per operation, then fails at the native client boundary; no corresponding downstream source attempts appear in the bounded transport journal |
| 06:02:02, 05, 07, 30 | Codex desktop logs explicitly report NightSky HTTP 429 during app-tool discovery/startup, including rejected `initialize` requests |
| Later coordinator checks | Native astronomy returns available; history returns not-covered; invalid discovery returns an immediate validation error. Three weather providers return HTTP 200 with partial-but-usable forecast evidence. A separate valid discovery request hits its own fifteen-second deadline |

Source evidence is the owner's supplied answer, retained test-thread rollout, the redacted session transport journal and selected desktop log entries. No complete application log or private environment file is copied into the repository. Log references: desktop file ending `6588-t0-i1-051554-0.log`, lines 4263, 4287, 4299 and 4319. The coordinator read only relevant log selections and did not change any app configuration.

## Findings and confidence

### 1. Confirmed startup throttling; shared accounting is a reproduced likely contributor

`server/mcp/route.ts` counts admitted MCP traffic against the same per-IP budget, default sixty requests per sixty seconds, before method dispatch. Consequently initialization, tool enumeration and other protocol traffic consume the same allowance as useful tool calls. Host refresh across several threads can exhaust that shared allowance.

An isolated offline reproduction used the production app with external fetch forbidden: **sixty initialization requests returned HTTP 200, then the next tool call returned HTTP 429 with Retry-After 60**. External calls: zero. This reproduces protocol traffic starving a tool request without changing the user's live session or ledgers.

The desktop logs prove startup/discovery throttling in the failure window. They do **not** prove the exact HTTP response of each of the six original tool requests. Several gates share the same error message, so the precise historical limiter cannot be identified from those entries alone. The complete five-minute client wait remains unproven at the transport boundary. Do not claim that every timeout was definitively caused by the per-IP limiter.

### 2. Six parallel requests alone do not reproduce the failure

The coordinator called six native tools together, with the same invalid discovery request first and five local-only calculations/history checks. All completed in approximately **53–56 milliseconds**. The invalid input was rejected, astronomy was available and history was not-covered. No additional provider requests were required. This rules out a blanket claim that the product cannot handle six parallel calls; it does not reproduce every detail of the original batch.

### 3. The model sent invalid discovery arguments

The original discovery payload included `window.timeZone` (the optional catalogue window accepts only UTC start/end) and `shortlistLimit:10` (maximum six). Repeating this payload now returns an immediate validation error. Display timezone belongs in the existing top-level field. Strict validation should remain; silent clamping or dropping unknown fields is not a fix.

The original batch also used multi-object/generic keyword strings for reference search. These are poor substitutes for exact object queries or equipment-aware discovery; no successful results from those searches were observed in the failed batch.

### 4. A separate optional-source deadline occurred

A later valid native discovery operation reached Public Universe and ended at its fifteen-second deadline. That is a distinct observed provider/request-path timeout, not evidence that local astronomy or the three weather APIs failed. Without response-phase telemetry, the source of that latency is not established. No automatic retry or deadline increase was performed.

### 5. Core tools are usable, but the original answer is not accepted

The coordinator's native checks obtained astronomy and three forecast outcomes successfully. Weather sources remain distinct; partial status reflects missing variables rather than blanket source unavailability. Historical coverage correctly remains unavailable. These checks do not turn the owner's failed complete conversation into a pass and do not establish a reliable optional discovery experience.

## Recommended correction sequence

1. Add redacted ingress/completion correlation: request ID, MCP method/tool name, elapsed time, status and a limiter-reason label; never arguments, query strings, credentials or response bodies. This must expose rejected requests as well as completed ones.
2. Add synthetic host-refresh regressions. Separate bounded protocol/startup allowance from bounded tool execution allowance, retaining IP/global cardinality, total traffic and concurrent-work protections. Do not simply remove limits or raise every ceiling.
3. Add workflow guidance/examples for valid catalogue arguments, one exact reference object per search, and useful core results when an optional source is unavailable. Preserve strict schemas and source-specific failures; do not mislabel a native transport timeout as a proven upstream failure.
4. Instrument optional-source timing phases without raw response retention; use existing fifteen-second timeout evidence before deciding whether request sizing or a reviewed deadline change is appropriate. New source diagnostics require their own bounded authorization.
5. Independently review changes, run affected/full offline and package checks, then repeat the owner's normal native conversation with current allowance, server-side request correlation and explicit result review. Whole-conversation acceptance stays open until that rerun passes.

An independent read-only reviewer checked the retained desktop entries, production limiter and reproduction source, and agreed with these causality limits. No original ticket is closed by this report; original V1 accounting remains unchanged.
