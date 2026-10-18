# V1 event and historical-context profile — 18 October 2026

Offline audit against base commit `1dad837` and the current runtime sources. This document records implemented boundaries and retained evidence, not source activation, ticket closure or release approval. No provider requests, browsing, downloads, credentials, deployment or scientific-policy changes were performed. API/search discovery does not require an owned global catalogue or database. It does not automatically remove the historical-context or selected-event journey.

## Event families and calculation boundaries

`server/events/catalog.ts` implements **seven supported event-type families** from the ten accepted input types. `shared/nightsky/events.ts` and `shared/nightsky/common.ts` constrain requests to positive windows of at most **366 days**, default **15** and maximum **25** returned events. Results are sorted and truncated explicitly. “Supported” describes the implemented calculation/source path, not complete worldwide visibility or independent accuracy certification.

| Family | Implemented support | Exact boundary and evidence |
| --- | --- | --- |
| Moon phases | New, first quarter, full and third quarter | Astronomy Engine 2.1.19; geometric Moon-centre altitude at the instant determines the horizon label. This does not establish detectability. `server/events/catalog.ts`, `findMoonPhases`. |
| Equinoxes/solstices | Four seasonal instants per calendar year | Engine calculation; `localVisibility:not-evaluated`. These are time markers, not observing recommendations. `findSeasons`. |
| Eclipses | Local solar contacts/obscuration; lunar penumbral interval and modeled obscuration | Solar classification uses returned contact altitudes with standard refraction; lunar classification uses bounded geometric Moon-altitude evaluation and an empirical model-rate envelope. Unresolved grazing cases remain `not-evaluated`. Terrain/weather/detectability remain unknown. `findEclipses`, `server/events/intervalVisibility.ts`, `docs/operations/event-accuracy-wave.md`. |
| Meteor showers | Year-specific NASA MEO maxima, plus separately typed reference guidance | Exactly **38 maxima: 13/13/12 for 2025/2026/2027**. No dated maxima for other years. Empty maxima results do not establish inactivity. See the inventory below. |
| Opposition | Mars, Jupiter, Saturn, Uranus and Neptune | Relative heliocentric ecliptic longitude, ignoring latitude; engineering range **1900-01-01 through 2100-12-31**, inclusive. Local visibility is not evaluated. `server/events/planetAlignments.ts`. |
| Planetary conjunction | Solar alignments plus separately defined planet-pair RA crossings | Solar superior conjunctions cover Mercury–Neptune; inferior conjunctions Mercury/Venus, within **1900–2100**. Pair screening covers **21 distinct Mercury–Neptune pairs**, **2025-01-01T00:00:00Z through 2027-12-31T23:59:59.999Z**, using geocentric right ascension of date with light-time/aberration. Pair completeness is explicitly **not certified**; stationary/tangent/numerical cases retain unresolved intervals. Neither definition supplies minimum sky separation/closest approach. `planetAlignments.ts`, `planetPairConjunctions.ts`. |
| Greatest elongation | Mercury and Venus, maximum geocentric three-dimensional Sun separation | Light-time/aberration; **1900–2100**. Morning/evening is Sun-relative geometry, not local darkness/horizon/detectability. `server/events/planetElongations.ts`. |

The shared date validator bounds request duration, but does **not** define a scientific supported-year/accuracy range for Moon phases, seasons or eclipses. Their lack of a separate runtime year gate must not be advertised as arbitrary-date accuracy. The engine/version, independent reference limits and future Earth-rotation uncertainty remain relevant. Existing fixed eclipse references are not certification for every location/date.

**Three explicitly unsupported event types:** occultation, comet and other. `catalog.ts` returns reasons rather than fabricated events. Satellite passes, transient discoveries, seeing/transparency and meteor rates/outbursts have no maintained core event pipeline. Conditional JPL lookup and optional reference tools do not automatically extend the core event registry.

Local conjunction geometry is separate from the crossing: `sampleConjunctionWindow` samples two planets, Sun and Moon every 15 minutes plus the endpoint, at most **97 samples / 24 hours / six pair events per plan**. These are sampled positions, not continuous visibility certification (`events-source-resolution-20261017.md`). The selected-shower radiant window uses the same 15-minute/endpoint and 97-sample ceiling; it does not fan out across every shower (`meteor-source-admission-20261017.md`).

