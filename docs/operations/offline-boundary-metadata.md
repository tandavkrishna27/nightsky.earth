# Offline boundary metadata producer

## Approved lane design
The producer consumes only local, SHA-256 and byte-pinned GeoJSON plus canonical candidate JSONL. Feature properties use the existing RegionRef schema. Geometry is Polygon or MultiPolygon, retaining holes and disconnected islands. Rings must be closed, simple, nondegenerate and split at the dateline; unsplit longitude jumps are rejected instead of guessed.

Membership requires a unique strict interior country match; a unique state match must agree with that country. Borders, overlaps, missing country and inconsistent state evidence remain unknown. Preassigned country or region claims must agree with the uniquely validated membership or the run rejects; claims are never silently overwritten. Output records preserve candidate facts and access caveats. Administrative geometry is not evidence of source extraction completeness: footprints.jsonl is empty. No source is admitted by this change.

The CLI takes a pinned input descriptor and a new output directory. Strict descriptor paths are relative to its directory, reject traversal/symlinks, and have explicit hard byte, geometry, row, comparison and output budgets. Output is exclusive, and complete.json is written last with checksums. Incomplete output has no completion marker and must be discarded. The existing source catalogue bridge consumes the resulting directory, regions and footprints.


## Invocation and interface

Run `npx tsx scripts/osm/boundary-metadata.ts INPUT.json NEW_OUTPUT` with already reviewed local inputs. The descriptor is strict JSON:

```json
{"schemaVersion":1,"catalogueRevision":"local-edition","boundaries":{"path":"boundaries.geojson","bytes":123,"sha256":"<64 lowercase hex characters>"},"candidates":{"path":"candidates.jsonl","bytes":456,"sha256":"<64 lowercase hex characters>"}}
```

Byte counts and SHA-256 values must describe the actual input files. Each GeoJSON Feature has only `type`, `properties` and `geometry`; properties are exactly the shared RegionRef fields (`regionId`, `name`, uppercase ISO3 `countryCode`, adminLevel 0 or 1, `boundaryRevision`, `sources`). Coordinates are two-dimensional longitude/latitude pairs. A FeatureCollection may be empty; it proves no membership. No source downloads, source admission or registry changes occur.

The exported `buildBoundaryMetadata(input, output, limits)` supports lower operational budgets and cancellation. Defaults: 16 MiB boundary input, 100,000 vertices, 10 million geometry/work comparisons, 100,000 candidate records, 128 MiB output. Candidate input is capped at 128 MiB and each input/output record at 64 KiB. Boundary validation uses a comparison budget because ring validation is quadratic. The hard ceilings are enforced even for caller-supplied limits. Large global boundary releases may require reviewed preprocessing into smaller local inputs; this tool does not silently simplify geometry.

Output files are `candidates.jsonl`, `regions.jsonl`, empty `footprints.jsonl`, and last-written `complete.json`. The completion descriptor records pins, membership policy, total and unknown-country counts, and output checksums. The catalogue revision is preserved; choose a new revision for a new enriched edition. Point membership does not establish entrance locations, access rights or completeness of ways/relations. A state is retained only with unique matching-country evidence; conflicting or ambiguous state evidence leaves state membership unknown while independently validated country membership can remain.

Pass the output directory plus its `regions.jsonl` and `footprints.jsonl` to `build-source-catalogue.ts`. Empty footprints intentionally leave areal source coverage unknown, including areas that contain validated candidate members. This is an enrichment producer, and does not solve the separate requirement for admitted source coverage cells. Consumers may use administrative membership and candidate lookup without claiming regional completeness.

Rings touching a query point are unknown, including hole borders. Holes must lie strictly within an exterior and be disjoint without nesting. Self intersections, zero-length edges and degenerate rings reject. MultiPolygon components represent a union; their original islands and holes are evaluated directly. Dateline-crossing polygons must be split into components with no longitude edge jump greater than 180 degrees. No longitude bounding rectangle is used for membership or coverage.

Failed runs can leave an exclusive partial directory without `complete.json`; remove that directory before retrying with a fresh output path. A completion marker is a successful local validation record, not approval to publish. File paths reject symlinks and traversal, and pinned file bytes are checked at consumption. As with the existing bridge, an untrusted process with concurrent filesystem write access requires an external read-only snapshot to eliminate filesystem race attacks.
