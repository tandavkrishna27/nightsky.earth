# API history completion — local implementation handoff, 2026-10-17

Coordinator integration update: the optional provider is now wired into API-mode standalone startup, with strict paired configuration, legacy-mode conflict rejection and a pending operator admission/resource gate. Four lane suites and the runtime suite are registered. The original handoff below records the lane delivery; see [assembled verification](parallel-completion-run-20261017.md). No acquisition has been enabled.

Branch: `codex/api-history-completion`, based on
`bc8de008bc60d6b47f8422cf15787584d16e2698`. The delivery chat records the reviewed
local commit SHA. No push, live history request, credential inspection, dataset
acquisition, deployment, tracker edit or combined-suite registration occurred.

## Delivered behavior

`server/providers/climate/apiHistoryPlan.ts` and the stdout-only
`scripts/era5/plan-api-history.ts` plan the exact 1991–2020 observing-night
baseline, with UTC padding 1990-12-30 through 2021-01-02 inclusive: 263088 hours.
The existing 14-day planner and retained pilot contract are preserved. New marked
ranges support 1–1827 days; the operator worker admits at most 30 ranges.

| Partition choice | HTTP requests | Source-estimated weighted credits | Per-call integer reservations |
| --- | ---: | ---: | ---: |
| Legacy 14 days | 783 | 783 | 783 |
| Default 366 days | 30 | 78.3 | 90 |
| Explicit 1827 days | 6 | 78.3 | 84 |

These are offline estimates from pinned source, not measured deployed debits,
provider range guarantees, response sizes, elapsed time or permission to execute.
Fourteen days is an accounting reference, not a verified maximum date span.
No stable provider maximum days/bytes was found in the examined official path.

The point maps using an explicit quarter-degree round/clamp index policy. Pole
longitude columns are preserved; +180 maps to 179.75. Requests query the canonical
cell, reject returned-cell drift, use ERA5 `cloud_cover`, GMT/Unix timestamps,
`cell_selection=nearest`, and `elevation=nan`. Results retain the selected point,
IANA display zone, source revision and reported haversine displacement. This does
not attest the deployed service's off-grid selection behavior.

`apiHistoryJobs.ts` implements one explicit operator build, sequential calls,
durable integer quota reservations, request intents, expiry/deadline checks, no
retries, and strict decode/aggregate/cache validation. Its bounds are 2 MiB per
response, 16 MiB cumulative input, 60 seconds per request, 300 seconds cooperative
aggregation and 15 minutes per build. The worker returns at its transport deadline
even if an injected transport ignores abort; such an unfinished attempt remains
uncertain and must not be treated as cancelled provider work. Synchronous CPU
work is cooperatively checked, not preempted by a separate process.

`apiHistoryStore.ts` uses a dedicated absolute, unlinked directory, owned single
worker lease, serialized mutations, bounded opened-handle reads and atomic file
publication. Completion journal persistence precedes summary publication. It
permits at most 64 summaries and 64 journals, each with payload caps (256 KiB and
64 KiB); a directory entry bound also applies. A full cache stops acquisition.
There is no automatic eviction, data deletion or stale-lock takeover. Capacity
maintenance and uncertain/stale ownership require explicit operator review.
Raw responses remain bounded transient inputs, not a retained raw archive.

`apiHistoryProvider.ts` serves only completed validated summaries through the
existing `climateProvider` seam. Lookup never fetches, queues or rebuilds. Cache
identity binds canonical cell, IANA zone, baseline, source/method, mapping,
astronomy version and Node/ICU/tz rules. Original selected place/revision is not a
shared cell-cache key. Cache records additionally bind exact acquisition plan,
receipts, raw response hashes and independent sufficient statistics.

The existing reducer still supplies independent expected hourly darkness clocks,
local-noon night assignment, UTC bins, null/absent missingness and original wire
precision. Partition statistics are never averaged. Numerical baseline serving
requires an explicit hosted-method admission record. The `available` label also
requires existing 90% coverage, 27 represented years and 80%-per-year guards in
returned bins and independent monthly/year denominators; admitted `partial`
results retain numeric samples with their coverage limitations. No-darkness omits numerical cloud values. Hosted
whole-percent processing remains distinct from native fractional ERA5; deployed
scientific revision and native threshold equivalence remain unverified.

