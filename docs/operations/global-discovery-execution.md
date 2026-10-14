# Global discovery execution — 15 October 2026

Branch: `codex/plugin-v1`; approved [design](../product/global-discovery-design.md) and [implementation sequence](../superpowers/plans/2026-10-15-nightsky-global-discovery.md). This record distinguishes implemented local extensions from real source/host/client acceptance.

## First local wave

- Shared discovery schemas preserve existing city-based input/result contracts. New scope supports bounded origins/regions, distance bands and exclusions; detailed coverage remains separate from the legacy coverage description.
- Five canonical skills and corresponding workflow documents explain combined discovery, selected-site planning and optional host browsing/maps/location/reminders. They require capability availability, explicit location consent and confirmed scheduling actions. Instruction tests are not model-compliance evidence.
- [Source admission](global-catalogue-source-admission.md) inventories prepared input choices and unresolved footprints, licences, build cost and capacity. Proposed acquisition ceilings are not approved and do not predict required resources. No new dataset bodies were acquired.
- Focused review found no critical/important defect. Schema formatting, mixed line endings and unsafe wording mutation checks were corrected. Actual search geometry, storage, selected-site calculations and expanded registry are subsequent implementation stages.

Local baseline: 522 tests discovered / 521 passed / one skipped / zero failed. First integrated discovery/workflow run: 546 discovered / 545 passed / one skipped / zero failed. Final verification and exact-revision CI for each commit are recorded as execution continues; these counts do not describe the future completed registry.

First-wave final verification after wording-mutation guards and formatting fixes: 547 discovered / 546 passed / one skipped / zero failed; all three TypeScript checks and rehearsal packaging pass. New tests are registered in the aggregate harness. Package remains a local rehearsal with identity/endpoint/official-validation gates, not a public release.

