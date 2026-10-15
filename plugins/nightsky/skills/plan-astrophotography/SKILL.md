---
name: plan-astrophotography
description: Plan an astrophotography session and teach an appropriate next step without promising results.
---

# Plan astrophotography

Use the canonical workflow in `docs/product/workflows/plan-astrophotography.md`.

Ask for a named place, date, and target/image goal. Ask before assuming host location for “near me.” If given coordinates, ask for a named city or destination and do not reverse-geocode or plan. Ask camera/lens/support details only when needed for tailored learning guidance.

For a named-city plan, sequence: `resolve_place` → `get_astronomy_window` and `get_night_conditions` → `get_target_visibility` for a named target → `plan_observing_session` using activity “astrophotography” or “deep-sky-imaging”. Use `compare_observing_options` only for user-selected alternatives. Use `recommend_specialist_tools` when framing or a specialist chart would help.

Keep forecast sources separate, with issue and valid times. Cloud cover does not establish seeing or transparency. For learning, use the plan's cited guidance and ask for camera, lens and support before camera-specific settings. Mention test frames, power, storage and dew protection as appropriate. Label unavailable data; never invent it or promise a photograph.

## Historical cloud context

For a requested historical month, use `get_clear_sky_climatology` with the resolved place ID and month. The planner also includes this source when configured. Keep its reanalysis evidence separate from current forecasts. Report the actual observing-night period, supplied-grid displacement, valid/expected hourly darkness samples, mean modeled cloud fraction and threshold sample frequencies as distinct quantities. A one-year sample remains partial and cannot establish a seasonal baseline or whole-night success probability. State absent or uncovered data explicitly; do not infer coverage for another place. For a session starting before local noon, use the preceding local observing-night date to choose its month. Source attribution and caveats must remain visible.

## Candidate and event coverage

Candidate records describe mapped representative points with source-linked geometry. Access, darkness, safety and horizon remain unknown without affirmative evidence; preserve omissions, attribution and source vintage. Use the conditional discovery and candidate-planning flow below for installed capabilities.

Meteor timing has 13 original NASA forecast maxima in each of 2025 and 2026, with year-specific source evidence and no activity widths or annual recurrence. GMN near-anchor radiant models cover twelve showers independently; only QUA, ETA, SDA, PER, CAP and GEM overlap these calendars. LYR, ORI, LEO, NTA, STA and HYD lack calendar timing. Other NASA codes lack modeled radiants. Keep exact returned peak instants and unavailable/outside-model results. Follow the canonical sky-event workflow for these distinctions.

## Interpret evidence and answer a beginner

When a plan contains darkness, explain civil (-6 degrees), nautical (-12 degrees) and astronomical (-18 degrees) intervals as nested periods below the Sun altitude thresholds, clipped to the requested session window. They are not exclusive twilight phases. Matching intervals never establish polar night or fake/mocked ephemerides: a short evening window can already lie entirely below all three thresholds. Describe darkness during that session; do not infer the whole day's solar behavior from it.

Treat target geometry as an observing opportunity. Milky Way visibility is conditional on dark skies, clouds, Moon, transparency and a clear local horizon; above-horizon core geometry alone cannot promise a visible band or photograph. Saturn may appear to the naked eye as a point; its rings require a telescope and suitable conditions. An interval's direction is sampled at maximum altitude among the evaluated points, not a bearing for the whole window. Keep returned sample times and intervals; use a cited sky chart for changing on-site orientation.

Keep missing weather and access unknown. Distinguish an enabled provider that is unavailable from an unconfigured fixture/artifact/index and a query outside installed coverage. Unsupported seeing/transparency, a full deep-sky catalog and global coverage are separate capability/data gaps; adding workflow text does not supply them. Report the returned reason and continue with supported evidence. State local permits or restrictions only with a returned or verified official source; otherwise ask the user to confirm with the land manager. General travel preparation is advice, not evidence of local rules or safe access.

Lead with the outcome in one sentence, then at most three bullets: useful local times and timezone with the conditions for observing; the most relevant unknowns; and one practical next step or short gear checklist. Include relevant returned source links and forecast valid times. Explain a term in plain language when first used, such as astronomical darkness meaning the Sun is at least 18 degrees below the horizon. Provide more detail when requested or necessary for the user's event/safety needs; avoid dumping raw tool fields. For learning, teach one next step using supplied gear and cited guidance.

## Discovery combinations and site planning

Inspect exposed tool schemas first. Use region resolution only if the tool is available: resolve_observing_region selects a pinned ADM0 country or ADM1 state/province, with country and ambiguity clarified. If unavailable, state the missing capability; never substitute a capital, centroid or radius circle for administrative membership. Likewise use get_observing_location_details only when exposed; never invent a call or UI action. Installed tools and artifacts determine coverage, not this workflow text.

