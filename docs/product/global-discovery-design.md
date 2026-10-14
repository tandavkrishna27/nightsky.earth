# Global night-sky discovery design — 15 October 2026

Status: researched design and implementation handoff, not implemented global coverage. Owner requested a free global product, named-place/near-me/state discovery, no runtime database, a small Hetzner service, reusable cross-platform tools and no further country pilots. This wave performs documentation research and planning only: no source bodies, geography APIs, model calls, deployment or scope reduction.

## Decision

Use prepared, source-linked candidate point files as the dependable discovery layer. Perform dataset processing outside the serving process; retain only selected validated files on the MCP server. Host web search can supplement source gaps when available, with separate links and explicit verification limits. Do not rely on a shared free geocoding/Overpass server as the production POI backend. Do not run a world Overpass/Nominatim instance on the proposed small box.

Primary source preference: retain the existing OSM candidate semantics and adapters. Review Overture Places as an alternative prepared input if its outdoor categories and release/schema prove appropriate; it is not automatically equivalent to OSM parks/protected areas or complete dark-sky locations. Pick the input dataset from a global release inventory and category evidence before authorizing a global build, rather than adding country benchmarks. Implement a source-neutral file catalogue interface so that decision does not require rewriting tools.

This settles the serving architecture, not measured worldwide storage/build affordability. Global rollout requires admitted coverage and budget evidence. Regional fallback or host web search cannot close that gate or silently reduce the agreed global scope.

## Researched comparison

| Route | Free data / reuse | Server/build implications | Decision |
|---|---|---|---|
| Prepared OSM points from Geofabrik extracts | Free downloads, ODbL; attribution and applicable derivative-database offer are retained release obligations | Existing import/filter code reusable. Build cost/raw storage can be large; server needs compact points only. Existing 32-region manifest is a prototype ceiling, not a world design. | Preferred compatible input; global inventory/admission required. |
| Prepared Overture Places | Public global places data; licenses differ by provider, including CDLA Permissive2.0/Apache2.0/CC0. Categories/schema change by release. | Already a places dataset, so may avoid raw OSM road/coastline processing. Outdoor coverage/category suitability and actual filtered download size unmeasured. | Credible alternative, not an added dependency or assumed complete outdoor catalogue. Keep provenance separate; do not merge without reuse analysis. |
| Public Overpass as live backend | Open underlying data does not promise unlimited hosted service | Operator warns against app-backend reliance; quotas/load shedding apply. Nominal usage guideline is not reserved capacity or SLA. Tiling the world to harvest it is explicitly discouraged. | Exclude as dependable production backend. A separately admitted, bounded diagnostic query is not global serving readiness. |
| Public Nominatim for state/POI enumeration | Public-service policy governs the endpoint, independent of open data license | Systematic POI harvesting is prohibited; this is a geocoder, not the missing global spot database. | Exclude for bulk spot collection. Existing local GeoNames remains named-city resolver. |
| Self-host world Overpass/geocoder | Open software/data, but hardware and operation cost remain | Different workload from serving filtered files; no measured fit on 2vCPU/4GiB | Exclude from current small-server architecture. |
| Host web search | Depends on client capability/subscription and browsing access; not a plugin-owned free API guarantee | Useful official-site verification/discovery suggestions; not exhaustive, distance-complete or access-certified | Supplemental only; source links and date separate from catalogue results. |
| Commercial POI API | Free quotas do not establish a permanently zero-cost global service | No paid API procurement/pricing validation in this wave | Not selected for the free-data architecture. |

Geofabrik's current continent listing totals roughly80GB of compressed inputs if those displayed extracts are chosen; this is a listing-based order of magnitude, not a download budget, deduplicated coverage proof or final point-file size. Do not transfer raw world extracts to the MCP host by default. Overture counts/categories cannot be used to infer our selected subset's size without querying an admitted release. No new account, cloud compute or paid service is assumed.

## Location journeys

