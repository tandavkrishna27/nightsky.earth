# NightSky local package completion implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Execute three independent lanes with failing tests, implementation, independent spec/code review and final verification.

**Goal:** Assemble complete host-specific local rehearsal packages and workflow behavior, with an honest remaining-ticket handoff, before deferred installed-plugin/model validation.

**Architecture:** Reuse the twelve-tool HTTP MCP backend and five canonical workflow skills. Keep public HTTPS submission packaging strict; a separate local-test builder emits host-compatible files with an explicit loopback endpoint and non-release evidence. The backend stays separately started, with no new stdio bridge or runtime database.

**Tech Stack:** Existing TypeScript/Node24, fflate, Node test runner, existing MCP schemas.

**Spec:** Original 2026-10-10-nightsky-v1-execution-ready.md plus docs/operations/local-ticket-closure.md, local-package-readiness.md and the owner steering recorded after the Claude rehearsal.

## Global constraints

- Work only in .worktrees/plugin-v1 on codex/plugin-v1; preserve unrelated main checkout.
- No upload/install, Plugin Creator account mutation, deployment/tunnel, publication, new external provider/source/history requests or new authenticated model invocation.
- User defers further interactive testing until complete local assembly; retain accuracy findings for final review, not as silently resolved.
- No database, map or website work; no new dependencies or alternative runtime architecture.
- Root alone owns tests/all.test.ts, tsconfig.tools.json, CI, shared status/closure docs, commits/pushes and exact-head CI observation.
- Five canonical names: find-observing-place, plan-stargazing-night, plan-astrophotography, plan-sky-event, prepare-outing.
- Root public manifest, public validator and public package endpoint rules remain unchanged. Local artifacts always mark submissionReady=false and hostInstallationVerified=false.

## Parallel ownership and interfaces

