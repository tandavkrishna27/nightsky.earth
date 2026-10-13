# Plan an astrophotography session

## Goal and boundaries

Help the photographer choose a target/time and prepare gear using darkness, Moon, target position and weather evidence. Cloud cover is not seeing or transparency. A forecast cannot promise a successful photograph.

## Conversation and tool sequence

1. Ask for a named place, date range, target or image goal, and camera/lens/support only if the user wants gear-specific learning advice. Ask before assuming host location for “near me.” If coordinates are supplied, ask for a named destination and stop before planning.
2. Resolve the place with `resolve_place`; clarify ambiguity and retain its timezone.
3. Call `get_astronomy_window`, `get_night_conditions`, and `get_target_visibility` when a target is specified. Call `plan_observing_session` with activity “astrophotography” or “deep-sky-imaging”, the resolved place ID, local timezone and requested interval.
4. Call `compare_observing_options` only for alternatives the user chose. Call `recommend_specialist_tools` for relevant framing/planning or sky-chart apps when useful.
5. For learning requests, explain one next skill at a time. Ask for camera, lens, and support before any camera-specific starting settings; do not claim that settings guarantee a result.

## Report and partial data

List darkness, Moon illumination/position, target altitude/window, and each source's cloud/wind/temperature values and valid times separately. Name missing seeing/transparency, stale/out-of-horizon forecast, or unavailable target evidence. Suggest a test frame, stable support, battery/storage, and dew preparation appropriate to the supplied gear. Link app suggestions and mark unknown pricing clearly. Never promise image quality or success.

## Historical cloud context

For a requested historical month, use `get_clear_sky_climatology` with the resolved place ID and month. The planner also includes this source when configured. Keep its reanalysis evidence separate from current forecasts. Report the actual observing-night period, supplied-grid displacement, valid/expected hourly darkness samples, mean modeled cloud fraction and threshold sample frequencies as distinct quantities. A one-year sample remains partial and cannot establish a seasonal baseline or whole-night success probability. State absent or uncovered data explicitly; do not infer coverage for another place. For a session starting before local noon, use the preceding local observing-night date to choose its month. Source attribution and caveats must remain visible.

## Planner evidence, units and place IDs

Use the named GeoNames `placeId` and timezone returned by `resolve_place` for planning, astronomy and comparisons. OSM candidate `place:v1:osm:*` IDs identify discovery features and are unsupported planner/astronomy inputs. After selecting a candidate, explicitly identify the separately resolved named GeoNames destination used for the plan. Its astronomy, weather and horizon geometry describe that destination, not the selected OSM feature. Ask for a named destination before continuing if none has been resolved; selecting a candidate alone does not establish a supported planning location. Never convert candidate or user-supplied coordinates into a planner input.

Preserve returned `evidence`, `candidateWindows`, `gaps`, `suggestions` and `timedPreparation`. Candidate windows use supported target/darkness intersections and source-indexed weather intervals where available; sparse instant samples cannot establish continuous cloud coverage. Retain rationale, weather coverage and Moon constraint. Whole-session Moon illumination does not establish Moon-above-horizon timing throughout a window. Exact target intervals remain in evidence when the bounded window display is full. Suggestions are up to three supported calculated bright targets and may be empty with a gap. Timed beginner guidance is preparation, not a promised sighting schedule.

Pass requested supported `locale` and `units` to planning/comparison tools. Summaries use those display preferences; nested provider values keep their native units, source identity, issue/valid times and aggregation intervals. Keep native evidence distinct from formatted display values and never average providers. Comparisons retain each option's availability, evidence, candidate windows and gaps; do not omit an uncovered option or describe it as clear.

## Event coverage

When meteor timing matters, retain the 2026-only NASA peak-calendar coverage and separate GMN radiant-model evidence from the sky-event workflow. A forecast maximum is not an activity window, rate prediction, or recurring date. Preserve unknown timing/radiants and unsupported years instead of filling those gaps.
