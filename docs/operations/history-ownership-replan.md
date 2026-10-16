# Retained history ownership replan — 16 October 2026

This is an offline proposal that resolves the four held owners while preserving every required cell-hour and every retained observation. It makes no provider request and grants no acquisition allowance. The frozen inventory remains historical evidence; a pinned temporal overlay describes the new proposal.

The [complete overlay](data-pilot-evidence/2026-10-16-history-ownership-replan.json) is 8,066 bytes, SHA-256 `3e7c22f35afa2f44e59bedafafc0226d8d4a373c163e0de63ece38cd2c8f3235`. It binds frozen plan `0b296d22142fea417a71299e17009536f82b14417f33eb4b38baa2ff307d2b12` and retained reconciliation `a5cc2399ca627fbf23a3a776182f93235c37dab2bd639c954d7ed5d1a200a2ba`. The reconciliation remains the authority for observed hours, including retrieved nulls and raw/decoded lineage. No observation values, baseline dates or quality evidence are manufactured.

## Exact change

The affected owner set is rows `243`, `244` × columns `456`, `457`, `458`, `459`: eight frozen owners, 32 acquisition cells, 17 required cells. Four neighboring owners join the original four held owners. Only **1990-12-30T00:00:00Z through 23:00:00Z** changes. All other hours of these owners, and all other owners, preserve the reconciled schedule.

The four retained central cells remain subtracted. Four replacement rectangles cover the two outer strips, using the original quarter-degree nodes:

| Area [north, west, south, east] | Required cells | Filler cells | Cell-hours |
| --- | ---: | ---: | ---: |
| [32, 48, 31.75, 48.5] | 5 | 1 | 144 |
| [32, 49.25, 31.75, 49.75] | 3 | 3 | 144 |
| [32.5, 48, 32.25, 48.5] | 4 | 2 | 144 |
| [32.5, 49.25, 32.25, 49.75] | 1 | 5 | 144 |

Every rectangle is nondegenerate and has six cells, below the ten-cell bound. Every replacement has one 24-hour monthly partition. Their complete CDS requests, canonical hashes and cell classifications are in the overlay. No new acquisition cells or filler hours are added.

The explicitly removed filler cells are `era5:31.75:48.75`, `era5:31.75:49`, `era5:32.5:48.75`, and `era5:32.5:49`, for this one day only: **96 filler cell-hours removed**. Their other hours stay assigned to their frozen owners. This changes acquisition overhead, not named coverage. It is not permission to drop a required cell or a retained observation.

| Affected-day quantity | Before replan | After replan |
| --- | ---: | ---: |
| Required source envelope | 408 | 408 |
| Retained required hours | 96 | 96 |
| Missing required hours | 312 | 312 |
| Missing filler hours | 360 | 264 |
| Missing acquisition hours | 672 | 576 |

Across the entire padded source clock, these eight owners retain **4,472,400 missing required cell-hours**. Missing acquisition hours become **8,418,624**, exactly 96 fewer. Worldwide missing required hours remain **14,422,993,824**; missing acquisition hours become **26,286,148,752**. These are exact schedule complements, not proof of scientific completeness or successful provider delivery. The earlier 373,619-parent grouping digest refers to the frozen schedule; this overlay does not claim a newly enumerated global parent count.

## Why a broader temporal replan is needed

Preserving every original filler hour is impossible even with unlimited spatial reownership. During the retained day, filler `era5:32.5:48.75` has a retained immediate southern neighbor and an immediate northern neighbor outside frozen acquisition coverage. Any nondegenerate quarter-degree rectangle containing that filler must include at least one of those neighbors. Time-specific tiling cannot remove this per-hour obstruction. The proposal explicitly changes filler overhead instead of pretending the four original 2×2 owners can each be split.

Expanding the affected owner set to eight provides three-column outer strips, allowing exact six-cell rectangles without crossing unaffected ownership. The four removed central perimeter cells are all fillers in the actual frozen inventory. The implementation fails if any becomes required, any affected retained mask changes, the affected source clock changes, or ownership is duplicated.

## Consumer contract

`schemaVersion:1`, `status:PROPOSED-EXACT-REQUIRED-COVERAGE`, and `authorization:unapproved-nonexecuting` identify a proposal. Consumers must hash-pin the overlay and match its `frozenPlanSha256` and `reconciliationSha256` to their independently pinned sources.

- `affectedTileIds` names all eight owners whose affected-day requests must be removed. `ownerOverrides` contains complete replacement override arrays for those owners, including exclusion of the whole affected day. It is not an additive list to merge with a duplicate template override.
- `resolvedBlockedTileIds` names the original four held owners. Holdback can be lifted only after checking the complete overlay proof; this field alone is not a bypass.
- `hoursUtc` gives the exact temporal domain. `replacements` are complete standard grouped planner request rows, plus a convenience `area` field equal to `request.area`. Their tile IDs are new temporal identities. Required/filler classification comes from frozen ownership.
- `removedFillerCells` and `addedFillerCells` enumerate the overhead change for every hour in `hoursUtc`. Counts are summaries; consumers must independently compare cell-hour sets and confirm required coverage, retained exclusion, disjoint replacements, and exclusion from every original affected owner.
- Unaffected owners continue to apply reconciliation `updatedOverrides`, or their frozen overrides if unlisted. No reconciliation override is silently discarded. The bounded proposal rejects any changed retained mask among its eight owners; it must be regenerated if new evidence arrives.

Do not append replacements to an unchanged static plan or use the original global disjoint-cell invariant for a temporal overlay. Original and replacement rectangles legitimately share cells at disjoint hours. A consumer must check cell-hour ownership. The original four held owners alone are insufficient: the four neighboring owners must also exclude this day to prevent duplicate acquisition.

## Reproduction and evidence

The script reads at most an 8 MiB plan and a 4 MiB reconciliation through existing hash-checked, root-constrained readers; output is bounded to 1 MiB and created exclusively. It imports no provider transport or credentials. Choose a fresh output path on replay:

```powershell
npx tsx scripts/era5/replan-history-ownership.ts . .data/history-global-proposed-20261015-v1.json 0b296d22142fea417a71299e17009536f82b14417f33eb4b38baa2ff307d2b12 .data/retained-reconciliation-20261016-v1/reconciliation-v2.json a5cc2399ca627fbf23a3a776182f93235c37dab2bd639c954d7ed5d1a200a2ba .data/history-ownership-replan-20261016-v1.json
```

Actual replay: exit 0, the pin and byte count above. The [selected metadata fixture](data-pilot-evidence/2026-10-16-history-ownership-replan-fixture.json) preserves the eight actual owner inventories, source calendar and relevant exact retained masks for reproducible tests. It is explicitly a subset fixture, not a replacement for either full hash-pinned source.

Focused verification: `npx tsx --test tests/era5/replan-history-ownership.test.ts` passed four tests, exit 0. Tests independently enumerate every affected owner's complete calendar, confirm only 24 hours are removed, compare exact required/retained/replacement sets, check deterministic ordering and actual inventory counts, and exercise source hash, exclusive-output and path-boundary failures. The initial implementation stub failed both behavioral tests (exit 1) before implementation. `npx tsc -p tsconfig.era5.json --noEmit` passed, exit 0. Full-suite and executor integration verification belong to the coordinating lane.
