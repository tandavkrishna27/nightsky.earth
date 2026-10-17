# V1 light-pollution sources: agreed design

Date: 17 October 2026. Status: agreed architecture; implementation and provider admission pending.

## Goal and scope

Evaluate one resolved observing point or compare a short list of candidates using attributed light-pollution estimates. Discovery remains host search and existing location APIs. No exhaustive sky grid, owned global catalogue, database, deployment, new historical acquisition or NASA ingestion is introduced. DarkSkyLab is excluded.

Source identities are `darkskysites` and `lightpollutionmap`. DarkSkySites API and browser paths are transports for ONE source, not independent votes. Preserve both browser options, but prefer the official DarkSkySites API. Browser access is not a workaround for API quotas, paid capabilities, revoked credentials or denied access. Public browser admission/reuse remains unresolved.

## Observed evidence and limits

- Lightpollutionmap.info: two coordinate popups exposed 2025 SQM, Bortle range, brightness and elevation. This was a manual browser automation feasibility check, not a production parser.
- DarkSkySites: August 2026 selected-site cards exposed SQM and Bortle plus provider-specific visibility labels. Cards rounded coordinates; a stale card and pointer-following hover value were observed. Exact coordinate binding remains an implementation gate.
- Official API docs: https://darkskysites.com/api-access (checked 17 October 2026); API terms: https://darkskysites.com/api-terms (read in browser earlier that day). Latest zenith endpoint is documented free. Account activation and actual responses have not yet been verified.
- Owner confirmed on 17 October 2026: project/key unused elsewhere and dashboard shows 30,000 requests/month. Actual responses and live activation remain pending. Existing credentials/counters must not be reset.

## User journeys

1. Assess a named place after existing resolver produces a revision-pinned point.
2. Assess explicit coordinates, including user-selected outdoor points.
3. Compare two to five supplied candidates.
4. Discover a shortlist near a place, within an administrative area or direction, then assess it; say best among evaluated candidates, not darkest across an entire region.
5. Combine estimated light pollution with distinct weather forecasts, astronomy and access evidence. No visibility guarantees, travel-time inference from straight-line distance, provider averaging, or probability derived from provider darkness percentages.
6. Explain conflicting sources, old datasets, unavailable coverage or unavailable providers while preserving the rest of the plan.

## Boundary

Host LLM -> existing MCP location resolver -> compare_light_pollution -> source adapters -> API / bounded browser child -> validated evidence -> host LLM.

The API works without Chromium installed. The browser child cannot inherit provider secrets or the user's browser profile. Host AI browser functionality is optional and not required. Browser dependency and Linux/Windows packaging are measured locally before any hosting decision.

## Private setup

Existing file: `C:\Users\TK\.nightsky\providers.env` (outside repository). Add one line, replacing the placeholder locally:

    NIGHTSKY_DARKSKYSITES_API_KEY=YOUR_KEY_HERE

Do not replace other lines or paste the secret into chat. The implemented server adapter consumes this variable only with explicit source selection, API admission and an existing dedicated quota ledger; see [operator setup and acceptance](light-pollution-acceptance-20261017.md). The key alone does not activate lookups. Do not add it to a frontend VITE variable or GitHub secrets for offline CI. Live account credentials stay outside fixtures, logs, plugin bundles and browser contexts.

## Coordinator public-browser verification
The API terms page was successfully read in the in-app browser on 17 October 2026: https://darkskysites.com/api-terms , API_TERMS_2026_10_V2, effective 14 October 2026. API use in applications/services and reasonable operational caching are allowed with adjacent linked attribution; bulk reconstruction, quota evasion and a general-purpose substitute redistribution API are prohibited. This resolves the documentation-reader failure for API terms, not browser-page extraction rights. NightSky remains a scoped observing planner with bounded candidate lookups, not a raw bulk data service. No terms acceptance or account change was performed.
