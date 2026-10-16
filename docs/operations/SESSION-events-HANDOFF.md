# Events lane handoff — 16 October 2026

Branch `codex/events-readiness`, assigned worktree `.worktrees/events-readiness`, starting at reviewed baseline `b6bb5726b61c5faf05f9e9073306fd19f7828918`. This record supersedes the ten-guidance count in [acquisition readiness](events-acquisition-readiness.md) and [source closure](event-source-closure.md) for this branch only. Original acceptance and totals **12 Done / 9 Partial / 6 Not started** remain unchanged. No global science/source gate is closed.

## Concrete implementation

Four individually attributed verbal facts extend annual guidance from ten to **fourteen** codes. The strict schema permits these four codes and fourteen unique rows while continuing to accept earlier payloads. No data/events artifact, forecast maximum, radiant coefficient/domain, UTC interval, overlap calculation or season endpoint changed. All new rows remain `typical-annual`, `verbal-period`, `requestedWindowOverlap: not-evaluated`; January 2028 returns no dated meteor events.

| Code | Retained wording | Primary identity and exact locator | Admission boundary |
| --- | --- | --- | --- |
| DRA | October | [Nemiroff and Bonnell, APOD, 2011-10-19](https://science.nasa.gov/image-article/apod-2011-october-19-draconid-meteors-over-spain/), Explanation final recurrence sentence | Full migrated page now exposes explicit yearly recurrence. Earlier search-excerpt-only rejection is superseded by reading that sentence. No 2011 timing, intensity, image or linked third-party content retained. |
| NTA | middle and late November | [Egal, Brown, Wiegert and Kipreos, arXiv 2202.05141v1](https://arxiv.org/html/2202.05141v1), Section 3.2, paragraph comparing average visual/video profiles | Original multiyear result distinguishes NTA from STA; a typical relative-activity period, not a per-year maximum or full season. |
| STA | October and early November | Same version/paragraph as NTA | Preserve the branch distinction and verbal qualifier; no rates, profiles, tables, figures or numeric coefficients imported. |
| HYD | December | [Nemiroff and Bonnell, APOD, 2023-09-09](https://science.nasa.gov/image-article/apod-2023-september-9-comet-nishimura-grows/), Explanation second paragraph, relative clause explicitly stating yearly recurrence | Retain only month fact. The surrounding parent-comet speculation and future-strength speculation are not admitted. Image credit/copyright remains separate; no media acquired. |

Pages inspected 2026-10-16. APOD pages identify their original dates/authors and a 2026-07-29 page update; the review date is distinct from publication. The arXiv version is fixed to v1 (2022-02-10), with nonexclusive repository distribution, not a general reuse grant. As with existing guidance, admission is narrow factual extraction with source locator, attribution and modification notice; no blanket article license/endorsement is asserted and `licenseUrl` is absent. The combined NTA/STA extracted wording is eight words. This does not import or relicense the study's numeric model.

Remaining guidance codes: **AND SDA SSG URS ZPE**. Read-only research also located [Jenniskens and Moskovitz's 2021 Andromedid report](https://www.emeteornews.net/2021/12/01/andromedid-activity-in-2021/), Introduction, with an early-November fact explicitly qualified as most years, and [Miskotte's 2026 SDA analysis](https://www.emeteornews.net/2026/03/30/the-southern-delta-aquariids-2000-2025/), Introduction and annual-analysis discussion, with an end-of-July fact. These remain candidates in this bounded handoff: review their recurrence qualifiers and attribution before admitting. NASA's [2024 SDA narrative](https://www.nasa.gov/blogs/watch-the-skies/2024/07/22/delta-aquariid-meteor-shower-best-seen-in-southern-hemisphere-in-late-july/) resolves shower identity, but its explicit recurrence sentence uses a hemispheric season and its exact July 28 peak is year-specific; neither was silently converted into an annual date.

## ETA/ORI: a historical implementation question, not just J2000

The [A58 v1 primary text](https://arxiv.org/html/2006.08576v1), Section 5.1.2, links MeteorFlux; Section 5.2.2 distinguishes one-degree radar/video bins from variable-bin unsmoothed visual profiles. Section 7's general activity intervals do not define a detection threshold or endpoint uncertainty. The [provider changelog](https://meteorflux.org/changelog.html) adds a directly linked version-history issue: the **2023-11-20** entry records a solar-longitude calculation bug fix; **2025-11-29** records GitHub source export. This does not prove that A58 is wrong or identify the bug's magnitude. It prevents treating today's implementation as evidence for the historical one without tracing the change.

The exact missing evidence is now:

1. Which historical CMOR and MeteorFlux functions/revisions produced the longitudes used in A58, separately for the observed profiles?
2. What origin/ecliptic realization/equinox, geometric or apparent corrections, and input time scale did those versions use?
3. Did the 2023 correction affect those historical values, and was any A58-era profile reprocessed?
4. What activity criterion and uncertainty justify treating 35, 60, 195 and 220 degrees as endpoints rather than approximate analysis limits?

[imo-vmdb 2.1.0 documentation](https://imo-vmdb.readthedocs.io/en/stable/about.html), Coordinate systems and time, supplies explicit UTC/Astropy built-in ephemeris/GeocentricMeanEcliptic J2000 settings. Its [pinned source](https://github.com/jankorichter/imo-vmdb/blob/6b43e3abfa2d73ea1c138dbe1c4d80fe7c5d1fe8/imo_vmdb/model/sky.py), lines 92–103 and 148–158, specifies the calculation and daily Cartesian interpolation. It is a separate importer/enricher of IMO CSVs, not established as A58's profile generator. A documented modern implementation is therefore a comparison candidate only. It was neither installed nor queried. No date solver was added; ETA/ORI remain source-only with unavailable UTC conversion.

## Missing numeric models and annual maxima

[Brown, Wong, Weryk and Wiegert, Icarus 207 (2010), 66–81](https://physics.uwo.ca/~pwiegert/papers/2010Icarus.pdf), DOI 10.1016/j.icarus.2009.11.015, Table 1 on printed pages 70–71 (PDF pages 5–6), is a specific original numeric lead for **ARI ZPE URS and older DSX**. It labels J2000 geocentric directions at maximum and assumed linear drifts with error. Sections 3–4 use wavelet detection above background for linked detection domains; those domains are not complete physical seasons. Section 2's individual measurement error is not model prediction uncertainty; Section 5.1 flags Ursid velocity geometry bias. The author-hosted paper carries Elsevier copyright, with no blanket reuse grant established. No coefficients were imported. Exact open questions: permissible normalized reuse, solar-longitude/time convention, fit support versus detection support, meaning of each uncertainty, independent direction reference and accepted year horizon.

The [2022 Taurid study](https://arxiv.org/html/2202.05141v1), Section 5.2/Table 2, also provides a **ZPE** original drift lead; apparent direction convention, fit validity/uncertainty and reuse acceptance need independent resolution. Its verbal-period admission above does not admit the numeric table. Existing [DSX nonlinear-method rejection](event-source-closure.md) remains in force. For **AND DRA SSG**, this investigation established no ready original numeric model with accepted uncertainty/domain/convention. SSG here means **Southern mu-Sagittariids (#69)**; Southern sigma-Sagittariids (**SSS #168**) cannot fill it. No identity substitution is allowed.

Annual maxima remain exactly 38: 13 each in 2025/2026 and 12 in 2027. Missing maxima: 2025/2026 **HYD LEO LYR NTA ORI STA**; 2027 **AND HYD LYR NTA ORI SSG STA**; every code in other years. A bounded public search for a 2028 NTRS forecast did not discover an exact report identity; this is not evidence of nonexistence or a publication schedule. No admitted report was re-downloaded and no annual date was shifted into another year.

## Conditional finite reference packet

This is a concrete validation design, **not an executed query or acquisition allowance**. Only after the four historical/endpoint questions above are resolved should a packet pin the matching correction/time settings and propose a reference comparison. A candidate first horizon is **2025–2027**, chosen to align with retained forecast years, not claimed as scientific support for seasons.

The finite matrix is four boundaries × three years = **12** independently referenced crossings. For each, retain method revision, observer/origin, frame/equinox, correction flags, input/output time scales, unrounded angular/time values and rounding policy. If settings match a JPL product, pin them using the [Horizons manual](https://ssd.jpl.nasa.gov/horizons/manual.html) and [API documentation](https://ssd-api.jpl.nasa.gov/doc/horizons.html). Do not substitute observer quantity 18 evaluated at emission time for a simultaneous geometric reversed Earth vector without demonstrating equivalence. If the analysis uses an apparent convention, the geometric GMN helper is not an oracle. Set angular/time tolerances from actual source precision and independent model differences before comparing; no invented numerical tolerance is accepted here.

A proposed future request ceiling is at most **12 requests**, **128 KiB per body**, **1.5 MiB cumulative**, and **60 seconds** overall, with no redirects/retries and stop on any setting mismatch, ambiguous metadata, budget breach or missing reference. These are proposed safety ceilings, not measured/expected response sizes or permission to acquire. If one bounded discrete-time request can serve several cases, reduce the request count rather than expanding the matrix. Use a sanitized ignored lane directory such as `tmp/events-boundary-reference/`; retain response identity/hash and settings separately from derived fixtures. No endpoint or time is to be issued until the method determines it and the finite request is separately authorized. If definitions remain unavailable, the deliverable is the exact four-question blocker above, with no query.

After accepted evidence, implementation would additionally need independent direction checks, calendar/year and date-line presentation, inclusive query overlap, boundary uncertainty, unavailable/out-of-horizon cases, unchanged radiant fit bounds and output budgets. A successful ephemeris comparison alone would still not define physical activity seasons or validate all nineteen showers.

## Verification, review and integration

Implementation uses `server/events/meteorCalendarGuidance.ts`, `shared/nightsky/events.ts`, and the existing `tests/events/meteorTypicalSeasons.test.ts`; no `tests/all.test.ts` registration is required. The user explicitly authorized updating the MCP count assertion outside the lane; the same MCP test's exact wording-list assertion also needs the four appended facts to exercise the final payload. Shared tracker untouched. The coordinator should reconcile fourteen guidance codes/five remaining guidance gaps in consolidated documents, without changing global totals or marking any season/radiant/annual-maximum gate complete.

Fresh local verification on the final code tree:

| Check | Result |
| --- | --- |
| TDD for DRA/NTA/STA | Four expected failures (missing facts plus discovery list), then 17/17 passing. |
| TDD for HYD | Two expected failures (missing fact plus discovery list), then included in the green focused run. |
| `node --import tsx --test tests/events/*.test.ts tests/nightsky/meteor-planning.test.ts tests/mcp/initialize.test.ts` | **81 passed**, zero failures/skips. An intermediate run caught the second MCP assertion's old ten-fact list; it was updated and this final run passed. |
| `npm test` | **936 tests: 930 passed, zero failed, six skipped**, 149.4 seconds. Five installed-data smoke tests skipped because ignored artifacts are absent; one symlink guard fixture skipped because Windows did not permit symlink creation. No artifacts acquired to fill those skips. |
| `npm run check` | All three TypeScript projects passed. |
| `npm run build:plugin` | Passed; local bundle produced. |
| `git diff --check` | Passed. |

Independent post-change science/code review checked the four full primary pages, the actual diff, strict/backward-compatible schema, source aggregation, fallback semantics and conditional reference packet. **No actionable science/code finding.** The reviewer corrected the extracted-word count above from nine to eight; that documentation correction is applied. No second full suite was run by the reviewer.

Final reviewed implementation commit: **`b763099eeb6bad222a7fe80c8c0a6ea2c552496f`**. The following handoff-only commit contains this record; no implementation changes follow that hash. The branch will be pushed and the six-job workflow watched for the exact delivery HEAD; the CI outcome/HEAD will be supplied in the delivery message, rather than borrowing baseline CI or another branch's run as evidence.

No dataset or API ephemeris acquisition, provider job, credential-file access, massive artifact copying, deployment, publication, external message, shared-tracker edit, `tests/all.test.ts` edit, other-branch merge/cherry-pick or heavy data build occurred. Dependencies were installed with `npm ci` in this worktree only. Public primary text/documentation was read; research findings are not admitted numerical models. Stop at this reviewed handoff; the unresolved scientific questions above remain open.
