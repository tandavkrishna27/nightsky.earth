# Public Universe optional integration — implementation evidence

## Status

Local implementation is complete on `codex/plugin-v1`; installed package is **1.0.21**. All implementation review findings are resolved and independently rechecked. No source activation, live astronomy test, deployment or publication has occurred. Original ticket accounting remains **12 Done / 9 Partial / 6 Not started** until release criteria are reconciled.

Design and task sequence: [design](../product/publicuniverse-v1-integration-design.md), [plan](../superpowers/plans/2026-10-18-publicuniverse-v1.md), [two planning reviews](publicuniverse-plan-review-20261018.md). The owner approved implementation after those reviews.

## Reviewed local work

| Layer | Evidence | Review status |
| --- | --- | --- |
| Baseline | Full offline suite: 1,691 total, 1,689 passed, zero failed, two skipped; 236.5 seconds | Clean baseline after rerun with filesystem/child-process/loopback permissions |
| Contracts | Strict public schemas, pinned upstream parsers and synthetic fixtures; 23 tests passed; type checks passed | Independent review found null horizon, long model-note, lost appearance and Moon/darkness binding defects; fixed and scoped re-review approved |
| Transport/reference state | Fixed routes, 15-second bounded operations, streamed limits, dedicated quota interface, durable cooldown, identity-only store and permitted reference cache | Independent review approved; 48 affected/regression tests passed |
| Extra deadline cases | Three tests passed: uncooperative reservation, uncooperative body reader and earlier coalesced waiter | Additional review coverage; no production change required |
| Provider/configuration | 76 affected/existing-source tests and all three TypeScript checks passed; root independently reran 16 provider/configuration tests | Review found exoplanet revision and host provenance gaps; fixed with regressions, scoped re-review approved |
| MCP/workflows | 101 affected tests passed, including a complete mixed-source outing and all new modules registered in the aggregate | Scoped review requested full-outing coverage; regression and five explicitly unrun authored conversation fixtures added, then approved |
| Full assembled regression | 1,760 tests: **1,758 passed, zero failed, two skipped**, 257.7 seconds | Fresh run after all code/review/inventory corrections |
| Release CI | All six jobs passed for `5bcc77a495b7f4c14dbc4c6867d651ecb2abc0e1` | [Exact release run](https://github.com/tandavkrishna27/nightsky.earth/actions/runs/39072377236), Linux and Windows |

Test counts overlap; do not add affected/regression counts to the eventual aggregate.

An additional source-shaped regression reproduced the close-approach final-date exclusion caused by the backend's timestamp-text filter. The wire end bound now includes the final day's fractional-second timestamps while public input and response validation retain the same inclusive calendar range. The regression and 14 related transport/deadline tests passed; independent review confirmed the correction.

Final whole-diff review found two P2 issues: nullable meteor drift/orbital fields were rejected by the normalized schema, and starter coordinate values lost their public frame/epoch/motion context. Both source-shaped regressions were observed failing, corrected, and independently rechecked with 36 passing contract/provider/evidence tests. A subsequent full run found two outdated workflow/package tool-inventory expectations; those were corrected with 14 affected tests passing. The final fresh aggregate result is recorded below when complete.

## Optional setup

No account or API key is needed. Append `publicuniverse` to the existing `NIGHTSKY_SKY_PROVIDERS` selection only when preparing this source; preserve existing selected/admitted IDs. Keep it out of `NIGHTSKY_SKY_ADMITTED_PROVIDERS` until separately approved. Its private absolute `NIGHTSKY_PUBLICUNIVERSE_QUOTA_STATE_PATH` must differ from all existing ledgers. Startup never initializes accounting. `node --import tsx scripts/initialize-public-universe-quota.ts --plan` produces a proposal only and reports `writesPerformed:false`; it neither creates the ledger nor activates requests. Do not reset an existing allocation for testing.

The configured provider's four internal methods are `searchReferenceObjects`, `getReferenceDetails`, `discoverObservingTargets` and `getCatalogueTargetWindows`; the last two receive coordinates only after the existing revision-aware place resolver. The four public MCP names remain those in the design. Reference facts never become extra supported targets in the existing local engine.

## Source and evidence boundaries

Pinned upstream backend: `Wicked-Sick-Ltd/solar-system-db` at `95584ebc5f8cc40e4f6dc923f4e58288910e0093`. Research read small source modules and public API definitions. Fixtures are synthetic, not captured observing evidence. No upstream source code or plugin skills were copied wholesale.

Observing requests use source-qualified rounded coordinates and selected windows. Full-night chart samples, full-night midpoint Moon phase, selected-interval coverage and numerical tolerance remain distinct. Starter source snapshots are independent of SQLite catalogue identity. OpenNGC data rights and Bright Star Catalog credits remain separate from the upstream software MIT licence.

Public Universe is optional and off by default. Existing NightSky engines and providers remain the default. Missing source admission or dedicated accounting must deny only this optional provider. Installation does not initialize quotas or activate requests.

## Remaining acceptance

- Separately approved [bounded live proposal](publicuniverse-live-validation-proposal.md), followed by actual host conversation acceptance. No old allowance authorizes new requests. Claude testing remains deferred.

The release code is pushed and its exact CI run passed. This evidence-only follow-up does not change the installed package or backend; its own CI is also checked before the handoff.

## Final local package verification

- All three TypeScript configurations, backend build and portable packaging passed.
- Deterministic Codex/Claude package verification passed. Actual loopback packages contain 15 files each; the same existing local Codex plugin was updated with the supported installer, not a second identity. All 15 installed files match their inventory hashes.
- Codex ZIP SHA-256: `809d7edb5ad85f50e19f4021a4d0b281957f9de463092596957b371712f604f1`.
- Claude ZIP SHA-256: `4009a0a329595dc928f70f097509fb00e4eb1ddde308149a93534f164c0116fc`.
- Compiled backend SHA-256: `034d22b5df7ecc3ce80845eaef3345c1800bd7486d60e432d56b83e61ec241fd`.
- Compiled synthetic API and light-pollution checks passed. `node scripts/verify-public-universe-runtime.mjs` confirms 18 tools with Pub selected, all four new names, unavailable status when unadmitted and zero external attempts. CI includes this compiled check and an explicit 11-module optional-source step.
- Package installation is not native-host conversation acceptance. No real-data server was started and no provider allowance was spent.

## Follow-up Windows fixture correction

The documentation follow-up CI exposed a race in the existing ERA5 native-child test: receipt existence could precede completion of its text write. The inert test child now closes a sibling staging file before atomically replacing the receipt. Production containment, handshake, deadline and termination behaviour are unchanged. Independent review found no issues. Verification passed: all 16 tests in the affected module, 20 repeated native containment cases, and the complete ERA5 offline suite (222 tests, 8 skipped). The final correction commit is subject to the same six-job CI before handoff; no package rebuild is required for this test-only change.
