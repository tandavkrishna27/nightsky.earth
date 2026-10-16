# N4 retained geometry resolution

16 October 2026. Continues S2-G2 in the [fixed completion tracker](v1-completion-tracker.md) from the [nine rejected records](n4-unknown-region-and-global-validation.md). Scope: retained data only; no new downloads, provider/model calls or deployment.

## Root causes and handling

| Source records | Cause | Handling |
| --- | --- | --- |
| USA, CAN, CHE-3423, USA-3563, USA-3552, BMU-5137 | Multipart components meet at isolated exact vertices | Permit only proved vertex contacts with disjoint filled interiors. Keep contact coordinates classified as boundary. |
| ARE | A component lies inside another component's hole | Test containment against the filled polygon, including holes. |
| EGY, BRA-1294 | Exterior rings revisit an exact vertex and form inward loops | Explicit opt-in `repeatedVertexPolicy: extract-tangent-holes` extracts each loop as a tangent hole. Preserve existing holes and every directed edge. Default remains rejection. |

The two inward loops must not become exterior polygons: that would fill excluded areas. No coordinate snapping, arbitrary repair, dropped component or guessed administrative identity is permitted. The normalization audit records provider, polygon, repeated indices and their index basis, input/output lengths and the additional closure occurrence. Raw source bodies remain unchanged.

Canonical validation is shared by ingestion, preparation, shards and legacy membership paths. Proper crossings, shared edges, T contacts, uncertain near contacts, overlapping/nested holes and unsupported repeated-vertex patterns remain rejected. Contact admission checks boundary vertices and open-edge midpoints against the other filled polygon. Query boundary tolerance remains conservative.

## Retained execution evidence

The final v6 run completed all four stages. [Sanitized evidence](data-pilot-evidence/n4-nine-geometry-resolution-20261016.json) records source/output hashes, normalization audits and measured resources. [Seventeen probes](data-pilot-evidence/n4-nine-geometry-probes-20261016.json) and [source-oracle checks](data-pilot-evidence/n4-nine-geometry-probe-oracle-20261016.json) cover all nine affected providers. Earlier attempts are retained, never overwritten:

| Attempt | Result | Wall time | Peak sampled RSS |
| --- | --- | --- | --- |
| v1 | Ingestion stopped at the 100-million comparison limit in contact proof | 8.433 s | 1,816,109,056 bytes |
| v2 | Bounding boxes alone were insufficient; same comparison limit | 8.417 s | 1,813,032,960 bytes |
| v3 | Indexed contact checks progressed to general validation, then reached the same comparison limit | 10.648 s | 1,834,037,248 bytes |
| v4 | With explicit 200M allowance, reached output but exited natively (`0xC0000409`), no completion; exact cause unproven | 12.979 s | 2,043,858,944 bytes |
| v5 | With 1280 MiB Node heap, ingestion and preparation passed; stopped on an incorrect Egypt probe expectation | 34.431 s | 1,490,116,608 bytes |
| v6 | Ingestion, preparation, 17 direct probes and 23-row membership all passed | 38.458 s | 1,449,615,360 bytes |

Attempts v1-v4 stopped before preparation. V5 completed ingestion/preparation but did not reach membership. None alone establishes complete pipeline acceptance. The supervisor retains the same 2 GiB hard process-tree commit cap, 300-second shared deadline and 384 MiB accounted disk ceiling. After three measured comparison stops well below the time limit, the explicit offline comparison ceiling was raised to 200 million; ordinary defaults remain 10 million. All predicates and per-tick enforcement remain active. Node runs with `--max-old-space-size=1280` so garbage collection occurs before the unchanged outer commit cap. Indexed point-in-ring queries retain the original border/parity predicates and are checked against the original classifier in differential tests. Additional direct geometry probes are separate bounded checks, not observing-place recommendations.

The old Egypt probe was an edge midpoint (about 3.64e-15 degrees from the source segment). Its correct boundary result was independently confirmed on original, ingested and prepared representations. The corrected probe set preserves it as a boundary case and adds strict hole-interior witnesses for Egypt and Brazil. Test expectations were corrected without changing production geometry or predicates.

## Completed validation

| Stage | Result | Metered work |
| --- | --- | --- |
| Production ingestion | 4,854 features retained: 4,784 mapped and 70 explicitly unknown | 129,300,576 |
| Production preparation | Same complete feature/unknown inventory; three pinned boundary files | 125,609,300 |
| Direct geometry checks | All 17 probes across the nine providers pass | 41,297,485 |
| Production membership | All 23 synthetic rows retained; all 17 provider-specific assertions pass | Actual count not exposed; enforced maximum 200,000,000 |

The three boundary bodies total 45,254,883 bytes. Peak accounted files during v6 totaled 158,377,673 bytes, including raw inputs and intermediate outputs. These are build measurements on this Windows machine, not a production server capacity claim. No extraction footprints were manufactured: coverage and observing access remain unknown.

Normalization removed 52 consecutive duplicate positions (47 audit records) and added two closure occurrences when extracting the two holes: 1,843,790 source positions become 1,843,740 normalized positions. Every nondegenerate directed edge is retained; the two original Egypt holes remain present. All raw source hashes were unchanged after the run.

Independent code reviews covered topology, audit provenance, indexed classifier and the deliberate comparison-limit change. Final local checks: `npm test` **887 passed, one existing skip, zero failures**; `npm run check` all three TypeScript projects passed; `npm run test:review-cases` **8/8** with zero external attempts. Exact-commit CI follows the reviewed branch push.

For repeat runs, use the existing pinned descriptor with explicit `unresolvedIdentityPolicy: preserve-unknown`, `geometryPolicy: remove-consecutive-identical`, `repeatedVertexPolicy: extract-tangent-holes`, and the three whole-feature partitions. Run the actual ingestion, preparation and membership APIs in separate processes with Node `--max-old-space-size=1280`, explicit `maxComparisons: 200000000`, per-partition `maxVertices: 1000000` and aggregate `maxTotalVertices: 2000000`, under the measured supervisor envelope above. Use fresh output directories; retain completion manifests and audits. These settings are opt-in build settings, not a reason to download or process raw layers on every user query.

## Acceptance boundary

Successful boundary processing alone does not supply the observing-place catalogue, establish extraction completeness, prove public access, supply historical weather or close the whole V1. The 70 unresolved administrative identities remain explicitly unknown. Source scale/generalization and disputed-region limitations still apply.
