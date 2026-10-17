# Optional Public Universe integration for NightSky V1

## Intent and authority

Owner-approved intent: broaden target discovery, structured object learning, meteor/small-body context and optional exoplanet learning without replacing NightSky's current choices. This is a new optional source inside existing V1 source/experience tickets, not a new product or ticket count. Existing reviewed baseline: `37aee0cbcb90e9a1ae0e29123dba98c6a0cdb2b7`, package1.0.20, all six CI jobs passed.

Research findings are pinned; live feature availability still needs acceptance. Source-of-truth pin: Public Universe backend `95584ebc5f8cc40e4f6dc923f4e58288910e0093`. Inspect `api/main.py`, `mcp-server/server.py`, `solar_db/observing/{inputs,discovery,planner,catalogue,ephemeris}.py`, `solar_db/http_quotas.py` and starter NOTICE/manifest. Published OpenAPI was fetched successfully for research; route advertisement is not live calculation acceptance. No astronomy endpoint or catalogue bulk file was queried for this design.

## Existing behaviour to preserve

- Astronomy Engine remains default for supported Sun/Moon/planet/core calculations; existing forecasts, light pollution, location resolution, preparation and event evidence remain intact.
- Optional AstronomyAPI search and JPL identities/ephemerides retain their contracts. Public Universe IDs never become JPL SPK IDs by string manipulation.
- No owned catalogue/database, downloaded kernel, server-to-server MCP dependency, new API key, paid feature or website change.
- Source selection/admission/quota are explicit; existing configuration yields the same tools and results with zero Public Universe network access.
- No automatic provider fallback or cross-provider averaging. Failure is scoped to the optional capability, not the full outing.

## Capability boundaries

| Capability | V1 decision |
| --- | --- |
| Equipment-aware target discovery | Optional remote shortlist with scope, ranking reasons and refined geometric windows preserved |
| Starter stars/double stars/deep-sky identity | Optional source-qualified records; no local arbitrary-object engine support implied |
| Object facts, discovery, aliases, moons/rings/atmosphere | Requested reference sections only; no automatic catalogue-wide queries |
| Meteor-shower information | Background identity and parameter sets; do not replace annual peaks, radiant models or forecast evidence |
| Comet/asteroid close approaches | Optional context, not brightness, naked-eye visibility or local viewing recommendation |
| Exoplanet/host facts | Optional learning context, not observing ephemerides or transit predictions |
| Catalogue-target windows | Separate tool for returned pinned starter identities; never feed IDs into the local target tool |
| Legacy approximate positions/perihelion/orbital propagation, galaxy map, schema/download utilities | Not exposed as additional V1 tools; no need for a competing planner or large map response |

## Four tools, one optional provider

Names below are new distinct names; existing tools are not renamed or given breaking unions.

1. `search_reference_objects`: domain `solar-system|starter-targets|exoplanets`, query1-100 characters, limit1-10, no automatic pagination. Returns domain/source IDs, explicit matches, selection requirement and bounded references. No local visibility inference. Solar-system discovery still requires exact selection when ambiguous; upstream partial-match detail lookup must not bypass selection.
2. `get_reference_details`: discriminated operations for selected-object facts, meteor code, close approaches, exoplanet and host details. Object references come from a dedicated short-lived reference store, never the geographic store. Optional object sections `discovery|designations|moons|rings|atmosphere`, maximum two. Bounded close-approach date range31days, limit10; meteor parameter sets bounded20; no all-object listings. Each details call has at most three sequential explicitly requested dispatches and a15second total operation deadline (not15seconds per section), with explicit per-section statuses. Rolling catalogue admission allows cold multi-section bursts below the shared ceiling without sleeps or a queue. Prefer inline fields from the base object when supplied; do not fetch duplicate sections. No unrequested fan-out or retries.
3. `discover_observing_targets`: consumes the existing resolved place reference, explicit display timezone where needed, local-night date, selected UTC window, equipment `naked_eye|binocular|telescope`, preference `balanced|wide_field|stars|deep_sky|solar_system`, shortlist1-6, optional true field0.01-180degrees and V-magnitude filter-30to30. Altitude0-90, solar threshold one of-6/-12/-18, Moon separation0-180. Optional user horizon is deferred: do not accept unsupported mask parameters or claim terrain modelling.
4. `get_catalogue_target_windows`: same observer/date/window constraints and1-6 uniquely selected starter references. Only source-pinned `bsc5p:` and `openngc:` IDs; no arbitrary provider bodies, Sun or Earth. Windows are source calculations; they do not replace the main NightSky aggregate planner.

