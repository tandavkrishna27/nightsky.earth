# Plan a sky event

## Goal and boundaries

Plan a meteor shower, eclipse, aurora attempt, conjunction, opposition, or another supported event. Event calendars, local geometry, weather and short-range aurora models have different coverage and must retain their own evidence and horizons.

## Conversation and tool sequence

1. Ask which event or event type, named place, and date/night if missing. Ask before assuming host location for “near me.” If given coordinates, ask for a named destination and do not make a plan.
2. Call `resolve_place` and clarify ambiguous matches.
3. Call `search_sky_events` for the requested event type and interval. Call `get_astronomy_window` and `get_night_conditions` for local darkness, Moon and weather. For a supported planet, Moon or Milky Way target call `get_target_visibility`; do not send a meteor shower to the generic target tool. For meteor activity, pass one selected reviewed shower name/code as `target` to `plan_observing_session`; for aurora activity call `get_aurora_outlook` and explain that its forecast is near-term only.
4. Call `plan_observing_session` using the resolved place ID/timezone and matching activity. Use the tool's reported event and data gaps; do not reconstruct unsupported calculations in prose.
5. Call `recommend_specialist_tools` when a sky chart or specialist event app would help, especially for on-site orientation.

## Event-specific limits

Meteor event search includes 13 NASA forecast maxima for 2026 only: QUA, ETA, ZPE, ARI, SSG, SDA, CAP, PER, DSX, DRA, AND, GEM and URS. These are original Table 3 forecasts in NASA NTRS 20250009524. Report the exact returned UTC peak and its local conversion as a forecast maximum, with source and vintage. A peak is an instant, not a whole activity season or an annual recurring date. The source supplies no activity widths, visual rates, or supported peaks in other years. LYR, ORI and LEO have no timing in this calendar.

Radiant calculations are a separate source covering PER, GEM, ORI, ETA, LYR, SDA, QUA and LEO near their reference solar longitudes. Only QUA, ETA, SDA, PER and GEM overlap the NASA timing list. NASA-only codes have unknown radiants; do not substitute another shower or infer visibility from a peak. Pass one selected shower name/code as the meteor planner target and preserve unavailable or unsupported results. Read `evidence.meteorRadiantSamples`: the planner evaluates session start, midpoint and end, returning altitude, azimuth and Moon separation only inside the nominal fit domain. Preserve evaluation times, source/license/vintage, fit offset, frame and annual extrapolation flag. Out-of-model samples contain no substituted numbers. Three point samples do not establish continuous visibility, full-season activity, rates or exact peaks. A reference solar longitude is a fit anchor, not an annual peak instant. Observations span 2018-12-10 through 2021-05-22; annual reuse inside the engineering 2018–2030 evaluator range is flagged as extrapolation outside those observations. For eclipses, state local visibility and safety limits; for solar viewing retain the returned NASA safety source: ordinary sunglasses are unsafe, partial/annular viewing needs an undamaged ISO 12312-2 viewer, and optical devices need a purpose-built filter secured over the front aperture. Eclipse glasses alone do not make telescope/binocular/camera viewing safe. Aurora outlooks are not long-range predictions or visibility guarantees. If an event class is unsupported, say so and offer only the evidence that is available.

## Report

Show event timing and local time conversion, astronomical darkness, Moon context, available forecast values with their source and valid time, and all missing or unsupported fields. Keep models separate. Provide an event-specific checklist and remind the user that clouds, access, horizon and local hazards can change the outcome.

## Planner evidence, units and place IDs

Use the named GeoNames `placeId` and timezone returned by `resolve_place` for planning, astronomy and comparisons. OSM candidate `place:v1:osm:*` IDs identify discovery features and are unsupported planner/astronomy inputs. After selecting a candidate, explicitly identify the separately resolved named GeoNames destination used for the plan. Its astronomy, weather and horizon geometry describe that destination, not the selected OSM feature. Ask for a named destination before continuing if none has been resolved; selecting a candidate alone does not establish a supported planning location. Never convert candidate or user-supplied coordinates into a planner input.

Preserve returned `evidence`, `candidateWindows`, `gaps`, `suggestions` and `timedPreparation`. Candidate windows use supported target/darkness intersections and source-indexed weather intervals where available; sparse instant samples cannot establish continuous cloud coverage. Retain rationale, weather coverage and Moon constraint. Whole-session Moon illumination does not establish Moon-above-horizon timing throughout a window. Exact target intervals remain in evidence when the bounded window display is full. Suggestions are up to three supported calculated bright targets and may be empty with a gap. Timed beginner guidance is preparation, not a promised sighting schedule.

Pass requested supported `locale` and `units` to planning/comparison tools. Summaries use those display preferences; nested provider values keep their native units, source identity, issue/valid times and aggregation intervals. Keep native evidence distinct from formatted display values and never average providers. Comparisons retain each option's availability, evidence, candidate windows and gaps; do not omit an uncovered option or describe it as clear.
