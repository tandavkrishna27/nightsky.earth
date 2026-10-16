# Events acquisition readiness — 16 October 2026

Prepared against worktree baseline `6ba39e9` for **S2-E2**, with S2-E1 coverage evidence. This is a readiness decision record, not source admission or acquisition authorization. Original Tasks 0/6, the [completion tracker](v1-completion-tracker.md) and the 12 Done / 9 Partial / 6 Not started accounting remain unchanged. S2-E2 stays open; this document closes no science gate and makes no reduction to intended V1 coverage.

## Current support and what acquisition can change

The active [catalog](../../server/events/catalog.ts), [schemas](../../shared/nightsky/events.ts), [peak loader](../../server/events/meteorPeaks.ts), [planet calculations](../../server/events/planetAlignments.ts) and [radiant evaluator](../../server/events/meteorRadiants.ts) determine current behavior. The [coverage matrix](s2-events-coverage-matrix.md), [retained acceptance](e2-retained-acceptance-delivery.md) and [source closure](event-source-closure.md) supply the retained evidence and unresolved decisions. Historical 26-peak/two-year or six-guidance statements are superseded; they must not be used as current counts.

| Capability | Supported/calculated now; exact temporal boundary | Guidance or missing acceptance | Rights and next acquisition decision |
| --- | --- | --- | --- |
| Moon phases | Four quarter instants using Astronomy Engine 2.1.19; no extra class-specific year gate in catalog | Phase-instant geometric Moon center horizon classification only; no accepted universal arbitrary-year accuracy envelope | MIT calculation path already avoids a calendar download. Retain finite independent reference evidence; define/validate the intended release horizon before claiming broad accuracy. |
| Equinoxes/solstices | Four calculated seasonal markers for each queried year; no extra class-specific year gate | Time markers, local visibility not evaluated | Same MIT path; no event table needed. Engine capability is not blanket year certification. |
| Eclipses | Local solar partial contacts/peak; lunar penumbral interval/peak; no extra class-specific year gate | Solar contact altitude/refraction and model-conditional lunar horizon classification; unresolved grazing stays not-evaluated. Terrain, weather and detectability remain separate | Same MIT path avoids bulk eclipse catalogs. Preserve NASA March 2026 lunar/JPL horizon reference settings and tolerances. Reykjavik solar assertion lacks precise retained primary attribution; do not relabel it a NASA reference. Wider horizon needs independent matching references. |
| Oppositions | Mars/Jupiter/Saturn/Uranus/Neptune; entire query inside 1900-01-01 through 2100-12-31 UTC | Simultaneous relative heliocentric longitude, latitude ignored; no local visibility | MIT engine already supplies calculation. Existing finite NAOJ comparisons are not a universal error bound. |
| Planetary conjunctions | Superior solar alignments Mercury–Neptune and inferior Mercury/Venus, same 1900–2100 bound | Partial class: apparent planet-pair conjunctions and minimum sky separation unavailable | No bulk data needed for existing alignments. If apparent pair events are required by the approved journey, define the event/correction/horizon and independent oracle before implementing; a local calculation may suffice. |
| Meteor maxima | **38** admitted NASA MEO forecast maxima: 13 in 2025, 13 in 2026, 12 in 2027 | No recurrence into other years; forecast timing is not visual suitability, season, rate or local visibility | Separate NTRS report identities/rights/vintages retained. Missing code/year evidence requires original qualified sources; do not re-fetch admitted reports merely to demonstrate readiness. |
| Meteor radiants | **12** GMN fits, calculation years **2018–2030**, each restricted to its nominal fit domain | Observations 2018-12-10–2021-05-22; annual extrapolation explicit. Three session samples are not continuous/full-season geometry | Moorhead/Clements/Vida arXiv 2205.15423v1, CC BY 4.0 with attribution/modification. Seven peak-only codes still need original numeric models, uncertainty, conventions and supported domains. |
| Typical meteor activity reference | ETA 35–60° and ORI 195–220°, J2000 source intervals | **No UTC conversion or requested-window overlap**; zero accepted complete UTC seasons across all 19 codes | Egal A&A 640 A58 original material CC BY 4.0. Resolve analysis-linked longitude/time convention and season definition before requesting boundary ephemerides. |
| Approximate meteor calendar | Ten typical annual verbal periods, listed below | Unfiltered guidance only: no exact dates, dated events, overlap, full seasons or annual maxima | Original licensed A58 wording and individually attributed narrative facts. No blanket license asserted for narrative pages; adjacent compiled tables/media excluded. |
| Occultation/comet/other | Explicit unsupported classes; no maintained admitted feed | No inferred event absence or local visibility | Keep original allowed unsupported dispositions visible. A selected maintained capability needs a separate source/rights/freshness/definition decision; downloading everything is not a V1 completion requirement. |
| Aurora | Separate NOAA SWPC short-horizon provider/planning context | Not a `search_sky_events` event type or long-range calendar; no sighting guarantee | Existing adapter avoids an annual aurora dataset. Preserve issue time, geographic coverage, freshness and unavailable behavior. |

