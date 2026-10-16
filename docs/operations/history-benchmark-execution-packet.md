# Single-job historical source benchmark execution packet

16 October 2026. **Historical packet: subsequently approved and attempted once.** See the [actual outcome](data-readiness-delivery.md): remote success, local stop before download, no validated raw and no retry. The output and allowance below are consumed and must not be reused to start another job. This document itself authorizes no further operation. The original preparation text and execution pins below describe the attempted revision. It is a format/acceptance diagnostic, not a baseline download or a worldwide throughput estimate.

## Exact request and identity

Dataset: `reanalysis-era5-single-levels`. Destination: `place:v1:geonames:12`; target grid cell `era5:32:48.75`. Request body:

```json
{"product_type":["reanalysis"],"variable":["total_cloud_cover"],"year":["1990"],"month":["12"],"day":["30"],"time":["00:00","01:00","02:00","03:00","04:00","05:00","06:00","07:00","08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00","21:00","22:00","23:00"],"data_format":"netcdf","download_format":"unarchived","area":[32.25,48.75,32,49]}
```

Request SHA-256: `e96fac8783c4e3fe4a9b479038c95a9498b18690812380d785e22ee2af316d18`. Hash is Python `json.dumps(request,sort_keys=True,separators=(',',':')).encode()`; wire JSON whitespace is not the hash contract. Full `sample_executor.plan()` identity: `50294863dc89d2773347c252c34c97c3858c6a6442c6489f357d01bea04001c6` using the same canonicalization. The request has not changed from the [retained proposed legacy request](data-pilot-evidence/2026-10-15-history-source-proposed-legacy-request.json).

The rectangle is nondegenerate (N/W/S/E), containing exactly four quarter-degree cells: `era5:32:48.75`, `era5:32:49`, `era5:32.25:48.75`, `era5:32.25:49`. The latter three are explicit extra cells. Twenty-four UTC timestamps yield 96 scalar cell-hours, of which 24 belong to the target. Returned area, cells, exact UTC timestamps and cloud fractions are checked; unexpected expansion is rejected. No timezone inference or local-night eligibility is performed in this diagnostic. The prior ledger says this proposed day does not overlap verified retained observations; this packet subtracts no new coverage and gives the quarantined point response zero credit.

This deliberately uses the existing realistic rectangle instead of the planner's unproved degenerate one-cell month. It cannot execute a planner month or a different area: that needs a new identity/allowance. It does not imply `prefixJobs=1` from the global planner is executable by this fixed adapter.

## Pinned paths and later allowance

All paths below are absolute Windows paths under:

`C:\Users\TK\OneDrive\Desktop\Claude Data\nightsky.earth-main\.worktrees\plugin-v1`

| Artifact | Exact suffix under that root |
| --- | --- |
| Python | `.data\era5\venv\Scripts\python.exe` |
| Entrypoint | `scripts\era5\sample_live.py` |
| Fresh output root | `.data\era5\history-benchmark-20261016-legacy01` |
| Owner allowance | `.data\era5\history-benchmark-20261016-legacy01.allowance.json` |
| Durable claim | `.data\era5\history-benchmark-20261016-legacy01.allowance.json.consumed.json` |
| Output files | `checkpoint.json`, transient `checkpoint.pending`, `job-identity.json`, `writer.lock`, `sample.raw`, `validation.json`, `benchmark-metrics.json` within the fresh output root |
| Library scratch | `TEMP`, `TMP`, `TMPDIR`, `SQLITE_TMPDIR` all equal that output root |

The output directory and allowance were created only for the subsequent approved attempt and are now retained. At preparation time the required owner-approved JSON was the following object; this specimen cannot authorize a new attempt:

```json
{"planSha256":"50294863dc89d2773347c252c34c97c3858c6a6442c6489f357d01bea04001c6","allowExecution":true,"maxSubmissions":1,"maxRawBytes":2097152,"outputRoot":"C:\\Users\\TK\\OneDrive\\Desktop\\Claude Data\\nightsky.earth-main\\.worktrees\\plugin-v1\\.data\\era5\\history-benchmark-20261016-legacy01"}
```

After separate explicit approval and creation of that exact allowance, the existing executable command from the pinned repository root is:

```powershell
& .data/era5/venv/Scripts/python.exe scripts/era5/sample_live.py --execute --owner-allowance .data/era5/history-benchmark-20261016-legacy01.allowance.json --output .data/era5/history-benchmark-20261016-legacy01
```

The owner supplies `CDSAPI_KEY` explicitly at that later time. This preparation neither reads nor stores it. Default/`--plan` invocation is offline. The allowance is consumed exclusively before submission; uncertainty burns the claim. Do not automatically resume, remove locks, delete partial output or recreate an allowance. A known-job resume is a separately reviewed reconciliation of the original identity/deadline, never a replacement submission. Root/ancestor aliases, junctions, output symlinks and hardlinked files are rejected. The allowance pins the request plan and output root, not source file contents: verify the following source pins before approving this command.

