# Bounded core API resource measurement — 18 October 2026

## Scope and outcome

The existing compiled API smoke check now supports `--capacity`. It runs the real compiled HTTP/MCP application in API mode with injected GeoNames/Geoapify, MET, WeatherAPI and OpenWeather responses. No owner provider configuration file or real quota ledger is loaded, and no external provider transport is delegated. Local source configuration contains fixed synthetic credentials only. No database, local geography files or historical baseline is required.

The fixed run passed all **12 MCP requests**: four initialization/resolution/astronomy/weather checks, four sequential core operations and four concurrent client operations. The measured workload mixes astronomy, night conditions and an aggregate observing plan. Two forecasts survive the deliberately unavailable OpenWeather fixture. Five injected source dispatches occurred under a six-dispatch capacity ceiling; none was a real provider request. The default four-request smoke behavior remains available and separately passes.

Exact evidence: [JSON receipt](data-pilot-evidence/api-capacity-20261018.json). Node **v24.14.0**, Windows x64; compiled bundle SHA-256 **af2ee78b7d20e91b4927b671700528e33eed950c50cb9f74bddedeebf226566c** (804,423 bytes). This hash identifies the bundle only, not dependencies, environment or a complete deployment artifact.

| Observation | Measured value | Interpretation |
| --- | ---: | --- |
| Module import plus application initialization | 290.84 ms | Excludes Node process launch, harness imports/setup and bundle hashing. |
| Listener ready after creation | 10.11 ms | Loopback only. |
| Sampled process RSS high point | 311.24 MiB | Process-wide phase/10 ms samples, not OS peak or per-request memory. |
| Sequential phase | 4 requests; p50 6.90 ms; p95 414.99 ms | Nearest-rank percentiles of only four samples; includes first aggregate/POI warm-up. |
| Concurrent phase | 4 client requests; p50 41.08 ms; p95 43.44 ms | Observed client overlap four; not parallel server CPU execution or sustained throughput. |
| Eight measured workload response bodies | 126,909 UTF-8 bytes | Decoded MCP/SSE bodies; excludes HTTP/TLS/wire compression. |
| Capacity phase elapsed | 482.10 ms | After preflight; 30-second dispatch/client-timeout budget. |
| Synthetic quota JSON | 487 → 579 bytes | This file only, excluding lock/marker, caches, dependencies, logs, backups and history. |

**Ordered warm phases:** preflight already resolves the point and requests astronomy/weather. The sequential phase further warms planner and candidate caches before the concurrent phase. The lower concurrent p95 therefore cannot be attributed solely to concurrency. This is one bounded local fixture run, not a benchmark proving speed improvement or a target service-level objective. Request latency ends after body read, before parsing/assertions. JavaScript timers/client timeouts do not preempt synchronous work; initialization and cleanup are outside the capacity dispatch budget.

## Bounds and test evidence

- Fixed twelve total MCP requests, at most four client requests overlapping, and at most six fake source dispatches. No input URL, account or live mode is accepted by this probe. The injected fetcher handles only fixed expected source paths and never calls global fetch.
- Global fetch is used solely by the MCP client against its newly created loopback listener. Existing provider timeouts, cache/control, schema, credit reservation and partial-outage behavior remain in force.
- Cleanup closes listener/application, releases the synthetic ledger and removes only the verified temporary directory under the system temp root. The parent process environment is restored. No owner file, ledger, key or retained dataset is deleted.
- Pure report-contract tests failed before the helper existed, then passed after implementation. They pin exactly two four-request phases, client concurrency1/4, finite latency/body metrics and synthetic/non-live labels, rejecting bad counts/status/claims. Initial harness authoring used an invalid activity enum and lacked an empty candidate response; those fixture errors were corrected without relaxing product validation or the default source-call bound.
- The compiled default smoke and `--capacity` mode pass. Coordinator reran **33 affected tests**, including the HTTP transport test the subagent sandbox could not bind; all passed. The geography maximum-scope fixture and source-specific cache tests are separate from this timing receipt.
- CI now invokes `node scripts/verify-api-runtime.mjs --capacity` on Linux and Windows after building the plugin, in addition to the ordinary full regression suite. It has no production timing threshold or secret requirement.

## What this closes and what remains

This supplies the agreed bounded **local core API measurement**, including four overlapping client requests, response sizes, initialization, sampled RSS and synthetic accounting-file growth. It does not certify a 2CPU/4GiB server, exact live API/source accuracy, worldwide administrative geometry, sustained demand, cold-cache fanout, browser processes or the complete optional-source configuration. Model inference is outside this MCP process.

Combined normalized-cache occupancy and full deployment storage are **unmeasured**, with reasons in the receipt; they are not reported as zero. Existing per-cache configured ceilings and separate optional-provider probes remain relevant but cannot be summed into a measured peak. Actual host/TLS/proxy/logging/retention, optional sources, provider latency, quota use across operators, sustained concurrency and refresh needs remain explicit release measurements. No global download is implied by those gates.

Reproduce offline after `npm run build:plugin`:

```powershell
node scripts/verify-api-runtime.mjs --capacity
```

No data-source admission, historical acquisition, deployment or publication was performed by this measurement.

The final receipt was regenerated after the API-point answer-label correction; its hash/measurements supersede the pre-correction probe. This does not change the source or host-acceptance scope.
