---
name: plan-stargazing-night
description: Build a source-aware stargazing plan for a named place, date and observing goal.
---

# Plan a stargazing night

Use the canonical workflow in `docs/product/workflows/plan-stargazing-night.md`.

Ask only for missing essentials: named place, date/night, activity or target, and whether “near me” location use is intended. Ask before assuming host location. For coordinates, ask the user to name a city or destination; do not reverse-geocode and do not produce a plan yet.

Sequence: `resolve_place` → `get_astronomy_window` and `get_night_conditions` → `get_target_visibility` when a target is named → `search_sky_events` when event context matters → `plan_observing_session`. Use the resolved place ID and timezone. For user-selected alternatives, use `compare_observing_options`. For a concrete specialist-app need, use `recommend_specialist_tools`.

Summarize darkness, Moon, target visibility and each provider's weather values with its own source and valid times. Keep providers separate. State partial, stale, unavailable and out-of-horizon results plainly; never invent values, access, seeing or transparency, and do not create a universal score. End with relevant preparation and source links.

## Historical cloud context

For a requested historical month, use `get_clear_sky_climatology` with the resolved place ID and month. The planner also includes this source when configured. Keep its reanalysis evidence separate from current forecasts. Report the actual observing-night period, supplied-grid displacement, valid/expected hourly darkness samples, mean modeled cloud fraction and threshold sample frequencies as distinct quantities. A one-year sample remains partial and cannot establish a seasonal baseline or whole-night success probability. State absent or uncovered data explicitly; do not infer coverage for another place. For a session starting before local noon, use the preceding local observing-night date to choose its month. Source attribution and caveats must remain visible.

## Candidate and event coverage

OSM candidate IDs are discovery features and unsupported planning inputs. For a plan after spot selection, explicitly name the separately resolved GeoNames destination: its weather and astronomy do not describe the exact selected feature. The reviewed regional fixture has 1,327 named nodes/ways in Bengaluru, Nilgiris, Kochi and Chennai boxes when explicitly installed; way points are bounding-box centers, not entrances. Preserve geographic omissions, attribution, source vintage and unknown access, darkness, safety and horizon.

Meteor timing has 13 original NASA forecast maxima in each of 2025 and 2026, with year-specific source evidence and no activity widths or annual recurrence. GMN near-anchor radiant models cover twelve showers independently; only QUA, ETA, SDA, PER, CAP and GEM overlap these calendars. LYR, ORI, LEO, NTA, STA and HYD lack calendar timing. Other NASA codes lack modeled radiants. Keep exact returned peak instants and unavailable/outside-model results. Follow the canonical sky-event workflow for these distinctions.

## Interpret evidence and answer a beginner

When a plan contains darkness, explain civil (-6 degrees), nautical (-12 degrees) and astronomical (-18 degrees) intervals as nested periods below the Sun altitude thresholds, clipped to the requested session window. They are not exclusive twilight phases. Matching intervals never establish polar night or fake/mocked ephemerides: a short evening window can already lie entirely below all three thresholds. Describe darkness during that session; do not infer the whole day's solar behavior from it.

Treat target geometry as an observing opportunity. Milky Way visibility is conditional on dark skies, clouds, Moon, transparency and a clear local horizon; above-horizon core geometry alone cannot promise a visible band or photograph. Saturn may appear to the naked eye as a point; its rings require a telescope and suitable conditions. An interval's direction is sampled at maximum altitude among the evaluated points, not a bearing for the whole window. Keep returned sample times and intervals; use a cited sky chart for changing on-site orientation.

Keep missing weather and access unknown. Distinguish an enabled provider that is unavailable from an unconfigured fixture/artifact/index and a query outside installed coverage. Unsupported seeing/transparency, a full deep-sky catalog and global coverage are separate capability/data gaps; adding workflow text does not supply them. Report the returned reason and continue with supported evidence. State local permits or restrictions only with a returned or verified official source; otherwise ask the user to confirm with the land manager. General travel preparation is advice, not evidence of local rules or safe access.

Lead with the outcome in one sentence, then at most three bullets: useful local times and timezone with the conditions for observing; the most relevant unknowns; and one practical next step or short gear checklist. Include relevant returned source links and forecast valid times. Explain a term in plain language when first used, such as astronomical darkness meaning the Sun is at least 18 degrees below the horizon. Provide more detail when requested or necessary for the user's event/safety needs; avoid dumping raw tool fields. For learning, teach one next step using supplied gear and cited guidance.