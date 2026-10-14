# NightSky V1 implementation status

Audit: 14 October 2026, `codex/plugin-v1` / `.worktrees/plugin-v1`. Status is local-development evidence; it does not establish deployment, official validation or launch. The individual publisher is based in India; the exact verified legal name is still absent. Monitored support is `nightsky.earth2026@gmail.com`.

## Counts

| Level | Done | Partial | Not started | Total |
|---|---:|---:|---:|---:|
| Numbered groups 0–18 | 6 | 10 | 3 | 19 |
| Separately executable headings | 12 | 9 | 6 | 27 |

A group is Done only when all its lettered headings are Done. The Done groups are 1, 2, 5, 7, 10 and 11; group 4 remains Partial because 4B requires a real draft. Completed headings are 1, 2, 3, 4, 5, 7A, 7B, 10A, 10B and 11A–11C. Tasks 13 and 15 are now Partial because local policy pages and review artifacts exist. Final cross-platform counts are recorded below from the integration owner; earlier wave counts remain historical snapshots in their linked records.

## All 27 headings

| Task | Status | Evidence / remaining gate |
|---|---|---|
| 0 — sources/scale/hosting | Partial | Ten distinct MET points including Arctic/ocean; four GETs in the coverage wave including two expired conditional HTTP 200 refreshes. Real 1,327-candidate regional OSM artifact and reviewed ERA5 sample exist; four older historical source jobs completed without a new baseline. Full-season meteor rights/model, global source scale, independent forecast, VIIRS and selected host/budgets remain open. |
| 1 — SDK/runtime compatibility | Done | Pinned SDK, transport/Inspector fixtures and local runtime evidence; production Host/proxy validation remains separate. |
| 2 — contracts/test harness | Done | Locale, requested units and provenance budgets implemented; Node/Python two-OS CI prepared. Local acceptance independently audited: nine named tests, all twelve schemas/annotations, locale/privacy/native-evidence and current frozen documentation are verified. Initial closure evidence is f521065; the current contract suite and all six CI jobs passed again at c20a381. See three-data-lanes-wave.md. |
| 3 — endpoint/registry | Done | Twelve stateless tools, consented metadata, bounded subject/IP counters, provider controls and safe errors implemented. Minimal shared request logger captures fixed route/status/duration only. Original local endpoint criteria passed actual transport and Inspector checks; hosted logging/retention/replica budgets remain in Tasks 3B/14. |
| 3B — hosted OpenAI connection | Not started | No staging endpoint or real assistant connection. |
| 3C — verified publisher/endpoint | Not started | Individual India direction confirmed; exact verified legal name, project/endpoint ownership and permanent hostname missing. |
| 4 — named places/time zones | Done | Global GeoNames city artifact plus reviewed Hanle supplement; named-place ambiguity, local times and metadata handling implemented. No arbitrary-coordinate boundary claim. |
| 4B — real draft location scan | Not started | Requires actual draft and hosted endpoint. |
| 5 — astronomy/targets | Done | Independent JPL/USNO/NASA references and bounded local calculations; horizon/terrain/date-range limits retained. |
| 6 — events/catalogs | Partial | Thirteen specifically rights-reviewed NASA MEO peak instants in each of 2025 and 2026; old recurring dates are audit-only. Twelve CC BY GMN bounded radiant models, integrated aliases and five independent JPL horizon references. Adaptive model-conditional lunar interval bounds now detect missed excursions and mark unresolved grazing cases unevaluated. Full seasons, other-year calendars, missing radiant codes and independent all-years extrema validation remain open; see coverage-accuracy-wave.md. |
| 7A — weather | Done | MET parsing/periods/missing fields/shared controls; actual expiry-driven Arctic/ocean conditional refresh returned updated 200 twice. Offline 304 validator regression fixed. Current offline expiry/304/outage/deadline/validator transport cases pass; scheduled jitter is inapplicable to demand-driven refresh. No live 304, global accuracy or host-readiness claim. |
| 7B — aurora | Done | NOAA adapter, source-shape/reuse screening, freshness/cache and local tool evidence. |
| 8 — candidate discovery | Partial | Real regional artifact: 1,327 named nodes/ways plus a separately reviewed 134-candidate Bhutan offline extract, exact source/checksums and representative-point caveats. Deterministic strict rebuild and four-city MCP journey pass. Checksum-pinned same-vintage shard composition and cached latitude-band queries pass 100,000-row synthetic reference checks. Repository is private; public database offer, global coverage, relations/polygon membership, direct candidate plans and host fit remain gates. |
| 9 — historical context | Partial | Immutable three-place 2025 tiles remain active. Generic multi-year schema2 builder, approved-plan recovery and exact-byte immutability verified. Four of 52 older pilot chunks measured; no full-period release. Grouped acquisition/partitioning and chronological schema2 publication pass offline fixtures; thirty-job plan and bounded four-job next proposal exist. Real grouped format/cost acceptance, 30-year/global baseline and host acceptance remain open. |
| 10A — planner | Done | Activity windows, target suggestions, timed guidance, weather/history/candidates and near-peak meteor evidence compose locally. All fifteen local MCP journeys and optional failure gaps pass original acceptance. Complete data coverage remains in Tasks 6/8/9; hosted clients remain in platform tasks. |
| 10B — comparison | Done | Two-to-five options preserve gaps, exact evidence, source-specific forecasts and windows; Original deterministic comparison acceptance passes, including source conflicts and five-option byte bounds. Actual client checks remain in Tasks 12B/15. |
| 11A — guidance | Done | Original cited learning/photography guidance; no invented gear settings. |
| 11B — recommendations/checklists | Done | Dated official links and activity/gear-aware checklists; store facts need maintenance. |
| 11C — workflows/skills | Done | Five canonical journeys and host guidance; interoperability does not prove live account compatibility. |
| 12A — OpenAI package | Partial | Deterministic rehearsal package/validator/eight manifest cases prepared; final identity/HTTPS endpoint, official validation and real draft pending. |
| 12B — Claude/Gemini | Partial | Separate route docs and test templates; intended live accounts/surfaces not connected. |
| 13 — policy/support | Partial | Local `/privacy`, `/terms`, `/support` drafts and genuine mail link; individual India/support facts recorded. Exact verified legal name, jurisdiction review, hosted URLs and observed retention pending. |
| 14 — deployment/operations | Partial | Standalone `dist/plugin.js` entry, Dockerfile.plugin and bounded artifact configuration prepared; selected-host TLS/capacity/logs/promotion/rollback not established. |
| 15 — review package | Partial | Five positive/three negative local loopback review cases and rehearsal evidence exist. Server probes are not host-refusal proof; final video, official validator and production review pending. |
| 16 — submit/publish | Not started | No submission or publication. |
| 17 — invited pilot | Not started | Measurement preparation only; no testers or observed outcomes. |
| 18 — separate website | Not started | Separate owner-scoped workstream. |

