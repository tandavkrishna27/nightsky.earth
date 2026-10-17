# Events and geography closure implementation plan — 17 October 2026

> For execution, use `superpowers:executing-plans` task by task. This document is a proposed implementation packet, not authorization for acquisition, provider calls or release.

**Goal:** Close the remaining original event and geographic journey requirements with finite content and explicit evidence.

**Architecture:** Preserve the existing local event calculations and API discovery route. Add reviewed meteor coverage records and composed observing evidence; complete administrative combinations through bounded, source-backed membership evidence. Unsupported results remain visible until their requirement is implemented or the owner explicitly changes scope.

**Tech stack:** Existing TypeScript, Zod 4, node:test/tsx and pinned Astronomy Engine 2.1.19.

**Spec:** [API-first plan](../superpowers/plans/2026-10-17-api-first-v1-regroom.md), [event gaps](api-event-gaps-20261017.md), [tracker](v1-completion-tracker.md), [original event reconciliation](events-v1-scope-reconciliation.md).

## Evidence and constraints

Repository inspection against baseline `95c2cff`; no runtime edits, tests, new data, downloads, live provider calls, secrets, commits or deployments performed for this document. Read source and existing test assertions; test coverage below means inspected assertions, not a fresh passing run. JSON maxima/radiant rows were read directly and tabulated locally. External links in existing admission documents were not fetched; this packet makes no new external scientific or provider claims.

The earlier event-gap description of unresolved planet-pair implementation has been reconciled: `server/events/planetPairConjunctions.ts`, its schema/catalog integration and tests already exist. Do not recreate them. The tracker correctly leaves original ticket 6 and complex geography partial. No acceptance counts change here. Bulk global geography remains deferred under the API-first decision.

Review focus: missing meteor dates must not become inactivity; model-domain edges must not become full-season support; a conjunction instant must not imply visibility; administrative exclusions must survive every query; missing/expired exact-site timezone evidence must not silently borrow a nearby city.

## Proposed finite meteor scope — requires owner selection

Carry forward the existing [thirteen-shower proposal](proposed-visual-meteor-acceptance-matrix.md): QUA, LYR, ETA, SDA, CAP, PER, ORI, DRA, NTA, STA, LEO, GEM, URS for maintained **2026 and 2027**, with 2025 retained as historical evidence. This is a proposal, not an adopted narrowing of the original selected-visual-shower requirement. All nineteen identities remain retained. Do not automatically roll records to 2028.

The matrix is recomputed from `data/events/meteor-peaks-nasa-{2025,2026,2027}.json` and `data/events/meteor-radiants-gmn-2021.json`. Peak values below are **MM-DD HH:mm** in each file's ISO UTC representation; a dash is missing admitted evidence. These are NASA MEO forecast maxima, not automatically visual maxima or local best nights. Minute representation does not establish minute physical accuracy. Radiant domains are anchor ± half-width in geometric J2000 mean-ecliptic solar longitude; half-width is `nominalFitDays × 0.986 / 2`. All fit evaluations are bounded to 2018–2030, with 2026/2027 extrapolation beyond the 2018–2021 observations.

| Proposed code | 2025 historical peak | 2026 peak | 2027 peak | Existing radiant domain (degrees) |
| --- | --- | --- | --- | --- |
| QUA | 01-03 12:27 | 01-03 18:38 | 01-04 00:48 | 283 ± 0.493 |
| LYR | — | — | — | 32.5 ± 1.479 |
| ETA | 05-06 10:16 | 05-06 16:30 | 05-06 22:28 | 45.12 ± 4.437 |
| SDA | 07-29 18:26 | 07-30 00:39 | 07-30 06:52 | 126.7 ± 2.465 |
| CAP | 07-30 22:16 | 07-31 04:30 | 07-31 10:41 | 125.48 ± 3.451 |
| PER | 08-13 08:01 | 08-13 14:09 | 08-13 20:20 | 140.1 ± 4.437 |
| ORI | — | — | — | 209.2 ± 3.451 |
| DRA | 10-08 15:46 | 10-09 02:10 | 10-09 08:20 | Missing |
| NTA | — | — | — | 235.8 ± 7.395 |
| STA | — | — | — | 218 ± 9.367 |
| LEO | — | — | 11-20 04:38 | 235.5 ± 3.451 |
| GEM | 12-14 06:55 | 12-14 13:00 | 12-14 19:13 | 262.2 ± 1.479 |
| URS | 12-22 09:44 | 12-22 15:54 | 12-22 22:07 | Missing |

