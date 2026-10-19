# Production multi-provider activation packet

**Prepared 20 October 2026.** This is a nonsecret operator checklist. It does not activate a provider, attest to unused credits, update GitHub, or deploy. The existing protected `NIGHTSKY_PRODUCTION_ENV` is one complete Docker environment file; editing it replaces the whole secret, so retain every existing line and key. Never copy secret values into Git, chat, CI logs, or a client package.

## What already runs and what staging proves

The 20 October read-only production audit confirms Geoapify location resolution, MET Norway forecast, and DarkSkySites point light pollution; the WeatherAPI and OpenWeather credentials are absent. The general quota file contains valid WeatherAPI and OpenWeather policy records with preserved counters and its initialized marker has the expected runtime ownership. Astronomy Engine calculations run locally and need no API key. The staging image runs with `ops/hetzner/runtime-guard.mjs`, which rejects selected external providers and credentials. Its healthy result proves container/MCP startup, not live multi-provider behavior. GitHub cannot return the current secret value for comparison.

## Admission order

| Source | Key | Before adding to the production profile |
| --- | --- | --- |
| WeatherAPI.com | Existing private key | Owner reports the dashboard shows **Free** on 20 October 2026. Preserve the general quota checkpoint and its existing WeatherAPI policy/counters; verify the key's Free three-day hourly response and visible credit in a bounded live acceptance. Do not infer remaining credits from the plan name. |
| OpenWeather five-day forecast | Existing private key | Verify the exact subscribed Free product and render its required logo/link and derivative notice; use the implemented forecast endpoint only, not One Call. Preserve the same general quota checkpoint. |
| Public Universe | None | Admit only the starter-only feature scope and its reviewed record lineage; prepare a **dedicated** `/state/public-universe-quota.json` checkpoint under a reviewed allocation and current public-IP usage evidence. The CLI `--plan` performs no initialization; the operator-only verified-usage import still needs host acceptance. Selection before a valid checkpoint yields an unavailable source. |
| 7Timer | None | Review the source's current reuse/credit and categorical-field presentation; migrate the existing shared checkpoint using the explicit reviewed `migrate-seventimer-quota.ts` packet. Do not initialize a new checkpoint. |
| AstronomyAPI | Existing private ID and secret | Confirm this account's ongoing free allowance and supported requests; prepare a separate `/state/sky-quota.json` checkpoint and rendered rights/credits. A locally successful diagnostic does not establish production entitlement. |
| NASA DONKI, JPL, Dark Sky Planner | Key only for NASA | Keep unselected while live result, meaning/usage or reuse requirements remain unresolved. Their adapters can return unavailable without interrupting the core plan. |

## Environment entries after each source passes its gate

Preserve the current Geoapify, MET, DarkSkySites and fixed host entries. For WeatherAPI, put its key in the separate **GitHub `production` environment secret** `NIGHTSKY_WEATHERAPI_KEY` (not a repository secret). The production workflow composes that key and the required `met,weatherapi` selection with the existing complete `NIGHTSKY_PRODUCTION_ENV` in memory. It rejects a missing general quota path, an existing WeatherAPI key in the base profile, or unexpected weather selections. The original complete secret remains unchanged. Later provider additions still require their own reviewed admission and configuration path.

The effective WeatherAPI entries are:

```dotenv
# WeatherAPI admission: keep MET in the list.
NIGHTSKY_WEATHER_PROVIDERS=met,weatherapi
NIGHTSKY_WEATHER_ADMITTED_PROVIDERS=weatherapi
NIGHTSKY_WEATHERAPI_KEY=<from the separate protected secret>

# Add OpenWeather later, after its separate gate (replace the two lists above):
# NIGHTSKY_WEATHER_PROVIDERS=met,weatherapi,openweather
# NIGHTSKY_WEATHER_ADMITTED_PROVIDERS=weatherapi,openweather
# NIGHTSKY_OPENWEATHER_KEY=<enter privately>

# Add Public Universe only after its dedicated checkpoint and rights gate:
# NIGHTSKY_SKY_PROVIDERS=publicuniverse
# NIGHTSKY_SKY_ADMITTED_PROVIDERS=publicuniverse
# NIGHTSKY_PUBLICUNIVERSE_SCOPE=starter-only
# NIGHTSKY_PUBLICUNIVERSE_QUOTA_STATE_PATH=/state/public-universe-quota.json
```

