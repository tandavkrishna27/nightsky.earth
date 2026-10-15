# Source metadata admission and acquisition decision

Owner authorization: inspect source metadata using parallel subagents; explain any needed data sample before fetching. Dataset bodies, deletion, deployment, model runs and dependency installation remain held. Starting implementation: `a16e8b1`, worktree `codex/plugin-v1`.

## Lanes and limits

1. Geography: exact dated OSM HEAD identities, immutable gbOpen commit/layer/rights inventory and extraction metadata. Up to 32 explicit bounded public metadata requests / 16 MiB bodies, no retries or automatic redirects. Boundary geometry, PBF and clipping bodies are not metadata authorization.
2. History: official source/format/revision/rights metadata and actual retained named-place mapping inventory, retained-hour subtraction and exact proposed first request where evidence permits. Up to 16 requests / 8 MiB. No account/token inspection, CDS submissions, arrays or data samples.
3. Events/provider context: exact supported source years/rights and remaining convention evidence, independent forecast and light-product metadata. Up to 16 requests / 8 MiB. No forecasts, raster pixels or observation bodies.

An individual response defaults to 2 MiB; geographic tree metadata may use 8 MiB within the lane total. Bounded fetch records URL, UTC, status, selected headers, bytes and SHA256, including stopped attempts. Browsing-tool attempts before this helper are recorded separately with unavailable transport-byte/hash fields; they must not be described as byte-metered responses. Each lane is finite; failed or redirected metadata is a result, not automatic retry authority. Only official primary sources are used.

After the first geography review, the retained Git tree identified one ordinary Git metadata CSV (`releaseData/geoBoundariesOpen-meta.csv`, Git blob `44e6a8078297aa79577c8b2d98692cc82c2f397c`, 486,138 bytes) that may replace hundreds of individual layer-metadata calls. The parent added exactly one supplemental immutable-commit GET, capped at 1 MiB with no redirects/retries. This is metadata CSV, not a geometry or observation sample. Record it separately as request 33; verify Git object SHA1 and actual SHA256 before using rows. The original 32-call record remains intact; no broader extension follows.

## Output and gates

Produce sanitized metadata evidence, exact identities where observed, one updated consolidated acquisition packet, and a list of specific samples still needed with purpose and proposed allowance. Distinguish Git object SHA, LFS pointer length, remote headers and raw body SHA256. No geometry completeness, native header, scientific source-format compliance or returned dimensions are inferred from metadata alone. Keep selected serving/runtime data unchanged.

Review lane results independently, reconcile original ticket evidence without invented completion credit, validate metadata evidence/links/arithmetic and test affected code if implementation changes are justified. Commit/push and watch six exact-revision CI jobs. Actual data sample or bulk acquisition requires the owner's subsequent authorization; no deletion of retained test data is implied.