The generic local target tool separately recognizes Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto and a fixed J2000 Milky Way core direction (`server/nightsky/astronomy.ts`). This finite list does not imply a complete star/deep-sky catalogue. Optional Public Universe reference/target tools remain a separate selected/admitted capability, not proof that core event or historical gaps are filled.

## Meteor inventory: identities are not a launch selection

`shared/nightsky/meteors.ts` retains **19 identities**. `data/events/meteor-evidence-inventory-v1.json` still has `selectionStatus:pending-owner-decision`, null maintained selection/maintenance owner/next review date, and an empty `completeActivityEvidence` array. `server/events/meteorCoverage.ts` independently preserves those limits. The union is an audit inventory; it does not mandate all nineteen for launch or authorize silently choosing a smaller set.

| Evidence | Exact retained set/count | Meaning |
| --- | --- | --- |
| NASA maxima, 2025 and 2026 | **13 each:** QUA ETA ZPE ARI SSG SDA CAP PER DSX DRA AND GEM URS | Year-specific forecast maxima only. Missing retained cells each year: HYD LEO LYR NTA ORI STA. |
| NASA maxima, 2027 | **12:** QUA ETA ZPE ARI SDA CAP PER DSX DRA LEO GEM URS | Missing retained cells: AND HYD LYR NTA ORI SSG STA. Source omission of AND/SSG is not physical absence. LEO's 2027 enhancement is not a recurring annual maximum. |
| Radiant fits | **12:** PER GEM ORI ETA LYR SDA QUA LEO CAP NTA STA HYD | Nominal local model domains only; seven missing models: AND ARI DRA DSX SSG URS ZPE. |
| Approximate annual verbal guidance | **18:** ETA ORI GEM LYR PER LEO QUA DSX ARI CAP DRA NTA STA HYD AND SDA URS ZPE | SSG has no admitted verbal row. All rows retain `requestedWindowOverlap:not-evaluated`; no exact annual dates are fabricated. ARI/DSX/ZPE retain daytime qualifications. |
| IGN civil guidance | **5:** LYR, LEO, ORI, DRA, URS | Respectively Apr 16–25, Nov 6–30, Oct 2–Nov 7, Oct 6–10, Dec 17–26. Source-named Gregorian days; endpoint clocks/timezone unspecified. DRA is a general northern period, not explicitly annual global activity. |
| Typical solar-longitude intervals | **2:** ETA **35–60°**, ORI **195–220°** | A&A A58 J2000 reference context with unresolved solar-longitude convention; UTC conversion unavailable and overlap unevaluated. |
| Complete activity seasons | **0** | No exact complete UTC activity season is admitted by the runtime inventory. Civil/verbal/longitude references cannot extend radiant fits or fill missing maxima. |

IGN maximum wording is **2026 only**, separate from machine UTC event rows: LYR around Apr 22 19:40 UT; LEO night Nov 17–18 around 23:45 UT; ORI Oct 21 with possible secondary peaks and unspecified time basis; DRA around Oct 9 02h UT; URS Dec 22 22h UT. Preserve the published precision/ambiguity and geographic qualification. Do not invent UTC midnight, repeat a 2026 forecast in another year, or use a date-only maximum as an exact instant (`server/events/meteorCivilGuidance.ts`).

### Radiant model domain

`data/events/meteor-radiants-gmn-2021.json` retains Moorhead/Clements/Vida Table 1 coefficients and Table 3 nominal fit widths, with observations **2018-12-10 through 2021-05-22**. The evaluator permits years **2018–2030**, flags reuse outside those observations as extrapolation, and additionally requires absolute signed J2000 solar-longitude offset no greater than `nominalFitDays × 0.986 / 2` degrees. A year inside that range alone is insufficient.

| Code | Reference longitude ° | Nominal fit days | Allowed half-width ° |
| --- | ---: | ---: | ---: |
| PER | 140.1 | 9 | 4.437 |
| GEM | 262.2 | 3 | 1.479 |
| ORI | 209.2 | 7 | 3.451 |
| ETA | 45.12 | 9 | 4.437 |
| LYR | 32.5 | 3 | 1.479 |
| SDA | 126.7 | 5 | 2.465 |
| QUA | 283 | 1 | 0.493 |
| LEO | 235.5 | 7 | 3.451 |
| CAP | 125.48 | 7 | 3.451 |
| NTA | 235.8 | 15 | 7.395 |
| STA | 218 | 19 | 9.367 |
| HYD | 254.8 | 15 | 7.395 |

