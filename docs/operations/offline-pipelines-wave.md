# Offline production pipeline wave — 15 October 2026

Baseline: `4e01ce269dfb9accabf6fa5a5424816b851c0b35`, isolated `codex/plugin-v1` worktree. The owner approved one larger implementation wave with three parallel subagents, independent review, local tests, documentation and branch push/CI. No dataset acquisition, account/credential operations, model calls, deployment or publication occurred.

## Delivered paths

| Lane | Implemented result | Evidence boundary |
| --- | --- | --- |
| Geography | [Strict local manifest, disk-backed raw producer, supervisor and stream bridge](offline-global-source-pipeline.md). XML and optional existing pyosmium PBF paths produce pinned canonical records; verified source-boundary recovery and identity/lineage conflicts feed the existing immutable paged builder. | Tested with generated XML/PBF and a real Windows raw-to-TSX-to-reader fixture. Temporary SQLite is build scratch only; serving remains database-free. No real global edition, footprint computation, administrative boundary solver or observed global capacity. |
| History | [Multi-shard publication and lazy release serving](offline-history-release.md), including immutable recovery, per-shard source lineage with bounded root union, explicit cell/timezone coverage and checksummed CLI. | Processes existing validated aggregate envelopes, not new observations. Up to 1,000 ten-tile shards/10,000 pairs; these engineering limits do not establish a worldwide baseline. Existing method/statistical gates remain unchanged. |
| Operations | [Strict plugin operator template and offline preflight](plugin-operator-preflight.md), current/rollback tuples, explicit inventory integrity, combined disk allocation and fixed redacted findings. | Read-only, explicit input. Template returns incomplete. `hostChecksPerformed`, `deploymentReady` and `officialAccepted` stay false. Manifest dependency closure belongs to the owning loaders; preflight does not certify unlisted files, host fit or public release. |

Shared integration adds the explicit `NIGHTSKY_ERA5_RELEASE_MANIFEST` / `NIGHTSKY_ERA5_RELEASE_SHA256` pair to actual MCP route, direct tool provider selection and standalone startup. It rejects malformed/conflicting release selection with either existing `NIGHTSKY_CLIMATE_ARTIFACT` / `NIGHTSKY_CLIMATE_SHA256` key. Existing absent/legacy configuration behavior remains compatible. Tests exercise the default route's environment selection at two covered pairs, not only an injected provider.

Commands are documented in the owning guides and exposed through `data:build-catalogue-source`, `data:publish-history-release` and `plugin:preflight`. All consume explicit local inputs; none performs acquisition or selects a running production edition.

## Review and corrections

Separate implementers owned distinct modules; parent integrated shared runtime, tests, types and CI. Independent task reviewers required these corrections, each with witnessed regressions and scoped re-review:

- Geography: reject unexpected XML root children/remove completed bounds; count all non-SQLite metadata and temporary checkpoint bytes before publication; require absolute source paths before a supervisor changes working directory. A synthetic PBF roundtrip validates the native header path where the existing parser is installed.
- History: permit legitimate independent source lineages while rejecting conflicting kind/revision identities; reserve candidate, shard and final-root output bytes before writes and pass remaining allowance into the shard publisher. Corrupt resumed shards, actual changed methods/periods and concurrent cached reads are exercised.
- Operations: redact unknown-property errors in release selection; reject unassigned artifact inventory that would escape release allocations. Existing project TypeScript target compatibility is preserved.

All three task re-reviews approved their fixes. A fresh final whole-wave reviewer inspected the integrated producer/bridge/reader, publication/provider/MCP, operator and CI paths and found no remaining important correctness or integration issue. Self-review is not substituted for these gates.

## Fresh local verification