| Request | Resolution and search | Honest output / failure |
|---|---|---|
| Near me | Use consented approximate host hint only if actually supplied; otherwise ask for town/country. Current resolver snaps to a named populated place. | Distances are from selected town centre; not precise GPS and not guaranteed nearest to the person's current position. No new raw-GPS tool in this plan. |
| Near Munnar, within50km | Existing resolve_place -> chosen city ID -> nearby catalogue query | Stable distance sort; state that candidates are mapped features with unknown access/darkness. Retain50km default and1–300km input bounds. |
| In Karnataka | New region resolver, country disambiguation, pinned ADM1 identifier -> boundary-membership search | Never substitute Bengaluru, state centroid or a300km circle for the entire state. Without an origin, rank by source completeness/name/ID, not distance or sky quality. |
| In India or another country | Resolve pinned ADM0 country identifier -> membership search | Same coverage and budget rules as state search; no capital-city substitution or exhaustive worldwide quality ranking. |
| Near a town, but inside a state | Both resolved city and resolved region IDs; radius filter plus membership filter | Distances from the town; only candidate representative points inside the retained boundary edition. |
| Best for observing/photography | Discovery returns at most10; select at most5 to compare time-dependent evidence | Discovery proximity is not an observing-quality score. Missing sky-brightness, transparency, access and weather remain unknown. |
| Plan at this returned spot | New candidate-details resolution, then exact candidate-point astronomy/weather with explicitly chosen display timezone | Do not calculate at the city centre while calling it a site plan. Candidate geometry is a representative point, not a verified entrance/horizon. |
| No catalogue coverage / no matches / upstream web failure | Return distinct coverage and search-completeness fields; supported city planning can continue | No results does not mean no suitable places. Web results are separate suggestions, never fabricated catalogue records or verified night permission. |

## Proposed tools and contracts

Retain resolve_place and its named-record timezone/privacy scope. Add resolve_observing_region and get_observing_location_details; extend existing search_observing_locations rather than adding one tool per country. Full registry grows from12to14 tools; resolver-only mode remains one. These are proposed additions, not current tool availability.

- resolve_observing_region({regionQuery,countryCode?,adminLevel?}) -> at most5 matches of RegionRef{regionId,name,countryCode,adminLevel,boundaryRevision,sources}; selectionRequired. countryCode is the gbOpen three-letter country identifier, adminLevel0 or1. Country/state/city ambiguity requires selection; city IDs are never administrative boundaries.
- search_observing_locations keeps legacy {placeId,radiusKm?,categories?,limit?}. A new mutually exclusive scope object supports origins:[{placeId,catalogueRevision?,radiusKm?,minimumDistanceKm?}] max5; originMode any/all; includeRegionIds max5 with regionMode any/all; excludeRegionIds max5. At least an origin or included region is required; exclusion-only world scans are rejected with a narrowing request. Radius defaults50/min1/max300 per origin; minimum distance defaults0 and cannot exceed radius. Scope cannot be mixed with legacy placeId/radiusKm. limit defaults5/max10. Country+state context is resolved to the intended region; explicit geometric intersections use all, multiple destination regions use any. Exclusions win.
- Discovery result retains candidates/sources/availability and adds normalized queryScope, originBasis, per-origin distances when applicable, coverage{footprintStatus,searchCompleteness,mappedFeatureCompleteness,catalogueRevision}, and truncation/budget reason. For multiple origins, any sorts by minimum distance; all sorts by maximum distance, with deterministic ties. Region-only sorting is source completeness/name/ID, never nearest or best-sky. Exhaustive means searched installed qualifying records, not every real-world site. Source native vintages remain candidate-linked. A known admitted footprint with zero matching records differs from missing coverage.
- get_observing_location_details accepts either {placeId,catalogueRevision,displayTimeZone?} or {placeQuery,countryCode?}, never both. Name lookup uses a bounded paged name index and returns at most5 matches/selectionRequired; selecting an ID obtains exact stored candidate/source/navigation/context. Stale/conflicting/missing IDs require re-search. No arbitrary user file path, street address or raw coordinates accepted. Rural names outside city/candidate indexes request a nearby known town; no universal name-completeness promise.
- Candidate planning extends existing calculation-place resolution to known catalogue IDs. Explicit displayTimeZone is required if actual site timezone is not verified; base-city display time may be offered to the user, labelled as display choice. No silent nearest-city timezone assignment or claim of exact geographic timezone. Existing named-city flows remain unchanged. Persist nothing per user; pass selected timezone/revision through stateless astronomy/weather/planning inputs. Spot coordinates are public catalogue geometry; the user's origin coordinates remain server-private.

