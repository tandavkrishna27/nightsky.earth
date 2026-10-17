# V1 remaining-ticket and release matrix

**Current reconciliation: 17 October 2026.** The [owner-approved API/search discovery decision](api-search-discovery-v1-decision.md) supersedes exhaustive local-catalogue requirements for V1. Multiple suitable free APIs may be used. The 95,380,942,829-byte planet receipt, exhaustive extraction and our own global catalogue are deferred; their preparation is neither deleted nor counted as completion. Historical weather and events remain active capabilities whose source/API feasibility must be re-evaluated independently.

The [fixed completion tracker](v1-completion-tracker.md) supplies stage progress. This matrix reconciles the original [execution plan](../superpowers/plans/2026-10-10-nightsky-v1-execution-ready.md), its [criterion audit](v1-acceptance-audit.md) and [implementation evidence](implementation-status.md). Current requirements below take precedence over dated bulk-build next actions. No code, tests, network activity, acquisition, installation, model run, deployment or release was performed by this documentation reconciliation.

## Accounting and authority

There are **27 executable headings in 19 numbered groups (0–18)**. Task 0's six gates are not six additional tickets. No ticket is replaced, added or closed by deferring catalogue construction.

| Level | Done | Partial | Not started | Total |
| --- | ---: | ---: | ---: | ---: |
| Original executable headings | 12 | 9 | 6 | 27 |
| Original numbered groups | 6 | 10 | 3 | 19 |

Done headings: **1, 2, 3, 4, 5, 7A, 7B, 10A, 10B, 11A, 11B, 11C**. Partial headings: **0, 6, 8, 9, 12A, 12B, 13, 14, 15**. Not-started headings: **3B, 3C, 4B, 16, 17, 18**. Done groups: **1, 2, 5, 7, 10, 11**. Group 4 stays Partial because 4B is not started. Named-place timezone acceptance was explicitly accepted; arbitrary-point boundary lookup is not reopened.

These statuses describe established original-ticket evidence, not acceptance of an implemented API migration. An opt-in API route now has offline implementation evidence for source selection, discovery and planning; the initial bounded Geoapify/MET/WeatherAPI/OpenWeather batch passed connectivity at `291fc0a`, while broader provider acceptance and unsupported complex scopes remain open. Legacy modes still retain their local artifacts. See the current tracker for the final review/test record. Its implementation and integration belong to existing Task 8 and release acceptance under 12/14/15. Changed dependencies of previously completed contracts, planning and guides require regression evidence before release; their existing completion evidence does not prove the new route works. Reopen a completed criterion only for a demonstrated unmet criterion or explicit acceptance change, recording the reason and revised totals.

The former **92 checked / 68 open of 160 original checkboxes** is a historical acceptance snapshot, not a freshly measured API-mode checklist or percentage. Scope amendments below must not be converted into checked boxes without implementation evidence.

## All 27 original headings

Evidence references are scoped records; historical tests or retained artifacts do not prove present runtime availability after cleanup.

