# Practical API history completion design

The assigned completion brief authorizes offline implementation and independent
review, with no live/history request, credential access, download, deletion,
deployment or push. This architectural slice extends the existing hosted history
path. Its purpose is useful global API-first history on a small server, without
an exhaustive catalogue or database. Existing native ERA5 and pilot evidence stay
separate; no baseline years, denominators or source precision are relaxed.

## Source and requests

Keep the existing 14-day contract for retained pilot replay. A new pure planner
uses the exact padded 1990-12-30 through 2021-01-02 UTC days, one ERA5 variable,
GMT/Unix time, nearest selection and no elevation downscaling. Default ranges
are at most 366 days (30 GETs); an explicit at-most-1827-day option gives six
GETs. Responses remain capped at 2 MiB and cumulative retained input at 16 MiB.
These are application choices, not provider maximums or observed sizes.

Pinned official accounting estimates max(1, days/140) per one-variable/model/
location request. Both larger-range plans estimate 78.3 units; reserve the
ceiling of each request through the existing integer durable quota interface
(90 default, 84 six-range), not one unit per GET. Published free limits and
noncommercial eligibility remain separate from the application history budget.
No range expansion or retry follows a stop.

## Mapping and computation

Map the selected point to the pinned regular ERA5 index policy: quarter-degree
indices rounded from -90/-180, clamped at edges, +180 maps to 179.75, pole
longitude columns retained. Query that explicit canonical cell; keep the exact
selected point separately and report haversine displacement. This is an explicit
NightSky mapping policy based on official source, not an attestation of deployed
off-grid lookup. Reject returned-cell drift rather than rounding wire values.

Cache identity binds cell, IANA zone, period, source/method and astronomy/tz
runtime. The selected place ID/revision belongs to each response, not the shared
cell cache. Use the existing independent hourly astronomy clock, local-noon
night assignment, UTC bins, missingness and 90%/27-year/80%-per-year guards.
Never average partition statistics. Whole-percent precision remains the distinct
hosted method and does not certify native-fraction threshold equivalence.

## Orchestration, persistence and serving

The default planner/entrypoint has no network side effects. A worker requires an
explicit exact-plan approval, injected bounded transport, durable quota and a
single shared file lease. Persist request intents/reservations before transport;
stop on quota, HTTP, timeout, byte, identity or decode failure. Interrupted intent
is review-required, never an automatic retry. The bounded input buffer is at most
16 MiB; aggregation still processes one decoded range at a time. Durable journals
and completed compact aggregates permit cached serving after restart; partial raw
responses are not a permanent archive and cannot be automatically replayed.

Use a bounded file summary store (no database), exclusive/atomic writes, bounded
files/count and fail-closed corruption/ownership. No global preload, automatic
unbounded cache, existing-dataset deletion or automatic stale-lock takeover.
Lookup is read-only and returns the existing unavailable state for cold/building/
stopped history. Queueing/running builds is a separate explicit integration seam.

A source qualification record is required before a full hosted baseline can be
served. It explicitly accepts the distinct quantized method and carries a policy
revision, without claiming deployed scientific revision. Default absence leaves
baseline unavailable. Actual full-baseline quality/completeness must independently
pass; sample-only results stay partial. No production flag or registry is edited.

## Evidence and remaining gates

Tests use synthetic data and the retained 4,418-byte pilot read-only if useful.
Meaningful cases cover disjoint coverage and accounting, mapping ties/edges/poles,
drift/missingness/DST, authorization/quota/intent ordering, cold/cache/restart,
bounded storage, concurrency and failure. Focused tests and type checks only;
coordinator imports suites and runs combined CI. The handoff gives exact imports,
integration and the smallest separately authorized annual shape check, method/
business eligibility decisions, and later full-point resource measurement.
