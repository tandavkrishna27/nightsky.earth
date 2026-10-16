# CDS time-series contract: 16 October 2026

**Subsequent browser verification:** the owner-authorized CDS form generated `location:{longitude:48.75,latitude:32}` and `date:["1990-12-30/1990-12-30"]` for total cloud cover/NetCDF. The [sanitized evidence](data-pilot-evidence/2026-10-16-timeseries-request-contract.json) records the exact example and its hash; no job was submitted. The earlier wire-format uncertainty below is historical. [Offline adapter preparation](era5-timeseries-adapter.md) uses this generated contract, while actual response/revision/limits/CDN acceptance remains separate.

**Decision: the distinct CDS time-series route remains promising, but its point/date wire contract and response admission are incomplete. No adapter or source job is ready.** This lane inspected retained public responses and installed official client source offline; it made no network request, credential read, submission, installation or code change. The owning wave's ledger is `.cache/source-admission-wave-20261016-v2/ledger.json`; its final request accounting belongs to the consolidated wave report.

## What is established

Product `reanalysis-era5-single-levels-timeseries`, DOI `10.24381/1cf1ad76`, declares CC-BY-4.0. The retained 16 October process response lists `total_cloud_cover`, CSV/NetCDF, asynchronous execution and referenced asset output. Its exposed inputs contain only `variable`, `data_format` and an exactly four-number `area`; it does not specify `date` or `location` serialization, maximum time span, point count, transfer size or cost limits. Its version `1.0.0` is a process version, not an immutable ERA5 scientific revision.

The earlier retained catalogue-page embedded form supplies UI semantics:

| Field | Retained widget facts | What these do not establish |
| --- | --- | --- |
| `date` | Required DateRangeWidget; minimum 1940-01-01, maximum/default end 2026-10-09 | Whether the wire value is a string, list, object or another representation; inclusive/exclusive server boundaries |
| `location` | GeographicLocationWidget; nearest grid point; 0.25° steps; latitude −90..90, longitude −180..179.9 | Exact serialized latitude/longitude shape, tie behavior, actual pole availability |
| `area` | GeographicExtentWidget; minimum extent 0.25° each direction, maximum 2° each direction | Provider acceptance or actual returned cell inventory; the PUG's 5° limit conflicts |
| `data_format` | NetCDF recommended; format help says CSV only with location | Another group help says CSV with area too; use neither as demonstrated acceptance |

The retained public collection instead declares spatial bbox −180/−89 to 180/89 and temporal extent 1940-01-01 through 2024-12-06. This disagrees with the UI endpoint bounds. The intended padded 1990-12-30 through 2021-01-02 clock lies inside both advertised temporal ranges; actual completeness and polar availability remain unverified.

## New metadata access evidence

Installed official `ecmwf/datastores/catalogue.py`, `Collection.form` and `.constraints`, derives GET endpoints by appending `/form.json` and `/constraints.json` to the collection URL. These supported exact endpoints were supplied to the owning network lane:

- `https://cds.climate.copernicus.eu/api/catalogue/v1/collections/reanalysis-era5-single-levels-timeseries/form.json`
- `https://cds.climate.copernicus.eu/api/catalogue/v1/collections/reanalysis-era5-single-levels-timeseries/constraints.json`

Wave responses `metadata-04.body` and `metadata-05.body` are HTTP **307**, zero body bytes, pointing to the same exact hashed ECMWF object-store form/constraints links retained previously. Redirects were not followed. The direct form-object request (`metadata-02.body`) failed before an HTTP response with `URLError` / `SSLCertVerificationError`, zero body bytes. This is a certificate-validation failure in this transport, not evidence of an authentication requirement, provider 401/403, permanent unavailability or an empty form. No TLS bypass, alternate host or repeated attempt followed.

The retained catalogue page directly linked the dataset frontend JavaScript. Its fetched `metadata-06.body` is HTTP 200, **30,670 bytes**. Offline inspection finds calls to `FormRequest.getNormalizedBody` imported from webpack module **93642**, rather than that method's implementation. It also asks a server helper for generated `api_request`. The fetched file therefore does not establish the date/location wire values. Its dependency IDs alone do not identify which remaining linked chunk contains the normalizer; choosing another chunk without that mapping would be speculation. Installed CDS/datastores clients pass request dictionaries onward and provide no product-specific date/location example found in this inspection. Do not invoke submit, constraint application or costing helpers as if they were offline inspection.

## Minimum next step and adapter readiness

Reuse the retained form and client evidence. Resolve one authoritative generated request example or the exact frontend normalization implementation through a supported public access path; diagnose the object-store certificate failure separately if that path is chosen. This is a documentary dependency, not permission to request observations. Repeated process/collection downloads add no missing wire evidence.

After that, freeze a distinct source contract covering exact point/date request bytes, limits, returned coordinate/time convention, units and missing values, final-versus-preliminary revision assurance, packaging, licence/attribution and immutable raw-to-monthly provenance. PUG homogenization removes dimensions including `number` and `valid_time`; absence of expver is not proof of final revision 0001. Actual asset/CDN origin remains unknown. The fixed legacy sample executor cannot execute this distinct identity.

Only then prepare a separately bounded format-admission job for the existing real candidate `era5:32:48.75`, 1990-12-30, 24 expected hourly total-cloud values, NetCDF. The old semantic proposal's 2 MiB transfer ceiling and zero retries remain proposed bounds, not acceptance or authorization. A later long-series benchmark would require its own explicit resource envelope and streaming monthly importer: 263,088 padded timestamps exceed the existing 22,320-hour parent cap. Neither a tiny response nor the completed synthetic 18-million-pin proof establishes practical worldwide acquisition.

Retain all actual history pins and subtract the verified **16,416 production cell-hours** across seven cells before any alternative schedule. The remaining **14,422,993,920 source hours**, real baseline construction, global coverage and measured serving/build fit remain open. No scientific method, runtime source selection or completed-ticket count changes here.
