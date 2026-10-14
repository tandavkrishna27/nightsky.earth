---
name: plan-sky-event
description: Plan supported meteor, eclipse, aurora and other sky-event observing with local timing and explicit data limits.
---

# Plan a sky event

Use the canonical workflow in `docs/product/workflows/plan-sky-event.md`.

Ask which event/type, named place and date if missing. Ask before assuming host location for “near me.” For coordinates, ask for a named destination; do not reverse-geocode or produce a plan.

Sequence: `resolve_place` → `search_sky_events` and `get_astronomy_window` / `get_night_conditions` → `get_aurora_outlook` for aurora → `get_target_visibility` for supported non-meteor bodies → `plan_observing_session` with the matching activity. Use `recommend_specialist_tools` when it helps on-site orientation.

Keep event calendar, astronomy, weather and aurora evidence separate and include each source's relevant time. For a specified supported meteor shower, pass its name as the planner target and use the three exact radiant samples, model validity, extrapolation and source limits in the plan. Do not call generic body visibility for a meteor shower. A calendar date alone does not establish radiant visibility; preserve unsupported and outside-model results. Aurora is near-term only. For solar eclipses, give the linked authoritative eye-safety guidance. For unsupported event types, explain the gap and use only available evidence. Never invent values; preserve partial output and caveats.

## Candidate and event coverage

OSM candidate IDs are discovery features and unsupported planning inputs. For a plan after spot selection, explicitly name the separately resolved GeoNames destination: its weather and astronomy do not describe the exact selected feature. The reviewed regional fixture has 1,327 named nodes/ways in Bengaluru, Nilgiris, Kochi and Chennai boxes when explicitly installed; way points are bounding-box centers, not entrances. Preserve geographic omissions, attribution, source vintage and unknown access, darkness, safety and horizon.

Meteor timing has 13 original NASA forecast maxima in each of 2025 and 2026, with year-specific source evidence and no activity widths or annual recurrence. GMN near-anchor radiant models cover twelve showers independently; only QUA, ETA, SDA, PER, CAP and GEM overlap these calendars. LYR, ORI, LEO, NTA, STA and HYD lack calendar timing. Other NASA codes lack modeled radiants. Keep exact returned peak instants and unavailable/outside-model results. Follow the canonical sky-event workflow for these distinctions.

Planet opposition/solar-alignment coverage uses explicitly labeled relative heliocentric longitude within 1900–2100. Local visibility stays not-evaluated; apparent planet-pair conjunctions and closest approaches remain unsupported. Follow the canonical workflow for definitions, separate target/night checks and solar safety.

## Interpret evidence and answer a beginner

When a plan contains darkness, explain civil (-6 degrees), nautical (-12 degrees) and astronomical (-18 degrees) intervals as nested periods below the Sun altitude thresholds, clipped to the requested session window. They are not exclusive twilight phases. Matching intervals never establish polar night or fake/mocked ephemerides: a short evening window can already lie entirely below all three thresholds. Describe darkness during that session; do not infer the whole day's solar behavior from it.

Treat target geometry as an observing opportunity. Milky Way visibility is conditional on dark skies, clouds, Moon, transparency and a clear local horizon; above-horizon core geometry alone cannot promise a visible band or photograph. Saturn may appear to the naked eye as a point; its rings require a telescope and suitable conditions. An interval's direction is sampled at maximum altitude among the evaluated points, not a bearing for the whole window. Keep returned sample times and intervals; use a cited sky chart for changing on-site orientation.

Keep missing weather and access unknown. Distinguish an enabled provider that is unavailable from an unconfigured fixture/artifact/index and a query outside installed coverage. Unsupported seeing/transparency, a full deep-sky catalog and global coverage are separate capability/data gaps; adding workflow text does not supply them. Report the returned reason and continue with supported evidence. State local permits or restrictions only with a returned or verified official source; otherwise ask the user to confirm with the land manager. General travel preparation is advice, not evidence of local rules or safe access.

Lead with the outcome in one sentence, then at most three bullets: useful local times and timezone with the conditions for observing; the most relevant unknowns; and one practical next step or short gear checklist. Include relevant returned source links and forecast valid times. Explain a term in plain language when first used, such as astronomical darkness meaning the Sun is at least 18 degrees below the horizon. Provide more detail when requested or necessary for the user's event/safety needs; avoid dumping raw tool fields. For learning, teach one next step using supplied gear and cited guidance.