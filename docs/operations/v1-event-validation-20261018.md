# V1 event validation — 18 October 2026


> **19October owner scope amendment:** [Supported V1 calculations with explicit gaps](v1-bounded-event-scope-20261019.md) resolves the earlier pending decision. Wider missing scientific coverage is deferred enhancement; it is not newly supplied evidence. Known incorrect results, scientific domains, source rights and actual release gates remain mandatory. The historical findings below are retained.

This bounded validation supplements original Task 6 in `docs/superpowers/plans/2026-10-10-nightsky-v1-execution-ready.md`, the retained event gap inventory, and the 18 October maintenance decision. NightSky.earth retains all nineteen meteor identities and every existing event family. No source data, horizon, selected identity, model coefficient or scientific admission changed. There were no provider/data API calls, downloaded datasets, credentials, activation or deployment.

## Evidence added

`tests/events/eventConventionValidation.test.ts` adds two regressions:

- Radiant north-through-east azimuth and altitude are checked against separately expressed classical spherical geometry and IAU 1976 precession for PER, QUA and HYD, at northern, southern and equatorial observers. Literal admitted GMN anchor coefficients cover both ecliptic latitude signs and wrapped longitude. The runtime solar-longitude function only chooses an anchor evaluation date; it does not generate the expected direction. The preselected 0.08-degree engineering comparison envelope permits omitted nutation and precession-model differences. This checks frame and horizontal-direction conventions, not measured meteor accuracy or propagated uncertainty.
- The two retained real Venus/Jupiter RA crossings (August 2025 and June 2026) are checked using independently expressed mean-date projection and Cartesian RA extraction. One-hour bracketing checks the canonical second-body-minus-first-body crossing direction; nonzero angular separation prevents equality of RA being confused with a coincident direction. The geocentric ephemeris vectors come from the same Astronomy Engine dependency, so this is independent convention wiring, **not independent ephemeris validation**. The 0.08-degree envelope includes omitted nutation. Existing PAGASA time-only references retain their separate, coarse comparison limits and unknown correction conventions.

`tests/planning/eventValidation.test.ts` adds five real catalog-to-planner meteor journeys for a resolved named place, preserving timestamped samples, model states, source evidence and unknown weather:

| Selected target/window (UTC, 2026 unless stated) | Required result |
| --- | --- |
| PER, August 12 00:00–01:00 | Five available geometry samples, endpoints included; sourced mixed planning factor |
| PER, October 15 00:00–01:00 | Five outside-model samples, with no fabricated altitude or Moon separation |
| PER, August 17 19:00–20:00 | Two available samples followed by three outside-model samples; an in-fit start cannot validate the entire selected window |
| AND, November 14 00:00–01:00 | Unsupported identity geometry retained explicitly; no borrowing another shower model |
| PER, August 12 2031 00:00–01:00 | Outside calendar evaluation bound, despite annual recurrence context |

All five retain the complete-activity-season gap. These are selected-window samples at fifteen-minute spacing, not continuous visibility, complete-season radiant validity, physical inactivity or detectability assertions.

## Venus morning maximum-angle blocker

