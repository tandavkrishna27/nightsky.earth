# API event workflow readiness — 17 October 2026

This implements the workflow lane of the API-first planning continuation at baseline `bc8de008`. It does not establish full V1 acceptance, source activation, installed-host behavior or production readiness.

All five canonical workflows and source skills now distinguish a useful session plan from a peak-optimized meteor recommendation. Missing exact maxima/full-season coverage do not block ordinary stargazing, photography, preparation or learning. A selected meteor session retains its shower and user-chosen window with qualified darkness/weather/preparation and supported radiant samples. A concept-only lesson does not require a destination/date; local claims still require a selected point, current identity/revision and verified or explicitly chosen display timezone. Equipment teaching remains conversational: the planner does not accept an equipment profile or calculate exposure settings.

Optional host search has a concrete missing-field/source/year/precision handoff. Web material remains untrusted, separately attributed context; it cannot configure an endpoint, import a calendar or silently alter runtime evidence. Search absence leaves a useful supported plan and an explicit verification step. All nineteen meteor identities remain in scope for evidence review; the thirteen-row proposal is unadopted. Source-specific annual versus general periods, civil/UT/unspecified time basis, independent forecasts, typical longitude intervals and radiant fit domains remain distinct. No civil guidance count is hardcoded.

## Local verification

Authoring regressions first failed because the useful-partial decision path was absent. New offline journeys retain astronomy, preparation and candidate windows for stargazing, astrophotography and learning when event lookup fails; LYR 2027 retains civil guidance and local samples without inventing a maximum; ORI 2026 preserves its date-only maximum and unspecified time basis. Mutation checks reject blocking or silently substituted meteor instructions. Existing host-capability, multi-weather, source/citation, package-priority and canonical-reference checks remain included. These are injected-service/local astronomy fixtures, not live provider or model/host trials.

Verification passed:

- `node --import tsx --test tests/skills/local-experience.test.ts tests/skills/workflows.test.ts tests/skills/host-capability-workflows.test.ts tests/skills/multi-weather-workflows.test.ts tests/platforms/package.test.ts tests/platforms/local-package.test.ts` — **65 passed, zero failed/skipped**. Five new assembled journeys passed; the separate URS integration case below remains unresolved.
- `npm run plugin:package` — existing generator passed; rehearsal ZIP SHA-256 `1265b6c1e459eadd11823d99a0943e5f3066ac147aecf37e35f3113451a2fd88`, with five exact canonical workflow references.
- `node --import tsx scripts/verify-local-plugin-packages.ts` — deterministic Codex/Claude rehearsal packages verified, five canonical workflows per host, `pluginInstalled: false`, `submissionReady: false`.

Generated rehearsal artifacts do not install or publish a plugin. Coordinator-owned combined types/full suite and actual-host journeys remain pending this lane's delivery.

## Coordinator-owned planner integration remains open

An actual assembled URS regression failed: the planner's local twelve-code resolver cannot select URS civil guidance. DRA has the same dispatch limitation. The coordinator must integrate the shared nineteen-identity resolver, respect source-general versus annual recurrence, retain source time basis/uncertainty, and filter selected-shower peak summaries. The exact root-owned changes are described in [planner integration](API-EVENTS-PLANNER-INTEGRATION.md). The workflow lane made no planner/server/schema edits.

The failing regression was moved here as executable integration guidance, rather than skipped or counted as passing. Restore it inside `tests/skills/local-experience.test.ts` using that file's existing fixture helpers after the coordinator patch:

```ts
test("assembled Ursid journey retains independent source forecasts and an unavailable radiant", async () => {
  const window = { ...journeyWindow, startUtc: "2026-12-22T12:00:00Z", endUtc: "2026-12-23T11:00:00Z" };
  const result = await planObservingSession({ placeId: journeyPlaceId, window, activity: "meteor-shower", target: "URS" }, journeyServices());
  const events = result.evidence?.events;
  const nasa = events?.events.find(event => /Ursid/i.test(event.name));
  const ign = events?.meteorCivilGuidance?.find(row => row.code === "URS");
  assert.equal(nasa?.peakUtc, "2026-12-22T15:54:00Z");
  assert.equal(ign?.maximumWording, "December 22 at 22h universal time");
  assert.notEqual(nasa?.source.url, ign?.source.url);
  assert.ok(result.factors.some(factor => factor.name === "Meteor civil calendar guidance" && /22h universal time/.test(factor.assessment)));
  assert.ok(result.evidence?.meteorRadiantSamples?.every(sample => sample.status !== "available" && !("altitudeDeg" in sample)));
  assert.ok(result.candidateWindows.length);
  assert.ok(result.sources.some(source => source.url === nasa?.source.url));
  assert.ok(result.sources.some(source => source.url === ign?.source.url));
});
```

The observed failure was the civil-factor `22h universal time` assertion: structured IGN/NASA records were retained, but the selected URS factor was absent. The later assertions did not execute; they are proposed acceptance checks, not verified outcomes.

Actual installed Codex skill loading/model behavior, assembled owner journeys, configured-source S3 measurements, hosted connection/location checks and later publication remain separate gates. No source HTTP request, credentials, live API, dataset acquisition, deployment, installation or commit occurred in this lane.
