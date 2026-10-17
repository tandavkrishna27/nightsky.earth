# Additional sky providers: local V1 implementation

Date: 2026-10-17. Branch: codex/plugin-v1. Owner authorized implementation, subagents, tests, documentation, push and CI; no deployment.

## Accepted scope
Extend the existing API-based backend with 7Timer observing conditions, Dark Sky Planner moon-aware windows, AstronomyAPI object/position capabilities, NASA DONKI context and selected JPL small-body capabilities. Preserve local routine astronomy, source identity, unavailable states, fixed endpoints, credential redaction and persistent quota reservations. DarkSkyLab remains excluded pending confirmed free external API access. Hosting migration is deferred.

## Execution and ownership
| Step | Work | Dependency | Evidence |
| --- | --- | --- | --- |
| A | 7Timer adapter, range-aware weather schemas, weather configuration, tests | Existing weather contracts | Focused adapter/schema tests |
| B | Dark Sky Planner and AstronomyAPI adapters and tests | Existing upstream controls | Input/response, time/unit and failure tests |
| C | DONKI and JPL adapters and tests | Existing quota/control boundaries | Serialization, redaction, identity tests |
| D | Runtime configuration and MCP tool exposure, skill guidance | A/B/C contracts | Transport and composed regression tests |
| E | Review fixes, tracker/docs, build/typecheck/full tests | D | Recorded commands and outcomes |
| F | Commit/push and exact-commit CI | E | Commit SHA and CI results |

## Design decisions
- New source tools are additive; existing 14-tool default stays compatible unless new source capabilities are explicitly configured. 7Timer joins the existing weather collection when selected.
- Missing credentials/admission do not silently call an upstream. Saving keys does not grant unlimited live usage.
- Do not average provider forecasts or convert categorical ranges into invented precise measurements.
- Preserve Dark Sky Planner's strict full-window rating, but explain that a later moonset can leave a usable sub-window; do not present its rating as overall weather/site suitability.
- NASA DONKI provides event context, not local aurora probability. JPL requests are serialized and use independent source limits.
- Tests use synthetic fixtures and temporary counters. No private key or response-body dump enters Git.
- Live acceptance is separate from offline implementation. Existing historical/download limits stay unchanged. An exact bounded live proposal will identify any necessary allowance and uncertainty in free entitlement.

## Progress
- Private configuration presence checked: NASA key and AstronomyAPI ID/secret present; values not exposed.
- Parallel implementation and independent code reviews completed. Optional adapters, MCP schemas, cache, persistent quota setup, workflow guidance and CI coverage are integrated; final regression and CI evidence follow below.
- No new V1 ticket totals are inferred from these implementation slices.

## Implemented capability matrix

| Source | Local capability | Interpretation and remaining gate |
| --- | --- | --- |
| 7Timer | Weather adapter; cloud, seeing, transparency and other categorical bands | Preserve ranges; do not manufacture exact values. Existing ledgers need an explicit preserving migration before selection |
| Dark Sky Planner | `find_moon_aware_windows` | Full-window Moon constraints, not overall site/weather suitability |
| AstronomyAPI | `search_astronomy_objects`, `get_external_body_positions` | Search live checked; positions fixture checked only. Production free allowance still unknown |
| NASA DONKI | `get_space_weather_events` for GST/FLR | Research event context; operational aurora outlook remains NOAA |
| JPL | `resolve_small_body`, `get_small_body_ephemeris` | Identity separate from one-epoch observer position. Live position acceptance remains unresolved |
| DarkSkyLab | None | No verified free external API; excluded |

Charts/images are not implemented in this revision. Local astronomy remains the routine calculation source. A successful HTTP response does not by itself establish a valid result or accuracy.

## Configuration and setup

Private credentials remain in `C:\Users\TK\.nightsky\providers.env`; no values are copied into Git or package files. Environment names are documented in `.env.example`. Optional source selection is `NIGHTSKY_SKY_PROVIDERS`; source admission is the separate `NIGHTSKY_SKY_ADMITTED_PROVIDERS`. Only admit sources whose intended use and remaining free allowance have been verified. Saving keys alone makes no requests.

