# NightSky global discovery implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking. Preserve the owner's execution method and final-audit timing.

**Goal:** Support bounded global candidate discovery across named places, countries, states and combined scopes, followed by planning at the selected candidate's actual point.

**Architecture:** Serve immutable, paged candidate files and administrative indexes through shared MCP tools. Build data outside the serving process, with explicit source-footprint coverage and resource admission. Keep current city/regional adapters compatible until an admitted global edition is available.

**Tech Stack:** Existing TypeScript, Zod, Node MCP server, Python OSM processing and checksum-pinned files; no runtime relational database.

**Spec:** [Global discovery design](../../product/global-discovery-design.md).

## Global constraints

- This document is the approved extension of original Tasks 0/2/4/8/10A/11C/12A/12B/15, not new completion credit. Current counts remain **12 Done / 9 Partial / 6 Not started**.
- The subsequent continuous local goal authorizes implementation, synthetic tests, available local model rehearsals, documentation, branch pushes and CI. No deployment, publication or new geographic/historical dataset downloads are authorized. Global acquisition requires a concrete admitted source/build budget.
- Preferred prepared input is OSM; Overture is an alternative after category/schema/license admission. Public Overpass and Nominatim are not the dependable production POI backend.
- Keep six existing categories. Limits: five origins, five included regions, five excluded regions, ten returned candidates, five comparison options; radius default 50 km, range 1–300 km; minimum distance default zero and no greater than radius.
- Require an origin or included region. Reject scope mixed with legacy place/radius fields. Exclusions win; any/all default to any. No world exclusion-only scan.
- Leaf cap 4 MiB/10,000 rows; default cache two leaves/8 MiB/20,000 rows; one active load and queue eight. Root/directory page cap 1 MiB. Initial query stops: 256 leaves, 32 MiB directory reads, ten seconds. These are proposed engineering stops, not a measured SLA.
- Preserve existing shared response limits: 4 MiB structured result, 64 sources and 20 caveats. Return budget/coverage gaps rather than silently trimming provenance or claiming a complete nearest list.
- Near-me uses consented host hints only when available, currently through the named-city approximation. Raw personal GPS/address support, driving routes, exact timezone polygons and verified night access are separate scope.
- Candidate planning requires known catalogue ID/revision and an explicit display timezone when actual site timezone is unverified. No silent city-centre calculation or guessed timezone.
- The implemented full registry has 14 tools; resolver-only mode stays one. Original twelve-tool evidence remains a historical snapshot, not the current inventory.

## Review focus

1. Empty admitted footprint versus uninstalled geography: distinct coverage, never infer no suitable sites — task steps under original Task 8.
2. Holes, border points, polar caps and antimeridian: bounded routing and correct representative-point membership — original Task 4/8.
3. Dense/large queries interrupted before exhaustive ranking: explicitly partial, never globally closest — original Task 8.
4. Stale candidate IDs or missing timezone: re-search/clarify, never plan at the wrong point — original Task 10A/8.
5. Missing consent/host hints and provider failure: ask for a town, retain unsupported evidence — original Tasks 11C/12B/15.

## File responsibilities and interfaces

| File | Responsibility |
|---|---|
| `shared/nightsky/discovery.ts` (new), `shared/nightsky/places.ts` | Strict input/result schemas, normalized scope, region and candidate references; preserve legacy calls. |
| `server/places/catalogueFiles.ts` (new) | Contained, bounded, checksum-validated paged reads and cache. |
| `server/places/globalCatalogue.ts` (new) | Spatial/admin/ID/name lookup, coverage accounting, deterministic candidate ranking. |
| `server/places/regions.ts` (new) | Bounded administrative name resolution and pinned membership artifacts. |
| `server/places/calculationPlace.ts` (new) | Resolve existing city or selected catalogue point for calculations. |
| `scripts/osm/build-global-catalogue.ts` (new) | Build paged artifacts from already admitted normalized inputs, without network fetching. |
| `scripts/osm/import_candidates.py`, `scripts/osm/regional_manifest.ts` | Reuse existing tag/geometry/provenance rules and preserve legacy artifacts. |
| `server/mcp/registerTools.ts`, `server/mcp/metadata.ts` | Wire schemas/providers, host consent handling and new read-only tools. |
| Existing astronomy/weather/planning service modules | Consume calculation-place resolution and explicit display timezone; retain city compatibility. Locate exact callers with `rg` before editing and list them in the execution ledger. |
| `tests/places/discoveryScope.test.ts`, `catalogueFiles.test.ts`, `globalCatalogue.test.ts`, `regions.test.ts` (new) | Contract, integrity/budgets, spatial/coverage and administrative tests. |
| `tests/mcp/global-discovery.test.ts` (new), `tests/all.test.ts` | End-to-end MCP discovery-to-plan tests and harness registration. |
| Canonical five workflow skills, package validators, `.github/workflows` | Updated orchestration, tool inventories and existing Linux/Windows CI. Discover actual package paths before editing; do not introduce a second canonical skill set. |

