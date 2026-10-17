# Multi-weather local implementation wave — 2026-10-17

## Scope and current evidence

Implements the reviewed multi-weather activation plan through local code, fixtures, packaging and CI preparation. No credentials transferred, live provider calls, historical downloads, deployment or publication. Original ticket totals remain 12 Done / 9 Partial / 6 Not started; weather work revalidates and extends the existing local deliverables.

| Slice | Result |
| --- | --- |
| Shared contracts | Registry IDs, collection interface, optional source outcomes; independent review passed |
| Persistent quota | Durable reservation before requests, single-process lock, conservative recovery, preserved discovery limits; review fixes passed |
| WeatherAPI | Free-shaped hourly adapter, bounded permitted cache, missing precipitation semantics explicit, durable errors/timeouts; review fixes passed |
| OpenWeather | Five-day/three-hour adapter; native accumulation intervals, no invented hourly values, cache disabled pending rights; review fixes passed |
| Conditions/planner/compare | Shared collection, independent sources, isolated failures; stale/unusable evidence cannot yield favorable judgments; legacy invalid-source rejection restored |
| Runtime/operator | Explicit source admission, missing keys/quotas unavailable, shared quota lifecycle, valid absolute paths, Geoapify-only discovery and per-release evidence |
| Workflows/CI/harness | Five skills and canonical docs updated, new tests registered once, compiled real-adapter fixture smoke and synthetic measurement |

Reviewed changes include timeout locks held until underlying work settles, persisting discovery backoff before body buffering, UNC rejection, cache error containment, 403 quota classification, stale evidence gating, legacy source validation and graceful shutdown. Read task reports in local ignored `.superpowers/` for development RED/GREEN details; committed code/tests are durable evidence.

## Verification status

- Per-task reviews and targeted tests passed after fixes.
- Codex/Claude package verification passed with five workflows per host; neither installation nor submission readiness is claimed.
- Initial integration suite: 1,238 tests, 1,234 pass, two failures, two skips. Both legacy source-validation regressions were fixed and 31 targeted cases passed.
- Final full suite at code commit 12644f0: 1,251 tests; 1,249 passed, zero failures, two skips (182 seconds). TypeScript, production build, compiled three-source API fixture smoke, full/resolver-only standalone runtimes and eight offline review cases passed. Synthetic measurement completed; it does not establish live performance. Broad final review approved offline scope with no Critical/Important findings. Exact-commit CI is checked after push and reported separately.

## Account and activation limits

Geoapify Free confirmed; WeatherAPI trial automatically changes to Free on 2026-10-24; code avoids trial-only fields. OpenWeather Services confirms Free five-day three-hour forecast and 60 calls/minute, not hourly/daily products. Email confirmation/key activation still need validation. GeoNames signup remains blocked; Geoapify-only configuration is supported.

OpenWeather caching remains disabled until permission is resolved. WeatherAPI precipitation amount/probability remains missing until documented intervals/meaning can be represented correctly. Neither omission is silently filled from another service. Actual independent-model agreement is not established merely by provider names.

## Remaining sequence

1. Finish broad review, final local checks, documentation and exact-commit CI.
2. Privately configure account credentials, verify allowances and initialize the checkpoint explicitly; complete source-admission details.
3. Present and obtain the exact bounded live matrix authorization (plan task7). No automatic public-provider traffic in CI.
4. Run actual configured-service measurements and Codex owner journeys; fixtures are not live/accuracy evidence.
5. Continue separately tracked historical API feasibility, event gaps and remaining geographic query combinations. Deployment/publication remain later owner gates.

Decisions: keep OpenWeather cache empty pending permission; add explicit admitted-provider configuration; malformed legacy source metadata still rejects while new collection failures isolate per source. These preserve source policy, backward compatibility and visibility of missing evidence.

## Deferred minor review notes

Contract literals are repeated across TypeScript/schema definitions; one over-cap contract fixture also violates uniqueness; cache byte-cap test isolation can be strengthened. Review classified these as nonblocking coverage/maintenance issues, not verified runtime failures.


### CI portability correction

The first exact-tip CI run (`39009140223`, commit `613b4fc`) found a Linux-only shutdown-fixture failure: the test signalled after TCP connect with incomplete HTTP headers, without proving an active server request. Test-only fix `e0f462f` sends complete POST headers with an unfinished body and waits for the server request-event acknowledgement before shutdown. It preserves timeout and retained-lock assertions. All 39 affected local tests and TypeScript checks passed; production shutdown code was unchanged. Replacement exact-tip CI is reported separately.

The same CI run found Windows runner temporary paths using a legitimate 8.3 alias (`RUNNER~1`). The quota guard compared path strings against expanded realpaths and rejected them. Reviewed fix `5e8aed6` compares directory identity after checking every ancestor; network/device/alternate-stream, reparse and hardlink protections remain. An actual short-path regression exercises alias lock exclusion and retained quotas. The root reran 29 quota/runtime tests with zero failures and no skips, plus TypeScript checks. Replacement full suite at code commit `5e8aed6`: 1,252 tests, 1,250 passed, zero failures, two skips (183 seconds). TypeScript, plugin build and compiled three-source fixture smoke passed. Replacement exact-tip CI remains the final remote gate.
