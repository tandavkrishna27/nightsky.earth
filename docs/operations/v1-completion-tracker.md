# V1 completion tracker

Updated: 17 October 2026. **Current plan: API-first, multiple suitable sources, no exhaustive owned global catalogue prerequisite.** This tracker supersedes earlier acquisition-wave sequencing. See the [owner decision](api-search-discovery-v1-decision.md), [regroomed execution plan](../superpowers/plans/2026-10-17-api-first-v1-regroom.md) and [27-ticket acceptance matrix](v1-remaining-ticket-release-matrix.md).

## Where we stand

Original executable headings: **12 Done / 9 Partial / 6 Not started = 27**. Original numbered groups: **6 Done / 10 Partial / 3 Not started = 19**. A scope change is not implementation evidence and adds no completion credit. Done means the original local deliverable, not production readiness or immunity from regression checks.

- Working local MCP/tool/skill baseline exists. MET Norway forecasts and NOAA aurora adapters, astronomy calculations and supported event calculations can be reused.
- Current discovery still reads local OSM/catalogue artifacts. API/search discovery replacement is **not implemented**.
- Place-name resolution still needs the small local GeoNames reference; migration to remote lookup is planned, not complete.
- Bulk planet receipt/build, exhaustive candidate membership/footprint preparation and their capacity gates are **deferred outside V1**. Do not resume them to close V1.
- Historical-weather capability remains required for source-route evaluation. API-first access must preserve defined period, quality, timezone and missingness semantics; current prepared-history code is retained but does not establish an on-demand API route.
- Event/source gaps, client integration, owner testing and later hosted/publication gates remain explicit.

The [previous tracker snapshot](archive/v1-completion-tracker-before-api-regroom-20261017.md) preserves engineering evidence and failed attempts. Synthetic/retained tests do not establish live API suitability or actual release acceptance.

## Stable stages

| Stage | Status | Remaining acceptance |
| --- | --- | --- |
| S1 — Local engineering baseline | Complete for original baseline | Preserve code/evidence; rerun affected regressions for API mode |
| S2 — Ready data access and supported content | In progress | Suitable free providers; working location/discovery adapters and host-search fallback; historical route decision; supported event/source coverage; explicit unavailable states |
| S3 — Measure actual configured service locally | Pending working S2 configuration | Startup/peak memory, bounded cache/storage, latency/concurrency, rate-limit and failure behavior, refresh/rollback needs; actual enabled sources/content |
| S4 — Assembled experience and final audit | Pending assembled configuration | Existing journeys, native tool/skill behavior, permitted live checks, owner questions and fixes; Claude remains owner-deferred |

## Work register — stable IDs, revised acceptance

| ID | Original tickets | Status / concrete next result |
| --- | --- | --- |
| S2-G1 | 0, 4, 8 | Existing place APIs/schemas audited; select compliant free geocoding/discovery providers and define normalized identities, ambiguity, timezone and coverage contracts |
| S2-G2 | 4, 8 | Historical boundary preparation completed within its scope; exhaustive boundary/membership build deferred. API-based region filtering and exact-site timezone validation remain to implement/test |
| S2-G3 | 0, 8 | Implement on-demand discovery plus optional host search; source-aware candidate details and planning, no mandatory global catalogue. Preserve optional old adapters without enabling them by default |
| S2-H1 | 0, 9 | Existing history preparation/decoder software retained; evaluate API-first history source, free-use limits and scientific/statistical equivalence |
| S2-H2 | 9 | Retained sample acceptance is historical evidence only; no complete baseline or live API claim. Cleanup must not trigger automatic reacquisition |
| S2-H3 | 0, 9 | Select practical history route and implement/validate it, or present a concrete unmet capability decision to owner. Do not silently drop history or restart bulk jobs |
| S2-E1 | 6 | Existing calculated astronomy/events and small reviewed content retained; finish supported event coverage and regression checks |
| S2-E2 | 0, 6 | Resolve remaining season/radiant/year/source rights gaps; use an API where suitable, otherwise explicit supported content/limitations. No invented universal event API |
| S2-R1 | 3, 8, 12A, 14 | Wire actual API-mode runtime, package/preflight/configuration and skills; remove catalogue-only mandatory gates; integrate source/coverage evidence |
| S3-M1 | 0, 8, 9, 14 | Measure actual configured-service storage/cache/startup/peak memory and update/refresh cost; bulk planet build not required |
| S3-M2 | 0, 8, 9, 14 | Measure per-tool and end-to-end latency, bounded concurrency, timeouts/429/fallback/cache behavior and small-host fit |
| S4-T1 | 12B, 15 | Run existing fifteen journeys/eight review cases in API mode, including absent host search, ambiguous locations and unavailable sources |
| S4-T2 | 12B, 17 | Owner questions and feedback; actual tester activity only when authorized |
| S4-T3 | 15 | Fix material findings, final source/security/privacy/requirements audit, package freeze and exact-commit CI |

## Ordered execution and parallel work

1. **Regroom and source admission (current):** original-ticket reconciliation, provider/data matrix, code migration plan and independent review. History and event audits may run beside discovery design.
2. **Implementation lanes:** A location/discovery adapters; B independent history/events source work; C runtime/package/skills/test updates after A's shared interface is frozen. Assign shared registry/schema files to one integration owner.
3. **Integrate:** targeted tests per change, combined suite/types/build/package/runtime checks at milestone; update evidence, push and observe CI for that exact commit.
4. **Measure S3:** actual API-mode configuration and remaining required content. Separately authorize bounded live calls; fixtures alone do not prove live availability or useful search quality.
5. **S4 and later gates:** assembled journeys and owner review; only afterward host configuration, authorized staging, actual client/draft checks, submission and publication. Website remains separate.

```mermaid
flowchart TD
  P[Provider contracts and ticket regroom] --> A[Location and discovery adapters]
  P --> H[History API feasibility and implementation]
  P --> E[Supported events and source gaps]
  A --> R[Runtime, skills and package integration]
  H --> R
  E --> R
  R --> T[Combined checks and exact-commit CI]
  T --> M[S3 actual configured-service measurements]
  M --> U[S4 journeys and owner review]
  U --> D[Later separately authorized deployment]
```

## Code correction boundaries

See the [implementation plan](../superpowers/plans/2026-10-17-api-first-v1-regroom.md) for exact files/tests. Main changes: discovery provider interfaces/adapters; registry and planning selection; stable source-backed candidate identities/timezone handling; runtime/preflight mode; five skills and matching workflow documents; API-mode tests/CI/measurement inputs. Preserve astronomy, MET/NOAA adapters, generic controls and useful optional catalogue code. Do not delete code merely to make the new plan look simpler.

## Verification and cleanup status

Latest verified pushed baseline: `0dd434e0c1b5ee5edb751e7e1e684fd54c4a4e68`, [all six CI jobs passed](https://github.com/tandavkrishna27/nightsky.earth/actions/runs/39000662214). This includes the reviewed Windows directory/path corrections and API scope decision. Local preparer verification ran 22 tests: 21 passed, one privilege skip. The current regroom changes documentation and acceptance sequencing, not runtime implementation; its own exact-tip CI must be checked after push.

Owner authorized downloaded-data cleanup. Automatic execution policy rejected deletion before execution. [48-file manifest/report](dataset-cleanup-api-v1-20261017.md) and [manual folder guide](manual-dataset-cleanup-20261017.md) identify about 1.86 GB, still retained at last verification. Preserve the required GeoNames gzip until replacement exists. No 95 GB planet body was downloaded. No new dataset/provider job, deployment or publication is authorized by this regroom.