| ID | Original deliverable | Status | Evidence retained and current disposition |
| --- | --- | --- | --- |
| 0 | Independent source, scale and hosting gates | Partial | MET/NOAA and earlier source/spike records exist. Replace geography bulk feasibility with API policy/quality/operating measurements; history/event and host gates remain open. |
| 1 | SDK, runtime, schema and HTTP compatibility | Done | [Implementation status](implementation-status.md) and [CI record](ci-verification.md) retain local/runtime acceptance. New provider dependencies need compatibility checks within Task 8. |
| 2 | Structured contracts and offline harness | Done | [Three-data-lanes evidence](three-data-lanes-wave.md) closes audited local criteria. Extend source/coverage/unavailable contracts through Task 8 without claiming earlier fixtures prove API integration. |
| 3 | Read-only MCP endpoint and registry | Done | [Local ticket closure](local-ticket-closure.md) records endpoint/admission closure; [discovery extension](global-discovery-execution.md) records fourteen tools. Hosted connection remains 3B. |
| 3B | Hosted OpenAI connection | Not started | Loopback/Inspector evidence is insufficient; actual separate staging HTTPS/client record is required. |
| 3C | Publisher and permanent production endpoint | Not started | Brand, India and support address are known; verified legal identity, eligible account/ownership and frozen URL remain. |
| 4 | Named-place resolution and record-based time zones | Done | [Timezone acceptance](timezone-acceptance-wave.md) records owner acceptance. Original evidence uses local GeoNames. The API route adds remote source snapshots and explicit unknown timezone handling; live endpoint/timezone validation remains open. |
| 4B | Real draft location-contract scan | Not started | Resolver-only preparation exists; no real draft scan/challenge/logging acceptance is inferred. |
| 5 | Deterministic astronomy and target windows | Done | [Astronomy validation](astronomy-validation-wave.md) and targeted darkness correction in [implementation status](implementation-status.md) retain local closure. |
| 6 | Predictable events and supported targets | Partial | Peak/radiant/annual context and calculated event evidence exists; full supported season/model, rights and date/geometry validation remain. API discovery does not remove events. |
| 7A | Short-range weather adapter | Done | [Local ticket closure](local-ticket-closure.md) and [provider controls](provider-controls-wave.md) retain existing MET evidence. WeatherAPI/OpenWeather collection integration and the initial bounded live batch now have [recorded evidence](api-live-validation-results-20261017.md); free-tier/public-admission limitations remain explicit. |
| 7B | Short-horizon aurora adapter | Done | [Events/weather evidence](events-weather-coverage-wave.md) and [implementation status](implementation-status.md) retain bounded NOAA acceptance. |
| 8 | Source-linked candidate-place discovery | Partial | Existing regional/catalogue software and measured samples remain evidence. API/search discovery, suitability, fallback and actual service measurements are new unmet acceptance within this ID. |
| 9 | Months-ahead historical cloud context | Partial | [History runtime](era5-runtime-wave.md), [source resolution](source-resolution-delivery.md) and later admission records distinguish bounded samples from eligible baseline. Optional API range planner, bounded operator worker, validated durable cache and read-only runtime are now implemented; see [history completion](API-HISTORY-COMPLETION.md). Live full-baseline/method acceptance remains open. |
| 10A | Activity-aware planning | Done | [Local ticket closure](local-ticket-closure.md) and darkness correction retain core planning acceptance. API candidates/history must integrate with source labels and partial states under 8/9/15. |
| 10B | Side-by-side comparison | Done | [Local ticket closure](local-ticket-closure.md) retains comparison acceptance. Recheck API source conflicts, missing values and selected-place identity during integration. |
| 11A | Cited learning and photography guidance | Done | [Local checklist](local-completion-checklist.md) and [implementation status](implementation-status.md) retain scoped guidance evidence; event/history gaps must remain visible. |
| 11B | App suggestions and preparation | Done | [Local checklist](local-completion-checklist.md) retains reviewed checklist/suggestion evidence; place tags remain unverified access information. |
| 11C | Five shared guides and host packages | Done | [Local package readiness](local-package-readiness.md) and [discovery extension](global-discovery-execution.md) retain authoring evidence. API handoff/capability guidance was updated in the multi-weather implementation; final native use remains 12B/15. |
| 12A | OpenAI package and host cases | Partial | API-mode package/configuration, local rehearsal and validators exist. Version 1.0.14 integrates 14 tools and five skills, with deterministic Codex/Claude packages verified locally; final identity/URLs, same real draft and official validation remain. |
| 12B | Separate assistant routes | Partial | [Model journey record](complete-model-journey-validation.md) retains bounded Codex evidence; actual host search/no-search fallback and full native matrix remain. Claude retest is deferred. |
| 13 | Public listing/policy pages | Partial | [Policy preparation](policy-preparation.md) retains drafts. API provider flows, quota records and conditional location-bearing history cache/journals are now disclosed and tested. Legal/host facts, retention and final public URLs remain open. |
| 14 | Deployment and operations | Partial | Offline operator/preflight and immutable-artifact accounting exist. Measure API-mode runtime/cache/upstream limits plus any enabled static/history/event artifacts; selected-host deployment/rollback remain. |
| 15 | Review-ready public package | Partial | Prepared cases/review packet exist. Final API-mode assembled journeys, actual client evidence, links/video and official validation remain. |
| 16 | Submit, review, publish | Not started | Requires explicit submit authorization, real disposition, separate publish authorization and observed fresh listing/install/use. |
| 17 | Invited pilot | Not started | Measurement preparation is not tester evidence; actual invited use and feedback remain. |
| 18 | Separate website scope/design | Not started | Independent owner-scoped work; not a plugin launch dependency. |

## Scope amendments and dependencies

