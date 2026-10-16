# Production source admission binding

The production gate binds an exact raw manifest, assembly plan, source subjects,
normalized boundary lineage and local evidence snapshot before execution. It
uses the code-controlled operator policy and an independently controlled review
allowlist. **The actual allowlist is empty, so actual production remains
unavailable.** Candidate files cannot supply policy, trusted reviews or a
self-approval token. This work acquires no data and authorizes no build or
publication.

The gate is `scripts/osm/production-source-admission.ts`; Python stages call
`scripts/osm/production_admission.py`. Existing source, assembly, work and memory
ceilings remain in force. Generic offline source-review preparation is separate
from this production binding. A successful preparation report alone is not a
production admission snapshot.

## Exact envelope

Supply a separately pinned JSON document with this strict shape:

```json
{
  "schemaVersion": 1,
  "kind": "production-source-admission-v1",
  "manifest": {"path": "ABSOLUTE_PATH", "bytes": 1, "sha256": "ACTUAL_SHA256"},
  "assemblyPlan": {"path": "ABSOLUTE_PATH", "bytes": 1, "sha256": "ACTUAL_SHA256"},
  "rawSources": [
    {"sourceId": "SOURCE_ID", "bundle": {"path": "ABSOLUTE_PATH", "bytes": 1, "sha256": "ACTUAL_SHA256"}}
  ],
  "boundaries": [
    {"boundaryIndex": 0, "bindings": [
      {
        "bundle": {"path": "ABSOLUTE_PATH", "bytes": 1, "sha256": "ACTUAL_SHA256"},
        "lineage": {"path": "ABSOLUTE_PATH", "bytes": 1, "sha256": "ACTUAL_SHA256"}
      }
    ]}
  ]
}
```

Placeholders above are a format illustration, not evidence or runnable approval.
Pins identify exact physical file bytes, including line endings. Manifest and
assembly plan are each at most 1 MiB; envelope is at most 1 MiB; bundle/lineage
pins are at most 4 MiB. There are at most 64 raw sources, 100 boundary mappings
and 64 source bindings per boundary. Every raw source ID and every boundary
index must have exactly one mapping; duplicate source bindings within a shard
are rejected. All paths are absolute, checked for unsafe syntax and linked
ancestors, and canonicalized before identity comparison.

The envelope is passed independently by path and SHA-256. Manifest and plan
must not embed its digest while the envelope hashes those same files: that
would create a circular hash dependency. The full manifest and full plan are
bound, including operational controls, geography mode, authorization reference,
paths, boundary selections and retained-accounting declarations. Re-pinning a
changed file does not preserve a previous execution/resume snapshot.

## Source and boundary checks

Every raw source maps to a fully validated admitted source bundle. Its source
URL, byte count, SHA-256 and selector revision must match the raw manifest.
The selector revision is the source subject's `intendedUse.transformRevision`.
Planet sources additionally require the same native vintage, selector policy
and exact descriptor file pin in the source bundle, raw manifest and assembly
plan. Planet descriptors retain `source-domain-only` semantics. Extract sources
require the admitted effective clip SHA-256 and an approved
`source-native-vintage` condition whose evidence is the exact native observation
bound to raw bytes/SHA-256. Source-domain and effective-clip evidence cannot be
interchanged.

Each boundary source subject must include a `normalized-boundary-lineage`
rights condition. Its evidence pin must be the exact lineage document in the
envelope; an unsigned relation added after source approval is refused. The
structured document is:

```json
{
  "schemaVersion": 1,
  "kind": "boundary-normalization-lineage",
  "source": {"url": "EXACT_ORIGINAL_URL", "bytes": 1, "sha256": "ACTUAL_ORIGINAL_SHA256"},
  "transformRevision": "EXACT_REVIEWED_NORMALIZATION_REVISION",
  "outputs": [
    {"path": "ABSOLUTE_NORMALIZED_PATH", "bytes": 1, "sha256": "ACTUAL_NORMALIZED_SHA256"}
  ]
}
```

The original payload identity and transform revision must match the admitted
subject. Every normalized plan artifact must appear with its exact path, bytes
and digest in each declared binding's approved lineage outputs. Multiple
bindings support a shard assembled from multiple admitted originals. A
candidate cannot replace a Natural Earth source chain with generic
GeoBoundaries attribution; provider-aware policy checks run first.

The gate hashes actual normalized boundary bodies and footprints, with the
existing 64 MiB aggregate boundary maximum and 128 MiB footprint maximum.
Actual raw payloads are not read a second time by this metadata gate. It binds
the declared admitted SHA-256 and actual raw-file size/stat identity; the raw
producer's existing before/after payload SHA-256 and native-parser checks remain
mandatory. The gate does not turn footprint bytes into searched-coverage proof.

## Authority, snapshot and rechecks

The production validator calls `validateProductionSourceAdmissionFiles` with no
candidate context. The operator policy comes from retained code-pinned source
inventory; its review allowlist is fixed independently of candidate bundles and
currently contains no trusted reviews. Changing policy or that allowlist needs
a separately reviewed code/evidence revision. Candidate CLI `policy`, `trust`,
`approved` and extra fields are rejected.

