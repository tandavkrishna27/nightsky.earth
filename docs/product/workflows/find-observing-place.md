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

## Regional artifact mode

An operator may install a reviewed regional manifest instead of the flat index. Preserve each candidate's own source/vintage and the returned partial/not-covered reason. Region point bounds route searches; they do not establish complete radius coverage, administrative or polygon membership, public access, darkness or an entrance. A failed integrity/conflict query must remain unavailable rather than be replaced with another region or an old result. Direct search and the planner share the installed regional provider. The product still plans at a separately resolved named GeoNames destination; candidate IDs do not become supported planning coordinates.

## Interpret evidence and answer a beginner

When a plan contains darkness, explain civil (-6 degrees), nautical (-12 degrees) and astronomical (-18 degrees) intervals as nested periods below the Sun altitude thresholds, clipped to the requested session window. They are not exclusive twilight phases. Matching intervals never establish polar night or fake/mocked ephemerides: a short evening window can already lie entirely below all three thresholds. Describe darkness during that session; do not infer the whole day's solar behavior from it.

Treat target geometry as an observing opportunity. Milky Way visibility is conditional on dark skies, clouds, Moon, transparency and a clear local horizon; above-horizon core geometry alone cannot promise a visible band or photograph. Saturn may appear to the naked eye as a point; its rings require a telescope and suitable conditions. An interval's direction is sampled at maximum altitude among the evaluated points, not a bearing for the whole window. Keep returned sample times and intervals; use a cited sky chart for changing on-site orientation.

Keep missing weather and access unknown. Distinguish an enabled provider that is unavailable from an unconfigured fixture/artifact/index and a query outside installed coverage. Unsupported seeing/transparency, a full deep-sky catalog and global coverage are separate capability/data gaps; adding workflow text does not supply them. Report the returned reason and continue with supported evidence. State local permits or restrictions only with a returned or verified official source; otherwise ask the user to confirm with the land manager. General travel preparation is advice, not evidence of local rules or safe access.

Lead with the outcome in one sentence, then at most three bullets: useful local times and timezone with the conditions for observing; the most relevant unknowns; and one practical next step or short gear checklist. Include relevant returned source links and forecast valid times. Explain a term in plain language when first used, such as astronomical darkness meaning the Sun is at least 18 degrees below the horizon. Provide more detail when requested or necessary for the user's event/safety needs; avoid dumping raw tool fields. For learning, teach one next step using supplied gear and cited guidance.