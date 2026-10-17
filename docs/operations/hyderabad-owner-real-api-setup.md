# Hyderabad owner test: real API setup and bounded proposal

Prepared 17 October 2026. This handoff makes no provider request and reads no private key or quota contents. All previous live allowances are consumed. Existing credentials and the existing durable ledger remain in place. No deployment, download, historical job or model launch is included.


**Execution update:** the owner subsequently approved this exact packet and it completed with four HTTP 200 responses; see [live results](hyderabad-owner-live-results-20261017.md). This supersedes preparation-only authorization statements. The allowance is consumed; the command below is retained as the executed procedure, not permission to rerun it. Existing private quota state was preserved.

## Local configuration

Use the existing Node 24 runtime and compiled standalone `dist/plugin.js`. The private environment file is `C:/Users/TK/.nightsky/providers.env`; it already contains provider credentials, the MET contact and the quota path according to retained setup evidence. Load it only into a future explicitly authorized child with Node's `--env-file`. Do not print, duplicate or commit it. The persistent ledger is `C:/Users/TK/.nightsky/provider-quota.json`; do not run the initializer again, remove its marker, reset counters or remove an active lock. One process owns this ledger.

The following nonsecret settings define the intended local owner session:

| Setting | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `HOST` | `127.0.0.1` |
| `PORT` | `5000` |
| `NIGHTSKY_MCP_ALLOWED_HOSTS` | `127.0.0.1` |
| `NIGHTSKY_MCP_TOOL_MODE` | `full` |
| `NIGHTSKY_DISCOVERY_MODE` | `api` |
| `NIGHTSKY_WEATHER_PROVIDERS` | `met,weatherapi,openweather` |
| `NIGHTSKY_WEATHER_ADMITTED_PROVIDERS` | `weatherapi,openweather` |

Use `http://127.0.0.1:5000/mcp` only with a client that supports this local transport. Remove inherited GeoNames, OSM, global catalogue and legacy climate configuration from that child environment. Leave geometry acceptance/enabling, API history admission/cache and trusted proxies unset. These settings describe a forecast/location session; they do not admit historical coverage or verified park boundaries. Never start an unrestricted real-provider session merely to inspect setup: ordinary runtime quota ceilings are broader than a four-request owner-test allowance.

`npm run build:plugin` and `node scripts/verify-api-runtime.mjs` already provide the offline compiled-runtime rehearsal, with injected synthetic fetch responses and isolated temporary quotas. `node --import tsx scripts/validate-api-live.ts` prints its existing proposal without accessing private configuration or making requests. The general operator preflight addresses production release and host evidence; its incomplete production/history gates do not mean private keys need to be copied again.

## Executed real-provider allowance (retained bounds)

Proposed identifier: `owner-hyderabad-v1-4-1-120-zero-retries`. The executor supports this envelope; the owner-authorized execution is complete and its allowance consumed. Maximum **four HTTPS GET attempts total**, one per provider below, **120 seconds overall**, zero retries, redirects, pagination, replacements or redistributed unused slots. Failed or aborted dispatches count. A new exclusive batch journal must be created beside the existing ledger before dispatch; reserve quota and persist attempts before each request. Stop on quota/persistence failure; abort active requests at the overall deadline. Retain at most 262,144 journal bytes and no raw bodies or numerical weather values.

| Provider | Exact endpoint and request | Attempts | Body cap / timeout |
| --- | --- | --- | --- |
| Geoapify | `https://api.geoapify.com/v1/geocode/search`; `text=Hyderabad, Telangana, India`, `limit=5`, `format=geojson`, private `apiKey` | 1 | 262,144 bytes / 5 s |
| MET Norway | `https://api.met.no/weatherapi/locationforecast/2.0/complete`; selected latitude/longitude rounded with the existing four-decimal helper; configured identifying User-Agent | 1 | 4,194,304 bytes / 8 s |
| WeatherAPI | `https://api.weatherapi.com/v1/forecast.json`; selected `q=latitude,longitude`, `days=3`, `aqi=no`, `alerts=no`, private `key` | 1 | 524,288 bytes / 5 s |
| OpenWeather | `https://api.openweathermap.org/data/2.5/forecast`; selected `lat`, `lon`, `units=metric`, `cnt=40`, private `appid` | 1 | 524,288 bytes / 5 s |

