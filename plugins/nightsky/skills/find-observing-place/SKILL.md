---
name: find-observing-place
description: Resolve a named destination and inspect observing-place candidates with clear coverage and access limits.
---

# Find an observing place

Use the canonical workflow in `docs/product/workflows/find-observing-place.md`.

Ask for a named city or destination when missing. For “near me,” ask for location permission or a city; never assume host location. If the user supplies coordinates, ask them to name a nearby city or place and stop before calling a planning tool. Never reverse-geocode coordinates into a place name.

Call `resolve_place` first. Clarify ambiguity instead of choosing. Use `search_observing_locations` for a requested spot search and `get_location_context` for available context. Candidate records do not verify darkness, access, night opening, permits, safety, or horizon. Explain missing local-index coverage and ask the user to verify access with the land manager.

If the user wants a night plan after choosing a place, follow the stargazing workflow: gather missing date/activity, use the resolved place ID and timezone, then present partial evidence and source links. Do not invent missing facts.

## Candidate and event coverage

OSM candidate IDs are discovery features and unsupported planning inputs. For a plan after spot selection, explicitly name the separately resolved GeoNames destination: its weather and astronomy do not describe the exact selected feature. The reviewed regional fixture has 1,327 named nodes/ways in Bengaluru, Nilgiris, Kochi and Chennai boxes when explicitly installed; way points are bounding-box centers, not entrances. Preserve geographic omissions, attribution, source vintage and unknown access, darkness, safety and horizon.

Meteor timing has 13 original NASA forecast maxima for 2026 only, with no activity widths or annual recurrence. GMN near-anchor radiant models cover eight showers independently; only QUA, ETA, SDA, PER and GEM overlap this calendar. LYR, ORI and LEO lack calendar timing, and the eight NASA-only codes lack modeled radiants. Keep exact returned peak instants, source evidence and unavailable/outside-model results. Follow the canonical sky-event workflow for these distinctions.
