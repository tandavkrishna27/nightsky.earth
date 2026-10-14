# NightSky V1 MCP hosting decision

**Status:** Host direction selected by owner on 11 October 2026: Hetzner for the MCP service, initially evaluating a shared 2 vCPU / 4 GB VM. On 14 October the owner reported having a plan, region and hostnames; their exact values have not been supplied or verified. This authorizes local preparation only. Budget and production endpoint evidence remain open before Task 3B/3C. Use the [configuration handoff](policy-host-wave.md) to collect the existing choices and rehearse locally.

## Product and deployment boundary

The existing website uses React/Vite and Netlify publishes `dist/public` as a static site. The MCP service needs a Node-capable remote host that supports HTTPS and Streamable HTTP. It can share the repository and CI/source tree with the website while being deployed as a separate service. A static website host alone does not run the existing Express application as a persistent/compatible MCP endpoint.

The host must support:

- Node runtime compatible with the chosen MCP SDK/Express adapter and persistent or serverless Streamable HTTP behavior validated by the SDK.
- Stable custom hostnames, TLS, health checks, deploy rollback and staging/prod separation.
- Request/body/time limits compatible with MCP, abuse controls and bounded provider concurrency.
- Application and edge/proxy logs that can be inspected, redacted/configured and retention-bounded; user-place/location data must not be retained in routine logs.
- Egress to the selected public data sources, cache storage, secrets handling and provider-specific rate controls.
- A clearly quoted recurring cost basis and any usage limits, cold-start/egress/storage charges.

## Decision table

| Required decision | Current value |
|---|---|
| Host/provider | Hetzner selected; shared 2 vCPU / 4 GB initial target, subject to current price, region, and compatibility checks |
| Recurring pilot ceiling (owner-approved) | Pending. `$25/month` was suggested in the execution plan only as a proposal and is not approval. |
| One-off data-build ceiling | Pending and separate from recurring hosting |
| Production hostname | Pending; must be stable and owned/controlled by the publisher |
| Full production MCP URL/path | Pending; freeze before creating the real OpenAI draft |
| Staging hostname and MCP URL | Pending; must differ from production and be available for OpenAI developer-mode testing |
| Deploy/rollback method | Immutable standalone container and fresh-process artifact rollback are prepared locally; actual proxy, host promotion and rollback evidence remain pending before Task 3B |
| Request limiting / abuse response | Global/IP/subject process-memory caps implemented; default-disabled narrow single-proxy trust is tested locally; actual proxy topology, multi-process behavior and selected-host/provider budgets remain pending |
| App and edge log access/retention/redaction | Pending validation; do not proceed if user location can leak into unbounded logs |
| Monthly cost quote and assumptions | Pending owner budget/host evaluation |
| Production access to OpenAI review traffic | Pending; apply and verify redaction/retention with synthetic traffic before linking the real draft |

## Gate status

**Gate 0F is not passed.** The owner selected Hetzner as the hosting direction, but this is not purchase or deployment authorization. Before Task 3B, verify the exact plan/region and select staging infrastructure, then prove an MCP smoke call works there. Before Task 3C/4B, choose the verified publisher identity, eligible OpenAI project, permanent production hostname/full URL, and approve the relevant recurring and any one-off budget. Before connecting the real draft to production, demonstrate bounded/redacted app and edge logs using synthetic requests. Reconfirm current platform URL/version behavior at implementation time.

No paid processing, host plan, custom domain, production deployment, or marketplace submission is authorized or has been performed by this preflight.
