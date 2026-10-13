# MCP SDK and runtime compatibility record

**Decision date:** 11 October 2026
**Status:** local SDK/transport gate passed; real staging and production host checks remain gated by Task 0F.

## Selected packages

| Package | Pinned version | Role | Runtime / peer compatibility |
|---|---:|---|---|
| `@modelcontextprotocol/server` | `2.3.1` | MCP server, tool registration and web-standard Streamable HTTP handler | Node `>=20`; stable v2 line |
| `@modelcontextprotocol/express` | `2.0.2` | Express app defaults, JSON parser, Host/Origin checks | Node `>=20`; peer Express `^4.18.0 || ^5.0.0`; tested with Express 4 |
| `@modelcontextprotocol/node` | `2.1.1` | Node `http` request/response adapter to the web-standard handler | Node `>=20`; SDK peer `^2.3.0` |
| `express` | `4.22.3` | Existing repository server framework | Express 4; within adapter's supported peer range |
| `zod` | `3.25.76` | Existing website/database schemas (`shared/schema.ts`) | Kept on Zod 3; existing imports remain unchanged |
| `zod4` (`npm:zod@4.2.0`) | `4.2.0` | MCP-facing Standard Schema and JSON Schema conversion | Separate Zod 4 boundary; MCP schemas import `zod4` |

The project now declares Node `>=20`. The local verification runtime was Node `24.14.0` with npm `11.9.0`; a Node 20 binary was not installed in this environment. The package engine metadata and SDK package engine declarations both set the supported floor, but this run is not a second runtime-matrix test on Node 20.

### Schema boundary decision

The first compatibility run used the `zod/v4` subpath exposed by Zod 3.25.76. Protocol behavior worked, but SDK `2.3.1` logged that Zod lacked `~standard.jsonSchema` (added in Zod 4.2) and fell back to `z.toJSONSchema()`. We therefore use the small, explicit equivalent boundary allowed by the execution plan: leave all existing Zod 3 schemas untouched, and import the MCP tool schemas from the exact `zod4` alias at 4.2.0. The final smoke run emitted no Zod warning and verified the advertised input and output JSON schemas.

Do not migrate `shared/schema.ts` to Zod 4 as part of MCP integration. Keep website/database schemas on `zod`; new MCP-facing contracts use the separate `zod4` import. This avoids making MCP's schema requirements a migration of the current app's schema layer.

## HTTP integration and middleware order

The local endpoint uses the official Express and Node adapters:

1. `createMcpExpressApp({ host: "0.0.0.0", allowedHosts: ["127.0.0.1"] })` installs the host guard and JSON body parser.
2. `createMcpHandler(() => createSmokeServer())` creates a fresh, stateless `McpServer` for each request.
3. `toNodeHandler(handler)` adapts the MCP handler to Express.
4. The `/mcp` route passes the already parsed body as `mcpNodeHandler(req, res, req.body)`. Do not allow Express to consume the stream and then have the SDK adapter try to read it again.

This tests the current site's relevant parser shape: JSON middleware precedes routes, while a sentinel `/api/news` route continues to answer on the same smoke app. It does not invoke the production `registerRoutes` implementation. When the production service is wired into `server/index.ts`, mount the adapter-protected MCP app/route before the existing generic parsers or preserve the explicit parsed-body handoff; do not drop the Host/Origin guards. Because Task 0F has not selected hostnames, the test allowlist is deliberately only `127.0.0.1`. Re-test the actual staging/production host allowlist, reverse proxy, and forwarded headers after those choices are made.

The current site server's global `express.json()` plus `express.urlencoded()` is not replaced by this compatibility spike. The smoke endpoint is test-only and is not exposed by the production website.

## Verification performed

| Check | Result |
|---|---|
| `npm run test:mcp-smoke` | Passed 2 tests: initialize, `tools/list`, valid `tools/call`, invalid schema input, four concurrent stateless requests, `/api/news` preservation, and unexpected Host rejection. |
| Official MCP Inspector CLI: `npx --yes @modelcontextprotocol/inspector --cli http://127.0.0.1:4317/mcp --transport http --method tools/list` | Passed; Inspector initialized the local Streamable HTTP server and listed the `echo` smoke tool and its input/output schemas. |
| `npm run check` | Passed with website/database schemas still on Zod 3. |
| Strict one-off TypeScript check of both smoke files | Passed with project TypeScript 5.6.3. |
| `npm run build` | Passed. Existing warnings: stale Browserslist database, PostCSS plugin missing `from`, and a website JS chunk above 500 KB. |
| Node minimum | SDK packages declare Node `>=20`; local runtime was Node 24.14.0. Node 20 was not separately executed. |

### Dependency-security finding

The first install/audit found the existing lock resolved Express `4.21.2` and `proxy-addr` `2.0.7`; npm reported Express as high severity and `proxy-addr` as critical (GHSA-jqcg-44mw-7w3h). The shared HTTP stack was updated to Express `4.22.3` and `proxy-addr` `2.0.8`, compatible with the selected adapter. On 13 October 2026, compatible dependency updates were applied and packages used only by schema types or the CSS build configuration (`drizzle-orm`, `drizzle-zod`, `tailwindcss-animate`) were moved to development dependencies. Fresh `npm audit --omit=dev` reports zero vulnerabilities in the production dependency tree. The full development tree still reports 14 findings (7 high, 7 moderate), including Tailwind 3 and Vite/legacy build dependencies; major upgrades were not forced. Review and update the build toolchain before treating an externally exposed CI/build runner as trusted. After clean full and production-only installs, the Windows development server initialized MCP and the production-only server started and listed all 11 tools. This proves local protocol/runtime behavior only. No public MCP endpoint was deployed.

## Deferred checks

- Repeat Host/Origin allowlist validation with the exact staging and production hostnames after Gate 0F.
- Verify reverse proxy host/forwarded-header behavior, body/time limits, abuse controls, log redaction/retention, TLS, and actual hosted Streamable HTTP behavior before production.
- Run the app on a Node 20 runtime in CI or staging when the deployment host is selected.
- This smoke tool is a disposable compatibility fixture, not a product tool or final MCP server registration.

## References

- [MCP TypeScript SDK packages](https://github.com/modelcontextprotocol/typescript-sdk/blob/main/docs/get-started/packages.md)
- [Official Express serving guide](https://github.com/modelcontextprotocol/typescript-sdk/blob/main/docs/serving/express.md)
- [SDK v2 migration and Node/Zod notes](https://github.com/modelcontextprotocol/typescript-sdk/blob/main/docs/migration/upgrade-to-v2.md)
- [MCP Inspector CLI](https://github.com/modelcontextprotocol/inspector/blob/main/clients/cli/README.md)
