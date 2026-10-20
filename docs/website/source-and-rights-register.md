# NightSky source, attribution and content-rights register

Reviewed 20 October 2026 against the current website and the owner-provided production profile. This register records reviewed product facts and attribution conditions; it is not legal advice or a blanket permission grant. It does not make researched adapters active. No MCP runtime, provider configuration, credentials, account, or deployment files are changed by this website work.

## Current operator, hosting, audience and retention

- NightSky.earth is operated by Tandav Krishna (TK), based in Hyderabad, Telangana, India. The website's astronomy-planning content is for general audiences aged 13 and older, subject to each AI platform's own age and use requirements.
- Netlify hosts the website and its news function. The account plan and account-level logging/retention settings remain unverified.
- Hetzner Cloud in Helsinki hosts the deployed MCP service. Production nginx access logging is off and its error log is discarded. Docker logs are size-limited, so their age varies. Journald has no configured age limit. Automatic Hetzner backups are off and there are no server snapshots. Do not claim a fixed host-log deletion period.
- The connected service does not persist prompts, user locations, conversation history or request records. It has bounded in-memory caches and a persistent provider-quota ledger for usage buckets. This is not a user conversation history.
- The operator intends to delete support messages 90 days after the last reply. A daily review process and first deletion sweep have not been verified, so the public Privacy Policy makes no fixed support-email deletion promise.
- The Privacy Policy and Terms are effective 20 October 2026. Optional website Google Analytics 4 loads after consent; its collection and retention details remain described on the Privacy Policy page.

## Active production sources

| Source | Current use and rights/attribution notes |
|---|---|
| Astronomy Engine | Local astronomy calculations including supported positions and event geometry. MIT-licensed library; preserve its copyright and license notice. The library license does not cover unrelated catalogs or datasets. |
| Geoapify with OpenStreetMap data | Active place lookup and bounded candidate discovery. Show required Geoapify and OpenStreetMap credits with relevant results. A candidate does not establish access, safety or sky quality. No retained regional OSM candidate index is shipped. |
| MET Norway Locationforecast | Active production weather forecast. Follow its attribution, CC BY 4.0, identifying User-Agent, caching and traffic conditions; preserve the forecast's source and time context. |
| DarkSkySites.com | Active point-specific modeled zenith-brightness and Bortle estimates. These are not live measurements or access assessments; keep linked provider credit with returned values. |
| Spaceflight News API | Website news search returns article metadata and outbound links. Article text, summaries and images are not copied pending rights review. |
| NASA MEO meteor reports, Global Meteor Network radiant fits, AstroPixels and other event references | Used only within the specific dataset, year and coverage described in the public Sources & Coverage page and event entries. Preserve source/version, attribution, license and modification/precision notices. AstroPixels reproduction uses its required exact credit. |

## Weather integrations that are not active

The website displays no OpenWeather or WeatherAPI forecast. The current production forecast source is MET Norway. API adapters or documentation in a repository do not by themselves establish production activation.

| Source | Current status and conditions before any future display |
|---|---|
| OpenWeather 5-day / 3-hour Forecast API | Researched and inactive in production; no OpenWeather forecast is shown on the website. The public `public/openweather-normalization-method.json` is a machine-readable description of the normalization method for `https://api.openweathermap.org/data/2.5/forecast`. It contains no API key or forecast response. The file documents an ODbL 1.0 offer for the adapted sample component; this is distinct from OpenWeather's own product terms and is not evidence that the provider's data is currently used. Before displaying Free-plan OpenWeather data, confirm the exact product/license and show the required linked text “Weather data provided by OpenWeather” and an official, unmodified OpenWeather logo visibly beside the weather data. The Sources page alone would not satisfy an adjacent in-product credit. |
| WeatherAPI.com | Active production forecast source; no WeatherAPI forecast is shown on the website. Its current API terms require credit by name or logo for Free API data and a clear, conspicuous end-user safety disclaimer wherever its data is displayed. Do not add that forecast notice to pages that do not show its data. |
| NOAA SWPC OVATION | Researched and inactive as a NightSky forecast source. Its product is a short-term aurora outlook, not a personal sighting probability. If integrated later, identify source and forecast time and explain that limitation. |
| 7Timer! ASTRO, GeoNames and other researched adapters | Not part of the current production profile. Review the exact product, terms, rights, data flow, attribution and source-specific coverage before activation. |

## Website and event content rights

- Website photographs and the splash video are generated or owner-created, as confirmed by the owner.
- Copernicus ERA5-derived summaries are operator-prepared historical context, not live weather or a forecast. Keep provenance, attribution, and the boundaries of the source material with any enabled output.
- NASA meteor maxima, Global Meteor Network radiant fits, and AstroPixels almanac values are used only within their cited versions, periods and coverage; do not imply full activity seasons or local visibility where the source supports only a peak or model fit.
- International Dark-Sky Places, IGN guidance and other linked resources are link-only unless a separate reuse permission or applicable license is documented. A website link does not grant rights to copy data, text, graphics or imagery.
- Google Fonts and optional consent-gated Google Analytics are disclosed on the Privacy Policy page. This website register does not claim any MCP analytics product.

## Primary evidence and review links

- [OpenWeather API FAQ and attribution guidance](https://openweathermap.org/faq#license)
- [OpenWeather 5-day forecast documentation](https://openweathermap.org/api/forecast5)
- [Open Data Commons ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/)
- [WeatherAPI current API terms](https://www.weatherapi.com/terms)
- [WeatherAPI attribution guide](https://www.weatherapi.com/docs/attribution/)
- [MET Norway Terms of Service](https://api.met.no/doc/TermsOfService) and [license](https://api.met.no/doc/License)
- [Geoapify terms](https://www.geoapify.com/terms-and-conditions/)
- [Astronomy Engine repository and license](https://github.com/cosinekitty/astronomy)
- [NASA MEO report archive](https://ntrs.nasa.gov/)
- [Global Meteor Network radiant-model paper](https://arxiv.org/html/2205.15423v1)
- [AstroPixels almanacs and reproduction permission](https://www.astropixels.com/almanac/almanac.html)
- [Netlify function-log documentation](https://docs.netlify.com/manage/monitoring/logs/)

## Open items before a future provider activation

- Keep OpenWeather listed as inactive until its production switch, account status and live outputs are independently checked. WeatherAPI.com is active in production and its weather notice must accompany returned forecast data.
- Before any OpenWeather forecast is displayed, recheck the exact plan/product terms and obtain the official logo from OpenWeather's own asset source, then verify its unmodified appearance and the required linked attribution next to the data.
- Before any WeatherAPI forecast is displayed, add its current required provider credit and full end-user weather/safety disclaimer beside the forecast and recheck current terms and plan limits.
- Keep a support-email deletion schedule out of policy text until the owner verifies the daily handling process and completes its first sweep.
