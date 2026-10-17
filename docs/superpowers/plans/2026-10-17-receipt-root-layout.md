# Finite receipt preparation root layout

Coordinator authorization: correct the local-only r2 layout, obtain independent subagent review, test, then run bounded offline preparation and one compatibility probe. No receipt, build, source request, cleanup or limit increase.

Cause reproduced: 78 retained cache children exceed the preparer's 53-child allocation. Merely counting `.cache` as a parent would overlap the old future attempt beneath it.

1. Retain the failed run and machine observation unchanged, with exact original log bytes archived across Git LF normalization.
2. Write a failing real-filesystem regression: more than 64 tiny cache children plus recovery, plugin allocations, original preparation/review/source metadata and failed-run evidence must be counted exactly once with no source content/network read.
3. Replace child discovery with one assigned `.cache` root; move the fixed nonexistent attempt to checkout `.planet-261012-receipt-20261017-r2`. Refuse a preexisting attempt before inventory. Include the failed-run evidence as explicit roots. Preserve canonical nonoverlap, stat/type/mutation checks and the same shared deadline/entry/depth/root ceilings. Do not offset the extra cache directory depth.
4. Run focused preparer/receiver tests and independent read-only spec/quality review; correct findings before actual preparation. Run the affected Python suite once after the scoped change. No coordinator aggregator/config/workflow changes.
5. Run exclusive `--write` once and `--probe-existing` once if a draft was produced. Preserve failures; never overwrite/retry an existing r2 artifact or raise a bound. Document exact bytes, root/entry counts, elapsed bounds, compatibility and remaining acquisition/build decision. Commit code and evidence; root owns integration/CI.

## Finite Windows metadata follow-up

The corrected layout then stopped at an observed empty retained directory: both `Path.lstat` calls had the same device/inode/mtime but size4096 then0. A separately authorized diagnostic identified the exact directory; one immediate metadata scan and a read-attributes-only native query preserved the underlying observations. The native query itself exposed lstat size0 then4096, while full native identity and ChangeTime stayed at October13. The representation mechanism is unproved; directory size is not a child-byte total.

The coordinator requested an independently reviewed correction if justified. For Windows directories only, compare native full volume/FileId, LastWriteTime, ChangeTime and attributes, reopen the pathname for each observation, reject unsafe type/reparse/delete-pending/unbound identity and query failure, and preserve regular-file and POSIX size checks. Bind legacy CPython lstat IDs through a same-handle legacy native query without truncating authoritative full IDs. Same deadline covers every query; no fallback or limit increase. Include both stopped attempts and all diagnostic copies in retained accounting.

Tests must cover size representation change, unsafe/query errors, replacement and spaced child add/rename/removal with intermediate observations before restoring write time. Timestamp granularity can hide rapid/same-tick or reverted mutations; this remains a non-atomic snapshot, not guaranteed change detection. A bounded test clock separation is a fixture condition, never a production retry/reset. Also reproduce/fix the CI raw-versus-canonical temporary-path assertion using a real short alias. Run final focused, alias, older-Python and OSM checks, independent review, then one bounded preparation observation; compatibility follows only a saved draft. Keep every prior stop and no body/network/cleanup authority.
