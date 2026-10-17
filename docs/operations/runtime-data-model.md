# Runtime data model — API-first V1

Updated 17 October 2026 after the [owner decision](api-search-discovery-v1-decision.md). This table distinguishes existing code from the intended architecture.

| Capability | Existing implementation | Intended V1 / remaining change |
| --- | --- | --- |
| Forecast/clouds | On-demand MET Norway adapter, requires identifying User-Agent | Keep bounded calls/cache; evaluate additional suitable free providers with separate labelled results |
| Aurora | On-demand NOAA adapter | Keep source freshness, forecast limitations and bounded requests |
| Sun/Moon/planet geometry | Local Astronomy Engine calculations | Preserve; no bulk map data needed |
| Named-place lookup | Opt-in GeoNames/Geoapify API lookup and immutable source selections; legacy index retained | Validate live endpoints/accounts and timezone evidence; host-hint reverse resolution is not admitted in API mode; named-town fallback remains |
| Region/nearby candidate discovery | Opt-in bounded Geoapify radius/own-provider region filters; optional local adapters retained | Validate live coverage and policy; unsupported complex administrative combinations remain explicit; host search optional |
| Selected-site planning | API sourceRevision and legacy catalogueRevision selections reach exact-point calculation | Regression-tested offline; live source quality and assembled owner experience remain gates |
| Historical cloud statistics | Prepared ERA5 summaries/releases; no proved on-demand baseline route | Evaluate free historical API and implement only with equivalent period/quality/timezone/missingness semantics. No automatic deferral or bulk acquisition |
| Maintained event references | Small reviewed files plus calculated events | Keep supported content; suitable APIs may supplement after source validation; no universal all-events claim |

The MCP backend remains useful even when the host model has search: it validates and combines structured results. Host search is not assumed available and does not automatically establish coordinates, timezone, access or source correctness. Use API fallback or an honest unavailable state with a useful next action.

No runtime database does not mean zero files: code, small references, settings and bounded caches remain. Large raw source archives are not deployed. Deferred catalogue builders remain optional engineering assets, not startup dependencies. Measure the actual enabled service under S3. Prior data-pipeline measurements remain historical evidence only.
