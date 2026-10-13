# OSM and historical climate feasibility — 13 October 2026

## Decision

The no-database serving path is viable for bounded prebuilt artifacts, but **global OSM coverage and historical climate are not enabled or proven**. The existing downloaded India extract was inspected by file metadata only. No regional/planet import, new large download, paid compute, signup, deployment or publication occurred. Candidate discovery and months-ahead historical context remain V1 gates; omission from a public launch needs the owner's explicit scope decision.

## Measured evidence

Windows workstation, Python 3.14, osmium 4.3.1 (isolated `.data/osm/venv`, cached Windows wheel), Node 24.14.0. These are workstation observations, not Hetzner results.

| Measurement | Result |
|---|---|
| Existing `.data/osm/india-latest.osm.pbf` | 1,709,857,118 bytes (1.59 GiB); prior source-spikes record publisher checksum verification on 11 October; checksum not repeated here |
| Python importer suite | 3 passed in 0.079 s; initial run failed because osmium was absent, then passed after local isolated install |
| Fixture import | 756-byte XML → 2 candidates / 718-byte JSON; SHA-256 `9c3f2c9fcae9f47573a3e0a8df1a67ffbf396759abd73886eb0a51cb7d93a1fd` |
| 20 fixture-only imports | p50 19.52 ms / p95 23.00 ms; process peak working set 36,773,888 bytes (35.1 MiB), includes Python/osmium |
| Candidate search/loader tests | 17 passed, including injected/load validation rejection, immutable artifact reuse, oversized-artifact rejection and source/vintage behavior |
| Synthetic 100,000-row search | 14,488,405-byte JSON; first query including validation 91.50 ms; 30 warm queries p50 23.04 ms / p95 25.41 ms; process peak RSS 204,046,336 bytes (194.6 MiB), includes generator, original and validated records and tsx |

Reproduce with `.data/osm/venv/Scripts/python.exe -m unittest discover -s tests/osm -v`, `.data/osm/venv/Scripts/python.exe scripts/osm/benchmark_fixture.py`, and `node --import tsx scripts/osm/benchmark_query.ts`. The latter is a synthetic lattice around a fixed query, not representative geographic density, production concurrency or a real coverage benchmark. There is no regional source-object count, candidate retention rate, import peak disk/RSS or global-scale extrapolation in this record.

## OSM build and serving path

The importer retains named parks, viewpoints, protected areas, campgrounds and beaches, source element identity, rounded representative coordinates and limited tag-completeness metadata. It writes deterministic compact JSON atomically. Its disk location index (`dense_file_array`) and multipolygon area processing still require source geometry passes; disk-backed does not mean cheap. All candidate rows remain in a Python dictionary until serialization. Full India processing is not justified by the two-row fixture measurement.

Queries now validate/snapshot an injected or loaded index once and reuse frozen rows. Category filtering precedes distance calculation; only nearby matching rows get temporary distance records. Startup still reads/parses/validates full JSON, and warm search still scans O(N) rows and sorts all local matches. The 512 MiB hard file limit is a rejection guard, **not an approved 4 GB host artifact budget**; its error now directs operators to defer search or build a smaller measured flat-file artifact, without suggesting a database. A malformed/oversized configured file still fails startup rather than being silently ignored.

Next build: choose a small named region, record URL/vintage/checksum, use a separate workstation build workspace with disk/time ceilings, measure source and retained counts, peak scratch space, process RSS, geometry failures and final artifact bytes. Tag-filter before expensive geometry where correctness permits; retain needed referenced nodes/ways for geometry and relation handling. Do not substitute public Overpass/Nominatim as global bulk infrastructure.

For broader coverage, use versioned spatial tile files plus a small manifest (bounding cells, counts, bytes/checksums, source/vintage/rights). A request selects only tiles intersecting its radius, with bounded concurrent loads and a capped in-process cache. Account for antimeridian/polar queries and deduplicate features spanning tiles; avoid changing coordinates into misleading points inside a protected area. Deploy only the compact artifact, with atomic manifest switch and previous-version rollback. This is a design proposal, not implemented coverage. Measure cold/warm/concurrent queries and total server RSS alongside GeoNames and providers on the 2 vCPU/4 GB host before enabling it.

