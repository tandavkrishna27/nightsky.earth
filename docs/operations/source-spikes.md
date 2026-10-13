# NightSky V1 source spikes

**Status:** Draft measurement record, 11 October 2026. This file separates facts verified from official source docs, live samples still needed, and owner-gated work. Do not turn estimates into claims without recording method and evidence.

## Small-host operating model (decision recorded 11 October 2026)

The intended first production host is a small shared Hetzner VM (initial target: 2 vCPU / 4 GB RAM), subject to deployment and load checks. Keep this host on request-time work: the stateless Streamable HTTP MCP endpoint, bounded API requests, small deterministic astronomy calculations, and serving compact prebuilt data files. The owner confirmed no database for plugin V1. Do not add PostgreSQL, SQLite, a separate data service, persistent user state, or a durable provider-response cache. In-process caches may clear on restart. Do not run planet-scale source downloads, PBF extraction, full re-indexes, or large ERA5/VIIRS processing in the production request path or assume the VM can build them safely.

Use a separate, repeatable data-build job for any bulky source that survives V1's scope gate. Initially this can run on the developer workstation or a temporary/CI worker with adequate disk and time; it produces a versioned, checksummed flat-file artifact with source vintage, license/attribution metadata, row counts, and coverage manifest. Deploy the artifact with the server and switch to it atomically; retain the previous known-good file for rollback. No recurring paid build worker or object-storage service is assumed until the owner approves a budget.

For initial operation, load only compact GeoNames city data at startup if memory measurements show safe headroom. Keep OSM candidate discovery unavailable or explicitly partial until the regional scale spike yields a measured flat-file index size and query design. A global OSM PBF/index is not required to host the other MCP/API tools. If a useful OSM index cannot be served as a compact file within safe host memory/disk and refresh limits, defer candidate search in V1; do not solve that by introducing a database. Keep source downloads and build scratch space off the root disk used by the running service.

Operational checks before public exposure: verify peak RSS with all enabled indexes loaded, free disk during deploy/rollback, cold and warm latency, concurrent requests, request timeout behavior, artifact rollback, and provider rate-limit/cache behavior. Start with conservative request concurrency and response/request budgets. Keep health checks, logs with location/query data redacted, and a recovery path. These measurements, not nominal VM specifications alone, decide whether the chosen shared VM is adequate.

## Summary

| Gate | Current result | Pass state |
|---|---|---|
| 0B OSM scale | India extract downloaded and checksum verified; import stopped before output | No-database path: measure a compact flat-file artifact; if it does not fit the selected host, defer spot search. |
| 0C ERA5 | Product/terms/access route identified; no data account or sample pulled | Pending real sample and reproducible statistic |
| 0D weather/GEFS/SWPC | Official global forecast, US service, GRIB/ensemble and aurora docs reviewed; no representative API payload fixture set yet | Partial research only; data behavior and field availability still need samples |
| 0E VIIRS | Exact VNP46A2 family/meaning/resolution found; no calibrated local sample or bins evaluated | Pending data/sample/quality-mask validation; darkness remains unknown |

## 0B — OSM sample import and scale

**Chosen region:** pending owner selection. This should be a small named geography where the owner can inspect plausible candidates; it is a measurement sample, not the maximum launch geography.

| Measurement | Result |
|---|---|
| Source extract URL, date, provider and checksum | Geofabrik India extract downloaded 11 October 2026; source checksum verified against publisher. This is a sample only, not the chosen product coverage or evidence of global feasibility. |
| Compressed and uncompressed file size | Not measured |
| Total source objects / filtered candidate rows | Import was stopped before completion after the current whole-region scan proved too slow for this workstation run; no candidate index was written. |
| Candidate tags/type allowlist | To be recorded before import |
| Resulting DB/index size | Not measured |
| Import wall time and machine/runtime | Not completed. The first implementation attempt was stopped; do not extrapolate its partial runtime to the production VM. |
| Query p50/p95 and test query count | Not measured |
| One-off processing cost | Not measured; no paid compute was used. Future builds should run outside the small production VM unless a benchmark proves otherwise. Any paid worker requires an approved budget. |
| Refresh interval/work/cost | Not measured |
| Global-scale estimate and method | Not measured; must be a clearly labeled extrapolation from measured source counts/index density |
| ODbL attribution, relation classification and publication plan | See source register; legal classification remains open |

