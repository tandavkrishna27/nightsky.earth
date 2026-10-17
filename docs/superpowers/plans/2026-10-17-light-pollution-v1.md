# V1 light-pollution API and browser integration implementation plan

> **For agentic workers:** Use superpowers:subagent-driven-development or superpowers:executing-plans to implement task-by-task. All tasks below remain unchecked until their evidence exists.

**Goal:** Give NightSky one-place and short-list light-pollution comparisons using DarkSkySites API plus separately admitted browser adapters for DarkSkySites and Lightpollutionmap.info.

**Architecture:** Reuse the MCP resolver, quota controls and structured-result conventions. Isolate optional browser work in a bounded child process; API-only operation has no browser dependency. Preserve source identity independently of transport.

**Tech stack:** Existing TypeScript, Zod, Node fetch, MCP SDK and Node test runner. Proposed optional Playwright/Chromium runtime for the browser child; pin and verify its version during implementation, not the Codex desktop automation runtime.

**Spec:** [Agreed design](../../operations/light-pollution-v1-design-20261017.md).

## Global constraints

- All work is V1. No deployment, bulk geographic collection or historical downloads.
- DarkSkyLab excluded. Existing weather, astronomy, history and acceptance work remains open independently.
- No new database or global map download. API key presence is not live admission.
- Free latest-zenith API only: GET https://darkskysites.com/api/sqm with lat/lng and server-only x-api-key. Omit date and never call history/directional endpoints in this scope.
- Published project limits are 30,000 requests per UTC month and 10/second; verify account entitlement before activation. Multiple keys share the project allowance.
- Provider estimates are not live measurements. Always retain dataset and quality metadata; do not turn unverified_zero into confirmed darkness.
- Public browser operation requires documented access/reuse basis and agreed rate/caching policy. Stop on access challenges; no bypass.

## Review focus

1. Stale selected card versus moving hover value: browser adapter must bind a result to requested coordinates or reject it (LP3/LP4).
2. Dataset fallback and unverified zero: preserve actual month and uncertainty; never rank unknown coverage as pristine (LP1/LP2/LP5).
3. Quota/auth failures: cannot trigger scraping around limits or reset prior counters (LP2/LP5).
4. Two transports from one provider: never count as independent sources; do not average inconsistent models (LP1/LP5).
5. Browser process crash or timeout: API/weather/MCP remains responsive; cancellation closes child pages (LP3/LP6).

## Sequence and parallel work

LP1 -> LP2 and LP3 in parallel -> LP4 after LP3.
LP5 can be developed against LP1 fixtures while adapters are built; final integration waits for LP2 and LP4.
LP6 follows integration. Account evidence and browser-use permission research can proceed alongside all implementation.

These six work packages are subtasks of existing completion blocks 1 (capability), 2 (assembly/measurement), 3 (experience). They do not change the original 27-ticket totals or restart the wave count.

## Contract

Proposed MCP tool: `compare_light_pollution`, accepting 1..5 uniquely named candidate IDs with a discriminated location union: {kind:"selected-place", place: calculationPlaceInputSchema} or {kind:"coordinates", latitude, longitude}. Accept optional adapters as {sourceId,transport} pairs, not source IDs alone. Resolve all points before outbound requests; preserve current resolver revision checks. No arbitrary URL, CSS selector or browser script input.

Create `shared/nightsky/lightPollution.ts` with schemas/types:
- `LightPollutionPoint`: candidateId, latitude, longitude.
- `LightPollutionResult`: candidateId, sourceId, transport (api/browser), status (available/partial/unavailable), requestedPoint, observedPoint or null, coordinateBinding (verified/rounded/unverified), retrievedAt, dataset label/id/year/month and optional structured requestedDate/fallbackUsed/fallbackFrom/fallbackReason/datasetsChecked where supplied, sqm or null, unit fixed to mag/arcsec2, bortleClasses array of integers 1..9 or null, quality metadata (including nullable status/method/coverageVerified/flags), attribution, sourceUrl, limitations, errorCode or null.
- `LightPollutionProvider.lookup(point, signal): Promise<LightPollutionResult>; optional lookupMany(points, signal): Promise<LightPollutionResult[]> for one bounded browser comparison`.
- `compareLightPollution(points, providers, signal): Promise<{results: LightPollutionResult[]}>`.

