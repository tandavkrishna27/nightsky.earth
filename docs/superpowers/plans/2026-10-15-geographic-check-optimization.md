# Geographic resource-check optimization and retained acceptance

**Frozen prelaunch plan (historical):** the preparation-only and unexecuted statements below describe the state before the parent froze selected pins and launched the one authorized attempt. [Actual outcome](../../operations/geographic-check-optimization-wave.md): second bounded deadline stop, incomplete Faroe, no bridge or canonical adapter validation. This plan does not authorize a repeat.

Plan identity: 2026-10-15-geographic-check-optimization; worktree `.worktrees/plugin-v1`; parent owns implementation, review, launch and scheduling.

## Purpose and evidence boundary

Optimize the measured repeated ancestor/path validation cost without weakening path, mutation, resource or publication controls. The corrected 10-second profile attributes 9.7282963 cumulative seconds to `check` in an aborted partial Monaco workload. Nested cumulative durations overlap; this is diagnostic evidence, not unprofiled throughput. Preserve the original 600.019-second failed raw attempt and both diagnostics unchanged. No completed bridge or native current candidate comparison exists in that baseline.

This plan prepares exactly one subsequent offline acceptance attempt after optimization and parent release of the hardware. No execution is authorized by this document alone. No new provider, account, model, network, download, installation, deployment, publication or source-admission action.

## Input identity

Reuse `.data/osm/retained-geography-20261015-v1-input/manifest.json` unchanged, SHA256 `c9c8787252b9e3ba0a317e428553302283ec353211e8a4430684a3a0f4bdab14`. It pins actual retained native PBF inputs:

| Input | Bytes | SHA256 | Native replication vintage |
| --- | ---: | --- | --- |
| Monaco | 692392 | 32c409ec20a3449be6450e7e615a9d575dd7808e7326a8d087d3f4128b394a05 | 2026-10-13T20:21:31Z |
| Faroe Islands | 7735542 | 0b512e51364c5bc499b12691f8a91e34aa3e59efa368c4095aa096353bb2a859 | 2026-10-13T20:21:31Z |

The manifest records original attribution, license, URLs and exact local paths. These native metadata are retained facts. Its clipSha256 `99bb34fa5a7caf06f3c6e9d16eb162ac5264c03532998dff93babbf4911fc4c5` is explicitly synthetic benchmark control metadata, not an extraction polygon or proof. Empty regions and footprints remain empty. Coverage, membership and completeness remain unknown; sourceAdmission=false throughout.

## Launch gates and pins

1. Parent completes optimization, focused validation and review before this measurement. No competing heavy job or suite during timed execution.
2. Before launch record UTC, free RAM, commit headroom, disk free and exact logical inventory of the authorized enclosing geography allocation, including original attempt, both diagnostics, new controls and evidence. All retained artifacts remain preserved. Existing plus projected new writes must fit the enclosing 4 GiB new-file allocation; at least 96 GiB free reserve plus the 1 GiB run allocation must be available.
3. Use fresh `.data/osm/retained-geography-20261015-v2-job` and sibling `-controls`; both were absent at preparation. Refuse reuse; no automatic retry or cleanup.
4. Before launch write an ignored immutable prelaunch pin record outside the job root with SHA256/bytes of the manifest, both raw PBFs, optimized producer, supervisor, path helper, measurement harness, both catalogue builders, source-build-config, direct local Python/TS dependencies, installed TSX loader/package, selected Python executable/venv base executable and Node executable. Record installed versions from existing runtimes only. These are selected source/runtime/dependency pins, explicitly not a full import closure; verify selected pins immediately before launch and after drain. Capture the eventual executed optimized source, never retrospectively reconstruct a launch pin.
5. Current preparation-only SHA256: measurement harness `06ff2c17095f321123c5bfe6206eb9b1553fd258766d5d93998347b6abb41e65`; supervisor `b668dde2c7c254a95203410569794c2cf371658b9816aa0d97ca845e74088c3c`; path helper `a8b644b51f05bd08f080c9023f92fc65389b83f0a68f5969f4387512d669cdf0`; bridge `3ce128edc5d71940efad9c3a413948affe28419e0bcd3532e0708a431ab0fc79`; streamed builder `d6bf2db9853733bff07f7c40811cc718e5841160d4daa457c55d9783cabfa25d`. These are observations, not final optimized execution pins.
6. Rehash source inputs after drain and record native header validation outcome independently of manifest declarations. No raw source mutation or input replacement.

## Proposed command after parent release

Run from the stated worktree using the existing installed interpreter:

```powershell
& '.data/osm/venv/Scripts/python.exe' -B 'scripts/osm/measure-retained-source.py' '.data/osm/retained-geography-20261015-v1-input/manifest.json' '.data/osm/retained-geography-20261015-v2-job' --python 'C:\Users\TK\OneDrive\Desktop\Claude Data\nightsky.earth-main\.worktrees\plugin-v1\.data\osm\venv\Scripts\python.exe' --seconds 600
```

The existing supervisor resolves script paths and sequentially runs raw producer then configured catalogue bridge under one shared 600-second deadline. No third timed stage or profiling run. A deadline/failure is a preserved result; no retry without separate authorization.

## Exact finite controls

