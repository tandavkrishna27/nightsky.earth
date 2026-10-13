# NightSky V1 implementation status

Audit: 14 October 2026, `codex/plugin-v1` / `.worktrees/plugin-v1`. Status is local-development evidence; it does not establish deployment, official validation or launch. The individual publisher is based in India; the exact verified legal name is still absent. Monitored support is `nightsky.earth2026@gmail.com`.

## Counts

| Level | Done | Partial | Not started | Total |
|---|---:|---:|---:|---:|
| Numbered groups 0–18 | 3 | 13 | 3 | 19 |
| Separately executable headings | 7 | 14 | 6 | 27 |

A group is Done only when all its lettered headings are Done. The Done groups are 1, 5 and 11; group 4 remains Partial because 4B requires a real draft. Completed headings are 1, 4, 5, 7B and 11A–11C. Tasks 13 and 15 are now Partial because local policy pages and review artifacts exist. Final cross-platform counts are recorded below from the integration owner; earlier wave counts remain historical snapshots in their linked records.

## All 27 headings

| Task | Status | Evidence / remaining gate |
|---|---|---|
| 0 — sources/scale/hosting | Partial | Ten distinct MET points including Arctic/ocean; four GETs in the coverage wave including two expired conditional HTTP 200 refreshes. Real 1,327-candidate regional OSM artifact and reviewed ERA5 sample exist; four older historical source jobs completed without a new baseline. Full-season meteor rights/model, global source scale, independent forecast, VIIRS and selected host/budgets remain open. |
| 1 — SDK/runtime compatibility | Done | Pinned SDK, transport/Inspector fixtures and local runtime evidence; production Host/proxy validation remains separate. |
| 2 — contracts/test harness | Partial | Locale, requested units and provenance budgets implemented; Node/Python two-OS CI prepared. Local acceptance independently audited: nine named tests, all twelve schemas/annotations, locale/privacy/native-evidence and current frozen documentation are verified. Current wave CI must pass before promoting this heading to Done. See three-data-lanes-wave.md. |
| 3 — endpoint/registry | Partial | Twelve stateless tools, consented metadata, bounded subject/IP counters, provider controls and safe errors implemented. Minimal shared request logger captures fixed route/status/duration only. Hosted logging/retention/replica budgets remain open. |
| 3B — hosted OpenAI connection | Not started | No staging endpoint or real assistant connection. |
| 3C — verified publisher/endpoint | Not started | Individual India direction confirmed; exact verified legal name, project/endpoint ownership and permanent hostname missing. |
| 4 — named places/time zones | Done | Global GeoNames city artifact plus reviewed Hanle supplement; named-place ambiguity, local times and metadata handling implemented. No arbitrary-coordinate boundary claim. |
| 4B — real draft location scan | Not started | Requires actual draft and hosted endpoint. |
| 5 — astronomy/targets | Done | Independent JPL/USNO/NASA references and bounded local calculations; horizon/terrain/date-range limits retained. |
| 6 — events/catalogs | Partial | Thirteen specifically rights-reviewed NASA MEO 2026 peak instants enabled; old recurring dates are audit-only. Eight CC BY GMN bounded models and five independent JPL horizon references; lunar endpoint defect fixed. Full seasons, other-year calendars, missing radiant codes and grazing crossings remain open. |
| 7A — weather | Partial | MET parsing/periods/missing fields/shared controls; actual expiry-driven Arctic/ocean conditional refresh returned updated 200 twice. Offline 304 validator regression fixed. No live 304 or global accuracy/host readiness claim. |
| 7B — aurora | Done | NOAA adapter, source-shape/reuse screening, freshness/cache and local tool evidence. |
| 8 — candidate discovery | Partial | Real regional artifact: 1,327 named nodes/ways, 201,201 bytes, exact source/query/checksums and representative-point caveats. Deterministic strict rebuild and four-city MCP journey pass. Repository is private; a public database offer, global coverage, direct candidate plans and host fit remain gates. |
| 9 — historical context | Partial | Immutable three-place 2025 tiles remain active. Generic multi-year schema2 builder, approved-plan recovery and exact-byte immutability verified. Four of 52 older pilot chunks measured; no full-period release. Efficient grouped acquisition, real 30-year/global baseline and host acceptance remain open. |
| 10A — planner | Partial | Activity windows, target suggestions, timed guidance, weather/history/candidates and near-peak meteor evidence compose locally. Complete agreed geographic/seasonal journeys and hosted evidence remain open. |
| 10B — comparison | Partial | Two-to-five options preserve gaps, exact evidence, source-specific forecasts and windows; real multi-host checks remain. |
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

Current climate manifest is `.data/era5/tiles-2025-v3/manifest.json`, SHA-256 `9ffc58e9033984b235241525471d4e5b6571a6f1640147502b57d014c31181e8`; v1/v2 remain unchanged. Regional and one-year artifacts do not establish global coverage. Next work is exact pushed-revision CI evidence, full-season meteor and 30-year/global data decisions, legal identity and selected-host release gates. Final aggregate counts are documented below; deployment, official package validation and live pilot are not inferred from local changes.

## Final local verification supplied by integration owner

Windows: 367 discovered, 366 pass/one symlink skip. Clean Linux: 367 discovered, 363 pass/four ignored-artifact skips; symlink passes. Six OSM and 33 ERA5 Python tests pass on both platforms. Three TypeScript configurations and eight offline review sets pass. Actual v3 all-index capacity records 60 requests, zero errors/external calls and peak RSS 511,082,496 bytes. Exact pinned Node 24.21.0-trixie-slim Docker build and nonroot health/twelve tools/no-news checks pass. These local results do not approve a production host.

The regenerated rehearsal package SHA-256 is `446433abef11b172407e32992c6341b16988a353523ad67f0f76c99c67c6a3aa`; final endpoint/legal identity and official validation remain gates. Push/GitHub CI conclusions are pending. This paragraph supersedes the earlier awaiting-final-count statement; no hosted result is inferred.

## GitHub CI closure

All six jobs passed on implementation revision ac8089116c35f6c744ac78d6250171f6332a455a. Windows CI: 367 passed/four installed-artifact skips; Ubuntu CI: 364 passed/seven installed-artifact or Windows-only skips; 371 discovered per platform. Both Python matrices, typechecks, package, eight review sets, production audits and both production runtimes passed. Local Windows: 370 passed/one privilege skip. Exact run and Windows checkout/path fixes are in [CI verification](ci-verification.md). Original task counts remain unchanged because remaining source/host/release criteria are not met.

## Three data lanes — 14 October 2026

See [wave evidence](three-data-lanes-wave.md) for source deliveries, independent review fixes, 395-test harness, measured resource limits and remaining gates. Windows latest: 394 passed/one permission skip. Clean Linux: 388 passed/seven installed-artifact or Windows-only skips; zero failures. OSM6/ERA539 pass on both platforms. Type checks, eight offline review sets, builds, production audits and both runtimes pass. Rehearsal package SHA-256: 602a8919fd7f61b7e9f623d7c52ed18a3b5dd526661c1f58e4a5e82b7930cf8b. Current wave push/CI is pending; original counts will change only after exact acceptance evidence. No deployment.