Search/discovery creates opaque reference IDs with immutable identity/provenance snapshots (no observing positions/windows), revision hashes and1hour expiry in a dedicated bounded process-local store (maximum256refs,64KiB per snapshot). No database/persistence. Detail/windows reject expired/forged references before network. Selected details must match upstream exact ID; if the upstream cannot establish identity, return partial/unavailable rather than choosing a partial name. When the operation exposes a comparable token from the same source lineage, a changed token invalidates the selection; no implicit refresh. If a reference operation exposes no comparable token, verify exact ID and mark remote revision association unverified instead of fabricating a mismatch or binding a separately fetched global ID. Catalogue observing windows require comparable starter source metadata; absent comparability yields unavailable, not guessed geometry.

## Result contract and evidence

- Common strict normalized envelope: provider, operation, status, reason/errorCode, retrievedAt, sources, limitations, operation-specific data. Statuses `available|partial|unavailable|not-found|ambiguous|invalid-input|stale`; errors never become successful empty lists.
- Preserve source IDs, source URL, source retrieval/version/hash, licence and attribution. Do not echo unbounded raw JSON or arbitrary URLs into HTTP transport. Facts use a reviewed named-field allowlist; null remains unknown, with measurement units, uncertainty/limit flags and references retained where supplied.
- Keep requested coordinates and provider's returned effective coordinates separate. The provider validates then rounds with Python to two decimals; do not use JavaScript rounding to invent its exact result. Validate returned bounds, two-decimal precision and displacement no more than0.00500001degrees per coordinate. Reject larger mismatches. State approximation for these calculations; darkness/weather continue at their own exact bound points.
- A local night is noon-to-next-noon in the selected IANA timezone, including DST/date-line cases. The required UTC window is second precision, strictly ordered and inside that night. Reject unsupported multi-night requests rather than silently clipping. Never widen fractional-second input silently; this new tool accepts exact second precision.
- Night result observer echoes rounded coordinates; discovery request echoes normalized inputs. Bind date, timezone, constraints, exact selected IDs and selected interval before accepting results. When duplicate fields occur across request/plan, require consistency.
- Upstream chart samples cover the whole local night, while windows/constraint coverage concern the selected interval. Retain only in-window chart samples for answer use, at most three chronological samples per target, with reduction explicit; validate upstream maximum400samples/target and8targets before normalization. Keep windows and unresolved statuses, not a fabricated continuous track.
- Observing supports50BSC stars and107OpenNGC directions; the108-row OpenNGC reference sample contains an unsupported M45/Mel022 record. Do not promise every catalogue search match is a valid observing target. Exact IDs are case-sensitive, for example `bsc5p:hr2491` and `openngc:NGC0224`; one invalid target rejects the whole upstream request.
- Catalogue data and observing data have different lineage. Observing uses packaged starter snapshots independent of SQLite. Never attach `/catalogue` build identity to observing results. Preserve `discovery.source_snapshots`, calculation hashes and `method`; SQLite identity is context only for the operations that actually bind it.
- Keep `unresolved_grazing`, incomplete screening, no-refined-window, missing brightness and absent data distinct. Twenty-minute screening can miss targets; none found is not an all-sky negative. Five-minute chart cadence and one-second root tolerance are not physical accuracy claims.
- Equipment-family preferences are not aperture/detection guarantees. Extended-object integrated magnitude is not point-source visibility or surface brightness. Double-star separation is not an object's diameter. User-entered horizon support is not surveyed terrain; V1 tool does not expose it.

## Transport, resources and admission