Do not use public Overpass/Nominatim for a bulk import or treat their public endpoints as global production capacity. When selected, use a lawful extract and record attribution/ODbL obligations with the exact schema/transforms. No product/region coverage promise passes until the import is repeatable and query results are measured.

## 0C — ERA5 access and statistic

**Product candidate:** ERA5 hourly single-level reanalysis, Copernicus Climate Data Store DOI `10.24381/cds.adbb2d47`. Official catalog reports global 0.25° atmospheric grid, hourly records from 1940 onward and daily update; licensed CC BY with dataset terms accepted after login. No account was configured and no sample retrieved in this spike.

| Required measurement | Status |
|---|---|
| Requested variables and levels (cloud cover, 2m dew point, wind, etc.) | Need select exact available fields from catalog before request |
| Location, date range, UTC hours, returned grid points | Not measured |
| Request size/download time and retries | Not measured |
| Derived data size and storage/refresh estimate | Not measured |
| API/account/terms acceptance | Account registration and dataset license acceptance required; not performed |
| Statistic | Do not calculate a percentile/probability from monthly means. Candidate is a count/ratio or empirical distribution calculated from enough hourly history at a named grid cell, with a documented cloud threshold and season/time window. Must be evaluated on returned sample first. |
| User language | “Historical ERA5 context”, with period/grid/source and explicit statement that it is not the forecast for a particular night. |

The dataset is updated with a lag and may be revised. Reanalysis is a model/observation synthesis, not a direct site sensor. A 0.25° grid can miss local terrain/cloud variability. Monthly means alone cannot establish percentiles or the probability that a specific future night will be clear.

**Fallback:** no months-ahead climatology in public V1 until the sample yields a reproducible, explainable statistic within approved processing/storage budget. Keep near-term forecast horizon separate.

## 0A — GeoNames named-place index and timezone assignment

The GeoNames gazetteer README reviewed 11 October 2026 documents `cities500.zip` as roughly 200k+ populated places and administrative seats; the rows include a timezone field containing an IANA timezone ID. The same README states CC BY 4.0, allowing reuse with attribution. It also describes the extract as provided as-is. The postal-code datasets are separate and excluded.

The local refresh script downloaded the current public `cities500.zip` and `countryInfo.txt`, validated 236,041 rows, attached country display names, computed a SHA-256 source checksum, and produced an ignored compressed index with source modification time and generated timestamp. The compressed artifact measured 10.4 MiB and the compact JSON payload 34.7 MB. The index is never committed. This is a reproducible local proof, not a production-host import or deployment. Attribution and index vintage are attached to returned results.

**Local lookup measurement:** Windows desktop, Node 24, 11 October 2026. The compact index loaded in 237 ms; process RSS after load was 317 MiB (127 MiB before load in the `tsx` process). Warm full-scan query times were 94 ms for `Pune, India`, 440 ms for `Springfield`, 430 ms for `Tokyo`, and 410 ms for `Reykjavik`. These single-machine readings are not a production latency or host-size promise. Hosting must verify memory headroom; if the selected host cannot comfortably hold the file index, keep named-place resolution unavailable/partial until the file/search design is made small enough within the no-database V1 boundary.

**V1 disposition:** use GeoNames city records and their timezone identifiers for named-place resolution. Do not include timezone polygons in this task. The optional Timezone Boundary Builder data is ODbL-derived from OSM; exact legal treatment and share-alike publication remain outside this city-name resolver. This means V1 does not claim polygon-accurate timezone assignment for arbitrary coordinates or every point in a large municipality. Public observing candidates can inherit a named-place zone until the candidate-map scope decides whether exact boundaries are necessary.

## 0D — forecast and aurora samples

### MET Norway Locationforecast

Current Locationforecast documentation describes forecasts through roughly 9–10 days, with horizon/model and variables varying by region and forecast step. The service requires an identifying real User-Agent, caching using expiry/Last-Modified, request coordinates no more precise than 4 decimal places, and a total app ceiling of 20 requests/second without special agreement. No SLA is offered. Current product documentation describes Nordic short range as MEPS (0–60 hours) with ECMWF medium range, Arctic short range as AROME-Arctic with ECMWF medium range, and global forecasts as ECMWF; do not label the whole service as one independent model source.

