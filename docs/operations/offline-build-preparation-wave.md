# Offline build preparation wave — 15 October 2026

Baseline `10c1034628634ae88380cd221c9076d393f5ab0f`, existing isolated `codex/plugin-v1`. Owner approved three parallel implementation lanes and asked for the following-wave sequence. This wave uses synthetic/retained local inputs only: no dataset/provider requests, credentials, model calls, deployment or publication.

## Delivered

| Lane / original task | Executable result | Acceptance boundary |
| --- | --- | --- |
| Build controls / 0, 8 | [Pinned configuration](offline-global-source-pipeline.md) adds `--config FILE SHA256` to the existing four-path source bridge and Windows supervisor. Stream and catalogue budgets, metadata pins and coherent revision are validated. Actual configured producer-to-bridge fixtures pass. | Existing hard caps stay intact; no arbitrary child commands, worldwide capacity claim or partition merger. Publisher timeout and whole-job supervision remain separate. |
| Geographic preparation / 8 | [Normalizer and full-cell preparer](offline-geographic-coverage.md), `data:prepare-geographic-coverage`, explicit provider-ID mapping, shared geometry validator, checksummed completion and residual audit. | Only explicitly enumerated cells wholly proven inside one admitted extraction part can be emitted. Union seams, border-touching cells and polar exclusions remain residual. No unsplit dateline repair, geometry simplification or real edition admission. |
| Historical planning / 9 | [Mapping and retained-hour planner](offline-production-history-planner.md), `data:plan-production-history`, verifies actual decoded partitions, deduplicates physical cells while preserving zone pairs and subtracts exact retrieved hours before a finite deterministic request prefix. | Output is immutable **unapproved-nonexecuting** metadata. Retrieved nulls remain scientifically missing but are not a new request allowance. Provider one-cell-area acceptance and ARCO access remain unverified. |

The geographic test uses actual normalization, boundary enrichment, source bridge and discovery reader: an empty candidate query can be covered by a proven extraction footprint. Administrative geometry alone never establishes that coverage. Irregular historical-day tests expand every proposed Cartesian request and prove exact remaining hours, no completed-hour overlap and no duplicate requests. Both CLIs preserve explicit, bounded input contracts.

## Review and corrections

Three independent task reviews and a fresh integrated review approved the corrected implementation.

- Geography review reproduced unsupported CRS metadata being stripped and metre coordinates interpreted as degrees. Strict FeatureCollection/Feature structure now rejects unsupported CRS/foreign structural metadata; root and feature regressions witnessed RED then GREEN. Initial geography implementation preceded its first tests; no initial test-first cycle is claimed.
- Build review reproduced TypeScript accepting integral JSON decimal/exponent numbers that Python rejected. Python now normalizes finite safe integers consistently; boolean, fractional, unsafe and nonfinite controls still reject. A shared numeric fixture exercises actual bridge and supervisor routes, with observed RED/GREEN.
- Parent checks required bounded input reads/final byte rechecks, shared authoritative geometry rather than copied implementations, canonical Windows fixture paths/cleanup, and actual partial-day Cartesian subtraction coverage. The history task review found no important defect; its narrower original test evidence was expanded with those partial-day and CLI tests.

The final integrated reviewer found no remaining important implementation or integration issue. No runtime package version or installed plugin was changed; five workflows/fourteen tools remain the product inventory.

## Verification evidence

| Final local check | Observed result |
| --- | --- |
| Complete frozen-source Node aggregate | **783 discovered / 782 passed / one existing permission skip / zero failures** |
| Pinned OSM Python suite | **89 discovered / 86 passed / three existing skips / zero failures** |
| Pinned ERA5 Python suite | **46 passed / zero failures** |
| Three TypeScript configurations | Pass |
| Website, service and standalone plugin build | Pass; existing website PostCSS/chunk-size warnings remain |
| Public rehearsal and both local package validators | Pass; no installation or official submission |
| Eight offline review assertion sets | Pass; zero external attempts |
| Production, standalone full/resolver and compiled regional runtime checks | Pass; no upstream provider calls in these workloads |

Exact-SHA CI is recorded after push/observation in the wave ledger and delivery response; a local pass is not a CI result. Evidence logs are retained under `.superpowers/sdd/2026-10-15-offline-build-preparation/`. Initial aggregate runs are historical and are not substituted for the final frozen-source run. Existing two-OS Node/Python CI discovery includes the new tests and shared numeric fixture; tools type checking and package commands include the new preparers. No dependency additions.

## What follows

[Following-wave sequence and dependencies](v1-completion-wave-sequence.md) covers retained-input characterization/selected adapters, exact acquisition decision, approved first tranche, production releases, complete local plugin/model acceptance, host preparation and separately authorized launch. It explicitly places any required full historical-grid serving architecture before acceptance of that claim. No blanket acquisition, scope reduction or deployment follows from finishing these tools.

Original status remains **12 Done / 9 Partial / 6 Not started**. These are additional local engineering subtasks under existing headings, not completion of real global source coverage, eligible historical baseline, actual host/client acceptance or public launch. Website remains separate.
