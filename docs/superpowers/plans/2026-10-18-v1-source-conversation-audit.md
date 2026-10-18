# V1 source, conversation and local audit implementation plan

> **For agentic workers:** Use superpowers:subagent-driven-development. Keep lane ownership separate and review combined evidence before completion claims.

**Goal:** Resolve the two observed conversation findings, reconcile source decisions and audit the remaining local V1 requirements.

**Architecture:** Preserve the API/search-based discovery and existing read-only MCP contracts. Improve packaged guidance without changing provider admission; source and audit documents distinguish evidence from proposals and release gates.

**Tech stack:** TypeScript, Node test runner, canonical Markdown workflows, portable Codex/Claude packages.

**Spec:** docs/operations/v1-remaining-ticket-release-matrix.md; docs/operations/v1-followup-acceptance-20261018.md.

## Constraints

- Work in the existing plugin-v1 worktree; preserve unrelated working edits.
- No live data-provider requests, downloads, scraping, credentials/quota changes, deployment or publication.
- Do not silently remove historical/event scope, activate sources or assert global acceptance.
- Native model replay, if needed, uses synthetic local transports and normal CLI authentication only.

## Review focus

- A resolved but unverified site must not become a suitable destination through confident wording.
- An unknown site timezone requires display-zone clarification without unnecessary identical resolution.
- An enabled implementation is not evidence of free production entitlement or scientific coverage.
- Passing fixtures do not replace actual-profile/client or hosting acceptance.
- Package instructions must retain coordinate identity, source credits and optional-failure behavior.

## Parallel tasks

- [x] A: Inspect retained native transcript; add failing guidance regressions, minimally update canonical instructions and run affected checks. Record limits; root reviews.
- [x] B: Reconcile actual source configuration, supported event domains and history admission into a concrete decision record. Identify owner decisions separately from engineering; root reviews.
- [x] C: Independently audit security/privacy/attribution/package and assembled requirements; record actionable findings and evidence. Root addresses material local defects or explicitly records open gates.

## Integration sequence

- [x] Review each lane diff and cross-check claimed evidence.
- [x] Version/package affected guidance and run focused tests, TypeScript checks and full offline suite.
- [x] Replay affected unknown-site native conversation with synthetic transports if the supported CLI is available; classify actual result honestly.
- [x] Update tracker/reconciliation with exact remaining boundaries and test results.
- [ ] Commit only this wave, push the branch and watch exact-commit CI; do not deploy.

Integration evidence: final1,815pass/0fail/2skip; types/packages/compiled checks pass. Native final replay preserves provisional opening and timezone choice but remains partial on duplicate lookup and previous forecast evidence loss. No release/production admission is inferred.
