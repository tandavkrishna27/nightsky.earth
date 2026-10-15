# Geographic resource-check optimization wave — 15 October 2026

**The single optimized acceptance attempt drained after a second 600-second deadline stop.** Raw production remained incomplete and the configured bridge was never launched. All 924 selected prelaunch pins matched after drain. The original failed baseline remains preserved; no speedup or global-fit claim is established. [Sanitized evidence](data-pilot-evidence/2026-10-15-geographic-check-optimization.json) records actual results and selected identities.

The preceding unchanged-producer attempt stopped at 600.019 seconds after completing Monaco while Faroe was underway; the bridge never ran. That result and both diagnostic attempts remain preserved. The corrected 10-second diagnostic identified repeated ancestor/path validation inside the full resource inventory as the dominant nested cumulative cost. Its profiling overhead was uncontrolled; it is not an unprofiled throughput measurement. See [original retained measurement](retained-geography-measurement.md) and [bounded optimization plan](../superpowers/plans/2026-10-15-geographic-check-optimization.md).

## Implementation

The producer inventories output afresh on each resource check using `scandir` and non-following file metadata. It validates outer ancestry at entry and exit, tracks directory identities only within that scan, and revalidates a fresh local ancestor chain before descending into a queued directory. Review found that a queued directory or local ancestor could be replaced after enumeration; the correction added immediate chain/identity checks before descent, with `lstat` directory identities to handle Windows directory-entry metadata. No filesystem verdict is cached across calls. These checks reduce repeated full-path validation; they do not establish race-proof filesystem access.

Every resource-check call still checks the deadline, current inventory, scratch/output/combined limits, pending-write allowance and free reserve. Source size/hash/mutation verification remains unchanged. The bounded native attempt below measures the reviewed implementation; it remains incomplete.
## Frozen selection and launch

The parent recorded 924 selected local source, runtime, installed dependency and raw-input pins before launch at **2026-10-15T16:19:05Z**. These are selected pins, explicitly not a full import closure. The raw manifest was unchanged. The parent then launched the one authorized `retained-geography-20261015-v2-job` attempt through the ignored launcher. No repeat, diagnostic, acquisition or competing heavy test is part of this acceptance.

Preflight observed 310,687,027,200 bytes disk free, 15,425,269,760 bytes available RAM and 6,551,318,528 bytes commit headroom. Previously retained related geography roots totaled 2,674,136 logical bytes and the preparation ledger totaled 5,806 bytes. These are prelaunch observations, not reserved capacity. The launcher allows one 1 GiB job plus 16 MiB auxiliary allowance within the enclosing 4 GiB allocation, counting prior related roots. After drain the known related geography roots totaled 29,178,607 logical bytes and the ignored preparation/pin ledger totaled 528,996 bytes, together 29,707,603 bytes, within 4 GiB. This inventory excludes the small public report/evidence projection subsequently written in the repository; the 16 MiB auxiliary allowance covers them. Disk free observed after drain was 309,952,626,688 bytes. Logical inventory is not cumulative physical writes.

Public projection of selected prelaunch pins follows. Paths are repository-relative; ignored inputs remain local and are not published.

| File | Bytes | SHA256 |
| --- | ---: | --- |
| `scripts/osm/global_source.py` | 19757 | 24d1370f9ac5af9a47b934564679fc49c80d07cb518667f3f6efc3af2ed6e1c1 |
| `scripts/osm/measure-retained-source.py` | 8775 | 06ff2c17095f321123c5bfe6206eb9b1553fd258766d5d93998347b6abb41e65 |
| `scripts/osm/global_source_supervisor.py` | 18469 | b668dde2c7c254a95203410569794c2cf371658b9816aa0d97ca845e74088c3c |
| `scripts/osm/spot_paths.py` | 2389 | a8b644b51f05bd08f080c9023f92fc65389b83f0a68f5969f4387512d669cdf0 |
| `scripts/osm/build-source-catalogue.ts` | 7380 | 3ce128edc5d71940efad9c3a413948affe28419e0bcd3532e0708a431ab0fc79 |
| `scripts/osm/build-streamed-catalogue.ts` | 17581 | d6bf2db9853733bff07f7c40811cc718e5841160d4daa457c55d9783cabfa25d |
| `scripts/osm/source-build-config.ts` | 2704 | 24bf24dbe1b2dd3b8a0cbabfa444d73a94094d3b73482d2c01c14be2f2e0d7f9 |
| `.data/osm/retained-geography-20261015-v1-input/manifest.json` | 1593 | c9c8787252b9e3ba0a317e428553302283ec353211e8a4430684a3a0f4bdab14 |
| `.data/osm/global-pilot-20261015-v1/monaco/monaco.osm.pbf` | 692392 | 32c409ec20a3449be6450e7e615a9d575dd7808e7326a8d087d3f4128b394a05 |
| `.data/osm/geographic-continuation-20261015-v1/faroe-islands/faroe-islands.osm.pbf` | 7735542 | 0b512e51364c5bc499b12691f8a91e34aa3e59efa368c4095aa096353bb2a859 |

