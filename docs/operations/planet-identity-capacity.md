# Planet identity and local capacity — 16 October 2026

**The exact planet is 95,380,942,829 bytes (95.381 GB / 88.83 GiB). Its provider MD5 is `c51bb08eb9fc486d010aaa1a3424cabc`.** The raw file fits available disk above the retained reserve, leaving 62,630,256,659 bytes (58.33 GiB) for all new build allocations. Full-build fit remains unproven. No PBF body was acquired.

## Recorded metadata

[Sanitized machine-readable evidence](data-pilot-evidence/planet-identity-capacity-20261016.json) records the observations at 2026-10-16T14:08:01Z. The user approved the bounded metadata step in this wave, as proposed in the [acquisition decision](global-footprint-acquisition-decision.md): at most one HEAD to the dated PBF and one GET to its `.md5` URL. Both requests were made once; both returned **302**. Redirects were disabled, with no retries, ranges, fallback or PBF body reads. Each request completed in under one second. Response headers were bounded to 31 KiB per response; the streamed GET body had a 1 KiB ceiling. Actual aggregate parsed response headers plus body were **1,010 bytes**. The checksum URL returned **337 bytes of redirect HTML**, not a checksum. That HTML Content-Length must not be treated as the PBF length.

| Request | Result |
| --- | --- |
| HEAD `https://planet.openstreetmap.org/pbf/planet-261012.osm.pbf` | 302; no PBF Content-Length, ETag or Last-Modified supplied |
| GET `https://planet.openstreetmap.org/pbf/planet-261012.osm.pbf.md5` | 302; HTML body, no provider MD5 obtained |

The root agent reviewed the exact unsigned HTTPS provider destinations and authorized a direct metadata follow-up within the user-approved exact-size/identity task. No query strings, credentials or alternate edition were involved. The returned destinations are:

- `https://osm-planet-eu-central-1.s3.dualstack.eu-central-1.amazonaws.com/planet/pbf/2026/planet-261012.osm.pbf`
- `https://osm-planet-eu-central-1.s3.dualstack.eu-central-1.amazonaws.com/planet/pbf/2026/planet-261012.osm.pbf.md5`

The follow-up made one direct HEAD and one direct checksum GET, each with a shared 30-second cancellation deadline covering headers and streamed body, no redirects/retries, the same 1 KiB body cap and 64 KiB aggregate allowance. Both returned 200. [Follow-up evidence](data-pilot-evidence/planet-identity-capacity-s3-20261016.json) records 1,140 aggregate parsed header/body bytes and a 56-byte checksum file naming exactly `planet-261012.osm.pbf`. Across both metadata packets the aggregate was 2,150 bytes. The original 302 evidence remains retained.

The PBF HEAD returned Content-Length **95,380,942,829**, ETag `"37619b1886c62145e6a0a6b31109b300-5686"`, Last-Modified **2026-10-15T19:22:44Z**, and S3 version ID `brLMq6.oGIcbk.3ciQgjtqIduCfYJMT1`. The multipart ETag is not the provider MD5 or local SHA-256. The provider checksum corroborates future transport; neither metadata response verifies the undownloaded file's bytes or native vintage.

## Fresh machine evidence and practical fit

At 2026-10-16T14:09:41.259Z, C: had **295,450,152,960 free bytes** out of 999,109,423,104 total bytes. With the existing **137,438,953,472-byte (128 GiB) free reserve**, the incremental allocation available above reserve is **158,011,199,488 bytes (147.16 GiB)**. Using the verified PBF length `N = 95,380,942,829`, the remainder is:

`158,011,199,488 - 95,380,942,829 = 62,630,256,659 bytes (58.33 GiB)`

This remainder must accommodate every newly allocated node database/journal, normalized evidence, staged copy, membership intermediate, sort scratch, catalogue, report and failure artifact. Existing files already reduce measured free space; independently, the supervisor must enumerate retained artifacts in its logical allocation, without counting nested paths twice. No deletion or reclaim is assumed. Free space varies with other work and needs refreshing before execution.

