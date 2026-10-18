# V1 API-only release profile — 18 October 2026

This implements the [owner's API/search-only scope](v1-api-only-scope-20261018.md) in offline operator preflight. It is a proposed release selection, not production activation or admission. No provider request, private configuration/ledger read, download, deployment or source activation occurred.

## Explicit release contract

Set `profile: "api-only-v1"` separately on `releases.current` and `releases.rollback` in the operator JSON. Both releases declare `discovery.mode: "api"`, selected providers and configuration/policy/budget evidence. Current runtime explicitly selects `NIGHTSKY_DISCOVERY_MODE=api`. Full tools remain available; `NIGHTSKY_MCP_TOOL_MODE=full` retains the identifying MET contact requirement.

Only an explicitly profiled release waives mandatory local history inventory and the old unconditional API-history admission finding. An omitted profile retains the prior full/legacy requirements. A legacy rollback still needs its own complete geography/history inventory. Unknown profile values fail strict schema validation.

The API-only profile rejects local geography/history artifact kinds assigned to that release. For current runtime it also rejects configured local geography/history artifact paths/pins and API-history cache/admission settings with `API_ONLY_PROFILE_CONFLICT`. This profile deliberately represents numerical history as unavailable. Future optional-history activation requires its own reviewed profile/resource/admission contract; declaring this profile cannot certify that route. Dormant fixture tests and implementations remain available in the repository.

Quota declarations, one-process ownership, provider evidence, weather admission, host/proxy security, release identity, artifact integrity/closure and resource/owner evidence remain enforced. An `offline-pass` always reports `hostChecksPerformed=false`, `deploymentReady=false`, `officialAccepted=false`. Evidence strings are operator declarations; preflight cannot verify live account entitlement, licence compliance or hosting.

## Proposed exact source manifest

This is the enabled role proposal from the [source profile](v1-api-source-profile-20261018.md), subject to the finite admission conditions in [API readiness](v1-api-readiness-20261018.md). It is not a runnable environment file and does not assert admission from keys.

| Source | Proposed enabled free role | Remaining public release evidence |
| --- | --- | --- |
| Geoapify | Core names, candidate search and selected Place Details `details,details.full_geometry`; owner Free 3,000 credits/day | Exact selected geometry and rendered Geoapify/OSM credits; retain 200/hour, 1,000/day application credits and shared consumed accounting scope. |
| MET Norway | Core Locationforecast 2.0 `/complete`, keyless | Real identifying contact, CC BY credit/change notice, coordinate precision, expiry/conditional-cache and traffic controls in actual deployment. |
| WeatherAPI | Core `/v1/forecast.json`, `days=3`, `aqi=no`, `alerts=no` | Post-24-October Free account confirmation; credit/warning and 15-minute cache ceiling; existing 60/hour, 1,000/day, 20,000/month ceilings. |
| OpenWeather | Core Free `/data/2.5/forecast`, `cnt=40`, metric | Official logo/rendered credit acceptance and ODbL structured derivative/normalization-method offer; cache disabled; existing 30/hour, 300/day, 5,000/month ceilings. No One Call. |
| DarkSkySites | Core latest zenith light pollution only | Adjacent linked rendered credit and actual dedicated consumed project ledger; 30,000/month plus ten starts/second; retain point/model/date/quality. |
| NOAA SWPC | Core keyless short-horizon aurora grid | Existing validity, source time, bounded cache and uncertainty disclosure; grid probability does not establish visual visibility. |
| Local Astronomy Engine | Primary supported deterministic Sun/Moon/planet calculations | Preserve finite calculation domains and claim limits; no external provider key needed. |
| Public Universe | Unadmitted in the current proposed executable profile; reviewed BSC5P/OpenNGC starters are a future restricted enrichment role | Current provider-level admission exposes broader features: implement explicit feature restriction before subset admission, or keep whole provider unadmitted until all exposed rights resolve. Require selected OpenNGC/live lineage and composed credits acceptance; retain exact original-source licence/modification notices and dedicated 20/hour, 100/day consumed ledger. |

GeoNames, 7Timer, AstronomyAPI, Dark Sky Planner, DONKI and JPL stay optional and gated as recorded in API readiness; key existence activates none. Public Universe solar/exoplanet/meteor/approach rights and structured credits remain concrete feature gates. No history, OSM extraction, raw ERA5 acquisition or owned catalogue is required. Host AI search is a host capability, not an invented backend API or a quota bypass.

The actual nonsecret deployment manifest still needs selected/admitted features, exact retained evidence and existing consumed ledger scopes. Publisher/hosting/privacy/support inputs and assembled/native acceptance remain separate release gates. Useful partial plans must disclose unavailable enrichment without losing supported astronomy or forecasts.

## Offline verification

Three new regressions first failed with `CONFIG_SCHEMA_INVALID` before profile support. After implementation, all 32 operator-preflight tests passed with a workspace-local temporary directory. Initial default Windows sandbox temporary-directory execution hit `EPERM` rename failures in two preexisting synthetic publisher tests; moving only test temporary files into the workspace resolved both. No provider traffic is used by this suite. Existing registration of `tests/operations/operator-preflight.test.ts` needs no new shared-suite import.
