# Prepare a night-sky outing

## Goal and boundaries

Turn an existing plan into practical preparation for a beginner, family, urban observer, telescope user or experienced observer. Preparation advice should fit known weather and equipment but must not imply access or a successful observation is guaranteed.

## Conversation and tool sequence

1. Confirm the named destination, date/night, activity, group needs, and equipment the user wants considered. Ask before assuming host location for “near me.” Coordinates alone require asking for a named place; do not reverse-geocode or plan.
2. For a named-city plan or city-origin search: Resolve the place with `resolve_place` if no current place ID exists. For region-only discovery and selected-candidate planning, use the conditional flow below instead.
3. Call `plan_observing_session` for the activity and window. If the user asks whether another place/night is better, ask for or confirm alternatives, then call `compare_observing_options`.
4. Call `recommend_specialist_tools` only when an app would fill a concrete need such as sky orientation, target framing, or telescope control.
5. Summarize preparation based on the plan's fields and the user's stated gear. For a family, keep the session short and discuss safe routes, lighting and supervision without claiming a site is safe.

## Checklist and partial data

Include rechecking forecast issue/valid times, clothing, water, phone power, low-light handling, return transport, and verification of public access, night opening, permits and closures. For families, suggest a short route/session and adult supervision around roads, edges, and equipment; do not label a site safe. Add only activity-relevant gear. If clouds are absent from a source, say forecast cloud cover is unavailable; do not fill the gap from a different field. If the forecast is stale or out of horizon, explain and suggest checking a current official source nearer the date. Keep provider evidence separate and avoid promising a view or photograph.

## Planner evidence, units and place IDs

For named-city plans use the GeoNames place ID and returned timezone. For selected candidates follow the conditional details/revision/display-timezone flow below. Never substitute town-centre calculation while claiming to plan the selected candidate point; if candidate planning is unavailable, explicitly offer a separately labelled named-city plan. User-supplied raw coordinates remain unsupported.

Preserve returned `evidence`, `candidateWindows`, `gaps`, `suggestions` and `timedPreparation`. Candidate windows use supported target/darkness intersections and source-indexed weather intervals where available; sparse instant samples cannot establish continuous cloud coverage. Retain rationale, weather coverage and Moon constraint. Whole-session Moon illumination does not establish Moon-above-horizon timing throughout a window. Exact target intervals remain in evidence when the bounded window display is full. Suggestions are up to three supported calculated bright targets and may be empty with a gap. Timed beginner guidance is preparation, not a promised sighting schedule.

Pass requested supported `locale` and `units` to planning/comparison tools. Summaries use those display preferences; nested provider values keep their native units, source identity, issue/valid times and aggregation intervals. Keep native evidence distinct from formatted display values and never average providers. Comparisons retain each option's availability, evidence, candidate windows and gaps; do not omit an uncovered option or describe it as clear.

## Event coverage

When meteor timing matters, retain the 2025–2026 NASA peak-calendar coverage and separate GMN radiant-model evidence from the sky-event workflow. A forecast maximum is not an activity window, rate prediction, or recurring date. Preserve unknown timing/radiants and unsupported years instead of filling those gaps.

## Optional-service failures

Preserve the returned reason when an enabled candidate, history, aurora or site-context lookup fails or is outside coverage. Describe unavailable data as unavailable; do not describe an enabled service as disabled or interpret missing evidence as clear weather, safe access or no sky activity. Continue with the remaining supported evidence and show the gap.

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
