# Fixed ERA5 sample executor preparation — 2026-10-16

Status: deferred live adapter prepared and offline tested; no live job or returned provider body verified. No network, account/configuration read, credential access, installation, submission, polling, or sample fetch was performed during preparation.

## Commands and gate

Default offline command:

```powershell
.data/era5/venv/Scripts/python.exe scripts/era5/sample_live.py --plan
```

It prints the fixed request and planSha256 without reading CDSAPI_KEY, constructing an SDK Client, or importing requests. The request is destination 12, 1990-12-30 UTC, rectangle [32.25,48.75,32,49], four cells, 24 hours, 96 values.

Future explicitly authorized command (not run):

```powershell
.data/era5/venv/Scripts/python.exe scripts/era5/sample_live.py --execute --owner-allowance C:/reviewed/owner-allowance.json --output C:/fresh/sample-output
```

The owner must create an allowance JSON with exactly these keys: planSha256 (the printed hash), allowExecution:true, maxSubmissions:1, maxRawBytes:2097152, outputRoot (the exact canonical absolute output directory). The allowance is not generated automatically. Before credential access or POST, the contained worker exclusively creates and fsyncs a consumption receipt alongside the allowance (allowance filename plus .consumed.json). Repeated or concurrent claims cannot win twice, and another output directory cannot reuse the allowance. A crash before a checkpoint burns the allowance and requires independent reconciliation; resume requires the existing consumption receipt and known queued/running/successful checkpoint and can never submit again. Only after this gate, the contained worker reads the explicitly supplied CDSAPI_KEY environment value. No SDK/config/account discovery occurs. Add --resume only for an existing queued/running/successful checkpoint and identical immutable job receipt. Original deadline, poll count and identity remain binding. Unknown submission, download, downloaded/unvalidated and accepted terminal outcomes never resubmit or automatically restart. A killed process may leave writer.lock; independent reconciliation is required.

## Installed source contract

Inspected retained .data/era5/venv/Lib/site-packages/ecmwf/datastores/{legacy_client,client,processing}.py as source text, without importing clients. LegacyClient(wait_until_complete=False).retrieve delegates to Client.submit. Process.submit POSTs {inputs:request} to /processes/{dataset}/execution; Job.get_remote selects its monitor link; Remote.status GETs job metadata; Results.asset is result['asset']['value'], with href and file:size. Remote.get_results waits internally and is never used. Direct adapter fixes base https://cds.climate.copernicus.eu/api/retrieve/v1, takes one validated monitor identity, and uses one fixed /jobs/{id} GET and one /jobs/{id}/results GET. Metadata credentials use PRIVATE-TOKEN, as installed Client.headers specifies. No unreviewed metadata link is followed. Result size must be an integer at most 2 MiB. These retained source contracts do not establish current provider response acceptance.

## Limits and durable uncertainty

Core writes submission-uncertain and fsyncs before the only POST. Its immutable receipt binds the returned opaque ID. One submission, 60 polls spaced 30 seconds, original 30-minute job deadline, zero automatic retries, fixed per-operation connect/read timeouts, 1 MiB streamed metadata cap, 64 KiB raw blocks, 2 MiB cumulative raw cap and 128 MiB workspace budget apply. The outer suspended Windows Job enforces 512 MiB tree commit, two processes, and the whole execution deadline, including blocked network reads; on stop it kills/drains the tree. Request stream checks alone are not claimed to cancel blocked reads. Windows is required before credentials can be accessed.

Authenticated metadata and unauthenticated asset downloads use separate sessions, no environment proxy/netrc, no inherited auth/cookies and no redirects. Exceptions are redacted; no asset URL, query string, token or upstream error is logged or checkpointed. HTTP response resources close on all paths. Unknown asset origins stop before fetch. Unknown body/ZIP remains preserved and unaccepted; no extraction or format guessing occurs.

The only established exact asset host is cds.climate.copernicus.eu. The retained public guide lists arco.datastores.ecmwf.int for another, unadmitted product, and provides no CDS cache host evidence. Consequently a CDS response on a different download host stops safely while retaining the successful job for same-job resume. Reviewing official source evidence and updating the immutable host set is still required if CDS returns a cache/CDN host. The allowance cannot broaden that set. General CDS CDN compatibility and end-to-end live readiness are therefore not claimed.

## Actual raw validation

After raw hash verification and downloaded-unvalidated checkpoint, sample_live.decode starts the existing read_chunks-based sample_validate in a suspended Windows Job before resume: hard 256 MiB commit, one process, at most 60 seconds and remaining original deadline, 4 KiB output receipt. Credentials are removed from decoder environment. It validates actual raw bytes: exact four cells, all 24 UTC hours, member zero, final expver 1/0001, 96 finite [0,1] values, stable SHA-256. Only the exact receipt changes phase to validated-sample-only. This does not publish/install data or establish coverage for other dates/places. Process containment limits resources; it is not a security sandbox against malicious native decoder code.

## Offline evidence

Combined tests: python -m unittest discover -s tests/era5 -p test_sample*.py — 19 passed. Fake HTTP sessions cover exact POST inputs/monitor origin, no credential access in default or invalid-gate mode, secret exception redaction, unknown asset origin before download, unauthenticated stream/size rejection. Existing fixtures cover unknown POST/no retry, same-job resume, queue exhaustion/deadline, identity mismatch, redirect/body caps, secret-free journals, ZIP and final revision. Real suspended bounded decoder children rejected a synthetic ZIP fixture without any accepted checkpoint and accepted an actual synthetic NetCDF containing the exact expected four cells and 24 hours. Atomic concurrent allowance claims admitted exactly one winner; repeated and second-output claims were rejected. No provider request or scientific returned body was tested; whole-network-worker timeout behavior is prepared but not exercised against a fake blocked HTTP subprocess.
