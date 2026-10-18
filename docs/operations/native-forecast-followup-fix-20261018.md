# Forecast follow-up correction — 18 October 2026

## Diagnosis and scope

Internal local package 1.0.25. The 1.0.24 native conversation preserved cloud timestamps and reused Moon/Saturn positions correctly. Its remaining failure was dropping earlier OpenWeather evidence after a focused weather call returned unavailable, plus imprecise sample/window wording and one-sided nearest-sample comparison.

Existing safe journal `native-1024-1792309487626.jsonl` records OpenWeather HTTP 200 at 07:47:22.152Z, response 16,517 bytes. Initial aggregate completed in 1,211 ms. The focused weather request completed in 23 ms with no new provider dispatch. The launcher permits only one OpenWeather request, which was already consumed. OpenWeather intentionally retains no response cache pending source caching permission. This is a local allowance failure, not evidence of provider outage. Existing evidence can remain in the conversation without adding server storage or resetting quotas.

## Changes

All five skills and matching canonical workflows now require reuse of exact conversation rows before further calls; previous evidence remains labelled with original valid times and retrieval time when known. A failed or allowance-blocked refresh is shown separately. Missing/truncated prior evidence remains unknown. No automatic retry, cache, API contract, quota, activation or provider changes.

An instant is described as a sample, not a window. Both equally close neighbouring samples are considered, preserving provider disagreement and preventing invented continuous windows.

## Verification

The supplied native conversation is the observed failure baseline. A new authored guidance regression failed before the edit and passed afterwards. Type checks and canonical packaging passed. All 75 skill tests passed; both local host packages verified. Independent read-only review found no material issue, and one controlled synthetic replay preserved prior values, original retrieval time, separate allowance failure and both equally close neighbours. Version 1.0.25 was installed under the existing identity and all 15 installed files matched the prepared package. These checks are not a fresh native-host acceptance. CI is watched on the final pushed commit. No new provider calls, historical downloads, scraping or deployment.


## Owner native follow-up acceptance — 18 October, 13:48 IST

The owner supplied the two-answer 1.0.25 follow-up. It loaded the updated skill, preserved all nine forecast values at their seven original local times, retained previous OpenWeather 87%/77% separately from the unavailable refresh, named both equidistant MET neighbours, and denied a continuous clear window. Retrieval timestamps absent from the visible result remained unknown. This targeted flow passed; broader V1 journeys are not accepted by this result.

Minor remaining wording: the response called MET/WeatherAPI rows newer without edition evidence. Version 1.0.26 tightens all five skills to distinguish retrieval, issue and valid times. It does not imply the underlying forecast changed. This wording amendment has offline checks; fresh native verification remains pending.
