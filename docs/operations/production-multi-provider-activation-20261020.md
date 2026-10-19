# Production multi-provider activation packet

**Prepared 20 October 2026.** This is a nonsecret operator checklist. It does not activate a provider, attest to unused credits, update GitHub, or deploy. The existing protected `NIGHTSKY_PRODUCTION_ENV` is one complete Docker environment file; editing it replaces the whole secret, so retain every existing line and key. Never copy secret values into Git, chat, CI logs, or a client package.

## What already runs and what staging proves

The last verified production profile selects Geoapify location resolution, MET Norway forecast, and DarkSkySites point light pollution. Astronomy Engine calculations run locally and need no API key. The staging image runs with `ops/hetzner/runtime-guard.mjs`, which rejects selected external providers and credentials. Its healthy result proves container/MCP startup, not live multi-provider behavior. GitHub cannot return the current secret value for comparison; verify the server's active provider **names** and ledger identity privately before changing it.

## Admission order

| Source | Key | Before adding to the production profile |
| --- | --- | --- |
| WeatherAPI.com | Existing private key | Confirm the account's current Free entitlement and hourly fields after trial transition; preserve the general quota checkpoint and its existing WeatherAPI policy/counters; check Free credit in a rendered client answer. |
| OpenWeather five-day forecast | Existing private key | Verify the exact subscribed Free product and render its required logo/link and derivative notice; use the implemented forecast endpoint only, not One Call. Preserve the same general quota checkpoint. |
| Public Universe | None | Admit only screened record/feature classes and their original-source rights; prepare a **dedicated** `/state/public-universe-quota.json` checkpoint under a reviewed allocation and current public-IP usage evidence. `scripts/initialize-public-universe-quota.ts --plan` performs no initialization; selection before a valid checkpoint yields an unavailable source. |
| 7Timer | None | Review the source's current reuse/credit and categorical-field presentation; migrate the existing shared checkpoint using the explicit reviewed `migrate-seventimer-quota.ts` packet. Do not initialize a new checkpoint. |
| AstronomyAPI | Existing private ID and secret | Confirm this account's ongoing free allowance and supported requests; prepare a separate `/state/sky-quota.json` checkpoint and rendered rights/credits. A locally successful diagnostic does not establish production entitlement. |
| NASA DONKI, JPL, Dark Sky Planner | Key only for NASA | Keep unselected while live result, meaning/usage or reuse requirements remain unresolved. Their adapters can return unavailable without interrupting the core plan. |

## Environment entries after each source passes its gate

Preserve the current Geoapify, MET, DarkSkySites and fixed host entries. Add only the appropriate rows below to the **existing** GitHub `production` environment secret `NIGHTSKY_PRODUCTION_ENV`:

```dotenv
# WeatherAPI admission: keep MET in the list.
NIGHTSKY_WEATHER_PROVIDERS=met,weatherapi
NIGHTSKY_WEATHER_ADMITTED_PROVIDERS=weatherapi
NIGHTSKY_WEATHERAPI_KEY=<enter privately>

# Add OpenWeather later, after its separate gate (replace the two lists above):
# NIGHTSKY_WEATHER_PROVIDERS=met,weatherapi,openweather
# NIGHTSKY_WEATHER_ADMITTED_PROVIDERS=weatherapi,openweather
# NIGHTSKY_OPENWEATHER_KEY=<enter privately>

# Add Public Universe only after its dedicated checkpoint and rights gate:
# NIGHTSKY_SKY_PROVIDERS=publicuniverse
# NIGHTSKY_SKY_ADMITTED_PROVIDERS=publicuniverse
# NIGHTSKY_PUBLICUNIVERSE_QUOTA_STATE_PATH=/state/public-universe-quota.json
```

The commented examples are **not** a complete secret; placeholders must never be submitted. Preserve `NIGHTSKY_QUOTA_STATE_PATH=/state/provider-quota.json` and `NIGHTSKY_LIGHT_POLLUTION_QUOTA_STATE_PATH=/state/light-pollution-quota.json`. The production `nightsky-configure` helper accepts only its fixed allowlist, rejects duplicate/unknown variables and incorrect state paths, and cannot be used to smuggle an unreviewed provider option. WeatherAPI/OpenWeather share the general ledger. Public Universe requires a distinct dedicated ledger. 7Timer also uses the general ledger but requires a preserving migration before selection.

## Private operator verification and promotion

1. On the host, report only active provider IDs, credential **presence**, configured ledger paths, checkpoint policy IDs and file integrity/ownership. Do not print key values or checkpoint contents. Compare against this packet and the operator's account dashboards. Preserve the root-only production configuration and runtime-owned state.
2. Review the requested admission and source-credit rendering with a local fixture. Prepare and verify any missing quota migration while the relevant consumer is quiesced; preserve every prior counter and `.initialized` marker. Reject a missing, corrupt or differently labelled checkpoint rather than resetting it.
3. The owner privately updates the existing GitHub production environment secret with the reviewed complete file. GitHub secrets cannot be read back; a local presence/configuration dry run and the host's restricted configure step must validate it without logging values.
4. Use the verified immutable image and protected production promotion. A secret edit alone does not change a running container. Confirm image digest, `/health`, MCP initialization, selected provider IDs and existing quota ownership after promotion.
5. Run one bounded production request per newly admitted provider, then a real planner journey with a failure fallback. Record request counts, available/partial/unavailable statuses, source issue/retrieval times, credits, and the exact image/configuration revision. No paid endpoint, retry fanout, bulk download or browser extraction is part of this packet.

If any admission gate fails, keep that provider unselected and continue with the already verified core. The later admin dashboard can read operational metrics; it does not replace durable quota enforcement or admission checks.

## Public Universe: exact remaining starter-only lane

The current `NIGHTSKY_SKY_ADMITTED_PROVIDERS=publicuniverse` switch admits the **whole** provider. That also exposes solar-system, exoplanet, meteor-reference and close-approach outputs whose original-record rights and complete visible credits have not been accepted. The reviewed BSC5P and OpenNGC starter records do not clear those features. Keep Public Universe unselected in the production secret until all of the following are complete:

1. Implement an enforced starter-only runtime feature scope across search, selected detail, discovery and selected windows. Reject other domains and detail variants **before a provider request**, and ensure discovery cannot return unscreened solar-system records. Preserve the current general implementation for later separately reviewed features without making it reachable under starter-only admission.
2. Require the returned starter source to match the reviewed BSC5P/OpenNGC subset lineage and carry its original licence URL, attribution and modification notice. A changed snapshot must fail closed until reviewed. Verify that the real ChatGPT answer and tool card render the notices adjacent to the values.
3. Extend the source manifest and rollback validation to require the restricted scope, reviewed rights evidence and a dedicated nonaliasing ledger path. `scripts/initialize-public-universe-quota.ts` is **plan only**. Implement and review a separate bounded initializer or verified usage import before selecting the provider; preserve consumed usage and do not claim the public IP is unused without evidence.
4. Update focused provider, MCP and manifest tests for allowed starter paths and denied other paths, including zero provider requests for denied features, altered lineage, partial results, and quota exhaustion. Run the full offline suite and exact-commit CI before a bounded live starter-record acceptance.

No API key is needed for this lane. The current release can still use its local astronomy calculations and other admitted sources while this finite restriction is completed.
