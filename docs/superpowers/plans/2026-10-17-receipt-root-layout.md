# Finite receipt preparation root layout

Coordinator authorization: correct the local-only r2 layout, obtain independent subagent review, test, then run bounded offline preparation and one compatibility probe. No receipt, build, source request, cleanup or limit increase.

Cause reproduced: 78 retained cache children exceed the preparer's 53-child allocation. Merely counting `.cache` as a parent would overlap the old future attempt beneath it.

1. Retain the failed run and machine observation unchanged, with exact original log bytes archived across Git LF normalization.
2. Write a failing real-filesystem regression: more than 64 tiny cache children plus recovery, plugin allocations, original preparation/review/source metadata and failed-run evidence must be counted exactly once with no source content/network read.
3. Replace child discovery with one assigned `.cache` root; move the fixed nonexistent attempt to checkout `.planet-261012-receipt-20261017-r2`. Refuse a preexisting attempt before inventory. Include the failed-run evidence as explicit roots. Preserve canonical nonoverlap, stat/type/mutation checks and the same shared deadline/entry/depth/root ceilings. Do not offset the extra cache directory depth.
4. Run focused preparer/receiver tests and independent read-only spec/quality review; correct findings before actual preparation. Run the affected Python suite once after the scoped change. No coordinator aggregator/config/workflow changes.
5. Run exclusive `--write` once and `--probe-existing` once if a draft was produced. Preserve failures; never overwrite/retry an existing r2 artifact or raise a bound. Document exact bytes, root/entry counts, elapsed bounds, compatibility and remaining acquisition/build decision. Commit code and evidence; root owns integration/CI.