Missing fields stay null/explicit; no fabricated dataset dates or precision. Rounded browser coordinates do not independently verify an exact point. Bortle 8-9 remains [8,9]. Retain provider-specific visibility labels only as attributed assessments, not standardized forecasts; omit projections/darkness percentages from recommendations in V1.

## LP1 — Shared contract and comparison logic

Files: create `shared/nightsky/lightPollution.ts`, `server/providers/lightPollution/index.ts`, `tests/providers/light-pollution-contract.test.ts`.

- [x] Add failing tests: invalid latitude/longitude/nonfinite values, zero/six candidates, duplicate IDs, Bortle ranges, missing SQM, two transports sharing source identity, per-source failure preservation.
- [x] Run `node --import tsx --test tests/providers/light-pollution-contract.test.ts`; confirm expected missing-contract failures.
- [x] Implement the contract above; deduplicate identical coordinate/source work within a call while returning each candidate's identity. No cross-provider average or automatic overall darkness score.
- [x] Rerun focused tests; require zero failures. Review and commit this deliverable.

## LP2 — DarkSkySites API and private configuration

Files: create `server/providers/lightPollution/darkSkySites.ts`, `server/providers/lightPollution/configuration.ts`, `tests/providers/darkskysites.test.ts`; modify `server/plugin.ts` and the existing quota integration only where needed. Reuse `server/providers/quotaState.ts`, `sourceCache.ts`, and `upstreamControls.ts` rather than creating a second accounting system.

- [x] Add tests using synthetic responses for 200, 400/401/403/404/429/500/503, invalid JSON, wrong coordinates, invalid SQM/Bortle, earlier dataset fallback, missing quality and unverified_zero. Missing key/admission produces no request. Verify no key in results/errors.
- [x] Run `node --import tsx --test tests/providers/darkskysites.test.ts`; confirm failures before implementation.
- [x] Implement lookup with fixed host/path, redirects rejected, 15-second total request deadline, 256 KiB response cap, no retries. Preserve original quality fields including coverageVerified=false. Missing critical provenance means partial or unavailable, never silently verified.
- [x] Read `NIGHTSKY_DARKSKYSITES_API_KEY` only server-side. Proposed source selection `NIGHTSKY_LIGHT_POLLUTION_SOURCES` and separate API admission `NIGHTSKY_LIGHT_POLLUTION_API_ADMITTED`; empty defaults. Do not mutate existing counters during startup. Conservatively reserve every dispatched attempt in local accounting; document that provider billing may release failed attempts.
- [x] Add optional in-memory API cache: 24-hour TTL, maximum 256 entries, coordinate/source/transport key; preserve original retrieval time and dataset. No failure caching as a successful value. No browser caching until policy established.
- [x] Rerun tests and `npm run check`; review and commit. Key alone does not enable service.

## LP3 — Optional browser boundary and Lightpollutionmap adapter

Files: create `scripts/light-pollution-browser-worker.ts`, `server/providers/lightPollution/browser.ts`, `tests/providers/light-pollution-browser.test.ts`; modify `package.json`, lockfile and `tsconfig.tools.json` as needed for optional browser dependency/build.

- [ ] Add local HTML fixture tests: exact coordinate popup, delayed response, previous popup remaining, coordinate mismatch, range class, missing layer/year, changed labels, malformed values, access challenge and timeout. Fixtures must be synthetic, not copied map tiles.
- [ ] Run `node --import tsx --test tests/providers/light-pollution-browser.test.ts`; demonstrate missing implementation failures.
- [ ] Implement JSON-lines parent/child protocol carrying only candidate/coordinates/source/request ID. Validate inputs before opening a page. Dedicated clean browser context, no private env/profile inheritance, fixed website navigation, no arbitrary URL tools. Use supported browser actions and visible DOM extraction; no hidden API interception or application-state access.
- [ ] Start with one active browser job, queue at most two comparisons; reject excess as busy. One comparison deadline 90 seconds, individual point deadline 30 seconds including load. Cancel/close pages on deadline; return completed partial results. Defaults are proposed ceilings, not measured promises.
- [ ] Implement Lightpollutionmap coordinate entry, layer capture and exact popup matching. Refuse stale/ambiguous values. Retain data year and attribution. Browser admission flag remains off by default and distinct from API admission.
- [ ] Launch child only when explicitly enabled; importing/running API mode must work without installed Chromium. Block loopback/private network destinations in worker network policy while allowing required public page resources; test policy using synthetic fixtures. No credentials sent to page code.
- [ ] Rerun fixture tests, type/build checks; review and commit. Live site checks remain separately bounded.

