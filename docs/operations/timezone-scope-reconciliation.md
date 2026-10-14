# Task 4 timezone scope reconciliation — proposed disposition

Prepared 14 October 2026. **Recommendation for owner review; not an accepted scope change.** Task 4 remains Partial under its unchanged original wording. This document does not mark it Done, alter the execution plan, or establish production readiness.

## Decision proposed

Adopt the existing globally indexed named-place interface for V1: `resolvePlace(input)` and `resolvePlaceTimeZone(placeId, index?)`. Replace the original internal `resolveTimeZone(latitude, longitude)` deliverable and polygon-boundary acceptance with explicit named-record assignment acceptance. Preserve global named-place support, private calculation coordinates, IANA-based civil-time conversion, provenance, ambiguity, and every existing location privacy limit. Defer coordinate-to-polygon lookup as a separate, estimated implementation option.

The scope change is substantive: it removes geographic boundary membership accuracy from Task 4. Renaming a fixture cannot satisfy the original requirement. Only an owner-accepted disposition, followed by the evidence below, can support reconciling the original checklist and status.

## Evidence and engineering review

Review target was supplied explicitly: original Task 4 plus current named-place implementation. The engineering plan review skill was applied in its spawned-session mode to architecture, code quality, tests and performance. No interactive setup, runtime edits, source acquisition, deployment or tests were performed for this recommendation.

| Area | Existing evidence | Assessment |
|---|---|---|
| Architecture | Execution-ready plan Task 4 produces `resolveTimeZone(latitude, longitude)`. `server/places/index.ts` instead says `Resolve timezone from the selected named-place record; no raw coordinates are accepted.` | Confidence 10/10: a real acceptance mismatch. Retain the existing interface and explicitly replace the deliverable if approved. |
| Code quality | `geonames.ts` assigns `timeZone: city.timeZone`; result caveat says the assignment follows the named city record. Missing index returns unavailable; missing ID from `resolvePlaceTimeZone` returns undefined. | Confidence 10/10: no polygon lookup exists. Document caller recovery rather than invent a second resolver. Undefined must never become UTC. |
| Tests | `tests/nightsky/time.test.ts` contains `resolvesIanaZoneFromNamedPlaceRecord` and `formatsLocalTimeAcrossDst`; the boundary fixture is absent. | Confidence 10/10: spring DST and named record evidence exist; boundary accuracy is unproved. Add narrowly relevant missing assertions after approval. |
| Performance | `geonames-index.md` records about 317 MiB process RSS in local tsx after load; `source-spikes.md` records 10.4 MiB compressed / 34.7 MB JSON. Name search and nearest search scan rows; ID lookup uses a map. | These are existing local measurements, not production budgets. Adding polygons increases deployment and cache work; validate the actual host before release. |

Minimum implementation after approval uses existing flows. No new service or database is needed for the recommended scope. No other task's source or hosting gate closes through this decision.

## Comparison and source obligations

| Dimension | Named GeoNames row (recommended V1) | Coordinate polygon alternative |
|---|---|---|
| Question answered | Which IANA identifier is assigned to this selected populated-place record? | Which published zone geometry contains this server-private point? |
| Coverage | Global cities500 extract plus explicitly reviewed supplements, including Hanle; installed records only. | Global published boundary product with documented gaps/overlaps; still needs named-place identity and a gazetteer. |
| Rights | CC BY 4.0 attribution, license link, modified/indexed notice and vintage already modeled. | Distinct code/data licenses and ODbL database classification, attribution and any required offer before public use. |
| Update work | Refresh gazetteer artifact separately from Node/ICU timezone rules; validate row IDs/zones and preserve rollback. | Pin boundary release, lookup package and rule runtime; test compatibility, source diffs, cache limits and rollback for each upgrade. |
| Runtime | Local loaded rows; no timezone provider network call. Existing memory requirement applies. | Local spatial lookup can avoid per-request network calls, but needs additional packaged data, disk reads/cache and measured cold/warm behavior. |
| Failure | Missing name/record/index or invalid zone yields clarification/unavailable/error, never UTC. | Missing dataset, invalid point, zero or multiple zones require explicit states; never choose first result silently. |

