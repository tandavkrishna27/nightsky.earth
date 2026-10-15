# Offline global-source pipeline

This is executable local preparation, not admission of a worldwide edition. It makes no network request and installs no runtime database. No real extract, boundary edition, clipping union, global capacity or public derivative offer is admitted by these tests. Operator limits are stop ceilings, not evidence that a planet or continent set fits.

## Commands and handoff

From the repository, with existing Python and Node dependencies:

```text
python scripts/osm/global_source.py MANIFEST.json NEW_NORMALIZED_DIRECTORY
python scripts/osm/global_source.py MANIFEST.json SAME_NORMALIZED_DIRECTORY --resume
npx tsx scripts/osm/build-source-catalogue.ts NORMALIZED_DIRECTORY REGIONS.jsonl FOOTPRINTS.jsonl NEW_CATALOGUE_DIRECTORY
python scripts/osm/global_source_supervisor.py MANIFEST.json NEW_JOB_DIRECTORY REGIONS.jsonl FOOTPRINTS.jsonl SUPERVISOR_LIMITS.json
```

The first two commands provide cooperative byte/deadline checks only. Use the Windows supervisor command for OS process/commit bounds across both raw selection and catalogue construction. It runs the fixed Python producer then the TypeScript bridge sequentially with one shared deadline, counts raw inputs and supplied metadata plus the entire job directory, retains failure evidence, and creates `job-complete.json` only after both stages succeed. It uses the existing repository's installed `tsx` loader by absolute file URL. No environment variable selects sources, revisions or metadata. The API also permits explicit interpreter/Node executable paths.

The bridge consumes a trusted producer `complete.json` containing the revision and exact candidate stream byte/hash pin. It validates every candidate, region and footprint with the actual serving schemas, then calls `buildStreamedCatalogue` through three pull-based async iterables. There is no stdout row protocol or whole-array candidate document. Each stream uses fixed read buffers, a bounded pending row, byte/row limits, abort checks and a `finally` close. Metadata must be newline-terminated JSONL (an empty file is allowed). The bridge rejects an existing output directory; underlying pages/root remain immutable. Partial output is retained on failure.

## Local manifest, version 1

Every field below is required. Extra fields are rejected. `sources` is ordered, has 1–64 entries, and cannot repeat IDs or canonical paths. Source paths must be absolute: caller-relative paths are rejected before the supervisor creates a job directory, so changing the worker directory cannot change source identity. Source records require exact local SHA-256/bytes, a native UTC vintage, exact HTTPS release URL (never `latest`), clipping metadata hash and OSM rights. The local authorization text does not authorize downloads.

```json
{
  "schemaVersion": 1,
  "policy": "named-complete-way-v1-polar85",
  "authorization": "local synthetic fixtures only",
  "sources": [{
    "id": "synthetic",
    "path": "C:/admitted-local/fixture.osm",
    "format": "xml",
    "url": "https://example.org/synthetic-261001.osm",
    "bytes": 1234,
    "sha256": "REPLACE_WITH_EXACT_64_LOWERCASE_HEX",
    "vintage": "2026-10-01T00:00:00Z",
    "licenseUrl": "https://opendatacommons.org/licenses/odbl/1-0/",
    "attribution": "© OpenStreetMap contributors",
    "clipSha256": "REPLACE_WITH_EXACT_64_LOWERCASE_HEX"
  }],
  "limits": {
    "sourceBytes": 1000000,
    "scratchBytes": 10000000,
    "outputBytes": 1000000,
    "rowBytes": 65536,
    "nodes": 10000,
    "candidates": 10000,
    "referencesPerWay": 1000,
    "seconds": 30,
    "freeBytes": 0
  }
}
```

This example deliberately contains invalid hash placeholders and cannot execute until exact local identities are supplied. Native XML fixture vintage is the root `osm timestamp` attribute; PBF vintage is `osmosis_replication_timestamp`. Filename dates do not substitute. PBF parsing uses existing optional pyosmium; missing pyosmium fails before a complete artifact. No parser is installed automatically. XML rejects DTD/entity declarations and bounds entity bytes; PBF's parser may allocate its native block before Python sees a row, so the OS memory limit remains required.

`sourceBytes` counts the entire input set, `nodes` is per source, `candidates` is across the edition, and `referencesPerWay` bounds a way's materialized reference list. SQLite's cache is fixed at 2 MiB, reference lookups and identity/lineage merges remain on disk, and indexed output scans do not collect the catalogue in memory. Row bytes cap both normalized rows and XML entities; XML feed lookahead adds at most a few small blocks. Maximum row allowance is 4 MiB and maximum references per way is 100,000. These controls can reject legitimate oversized OSM objects; they never silently truncate them. SQLite page/journal growth is checked cooperatively and by the supervisor's sampled whole-job disk accounting, not by a hard filesystem quota.