Shared types exported by `discovery.ts`:

- `RegionRef`: opaque versioned region ID, name, ISO3 country code, ADM0/ADM1 level, boundary revision, sources.
- `DiscoveryScope`: origins `{placeId,catalogueRevision?,radiusKm,minimumDistanceKm}[]`, `originMode`, included/excluded region IDs and `regionMode`.
- `DiscoveryCoverage`: footprint status `covered|partial|not-covered`, search completeness `complete|budget-limited|unavailable`, mapped-feature completeness `unknown`, catalogue revision and optional stop reason.
- `CandidateRef`: existing candidate fields plus catalogue revision; candidate coordinates remain public source geometry.
- `CalculationPlace`: ID/name/latitude/longitude/displayTimeZone, timezone basis `named-record|explicit-display`, source references and optional catalogue revision.
- `normalizeDiscoveryInput(input: SearchObservingLocationsInput): DiscoveryScope` retains legacy radius/default semantics.
- `CatalogueReader.search(scope: DiscoveryScope, options: {categories?: Category[]; limit: number}): Promise<SearchObservingLocationsResult>`.
- `CatalogueReader.details(ref: {placeId: string; catalogueRevision: string}): Promise<CandidateRef | undefined>`; `findNames(query: {placeQuery: string; countryCode?: string}): Promise<CandidateRef[]>`, max five.
- `RegionIndex.resolve(input: {regionQuery: string; countryCode?: string; adminLevel?: 0|1}): Promise<RegionRef[]>`, max five; `members(regionId: string): AsyncIterable<string>` of paged candidate IDs.
- `resolveCalculationPlace(input: {placeId: string; catalogueRevision?: string; displayTimeZone?: string}, deps: {cities: GeoNamesPlaceIndex; catalogue: CatalogueReader}): Promise<CalculationPlace>`; use the existing index exported from `server/places/geonames.ts`; typed clarification errors on stale/missing IDs or absent candidate timezone.

## Sequence and parallel work

| Stage | Existing tickets | Dependency / parallel lanes | Deliverable |
|---|---|---|---|
| 1 | 0/8 source admission; 2/8 contracts | Source inventory and contracts can proceed independently; no dataset download | Explicit unresolved acquisition gate; frozen schema/interfaces. |
| 2 | 8 paged reader/build; 4/8 administration; 11C workflow drafts | Three independent lanes after contracts; synthetic fixtures only | Bounded reader, region indexes and workflow text. |
| 3 | 8 query engine/details; 10A candidate planning | Query engine needs reader/region indexes; planning needs details interface | Correct scope search and exact candidate-point calculations. |
| 4 | 12A/12B/15 integration | After both stage-three outputs; package and regression checks can run in parallel | Complete local package and CI evidence. |
| 5 | 0/8 real global edition, then 12/15 installed-model checks | Source/build budget admitted first; assembled package first | Measured coverage/host fit and complete user-experience test. |

Stage five is a real remaining gate, not something synthetic tests can close. Website remains a separate workstream. Final broad audit and deployment remain deferred.

## Original Tasks 0/8 — select and admit prepared global input

**Files:** update `docs/operations/global-spot-acquisition-proposal.md`; create `docs/operations/global-catalogue-source-admission.md`.

**Produces:** release inventory with exact source edition, categories/licenses, nonduplicated geographic footprints, expected build resources, approved acquisition bounds and unresolved fields clearly labelled.

