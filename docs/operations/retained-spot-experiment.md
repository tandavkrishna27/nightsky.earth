# Retained Bhutan filter and point-partition experiment

Completed 14 October 2026 in the `plugin-v1` worktree, following [global-candidate-feasibility.md](global-candidate-feasibility.md). This approved experiment used only the already retained Bhutan PBF. It made no network requests, source acquisitions, account changes or deployment, and introduced no runtime dataset. The global/free objective remains; one small extract cannot establish worldwide coverage or serving capacity.

The three-pass Python filter reproduced the retained 134-candidate artifact exactly, while the complete local filter/build stage used less time and memory than a fresh unfiltered rebuild. Both stage outputs partitioned into eight point-cell files without losing or altering a candidate. The result supports measuring this filter approach on subsequently approved sources; it does not estimate worldwide counts, processing time or memory.

## Source, versions and preserved evidence

Source: `.data/osm/bhutan-offline-20261014-v1/source.osm.pbf`, **23,618,779 bytes**. SHA-256 before selection and after the experiment: `6728f46b23ab722d9713af1b4a089d7c62290d9b28baa1fcb4348cd4afd1ba87`. Source size/mtime remained unchanged; each worker verified its exact size/hash before processing. Snapshot vintage remains **2026-10-12T20:21:35Z**, not the experiment date. The original acquisition report and retained source were not rewritten or copied.

The installed `.data/osm/venv/Scripts/python.exe` provides **pyosmium 4.3.1**. Osmium CLI is absent on PATH. The new `scripts/osm/retained_experiment.py` uses that parser and the existing `offline_extract.select`, `category_for`, `merge_rows` and text normalization. It is a Windows-supervised offline measurement prototype, not a supported global builder. The filter/partition functions are portable; the supervisor explicitly rejects non-Windows execution.

Fresh ignored staging: `.data/osm/retained-feasibility-20261014-v1/`.

- `report.json`: 6,715 bytes, SHA-256 `3958dfc037e4dc867f6043ae0095c85511ce5d300ff439968e9f76c11ff7f27f`.
- `baseline/baseline.json`: exact retained candidate bytes.
- `filter/filtered.osm.pbf`: filtered source objects and way references.
- `filter/filtered-candidates.json`: exact retained candidate bytes.
- Both stage directories contain eight partitions and `result.json` with file counts, bytes and hashes.

The report is a historical measurement generated before the later supervisor cleanup fix; that fix changes failure cleanup only and the real source algorithm was not rerun. Subsequent invocations also disable worker bytecode writes. No additional real scan was needed for those changes.

## Measured build results

| Measurement | Unfiltered rebuild + partitions | Filter + filtered rebuild + partitions |
|---|---:|---:|
| Supervised elapsed time, including interpreter launch and input hash | 47.347 s | 15.893 s |
| Worker time after input hash | 47.198 s | 15.745 s |
| Peak sampled process RSS | 179,130,368 bytes | 114,376,704 bytes |
| Peak combined logical input/scratch | 23,667,171 bytes | 23,736,145 bytes |
| Named candidate rows | 134 | 134 |
| Candidate nodes / ways | 95 / 39 | 95 / 39 |
| Incomplete selected ways | 0 | 0 |
| Candidate output bytes | 20,933 | 20,933 |
| Candidate output SHA-256 | `d800a935abd54b8cda8e98d02c7e2bce50c7ca6f8e469cadfc735289704f41ff` | Same |
| Point partitions / recovered candidate equality | 8 / exact | 8 / exact |

The filtered PBF is **20,339 bytes**, SHA-256 `24dc8a2183f28ba7664d00e983d722abd92fea1b8a1bf867fc8dc2cc15105d05`. Three raw-source passes selected **54 category-matching ways**, collected **1,795 distinct referenced node IDs**, and wrote **1,942 nodes and 54 ways**. Name eligibility is applied during candidate normalization, so selected source-object counts exceed final candidate counts. Reference nodes retain their tags; eligible candidate nodes among them remain candidates. Relations and irrelevant source objects are excluded.

These timings combine filtering, normalized rebuild, equality checks and partition writes; separate filter-only CPU time was not measured. The second stage also benefits from filesystem caching after the first stage. Therefore the timing difference is an observed ordered local comparison, not a controlled cold-cache speedup claim. Filtered PBF size alone does not predict global geometry/reference memory.

Final logical experiment files total **124,081 bytes**, including the final report. Adding the retained input once gives **23,742,860 bytes**. The peak table values exclude the supervisor's final 6,715-byte report, whose size was checked against the same budget before writing. Logical file lengths were measured; physical allocation, filesystem metadata, OS page cache, parent process memory and installed tools/application files were not included. There was no disk-backed location index: the existing selection uses `flex_mem`.

## Filtering and point policy

Pass 1 reads ways and selects the existing category union (parks/reserves/viewpoints/campgrounds/protected areas/beaches), collecting each selected way's node references. Pass 2 writes all available referenced nodes and category-matching nodes. Pass 3 writes selected ways. This preserves complete available way references without an all-source location cache during the raw filter. The ID sets remain in memory and are subject to the supervisor; this is not constant-memory filtering.

The existing importer then accepts only complete ways, uses the mean of complete vertices with a repeated closing vertex removed, and applies current name fallbacks (`name`, `name:en`, `official_name`) and category precedence. Equal candidates use the exact retained output hash as the comparison target. Zero incomplete ways is a Bhutan result, not a worldwide expectation.

