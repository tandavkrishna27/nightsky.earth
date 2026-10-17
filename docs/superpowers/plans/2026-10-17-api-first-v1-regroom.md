# API-first V1 Regroom Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the original NightSky V1 journey using admitted API/search sources without making an exhaustive local geography catalogue a launch prerequisite.

**Architecture:** Separate named-place resolution, candidate discovery, selected-place calculation and historical context behind bounded source-aware interfaces. Retain local astronomy, MET Norway forecasts, NOAA aurora and optional catalogue adapters. Host search supplements discovery only where actually exposed; the plugin must have its own admitted discovery path and an honest unavailable response.

**Tech Stack:** Existing TypeScript, Node, Zod 4, MCP server, Express and Node test runner; existing upstream controls and bounded cache patterns.

**Spec:** `docs/operations/api-search-discovery-v1-decision.md`; original ticket authority: `docs/superpowers/plans/2026-10-10-nightsky-v1-execution-ready.md`.

## Global Constraints

- “No runtime database; small configuration/static reference files and bounded caches are allowed; no planet source on deployment server.”
- “No paid fallback or API key is silently introduced.”
- “Historical cloud statistics | Unchanged; independent source/feasibility decision, not automatically deferred”.
- “Global means requests may target locations worldwide; it does not promise exhaustive or uniform upstream search coverage.”
- “Existing privacy/input restrictions remain in force; provider-sourced candidate coordinates do not automatically enable arbitrary user GPS/address inputs.”
- This plan grants no download, provider job, live request, deployment, submission or publication authority. This regroom itself changes documents only and supplies no implementation evidence.
- A changed acceptance path does not close a ticket. Preserve the existing 27 original headings; the tasks below are implementation slices within them.

## Research addendum — 17 October 2026

See the [consolidated API and cleanup plan](../../operations/api-provider-research-and-cleanup-plan.md) and its three primary-source reports. Location shortlist: GeoNames + Geoapify Free; public Overpass/Nominatim are not default production backends. Retain MET Norway, NOAA and local astronomy. The later source decision selects Open-Meteo ERA5 as the conditional historical route; CDS is not the active implementation route. Initial Geoapify/MET/WeatherAPI/OpenWeather activation and durable quota accounting have evidence, while broader admission, post-trial entitlement and remaining historical/geometry/event coverage remain open. See the [current tracker](../../operations/v1-completion-tracker.md) rather than restarting account setup or the earlier CDS evaluation. Optional sources do not automatically expand V1.

Cleanup follows the consolidated plan: exact raw-file manual list first; preserve required GeoNames reference until API runtime replacement passes; keep optional builders/tests and metadata. No deletion is performed by this addendum.

## Review Focus

- No local GeoNames/OSM files: the configured API journey must work through selected-place planning (tasks B, D, F).
- Recycled or expired upstream identity: reject stale selection before weather/calculation rather than silently moving a site (B, D).
- Administrative filters unsupported by a source: report the limitation; never use a centroid or omit exclusions (C).
- Host search/location absent or adversarial search text present: preserve input policy and source trust boundaries (E).
- Historical API offers daytime/monthly means or too few years: do not relabel them as the required dark-time baseline (H).

## Starting-point code-change matrix (pre-implementation audit)