- [x] Inventory OSM global extract coverage and Overture outdoor-category alternatives from primary metadata. Include islands, territories, poles and date-line footprints; do not use world record count as our subset size.
- [x] Record input choice and distribution obligations. Reject an input missing usable representative geometry or provenance. Do not automatically combine differing source licenses.
- [x] Separate free data from local hardware/build cost. Leave actual final catalogue size and capacity unverified until measured; propose exact limits for owner review before any acquisition.
- [x] Check every source claim against its linked primary document; commit the admission document without marking Task 8 Done.

## Original Tasks 2/8 — contracts and normalization

**Files:** shared discovery/places files; `tests/places/discoveryScope.test.ts`; register in `tests/all.test.ts`.

**Produces:** shared types and `normalizeDiscoveryInput` above. Use a strict object plus exclusivity validation suitable for MCP input schemas. Do not apply a legacy radius default before detecting whether scope was supplied.

- [x] Write failing `legacyDefaultsRemain50And5`: old `{placeId}` normalizes one origin/radius 50/minimum zero; existing response fields preserved.
- [x] Write failing `scopeTruthTable`: any/all origins, any/all regions, exclusions, category complement and minimum-distance bounds; reject sixth origin/region, zero or 301 radius, minimum above radius, exclusion-only, mixed scope/legacy and unknown properties.
- [x] Run `npx tsx --test tests/places/discoveryScope.test.ts`; expected failures for missing new schemas/normalizer.
- [x] Implement strict schemas, default any modes, versioned reference validation and normalized result fields. Region-only sort is completeness/name/ID; origin any sorts minimum distance, all maximum distance.
- [x] Rerun focused tests and `npm run check`; expect zero failures; commit only owned files.

## Original Task 8 — bounded paged storage and offline builder

**Files:** catalogue reader/global builder files and reader tests; reuse existing OSM importer. No network code in builder.

**Consumes:** shared references/coverage types. **Produces:** `CatalogueReader` implementation and schema-v2 root referencing bounded directory, spatial leaf, by-ID, by-name and administrative membership pages.

- [x] Write failing `readerRejectsUnsafeArtifacts`: traversal/symlink escapes, oversized pages/rows, hash/byte/count disagreement, malformed bounds, conflicting duplicate IDs and edition mismatch must reject.
- [x] Write failing `boundedResidentCacheAndStops`: two-leaf cache, serialized loader, queue eight, explicit 256-leaf/32 MiB/ten-second stops; no unlimited root inventory.
- [x] Run `npx tsx --test tests/places/catalogueFiles.test.ts`; confirm failures before implementation.
- [x] Implement hierarchical directory pages and shared bounded read/cache interface in `catalogueFiles.ts`. Check deadline at reads and traversal steps. Pin IDs/name/membership indexes to the same edition; no whole-catalogue RAM map.
- [x] Implement deterministic builder over admitted normalized inputs. Separate coverage footprint from candidate bounds; atomically publish validated manifest, preserve native source vintage and rollback edition. Reject conflicting-ID editions instead of last-writer wins; preserve failure evidence.
- [x] Add `rebuildIdenticalAndEmptyFootprint` fixture: repeat output hashes match; admitted empty footprint survives build; incomplete geometry cannot become accepted candidate coverage.
- [x] Rerun focused tests and typechecks; inspect measured synthetic peak cache/resource counters; commit. Synthetic capacity is not global build evidence.

## Original Tasks 4/8 — country/state resolution and membership

**Files:** `regions.ts`, builder administrative adapter, `tests/places/regions.test.ts`.

**Consumes:** pinned gbOpen ADM0/ADM1 full geometry and metadata, already admitted offline. **Produces:** `RegionIndex` and candidate membership pages; no geographic timezone service.

