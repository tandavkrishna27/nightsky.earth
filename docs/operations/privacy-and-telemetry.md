# Privacy and telemetry release checklist

Verified local behavior is described in [MCP data flow](mcp-data-flow-and-logging.md). The draft policy content is maintained in `shared/nightsky/policies.ts`; direct local routes are `/privacy`, `/terms` and `/support`.

The owner confirmed an individual publisher based in India and a monitored support email, nightsky.earth2026@gmail.com. The exact verified legal name, email handling/retention and qualified jurisdiction review remain prepublication inputs.

## Local handling

- Named-place queries, selected activities, times and optional gear are processed for the current request. No account, payment, saved trip database or query-history store is implemented.
- Assistant coordinates are used only for explicitly consented current-area resolution and reduced to two decimals. Named queries ignore location hints. Other metadata is discarded except bounded subject strings used to derive salted rate-counter digests.
- IP and subject counters are bounded memory maps. Logical windows reset; idle expired keys may remain until reuse/pruning. They are not written to disk, and restart clears the maps and subject salt.
- Sharing follows the selected mode: API GeoNames/Geoapify receive named/region/candidate queries; MET, WeatherAPI and OpenWeather receive destination points as described in the draft. Optional 7Timer, DarkSkySites, Dark Sky Planner, AstronomyAPI, Public Universe and JPL send the request fields documented in shared/nightsky/policies.ts only when selected/admitted; NASA DONKI requests date/event context without destination coordinates. NOAA fetches a global grid. Optional local GeoNames/OSM/history reads do not contact publishers. Assistant platforms and email providers handle their own data.
- Application request logging uses fixed route labels, method, status and elapsed time. The standalone MCP service additionally emits ingress/completion diagnostics with a generated per-request correlation UUID, allowlisted protocol method/tool, status, elapsed time and fixed outcome reason. The same UUID is returned in `X-NightSky-Request-ID`; it links one request, not a user or session. Neither logger serializes request/response bodies, raw subjects, coordinates, raw paths, queries or incoming headers. Provider errors returned through MCP are sanitized. Runtime/host capture and retention of diagnostic output remain unverified release gates.

## Hosted checks still required

Inspect reverse-proxy, container/runtime, SDK and upstream log behavior with synthetic nonpersonal requests. Record and enforce actual retention and access controls; verify forwarded-IP trust for the selected proxy chain. Reconcile every statement in the draft policy with that observed configuration before publication. Verify policy URLs are accessible without an experience/audio gate. Any optional analytics must use aggregate counters and must not reconstruct individual plans or retain subjects/sessions.