| Original tickets | Current implementation / required correction | Files and retained behavior |
| --- | --- | --- |
| 0, 4, 8 | No selected API source yet. Local GeoNames resolves names; `candidatesFor` uses regional/flat OSM and global discovery uses a local catalogue. Admit roles and service limits before choosing adapters. | `server/places/geonames.ts`, `server/mcp/registerTools.ts`; retain local adapters as optional modes. |
| 2, 4, 8 | Candidate/coverage/detail contracts require `catalogueRevision`; named references require an IANA zone and `indexVintage`. Define API identity, freshness, unknown timezone and bounded search semantics without pretending an API has a catalogue edition. | `shared/nightsky/{common,places,discovery,planning,astronomy,weather,climate}.ts`; retain legacy shapes via explicit alternatives. |
| 4, 5, 10A, 10B | Handlers eagerly require GeoNames; planner accesses `services.index`; `calculationCoordinates` revalidates all `named-record` points through GeoNames. Remove this coupling for validated API selections. | `server/places/calculationPlace.ts`, `server/nightsky/{planner,astronomy,compare}.ts`, `server/events/catalog.ts`, `server/mcp/{registerTools,route}.ts`. |
| 7A, 7B, 8 | Upstream admission currently recognizes only `met` and `noaa`. Provider fallback needs separate quotas, endpoint allowlists, timeouts, payload/cache bounds, provenance and deterministic failure rules. | `server/providers/upstreamControls.ts`, new `server/places/api/` modules. Keep MET/NOAA algorithms and evidence. |
| 9 | Climate injection takes `(placeId, month)` and configured providers depend on local mappings; candidate history currently returns `candidateClimateGap`. Preserve the feature and assess an API route explicitly. | `server/providers/climate/configuration.ts`, `server/mcp/registerTools.ts`, `shared/nightsky/climate.ts`; keep ERA5 readers/builders. |
| 14 | Bootstrap loads configured catalogues and GeoNames; operator full/rollback checks require GeoNames, OSM and climate artifacts regardless of source mode. Replace artifact assumptions with mode-specific evidence. | `server/plugin.ts`, `shared/nightsky/operator.ts`, `scripts/plugin-operator-preflight.ts`; retain hash verification whenever artifacts are configured. |
| 11C, 12A/B, 15 | Skills describe installed-index/catalogue flows; metadata marks resolution/discovery as closed-world. Update actual network behavior and host capability handling. | Five `plugins/nightsky/skills/*/SKILL.md`, canonical `docs/product/workflows/*.md`, `server/mcp/registerTools.ts`, package/review metadata. |
| 0, 14, 15 | Runtime smoke uses a synthetic GeoNames file; CI has catalogue and history jobs. Add an API fixture runtime path and real-service measurement gate; keep optional adapter regressions. | `scripts/verify-plugin-runtime.mjs`, `.github/workflows/nightsky-v1-checks.yml`, `package.json`, new measurement harness. |

## Order and parallel lanes

Start A (source admission) and H (history feasibility) independently. B defines shared contracts after A; C (provider adapter) and E (workflow preparation) can then proceed in parallel. D joins B+C; F joins A+D and H's chosen runtime disposition; G joins D+E+F plus original event/history obligations. E can draft capability guidance early but cannot claim unavailable implementations. One integrator owns shared schemas and `registerTools.ts`; avoid parallel edits to those files. Historical and event work retain their original tickets and can run alongside geography.

### Task A — Bound and admit the provider design (original 0, 4, 8; S2)

**Files:** Create `docs/operations/api-provider-admission.md`; update `docs/operations/api-search-discovery-v1-decision.md` only with evidenced decisions.

**Interfaces:** Produces an admission table consumed by B/C/F: role (`geocode`, `region`, `poi`, `timezone`), source ID, fixed endpoint, identity fields, coverage, attribution/terms, contact/account requirements, caching permission, numeric quota/concurrency/timeout/response/cache limits, supported query semantics and fallback order. These are required review fields, not presently selected values.

- [ ] Complete admission for the researched GeoNames web-service and Geoapify Free shortlist; Photon remains an optional demo experiment. See the research addendum for exact policy evidence. Do not assume public Overpass is a sustainable application backend or Nominatim permits POI extraction.
- [ ] Resolve each role separately. Record whether one source meets multiple roles and where supported worldwide queries still have missing coverage. Verify policy from primary documentation during provider admission; no live service calls are necessary for this design decision.
- [ ] Choose the primary and any fallback only after filling every admission field. Pin per-provider error behavior: quota/timeout may use an admitted fallback; a semantically unsupported region query must not be changed to radius search. Record source conflicts without averaging or merging unrelated identities.
- [ ] Review the actual free-service feasibility and authentication burden. If no suitable provider exists for a required role, leave the ticket open with the exact gap and a concrete scope/source decision; do not fabricate approval or default to bulk acquisition.
- [ ] Publish exact adapter module names and upstream provider IDs as an addendum before task C starts. This is a bounded design gate, deliberately preceding exact service-specific implementation.

