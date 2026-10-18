# NightSky source, attribution and content-rights register

Reviewed 18 October 2026 against the website sources and the separate MCP worktree's operational/source documentation. This register records reviewed facts and owner decisions; it is not legal advice, a blanket permission grant, or proof that a conditional provider is enabled in production. No plugin/MCP runtime, configuration, account or deployment files were changed.

## Hosting, audience and data handling

- The owner operates NightSky.earth as Tandav Krishna (TK), based in Hyderabad, Telangana, India, and confirmed an 18+ audience.
- Netlify hosts the website and its news function. Its account plan and all account-level logging/retention settings are not confirmed here.
- The owner selected Hetzner Cloud in Helsinki for the MCP service. It is not deployed there yet. The adopted deployment policy is to collect only route, status and elapsed-time service logs, excluding request bodies, queries, exact coordinates and client IP addresses; rotate and delete these logs within seven days; use no analytics product; and use Hetzner's native daily backups only after the operator verifies the product, scope, access and restore procedure. The policy is not applied or verified on a live host.
- NightSky has no login and does not persist prompts, user locations, conversation history or request records. The MCP service uses bounded in-memory abuse-prevention counters and provider caches. A persistent provider quota ledger and operator-prepared offline research artifacts exist in the reviewed MCP documentation; neither is user conversation history. Offline artifacts can contain place/date coverage metadata and need restricted access and documented retention.
- Website calendar preferences are stored in the visitor's browser. The reviewed site code contains no third-party analytics or advertising tracker. Google Fonts connects the visitor's browser to Google. Netlify may process technical/network and function-log records; its dashboard makes function logs available for up to seven days depending on plan, which is not itself a deletion-period promise.
- The public Privacy Policy should be checked against live Hetzner, Netlify, email and enabled-provider behavior before enabling the MCP endpoint. The website policy and terms state 18+ and are effective 18 October 2026.

## Website sources

| Source | Use and rights evidence | Launch disposition |
|---|---|---|
| Astronomy Engine | Local Sun, Moon, planet, twilight and supported-event calculations; MIT license. | Preserve copyright and license notice; does not license unrelated catalogs or datasets. |
| GeoNames | Named-place/time-zone reference. GeoNames identifies its data as CC BY and requires credit/link; data is provided as-is. | Attribute the exact dataset/service used. Do not imply a complete observing-site catalog. |
| Geoapify | Conditional bounded place-candidate API. Its Free terms require Geoapify credit and OpenStreetMap attribution. | Use only if the deployed request path and region are confirmed and both credits are displayed. No retained OSM candidate index is included. |
| MET Norway Locationforecast | Conditional weather API under CC BY 4.0. Requires attribution, license link/change indication, identifying User-Agent and traffic/caching controls; provider logs may include IP and coordinates. | Enable only with the provider request proxied through the service, configured User-Agent, correct credit and privacy disclosure. |
| NOAA SWPC OVATION | Short-horizon aurora model, not a personal sighting probability. | Keep source/product, forecast timestamp and disclaimer visible; verify endpoint and activation. |
| WeatherAPI | Current terms allow app/service use with required credit and conspicuous weather/safety disclaimer; cache, quota and feature access depend on plan. | Conditional on the account actually transitioning to Free and verifying its quota, attribution and cache behavior. Do not describe the Business trial as Free before confirming the account. |
| OpenWeather | Exact Free-product terms include attribution and open-license/share-alike conditions that depend on product and use. | Disabled for public source coverage until exact product, license obligations and compliant attribution are approved. Free access alone does not resolve rights. |
| 7Timer! ASTRO | Official project wiki says its data may be used in software whether free or paid. | Conditional integration may be used with source acknowledgement; preserve categories/ranges and documented forecast scope. Corrected earlier stale noncommercial-only summary. |
| Copernicus ERA5 | Historical reanalysis under CC BY 4.0 with Copernicus/ECMWF/C3S attribution. The MCP flow uses locally prepared artifacts, not a live Open-Meteo request. | Label only as historical context; retain source attribution, artifact provenance and coverage limits when enabled. |
| NASA MEO reports 2025–2027 | Specific annual reports provide the maxima used in the calendar; public-use notices and table attribution are report-specific. | Eight night-capable maxima for 2026–2027 are shown with source/year and minute-precision notes; no season width or local visibility is inferred. |
| Global Meteor Network radiant-fit paper | The cited author-deposited arXiv version states CC BY 4.0. | Preserve authors, cited version, license and modifications; use only within stated fit domain. |
| AstroPixels almanacs | Permission to reproduce almanac data requires the exact credit: “Sky Event Almanac Courtesy of Fred Espenak www.AstroPixels.com”. | Exact credit appears with Sky Events; do not copy site text, images or design. |
| IGN meteor-shower guidance | Legal notice governs reuse; linking is distinct from reproducing text or graphics. | Link only; keep NightSky summaries original absent permission. |
| Spaceflight News API | API provides article metadata/links; its FAQ says data may be used, but this does not grant rights to publisher text or imagery. | Show limited metadata and outbound links only. Do not add article text, summaries or images without publisher rights. |
| Google Fonts (Playfair Display, Inter) | Website requests Google-hosted font files; font families have their own licenses and Google processes the browser request. | Disclose Google Fonts in Privacy; retain exact family/version notices if self-hosted. |
| Website photos and splash video | Owner confirmed on 18 October 2026 that existing images/video are generated or owner-created. | Provenance confirmation recorded; delivery optimization is a separate performance task. |
| OpenStreetMap candidate index | The owner explicitly dropped the retained regional OSM candidate index from launch. Geoapify, if enabled, is a separate API use that still requires OSM attribution under its Free terms. | No regional index shipped or claimed. Reconsider only through a separate rights review; do not imply broad OSM-derived database coverage. |

