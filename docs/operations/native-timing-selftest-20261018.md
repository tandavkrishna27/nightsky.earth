# Native Codex timing self-test — 18 October 2026

## Scope

User requested that the agent run the focused1.0.28 timing test. Two fresh read-only Codex CLI cases used installed1.0.28 skills and native MCP tools against the local application. Hyderabad coordinates17.385,78.4867 and Asia/Kolkata were supplied through a fixed test record; astronomy and packaged event calculations were real. No location provider, live weather, historical service or dataset was contacted. This is native-client acceptance evidence, not a fresh desktop/UI session, location-source validation or live-weather test.

The configured CLI model gpt-6-luna was rejected by the signed-in account before product calls. A visible model from local metadata, gpt-5.6-sol, was selected only for the test process; saved user configuration was unchanged. A temporary invalid client override was removed before inference. Initial unavailable-weather fixture lacked required attribution, causing two fixture-related tool errors; attribution was corrected and both cases rerun. Earlier attempts remain retained separately, not overwritten or counted as final acceptance.

## Final run

Local evidence: `.superpowers/sdd/2026-10-18-publicuniverse-v1/native-timing-selftest-final/` (ignored scratch). report.json, per-case JSONL and final answers retained. Each case had a180second deadline and bounded output. Both exited0 without timeout. NightSky data-provider attempts:0. No application credentials or quota ledger loaded/reset; no deployment.

| Case | Calls | Timing outcome | Remaining issue |
| --- | ---: | --- | --- |
| Geminids13–14December2026 |6 (4 completed,2 validation failures recovered) | Suggested10:30pm–12:30am as advice, distinct from7pm–5:20am darkness; quoted18.9% Moon and9:16pm geometric centre timing with impact unknown; quoted NASA MEO14December13:00UTC/18:30IST maximum as after requested overnight session, not guaranteed local visibility. Used dated radiant61.2degrees at00:30, broad-sky guidance and no all-night requirement. Weather honestly unavailable. | Named-city resolution was followed by unnecessary candidate-detail calls with invalid placeId-only arguments before recovery. |
| MilkyWay6–7May2027 |8 (6 completed,2 validation failures recovered) | Returned21:50 altitude0.76/azimuth120.83 and23:30 altitude20.22/azimuth131.07; chose later sample provisionally, not geometric rise. Explicitly identified05:00 as requested cutoff, not setting; fixed-core/terrain/weather limits retained. | Same candidate-detail validation inefficiency. Astronomical darkness beginning at21:00 was the requested cutoff but wording did not explicitly say so. |

The timestamps/angles quoted above were checked against native returned evidence. Peak daytime specifically was not exercised in this native case; the source maximum is18:30IST and local visibility was not evaluated. Controlled/offline daylight cases remain distinct. The test does not prove every activity, client or multi-turn scenario works.

## Decision and next sequence

Main meteor/MilkyWay timing distinctions pass in this controlled native-client setup. Complete end-to-end acceptance remains partial: record the recovered named-place/candidate-detail misuse and clipped-darkness wording as two concrete follow-ups. Do not label either a provider outage or calculation error.

Next: reconcile the original tickets and release gates against demonstrated evidence and current API/search scope, including these two findings; then decide the remaining bounded fixes before deployment. Discovery's earlier owner pass and timestamp follow-up pass remain scoped to their recorded conversations. Do not infer12Done/9Partial/6Notstarted changed from these runs alone.


## Reviewed 1.0.29 follow-up

The final installed package was replayed in two fresh read-only Codex CLI cases using the same fixed coordinates, real local astronomy and blocked data-provider transport. All 15 installed files matched the final rebuilt package. Evidence: `.superpowers/sdd/2026-10-18-publicuniverse-v1/native-timing-selftest-129-final/`. Both exited 0 without timeout; 14 NightSky tool calls (8 meteor, 6 Milky Way), all successful at transport/tool level, zero candidate-detail calls and zero data-provider attempts. No keys or quota ledger were loaded. A preliminary 1.0.29 replay preceded the final shortened opening guidance and is retained separately; only this final directory attests the final installed bytes.

- **Named-city route:** both cases used the resolved city directly for calculation/planning. The four recovered candidate-detail validation failures observed in 1.0.28 were absent. This exercises the city bypass, not the separate real API-mode candidate-details branch; that branch's argument distinction has an authored runtime/schema regression.
- **Darkness cutoff:** Milky Way response explicitly reported 21:00–04:30 within the requested window, with 21:00 a calculation cutoff rather than established dusk. It also labelled 05:00 the requested cutoff, not core setting. Returned 23:30 orientation was about 20.2° altitude / 131° azimuth; 21:50 was about 0.8°, so the later practical suggestion remained separate from geometric rise.
- **Meteor advice:** suggested 23:00–02:00 as manageable advice, not the entire darkness interval; geometric Moon limits and unavailable weather were retained. Final case selected calendar-only evidence in the overnight search and did not invent an exact peak. A preliminary replay retrieved the dated 14 December maximum; the final replay did not independently exercise that dated-peak conversion. Do not claim this final run covers every peak case.
- **Remaining native efficiency gap:** final meteor case repeated successful aggregate calls and an event search. These did not cause timeouts or provider traffic in this offline configuration, but repeated live calls would need allowance/cache discipline. Retain under Task 12B/15; do not declare complete multi-turn/source acceptance from this replay.

The two targeted regressions pass in this controlled native-client setup. This does not replace live-source, desktop-host, full journey, Claude or deployment acceptance.
