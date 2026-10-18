# Website source and coverage evidence

Reviewed on 18 October 2026 for the Sources & Coverage website page. This is an implementation inventory, not evidence of a deployed configuration or permission to publish a provider integration.

## Read-only evidence

Plugin source root: `../plugin-v1` relative to this website worktree. Installed NightSky package: `C:/Users/TK/.codex/plugins/cache/nightsky-native-acceptance-20261017/nightsky/1.0.20`. The installed manifest identifies the local rehearsal package; its backend is not bundled with the plugin. No plugin files, provider settings, credentials or release approvals were changed. No provider calls were made during website implementation.

| Website card | Evidence in plugin source | Public copy boundary |
| --- | --- | --- |
| Darkness & the Moon | `server/nightsky/astronomy.ts`; Astronomy Engine 2.1.19 | Local geometric calculations and sampled positions; no terrain, weather or image-quality guarantee. |
| Weather & aurora | `server/providers/weather/metNorway.ts`, `weatherApi.ts`, `openWeather.ts`, `sevenTimer.ts`, `configuration.ts`; `docs/operations/api-live-validation-results-20261017.md` | MET baseline; WeatherAPI, OpenWeather and 7Timer conditional. NOAA OVATION is short-term modeled evidence, not personal sighting probability. Retain source/time/unknown values. |
| Sky events & targets | `server/events/catalog.ts`, `meteorRadiants.ts`, `meteorCivilGuidance.ts`; `docs/operations/sky-continuation-results-20261017.md` | Supported geometry and bounded 2025–2027 NASA meteor maxima; no fake annual recurrence, complete meteor seasons or personal rate. Radiant fits and civil-date guidance stay separate, with attribution links. |
| Places & geography | Source inventory and validation records above; `docs/operations/data-sources.md` | GeoNames city index differs from observing-site coverage. Retained OSM candidates cover parts of South India and Bhutan; conditional Geoapify searches remain bounded. No access/facilities/safety certification. |
| Light pollution | `server/providers/lightPollution/darkSkySites.ts`; `docs/operations/light-pollution-acceptance-20261017.md` | Optional modeled point estimates, not live sky measurements or verified worldwide coverage. Dataset age and quality matter; unverified zero is not pristine darkness. |

The current event implementation takes precedence over older source-inventory prose that described planetary-pair support as absent. Historical retained samples and a quarantined test year do not establish a global climate baseline. Optional provider validations are partial; some were trial-specific or had failed/quarantined paths. They are not marketed as dependable public baseline sources.

The website lists educational source links and implementation limits. `releaseFacts` and existing publication gates remain unchanged. The answer returned for a specific place/date must identify its actual source, time window and missing evidence. The website's static inventory does not assert runtime provider status.

## Independent review

A focused read-only reviewer checked the three page implementations, listing resolver, email selection/history/copy behavior and source distinctions against the audit records. No blocking or actionable findings were reported. The reviewer ran the two listing resolver unit tests; visual and broader browser verification were performed separately by the implementing agent.
