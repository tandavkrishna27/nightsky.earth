# Local release preparation and later deployment

## Active API-only Hetzner delivery — 19 October 2026

Use [the exact server/GitHub setup checklist](hetzner-setup-20261019.md) as the canonical V1 deployment contract. Hostnames are owner-confirmed: `mcp.nightsky.earth` and `mcp-staging.nightsky.earth`.

### Production receipt — 19 October 2026

Commit `d02628829e81ab8824b9c54a88f64b3201b04d03` was built and published as ARM64 image digest `sha256:9ee3592a882c287c01f5c7f6b1391d4131536113cfc6b2c3e2324efc3d2d72c7` by [image run 39273450492](https://github.com/tandavkrishna27/nightsky.earth/actions/runs/39273450492). [Staging promotion 39274063067](https://github.com/tandavkrishna27/nightsky.earth/actions/runs/39274063067) and [production promotion 39274522704](https://github.com/tandavkrishna27/nightsky.earth/actions/runs/39274522704) accepted that same digest after environment reviews.

The server operator reported the production container healthy on `127.0.0.1:5000`, with no public host port. The operator backed up nginx to `/root/nightsky-production-nginx-20261019T150721Z.conf`, changed only `/etc/nginx/sites-available/nightsky-production.conf` from the bootstrap deny rule to the production proxy, passed `nginx -t`, and reloaded. Their external checks found HTTPS `/health` 200, successful MCP initialization, GET `/mcp` 405, empty POST `/mcp` 400, HTTP redirect, unknown ACME path 404, and staging `/mcp` 403. No provider API requests were made during that host check. An independent browser check found production `/health` returned `{"service":"nightsky","status":"ok"}` and staging `/mcp` returned nginx 403.

This establishes public transport and production process reachability. It does not establish live provider responses, actual client integration, sustained capacity, public plugin submission, or a real-user pilot. Preserve the exact deployed digest when later documentation commits advance the branch.

### Bounded production source check — 19 October 2026

With owner approval, one request each to Geoapify, MET Norway and DarkSkySites was made through public HTTPS MCP, without retries or retained raw responses. MCP initialization succeeded. Geoapify resolved Hyderabad with a verified `Asia/Kolkata` time zone; GeoNames was not configured. For the 20 October 2026 20:30–23:30 IST test window, MET Norway returned nine forecast samples and a `partial` status because some weather fields were absent. DarkSkySites returned an available modelled Hyderabad city-point estimate: SQM 17.96 mag/arcsec², Bortle 9, dataset `08_2026`; coordinate binding was verified, but coverage remained unknown. This confirms the selected production adapters respond; it does not validate an observing site, forecast accuracy, all provider fields, client-specific rendering or higher traffic.

The reviewed implementation is on `codex/plugin-v1`, using `Dockerfile.plugin` -> `dist/plugin.js`. Explicit `NIGHTSKY_DISCOVERY_MODE=api` avoids the compatibility default of legacy mode. No database, mounted gazetteer, planet, OSM catalogue or historical baseline is required. Prepared examples and restricted helper live in `ops/hetzner/`; credentials stay in `/etc/nightsky/production.env`, state in the dedicated `/state` mount. Optional sources and their ledgers require admission/migration review before activation. Staging blocks external access and carries no provider keys.

GitHub push/PR checks build and smoke a native ARM64 image. Publication and staging/production promotion are separate manual environment-gated actions; they are not triggered by this implementation push. Provider secrets never enter ordinary CI. The complete checklist documents exact GitHub names, SSH restrictions, proxy trust, private staging address, DNS/TLS, quota preservation and rollback limitations.

The retained sections below are historical local/legacy evidence. Their GeoNames/OSM/climate settings must not be copied into the API-only deployment profile. Local image execution and later selected-host verification are distinct gates; see the current verification receipt in the setup record.

## Local release checks

1. Run `npm ci`, `npm test`, `npm run check`, `npm run plugin:package`, and `npm run build`.
2. Run both pinned Python fixture suites: `python -m unittest discover -s tests/osm -v` and `python -m unittest discover -s tests/era5 -v` in their dependency environments.
3. Exercise the production build using `node scripts/verify-production-runtime.mjs`. This checks health, initialization, twelve tools and structured recommendations without provider requests.
4. In a fresh process, run the [bounded measurement harness](release-preparation-wave.md#measured-capacity-packet). Use `--offline --release` with pinned production history/global geography, pinned GeoNames and an explicit covered-case workload for assembled-release measurements; plain `--offline` remains retained benchmark evidence. Record exact runtime, request mix, concurrency, latency, initialization, errors and RSS. A local container limit is not a target-host approval.
5. Build the rehearsal package and retain its file inventory/digest. Its example endpoint is not a deployable production URL and the builder explicitly reports unresolved submission gates.
6. Commit/push only reviewed source, licensed small fixtures and documentation. Never include `.data`, credentials, private configuration, `.env`, build outputs or logs. Record CI conclusions against the exact pushed commit.

## Retained legacy configuration — not the API-only V1 profile

| Setting | Meaning |
|---|---|
| `PORT` | Backend listener; default 5000 |
| `NODE_ENV` | `production` for the built service |
| `NIGHTSKY_MCP_ALLOWED_HOSTS` | Explicit hostnames, comma separated; defaults to loopback only |
| `MET_NORWAY_USER_AGENT` | Application/contact identity; owner contact is nightsky.earth2026@gmail.com |
| `NIGHTSKY_GEONAMES_INDEX` | Reviewed global gazetteer file |
| `NIGHTSKY_OSM_CANDIDATE_INDEX` | Optional reviewed candidate database; current pilot is regional nodes only |
| `NIGHTSKY_CLIMATE_ARTIFACT`, `NIGHTSKY_CLIMATE_SHA256` | Reviewed historical artifact and its trusted digest; current coverage is three places in 2025 |

No runtime CDS credential is needed. Keep raw extracts, build scratch and private source credentials outside the serving release. The OSM database must retain its separate ODbL attribution and exact active-version public offer before public service use.

## Version switching and rollback

Prepare a complete immutable release directory containing built code, locked production dependencies and reviewed artifact references. Retain the previous directory and configuration. Switch code and artifact path/digest pairs together and restart the process: route caches intentionally live for one process/route lifetime. Run health and representative MCP calls before admitting traffic. On failed checks, restore the previous code and configuration together, restart and repeat the same checks. A changed digest must never be accepted automatically to make a failing deployment pass.

## Later hosted gates

Record the exact Hetzner plan/region, budget, permanent production and separate staging hostnames when deployment begins. Then verify TLS/proxy trust, log retention, admission/provider budgets across processes, streaming, real platform connections, actual host capacity and rollback. Reconcile draft privacy/support pages and the publisher's verified legal identity before exposing them. Tasks 3B/3C/4B/14/15/16 retain their hosted acceptance gates; local checks do not close them.

## Current standalone deployment artifact — 13 October update

Use `npm run build:plugin` and `npm run start:plugin` for the assistant-only backend (`server/plugin.ts` -> `dist/plugin.js`). `Dockerfile.plugin` builds that entry independently from website/Vite/news paths, uses the pinned Node image/digest shown in the file, prunes development dependencies, runs as `node`, and copies only reviewed public event catalogs. GeoNames/OSM/climate artifacts are mounted separately. No image deployment or selected-host validation is implied.

`HOST` defaults to `127.0.0.1`; explicit container networking/proxy configuration is a hosted gate. Set `NIGHTSKY_OSM_CANDIDATE_SHA256` to the reviewed digest to pin the candidate file; checksum checking is conditional when this optional setting is present, so production must explicitly configure it. `NIGHTSKY_OSM_CANDIDATE_MAX_BYTES` applies the validated loader byte bound (positive safe integer, maximum/default 512 MiB; use the measured artifact-specific limit); do not bypass checksum/limit errors. Climate path/digest should select v3 as recorded in climate-tiles.md. Run `npm run test:plugin-runtime` for the standalone local runtime rehearsal. The shared logger no longer intercepts or serializes API response bodies; proxy retention/access controls still require actual-host inspection.

## Fresh-process local rollback evidence — 14 October

For the early one-tool service, set `NIGHTSKY_MCP_TOOL_MODE=resolver-only` before starting the built standalone plugin. This retains protected request handling while registering only `resolve_place`; unset it for the full service. Unknown values fail startup. See [resolver scan preparation](../platforms/location-tool-scan.md) for local client commands and the later official scan gates.

`node --import tsx scripts/verify-artifact-rollback.ts` passed six fresh Node processes against the checksum-pinned public real OSM fixture and installed actual climate v3. Both reject corrupt candidate bytes and restore identical original structured results with unchanged source hashes. Climate remains partial 2025 samples; candidates remain the 59-node fixture. See [artifact rollback](artifact-rollback.md) for exact digests, assertions and host limitations. `node --import tsx scripts/verify-offline-operations.ts` consolidates local protocol/package/review/rollback evidence; it contains no deployment or account operation. Final Linux build/runtime, selected-host all-index capacity/disk and real proxy/promotion/rollback evidence belong to release integration and hosted gates.

## Opt-in regional serving and single-proxy trust

For full mode, set `NIGHTSKY_OSM_REGIONAL_MANIFEST` to a reviewed immutable manifest and `NIGHTSKY_OSM_REGIONAL_SHA256` to its reviewed digest. Both are required together; do not also set `NIGHTSKY_OSM_CANDIDATE_INDEX`. Mount the manifest directory and its relative artifacts read-only. Missing/corrupt manifest fails startup; region corruption or conflicts fail the query explicitly. Defaults bound resident cache to two regions/8MiB serialized bytes/20,000 rows and eight active/pending queries. Byte budgets do not equal heap/RSS. Resolver-only validates configuration but does not load candidate artifacts.

`NIGHTSKY_MCP_TRUSTED_PROXIES` optionally lists narrow explicit addresses/CIDRs for one rewriting proxy; default trust is disabled. The proxy must overwrite X-Forwarded-For from its actual socket client and restrict backend reachability. Do not reuse loopback fixture settings as a production topology decision. Callback admission persists through cancellation until actual work settles. See [local proxy evidence](local-proxy-wave.md), [regional serving](regional-serving-wave.md) and [owner inputs](policy-host-wave.md). Actual Hetzner/firewall/TLS/log/rollback checks remain outstanding.
