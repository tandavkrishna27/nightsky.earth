# Plan a stargazing night

## Goal and boundaries

Turn a named place, date window, and observing goal into a useful plan from local astronomy calculations and available event, weather, and place-context sources. Plans describe evidence, not a guarantee that the sky will be clear or an object will be visible.

## Conversation and tool sequence

1. Ask only for missing essentials: named place, date/night, activity or target, and whether “near me” location use is intended. Ask experience/equipment only when it changes the guidance.
2. Resolve the named place with `resolve_place`. Clarify ambiguous matches. If the user supplies coordinates, ask for a named place; do not reverse-geocode or make a plan. Ask before assuming host location for “near me.”
3. Call `get_astronomy_window` for darkness and Moon context; use `get_target_visibility` when a target is named; call `get_night_conditions` for forecast details.
4. Call `search_sky_events` when the date or user goal involves an event. Call `get_location_context` only to report available location evidence.
5. Call `plan_observing_session` with the resolved place ID, exact activity, local timezone returned for that place, requested UTC interval, and supplied target/experience/equipment. Use `compare_observing_options` only after the user supplies two or more alternatives.
6. Use `recommend_specialist_tools` only when an optional sky chart or other specialist app would help the stated activity.

For seasonal trip planning, first ask for the season/date range and event or target goal. Use `search_sky_events` to find supported event dates within its range, then compare a small set of user-selected candidate nights with `compare_observing_options`; each compared window is one session of at most 24 hours. Do not present months-ahead weather or climatology unless a supported source returns it; historical context may be unavailable or a partial sample-only result.

## Report and partial data

Summarize the local observing interval first. Keep each provider's values, source, issue time, and valid times separate. State unavailable or out-of-horizon results and continue with supported evidence. Do not average providers, invent seeing/transparency, infer site access, or claim a universal “good sky” score. Give concise preparation steps and source links. Remind the user to recheck forecasts and confirm after-dark access.

## Historical cloud context

For a requested historical month, use `get_clear_sky_climatology` with the resolved place ID and month. The planner also includes this source when configured. Keep its reanalysis evidence separate from current forecasts. Report the actual observing-night period, supplied-grid displacement, valid/expected hourly darkness samples, mean modeled cloud fraction and threshold sample frequencies as distinct quantities. A one-year sample remains partial and cannot establish a seasonal baseline or whole-night success probability. State absent or uncovered data explicitly; do not infer coverage for another place. For a session starting before local noon, use the preceding local observing-night date to choose its month. Source attribution and caveats must remain visible.

## Planner evidence, units and place IDs

Use the named GeoNames `placeId` and timezone returned by `resolve_place` for planning, astronomy and comparisons. OSM candidate `place:v1:osm:*` IDs identify discovery features and are unsupported planner/astronomy inputs. After selecting a candidate, explicitly identify the separately resolved named GeoNames destination used for the plan. Its astronomy, weather and horizon geometry describe that destination, not the selected OSM feature. Ask for a named destination before continuing if none has been resolved; selecting a candidate alone does not establish a supported planning location. Never convert candidate or user-supplied coordinates into a planner input.

Preserve returned `evidence`, `candidateWindows`, `gaps`, `suggestions` and `timedPreparation`. Candidate windows use supported target/darkness intersections and source-indexed weather intervals where available; sparse instant samples cannot establish continuous cloud coverage. Retain rationale, weather coverage and Moon constraint. Whole-session Moon illumination does not establish Moon-above-horizon timing throughout a window. Exact target intervals remain in evidence when the bounded window display is full. Suggestions are up to three supported calculated bright targets and may be empty with a gap. Timed beginner guidance is preparation, not a promised sighting schedule.

Pass requested supported `locale` and `units` to planning/comparison tools. Summaries use those display preferences; nested provider values keep their native units, source identity, issue/valid times and aggregation intervals. Keep native evidence distinct from formatted display values and never average providers. Comparisons retain each option's availability, evidence, candidate windows and gaps; do not omit an uncovered option or describe it as clear.

## Event coverage

When meteor timing matters, retain the 2025–2026 NASA peak-calendar coverage and separate GMN radiant-model evidence from the sky-event workflow. A forecast maximum is not an activity window, rate prediction, or recurring date. Preserve unknown timing/radiants and unsupported years instead of filling those gaps.
