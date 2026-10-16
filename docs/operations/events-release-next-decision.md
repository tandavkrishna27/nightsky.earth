# Events release: next decision

**Current reconciliation:** [S2 event coverage matrix](s2-events-coverage-matrix.md) supersedes this dated snapshot's 26-peak/no-2027 statements and old overlap counts. It preserves the unresolved science/rights gates.

**Subsequent authorized evidence:** [16 October public source check](public-source-check-20261016.md) supersedes source-discovery unknowns below where explicitly stated; no runtime data or original completion gate was promoted.

Local audit: 16 October 2026, baseline `c7e898c`. Scope remains the broad NightSky.earth experience: beginner/family stargazing, telescope and photography planning, meteor/eclipses/aurora, place discovery, comparisons and seasonal travel. This document changes no acceptance gate or implementation. Only retained local source/code/documents were inspected; no network, download, installation, model, test, deployment or commit was performed.

## Current support against the V1 promise

| Capability | Actual retained implementation | Remaining acceptance evidence |
|---|---|---|
| Meteor maxima | `meteorPeaks.ts` reads exactly 13 original NASA MEO Table 3 UTC instants for each of 2025 and 2026: QUA, ETA, ZPE, ARI, SSG, SDA, CAP, PER, DSX, DRA, AND, GEM, URS. Inclusive instant filtering; source/vintage per year. | Other-year maintenance, missing shower timings and complete activity coverage. A maximum is not an activity interval. |
| Meteor radiants | Twelve GMN fitted models: PER, GEM, ORI, ETA, LYR, SDA, QUA, LEO, CAP, NTA, STA, HYD. Planner samples one selected shower at session start/midpoint/end within each nominal fit domain. | Full-season validity and missing seven NASA-only models; continuous visibility and source-supported uncertainty. Three samples do not establish continuous visibility or personal rates. |
| Typical activity | ETA 35–60 degrees and ORI 195–220 degrees, J2000 source reference metadata. | Exact solar-longitude correction/time convention and independent boundaries; runtime explicitly has no UTC conversion or requested-window overlap. Zero accepted UTC meteor seasons. |
| Eclipse | Astronomy Engine 2.1.19 local solar contacts and lunar event intervals. Solar contact altitudes and bounded model-conditional lunar horizon classification. | Retain source/time-model/tolerance/reference validation and unresolved grazing states in final evidence. No terrain/weather/detectability guarantee or new universal accuracy horizon. |
| Moon phase; equinox/solstice | Calculated quarter instants with Moon altitude at the instant; calculated seasonal markers with visibility not evaluated. | Final release boundary/time-zone/reference evidence; instant geometry does not establish a whole observing window. |
| Opposition; solar alignment | Mars/Jupiter/Saturn/Uranus/Neptune opposition; superior solar alignments Mercury–Neptune and inferior Mercury/Venus. Relative simultaneous heliocentric longitude ignores latitude. Engineering horizon 1900–2100; local visibility not evaluated. | Preserve definition and partial class. Seven retained NAOJ 2026 comparisons use a different geocentric definition and a two-hour identity threshold, not all-years accuracy. |
| Apparent planet-pair conjunction / minimum sky separation | Explicitly unsupported inside partial conjunction coverage. | Defined algorithm or admitted maintained source, independent reference/tolerance, supported horizon and local planning integration. Solar alignment cannot substitute. |
| Occultations; comets; other transients | Explicit unsupported classes and reasons in `catalog.ts`. No admitted maintained catalogs/feeds. | Source/rights/freshness/coverage/local-visibility decision for each requested capability. No unrecorded feature deferral. |
| Aurora | Separate short-horizon NOAA SWPC provider/planning context, not a maintained complete event calendar. | Actual freshness/valid-time/provider and native journey release evidence; no long-range sighting guarantee. |

Public event inputs cover at most 366 days; default limit 15, maximum 25 dated results, with explicit truncation. Default discovery includes unsupported classes and therefore reports partial. Meteor and conjunction requests remain partial independently of whether any event is returned. Broad night-sky planning also depends on astronomy, weather, access/geography/history and host/client gates in the release matrix; closing event evidence alone cannot close V1.

## Calendar validity on 2026-10-16

The 2025 records are historical evidence. Ten of thirteen 2026 maxima are already past. Three retained future maxima remain: AND **2026-11-28T05:12:00Z**, GEM **2026-12-14T13:00:00Z**, URS **2026-12-22T15:54:00Z**. Only GEM has a retained radiant model among these three, and it remains constrained to its own fit domain. There is no retained ORI/LEO/NTA/STA/HYD/LYR maximum; October Orionid planning must not invent one.

**No 2027 peak artifact is installed.** The 15 October bounded NASA metadata searches returned zero records but did not prove no report exists; search recall was unvalidated. The reports' earlier issue dates do not justify guessing a 2027 publication date or URL. A 2027 query can still calculate supported recurring astronomy and bounded radiant geometry, but it cannot supply 2027 meteor maxima or seasons. The model evaluator's 2018–2030 year bound is an engineering bound, not calendar validity. Radiant observations end 2021-05-22; annual reuse outside 2018-12-10–2021-05-22 is explicitly extrapolation.

## Coverage and rights gaps remain independent

