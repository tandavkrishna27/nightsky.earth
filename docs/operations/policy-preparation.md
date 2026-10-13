# Policy and support preparation — 13 October 2026

Local implementation only. Draft routes `/privacy`, `/terms` and `/support` are ready for owner review. They are not published, approved legal advice or a compliance certification. The owner confirmed an individual publisher based in India and the monitored support mailbox `nightsky.earth2026@gmail.com`; the verified legal name remains a deployment/publication gate.

Shared policy copy lives in `shared/nightsky/policies.ts`. Three pages use the existing background/foreground, serif heading, spacing and link styles. Policy paths return from App before the experience overlay, background music and mute controls mount. The standalone pages link to each other and home; the existing footer gained the three policy/support links and now uses the confirmed monitored support address nightsky.earth2026@gmail.com. The support page offers a genuine mailto link and no pretend submitted-message form. Existing Contact and its legacy form remain separate and unchanged; their public-release review is still needed.

## Confirmed implementation facts

| Area | Draft disclosure and source |
|---|---|
| Planning | Named destination/time/activity/optional target/gear are processed; no NightSky account, payment or query-history database. MCP route is stateless; bounded process caches/counters are distinct from user history. |
| Host location | `server/mcp/metadata.ts` reads only explicitly consented `openai/userLocation` latitude/longitude and rounds to two decimals. Untrusted hints are context, not identity or authorization. |
| Subject/IP traffic control | `metadata.ts` retains process-salted subject digests; `route.ts` also retains bounded IP-address counters and a global counter. Raw subject is not retained in subject counters. Expired keys can remain while idle, so no exact deletion SLA is claimed. |
| Sources | Local GeoNames, optional OSM and ERA5 artifacts. MET receives rounded resolved-destination coordinates (up to four decimals) for forecast requests; NOAA fetch is a global grid without a destination parameter. Source visits and assistant-platform storage remain subject to those providers' policies. |
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