- [x] Write failing `ambiguousNamesRequireSelection`: country/state collision, same-name states in different countries and ISO3 disambiguation; no capital fallback.
- [x] Write failing `membershipHolesBordersAndDateline`: point on exterior boundary included, hole interior/boundary excluded, multipolygon islands included, date-line geometry normalized; bounding box alone never establishes membership.
- [x] Run `npx tsx --test tests/places/regions.test.ts`; expect new adapter failures.
- [x] Implement bounded name lookup and build-time representative-point membership. Full geometry determines membership; simplified geometry only for display. Track boundary edition/license and contested-boundary caveats. Reject unknown region IDs.
- [x] Rerun focused tests/typechecks; commit. Alias files are names, never proof of geometry coverage.

## Original Task 8 — combined search and selected-spot details

**Files:** `globalCatalogue.ts`, `tests/places/globalCatalogue.test.ts`; keep regional adapter unchanged until explicit provider selection.

**Consumes:** `CatalogueReader`, `RegionIndex`, normalized scope. **Produces:** search/details/name lookup methods defined above.

- [x] Write failing `scopeResultsMatchBruteForce`: synthetic complete reference for radius bands, country/state intersection/union, exclusion-wins, five origins any/all and category filters; deterministic ordering and per-origin distances.
- [x] Write failing `emptyMissingAndTruncatedAreDifferent`: installed empty footprint, missing coverage, density/time/read stop; never describe partial list as globally nearest.
- [x] Write failing `staleDetailsAndNamedCandidate`: stale/missing ID, name ambiguity, candidate revision and explicit point/source links; reject arbitrary path/URL IDs.
- [x] Run `npx tsx --test tests/places/globalCatalogue.test.ts`; expect failures.
- [x] Implement spherical distance routing including pole/date-line cases, membership-based broad-region traversal and bounded ranked results. Use source completeness only, not guessed darkness/access quality. Hold public candidate geometry separately from private origins.
- [x] Rerun focused tests/typechecks; preserve original regional tests and commit.

## Original Tasks 8/10A — plan at the chosen candidate point

**Files:** `calculationPlace.ts`, existing calculation services and shared planning/astronomy/weather inputs, `tests/mcp/global-discovery.test.ts`.

**Consumes:** details lookup and explicit display timezone. **Produces:** `resolveCalculationPlace` and consistent stateless propagation through astronomy/weather/planning/comparison.

- [x] Write failing `candidatePlanUsesCandidatePoint`: use fixture city/site with different coordinates; astronomy matches direct site calculation, weather request uses site coordinates, no city-centre substitution.
- [x] Write failing `candidateRequiresTimezoneAndFreshRevision`: absent timezone prompts choice; invalid IANA zone/stale revision rejected; explicit display timezone labelled; named-city behavior unchanged.
- [x] Run `npx tsx --test tests/mcp/global-discovery.test.ts`; confirm missing implementation failures.
- [x] Implement shared calculation-place adapter and thread optional revision/display timezone through all consuming tool inputs. Resolve once per request; validate revision atomically against selected edition. Do not persist user settings or infer candidate's actual timezone from nearest city.
- [x] Rerun focused tests/typechecks plus existing planner/comparison suites; commit. Original Task 10A stays Done; extension completion recorded separately.

## Original Tasks 11C/12A/12B/15 — orchestration, package and CI

**Files:** tool registry/metadata, canonical workflows, package validators, harness and actual affected workflows.

**Consumes:** completed contracts/providers/planning. **Produces:** 14-tool full registry, unchanged one-tool resolver registry, offline complete-package regression evidence.

- [x] Add failing registry tests: exactly 14 full tools/one resolver tool; both additions read-only; descriptions state coverage/access limits; packaged schema and skill tool names agree.
- [x] Add failing `noHostHintOrConsentRequestsTown`: no implicit location read; unavailable Claude/Gemini hints prompt town rather than fabricated location. Host web search absence must not break catalogue planning.
- [x] Implement registry wiring and provider configuration. Default legacy artifact behavior remains valid; absent global artifacts cannot be advertised as global discovery coverage. Refresh hardcoded package inventory counts only after new tools exist.
- [x] Update the five canonical workflows with every row in the design matrix: direct filters, bounded planning comparisons, clarification and unsupported travel/access/raw-GPS cases. Keep forecast horizons/history and source-specific data separate.
- [x] Run `npm test`, `npm run check`, `npm run plugin:package`, `npm run test:review-cases`, builds and existing runtime checks. Add new tests to the discovered harness and relevant Linux/Windows jobs; all must pass with no external downloads.
- [x] Update existing tickets with exact implemented-versus-source/host/model gates. Commit/push the branch; watch all six CI jobs at the exact commit, fix regressions and record evidence.
- [ ] After the complete package is assembled, run installed Codex/Claude journey matrix and owner questions as a separate explicitly scheduled verification step. No upload/deployment inferred from local packaging.

