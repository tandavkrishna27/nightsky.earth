# Policy and support preparation — 13 October 2026

Local implementation only. Draft routes `/privacy`, `/terms` and `/support` are ready for owner review. They are not published, approved legal advice or a compliance certification. The owner confirmed an individual publisher based in India and the monitored support mailbox `nightsky.earth2026@gmail.com`; the verified legal name remains a deployment/publication gate.

Shared policy copy lives in `shared/nightsky/policies.ts`. Three pages use the existing background/foreground, serif heading, spacing and link styles. Policy paths return from App before the experience overlay, background music and mute controls mount. The standalone pages link to each other and home; the existing footer gained the three policy/support links and now uses the confirmed monitored support address nightsky.earth2026@gmail.com. The support page offers a genuine mailto link and no pretend submitted-message form. Existing Contact and its legacy form remain separate and unchanged; their public-release review is still needed.

## Confirmed implementation facts

| Area | Draft disclosure and source |
|---|---|
| Planning | Named destination/time/activity/optional target/gear are processed; no NightSky account, payment or query-history database. MCP route is stateless; bounded process caches/counters are distinct from user history. |
| Host location | `server/mcp/metadata.ts` reads only explicitly consented `openai/userLocation` latitude/longitude and rounds to two decimals. Untrusted hints are context, not identity or authorization. |
| Subject/IP traffic control | `metadata.ts` retains process-salted subject digests; `route.ts` also retains bounded IP-address counters and a global counter. Raw subject is not retained in subject counters. Expired keys can remain while idle, so no exact deletion SLA is claimed. |
| Sources | Mode-dependent: local GeoNames/OSM/ERA5 remain optional; API mode sends named-place queries to configured GeoNames/Geoapify and region/candidate queries to Geoapify. MET receives destination coordinates rounded to four decimals; WeatherAPI/OpenWeather receive selected coordinates without additional rounding. NOAA fetch is a global grid without a destination parameter. See the 17 October correction below. |
| Logs | Draft states the minimal-logging intent. The legacy `/api` response-body logger is replaced by fixed route/status/duration logging. Local body-capture removal is implemented; final release claims still require exact-revision redaction evidence and hosting/proxy configuration review. Request bodies, hint data, raw subjects and query strings must not be included in application logs. |
| Support | Voluntary email and attachments reach the email provider and operator. The draft explicitly marks retention as pending rather than inventing a duration or immediate deletion promise. No response-time SLA is asserted. |
| Safety | No forecast/sighting/photo/access/darkness guarantee. Land-manager access check; no emergency-service claim; solar-viewing text links to [NASA eclipse safety](https://science.nasa.gov/eclipses/safety/) checked 13 October. |
| Age/legal | Intended audience 13+, not under 13, also subject to assistant-platform terms. No assertion that this age boundary establishes Indian or other legal compliance. Applicable child-data/consumer/privacy/jurisdiction issues require qualified review before publication. |

## Owner and release gates

1. Insert and verify the exact legal publisher identity and required contact/address details; ensure submission identity matches.
2. Choose and document support-message retention, deletion handling, mailbox access and email-provider settings. Confirm any additional operational logging/retention for the actual host, reverse proxy, mail and backups; update draft disclosures from verified settings.
3. Confirm the final body/query/hint/subject logging redaction implementation and tests. A passing local test alone cannot verify an external hosting provider's logs.
4. Obtain qualified legal review for the India-based individual publisher and intended audience/regions, including ages, privacy rights, required notices, transfers, consumer terms and disputes. These drafts do not substitute for that review or waive mandatory rights.
5. Review assistant-platform disclosures and final source licences/attribution, including ODbL exact active-database offer for public candidate use.
6. Review the legacy Contact form/marketing claims and old footer email before publishing the entire site; the new Support route is the monitored product support channel. Do not imply a legacy form actually sends a message until a separate implementation addresses it.
7. After approval, remove draft markers only as a deliberate publication step, verify all policy/support URLs over HTTPS without the experience gate or audio, test the mail link, and link the exact final URLs in host packages. No deployment, submission or publication is included here.

## Validation

`tests/operations/policies.test.ts` has four passing cases: factual disclosure boundaries/no invented sensitive promises; readable server-rendered draft page content with real mail link; three direct routes ahead of mounted audio/entry gate plus footer links; no pretend support form. It renders through Wouter's server path without an actual browser or external request. This establishes local rendering and route-structure evidence; production URL availability and a live browser session remain release checks. Root owns the canonical test aggregator and full build/typecheck verification.

## API-mode factual correction — 17 October 2026

The earlier local-only source disclosure no longer described the configured API implementation. The draft date is now 17 October. The correction preserves the draft marker, unverified legal identity, support-retention decision, jurisdiction review and actual-host release gates; it adds no publication or provider-admission claim.

Read-only code inspection established these data flows:

| Runtime behavior | Inspected implementation |
| --- | --- |
| GeoNames receives named-place query text; Geoapify receives name/region text and candidate category/radius/coordinate or region-ID filters, with configured operator credentials | `server/places/api/geonames.ts`, `discovery.ts`, `http.ts` |
| Geometry acquisition sends the selected upstream region identifier only behind the geometry-enabled and source-accepted gates; validated geometry is retained in a bounded in-memory cache | `server/places/api/geometryAcquisition.ts`, `http.ts` |
| MET formats coordinates to four decimal places; WeatherAPI uses the selected latitude/longitude string without extra rounding; OpenWeather sends those coordinates directly and retains no response cache | `server/providers/weather/metNorway.ts`, `weatherApi.ts`, `openWeather.ts` |
| Selected snapshots/discovery and permitted weather responses use bounded memory caches; expiry checks do not establish an exact deletion SLA | `server/places/api/selectionStore.ts`, `discovery.ts`, `server/providers/weather/weatherApi.ts` |
| Durable quota checkpoint stores provider/account labels, time buckets/counts and blocked/disabled state; no query text, coordinates, response bodies or API-key fields | `server/providers/quotaState.ts` |
| The Open-Meteo history serving preview consumes retained aggregates locally and remains sample-only; it is not an automatic production history API | `server/providers/climate/openMeteoHistoryServing.ts` |

TDD evidence: the new rendered-privacy case failed on missing Geoapify disclosure before the copy correction. Afterward, `node --import tsx --test tests/operations/policies.test.ts` passed **5/5**, with zero failures or skips. This checks the served draft text and existing route/rendering boundaries; it does not verify hosted privacy, provider terms or public URLs. No network requests, source activation or deployment occurred. The integration owner retains the full-suite/build checks.

## Optional history acquisition disclosure — 17 October 2026

After integration of the local history implementation (`c61165a`), the draft also distinguishes operator acquisition from read-only runtime lookup. The [history handoff](API-HISTORY-COMPLETION.md) and actual `apiHistoryPlan.ts`, `apiHistoryJobs.ts`, `apiHistoryStore.ts`, `apiHistoryProvider.ts` and `apiHistoryConfiguration.ts` were inspected. The optional path remains disabled without configuration/authority; this correction does not supply source admission or authorize acquisition.

- An explicitly approved operator acquisition sends canonical grid-cell coordinates and date ranges to Open-Meteo for hourly ERA5 cloud data. Runtime lookup reads completed validated summaries without fetching, queuing or rebuilding.
- Durable summaries contain the original `requestedPoint`, cell/time-zone mapping, historical statistics and provenance. Summary receipts and execution journals retain request URLs containing grid coordinates/date ranges, raw-response hashes and retrieval timestamps. Journals also record execution/status and reserved credits. These records contain location evidence even though the separate provider quota ledger does not.
- Raw response bodies are bounded transient acquisition inputs. Summary/journal storage has finite capacity and no automatic eviction or deletion; a full store stops acquisition. Operator retention/maintenance and actual backup/hosting settings remain unresolved release facts. No immediate deletion, automatic expiry or full-baseline availability is promised.

The added rendered-privacy regression first failed against the previous draft; after correction the focused policy suite passed **6/6**, zero failures/skips. Existing root edits and all identity, support-retention and legal-review gates were retained. No live calls or commits were made by this correction.
