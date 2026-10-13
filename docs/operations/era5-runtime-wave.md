# H4 historical MCP integration — 13 October 2026

## Delivered

`get_clear_sky_climatology(placeId, month)` is registered as the twelfth MCP tool. Its strict V2 result includes the actual period, sample-only label, nearest supplied grid mapping and displacement, expected/valid hourly darkness sample counts, weighted mean cloud fraction, three inclusive threshold frequencies, 24 UTC-hour bins and ERA5 attribution. The direct tool, planner and comparison share the same provider. User workflows describe these quantities separately from forecasts.

The installed artifact covers **Hanle, Kodaikanal and Munnar in 2025 only**. Every nonzero result remains **partial**. Other places return unavailable; zero darkness has no numeric cloud statistics. These data do not provide a seasonal baseline, site-scale conditions or a whole-night success probability.

## Runtime configuration

Set both server environment variables before startup:

| Variable | Value |
|---|---|
| `NIGHTSKY_CLIMATE_ARTIFACT` | Absolute path to the reviewed `full-year-sample.json` |
| `NIGHTSKY_CLIMATE_SHA256` | Trusted digest pinned during artifact review |

For the current Windows artifact, the digest is `0ac43235fa7c0585d87a4e821e25d0bb9c799a1042f329a411923a4fa0dc2580`. A build with different declared Node/ICU/timezone versions may have another digest and needs separate review. Do not calculate and accept an unknown artifact digest automatically. No credentials or CDS requests are used by the runtime.

The route snapshots configuration and retains one lazy provider across stateless MCP requests. Publish a reviewed artifact to a new path, update its path/digest together and restart the service; restore the previous pair and restart to roll back. Cached content is immutable within a provider lifetime. Hosted atomic switching and rollback tests belong to H5.

## Runtime controls

| Control | Implemented behavior |
|---|---|
| File bound | At most 8 MiB, descriptor read bounded to initial size plus one byte; size/mtime rechecked; SHA verified before parsing |
| Cache admission | At most 32 MiB charged by serialized artifact bytes; one pilot artifact, not a multi-tile LRU |
| Concurrent loading | One active read, concurrent callers share its promise; failed reads can be retried |
| Validation | Exact reviewed pilot format/method/period/source DOI/licence/member/revision, place-index vintage/coordinates/timezone and nearest supplied cell; numerical/bin/monthly/year-mask consistency |
| Failure | Missing, untrusted, corrupt, oversized or uncovered data return unavailable with no numeric statistics or filesystem details |

Serialized-byte accounting is **not a parsed-heap/RSS ceiling**. Future multi-tile cache design and target-host measurements remain required. The reader intentionally supports this reviewed pilot format; accepting a multi-year or global artifact requires a new reviewed format, coverage and quality implementation.

## Verification and review

Windows: 265/265 application tests and application/builder typechecks pass. The real local MCP journey resolves all three places, requests January history, creates three plans and compares them. Real January valid/expected counts are Hanle 341/341, Kodaikanal 294/294 and Munnar 299/299. Weather in this test is an explicit unavailable fixture; no forecast retrieval was needed.

Independent review verified the installed SHA, all 36 monthly summaries and 864 bins, and one-read coalescing. It found and resolved nearest-cell validation and year-mask consistency issues. A concentrated missing-hour regression verifies that monthly completeness cannot erase a bad-bin warning. No Critical/Important finding remains in the reviewed scope.

Production runtime smoke lists 12 tools; Windows build and production dependency audit pass (zero production vulnerabilities). Final Linux evidence is recorded below. Python and offline builder algorithms were unchanged this wave; prior 33/33 cross-platform Python evidence remains applicable. GitHub-hosted CI and actual ChatGPT/Claude/Gemini connection have not run.

## Next dependency

H4 is complete locally. H5 still needs selected-host cold/warm/concurrent memory measurements, deployment/rollback tests, source/licence/privacy and scientific claim checks. Multi-year baseline, global coverage and publication remain separate open gates. Task 9 stays Partial; totals remain 7 Done / 12 Partial / 8 Not started (19 groups: 3 / 10 / 6).

Final Linux verification: 265 tests discovered, 263 passed, two ignored installed-artifact checks skipped, zero failures. Application/builder typechecks, build, production audit (zero findings) and production runtime smoke (12 tools) pass in the clean 2 CPU / 4 GiB container. This validates local Linux behavior, not Hetzner production headroom. Final Windows 265/265, typechecks, rebuilt production runtime and audit pass. Prior development dependency findings and website warnings remain. No database, deployment, commit, push or publication.
