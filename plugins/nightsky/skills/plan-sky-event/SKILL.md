---
name: plan-sky-event
description: Plan supported meteor, eclipse, aurora and other sky-event observing with local timing and explicit data limits.
---

# Plan a sky event

Use the canonical workflow in `docs/product/workflows/plan-sky-event.md`.

Ask which event/type, named place and date if missing. Ask before assuming host location for “near me.” For coordinates, ask for a named destination; do not reverse-geocode or produce a plan.

Sequence: `resolve_place` → `search_sky_events` and `get_astronomy_window` / `get_night_conditions` → `get_aurora_outlook` for aurora → `get_target_visibility` for supported non-meteor bodies → `plan_observing_session` with the matching activity. Use `recommend_specialist_tools` when it helps on-site orientation.

Keep event calendar, astronomy, weather and aurora evidence separate and include each source's relevant time. For a specified supported meteor shower, pass its name as the planner target and use the three exact radiant samples, model validity, extrapolation and source limits in the plan. Do not call generic body visibility for a meteor shower. A calendar date alone does not establish radiant visibility; preserve unsupported and outside-model results. Aurora is near-term only. For solar eclipses, give the linked authoritative eye-safety guidance. For unsupported event types, explain the gap and use only available evidence. Never invent values; preserve partial output and caveats.
