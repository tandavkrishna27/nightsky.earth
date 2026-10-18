# Native request reliability correction — 18 October 2026

## Scope and status

Local correction to the [native timeout investigation](native-timeout-investigation-20261018.md), internal package **1.0.23**. No deployment, scraping, historical downloads, new external API requests, credential changes or quota resets. The failed owner conversation remains **not accepted**; this correction does not prove the cause of the full five-minute host wait. Original ticket counts remain **12 Done / 9 Partial / 6 Not started**.

## Implemented changes

| Area | Correction | Preserved limits / boundaries |
| --- | --- | --- |
| MCP admission | Independent per-IP tool and protocol counters; startup/enumeration no longer spend tool allowance | Tool default 60/min; protocol default 120/min; shared global 600/min, concurrency 20, key cardinality 10,000 and tool subject gate remain |
| Batch handling | Reject JSON-RPC arrays with HTTP 400 after charging protocol/global traffic, before tool dispatch | Prevents multiple tool calls bypassing the individual-tool budget; singular MCP requests remain supported |
| Request diagnostics | Generated UUID response header and ingress/completion events; fixed method/tool and limiter-reason labels; one completion on finish/disconnect | No raw arguments, query strings, locations, IPs, caller IDs, credentials, headers or response bodies logged by the diagnostic events |
| Optional-source diagnostics | Public Universe start, reservation, headers, body-read, parse, timeout/failure and actual settlement phases, correlated to generated MCP identity | Original 15-second deadline, single flight, quotas, cooldown and retained underlying work ownership unchanged |
| Workflows | Valid strict catalogue schema examples, UTC window and top-level display zone, shortlist 1–6, exact lexical reference queries | Full plans preserve core astronomy/weather results when optional sources fail; focused reference/discovery questions need not fetch unrelated forecasts |
| Failure isolation | Synchronous throws and rejected logging promises cannot change source success or admission | Sink errors are swallowed; no source retry, automatic activation or deadline increase |

`maxRequestsPerWindow` now controls individual tools/call requests only. Operators needing a smaller protocol allowance configure `maxProtocolRequestsPerWindow` explicitly. Existing host/proxy protections remain. Body-parser rejections happen before this route's diagnostic hook and therefore have no hook correlation event. Completion means transport completion/disconnect; a separate source settlement event distinguishes underlying work that still owns its admission slot.

## Review and regression evidence

Independent admission and workflow reviews completed; a whole-change review identified one P2: configured source logging discarded an asynchronous logger promise. A new regression reproduced the unhandled rejection; returning the promise fixed it. The corrected configured path also verifies generated HTTP/MCP/source correlation and rejects caller-data leakage. No other material review findings remained.

- Admission regression first reproduced startup traffic exhausting the old shared allowance; corrected startup/tool separation, protocol/global/tool rejection reasons and batch rejection pass.
- Transport regressions cover phase ordering, redaction, timeout before uncooperative fetch settlement, synchronous and asynchronous sink failures.
- Workflow examples are parsed by the real strict tool schemas; an overbroad core-first requirement for focused discovery was corrected after review.
- Affected combined run: **53 passed / 0 failed**. Final configured integration rerun after strengthening result-status assertions: **7 passed / 0 failed**. Counts overlap and are not added.
- All three TypeScript projects passed. Plugin build, canonical ZIP, Codex/Claude local package verification and three compiled synthetic runtime checks passed; external provider attempts in those checks were zero.
- Full-suite final rerun: **1,778 passed / 0 failed / 2 skipped** (1,780 total). The first full run caught five stale host-aware skill phrase assertions for the previous question-count wording; those assertions now match the reviewed one-or-two-question guidance. The focused 13-case skill rerun and complete final rerun pass.
- CI explicitly repeats native admission/proxy/body regressions on both supported operating systems.
- Owner approved the next 30-minute/twelve-request native session after checks and CI; it was prepared at the implementation checkpoint and subsequently executed as recorded below. Its bounded diagnostic journal aborts the session on write failure; a synthetic failure check confirms zero dispatch after journal failure.

## Local package identity

Same plugin identity: `nightsky@nightsky-native-acceptance-20261017`; same loopback endpoint `http://127.0.0.1:8765/mcp`. Installed through the supported CLI; all **15 installed files** match the prepared Codex package. Claude archive prepared, not installed or accepted.

| Artifact | SHA-256 |
| --- | --- |
| Compiled backend | `22dba3f8bc8562feea7f9a6cbc5212627d26076583e7725226ce9aea235dac07` |
| Local Codex ZIP | `47bedccb0fda29a9d5fce5cbe89870ac489a658d9b93a8ac2a7597590dc309c5` |
| Local Claude ZIP | `7d449d343e7ea3e7524a09839c39db207894b63f8e91bcd2ebe283097eb434f5` |
| Canonical placeholder-endpoint ZIP | `30a34826c06882b6c7322625c9b6acd180490f491f4337a76199b77799047bd2` |

## Executed native preflight (same day, after implementation CI)

Implementation commit `433fb9bc50f1eb650dc38956f563edc0a87436bb` passed all six [exact-commit CI jobs](https://github.com/tandavkrishna27/nightsky.earth/actions/runs/39104721900). The owner then-approved session started at 06:46:47.853 UTC, expires 07:16:47.853 UTC (12:46:47 IST), and preserves existing ledgers. Its allowance is twelve attempts with independent caps: Geoapify 3, Public Universe 4, DarkSkySites 2, and each forecast provider 1. Maximum one MiB per body/twelve MiB total, no retries, raw bodies, history, scraping or deployment.

| Native call | Observed tool latency | Outcome |
| --- | --- | --- |
| Resolve Hyderabad, India | 555 ms | Available; source-verified Asia/Kolkata snapshot |
| Calculate astronomy, 20:30–23:30 IST on 18 October | 36 ms | Available; full requested interval astronomically dark; local engine returned dated Moon evidence |
| Optional catalogue discovery, same place/night/window, naked eye, shortlist 2 | 13,690 ms | Available; Moon and HR 617 with bounded geometric windows/samples, not guaranteed sightings |

All three generated MCP identities have matching ingress/completion evidence, HTTP 200 and `completed`, with the source attempt and phases correlated to discovery. Two provider requests were used: Geoapify 2,605 bytes and Public Universe 289,862 bytes (292,467 total accepted); weather and light-pollution allowances remain unused at this checkpoint. No raw response files were retained.

The optional source returned HTTP headers about 13.5 seconds after dispatch; parsing/normalization then completed before the unchanged fifteen-second deadline. This is latency before headers at the guarded transport boundary, not proof that provider computation alone caused it. The acceptance guard buffers its bounded body before returning a Response, so source `headers` is the configured-fetch boundary; the additional `session.headers` event marks actual network header receipt. One success this close to the deadline does not establish dependable latency.

These coordinator calls used the native integration from an existing chat. They do not establish fresh-startup storm behavior, automatic skill selection or a complete beginner conversation. There was no five-minute wait or rate-limit rejection in these three calls. The original five-minute incident is not retrospectively proved resolved. The owner was asked to refresh/select the same installed plugin in a fresh normal chat and paste its full planning answer. No uninstall is needed.

## Remaining acceptance

The active bounded session uses the new diagnostic sink and preserves existing counters. Previous allowances are not extended. Refreshing a package alone does not start a backend; this session stops at its recorded expiry. Source latency, the exact original rejection gate, owner answer quality and complete native-host acceptance remain open. Claude testing remains deferred. Hosting/publication gates are unchanged.
