# Grouped historical source wave

Status: implemented and exercised offline with engineering fixtures. No new CDS account request or retrieval ran in this wave. The previous four-job allowance is exhausted. The active 2025 sample and previous historical checkpoints remain in their existing directories. No new real baseline is published.

## Reviewed software path

`grouped_history.py plan` generates deterministic groups for complete years within 1991–2020. Each group selects one region and one month across years with identical valid day counts. February leap and non-leap years form separate requests, so every Cartesian year/month/day/hour combination is a valid date. Outer boundary days stay separate. Both the two-year and full baseline plans contain 30 jobs, compared with 52 and 724 legacy monthly jobs. Producing the full plan grants no retrieval permission.

Python and TypeScript agree on these plan digests:

| Observing years | Grouped manifest SHA256 |
| --- | --- |
| 1991–1992 sample | `5eb57ba09de53fd9c8881d66444e2aecf868b9640bc9e2ccaff982f132cc565d` |
| 1991–2020 candidate baseline | `0cf1a1523b77437e53e4a45af76481610478d3314397ee7563613682505e0be7` |

`prepare` and `import` require the exact reviewed digest. A grouped root holds one immutable raw NetCDF parent per job, a checksummed partition index, and year/month JSONL partitions. Every partition header retains the parent raw SHA256; the index binds its child digest, source rows, expected rows and missing source hours. The importer requires exact grid and requested UTC timestamp membership, deterministic member zero, final revision `0001`, strictly ascending hours and the reviewed modern NetCDF variables/dimensions. Missing source hours remain missing; no interpolation or zero filling occurs. Entirely absent monthly partitions are rejected, preventing an empty source partition from being treated as completed.

`build-pilot.ts --historical --grouped` verifies the exact grouped manifest, all parent and index digests, child digests, clock membership, revision, grid, byte and row counts. It reads the resulting monthly partitions chronologically through the existing independently generated astronomical dark-hour denominators, and produces the existing schema 2 envelope. Raw provenance is recorded once per parent. Every required group must be complete before publication. Existing output is immutable; changed metadata/source/timestamp needs a separately reviewed version directory. Engineering fixtures prove this software path, including rejection of index/path/year/parent/duplicate/clock/revision tampering; they provide no climate evidence.

The public legacy monthly decoder still accepts at most 800 hours, ten cells, 32 MiB raw/numeric data and 4 MiB JSONL. The separate grouped entry point accepts at most 22,320 hours (30 January-sized months), ten cells, 32 MiB raw and 32 MiB decoded numeric data, then emits partitions of at most 800 hours and 4 MiB each. Source dimensions are checked before time, coordinate and revision arrays are read. Cloud values are read one spatial row at a time. The grouped importer applies a 256 MiB process peak RSS gate and a 30-minute deadline; its CLI uses the existing bounded child-process deadline. The offline builder retains its existing 30-minute process deadline. Peak gates are cooperative pre/post checks, not an OS memory quota.

The existing bounded acquisition transport supports a grouped importer/verifier and reserves additional staging bytes before submission. Grouped fetches persist submission intent before POST, stop after four durable submission entries in that root, retain known job IDs, reject uncertainty before another submission and never retry automatically. Offline `reconcile` proves the grouped parent/index/children against the persisted source/job identity. Untracked partial publication blocks reuse and requires operator inspection; do not delete it and resubmit an unknown job.

## Proposed next real request batch — awaiting separate authorization

Use a fresh `.data/era5/grouped-history-1991-1992-v1` root and the two-year digest above. Proposed order:

| Job | Requested years/month | Expected UTC rows | Cells |
| --- | --- | ---: | ---: |
| `hanle-03-1991-1992` | 1991 and 1992 March, days 01–31, every hour | 1,488 | 4 |
| `kodaikanal-munnar-03-1991-1992` | 1991 and 1992 March, days 01–31, every hour | 1,488 | 6 |
| `hanle-02-1992-1992` | 1992 February, days 01–29, every hour | 696 | 4 |
| `kodaikanal-munnar-02-1992-1992` | 1992 February, days 01–29, every hour | 696 | 6 |

Maximum: four new jobs, one active job, 30 minutes overall, 32 MiB per raw parent (128 MiB for the four), 512 MiB retained raw and 1 GiB total task scratch. The exact proposed batch contains six monthly partitions, at most 24 MiB retained decoded partitions plus bounded indexes. A two-year grouped job reserves 92 MiB additional total scratch at transport preflight: 64 MiB for raw staging/copy, 8 MiB transport overhead and 20 MiB for two staged row files, two final JSONL partitions and index. The general 30-year job reserves at most 316 MiB in the same preflight. These are conservative ceilings, not measured source sizes. No queue/time/storage extrapolation establishes a baseline.

