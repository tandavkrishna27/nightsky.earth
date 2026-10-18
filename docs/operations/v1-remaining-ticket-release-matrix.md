# V1 ticket reconciliation and remaining sequence

**Current audit: 18 October 2026.** This replaces the 17 October readiness classification. Original 27 executable headings (0–18 with splits) are preserved. API/search discovery supersedes the exhaustive owned global-catalogue/planet build; no database or new bulk data is required by this audit. Website work is separate. The owner’s explicit API-only amendment defers numerical historical-cloud preparation from V1; unavailable history is not a launch blocker. Supported event claims and their limits remain.

## Counts: what remains and where

| Current work category | Count | Meaning |
| --- | ---: | --- |
| Original local done |12| Original scoped deliverable has retained evidence; not a claim every source/client is launch-ready. |
| Local acceptance remains |5| IDs 0, 6, 8, 12B, 15 contain concrete local source/scope/measurement/assembled-experience work. |
| Release dependent |8| IDs 3B, 3C, 4B, 12A, 13, 14, 16, 17 need actual public/host/account/policy/pilot evidence. Much local preparation already exists. |
| Separate/deferred |2| ID 9 numerical history is deferred by the explicit API-only V1 amendment; ID 18 website work is separate. |
| **Total** |**27**| No ticket was added, deleted or falsely closed; ticket9 moved to explicitly deferred scope. |

These are **work-location categories**, not a new Done/Partial/Not-started status scale. The old 12 Done / 9 Partial / 6 Not started and 92/160 checkbox figures are historical snapshots. Do not compare them numerically with these categories as completion percentages. Group 0 spans local and later host gates; its primary unresolved local gate determines its row here. Claude deferral is a route within 12B, not deferral of the whole ticket. The prior6-local/1-separate classification predates the owner’s API-only amendment; the current5-local/2-separate classification still totals27. See [scope decision](v1-api-only-scope-20261018.md).

## All original headings

Evidence names below refer to docs/operations unless prefixed server/, shared/ or tests/. The original execution plan and criterion history remain in Git and linked evidence; current scope takes precedence over obsolete bulk-build proposals.