The commented examples are **not** a complete secret; placeholders must never be submitted. Preserve `NIGHTSKY_QUOTA_STATE_PATH=/state/provider-quota.json` and `NIGHTSKY_LIGHT_POLLUTION_QUOTA_STATE_PATH=/state/light-pollution-quota.json`. The production `nightsky-configure` helper accepts only its fixed allowlist, rejects duplicate/unknown variables and incorrect state paths, and cannot be used to smuggle an unreviewed provider option. WeatherAPI/OpenWeather share the general ledger. Public Universe requires a distinct dedicated ledger. 7Timer also uses the general ledger but requires a preserving migration before selection.

## Private operator verification and promotion

1. On the host, report only active provider IDs, credential **presence**, configured ledger paths, checkpoint policy IDs and file integrity/ownership. Do not print key values or checkpoint contents. Compare against this packet and the operator's account dashboards. Preserve the root-only production configuration and runtime-owned state.
2. Review the requested admission and source-credit rendering with a local fixture. Prepare and verify any missing quota migration while the relevant consumer is quiesced; preserve every prior counter and `.initialized` marker. Reject a missing, corrupt or differently labelled checkpoint rather than resetting it.
3. The owner privately adds the existing WeatherAPI key as the separate `NIGHTSKY_WEATHERAPI_KEY` secret under GitHub's protected **production environment**. The workflow composes the effective complete file only inside the runner and the host's restricted configure step validates it without logging values. Do not change `NIGHTSKY_PRODUCTION_ENV` for this admission.
4. Use the verified immutable image and protected production promotion. A secret edit alone does not change a running container. Confirm image digest, `/health`, MCP initialization, selected provider IDs and existing quota ownership after promotion.
5. Run one bounded production request per newly admitted provider, then a real planner journey with a failure fallback. Record request counts, available/partial/unavailable statuses, source issue/retrieval times, credits, and the exact image/configuration revision. No paid endpoint, retry fanout, bulk download or browser extraction is part of this packet.

If any admission gate fails, keep that provider unselected and continue with the already verified core. The later admin dashboard can read operational metrics; it does not replace durable quota enforcement or admission checks.

## Public Universe: starter-only implementation and release gates

The deployed image's `NIGHTSKY_SKY_ADMITTED_PROVIDERS=publicuniverse` switch admits the **whole** provider. That also exposes solar-system, exoplanet, meteor-reference and close-approach outputs whose original-record rights and complete visible credits have not been accepted. The reviewed BSC5P and OpenNGC starter records do not clear those features. Keep Public Universe unselected in the production secret until the new branch code and the remaining acceptance items below are released:

1. **Implemented locally:** `NIGHTSKY_PUBLICUNIVERSE_SCOPE=starter-only` is required for configured admission. Search and details deny other domains/variants before transport; discovery omits unscreened solar-system target records. Direct internal provider tests retain the broader implementation for future feature reviews.
2. **Implemented locally:** returned BSC5P/OpenNGC starter snapshots must match the reviewed subset hashes, source URLs, licence labels/URLs and attribution text. The normalized response adds a modification notice. Changed selected identity fails closed. **Still verify:** the actual live selected record values and the real ChatGPT answer/tool-card credit presentation.
3. **Implemented locally:** source manifest requires starter rights evidence and a dedicated nonaliasing quota path. The production configure helper accepts only `NIGHTSKY_PUBLICUNIVERSE_SCOPE=starter-only` with a dedicated ledger path when this source is admitted. An operator-only `initializeVerifiedPublicUniverseQuota` function imports fresh, complete verified usage once; the command-line `--plan` remains read-only. **Still verify:** actual public-IP usage/other consumers and apply the reviewed import on the host; never claim an unused budget without evidence.
   The quota store now removes only its own new marker if initialization fails before any checkpoint or temporary write exists. A checkpoint, temporary file, changed marker or otherwise ambiguous interrupted import remains fail-closed and requires an operator to inspect and recover it; never delete those files just to reset usage.
4. **Locally checked:** focused scope, lineage, manifest, MCP, provider and quota tests passed. **Still required:** full offline suite, exact-commit CI, host helper installation, and bounded live BSC5P/OpenNGC/credit acceptance before enabling this source.

No API key is needed for this lane. The current release can still use its local astronomy calculations and other admitted sources while this finite restriction is completed.
