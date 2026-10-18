# V1 result-boundary recovery — 18 October 2026

Baseline `3b72bd4`, installed1.0.32: the final unknown-site native case repeated an identical successful resolution and dropped earlier cloud evidence after a later focused forecast returned no data. This wave changes result text, not source authority or conversational server storage.

## Investigation and bounded fixes

| Boundary | Retained observation | Correction and evidence limits |
| --- | --- | --- |
| API resolver | Success text was a generic availability sentence; exact identity/revision and timezone evidence were chiefly structured. The final1.0.32 case repeated the same successful unambiguous query despite retained expiry and existing reuse instructions. | API-only text now promotes at most five exact place IDs/revisions and fetched/expiry timestamps, with matching verified-zone evidence and conditional city/site next actions. Ambiguity still needs selection; changed destination, explicit refresh and expired/missing snapshots permit a new lookup. Structured results, local/catalogue route and source credits are unchanged. Action ambiguity is a boundary hypothesis, not proof of the model's internal reason. |
| Focused forecast | The aggregate text contained18/25/40% at20:30/21:30/22:30IST. A later empty response said broadly “Cloud unknown: no forecast samples returned”; the final answer treated the earlier evidence as absent. | Empty text now scopes absence to this response, conditionally preserves earlier timestamps/status and leaves current freshness unverified. It never invents earlier rows or stores them. Temperature-only/out-of-window forecasts, stale evidence, independent provider outcomes and the3,200-byte projection bound keep their existing semantics. |

No new skill rules, schema fields, source selection/admission, cache policy, quota or default changes were added. The existing first2,500-character workflow priority guard remains unchanged.

## Red/green and cross-review

- Resolver text regression failed before the projection change. Unknown/mismatched timezone evidence regression failed before the verified-zone guard; final focused resolver2/2pass. Fixtures cover unknown site, known city/direct planning, ambiguity, maximum five matches, no matches, exact expiry and original source credits.
- Forecast empty-response regression failed before the wording change. Final focused formatter7/7pass, including preservation/no invented prior rows, cloud-missing versus absent forecasts, stale rows and existing output limits.
- Root combined resolver/forecast/API discovery/follow-up run:12/12pass. All three TypeScript projects passed. Each implementation lane independently reviewed the other; no blocker remained. Text projection tests do not establish native answer compliance by themselves.

## Installed1.0.33 native replay

One bounded three-turn resumed Codex CLI conversation used the final installed package. All15 package files were byte-verified. Retained evidence: `.superpowers/sdd/2026-10-18-publicuniverse-v1/native-site-timezone-133/` (report, three answers and tool-event JSONL). The same fixture field coordinates17.385,78.4867 have no actual timezone metadata; weather is fixed synthetic evidence and local astronomy is real. No owner keys/ledger are loaded and data-provider transport is blocked. Normal model-provider inference is separate from these synthetic data sources.

| Turn | Actual calls and outcome |
| --- | --- |
| Initial unknown-site request | Exactly one `resolve_place`, then correctly revision-bound details. No astronomy/weather before asking whether to use Asia/Kolkata as display timezone. No duplicate lookup. |
| User chooses display timezone | One aggregate plan retains exact field/revision/window and chosen display zone. Opening is provisional with unknown access/safety/obstructions/light pollution; actual field timezone remains unknown. Answer preserves18%@20:30,25%@21:30,40%@22:30 as synthetic instant samples and uses returned time-specific Moon/Saturn geometry. |
| User explicitly requests weather refresh | One focused conditions call returns unavailable. Answer preserves the three earlier samples with original available status/times, reports the new unavailable result separately, and leaves retrieval/issue time and current freshness unknown. It does not infer a real provider outage. |

All three turns exited0 without timeout: **four completed MCP calls (2+1+1)**, one synthetic geocode dispatch, two synthetic weather dispatches, zero external-provider attempts. Independent review checked the report, completed arguments, original returned cloud rows and final answers. The two targeted failures pass in this configuration; do not erase the earlier1.0.32 failures or infer universal duplicate prevention, model compliance, live-source quality, desktop/Claude/Gemini acceptance or hosting capacity.

**Wider answer review remains open.** The chosen-zone final answer includes the Geoapify link but omits explicit OpenStreetMap credit although raw tool text/structured sources retain it. It also says “earlier hours look more promising” after quoting sparse samples; a stronger answer would identify the lower-cloud sample rather than imply a supported time window. It disclaims continuous coverage, so no guaranteed window is established. These are separate final-credit/phrasing acceptance findings under12B/15, not a failed data-provider contract. No unbounded rerun or additional instruction pile-up followed.

## Source/claim progression

The [freeze decision record](v1-freeze-decisions-20261018.md) adds primary public-document evidence for Geoapify storage/Places reuse/Free geometry and DarkSkySites app use/cache/credit conditions, with retrieval limitations and feature boundaries. Public Universe per-record reuse mapping remains engineering work; public API availability is not a blanket dataset licence. The current target README now replaces obsolete capability lists while retaining all nineteen meteor identities. No source admission or optional activation was applied.

The owner confirmed NightSky.earth as the event-maintenance identity and requested historical alternatives before choosing a method. The freeze record preserves that confirmation and the explanation. Maintained set/years/review schedule and historical-method choice remain unadopted; neither response authorizes acquisition or certifies a baseline. Actual account exceptions/WeatherAPI transition, missing scientific evidence, broader final acceptance and release-dependent gates remain explicit.

## Verification boundary

Final full offline suite: **1,819 passed / 0 failed / 2 skipped (1,821 total)**, exit0, log `.superpowers/sdd/2026-10-18-publicuniverse-v1/result-boundary33-full.log`. All three TypeScript projects passed. Exact-commit CI is watched after push. Compiled API/Public Universe/light-pollution synthetic runtime checks and both local package checks passed. The existing12-request bounded synthetic capacity probe also passed against806,276-byte bundle SHA-256 `70098d5e49f763fa0d440c33ea7db148e6afd4207c5dc6e9be621ccc8656c3a9`; [current receipt](data-pilot-evidence/api-capacity-1033-20261018.json) retains warm-phase/RSS/client-overlap/host-capacity limits. It is not a new hosting certification. No data-provider request, dataset download, scraping, owner credential/accounting mutation, deployment or publication occurred. Public source-document research is not a source-data pilot.
