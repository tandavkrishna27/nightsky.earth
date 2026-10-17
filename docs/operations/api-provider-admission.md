# API provider admission contract

Decision date: 2026-10-17. Task A of the API-first V1 regroom. This admits a bounded adapter design for offline implementation. Production activation remains gated below. Official documentation was inspected; no data endpoint was called, account created, dataset downloaded, or operational quality measured. Application bounds below are NightSky decisions, not provider promises.

## Roles and fixed interfaces

| Role | Primary | Admitted fallback | Identity and coverage |
| --- | --- | --- | --- |
| Named point geocode | `geonames` search | `geoapify` geocode, once | GeoNames `geonameId`; Geoapify `place_id`. Worldwide query capability; incomplete/uneven records, ambiguity and representative points remain visible. |
| Named country/state region | GeoNames for gazetteer context; Geoapify for its own boundary-filter identity | No cross-provider boundary-ID conversion | A GeoNames admin code/bounds is context only. Only a Geoapify region result explicitly recognized as the requested country/state can supply a Geoapify place filter. Region centers never become observing candidates. |
| Nearby/region POI | `geoapify` Places | None | `properties.place_id`; bounded sample, no exhaustive inventory or verified nighttime access. |
| Actual selected-point timezone | `geonames` timezone | Existing Geoapify point-result zone if applicable to that exact selected point | Validate IANA zone; unknown is valid. No nearest-city lookup or offset-only substitute. |

Adapter filenames are frozen as `server/places/api/geonames.ts`, `server/places/api/geoapify.ts`; orchestration/configuration in `discovery.ts` and `configuration.ts`. Upstream-control provider IDs are exactly `geonames` and `geoapify`. This is the addendum required before Task C.

Only GET, HTTPS, exact host and pathname allowlists below are admitted. Reject redirects, user-supplied base URLs, alternate ports, callback/JSONP and arbitrary query keys. Build encoded parameters through URLSearchParams. Never follow a source URL as an API endpoint.

| Provider | Exact endpoint | Permitted parameters and output |
| --- | --- | --- |
| GeoNames | `https://secure.geonames.org/searchJSON` | `q`, `name_equals`, `country`, `adminCode1`, `featureClass`, `featureCode`, `maxRows=5`, `startRow=0`, `style=FULL`, `lang`, `username`; normalized names, finite WGS84 point, geonameId, country/admin codes, optional bounds. |
| GeoNames | `https://secure.geonames.org/getJSON` | `geonameId`, `style=FULL`, `lang`, `username`; re-resolution/context only; never silently replace a selected snapshot. |
| GeoNames | `https://secure.geonames.org/timezoneJSON` | `lat`, `lng`, `radius=0`, `username`; use only timezoneId and point evidence, not upstream astronomy/offset calculations. Server-held selected point only. |
| Geoapify | `https://api.geoapify.com/v1/geocode/search` | `text`, `type`, `filter`, `lang`, `limit=5`, `format=geojson`, `apiKey`; named locations only, never raw street/GPS input. Region type restricted to country/state; country filter only where geocoding docs support it. |
| Geoapify | `https://api.geoapify.com/v2/places` | `categories`, optional `name`, `filter`, optional `bias`, `limit=20`, `offset=0`, `lang`, `apiKey`; circle or own-provider place filter only. No countrycode Places filter dependency. |