`outputBytes` covers all non-SQLite files in the normalized directory, including checkpoint replacement temporaries, JSONL evidence and the final descriptor. Each output write reserves its bytes before creation; unbuffered JSONL writes keep physical byte checks current. The final descriptor cannot be published when it would exceed that allowance. SQLite and its journals count against `scratchBytes`; the complete directory also counts against their combined ceiling. XML root children are restricted to nodes, ways, relations and bounds. Completed bounds are removed immediately along with feature elements; unknown extensions fail at their opening element so interleaved features cannot conceal retained metadata growth.

## Selection, identity and geography

Category precedence and text cleanup match the reviewed importer: park, viewpoint, protected area, campground, beach; `other` does not broaden selection. Names use `name`, then `name:en`, then `official_name`, NFKC/control cleanup and 160 UTF-16 units. Nodes require finite in-range coordinates. Named selected ways require every referenced node, remove a repeated closing coordinate, then take the vertex mean. Longitude span greater than 180 degrees and any way vertex at absolute latitude 85 degrees or above are explicitly excluded. This conservative polar rule is a preparation policy, not corrected global geometry. Relations and unnamed features are excluded. Exclusions have type/ID, source and reason on disk.

Canonical place identity is `place:v1:osm:TYPE:ID`. Same identity, normalized values and native vintage coalesce with all source lineage; any conflict fails the edition. More than four contributing sources fails rather than dropping provenance to satisfy the runtime schema. `lineage.jsonl` records original source ID/hash/vintage/policy. Candidate `sources` also retain exact source URL, hash and native vintage. Revision is SHA-256 of the ordered source identity/rights/clip pins plus geometry policy; changing filesystem locations or operational budgets alone does not change geographic identity. Checkpoints separately pin the entire manifest, including those local fields.

Raw production sets `regionIds: []` and never invents a country, administrative boundary or coverage footprint. Supply separately admitted `RegionRef` and `CoverageFootprint` records to the bridge. Footprints must have `geometryBasis: full-cell` and ordered split-dateline rectangular bounds under the existing schema. Supplying a bounding box does not prove a clipping polygon covers that cell; the operator remains responsible for full-cell evidence and residuals. This lane implements no boundary containment or clipping-union solver and cannot itself close real ADM0/ADM1 or worldwide footprint admission. Empty candidate output proves no absence of suitable places.

## Recovery and immutable artifacts

The source SHA-256/size and non-link canonical path are checked before parsing and again after each source and before publication. Ancestor symlinks and Windows reparse points, traversal, source-inside-output and source mutation fail. Each source commits its node/candidate/lineage/exclusion transaction before a small checkpoint records the exact SQLite digest and completed-source count. Resume verifies every original source, the exact manifest/policy and scratch digest. It does not append to an existing published JSONL artifact. After full success, resume verifies every output file's digest and length and returns the existing immutable result. If interruption occurs during final JSONL publication, preserve that evidence and start a fresh output directory. If scratch/checkpoint disagree after an unclean transaction or crash, fail closed and preserve evidence; automatic salvage is not implemented.

`complete.json` is created only after candidate, exclusions and lineage files are closed, hashed and source identity is rechecked. `checkpoint.json`, `scratch.sqlite` and failed outputs are build evidence; never install them in the serving host. The serving artifact is the catalogue root plus pages produced by the existing streamed builder. Public distribution still needs the exact derivative offer/notices and release approval described in source admission.

## Supervisor limits and platform boundaries

Supply a separate JSON object with **all** fields:

```json
{"wallSeconds":30,"rssBytes":268435456,"commitBytes":536870912,"diskBytes":20000000,"freeBytes":0,"maxProcesses":2}
```

The Windows Job caps tree committed memory and active processes (1–4). Two processes are necessary for the `tsx` esbuild service; a single-process policy intentionally stops that stage. Main-process peak RSS, logical disk bytes and free reserve are sampled at 20 ms. Commit is the hard whole-tree memory control; RSS and disk can overshoot between samples. Child processes inherit the Job and are killed on close; stages start suspended and join the Job before resuming. The wall deadline is shared by both stages. Stdout/stderr stay in counted evidence files. No network/acquisition stage is present. Unsupported platforms refuse supervised execution instead of claiming equivalent enforcement. The unsupervised raw/bridge APIs remain usable for local correctness tests on other platforms.

The generic supervisor API accepts explicit local argv stages and separately enumerated retained files/directories; these must include rollback/failure artifacts outside the job directory. The fixed pipeline CLI enumerates only its exact raw sources, manifest and two metadata files plus the complete job directory; it cannot infer unrelated retained editions. Concurrent independent output directories are not coordinated by a machine-wide lock. Operators must admit one active job on their machine and count all retained editions in the complete allocation.

## Focused verification

