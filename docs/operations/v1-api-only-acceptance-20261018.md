# V1 API-only local acceptance review — 18 October 2026

## Authority, scope and evidence limits

Independent local review of baseline `00811718f25cea1756c555a0da62ef47d6e077e5`, package source 1.0.33, with concurrent coordinator edits. The owner has **explicitly amended V1** to APIs plus host AI/search: no bulk datasets, OSM extraction, raw ERA5 preparation, owned global catalogue or database. Historical cloud context is unavailable when no approved API response exists and is **not a V1 launch blocker**. This is a requirement change, rather than evidence that the original numerical-history promise was completed. Original requirements and legacy code/evidence remain preserved.

Read the installed requesting-code-review and verification-before-completion skill instructions. This lane is itself the independent review requested by the coordinator. Only this document is authored here. No full suite, provider/network/model call, package generation, private configuration inspection, source activation, quota reset, deployment or commit occurred. Existing live/native receipts are retained evidence, not fresh validation. No newly generated artifact is required for this review or the core API runtime.

## Original 27-heading reconciliation

This preserves every original heading and explains the changed boundary; it creates no replacement status counts and closes no whole ticket.

| Original ID(s) | Effect of the explicit amendment / current acceptance boundary |
| --- | --- |
| 0 | Freeze the actual API source/configuration and truthful claims. Remove bulk geography and numerical-history preparation as launch dependencies. Account, rights, quota and public-host checks still apply to enabled capabilities. |
| 1, 2, 3 | Existing SDK/runtime, schemas/harness and read-only MCP registry remain applicable. Database or data-build acceptance is unnecessary for API mode. |
| 3B, 3C, 4B | Actual HTTPS host connection, permanent endpoint/publisher identity and official location/draft checks remain release dependent. |
| 4, 5 | Named-place resolution/timezone and deterministic astronomy remain. Explicit display-zone choice does not verify an arbitrary site's timezone. |
| 6 | Bounded event support remains; missing seasons/radiants are disclosed. Select maintained claims/years and review schedule using existing evidence. NightSky.earth maintenance identity is already confirmed. No bulk event acquisition is inferred. |
| 7A, 7B | Short-range forecasts and bounded aurora remain independent source outcomes. Enable only sources with accepted exact usage and configuration. |
| 8 | API candidate discovery plus optional host search replaces the owned exhaustive catalogue route. Preserve unsupported spatial constraints, selection identity/revision, geography evidence and unverified access/safety. |
| 9 | **Amended:** historical cloud values may be unavailable without an approved API response. No compulsory baseline, raw ERA5 preparation, file acquisition or historical-method admission blocks V1. Do not silently substitute present forecasts or fabricate climatology. |
| 10A, 10B | Session orchestration/comparison retain useful successful evidence when another source is unavailable. |
| 11A, 11B, 11C | Learning, preparation/specialist guidance and five packaged workflows remain applicable. Host search/browser is optional and subject to available host capabilities; exported files or maps are not a prerequisite for a useful plan. |
| 12A | Packaging/public draft still needs actual release URLs, identity and official checks. Existing local packages do not prove publication. |
| 12B | Applicable native journey evidence remains scoped. Claude deferred; Gemini conditional on selecting that integration. Host search success cannot be inferred from merely accepting browser permission. |
| 13, 14 | Final policy/support/retention and actual TLS/proxy/streaming/capacity/rollback remain release dependent. API/no-database scope reduces deployment inputs but does not establish hosting evidence. |
| 15 | Final requirements/security/source/configuration and assembled journey review remains; this document contributes evidence only. |
| 16, 17 | Actual submission/publication and participant pilot remain distinct authorized release actions. Synthetic calls are not users or installs. |
| 18 | Website remains a separate workstream. |

## Runtime and packaged capability findings

`server/plugin.ts` has an explicit API discovery branch which rejects stale local geography settings. API history is optional: absent paired history settings return no provider, and startup does not require a history store. When selected API points have no climate provider, `server/mcp/registerTools.ts` returns a structured coverage gap through `candidateClimateGap`; it does not acquire historical data. The optional admitted file-store seam is retained legacy/optional capability, not a V1 preparation requirement. The standalone plugin app does not mount the website or require a database to serve these tools.

**Configuration caveat:** `pluginDiscoveryMode({})` still defaults to `legacy`. API-only product intent must be applied through the actual release configuration (`NIGHTSKY_DISCOVERY_MODE=api`) and checked against the source roster. An API profile proposal does not activate sources; optional keys alone do not select them. Do not delete legacy code to achieve the product boundary.

The fourteen base MCP annotations are read-only/non-destructive; API resolution/discovery appropriately declares open-world behavior. Durable quota accounting and bounded caches are operational state, not an owned geography catalogue or database requirement. The existing runtime configuration and failure fixtures provide local evidence; no deployment or universal security certification follows.

The five packaged skills preserve optional host search, consent/failure paths, snapshot selection, explicit timezone and unknown history. Host search content is treated as untrusted and search-discovered names return through plugin selection. No new server search integration is required solely because host AI/search is permitted.