| ID | Original deliverable | Current category | Exact remaining boundary | Evidence |
| --- | --- | --- | --- | --- |
| 0 | Source, scale and hosting gates | Local acceptance remains | Freeze the enabled API/source profile, rights and scientific claims; actual host gate remains later. Bulk geography is superseded. | v1-api-source-profile-20261018.md; v1-event-history-profile-20261018.md; API-HISTORY-COMPLETION.md |
| 1 | SDK/runtime/HTTP compatibility | Original local done | Pinned runtime, transport and offline compatibility retained. | mcp-sdk-compatibility.md; ci-verification.md |
| 2 | Structured contracts/offline harness | Original local done | Existing schemas and offline harness retained; changes continue to be regression-tested. | three-data-lanes-wave.md; local-ticket-closure.md |
| 3 | Read-only MCP registry/endpoint | Original local done | Local endpoint, API branches and bounded registry implemented; public connection is3B. | local-ticket-closure.md; server/mcp/registerTools.ts |
| 3B | Hosted OpenAI connection | Release dependent | Needs an actual staging HTTPS endpoint and host connection evidence. | local-ticket-closure.md |
| 3C | Publisher/permanent endpoint | Release dependent | Brand/India/support known; verified legal identity/account ownership and frozen endpoint remain. | v1-host-policy-handoff.md |
| 4 | Named-place/timezone resolution | Original local done | Named-place timezone boundary accepted; source snapshots do not prove arbitrary-point site timezone. | timezone-acceptance-wave.md |
| 4B | Official draft location scan | Release dependent | Resolver preparation exists; real branded remote draft/challenge/scan acceptance does not. | local-ticket-closure.md |
| 5 | Deterministic astronomy/targets | Original local done | Calculated local geometry validated; timing semantic refinements do not reopen calculation closure. | astronomy-validation-wave.md; activity-viewing-window-correction-20261018.md |
| 6 | Supported events/targets | Local acceptance remains | Peak/radiant evidence works within bounded domains; maintained event selection, activity/season gaps and review ownership remain explicit in code. | v1-event-history-profile-20261018.md; server/events/meteorCoverage.ts |
| 7A | Short-range weather | Original local done | MET baseline and targeted multi-source follow-up evidence retained; activation/entitlement separate. | provider-controls-wave.md; native-forecast-followup-fix-20261018.md |
| 7B | Short-horizon aurora | Original local done | Bounded NOAA adapter and local checks retained; no long-range visibility guarantee. | events-weather-coverage-wave.md |
| 8 | Candidate-place discovery | Local acceptance remains | Default/opt-in semantics and maximum ten-reference fixtures pass; real selected-geometry source/admission and remaining actual-profile quality acceptance stay open. Bounded core API measurement is recorded, not host certification. | v1-geographic-acceptance-20261018.md; v1-api-resource-measurement-20261018.md; activity-viewing-window-correction-20261018.md |
| 9 | Historical cloud context | Separate/deferred | Numerical history preparation/baseline admission is outside V1 launch scope under the explicit API-only amendment. Without suitable approved evidence it is unavailable; API text and no-artifact fixtures preserve this boundary. Existing dormant code/fixtures may remain; no acquisition or native-equivalence claim. | v1-api-only-scope-20261018.md; v1-api-only-acceptance-20261018.md; tests/mcp/api-only-history-wording.test.ts |
| 10A | Session orchestration | Original local done | Core/optional partial-state orchestration retained; current conversation acceptance belongs12B/15. | local-ticket-closure.md; server/nightsky/planner.ts |
| 10B | Compare sessions/places | Original local done | Original comparison fixtures and source separation retained; no universal host claim. | local-ticket-closure.md |
| 11A | Learning/astrophotography | Original local done | Guides and cited teaching fixtures retained, with current geometric limits. | host-aware-outing-20261018.md; activity-viewing-window-correction-20261018.md |
| 11B | Preparation/specialist apps | Original local done | Adaptive preparation implemented; changing app/store facts need release freshness checks. | local-completion-checklist.md |
| 11C | Five packaged workflows | Original local done | Skills/references installed and verified; native model behavior is separately assessed. | local-package-readiness.md |
| 12A | Public plugin packaging/draft | Release dependent | Local Codex/Claude packages verified; exact real public draft, URLs, identity and official checks remain. | local-plugin-package.md |
| 12B | Native model/client acceptance | Local acceptance remains | Scoped owner/CLI passes and controlled multi-turn preference/refresh/expiry evidence exist; 1.0.33 scoped native replay passes retained identity/no duplicate lookup and previous-forecast preservation after failure; final-credit/sparse-sample phrasing findings and remaining source/client combinations/final actual-profile acceptance stay explicit. Claude deferred; Gemini conditional. | v1-followup-acceptance-20261018.md; v1-assembled-journey-status-20261018.md; complete-model-journey-validation.md |
| 13 | Privacy/terms/support | Release dependent | Draft routes and optional-source disclosure prepared; final legal identity, support/host retention, review and hosted URLs remain. | privacy-and-telemetry.md; shared/nightsky/policies.ts |
| 14 | Hosting/operations | Release dependent | API/no-catalogue runtime, probes and rollback preparation exist; actual host/TLS/proxy/log/capacity/rollback evidence remains. | v1-host-policy-handoff.md |
| 15 | Assembled acceptance/final audit | Local acceptance remains | Aggregate tests and scoped native passes are evidence, not all-client/full-release acceptance. Final source/security/requirements and exact release-artifact review remains. | native-timing-selftest-20261018.md; v1-completion-tracker.md |
| 16 | Submission/publication | Release dependent | Preparation is not submission. Real authorized submission/review and separate publication/install evidence remain. | release-preparation-wave.md |
| 17 | Real-user pilot | Release dependent | Templates/metrics exist; actual authorized participant outcomes absent. Tool calls are not users or installs. | v1-remaining-ticket-release-matrix.md |
| 18 | Website follow-up | Separate/deferred | Separate owner-scoped website workstream; not a plugin V1 dependency. | api-search-discovery-v1-decision.md |

