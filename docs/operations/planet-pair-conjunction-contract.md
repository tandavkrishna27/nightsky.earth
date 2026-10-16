# Bounded planet-pair conjunction contract — 17 October 2026

Authorized existing-scope implementation following `ff27a5ace4c0e0879be0cb59b554e69c91fd1f9a`. The owner meteor selection remains pending and independent. No dataset, provider job, ephemeris API or new dependency is required. Product scope still names planetary conjunctions; this bounded partial stream does not close broad V1 acceptance.

## Fixed calculation definition

- All **21 unordered pairs** of Mercury, Venus, Mars, Jupiter, Saturn, Uranus and Neptune, in that canonical order. No Sun, Moon, Earth, Pluto or minor bodies.
- Engineering output horizon **2025-01-01T00:00:00Z through 2027-12-31T23:59:59.999Z**, with the existing request-duration bound of 366 days and final catalog limit of 25.
- Event: a **crossing of equal geocentric right ascension in the true equator/equinox of date**, calculated with pinned MIT Astronomy Engine 2.1.19. Use aberration-corrected, light-time-corrected `GeoVector(body,time,true)`, then `Rotation_EQJ_EQD(time)`; do not use observer-displaced `Equator`, or native aberration-disabled `PairLongitude`.
- This is neither ecliptic-longitude equality, minimum three-dimensional sky separation nor closest physical distance. Store the modeled 3D angular separation at the RA crossing to prevent conflation; it is not an independently validated closest-approach angle.
- Global geometry only: every new pair event is instantaneous and `localVisibility: not-evaluated`. No local viewing/darkness/detectability claim. Existing heliocentric solar alignments and Mercury/Venus greatest elongations retain their definitions and horizons.

## Numerical screening and explicit limits

Use the smooth `sin(ΔRA)` signal, with **ΔRA = RA(second canonical body) − RA(first canonical body)**, and require `cos(ΔRA)>0` plus a small RA residual at a root, rejecting the opposite-RA zero. Ascending/descending refers to that signed difference increasing/decreasing through zero. Find crossings in both directions. Canonical full-calendar-year searches padded by **one day on each side**, with the unshifted grid anchored at `yearStart − one day`, make output independent of request start; assign roots to `[yearStart,nextYearStart)` and then filter requested endpoints inclusively.

Compare **24h, 12h and 6h** screening grids and a **6h grid shifted by 3h**. Inspect/refine finite-difference slope reversals for stationary candidates and close double crossings. The grids are numerical screening choices, not certified motion bounds. Reconcile inventories one-to-one with fixed numerical tolerances; retain canonical fine-grid solutions without averaging. Ambiguous pairing, grid disagreement, near-zero stationary/tangent candidates, nonfinite evaluations or exhausted budgets must remain explicit unresolved coverage, not fabricated events or silent omissions. Do not merge distinct nearby roots solely by time distance.

Root numerical tolerance: **0.1 seconds**; grid-inventory matching tolerance **2 seconds**; RA root residual **1e-6 degrees**. Require both the time and residual checks, refining further if the time check passes first. These are numerical checks, not physical/source accuracy claims. Stationary candidates within **0.01 degrees** of equal RA are unresolved unless ordinary directional crossings are separately bracketed and reconciled. Bound per-pair/year signal evaluations to **30,000**, iterations to **80 per refinement**, unresolved output intervals to **256** and cached final annual inventories to the **three** supported years. Surface budget or unresolved-list overflow as explicit failure; never truncate internal scientific search and describe it as complete. A grid mismatch must preserve bracketed confirmed crossings or explicit unresolved intervals, not only an empty list with a generic partial reason. Benchmark actual all-pair query cost after implementation.

Every in-range pair-conjunction search is **partial**, including empty results. State that crossing inventory is numerically screened and exhaustive completeness is not certified; stationary/tangent contacts remain unresolved. Pair coverage outside its engineering horizon is explicitly out-of-horizon and does not erase still-supported solar alignments, Moon events or unrelated unsupported classes. Unresolved brackets are coverage evidence, separate from dated `SkyEvent` rows.