Total accepted decompressed response bytes cannot exceed **5,505,024**. A streaming reader may receive one crossing chunk before cancellation. Use the existing guard's exact host/path/parameter enforcement and bounded concurrent weather collection (maximum two active weather sources). No GeoNames, timezone endpoint, place-details, places, NOAA, CDS or other endpoint is allowed.

Select only one Hyderabad locality with exact case-insensitive name `Hyderabad`, coordinates in latitude 17–18 and longitude 78–79, and verified `Asia/Kolkata` timezone from the same geocode response. Zero or multiple eligible results stop the batch; do not silently choose the first result. Freeze `startUtc` immediately before discovery and `endUtc=startUtc+24h`. Call the shared forecast collection exactly once. MET rounding is explicitly recorded separately from the selected point.

This tests current forecast integration at the public city reference point. It does not identify an outdoor observing site north of Hyderabad or forecast the December Geminids on an October run. For the owner's Geminids request, retain date, direction, access and darkness uncertainty, and report the future night as outside the current forecast horizon. An actual north-of-city point or later forecast refresh requires its own separately bounded request definition; this envelope must not silently substitute a new location or date.

## Implementation and execution gates

The existing `scripts/validate-api-live.ts` executor now supports this fixed packet using the same guard, adapters, quota checker and forecast reporter. Its original default and `--live` behavior remain the three-place packet. Inspect the Hyderabad proposal offline with:

```powershell
node --import tsx scripts/validate-api-live.ts --hyderabad-proposal
```

For the approved execution, the child process was required to set `NIGHTSKY_LIVE_APPROVED_ENVELOPE=owner-hyderabad-v1-4-1-120-zero-retries`, a new `NIGHTSKY_LIVE_BATCH_ID`, `NIGHTSKY_LIVE_GEOAPIFY_ADMITTED=yes`, and the API/weather settings above. Its invocation is `node --env-file=C:/Users/TK/.nightsky/providers.env --import tsx scripts/validate-api-live.ts --hyderabad-live`. Do not replay it under the consumed allowance. No standalone server is needed for this bounded adapter packet; native-client testing is a separate stage. Inherited environment values take precedence over Node env-file values, so start with a controlled child environment and do not override private credentials or quota path.

The completed run received owner authorization naming this envelope after offline guard validation. Any future packet must receive its own applicable authorization and use the existing private environment and ledger, a new unique batch ID, and current admission/budget evidence. Do not infer post-trial WeatherAPI Free success from the earlier trial response. Any current quota denial stops without resetting state. The invocation above was used for the subsequently authorized run documented in the results; any repeat needs fresh bounded authority.

## Evidence required from the owner experience

Preserve each source's status, native cadence, horizon, missing fields and attribution separately. MET, WeatherAPI and OpenWeather are service labels; their brands alone do not prove independent underlying models. No averaging or invented hourly OpenWeather values. Keep the original first-batch MET reporting limitation intact.

A synthetic MCP transcript proves local transport/tool behavior. An actual host transcript is needed to prove skill discovery and use in the intended client. This Codex session's web-search capability does not establish search capability in the target host, and NightSky's MCP backend does not automatically supply general web search. A future host rehearsal should record the actual advertised tools, skill-loading evidence, source URLs/timestamps for any external research, and the final source-transparent answer. Without those receipts, mark host search and skill loading unverified. General web research has no allowance in the four provider requests above and must not be hidden inside them.

## Readiness

Local runtime, provider configuration contracts, durable quota tooling and offline rehearsals already exist. The retained account setup and first connectivity batch are evidence of prior setup, not fresh checks performed here. The Hyderabad executor completed its approved four-request run; further execution needs fresh bounded authority. Full north-of-Hyderabad Geminids site guidance still needs point/access evidence, appropriate event evidence and in-horizon weather; history, geometry acceptance, deployment and native-client acceptance remain separate gates.