**Direct acceptance changes: 0 and 8.** Gate 0B now proves sustainable bounded API/search discovery instead of an exhaustive prebuilt OSM baseline. Task 8 closes against that implemented route. Geography ODbL/attribution obligations remain wherever applicable to selected providers/results; deferral does not waive them.

**Implementation or dependency changes: 9, 12A, 12B, 13, 14 and 15.** Task 9's historical capability and honest statistic/quality requirements remain; its source/delivery feasibility must be re-evaluated rather than inheriting the multi-million-request bulk plan as mandatory. Tasks 12–15 consume API-mode behavior, provider policy and measured runtime requirements. **Task 6 remains active**, including independent event-source/API feasibility; no event acceptance is silently reduced. **2, 3, 4, 10A, 10B and 11A–11C** retain completed evidence but are affected integration surfaces. No new arbitrary replacement tickets are introduced.

| Open ID | Current acceptance / concrete action | Dependency and boundary |
| --- | --- | --- |
| 0 | For 0A/0B, select one or more suitable free sources and pin role, terms, attribution, geographic limitations, request/cache limits, identification/account requirements, fallback and realistic operating cost. Distinguish named-place geocoding from POI discovery. For 0C, re-evaluate historical API products and statistic/coverage feasibility; for 0D/0E retain explicit optional GEFS/VIIRS dispositions. For 0F record actual host and approved budgets. | Existing public endpoint research is a candidate assessment, not service selection. No unrestricted scraping, silent paid fallback or unapproved provider jobs. History/events cannot be dropped by the geography decision. |
| 3B | Deploy separate staging HTTPS after authorization; observe intended OpenAI connection, schemas, streaming/errors and location behavior using the actual mode. | 0F and hosted configuration/privacy prerequisites. Loopback is insufficient. |
| 3C | Verify exact publisher identity, project eligibility and endpoint ownership; freeze permanent full MCP URL. | Carry settled brand/India/support facts forward; no invented identity. |
| 4B | Use resolver-only mode on the real branded draft; retain domain challenge, location scan and hosted logging evidence before full exposure. | 3C plus hosting. API candidates must preserve the existing input/privacy boundary. |
| 6 | Reconcile existing 2025–2027 peaks and annual contexts with full supported shower seasons, source rights, radiant gaps and independent date/geometry validation. Assess whether suitable permitted APIs can fill gaps, recording supported versus approximate/unknown behavior. | 0A, existing meteor/event evidence. Approximate annual context and source-only ETA/ORI intervals do not prove complete modeled seasons. No automatic event removal or source acquisition. |
| 8 | Implement configured bounded provider discovery and optional host search; normalize source identity, freshness, coverage, missing fields and candidate identity. Preserve named/region/radius intent, ambiguity, dateline/polar cases, inclusion/exclusion semantics or explicit unsupported results. Define selection/detail lifetime and stale-candidate behavior. Hand provider coordinates into planning without accepting arbitrary typed GPS/address input. | 0A/0B policy selection first; reuse existing upstream controls. Host search is optional and host-dependent; when absent use configured API or explicit unavailable plus named-place path. No invented candidates/access/safety. |
| 8 | Update runtime, preflight, CI/package/skills so an exhaustive catalogue is optional. Verify rate limits, bounded concurrency/cache, cancellation, timeout/outage/throttling, source conflict and refresh behavior. Measure actual configured-service quality, latency, memory and global coverage limitations. | Existing catalogue adapters remain optional. Live validation requires its applicable authorization; offline fixtures do not establish provider quality or worldwide completeness. |
| 9 | Compare suitable free historical API delivery with existing prepared-data paths: exact variables, reference years, statistical definition, hourly versus preaggregated values, provenance/revision, missingness, location/timezone mapping, limits and recurring cost. Preserve baseline eligibility/1991–2020 claims only where evidence supports them; means cannot supply invented percentiles/probabilities. | 0C. Keep existing bounded reader/aggregation/lineage work; do not require a new worldwide bulk acquisition merely because old packets proposed it. A different scientific claim or unsupported launch disposition requires an explicit scope decision, not this regrooming. |
| 12A | Update the fourteen-tool/five-skill package and cases for API mode, attribution and fallback. Finalize identity/HTTPS metadata, update the same real draft, freeze exact artifact/digest and retain official validator/account/privacy results. | 3C/4B and working 8/9/6 dispositions; optional catalogue absence must not break packaging. |
| 12B | Record actual per-host native skills/reference loading, tools, location and search capabilities, including host-search absent and API unavailable cases. Distinguish installed skills from prompted guidance. | Working API route and exact package. Retain bounded Codex evidence; complete available Codex/ChatGPT/Gemini routes later. Claude retest remains explicitly deferred; no authentication retry now. |
| 13 | Reconcile policy drafts with selected provider destinations, transmitted location data, in-memory retention and logs; verify exact legal identity, jurisdiction review and public policy/support URLs. | Provider selection and actual host facts. Existing named-place/near-me consent and sensitive metadata redaction remain. |
| 14 | Configure API mode without mandatory global OSM artifacts. Measure startup/RSS/concurrency/cache storage, upstream budgets/latency/rate-limit failure and any enabled static/history/event current/rollback/scratch allocations. Verify TLS/DNS/proxy isolation, streaming/timeouts, logs/retention and actual promotion/rollback. | 8 plus 9/6 admitted inputs or explicit unresolved capability disposition, then selected host/authorized deployment. Deferred planet storage deficit is not a V1 host blocker. Offline preflight is not hosted evidence. |
| 15 | Assemble final available-client positive/negative/retained-session journeys with API discovery and named-place fallback, historical/event states, useful source-linked planning, public links/video and exact official-validated package. Record unsupported routes honestly. | 12A/12B/13/14 and actual 8/9/6 evidence; server rejection probes do not prove assistant refusal behavior. Owner reviews concrete material before submission. |
| 16 | Submit after explicit authorization, resolve actual review feedback; publish only after separate authorization; observe fresh install/use. | 15; this document grants neither authorization. |
| 17 | Invite authorized testers after connectable staging or publication, record sample size, decisions/usefulness/return feedback and continue/change/stop recommendation. | Usable client access; distinguish calls, installs and people, without inferring identity from calls. |
| 18 | Prepare a separate website scope/design brief only when intentionally started. | Independent; not a plugin launch gate. |

