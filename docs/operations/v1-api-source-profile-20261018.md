# V1 API source profile — 18 October 2026

This is the current **proposed release profile and evidence ledger**, not an applied production configuration. No private environment/key/ledger was inspected, source activated, request made or allowance reset. The [JSON companion](v1-api-source-profile-20261018.json) pins the complete roster and actual exported operator quota ceilings (inventory role IDs are not a runnable environment configuration); an offline regression checks it against code. Existing documents remain dated evidence, with later results taking precedence over earlier setup states. In particular, API setup's later 7Timer wiki review supersedes the old noncommercial-only screening; this profile does not revive that gate.

## Intended profile

Discovery uses API/search mode, without a database or owned geography catalogue. Local Astronomy Engine calculations remain the primary Sun/Moon/planet/core calculation path. Optional services enrich those results; they do not silently replace failed calculations or remove useful core evidence.

| Source / role | Intended disposition | Current retained evidence | Release/activation boundary |
| --- | --- | --- | --- |
| Geoapify — names, candidates, regions | Proposed core | Owner Free account/3,000 credits/day and bounded live resolution/candidate evidence exist. | Preserve quota and Geoapify/OSM credits; the later freeze record documents public storage/Places reuse and Free geometry feature terms; actual runtime feature controls and selected-geometry acceptance remain distinct. Results are candidates, not night access. |
| GeoNames — additional names/timezone source | Optional, gated | Owner reported signup failure; no functioning account accepted. | No demo account or automatic substitute credentials. This API adapter returns unknown timezone; local indexed GeoNames timezone support is a different mode. Geoapify works without it. |
| MET Norway — forecast | Proposed core | Existing adapter and real source samples accepted in bounded sessions. | Identifying app/contact User-Agent, CC BY credit, coordinate precision, expiry/conditional-cache and traffic controls. No numeric account quota invented. |
| WeatherAPI — forecast | Proposed core | Real samples accepted. Owner account was a Business trial scheduled to revert to Free on 24 October. Code uses Free three-day/hourly endpoint. | Verify post-trial state before release; never rely on trial-only fields. Preserve required credit, forecast warning and reviewed cache bounds. |
| OpenWeather — forecast | Proposed core | Signed-in Free entitlement and successful five-day/three-hour source samples retained. | Fixed `/data/2.5/forecast`, no paid One Call. Response cache disabled pending permission; key/account/rights are separate gates. |
| DarkSkySites — zenith light pollution | Proposed core | Two-point API pilot and owner native comparison passed; SQM/Bortle, source/model/date/point binding retained. Owner confirmed 30,000/month. | Dedicated project ledger and adjacent linked credit. Latest zenith only; no historical/directional Pro features. Unknown coverage remains unknown; the later freeze record reviews ordinary application/cache/credit terms; final account-specific exceptions and rendered-credit acceptance remain distinct. |
| Public Universe — catalogue enrichment | Proposed core enrichment | Parser diagnosis corrected; selected identity/detail/discovery/window live checks retained. | Actual transport origin is `api.sol.wickedsick.com`; the public documentation site is not the API origin. Dedicated lower quota, per-record rights and selected-identity validation remain. Optional catalogue failure must not erase the main plan. |
| NOAA SWPC — aurora context | Proposed core capability | Existing bounded short-horizon global-grid adapter and local checks. | Credit/validity/availability preserved. No personal coordinates sent; grid probability is not local naked-eye visibility. |
| 7Timer — categorical observing conditions | Optional, gated | Adapter and prior diagnostic evidence exist; admission follow-up remains open. | Retained official wiki review permits free or paid software and supersedes earlier noncommercial-only screening. Explicit admission and preserving quota migration remain. Bands are not exact numeric cloud/seeing measurements. |
| Dark Sky Planner — Moon-aware windows | Optional, gated | Adapter and prior diagnostic recorded; no permanent source activation established. | Exact service-use/redistribution terms, usage/admission and live capability remain separate. It does not provide light-pollution readings. Local Moon calculations remain usable. |
| AstronomyAPI — objects/body positions | Optional, gated | Search and one Moon-position diagnostic passed. | No verified numeric free allowance/billing/use entitlement. Keep unadmitted until established; do not guess allowance from our conservative operator caps. |
| NASA DONKI — space-weather events | Optional, gated | Retained live attempts returned 503; no accepted successful event response. | Successful source validation and key-wide allowance/rights remain. DONKI is research context, not operational aurora visibility. |
| JPL — small-body identity/observer ephemeris | Optional, gated | SBDB Ceres identity accepted; Horizons application error lacked accepted table. | Treat identity and ephemeris separately. One-at-a-time fair-use policy; no NASA-key quota inference. No speculative parser loosening or silent fallback. |
| Open-Meteo historical acquisition | Operator preparation only | A bounded annual ERA5 check and partial retained baseline evidence; method/serving code exists. | Not a request-time API fallback. Explicit source/method/coverage admission and separately authorized bounded acquisition needed; see [history profile](v1-event-history-profile-20261018.md). |
| Light Pollution Map browser extraction | Blocked experimental | Parser/worker boundaries and synthetic checks, not admitted source extraction. | `browser_not_admitted` remains. No scrape after API failure/quota. Host-native search/browser is separate and still must preserve source/date/rights limits. |