**Concrete wording follow-up:** `get_clear_sky_climatology` still advertises reading locally installed ERA5 statistics (`server/mcp/registerTools.ts`, tool registration), and the absent-provider gap says a baseline is not installed. These are truthful about retained paths but poorly aligned with the amended API-only offering. Reword the active API description/reason to explain optional approved historical evidence and explicit unavailability without suggesting data installation is required. Preserve legacy-mode descriptions conditionally and existing scientific labels/contracts. This is local disclosure alignment, not a demand to add history.

Event support remains bounded: seven implemented event families; occultation/comet/other unsupported; nineteen meteor identities are an inventory, not a launch roster. Retained 38 dated maxima, twelve radiant models and zero complete activity seasons do not become broader claims under this amendment. The owner maintenance identity must not be requested again; maintained set/years/review schedule are still to be recorded if those claims are promised at launch.

Policy fixtures confirm optional API destinations, durable quota/history distinctions and generated per-request correlation disclosure. Final legal identity, hosted retention and support URLs remain actual release inputs. No new logging leak was established in these inspected paths.

## Genuine gates and obsolete demands

Genuine local achievable tasks are: reconcile every current requirements/profile/handoff statement with the explicit amendment; record a redacted enabled/disabled API roster without altering private credentials; finish selected Public Universe record/original-source rights mapping if enabled; encode the supported maintained event claims and review schedule; align the active historical description/unavailable reason; and retain final source-bearing answer evidence for adjacent credits and sparse forecast samples. Existing local source-failure fixtures can be used without consuming provider allowances. Broader client/model acceptance must use only selected supported hosts and separately authorized calls.

Still genuine for an enabled source: exact account/feature eligibility, quota and durable ledger scope, rights/attribution/cache compliance, source identity/date/point binding, truthful failure/coverage and real geometry evidence when selected geometry is promised. GeoNames signup failure does not block Geoapify; disabled optional sky sources need no forced activation. The retained later Geoapify/DarkSkySites terms review supersedes obsolete generic permission research. WeatherAPI post-trial plan state and Public Universe selected-record rights remain concrete enabled-profile concerns.

Obsolete as V1 launch demands: owned worldwide catalogue, OSM/planet extraction, database provisioning, new raw ERA5 preparation, mandatory historical baseline/method acquisition, repeating the consumed annual history probe, and testing every geographic place. Retained files and tests may remain; their presence does not restore those requirements. Older matrix/profile/freeze language requiring numerical-history admission is superseded by the owner's new explicit amendment and must be annotated as history rather than used as a blocker.

## Fresh focused offline verification

Executed from the review worktree:

```text
node --import tsx --test tests/operations/api-history-runtime.test.ts tests/operations/v1-source-profile.test.ts tests/mcp/v1-followup-acceptance.test.ts tests/skills/host-capability-workflows.test.ts tests/operations/policies.test.ts tests/providers/weather-collection.test.ts tests/providers/providerSafety.test.ts tests/events/meteorCoverage.test.ts
```

Result: **53 passed, 0 failed, 0 skipped**, exit 0. This verifies no-history API startup/configuration conflicts, source roster/operator ceilings/empty-key semantics, registered MCP snapshot/preference/expiry and refresh contracts, packaged host capability guidance, policy disclosure, independent partial weather failures/deadlines/stale outcomes, and bounded event inventory validation. The runtime tests use temporary synthetic settings and a rejecting fetcher; provider tests use injected synthetic responses. They do not prove real account access, live weather accuracy, host AI obedience, installed artifact identity or public hosting capacity.

Retained native 1.0.33 evidence passes the two targeted resolver/failed-refresh cases; it is not a fresh run here or acceptance of all clients. The earlier final-credit and sparse-sample wording concerns remain scoped answer-quality follow-ups. No new critical runtime defect was established by this focused review. Whole V1 acceptance and release-dependent rows remain open pending their concrete applicable evidence; unavailable numerical history itself is not a blocker under the explicit amendment.

## Subsequent authorized disclosure correction

The coordinator extended this lane to the narrow historical wording finding. `server/mcp/registerTools.ts` now selects an API-specific historical description and optional unavailable-data reason. Its required source entry is explicitly a methodology reference only, with no ERA5 data used; method/period fields remain unchanged and the caveat says they are contract metadata, not supplied data or a promised baseline. Existing configured API climate providers still supply their own results. Legacy/catalogue gap wording and the legacy tool description remain unchanged. No handler flow, schema, acquisition or provider was added.

Added `tests/mcp/api-only-history-wording.test.ts`: strict registered input/output validation exercises the missing-provider gap/no additional transport, configured provider delegation and retained legacy description. TDD baseline: **2 passed / 1 failed**, exit 1, failing on the old locally-installed-only description. After the change: **3 passed / 0 failed**, exit 0. Follow-up run with API history runtime and existing registered follow-up fixtures: **8 passed / 0 failed**, exit 0. No full suite, model or external provider request occurred. These tests use injected responses; root owns suite registration, packaging/version and broader verification. This resolves the narrow wording finding locally without claiming numerical history or whole-V1 acceptance.