## Exact coordinator integration

No `server/plugin.ts`, `server/mcp/registerTools.ts`, planner or runtime wiring was
edited by this lane. The configured server does **not** use this provider yet.
`apiHistoryConfiguration.ts` supplies the small optional wiring helper:

```ts
import { createConfiguredApiHistoryProvider } from "./providers/climate/apiHistoryConfiguration";

// In createConfiguredNightSkyPluginApp's API discovery branch:
const climateProvider = await createConfiguredApiHistoryProvider({
  NIGHTSKY_API_HISTORY_CACHE_DIRECTORY: process.env.NIGHTSKY_API_HISTORY_CACHE_DIRECTORY,
  NIGHTSKY_API_HISTORY_ADMISSION: process.env.NIGHTSKY_API_HISTORY_ADMISSION,
});
// Include climateProvider in createNightSkyPluginApp({ ...services, ... }).
```

Both settings absent returns `undefined`. Partial, empty, oversized, relative or
linked-directory configuration fails startup. Admission is bounded strict JSON:
sourceId `open-meteo-hosted-era5-cloud-percent-v1`, methodVersion
`open-meteo-quantized-dark-cloud-v1`, `policyRevision` a 64-hex digest identifying
the actual reviewed policy, and `acceptsQuantizationAndUnverifiedRevision: true`.
No real admission record or environment setting was created here. Set neither
until source-use eligibility and the distinct hosted method are actually accepted.

`NightSkyDependencies.climateProvider.getClimatology(placeId, month, point)` is
already passed the resolved API point by `registerTools.ts`'s `climateFor` API
branch. A configured `plannerServices.getClimatology` takes precedence. No handler
change is needed. Preserve the selected API sourceRevision/catalogueRevision and
display zone: parsing `{placeId, month}` alone rejects API selection references.
New tests exercise real hashed `place:v1:api:geonames/geoapify` forms and MCP direct
history plus composed planner lookup through this seam.

The worker is a separately invoked operator function, **not** a server background
worker, queue, scheduled job or request handler:

```ts
const plan = planApiHistory(selectedPoint, displayTimeZone, { rangeDays: 1827 });
// Only after fresh separate authority for this exact plan:
await runApiHistoryBuild(plan, { store, quota, transport, approval });
```

`approval` must bind decision `approved-api-history-build`, exact `planSha256`,
unique 64-hex `executionId`, UTC expiry and sufficient integer credit ceiling.
Use `createApiHistoryTransport()` only in that separately authorized execution.
It restricts host/path, refuses redirects/compression, streams with a byte cap
and checks declared length. No execution approval or live transport invocation
was made in this task. `plan-api-history.ts` has no execute option.

For a later worker installation, add one stable `open-meteo` account policy to
the existing shared durable quota system and preserve verified budget checkpoint
initialization and lifecycle cleanup. A conservative application history slice
could cap 500/hour, 1000/day and 30000/month; these are proposed application caps,
not provider allowances or approved spend. The hourly cap also stays below the
published 600/minute limit without adding a new minute scheduler. Account for
other use of the same upstream account; do not reset checkpoint state, revive old
allowances or reserve one credit merely because a request is one GET.

Public disclosure should retain the current preview limitation and add: “Hosted
baseline preparation is an optional disabled operator path. Runtime continues
retained-preview/local availability until separately configured, source-policy
admitted and live baseline validated.” This lane has acquired no full baseline.

## Validation and suite imports

Meaningful red→green checks covered the missing modules, unleased/concurrent
store writes, API selection revision loss, completion-persistence publication
ordering, optional configuration and an abort-ignoring transport deadline.
Synthetic sufficient-statistics fixtures explicitly do not represent measured
1991–2020 history. Real reducer tests compare one 28-day range with two legacy
14-day ranges: bins/year rows/period agree, receipt identities remain distinct.

