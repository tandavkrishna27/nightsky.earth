# Offline generic spot runner wave — 14 October 2026

## Delivered against original Tasks0/8

| Lane | Implemented files and evidence | Behavior |
|---|---|---|
| Acquisition | spot_manifest.py/spot_acquisition.py; [safeguards](spot-acquisition-safeguards.md) | Strict ordered three-source pins, byte/ETag/status/encoding/header checks, deadline/admission callbacks, exclusive promotion and preserved partial evidence. No default network opener or live CLI. |
| Build/geometry | spot_build.py; [builder](spot-geometry-build.md) | Bounded reference IDs/rows/files, genuinePBF header validation, complete-way selection, explicit longitude-span>180 exclusion, canonical equality and point-partition proofs/provenance. |
| Budgets/recovery | spot_runner.py; [runner](spot-budget-recovery.md) | Whole-wave100MiB logical accounting,900-second operator deadline,six-request ceiling, oneactivephase, strict pinned journals/checkpoint inspection, no automatic recovery/retry. Actual Windows supervised build workers have60-second limits/256MiB hard jobcommit+sampledRSS/rootdisk and bounded cleanup. |

The trusted injected acquisition path is cooperative and requires an opener that itself refuses redirects and obeys timeouts. Response validation does not count hidden work inside a trusted capability. Windows Jobs enforce build-worker limits; sampled disk/RSS is not an atomic filesystem quota, parent-process hard limit or Linux supervisor. Linux portable tests run; Windows Job supervision explicitly refuses unsupported hosts. No live transport or retrieval permission was enabled.

## Composed proof, review and fixes

The new integration fixture creates genuinely parseable syntheticPBFs with the exact pinned body lengths, using empty protobuf padding. It independently verifies that each has only three known synthetic entities, feeds fakeHEAD/GET responses through the actual acquisition module, executes the actual generic builder under Windows Job supervision, and performs strict checkpoint inspection. One normal candidate and one excluded crossing-way are verified per source; corruption is rejected. These fixture bytes are not actual regional data or useful coverage.

Independent review found and resolved: lexical reparse roots hidden by resolution; conflicting duplicate security headers; Windows traversal/anchored-relative ledger paths; incomplete journal order/report typing; final report storage omitted from its own peak. Failing regressions preceded fixes. The composed test additionally found that `.pbf.partial` staging names cannot use automatic format detection; header parsing now specifiesPBF beforepromotion. Final broad review found no unresolved actionable issues.

## Fresh local verification

PythonOSM: **61 discovered/58 passed/three explicit skips/zero failures** on localWindows. Skips concern unavailable symlink creation privileges and a non-Windows-only refusal case. The composed actual-module test passes; root observed32.021seconds before the final aggregate run. All fixtures are fake/synthetic; no provider calls or realsource scans.

Node:484 discovered/483 passed/one permission skip/zero failures. ThreeTypeScript configurations, package lint and eightofflineMCP review sets pass. Full build, standalone full/resolver-only runtime and compiled regional/proxy runtime checks pass locally; exactrevisionCI is pending untilpush. The existing OSM CI job discovers the new tests on Windows/Linux, now has a15-minute limit and runs the offline plan CLI. Tests explicitly distinguish platform enforcement/skips; CI does not fetch sources.

## Ticket and execution disposition

Original counts remain **12 Done/9 Partial/6 Not started**. Tasks0/8 advance through offline generic-tool evidence; real source admission, worldwide candidate inventory, build budgets, ODbL offer and actual serving-host fit remain open. ExistingBhutan helpers, retained artifacts and runtime catalog were not rewritten or promoted. No historical/source download, account action, deployment/publication or website change occurred.

The prerequisite implementation for the proposedMonaco→Faroe Islands→Fiji pilot is now present and tested offline. Future execution still requires explicit bounded allowance, refreshed exactmetadata/sourceheader/hash admission and a reviewed live capability. Source/body amounts and no-substitution/no-retry stops stay as specified in [proposal](global-spot-acquisition-proposal.md). This code wave grants none of those permissions. Exact pushedrevisionCI is observed before final handoff and recorded in ci-verification.md.