## Acceptance and deferred gates

**15 October local closure:** all local implementation/checklist steps above are complete and reviewed. Fresh aggregate verification has 657 tests, 656 passed, one existing permission skip and zero failures. [All six CI jobs passed](https://github.com/tandavkrishna27/nightsky.earth/actions/runs/38642020834) on corrected substantive revision `655f747d90966072b2096aa315e7bfecf005c8b1`. The sole unchecked installed-client step is partially exercised: twenty complete-instruction Codex questions plus supplements were reviewed; native Codex skill reading was rejected by automatic policy, and Claude native initialization succeeds but inference awaits sign-in. It remains a client acceptance gate, not unimplemented local code. [Closure and remaining gates](../../operations/local-goal-closure.md) preserve original counts.

Local implementation acceptance: legacy behavior preserved, all combinations have either verified contract behavior or explicit clarification, selected-site calculations use its point, bounded memory/read behavior holds, complete skills/tools package agrees and exact-revision CI passes.

Global product acceptance additionally requires an admitted actual edition with intended global footprints, measured build/storage/refresh costs and selected-host fit. Regional fixtures, free licenses and synthetic tests cannot establish those. Public review/submission, hosted URLs, identity/TLS, historical baseline and event gaps remain their original gates.

## Plan self-review — 15 October 2026

Design matrix covered by contract/search tests and workflow clarification paths. Reader, region and planning interfaces use the same references/revisions. All five review-focus failures have owning tests. Acquisition remains separate from implementation; no counts or original Done tickets changed by this plan. Precise GPS, routing and access certification remain explicit unsupported paths, rather than accidental promises.

**Native acceptance follow-up, 15 October:** owner sign-in is complete. Claude now demonstrably invokes native NightSky skills and reads their packaged workflows before MCP calls. The full native acceptance item stays open: answer review found unsupported Moon/direction/twilight statements, omitted links and inconsistent prescribed tool sequencing. A guidance correction and regression are committed; the permitted diagnostic retry did not eliminate every semantic issue. See [native rehearsal evidence and limitations](../../operations/complete-model-journey-validation.md). Original ticket counts are unchanged; successful installation/tool execution is not a clean model-journey pass.

**Reliability follow-up (existing Tasks 9/10A/11C/12A/12B/15):** corrected server evidence now includes geometric Sun/Moon horizon intervals, sampled bearing times, local candidate endpoints and explicit darkness overlap; phase-only and instant-cloud assessments stay unknown. Aggregate planning replaces redundant mandatory provider calls. The native harness proves complete packaged workflow retrieval and supports bounded affected-case selection. Regression/type verification passes; see [the current native review](../../operations/complete-model-journey-validation.md#reliability-follow-up--15-october-2026-local-package-105) for exact evidence and still-open answer findings. Current-Codex native tool use is demonstrated separately from the older nested CLI policy restriction. The installed-client acceptance checkbox stays open and original ticket counts do not change. No deployment or new source data was authorized.

**Answer presentation follow-up (same existing tickets, local package 1.0.6):** human-readable MCP responses now expose complete returned source URLs and bounded planning facts; all five skills front-load timezone clarification and answer limits. Fresh Claude access/selected-candidate checks now ask and wait before planning. Urban direction advice and meteor source completeness still fail review. A fresh Codex-host London check preserves evidence and links without setup bearings. The acceptance checkbox remains open; **12 Done / 9 Partial / 6 Not started** is unchanged. Verification: 683 discovered / 682 passed / one existing skip, three type checks, plugin package/build and eight offline review assertion sets pass; independent code and answer reviews completed. See [exact affected-case evidence](../../operations/complete-model-journey-validation.md#answer-presentation-follow-up--15-october-2026-local-package-106). No deployment/publication or new data downloads.
