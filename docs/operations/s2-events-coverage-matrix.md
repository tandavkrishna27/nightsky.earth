# S2-E2 event coverage reconciliation — 16 October 2026

Retained evidence only, prepared for [S2-E2 / N3](v1-completion-tracker.md). No acquisition, network/provider/model call, credential access, installation, deployment, runtime change or ticket closure is authorized or performed here. Original Tasks 0 and 6 in the [execution-ready plan](../superpowers/plans/2026-10-10-nightsky-v1-execution-ready.md) remain the acceptance source. This matrix advances reconciliation, not production-data acceptance. Original accounting remains 12 Done / 9 Partial / 6 Not started.

The [latest three-lane admission](source-admission-three-lane-wave-20261016.md) and [2027 admission](meteor-2027-source-admission.md) supersede the 26-peak/no-2027 calendar statements in [events release next decision](events-release-next-decision.md). The [14 October meteor matrix](meteor-coverage-matrix.md) now has a current preface but its body remains a dated snapshot. The six-code overlap sentence in [data sources](data-sources.md) also predates the 2027 timing addition. Preserve these records as history; use the counts below for current coverage.

## Active event surface

Implementation evidence: [catalog](../../server/events/catalog.ts), [event schemas](../../shared/nightsky/events.ts), [planet calculations](../../server/events/planetAlignments.ts). Public windows are at most 366 days, default result limit 15, maximum 25; truncation is explicit. Default discovery includes unsupported classes and reports partial. An empty list does not establish no physical events or activity.

| Class | Actual support / date bound | Local visibility and precision boundary | Rights / retained validation |
| --- | --- | --- | --- |
| Moon phase | Four quarter instants calculated with Astronomy Engine 2.1.19; no additional class-specific year gate in catalog | Geometric Moon center altitude at the phase instant; visible/not-visible is horizon geometry only | MIT engine; retained USNO phase cases in [astronomy validation](astronomy-validation-wave.md); ISO timestamp precision is not universal accuracy certification |
| Equinox/solstice | Four seasonal markers calculated per year; no additional class-specific year gate | Not evaluated; a time marker does not establish a visible object | Same engine/license/reference boundary |
| Eclipse | Local solar partial begin/peak/end and lunar penumbral windows; no additional class-specific year gate | Solar classification uses modeled contact altitudes with standard refraction. Lunar interval classification uses geometric Moon center altitude and bounded model-conditional rate envelope; unresolved grazing remains not-evaluated. No terrain/cloud/detectability guarantee | Engine internal ephemeris and ΔT/time-scale approximation; no bulk NASA eclipse table. [Catalog tests](../../tests/events/catalog.test.ts) retain Reykjavik 2026 solar start within 60 seconds; March 2026 lunar peak within 120 seconds and penumbral duration within 2 minutes against NASA. [Horizon tests](../../tests/events/localHorizon.test.ts) retain JPL cases. These are finite reference tolerances, not all-location/year certification |
| Meteor shower | Exactly 38 year-specific NASA forecast maxima, 2025–2027; no UTC seasons or recurring calendar | Every dated event is not-evaluated locally. Forecast maxima for low-Earth-orbit risk are not visual observing recommendations. UT-minute values represented in ISO UTC do not establish subminute UTC accuracy | Separate per-report public-use evidence; details below |
| Opposition | Mars, Jupiter, Saturn, Uranus, Neptune; entire query must fit 1900-01-01 through 2100-12-31 UTC | Relative simultaneous heliocentric ecliptic longitude, latitude ignored; no local visibility | MIT engine; [planet tests](../../tests/events/planetAlignments.test.ts) retain seven NAOJ 2026 comparisons within two hours across differing definitions; not a universal accuracy envelope |
| Planetary conjunction | Partial: superior solar alignments Mercury–Neptune, inferior Mercury/Venus, same 1900–2100 gate | No apparent planet-pair conjunction, minimum separation, closest-distance or local visibility claim. Solar alignment is not a viewing recommendation | Same engine and bounded comparison evidence |
| Occultation / comet / other | Unsupported with explicit reasons: no maintained admitted catalog/feed/calculation | No visibility or completeness claim | No live JPL path admitted. Missing feed is not an obligation to implement every transient |

The absence of a class-specific year gate for phase/season/eclipse is a code observation, not an accepted arbitrary-year scientific horizon. Keep the engine's time-model limitations and retained reference dates visible in assembled-release evidence.

Aurora is separate NOAA SWPC short-horizon provider/planning context ([adapter](../../server/providers/aurora/noaaSwpc.ts), [provider tests](../../tests/providers/aurora/noaaSwpc.test.ts)), not an event type in `search_sky_events` or a maintained long-range aurora calendar. Its source time/latitude/availability limits remain necessary; no guaranteed sighting follows.

## Exact meteor union

Independently recomputed from the three active JSON peak files and radiant JSON, rather than copying earlier prose. `—` means no retained record, never physical absence. Peak dates/times remain authoritative in the linked JSON and [exact value tests](../../tests/events/meteorPeaks.test.ts).

