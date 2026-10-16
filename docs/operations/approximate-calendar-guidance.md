# Approximate meteor calendar guidance — 16 October 2026

## Admitted fields and provenance

The active `search_sky_events` response now includes optional `meteorCalendarGuidance` for meteor requests. It preserves only **ETA: early May** and **ORI: late October**, from the introductory sentence in Section 1, page 1 of [Egal et al. (2020), A&A 640 A58](https://doi.org/10.1051/0004-6361/202038115). The [author-hosted final paper](https://physics.uwo.ca/~pwiegert/papers/2020AA-Egal-01.pdf) was inspected through the public web reader on 2026-10-16; its first page explicitly states author copyright and CC BY 4.0. The publisher HTML returned 403. No observation dataset was acquired. The previously admitted article identity/license is retained; calendar fields have their own product description, section locator, full author attribution and modification notice.

This introductory annual description is authored prose in the same cleared article, not an import from its historical Appendix D compilation. Only the two short period phrases are transcribed. No JPL/AMS compilation, NASA calendar table or unreviewed third-party field is admitted.

## Runtime behavior and compatibility

The new optional output object has partial availability and an explicit reason that other showers lack admitted guidance. Its bounded, unique-code entries carry source wording, `precision: verbal-period`, `recurrenceBasis: typical-annual`, `requestedWindowOverlap: not-evaluated`, source locator, caveat and source record. Meteor requests return both entries even in January or outside the 2025–2027 maxima horizon: this is unfiltered reference context. Nonmeteor requests omit the object. Missing guidance never establishes absence of activity.

No interpretation of early/late as particular days is made. No source longitude is converted. The schema rejects invented UTC fields, false overlap and increased precision. Guidance is outside `events`, event sorting and event limits. Existing `meteorTypicalSeasons`, exact NASA maxima and radiant validity are unchanged. Planner evidence retains the complete event response, including guidance, without promoting it to a radiant sample or observing score. The registered MCP output schema and structured response already consume the shared result, so this is a live tool extension rather than an orphan schema.

This is additive for consumers accepting the current shared schema; old strictly validating clients must refresh their advertised output schema. No input contract or tool name changes. Old result payloads lacking the optional field remain valid. Plugin skill/package assets were not changed by this lane; runtime release versioning remains the integrator's responsibility.

## Verification and remaining gaps

TDD: the new discovery regression first failed with “Approximate calendar guidance is missing”, while four existing tests passed. After implementation all five dedicated tests passed. Coverage checks provenance/precision, missing-source behavior, strict rejection of false dates/overlap, nonmeteor omission and unsupported-year empty dated events. The composed planner test now checks preserved wording; the real MCP HTTP integration test checks both phrases in structuredContent and unevaluated overlap. TypeScript `npx tsc --noEmit` passed. Full-suite outcome is recorded in the lane handoff.

Only two showers have approximate guidance. This adds no accepted full UTC seasons, no forecast maxima, no radiant fits, no annual forecast horizon and no claim of a complete global calendar. The retained 19-code inventory, seven missing radiant fits, missing year/code maxima and unresolved full-season conversion remain acceptance gaps. No provider/model calls, credentials, deployment, source dataset downloads or installation were used.
