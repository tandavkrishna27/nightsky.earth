# Offline producer integration wave — 15 October 2026

Baseline `ba6e110937c7b632cd40c04d36ff4ed5e352cb22`, isolated `codex/plugin-v1` worktree. The owner approved three parallel implementation lanes with reviews, local tests, documentation and branch/CI delivery. No dataset downloads, live provider/model requests, credential changes, deployment or public submission are part of this wave.

## Delivered interfaces

| Lane | Local path | What it establishes |
| --- | --- | --- |
| Boundary metadata | [Producer guide](offline-boundary-metadata.md), `data:build-boundary-metadata` | Pinned explicit GeoJSON and canonical candidates become strict country/state membership records consumable by the existing catalogue bridge. Holes, islands and split dateline polygons are retained; borders/ambiguity remain unknown; conflicting claims reject. Footprints stay empty because administrative boundaries do not establish extraction completeness. |
| Observation aggregation | [Producer guide](offline-observation-aggregates.md), `data:aggregate-observations` | Pinned decoded hourly partitions and explicit cell/timezone mappings become existing schema-2 envelopes, then pass through the existing release publisher/provider. The existing expected clock, astronomy, observing-night calendar and quality gates are reused. |
| Release integrity | [Operator guide](plugin-operator-preflight.md), `plugin:preflight` | Catalogue root/page and historical root/shard/tile dependencies must occur with exact path/hash/size in the same immutable release inventory. Current/rollback allocation remains explicit; selection never activates a release. |

The commands compose through existing published formats. New boundary and history tools have explicit supported local shard sizes; neither claims to process an actual worldwide edition within one run. No new runtime database or production artifact installation is introduced.

## Review record

Separate implementers owned the three lanes; parent owned commands, aggregate discovery, type checks, CI and integration evidence. Initial test failures preceded implementation. Parent review required completion-file byte accounting/final input revalidation and deadline checks during missing historical hours. Independent boundary review approved the corrected implementation.

Independent release review reproduced a malformed spatial tree that closure accepted but the actual reader rejected. Expected leaf kinds now propagate through nested directories; ID/membership pointers require candidate pages. Independent history review found independent plans reused lineage identities and could not combine in one release, plus temporary-file cleanup missed write failures. Content-addressed lineage and an outer cleanup block correct both; a two-plan test publishes and serves both inputs. Scoped re-reviews approved these corrections.

A fresh integrated reviewer then reproduced a repeated spatial page accepted by closure but rejected by runtime. The final fix rejects repeats within each root tree while permitting valid shared candidate pointers from independent indexes. RED/GREEN regression and scoped final review passed, with no residual important findings. Windows fixture paths are canonicalized without weakening production alias guards; boundary fixtures register cleanup.

## Verification and acceptance boundaries

| Fresh local check | Observed result |
| --- | --- |
| Complete Node aggregate after final fix | **765 discovered / 764 passed / one existing permission skip / zero failures** |
| Pinned OSM Python suite, unchanged Python sources | **86 discovered / 83 passed / three existing skips / zero failures** |
| Pinned ERA5 Python suite | **46 passed / zero failures** |
| All three TypeScript configurations | Pass |
| Website, service and standalone plugin build | Pass; existing website PostCSS/chunk warnings remain |
| Public rehearsal and both local package validators | Pass; five workflows per local host, no installation/publication |
| Eight offline planning review sets | Pass; zero external provider attempts |
| Production, standalone full/resolver and compiled regional runtimes | Pass; no upstream requests in these workloads |
| Operator template | Expected incomplete result/exit 2; host/deployment/official flags false |

Release fixture measurements include seven resumed history inventory files totaling 79,313 bytes; an observed local preflight took 15.50 ms. These numbers describe fictional test artifacts, not production data, RSS, host fit or a performance guarantee.

Evidence logs and progress are retained under `.superpowers/sdd/2026-10-15-offline-producer-integration/`. CI is observed for the exact pushed revision separately; a local pass is not a CI result. Parent integration registers all new tests in the complete Node suite, adds the boundary script to tools type checking (ERA5 scripts already use a glob), exposes both producer commands and makes the existing two-OS CI suite's expanded fixture scope explicit. No dependencies were added.

Original accounting remains **12 Done / 9 Partial / 6 Not started**. This adds local engineering evidence for original geography/history/operations tasks, not acquisition, a real 30-year baseline, forecast accuracy, selected host capacity, intended-client acceptance or official publication. Data acquisition and deployment remain deferred. Claude remains deferred per owner direction.
