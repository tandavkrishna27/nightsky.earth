# Production data build decision preparation plan

> **For agentic workers:** Use three parallel documentation/research lanes, then independent integrated review. This plan authorizes preparation only.

**Goal:** Produce one concrete, bounded production-data proposal and remaining-ticket sequence before acquisition.

**Architecture:** Existing offline producers build immutable files outside the serving host. Source admission, geographic coverage, historical quality, resource fit and release acceptance each require their own evidence. A proposal is not an acquisition allowance.

**Tech stack:** Existing repository contracts and retained measurements, public official documentation, read-only local hardware observation. No new dependencies or runtime changes.

**Spec:** Owner-approved three-lane preparation direction; [production decision](../../operations/production-data-decision.md), [completed producer integration](../../operations/offline-producer-integration-wave.md), original V1 acceptance plan.

## Constraints

- Existing isolated `codex/plugin-v1` worktree, baseline `c64d9fdd4504d9d83d4ed6492ee92ae39f55b0df`.
- No dataset bodies, dataset/provider requests, new historical downloads, credentials/account access, model tests, deployment, submission or publication.
- Public official documentation may be read for source rights and technical research. Do not turn documentation research into source acquisition or requests to dataset metadata APIs.
- Preserve original 27-heading acceptance accounting. Record engineering progress separately from unmet actual-data, host/client and public-launch gates.
- Fresh local capacity is a snapshot, not a reservation; no deletion or cleanup to make an estimate fit.
- No assumptions about actual Hetzner host choice, pending verified identity, native client acceptance or Claude availability.

## Parallel lanes

| Lane | Owned output | Required decision evidence |
| --- | --- | --- |
| A: geography | `docs/operations/production-geography-build-proposal.md` | Recommended source/boundary editions and rights, existing format compatibility, remaining footprint/normalization gaps, staged raw/scratch/output/retention/reserve budget, stop/recovery and first measured trial. |
| B: historical context | `docs/operations/production-history-build-proposal.md` | Geographic/grid/timezone representation options, global versus sparse semantics, exact arithmetic versus pilot extrapolation, acquisition/build sequencing and supported publisher limits, deduplicated bounded next request proposal. |
| C: release/tickets | `docs/operations/v1-remaining-ticket-release-matrix.md` | All 27 original headings reconcile; remaining exact acceptance, dependencies, local-achievable versus actual-data/owner/host/client/publish/pilot gates, final complete-plugin test checklist. |

- [x] Each lane reads actual owning contracts and retained evidence; changing external facts use official sources with links and observation dates.
- [x] Distinguish proposed values from measurements and unresolved values; unknown processing time remains unknown unless a measured throughput supports it.
- [x] Parent integrates one decision with alternatives, explicit acquisition hold, local machine snapshot and dependency map.
- [x] Independent reviewer checks cross-lane arithmetic, supported format limits, source rights evidence, coverage promises, task accounting and authorization boundaries; correct material findings.
- [ ] Check changed documentation links and original ticket counts; commit/push and observe exact-SHA CI without claiming new implementation coverage.

## Interface and review focus

| Interface / risk | Required treatment |
| --- | --- |
| A/B compete for disk/RAM | One integrated build schedule; budgets do not each spend all free capacity. |
| Source polygons versus true completeness | Boundary membership and admitted extraction footprint remain separate. |
| Full global grid versus release caps | Quantify actual number of cells/pairs and compare to existing caps; no silent global-baseline claim. |
| Small pilot versus worldwide runtime | Label extrapolations and leave provider waits/actual compression/large-source throughput unmeasured. |
| C original acceptance versus latest engineering | Reconcile 12 Done / 9 Partial / 6 Not started; prep alone closes no data/host/publication gate. |
| Acquisition approval versus planning | Explicit future bounded allowance only; no commands run or request identities submitted during this wave. |

## Fresh local capacity observation

Observed read-only at **2026-10-15T15:00:59.4105410Z**:

| Item | Bytes / count |
| --- | ---: |
| Total physical RAM | 66,094,223,360 |
| Free physical RAM | 17,561,849,856 |
| Logical processors | 24 |
| C: capacity | 999,185,969,152 |
| C: free space | 314,638,774,272 |

This inspects the current local machine only. Total RAM is not available working memory; free memory and disk may change. No other machine or selected production host was measured.