| Lane / original tickets | Owns | Deliverable / dependency |
|---|---|---|
| Package assembly —12A/12B | scripts/build-local-plugin-package.ts; tests/platforms/local-package.test.ts; docs/operations/local-plugin-package.md | Export buildLocalPluginPackage({host:'codex'|'claude',endpoint:string}) returning deterministic ZIP/inventory/digest and false readiness flags. Reads current public rehearsal files and canonical workflow bytes; final frozen build waits for lane2. |
| Complete workflow delivery —11A–11C /15 preparation | plugins/nightsky/skills/*/SKILL.md; docs/product/workflows/*.md; tests/skills/local-experience.test.ts | Five skills preserve complete agreed journeys and evidence boundaries; concise beginner explanations, equipment qualification, nested/clipped darkness meanings and no fabricated site restrictions. No astronomy/transport code changes. |
| Remaining-ticket handoff —0/6/8/9/12–18 | docs/operations/local-completion-next-actions.md | Audit all27 original headings: exact remaining work, locally achievable action vs held source/account/hosting/public gates, dependency/parallel map. Read-only code audit; root reconciles shared status. |

## Review focus

1. Local endpoint cannot smuggle credentials/query/path/remote hosts or weaken production URL checks —lane1 rejection tests.
2. Every installed skill reference is contained in its ZIP, matches its canonical workflow and has no repo-only path —lane1 inventory and lane2 source-reference tests.
3. Civil/nautical/astronomical fields mean nested below-threshold periods, clipped to session; an ordinary full-dark evening must not imply polar night or mocked ephemeris —lane2 language regression.
4. Beginner advice preserves unknown weather/access, conditions for Milky Way and telescope requirement for rings —lane2 content tests.
5. A generated package must not count as installed/validated/complete-data/published —lane1 flags and lane3 dispositions.

## Lane1 — local package assembly

- [x] Write failing tests for both host layouts, deterministic ZIP/digest and five working bundled references. Codex uses portable plugin.json/mcp.json; Claude uses .claude-plugin/plugin.json and .mcp.json plus shared skills/assets/release notes.
- [x] Add rejection tests: non-loopback names/IPs, non-http scheme, credentials, query/fragment, wrong path, extra connections, machine paths/secrets and missing references. Only literal127.0.0.1, localhost or[::1], a valid explicit port, and /mcp are allowed for this test builder.
- [x] Verify tests fail before implementation.
- [x] Implement the exported builder and guarded CLI from existing public rehearsal bytes; serialize one host-specific MCP HTTP entry, preserve all skills and attribution, produce non-release metadata/inventory. Do not include source/raw datasets, user config, tokens or test traces. Resolve official host formats before deciding field names.
- [x] Focused test/type check; document separately started backend and deferred actual installation. No global/local marketplace enablement or cache changes.
- [x] Independent spec and code review; fix findings before integration.

## Lane2 — workflow completeness

- [x] Read all five existing workflows/skills and fifteen-journey map; retain breadth of learning, photography, event, comparison, discovery and packing guidance.
- [x] Add failing content regressions for clipped nested darkness vs polar night; geometric opportunity vs condition-guaranteed visibility; Saturn point vs telescope rings; unsupported local restriction claims; short outcome-first summaries with useful local times/sources.
- [x] Implement only workflow/skill text changes, preserve existing source and candidate identity boundaries. Explain provider-unavailable vs unsupported vs missing installed coverage. Avoid claiming skills alone repair output contracts or ephemerides.
- [x] Focused existing/new skill tests plus packaging reference tests; synchronize canonical references. Do not install or invoke a model.
- [x] Independent spec and quality review.

## Lane3 — original-task completion handoff

- [x] Read current status, original160 checkboxes and27heading acceptance ledger; inspect actual file evidence rather than copying old wave conclusions.
- [x] Map each remaining condition to exact original task, deliverable, dependency and action permission. Show local coding complete/preparable separately from blocked data coverage, hosted connection, official submission/pilot and separate website.
- [x] Include known Hanle interpretation finding and pending installed-skill/fullmodelmatrix checks. Prior12/9/6 is a closure snapshot, not resolution of newly found issues; recommend any acceptance reopening with precise evidence for root.
- [x] Provide a concrete subsequent sequence and parallel lanes; do not invent more coding work to substitute for held real-data evidence. Do not authorize held jobs.
- [x] Self-review links/count arithmetic; independent review before root integration.

## Sequential integration and delivery

- [x] Root adds new tests to tests/all.test.ts and builder to tsconfig.tools.json; extend existing Node CI to generate and verify both local artifacts offline without launching a model/installing a plugin.
- [x] Freeze canonical source bytes after all lane reviews; build both host ZIPs and compare bundled references/inventory/digests. Run full Node tests, three type configurations, public/package/eight review/build/runtime checks; OSM/ERA5 workflow remains covered by actual CI.
- [x] Whole-wave independent review, including local endpoint/security isolation and truthful task/status docs. Correct any findings with fresh regressions where needed.
- [x] Update tickets/status/closure and current plan checkboxes, preserving explicit source/host/publish gates and deferred interactive/accuracy findings.
- [x] Scoped commit/push existing branch, observe all six exact-head CI jobs and record substantive evidence. No deployment or downloads.

## Decisions and self-review

Ruling: separate local-test package builder — existing public validator intentionally refuses loopback — accidental public use is guarded by false readiness flags and distinct output directories.
Ruling: assemble HTTP connection packages, not a new bundled stdio runtime — tested backend remains shared — actual host install is unverified until owner-deferred final plugin rehearsal.
Ruling: workflow explanation can clarify current window semantics while the source field naming remains a recorded final-review item — owner deferred further demo/accuracy cycle — do not declare the issue fixed without later contract/regression acceptance.

Self-review: lane1 and2 share only a read-only canonical workflow interface until root freezes final bytes; lane3 owns a separate handoff doc. No lane changes root shared test/status/config files. All five review conditions have named tests or dispositions. This plan closes package preparation work, not global data or hosted/public tasks.

## Current verification

Fresh Windows Node24.14.0:496discovered/495passed/onepermission skip/zero failures. Three type configurations, public and both local packages, eight offline review sets, full build and standalone full/resolver-only plus compiled regional runtimes pass. Independent content/spec review and raw-byte-lint re-review pass. Root accepted5.C4/10A.C3/10A.C5 reopening and reconciled all160 original boxes89checked/71open. Installed model/plugin and final accuracy acceptance remain deferred; no download/upload/deployment occurred. All six CI jobs passed for5b3ebda (run38591337445); final documentation-followup is observed separately.