## Current execution order and existing work

```text
0: provider policy and roles -> 8: API/search route, contracts and skills
0C -> 9: historical source/API feasibility -> supported implementation/evidence
0A -> 6: event rights/model/API feasibility -> supported implementation/evidence
8 + 9 + 6 -> local assembled acceptance and measured API-mode resources
0F + 3C -> 3B/4B -> 12A/12B + 13 + 14 -> 15 -> 16 -> 17
18: separate scope
```

History and event feasibility can be prepared alongside geography. Shared runtime/package changes and final artifact selection need integration in order. Host selection remains later. No database is introduced; bounded in-process caches and small versioned references remain allowed.

Reuse existing upstream controls, contracts, planner/comparison, fourteen-tool registry, optional catalogue adapters and operator preflight. `server/mcp/registerTools.ts` supports opt-in API discovery alongside legacy local geography modes; `server/places/geonames.ts` remains the legacy local resolver. Configured MET, WeatherAPI and OpenWeather are on demand. API-mode implementation and bounded connectivity evidence do not imply complete geographic or production acceptance.

Existing `scripts/osm/boundary-metadata.ts`, `scripts/osm/build-source-catalogue.ts`, `scripts/era5/build-observation-aggregates.ts`, `scripts/era5/build-release.ts` and `scripts/plugin-operator-preflight.ts` are reusable work. Do not recommission them. Worldwide boundary/extraction completeness, larger OSM shard orchestration, Linux bulk supervision and planet assembly are deferred catalogue work. History tooling remains available, but a proposed exhaustive acquisition schedule is not the selected API-era delivery plan. Cleanup may remove local datasets; verify actual inventory before claiming an artifact is available and never silently redownload it.

Settled owner facts: **NightSky.earth**, personal publisher in **India**, monitored support **nightsky.earth2026@gmail.com**. Exact legal identity is not verified. Codex is acceptable; Claude is deferred. Do not reopen these settled preferences.

## Future release evidence checklist

This checklist specifies later validation; none was run by this reconciliation.

