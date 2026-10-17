# Runtime data model — API-first V1

Updated 17 October 2026 after the [owner decision](api-search-discovery-v1-decision.md). This table distinguishes existing code from the intended architecture.

| Capability | Existing implementation | Intended V1 / remaining change |
| --- | --- | --- |
| Forecast/clouds | On-demand MET Norway adapter, requires identifying User-Agent | Keep bounded calls/cache; evaluate additional suitable free providers with separate labelled results |
| Aurora | On-demand NOAA adapter | Keep source freshness, forecast limitations and bounded requests |
| Sun/Moon/planet geometry | Local Astronomy Engine calculations | Preserve; no bulk map data needed |
| Named-place lookup | Local GeoNames index, required gzip currently retained | Add suitable on-demand location API; preserve ambiguity and timezone validation; no undeclared raw GPS/address expansion |
| Region/nearby candidate discovery | Local OSM/global catalogue adapters | Replace mandatory artifact dependency with bounded API discovery and optional host search; explicit coverage/access limitations |
| Selected-site planning | Candidate identity/revision/display-timezone checks tied to local providers | Support validated provider-sourced candidates with trustworthy coordinates, source identity and timezone |
| Historical cloud statistics | Prepared ERA5 summaries/releases; no proved on-demand baseline route | Evaluate free historical API and implement only with equivalent period/quality/timezone/missingness semantics. No automatic deferral or bulk acquisition |
| Maintained event references | Small reviewed files plus calculated events | Keep supported content; suitable APIs may supplement after source validation; no universal all-events claim |

The MCP backend remains useful even when the host model has search: it validates and combines structured results. Host search is not assumed available and does not automatically establish coordinates, timezone, access or source correctness. Use API fallback or an honest unavailable state with a useful next action.

No runtime database does not mean zero files: code, small references, settings and bounded caches remain. Large raw source archives are not deployed. Deferred catalogue builders remain optional engineering assets, not startup dependencies. Measure the actual enabled service under S3. Prior data-pipeline measurements remain historical evidence only.