Search windows are at most 366 days, default 15 and maximum 25 dated results, with explicit truncation. Supported calculations do not imply all classes are complete; missing or empty results never establish physical absence. Engine year behavior, meteor peak years and radiant calculation years are three separate domains.

## Exact meteor reconciliation

The authoritative artifacts are [2025 peaks](../../data/events/meteor-peaks-nasa-2025.json), [2026 peaks](../../data/events/meteor-peaks-nasa-2026.json), [2027 peaks](../../data/events/meteor-peaks-nasa-2027.json) and [GMN fits](../../data/events/meteor-radiants-gmn-2021.json). The 19-code union is retained in full.

| Set | Exact codes / counts | Acquisition implication |
| --- | --- | --- |
| Peak records in both 2025 and 2026 | AND ARI CAP DRA DSX ETA GEM PER QUA SDA SSG URS ZPE; 13 per year | Already retained; no recurrence authority. |
| Peak records in 2027 | ARI CAP DRA DSX ETA GEM LEO PER QUA SDA URS ZPE; 12 | LEO timing added; AND/SSG omissions do not mean inactivity. |
| Missing maxima in each of 2025/2026 | HYD LEO LYR NTA ORI STA; 6 per year | Find original year-specific sources and precision, not annual calendar substitutions. |
| Missing maxima in 2027 | AND HYD LYR NTA ORI SSG STA; 7 | Same independent source requirement. |
| Other years, including 2028 | No admitted maxima for any code | Next annual maintenance question is 2028; no assumed report existence/publication date. |
| Retained radiants | CAP ETA GEM HYD LEO LYR NTA ORI PER QUA SDA STA; 12 | Keep `nominalFitDays × 0.986 / 2` half-domain; fit days are not season lengths. |
| Missing radiants | AND ARI DRA DSX SSG URS ZPE; 7 | Numerical models/ephemerides with independent validation and appropriate daytime/radar/visual applicability needed. |
| Missing complete UTC seasons | All 19 codes | Define activity measure and endpoints, then source full domain and drift; no calendar download alone closes this. |
| Approximate annual guidance present | ETA ORI GEM LYR PER LEO QUA DSX ARI CAP; 10 | DSX/ARI explicitly daytime. Preserve verbal precision and not-evaluated overlap. |
| Approximate annual guidance absent | AND DRA HYD NTA SDA SSG STA URS ZPE; 9 | Individual discriminating original narrative facts may improve guidance; generic Delta Aquariids must not silently become SDA. |

Peak union is 14, radiant union 12, intersection 7 (CAP ETA GEM LEO PER QUA SDA), combined union 19. The inactive [website recurring calendar](../../data/events/meteor-showers-v1.json) cannot supply accepted seasons: NASA hosting of AMS-attributed compilation is not a retained reuse grant.

## Smallest useful source actions

