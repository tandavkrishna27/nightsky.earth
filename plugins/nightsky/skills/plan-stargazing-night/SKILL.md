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

Meteor timing has 13 original NASA forecast maxima for 2026 only, with no activity widths or annual recurrence. GMN near-anchor radiant models cover eight showers independently; only QUA, ETA, SDA, PER and GEM overlap this calendar. LYR, ORI and LEO lack calendar timing, and the eight NASA-only codes lack modeled radiants. Keep exact returned peak instants, source evidence and unavailable/outside-model results. Follow the canonical sky-event workflow for these distinctions.