The partition prototype groups normalized points into one-degree latitude/longitude cells and splits any cell by identity order if a file would exceed 10,000 rows or 4 MiB. It refuses more than 32 partitions. This small prototype holds candidates/cells in memory and reserializes trial chunks; it is not the external-sort global builder proposed in the feasibility document. All partition files retain source, vintage and limitations. Reassembling sorted identities reproduced the original candidate array exactly.

| Cell (latitude index, longitude index) | Rows | Bytes |
|---|---:|---:|
| 116, 269 | 3 | 1,106 |
| 116, 270 | 6 | 1,583 |
| 116, 271 | 7 | 1,695 |
| 117, 268 | 7 | 1,712 |
| 117, 269 | 70 | 11,206 |
| 117, 270 | 9 | 1,985 |
| 117, 271 | 25 | 4,445 |
| 118, 269 | 7 | 1,702 |

Indexes use `floor(latitude + 90)` / `floor(longitude + 180)`, clamped at the maximum valid cell for +90/+180. The partition files are experimental outputs; no serving manifest was installed or MCP request routed through them. Tests exercise dateline/pole coordinate assignment using synthetic points; this does not fix the existing mean-vertex longitude issue for actual dateline-crossing ways. Representative points still do not establish entrances, permission, safety, darkness or true observing suitability. Relation-only/unnamed objects remain absent.

## Enforced envelope and failure behavior

Each real stage retained **60 seconds / 256 MiB worker RSS**, with a **100 MiB combined logical input/scratch** limit. The stages run sequentially; no budget increase or automatic retry occurred. The baseline's retained input is counted once, and filter-stage accounting includes all earlier experiment files plus current files. Worker temporary-directory variables point into its staging directory.

The supervisor launches the actual base interpreter **suspended**, assigns it to a Windows Job Object, then resumes it. The job sets a hard **256 MiB committed-memory** limit, a one-active-process limit, and kill-on-close. Descendant process creation is refused, making the experiment's worker tree one process. This avoids the venv launcher problem and an assignment race. Committed memory and RSS are different measurements: the job commit limit is an additional, potentially stricter guard, while reported RSS comes from `GetProcessMemoryInfo`.

RSS, wall time and scratch lengths are checked every **20 ms**, including an exit check. On an observed breach or unavailable accounting, the job and actual worker are terminated; report status is failed/bounded-stop and no next real stage runs. This is sampled stopping, not an OS hard scratch quota: a rapid write can overshoot before the next poll. No breach occurred in the real run. Native allocation failure under the commit cap can appear as a failed worker rather than a uniquely diagnosed memory-limit report; no result from such a worker is accepted.

After a review found the suspended-worker assignment-failure case, cleanup was corrected to kill the actual process handle if job termination cannot reach it and wait with a three-second bound. Failure-injection verification confirms assignment failure leaves no suspended worker. A subsequent full-suite run exposed Windows asynchronous current-directory handle release after process termination: 49 of 50 repeated deadline/descendant tests reproduced `WinError 32`, even when the worker's process handle was explicitly closed. The supervisor now also waits up to three seconds for Windows job accounting to report zero active processes, closes job/process handles, then probes directory DELETE-sharing readiness for up to three seconds. The probe only opens/closes a handle; it does not delete, rename or ignore cleanup errors. All 50 repeated cases then passed, as did the complete 20-test Python OSM suite.

Cleanup has its own bounded waits (up to three seconds each for process exit, job drain and directory sharing); the worker is stopped at the observed stage envelope breach, while reported future total elapsed time includes shutdown. If drainage or sharing readiness cannot be established, execution raises/fails closed rather than accepting the stage. Failed stage files remain isolated evidence; no candidate promotion or recursive cleanup runs. The command requires a fresh path resolving beneath this workspace's `.data/osm`; prior staging paths are refused.

## Validation and next decision

The four core filter/partition/supervisor tests were introduced first and failed because the implementation was missing. An additional allocation-refusal test checks the job cap; the assignment-cleanup regression separately failed on the old unbounded wait before its fix. The existing deadline test exposed the subsequent sharing race under repetition. The final **20 Python OSM tests passed**, including all six new cases:

- Complete way references, name fallbacks, unrelated-object/relation exclusion and incomplete-way reporting.
- Exact partition identity preservation, conflicts, partition cap and pole/dateline synthetic points.
- Scratch growth stops and unchanged retained input.
- Deadline stops and descendant-process refusal.
- Hard job memory allocation refusal.
- Assignment failure kills the unassigned suspended worker with bounded cleanup.

On Linux the four Windows supervisor cases skip explicitly; portable filter/partition cases still run. Run registration for the controller: include `test_retained_experiment.py` in the existing `tests/osm` Python discovery suite; no `tests/all.test.ts` import is appropriate. No root CI, aggregate tests, dependencies or runtime files were edited by this lane.

Reproduction uses a new version directory and the retained environment:

```powershell
& .data/osm/venv/Scripts/python.exe -m unittest discover -s tests/osm -p 'test_*.py'
& .data/osm/venv/Scripts/python.exe scripts/osm/retained_experiment.py .data/osm/bhutan-offline-20261014-v1/source.osm.pbf .data/osm/retained-feasibility-NEW
```

The real run used `retained-feasibility-20261014-v1`. Its directory is immutable evidence and cannot be reused by the command. Reproduction is a future operator action, not an automatic retry or new authorization.

Recommendation: retain the exact-output filter approach for the next approved source measurement, and implement a streaming/disk-run catalog builder only when broader measured counts require it. Global geographic inventory, worldwide counts/density, source overlap reconciliation, actual serving-host load, update cadence, public ODbL database offer and useful relation coverage remain unresolved as described in the feasibility document. This successful local experiment closes the Bhutan parser/filter/partition measurement gap, not the worldwide product gate.
