# Free API research and cleanup plan

Updated 17 October 2026. This is the consolidated research/design record for the owner-approved API-first V1. It advances source selection; it does not claim adapters are implemented, providers fully admitted, or original tickets complete. No new downloads, provider jobs, account changes, deletion, or deployment were performed for this research.

## Evidence and recommendation

Three primary-source investigations cover the candidates, authentication, free-service policies, attribution, scientific limits and remaining checks:

- [Location, region, POI and timezone research](api-location-source-research-20261017.md).
- [Weather, history and atmospheric research](api-weather-history-research-20261017.md).
- [Astronomy, events, satellites, darkness and terrain research](api-sky-source-research-20261017.md).

Free data, free hosted capacity and open-source software are different. A free-to-users product is not automatically noncommercial. The shortlist below is recommended, not a claim of unlimited global service. Integrate useful roles, rather than every available API. Keep named alternatives independent and show disagreement; never rotate providers/accounts to evade quotas.

| Capability | Recommended or evaluated source | V1 disposition / remaining gate |
| --- | --- | --- |
| Names, countries/states, gazetteer identity | GeoNames web services | Recommended adapter; free username, attribution and shared quota control; verify HTTPS/endpoints and deployed behavior |
| Nearby and region-based observing candidates | Geoapify Places + Geocoding Free | Recommended adapter; free server-side key and attribution; bounded category queries, exact region support and access unknowns; no exhaustive inventory promise |
| Selected-site timezone | GeoNames timezone; Geoapify named-zone evidence where present | Validate actual coordinates and IANA zone; region center/UTC offset cannot substitute |
| Optional name lookup | Photon public demo | Experiment only; no production availability commitment |
| Identity/context enrichment | Wikidata / Wikipedia Geosearch | Optional later enrichment; separate text/media licenses and identifying client |
| Host web search and official access pages | Host tools where exposed | Supplement only; no assumption every client has search or location; source text untrusted; no blanket scraping permission |
| Near-term clouds, wind, humidity, fog, precipitation | Existing MET Norway | Retain; identify client, cache by upstream metadata, field-level availability and shared limits |
| Independent weather / model comparison | Open-Meteo forecast; direct ECMWF/NOAA sources | Open-Meteo conditional on hosted noncommercial eligibility. Direct model files need separate bounded processing; no admitted equivalent fallback yet |
| Historical hourly cloud baseline | CDS ERA5 point time-series / ARCO | Priority feasibility route; avoid global archive. Confirm current contract, queue/limits, full period and bounded resource cost; not an instant forecast API |
| Alternate historical JSON | Open-Meteo ERA5 archive | Conditional noncommercial hosting and weighted-call budget; pin ERA5 rather than changing model blend |
| Historical validation/context | NCEI station observations; NASA POWER | Optional evidence; station gaps and POWER's 2001 hourly start prevent treating them as equivalent 1991–2020 global baseline |
| Seeing/transparency | 7Timer ASTRO | Conditional noncommercial experimental forecast; categories/model age explicit; not admitted required source |
| Haze/aerosol | CAMS through Open-Meteo Air Quality | Conditional hosted terms; AOD is a partial transparency factor, not seeing or complete visibility |
| Sun/Moon/planets, darkness, ordinary calculated events | Existing Astronomy Engine | Retain local calculation; no API call needed; provenance and method semantics remain |
| Aurora and space weather | Existing NOAA SWPC; optional NASA DONKI | Retain SWPC; admit extra products individually by cadence/schema; DONKI needs keyed quota if enabled |
| Comets/asteroids and close approaches | JPL Horizons / SBDB / CAD | Candidate extensions; serialize shared requests and cache, validate object identity and brightness assumptions before adding support |
| Meteor showers / eclipse reference verification | Reviewed small records, IMO/NASA reference publications | No universal free event API established. Exact supported years/radiants/rights remain explicit original-ticket gates |
| Satellite passes | CelesTrak elements + licensed local propagator | Candidate extension; element caching, modern formats, stale epochs and visibility calculations required; N2YO/Space-Track alternatives need separate admission |
| Terrain horizon | PVGIS printhorizon | Promising optional pilot; check coverage/reuse, convert azimuth convention; terrain excludes trees/buildings |
| Point elevation | Open Topo Data | Optional bounded source; not a complete horizon; no pooled OpenTopography free key |
| Numerical darkness / Bortle | No admitted general free hosted source | Preserve unavailable state. Black Marble/World Atlas are data products with ingestion/interpretation gates; don't infer Bortle from radiance or scrape map tiles |
| Certified dark-sky locations | Official DarkSky place pages | Reference links; no admitted reusable global API or assumption of nighttime entry permission |
| Maps / imagery | NASA GIBS and separately admitted map services | Website/map work remains separate; imagery is not numerical sky-brightness evidence |

Public Nominatim and public Overpass are excluded from the default application backend after reviewing operator policies. EOG automated access is not assumed free. A source listed above is not an instruction to implement it or enlarge V1 automatically; new capabilities must map to the original event/journey requirements.

## What must be implemented, in order

The [regroom plan](../superpowers/plans/2026-10-17-api-first-v1-regroom.md) remains the executable authority. Its A–H labels are slices of the original tickets, not new headline tickets.

