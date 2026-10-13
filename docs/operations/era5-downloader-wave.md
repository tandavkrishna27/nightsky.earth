# Bounded ERA5 downloader wave — 13 October 2026

The prepared 2025 manifest contains 28 chunks (two regions, twelve months and two boundary chunks each). Two January sources already exist; this wave implements a single explicitly selected chunk retrieval path. No account source request was made during implementation. The private configuration file was absent at the earlier existence check; credentials were neither inspected nor requested.

## Local configuration and deliberate operation

Install decoder dependencies and `scripts/era5/download-requirements.txt` in the isolated Python environment. Keep the modern personal CDS configuration outside the repository, normally `C:\Users\TK\.cdsapirc`. The supported API URL is `https://cds.climate.copernicus.eu/api`; legacy colon-separated keys and disabled TLS verification are rejected. Never copy the key into chat, source, manifests, reports or logs.

After private setup and authorization to make a real source request, the operator can select one reviewed remaining chunk:

```powershell
.data/era5/venv/Scripts/python.exe scripts/era5/download.py fetch --root .data/era5/pilot-2025 --chunk hanle-2025-02
```

Use the public `fetch` wrapper for the hard 30-minute whole-worker deadline. `fetch-worker` and `fetch_one` are internal wrapper/fixture seams with cooperative deadlines; they do not provide a hard deadline by themselves. No bulk action or automatic 26-download progression exists.

## Admission, source bounds and checkpoints

The downloader holds the same `.writer.lock` as local pilot imports, throughout admission, remote submission, queue polling, download, validation and publication. It invokes `pilot._checkpoint_existing_locked(..., deadline_started=started)` under that lock so there is no nested writer lock and the importer inherits the whole-operation deadline.

Admission reserves a maximum source staging file and retained copy, plus decoded/metadata overhead. Limits remain raw source 32 MiB, retained raw 256 MiB, scratch 1 GiB, decoded numeric 32 MiB (decoder preflight), decoded JSONL 4 MiB and whole worker 30 minutes. Source content is streamed in 64 KiB blocks; both declared source size and actual bytes are checked. Metadata is streamed and capped at 1 MiB per response before JSON parsing. HTTPS, verified TLS, no redirects, request timeout at most 30 seconds and whole deadline checks apply. The asset uses a separate session carrying no CDS key. A stalled socket/native decoder is covered by the parent worker timeout.

`remote-ledger.json` is a separate bounded journal bound to the reviewed manifest digest. It stores chunk ID, conservative state, validated request ID and numeric stage timing only. It never stores key, signed asset URL, upstream body or exception text. Durable `submitting` intent precedes the non-idempotent POST. Retry count is one attempt. Unknown state, failed request, incomplete body, timeout or import error stops and persists an unresolved entry. Any unresolved entry blocks every new submission, even for another chunk; unknown acceptance is never interpreted as permission to POST again. Successfully completed local chunks are reused only after checksum validation.

Hard worker termination can leave `.writer.lock`, a `submitting`/`queued`/`downloading`/`importing` journal state and partial staging files. These are deliberate review stops. Do not delete the journal to retry. First ensure no worker is alive, inspect the account request privately, match a known request ID, and verify completed local checkpoints with pilot status. An unknown submission with no request ID requires account-side reconciliation before any new request.

A crash after completed local import but before remote `complete` persistence also requires explicit reconciliation. Verify the corresponding raw/decoded hashes and local completed entry; confirm the recorded request is terminal and belongs to this exact manifest chunk. The downloader records the staged raw SHA256 before entering import. After confirming there is no live worker and reviewing a stale lock if present, use the explicit offline command:

```powershell
.data/era5/venv/Scripts/python.exe scripts/era5/download.py reconcile-local --root .data/era5/pilot-2025 --chunk hanle-2025-02
```

This acquires the sole writer lock, checks the exact manifest/chunk and validated request ID, requires an importing/uncertain post-download entry with a staged SHA256 matching the completed local raw SHA256, and verifies raw/decoded file hashes before marking the remote entry complete. It performs no network call or new submission. Pre-submission/queue uncertainty, absent completed local input, changed source and corrupt files remain blocked. Any leftover staging file still needs review; this command does not delete it. An explicit recovery action can resume the sole recorded queued/uncertain known request without another POST:

```powershell
.data/era5/venv/Scripts/python.exe scripts/era5/download.py resume-known --root .data/era5/pilot-2025 --chunk hanle-2025-02
```

Before invoking, confirm the previous worker has exited and review any stale writer lock. `resume-known` requires the exact manifest and chunk, a persisted valid request ID, no other unresolved job, and no staged/source/decoded untracked file. Submitting without an ID and downloading/importing states remain blocked. An uncertain entry recording a downloading/importing failure or staged hash requires reconciliation/review. Recovery obtains that same remote job through the pinned datastores `get_remote(request_id)` GET path, verifies returned request ID equality, then uses the same bounded poll/download/import pipeline and whole-worker 30-minute deadline. There is no new submission or automatic remote resume/cancellation. Unknown acceptance without an ID remains blocked.

## Client behavior and verification scope

The [official CDS setup instructions](https://cds.climate.copernicus.eu/how-to-api) require `cdsapi >= 0.7.7`. We pin [cdsapi 0.7.7 source](https://github.com/ecmwf/cdsapi/blob/0.7.7/cdsapi/api.py), [ECMWF datastores 0.5.3 compatibility source](https://github.com/ecmwf/ecmwf-datastores-client/blob/0.5.3/ecmwf/datastores/legacy_client.py), multiurl 0.3.9 and requests 2.34.2. Modern tokens dispatch from cdsapi to datastores; `wait_until_complete=False` returns a remote request. Status uses accepted/running/successful and results expose asset href/file:size. The [processing implementation](https://github.com/ecmwf/ecmwf-datastores-client/blob/0.5.3/ecmwf/datastores/processing.py) establishes these behaviors. Stock client automatic downloads are bypassed because they do not enforce this project's byte bounds.

The eight initial downloader behavioral fixtures failed before implementation and passed after it. Two reconciliation regressions likewise failed before the offline reconcile operation and passed afterward. Additional offline transport/compatibility fixtures exercise actual installed pinned client objects against synthetic responses, and real decoder import with the shared lock. Eighteen downloader fixtures passed on Windows, without credentials or CDS requests. The full Python decoder/pilot/downloader suite also passed (33 fixtures); existing netCDF/NumPy fixture deprecation warnings remain visible. Root performs the broader application verification.

Reports measure submit roundtrip, observed queue wait and streamed download separately from existing importer processing time/CPU/RSS. Queue timing is local observed elapsed time, not authoritative server scheduling telemetry. Runtime metadata behavior and authenticated source compatibility are fixture verified; real account retrieval, server redirects/response profiles, queue duration and real resource measurements remain unverified until deliberate private setup and one authorized source chunk.

Recovery delta: three known-job regression tests failed before implementation and passed afterward. Installed pinned ECMWF primary source confirms `get_remote` calls `get_job` with GET; the actual pinned client transport fixture checks that recovery emits GET only and returns the same request ID. No live calls or credential/config inspection occurred while implementing this recovery action. Observed queue timing on resumed work covers the polling interval that reaches success plus any previously persisted completed queue interval. Interrupted waits before success and time between invocations are not measured; this is not total server queue duration.
