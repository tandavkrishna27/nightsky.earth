# First bounded API validation — 17 October 2026

## Execution and authority

Owner approved the exact twelve-request envelope after private credential setup and confirmation that the accounts were unused elsewhere. The existing initializer created a durable quota ledger outside the repository. One batch, `owner-20261017-first`, ran at code commit `83fa914`, from approximately 06:54:14.946 to 06:54:20.932 UTC. No retry or follow-up request occurred. The allowance is exhausted.

The [original derived report](evidence/api-live-first-20261017.json) is preserved unchanged, SHA-256 `ae77ac25ae4078ffbb79c58b508226db193e16dc59a3349826fdf861a066497d`. It contains validation facts and public selected coordinates, not API keys, raw bodies or weather values. Subsequent reporting corrections must not rewrite this evidence or be represented as a second live run.

## Observed results

| Source | Attempts / HTTP 200 | Observed normalized samples per place | Cadence |
| --- | --- | --- | --- |
| Geoapify | 3 / 3 | All three named places selected with Asia/Kolkata timezone evidence | Not applicable |
| MET Norway | 3 / 3 | 25 | Hourly in this sampled window |
| WeatherAPI | 3 / 3 | 24 | Hourly |
| OpenWeather | 3 / 3 | 8 | Three-hourly |

Places were Hanle, Kodaikanal and Munnar. Every weather result passed the public schema and remained `partial`; missing fields and window coverage were not promoted to complete data. No raw weather response was saved. Total accepted response bodies: **408,745 bytes** (about 399 KiB). Case processing ranged from **642 to 1,304 ms**, excluding deliberate inter-case pauses. Highest sampled process RSS: **95,453,184 bytes** (about 91 MiB); this is not peak memory or a concurrent production measurement. The quota lock was released afterward.

## Findings and limits

- WeatherAPI and OpenWeather cadence/unit checks passed for these cases. WeatherAPI was still on its Business trial; the adapter requested only the Free-shaped three-day endpoint, but successful trial responses do not prove post-trial Free behavior. Recheck after transition under a new bounded allowance.
- MET temperature/dew-point unit checks were flagged. The reporter accepted only one Celsius spelling, while the existing MET adapter preserves provider unit labels. This is a reporting compatibility issue supported by offline inspection; the original report masked the unexpected token, so its exact live spelling cannot be reconstructed. Do not retroactively mark that original unit check passed.
- MET includes a preceding-hour sample when its precipitation interval overlaps the requested window. Therefore its sample-start-inside-window check was false. Existing interval logic must be assessed separately from instantaneous sample positions; this observation alone is not evidence of incorrect forecast selection.
- This verifies account connectivity and bounded adapter integration for three public places. It does not establish worldwide discovery quality, forecast accuracy, night access, historical coverage, full owner journeys or readiness for publication.
- Public-facing source attribution/licence presentation, configured-service concurrency/peak resource measurement, history and event gaps, and final assembled-product tests remain open.

## Offline reporting correction

Independent review approved the reporting-only correction. Twenty affected offline tests and TypeScript checks passed. The final full offline suite passed 1,265 tests, with zero failures and two skips (1,267 total). The reporter now recognizes MET’s Celsius alias and distinguishes overlapping forecast intervals from instantaneous timestamps. Production adapters were unchanged, and the original live report was not rewritten.

## Next action

Retain the ledger and original report. Review and test reporting corrections offline, update the tracker, push and watch exact-commit CI. Any new live request or owner live journey needs its own allowance; do not reuse the consumed batch ID or initialize quotas again.
