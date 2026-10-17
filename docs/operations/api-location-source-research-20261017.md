# Location APIs: source research and bounded recommendation

Research date: 2026-10-17. Official documentation and provider policy pages only. No data API calls, account creation, dataset downloads, code changes, or operational quality tests were performed. This is policy/capability evidence, not an uptime or geographic-coverage benchmark. All linked pages below were inspected on that date; quotas and terms must be rechecked before launch.

## Decision

Recommend **GeoNames for named regions, gazetteer identity and coordinate-to-timezone; Geoapify Free for bounded POI discovery and richer geocoding**. This is a genuinely free, account-configured initial product path with finite usage budgets. It does not require NightSky to operate a geographic database or import a planet dataset. No reviewed provider supports a promise of unlimited, guaranteed, worldwide discovery at zero cost.

Keep **Photon public demo** as an optional low-volume experiment, not the service on which production availability depends. Exclude **public Nominatim** and **public Overpass** from the default production chain. Keep **Wikidata/Wikipedia** for optional identity/context enrichment after a place has been resolved. Do not add all sources as a cascading retry chain.

This recommendation is an engineering interpretation of the evidence below. A free product is not automatically a noncommercial use, and an open-data license is not a promise of free hosted capacity.

## Provider evidence

### GeoNames: preferred gazetteer and timezone source