These are geocentric mean radiants rotated to equatorial of date, without zenith attraction or refraction; Moon separation uses topocentric Moon direction. Published parameter uncertainties are not propagated position confidence intervals or sighting probabilities. Reference longitude is a fit anchor, not an annual maximum. Unsupported/outside-model samples carry reasons rather than substituted numbers (`server/events/meteorRadiants.ts`).

### Rights evidence retained, not freshly fetched

| Source | Actual retained admission/evidence |
| --- | --- |
| Astronomy Engine 2.1.19 | MIT source attribution/license in `catalog.ts` and `astronomy.ts`. Calculated output retains modification attribution. |
| NASA MEO 2025 | `meteor-peaks-nasa-2025.json`: NTRS **20240012381**, issued **2024-10-18**, Table 3 p9; exact retained rights statement “Work of the US Gov. Public Use Permitted.” No fresh rights check was performed in this audit. |
| NASA MEO 2026 | NTRS **20250009524**, issued **2025-10-17**, Table 3 p8; retained PUBLIC / GOV_PUBLIC_USE_PERMITTED statement, ownership not inferred. |
| NASA MEO 2027 | NTRS **20260009360**, issued **2026-10-16**, Table 3 p9; same neutral rights statement. Source UT minute times are represented as ISO UTC, without subminute accuracy. See `meteor-2027-source-admission.md` and actual JSON. |
| GMN fitted radiants | Author-deposited arXiv **2205.15423v1**, **CC BY 4.0**, selected original coefficients/fit windows and modification notice; not a blanket full-season claim. |
| ETA/ORI A58 references | DOI **10.1051/0004-6361/202038115**, **CC BY 4.0**, original typical intervals and introductory wording. Convention uncertainty survives reuse permission. |
| IGN five civil rows | Runtime links IGN RISP legal notice, attributes source and review date **2026-10-17**, preserves supplied precision/meaning and no endorsement. `meteor-source-admission-20261017.md` resolves the earlier candidate-only rights wording; runtime now has five rows, not the earlier two. |
| Other verbal annual facts | Per-row original narrative locator, source/vintage/modification attribution in `meteorCalendarGuidance.ts`. Individual factual extraction only; no blanket article/table/image licence asserted. NASA hosting is not ownership of Lowell/APOD/third-party material. |

`data/targets/README.md` is **historical/stale for current counts and families**: it describes eight radiant models, only 2026 peaks, three radiant samples and unsupported planetary enumeration. Current code has twelve models, three peak years, up to 97 samples and finite planetary enumeration. Likewise older source-closure notes listing already-filled verbal facts as missing must not override the runtime. This profile does not edit those files. The old eight-shower `meteor-showers-v1.json` remains an audit record, not the runtime peak source.

## Historical coverage: usable samples versus unavailable baseline

The user-facing capability is historical modeled cloud context, **never a future-night forecast or whole-night success probability**. `shared/nightsky/climate.ts` distinguishes `sample-only` from exact observing-night **1991-01-01 through 2020-12-31** baseline. Sun-centre altitude ≤ −18° selects hourly dark instants; observing dates run local noon to next noon, and the public bins are **24 UTC-hour bins**. Missing/null hours remain missing; frequencies use valid eligible dark hours, with independently computed expected denominators. Inclusive cloud thresholds are 10/25/50 percent; a multi-year mean cannot supply invented percentiles.

