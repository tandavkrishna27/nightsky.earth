# Historical baseline wave

## Scope and evidence

The reviewed source footprint is unchanged: Hanle (four supplied 0.25-degree cells) and Kodaikanal/Munnar (six cells). Historical processing stays offline after source retrieval. The existing immutable 2025 release remains a one-year sample; a new historical release uses a separate directory and the current schema 2 tile provider.

The two-year pilot covers observing nights 1991-01-01 through 1992-12-31, with two UTC days before/after for local-night boundaries. Its 52 exact month/boundary requests have manifest SHA256 `d0b21e1342e46648016a47585202ce032a557f8d6a9e4c9696a7ea0822208f8a`. The matching Python and TypeScript generators agree on this digest. Only the exact 1991-01-01 through 2020-12-31 period may be labeled baseline; the two-year pilot always remains sample-only.

The first live batch was operationally capped at four new jobs, one active job, 30 minutes overall, 32 MiB per raw chunk, 512 MiB retained raw and 1 GiB scratch. The CLI hard deadline is 30 minutes per selected chunk; the four-job and overall 30-minute first-batch limits are an operator gate, not an automated multi-job runner. Each source operation runs in a child with that per-chunk hard deadline; network calls are bounded to 30 seconds and metadata to 1 MiB. A durable submission intent precedes POST. Uncertain submissions and known queued identities block another submission until reviewed recovery. Offline `reconcile` can prove a historical post-import local checkpoint against its persisted job/source identity and clear the remote ledger without network access. Never resubmit an unknown job. Credentials remain in the operator's private external CDS configuration and never enter manifests, reports, artifacts or runtime.

## Commands

Use the existing `.data/era5/venv/Scripts/python.exe` environment. `history.py plan` is offline. `prepare`, `fetch`, `resume`, and offline `reconcile` require the explicitly reviewed manifest digest; `fetch` selects exactly one chunk. The two-year default output root is `.data/era5/history-1991-1992`.

```powershell
& '.data/era5/venv/Scripts/python.exe' scripts/era5/history.py plan --start-year 1991 --end-year 1992
& '.data/era5/venv/Scripts/python.exe' scripts/era5/history.py prepare --expected-manifest-sha256 d0b21e1342e46648016a47585202ce032a557f8d6a9e4c9696a7ea0822208f8a
& '.data/era5/venv/Scripts/python.exe' scripts/era5/history.py fetch --expected-manifest-sha256 d0b21e1342e46648016a47585202ce032a557f8d6a9e4c9696a7ea0822208f8a --chunk hanle-1991-01
```

After all required chunks are complete, the offline builder requires the explicit period, reviewed digest and real build timestamp:

```powershell
npx tsx scripts/era5/build-pilot.ts --historical --root .data/era5/history-1991-1992 --start-year 1991 --end-year 1992 --expected-manifest-sha256 d0b21e1342e46648016a47585202ce032a557f8d6a9e4c9696a7ea0822208f8a --generated-at <actual-UTC-build-time>
```

It writes only `historical-envelope.json` in that root. An identical historical envelope is returned without rewriting it. Changed timestamp, index vintage, mapping, source or any other envelope content requires a separately reviewed version directory; prior bytes remain untouched. Publish this checksummed schema 2 envelope with `build-tiles.ts` to a new immutable release directory. Register a release only after source and provider review. The builder rejects missing chunks; a partial fetch is never presented as a complete two-year artifact.

The generic full-period plan has 724 requests for the same ten cells. Generating that plan grants no live bulk retrieval. The current monthly decoder retains its 800-hour, ten-cell, 32-MiB numeric and 4-MiB JSONL limits. The aggregator streams chronological chunks one at a time for each selected cell/timezone and independently generates dark-hour denominators. Missing UTC source hours remain missing eligible observations; inclusive cloud thresholds and noon-to-noon local observing dates remain unchanged. Source raw/decoded digests, exact requested timestamp membership, revision `0001`, decoder versions, astronomical version and timezone vintage are checked before publication.

## Resource gate for wider history

Proceed after a measured pilot proves actual request size, queue/download/decode time, peak memory, source revisions, gaps and chronological processing. The full baseline must satisfy the provider's existing coverage gates: 90% eligible observations and at least 27 qualifying years for relevant bins. Fictional engineering fixtures establish software behavior only. They are never a substitute for real 30-year source evidence.

Month-grouped multi-year CDS requests may reduce job count, but their disjoint source order requires a new explicitly bounded decoder and provenance design. Do not widen legacy decoder limits silently. A safe future design retains each original grouped raw source once and produces checksummed year/month partitions that retain their parent source identity; then the aggregator reads partitions chronologically. A bounded merge is another design option, but needs explicit aggregate memory limits. Validate exact requested year/month/day/hour sets, leap days, revisions and actual CDS response format before adopting either approach.

A global rollout remains behind measured storage, retrieval and CPU gates. The serving plugin reads reviewed local aggregates only; it does not call CDS, build a baseline on demand, or require a database.

## Primary source references

[CDS API setup](https://cds.climate.copernicus.eu/how-to-api) confirms modern token configuration, client version guidance and dataset terms acceptance. [ERA5 hourly single levels](https://cds.climate.copernicus.eu/datasets/reanalysis-era5-single-levels?tab=overview) documents hourly reanalysis, the supplied 0.25-degree grid, the distinction from native model resolution, final versus preliminary data and source DOI. These pages were checked during this wave.

## First batch measured results

The first four completed real CDS checkpoints were final ERA5 revision `0001`, with no missing requested UTC rows. Each was imported through source/decoded checksums and exact grid/hour validation.

| Chunk | UTC rows | Raw bytes | Decoded bytes | Queue seconds | Download seconds | Processing seconds |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Hanle 1990 December boundary | 48 | 25,261 | 6,479 | 49.421 | 0.828 | 0.047 |
| Hanle January 1991 | 744 | 81,449 | 89,197 | 111.484 | 1.000 | 0.250 |
| Hanle January 1992 | 744 | 80,615 | 83,802 | 104.235 | 1.000 | 0.172 |
| Kodaikanal/Munnar January 1991 | 744 | 84,930 | 113,204 | 118.453 | 1.110 | 0.172 |

Decode peak memory was below 66 MiB in these checkpoints. Processing the incomplete real two-year checkpoint set with an independently generated expected clock took 0.461 seconds and peak process RSS 87,785,472 bytes. Hanle January across 1991 and 1992 had 682 eligible dark-hour samples, 680 valid samples, and two represented years. Remaining monthly source gaps stayed in the denominators; these measurements are **not** a published two-year artifact or a 30-year climate baseline. The local `measurement-report.json` records this explicitly.

The batch stopped after four of 52 planned chunks completed; all four remote ledger entries are complete and no job is queued or uncertain. Retained raw bytes were 272,255 and scratch bytes before the final measurement report were 693,965. Kodaikanal January had 590 expected / 294 valid eligible samples across the planned two years, and Munnar had 598 / 298; their missing second year remained explicit. No jobs beyond this first four-job batch are authorized by the initial resource gate. The completed checkpoint ledger is the authoritative source for current completion and retrieval timings.
