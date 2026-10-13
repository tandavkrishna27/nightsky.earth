# Find an observing place

## Goal and boundaries

Help the user resolve a named destination and inspect candidate observing places when the local candidate index is available. A city is not a verified dark-sky site. Candidate records do not establish access, safety, terrain, a clear horizon, or after-dark opening.

## Conversation and tool sequence

1. Ask for a city, named area, or landmark if none is given. If a request says “near me,” ask whether the host's approximate location may be used when no explicit location hint is supplied. Never infer that permission from the host alone.
2. Call `resolve_place` with the user's named text. If multiple matches return, ask which one; do not select silently. Coordinate-shaped text is rejected: ask the user to name a nearby city or destination and do not reverse-geocode it.
3. Call `search_observing_locations` only after place resolution and only for a requested candidate search. Explain when the local index is absent, partial, or geographically limited. The reviewed regional fixture contains 1,327 named nodes and ways in Bengaluru, Nilgiris, Kochi and Chennai boxes, with source vintage 2026-10-13T18:47:51Z; it is usable only when explicitly installed. Ways use supplied bounding-box centers, not entrances or verified observing points. Relations, unnamed features and other regions are excluded. Do not describe empty results as proof that no suitable place exists.
4. Optionally call `get_location_context` for known mapped context. Keep access status `unknown` unless a returned source verifies it.
5. If the user wants a night plan, continue with the planning workflow after confirming date/activity and using the returned place ID and timezone.

## Report

Show the selected place and its returned timezone, candidate distance/category, source and data vintage where present, and coverage gaps. Ask the user to verify land manager rules, after-dark access, permits, closures, and local safety before travel. Do not label a candidate “dark”, “safe”, or “open” without supporting evidence.

## Planner evidence, units and place IDs

Use the named GeoNames `placeId` and timezone returned by `resolve_place` for planning, astronomy and comparisons. OSM candidate `place:v1:osm:*` IDs identify discovery features and are unsupported planner/astronomy inputs. After selecting a candidate, explicitly identify the separately resolved named GeoNames destination used for the plan. Its astronomy, weather and horizon geometry describe that destination, not the selected OSM feature. Ask for a named destination before continuing if none has been resolved; selecting a candidate alone does not establish a supported planning location. Never convert candidate or user-supplied coordinates into a planner input.

Preserve returned `evidence`, `candidateWindows`, `gaps`, `suggestions` and `timedPreparation`. Candidate windows use supported target/darkness intersections and source-indexed weather intervals where available; sparse instant samples cannot establish continuous cloud coverage. Retain rationale, weather coverage and Moon constraint. Whole-session Moon illumination does not establish Moon-above-horizon timing throughout a window. Exact target intervals remain in evidence when the bounded window display is full. Suggestions are up to three supported calculated bright targets and may be empty with a gap. Timed beginner guidance is preparation, not a promised sighting schedule.

Pass requested supported `locale` and `units` to planning/comparison tools. Summaries use those display preferences; nested provider values keep their native units, source identity, issue/valid times and aggregation intervals. Keep native evidence distinct from formatted display values and never average providers. Comparisons retain each option's availability, evidence, candidate windows and gaps; do not omit an uncovered option or describe it as clear.

## Optional-service failures

Preserve the returned reason when an enabled candidate, history, aurora or site-context lookup fails or is outside coverage. Describe unavailable data as unavailable; do not describe an enabled service as disabled or interpret missing evidence as clear weather, safe access or no sky activity. Continue with the remaining supported evidence and show the gap.
