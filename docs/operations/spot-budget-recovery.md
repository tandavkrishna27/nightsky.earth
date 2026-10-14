# Offline spot runner: budget and recovery

The runner provides an offline plan, a synthetic Windows child-process rehearsal,
and a read-only recovery audit. It never exposes a live fetch command. No source
body, geographic coverage, or publication is implied by the rehearsal.

Run with the existing parser environment from the repository root:

```powershell
.data/osm/venv/Scripts/python.exe scripts/osm/spot_runner.py plan
.data/osm/venv/Scripts/python.exe scripts/osm/spot_runner.py rehearse --root .data/osm/global-pilot-synthetic-v1
.data/osm/venv/Scripts/python.exe scripts/osm/spot_runner.py inspect --root .data/osm/global-pilot-synthetic-v1
```

The rehearsal needs a fresh directory; an existing wave is refused. The plan pins
exactly Monaco, Faroe Islands, Fiji, in that order, using manifest version 1.
Synthetic source files are clearly marked and are deliberately tiny; they do not
claim to simulate regional parser volume or source bytes.

## Admission and child limits

`Budget` counts all regular files below the whole new wave root once, including
raw source, staging, prior sources, failed evidence, reports and journals. Pending
writes must fit within 104,857,600 logical bytes. Source bytes are not added again.
Hard links, symlinks, Windows reparse points and special files are refused. The
root and ancestors are checked before operations. Traversal components are
refused before canonical absolute containment checks; Windows drive-relative,
root-relative, device-namespace and alternate-stream paths are refused. A 1,000-entry ceiling keeps the
accounting/recovery inventory bounded. Each journal/report is capped at 1 MiB. Writes update accounting after flush;
the final report size is admitted using a bounded fixed-point calculation so its
reported logical peak includes the final report itself.
No cleanup deletes failed files to manufacture room for another source.

One active stage is admitted. Operator time is at most 900 seconds. The injected
acquisition API counts every explicit opener call before dispatch, at most six;
the acquisition module additionally pins HEAD/GET, refuses redirects, retries,
short/oversize replies and metadata substitutions, and receives a 60-second
acquisition deadline. An arbitrary injected opener must honor its timeout;
cooperative Python acquisition is not claimed to have OS memory/time isolation.
No live opener is supplied by the CLI.

`supervise_worker` launches the base interpreter suspended, assigns the existing
single-process Windows Job, then resumes. Descendants are refused. The Job caps
committed memory at 256 MiB. Worker peak RSS and the **whole wave root** are sampled
at 20 ms; workers stop at 60 seconds, 256 MiB RSS, the shared operator deadline or
100 MiB logical disk. Disk/RSS samples can overshoot between checks; disk is not a
hard filesystem quota. Child Python receives root-scoped TMP/TEMP. The Job does
not confine filesystem access: containment checks govern this trusted worker,
and concurrent external modification is outside the runner's enforcement model.
The parent interpreter has no Job cap.

Cleanup terminates the Job, falls back to killing an unassigned suspended worker,
waits at most three seconds for the child and three seconds for Job drain, closes
Job/process handles, then waits at most three seconds for directory sharing to
release. Cleanup deadlines are separate shutdown time. Any cleanup failure makes
the stage unsuccessful. Linux explicitly refuses Job supervision; portable
cooperative tests can still exercise the journal and budget.

`supervised_build` accepts an acquired source record and invokes the generic
`spot_build.build_source` in that child. Its internal action revalidates the exact
manifest and root pin, source identity, acquired length/hash and source-header
vintage before building. The existing retained Bhutan experiment is imported
read-only for Job helpers and keeps its original regression behavior.

## Recovery evidence

The root contains an immutable manifest/root identity, exclusive numbered stage
journal files, isolated source directories and a final report when admitted.
Each stage writes `pending` before work and `complete` only after successful
validation; failures write `failed` and stop before the next source. File lengths
and SHA-256 values checkpoint acquisition/build artifacts. Completed final reports
also inventory all earlier journals and files. Inspection rejects changed pins,
corrupt records, digest/length mismatches, invalid stage order and unrecorded files.

Interruption between pending and completion is reported as `uncertain`, including
partial files. A journal/report write that cannot fit preserves earlier evidence
and never claims success. There is no automatic deletion, retry, replacement,
submission, or resume. Inspection returns `resumeAllowed: false`; preserve the
old isolated wave and review the failure before making a new wave with a fresh
path. JSON parseability or a pending journal never authorizes continuation.

## Verification scope

The runner unit tests use injected synthetic operations, temporary directories,
checkpoint corruption/interruption, pending byte admission, six-request admission,
and actual Windows child Job launch/timeout/directory release. Windows-only tests
are explicitly skipped on Linux; Windows symlink creation is skipped when the
account lacks that privilege. Synthetic tests do not establish regional 60-second
or 256-MiB admission. Live acquisition authorization, source-byte acquisition and
regional processing measurement remain separate prerequisites. No live network,
publication or runtime installation was performed by this runner implementation.
