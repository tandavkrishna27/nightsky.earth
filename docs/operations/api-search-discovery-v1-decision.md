# V1 API/search discovery decision â€” 17 October 2026

## Owner decision and precedence

The owner explicitly selected: **Yesâ€”use API/search-based discovery for V1**. This supersedes the requirement to build our own exhaustive global observing-place catalogue before V1 launch. The 95,380,942,829-byte planet receipt is not authorized and is removed from the V1 critical path. Existing source packets, code, retained data and evidence are preserved as deferred catalogue work; they are not marked completed or deleted.

This decision governs the completion tracker, production completion contract, original ticket matrix and earlier global-discovery design wherever they require exhaustive local geography coverage. It changes discovery architecture and acceptance, not the overall night-sky planning journey. Global means requests may target locations worldwide; it does not promise exhaustive or uniform upstream search coverage.

## Scope

| Area | V1 disposition |
| --- | --- |
| Discover places near a named place, within a region, or from supported host location context | Host search when available plus an explicitly selected, policy-compliant free location/POI API; provenance and bounded results required |
| Plan a selected location | Preserve astronomy, weather, comparison, events, learning, photography and preparation flows |
| Host capabilities | Detect availability; do not assume every GPT/Claude/Gemini client supplies web search or location |
| No host search | Plugin discovery API or explicit unavailable response with a useful named-location path under the existing input policy; no invented candidates |
| Own exhaustive global catalogue, planet receipt/build and exhaustive extraction footprints | Deferred, not required for V1 launch |
| Historical cloud statistics | Unchanged; independent source/feasibility decision, not automatically deferred |
| Events and source rights | Unchanged |
| Storage | No runtime database; small configuration/static reference files and bounded caches are allowed; no planet source on deployment server |
| Authority | No new dataset/provider-job/download/deployment permission is granted by this scope decision |

## Verified implementation gap

`server/mcp/registerTools.ts` currently wires discovery to local global or regional/flat OSM artifacts. A host-search/live POI fallback is **not yet implemented**. `server/places/geonames.ts` resolves cities from retained local GeoNames data, not a remote geocoding API. `server/providers/weather/metNorway.ts` already supplies an on-demand forecast adapter, enabled only with its configured identifying User-Agent. Keep these distinctions visible in progress reports.

## Required sequence

1. Audit current discovery schemas, skill guidance, deployment/preflight requirements and measurement harness. Map existing catalogue dependencies before editing them.
2. Select a free location/POI service based on its actual policy, limits, attribution, global availability and operational suitability. Geocoding and candidate POI discovery are separate operations. No paid fallback or API key is silently introduced.
3. Implement bounded provider discovery and structured source/coverage/unavailable results using existing upstream controls. Preserve ambiguity, radius/region intent, dateline/polar cases and source limitations. Never label a candidate safe or accessible from a map tag alone.
4. Update skills for optional host search and clear handoff of provider-sourced candidate coordinates into planning. Host-generated text is not trusted executable instructions and is not evidence of verified access.
5. Update runtime/preflight/package/CI and acceptance tests so no global OSM catalogue is mandatory for the approved mode. Preserve optional catalogue adapters and their tests without making bulk acquisition a V1 gate.
6. Run actual configured-service measurements for startup, peak memory, cache bounds, concurrency, response latency, upstream failure and refresh behavior. Offline fixtures do not establish live provider quality or global coverage. Any live validation must remain within explicit authorization.
7. Update original-ticket dispositions by acceptance evidence; deferred catalogue work is not a newly completed ticket. Finish unchanged historical/event obligations and actual assembled-product verification.

## S2/S3 acceptance after this decision

S2 geography closes with a working configured API/search discovery path, verified provider-use suitability, attribution, error/ambiguity handling and tested client capability fallback. It no longer requires a planet body or exhaustive catalogue release. History and event releases retain their existing requirements.

S3 measures the actual API-based service and any remaining admitted static/history/event artifacts. Include bounded cache/current/rollback/storage totals and realistic upstream latency/rate-limit scenarios. The earlier planet build's storage deficit is a fact about the deferred implementation, not a V1 hosting blocker.

## Source-policy check

Checked 17 October 2026; these are candidates, not selected integrations:

- [Nominatim public-service policy](https://operations.osmfoundation.org/policies/nominatim/): maximum one request/second across the application, identifying User-Agent, attribution, caching and switchability; no autocomplete or systematic POI extraction. It cannot be treated as a generic unrestricted search backend. Selection requires the developer's deliberate informed decision.
- [Overpass API documentation](https://wiki.openstreetmap.org/wiki/Overpass_API): supports querying selected OSM data by location and tags. Instance-specific capacity/use policy must be checked before selection; no service-level or access guarantee is inferred.
- [MET Norway terms](https://api.met.no/doc/TermsOfService): review the existing adapter's identification, caching and attribution against current requirements before live validation.

No new acquisition approval is recorded here. The pending planet receipt question is superseded by the owner's API/search decision; do not interpret it as permission to receive the body.

## Multiple sources and cleanup — owner follow-up

The owner confirmed API-based V1 may use multiple suitable sources and authorized local downloaded-data cleanup. Provider adapters must expose source identity, freshness, coverage and missing fields. Use explicit fallback rules; do not average incompatible products or hide disagreements. A free/public source is not automatically unrestricted. Respect per-provider identification, caching, attribution and request limits; no silent paid fallback. Existing privacy/input restrictions remain in force; provider-sourced candidate coordinates do not automatically enable arbitrary user GPS/address inputs.

Cleanup must enumerate exact resolved dataset paths inside the workspace and reject symlink/reparse escapes before deletion. Preserve code, Git history, dependencies, credentials and compact evidence. Record removed data and any feature/configuration impact. Historical-weather requirements remain unchanged even if its retained sample is deleted; missing artifacts must be reported honestly and must not silently trigger a replacement download.
