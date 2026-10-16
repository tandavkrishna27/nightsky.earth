# N4 retained geography preflight and weather sample retry

16 October 2026. Owner authorized offline geography checks and one fresh bounded ERA5 sample, reusing the previously authorized private configuration setup. No deployment or runtime data selection occurred. Earlier failed/uncertain attempts are preserved.

## Geography: bounded offline inventory

Each acquired body was read once, 54,014,085 bytes total, in a supervised local inventory with a 2 GiB Windows Job commit ceiling and 60-second deadline. Inventory duration was 0.9255 seconds. This was linear attribute/coordinate inspection, not a topology validation or serving benchmark.

| Observed blocker | Consequence for the current adapter |
| --- | --- |
| Both source roots include `crs` | Current strict source schema rejects it. Verify declared CRS semantics before any format conversion. |
| 1,843,790 coordinate positions | Exceeds the supported 1,000,000 vertex ceiling; do not blindly raise it. |
| 52 consecutive degenerate edges | Existing geometry checks reject these; any transformation needs an explicit documented policy. |
| About 2.189 billion potential self-ring comparisons | Arithmetic estimate from existing pair loops exceeds the 100 million work ceiling; no quadratic full-data run was performed. |
| Full repeated-provenance mappings exceed the 1 MiB descriptor envelope | Compact identity/provenance preparation needs review; no oversized descriptor was generated. |
| Sentinel/nonunique country codes and seven missing state names | Require explicit identity/name decisions; no assignments or names were invented. |

`ADM0_A3` was observed as 258 unique nonempty provider strings and `adm1_code` as 4,596 unique nonempty strings in this pinned edition. They are candidate provider keys, not verified ISO assignments. Raw inputs remain unchanged and reusable. The next geography action is a bounded preparation design against these actual findings, not another download or automatic scope reduction.

## Weather: remote job completed; local raw retrieval pending

The new allowance/output tuple is `.data/era5/timeseries-sample-19901230-r2*`; it is separate from the original uncertain attempt. One submission was made. The local checkpoint recorded a known job ID and status `successful` after five admitted polls. The supervisor then stopped at child exit during result retrieval, after 121,872 milliseconds, without retaining a raw file. Safe transport telemetry records HTTP 200 and 328 metadata bytes for the last response; it does not establish why subsequent retrieval checks stopped.

Read-only CDS browser verification showed 35 total requests and a successful time-series request with the matching private local job identity, exact 1990-12-30 date, latitude 32, longitude 48.75, total cloud cover and NetCDF. The UI reports a 15.03 KB result and 1 minute 43 seconds provider duration. No Download button was pressed and no additional job was submitted. Job IDs and account identity are retained privately, not copied into this public record.

This is stronger request/protocol evidence than the original uncertain attempt. It is still not a locally inspected scientific sample: point/time axis, variables/units, missing values, encoding/revision and asset origin remain unvalidated. Preserve the successful checkpoint and job receipt. Investigate the existing result-retrieval contract before any new download; a new job is not needed merely to investigate this completed job. No cause such as an unapproved CDN or response-shape mismatch is asserted without evidence.

## Architecture and tracker disposition

See [runtime data model](runtime-data-model.md): forecasts use APIs, astronomy is calculated, and gazetteer/catalogue/boundary/history features may use prepared read-only files. These downloads are a mixture of technical samples and potential production inputs, not universally disposable test fixtures.

N4, S2-G2 and S2-H2 remain partial. No original ticket acceptance or 12 Done / 9 Partial / 6 Not started accounting changes. Further source/asset actions must preserve the approved host/count/byte/deadline boundaries; no automatic new job, host expansion, geometry repair, limit increase or data promotion follows this report.
