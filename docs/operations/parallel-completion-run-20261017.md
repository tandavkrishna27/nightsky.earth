# Parallel local completion run — 17 October 2026

Baseline: `bc8de008bc60d6b47f8422cf15787584d16e2698`. This run advances the existing six-block checklist; it does not create another wave numbering scheme or change ticket counts.

## Ownership

| Session | Branch | Work and expected handoff |
| --- | --- | --- |
| NightSky geography readiness | `codex/api-geography-completion` | Country selection, documented geometry contract, offline discovery combinations; `API-GEOGRAPHY-COMPLETION.md` |
| NightSky weather readiness | `codex/api-history-completion` | Practical bounded historical API ranges, accounting, mapping and reusable summaries; `API-HISTORY-COMPLETION.md` |
| NightSky events readiness | `codex/api-events-completion` | Nineteen meteor identities, source-qualified guidance, skills and event gaps; `API-EVENTS-COMPLETION.md` |
| Main integration session | `codex/plugin-v1` | Shared planner/runtime integration, factual policy drafts, API-mode rehearsal, offline load measurements, acceptance reconciliation and CI |

Domain sessions may use independent subagents. Each owns separate files and commits locally. The main session reviews and integrates commits, registers tests, runs the assembled checks, pushes the integration branch and verifies CI for that exact commit.

## Execution sequence

1. Run the three domain lanes in parallel. In the main session, prepare API privacy corrections, offline measurement and API rehearsal fixtures concurrently.
2. Review each handoff against implementation and focused tests. Integrate shared planner/runtime changes only in the main session.
3. Reconcile canonical skills, package metadata, supported capabilities, attribution and API disclosures. Keep source gaps explicit.
4. Run integrated type checks, tests, package/build checks and local transport checks. Fix material failures before recording completion.
5. Push the reviewed integration commit and watch its CI. Record criterion-level evidence in the existing tracker and ticket matrix.
6. Prepare the exact assembled native-model rehearsal; Claude remains deferred. Live provider checks, owner questions and later release gates remain distinct from offline evidence.

## Boundaries

- No new provider/data calls, historical downloads, bulk catalogue builds, deployment, publication or paid endpoints in this run. Previously consumed allowances cannot be reused.
- Primary-source documentation research and retained-data/offline tests are permitted.
- No API keys, private quota records or raw account configuration in commits or reports.
- The fourteen-day historical pilot size is not assumed to be a production API limit. Research practical request sizing before proposing any further data work.
- Synthetic tests establish software behavior, not live source coverage, forecast accuracy or small-server fit.
- Whole-ticket counts stay **12 Done / 9 Partial / 6 Not started** until the original acceptance clauses justify a change. Preparation for blocks 2 and 3 can proceed before block 1 is fully accepted.

## Initial acceptance audit

Actionable local gaps: stale file-only privacy wording; service-method-only capacity evidence; catalogue-based model fixtures; final integrated package reconciliation. Hosting, official identity/URLs, publication and real pilot evidence cannot be closed by local fixture tests. Website Task 18 remains separate.

## Integrated delivery

All three lane deliveries are integrated on `codex/plugin-v1`:

| Lane | Integrated commits | Result |
| --- | --- | --- |
| Events | `144f83b`, `8805dfb` | Nineteen-code identity resolver; five qualified civil guidance rows; useful partial-session/learning skills; root planner integration and regressions |
| Geography | `1eba139`, `14c7be2` | Structured country/state resolution; populated-place filtering; selected Details identity and geometry provenance; offline scenario coverage |
| History | `c61165a` | Range/credit planning, explicit bounded operator worker, validated durable cache and read-only provider; root API-mode configuration and preflight integration |

The root integration also fixes API revision loss in composed event and aurora
results, prepares API-mode model fixtures and eight review cases, adds concurrency
and compiled-runtime measurements, updates factual privacy disclosures and builds
version **1.0.14** of the local rehearsal package. The package is not installed,
submitted or published. Independent broad review found no material issues after
runtime and privacy integration.

## Local evidence

- All three TypeScript projects, website/backend build and deterministic
  Codex/Claude package validation passed; 14 tools and five canonical skills.
- Eight scripted review cases passed in each of API and legacy fixture modes.
  These are server assertions, not new model evaluations.
- Production, standalone full/resolver-only and regional compiled checks passed
  with no upstream calls.
- Existing configured Python environments: ERA5 **214 passed / 8 skipped**;
  geography **245 passed / 5 skipped**. Initial system-Python invocations lacked
  dependencies and failed; these authoritative reruns used existing environments
  without installing anything.
- Compiled API fixture bundle: 581480 bytes,
  SHA-256 `875a8f0102ce5bc3b058707c205f6484397134f6baca94e60afa4c4e7ff67297`.
  Module/app initialization about 292 ms, listener 11 ms; four sequential loopback
  calls about 40/18/42/73 ms; sampled process RSS 194129920 bytes. This excludes
  process startup and real network latency and does not establish Hetzner fit.
- Offline load scenarios passed: eight identical callers coalesced to one fake
  request; ten distinct callers admitted eight; outage and 429 stopped without
  extra dispatch. Twelve total fake calls; sampled process RSS 83963904 bytes.
  The advancing fixture clock is not production throughput evidence.
- Public rehearsal archive SHA-256:
  `9eeaf7c22e88636ae8e2072aa51391a6eb007923113163db68e6440ec9642f86`.

Full aggregate Node suite: **1,446 passed, zero failed, two skipped** (1,448 total; 244.6 seconds). Reviewed implementation pushed as `a34af2420f0289c54bc31f7357732434eb4e1dd1`. [Its exact-commit CI run](https://github.com/tandavkrishna27/nightsky.earth/actions/runs/39023674592) was queued at documentation time. Check the run conclusion directly; prior CI is not evidence for this integration. Any documentation-only follow-up has its own [branch CI run](https://github.com/tandavkrishna27/nightsky.earth/actions?query=branch%3Acodex%2Fplugin-v1).

## What remains inside the fixed blocks

1. **Capability acceptance:** separately permitted geography selection/geometry
   validation; hosted history policy/method admission, annual shape check and
   then a real full-point baseline/resource measurement; event source/year/model
   gaps remain explicitly unsupported. No automatic data acquisition is enabled.
2. **Actual configured-service measurement:** synthetic instrumentation is ready;
   real enabled sources/history and chosen small host still need measured evidence.
3. **Assembled native experience:** API fixture harness/package is ready; actual
   Codex/owner questions and whole-answer review remain. Claude is deferred.
4. **Hosting/client checks**, 5. **submission/publication**, 6. **pilot feedback**
   remain later separately authorized stages. Website scope remains independent.

This run completes substantial local implementation and verification within the
existing blocks. It does not reset their numbering, waive live/owner acceptance,
or claim all original tickets closed. No new provider/data requests, deployment,
publication or private-state resets occurred.
