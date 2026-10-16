# Geography capacity plan — 16 October 2026

**A finite disk envelope fits the current preparation machine; a complete planet run remains unadmitted.** The advisory evaluator in `scripts/osm/geography-capacity-plan.ts` checks allocation arithmetic and downstream byte ceilings. It performs no I/O, acquisition, process launch or enforcement. `productionAdmitted` is always false. Its success means the proposed ceilings fit, not that the data or computation will fit those ceilings.

## Fresh local evidence

[Read-only machine snapshot](data-pilot-evidence/geography-capacity-plan-20261016.json), 2026-10-16T15:50:41.5752415Z: C: free **290,857,336,832 bytes**; reserve **137,438,953,472 bytes (128 GiB)**. The pinned dated planet is **95,380,942,829 bytes**, leaving **58,037,440,531 bytes** above reserve after raw receipt. Available physical memory was 30,514,436 KiB and available virtual memory 46,128,472 KiB. These are changing machine observations, not process permissions.

The source identity is retained in [planet identity](planet-identity-capacity.md): provider MD5 `c51bb08eb9fc486d010aaa1a3424cabc`, exact dated S3 object, version and ETag. Local SHA-256 and native timestamp are still unavailable because the source body has not been acquired.

## Concrete proposed allocation

All entries below are **new allocation ceilings**, not size forecasts. GiB = 1,073,741,824 bytes; MiB = 1,048,576 bytes. The sum assumes every entry coexists, including failed output and rollback. No cleanup or space reclamation is assumed.

| File/stage | Proposed new allocation | Enforcement or caveat |
| --- | ---: | --- |
| Retained raw or failed partial receipt | 95,380,942,829 bytes | One allocation, no second planet copy/retry |
| Main SQLite, all tables | 20 GiB | Planning partition only; existing max_page_count applies to combined scratch ceiling |
| Journal and SQLite scratch | 4 GiB | Combined raw scratch budget 24 GiB; journal accounting sampled |
| Normalized candidates | 128 MiB | Assembly file pin hard maximum |
| Normalized exclusions | 128 MiB | Assembly file pin hard maximum, even though not classified |
| Normalized lineage | 128 MiB | Assembly file pin hard maximum, even though not classified |
| Prepared boundary originals | 64 MiB | Aggregate membership maximum |
| Staged candidate copy | 128 MiB | Original remains retained |
| Staged boundary copies | 64 MiB | Originals remain retained |
| Footprint stream | 128 MiB | Assembly pin maximum; empty until independently admitted |
| Membership output, including metadata | 1 GiB | Implemented aggregate maximum |
| Catalogue sort scratch | 8 GiB | Below 10 GiB implemented maximum |
| Catalogue output | 8 GiB | Below 10 GiB implemented maximum |
| Descriptors, logs, new failure evidence, allocation margin | 1 GiB | Aggregate allowance, not a new per-file guard |
| Additional rollback edition | 4 GiB | Proposed reserve; larger actual edition requires recalculation |

Total new ceiling: **145,578,373,101 bytes**. At the recorded free-space snapshot this leaves **7,840,010,259 bytes above the 128 GiB reserve**. The extra margin absorbs sampled disk overshoot and unrelated activity; it does not make those controls hard quotas.

Existing retained inputs, old failures and rollback files already reduce measured free space. Do not subtract them again in this incremental calculation. They must nevertheless be enumerated without overlapping paths in the supervisor's logical accounting: `countedLogicalCeiling = measuredRetainedBytes + 145578373101`. The evaluator requires that measured retained total as an argument. The example arithmetic used zero solely to evaluate new allocations; no zero retained inventory is asserted. An actual launch must enumerate the raw source/manifest/plan/boundaries/footprints plus all additional retained failure/rollback paths and avoid double counting files newly included in the table. If boundaries already exist, their original allocation is conservative surplus. No launch-ready inventory exists yet.

Use `evaluateGeographyCapacity({freeBytes, reserveBytes:137438953472, retainedBytes, allocations:proposedGeographyAllocations})` from a local TypeScript caller. Refresh free space immediately before acquisition and again before assembly. Reject any negative remainder or reported stage mismatch. Retained bytes are logical sizes, not a claim about compressed filesystem physical allocation. The evaluator checks safe integer arithmetic, complete allocation keys, the exact raw length, staged copies and stage maxima; it cannot inspect paths or guarantee available capacity remains stable.

## Code ceilings and process proposal

`global_source.py` requires finite positive source, scratch, output, node and candidate ceilings but sets no fixed global maximum for those latter counts/byte fields. Its fixed maxima are 4 MiB row, 100,000 references per way and 172,800 seconds; at most 64 sources. Proposed source bytes equal the exact planet size, scratch 24 GiB, output 385 MiB (three 128 MiB streams plus 1 MiB descriptors), candidates one million, and nodes ten billion. The node value is an operator stop ceiling, **not an estimated planet count**. Exceeding any ceiling means retained failed evidence and no release. The output aggregate alone does not enforce each 128 MiB stream; assembly rejects oversized individual evidence pins later. The main database can consume the 24 GiB combined scratch maximum; the 20/4 split is planning only.