First-wave commit `55589f59858376a7930f6e65f635d3e7e7f0f138` passed all six [CI jobs](https://github.com/tandavkrishna27/nightsky.earth/actions/runs/38633714088).

## Catalogue and selected-site implementation

| Original tickets | Implemented local extension | Actual acceptance still separate |
|---|---|---|
| 2/8 | Strict combined scope, detailed coverage, edition references and backwards-compatible city calls | Actual admitted source coverage |
| 4/8 | Paged country/state resolution and full GeoJSON representative-point membership, with source-consistent Cartesian edges, explicit date-line cuts, holes/islands/poles | Real gbOpen edition admission, geometry limits and measured global build |
| 8 | Checksum-pinned hierarchical spatial/ID/name/membership/footprint files; bounded cache/queue/query; membership leaf routing and bounded identity conflict checks | Source footprint decomposition, world completeness, actual file/refresh/host costs |
| 8 | Bounded array and streamed normalized-input builders; external sort, deterministic output, retained failure evidence and atomic roots | Actual raw-world OSM producer/geometry normalization and intended-scale measurements |
| 8/10A | Candidate details and exact-point astronomy/targets/events/weather/aurora/planning/comparison; selected revision and explicit display-timezone choice; missing history remains not-covered | Site timezone/access/horizon verification and real provider accuracy |
| 11C/12A/12B/15 | Fourteen full tools/one resolver, five canonical skills, host-capability fallbacks, compatible package validation and expanded offline host cases | Native installed-client/model results, hosted draft/official scan and publication |

Global configuration uses `NIGHTSKY_GLOBAL_CATALOGUE_MANIFEST` and `NIGHTSKY_GLOBAL_CATALOGUE_SHA256`; it is exclusive with regional/flat candidate configuration. A pinned edition is validated before a listener starts. Without it, existing installed regional/city behavior remains, richer administrative scopes return unavailable, and no global discovery promise is manufactured.

Footprint cells explicitly declare fully admitted rectangles; irregular clipping bounding boxes are not coverage. Country/state membership metadata and actual site timezone are different evidence. Boundary admission limits can reject oversized/ambiguous geometry; rejection remains a source/build gap, never an invented administrative match.

Focused reviews corrected wrong-tree pages, reset membership budgets, cross-leaf duplicate/conflicting identities, stale revision clarification, escaped-string byte accounting, pre-mutation path containment and unknown footprint region IDs. The final broad review additionally reproduced source-edition conflation, unrelated footprints consuming local search budgets, and first-interval-only darkness consumers. Two fix lanes added regressions; scoped independent re-review accepted all three corrections with no remaining Critical/Important finding.

Discovery now preserves distinct legitimate source editions and rejects contradictions within one edition. Origin footprint traversal routes by conservative bounds and ignores disjoint row sources. Region-only coverage reserves bounded leaves, directory bytes and time for membership search, charging both phases to the original total ceiling. A stopped coverage inspection can still return candidates with explicitly partial/budget-limited evidence; it never proves complete country/state coverage.

Window composition, automatic target suggestions and direct/composed weather filtering now use every separate astronomical interval. Weather context optionally exposes those intervals while retaining the legacy first interval. A real 24-hour equatorial calculation verifies the evening Milky Way opportunity without bridging daylight. A contradictory old test fixture was corrected to include its declared numerical darkness interval; explicit-empty interval behavior remains tested. Meteor help now derives all twelve reviewed choices from the actual alias map.

Fresh assembled-package checks: all three TypeScript configurations, public and both local package validators, website/service/plugin build, standalone full14/resolver1 and eight offline review sets pass. No external provider attempts in the runtime/review workloads. These establish local behavior, not native model compliance or deployment.

Before broad review, the integrated suite after weather-attribution regressions had **644 discovered / 643 passed / one skipped / zero failed**. After all final review corrections, fresh verification is **656 discovered / 655 passed / one skipped / zero failed**. All three TypeScript configurations, builds, public and both local package validators, production/standalone full14/resolver1/regional runtime checks and eight offline review sets pass. Real model requests are opt-in and are not run by the aggregate suite or CI. The pinned existing Python environments pass 72 OSM tests (three skipped) and 46 ERA5 tests. The default Python environment initially lacked `osmium`; that failed run is retained separately from the successful pinned-environment rerun. The production dependency audit reports zero vulnerabilities. The 100,000-row fictional indexed reference matches all 24 queries; its measured 258,740,224-byte RSS is synthetic benchmark evidence, not global capacity.

The model rehearsal found that an unavailable custom weather provider could be falsely attributed to MET Norway. Direct and composed tools now preserve a supplied valid source or state that the configured source is unidentified. Real default MET behavior is unchanged. Regression tests reject malformed supplied source identities; the focused follow-up review accepted the fix.

## Model rehearsal status

Codex completed twenty synthetic journey cases using prompt-fed complete workflow instructions, with separate clarification and changed-weather probes. This establishes tool orchestration and reviewed responses under those instructions, not native skill selection. Claude's native session confirms the plugin, five skills and fourteen-tool server, but its model request reports CLI authentication missing. Codex's native task-only plugin installation succeeded; an exact packaged-skill file read was rejected by automatic execution policy. That probe was stopped without bypassing the policy. Native packaged-skill execution remains unverified. True retained-session follow-up conversations remain distinct from context-fed replanning proxies. See [model validation](complete-model-journey-validation.md) for dated evidence and limits; no ChatGPT web, Claude chat or Gemini success is implied.

## Execution rulings

These implementation choices do not change original ticket numbering or acquisition authorization:

- Scratch task packets were extracted from original ticket sections because the skill's numbered-task parser could not read their headings.
- New scope schemas were introduced alongside legacy schemas until registry integration, preserving older city callers throughout the work.
- A coverage rectangle means a fully admitted cell; a bounding box around an irregular clipping polygon cannot prove coverage.
- Administrative GeoJSON follows RFC 7946 Cartesian edges and requires explicit date-line cuts; it does not infer a site's timezone.
- The array builder's row cap was a code limitation. A bounded streamed normalized-input builder was added and tested synthetically; real source ingestion and scale remain unverified.
- One session-only native Codex read-only probe was limited to exact installed skill/reference files. Automatic policy rejected the read, so testing stopped and the native-client gate remains open.
- Region-only footprint inspection has no administrative page-routing metadata. It receives a bounded share of the same total query budget so candidate membership work can continue; incomplete inspection stays explicitly partial rather than consuming the entire request before candidates are found.

## Original ticket accounting

Original heading counts remain **12 Done / 9 Partial / 6 Not started**. Added local extension work is mapped to original Tasks 0/2/4/8/10A/11C/12A/12B/15. An extension does not reopen original completed acceptance or establish global source coverage, installed-model behavior, hosted capacity, publication or pilot results.

No deployment, publication or new geographic/historical dataset downloads. The separate website remains a separate workstream.

## CI correction follow-up

The first pushed implementation run passed all four Python jobs but failed Node tests on path-fixture assumptions. Independent scoped review accepted the test-only fixes: invocation-relative resume with checkpoint/no-repeat assertions intact, and canonical direct-child scratch containment with native Windows 8.3 reproduction. The production resolver and builders are unchanged. Fresh aggregate after those corrections: **657 discovered / 656 passed / one skipped / zero failed**; all three TypeScript configurations pass. Exact follow-up CI is tracked in [CI verification](ci-verification.md).
