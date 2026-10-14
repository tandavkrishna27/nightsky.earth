# Final broad branch acceptance review — 2026-10-15

**Current disposition: READY FOR LOCAL CODE ACCEPTANCE.** R1, R2 and R3 are closed by the scoped corrections and rereviews recorded below. No remaining Critical or Important finding in this review. Parent still owns final integrated tests/build/package and exact-revision CI; this review does not claim those pending gates passed. The original findings are retained as historical evidence. No implementation edits, network/provider calls, new dataset acquisition, model calls or broad suite runs performed by this reviewer.

## Scope and baseline

Reviewed working tree `codex/plugin-v1` at HEAD `55589f5` plus current staged/unstaged/untracked implementation. `origin/main` is absent locally, so branch baseline is `git merge-base main HEAD` = `a59260ae00b58e01aadfba31aef8e36ac3ef41bf`. The full committed branch contains 384 changed files; this was a risk-based broad code acceptance review, not a claim that every line of every historical document/data fixture was reread.

Read the original execution plan, global discovery design/implementation plan, implementation status, global execution evidence and source-admission record. Inspected MCP registration, request admission/metadata/privacy, selected calculation place, planner/comparison/windows/astronomy, global/regional catalogue runtime, paged file reader/format, administrative geometry, array/streamed builders, provider controls and MET fallback/cache, historical runtime validation, canonical workflows and package surfaces. Narrow offline executable probes covered the three findings below; parent owns the fresh aggregate/type/build/package/CI verification.

## Critical

None found in inspected code.

## Important

### R1 — Valid native source vintages are treated as conflicting provenance

**File:** `server/places/globalCatalogue.ts:133` (identity construction and rejection at lines 134–137).

`addSources` identifies a source by URL plus product only, then requires every other source field to be byte-identical. Different regions of a valid immutable edition may retain different OSM native vintages while sharing the canonical copyright URL and product. The normalized builder admits these records, as required by the design, but discovery throws `Conflicting source provenance` even if the differently dated footprint is unrelated to the query. Through the MCP guard this becomes a generic failed request rather than useful candidate results.

**Executed reproduction:** Built an offline catalogue with one park at latitude 0.1/longitude 0, one fully admitted local cell [-1,1]×[-1,1], and an origin at 0/0 with radius 50 km. All use OSM copyright URL/product and vintage `2026-10-01`. Search returns one candidate and complete/covered. Add one unrelated footprint at 40–41° latitude/longitude with the same URL/product and vintage `2026-10-02`: the same search throws `Conflicting source provenance`. Both builds succeed and checksummed reads validate.

**Correction:** Preserve distinct legitimate source editions (including applicable vintage/model/issue/valid-time identity) without silently overwriting them. Continue rejecting contradictions within the same source edition. Test distinct native vintages, true same-edition contradictions, and composed planner evidence. The planner's existing `dedupeSources` uses full JSON identity and does not contain this exact conflation.

### R2 — Unrelated global footprint evidence prevents small local searches

**File:** `server/places/globalCatalogue.ts:180` (unfiltered footprint walk and source accumulation at lines 184–185; candidate scan gated by `!stop` at line 266).

Before searching any candidates, every query traverses the complete installed footprint tree and adds every footprint's source to its 64-source output budget. Thus unrelated installed regions can exhaust source/leaf/directory/time budgets for a tiny query. On any such stop the implementation skips candidate traversal entirely. This is a routing defect demonstrated with a tiny catalogue, independent of the remaining real-world scale gate.

**Executed reproduction:** One local cell and one local park as above, plus 64 disjoint remote cells at latitude 40–41° and longitudes 40–104°, with separately named source products and a shared vintage. All remote cells are thousands of kilometres outside the 50 km scope. Search returns zero candidates with `footprintStatus: covered`, `searchCompleteness: budget-limited`, `stopReason: source-limit`, and 64 sources. Without remote cells it returns the local park completely.

**Correction:** Route footprint reads and collect coverage evidence according to the actual geographic/administrative scope. Unrelated footprints must not consume query/output budgets or prevent a covered local search. Preserve explicit budget-limited results when relevant evidence itself exceeds bounds. Add tests for unrelated source-heavy cells and multiple footprint pages, including country/state scopes and combined filters. Keep selected candidate provenance in the public result even when ranking discards other records. Also check composed plans when a valid discovery result already approaches the 64-source cap; the composer adds additional evidence sources.

### R3 — Later darkness intervals are omitted from valid planning opportunities

**Files:** `server/nightsky/windows.ts:10`; analogous first-only weather filtering at `server/mcp/registerTools.ts:218` and `server/mcp/registerTools.ts:398`.

The astronomy contract correctly labels `astronomicalDarkness` as the *first* interval and exposes all calculated astronomical intervals in `solarThresholdIntervals`. The window composer nevertheless uses only the first interval. A valid ≤24-hour requested session can span morning darkness, daylight and evening darkness; a target visible only during the evening then gets no candidate window. Direct and composed weather night-context filtering likewise drops evening forecast steps.