| Representative place | Forecast payload / issue time | Cloud layers | Precipitation | Wind | Temp/dewpoint | Horizon/freshness | Result |
|---|---|---|---|---|---|---|---|
| Global points (minimum target: tropical, midlatitude, high latitude; land and ocean-edge) | Not sampled live in this pass; fixture parser covers MET's documented `properties.meta` and `properties.timeseries` shape | Pending live sample | Pending live sample | Pending live sample | Pending live sample | Pending live sample | Gate incomplete |

Implementation spike must use actual owner-controlled application identity, rounded/cache-keyed coordinates, respect `Expires`, and preserve provider issue/valid times. Do not fabricate dew point or cloud layers when missing.

### NOAA/NWS US regional data

Official docs confirm point/grid forecasts are based on US forecast-office grids; alerts are available as public data, with recommended alert polling no more than every 30 seconds. The service requires an identifying User-Agent, is free but has reasonable unpublished rate limits and no promise of service-level availability. No live payload was sampled in this pass.

**Disposition:** optional US-specific forecast/hazard context or fallback, not a global source. Regional NWS coverage does not imply official alert coverage elsewhere.

### NOAA GEFS

NOAA system docs report an ensemble product, around 31 members and ~25 km/0.25° atmospheric resolution, with forecasts to 16 days for most cycles (some product/cycle details differ). Operational files are GRIB2. Downloading/decoding only required fields and preserving issue/valid-time/member identity needs a dedicated technical and budget measurement. NOAA archive docs distinguish publicly hosted recent operational data from archived records; do not assume archive retention is identical across mirrors.

| Spike item | Status |
|---|---|
| Exact currently operational GEFS version/product endpoint | Confirm during implementation; upstream system versions evolve |
| File sizes for selected members/fields/lead times | Not measured |
| GRIB2 decoder and selected field extraction | Not evaluated |
| Issue/valid-time alignment and units | Not evaluated |
| Ensemble spread/calibration suitable for clear-sky comparison | Not evaluated |
| Cache/refresh/storage/compute budget | Not measured |

**Disposition:** optional only. If the spike does not meet explicit latency, accuracy, decoding, storage and owner-approved cost bounds, V1 uses MET as its only general global forecast and discloses model/source limits.

### NOAA SWPC aurora

The current SWPC product page describes OVATION as a short-term location/intensity forecast with a 30–90 minute lead time; it exposes a latest gridded JSON link for both hemispheres. Solar-wind inputs can be unavailable; the product sometimes falls back to Kp with no forecast lead time. This is not a long-range aurora forecast and not a personal sighting probability.

| Sample item | Status |
|---|---|
| Endpoint/JSON field schema and current product version | Fetched live from official `ovation_aurora_latest.json`; `MultiPoint`, `[Longitude, Latitude, Aurora]`, 65,160 coordinate/value tuples; one-degree global longitude/latitude grid |
| Issue and valid intervals | Captured `Observation Time` and `Forecast Time`; current sample 2026-10-11T09:03Z / 09:51Z, matching short 30–90 minute product lead description |
| Grid/hemisphere/latitude interpretation | Global grid includes both hemispheres; live Pune read used nearest cell 74°E, 19°N, value 0; separate Reykjavik grid inspection found nearest 338°E, 64°N, value 0. These are model values, not proof of impossibility or visibility. |
| Attribution, outage, stale behavior | NOAA/SWPC source/product attribution recorded. Parser fixture and live adapter passed; timeout, stale threshold, no-grid and out-of-horizon behavior are tested. Product-specific reuse terms still require Gate 0A review. |

