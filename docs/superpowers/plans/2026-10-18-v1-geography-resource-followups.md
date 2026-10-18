# V1 geography, resources and follow-up acceptance

> **For agentic workers:** use superpowers:subagent-driven-development for independent lanes and verification-before-completion before integration. Owner approved all three lanes, local tests, docs, push and CI.

**Goal:** finish the agreed offline geographic matrix, measured core API load profile and missing follow-up cases without pretending fixtures establish live global coverage or host capacity.

**Architecture:** reuse the existing API runtime, starting installed1.0.30 package (rebuilt as1.0.31 after the contract fix), synthetic transports and compiled smoke harness. Add narrow tests for missing branches. Extend the existing compiled check with a fixed optional capacity workload; retain its ordinary smoke behavior. No source activation is intended. Audit found and repaired the bounded region-reference mismatch: five included plus five excluded regions require ten references, under the existing ten-geometry ceiling.

**Tech stack:** TypeScript/node:test, compiled Node MCP server, synthetic provider fixtures, Codex CLI for bounded native follow-ups.

**Spec:** [current remaining sequence](../../operations/v1-remaining-ticket-release-matrix.md), [journey status](../../operations/v1-assembled-journey-status-20261018.md), [API source profile](../../operations/v1-api-source-profile-20261018.md).

## Constraints and review focus

- Offline only: no data-provider calls, browsing, new downloads, private configuration/ledger changes or deployment.
- Reuse the isolated plugin-v1 worktree; preserve unrelated data-sources.md and weather-provider-admission.md edits.
- No every-place testing, planet build or local catalogue requirement. Geography tests prove filter semantics, not actual access/darkness/completeness.
- Fixed synthetic load is not provider latency, throughput certification, full optional-source capacity or target-host evidence.
- Refresh/expired identity/changed preferences are distinct; successful prior evidence survives partial outages, while expired API identities must be resolved again.
- Preserve original ticket IDs and unresolved scientific/source/release decisions. No blanket ticket closure from additional tests.

## Lane 1 — geography (subagent)

Files: new tests/places/api-geographic-acceptance-matrix.test.ts and docs/operations/v1-geographic-acceptance-20261018.md.

- [x] Audit current default and opt-in branches for named/near/multi-origin/country/state/include/exclude combinations, coordinates, revisions, expiry and timezone.
- [x] Add only absent integrated matrix tests; verify alongside existing geography suites. Classify old real diagnostics separately from fixtures.
- [x] Publish one current supported/unsupported matrix and exact remaining source/native gates.

## Lane 2 — bounded resource measurement (coordinator)

Files: scripts/verify-api-runtime.mjs; new scripts/api-capacity-report.mjs and tests/operations/api-capacity-report.test.ts; CI invocation; new docs/operations/v1-api-resource-measurement-20261018.md.

- [x] Write failing pure report-contract tests, then implement summary/validation helpers for exactly four sequential and four concurrent requests, concurrency at most four, synthetic flags and finite metrics.
- [x] Add --capacity to the compiled smoke harness: keep its four original checks, then four sequential and four concurrent fixed core requests; total12 requests, at most30seconds capacity dispatch budget, existing per-request timeout, no provider network. Capture body-byte counts, per-phase latency, RSS and actual synthetic quota-file sizes; unobserved caches stay explicitly unmeasured.
- [x] Run compiled measurement, record runtime/hash/configuration/limits, and add the same fixed measurement to Linux/Windows CI. Do not impose invented production performance thresholds.

## Lane 3 — follow-up journeys (subagent)

Files: new tests/mcp/v1-followup-acceptance.test.ts and docs/operations/v1-followup-acceptance-20261018.md.

- [x] Identify gaps in existing expiry/timezone/optional-outage suites and add a registered-MCP follow-up sequence for changed activity/window/equipment, rejected timezone then corrected input, explicit focused refresh and expired identity recovery.
- [x] Keep fixture evidence separate from model behavior. No new refresh flag or cache promise.
- [x] Coordinator runs bounded native1.0.31 follow-ups using fixed API snapshots and blocked provider transport; report any model failures honestly.

## Integration (sequential)

- [x] Cross-review lane outputs and fix findings; register new tests in tests/all.test.ts.
- [x] Run affected tests, full offline suite, types, compiled checks and package consistency. No version bump/install unless packaged behavior changes.
- [x] Update the same tracker/matrix and evidence documents with exact results and remaining gates.
Post-verification action: commit only wave changes, push codex/plugin-v1 and watch exact-commit CI. CI evidence is reported after push; no deployment.

## Self-review

Lanes own disjoint files; root alone integrates shared tracker/CI/test registration. Tests target missing branches, not repeated global certification. Report validation prevents synthetic results being presented as live, measured body bytes as wire bytes, or serialized quota bytes as complete storage. Native evidence cannot upgrade source rights or a historical sample. Owner already approved execution; no extra confirmation is needed for these offline steps.
