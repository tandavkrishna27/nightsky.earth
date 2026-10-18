# V1 final local reconciliation and readiness audit

**Audit date: 18 October 2026.** This is an evidence reconciliation and two conversation fixes, not a deployment or publication approval. Runtime discovery is API/search based; no owned global catalogue, SQL database or bulk planet is required. Website work remains separate.

## Results of this wave

- Named-city planning reuses its resolved identity, revision and timezone without candidate-detail prerequisites. Genuine candidate details use mode-specific identity/revision (API requires placeId/sourceRevision; named queries are catalogue/legacy only); invalid arguments are not repeated blindly.
- Requested darkness cutoffs are labelled as such; a clipped interval does not establish actual dusk/dawn.
- Draft privacy now conditionally discloses optional APIs and their actual request fields. Source activation and final publisher/retention review remain independent.
- The [27-heading matrix](v1-remaining-ticket-release-matrix.md) separates work location instead of recycling obsolete completion percentages: 12 original local deliverables done, 6 with local acceptance remaining, 8 release dependent, 1 separate website workstream. These are not new Done/Partial/Not-started counts.

## Readiness matrix

| Area | Current evidence | What remains / gate type |
| --- | --- | --- |
| API/search runtime | server/plugin.ts supports API mode without local geography; fixed endpoints, bounded schemas and partial results exist. Owner discovery/forecast and native timing passes are scoped in their evidence reports. | Freeze the exact enabled configuration and unsupported scope; representative evidence is not every-place verification. Local acceptance. |
| Astronomy/events | Local Sun/Moon/planet/core calculations and boundary labels are tested. Published peaks and bounded radiant samples are distinct. | server/events/meteorCoverage.ts still records pending maintained selection, no complete activity-season evidence and bounded radiant domains. Resolve the maintained supported list/review ownership and explicit gaps; do not invent complete seasons. Local source/scope gate, not a demand for exhaustive events. |
| Historical context | Optional API acquisition/store/provider code and limited real annual/sample evidence exist. Request handlers do not acquire history. | An admitted full baseline is absent. Either complete the promised bounded baseline/method validation under separate approval or obtain an explicit scope decision for unavailable history; do not silently drop it. Optional history stays disabled until admission. |
| Forecasts | MET plus bounded WeatherAPI/OpenWeather adapters retain source times, units, unknowns and independent values. No paid OneCall endpoint is used. | Actual production account entitlements, maintained terms/credits, quota ledger and source activation must be recorded. No more live requests were made by this wave. |
| Optional sky/light pollution | Selection, admission and durable quota controls separate configuration from key presence. Browser scraping is not automatically activated. | Admit only the features with supported rights/free allowance. An unavailable optional tool is not automatically a launch blocker; a promised active capability needs evidence. API access is not an unrestricted dataset licence. |
| Attribution | Relevant compact credits, full provenance and licence links are implemented; owner preference does not override provider credit requirements. | Check the exact enabled profile and final model-rendered output. DarkSkySites requires adjacent linked credit; a generic credits page alone is insufficient. |
| Privacy | Shared draft covers configured geocoding/weather, optional API fields, source caches, quota accounting and optional historical storage. It remains clearly a draft. | Verified legal publisher name, support retention, actual proxy/runtime/provider disclosure and hosted URLs are release inputs. No invented deletion SLA or legal-certification claim. |
| Secrets/security | Credentials remain outside the repository/package; fixed upstream endpoints, sanitised tool errors, origin/host/proxy/rate and quota controls exist. Tracked heuristic scan found URL-fragment false positives and deliberate private-key-header test fixtures only; no unclassified match remained. No credential files were read. | Heuristic scan is not a complete security certification. Final exact artifact, dependency checks, public proxy/TLS/log settings and permissions still need release review. |
| Quotas/failure handling | Durable provider counters survive restarts; source-specific ceilings are conservative policy, not promised vendor entitlements. Abort, body caps, cooldown and no automatic provider retries are tested. | Keep keys/account use and ledger ownership coordinated. Single-process limits do not establish distributed fairness or unlimited public capacity. |
| Packaging/clients | Complete Codex/Claude archives share the MCP core and five workflows. Native Codex CLI and owner-chat evidence cover particular flows; Claude testing was explicitly deferred. | Do not advertise complete Claude/Gemini/native-UI acceptance from portable architecture or CLI fixtures. Reconcile the applicable journey matrix on the frozen package. |
| Small-server fit | Existing synthetic compiled probes measure local process RSS/startup/latency, with model inference outside the MCP server. API mode removes bulk geography runtime storage. | Actual selected configuration/source latency, concurrency, storage/log/refresh and small-host fit remain a measurement gate. No inference that a raw-file byte count proves RSS or capacity. |
| Hosting/publication | Local route/package/preflight/rollback preparation exists; public package builder still returns submissionReady:false and an example endpoint by default. | Host plan/region, permanent HTTPS, verified identity/account, policy URLs, streaming/proxy/log/retention, actual rollback/official validation, reviewer evidence and explicit submission/publication are release dependent. No deployment now. |

## Official source checks made during this audit

These were public documentation reads, not weather/location/data API requests or account inspection. Snapshot date is 18 October 2026. A listed free plan does not replace account-specific admission, attribution or usage accounting.

