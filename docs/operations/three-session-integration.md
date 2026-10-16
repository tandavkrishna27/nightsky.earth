# Three-session integration — 16 October 2026

Integrated into `codex/plugin-v1` from baseline `b6bb572`:

| Lane tip | Delivered | Remaining gates |
| --- | --- | --- |
| Weather `14069e0` | Deterministic 27-parent proposal; exact 363-child/1,052,544-cell-hour preservation and 12-owner retained/overlay audits. | All 27 form selections; explicit +11 submissions decision; executable contract/runtime packet and allowance. Current executor cap remains 16. |
| Geography `88f3488` | Offline-default bounded receipt/preflight and strict policy preparation. | Actual body allowance, raw/native evidence, trusted policy admission bound to production invocation, Natural Earth admission conditions, separately approved build and measured fit. |
| Events `219e511` | DRA, NTA, STA and HYD annual guidance; 14 covered codes. | Five guidance gaps (AND, SDA, SSG, URS, ZPE); precise seasons, missing radiants/maxima and historical ETA/ORI method evidence remain open. |

All three lane tips had six successful exact-commit CI jobs before integration. Their handoffs remain detailed evidence: [weather](SESSION-weather-HANDOFF.md), [geography](SESSION-geography-HANDOFF.md), [events](SESSION-events-HANDOFF.md).

## Integration changes

The branches merged without conflicts. Registered both new geography TypeScript tests in `tests/all.test.ts` and the policy preparation CLI in `tsconfig.tools.json`. Python tests are already discovered automatically in CI. Node jobs now explicitly provision Python 3.12 for the registered cross-language contract test. Consolidated the tracker without changing original acceptance totals: **12 Done / 9 Partial / 6 Not started**.

The events readiness/source documents retain historical ten-code snapshots. Current integrated guidance is fourteen codes; this does not change the 38 annual maxima, 12 radiant models, 19-code union or absence of accepted complete UTC seasons. Approximate annual wording remains unfiltered guidance with requested-window overlap not evaluated.

## Verification

Combined local checks: Node 941 passed / one existing skip; ERA5 176 passed; OSM 164 total / four environment-dependent skips; all three TypeScript projects passed; build, plugin runtime, package and eight offline review cases passed. Independent integration review found no actionable issues.

The first combined OSM run exposed four synthetic-worker failures under this checkout's Windows virtual environment. Its launcher attempted an additional process and correctly hit the one-process Job limit (exit 101). Production already launches the base interpreter. Tests now use the same base interpreter with isolation flags; the termination-intent test also requires the intended deadline reason to prevent false success. Targeted 24-test and full 164-test reruns passed; independent review confirmed guards unchanged. No production receiver behavior changed.

Lane CI is not substituted for combined CI. The exact integrated commit is pushed and its six-job result recorded in the delivery handoff.

## Next sequence

1. Review every exact proposed weather selection in the current CDS form; settle the proposed job-count change before preparing an executable packet.
2. Complete the geography policy-to-production binding and concrete receipt preflight; resolve remaining event evidence in parallel where possible.
3. Seek only ready, bounded acquisition approvals. No permission is supplied by this integration.
4. Assemble approved actual data, measure it locally, test the complete plugin and finish the final audit.

No dataset downloads, provider jobs, deployment or publication occurred. No promised global coverage or scientific gate is closed by this integration.
