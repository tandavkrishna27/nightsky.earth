# V1 API/search-only scope — owner decision, 18 October 2026

The owner explicitly clarified: “we are not doing any downloads or osm or anything only apis … fine for v1”, then approved the three-lane answer-quality/API-readiness/local-acceptance wave.

## Current V1 contract

- Use configured, permitted free APIs and the host AI's own search capabilities. API responses remain subject to existing request/body/quota controls; this is not a claim that network responses contain no bytes.
- No bulk datasets, raw ERA5 preparation, direct OSM extraction, owned global spot catalogue, local geography acquisition or SQL database is required for V1.
- Providers may use OSM internally. Preserve their Geoapify/OSM credits; “no OSM extraction” does not remove underlying attribution obligations.
- Numerical historical-cloud context is optional/unavailable where there is no suitable approved API response. No historical baseline acquisition, artifact preparation or scientific method admission is a V1 launch dependency.
- Long-range answers distinguish deterministic astronomy/event timing, source-qualified seasonal context and forecasts outside their supported horizon. Do not fill unavailable historical numbers, present climate as a future-night forecast, or imply an API response exists when it does not.
- Keep all available supported event evidence and bounded local calculations; their finite domains and source limits remain explicit. This decision does not certify every celestial event, global spot, forecast source or client.

## Superseded requirements and unchanged boundaries

Earlier records asking for a complete numerical historical baseline or an explicit future historical-method choice **before V1 launch** are superseded by this owner decision. Original ticket9 is deferred by scope, not implemented or scientifically accepted. Optional history implementation and retained fixtures may remain dormant; no deletion, activation or acquisition follows. Original ticket18 remains the separate website workstream. Historical decision documents are retained as dated evidence rather than silently erased.

The previous response naming NightSky.earth as maintenance owner remains confirmed. This scope decision does not approve a new meteor model, invent missing activity seasons, establish publisher legal identity, or authorize source/account/ledger changes. Event/target scientific claims, permitted API features/credits, actual hosting and publication gates still need their own evidence.

Offline regression tests for dormant legacy OSM/ERA5 code may remain in the shared repository/CI. They use retained synthetic fixtures and are not dataset acquisition, V1 runtime dependencies or a renewed bulk-build plan. No files or datasets are deleted in this wave.

## Implementation routing

The release profile uses explicit API discovery and no local geography/history artifacts. Existing local deterministic astronomy remains valid. Disabled/unavailable source results are honest outcomes; preserve useful results from other sources. The [three-lane plan](../superpowers/plans/2026-10-18-v1-api-only-acceptance.md) and current tracker reconcile the remaining local versus release-dependent work under this contract.
