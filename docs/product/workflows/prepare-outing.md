# Prepare a night-sky outing

## Goal and boundaries

Turn an existing plan into practical preparation for a beginner, family, urban observer, telescope user or experienced observer. Preparation advice should fit known weather and equipment but must not imply access or a successful observation is guaranteed.

## Conversation and tool sequence

1. Confirm the named destination, date/night, activity, group needs, and equipment the user wants considered. Ask before assuming host location for “near me.” Coordinates alone require asking for a named place; do not reverse-geocode or plan.
2. Resolve the place with `resolve_place` if no current place ID exists.
3. Call `plan_observing_session` for the activity and window. If the user asks whether another place/night is better, ask for or confirm alternatives, then call `compare_observing_options`.
4. Call `recommend_specialist_tools` only when an app would fill a concrete need such as sky orientation, target framing, or telescope control.
5. Summarize preparation based on the plan's fields and the user's stated gear. For a family, keep the session short and discuss safe routes, lighting and supervision without claiming a site is safe.

## Checklist and partial data

Include rechecking forecast issue/valid times, clothing, water, phone power, low-light handling, return transport, and verification of public access, night opening, permits and closures. For families, suggest a short route/session and adult supervision around roads, edges, and equipment; do not label a site safe. Add only activity-relevant gear. If clouds are absent from a source, say forecast cloud cover is unavailable; do not fill the gap from a different field. If the forecast is stale or out of horizon, explain and suggest checking a current official source nearer the date. Keep provider evidence separate and avoid promising a view or photograph.

## Planner evidence, units and place IDs

Use the named GeoNames `placeId` and timezone returned by `resolve_place` for planning, astronomy and comparisons. OSM candidate `place:v1:osm:*` IDs identify discovery features and are unsupported planner/astronomy inputs. After selecting a candidate, explicitly identify the separately resolved named GeoNames destination used for the plan. Its astronomy, weather and horizon geometry describe that destination, not the selected OSM feature. Ask for a named destination before continuing if none has been resolved; selecting a candidate alone does not establish a supported planning location. Never convert candidate or user-supplied coordinates into a planner input.

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