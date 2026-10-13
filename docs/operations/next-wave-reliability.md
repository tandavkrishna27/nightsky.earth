# Next wave reliability evidence

Date: 2026-10-13. These checks are offline local evidence. They do not authorize remote exposure or prove staging capacity.

## Health

`mountHealthRoute(app, dependencies?)` mounts `GET /health` before website fallback routing. The response includes only a fixed service name, status, probe type, integer uptime and fixed component readiness states. It has `Cache-Control: no-store`. It performs no provider fetch, reads no request location or metadata, and discards exceptions rather than returning messages or stack traces.

With no checks, HTTP 200 explicitly reports `probe: liveness`; this proves that the process is responding, not that indexes or upstream providers are ready. Optional local synchronous checks named `placeIndex`, `candidateIndex`, and `lightPollution` return `ready` or `unavailable`. Configured checks produce `probe: readiness`; any unavailable result or thrown check produces HTTP 503. Configure required index checks when production artifacts are selected. Do not use a provider call or expose artifact paths in a check.

## MCP limits

Default route controls are 60 admitted requests per client IP per 60 seconds, a shared ceiling of 600 admitted requests per 60 seconds across all clients, 20 active handlers, and at most 10,000 IP counter keys. All configuration values must be positive safe integers. The shared ceiling limits distributed traffic and is separate from per-client limits. These are conservative configuration defaults, not measured deployment capacity. At key capacity, expired entries are removed; a new client is rejected if the map remains full. Counter expiry is lazy: expired keys may remain in bounded memory while traffic is idle; no raw identifiers are logged by these controls.

Rate rejection does not consume a concurrency slot. Handler execution starts inside a promise so a synchronous throw also reaches the sanitized error handler and slot cleanup. Slots remain occupied until handler work settles, including after client disconnect, to avoid admitting replacement work while upstream work is still running. Rate rejection sends HTTP 429; active-handler rejection sends HTTP 503. Per-IP and shared-window rejections include a bounded `Retry-After` duration. Counters are process-local and reset on restart; multiple replicas require shared enforcement.

These controls are not provider or cost budgets. A single planner request can issue multiple upstream calls. Existing provider control declarations in `NightSkyDependencies` do not demonstrate runtime enforcement by themselves.

## Offline evidence

Command: `node --import tsx --test tests/operations/health.test.ts tests/operations/load-smoke.test.ts tests/mcp/route-body.test.ts`.

Windows local result: six tests passed, zero failed. Health checks cover local readiness success, failure redaction, no-store and explicit liveness. Existing route checks cover malformed/oversized bodies, unexpected hosts and rate-rejection slot retention. Bounded load uses only MCP initialize requests, never provider traffic: 20 requests in five waves, concurrency four, shared window ceiling eight. It verifies eight successes, twelve expected 429 responses and admission after the window resets. One local sample: 158 ms total, 127 requests/second including intentional rejection, p50 4 ms, p95 135 ms, process RSS 157,294,592 bytes, zero unexpected errors. Timing is diagnostic, not an assertion or SLA, and includes client/test overhead; it is not representative of provider-backed tools or loaded runtime indexes.

Existing offline MET/NOAA provider fixture suites also passed: 17 tests, zero failed (`node --import tsx --test tests/providers/weather/metNorway.test.ts tests/providers/aurora/noaaSwpc.test.ts`). They cover timeout/unavailable, stale cache on throttling, cache reuse, conditional refresh and missing/out-of-horizon data without real upstream traffic.

## Linux and CI review

Read-only review of `.github/workflows/nightsky-v1-checks.yml` confirms Ubuntu and Windows Node 24 jobs running locked dependency installation, aggregate tests, TypeScript and build. A separate Ubuntu job installs the pinned Python OSM requirements and runs importer unit tests. Workflow permissions are `contents: read`.

Local discovery found WSL's `docker-desktop` distribution; `docker info --format '{{.OSType}}'` returned `linux`, and an existing `node:lts-trixie-slim` image is available. Root integration owns bounded Linux container checks and records their actual result separately. No GitHub Actions execution is claimed here.

## Remaining exposure gates

- Measure with all selected runtime indexes and fixture providers on the selected 2 CPU / 4 GB staging target: request mix, peak memory, p50/p95 latency, throughput, errors, disk headroom and rollback. Tune limits with headroom from that evidence.
- Enforce global and per-provider call/cost ceilings, bounded provider concurrency, request coalescing, cache size limits and upstream backoff/circuit breakers. MET's rate spacing and provider timeout/cache behavior are useful but do not establish all those controls. MET fallback cache is now capped at 128 LRU entries (not bytes); NOAA cold-cache parallel calls can still duplicate upstream work.
- Fetch and JSON-body awaits now share an enforced deadline, including abort-ignoring promises; six safety tests cover unavailable/stale fallback and eviction. Synchronous JSON parsing cannot be preempted; response-byte caps remain open.
- Complete staging Inspector, privacy logging, production artifact readiness, provider failure and rollback checks before promotion.

No staging deployment, upstream request, purchase, commit or push was performed by this reliability work.

## Integration follow-up

Delayed fixture tool concurrency/recovery is tested. Final aggregate suite: 165 tests on Windows and Linux. Linux clean install, typecheck, build, production prune/audit and production MCP smoke pass; production audit has zero findings. GitHub workflow includes production smoke and the Python XML system dependency. No target-host capacity is claimed.
