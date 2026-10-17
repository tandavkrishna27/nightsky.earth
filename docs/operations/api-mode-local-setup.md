# API mode: local setup and remaining activation gates

The new mode is explicitly selected with `NIGHTSKY_DISCOVERY_MODE=api`. Omit it to retain existing legacy configuration behavior. `catalogue` and `regional` require their respective explicit pinned manifests. API mode rejects `NIGHTSKY_GEONAMES_INDEX`, OSM and global-catalogue environment configuration; remove those variables from the API process environment, not their files from disk.

## Configuration

| Variable | Purpose |
| --- | --- |
| `NIGHTSKY_DISCOVERY_MODE` | `api` |
| `NIGHTSKY_GEONAMES_USERNAME` | Operator's enabled free GeoNames account, never the public demo username |
| `NIGHTSKY_GEOAPIFY_API_KEY` | Operator's free Geoapify key; server environment only, never source control/chat/reports |
| `NIGHTSKY_LOCATION_USER_AGENT` | Identifying app/contact string; defaults to NightSky.earth and the confirmed support email |
| `MET_NORWAY_USER_AGENT` | Existing independent forecast configuration |

Missing credentials leave the corresponding role unavailable. Do not insert real credentials into operator JSON: each release's optional `discovery` block records mode, provider IDs and nonsecret configuration/policy/budget evidence. API current and rollback releases each need that evidence. Preflight requires a single process for API quota controls. Full API preflight explicitly reports `API_HISTORY_ROUTE_NOT_ADMITTED` until a point-aware historical route is admitted; a legacy history artifact alone cannot satisfy it. Historical capability and its existing release evidence remain independent; API discovery does not make missing historical coverage available.

## Offline validation

`npm run build:plugin` followed by `node scripts/verify-api-runtime.mjs` exercises the compiled API mode with synthetic fetch responses and no local geography variables. It uses loopback MCP traffic only. CI runs this after the production build on Linux and Windows. The ordinary legacy runtime and optional catalogue/history regression tests remain in place.

`tests/mcp/api-discovery-planning.test.ts` covers selected-point planning with synthetic sources. These checks establish software behavior, not live free-tier eligibility, provider coverage, source accuracy or native-client skill loading.

## Before live activation

Follow [provider admission](api-provider-admission.md). Configure accounts privately, confirm exact intended use and attribution, and authorize a bounded live validation matrix. Establish conservative restart-safe quota accounting or an operator-managed verified remaining-budget/reset procedure. In-memory limits alone cannot prove account allowance across process restarts or other applications. Do not claim deployment readiness from offline tests.

History remains governed by [history feasibility](history-api-feasibility.md); do not submit a CDS job automatically. Candidate access, darkness and numerical light-pollution quality remain unknown without separate evidence. Unsupported query combinations must be explained without silently dropping filters.

## Cleanup

Use the [cleanup plan](api-provider-research-and-cleanup-plan.md). This migration does not delete downloaded files, optional builders, credentials, virtual environments or evidence. Confirm API-mode behavior before removing a legacy dependency. Website work and any website database dependencies are separate.

## Account verification — 2026-10-17 (before implementation)

Read-only checks of the owner's signed-in dashboards confirmed:

- Geoapify NightSky project: Free, 3,000 credits/day, existing API key.
- WeatherAPI: account and API key exist; Business trial ends 2026-10-24. Dashboard explicitly says it automatically moves to Free without an upgrade. Implement and validate against Free limits, never trial-only features.
- GeoNames: owner reports signup failure; remains unconfigured. Geoapify fallback is available in code, but account creation alone is not runtime activation.
- CDS: previously configured; no new historical job authorized by this account check.

No credentials are recorded here. This check did not copy credentials into local configuration, call data APIs, change subscriptions, or deploy. At that check, WeatherAPI still needed an adapter. The adapter and restart-safe quotas are now implemented as described below; private configuration and bounded live verification remain pending. Preserve MET Norway as the existing forecast source.

## Multiple weather providers — agreed requirements

Owner requested easy addition of services and created OpenWeather as well (2026-10-17). Signed-in OpenWeather home shows an email-confirmation notice; endpoint entitlement and key activation are not yet verified. No subscription was changed.

The original single-provider WeatherProvider/getForecast interface is preserved. The new collection and runtime configuration support multiple providers and the existing public forecasts array (maximum four); offline verification does not establish live availability.

Implementation requirements:

1. Keep one adapter per service behind WeatherProvider; add a configured registry with stable IDs and capabilities (fields, horizon, cadence, geographic coverage, attribution and free endpoint entitlement).
2. Add bounded concurrent orchestration, at most four enabled providers, independent timeout/cache/quota state per provider and an overall tool deadline. A failed provider must not discard successful sources. Record each attempted source's status, including empty failures.
3. Preserve separate forecast series, source issue/fetch/valid times when supplied, units, accumulation intervals and missing fields. Do not average providers, invent hourly values from three-hour steps, or claim independent models solely because service brands differ.
4. Apply the same orchestration to night conditions and planner/compare paths. Keep primary-provider compatibility; make source selection explicit in answers and never silently replace one series with another.
5. Each new adapter needs documented free-plan endpoints, rights/attribution, private configuration, quota cost, fixtures and failure cases before bounded live validation. Trial access must not establish free entitlement. OpenWeather One Call is a separate pay-per-call product; do not enable it automatically.
6. Required tests: one/two/three sources; partial failure; missing key; quota exhaustion; restart; mixed cadence/horizon; stale/empty/malformed results; secret redaction; attribution; all sources unavailable; identical exact requested coordinates across adapters.

Implemented roster: MET Norway, WeatherAPI (Free-shaped requests), and OpenWeather (Free five-day/three-hour endpoint). OpenWeather Free entitlement was subsequently confirmed in Services; email/key activation and actual live behavior remain unverified. Geoapify is for location discovery, not a weather forecast provider. Other domains should use their own capability-specific adapters rather than forcing all APIs into one weather-shaped interface.

Reference: https://openweathermap.org/price (checked 2026-10-17). No data request, key export or deployment occurred during this architecture check.

## Implemented local multi-weather configuration

The adapter/collection/runtime implementation now exists; live activation remains separate. See `docs/superpowers/plans/2026-10-17-multi-weather-activation.md` and `multi-weather-wave-20261017.md` for evidence and remaining gates.

| Variable | Meaning |
| --- | --- |
| NIGHTSKY_WEATHER_PROVIDERS | Explicit comma-separated subset of met,weatherapi,openweather; omit to preserve legacy MET behavior |
| NIGHTSKY_WEATHER_ADMITTED_PROVIDERS | Explicit subset whose source requirements have been reviewed; a key alone does not activate a new provider |
| NIGHTSKY_WEATHERAPI_KEY | Private WeatherAPI key; never put it in operator JSON or source control |
| NIGHTSKY_OPENWEATHER_KEY | Private OpenWeather key; same restrictions |
| NIGHTSKY_QUOTA_STATE_PATH | Absolute local non-reparse path, shared by API discovery and weather quotas; parent directory must exist |

API discovery now receives deny-all admission if durable quota configuration is missing. Operator preflight requires this path independently of weather selection. Keep credentials in a private server environment; these instructions do not imply keys were copied from browser accounts.

Initial budget creation is deliberately separate: `node --import tsx scripts/initialize-provider-quota.ts` accepts no arguments and requires the private environment path, `NIGHTSKY_QUOTA_VERIFIED_UNUSED_BUDGET=yes`, and nonsecret `NIGHTSKY_QUOTA_VERIFICATION_EVIDENCE`. Use it only after independently verifying all configured account allowances are unused (or the full relevant reset/quiet periods have elapsed). Do not run it automatically at startup or to erase usage. It refuses to overwrite existing state.

This adds a bounded nonsecret quota checkpoint, not a database or downloaded geography catalogue. It stores allowance counters and disable/backoff state; no credentials, queries or weather responses. One server process owns it. Ordinary standalone SIGTERM/SIGINT drains and closes within ten seconds; forced shutdown/crash retains a lock. Windows force-kill is not graceful shutdown. Embedders must call `closeConfiguredNightSkyPluginApp(app)` after closing their listener.

Recovery: verify the previous process is dead before removing only a stale lock; retain checkpoint and initialization marker. Corrupt/lost state or interrupted writes fail closed. Restore verified state or follow a separately reviewed reset procedure; never delete the checkpoint to regain allowance. No recovery/deletion action was executed here.


### Owner-authorized private setup follow-up

On 17 October 2026, the existing Geoapify, WeatherAPI and OpenWeather keys and MET contact string were stored in the owner-only/SYSTEM local file `C:/Users/TK/.nightsky/providers.env`. This is outside Git and does not select/admit providers, initialize quota state or send requests. Use Node 24 `--env-file` to load it into an explicitly approved child process; never print its contents or copy it into reports. The earlier account-verification paragraphs describe the pre-configuration state. The bounded live proposal records the remaining quota, source and execution gates.

Subsequently the owner confirmed these accounts were unused elsewhere. The explicit initializer created `C:/Users/TK/.nightsky/provider-quota.json` successfully and released its lock; owner/SYSTEM permissions were verified. Its path is now in the private environment file. No provider call occurred. Preserve this ledger; do not initialize it again or delete it to reset allowance.