## Current evidence and next gates

[Local checklist](local-completion-checklist.md), [meteor feasibility](meteor-radiant-feasibility.md), [weather coverage](events-weather-coverage-wave.md), [real candidates](candidate-real-wave.md), [climate tiles](climate-tiles.md), [policy preparation](policy-preparation.md), [package readiness](local-package-readiness.md), [deployment](deployment.md) and [logging](mcp-data-flow-and-logging.md) record exact scopes.

Current climate manifest is `.data/era5/tiles-2025-v3/manifest.json`, SHA-256 `9ffc58e9033984b235241525471d4e5b6571a6f1640147502b57d014c31181e8`; v1/v2 remain unchanged. Regional and one-year artifacts do not establish global coverage. Next gates include current pushed-revision CI evidence, full-season meteor and 30-year/global data decisions, legal identity and selected-host release gates. Final aggregate counts are documented below; deployment, official package validation and live pilot are not inferred from local changes.

## Historical local verification before the data waves

Windows: 367 discovered, 366 pass/one symlink skip. Clean Linux: 367 discovered, 363 pass/four ignored-artifact skips; symlink passes. Six OSM and 33 ERA5 Python tests pass on both platforms. Three TypeScript configurations and eight offline review sets pass. Actual v3 all-index capacity records 60 requests, zero errors/external calls and peak RSS 511,082,496 bytes. Exact pinned Node 24.21.0-trixie-slim Docker build and nonroot health/twelve tools/no-news checks pass. These local results do not approve a production host.

