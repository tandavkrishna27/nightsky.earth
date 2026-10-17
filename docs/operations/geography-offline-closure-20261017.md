# Offline geography closure evidence — 17 October 2026

Scope: G1/G3 fixture expansion and inactive G2 composition preparation from `events-geography-closure-20261017.md`. No provider calls, acquisition, admission, credentials, downloads or release actions were performed. Existing unsupported administrative guards remain active.

## G1 combination evidence

`tests/places/api-discovery.test.ts` now pins state filtering and a single-region `all` search against the selected provider filter identity; two-region union identity deduplication and coordinate conflicts; partial union failure and a full page whose categories filter away; all six finite category complements including precedence overlap and unknown tags; five-origin bounded calls and sixth-origin rejection; and each of the three unsupported branches with zero fetches, empty candidates and preserved normalized scope. Existing origin-any and origin-all fixtures cover every reported distance, minimum/maximum bands and the polar/dateline case. Existing `discoveryScope.test.ts` retains no-positive-scope rejection, five/five/five bounds and category limits.

Fixtures test adapter behavior. A passing unsupported-query case does not implement the original combination requirement. No concrete discovery runtime bug was exposed in this work.

## G2 inactive composition and admission gate

`server/places/api/regionMembership.ts` exports a pure composition function plus a future provider interface. It is not imported by discovery/configuration and performs no IO. Strict evidence rows use existing point revision, region ID, source revision, UTC and source validators, with method, fetch/expiry and optional reason. Bounds are 100 unique point revisions, five included plus five excluded regions, five origin predicates per point and at most 1,000 supplied evidence rows. The evidence-row cap is a local memory/CPU bound, not an upstream request allowance. The provider interface adds no endpoint permission or default request ceiling.

Origin predicates must be supplied from the already bounded distance evaluation. Composition applies origin any/all AND included-region any/all AND NOT any exclusion. A definite exclusion wins, including overlap with an included region. Missing, expired, future-dated, conflicting or mismatched point/region revision evidence becomes unknown. Qualification conservatively requires every relevant membership to be known, even if one member of an included union is already inside. Definite rejection can still be established despite unrelated missing evidence. Result `coverage` describes whether the decisions were resolved; it does not certify provider completeness or geographic discovery coverage. Classification retains input candidate order; category filtering and deterministic distance ordering remain the responsibility of the existing discovery path if admission later permits integration.

Synthetic tests cover the origin/region truth table, country/state intersection, disjoint regions, overlap, unresolved boundary policy, hole/dateline classifications, one failed subquery, unknown inclusion/exclusion, revision mismatch/expiry/conflict and input bounds. Hole, border and dateline rows are explicitly fake classifications; they establish no geometry algorithm or source capability.

Ruling: keep G2 runtime disabled — the existing admission allows Geoapify geocoding and single-page own-place/circle Places filters, but no general membership, reverse/details, arbitrary geometry or boundary endpoint. A selected provider filter establishes membership only for the successful filtered search. A label, centroid, ISO code, nearby city, bounding box or finite filter result cannot prove outside membership, exclusions or country/state intersections for arbitrary candidate points.

Before an adapter or guard removal, admission must name the exact endpoint/method and source/version, verify point-in-selected-administrative-area semantics for holes/borders/dateline and parent/child regions, state precision and boundary policy, establish licensing/retention and set a numeric upstream request/credit/time budget within the existing search envelope. A 100×10 point/region fan-out is not admitted. Cache keys must bind point+region revisions and source/boundary version with expiry. The real adapter must supply the same finite truth-table evidence, preserve partial failures and budget exhaustion, and pass separately authorized actual-source acceptance. If no route meets this budget, the combinations remain unmet pending owner decision; there is no silent radius fallback.

## G3 exact-site evidence

Selection fixtures cover source-verified IANA zones, unknown/invalid source zones, explicit display choice that remains unverified, verified-zone mismatch rejection, same-ID changed-zone immutable revisions, expiry and a repeated hour at the America/New_York DST transition. Existing conflicting duplicate source-zone fixtures retain invalid-response behavior.

The assembled MCP fixture includes a nearby origin with a different timezone field, retains unknown exact-site timezone until explicit display selection, and compares returned astronomy to a direct calculation at the immutable selected site. It also proves the nearby origin gives a different Moon altitude. Weather and aurora receive the selected site coordinates, and expiry prevents another weather call. These are synthetic fixtures, not a real timezone-border admission or independent astronomy reference.

Actual-source country/state filters, administrative membership, ambiguous names, timezone borders, empty/unavailable responses and all required combinations still require bounded live authorization/configuration and evidence of source revisions, call budget, timing/quota and errors.

## Verification

The five-file affected run (`api-discovery`, `api-selection`, `api-region-membership`, `discoveryScope`, `api-discovery-planning`) passed 51/51 assertions. After strengthening category-overlap precedence, its targeted test passed again. `npx tsc --noEmit` passed after the final changes; `git diff --check` passed for the edited tracked fixtures. The new membership contract was implemented only after the initial existence assertion failed, then its fake-evidence tests passed. The root task owns integrated full-suite/package verification and the new `tests/all.test.ts` import. No runtime provider file or shared planner/schema was changed in this lane.