| Priority / gate | Concrete next evidence | What becomes possible; stop condition |
| --- | --- | --- |
| 1 — ETA/ORI method | Public primary method or versioned author code explicitly tied to A58: longitude origin/frame/equinox, geometric/apparent corrections, input time scale, endpoint definition and precision | Only then choose equivalent independent ephemeris settings, finite years and tolerances. Existing J2000 helper or a generic Horizons column is insufficient. If linkage is absent, retain source-only metadata. |
| 2 — Complete seasons | Per-code original source/defined activity criterion for all 19; quality, shower assignment, observational effort, missingness, visual/radar/daytime applicability, year dependence and full-domain drift | Prepare a finite sample only after these choices and rights are documented. Exponential tails, fit widths and detection search intervals have no automatic physical season endpoints. |
| 3 — Missing radiants | Original numeric evidence for the seven missing codes; uncertainty, valid bins/interpolation, frame/time settings and independent reference | DSX paper has nonlinear wavelet/convex-hull behavior. Do not digitize a figure into one linear drift or interpret search resolution as uncertainty. |
| 4 — Missing annual maxima | Original table/version for the exact code/year gaps above, then 2028 discovery when an actual report exists | Apply existing report/table/rights/value admission and annual maintenance procedure. No shifted historical dates or copied per-year code counts. |
| 5 — Guidance gaps | Nine missing individual annual facts with exact source locator, identity and applicability | Guidance improvement only; cannot close priorities 1–4. Preserve attribution and exclude adjacent third-party calendars/rates/media. |
| 6 — Other selected capabilities | Approved journey decision for apparent pair conjunctions or a maintained occultation/comet feed; define geometry, supported years, freshness and rights | Prepare only the selected bounded validation path. Existing explicit unsupported states remain visible; no silent change to original acceptance. |

Retained candidate rights are materially different: GMN fitted tables and A58 original results are CC BY 4.0; NASA MEO reports have separate public-use records; the DSX arXiv distribution license is not a general catalog reuse grant. BIRA's separate 2025 software is CC BY 4.0, while the 2026 paper's version of record has CC BY-NC 4.0 in retained publisher metadata. A free product is not automatic noncommercial eligibility. The software route requires an original-analysis design and observations; it does not deliver a finished calendar or relicense the paper. See [date feasibility](meteor-date-feasibility.md) and [source closure](event-source-closure.md).

## Free calculations and public APIs that avoid bulk downloads

The installed MIT Astronomy Engine already calculates phase, season, eclipse and bounded planet alignment events; GMN direction evaluation uses retained coefficients. Neither path needs new bulk ephemerides or annual event tables for its existing behavior. These paths cannot manufacture meteor activity evidence.

Public documentation inspected on 16 October 2026 confirms [JPL Horizons API](https://ssd-api.jpl.nasa.gov/doc/horizons.html) supports bounded observer/vector requests, discrete times, explicit time scales and vector correction settings. This offers a candidate small reference-response path for independent geometry checks instead of downloading an ephemeris archive. It is **not an active runtime integration**, a meteor activity source, or proof of A58's convention. A response is still data acquisition and requires its own finite request allowance. No ephemeris query was made in this wave.

The [JPL API index](https://ssd-api.jpl.nasa.gov/doc/) and [Astronomy Engine primary repository](https://github.com/cosinekitty/astronomy) were inspected as public documentation only. Public endpoint availability is not blanket redistribution/operational acceptance; any new cached/live product still needs exact terms, attribution, request policy and provenance review. GEFS is optional weather enhancement; VIIRS is conditional ground-light context. Neither resolves meteor seasons or radiant gaps, and neither belongs in an event acquisition batch merely because its source is free.

## Finite packet and release handoff

No event dataset body is ready for unconditional acquisition based on this record. For each proposed action, name the exact unresolved question, canonical primary URL/version and content class first. The future packet must set request count, per-response/cumulative byte limits, wall deadline, redirect/retry policy, sanitized destination and stop conditions. Do not invent expected body sizes, acquire observation archives/ephemerides/software bundles, or submit provider jobs as a substitute for missing scientific definitions.

After evidence admission, preserve immutable source identity/hash, rights and modification notices, capability/year/domain boundaries, annual review procedure and explicit missingness. S2-R1 must assemble the actual release; S3 must measure it; S4 must exercise complete/no-source/outside-model/daytime/season-boundary/truncation journeys. Passing retained software checks or improving ten guidance periods cannot close those gates.

This wave inspected local adapters/artifacts and three public documentation pages. It changed only this document; no dataset acquisition, credentials, provider job, implementation change, application tests, deployment, commit or push occurred. Current counts were reconciled against the active JSON/loader and source matrix; existing test evidence is cited as retained evidence, not newly run verification.
