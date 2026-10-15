# Offline observation aggregation design

A pinned local plan supplies an observing-night interval, explicit cell/IANA-zone mappings and ordered decoded JSONL chunk references for each mapping. Existing decoded-chunk validation and the existing astronomical aggregation algorithm remain authoritative: missing hours enter the denominator; duplicate or unordered hours fail; noon-to-noon observing nights determine month membership while bins retain UTC hour. Only 1991–2020 is a baseline.

Read at most one 4 MiB decoded partition at a time. Bound plan size, chunk count, aggregate count, cumulative input bytes, output bytes and elapsed time. Recheck each pin while consuming and before publication. Carry the plan digest plus decoded and upstream raw digests into schema-2 provenance. Validate every produced tile against the existing runtime schema. Publish one immutable envelope with exclusive creation, using a temporary synced file and exclusive hard link; failed runs remove their temporary file and can restart from the pinned plan. No external requests, inferred zones or fabricated observations.

## Plan and invocation

Run locally with `node --import tsx scripts/era5/build-observation-aggregates.ts --plan <absolute-plan.json> --expected-plan-sha256 <sha256-of-exact-plan-bytes> --output <absolute-envelope.json>`.

The strict plan shape is:

```json
{"schemaVersion":1,"period":{"startNight":"1991-01-01","endNight":"2020-12-31"},"generatedAt":"2026-10-15T00:00:00Z","placeIndexVintage":"reviewed-index-vintage","chunks":[{"id":"partition-1","path":"decoded/partition-1.jsonl","sha256":"<64 lowercase hex characters>"}],"mappings":[{"cellId":"era5:0:0","latitude":0,"longitude":0,"timeZone":"Etc/UTC","chunkIds":["partition-1"]}]}
```

Paths are relative to the plan directory, must stay inside it, and reject aliases, traversal and symbolic links. Every source must be assigned, every selected cell must occur in its assigned chunks, and each mapping's chunk list must supply strictly increasing hourly instants. Identical duplicates and conflicting duplicates both fail; absent hours and explicit null fractions remain missing. Different mappings can reference different chunk subsets. An explicit IANA mapping is an operator responsibility; this tool does not establish that a zone is geographically appropriate.

Existing decoder JSONL header/rows are required (`scripts/era5/chunks.ts`): exact hourly UTC rows, fractions in [0,1] or null, 0.25 degree cells, source SHA, experiment versions and decoder versions. Pinning the decoded file authenticates its recorded upstream raw digest; this producer does **not** independently open or verify the raw source. Raw validation/decoding remains an upstream responsibility. The manifest carries plan, decoded and raw digest lineage; the pinned decoded header retains detailed decoder metadata.

## Bounds and recovery

At most 10 explicit cell/zone pairs, 4,000 partitions, 800 rows per partition, 10 cells per partition, 4 MiB per decoded file, 1 MiB plan, 1 GiB unique plan-plus-decoded input bytes, and 8 MiB output. `buildObservationAggregates` accepts lower `maxTotalInputBytes`, `maxOutputBytes` and `maxDurationMs` limits (maximum 30 minutes). Unique source byte admission excludes repeated I/O: each mapping rereads only its assigned chunks, and preflight plus final verification each reads all chunks, bounding decoded reads by twelve times unique source bytes. One partition is retained at a time per mapping; up to ten bounded aggregate arrays remain in memory. No scratch history spool is written.

The cooperative elapsed-time check runs on every independently generated expected clock hour, including missing source hours. It cannot interrupt a blocked operating-system read or native call; use an external process deadline for that stronger guarantee. These limits support local shards, not an assertion that global ERA5 processing fits one run.

The output is a validated schema-2 envelope consumable as a pinned input to `scripts/era5/build-release.ts`. Existing files are immutable and cause failure, including identical reruns. Output uses an exclusive hard link from a synced temporary file; the filesystem must support hard links. On failure before publication, rerun with the same pinned plan and absent output. A process kill may leave a uniquely named `.observation-*.tmp`; inspect and remove that file before housekeeping. Failed validation never publishes an envelope. No provider selection, authorization, model, deployment or network settings are changed.

Eligibility is inherited from `aggregate.ts`: fixed 1991–2020 baseline, at least 90% completeness, 27 represented years, and the existing per-year bin/month 80% gates. A complete-period label alone does not qualify sparse observations. Tests create synthetic observations for engineering verification; they are not measured ERA5 evidence.

Provenance revision identities are content addressed (`observation-plan-v1:<plan-sha>`, `observation-decoded-v1:<decoded-sha>`, `observation-raw-v1:<raw-sha>`). Local chunk names may be reused by independent plans without falsely conflicting when their envelopes join one release. A changed content digest creates a new revision identity; the exact plan and decoded bytes still record local IDs and experiment metadata.