Sky sources use a separate absolute `NIGHTSKY_SKY_QUOTA_STATE_PATH`; do not reuse `NIGHTSKY_QUOTA_STATE_PATH`. Run this offline proposal from the plugin worktree after setting selected sources in the private environment:

```powershell
node --env-file=C:\Users\TK\.nightsky\providers.env --import tsx scripts/initialize-sky-quota.ts
```

The proposed 20/hour, 100/day and 1,000/month limits per sky provider are conservative operator ceilings, **not verified vendor entitlements**. After checking actual remaining allowances across every consumer, set the private `NIGHTSKY_SKY_QUOTA_VERIFIED_UNUSED_BUDGET=yes` and nonsecret `NIGHTSKY_SKY_QUOTA_VERIFICATION_EVIDENCE`, then run the same command with `--initialize`. Existing state cannot be reset. Account usage from the diagnostic below must be included; do not attest that those allowances are wholly unused now. AstronomyAPI's unknown production allowance is not resolved by its successful diagnostic.

Keep the current weather counter intact. Do not initialize a fresh weather ledger to enable 7Timer. Follow the preserving migration in [API setup](api-mode-local-setup.md). No production selector or private quota file was changed by this integration diagnostic.

## Bounded live diagnostic — 17 October 2026

Owner requested integration and live testing, confirmed the new NASA/AstronomyAPI keys unused elsewhere, and did not know AstronomyAPI's allowance. One request per endpoint was run; no retries. The exclusively created journal was flushed before each request and reservation. It contains sanitized metadata only and remains outside Git in ignored `dist/`.

| Endpoint | HTTP | Accepted bytes | Normalized result |
| --- | ---: | ---: | --- |
| 7Timer astro | 200 | 5,364 | Partial forecast, 8 samples |
| Dark Sky Planner plan | 200 | 1,675 | Valid result covering 2 dates |
| AstronomyAPI M42 search | 200 | 606 | Valid result, 1 object |
| NASA DONKI GST | 503 | 121 | Unavailable; not retried |
| JPL SBDB Ceres | 200 | 299 | Available identity |
| JPL Horizons | 200 | 918 | Unavailable: response did not pass validation |

Total: **6 requests, 8,983 bytes, 10.285 seconds**. No raw response bodies retained. Hyderabad elevation zero was an explicit synthetic observer input. This validates limited connectivity/response parsing, not scientific accuracy, complete coverage, native-model behavior or production source admission. The one-use diagnostic is consumed. A future corrected/live test must use a new explicitly bounded packet and account for previous usage.

## Remaining acceptance

- Confirm AstronomyAPI account allowance before sustained activation.
- NASA successful-response live acceptance and JPL observer-response acceptance remain open.
- AstronomyAPI body positions have offline coverage, not live acceptance.
- Complete plugin skills and optional tools need an assembled native-client journey test.
- Hosting, deployment and public submission remain deferred.

## Review and verification record

Independent agents reviewed provider adapters, shared MCP/cache configuration, durable diagnostic writes, packaging and the preserving 7Timer ledger migration. Review fixes included streamed response-size enforcement, source-date/identity checks, optional-tool inventory validation and using current 7Timer bands in the planner's availability report.

- `npm run check`: passed all three TypeScript configurations.
- `npm run build:plugin`: passed, compiled server approximately 624 KiB (dependencies remain external).
- `npm run plugin:package`: passed, local rehearsal package 1.0.16 with 14 default and 6 optional tool names.
- Focused adapter/MCP/quota/skill/package set: **62 passed, 0 failed**.
- Local Codex/Claude package tests: **17 passed, 0 failed**; these are package tests, not native model sessions.
- Initial full run exposed the optional-tool inventory mismatch and was fixed. A subsequent run overlapped the manifest version update, causing one metadata mismatch; the stable isolated package rerun passed. The subsequent frozen full run passed: **1,541 passed / 0 failed / 2 skipped**, 1,543 tests, 244.051 seconds.
- Full-suite result above is verified locally. Exact-commit CI will be watched after push and reported in the handoff. No failed run is represented as passing.
