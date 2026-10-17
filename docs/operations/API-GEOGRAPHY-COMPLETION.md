# API geography completion handoff — 17 October 2026

This lane completes the offline query-contract corrections and registered geography journeys on `codex/api-geography-completion`, based on `bc8de008bc60d6b47f8422cf15787584d16e2698`. Reviewed source commit: **`69be7cc7cf8a31f5d1d5094034e8d2e328a960d9`**. The coordinator owns aggregate integration, push and exact-commit CI. No deployment, credentials, authenticated provider requests, dataset downloads or production activation occurred.

## Changes and evidence

| Area | Result | Practical limit |
| --- | --- | --- |
| Country/state resolution | One structured country or state name query; requested ISO3 restriction maps to a documented countrycode filter; implicit IP bias disabled; local country/type/ambiguity checks retained | Unknown country restrictions refuse before transport. Query correction does not explain the previous live selection failure |
| Point origins | GeoNames requests populated-place class P and rejects explicit contradictory metadata; Geoapify administrative records cannot become radius origins, including malformed country/state records without recognized country identity | Missing GeoNames feature metadata is accepted only within the fixed class-P request. Host approximate location remains unavailable and requires an explicit named fallback |
| Region discovery | Selected provider boundary IDs drive country/state place filters; unions deduplicate; region-only results report their actual name-then-ID ordering | Provider-limited pages are not exhaustive catalogues; no centroid distance is invented |
| Geometry decoding | Exactly one selected Details feature supplies Polygon/MultiPolygon regardless of collection order; unrelated polygons never substitute; public bounded datasource metadata is sanitized, revision-bound and surfaced | Existing byte, topology, ring, vertex, expiry and conservative boundary-tie limits remain. Complex regions can remain unsupported; source vintage stays unknown |
| Validation executor | Default is offline; retired v1 envelope refused; new one-request selection packet stops even on success; six-request packet requires a separate fresh envelope; safe diagnostics have bounded traversal | Both revised live packets are proposals only. Geometry source acceptance and production flags remain false |
| Registered MCP journeys | Actual tool input/output schemas and handlers cover near-me refusal then named fallback; country/state discovery → details → selected-site plan/compare; multiple origins and bands; enabled include/exclude geometry and disabled-gate refusal | Injected transports prove code paths, not real-host location forwarding, production geometry admission or live-provider behavior |

Planning uses the selected site's exact point and revision, and requires an explicit display zone when the provider has no verified site zone. Discovery constraints qualify the selected site; the planner may perform fresh radius enrichment and does not accept the original discovery scope. Tests make no claim that it replays that scope.

The principal fixes were verified against failing offline cases before correction: unrestricted/incorrect region requests, administrative-point bypass, mixed-feature Details selection, lost geometry provenance and recursive diagnostic overflow. The four registered MCP journey tests add acceptance coverage; they did not identify a new production regression.

## Verification

Final targeted run: **124 passed, zero failed, zero skipped** (19.5 seconds), covering:

```text
tests/places/api-selection.test.ts
tests/places/api-region-membership.test.ts
tests/places/api-region-contract.test.ts
tests/places/api-geonames-point-contract.test.ts
tests/places/api-geometry-snapshot.test.ts
tests/places/api-geometry-acquisition.test.ts
tests/places/api-geography-flows.test.ts
tests/places/api-discovery.test.ts
tests/mcp/api-discovery-planning.test.ts
tests/mcp/api-geography-journeys.test.ts
tests/mcp/global-discovery.test.ts
tests/operations/geometry-live-validation.test.ts
```

Run those paths with `node --import tsx --test`. After strengthening the comparison assertions, the four registered MCP journeys passed again (0.53 seconds) and their strict TypeScript check passed again. `npm run check` passed all three configured projects. An additional explicit strict TypeScript invocation passed the new suites, geometry suites and `scripts/validate-geometry-live.ts`, which is outside the current tools-project include list. `git diff --check` passed. Independent reviews covered query/selection behavior, geometry/provenance, the live guard and registered journeys; the final test assertion changes and both documents were approved. These tests invoke registered handlers, not MCP wire transport. The lane did not run the coordinator-owned full aggregate suite.

## Coordinator integration

Add these four imports to `tests/all.test.ts` (the lane deliberately did not edit that shared entry point):

```typescript
import './places/api-geonames-point-contract.test';
import './places/api-region-contract.test';
import './places/api-geography-flows.test';
import './mcp/api-geography-journeys.test';
```

The existing modified suites already have aggregate imports. No MCP registration or runtime change is required for the tested API flows. The shared discovery schema now permits `name-then-id` and optional bounded geometry `additionalSources`. Include `scripts/validate-geometry-live.ts` in coordinator-owned `tsconfig.tools.json` if it should receive the normal tools check; the lane separately checked it strictly. Run the combined suite/build/package checks, then observe CI for the exact integrated commit.

## Remaining gates and next executable action

1. **Offline integration:** import the four suites above and run combined verification. This is the next action that needs no external authority.
2. **Live country selection:** if separately authorized, execute only the new `--selection-live` proposal documented in [the validator guide](../../scripts/validate-geometry-live.md): envelope `geometry-selection-v2-va-1-1-30-zero-retries`, one request, one credit, 30 seconds, 262144 bytes, no retries. Use the existing private configuration and quota with a new exclusive batch; never initialize/reset quota. Stop after this selection even on success.
3. **Actual geometry evidence:** successful selection alone does not authorize or prove Details acquisition, repeat stability, classifier behavior on live geometry, POI membership or source acceptance. Any later extended packet requires fresh explicit authority for its distinct six-request/nine-credit envelope. Keep both production geometry gates disabled until separately admitted.
4. **Real-client acceptance:** confirm installed host/client behavior, exact selection continuity, time-zone clarification and scoped discovery/planning with production configuration. Synthetic near-me refusal is not proof of a working host-location integration.
5. **Global availability:** free provider coverage, quotas, bounded pages and unsupported large/complex geometries remain explicit. No owned exhaustive catalogue, planetary dataset or database was added or claimed. Remaining assembly and full-experience work stays with the coordinator's completion sequence.

The only actual earlier attempt used one Vatican free-text country GET: HTTP 200, 136 bytes, 445 ms and one credit. It stopped before geometry; no response body or selection diagnostics survive. Its exact cause remains **unknown**, its allowance is consumed and no retry followed. The revised requests are documented corrections, not a retrospective diagnosis. See the preserved [planning-flow outcome](planning-flows-wave-20261017.md) and [safe receipt](geometry-live-receipt-20261017.json).

## Primary contract references

- [Geoapify forward geocoding](https://apidocs.geoapify.com/docs/geocoding/forward-geocoding/) and [country restriction](https://apidocs.geoapify.com/how-to/addresses/restrict-address-search-country/): structured name fields, country filters and bias semantics.
- [Geoapify forward-geocoding schema](https://apidocs.geoapify.com/assets/openapi/specs/forward-geocoding/forward-geocoding-api-openapi-specs.json): opaque bounded identity and country/state types.
- [Geoapify Place Details](https://apidocs.geoapify.com/docs/place-details/) and [public schema](https://raw.githubusercontent.com/geoapify/geoapify-openapi-specs/main/api-specs/place-details/place-details-api-openapi-specs.json): Details enrichment and heterogeneous collections. Narrative/schema feature serialization differences remain unverified live.
- [GeoNames search](https://www.geonames.org/export/geonames-search.html) and [feature codes](https://www.geonames.org/export/codes.html): populated-place filtering and explicit metadata validation.

Public documentation research was read-only. No revised live request or source-admission claim is part of this handoff.