Representative vertex averages are not guaranteed interior points, entrances or accessible observing sites. Non-area relations may be omitted by the importer. Names/tags are untrusted, mapping completeness differs by country, and extract timestamps cannot prove night entry, permissions, closures, safety or darkness. Preserve attribution and source links. ODbL classification, attribution presentation, derivative database share-alike and any public database offer need a publication decision for the exact artifact/transforms; flat files do not remove these obligations. [OSM copyright and license](https://www.openstreetmap.org/copyright).

## ERA5 access and compact aggregate proposal

Official catalog checked 13 October 2026: ERA5 hourly single levels provides global atmospheric fields on a 0.25° grid, from 1940, with CC-BY licensing and DOI `10.24381/cds.adbb2d47`. Use exact accepted dataset terms and attribution in the artifact manifest. CDS API setup requires account login, a personal token and manual dataset terms acceptance. No credentials were inspected, account created, terms accepted or ERA5 data downloaded. The free source has account and processing requirements; request queue time and practical limits remain unmeasured. [ERA5 catalog](https://cds.climate.copernicus.eu/datasets/reanalysis-era5-single-levels?tab=overview), [official CDS API setup](https://cds.climate.copernicus.eu/how-to-api).

First proposed sample: total cloud cover at one named grid cell, all hourly samples in a single month, with exact units/missing-value checks and UTC timestamps. Then evaluate a stated history window (for example completed 1991–2020) and count valid samples below a declared threshold, grouped by month and UTC hour. Store both count and denominator, not a rounded probability alone. The query's local time/darkness window must select applicable UTC bins; a monthly all-day average cannot represent observing-night conditions. Hourly ratios are not independent-night clear-sky probabilities; do not multiply adjacent hourly ratios into a whole-night probability.

**Calculated uncompressed payload estimates — no ERA5 sample has measured these sizes:** a regular grid including both poles is 1,440 × 721 = 1,038,240 cells. Twelve months × 24 UTC hours × two uint32 counts = 2,304 bytes/cell, or 2,392,104,960 bytes (2.23 GiB) at full 0.25° coverage. The same representation at a *derived* 1° grid is 360 × 181 × 2,304 = 150,128,640 bytes (143.2 MiB); at 10,000 selected cells it is 23,040,000 bytes (22.0 MiB). Monthly-only counts are 96 bytes/cell, 99,671,040 bytes globally (95.1 MiB), but lose hour/night specificity. Binary headers, coverage masks, indexes, checksums and compression are excluded; JSON would be larger. These sizes do not measure runtime RSS or suitability of coarser spatial resolution.

Thirty years approximated as 30 × 365.25 × 24 = 262,980 hours require roughly 1.092 TB decimal per float32 variable on that full grid, excluding container overhead. One cell/month (31 days) is only 2,976 raw value bytes; one cell/thirty years about 1.05 MB per variable. Request batching, netCDF/GRIB packaging and interpolation can alter download volume. No full-grid history should be downloaded or retained on the serving host.

Build off-host in bounded cell/time batches, stream aggregates, retain small verification samples, record threshold/period/grid/units/missing counts/software version/checksums, then publish tiled binary counts with source manifest. Update on an explicit climatology revision schedule rather than each request; historical context must state the period and distinguish it from near-term forecasts. Cloud fields are reanalysis context, not site sensors, and terrain/local cloud variability and changing climate limit their meaning. Coarser-grid aggregation needs its own scientific choice and validation; it cannot be silently labeled native 0.25° ERA5.

## Outstanding gates and owner decisions

1. Select named OSM pilot coverage and artifact rights/publication disposition; provide a processing ceiling before any regional import or paid worker.
2. Authorize/configure free CDS account and manually accept exact dataset terms; choose sample cell, variables, history period and cloud threshold.
3. Demonstrate a real ERA5 sample/statistic and regional OSM artifact, then measure request/RSS/disk/rollback on the target small host with all enabled indexes.
4. Decide public V1 scope if either candidate discovery or historical context cannot meet these gates. No global coverage, probability calibration or production fit is established by this wave.

## Cross-platform importer follow-up

The three importer fixtures pass on Windows with the isolated pinned environment and on Linux Python 3.12.15 in a disposable 2 CPU / 4 GB container. Linux also needs libexpat1; the reproducible script and CI install it. No regional data was imported. The synthetic query benchmark above is a workstation measurement, not a target-host benchmark.

## Owner inputs for lane 3

**CDS setup update:** The owner created and activated the CDS profile. After explicit action-time approval, ERA5 hourly single-level CC BY 4.0 terms were accepted through the signed-in download form and its visible `Accepted` state verified. The personalized API configuration was copied privately to the browser clipboard, with no token printed or added to this repository. Local `.cdsapirc` configuration and a sample retrieval are still pending. This supersedes the earlier account-not-created note below.

**Owner reply received:** MET contact is `nightsky.earth2026@gmail.com`; use application identification `NightSky.earth/0.1 nightsky.earth2026@gmail.com`. Validation locations are Hanle, Kodaikanal (owner spelling: kodai kannal) and Munnar. These choices do not authorize interpreting mapped features as verified public night access or processing the entire India extract. CDS account does not yet exist; setup instructions requested. No private token has been supplied. MET live sampling and regional artifact checks remain to be performed.

| Input | Required from owner | Engineering work after input |
|---|---|---|
| MET identification | Real public contact email or contact-page URL for the application User-Agent. No API key. | Configure MET_NORWAY_USER_AGENT; retrieve a small representative global sample and record actual horizons, fields and expiry. Fixture identities are never used for live calls. |
| Spot validation | A known city/region and one or two previously visited places. | Select a suitable small source extract, propose download/scratch/time ceilings, compare known places, record provenance/checksum and benchmark. This validates the pipeline; the product remains global. |
| ERA5 access | Free CDS account, manual dataset-terms acceptance and locally configured personal token. Never share the token in chat or the repository. | Start one cell/month of hourly total cloud cover; check units, UTC and missing samples before proposing history period, threshold and derived artifact. |

For CDS: register/login, open the ERA5 hourly single-level dataset download form and manually accept its terms. Follow the [official API setup](https://cds.climate.copernicus.eu/how-to-api) for local credential configuration. Confirm setup is complete without sharing credentials. Account-level terms acceptance must be performed by the owner.

Meteor-source permission/replacement investigation is engineering research, not an owner account prerequisite. External permission requests require explicit authorization. No paid processing is planned; any paid proposal needs an owner-selected spending ceiling. Large local processing also waits for stated disk/time bounds.


## First real ERA5 sample — 13 October 2026

The owner-authorized Hanle January 2025 hourly total-cloud-cover request completed successfully. It downloaded 80,862 bytes, with 744 consecutive hourly UTC instants and four 0.25-degree grid cells (2,976 finite values, no missing samples). All eight local validation checks pass. The exact request, raw file/hash, versions and limitations are recorded in source-spikes.md; raw/report artifacts are in Git-ignored .data/era5. Local API configuration remains pending, but browser-based authenticated retrieval worked. This supersedes the earlier no-real-sample notes: access is demonstrated, while historical-statistic construction and global/runtime fit remain open.


## Latest source access state

MET owner-contact sampling now succeeds at eight representative points; raw source fields, missing variables, horizons and warm cache are recorded in source-spikes.md. ERA5 hourly January samples now cover Hanle and Kodaikanal/Munnar, with eight local validation checks passing on each. These supersede earlier live-source/account/sample gaps; they do not close statistical/global artifact/hosting gaps. Hanle named-place resolution is absent from cities500 and remains a separate coverage issue. No persistent database or bulk global build was added.