**Executed reproduction using real local Astronomy Engine calculations:** Named fixture point latitude 0/longitude 0, timezone `Africa/Accra`, window `2026-10-15T00:00:00Z` to `2026-10-16T00:00:00Z`. Astronomy returns darkness 00:00–04:33:01.849 and 18:58:34.967–24:00. Milky Way core visibility is 10:11:31.149–22:09:33.189. `composeCandidateWindows('astrophotography', window, astronomy, [target], undefined)` returns `[]`, losing the valid 18:58–22:09 opportunity.

**Correction:** Intersect targets and filter forecast steps against every astronomical threshold interval in the requested window. Preserve separate intervals; never bridge daylight by expanding the first interval. Keep a compatibility fallback only where intentionally supported historical fixture/service outputs lack interval rows. Add composed planner and direct weather regressions for split darkness, ordinary overnight windows, no darkness and full-window darkness.

## Minor

No additional actionable minor findings raised. Avoid spending acceptance effort on formatting while the three behavioral defects remain.

## Uncertainty and remaining gates

The source admission record explicitly leaves the actual global edition, full footprint union, real boundary admission, acquisition/build budgets, ODbL public offer, measured intended-scale build/storage/refresh/host capacity, production hostname/TLS/publisher identity, hosted logging and retention, official package validation, actual installed-client/model matrix and publication/pilot evidence open. Those are not treated as code defects or inferred complete from synthetic tests. Existing regional/historical artifacts do not establish global completeness, meteor full seasons or a 30-year baseline. No deployment/publication is implied by this review.

After fixes, rerun targeted reproductions/regressions and required aggregate/type/package/build checks, then review the corrected diffs and record exact-revision CI. The current tested local build should not yet receive final acceptance because R1–R3 are user-visible defects.

## R3 scoped rereview — first correction

Explicit-target composer now reproduces the valid 18:58:34.967–22:09:33.189 evening interval. Both direct and composed weather paths use the shared all-interval extractor; explicit empty rows do not fall back, legacy first-interval meaning is retained, and the additional weather-context array is bounded at 24. The focused MCP regressions inspect actual calculated split/none/full/overnight behavior. Meteor help now follows the authoritative twelve-code alias map.

**R3 remains open for one omitted consumer:** `server/nightsky/suggestions.ts:12–14` still filters every suggested target against only `astronomicalDarkness`. A new narrow rerun of the original real-calculation 24-hour Accra fixture returned only Jupiter for `suggestVisibleTargets('astrophotography', ...)`; its candidate window is 02:03–04:33. The explicit Milky Way target correctly returns 18:58–22:09 with the fixed composer, proving the no-target suggestion path still discards the evening opportunity. Apply the same all-interval helper in suggestions and cover the actual no-target planner flow before closing R3.

## R3 scoped rereview — accepted after suggestions correction

The remaining suggestions consumer now uses the same all-interval helper, preserving target ordering and the three-target cap. Independent rerun of the exact actual-calculation fixture now suggests Milky Way core, Moon and Jupiter and returns the evening Milky Way interval 18:58:34.967–22:09:33.189 along with distinct additional opportunities; it does not bridge daylight. Inspected the actual no-target HTTP MCP regression, direct/composed weather regression and author-reported final 55/55 focused tests plus all three typechecks. R3 is closed for local code acceptance, including its no-target path. R1/R2 remain pending scoped rereview; this is not overall branch acceptance yet.


## R1/R2 scoped rereview — accepted

Inspected final `globalCatalogue.ts` corrections and focused regression additions. Source identity now includes URL/product/model/vintage/issue/valid times; canonical field ordering avoids false contradictions while genuinely contradictory same-edition metadata still fails. No silent source overwrite is introduced.

Origin coverage uses conservative footprint page bounds and row relevance. Geographic filtering remains authoritative for combined scopes; remote administrative tags cannot pull a disjoint cell into an origin search. Country/state-only footprint scans use an independently bounded portion of remaining work, then continue relevant membership search when coverage proof stops. Child coverage reads/bytes are charged back to the original budget; the parent absolute deadline is unchanged. Coverage gaps remain partial and budget-limited, with no complete coverage or complete ranking claim manufactured. Relevant source-limit exhaustion still stops honestly; malformed provenance is not caught as a budget event.

Independently ran exactly five targeted regressions, all passed: distinct source editions/model-time identities, same-edition contradiction and canonical ordering, local query with 64 remote footprint editions under a two-leaf limit, state member retained with 64 unrelated footprint pages under a four-leaf total, and one-leaf/one-byte coverage partition preserving the original deadline. The state test demonstrates four total leaves and partial/budget-limited coverage while returning the member; no aggregate ceiling is raised. No broad suite was rerun by this reviewer.

**Combined acceptance:** R1, R2 and R3 are closed. No remaining Critical/Important issue from this review. Ready for local code acceptance once the parent completes the current integrated validation/CI gates. Global data acquisition/admission, intended-scale measurements, installed-client proof, hosting and publication remain the explicitly documented separate gates; no additional requirement is invented by this conclusion.
