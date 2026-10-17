# API migration local delivery — 17 October 2026

## Delivered

- Explicit `NIGHTSKY_DISCOVERY_MODE=api`, with no local GeoNames/OSM geography loading. Legacy modes remain opt-in/compatible; no raw files removed.
- GeoNames and Geoapify clients with fixed HTTPS endpoints, redacted errors, request/response bounds, finite queues, shared-call deadlines, account budgets and bounded caches.
- Immutable provider/sourceRevision selections, expiration/eviction handling, unknown versus verified timezone evidence, exact selected points through planning/calculation/weather/aurora, and preserved source attribution.
- Named lookup, bounded radius/multi-origin searches and own-provider country/state region filters. Unsupported administrative combinations stay explicit rather than silently dropping constraints.
- Five skills and matching workflow references updated for source revisions, optional host search, consent, untrusted text and missing-data behavior.
- API-mode operator evidence/rollback checks, a compiled fixture runtime smoke and synthetic measurement harness in Linux/Windows CI.
- History feasibility and event gaps reconciled against retained evidence; no new provider jobs or dataset downloads.

## Verification

- Independent admission/history/event document review: no blockers.
- Independent runtime/preflight review: no blockers; full API historical route is explicitly gated even with a legacy history artifact.
- Broad core review and scoped re-review: duplicate identity/category conflicts, attribution, cache expiry/residency, deadlines/waiter limits and source revision/timezone propagation fixed; final scoped review approved.
- Local full integration run: 1,129 tests, 1,127 passed, 2 skipped, zero failures. This run started before the last four review fixes; those fixes received subsequent targeted regression checks. Exact pushed-commit CI remains the final full-suite authority.
- Final core targeted suite: 115 tests passed after review fixes. Final `npm run check` passed. Final root runtime/operator/measurement selection: 31 tests passed.
- Website/backend build passed. Compiled API-mode smoke passed with synthetic providers and no geography files; full/resolver-only legacy runtime checks passed.
- Plugin package build and offline Codex/Claude package verification passed; these are packaging checks, not native client installation or live acceptance.

No deployment, publication, live provider query, historical job or dataset deletion occurred in this wave. Local generated test fixtures are not production data.

## Remaining gates and honest limits

1. Configure free provider accounts privately and validate exact live endpoints/semantics/attribution under a separately bounded request allowance. Confirm transient public-MCP use and free-tier policy.
2. Establish restart-safe account quota accounting or operator-managed verified allowance; process-local counters alone are not deployment evidence.
3. Complete unsupported complex administrative intersections/exclusions; original Task 8 stays partial. Approximate host-hint reverse resolution is not admitted in API mode; ask for a named town/country instead.
4. Admit a scientifically equivalent point-based historical route. Full API preflight returns `API_HISTORY_ROUTE_NOT_ADMITTED`; a legacy file alone cannot prove this capability.
5. Resolve original supported event/rights gaps and obtain actual configured-service measurements, owner journeys and later host/client/publication evidence.

Original ticket counts stay **12 Done / 9 Partial / 6 Not started = 27**. This is substantial local implementation progress, not closure of those external/scientific gates. See [tracker](v1-completion-tracker.md), [local setup](api-mode-local-setup.md), [admission](api-provider-admission.md), [history](history-api-feasibility.md) and [events](api-event-gaps-20261017.md).
