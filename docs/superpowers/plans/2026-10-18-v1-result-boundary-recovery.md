# V1 result-boundary recovery implementation plan

> **For agentic workers:** Use superpowers:subagent-driven-development; keep resolver, forecast and source-decision lanes separate.

**Goal:** Clarify API resolver next actions and empty forecast result scope, then verify the two observed native-answer gaps without changing source authority.

**Architecture:** Promote existing bounded selection metadata into resolver text and qualify empty forecast text as a per-response outcome. Preserve structured schemas, provider evidence, expiry, city/site routes and source credits. No conversational server memory or new cache is added.

**Tech stack:** TypeScript, MCP text projections, Node offline tests and bounded synthetic CLI conversations.

**Spec:** docs/operations/v1-followup-acceptance-20261018.md final1.0.32 artifact findings; existing source decision/profile records.

## Constraints and review focus

- Existing isolated worktree; unrelated source/weather document edits stay untouched.
- No data-provider calls, new dataset downloads, accounting/credential changes, scraping, deployment or publication.
- Public source documentation research is distinct from requesting provider datasets; no source admission is inferred.
- No new skill-rule accumulation, universal duplicate-prevention claim, invented earlier forecast or guarantee of freshness.
- Preserve the existing first2,500-character package priority guard and all city/site timezone conditions.

## Tasks

- [x] Resolver lane: compare repeated native success with current output; red-green exact bounded identity/revision, expiry and conditional next-step text; retain ambiguity and explicit refresh exceptions.
- [x] Forecast lane: red-green per-response absence/freshness wording; preserve original earlier values/status conditionally, no history/state; empty versus cloud-missing/stale cases remain distinct.
- [x] Source lane: concrete freeze settings, public-use evidence research and minimal genuinely owner-dependent facts/decisions; no silent source activation or event/history scope reduction.
- [x] Cross-review changes, register new regression in the full suite and run focused/type/package/runtime checks.
- [x] Build/install the final local package; run one bounded two-turn unknown-site replay and one explicit prior-forecast refresh follow-up using synthetic transport only. Keep every outcome, classify failures honestly and stop at the bounded cases.
- [ ] Run full offline suite; update tracker/evidence with actual final results; commit/push and watch exact-commit CI.

## Evidence limits

The retained1.0.32 aggregate already exposed exact18/25/40% cloud rows; the final model dropped them after a later empty response. The resolver repeated a successful unambiguous lookup. These observations establish response-level failures, not why the model internally chose them. Output clarification is a bounded hypothesis to test, not proof of general model compliance.

Final local results:1,819pass/0fail/2skip; types, packages, compiled probes and final installed equality pass. Targeted native4calls/no duplicates/old forecast preservation passes; broader credits/samplewording gates and two owner questions remain open. Exact-commit CI follows push.