| Code | 2025 peak | 2026 peak | 2027 peak | Radiant fit | Typical longitude reference |
| --- | --- | --- | --- | --- | --- |
| AND | yes | yes | — | — | — |
| ARI | yes | yes | yes | — | — |
| CAP | yes | yes | yes | yes | — |
| DRA | yes | yes | yes | — | — |
| DSX | yes | yes | yes | — | — |
| ETA | yes | yes | yes | yes | 35–60° |
| GEM | yes | yes | yes | yes | — |
| HYD | — | — | — | yes | — |
| LEO | — | — | yes | yes | — |
| LYR | — | — | — | yes | — |
| NTA | — | — | — | yes | — |
| ORI | — | — | — | yes | 195–220° |
| PER | yes | yes | yes | yes | — |
| QUA | yes | yes | yes | yes | — |
| SDA | yes | yes | yes | yes | — |
| SSG | yes | yes | — | — | — |
| STA | — | — | — | yes | — |
| URS | yes | yes | yes | — | — |
| ZPE | yes | yes | yes | — | — |

- [2025](../../data/events/meteor-peaks-nasa-2025.json) / [2026](../../data/events/meteor-peaks-nasa-2026.json): 13 each, QUA ETA ZPE ARI SSG SDA CAP PER DSX DRA AND GEM URS.
- [2027](../../data/events/meteor-peaks-nasa-2027.json): 12, QUA ETA ZPE ARI SDA CAP PER DSX DRA LEO GEM URS. LEO is new timing; AND/SSG omission is not absence.
- Peak union: 14 codes; [radiant union](../../data/events/meteor-radiants-gmn-2021.json): 12; combined union: 19.
- Timed/model intersection: **CAP ETA GEM LEO PER QUA SDA** (7). Peak-only: **AND ARI DRA DSX SSG URS ZPE** (7). Model-only: **HYD LYR NTA ORI STA** (5).
- Per-year missing timings within this 19-code union: 2025/2026 **HYD LEO LYR NTA ORI STA** (6 each); 2027 **AND HYD LYR NTA ORI SSG STA** (7). No other-year maxima are admitted, including 2028; do not recur existing dates.

[Peak loader](../../server/events/meteorPeaks.ts) validates exact per-year counts/code sets and year membership, with inclusive instant filtering. Tests cover wrong-code same-count substitutions, unsupported year, exact instants/source vintage and 2027 partial/not-evaluated output. These are retained test definitions/results in the admission report; no application tests were run for this documentation change.

## Season, radiant and rights boundaries

All **19** rows have zero accepted complete UTC activity seasons; all dated meteor results lack activity start/end. The [old eight-shower recurring catalog](../../data/events/meteor-showers-v1.json) is not loaded by active server event code. Its website-facing dates cannot fill this gap: NASA-hosted AMS attribution does not supply an accepted redistribution grant. Preserve website compatibility without promoting that compilation.

[Radiant evaluator](../../server/events/meteorRadiants.ts) permits only 2018–2030 inclusive and each row's nominal longitude domain: `abs(signed offset) <= nominalFitDays × 0.986 / 2`. Nominal days are fit support, not full activity duration. Observations span 2018-12-10–2021-05-22; evaluation outside those observation dates is explicitly annual extrapolation. Planner start/mid/end samples establish sampled geometry, not continuous visibility. Geocentric mean direction is rotated to equatorial of date, without zenith attraction/refraction; Moon direction is topocentric. Parameter uncertainties are not propagated output confidence intervals. See [radiant tests](../../tests/events/meteorRadiants.test.ts) and [meteor planning tests](../../tests/nightsky/meteor-planning.test.ts).

[Typical seasons](../../server/events/meteorTypicalSeasons.ts) supply only ETA/ORI unfiltered reference metadata. Both retain `dateConversion: unavailable` and `requestedWindowOverlap: not-evaluated`; J2000 alone does not settle geometric/apparent solar-longitude convention. These intervals do not extend radiant fit domains or establish requested-year seasons. [Date feasibility](meteor-date-feasibility.md) retains the unresolved method and independent-reference gate.

| Source | Accepted retained rights / use | Not established |
| --- | --- | --- |
| NASA MEO 2025 / 2026 / 2027 Table 3 | NTRS 20240012381 / 20250009524 / 20260009360. Keep separate source/table/vintage/modification notices. 2025 retained public-use wording unchanged; 2026/2027 PUBLIC / GOV_PUBLIC_USE_PERMITTED with ownership not inferred | Annual recurrence, widths, ZHR, personal rates, outburst probabilities or visual suitability |
| Moorhead, Clements, Vida, arXiv 2205.15423v1 | CC BY 4.0, original fitted coefficients/Table 1 and nominal windows/Table 3, exact author/version attribution and modification notice | Rights to third-party comparison tables; full-season extrapolation |
| Egal et al. 2020 A&A 640 A58 | CC BY 4.0 original Sections 6.1/7, attribution/DOI/modification retained | Third-party compiled calendars, resolved longitude conversion or year-specific activity |
| Other leads | [Source metadata](events-provider-source-metadata-wave.md), [source decisions](v1-data-coverage-decisions.md), [radiant feasibility](meteor-radiant-feasibility.md) retain candidate evidence | IMO calendar accessibility is not a reuse grant; permissive BIRA software does not relicense a CC BY-NC paper. Aggregate NASA flux/fluence headers do not supply per-shower seasons |