Windows reported physical memory total **64,545,140 KiB**, available **27,543,444 KiB**, and virtual-memory total **96,002,420 KiB**, available **44,207,492 KiB**. These are OS snapshots, not a production process allowance or a promise of stable commit headroom. No planet process-tree commit/RSS allowance has been admitted.

The current producer performs a full first pass indexing all valid nodes in a single source into SQLite, followed by candidate selection. It uses a 2 MiB SQLite cache but retains the full node index on disk. Cache size does not bound index size. Its node table stores an integer key and two REAL coordinates; SQLite page overhead, journals and other tables prevent a reliable total-size estimate from PBF compression alone. Planet node count, actual index allocation, journal high-water size, selected candidates and runtime have not been measured. Therefore **this machine's full-build fit is unproven**, even if the eventual raw file alone fits.

## Existing controls that constrain the proposal

The retained [source pipeline](offline-global-source-pipeline.md), [assembly](supervised-membership-assembly.md), and `scripts/osm/global_source.py` establish:

- Raw producer: explicit finite source/scratch/output/node/candidate limits; maximum row 4 MiB, 100,000 references per way, and 172,800 seconds (48 hours). These are stop ceilings, not throughput measurements.
- Membership: maximum 128 MiB candidate stream, one million candidates, 64 MiB boundary JSON, two million aggregate vertices, 200 million comparisons, 1 GiB output and 30 minutes. These narrower limits govern the intended assembly route.
- Publisher: maximum ten million candidates and 10 GiB each for input/output/sort scratch, with a 30-minute deadline. It does not override membership limits or provide a partition merger.
- Windows containment: tree commit and one-to-four active processes are hard controls; RSS, disk and reserve are sampled. The existing Node heap ceiling is 1,280 MiB. One active production job and complete retained-path accounting are necessary.

No numeric node-index, journal, staged-copy, sort, failure, output, tree-memory or final serving footprint requirement is established by the retained **84-row** integration run. It must not be extrapolated as planet evidence. No build was run in this metadata pass.

## Concrete acquisition proposal and remaining decisions

The proposed body receipt is **one GET to the exact direct S3 PBF URL above, 95,380,942,829 bytes maximum transfer and exactly that many bytes for the retained raw file**, no redirects/retries/ranges/alternate sources. Bind it to the observed ETag/version/Last-Modified and provider MD5, compute local SHA-256 while streaming, retain any failed partial bytes within the same raw allocation, and reject mismatches. A later attempt must not silently append or allocate a second full raw copy. This is a concrete proposal, not body authorization. Validate native `osmosis_replication_timestamp` and parser compatibility against the received file; filename date and HTTP time do not substitute.
Do not buy or download a planet merely to discover that the current all-node SQLite pipeline cannot fit. The exact remaining capacity decision is whether to accept a bounded failed-build risk within **62,630,256,659 additional bytes** and the existing assembly maxima, or first implement a reference-selective producer on this machine. The latter would preserve the selection policy while indexing only node IDs needed by selected complete ways through additional sequential passes; it is a concrete engineering alternative, **not implemented or measured here**, and its reference set can still be large. No arbitrary hardware size or unquoted cloud cost is proposed as a requirement. A different builder needs an actual machine/storage offer and cost before selection.

Before any full build, choose finite per-stage allocations and one process-tree memory/deadline envelope from measured remaining capacity, enumerate retained paths, and settle the planet-domain descriptor semantics for `clipSha256`. No dummy clipping hash is permitted. Only a completed policy pass can support searched full-cell evidence; a whole-world source declaration is not a completed search. Relations, unnamed features, date-line/polar way exclusions and unknown administrative membership remain explicit. Public derivative ownership/offer/retention and serving-host fit remain release questions, not claims resolved by metadata.

No large source download, regional pilot, dependency install, build, runtime edit, deployment or public release occurred. This packet records the request outcome and the smallest specific next decision; it does not admit S2-G3, S3 or S4 completion.