## MCP sources and integrations screened

This table records sources in the separate MCP source register. It does not establish that a provider switch is enabled on the future Hetzner host.

| Source | Evidence and conditions | Disposition |
|---|---|---|
| GeoNames `cities500` | CC BY; exact extract date/hash and credit are required. | Use only with provenance and attribution. |
| IANA tzdb and Node/ICU | Public-domain timezone rules with Node/ICU third-party notices; GeoNames timezone labels retain GeoNames terms. | Retain runtime notices and version evidence. |
| OSM-derived observing candidates | ODbL attribution/share-alike obligations depend on transformation/distribution. | Dropped for launch by owner; no public candidate index. |
| Astronomy Engine 2.1.19 | MIT. | Preserve notice; review catalogs separately. |
| NOAA SWPC OVATION | Product-specific model, timestamp and attribution/disclaimer. | Verify active endpoint, freshness and output credit at deployment. |
| NASA MEO maxima | Year-specific reports and table-level evidence. | Preserve source/version, attribution and precision notes. |
| Egal et al. activity reference | A&A paper recorded as CC BY 4.0. | Preserve DOI/authors/license; respect scope. |
| GMN radiant fits, arXiv 2205.15423v1 | Cited author-deposited version CC BY 4.0. | Preserve version and attribution; do not convert fit bounds to activity dates. |
| MET Norway | CC BY 4.0, credit, identifying User-Agent, coordinate precision, caching and traffic controls. | Verify proxy, request path, enabled status and privacy disclosure. |
| WeatherAPI | Free access requires credit and user safety disclaimer; plan controls quota and caching. | Recheck the actual account after its scheduled Free transition before enablement. |
| OpenWeather | Product-specific attribution and share-alike conditions. | Disabled pending exact Free-product rights and implementation review. |
| 7Timer! | Current project wiki permits use in free or paid software. | Can be conditionally enabled with acknowledgement and output-scope limits. |
| Geoapify | Free plan requires Geoapify credit and OSM attribution. | Conditional on both credits, endpoint/region and privacy flow being verified. |
| NOAA/NWS forecast, alerts and observations | Separate US-only services with product-specific terms and disclaimers. | No generic NOAA rights or enabled use inferred; verify each product/switch. |
| Copernicus ERA5 / locally prepared summaries | CC BY 4.0; acquisition and artifact provenance/retention are separate from runtime requests. | Historical context only; no live forecast or Open-Meteo request claim. |
| NASA Black Marble VIIRS | Product-version, quality-mask and calibration review still required; ground radiance is not astronomical sky brightness, SQM or Bortle. | Excluded from product claims until specific review is complete. |
| International Dark-Sky Places directory | Website access does not grant bulk reuse. | Link-only absent permission. |
| Falchi World Atlas | CC BY-NC 4.0. | Excluded from product/commercial reuse absent a separate grant. |
| DarkSkySites API | Provider attribution, data-quality and plan constraints. | Verify exact terms, freshness and enabled configuration before launch. |
| AMS/IMO calendars | No blanket reproduction permission established. | Link-only or obtain permission; AMS-derived calendar dates have been removed. |
| Public Universe, NASA DONKI, JPL, AstronomyAPI and Dark Sky Planner | Mention in research is not proof of integration or permission. | No production use inferred; review exact API, rights, terms and switches first. |
| Historical operator-prepared datasets | May contain location/date coverage cells, source URLs and preparation records, not user request history. | Keep preparation disabled by default; restrict access, hash reviewed artifacts and define retention before use. |

