# Local release preparation and later deployment

The development branch is `codex/plugin-v1`. Deployment is deferred by the owner until local implementation and verification are reviewed. The backend uses read-only files and memory caches; it does not require a database.

## Local release checks

1. Run `npm ci`, `npm test`, `npm run check`, `npm run plugin:package`, and `npm run build`.
2. Run both pinned Python fixture suites: `python -m unittest discover -s tests/osm -v` and `python -m unittest discover -s tests/era5 -v` in their dependency environments.
3. Exercise the production build using `node scripts/verify-production-runtime.mjs`. This checks health, initialization, twelve tools and structured recommendations without provider requests.
4. In a fresh process, run `node --import tsx scripts/verify-capacity.ts --offline` with explicit reviewed GeoNames/history paths and digest. Add the OSM fixture path and reviewed digest for all-index measurements. Record exact runtime, request mix, concurrency, latency, errors and RSS. A local container limit is not a target-host approval.
5. Build the rehearsal package and retain its file inventory/digest. Its example endpoint is not a deployable production URL and the builder explicitly reports unresolved submission gates.
6. Commit/push only reviewed source, licensed small fixtures and documentation. Never include `.data`, credentials, private configuration, `.env`, build outputs or logs. Record CI conclusions against the exact pushed commit.

## Required server configuration

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
