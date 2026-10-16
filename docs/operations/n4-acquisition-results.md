# N4 bounded acquisition results — 16 October 2026

**Outcome: acquisition attempted, acceptance not completed.** The owner approved the two fixed geography downloads and one fixed ERA5 job within the reviewed limits, with no deployment. The owner then separately authorized loading the saved private CDS configuration into the child environment. No credential value is recorded in this document, evidence, command arguments or Git.

## Actual results

| Lane | Observed result | What this does not establish |
| --- | --- | --- |
| Weather | Consumed one-job allowance; checkpoint `submission-uncertain`, one reserved submission, zero recorded polls. No immutable job ID or raw file recorded. Local command exited 1 in under one second. | The cause, actual transmission, authentication outcome and provider acceptance are unknown. A remote job may exist; no same-job resume is possible without its identity. |
| Geography | First country GET timed out before headers/body were returned to the runner: `ReadTimeout`, read timeout 1 second. GET elapsed 1.218 seconds; whole supervised run 2.015 seconds. Zero returned/retained body bytes; zero-byte country partial preserved. Second state/province GET was not attempted. | This does not prove the source is unavailable or the server received no request. No body hashes, mappings, topology or global coverage were validated. |

Both lanes stopped. No automatic retries, alternate sources, extra requests, remote weather lookup or deployment followed. The unused second geography URL is not permission to continue after the tranche's stop condition.

## Retained local evidence

- Weather allowance, consumed receipt and uncertain checkpoint under `.data/era5/timeseries-sample-19901230*`. Preserve the retained lock and unknown state; do not remove/reset them to reexecute.
- Geography quarantine `.cache/s2-geography-acquisition-20261016/`: authorization/attempt/result/runtime/supervisor receipts and zero-byte partial. Exactly one attempt receipt exists; no ADM1 attempt or completed dataset exists.
- Safe weather reconciliation and reviewed code/test records under ignored `.superpowers/sdd/2026-10-16-n4/`. Private configuration was used only for the specifically approved bootstrap; its contents were neither copied into these records nor committed.

The geography supervisor observed peak combined RSS 64,864,256 bytes, sampled combined private commit 43,110,400 bytes and disk 4,295 bytes during this failed run. These are startup/failure measurements, not dataset-build or small-server capacity evidence. No scientific or production artifact was created.

## Offline corrections and verification

1. Reproduced a possible supervisor file-accounting race when an expected pending file disappears during atomic publication. Corrected only supervisor snapshot accounting; unknown names, aliases/hardlinks, stable-file disappearance and overflow still reject. This is a demonstrated defect, **not a proven cause of the historical failure**.
2. Added bounded, secret-free transport categories/status/byte counts and an exclusive supervisor-result receipt for future weather runs. Raw exceptions, response bodies, headers, URLs and tokens are excluded. The supervisor receipt has its own 2,048-byte cap beside the allowance, outside the existing output-tree budget.
3. Prevented Requests redirect preparation from preconsuming redirect bodies before bounded inspection. Regression uses the real Requests adapter path with a synthetic response; no socket is opened.
4. Changed geography read timeout from 1 to 30 seconds, retaining the fixed request count, 30-second parent header deadline, ten-minute GET, twenty-minute acquisition and thirty-minute whole-run limits. The updated expectation failed before the change and passed after it. No new request used the corrected timeout.

Root offline verification: **110 ERA5 tests passed**; **18 geography acquisition tests passed**, including inert native Windows containment/cleanup tests. Scoped fresh reviews approved the corrections. CI pins Requests 2.34.2 for the geographic runner and checks its offline default. Whole-wave review and exact-commit CI are retained with this delivery; neither converts failed acquisitions into accepted data.

## Next decision under the same N4

N4 remains partial; S2-G2/H2 and original **12 Done / 9 Partial / 6 Not started** totals are unchanged. No new stage or wave is introduced.

Before another remote attempt, obtain a renewed finite allowance. Geography needs a reviewed fresh run root and at most the same two immutable GETs with unchanged size/resource limits and corrected timeout. Do not delete/reuse the failed root. Weather needs safe reconciliation of possible provider-side existence where feasible, or an explicit owner decision accepting that unresolved possibility before authorizing another single submission. Any fresh weather attempt uses a new allowance/output tuple and the reviewed diagnostics, not a reset consumed receipt. No account lookup is implicitly authorized here.

Actual body inspection, mappings/scientific format, real release construction and S3/S4 acceptance remain pending. These results justify neither a bulk download nor a claim that global history is feasible.