Focused validation: 40 tests across the four new suites, existing history
contract/serving and MCP climate/API planning; another 25 existing pilot,
statistics-contract, reducer and retained-measurement tests. Main project, ERA5
and standalone strict new-test type checks passed with `--incremental false`.
The independent reviewer reported no remaining material findings, including final
deadline and partition deltas. Coordinator owns combined
tests and CI. Add only these four imports to `tests/all.test.ts`:

```ts
import "./providers/climate/api-history-plan.test";
import "./providers/climate/api-history-store.test";
import "./providers/climate/api-history-jobs.test";
import "./providers/climate/api-history-provider.test";
```

## Remaining gates and next executable step

1. Coordinator wires the optional provider and test imports, reviews source-use
   eligibility/admission and keeps settings absent by default. Free/ad-free/no
   affiliate product intent does not alone settle every commercial/promotional
   use term. No second interchangeable free quantitative 1991–2020 source was
   verified; NASA POWER hourly begins 2001 and Meteostat condition/model-fill
   semantics do not supply this quantitative cloud baseline.
2. After **new explicit live authority**, the smallest useful check is one
   off-grid point, leap year 1992, one ERA5 hourly cloud variable, GMT/Unix time:
   one GET, no retry, 60 seconds, 2 MiB response and 4 MiB total retained evidence;
   8784 expected hours, estimated 2.614286 credits, reserve 3. Retain exact request,
   raw SHA/bytes, returned cell/units, timings and quota receipt. This checks annual
   shape/size and one mapping example, not a full baseline, poles or dateline.
3. Separately authorize a full-point build/resource measurement only if that
   shape check passes. Measure actual body sizes, peak memory, aggregation CPU,
   elapsed time, provider debits and 30-year coverage. Stop at every configured
   bound. Failed/incomplete execution IDs require review and new authority; no
   automatic retry/reconstruction. Decide bounded cache maintenance and retained
   raw evidence policy before production reliance.

## Primary evidence

- [Historical API documentation](https://open-meteo.com/en/docs/historical-weather-api),
  [pricing/allowances](https://open-meteo.com/en/pricing),
  [terms](https://open-meteo.com/en/terms).
- Pinned source commit `01ceed5b028fb6ac19794c3310aed5a4f7aa6d4a`:
  [date validation](https://github.com/open-meteo/open-meteo/blob/01ceed5b028fb6ac19794c3310aed5a4f7aa6d4a/Sources/App/Controllers/ForecastapiController.swift#L195),
  [query time ranges](https://github.com/open-meteo/open-meteo/blob/01ceed5b028fb6ac19794c3310aed5a4f7aa6d4a/Sources/App/Helper/ForecastapiQuery.swift#L406),
  [weighted accounting](https://github.com/open-meteo/open-meteo/blob/01ceed5b028fb6ac19794c3310aed5a4f7aa6d4a/Sources/App/Helper/Writer/ForecastApiResult.swift#L230),
  [limits/error accounting](https://github.com/open-meteo/open-meteo/blob/01ceed5b028fb6ac19794c3310aed5a4f7aa6d4a/Sources/App/Helper/Vapor/ApiKeyManager.swift#L170),
  [grid index](https://github.com/open-meteo/open-meteo/blob/01ceed5b028fb6ac19794c3310aed5a4f7aa6d4a/Sources/App/Domains/RegularGrid.swift#L61),
  [cell selection](https://github.com/open-meteo/open-meteo/blob/01ceed5b028fb6ac19794c3310aed5a4f7aa6d4a/Sources/App/Domains/Gridable.swift#L143),
  [cloud storage scale](https://github.com/open-meteo/open-meteo/blob/01ceed5b028fb6ac19794c3310aed5a4f7aa6d4a/Sources/App/Era5/Era5Variables.swift#L102).
  Source review supports the application contract; it is not deployed-service
  attestation or a scientific revision receipt.