### Task B — Source-neutral selection and calculation contract (original 2, 4, 5, 8)

**Files:** Modify `shared/nightsky/{common,places,discovery,planning,astronomy,weather,climate}.ts`, `server/places/calculationPlace.ts`; create `server/places/api/types.ts`, `server/places/api/selectionStore.ts`, `tests/places/api-selection.test.ts`.

**Interfaces:** Add `ApiSelectionRef = { placeId: string; sourceRevision: string }` alongside existing catalogue references. Add `SelectedPlaceResolver.resolve(input: CalculationPlaceInput): Promise<CalculationPlace>`; extend `CalculationPlaceInput` with optional `sourceRevision`. `CalculationPlace` carries a validated source snapshot, actual point, display zone and explicit timezone evidence. `ApiSelectionStore.put(record): ApiSelectionRef` and `.get(ref): record | undefined` use bounded TTL/bytes/entries from A; snapshots are immutable, process-shared and require re-resolution after expiry/restart. IDs identify provider records; a snapshot revision is not an upstream catalogue version.

Define the source record as `{ providerId, upstreamId, fetchedAt, expiresAt, sourceUrl, attribution, name, latitude, longitude, timeZoneEvidence }`. Use `place:v1:api:<providerId>:<sha256-of-upstreamId>` IDs and a `sourceRevision` SHA-256 of the canonical normalized snapshot; keep raw upstream IDs private. Validate this additional namespace in `placeIdSchema`. When a source has no stable ID, admission must specify a bounded snapshot-only identity and its limitations; never deduplicate unrelated sources by name alone. `timeZoneEvidence` is either `{ status: "verified", timeZone, source }` or `{ status: "unknown" }`; verify IANA syntax and source applicability to the actual point. A provider's country or nearby-city timezone is insufficient evidence. Keep display choice separate from actual-site evidence.

- [ ] Write tests `expired_selection_requires_resolve_again`, `same_id_changed_point_does_not_rebind`, `unknown_site_zone_requires_explicit_display_zone` and `named_api_place_does_not_require_geonames`. Assert no provider/calculation invocation after a selection error.
- [ ] Run `node --import tsx --test tests/places/api-selection.test.ts`; expect failure before implementation.
- [ ] Implement discriminated API versus catalogue selection/coverage contracts and bounded selection storage. Preserve existing catalogue revision validation. Unknown source timezone is representable; a validated provider IANA zone carries its own evidence, while explicit display choice remains distinct. Do not classify API names as GeoNames `named-record` merely to bypass checks.
- [ ] Preserve named-query/host-consent policy and reject arbitrary user coordinate/street-address input. API-source coordinates are server-validated outputs, not a new raw GPS input field. Update all tool selection inputs together and reject mixed catalogue/source revisions.
- [ ] Run the new test and existing `tests/nightsky/candidate-planning.test.ts`, `tests/places/geonames.test.ts`; expect pass. Review/commit this slice only during authorized implementation.

### Task C — Bounded discovery with explicit fallback (original 0, 4, 8)

**Files:** Create `server/places/api/discovery.ts`, `server/places/api/configuration.ts`, adapter modules named in A, `tests/places/api-discovery.test.ts`; modify `server/providers/upstreamControls.ts`, `server/places/api/types.ts`.

**Interfaces:** `DiscoveryProvider.resolvePlace(input: ResolvePlaceInput): Promise<ApiResolveResult>`; `.resolveRegion(input: ResolveObservingRegionInput): Promise<ApiRegionResult>`; `.search(input: SearchDiscoveryInput): Promise<ApiDiscoveryResult>`; `.details(ref: ApiSelectionRef): Promise<ApiPlaceDetailsResult>`. Define those Zod-backed types in B/C using existing result envelope and limits: five name matches, ten candidates, five origins/regions/exclusions, radius 1–300 km. Results carry per-source attempt status, observed freshness, unknown missing fields, actual supported scope and truncation reason.

