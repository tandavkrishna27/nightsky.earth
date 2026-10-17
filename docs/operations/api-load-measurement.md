# Bounded offline API load measurement

Run `node --import tsx scripts/measure-api-load.ts` from the repository root. It prints JSON and accepts no arguments, live mode, credentials, URLs, or custom transports. It reads source files for a fingerprint, never environment files or historical datasets.

The fixed workload exercises the actual API discovery service with tiny fake GeoNames HTTP responses:

| Scenario | Concurrent callers | Expected fake fetches | Useful observation |
| --- | ---: | ---: | --- |
| Same query | 8 | 1 | All eight callers receive a usable match through coalescing |
| Distinct queries | 10 | 8 | Eight matches and two explicit quota-exhausted source attempts |
| Provider outage | 1 | 1 | HTTP 503 becomes unavailable with no automatic retry |
| Provider 429 | 2 | 1 | First request receives 429; queued request is blocked, both report quota exhaustion |

The report embeds the existing `measureApiRuntime` serial resolution, warm cache, immutable details and unsupported-region observations. Its existing weather collection fixtures preserve MET, WeatherAPI and OpenWeather outcomes and native sample times, including partial outage. No duplicate weather harness is maintained.

The current complete run uses 12 fake transport calls, a maximum of ten concurrent service callers and tiny bounded results. The load guard permits at most 22 new fake fetches; the baseline has a separate six-call, five-second budget. The combined declared call bound is 28; the fixed workload uses 12. JSON exposes both phase budgets separately. It checks a 25-second elapsed budget before new scenarios and transport calls. Real request deadlines remain bounded by production service code; an event-loop stall can exceed any in-process wall-clock guard. This is not a hard real-time deadline.

Per scenario, the report records elapsed time, individual result elapsed times and UTF-8 JSON response bytes, match count, source-attempt outcomes, fake transport status and body bytes, selection cache occupancy, and observed extra transport attempts for the same key. Zero extra attempts is observed in these fixtures. This is a transport observation, not an instrumented private retry counter. A rejected queued request does not count as a transport retry. The full report contains process-wide sampled peak RSS and a source fingerprint combining the existing runtime harness fingerprint with this script; it is not a complete build attestation.

The injected provider clock advances by 1,001 ms per read so queue draining does not spend seconds in synthetic pacing sleeps. Consequently this exercise establishes bounded software behavior, **not real throughput, network latency, sustained quota capacity or backoff duration accuracy**. RSS is sampled at operation/fetch boundaries and includes the Node process, imports and any concurrent work. JSON sizes exclude HTTP/MCP framing and compression. Calls exercise service methods, not a listening endpoint. Weather provider HTTP parsing, real source accuracy, geographic coverage, deployment storage and Hetzner acceptance require separate evidence.

Focused regression: `node --import tsx --test tests/operations/api-load-measurement.test.ts`. The test replaces global fetch with a throwing function to catch accidental network fallback. Root test/CI registration is managed separately.