```text
python -m unittest discover -s tests/osm -p "test_global_source*.py"
node --import tsx --test tests/places/sourceCatalogue.test.ts
npx tsc -p tsconfig.tools.json --noEmit
```

Fixtures cover duplicate lineage/conflicts, complete closure/incomplete/dateline/polar ways, relation exclusion, source identity/native vintage/mutation, limits, interruption/resume/corrupt outputs, actual schema validation, abort and bounded rows. Windows integration executes the real XML producer and bridge into immutable pages; supervisor failure tests retain evidence without a completion marker. Optional PBF parity runs only where existing pyosmium is present. This is synthetic correctness evidence; it establishes no global throughput, total working size, real-data completeness or serving-host fit.

## Pinned bridge controls and single-edition plan

The existing four positional bridge paths retain their defaults. Add exactly
`--config BUILD.json SHA256` to either the bridge or supervisor command to select
reviewed controls. `SHA256` is the lowercase SHA-256 of the exact configuration
file bytes; it is a required independent argument, never a value read from that
same file. Configuration is at most 64 KiB, strict JSON, with no unknown fields.
For example (replace the revision and hashes with admitted identities):

```json
{
  "schemaVersion": 1,
  "catalogueRevision": "osm-EXACT_PRODUCER_REVISION",
  "stream": {"maxRowBytes": 65536, "maxBytes": 134217728, "maxRows": 100000},
  "catalogue": {
    "chunkRows": 1000, "mergeFanIn": 8, "maxRows": 1000, "fanout": 128,
    "maxInputRows": 100000, "maxMetadataRows": 10000,
    "maxInputBytes": 134217728, "maxOutputBytes": 134217728,
    "maxScratchBytes": 134217728, "timeoutMs": 60000
  },
  "files": {
    "regions": {"bytes": 0, "sha256": "EXACT_METADATA_SHA256"},
    "footprints": {"bytes": 0, "sha256": "EXACT_METADATA_SHA256"}
  }
}
```

`stream` and `catalogue` are required objects whose individual numeric controls
are optional; omitted values preserve the existing defaults. Stream controls
apply per file; metadata has a fixed maximum of 10,000 rows per stream and the
publisher additionally counts both metadata streams against `maxMetadataRows`.
The producer completion descriptor already pins candidates. Configuration adds
exact metadata pins and requires the producer revision to match. The supervisor
checks that revision against the raw manifest before creating its job directory;
the bridge checks it again against actual producer output. Metadata pins are
checked before job creation and before bridge output creation, and during final
stream consumption. The config digest is checked independently in both processes.
The bridge checks candidate size/hash/rows before output creation, then checks
again while publishing. This extra bounded pass incurs local I/O; it is not a
throughput claim. Mutation or a failed late check retains failed output evidence
without publishing a valid catalogue root.

| Control | Existing hard maximum |
| --- | --- |
| Stream row bytes / file bytes / candidate rows | 4 MiB / 10 GiB / 10,000,000 |
| Chunk rows / merge fan-in / page rows / directory fanout | 10,000 / 16 / 10,000 / 256 |
| Publisher input rows / combined metadata rows | 10,000,000 / 10,000 |
| Publisher input / output / scratch bytes | 10 GiB each |
| Publisher time | 1,800,000 ms (30 minutes) |

All numeric controls must be safe integers within the existing bounds; merge
fan-in and directory fanout require at least two. Zero, fractions, booleans,
unknown keys, command lists and partition lists are rejected. The supervisor
continues to construct exactly two sequential local stages: the current Python
producer and installed TypeScript bridge. The configuration cannot supply commands,
programs, resume flags or output paths. APIs retain their existing explicit local
interpreter parameters and the generic low-level supervisor API; this config is
only a route through the fixed pipeline.

An edition is one ordered admitted source manifest, one coherent producer revision,
one pair of admitted metadata streams and one fresh output directory. The 12 GiB
aggregate allocation and proposed 48-hour raw-production stop do not raise the
10 GiB individual publisher limits or its 30-minute deadline. The supervisor's
shared wall limit counts raw production, bridge preflight and publication, child
startup and cleanup. Stage records include actual exit codes and measured elapsed
time, including failed child stages. Windows Job committed-memory/process limits
cover child processes; sampled RSS remains main-process RSS as stated above.

There is no partition merger in this route. Independently building Antarctica and
other extracts produces different source-derived revisions, so concatenating or
appending their outputs would break a coherent global edition. A proposed split
must preserve one admitted revision, identity conflicts, global name ambiguity,
metadata and coverage semantics through a separately reviewed merge design.
Until that exists, reject an edition that exceeds a single build's ceilings and
retain its evidence. Do not label successful source partitions as a complete
worldwide catalogue. Fresh job/output directories are mandatory; this fixed
pipeline never resumes or appends to a previous catalogue.
