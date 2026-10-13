# MCP data flow and logging policy

## Request flow

1. Express applies a 32 KiB JSON body limit.
2. `/mcp` checks the request Host against a configured allowlist. With no `NIGHTSKY_MCP_ALLOWED_HOSTS`, the route accepts loopback hostnames only.
3. The route applies in-process per-IP and global fixed-window request limits and a concurrency ceiling before constructing a stateless MCP server for that request.
4. The MCP SDK validates JSON-RPC and tool schemas. Twelve registered tools cover place resolution, astronomy, target visibility, weather, aurora, events, candidate search, access context, historical cloud context, planning, comparison and specialist recommendations. A registered tool may return unavailable/partial when its provider or optional artifact is not configured. Both direct and composed provider calls share process-local upstream controls; state is not recreated for each stateless MCP request.
5. Tool handlers return validated structured content and concise, source-attributed text. Failures do not expose stack traces or secrets.

## Data that may leave the service

When a user asks for a named destination, the server resolves it to an internal place record. Provider adapters may send rounded coordinates and the minimum time range required to a listed public provider. The specific provider and fields must be recorded in the product privacy notice before production. The server does not need a user account for V1.

The resolver's MCP handler reads only finite bounded latitude/longitude from `openai/userLocation` when `useApproximateHostLocation` is explicitly true. It rounds those hints to two decimal places, resolves a nearby named place, and does not retain the raw hint. Named destinations ignore location hints; missing/invalid hints return unavailable context. A route-local subject limiter accepts bounded `openai/subject` strings only for additional rate limits, storing salted HMAC digests rather than raw identifiers. IP/global ceilings remain enforced, so subject changes cannot bypass them. Session, organization, user-agent, labels and other metadata are discarded. Hints and subjects are untrusted and never authorization or authentication. The pinned SDK exposes tool-call metadata through `context.mcpReq._meta`; adapter and transport tests verify that path. See the [official metadata reference](https://developers.openai.com/plugins/reference).

## Logging and retention

- Do not log full `placeQuery`, tool arguments, request `_meta`, host-location fields, exact coordinates, raw anonymized subject/session IDs, or query histories.
- For MCP, application logs should contain at most route name, status code and elapsed time; do not capture request/response bodies. The current MCP path does not intentionally log arguments or response bodies. The shared request logger now uses fixed route labels, method, status and elapsed time on both website API and standalone MCP paths; response-body interception/serialization was removed. No proxy/host retention has been verified.
- The in-memory rate counter contains an IP key and request count. Counts reset after the configured one-minute default window; expired entries are pruned at the bounded 10,000-key ceiling before admitting a new key. Idle expired entries can remain within that bound. The map is not written to disk. Behind a reverse proxy, do not trust forwarded IP headers until a specific proxy chain is configured and reviewed.
- Subject counters store only per-route salted digests, counts and reset times, with the same default minute window and 10,000-key bound. Idle expired entries can remain until reuse/pruning; this is not a timed-deletion guarantee. The salt and map are process memory only and disappear on restart. Session correlation and usage histories are not recorded.
- Upstream controls retain only short-lived provider start times/counters, cooldowns and active request keys. MET request keys include rounded destination coordinates/contact/conditional headers; they are not logged or persisted and are removed when work settles or aborts. Provider payload caches are memory-only. No completed-trip history is retained.
- No shared persistent cache, raw location store, forecast history or cross-session user profile exists in this baseline.
- Before a remotely reachable service is used, the selected host must demonstrate bounded, redacted edge and application logs, reviewed retention settings, HTTPS, stable hostnames, and the documented upstream recipient list.

## Baseline exposure controls

Current route defaults: 32 KiB request body cap, 60 requests per source IP and 600 globally per 60 seconds, at most 20 active MCP requests, localhost-only Host allowlist and SDK schema validation. Rate-rejected requests do not consume active capacity.

`UpstreamControls` enforces eight concurrent operations globally, four per provider, 300 starts globally and 240 per provider per rolling minute, and a default 19 starts per provider per rolling second. MET's 19-per-second bound cannot be raised by configuration. Responses are limited to 4 MiB decoded bytes by default. Duplicate callers share bounded bytes and still receive place/window-specific structured results. There is no automatic retry, background refresh or unbounded admission queue; demand-driven cooldown honors server Retry-After and bounded local exponential backoff. MET/NOAA deadlines default to eight seconds, including body reads and supplementary limiter waits. Existing MET cache holds at most 128 entries; NOAA holds one global grid. These are operational bounds, not measured hosting capacity or total heap-byte guarantees.

The former unused `ProviderRequestControls` declaration was replaced by executable `upstreamControls` and `providerTimeoutsMs` dependencies. `NightSkyCache` is an optional memory-cache injection boundary; no persistent implementation was added. Multiple processes require coordinated budgets before scaling. See [provider operational evidence](provider-controls-wave.md) for defaults, fixture tests and abort-ignoring transport limitations. All twelve tools remain local-development capabilities until data, privacy and hosted release gates are passed. Historical runtime requests read only a reviewed artifact and make no CDS request; the private CDS configuration is confined to the owner's offline build environment.

The MCP endpoint must remain local until Task 0F approves a host and budgets and the selected host’s protections have been verified. No OAuth or account permissions are required for V1.