Export `ResolveObservingRegionInput` from the existing `resolveObservingRegionInputSchema` inference. Preserve named-site search, nearby/radius and minimum-distance bands, state/country scope, combined multi-origin any/all and multi-region any/all, included/excluded regions and categories (including complements of the six supported categories). Exclusions win. Preserve per-origin straight-line distances: origin `any` orders by minimum distance, `all` by maximum distance, followed by existing deterministic tie-breaks; region-only ordering must not imply nearest or best sky. API region references need their own source revision/evidence alternative to `boundaryRevision`; update `regionRefSchema` with B's discriminated source model. An upstream region label alone is not proof of polygon membership. Admission must describe which source can honor each combination, and tests must prove the requested intersections/exclusions survive the adapter or receive a specific unsupported response. A named-town path is a useful fallback offer, not replacement acceptance for broad discovery.

- [ ] Add fixture tests for ambiguous names, missing fields, malformed coordinates, 429/timeout, oversized response, duplicate upstream identity, empty result versus unavailable, dateline/polar scopes, region exclusions and exhausted query budget. Assert at most ten returned candidates and no silent constraint removal.
- [ ] Run `node --import tsx --test tests/places/api-discovery.test.ts`; expect fail.
- [ ] Implement admitted adapters with fixed allowlisted endpoints, identifying headers, field validation and source attribution. Extend upstream controls with the exact provider IDs/limits from A; enforce application-wide quotas across the selected process topology, or restrict deployment to one process where process-local controls are the only enforcement.
- [ ] Implement bounded deterministic fallback and cache reuse. Preserve sources and disagreement; do not certify access/darkness/safety from POI tags. Unsupported administrative membership returns explicit unavailable/partial status rather than an invented boundary claim. No unbounded paging or global scraping.
- [ ] Run the new tests plus `tests/mcp/provider-controls.test.ts`, `tests/places/discoveryScope.test.ts`, `tests/places/globalCatalogue.test.ts`, `tests/mcp/global-discovery.test.ts` and `tests/mcp/result-budget.test.ts`; expect pass. Reuse existing scope truth-table/result assertions against the API fixture route for combinations, complements, distances and truncation. Retain optional local discovery tests unchanged unless an intentional shared-schema migration requires compatibility updates.

### Task D — Wire direct and composed tools without local-index prerequisites (original 3, 4, 5, 7A/B, 8, 10A/B)

**Files:** Modify `server/mcp/{registerTools,route}.ts`, `server/plugin.ts`, `server/nightsky/{planner,astronomy,compare}.ts`, `server/events/catalog.ts`, `server/places/calculationPlace.ts`; create `tests/mcp/api-discovery-planning.test.ts`.

**Interfaces:** Add `NightSkyDependencies.discoveryProvider` and `.selectedPlaceResolver`; replace mandatory `PlannerServices.index` with the resolver plus `getPlaceRef(input): Promise<PlaceRef>` for display metadata. Optional legacy index remains an adapter dependency. Existing astronomy, forecast, events and aurora consume the same validated `CalculationPlace`, never a nearby city's substitute.

- [ ] Write an assembled no-local-files test: resolve ambiguous API name, select match, search, get details, select display zone if needed, plan and compare; assert exact selected coordinates reach mocked MET/NOAA and local astronomy, source revision survives every tool and historical missing coverage remains visible.
- [ ] Run `node --import tsx --test tests/mcp/api-discovery-planning.test.ts`; expect fail.
- [ ] Wire configured mode once at startup and share bounded services across stateless MCP calls. Remove eager GeoNames loading from API handlers and all fallback revalidation of API points through local IDs. Update context/details and provenance helpers that currently infer “candidate” solely from `catalogueRevision`.
- [ ] Update tool descriptions and `openWorldHint` for actual network resolution/discovery/detail/history behavior. Keep resolver-only exposure and request privacy rules intact.
- [ ] Run the new test plus `tests/mcp/planning-e2e.test.ts`, `tests/mcp/global-discovery.test.ts`, `tests/mcp/resolver-only.test.ts`, `tests/mcp/tool-metadata.test.ts`; expect pass.

### Task E — Optional host search and workflow handoff (original 11C, 12A/B, 15)

