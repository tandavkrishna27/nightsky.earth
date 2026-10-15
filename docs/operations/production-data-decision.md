# Production-data and release decision record — 15 October 2026

**Disposition: preparation record, not an admitted release manifest or executable acquisition request.** No dataset downloads, provider calls, account changes, deployment or publication occurred in this wave. Original counts remain **12 Done / 9 Partial / 6 Not started**.

This integrates the three lanes of the [production-data plan](../superpowers/plans/2026-10-15-v1-production-data-readiness.md). The existing source-admission and operator records remain authoritative; this document joins their decisions rather than creating a competing source/configuration format.

## Candidate release inventory

| Component | Existing selection / evidence | Decision still required before production admission |
| --- | --- | --- |
| Named-place resolver and astronomical engine | Existing GeoNames/IANA and Astronomy Engine paths; preserve current attribution, versions and named-record timezone limits | Freeze release-specific gazetteer/runtime checksums and supported calculation claims with the actual release. |
| Global observing candidates | OSM remains preferred; eight dated continent inputs are listed in [source admission](global-catalogue-source-admission.md), not freshly verified in this wave | An executable bounded raw-to-normalized producer, revalidated exact source identities, complete footprint/residual disposition, actual output measurement and public derivative offer. No planet/Overture substitution is implied. |
| Administrative membership | Existing global query/membership implementation; real ADM0/ADM1 data not admitted | Exact boundary edition/licence, geometry conventions, source IDs, checksums and membership validation. Clipping extents do not supply administrative boundaries. |
| Global historical context | Target baseline remains 1991–2020; active runtime is only the three-place 2025 sample | Global geographic/grid representation, hourly/night-boundary partition strategy, eligible-sample/year quality gates, deduplicated source selections and measured build/runtime footprint. A monthly mean cannot silently replace nighttime statistics. |
| Events | Retain the individually supported source/year/class/model domains and explicit unknowns | Resolve the source/scientific gaps in lane B before making completeness claims; unsupported classes or years are not enabled by naming them in a manifest. |
| Forecast and aurora providers | Existing MET/NOAA adapters and source-specific controls | Actual production configuration/contact, bounded authorized live rehearsal and freshness/outage evidence. No additional forecast-provider account or request is authorized here. |
| Release package and host | Current local package 1.0.12; Hetzner selected in principle; owner accepts Codex for continuing locally | Actual host/architecture/endpoints, verified publisher/policy inputs, artifact selection and measured capacity; actual intended launch-client validation. Claude remains deferred, not certified. |

Retained geographic/history pilots stay evidence, not the release inventory for global coverage. Future selections must exclude completed job identities and must not refetch retained sources simply because a historical proposal is still visible. A release manifest becomes admissible only when each selected component has exact identity, rights/provenance, coverage, serving configuration and rollback evidence; this table does not supply missing values.

## Observed local hardware versus proposed limits

Read-only Windows system/volume metadata observed at **2026-10-15T13:36:15Z**:

| Property | Observed value | Interpretation |
| --- | ---: | --- |
| Total physical RAM | 66,094,223,360 bytes, about 61.55 GiB | Total installed/OS-reported RAM, not memory available for a worker. Free memory, commit headroom and competing workloads were not measured. |
| Logical processors | 24 | Not a demonstrated CPU budget or processing-time estimate. |
| Workspace C: capacity | 999,185,969,152 bytes, about 930.57 GiB | This volume is smaller than the old 1 TiB combined allocation even before its separate reserve. |
| Workspace C: free space | 316,288,774,144 bytes, about 294.57 GiB | Point-in-time free space, not reserved scratch or a future guarantee. Other volumes/machines were not inspected. |

Only the fields above were read; no credentials, machine identifiers or dataset bodies were inspected for this observation. It is not a benchmark or hardware purchase recommendation.

The existing **proposed** 64 GiB worker ceiling and 1 TiB combined disk plus 128 GiB reserve cannot be admitted unchanged on this workspace volume/machine. This does **not** establish that a global catalogue needs those resources or cannot be built here. First implement and measure a bounded streaming/external-storage route on retained or synthetic inputs; then propose defensible ceilings. An alternative owner-selected build location is another decision, not implicit permission for paid compute. The small Hetzner serving process must not perform bulk imports.

## Join conditions before any acquisition

| Gate | Required record | Current disposition |
| --- | --- | --- |
| Exact inputs | Revalidated dated source URLs/native vintages/expected lengths and identities; boundary and event/source revisions; full intended coverage | Existing dated metadata and gaps only; no new source requests. |
| Runnable producer | Raw input → normalized points/boundaries → paged immutable serving files, with required provenance and bounded memory/disk/processes | Lane A identifies the actual code gaps and offline verification path. Existing normalized-input builders alone do not establish raw worldwide ingestion. |
| Historical method | Geographic representation, period/grid/cells/variables, observing-night boundary rules, denominators and qualification thresholds | Lane B specifies method and workload; worldwide counts/costs remain unmeasured. |
| Concrete request allowance | Exact nonduplicated files/jobs, one active request/job policy, per-item and batch deadlines/bytes, first-result inspection and uncertain-job recovery | No new allowance. Prior pilot authorizations are consumed. No automatic retries or silent source substitutions. |
| Build envelope | Actual available execution machine and enforceable worker/raw/scratch/output/retention limits, free-space reserve and failure handling | Current hardware observation rejects the old envelope as written; revised measured proposal pending. No automatic cleanup to manufacture space. |
| Serving release | Actual artifact hashes/sizes/indexes/cache requirements and previous-release retention, measured on the intended host | Not established by regional samples or synthetic benchmarks. |
| Rights/distribution | Exact selected-source notices, modifications and derivative offer obligations with controlled URLs/retention | Owning source/host records list the fields; no public offer or new rights review was performed here. |

Approval of a completed future record authorizes only its exact stated acquisition/build scope. It does not authorize runtime installation, provider rehearsals, deployment, submission or publication. Failed/uncertain requests retain their identities for recovery; no new request is submitted to bypass uncertainty.

## Immediate sequence

1. **Preparation complete:** three separate lane subagents produced the packets linked below; independent integration review checked their source/code facts, interfaces and known/missing fields. This closes preparation only.
2. Implement the concrete offline producer/method/operator-configuration gaps identified by those packets, using retained/synthetic inputs and existing verification paths. Write an implementation packet before changing behavior; do not repeat geographic acquisition pilots or expand the request budget.
3. Use those measurements to choose an executable global build and historical coverage route. If another machine/storage or a scope tradeoff is needed, present the concrete alternatives and implications to the owner. Do not infer approval from a proposal.
4. Present one bounded, deduplicated acquisition decision with actual machine/resource preflight and first-result stop rules. Acquisition stays held until then.
5. After authorized actual data construction, integrate and validate the complete product locally, then proceed to separately authorized staging, intended-client verification, official review and release.

### Owning preparation packets

- Lane A: [global source and producer admission](global-catalogue-source-admission.md), [acquisition proposal and offline prerequisites](global-spot-acquisition-proposal.md).
- Lane B: [historical method and coverage](historical-baseline-wave.md), [grouped acquisition identities](grouped-history-wave.md), [meteor coverage](meteor-coverage-matrix.md), [typical-season convention gate](meteor-typical-seasons-wave.md).
- Lane C: [package and client readiness](local-package-readiness.md), [host/policy operator handoff](v1-host-policy-handoff.md).

The website remains separate. Completing these preparation records closes no global-data, hosting, client-publication or pilot acceptance gate by itself.