Historical execution pins below use LF file bytes matching the attempted baseline's committed Git blobs. Subsequent [offline diagnostics changes](sample-failure-diagnostics.md) change `sample_live.py`; these historical pins must not be presented as pins for that later revision. Any future executable packet must freeze its own reviewed source revision and allowance.

| File | SHA-256 |
| --- | --- |
| `scripts/era5/sample_executor.py` | `7e7ed25a46e4c7653aec7da956b0c1fbc3c009445b2c8358b14939221706ddbc` |
| `scripts/era5/sample_live.py` | `438f2fff157072155aa17d672fb55abf96ca9cb31c18122fb7407591af486a7e` |
| `scripts/era5/sample_validate.py` | `5200a2d1134848ad25abb7b65e800e8c838b63b49fa9b9a72fade3a4324057e0` |
| `scripts/era5/read_chunks.py` | `a9ba9259efab3f92a88b2ce6763d1cae03e5cc8f8862c0b6f2de3bf9928ebb8b` |
| `scripts/osm/global_source_supervisor.py` | `d155053189792a960243aff6cbc9c832c08910ccf782b669efc0914eb91c9823` |

## Enforcement envelope and limits

| Resource | Fixed limit and enforcement |
| --- | --- |
| Jobs/retries | One submission, one active remote job, zero automatic HTTP retries. Submission uncertainty is durable before POST. |
| API operations | One POST, at most 60 GET status polls, one GET results, one asset GET: at most 63 operations on a fresh run. No automatic resume is included. |
| Poll cadence | 30 seconds between poll starts; first poll may start immediately. Persisted poll count/next time survive a reviewed resume. |
| Deadline | Whole supervisor terminates after 1,800 wall-clock seconds from supervisor start, sampled every 20 ms; cleanup waits are each capped at 3 seconds. Decoder additionally stops at the earlier of its checkpoint deadline and decode-start + 60 seconds. The outer supervisor now also enforces a monotonic 1,800-second deadline, so backward UTC-clock changes cannot extend the attempt. Checkpoint UTC deadline still constrains reviewed resume. |
| HTTP timeouts | Each call at most 30 seconds or remaining checkpoint allowance; connect at most 5 seconds. Stream loops check elapsed monotonic timeout. Parent termination covers blocked HTTP reads. |
| Metadata bodies | At most 1 MiB each; at most 62 metadata bodies = 62 MiB application-body upper bound across this run. |
| Response headers | At most 64 parsed fields and 65,536 bytes counting UTF-8 key/value plus four bytes per field, checked before body consumption for metadata and assets. This is a post-parse admission bound, not a raw-wire header allocator cap; parser memory is under the worker Job commit ceiling. |
| Asset body | At most 2,097,152 bytes, streamed in at most 65,536-byte chunks; advertised results size and Content-Length checked, digest retained. HTTP Content-Encoding other than identity is rejected before transparent decompression. Application body transfer <=64 MiB total including metadata; TLS/framing/header traffic is not an application-body byte count. |
| Origins | HTTPS CDS API; asset hostname only `cds.climate.copernicus.eu`; no redirects, inherited cookies, environment proxy trust or token on the asset session. Sessions clear cookies on construction; response-set cookies are not claimed to be disabled. An unreviewed CDN host stops before fetch. |
| Process memory | Outer Windows Job: hard aggregate committed memory 512 MiB, at most two active processes; nested decoder: hard 256 MiB, one process. These are committed-memory ceilings, **not RSS quotas**. Parent and decoder separately sample their main-process peak RSS every 20 ms; this is not simultaneous aggregate tree RSS. Unsupported platforms refuse before credentials. |
| CPU | No separate CPU-seconds quota. Finite process count and wall deadline bound occupation; decoder math thread settings are one. CPU time is not measured. RSS is sampled separately from these caps. |
| Storage/scratch | 128 MiB combined flat output and scratch, sampled at 20 ms by parent, also checked during state/stream and decoder operations. Nonregular entries/aliases are rejected. All supported library temp variables point inside that root. Budget includes failure raw, checkpoint pending, receipt, decoder output and scratch; allowance/consumption JSON are two small fixed-shape external files. No unbounded log is captured. |
| Storage qualification | Sampled stop is **not a filesystem quota**: a writer may overshoot between samples, including before termination. It is not a sandbox against arbitrary native-library writes. Only the reviewed read-only decoder is launched. Failure bytes are retained; no cleanup deletion occurs. |
| Decoding | ZIP/archive extraction forbidden. NetCDF native allocations under Job memory cap. Existing importer checks <=800 hours, <=10 cells, 32 MiB logical decoded numeric estimate before row reads; this sample additionally requires exactly 24 hours/four cells. The logical estimate is not a measurement of all HDF5 decompression work. No decoded child file is produced; final validation receipt <=4 KiB (sampled while writing and checked after). |

