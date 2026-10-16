# Supervised membership assembly

This local path connects the existing raw OSM producer, prepared administrative membership, and streamed immutable catalogue builder. It makes no acquisition or provider request and installs nothing. A successful job proves the admitted local inputs were assembled; it does not establish worldwide coverage or serving capacity.

```text
python scripts/osm/supervised_membership_assembly.py RAW_MANIFEST.json NEW_JOB_DIRECTORY ASSEMBLY.json ASSEMBLY_SHA256 SUPERVISOR_LIMITS.json
```

The raw manifest and supervisor limits retain the contracts in [offline-global-source-pipeline.md](offline-global-source-pipeline.md). The independent SHA-256 argument pins the exact assembly JSON bytes. The new assembly plan is strict JSON, at most 1 MiB:

```json
{
  "schemaVersion": 1,
  "boundaries": [{
    "input": {"path": "C:/admitted/prepared/boundaries-0.geojson", "bytes": 1234, "sha256": "EXACT_LOWERCASE_SHA256"},
    "regionIds": ["region:v1:country"],
    "unresolvedBoundaryIds": []
  }],
  "footprints": {"path": "C:/admitted/footprints.jsonl", "bytes": 0, "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"},
  "membership": {},
  "stream": {},
  "catalogue": {},
  "retained": ["C:/admitted/prior-failure", "C:/admitted/rollback-edition"]
}
```

Replace the example boundary pin before execution. Every input and retained path is absolute and passes existing non-link path checks. Boundary shards use the prepared `boundary-shards.json` inventory, with input paths resolved to their absolute files; no re-ingestion is necessary. There are 1–100 shards. Known and unresolved inventories are passed unchanged to the existing classifier. Boundary content hashes are checked in the contained preparation stage after aggregate limits; Python preflight performs only bounded manifest/plan reads, structural/path checks and file-size checks. `membership` accepts only the existing numeric `BoundaryLimits`; `stream` and `catalogue` accept the existing strict source builder controls. Empty objects preserve defaults. The plan cannot supply commands, source replacements or arbitrary output paths.

The fixed supervisor runs three sequential stages: validate the complete plan and copy the independently pinned raw manifest into the job; run the existing raw producer against that snapshot; then assemble membership and catalogue. All stages share the supervisor wall deadline, counted job directory and reserve. Each child tree is placed in the existing Windows Job before execution. Tree commit and process limits are hard controls; main-process RSS and logical disk bytes are sampled. The Node heap ceiling is 1280 MiB, still subordinate to the operator's commit cap. Unsupported platforms refuse the supervised route.

The assembly worker makes exclusive, checksum-verified bounded copies of candidate and boundary inputs under `membership-input/`, then invokes `buildBoundaryMetadata`. This deliberately retains both originals and copies: include that extra space in the allocation. It checks every producer file pin (the mandatory candidates, lineage and exclusions) before and after publication and retains the complete producer descriptor in `assembly-complete.json`. Candidate facts, source URLs, hashes, vintages, attribution, access evidence and caveats pass through unchanged; only country and region membership are computed. Raw lineage/exclusion evidence stays in `normalized/`. The existing unique strict interior policy leaves border, unresolved, missing and ambiguous countries unknown.

The final bridge uses the newly computed regions and exactly the separately pinned footprint stream. Empty footprints remain unknown coverage. Administrative polygons never become source footprints. A supplied nonempty footprint stream still requires independent full-cell extraction evidence; this assembly does not compute clipping unions, resolve residuals or admit a source edition.

## Limits and accounting

Membership retains its existing narrower ceilings: 128 MiB candidate stream, one million candidate rows, 64 MiB aggregate boundary JSON, one million vertices per shard, two million aggregate vertices, 200 million comparisons, 1 GiB output and 30 minutes. Defaults are smaller. Source-builder limits remain unchanged. Increasing bridge controls does not increase membership capacity. Continent-scale membership and raw parser capacity remain unmeasured.

Automatic retained accounting includes every raw source, raw manifest, assembly plan, boundary shard and footprint file; the CLI also counts its limits file. `retained` must enumerate all additional rollback/failure paths in the admitted allocation. Duplicate and nested accounting paths are rejected, including any path containing the new job. Missing explicitly retained paths fail. The whole job includes SQLite and journals, staged copies, enriched streams, catalogue sort scratch/pages, logs, reports and failed output. No machine-wide lock or automatic discovery of unrelated retained files is claimed; the operator must reserve one active job and enumerate their allocation accurately.

All directories are fresh and exclusive. Failed stages retain their files and produce no `job-complete.json`. The job is accepted only with both `assembly-complete.json` and the supervisor's `job-complete.json`; files or catalogue roots left by a failed attempt are not an accepted edition. Late checks can leave a catalogue root in failed evidence, so never select it by filename alone. There is no cleanup, retry, resume or partition merge in this command.

The direct TypeScript `assembleMembership` API supports retained producer reuse for local evidence. It supplies bounded file/row and membership/builder work checks but requires the generic Windows supervisor for shared elapsed time, process-tree commit and disk accounting. A direct call is not a supervised capacity result.

## Evidence and remaining gates

The affected regression suite exercises the actual Windows raw-to-membership-to-pages process, duplicate source attribution, unknown access/coverage, immutable output, bad pins, altered lineage/exclusion evidence, membership failure retention, overlapping retained paths and retained bytes causing a preflight disk stop. The raw manifest snapshot is checked against the admitted original. Focused TypeScript and Python tests and the tools typecheck pass; root coordination runs the complete repository suite.

The retained measurement reuses 84 candidate rows and all 4,854 prepared boundaries, including unresolved inventories. Its generated footprint stream remains empty. The measured job counts the prepared inputs, original producer, prior G3 v1–v4 failures/results and staged copies, under the existing 2 GiB hard tree commit and 2 GiB sampled main-process RSS, 300-second, 384 MiB disk and 1 GiB free reserve envelope. Run harnesses and measured reports are retained in `.superpowers/sdd/2026-10-16-assembly-guidance` and `.data/supervised-membership-assembly-20261016-v*`. Final v3 completed in **31.573 seconds**, with **902,082,560 bytes** sampled peak RSS and **277,175,007 bytes** peak counted logical files (including both prior assembly attempts). Its catalogue has 11 pages and 3,688,899 output bytes. The country counts remain 46 FRO, 9 MCO, 1 FRA and 28 unknown; every nonmembership candidate fact and all raw file pins were independently checked. [Machine-readable evidence](data-pilot-evidence/supervised-membership-assembly-20261016.json) records the result. These are small-input integration measurements, not global throughput forecasts.

Global source pins/acquisition authorization, clipping footprint/residual admission, continent-scale resource fit, derivative offer/publication, serving acceptance and complete actual-release journeys remain open. See [g3-production-source-decision.md](g3-production-source-decision.md).