## LP4 — DarkSkySites browser adapter

Files: create `server/providers/lightPollution/darkSkySitesBrowser.ts`, `tests/providers/darkskysites-browser.test.ts`; extend browser worker source dispatch.

- [ ] Add regression fixtures for coordinate navigation retaining old card, hover values disagreeing with card, multiple cards and rounded coordinate labels. Include an exact binding unavailable case that must return unavailable rather than a guessed coordinate.
- [ ] Run `node --import tsx --test tests/providers/darkskysites-browser.test.ts`; demonstrate failures.
- [ ] Implement explicit point selection and result-card association. Require observable evidence linking selected marker/result to requested point; rounded labels alone are insufficient. If live UI cannot provide reliable binding, retain adapter as experimental/unavailable and record precise blocker.
- [ ] Keep sourceId=darkskysites and transport=browser. Never scrape paid directional/history features as fallback. Do not send the API key to the browser.
- [ ] Rerun tests; review and commit. Both browser adapters remain opt-in until policy and reliability gates pass.

## LP5 — MCP integration and skills

Files: create `server/mcp/lightPollutionTools.ts`, `tests/mcp/light-pollution-journeys.test.ts`; modify `server/mcp/registerTools.ts`, `server/plugin.ts`, existing tool-inventory tests; update `plugins/nightsky/skills/find-observing-place/SKILL.md`, `plan-stargazing-night/SKILL.md`, `plan-sky-event/SKILL.md`, `plan-astrophotography/SKILL.md`.

- [x] Add controlled MCP tests for single place, supplied point, three candidates, revision mismatch, ambiguous place, one-source unavailable, both unavailable, differing dates/models, same-source transport identity, unknown site access, and six-candidate rejection before outbound calls.
- [x] Run `node --import tsx --test tests/mcp/light-pollution-journeys.test.ts`; confirm failures.
- [x] Register `compare_light_pollution` read-only/open-world tool using existing resolver. Existing aggregate weather/astronomy planning must keep working if light pollution fails. Keep browser requests explicit, not automatic hidden fan-out in every planner call.
- [x] Transport policy: DarkSkySites API by default; browser only explicitly enabled/requested under approved access basis. No automatic API-to-browser retry for 401/403/429, quota exhaustion or Pro gating. API 5xx returns unavailable; a later browser comparison requires its own ordinary admitted request.
- [x] Tool text includes source attribution adjacent to values, actual dataset date, modelled status and uncertainties. Skills compare only evaluated candidates and do not equate zenith darkness to unobstructed horizon/clear weather/night access. Poor cloud outlook still discourages long travel.
- [x] Run focused tests; review skills with writing-skills guidance and commit. Update manifests/package only with actual new tool inventory; preserve all hosts' shared backend behavior.

## LP6 — Verification, measurements and handoff

Files: create `scripts/validate-light-pollution.ts`, `tests/operations/light-pollution-validation.test.ts`, `docs/operations/light-pollution-acceptance-20261017.md`; modify `tests/all.test.ts`, `.github/workflows/nightsky-v1-checks.yml`, plugin release notes/package configuration, operator setup and completion tracker.