**Disposition:** implemented as a short-horizon tool with a nearest-cell model-index result, no probability conversion, a 2-minute fallback cache capped at 5 minutes, and explicit staleness/out-of-horizon behavior. This sample closes only the SWPC source-shape portion of Gate 0D; MET live samples and GEFS evaluation remain open. [SWPC product](https://www.swpc.noaa.gov/products/aurora-30-minute-forecast), [latest grid JSON](https://services.swpc.noaa.gov/json/ovation_aurora_latest.json).

## 0E — Black Marble / VIIRS radiance proxy

NASA product candidate: SNPP VIIRS Black Marble `VNP46A2`, daily gap-filled lunar BRDF-adjusted nighttime lights, 15 arc-second (about 500m at equator), HDF-EOS5; sister JPSS product `VJ146A2` also exists. Product documentation identifies ground nighttime-light radiance and quality/cloud/snow flags. It does not measure the brightness of the astronomical sky at an observing location.

| Evaluation | Status |
|---|---|
| Exact collection/version/DOI and source file metadata | Version-specific source record still required before download |
| Sample cells for urban edge, rural village, coast, snow/cloud-prone region | Not sampled |
| Quality/mandatory/cloud/snow masks and gap-filled interpretation | Not evaluated |
| Land-only/coastal edge effects | Must be tested; product is primarily land with limited coastal buffer |
| Compare radiance rank against independent sky-quality references | Not performed; no threshold/bin approved |
| User-facing label | If it passes: “satellite-observed ground-light emissions (relative context)” with source/date and no sky-quality implication. Otherwise `unknown`. |

Earthdata access may require a free account/token. Free data does not remove download, preprocessing, storage or refresh cost. Do not label values Bortle, SQM, “dark sky” or sky brightness. No candidate ranking based on this proxy passes until sample quality and usefulness are validated.

## Decisions required to close gates

1. Select the named OSM sample region for Gate 0B.
2. Decide whether to configure/accept a Copernicus CDS account/terms for a small ERA5 sample; do not provide credentials in this document or chat.
3. Approve a separate one-off processing/data-build ceiling if the chosen measurement requires paid compute/storage.
4. Approve a recurring pilot ceiling before host comparisons become a production commitment.
5. Confirm the permanent production hostname and separate staging hostname before Tasks 3B/3C.

No purchase, paid account, paid host, or production deployment has been initiated.



## ERA5 Hanle hourly sample — completed 13 October 2026

Owner authorized January 2025 hourly total cloud cover for a small Hanle box through the signed-in CDS download form. Dataset terms were separately accepted with action-time confirmation. One request was submitted after verifying the generated request: reanalysis, total_cloud_cover, year 2025, month 01, days 01–31, all 24 hours, NetCDF/unarchived, area [33, 78.75, 32.75, 79] in north/west/south/east order. Hanle's public IIA observatory reference lies within this box (https://prints.iiap.res.in/handle/2248/2373). Dataset: https://cds.climate.copernicus.eu/datasets/reanalysis-era5-single-levels ; DOI 10.24381/cds.adbb2d47; CC BY 4.0. Credit Copernicus Climate Change Service/ECMWF for ERA5; NightSky performed the local inspection.

| Measurement | Observed result |
|---|---|
| Request ID | f7b459f1-d2c0-425b-847a-d2a0013e9c4f |
| CDS outcome | Successful; displayed duration 00:01:39; one request only |
| Download bytes | 80,862 (CDS displayed 80.86 KB) |
| Raw sample | .data/era5/hanle-2025-01-total-cloud-cover.nc; original browser download retained in user Downloads |
| SHA-256 | e674bae1ee78a1a7126b5d3470b74298b9dd828efc68282901b8cbebfaaad039 |
| Grid | Latitude 33, 32.75; longitude 78.75, 79; 0.25-degree spacing, four grid cells |
| Temporal coverage | 744 unique, consecutive hourly instants from 2025-01-01T00:00:00Z through 2025-01-31T23:00:00Z |
| Field | tcc / cloud_area_fraction / Total cloud cover, units (0 - 1) |
| Values | 2,976; no masked, non-finite or missing values; observed range 0–1 |
| Metadata | ECMWF institution, CF-1.7, expver 0001, member 0 |
| Validation | Eight checks pass; report .data/era5/hanle-validation.json |

The isolated inspection environment uses netCDF4 1.7.3, numpy 2.5.4, cftime 1.6.6 and certifi 2026.7.22. Exact frozen requirements and the network-free inspection script are in .data/era5. Run `.data/era5/venv/Scripts/python.exe .data/era5/inspect_sample.py .data/era5/hanle-2025-01-total-cloud-cover.nc`. No application code was changed. Local raw data, environment and reports are Git-ignored. No private token was printed or stored in the repository; this browser retrieval did not require local API configuration.

A first UI coordinate edit updated visible textboxes but left the generated API request at the world defaults. Submission stayed disabled while the coordinate widget's Enter action committed the box; the generated request and completed job's recorded area were then checked. No world request was submitted. Browser download succeeded to the ordinary Downloads folder even though the browser automation download-event wait timed out; file size, contents and copied checksum were subsequently verified.

Ruling: inspect actual hourly samples rather than monthly means for this source-access spike — the owner explicitly chose hourly January data, and future threshold counts require actual temporal samples. This closes the access/units/time/grid evidence slice of Gate 0C, not the full historical-statistic or global-scale gate. One month cannot establish seasonal climate or best observing dates. No percentiles, probabilities, night statistics or thresholds are published from this sample.

Remaining: define and validate historical period/UTC-to-local darkness selection, threshold/count/denominator semantics, a reproducible bounded off-host aggregation and serving artifact, and representative samples for the other chosen locations. The four grid cells are modeled reanalysis context, not observatory measurements, local access evidence or a clear-night guarantee. This does not establish target-host memory/disk fit or an operational climatology tool.


## Live MET global source check — 13 October 2026

The owner supplied the public application contact. Eight serialized HTTPS GETs used `NightSky.earth/0.1 nightsky.earth2026@gmail.com`, the existing production weather adapter, an injected shared upstream controller/cache, and an eight-second request deadline. Native runtime proxy support was enabled. No extra source request was made for day-six parsing or outside-horizon checks: these reused each downloaded payload. Warm repeats honored cache expiry with zero additional network calls.

| Sample point | Decoded JSON bytes | Remaining instant horizon at check | Near-term missing fields | Day-six missing fields |
|---|---:|---:|---|---|
| Hanle observatory reference | 60,223 | 221.1 h | precipitationProbability, windGust | precipitationProbability, windGust |
| Kodaikanal, India | 60,278 | 221.1 h | precipitationProbability, windGust | precipitationProbability, windGust |
| Munnar, India | 60,362 | 221.1 h | precipitationProbability, windGust | precipitationProbability, windGust |
| Oslo, Norway | 89,331 | 239.1 h | None of supported fields | windGust |
| Tromso, Norway | 89,457 | 239.1 h | None of supported fields | windGust |
| Quito, Ecuador | 59,997 | 221.1 h | precipitationProbability, windGust | precipitationProbability, windGust |
| Cape Town, South Africa | 60,363 | 221.1 h | precipitationProbability, windGust | precipitationProbability, windGust |
| Sydney, Australia | 60,305 | 221.1 h | precipitationProbability, windGust | precipitationProbability, windGust |

Every sampled point returned HTTP 200 and normalized successfully. Total/low/medium/high cloud fractions, dew point, temperature, relative humidity, wind speed and wind direction were present at every near-term step examined. Global samples supplied no precipitation probability or gusts; Nordic near-term samples supplied both, with gusts absent in day-six output. All remained explicitly missing rather than inferred. Instant cadence changed from one-hour to six-hour steps. One-hour precipitation aggregations disappeared in longer horizons; six-/twelve-hour periods were retained with original period labels. Eight out-of-horizon cases returned the correct state. These validate shape, parsing, missing-data and caching behavior, not meteorological forecast skill.

Payload issue/valid times, header Date/Expires/Last-Modified, units, per-band field and aggregation availability, body hashes and parsed statuses are in `.data/met/live-report.json`; raw normalized JSON snapshots and the reproducible sampler are under `.data/met` and Git-ignored. Weather data: MET Norway Locationforecast 2.0, CC BY 4.0; normalized and reviewed by NightSky.earth. Official documentation: https://api.met.no/doc/locationforecast/datamodel ; terms: https://api.met.no/doc/TermsOfService . This measured snapshot is approximately 9.2 days globally and 10 days at the Nordic points; do not hardcode that as guaranteed future coverage.

Hanle is absent from the current cities500 gazetteer. Its source spike uses a sample-only identifier and public IIA observatory reference coordinates (32.7797 N, 78.9625 E), not a fabricated GeoNames placeId. Kodaikanal, Munnar and other points use the versioned local GeoNames artifact. Named Hanle planning remains a resolver-coverage gap until a permitted authoritative named-place record is added through the reviewed data pipeline.

Remaining: explicit AROME-Arctic/ocean-point coverage, freshness over multiple refresh cycles, real deploy/proxy behavior, accuracy calibration against observations, and source display/UI/host cases. Provider-produced values do not prove local transparency, seeing, darkness, access or safety. The optional GEFS source remains unmeasured and unavailable; the tool must not imply independent-model confirmation. This closes the representative MET baseline source-shape slice of Gate 0D; it does not complete hosting gates.


## ERA5 Kodaikanal–Munnar sample — completed 13 October 2026

A single compact January 2025 request covers both owner-chosen locations. Reused the verified hourly total-cloud-cover/Reanalysis/NetCDF/unarchived options, changed area to [10.25, 77, 10, 77.5] (north/west/south/east), and verified the generated request and successful job before download. Local GeoNames records used for the reference locations: Kodaikanal 10.23925 N, 77.48932 E (1266425) and Munnar 10.08818 N, 77.06239 E (1262463), both inside the box.

| Check | Result |
|---|---|
| CDS result | Successful; displayed processing duration 00:01:19; one combined request |
| Actual file bytes | 84,985 |
| SHA-256 | 6c0ecfdeb31836daaaa2a04e925fe2c60d6a2392bdaf35b0cfff4c728c808167 |
| Grid | Latitude 10/10.25, longitude 77/77.25/77.5: six cells at 0.25-degree spacing |
| Time | All 744 consecutive hourly UTC instants in January 2025 |
| Cloud values | 4,464, all finite, no masked/missing values, fraction units (0 - 1), observed range 0–1 |
| Source metadata | ECMWF, CF-1.7, cloud_area_fraction, expver 0001, member 0 |
| Validation | Eight checks pass; .data/era5/kodaikanal-munnar-validation.json |
| Raw file | .data/era5/kodaikanal-munnar-2025-01-total-cloud-cover.nc |

The request JSON, raw file, inspection environment and report are Git-ignored. Reproduce inspection with `.data/era5/venv/Scripts/python.exe .data/era5/inspect_sample.py .data/era5/kodaikanal-munnar-2025-01-total-cloud-cover.nc kodaikanal-munnar`. The earlier Hanle profile remains supported by the same analytical inspector. Browser downloads use the ordinary user Downloads directory, with the verified file copied into the sample workspace; no account token is stored in this repository.

Together with the Hanle sample, this demonstrates permitted browser retrieval and correct units/grid/hourly parsing at all three chosen places. No seasonal recommendation, trend, forecast accuracy or clear-night probability is claimed from these single-month samples. Historical statistical semantics, multiple years/all months, representative global artifacts and serving-host scale still require work. Coarse grid/model topography is especially relevant at mountainous sites.

## Resolver and planning follow-up — 13 October 2026

The earlier Hanle gazetteer gap is resolved by reviewed GeoNames record 1270426 from the licensed India extract. The earlier observatory-coordinate MET sample remains source-access evidence only; the new Hanle MCP journey uses the actual gazetteer place. See hanle-coverage-wave.md and live-planning-wave.md. Historical statistics are designed in ../superpowers/plans/2026-10-13-nightsky-historical-statistics.md and remain unimplemented.


## Latest bounded evidence — 13 October 2026

Supersedes earlier no-artifact/no-refresh preparation statements: candidate-real-wave.md records the completed 59-node tiny real pilot and two stopped broader scans. climate-tiles.md records the reviewed existing 2025 sample converted to immutable schema2 v3, with no new retrieval or baseline expansion. events-weather-coverage-wave.md records Arctic/ocean sampling and two expiry-respecting conditional HTTP 200 responses at 17:56 UTC, four coverage-wave GETs total. meteor-radiant-feasibility.md records the licensed near-peak model and remaining full-season source gate. Global coverage and selected-host capacity remain open.