Both raw PBFs retain native replication vintage `2026-10-13T20:21:31Z`, original OpenStreetMap attribution and ODbL rights. Their clipping identity is an explicitly synthetic benchmark control: no retained extraction polygon was admitted. Empty region and footprint files establish no membership or coverage. Source admission remains false.

## Unchanged finite envelope

One shared 600-second raw-producer → configured-bridge attempt; Windows Job hard 2 GiB committed memory and two active processes; sampled 1 GiB main-PID RSS and 96 GiB free reserve. Venv redirector RSS may differ from actual worker RSS and is not tree RSS. Job logical new writes are capped at 1 GiB; complete enclosing accounting is operator controlled under 4 GiB. File-length/reserve/RSS/deadline sampling can overshoot and is not a filesystem quota.

Raw scratch remains 512 MiB, normalized output 64 MiB, nodes 2,000,000, candidates 10,000 and references per way 10,000. Publisher input/output/scratch remain individually 64 MiB with a 120-second stage limit and the common deadline taking precedence. Owning/child bytecode and TSX cache suppression plus job-local temporary paths retain the documented containment scope. Small sidecar reports are counted in the operator allocation, outside the supervisor's retained-file accounting.

## Observed bounded stop

Measurement wall was **600.050 seconds**; supervisor wall was **600.012 seconds**, with stage 0 at **600.004 seconds**, exit 1 and reason `whole-job deadline limit`. Stage 1 is absent. The retained checkpoint records one completed source (Monaco); Faroe remained incomplete. No normalized canonical completion or actual bridge output was published. Canonical adapter validation was therefore not run. No hot-journal recovery or database query was attempted.

Windows Job accounting recorded **105.734375 user + 482.890625 kernel CPU seconds**, peak tree commit **70,918,144 bytes**, and transfer counters **35,692,967 read / 27,761,638 write bytes**. Sampled main-PID RSS was **4,390,912 bytes**, with the venv redirector caveat above. Supervisor peak logical bytes including retained inputs were **34,931,020**.

Final SQLite was **25,317,376 bytes**, journal **1,183,232 bytes**, other job files **783 bytes**, total **26,501,391 bytes**. Sampled peaks were SQLite 25,317,376, journal 1,183,232, other 281 and simultaneous total 26,500,889 bytes. Final reporting can increase files after the last sample. All 924 selected code/runtime/dependency/input pins matched after drain, including both retained raw PBFs and the optimized producer.

The larger retained SQLite file is evidence of a different partial execution state, not a completed-source throughput or speedup result. The second run was not profiled. The earlier diagnostic establishes prior repeated-check cost only; it does not attribute this run's CPU time. A reviewed bounded resource-check architecture change is the next engineering candidate. Successful retained producer-to-bridge acceptance and actual canonical validation remain required before larger geographic acquisition.
Job transfer counters include cached/metadata I/O and are not physical read volume. File-class peaks can occur at different times and cannot be added into a simultaneous peak. Hash/publication durations are not separately instrumented. Any final node-table count describes the last source only. Cache and host background load are uncontrolled. No global throughput, capacity, coverage, completeness or source-admission conclusion follows.

## Deferred actual canonical adapter procedure

This attempt is incomplete, so the procedure below was not invoked and no adapter plan was fabricated. For a separately authorized future successful attempt, the parent first confirms successful drain, producer `normalized/complete.json`, supervisor completion and bridge completion. A future attempt must use a new job root; substitute that root for the retained v2 path in the illustrative invocation below. Only then create a fresh `adapter-plan.json` in the new job root. Read actual completion bytes/SHA256, actual catalogueRevision and actual manifestSha256. Read unchanged manifest source descriptors and map each to id, sha256, nativeVintage=vintage, url and rights={licenseUrl,attribution}. Use exactly one `retained-osm-canonical-v1` entry and relative completion path `normalized/complete.json`; measure and pin the exact resulting plan before invoking:

```powershell
& node --import tsx scripts/validate-retained-source-adapters.ts .data/osm/retained-geography-20261015-v2-job/adapter-plan.json ACTUAL_PLAN_SHA256
```

Require exit zero and a `validated-lineage` canonical finding. This checks actual normalized completion-file hashes, strict candidate/exclusion/lineage schemas and source bijection. Its sourceAdmitted=false and nativeParserRerun=false accurately distinguish lineage validation from the producer's preceding native PBF parse. It does not validate every published catalogue chunk; the parent separately checks owning immutable catalogue manifests and referenced file hashes. No completion pins or validation result were fabricated for the incomplete attempt.



## Parent validation and review

After the timed job drained, the parent recorded the full OSM suite: **99 discovered / 95 passed / four skips / zero failures**, 40.946 seconds. Focused checks with actual installed pyosmium recorded **17 discovered / 16 passed / one symlink skip**, 2.086 seconds. The parent reports task review and fresh final review approved. These checks validate implementation behavior and bounded fixtures; they do not turn the incomplete retained attempt into a successful producer or bridge. Tests use existing automatic CI discovery; no workflow modification was required.