- [ ] Add offline tests proving dry-run is default, no secrets in receipts, exact call/byte/time caps, retained counters, missing admission refusal and no retry after failure.
- [ ] Register every new suite in aggregate tests; CI remains offline and needs no real keys. Browser integration CI uses synthetic HTML and pinned Chromium on supported Windows/Linux jobs. Document browser installation/build instructions without publishing/deploying artifacts.
- [ ] Run affected tests, `npm run check`, `npm test`, `npm run build:plugin`, `npm run plugin:package`; verify actual command exits and counts.
- [ ] Prepare (do not automatically execute) two-point API pilot: Hyderabad 17.3850,78.4867 and Shamirpet-area 17.6100,78.5630, at most two requests, 512 KiB total, 60 seconds, no retries; reconcile account usage first. Browser traffic has many subrequests: measure separately; never describe two page visits as two HTTP requests.
- [ ] Measure cold/warm API and browser latency, whole-process-tree peak RSS, CPU, downloaded bytes, cache size, timeout recovery and concurrent weather responsiveness. Browser batch: at most four point lookups/two providers with 5-minute overall deadline; select bandwidth cap from observed page requirements before executing. No unmeasured fit claim for 2 CPU/4 GB.
- [ ] Native model checks: one-place explanation, shortlist comparison, source disagreement, unavailable results, correct attribution; owner tries own questions. Preserve model output separately from deterministic tests. Claude deferred unless owner resumes it.
- [ ] Review diff, update dated evidence and existing tracker blocks, commit/push and watch exact-commit CI. Browser public-use gates and original outstanding tickets remain visible. No deployment or publication.

## Test map

Input -> validation [unit] -> existing resolver [MCP integration]
 -> admitted API [transport/schema/quota unit + bounded live]
 -> admitted browser [synthetic DOM integration + bounded live coordinate check]
 -> structured source results [MCP integration]
 -> skill-guided explanation [native model evaluation]
Failures at either source -> partial/unavailable -> existing weather/astronomy still usable [regression].

## Preliminary planning self-review

Scope: reuse existing quota, resolver and provider conventions; no database, scheduler, raw-data service or new global catalogue. Three adapters are necessary for the owner's agreed two sources/two transports; API-first delivery is independently useful. Browser runtime is the largest added complexity and stays optional.

Architecture: source identity differs from transport identity; browser child isolated from secrets; no automatic scraping on denied API access. Exact-coordinate browser binding is a blocker, not a tolerance silently invented from rounded labels.

Code quality: one shared result schema; separate provider-specific parsers; common worker lifecycle; safe enum failure codes rather than raw provider error echoes.

Tests: contract, transport, DOM fixtures, MCP, original planner regressions, live acceptance and native response checks are distinct. Browser manual feasibility is not automated production acceptance.

Performance: small candidate batches, bounded queue/child lifetime/cache, no browser in normal API-only startup. Capacity is unresolved until measured.

## Binding engineering review corrections (17 October 2026)

These requirements supersede draft wording where more specific. Full six-package scope was accepted by the owner. Independent same-model architecture/code/test/performance review is complete; all eight findings are incorporated below.

1. LP1: validate selected-place and explicit-coordinate inputs; deduplicate source + transport + exact coordinates, restoring each candidate ID. Validate result cross-field invariants: unverified/rounded binding never carries usable SQM/Bortle; unavailable results carry no metrics; dataset omissions cannot imply verified provenance.
2. LP2: add darkskysites to shared upstream provider controls with a provider-specific maximum of 10 calls/second. Use existing PersistentQuota in a dedicated NIGHTSKY_LIGHT_POLLUTION_QUOTA_STATE_PATH (one ledger per project, shared across key rotations); explicit initialization/migration only, never startup initialization. Existing other-provider counters remain untouched. Reserve inside actual dispatched operations after cache/dedup. Test restart, UTC rollover, exhaustion and key rotation. Owner confirmed unused project and 30,000/month on 17 October; this is account evidence, not live-call authorization.
3. LP2: implement bounded evidence-only cache keyed by source, transport and exact coordinates, not candidate ID or signal. Preserve original retrieval time/attribution/dataset and rebind candidate identity. Test TTL, eviction, concurrency, aborted callers and nearby coordinates. Do not force generic sourceCache into an incompatible interface.
4. LP3/LP4: compile the worker separately to dist/light-pollution-browser-worker.js, resolve with import.meta.url, and lazy-load optional Playwright. API-only artifact must work with both Playwright and Chromium absent. Backend worker packaging is separate from plugin ZIP (skills/remote connection metadata).
5. LP3: comparison 90-second deadline includes queue wait, point 30-second deadline; at most one active comparison and two waiting. Bound JSONL input/output, return unavailable for unfinished points. Terminate whole process tree on cancellation/timeout/shutdown and ensure parent-disappearance cleanup. Synthetic tests cover queue saturation, crash recovery and concurrent weather responsiveness. Chromium memory enforcement and actual host capacity remain public-use admission gates until measured; never claim timeout alone bounds RSS.
6. LP3/LP4: only fresh visible selected-result evidence can bind exact coordinates, independent of rounded card/hover labels. Test identical rounded labels at distinct points, stale cards and out-of-order completion. If the live UI cannot establish binding, the adapter stays unavailable rather than fabricating precision.
7. LP3: explicit fixed public-origin/resource allowlist, DNS/IP including IPv6/private/loopback validation and redirect checks, credential-free child environment, bounded protocol/error output. If rebinding-resistant network isolation cannot be guaranteed by the runtime, fail closed for public admission and document the deployment egress requirement; do not claim hostname checks solve it.
8. LP5/LP6: update canonical docs/product/workflows alongside packaged skills. Propagate MCP cancellation. Resolve every candidate before source traffic. Offline fixtures, live automation, API pilot and native model acceptance are separate evidence gates. No public browser operation until policy and runtime gates are satisfied.

