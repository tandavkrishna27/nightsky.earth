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
