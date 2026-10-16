# Finite worldwide grouped executor

`scripts/era5/global_acquisition.py` implements a finite packet executor for the worldwide grouped schedule. No arguments and `--plan` print an offline contract using only the standard library. This delivery used injected transports and locally generated NetCDF fixtures; it made no provider calls, read no credentials, and executed no live worker.

The prepared, **unapproved** packet is `.data/global-acquisition-preparation-20261016-v1/packet.json`. It contains the existing first 16 complete grouped requests, 363 monthly children, exact required/filler cell inventories, request hashes, source pins, code/runtime pins and immutable caps. Its companion `source-paths.json` records local metadata paths. The packet is not an allowance or evidence of provider acceptance. Code changes invalidate its runtime pins and require regeneration and review.

The [sanitized preparation receipt](data-pilot-evidence/2026-10-16-global-acquisition-executor-preparation.json) records the final 38,218-byte packet pin `24a60d6f7316dfeacbb62844c87dbec6393e913de0cb87ee3f97ef140eef6c89`, all 16 request hashes, source/runtime pins, controls and remaining gates. It contains no credentials, allowance, local absolute paths or private asset URLs.

The packet binds frozen compact plan `0b296d22142fea417a71299e17009536f82b14417f33eb4b38baa2ff307d2b12` and reconciliation-v2 `a5cc2399ca627fbf23a3a776182f93235c37dab2bd639c954d7ed5d1a200a2ba`. Admission checks every selected rectangle and each month's missing day/time shape against those pinned inputs. It rejects the four blocked unequal-mask owners `243:457`, `243:458`, `244:457`, `244:458`; none occurs in this prefix. It does not claim those blocked owners have been replanned or that a finite prefix completes the baseline.

## Execution contract

`build_packet(jobs, source_pins=..., runtime_pins=..., asset_hosts=..., blocked_tiles=...)` validates the exact CDS identity, valid padded calendar, nondegenerate quarter-degree rectangle, disjoint required/filler inventory, parent and monthly-child clocks, and nonoverlapping jobs. Canonical hashes match the TypeScript planner's existing request identities, including integer-valued coordinates. `verify_sources(packet, paths)` additionally binds the selections to the frozen ownership and reconciled missing masks. `installed_runtime()` returns the base interpreter hash, package versions and source file hashes; the same values are checked before launch and inside the worker.

`run_fixture(authority, output, packet, transport)` runs the real state machine against an explicitly fixture-only injected transport. Responses expose `status`, `headers`, `blocks()` (at most 65,536 bytes each) and `close()`. Submit/status/result return streamed JSON. Fixtures use `jobId`, `status`, and `{url,size}` objects. `LiveTransport` instead uses the retained CDS monitor-link/status/asset wire shapes. Metadata is bounded and durably charged before JSON parsing. Raw asset bytes are durably charged before writing. No automatic retry or resume API exists.

The authority directory holds an exclusive active lock and a permanent packet attempt claim. A submission intent is persisted before POST; unknown outcomes consume the attempt. Changing output directories cannot reset the packet claim. Completed parent receipts retain request/tile identity, required/filler inventories, original raw hash, monthly child paths/hashes, exact row counts and missing-hour counts. Publication uses the existing grouped importer with an additional shared-deadline callback. Its legacy regional entrypoints and four-submission policy are unchanged.

The explicit live command, **not run for this delivery**, is:

```text
python scripts/era5/global_acquisition.py --execute --packet PACKET.json --expected-packet-sha256 SHA256 --owner-allowance OWNER.json --expected-allowance-sha256 SHA256 --output ABSOLUTE_NEW_DIRECTORY
```

The owner allowance must contain exactly `schemaVersion:1`, `allowExecution:true`, `packetSha256`, absolute `outputRoot`, absolute `authorityRoot`, `sourcePaths` matching all packet source keys, and `providerAcceptance:{path,sha256}`. Its pinned provider review JSON must contain the same `packetSha256`, the ordered `acceptedRequestSha256` list, and `currentProviderFormReviewed:true`. These records require an actual owner decision and current provider review; the executor does not manufacture either. No such records were created here.

