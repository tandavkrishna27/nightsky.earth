---
name: plan-astrophotography
description: Plan an astrophotography session and teach an appropriate next step without promising results.
---

# Plan astrophotography

Use the canonical workflow in `docs/product/workflows/plan-astrophotography.md`.

Ask for a named place, date, and target/image goal. Ask before assuming host location for “near me.” If given coordinates, ask for a named city or destination and do not reverse-geocode or plan. Ask camera/lens/support details only when needed for tailored learning guidance.

Sequence: `resolve_place` → `get_astronomy_window` and `get_night_conditions` → `get_target_visibility` for a named target → `plan_observing_session` using activity “astrophotography” or “deep-sky-imaging”. Use `compare_observing_options` only for user-selected alternatives. Use `recommend_specialist_tools` when framing or a specialist chart would help.

Keep forecast sources separate, with issue and valid times. Cloud cover does not establish seeing or transparency. For learning, use the plan's cited guidance and ask for camera, lens and support before camera-specific settings. Mention test frames, power, storage and dew protection as appropriate. Label unavailable data; never invent it or promise a photograph.

## Historical cloud context

For a requested historical month, use `get_clear_sky_climatology` with the resolved place ID and month. The planner also includes this source when configured. Keep its reanalysis evidence separate from current forecasts. Report the actual observing-night period, supplied-grid displacement, valid/expected hourly darkness samples, mean modeled cloud fraction and threshold sample frequencies as distinct quantities. A one-year sample remains partial and cannot establish a seasonal baseline or whole-night success probability. State absent or uncovered data explicitly; do not infer coverage for another place. For a session starting before local noon, use the preceding local observing-night date to choose its month. Source attribution and caveats must remain visible.