**Files:** Update all five `plugins/nightsky/skills/*/SKILL.md` and corresponding `docs/product/workflows/*.md`; modify `tests/mcp/metadata-privacy.test.ts` and `tests/mcp/offline-journeys.test.ts` for contract fixtures.

**Interfaces:** Consume C's exposed capabilities and B's source selection refs. Host search is an assistant capability, not an assumed server-side web-search provider. A search-discovered name is passed through plugin resolution/details to obtain the validated selection. Do not pass arbitrary host text/URLs as executable provider configuration.

- [ ] Add fixtures for no host search, no host location, host search available, ambiguous search result and prompt injection in source text. Assert a usable API flow without host search, consent before approximate host location and no invented candidates when sources fail. Near-me acceptance covers both actually supplied consented host hints and absence of hints: the latter asks for town/country without pretending permission or location capabilities exist; the former preserves declared approximate-origin and town-centre distance semantics.
- [ ] Update guidance to preserve source links/freshness, coverage limitations, exact candidate point and explicit display timezone. Replace mandatory installed-catalogue wording with mode-specific explanations; keep access verification and personal-location restrictions.
- [ ] Run the two listed tests and the existing package validation command from `package.json`; expect pass. Actual client/skill-loading evidence belongs to original 12B and cannot be replaced by these fixtures.

### Task H — Historical-weather API feasibility and implementation gate (original 0, 9)

**Files:** Create `docs/operations/history-api-feasibility.md`; after source decision, modify `server/providers/climate/configuration.ts`, `server/mcp/registerTools.ts`, `server/nightsky/planner.ts`; extend `tests/mcp/climate-e2e.test.ts`, `tests/providers/climate/production-history-plan.test.ts`.

**Interfaces:** Evolve climate injection to `getClimatology(placeId: string, month: number, point?: CalculationPlace): Promise<ClimateContextResultV2>`. Keep the current structured historical contract and ERA5 adapters. Exact API adapter files follow an admitted source/method design, as in A.

- [ ] Evaluate on-demand historical routes for required 1991–2020 coverage, hourly cloud inputs during local darkness, grid/cell displacement, IANA-zone/observing-night mapping, missingness, per-year eligibility, reproducibility, terms and bounded request/cache/storage cost. A generic monthly cloud average is not equivalent evidence.
- [ ] Record a concrete outcome: admitted API route with exact source/method/limits; retained bounded artifact route with explicit operational costs; or unresolved feasibility with precise missing requirement. History remains required until an explicit owner scope change; geography deferral does not defer it.
- [ ] For an admitted route, add tests for wrong period/timezone/cell, insufficient years and hourly samples, API timeout and candidate coverage. Assert honest `not-covered`/partial states and no numeric baseline from insufficient data; run the listed tests to see the new assertions fail.
- [ ] Implement the selected route and point-aware injection; preserve source provenance and dark-time statistic definitions. Remove blanket candidate rejection only where verified mapping exists. Run the listed tests to pass; actual data-quality/source validation still requires authorized measurements.

### Task F — Mode-specific deployment and preflight (original 0, 14)

**Files:** Modify `server/plugin.ts`, `shared/nightsky/operator.ts`, `scripts/plugin-operator-preflight.ts`, `scripts/verify-plugin-runtime.mjs`, `.github/workflows/nightsky-v1-checks.yml`, relevant `package.json` scripts and operator documentation; extend `tests/operations/operator-preflight.test.ts`.

**Interfaces:** Add explicit `NIGHTSKY_DISCOVERY_MODE=api|catalogue|regional|legacy` configuration and corresponding operator source configuration, with selected provider IDs and non-secret policy/budget evidence. Validate current and rollback tuples according to their own modes. History mode is independently explicit and follows H.