## Release record

- Owner-confirmed launch decisions on 18 October 2026: OSM candidate index excluded; Hetzner Helsinki selected for the future MCP service; 18+ audience; free plans only; minimal content-free service logs with seven-day maximum retention; no analytics product planned for MCP.
- Website meteor-calendar remediation is complete: AMS-derived dates removed, NASA MEO year-specific maxima retained with precision notes, and AstroPixels data used with required credit.
- Source inventory, hosting facts, rights screening and policy draft were reviewed and approved by the owner on 18 October 2026 for the website release build. Hosting approval records the selected provider/region and disclosed status; it does not certify live server controls.
- Before enabling the MCP endpoint, configure and verify Hetzner product/region, DNS/TLS, firewall, proxy, service log redaction/rotation, backups, access controls, provider switches, attribution and a restore test. Reconcile the plugin's separate 13+ draft with the owner-approved 18+ audience before publishing the plugin.
- Recheck the Netlify production plan/domain/logging and support mailbox settings before launch. This website release build does not prove those account-level settings or the future MCP service are live.

## Primary evidence links

- [GeoNames data and service terms](https://www.geonames.org/export/)
- [Geoapify terms](https://www.geoapify.com/terms-and-conditions/)
- [MET Norway Terms of Service](https://api.met.no/doc/TermsOfService), [license](https://api.met.no/doc/License)
- [WeatherAPI terms](https://www.weatherapi.com/terms.aspx), [attribution guide](https://www.weatherapi.com/docs/attribution/), [pricing](https://www.weatherapi.com/pricing.aspx)
- [OpenWeather license explainer](https://openweathermap.org/storage/app/media/documents/License_explainer_25%20Feb_25.pdf)
- [7Timer! current usage guidance](https://github.com/Yeqzids/7timer-issues/wiki/Wiki#usage)
- [Copernicus ERA5](https://cds.climate.copernicus.eu/datasets/reanalysis-era5-single-levels)
- [Astronomy Engine repository/license](https://github.com/cosinekitty/astronomy)
- [NASA MEO reports: 2025](https://ntrs.nasa.gov/citations/20240012381), [2026](https://ntrs.nasa.gov/citations/20250009524), [2027](https://ntrs.nasa.gov/citations/20260009360)
- [GMN radiant-model paper, cited v1](https://arxiv.org/html/2205.15423v1)
- [NOAA SWPC OVATION product](https://www.swpc.noaa.gov/products/aurora-30-minute-forecast)
- [AstroPixels almanacs and reproduction permission](https://www.astropixels.com/almanac/almanac.html)
- [IGN legal notice](https://www.ign.es/web/es/ign/portal/info-aviso-legal)
- [Spaceflight News API FAQ](https://github.com/TheSpaceDevs/Tutorials/blob/main/faqs/faq_TSD.md)
- [Netlify function log documentation](https://docs.netlify.com/manage/monitoring/logs/)
- [Hetzner server overview](https://docs.hetzner.com/cloud/servers/overview/), [backup FAQ](https://docs.hetzner.com/cloud/servers/backups-snapshots/faq/)