“Proposed core” identifies the intended product role, **not an activation grant**. No environment values are changed by this record. Actual source selection/admission, exact account use and deployment environment need their own release record. A provider key existing on disk does not establish any of these facts.

## Quota and failure contract

The machine-checked JSON holds actual code ceilings, not new vendor allowances. Discovery/weather share the existing general ledger; additional sky providers use their existing separate ledger, Public Universe and DarkSkySites each require dedicated ledgers. Never initialize or delete a ledger to regain allowance. One process owns each configured accounting scope; multiple independent server copies cannot multiply the account allocation.

- Geoapify: 200/hour, 1,000/day operator credits; ordinary requests cost one, separately selected geometry details two. Published 3,000/day is account evidence, not the application limit.
- WeatherAPI: 60/hour, 1,000/day, 20,000/month; OpenWeather: 30/hour, 300/day, 5,000/month.
- GeoNames: 400/hour, 2,000/day. 7Timer and the four optional legacy sky sources: 20/hour, 100/day, 1,000/month each.
- Public Universe: 20/hour, 100/day. DarkSkySites: 30,000/hour/day/month with separate ten-starts/second transport control; the monthly project cap still wins. These are conservative code/accounting controls, not throughput or uptime guarantees.
- MET and NOAA use their bounded upstream controls/cache semantics, not an invented durable account allowance in this profile. Historical preparation has its own approved execution/credit plan, not a new unlimited allowance.

Source outcomes stay independent: missing configuration, unadmitted source, quota refusal, HTTP/auth/rate error, malformed response, stale/no samples and out-of-horizon are different. Preserve successful series when another fails. No automatic retry, paid fallback, forecast averaging, timestamp shifting or invented missing values. GeoNames named-resolution fallback to Geoapify is supported only under its existing bounded semantics; POI/unsupported geometry has no looser fallback.

## Credits, caches and disclosure

Preserve compact relevant linked credits in user-facing results; full provenance remains structured. DarkSkySites requires adjacent linked attribution, and Geoapify/OSM and MET conditions cannot be replaced solely with a generic credits page. Teach SQM/Bortle briefly while retaining values, date and uncertainty. Do not list unrelated background sources.

Caching is provider-specific: MET uses existing expiry/Last-Modified rules; WeatherAPI has the reviewed 15-minute bound; OpenWeather retains no response cache. Location snapshots and bounded transient caches are not an owned worldwide catalogue. Optional sky method caches use their existing finite TTLs; those implementation bounds do not themselves grant retention rights. Source rights/admission must cover the exact enabled feature before public release.

The [privacy draft](privacy-and-telemetry.md) describes actual request fields conditionally. It remains a draft pending actual publisher/hosting/support-retention inputs. This profile reads no credentials and does not claim legal certification or scientific forecast accuracy.

## What is settled and what is not

Settled locally: implemented roster, fixed adapter routes, operator ceilings, default activation behavior, retained live evidence and capability boundaries. GeoNames remains optional rather than blocking the Geoapify path. Routine astronomy does not depend on AstronomyAPI. A failed optional source does not prevent a useful partial plan.

Still required: source-use/account confirmation for the exact public profile; event selection/maintenance and historical scientific claim decisions; representative geographic/resource and assembled journey evidence; then real hosting/publication gates. Current owner facts (free product, no ads/affiliate links) are retained, not asked again. A future commercial/promotional change requires a specific review of sources with noncommercial conditions.

Evidence is from the repository's dated reviews and bounded sessions, particularly [18 October source audit](v1-final-reconciliation-20261018.md), [API setup](api-mode-local-setup.md), [source admission](api-provider-admission.md), [optional activation](sky-activation-followup-20261017.md), [optional continuation](sky-continuation-results-20261017.md), [Public Universe correction](publicuniverse-hashmap-fix-20261018.md), and [light-pollution acceptance](light-pollution-acceptance-20261017.md). These are retained records, not fresh online checks in this offline wave.

## Verification

`node --import tsx --test tests/operations/v1-source-profile.test.ts` checks exact roster, existing evidence paths, exported quota policy equality, no applied-runtime claim, and empty/key-only configuration behavior. It uses synthetic environment objects, not `process.env`, private files or providers. The profile test first failed while the profile was absent, then passed after the reviewed roster was created. It is registered in the full offline suite; it does not prove active account access or source accuracy.

## Current selection and coverage decision reconciliation

The [source and coverage decision record](v1-source-decisions-20261018.md) separates proposed roles from actual runtime selection. API discovery is explicit: `pluginDiscoveryMode` defaults to `legacy`, despite this profile proposing API mode. Optional keys alone select no services. An absent weather collection preserves the existing MET fallback, and NOAA remains an existing default MCP path; neither has an identical admitted-list gate to optional providers. No deployed environment was inspected here. Exact release selection/admission remains unrecorded by this profile.


The [freeze decisions](v1-freeze-decisions-20261018.md) include later18October primary public-document evidence and exact remaining owner/engineering tasks. Do not repeat the already resolved generic Geoapify storage/Places/Free-geometry or DarkSkySites ordinary application-use research, and do not infer production activation from that screening. Public Universe still requires selected-record/original-source rights mapping.
