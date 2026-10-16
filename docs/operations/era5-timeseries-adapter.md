# Fixed ERA5 time-series adapter preparation

**Current status (16 October):** This document records the original offline preparation. Later [execution/point-decoder evidence](n4-partitions-and-point-decoder.md) and the [retained provenance decision](h2-retained-provenance-decision.md) supersede its preparation-only status. The retained sample remains quarantined; no final revision/member admission or production history is established.

`python scripts/era5/timeseries_executor.py --plan` is offline. It prints the fixed one-point/one-day plan and SHA-256 `95edd1dddef2cd942e66089f3d6f85760d5ffd8876f7f4e32a6646be794a5322`. No credential lookup, HTTP client construction or job submission occurs. `--execute` is unsupported.

The public [browser request evidence](data-pilot-evidence/2026-10-16-timeseries-request-contract.json) records the rendered, unexecuted form example on 2026-10-16. Dataset is `reanalysis-era5-single-levels-timeseries`; request is:

```json
{"variable":["total_cloud_cover"],"location":{"longitude":48.75,"latitude":32},"date":["1990-12-30/1990-12-30"],"data_format":"netcdf"}
```

The `date` value is a list. The retained example SHA-256 is `e22cc3d278891a22bc02f8ca607f80c00ed6bbffaa9ec5517cbb1bf0df81faae`. This establishes generated request syntax only; no server job or scientific response was accepted.

## Implemented seams

`timeseries_executor.run_fixture` accepts an explicitly marked synthetic fixture transport only. It reuses `sample_executor._run` with a distinct plan identity; the legacy default contract is unchanged. Fresh output, exclusive writer ownership, immutable job identity, durable uncertainty before submission, zero retries, bounded polling/download and original-deadline resume rules are shared. Time-series and legacy receipts/checkpoints are incompatible. Interrupted or uncertain submission requires independent reconciliation and cannot be resubmitted.

`timeseries_transport.Adapter` is a concrete explicit-session wire seam derived from `sample_live.Adapter`. It accepts only the exact time-series dataset/request, reuses bounded JSON/stream handling, disables redirects and environment trust, and separates token-bearing API sessions from unauthenticated asset sessions. The immutable asset allowlist remains `cds.climate.copernicus.eu`; unknown CDN hosts stop before fetch. Tests supply synthetic sessions; no live client was constructed.

The ceilings are 2 MiB raw, 128 MiB new output, one submission, 60 polls, 30 seconds between polls and 30 minutes total. They are rejection ceilings, not cost estimates or execution permission. Fixture timeouts are cooperative and do not provide hard containment against a blocking transport.

## Later gated wrapper

[S2 sample preparation](s2-weather-sample-proposal.md) adds a separate `timeseries_sample.py` owner-gated Windows wrapper with parent/worker containment checks. Its default is offline and it has not been used for an actual acquisition. The original `timeseries_executor.py` CLI remains plan-only. No scientific decoder/publication is supplied.

## Original adapter delivery limits

There is no real execution entry point, allowance consumer, time-series decoder, monthly publication or runtime selection. A future live path must separately bind exact owner allowance, output and identity, preserve host/TLS/auth separation and enforce existing hard process containment around blocked calls before credential access. Actual returned dimensions, units, missing values, revision semantics, costs/horizon, CDN and baseline remain unverified.

Every complete fixture download ends `downloaded-unvalidated`, including malformed/unknown payloads. Partial or rejected downloads retain `download-uncertain`; they cannot resume automatically. Raw bytes are quarantined by this terminal status, never labelled legacy expver `0001`, scientifically accepted or promoted. The planned 24 hours is a request expectation and makes no claim about observed response shape.