`membership-assembly.ts` constrains **all three producer file pins** and footprints to 128 MiB each. `boundary-metadata.ts` additionally caps candidates at one million, aggregate boundary JSON at 64 MiB, vertices at one million per shard/two million total, comparison/work ticks at 200 million, output at 1 GiB and duration at 1,800,000 ms. Its 64 KiB emitted row maximum can reject rows allowed by the raw producer. Geometry construction and candidate classification share the work budget. Bounds rejection reduces geometry work but still consumes checks. No planet candidate, exclusion, lineage or comparison count has been measured. Raising publisher limits cannot bypass these constraints, and there is no partition merger.

`build-streamed-catalogue.ts` caps candidate input rows at ten million, metadata rows at 10,000, input/output/scratch individually at 10 GiB and duration at 1,800,000 ms. Proposed publisher input is 2 GiB, output/sort 8 GiB each, one million input rows and the existing 10,000 metadata maximum. Its byte accounting is not a claim that all metadata fits. All deadlines include work done within their corresponding stages.

For a separately authorized bounded attempt, propose **4 GiB hard process-tree commit**, at most **two active processes**, **2 GiB sampled main-process RSS**, **48 hours shared supervisor wall time**, and the existing **1280 MiB Node heap**; raw deadline 46 hours leaves time for preparation and the two 30-minute downstream stages. Windows Job commit/process ceilings are hard; disk/reserve and RSS are sampled. Main-process RSS can observe the virtual-environment launcher rather than parser; do not report it as tree RSS. One active job is an operator condition, not a machine-wide lock. These are proposed limits, not demonstrated throughput or a permission to run.

## Planet descriptor semantics and remaining blocker

`clipSha256` currently validates as a SHA-256 string and enters `manifest_revision`; the producer does not load or verify the referenced clipping artifact. A fabricated hash would pass syntax while supplying no provenance. The proposed honest meaning for a planet is **SHA-256 of retained exact UTF-8 planet-domain descriptor bytes**, with an explicit kind such as `planet-domain-v1`, provider whole-database scope evidence, dated URL/version/ETag/MD5, verified local source SHA-256 and byte count, native vintage, longitude/latitude domain and the unchanged selection policy. It must explicitly say it is a source-domain descriptor, not a provider extraction polygon or completed search. Compute its actual hash only after those fields exist; none is invented here.

This semantic choice is **not yet admitted by the current source-admission contract**. `source-admission.ts` models OSM as `osm-extract` and requires bound effective-clip payload/build association and trusted effective-clip review. A local whole-world descriptor does not automatically satisfy those requirements. Before execution, explicitly extend/review a planet-domain admission variant or obtain an honest reviewed mapping of this descriptor into the existing contract. Do not label a self-authored descriptor as provider clipping evidence. Independently validate poles/date line and source linkage before emitting coverage cells. Completed source scanning, not a declared world rectangle, must support searched-cell evidence.

The reference-selective mode is implemented and preserves selection in retained local comparisons. Its **99.56% smaller final SQLite** on tiny retained inputs is not a planet multiplier. The three-pass reference count, raw ordering compatibility, per-file evidence sizes, membership work, memory and runtime remain unmeasured. Therefore the feasible route is a **bounded-failure preparation attempt under these ceilings after identity/domain admission and separate body authorization**, not a guaranteed worldwide build. If guaranteed completion is required before acquisition, the precise blocker is missing planet-scale measurements plus the fixed assembly ceilings; more disk alone does not resolve it.

## Serving is a separate gate

The preparation proposal is for this Windows machine. The **2 CPU / 4 GB Hetzner serving host** should receive the admitted immutable catalogue and required runtime assets only. Its disk free space, existing release, rollback, history assets, process memory under actual queries and concurrency are not measured here. An 8 GiB build output ceiling is not a serving footprint measurement or permission to copy it. Preserve the current release until final catalogue hashes/size, all co-resident data, update/rollback storage and actual serving journeys are measured against that host. No acquisition, provider job, installation, deployment or serving test occurred in this lane.

Validation: four focused capacity tests passed (exit 0); tools TypeScript typecheck passed (exit 0). The signed-remainder regression first failed with the expected missing-exception assertion (exit 1), then passed after the result safety check. Safe negative shortfalls remain valid results; unsafe negative remainders are rejected. The snapshot case asserts exactly 7,840,010,259 remaining bytes. Other checks cover complete accounting, reserve failure, assembly evidence mismatch, unsafe arithmetic and wrong raw identity. Parent integration owns the combined suite.
