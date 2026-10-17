# Capability closure wave — 17 October 2026

## Scope and sequence

This is work inside completion block 1 of the [tracker](v1-completion-tracker.md), not a new sequence of seven waves. Baseline: `291fc0a`. Owner approved parallel implementation, local review/tests, documentation, branch push and CI. No live provider calls, new source downloads, deployment or publication are part of this wave.

| Lane | Deliverable | Acceptance boundary |
| --- | --- | --- |
| History | Pure ERA5 request partitioning, strict bounded decoder, quarantine receipt and dry-run manifest | No runtime admission or acquisition. Noncommercial eligibility, scientific provenance and measured accounting remain gates |
| Geography | Scope/timezone regression coverage and preparation for administrative composition | No runtime membership claim from labels, bounding boxes or unadmitted sources |
| Events | Machine-readable retained evidence inventory and coverage checks | Preserve all nineteen identities; no unapproved thirteen-shower selection, new seasons or certified completeness |
| Integration | Test registration, corrected tracker and original-ticket matrix, review and CI | Original ticket counts change only on complete criterion evidence |

## Decisions

- Independent lane implementations run in parallel with disjoint file ownership. Root owns test registration and shared tracker edits.
- Historical source admission and meteor scope/source decisions remain explicit. Offline code must not manufacture evidence or enable an unapproved provider.
- The no-database/API-first direction remains. No bulk global catalogue is required, and no historical download is triggered by the dry-run plan.

## Verification

All three lane reviews passed. Event review identified an insufficiently pinned radiant-domain admission; the fix binds the reviewed identities/anchors/widths and source metadata, with failing-then-passing mutation tests and approved scoped re-review. Final combined review found no critical or important findings.

- History synthetic contract tests: 5 passed.
- Geography affected tests: 51 passed; category-overlap regression also rechecked.
- Event affected tests after admission fix: 24 passed.
- Final integrated suite: **1,296 total; 1,294 passed, zero failed, two skipped** (211.7 seconds).
- All three TypeScript projects, plugin build and package generation passed. Package generation does not establish hosted or official validation.
- All three new suites are registered in the existing CI test entry point. Exact-commit CI is observed after push; see [branch CI runs](https://github.com/tandavkrishna27/nightsky.earth/actions?query=branch%3Acodex%2Fplugin-v1) and match the commit containing this document.

The offline engineering deliverables are complete. **Block 1 remains in progress**: historical eligibility/provenance/accounting, an admitted geographic membership source, and event scope/season/reference evidence are still required. See [history gates](history-api-route-decision-20261017.md), [geography gates](geography-offline-closure-20261017.md), and [event gates](events-offline-closure-20261017.md). No original broad ticket is closed by these isolated contracts.