Primary sources checked as documentation only on 14 October 2026:

- [GeoNames gazetteer README](https://download.geonames.org/export/dump/readme.txt) defines cities500 as population over 500 or administrative seats through PPLA4, provides an IANA timezone column, permits reuse under CC BY 4.0, and disclaims completeness/accuracy/timeliness. The README's approximate row count is not the measured local index count. No additional data was fetched for this review.
- [Timezone Boundary Builder README](https://raw.githubusercontent.com/evansiroky/timezone-boundary-builder/master/README.md) describes approximate OSM-derived boundaries, MIT builder code and ODbL output. Releases track tzdb but can skip versions. Choose comprehensive or since-1970 data deliberately; a since-now product cannot support historical civil-time work. Published geometry has community-data limitations and gaps. Use a pinned release rather than rebuilding world boundaries here.
- [node-geo-tz README](https://raw.githubusercontent.com/evansiroky/node-geo-tz/master/README.md) documents geographic lookup, multiple results at borders or disputed timekeeping, and since-1970 default versus comprehensive/since-now entry points. It needs explicit runtime data packaging and disk access. Its default cache does not expire; preload raises memory/startup costs. Ocean fallback must not silently turn an uncovered observing site into an accepted civil zone. Exact membership in its dataset does not certify real-world civil-time practice.
- [ODbL sections 4.2–4.6](https://opendatacommons.org/licenses/odbl/1-0/) require appropriate notices, attribution for publicly used outputs, share-alike for publicly used derivative databases, and an offer of the derivative database or alterations where applicable. Classification of a proposed NightSky artifact and compliance method remain a source-rights decision; an MIT package license does not replace data obligations.
- [IANA timezone database](https://www.iana.org/time-zones) tracks political changes to offsets and DST rules. NightSky currently uses Node `Intl`, so refreshing a gazetteer or boundary file alone does not update the runtime rules. Capture Node/ICU/tz versions in release evidence and check representative upcoming transitions after runtime upgrades.

## Exact retained limits and user consequences

1. **Global named places stay in scope.** This is not a regional timezone reduction. Coverage is the installed global cities500 artifact and reviewed supplements, not every village, park, mountain, municipality polygon or observing site. An absent name is `not-covered`; ask for a nearby indexed named destination or review a bounded authoritative supplement. Do not fabricate IDs.
2. **Named-place planning uses one representative point and its record zone.** The representative coordinates stay private. A large city or administrative name does not locate a user's observing site or establish that all its territory uses the same civil-time practice. Astronomy/weather calculations remain area approximations. A boundary-adjacent outing should use a more specific indexed destination and verify local civil time; no arbitrary point-zone claim follows from the city result.
3. **Near-me remains opt-in.** Only explicit `useApproximateHostLocation: true` reads a documented request-scoped hint. Current nearest lookup selects an indexed named place within 100 km, using distance; it does not prove the hint lies in that city's zone, country or municipality. Cross-border/date-line proximity can select another civil zone. Return the named area and caveat; missing hint is `host-location-unavailable`, no nearby row is `not-covered`. Ignore hints without the flag. Do not persist, log or echo the hint. Named requests preserve ambiguity; the current near-me branch returns one nearest area, not polygon validation.
4. **Candidate discovery remains separate.** OSM candidate results carry public mapped coordinates/navigation and access unknowns. They currently have no `timeZone` field, and planner inputs resolve GeoNames IDs; direct OSM candidate planning is unsupported. The older source-spikes sentence allowing candidates to inherit a city zone must not become a claim of candidate-local time. Candidate times are unavailable until the candidate is resolved through an explicitly reviewed contract. A city/search-origin display zone, if ever displayed, must be labeled as such. Even polygon assignment at an area representative point would not establish the entrance's zone.
5. **DST/date-line support remains required.** Convert UTC instants with the selected IANA zone; retain local calendar dates, fractional offsets and changes across midnight. Spring DST gaps fail explicitly. The current iterative local-time helper can return when it finds one matching instant; it does not prove uniqueness at fall-back folds despite its error text. Do not promise rejection of every ambiguous local time. Tool windows are explicit UTC instants plus IANA zone; document UTC input for ambiguous local wall-clock times until a fold policy is implemented/tested.
6. **Wire limits remain exact.** Up to five resolve matches; named query or explicit approximate mode, never both; unknown fields and coordinate-shaped user text rejected on all hosts. Downstream calls use `placeId`, not raw coordinates/addresses or repeated name text. UTC instants end in Z; shared maximum window is 366 days, with each tool's shorter limit retained. Invalid/unknown zones never fall back to UTC.
7. **Operational limits remain.** Versioned IDs/provenance and re-resolution for retired/incompatible IDs; index vintage visible; missing artifact explicit. Current loader limits remain 64 MiB compressed and 256 MiB decompressed. These are file limits, not a hosting memory guarantee. No production deployment, host compatibility, global candidate coverage or historical dataset approval follows from Task 4 reconciliation.

## Proposed replacement Task 4 wording

Apply this text only after explicit acceptance of the scope change. Keep the original wording available in the audit history.

> **Task 4: Implement global named-place resolution and record-based local time zones**
>
> **Files:** existing Task 4 files and source metadata; no timezone-boundary artifact or coordinate-to-zone API is required for this scoped V1 task.
>
> **Consumes:** Task 2 PlaceRef and Task 0 dataset/license decisions.
>
> **Produces:** `resolvePlace(input): Promise<ResolvePlaceResult>`, existing `resolvePlaceTimeZone(placeId, index?): Promise<PlaceTimeZoneResult | undefined>`, and MCP `resolve_place`. The timezone result reports the selected record's IANA zone and index vintage. Missing/unusable records require explicit unavailable/not-found/stale handling or named-place re-resolution; no UTC fallback. No arbitrary-coordinate, municipality-wide or observing-candidate timezone accuracy is claimed.
>
> **C1:** Retain the original named-place, ambiguity, aliases, host-hint/privacy, malformed-row, stale-ID, coordinate-range and DST cases. Replace `resolvesIanaZoneAtBoundary` with `resolvesIanaZoneFromNamedPlaceRecord`. Require rejection of unsupported IDs/unknown records/invalid zones without UTC substitution. Retain `resolvesZoneAcrossDateLine`, strengthened to assert local calendar dates for named places on opposing civil-date sides. Add assertions that city-zone caveats survive resolution and candidate discovery cannot masquerade as candidate-local planning.
>
> **C2:** Build and document a versioned global gazetteer refresh carrying row-assigned IANA identifiers, source/checksum/vintage/attribution/error reporting. Document a separate Node/ICU/tz runtime refresh and rollback process. Preserve IDs downstream; do not call public Nominatim per keystroke.
>
> **C3:** Retain original namespaced IDs, retired/incompatible-ID recovery, ambiguity and private-coordinate requirements unchanged.
>
> **C4:** Record GeoNames gazetteer and IANA/runtime-rule provenance and license/attribution obligations. Explicitly exclude timezone polygons and candidate-local timezone claims. Pass when all mapped place/time cases pass, missing/invalid timezone behavior has no UTC fallback, and named-area/candidate limitations are documented consistently. Production artifact installation and host capacity remain release gates.

## Test mapping and remaining evidence

Framework: Node test runner via tsx, `npm test`. This document proposes tests; it does not report a new test run.

```text
named query -> validated index -> matches/clarification -> selected record zone
  existing: unique / ambiguous / country / aliases / no-match / stale-ID
  existing: coordinate-text rejection / private coordinates / provenance
  required: unsupported ID and missing index do not become UTC

explicit near-me -> hint present? -> nearest indexed row within 100 km?
  existing: flag / absent hint / ignored hint / no coordinate echo
  required: remote no-row / cross-border nearest-area caveat, never exact zone

record zone + UTC window -> Intl conversion -> local date/time
  existing: spring DST / invalid zone
  required: opposing-date date-line / fractional offset / fall-fold UTC display

candidate search -> public candidate -> attempt candidate plan
  required integration: candidate ID rejected; no borrowed city-zone plan
```

| Original subcriteria | Evidence / proposed disposition |
|---|---|
| T1–T10 and T14 | Keep existing `tests/places/geonames.test.ts` names and behavior; do not weaken any privacy or ambiguity assertion. |
| T11 boundary | Explicitly removed by accepted scope only; replacement exists as `resolvesIanaZoneFromNamedPlaceRecord` in `tests/nightsky/time.test.ts`. Expand that case for unsupported namespace and absent index using a deterministic missing path. |
| T12 date line | Existing Auckland/Apia fixture only asserts identifiers. Add a Pago Pago/Apia fixture and fixed UTC instant asserting opposite local calendar dates; no real data acquisition needed. |
| T13 coordinate range | Retain `rejectsInvalidCoordinatesInPlaceRecord` in `tests/shared/contracts.test.ts`; it validates private coordinates, not zone membership. |
| T15 DST | Existing spring transition/gap case remains. Add fall-fold display with two explicit UTC instants and offsets, plus Kolkata fractional offset; do not assert unsupported local-fold rejection. |
| C2/C4 | Review existing refresh/source docs for separate runtime rule versions, rollback and upgrade checks; do not certify production installation here. |
| New scoped guard evidence | Resolver caveat present for named and near-me results; deterministic out-of-range/no-nearby hint behavior; downstream missing record/invalid zone failure; integration assertion that OSM candidate IDs cannot create a named-place plan. Reuse existing contract tests where they already prove these behaviors. |

These are acceptance evidence requirements, not optional embellishments. Completion requires running the mapped suite after the approved wording and any resulting implementation changes; a fixture name alone is insufficient.

## Alternative if original boundary criterion is retained

Implement a server-private adapter around a pinned maintained polygon lookup, leaving public tools named-place-only. Use selected record coordinates; keep the GeoNames identity and disclose a different polygon zone rather than silently replacing it. Return zero/one/multiple-zone states plus boundary-data version and provenance. Decide ocean/uncovered policy, overlapping-border ambiguity and disagreement with GeoNames before integrating. Preserve every privacy check; polygons do not authorize user-coordinate inputs. Historical timekeeping work requires a compatible since-1970/comprehensive product and runtime rules, with explicitly bounded historical claims.

Acceptance would then include points on either side of a documented boundary, exact-border/multi-zone state, antimeridian behavior, poles/ocean/uncovered handling, invalid ranges, corrupt/missing dataset, timezone disagreement, package data-path startup, cold/warm/cache-growth budgets, pinned release provenance, source-rights publication method and refresh rollback. Synthetic geometry exercises adapter branches but cannot alone demonstrate the production dataset's boundary accuracy.

Planning estimate, not a measured delivery commitment: **3–6 focused engineering days** for adapter/contracts/fixtures, **2–4 days** for packaging, refresh/rollback, attribution and host capacity evidence; **5–10 days total**, plus source-rights review and host approval of unknown elapsed duration. Candidate planning adds roughly **3–5 days** for identity, zone/disagreement, planner support and end-to-end evidence. Existing npm dependency/data size, memory and latency are unmeasured here; do not quote invented MB/ms figures. A custom world-boundary build would be a larger operational project and is excluded from this estimate.

Recommended scoped reconciliation and targeted evidence are approximately **1–2 engineering days** after owner acceptance, excluding release/host work. Uncertainty is moderate: tests may expose additional missing-ID, cache or fold-handling issues. Neither estimate authorizes downloads, accounts, spending, deployment or publication.

## GSTACK REVIEW REPORT

| Review | Runs | Status | Findings |
|---|---:|---|---|
| Engineering plan review | 1 | Recommendation prepared; acceptance open | Architecture mismatch verified; existing interface retained; code/failure limits explicit; test gaps mapped; memory evidence distinguished from host budget. |
| Independent outside voice | 0 | Not run | No additional agent or model review claimed. |

**VERDICT:** Recommend global named-place scope with explicit acceptance and mapped evidence. Original Task 4 remains Partial. No implementation, tests, acquisition or deployment was performed in this lane.

**UNRESOLVED DECISIONS:**
- Owner acceptance of the proposed Task 4 replacement versus retaining the coordinate-boundary requirement; original checklist/status must remain unchanged until that decision and its required evidence are recorded.