## Optional feeds: disposition by responsibility

| Feed | Actual disposition | Remaining finite admission needs / acceptance effect |
| --- | --- | --- |
| NOAA GEFS | Weather ensemble enhancement, not an event calendar. No operational decoded GEFS path is admitted; MET-only with unavailable second model is the permitted fallback. No merged model score | Gate 0D: exact current product/edition/endpoint/grid/member/horizon, rights, decoder, issue/valid alignment, units/spread, caching/resource envelope and representative sample. Optional/non-blocking under Task 7A; do not make it an event-completion prerequisite |
| VIIRS Black Marble | Ground-light context, not events/weather/astronomical sky brightness. Retained catalog evidence identifies VNP46A2.002, v2.0, ArchiveSet 5200, nominal ~40 MB HDF5 daily global land/water product; no admitted granule/pixels/runtime proxy | Gate 0E: v2 guide units/scale/fill/QA and age/gap-fill semantics, exact granule/revision/rights, representative mask/calibration/usefulness. Unknown ground light and no darkness ranking is permitted pending validation; owner launch fallback acceptance remains visible. New Suomi-NPP observations cease 2026-11-02 per retained banner; continuity notice/successor equivalence unreviewed |

These catalogue facts and remaining needs come from [provider source metadata](events-provider-source-metadata-wave.md); they are not newly verified online. No source switch or successor admission is implied. World Atlas CC BY-NC exclusion remains separate; VIIRS radiance cannot fill a Bortle/SQM/dark-sky claim.

## Required acceptance and smallest next questions

Task 0A requires exact source rights/operations and a permitted source path or explicit unsupported/partial behavior for each required journey. Task 6 still requires maintained provenance/calendar refresh, recurring meteor/source audit, radiant drift over accepted activity windows, structured visible/partial/not-visible/unsupported/no-source outcomes and eclipse model/reference tolerance evidence. Near-peak fits and honest gaps do not close full-season acceptance. S2-E2 can close only after source/science dispositions are reviewed; S2-R1/S3/S4 still require actual release integration/measurement/journeys. No scope reduction is proposed.

The original plan explicitly permits unsupported unmaintained transients, ISS/satellites, seeing/transparency and faint-object catalogs. Live JPL is conditional; comprehensive transient discoveries, personal rates and a specific bulk-GMN/BIRA implementation route are not automatic requirements. Apparent planet-pair conjunctions remain an explicit partial boundary requiring a capability decision if expected in the approved journey; do not substitute solar alignment. These distinctions neither silently remove required meteor seasons nor require every possible feed.

Prioritize the smallest source/science questions before more engineering:

1. **ETA/ORI date conversion:** what exact primary method/version defines longitude origin/frame/equinox, geometric/apparent corrections, time scale, endpoints and precision? What independently equivalent reference and finite year horizon support conversion? Retained leads in [date feasibility](meteor-date-feasibility.md) and [next decision](events-release-next-decision.md) can be inspected first. This could resolve only two typical intervals, not all 19 seasons.
2. **Remaining per-code source facts:** which rights-cleared original source/table supplies defined full activity seasons for the 19-code retained union, missing timing sets above and seven missing radiant models? Record visual/daytime/radar applicability, year dependence, quality/missingness, drift validity and refresh cadence. Do not fabricate recurring dates or infer absence from omitted rows. An observational route needs an explicit activity definition, shower assignment and quality cuts before any data request.
3. **Maintenance:** record a repeatable annual discovery/admission/version/unsupported-year policy using the now-admitted 2027 source. The earlier 2027 discovery/report request is completed and must not be repeated as an unresolved task. A future-year source search is a new finite action, not recurrence authority.
4. **Optional source decisions:** retain GEFS as optional weather and VIIRS as conditional ground-light context. Only request their missing product/method facts if those capabilities are selected; no event science gap is solved by downloading them.

Any later metadata proposal should name discovered official documents/endpoints and exact question, with explicit request count, per-body/cumulative bytes, wall deadline, no retries/redirects, sanitized output paths and stop condition. A useful first packet would target the ETA/ORI convention and one exact per-code source/rights inventory; it should not re-fetch admitted NASA reports or include observational series, software archives, GRIB/HDF5, credentials or provider jobs. Retained sources do not justify exact future response sizes or a selected VIIRS tile/date, so no download allowance is invented here. Only after metadata resolves a concrete source/method should a separate finite sample/build proposal specify actual asset identity/size, raw/output limits, resource containment and scientific checks.

## Local document review

Self-review compares every acceptance distinction above with original Tasks 0/6 and the tracker, independently recomputes the JSON code sets/counts, and checks relative links and whitespace. No machine-readable duplicate was created: authoritative JSON plus this small reconciliation table avoid another divergent catalog. Fresh independent review remains the next gate. This document claims no new passing application tests, source acquisition or production readiness.