## GSTACK REVIEW REPORT

| Run | Status | Findings |
| --- | --- | --- |
| writing-plans self-review | Complete for draft | Six packages, interfaces, dependency sequence and verification commands recorded |
| plan-eng-review full review | Complete | Owner retained full scope; architecture, code quality, test and performance findings incorporated above |
| Independent plan review | Complete | Eight corrections incorporated; separate implementation review still required |

VERDICT: Plan reviewed and ready for implementation. Feature acceptance still requires code review and test evidence.

**UNRESOLVED DECISIONS:**
- Full implementation scope accepted; browser public activation remains gated.
- Browser automated-use permission and cache/rate terms remain unverified.
- Account entitlement confirmed by owner: unused project, 30,000 requests/month. Real response validation remains pending; key alone is not activation.

## Implementation reconciliation — 17 October 2026

See [acceptance and operator setup](../../operations/light-pollution-acceptance-20261017.md) for current evidence. The checklists above retain unmet live/browser criteria rather than marking scaffolds complete.

| Work package | Current state | Outstanding |
| --- | --- | --- |
| LP1 | Implemented and reviewed | Final aggregate/CI |
| LP2 | Implemented and reviewed; final review fixed five-point concurrency | Two-point real API pilot |
| LP3 | Optional worker boundary and synthetic parsers reviewed | Actual visible DOM integration, rights, egress, Chromium lifecycle and process-tree capacity; public worker hard blocked |
| LP4 | Selected-card parser and injected visible-action workflow reviewed | Concrete exact-marker DOM binding and worker integration unavailable; experimental |
| LP5 | MCP, package inventory and four workflows implemented and reviewed | Native host/owner response acceptance |
| LP6 | Seven suites registered, offline pilot executor and compiled artifact check built | Final aggregate/CI, approved live pilot, native acceptance, browser capacity |

Review found and fixed valid five-point comparisons exceeding the four-call provider concurrency ceiling. Regression cases cover all five calls, cancellation before the fifth, and quota exhaustion. Independent final reviewer rechecked the correction with no remaining blocking finding.

CI runs synthetic parsers and a compiled hard-blocked child; it does **not** claim pinned real-Chromium DOM/lifecycle acceptance. The earlier LP6 real-browser CI criterion remains open, as do browser whole-process-tree/egress measurements. No Chromium or map datasets were downloaded. Account allowance is confirmed unused at 30,000/month; live approval remains separate.
### Accepted local/API milestone

Code a2cb606 passed all six CI jobs; the reviewed, explicitly approved two-point pilot then returned two HTTP200 results with exact binding (783 bytes,2.887 seconds,zero retries). Dedicated private quota records two reservations; no other counters changed. See the acceptance document for values/provenance and the consumed allowance. LP2 real-response gate is now passed; native full-package acceptance and LP3/LP4 public-browser gates remain open. No installed plugin update or deployment is implied.