| Check | Observed result |
| --- | --- |
| Complete Node aggregate (`npm test`) | **744 discovered / 743 passed / one existing permission skip / zero failed** after the Windows fixture correction below. Includes all new TypeScript cases. |
| Pinned OSM Python discovery | **86 discovered / 83 passed / three existing skips / zero failed**. All 14 new geography tests pass, including optional PBF and actual Windows source-to-pages integration. |
| Pinned ERA5 Python discovery | **46 passed / zero failures**; no account or source requests. |
| Three TypeScript configurations | Pass, including new scripts and runtime provider. |
| Website, service and standalone plugin build | Pass; existing website PostCSS/chunk-size warnings remain. No website behavior was changed. |
| Public/local plugin package validation | Pass; five canonical workflows per local host, fourteen tools; no public submission or client-model acceptance implied. |
| Eight offline review assertion sets | Pass, zero external provider attempts. |
| Full/resolver standalone, production and compiled regional runtimes | Pass; no external provider calls in these workloads. |
| Operator example | Explicit incomplete result, expected exit code 2 and permanently false deployment/host flags. |

CI now includes the new aggregate tests, an explicit operator-template check, and Node 24/locked dependencies in both OSM Python jobs so Windows can execute the actual raw-source-to-TypeScript bridge. The Python discovery pattern already includes the new producer/supervisor tests. The exact final commit and observed six-job CI outcome are recorded after pushing in the delivery response and ignored wave ledger; this document does not claim unobserved CI success.

Ignored local evidence is scoped to `.superpowers/sdd/2026-10-15-offline-production-pipelines/`, including the progress ledger, integrated review diff and final Node/OSM/ERA5/package logs. New code tests use synthetic fixtures and no new source bodies; existing baseline suites may read retained artifacts under their original checks.

### First CI run and Windows fixture correction

The initial implementation commit `5ebc733` passed all four Linux/ERA5 jobs but failed the Windows OSM and Node jobs in [run 38748213474](https://github.com/tandavkrishna27/nightsky.earth/actions/runs/38748213474). The OSM regression tried `relpath` from a C-drive temporary fixture against the D-drive checkout and failed before its intended absolute-path assertion. The history fixtures passed an uncanonicalized `RUNNER~1` temporary path into a publisher that intentionally rejects aliases. Neither was resolved by weakening production guards.

The Python fixture now computes its relative path against the explicit fixture directory, retaining rejection before job creation and a C/D-drive counterexample. The history fixture canonicalizes the temporary parent and directory using `realpath`, matching the existing publisher tests. A new native Windows 8.3 test proves the alias is rejected while the canonical twelve-tile publication succeeds. Independent scoped re-reviews approved both test-only fixes. Fresh aggregate checks are **744/743/one skip**, OSM **86/83/three skips**, and all three type configurations pass. Production code is unchanged by this follow-up; prior build/runtime and ERA5 results still describe that same substantive code. Both failed CI evidence and the fresh local logs remain retained; final exact-revision CI is observed separately after the correction push.

## Remaining production gates

This wave implements the bounded paths it tests, not the final global data release. Geography still needs an admitted actual source/boundary edition, full footprint/residual and administrative membership production; the hard process supervisor is Windows-specific and refuses unsupported platforms rather than claiming enforcement. Historical publication requires upstream validated aggregates: it does not generalize the existing pilot acquisition/aggregation into a complete worldwide cell/zone producer or solve arbitrary-point timezones. Actual global source hours/eligibility generation, release scale and host fit remain unmeasured. Publication byte/time checks are cooperative admission, not an OS filesystem quota; conservative shard reservation can reject a tight but otherwise feasible allocation.

The next integration decision must select actual coverage/method inputs and revised measured resource allowances before acquisition. Missing owner host/identity/retention fields, actual intended launch-client behavior, official review/submission/publication and pilot observations remain their existing gates. Claude stays deferred per owner direction; no further model retries ran.

Original ticket counts remain **12 Done / 9 Partial / 6 Not started**. No new runtime database, acquired edition, installed production artifacts, hosting change or release authorization was introduced.
