# Weather regrouping implementation plan

Goal: produce a deterministic offline 27+3 replacement proposal for the rejected
16-parent prefix, preserving exact source coverage and all acquisition gates.

- [x] Add failing tests for deterministic year splitting, exact coverage, mutation
  rejection, unchanged executor cap, and exclusive bounded offline output.
- [x] Implement `scripts/era5/regroup_weather.py`: transform the reviewed packet
  in order; keep its source/runtime pins; reset provider claims; declare the
  proposed +11 submissions separately from unchanged executable limits.
- [x] Independently audit selected and retained owners against actual pinned
  calendar templates, retained hour masks, reconciliation and ownership overlay
  in `weather_coverage.py`, with adversarial fixtures.
- [x] Replay against read-only retained metadata, commit a portable proposed
  packet and proof receipt, and record exact hashes and unresolved review gates.
- [x] Run affected/full ERA5 tests, independent review, commit/push this branch,
  watch exact-commit CI, and write `SESSION-weather-HANDOFF.md`.

No provider requests, browser work, credentials, data downloads, shared tracker
edits, `tests/all.test.ts` edits, deployment or global-completion claims.
