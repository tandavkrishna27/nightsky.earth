# API events completion lane — 17 October 2026

Coordinator integration update: all six planner changes and regression cases are now applied on `codex/plugin-v1`. The lane handoff below preserves its original delivery boundary; see [assembled verification](parallel-completion-run-20261017.md) for the integrated result.

Reviewed implementation: **`0a157b2190c4bf19cf6022c12a8ddfe1c0ca9245`**, on `codex/api-events-completion`, from reviewed baseline `bc8de008bc60d6b47f8422cf15787584d16e2698`. A documentation-only handoff commit follows; take both local commits. Nothing pushed, deployed, installed or published. Old branch preserved; no other worktree, shared tracker, CI configuration or `tests/all.test.ts` edit.

## Exact result

- `meteorCivilGuidance` grows from two to **five unique** strict optional references: ORI, DRA and URS join LYR/LEO. [Admission evidence](API-EVENTS-SOURCE-ADMISSION.md) records four original IGN HTML pages and reuse terms. ORI keeps date-only maximum/time basis unknown; DRA keeps a general northern visibility period rather than assumed annual global activity; URS keeps published hour precision. All maxima remain separately qualified **2026** source wording, never new UTC events or recurred forecasts. NASA and IGN predictions remain separate, including the Ursid disagreement.
- `shared/nightsky/meteors.ts` exports **`METEOR_CODES`** and **`resolveMeteorIdentity(query: string): MeteorCode | undefined`**. All nineteen identities resolve independently of the twelve-model radiant subset; all 38 retained NASA event names resolve to their own codes. Ambiguous Taurid/Delta Aquariid branch names, SSS/#168 and unresolved GIA remain unassigned; prototype property names are not identities. Seven known identities still return unsupported geometry with no invented coordinates.
- `meteorCoverage.ts` now records actual verbal/civil references as context alongside ETA/ORI typical intervals. Complete activity support remains missing. `catalog.ts` reuses one civil result and describes its actual rows/source-specific precision rather than the stale two-row/all-UT wording.
- All five canonical workflows and skills now keep useful partial planning, distinguish selected sessions from peak optimization, provide bounded optional primary-source search handoffs, preserve unknowns and allow concept-only teaching without local inputs. Five offline journeys cover ordinary stargazing, astrophotography and learning under event failure, LYR 2027 without a dated maximum, and ORI date-only 2026 context. These are offline service fixtures, not model/installed-host trials.
- The [all-nineteen supported matrix](API-EVENTS-SUPPORTED-MATRIX.md) distinguishes required useful qualified behavior from unsupported exact-peak/full-season claims. Thirteen remains a proposed comparison, not a launch selection. No accepted NASA maximum, GMN coefficient/domain, actual event calculation or original acceptance count changed.

## Required coordinator integration — next executable step

Apply **all six changes** in [planner integration instructions](API-EVENTS-PLANNER-INTEGRATION.md) to root-owned `server/nightsky/planner.ts`: shared identity resolver; general/annual recurrence formatting; source maximum time basis/uncertainty; selected-shower peak filtering; one timestamped unsupported sample for a nonexistent model; and a no-model reason distinct from outside-model coverage. Keep cadence/endpoint samples when an existing model is merely out of domain; it may become usable later.

The [workflow report](API-EVENTS-WORKFLOW-READINESS.md) preserves the actual failing URS case and exact observed failure. It is not skipped or counted as a lane pass: restore the regression after root integration, add DRA/other-shower/ambiguous and partly out-of-domain cases, and run root's meteor/optional-event/four-journey checks. Root reported that its planner patch and five regressions were already underway; this lane has **not** inspected or tested the other worktree's patch and does not claim it fixed. The event tool itself exposes DRA/URS context now; selected-plan assembly remains this integration gate.

## Verification and test-import instructions

Independent source/science/spec review passed. One reviewer finding about a nonexistent “returned supported matrix” was corrected in all ten workflow files; scoped re-review passed. No remaining lane quality finding; planner integration remains explicitly open.

| Fresh lane check | Result |
| --- | --- |
| Event catalog, meteor inventory/peaks/radiants/typical context, meteor planner, four skill suites | **119 passed**, zero failed/skipped |
| MCP initialization, optional-event evidence, package/local-package tests | **45 passed**, zero failed/skipped |
| Strengthened inventory/identity rerun | **10 passed**, including all 38 NASA source names; this rerun overlaps the 119, not ten extra unique tests |
| `npm run check` | All three TS projects passed |
| `npm run build:plugin`, `npm run plugin:package` | Passed; local rehearsal only |
| `node --import tsx scripts/verify-local-plugin-packages.ts` | Codex/Claude deterministic packages, five exact canonical references per host; not installed/submission-ready |
| Local document links / whitespace | Eight affected document links/fragments resolved; package verifier checks skill-local references; whitespace checks passed |

No new compiled test file was added. New tests are in **already imported** `tests/events/catalog.test.ts`, `tests/events/meteorCoverage.test.ts` and `tests/skills/local-experience.test.ts`; coordinator need not change the aggregate import list for these lane changes. Restore the URS regression inside the existing skill file or add it to the existing meteor-planning file during root integration. Full combined suite, integrated type/build/package verification, measurements and exact-commit CI remain coordinator-owned; no lane full-suite/CI claim is made.

## Remaining finite gates

Missing exact maxima, seven radiant models, full-season domain validation and SSG annual context remain source-specific limits, not blanket blockers for every qualified session. Best-peak requests lacking year-qualified evidence need a named source/year/field verification or a user-chosen provisional window; no fake UTC clock, rate or visibility. Exhaustive nineteen-code/year completeness is not silently imposed or waived. Maintained selection/annual ownership remains undecided and no thirteen-shower subset is adopted.

Actual installed-host/model journeys, owner acceptance, configured-service measurements, global API/source and history/geography acceptance, hosted connection and publication stay with their existing gates. This lane used finite public primary-document research only; failed IMO routes were not retried. No credentials, authenticated/live API call, new dataset download, provider job, permission email or deletion occurred.