Country/state membership uses reviewed geoBoundaries gbOpen ADM0/ADM1 full geometry and source revision. A bounding box only routes shards; it does not establish membership. Keep holes, islands/multipolygons, antimeridian handling and disputed/source-vintage limitations. Simplified visual geometry must not silently decide precise boundary membership. GeoNames admin names can help resolve aliases but are not polygons; current cities500 tuples retain no admin1 field. Administrative boundaries do not reintroduce the deferred timezone-polygon task.

## Combination and scenario matrix

Search the static geography first, then apply supported night-sky evidence to a bounded shortlist. Date, event, experience, gear and activity belong to the existing planning/comparison/guidance tools, not additional country-specific search APIs.

| Combination / scenario | Required flow | Limitation / response rule |
|---|---|---|
| Near me, town, named candidate, observatory | Resolve consented named-city approximation or bounded candidate name; radius search | Ambiguity/missing name requests selection/nearby town; no precise personal GPS promise. |
| Inside a country/state/province | ADM0/ADM1 resolution and membership search | Never silently substitute capital or bounding circle. Boundary source/edition matters; administrative terminology differs by country. |
| Near town AND inside state/country | Origin radius intersect included boundary | Keep centre basis and geometric source clear. |
| One of several states/countries | includeRegionIds with any | At most5; no unlimited multi-country scan or completeness guarantee if query budget exceeded. |
| Inside both supplied regions | regionMode all | Can be empty/inconsistent/disputed; do not invent an intersection. |
| Near several origins / friends from several towns | originMode any for alternatives, all for shared-radius overlap | Report per-origin straight-line distances; sort rule explicit, no invented driving time. |
| Between two towns | Clarify shared-radius overlap versus road corridor | Mathematical radius overlap is supported; on-route stop selection requires route geometry not currently available. |
| Outside the city / distance band | minimumDistanceKm to radiusKm | Geometric distance band only; not a verified rural/dark-sky or land-use classification. |
| Include one region but exclude another | Include membership then exclusion | Exclusion wins; overlap/source limitations visible. |
| Only campsites/viewpoints/beaches or exclude a category | Supported category whitelist; derive complement from the six known categories | Categories are mapped tags, not night opening or astronomy suitability. |
| Meteor shower/Milky Way/planet/moon/aurora + place/region + date | Discovery shortlist -> existing event/astronomy/weather comparison, max5 options | Preserve event/model/date coverage and per-provider forecasts; no guaranteed visibility or unsupported-year peak guess. |
| Tonight/weekend/alternate dates + several destinations | Resolve local times per supported timezone and compare bounded options | Forecast horizon versus historical context distinguished; daylight-saving/date-line handled. |
| Darker skies, less Moon, cloud threshold, lower wind | Compare returned known evidence on shortlist | Moon/weather usable within support; missing light-pollution/seeing/transparency stays unknown, not a fabricated search filter. |
| Family/beginner/telescope/photography gear | Existing guidance/checklist skill applied to returned evidence | General suitability advice not proof of safety, accessibility, facilities or parking. |
| Must allow night entry / camping / wheelchair access | Only affirmative sourced evidence can satisfy a strict requirement | Current candidate access remains unknown; show verification needed, not assume park tags grant permission. |
| Within two hours / along a driving route | Host maps or specialist app, if available; clarify travel basis | No conversion from straight-line km to road hours. Route corridor, fuel/tolls/transport costs are not provided by this catalogue. |
| Exclude already suggested places | Deduplicate in current conversation by candidate/source ID | No persistent personal history/account storage or cross-client synchronization claimed. |
| Exact pasted GPS / street address | Current V1 rejects raw coordinate/address inputs; offer named town/candidate | A precise-location expansion needs its own consent/timezone/privacy contract; not silently added. |
| Anywhere in the world / cheapest trip | Ask for travel scope/date/budget; offer bounded destination comparison or cited host inspiration | Global queryability is not exhaustive live comparison of every site; flight/hotel prices and full-world ranking unsupported here. |
| Large/dense/polar/dateline scope, empty result, stale data | Enforce paging/read/time budgets and show scope/source gaps | Unknown/partial/budget-limited is not no sites. Never call a truncated list globally nearest. |

These combinations are proposed query semantics or orchestration paths, not claims that every advanced input is already supported. Country/global-wide searches can require narrowing if admitted resource limits are exceeded; preserve the request rather than pretending a partial scan is complete. A dedicated administrative membership/name index should support broad scopes without reloading raw extracts.

