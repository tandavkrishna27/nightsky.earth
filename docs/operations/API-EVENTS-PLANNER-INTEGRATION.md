# Coordinator-owned planner integration — 17 October 2026

This lane owns event code/schema/workflows, not `server/nightsky/planner.ts`. Apply these dependent corrections during integration before claiming DRA/URS civil guidance is assembled into selected-shower plans. The event search result itself already contains the admitted facts. No new source/model or scope decision is needed.

## Exact changes

1. In the import from `../../shared/nightsky/meteors`, add `resolveMeteorIdentity` and `METEOR_CODES`. Replace the local twelve-model `METEOR_ALIASES` and `meteorCode` normalization with the shared resolver (a local alias `const meteorCode = resolveMeteorIdentity` keeps call sites small). Replace the unknown-selection prompt's `Array.from(new Set(Object.values(METEOR_ALIASES)))` with `METEOR_CODES`. Identity is separate from radiant coverage: all nineteen resolve, but seven still return unsupported models. Ambiguous unqualified `Taurids` and `Delta Aquariids`, SSS/#168 and unresolved GIA are not aliases to a retained branch.
2. In the `Meteor civil calendar guidance` factor, replace unconditional `typical annual source dates` with `civilGuidance.recurrenceBasis === "typical-annual" ? "typical annual source dates" : "source-general visibility dates"`. The latter applies to DRA's northern-hemisphere general period; do not label it an explicit annual recurrence.
3. In the same factor, preserve `civilGuidance.maximumTimeBasis` and `civilGuidance.maximumUncertainty` alongside `maximumWording`, rather than hard-coding every reference as an approximate UT clock. ORI has date precision, secondary peaks and unspecified clock/time basis; its 1 a.m. UT reference is Moonset and was not admitted as a maximum. URS has a published whole-hour reference with unknown numerical uncertainty; it is not an independently established exact UTC instant. Keep the existing `maximumYear` applicability guard. Keep source forecasts separate: IGN's 2026 URS 22h UT and NASA's 15:54 forecast are different records, not values to average or silently reconcile.
4. In the earlier event-summary block, a selected meteor target must filter summaries to its own identity: resolve `input.target` with the shared resolver, then retain only meteor events whose returned name resolves to that code. If the target is unknown/ambiguous, keep that gap; do not summarize another shower's maximum as support for it. Keep the complete source event result in structured evidence. Example regression: an ORI request during the October 9 DRA forecast must not use the Draconid peak in its selected-shower summary. A request without a selected target can retain the existing broad event list.
5. In the meteor sampling loop, parse/push the first evaluation and **break if its status is `unsupported`**. `evaluateRadiant` currently returns that status only when no reviewed model exists for the identity, so one timestamped reason is sufficient. Do not break on `outside-model`: an existing fit may cover later timestamps. Keep all cadence/endpoint points for available or outside-model results. Suggested minimal replacement:

   ```ts
   for (const instant of instants) {
     const sample = meteorRadiantResultSchema.parse({ ...evaluateRadiant(code, instant, { latitude: calculation.latitude, longitude: calculation.longitude }), evaluatedAt: new Date(instant).toISOString() });
     meteorRadiantSamples.push(sample);
     if (sample.status === "unsupported") break; // No model exists for this identity.
   }
   ```

   This is an unknown-model explanation, not evidence that the shower is inactive for the interval. Retain darkness/weather/preparation evidence. The one-point result must not be described as complete interval sampling.
6. In the no-available-radiant factor/gap branch, distinguish `meteorRadiantSamples.some(sample => sample.status === "unsupported")` from `outside-model`. The existing `samples.length > 0` ternary describes every non-empty failure as outside a nominal fit window; that is false for DRA/URS, which have **no** reviewed fit. Use the unsupported reason explicitly (no reviewed model; altitude/separation unknown). For outside-model points preserve the exact domain/year reason and timestamp; do not reclassify them as a missing identity or physical inactivity.

## Covering tests to add in existing `tests/nightsky/meteor-planning.test.ts`

- Use the real `searchSkyEvents` service and a named London fixture for a DRA request over 2026-10-08T18:00Z–2026-10-09T04:00Z. Assert its factor includes source-general northern dates, no annual promotion, its approximate 2026 wording/time basis, IGN source link and no invented radiant coordinates; darkness/forecast evidence remains usable.
- URS on 2026-12-22T18:00Z–2026-12-23T04:00Z: selected civil facts appear, exactly one timestamped unsupported radiant result remains explicit, NASA and IGN forecasts retain separate source records/values. Use a wider fixture containing the NASA 15:54 instant when asserting that event row is returned (the workflow report supplies one).
- ORI during 2026-10-09T01:00Z–03:00Z: the selected event-summary factor must not name October Draconids; civil date-only context can remain, with out-of-domain radiant evidence explicit. ORI in a supported 2027 October session retains bounded radiant samples and civil dates but must not present the 2026 maximum as a 2027 prediction.
- Unknown/ambiguous `Taurids` remains unresolved; named Northern/Southern branches resolve separately. Test no-target single DRA inference separately from unknown-target ambiguity.
- Keep the existing 97-point 24-hour supported-model test and a partly out-of-domain fit case; the unsupported-model shortcut must not drop potentially usable later samples.

Run the existing meteor-planning, optional-event-evidence and four-journey suites after applying these changes. The lane's own identity/inventory tests are in already imported event files; any additional test-file import remains coordinator-owned. Do not import a patch or claim the formatter fixes have already been applied by this lane.
