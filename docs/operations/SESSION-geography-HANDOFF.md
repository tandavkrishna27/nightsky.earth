# Geography readiness lane handoff — 16 October 2026

Assigned worktree: `C:\Users\TK\OneDrive\Desktop\Claude Data\nightsky.earth-main\.worktrees\geography-readiness`. Branch: `codex/geography-readiness`. Reviewed baseline: `b6bb5726b61c5faf05f9e9073306fd19f7828918`. No applicable AGENTS.md was found in the worktree or its ancestors.

## Delivered scope

- An offline-default, exact-edition planet receipt/preflight with a distinct later explicit transfer allowance, source/version/ETag/provider MD5 binding, exact **95,380,942,829-byte** body ceiling, finite deadlines, no automatic redirects/retries/ranges/resume, retained partials and durable attempt/failure evidence. See [receiver contract](planet-receipt-preflight.md).
- Read-only operator-policy preparation deriving the unchanged actual pinned policy, rejecting changed source identities and invented raw/native/review/trust fields. See [policy preparation](planet-policy-preparation.md).
- A cross-language offline contract test checks receiver/policy source identity parity against the retained HEAD/checksum evidence. Corrected stale capacity documentation describing the already implemented planet-domain contract as missing.

Implementation and policy preparation were divided between two agents with separate file ownership. A third agent independently reviewed the completed changes. Review findings and final verification are recorded below after resolution.

## Unresolved gates and evidence boundary

No planet body, native header observation or actual local raw SHA-256 exists from this session. No provider job, dataset download, credential inspection, publication, deployment, source-policy grant, searched coverage or acceptance change occurred. Totals remain **12 Done / 9 Partial / 6 Not Started**. The shared tracker and `tests/all.test.ts` were not edited. No other branch was merged or cherry-picked, and no retained `.data` artifacts or other worktree dependencies were mutated.

An actual receipt requires a separately authorized exact allowance and fresh local preflight. The operator must enumerate retained inputs/failures/rollback without overlaps and coordinate with co-resident work; no machine-wide reservation or simultaneous-build permission is implied. The receipt's hard body/read and Job commit/process limits are separate from sampled disk/reserve/main RSS observations. The 24-hour receipt phase does not extend a later 48-hour build envelope.

Only received bytes can establish local SHA-256 and native PBF vintage/observation. Then prepare and verify the actual `planet-domain-v1` descriptor and linked evidence, source manifest, record and full subject digest. A reviewed immutable operator inventory/policy revision and independently allowlisted subject-bound provenance/payload/rights/planet-domain/admission reviews remain required. A transfer allowance is not such a review.

The producer and assembly currently check artifact identities but do not invoke generic source policy admission. The successful exact-subject admission result must be bound to the reviewed production invocation before a separately authorized build. Natural Earth also needs provider-aware generic boundary conditions and actual original/normalized/licence/audit pins in that production admission path; fabricating geoBoundaries notices is not a solution.

Assembly caps stay **128 MiB each** for candidates, exclusions, lineage and footprints. Boundary/work/publisher limits and unknown membership/exclusions stay unchanged. There is no throughput or worldwide completion claim. Completed scanning and independently supported footprints remain necessary for searched cells. The **2 CPU / 4 GB Hetzner host** remains a serving target for a measured admitted immutable catalogue and required runtime assets; no raw planet/scratch transfer, installation or serving-fit claim is included.

## Integration notes for the coordinator

1. Add `tests/places/planetPolicyPreparation.test.ts` and `tests/places/planetReceiptContract.test.ts` imports to `tests/all.test.ts`. This lane deliberately leaves that shared aggregator unchanged. The parity test runs the offline Python CLI under a socket trap and requires Python on the test runner.
2. Add `scripts/osm/planet-policy-preparation.ts` to `tsconfig.tools.json`'s enumerated includes. This lane instead explicitly typechecks the new module/tests. No new npm or Python dependency is needed by the receiver.
3. `python -m unittest discover -s tests/osm -v` automatically discovers `test_planet_receipt.py`; Windows-specific Job tests require a Windows runner. No workflow changes are needed for Python discovery. Parent integration owns combined acceptance and tracker updates.
4. Review the operator policy/production binding gates before requesting a body or build; the readiness reports remain explicit about missing facts and have no self-approval path.