- [ ] Pin exact commit, package/digest, runtime/dependencies, enabled providers/configuration and any admitted artifact identities. Keep fixture, live-provider, native-client and actual-host evidence distinct.
- [ ] Verify all fourteen existing tools, strict input/output schemas, annotations, bounded structured/errors and resolver-only mode. Preserve all five packaged guides and full reference loading.
- [ ] Exercise existing fifteen journeys and five positive/three negative review cases, including API candidates, named-place fallback, comparisons, history, events and photography. No invented access/safety/visibility, bearings/settings, historical probabilities or unsupported source coverage.
- [ ] Verify ambiguous names, coordinate-shaped input rejection, explicit near-me consent/no hint, timezone/DST/polar/date behavior, and selected-candidate identity/detail expiry/timezone handoff.
- [ ] Verify optional host search, absent search/location, provider unavailable/throttled/stale/malformed/conflicting responses, result caps/pagination, attribution, source freshness, coverage gaps, radius/region/inclusion/exclusion behavior and unknown access.
- [ ] Measure actual API latency, global sample quality, rate limits, cancellation/concurrency, cache bounds and startup/peak memory within approved validation scope. No catalogue must be present for API mode; optional catalogue tests remain separate.
- [ ] Preserve separate forecast issue/valid/freshness metadata and existing MET/NOAA evidence. Additional weather APIs require their own suitability and validation; no averaging incompatible products.
- [ ] Validate whichever historical path is selected against source/statistic/years/missingness/timezone/provenance requirements. Existing bulk-specific raw/decoded lineage and immutable release checks apply when that path is enabled; API history needs equivalent traceable source and quality evidence. Existing sparse samples do not establish a 1991–2020 baseline.
- [ ] Check source-backed event seasons, approximate annual guidance versus precise instants, unsupported years/radiants and geometry limits. API adoption does not waive scientific/rights checks.
- [ ] Check selected runtime/configuration and current/rollback allocations, redaction, real TLS/proxy/logging and deployment rollback. Offline checks must retain false hosted/official flags.
- [ ] Record native evidence by exact host/package, search capability, fresh/retained session and full versus targeted retest. Preserve Claude deferral and bounded existing Codex evidence honestly.

## Historical evidence snapshots retained

The original matrix audit was **15 October 2026**, a read-only audit of baseline `c64d9fd`, branch `codex/plugin-v1`. It reported **12 Done / 9 Partial / 6 Not started** and **6 / 10 / 3 groups**, with no implementation/acquisition/client/release evidence added. Its geography next actions assumed admitted global editions and measured bulk builds; those next actions are superseded above.

The [pipeline wave](offline-pipelines-wave.md) and [producer integration](offline-producer-integration-wave.md) superseded claims that raw supervision, bounded history publication, membership enrichment, observation aggregation and release dependency checks were wholly absent. Their bounded results never established real global data or host acceptance. The producer snapshot recorded **765 Node cases / 764 pass / one existing skip**, **86 OSM / 83 pass / three skips**, **46 ERA5 passes**, with types/build/packages/offline runtimes passing. These are dated counts, not newly run results or latest-revision claims.

Earlier observations included three-place 2025 history, March historical samples, bounded geography membership and the 1.0.12 Codex photography pass. Later [implementation status](implementation-status.md), [source resolution](source-resolution-delivery.md), [global preparation](global-preparation-delivery.md) and [acquisition readiness](acquisition-readiness-delivery.md) preserve subsequent corrections, event context, retained-source and quarantine evidence. Original failures remain historical facts; corrected failures are not reintroduced as current defects. Retained evidence does not mean the corresponding local dataset still exists after cleanup.

## Readiness decision

**API discovery/multi-weather implementation and initial bounded live connectivity are complete; capability gaps and public-launch acceptance remain open.** Follow the tracker’s six completion blocks. Historical admission/implementation, event evidence, geographic combinations, measured assembled behavior and hosted/client/release gates remain open. Preserve **12/9/6 across 27 headings** until actual acceptance evidence changes. Catalogue deferral changes the work required, not the completion count.

## V1 conversation acceptance amendment — 17 October 2026

[Approved contract](../product/v1-outdoor-discovery-contract.md) and [implementation plan](../superpowers/plans/2026-10-17-v1-outdoor-conversation.md) add explicit outdoor-default discovery, activity suitability, constraint continuity and useful clarification acceptance within existing Tasks **8, 12B and 15**. Existing Done evidence for 10A/11A/11B remains scoped to its original local deliverables and receives regression coverage. This amendment does not create tickets, move agreed work to V2, or claim a completed original criterion. Original counts remain 12/9/6 until evidence closes a full criterion.

Internal 1.0.x package revisions distinguish changed instructions and installed bytes; they are still the same V1 product scope. Existing source/history/event, native client, hosting, publication and pilot requirements remain in the six tracker blocks.
