# Provider and artifact failures

| Condition | Behavior / operator action |
|---|---|
| MET/NOAA timeout or malformed payload | Preserve an explicit unavailable/partial result and useful local astronomy; do not guess values. Inspect bounded operator diagnostics without logging user arguments |
| 429 or Retry-After | Shared cooldown/admission limits apply; no unbounded automatic retry or background queue. Repeated callers share work where supported |
| Forecast expired | Conditional request uses the stored source validator; renewed expiry and replacement Last-Modified are persisted. Fresh data are not refetched before expiry |
| Missing forecast fields or horizon | Preserve source-specific missing fields, issue/valid times and out-of-horizon states. Do not blend models or extrapolate |
| Missing/corrupt historical artifact | Return unavailable with no numeric statistics. Validate the installed version/digest; restore the reviewed prior pair rather than accepting a new checksum automatically |
| Missing/unsupported candidate coverage | Return unavailable/not-covered with source vintage and coverage; no hits do not prove no observing spots exist |
| Oversized composed result | Return a safe tool error asking for fewer options or a shorter window; never drop provenance or truncate exact evidence silently |
| Malformed source or planner option | Safe errors retain the selected option as unavailable. Do not return filesystem paths, stack traces, credentials or arbitrary caught error text |

For recovery, test the same affected tool and a composed plan/comparison, then confirm provider counters/caches and rate limits still behave normally. Operator maintenance must keep all upstream request limits shared across any processes. A process restart may be needed for an abort-ignoring transport; no hosted recovery or availability guarantee is established by local fixtures.
