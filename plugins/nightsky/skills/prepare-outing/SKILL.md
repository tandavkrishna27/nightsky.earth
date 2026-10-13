---
name: prepare-outing
description: Turn a night-sky plan into practical, activity- and gear-aware preparation steps.
---

# Prepare a night-sky outing

Use the canonical workflow in `docs/product/workflows/prepare-outing.md`.

Confirm named destination, date/night, activity and relevant group or equipment needs. Ask before assuming host location for “near me.” If given coordinates, ask the user to name a destination and do not reverse-geocode or plan.

Sequence: `resolve_place` when no current place ID exists → `plan_observing_session` → `compare_observing_options` only when alternatives are requested → `recommend_specialist_tools` only when an app addresses a concrete need. Use returned weather fields and named equipment only.

Give a concise checklist: current forecast and valid times, warm layers, water, charged phone, low-light use, return plan, and direct confirmation of public access, after-dark rules, permits and closures. Tailor activity gear; keep family suggestions general and do not claim a site is safe. If data is partial or unavailable, say so and never invent it. Do not promise an observation or photograph.