The parent now observes scratch growth even if the HTTP/decoder worker is blocked. Nested jobs kill descendants on stop/close and drain; failed/uncertain artifacts remain. A 20 ms sampled bound requires acceptance of finite overshoot and scheduler latency. If a strict disk quota, literal RSS ceiling, CPU quota or complete wire-byte quota is required by the owner, **this packet is not sufficient for that requirement**; those must be added before authorization. No such stronger protection is implied here.

## Format-specific provenance contract

For this legacy NetCDF sample, retain request/plan/source pins, acquisition timestamps and raw SHA-256. The importer requires supplied `number` with one value equal to zero and supplied `expver` values exclusively `1`/`0001`, plus correct cloud-fraction units/name, exact cells/hour clock and finite values. A successful receipt means `validated-sample-only`, never baseline, source-store or runtime admission. Missing member/revision, preliminary/mixed revision, schema drift or unexpected packaging stop with raw unaccepted. The existence of `number=0` is a file observation; it does not independently equate deterministic HRES with the EDA control member. Product selection is separately bound to the `reanalysis` request.

For prospective time-series/ARCO contracts, absence of `number` can be documented provider transformation. A reviewed future contract may record member evidence as `provider-documented-implicit`, with product identity, dated evidence/digest, supported interval and transformation version; it must distinguish this from `observed-in-file` and from local normalization labels. Historical final revision remains unresolved for that store. Raw-byte identity, age of observations, catalogue update cadence, process version and plausible HRES inference do not manufacture `expver=0001`. A dated product-level final-revision assurance bound to the acquired interval/store may suffice without an immutable upstream snapshot, but no such assurance is admitted here. The already retained point sample remains quarantined and contributes zero baseline hours. See [production source decision](h2-production-source-decision.md).

## Evidence after a later run and stopping decisions

Retain the original allowance/claim, checkpoint, immutable job identity, raw body and validation receipt, including failures. The checkpoint records raw bytes/hash, poll count, started/deadline, exact accepted cells/hours/provenance and monotonic `timings`: `submitToReadySeconds` includes local preparation, submission and polling until successful status (an upper bound on provider queue/service time), while `transferSeconds` includes result metadata, body transfer and digest checks. Timings explicitly cover the current attempt, not reconstructed earlier attempts. `decodeMetrics` records decoder elapsed time and sampled peak main-process RSS. The parent writes a bounded, sanitized `benchmark-metrics.json` with total monotonic elapsed seconds including cleanup, status, sampled peak worker RSS and sampled combined output/scratch bytes. No token, signed URL or exception text enters that receipt. The receipt is omitted if unsafe or no budget remains; absence means measurement incomplete, never success evidence. Native scratch/transient growth between samples, peak aggregate commit, CPU time and wire overhead remain unmeasured. These measurements support one finite packaging/cost observation, not worldwide throughput extrapolation or a full baseline feasibility claim.

Stop on unknown submission outcome, timeout, provider rejection, unsupported area, unknown asset origin, response/header/body limit, encoded HTTP body, checksum/length mismatch, aliases/storage violation, process containment failure, ZIP, unexpected cells/times/units or absent/nonfinal provenance. Preserve evidence and review; do not retry or silently widen host, area, limits or provenance. The scientific H2/H3 questions remain open regardless of transport success.

## Offline verification

TDD: oversized metadata and asset headers failed first; encoded asset failed first; owned scratch environment/junction refusal failed first; a real contained synthetic scratch writer exceeded the fixture budget without parent rejection before the fix, then was terminated with its failure bytes retained after the fix. Missing parent/phase/decoder measurements failed before implementation; real contained local workers now produce bounded scalar receipts.

- `.data/era5/venv/Scripts/python.exe -m unittest discover -s tests/era5 -p test_sample_live.py`: 19 passed, including actual Windows Job decoder accept/reject and scratch termination.
- `.data/era5/venv/Scripts/python.exe -m unittest discover -s tests/era5`: 142 passed. The first broad run exposed a timeseries transport fixture lacking response headers; its fixture now models the real response field. Existing NumPy 2.5 deprecation warnings remain.
- `sample_live.py --plan`: offline output matches the request and plan digests above.

No source/credential/network operation was used by these tests. Synthetic temporary data are not scientific coverage. Shared adapter header protection also applies to time-series transport; no time-series request or provenance admission was changed.

### Windows CI path-spelling correction

The first Windows CI run passed 141 of 142 tests and failed only the scratch-environment assertion: the runner supplied `C:\Users\RUNNER~1\...`, while the executor correctly canonicalized it to `C:\Users\runneradmin\...`. The test now compares `Path.resolve()` and checks all four temp variables (`TEMP`, `TMP`, `TMPDIR`, `SQLITE_TMPDIR`). A real Windows `GetShortPathNameW` regression confirms short and long spellings produce the same canonical scratch directory; it skips only if short names are unavailable on that volume. Runtime behavior and source pins are unchanged.

Fresh local full ERA5 run after this test-only correction: **143 passed in 8.482 seconds**, including the 8.3-path regression without a skip. Existing NumPy deprecation warnings remain. A new remote CI result is still required; this local result does not claim that CI was rerun.
