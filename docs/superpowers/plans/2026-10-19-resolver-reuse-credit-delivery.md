# Resolver reuse and credit delivery implementation plan

**Goal:** Correct the local resolver's missing selection guidance and make omitted final-answer credits an explicit acceptance failure.

**Architecture:** Preserve the existing API resolver, schemas, source notices and provider caches. Add equivalent exact-ID and reuse guidance to the local resolver. Add a pure acceptance check driven by explicitly selected source records; it detects omissions but cannot control another host's prose.

**Spec:** Owner-approved investigation of repeated resolution and missing final attribution; existing Tasks12B/15 remain the acceptance authority.

## Constraints and review focus

- No provider calls, downloads, credentials, quota changes, deployment or publication.
- No coordinate disclosure, implicit choice among ambiguous matches, invented snapshot expiry or verified site access.
- No global answer-credit guarantee from a string check; exact wording checks are conservative test contracts, not legal advice.
- Existing1.0.36 package/install freeze remains historical. This server change does not claim the installed server has been updated.
- Review missing matches, ambiguity, exact IDs/time zones, same-provider distinct notices, unsafe URLs and absent attribution.

## Evidence and alternatives

The retained1.0.36 meteor trace repeats identical successful resolution. Its local resolver text omits exact placeId/timeZone and reuse guidance present on the API path. This is a reproducible parity defect, not proof of the model's internal reason for repeating.

Complete source notices already reached the model. Official OpenAI reference says content/structuredContent reach model/component, not that the final prose must reproduce them. A component can render notices beside data in compatible hosts; unsupported clients still need text. References: https://developers.openai.com/plugins/reference and https://developers.openai.com/plugins/build/chatgpt-ui (checked19October2026).

Do not add a new UI architecture as a guessed fix. Record a separate host-rendering gate: server-owned result card with compact linked credits, capability detection, no reliance on hidden metadata as a display guarantee, actual target-host visual test. CLI prose compliance remains separate.

## Execution

- [ ] Task1: Add failing local resolver tests in tests/mcp/resolver-action-text.test.ts covering successful exact ID/timeZone/reuse, ambiguity, no matches and no coordinates. Implement local text parity in server/mcp/registerTools.ts. Re-run API and local resolver tests.
- [ ] Task2: Add tests/mcp/answer-credit-acceptance.test.ts and pure scripts/answer-credit-acceptance.ts. Require explicitly selected source attribution, safe source link and safe returned licence link; preserve distinct notices. Reject unsafe links as unusable evidence; missing data cannot be a pass. No auto-repair, model/API call or mutation. Register suite in tests/all.test.ts.
- [ ] Task3: Replay the two retained final answers through the checker (offline); both expected to fail missing credits. Record precise outstanding failures, avoiding another unbounded prompt/rerun cycle.
- [ ] Task4: Independent review, focused tests, type checks, full offline suite, build; update tracker with unchanged acceptance counts. Commit/push and watch exact-head CI under prior owner authorization.

## Self-review

Scope matches owner request; deterministic fixes and model-level acceptance are distinct. No schema/provider/package identity change. Failed retained answers must remain failed; no new model runs or installed-client acceptance claim in this wave.

## Execution ledger

Tasks1–3 implemented and checked. Plan reviewed independently before code. Local exact-ID regression RED→GREEN; credit assessor omission and non-rendered-Markdown regressions RED→GREEN. Final review's important false-pass finding fixed by refusing unsupported rendering contexts; these require manual visual review.34affected MCP checks, types and build pass. Retained native answers remain incomplete; no fresh model/host acceptance inferred. Full suite and exact-head CI are the remaining verification steps for Task4.

Task4 local verification complete: full offline suite1,859passed/0failed/2skipped, exit0. Commit/push and exact-head CI complete the branch handoff; CI outcome is reported to the owner after the run finishes. No remaining reviewer finding in the implemented scope; final native credit display remains the explicit open product gate.
