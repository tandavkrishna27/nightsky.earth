# ChatGPT release: provider rights and public-page alignment

**Reviewed 19 October 2026.** This is a source-and-product release check, not provider activation, legal certification, a new request allowance, or submission. ChatGPT is the first client. Claude, Gemini and Grok have separate later acceptance. The V1 service remains API/search based, with no product database, bulk OSM build, or required historical download.

## Provider-by-provider decision

| Source | ChatGPT V1 decision | Evidence and condition before enabling or claiming it |
| --- | --- | --- |
| Astronomy Engine (local) | Keep enabled | MIT-licensed calculations are already the primary Sun, Moon, planet and Milky Way geometry. Keep the calculation credit and geometric-horizon limits. |
| Geoapify / OpenStreetMap | Keep enabled | Production Hyderabad resolution passed. The Free plan permits application use, but [Geoapify terms](https://www.geoapify.com/terms-and-conditions/) require both visible Geoapify and OpenStreetMap credit. Candidate records do not establish access or darkness. Preserve the existing account ledger. |
| MET Norway Locationforecast | Keep enabled | Production forecast request passed with partial fields. [MET documentation](https://api.met.no/weatherapi/locationforecast/2.0/documentation) requires an identifying User-Agent; preserve source credit, four-decimal coordinate limit and expiry/cache behavior. No key is needed. |
| DarkSkySites Free zenith | Keep enabled | Production city-point result passed. [API terms](https://www.darkskysites.com/api-terms) allow ordinary commercial/noncommercial application use and reasonable cache; the Free project limit is 30,000 accepted requests/month and 10/s unless the dashboard assigns another limit. Show linked “DarkSkySites.com” adjacent to each derived value; a general credits page alone is insufficient. Do not bulk-harvest or call the values live measurements. Keep its dedicated ledger. The provider's pages have shown conflicting marketing counts; account allowance and terms govern. |
| NOAA SWPC | Keep as a bounded feature, verify hosted output | The public global aurora grid does not require a user key. Preserve time, grid resolution, NOAA credit and the distinction between a model grid and local visible aurora. The current production source check did not exercise it. |
| WeatherAPI.com Free | Next admission candidate | [Pricing](https://www.weatherapi.com/pricing.aspx) shows a free three-day hourly forecast and 100,000 calls/month; [terms](https://www.weatherapi.com/terms.aspx) permit application use but require Free-user credit by name or logo and bound forecast caching to 24 hours. The owner confirmed the dashboard displayed **Free** on 20 October 2026, superseding the earlier trial observation. Verify the selected Free fields during bounded production acceptance. |
| OpenWeather Free forecast | Conditional, after public credit work | Use only the implemented free five-day/three-hour forecast endpoint, never paid One Call. [OpenWeather FAQ](https://openweathermap.org/faq) requires visible text, hyperlink and logo for applicable Free plans; its [licence explainer](https://openweathermap.org/storage/app/media/documents/License_explainer_25_Feb_25.pdf) describes open-licence/share-alike obligations. Review the exact subscribed product licence and expose the required alteration-method/derivative notice before admitting this source. The existing operator key is not an activation grant. |
| Public Universe | Conditional enrichment | Its [API guide](https://sol.wickedsick.com/index.php/api) says no key/signup, with roughly 60 requests/minute and 1,000/day/IP. Its [source page](https://sol.wickedsick.com/index.php/about) says per-record original-source attribution and reuse terms still apply. Admit only screened feature/record classes with complete credits and a dedicated preserved ledger. Do not treat the open API or backend code licence as blanket permission for every upstream record. |
| GeoNames | Optional, off | Account signup was not completed. Do not use a demo account in production; Geoapify supplies the V1 resolution path. |
| 7Timer | Optional, off | An adapter exists, but final use/credit, reliable transport and source-meaning acceptance are unresolved. It returns categorical forecast bands, not measured cloud or seeing percentages. |
| Dark Sky Planner | Optional, off | A JSON endpoint is publicly described, but application reuse and request allowance are not yet established for our hosted use. Local Moon/darkness calculations already cover the essential V1 role. |
| AstronomyAPI | Optional, off | A free account and key pair exist, but the public [getting-started guide](https://docs.astronomyapi.com/) does not establish a numeric ongoing free allowance for this account. Confirm entitlement and terms before admission. |
| NASA DONKI | Optional, off | [NASA API documentation](https://api.nasa.gov/assets/html/authentication.html) gives a default shared-key limit of 1,000/hour, subject to service-specific limits. Retained NightSky requests returned 503; validate a successful relevant event response first. This is research context, not a substitute for NOAA operational aurora guidance. |
| JPL Horizons | Optional, off | [JPL's Horizons manual](https://ssd.jpl.nasa.gov/horizons/manual.html) provides public API access; NightSky's selected ephemeris diagnostic did not yield an accepted table. Keep identity lookup and observer positions separate until the latter works and fair-use limits are accepted. |
| Open-Meteo/ERA5 history | Deferred from V1 | Owner chose API/search-only V1 without bulk historical preparation. Do not imply a complete climate baseline or request-time future forecast from retained test samples. |
| Light-pollution browser extraction | Off | No source rights/operational admission for scraping. DarkSkySites supplies the admitted point estimate path. |

**Activation rule:** “Implemented” means an adapter can run, not that a key, allowance, rights, credits, live capability, and state migration have all passed. The production profile currently selects Geoapify, MET Norway and DarkSkySites. Adding a source requires a reviewed environment change, preserved quota-state ownership, rendered-credit check, bounded live acceptance and explicit production promotion. A failed optional source must leave the core plan usable.

## ChatGPT age and publication rule

The [OpenAI plugin guidelines](https://developers.openai.com/plugins/plugin-guidelines) require public plugins to be suitable for ages 13–17; they say mature 18+ plugin experiences are not yet supported. NightSky's ordinary astronomy/outing content should therefore remain general-audience, 13+ for ChatGPT, with the assistant platform's parental-consent and account rules applying. Claude's consumer service is [18+](https://www.anthropic.com/transparency/voluntary-commitments/security%26privacy), but that is a later client-specific access requirement, not a reason to mark the entire ChatGPT plugin 18+. Do not claim NightSky performs age verification.

## Live website mismatch found

The public site currently has `/privacy`, `/terms`, `/get-started` and `/sources`; `/support` returned 404 in a direct HTTPS check. Its privacy page says Hetzner is still “before it launches,” describes Geoapify as conditional, omits the active DarkSkySites source, and states the whole product is 18+. These statements no longer match the production service or ChatGPT review rules. The get-started page advertises ChatGPT, Claude, Gemini and Grok, with installation buttons disabled; keep ChatGPT-first publication status explicit. The website source has an existing `/contact` page and route: use that as the support destination after published HTTPS verification. Preserve other active website edits when correcting these statements.

Before ChatGPT submission, publish and verify:

1. A stable HTTPS `/contact` support URL with the monitored support email.
2. Privacy copy naming the actual operator, categories of data sent to enabled providers, precise host/log/cache/ledger behavior, retention limits and user controls. State the current production source set; separate optional future sources. Remove “before launch” after checking actual host configuration.
3. Terms and privacy age wording compatible with a general-audience ChatGPT plugin, plus platform-specific account conditions. Keep solar-viewing and access/safety guidance.
4. A source/coverage page and answer/card credits that satisfy provider-specific **adjacent** attribution; the page is useful context, not a replacement for required adjacent credit.
5. Installation copy that distinguishes a private test from a published listing; enable a ChatGPT install button only when its real approved destination exists.

OpenAI [submission requirements](https://developers.openai.com/plugins/deploy/submission) call for public website, support, privacy and terms HTTPS URLs for remote MCP review. Its [submission-errors guide](https://developers.openai.com/plugins/deploy/submission-errors) also lists verified publisher identity, tool scan, domain challenge, demo, five positive and three negative cases, and skill safety scans. The existing rehearsal ZIP and a working endpoint alone are insufficient.

## Secrets and production configuration

GitHub already holds a protected production environment secret named `NIGHTSKY_PRODUCTION_ENV`, containing the complete server environment. There is **no need to create one GitHub secret per API**. Edit that existing secret only when an admission is ready, through GitHub's protected production environment; never paste values into chat, the repository, a ZIP, or client code. The deployment SSH secret is separate and already configured.

| Admission | Exact environment entries inside `NIGHTSKY_PRODUCTION_ENV` | Other state |
| --- | --- | --- |
| Current Geoapify/MET/DarkSkySites | `NIGHTSKY_GEOAPIFY_API_KEY`, `MET_NORWAY_USER_AGENT`, `NIGHTSKY_DARKSKYSITES_API_KEY`; existing selected/admitted and quota-path entries | Keep both existing quota checkpoints; never reset them. |
| WeatherAPI after Free check | `NIGHTSKY_WEATHERAPI_KEY`; set `NIGHTSKY_WEATHER_PROVIDERS` and `NIGHTSKY_WEATHER_ADMITTED_PROVIDERS` to include `weatherapi` while retaining `met` | Migrate/verify the existing general-ledger policy and usage first. |
| OpenWeather after licence/credit work | `NIGHTSKY_OPENWEATHER_KEY`; add `openweather` to the same two weather lists | Same general ledger; verify logo/link and alteration-method offer on the actual client surface. |
| Public Universe after rights screening | Add `publicuniverse` to `NIGHTSKY_SKY_PROVIDERS` and `NIGHTSKY_SKY_ADMITTED_PROVIDERS`; set `NIGHTSKY_PUBLICUNIVERSE_QUOTA_STATE_PATH` | No API key. Dedicated existing/imported ledger and selected-record rights required. |
| Later AstronomyAPI/NASA | `NIGHTSKY_ASTRONOMY_API_APP_ID`, `NIGHTSKY_ASTRONOMY_API_APP_SECRET`, `NIGHTSKY_NASA_API_KEY` only after admission | Separate sky source selection/admission and quota-state path; none needed for ChatGPT launch now. |

Changing `NIGHTSKY_PRODUCTION_ENV` does not mutate the running container automatically. Use the reviewed immutable-image, staging and protected production promotion flow. No new provider or paid endpoint was activated by this document.
