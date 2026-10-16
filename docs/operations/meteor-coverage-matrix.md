# Meteor coverage matrix — 14 October 2026

**Current update, 16 October:** [2027 source admission](meteor-2027-source-admission.md) adds twelve exact reviewed UT-minute maxima. Active total is now 38 across 2025–2027; 2025/2026 data is unchanged. LEO has a 2027 peak, increasing timed/radiant overlap to seven codes across the catalogs; model-only codes are HYD, LYR, NTA, ORI and STA. The union remains 19. All full UTC seasons and other-year recurrence remain unsupported. The dated 2025/2026 tables and audit snapshots below retain their historical scope.

This is a source/runtime audit at baseline `f6d043b`, not acceptance of reduced V1 scope. The objective remains a global, free meteor journey. Current support is partial: 26 year-specific peak records, 12 bounded radiant models and two source-only typical intervals. Their union is **19 distinct shower codes**. There is no complete UTC activity season, guaranteed visibility or personal meteor-rate model for any row below.

## Sources and exact local paths

| Evidence | Active local path and consumer | Bounded accepted source |
|---|---|---|
| Year-specific maxima | `data/events/meteor-peaks-nasa-2025.json`, `data/events/meteor-peaks-nasa-2026.json` → `server/events/meteorPeaks.ts` → `server/events/catalog.ts` | NASA MEO original Table 3: [2025 report, page 9](https://ntrs.nasa.gov/api/citations/20240012381/downloads/LEO_Forecast_2025.pdf), [2026 report, page 8](https://ntrs.nasa.gov/api/citations/20250009524/downloads/LEO_Forecast_2026.pdf). Individual rights records [20240012381](https://ntrs.nasa.gov/citations/20240012381) and [20250009524](https://ntrs.nasa.gov/citations/20250009524) have per-report public-use evidence. Fresh 2026 API metadata records PUBLIC / GOV_PUBLIC_USE_PERMITTED and belongsToUsGov:false; ownership is not inferred. See [metadata correction](events-provider-source-metadata-wave.md). Issue dates: October 18, 2024 / October 17, 2025. No widths, rates or recurring years imported. |
| Radiant drift fits | `data/events/meteor-radiants-gmn-2021.json` → `server/events/meteorRadiants.ts` → `server/nightsky/planner.ts`; structured union in `shared/nightsky/meteors.ts` | Moorhead, Clements and Vida, [arXiv 2205.15423v1](https://arxiv.org/abs/2205.15423v1), original Table 1 coefficients and Table 3 nominal fit windows, CC BY 4.0. Observations **2018-12-10–2021-05-22**; chosen engineering calculation years **2018–2030 inclusive**, additionally restricted by each fitted longitude domain. |
| Typical interval metadata | `server/events/meteorTypicalSeasons.ts` → `server/events/catalog.ts`; optional `meteorTypicalSeasons` in `shared/nightsky/events.ts` | Egal et al. (2020), [A&A 640 A58](https://doi.org/10.1051/0004-6361/202038115), original Sections 6.1 and 7, CC BY 4.0. J2000 solar-longitude intervals; exact correction convention unresolved. |

The older `data/events/meteor-showers-v1.json` is **not loaded by active server event code**. Its convenient recurring dates cannot count as runtime season coverage. [Source decisions](v1-data-coverage-decisions.md), [peak/model expansion audit](events-season-expansion.md), [radiant provenance](meteor-radiant-feasibility.md), [typical metadata implementation](meteor-typical-seasons-wave.md) and [date-conversion investigation](meteor-date-feasibility.md) retain the relevant evidence and unresolved reuse/scientific gates.

## Whole retained shower union

Each peak cell is an exact UTC forecast instant. `—` means **no retained record/model**, never no physical activity. Radiant cells give the source anchor in J2000 solar longitude plus/minus the runtime half-width in degrees, followed by nominal total fit days. The rule is `abs(signed solar offset) <= nominalFitDays × 0.986 / 2`; endpoints are included. Nominal days are fit support, not season duration or an annual peak date.

| Code / retained name | 2025 NASA peak UTC | 2026 NASA peak UTC | Bounded radiant domain: anchor ± half-width; fit days | Typical activity source metadata |
|---|---|---|---|---|
| AND — Andromedids | 2025-12-03T09:16:00Z | 2026-11-28T05:12:00Z | — | — |
| ARI — Daytime Arietids | 2025-06-09T19:49:00Z | 2026-06-10T02:03:00Z | — | — |
| CAP — Alpha Capricornids | 2025-07-30T22:16:00Z | 2026-07-31T04:30:00Z | 125.48° ± 3.451°; 7 d | — |
| DRA — October Draconids | 2025-10-08T15:46:00Z | 2026-10-09T02:10:00Z | — | — |
| DSX — Daytime Sextantids | 2025-10-01T17:25:00Z | 2026-10-01T23:40:00Z | — | — |
| ETA — Eta Aquariids | 2025-05-06T10:16:00Z | 2026-05-06T16:30:00Z | 45.12° ± 4.437°; 9 d | 35–60° J2000, source-only |
| GEM — Geminids | 2025-12-14T06:55:00Z | 2026-12-14T13:00:00Z | 262.20° ± 1.479°; 3 d | — |
| HYD — Sigma Hydrids | — | — | 254.80° ± 7.395°; 15 d | — |
| LEO — Leonids | — | — | 235.50° ± 3.451°; 7 d | — |
| LYR — Lyrids | — | — | 32.50° ± 1.479°; 3 d | — |
| NTA — Northern Taurids | — | — | 235.80° ± 7.395°; 15 d | — |
| ORI — Orionids | — | — | 209.20° ± 3.451°; 7 d | 195–220° J2000, source-only |
| PER — Perseids | 2025-08-13T08:01:00Z | 2026-08-13T14:09:00Z | 140.10° ± 4.437°; 9 d | — |
| QUA — Quadrantids | 2025-01-03T12:27:00Z | 2026-01-03T18:38:00Z | 283.00° ± 0.493°; 1 d | — |
| SDA — Southern Delta Aquariids | 2025-07-29T18:26:00Z | 2026-07-30T00:39:00Z | 126.70° ± 2.465°; 5 d | — |
| SSG — Southern Mu Sagittariids | 2025-06-19T21:50:00Z | 2026-06-20T03:55:00Z | — | — |
| STA — Southern Taurids | — | — | 218.00° ± 9.367°; 19 d | — |
| URS — Ursids | 2025-12-22T09:44:00Z | 2026-12-22T15:54:00Z | — | — |
| ZPE — Daytime Zeta Perseids | 2025-06-03T00:34:00Z | 2026-06-03T06:48:00Z | — | — |

The same 13 unique codes occur in both annual peak catalogs. Peak/radiant intersection: **CAP, ETA, GEM, PER, QUA, SDA**. Peak without model: **AND, ARI, DRA, DSX, SSG, URS, ZPE**. Model without peak: **HYD, LEO, LYR, NTA, ORI, STA**. ETA and ORI are already in this union; the typical metadata introduces no additional code.

## What every row still lacks

| Capability | Status across the entire union | Runtime meaning |
|---|---|---|
| Other-year peak forecasts | Missing | No peak recurrence outside 2025/2026. A model's 2018–2030 calculation horizon does not supply those years' peaks. |
| UTC/calendar activity start and end | Missing | No row has accepted season dates. Schema capability for `startUtc`/`endUtc` or calendar windows does not establish meteor data. |
| Typical-season UTC conversion | Missing | ETA/ORI retain `dateConversion: unavailable` and `requestedWindowOverlap: not-evaluated`; all other rows lack even accepted typical-interval metadata. |
| Full-season radiant direction | Missing | Twelve models are available only inside their own short domains; remaining seven have no model. ETA/ORI source intervals do not widen fit support. |
| Local visibility / sighting guarantee | Missing | Every dated meteor event has `localVisibility: not-evaluated`. In-domain modeled altitude/azimuth and Moon separation are useful geometry, not a meteor detection claim. |
| Personal rates, year-specific intensity and outbursts | Missing | No accepted numerical rate or probability model. Forecast timing, radiant geometry, weather and moonlight cannot alone yield expected meteors per hour. |

Available radiant samples return geocentric mean directions transformed to equatorial of date and the observer's horizon, with no zenith attraction/refraction/terrain. Moon direction is topocentric. Published parameter uncertainties are retained, not propagated output confidence intervals. Annual reuse outside the exact observation dates is flagged as extrapolation even within 2018–2030.

## User journey and naming limits

| User request | Evidence the current journey can return | Unresolved requirement / presentation rule |
|---|---|---|
| “Plan for the Perseids near the 2026 maximum” | Exact retained peak if its instant lies inside the event query; three radiant samples at session start/midpoint/end if within PER domain; darkness/weather/site context where providers cover the request. | Useful limited near-peak plan, not complete seasonal support. A window near but excluding the peak can contain zero dated events. Do not infer no activity from that. |
| “Show all showers active tonight / during my trip” | Peak instants inside a bounded query; unfiltered ETA/ORI reference metadata. | No general season-overlap calendar. Search is at most 366 days, defaults to 15 and caps at 25 dated events with explicit truncation. Metadata is not a dated occurrence. |
| “When does the Orionid season end?” | ORI source interval and possibly in-domain direction for a specified session. | No converted end date. No retained NASA ORI peak in either year. Do not substitute the radiant anchor or fit endpoint as season end. |
| “Lyrids / Leonids in 2027” | Explicit target may select LYR/LEO direction if date lies within its domain and engineering year horizon. | No retained year-specific peak, UTC season or activity guarantee. Empty peak results stay partial. |
| “Taurids” / “Delta Aquariids” / “Capricornids” | Explicit `Northern Taurids` or `Southern Taurids` selects distinct models; runtime aliases map `Delta Aquariids` to SDA and `Capricornids` to CAP. | Bare `Taurids` is unmapped/ambiguous and selects no radiant. The narrower alias conventions do not establish full family coverage. Ask for a reviewed identity when ambiguous. |
| “Draconids / Ursids / Daytime Arietids” | Corresponding retained NASA peaks where in range. | Planner radiant aliases only cover the 12 modeled codes: these names/codes do not map to a radiant model. Their timing does not establish dark-sky/naked-eye suitability, especially for daytime showers. |
| “A different shower, such as June Bootids” | Generic meteor learning/preparation; explicit missing geometry/season evidence. | Anything outside the 19-code union has no retained source evidence; aliases outside the 12-model map select no radiant. Do not silently substitute a familiar shower or planet. |
| “How many will I personally see?” | Context and caveats; no numerical rate. | Needs validated visual response, activity/rate source, observing effort, site brightness, weather, limiting magnitude and uncertainty treatment. A reference ZHR alone would not answer this. |
| “Observe a well-known comet” | Event result explicitly lists `comet` unsupported. | No maintained comet catalog/feed. Familiarity of Halley's parent association is not present-day comet visibility; shower models do not supply comet ephemerides or detectability. |

The planner samples **one** selected shower. An explicit target is resolved through `meteorCode`; without a target, exactly one matching dated meteor event may select a modeled identity by name. Multiple/zero events do not auto-select a radiant. Full typed event evidence, including typical metadata, survives composed planning, but the visible event factor reads dated `events` only. Three samples are not continuous altitude or Moon-above-horizon coverage. The missing-target guidance now derives all twelve reviewed choices from the actual alias/model map, with regression coverage. This copy correction does not expand the underlying scientific model or season coverage.

## Priorities that retain full V1 scope

1. **Define and source complete seasons for the requested shower list.** Preserve the 19-code union and visibly record additional requested identities. Continue review of original licensed scientific results, with explicit season definition and visual/radar applicability; do not treat a peak list, exponential width or threshold as a natural physical season. The [date investigation](meteor-date-feasibility.md) gives the exact ETA/ORI convention and independent-boundary gate.
2. **Close source coverage mismatches.** Find admissible year-qualified peaks for ORI/LYR/LEO/NTA/STA/HYD and review model/observation sources for the seven peak-only codes. Maintain independent provenance and validity for each capability. Adding more forecast years requires original year-specific evidence; never repeat old instants.
3. **Support season-wide local geometry.** Obtain reviewed radiant validity across complete accepted seasons before extrapolating. Then evaluate continuous horizon/darkness/Moon context with explicit uncertainty and atmospheric limits. Existing global coordinate evaluation and named-place planning do not themselves establish scientific coverage.
4. **Keep rates and comets as separate evidence gates.** A licensed observational/modeling method is not a ready catalog. The BIRA CC BY software route, separate paper's conditional CC BY-NC license, GMN observation-effort needs and unresolved older activity-profile provenance are recorded in the linked audits. No new bulk analysis, provider/account/contact action or runtime source is authorized by this matrix.
5. **Reconcile product claims and regression journeys after evidence acceptance.** Prioritize no-event-but-in-season queries, season endpoints, unsupported years, ambiguous family names and daytime showers, in addition to near-peak happy paths. Preserve empty/unknown/outside-model states, source notices and local-time/date-line tests when dated seasons become defensible. Reduced scope requires explicit review; this matrix makes no such decision.

## Local audit checks

Local JSON inspection confirmed 13 unique rows in each peak year with identical code sets, 12 unique model codes, a six-code intersection and a 19-code deduplicated union. All 26 timestamps and 12 nominal windows above were compared with retained artifacts; half-widths were computed from the existing 0.986 rule. Typical codes/bounds, planner alias selection, three-sample behavior, event partial/not-evaluated flags and structured schema limits were checked against source code. No new external source requests, code/tests, deployment, commit or push occurred. This document alone is the deliverable; counts describe retained evidence rather than a completeness claim.

## Production event preparation — 15 October 2026

This append-only reconciliation retains the 19-code union, 26 exact peaks (13 in each of 2025/2026), 12 bounded radiants and two source-only intervals. Counts remain **12 Done / 9 Partial / 6 Not started**. No new event evidence was acquired, dates calculated or code/test changed.

### Event class and temporal coverage ledger

Read against current `server/events/catalog.ts`, `planetAlignments.ts` and the retained source records above. A calculation path is distinct from a complete observational catalog or launch acceptance.

| Event class | Current temporal/source basis | Scientific / coverage gate |
| --- | --- | --- |
| Meteor shower maxima | NASA MEO exact 2025 and 2026 catalogs only | All other requested years unavailable; no annual recurrence. Seven peak-only codes lack radiants, six model-only codes lack retained peaks, and all 19 lack complete accepted UTC seasons. |
| Meteor radiant geometry | GMN fits, observations 2018-12-10–2021-05-22; chosen calculation horizon 2018–2030, restricted to each fit interval | Horizon is not yearly peak/season evidence; extrapolation and fit boundaries remain explicit. |
| Meteor typical activity | ETA 35–60 degrees and ORI 195–220 degrees, source J2000 intervals only | Convention, independent boundary references and UTC overlap unresolved; no supported calendar-year range for converted seasons exists. |
| Eclipse | Astronomy Engine 2.1.19 local solar contacts and lunar event intervals, bounded requested windows | Model/contact/horizon definitions preserved; no terrain/weather/detectability guarantee. No new independently validated universal year horizon declared by this packet. |
| Moon phase | Astronomy Engine quarter instants; modeled Moon altitude at phase | Instant geometry is not continuous visibility or a dated observed source catalog. |
| Equinox/solstice | Astronomy Engine seasons for requested years | Time markers, no viewing visibility claim; library model and input date limits apply. |
| Opposition | Relative heliocentric-longitude calculation, engineering horizon 1900–2100 | Local visibility not evaluated; source/model validation domain distinct from meteor years. |
| Planetary conjunction | Inferior/superior solar alignments, engineering horizon 1900–2100 | Partial class: apparent planet-pair conjunctions and minimum sky-plane separation unavailable. |
| Occultation | Explicit unsupported state | No maintained admitted catalog. |
| Comet | Explicit unsupported state | No maintained rights-reviewed catalog/feed or detectability route. |
| Other/transient | Explicit unsupported state | No generic event source; aurora provider context does not establish a complete dated transient-event catalog. |

Event requests remain bounded (at most 366 days, default 15 and maximum 25 dated results, with truncation). They do not certify all events in all years. Existing per-shower rows remain the source of exact shower/year coverage; an empty peak result does not mean no activity.

### Prioritized implementable offline preparation

1. Freeze an ETA/ORI conversion evidence worksheet using [the date investigation](meteor-date-feasibility.md): original section/version and rights; origin/frame/equinox; geometric/apparent and correction terms; input time scale; boundary definition and precision; supported year horizon; independent equivalent reference and expected accuracy. Current status is unresolved, not “use existing J2000 helper.” No guessed dates or author contact.
2. Write the future conversion acceptance contract before implementation: separate typical derived season from year-specific maxima; root brackets/year assignment, endpoint inclusion, longitude wrapping, timestamp rounding/tolerance, independent reference comparisons, leap-year/year-transition/date-line cases and inclusive requested-window overlap. These are future validation requirements, not tests run here. The source's one-degree analysis and typical bounds must constrain claimed precision.
3. Prepare a per-code/per-capability admission table from the retained matrix: first ORI/LYR/LEO/NTA/STA/HYD missing maxima and seven peak-only missing radiants; then accepted activity evidence for the other 17 codes. Include visual/radar/daytime applicability and reuse rights. Additional years require exact year-specific evidence. Source-only intervals never widen radiant domains.
4. Prepare separate admission packets for apparent planet-pair events, occultations, comets and maintained transients, with algorithm/catalog definitions, year horizon, source rights, freshness and local-visibility limits. No substitution of solar alignments or shower parent associations.
5. Plan later regression journeys around no-peak-but-in-season windows, missing year/model, season endpoints, ambiguous family names, daytime showers, truncation and partial-class results. Preserve generic learning/preparation while evidence is missing; no personal rates from ZHR or geometry alone.

Freeze report: only local retained documents/source contracts read and this dated section appended; no external requests, calculations, tests, data import, models, commit, deployment or scope reduction. Remaining owner decisions concern evidence acquisition routes and resource/time bounds, not whether to silently drop missing event classes. Scientific convention acceptance must precede any ETA/ORI implementation claim.