## Shared/API contract

Keep `eventType: planetary-conjunction` for backward compatibility. New rows have strict optional-on-legacy `pairConjunction` metadata: canonical `bodies` tuple, literal `definition: geocentric-right-ascension-of-date`, literal `corrections: light-time-and-aberration`, finite `angularSeparationDeg` in 0–180 and `crossingDirection: ascending|descending`. Require peak instant, no duration/calendar windows and not-evaluated local visibility when this metadata exists; reject metadata on another event type, duplicate/reversed bodies and unknown fields. Existing solar-alignment payloads without metadata still validate.

Optional result field `planetPairCoverage` appears only when planetary-conjunction was requested. It carries `status: partial|out-of-horizon`, `completeness: not-certified`, the supported UTC bounds, `pairCount:21`, and a bounded list of unresolved intervals (canonical bodies, UTC start/end, reason). It must not claim an available complete catalog. Keep global result sorting/truncation unchanged and all MCP calls read-only/local.

## Independent reference admission before model outputs

The independent researcher fixed **60 minutes, time only**, before any pair-engine output, for these whole-hour records. No widening or tuning if a comparison fails.

| Primary public record | Published RA-conjunction time | ISO UTC representative | Locator / distinct closest approach |
| --- | --- | --- | --- |
| [PAGASA August 2025 diary](https://pubfiles.pagasa.dost.gov.ph/pagasaweb/files/astronomy/08%20Astro%20Diary%20Press%20Release%20August%202025.pdf#page=3) | Venus–Jupiter, August 12, 16:00 PhST | 2025-08-12T08:00:00Z | PDF p. 3 / printed p. 2, Planetary Location, explicitly same right ascension; closest approach separately 14:39 PhST. |
| [PAGASA June 2026 diary](https://pubfiles.pagasa.dost.gov.ph/pagasaweb/files/astronomy/06%20Astro%20Diary%20Press%20Release%20June%202026.pdf#page=3) | Venus–Jupiter, June 9, 20:00 PhST | 2026-06-09T12:00:00Z | PDF p. 3 / printed p. 2, Planetary Location, explicitly same right ascension; closest approach separately June 10, 03:48 PhST. |

Cover notes identify Philippine Standard Time. Official [PAGASA USMAN report, printed p. 8 Notes (1)](https://pubfiles.pagasa.dost.gov.ph/pagasaweb/files/tamss/weather/tcsummary/TD_USMAN_2018.pdf#page=8) explicitly defines **PhST = UTC+8**; no ambiguous PST or guessed offset is used. Source facts were read through primary PDF text extraction; no visual verification is claimed for the June page, which failed to render. No local download was made.

Both diaries cite MICA and Dominic Ford's In-The-Sky. Attribute PAGASA and this declared provenance; no blanket reuse license is established and no media/model/data table is imported. Only narrow event facts are retained for regressions. The coordinate epoch, geocentric/topocentric choice and detailed correction flags of the source calculations are **unestablished**. These are coarse same-RA identity comparisons, **not exact correction-model equivalence or a physical accuracy certification**. Whole-hour rounding rules and numerical uncertainty are unknown. Two dates of the same pair do not independently validate all 21 pairs or retrograde repeats. No closest-approach angle is borrowed. Additional fixtures require their own admission; In-The-Sky access-denied/indexed snippets and the October Venus–Mercury candidate were not promoted.

## Verification and delivery

TDD in existing registered event test files; synthetic signals exercise wrap/opposite RA, forward/reverse and repeated crossings, stationary tangency/near-miss, grid disagreement and budget failure. Real cases check the two fixed source envelopes, model RA residual/definition and no local visibility. Test strict schema, canonical pair identity, year boundaries, query-start stability, capability-specific horizons, unrelated mixed classes and final result limits. Parent adds composed-plan unknown-visibility regression and updates MCP/canonical/exposed skill text. Independent scientific and code reviews precede commit; run focused checks while implementing, then the full/type/package milestone and exact-tip CI. No new test registration/shared tracker/config/workflow edits or meteor acceptance changes.

## Recorded implementation evidence

Both coarse PAGASA cases pass the original **60-minute** time-only envelopes. No source reference, comparison limit or unsupported correction-model assumption was changed to obtain a pass. The composed planner retains the sourced pair crossing with unknown sky-event impact and not-evaluated local visibility. Strict metadata and separate unresolved coverage preserve legacy solar-alignment payloads.

Fresh parent verification: **125 affected event/meteor-planning/optional-event/MCP/workflow tests passed**, zero failed/skipped. The full **985-case** suite passed **979**, failed **zero**, skipped **six**, in **121.8 seconds**. Five skips concern absent ignored installed-data smoke artifacts; one is a Windows symlink-fixture restriction. All three TypeScript projects, plugin build, package rehearsal, deterministic Codex/Claude offline packages and whitespace checks passed. The first type check exposed new `Map` spread under the base compiler's default target; replacing it with `Array.from` fixed the local incompatibility without a configuration change.

Independent source/science and numerical/code reviews found and resolved: ambiguous root-direction suppression, flat near-equal samples lacking unresolved evidence, exact endpoint roots retaining overly wide deduplication brackets, and truncation language promising a complete list. Separate RED regressions reproduced those paths; they now pass. Two roots separated by **864 milliseconds** remain distinct, while ambiguous/tangent candidates are not fabricated as dated events. Final numerical review reports no remaining actionable findings. The source review preserves its unestablished reference-frame/correction qualifications.

### Local module timing and RSS — not full MCP/server/S3 evidence

Environment: **Node v24.14.0, Windows (`win32`), x64**, local `tsx` loader, pinned Astronomy Engine 2.1.19, **one-place GeoNames fixture**, no forced GC or provider requests. Fresh-process annual catalog queries for 2025/2026/2027 took **425.67 / 460.45 / 375.04 ms cold**, **1.54 / 1.10 / 0.99 ms warm**; warm results were byte-identical. All 21 pairs were screened in each year. Per-year signal evaluations were **85,790 / 85,009 / 85,600** across pairs; maximum single-pair/year counts **5,296 / 5,477 / 5,715**, below the fixed 30,000 budget. Final annual cache is bounded to three years. These timings vary by machine/load and are not a service SLO.

A cold **four-hour default query** also synchronously builds the 2026 annual inventory. The retained [reproduction probe](planet-pair-module-memory-probe.mjs), run from repository root, records its command/environment/query, raw byte/KiB memory values, numerical counters and an ignored JSON report:

```powershell
node --import tsx docs/operations/planet-pair-module-memory-probe.mjs
```

Verified retained-probe run: **380.80 ms cold / 5.15 ms warm**, result **38,577 bytes**, one returned event, 21 screened pairs, 85,009 signal evaluations, max pair 5,477. RSS was **74,285,056 bytes (70.84 MiB)** after imports/fixture, **151,355,392 bytes (144.34 MiB)** after the cold query; `process.resourceUsage().maxRSS` reported **152,228 KiB (148.66 MiB)** peak. No unresolved interval was observed in these finite runs; completeness remains uncertified. The raw local report is `dist/pair-module-memory-profile.json`; regeneration overwrites only that ignored measurement output.

This measures the whole default `searchSkyEvents` module query; peak RSS covers the process lifetime, including the loader and imports. No forced GC occurs, and one cold/warm run is not a statistical benchmark. It **does not** include MCP transport, a production place index, the full server, production concurrency or actual S3 behavior. Those remain separate integration/S3 evidence; the direct-module measurements must not be quoted as closing that gate. The earlier ad hoc probe measured roughly 395 ms and 148.4 MiB peak; the retained probe supersedes it as the reproducible command and exact recorded values.
