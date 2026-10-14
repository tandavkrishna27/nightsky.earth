# Spot scaling wave: bounded local composition and queries

## Design and implemented scope

The remaining local bottleneck was a full row scan on every radius request and no checked composition boundary for overlapping regional artifacts. Existing schema 1 records carry one artifact vintage. The compatible improvement is an offline composition helper for checksum-pinned shards sharing the same source and vintage, plus a cached latitude-band index for the existing runtime query. No data acquisition or publication runs in this wave.

`buildRegionalShards` in `scripts/osm/regional_shards.ts` accepts reviewed local paths and SHA-256 values and returns artifact bytes plus a provenance ledger. It loads sequentially and refuses missing files, checksum mismatch, more than 32 shards, a shard above 4 MiB, more than 100,000 aggregate input rows (including duplicates), or an output above 32 MiB. The bound is deliberately far below the general runtime loader's 512 MiB maximum. The helper never writes files: an operator must retain the returned ledger and use a new immutable versioned destination when installing reviewed output.

`mergeOsmCandidateShards` validates immutable snapshots, compares normalized source fields and vintage, deduplicates identical OSM type/ID records, and refuses differing coordinates, category, name or completeness for the same identity. Field comparison is independent of JSON property order. Node and way IDs remain distinct. Output order is stable. Coverage text is supplied explicitly and validated; the ledger preserves every input shard's original coverage, vintage, count and checksum. Checksums establish agreement with reviewed bytes, not source truth or publisher authenticity.

Runtime queries reuse one-degree latitude bands created at snapshot validation. The angular radius gives a conservative latitude interval; all longitudes in those bands remain eligible, then the original exact spherical distance, category order and completeness sort apply. This preserves antimeridian, latitude boundary and pole-crossing candidates. Haversine roundoff is clamped to its valid domain and resolved coordinates are bounded. Bands retain row references rather than duplicating records. Queries spanning dense latitudes can still inspect many rows; there is no claim of a general geographic database or disk-lazy query engine.

## Measured retained-fixture exercise

Two checksum-pinned references to the retained 134-row Bhutan artifact composed 268 input rows into 134 unique records, removing 134 duplicates. This tests real overlap without inventing new coverage. On the desktop runtime, composition took 9.67 ms; the output was 20,818 bytes. One hundred 50 km Thimphu searches had nearest-rank p50 0.187 ms and p95 0.318 ms; process RSS after this exercise was 116,387,840 bytes. These are small-fixture measurements and do not establish performance at the configured caps.

The retained South India artifact has 1,327 rows and Bhutan has 134. Their source/vintage differ, so this helper refuses to combine them under a single schema 1 vintage. No retimestamping, source relabeling, source download, India extract scan, deployment or new public coverage occurred.

## Validation and remaining conditions

Twenty candidate tests pass, including checksum and input byte refusal, aggregate row and shard limits, source/vintage rejection, overlap conflict rejection, property-order-independent deduplication, invalid resolved coordinates, antimeridian/polar/band-boundary queries, and retained Bhutan access/way-point disclosures. Existing search contracts and ranking remain covered. The type checks pass. The implementation-stage full suite completed with 445 tests: 444 passed, zero failed, and one skipped.

Coverage stays partial. Supplied way centers are representative indexed points; entrances and access remain unknown. Relations remain excluded from these retained real datasets. Correct multi-vintage union requires a provenance-preserving schema change or separate regional routing; this helper intentionally refuses to erase those differences. Future polygon or administrative-boundary sharding needs reviewed geometry and a deliberate overlap policy; latitude bands are query acceleration, not a claim about geographic membership. Larger shard sets require bounded measured builds and host-budget tests before installation. Public ODbL distribution compliance remains a separate review condition; embedded attribution and checksums do not establish that compliance.


## Bounded synthetic scale probe

`npx tsx scripts/osm/benchmark_shards.ts` constructs exactly 100,000 fixed-seed fictional nodes and compares 24 optimized 50 km searches against an independent full-scan spherical-distance reference, including polar and antimeridian requests. All 24 ordered result lists matched. Measured composition was 168.924 ms; query p50 was 0.687 ms and p95 1.126 ms. Process peak RSS including the full-scan reference exercise was 291,999,744 bytes, below the existing offline 512 MiB memory target. This is reproducible synthetic scale evidence, not geographic coverage evidence or a worst-case benchmark. The random geographic spread benefits latitude filtering; dense rows in one band can still require a full local scan.

The TypeScript composition helper enforces byte/row/shard bounds but does not install a hard process RSS or wall-time supervisor. An operational build requiring those hard guarantees must run under the existing supervised worker pattern before publication. This wave does not claim a universally bounded CPU deadline or memory ceiling from a single measurement.

Final integrated counts and two-OS verification are recorded in [coverage/accuracy evidence](coverage-accuracy-wave.md); its447-test freeze supersedes the implementation-stage count above.
