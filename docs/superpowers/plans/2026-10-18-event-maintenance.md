# V1 event maintenance implementation plan

> **For agentic workers:** Execute this approved event lane inline using the existing API-only scope and evidence profile.

**Goal:** Record maintenance of all existing event evidence with finite domains and annual accountability.

**Architecture:** Keep the frozen evidence inventory and runtime validators intact. Add an operational manifest cross-checked against the runtime evidence; document its precedence for ownership/selection only.

**Tech Stack:** JSON, TypeScript node:test, existing tsx runtime.

**Spec:** docs/operations/v1-api-only-scope-20261018.md and v1-event-history-profile-20261018.md.

## Constraints and review focus

No network, acquisition, activation, commit or scientific-domain expansion. Preserve all 19 meteor identities. Distinguish year-specific maxima, bounded radiant fits and contextual guidance. Preserve complete-season gaps, missing maxima and unsupported years. Owner is NightSky.earth; review scheduling is an operational default.

## Task

- [x] Inspect runtime validators and retained artifacts before edits.
- [x] Add a failing manifest consistency test; observe missing-manifest failure.
- [x] Add the minimal maintenance manifest with actual peak identities/years and annual review policy.
- [x] Run affected offline tests against real runtime evidence.
- [x] Document frozen inventory precedence and review procedure; review diff for invented coverage.

No test aggregate changes belong to this lane. Run the standalone maintenance test explicitly until the coordinator integrates it.
