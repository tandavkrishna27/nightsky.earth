# Native Timestamp Evidence Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans; implement inline with a fresh whole-change reviewer. Steps use checkbox tracking.

**Goal:** Prevent the observed forecast timestamp/value misalignment and unnecessary position recalculation in native follow-ups.

**Architecture:** Enhance existing MCP answer text with a pure bounded forecast formatter, retaining original structured results. Reuse actual target orientation samples in the main plan. Workflow and tool descriptions explain evidence reuse and positive-duration windows; no new endpoint or input contract is required.

**Tech Stack:** TypeScript, existing Intl/IANA display formatter, Node tests, existing MCP tools.

**Design basis:** Owner-approved correction following the Hyderabad native test: values remain bound to source and UTC instant, local times are formatted on the server, no interpolation or invented samples, existing exact-instant samples are reused. This is a bounded change to existing output flows, not a new subsystem.

## Global constraints

- No new provider requests, data downloads, activation, dependencies or deployment.
- Preserve tool names, strict input/output schemas, provenance, quotas, deadlines and the existing plugin identity.
- Preserve full structured source evidence. Compact text may omit rows only with explicit omission counts.
- Numeric instant cloud values, interval aggregates and category bands remain distinguishable. No category midpoint conversion or clear-window ranking.
- Local labels retain IANA timezone and original UTC timestamp, including DST repeated hours and date crossings.

## Review focus

- +05:30 and +05:45 conversion, DST repeated hours: test exact paired UTC/local labels.
- Sparse provider cadence: never carry a later value into an earlier slot or fill missing times.
- Out-of-window instant samples versus overlapping aggregate intervals: show only relevant evidence without relabelling periods.
- Long multilingual evidence: explicit row/UTF-8 limits without partial rows or silently missing providers.
- Reused Moon/Saturn samples: no fresh-read requirement solely because a valid sample was returned in a previous turn.

## Task 1 — Bounded forecast evidence

**Files:** create `server/mcp/forecastAnswerText.ts`; modify `server/mcp/answerText.ts`, `server/mcp/registerTools.ts`; create `tests/mcp/forecast-answer-text.test.ts`, register in `tests/all.test.ts`.

**Interface:** `forecastAnswerText(result: NightConditionsResult): string[]`, pure. Render provider/status/issue metadata, exact local-time + UTC rows for total cloud cover, interval bounds or explicit category bands; maximum six rows per provider using first three/last three on longer lists, maximum 3,200 UTF-8 bytes including reserved per-provider status headers and per-provider omission notes. Admit complete rows round-robin after reserving metadata; no partial rows. Instant numeric/category rows require validAt inside the window; aggregates require positive period overlap and retain both original bounds. Render numeric and category entries separately if both exist. Include failed providerOutcomes without forecasts and label stale values on their rows. Unsupported/missing cloud data remains unknown; no fake grid cells. Keep required source credits outside the body formatter.

- [x] Write regression with MET 80.5/47.7/18/30.5 at 15/16/17/18 UTC, WeatherAPI 62/6/50 at 15:30/16:30/17:30 UTC and OpenWeather 100/77 at 15/18 UTC; assert exact pairings, no invented 25%, no 23:00 label for 18:00 UTC in Kolkata.
- [x] Add timezone/DST, missing/stale source, interval/band and bounded-output tests; run red.
- [x] Implement formatter and use it in both main plan and focused weather content. Main plan body limit 8,000 UTF-8 bytes, full structured evidence unchanged.
- [x] Run affected tests and check types; update any old first-sample assertion to assert its equivalent exact timestamp/value evidence.

## Task 2 — Reusable position evidence and workflow contract

**Files:** `server/mcp/answerText.ts`, `server/mcp/registerTools.ts`; five plugin skills and matching canonical workflow documents; `tests/mcp/answer-text.test.ts`, `tests/skills/public-universe-workflows.test.ts`.

- [x] Add failing tests that untargeted plans expose existing suggested-target orientation samples and preserve requested windows/limitations.
- [x] Include deduplicated explicit-target and suggested-target orientation blocks before optional long context, retaining actual UTC timestamps and geometric caveats. Keep the requested session and essential limitations before optional long context; limit the summary prefix so multilingual prose cannot displace evidence. Test combined maximal providers and existing target samples. Do not synthesize positions at a different instant.
- [x] Explain positive-duration windows (`endUtc > startUtc`), reuse matching orientation samples, convert requested local times through IANA timezone, and use focused weather rather than repeating the aggregate planner for sample inspection.
- [x] Pin exact server-formatted forecast row reuse: no interpolation, moved cells, unsupported values, cross-source averaging, or best-evening claim from min/max ranges. Preserve earlier evidence with its original date/status if a later source is unavailable.
- [x] Run focused regression tests; review plan coverage and output budgets.

## Task 3 — Final verification and handoff

- [x] Fresh independent review; address important findings and verify fixes.
- [x] Final full-suite rerun passed: 1,786 passed, 0 failed, 2 skipped (1,788 total); types, plugin build/package and compiled isolation checks have passed. No model/live-source acceptance claims from fixtures.
- [x] Bump local package to 1.0.24, update release notes, tracker and evidence report; package and install under the same local identity, verify installed files.
- [ ] Commit/push existing branch and watch exact-commit CI after final verification. The branch-head GitHub checks record completion after this pre-push plan snapshot; no extra code wave is implied. Fresh native conversation remains a later separately bounded check.

## Pre-implementation review

Independent reviewer identified three gaps: byte budgets/priority, field-level interval filtering and unavailable/stale outcome handling. The interface/task requirements above now explicitly cover all three, plus exact UTC orientation identity. Original raw result contracts remain unchanged.

## Implementation review

Fresh reviewer found body cap accounting excluded the omission notice/newlines. A boundary regression reproduced 8,019 bytes; the formatter now reserves the notice and separators within 8,000. The combined maximal-provider/three-target regression preserves all expected metadata, Moon/planet positions, twilight and Moon warning. No additional material review findings.

Ruling: preserve existing package prefix requirements for outdoor, timezone clarification and source rules. Timestamp guidance follows those rules within the first 8,000 characters; do not weaken the package priority tests. The first full run exposed this ordering regression, which is corrected before final verification.