| Path/evidence | What is actually available | What it does not establish |
| --- | --- | --- |
| Native ERA5 2025 pilot | Retained `.data/era5/pilot-2025/full-year-sample.json` exists and hashes to **0ac43235fa7c0585d87a4e821e25d0bb9c799a1042f329a411923a4fa0dc2580**. Exactly **three aggregates / 36 monthly summaries / 864 UTC bins** for Hanle, Kodaikanal and Munnar, **2025 only**, Asia/Kolkata. | Not a climatological baseline, arbitrary place coverage or automatic API-mode availability. Serving requires explicit trusted artifact path/digest and matching local named-place/index rules. Sample-only numeric results stay partial. |
| Three pilot cells | Hanle **32.75/79**, Kodaikanal **10.25/77.5**, Munnar **10/77**, at supplied 0.25° spacing | Native approximate ~31 km reanalysis and supplied cell mapping are not site-scale weather or verified local conditions. Requested point and cell/displacement remain separate. |
| Older native 1991/1992 sparse observations | Retained reconciliation and measured two-March-parent evidence in `retained-history-reconciliation.md`, `retained-history-measurement.md`, committed `data-pilot-evidence/2026-10-16-retained-history-reconciliation.json`. | Sparse observations/scratch sample releases do not establish 30-year coverage, active serving, or present existence of every ignored raw parent. This audit did not rehash that complete raw inventory. Old worldwide acquisition complements are not mandatory API launch work. |
| Hosted Open-Meteo small pilot | Previously validated exact cell **28.5/77.25**, 336 padded UTC hours; ten observing nights Jan 1–10 1991 yielded **110 expected/110 valid** dark hourly samples and 10/25/50% counts **64/74/83**. `history-serving-wave-20261017.md`. | Sample diagnostics, not baseline. Raw hash/retrieval are retained in that record; this audit did not repeat decoding or a provider call. |
| Hosted annual shape diagnostic | Previously accepted **1992**, exact returned cell **28.5/77.25**, **8,784 hours**, zero null/absent hours, **111,061 decoded bytes**, three reserved local credits. `source-native-acceptance-results-20261017.md`. | Quarantine-only annual transport/shape evidence, not aggregate baseline/production admission or observed provider debit. Allowance already consumed. |
| Optional hosted API baseline worker/store/provider | Implemented in `server/providers/climate/apiHistory*.ts`; optional runtime wiring in `server/plugin.ts`. Read-only lookup never fetches/queues/rebuilds. | **No admitted complete numerical baseline demonstrated.** Absent admission/summary or failed identity/statistic validation returns unavailable. Existing wire pilots cannot bypass this gate. |

Native pilot provenance explicitly identifies C3S/ECMWF ERA5 hourly single-level reanalysis, DOI **10.24381/cds.adbb2d47**, **CC BY 4.0**, selected deterministic member 0/final revision 0001 and modification attribution. These labels belong to that reviewed native path. Do not transplant them onto hosted Open-Meteo bytes.

### Hosted method and production admission

`openMeteoHistoryMethod.ts` defines **open-meteo-hosted-era5-cloud-percent-v1 / open-meteo-quantized-dark-cloud-v1**, `defined-not-production-admitted`, distinct from native `dark-cloud-v1`. Integer-percent upstream storage can change threshold classification near native fraction boundaries. Deployed revision and gap interpolation remain unverified; a response hash proves retained bytes, not upstream scientific revision. The pinned source-code review at **01ceed5b028fb6ac19794c3310aed5a4f7aa6d4a** is not deployment attestation (`history-source-resolution-20261017.md`).

The numerical baseline requires independent **90% completeness**, **27 represented years**, **80% per-year completeness** and **zero bad years**, including returned-bin and independent month/year checks. No darkness means omitted numerical cloud statistics, not zero clear-sky frequency. Hosted baseline serving requires explicit distinct-method admission with a policy revision digest and acceptance of the quantization/unverified-revision limitations (`shared/nightsky/climate.ts`, `apiHistoryProvider.ts`).

Configuration requires **both** `NIGHTSKY_API_HISTORY_CACHE_DIRECTORY` and `NIGHTSKY_API_HISTORY_ADMISSION`; neither supplied means no hosted provider. Partial/invalid configuration fails startup. This audit did not inspect environment variables, keys, private quota ledgers or a production admission record. API mode conflicts with configured legacy climate artifacts rather than silently falling back (`apiHistoryConfiguration.ts`, `server/plugin.ts`).

The current offline API planner covers **263,088 padded UTC hours**, Dec 30 1990 through Jan 2 2021 inclusive, for the thirty-year observing-night baseline. It supports **1–1827-day** ranges; the operator worker accepts at most **30** ranges. Default 366-day partitioning is **30 requests**, not the older 783 mandatory 14-day requests. Six 1827-day ranges are an explicit planning option. These are offline plans/weighted-credit estimates, not proven range/response guarantees or permission to acquire. Old 782/783-request next-action proposals are superseded by this implementation (`API-HISTORY-COMPLETION.md`, `apiHistoryPlan.ts`, `apiHistoryJobs.ts`).

The worker is separately authorized, sequential and bounded; request handlers do not trigger acquisition. Summary/journal capacity is **64 each**, summary cap **256 KiB**, journal cap **64 KiB**, with no automatic eviction/deletion/stale-lock takeover. Cached baseline records bind exact source/method/period/cell/timezone/runtime/plan/receipts/statistics. Summary capacity, serialized bounds and a synthetic successful fixture do not establish parsed RSS or actual baseline resource fit.

