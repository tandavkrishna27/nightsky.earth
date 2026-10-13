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

When meteor timing matters, retain the 2026-only NASA peak-calendar coverage and separate GMN radiant-model evidence from the sky-event workflow. A forecast maximum is not an activity window, rate prediction, or recurring date. Preserve unknown timing/radiants and unsupported years instead of filling those gaps.
