# Offline time-series and boundary preparation â€” 16 October 2026

## Delivered

Two parallel implementation lanes, separate task reviews and a fresh integrated review completed. No important findings remain in the reviewed code.

| Lane | Implemented | Still required |
| --- | --- | --- |
| Historical weather | Browser-verified date-list request, fixed plan/receipt identity, offline transport tests, shared bounded executor state machine and isolated authenticated API/unauthenticated asset sessions. CLI is plan-only. | Separately authorized bounded response sample, scientific format validation/decoder, production mapping and historical baseline. |
| Boundaries | Exact Natural Earth v5.1.1 source policy, local pinned GeoJSON ingestion, explicit provider mappings, geometry/preparation/membership integration, conservative unknowns, bounded filesystem/output checks and atomic completion. | Actual source bodies and SHA-256s, reviewed provider mappings, real topology/resource acceptance and production selection. |

Details: [weather adapter](era5-timeseries-adapter.md), [boundary adapter](natural-earth-offline-ingestion.md), [implementation plan](../superpowers/plans/2026-10-16-offline-timeseries-boundaries.md).

## Verification

- Full ERA5 offline suite: **89 passed**.
- Focused boundary/preparation suite: **28 passed**, including 11 new ingestion tests.
- All TypeScript configurations, website/service build, plugin packaging, Codex/Claude package verification and standalone full/resolver-only runtime checks passed.
- Full Node suite: **850 total / 849 passed / one existing skip / zero failures**.
- Exact-commit CI is checked after push; see the branch run for this delivery.

The runtime checks used no external provider requests. No new dataset, credential read, product-model test, installation, runtime artifact promotion or deployment occurred. Existing public metadata was copied into reproducible source evidence.

## Ticket and acquisition boundary

Original acceptance totals remain **12 Done / 9 Partial / 6 Not started**. This is adapter engineering evidence, not completion of actual global data or release acceptance. The browser example establishes request serialization only; an unvalidated raw response cannot become a historical statistic. Generalized administrative geometry cannot establish observing-place access or extraction completeness.

Next: review one concrete bounded sample/acquisition allowance, inspect actual returned data, then measure actual production construction and serving. No blanket continuation or global download is authorized here.
