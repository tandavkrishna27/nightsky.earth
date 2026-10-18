# Native timestamp evidence correction — 18 October 2026

## Status

Internal local package **1.0.24**, same plugin identity. This change addresses the failed owner follow-up after the 1.0.23 basic planning test. No new provider requests, historical downloads, scraping, quota resets or deployment. The previous bounded real-data session expired and stopped; installing this package does not start another session. Full native conversation acceptance remains open. Original ticket totals remain **12 Done / 9 Partial / 6 Not started**.

## Evidence and diagnosis

The fresh owner chat loaded 1.0.23 and completed its initial plan in about 28 seconds, using a successful aggregate plan and optional discovery. The subsequent follow-up completed in about 22.5 seconds but produced an inaccurate forecast table: MET values were moved to different local times, 25% was not returned, and OpenWeather's later sample was duplicated into an earlier row. It also initially sent invalid identical window endpoints, calculated 21:00 instead of requested 22:00, and overlooked an already-returned Moon sample. The eventual Saturn sample at 22:00 was correct (about 131 degrees azimuth, 67 degrees altitude).

The coordinator checked source-native cached values without additional provider dispatch. The old planning text foregrounded ranges and one sample, while the much larger structured result could be truncated by the host. Correct values were present, but the model reconstructed an incorrect local-time table. This is an answer-evidence/presentation failure, not proof that forecast APIs supplied incorrect data.

## Implemented design

The [reviewed plan](../superpowers/plans/2026-10-18-native-timestamp-evidence.md) maps the changes and regression cases.

| Component | Change | Boundary |
| --- | --- | --- |
| Forecast answer text | Pure local display projection used by aggregate and focused weather tools; every cloud row binds provider/status, local IANA label, original UTC and unchanged value/unit | No interpolation, averaging, invented slots or best-window ranking |
| Sparse/interval/category evidence | Instants filtered by their actual time; numeric aggregates selected by positive period overlap and keep original bounds; categorical bands remain categorical, including when numeric evidence coexists | No interval clipping or category-to-percentage conversion |
| Missing/stale sources | Forecast status and provider outcomes remain explicit, including providers with no forecast rows; stale values labelled beside each row | Unknown cloud is distinct from omitted rows |
| Output budgets | Up to six selected entries per provider (first three/last three when longer); round-robin complete-row admission, metadata and exact omission counts reserved within 3,200 UTF-8 bytes | Full source evidence stays unchanged in structuredContent |
| Main planning brief | Exposes existing deduplicated selected/suggested target samples with UTC identity, Moon context and early gaps; 8,000-byte body cap includes separators and omission notice | Credits retain their separate existing formatting; no new target calculations or source calls |
| Workflow/tool guidance | Reuse matching place/date/instant evidence, use focused weather for sample inspection, require positive-duration windows and check returned local hour; no reconstruction from ranges | Five skills and canonical workflows updated; existing early outdoor/clarification rules preserved |

The new instructions follow the existing first-decision rules so those rules remain visible within their package prefix requirements. The new evidence rules are tested within the first 8,000 characters. Tool names and strict structured input/output schemas, source activation defaults, deadlines and quotas are unchanged.

## Verification and review

- Pre-implementation review identified budget allocation, interval selection and stale/unavailable handling gaps; requirements and tests were tightened before coding.
- New formatter and main-plan regressions were observed failing before implementation. The real native failure is the baseline for the workflow change; authored guidance checks are not native acceptance.
- Independent implementation review found the omission notice could exceed the body cap. A regression reproduced **8,019 bytes**; reserving the notice/newlines fixed it. Strict cap tests now require at most 8,000 bytes.
- The first full run exposed four package-prefix regressions caused by moving established instructions down. Their tests were preserved and the new section was relocated. Final affected run: **56 passed / 0 failed**.
- Controlled offline agent replay: all **nine cloud values at seven local times** matched the reconstructed source rows, all absent cells remained null, both existing 22:00 Moon/Saturn positions were reused, and the agent required no further calls. It labelled the data synthetic and recommendations provisional. This is one controlled behavior case, not native-host acceptance.
- All three type projects, rebuilt plugin, canonical/local package verification and three compiled synthetic runtime checks passed. Those runtime checks dispatch no external provider traffic.
- Final complete offline suite: **1,786 passed / 0 failed / 2 skipped** (1,788 total).

## Package identity

Same local plugin: `nightsky@nightsky-native-acceptance-20261017`; version **1.0.24**. Supported installer used; all **15 installed files** match the prepared Codex package. Claude package prepared; Claude test remains deferred.

| Artifact | SHA-256 |
| --- | --- |
| Compiled backend | `a0ceaae1cad967cd8710ddcc8d50e0a033e5ec1571151f3637ead232b9dea60a` |
| Local Codex ZIP | `769403b0914e10278567a49d2059fb0f385062ec975fe65698def267930cba1e` |
| Local Claude ZIP | `5c62a8698cd6bf2d8de439c775b532ddb8bb6cafb6cf8711328807d4c3f1977c` |

## Remaining verification

CI is checked on the exact final pushed commit. A fresh native conversation must repeat the initial plan and time-specific follow-up, inspect actual local-time/value pairings, existing Moon/Saturn reuse and credits. The older session and its remaining allowance are not extended. Offline tests and the controlled model case cannot guarantee every host/model will follow the guidance. No deployment or publication is authorized by this correction.
