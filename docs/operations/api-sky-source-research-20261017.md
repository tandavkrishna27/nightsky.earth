# Sky, space weather, satellites, darkness, and terrain sources

Research date: 2026-10-17. Official provider documentation and primary research only. Documentation browsing only: no dataset downloads, accounts, API keys, or implementation changes. Existing Astronomy Engine, NOAA aurora, and supported meteor records are the assumed baseline supplied in the task; this document does not audit their implementation.

## Recommendation

Keep routine astronomy local. Expand NOAA space-weather context, evaluate JPL small-body ephemerides, and pilot PVGIS terrain horizons. Add satellites only with a shared orbital-element cache and a local propagator. Treat light-pollution rasters as a separate ingestion project with licensing and scientific interpretation work. A no-charge upstream does not remove NightSky's compute, storage, bandwidth, monitoring, and maintenance costs.

| Candidate | Actual delivery model | Free-service fit | Suggested priority |
| --- | --- | --- | --- |
| Astronomy Engine | MIT local calculation library | No upstream requests; own compute | Retain first |
| NOAA SWPC | Public JSON/text/image feeds | Strong, with product-specific freshness checks | Extend existing integration |
| JPL Horizons / SBDB / CAD | Public query APIs | Strong if requests are serialized and cached | Small-body discovery and details |
| PVGIS printhorizon | Public terrain calculation API | Promising; no registration, coverage caveats | Terrain pilot |
| CelesTrak | Orbital-element feeds through query endpoints | Strong for cached small satellite sets | Satellite pilot |
| Space-Track | Authenticated authoritative API | Useful optional backend; account and usage rules | Later |
| N2YO | Keyed hosted prediction API, limited free tier | Easy prototype, constrained shared capacity | Optional adapter |
| NASA eclipse catalogs / IMO calendar | Published tables, files, editorial references | Reference inputs; not live event APIs | Curated provenance |
| NASA Black Marble / World Atlas | Scientific raster products | Free data can still require substantial hosting | Separate project |
| Open Topo Data | Open-source server and limited public API | Public service suits small use; own host costs | Elevation fallback |
| OpenTopography | Keyed DEM/point APIs | Free key unsuitable as pooled public-MCP backend | User key or paid agreement |

## Local astronomy and JPL