The retained shower union is 19 codes. Timing/model overlap: **CAP ETA GEM PER QUA SDA**. Peak-only: **AND ARI DRA DSX SSG URS ZPE**. Model-only: **HYD LEO LYR NTA ORI STA**. Every row lacks a complete accepted UTC season. Daytime/radar applicability must remain explicit; a NASA low-Earth-orbit risk forecast is not a naked-eye observing recommendation.

NASA 2026 metadata records PUBLIC distribution / GOV_PUBLIC_USE_PERMITTED and `belongsToUsGov:false`; retained wording correctly avoids inferring ownership. The 2025 artifact retains its separately reviewed public-use statement. GMN fitted coefficients and Egal original intervals retain CC BY 4.0 attribution/modification notices. The old `meteor-showers-v1.json` is inactive and unresolved for provenance/reuse; its convenient dates cannot be promoted. IMO 2026 calendar accessibility supplied no accepted reuse grant. A separate De Keyser paper has CC BY-NC conditions; permissive CC BY software does not relicense that paper or create a season catalog.

## What retained evidence can be promoted now

- The exact 26 existing maxima, 12 bounded fits, two reference intervals and seven coarse planet comparisons can populate the final coverage/provenance packet with their existing limitations. They cannot acquire stronger precision, season, rate, recurrence or visibility claims.
- Retained NASA flux/fluence header findings can populate a rejected/conditional source worksheet: aggregate profiles lack per-shower season columns. No sampled values or body dataset is available to import; decomposing aggregate curves requires a new documented scientific method.
- Retained GMN product license and BIRA software documentation can support concrete future acquisition/method proposals. Neither is an already acquired observation series or validated output.
- Existing explicit unsupported/partial behavior is valid user-facing handling while evidence is absent. It is not acceptance of narrower scope or closure of Task 6/Task 0 source gates.

## Minimum next request: free metadata and scientific facts first

Prepare one bounded metadata-only request, with an explicit request count, per-response/aggregate byte caps, timeout/no-retry rule and sanitized evidence destination. No data bodies, software archives, model runs or contacts follow automatically. The request should answer, in this order:

1. **2027 maintenance:** verify official NTRS query semantics, then exact forecast title/author search and inspect a discovered record/abstract only. Retain record ID, issue/version, exact asset URL/size, rights/distribution/third-party fields and coverage. If unavailable, record that bounded result and next refresh decision; never recur 2026 dates. URLs already retained: https://ntrs.nasa.gov/api/citations/search?keyword=2027%20meteoroid and https://ntrs.nasa.gov/api/citations/search?keyword=2027 .
2. **ETA/ORI conversion gate:** obtain a primary method/version actually linked to Egal A58 specifying longitude origin/frame/equinox, geometric/apparent corrections, input time scale, endpoint definition and precision. Then identify an independently equivalent reference and finite supported-year horizon before writing a converter. Retained routes: https://doi.org/10.1051/0004-6361/202038115 ; https://physics.uwo.ca/~pwiegert/papers/2020AA-Egal-01.pdf ; https://academic.oup.com/mnras/article/446/4/3669/2892434 ; https://ssd.jpl.nasa.gov/horizons/manual.html . J2000 alone is insufficient.
3. **Per-code gaps:** identify exact rights-cleared original source/table and version for the six missing peak codes and seven missing radiant codes, plus season definitions/validity for all 19 retained codes. Record visual/radar/daytime applicability, observational effort/missingness, update cadence, license and exact future sample size. Retained leads: https://globalmeteornetwork.org/data/ ; https://arxiv.org/abs/2205.15423v1 ; https://imo.net/files/meteor-shower/cal2026.pdf . An observational route needs quality cuts, shower assignment and an explicit activity definition before any bulk request.
4. **Separate event admissions:** list exact free source/algorithm candidates, definitions, rights, freshness, supported years and reference tolerances for apparent planet pairs, occultations, comets and transients. The retained roadmap mentions conditional JPL; its manual https://ssd.jpl.nasa.gov/horizons/manual.html is a starting reference, not an admitted operational feed. No retained complete catalog can be promoted for these classes.

Existing exact peak/rights URLs for the request packet: https://ntrs.nasa.gov/api/citations/20240012381/downloads/LEO_Forecast_2025.pdf ; https://ntrs.nasa.gov/citations/20240012381 ; https://ntrs.nasa.gov/api/citations/20250009524/downloads/LEO_Forecast_2026.pdf ; https://ntrs.nasa.gov/api/citations/20250009524 . These are source leads already retained locally; this audit did not revalidate them online.

## Release decision

**Still missing for original acceptance:** complete meteor season/source/model coverage, calendar maintenance and dated/geometry validation under Task 6; precise source dispositions under Task 0; and the separate actual production data, host, native-client, identity, policy, official validation, submission/publication and pilot gates in `v1-remaining-ticket-release-matrix.md`. Keep its 12 Done / 9 Partial / 6 Not started accounting. A useful near-peak plan and honest unsupported states do not close the original full-coverage gate.

**Optional or conditional work:** a particular implementation route (bulk GMN analysis, BIRA fitting software, live JPL, apparent-pair algorithm), personal meteor rates/outburst probabilities and comprehensive transient discovery are not automatically mandated merely because a source lead exists. Each needs an explicit capability/source decision. The execution plan already permits unsupported transient classes; do not relabel those as supported, silently narrow the broader experience, or silently defer a capability that remains in the approved acceptance requirements. Resolve any proposed scope change explicitly before changing acceptance. No broad new software wave is justified until a scientific/source fact clears a specific gap.