The overall 30-minute batch limit and the exact four-job selection remain operator gates. Each CLI child has a hard 30-minute deadline; the durable four-entry submission cap is enforced. Do not start another selected job when the overall batch deadline has expired. Stop after job one for format, revisions, requested membership, parent/child checksum, retained bytes, scratch bytes, queue/download/decode time and peak RSS review; continue only while those gates pass and the batch remains within its original time budget. Unexpected archives, additional variables/dimensions, mixed revisions, off-grid values, out-of-request clocks or unsupported metadata stop import. Retain the known job identity and inspect the returned file offline; do not infer a converter layout or broaden the decoder automatically.

A real first grouped response is still needed to validate the currently returned CDS layout and actual group size/time/memory. The existing four live monthly files establish the earlier monthly layout only. After this proposed batch, source coverage remains incomplete for 1991–1992; it cannot be published as a complete two-year release. Full baseline retrieval remains behind another review of actual performance, coverage, storage and recovery. The 90% eligible-sample and 27-qualifying-year provider gates still apply to a real baseline. Global coverage and selected-host release validation remain open.

Before the first separately authorized POST, check the exact selections against the current CDS download-form cost constraints. [ECMWF Support's NetCDF request-limit announcement](https://forum.ecmwf.int/t/limitation-change-on-netcdf-era5-requests/12477) states that NetCDF requests have smaller allowances than GRIB and directs users to the form for request validation. This research did not access an account or validate the proposed selections in that form. The 30-job full plan is therefore a software candidate, not proof that CDS accepts those groups. If a group is rejected, stop and review a smaller deterministic plan/digest; do not silently split it into additional jobs beyond the approved allowance.

## Offline reproduction and commands

Run `tests/era5/test_grouped_history.py` to generate real NetCDF-format engineering fixtures with the official modern coordinate names/scalar revision shape, partition them, exercise bounded fake transport, prove offline reconciliation and reject provenance/clock/revision changes. Run `tests/providers/climate/grouped-history-builder.test.ts` to create all grouped engineering checkpoints, produce the schema 2 envelope chronologically, prove immutable replay and exercise malicious coherent index/path/year/parent/clock changes. These two layers validate decoding and publication separately; the builder verifies digests and decoded contracts rather than reopening NetCDF itself.

Offline plan and prepare:

```powershell
& '.data/era5/venv/Scripts/python.exe' scripts/era5/grouped_history.py plan --start-year 1991 --end-year 1992
& '.data/era5/venv/Scripts/python.exe' scripts/era5/grouped_history.py prepare --expected-manifest-sha256 5eb57ba09de53fd9c8881d66444e2aecf868b9640bc9e2ccaff982f132cc565d
```

After separately authorized retrieval, use `fetch --chunk <selected-job>` or `resume --chunk <known-job>` with that root/period/digest. Only `reconcile` stays offline. No acquisition command in this document has been executed. After every required group completes, build with the reviewed digest and the actual UTC build timestamp:

```powershell
npx tsx scripts/era5/build-pilot.ts --historical --grouped --root .data/era5/grouped-history-1991-1992-v1 --start-year 1991 --end-year 1992 --expected-manifest-sha256 5eb57ba09de53fd9c8881d66444e2aecf868b9640bc9e2ccaff982f132cc565d --generated-at <actual-UTC-build-time>
```

## Primary format evidence

Checked 2026-10-14: ECMWF's [GRIB to NetCDF conversion documentation](https://confluence.ecmwf.int/spaces/CKB/pages/450760890/GRIB%2Bto%2BnetCDF%2Bconversion%2Bon%2Bnew%2BCDS%2Band%2BADS%2Bsystems) shows modern ERA5 `valid_time`, `latitude`, `longitude`, scalar `number` and scalar string `expver`, and warns that converter formats can change. Our grouped fixtures use this shape and epoch-second clock; earlier monthly tests retain support for per-time revision metadata. The [ERA5 data documentation](https://confluence.ecmwf.int/pages/viewpage.action?pageId=388500357) identifies final ERA5 as `expver=0001`; preliminary ERA5T is rejected. Neither document guarantees the exact future returned file for our selected request; the first real grouped result remains the format acceptance gate.
