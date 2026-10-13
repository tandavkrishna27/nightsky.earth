# Offline service and weather readiness

Audit date: 2026-10-14. Scope: the local Task 3 and Task 7A acceptance criteria from `docs/superpowers/plans/2026-10-10-nightsky-v1-execution-ready.md`. All source responses below are injected fixtures; actual MCP Streamable HTTP requests run against a loopback server. No public-provider call, deployment, download, account change or secret is required.

## Result and repair

The local service preserves unknown weather, source issue/valid times, separate forecast records and native units through cache hits, revalidation and outages. Expired cached forecasts are explicitly stale during an outage. Cold failures yield unavailable weather; they do not manufacture a forecast. The response also supplies astronomical darkness and Moon context.

A new transport regression first failed because a fresh HTTP 200 response without `Last-Modified` inherited the previous response's validator. This could condition later requests using a validator belonging to different bytes. The MET adapter now retains the old validator only on HTTP 304; replacement bytes without a validator clear it. The regression subsequently passed.

## Task 7A criterion mapping

| Original named criterion | Executable local evidence |
| --- | --- |
| `mapsCloudAndWindFieldsWithUnits` | `tests/providers/weather/metNorway.test.ts`: maps cloud/wind with source units; `tests/mcp/offline-resilience.test.ts`: source fields survive actual transport. |
| `keepsUnavailableFieldsMissing`, `doesNotInventDewPoint` | Provider parser tests and transport assert absent dew point and its missing-field reason. |
| `preservesIssueAndValidTimes` | Parser tests and transport assert `source.issuedAt` and sample `validAt`; precipitation-period tests preserve supported aggregation intervals. |
| `marksStaleForecast` | Transport test keeps an old issue time stale even after successful 304. Revalidation does not rewrite source issue time. |
| `honorsExpiresBeforeRefresh`, `usesLastModifiedForConditionalFetch` | Provider and transport tests verify no pre-expiry refresh, conditional header, 304 reuse/renewed expiry, and correct replacement-validator clearing. |
| `roundsCoordinatesBeforeCacheAndRequest` | Provider coordinate test and transport assert four decimal destination coordinates. These are destination coordinates, not raw assistant location hints. |
| `returnsPartialOn429`, `returnsPartialOnTimeout` | Existing tests return stale cached evidence or unavailable cold evidence, with explicit reasons. `tests/providers/providerSafety.test.ts` proves hanging-body stale fallback and cold timeout; transport proves hard deadline. |
| `warnsOnDeprecated203Product` | Existing MET HTTP 203 deprecation test. |
| `staysBelowApplicationWide20RequestsPerSecond` | `tests/providers/upstreamControls.test.ts`: default 19-per-second MET ceiling cannot be raised by custom configuration; `tests/mcp/provider-controls.test.ts`: direct, composed and aurora calls share the same process budget. |
| `jittersScheduledRefreshes` | Not applicable to the implemented architecture: no scheduler, background refresh, automatic retry or periodic provider polling exists. Refresh is demand driven after expiry. A future scheduler must add jitter and its regression before use. This audit does not claim jitter exists. |
| `rejectsMalformedPayload` | Existing MET malformed schema test; transport verifies invalid JSON is unavailable, not cached, and a subsequent valid response recovers. |
| `returnsOutOfHorizonWithoutForecast` | Existing MET horizon test; `metPeriods.test.ts` distinguishes sparse in-horizon gaps from out-of-horizon and prevents unsupported interpolation. |
| Real MCP provenance/local-night value | Transport asserts source issue/valid times, wind units, unknown fields and forecast steps during darkness. Source timestamps supply freshness; no fabricated retrieval time is added to the model-visible forecast. |

GEFS remains an unavailable conditional enhancement. No second independent model or measured global forecast accuracy is claimed. Separate regional/product field absence is preserved instead of inferred.

## Task 3 control and privacy evidence

Existing transport suites cover initialization, listing, valid calls, invalid arguments, JSON/body/Host rejection, explicit annotations, instructions, output schemas and safe errors. `route-body.test.ts` proves repeated 429 responses do not consume active capacity. `operations/load-smoke.test.ts` proves concurrency admission/recovery and fixed-window rate recovery. Metadata suites prove explicit consent before host-location use, rounded hints, no identifier echo, salted subject-key bounds/pruning, subject-window recovery and IP/global ceilings even when subjects change. The Inspector smoke is a separate root verification step.

Upstream controls bound native response bytes, concurrent operations, start rates, coalesced request bytes and backoff without automatic retries. Timeout tests cover fetch, native/injected body handling and supplementary limiter waits. Native-body cancellation releases capacity. An abort-ignoring operation occupies its bounded slot until it actually settles; transport verifies caller deadline, refusal of another start while occupied, and recovery after settlement. Releasing the slot early would allow unbounded background operations. A permanently stuck transport can exhaust this process's configured capacity and require restart.

The memory cache holds at most 128 MET entries; existing cache-eviction tests prove recent hits survive and old coordinates are evicted. IP and salted subject counters are bounded maps; expired entries can remain idle until reuse or bounded pruning. This is not a timed deletion guarantee. Provider flights are removed when aborted/settled. No durable forecast history or query history is introduced by this repair.

Local application log behavior is documented in `mcp-data-flow-and-logging.md` and verified by the existing request-logging tests. This evidence does not establish edge/proxy/host log redaction or retention. Replicas require a coordinated upstream budget before scaling.

## Local closure and release freeze

Verification during this audit: the full existing aggregate `npm test` completed with 402 tests, 401 passing, zero failures and one Windows fixture symlink skip; `npm run check` passed all three TypeScript configurations. The new transport file was also run directly (six passing tests). Root integration must include this new file in the aggregate and record the final combined suite/Inspector result; these counts describe this audit snapshot, not an immutable final release total.

Task 3/7A local readiness may close after the complete local test suite, typing checks and root Inspector smoke pass. Treat scheduled-refresh jitter as explicitly inapplicable while this demand-driven architecture remains in force. This is a local acceptance decision, not a hosted production approval.

Keep the endpoint local until the original host/budget, controlled staging, publisher/domain, logging/retention, privacy/source-rights, deployment and submission gates are fulfilled. Those gates remain open. Do not infer selected-host capacity, privacy retention, global forecast accuracy or hosted OpenAI compatibility from these offline fixtures.

## Integration-owner verification

The new suites are included in the aggregate and verification scripts in tool type checking. Frozen Windows aggregate: 431 discovered/430 passed/one permission skip; clean Linux: 431 discovered/424 passed/seven artifact/platform skips; zero failures. Fourteen OSM and forty-six ERA5 Python tests passed on both. Type checks, package/review/build/audit/runtime checks and fresh-process artifact rollback passed. Current rehearsal ZIP SHA256: `eb3cecd7b0cd48bad63830c5dce7b52e9fcce9fedf27547add183724bc245cde`; the earlier rehearsal digest above is historical. Actual Inspector listed/called the compiled resolver-only endpoint; it does not establish ChatGPT/Codex/Claude/Gemini account compatibility. Current GitHub acceptance is recorded after push/observation. No deployment or historical downloads.
