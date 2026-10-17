# Weather, cloud history, and atmosphere API research

Research date: 2026-10-17. Scope: official provider documentation only; no data retrievals, jobs, account creation, or endpoint probes. Findings establish documented suitability, not measured service performance. Proposed architecture and scientific cautions below are NightSky recommendations/inferences.

## Recommendation

Keep MET Norway for near-term weather. For the exact 1991–2020 local-darkness cloud baseline, prioritize a bounded evaluation of **CDS ERA5 point time-series / geo-chunked ARCO**. This newer route is specifically designed to avoid fetching full grids. Open-Meteo ERA5 archive is the simpler JSON alternative if NightSky qualifies for its noncommercial hosted tier. Neither path has yet been performance-tested for this product. Optional atmospheric enhancements should remain independently degradable: CAMS aerosol optical depth for haze, and 7Timer ASTRO for explicitly labelled modeled seeing/transparency if its noncommercial terms fit.

There is no verified unlimited, anonymous, production-guaranteed API satisfying every requirement. A product being free to end users does not establish that it qualifies as noncommercial.

## Provider findings

### MET Norway: retain for forecasts

MET's forecast JSON includes total/layer cloud fraction, temperature, humidity, dew point, fog, wind and precipitation fields; actual availability varies by product/time. These are forecast quantities, not a 30-year historical baseline. [Forecast format](https://api.met.no/doc/ForecastJSON).

