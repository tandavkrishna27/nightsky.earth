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