No Geoapify details/reverse endpoint is admitted: details returns the immutable selected normalized snapshot. An expired reference requires new resolution/search. No pagination, batch jobs, arbitrary geometry, tiled retrieval, IP geolocation or bulk acquisition. GeoNames documentation uses HTTP examples; the fixed secure host above is a fail-closed design choice whose actual HTTPS behavior must be checked under separate live authority. No HTTP downgrade is permitted. Endpoint shapes and username requirement are documented in [GeoNames services](https://www.geonames.org/export/web-services.html) and [search](https://www.geonames.org/export/geonames-search.html). Geoapify result fields are documented in [forward geocoding](https://apidocs.geoapify.com/docs/geocoding/forward-geocoding/).

## Identity, freshness and timezone

Accept GeoNames positive decimal geonameId (at most 20 digits) and Geoapify opaque nonempty place_id (at most 2,048 characters). Missing/oversized identity is invalid; no synthetic name/coordinate identity fallback. IDs are opaque provider record handles, not guarantees of permanence. Keep raw identity private and retain datasource identity separately when supplied. Deduplicate only exact provider+upstreamId; conflicting duplicate points invalidate that identity in that response. Never merge unrelated providers by name.

Public ID is `place:v1:api:<providerId>:<sha256-of-upstreamId>`. Snapshot has providerId, upstreamId, fetchedAt, expiresAt, credential-free sourceUrl, attribution, name, latitude, longitude, timeZoneEvidence; canonical normalized snapshot SHA-256 becomes sourceRevision. Include all these immutable fields in canonical hashing with deterministic key ordering. A fresh fetch creates a new snapshot/revision even for the same provider ID. Reject old/mixed/missing revisions before calculation; changed coordinates cannot rebind an earlier reference. Provider provenance is not a catalogue vintage.

Selection lifetime is 3,600 seconds, never extended by reads. IANA verification uses the runtime zone database. Geoapify `timezone.name` is eligible only for its returned selected point; a country/state's zone, city-nearby zone or region center zone is ineligible for a different site. GeoNames timezone queries use the exact selected point and zero coastal expansion. Missing zone or conflicting zone evidence yields unknown. Display-zone choice remains separate and explicitly supplied when site evidence is unknown; it does not certify the site's zone.

## Numeric application envelope

| Bound | GeoNames | Geoapify |
| --- | --- | --- |
| Published free service budget | 10,000 credits/day, 1,000/hour | 3,000 credits/day, 5 requests/second |
| NightSky rolling budget | 400 attempted requests/hour; 2,000/24 hours | 200 attempted credits/hour; 1,000/24 hours |
| Request spacing / concurrency | At least 1,000 ms between starts; 1 in flight | At least 1,000 ms between starts; 1 in flight |
| Per-attempt absolute timeout | 5,000 ms including body | 5,000 ms including body |
| Maximum decompressed response | 262,144 bytes | 262,144 bytes |
| Pending queue | 8; reject excess | 8; reject excess |

Upstream limits are verified in [GeoNames terms](https://www.geonames.org/export/) and [Geoapify pricing](https://www.geoapify.com/pricing/). These free services have no admitted availability SLA. The selected single-page Geoapify geocode/20-place operations reserve one credit each; conservatively count every attempt, including failed requests, against local credit budgets. Recheck pricing before enabling another endpoint or raising page size.

Per tool: resolve at most 2 requests total including fallback; region resolution at most 2; discovery at most 5 total; timezone enrichment at most 1; snapshot details/calculation 0. Total orchestration deadline 15 seconds. Retry is disabled in V1: timeout/429 may trigger only the separately admitted semantic fallback within the same tool budget. GeoNames/Geoapify attempt counters share provider-wide control across roles; no hidden timezone fanout for ten returned candidates. Enrich only the selected point. Queue time counts against tool deadline. Reserve quota before starting; no refund on abort. Bound query text to 200 UTF-8 characters and generated URL to 8,192 bytes.

Single serving process and exclusive application accounts are required unless a shared deployment limiter accounts for every replica and other account consumer. In-memory counters cannot establish restart-safe remaining allowance: after lost state, fail closed until the operator supplies a verified reset/remaining-budget receipt or a full rolling 24-hour quiet interval completes. A small nonsecret budget checkpoint file may later implement conservative restart accounting; its implementation/evidence is a deployment gate, not assumed here. Never reset allowance simply by restarting. Stop at quota; no paid upgrade, account rotation, paid fallback or alternate-host evasion.

## Cache and retention

One process-shared LRU response cache per provider: 128 entries, 1,048,576 normalized UTF-8 bytes total, 65,536 bytes/entry. Success TTL 3,600 seconds; valid empty response 60 seconds. Never serve expired results or cache malformed/auth/quota failures as emptiness. Coalesce at most 8 identical in-flight keys per provider; use the same queue/attempt limits. Cache keys include endpoint and normalized semantic parameters, language, provider and nonsecret account configuration revision; omit credentials. Eviction never extends TTL.

Selection store is separate: 512 immutable records, 2,097,152 bytes total, 16,384 bytes/record, TTL 3,600 seconds. Enforce both entry and serialized-byte caps; reject oversized records. Region-reference snapshots share these bounds. Restart/eviction/expiry requires re-resolution. Retain normalized fields only, no raw response bodies or query logs; do not persist geography. These are resource caps, not a grant of retention rights.

GeoNames CC BY use requires visible credit/link and carries no accuracy warranty. Geoapify explicitly allows geocoding-result storage in its [geocoding product documentation](https://www.geoapify.com/geocoding-api/). No blanket permanent POI redistribution permission was established: this contract restricts POI use to a short transient workflow cache and prohibits bulk resale/export. Confirm this exact transient MCP use against account terms before live activation; if unresolved, POI remains disabled. Preserve Geoapify plus every provided datasource attribution/license link; OSM-derived records include [OpenStreetMap contributors](https://www.openstreetmap.org/copyright). Text-only and composed tool results must visibly retain credit. Review [Geoapify terms](https://www.geoapify.com/terms-and-conditions/) before launch and obtain clarification for unusual redistribution; free hosting permission is distinct from underlying database licensing.

## Search semantics and capability limits

Support up to five named origins, five included regions and five excluded regions; 1–300 km radii; minimum-distance bands; at most ten returned candidates. Geoapify Places supplies `filter=circle:lon,lat,metres` and `filter=place:<own-provider-id>`. Its documented place-boundary filtering is distinct from proximity bias; missing or failed boundary support is unsupported, not permission to search a centroid. GET country filtering is documented inconsistently and is not admitted. See [Places reference](https://apidocs.geoapify.com/docs/places/).

Application category mapping: park=`leisure.park`; viewpoint=`tourism.attraction.viewpoint`; protected-area=`natural.protected_area` or `national_park` or `leisure.park.nature_reserve`; campground=`camping.camp_site` or `camping.caravan_site`; beach=`beach`; other=`natural.mountain` or `leisure.picnic`. This is an intentionally finite candidate universe, not every POI. Classification precedence: protected-area, campground, viewpoint, beach, park, other. Request union of needed upstream categories; classify every record locally using the full categories array. Complements operate against these six normalized classes in this finite universe; missing/unrecognized category cannot satisfy a requested class. Exclusions win. Semantic overlap and unmapped features remain coverage limitations.

For origin any: query each origin circle within the five-call budget, union exact identities, calculate all origin distances locally and enforce any band. For all: query one deterministic origin circle, then enforce every origin band locally. Sort any by minimum origin distance and all by maximum, then normalized name and public ID. A capped page means budget-limited coverage even when fewer than ten survive filtering. It cannot prove the global nearest ten. Dateline/poles use spherical distance calculations and native circle filters; never flatten into a giant rectangle.

For region any: one place-filter request per included region, maximum five, union by provider identity with per-result membership evidence from the successful filtered request. Region-only ordering uses normalized name and ID, never nearest/best-sky claims. Region all with multiple regions, any excluded region, or combined origins+regions requires reliable membership evidence for every relevant point/region; this first GET adapter has no admitted general polygon-membership endpoint. Return explicit unsupported-query for those combinations unless equivalent identity-specific evidence is actually available and tested. Labels, matching state strings and bounding boxes are insufficient. A single region filter alone can be supported; missing region boundary returns unavailable/unsupported. No provider crosswalk guessed from names. Original broad-discovery ticket remains partial while required combinations are unsupported; a town lookup does not close it.

## Failure and fallback contract

Return separate attempt outcomes: not-configured, quota-exhausted, timeout, unavailable, invalid-response, unsupported-query, no-results, success/partial. Provider HTTP-200 error objects are failures. Honor Retry-After by stopping attempts to that provider for its stated duration; absent duration use 60 seconds for 429. Authentication failure disables that provider until configuration changes. Never expose URLs containing keys/username, headers or raw error bodies.

Name primary no-results/timeout/quota/unavailable may try Geoapify once if configured and budget permits. Ambiguous successful matches require user selection; do not run fallback to erase ambiguity. Unsupported semantics never activate a looser fallback. POI has no provider fallback. Region GeoNames context can be supplemented by independent Geoapify resolution; retain independent IDs and require matching requested geography plus explicit user disambiguation where necessary. Timezone failure preserves unknown. Do not average conflicting coordinates/zones, silently move sites, or manufacture access/darkness/safety evidence. A clean zero is no-results only for that bounded search, never proof no sites exist.

## Activation and release gates

Operator must configure its own enabled GeoNames username (never demo), free Geoapify server key, identifying NightSky User-Agent and public contact URL/email. Keep key/credential-bearing query strings out of logs and provenance. No account creation is authorized by this document. Confirm free account limits and no automatic billing; recheck current policies, attribution display, transient POI retention and MCP redistribution interpretation. Missing provider configuration leaves its role honestly unavailable.

Separate authorized live checks must verify GeoNames secure-host TLS/endpoints and radius-zero timezone behavior, Geoapify selected category and place-boundary behavior, ambiguous/local-language names, sparse rural areas, islands, dateline/poles, border and multiple-timezone sites, missing fields, quotas and attribution. Record exact request count/time budget beforehand. Fixtures establish implementation behavior only. No such checks were performed for this admission. Historical weather, event rights, operational capacity, native-client and owner deployment/publication gates remain independent. Photon demo, public Nominatim/Overpass, Wikidata enrichment and paid plans are not automatic fallbacks.

## Opt-in selected original geometry stage (17 October 2026)

The owner approved implementation of the separate bounded geometry stage described in [the geography resolution addendum](geography-source-resolution-20261017.md). This supersedes the no-details prohibition only for selected administrative geometry when **both** `geometryEnabled` and `geometrySourceAccepted` are explicitly true. Both default false. Ordinary selected-place details remain snapshot-only; no reverse, arbitrary geometry or other details features are admitted.

The additional exact GET endpoint is `https://api.geoapify.com/v2/place-details`, with only selected `id`, fixed `features=details,details.full_geometry`, and server credential `apiKey`. Each attempt costs two reserved credits. A search may acquire at most ten selected region snapshots/twenty credits in a separate thirty-second stage, then at most five candidate queries/five credits in fifteen seconds. All calls share existing provider quotas, serialization, timeout, byte cap and stop behavior. Geometry uses a separate 32-entry/1-MiB transient validated cache, one-hour maximum bounded by selection expiry. The existing default five-query mode is unchanged.

Production acceptance remains false pending the exact finite live packet in that addendum and existing account/retention/quota gates. The strict 1,024-position local geometry subset can reject ordinary large countries; unsupported is visible and cannot be represented as global boundary coverage. Unknown candidate membership is withheld, with partial coverage. No source vintage is inferred.
