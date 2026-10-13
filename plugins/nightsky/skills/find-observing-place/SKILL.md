---
name: find-observing-place
description: Resolve a named destination and inspect observing-place candidates with clear coverage and access limits.
---

# Find an observing place

Use the canonical workflow in `docs/product/workflows/find-observing-place.md`.

Ask for a named city or destination when missing. For “near me,” ask for location permission or a city; never assume host location. If the user supplies coordinates, ask them to name a nearby city or place and stop before calling a planning tool. Never reverse-geocode coordinates into a place name.

Call `resolve_place` first. Clarify ambiguity instead of choosing. Use `search_observing_locations` for a requested spot search and `get_location_context` for available context. Candidate records do not verify darkness, access, night opening, permits, safety, or horizon. Explain missing local-index coverage and ask the user to verify access with the land manager.

If the user wants a night plan after choosing a place, follow the stargazing workflow: gather missing date/activity, use the resolved place ID and timezone, then present partial evidence and source links. Do not invent missing facts.