- Fixed HTTPS origin `https://api.sol.wickedsick.com`; method/path/query/body allowlists only. No arbitrary URLs, redirects, cookies, credentials, browser fallback or source-code execution.
- Dedicated GET/POST JSON transport,15second total request deadline,1MiB response cap, one active upstream request, no retry/queue. Bound streamed bodies before JSON parse. Canonical request keys include method, path and sorted normalized inputs, plus quota owner; coalesce identical in-flight calls.
- Respect operation limits: discovery maximum4starts/minute with15second minimum spacing; night maximum8/minute with7.5second spacing; catalogue maximum30/minute using a rolling counter (no minimum spacing), plus a shared conservative30starts/minute ceiling. Do not sleep/queue; return rate-limited. Shared process lifetime, fake-clock tests and persisted provider cooldown for429.
- Public docs advertise approximately60/minute and1000/day. Source decorators can override SlowAPI defaults; these are not proven additive deployed entitlements. An operator ceiling (20/hour,100/day) is conservative application accounting, not verified remaining vendor IP allowance. No claim of dedicated capacity or uptime.
- Add provider `publicuniverse` to optional-sky selection/admission but keep its quota policy separate from legacy `SKY_QUOTA_POLICIES`. Default off. Use optional absolute `NIGHTSKY_PUBLICUNIVERSE_QUOTA_STATE_PATH`, distinct from weather/sky/light-pollution paths (case-insensitive identity on Windows). Missing/uninitialized/invalid accounting denies this provider only; unsafe configured paths are configuration errors, not swallowed corruption. Never pass its policy into the legacy sky ledger or open the legacy ledger merely because only Public Universe is selected. Existing ledger entries are never reset/reinitialized; normal startup never adds credit. A separate preparation-only operator setup command proposes a new dedicated application budget. Initializing that unused NightSky allocation is not an assertion about all other public-IP consumers or remaining vendor allowance; activation requires an explicit decision.
- Respect HTTP cache directives: observing routes use `Cache-Control:no-store`; never cache their numerical results or serve them as replay. `no-cache` metadata is not reused without revalidation. Success-only reference GET cache only when allowed:32entries,128KiB/entry, maximum TTL24h further capped by upstream max-age; absent explicit freshness use1hour. In-flight coalescing is not a result cache. Selection state retains only minimal identity/provenance/expiry, never observing data. Preserve original retrieval time on hits and short-lived reference expiry. Do not return expired refs from cached searches: refresh local refs from the same immutable cached record within source freshness or reject stale. No stale-on-failure promotion.
- New store, transport and cache have explicit `close()`; close on normal shutdown and failed configured-app startup. Cancelling a waiter must not free an in-flight slot until its underlying request ends.

## Rights and user experience

MIT covers upstream software, not every source dataset. Starter data notice identifies Bright Star Catalog author/NASA/HEASARC credits and OpenNGC CC BY-SA4.0 requirements. Preserve per-record/source attribution, licence links and modification statements. No claim that the software licence alone authorizes all data reuse, and no claim that using data dictates the whole application's licence.

Keep the five current skills and enrich routing rather than adding overlapping persona skills. Ordinary planet/core plans continue on existing tools. Broader star/deep-sky/equipment discovery can use the optional source. Object learning and specific meteor/exoplanet questions trigger reference calls only when relevant. Explain source/model disagreement rather than selecting a hidden winner. Host-native maps/search/browser remain available under their own permissions; they do not activate this source.

## Acceptance and execution boundary

Offline fixture/schema/adapter/MCP/lifecycle/quota/package tests and independent review are required before packaging. No fixture or package check establishes live provider or native-host acceptance. Prepare, but do not execute, a bounded live validation proposal after code checks. No current download/API allowance authorizes those calls. Final rollout remains optional/unadmitted until reviewed live evidence exists.

This document is the design for review, not implementation or source activation.

## Source audit findings incorporated

At the pinned source, observing POST bodies are limited16KiB; unknown/duplicate JSON keys, query parameters, booleans in numeric slots and nonfinite values are rejected. Upstream statuses include422validation,413body-size,429rate limit and503busy/model/worker failures. The source worker can run35seconds and emit1.5MB; NightSky intentionally uses a shorter15second/1MiB fence, so some valid heavy requests can return bounded timeout/size failures, not no targets. No retries or expensive automatic narrowing follow.

Night geometry is local noon-to-noon with22-26hour permitted duration. Selected windows are exact UTC seconds and at least1second. Lunar phase belongs to full-night midpoint, not necessarily the selected session. Never label it as our selected-instant Moon calculation.

Public Universe's catalogue build identifier is not an observing snapshot identifier. Only exoplanet list responses expose same-transaction `catalogue_snapshot`; other records keep their own source provenance, and absent/unknown association stays distinct. Small-body/object details are richer than the normalized subset; omit fields that cannot retain correct units/uncertainty rather than flattening arbitrary raw JSON.

## Exact operation mapping and revision rules