Retained Open-Meteo review records separate **data attribution/CC BY conditions** from **free hosted service eligibility**. Owner free/ad-free/no-affiliate facts are settled; do not repeat them. Any remaining commercial/promotional-purpose applicability and operating-model change must be assessed specifically, not inferred from a key or price. The reviewed public terms are evidence records, not freshly checked in this offline audit. No second interchangeable admitted free quantitative 1991–2020 cloud baseline was established. NASA POWER/Meteostat/forecast feeds are not silent replacements (`history-api-route-decision-20261017.md`, `history-source-resolution-20261017.md`, `API-HISTORY-COMPLETION.md`).

## Finite owner decisions and next evidence

1. **Meteor launch profile and maintenance:** choose the intended visual-shower set, supported years, maintenance owner and review date. Retain all nineteen inventory identities with explicit missing states; do not silently promote the twelve radiants/eighteen verbal facts into the launch selection. Define whether supported activity windows are source-qualified civil guidance or a stronger modeled claim, and require matching domain/precision/rights evidence. Exact complete-season acceptance remains unclosed.
2. **Existing planetary acceptance:** retain the already implemented finite definitions; finish representative independent references/event states and composed local observing evidence. The known Venus-morning maximum-angle independent case and partial planet-pair local-window acceptance remain in `api-event-gaps-20261017.md`. Do not require exhaustive pair-year absence certification or build a new adapter to repeat existing code.
3. **Historical scientific claim:** either review/admit the explicit distinct hosted quantized method with its stated limitations, followed by a separately authorized bounded baseline validation, or make an explicit owner decision about unavailable historical coverage and the months-ahead promise. This document neither grants admission nor drops the promised journey. Reopening native-threshold equivalence requires provider-backed evidence, not a configuration flag.
4. **Any future history acquisition:** approve an exact plan/point/zone, quotas/credit ceiling, bounded raw-evidence retention and maintenance, then measure source completeness, timings/RSS/storage and runtime serving. Prior allowances are consumed; no fetch/retry/provider switch is authorized here. No worldwide bulk programme or paid request is required by this profile.

## Local verification performed

The audit imported the actual runtime inventory/guidance functions through the already installed local `tsx` loader and read the existing pilot JSON. **Exit 0**: meteor rows for 2025/2026/2027/2028 had 19 identities each, peaks **13/13/12/0**, 12 bounded radiant entries each and **zero complete activity entries**; verbal/civil/typical counts were **18/5/2**. The 2028 count does not mean radiants work at every instant; their solar-offset domain remains mandatory. Pilot counts were **3/36/864**. `Get-FileHash` independently matched the pinned pilot digest above.

Reproduce the source/count audit from the repository root without package installation or network access:

```powershell
$auditCode = @'
import {meteorCoverage} from './server/events/meteorCoverage.ts';
import {meteorCalendarGuidance} from './server/events/meteorCalendarGuidance.ts';
import {meteorCivilGuidance} from './server/events/meteorCivilGuidance.ts';
import {meteorTypicalSeasons} from './server/events/meteorTypicalSeasons.ts';
import {readFileSync} from 'node:fs';
console.log([2025,2026,2027,2028].map(year=>{const r=meteorCoverage(year);return {year,identities:r.length,peaks:r.filter(x=>x.peak.status==='supported').length,radiants:r.filter(x=>x.radiant.status==='partial').length,complete:r.filter(x=>x.activity.status==='supported').length};}));
console.log({verbal:meteorCalendarGuidance().entries.length,civil:meteorCivilGuidance().length,typical:meteorTypicalSeasons().length});
const p=JSON.parse(readFileSync('.data/era5/pilot-2025/full-year-sample.json','utf8'));
console.log({aggregates:p.aggregates.length,months:p.aggregates.reduce((n,x)=>n+x.monthly.length,0),bins:p.aggregates.reduce((n,x)=>n+x.bins.length,0)});
'@
node node_modules/tsx/dist/cli.mjs --eval $auditCode
Get-FileHash .data/era5/pilot-2025/full-year-sample.json -Algorithm SHA256
```

No new script, tests or runtime changes were necessary for this documentation profile. Retained historical test/live/native results are cited as prior evidence, not rerun or expanded acceptance.