| Source | Published facts checked | Implemented/current boundary |
| --- | --- | --- |
| [Geoapify pricing](https://www.geoapify.com/pricing/) | Free 3,000 credits/day; commercial/production use permitted within feature/quota/attribution conditions. | Code uses lower operator ceilings; Places page limit20 and details charged2. No new credit entitlement or account reset inferred. |
| [WeatherAPI pricing](https://www.weatherapi.com/pricing.aspx) | Free 100K calls/month and three-day forecast listed. | Configured ceiling20K/month, request horizon capped to free three-day product. No future/premium access inferred. |
| [OpenWeather pricing](https://openweathermap.org/price) | Free current weather and native three-hour/five-day forecast; 60/minute and1M/month listed. | Fixed /data/2.5/forecast adapter and lower operator limits. No OneCall, premium history or automatic paid fallback. |
| [MET terms](https://api.met.no/doc/TermsOfService) | Identification, caching/expiry, coordinate precision, attribution and traffic conditions. | Required contact UA and existing source controls retained. Public release must preserve credits and operational settings. |
| [DarkSkySites API](https://darkskysites.com/api-access) | Free latest Zenith30K/month; historical/directional features described as Pro; required adjacent linked attribution. | Current adapter is /api/sqm; do not promise Pro/directional/history. Explicit historical-month entitlement needs verification. Linked API terms were not extractable in this audit; full reuse terms remain an activation record, not inferred from free pricing. |
| [Public Universe API](https://publicuniverse.net/api) | Free read-only/keyless API; approximately60/minute and1,000/day/IP described; freely usable data statement. | Dedicated quota policy is lower20/hour and100/day. Retain per-record rights/provenance; no bulk copy or unrestricted rights inferred. |
| [Open-Meteo terms](https://open-meteo.com/en/terms) | Free service is non-commercial with limits and CC BY conditions; commercial use needs separate arrangements. | Owner currently reports free/no ads/affiliates. This is not a guarantee that a future business or promotional use qualifies. History method/admission remain separate. |

Other optional integrations remain subject to their recorded source reviews and explicit admission; this audit does not newly certify every current account or external term. No screenshot/browser scraping or legal acceptance action was performed.

## Ordered next work and completion rule

Follow the six steps in the [current remaining matrix](v1-remaining-ticket-release-matrix.md#one-ordered-remaining-work-list): finish/verify observed conversation fixes; freeze source and event/history coverage; close API discovery/resource acceptance; complete applicable assembled journeys/final local audit; prepare actual release environment; then authorised submission/publication/pilot. Website remains separate. Do not introduce a new rolling wave counter.

This wave does not declare V1 complete. It removes the stale-count ambiguity and identifies what evidence is still required. Existing 12 original-local completions are retained; future public/client/source promises do not become accepted merely because offline tests pass.

## Verification checkpoint

Both new conversation guidance checks failed before the edits and passed afterwards; strict detail recipes are checked against the actual exposed schema. The optional-source privacy regression failed before the disclosure and passed after it. Package-prefix rules remain unchanged. Final independent review findings were corrected: API-mode details recipes, accurate DarkSkySites request fields and Task 8 evidence. Package-priority regression initially failed after verbose instructions; the opening was shortened without relaxing its guard. Final package/skill subset:107 pass; types and all three compiled runtime checks pass. Both host archives built; all 15 installed 1.0.29 files match. Final native fixed-coordinate replay completed both cases with 14 successful tool calls, zero candidate-detail failures, no timeouts and zero data-provider attempts. Darkness cutoffs are explicit; repeated successful meteor calls remain an efficiency gap and the final case did not exercise the dated-peak branch. Final complete offline suite: **1,796 passed, 0 failed, 2 skipped (1,798 total)**. Exact-commit CI is watched after push. This does not convert release-dependent gates into local completions. No live data-provider calls, downloads or deployment are authorised by this record.


## Follow-up source/coverage wave

Current [API profile](v1-api-source-profile-20261018.md), [event/history profile](v1-event-history-profile-20261018.md) and [assembled journey status](v1-assembled-journey-status-20261018.md) reconcile the next ordered step. The profile is a nonsecret release proposal/evidence record, not an applied active configuration. Existing 7Timer free-or-paid permission supersedes old noncommercial screening; GeoNames API timezone remains unknown. Event selection/maintenance and historical admission remain finite recorded decisions, not silently waived. No new provider requests, downloads or deployment were performed.


## Geography/resource/follow-up acceptance checkpoint

Local1.0.31 adds the [current geography matrix](v1-geographic-acceptance-20261018.md), [bounded core resource receipt](v1-api-resource-measurement-20261018.md) and [follow-up acceptance](v1-followup-acceptance-20261018.md). It fixes two observed deterministic mismatches: ten references for the existing5include/5exclude contract, and API-point wording that incorrectly said named city. Final suite1,811pass/0fail/2skip; types/packages/compiled checks and installed bytes pass. The city multi-turn refresh/expiry case passes its scoped checks; final unknown-site case respects timezone choice but remains partial due duplicate lookup and unsupported suitability opening. Real source/geometry/profile, scientific and release gates remain. No blanket ticket closure or deployment is inferred from this checkpoint.
