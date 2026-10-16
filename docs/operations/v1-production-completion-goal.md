# V1 production completion goal — 16 October 2026

This is the active completion contract, using the existing tickets rather than creating a new completion count. The product remains global and free, with no database and a shared MCP backend plus five workflow skills. Deployment and new data downloads are not authorized. Claude testing is deferred by the owner; earlier results remain evidence with their original version and scope.

## Frozen local engineering baseline

- Branch: `codex/plugin-v1`; baseline commit: `c7e898ca200089555f07ff74d9184b1d8ac9cd77`.
- Package: 1.0.12. This baseline fixes the reviewed local implementation; it does not claim a final production-data package.
- Exact-commit [CI run 38800563149](https://github.com/tandavkrishna27/nightsky.earth/actions/runs/38800563149): completed successfully, six jobs covering Node, OSM and ERA5 on Linux and Windows. Rechecked when this contract was prepared.
- [Lineage evidence](lineage-implementation-admission-wave.md): 18,033,393 synthetic pins across 56,039 pairs; no scientific coverage inferred. Post-proof test-only changes and historical hashes are recorded there.
- [Model evidence](complete-model-journey-validation.md): retain Codex results and the Claude authentication failure; do not describe deferred Claude verification as a pass.
- Original accounting remains **12 Done / 9 Partial / 6 Not started**. Release-data, hosted connection and publication gates do not disappear when engineering checks pass.

Keep this commit as the reproducible comparison point. New fixes receive their own commits and exact-commit checks; no reset, tag replacement, deletion or runtime data promotion is part of freezing it.

## Completion sequence and evidence

| Stage | Required work | Evidence that closes the stage | Current disposition |
| --- | --- | --- | --- |
| 1. Freeze local build | Preserve reviewed code, test results, package and explicit remaining gates; defer Claude testing | Exact commit, six successful CI jobs, versioned model evidence and this contract | Baseline recorded; production readiness is not claimed |
| 2. Finalize production data | Actual global candidate catalogue and boundaries, intended historical coverage and supported event coverage; attribution, exclusions and unavailable responses | Accepted source identities and rights, measured bodies and hashes, coverage/quality manifests, repeatable real release builds and complete dependency inventory | Not complete. All proposed geography sources remain quarantined; retained regional/history samples do not establish global coverage |
| 3. Measure locally | Build and serve those actual releases; measure storage, memory, response time and refresh preparation | Frozen input/release identity, supervised build metrics, serving measurements under a declared workload, current/rollback/scratch/reserve totals and refresh requirements | Synthetic and retained measurements exist. Actual global release measurements remain pending stage 2 |
| 4. Test assembled product | Representative discovery/planning/comparison/events/learning/photography/preparation journeys using actual releases and separately permitted live APIs; owner questions; fixes and final audit | Exact package/data/client versions, source freshness and gaps, reviewed answers and traces, regression checks and requirement-by-requirement final audit | Earlier offline/model evidence is reusable within its scope; full real-release acceptance remains pending |

Stage 2 source decisions can proceed independently for geography, history and events. Stage 3 instrumentation and the stage 4 acceptance checklist can be prepared in parallel, but their final evidence must use the admitted actual releases. Heavy builds share one machine and must be scheduled within one reviewed resource envelope.

## Next decision

The three independent retained-evidence decisions are [geography](geography-release-next-decision.md), [historical weather](history-release-next-decision.md) and [events](events-release-next-decision.md). They identify missing facts and potential routes, not accepted sources or new runtime coverage.

First prepare a small, separately bounded public-documentation/metadata decision to resolve genuinely missing source-route facts. Dataset fields need not be complete before requesting the metadata needed to establish them. Then consolidate the selected geography, history and event sources into one finite dataset-acquisition proposal. The historical 9,016,688-job schedule is a capacity input, **not an approved or demonstrated practical acquisition route**. Resolve a practical source/query route before requesting bulk acquisition. A successful tiny legacy format sample would not alone prove that route can produce the full baseline affordably.

Proposed first metadata allowance: at most **12 public official documentation or metadata pages, 8 MiB cumulative response bytes**, no account/credential access, provider submissions, dataset/geometry/array bodies or third-party contact. Purpose: current time-series request/revision/limit facts; exact edition/licence/download metadata for a simpler global boundary alternative; genuinely new dated extract/coverage documentation; and missing event-source metadata. Stop at the limit or an access barrier, preserve sanitized source identities and observations, and report unresolved facts. Do not repeatedly fetch retained pages merely to consume the allowance. The owner approved this metadata allowance on 16 October; the [completed check](public-source-check-20261016.md) made 12 attempts and read 208,666 body bytes. The request allowance is exhausted. No dataset or report body is authorized by that approval; those require a later separate decision.

Each proposed external action must state its purpose, exact source/endpoint and permitted method, count and byte/time/storage bounds, expected result, stop conditions, reuse of retained inputs and required follow-up. Metadata inspection and dataset downloads must be distinguished. Do useful offline work before requesting an allowance; do not claim source admission from a generic approval receipt or source-family label.

The owner must authorize the concrete new download proposal before it executes. Hosting values and actual deployment remain a later, separate decision. Nothing here authorizes new provider/model calls, credentials, publication or infrastructure changes.

## Final audit rules

Verify the actual global coverage promised by the product, not just a few named places. Missing source periods, timezone uncertainty, inaccessible sites, unsupported event classes and unavailable forecasts stay explicit. Do not turn historical cloud statistics into forecasts or candidate locations into confirmed access. An honest unavailable result is required behavior but does not close a promised coverage gate.

See [current ticket status](implementation-status.md), [consolidated acquisition fields](v1-consolidated-acquisition-proposal.md), [source admission](offline-source-admission.md) and [completion sequence](v1-completion-wave-sequence.md). The goal remains active until the requested end state is verified; deployment/publication are outside this local completion contract.
