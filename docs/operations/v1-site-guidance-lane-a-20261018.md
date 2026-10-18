# Lane A: retained-site guidance correction — 18 October 2026

## Observed baseline and cause

Read `docs/operations/v1-followup-acceptance-20261018.md` and the retained `.superpowers/sdd/2026-10-18-publicuniverse-v1/native-site-timezone-131-final/` report, initial JSONL and chosen-zone answer. The initial JSONL contains two completed `resolve_place` calls with identical arguments, followed by revision-pinned details. The report counts four total calls across two turns, one fixture forward geocode, one fixture weather call and zero external-provider attempts. This is retained native CLI evidence with synthetic location/weather, not new execution or desktop acceptance.

The chosen-zone answer begins “Selected field is suitable for a beginner session” while its later paragraph leaves access, safety, lighting and horizon unverified. The existing guidance already required a display-timezone question and preserved unknowns, but its reuse rule specifically named resolved cities and focused follow-ups; it did not explicitly prescribe retaining site matches between resolution, details and timezone clarification. Its opening answer guidance also left room for an unsupported overall suitability verdict followed by caveats.

## Correction

All five skill entry points now retain successful city/site matches and exact identity/revision, reuse them through details and display-timezone clarification, and treat unknown timezone as a details/display-choice gap. Ambiguity needs selection or a more specific query; changed location, requested refresh and expired/rejected selections retain their existing recovery paths and permissions.

Opening verdicts must pair supported astronomy with site verification status. Unknown access, safety, lighting or horizon yields a provisional observing opportunity with the gap in the opening, not an affirmative suitable/safe/ideal/recommended-site claim. Darkness, geometry and display-timezone choice cannot establish suitability. The canonical outdoor contract carries the same rules so the package builder can compose them into workflow references. No generated package references were edited.

## Offline verification

Before editing guidance, added two instruction regressions in `tests/skills/workflows.test.ts` and ran:

`node --import tsx --test --test-name-pattern='all skills retain successful|all skills constrain opening' tests/skills/workflows.test.ts`

Result: **0 passed / 2 failed**, exit 1, missing the new city/site retention and opening-verdict contracts.

After correction, the four affected workflow/host/local suites passed **45 / 45**. Added a canonical-contract assertion, then ran:

`node --import tsx --test tests/skills/*.test.ts`

Result: **84 passed / 0 failed / 0 skipped**, exit 0. These are authored instruction/schema and deterministic fixture checks, not proof a native model follows the updated wording. The two retained native findings remain pending a fresh bounded packaged conversation replay; no model acceptance result is inferred from keyword assertions. No new pressure-scenario agent samples, provider requests, downloads, deployment or configuration changes were performed in this lane. No commit was created.

Preexisting edits in `docs/operations/data-sources.md` and `docs/operations/weather-provider-admission.md` were preserved. Version, release notes and shared acceptance trackers were left to integration.

## Cross-review refinement

The coordinator identified that the retained-selection paragraph could read as requiring details after every city resolution. Scoped it to “When observing-site details are needed” in all five skills and the canonical contract, and strengthened the regression to require both that condition and the existing city-no-details route. Focused offline run of `tests/skills/workflows.test.ts` plus `tests/skills/public-universe-workflows.test.ts`: **27 passed / 0 failed / 0 skipped**, exit 0. Native model compliance remains pending.


## Integration priority guard correction

The coordinator's first full suite exposed one package-priority regression: inserting the two new paragraphs at the start displaced existing timestamped-direction/source/timezone rules outside the first2,500-character guard. The fix moved the new paragraphs below the existing core first-decision paragraphs in all five skills; their wording and canonical contract were unchanged. No priority assertion was weakened. The combined `tests/platforms/local-package.test.ts` and all skill suites passed101/101 after relocation. The coordinator rebuilds and byte-verifies the final installed package and retains pre-layout native evidence separately from any final replay. This integration note does not infer universal model compliance.