| Public operation | Fixed REST call | Identity/result interpretation |
| --- | --- | --- |
| search solar-system | GET `/api/v1/search`, `q`, `limit<=10` | `{query,results}`; each exact `id` is a search selection, not a partial-name detail result |
| search starter-targets | GET `/api/v1/starter-targets`, `q`, `limit<=10`, `offset=0` | `{available,results,total,limit,offset,sources,coverage}`; unavailable can omit limit/offset; exact case-sensitive starter IDs |
| search exoplanets | GET `/api/v1/exoplanets`, `q`, `limit<=10`, `offset=0` | `{available,results,total,limit,offset,has_more,catalogue_snapshot}`; keep same-response transaction association only |
| details selected solar object | GET `/api/v1/objects/{encoded exact id}` | Check returned id; named allowlist from object/orbital/physical/visual/classifications and `sources[]`; unknown404 |
| detail discovery/designations | GET `/api/v1/objects/{encoded exact id}/discovery` or `/designations` if not already returned inline | Bound named record or `{results}`; do not send free-text aliases |
| detail moons/rings/atmosphere | GET `/api/v1/planets/{encoded exact parent name}/moons`, `/rings`, `/atmosphere` | Parent name comes only from verified selected object with permitted type; no synthesized parent association; validate returned IDs/parent evidence or mark association unverified |
| detail starter target | GET `/api/v1/starter-targets/{encoded exact id}` | Exact id plus provenance; missing table and not-found can both404, so do not invent coverage distinction |
| meteor detail | GET `/api/v1/meteor-showers/{three-letter uppercase code}` | `{iau_no,code,name,status_label,parameter_sets,parent}`; bind code; validate up to500sets within transport bounds, return first20 in upstream order plus total/truncated status. Above500 is a response-budget failure, never no shower |
| selected-object close approaches | GET `/api/v1/objects/{encoded exact id}/close-approaches`, `from`, `to`, `body=Earth`, `limit<=10` | `{object,results}`; from/to real YYYY-MM-DD, inclusive maximum31calendar dates (difference<=30days). Object echo and selected ID checked using exact known binding; proximity is not visibility |
| exoplanet detail | GET `/api/v1/exoplanets/{encoded exact id}` | Exact id, selected host identity and known measurements/source_data error/reference metadata; no inferred observing/transit data |
| host detail | GET `/api/v1/exoplanet-hosts/{encoded exact host_id}` | Host identity from selected exoplanet or dedicated host ref; parsed coordinate_metadata and bounded planets. No auto-query for every planet |
| discover | POST `/api/v1/observing/discover` | Required `date`, `timezone`, `lat`, `lon`, `equipment_mode`, `window_start_utc`, `window_end_utc`; singular `preference`, `shortlist_limit`, optional `true_field_deg`, `max_catalogue_v_magnitude`, and flattened `min_altitude_deg`, `sun_altitude_deg`, `min_moon_separation_deg`. No `preferences`, nested `constraints`, query parameters or `targets` |
| starter windows | POST `/api/v1/observing/night` | Required `date`, `timezone`, `lat`, `lon`, `window_start_utc`, `window_end_utc`, `targets` (comma-joined 1–6 exact starter IDs); optional flattened `min_altitude_deg`, `sun_altitude_deg`, `min_moon_separation_deg`. No discovery-only fields, numeric/array targets or body-name substitution |

Tool-level windows are REQUIRED even though upstream makes them optional. Validations use UTC seconds endingZ and local noon boundaries, never silent widening/clipping. Public names are exactly `search_reference_objects`, `get_reference_details`, `discover_observing_targets`, `get_catalogue_target_windows`.

Public `localNightDate` maps to upstream `date`; resolved place coordinates map to `lat`/`lon`, the selected display timezone to `timezone`, and public window endpoints to `window_start_utc`/`window_end_utc`. Optional constraints are flattened into the named upstream keys above. Contract fixtures assert exact serialized key sets, including omission of unspecified optional fields; they must reject unknown or nested aliases.

`get_reference_details` input is a strict discriminated union: `kind:'selected-object'` with referenceId/revision and sections (0-2); `kind:'meteor-shower'` with code; `kind:'close-approaches'` with selected solar reference and from/to; `kind:'exoplanet-host'` with selected exoplanet reference or explicit host ref. Selected-object routes by the stored domain (solar-system/starter-targets/exoplanets), not caller-chosen URLs. Meteor details create a meteor identity snapshot only; it never becomes an observing target.

Local revision = SHA256 of UTF8 canonical JSON with recursively sorted object keys and stable array order of `{domain,upstreamId,upstreamSourceIdentity,coordinateFrame,coordinateEpoch,motionModel}`; absent upstream tokens are explicit null, and local fetchedAt/expiry are not comparison tokens. Snapshot fields are immutable. Opaque referenceId and revision must both match the store; expiry is separate. Remote comparison is performed only on shared token keys of the same lineage. ID-only bindings remain explicitly unverified for remote version; known changed comparable metadata returns stale-selection. Never attach an exoplanet-list SQLite token to a detail response that doesn't supply it. Starter observing comparison uses source/snapshot/upstream/frame metadata, not SQLite catalogue IDs.
