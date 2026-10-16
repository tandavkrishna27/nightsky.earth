# N4 partitioned geography and point-series decoder

16 October 2026. Offline continuation of G2/H2 using retained inputs. No network requests, new downloads, credentials, deployment or serving-data promotion.

## Geography: supported partition path

Natural Earth ingestion accepts explicit whole-feature partitions. The exact provider inventory must account for every feature once, including unresolved identities. Duplicate, missing, unknown or conflicting mapped/unresolved keys reject. Rings, polygon parts and holes stay together.

The partitioned format has an explicit aggregate ceiling of two million positions, sufficient for the measured 1,843,790-position source. Each partition retains the existing one-million ceiling. Defaults and legacy admission behavior remain unchanged. Original positions and normalized positions are counted separately. Byte, work, output and deadline budgets cover the whole operation rather than restarting for each partition.

Preparation schema v2 carries pinned shards and region inventories without repeated mapping records. Membership schema v2 consumes those shards together; duplicate identities reject, and overlaps or borders across partitions remain unknown. No administrative boundary creates extraction coverage or evidence of site access.

An unresolved identity writes an exact residual report and prevents a completion marker or serving output. This blocks the complete source admission; it does not publish a subset that ignores unresolved territory.

### Retained-source sizing

[Sanitized evidence](data-pilot-evidence/2026-10-16-geography-partition-sizing.json) records source-hash checks before and after a supervised inventory/descriptor build. Limits: 2 GiB Job commit, 60 seconds, 80 MiB retained/output logical storage. Observed elapsed: 0.67 seconds; sampled main peak RSS: 433,061,888 bytes.

| Partition | Features | Original positions |
| --- | ---: | ---: |
| ADM0 | 258 | 548,471 |
| ADM1 first | 2,895 | 999,681 |
| ADM1 second | 1,701 | 295,638 |
| **Total** | **4,854** | **1,843,790** |

The quarantined compact descriptor is 585,594 bytes, below 1 MiB. It contains 4,784 provisional source-derived mappings and 70 residuals, including seven missing names. France and Norway use their explicit matching alternate source fields. Other mappings retain source field provenance; no independent ISO registry validation is claimed. Region IDs encode provider bytes separately from country associations.

**G2 remains partial:** sizing is not actual full topology/membership acceptance or an end-to-end memory measurement. The residuals require a documented identity/label policy that can represent unknown or disputed associations truthfully. Current public RegionRef requires a nonempty name and ISO3-shaped country code. Source notes for seven unnamed features are descriptions, not official subdivision names; PGA also has conflicting names. Do not assign fake values to satisfy that schema. After this contract is resolved, run the actual retained preparation/topology/membership build under supervision.

## Weather: observed ZIP and scalar-point format

`scripts/era5/point_timeseries.py` is a separate offline decoder. It binds the raw SHA-256, requested coordinates and exact hourly clock. It accepts one regular root-level NetCDF member in a ZIP, with a 2 MiB raw bound, 64 MiB expanded bound, 100:1 expansion bound and CRC verification. Member names are never used as extraction paths. Encryption, multiple entries, links, unexpected schemas, nested groups, packing and invalid coordinates/times/units reject. At most 800 hours are read; missing cloud values remain null, and values outside [0,1] reject.

Source path/identity checks and repeat hashing protect the input. Output is bounded, fully validated, fsynced and published exclusively without overwriting existing files. Native NetCDF parsing requires caller-enforced process memory/time limits; the library does not substitute byte checks for containment.

The separate `era5-point-quarantine-v1` header explicitly records unknown member/revision and `historicalAdmission: false`. Legacy history contracts are unchanged. Both the existing TypeScript history parser and legacy Python validator reject the actual generated output.

[Final retained validation](data-pilot-evidence/2026-10-16-weather-point-decoder.json) used the reviewed final decoder under a credential-free 512 MiB, one-process Windows Job and 60-second deadline. It produced 24 hourly rows at latitude 32, longitude 48.75 for 1990-12-30. Raw SHA-256 remains `b1ba3a848d14aea362a9af6cbbe32c79a0f8681213bde5eeb747729c47c99c56`; member SHA-256 remains `08ab00f75baf4e8f0dad1b398f9457ae190fda8b9899bbbbfea25d74a52f3e81`.

**H2 remains partial:** decoding now works, but absent member/revision evidence cannot satisfy the current final-expver history policy. A source-backed provenance decision is required before scientific admission. This day is not a 1991–2020 baseline or proof of global acquisition feasibility. H3 remains pending.

## Review, tests and next acceptance

Independent reviews found and resolved two issues: the new raw-position ceiling must not change legacy post-normalization acceptance, and the point decoder must reject nested NetCDF groups. Regression tests cover both. Output-parent link checks were also added. Forty focused geography tests and 132 ERA5 tests passed; TypeScript checks passed. The full Node suite passed 861 tests, with one existing skip and no failures. Exact-commit CI is checked after push; local results alone do not establish CI success.

The fixed tracker remains at S2/N4 in progress; original counts remain **12 Done / 9 Partial / 6 Not started**. Next acceptance is explicit handling of the 70 geographic residuals, actual full geography validation, weather provenance admission, then the existing G3/H3/E2 source-coverage gates. S3/S4 still depend on actual assembled release files.