The supervisor consumes an exclusive permanent receipt beside the owner allowance before starting a worker. A different output or authority cannot reuse that allowance. Windows Job containment is mandatory; unsupported systems fail before credentials. The worker starts suspended, is assigned before resuming, and uses the pinned base interpreter directly with the retained environment's packages, avoiding Windows venv launcher RSS mismeasurement. Only then can the worker read an explicitly supplied `CDSAPI_KEY` environment variable. The API and asset sessions are separate, environment proxy/config discovery is disabled, retries are zero, and asset retrieval is tokenless with redirects disabled. The exact HTTPS host must be in the packet; result size, Content-Length and streamed byte count must agree. The prepared packet admits `cds.climate.copernicus.eu` and the exact retained validated host `object-store.os-api.cci2.ecmwf.int`. Its `assetOrigin` source pin binds `legacy-weather-result-validation-20261016.json`; admission verifies its accepted sample result and host. Other hosts stop execution, and this single retained origin does not prove future provider routing.

## Enforced controls and remaining limits

| Control | Implementation |
| --- | --- |
| At most 16 submissions; one active job; zero retries | Finite immutable jobs; authority lock; persistent claim and per-job intent; sequential loop |
| 32 MiB raw/job; 512 MiB cumulative assets | Result/header/stream checks and persistent byte charges |
| 1 MiB metadata response; 32 MiB cumulative metadata | Incremental bounded reads and persistent charges before parsing |
| One submit, one result GET, one asset GET per job | Single forward-only state machine; every failure burns the attempt |
| 20 polls/job, at least 30 seconds apart | Poll count and next-poll time persisted before each request |
| 30 minutes/job; 8 hours/batch | Shared state deadlines; supervisor wall and monotonic checks; Job termination includes blocked reads/native decode |
| 512 MiB process-tree commit; two processes | Windows Job hard limits |
| 256 MiB decoder RSS | Actual base-interpreter process sampled every 20 ms and grouped decoder admission checks; **not an OS hard RSS quota** |
| 4 GiB new output; 96 GiB free reserve | Whole output/authority tree sampled every 20 ms; cooperative checks and per-parent staging reservation; **not a filesystem quota** |
| Exact member/revision/grid/time; monthly lineage | Existing strict grouped decoder, worldwide pinned inventory adapter and child parent-hash checks |

Reservations include `(2 × monthlyChildren + 1) × 4 MiB + 2 × 32 MiB`, not one child. Native/library scratch goes to the supervised output directory. Stdout/stderr are discarded to avoid unbounded or sensitive diagnostic logs. Unknown outcomes, stale locks, partial output and consumed receipts require independent offline reconciliation; deleting them is not a supported recovery operation. The executor cannot protect its allowance records against an operator deliberately deleting or replacing their filesystem state.

Current provider acceptance of the exact grouped requests, an owner allowance, reviewed cache hosts if needed, and an actual contained live run remain external gates. Fixture success establishes the implementation contracts, not provider compatibility, worldwide throughput, scientific completeness or deployment readiness.

## Offline verification

```text
.data/era5/venv/Scripts/python.exe -m unittest discover -s tests/era5 -p test_global_acquisition.py
.data/era5/venv/Scripts/python.exe -m unittest discover -s tests/era5 -p test_grouped_history.py
python scripts/era5/global_acquisition.py --plan
```

The executor tests cover cross-language identity admission from retained planner evidence, submission uncertainty across output roots, metadata caps, exact asset host/length, persistent poll/deadline bounds, source-pin/blocked-owner/missing-mask rejection, separate tokenless sessions, suspended supervisor wiring and cleanup, and actual NetCDF parent-to-child lineage with null preservation and grid/time rejection. The existing grouped tests retain coverage for revision/member layout, unexpected variables, missing observations and immutable parent/child hashes. The NetCDF tests require the retained ERA5 environment; unsupported environments skip that one fixture, while Windows supervisor wiring is explicitly skipped off Windows. The installed netCDF4/NumPy combination emits an existing array-shape deprecation warning during fixture creation.
