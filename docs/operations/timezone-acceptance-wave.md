# Accepted named-place timezone V1 — acceptance wave

14 October 2026. Baseline `22cedf9`. The owner accepted global named-place timezone V1 and explicitly deferred coordinate-boundary resolving after the scope recommendation. See [decision rationale and replacement wording](timezone-scope-reconciliation.md). Original task status and audit changes are maintained by the root acceptance lane.

## Implemented behavior

The interface remains `resolvePlace(input)` plus `resolvePlaceTimeZone(placeId, index?)`. The timezone helper now validates the selected record's zone before returning it. Invalid zones throw; missing records/index and unsupported namespaces return undefined, requiring callers to re-resolve or report unavailable. None becomes UTC.

Near-me results now state that the nearest indexed named area is a planning reference and its zone does not establish the approximate hint's zone or municipality. Existing record-zone and municipality polygon caveats remain. Coordinates remain server-private for named records and request-only for hints. User-coordinate text remains rejected. Candidate discovery remains separate: a public OSM ID cannot produce a named-place plan, and candidate results do not acquire a borrowed city-zone field.

Two new tests failed before production changes: invalid named-record zone returned a result rather than rejecting; near-me lacked the hint-zone caveat. Minimal fixes are zone validation in `server/places/index.ts` and one additional near-me caveat in `geonames.ts`. Other added tests characterize existing required behavior; no implementation was changed solely to make those tests fail.

## Acceptance mapping

| Accepted criterion | Concrete evidence |
|---|---|
| C1 T1–T10, T14 | Existing `tests/places/geonames.test.ts`: unique match, ambiguity, no match, country qualifier, available non-Latin alias, coordinate rejection, explicit hint, absent hint, ignored hint, malformed row, stale ID/re-resolution. |
| C1 T11 replacement | `resolvesIanaZoneFromNamedPlaceRecord` in `tests/nightsky/time.test.ts` retains record zone and vintage identity. Additional tests cover unsupported/unknown IDs, deterministic missing artifact, and invalid zone rejection. |
| C1 T12 date line | Existing identifier test retained; new Apia/Pago Pago records at one UTC instant produce independently specified dates 2026-10-15 and 2026-10-14 and their local clocks. This demonstrates opposing civil dates without claiming geometry accuracy. |
| C1 T13 ranges | Existing `rejectsInvalidCoordinatesInPlaceRecord` in shared contracts; new invalid hint rejects latitude 91/longitude 181. |
| C1 T15 DST | Existing spring transition and nonexistent local time rejection; explicit 05:30Z/06:30Z fall-fold instants display 1:30 AM EDT/EST separately; Kolkata conversion proves a half-hour offset without rounding. |
| C1 scoped near-me guards | Synthetic cross-border named rows exercise nearest selection, selected record's actual zone, hint secrecy and both caveats. A remote hint yields `not-covered`, empty matches and no zone. Missing supplied index yields unavailable. |
| C1 candidate guard | Actual MCP transport test in `tests/mcp/planning-e2e.test.ts` attempts planning with an OSM candidate ID and receives an error with no structured plan. No city-zone fallback. |
| C2 refresh | Existing `scripts/refresh-geonames.ts`, reviewed Hanle supplement, `geonames-index.md` and index tests retain version/checksum/vintage/attribution/error handling and atomic artifact write. Separate runtime refresh/rollback procedure below. |
| C3 IDs/privacy | Existing namespaced-ID/stale-recovery tests, private record ranges, coordinate rejection, hint opt-in/secrecy and no-query downstream contracts retained. No public coordinate-zone API added. |
| C4 source/no fallback | GeoNames CC BY 4.0 attribution/license/modification/vintage source records retained; IANA rule provenance distinct from geographical membership. Missing/invalid cases fail explicitly; polygons and their rights are deferred, not represented as installed. |

## Source and runtime refresh procedure

The accepted source is GeoNames cities500 plus the reviewed named-place supplement, with CC BY 4.0 attribution and modification notice. [GeoNames source documentation](https://download.geonames.org/export/dump/readme.txt) defines its IANA row field and as-is data limits. Existing refresh instructions remain in `geonames-index.md`; this wave performed no acquisition. Maintain a reviewed prior artifact/checksum for rollback, generate/validate the proposed artifact, stage it atomically, restart to load its vintage, then run the mapped place/time checks before promotion. On failure restore the prior reviewed artifact and restart. A missing artifact yields unavailable, never a fabricated record or UTC.

Civil-time rules are supplied by Node `Intl`/ICU independently of the gazetteer. Recorded local versions: **Node v24.14.0, ICU 78.2, tz 2025c**. This is execution provenance, not certification that all upcoming political changes are represented. [IANA](https://www.iana.org/time-zones) documents periodic rule changes; its reviewed current page lists 2026e. A newer gazetteer cannot repair stale runtime rules.

For runtime promotion, record `process.version`, `process.versions.icu` and `process.versions.tz` alongside the selected runtime image/version and GeoNames checksum/vintage. Review tzdb changes for supported destinations and dates, use a supported runtime carrying suitable updated rules, run the mapped tests and affected official transition fixtures, then stage/promote using the hosting rollback procedure. Keep the previous runtime image and gazetteer artifact as independently reversible versions. If rules cannot be validated for an affected requested place/date, report that uncertainty or unavailable behavior rather than promising correct local civil time. No automatic update, remote host or all-zone certification is implied here.

Current artifact limits remain 64 MiB compressed/256 MiB decoded; prior local RSS evidence about 317 MiB is not a production capacity budget. Measure installed artifact/runtime cold and warm behavior on the approved host before release. Source updates, rule updates and political changes require operator review; this wave does not introduce a scheduler or settle production refresh cadence.

## Retained scope limits

Global installed named records remain supported, including reviewed supplements; not every village/site is present. Large-city results are representative point/record-zone calculations, not municipality-wide timezone guarantees. Near-me selects a named reference within 100 km, not the hint's containing zone. Candidates have mapped public coordinates and unknown access/darkness; candidate-local times and direct candidate planning remain unsupported. UTC windows carry IANA zones and keep existing query caps; fall-fold local wall-clock input uniqueness is not promised. Node rules and source data can lag real civil practice. Polygon accuracy, boundary rights/artifact work and candidate-plan expansion remain deferred.

## Verification

The focused command `node --import tsx --test tests/places/geonames.test.ts tests/nightsky/time.test.ts tests/mcp/planning-e2e.test.ts` passed **28/28** after the two fixes: 19 resolver cases, 8 time cases and one MCP journey that includes the candidate rejection. `npm run check` passed all three TypeScript checks. Full `npm test` passed **483 tests, zero failures, one skip (484 total)**. No downloads, accounts, deployment, commit or push occurred.

Recommendation: mark Task 4 Done only under the explicitly accepted named-place wording and after independent review confirms this mapping. This is local acceptance; runtime rule refresh and host capacity remain production release gates.