1. **A: close provider admission.** Use GeoNames + Geoapify as the design shortlist. Specify fixed HTTPS endpoints, permitted fields, cache policy, provider identities, attribution, account-wide limits, timeout/byte bounds, and a free-capacity stop. Resolve unusual redistribution uses before enabling them. Record deployment as one shared limiter/single instance until distributed quota accounting exists. Do not create accounts or expose keys in chat.
2. **B: freeze source-neutral selection.** Decouple selected points, identity, freshness, timezone and calculation from mandatory local GeoNames/catalogue revisions. Preserve explicit unknowns and stale-selection rejection.
3. **C and E in parallel:** implement admitted discovery adapters and update five skills/host-capability guidance. Preserve combined origins/regions, exclusions, distance bands, category constraints and deterministic bounded results. Report unsupported combinations rather than silently simplifying them.
4. **H and original event work in parallel:** evaluate exact historical point-series access and finish supported event coverage/rights. History is still required for a feasibility decision; optional forecasts/monthly means do not close it. The earlier retained CDS test is evidence to reuse, not a reason to start duplicate jobs.
5. **D then F:** integrate selection into planning and make runtime/preflight/configuration mode-specific. API mode must start and plan without local geography files. Preserve optional catalogue integrity checks and useful regression tests.
6. **G / S3:** measure actual configured adapters with separately permitted bounded live requests, plus offline failure/limit tests. Record memory, latency, quotas, cache, concurrency and restart behavior. Fixtures alone cannot establish provider quality.
7. **S4:** assembled journeys, owner questions, final audit and package freeze. Claude stays deferred. Deployment/publication remain later authorized steps.

Multiple APIs improve coverage only when their semantics and permitted uses match. A region-query failure must not silently turn into a city-center search. Distinguish unavailable, not configured, quota exhausted, partial coverage, unsupported query and no results. All outputs carry provider, fetched/valid time, source identity, units, attribution and relevant uncertainty.

## Cleanup plan and dependencies

This section plans cleanup; it does not execute it. Earlier automatic deletion was rejected by execution policy before any file was removed. Do not bypass that rejection. The owner's manual guide remains the current route for those raw files; verify their existence again before reporting a new total.

| Area | Planned action | When / preserve |
| --- | --- | --- |
| 48 inventoried raw OSM, boundaries, GeoNames archive and ERA5 files | Remove only exact listed raw bodies using the [manual guide](manual-dataset-cleanup-20261017.md); last inventory 1,863,767,351 bytes (~1.86 GB) | Owner authorized; deletion not confirmed. Keep request manifests, hashes, reports and evidence. No 95 GB planet file was downloaded |
| Required `.data/geonames/cities500.json.gz` | Keep until replacement API-mode runtime and rollback handling are tested | Current code still relies on it; not part of raw cleanup list |
| Synthetic scale bodies and derived catalogues | Produce fresh bounded exact-path/size manifest; classify disposable bodies separately from evidence | After dependency audit; preserve `preserved-metadata-20261017`, small fixtures and measurement receipts. Do not delete whole `.data` or `.cache` trees |
| Bulk acquisition executors/builders | Retain as optional/deferred code; remove mandatory launch links/default invocations | No bulk build prerequisite in V1. Existing regression tests remain useful; deletion of whole modules is not necessary |
| Runtime/preflight environment | Replace unconditional GeoNames/OSM/climate artifact gates with source-mode configuration | Atomic with D/F implementation and tests; configured artifacts still need integrity checks |
| Legacy scripts/CI | Add API fixture/no-local-geography smoke; retain useful OSM/ERA5 tests as optional adapter regression coverage | Do not make CI require real API keys, provider calls, data jobs or huge downloads |
| Docs and trackers | Current API decision and regroom plan override archived acquisition waves; fix active links/config examples as code changes | Preserve history as evidence, not executable instructions; retain original 27 ticket IDs/counts |
| Credentials, dependencies and Git/worktrees | Preserve; inspect only when needed | Never delete `.cdsapirc`, API credentials, virtual environments, lockfiles or working trees as dataset cleanup |
| New runtime caches | Bounded TTL/entries/bytes with permitted retention, deduplication and clear invalidation | No global dataset or database. Small derived history summaries may be useful only under explicit retention design; quota accounting must survive or conservatively handle restarts |

The database dependencies of the separate website are not evidence that the plugin needs a database, and must not be removed blindly. Downloaded raw data is distinct from tiny reference inputs, optional derived summaries and ephemeral API caches.

## Status and next evidence

Original ticket accounting remains **12 Done / 9 Partial / 6 Not started = 27**. Research improves source confidence and identifies replacement work; it closes no implementation ticket. Current code still uses local geography artifacts. Next deliverable is the completed admission contract, then API selection/adapters and mode-aware runtime—not another planet download.

Open decisions are concrete: free GeoNames/Geoapify account configuration; hosted noncommercial eligibility if Open-Meteo/7Timer are desired; current CDS point-history contract and permitted bounded measurements; exact event/light-pollution source rights and supported coverage. No API in this research is a verified unlimited free substitute for all data requirements.