Direct geography filters use search_observing_locations: a named origin and radius; included country/state membership; both intersected; multiple included regions with any for alternatives or all for intersection; multiple origins with any for alternatives or all for shared-radius overlap; included regions minus excluded regions (exclusions win); a minimumDistanceKm distance band; and supported categories or the complement of the six known categories. Use only fields accepted by the exposed schema. Resolve country/state context to the intended boundary, not an accidental intersection. Maximum five origins, five included regions and five exclusions; radius defaults 50 km within 1–300 km and minimum distance cannot exceed radius. Do not mix scope with legacy place/radius fields. Exclusion-only world queries require narrowing.

Discovery returns at most ten candidates; select at most five options for planning comparisons. Date, tonight/weekend/alternate nights, meteor shower, Milky Way, planet, Moon, aurora, activity, experience and gear belong to planning comparisons, not additional discovery filters. Compare supported Moon/weather evidence and preserve each provider's forecast horizon, valid time, historical context and event/model/date limits. Darker skies, seeing and transparency stay unknown without evidence; lower wind/cloud thresholds cannot establish night access or sky quality. Family, beginner, telescope and photography guidance does not certify safety, facilities, parking or accessibility. Strict night entry, camping or wheelchair requirements need affirmative sourced evidence, otherwise mark verification needed.

For a selected candidate, obtain details with its ID and catalogueRevision before calculation; for a named candidate/observatory use bounded name lookup and select among at most five matches. For stale, conflicting or missing IDs, re-search. Pass the selected revision and displayTimeZone through planning/astronomy/weather inputs when supported. If the site's actual timezone is unverified, ask for an explicit display timezone; a base-city timezone may be offered only as a labelled display choice. Calculate at the candidate's stored point, not the city centre; its representative point is not a verified entrance or horizon. When candidate details or candidate calculation are unsupported, explain this and offer a separately named town-centre plan, never describe it as the exact selected site. Rural names outside the indexes need a nearby known town. Raw personal GPS and street addresses remain unsupported; do not reverse-geocode them.

Report footprint coverage, search completeness, catalogue revision, source vintage and stop reason. Region-only results use source completeness/name/ID, not nearest or best-sky ranking. For multiple origins, preserve per-origin straight-line distances: any sorts minimum distance, all sorts maximum distance. Town origins are town-centre approximations. Missing coverage, empty covered results and budget-limited partial scans differ; none means no suitable real-world places. Dense, large, polar and dateline scopes may require narrowing; never call a truncated list globally nearest. Deduplicate prior suggestions by candidate/source ID within this conversation only. For anywhere/cheapest requests, gather travel scope, date and budget for bounded comparison; no exhaustive worldwide ranking or flight/hotel price promise.

## Optional host capabilities

Use optional host capabilities only when actually available in this conversation. For near me, obtain consent before using an approximate host location hint actually supplied by the host; resolve a named town and label distances from its centre. If consent or the hint is absent, ask for town and country. Do not imply that Claude, Gemini, Codex or another client supplies personal location by default.

If browsing is available, check official land-manager or observatory evidence for access, opening hours, permits, camping, accessibility and closures. Keep links and retrieval date with each claim, distinguish affirmative evidence from unknowns, and keep web suggestions separate from catalogue records and completeness claims. User approval to use an approximate hint does not authorize precise GPS collection. Without browsing, explain the verification gap and give the relevant next step. A host failure must not break catalogue planning: continue with supported evidence and state what could not be checked.

Use host maps or a specialist routing app if available for driving time or a route corridor, with user travel mode and origin clarified. Never convert straight-line distance to road hours or claim NightSky supplies routes, tolls, fuel or transport costs. For between two towns, clarify radius overlap versus an on-road stop. Keep external route evidence separate from catalogue distance.

Create a reminder or calendar entry only if the host supports that action and the user requests it. Confirm the selected date, local time, timezone and reminder intent before using the actual exposed capability; report success only after confirmation from that capability. When unavailable or failed, provide a copyable schedule instead of promising a notification. Rechecking forecasts later also requires an available, explicitly requested scheduling capability.

## Moon timing and sampled directions

Do not infer moonrise, moonset or a moonless window from illumination or sampled altitude. Low Moon altitude does not establish negligible moonlight. Report illumination and sampled altitude as calculated values; Moon timing requires explicit supported rise/set or below-horizon interval evidence. Keep light pollution, transparency and the local horizon unknown unless supplied. An azimuth sampled at maximum altitude is not a rise-time or whole-session bearing. Say no supported event was returned rather than no event occurs when calendar coverage is incomplete. Preserve relevant returned source links.

