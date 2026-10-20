# Quota-aware provider rollout

Owner: NightSky.earth. Decision date: 20 October 2026.

## User-facing rule

Use one useful weather forecast by default. The ordered registry tries MET Norway first, then one fallback if it has no usable sample for the requested place and window. `forecastMode: compare` requests the first two enabled sources; `forecastMode: all` requests all enabled sources. A place/date comparison still uses one source per option unless the user also asks for independent weather forecasts. Retain exact source, issue and valid times; never turn sparse samples into a clear interval. Reuse earlier evidence rather than refetching it for a follow-up.

The server selects sources, not the language model alone. Disabled or unqueried sources are not presented as failed or lacking coverage. The default path may spend two requests if the first result is unusable. A stalled primary can consume the collection deadline without reaching a fallback; report its actual outcome. Provider reservations and caps remain independent of this routing decision.

## Release gates

Routine Sun, Moon, planet, twilight and supported event calculations use local Astronomy Engine and retained event evidence, so they spend no external sky-provider quota. Geoapify resolves the named point; DarkSkySites supplies modelled sky brightness. Forecasts are a separate evidence class. An external sky catalogue is called for a selected object/detail or unsupported calculation, not merely because a plan was opened.

| Request need | First source | Independent/extra source only when useful |
| --- | --- | --- |
| Current night weather | MET Norway | WeatherAPI when MET lacks a usable sample; an explicit comparison asks for both. OpenWeather joins only after its own release gate. |
| Modelled darkness at a point | DarkSkySites | No second darkness service is currently admitted; weather and astronomical darkness cannot substitute for light pollution. |
| Supported Sun/Moon/planet direction and event geometry | Local Astronomy Engine and retained reviewed event records | AstronomyAPI positions or another external ephemeris only for a distinct supported question and after admission. |
| Catalogue object identity, selected observing window or richer reference detail | Existing local/reviewed catalogue where it covers the request | Public Universe starter records after its separate quota, identity and rights gates. Do not merge unrelated catalogue IDs. |
| Space-weather event context | Existing NOAA outlook for local aurora context | NASA DONKI for its distinct event reports after endpoint recovery; a DONKI event is not a local visibility prediction. |

| Lane | Distinct purpose | Current gate before public activation |
| --- | --- | --- |
| OpenWeather five-day forecast | Longer three-hour weather horizon after MET/WeatherAPI coverage | Free endpoint entitlement and private key exist; verify the applicable visible attribution/logo and method presentation, exact account quota state, production composition, bounded live acceptance, and website disclosure. Keep the adapter's zero-response-cache rule. Do not enable it merely by finding a GitHub secret. |
| Public Universe | Optional catalogue identity, selected details and observing windows | Preserve independent reference IDs and source notices. Set a dedicated production quota ledger, confirm public-IP allowance and compatible terms, wire production admission, then run bounded exact-identity acceptance. Do not make it the default planning dependency. |
| NASA DONKI | Distinct space-weather event context | Previous bounded check returned 503. Keep ordinary astronomy calculations and NOAA outlook independent. Recheck endpoint availability, quota and product relevance in a separately bounded test before activation. |
| AstronomyAPI | Optional external object search/position capabilities | Native free allowance is not verified by the dashboard; a third-party RapidAPI cap is not proof of native entitlement. Keep off until a documented/account-supported budget and bounded acceptance exist. The application ID and secret are separate server credentials. |

## Verification and deployment order

1. Review and test the routing contract offline, including default, fallback, explicit compare/all, deadline, direct MCP tool and composed plans. Run the complete repository suite in an environment that permits loopback sockets and temporary fixtures.
2. Package the plugin and inspect its user-facing skill and tool descriptions. Run a synthetic native conversation to verify that default planning calls one source and explicit comparison asks for two.
3. Publish a verified ARM64 image, promote to protected staging, check health and synthetic behavior, then request protected production promotion. GitHub environment reviews remain required. Verify the production image digest and runtime behavior without spending provider requests.
4. Admit additional providers as separate changes, one at a time, after their tabled gates. Use a fresh, finite owner-approved live request allowance for each provider. Update the website Sources page only after activation and verify the published copy.

No historical downloads, map scraping, paid endpoints or provider requests are part of this routing change.