## Validation and review

All local checks below completed with exit zero. No body request was made by these checks.

| Check | Observed result |
| --- | --- |
| `python -m unittest discover -s tests/osm -p test_planet_receipt.py -v` | **24 passed**, including actual Windows Job containment, authenticated parent pipe, isolated child environment, stalled-worker termination, failed termination-intent persistence, deadline-crossing inventory, late headers/marker, partial marker publication, conservative read accounting and inert exit-zero refusal |
| Focused geography TypeScript tests (policy preparation, cross-language receipt contract, planet/source admission, capacity, assembly) | **37 passed**, no failures or skips |
| `npm test` (unchanged shared aggregator) | **932 run: 926 passed, six skipped, zero failed**; new two TS files run separately |
| `python -m unittest discover -s tests/osm -p test_global_source_pipeline.py -v` | **33 run: 31 passed, two skipped** (local Windows symlink privilege and optional pyosmium absent); tiny fixtures only |
| `npm run check` | All three repository TypeScript projects passed |
| Explicit strict `tsc --noEmit` for new policy module and both new TS tests | Passed; new CLI not yet in shared enumerated tools config |
| `git diff --check` and staged diff check | Passed |

New policy/parity tests first failed when their implementation module was absent, then passed after implementation. Review identified and resolved the direct-worker/supervisor authentication gap, startup isolation, kill-on-evidence-failure handling, uncertain read accounting, unbuffered header/body framing, inert worker success, and deadline/marker publication races. The final independent reviewer reran all **24 receipt** and **six new TS** tests and reported **no remaining actionable findings**. Synthetic streams and local child processes establish these bounded contracts, not planet throughput or actual provider/native evidence. Local optional-parser/symlink skips are not acceptance claims.

## Commit and exact-commit CI

Final implementation commit: **`805d66f5c6b7b0ba08759fc2b820dbb26831148b`** (`feat(osm): prepare bounded planet receipt and policy gates`). It contains all production code, initial tests and receiver/policy/readiness guides. Handoff commit `46599b89e13d2ee1acadc2c0c4f0bf4c4130e4e0` added this report. Final test portability commit: **`1083fac854d8db3bea924047c88c3d141b71e7e6`**. A final handoff-only update records the CI findings; production behavior is unchanged from the implementation commit. Branch: **`codex/geography-readiness`**.

The first exact-tip run [38937935542](https://github.com/tandavkrishna27/nightsky.earth/actions/runs/38937935542) exposed two synthetic-fixture dependencies: Linux/Windows runners have less than the real 128 GiB reserve, and hosted Windows TEMP can use an 8.3 alias. The late-header fixture now supplies deterministic capacity. The real Job/pipe fixture canonicalizes its temp root as production already does, retaining all isolation/Job assertions and adding bounded public child diagnostics. The reserve failure was reproduced locally at 64 GiB free; the alias mismatch was reproduced with an actual `GetShortPathNameW` alias and `supervisor handoff identity rejected`. The corrected fixtures pass all **24 tests on Python 3.11 and 3.14**, and the real short-alias variant also passes independent review. No production reserve, deadline or authentication guard was weakened.

The lane pushes that branch and watches the exact pushed tip's six-job `NightSky V1 checks` workflow before reporting completion. The workflow automatically discovers the new Python receipt tests. New TypeScript tests and their strict typecheck have the explicit local evidence above; their shared aggregator/tools-config integration is intentionally left to the coordinator. Baseline six-job success alone is not evidence for this change. The final response supplies the exact pushed tip and observed run URL/status; CI does not authorize acquisition or promotion.