## Latest local evidence

[1.0.34 reviewed API-only wave](v1-api-only-wave-20261018.md) passes the targeted credit and sparse-sample follow-up replay. It also documents selected-source reuse evidence and explicit history deferral. These scoped passes do not close broader12B/15 or actual source/host release gates.

## One ordered remaining-work list

1. **Observed route/cutoff fixes verified (12B/15):** 1.0.29 controlled native replay exercised the city bypass and requested darkness cutoffs. Current 1.0.30 guidance adds useful-result reuse for repeated successful aggregate/resolver calls; its specific replay is recorded in the assembled journey status. Broader acceptance remains in step 4.
2. **Source/coverage profiles documented; close applicable source/event decisions (0/6), with numerical history deferred (9):** the API JSON/Markdown and event/history profile now list implemented endpoints, operator ceilings, retained source rights and coverage, proposed core versus optional roles and explicit gaps. They do not apply production admission. The [source decision record](v1-source-decisions-20261018.md) reconciles runtime defaults, existing history wiring and obsolete handoff TODOs. The [freeze record](v1-freeze-decisions-20261018.md) adds primary public-use evidence and specific remaining owner decisions/engineering rights mapping. Complete exact source-use/account confirmation, maintained event selection/review ownership and accurate finite event/maintenance claims. A disabled optional capability is not a release requirement, but a promised active capability needs evidence or an explicit owner scope decision. The owner explicitly deferred numerical history from V1: no historical acquisition/method admission is a launch gate, and missing values remain unavailable. Do not broaden event claims or present samples as complete seasons/baselines.
3. **Local geography semantics/core measurement completed; remaining real-source/profile acceptance (0/8/14 dependencies):** the geographic matrix reconciles current branches and bounded tests, and the compiled core measurement records latency/RSS/body/ledger metrics with four overlapping client requests. Real opt-in geometry responses/admission and the exact final enabled/optional configuration, sustained/cold/cache/storage and host evidence remain separate; repeat none of the accepted semantic cases solely to test every place. Do not require a test of every place or acquire a planet.
4. **Close the applicable assembled journey matrix and final local audit (12B/15):** combine current native passes with remaining failure cases using the exact installed package/configuration. Respect deferred Claude testing. The [local audit](v1-local-audit-20261018.md) found a logging-disclosure mismatch now corrected locally and retains wider final-credit/sparse-sample phrasing findings; the1.0.33 scoped replay passes the duplicate-lookup/failed-refresh cases. Review security/privacy/source claims and decide any material findings before a release freeze; deterministic fixtures are not a complete real-client matrix.
5. **Then prepare the actual release environment (3B/3C/4B/12A/13/14):** owner host choices, verified legal publisher/account, public endpoint, policy/support URLs, TLS/proxy/streaming/log/retention/capacity and rollback. Run official host checks against that environment. No deployment is authorized by this audit.
6. **Finally submission/publication and pilot (16/17):** obtain the appropriate explicit actions, preserve review/listing evidence and collect real participant outcomes. Website18 continues separately.

## Source-of-truth links

- [API-only owner scope amendment](v1-api-only-scope-20261018.md)
- [Current completion tracker](v1-completion-tracker.md)
- [Final audit and release-readiness record](v1-final-reconciliation-20261018.md)
- [Current API profile](v1-api-source-profile-20261018.md) / [event and history profile](v1-event-history-profile-20261018.md)
- [Assembled journey status](v1-assembled-journey-status-20261018.md) / [follow-up evidence](v1-followup-acceptance-20261018.md)
- [Geographic acceptance](v1-geographic-acceptance-20261018.md) / [local core measurement](v1-api-resource-measurement-20261018.md)
- [Native timing evidence and limits](native-timing-selftest-20261018.md)
- [Owner API/search scope decision](api-search-discovery-v1-decision.md)
- [Original execution-ready plan](../superpowers/plans/2026-10-10-nightsky-v1-execution-ready.md)