**Astronomy Engine:** its official project provides Sun/Moon/planet positions, phases, rise/set, eclipses, transits, conjunctions, oppositions, and coordinate transformations under MIT. These are calculations rather than external observations or forecasts. Retain this path for global routine observing windows; preserve version and assumptions in output. It does not supply live comet activity, satellite elements, cloud conditions, or meteor-outburst forecasts. [Official repository](https://github.com/cosinekitty/astronomy).

**Horizons:** an actual GET query API (also a separate file/POST interface) supports observer ephemerides and geographic observing coordinates. It is appropriate for precise comet/asteroid positions and observability, with explicit object identity, observer, time range, and output quantities. Do not interpret a successful HTTP response alone as success: payloads can contain errors. [Horizons API](https://ssd-api.jpl.nasa.gov/doc/horizons.html), [system manual](https://ssd.jpl.nasa.gov/horizons/manual.html).

**SBDB:** use object/designation searches for orbital and physical metadata; use SBDB Query for filtered catalogs rather than repeated wildcard lookups. **CAD:** close-approach records are candidate discovery data, not evidence that an object is visually impressive. Follow up with an observer ephemeris and brightness/geometry context. [SBDB](https://ssd-api.jpl.nasa.gov/doc/sbdb.html), [SBDB Query](https://ssd-api.jpl.nasa.gov/doc/sbdb_query.html), [CAD](https://ssd-api.jpl.nasa.gov/doc/cad.html).

**JPL access rules:** one request at a time, no simultaneous requests; cache and avoid redundant polling; use a valid application-specific User-Agent including version and contact; back off on errors and rate limits. Direct website embedding is prohibited by NASA CORS policy. Check response versions. There is no numeric unlimited quota or availability guarantee. Put this behind a server-side queue shared across MCP callers, and retain cached answers with age. [SSD API fair-use policy](https://ssd-api.jpl.nasa.gov/doc/).

## Aurora and space weather

**NOAA SWPC:** public data-service directories expose products, JSON, text, and images; NCEI holds long-term archives. Expand existing aurora data with planetary Kp, solar-wind context, alerts, and the three-day outlook only after defining each product's timestamp, cadence, and missing-data behavior. No key or numeric request quota is stated on the reviewed data-access page; that is not an unlimited-service commitment. [Data access](https://swpc-drupal.woc.noaa.gov/content/data-access), [JSON directory listing](https://services.swpc.noaa.gov/json/).

The aurora product is a near-term model, not a long-range location-specific promise. Keep model time separate from fetch time, distinguish hemispheres, and combine with darkness, clouds, and horizon constraints. The NOAA product URL redirected to spaceweather.gov during research, so retain awareness of domain migrations. [Aurora product documentation](https://www.spaceweather.gov/products/aurora-30-minute-forecast). NOAA also publishes service-change notices; a 2026 notice changes several solar-wind data formats, reinforcing the need for schema checks. [Official change notice](https://www.weather.gov/media/notification/pdf_2026/scn26-21_Data_Format_Changes_Impacting_SWPC_Products.pdf).

**NASA DONKI:** a real API for CME, flare, geomagnetic-storm and other event records/notifications. Useful explanatory context, with overlap with SWPC. It is not a replacement for a local aurora visibility forecast. NASA API defaults are 1,000 requests/hour per registered key across api.nasa.gov services; DEMO_KEY is only 30/hour and 50/day per IP. These are service defaults and may vary. Do not apply these quotas to JPL's separately governed SSD APIs. [NASA API catalog](https://api.nasa.gov/), [authentication and quotas](https://api.nasa.gov/assets/html/authentication.html).

## Eclipses and meteor showers

**NASA eclipse catalogs:** authoritative published catalogs, maps, path tables, and Besselian elements, rather than a documented general location/date REST API. Use them for references and validation of local calculations. Greatest-eclipse catalog circumstances are not the user's local circumstances. NASA SVS additionally publishes event-specific GIS and JSON files, which do not imply an API for arbitrary years. [GSFC solar catalog](https://eclipse.gsfc.nasa.gov/SEcat5/SE2001-2100.html), [SVS event data example](https://svs.gsfc.nasa.gov/5073/).

**IMO:** the International Meteor Organization's annual calendar is a freely readable publication and evolving working list, not a documented hosted event API. Maintain annual source/version provenance and allow later forecast corrections; ZHR is not an observer's expected count. An explicit broad redistribution license was not established in the reviewed official material. Do not treat public PDF access as permission to bulk republish its tables or prose. Note that imo.org is the unrelated International Maritime Organization; its policies cannot establish meteor-calendar rights. [Official 2026 calendar](https://imo.net/files/meteor-shower/cal2026.pdf).

**AMS:** its website has a calendar and explanatory material, but its official terms reserve copyright and require prior written permission for reproduction/distribution of protected material; image hotlinking is prohibited. Keep reference links and independently maintained supported facts until the intended reuse is resolved. No public general-purpose meteor-calendar API contract was found. [AMS terms](https://www.amsmeteors.org/legal/), [calendar context on AMS home page](https://www.amsmeteors.org/).

No authoritative free global meteor-outburst forecasting API was established. Continue explicit supported-event coverage rather than synthesizing unsupported annual events from generic recurrence assumptions.

## Satellites

**CelesTrak:** use GP queries with explicit JSON/CSV or OMM-compatible output; current documentation says CSV became the default in May 2026. TLE's five-digit catalog limitation is now an active issue, so do not design a new integration around TLE alone. Fetch only needed groups/objects, once per update; GP and SupGP guidance is no more frequently than two hours. Error storms can trigger blocks, including 50 HTTP 301/403/404 errors within two hours. CelesTrak supplies elements, not a ready visual-pass forecast. [GP formats and limits](https://celestrak.org/NORAD/documentation/gp-data-formats.php), [usage policy](https://celestrak.org/usage-policy.php).

Recommended implementation direction: cache a small relevant set, propagate locally using a suitable SGP4 implementation, compute observer altitude/azimuth, darkness and Earth shadow, and expose element epoch. Audit the chosen propagator's license and OMM support separately. A predicted pass does not guarantee brightness or visibility. Broad redistribution terms for all CelesTrak value-added data were not established by the reviewed usage page; do not infer an open-source data license from public access.

**Space-Track:** authenticated REST access; remain below 30 requests/minute and 300/hour, with stricter product frequencies (GP once/hour, historical files downloaded once and retained). Basic SSA redistribution has blanket approval conditioned on appropriate citation, but this does not remove account agreement obligations or necessarily cover specialized products. Useful if direct authoritative access is operationally justified; avoid shared credentials in clients. [Official documentation, usage rules, and agreement](https://www.space-track.org/documentation).

**N2YO:** genuine hosted positions and visual/radio-pass API; account-generated API key required. Hourly limits are 1,000 TLE and positions transactions, and 100 each for visualpasses, radiopasses, and above. Visual passes support up to ten days. Unknown magnitude uses sentinel 100000, which must not be shown as a real magnitude. Do not rotate keys to bypass limits. Broad commercial/resale/redistribution rights remain to be resolved before a public proxy; the API page alone is not a permissive data license. [Official API documentation](https://www.n2yo.com/api/).

## Terrain and horizon

**PVGIS:** free public API without registration; v5.3 printhorizon returns JSON/CSV horizon profiles. The documented limit is 30 requests/second/IP and browser AJAX access is prohibited. Use a server-side adapter and persistent geographic cache. The official site now advertises v6 beta, so pin a documented stable endpoint rather than following an unversioned default. [API documentation](https://joint-research-centre.ec.europa.eu/photovoltaic-geographical-information-system-pvgis/using-pvgis-5/api-non-interactive-service_en), [PVGIS overview](https://joint-research-centre.ec.europa.eu/photovoltaic-geographical-information-system-pvgis_en).

The horizon uses roughly 90m terrain and 48 directions, omitting nearby trees/buildings. Output azimuth uses 0=south, 90=west, -90=east; convert explicitly to the astronomy convention. This is a terrain screen, not an assurance of an unobstructed observing site. Exact geographic edge coverage and reuse terms for horizon output should be confirmed before claiming global availability. [Horizon definition](https://joint-research-centre.ec.europa.eu/photovoltaic-geographical-information-system-pvgis/using-pvgis-5/pvgis-5-tools/horizon-profile_en).

**Open Topo Data:** open-source elevation server with a public API limited to 100 points/request, one call/second, 1,000/day. Self-hosting is supported, but raster storage and operations are NightSky costs, and each dataset has coverage/licensing constraints. Point elevation alone does not provide a horizon; deriving one requires surrounding terrain samples and geometry. [Provider documentation](https://www.opentopodata.org/), [API](https://www.opentopodata.org/api/).

**OpenTopography:** distinguish the global DEM download API from its newer point-elevation API. Free API keys have stated limits of 50 calls/day for nonacademics or 200/day for academics; commercial software integration requires Enterprise access. Keys cannot be embedded in a service that lets third parties bypass one-user-one-key. Consequently, a shared free key is not an acceptable foundation for public MCP terrain queries. Underlying open data and hosted-service permission are separate. [Developer rules](https://opentopography.org/developers), [point API announcement](https://opentopography.org/blog/new-point-elevation-api-opentopography), [subscription terms](https://opentopography.org/about/subscriptions).

## Darkness, light pollution, and imagery

**NASA Black Marble:** scientific nighttime-light rasters with quality flags and product-specific temporal aggregation. Earthdata/LAADS access and authentication require a dedicated ingestion design. These are upward radiance products; translating them directly to Bortle class or zenith sky brightness is not scientifically justified. Prefer a clearly labeled radiance context layer until a validated skyglow model is available. [NASA Collection 2 user guide](https://viirsland.gsfc.nasa.gov/PDF/BlackMarbleUserGuide_Collection2.0.pdf), [Earthdata authentication](https://urs.earthdata.nasa.gov/documentation).

**World Atlas:** a published modeled artificial sky-luminance raster is closer to the observing question than raw night lights, but its vintage and atmospheric assumptions must be explicit. Confirm the exact raster's distribution license and citation before packaging. A paper's availability is not proof that every hosted raster mirror is licensed for redistribution. [Original research](https://doi.org/10.1126/sciadv.1600377).

**NASA GIBS:** genuine free interoperable imagery APIs, including WMS/WMTS, useful for map context and source previews. Rendered imagery is not a calibrated numerical replacement for original scientific raster values; select a documented layer and preserve imagery date. [Official GIBS documentation](https://nasa-gibs.github.io/gibs-api-docs/gis-usage/), [NASA overview](https://ntrs.nasa.gov/api/citations/20180008507/downloads/20180008507.pdf).

**EOG VIIRS:** do not repeat old claims that automated global access is wholly free. Its registration documentation says OpenID programmatic access became subscriber-only on June 1, 2026. The product documentation asks for EOG credit and relevant citations; exact product licensing and redistribution still require review. [Current access rules](https://eogdata.mines.edu/products/register/), [VNL products](https://eogdata.mines.edu/products/vnl/).

**lightpollutionmap.info:** useful reference website, not an established unrestricted backend API. Its help identifies NASA Black Marble as its VIIRS source since June 2025. Underlying data credits do not grant permission to copy the site's tiles, derived layers, or query endpoints. Obtain documented service permission or work directly with licensed upstream rasters. [Official help](https://www.lightpollutionmap.info/help.html).

**DarkSky International:** official place pages are certification references, not established globally reusable API records. No public API contract or bulk catalog redistribution license was established here. Certification also does not prove current entry permission, opening hours, weather, or site safety. Use official links and separately sourced access details. [Official places FAQ](https://darksky.org/what-we-do/international-dark-sky-places/dark-sky-places-faq/), [terms](https://darksky.org/about/legal/terms-of-use/0/).

## Decisions still required

1. Expected shared request volume and hosting budget; upstream free quotas cannot establish operating cost.
2. Meteor-table and dark-sky-place redistribution permission for the exact fields and update process.
3. Satellite propagator selection, license, OMM handling, and stale-element thresholds.
4. PVGIS horizon coverage/reuse confirmation and comparison against representative mountain, coastal, and polar sites.
5. Specific Black Marble/World Atlas product, license, raster size, ingestion/authentication method, storage/egress estimate, and validation methodology.
6. Per-source attribution, valid-time versus fetch-time fields, cache duration, backoff, schema validation, and unavailable-data behavior.

Recommendations above are engineering judgments from the cited documentation. No live endpoint acceptance test, license negotiation, or worldwide coverage validation was performed.
