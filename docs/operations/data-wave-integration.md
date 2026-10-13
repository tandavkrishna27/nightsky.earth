# Data wave integration — 14 October 2026

This record describes bounded evidence added to the existing plugin workflows. It does not close the 15 user journeys, remaining data coverage gaps, public release gates or target-host acceptance.

## Meteor timing and geometry

The active timing artifact is `data/events/meteor-peaks-nasa-2026.json`: 13 original forecast maxima from NASA NTRS 20250009524, Table 3 page 8, issued 2025-10-17. Preserve exact UTC instants and local conversions. The NTRS rights evidence records “Work of the US Gov. Public Use Permitted.” No copied report images or whole document are needed. This dataset supplies 2026 maxima only, with no activity widths, recurring dates, visual rates or peaks for other years.

The independent CC BY 4.0 GMN artifact still supplies eight near-anchor radiant models: PER, GEM, ORI, ETA, LYR, SDA, QUA and LEO. QUA, ETA, SDA, PER and GEM have both NASA timing and GMN models. LYR, ORI and LEO lack NASA timing. ZPE, ARI, SSG, CAP, DSX, DRA, AND and URS lack modeled radiants. Calendar timing cannot establish local visibility. Keep three exact evaluations and unavailable/outside-model results, source frames, fit-domain limits and annual extrapolation flags. Full activity seasons and local rates remain open.

The old `meteor-showers-v1.json` remains audit-only: no runtime load and no plugin-image copy. Its earlier compilation review does not block independent supported NASA records. Workflow responses explain relevant coverage without exposing internal release-gate language as routine observing advice.

## Regional observing candidates

The retained real OSM fixture at `tests/osm/fixtures/real-regional-wave/` contains 1,327 named candidates: 185 nodes and 1,142 ways in Bengaluru, Nilgiris, Kochi and Chennai boxes. Source vintage is 2026-10-13T18:47:51Z. Candidate SHA-256 is `e542a89ac7094acbd02f18dd7ea559001e21a4778214379b08839e1e553265ef`; source SHA-256 is `ff62e1f4fc812e12ae32bb04e4fac6c78995dc6ca09d66b1ccd306e3221efff4`. See [regional measurements](spot-expansion-wave.md) and the fixture's independent ODbL notice, provenance and deterministic rebuild instructions.

The runtime searches an explicitly installed local index. No configured index means unavailable; omitted regions, unnamed features and relations prevent global completeness claims. Way coordinates are supplied bounding-box centers, not entrances or centroids, and may lie outside a feature. Categories and distance rankings do not verify darkness, access, night opening, permits, safety, terrain or horizon.

Selected OSM `place:v1:osm:*` IDs remain unsupported planner and astronomy inputs. The assistant must explicitly name a separately resolved GeoNames destination before planning. That destination's weather and geometric horizon calculations are not exact-site evidence for the selected candidate. Coordinate conversion cannot repair this contract gap. Direct candidate planning, broader coverage, active-version public data offer and selected-host scale measurements remain open.

## Historical context and journey coverage

The currently retained 2025 sample remains a partial one-year reanalysis sample, not a seasonal baseline or whole-night probability. A generic multiple-year preparation workflow does not itself establish acquired or runtime-loaded multiple-year coverage. The historical lane completed four of 52 reviewed 1991–1992 pilot chunks and measured incomplete-source processing; no complete historical envelope or new runtime release was published. Generic schema 2 preparation, exact-byte immutable publication and recovery are implemented. See historical-baseline-wave.md for requested/received periods, missing denominators and acquisition limits. Missing places and months stay explicit.

All five canonical product workflows and their packaged skills preserve source-specific evidence, issue/valid times, unsupported results, comparison gaps and practical preparation. The wave improves event discovery and regional spot discovery evidence; it does not establish full-season meteor planning, exact-site plans, global spots, seeing/transparency, long-range weather or closed journey scope. Package rebuilding and final local/CI evidence belong to the release owner after concurrent changes settle. No deployment is authorized by this integration record.