For these thirteen: **17/26 maintained-year maxima, 11 bounded radiant models, 13 verbal annual guidance rows, zero admitted complete activity seasons**. Missing maintained maxima are LYR/ORI/NTA/STA in both years and LEO in 2026. Every row still needs accepted activity start/end, endpoint meaning, precision/time basis, applicable years, uncertainty and source reuse evidence; every declared activity window needs valid radiant drift throughout. Existing parameter uncertainties are not positional confidence intervals. No blanket import permission follows from a factual extraction.

| Other retained identity | 2025 / 2026 / 2027 maxima present | Radiant | Consequence if selected |
| --- | --- | --- | --- |
| AND | Yes / Yes / No | Missing | 2027 maximum, complete season, full model and direction reference |
| HYD | No / No / No | 254.8 ± 7.395 | Both maintained maxima, full season/domain coverage |
| SSG (#69) | Yes / Yes / No | Missing | Annual wording, 2027 maximum, season/model; do not substitute SSS (#168) |
| ARI | Yes / Yes / Yes | Missing | Season/model and explicit daytime applicability |
| DSX | Yes / Yes / Yes | Missing | Season and supported original ephemeris; no unqualified linear-fit substitution |
| ZPE | Yes / Yes / Yes | Missing | Season/model and explicit daytime applicability |

Whole retained inventory: **38 maxima (13/13/12), 12 radiant models, 18 verbal guidance rows**, zero complete admitted UTC seasons. ETA/ORI's separate typical solar-longitude intervals remain reference-only; their conversion method is unresolved. Proposed civil-date season admission would be a separate evidence route, not an implicit fix to that conversion.

### E1 — Freeze a machine-readable acceptance ledger

Files: create `data/events/meteor-coverage-policy-v1.json`, `server/events/meteorCoverage.ts`, `tests/events/meteorCoverage.test.ts`; modify `shared/nightsky/events.ts` only for a reviewed coverage contract. Dependency: owner approves selected codes/maintained years and activity-period meaning.

Interface: `getMeteorCoverage(code: string, year: number): MeteorCoverage`, with independent `peak`, `activity`, `radiant` states (`supported | partial | missing | out-of-horizon`), evidence references and explicit model domain. The ledger references existing files; it must not duplicate or manufacture timestamps. An unselected retained code remains available under existing capabilities and is labelled outside maintained selection, never absent from nature.

- [ ] Write assertions for the exact 13×2 matrix, nine missing maxima, DRA/URS missing radiants, all thirteen missing complete seasons, all six retained extra identities and 2028 out-of-policy behavior.
- [ ] Implement ledger validation against retained rows; reject duplicate code/year and a supported state lacking its evidence reference.
- [ ] Run `node --import tsx --test tests/events/meteorCoverage.test.ts tests/events/meteorPeaks.test.ts tests/events/meteorRadiants.test.ts`; expected all assertions pass. This closes inventory/maintenance policy only.

### E2 — Admit actual activity and missing peak/radiant evidence

Files: update `docs/operations/proposed-visual-meteor-acceptance-matrix.md` with per-row evidence disposition; after evidence admission create `data/events/meteor-activity-v1.json`, `server/events/meteorActivity.ts`, `tests/events/meteorActivity.test.ts`; modify `shared/nightsky/events.ts`, `server/events/catalog.ts`, and the existing peak/radiant artifacts only for admitted source-specific rows.

Interface: `getMeteorActivity(code: string, year: number)` returns a discriminated missing result or source-qualified civil-date/instant interval. Civil dates carry the accepted calendar/time basis and endpoint meaning; never fill `startUtc/endUtc` by assuming midnight. Exact field schema follows the source decision, which is a necessary scientific input rather than an implementer's guess.

- [ ] For each of the 26 selected year/shower cells, complete the same admission form: source/version/locator, reuse basis, identity, start/end precision, calendar/time basis, peak definition, qualifications and radiant valid domain. Start with the specific selected 2026/2027 calendar rows identified in the prior proposal; no generic research expansion.
- [ ] Resolve the nine missing maxima and DRA/URS models; for all eleven existing fits prove full declared-window coverage or admit a separate valid model for uncovered intervals. A reduced fit-only observing promise requires owner scope amendment.
- [ ] Add tests rejecting fabricated UTC boundaries, wrong shower branch/year, unknown basis, extending a fit, and unsupported window overlap. Add independently referenced radiant directions within each newly admitted model and at its domain edges.
- [ ] Run `node --import tsx --test tests/events/meteorActivity.test.ts tests/events/meteorPeaks.test.ts tests/events/meteorRadiants.test.ts tests/events/catalog.test.ts`. No source is admitted merely because a parser passes. If reuse or scientific evidence is unavailable, preserve the exact missing cell and return that finite decision to the owner.

### E3 — Complete the meteor observing journey and annual maintenance

Files: modify `server/nightsky/planner.ts`, `server/events/intervalVisibility.ts` as needed, `tests/nightsky/meteor-planning.test.ts`, `tests/planning/optional-event-evidence.test.ts`, `docs/product/workflows/plan-sky-event.md` and matching plugin skill. Dependency: E1/E2.

- [ ] Add composed cases comparing two nights for a selected shower: supported full interval, part outside radiant domain, polar no-darkness, Moon interference, missing hourly forecast, local-midnight/DST boundary, and year outside maintenance. Assert source-qualified geometry/weather, explicit uncovered intervals and no favorable score from missing evidence.
- [ ] Replace three-sample-only evidence where a full local interval recommendation is claimed with bounded interval evaluation using the admitted model; reuse existing darkness/Moon/hourly conditions. Preserve a peak as a source forecast instant, separately from the local recommendation.
- [ ] Run the two test files above plus `tests/events/localHorizon.test.ts`. Assign the annual review owner and next review date in the ledger policy; an expired review produces a maintenance warning, not shifted recurrence. Record per-cell coverage and composed journey evidence before ticket 6 closure.

## Planet-pair definition: adopt the implemented contract, do not rebuild

Proposed product definition is the existing **crossing of equal geocentric right ascension in the true equator/equinox of date**, with light-time correction and aberration. `GeoVector(body,date,true)`, `Rotation_EQJ_EQD`, `RotateVector`, `SphereFromVector` and `AngleBetween` are present in the installed 2.1.19 engine/types. The separate `SearchRelativeLongitude` path remains solar alignment, not a pair solver.

Existing support: all 21 unordered pairs among Mercury, Venus, Mars, Jupiter, Saturn, Uranus and Neptune; output horizon 2025–2027; requests ≤366 days; canonical annual inventory with 24h/12h/6h/shifted-6h screening; 30,000 signal evaluations per pair; 80 refinement iterations; 256 unresolved-output cap; cache ≤3 annual inventories. Root width ≤100ms and angular residual ≤1e-6 degrees are numerical stopping controls, **not physical accuracy claims**. Coverage always remains `partial` / `not-certified`; unresolved stationary/tangent/disagreement intervals remain explicit. Angular separation is reported at the RA crossing, not closest approach. Local visibility is `not-evaluated`.

Inspected existing assertions: `tests/events/planetAlignments.test.ts` has two retained PAGASA Venus/Jupiter whole-hour cases (2025-08-12 08:00 UTC and 2026-06-09 12:00 UTC; fixed 60-minute envelope), synthetic wrap/opposite-RA/retrograde/tangent/budget cases and canonical endpoint/year joins. These two source comparisons do not certify all pairs, correction equivalence or angular accuracy. `tests/events/catalog.test.ts` retains partial empty results, horizon distinctions and truncation. `tests/planning/optional-event-evidence.test.ts` retains sourced pair evidence with unknown observing impact.

### E4 — Finish planetary scientific/local acceptance

Files: retain `server/events/planetPairConjunctions.ts`; extend `tests/events/planetAlignments.test.ts`, `tests/planning/optional-event-evidence.test.ts`, and `docs/operations/planet-pair-conjunction-contract.md`; local-window implementation belongs in `server/events/intervalVisibility.ts` / `server/nightsky/planner.ts` after its contract is declared.

- [ ] Owner confirms RA-crossing as the product conjunction meaning and finite horizon; minimum separation/RA equality/ecliptic equality cannot be interchanged. If closest-approach behavior is required, define and validate it as additional work.
- [ ] Extend the two retained real references with a finite representative reference packet covering the implemented RA-of-date convention and repeated retrograde crossings, angular wrap and near-stationary event states. Record each reference's bodies, interval, convention/time-scale/corrections/precision and a comparison tolerance fixed before evaluating outputs; record unresolved convention mismatches explicitly. Reuse existing synthetic tests for numerical branches without presenting them as astronomical references. The original Task 6 requires representative/reference event-state validation, not an independent event/no-crossing inventory for every pair-year. Keep `partial` / `not-certified`; exhaustive 21-pair/year reference inventories and absence certification are conditional additional work only if the owner requests stronger completeness guarantees.
- [ ] Resolve the separately recorded Venus-morning greatest-elongation maximum-angle reference gap in `tests/events/planetAlignments.test.ts`; do not use pair comparisons as elongation evidence.
- [ ] For urban conjunction viewing, evaluate each body's altitude and local darkness/Moon/available weather over the requested observing window at the selected point. Test a below-horizon case, daylight case, usable dark interval and missing forecast. Return separate observing intervals without adding duration to the crossing event or claiming detectability from geometry alone.
- [ ] Run `node --import tsx --test tests/events/planetAlignments.test.ts tests/events/catalog.test.ts tests/planning/optional-event-evidence.test.ts`. Preserve optional comet/asteroid source disposition and verify occultation/transient resource handling at release. These conditional resources do not justify silently dropping the planetary/meteor journey.

## Geographic combinations actually implemented

Evidence: `server/places/api/{discovery,geoapify,selectionStore}.ts`, `shared/nightsky/discovery.ts`, `tests/places/{api-discovery,api-selection}.test.ts`, `tests/mcp/api-discovery-planning.test.ts`. Live availability is unproven here. Bounds: ≤5 origins, ≤5 included regions, ≤5 excluded regions, radius 1–300km, minimum 0–300km not exceeding radius, ≤10 returned candidates. Each bounded Geoapify query requests 20 rows; a full page is budget-limited even if category filtering yields zero results.

| Combination | Current API behavior | Inspected test evidence / missing coverage |
| --- | --- | --- |
| Named place/site → exact snapshot → details/plan/compare | GeoNames then Geoapify fallback; ≤5 ambiguous matches; immutable revision and expiry | End-to-end exact point/no local files, unknown zone clarification, changed point/expired snapshot tests exist |
| Single origin + min/max distance band | Local great-circle filter over bounded provider circle | Shared origin logic; multi-origin band tests cover filter behavior |
| Multiple origins `any` | One bounded circle per origin; union, dedupe, every distance reported; minimum-distance order | Existing two-origin fixture |
| Multiple origins `all` | Search first origin circle, locally require every band; maximum-distance order | Existing high-latitude/dateline fixture |
| One country/state region; no origins/exclusions | Selected Geoapify `place:<id>` filter; source revision required; no centroid distance | Country filter test exists; state case needs direct fixture |
| Multiple regions `any`; no origins/exclusions | One place filter per region, union/dedupe | Implemented loop; direct union/failure/conflict test missing |
| One region with `regionMode=all` | Same single region filter | Allowed by guard; explicit fixture missing |
| Two or more regions `all` | Explicit `unsupported`, zero candidate queries | Guard exists; dedicated assertion missing |
| Any included region + any origin | Explicit `unsupported`, constraints preserved | Guard exists; dedicated assertion missing |
| Any excluded region | Explicit `unsupported` | Existing exclusion fixture asserts zero fetches |
| Exclusion-only / no positive scope | Schema rejects input | Must retain validation, not broaden to global enumeration |
| Six category selections / complements expressed as remaining categories | Explicit category list pushed upstream and filtered locally with fixed precedence | Unknown tags cannot satisfy `other`; full-page truncation test exists; complete complement truth table missing |

`other` means mapped mountain/picnic categories, not all unclassified features. Region results are admitted only for country/state with ISO3 mapping. Provider filter identity is current evidence for a region search; a name/point alone is not reusable polygon-membership proof for intersections or exclusions. Region-only ordering is source-completeness/name/ID, not nearest or best sky. Source tags do not certify access, darkness, permits or safety.

### G1 — Pin the existing combination truth table

Files: extend `tests/places/api-discovery.test.ts`, `tests/places/discoveryScope.test.ts`, `tests/mcp/api-discovery-planning.test.ts`; change `server/places/api/discovery.ts` only for failures exposed by these cases.

- [ ] Add fixtures for state filter, two-region union with duplicate/conflicting identity, one-region `all`, all three unsupported guards with zero provider calls, five-origin bounds, all six category complements, and partial failure/full-page truncation across a union. Assert returned `queryScope` preserves input constraints and no excluded candidate is invented.
- [ ] Reuse catalogue scope truth tables against the API fixture path, retaining unsupported expectations where evidence is absent.
- [ ] Run `node --import tsx --test tests/places/api-discovery.test.ts tests/places/discoveryScope.test.ts tests/mcp/api-discovery-planning.test.ts`. Passing unsupported cases is regression evidence, not closure of the required combinations.

### G2 — Implement bounded administrative membership, then combinations

Files: create `server/places/api/regionMembership.ts`, `tests/places/api-region-membership.test.ts`; extend `server/places/api/{types,discovery}.ts` and `tests/places/api-discovery.test.ts`; update `docs/operations/api-provider-admission.md` with the selected membership route. No bulk boundary catalogue prerequisite.

Proposed internal interface: `RegionMembershipProvider.classify(points: ApiSelectionRef[], regions: ApiRegionSelectionRef[], deadline: number): Promise<MembershipResult[]>`. Define `ApiRegionSelectionRef = { regionId: string; sourceRevision: string }` and `MembershipResult = { point: ApiSelectionRef; region: ApiRegionSelectionRef; membership: 'inside' | 'outside' | 'unknown'; source: SourceRecord; method: string; fetchedAt: string; expiresAt: string; reason?: string }` in `server/places/api/types.ts`, using existing revision/source schema validators. Maximum 100 unique candidate points and 10 unique included/excluded regions per search follows the existing 5×20 positive-query ceiling. Actual upstream request ceiling must be fixed in admission before adapter implementation; do not permit a 1,000-call point×region fan-out.

- [ ] First decide the source-backed route from exact provider capabilities already admitted or a separately reviewed bounded membership endpoint. Required evidence is point-in-selected-administrative-area semantics with boundary/version, holes, borders, dateline, parent/child regions, precision and licensing. A region label is insufficient. If no route supplies this within the configured request budget, report this specific unmet capability for owner decision; do not restart global acquisition.
- [ ] Write a fake membership provider and truth-table tests: origin-any/all intersect region-any/all; country∩state; disjoint states; included/excluded overlap with exclusions winning; boundary/hole/dateline points; expired revision; unknown membership and one failed subquery. Unknown inclusion or exclusion membership cannot produce a qualified returned candidate.
- [ ] Implement constraint composition only over bounded source candidates. Membership is `(origin predicate if supplied) AND (included-region predicate if supplied) AND NOT(any excluded region)`; apply categories and deterministic existing distance ordering afterward. Preserve partial/unavailable coverage for unknown membership and budget exhaustion.
- [ ] Implement the admitted membership adapter, cache by point+region revisions and source version, and run `node --import tsx --test tests/places/api-region-membership.test.ts tests/places/api-discovery.test.ts tests/places/discoveryScope.test.ts`. Remove each unsupported guard only when that exact combination passes with admitted evidence. Source completeness remains bounded; do not call it exhaustive discovery.

### G3 — Exact-site timezone and assembled geography acceptance

Files: extend `tests/places/api-selection.test.ts`, `tests/mcp/api-discovery-planning.test.ts`, `server/places/api/{geoapify,selectionStore}.ts` only for concrete failures; update provider admission and relevant workflow evidence.

- [ ] Test valid source zone, missing/invalid source zone, explicit display-zone choice, conflicting same-ID zone, expired snapshot, DST transition and nearby-city disagreement. Assert exact selected coordinates reach astronomy/weather and display-zone choice is not mislabelled as verified site timezone.
- [ ] Run `node --import tsx --test tests/places/api-selection.test.ts tests/mcp/api-discovery-planning.test.ts`.
- [ ] After separate bounded-live authorization/configuration, validate country/state region filters and membership, ambiguous names, timezone border sites, empty/unavailable behavior and the required combinations against actual source responses. Record source revision, case/call budget, latency/quota and errors with secrets redacted. Existing fixture tests cannot establish live suitability.

## Owner decisions and completion order

1. Confirm or amend the thirteen visual showers and 2026–2027 maintenance proposal; retain all nineteen identities regardless. Select approximate source civil-date activity periods or another evidenced definition, and appoint annual maintenance ownership. Fit-only local recommendations would be an explicit requirement reduction.
2. Confirm the implemented RA-crossing definition/horizon is the intended planetary conjunction capability. Decide separately if certified completeness or closest approach is required; neither is currently implemented/promised.
3. Admit a bounded administrative-membership route when evidence is available. If none is feasible, the original geographic combinations remain unmet until an explicit owner scope amendment; town/radius fallback alone is not closure.

Execute G1 and finite ledger/reference preparation now within offline scope. E1 policy activation waits for decision 1; E2 admission precedes E3; E4 scientific/local evidence remains independent. G2 route admission precedes removing guards; G3 actual-source acceptance follows separately permitted live configuration. Integrate affected tests/types/package checks once implementations are complete, then report original-ticket evidence to the tracker owner. S3 measured configured-service behavior and S4 actual journeys/client/owner gates remain required. This document closes the planning inventory only.