- New job logical writes: 1 GiB (1,073,741,824 bytes); enclosing allocation: 4 GiB including all retained geography roots, controls, manifests and evidence.
- Windows Job hard committed-memory ceiling: 2 GiB; active processes: 2; sampled main-PID RSS ceiling: 1 GiB. The venv redirector may be the sampled main process; RSS is not tree RSS.
- Shared supervisor wall: 600 seconds, sampled every 20 ms; disk free reserve: 96 GiB (103,079,215,104 bytes). Sampling can overshoot; this is not a hard filesystem quota.
- Manifest producer controls unchanged: seconds 600; sourceBytes 16 MiB; scratchBytes 512 MiB; outputBytes 64 MiB; nodes 2,000,000; candidates 10,000; referencesPerWay 10,000; rowBytes 65,536; freeBytes 96 GiB.
- Bridge stream: maxRowBytes 65,536, maxBytes 64 MiB, maxRows 100,000. Catalogue: chunkRows 1000, mergeFanIn 8, maxRows 1000, fanout 128, maxInputRows 100,000, maxMetadataRows 10,000, input/output/scratch each 64 MiB, timeout 120,000 ms. Shared deadline still wins.
- Owning Python bytecode disabled by `-B` and harness flag; children inherit PYTHONDONTWRITEBYTECODE; TSX_DISABLE_CACHE=1 during supervision; TEMP/TMP/SQLITE_TMPDIR point into job root.

## Harness limitations requiring explicit treatment before launch

The measurement harness creates controls/plan.json and measurement.json beside the job. Supervisor accounting retains exact sources, manifest, empty metadata and build config, but does not count those two control reports or a separate prelaunch record. The parent must account for these under the enclosing 4 GiB allocation; current code does not enforce that aggregate automatically. No claim of universal host-write containment or hard quota is valid.

Harness configuration is hashed before bridge launch, but harness/producer/dependency source identities are not pinned or rechecked by this harness. A separately recorded selection of prelaunch source/runtime/dependency pins and immediate verification is required; this does not claim a full import closure. Parent must resolve any implementation changes before creating that record. Measurement wall starts after control preparation, so shared 600 seconds describes supervised stages, not all preflight/hash preparation.

## Acceptance and reporting

Require complete raw normalized candidates, exclusions and lineage plus complete.json and supervisor job-complete before claiming a completed producer. Require actual second-stage success and immutable catalogue manifest before claiming bridge performance. Run native canonical adapter validation only on a completed output after drain. Record candidate/category counts, zero invented region membership, exclusion counts by source, revision/lineage pins and source identities. The legacy 11 Monaco / 73 Faroe rows are comparison facts, not required equality under different policy. Failed original output cannot establish current candidate equality.

Report per-stage wall/CPU, peak Job commit, sampled main RSS, logical SQLite/journal/other byte peaks and final lengths. Independent peaks cannot be summed as simultaneous peak. Job transfer counters include cached/metadata I/O and are not physical source reads. Hash/publication times remain null unless separately instrumented. Node count describes the final source table only. Cache and host load are uncontrolled; no global throughput, capacity, coverage or admission inference.

Preparation status: plan only. No benchmark, source call, network action, code edit or commit performed by preparation worker.

## Post-completion adapter variant (prepared, no output pin fabricated)

After successful drain, write `adapter-plan.json` inside the fresh job root, with schemaVersion 1 and one `retained-osm-canonical-v1` entry. Set completion.path=`normalized/complete.json`; independently measure its bytes/SHA256. Read its actual catalogueRevision and manifestSha256, and require the latter equals the unchanged canonical validated manifest digest. Populate sources from the retained manifest: id, sha256, nativeVintage=vintage, url and rights={licenseUrl,attribution}. Hash this exact UTF-8 plan before invocation. Relative normalized siblings are then resolved within the same fresh job root. This validates actual candidate/exclusion/lineage hashes, strict schemas and source bijection; nativeParserRerun and sourceAdmitted stay false.

```powershell
& node --import tsx scripts/validate-retained-source-adapters.ts .data/osm/retained-geography-20261015-v2-job/adapter-plan.json ACTUAL_PLAN_SHA256
```

Pin/output values depend on completed artifacts; they must never be copied from old synthetic fixtures. Capture result only after checking exit status and all findings. Also pin/check catalogue completion manifest and chunks under owning catalogue integrity checks; canonical adapter validation covers normalized output, not every published catalogue chunk.

Ignored launcher: `.superpowers/sdd/2026-10-15-geographic-check-optimization/launch-retained.ps1`. It defaults to preparation only. Parent must first review optimized code, confirm selected runtime/dependency pins (including base Python from pyvenv.cfg and installed esbuild/@esbuild paths), then invoke `-FreezeAfterReview`; inspect the recorded pins; invoke `-Launch` separately once after explicit scheduling release. It refuses existing roots and changed frozen pins before launch, rechecks selected pins after drain, inventories all related geography roots and reserves 16 MiB for auxiliary evidence under the 4 GiB aggregate. It retains the venv redirector interpretation of main RSS. Named installed paths were inspected locally and exist, including C:\Python314\python.exe and @esbuild/win32-x64. Launcher has been prepared but not executed. Its selected pins do not claim full import closure.