A targeted reinspection of the primary [NAOJ January 2027 page](https://www.nao.ac.jp/astro/sky/2027/01-topics02.html), on 18 October 2026, confirms that January 4 is greatest western elongation and describes morning viewing, but supplies neither clock time nor maximum angular magnitude. It adds no angle fixture. The already inspected [NAOJ 2025 almanac](https://eco.mtk.nao.ac.jp/koyomi/cande/pdf/cande2025.pdf#page=114) supplies the retained June 1 12h JCST time-only fact; its planetary phenomena table has no angle column. Attribution: (c) NAOJ; retained [reuse terms](https://eco.mtk.nao.ac.jp/koyomi/site/index.html.en).

The exact remaining input is an independently published Venus-west/morning **full geocentric Sun–Venus maximum angular distance**, with event date, angle precision and definition, and established reuse conditions. A time-bearing fixture also needs its stated time standard. No daily ephemeris angle, guessed Taipei UTC offset, self-computed engine angle or unrelated maximum is substituted. The existing 60-minute / 2-arcminute envelopes must remain fixed before evaluating a new admitted reference. This gap is still open.

## Original Task 6 criterion disposition

| Original obligation | Present evidence and exact remaining criterion |
| --- | --- |
| Moon phases, eclipses and visible/partial/not-visible event states | Existing catalog regressions exercise phase discovery, local eclipse circumstances, below-horizon and partial cases, NASA eclipse comparison and structured provenance. This wave changes none of their source/Delta-T admission; no arbitrary-year physical accuracy follows from passing numerical tests. |
| Recurring meteor events and audit of static years | Versioned source-qualified 2025–2027 maxima and maintenance manifest remain finite. Missing year/identity cells are preserved. The owner-selected breadth is all nineteen identities, not the twelve modeled radiants. No maxima may be shifted into another year. |
| Radiant drift over each activity window, altitude and Moon separation | Twelve bounded fits, retained coefficient/uncertainty/rights tests, existing independent solar-longitude raw reference and spherical altitude checks, new azimuth and selected-window state checks. Seven identities still lack admitted fits (AND ARI DRA DSX SSG URS ZPE). Zero complete UTC activity seasons means full-season drift validity has not been demonstrated. Complete-season scientific admission requires timing endpoint meaning/precision and matching independent direction/domain evidence for the maintained selection. |
| Major planetary events and local observing journey | Existing 21-pair/2025–2027 RA screening has synthetic ascending/descending/wrap/opposition/tangent/nonfinite/budget/endpoint tests and two coarse published Venus/Jupiter time comparisons. New mean-date projection checks strengthen convention evidence. Existing composed pair tests retain daylight/darkness, horizons, Moon, weather missing/stale/source cadence, location coordinates and bounded samples. Representative local composition is covered within that contract. Detailed independent apparent-coordinate correction equivalence and representative non-Venus/Jupiter physical reference cases are not established here. No completeness certification or closest-approach claim is added. |
| Greatest elongation | Existing independent Mercury east/west and Venus evening time/full-angle references, plus Venus morning time-only reference. Venus morning independent maximum angle remains blocked as above. Morning/evening global geometry does not certify a local observing window. |
| Unsupported / no-current-source results | Existing tests cover unsupported transients and other-year meteor gaps; new journeys cover unsupported radiant identity, wrong fit window and beyond-year model state. These must remain unavailable evidence, not inactivity claims. |
| Conditional JPL and relevant transient/occultation resources | Disabled/partial linked lookup remains the approved boundary. Live JPL is conditional, not a newly mandatory adapter. Current resource link/capability release verification still belongs to release work; this offline wave cannot certify live links or services. |
| Maintenance and provenance | Operational selection, named maintainer and annual October 18 review are recorded separately in `v1-event-maintenance-20261018.md`. No actual future review, new forecast year, refreshed accuracy or scheduled automation is implied. |

**Original Task 6 remains partial.** The missing scientific evidence above cannot be replaced by more synthetic tests or a narrower selected identity set. Complete pair-year absence certification is not a requirement under the retained finite partial contract.

## Verification

The seven new tests pass. A bounded run of those two files plus `planetAlignments.test.ts`, `meteorRadiants.test.ts`, `conjunctionWindow.test.ts`, `optional-event-evidence.test.ts` and `catalog.test.ts` passes **76/76** offline.

These are added regression tests for existing behavior; there was no production change and no claimed feature red-to-green cycle. The first composed-test run failed because its location fixture omitted the schema-required source; correcting that fixture yielded passing assertions. That setup error is not evidence of a production bug. No reference tolerance was tuned from failing engine output. Full-suite and type-check integration are owned by the parent validation wave; the two new files require imports in `tests/all.test.ts`.