**Policy evidence.** The [export and terms page](https://www.geonames.org/export/) permits commercial use, requires GeoNames credit/link under CC BY, and currently specifies **10,000 credits daily per application/username and 1,000 hourly**. Most calls cost one credit; endpoint exceptions exist. Community support is free; an SLA belongs to premium service. These are the current published numbers, not older limits repeated by third parties. Data is supplied without completeness, accuracy, or timeliness warranty. Open licensing permits retention with attribution; no endpoint-specific cache lifetime was established in this review.

**Capability evidence.** [Search documentation](https://www.geonames.org/export/geonames-search.html) supports text/exact/fuzzy names, country and continent constraints, administrative codes, feature classes/codes, and bounding boxes. It offers optional bounding-box output. Free pagination has a 5,000 start-row ceiling and maximum 1,000 rows per request. [Service documentation](https://www.geonames.org/export/web-services.html) requires a registered username on every request and forbids use of the example demo account in apps/tests. It documents nearby feature lookup with radius and feature filters, identity lookup by `geonameId`, administrative reverse lookup, and timezone lookup returning an Olson/IANA-style `timezoneId`. [About GeoNames](https://www.geonames.org/about.html) describes worldwide WGS84 features, alternate names, nine feature classes, and CC BY 4.0 licensing.

**Recommendation.** Prefer this for a state, country, town, mountain, or named region; retain namespace plus `geonameId`, name, coordinates, country/admin context, and bounds when present. Resolve timezone for the actual selected observing coordinate. Do not turn a region's representative point into the observing location. Gazetteer entries are not proof of public access or a comprehensive campsite/park catalog. Use a server-owned free username; it is an application identifier rather than a secret API token. Configuration must distinguish missing username, exhausted quota, no results, and provider failure.

### Geoapify Free: preferred bounded POI and richer location service

**Policy evidence.** [Pricing](https://www.geoapify.com/pricing/) explicitly permits free-tier commercial production use indefinitely while within limits: **3,000 credits/day, up to 5 requests/second**, no credit card, and best-effort support. Geoapify and underlying data attribution are required; the FAQ requests a follow-link near the information. This matters for an MCP response: return visible source links with the result and include attribution in any view, rather than bury it only in a manifest. The [geocoding product page](https://www.geoapify.com/geocoding-api/) explicitly allows storing address/location output without additional costs or restrictions, describes international source aggregation, and requires a project API key. Its simple synchronous geocoding cost is one credit.

**Capability evidence.** [Forward geocoding documentation](https://apidocs.geoapify.com/docs/geocoding/forward-geocoding/) describes coordinates, structured geography, source metadata, confidence, `place_id`, and timezone information; fields can be absent. [Places documentation](https://apidocs.geoapify.com/docs/places/) documents category/name search, circle/rectangle/place-boundary filters, proximity ranking, identifiers, and up to 500 results per page. Each 20 returned places costs one credit. It warns that broad retrieval needs care; pagination is not automatically exhaustive. A notable documentation inconsistency: GET country filtering is marked coming soon in one table while other reference sections describe it. Avoid making that feature a launch dependency.

**Recommendation.** This is the most credible reviewed free hosted option for region-aware or nearby candidate discovery without public Overpass dependence. Limit initial requests to a relevant category set and 20 candidates; refine only when needed. Use place-boundary filtering when a region identity is available; radius search alone does not represent a large or irregular region. Preserve the provider place ID and source metadata. Do not treat categories or missing access/fee tags as verified nighttime access. Independently check an operator's official access information before making that claim.

**Uncertainty.** The [general terms](https://www.geoapify.com/terms-and-conditions/) were inspected, but this review has not established a special MCP/API redistribution entitlement, an SLA for Free, or universal retention rules covering every POI enrichment field. Integrating attributed results into NightSky's observing workflow is the proposed use, not reselling an unrestricted generic API. Confirm unusual redistribution or large-scale retained POI use before expanding scope. Keep the key server-side and prevent any automatic paid upgrade.

### Photon: useful open-source geocoder; public endpoint is a demo

**Policy evidence.** The [maintainer README](https://github.com/komoot/photon) calls `photon.komoot.io` a public demo. Projects may use it at reasonable volume, but no numeric quota is promised; extensive use can be throttled/banned, availability is not guaranteed, and changes may occur without notice. No API key is documented. Apache 2.0 covers software, not the OSM data license. Self-hosting requires a geographic search database, outside this project's constraints.

**Capability evidence.** The [API specification](https://github.com/komoot/photon/blob/master/docs/api-v1.md) supports forward/reverse/structured search, bbox constraints, country constraints, location bias, layers and categories. Results are GeoJSON with OSM type/ID and representative coordinates. Tags are restricted by the imported principal tags; this is not arbitrary OSM querying. Result ceilings depend on deployment. No timezone service is documented. The current specification deprecates raw `osm_tag` filtering in favor of categories, whose definitions depend on deployment; do not assume the demo matches every master-branch feature.

**Recommendation.** Optional name-resolution fallback only after deliberate low-volume configuration, a global request budget, and graceful unavailability. Not a comprehensive regional candidate finder or substitute for a reliable POI contract. No special cache TTL was found; apply underlying OSM license obligations to retained data.

### Public Nominatim: not a default generic MCP location service

**Policy evidence.** The [OSMF public-server policy](https://operations.osmfoundation.org/policies/nominatim/) caps aggregate application traffic at **1 request/second**, requires identifying User-Agent/Referer and attribution, calls for service switchability, and recommends proxy/cache use. Autocomplete and systematic POI/area enumeration are prohibited. It restricts generic geocoding services through no-code/low-code/vibe-coding platforms and requires a deliberate informed developer decision. Geocoding-primary services must host their own service. LLM recommendations must prominently link and explain this policy. This policy concerns OSMF's endpoint, not all Nominatim installations.

**Recommendation.** Exclude the public endpoint from the production plan. NightSky's broader astronomy purpose does not establish that a generic exposed place-search tool meets these restrictions. Low request volume alone does not resolve the use-case concern. A separately contracted compatible service could be evaluated later, but is unnecessary for the shortlist.

### Public Overpass: flexible OSM querying, unsuitable as assumed production backend

**Policy evidence.** The [operator's Commons guidance](https://dev.overpass-api.de/overpass-doc/en/preface/commons.html) describes roughly **10,000 requests/day and 1 GB/day** as broad safety guidelines, not reserved capacity. Crucially, it lists non-mapper apps relying on public instances as problematic and says operating one's own instance is sustainable for that case. Requests face load shedding, slot cooldowns, 429 responses, and resource-related 504 responses. Planet scraping by tiled boxes is problematic. Individual instances can have different terms.

**Recommendation.** Exclude public Overpass from default production and automatic fallback. A request cap does not cancel the explicit backend guidance. Do not rotate instances to avoid throttling. Its query expressiveness does not make it a free production hosting agreement; private hosting conflicts with the no-runtime-database constraint.

### OSM data obligations across providers

The [OSM copyright/license page](https://www.openstreetmap.org/copyright) allows use and adaptation under ODbL with attribution and explains share-alike obligations. Provider-specific hosting restrictions are additional to these data rights. Retain data-source attribution separately from API-vendor attribution. A licensed dataset being freely downloadable does not authorize unlimited queries to a donated public server. No OSM data was downloaded for this research.

### Wikidata and Wikipedia: optional enrichment, not primary discovery

**Evidence.** [Wikidata access guidance](https://www.wikidata.org/wiki/Wikidata:Data_access) offers CC0 structured data, persistent entity IDs, entity retrieval, and narrow queries. It recommends text search rather than SPARQL regex for names, advises narrow result sets, documents revision-aware cached entity access, and requires respectful request behavior. [Wikipedia/MediaWiki Geosearch](https://www.mediawiki.org/wiki/API:Geosearch) finds geotagged articles near a coordinate and returns page identity, coordinates and distance. Article presence is a different coverage criterion from suitability as an observing site. The [Foundation API policy](https://foundation.wikimedia.org/wiki/Policy:Wikimedia_Foundation_API_Usage_Guidelines) requires identifying clients, following throttling, honoring licenses for cached/republished content, and forbids disguising excessive use. Numeric limits may change. [API etiquette](https://www.mediawiki.org/wiki/API:Etiquette) is the implementation guidance to revisit before enabling an adapter.

**Recommendation.** Defer an enrichment adapter until the core two-provider path works. Use explicit Wikidata IDs or official links to establish identity/context for a small candidate set. Wikipedia text and media have their own licenses; Wikidata's CC0 does not cover all linked content. No public service here supplies a general accuracy or completeness guarantee, and neither should be used to infer nighttime entry permission or timezone from a place name alone.

## Proposed no-database execution contract

These are design recommendations, not provider claims:

1. Parse the user's location as coordinate, named point, or named region. Resolve ambiguity before using an arbitrary top hit. Country/admin context and source IDs belong in the response.
2. For a region, preserve its identity and available bounds. Explain that candidate discovery is a bounded sample, never all places in the region. Request a smaller locality when a useful bounded search cannot represent the region; do not silently replace the region with a city-center circle.
3. Route gazetteer/region/timezone work to GeoNames; route POI discovery or unresolved richer names to Geoapify. Avoid querying both for every call. An optional provider must not be required for tools unrelated to its capability.
4. Use process-memory bounded TTL caching and in-flight request deduplication if permitted. Do not create SQLite, hosted SQL, a spatial index, or a bulk local catalog. Cache source IDs, queried geography, fetch time, attribution and result provenance with values. In-memory cache disappears on restart; do not present it as durable quota enforcement.
5. Set a conservative per-tool call budget, result cap, timeout and one bounded retry for transient failures. Honor provider Retry-After. Provider quotas are application/account-wide: multiple server replicas need a deployment-level limiter or single egress worker; independent memory counters do not enforce a shared quota. If no such coordination exists, document a single-instance deployment limit.
6. Stop at free-tier capacity and return a useful partial result or source-unavailable status. Never evade caps with account/instance rotation. Keep coordinate-based astronomy tools usable when discovery is exhausted.
7. Carry `source`, source identity, coordinates, region context, IANA zone when resolved, attribution and uncertainty. A UTC offset is insufficient for dates across DST changes. Resolve local time for the selected coordinate/date using the named zone; do not use a region-center zone across a multi-zone region.
8. Separate candidate evidence from observing quality: these APIs do not establish darkness, horizon openness, safe travel, weather, permissions, or actual nighttime access. Preserve unknowns for later specialized evidence.

## Release checks still needed

- Register/configure free GeoNames username and Geoapify key; confirm account activation, HTTPS behavior and live quota behavior without spending paid credits.
- Run a small authorized geographical validation matrix: ambiguous towns, local-language names, large states/countries, islands, antimeridian bounds, border coordinates, multi-timezone regions, and sparse rural POIs. This research did not execute that matrix.
- Check actual Geoapify category coverage for park/viewpoint/campsite needs and confirm chosen endpoint parameters against deployed behavior; avoid relying on inconsistent country-filter documentation.
- Validate visible attribution in text-only MCP responses as well as rendered UI, and preserve provider/source links through tool composition.
- Recheck free-plan terms and account-wide deployment limits at launch. Do not promise worldwide exhaustive coverage or permanent free availability.
