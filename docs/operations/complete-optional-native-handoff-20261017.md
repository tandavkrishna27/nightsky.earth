# Complete optional-source local acceptance handoff

This preparation covers package 1.0.16. It makes no provider requests, model calls, installations or private configuration changes. Earlier source allowances are consumed; a new bounded source allowance is required before a live native journey.

## Offline evidence

Run from the plugin worktree:

```powershell
node --import tsx --test tests/mcp/complete-optional-journeys.test.ts tests/mcp/optional-sky-tools.test.ts tests/mcp/multi-weather-planning.test.ts tests/skills/optional-sky-workflows.test.ts
```

The new combined test registers twenty handlers, exercises all six optional tools while their sources are unadmitted, and retains useful Hyderabad Geminids, ordinary stargazing, astrophotography and comparison results. Its two synthetic forecasts deliberately disagree (10% and 90% cloud). It checks independent attribution, place timezone, astronomy, preparation and zero external transport attempts. Static skill text checks verify the authored fallback guidance. This is controlled handler evidence and authoring coverage; it does not demonstrate host tool discovery, schema validation over HTTP, skill loading or model answer quality. Existing optional MCP tests separately cover HTTP transport.

## Native session requirements

Use the normal Codex host with the exact rebuilt package selected. Preserve the installation identity, manifest version and package hash. The supported marketplace flow is documented in [the native installation path](native-acceptance-path-20261017.md); the previously installed version is dated evidence and must not be assumed to be 1.0.16. Do not edit caches. The prior nested Codex model invocation was rejected by policy; neither the complete-model runner nor a different nested model invocation is an alternative acceptance route.

The current coordinating chat has no NightSky tools. A normal host refresh or fresh chat must expose the package and its actual tools before native acceptance can begin. Complete skill/reference reads, actual arguments/results and whole answers must be retained independently from package or transport checks.

Do not use `prepare-codex-local-fixture.ts --serve` as a live endpoint. Its synthetic geography and original fourteen-tool inventory cannot validate current provider data or the six optional tools. The real configurable runtime is `server/plugin.ts`, built by `npm run build:plugin` and started by `npm run start:plugin`. Its listener uses `HOST` and `PORT` (defaults 127.0.0.1:5000); the package connection must match the selected loopback endpoint.

The authorized operator must supply API discovery mode, existing private geography/weather configuration, explicitly selected weather providers (including seventimer if intended), and optional sky selection via `NIGHTSKY_SKY_PROVIDERS`. Source admission is independently controlled by `NIGHTSKY_SKY_ADMITTED_PROVIDERS`; selecting tools does not authorize provider requests. The sky ledger path must differ from the weather ledger. Preserve existing accounting; never initialize replacement ledgers to obtain fresh allowance. Credentials and quota state must remain outside artifacts. AstronomyAPI production admission remains unresolved. Optional unadmitted sources must report unavailable while ordinary planning remains usable.

## First three acceptance cases

1. Hyderabad outdoor Geminids: request an outdoor outing for the user's chosen December night. Resolve the city and actual selected site separately; retain access/timezone gaps and the chosen shower/date. Keep source civil maximum wording distinct from calculated radiant samples and useful darkness. Future weather may be out of horizon. A city-point result is not verified site access.
2. Hyderabad forecast comparison: use a current supported date and explicit local window. Preserve each source's issue time, valid time, cloud values and missing fields. Keep 7Timer category ranges and three-hour samples distinct. Do not average disagreement or label synthetic values current weather.
3. Hyderabad astrophotography: retain equipment/elevation questions where needed. Use local darkness and target geometry. Catalogue identity alone does not prove visibility; optional external positions are samples. Moon-aware full-window rejection does not prove the entire night unusable. Optional failures remain scoped.

For each case record separate verdicts for package/skill loading, native transport, source accounting and full-answer semantics. Stop after the first answer for review before expanding the matrix. Keep complete source URLs, timezone and unknown conditions visible. An automatic-discovery check is separate from explicitly invoking the skill. These gates remain open until actual native evidence is captured.

## Current supported bounded launcher

`scripts/serve-native-bounded.ts --plan` prints the no-network envelope. The owner approved and the coordinator started one `--serve <new-journal-path>` session with real API mode, existing private configuration/counters, MET/WeatherAPI/OpenWeather and all optional sky sources unadmitted. Maximum eight fixed-endpoint GETs, ten minutes, 1 MiB per response, no failed-request retries; later explicit calls after success consume fresh request slots. No global fetch replacement is used. Journal failures cannot skip listener or quota cleanup. The existing installation is now 1.0.16 and local HTTP inventory confirms 20 tools; owner-provided native answer is reviewed in current results; corrected-launcher rerun and full skill-loading evidence remain pending. See [current results](sky-continuation-results-20261017.md).
