# Faroe path-check correction — 15 October 2026

## Cause and correction

The retained Faroe profile showed full inventories taking 4.032 of 5.006 seconds. Ancestor validation made separate is_symlink and is_junction queries before lstat, then inspected the same non-following metadata again. The correction obtains that metadata once per ancestor: POSIX symlink mode and Windows reparse attributes still reject links/junctions. Both checks before and after path resolution remain, along with namespace/ADS/reserved-name/traversal rules. Missing leaf paths still trigger parent checks; permission/stat errors are not swallowed. No ancestor, file, pending-byte, deadline, inventory, hardlink or special-file guard was removed.

Three new tests verify one metadata lookup per ancestor with no redundant link query, rejection by symlink mode or directory/file reparse attributes, and a missing leaf whose parent is reparse-marked. The performance regression failed before the correction; all six focused shared-path tests passed afterward, including the existing Windows dangling-junction test.

## Real-source verification

[Faroe retained-source proof](data-pilot-evidence/2026-10-15-faroe-recheck.json): exact acquired raw SHA-256 verified before the local copy; zero network requests. The same Windows supervisor completed in 28.004 seconds, peak worker RSS 96,833,536 bytes, peak recheck logical files 7,841,957 bytes. Existing 60-second/256-MiB limits and 100-MiB combined pilot-file ceiling were preserved, including prior pilot files in admission.

Output: 73 candidates, three point partitions totaling 14,975 bytes, filtered PBF 62,488 bytes. Reference and filtered candidates agree exactly; all partition identities/values match. The selection examined 245 categorized ways and recorded zero incomplete/dateline-way exclusions. Those counts establish this source's tested selection, not completeness of observing locations. Coordinates remain representative points; access, entrances, darkness and safety are unknown. No independent polygon/entrance geometry certification.

This supersedes only the prior Faroe build-time failure; the historical failed report remains. No new acquisition, active artifact installation, deletion retry or deployment. Monaco and historical evidence remain intact. Fiji is still untested and would need continuation of the stopped source batch; no worldwide coverage claim.

## Status

Task 8 remains Partial because Fiji/global candidate coverage, public distribution obligations and selected-host fit remain open. Original counts remain 12 Done / 9 Partial / 6 Not started. Broad final audit remains deferred. Local regression/CI verification is recorded with the execution ledger and branch revision.

Full local verification: 72 Python tests discovered, 69 passed/three explicit skips; 522 Node tests discovered, 521 passed/one existing skip; all three TypeScript configurations passed. One legacy test mocked the removed query rather than rejected symlink metadata; it was migrated to the same symlink input with an additional pre-resolution rejection assertion, then the full suite reran green. Existing two-OS CI discovery includes all new regressions; no dependency/CI change required.

## Final original-source pilot — 15 October 2026

[Fiji evidence and combined pilot table](fiji-pilot-wave.md): after Faroe passed and six CI jobs passed, Fiji's exact source acquired with one HEAD/GET. Its worker stopped at60.025seconds/135684096RSS, so candidate equality and dateline audit remain incomplete. All three original raw sources acquired; no refetch or new region. Monaco/Faroe accepted builds remain11/73candidates. No active installation/deployment; counts12Done/9Partial/6Notstarted.