The regenerated rehearsal package SHA-256 is `446433abef11b172407e32992c6341b16988a353523ad67f0f76c99c67c6a3aa`; final endpoint/legal identity and official validation remain gates. Push/GitHub CI conclusions are pending. This paragraph supersedes the earlier awaiting-final-count statement; no hosted result is inferred.

## Historical GitHub CI closure

All six jobs passed on implementation revision ac8089116c35f6c744ac78d6250171f6332a455a. Windows CI: 367 passed/four installed-artifact skips; Ubuntu CI: 364 passed/seven installed-artifact or Windows-only skips; 371 discovered per platform. Both Python matrices, typechecks, package, eight review sets, production audits and both production runtimes passed. Local Windows: 370 passed/one privilege skip. Exact run and Windows checkout/path fixes are in [CI verification](ci-verification.md). Original task counts remain unchanged because remaining source/host/release criteria are not met.

## Historical three data lanes — 14 October 2026

See [wave evidence](three-data-lanes-wave.md) for source deliveries, independent review fixes, 395-test harness, measured resource limits and remaining gates. Windows latest: 394 passed/one permission skip. Clean Linux: 388 passed/seven installed-artifact or Windows-only skips; zero failures. OSM6/ERA539 pass on both platforms. Type checks, eight offline review sets, builds, production audits and both runtimes pass. Rehearsal package SHA-256: 602a8919fd7f61b7e9f623d7c52ed18a3b5dd526661c1f58e4a5e82b7930cf8b. All six CI jobs passed for f521065d0af8a50ba664cd3d6923e9e9c6cc9210: https://github.com/tandavkrishna27/nightsky.earth/actions/runs/38456841770. Task 2 closes against its audited local criteria; source/host/release gates remain separate. No deployment.

## Historical data expansion — 14 October 2026

See [data-expansion-wave.md](data-expansion-wave.md) for 2025/2026 NASA timing, twelve radiants, a repeat-built Bhutan offline artifact and end-to-end grouped historical processing. Aggregate suite has 401 cases; frozen Windows 400 passed/one permission skip and clean Linux 394 passed/seven scope skips, zero failures. All six CI jobs passed for implementation revision `756e028` (run38462293288); see `ci-verification.md`. Fourteen OSM and forty-six ERA5 Python cases pass on both platforms. No additional CDS retrieval or deployment occurred. Original counts remain 8 Done/13 Partial/6 Not started because geographic/full-season/baseline and host/release criteria remain open.

## Offline readiness — 14 October 2026

Journey, resilience and operations lanes passed independent review. Weather validator inheritance and silent optional-service failures were reproduced and fixed. Guarded resolver-only preparation and compiled two-mode CI smoke checks are implemented. Frozen Windows431/430passed/1skip; Linux431/424passed/7skips; Python14/46 passed on both. Tasks 3/7A/10A/10B close after all six CI jobs passed for c20a381 (run38471282719). Current counts: 12 Done/9 Partial/6 Not started. See `local-ticket-closure.md` for every original heading and exact held evidence. No deployment or historical downloads.

## Coverage and accuracy — 14 October 2026

See [wave evidence](coverage-accuracy-wave.md) for adaptive lunar interval uncertainty, bounded same-vintage spot composition/indexed queries, independent review and concrete policy/Hetzner inputs. Windows447/446passed/1skip and Linux447/440passed/7skips have zero failures. Counts remain12 Done/9 Partial/6 Not started; no new source coverage, historical retrieval or deployment is inferred. All six CI jobs passed for implementation revision da56912 ([run38520264907](https://github.com/tandavkrishna27/nightsky.earth/actions/runs/38520264907)); follow-up documentation CI is observed separately.