The service requires meaningful application identification, CC BY attribution, cached responses, respect for `Expires`, and conditional requests using the actual `Last-Modified` value. Coordinates must have at most four decimal places. More than 20 requests/second **per application across all users** requires agreement. It offers no SLA. Use a backend caching proxy with bounded retries and 429 backoff. Keyless access does not remove traffic obligations. [Terms](https://api.met.no/doc/TermsOfService).

### Open-Meteo: strong technical fit, important hosted-use restriction

The historical API exposes hourly total and low/mid/high cloud cover. Explicit ERA5 selection supplies a consistent global 0.25° series from 1940; default model selection can incorporate newer IFS data, so do not use a changing best-match blend for the baseline. ERA5-Land's finer terrain resolution should not be interpreted as independently higher-resolution atmospheric cloud evidence. [Historical API](https://open-meteo.com/en/docs/historical-weather-api).

Free hosted usage is noncommercial only: fewer than 10,000 calls/day, 5,000/hour, 600/minute; the table also lists 300,000/month. Ads, subscriptions, commercial products and promotional uses are examples of commercial use. CC BY 4.0 data permissions and the hosted service restriction are different layers. Derived caching does not make unauthorized hosted access permissible. [Terms](https://open-meteo.com/en/terms).

Historical access on paid hosting requires Professional or higher, not Standard. Requests exceeding two weeks or ten variables count as multiple calls; a 30-year request is not one quota unit. Obtain the provider's calculated charge for the intended request shape before capacity planning. Free hosting has no uptime guarantee. Paid API keys belong on the server. Attribution must credit data and modifications; server code is AGPLv3, so self-hosting has software obligations as well as infrastructure cost. [Pricing and accounting](https://open-meteo.com/en/pricing).

The Climate API supplies daily climate-model outputs, including mean cloud cover, with downscaling/bias correction. It is useful for climate-change scenarios, not reconstruction of which historical hours were dark and clear. Reject it as an interchangeable fallback for an hourly reanalysis baseline. [Climate API](https://open-meteo.com/en/docs/climate-api).

### CDS / ERA5: promising direct point access

The `reanalysis-era5-single-levels-timeseries` catalogue describes global hourly coverage from 1940, 0.25° atmospheric resolution, nearest-grid-point selection, and CSV/NetCDF output. Published in March 2025, it uses storage optimized for long point series and powers ERA Explorer. Its catalogue displays a CC-BY licence. This is materially different from a compulsory global download. [Point time-series catalogue](https://cds.climate.copernicus.eu/datasets/reanalysis-era5-single-levels-timeseries?tab=overview).

The July 30, 2026 ARCO guide explicitly lists `total_cloud_cover` (0–1), cloud-base height and boundary-layer height. It documents geo-chunked Zarr access using a CDS bearer key and limited-area time-series retrievals. CSV has smaller download limits; the time-series service can be disabled/deprecated and has lower operational support than its parent dataset. **Source caveat:** the retrieved guide labels itself an old version; re-check the current guide before implementation. [ARCO product guide, version retrieved](https://confluence.ecmwf.int/pages/viewpage.action?pageId=704944501).

CDS requires an account, personal access token and manual acceptance of dataset terms. The documented clients support job submission; do not assume an immediate ordinary REST response. No fixed application-level numerical quota was verified here. [API setup](https://cds.climate.copernicus.eu/en/how-to-api). The service publishes a queue dashboard, reinforcing the need for asynchronous handling rather than a page request waiting indefinitely. [Live dashboard](https://cds.climate.copernicus.eu/live).

The ordinary ERA5 single-level dataset remains a scientific fallback, with total cloud cover and full historical coverage, but regional extraction/processing is operational work. [Parent dataset](https://cds.climate.copernicus.eu/datasets/reanalysis-era5-single-levels?tab=documentation). Daily statistics aggregate during retrieval; even timezone-shifted daily means cannot preserve arbitrary solar-elevation masks. [Daily statistics](https://cds.climate.copernicus.eu/datasets/derived-era5-single-levels-daily-statistics?tab=overview).

### NASA POWER: useful context, wrong exact baseline

The hourly API starts 2001-01-01, provides hourly means, supports point requests and at most 15 parameters/request. Its default is local solar time in longitude swaths, not civil timezone; use UTC if integrating with astronomical calculations. This alone disqualifies it for the full 1991–2020 hourly requirement. Cloud parameter availability must be checked by temporal service/community rather than assuming a monthly cloud variable is hourly. [Hourly documentation](https://power.larc.nasa.gov/docs/services/api/temporal/hourly/).

POWER climatology/monthly outputs are monthly average/minimum/maximum products; these cannot recover night-hour event frequencies. [Temporal API definitions](https://power.larc.nasa.gov/docs/services/api/temporal/). Sources combine solar satellite/radiative-transfer products and meteorological assimilation models; grid-average elevation may differ substantially from mountain observing sites. [Data FAQ](https://power.larc.nasa.gov/docs/faqs/data/).

NASA's official forum states POWER data are public domain and usable commercially with acknowledgment. That statement is older, so check current terms during admission. [NASA statement](https://forum.earthdata.nasa.gov/viewtopic.php?sid=89ed7c423d72ff727be48ee81e2200da&t=82). No current precise concurrency/day quota was verified; do not invent one. Role: optional coarse solar/meteorological context after variable and terms checks, not baseline substitution.

### NOAA: observations for checks; raw models require work

NCEI ISD/Global Hourly provides hourly/synoptic station observations including cloud and visibility, with records extending back to 1901. Coverage is geographically uneven and station records have breaks. Useful for selected-site comparison, not gap-free arbitrary-coordinate history. Respect cloud reporting conventions, quality flags, station relocation and distance/elevation before comparing a station with a grid cell. [ISD](https://www.ncei.noaa.gov/products/land-based-station/integrated-surface-database).

The CDO v2 API requires a token and caps it at five requests/second and 10,000/day. [CDO API](https://www.ncei.noaa.gov/cdo-web/webservices/v2). NCEI Access Data Service is a distinct REST subset service; do not copy CDO quotas/authentication onto it without verification. [Access Data Service](https://www.ncei.noaa.gov/support/access-data-service-api-user-documentation).

NOMADS exposes operational GFS/GDAS/ensemble model files. GRIB Filter creates regional/variable subsets and asks scripts to wait ten seconds between loop fetches. This is not a ready point-history JSON endpoint. [NOMADS datasets](https://nomads.ncep.noaa.gov/), [filter guidance](https://nomads.ncep.noaa.gov/info.php?page=gribfilter). Treat direct NOAA ingestion as a later engineering option, not a cheap drop-in API. This research did not establish a NOAA on-demand service giving equivalent 1991–2020 global hourly cloud context. Dataset-specific reuse/citation and archival availability require admission checks.

### ECMWF Open Data: forecast fallback only

Current documentation describes 0.25° GRIB2 products including total cloud cover and a rolling archive of the latest twelve runs (approximately two–three days), not a historical baseline. It lists a 500-simultaneous-connection portal limit; that is not an application entitlement. Forecast lead steps vary by run. Use is governed by CC BY 4.0 and ECMWF terms. Direct ingestion needs GRIB decoding, point extraction, caching and run/lead-time metadata. [Open Data](https://www.ecmwf.int/en/forecasts/datasets/open-data).

### Optional haze, transparency and seeing

Open-Meteo Air Quality exposes CAMS global aerosol optical depth at 550 nm. Global source resolution is about 45 km and native time spacing three hours; hourly API output is not independent hourly observation. Its documented global forecast archive begins August 2022 and cannot supply 1991–2020 aerosol history. Credit CAMS and Open-Meteo and apply the same hosted-use restrictions. [Air Quality API](https://open-meteo.com/en/docs/air-quality-api).

7Timer's official ASTRO documentation describes three-day forecasts with cloud, seeing categories in arcseconds and transparency categories in magnitudes per air mass, derived principally from GFS. [ASTRO documentation](https://www.7timer.info/doc.php). Its terms permit free reuse/redistribution only for noncommercial purposes; a numerical quota/SLA was not established. [About and terms](https://www.7timer.info/about.php?lang=en). Consider it an optional experimental model forecast, with stale/missing states and attribution; do not manufacture continuous precision from categories.

## Scientific contract for the history feature

These are proposed product rules, not claims that an upstream API calculates them:

1. Fetch UTC hourly **total cloud** for a bounded point and 1991-01-01 through 2020-12-31, plus any boundary hours needed to construct local nights. Record actual grid coordinates and source/model/version.
2. Compute solar elevation for each timestamp and observing location. Define astronomical darkness explicitly (for example Sun below −18°). Civil clock nighttime and provider `is_day` are not equivalent to this mask. Preserve polar no-darkness as a distinct result.
3. Report mean cloud fraction over qualifying hours separately from the empirical fraction of qualifying hours below a disclosed cloud threshold. A 40% mean cloud fraction is **not** a 60% probability of a clear night.
4. A clear-hour fraction is not a whole-night frequency. If reporting nights with a usable observing window, define required continuous hours and count nights satisfying that rule. Consecutive hours are correlated; do not treat them as independent trials.
5. Publish valid/expected dark-hour counts, missingness and year coverage. Treat thresholds and minimum completeness as versioned product decisions. Do not fill missing history with forecast or monthly means under the same label.
6. State that reanalysis is a grid-scale reconstruction. Mountain valleys, marine layers and local cloud can differ. Cloud fraction does not measure turbulent seeing or full optical transparency. AOD measures aerosol extinction contribution, not the combined effects of cloud, water vapor, skyglow and turbulence.

## Delivery design without a global archive or database

Use one primary provider per output and a common evidence envelope: provider/dataset, units, actual grid, temporal resolution, requested baseline, valid coverage, retrieval time, method version, attribution and failure state. Retrieve only user-requested points; coalesce identical requests; enforce provider-wide budgets. A bounded memory/edge cache and small derived summaries can avoid repeated 30-year work without a global database. If even persistent summaries are disallowed, acknowledge that eviction/restarts force repeated upstream retrieval and increase latency/quota costs.

Thirty baseline years contain 262,992 hourly slots before nighttime filtering. This arithmetic makes payload, decompression and processing budgets necessary even for one variable/point. Serverless request limits may favor an asynchronous task returning pending/unavailable rather than blocking the request. Do not claim measured latency or resource cost until a permitted bounded pilot.

## Admission gates before implementation

- Confirm NightSky's commercial status against Open-Meteo and 7Timer terms; free user access alone is insufficient.
- Check the current ARCO guide, active cloud variable, exact 1991–2020 selection limits, account licence acceptance, attribution wording and any application-specific fair-use constraints.
- In a separately authorized pilot, measure single-point payload size, latency, queue behavior and memory for CDS point series versus Open-Meteo archive. No such pilot was run in this research.
- Verify full period completeness and units, then compare a few contrasting climates/elevations with independent evidence. Select darkness/clear-window definitions explicitly.
- Establish aggregate traffic accounting, maximum concurrent upstream work, retry budgets and bounded cache size. Do not rotate providers or identities to evade restrictions.
- Confirm optional atmosphere variables' coverage and category interpretation. Keep unavailable seeing/transparency explicit; humidity or wind alone cannot be relabelled as either.