Metadata validation verifies all source manifest, provenance, licence,
condition, native/domain and review documents, including independently trusted
receipt pins. Aggregate distinct metadata is limited to 32 MiB across the
entire invocation; per-bundle limits also apply. Repeated bundle identities are
cached within one gate invocation. Input growth, changed pins and symlink paths
fail closed. All metadata, normalized bodies and authority source files are
re-read after validation, and raw stat identities are checked again.

The returned `production-admission-snapshot-v1` contains exact manifest, plan
and envelope pins; admitted subject/policy digests; raw-file state; metadata,
geometry and fixed authority code pins; and `snapshotSha256`. Phase labels do
not change that digest. A later phase or resume revalidates the entire context
and compares its new digest to the prior snapshot. Possession of a snapshot
digest alone cannot approve changed inputs or bypass missing reviews.
It also records `policy`, `producerManifestSha256` and
`producerCatalogueRevision` using the producer's canonical manifest and source
identity rules. Assembly compares these fields to the producer completion
receipt rather than accepting a copied admission digest alone.

Python selects only the fixed local Node gate and in-process type-stripping loader,
clears arbitrary inherited Node/Python/proxy settings, and pins fixed authority
code plus loader before and after the subprocess. The subprocess has a 60-second
deadline, 1 MiB stdout and 64 KiB stderr limits. Failures return no admitted
snapshot and create no production output. These are local input-validation
bounds, not a source receipt or producer runtime allowance.
Cross-phase code pins include the gate, source validator, Natural Earth policy,
Python bridge and fixed `production-type-loader.mjs`, so a changed loader or bridge cannot silently
reuse an earlier snapshot.
The gate loader uses Node 24's built-in type stripping without an esbuild child,
preserving the existing two-process Job ceiling for the Python worker and Node
gate. It adds no process or memory allowance.

## Executable production boundary

The supported supervised route is `supervised_membership_assembly.py MANIFEST JOB_ROOT PLAN PLAN_SHA256 LIMITS --admission ENVELOPE ENVELOPE_SHA256`. These are format placeholders, not an authorization or actual invocation. Preflight checks the fixed authority before creating a job. It then holds Windows deny-write/delete leases over the original raw files, exact manifest/plan, normalized boundaries/footprints and deduplicated retained metadata/authority files, rechecks under those leases and carries one expected snapshot through all three stages. The staged `raw-manifest.json` is audit evidence; raw parsing uses the exact admitted original manifest path. Existing supervisor deadlines, two-process limit, memory/disk/reserve accounting and individual assembly caps remain unchanged.

The raw `global_source.py` CLI requires `--admission FILE SHA256`; an expected `--admission-snapshot SHA256` binds a supervised invocation. It verifies before processing, holds retained input leases on Windows, compares source file witnesses across passes and checks admission again before completion/resume. Checkpoints and completion bind `admissionSnapshotSha256`. An admitted checkpoint cannot be resumed without that same checked snapshot. The raw payload hash and actual native header checks still run.

The executable `membership-assembly.ts` requires `--admission FILE --admission-sha256 SHA256` and the exact manifest (`--manifest FILE` for final assembly, or its existing prepare argument). It checks admission before preparation/classification, verifies the producer snapshot plus canonical manifest/policy/catalogue revision and rechecks before `assembly-complete.json`. Descriptor reads remain bounded even if a file grows. Read-only `--validate PLAN SHA256` remains available without granting execution.

The old direct `global_source_supervisor.pipeline` route has no admitted boundary/normalization contract and now refuses before launching a job, directing production to supervised membership assembly. Test-owned launchers exercise the existing library primitives with tiny reserved-domain XML. Their explicit test patches are trusted test code, cannot be selected by a candidate JSON field and expose no production CLI bypass. They preserve the previously integrated base-interpreter fixture launcher behavior.

## Integration API

TypeScript production callers use:

```typescript
verifyProductionAdmission({
  manifestPath, admissionPath, admissionSha256, phase,
  expectedSnapshot, expectedPlanPath, expectedPlanSha256
})
```

Python callers use:

```python
verify_production_admission(
    manifest_path, admission_path, admission_sha256, phase,
    expected_snapshot=None,
    expected_plan_path=None, expected_plan_sha256=None,
)
```

Python plan arguments are keyword-only. `expectedSnapshot`/`expected_snapshot`
accepts the prior digest or a prior snapshot object. Supported phases are
`preflight`, `raw-before`, `raw-after`, `assembly-before`, `assembly-after` and
`resume`. Run before creating outputs, when resuming retained work, and before
writing completion evidence. Bind the same snapshot into checkpoints and
completion receipts. `production_admission_retained_paths(snapshot)` enumerates
deduplicated exact evidence paths for whole-job accounting; callers must avoid
counting those paths again under a parent directory.

`verifyProductionAdmissionWithContext` and the metadata validator's explicit
operator context are library-only synthetic test seams. The production CLI
exposes no authority override. Tests use fictional sources/reviews and tiny
local artifacts; none constitutes an actual trusted review.

Still pending: received planet raw SHA-256/native observation, actual source
and normalization subject preparation, an independently reviewed operator
policy and trusted receipt allowlist revision, separately authorized bounded
production, searched-coverage evidence, derivative distribution decisions and
measured serving-host fit. The 2 CPU / 4 GB host remains a serving target only.
No tracker acceptance totals change.
