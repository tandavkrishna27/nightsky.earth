# Lineage implementation and source-admission wave — 16 October 2026

## Delivered implementation

Three implementation owners and independent reviewers worked in the existing isolated `codex/plugin-v1` checkout, starting at `6baa178`. Source acquisition and deployment remain unapproved. Original ticket accounting stays **12 Done / 9 Partial / 6 Not started**: this wave advances local engineering and source preparation, not actual production coverage or hosting acceptance.

| Area | Implemented | Evidence boundary |
| --- | --- | --- |
| Lineage publication | Explicit schema-6 release/schema-5 catalog paths, bounded four-level radix trees preserving individual raw/decoded/manifest pins, bounded membership references, external partition sorting, independent actual-shard union audits and global conflict rejection | [Format and operations](bounded-era5-lineage.md). Existing schema-2/3/4 limits stay intact; no flat global or child source array replaces the new trees |
| Serving | Lazy root/child/shard membership validation and one shared 2 MiB lineage buffer cache plus at most 30 MiB tile buffers | No new production artifact selected. Cache accounting describes retained buffers, not whole-process memory or Hetzner capacity |
| Operator | Explicit new-format validation scratch/configuration, shared per-closure budgets, independent union proof, complete pinned dependency traversal and old-format support | New formats fail closed without separately reserved scratch. Offline workstation validation does not require building source data on the serving host |
| Source admission | [Offline preparation packet](offline-source-admission.md): complete 429-layer/18-label inventory plus eight dated OSM extracts; exact source/payload/use/rights/clip review validator and new-only bounded CLI | All sources remain quarantined. This standalone preparation gate does not enforce the existing geography publisher or grant rights/acquisition authority. No CDS host enabled |

The source packet is 3,012,319 canonical LF bytes, SHA-256 `d1fe85b8065285199648661eb78cd93fd5ec48e4bf2c327c0fe015a31d73a22e`. Only retained public Git artifacts normalize CRLF to LF for reproducibility; acquisition/review pins remain exact physical byte identities. Zero new metadata/provider requests were made in this wave. The pure gate requires a separately trusted policy; the file CLI independently reconstructs the pinned original policy. Exact key/kind/edition/record/profile and mandatory conditions remain binding. IND ADM0, POL ADM0 and TWN ADM0 cannot be cleared by ordinary renewed role receipts.

## Reviews and corrections

Fresh task reviews covered primitives/supervisor, source admission, publisher/provider/operator integration and the scale worker. Corrected issues include invalid UTF-8 decoding, Windows alternate-stream/device output aliases, source-profile downgrade despite renewed receipts, scratch overlap on names beginning `..`, per-root budget resets, uncharged lineage reads, new-format deadline selection, and supervisor failure reporting/inherited Node hooks. Deep malformed-leaf, external-partition, cross-child conflict, omission/addition, current/rollback scratch and old-format regressions are included. The worker estimate includes the longer retained-style source revisions.

## Local verification

- Node aggregate: **835 tests / 834 passed / one existing skip**.
- ERA5 Python: **78 passed**, including seven supervisor fixtures.
- OSM Python: **107 tests / 103 passed / four skips** in an isolated invocation.
- All three TypeScript configurations, website/service build, plugin package, both local package validators, eight offline review sets and production/standalone/regional runtime checks passed.

The initial concurrent OSM invocation stopped at an existing bounded measurement test while Node tests/builds also ran. The unchanged suite then passed in isolation; no limit was increased or source downloaded. Logs are retained under ignored `.cache/lineage-wave-*`.

## Full synthetic scale acceptance

**Passed in one supervised run; no retry.** The worker inspected **18,033,393 synthetic source pins** across the actual **56,039 pair routes**, with six release children and 5,604 shards. This includes 18,033,376 prospective request raw/decoded objects plus six retained-style raw, eight decoded and three manifest rows. Every global source pin was checked against its deterministic synthetic identity; selected boundary routes served partial fixture climatology, and a same-revision/different-hash conflict across children was rejected.

| Measurement | Observed |
| --- | ---: |
| Supervisor elapsed time | 2,604.625 s (43 min 24.625 s) |
| Worker elapsed time | 2,595.988 s |
| Peak sampled main-process RSS | 337,317,888 bytes (321.69 MiB) |
| Peak sampled logical output/scratch size | 14,554,578,378 bytes |
| Global source leaves | 65,536 |
| Largest observed global leaf | 346 rows / 41,411 bytes |
| Final retained runtime buffers | 478,600 bytes, including 378,650 lineage bytes |
| Post-run source/input/runtime pins | All 24 source/input and two runtime pins unchanged |

The 60-minute wall limit, 2 GiB hard process-tree commit limit, two-process ceiling, 32 GiB logical disk allowance and 96 GiB free reserve were preserved. Individual writes were checked by worker/publication budgets. Whole-tree disk inventory started at 60-second intervals and final exit; RSS/disk are sampled, not OS disk quotas. Logical sizes are not allocated NTFS cluster bytes; this precise scope supersedes the frozen worker limitation string mentioning physical disk. Final retained buffers are not a measured maximum saturation or whole-serving-process memory result.

Prelaunch configuration SHA-256: `f28b292bf20b3df0e589b782c5479e0d899d039786c23581441a03d714bc9c08`; self-contained executable bundle SHA-256: `3beada8b1d1143d9ca6cc6d19e0357164210dffcce08389e779b9da939e7633a`. Bundled external imports are Node built-ins only; all twelve local bundle inputs were pinned. The supervisor cleared inherited Node hooks and assigned the suspended process before resuming. New/modified measured code matches staged Git bytes. Four unchanged legacy inputs differ from Git only by CRLF-to-LF normalization; the public evidence records both identities rather than rewriting the historical measured pins.

The separate [public measurement projection](data-pilot-evidence/2026-10-16-bounded-lineage-scale.json) binds the retained full result and supervisor report. Raw synthetic artifacts remain ignored under `.data/lineage-scale-proof-20261016-v1`; no runtime artifact was selected. Request revision keys were distributed sequentially across actual sorted pair keys to exercise capacity/routing; this is not a reconstruction of the real rectangle-to-location attribution. Synthetic source hashes and values establish no scientific completeness, real ERA5 response compatibility or practical feasibility for nine million provider jobs. Full-scale operator closure was not separately measured; its bounded audit implementation was verified with focused fixtures.

## Remaining sequence

1. Full synthetic lineage acceptance is complete for this frozen schedule and generator. Preserve the evidence; actual source-format admission and real release acceptance remain separate.
2. Resolve exact geographic source/provenance/rights and effective clip associations; separately establish any additional CDS asset host from official evidence.
3. Review operational acquisition feasibility: the conservative inventory proposes 9,016,688 legacy requests. A capacity proof is not evidence that this request volume is practical. Resolve source-route/request-packing choices before bulk acquisition, then present a concrete finite sample allowance. Existing executor preparation and source declarations authorize no request.
4. After approval, inspect actual response identity, format and resources, acquire admitted continuation data, construct real releases and repeat complete local product acceptance.
5. Prepare hosting and publication only under their separate approvals. No deployment occurred.
