# Bounded geography validation: offline by default

This lane made no live requests, accessed no credentials, and changed no production gates. The stopped v1 allowance is consumed. It does not authorize either revised packet below.

Inspect the proposals without configuration or network access:

```powershell
node --import tsx scripts/validate-geometry-live.ts
```

## Proposed next check: one country selection

The smallest useful next check is one Vatican City country-selection request. It requires fresh explicit authorization for `geometry-selection-v2-va-1-1-30-zero-retries` and `--selection-live`.

The fixed GET is `https://api.geoapify.com/v1/geocode/search` with:

| Parameter | Value |
| --- | --- |
| country | Vatican City |
| type | country |
| filter | countrycode:va |
| bias | countrycode:none |
| limit | 5 |
| format | geojson |

Maximums are **one request, one credit, 30 seconds, 262144 response bytes and 262144 total bytes**. The existing HTTP client's shorter request timeout also applies. No redirect, retry, alias, pagination or provider fanout is allowed. Selection requires exactly one eligible country feature with expected country code `va`, country result type and a bounded, control-free opaque identity. The packet persists safe selection facts and stops even on success: `status=selection-completed`, `results=[]`, `sourceAccepted=false`, `productionEnabled=false`. No geometry, second-country or park request follows.

Empty, malformed, over-limit or ambiguous selection, an unsafe identity, quota denial, persistence failure or transport failure stops the check. This request uses a country **name**, not an assumed ISO-code lookup. Structured country search and country filtering follow the [forward-geocoding documentation](https://apidocs.geoapify.com/docs/geocoding/forward-geocoding/) and [country restriction guidance](https://apidocs.geoapify.com/how-to/addresses/restrict-address-search-country/). Disabling implicit IP bias makes the request deterministic with respect to requester location. These are contract corrections; they do not establish why the previous request stopped.

A future authorized operator must use a new batch identifier and the existing private configuration, without initializing or resetting quota. The required child-process environment is:

- `NIGHTSKY_LIVE_APPROVED_ENVELOPE=geometry-selection-v2-va-1-1-30-zero-retries`
- `NIGHTSKY_LIVE_BATCH_ID=<new unique lowercase batch identifier>`
- `NIGHTSKY_LIVE_GEOAPIFY_ADMITTED=yes`
- `NIGHTSKY_DISCOVERY_MODE=api`

The existing private configuration must supply `NIGHTSKY_GEOAPIFY_API_KEY` and `NIGHTSKY_QUOTA_STATE_PATH`. Both production geometry flags must remain unset or false; the executor refuses `yes`. An exclusive `geometry-live-<batch>.jsonl` marker beside the existing quota prevents batch reuse. Each attempt is synchronized before network dispatch. Do not run this proposal without fresh authorization or paste credentials into chat.

## Separate extended packet

The revised extended packet uses `--live` and fresh envelope `geometry-live-v2-6-9-120-zero-retries`. It is **not the proposed next check**, and selection-only authorization cannot authorize it. Its maximums remain six requests, nine credits, 120 seconds, 262144 bytes per response and 1572864 bytes total, without retries or pagination.

Its sequence is two country geocodes (Vatican City and San Marino), their original-details acquisitions, one Vatican park page and a repeated Vatican details acquisition. Each details call costs two credits. Unknown response shape, decoder rejection, unavailable response or any selection/transport/quota/persistence limit stops the sequence.

According to the [Place Details documentation](https://apidocs.geoapify.com/docs/place-details/), full geometry enriches the Details feature. The decoder requires exactly one Details feature overall, its exact selected identity and a Polygon or MultiPolygon. Other features may appear first; unrelated polygons and isochrones cannot supply the selected boundary. Existing topology and ring/vertex caps still apply. The public schema and narrative differ on feature serialization and enumeration; the documented comma-separated request is retained, and its live response remains unverified.

Safe receipts contain bounded feature types, identity checks, geometry types, counts and hashes. Diagnostic coordinate traversal stops after 4096 visits/pending entries and reports `countsTruncated`; no raw body or coordinates are retained. Accepted snapshots preserve bounded public datasource attribution/license metadata and bind it into the revision. Source vintage remains unknown. A completed validation packet does not establish production source acceptance or real-client MCP acceptance.

## Actual authorized attempt, 17 October 2026

The old packet stopped after its first Vatican City free-text country-geocode GET: **HTTP 200, 136 response bytes, 445 ms, one consumed credit**. No second geocode, details, park search or repeated acquisition occurred. No raw response or selection diagnostics were retained. The exact reason is **unknown**; the response length does not prove empty results, ambiguity or malformed data. No retry occurred or is authorized by this correction.

The old envelope `geometry-live-v1-6-9-120-zero-retries` is now refused before quota-file inspection. The revised selection facts do not reconstruct the discarded response.

## Offline verification and integration

```powershell
node --import tsx --test tests/operations/geometry-live-validation.test.ts
npm run check
```

Tests initialize only temporary synthetic quotas and use injected fetchers. They verify bounded debit, exclusive journals, stop behavior, the one-request selection path and selected-details decoding without operator quota or credentials. The coordinator owns aggregate-suite imports, combined CI and any future live authorization.

See [API geography completion handoff](../docs/operations/API-GEOGRAPHY-COMPLETION.md) for the lane changes and remaining gates.
