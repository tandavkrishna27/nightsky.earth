# Optional sky continuation and acceptance — 17 October 2026

## Scope

Continue local V1 from `ca16f12`; no deployment or historical downloads. Three parallel lanes: bounded live diagnostics, usage-preserving activation setup, and complete optional-tool journeys/native handoff. Internal package remains 1.0.16 because packaged skills and manifests are unchanged in this wave.

## Changes and reviews

- Added a four-request continuation diagnostic with durable reservations, fixed endpoint allowlist, zero retries, 90-second batch deadline and 256 KiB per response (1 MiB accepted total). Only fixed error classifications are persisted; no credentials or raw response bodies.
- Added fresh sky-ledger initialization from verified nonzero usage. Existing/checkpoint-only/corrupt state cannot be reset; all selected providers require current complete usage and allowance evidence. No private ledger was initialized.
- Added combined controlled Hyderabad Geminids, stargazing, astrophotography and comparison tests. All 20 registered handlers are covered for optional-source failure isolation. Distinct forecasts remain separate. This is not a native model test.
- Independent reviews found no blocking issue in the diagnostic or usage initializer. Elevated focused checks passed: 7 diagnostic/MCP journey tests and 26 quota/setup tests.

## Live continuation results

Executed one packet at 14:36 UTC on 17 October 2026: 4 requests, 2,343 response bytes, 4.000 seconds, no retries.

| Capability | HTTP | Bytes | Validated outcome |
| --- | ---: | ---: | --- |
| NASA DONKI GST | 503 | 121 | Unavailable, upstream server error |
| AstronomyAPI Moon positions | 200 | 1,005 | Available, one validated position |
| JPL SBDB Ceres | 200 | 299 | Available identity |
| JPL Horizons | 200 | 918 | Unavailable; provider application error, no table, expected schema version absent |

JPL diagnostic used the identity returned by SBDB, not a guessed SPK ID. The request is documented-compatible, so no speculative adapter change was made. Exact upstream error remains unclassified because raw bodies were intentionally not retained. One additional targeted public-error diagnostic has been requested from the owner. NASA and Horizons remain unverified; HTTP 200 alone is not acceptance.

Known cumulative additional-source usage after both packets: 7Timer 1, Dark Sky Planner 1, AstronomyAPI 2, NASA 2 and JPL 4. These are observed attempts, not a claim of provider credits or a complete account allowance. New activation snapshots must include any subsequent calls and other consumers.

## Activation and native experience

See [activation follow-up](sky-activation-followup-20261017.md) and [native handoff](complete-optional-native-handoff-20261017.md). AstronomyAPI public documentation has no verified numeric entitlement. The available in-app tab still showed sign-in when inspected after the owner's login message; no account quota was observed and no credential values were read from browser UI.

Do not use the old Fictionvale fixture launcher as real-data acceptance. Actual plugin installation, skills loading and full native answers remain separately evidenced steps. No publication or deployment occurred.

## Local verification and installed test session

The full suite after the continuation/quota changes passed **1,547 / 0 failed / 2 skipped** (1,549 tests, 223.775 seconds). The subsequently added native launcher passed six focused tests, including cleanup after journal/listener/app failures; the additional JPL error diagnostic passed four offline tests and has not been run live. These overlapping/late-added results are not summed into a fabricated full-suite count. All are registered in aggregate CI. TypeScript and server/package builds passed.

The owner explicitly approved a real-data local test: ten minutes, eight requests maximum, 8 MiB accepted total, no retries or deployment. `serve-native-bounded.ts` reuses injected transport, fixes HTTPS endpoints, preserves the existing core ledger, and keeps optional sky sources unadmitted. Review caught a shutdown ordering issue; nested cleanup and failure-injection tests fixed it before launch.

The existing `nightsky@nightsky-native-acceptance-20261017` installation was updated through the supported CLI to **1.0.16**, not duplicated. Package SHA-256: `bb7e3e255262b00750e46562bdf9ddf544e835e5d7ba9391dbe7f1e5ce1bd927`. Real API-mode launcher started at `http://127.0.0.1:8765/mcp`; an HTTP inventory check returned 20 tools without any provider call. This proves local transport, not native-host skill loading or answer acceptance. The owner was asked to refresh/select the plugin and paste the complete Hyderabad planning answer.

The extra JPL-only public-error request was explained but has not received affirmative authorization; its script is offline preparation only. No extra JPL request is implied by approval of the separate native session.

## Real tool-level Hyderabad plan

Within the same approved eight-request native-session envelope, the coordinator called the actual HTTP MCP resolver and aggregate planner (no model). Hyderabad was resolved by Geoapify with source-verified Asia/Kolkata. The plan requested 17 October 2026 22:00 to 18 October 04:00 IST. Five source requests returned HTTP 200: Geoapify geocode and nearby places, MET Norway, WeatherAPI and OpenWeather; **162,202 accepted bytes**. The three separate forecasts contained **9 / 7 / 2 samples** respectively. Overall weather remained partial because evidence is incomplete; no forecast averaging or site-access verification was inferred.

Normalized local evidence is retained in ignored `dist/native-real-hyderabad-plan-20261017.json`, labelled `synthetic:false` and `nativeModel:false`. This establishes the assembled real API/MCP planning path, not complete native skill loading or the owner's answer acceptance. Three of the eight request slots remained at this observation; the original ten-minute deadline was not extended.