## Catalogue architecture

Reusable ingestion -> category/geometry admission -> compact spatial shards -> immutable paged manifest/coverage registry -> bounded runtime readers -> shared MCP tools/skills. No runtime relational DB. OSM IDs/source lineage, names/categories, representative coordinates, native vintage and attribution remain. Access unknown unless independently sourced. Do not retain source phone/email/user/contributor fields unnecessarily.

The v2 catalogue uses spatial directory pages, not one in-memory array of country extracts. Keep leaf caps4MiB/10,000records and default resident cache2leafs/8MiB/20,000records, single active load, queue8. Root and directory pages are checksum-pinned, bounded and loaded on demand; many stored leaves do not imply many resident leaves. Fix root-page bound1MiB and directory-page bound1MiB; query admission at most256leafs/32MiB directory reads/10seconds local deadline as initial engineering stop limits, not measured SLA or global build fit. Large/polar/state requests exceeding them return budget-limited coverage and never claim globally nearest/best. Precomputed region membership supports state queries without loading entire world's polygons per request.

Source footprint coverage is stored separately from candidate min/max coordinates, so an empty but admitted geographic footprint is not mistaken for missing data. Source-native vintages remain separate; same-ID conflicting records cause build rejection/quarantine, not undocumented last-writer wins. Coordinates/rank/order deterministic; poles/dateline/border duplicates tested with synthetic cases, not new live countries.

Global refresh: proposed monthly point catalogue editions built outside the serving host; boundary editions pinned/updated on admitted source releases. Preserve rollback snapshots and atomic selection. Actual builder hardware, raw/scratch/time budget, final files, retained snapshots and host capacity must be measured/admitted before acquisition or deployment. A free user product still has server/build/maintenance costs. The proposed small server is not yet capacity-certified.

## Source admission and scope

Before a global build: select OSM or Overture release and category policy; enumerate nonduplicated source footprints, islands/territories/polar/date-line gaps; review each license/vintage and distribution duties; approve a concrete full-build budget; measure final catalogue and near/state/query capacity. No global success claim from11Monaco/73Faroe points. Fiji's single-worker timeout remains evidence; further country-by-country tuning is not this wave's deliverable.

Historical climatology, celestial-event gaps, installed model matrix, publisher/host requirements and separate website remain in their original tasks. This plan does not close them or add community/spot submissions. Existing counts12Done/9Partial/6Notstarted unchanged. Code/geometry/installed-host validation and broad final audit remain later implementation/release steps.

## Primary sources checked15October2026

- [Overpass operator usage guidance](https://dev.overpass-api.de/overpass-doc/en/preface/commons.html): app-backend/global-scraping warning and shared-service quotas; no dedicated capacity entitlement.
- [Geofabrik download service](https://download.geofabrik.de/): free normally daily OSM extracts, displayed raw sizes and ODbL notice.
- [OSMF Nominatim policy](https://operations.osmfoundation.org/policies/nominatim/): endpoint-specific restrictions including systematic POI extraction.
- [OSMF attribution guidance](https://osmfoundation.org/wiki/Licence/Attribution_Guidelines) and existing project reuse records: attribution/distribution must match active artifacts and product surface.
- [Overture Places](https://docs.overturemaps.org/guides/places/) and [per-source licenses](https://docs.overturemaps.org/attribution/): global point dataset, changing taxonomy and source-specific licenses; no assumption of complete astronomical-site coverage.
- [geoBoundaries API](https://www.geoboundaries.org/api.html): gbOpen, ADM1, pinned geometry/metadata; API availability not guaranteed. ChoosegbOpen, not mixed-license other releases.
- [GeoNames dump documentation](https://download.geonames.org/export/dump/): admin-name files distinct from cities records and geometric boundaries.

## User steering captured

Owner explicitly requested additional combinations beyond near-me/named place/state, including country and combined filters. The matrix and scope contract above incorporate that instruction without changing existing precise-location consent or unsupported travel/access claims.

Implementation sequence and test ownership: [global discovery implementation plan](../superpowers/plans/2026-10-15-nightsky-global-discovery.md). Any/all modes default to any. Coverage uses footprint status covered/partial/not-covered, search completeness complete/budget-limited/unavailable and mapped-feature completeness unknown. Country/state membership includes exterior edges and excludes hole interiors/edges; this is representative-point membership, not access certification.
