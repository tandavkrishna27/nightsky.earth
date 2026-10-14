# Monaco build correction — 15 October 2026

## Diagnosis

A five-second profile of the retained Monaco file showed 294 full inventory checks taking 4.905 of 5.010 seconds (about 98%). Those checks repeatedly validated every file and ancestor for each map record. This is the measured cause of the first build's 60-second stop; no source/RAM budget was increased.

## Correction

Budget.sampled_check checks the deadline on every record-loop invocation and refreshes disk inventory at 20-ms intervals. Explicit admission and file-operation boundaries retain Budget.check, including fresh path, byte and pending-write checks. The parent Windows supervisor still samples the whole-wave inventory/RSS and enforces the same 60-second worker, 256-MiB RSS/job-commit, 100-MiB combined-file and 900-second batch limits. Buffered filtered-PBF record writes use sampled checks; inventory stopping remains sampled, not a hard filesystem quota.

Only the supervised build selects this faster callback. Existing callers without scan_check retain their original full-check behavior. Candidate categories, names, complete-way/dateline exclusions, source identity, caps, partitions and reference/filter equality are unchanged.

## Regression and actual source result

Three new regressions failed before implementation and passed afterward: 20-ms inventory sampling plus immediate forced IO overflow; deadline rejection despite a cached inventory; separate scan/IO callbacks with byte-identical candidate output. Exact retained Monaco SHA-256 was checked before a local copy; no network request was made.

The same Windows supervisor completed the real source build in 2.104 seconds, peak RSS 39,825,408 bytes, peak whole-wave logical bytes 710,220. The reference and filtered candidates matched byte-for-byte, and partition identity/value checks passed. Output: 11 candidates, one 2928-byte point partition, 5252-byte filtered PBF; 18 selected ways with zero incomplete/dateline exclusions. These are map candidates, not verified entrances, dark skies or nighttime-access guarantees.

[Machine-readable proof](data-pilot-evidence/2026-10-15-monaco-recheck.json) preserves source hash, worker limits and detailed report. This supersedes the earlier Monaco build failure only; the old report remains historical. Faroe/Fiji were not downloaded and no worldwide coverage, runtime installation or deployment is claimed. Disposable data remains local after the prior cleanup-policy rejection; this wave did not retry deletion.

## Disposition

Original status remains 12 Done / 9 Partial / 6 Not started. Task 8 is still Partial because remaining geographic/global/source/host evidence is absent. The broad final audit remains deferred. Next acquisition would require an explicit continuation allowance for the exact remaining sources; this correction has used retained local data only.

Local full verification:69Python tests discovered,66passed/three explicit skips;522Node tests discovered,521passed/one existing skip; three TypeScript configurations passed. No extra dependency or CI configuration change was required; existing Windows/Linux OSM discovery includes the new regressions.