- [ ] Add tests where selected API mode with admitted config and bounded resource evidence passes without GeoNames/OSM artifacts; missing provider evidence fails; malformed configured catalogue pins still fail; rollback to either mode validates that mode's complete dependencies. Missing required historical capability must not become a blanket pass.
- [ ] Run `node --import tsx --test tests/operations/operator-preflight.test.ts`; expect new cases fail.
- [ ] Replace unconditional full-product and rollback artifact requirements in `shared/nightsky/operator.ts` with mode-specific checks. Preserve TLS, identity, retention, provider budgets, process limits, current/rollback capacity and lineage checks for installed artifacts.
- [ ] Add an offline API-fixture standalone runtime smoke with no local data environment variables/files. Keep catalogue/ERA5 CI regressions; remove only launch/package assumptions requiring acquisition, not useful producer code or tests. CI must not call public providers or download data automatically.
- [ ] Run the preflight tests, `npm run check`, package build and configured runtime smoke; expect pass. Record actual commands from the current package scripts at execution time.

### Task G — Evidence-based original-ticket closure (original 0, 6, 8, 9, 12–17; S2/S3)

**Files:** Create `scripts/measure-api-runtime.ts` and `tests/operations/api-runtime-measurement.test.ts`; update `docs/operations/{v1-completion-tracker,v1-remaining-ticket-release-matrix}.md` and existing release evidence records after verification.

**Interfaces:** Measurement report records exact source configuration/version, request cases, cache occupancy/bytes, calls/retries, per-source status, p50/p95 latency, peak RSS, cold startup, concurrency and current/rollback/scratch storage. Default execution is offline fixtures; live calls require a separately authorized case/count/time budget.

- [ ] Test report validation and prove fixture reports are labelled synthetic and cannot satisfy live evidence gates.
- [ ] Implement the bounded harness, run its offline test and smoke; do not infer source quality or global coverage from fixtures.
- [ ] Once authorized, measure the actual selected service and remaining static/history/event inputs under realistic rate-limit, failure and refresh scenarios. Use the admitted limits; stop at the authorized envelope.
- [ ] Close original Task 8 only with a working admitted API path, attribution, fallback/capability and ambiguity evidence. That closes the geography portion of S2; S2 also requires its independent historical-weather and event source/feature gates. Original 6 events and 9 history retain their acceptance. S3 closes on local actual-configured-service measurements before deployment; it does not require an already deployed host. Original 14 closes later with selected-host capacity, TLS/proxy/logging, deployment and rollback evidence.
- [ ] Preserve original sequential owner/client gates: 3B hosted connection, 3C identity/URL, 4B real draft scan, 12A/B package/native clients, 13 policies, 15 ready review packet, 16 separately authorized submission/publication, 17 invited pilot. Task 18 remains separate website scope. No broad “API migration complete” checkbox substitutes for these.

## Implementation progress — 17 October 2026

A's bounded adapter design is recorded in `docs/operations/api-provider-admission.md`; live activation remains gated. B/C/D are implemented in an opt-in API route and locally reviewed and regression-tested; see `docs/operations/api-migration-wave-20261017.md`. E's five skills and canonical workflows are updated with offline instruction tests. F has API-mode bootstrap/preflight and compiled no-local-geography smoke. G has a fixture-only measurement harness. H's feasibility assessment is complete as an assessment, with scientific provenance and long-series resource feasibility unresolved. Exact original-ticket status is in the tracker; no full-ticket closure follows merely from these slices.

Keep remaining unsupported combinations, historical coverage, source rights/activation, restart accounting and permitted live measurements visible. Do not interpret existing unchecked acceptance items as authorization for data downloads or deployment.

## Immediate next concrete work — corrected after implementation

Follow the [parallel local completion run](../../operations/parallel-completion-run-20261017.md) for remaining geography, practical historical API delivery and event guidance, alongside API-mode policy, measurement and rehearsal work. The [multiple-weather activation plan](2026-10-17-multi-weather-activation.md) retains its implemented evidence and unresolved acceptance gates; existing B/C/D and durable quota/account setup are not work to restart. API account creation and initial connectivity are not universal live acceptance. Previously consumed live allowances grant no further requests.

Self-review: provider contracts precede adapters; shared files have one owner; source-specific forecasts must survive planning; free entitlement is checked per endpoint; history remains required; optional catalogue code is preserved. The follow-up document is a plan, not passing-test or activation evidence.
