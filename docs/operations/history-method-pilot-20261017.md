# Separate hosted cloud method and one-request pilot — 17 October 2026

The approved method definition is `open-meteo-quantized-dark-cloud-v1`, with source identity `open-meteo-hosted-era5-cloud-percent-v1`. It is explicitly distinct from native ERA5 `dark-cloud-v1`. The contract is in `server/providers/climate/openMeteoHistoryMethod.ts`; it does not extend production schemas, publish a baseline, or enable historical availability.

It preserves the exact 1991–2020 local observing-night baseline, local noon boundary, hourly solar-centre altitude ≤ −18° at the returned cell, independent summary/hour-bin expected and valid denominators, inclusive 10/25/50-percent thresholds, and missing data without local filling. Available baseline quality would still require ≥90% completeness, ≥27 represented years and no contributing year below 80% completeness, independently for each applicable summary/bin. Zero valid denominators omit numerical statistics. No 14-day pilot can satisfy those baseline conditions.

Hosted storage has integer-percent quantization in the inspected code. Decoding divides wire percentages by 100 without additional rounding; it does not recover native precision or imply native threshold equivalence. Deployed revision and actual upstream gap interpolation remain unverified. Raw response provenance and returned coordinates remain mandatory. See [source-resolution evidence](history-source-resolution-20261017.md) for the pinned official-source investigation and its limits.

## Prepared executor

`scripts/era5/pilot-open-meteo-history.ts` prints an offline manifest by default. Root/operator execution after review is explicitly:

```powershell
node --import tsx scripts/era5/pilot-open-meteo-history.ts --execute-one .cache/open-meteo-history-pilot-20261017
```

The parent `.cache` directory must already exist. The receipt directory must not exist. Exclusive creation precedes network access and is the persistent attempt marker; any existing directory, including an incomplete/crashed attempt, blocks reuse. Do not delete it to rerun or choose another directory to evade this one-attempt approval. The executor has no resume, batch or retry mode.

The URL is fixed to 28.5/77.25, 1990-12-30 through 1991-01-12 inclusive, one ERA5 cloud variable, GMT Unix hours, nearest cell and elevation disabled. Exactly one GET is permitted. Redirects are manual and rejected, credentials omitted, no environment/credential files read. Deadline is 20 seconds across fetch and body reads, with a race enforcing it even if a test transport ignores abort. The decoded entity body cap is 2 MiB and the sum of retained files is checked against 4 MiB. Fetch decompresses HTTP content encoding: `raw-response.body` means exact decoded response entity bytes, not compressed network packets. The receipt labels the decoded byte count accordingly.

`attempt.json` records retrieval UTC and the fixed plan before transport. Success retains the raw entity and SHA-256, a quarantine decode, status, allowlisted response headers, elapsed time and sizes. Cookie, authorization and redirect-location headers and arbitrary exception messages are excluded. Header values are limited to 1,024 characters each. Null and absent hours are counted separately while both remain missing in samples. Rate limiting, redirect/non-200 status, deadline, cap, unit/grid mismatch or decoder failure stops the attempt without retry. A complete bounded entity is retained before decoding, including on decoder rejection; over-cap or incomplete streams are discarded. Failures before a complete entity therefore have no body hash. A filesystem failure can leave only the exclusive directory/attempt marker, which still blocks rerun.

Estimated debit is 1.0 from pinned source accounting; measured debit remains `unobserved`. No request is made to discover debit. The pilot can show wire shape, returned cell, size and missingness for 336 slots, but cannot establish full-baseline completeness or scientific revision lineage. This implementation lane made no live requests; the root/operator records any later authorized execution separately.

## Offline verification

Run `node --import tsx --test tests/providers/climate/open-meteo-history-pilot.test.ts tests/providers/climate/open-meteo-history-contract.test.ts`. Fake fetch tests cover exact request options and one call, immutable attempt directory, retained budget, wire precision, distinct source/method, 429/redirect/server stops, exception/header secret omission, body cap, timeout before headers and during streaming, unit/cell rejection and retained raw evidence. The existing quarantine tests cover ordered clocks, boundary values, absent/null hours and request tampering. All ten tests passed during preparation.

## Executed pilot

The owner-authorized single attempt completed after root review and ten passing offline tests. HTTP 200, 808 ms, 4,418 decoded bytes; requested and returned grid cell 28.5/77.25; 336 samples with zero null or absent hours. See [safe receipt and code hashes](history-pilot-receipt-20261017.json). The raw entity and quarantine remain in ignored `.superpowers/sdd/activation-integration/history-pilot-one`; they are not production data or package assets. The one-attempt allowance is consumed. Do not execute the example again without a new allowance.

The result validates this request/decoder pair. It does not establish full 1991–2020 coverage, on-demand latency for a whole baseline, upstream deployed scientific revision, native ERA5 precision equivalence, or production admission. Next history work is bounded aggregation/serving integration under the distinct method, with an explicit baseline acquisition budget before additional calls.
